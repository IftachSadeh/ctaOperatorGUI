# make sure we have the local acs modules of the gui
import os
import sys
base_ACS_dir = os.path.dirname(os.getcwd()) + '/acs'
if base_ACS_dir not in sys.path:
    sys.path.append(base_ACS_dir)

import subprocess
import traceback
import copy
import importlib
import multiprocessing
from time import sleep
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler

from shared.LogParser import LogParser
from shared.server_args import parse_args
from shared.utils import has_acs
# from shared.BaseConfig import BaseConfig
from shared.utils import get_time


class SetupServer():
    """class for running / reloading services
    """
    def __init__(self, reload_dirs, app_name, services):
        self.reload_dirs = reload_dirs
        self.app_name = app_name
        self.services = services

        settings = parse_args(app_name=self.app_name)

        # top level module names for the project
        self.module_names = settings['module_names']
        # local log file location
        log_file = settings['log_file']
        # logging level
        log_level = settings['log_level']
        # development mode
        self.reload_services = settings['reload']

        # time to wait between file changes (if multiple files change at the
        # same time, this avoids multiple reloading)
        self.time_wait_sec = 3

        self.log = LogParser(
            base_config=None,
            title=__name__,
            log_level=log_level,
            log_file=log_file,
        )
        self.log.info([['c', ' - has_acs = '], [('g' if has_acs else 'r'), has_acs]])

        settings_log = [['g', ' - server settings:\n']]
        for k, v in settings.items():
            settings_log += [['b', str(k)], [': ']]
            settings_log += [['c', str(v)], [',  ']]
        self.log.info(settings_log)

        # add all python files from the current directory to the list
        # of reloadable modules
        self.module_names = copy.deepcopy(self.module_names)
        for (root, d_names, f_names) in os.walk(os.getcwd()):
            self.module_names += [
                f.replace('.py', '') for f in f_names if f.endswith('.py')
            ]

        return

    # ------------------------------------------------------------------
    def deep_module_reload(self, is_verb):
        """collect all modules from the project and reload them (used for development purposes)
        """

        # sleep to encourage unique random seeds for BaseConfig (which are
        # based on the current time in msec)
        sleep(1e-3)

        # add all relevant modules to populate the sys.modules list
        importlib.import_module('manager')

        # get all loaded modules
        mods = tuple(sys.modules)

        # filter moduls from the project
        mods = [mod for mod in mods if any([n in mod for n in self.module_names])]

        # just in case, make sure we have no duplicate entries
        mods = list(dict.fromkeys(mods))

        # sort, beginning with ordered_items, then the most deeply nested
        # make sure to start with those modules which others depend on
        # such as BaseConfig (for which class attributes used eg by utils)
        ordered_items = ['shared.BaseConfig', 'shared.LogParser', 'InstPos']

        def sort_key(item):
            if item in ordered_items:
                order = ordered_items.index(item)
            else:
                order = len(ordered_items) + 1 / (1 + item.count('.'))
            return order

        mods = sorted(mods, key=sort_key, reverse=False)
        # mods = sorted(mods, key=lambda item: item.count('.'), reverse=True)

        if is_verb:
            self.log.info([['wg', ' - reloading modules:'], ['c', ' ', ', '.join(mods)]])

        # reload modules
        for mod in mods:
            # print(sys.modules[mod].__name__)
            importlib.reload(sys.modules[mod])

        return

    # ------------------------------------------------------------------
    def get_manager(self):
        """reload the manager class
        """

        self.deep_module_reload(is_verb=False)

        import manager as manager
        manager = manager.Manager()

        return manager

    # ------------------------------------------------------------------
    def run_service(self, service_name, interrupt_sig):
        """reload and run the manager class for a given service
        """

        try:
            manager = self.get_manager()
            manager.run_service(service_name=service_name, interrupt_sig=interrupt_sig)

        except KeyboardInterrupt:
            interrupt_sig.set()
            pass

        except Exception as e:
            self.log.info([['wr', e]])
            traceback.print_tb(e.__traceback__)
            raise e

        return

    # ------------------------------------------------------------------
    def run_server(self):
        """run the services, watching for file changes (for development) in order to reload
        """
        def spawn_procs():
            """create processes for each service
            """

            # short wait to allow possible previous iterations to clear
            sleep(1)

            self.deep_module_reload(is_verb=True)

            self.multi_procs = []
            self.interrupt_sig = multiprocessing.Event()

            for n_service in range(len(self.services)):
                service_name = self.services[n_service]['name']
                is_blocking = self.services[n_service]['is_blocking']
                multi_proc = multiprocessing.Process(
                    target=self.run_service,
                    kwargs={
                        'interrupt_sig': self.interrupt_sig,
                        'service_name': service_name,
                    },
                )
                multi_proc.start()

                if is_blocking:
                    # blocking services will be run until they finish
                    multi_proc.join()
                else:
                    # non-blocking services will run asynchronously
                    self.multi_procs += [multi_proc]

            return

        def clear_procs():
            """cleanup processes for all services
            """

            # upon changes, send the interrupt signal to all asynchronous services
            self.interrupt_sig.set()

            # wait for all asynchronously services to finish
            for multi_proc in self.multi_procs:
                multi_proc.join()

            return

        class FileChangeHandler(PatternMatchingEventHandler):
            def on_any_event(self, event):
                """overloaded function from PatternMatchingEventHandler, called
                   on any watched file change
                """

                # print(f'event type: {event.event_type}  path : {event.src_path}')

                if not self._need_reload():
                    return
                self.set_reload_time_sec()

                clear_procs()
                if self._reload_services:
                    spawn_procs()
                else:
                    self.set_can_keep_reloading(False)
                return

            def set_reload_time_wait_sec(self, time_wait_sec):
                self._reload_time_wait_sec = time_wait_sec
                return

            def set_reload_time_sec(self, reload_time_sec=None):
                self._reload_time_sec = (
                    reload_time_sec if reload_time_sec is not None else get_time('sec')
                )
                return

            def _need_reload(self):
                return (
                    get_time('sec') - self._reload_time_sec > self._reload_time_wait_sec
                )

            def set_reload_services(self, reload_services):
                self._reload_services = reload_services
                return

            def set_can_keep_reloading(self, can_reload):
                self._can_reload = can_reload
                return

            def get_can_keep_reloading(self):
                return self._can_reload

        # watch all python files, ignoring the current one
        event_handler = FileChangeHandler(
            patterns=['*.py'],
            ignore_patterns=['*/server_setup.py'],
        )
        event_handler.set_reload_time_sec(reload_time_sec=0)
        event_handler.set_can_keep_reloading(True)
        event_handler.set_reload_services(self.reload_services)
        event_handler.set_reload_time_wait_sec(self.time_wait_sec)

        def add_file_observers(observers):
            for dir_name in self.reload_dirs:
                observer = Observer()
                observer.schedule(event_handler, path=dir_name, recursive=True)
                observer.start()

                observers += [observer]
            return

        def final_cleanup(observers):
            self.log.info([['o', ' ' + ('=' * 55)]])
            self.log.info([['o', ' - Done !', ('=' * 50)]])
            self.log.info([['o', ' ' + ('=' * 75)]])

            for observer in observers:
                observer.stop()
            for observer in observers:
                observer.join()

            clear_procs()

        try:
            spawn_procs()

            observers = []
            add_file_observers(observers)

            while event_handler.get_can_keep_reloading():
                sleep(1)

            final_cleanup(observers)

        except KeyboardInterrupt:
            final_cleanup(observers)

        except Exception as e:
            self.log.info([['wr', e]])
            traceback.print_tb(e.__traceback__)
            raise e

        return
