import threading

from ctaGuiUtils.py.LogParser import LogParser


# ---------------------------------------------------------------------------
class ThreadManager():
    threads = []

    def __init__(self, base_config, *args, **kwargs):
        self.log = LogParser(base_config=base_config, title=__name__)

        return
    
    # ---------------------------------------------------------------------------
    def can_loop(self, interrupt_sig):
        return not interrupt_sig.is_set()

    # ---------------------------------------------------------------------------
    def add_thread(self, target):
        trd = threading.Thread(target=target)
        ThreadManager.threads += [{
            'target': target,
            'trd': trd,
        }]

        return

    # ---------------------------------------------------------------------------
    def run_threads(self):
        # for thread in ThreadManager.threads:
        #     print(thread['target'])
        
        for thread in ThreadManager.threads:
            thread['trd'].start()
        
        for thread in ThreadManager.threads:
            thread['trd'].join()

        return
