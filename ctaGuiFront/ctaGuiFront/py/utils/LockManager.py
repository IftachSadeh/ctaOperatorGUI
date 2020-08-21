import asyncio
from math import ceil
# from aioredlock import Aioredlock
# from aioredlock import LockError

from ctaGuiUtils.py.utils import get_rnd
from ctaGuiUtils.py.utils import get_time


# ------------------------------------------------------------------
class LockManager():
    """locker manager for async redis-based locks
    """

    # prefix for all lock names in redis
    lock_prefix = 'ws;lock;'
    # expiration time for locks
    lock_timeout_sec = 10
    # maximal nominal delay time for locking
    slow_lock_msec = 2500

    # lock counter for debugging
    n_locks = 0
    lock_id_prefix = ('lock_' + get_rnd(n_digits=6, out_type=str, is_unique_seed=True))

    # ------------------------------------------------------------------
    def __init__(self):
        # dynamic lock names, based on the current properties
        self.lock_name_getter = {
            None: lambda: 'None',
            'global': lambda: 'global',
            # 'global': lambda: 'global' + str(self.server_id),
            'loop_state': lambda: 'loop_state',
            'user': lambda: 'user;' + str(self.user_id),
            'server': lambda: 'server;' + str(self.server_id),
            'sess': lambda: 'sess;' + str(self.sess_id),
        }

        # self.counter = 0
        # self.redis_lock_retry_max_sec = 10
        # self.redis_lock_retry_max_sec = 4
        # redis_lock_delay_min, redis_lock_delay_max = 0.01, 0.05
        # redis_lock_count = ceil(self.redis_lock_retry_max_sec / redis_lock_delay_min)

        # self.redis_lock = Aioredlock(
        #     redis_connections=[{
        #         'host': 'localhost',
        #         'port': self.redis_port
        #     }],
        #     retry_count=redis_lock_count,
        #     retry_delay_min=redis_lock_delay_min,
        #     retry_delay_max=redis_lock_delay_max,
        # )

        return

    # ------------------------------------------------------------------
    def get_lock_id(self):

        lock_id = self.lock_id_prefix + '_{:08d}'.format(LockManager.n_locks)
        LockManager.n_locks += 1

        return lock_id

    # ------------------------------------------------------------------
    def get_lock_name(self, name, postfix=None):
        if postfix is None:
            try:
                postfix = self.lock_name_getter[name]()

                # if this comes from a defunc session, we could still end up with None
                if postfix is None:
                    postfix = self.lock_name_getter[None]()

            except Exception:
                raise Exception('unknown lock name: ', name)
        else:
            if not isinstance(postfix, str):
                raise Exception('unsupported postfix type: ', postfix)

        lock_name = self.lock_prefix + postfix

        return lock_name

    # ------------------------------------------------------------------
    def is_locked(self, names):
        if names is None or isinstance(names, str):
            names = [names]

        lock_names = [self.get_lock_name(name) for name in names]

        is_locked_name = [self.redis.exists(name) for name in lock_names]
        all_locked = all(is_locked_name)
        # print('+++++++', names,  is_locked_name)

        return all_locked

    # ------------------------------------------------------------------
    def get_lock_states(self):
        states = dict()
        for name in self.lock_name_getter.keys():
            states[name] = {
                'name': self.get_lock_name(name),
                'state': self.is_locked(names=name),
            }

        return states

    # ------------------------------------------------------------------
    def validate_locks(self, names):
        return
        return
        return
        return
        if not self.is_locked(names=names):
            lock_states = self.get_lock_states()
            raise Exception(' - unexpected lock ?!?', names, lock_states)
        return

    # ------------------------------------------------------------------
    def get_lock(self, names, can_exist=False):
        return self.LockContext(parent=self, lock_names=names, can_exist=can_exist)

    # ------------------------------------------------------------------
    class LockContext():
        """context manager for redis locks
        """

        # ------------------------------------------------------------------
        def __init__(self, parent, lock_names, can_exist=False):
            self.parent = parent
            self.log = self.parent.log
            self.redis = self.parent.redis
            self.lock_timeout_sec = self.parent.lock_timeout_sec
            self.slow_lock_msec = self.parent.slow_lock_msec
            self.get_lock_id = self.parent.get_lock_id

            self.lock_names = lock_names
            if isinstance(self.lock_names, str):
                self.lock_names = [self.lock_names]

            self.can_exist = can_exist

            self.debug = False
            # self.debug = True
            self.locks = []

            return

        # ------------------------------------------------------------------
        async def __aenter__(self):

            names = [self.parent.get_lock_name(name) for name in self.lock_names]

            for name in names:
                if self.can_exist:
                    if self.redis.exists(name):
                        return
                else:
                    time_0 = get_time('msec')
                    time_1, timeout_0, timeout_1 = time_0, 0, 0
                    while self.redis.exists(name):
                        await asyncio.sleep(0.01)

                        timeout_0 = get_time('msec') - time_0
                        timeout_1 = get_time('msec') - time_1
                        if timeout_0 >= self.slow_lock_msec:
                            time_0 = get_time('msec')
                            self.log.warn([
                                ['r', ' - slow lock for '],
                                ['b', name],
                                ['r', ' waiting for '],
                                ['c', timeout_1],
                                ['r', ' msec ...'],
                            ])

                    if timeout_0 >= self.lock_timeout_sec:
                        time_0 = get_time('msec')
                        raise Exception(
                            ' - lock for ' + str(name) + ' seems to have expired'
                            + ' (not released) after ' + str(timeout_1) + ' msec'
                        )

                # await asyncio.sleep(0.1)

                lock_id = self.get_lock_id()

                self.redis.set(
                    name=name,
                    data=lock_id,
                    expire=self.lock_timeout_sec,
                )
                self.locks += [{
                    'name': name,
                    'lock_id': lock_id,
                }]

                if self.debug:
                    self.log.info([['b', ' ++ add  ', lock_id, '  ', name]])

            return

        # ------------------------------------------------------------------
        async def __aexit__(self, exc_type, exc, tb):
            for lock in self.locks:
                lock_id = self.redis.get(name=lock['name'], default_val=None)
                if lock_id == lock['lock_id']:
                    self.redis.delete(name=lock['name'])

                    if self.debug:
                        self.log.info([['c', ' -- del  ', lock_id, '  ', lock['name']]])
            return
