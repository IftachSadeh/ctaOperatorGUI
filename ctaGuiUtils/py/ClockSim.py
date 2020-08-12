from random import Random
from datetime import timedelta

from time import sleep
from threading import Lock

from ctaGuiUtils.py.ThreadManager import ThreadManager
from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.utils import datetime_to_secs, secs_to_datetime, date_to_string, get_rnd
from ctaGuiUtils.py.RedisManager import RedisManager

# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
class ClockSim(ThreadManager):
    is_active = False
    lock = Lock()

    def __init__(self, base_config, interrupt_sig, *args, **kwargs):
        super(ClockSim, self).__init__(base_config, *args, **kwargs)

        self.interrupt_sig = interrupt_sig
        self.log = LogParser(base_config=base_config, title=__name__)

        if ClockSim.is_active:
            raise Exception('Can not instantiate ClockSim more than once...')
        else:
            ClockSim.is_active = True

        self.class_name = self.__class__.__name__

        self.base_config = base_config
        self.base_config.clock_sim = self

        self.datetime_epoch = self.base_config.datetime_epoch

        self.redis = RedisManager(
            name=self.class_name, port=base_config.redis_port, log=self.log
        )

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
        self.add_thread(target=self.main_loop)
        self.add_thread(target=self.pubsub_sim_params)
        return


    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def init_night_times(self):
        self.n_nights = 0
        self.datetime_now = None

        self.night_start_sec = datetime_to_secs(self.datetime_epoch)
        self.night_end_sec = datetime_to_secs(self.datetime_epoch)
        self.night_duration_sec = 0
        self.time_series_start_time_sec = self.night_start_sec

        self.set_night_times()

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def main_loop(self):
        self.log.info([['g', ' - starting ClockSim.main_loop ...']])

        while self.can_loop(self.interrupt_sig):
            sleep(self.loop_sleep_sec)

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

        self.night_duration_sec = (self.night_end_sec - self.night_start_sec)

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
    def is_night_time_now(self):
        time_now_sec = datetime_to_secs(self.datetime_now)
        is_night = (
            time_now_sec > self.night_start_sec and time_now_sec <= self.night_end_sec
        )
        return is_night

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def need_data_update(self, update_opts):
        # updates only happen after min_wait of simulation time
        time_now = self.get_time_now_sec()

        if (('prev_update' not in update_opts.keys())
                or (update_opts['prev_update'] is None)):
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
    def get_sec_since_midnight(self):
        days_since_epoch = (self.datetime_now - self.datetime_epoch).days
        sec_since_midnight = ((self.datetime_now - self.datetime_epoch).seconds
                              + timedelta(days=days_since_epoch).total_seconds())
        return sec_since_midnight

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def get_n_nights(self):
        return self.n_nights

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def get_speed_factor(self):
        return self.speed_factor

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

        data = {
            'speed_factor': self.speed_factor,
            'min_speed_factor': self.min_speed_factor,
            'max_speed_factor': self.max_speed_factor,
            'is_skip_daytime': self.is_skip_daytime,
            'is_short_night': self.is_short_night,
        }
        self.redis.set(
            name='clock_sim_sim_params',
            packed=True,
            data=data,
        )

        self.redis.publish(channel='clock_sim_updated_sim_params')

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def pubsub_sim_params(self):
        self.log.info([['g', ' - starting ClockSim.pubsub_sim_params ...']])
        
        # setup the channel once
        pubsub_tag = 'clock_sim_set_sim_params'
        while self.redis.set_pubsub(pubsub_tag) is None:
            sleep(0.1)

        # listen to changes on the channel and do stuff
        while self.can_loop(self.interrupt_sig):
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

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def get_night_duration_sec(self):
        return self.night_duration_sec

    def get_night_start_sec(self):
        return self.night_start_sec

    def get_night_end_sec(self):
        return self.night_end_sec

    # ---------------------------------------------------------------------------
    # the global function for the current system time
    # ---------------------------------------------------------------------------
    def get_time_now_sec(self):
        # print('----', self.datetime_now, datetime_to_secs(self.datetime_now))
        return int(datetime_to_secs(self.datetime_now))

    # ---------------------------------------------------------------------------
    # beginig of the astronomical night
    # ---------------------------------------------------------------------------
    def get_astro_night_start_sec(self):
        # print('-++-', self.night_start_sec)
        return int(self.night_start_sec)

    # ---------------------------------------------------------------------------
    # time range for plotting (current night, or previous night if we are
    # currently at daytime)
    # ---------------------------------------------------------------------------
    def get_time_series_start_time_sec(self):
        # print('-??-', self.time_series_start_time_sec)
        return int(self.time_series_start_time_sec)


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
