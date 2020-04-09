from random import Random
from datetime import datetime

from ctaGuiUtils.py.LogParser import LogParser


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
class BaseConfig():
    is_active = False

    # ------------------------------------------------------------------
    # initialize the color dict (may choose not to use colors here)
    # ------------------------------------------------------------------
    # use_log_title = False if os.uname()[1] == 'sadehMac' else True
    use_log_title = False
    add_msg_ele_space = False

    no_sub_arr_name = 'empty_sub_array'
    inst_pos_0 = [0, 90]

    # rnd_seed = get_rnd_seed()
    rnd_seed = 9897324
    rnd_gen = Random(rnd_seed)

    datetime_epoch = datetime.utcfromtimestamp(0)

    # userName = os.getlogin()
    # redis_port = dict()
    # redis_port = 6379
    # #  ugly temporery hack for development:
    # if userName == 'verdingi':
    #   has_acs = False
    #   redis_port += 1

    # ------------------------------------------------------------------
    # for safety, make sure registered widgets can be requested by the client
    # e.g., expect a module file named 'AAA.py', containing a class AAA
    allowed_widget_types = {
        'synced': [
            'ArrZoomerView',
            'PlotsDash',
            'SubArrGrp',
            'telPntSky',
            'SchedBlocks',
            'NightSched',
            'inst_pos_0',
            'ObsBlockControl',
            'EmptyExample',
            'CommentSched',
            'SchedBlockController',
            'SchedBlockInspector',
            'WeatherMonitoring',
        ],
        'not_synced': [
            'PanelSync',
        ]
    }

    # list here all views, which use the shared view function
    # these would eg be mapped to: [ http://localhost:8090/cta/view200 ]
    all_widgets = [
        'view102',
        'view000',
        'view_refresh_all',
        'view200',
        'view201',
        'view202',
        'view203',
        'view204',
        'view205',
        'view206',
        'view207',
    ]

    time_str_formats = {
        'date': '%Y-%m-%d',
        'time': '%H:%M:%S',
    }

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def __init__(
        self,
        is_simulation,
        site_type,
        redis_port,
        app_prefix=None,
        allow_panel_sync=None,
        *args,
        **kwargs
    ):
        if BaseConfig.is_active:
            raise ValueError('Can not instantiate BaseConfig more than once...')
        else:
            self.is_active = True

        # self.log = LogParser(base_config=self, title=__name__)
        # self.log.info([['y', " - BaseConfig - "]])

        self.site_type = site_type
        self.redis_port = redis_port
        self.app_prefix = app_prefix
        self.allow_panel_sync = allow_panel_sync

        return
