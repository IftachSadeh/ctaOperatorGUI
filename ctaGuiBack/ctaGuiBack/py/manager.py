# make sure we have the local acs modules of the gui
import os, sys
base_ACS_dir = os.path.dirname(os.getcwd()) + '/acs'
if base_ACS_dir not in sys.path:
    sys.path.append(base_ACS_dir)

import importlib
import traceback

# my specialized logging interface - important to init the
# logger vefore importing any ACS ?
from ctaGuiUtils.py.server_args import parse_args
from ctaGuiUtils.py.LogParser import LogParser


# import ctaGuiUtils.py.LogParser as _LogParser
# importlib.reload(_LogParser)
# LogParser = _LogParser.LogParser


from ctaGuiUtils.py.ThreadManager import ThreadManager
from ctaGuiUtils.py.BaseConfig import BaseConfig

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.ClockSim import ClockSim
from ctaGuiUtils.py.InstData import InstData
from ctaGuiUtils.py.utils import has_acs

from ctaGuiBack.py.MockTarget import MockTarget
from ctaGuiBack.py.InstHealth import InstHealth
from ctaGuiBack.py.InstPos import InstPos
from ctaGuiBack.py.Scheduler import SchedulerACS
from ctaGuiBack.py.Scheduler import SchedulerStandalone


# ---------------------------------------------------------------------------
class Manager():
    # ---------------------------------------------------------------------------
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs

        return

    # ---------------------------------------------------------------------------
    def run_server(self, interrupt_sig):
        log = None
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
                log_level=log_level,
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
            log.info([['g', ' - starting services for '], ['y', app_name], ['g', ' ...']])
            log.info([['c', ' - has_acs = '], [('g' if has_acs else 'r'), has_acs]])

            # do_flush_redis = True
            if do_flush_redis:
                from ctaGuiUtils.py.RedisManager import RedisManager
                log.warn([['wr', ' ---- flusing redis ... ----']])
                _redis = RedisManager(name='_init_', port=redis_port, log=log)
                _redis.redis.flushall()

            
            # ------------------------------------------------------------------
            # start the time_of_night clock (to be phased out....)
            time_of_night = utils.time_of_night(base_config=base_config, interrupt_sig=interrupt_sig)
            # ------------------------------------------------------------------

            ClockSim(base_config=base_config, interrupt_sig=interrupt_sig)

            InstData(base_config=base_config)
            
            InstHealth(base_config=base_config, interrupt_sig=interrupt_sig)

            InstPos(base_config=base_config, interrupt_sig=interrupt_sig)

            MockTarget(base_config=base_config)
            if utils.has_acs:
                raise Exception('threading has not been properly updated for the acs version....')
                SchedulerACS(base_config=base_config, interrupt_sig=interrupt_sig)
            else:
                SchedulerStandalone(base_config=base_config, interrupt_sig=interrupt_sig)


            

            # after initialising all classes, start the threads
            thread_manager = ThreadManager(base_config=base_config, interrupt_sig=interrupt_sig)
            thread_manager.run_threads()

            return
        
        except KeyboardInterrupt:
            interrupt_sig.set()
            pass
        
        except Exception as e:
            if log is None:
                print(e)
                traceback.print_tb(e.__traceback__)
            else:
                log.info([['wr', e]])
            raise e

        return
