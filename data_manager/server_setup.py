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

from shared.LogParser import LogParser
from shared.server_args import parse_args
from shared.utils import has_acs
# from shared.BaseConfig import BaseConfig


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
        self.reload = settings['reload']

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
        while True:
            try:
                # short wait to allow possible previous iterations to clear
                sleep(1)
                self.deep_module_reload(is_verb=True)

                multi_procs = []
                interrupt_sig = multiprocessing.Event()

                for n_service in range(len(self.services)):
                    service_name = self.services[n_service]['name']
                    is_blocking = self.services[n_service]['is_blocking']
                    multi_proc = multiprocessing.Process(
                        target=self.run_service,
                        kwargs={
                            'interrupt_sig': interrupt_sig,
                            'service_name': service_name,
                        },
                    )
                    multi_proc.start()

                    if is_blocking:
                        # blocking services will be run until they finish
                        multi_proc.join()
                    else:
                        # non-blocking services will run asynchronously
                        multi_procs += [multi_proc]

                # block the loop untill file changes are detected
                n_sec_wait = 1
                cmnd_watch = (
                    'fswatch -1 -e ".*" -i "\\.py$" -l ' + str(n_sec_wait) + ' '
                    + ' '.join(self.reload_dirs)
                )
                changed = subprocess.check_output(cmnd_watch, shell=True)

                try:
                    changed = changed.decode('utf-8').replace('\n', '  ')
                except Exception:
                    pass
                self.log.info([
                    ['o', ' - detected changes in: '],
                    ['g', changed],
                    ['o', ' ...'],
                ])

                # upon changes, send the interrupt signal to all asynchronous services
                interrupt_sig.set()

                # wait for all asynchronously services to finish
                for multi_proc in multi_procs:
                    multi_proc.join()

                if not self.reload:
                    raise KeyboardInterrupt

            except KeyboardInterrupt:
                self.log.info([['g', ' ' + ('=' * 55)]])
                self.log.info([['g', ' - Done !', ('=' * 50)]])
                self.log.info([['g', ' ' + ('=' * 75)]])

                # attempt a graceful exit
                interrupt_sig.set()
                multi_proc.join()

                break

            except Exception as e:
                # for development purposes, we may continue the
                # loop instead of raising the exception
                self.log.info([['wr', e]])
                traceback.print_tb(e.__traceback__)

                if not self.reload:
                    raise e
                else:
                    self.log.info([['wr', ' - will retry to run services ...']])
                    sleep(1)
                    pass

        return