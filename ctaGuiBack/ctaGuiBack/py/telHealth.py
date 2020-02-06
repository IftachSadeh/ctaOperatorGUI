import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
import random
from random import Random
import time

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import myLog, Assert, getTime, flatDictById
from ctaGuiUtils.py.utils_redis import redisManager

# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class telHealth():
    def __init__(self, nsType, timeOfNight, arrayData):
        self.log = myLog(title=__name__)
        self.log.info([['y', " - telHealth - "], ['g', nsType]])

        self.nsType = nsType
        self.timeOfNight = timeOfNight
        self.arrayData = arrayData

        self.className = self.__class__.__name__
        self.redis = redisManager(name=self.className, log=self.log)

        self.telIds = self.arrayData.get_inst_ids()

        self.telHealth_s0 = dict()
        self.telHealth_s1 = dict()
        self.telSubHealth = dict()
        self.telSubHealthFlat = dict()

        self.timeSeriesLen = self.timeOfNight.timeSeriesLen

        self.loopSleep = 5

        self.init()

        gevent.spawn(self.loop)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init(self):
        self.log.info([['g', " - telHealth.init() ..."]])


        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        for idNow in self.telIds:
            self.telHealth_s0[idNow] = {
                "health": 100, "status": "run",  # "subArr": "0",
                "camera": 100, "mirror": 100, "mount": 100, "daq": 100, "aux": 100
            }

            for key, val in self.telHealth_s0[idNow].iteritems():
                self.redis.pipe.hSet(
                    name="telHealth;"+str(idNow), key=key, data=val)

            # self.redPipe.hmset("telHealth_s0"+str(idNow), self.telHealth_s0[idNow])

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        self.telSubHealth = self.arrayData.getTelHealthD()

        # a flat dict with references to each level of the original dict
        self.telSubHealthFlat = dict()
        for idNow in self.telIds:
            self.telSubHealthFlat[idNow] = flatDictById(
                self.telSubHealth[idNow])

        for idNow in self.telIds:
            self.setTelHealth_s1(idNow)

            for key, val in self.telSubHealthFlat[idNow].iteritems():
                if 'val' in val['data']:
                    self.redis.pipe.hSet(
                        name="telHealth;"+str(idNow), key=key, data=val['data']['val'])

        self.redis.pipe.execute()

        self.rand_s01()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setTelHealth_s1(self, idNow):
        self.telHealth_s1[idNow] = {
            "id": idNow, "health": self.telHealth_s0[idNow]["health"], "status": "run",
            "data": [
                v for (k,v) in self.telSubHealth[idNow].items()
                # self.telSubHealth[idNow]["camera"],
                # self.telSubHealth[idNow]["mirror"],
                # self.telSubHealth[idNow]["mount"],
                # self.telSubHealth[idNow]["daq"],
                # self.telSubHealth[idNow]["aux"]
            ]
        }

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def rand_s01(self, rndSeed=-1):
        idV = self.rand_s0(rndSeed=rndSeed)
        self.rand_s1(telIdIn=idV, rndSeed=rndSeed)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def rand_s0(self, rndSeed=-1):
        if rndSeed < 0:
            rndSeed = random.randint(0, 100000)
        rndGen = Random(rndSeed)

        updatePct = 0.4
        arrPropD_ = dict()

        rndProps = ["camera", "mirror", "mount", "daq", "aux", 'inst_0', 'inst_1']
        nRndProps = len(rndProps)

        for idNow in self.telIds:
            if(rndGen.random() > updatePct):
                continue

            arrPropD_[idNow] = self.telHealth_s0[idNow]

            rnd = rndGen.random()
            if rnd < 0.06:
                healthTot = rndGen.randint(0, 100)
            elif rnd < 0.1:
                healthTot = rndGen.randint(40, 100)
            else:
                healthTot = rndGen.randint(60, 100)

            arrPropD_[idNow]["health"] = healthTot

            bad = 100 - healthTot
            for nPropNow in range(nRndProps):
                rnd = rndGen.randint(0, bad)

                if nPropNow == nRndProps - 1:
                    rnd = bad
                else:
                    bad -= rnd

                if rndProps[nPropNow] in arrPropD_[idNow]:
                    arrPropD_[idNow][rndProps[nPropNow]] = 100 - rnd

            self.telHealth_s0[idNow] = arrPropD_[idNow]

            self.telHealth_s1[idNow]["health"] = healthTot

            for key, val in self.telHealth_s0[idNow].iteritems():
                self.redis.pipe.hSet(
                    name="telHealth;"+str(idNow), key=key, data=val)

        self.redis.pipe.execute()

        idV = [idNow for idNow in arrPropD_]

        return idV

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def rand_s1(self, telIdIn=None, rndSeed=-1):
        rndProps = ["camera", "mirror", "mount", "daq", "aux", 'inst_0', 'inst_1']

        fracToUpd = 1
        if rndSeed < 0:
            rndSeed = random.randint(0, 100000)
        rndGen = Random(rndSeed)

        # recursive randomization of all "val" values of the dict and its child elements
        def randProps(dictNow):
            for key, value in dictNow.iteritems():
                if key == "children":
                    for child in dictNow[key]:
                        randProps(child)

                if key == "val":
                    rndNow = rndGen.uniform(-10, 10)
                    if rndGen.random() < 0.1:
                        rndNow = rndGen.uniform(-30, 30)
                    val = dictNow['val'] + ceil(rndNow)
                    dictNow['val'] = max(20, min(100, int(val)))

            return

        idV = self.telIds if (telIdIn is None) else telIdIn

        for idNow in self.telIds:
            random.shuffle(rndProps)

            # call the randomization function
            if idNow in idV:
                for propName in rndProps:
                    if propName not in self.telSubHealth[idNow]:
                        continue

                    randProps(self.telSubHealth[idNow][propName])
                    # if idNow=='L_0': print self.telSubHealth[idNow][propName]

                    # sync with the value in self.telHealth_s0
                    propVal = self.telSubHealth[idNow][propName]['val']
                    self.telHealth_s0[idNow][propName] = propVal
                    self.redis.pipe.hSet(
                        name="telHealth;"+str(idNow), key=propName, data=propVal)
                    # if idNow=='Ax00':print idNow,propName,propVal

                self.redis.pipe.execute()
                self.setTelHealth_s1(idNow)

            timeNow = self.timeOfNight.getRealTime()
            timeMin = self.timeOfNight.getTimeSeriesStartTime()
            baseName = "telHealth;"+str(idNow)

            for key, val in self.telSubHealthFlat[idNow].iteritems():
                if 'val' in val['data']:
                    self.redis.pipe.hSet(
                        name=baseName, key=key, data=val['data']['val'])
                    self.redis.pipe.zAdd(name=baseName+";"+key, score=timeNow,
                                         data=val['data']['val'], packedScore=True,
                                         clipScore=timeMin)

                    # if idNow == 'L_0' and 'camera_1_0' in key:
                    #     print idNow, key, val['data']['val']

                    # if idNow == 'L_0' and key == 'daq_8_1':
                    #     self.redis.redis.zadd(baseName+";"+key,  self.timeV, (self.timeV % 2))
                    #     self.timeV += 1
                    #     print '------------', self.timeV, val['data']['val']

                    # self.redis.pipe.zAdd(name=baseName+";"+key, score=timeNow,
                    #                      data=val['val'], clipScore=timeMin)

            self.redis.pipe.execute()

        # for idNow in self.telIds:
        #     for key, val in self.telSubHealthFlat[idNow].iteritems():
        #         if "val" in val['data']:
        #             self.redis.pipe.zAdd(key=key,
        #                                  score=self.timeOfNight.getRealTime(),
        #                                  data=val['data']['val'])

        #             self.redis.redis.zremrangebyscore(key,
        #                                               0,
        #                                               self.timeOfNight.getTimeSeriesStartTime())

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def loop(self):
        self.log.info([['g', " - starting telHealth.loop ..."]])
        sleep(2)

        rndSeed = 12564654
        while True:
            self.rand_s01(rndSeed=rndSeed)

            rndSeed += 1
            sleep(self.loopSleep)

        return
