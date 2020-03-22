import os
import copy
import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore, DummySemaphore
from math import sqrt, ceil, floor
from datetime import datetime
import random
from random import Random
from ctaGuiUtils.py.utils import my_log, my_assert, delta_seconds, flatten_dict
from ctaGuiUtils.py.RedisManager import RedisManager
# from json import dumps, loads
# rnd_gen = Random(111111)


# # list of initial monitoring points that roughly correspond to the different assemblies
# if False:
#   mount:
#     poiting accuracy (az/el) from drive system (target coordinate and readback value consistent)
#     check vias pointin monitoring (star huider) if on target
#     status of motors (several motors, depends on tel type)
#   amc:
#     status of actuator (60 or whatever per tel)
#     status of lazer used for alighnment
#     status of system (alighned or mis-alighned)
#   camera:
#     humidity limit
#     temprature limit
#     internal cooling system status
#     high-voltage status -> maye divid into sectors
#     max event rate too high
#     camera lid working
#     safety module online and ok
#     timing board status (telescope coincidence)
#   daq:
#     camera trigger rate
#     throughput from tel
#     camera server status
#     on camera initial analyis (pre calibration / event building)


# sub-array grouping
# telescope type grouping
# position grouping
# all offline telescops grouping
# mount == drive-system, structual monitoring, pointing monitoring


# ------------------------------------------------------------------
#  ArrZoomer
# ------------------------------------------------------------------
class ArrZoomer():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)
    # lock = DummySemaphore()

    # all session ids for this user/widget
    widget_group_sess = dict()

    send_data = {"s_0": {"sess_id": [], "widget_id": []}, "s_1": dict()}

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id="", SockManager=None, *args, **kwargs):
        self.log = my_log(title=__name__)

        # the id of this instance
        self.widget_id = widget_id
        # the parent of this widget
        self.SockManager = SockManager
        my_assert(log=self.log, 
            msg=[" - no SockManager handed to", self.__class__.__name__], 
            state=(self.SockManager is not None))

        # widget-class and widget group names
        self.widget_name = self.__class__.__name__
        self.widget_group = self.SockManager.user_group_id + '' + self.widget_name

        # turn on periodic data updates
        self.do_data_updates = True
        # some etra logging messages for this module
        self.log_send_packet = False
        # south or north array
        self.n_icon = -1
        #
        self.widget_state = None

        self.redis = RedisManager(name=self.widget_name, log=self.log)

        self.inst_ids = self.SockManager.InstData.get_inst_ids()
        self.proc_ids = self.SockManager.InstData.get_proc_ids()
        self.inst_types = self.SockManager.InstData.get_inst_id_to_types()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        with self.SockManager.lock:
            wgt = self.redis.hGet(
                name='all_widgets', key=self.widget_id, packed=True)
            self.n_icon = wgt["n_icon"]

        # override the global logging variable with a name corresponding to the current session id
        self.log = my_log(title=str(self.SockManager.user_id)+"/" +
                         str(self.SockManager.sess_id)+"/"+__name__+"/"+self.widget_id)

        self.widget_state = wgt["widget_state"]
        self.widget_state["zoom_state"] = 0
        self.widget_state["zoom_target"] = ""

        self.init_tel_health()

        # ------------------------------------------------------------------
        # initial dataset and send to client
        # ------------------------------------------------------------------
        opt_in = {'widget': self, 'data_func': self.get_init_data}
        self.SockManager.send_init_widget(opt_in=opt_in)

        # ------------------------------------------------------------------
        # start threads for updating data
        # ------------------------------------------------------------------
        with self.SockManager.lock:
            if self.SockManager.get_thread_id(self.SockManager.user_group_id, "arr_zoomer_update_data") == -1:
                if self.log_send_packet:
                    self.log.info([
                      ['y', " - starting arr_zoomer_update_data("],
                      ['g', self.SockManager.user_group_id], ['y', ")"]
                    ])

                thread_id = self.SockManager.set_thread_state(
                    self.SockManager.user_group_id, "arr_zoomer_update_data", True)
                _ = gevent.spawn(self.arr_zoomer_update_data, thread_id)

            if self.SockManager.get_thread_id(self.SockManager.user_group_id, "arr_zoomer_update_subArr") == -1:
                if self.log_send_packet:
                    self.log.info([
                      ['y', " - starting arr_zoomer_update_subArr("],
                      ['g', self.SockManager.user_group_id], ['y', ")"]
                    ])

                thread_id = self.SockManager.set_thread_state(
                    self.SockManager.user_group_id, "arr_zoomer_update_subArr", True)
                _ = gevent.spawn(self.arr_zoomer_update_subArr, thread_id)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # with ArrZoomer.lock:
        #   #print '-- back_from_offline',self.widget_name, self.widget_id
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_init_data(self):
        inst_info = self.SockManager.InstData.get_inst_pos()

        inst_prop_types = dict()
        inst_prop_types = dict()
        inst_ids = self.SockManager.InstData.get_inst_ids()
        for id_now in inst_ids:
            inst_prop_types[id_now] = [
                { 'id': v['id'], 'title': v['title'], }
                for (k,v) in self.tel_sub_health[id_now].items()
            ]

        data = {
            'arr_zoomer': {
                "subArr": self.sub_arr_grp,
                "arr_init": inst_info,
                "arrProp": self.get_tel_health_s0(),
                'tel_prop_types': inst_prop_types,
                'tel_types': self.inst_types,
            }
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def arr_zoomer_set_widget_state(self, *args):
        data = args[0]

        self.widget_state["zoom_state"] = data["zoom_state"]
        self.widget_state["zoom_target"] = data["zoom_target"]
        self.widget_state["zoom_targetProp"] = data["zoom_targetProp"]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_tel_health(self):
        self.tel_health = dict()
        self.tel_sub_health_flat = dict()
        self.tel_sub_health_fields = dict()

        self.tel_sub_health = self.SockManager.InstData.get_tel_healths()

        # a flat dict with references to each level of the original dict
        self.tel_sub_health_flat = dict()
        for id_now in self.inst_ids:
            self.tel_sub_health_flat[id_now] = flatten_dict(
                self.tel_sub_health[id_now])

        for id_now in self.inst_ids:
            self.tel_health[id_now] = {
                "id": id_now, "health": 0, "status": "",
                "data": [
                    v for (k,v) in self.tel_sub_health[id_now].items()
                ]
            }

            self.tel_sub_health_fields[id_now] = []
            for key, val in self.tel_sub_health_flat[id_now].iteritems():
                if 'val' in val['data']:
                    self.tel_sub_health_fields[id_now] += [key]

        self.get_subArr_grp()

        return

    # ------------------------------------------------------------------
    # get info of telescope 0-100 for each fields
    # ------------------------------------------------------------------
    def get_tel_health_s0(self, id_in=None):
        data = dict()

        # fields = ["health", "status", "camera", "mirror", "mount", "daq", "aux"]
        fields = dict()
        for id_now in self.inst_ids:
            fields[id_now] = [ "health", "status" ]
            fields[id_now] += [
                v['id'] for (k,v) in self.tel_sub_health[id_now].items()
            ]

        idV = self.inst_ids if (id_in is None) else [id_in]

        self.redis.pipe.reset()
        for id_now in idV:
            self.redis.pipe.hMget(name="inst_health;"+str(id_now), key=fields[id_now])
        redis_data = self.redis.pipe.execute()

        for i in range(len(redis_data)):
            id_now = idV[i]
            data[id_now] = dict()

            for j in range(len(fields[id_now])):
                data[id_now][fields[id_now][j]] = redis_data[i][j]

        return data if (id_in is None) else data[id_now]

    # ------------------------------------------------------------------
    #   Load data relative to telescope on focus
    # ------------------------------------------------------------------
    def update_tel_health_s1(self, id_in):
        redis_data = self.redis.hMget(
            name="inst_health;"+str(id_in), key=self.tel_sub_health_fields[id_in])

        for i in range(len(redis_data)):
            key = self.tel_sub_health_fields[id_in][i]
            self.tel_sub_health_flat[id_in][key]['data']['val'] = redis_data[i]

        data_s0 = self.get_tel_health_s0(id_in=id_in)
        self.tel_health[id_in]["health"] = data_s0["health"]
        self.tel_health[id_in]["status"] = data_s0["status"]

        return

    # ------------------------------------------------------------------
    # return data of zoom_target in dict() form
    # ------------------------------------------------------------------
    def get_flat_tel_health(self, id_in):
        data = dict()

        data["id"] = id_in
        data["health"] = self.tel_health[id_in]["health"]
        data["status"] = self.tel_health[id_in]["status"]

        data["data"] = dict()
        for key in self.tel_sub_health_fields[id_in]:
            data["data"][key] = self.tel_sub_health_flat[id_in][key]['data']['val']

        return data

    # ------------------------------------------------------------------
    # uniqu methods for this socket
    # ------------------------------------------------------------------
    def arr_zoomer_ask_data_s1(self, *args):
        data = args[0]
        if self.SockManager.log_send_packet:
            self.log.info([
              ['b', " - get_data_s1", self.SockManager.sess_id, " , "],
              ['g', data["zoom_state"]], ['b', " , "], ['y', data["zoom_target"]]
            ])

        self.widget_state["zoom_state"] = data["zoom_state"]
        self.widget_state["zoom_target"] = data["zoom_target"]

        # ------------------------------------------------------------------
        # to avoid missmatch while waiting for the loop in 
        # arr_zoomer_update_data, send s0 too...
        # ------------------------------------------------------------------
        with ArrZoomer.lock:
            self.update_tel_health_s1(id_in=data["zoom_target"])
            prop_s1 = self.tel_health[data["zoom_target"]]

            emit_data_s1 = {
                "widget_id": data["widget_id"],
                "type": "s11",
                "data": prop_s1
            }

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        self.SockManager.socket_event_widgets(
            event_name="arr_zoomer_get_data_s1",
            data=emit_data_s1,
            sess_ids=[self.SockManager.sess_id],
            widget_ids=[self.widget_id]
        )

        self.arr_zoomer_update_data_once()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def arr_zoomer_update_data_once(self):
        #print 'arr_zoomer_update_data_once'
        # get the current set of widgest which need an update
        with self.SockManager.lock:
            with ArrZoomer.lock:
                ArrZoomer.send_data["s_0"] = {"sess_id": [], "widget_id": []}
                ArrZoomer.send_data["s_1"] = dict()

                all_widgets = self.redis.hGetAll(name='all_widgets', packed=True)
                for widget_id, widget_now in all_widgets.iteritems():
                    if widget_now["widget_name"] != self.widget_name:
                        continue
                    if widget_id not in self.SockManager.widget_inits:
                        continue

                    ArrZoomer.send_data["s_0"]["sess_id"].append(
                        widget_now["sess_id"])
                    ArrZoomer.send_data["s_0"]["widget_id"].append(widget_id)

                    if self.SockManager.widget_inits[widget_id].widget_state["zoom_state"] == 1:
                        zoom_target = self.SockManager.widget_inits[widget_id].widget_state["zoom_target"]
                        if zoom_target not in ArrZoomer.send_data["s_1"]:
                            ArrZoomer.send_data["s_1"][zoom_target] = {
                                "sess_id": [], "widget_id": []
                            }
                        ArrZoomer.send_data["s_1"][zoom_target]["sess_id"].append(
                            widget_now["sess_id"])
                        ArrZoomer.send_data["s_1"][zoom_target]["widget_id"].append(
                            widget_id)

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        prop_s1 = dict()
        for zoom_target in ArrZoomer.send_data["s_1"]:
            self.update_tel_health_s1(id_in=zoom_target)

            prop_s1[zoom_target] = self.get_flat_tel_health(zoom_target)

        # ------------------------------------------------------------------
        # transmit the values
        # ------------------------------------------------------------------
        emit_data_s0 = {
            "widget_id": "",
            "type": "s00",
            "data": self.get_tel_health_s0()
        }

        self.SockManager.socket_event_widgets(
            event_name="arr_zoomer_update_data",
            data=emit_data_s0,
            sess_ids=ArrZoomer.send_data["s_0"]["sess_id"],
            widget_ids=ArrZoomer.send_data["s_0"]["widget_id"]
        )

        for zoom_target in ArrZoomer.send_data["s_1"]:
            emit_data_s1 = {
                "widget_id": "",
                "type": "s11",
                "data": prop_s1[zoom_target]
            }

            self.SockManager.socket_event_widgets(
                event_name="arr_zoomer_update_data",
                data=emit_data_s1,
                sess_ids=ArrZoomer.send_data["s_1"][zoom_target]["sess_id"],
                widget_ids=ArrZoomer.send_data["s_1"][zoom_target]["widget_id"]
            )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def arr_zoomer_update_data(self, thread_id):
        #print 'arr_zoomer_update_data'
        if not self.do_data_updates:
            return

        sleep(3)

        while (thread_id == self.SockManager.get_thread_id(self.SockManager.user_group_id, "arr_zoomer_update_data")):
            self.arr_zoomer_update_data_once()
            sleep(10)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_subArr_grp(self):
        #print 'get_subArr_grp'
        with ArrZoomer.lock:
            subArrs = self.redis.get(name="subArrs", packed=True, default_val=[])
            self.sub_arr_grp = {"id": "subArr", "children": subArrs}

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def arr_zoomer_update_subArr(self, thread_id):
        #print 'arr_zoomer_update_subArr'
        sleep(1)

        redis_pubsub = None
        while (
          thread_id == self.SockManager.get_thread_id(self.SockManager.user_group_id, "arr_zoomer_update_subArr")
        ):
            while redis_pubsub is None:
                redis_pubsub = self.redis.set_pubsub("subArrs")
                sleep(0.5)

            msg = self.redis.get_pubsub("subArrs")
            if msg is not None:
                self.get_subArr_grp()

                data = {
                    "widget_id": "",
                    "type": "subArr",
                    "data": self.sub_arr_grp
                }

                self.SockManager.socket_event_widgets(
                    event_name="arr_zoomer_update_data",
                    data=data,
                    sess_ids=ArrZoomer.send_data["s_0"]["sess_id"],
                    widget_ids=ArrZoomer.send_data["s_0"]["widget_id"]
                )

            # sleep(0.5)
            return
            sleep(5)

        return
