import asyncio
import time
from math import ceil

from ctaGuiUtils.py.utils import get_rnd
from ctaGuiUtils.py.utils import is_coroutine
from ctaGuiUtils.py.utils import get_time
from ctaGuiUtils.py.ServiceManager import ServiceManager

from threading import Lock
import inspect


# ------------------------------------------------------------------
class LockManager():
    """locker manager for async redis-based locks
    """

    # ------------------------------------------------------------------
    def __init__(
        self,
        log,
        redis,
        base_config,
        lock_namespace,
        lock_prefix,
        is_passive,
        interrupt_sig=None,
        lock_timeout_sec=None,
        slow_lock_msec=None,
    ):
        self.log = log
        self.redis = redis
        self.base_config = base_config
        self.lock_namespace = lock_namespace
        self.lock_prefix = lock_prefix
        self.is_passive = is_passive
        self.interrupt_sig = interrupt_sig
        self.lock_timeout_sec = lock_timeout_sec
        self.slow_lock_msec = slow_lock_msec

        self.locks = RedisLock(parent=self)
        self.semaphores = RedisSemaphore(parent=self)

        return


# ------------------------------------------------------------------
class RedisLock():
    """redis-based lock manager
    """

    # ------------------------------------------------------------------
    def __init__(self, parent):
        self.parent = parent
        self.log = self.parent.log
        self.base_config = self.parent.base_config
        self.redis = self.parent.redis
        self.lock_namespace = self.parent.lock_namespace
        self.lock_prefix = self.parent.lock_prefix

        # expiration time for locks
        self.lock_timeout_sec = self.parent.lock_timeout_sec
        if self.lock_timeout_sec is None:
            self.lock_timeout_sec = 10

        # maximal nominal delay time for locking
        self.slow_lock_msec = self.parent.slow_lock_msec
        if self.slow_lock_msec is None:
            self.slow_lock_msec = 2500

        # lock counter for debugging
        self.n_locks = 0
        self.lock_id_prefix = 'lock_' + get_rnd(
            n_digits=6, out_type=str, is_unique_seed=True
        )

        return

    # ------------------------------------------------------------------
    def get_lock_id(self):

        lock_id = self.lock_id_prefix + '_{:08d}'.format(self.n_locks)
        self.n_locks += 1

        return lock_id

    # ------------------------------------------------------------------
    def get_lock_name(self, name, postfix=None):
        if postfix is None:
            try:
                postfix = self.lock_namespace[name]()

                # if this comes from a defunc session, we could still end up with None
                if postfix is None:
                    postfix = self.lock_namespace[None]()

            except KeyError as e:
                keys = [k for k in self.lock_namespace.keys() if k is not None]
                self.log.info([
                    ['r', ' - unknown lock name '],
                    ['o', name],
                    ['r', ' --> must be one of: '],
                    ['y', keys],
                ])
                raise e
            except Exception as e:
                raise e
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
        for name in self.lock_namespace.keys():
            states[name] = {
                'name': self.get_lock_name(name),
                'state': self.is_locked(names=name),
            }

        return states

    # ------------------------------------------------------------------
    def validate(self, names):
        if not self.base_config.debug_opts['lock']:
            return

        if not self.is_locked(names=names):
            lock_states = self.get_lock_states()
            raise Exception(' - unexpected lock ?!?', names, lock_states)
        return

    # ------------------------------------------------------------------
    def acquire(self, names, can_exist=False, debug=None):
        return self.LockContext(
            parent=self,
            lock_names=names,
            can_exist=can_exist,
            debug=debug,
        )

    # ------------------------------------------------------------------
    class LockContext():
        """context manager for redis locks
        """

        # ------------------------------------------------------------------
        def __init__(self, parent, lock_names, can_exist=False, debug=None):
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

            self.debug_lock = False
            # self.debug_lock = True
            if debug is not None:
                self.debug_lock = debug

            self.locks = []

            return

        # ------------------------------------------------------------------
        def __enter__(self):
            """the synch enter function

               to be used as eg:
               with locker.locks.acquire('loop'):
                   pass
            """
            self._lock_enter(is_async=False)
            return

        # ------------------------------------------------------------------
        async def __aenter__(self):
            """the assynch enter function

               to be used as eg:
               async with locker.locks.acquire('loop'):
                   pass
            """
            self._lock_enter(is_async=True)
            return

        # ------------------------------------------------------------------
        def __exit__(self, exc_type, exc, tb):
            """the synch exit function
            """
            self._lock_exit(exc_type, exc, tb)
            return

        # ------------------------------------------------------------------
        async def __aexit__(self, exc_type, exc, tb):
            """the asynch exit function
            """
            self._lock_exit(exc_type, exc, tb)
            return

        # ------------------------------------------------------------------
        def _lock_enter(self, is_async):
            if is_async:

                async def sleep_sec(sec):
                    await asyncio.sleep(sec)
            else:

                def sleep_sec(sec):
                    time.sleep(sec)

            names = [self.parent.get_lock_name(name) for name in self.lock_names]

            for name in names:
                if self.can_exist:
                    if self.redis.exists(name):
                        return
                else:
                    time_0 = get_time('msec')
                    time_1, timeout_0, timeout_1 = time_0, 0, 0
                    while self.redis.exists(name):
                        sleep_sec(0.01)

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

                    if timeout_0 >= self.lock_timeout_sec * 1e3:
                        time_0 = get_time('msec')
                        raise Exception(
                            ' - lock for ' + str(name) + ' seems to have expired'
                            + ' (not released) after ' + str(timeout_1) + ' msec'
                        )

                lock_id = self.get_lock_id()

                self.redis.set(
                    name=name,
                    data=lock_id,
                    expire_sec=self.lock_timeout_sec,
                )
                self.locks += [{
                    'name': name,
                    'lock_id': lock_id,
                }]

                if self.debug_lock:
                    self.log.info([['b', ' ++ add  ', lock_id, '  ', name]])

            return

        # ------------------------------------------------------------------
        def _lock_exit(self, exc_type, exc, tb):
            for lock in self.locks:
                lock_id = self.redis.get(name=lock['name'], default_val=None)
                if lock_id == lock['lock_id']:
                    self.redis.delete(name=lock['name'])

                    if self.debug_lock:
                        self.log.info([['c', ' -- del  ', lock_id, '  ', lock['name']]])
            return


# ------------------------------------------------------------------
class RedisSemaphore(ServiceManager):
    """manager class for registring redis-based semaphores
    """

    # ------------------------------------------------------------------
    def __init__(self, parent):
        self.class_name = self.__class__.__name__
        super().__init__(class_prefix=self.class_name)

        self.parent = parent
        self.log = self.parent.log
        self.redis = self.parent.redis
        self.is_passive = self.parent.is_passive
        self.interrupt_sig = self.parent.interrupt_sig

        self.resource_lockers = 'utils;resource_locker_heartbeat'

        # if this is an active instance, setup the thread for the cleanup loop
        if not self.is_passive:
            # make sure this is the only active instance
            self.init_active_instance()

            # sleep duration for thread loops
            self.loop_sleep_sec = 1
            # minimal real-time delay between cleanups
            self.loop_act_rate = max(int(600 / self.loop_sleep_sec), 1)

            self.loop_sleep_sec = .1
            self.loop_act_rate = 1

            self.max_lock_sec = 60

            self.setup_threads()

        return

    # ------------------------------------------------------------------
    def setup_threads(self):
        self.add_thread(target=self.loop_cleanup)
        return

    # ------------------------------------------------------------------
    def loop_cleanup(self):
        self.log.info([['g', ' - starting RedisSemaphore.loop_cleanup ...']])
        time.sleep(0.1)

        n_loop = 0
        while self.can_loop():
            n_loop += 1
            time.sleep(self.loop_sleep_sec)
            if n_loop % self.loop_act_rate != 0:
                continue

            self.cleanup()

        self.log.info([['c', ' - ending RedisSemaphore.loop_cleanup ...']])

        return

    # ------------------------------------------------------------------
    def add(self, name, key, expire_sec=None):
        if expire_sec is None:
            expire_msec = 0
        else:
            expire_msec = max(1, int(expire_sec * 1e3))

        self.redis.h_set(
            name=name,
            key=key,
            data={
                'time': get_time('msec'),
                'expire_msec': expire_msec,
            },
        )

        keys = self.redis.h_get(name=self.resource_lockers, key=name, default_val=[])
        keys += [key]
        self.redis.h_set(name=self.resource_lockers, key=name, data=keys)
        return

    # ------------------------------------------------------------------
    def remove(self, name, key):
        self.redis.h_del(name=name, key=key)
        self.redis.h_del(name=self.resource_lockers, key=name)

        return

    # ------------------------------------------------------------------
    def check(self, name, key):
        exists = self.redis.h_exists(name=name, key=key)
        return exists

    # ------------------------------------------------------------------
    def get_actives(self, name=None, default_val=None):
        actives = self.redis.h_get_all(
            name=self.resource_lockers,
            key=name,
            default_val=default_val,
        )
        return actives

    # ------------------------------------------------------------------
    def sync_block(self, is_locked, max_lock_sec=None):
        if max_lock_sec is None:
            max_lock_sec = self.max_lock_sec

        lock_time = get_time('sec')

        while is_locked():
            if (get_time('sec') - lock_time) > max_lock_sec:
                self.log.warn([
                    ['r', ' - async_block cant release ?!? is_locked():'],
                    ['y', '\n', inspect.getsource(is_locked)],
                ])
                break

            time.sleep(0.01)

        return

    # ------------------------------------------------------------------
    async def async_block(self, is_locked, max_lock_sec=None):
        if max_lock_sec is None:
            max_lock_sec = self.max_lock_sec

        lock_time = get_time('sec')

        while True:
            if is_coroutine(is_locked):
                if not await is_locked():
                    break
            else:
                if not is_locked():
                    break

            if (get_time('sec') - lock_time) > max_lock_sec:
                self.log.warn([
                    ['r', ' - async_block cant release ?!? is_locked():'],
                    ['y', '\n', inspect.getsource(is_locked)],
                ])
                break

            await asyncio.sleep(0.01)

        return

    # ------------------------------------------------------------------
    def cleanup(self):
        lock_heartbeats = self.redis.h_get_all(self.resource_lockers)
        for name, keys in lock_heartbeats.items():
            for key in keys:
                lock = self.redis.h_get(name=name, key=key, default_val=None)
                if lock is None:
                    continue

                if lock['expire_msec'] <= 0:
                    continue
                expired = ((get_time('msec') - lock['time']) > lock['expire_msec'])
                if expired:
                    self.log.warn([
                        ['r', ' - removing expired lock '],
                        ['y', name],
                        ['r', ' / '],
                        ['o', key],
                        ['r', ' ... should have been cleaned up manually ?!?'],
                    ])
                    self.remove(name, key)

        return
