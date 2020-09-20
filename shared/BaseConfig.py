from random import Random
from datetime import datetime

from shared.LogParser import LogParser


# ------------------------------------------------------------------
class BaseConfig():
    is_active = False

    # initialize the color dict (may choose not to use colors here)
    use_log_title = False
    add_msg_ele_space = False

    no_sub_arr_name = 'empty_sub_array'
    inst_pos_0 = [0, 90]

    # rnd_seed_const = get_rnd_seed()
    rnd_seed_const = 9897324
    rnd_gen = Random(rnd_seed_const)

    rnd_seed_unique = (datetime.utcnow() - datetime.utcfromtimestamp(0)).total_seconds()
    rnd_seed_unique = int(float(str(rnd_seed_unique * 1e6)[-10:]))
    rnd_gen_unique = Random(rnd_seed_unique)

    datetime_epoch = datetime.utcfromtimestamp(0)

    time_str_formats = {
        'date': '%Y-%m-%d',
        'time': '%H:%M:%S',
    }

    # ------------------------------------------------------------------
    def __init__(
        self,
        site_type,
        redis_port,
        app_port,
        app_prefix,
        app_host,
        log_level,
        websocket_route,
        debug_opts,
        is_simulation,
        allow_panel_sync=None,
        widget_info=None,
        allowed_widget_types=None,
        *args,
        **kwargs
    ):
        if BaseConfig.is_active:
            raise ValueError('Can not instantiate BaseConfig more than once...')
        else:
            self.is_active = True

        self.site_type = site_type
        self.redis_port = redis_port
        self.app_port = app_port
        self.app_host = app_host
        self.log_level = log_level
        self.app_prefix = app_prefix
        self.websocket_route = websocket_route
        self.allow_panel_sync = allow_panel_sync
        self.is_simulation = is_simulation
        self.debug_opts = debug_opts

        # make sure each server has a unique rnadom seed (since multiple servers
        # may be started at the same time)
        rnd_seed = int(self.app_port) + BaseConfig.rnd_gen_unique.randint(1, int(1e7))
        self.set_rnd_seed(rnd_seed)

        # for safety, make sure registered widgets can be requested by the client
        # e.g., expect a module file named 'AAA.py', containing a class AAA
        if allowed_widget_types is not None:
            BaseConfig.allowed_widget_types = allowed_widget_types
        else:
            BaseConfig.allowed_widget_types = dict()

        # list here all views, which use the shared view function
        # these would eg be mapped to: [ http://localhost:8090/cta/view200 ]
        if widget_info is not None:
            BaseConfig.widget_info = widget_info
        else:
            BaseConfig.widget_info = []

        return

    # ------------------------------------------------------------------
    def set_rnd_seed(self, rnd_seed):
        BaseConfig.rnd_seed_unique = rnd_seed
        BaseConfig.rnd_gen_unique = Random(rnd_seed)
        return
