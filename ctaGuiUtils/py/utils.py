import os
import logging
import numbers
# import time
from datetime import datetime
import numpy as np
from math import floor
from random import Random

import gevent
from gevent import sleep

from RedisManager import RedisManager

# ------------------------------------------------------------------
# initialize the color dict (may choose not to use colors here)
# ------------------------------------------------------------------
# use_log_title = False if os.uname()[1] == "sadehMac" else True
use_log_title = False
add_msg_ele_space = False

no_sub_arr_name = "empty_sub_array"
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
has_acs = ('ACSROOT' in os.environ)  # (os.uname()[1] == "dawn.ifh.de")

# userName = os.getlogin()
# redis_port = dict()
# redis_port = 6379
# #  ugly temporery hack for development:
# if userName == "verdingi":
#   has_acs = False
#   redis_port += 1

# ------------------------------------------------------------------
# for safety, make sure registered widgets can be requested by the client
# e.g., expect a module file named "AAA.py", containing a class AAA
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

# sync_types = [ "sync_tel_focus" ]


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class my_log():

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, name='', title='', do_parse_msg=True, use_colors=True):
        self.do_parse_msg = do_parse_msg
        self.name = "root" if name is "" else name
        self.log = logging.getLogger(self.name)

        self.set_colors(use_colors)
        self.base_title = title
        self.title = self.colors['c'](
            "" if title is "" else (" [" + title + "]" if use_log_title else "")
        )

        # common lock for all loggers
        self.lock = my_lock("my_log")

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
            msg = ""
            for msg_now in msg_in:
                # ------------------------------------------------------------------
                #  if there is a list of messages
                # ------------------------------------------------------------------
                if isinstance(msg_now, list):
                    # list with one element
                    if len(msg_now) == 1:
                        if add_msg_ele_space and msg != "":
                            msg += " "
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
                                msg_str = (" ").join([
                                    str(ele_now) for ele_now in msg_now[1:]
                                ])
                        # there is no color indicator, just a list of messages
                        else:
                            color_func = self.colors['']
                            msg_str = (" ").join([str(ele_now) for ele_now in msg_now])

                        # compose the colored output from the (joined list of) messages(s)
                        if add_msg_ele_space and msg != "":
                            msg += color_func(" ")
                        msg += color_func(msg_str)

                # ------------------------------------------------------------------
                # if there is a single message (non-list)
                # ------------------------------------------------------------------
                else:
                    if add_msg_ele_space and msg != "":
                        msg += " "
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
        col_def = "\033[0m"
        col_blue = "\033[34m"
        col_red = "\033[31m"
        col_light_blue = "\033[94m"
        col_yellow = "\033[33m"
        col_underline = "\033[4;30m"
        col_white_on_black = "\33[40;37;1m"
        col_white_on_green = "\33[42;37;1m"
        col_white_on_yellow = "\33[43;37;1m"
        col_green = "\033[32m"
        col_white_on_red = "\33[41;37;1m"
        col_purple = "\033[35m"
        col_cyan = "\033[36m"

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
        self.name = "generic" if name is "" else name

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
                raise Warning(" - could not get lock for " + self.name + " ...")
                break
            sleep(self.seconds_to_check)

        my_lock.locks[self.name] = True

    def __exit__(self, type, value, traceback):
        my_lock.locks[self.name] = False


# ------------------------------------------------------------------
# assertion with a msg
# ------------------------------------------------------------------
def my_assert(log=None, msg="", state=False, only_warn=False):
    if state:
        return

    if log is None:
        log = my_log(title="my_assert/" + __name__)

    if only_warn:
        log.warning([['wr', msg]])
    else:
        log.critical([['wr', msg, " - Will terminate !!!!"]])
        raise Exception(msg)

    return


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class ClockSim():
    is_active = False

    def __init__(self, site_type, end_time_sec=None, timescale=None, *args, **kwargs):
        self.log = my_log(title=__name__)

        if ClockSim.is_active:
            raise ValueError('Can not instantiate ClockSim more than once...')
        else:
            ClockSim.is_active = True

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


        print(datetime.utcnow())
        print(date_to_string(datetime.utcnow()))
        print(datetime.utcfromtimestamp(0))
        print((datetime.utcnow() - self.epoch))

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    # def get_total_time_seconds(self):
    #     return self.end_time_sec

    # ---------------------------------------------------------------------------
    # def get_n_night(self):
    #     return self.n_night

    # ---------------------------------------------------------------------------
    # def get_timescale(self):
    #     return self.timescale

    # ---------------------------------------------------------------------------
    # def get_current_time(self, n_digits=3):
    #     if n_digits >= 0 and n_digits is not None:
    #         return (
    #             int(floor(self.time_now_sec))
    #             if n_digits == 0 else round(self.time_now_sec, n_digits)
    #         )
    #     else:
    #         return self.time_now_sec

    # ---------------------------------------------------------------------------
    # def get_second_scale(self):
    #     return self.second_scale

    # ---------------------------------------------------------------------------
    # def get_reset_time(self):
    #     return self.real_reset_time_sec

    # ---------------------------------------------------------------------------
    # the global function for the current system time
    # ---------------------------------------------------------------------------
    # def get_real_time_sec(self):
    #     return int((datetime.utcnow() - self.epoch).total_seconds() * self.second_scale)

    # ---------------------------------------------------------------------------
    # def get_time_series_start_time_sec(self):
    #     return self.get_real_time_sec() - self.time_series_n_seconds * self.second_scale

    # ---------------------------------------------------------------------------
    # def get_start_time_sec(self):
    #     return 0

    # ---------------------------------------------------------------------------
    def reset_night(self, log=None):
        self.n_night += 1
        self.real_reset_time_sec = get_time('msec')

        # time_now_sec = int(floor(self.get_start_time_sec()))
        # self.time_now_sec = time_now_sec

        # if log is not None:
        #     self.log.info([
        #         ['r', "- reset_night(): "],
        #         ['y', 'time_now_sec:', self.time_now_sec, ', '],
        #         ['b', 'n_night:', self.n_night, ', '],
        #         ['g', 'real_reset_time_sec:', self.real_reset_time_sec],
        #     ])

        # self.redis.pipe.set(name='clock_sim_' + 'scale', data=self.timescale)
        # self.redis.pipe.set(name='clock_sim_' + 'start', data=time_now_sec)
        # self.redis.pipe.set(name='clock_sim_' + 'end', data=self.end_time_sec)
        # self.redis.pipe.set(name='clock_sim_' + 'now', data=time_now_sec)

        # self.redis.pipe.execute()

        return

    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def loop(self):
        return
        self.log.info([['g', " - starting ClockSim.loop ..."]])

        sleep_seconds = 1
        while True:
            self.time_now_sec += sleep_seconds / self.timescale
            if self.time_now_sec > self.end_time_sec:
                self.reset_night()

            self.redis.set(name='clock_sim_' + 'now', data=int(floor(self.time_now_sec)))

            # print('--clock_sim---------', self.time_now_sec)

            sleep(sleep_seconds)

        return
























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
                ['r', "- reset_night(): "],
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
        self.log.info([['g', " - starting time_of_night.loop ..."]])

        sleep_seconds = 1
        while True:
            self.time_now_sec += sleep_seconds / self.timescale
            if self.time_now_sec > self.end_time_sec:
                self.reset_night()

            self.redis.set(name='time_of_night_' + 'now', data=int(floor(self.time_now_sec)))

            sleep(sleep_seconds)

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
            'r', ' - ', parent.widget_name, " - could not get time_of_night - "
        ], ['p', str(time_of_night)], ['r', ' - will use fake range ...']])
        time_of_night = [0, 100, 0]

    data = {'start': time_of_night[0], 'end': time_of_night[1], 'now': time_of_night[2]}

    return data















# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def dict_module_func(data, key, val, new_values):
    if key == "id" and val in new_values:
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
# def flatten_dictOrig(data, flatDict, id="id"):
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
                        None, " - expect a dict with a key [" + str(id) + "] ?!?! "
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
    output = out_type(rnd_gen.randint(pow(10, n_digits-1), pow(10, n_digits)-1))
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
def date_to_string(date_in, time_string='%H:%m:%S'):
    return str(date_in.date().strftime('%Y/%m/%d')
               ) + "," + str(date_in.time().strftime(time_string))


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
def format_float_to_string(x):
    return str("{0:.4e}".format(x))


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
    if units == ".." or units == "-":
        units = ""
    return units
