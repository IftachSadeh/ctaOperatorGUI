import random
from datetime import datetime
from ctaGuiUtils.py.utils import flatten_dict, get_time
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
#  plots_dash
# ------------------------------------------------------------------
class PlotsDash(BaseWidget):
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
        # INIT TELESCOPES PROPS
        self.tel_category = 'Telescope'
        self.tel_type = ['LST', 'MST', 'SST', 'AUX']
        self.tel_key = ['mirror', 'camera', 'mount', 'daq', 'aux']
        self.tel_ids = self.socket_manager.inst_data.get_inst_ids(
            inst_types=self.tel_type
        )

        self.weather_category = 'Weather'
        self.weather_type = ['WS1', 'WS2', 'WS3', 'WS4']
        self.weather_key = ['Temp', 'Wind', 'Rain', 'Cloud']
        # self.hierarchy = [[self.tel_category, self.weather_category], self.tel_type, self.tel_key, self.tel_ids]
        # self.depthHierarchy = 0

        # self.hierarchy = {'id': 'root', 'keys': [self.tel_category], 'children': [
        #     {'id': 'tel_type', 'keys': self.tel_type, 'children': [
        #         {'id': 'tel_key', 'keys': self.tel_key, 'children': [
        #             {'id': 'tel_ids', 'keys': self.tel_ids, 'children': []}
        #         ]},
        #         # {'id': 'tel_idsFirst', 'keys': self.tel_ids, 'children': [
        #         #     {'id': 'tel_keySecond', 'keys': self.tel_key, 'children': []}
        #         # ]}
        #     ]},
        #     # {'id': 'weather_type', 'keys': self.weather_type, 'children': [
        #     #     {'id': 'weather_key', 'keys': self.weather_key, 'children': []}
        #     # ]}
        # ]}

        self.relationship = {
            # 'root': {'name': 'Root', 'children': ['global']},
            'global': {
                'name': 'All Data',
                'children': [self.tel_category, self.weather_category]
            },
            'tel_type': {
                'name': 'Size',
                'children': self.tel_type
            },
            'tel_key': {
                'name': 'Property',
                'children': self.tel_key
            },
            'tel_ids': {
                'name': 'Name',
                'children': self.tel_ids
            },
            'weather_type': {
                'name': 'Weath. Stat.',
                'children': self.weather_type
            },
            'weather_key': {
                'name': 'Measure',
                'children': self.weather_key
            }
        }
        self.relationship[self.tel_category] = {
            'name': 'Telescopes',
            'children': ['tel_type', 'tel_key', 'tel_ids']
        }
        self.relationship[self.weather_category] = {
            'name': 'Weather',
            'children': ['weather_type', 'weather_key']
        }
        for value in self.tel_type:
            self.relationship[value] = {'name': value, 'children': ['tel_key', 'tel_ids']}
        for value in self.tel_key:
            self.relationship[value] = {
                'name': value,
                'children': ['tel_type', 'tel_ids']
            }
        for value in self.tel_ids:
            self.relationship[value] = {'name': value, 'children': ['tel_key']}
        for value in self.weather_type:
            self.relationship[value] = {'name': value, 'children': ['weather_key']}
        for value in self.weather_key:
            self.relationship[value] = {'name': value, 'children': ['weather_type']}

        self.categories = {
            # 'root': 'group',
            'global': 'group',
            'tel_type': 'group',
            'tel_key': 'group',
            'tel_ids': 'group',
            'weather_type': 'group',
            'weather_key': 'group'
        }
        self.categories[self.tel_category] = 'group'
        self.categories[self.weather_category] = 'group'
        for value in self.tel_type:
            self.categories[value] = 'item'
        for value in self.tel_key:
            self.categories[value] = 'item'
        for value in self.tel_ids:
            self.categories[value] = 'item'
        for value in self.weather_type:
            self.categories[value] = 'item'
        for value in self.weather_key:
            self.categories[value] = 'item'

        # self.relationship = {
        #     'root': [self.tel_category,self.weather_category],
        #     'tel_type': self.tel_type,
        #     'tel_key': self.tel_key,
        #     'tel_ids': self.tel_ids,
        #     'weather_type': self.weather_type,
        #     'weather_key': self.weather_key,
        # }

        # self.relationship = {'root': {'parent': [], 'children': [self.tel_category, self.weather_category]}}
        # self.relationship[self.tel_category] = {'parent': ['root'], 'children': self.tel_type}
        # for value in self.tel_type:
        #     self.relationship[value] = {'parent': [self.tel_category, self.weather_category], 'children': self.tel_key}
        # for value in self.tel_key:
        #     self.relationship[value] = {'parent': self.tel_type, 'children': self.tel_ids}
        # for value in self.tel_ids:
        #     self.relationship[value] = {'parent': self.tel_key, 'children': []}
        # self.relationship[self.weather_category] = {'parent': ['root'], 'children': self.weather_type}
        # for value in self.weather_type:
        #     self.relationship[value] = {'parent': [self.tel_category, self.weather_category], 'children': self.weather_key}
        # for value in self.weather_key:
        #     self.relationship[value] = {'parent': self.weather_type, 'children': []}

        self.selected_keys = ['global']

        self.agregate = self.tel_ids

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        # standard common initialisations
        BaseWidget.setup(self, *args)

        self.init_tel_health()
        self.init_urgent_current()
        self.init_urgent_past()
        self.get_pinned_eles()

        # initial dataset and send to client
        opt_in = {
            'widget': self,
            'data_func': self.get_data,
        }
        self.socket_manager.send_init_widget(opt_in=opt_in)

        # start a thread which will call update_data() and send 1Hz data updates to
        # all sessions in the group
        opt_in = {
            'widget': self,
            'is_group_thread': False,
            'data_func': self.get_data,
        }
        self.socket_manager.add_widget_tread(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # standard common initialisations
        BaseWidget.back_from_offline(self)

        # with PlotsDash.lock:
        #     print('-- back_from_offline',self.widget_name,self.widget_id)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_tel_health(self):
        self.inst_health = dict()
        self.inst_health_sub_flat = dict()
        self.inst_health_sub_fields = dict()

        self.inst_health_sub = self.socket_manager.inst_data.get_tel_healths()

        # a flat dict with references to each level of the original dict
        self.inst_health_sub_flat = dict()
        for id_now in self.tel_ids:
            self.inst_health_sub_flat[id_now] = flatten_dict(self.inst_health_sub[id_now])

        for id_now in self.tel_ids:
            self.inst_health[id_now] = {
                "id": id_now,
                "health": 0,
                "status": "",
                "data": [v for (k, v) in self.inst_health_sub[id_now].items()]
            }

            self.inst_health_sub_fields[id_now] = []
            for key, val in self.inst_health_sub_flat[id_now].items():
                if 'val' in val['data']:
                    self.inst_health_sub_fields[id_now] += [key]

        self.get_sub_arr_grp()

        return

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def getHierarchy(self):
    #     telProp = [
    #         {'key': 'mount', 'name': 'Mount', 'children': []},
    #         {'key': 'mirror', 'name': 'Mirror', 'children': []},
    #         {'key': 'daq', 'name': 'DAQ', 'children': []},
    #         {'key': 'camera', 'name': 'Camera', 'children': []},
    #         {'key': 'auxiliary', 'name': 'Auxiliary', 'children': []},
    #         {'key': 'other', 'name': 'Other', 'children': []}]
    #     tel_type = [{'key': 'large', 'name': 'Large', 'children': [telProp]},
    #         {'key': 'medium', 'name': 'Medium', 'children': [telProp]},
    #         {'key': 'small', 'name': 'Small', 'children': [telProp]}]
    #     tels = {'key': 'telescopes', 'name': 'Telescopes', 'children': [tel_type]}
    #     weath = {'key': 'Weather', 'children': []}
    #     return [tels, weath]

    # def createTree(self) :
    #     tree = {}
    #     for n in range(len(self.selected_keys) -1, -1, -1):
    #         if n == len(self.selected_keys) -1:
    #             tree = [self.selected_keys[n]] = {'selected': [], 'unselected': [], 'waiting': self.relationship[self.selected_keys[n]]}
    #         else:
    #             tree = {'selected': [], 'unselected': [], 'waiting': self.relationship[self.selected_keys[n]]}
    #     # hierarchy = {'id': 'root', 'keys': [self.tel_category], 'children': [
    #     #     {'id': 'tel_type', 'keys': self.tel_type, 'children': [
    #     #         {'id': 'tel_key', 'keys': self.tel_key, 'children': [
    #     #             {'id': 'tel_ids', 'keys': self.tel_ids, 'children': []}
    #     #         ]},
    #     #         # {'id': 'tel_idsFirst', 'keys': self.tel_ids, 'children': [
    #     #         #     {'id': 'tel_keySecond', 'keys': self.tel_key, 'children': []}
    #     #         # ]}
    #     #     ]},
    #     #     # {'id': 'weather_type', 'keys': self.weather_type, 'children': [
    #     #     #     {'id': 'weather_key', 'keys': self.weather_key, 'children': []}
    #     #     # ]}
    #     # ]}
    #     return tree

    def get_pinned_eles(self):
        n_rnd_pin = random.randint(20, 40)
        self.pinned_eles = []
        for i in range(n_rnd_pin):
            data = []
            for j in range(random.randint(1, 12)):
                rnd_key = self.tel_key[random.randint(0, len(self.tel_key) - 1)]
                rnd_id = self.tel_ids[random.randint(0, len(self.tel_ids) - 1)]
                data.append({
                    'data': self.get_tel_data(rnd_id, [rnd_key]),
                    'keys': [self.tel_category, rnd_key, rnd_id]
                })
            self.pinned_eles.append({
                "id": "pinned" + str(i),
                "timestamp": get_time('msec'),
                'data': data,
                'context': {}
            })

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        time_of_night_date = {
            "date_now":
            datetime.fromtimestamp(get_time('msec') / 1000.0
                                   ).strftime('%Y-%m-%d %H:%M:%S'),
            "now":
            get_time('msec')
        }

        data_out = self.get_tel_data('Mx10', ['camera', 'mount'])

        self.update_urgent_current()
        self.update_urgent_past()
        ordered_past = self.order_urgent_past_key()
        ordered_timestamp = self.order_urgent_past_key_time()
        ordered_current = self.order_urgent_current_key()
        # print 'get_data', self.widget_id
        data = {
            "time_of_night": time_of_night_date,
            "data_out": self.tel_ids,
            "hierarchy": {
                'relationship': self.relationship,
                'categories': self.categories,
                'keys': self.selected_keys,
                'root': 'global',
                'depth': 4
            },
            # "agregate": self.agregate,
            'pinned': self.pinned_eles,
            "urgent": {
                'telescopes':
                self.get_tel_health_pinned(),
                "urgentKey":
                self.relationship[self.selected_keys[len(self.selected_keys)
                                                     - 1]]['children'],
                "urgent_current":
                ordered_current,
                "urgentTimestamp":
                ordered_timestamp,
                "urgent_past":
                ordered_past,
            }
            # "inst_healthAggregate":self.agregate_tel_health(inst_health)
        }

        return data

    def get_tel_health_pinned(self):
        inst_health = []
        return inst_health
        for index in range(len(self.tel_ids)):
            for key in self.tel_key:
                self.redis.pipe.z_get('inst_health;' + self.tel_ids[index] + ';' + key)
            data = self.redis.pipe.execute()
            n_ele_now = 0
            for key in self.tel_key:
                data_now = data[n_ele_now]
                innerData = []
                for x in data_now:
                    if not isinstance(x[0]['data'], int):
                        innerData.append({
                            'x': x[0]['data']['time_sec'],
                            'y': x[0]['data']['value'],
                        })
                inst_health.append({
                    'id': self.tel_ids[index] + '-' + key,
                    'keys': [self.tel_ids[index], key],
                    'data': innerData
                })
                n_ele_now += 1

        return inst_health

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def plotDash_push_new_hirch_keys(self, *args):
        print 'push', self.widget_id
        self.selected_keys = args[0]['newKeys']
        # self.socket_manager.socket_event_widgets(
        #     event_name="sched_block_controller_new_queue",
        #     data={},
        #     sess_ids=[self.socket_manager.sess_id],
        #     widget_ids=[self.widget_id]
        # )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_data(self, id, keys_now):
        res = {"id": id}
        data = {}
        for key in keys_now:
            self.redis.pipe.z_get('inst_health;' + id + ';' + key)
            data[key] = self.redis.pipe.execute()
        # n_ele = sum([len(v) for v in keys_now])
        # if len(data) != n_ele:
        #     print keys_now
        #     print data
        for key in keys_now:
            res[key] = [{'y': x[0]['data'], 'x': x[1]} for x in data[key][0]]
            # res[key].append({'id': id+';'+key, 'data': [{'y': x[0]['data'], 'x':x[1]} for x in data[key]]})
        return res

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def send_rnd_message(self, data):
        # self.log.info([
        #     ['y', ' - got event: send_rnd_message('],
        #     ['g', str(data['myMessage'])], ['y', ")"]
        # ])

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_sub_arr_grp(self):
        #print 'get_sub_arr_grp'
        with PlotsDash.lock:
            sub_arrs = self.redis.get(name="sub_arrs", default_val=[])
            self.sub_arr_grp = {"id": "sub_arr", "children": sub_arrs}

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def agregate_tel_health(self, inst_health):
        agregate = {
            "LST": {
                "health": 0,
                "number": 0,
                "warning": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                },
                "critical": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                },
                "unknow": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                }
            },
            "MST": {
                "health": 0,
                "number": 0,
                "warning": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                },
                "critical": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                },
                "unknow": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                }
            },
            "SST": {
                "health": 0,
                "number": 0,
                "warning": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                },
                "critical": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                },
                "unknow": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                }
            },
            "AUX": {
                "health": 0,
                "number": 0,
                "warning": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                },
                "critical": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                },
                "unknow": {
                    "camera": [],
                    "mirror": [],
                    "mount": [],
                    "aux": []
                }
            }
        }

        for key in inst_health:
            if (inst_health[key]["health"] is None):
                continue
            if self.socket_manager.inst_data.is_tel_type(key, 'LST'):
                agregate["LST"]["health"] += float(inst_health[key]["health"])
                agregate["LST"]["number"] += 1
                self.check_sytem_health(agregate["LST"], key, inst_health[key])

            elif self.socket_manager.inst_data.is_tel_type(key, 'MST'):
                agregate["MST"]["health"] += float(inst_health[key]["health"])
                agregate["MST"]["number"] += 1
                self.check_sytem_health(agregate["MST"], key, inst_health[key])

            elif self.socket_manager.inst_data.is_tel_type(key, 'SST'):
                agregate["SST"]["health"] += float(inst_health[key]["health"])
                agregate["SST"]["number"] += 1
                self.check_sytem_health(agregate["SST"], key, inst_health[key])

        if agregate["LST"]["number"] > 0:
            agregate["LST"]["health"] = agregate["LST"]["health"] / \
                agregate["LST"]["number"]
        if agregate["MST"]["number"] > 0:
            agregate["MST"]["health"] = agregate["MST"]["health"] / \
                agregate["MST"]["number"]
        if agregate["SST"]["number"] > 0:
            agregate["SST"]["health"] = agregate["SST"]["health"] / \
                agregate["SST"]["number"]
        return agregate

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_treshold_types(self, key):
        if key == 'health':
            return [{
                "name": "ERROR",
                "value": "30",
                "func": "<="
            }, {
                "name": "WARNING",
                "value": "55",
                "func": "<="
            }, {
                "name": "NOMINAL",
                "value": "100",
                "func": "<="
            }]
        return {}

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_measure_types(self, key):
        if key == 'mount':
            return {
                "name": "Health",
                "key": "health",
                "short": "hlt",
                "unit": "%",
                "treshold": self.get_tel_treshold_types("health")
            }
        if key == 'mirror':
            return {
                "name": "Health",
                "key": "health",
                "short": "hlt",
                "unit": "%",
                "treshold": self.get_tel_treshold_types("health")
            }
        if key == 'daq':
            return {
                "name": "Health",
                "key": "health",
                "short": "hlt",
                "unit": "%",
                "treshold": self.get_tel_treshold_types("health")
            }
        if key == 'camera':
            return {
                "name": "Health",
                "key": "health",
                "short": "hlt",
                "unit": "%",
                "treshold": self.get_tel_treshold_types("health")
            }
        if key == 'aux':
            return {
                "name": "Health",
                "key": "health",
                "short": "hlt",
                "unit": "%",
                "treshold": self.get_tel_treshold_types("health")
            }
        return {}

    # ------------------------------------------------------------------
    # CURRENT TELESCOPES
    # ------------------------------------------------------------------
    def init_urgent_current(self):
        self.urgent_current = []
        inst_health = self.get_tel_health()
        for tel_id, vect in inst_health.items():
            for key, value in vect.items():
                if (key != "status" and value != None
                        and self.get_tel_state(int(value)) == "ERROR"):
                    self.urgent_current.append({
                        "id":
                        tel_id + key,
                        "keys": [
                            tel_id, key,
                            self.socket_manager.inst_data.get_tel_type(tel_id),
                            self.tel_category
                        ],
                        "name":
                        tel_id,
                        "data": {
                            "measures": [{
                                "value": value,
                                "timestamp": get_time('msec')
                            }],
                            "type": self.get_tel_measure_types(key)
                        }
                    })

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_urgent_current(self):
        self.urgent_current = []
        inst_health = self.get_tel_health()
        for tel_id, vect in inst_health.items():
            for key, value in vect.items():
                if (key != "status" and value != None
                        and self.get_tel_state(int(value)) == "ERROR"):
                    self.urgent_current.append({
                        "id":
                        tel_id + key,
                        "keys": [
                            tel_id, key,
                            self.socket_manager.inst_data.get_tel_type(tel_id),
                            self.tel_category
                        ],
                        "name":
                        tel_id,
                        "data": {
                            "measures": [{
                                "value": value,
                                "timestamp": get_time('msec')
                            }],
                            "type": self.get_tel_measure_types(key)
                        }
                    })

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def order_urgent_current_key(self):
        keys = [
            self.relationship[self.selected_keys[len(self.selected_keys) - 1]]['children']
        ]

        def order_data(vector, index):
            if index >= len(keys):
                return vector
            new_order = []
            for key in keys[index]:
                ordered = {"key": key, "data": []}
                for v in vector:
                    if key in v["keys"]:
                        ordered["data"].append(v)
                ordered["data"] = order_data(ordered["data"], index + 1)
                new_order.append(ordered)
            return new_order

        return order_data(self.urgent_current, 0)

    # ------------------------------------------------------------------
    # PAST TELESCOPES
    # ------------------------------------------------------------------
    def init_urgent_past(self):
        self.urgent_past = []

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_urgent_past(self):
        for curr in self.urgent_current:
            insert = True
            for past in self.urgent_past:
                if curr["id"] == past["id"]:
                    past["data"]["measures"].append(curr["data"]["measures"][0])
                    insert = False
                    break
            if insert:
                self.urgent_past.append(curr)

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def order_by_timestamp(self, vector):
        ordered_eles = []
        timestamps = []
        for v in vector:
            for mes in v["data"]["measures"]:
                if mes["timestamp"] not in timestamps:
                    timestamps.append(mes["timestamp"])
        timestamps.sort()
        prev_order = {"timestamp": None, "data": []}
        for ts in timestamps:
            order = {"timestamp": ts, "data": []}
            for v in vector:
                me = v["data"]["measures"]
                if ts >= me[0]["timestamp"] and ts <= me[len(me) - 1]["timestamp"]:
                    order["data"].append(v["id"])
            if set(prev_order["data"]) != set(order["data"]):
                ordered_eles.append(order)
                prev_order = order
        return ordered_eles

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def order_urgent_past_key_time(self):
        keys = [
            self.relationship[self.selected_keys[len(self.selected_keys) - 1]]['children']
        ]

        def order_data(vector, index):
            if index >= len(keys):
                return self.order_by_timestamp(vector)
            new_order = []
            for key in keys[index]:
                ordered = {"key": key, "data": []}
                for v in vector:
                    if key in v["keys"]:
                        ordered["data"].append(v)
                ordered["data"] = order_data(ordered["data"], index + 1)
                new_order.append(ordered)
            return new_order

        return order_data(self.urgent_past, 0)

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def order_urgent_past_key(self):
        keys = [
            self.relationship[self.selected_keys[len(self.selected_keys) - 1]]['children']
        ]

        def order_data(vector, index):
            if index >= len(keys):
                return vector
            new_order = []
            for key in keys[index]:
                ordered = {"key": key, "data": []}
                for v in vector:
                    if key in v["keys"]:
                        ordered["data"].append(v)
                ordered["data"] = order_data(ordered["data"], index + 1)
                new_order.append(ordered)
            return new_order

        return order_data(self.urgent_past, 0)

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_state(self, health):
        if (health < 60):
            return "ERROR"
        elif (health < 55):
            return "WARNING"
        else:
            return "NOMINAL"

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_health(self, id_in=None):
        data = dict()
        fields = dict()
        for id_now in self.tel_ids:
            fields[id_now] = ["health", "status"]
            fields[id_now] += [v['id'] for (k, v) in self.inst_health_sub[id_now].items()]

        idV = self.tel_ids if (id_in is None) else [id_in]

        self.redis.pipe.reset()
        for id_now in idV:
            self.redis.pipe.h_m_get(name="inst_health;" + str(id_now), key=fields[id_now])
        redis_data = self.redis.pipe.execute()

        for i in range(len(redis_data)):
            id_now = idV[i]
            data[id_now] = dict()

            for j in range(len(fields[id_now])):
                data[id_now][fields[id_now][j]] = redis_data[i][j]

        return data if (id_in is None) else data[id_now]
