import os
import numpy as np
from math import floor
from datetime import datetime
from datetime import timedelta

import asyncio
from time import sleep

from shared.LogParser import LogParser
from shared.RedisManager import RedisManager
from shared.BaseConfig import BaseConfig
from shared.ServiceManager import ServiceManager

# ------------------------------------------------------------------
# check if ACS is available (assumed yes if the 'ACSROOT' env variable is defined)
# ------------------------------------------------------------------
has_acs = ('ACSROOT' in os.environ)  # (os.uname()[1] == 'dawn.ifh.de')


# ------------------------------------------------------------------
def datetime_to_secs(datetime_now):
    return (datetime_now - BaseConfig.datetime_epoch).total_seconds()


# ------------------------------------------------------------------
def secs_to_datetime(secs_now):
    return BaseConfig.datetime_epoch + timedelta(seconds=float(secs_now))


# ------------------------------------------------------------------
def delta_seconds(date0, date1, is_microseconds=False):
    if is_microseconds:
        n_seconds = (date1 - date0).days * 86400 * \
            1000000 + (date1 - date0).microseconds
    else:
        n_seconds = (date1 - date0).days * 86400 + (date1 - date0).seconds
    return n_seconds


# ------------------------------------------------------------------
def date_to_string(date_in, time_string='', date_string=''):
    if time_string == '':
        time_string = BaseConfig.time_str_formats['time']
    if date_string == '':
        date_string = BaseConfig.time_str_formats['date']

    output = ''
    if date_string is not None:
        output += str(date_in.date().strftime(date_string))
    if time_string is not None:
        if output != '':
            output += ' '
        output += str(date_in.time().strftime(time_string))

    # output = (
    #     str(date_in.date().strftime(date_string))
    #     + ',' + str(date_in.time().strftime(time_string))
    # )

    return str(output)


# ------------------------------------------------------------------
def get_time(sec_scale):
    """time since epoch in milisecond
    """

    if sec_scale == 'sec':
        scale = 0
    elif sec_scale == 'msec':
        scale = 3
    else:
        raise
    secs = (datetime.utcnow() - datetime.utcfromtimestamp(0)).total_seconds()
    return int(secs * pow(10, scale))


# ------------------------------------------------------------------
def dict_module_func(data, key, val, new_values):
    if key == 'id' and val in new_values:
        data['val'] = new_values[val]
    return


# ------------------------------------------------------------------
def traverse_object(data, new_values, module_func=None):
    if module_func is None:
        module_func = dict_module_func

    if isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, (dict, list, set, tuple)):
                traverse_object(data=v, new_values=new_values, module_func=module_func)
            else:
                module_func(data, k, v, new_values)
    elif isinstance(data, (list, set, tuple)):
        for v in data:
            traverse_object(data=v, new_values=new_values, module_func=module_func)
    return


# ------------------------------------------------------------------
def flatten_dict(data_in, id='id', child_ids='children', sibling_ids='siblings'):
    data_out = dict()

    def flatten(data, depth):
        if isinstance(data, dict) and (id in data.keys()):
            depth += 1

        if isinstance(data, dict):
            for key, ele in data.items():
                if isinstance(ele, (dict, list, set, tuple)):
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
        elif isinstance(data, (list, set, tuple)):
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
def get_rnd_seed():
    """unique initialisation for rnd generator
    """

    return int(get_time(sec_scale='msec'))


# ------------------------------------------------------------------
def get_rnd(n_digits=2, out_type=int, is_unique_seed=False):
    n_digits = max(n_digits, 1)
    rnd_min = pow(10, n_digits - 1)
    rnd_max = pow(10, n_digits) - 1

    if is_unique_seed:
        output = BaseConfig.rnd_gen_unique.randint(rnd_min, rnd_max)
    else:
        output = BaseConfig.rnd_gen.randint(rnd_min, rnd_max)

    output = out_type(output)
    if out_type is float:
        output = round(output * pow(10, -n_digits), n_digits)
        # output = out_type(('%0' + str(n_digits) + 'f') % output)

    return output


# ------------------------------------------------------------------
def pd_resampler(arr_in):
    """resampling function for reducing the size of datasets
    """

    if len(arr_in) > 0:
        return arr_in[0]
    else:
        return np.nan


# ------------------------------------------------------------------
def has_data_resampler(arr_in):
    if len(arr_in) > 0:
        return 1
    else:
        return np.nan


# ------------------------------------------------------------------
def format_units(units_in):
    units = units_in
    if units == '..' or units == '-':
        units = ''
    return units


# ------------------------------------------------------------------
def format_float_to_string(x):
    return str('{0:.4e}'.format(x))


# ------------------------------------------------------------------
def is_coroutine(func):
    is_crt = (asyncio.iscoroutine(func) or asyncio.iscoroutinefunction(func))
    return is_crt


# ------------------------------------------------------------------
class time_of_night(ServiceManager):

    # ------------------------------------------------------------------
    def __init__(
        self,
        base_config,
        service_name,
        interrupt_sig,
        end_time_sec=None,
        timescale=None,
        *args,
        **kwargs
    ):
        self.class_name = self.__class__.__name__
        service_name = (service_name if service_name is not None else self.class_name)
        super().__init__(service_name=service_name)

        self.log = LogParser(base_config=base_config, title=__name__)

        self.base_config = base_config

        self.service_name = service_name
        self.interrupt_sig = interrupt_sig

        # 28800 -> 8 hour night
        self.end_time_sec = 28800 if end_time_sec is None else end_time_sec
        # 0.035 -> have 30 minutes last for one minute in real time
        self.timescale = 0.07 if end_time_sec is None else timescale
        # 0.0035 -> have 30 minutes last for 6 sec in real time
        # if not has_acs:
        #   self.timescale /= 2
        # self.timescale /= 20

        self.redis = RedisManager(
            name=self.class_name, base_config=base_config, log=self.log
        )

        self.n_night = -1

        # sleep duration for thread loops
        self.loop_sleep_sec = 1

        # range in seconds of time-series data to be stored for eg monitoring points
        self.epoch = datetime.utcfromtimestamp(0)
        self.time_series_n_seconds = 60 * 30
        self.second_scale = 1000

        self.reset_night()

        # make sure this is the only active instance
        self.init_active_instance()

        self.setup_threads()

        return

    # ------------------------------------------------------------------
    def setup_threads(self):

        self.add_thread(target=self.loop_main)
        self.add_thread(target=self.loop_active_heartbeat)

        return

    # ------------------------------------------------------------------
    def get_total_time_seconds(self):
        return self.end_time_sec

    # ------------------------------------------------------------------
    def get_n_night(self):
        return self.n_night

    # ------------------------------------------------------------------
    def get_timescale(self):
        return self.timescale

    # ------------------------------------------------------------------
    def get_current_time(self, n_digits=3):
        if n_digits >= 0 and n_digits is not None:
            return (
                int(floor(self.time_now_sec))
                if n_digits == 0 else round(self.time_now_sec, n_digits)
            )
        else:
            return self.time_now_sec

    # ------------------------------------------------------------------
    def get_second_scale(self):
        return self.second_scale

    # ------------------------------------------------------------------
    def get_reset_time(self):
        return self.real_reset_time_sec

    # ------------------------------------------------------------------
    def get_real_time_sec(self):
        """the global function for the current system time
        """

        return int((datetime.utcnow() - self.epoch).total_seconds() * self.second_scale)

    # ------------------------------------------------------------------
    def get_time_series_start_time_sec(self):
        return self.get_real_time_sec() - self.time_series_n_seconds * self.second_scale

    # ------------------------------------------------------------------
    def get_start_time_sec(self):
        return 0

    # ------------------------------------------------------------------
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

        pipe = self.redis.get_pipe()

        pipe.set(name='time_of_night_' + 'scale', data=self.timescale)
        pipe.set(name='time_of_night_' + 'start', data=time_now_sec)
        pipe.set(name='time_of_night_' + 'end', data=self.end_time_sec)
        pipe.set(name='time_of_night_' + 'now', data=time_now_sec)

        pipe.execute()

        return

    # ------------------------------------------------------------------
    def loop_main(self):
        self.log.info([['g', ' - starting time_of_night.loop_main ...']])

        while self.can_loop():
            self.time_now_sec += self.loop_sleep_sec / self.timescale
            if self.time_now_sec > self.end_time_sec:
                self.reset_night()

            self.redis.set(
                name='time_of_night_' + 'now', data=int(floor(self.time_now_sec))
            )

            sleep(self.loop_sleep_sec)

        self.log.info([['c', ' - ending time_of_night.loop_main ...']])

        return


# ------------------------------------------------------------------
def get_time_of_night(parent):
    pipe = parent.redis.get_pipe()

    pipe.get('time_of_night_' + 'start')
    pipe.get('time_of_night_' + 'end')
    pipe.get('time_of_night_' + 'now')

    time_of_night = pipe.execute()

    if len(time_of_night) != 3:
        parent.log.warning([[
            'r', ' - ', parent.widget_type, ' - could not get time_of_night - '
        ], ['p', str(time_of_night)], ['r', ' - will use fake range ...']])
        time_of_night = [0, 100, 0]

    data = {'start': time_of_night[0], 'end': time_of_night[1], 'now': time_of_night[2]}

    return data
