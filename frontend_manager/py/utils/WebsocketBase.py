import asyncio
from random import Random
from math import ceil

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

        # is it allowed to restore sessions as part of development
        # or do we always reload web pages on server reloads
        self.can_restore_existing_sess = True
        # self.can_restore_existing_sess = False

        # debug the setup / restoration of sync groups
        self.debug_sync_group = False
        # self.debug_sync_group = True
        self.debug_sync_group = (
            self.debug_sync_group and self.base_config.debug_opts['dev']
        )

        # validate all session widgets on every few seconds
        self.validate_widget_time_sec = 0
        self.min_validate_widget_time_sec = 10

        self.valid_loop_sleep_sec = 0.01
        self.basic_widget_sleep_sec = 1
        self.sess_expire_sec = 15
        self.serv_expire_sec = 30
        self.user_expire_sec = 43200
        self.widget_expire_sec = self.user_expire_sec
        self.cleanup_sleep_sec = 60

        self.n_id_digits = 4
        self.n_serv_msg = 0

        # session ping/pong heartbeat
        self.sess_ping = {
            # interval for sending ping/pong events
            'send_interval_msec': 2500,
            # how much delay is considered ok for a slow session
            'max_interval_good_msec': 500,
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
        self.util_module_dir = 'frontend_manager.py.utils'

        self.loop_prefix = 'ws;loop;'
        self.heartbeat_prefix = 'ws;heartbeat;'

        self.sync_group_id_prefix = 'grp_'
        self.sync_group_title_prefix = 'Group '

        self.icon_prefix = 'icn_'

        self.asyncio_queue = asyncio.Queue()

        self.log = LogParser(base_config=self.base_config, title=__name__)

        self.allowed_widget_types = self.base_config.allowed_widget_types
        self.all_widget_types = [
            a for a in (
                self.base_config.allowed_widget_types['synced']
                + self.base_config.allowed_widget_types['not_synced']
            )
        ]

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
            'loop_state': lambda: 'loop_state;serv' + str(self.serv_id),
            'serv': lambda: 'serv;' + str(self.serv_id),
            'user': lambda: 'serv;' + str(self.serv_id) + ';user;' + str(self.user_id),
            'sess': lambda: 'serv;' + str(self.serv_id) + ';sess;' + str(self.sess_id),
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
        self.expires_sec = {
            'sess_config_expire': 25,
            # same for the cleanup loop
            'cleanup_loop_expire': 30,
            # same for widget initialisations
            'widget_init_expire': 25,
        }

        return locker

    # ------------------------------------------------------------------
    def get_expite_sec(self, name, is_lock_check=False):
        expire_sec = self.expires_sec[name]
        if is_lock_check:
            expire_sec = max(1, ceil(expire_sec * 0.9)),
        return expire_sec

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
