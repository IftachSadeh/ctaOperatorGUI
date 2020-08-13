import sys
import subprocess
import traceback
import importlib
import multiprocessing
from time import sleep

from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.server_args import parse_args
from ctaGuiUtils.py.utils import has_acs


# ---------------------------------------------------------------------------
def deep_module_reload(module_names, log=None):
    # add all relevant modules to populate the sys.modules list
    importlib.import_module('ctaGuiBack.py.manager')
    # get all loaded modules
    mods = tuple(sys.modules)
    # filter moduls from the project
    mods = [
        mod for mod in mods
        if any([ n in mod for n in module_names ])
    ]
    # just in case, make sure we have no duplicate entries
    mods = list(dict.fromkeys(mods))
    # sort, beginning with the most deeply nested
    mods = sorted(mods, key=lambda item: item.count('.'), reverse=True)

    if log is not None:
        log.info([['wg', ' - reloading modules:'], ['g', ' ', ', '.join(mods)]])

    # reload modules
    for mod in mods:
        importlib.reload(sys.modules[mod])

    return


# ---------------------------------------------------------------------------
def get_manager(module_names, do_reload, log=None):
    if do_reload:
        deep_module_reload(module_names=module_names, log=log)

    import ctaGuiBack.py.manager as manager
    manager = manager.Manager()

    return manager

# ---------------------------------------------------------------------------
def run_service(service_name, do_reload, log, module_names, interrupt_sig):
    try:
        manager = get_manager(
            module_names=module_names, do_reload=do_reload, log=log
        )

        manager.run_service(
            service_name=service_name, interrupt_sig=interrupt_sig
        )

    except KeyboardInterrupt:
        interrupt_sig.set()
        pass
    
    except Exception as e:
        log.info([['wr', e]])
        traceback.print_tb(e.__traceback__)
        raise e

    return

# ---------------------------------------------------------------------------
def setup_server(reload_dirs):

    app_name = 'ctaGuiBack'
    settings = parse_args(app_name=app_name)

    # top level module names for the project
    module_names = settings['module_names']
    # local log file location
    log_file = settings['log_file']
    # logging level
    log_level = settings['log_level']
    # development mode
    is_HMI_dev = settings['is_HMI_dev']

    log = LogParser(
        base_config=None,
        title=__name__,
        log_level=log_level,
        log_file=log_file,
    )
    log.info([['c', ' - has_acs = '], [('g' if has_acs else 'r'), has_acs]])

    settings_log = [['g', ' - server settings:\n']]
    for k,v in settings.items():
        settings_log += [['b', str(k)], [': ']]
        settings_log += [['c', str(v)], [',  ']]
    log.info(settings_log)

    # 
    while True:
        try:
            sleep(.01)
            
            multi_procs = []
            service_names = [
                'clock_sim_service',
                'inst_health_service',
                'inst_pos_service',
                'scheduler_service',
            ]
            
            interrupt_sig = multiprocessing.Event()
            for n_service in range(len(service_names)):
                service_name = service_names[n_service]
                multi_proc = multiprocessing.Process(
                    target=run_service,
                    kwargs={
                        'log':log,
                        'module_names':module_names,
                        'interrupt_sig':interrupt_sig,
                        'do_reload': (n_service == 0),
                        'service_name': service_name,
                    },
                )
                multi_proc.start()

                multi_procs += [multi_proc]
            
            cmnd_watch = 'fswatch -1 -e ".pyc" -l 1 ' + ' '.join(reload_dirs)
            changed = subprocess.check_output(cmnd_watch, shell=True)
            interrupt_sig.set()

            for multi_proc in multi_procs:
                multi_proc.join()

            try:
                changed = changed.decode('utf-8').replace('\n', '  ')
            except Exception:
                pass
            log.info([['r', ' - detected changes in: '], ['y', changed], ['r', ' ...']])
            
            if not is_HMI_dev:
                raise KeyboardInterrupt


        except KeyboardInterrupt:
            log.info([['g', ' ' + ('=' * 55)]])
            log.info([['g', ' - Done !', ('=' * 50)]])
            log.info([['g', ' ' + ('=' * 75)]])
            
            interrupt_sig.set()
            multi_proc.join()

            break

        except Exception as e:
            # for development purposes, we continue the loop instead of raising the exception
            log.info([['wr', e]])
            traceback.print_tb(e.__traceback__)

            if not is_HMI_dev:
                raise e
            else:
                sleep(1)
                pass

    return

