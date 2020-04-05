from datetime import datetime, timedelta
from ctaGuiUtils.py.utils import get_time_of_night
from ctaGuiFront.py.utils.ArrZoomer import ArrZoomer
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
#  WeatherMonitoring
# ------------------------------------------------------------------
class WeatherMonitoring(BaseWidget):
    time_of_night = {}

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id="", socket_manager=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            socket_manager=socket_manager,
        )

        # ------------------------------------------------------------------
        # widget-specific initialisations
        # ------------------------------------------------------------------
        self.primary_grp = ['LSTS', 'MSTS', 'SSTS', 'AUX']
        self.primary_key = ['mirror', 'camera', 'mount', 'aux']

        self.tel_ids = self.socket_manager.inst_data.get_inst_ids(
            inst_types=['LST', 'MST', 'SST']
        )

        # ArrZoomer interface
        self.ArrZoomer = ArrZoomer(parent=self)
        self.my_utils += [self.ArrZoomer]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        # standard common initialisations
        BaseWidget.setup(self, *args)

        # initial dataset and send to client
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.send_init_widget(opt_in=opt_in)

        # start a thread which will call update_data() and send 1Hz data updates to
        # all sessions in the group
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.add_widget_tread(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # standard common initialisations
        BaseWidget.back_from_offline(self)

        # with WeatherMonitoring.lock:
        #     print('-- back_from_offline',self.widget_name,self.widget_id)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        WeatherMonitoring.time_of_night = get_time_of_night(self)
        time_of_night_date = {
            "date_start":
            datetime(2018, 9, 16, 21, 30).strftime('%Y-%m-%d %H:%M:%S'),
            "date_end": (
                datetime(2018, 9, 16, 21, 30)
                + timedelta(seconds=int(WeatherMonitoring.time_of_night['end']))
            ).strftime('%Y-%m-%d %H:%M:%S'),
            "date_now": (
                datetime(2018, 9, 16, 21, 30)
                + timedelta(seconds=int(WeatherMonitoring.time_of_night['now']))
            ).strftime('%Y-%m-%d %H:%M:%S'),
            "now":
            int(WeatherMonitoring.time_of_night['now']),
            "start":
            int(WeatherMonitoring.time_of_night['start']),
            "end":
            int(WeatherMonitoring.time_of_night['end'])
        }

        tel_indices = 6
        keys_now = {}
        keys_now[0] = ['mirror', 'camera', 'mount', 'aux']
        data_out = {}

        for index in range(tel_indices):
            for k, v in keys_now.items():
                for key in v:
                    self.redis.pipe.z_get(
                        'inst_health;' + self.tel_ids[index] + ';' + key
                    )
            data = self.redis.pipe.execute(packed_score=True)
            n_ele = sum([len(v) for k, v in keys_now.items()])
            if len(data) != n_ele:
                print keys_now
                print data
                my_assert(
                    self.log, " - problem with redis.pipe.execute ?!?! " + str(len(data))
                    + "/" + str(n_ele), False
                )
            n_ele_now = 0
            for k, v in keys_now.items():
                data_out[index] = []
                for key in v:
                    data_now = data[n_ele_now]
                    n_ele_now += 1
                    data_out[index].append({
                        'id':
                        self.tel_ids[index] + ';' + key,
                        'data': [{
                            'x': x[0]['data']['time_sec'],
                            'y': x[0]['data']['value'],
                        } for x in data_now]
                    })

        data = {"time_of_night": time_of_night_date, "data_out": data_out}

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def send_rnd_message(self, data):
        # self.log.info([
        #     ['y', ' - got event: send_rnd_message('],
        #     ['g', str(data['myMessage'])], ['y', ")"]
        # ])

        return

    def check_sytem_health(self, agregate, key, row):
        if float(row["mirror"]) < 30:
            agregate["critical"]["mirror"].append(key)
        elif float(row["mirror"]) < 55:
            agregate["warning"]["mirror"].append(key)

        if float(row["camera"]) < 30:
            agregate["critical"]["camera"].append(key)
        elif float(row["camera"]) < 55:
            agregate["warning"]["camera"].append(key)

        if float(row["aux"]) < 30:
            agregate["critical"]["aux"].append(key)
        elif float(row["aux"]) < 55:
            agregate["warning"]["aux"].append(key)

        if float(row["mount"]) < 30:
            agregate["critical"]["mount"].append(key)
        elif float(row["mount"]) < 55:
            agregate["warning"]["mount"].append(key)
