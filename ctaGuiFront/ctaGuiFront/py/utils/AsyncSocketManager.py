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
from random import Random
import json
rnd_seed = get_rnd_seed()
rnd_gen = Random(rnd_seed)

asyncio_lock = asyncio.Lock()

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
    
    app = ExtendedWsgiToAsgi(wsgi_app)

    # see: https://asgi.readthedocs.io/en/latest/specs/www.html
    @app.route(websocket_route['server'], protocol='websocket')
    async def hello_websocket(scope, receive, send):
        try:
            async_manager = AsyncSocketManager(sync_send=send)

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
                        await async_manager.send_initial_connect()
                    except Exception as e:
                        traceback.print_tb(e.__traceback__)
                        print(e)
                    
                elif message["type"] == "websocket.receive":
                    text = message.get("text")
                    if text:
                        text = json.loads(text)

                        try:
                            # non-blocking receive events
                            asyncio.ensure_future(async_manager.receive(data=text))
                        except Exception as e:
                            traceback.print_tb(e.__traceback__)
                            print(e)

                elif message["type"] == "websocket.disconnect":
                    try:
                        # blocking disconnect event
                        await async_manager.websocket_disconnect()
                    except Exception as e:
                        traceback.print_tb(e.__traceback__)
                        print(e)
                    break
                else:
                    raise Exception('unknown message type ', message)

        except Exception as e:
            raise e

    return app






# ------------------------------------------------------------------
class AsyncSocketManager:
    server_name = None
    n_server_sess = 0

    # common dictionaries for all instances of
    # the class (keeping track of all sessions etc.)
    # sess_endpoints = dict()
    coroutine_sigs = dict()
    widget_inits = dict()


    # ------------------------------------------------------------------
    def __init__(self, sync_send, *args, **kwargs):
        
        if AsyncSocketManager.server_name is None:
            AsyncSocketManager.server_name = (
                'svr_' + str(self.base_config.app_port)
                + '_' + get_rnd(n_digits=6, out_type=str, is_unique_seed=True)
            )

        self.sync_send = sync_send

        self.sess_id = None
        # self.sess_id = str(get_time('msec') + rnd_gen.randint(1000000, (1000000 * 10) -1))
        self.n_server_msg = 0
        self.has_init_sess = False
        self.user_id = ''
        self.user_group = ''
        self.user_group_id = ''
        self.sess_name = ''
        self.log_send_packet = False
        self.sess_expire = 10
        self.cleanup_sleep = 60
        # self.max_sess_valid_time_sec = 20
        self.valid_loop_sleep_sec = 0.01
        
        # session ping/pong heartbeat
        self.sess_ping = {
            # interval for sending ping/pong events
            'interval_msec': 2500,
            # how much delay is considered ok for a slow session
            'tolerance_optimal_msec': 100,
            # how much delay is considered ok for a disconnected session
            'tolerance_slow_msec': 1000,
            # how much delay before the client socket is forcibly closed
            # and set in a reconnection attempt loop
            'tolerance_close_msec': 5000,
        }
        # self.sess_ping = {
        #     # interval for sending ping/pong events
        #     'interval_msec': 2000,
        #     # how much delay is considered ok for a slow session
        #     'tolerance_optimal_msec': 2000,
        #     # how much delay is considered ok for a disconnected session
        #     'tolerance_slow_msec': 6000,
        # }

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

        self.inst_data = self.base_config.inst_data

        

        return
    
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
    async def emit(self, event_name, data={}):
        data_out = {
            'event_name': event_name,
            'sess_id': self.sess_id,
            'n_server_msg': self.n_server_msg,
            'send_time_msec': get_time('msec'),
            'data': data,
        }
        self.n_server_msg += 1

        await self.sync_send(self.websocket_data_dump(data_out))

        return

    # ------------------------------------------------------------------
    def is_asyncio_locked(self):
        return asyncio_lock.locked()


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
            event_func = getattr(self, data['event_name'])
        except Exception as e:
            self.log.error([['p', '\n'],['r', '-'*20, 'event name undefined:'], ['p', '', data['event_name'], ''], ['r', '-'*20], ['p', '\n', self.sess_id, ''], ['y', data, '\n'], ['r', '-'*100],])
            # raise e
            return

        try:
            # check that events are received in the expected order, where the
            # initial connection and any logging messages get executed immediately
            # and any other events get put in an ordered queue for execution
            if data['event_name'] in ['client_log']:
                event_func(data)
            elif data['event_name'] in ['initial_connect_replay']:
                await event_func(data)
            else:
                await self.asyncio_queue.put({'coroutine':event_func(data), 'data': data,})

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
    async def send_initial_connect(self):
        """upon any new connection, send the client initialisation data
        """

        # # temporary hack - make sure the lifecycle is understood - this should only happen once...
        # if self.sess_id is not None:
        #     self.log.error([['wr', ' - already connected ?!?!?!?!', self.sess_id]])
        #     raise Exception('already connected ?!?!?', self.sess_id)

        async with asyncio_lock:
            self.sess_id = (
                self.server_name + '_ses_'
                +  '{:07d}'.format(AsyncSocketManager.n_server_sess)
            )
            AsyncSocketManager.n_server_sess += 1
            # AsyncSocketManager.n_server_sess += get_rnd(n_digits=4, out_type=int, is_unique_seed=True)

        tel_ids = self.inst_data.get_inst_ids()
        tel_id_to_types = self.inst_data.get_inst_id_to_types()
        categorical_types = self.inst_data.get_categorical_types()

        data = {
            'server_name': self.server_name,
            'sess_id': self.sess_id,
            'sess_ping': self.sess_ping,
            'tel_ids': tel_ids,
            'tel_id_to_types': tel_id_to_types,
            'categorical_types': categorical_types,
            'is_simulation': self.is_simulation,
        }
        await self.emit('initial_connect', data)

        return

    # ------------------------------------------------------------------
    async def initial_connect_replay(self, data):
        """the replay of the client to the initial_connect event

            set the session-id which is derived by the client upon connecting the socket
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the event
        """

        async with asyncio_lock:
            is_existing_sess = (self.sess_id != data['sess_id'])

            # ------------------------------------------------------------------
            # for development, its conveniet to reload if the server was restarted, but
            # for deployment, the same session can simply be restored
            if self.is_HMI_dev:
                if is_existing_sess:
                    self.sess_id = data['sess_id']
                    await self.emit('reload_session', data)
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
                        'got unidentified user_name in initial_connect_replay...', data
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

            # register the user_name if needed (this list is never cleaned up)
            user_ids = self.redis.l_get('user_ids', packed=False)
            if self.user_id not in user_ids:
                self.redis.r_push(
                    name='user_ids', data=self.user_id, packed=False
                )

            # register the sess_id in all lists
            # heartbeat should be first to avoid cleanup racing conditions!
            self.redis.set(
                name='server_sess_heartbeat;' + self.sess_id, expire=(int(self.sess_expire) * 10), packed=False,
            )

            # global and local lists session ids

            all_sess_ids = self.redis.l_get('all_sess_ids', packed=False)
            if self.sess_id not in all_sess_ids:
                self.redis.r_push(
                    name='all_sess_ids', data=self.sess_id, packed=False
                )

            all_sess_ids = self.redis.l_get(self.server_name+';all_sess_ids', packed=False)
            if self.sess_id not in all_sess_ids:
                self.redis.r_push(
                    name=self.server_name+';all_sess_ids', data=self.sess_id, packed=False
                )

            if not self.redis.h_exists(name='sync_groups', key=self.user_id):
                self.redis.h_set(
                    name='sync_groups', key=self.user_id, data=[], packed=True
                )

            # list of all sessions for this user
            all_user_sess_ids = self.redis.l_get('user_sess_ids;' + self.user_id, packed=False)
            if self.sess_id not in all_user_sess_ids:
                self.redis.r_push(
                    name='user_sess_ids;' + self.user_id, data=self.sess_id, packed=False
                )

            self.init_common_loops()
            # await self.init_common_loops()  

            # as the final step within the lock, flag the session as initialised
            self.has_init_sess = True

            # function which may be overloaded, setting up individual
            # properties for a given session-type
            if not is_existing_sess:
                self.on_join_session_()

            self.init_user_sync_loops()


            # await asyncio.sleep(3)

            test_connection_sess = 0
            if test_connection_sess:
                all_sess_ids = self.redis.l_get('all_sess_ids', packed=False)
                print('all_sess_ids \t\t\t', all_sess_ids)

                for s in all_sess_ids:
                    print('heartbeat \t\t\t', s, '  -->  ', self.redis.exists('server_sess_heartbeat;' + s))
                all_sess_ids = self.redis.l_get(self.server_name+';all_sess_ids', packed=False)
                print('server_name;all_sess_ids \t', all_sess_ids)

                user_sess_ids = self.redis.l_get('user_sess_ids;' + self.user_id, packed=False)
                print('user_sess_ids \t\t\t', user_sess_ids)

                sync_groups = self.redis.h_get(
                    name='sync_groups', key=self.user_id, packed=True, default_val=[]
                )
                print('sync_groups \t\t\t', sync_groups)


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
        return

    # ------------------------------------------------------------------
    def init_common_loops(self):
        """initialise shared maintenance coroutines
        """

        coroutines = []

        # session heartbeat (shared between all sessions for this server)
        coroutines += [
            {
                'id': -1,
                'group': 'shared_coroutine',
                'tag': 'server_sess_heartbeat_loop',
                'func': self.server_sess_heartbeat_loop,
            },
        ]

        # client ping/pong heartbeat for a particular session
        coroutines += [
            {
                'id': -1,
                'group': self.sess_id,
                'tag': 'client_sess_heartbeat_loop',
                'func': self.client_sess_heartbeat_loop,
            },
        ]
        
        # session cleanup (shared between all sessions for this server)
        coroutines += [
            {
                'id': -1,
                'group': 'shared_coroutine',
                'tag': 'cleanup_loop',
                'func': self.cleanup_loop,
            },
        ]
            
        # 
        # coroutines += [
        #     {
        #         'id': -1,
        #         'group': 'shared_coroutine',
        #         'tag': 'pubsub_socket_evt_widgets',
        #         'func': self.pubsub_socket_evt_widgets,
        #     },
        # ]
        
        # received event execution (one instance for each session)
        coroutines += [
            {
                'id': -1,
                'group': self.sess_id,
                'tag': 'receive_queue_loop',
                'func': self.receive_queue_loop,
            },
        ]

        for coroutine_info in coroutines:
            if self.check_coroutine_loop(coroutine_info):
                coroutine_info['id'] = self.set_coroutine_state(
                    coroutine_info['group'], coroutine_info['tag'], True
                )
                self.spawn(coroutine_info['func'], coroutine_info=coroutine_info)

        return


    # ------------------------------------------------------------------
    async def receive_queue_loop(self, coroutine_info):
        """process the received event queue
        
            Parameters
            ----------
            coroutine_info : dict
                metadata needed to determine when is the loop should continue
        """

        self.log.info([['y', ' - starting receive_queue_loop for session: '], ['c', self.sess_id],])

        # proccess an item from the queue
        async def await_queue_item():
            queue_item = self.asyncio_queue.get_nowait()
            # verufy that the session has initialised, that we have the right sess_id, etc.
            self.verify_sess_event(queue_item['data'])
            # execute the coroutine
            await queue_item['coroutine']
            return

        while self.check_coroutine_loop(coroutine_info):
            if self.asyncio_queue.qsize() > 0 and self.is_valid_session():
                self.spawn(await_queue_item)

            await asyncio.sleep(self.valid_loop_sleep_sec)
            # await asyncio.sleep(1)

        # cancel remaining tasks
        for _ in range(self.asyncio_queue.qsize()):
            self.spawn(await_queue_item).cancel()

        self.log.info([['o', ' - ending receive_queue_loop for session: '], ['c', self.sess_id]])
        
        return

    # ------------------------------------------------------------------
    def verify_sess_event(self, data):
        """verify that an event may be executed
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the coroutine to be executed
        """

        try:
            if not self.has_init_sess:
                raise Exception('events not coming in order - has not init session...', data)
            
            if not data['sess_id'] == self.sess_id:
                raise Exception('mismatch in sess_id...', data)

            if not self.is_valid_session():
                raise Exception('not a valid session', data)

        except Exception as e:
            raise e

        return

    # ------------------------------------------------------------------
    async def server_sess_heartbeat_loop(self, coroutine_info):
        """renew session heartbeat tokens

            run in coroutine so long as there are active sessions
            renewes all sessions which belong to this server
            (registered in AsyncSocketManager.all_sess_ids)

            sessiosns which are not meaintained by any running server will expire, and
            thier cleanup will be handled by self.cleanup_loop()
        
            Parameters
            ----------
            coroutine_info : dict
                metadata needed to determine when is the loop should continue
        """

        self.log.info([['y', ' - starting shared_coroutine('], ['o', 'server_sess_heartbeat_loop'],
                       ['y', ') for server: '], ['c', self.server_name ],])

        sleep_sec = min(1, max(ceil(self.sess_expire * 0.1), 10))
        sess_expire = ceil(max(self.sess_expire, sleep_sec * 5))

        # sleep_sec = 2
        # sess_expire = 4
        # print('sleep_sec',sleep_sec,sess_expire)

        while self.check_coroutine_loop(coroutine_info):
            async with asyncio_lock:
                # sess_ids = self.redis.l_get('all_sess_ids')
                # print('xxxxxxxx', [[s, self.redis.exists('server_sess_heartbeat;' + s)] for s in sess_ids])
                
                sess_ids = self.redis.l_get(self.server_name+';all_sess_ids')
                for sess_id in sess_ids:
                    if self.redis.exists('server_sess_heartbeat;' + sess_id):
                        self.redis.expire(
                            name='server_sess_heartbeat;' + sess_id, expire=sess_expire
                        )
                    # else:
                    #     self.cleanup_session(sess_id)

            await asyncio.sleep(sleep_sec)

        self.log.info([['y', ' - ending shared_coroutine']])

        return


    
    # ------------------------------------------------------------------
    async def client_sess_heartbeat_loop(self, coroutine_info):
        """send ping/pong heartbeat message to client to verify the connection
        
            Parameters
            ----------
            coroutine_info : dict
                metadata needed to determine when is the loop should continue
        """

        self.log.info([['y', ' - starting client_sess_heartbeat_loop for session: '], ['c', self.sess_id],])

        sleep_sec = self.sess_ping['interval_msec'] * 1e-3
        ping_interval_msec = 0

        while self.check_coroutine_loop(coroutine_info):
            data = {
                'ping_interval_msec': ping_interval_msec,
            }
            self.sess_ping_time = get_time('msec')
            await self.emit('heartbeat_ping', data)

            # update the interval between pings
            ping_interval_msec = get_time('msec')
            await asyncio.sleep(sleep_sec)
            ping_interval_msec = get_time('msec') - ping_interval_msec

        self.log.info([['y', ' - ending shared_coroutine']])

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

        if ping_delay > self.sess_ping['tolerance_optimal_msec']:
            is_slow = (
                ping_delay < self.sess_ping['tolerance_slow_msec']
            )

            log_func = self.log.warn if is_slow else self.log.error
            log_txt = 'unstable connection for ' if is_slow else 'not connected to '
            log_func([['y', ' - ', log_txt], ['r', self.sess_id, '\n'], ['g', self.sess_ping_time, ' --> ',],['o', data],])
        
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

        sess_ids = self.redis.l_get(self.server_name+';all_sess_ids')
        if sess_id in sess_ids:
            if self.redis.exists('server_sess_heartbeat;' + sess_id):
                return True

        return False

    # ------------------------------------------------------------------
    async def websocket_disconnect(self):
        """local cleanup for the current server session upon disconnection
        """

        self.log.info([['c', ' - websocket_disconnect '], ['p', self.sess_id]])

        try:
            async with asyncio_lock:
                self.cleanup_session(self.sess_id)

        except Exception as e:
            raise e

        return

    # ------------------------------------------------------------------
    def cleanup_session(self, sess_id):
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

        if sess_id is None:
            return

        self.log.info([['c', ' - cleanup_session '], ['p', sess_id]])

        try:
            if not self.is_asyncio_locked():
                raise Exception('got asyncio not locked in set_coroutine_state')


            # if self.sess_id in AsyncSocketManager.all_sess_ids:
            #     AsyncSocketManager.all_sess_ids.remove(self.sess_id)
    
            user_ids = self.redis.l_get('user_ids')
            widget_ids = self.redis.l_get('sess_widgets;' + sess_id)
            
            self.redis.delete('server_sess_heartbeat;' + sess_id)
            self.redis.l_rem(name='all_sess_ids', data=sess_id)
            self.redis.l_rem(name=self.server_name+';all_sess_ids', data=sess_id)

            for user_id in user_ids:
                self.redis.l_rem(name='user_sess_ids;' + user_id, data=sess_id)

            self.clear_coroutine_group(self.sess_id)

        except Exception as e:
            raise e

        test_connection_sess = 0
        if test_connection_sess:
            print('-'*70)
            all_sess_ids = self.redis.l_get('all_sess_ids', packed=False)
            print('all_sess_ids \t\t', all_sess_ids)

            for s in all_sess_ids:
                print('heartbeat \t\t', s, self.redis.exists('server_sess_heartbeat;' + s))
            all_sess_ids = self.redis.l_get(self.server_name+';all_sess_ids', packed=False)
            print('server_name;all_sess_ids \t\t', all_sess_ids)

            user_sess_ids = self.redis.l_get('user_sess_ids;' + self.user_id, packed=False)
            print('user_sess_ids \t\t', user_sess_ids)

            sync_groups = self.redis.h_get(
                name='sync_groups', key=self.user_id, packed=True, default_val=[]
            )
            print('sync_groups \t\t', sync_groups)
            print('+'*70)

        # return


        # # user_ids = self.redis.l_get('user_ids')
        # widget_ids = self.redis.l_get('sess_widgets;' + sess_id)

        # # for user_id in user_ids:
        # #     self.redis.l_rem(name='user_sess_ids;' + user_id, data=sess_id)

        # for widget_id in widget_ids:
        #     self.log.info([[
        #         'b', ' - cleanup_session widget_id (', __old_SocketManager__.server_name, ') '
        #     ], ['p', widget_id]])

        #     self.redis.h_del(name='all_widgets', key=widget_id)
        #     if widget_id in __old_SocketManager__.widget_inits:
        #         __old_SocketManager__.widget_inits.pop(widget_id, None)
        #     for user_id in user_ids:
        #         self.redis.l_rem(name='user_widgets;' + user_id, data=widget_id)

        # self.redis.delete('sess_widgets;' + sess_id)
        # # self.redis.delete('server_sess_heartbeat;' + sess_id)
        # # self.redis.l_rem(name='all_sess_ids', data=sess_id)

        # if sess_id in __old_SocketManager__.sess_endpoints:
        #     __old_SocketManager__.sess_endpoints.pop(sess_id, None)

        return


    # ------------------------------------------------------------------
    async def cleanup_loop(self, coroutine_info):
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

        self.log.info([['y', ' - starting cleanup_loop for server: '], ['c', self.server_name],])

        # self.cleanup_sleep=2
        while self.check_coroutine_loop(coroutine_info):
            async with asyncio_lock:
                sess_ids = self.redis.l_get('all_sess_ids')

                for sess_id in sess_ids:
                    if not self.redis.exists('server_sess_heartbeat;' + sess_id):
                        # do some cleanup for expired session
                        self.cleanup_session(sess_id)

            await asyncio.sleep(self.cleanup_sleep)


        # some for of cleanup for every group....:
            # self.clear_coroutine_group('shared_coroutine')
            # self.clear_coroutine_group(widget_id)
            # self.clear_coroutine_group(self.sess_name)


        self.log.info([['y', ' - ending cleanup_loop']])

        return







    # ------------------------------------------------------------------
    def get_coroutine_id(self, coroutine_group, coroutine_tag):
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

        if coroutine_group in AsyncSocketManager.coroutine_sigs:
            for ele_now in AsyncSocketManager.coroutine_sigs[coroutine_group]:
                if ele_now[0] == coroutine_tag:
                    return ele_now[1]

        return -1

    # ------------------------------------------------------------------
    def check_coroutine_loop(self, coroutine_info):
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
        
        coroutine_id = coroutine_info['id']
        coroutine_group = coroutine_info['group']
        coroutine_tag = coroutine_info['tag']

        is_valid = (coroutine_id == self.get_coroutine_id(coroutine_group, coroutine_tag))
        return is_valid

    # ------------------------------------------------------------------
    def set_coroutine_state(self, coroutine_group, coroutine_tag, state):
        """bookkeeping of coroutine and their signal cleanup
        
            Parameters
            ----------
            name : type
                description
        
            Returns
            -------
            type
                description
        """
        
        try:
            # make sure the function which calls this has secured the lock
            if not self.is_asyncio_locked():
                raise Exception('got asyncio not locked in set_coroutine_state')
            
            sigs = AsyncSocketManager.coroutine_sigs
            if state:
                if coroutine_group not in sigs:
                    sigs[coroutine_group] = []

                coroutine_id_now = get_rnd(n_digits=15, out_type=int)

                for n_ele_now in range(len(sigs[coroutine_group])):
                    if sigs[coroutine_group][n_ele_now][0] == coroutine_tag:
                        sigs[coroutine_group][n_ele_now][1] = coroutine_id_now
                        return coroutine_id_now

                sigs[coroutine_group].append([
                    coroutine_tag, coroutine_id_now,
                ])

                return coroutine_id_now
            else:
                for n_ele_now in range(len(sigs[coroutine_group])):
                    if sigs[coroutine_group][n_ele_now][0] == coroutine_tag:
                        sigs[coroutine_group][n_ele_now][1] = -1

                return -1
        
        except Exception as e:
            raise e

        return -1



    # ------------------------------------------------------------------
    # clean unneeded coroutines, assuming we are already in a coroutine
    # lock, for safe modification of AsyncSocketManager.coroutine_sigs
    # ------------------------------------------------------------------
    def clear_coroutine_group(self, coroutine_group):
        """description
        
            Parameters
            ----------
            name : type
                description
        """
        if coroutine_group in AsyncSocketManager.coroutine_sigs:
            AsyncSocketManager.coroutine_sigs.pop(coroutine_group, None)

            self.log.info([['r', ' - clear_coroutine_group(' + str(coroutine_group) + ') ...']])

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
# ------------------------------------------------------------------
# ------------------------------------------------------------------
# ------------------------------------------------------------------
class __old_SocketManager__(BaseNamespace, BroadcastMixin):
    # server_name = None

    # # common dictionaries for all instances of
    # # the class (keeping track of all sessions etc.)
    # sess_endpoints = dict()
    # coroutine_sigs = dict()
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
        SocketDecorator(self)

        # # ------------------------------------------------------------------
        # # cleanup the database of old sessions upon restart
        # # ------------------------------------------------------------------
        # with __old_SocketManager__.lock:
        #     if __old_SocketManager__.server_name is None:
        #         __old_SocketManager__.server_name = 'server_' + get_rnd(n_digits=10, out_type=str)

                # sess_ids_now = self.redis.l_get('all_sess_ids')
                # for sess_id in sess_ids_now:
                #   self.cleanup_session(sess_id)
                # self.redis.delete('user_ids')
                # self.redis.delete('all_widgets')

        return

    # # ------------------------------------------------------------------
    # # upon any new connection
    # # ------------------------------------------------------------------
    # def recv_connect(self):
    #     server_name = __old_SocketManager__.server_name
    #     tel_ids = self.inst_data.get_inst_ids()
    #     tel_id_to_types = self.inst_data.get_inst_id_to_types()
    #     categorical_types = self.inst_data.get_categorical_types()

    #     self.emit(
    #         'initial_connect', {
    #             'server_name': server_name,
    #             'tel_ids': tel_ids,
    #             'tel_id_to_types': tel_id_to_types,
    #             'categorical_types': categorical_types,
    #         }
    #     )
    #     return

    # ------------------------------------------------------------------
    # upon reconnection to an existing session
    # ------------------------------------------------------------------
    def on_back_from_offline(self):
        if self.sess_id is None:
            return

        # print 'on_back_from_offline.................'
        # first validate that eg the server hasnt been restarted while this session has been offline
        sess_ids = self.redis.l_get('all_sess_ids')
        server_name = __old_SocketManager__.server_name if self.sess_id in sess_ids else ''

        self.emit('reconnect', {'server_name': server_name})

        # now run any widget specific functions
        with __old_SocketManager__.lock:
            widget_ids = self.redis.l_get('sess_widgets;' + self.sess_id)
            for widget_id in widget_ids:
                if widget_id in __old_SocketManager__.widget_inits:
                    getattr(__old_SocketManager__.widget_inits[widget_id], 'back_from_offline')()

        return

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
    #         ['y', __old_SocketManager__.server_name, ''],
    #         ['p', self.user_group_id, ''],
    #         ['y', self.user_id, ''],
    #         ['p', self.user_group_id, ''],
    #         ['y', self.sess_id, ''],
    #         ['p', self.sess_name, ''],
    #         ['y', self.ns_name, ''],
    #     ])

    #     with __old_SocketManager__.lock:
    #         user_ids = self.redis.l_get('user_ids')
    #         if self.user_id not in user_ids:
    #             self.redis.r_push(name='user_ids', data=self.user_id)

    #         # ------------------------------------------------------------------
    #         # all session ids in one list (heartbeat should be first to
    #         # avoid cleanup racing conditions!)
    #         # ------------------------------------------------------------------
    #         self.redis.set(
    #             name='sess_heartbeat;' + self.sess_id, expire=(int(self.sess_expire) * 2)
    #         )
    #         self.redis.r_push(name='all_sess_ids', data=self.sess_id)

    #         # ------------------------------------------------------------------
    #         # the socket endpoint type registry for this session
    #         # ------------------------------------------------------------------
    #         __old_SocketManager__.sess_endpoints[self.sess_id] = self.ns_name

    #         # ------------------------------------------------------------------
    #         #
    #         # ------------------------------------------------------------------
    #         if not self.redis.h_exists(name='sync_groups', key=self.user_id):
    #             self.redis.h_set(
    #                 name='sync_groups', key=self.user_id, data=[], packed=True
    #             )

    #         # ------------------------------------------------------------------
    #         # list of all sessions for this user
    #         # ------------------------------------------------------------------
    #         self.redis.r_push(name='user_sess_ids;' + self.user_id, data=self.sess_id)

    #     # ------------------------------------------------------------------
    #     # initiate the coroutines which does periodic cleanup, heartbeat managment etc.
    #     # ------------------------------------------------------------------
    #     with __old_SocketManager__.lock:
    #         coroutines = [
    #             {
    #                 'id': -1,
    #                 'group': 'shared_coroutine',
    #                 'tag': 'sess_heartbeat',
    #                 'func': self.sess_heartbeat,
    #             },
    #             {
    #                 'id': -1,
    #                 'group': 'shared_coroutine',
    #                 'tag': 'cleanup',
    #                 'func': self.cleanup,
    #             },
    #             {
    #                 'id': -1,
    #                 'group': 'shared_coroutine',
    #                 'tag': 'pubsub_socket_evt_widgets',
    #                 'func': self.pubsub_socket_evt_widgets,
    #             },
    #         ]

    #         for coroutine_info in coroutines:
    #             if self.check_coroutine_loop(coroutine_info):
    #                 coroutine_info['id'] = self.set_coroutine_state(
    #                     coroutine_info['group'], coroutine_info['tag'], True
    #                 )
    #                 gevent.spawn(coroutine_info['func'], coroutine_info)

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

    # ------------------------------------------------------------------
    # general communication with a widget (will import and instantiate a class if needed)
    # ------------------------------------------------------------------
    def on_widget(self, data):
        n_sess_try = 0
        while self.sess_id is None:
            n_sess_try += 1
            if n_sess_try >= 20:
                self.log.warning([['rb', ' - ignoring zombie session - on_widget('],
                                  ['yb', data], ['rb', ') !!!!!!!!']])
                return
            sleep(0.5)

        # basic widget info
        # ------------------------------------------------------------------
        widget_id = data['widget_id']
        widget_source = 'widgets.' + data['widget_source']
        widget_name = data['widget_name']
        n_sync_group = data['n_sync_group'] if 'n_sync_group' in data else 0
        sync_type = data['sync_type'] if 'sync_type' in data else 0

        if not self.check_panel_sync():
            n_sync_group = -1

        # first make sure the requested widget has been registered as a legitimate class
        is_panel_sync = (widget_name in self.allowed_widget_types['not_synced'])
        is_allowed = widget_name in self.allowed_widget_types['synced']
        if not is_panel_sync and not is_allowed:
            self.log.critical([
                ['wr', ' - widget_name =', widget_name, ''],
                ['wr', 'has not been registered in allowed_widget_types ?!?!'],
                ['wr', ' --> Will terminate!'],
            ])
            raise Exception()

            return

        # ------------------------------------------------------------------
        # dynamically load the module for the requested widget
        # (no need for a 'from dynamicLoadWidget import dynWidg_0' statement)
        # ------------------------------------------------------------------
        with __old_SocketManager__.lock:
            has_widget_id = self.redis.h_exists(name='all_widgets', key=widget_id)

        if not has_widget_id:
            # the following is equivalent e.g., to:
            #   from dynamicLoadWidget import dynWidg_0
            #   widget = dynWidg_0(widget_id=widget_id, __old_SocketManager__=self)
            # widget_module = __import__(widget_source, globals=globals())
            widget_module = importlib.import_module(
                widget_source,
                package=None,
            )

            with __old_SocketManager__.lock:
                __old_SocketManager__.widget_inits[widget_id] = getattr(
                    widget_module, widget_name
                )(widget_id=widget_id, socket_manager=self)

            with __old_SocketManager__.lock:
                if is_panel_sync:
                    n_sync_group = -1
                    n_icon = -1
                else:
                    n_icon = self.allowed_widget_types['synced'].index(widget_name)
                    while True:
                        widget_ids = self.redis.l_get('user_widgets;' + self.user_id)
                        if len(widget_ids) == 0:
                            break

                        all_widgets = self.redis.h_m_get(
                            name='all_widgets', key=widget_ids, packed=True, filter=True
                        )
                        n_icons = [x['n_icon'] for x in all_widgets]

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
                    name='all_widgets', key=widget_id, data=widget_now, packed=True
                )
                self.redis.r_push(name='user_widgets;' + self.user_id, data=widget_id)
                self.redis.r_push(name='sess_widgets;' + self.sess_id, data=widget_id)

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
                        name='sync_groups', key=self.user_id, packed=True, default_val=[]
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

                        # the sync_group['id'] must correspond to the pattern defined by the client
                        # for new groups (e.g., 'grp_0') !!!
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
                        name='sync_groups',
                        key=self.user_id,
                        data=sync_groups,
                        packed=True
                    )

            if n_sync_group != -1:
                self.update_sync_group()

        # ------------------------------------------------------------------
        # call the method named args[1] with optional arguments args[2], equivalent e.g., to:
        #   widget.method_name(optionalArgs)
        # ------------------------------------------------------------------
        if 'method_name' in data and widget_id in __old_SocketManager__.widget_inits:
            widget_ids = self.redis.l_get('sess_widgets;' + self.sess_id)
            if 'method_arg' in data:
                getattr(__old_SocketManager__.widget_inits[widget_id], data['method_name'])(
                    data['method_arg']
                )
            else:
                getattr(__old_SocketManager__.widget_inits[widget_id], data['method_name'])()

        return

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

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_sync_group(self):
        widget_ids = []
        with __old_SocketManager__.lock:
            all_widgets = self.redis.h_get_all(name='all_widgets', packed=True)
            for widget_id, widget_now in all_widgets.items():
                if widget_now['n_icon'] == -1 and widget_id in __old_SocketManager__.widget_inits:
                    widget_ids.append(widget_id)

        for widget_id in widget_ids:
            getattr(__old_SocketManager__.widget_inits[widget_id], 'update_sync_groups')()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def on_sync_state_send(self, data_in):
        if not self.check_panel_sync():
            return
        if 'widget_id' not in data_in:
            return
        if not self.redis.h_exists(name='active_widget', key=self.user_id):
            return
        all_sync_ids = []
        with __old_SocketManager__.lock:
            if self.redis.h_get(name='active_widget',
                                key=self.user_id) != data_in['widget_id']:
                return

            sync_groups = self.redis.h_get(
                name='sync_groups', key=self.user_id, packed=True, default_val=[]
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
                name='sync_groups', key=self.user_id, data=sync_groups, packed=True
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

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def on_set_active_widget(self, data):
        active_widget = self.redis.h_get(
            name='active_widget', key=self.user_id, default_val=None
        )

        if active_widget != data['widget_id']:
            self.redis.h_set(
                name='active_widget', key=self.user_id, data=data['widget_id']
            )

        return

    # # ------------------------------------------------------------------
    # # placeholder for overloaded method, to be run as part of on_leave_session
    # # ------------------------------------------------------------------
    # def on_leave_session_(self):
    #     return

    # ------------------------------------------------------------------
    # initial dataset and send to client
    # ------------------------------------------------------------------
    def send_init_widget(self, opt_in=None):
        widget = opt_in['widget']
        data_func = (opt_in['data_func'] if 'data_func' in opt_in else lambda: dict())
        coroutine_group = (
            opt_in['coroutine_group'] if 'coroutine_group' in opt_in else 'init_data'
        )

        with widget.lock:
            emit_data = {
                'widget_type': widget.widget_name,
                'event_name': coroutine_group,
                'n_icon': widget.n_icon,
                'data': data_func()
            }

            widget.log.info([['y', ' - sending - ('],
                             ['b', widget.widget_name, coroutine_group], ['y', ','],
                             ['g', self.sess_id, '/', widget.widget_id], ['y', ')']])

            # print('widget.widget_id',widget.widget_id, coroutine_group, emit_data)
            self.socket_evt_session(
                widget_id=widget.widget_id, event_name=coroutine_group, data=emit_data
            )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def add_widget_tread(self, opt_in=None):
        if 'is_group_coroutine' not in opt_in:
            opt_in['is_group_coroutine'] = True

        widget = opt_in['widget']

        coroutine_group = opt_in['coroutine_group'
                              ] if 'coroutine_group' in opt_in else 'update_data'
        opt_in['coroutine_group'] = coroutine_group

        coroutine_func = opt_in['coroutine_func'] if 'coroutine_func' in opt_in else None
        if coroutine_func is None and coroutine_group == 'update_data':
            coroutine_func = self.widget_coroutine_func

        is_group_coroutine = opt_in['is_group_coroutine']

        with widget.lock:
            if is_group_coroutine:
                if widget.widget_group not in widget.widget_group_sess:
                    widget.widget_group_sess[widget.widget_group] = []

                widget.widget_group_sess[widget.widget_group].append(
                    widget.socket_manager.sess_id
                )

                if self.get_coroutine_id(widget.widget_group, coroutine_group) == -1:
                    with __old_SocketManager__.lock:
                        opt_in['coroutine_id'] = self.set_coroutine_state(
                            widget.widget_group, coroutine_group, True
                        )

                        gevent.spawn(coroutine_func, opt_in=opt_in)
            else:
                if self.get_coroutine_id(widget.widget_id, coroutine_group) == -1:
                    with __old_SocketManager__.lock:
                        opt_in['coroutine_id'] = self.set_coroutine_state(
                            widget.widget_id, coroutine_group, True
                        )

                        gevent.spawn(coroutine_func, opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def widget_coroutine_func(self, opt_in=None):
        widget = opt_in['widget']
        coroutine_id = opt_in['coroutine_id']
        coroutine_group = opt_in['coroutine_group']
        data_func = opt_in['data_func']
        sleep_sec = opt_in['sleep_sec'] if 'sleep_sec' in opt_in else 5
        is_group_coroutine = opt_in['is_group_coroutine']

        emit_data = {'widget_type': widget.widget_name, 'event_name': coroutine_group}

        sleep(sleep_sec)

        if is_group_coroutine:
            while (coroutine_id == self.get_coroutine_id(widget.widget_group, coroutine_group)):
                with widget.lock:
                    sess_ids = widget.widget_group_sess[widget.widget_group]
                    emit_data['data'] = data_func()

                    self.socket_event_widgets(
                        event_name=coroutine_group, data=emit_data, sess_ids=sess_ids
                    )

                    if len(widget.widget_group_sess[widget.widget_group]) == 0:
                        with self.lock:
                            self.clear_coroutine_group(widget.widget_group)
                            widget.widget_group_sess.pop(widget.widget_group, None)
                            break

                sleep(sleep_sec)

        else:
            while (coroutine_id == self.get_coroutine_id(widget.widget_id, coroutine_group)):
                with widget.lock:
                    sess_ids = [widget.socket_manager.sess_id]
                    emit_data['data'] = data_func()

                    self.socket_event_widgets(
                        event_name=coroutine_group, data=emit_data, sess_ids=sess_ids
                    )

                sleep(sleep_sec)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def pubsub_socket_evt_widgets(self, coroutine_info):
        self.log.info([['y', ' - starting shared_coroutine('],
                       ['g', 'pubsub_socket_evt_widgets'], ['y', ')']])

        while self.redis.set_pubsub('socket_event_widgets') is None:
            self.log.info([['y', ' - setting up PubSub - '],
                           ['b', 'socket_event_widgets'], ['y', ' ...']])
            sleep(0.1)

        while self.check_coroutine_loop(coroutine_info):
            sleep(0.1)

            msg = self.redis.get_pubsub('socket_event_widgets', packed=True)
            if msg is None:
                continue

            data = msg['data']['data']
            event_name = msg['data']['event_name']
            sess_ids = msg['data']['sess_ids']
            widget_ids = msg['data']['widget_ids']

            with __old_SocketManager__.lock:
                if sess_ids is None:
                    sess_ids = self.redis.l_get('all_sess_ids')

                if self.log_send_packet:
                    self.log.info([[
                        'b', 'start ' + event_name + '  --> ' + lts(sess_ids)
                    ]])
                    self.log.info([[
                        'b', 'start ' + event_name + '  --> ' + '[' +
                        (',').join(sess_ids) + ']'
                    ]])

                user_sess_ids = self.redis.l_get('user_sess_ids;' + self.user_id)
                sess_ids = [
                    x for x in sess_ids
                    if (x in self.socket.server.sockets and x in user_sess_ids)
                ]

                for sess_id in sess_ids:
                    ids = self.redis.l_get('sess_widgets;' + sess_id)
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

        self.log.info([['y', ' - ending shared_coroutine('],
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

        self.redis.publish(channel='socket_event_widgets', message=message, packed=True)

        return

    # ------------------------------------------------------------------
    #
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
    # # bookkeeping of coroutines and coroutine-signal cleanup
    # # make sure the function which calls this has secured the thred-lock (__old_SocketManager__.lock)
    # # ------------------------------------------------------------------
    # def set_coroutine_state(self, coroutine_group, coroutine_tag, state):
    #     if state:
    #         if coroutine_group not in __old_SocketManager__.coroutine_sigs:
    #             __old_SocketManager__.coroutine_sigs[coroutine_group] = []

    #         coroutine_id_now = get_rnd(n_digits=15, out_type=int)

    #         for n_ele_now in range(len(__old_SocketManager__.coroutine_sigs[coroutine_group])):
    #             if __old_SocketManager__.coroutine_sigs[coroutine_group][n_ele_now][0] == coroutine_tag:
    #                 __old_SocketManager__.coroutine_sigs[coroutine_group][n_ele_now][1] = coroutine_id_now
    #                 return coroutine_id_now

    #         __old_SocketManager__.coroutine_sigs[coroutine_group].append([coroutine_tag, coroutine_id_now])

    #         return coroutine_id_now
    #     else:
    #         for n_ele_now in range(len(__old_SocketManager__.coroutine_sigs[coroutine_group])):
    #             if __old_SocketManager__.coroutine_sigs[coroutine_group][n_ele_now][0] == coroutine_tag:
    #                 __old_SocketManager__.coroutine_sigs[coroutine_group][n_ele_now][1] = -1

    #         return -1

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def get_coroutine_id(self, coroutine_group, coroutine_tag):
    #     if coroutine_group in __old_SocketManager__.coroutine_sigs:
    #         for ele_now in __old_SocketManager__.coroutine_sigs[coroutine_group]:
    #             if ele_now[0] == coroutine_tag:
    #                 return ele_now[1]

    #     return -1

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def check_coroutine_loop(self, coroutine_info):
    #     coroutine_id = coroutine_info['id']
    #     coroutine_group = coroutine_info['group']
    #     coroutine_tag = coroutine_info['tag']

    #     is_valid = (coroutine_id == self.get_coroutine_id(coroutine_group, coroutine_tag))
    #     return is_valid

    # # ------------------------------------------------------------------
    # # clean unneeded coroutines, assuming we are already in a coroutine
    # # lock, for safe modification of __old_SocketManager__.coroutine_sigs
    # # ------------------------------------------------------------------
    # def clear_coroutine_group(self, coroutine_group):
    #     if coroutine_group in __old_SocketManager__.coroutine_sigs:
    #         __old_SocketManager__.coroutine_sigs.pop(coroutine_group, None)

    #         self.log.info([['r', ' - clear_coroutine_group(' + str(coroutine_group) + ') ...']])

    #     return

    # # ------------------------------------------------------------------
    # # for development - a refresh-all event
    # # ------------------------------------------------------------------
    # def on_refreshAll(self, has_lock=False):
    #     def doRefresh():
    #         sess_ids = self.redis.l_get('all_sess_ids')
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

        sess_ids = self.redis.l_get('all_sess_ids')
        if (self.sess_name != '') and (self.sess_id in sess_ids):
            self.on_leave_session()

        self.disconnect(silent=True)
        return

    # ------------------------------------------------------------------
    # on leaving the session
    # ------------------------------------------------------------------
    def on_leave_session(self):
        with __old_SocketManager__.lock:
            sess_ids_now = self.redis.l_get('user_sess_ids;' + self.user_id)
            self.log.info([
                ['b', ' - leaving session '],
                ['y', self.sess_name + ' , ' + self.user_id],
                ['b', ' where all Ids('],
                ['g', str(len(sess_ids_now))],
                ['b', ') = ['],
                ['p', (',').join(sess_ids_now)],
                ['b', ']'],
            ])

            # remove the widgets which belong to this session
            widget_ids = self.redis.l_get('sess_widgets;' + self.sess_id)
            sync_groups = self.redis.h_get(
                name='sync_groups', key=self.user_id, packed=True, default_val=[]
            )

            for widget_id in widget_ids:
                self.redis.h_del(name='all_widgets', key=widget_id)

                for sync_group in sync_groups:
                    for sync_states in sync_group['sync_states']:
                        rm_elements = []
                        for sync_type_now in sync_states:
                            if sync_type_now[0] == widget_id:
                                rm_elements.append(sync_type_now)
                        for rm_element in rm_elements:
                            sync_states.remove(rm_element)

                self.clear_coroutine_group(widget_id)

            self.redis.h_set(
                name='sync_groups', key=self.user_id, data=sync_groups, packed=True
            )

            # ------------------------------------------------------------------
            # remove this session from the general registry
            # ------------------------------------------------------------------
            self.cleanup_session(self.sess_id)

            # ------------------------------------------------------------------
            # cleanup possible coroutines belonging to this specific session
            # ------------------------------------------------------------------
            self.clear_coroutine_group(self.sess_name)

        self.update_sync_group()

        self.on_leave_session_()

        return

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
    #         ['b', ' - cleanup_session sessionId(', __old_SocketManager__.server_name, ') '],
    #         ['p', sess_id],
    #     ])

    #     user_ids = self.redis.l_get('user_ids')
    #     widget_ids = self.redis.l_get('sess_widgets;' + sess_id)

    #     for user_id in user_ids:
    #         self.redis.l_rem(name='user_sess_ids;' + user_id, data=sess_id)

    #     for widget_id in widget_ids:
    #         self.log.info([[
    #             'b', ' - cleanup_session widget_id (', __old_SocketManager__.server_name, ') '
    #         ], ['p', widget_id]])

    #         self.redis.h_del(name='all_widgets', key=widget_id)
    #         if widget_id in __old_SocketManager__.widget_inits:
    #             __old_SocketManager__.widget_inits.pop(widget_id, None)
    #         for user_id in user_ids:
    #             self.redis.l_rem(name='user_widgets;' + user_id, data=widget_id)

    #     self.redis.delete('sess_widgets;' + sess_id)
    #     self.redis.delete('sess_heartbeat;' + sess_id)
    #     self.redis.l_rem(name='all_sess_ids', data=sess_id)

    #     if sess_id in __old_SocketManager__.sess_endpoints:
    #         __old_SocketManager__.sess_endpoints.pop(sess_id, None)

    #     return

    # # ------------------------------------------------------------------
    # # renew session heartbeat token (run in coroutine) for all active sessions
    # # ------------------------------------------------------------------
    # def sess_heartbeat(self, coroutine_info):
    #     self.log.info([['y', ' - starting shared_coroutine('], ['g', 'sess_heartbeat'],
    #                    ['y', ') - ', __old_SocketManager__.server_name]])

    #     sleep_sec = max(ceil(self.sess_expire * 0.1), 10)
    #     sess_expire = int(max(self.sess_expire, sleep_sec * 2))

    #     while self.check_coroutine_loop(coroutine_info):
    #         with __old_SocketManager__.lock:
    #             sess_ids = self.redis.l_get('all_sess_ids')
    #             sess_ids = [x for x in sess_ids if x in self.socket.server.sockets]

    #             for sess_id in sess_ids:
    #                 if self.redis.exists('sess_heartbeat;' + sess_id):
    #                     self.redis.expire(
    #                         name='sess_heartbeat;' + sess_id, expire=sess_expire
    #                     )
    #                 else:
    #                     self.cleanup_session(sess_id)

    #         sleep(sleep_sec)

    #     self.log.info([['y', ' - ending shared_coroutine('], ['g', 'sess_heartbeat']])

    #     return

    # ------------------------------------------------------------------
    # cleanup (run in coroutine) for all the bookkeeping elements
    # ------------------------------------------------------------------
    def cleanup(self, coroutine_info):
        self.log.info([['y', ' - starting shared_coroutine('], ['g', 'cleanup'],
                       ['y', ') - ', __old_SocketManager__.server_name]])
        sleep(3)

        while self.check_coroutine_loop(coroutine_info):
            with __old_SocketManager__.lock:
                user_ids = self.redis.l_get('user_ids')
                sess_ids = self.redis.l_get('all_sess_ids')

                for sess_id in sess_ids:
                    if not self.redis.exists('sess_heartbeat;' + sess_id):
                        self.cleanup_session(sess_id)

                sess_ids = self.redis.l_get('all_sess_ids')
                for user_id in user_ids:
                    sess_ids_now = self.redis.l_get('user_sess_ids;' + user_id)
                    zombie_ids = [x for x in sess_ids_now if x not in sess_ids]
                    for sess_id in zombie_ids:
                        self.redis.l_rem(name='user_sess_ids;' + user_id, data=sess_id)

                    # just in case, cleanup any remaining widgets
                    if len(sess_ids_now) == len(zombie_ids):
                        widget_ids = self.redis.l_get('user_widgets;' + user_id)
                        for widget_id in widget_ids:
                            self.redis.h_del(name='all_widgets', key=widget_id)
                            if widget_id in __old_SocketManager__.widget_inits:
                                __old_SocketManager__.widget_inits.pop(widget_id, None)

                        self.redis.delete('user_sess_ids;' + user_id)
                        self.redis.delete('user_widgets;' + user_id)
                        self.redis.h_del(name='active_widget', key=user_id)
                        self.redis.l_rem(name='user_ids', data=user_id)

                if not self.redis.exists('user_ids'):
                    break

            sleep(self.cleanup_sleep)

        self.clear_coroutine_group('shared_coroutine')
        # self.set_coroutine_state('shared_coroutine', 'cleanup', False)
        # self.set_coroutine_state('shared_coroutine', 'sess_heartbeat', False)
        # self.set_coroutine_state('shared_coroutine', 'pubsub_socket_evt_widgets', False)

        self.log.info([['y', ' - ending shared_coroutine('], ['g', 'cleanup']])

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
#
# ------------------------------------------------------------------
class ClockSimDecorator():
    def __init__(self, socket_manager, *args, **kwargs):
        self.socket_manager = socket_manager
        self.log = self.socket_manager.log
        self.redis = self.socket_manager.redis

        setattr(
            self.socket_manager,
            'on_get_sim_clock_sim_params',
            self.on_get_sim_clock_sim_params,
        )

        setattr(
            self.socket_manager,
            'on_set_sim_clock_sim_params',
            self.on_set_sim_clock_sim_params,
        )

        coroutine_info = {
            'id': -1,
            'group': 'shared_coroutine',
            'tag': 'clock_sim_sim_params',
        }
        if self.socket_manager.check_coroutine_loop(coroutine_info):
            coroutine_info['id'] = self.socket_manager.set_coroutine_state(
                coroutine_info['group'], coroutine_info['tag'], True
            )

            gevent.spawn(self.update_sim_params, coroutine_info)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def on_get_sim_clock_sim_params(self, data_in):
        sess_id = data_in['sess_id']

        data = self.redis.get('clock_sim_sim_params', packed=True)
        emit_data = {'data': data}

        # send the requested data back to the same session
        self.socket_manager.socket_event_widgets(
            event_name='get_sim_clock_sim_params',
            sess_ids=[sess_id],
            data=emit_data,
        )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def on_set_sim_clock_sim_params(self, data_in):
        data_pubsub = data_in['data']

        self.redis.publish(
            channel='clock_sim_set_sim_params',
            message=data_pubsub,
            packed=True,
        )

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def update_sim_params(self, coroutine_info):
        self.log.info([
            ['y', ' - starting shared_coroutine('],
            ['g', 'clock_sim_sim_params'],
            ['y', ') - ', self.socket_manager.server_name],
        ])

        # setup the channel once
        pubsub_tag = 'clock_sim_updated_sim_params'
        while self.redis.set_pubsub(pubsub_tag) is None:
            sleep(0.1)

        while self.socket_manager.check_coroutine_loop(coroutine_info):
            msg = self.redis.get_pubsub(pubsub_tag, packed=True)
            if msg is None:
                continue

            # get the full data structure
            data = self.redis.get('clock_sim_sim_params', packed=True)
            emit_data = {'data': data}

            # send the updated value to all sessions
            self.socket_manager.socket_event_widgets(
                event_name='get_sim_clock_sim_params',
                data=emit_data,
            )

            sleep(0.1)

        return
