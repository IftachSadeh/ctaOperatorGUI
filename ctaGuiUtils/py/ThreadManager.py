import threading

from ctaGuiUtils.py.LogParser import LogParser


# ---------------------------------------------------------------------------
class ThreadManager():
    threads = []
    
    # ---------------------------------------------------------------------------
    def can_loop(self, interrupt_sig=None):
        if interrupt_sig is None:
            return not self.interrupt_sig.is_set()
        else:
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
    def get_threads(self):
        return ThreadManager.threads
    
    # ---------------------------------------------------------------------------
    def run_threads(self):
        # for thread in ThreadManager.threads:
        #     print(thread['target'])
        
        for thread in ThreadManager.threads:
            thread['trd'].start()
        
        for thread in ThreadManager.threads:
            thread['trd'].join()

        return
