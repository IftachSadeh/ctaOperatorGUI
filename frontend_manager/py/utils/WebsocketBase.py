import asyncio
from random import Random

from shared.utils import get_time
from shared.utils import get_rnd
from shared.utils import get_rnd_seed
from shared.LogParser import LogParser
from shared.LockManager import LockManager
from shared.RedisManager import RedisManager


# ------------------------------------------------------------------
class WebsocketBase():
    """common dictionaries for all instances of the
       class (keeping track of all sessions etc.)
    """

    serv_id = None
    n_serv_sess = 0

    managers = dict()
    widget_inits = dict()

    # ------------------------------------------------------------------
    def __init__(self, ws_send, *args, **kwargs):
        self.ws_send = ws_send

        self.sess_id = None
        self.user_id = None
        self.sess_name = None
        self.user_group = None
        self.user_group_id = None

        self.has_init_sess = False
        self.is_sess_offline = True
        self.is_sess_open = False
        self.log_send_packet = False
        self.sess_ping_time = None

        self.basic_widget_sleep_sec = 1
        self.sess_expire = 10
        self.cleanup_sleep = 60
        self.valid_loop_sleep_sec = 0.01
        self.n_id_digits = 4
        self.n_serv_msg = 0

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

        self.widget_module_dir = 'frontend_manager.py.widgets'

        self.loop_prefix = 'ws;loop;'
        self.heartbeat_prefix = 'ws;heartbeat;'
        self.sync_group_prefix = 'grp_'
        self.icon_prefix = 'icn_'

        self.asyncio_queue = asyncio.Queue()

        self.log = LogParser(base_config=self.base_config, title=__name__)

        self.allowed_widget_types = self.base_config.allowed_widget_types
        self.redis_port = self.base_config.redis_port
        self.site_type = self.base_config.site_type
        self.allow_panel_sync = self.base_config.allow_panel_sync
        self.is_simulation = self.base_config.is_simulation

        self.redis = RedisManager(
            name=self.__class__.__name__, base_config=self.base_config, log=self.log
        )

        rnd_seed = get_rnd_seed()
        self.rnd_gen = Random(rnd_seed)

        self.inst_data = self.base_config.inst_data

        if WebsocketBase.serv_id is None:
            self.set_server_id()

        # setup the locker for this server
        self.locker = self.setup_locker()

        # update the lock_namespace (after the session id has been set, maybe
        # later other session parameters would be needed?)
        self.update_lock_namespace()

        return

    # ------------------------------------------------------------------
    def setup_locker(self):
        # prefix for all lock names in redis
        lock_prefix = 'ws;lock;'

        # dynamic lock names, based on the current properties
        lock_namespace = {
            'loop_state':
            lambda: 'loop_state;serv' + str(self.serv_id),
            'serv':
            lambda: 'serv;' + str(self.serv_id),
            'user':
            lambda: 'serv;' + str(self.serv_id) + ';user;' + str(self.user_id),
            'sess':
            lambda: 'serv;' + str(self.serv_id) + ';sess;' + str(self.sess_id),
            'sess_redis':
            lambda: 'redis;serv' + str(self.serv_id) + ';sess' + str(self.sess_id),
        }

        self.get_widget_lock_name = (
            lambda name: 'widget;' + str(name) + ';serv;' + self.serv_id
        )

        # after setting up redis, initialise the lock manager
        locker = LockManager(
            log=self.log,
            redis=self.redis,
            base_config=self.base_config,
            lock_namespace=lock_namespace,
            lock_prefix=lock_prefix,
            is_passive=True,
        )

        # name of lock for sess configuration
        self.sess_config_lock = 'sess_config_lock'
        # name of lock for cleanup loop
        self.cleanup_loop_lock = 'cleanup_loop_lock'
        # maximal time to keep the lock for a session to configure
        # (init or cleanup), in case nominal cleanup fails
        self.sess_config_expire_sec = 100
        # same for the cleanup loop
        self.cleanup_loop_expire_sec = 100

        return locker

    # ------------------------------------------------------------------
    def update_lock_namespace(self):
        """after the session id has been set, update the widget locks
        """

        lock_namespace = {}
        # add all registered widget types as possible locks
        widget_types = []
        for values in self.allowed_widget_types.values():
            widget_types += values

        # the lambda must be executed for the correct value to be taken
        def build_lambda(name):
            return (lambda: name)

        for widget_type in widget_types:
            lock_name = self.get_widget_lock_name(widget_type)
            lock_namespace[lock_name] = build_lambda(lock_name)

        self.locker.locks.update_lock_namespace(lock_namespace)

        return

    # ------------------------------------------------------------------
    async def add_server_attr(self, name, key, value):
        self.locker.locks.validate('serv')
        attr = getattr(WebsocketBase, name)
        attr[key] = value

        return

    # ------------------------------------------------------------------
    async def remove_server_attr(self, name, key):
        self.locker.locks.validate('serv')
        attr = getattr(WebsocketBase, name)
        attr.pop(key, None)

        return

    # ------------------------------------------------------------------
    async def get_server_attr(self, name):
        self.locker.locks.validate('serv')
        attr = getattr(WebsocketBase, name)

        return attr

    # ------------------------------------------------------------------
    def set_server_id(self):
        """derive a server id

           it is mandatory to have unique ids across servers, and so
           a randome number generator is used. for deployment,
           a larger a date/time msec prefix can be used
        """

        WebsocketBase.serv_id = (
            'serv_' + str(self.base_config.app_port) + '_'
            + get_rnd(n_digits=self.n_id_digits, out_type=str, is_unique_seed=True)
        )

        return

    # ------------------------------------------------------------------
    async def set_sess_id(self):
        """derive a session id

           in order to make sure we have unique ids across servers, the
           unique server name is included, supplemented by an incremental
           counter for sessions for this server
        """

        id_str = '{:0' + str(self.n_id_digits) + 'd}'

        with self.locker.locks.acquire('serv'):
            self.sess_id = (
                self.serv_id + '_sess_' + id_str.format(WebsocketBase.n_serv_sess)
            )
            WebsocketBase.n_serv_sess += 1

        return


# ------------------------------------------------------------------
# ------------------------------------------------------------------
# ------------------------------------------------------------------
# ------------------------------------------------------------------
class __old_SocketManager__():
    # serv_id = None

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
        #     name=self.__class__.__name__, base_config=self.base_config, log=self.log
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
        #     if __old_SocketManager__.serv_id is None:
        #         __old_SocketManager__.serv_id = 'server_' + get_rnd(n_digits=10, out_type=str)

        # sess_ids_now = self.redis.s_get('ws;all_sess_ids')
        # for sess_id in sess_ids_now:
        #   self.cleanup_session(sess_id)
        # self.redis.delete('ws;all_user_ids')
        # self.redis.delete('ws;widget_info')

        return

    # # ------------------------------------------------------------------
    # # upon any new connection
    # # ------------------------------------------------------------------
    # def recv_connect(self):
    #     serv_id = __old_SocketManager__.serv_id
    #     tel_ids = self.inst_data.get_inst_ids()
    #     tel_id_to_types = self.inst_data.get_inst_id_to_types()
    #     categorical_types = self.inst_data.get_categorical_types()

    #     self.emit(
    #         'initial_connect', {
    #             'serv_id': serv_id,
    #             'tel_ids': tel_ids,
    #             'tel_id_to_types': tel_id_to_types,
    #             'categorical_types': categorical_types,
    #         }
    #     )
    #     return

    # # ------------------------------------------------------------------
    # # upon reconnection to an existing session
    # # ------------------------------------------------------------------
    # def on_back_from_offline(self, data):
    #     if self.sess_id is None:
    #         return

    #     # print 'on_back_from_offline.................'
    #     # first validate that eg the server hasnt been restarted while this session has been offline
    #     sess_ids = self.redis.s_get('ws;all_sess_ids')
    #     serv_id = __old_SocketManager__.serv_id if self.sess_id in sess_ids else ''

    #     self.emit('reconnect', {'serv_id': serv_id})

    #     # now run any widget specific functions
    #     with __old_SocketManager__.lock:
    #         widget_ids = self.redis.s_get('ws;sess_widget_ids;' + self.sess_id)
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
    #         ['y', __old_SocketManager__.serv_id, ''],
    #         ['p', self.user_group_id, ''],
    #         ['y', self.user_id, ''],
    #         ['p', self.user_group_id, ''],
    #         ['y', self.sess_id, ''],
    #         ['p', self.sess_name, ''],
    #         ['y', self.ns_name, ''],
    #     ])

    #     with __old_SocketManager__.lock:
    #         all_user_ids = self.redis.s_get('ws;all_user_ids')
    #         if self.user_id not in all_user_ids:
    #             self.redis.s_add(name='ws;all_user_ids', data=self.user_id)

    #         # ------------------------------------------------------------------
    #         # all session ids in one list (heartbeat should be first to
    #         # avoid cleanup racing conditions!)
    #         # ------------------------------------------------------------------
    #         self.redis.set(
    #             name='sess_heartbeat;' + self.sess_id, expire_sec=(int(self.sess_expire) * 2)
    #         )
    #         self.redis.s_add(name='ws;all_sess_ids', data=self.sess_id)

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
    #         self.redis.s_add(name='ws;user_sess_ids;' + self.user_id, data=self.sess_id)

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
    #         has_widget_id = self.redis.h_exists(name='ws;widget_info', key=widget_id)

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

    #                     widget_info = self.redis.h_m_get(
    #                         name='ws;widget_info', key=widget_ids, filter=True
    #                     )
    #                     n_icons = [x['n_icon'] for x in widget_info]

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
    #                 name='ws;widget_info', key=widget_id, data=widget_now
    #             )
    #             self.redis.r_push(name='ws;user_widget_ids;' + self.user_id, data=widget_id)
    #             self.redis.s_add(name='ws;sess_widget_ids;' + self.sess_id, data=widget_id)

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
    #         widget_ids = self.redis.s_get('ws;sess_widget_ids;' + self.sess_id)
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
    #         widget_info = self.redis.h_get_all(name='ws;widget_info', default_val={})
    #         for widget_id, widget_now in widget_info.items():
    #             if widget_now['n_icon'] == -1 and widget_id in __old_SocketManager__.widget_inits:
    #                 widget_ids.append(widget_id)

    #     for widget_id in widget_ids:
    #         getattr(__old_SocketManager__.widget_inits[widget_id], 'update_sync_groups')()

    #     return

    # # ------------------------------------------------------------------
    # def on_sync_state_send(self, data_in):
    #     if not self.check_panel_sync():
    #         return
    #     if 'widget_id' not in data_in:
    #         return
    #     if not self.redis.h_exists(name='ws;active_widget', key=self.user_id):
    #         return
    #     all_sync_ids = []
    #     with __old_SocketManager__.lock:
    #         if self.redis.h_get(name='ws;active_widget',
    #                             key=self.user_id) != data_in['widget_id']:
    #             return

    #         sync_groups = self.redis.h_get(
    #             name='ws;sync_groups', key=self.user_id, default_val=[]
    #         )

    #         for sync_group in sync_groups:
    #             states_0 = [i[0] for i in sync_group['sync_states'][0]]
    #             states_1 = [i[0] for i in sync_group['sync_states'][1]]
    #             states_2 = [i[0] for i in sync_group['sync_states'][2]]

    #             get_states = states_0 + states_2
    #             do_send = (
    #                 data_in['widget_id'] in states_0 or data_in['widget_id'] in states_1
    #             )
    #             if do_send:
    #                 sync_group['sync_types'][data_in['type']] = data_in['data']

    #                 for id_now in get_states:
    #                     if (id_now != data_in['widget_id']
    #                             and id_now not in all_sync_ids):
    #                         all_sync_ids.append(id_now)

    #         self.redis.h_set(name='ws;sync_groups', key=self.user_id, data=sync_groups)
    #     data = {
    #         'widget_id': data_in['widget_id'],
    #         'type': data_in['type'],
    #         'data': data_in['data']
    #     }
    #     self.socket_event_widgets(
    #         event_name='update_sync_state', data=data, widget_ids=all_sync_ids
    #     )

    #     return

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
            while (asy_func_id == self.get_asy_func_id(widget.widget_group,
                                                       asy_func_group)):
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
                    sess_ids = self.redis.s_get('ws;all_sess_ids')

                if self.log_send_packet:
                    self.log.info([[
                        'b', 'start ' + event_name + '  --> ' + lts(sess_ids)
                    ]])
                    self.log.info([[
                        'b', 'start ' + event_name + '  --> ' + '[' +
                        (',').join(sess_ids) + ']'
                    ]])

                user_sess_ids = self.redis.s_get('ws;user_sess_ids;' + self.user_id)
                sess_ids = [
                    x for x in sess_ids
                    if (x in self.socket.server.sockets and x in user_sess_ids)
                ]

                for sess_id in sess_ids:
                    ids = self.redis.s_get('ws;sess_widget_ids;' + sess_id)
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
    #         sess_ids = self.redis.s_get('ws;all_sess_ids')
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

        sess_ids = self.redis.s_get('ws;all_sess_ids')
        if (self.sess_name != '') and (self.sess_id in sess_ids):
            self.on_leave_session()

        self.disconnect(silent=True)
        return

    # # ------------------------------------------------------------------
    # # on leaving the session
    # # ------------------------------------------------------------------
    # def on_leave_session(self):
    #     with __old_SocketManager__.lock:
    #         sess_ids_now = self.redis.s_get('ws;user_sess_ids;' + self.user_id)
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
    #         widget_ids = self.redis.s_get('ws;sess_widget_ids;' + self.sess_id)
    #         sync_groups = self.redis.h_get(
    #             name='ws;sync_groups', key=self.user_id, default_val=[]
    #         )

    #         for widget_id in widget_ids:
    #             self.redis.h_del(name='ws;widget_info', key=widget_id)

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
    #         ['b', ' - cleanup_session sessionId(', __old_SocketManager__.serv_id, ') '],
    #         ['p', sess_id],
    #     ])

    #     all_user_ids = self.redis.s_get('ws;all_user_ids')
    #     widget_ids = self.redis.s_get('ws;sess_widget_ids;' + sess_id)

    #     for user_id in all_user_ids:
    #         self.redis.s_rem(name='ws;user_sess_ids;' + user_id, data=sess_id)

    #     for widget_id in widget_ids:
    #         self.log.info([[
    #             'b', ' - cleanup_session widget_id (', __old_SocketManager__.serv_id, ') '
    #         ], ['p', widget_id]])

    #         self.redis.h_del(name='ws;widget_info', key=widget_id)
    #         if widget_id in __old_SocketManager__.widget_inits:
    #             __old_SocketManager__.widget_inits.pop(widget_id, None)
    #         for user_id in all_user_ids:
    #             self.redis.l_rem(name='ws;user_widget_ids;' + user_id, data=widget_id)

    #     self.redis.delete('ws;sess_widget_ids;' + sess_id)
    #     self.redis.delete('sess_heartbeat;' + sess_id)
    #     self.redis.s_rem(name='ws;all_sess_ids', data=sess_id)

    #     if sess_id in __old_SocketManager__.sess_endpoints:
    #         __old_SocketManager__.sess_endpoints.pop(sess_id, None)

    #     return

    # # ------------------------------------------------------------------
    # # renew session heartbeat token (run in asy_func) for all active sessions
    # # ------------------------------------------------------------------
    # def sess_heartbeat(self, loop_info):
    #     self.log.info([['y', ' - starting shared_asy_func('], ['g', 'sess_heartbeat'],
    #                    ['y', ') - ', __old_SocketManager__.serv_id]])

    #     sleep_sec = max(ceil(self.sess_expire * 0.1), 10)
    #     sess_expire = int(max(self.sess_expire, sleep_sec * 2))

    #     while self.is_valid_asy_func(loop_info):
    #         with __old_SocketManager__.lock:
    #             sess_ids = self.redis.s_get('ws;all_sess_ids')
    #             sess_ids = [x for x in sess_ids if x in self.socket.server.sockets]

    #             for sess_id in sess_ids:
    #                 if self.redis.exists('sess_heartbeat;' + sess_id):
    #                     self.redis.expire_sec(
    #                         name='sess_heartbeat;' + sess_id, expire_sec=sess_expire
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
                       ['y', ') - ', __old_SocketManager__.serv_id]])
        sleep(3)

        while self.is_valid_asy_func(loop_info):
            with __old_SocketManager__.lock:
                all_user_ids = self.redis.s_get('ws;all_user_ids')
                sess_ids = self.redis.s_get('ws;all_sess_ids')

                for sess_id in sess_ids:
                    if not self.redis.exists('sess_heartbeat;' + sess_id):
                        self.cleanup_session(sess_id)

                sess_ids = self.redis.s_get('ws;all_sess_ids')
                for user_id in all_user_ids:
                    sess_ids_now = self.redis.s_get('ws;user_sess_ids;' + user_id)
                    zombie_ids = [x for x in sess_ids_now if x not in sess_ids]
                    for sess_id in zombie_ids:
                        self.redis.s_rem(name='ws;user_sess_ids;' + user_id, data=sess_id)

                    # just in case, cleanup any remaining widgets
                    if len(sess_ids_now) == len(zombie_ids):
                        widget_ids = self.redis.l_get('ws;user_widget_ids;' + user_id)
                        for widget_id in widget_ids:
                            self.redis.h_del(name='ws;widget_info', key=widget_id)
                            if widget_id in __old_SocketManager__.widget_inits:
                                __old_SocketManager__.widget_inits.pop(widget_id, None)

                        self.redis.delete('ws;user_sess_ids;' + user_id)
                        self.redis.delete('ws;user_widget_ids;' + user_id)
                        self.redis.h_del(name='ws;active_widget', key=user_id)
                        self.redis.s_rem(name='ws;all_user_ids', data=user_id)

                if not self.redis.exists('ws;all_user_ids'):
                    break

            sleep(self.cleanup_sleep)

        self.clear_asy_func_group('shared_asy_func')
        # self.set_asy_func_state('shared_asy_func', 'cleanup', False)
        # self.set_asy_func_state('shared_asy_func', 'sess_heartbeat', False)
        # self.set_asy_func_state('shared_asy_func', 'pubsub_socket_evt_widgets', False)

        self.log.info([['y', ' - ending shared_asy_func('], ['g', 'cleanup']])

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
