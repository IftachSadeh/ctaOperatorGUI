# import ctaGuiUtils
# from ctaGuiUtils.py.utils import LogParser

# make sure we have the local acs modules of the gui
import os, sys
base_ACS_dir = os.path.dirname(os.getcwd()) + '/acs'
if base_ACS_dir not in sys.path:
    sys.path.append(base_ACS_dir)

# my specialized logging interface - important to init the
# logger vefore importing any ACS ?
from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.BaseConfig import BaseConfig

# import the utils module to allow access to utils.app_prefix
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.ClockSim import ClockSim
from ctaGuiUtils.py.InstData import InstData

from ctaGuiBack.py.MockTarget import MockTarget
from ctaGuiBack.py.InstHealth import InstHealth
from ctaGuiBack.py.InstPos import InstPos
from ctaGuiBack.py.Scheduler import SchedulerACS, SchedulerStandalone


def main(global_config, **settings):
    # Northers or Southern site
    site_type = settings['site_type']
    # is this a simulation
    is_simulation = settings['is_simulation']
    # port for the redis database
    redis_port = settings['redis_port']

    # ------------------------------------------------------------------
    # ------------------------------------------------------------------
    # for debugging....
    flush_redis_on_start = 0
    if flush_redis_on_start:
        from ctaGuiBack.py.RedisManager import RedisManager
        redis_ = RedisManager(name='__init__', port=redis_port)
        redis_.redis.flushall()
    # ------------------------------------------------------------------
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # instantiate the general settings class (must come first!)
    # ------------------------------------------------------------------
    base_config = BaseConfig(
        is_simulation=is_simulation,
        site_type=site_type,
        redis_port=redis_port,
    )

    log = LogParser(base_config=base_config, title=__name__)
    log.info([['wg', ' - Starting redis-filler - ctaGuiBack ...']])
    log.info([['p', ' - utils.has_acs = '],
              [('g' if utils.has_acs else 'r'), utils.has_acs]])

    # ------------------------------------------------------------------
    # start the time_of_night clock (to be phased out....)
    utils.time_of_night(base_config=base_config)
    # ------------------------------------------------------------------

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    ClockSim(base_config=base_config)
    InstData(base_config=base_config)

    InstHealth(base_config=base_config)
    InstPos(base_config=base_config)
    MockTarget(base_config=base_config)

    if utils.has_acs:
        SchedulerACS(base_config=base_config)
    else:
        SchedulerStandalone(base_config=base_config)

    return
