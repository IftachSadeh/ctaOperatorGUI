import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
import random
from random import Random
import time

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import my_log, my_assert, getTime, flatten_dict
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class InstHealth():
    def __init__(self, site_type, time_of_night, InstData):
        self.log = my_log(title=__name__)
        self.log.info([['y', " - inst_health - "], ['g', site_type]])

        self.site_type = site_type
        self.time_of_night = time_of_night
        self.InstData = InstData

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(name=self.class_name, port=utils.redis_port, log=self.log)

        self.tel_ids = self.InstData.get_inst_ids()

        self.inst_health_s0 = dict()
        self.inst_health_s1 = dict()
        self.inst_health_sub = dict()
        self.inst_health_sub_flat = dict()

        self.time_series_n_seconds = self.time_of_night.time_series_n_seconds

        self.loop_sleep = 5

        self.init()

        gevent.spawn(self.loop)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init(self):
        self.log.info([['g', " - inst_health.init() ..."]])

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        for id_now in self.tel_ids:
            self.inst_health_s0[id_now] = {
                "health": 100,
                "status": "run",  # "sub_arr": "0",
                "camera": 100,
                "mirror": 100,
                "mount": 100,
                "daq": 100,
                "aux": 100
            }

            for key, val in self.inst_health_s0[id_now].iteritems():
                self.redis.pipe.hSet(name="inst_health;" + str(id_now), key=key, data=val)

            # self.redPipe.hmset("inst_health_s0"+str(id_now), self.inst_health_s0[id_now])

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        self.inst_health_sub = self.InstData.get_tel_healths()

        # a flat dict with references to each level of the original dict
        self.inst_health_sub_flat = dict()
        for id_now in self.tel_ids:
            self.inst_health_sub_flat[id_now] = flatten_dict(self.inst_health_sub[id_now])

        for id_now in self.tel_ids:
            self.setTelHealth_s1(id_now)

            for key, val in self.inst_health_sub_flat[id_now].iteritems():
                if 'val' in val['data']:
                    self.redis.pipe.hSet(
                        name="inst_health;" + str(id_now),
                        key=key,
                        data=val['data']['val']
                    )

        self.redis.pipe.execute()

        self.rand_s01()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setTelHealth_s1(self, id_now):
        self.inst_health_s1[id_now] = {
            "id":
            id_now,
            "health":
            self.inst_health_s0[id_now]["health"],
            "status":
            "run",
            "data": [
                v for (k, v) in self.inst_health_sub[id_now].items()
                # self.inst_health_sub[id_now]["camera"],
                # self.inst_health_sub[id_now]["mirror"],
                # self.inst_health_sub[id_now]["mount"],
                # self.inst_health_sub[id_now]["daq"],
                # self.inst_health_sub[id_now]["aux"]
            ]
        }

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def rand_s01(self, rnd_seed=-1):
        idV = self.rand_s0(rnd_seed=rnd_seed)
        self.rand_s1(tel_id_in=idV, rnd_seed=rnd_seed)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def rand_s0(self, rnd_seed=-1):
        if rnd_seed < 0:
            rnd_seed = random.randint(0, 100000)
        rnd_gen = Random(rnd_seed)

        update_frac = 0.4
        arr_props = dict()

        rnd_props = [
            'camera',
            'mirror',
            'mount',
            'daq',
            'aux',
            'inst_0',
            'inst_1',
            'prc_0',
            'prc_1',
        ]
        n_rnd_props = len(rnd_props)

        for id_now in self.tel_ids:
            if (rnd_gen.random() > update_frac):
                continue

            arr_props[id_now] = self.inst_health_s0[id_now]

            rnd = rnd_gen.random()
            if rnd < 0.06:
                health_tot = rnd_gen.randint(0, 100)
            elif rnd < 0.1:
                health_tot = rnd_gen.randint(40, 100)
            else:
                health_tot = rnd_gen.randint(60, 100)

            arr_props[id_now]["health"] = health_tot

            bad = 100 - health_tot
            for n_prop_now in range(n_rnd_props):
                rnd = rnd_gen.randint(0, bad)

                if n_prop_now == n_rnd_props - 1:
                    rnd = bad
                else:
                    bad -= rnd

                if rnd_props[n_prop_now] in arr_props[id_now]:
                    arr_props[id_now][rnd_props[n_prop_now]] = 100 - rnd

            self.inst_health_s0[id_now] = arr_props[id_now]

            self.inst_health_s1[id_now]["health"] = health_tot

            for key, val in self.inst_health_s0[id_now].iteritems():
                self.redis.pipe.hSet(name="inst_health;" + str(id_now), key=key, data=val)

        self.redis.pipe.execute()

        idV = [id_now for id_now in arr_props]

        return idV

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def rand_s1(self, tel_id_in=None, rnd_seed=-1):
        rnd_props = ["camera", "mirror", "mount", "daq", "aux", 'inst_0', 'inst_1']

        update_frac = 1
        if rnd_seed < 0:
            rnd_seed = random.randint(0, 100000)
        rnd_gen = Random(rnd_seed)

        # recursive randomization of all "val" values of the dict and its child elements
        def set_rnd_props(data_in):
            for key, value in data_in.iteritems():
                if key == "children":
                    for child in data_in[key]:
                        set_rnd_props(child)

                if key == "val":
                    rnd_now = rnd_gen.uniform(-10, 10)
                    if rnd_gen.random() < 0.1:
                        rnd_now = rnd_gen.uniform(-30, 30)
                    val = data_in['val'] + ceil(rnd_now)
                    data_in['val'] = max(20, min(100, int(val)))

            return

        idV = self.tel_ids if (tel_id_in is None) else tel_id_in

        for id_now in self.tel_ids:
            random.shuffle(rnd_props)

            # call the randomization function
            if id_now in idV:
                for prop_name in rnd_props:
                    if prop_name not in self.inst_health_sub[id_now]:
                        continue

                    set_rnd_props(self.inst_health_sub[id_now][prop_name])
                    # if id_now=='L_0': print self.inst_health_sub[id_now][prop_name]

                    # sync with the value in self.inst_health_s0
                    prop_value = self.inst_health_sub[id_now][prop_name]['val']
                    self.inst_health_s0[id_now][prop_name] = prop_value
                    self.redis.pipe.hSet(
                        name="inst_health;" + str(id_now), key=prop_name, data=prop_value
                    )
                    # if id_now=='Ax00':print id_now,prop_name,prop_value

                self.redis.pipe.execute()
                self.setTelHealth_s1(id_now)

            time_now = self.time_of_night.get_real_time()
            timeMin = self.time_of_night.get_time_series_start_time()
            base_name = "inst_health;" + str(id_now)

            for key, val in self.inst_health_sub_flat[id_now].iteritems():
                if 'val' in val['data']:
                    self.redis.pipe.hSet(name=base_name, key=key, data=val['data']['val'])
                    self.redis.pipe.zAdd(
                        name=base_name + ";" + key,
                        score=time_now,
                        data=val['data']['val'],
                        packed_score=True,
                        clip_score=timeMin
                    )

                    # if id_now == 'L_0' and 'camera_1_0' in key:
                    #     print id_now, key, val['data']['val']

                    # if id_now == 'L_0' and key == 'daq_8_1':
                    #     self.redis.redis.zadd(base_name+";"+key,  self.timeV, (self.timeV % 2))
                    #     self.timeV += 1
                    #     print '------------', self.timeV, val['data']['val']

                    # self.redis.pipe.zAdd(name=base_name+";"+key, score=time_now,
                    #                      data=val['val'], clip_score=timeMin)

            self.redis.pipe.execute()

        # for id_now in self.tel_ids:
        #     for key, val in self.inst_health_sub_flat[id_now].iteritems():
        #         if "val" in val['data']:
        #             self.redis.pipe.zAdd(key=key,
        #                                  score=self.time_of_night.get_real_time(),
        #                                  data=val['data']['val'])

        #             self.redis.redis.zremrangebyscore(key,
        #                                               0,
        #                                               self.time_of_night.get_time_series_start_time())

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def loop(self):
        self.log.info([['g', " - starting inst_health.loop ..."]])
        sleep(2)

        rnd_seed = 12564654
        while True:
            self.rand_s01(rnd_seed=rnd_seed)

            rnd_seed += 1
            sleep(self.loop_sleep)

        return
