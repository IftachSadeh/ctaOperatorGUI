import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
import random
from random import Random
import time

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import myLog, Assert, getTime
from ctaGuiUtils.py.utils_redis import redisManager

from msgpack import packb
from msgpack import unpackb

# -----------------------------------------------------------------------------------------------------------
#
# -----------------------------------------------------------------------------------------------------------
class pubSubTest():
    def __init__(self, nsType):
        self.log = myLog(title=__name__)
        self.log.info([['y', " - pubSubTest - "], ['g', nsType]])

        self.className = self.__class__.__name__
        self.redis = redisManager(name=self.className, log=self.log)

        gevent.spawn(self.loop)
        gevent.spawn(self.exeFuncLoop)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def askData(self, rndSeed=-1):
        self.log.info([['y', " --------------------------------------------"]])
        self.log.info([['g', " - pubSubTest.askData -  "], ['p', rndSeed]])

        args = {
            "funcName": "testFunc",
            "arg0": rndSeed
        }
        self.redis.publish(channel="exeFuncLoop", message=packb(args))

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def exeFuncLoop(self):
        self.log.info([['g', " - starting pubSubTest.exeFuncLoop ..."]])

        redSub = None
        while True:
            while redSub is None:
                redSub = self.redis.setPubSub("exeFuncLoop")
                sleep(0.5)

            msg = self.redis.getPubSub("exeFuncLoop")
            if msg:
                args = unpackb(msg["data"])

                # call as blocking
                getattr(self, args["funcName"])(args)

                # call as non-blocking
                def exeFuncAsunc(args):
                    getattr(self, args["funcName"])(args)
                gevent.spawn(exeFuncAsunc, args)

            sleep(0.01)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def testFunc(self, args=None):
        self.log.info([
            ['g', " - pubSubTest.testFunc - "], ['p', args["arg0"]]
        ])
        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting pubSubTest.loop ..."]])
        sleep(2)

        rndSeed = 9823987423
        while True:
            self.askData(rndSeed=rndSeed)

            rndSeed += 1
            sleep(2)

        return
