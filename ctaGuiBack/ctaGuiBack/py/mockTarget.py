import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
import random
from random import Random
import time
import copy

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import myLog, Assert, getTime, noSubArrName, telPos0
from ctaGuiUtils.py.utils_redis import redisManager

class mockTarget():
    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def __init__(self, nsType):
        self.log = myLog(title=__name__)
        self.log.info([['y', " - mockTarget - "], ['g', nsType]])

        self.nsType = nsType

        self.className = self.__class__.__name__
        self.redis = redisManager(name=self.className, log=self.log)

        # -----------------------------------------------------------------------------------------------------------
        #
        # -----------------------------------------------------------------------------------------------------------
        rndSeed = 10989152934
        # self.rndGen = Random(rndSeed)
        self.rndGen = Random()

        self.azMinMax = [-180, 180]
        self.zenMinMaxTel = [0, 70]

        self.init()
        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def init(self):
        self.log.info([['g', " - mockTarget.init() ..."]])
        self.createTarget()
        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def createTarget(self):
        nbTarget = max(5, int(self.rndGen.random() * 12))
        startTime = 0
        endTime = 28800
        step = endTime / (nbTarget + 1)
        offset = step * 0.66

        self.targetsIds = []
        self.targets = []
        for index in range(nbTarget):
            # if self.redis.exists('telPos'):
            #     telPosIn = self.redis.hGetAll(name="telPos", packed=Tr
            target = {
                "id": "trg_"+str(index),
                "name": "trg_"+str(index),
            }
            target["pos"] = [
                (self.rndGen.random() *
                 (self.azMinMax[1] - self.azMinMax[0])) + self.azMinMax[0],
                (self.rndGen.random(
                ) * (self.zenMinMaxTel[1] - self.zenMinMaxTel[0])) + self.zenMinMaxTel[0]
            ]
            minimal = startTime + (step * index) - (self.rndGen.random() * offset)
            optimal = 1500 + startTime + (step * index) + (step * 0.5) + ((self.rndGen.random() - 0.5) * offset)
            maximal = 4000 + startTime + (step * (index + 1)) + (self.rndGen.random() * offset)
            target["observability"] = {
                "minimal": minimal,
                "optimal": optimal,
                "maximal": maximal
            }
            self.targetsIds.append("trg_"+str(index))
            self.targets.append(target)
            self.redis.pipe.set(name='trg_'+str(index), data=target, packed=True)
        self.redis.pipe.execute()

        self.redis.pipe.set(name='targetsIds', data=self.targetsIds, packed=True)
        self.redis.pipe.execute()

        return
