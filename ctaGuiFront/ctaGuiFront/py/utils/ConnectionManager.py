import json
import traceback
import asyncio
from asgiref.wsgi import WsgiToAsgi

from ctaGuiUtils.py.utils import get_time
from ctaGuiUtils.py.utils import is_coroutine
from ctaGuiUtils.py.LogParser import LogParser

from ctaGuiFront.py.utils.AsyncLoops import AsyncLoops
from ctaGuiFront.py.utils.LockManager import LockManager
from ctaGuiFront.py.utils.Housekeeping import Housekeeping
from ctaGuiFront.py.utils.WidgetManager import WidgetManager
from ctaGuiFront.py.utils.WebsocketBase import WebsocketBase
from ctaGuiFront.py.utils.SessionManager import SessionManager

from ctaGuiFront.py.utils.ClockSimInterface import ClockSimInterface

from websockets import ConnectionClosed
from websockets import ConnectionClosedError


# ------------------------------------------------------------------
def extend_app_to_asgi(wsgi_app, websocket_route):

    app = ExtendedWsgiToAsgi(wsgi_app)

    # see: https://asgi.readthedocs.io/en/latest/specs/www.html
    @app.route(websocket_route['server'], protocol='websocket')
    async def websocket_manager_interface(scope, receive, send):
        try:
            log = LogParser(base_config=WebsocketManager.base_config, title=__name__)
        except Exception as e:
            raise e

        try:
            manager = WebsocketManager(ws_send=send)
        except Exception as e:
            log.error([['r', e]])
            raise e

        try:
            while True:
                try:
                    message = await receive()
                except Exception as e:
                    traceback.print_tb(e.__traceback__)
                    raise e

                if message["type"] == "websocket.connect":
                    try:
                        # blocking connect event
                        await send({"type": "websocket.accept"})
                        await manager.send_initial_connect()
                    except Exception as e:
                        log.error([['r', e]])
                        traceback.print_tb(e.__traceback__)

                elif message["type"] == "websocket.receive":
                    text = message.get("text")
                    if text:
                        text = json.loads(text)

                        try:
                            # non-blocking receive events
                            asyncio.ensure_future(manager.receive(data=text))
                        except Exception as e:
                            traceback.print_tb(e.__traceback__)
                            log.error([['r', e]])

                elif message["type"] == "websocket.disconnect":
                    try:
                        # blocking disconnect event
                        await manager.sess_disconnected()
                    except Exception as e:
                        traceback.print_tb(e.__traceback__)
                        log.error([['r', e]])

                    break
                else:
                    raise Exception('unknown message type ', message)

        except Exception as e:
            log.error([['r', e]])
            raise e

    return app


# ------------------------------------------------------------------
class ExtendedWsgiToAsgi(WsgiToAsgi):
    """Extends the WsgiToAsgi wrapper to include an ASGI consumer protocol router
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.protocol_router = {
            'http': {},
            'websocket': {},
        }

        # # print(args[0].__dict__.keys())
        # self.request = args[0]
        # # print(self.request.authenticated_userid)
        return

    async def __call__(self, scope, *args, **kwargs):
        protocol = scope['type']
        path = scope['path']

        try:
            consumer = self.protocol_router[protocol][path]
        except KeyError:
            consumer = None
        if consumer is not None:
            await consumer(scope, *args, **kwargs)
        try:
            if scope['type'] == 'http':
                await super().__call__(scope, *args, **kwargs)
        except Exception as e:
            raise e

    def route(self, rule, *args, **kwargs):
        try:
            protocol = kwargs['protocol']
        except KeyError:
            raise Exception('You must define a protocol type for an ASGI handler')

        def _route(func):
            self.protocol_router[protocol][rule] = func

        return _route


# ------------------------------------------------------------------
class ConnectionManager():
    # ------------------------------------------------------------------
    def spawn(self, func, *args, **kwargs):
        # try:
        #     self.async_loop = asyncio.get_running_loop()
        #     if not (self.async_loop and self.async_loop.is_running()):
        #         raise RuntimeError
        # except RuntimeError:
        #     raise Exception('no running event loop ?!?')
        # self.async_loop.create_task(func())

        return asyncio.ensure_future(func(*args, **kwargs))

    # ------------------------------------------------------------------
    def websocket_data_dump(self, data):
        data = {
            'type': 'websocket.send',
            'text': json.dumps(data),
        }
        return data

    # ------------------------------------------------------------------
    async def emit(self, event_name, data={}, metadata=None):
        async with self.get_lock('server'):
            data_out = {
                'event_name': event_name,
                'sess_id': self.sess_id,
                'n_server_msg': self.n_server_msg,
                'send_time_msec': get_time('msec'),
            }
            self.n_server_msg += 1

        if metadata is not None:
            data_out.update(metadata)
        data_out['data'] = data

        try:
            if self.is_sess_open:
                await self.ws_send(self.websocket_data_dump(data_out))

        except (ConnectionClosed, ConnectionClosedError) as e:
            self.log.warn([
                ['r', ' - connection problems ? '],
                ['c', self.server_id, self.sess_id, ': '],
                ['r', e],
            ])
        except Exception as e:
            raise e

        return

    # ------------------------------------------------------------------
    async def emit_to_queue(self, asy_func=None, event_name=None, data={}, metadata=None):
        if asy_func is None and event_name is None:
            raise Exception(
                'trying to use emit_to_queue without asy_func/event_name', data
            )

        if asy_func is not None:
            data_put = {
                'asy_func': asy_func,
                'data': data,
            }
            if metadata is not None:
                data_put['metadata'] = metadata

            await self.asyncio_queue.put(data_put)

        elif event_name is not None:
            asy_func = self.emit(event_name=event_name, data=data, metadata=metadata)
            data_put = {
                'asy_func': asy_func,
                'data': data,
            }
            await self.asyncio_queue.put(data_put)

        return

    # ------------------------------------------------------------------
    async def receive_queue_loop(self, loop_info):
        """process the received event queue
        
            Parameters
            ----------
            loop_info : dict
                metadata needed to determine when is the loop should continue
        """

        self.log.info([
            ['y', ' - starting '],
            ['b', 'receive_queue_loop'],
            ['y', ' for session: '],
            ['c', self.sess_id],
        ])

        # proccess an item from the queue
        async def await_queue_item():
            queue_item = self.asyncio_queue.get_nowait()

            # verify that the session has initialised, that we have the right sess_id, etc.
            self.verify_sess_event(queue_item['data'])

            # check if this if this is a regular function or a coroutine object/function
            if queue_item is not None:
                if 'asy_func' in queue_item:
                    event_func = queue_item['asy_func']

                    if is_coroutine(event_func):
                        await event_func
                    else:
                        event_func(queue_item['data'])
            return

        # while the queue is to be processed
        while self.get_loop_state(loop_info):
            for _ in range(self.asyncio_queue.qsize()):
                if self.is_valid_session():
                    self.spawn(await_queue_item)

            await asyncio.sleep(self.valid_loop_sleep_sec)

        # attempt to cancel all remaining tasks before finishing
        for _ in range(self.asyncio_queue.qsize()):
            self.spawn(await_queue_item).cancel()

        self.log.info([
            ['r', ' - ending '],
            ['b', 'receive_queue_loop'],
            ['r', ' for session: '],
            ['c', self.sess_id],
        ])

        return

    # ------------------------------------------------------------------
    def verify_sess_event(self, data):
        """verify that an event may be executed
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the asy_func to be executed
        """

        try:
            if not self.has_init_sess:
                raise Exception(
                    'events not coming in order - has not init session...', data
                )

            if isinstance(data, dict):
                if ('sess_id' in data.keys()) and (data['sess_id'] != self.sess_id):
                    raise Exception('mismatch in sess_id...', data)

            if not self.is_valid_session():
                raise Exception('not a valid session', data)

        except Exception as e:
            raise e

        return

    # ------------------------------------------------------------------
    def is_valid_session(self, sess_id=None):
        """check if a session belongs to this server, and has a heartbeat
        
            Parameters
            ----------
            sess_id : int
                the session id to check
        
            Returns
            -------
            bool
                is the session valid
        """

        if not self.has_init_sess:
            return False

        if sess_id is None:
            sess_id = self.sess_id

        sess_ids = self.redis.l_get('ws;server_sess_ids;' + self.server_id)
        if sess_id in sess_ids:
            if self.redis.exists(self.get_heartbeat_name('sess', sess_id)):
                return True

        return False

    # ------------------------------------------------------------------
    async def receive(self, data):
        """receive an event from the client and execute it
        
            Parameters
            ----------
            data : dict
                input data fof the received function
        """

        try:
            event_name = data['event_name']
        except Exception:
            self.log.error([
                ['p', '\n'],
                ['r', '-' * 20, 'event name undefined in input:'],
                ['p', '\n', self.sess_id, ''],
                ['y', data, '\n'],
                ['r', '-' * 100],
            ])
            return
        try:
            event_func = getattr(self, event_name)
        except Exception:
            self.log.error([
                ['p', '\n'],
                ['r', '-' * 20, 'event name undefined as func:'],
                ['p', '', event_name, ''],
                ['r', '-' * 20],
                ['p', '\n', self.sess_id, ''],
                ['y', data, '\n'],
                ['r', '-' * 100],
            ])
            return

        # check that events are received in the expected order, where the
        # initial connection and any logging messages get executed immediately
        # and any other events get put in an ordered queue for execution
        try:
            if event_name in ['client_log']:
                event_func(data)

            elif event_name in ['sess_setup_begin', 'sess_setup_finalised']:
                await event_func(data)

            else:
                # check if this if this is a regular function or a coroutine object/function
                if asyncio.iscoroutine(event_func) or asyncio.iscoroutinefunction(
                        event_func):
                    await self.asyncio_queue.put({
                        'asy_func': event_func(data),
                        'data': data,
                    })
                else:
                    await self.asyncio_queue.put({
                        'asy_func': event_func,
                        'data': data,
                    })

        except Exception as e:
            self.log.error([['r', e]])
            raise e

        return


# ------------------------------------------------------------------
class WebsocketManager(
        WebsocketBase,
        LockManager,
        ConnectionManager,
        SessionManager,
        WidgetManager,
        AsyncLoops,
        Housekeeping,
):
    """WebSocket manager class

       connection life-cycle:
       - client loads web-page and socket is created
       (e.g.,: ws = new WebSocket(window.WEBSOCKET_ROUTE))
       - client sends 'websocket.connect' message
       - server sends 'initial_connect' message with basic metadata, including
       the proposed sess_id. if this is a fresh session, the client registers this sess_id,
       otherwise, it retains its previous sess_id. initialisation has began
       - client sends 'sess_setup_begin' message, including the final sess_id
       - server logs the new sess_id or restores the existing one
       - server starts sending heartbeat_ping messages to the client, and the client
       responds with heartbeat_pong messages (communication delays are teste on both ends)
       - client sends 'sess_setup_finalised' message
       - server sets self.has_init_sess=True, and initialisation is complete
       - while in the initialisation phase, any other message (except
       for 'client_log' and heartbeat ping/posng messages) is put in a queue. the
       queue is only proccessed after initialisation
    """

    # ------------------------------------------------------------------
    def __init__(self, ws_send, *args, **kwargs):

        # after setting up redis, initialise the lock manager
        WebsocketBase.__init__(self, ws_send, args, kwargs)

        # after setting up redis, initialise the lock manager
        LockManager.__init__(self)

        # conditional class "inheritance"
        if self.is_simulation:
            ClockSimInterface(self)

        return
