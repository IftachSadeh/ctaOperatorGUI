import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
import random
from random import Random
import time
import copy

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import my_log, my_assert, getTime, no_sub_arr_name, inst_pos_0
from ctaGuiUtils.py.RedisManager import RedisManager


class MockTarget():
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, site_type):
        self.log = my_log(title=__name__)
        self.log.info([['y', " - MockTarget - "], ['g', site_type]])

        self.site_type = site_type

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(name=self.class_name, log=self.log)

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        rnd_seed = 10989152934
        # self.rnd_gen = Random(rnd_seed)
        self.rnd_gen = Random()

        self.az_min_max = [-180, 180]
        self.zen_min_max_tel = [0, 70]

        self.init()
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init(self):
        self.log.info([['g', " - MockTarget.init() ..."]])
        self.create_target()
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def create_target(self):
        n_rnd_targets = max(5, int(self.rnd_gen.random() * 12))
        startTime = 0
        endTime = 28800
        step = endTime / (n_rnd_targets + 1)
        offset = step * 0.66

        self.target_ids = []
        self.targets = []
        for index in range(n_rnd_targets):
            # if self.redis.exists('inst_pos'):
            #     inst_pos_in = self.redis.hGetAll(name="inst_pos", packed=Tr
            target = {
                "id": "target_" + str(index),
                "name": "target_" + str(index),
            }
            target["pos"] = [
                (self.rnd_gen.random() *
                 (self.az_min_max[1] - self.az_min_max[0])) + self.az_min_max[0],
                (
                    self.rnd_gen.random() *
                    (self.zen_min_max_tel[1] - self.zen_min_max_tel[0])
                ) + self.zen_min_max_tel[0]
            ]
            minimal = startTime + (step * index) - (self.rnd_gen.random() * offset)
            optimal = 1500 + startTime + (step * index) + (step * 0.5) + (
                (self.rnd_gen.random() - 0.5) * offset
            )
            maximal = 4000 + startTime + (step * (index + 1)) + (
                self.rnd_gen.random() * offset
            )
            target["observability"] = {
                "minimal": minimal,
                "optimal": optimal,
                "maximal": maximal
            }
            self.target_ids.append("target_" + str(index))
            self.targets.append(target)
            self.redis.pipe.set(name='target_' + str(index), data=target, packed=True)
        self.redis.pipe.execute()

        self.redis.pipe.set(name='target_ids', data=self.target_ids, packed=True)
        self.redis.pipe.execute()

        return