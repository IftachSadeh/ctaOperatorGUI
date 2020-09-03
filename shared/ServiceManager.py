import threading
from time import sleep


# ------------------------------------------------------------------
class ServiceManager():
    """keep track of all threads spawned in this proccess, and enable interruption
    """

    threads = []

    def __init__(self, service_name, *args, **kwargs):
        # if service_name is None:
        #     return

        # sleep duration for heartbeat loop of active instance
        self.active_expire_sec = 5
        self.loop_active_expire_sec = self.active_expire_sec * 0.25
        self.active_instance_name = self.get_active_name(service_name)

        return

    # ------------------------------------------------------------------
    @classmethod
    def get_active_name(self, service_name):
        return 'utils;active_instance;' + service_name

    # ------------------------------------------------------------------
    def can_loop(self, interrupt_sig=None):
        """check if the interrups signal has been set
        """

        if interrupt_sig is None:
            return not self.interrupt_sig.is_set()
        else:
            return not interrupt_sig.is_set()

    # ------------------------------------------------------------------
    def add_thread(self, target):
        """add thread to the general registry
        """

        trd = threading.Thread(target=target)
        ServiceManager.threads += [{
            'target': target,
            'trd': trd,
        }]

        return

    # ------------------------------------------------------------------
    @classmethod
    def get_threads(self):
        return ServiceManager.threads

    # ------------------------------------------------------------------
    @classmethod
    def run_threads(self):
        """run all threads and block untill they all finish
        """

        for thread in ServiceManager.threads:
            thread['trd'].start()

        for thread in ServiceManager.threads:
            thread['trd'].join()

        return

    # ------------------------------------------------------------------
    def has_active_instance(self):
        """will return None is there is no active instance, otherwise, will return
           the initialisation state
        """

        return self.redis.get(self.active_instance_name)

    # ------------------------------------------------------------------
    def set_active_instance(self, has_init, expire_sec):
        self.redis.set(
            name=self.active_instance_name,
            data=has_init,
            expire_sec=int(expire_sec),
        )
        return

    # ------------------------------------------------------------------
    @classmethod
    def unset_active_instance(self, parent, service_name):
        active_instance_name = ServiceManager.get_active_name(service_name=service_name)

        if parent.redis.exists(active_instance_name):
            parent.log.info([
                ['r', ' - unset_active_instance '],
                ['y', active_instance_name],
                ['r', ' ...'],
            ])

            parent.redis.delete(name=active_instance_name)

        return

    # ------------------------------------------------------------------
    def init_active_instance(self):
        if self.has_active_instance() is not None:
            # sleep for a bit
            sleep(self.active_expire_sec)

            # try again for n_sec_try
            n_sec_try = 3
            for _ in range(n_sec_try):
                if self.has_active_instance() is None:
                    break
                sleep(1)

            # if the instance is still locked, something must be wrong
            if self.has_active_instance() is not None:
                raise Exception(
                    'Can not instantiate an active instance more than once...',
                    self.active_instance_name,
                )

        # set the heartbeat (uninitialised state) for a long expiration
        # to allow the heartbeat thread to start later
        active_init_expire = self.active_expire_sec * 100
        self.set_active_instance(has_init=False, expire_sec=active_init_expire)

        return

    # ------------------------------------------------------------------
    def loop_active_heartbeat(self):
        """heartbeat loop running in its own thread, updating the expiration
           of the active instance
        """

        self.log.info([
            ['g', ' - starting loop_active_heartbeat '],
            ['y', self.active_instance_name],
            ['g', ' ...'],
        ])

        while self.can_loop():
            self.set_active_instance(
                has_init=True,
                expire_sec=self.active_expire_sec,
            )

            sleep(self.loop_active_expire_sec)

        self.log.info([
            ['c', ' - ending loop_active_heartbeat '],
            ['y', self.active_instance_name],
            ['c', ' ...'],
        ])

        return
