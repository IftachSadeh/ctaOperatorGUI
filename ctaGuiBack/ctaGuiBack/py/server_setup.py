import subprocess
import traceback
import importlib
import multiprocessing
from time import sleep

# from ctaGuiBack.py.manager import Manager
from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.server_args import parse_args

# ---------------------------------------------------------------------------
def get_manager(log=None):
    if log is not None:
        log.info([['wg', ' - reloading ...']])

    import ctaGuiBack.py.manager as manager
    importlib.reload(manager)

    Manager = manager.Manager
    manager = Manager()

    return manager

# ---------------------------------------------------------------------------
def setup_server(reload_dirs):

    app_name = 'ctaGuiBack'
    settings = parse_args(app_name=app_name)

    # local log file location
    log_file = settings['log_file']
    # logging level
    log_level = settings['log_level']

    log = LogParser(
        base_config=None,
        title=__name__,
        log_level=log_level,
        log_file=log_file,
    )

    def run_once(evt):
        try:
            manager = get_manager()
            manager.run_server(evt=evt)
        except Exception as e:
            traceback.print_tb(e.__traceback__)
            pass
        return

    while True:
        try:
            sleep(.1)

            log.info([['o', ' ' + ('=' * 65)]])
            log.info([['o', ' = watching for changes', ('=' * 47)]])
            log.info([['o', ' ' + ('=' * 75)]])
            
            evt = multiprocessing.Event()
            p = multiprocessing.Process(target=run_once, kwargs={'evt':evt})
            p.start()
            
            cmnd_watch = 'fswatch -1 -e ".pyc" -l 1 ' + ' '.join(reload_dirs)
            (subprocess.check_output(cmnd_watch, shell=True))
            # p.terminate()
            evt.set()
            p.join()

        except KeyboardInterrupt:
            log.info([['g', ' ']])
            log.info([['g', ' ' + ('=' * 45)]])
            log.info([['g', ' - Done !', ('=' * 40)]])
            log.info([['g', ' ' + ('=' * 55)]])

            break

        except Exception as e:
            traceback.print_tb(e.__traceback__)
            sleep(1)
            pass

    return



