# make sure we have the local acs modules of the gui
import os
from time import sleep
from ctaGuiUtils.py.server_args import parse_args
from ctaGuiUtils.py.LogParser import LogParser

from ctaGuiUtils.py.ServiceManager import ServiceManager
from ctaGuiUtils.py.BaseConfig import BaseConfig

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.ClockSim import ClockSim
from ctaGuiUtils.py.InstData import InstData
from ctaGuiUtils.py.utils import has_acs

from ctaGuiBack.py.InstPos import InstPos
from ctaGuiBack.py.MockTarget import MockTarget
from ctaGuiBack.py.InstHealth import InstHealth
from ctaGuiUtils.py.LockManager import LockManager
from ctaGuiBack.py.SchedulerACS import SchedulerACS
from ctaGuiUtils.py.RedisManager import RedisManager
from ctaGuiBack.py.SchedulerStandalone import SchedulerStandalone

from ctaGuiUtils.py.Serialisation import Serialisation


# ------------------------------------------------------------------
class Manager():
    """class for running asynchronous services
    """

    # ------------------------------------------------------------------
    def __init__(self):
        self.class_name = self.__class__.__name__

        self.app_name = 'ctaGuiBack'
        settings = parse_args(app_name=self.app_name)

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
        # is this a simulation
        is_simulation = settings['is_simulation']
        # development mode
        debug_opts = settings['debug_opts']
        # do we flush redis on startup
        self.do_flush_redis = settings['do_flush_redis']

        # instantiate the general settings class (must come first!)
        self.base_config = BaseConfig(
            site_type=site_type,
            redis_port=self.redis_port,
            app_port=app_port,
            app_prefix=app_prefix,
            app_host=app_host,
            log_level=log_level,
            websocket_route=None,
            allow_panel_sync=None,
            debug_opts=debug_opts,
            is_simulation=is_simulation,
        )

        self.log = LogParser(
            base_config=self.base_config,
            title=__name__,
            log_level=log_level,
            log_file=log_file,
        )

        self.redis = RedisManager(
            name=self.class_name, base_config=self.base_config, log=self.log
        )

        return

    # ------------------------------------------------------------------
    def cleanup_services(self, service_name, is_verb=False):
        """graceful exit of services
        """

        # is_verb = True
        if is_verb:
            self.log.info([
                ['c', ' - Manager.service_cleanup for '],
                ['y', service_name],
                ['b', ' ...'],
            ])

        # service_manager = ServiceManager()
        # service_manager.unset_active_instance(parent=self, class_prefix=service_name)
        ServiceManager.unset_active_instance(parent=self, class_prefix=service_name)

        # if service_name == 'clock_sim_service':
        #     pass

        return

    # ------------------------------------------------------------------
    def run_service(self, service_name, interrupt_sig):
        """run services in individual processes
        """

        # in case of backlog from a previous reload, call the cleanup for good measure
        self.cleanup_services(service_name)

        self.log.info([
            ['g', ' - starting services for '],
            ['y', service_name],
            ['g', ' \t(pid: '],
            ['p', os.getpid()],
            ['g', ') ...'],
        ])

        # set the list of telescopes for this particular site and attach it to base_config
        InstData(base_config=self.base_config)

        # set passive instance of the clock class, to add access functions base_config
        ClockSim(
            base_config=self.base_config,
            service_name=service_name,
            interrupt_sig=interrupt_sig,
            is_passive=True,
        )

        # setup the lock manager
        # prefix for all lock names in redis
        lock_prefix = 'utils;lock;' + service_name + ';'
        # dynamic lock names, based on the current properties
        lock_namespace = {
            'loop': lambda: 'loop',
        }
        # initialise the lock manager
        self.locker = LockManager(
            log=self.log,
            redis=self.redis,
            base_config=self.base_config,
            lock_namespace=lock_namespace,
            lock_prefix=lock_prefix,
            is_passive=True,
        )

        # with self.locker.locks.acquire('loop', debug=1):
        #     print(' - now im locked :)')
        #     pass

        # for debugging, override the global flag
        self.do_flush_redis = True
        if service_name == 'redis_flush':
            if self.do_flush_redis:
                self.log.warn([['r', ' - flusing redis ...']])
                self.redis.flush()

        elif service_name == 'redis_services':
            LockManager(
                log=self.log,
                redis=self.redis,
                base_config=self.base_config,
                lock_namespace=lock_namespace,
                lock_prefix=lock_prefix,
                is_passive=False,
                interrupt_sig=interrupt_sig,
            )

        elif service_name == 'clock_sim_service':
            # ------------------------------------------------------------------
            # start the time_of_night clock (to be phased out....)
            utils.time_of_night(
                base_config=self.base_config,
                service_name=service_name,
                interrupt_sig=interrupt_sig,
            )
            # ------------------------------------------------------------------

            ClockSim(
                base_config=self.base_config,
                service_name=service_name,
                interrupt_sig=interrupt_sig,
                is_passive=False,
            )

        elif service_name == 'inst_health_service':
            InstHealth(
                base_config=self.base_config,
                service_name=service_name,
                interrupt_sig=interrupt_sig,
            )

        elif service_name == 'inst_pos_service':
            InstPos(
                base_config=self.base_config,
                service_name=service_name,
                interrupt_sig=interrupt_sig,
            )

        elif service_name == 'scheduler_service':
            if has_acs:
                raise Exception(
                    'threading has not been properly updated for the acs version....'
                )
                SchedulerACS(
                    base_config=self.base_config,
                    service_name=service_name,
                    interrupt_sig=interrupt_sig,
                )
            else:
                MockTarget(base_config=self.base_config)
                SchedulerStandalone(
                    base_config=self.base_config,
                    service_name=service_name,
                    interrupt_sig=interrupt_sig,
                )

        else:
            raise Exception('unknown service_name ?!?', service_name)

        # all service classes inherit from ServiceManager, which keeps track of
        # all thread.  after initialising all classes, start the threads (blocking action)
        ServiceManager.run_threads()

        # after interrupt_sig has released the block from outside
        # of this process, do some cleanup
        self.cleanup_services(service_name)

        return
