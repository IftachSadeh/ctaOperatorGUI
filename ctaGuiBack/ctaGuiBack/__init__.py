# import ctaGuiUtils
# from ctaGuiUtils.py.utils import my_log

# make sure we have the local acs modules of the gui
import os, sys
baseGuiAcsDir = os.path.dirname(os.getcwd()) + '/acs'
if baseGuiAcsDir not in sys.path:
    sys.path.append(baseGuiAcsDir)

# my specialized logging interface - important to init the
# logger vefore importing any ACS ....
from ctaGuiUtils.py.utils import my_log
log = my_log(title=__name__)

# import the utils module to allow access to utils.app_prefix
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.InstData import InstData

from ctaGuiBack.py.MockTarget import MockTarget
from ctaGuiBack.py.InstHealth import InstHealth
from ctaGuiBack.py.InstPos import InstPos
from ctaGuiBack.py.ObsBlocks import ObsBlocks, ObsBlocksNoACS
# from ctaGuiBack.py.PubsubTest import PubsubTest
# from ctaGuiBack.py.PropertyMonitor import PropertyMonitorQueue
# from ctaGuiBack.py.PropertyMonitor import PropertyMonitorGlobal
# from ctaGuiBack.py.PropertyMonitor import PropertyMonitorLocal
# from ctaGuiBack.py.SimComponent import SimComp

# if utils.has_acs:
#   from ctaGuiBack.py.TmpTest import TmpTest
# from ctaGuiUtils.py.utils import redis_port


def main(global_config, **settings):
    log.info([['wg', ' - Starting redis-filler - ctaGuiBack ...']])
    log.info([['p', ' - has_acs = '], [('g' if utils.has_acs else 'r'), utils.has_acs]])

    # ------------------------------------------------------------------
    # run it
    # ------------------------------------------------------------------
    utils.site_type = settings['site_type']

    # the redis port use for this site
    utils.redis_port = settings['redis_port']

    my_time_of_night = utils.time_of_night(site_type=utils.site_type)
    clock_sim = utils.ClockSim(site_type=utils.site_type)

    # set the list of telescopes for this particular site
    inst_data = InstData(site_type=utils.site_type)
    # utils.tel_ids = inst_data.tel_ids

    # ------------------------------------------------------------------
    # ------------------------------------------------------------------
    # for debugging....
    flush_redis_on_start = 0
    if flush_redis_on_start:
        from ctaGuiBack.py.RedisManager import RedisManager
        redis_ = RedisManager(name='__init__', port=utils.redis_port)
        redis_.redis.flushall()
    # ------------------------------------------------------------------
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # ------------------------------------------------------------------
    # if utils.has_acs:
    #   TmpTest(site_type=site_type)

    InstHealth(
        site_type=utils.site_type,
        time_of_night=my_time_of_night,
        clock_sim=clock_sim,
        inst_data=inst_data
    )

    InstPos(site_type=utils.site_type, clock_sim=clock_sim, inst_data=inst_data)

    MockTarget(site_type=utils.site_type)

    if utils.has_acs:
        ObsBlocks(
            site_type=utils.site_type,
            time_of_night=my_time_of_night,
            clock_sim=clock_sim,
            inst_data=inst_data
        )
    else:
        ObsBlocksNoACS(
            site_type=utils.site_type,
            time_of_night=my_time_of_night,
            clock_sim=clock_sim,
            inst_data=inst_data
        )

    # # PubsubTest(site_type=utils.site_type)
    # # SimComp(site_type=utils.site_type)
    # # PropertyMonitorQueue(site_type=utils.site_type)
    # # PropertyMonitorGlobal(site_type=utils.site_type)
    # # PropertyMonitorLocal(site_type=utils.site_type)

    return
