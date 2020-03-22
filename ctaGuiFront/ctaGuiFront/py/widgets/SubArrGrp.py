import os
import copy
import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import ceil
import random
from random import Random
from ctaGuiUtils.py.utils import my_log, my_assert, no_subArr_name
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
#  SubArrGrp
# ------------------------------------------------------------------
class SubArrGrp():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # subArr = dict()

    # all session ids for this user/widget
    widget_group_sess = dict()

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id="", SockManager=None, *args, **kwargs):
        self.log = my_log(title=__name__)

        # the id of this instance
        self.widget_id = widget_id
        # the parent of this widget
        self.SockManager = SockManager
        my_assert(log=self.log, msg=[
               " - no SockManager handed to", self.__class__.__name__], state=(self.SockManager is not None))

        # widget-class and widget group names
        self.widget_name = self.__class__.__name__
        self.widget_group = self.SockManager.user_group_id+''+self.widget_name

        self.redis = RedisManager(name=self.widget_name, log=self.log)

        # turn on periodic data updates
        self.do_data_updates = True
        # some etra logging messages for this module
        self.log_send_packet = False
        #
        self.n_icon = -1

        self.pos0 = [0, 90]

        self.tel_ids = self.SockManager.InstData.get_inst_ids(
            inst_types=['LST', 'MST', 'SST']
        )

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

        # initial dataset and send to client
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.SockManager.send_init_widget(opt_in=opt_in)

        # start a thread which will call update_data() and send 1Hz data updates
        # to all sessions in the group
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.SockManager.add_widget_tread(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # with SubArrGrp.lock:
        #   print '-- back_from_offline',self.widget_name, self.widget_id
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        for redis_key in ['obs_block_ids_'+'run', 'inst_pos']:
            n_tries = 0
            while not self.redis.exists(redis_key):
                self.log.warning([
                    ['r', " - no - "], ['p', redis_key],
                    ['r', " - in redis. will try again ... (", n_tries, ")"]
                ])
                if n_tries > 4:
                    return {}
                n_tries += 1
                sleep(0.5)

        subArrs = self.redis.get(
            name="subArrs", packed=True, default_val=[]
        )
        obs_block_ids = self.redis.get(
            name=('obs_block_ids_'+'run'), packed=True, default_val=[]
        )
        inst_pos = self.redis.hGetAll(name="inst_pos", packed=True)

        data = {
            "tel": [],
            "trg": [],
            "pnt": [],
            "subArr": {"id": "subArr", "children": subArrs}
        }

        self.redis.pipe.reset()
        for obs_block_id in obs_block_ids:
            self.redis.pipe.get(obs_block_id)
        blocks = self.redis.pipe.execute(packed=True)

        #
        all_tel_ids = copy.deepcopy(self.tel_ids)
        self.tel_point_pos = dict()

        for n_block in range(len(blocks)):
            block_tel_ids = blocks[n_block]["tel_ids"]

            trgId = blocks[n_block]['targets'][0]["id"]
            target_name = blocks[n_block]['targets'][0]["name"]
            target_pos = blocks[n_block]['targets'][0]["pos"]

            pntId = blocks[n_block]['pointings'][0]["id"]
            pointing_name = blocks[n_block]['pointings'][0]["name"]
            point_pos = blocks[n_block]['pointings'][0]["pos"]

            # compile the telescope list for this block
            telV = []
            for id_now in block_tel_ids:
                inst_pos_now = inst_pos[id_now] if id_now in inst_pos else self.pos0

                data["tel"].append({
                    "id": id_now, "trgId": trgId, "pntId": pntId, "pos": inst_pos_now
                })

                telV.append({"id": id_now})

                if id_now in all_tel_ids:
                    all_tel_ids.remove(id_now)

                self.tel_point_pos[id_now] = point_pos

            # add the target for this block, if we dont already have it
            if trgId not in [x["id"] for x in data["trg"]]:
                data["trg"].append({
                    "id": trgId, "N": target_name, "pos": target_pos
                })

            # add the pointing for this block
            data["pnt"].append({
                "id": pntId, "N": pointing_name, "pos": point_pos, "tel_ids": block_tel_ids
            })

        # ------------------------------------------------------------------
        # now take care of all free telescopes
        # ------------------------------------------------------------------
        telV = []
        for id_now in all_tel_ids:
            inst_pos_now = inst_pos[id_now] if id_now in inst_pos else self.pos0

            data["tel"].append({
                "id": id_now, "trgId": no_subArr_name, "pntId": no_subArr_name, "pos": inst_pos_now
            })

            telV.append({"id": id_now})

        return data