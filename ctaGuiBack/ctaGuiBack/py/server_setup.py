import sys
import subprocess
import traceback
import importlib
import multiprocessing
from time import sleep

# from ctaGuiBack.py.manager import Manager
from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.server_args import parse_args


# ---------------------------------------------------------------------------
def deep_module_reload(module_names, log=None):
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
def get_manager(module_names, is_first, log=None):
    if not is_first:
        deep_module_reload(module_names=module_names, log=log)

    import ctaGuiBack.py.manager as manager
    manager = manager.Manager()

    return manager

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

    settings_log = [['g', ' - server settings:\n']]
    for k,v in settings.items():
        settings_log += [['b', str(k)], [': ']]
        settings_log += [['c', str(v)], [',  ']]
    log.info(settings_log)

    def run_once(interrupt_sig, is_first):
        try:
            manager = get_manager(module_names=module_names, is_first=is_first, log=log)
            manager.run_server(interrupt_sig=interrupt_sig)
        except Exception as e:
            traceback.print_tb(e.__traceback__)
            pass
        return

    n_loop = 0
    while True:
        try:

            interrupt_sig = multiprocessing.Event()
            multi_proc = multiprocessing.Process(
                target=run_once,
                kwargs={
                    'interrupt_sig':interrupt_sig,
                    'is_first':(n_loop == 0),
                },
            )
            multi_proc.start()
            
            cmnd_watch = 'fswatch -1 -e ".pyc" -l 1 ' + ' '.join(reload_dirs)
            changed = subprocess.check_output(cmnd_watch, shell=True)
            # multi_proc.terminate()
            interrupt_sig.set()
            multi_proc.join()

            try:
                changed = changed.decode('utf-8').replace('\n', '  ')
            except Exception:
                pass
            log.info([['r', ' - detected changes in: '], ['y', changed], ['r', ' ...']])
            
            if not is_HMI_dev:
                raise KeyboardInterrupt

            sleep(.01)
            n_loop += 1

        except KeyboardInterrupt:
            log.info([['g', ' ' + ('=' * 55)]])
            log.info([['g', ' - Done !', ('=' * 50)]])
            log.info([['g', ' ' + ('=' * 75)]])
            
            interrupt_sig.set()
            multi_proc.join()

            break

        except Exception as e:
            traceback.print_tb(e.__traceback__)
            sleep(1)
            pass

    return



