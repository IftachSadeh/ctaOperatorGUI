from datetime import datetime, timedelta
from shared.ClockSim import get_clock_sim_data
from frontend_manager.py.utils.ArrZoomerUtil import ArrZoomerUtil
from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class WeatherMonitoring(BaseWidget):

    # ------------------------------------------------------------------
    def __init__(self, widget_id='', sm=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        self.history_duration_sec = 6 * 60 * 60
        self.history_step_sec = 10 * 60

        self.tel_ids = self.sm.inst_data.get_inst_ids(inst_types=['LST', 'MST', 'SST'])
        self.time_information = {
            'history_step_sec' : -1,
            'history_duration_sec' : -1,
            'history_start_sec' : -1,
            'is_night_now': -1,
            'night_end_sec': -1,
            'night_start_sec': -1,
            'time_now_sec': -1,
        }

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await BaseWidget.setup(self, *args)

        # initialise dataset and send to client
        opt_in = {
            'widget': self,
            'event_name': 'init_data',
            'data_func': self.get_data,
        }
        await self.sm.emit_widget_event(opt_in=opt_in)

        # start an update loop for this particular instance
        opt_in = {
            'widget': self,
            'loop_scope': 'unique_by_id',
            'data_func': self.get_data,
            'sleep_sec': 3,
            'loop_id': 'update_data',
            'event_name': 'update_data',
        }
        await self.sm.add_widget_loop(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    async def back_from_offline(self, data=None):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, data=None)

        # with WeatherMonitoring.lock:
        #     print('-- back_from_offline',self.widget_type,self.widget_id)
        return

    def update_time_information(self):
        clock_sim = get_clock_sim_data(self)
        self.time_information = {
            'history_step_sec' : self.history_step_sec,
            'history_duration_sec' : clock_sim['time_now_sec'] - self.history_duration_sec,
            'history_start_sec' : clock_sim['time_now_sec'] - self.history_duration_sec,
            'is_night_now': clock_sim['is_night_now'],
            'night_end_sec': clock_sim['night_end_sec'],
            'night_start_sec': clock_sim['night_start_sec'],
            'time_now_sec': clock_sim['time_now_sec'],
        }

    # ------------------------------------------------------------------
    async def get_data(self):
        self.update_time_information()
        # DL_FIXME - hardcoded dates !?!
        # time_of_night_date = {
        #     'date_start':
        #     datetime(2018, 9, 16, 21, 30).strftime('%Y-%m-%d %H:%M:%S'),
        #     'date_end': (
        #         datetime(2018, 9, 16, 21, 30)
        #         + timedelta(seconds=int(WeatherMonitoring.time_of_night['end']))
        #     ).strftime('%Y-%m-%d %H:%M:%S'),
        #     'date_now': (
        #         datetime(2018, 9, 16, 21, 30)
        #         + timedelta(seconds=int(WeatherMonitoring.time_of_night['now']))
        #     ).strftime('%Y-%m-%d %H:%M:%S'),
        #     'now':
        #     int(WeatherMonitoring.time_of_night['now']),
        #     'start':
        #     int(WeatherMonitoring.time_of_night['start']),
        #     'end':
        #     int(WeatherMonitoring.time_of_night['end'])
        # }

        tel_indices = 6
        # DL_FIXME - why is keys_now a dict?
        keys_now = {}
        keys_now[0] = ['mirror', 'camera', 'mount', 'aux']
        data_out = {}

        for index in range(tel_indices):
            pipe = self.redis.get_pipe()
            for k, v in keys_now.items():
                for key in v:
                    pipe.z_get(name='inst_health;' + self.tel_ids[index] + ';' + key)
            data = pipe.execute()
            n_ele = sum([len(v) for k, v in keys_now.items()])
            if len(data) != n_ele:
                raise Exception(
                    ' problem with redis.pipe.execute ?!?! ',
                    str(len(data)),
                    str(n_ele),
                    keys_now,
                    data,
                )

            n_ele_now = 0
            for k, v in keys_now.items():
                data_out[index] = []
                for key in v:
                    data_now = data[n_ele_now]
                    n_ele_now += 1
                    innerData = []
                    for x in data_now:
                        if not isinstance(x[0]['data'], int):
                            innerData.append({
                                'x': x[0]['data']['time_sec'],
                                'y': x[0]['data']['value'],
                            })
                    data_out[index].append({
                        'id': self.tel_ids[index] + ';' + key,
                        'data': innerData
                    })

        data = {
            'time_information': self.time_information,
            'data_out': data_out,
        }

        return data

    # ------------------------------------------------------------------
    def check_sytem_health(self, agregate, key, row):

        if float(row['mirror']) < 30:
            agregate['critical']['mirror'].append(key)
        elif float(row['mirror']) < 55:
            agregate['warning']['mirror'].append(key)

        if float(row['camera']) < 30:
            agregate['critical']['camera'].append(key)
        elif float(row['camera']) < 55:
            agregate['warning']['camera'].append(key)

        if float(row['aux']) < 30:
            agregate['critical']['aux'].append(key)
        elif float(row['aux']) < 55:
            agregate['warning']['aux'].append(key)

        if float(row['mount']) < 30:
            agregate['critical']['mount'].append(key)
        elif float(row['mount']) < 55:
            agregate['warning']['mount'].append(key)

        return
