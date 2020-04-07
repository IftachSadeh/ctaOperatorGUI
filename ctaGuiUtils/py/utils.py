import os
import logging
import numbers
# import time
from datetime import datetime
from datetime import timedelta
import numpy as np
from math import floor
from random import Random

import gevent
from gevent import sleep

from RedisManager import RedisManager

# ------------------------------------------------------------------
# initialize the color dict (may choose not to use colors here)
# ------------------------------------------------------------------
# use_log_title = False if os.uname()[1] == 'sadehMac' else True
use_log_title = False
add_msg_ele_space = False

no_sub_arr_name = 'empty_sub_array'
inst_pos_0 = [0, 90]

# ------------------------------------------------------------------
# .... FIXME -- bad practice.... upgrade this ....
# module properties set by config_north.ini
# ------------------------------------------------------------------
site_type = None
redis_port = None

# ------------------------------------------------------------------
# check if ACS is available (assumed yes if the 'ACSROOT' env variable is defined)
# ------------------------------------------------------------------
has_acs = ('ACSROOT' in os.environ)  # (os.uname()[1] == 'dawn.ifh.de')
# has_acs = False

# userName = os.getlogin()
# redis_port = dict()
# redis_port = 6379
# #  ugly temporery hack for development:
# if userName == 'verdingi':
#   has_acs = False
#   redis_port += 1

# ------------------------------------------------------------------
# for safety, make sure registered widgets can be requested by the client
# e.g., expect a module file named 'AAA.py', containing a class AAA
all_widgets = []
allowed_widget_types = {
    'synced': [
        'ArrZoomerView',
        'PlotsDash',
        'SubArrGrp',
        'telPntSky',
        'SchedBlocks',
        'NightSched',
        'inst_pos_0',
        'ObsBlockControl',
        'EmptyExample',
        'CommentSched',
        'SchedBlockController',
        'SchedBlockInspector',
        'WeatherMonitoring',
    ],
    'not_synced': [
        'PanelSync',
    ]
}

# sync_types = [ 'sync_tel_focus' ]


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class my_log():

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, name='', title='', do_parse_msg=True, use_colors=True):
        self.do_parse_msg = do_parse_msg
        self.name = 'root' if name is '' else name
        self.log = logging.getLogger(self.name)

        self.set_colors(use_colors)
        self.base_title = title
        self.title = self.colors['c'](
            '' if title is '' else (' [' + title + ']' if use_log_title else '')
        )

        # common lock for all loggers
        self.lock = my_lock('my_log')

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def parse_msg(self, msg_in):
        if not self.do_parse_msg:
            return msg_in

        # ------------------------------------------------------------------
        # if the input is a list
        # ------------------------------------------------------------------
        if isinstance(msg_in, list):
            msg = ''
            for msg_now in msg_in:
                # ------------------------------------------------------------------
                #  if there is a list of messages
                # ------------------------------------------------------------------
                if isinstance(msg_now, list):
                    # list with one element
                    if len(msg_now) == 1:
                        if add_msg_ele_space and msg != '':
                            msg += ' '
                        msg += str(msg_now[0])
                    # list with multiple elements
                    elif len(msg_now) >= 2:
                        # first element is a color indicator
                        if msg_now[0] in self.colors:
                            color_func = self.colors[msg_now[0]]
                            # either can be one or more messages after the color indicator
                            if len(msg_now) == 2:
                                msg_str = str(msg_now[1])
                            else:
                                msg_str = (' ').join([
                                    str(ele_now) for ele_now in msg_now[1:]
                                ])
                        # there is no color indicator, just a list of messages
                        else:
                            color_func = self.colors['']
                            msg_str = (' ').join([str(ele_now) for ele_now in msg_now])

                        # compose the colored output from the (joined list of) messages(s)
                        if add_msg_ele_space and msg != '':
                            msg += color_func(' ')
                        msg += color_func(msg_str)

                # ------------------------------------------------------------------
                # if there is a single message (non-list)
                # ------------------------------------------------------------------
                else:
                    if add_msg_ele_space and msg != '':
                        msg += ' '
                    msg += str(msg_now)

        # ------------------------------------------------------------------
        # if the input is a simple element (non-list)
        # ------------------------------------------------------------------
        else:
            msg = str(msg_in)

        # finally, send the output, with the optional title added
        # ------------------------------------------------------------------
        return (msg + self.title)

    def debug(self, msg_in, *args, **kwargs):
        with self.lock:
            self.log.debug(self.parse_msg(msg_in), *args, **kwargs)

    def info(self, msg_in, *args, **kwargs):
        with self.lock:
            self.log.info(self.parse_msg(msg_in), *args, **kwargs)

    def warning(self, msg_in, *args, **kwargs):
        with self.lock:
            self.log.warning(self.parse_msg(msg_in), *args, **kwargs)

    def warn(self, msg_in, *args, **kwargs):
        with self.lock:
            self.log.warn(self.parse_msg(msg_in), *args, **kwargs)

    def error(self, msg_in, *args, **kwargs):
        with self.lock:
            self.log.error(self.parse_msg(msg_in), *args, **kwargs)

    def critical(self, msg_in, *args, **kwargs):
        with self.lock:
            self.log.critical(self.parse_msg(msg_in), *args, **kwargs)

    # ------------------------------------------------------------------
    # color output
    # ------------------------------------------------------------------
    def get_col_dict(self, use_colors):
        col_def = '\033[0m'
        col_blue = '\033[34m'
        col_red = '\033[31m'
        col_light_blue = '\033[94m'
        col_yellow = '\033[33m'
        col_underline = '\033[4;30m'
        col_white_on_black = '\33[40;37;1m'
        col_white_on_green = '\33[42;37;1m'
        col_white_on_yellow = '\33[43;37;1m'
        col_green = '\033[32m'
        col_white_on_red = '\33[41;37;1m'
        col_purple = '\033[35m'
        col_cyan = '\033[36m'

        def no_color(msg):
            return '' if (str(msg) is '') else str(msg)

        def blue(msg):
            return '' if (str(msg) is '') else col_blue + str(msg) + col_def

        def red(msg):
            return '' if (str(msg) is '') else col_red + str(msg) + col_def

        def green(msg):
            return '' if (str(msg) is '') else col_green + str(msg) + col_def

        def light_blue(msg):
            return '' if (str(msg) is '') else col_light_blue + str(msg) + col_def

        def yellow(msg):
            return '' if (str(msg) is '') else col_yellow + str(msg) + col_def

        def purple(msg):
            return '' if (str(msg) is '') else col_purple + str(msg) + col_def

        def cyan(msg):
            return '' if (str(msg) is '') else col_cyan + str(msg) + col_def

        def white_on_black(msg):
            return '' if (str(msg) is '') else col_white_on_black + str(msg) + col_def

        def red_on_black(msg):
            return '' if (str(msg) is ''
                          ) else col_white_on_black + col_red + str(msg) + col_def

        def blue_on_black(msg):
            return '' if (str(msg) is ''
                          ) else col_white_on_black + col_blue + str(msg) + col_def

        def yellow_on_black(msg):
            return '' if (str(msg) is ''
                          ) else col_white_on_black + col_yellow + str(msg) + col_def

        def white_on_red(msg):
            return '' if (str(msg) is '') else col_white_on_red + str(msg) + col_def

        def yellow_on_red(msg):
            return '' if (str(msg) is ''
                          ) else col_white_on_red + col_yellow + str(msg) + col_def

        def white_on_yellow(msg):
            return '' if (str(msg) is '') else col_white_on_yellow + str(msg) + col_def

        def white_on_green(msg):
            return '' if (str(msg) is '') else col_white_on_green + str(msg) + col_def

        colors = dict()

        colors[''] = no_color if not use_colors else no_color
        colors['r'] = no_color if not use_colors else red
        colors['g'] = no_color if not use_colors else green
        colors['b'] = no_color if not use_colors else blue
        colors['y'] = no_color if not use_colors else yellow
        colors['p'] = no_color if not use_colors else purple
        colors['c'] = no_color if not use_colors else cyan
        colors['lb'] = no_color if not use_colors else light_blue
        colors['wb'] = no_color if not use_colors else white_on_black
        colors['rb'] = no_color if not use_colors else red_on_black
        colors['bb'] = no_color if not use_colors else blue_on_black
        colors['yb'] = no_color if not use_colors else yellow_on_black
        colors['wr'] = no_color if not use_colors else white_on_red
        colors['yr'] = no_color if not use_colors else yellow_on_red
        colors['wy'] = no_color if not use_colors else white_on_yellow
        colors['wg'] = no_color if not use_colors else white_on_green

        return colors

    def set_colors(self, use_colors):
        self.colors = self.get_col_dict(use_colors)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_title(self):
        return self.base_title


# ------------------------------------------------------------------
# locker class by name
# ------------------------------------------------------------------


class my_lock():
    locks = {}

    def __init__(self, name='', seconds_to_check=None):
        self.name = 'generic' if name is '' else name

        self.seconds_to_check = max(
            0.0001,
            min(
                0.5, (
                    seconds_to_check
                    if isinstance(seconds_to_check, numbers.Number) else 0.05
                )
            )
        )
        self.n_max_checks = max(5 / self.seconds_to_check, 2)

        if self.name not in my_lock.locks:
            my_lock.locks[self.name] = False

    def __enter__(self):
        n_checked = 0
        while my_lock.locks[self.name]:
            n_checked += 1
            if n_checked > self.n_max_checks:
                raise Warning(' - could not get lock for ' + self.name + ' ...')
                break
            sleep(self.seconds_to_check)

        my_lock.locks[self.name] = True

    def __exit__(self, type, value, traceback):
        my_lock.locks[self.name] = False


# ------------------------------------------------------------------
# assertion with a msg
# ------------------------------------------------------------------
def my_assert(log=None, msg='', state=False, only_warn=False):
    if state:
        return

    if log is None:
        log = my_log(title='my_assert/' + __name__)

    if only_warn:
        log.warning([['wr', msg]])
    else:
        log.critical([['wr', msg, ' - Will terminate !!!!']])
        raise Exception(msg)

    return


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
class ClockSim():
    is_active = False

    def __init__(self, site_type, *args, **kwargs):
        self.log = my_log(title=__name__)

        if ClockSim.is_active:
            raise ValueError('Can not instantiate ClockSim more than once...')
        else:
            ClockSim.is_active = True

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(name=self.class_name, port=redis_port, log=self.log)

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

        self.night_start_sec = datetime_to_secs(datetime_epoch)
        self.night_end_sec = datetime_to_secs(datetime_epoch)
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
            self.datetime_now = datetime_epoch.replace(hour=(night_start_hours - 1), )

        self.time_series_start_time_sec = self.night_start_sec

        n_days = (self.datetime_now - datetime_epoch).days

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
        days_since_epoch = (self.datetime_now - datetime_epoch).days

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
        days_since_epoch = (self.datetime_now - datetime_epoch).days
        sec_since_midnight = ((self.datetime_now - datetime_epoch).seconds
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


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
datetime_epoch = datetime.utcfromtimestamp(0)


def datetime_to_secs(datetime_now):
    return (datetime_now - datetime_epoch).total_seconds()


def secs_to_datetime(secs_now):
    return datetime_epoch + timedelta(seconds=float(secs_now))


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
def get_clock_sim(parent):
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


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class time_of_night():
    is_active = False

    def __init__(self, site_type, end_time_sec=None, timescale=None, *args, **kwargs):
        self.log = my_log(title=__name__)

        if time_of_night.is_active:
            raise ValueError('Can not instantiate time_of_night more than once...')
        else:
            time_of_night.is_active = True

        # 28800 -> 8 hour night
        self.end_time_sec = 28800 if end_time_sec is None else end_time_sec
        # 0.035 -> have 30 minutes last for one minute in real time
        self.timescale = 0.07 if end_time_sec is None else timescale
        # 0.0035 -> have 30 minutes last for 6 sec in real time
        # if not has_acs:
        #   self.timescale /= 2
        # self.timescale /= 20

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(name=self.class_name, port=redis_port, log=self.log)

        self.n_night = -1

        # range in seconds of time-series data to be stored for eg monitoring points
        self.epoch = datetime.utcfromtimestamp(0)
        self.time_series_n_seconds = 60 * 30
        self.second_scale = 1000

        self.reset_night()

        gevent.spawn(self.loop)

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def get_total_time_seconds(self):
        return self.end_time_sec

    # ---------------------------------------------------------------------------
    def get_n_night(self):
        return self.n_night

    # ---------------------------------------------------------------------------
    def get_timescale(self):
        return self.timescale

    # ---------------------------------------------------------------------------
    def get_current_time(self, n_digits=3):
        if n_digits >= 0 and n_digits is not None:
            return (
                int(floor(self.time_now_sec))
                if n_digits == 0 else round(self.time_now_sec, n_digits)
            )
        else:
            return self.time_now_sec

    # ---------------------------------------------------------------------------
    def get_second_scale(self):
        return self.second_scale

    # ---------------------------------------------------------------------------
    def get_reset_time(self):
        return self.real_reset_time_sec

    # ---------------------------------------------------------------------------
    # the global function for the current system time
    # ---------------------------------------------------------------------------
    def get_real_time_sec(self):
        return int((datetime.utcnow() - self.epoch).total_seconds() * self.second_scale)

    # ---------------------------------------------------------------------------
    def get_time_series_start_time_sec(self):
        return self.get_real_time_sec() - self.time_series_n_seconds * self.second_scale

    # ---------------------------------------------------------------------------
    def get_start_time_sec(self):
        return 0

    # ---------------------------------------------------------------------------
    def reset_night(self, log=None):
        self.n_night += 1
        self.real_reset_time_sec = self.get_real_time_sec()

        time_now_sec = int(floor(self.get_start_time_sec()))
        self.time_now_sec = time_now_sec

        if log is not None:
            self.log.info([
                ['r', '- reset_night(): '],
                ['y', 'time_now_sec:', self.time_now_sec, ', '],
                ['b', 'n_night:', self.n_night, ', '],
                ['g', 'real_reset_time_sec:', self.real_reset_time_sec],
            ])

        self.redis.pipe.set(name='time_of_night_' + 'scale', data=self.timescale)
        self.redis.pipe.set(name='time_of_night_' + 'start', data=time_now_sec)
        self.redis.pipe.set(name='time_of_night_' + 'end', data=self.end_time_sec)
        self.redis.pipe.set(name='time_of_night_' + 'now', data=time_now_sec)

        self.redis.pipe.execute()

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', ' - starting time_of_night.loop ...']])

        sleep_sec = 1
        while True:
            self.time_now_sec += sleep_sec / self.timescale
            if self.time_now_sec > self.end_time_sec:
                self.reset_night()

            self.redis.set(
                name='time_of_night_' + 'now', data=int(floor(self.time_now_sec))
            )

            sleep(sleep_sec)

        return


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
def get_time_of_night(parent):
    parent.redis.pipe.get('time_of_night_' + 'start')
    parent.redis.pipe.get('time_of_night_' + 'end')
    parent.redis.pipe.get('time_of_night_' + 'now')

    time_of_night = parent.redis.pipe.execute()

    if len(time_of_night) != 3:
        parent.log.warning([[
            'r', ' - ', parent.widget_name, ' - could not get time_of_night - '
        ], ['p', str(time_of_night)], ['r', ' - will use fake range ...']])
        time_of_night = [0, 100, 0]

    data = {'start': time_of_night[0], 'end': time_of_night[1], 'now': time_of_night[2]}

    return data


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def dict_module_func(data, key, val, new_values):
    if key == 'id' and val in new_values:
        data['val'] = new_values[val]
    return


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------


def traverse_object(data, new_values, module_func=None):
    if module_func is None:
        module_func = dict_module_func

    if isinstance(data, dict):
        for k, v in data.iteritems():
            if isinstance(v, dict) or isinstance(v, list) or isinstance(v, tuple):
                traverse_object(data=v, new_values=new_values, module_func=module_func)
            else:
                module_func(data, k, v, new_values)
    elif isinstance(data, list) or isinstance(data, tuple):
        for v in data:
            traverse_object(data=v, new_values=new_values, module_func=module_func)
    return


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
# def flatten_dictOrig(data, flatDict, id='id'):
#   if isinstance(data, dict):
#     for k,v in data.items():
#       if isinstance(v, dict) or isinstance(v, list) or isinstance(v, tuple):
#         flatten_dictOrig(data=v, flatDict=flatDict, id=id)
#       else:
#         if k == id:
#           # print v
#           flatDict[v] = data
#   elif isinstance(data, list) or isinstance(data, tuple):
#     for v in data:
#       flatten_dictOrig(data=v, flatDict=flatDict, id=id)
#   return


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def flatten_dict(data_in, id='id', child_ids='children', sibling_ids='siblings'):
    data_out = dict()

    def flatten(data, depth):
        if isinstance(data, dict) and (id in data.keys()):
            depth += 1

        if isinstance(data, dict):
            for key, ele in data.items():
                if isinstance(ele, dict) or isinstance(ele, list) or isinstance(ele,
                                                                                tuple):
                    flatten(data=ele, depth=depth)
                elif key == id:
                    data_out[ele] = {
                        'depth': depth,
                        'height': None,
                        'parent': None,
                        child_ids: [],
                        sibling_ids: [],
                        'data': data
                    }
                else:
                    continue
        elif isinstance(data, list) or isinstance(data, tuple):
            for ele in data:
                flatten(data=ele, depth=depth)

        return

    flatten(data_in, -1)

    max_depth = max([x['depth'] for x in data_out.values()])

    for key, ele in data_out.items():
        ele['height'] = max_depth - ele['depth']

        if child_ids in ele['data']:
            for child in ele['data'][child_ids]:
                if isinstance(child, dict) and (id in child):
                    data_out[child[id]]['parent'] = key
                    ele[child_ids].append(child[id])
                else:
                    # fixme - try/except instead ...
                    my_assert(
                        None, ' - expect a dict with a key [' + str(id) + '] ?!?! '
                        + str(child), False
                    )

    for key0, ele0 in data_out.items():
        for key1, ele1 in data_out.items():
            if (ele0['parent'] is not None) and \
                (ele0['parent'] == ele1['parent']) and \
                    (key0 != key1):
                ele0[sibling_ids].append(key1)

    return data_out


# ------------------------------------------------------------------
# for debugging, and easier time counter ...
# ------------------------------------------------------------------
# nTimeCount = 0
# def get_time():
#     global nTimeCount
#     if nTimeCount > 1e7:
#         nTimeCount = 0
#     nTimeCount += 1
#     return nTimeCount
# ------------------------------------------------------------------


# ---------------------------------------------------------------------------
# time since epoch in milisecond
# ---------------------------------------------------------------------------
def get_time(sec_scale):
    if sec_scale == 'sec':
        scale = 1
    elif sec_scale == 'msec':
        scale = 3
    else:
        raise
    secs = (datetime.utcnow() - datetime.utcfromtimestamp(0)).total_seconds()
    return int(secs * pow(10, scale))
    # return int(time.time() * 1e3)


# ---------------------------------------------------------------------------
# unique initialisation for rnd generator
# ---------------------------------------------------------------------------
def get_rnd_seed():
    return int(get_time(sec_scale='msec'))


# ---------------------------------------------------------------------------
# random number
# ---------------------------------------------------------------------------
rnd_gen = Random(get_rnd_seed())


def get_rnd(n_digits=2, out_type=int):
    n_digits = max(n_digits, 1)
    output = out_type(rnd_gen.randint(pow(10, n_digits - 1), pow(10, n_digits) - 1))
    if out_type is float:
        output = round(output * pow(10, -n_digits), n_digits)
        # output = out_type(('%0' + str(n_digits) + 'f') % output)

    return output


# def getDateTimeFormat():
#   return '%Y/%m/%d,%H:%m:%S'
# def getDateTimeStr():
#   return datetime.utcnow().strftime(getDateTimeFormat())


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
def delta_seconds(date0, date1, is_microseconds=False):
    if is_microseconds:
        n_seconds = (date1 - date0).days * 86400 * \
            1000000 + (date1 - date0).microseconds
    else:
        n_seconds = (date1 - date0).days * 86400 + (date1 - date0).seconds
    return n_seconds


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
time_str_formats = {
    'date': '%Y/%m/%d',
    'time': '%H:%M:%S',
}


def date_to_string(date_in, time_string='', date_string=''):
    if time_string == '':
        time_string = time_str_formats['time']
    if date_string == '':
        date_string = time_str_formats['date']

    output = ''
    if date_string is not None:
        output += str(date_in.date().strftime(date_string))
    if time_string is not None:
        if output != '':
            output += ','
        output += str(date_in.time().strftime(time_string))

    # output = (
    #     str(date_in.date().strftime(date_string))
    #     + ',' + str(date_in.time().strftime(time_string))
    # )

    return str(output)


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
def format_float_to_string(x):
    return str('{0:.4e}'.format(x))


# ---------------------------------------------------------------------------
# resampling function for reducing the size of datasets
# ---------------------------------------------------------------------------
def pd_resampler(arr_in):
    if len(arr_in) > 0:
        return arr_in[0]
    else:
        return np.nan


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def has_data_resampler(arr_in):
    if len(arr_in) > 0:
        return 1
    else:
        return np.nan


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def format_units(units_in):
    units = units_in
    if units == '..' or units == '-':
        units = ''
    return units
