from random import Random
from datetime import timedelta

from time import sleep
from threading import Lock
import multiprocessing

from shared.ServiceManager import ServiceManager
from shared.LogParser import LogParser
from shared.utils import datetime_to_secs
from shared.utils import secs_to_datetime
from shared.utils import date_to_string
from shared.RedisManager import RedisManager


# ------------------------------------------------------------------
class ClockSim(ServiceManager):
    """clock simulation class, simulating the procession of a night

       Only a single active instance is allowed to exist. Multiple passive instances
       are allowed. A passive instance only serves as an interface for the clock via redis
    """

    lock = Lock()

    # ------------------------------------------------------------------
    def __init__(
        self,
        base_config,
        is_passive,
        interrupt_sig=None,
        *args,
        **kwargs,
    ):
        self.class_name = self.__class__.__name__
        super().__init__(service_name=self.class_name)

        self.log = LogParser(base_config=base_config, title=__name__)

        self.base_config = base_config

        self.is_passive = is_passive
        if self.is_passive:
            self.base_config.clock_sim = self

        self.redis = RedisManager(
            name=self.class_name, base_config=base_config, log=self.log
        )

        self.interrupt_sig = interrupt_sig
        if self.interrupt_sig is None:
            self.interrupt_sig = multiprocessing.Event()

        if not self.is_passive:
            with ClockSim.lock:
                self.setup_active_instance()

        return

    # ------------------------------------------------------------------
    def setup_active_instance(self):
        """setup the active instance of the class
        """

        self.rnd_gen = Random(11)
        self.debug_datetime_now = False

        # sleep duration for thread loops
        self.loop_sleep_sec = 1
        self.pubsub_sleep_sec = 0.1

        # self.is_skip_daytime = False
        self.is_skip_daytime = True

        self.is_short_night = False
        # self.is_short_night = True

        # safety measure
        self.min_speed_factor = 1
        self.max_speed_factor = 10 * 60 * self.loop_sleep_sec

        # speedup simulation e.g.,:
        #   60*10 --> every 1 real sec goes to 10 simulated min
        self.speed_factor = 30
        # self.speed_factor = 10

        self.datetime_epoch = self.base_config.datetime_epoch

        self.init_sim_params_from_redis = True
        # self.init_sim_params_from_redis = False

        self.sim_params = {
            'speed_factor': self.speed_factor,
            'min_speed_factor': self.min_speed_factor,
            'max_speed_factor': self.max_speed_factor,
            'is_skip_daytime': self.is_skip_daytime,
            'is_short_night': self.is_short_night,
        }
        self.set_sim_speed(
            data_in={
                'speed_factor': self.speed_factor,
                'is_skip_daytime': self.is_skip_daytime,
                'is_short_night': self.is_short_night,
            },
            from_redis=self.init_sim_params_from_redis,
        )

        # make sure this is the only active instance
        self.init_active_instance()

        self.init_night_times()

        self.setup_threads()

        return

    # ------------------------------------------------------------------
    def setup_threads(self):
        """register threads to be run after this and all other services have
           been initialised
        """

        self.add_thread(target=self.loop_main)
        self.add_thread(target=self.pubsub_sim_params)

        return

    # ------------------------------------------------------------------
    def check_passive(self):
        """check if this is an active or passive instance

            if this is a passive instance, make sure that an active instance
            has been initialised by some other proccess. after n_sec_try of
            waiting, raise an exception

            Returns
            -------
            bool
                is this a passive instance
        """

        need_check = (
            self.can_loop() and self.is_passive and not self.has_active_instance()
        )
        # print('xxxxxxxx', self.can_loop() , self.is_passive , self.has_active_instance(),'---',need_check)
        if not need_check:
            return self.is_passive

        n_sec_sleep, n_sec_try = 0.01, 10
        n_loops = 1 + int(n_sec_try / n_sec_sleep)
        # check that the active instance has finished the initialisation stage
        for n_loop in range(n_loops + 1):
            sleep(n_sec_sleep)

            active_state = self.has_active_instance() or (not self.can_loop())
            if active_state:
                break
            if n_loop >= n_loops:
                raise Exception(' - ClockSim active instance can not initialise ?!?!')
            if n_loop > 0 and (n_loop % int(1 / n_sec_sleep) == 0):
                self.log.warn([
                    ['r', ' - ClockSim blocking ( service_name = ', self.class_name],
                    ['r', ' ) --> waiting for the active instance to init ...'],
                ])

        return self.is_passive

    # ------------------------------------------------------------------
    def get_time_now_sec(self):
        datetime_now = self.get_datetime_now()
        time_now_sec = int(datetime_to_secs(datetime_now))

        return time_now_sec

    # ------------------------------------------------------------------
    def get_is_night_now(self):
        if self.check_passive():
            return self.redis.get('clock_sim_is_night_now')

        return self.is_night_now

    # ------------------------------------------------------------------
    def get_n_nights(self):
        if self.check_passive():
            return self.redis.get('clock_sim_n_nights')

        return self.n_nights

    # ------------------------------------------------------------------
    def get_night_start_sec(self):
        if self.check_passive():
            return self.redis.get('clock_sim_night_start_sec')

        return self.night_start_sec

    # ------------------------------------------------------------------
    def get_night_end_sec(self):
        if self.check_passive():
            return self.redis.get('clock_sim_night_end_sec')

        return self.night_end_sec

    # ------------------------------------------------------------------
    def get_time_series_start_time_sec(self):
        if self.check_passive():
            start_time_sec = self.redis.get('clock_sim_time_series_start_time_sec')
        else:
            start_time_sec = self.time_series_start_time_sec

        return int(start_time_sec)

    # ------------------------------------------------------------------
    def get_datetime_now(self):
        if self.check_passive():
            time_now_sec = self.redis.get('clock_sim_time_now_sec')
            return secs_to_datetime(time_now_sec)

        return self.datetime_now

    # ------------------------------------------------------------------
    def is_night_time_now(self):
        time_now_sec = self.get_time_now_sec()
        is_night = (
            time_now_sec > self.get_night_start_sec()
            and time_now_sec <= self.get_night_end_sec()
        )
        return is_night

    # ------------------------------------------------------------------
    def get_night_duration_sec(self):
        return (self.get_night_end_sec() - self.get_night_start_sec())

    # ------------------------------------------------------------------
    def get_astro_night_start_sec(self):
        # beginig of the astronomical night
        return int(self.get_night_start_sec())

    # ------------------------------------------------------------------
    def get_sim_params(self):
        if self.check_passive():
            sim_params = self.redis.get(name='clock_sim_sim_params')
        else:
            sim_params = self.sim_params

        return sim_params

    # ------------------------------------------------------------------
    def get_speed_factor(self):
        sim_params = self.get_sim_params()
        return sim_params['speed_factor']

    # ------------------------------------------------------------------
    def get_sec_since_midnight(self):
        days_since_epoch = (self.datetime_now - self.datetime_epoch).days
        sec_since_midnight = ((self.datetime_now - self.datetime_epoch).seconds
                              + timedelta(days=days_since_epoch).total_seconds())
        return sec_since_midnight

    # ------------------------------------------------------------------
    def init_night_times(self):
        """reset the night
        """

        self.n_nights = 0
        self.datetime_now = None

        self.night_start_sec = datetime_to_secs(self.datetime_epoch)
        self.night_end_sec = datetime_to_secs(self.datetime_epoch)
        self.time_series_start_time_sec = self.night_start_sec

        self.set_night_times()

        self.update_once()

        return

    # ------------------------------------------------------------------
    def update_once(self):
        """single update, to be run as part of a loop
        """

        self.datetime_now += timedelta(seconds=self.loop_sleep_sec * self.speed_factor)

        if self.debug_datetime_now:
            self.log.info([
                ['g', ' --- Now (night:', self.n_nights, '/', ''],
                ['p', self.is_night_time_now()],
                ['g', ') '],
                ['y', self.datetime_now],
                ['c', ' (' + str(datetime_to_secs(self.datetime_now)) + ' sec)'],
            ])

        self.update_n_night()

        time_now_sec = datetime_to_secs(self.datetime_now)
        is_night_now = self.is_night_time_now()

        self.redis.set(
            name='clock_sim_time_now_sec',
            data=time_now_sec,
        )
        self.redis.set(
            name='clock_sim_is_night_now',
            data=is_night_now,
        )
        self.redis.set(
            name='clock_sim_n_nights',
            data=self.n_nights,
        )
        self.redis.set(
            name='clock_sim_night_start_sec',
            data=self.night_start_sec,
        )
        self.redis.set(
            name='clock_sim_night_end_sec',
            data=self.night_end_sec,
        )
        self.redis.set(
            name='clock_sim_time_series_start_time_sec',
            data=self.time_series_start_time_sec,
        )
        return

    # ------------------------------------------------------------------
    def set_night_times(self):
        """reset the night
        """

        night_start_hours = self.rnd_gen.randint(18, 19)
        night_start_minutes = self.rnd_gen.randint(0, 59)
        night_end_hours = self.rnd_gen.randint(4, 5)
        night_end_minutes = self.rnd_gen.randint(0, 59)

        # short night for debugging
        if self.is_short_night:
            night_start_hours = 23
            night_start_minutes = 0
            night_end_hours = 2
            night_end_minutes = 0

        if self.datetime_now is None:
            self.datetime_now = self.datetime_epoch.replace(
                hour=(night_start_hours - 1),
            )

        self.time_series_start_time_sec = self.night_start_sec

        n_days = (self.datetime_now - self.datetime_epoch).days

        self.night_start_sec = timedelta(
            days=n_days,
            hours=night_start_hours,
            minutes=night_start_minutes,
            seconds=0,
        ).total_seconds()

        # e.g., night ends at 06:40
        self.night_end_sec = timedelta(
            days=(n_days + 1),
            hours=night_end_hours,
            minutes=night_end_minutes,
            seconds=0,
        ).total_seconds()

        if self.is_skip_daytime or self.is_short_night:
            self.datetime_now = (
                secs_to_datetime(self.night_start_sec) - timedelta(seconds=10)
            )

        night_start = date_to_string(
            secs_to_datetime(self.night_start_sec),
            date_string=None,
        )
        night_end = date_to_string(
            secs_to_datetime(self.night_end_sec),
            date_string=None,
        )
        self.log.info([
            ['b', ' - setting new night: ['],
            ['g', night_start],
            ['b', ' --> '],
            ['g', night_end],
            ['b', ']'],
        ])

        return

    # ------------------------------------------------------------------
    def update_n_night(self):
        sec_since_midnight = self.get_sec_since_midnight()
        days_since_epoch = (self.datetime_now - self.datetime_epoch).days

        is_new_day = days_since_epoch > self.n_nights
        is_past_night_time = sec_since_midnight > self.night_end_sec

        if is_new_day and is_past_night_time:
            self.n_nights = days_since_epoch
            self.set_night_times()

        return

    # ------------------------------------------------------------------
    def need_data_update(self, update_opts):
        """check if a service needs to run an update, where
           updates only happen after min_wait of simulation time
        """

        time_now = self.get_time_now_sec()

        set_prev_update = (('prev_update' not in update_opts.keys())
                           or (update_opts['prev_update'] is None))
        if set_prev_update:
            update_opts['prev_update'] = time_now - 2 * update_opts['min_wait']

        time_diff = time_now - update_opts['prev_update']
        can_update = (time_diff > update_opts['min_wait'])

        # updates only happen during the astronimical night
        is_night_time = self.is_night_time_now()

        need_update = (is_night_time and can_update)
        if need_update:
            update_opts['prev_update'] = time_now

        return need_update

    # ------------------------------------------------------------------
    def set_sim_speed(self, data_in, from_redis=False):
        """set parameters which determine the lenght of the night, the
           real-time duration, given a speed factor, the delay between nights, etc.
        """

        speed_factor = data_in['speed_factor']
        is_skip_daytime = data_in['is_skip_daytime']
        is_short_night = data_in['is_short_night']

        if from_redis:
            red_data = self.redis.get(name='clock_sim_sim_params')

            if red_data is not None:
                speed_factor = red_data['speed_factor']
                is_skip_daytime = red_data['is_skip_daytime']
                is_short_night = red_data['is_short_night']

        if speed_factor is not None:
            speed_factor = float(speed_factor)

            is_ok = (
                speed_factor >= self.min_speed_factor
                and speed_factor <= self.max_speed_factor
            )
            if not is_ok:
                raise ValueError(
                    'trying to set speed_factor out of bounds ...', speed_factor
                )

            self.speed_factor = float(speed_factor)

        if is_skip_daytime is not None:
            self.is_skip_daytime = is_skip_daytime

        if is_short_night is not None:
            self.is_short_night = is_short_night

        self.log.info([
            ['b', ' - updating clock_sim_sim_params: '],
            ['c', '   speed_factor: '],
            ['p', self.speed_factor],
            ['c', ' , is_skip_daytime: '],
            ['p', self.is_skip_daytime],
            ['c', ' , is_short_night: '],
            ['p', self.is_short_night],
        ])

        self.sim_params = {
            'speed_factor': self.speed_factor,
            'min_speed_factor': self.min_speed_factor,
            'max_speed_factor': self.max_speed_factor,
            'is_skip_daytime': self.is_skip_daytime,
            'is_short_night': self.is_short_night,
        }
        self.redis.set(
            name='clock_sim_sim_params',
            data=self.sim_params,
        )

        self.redis.publish(channel='clock_sim_updated_sim_params')

        return

    # ------------------------------------------------------------------
    def loop_main(self):
        """main loop running in its own thread, updating the night
        """

        self.log.info([['g', ' - starting ClockSim.loop_main ...']])

        while self.can_loop():
            sleep(self.loop_sleep_sec)
            with ClockSim.lock:
                self.update_once()

        self.log.info([['c', ' - ending ClockSim.loop_main ...']])

        return

    # ------------------------------------------------------------------
    def pubsub_sim_params(self):
        """loop running in its own thread, reacting to pubsub events
        """

        self.log.info([['g', ' - starting ClockSim.pubsub_sim_params ...']])

        # setup the channel once
        pubsub_tag = 'clock_sim_set_sim_params'
        pubsub = self.redis.pubsub_subscribe(pubsub_tag)

        # listen to changes on the channel and do stuff
        while self.can_loop():
            sleep(self.pubsub_sleep_sec)

            msg = self.redis.pubsub_get_message(pubsub=pubsub)
            if msg is None:
                continue

            with ClockSim.lock:
                keys = ['speed_factor', 'is_skip_daytime', 'is_short_night']
                data_out = dict()
                for key in keys:
                    data_out[key] = msg['data'][key] if key in msg['data'] else None

                self.set_sim_speed(data_in=data_out)

        self.log.info([['c', ' - ending ClockSim.pubsub_sim_params ...']])

        return


# ------------------------------------------------------------------
def get_clock_sim_data(parent):
    """convenience function, setting up a request from redis to
       get the current night parameters

        Parameters
        ----------
        parent : object
            the instance of the object calling this function

        Returns
        -------
        dict
            the current parameters of the night
    """

    red_keys = [
        ['time_now_sec', float],
        ['is_night_now', bool],
        ['n_nights', int],
        ['night_start_sec', float],
        ['night_end_sec', float],
        ['time_series_start_time_sec', float],
    ]
    pipe = parent.redis.get_pipe()
    for key in red_keys:
        pipe.get('clock_sim_' + key[0])

    clock_sim = pipe.execute()

    if len(clock_sim) != len(red_keys):
        parent.log.warning([
            ['r', ' - ', parent.widget_type, ' - could not get clock_sim - '],
            ['p', str(clock_sim)],
            ['r', ' - will use fake range ...'],
        ])
        clock_sim = [0 for i in range(len(red_keys))]

    data = dict((red_keys[i][0], red_keys[i][1](clock_sim[i]))
                for i in range(len(red_keys)))

    return data
