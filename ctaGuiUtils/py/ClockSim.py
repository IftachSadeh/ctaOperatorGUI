from random import Random
from datetime import timedelta

from time import sleep
from threading import Lock
import multiprocessing

from ctaGuiUtils.py.ThreadManager import ThreadManager
from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.utils import datetime_to_secs, secs_to_datetime, date_to_string, get_rnd
from ctaGuiUtils.py.RedisManager import RedisManager

# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
class ClockSim(ThreadManager):
    lock = Lock()

    def __init__(self, base_config, is_passive, interrupt_sig=None, *args, **kwargs):
        self.log = LogParser(base_config=base_config, title=__name__)

        # self.log.info([['y', ' - ClockSim\nClockSim\nClockSim\n - ']]) ;  

        self.class_name = self.__class__.__name__

        self.base_config = base_config

        # print('is_passiveis_passiveis_passive',is_passive)
        self.is_passive = is_passive
        if self.is_passive:
            self.base_config.clock_sim = self

        self.redis = RedisManager(
            name=self.class_name, port=base_config.redis_port, log=self.log
        )

        self.interrupt_sig = interrupt_sig
        if self.interrupt_sig is None:
            self.interrupt_sig = multiprocessing.Event()
        
        if is_passive:
            return

        self.loop_active_expire = 0.5
        self.active_expire = self.loop_active_expire * 2
        self.active_init_expire = 100
        self.active_init_state = 0

        with ClockSim.lock:
            self.validate_no_active_instance()
            self.set_active_instance(expire=self.active_init_expire)

        self.datetime_epoch = self.base_config.datetime_epoch

        self.rnd_gen = Random(11)
        self.debug_datetime_now = False
        # self.debug_datetime_now = True

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

        self.init_sim_params_from_redis = True
        # self.init_sim_params_from_redis = False

        self.sim_params = {
            'speed_factor': self.speed_factor,
            'min_speed_factor': self.min_speed_factor,
            'max_speed_factor': self.max_speed_factor,
            'is_skip_daytime': self.is_skip_daytime,
            'is_short_night': self.is_short_night,
        }
        self.set_speed_factor(
            data_in={
                'speed_factor': self.speed_factor,
                'is_skip_daytime': self.is_skip_daytime,
                'is_short_night': self.is_short_night,
            },
            from_redis=self.init_sim_params_from_redis,
        )

        self.init_night_times()

        self.setup_threads()

        return
    
    # ---------------------------------------------------------------------------
    def setup_threads(self):
        self.add_thread(target=self.loop_main)
        self.add_thread(target=self.loop_active_heartbeat)
        self.add_thread(target=self.pubsub_sim_params)
        return

    # ---------------------------------------------------------------------------
    def has_active_instance(self):
        return self.redis.exists('clock_sim_active_instance')
    
    # ---------------------------------------------------------------------------
    def set_active_instance(self, expire=None):
        if expire is None:
            expire = self.active_expire
        
        self.redis.set(
            name='clock_sim_active_instance', data=self.active_init_state, expire=int(expire), packed=True,
        )
        
        return

    # ---------------------------------------------------------------------------
    def unset_active_instance(self):
        self.log.info([['r', ' - ClockSim.unset_active_instance ...']])
        self.redis.delete(name='clock_sim_active_instance')
        return

    # ---------------------------------------------------------------------------
    def validate_no_active_instance(self):
        if not self.has_active_instance():
            return
        
        # sleep for a bit
        sleep(self.active_expire)
        
        # try again for n_sec_try
        n_sec_try = 3
        for _ in range(n_sec_try):
            if not self.has_active_instance():
                break
            sleep(1)
        
        # if the instance is still locked, something must be wrong
        if self.has_active_instance():
            raise Exception('Can not instantiate ClockSim more than once...')
        
        return


    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def init_night_times(self):
        self.n_nights = 0
        self.datetime_now = None

        self.night_start_sec = datetime_to_secs(self.datetime_epoch)
        self.night_end_sec = datetime_to_secs(self.datetime_epoch)
        self.time_series_start_time_sec = self.night_start_sec

        self.set_night_times()
        self.update_once()

        self.active_init_state = 1

        return


    # ---------------------------------------------------------------------------
    def update_once(self):
        with ClockSim.lock:
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
    

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def set_night_times(self):
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

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def update_n_night(self):
        sec_since_midnight = self.get_sec_since_midnight()
        days_since_epoch = (self.datetime_now - self.datetime_epoch).days

        is_new_day = days_since_epoch > self.n_nights
        is_past_night_time = sec_since_midnight > self.night_end_sec
        # print('days_since_epoch', days_since_epoch, sec_since_midnight, self.night_end_sec, [is_new_day, is_past_night_time])

        if is_new_day and is_past_night_time:
            self.n_nights = days_since_epoch
            self.set_night_times()

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def need_data_update(self, update_opts):
        # updates only happen after min_wait of simulation time
        time_now = self.get_time_now_sec()

        set_prev_update = (
            ('prev_update' not in update_opts.keys())
            or (update_opts['prev_update'] is None)
        )
        if set_prev_update:
            update_opts['prev_update'] = time_now - 2 * update_opts['min_wait']

        time_diff = time_now - update_opts['prev_update']
        can_update = (time_diff > update_opts['min_wait'])

        # updates only happen during the astronimical night
        is_night_time = self.is_night_time_now()

        need_update = (is_night_time and can_update)
        if need_update:
            update_opts['prev_update'] = time_now

        # print('--', time_now, update_opts['prev_update'], [can_update, is_night_time])
        return need_update

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def set_speed_factor(self, data_in, from_redis=False):
        speed_factor = data_in['speed_factor']
        is_skip_daytime = data_in['is_skip_daytime']
        is_short_night = data_in['is_short_night']

        if from_redis:
            red_data = self.redis.get(
                name='clock_sim_sim_params',
                packed=True,
            )

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
            packed=True,
            data=self.sim_params,
        )

        self.redis.publish(channel='clock_sim_updated_sim_params')

        return

    # ---------------------------------------------------------------------------
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
        if not need_check:
            return self.is_passive
        
        n_loop, n_sec_sleep, n_sec_try = 0, 0.01, 10
        n_loops = 1 + int(n_sec_try / n_sec_sleep)
        while not self.has_active_instance():
            sleep(n_sec_sleep)
            if n_loop >= n_loops:
                raise Exception(
                    ' - ClockSim can not proceed in passive mode'
                    + ' without an initialised active instance'
                )
            if n_loop > 0 and (n_loop % int(1/n_sec_sleep) == 0):
                self.log.warn([
                    ['r', ' - ClockSim blocking ! --> waiting for an active'],
                    ['r', ' instance to come online ...'],
                ])

            n_loop += 1
        
        # check that the active instance has finished the initialisation stage
        for n_loop in range(n_loops + 1):
            sleep(n_sec_sleep) 

            active_init_state = self.redis.get(
                name='clock_sim_active_instance', packed=True
            )
            if active_init_state == 1:
                break
            if n_loop >= n_loops:
                raise Exception(
                    ' - ClockSim active instance can not initialise ?!?!'
                )


        return self.is_passive


    # ---------------------------------------------------------------------------
    def get_time_now_sec(self):
        datetime_now = self.get_datetime_now()
        time_now_sec = int(datetime_to_secs(datetime_now))

        return time_now_sec

    # ---------------------------------------------------------------------------
    def get_is_night_now(self):
        if self.check_passive():
            return self.redis.get('clock_sim_is_night_now')

        return self.is_night_now

    # ---------------------------------------------------------------------------
    def get_n_nights(self):
        if self.check_passive():
            return self.redis.get('clock_sim_n_nights')

        return self.n_nights

    # ---------------------------------------------------------------------------
    def get_night_start_sec(self):
        if self.check_passive():
            return self.redis.get('clock_sim_night_start_sec')

        return self.night_start_sec

    # ---------------------------------------------------------------------------
    def get_night_end_sec(self):
        if self.check_passive():
            return self.redis.get('clock_sim_night_end_sec')

        return self.night_end_sec

    # ---------------------------------------------------------------------------
    def get_time_series_start_time_sec(self):
        if self.check_passive():
            start_time_sec = self.redis.get('clock_sim_time_series_start_time_sec')
        else:
            start_time_sec = self.time_series_start_time_sec

        return int(start_time_sec)

    # ---------------------------------------------------------------------------
    def get_datetime_now(self):
        if self.check_passive():
            time_now_sec = self.redis.get('clock_sim_time_now_sec')
            return secs_to_datetime(time_now_sec)

        return self.datetime_now

    # ---------------------------------------------------------------------------
    def is_night_time_now(self):
        time_now_sec = self.get_time_now_sec()
        is_night = (
            time_now_sec > self.get_night_start_sec()
            and time_now_sec <= self.get_night_end_sec()
        )
        return is_night

    # ---------------------------------------------------------------------------
    def get_night_duration_sec(self):
        return (self.get_night_end_sec() - self.get_night_start_sec())

    # ---------------------------------------------------------------------------
    def get_astro_night_start_sec(self):
        # beginig of the astronomical night
        return int(self.get_night_start_sec())

    # ---------------------------------------------------------------------------
    def get_sim_params(self):
        if self.check_passive():
            sim_params = self.redis.get(
                name='clock_sim_sim_params',
                packed=True,
            )
        else:
            sim_params = self.sim_params
        
        return sim_params

    # ---------------------------------------------------------------------------
    def get_speed_factor(self):
        sim_params = self.get_sim_params()
        return sim_params['speed_factor']

    # ---------------------------------------------------------------------------
    def get_sec_since_midnight(self):
        days_since_epoch = (self.datetime_now - self.datetime_epoch).days
        sec_since_midnight = (
            (self.datetime_now - self.datetime_epoch).seconds
            + timedelta(days=days_since_epoch).total_seconds()
        )
        return sec_since_midnight

    # ---------------------------------------------------------------------------
    def loop_main(self):
        self.log.info([['g', ' - starting ClockSim.loop_main ...']])

        while self.can_loop():
            sleep(self.loop_sleep_sec)
            self.update_once()

        self.log.info([['c', ' - ending ClockSim.loop_main ...']])

        return

    # ---------------------------------------------------------------------------
    def loop_active_heartbeat(self):
        self.log.info([['g', ' - starting ClockSim.loop_active_heartbeat ...']])

        while self.can_loop():
            sleep(self.loop_active_expire)
            self.set_active_instance()

        self.log.info([['c', ' - ending ClockSim.loop_active_heartbeat ...']])
        
        return

    # ---------------------------------------------------------------------------
    def pubsub_sim_params(self):
        self.log.info([['g', ' - starting ClockSim.pubsub_sim_params ...']])
        
        # setup the channel once
        pubsub_tag = 'clock_sim_set_sim_params'
        while self.redis.set_pubsub(pubsub_tag) is None:
            sleep(0.1)

        # listen to changes on the channel and do stuff
        while self.can_loop():
            sleep(self.pubsub_sleep_sec)
            
            msg = self.redis.get_pubsub(pubsub_tag, packed=True)
            if msg is None:
                continue

            with ClockSim.lock:
                keys = ['speed_factor', 'is_skip_daytime', 'is_short_night']
                data_out = dict()
                for key in keys:
                    data_out[key] = msg['data'][key] if key in msg['data'] else None

                self.set_speed_factor(data_in=data_out)

        self.log.info([['c', ' - ending ClockSim.pubsub_sim_params ...']])

        return


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
def get_clock_sim_data(parent):
    red_keys = [
        ['time_now_sec', float],
        ['is_night_now', bool],
        ['n_nights', int],
        ['night_start_sec', float],
        ['night_end_sec', float],
        ['time_series_start_time_sec', float],
    ]
    for key in red_keys:
        parent.redis.pipe.get('clock_sim_' + key[0])

    clock_sim = parent.redis.pipe.execute()

    if len(clock_sim) != len(red_keys):
        parent.log.warning([[
            'r', ' - ', parent.widget_name, ' - could not get clock_sim - '
        ], ['p', str(clock_sim)], ['r', ' - will use fake range ...']])
        clock_sim = [0 for i in range(len(red_keys))]

    data = dict((red_keys[i][0], red_keys[i][1](clock_sim[i]))
                for i in range(len(red_keys)))

    return data

