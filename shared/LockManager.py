import asyncio
import time
from math import ceil

from shared.utils import get_rnd
from shared.utils import is_coroutine
from shared.utils import get_time
from shared.ServiceManager import ServiceManager

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
        service_name=None,
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
        self.semaphores = RedisSemaphore(parent=self, service_name=service_name)

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
        self.lock_timeout_sec = int(ceil(self.lock_timeout_sec))

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

    def update_lock_namespace(self, lock_namespace):
        self.lock_namespace.update(lock_namespace)
        return

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
            self.get_lock_id = self.parent.get_lock_id
            self.lock_timeout_sec = self.parent.lock_timeout_sec
            self.slow_lock_msec = self.parent.slow_lock_msec

            self.lock_names = lock_names
            if isinstance(self.lock_names, str):
                self.lock_names = [self.lock_names]

            self.can_exist = can_exist

            self.debug_lock = False
            if debug is not None:
                self.debug_lock = debug
            # self.debug_lock = True

            self.locks = []

            self.time_0_msec = get_time('msec')
            self.time_1_msec = self.time_0_msec
            self.timeout_0_msec = 0
            self.timeout_1_msec = 0

            return

        # ------------------------------------------------------------------
        def __enter__(self):
            """the synch enter function

               to be used as eg:
               with locker.locks.acquire('loop'):
                   pass
            """

            names = self._lock_get_names()
            self._sync_lock_enter(names=names)

            return

        # ------------------------------------------------------------------
        async def __aenter__(self):
            """the assynch enter function

               to be used as eg:
               async with locker.locks.acquire('loop'):
                   pass
            """

            names = self._lock_get_names()
            await self._async_lock_enter(names=names)

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
        def _lock_get_names(self):

            names_check = [self.parent.get_lock_name(name) for name in self.lock_names]

            names = []
            for name in names_check:
                if self.can_exist:
                    if self.redis.exists(name):
                        continue
                names += [name]

            return names

        # ------------------------------------------------------------------
        async def _async_lock_enter(self, names):
            lock_id = self.get_lock_id()

            for name in names:
                if self.can_exist:
                    if self.redis.exists(name):
                        break
                else:
                    while True:
                        is_set = self._lock_enter(name=name, lock_id=lock_id, in_loop=True,)
                        if is_set:
                            break

                        await asyncio.sleep(0.01)

                    self._lock_enter(name=name, lock_id=lock_id, in_loop=False)
            
            return

        # ------------------------------------------------------------------
        def _sync_lock_enter(self, names):
            lock_id = self.get_lock_id()

            for name in names:
                if self.can_exist:
                    if self.redis.exists(name):
                        break
                else:
                    while True:
                        is_set = self._lock_enter(name=name, lock_id=lock_id, in_loop=True,)
                        if is_set:
                            break

                        time.sleep(0.01)

                    self._lock_enter(name=name, lock_id=lock_id, in_loop=False)
            
            return

        # ------------------------------------------------------------------
        def _lock_enter(self, name, lock_id, in_loop):
            is_set = False

            if in_loop:
                # try to set the name (works only if it does not already exist)
                set_try = self.redis.set_nx(
                    name=name,
                    data=lock_id,
                    expire_sec=self.lock_timeout_sec,
                )

                self.timeout_0_msec = get_time('msec') - self.time_0_msec
                self.timeout_1_msec = get_time('msec') - self.time_1_msec
                
                if self.timeout_0_msec >= self.slow_lock_msec:
                    self.time_0_msec = get_time('msec')
                    self.log.warn([
                        ['r', ' - slow lock for '],
                        ['b', name],
                        ['r', ' waiting for '],
                        ['c', self.timeout_1_msec],
                        ['r', ' msec ...'],
                    ])
                
                is_set = set_try['set_nx']

            else:
                if self.timeout_0_msec >= self.lock_timeout_sec * 1e3:
                    raise Exception(
                        ' - lock for ' + str(name) + ' seems to have expired'
                        + ' (not released) after ' + str(self.timeout_1_msec) + ' msec'
                    )

                self.locks += [{
                    'name': name,
                    'lock_time': get_time('msec'),
                    'lock_id': lock_id,
                }]

                if self.debug_lock:
                    self.log.info([['b', ' ++ add  ', lock_id, '  ', name]])

            return is_set

        # ------------------------------------------------------------------
        def _lock_exit(self, exc_type, exc, tb):
            for lock in self.locks:
                lock_id = self.redis.get(name=lock['name'], default_val=None)
                if lock_id == lock['lock_id']:
                    self.redis.delete(name=lock['name'])

                    lock_time_diff = get_time('msec') - lock['lock_time']
                    
                    if self.debug_lock:
                        self.log.info([['c', ' -- del  ', lock_id, '  ', lock['name']], ['o', '  (was locked for: '], ['y', lock_time_diff], ['o', ' msec)'],])

                    slow_threshold = min(
                        self.slow_lock_msec, self.lock_timeout_sec * 1e3,
                    )
                    if lock_time_diff >= slow_threshold:
                        self.log.warn([
                            ['r', ' - slow lock release for '],
                            ['b', lock['name']],
                            ['r', ' took '],
                            ['b', lock_time_diff],
                            ['r', ' msec, given thresholds: '],
                            ['b', (self.slow_lock_msec, self.lock_timeout_sec)],
                        ])

            return





















# ------------------------------------------------------------------
class RedisSemaphore(ServiceManager):
    """manager class for registring redis-based semaphores
    """

    # ------------------------------------------------------------------
    def __init__(self, parent, service_name=None):
        self.class_name = self.__class__.__name__
        service_name = (service_name if service_name is not None else self.class_name)
        super().__init__(service_name=service_name)

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
        lock_heartbeats = self.redis.h_get_all(
            self.resource_lockers,
            default_val={},
        )
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
