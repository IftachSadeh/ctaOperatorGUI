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
from ctaGuiUtils.py.utils import myLog, Assert, deltaSec, telIds, getTimeOfNight
from ctaGuiUtils.py.utils_redis import redisManager


# -----------------------------------------------------------------------------------------------------------
#  obsBlockControl
# -----------------------------------------------------------------------------------------------------------
class obsBlockControl():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # all session ids for this user/widget
    wgtGrpToSessV = dict()

    blockKeys = [['wait'], ['run'], ['done', 'cancel', 'fail']]

    blocks = {}
    for keyV in blockKeys:
        blocks[keyV[0]] = []

    timeOfNight = {}

    telHealth = []
    for idNow in telIds:
        telHealth.append({"id": idNow, "val": 0})

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def __init__(self, widgetId="", mySock=None, *args, **kwargs):
        self.log = myLog(title=__name__)

        # the id of this instance
        self.widgetId = widgetId
        # the parent of this widget
        self.mySock = mySock
        Assert(log=self.log, msg=[
               " - no mySock handed to", self.__class__.__name__], state=(self.mySock is not None))

        # widget-class and widget group names
        self.widgetName = self.__class__.__name__
        self.widgetGroup = self.mySock.usrGrpId+''+self.widgetName

        self.redis = redisManager(name=self.widgetName, log=self.log)

        # turn on periodic data updates
        self.doDataUpdates = True
        # some etra logging messages for this module
        self.logSendPkt = False
        #
        self.nIcon = -1
        # self.telId = ""

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------

    def setup(self, *args):
        with self.mySock.lock:
            wgt = self.redis.hGet(
                name='widgetV', key=self.widgetId, packed=True)
            self.nIcon = wgt["nIcon"]

        # override the global logging variable with a name corresponding to the current session id
        self.log = myLog(title=str(self.mySock.userId)+"/" +
                         str(self.mySock.sessId)+"/"+__name__+"/"+self.widgetId)

        self.widgetState = wgt["widgetState"]
        self.widgetState["focusId"] = ""

        # initial dataset and send to client
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.sendWidgetInit(optIn=optIn)

        # start a thread which will call updateData() and send 1Hz data updates
        # to all sessions in the group
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.addWidgetTread(optIn=optIn)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def backFromOffline(self):
        # with obsBlockControl.lock:
        #   print '-- backFromOffline',self.widgetName, self.widgetId
        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getData(self):
        obsBlockControl.timeOfNight = getTimeOfNight(self)
        self.getBlocks()
        self.getTelHealth()

        data = {
            "timeOfNight": obsBlockControl.timeOfNight,
            "telHealth": obsBlockControl.telHealth,
            "blocks": obsBlockControl.blocks
        }

        return data

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getTelHealth(self):
        self.redis.pipe.reset()
        for idNow in telIds:
            self.redis.pipe.hGet(name="telHealth;"+str(idNow), key="health")
        redData = self.redis.pipe.execute()

        for i in range(len(redData)):
            idNow = telIds[i]
            obsBlockControl.telHealth[i]["val"] = redData[i]

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getBlocks(self):
        for keyV in obsBlockControl.blockKeys:
            self.redis.pipe.reset()
            for key in keyV:
                self.redis.pipe.get('obsBlockIds_'+key)

            data = self.redis.pipe.execute(packed=True)
            obsBlockIds = sum(data, [])  # flatten the list of lists

            self.redis.pipe.reset()
            for obId in obsBlockIds:
                self.redis.pipe.get(obId)

            key = keyV[0]
            blocks = self.redis.pipe.execute(packed=True)
            obsBlockControl.blocks[key] = sorted(
                blocks, cmp=lambda a, b: int(a['startTime']) - int(b['startTime']))

        # print obsBlockControl.blocks

        # dur = [x['timeStamp'] for x in obsBlockControl.blocks] ; print dur
        # print obsBlockControl.blocks['wait'][5]['exeState']

        # obsBlockControl.blocks = [ unpackb(x) for x in redData ]

        # obsBlockControl.blocks = []
        # for block in redData:
        #   obsBlockControl.blocks.append(unpackb(block))

        # self.sortBlocks()

        # if len(obsBlockControl.blocks) > 10: obsBlockControl.blocks = obsBlockControl.blocks[0:9]
        # if len(obsBlockControl.blocks) > 20: obsBlockControl.blocks = obsBlockControl.blocks[0:11]
        # # # # print obsBlockControl.blocks
        # # for bb in range(9):
        # for bb in range(20):
        #   if len(obsBlockControl.blocks) <= bb: break
        #   obsBlockControl.blocks[bb]['exeState'] = 'run'
        #   obsBlockControl.blocks[bb]['runPhase'] = ['run_takeData']
        #   # obsBlockControl.blocks[bb]['runPhase'] = ['run_config_mount']
        #   # print obsBlockControl.blocks[bb]
        #   # if bb < 10: obsBlockControl.blocks[bb]['exeState'] = 'run'
        #   # else:     obsBlockControl.blocks[bb]['exeState'] = 'wait'

        return
