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

class telPos():
    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def __init__(self, nsType):
        self.log = myLog(title=__name__)
        self.log.info([['y', " - telPos - "], ['g', nsType]])

        self.nsType = nsType

        self.className = self.__class__.__name__
        self.redis = redisManager(name=self.className, log=self.log)

        # -----------------------------------------------------------------------------------------------------------
        #
        # -----------------------------------------------------------------------------------------------------------
        rndSeed = 10989152934
        self.rndGen = Random(rndSeed)

        self.init()

        gevent.spawn(self.loop)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def init(self):
        self.log.info([['g', " - telPos.init() ..."]])

        self.updateTelPos()

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def updateTelPos(self):
        minDeltaPosSqr = pow(0.05, 2)
        fracDeltaPos = 0.25
        maxTrgOffset = 0.75

        telPosIn = dict()
        if self.redis.exists('telPos'):
            telPosIn = self.redis.hGetAll(name="telPos", packed=True)

        obsBlockIds = self.redis.get(
            name=('obsBlockIds_'+'run'), packed=True, defVal=[])

        for obId in obsBlockIds:
            self.redis.pipe.get(obId)

        blocks = self.redis.pipe.execute(packed=True)

        telPntPos = dict()
        for nBlock in range(len(blocks)):
            telIds = blocks[nBlock]["telescopes"]["large"]["ids"] + blocks[nBlock]["telescopes"]["medium"]["ids"] + blocks[nBlock]["telescopes"]["small"]["ids"]
            pntPos = blocks[nBlock]["pointings"][0]["pos"]

            for idNow in telIds:
                telPntPos[idNow] = pntPos

        for idNow in utils.telIds:
            telPosNow = telPosIn[idNow] if idNow in telPosIn else telPos0
            if telPosNow is None:
                telPosNow = telPos0
            telPosNew = telPosNow

            if idNow in telPntPos:
                pntPos = telPntPos[idNow]

                dPos = [(pntPos[0] - telPosNow[0]), (pntPos[1] - telPosNow[1])]
                if(dPos[0] > 360):
                    dPos[0] -= 360
                elif(dPos[0] < -360):
                    dPos[0] += 360
                # if(dPos[0] > 180):
                #   dPos[0] -= 360
                # elif(dPos[0] < -180):
                #   dPos[0] += 360
                if(dPos[1] >= 90):
                    dPos[1] -= 90

                rndScale = 1
                if (dPos[0] * dPos[0] + dPos[1] * dPos[1]) < minDeltaPosSqr:
                    rndScale = -1.5 if (self.rndGen.random() < 0.5) else 1.5

                telPosNew = [
                    telPosNow[0] + dPos[0] * rndScale *
                    self.rndGen.random() * fracDeltaPos,
                    telPosNow[1] + dPos[1] * rndScale *
                    self.rndGen.random() * fracDeltaPos
                ]

            self.redis.pipe.hSet(name="telPos", key=idNow,
                                 data=telPosNew, packed=True)

        self.redis.pipe.execute()

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting telPos.loop ..."]])
        sleep(2)

        while True:
            self.updateTelPos()

            sleep(2)

        return
