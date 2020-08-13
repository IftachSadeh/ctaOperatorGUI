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
from ctaGuiUtils.py.RedisManager import RedisManager

# ---------------------------------------------------------------------------
class Manager():
    # ---------------------------------------------------------------------------
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs

        self.app_name = 'ctaGuiBack'
        settings = parse_args(app_name=self.app_name)

        # # the app name (corresponding to the directory name)
        # self.app_name = settings['app_name']
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
        self.redis_port = settings['redis_port']
        # define the prefix to all urls (must be non-empy string)
        app_prefix = settings['app_prefix']
        # global setting to allow panel syncronization
        allow_panel_sync = bool(settings['allow_panel_sync'])
        # is this a simulation
        is_simulation = settings['is_simulation']
        # development mode
        is_HMI_dev = settings['is_HMI_dev']
        # do we flush redis on startup
        self.do_flush_redis = settings['do_flush_redis']

        # ------------------------------------------------------------------
        # instantiate the general settings class (must come first!)
        # ------------------------------------------------------------------
        self.base_config = BaseConfig(
            site_type=site_type,
            redis_port=self.redis_port,
            app_port=app_port,
            app_prefix=app_prefix,
            app_host=app_host,
            log_level=log_level,
            websocket_route=None,
            allow_panel_sync=None,
            is_HMI_dev=is_HMI_dev,
            is_simulation=is_simulation,
        )

        self.log = LogParser(
            base_config=self.base_config,
            title=__name__,
            log_level=log_level,
            log_file=log_file,
        )   

        return
    
    # ---------------------------------------------------------------------------
    def cleanup_services(self, service_name):
        self.log.info([['b', ' - Manager.service_cleanup ...']])

        if service_name == 'clock_sim_service':
            clock_sim = ClockSim(base_config=self.base_config, is_passive=True)
            clock_sim.unset_active_instance()

        return


    # ---------------------------------------------------------------------------
    def run_service(self, service_name, interrupt_sig):
        self.log.info([['g', ' - starting services for '], ['y', service_name], ['g', ' \t(pid: ',], ['p', os.getpid()], ['g', ') ...',],])


        # set the list of telescopes for this particular site and attach it to base_config
        InstData(base_config=self.base_config)
        # set clas of access functions for the clock and attach it to base_config
        ClockSim(base_config=self.base_config, interrupt_sig=interrupt_sig, is_passive=True)

        # for debugging
        self.do_flush_redis = True
        if service_name == 'clock_sim_service':
            if self.do_flush_redis:
                self.log.warn([['wr', ' ---- flusing redis ... ----']])
                _redis = RedisManager(name='_init_', port=self.redis_port, log=self.log)
                _redis.redis.flushall()


        if service_name == 'clock_sim_service':
            # ------------------------------------------------------------------
            # start the time_of_night clock (to be phased out....)
            utils.time_of_night(base_config=self.base_config, interrupt_sig=interrupt_sig)
            # ------------------------------------------------------------------

            ClockSim(base_config=self.base_config, is_passive=False, interrupt_sig=interrupt_sig)

        elif service_name == 'inst_health_service': 
            InstHealth(base_config=self.base_config, interrupt_sig=interrupt_sig)

        elif service_name == 'inst_pos_service': 
            InstPos(base_config=self.base_config, interrupt_sig=interrupt_sig)

        elif service_name == 'scheduler_service': 
            if utils.has_acs:
                raise Exception('threading has not been properly updated for the acs version....')
                SchedulerACS(base_config=self.base_config, interrupt_sig=interrupt_sig)
            else:
                MockTarget(base_config=self.base_config)
                SchedulerStandalone(base_config=self.base_config, interrupt_sig=interrupt_sig)

        else:
            raise Exception('unknown service_name ?!?', service_name)




        # after initialising all classes, start the threads (blocking)
        thread_manager = ThreadManager()
        thread_manager.run_threads()

        # after the disrupt signal has released the block, do some cleanup
        self.cleanup_services(service_name)

        return
