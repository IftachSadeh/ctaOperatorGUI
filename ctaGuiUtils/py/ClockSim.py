from random import Random
from datetime import timedelta

import gevent
from gevent import sleep

from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.utils import datetime_to_secs, secs_to_datetime, date_to_string
from ctaGuiUtils.py.RedisManager import RedisManager


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
class ClockSim():
    is_active = False

    def __init__(self, base_config, *args, **kwargs):
        self.log = LogParser(base_config=base_config, title=__name__)

        if ClockSim.is_active:
            raise ValueError('Can not instantiate ClockSim more than once...')
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

        self.skip_daytime = False
        self.skip_daytime = True

        self.debug_short_night = False
        # self.debug_short_night = True

        # speedup simulation. e.g., 60*10 --> every 1 real sec goes to 10 simulated min
        # self.speed_factor = 10
        self.speed_factor = 30
        # self.speed_factor = 60 * 1
        # self.speed_factor = 60 * 10

        # minimal real-time delay between randomisations
        self.loop_sleep = 1

        # safety measure
        self.max_spped_factor = 30 * 60 * self.loop_sleep

        self.init_night_times()

        # # range in seconds of time-series data to be stored for eg monitoring points
        # self.time_series_n_seconds = 60 * 30

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

        gevent.spawn(self.loop)

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', ' - starting ClockSim.loop ...']])

        if self.speed_factor > self.max_spped_factor:
            raise ValueError('Can not over-pace the loop ...')

        while True:
            self.datetime_now += timedelta(seconds=self.loop_sleep * self.speed_factor)

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
                name='clock_sim_' + 'time_now_sec',
                data=time_now_sec,
            )
            self.redis.set(
                name='clock_sim_' + 'is_night_now',
                data=is_night_now,
            )
            self.redis.set(
                name='clock_sim_' + 'n_nights',
                data=self.n_nights,
            )
            self.redis.set(
                name='clock_sim_' + 'night_start_sec',
                data=self.night_start_sec,
            )
            self.redis.set(
                name='clock_sim_' + 'night_end_sec',
                data=self.night_end_sec,
            )

            sleep(self.loop_sleep)

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
        if self.debug_short_night:
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

        if self.skip_daytime or self.debug_short_night:
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

    def get_speed_factor(self):
        return self.speed_factor

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
