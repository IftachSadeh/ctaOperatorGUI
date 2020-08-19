# import os
# self.debug_pid = os.getpid()
import gevent
from gevent import sleep
from random import Random
from math import ceil
import traceback
import importlib
try: 
    from gevent.coros import BoundedSemaphore 
except: 
    from gevent.lock import BoundedSemaphore 
from socketio.namespace import BaseNamespace
from socketio.mixins import BroadcastMixin

from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.utils import get_rnd_seed, get_time, get_rnd
from ctaGuiUtils.py.RedisManager import RedisManager
from ctaGuiFront.py.utils.security import USERS

import asyncio
from asgiref.wsgi import WsgiToAsgi
from aioredlock import Aioredlock

from random import Random
import json
rnd_seed = get_rnd_seed()
rnd_gen = Random(rnd_seed)


# ------------------------------------------------------------------
class ExtendedWsgiToAsgi(WsgiToAsgi):
    """Extends the WsgiToAsgi wrapper to include an ASGI consumer protocol router"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.protocol_router = {'http': {}, 'websocket': {},}

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
def extend_app_to_asgi(wsgi_app, websocket_route):

    app = ExtendedWsgiToAsgi(wsgi_app)

    # see: https://asgi.readthedocs.io/en/latest/specs/www.html
    @app.route(websocket_route['server'], protocol='websocket')
    async def hello_websocket(scope, receive, send):
        try:
            log = LogParser(base_config=AsyncSocketManager.base_config, title=__name__)
        except Exception as e:
            raise e
        
        try:
            async_manager = AsyncSocketManager(sync_send=send)
        except Exception as e:
            log.error([['r', e]])
            raise e

        try:
            # async_manager.add_app()

            while True:
                try:
                    message = await receive()
                except Exception as e:
                    traceback.print_tb(e.__traceback__)
                    raise e

                if message["type"] == "websocket.connect":
                    async_manager.set_sess_state(True)

                    try:
                        # blocking connect event
                        await send({"type": "websocket.accept"})
                        await async_manager.send_initial_connect()
                    except Exception as e:
                        log.error([['r', e]])
                        traceback.print_tb(e.__traceback__)
                    
                elif message["type"] == "websocket.receive":
                    text = message.get("text")
                    if text:
                        text = json.loads(text)

                        try:
                            # non-blocking receive events
                            asyncio.ensure_future(async_manager.receive(data=text))
                        except Exception as e:
                            traceback.print_tb(e.__traceback__)
                            log.error([['r', e]])

                elif message["type"] == "websocket.disconnect":
                    try:
                        async_manager.set_sess_state(False)
                        
                        # blocking disconnect event
                        await async_manager.websocket_disconnect()
                    except Exception as e:
                        traceback.print_tb(e.__traceback__)
                        log.error([['r', e]])

                        # async_manager.rm_app() ; async_manager.log.info([['wr', ' - finish loop:', '', async_manager.sess_id, async_manager.n_app()]])

                    break
                else:
                    raise Exception('unknown message type ', message)

        except Exception as e:
            log.error([['r', e]])
            raise e

    return app






# ------------------------------------------------------------------
class AsyncSocketManager:
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
    
    server_id = None
    n_server_sess = 0

    # common dictionaries for all instances of the class (keeping track of all sessions etc.)
    managers = dict()
    widget_inits = dict()

    # ------------------------------------------------------------------
    def __init__(self, sync_send, *args, **kwargs):
        
        if AsyncSocketManager.server_id is None:
            AsyncSocketManager.server_id = (
                'svr_' + str(self.base_config.app_port)
                + '_' + get_rnd(n_digits=6, out_type=str, is_unique_seed=True)
            )

        self.sync_send = sync_send

        self.sess_id = None
        # self.sess_id = str(get_time('msec') + rnd_gen.randint(1000000, (1000000 * 10) -1))
        self.n_server_msg = 0
        self.has_init_sess = False
        self.is_sess_open = False
        self.user_id = ''
        self.user_group = ''
        self.user_group_id = ''
        self.sess_name = ''
        self.log_send_packet = False
        self.basic_widget_sleep_sec = 1
        self.sess_expire = 10
        self.cleanup_sleep = 60
        # self.max_sess_valid_time_sec = 20
        self.valid_loop_sleep_sec = 0.01
        
        # session ping/pong heartbeat
        self.sess_ping = {
            # interval for sending ping/pong events
            'send_interval_msec': 2500,
            # how much delay is considered ok for a slow session
            'max_interval_good_msec': 100,
            # how much delay is considered ok for a disconnected session
            'max_interval_slow_msec': 1000,
            # how much delay before the client socket is forcibly closed
            # and set in a reconnection attempt loop
            'max_interval_bad_msec': 5000,
        }
        # self.sess_ping = {
        #     # interval for sending ping/pong events
        #     'send_interval_msec': 2000,
        #     # how much delay is considered ok for a slow session
        #     'max_interval_good_msec': 2000,
        #     # how much delay is considered ok for a disconnected session
        #     'max_interval_slow_msec': 6000,
        # }
        self.async_loops = []
        self.loop_group_prefix = 'ws;loop;'

        self.asyncio_queue = asyncio.Queue()

        self.log = LogParser(base_config=self.base_config, title=__name__)

        self.allowed_widget_types = self.base_config.allowed_widget_types
        self.redis_port = self.base_config.redis_port
        self.site_type = self.base_config.site_type
        self.allow_panel_sync = self.base_config.allow_panel_sync
        self.is_simulation = self.base_config.is_simulation
        self.is_HMI_dev = self.base_config.is_HMI_dev

        self.redis = RedisManager(
            name=self.__class__.__name__, port=self.redis_port, log=self.log
        )

        # redis lock
        self.redis_lock_retry_max_sec = 10
        redis_lock_delay_min, redis_lock_delay_max = 0.01, 0.1
        redis_lock_count = ceil(self.redis_lock_retry_max_sec / redis_lock_delay_min)
        
        self.redis_lock = Aioredlock(
            redis_connections=[{'host': 'localhost', 'port': self.redis_port}], retry_count=redis_lock_count, retry_delay_min=redis_lock_delay_min, retry_delay_max=redis_lock_delay_max,
        )

        self.inst_data = self.base_config.inst_data

        try:
            SocketDecorator(self)
        except Exception as e:
            raise e

        return

    # ------------------------------------------------------------------
    async def is_redis_locked(self, lock_name):
        return await self.redis_lock.is_locked(lock_name)

    # ------------------------------------------------------------------
    def get_redis_lock(self, lock_name):
        lock = self.redis_lock.lock(lock_name, lock_timeout=self.redis_lock_retry_max_sec,)
        return lock


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
        data_out = {
            'event_name': event_name,
            'sess_id': self.sess_id,
            'n_server_msg': self.n_server_msg,
            'send_time_msec': get_time('msec'),
        }
        if metadata is not None:
            data_out.update(metadata)
        data_out['data'] = data
        # # print(data)
        # print('+'*90)
        # print(event_name)
        # print(data_out)
        # print('-'*140)

        self.n_server_msg += 1

        if self.is_sess_open:
            await self.sync_send(self.websocket_data_dump(data_out))

        return

    # ------------------------------------------------------------------
    async def emit_to_queue(self, asy_func=None, event_name=None, data={}, metadata=None):
        if asy_func is None and event_name is None:
            raise Exception('trying to use emit_to_queue without asy_func/event_name', data)
        
        # if 'sess_id' not in data:
        #     data['sess_id'] = self.sess_id
        
        if asy_func is not None:
            # if 'sess_id' not in data:
            #     data['sess_id'] = self.sess_id
            data_put = {'asy_func':asy_func, 'data': data,}
            if metadata is not None:
                data_put['metadata'] = metadata

            await self.asyncio_queue.put(data_put)
        
        elif event_name is not None:
            # data['event_name'] = event_name
            await self.asyncio_queue.put({'asy_func':self.emit(event_name=event_name, data=data, metadata=metadata), 'data': data,})

        return


    # ------------------------------------------------------------------
    async def receive_queue_loop(self, loop_info):
        """process the received event queue
        
            Parameters
            ----------
            loop_info : dict
                metadata needed to determine when is the loop should continue
        """

        self.log.info([['y', ' - starting '],['b', 'receive_queue_loop'], ['y', ' for session: '], ['c', self.sess_id],])

        # proccess an item from the queue
        async def await_queue_item():
            queue_item = self.asyncio_queue.get_nowait()
            # ------------------------------------------------------------------
            # ------------------------------------------------------------------
            # verufy that the session has initialised, that we have the right sess_id, etc.
            self.verify_sess_event(queue_item['data'])
            # ------------------------------------------------------------------
            # ------------------------------------------------------------------
            # check if this if this is a regular function or a coroutine object/function
            if queue_item is not None:
                if 'asy_func' in queue_item:
                    event_func = queue_item['asy_func']
                    is_coroutine = (
                        asyncio.iscoroutine(event_func)
                        or asyncio.iscoroutinefunction(event_func)
                    )
                    if is_coroutine:
                        await event_func
                    else:
                        event_func(queue_item['data'])
            return

        while self.get_loop_state(loop_info):
            for _ in range(self.asyncio_queue.qsize()):
                if self.is_valid_session():
                    self.spawn(await_queue_item)

            await asyncio.sleep(self.valid_loop_sleep_sec)
            # await asyncio.sleep(1)

        # cancel remaining tasks
        for _ in range(self.asyncio_queue.qsize()):
            self.spawn(await_queue_item).cancel()

        self.log.info([['r', ' - ending '],['b', 'receive_queue_loop'], ['r', ' for session: '], ['c', self.sess_id],])
        
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
                raise Exception('events not coming in order - has not init session...', data)
            
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

        sess_ids = self.redis.l_get('ws;server_sess_ids;'+self.server_id)
        if sess_id in sess_ids:
            if self.redis.exists('ws;sess_heartbeat;' + sess_id):
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
        
        # ------------------------------------------------------------------
        # TODO: uncomment the exception raise ...
        # ------------------------------------------------------------------
        try:
            event_name = data['event_name']
        except Exception:
            self.log.error([['p', '\n'],['r', '-'*20, 'event name undefined in input:'], ['p', '\n', self.sess_id, ''], ['y', data, '\n'], ['r', '-'*100],])
            return
        try:
            event_func = getattr(self, event_name)
        except Exception:
            self.log.error([['p', '\n'],['r', '-'*20, 'event name undefined as func:'], ['p', '', event_name, ''], ['r', '-'*20], ['p', '\n', self.sess_id, ''], ['y', data, '\n'], ['r', '-'*100],])
            return

        try:
            # check that events are received in the expected order, where the
            # initial connection and any logging messages get executed immediately
            # and any other events get put in an ordered queue for execution
            if event_name in ['client_log']:
                event_func(data)
            elif event_name in ['sess_setup_begin', 'sess_setup_finalised']:
                await event_func(data)
            else:

                # check if this if this is a regular function or a coroutine object/function
                if asyncio.iscoroutine(event_func) or asyncio.iscoroutinefunction(event_func):
                    await self.asyncio_queue.put({'asy_func':event_func(data), 'data': data,})
                else:
                    await self.asyncio_queue.put({'asy_func':event_func, 'data': data,})

        except Exception as e:
            self.log.error([['r', e]])
            raise e

        return


    # ------------------------------------------------------------------
    # ------------------------------------------------------------------
    async def test_socket_evt(self, data):
            self.log.info([['c', ' - test_socket_evt:'], ['p', '', self.sess_id, '\n\t\t\t' ], ['g', data]])
    # ------------------------------------------------------------------
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    def client_log(self, data):
        """interface for client logs to be processed by the server

            This function is not awaited, since we need maximal fidelity that
            all messages are proccessed and in order
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the logging event
        """

        if data['log_level'] == 'ERROR':
            self.log.error([['wr', ' - client_log:'], ['p', '', self.sess_id, ''], ['y', data]])

        elif data['log_level'] in ['WARN', 'WARNING']:
            self.log.warn([['b', ' - client_log:'], ['p', '', self.sess_id, '' ], ['y', data]])

        elif data['log_level'] == 'INFO':
            self.log.info([['b', ' - client_log:'], ['p', '', self.sess_id, '' ], ['y', data]])

        else:
            raise Exception('unrecognised logging level from client', self.sess_id, data)

        return

    # ------------------------------------------------------------------
    def set_sess_state(self, state):
        self.is_sess_open = state
        return
    
    # ------------------------------------------------------------------
    async def websocket_disconnect(self):
        """local cleanup for the current server session upon disconnection
        """

        self.log.info([['c', ' - websocket_disconnect '], ['p', self.sess_id]])
        
        try:
            async with await self.get_redis_lock('ws;lock'):
                await self.cleanup_session(sess_id=self.sess_id)

        except Exception as e:
            raise e

        return


    # ------------------------------------------------------------------
    async def send_initial_connect(self):
        """upon any new connection, send the client initialisation data
        """

        # # temporary hack - make sure the lifecycle is understood - this should only happen once...
        # if self.sess_id is not None:
        #     self.log.error([['wr', ' - already connected ?!?!?!?!', self.sess_id]])
        #     raise Exception('already connected ?!?!?', self.sess_id)

        async with await self.get_redis_lock('ws;lock;' + self.server_id):
            self.sess_id = (
                self.server_id + '__ses_'
                +  '{:07d}'.format(AsyncSocketManager.n_server_sess)
            )
            AsyncSocketManager.n_server_sess += 1
            # AsyncSocketManager.n_server_sess += get_rnd(n_digits=4, out_type=int, is_unique_seed=True)

        tel_ids = self.inst_data.get_inst_ids()
        tel_id_to_types = self.inst_data.get_inst_id_to_types()
        categorical_types = self.inst_data.get_categorical_types()

        data = {
            'server_id': self.server_id,
            'sess_id': self.sess_id,
            'sess_ping': self.sess_ping,
            'tel_ids': tel_ids,
            'tel_id_to_types': tel_id_to_types,
            'categorical_types': categorical_types,
            'is_simulation': self.is_simulation,
        }
        await self.emit(event_name='initial_connect', data=data)

        return

    
    # ------------------------------------------------------------------
    async def server_attr_dic_add(self, name, key, value):
        lock_name = 'ws;lock;' + self.server_id
        if not await self.is_redis_locked(lock_name):
            raise Exception('server_attr_dic_add expected to be locked: ', name, key, value, lock_name,)

        attr = getattr(AsyncSocketManager, name)
        attr[key] = value

        return

    # ------------------------------------------------------------------
    async def server_attr_dic_rm(self, name, key):
        lock_name = 'ws;lock;' + self.server_id
        if not await self.is_redis_locked(lock_name):
            raise Exception('server_attr_dic_rm expected to be locked: ', name, key, lock_name,)

        attr = getattr(AsyncSocketManager, name)
        attr.pop(key, None)

        return

    # ------------------------------------------------------------------
    async def get_server_attr(self, name):
        lock_name = 'ws;lock;' + self.server_id
        if not await self.is_redis_locked(lock_name):
            raise Exception('server_attr_dic_rm expected to be locked: ', name, lock_name,)

        attr = getattr(AsyncSocketManager, name)

        return attr

    # ------------------------------------------------------------------
    async def sess_setup_begin(self, data):
        """the replay of the client to the initial_connect event

            set the session-id which is derived by the client upon connecting the socket
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the event
        """

        async with await self.get_redis_lock('ws;lock'):
            is_existing_sess = (self.sess_id != data['sess_id'])

            # ------------------------------------------------------------------
            # for development, its conveniet to reload if the server was restarted, but
            # for deployment, the same session can simply be restored
            if self.is_HMI_dev:
                if is_existing_sess:
                    self.sess_id = data['sess_id']
                    await self.emit(event_name='reload_session')
                    return
            # ------------------------------------------------------------------

            if is_existing_sess:
                self.sess_id = data['sess_id']
                self.log.info([['p', ' - restoring existing session: '], ['c', self.sess_id]])

            # get and validate the user id
            self.user_id = str(data['data']['display_user_id'])
            if self.user_id == 'None':
                self.user_id = ''
            else:
                # sanity check
                hashed_pw = USERS.get(self.user_id)
                if not hashed_pw:
                    raise Exception(
                        'got unidentified user_name in sess_setup_begin ...', data
                    )

            # get the user group and set some names
            self.user_group = str(data['data']['display_user_group'])
            self.user_group_id = self.user_group + '_' + self.user_id
            self.sess_name = self.user_group_id + '_' + self.sess_id

            self.log.info([['b', ' - websocket.connected '], ['p', self.sess_id], ['y', '', self.user_id, '/', self.user_group],])

            # override the global logging variable with a
            # name corresponding to the current session ids
            self.log = LogParser(
                base_config=self.base_config,
                title=(str(self.user_id) + '/' + str(self.sess_id) + '/' + __name__),
            )

            # keep track of all instances for broadcasting events (cleaned up
            # as part of cleanup_session())
            async with await self.get_redis_lock('ws;lock;' + self.server_id):
                await self.server_attr_dic_add(name='managers', key=self.sess_id, value=self)

            # register the user_name if needed (cleanup as part of cleanup_server())
            all_user_ids = self.redis.l_get('ws;all_user_ids')
            if self.user_id not in all_user_ids:
                self.redis.r_push(name='ws;all_user_ids', data=self.user_id)

            # register the sess_id for the heartbeat monitor
            # (expires on its own, inless renewed by server_sess_heartbeat_loop() )
            self.redis.set(
                name='ws;server_heartbeat;' + self.server_id, expire=(int(self.sess_expire) * 10),
            )
            self.redis.set(
                name='ws;user_heartbeat;' + self.user_id, expire=(int(self.sess_expire) * 10),
            )
            self.redis.set(
                name='ws;sess_heartbeat;' + self.sess_id, expire=(int(self.sess_expire) * 10),
            )

            # registed the server id in the global server list
            # (cleanup explicitly done as part of cleanup_server())
            all_server_ids = self.redis.l_get('ws;all_server_ids')
            if self.server_id not in all_server_ids:
                self.redis.r_push(name='ws;all_server_ids', data=self.server_id)

            # registed the session id in the global session list, and in the server
            # session list (cleanup explicitly done as part of cleanup_session(),
            # also if loosing heartbeat as part of cleanup_server())
            all_sess_ids = self.redis.l_get('ws;all_sess_ids')
            if self.sess_id not in all_sess_ids:
                self.redis.r_push(name='ws;all_sess_ids', data=self.sess_id)

            server_sess_ids = self.redis.l_get('ws;server_sess_ids;'+self.server_id)
            if self.sess_id not in server_sess_ids:
                self.redis.r_push(
                    name='ws;server_sess_ids;'+self.server_id, data=self.sess_id
                )

            # list of all sessions for this user
            all_user_sess_ids = self.redis.l_get('ws;user_sess_ids;' + self.user_id)
            if self.sess_id not in all_user_sess_ids:
                self.redis.r_push(
                    name='ws;user_sess_ids;' + self.user_id, data=self.sess_id
                )

            # synchronisation groups for users (cleaned up as part of cleanup_server(), when
            # no more sessions remain alive for this user)
            if not self.redis.h_exists(name='ws;sync_groups', key=self.user_id):
                self.redis.h_set(
                    name='ws;sync_groups', key=self.user_id, data=[]
                )

            # start up (if not already running) loops for this server / user / session
            await self.init_common_loops()

            # function which may be overloaded, setting up individual
            # properties for a given session-type
            if not is_existing_sess:
                self.on_join_session_()

            self.init_user_sync_loops()

        return



    # ------------------------------------------------------------------
    async def sess_setup_finalised(self, data):
        """as the final step within the lock, flag the session as initialised
        """
        self.has_init_sess = True
        return



    # ------------------------------------------------------------------
    def on_join_session_(self):
        """placeholder for overloaded method, to be run as part of on_join_session
        """
        return

    # ------------------------------------------------------------------
    def on_leave_session_(self):
        """placeholder for overloaded method, to be run as part of on_leave_session
        """
        return

    # ------------------------------------------------------------------
    # is this still needed ?!?!?!?!?!?!?!?!
    # is this still needed ?!?!?!?!?!?!?!?!
    # ------------------------------------------------------------------
    def init_user_sync_loops(self):
        self.log.warn([['g', ' - need init_user_sync_loops ... ?']])
        return

    

    # ------------------------------------------------------------------
    async def cleanup_session(self, sess_id):
        """clean up a session

           as this is not necessarily self.sess_id, we do not assume that we
           have the identical self.user_id or self.server_id (as another user
           # potentially using a different server, might have initiated this function)
        """

        if sess_id is None:
            return

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_session expected to be locked ?!?')

        self.log.info([['c', ' - cleanup-session '], ['p', sess_id], ['c', ' ...']])

        # remove the heartbeat for the session
        self.redis.delete('ws;sess_heartbeat;' + sess_id)
        
        # remove the the session from the global list
        self.redis.l_rem(name='ws;all_sess_ids', data=sess_id)
        
        # remove the the session from the server list
        all_server_ids = self.redis.l_get('ws;all_server_ids')
        for server_id in all_server_ids:
            self.redis.l_rem(name='ws;server_sess_ids;'+server_id, data=sess_id)

        # remove the the session from the user list (go over all users until
        # the right one is found)
        all_user_ids = self.redis.l_get('ws;all_user_ids')
        for user_id in all_user_ids:
            self.redis.l_rem(name='ws;user_sess_ids;' + user_id, data=sess_id)

        await self.set_loop_state(
            state=False,
            group='ws;sess;' + sess_id,
        )

        # remove the session from the manager list if it
        # exists (if this is the current server)
        async with await self.get_redis_lock('ws;lock;' + self.server_id):
            await self.server_attr_dic_rm(name='managers', key=self.sess_id)

        # clean up all widgets for this session
        sess_widget_ids = self.redis.l_get('ws;sess_widget_ids;' + sess_id)
        for widget_id in sess_widget_ids:
            await self.cleanup_widget(widget_ids=widget_id)

        self.on_leave_session_()



        return


    # ------------------------------------------------------------------
    async def cleanup_loops(self):
        """clean up zombie loops
        """

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_widget expected to be locked ?!?')

        all_loop_groups = self.redis.h_get_all('ws;all_loop_groups')

        contexts = []
        for context in list(all_loop_groups.values()):
            if context not in contexts:
                contexts += [context]

        has_context = dict([
            (c, self.redis.exists(c)) for c in contexts
        ])

        for group, context in all_loop_groups.items():
            if not has_context[context]:
                await self.set_loop_state(state=False, group=group)
                self.redis.h_del(name='ws;all_loop_groups', key=group)

        return
    
    # ------------------------------------------------------------------
    async def cleanup_widget(self, widget_ids):
        """clean up a list of input widget ids
        """

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_widget expected to be locked ?!?')

        if not isinstance(widget_ids, list):
            widget_ids = [widget_ids]

        self.log.info([['c', ' - cleanup-widget_ids '], ['p', widget_ids]])

        all_user_ids = self.redis.l_get('ws;all_user_ids')

        sync_groups = self.redis.h_get(
            name='ws;sync_groups', key=self.user_id, default_val=[]
        )
        # print(' - sync_groups\n',sync_groups)

        for widget_id in widget_ids:
            widget_info = self.redis.h_get(name='ws;widget_infos', key=widget_id)
            self.redis.delete('ws;sess_widget_ids;' + widget_info['sess_id'])

            self.redis.h_del(name='ws;widget_infos', key=widget_id)
            
            for user_id in all_user_ids:
                self.redis.l_rem(name='ws;user_widget_ids;' + user_id, data=widget_id)
            
            async with await self.get_redis_lock('ws;lock;' + self.server_id):
                await self.server_attr_dic_rm(name='widget_inits', key=widget_id)

            await self.set_loop_state(
                state=False,
                group='ws;widget_id;' + widget_id,
            )

            # 
            for sync_group in sync_groups:
                for sync_states in sync_group['sync_states']:
                    rm_elements = []
                    for sync_type_now in sync_states:
                        if sync_type_now[0] == widget_id:
                            rm_elements.append(sync_type_now)
                    for rm_element in rm_elements:
                        sync_states.remove(rm_element)

        # print(' + sync_groups\n',sync_groups)
        self.redis.h_set(
            name='ws;sync_groups', key=self.user_id, data=sync_groups
        )

        await self.update_sync_group()

        return
    
    # ------------------------------------------------------------------
    async def cleanup_server(self, server_id):
        """clean up servers and the corresponding sessions
        """

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_server expected to be locked ?!?')
        
        # cleanup expired sessions (for this particular server)
        sess_ids = self.redis.l_get('ws;server_sess_ids;' + server_id)
        for sess_id in sess_ids:
            if not self.redis.exists('ws;sess_heartbeat;' + sess_id):
                await self.cleanup_session(sess_id=sess_id)

        # after the cleanup for dead sessions, check if
        # the heartbeat is still there for the server (if any session at all is alive)
        if not self.redis.exists('ws;server_heartbeat;' + server_id):
            self.log.info([['c', ' - cleanup-server '], ['p', server_id], ['c', ' ...']])

            await self.set_loop_state(
                state=False,
                group='ws;server;' + server_id,
            )
            self.redis.l_rem(name='ws;all_server_ids', data=server_id)

        return


    # ------------------------------------------------------------------
    async def cleanup_users(self):
        """clean up all user lists in case this use has no more sessions
           alive (sessions might belong to any server)
        """
        
        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_users expected to be locked ?!?')

        all_user_ids = self.redis.l_get('ws;all_user_ids')
        for user_id in all_user_ids:
            user_sess_ids = self.redis.l_get('ws;user_sess_ids;' + user_id)
            if len(user_sess_ids) == 0:
                self.log.info([['c', ' - cleanup-user '], ['p', user_id], ['c', ' ...']])

                self.redis.l_rem(name='ws;all_user_ids', data=user_id)
                self.redis.h_del(name='ws;sync_groups', key=user_id)
        
                self.redis.h_del(name='ws;active_widget', key=user_id)
                self.redis.delete(name='ws;user_widget_ids;' + user_id)


        return

    






































    # ------------------------------------------------------------------
    def init_asy_func_loops(self):
        """define the default set of asy_funcs to run in the background
        """
        
        loops = []

        # session heartbeat (shared between all sessions for this server)
        loops += [
            {
                'id': 'server_sess_heartbeat_loop',
                'func': self.server_sess_heartbeat_loop,
                'group': 'ws;server;' + self.server_id,
                'context': 'ws;server_heartbeat;' + self.server_id,
            },
        ]
        
        # session cleanup (shared between all sessions for this server)
        loops += [
            {
                'id': 'cleanup_loop',
                'func': self.cleanup_loop,
                'group': 'ws;server;' + self.server_id,
                'context': 'ws;server_heartbeat;' + self.server_id,
            },
        ]

        # # 
        # loops += [
        #     {
        #         'id': None,
        #         'group': 'shared_asy_func',
        #         'tag': 'get_pubsub_loop',
        #         'func': self.get_pubsub_loop,
        #     },
        # ]

        # 
        # loops += [
        #     {
        #         'id': None,
        #         'group': 'shared_asy_func',
        #         'tag': 'pubsub_socket_evt_widgets',
        #         'func': self.pubsub_socket_evt_widgets,
        #     },
        # ]

        # client ping/pong heartbeat for a particular session
        loops += [
            {
                'id': 'client_sess_heartbeat_loop',
                'func': self.client_sess_heartbeat_loop,
                'group': 'ws;sess;' + self.sess_id,
                'context': 'ws;sess_heartbeat;' + self.sess_id,
            },
        ]
        
        # received event execution (one instance for each session)
        loops += [
            {
                'id': 'receive_queue_loop',
                'func': self.receive_queue_loop,
                'group': 'ws;sess;' + self.sess_id,
                'context': 'ws;sess_heartbeat;' + self.sess_id,
            },
        ]
        
        for asy_func in loops:
            self.add_async_loop(loop_info=asy_func)

        return

    # ------------------------------------------------------------------
    def add_async_loop(self, loop_info):
        has_asy_func = any([
            (loop_info['group'] == c['group'] and loop_info['id'] == c['id'])
            for c in self.async_loops
        ])
        if not has_asy_func:
            self.async_loops += [loop_info]

        return

    # ------------------------------------------------------------------
    async def init_common_loops(self):
        """initialise shared maintenance asy_funcs
        """

        self.init_asy_func_loops()

        for loop_info in self.async_loops:
            if not self.get_loop_state(loop_info):
                await self.set_loop_state(state=True, loop_info=loop_info)
                self.spawn(loop_info['func'], loop_info=loop_info)

        return

    # ------------------------------------------------------------------
    def get_loop_state(self, loop_info):
        state = self.redis.h_exists(name=self.loop_group_prefix + loop_info['group'], key=loop_info['id'],)
        return state

    # ------------------------------------------------------------------
    async def set_loop_state(self, state, loop_info=None, group=None):
        async with await self.get_redis_lock('ws;lock;' + self.server_id):
            if state:
                if loop_info is None:
                    raise Exception(
                        'unsupported option for set_loop_state', state, loop_info, group
                    )

                # validate that this group/id loop has not already been registered
                has_loop = self.redis.h_exists(
                    name=self.loop_group_prefix + loop_info['group'], key=loop_info['id'],
                )
                if has_loop:
                    raise Exception('trying to set existing loop', loop_info)
                
                # register this group/id loop
                self.redis.h_set(name=self.loop_group_prefix + loop_info['group'], key=loop_info['id'],)

                # register the context (respective heartbeat) for this group, in
                # order to facilitate cleanup as part of cleanup_loops()
                self.redis.h_set(
                    name='ws;all_loop_groups', key=loop_info['group'], data=loop_info['context']
                )
            
            else:
                if int(loop_info is None) + int(group is None) != 1:
                    raise Exception(
                        'unsupported option for set_loop_state', state, loop_info, group
                    )
                
                if group is not None:
                    self.redis.delete(name=self.loop_group_prefix + group)
                    self.redis.h_del(name='ws;all_loop_groups', key=group)
                else:
                    self.redis.h_del(name=self.loop_group_prefix + loop_info['group'], key=loop_info['id'],)
                
                # if group is not None:
                #     self.log.info([['r', ' - clear loop '], ['c', group], ['r', ' ...'],])
                # else:
                #     self.log.info([['r', ' - clear loop '], ['c', loop_info['group']], ['r', ' / '], ['c', loop_info['id']], ['r', ' ...'],])
        return















































    # ------------------------------------------------------------------
    async def server_sess_heartbeat_loop(self, loop_info):
        """renew session heartbeat tokens

            run in asy_func so long as there are active sessions
            renewes all sessions which belong to this server
            (registered in AsyncSocketManager.all_sess_ids)

            sessiosns which are not meaintained by any running server will expire, and
            thier cleanup will be handled by self.cleanup_loop()
        
            Parameters
            ----------
            loop_info : dict
                metadata needed to determine when is the loop should continue
        """

        self.log.info([['y', ' - starting '],['b', 'server_sess_heartbeat_loop'], ['y', ' by: '], ['c', self.sess_id], ['y', ' for server: '], ['c', self.server_id],])

        sleep_sec = min(1, max(ceil(self.sess_expire * 0.1), 10))
        sess_expire = ceil(max(self.sess_expire, sleep_sec * 5))
        server_expire = ceil(sess_expire * 2)
        user_expire = ceil(sess_expire * 1.5)

        while self.get_loop_state(loop_info):
            async with await self.get_redis_lock('ws;lock'):
                sess_ids = self.redis.l_get('ws;server_sess_ids;'+self.server_id)
                for sess_id in sess_ids:
                    if not self.redis.exists('ws;sess_heartbeat;' + sess_id):
                        continue

                    # heartbeat for any session renews the server
                    self.redis.expire(
                        name='ws;server_heartbeat;' + self.server_id, expire=server_expire
                    )

                    # heartbeat for any session renews the user
                    self.redis.expire(
                        name='ws;user_heartbeat;' + self.user_id, expire=user_expire
                    )
                    
                    # heartbeat for this session renews itself
                    self.redis.expire(
                        name='ws;sess_heartbeat;' + sess_id, expire=sess_expire
                    )

            await asyncio.sleep(sleep_sec)

        async with await self.get_redis_lock('ws;lock'):
            await self.cleanup_server(server_id=self.server_id)

        self.log.info([['r', ' - ending '],['b', 'server_sess_heartbeat_loop'], ['r', ' for server: '], ['c', self.server_id],])

        return


    
    # ------------------------------------------------------------------
    async def client_sess_heartbeat_loop(self, loop_info):
        """send ping/pong heartbeat message to client to verify the connection
        
            Parameters
            ----------
            loop_info : dict
                metadata needed to determine when is the loop should continue
        """

        self.log.info([['y', ' - starting '],['b', 'client_sess_heartbeat_loop'], ['y', ' for session: '], ['c', self.sess_id],])

        # the interval to sleep between heartbeats
        send_interval_msec = self.sess_ping['send_interval_msec']
        
        # the maximal interval achieved in practice between heartbeats,
        # to test for server overloads
        max_ping_interval_msec = (
            send_interval_msec + self.sess_ping['max_interval_good_msec']
        )

        interval_now_msec = 0
        sleep_sec = send_interval_msec * 1e-3
        
        while self.get_loop_state(loop_info):
            data = {
                'ping_interval_msec': interval_now_msec,
            }
            self.sess_ping_time = get_time('msec')
            await self.emit(event_name='heartbeat_ping', data=data)

            # update the interval between pings
            interval_now_msec = get_time('msec')
            await asyncio.sleep(sleep_sec)
            interval_now_msec = get_time('msec') - interval_now_msec

            # for now we only produce a log warning in case of these kinds of problems
            if interval_now_msec > max_ping_interval_msec:
                self.log.warn([['y', ' - high server load for '], ['r', self.sess_id], ['y', ' --> ',],['o', interval_now_msec],])

        self.log.info([['r', ' - ending '],['b', 'client_sess_heartbeat_loop'], ['r', ' for session: '], ['c', self.sess_id],])

        return

    # ------------------------------------------------------------------
    async def heartbeat_pong(self, data):
        """server check for bad connections (maybe not needed...?!?)
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the event
        """

        ping_delay = data['send_time_msec'] - self.sess_ping_time

        if ping_delay > self.sess_ping['max_interval_good_msec']:
            is_slow = (
                ping_delay < self.sess_ping['max_interval_slow_msec']
            )

            log_func = self.log.warn if is_slow else self.log.error
            log_txt = 'unstable connection for ' if is_slow else 'not connected to '
            log_func([['y', ' - ', log_txt], ['r', self.sess_id, '\n'], ['g', self.sess_ping_time, ' --> ',],['o', data],])
        
        return

    

    # ------------------------------------------------------------------
    async def cleanup_loop(self, loop_info):

        self.log.info([['y', ' - starting '],['b', 'cleanup_loop'], ['y', ' by: '], ['c', self.sess_id], ['y', ' for server: '], ['c', self.server_id],])

        self.cleanup_sleep = 5
        self.cleanup_sleep = 2

        while self.get_loop_state(loop_info):
            await asyncio.sleep(self.cleanup_sleep)

            # run the cleanup for this server
            async with await self.get_redis_lock('ws;lock'):
                await self.cleanup_server(server_id=self.server_id)

            # run the cleanup for possible zombie sessions
            async with await self.get_redis_lock('ws;lock'):
                all_sess_ids = self.redis.l_get('ws;all_sess_ids')
                for sess_id in all_sess_ids:
                    if not self.redis.exists('ws;sess_heartbeat;' + sess_id):
                        await self.cleanup_session(sess_id=sess_id)

            # run the cleanup for possible zombie widgets
            async with await self.get_redis_lock('ws;lock'):
                widget_infos = self.redis.h_get_all('ws;widget_infos')
                for widget_id, widget_info in widget_infos.items():
                    sess_id = widget_info['sess_id']
                    if not self.redis.exists('ws;sess_heartbeat;' + sess_id):
                        # explicitly take care of the widget
                        await self.cleanup_widget(widget_ids=widget_id)
                        # for good measure, make sure the session is also gone
                        await self.cleanup_session(sess_id=sess_id)

            # run the cleanup for possible zombie servers
            async with await self.get_redis_lock('ws;lock'):
                all_server_ids = self.redis.l_get('ws;all_server_ids')
                for server_id in all_server_ids:
                    if not self.redis.exists('ws;server_heartbeat;' + server_id):
                        await self.cleanup_server(server_id=server_id)
            
            # run the cleanup for possible zombie loops
            async with await self.get_redis_lock('ws;lock'):
                await self.cleanup_loops()

            # run the cleanup for users who have no active sessions
            async with await self.get_redis_lock('ws;lock'):
                await self.cleanup_users()

            # sanity checks
            async with await self.get_redis_lock('ws;lock'):
                sess_ids = self.redis.l_get('ws;server_sess_ids;' + self.server_id)

                async with await self.get_redis_lock('ws;lock;' + self.server_id):
                    managers = await self.get_server_attr('managers')
                    sess_ids_check = [
                        s for s in managers.keys() if s not in sess_ids
                    ]
                    if len(sess_ids_check) > 0:
                        raise Exception('mismatch between sess_ids ?', sess_ids, managers.keys())

                # after the cleanup for this particular session, check if
                # the heartbeat is still there for the server / user (if any session at all is alive)
                if not self.redis.exists('ws;user_heartbeat;' + self.user_id):
                    user_sess_ids = self.redis.l_get('ws;user_sess_ids;' + self.user_id)
                    if len(user_sess_ids) > 0:
                        raise Exception('no heartbeat, but sessions remaining ?!?!', self.user_id, user_sess_ids,)

                if not self.redis.exists('ws;server_heartbeat;' + self.server_id):
                    server_sess_ids = self.redis.l_get(
                        'ws;server_sess_ids;' + self.server_id
                    )
                    if len(server_sess_ids) > 0:
                        raise Exception('no heartbeat, but sessions remaining ?!?!', self.server_id, server_sess_ids,)


            check_all_ws_keys = False
            # check_all_ws_keys = True
            if check_all_ws_keys:
                async with await self.get_redis_lock('ws;lock'):
                    cursor, scans = 0, []
                    while True:
                        # await asyncio.sleep(0.001)
                        cursor, scan = self.redis.scan(cursor=cursor, count=500, match='ws;*')
                        if len(scan) > 0:
                            scans += scan
                        if cursor == 0:
                            break
                    print(' - scans:\n', scans, '\n')


        self.log.info([['r', ' - ending '],['b', 'cleanup_loop'], ['r', ' by: '], ['c', self.sess_id], ['r', ' for server: '], ['c', self.server_id],])

        return











    # ------------------------------------------------------------------
    def check_panel_sync(self):
        """prevent panle sync based on a global setting & user-name
        """

        allow = False
        if self.allow_panel_sync:
            allow = (self.user_id != 'guest')

        return allow



    # ------------------------------------------------------------------
    async def widget(self, data_in):
        """general communication with a widget (will
           import and instantiate a class if needed)
        """

        # n_sess_try = 0
        # while self.sess_id is None:
        #     n_sess_try += 1
        #     if n_sess_try >= 20:
        #         self.log.warning([['rb', ' - ignoring zombie session - on_widget('],
        #                           ['yb', data_in], ['rb', ') !!!!!!!!']])
        #         return
        #     sleep(0.5)

        # basic widget info
        data = data_in['data']
        widget_id = data['widget_id']

        # dynamically load the module for the requested widget
        # (no need for a 'from dynamicLoadWidget import dynWidg_0' statement)
        # has_widget_id = self.redis.h_exists(name='ws;widget_infos', key=widget_id)

        async with await self.get_redis_lock('ws;lock'):
            async with await self.get_redis_lock('ws;lock;' + self.server_id):
                widget_inits = await self.get_server_attr(name='widget_inits')

            has_widget_id = widget_id in widget_inits
            if not has_widget_id:
                await self.init_widget(data_in)

        # call the method named args[1] with optional arguments args[2],
        # equivalent e.g., to widget.method_name(optionalArgs)
        if 'method_name' in data:
            async with await self.get_redis_lock('ws;lock;' + self.server_id):
                widget_inits = await self.get_server_attr(name='widget_inits')
            async with await self.get_redis_lock('ws;lock;' + self.sess_id):
                method_func = getattr(widget_inits[widget_id], data['method_name'])
                if 'method_arg' in data:
                    await method_func(data['method_arg'])
                else:
                    await method_func()

        return
    
    
    # ------------------------------------------------------------------
    async def init_widget(self, data_in):
        """importing the class for the widget and registring the id
        """

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('init_widget expected to be locked ?!?')

        data = data_in['data']
        widget_id = data['widget_id']
        widget_source = 'widgets.' + data['widget_source']
        widget_name = data['widget_name']
        n_sync_group = data['n_sync_group'] if 'n_sync_group' in data else 0
        sync_type = data['sync_type'] if 'sync_type' in data else 0

        if not self.check_panel_sync():
            n_sync_group = -1

        # the following is equivalent e.g., to:
        #   from dynamicLoadWidget import dynWidg_0
        #   widget = dynWidg_0(widget_id=widget_id, __old_SocketManager__=self)
        # widget_module = __import__(widget_source, globals=globals())
        widget_module = importlib.import_module(
            widget_source,
            package=None,
        )
        widget_cls = getattr(widget_module, widget_name)

        async with await self.get_redis_lock('ws;lock;' + self.server_id):
            widget_inits = await self.get_server_attr(name='widget_inits')
            widget_inits[widget_id] = widget_cls(widget_id=widget_id, socket_manager=self)

        # make sure the requested widget has been registered as a legitimate class
        is_not_synced = (widget_name in self.allowed_widget_types['not_synced'])
        is_synced = widget_name in self.allowed_widget_types['synced']
        if not (is_not_synced or is_synced):
            raise Exception(
                ' - widget_name =', widget_name, ''
                + 'has not been registered in allowed_widget_types'
            )

        # if this is not a synced panel, it has no sync group or icon
        if is_not_synced:
            n_sync_group = -1
            n_icon = -1
        
        # if it is a synced panel, derive the icon as the next one after all
        # existing panels
        if is_synced:
            n_icon = self.allowed_widget_types['synced'].index(widget_name)
            while True:
                user_widget_ids = self.redis.l_get('ws;user_widget_ids;' + self.user_id)
                if len(user_widget_ids) == 0:
                    break

                widget_infos = self.redis.h_m_get(
                    name='ws;widget_infos', key=user_widget_ids, filter=True
                )
                n_icons = [x['n_icon'] for x in widget_infos]

                if n_icon in n_icons:
                    n_icon += len(self.allowed_widget_types['synced'])
                else:
                    break

        # bookkeeping and future reference of the class we just loaded
        # ------------------------------------------------------------------
        widget_now = dict()
        widget_now['n_icon'] = n_icon
        widget_now['user_id'] = self.user_id
        widget_now['sess_id'] = self.sess_id
        widget_now['widget_name'] = widget_name
        widget_now['widget_state'] = dict()

        # register the new widget
        self.redis.h_set(
            name='ws;widget_infos', key=widget_id, data=widget_now
        )
        self.redis.r_push(
            name='ws;user_widget_ids;' + self.user_id, data=widget_id
        )
        self.redis.r_push(
            name='ws;sess_widget_ids;' + self.sess_id, data=widget_id
        )

        # sync group initialization
        # ------------------------------------------------------------------
        n_sync_group = min(max(n_sync_group, -1), 0)

        if sync_type > 2 or sync_type < 0:
            self.log.warning([[
                'rb', ' - sync_type = ', sync_type, ' too large - on_widget('
            ], ['yb', data], ['rb', ') !!!!!!!!']])
            sync_type = min(max(sync_type, 0), 2)

        if n_sync_group == 0:
            sync_groups = self.redis.h_get(
                name='ws;sync_groups', key=self.user_id, default_val=[]
            )

            # ------------------------------------------------------------------
            # add new empty sync group if needed
            # ------------------------------------------------------------------
            group_indices = []
            if len(sync_groups) > 0:
                group_indices = [
                    i for i, x in enumerate(sync_groups) if x['id'] == 'grp_0'
                ]
            if len(group_indices) > 0:
                group_index = group_indices[0]
            else:
                group_index = len(sync_groups)

                # the sync_group['id'] must correspond to the pattern defined
                # by the client for new groups (e.g., 'grp_0') !!!
                sync_group = dict()
                sync_group['id'] = 'grp_0'
                sync_group['title'] = 'Group 0'
                sync_group['sync_states'] = [[], [], []]
                sync_group['sync_types'] = dict()

                sync_groups.append(sync_group)

            # add the new widget to the requested sync group and sync state
            icon_id = 'icn_' + get_rnd(out_type=str)
            sync_groups[group_index]['sync_states'][sync_type].append([
                widget_id, icon_id
            ])

            self.redis.h_set(
                name='ws;sync_groups',
                key=self.user_id,
                data=sync_groups,
            )

        if n_sync_group != -1:
            await self.update_sync_group()

        return


    # ------------------------------------------------------------------
    async def update_sync_group(self):
        if not await self.is_redis_locked('ws;lock'):
            raise Exception('update_sync_group expected to be locked ?!?')

        async with await self.get_redis_lock('ws;lock;' + self.server_id):
            widget_inits = await self.get_server_attr(name='widget_inits')

            widget_ids = []
            widget_infos = self.redis.h_get_all(name='ws;widget_infos')
            for widget_id, widget_now in widget_infos.items():
                if widget_id in widget_inits:
                    if widget_now['n_icon'] == -1:
                        widget_ids.append(widget_id)

            for widget_id in widget_ids:
                getattr(widget_inits[widget_id], 'update_sync_groups')()

        return



    # ------------------------------------------------------------------
    async def send_widget_init_data(self, opt_in=None):
        """initial dataset and send to client
        """
        
        widget = opt_in['widget']
        data_func = (
            opt_in['data_func'] if 'data_func' in opt_in else lambda: dict()
        )

        metadata = {
            'widget_type': widget.widget_name,
            'widget_id': widget.widget_id,
            'n_icon': widget.n_icon,
        }
        data = data_func()

        await self.emit_to_queue(event_name='init_data', data=data, metadata=metadata)

        return

    # ------------------------------------------------------------------
    async def add_widget_loop(self, opt_in=None):
        
        # =============================================================
        # =============================================================
        # =============================================================
        # =============================================================
        # cleanup of widget spawns
        # shared widget spawn ?!?
        # =============================================================
        # =============================================================
        # =============================================================
        # =============================================================

        widget = opt_in['widget']

        if 'event_name' not in opt_in.keys():
            opt_in['event_name'] = 'update_data'

        loop_func = (
            opt_in['loop_func'] if 'loop_func' in opt_in else self.basic_widget_loop
        )
        loop_id = (
            opt_in['loop_id'] if 'loop_id' in opt_in else str(get_time('msec') + rnd_gen.randint(0, 100000))
        )


        if opt_in['loop_group'] == 'widget_id':
            loop_group = 'ws;widget_id;' + widget.widget_id
        elif opt_in['loop_group'] == 'widget_name':
            loop_group = 'ws;widget_name;' + widget.widget_name
        else:
            raise Exception('unknown loop_group for: ', opt_in)

        loop_info = {
            'id': loop_id,
            'func': loop_func,
            'group': loop_group,
            'context': 'ws;sess_heartbeat;' + self.sess_id,
        }

        if not self.get_loop_state(loop_info):
            await self.set_loop_state(state=True, loop_info=loop_info)
            self.spawn(loop_info['func'], loop_info=loop_info, opt_in=opt_in)

        return 


        if 0:


            if 'is_group_asy_func' not in opt_in:
                opt_in['is_group_asy_func'] = True

            widget = opt_in['widget']

            asy_func_group = (
                opt_in['asy_func_group'] if 'asy_func_group' in opt_in else 'update_data'
            )
            opt_in['asy_func_group'] = asy_func_group

            asy_func_func = opt_in['asy_func_func'] if 'asy_func_func' in opt_in else None
            if asy_func_func is None and asy_func_group == 'update_data':
                asy_func_func = self.widget_asy_func_func

            is_group_asy_func = opt_in['is_group_asy_func']

            with widget.lock:
                if is_group_asy_func:
                    if widget.widget_group not in widget.widget_group_sess:
                        widget.widget_group_sess[widget.widget_group] = []

                    widget.widget_group_sess[widget.widget_group].append(
                        widget.socket_manager.sess_id
                    )

                    if self.get_asy_func_id(widget.widget_group, asy_func_group) == -1:
                        with __old_SocketManager__.lock:
                            opt_in['asy_func_id'] = self.set_asy_func_state(
                                widget.widget_group, asy_func_group, True
                            )

                            gevent.spawn(asy_func_func, opt_in=opt_in)
                else:
                    if self.get_asy_func_id(widget.widget_id, asy_func_group) == -1:
                        with __old_SocketManager__.lock:
                            opt_in['asy_func_id'] = self.set_asy_func_state(
                                widget.widget_id, asy_func_group, True
                            )

                            gevent.spawn(asy_func_func, opt_in=opt_in)

            return

    
    # ------------------------------------------------------------------
    async def basic_widget_loop(self, loop_info, opt_in):

        self.log.info([['y', ' - starting '],['b', 'basic_widget_loop'], ['y', ' for widget_id: '], ['c', loop_info['group']], ['b', ' for event_name '], ['c', opt_in['event_name']],])

        widget = opt_in['widget']
        event_name = opt_in['event_name']
        sleep_sec = (
            opt_in['sleep_sec'] if 'sleep_sec' in opt_in else self.basic_widget_sleep_sec
        )

        # if 'func_args' in opt_in.keys():
        #     def get_data():
        #         return opt_in['data_func'](opt_in['func_args'])
        # else:
        #     def get_data():
        #         return opt_in['data_func']()

        sess_widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)
        
        metadata = {
            'widget_type': widget.widget_name,
            'widget_id': widget.widget_id,
            'sess_widget_ids': sess_widget_ids,
        }

        while self.get_loop_state(loop_info):
            async with await self.get_redis_lock('ws;lock'):
                data = opt_in['data_func']()
                
                await self.emit_to_queue(event_name=event_name, data=data, metadata=metadata,)

            await asyncio.sleep(sleep_sec)

        self.log.info([['r', ' - ending '],['b', 'basic_widget_loop'], ['r', ' for widget_id: '], ['c', loop_info['group']], ['r', ' for event_name '], ['c', opt_in['event_name']],])

        return











    # ------------------------------------------------------------------
    async def set_active_widget(self, data_in):
        data = data_in['data']
        active_widget = self.redis.h_get(
            name='ws;active_widget', key=self.user_id, default_val=None
        )

        if active_widget != data['widget_id']:
            self.redis.h_set(
                name='ws;active_widget', key=self.user_id, data=data['widget_id']
            )

        return

    # ------------------------------------------------------------------
    async def back_from_offline(self, data):
        """upon reconnection to an existing session
        """

        self.log.warn([['r', ' - back_from_offline not implemented ', '!'*90]])

        # if self.sess_id is None:
        #     return

        # # print 'on_back_from_offline.................'
        # # first validate that eg the server hasnt been restarted while this session has been offline
        # sess_ids = self.redis.l_get('ws;all_sess_ids')
        # server_id = __old_SocketManager__.server_id if self.sess_id in sess_ids else ''

        # self.emit('reconnect', {'server_id': server_id})

        # # now run any widget specific functions
        # with __old_SocketManager__.lock:
        #     widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)
        #     for widget_id in widget_ids:
        #         if widget_id in __old_SocketManager__.widget_inits:
        #             getattr(__old_SocketManager__.widget_inits[widget_id], 'back_from_offline')()

        return



















































































































# ------------------------------------------------------------------
# ------------------------------------------------------------------
# ------------------------------------------------------------------
# ------------------------------------------------------------------
class __old_SocketManager__(BaseNamespace, BroadcastMixin):
    # server_id = None

    # # common dictionaries for all instances of
    # # the class (keeping track of all sessions etc.)
    # sess_endpoints = dict()
    # asy_func_sigs = dict()
    # widget_inits = dict()

    # lock = BoundedSemaphore(1)

    # ------------------------------------------------------------------
    # individual parameters for a particular session
    # ------------------------------------------------------------------
    def __init__(self, *args, **kwargs):
        super(__old_SocketManager__, self).__init__(*args, **kwargs)

        # self.log = LogParser(base_config=self.base_config, title=__name__)

        # self.allowed_widget_types = self.base_config.allowed_widget_types
        # self.redis_port = self.base_config.redis_port
        # self.site_type = self.base_config.site_type
        # self.allow_panel_sync = self.base_config.allow_panel_sync
        # self.is_simulation = self.base_config.is_simulation

        # self.sess_id = None
        # self.user_id = ''
        # self.user_group = ''
        # self.user_group_id = ''
        # self.sess_name = ''
        # self.log_send_packet = False
        # self.sess_expire = 10
        # self.cleanup_sleep = 60

        # self.redis = RedisManager(
        #     name=self.__class__.__name__, port=self.redis_port, log=self.log
        # )

        # self.inst_data = self.base_config.inst_data

        # ------------------------------------------------------------------
        # add some extra methods, as needed
        # ------------------------------------------------------------------
        # SocketDecorator(self)

        # # ------------------------------------------------------------------
        # # cleanup the database of old sessions upon restart
        # # ------------------------------------------------------------------
        # with __old_SocketManager__.lock:
        #     if __old_SocketManager__.server_id is None:
        #         __old_SocketManager__.server_id = 'server_' + get_rnd(n_digits=10, out_type=str)

                # sess_ids_now = self.redis.l_get('ws;all_sess_ids')
                # for sess_id in sess_ids_now:
                #   self.cleanup_session(sess_id)
                # self.redis.delete('ws;all_user_ids')
                # self.redis.delete('ws;widget_infos')

        return

    # # ------------------------------------------------------------------
    # # upon any new connection
    # # ------------------------------------------------------------------
    # def recv_connect(self):
    #     server_id = __old_SocketManager__.server_id
    #     tel_ids = self.inst_data.get_inst_ids()
    #     tel_id_to_types = self.inst_data.get_inst_id_to_types()
    #     categorical_types = self.inst_data.get_categorical_types()

    #     self.emit(
    #         'initial_connect', {
    #             'server_id': server_id,
    #             'tel_ids': tel_ids,
    #             'tel_id_to_types': tel_id_to_types,
    #             'categorical_types': categorical_types,
    #         }
    #     )
    #     return

    # # ------------------------------------------------------------------
    # # upon reconnection to an existing session
    # # ------------------------------------------------------------------
    # def on_back_from_offline(self):
    #     if self.sess_id is None:
    #         return

    #     # print 'on_back_from_offline.................'
    #     # first validate that eg the server hasnt been restarted while this session has been offline
    #     sess_ids = self.redis.l_get('ws;all_sess_ids')
    #     server_id = __old_SocketManager__.server_id if self.sess_id in sess_ids else ''

    #     self.emit('reconnect', {'server_id': server_id})

    #     # now run any widget specific functions
    #     with __old_SocketManager__.lock:
    #         widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)
    #         for widget_id in widget_ids:
    #             if widget_id in __old_SocketManager__.widget_inits:
    #                 getattr(__old_SocketManager__.widget_inits[widget_id], 'back_from_offline')()

    #     return

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def on_set_online_state(self, data):
    #     # print 'set_online_state',data

    #     return

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def on_join_session(self, ses_id_now):
    #     self.user_id = self.request.authenticated_userid
    #     if not self.user_id:
    #         self.user_id = ''
    #     for princ in self.request.effective_principals:
    #         if princ.startswith('group:'):
    #             self.user_group = princ[len('group:'):]

    #     self.sess_id = str(ses_id_now)
    #     self.user_group_id = self.user_group + '_' + self.user_id
    #     self.sess_name = self.user_group_id + '_' + self.sess_id

    #     # override the global logging variable with a
    #     # name corresponding to the current session ids
    #     self.log = LogParser(
    #         base_config=self.base_config,
    #         title=(str(self.user_id) + '/' + str(self.sess_id) + '/' + __name__),
    #     )

    #     self.log.info([
    #         ['b', ' -- new session: '],
    #         ['g', self.sess_id, '', self.ns_name],
    #         ['b', ' --'],
    #     ])
    #     self.log.debug([
    #         ['b', ' - session details: '],
    #         ['y', __old_SocketManager__.server_id, ''],
    #         ['p', self.user_group_id, ''],
    #         ['y', self.user_id, ''],
    #         ['p', self.user_group_id, ''],
    #         ['y', self.sess_id, ''],
    #         ['p', self.sess_name, ''],
    #         ['y', self.ns_name, ''],
    #     ])

    #     with __old_SocketManager__.lock:
    #         all_user_ids = self.redis.l_get('ws;all_user_ids')
    #         if self.user_id not in all_user_ids:
    #             self.redis.r_push(name='ws;all_user_ids', data=self.user_id)

    #         # ------------------------------------------------------------------
    #         # all session ids in one list (heartbeat should be first to
    #         # avoid cleanup racing conditions!)
    #         # ------------------------------------------------------------------
    #         self.redis.set(
    #             name='sess_heartbeat;' + self.sess_id, expire=(int(self.sess_expire) * 2)
    #         )
    #         self.redis.r_push(name='ws;all_sess_ids', data=self.sess_id)

    #         # ------------------------------------------------------------------
    #         # the socket endpoint type registry for this session
    #         # ------------------------------------------------------------------
    #         __old_SocketManager__.sess_endpoints[self.sess_id] = self.ns_name

    #         # ------------------------------------------------------------------
    #         #
    #         # ------------------------------------------------------------------
    #         if not self.redis.h_exists(name='ws;sync_groups', key=self.user_id):
    #             self.redis.h_set(
    #                 name='ws;sync_groups', key=self.user_id, data=[]
    #             )

    #         # ------------------------------------------------------------------
    #         # list of all sessions for this user
    #         # ------------------------------------------------------------------
    #         self.redis.r_push(name='ws;user_sess_ids;' + self.user_id, data=self.sess_id)

    #     # ------------------------------------------------------------------
    #     # initiate the asy_funcs which does periodic cleanup, heartbeat managment etc.
    #     # ------------------------------------------------------------------
    #     with __old_SocketManager__.lock:
    #         asy_funcs = [
    #             {
    #                 'id': -1,
    #                 'group': 'shared_asy_func',
    #                 'tag': 'sess_heartbeat',
    #                 'func': self.sess_heartbeat,
    #             },
    #             {
    #                 'id': -1,
    #                 'group': 'shared_asy_func',
    #                 'tag': 'cleanup',
    #                 'func': self.cleanup,
    #             },
    #             {
    #                 'id': -1,
    #                 'group': 'shared_asy_func',
    #                 'tag': 'pubsub_socket_evt_widgets',
    #                 'func': self.pubsub_socket_evt_widgets,
    #             },
    #         ]

    #         for loop_info in asy_funcs:
    #             if self.is_valid_asy_func(loop_info):
    #                 loop_info['id'] = self.set_asy_func_state(
    #                     loop_info['group'], loop_info['tag'], True
    #                 )
    #                 gevent.spawn(loop_info['func'], loop_info)

    #     # ------------------------------------------------------------------
    #     # transmit the initial data to the client
    #     # ------------------------------------------------------------------
    #     join_session_data = {
    #         'session_props': {
    #             'sess_id': str(self.sess_id),
    #             'user_id': str(self.user_id),
    #             'is_simulation': self.is_simulation,
    #         },
    #     }

    #     self.socket_evt_session(event_name='join_session_data', data=join_session_data)

    #     # ------------------------------------------------------------------
    #     # function which may be overloaded, setting up individual
    #     # properties for a given session-type
    #     # ------------------------------------------------------------------
    #     self.on_join_session_()

    #     # ------------------------------------------------------------------
    #     #
    #     # ------------------------------------------------------------------
    #     self.init_user_sync_loops()

    #    return

    # # ------------------------------------------------------------------
    # # general communication with a widget (will import and instantiate a class if needed)
    # # ------------------------------------------------------------------
    # def on_widget(self, data):
    #     n_sess_try = 0
    #     while self.sess_id is None:
    #         n_sess_try += 1
    #         if n_sess_try >= 20:
    #             self.log.warning([['rb', ' - ignoring zombie session - on_widget('],
    #                               ['yb', data], ['rb', ') !!!!!!!!']])
    #             return
    #         sleep(0.5)

    #     # basic widget info
    #     # ------------------------------------------------------------------
    #     widget_id = data['widget_id']
    #     widget_source = 'widgets.' + data['widget_source']
    #     widget_name = data['widget_name']
    #     n_sync_group = data['n_sync_group'] if 'n_sync_group' in data else 0
    #     sync_type = data['sync_type'] if 'sync_type' in data else 0

    #     if not self.check_panel_sync():
    #         n_sync_group = -1

    #     # first make sure the requested widget has been registered as a legitimate class
    #     is_not_synced = (widget_name in self.allowed_widget_types['not_synced'])
    #     is_synced = widget_name in self.allowed_widget_types['synced']
    #     if not is_not_synced and not is_synced:
    #         self.log.critical([
    #             ['wr', ' - widget_name =', widget_name, ''],
    #             ['wr', 'has not been registered in allowed_widget_types ?!?!'],
    #             ['wr', ' --> Will terminate!'],
    #         ])
    #         raise Exception()

    #         return

    #     # ------------------------------------------------------------------
    #     # dynamically load the module for the requested widget
    #     # (no need for a 'from dynamicLoadWidget import dynWidg_0' statement)
    #     # ------------------------------------------------------------------
    #     with __old_SocketManager__.lock:
    #         has_widget_id = self.redis.h_exists(name='ws;widget_infos', key=widget_id)

    #     if not has_widget_id:
    #         # the following is equivalent e.g., to:
    #         #   from dynamicLoadWidget import dynWidg_0
    #         #   widget = dynWidg_0(widget_id=widget_id, __old_SocketManager__=self)
    #         # widget_module = __import__(widget_source, globals=globals())
    #         widget_module = importlib.import_module(
    #             widget_source,
    #             package=None,
    #         )

    #         with __old_SocketManager__.lock:
    #             __old_SocketManager__.widget_inits[widget_id] = getattr(
    #                 widget_module, widget_name
    #             )(widget_id=widget_id, socket_manager=self)

    #         with __old_SocketManager__.lock:
    #             if is_not_synced:
    #                 n_sync_group = -1
    #                 n_icon = -1
    #             else:
    #                 n_icon = self.allowed_widget_types['synced'].index(widget_name)
    #                 while True:
    #                     widget_ids = self.redis.l_get('ws;user_widget_ids;' + self.user_id)
    #                     if len(widget_ids) == 0:
    #                         break

    #                     widget_infos = self.redis.h_m_get(
    #                         name='ws;widget_infos', key=widget_ids, filter=True
    #                     )
    #                     n_icons = [x['n_icon'] for x in widget_infos]

    #                     if n_icon in n_icons:
    #                         n_icon += len(self.allowed_widget_types['synced'])
    #                     else:
    #                         break

    #             # bookkeeping and future reference of the class we just loaded
    #             # ------------------------------------------------------------------
    #             widget_now = dict()
    #             widget_now['n_icon'] = n_icon
    #             widget_now['user_id'] = self.user_id
    #             widget_now['sess_id'] = self.sess_id
    #             widget_now['widget_name'] = widget_name
    #             widget_now['widget_state'] = dict()

    #             # register the new widget
    #             self.redis.h_set(
    #                 name='ws;widget_infos', key=widget_id, data=widget_now
    #             )
    #             self.redis.r_push(name='ws;user_widget_ids;' + self.user_id, data=widget_id)
    #             self.redis.r_push(name='ws;sess_widget_ids;' + self.sess_id, data=widget_id)

    #             # sync group initialization
    #             # ------------------------------------------------------------------
    #             n_sync_group = min(max(n_sync_group, -1), 0)

    #             if sync_type > 2 or sync_type < 0:
    #                 self.log.warning([[
    #                     'rb', ' - sync_type = ', sync_type, ' too large - on_widget('
    #                 ], ['yb', data], ['rb', ') !!!!!!!!']])
    #                 sync_type = min(max(sync_type, 0), 2)

    #             if n_sync_group == 0:
    #                 sync_groups = self.redis.h_get(
    #                     name='ws;sync_groups', key=self.user_id, default_val=[]
    #                 )

    #                 # ------------------------------------------------------------------
    #                 # add new empty sync group if needed
    #                 # ------------------------------------------------------------------
    #                 group_indices = []
    #                 if len(sync_groups) > 0:
    #                     group_indices = [
    #                         i for i, x in enumerate(sync_groups) if x['id'] == 'grp_0'
    #                     ]
    #                 if len(group_indices) > 0:
    #                     group_index = group_indices[0]
    #                 else:
    #                     group_index = len(sync_groups)

    #                     # the sync_group['id'] must correspond to the pattern defined by the client
    #                     # for new groups (e.g., 'grp_0') !!!
    #                     sync_group = dict()
    #                     sync_group['id'] = 'grp_0'
    #                     sync_group['title'] = 'Group 0'
    #                     sync_group['sync_states'] = [[], [], []]
    #                     sync_group['sync_types'] = dict()

    #                     sync_groups.append(sync_group)

    #                 # add the new widget to the requested sync group and sync state
    #                 icon_id = 'icn_' + get_rnd(out_type=str)
    #                 sync_groups[group_index]['sync_states'][sync_type].append([
    #                     widget_id, icon_id
    #                 ])

    #                 self.redis.h_set(
    #                     name='ws;sync_groups',
    #                     key=self.user_id,
    #                     data=sync_groups,
    #                 )

    #         if n_sync_group != -1:
    #             self.update_sync_group()

    #     # ------------------------------------------------------------------
    #     # call the method named args[1] with optional arguments args[2], equivalent e.g., to:
    #     #   widget.method_name(optionalArgs)
    #     # ------------------------------------------------------------------
    #     if 'method_name' in data and widget_id in __old_SocketManager__.widget_inits:
    #         widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)
    #         if 'method_arg' in data:
    #             getattr(__old_SocketManager__.widget_inits[widget_id], data['method_name'])(
    #                 data['method_arg']
    #             )
    #         else:
    #             getattr(__old_SocketManager__.widget_inits[widget_id], data['method_name'])()

    #     return

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def init_user_sync_loops(self):
    #     return

    # # ------------------------------------------------------------------
    # # prevent panle sync based on a global setting & user-name
    # # ------------------------------------------------------------------
    # def check_panel_sync(self):
    #     allow = False
    #     if self.allow_panel_sync:
    #         allow = (self.user_id != 'guest')

    #     return allow

    # # ------------------------------------------------------------------
    # def update_sync_group(self):
    #     widget_ids = []
    #     with __old_SocketManager__.lock:
    #         widget_infos = self.redis.h_get_all(name='ws;widget_infos')
    #         for widget_id, widget_now in widget_infos.items():
    #             if widget_now['n_icon'] == -1 and widget_id in __old_SocketManager__.widget_inits:
    #                 widget_ids.append(widget_id)

    #     for widget_id in widget_ids:
    #         getattr(__old_SocketManager__.widget_inits[widget_id], 'update_sync_groups')()

    #     return

    # ------------------------------------------------------------------
    def on_sync_state_send(self, data_in):
        if not self.check_panel_sync():
            return
        if 'widget_id' not in data_in:
            return
        if not self.redis.h_exists(name='ws;active_widget', key=self.user_id):
            return
        all_sync_ids = []
        with __old_SocketManager__.lock:
            if self.redis.h_get(name='ws;active_widget',
                                key=self.user_id) != data_in['widget_id']:
                return

            sync_groups = self.redis.h_get(
                name='ws;sync_groups', key=self.user_id, default_val=[]
            )

            for sync_group in sync_groups:
                states_0 = [i[0] for i in sync_group['sync_states'][0]]
                states_1 = [i[0] for i in sync_group['sync_states'][1]]
                states_2 = [i[0] for i in sync_group['sync_states'][2]]

                get_states = states_0 + states_2
                do_send = (
                    data_in['widget_id'] in states_0 or data_in['widget_id'] in states_1
                )
                if do_send:
                    sync_group['sync_types'][data_in['type']] = data_in['data']

                    for id_now in get_states:
                        if (id_now != data_in['widget_id']
                                and id_now not in all_sync_ids):
                            all_sync_ids.append(id_now)

            self.redis.h_set(
                name='ws;sync_groups', key=self.user_id, data=sync_groups
            )
        data = {
            'widget_id': data_in['widget_id'],
            'type': data_in['type'],
            'data': data_in['data']
        }
        self.socket_event_widgets(
            event_name='get_sync_state', data=data, widget_ids=all_sync_ids
        )

        return

    # # ------------------------------------------------------------------
    # def on_set_active_widget(self, data):
    #     active_widget = self.redis.h_get(
    #         name='ws;active_widget', key=self.user_id, default_val=None
    #     )

    #     if active_widget != data['widget_id']:
    #         self.redis.h_set(
    #             name='ws;active_widget', key=self.user_id, data=data['widget_id']
    #         )

    #     return

    # # ------------------------------------------------------------------
    # # placeholder for overloaded method, to be run as part of on_leave_session
    # # ------------------------------------------------------------------
    # def on_leave_session_(self):
    #     return

    # # ------------------------------------------------------------------
    # # initial dataset and send to client
    # # ------------------------------------------------------------------
    # def send_widget_init_data(self, opt_in=None):
    #     widget = opt_in['widget']
    #     data_func = (opt_in['data_func'] if 'data_func' in opt_in else lambda: dict())
    #     asy_func_group = (
    #         opt_in['asy_func_group'] if 'asy_func_group' in opt_in else 'init_data'
    #     )

    #     with widget.lock:
    #         emit_data = {
    #             'widget_type': widget.widget_name,
    #             'event_name': asy_func_group,
    #             'n_icon': widget.n_icon,
    #             'data': data_func()
    #         }

    #         widget.log.info([['y', ' - sending - ('],
    #                          ['b', widget.widget_name, asy_func_group], ['y', ','],
    #                          ['g', self.sess_id, '/', widget.widget_id], ['y', ')']])

    #         # print('widget.widget_id',widget.widget_id, asy_func_group, emit_data)
    #         self.socket_evt_session(
    #             widget_id=widget.widget_id, event_name=asy_func_group, data=emit_data
    #         )

    #     return

    # # ------------------------------------------------------------------
    # def add_widget_loop(self, opt_in=None):
    #     if 'is_group_asy_func' not in opt_in:
    #         opt_in['is_group_asy_func'] = True

    #     widget = opt_in['widget']

    #     asy_func_group = opt_in['asy_func_group'
    #                           ] if 'asy_func_group' in opt_in else 'update_data'
    #     opt_in['asy_func_group'] = asy_func_group

    #     asy_func_func = opt_in['asy_func_func'] if 'asy_func_func' in opt_in else None
    #     if asy_func_func is None and asy_func_group == 'update_data':
    #         asy_func_func = self.widget_asy_func_func

    #     is_group_asy_func = opt_in['is_group_asy_func']

    #     with widget.lock:
    #         if is_group_asy_func:
    #             if widget.widget_group not in widget.widget_group_sess:
    #                 widget.widget_group_sess[widget.widget_group] = []

    #             widget.widget_group_sess[widget.widget_group].append(
    #                 widget.socket_manager.sess_id
    #             )

    #             if self.get_asy_func_id(widget.widget_group, asy_func_group) == -1:
    #                 with __old_SocketManager__.lock:
    #                     opt_in['asy_func_id'] = self.set_asy_func_state(
    #                         widget.widget_group, asy_func_group, True
    #                     )

    #                     gevent.spawn(asy_func_func, opt_in=opt_in)
    #         else:
    #             if self.get_asy_func_id(widget.widget_id, asy_func_group) == -1:
    #                 with __old_SocketManager__.lock:
    #                     opt_in['asy_func_id'] = self.set_asy_func_state(
    #                         widget.widget_id, asy_func_group, True
    #                     )

    #                     gevent.spawn(asy_func_func, opt_in=opt_in)

    #     return










    # ------------------------------------------------------------------
    def widget_asy_func_func(self, opt_in=None):
        widget = opt_in['widget']
        asy_func_id = opt_in['asy_func_id']
        asy_func_group = opt_in['asy_func_group']
        data_func = opt_in['data_func']
        sleep_sec = opt_in['sleep_sec'] if 'sleep_sec' in opt_in else 5
        is_group_asy_func = opt_in['is_group_asy_func']

        emit_data = {'widget_type': widget.widget_name, 'event_name': asy_func_group}

        sleep(sleep_sec)

        if is_group_asy_func:
            while (asy_func_id == self.get_asy_func_id(widget.widget_group, asy_func_group)):
                with widget.lock:
                    sess_ids = widget.widget_group_sess[widget.widget_group]
                    emit_data['data'] = data_func()

                    self.socket_event_widgets(
                        event_name=asy_func_group, data=emit_data, sess_ids=sess_ids
                    )

                    if len(widget.widget_group_sess[widget.widget_group]) == 0:
                        with self.lock:
                            self.clear_asy_func_group(widget.widget_group)
                            widget.widget_group_sess.pop(widget.widget_group, None)
                            break

                sleep(sleep_sec)

        else:
            while (asy_func_id == self.get_asy_func_id(widget.widget_id, asy_func_group)):
                with widget.lock:
                    sess_ids = [widget.socket_manager.sess_id]
                    emit_data['data'] = data_func()

                    self.socket_event_widgets(
                        event_name=asy_func_group, data=emit_data, sess_ids=sess_ids
                    )

                sleep(sleep_sec)

        return

    # ------------------------------------------------------------------
    def pubsub_socket_evt_widgets(self, loop_info):
        self.log.info([['y', ' - starting shared_asy_func('],
                       ['g', 'pubsub_socket_evt_widgets'], ['y', ')']])

        while self.redis.set_pubsub('socket_event_widgets') is None:
            self.log.info([['y', ' - setting up PubSub - '],
                           ['b', 'socket_event_widgets'], ['y', ' ...']])
            sleep(0.1)

        while self.is_valid_asy_func(loop_info):
            sleep(0.1)

            msg = self.redis.get_pubsub('socket_event_widgets')
            if msg is None:
                continue

            data = msg['data']['data']
            event_name = msg['data']['event_name']
            sess_ids = msg['data']['sess_ids']
            widget_ids = msg['data']['widget_ids']

            with __old_SocketManager__.lock:
                if sess_ids is None:
                    sess_ids = self.redis.l_get('ws;all_sess_ids')

                if self.log_send_packet:
                    self.log.info([[
                        'b', 'start ' + event_name + '  --> ' + lts(sess_ids)
                    ]])
                    self.log.info([[
                        'b', 'start ' + event_name + '  --> ' + '[' +
                        (',').join(sess_ids) + ']'
                    ]])

                user_sess_ids = self.redis.l_get('ws;user_sess_ids;' + self.user_id)
                sess_ids = [
                    x for x in sess_ids
                    if (x in self.socket.server.sockets and x in user_sess_ids)
                ]

                for sess_id in sess_ids:
                    ids = self.redis.l_get('ws;sess_widget_ids;' + sess_id)
                    if widget_ids is None:
                        data['sess_widget_ids'] = ids
                    else:
                        data['sess_widget_ids'] = [i for i in ids if i in widget_ids]

                    data['emit_time'] = get_time('msec')

                    pkt = dict(
                        type='event',
                        name=event_name,
                        args=data,
                        endpoint=__old_SocketManager__.sess_endpoints[sess_id]
                    )
                    self.socket.server.sockets[sess_id].send_packet(pkt)

            if self.log_send_packet:
                self.log.info(['r', 'end of send ' + event_name])

        self.log.info([['y', ' - ending shared_asy_func('],
                       ['g', 'pubsub_socket_evt_widgets'], ['y', ')']])

        return

    # ------------------------------------------------------------------
    # emit an event to the current session, or to a list of sessions
    # ------------------------------------------------------------------
    def socket_event_widgets(
        self, event_name='', data={}, sess_ids=None, widget_ids=None
    ):
        message = {
            'event_name': event_name,
            'data': data,
            'sess_ids': sess_ids,
            'widget_ids': widget_ids
        }

        self.redis.publish(channel='socket_event_widgets', message=message)

        return

    # ------------------------------------------------------------------
    def socket_evt_session(self, widget_id='', event_name=None, data=None):
        data = {} if data is None else data
        data['widget_id'] = widget_id

        event_name = data['event_name'] if event_name is None else event_name
        data['event_name'] = event_name

        with __old_SocketManager__.lock:
            if self.sess_id in self.socket.server.sockets:
                data['emit_time'] = get_time('msec')

                pkt = dict(
                    type='event',
                    name=event_name,
                    args=data,
                    endpoint=__old_SocketManager__.sess_endpoints[self.sess_id]
                )
                self.socket.server.sockets[self.sess_id].send_packet(pkt)

        return

    # # ------------------------------------------------------------------
    # # bookkeeping of asy_funcs and asy_func-signal cleanup
    # # make sure the function which calls this has secured the thred-lock (__old_SocketManager__.lock)
    # # ------------------------------------------------------------------
    # def set_asy_func_state(self, asy_func_group, asy_func_tag, state):
    #     if state:
    #         if asy_func_group not in __old_SocketManager__.asy_func_sigs:
    #             __old_SocketManager__.asy_func_sigs[asy_func_group] = []

    #         asy_func_id_now = get_rnd(n_digits=15, out_type=int)

    #         for n_ele_now in range(len(__old_SocketManager__.asy_func_sigs[asy_func_group])):
    #             if __old_SocketManager__.asy_func_sigs[asy_func_group][n_ele_now][0] == asy_func_tag:
    #                 __old_SocketManager__.asy_func_sigs[asy_func_group][n_ele_now][1] = asy_func_id_now
    #                 return asy_func_id_now

    #         __old_SocketManager__.asy_func_sigs[asy_func_group].append([asy_func_tag, asy_func_id_now])

    #         return asy_func_id_now
    #     else:
    #         for n_ele_now in range(len(__old_SocketManager__.asy_func_sigs[asy_func_group])):
    #             if __old_SocketManager__.asy_func_sigs[asy_func_group][n_ele_now][0] == asy_func_tag:
    #                 __old_SocketManager__.asy_func_sigs[asy_func_group][n_ele_now][1] = -1

    #         return -1

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def get_asy_func_id(self, asy_func_group, asy_func_tag):
    #     if asy_func_group in __old_SocketManager__.asy_func_sigs:
    #         for ele_now in __old_SocketManager__.asy_func_sigs[asy_func_group]:
    #             if ele_now[0] == asy_func_tag:
    #                 return ele_now[1]

    #     return -1

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def is_valid_asy_func(self, loop_info):
    #     asy_func_id = loop_info['id']
    #     asy_func_group = loop_info['group']
    #     asy_func_tag = loop_info['tag']

    #     is_valid = (asy_func_id == self.get_asy_func_id(asy_func_group, asy_func_tag))
    #     return is_valid

    # # ------------------------------------------------------------------
    # # clean unneeded asy_funcs, assuming we are already in a asy_func
    # # lock, for safe modification of __old_SocketManager__.asy_func_sigs
    # # ------------------------------------------------------------------
    # def clear_asy_func_group(self, asy_func_group):
    #     if asy_func_group in __old_SocketManager__.asy_func_sigs:
    #         __old_SocketManager__.asy_func_sigs.pop(asy_func_group, None)

    #         self.log.info([['r', ' - clear_asy_func_group(' + str(asy_func_group) + ') ...']])

    #     return

    # # ------------------------------------------------------------------
    # # for development - a refresh-all event
    # # ------------------------------------------------------------------
    # def on_refreshAll(self, has_lock=False):
    #     def doRefresh():
    #         sess_ids = self.redis.l_get('ws;all_sess_ids')
    #         sess_ids = [x for x in sess_ids if x in self.socket.server.sockets]

    #         for sess_id in sess_ids:
    #             data = {'emit_time': get_time('msec')}

    #             pkt = dict(type='event', name='refreshAll', args=data,
    #                        endpoint=__old_SocketManager__.sess_endpoints[sess_id])
    #             self.socket.server.sockets[sess_id].send_packet(pkt)

    #         return

    #     if has_lock:
    #         doRefresh()
    #     else:
    #         with __old_SocketManager__.lock:
    #             doRefresh()

    #     return

    # ------------------------------------------------------------------
    # disconnection may be received even if not explicitly emmitted by
    # the user leaving the session (e.g., internet connection loss or
    # server freeze), therefore call on_leave_session() explicitly
    # ------------------------------------------------------------------
    def recv_disconnect(self):
        self.log.debug([
            ['r', ' - Connection to '],
            ['p', self.sess_name],
            ['r', ' terminated...'],
        ])

        sess_ids = self.redis.l_get('ws;all_sess_ids')
        if (self.sess_name != '') and (self.sess_id in sess_ids):
            self.on_leave_session()

        self.disconnect(silent=True)
        return

    # # ------------------------------------------------------------------
    # # on leaving the session
    # # ------------------------------------------------------------------
    # def on_leave_session(self):
    #     with __old_SocketManager__.lock:
    #         sess_ids_now = self.redis.l_get('ws;user_sess_ids;' + self.user_id)
    #         self.log.info([
    #             ['b', ' - leaving session '],
    #             ['y', self.sess_name + ' , ' + self.user_id],
    #             ['b', ' where all Ids('],
    #             ['g', str(len(sess_ids_now))],
    #             ['b', ') = ['],
    #             ['p', (',').join(sess_ids_now)],
    #             ['b', ']'],
    #         ])

    #         # remove the widgets which belong to this session
    #         widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)
    #         sync_groups = self.redis.h_get(
    #             name='ws;sync_groups', key=self.user_id, default_val=[]
    #         )

    #         for widget_id in widget_ids:
    #             self.redis.h_del(name='ws;widget_infos', key=widget_id)

    #             for sync_group in sync_groups:
    #                 for sync_states in sync_group['sync_states']:
    #                     rm_elements = []
    #                     for sync_type_now in sync_states:
    #                         if sync_type_now[0] == widget_id:
    #                             rm_elements.append(sync_type_now)
    #                     for rm_element in rm_elements:
    #                         sync_states.remove(rm_element)

    #             self.clear_asy_func_group(widget_id)

    #         self.redis.h_set(
    #             name='ws;sync_groups', key=self.user_id, data=sync_groups
    #         )

    #         # ------------------------------------------------------------------
    #         # remove this session from the general registry
    #         # ------------------------------------------------------------------
    #         self.cleanup_session(self.sess_id)

    #         # ------------------------------------------------------------------
    #         # cleanup possible asy_funcs belonging to this specific session
    #         # ------------------------------------------------------------------
    #         self.clear_asy_func_group(self.sess_name)

    #     self.update_sync_group()

    #     self.on_leave_session_()

    #     return

    # # ------------------------------------------------------------------
    # # placeholder for overloaded method, to be run as part of on_join_session
    # # ------------------------------------------------------------------
    # def on_join_session_(self):
    #     return

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def cleanup_session(self, sess_id=None):
    #     if sess_id is None:
    #         return
    #     self.log.info([
    #         ['b', ' - cleanup_session sessionId(', __old_SocketManager__.server_id, ') '],
    #         ['p', sess_id],
    #     ])

    #     all_user_ids = self.redis.l_get('ws;all_user_ids')
    #     widget_ids = self.redis.l_get('ws;sess_widget_ids;' + sess_id)

    #     for user_id in all_user_ids:
    #         self.redis.l_rem(name='ws;user_sess_ids;' + user_id, data=sess_id)

    #     for widget_id in widget_ids:
    #         self.log.info([[
    #             'b', ' - cleanup_session widget_id (', __old_SocketManager__.server_id, ') '
    #         ], ['p', widget_id]])

    #         self.redis.h_del(name='ws;widget_infos', key=widget_id)
    #         if widget_id in __old_SocketManager__.widget_inits:
    #             __old_SocketManager__.widget_inits.pop(widget_id, None)
    #         for user_id in all_user_ids:
    #             self.redis.l_rem(name='ws;user_widget_ids;' + user_id, data=widget_id)

    #     self.redis.delete('ws;sess_widget_ids;' + sess_id)
    #     self.redis.delete('sess_heartbeat;' + sess_id)
    #     self.redis.l_rem(name='ws;all_sess_ids', data=sess_id)

    #     if sess_id in __old_SocketManager__.sess_endpoints:
    #         __old_SocketManager__.sess_endpoints.pop(sess_id, None)

    #     return

    # # ------------------------------------------------------------------
    # # renew session heartbeat token (run in asy_func) for all active sessions
    # # ------------------------------------------------------------------
    # def sess_heartbeat(self, loop_info):
    #     self.log.info([['y', ' - starting shared_asy_func('], ['g', 'sess_heartbeat'],
    #                    ['y', ') - ', __old_SocketManager__.server_id]])

    #     sleep_sec = max(ceil(self.sess_expire * 0.1), 10)
    #     sess_expire = int(max(self.sess_expire, sleep_sec * 2))

    #     while self.is_valid_asy_func(loop_info):
    #         with __old_SocketManager__.lock:
    #             sess_ids = self.redis.l_get('ws;all_sess_ids')
    #             sess_ids = [x for x in sess_ids if x in self.socket.server.sockets]

    #             for sess_id in sess_ids:
    #                 if self.redis.exists('sess_heartbeat;' + sess_id):
    #                     self.redis.expire(
    #                         name='sess_heartbeat;' + sess_id, expire=sess_expire
    #                     )
    #                 else:
    #                     self.cleanup_session(sess_id)

    #         sleep(sleep_sec)

    #     self.log.info([['y', ' - ending shared_asy_func('], ['g', 'sess_heartbeat']])

    #     return

    # ------------------------------------------------------------------
    # cleanup (run in asy_func) for all the bookkeeping elements
    # ------------------------------------------------------------------
    def cleanup(self, loop_info):
        self.log.info([['y', ' - starting shared_asy_func('], ['g', 'cleanup'],
                       ['y', ') - ', __old_SocketManager__.server_id]])
        sleep(3)

        while self.is_valid_asy_func(loop_info):
            with __old_SocketManager__.lock:
                all_user_ids = self.redis.l_get('ws;all_user_ids')
                sess_ids = self.redis.l_get('ws;all_sess_ids')

                for sess_id in sess_ids:
                    if not self.redis.exists('sess_heartbeat;' + sess_id):
                        self.cleanup_session(sess_id)

                sess_ids = self.redis.l_get('ws;all_sess_ids')
                for user_id in all_user_ids:
                    sess_ids_now = self.redis.l_get('ws;user_sess_ids;' + user_id)
                    zombie_ids = [x for x in sess_ids_now if x not in sess_ids]
                    for sess_id in zombie_ids:
                        self.redis.l_rem(name='ws;user_sess_ids;' + user_id, data=sess_id)

                    # just in case, cleanup any remaining widgets
                    if len(sess_ids_now) == len(zombie_ids):
                        widget_ids = self.redis.l_get('ws;user_widget_ids;' + user_id)
                        for widget_id in widget_ids:
                            self.redis.h_del(name='ws;widget_infos', key=widget_id)
                            if widget_id in __old_SocketManager__.widget_inits:
                                __old_SocketManager__.widget_inits.pop(widget_id, None)

                        self.redis.delete('ws;user_sess_ids;' + user_id)
                        self.redis.delete('ws;user_widget_ids;' + user_id)
                        self.redis.h_del(name='ws;active_widget', key=user_id)
                        self.redis.l_rem(name='ws;all_user_ids', data=user_id)

                if not self.redis.exists('ws;all_user_ids'):
                    break

            sleep(self.cleanup_sleep)

        self.clear_asy_func_group('shared_asy_func')
        # self.set_asy_func_state('shared_asy_func', 'cleanup', False)
        # self.set_asy_func_state('shared_asy_func', 'sess_heartbeat', False)
        # self.set_asy_func_state('shared_asy_func', 'pubsub_socket_evt_widgets', False)

        self.log.info([['y', ' - ending shared_asy_func('], ['g', 'cleanup']])

        return



















# ------------------------------------------------------------------
# add some functionality to the socket_manager for specific tasks, which
# can easily be turned off via flags
# ------------------------------------------------------------------
class SocketDecorator():
    def __init__(self, socket_manager, *args, **kwargs):
        self.socket_manager = socket_manager
        self.log = self.socket_manager.log

        if self.socket_manager.is_simulation:
            ClockSimDecorator(socket_manager)

        return


# ------------------------------------------------------------------
class ClockSimDecorator():
    """description
    
        Parameters
        ----------
        name : type
            description
    
        Returns
        -------
        type
            description
    """
    
    def __init__(self, socket_manager, *args, **kwargs):
        self.socket_manager = socket_manager
        self.log = self.socket_manager.log
        self.redis = self.socket_manager.redis

        setattr(
            self.socket_manager,
            'ask_sim_clock_sim_params',
            self.ask_sim_clock_sim_params,
        )

        setattr(
            self.socket_manager,
            'set_sim_clock_sim_params',
            self.set_sim_clock_sim_params,
        )

        setattr(
            self.socket_manager,
            'clock_sim_update_sim_params',
            self.clock_sim_update_sim_params,
        )

        loop_info = {
            'id': 'clock_sim_update_sim_params_loop',
            'func': self.clock_sim_update_sim_params,
            'group': 'ws;server;' + self.socket_manager.server_id,
            'context': 'ws;server_heartbeat;' + self.socket_manager.server_id,
        }
        self.socket_manager.add_async_loop(loop_info=loop_info)

        return

    # ------------------------------------------------------------------
    async def ask_sim_clock_sim_params(self, data_in=None):
        data = self.redis.get('clock_sim_sim_params')
        
        # temporary hack
        if data is None:
            self.log.warn([['r', ' - could not get clock_sim_sim_params ...']])
            # raise Exception('could not get clock_sim_sim_params')
            return
        
        await self.socket_manager.emit_to_queue(event_name='get_sim_clock_sim_params', data=data,)

        return

    # ------------------------------------------------------------------
    def set_sim_clock_sim_params(self, data_in):
        data_pubsub = data_in['data']

        self.redis.publish(
            channel='clock_sim_set_sim_params',
            message=data_pubsub,
        )

        return

    # ---------------------------------------------------------------------------
    async def clock_sim_update_sim_params(self, loop_info):

        self.log.info([['y', ' - starting '],['b', 'clock_sim_sim_params'], ['y', ' for server: '], ['c', self.socket_manager.server_id],])

        # setup the channel once
        pubsub_tag = 'clock_sim_updated_sim_params'
        while self.redis.set_pubsub(pubsub_tag) is None:
            sleep(0.1)

        sleep_sec = 0.1
        while self.socket_manager.get_loop_state(loop_info):
            await asyncio.sleep(sleep_sec)    

            msg = self.redis.get_pubsub(key=pubsub_tag)
            if msg is None:
                continue

            # lock the server while getting the sessions, but for the transmition
            lock_name = 'ws;lock;' + self.socket_manager.server_id
            async with await self.socket_manager.get_redis_lock(lock_name):
                managers = await self.socket_manager.get_server_attr('managers')

                all_sess_ids = self.redis.l_get('ws;server_sess_ids;'+self.socket_manager.server_id)
                all_sess_ids = [
                    s for s in all_sess_ids if s in managers.keys()
                ]
            for sess_id in all_sess_ids:
                await managers[sess_id].ask_sim_clock_sim_params()


        self.log.info([['r', ' - ending '],['b', 'clock_sim_sim_params'], ['r', ' for server: '], ['c', self.socket_manager.server_id],])

        return

















































if 0:
    async def tmp_func():

        def get_pubsub():
            for i in range(5):
                print('    ------ ', i)
                print('-->', self.socket_manager.is_valid_asy_func(loop_info))
                sleep(1)
            return i 

        loop = asyncio.get_event_loop()

        for i in range(5):
            if not self.socket_manager.is_valid_asy_func(loop_info):
                print('done!!!!!!!!!!!!!')
                break
            blocking_future = loop.run_in_executor(None, get_pubsub)
            if i == 2:
                blocking_future.cancel() 
            if blocking_future.done():
                print('done!')
                break 
            msg = await blocking_future
            print(msg) 
            # print('sssssssssssssssssssssssss333333', self.redis.pubsub.keys())
        return


        def get_pubsub():
            msg = self.redis.get_pubsub(pubsub_tag)
            return msg

        loop = asyncio.get_event_loop()
        await asyncio.sleep(1)

        sleep_sec = 0.1
        sleep_sec = 1
        while self.socket_manager.is_valid_asy_func(loop_info):
            # await loop.run_in_executor(None, get_pubsub)
            msg = await loop.run_in_executor(None, get_pubsub)
            if msg is None:
                continue


            print('qqqqqqqqqqqqqqqq')
            data = self.redis.get('clock_sim_sim_params')
            await self.socket_manager.emit('get_sim_clock_sim_params', data)



            # await self.socket_manager.emit('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', data)

            # async with asyncio_lock:
            #     # get the full data structure
            #     data = self.redis.get('clock_sim_sim_params')
            #     emit_data = {'data': data}

            # # send the updated value to all sessions
            # self.socket_manager.socket_event_widgets(
            #     event_name='get_sim_clock_sim_params',
            #     data=emit_data,
            # )
            # print('ddddddddd',data)

            await asyncio.sleep(sleep_sec)
