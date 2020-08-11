# make sure we have the local acs modules of the gui
import os, sys
base_ACS_dir = os.path.dirname(os.getcwd()) + '/acs'
if base_ACS_dir not in sys.path:
    sys.path.append(base_ACS_dir)

# my specialized logging interface - important to init the
# logger vefore importing any ACS ?
from ctaGuiUtils.py.server_args import parse_args
from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.BaseConfig import BaseConfig

# import the utils module to allow access to utils.app_prefix
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.ClockSim import ClockSim
from ctaGuiUtils.py.InstData import InstData
from ctaGuiUtils.py.utils import has_acs

from ctaGuiBack.py.MockTarget import MockTarget
from ctaGuiBack.py.InstHealth import InstHealth
from ctaGuiBack.py.InstPos import InstPos
from ctaGuiBack.py.Scheduler import SchedulerACS, SchedulerStandalone


class Manager():
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs

    def run_server(self, evt):
        try:
            app_name = 'ctaGuiBack'
            settings = parse_args(app_name=app_name)

            # the app name (corresponding to the directory name)
            app_name = settings['app_name']
            # southern or northen CTA sites have different telescope configurations
            site_type = settings['site_type']
            # the address for the site
            app_host = settings['app_host']
            # local log file location
            log_file = settings['log_file']
            # logging level
            log_level = settings['log_level']
            # the port for the site
            app_port = settings['app_port']
            # the redis port use for this site
            redis_port = settings['redis_port']
            # define the prefix to all urls (must be non-empy string)
            app_prefix = settings['app_prefix']
            # global setting to allow panel syncronization
            allow_panel_sync = bool(settings['allow_panel_sync'])
            # is this a simulation
            is_simulation = settings['is_simulation']
            # development mode
            is_HMI_dev = settings['is_HMI_dev']
            # do we flush redis on startup
            do_flush_redis = settings['do_flush_redis']

            # ------------------------------------------------------------------
            # instantiate the general settings class (must come first!)
            # ------------------------------------------------------------------
            base_config = BaseConfig(
                site_type=site_type,
                redis_port=redis_port,
                app_port=app_port,
                app_prefix=app_prefix,
                app_host=app_host,
                websocket_route=None,
                allow_panel_sync=None,
                is_HMI_dev=is_HMI_dev,
                is_simulation=is_simulation,
            )

            log = LogParser(
                base_config=base_config,
                title=__name__,
                log_level=log_level,
                log_file=log_file,
            )
            log.info([['wg', ' - Starting pyramid app -', app_name, '...']])
            log.info([['c', ' - has_acs = '], [('g' if has_acs else 'r'), has_acs]])


            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads
            # check log levels ; finish all back-threads


            
            # # ------------------------------------------------------------------
            # # start the time_of_night clock (to be phased out....)
            # utils.time_of_night(base_config=base_config)
            # # ------------------------------------------------------------------

            # ---------------------------------------------------------------------------
            clock_sim = ClockSim(base_config=base_config, evt=evt)
            clock_sim.run_threads()


            
            # InstData(base_config=base_config)

            # InstHealth(base_config=base_config)
            # InstPos(base_config=base_config)
            # MockTarget(base_config=base_config)

            # if utils.has_acs:
            #     SchedulerACS(base_config=base_config)
            # else:
            #     SchedulerStandalone(base_config=base_config)

            # settings_log = [['g', ' - server settings:\n']]
            # for k,v in settings.items():
            #     settings_log += [['b', str(k)], [': ']]
            #     settings_log += [['c', str(v)], [',  ']]
            # log.info(settings_log)

            # # do_flush_redis = True
            # if do_flush_redis:
            #     from ctaGuiUtils.py.RedisManager import RedisManager
            #     log.warn([['wr', ' ---- flusing redis ... ----']])
            #     _redis = RedisManager(name='_init_', port=redis_port, log=log)
            #     _redis.redis.flushall()

            return
        
        except KeyboardInterrupt:
            evt.set()
            pass
        
        except Exception as e:
            log.info([['c', e]])
            raise e

