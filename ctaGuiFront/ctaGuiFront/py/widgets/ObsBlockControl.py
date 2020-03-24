import os
import copy
import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
from datetime import datetime
import random
from random import Random
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import my_log, my_assert, delta_seconds, get_time_of_night
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
#  obs_block_control
# ------------------------------------------------------------------
class ObsBlockControl():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # all session ids for this user/widget
    widget_group_sess = dict()

    block_keys = [['wait'], ['run'], ['done', 'cancel', 'fail']]

    blocks = {}
    for keys_now in block_keys:
        blocks[keys_now[0]] = []

    time_of_night = {}

    inst_health = []

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id="", socket_manager=None, *args, **kwargs):
        self.log = my_log(title=__name__)

        # the id of this instance
        self.widget_id = widget_id
        # the parent of this widget
        self.socket_manager = socket_manager
        my_assert(log=self.log, msg=[
               " - no socket_manager handed to", self.__class__.__name__], state=(self.socket_manager is not None))

        # widget-class and widget group names
        self.widget_name = self.__class__.__name__
        self.widget_group = self.socket_manager.user_group_id+''+self.widget_name

        self.redis = RedisManager(name=self.widget_name, log=self.log)

        # turn on periodic data updates
        self.do_data_updates = True
        # some etra logging messages for this module
        self.log_send_packet = False
        #
        self.n_icon = -1
        # self.tel_Id = ""

        # self.tel_ids = self.socket_manager.InstData.get_inst_ids()
        self.tel_ids = self.socket_manager.InstData.get_inst_ids(
            inst_types=['LST', 'MST', 'SST']
        )

        # ------------------------------------------------------------------
        # need to add lock ?!?!?!?!?
        # ------------------------------------------------------------------
        if len(obs_block_control.inst_health) == 0:
            for id_now in self.tel_ids:
                obs_block_control.inst_health.append({"id": id_now, "val": 0})

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def setup(self, *args):
        with self.socket_manager.lock:
            wgt = self.redis.hGet(
                name='all_widgets', key=self.widget_id, packed=True)
            self.n_icon = wgt["n_icon"]

        # override the global logging variable with a name corresponding to the current session id
        self.log = my_log(title=str(self.socket_manager.user_id)+"/" +
                         str(self.socket_manager.sess_id)+"/"+__name__+"/"+self.widget_id)

        self.widget_state = wgt["widget_state"]
        self.widget_state["focus_id"] = ""

        # initial dataset and send to client
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.send_init_widget(opt_in=opt_in)

        # start a thread which will call update_data() and send 1Hz data updates
        # to all sessions in the group
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.add_widget_tread(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # with obs_block_control.lock:
        #   print '-- back_from_offline',self.widget_name, self.widget_id
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        obs_block_control.time_of_night = get_time_of_night(self)
        self.get_blocks()
        self.get_tel_health()

        data = {
            "time_of_night": obs_block_control.time_of_night,
            "inst_health": obs_block_control.inst_health,
            "blocks": obs_block_control.blocks
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_health(self):
        self.redis.pipe.reset()
        for id_now in self.tel_ids:
            self.redis.pipe.hGet(name="inst_health;"+str(id_now), key="health")
        redis_data = self.redis.pipe.execute()

        for i in range(len(redis_data)):
            id_now = self.tel_ids[i]
            obs_block_control.inst_health[i]["val"] = redis_data[i]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_blocks(self):
        for keys_now in obs_block_control.block_keys:
            self.redis.pipe.reset()
            for key in keys_now:
                self.redis.pipe.get('obs_block_ids_'+key)

            data = self.redis.pipe.execute(packed=True)
            obs_block_ids = sum(data, [])  # flatten the list of lists

            self.redis.pipe.reset()
            for obs_block_id in obs_block_ids:
                self.redis.pipe.get(obs_block_id)

            key = keys_now[0]
            blocks = self.redis.pipe.execute(packed=True)
            obs_block_control.blocks[key] = sorted(
                blocks, cmp=lambda a, b: int(a['startTime']) - int(b['startTime']))

        # print obs_block_control.blocks

        # dur = [x['timestamp'] for x in obs_block_control.blocks] ; print dur
        # print obs_block_control.blocks['wait'][5]['exe_state']

        # obs_block_control.blocks = [ unpackb(x) for x in redis_data ]

        # obs_block_control.blocks = []
        # for block in redis_data:
        #   obs_block_control.blocks.append(unpackb(block))

        # self.sortBlocks()

        # if len(obs_block_control.blocks) > 10: obs_block_control.blocks = obs_block_control.blocks[0:9]
        # if len(obs_block_control.blocks) > 20: obs_block_control.blocks = obs_block_control.blocks[0:11]
        # # # # print obs_block_control.blocks
        # # for bb in range(9):
        # for bb in range(20):
        #   if len(obs_block_control.blocks) <= bb: break
        #   obs_block_control.blocks[bb]['exe_state'] = 'run'
        #   obs_block_control.blocks[bb]['run_phase'] = ['run_take_data']
        #   # obs_block_control.blocks[bb]['run_phase'] = ['run_config_mount']
        #   # print obs_block_control.blocks[bb]
        #   # if bb < 10: obs_block_control.blocks[bb]['exe_state'] = 'run'
        #   # else:     obs_block_control.blocks[bb]['exe_state'] = 'wait'

        return
