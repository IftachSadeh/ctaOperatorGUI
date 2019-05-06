import os
import copy
import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import ceil
import random
from random import Random
from ctaGuiUtils.py.utils import myLog, Assert, telIds, noSubArrName
from ctaGuiUtils.py.utils_redis import redisManager


# -----------------------------------------------------------------------------------------------------------
#  subArrGrp
# -----------------------------------------------------------------------------------------------------------
class subArrGrp():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # subArr = dict()

    # all session ids for this user/widget
    wgtGrpToSessV = dict()

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

        self.pos0 = [0, 90]

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
        # with subArrGrp.lock:
        #   print '-- backFromOffline',self.widgetName, self.widgetId
        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getData(self):
        for redKey in ['obsBlockIds_'+'run', 'telPos']:
            nTries = 0
            while not self.redis.exists(redKey):
                self.log.warning([
                    ['r', " - no - "], ['p', redKey],
                    ['r', " - in redis. will try again ... (", nTries, ")"]
                ])
                if nTries > 4:
                    return {}
                nTries += 1
                sleep(0.5)

        subArrs = self.redis.get(
            name="subArrs", packed=True, defVal=[]
        )
        obsBlockIds = self.redis.get(
            name=('obsBlockIds_'+'run'), packed=True, defVal=[]
        )
        telPos = self.redis.hGetAll(name="telPos", packed=True)

        data = {
            "tel": [],
            "trg": [],
            "pnt": [],
            "subArr": {"id": "subArr", "children": subArrs}
        }

        self.redis.pipe.reset()
        for obId in obsBlockIds:
            self.redis.pipe.get(obId)
        blocks = self.redis.pipe.execute(packed=True)

        #
        allTelIds = copy.deepcopy(telIds)
        self.telPntPos = dict()

        for nBlock in range(len(blocks)):
            blkTelIds = blocks[nBlock]["telIds"]

            trgId = blocks[nBlock]['targets'][0]["id"]
            trgN = blocks[nBlock]['targets'][0]["name"]
            trgPos = blocks[nBlock]['targets'][0]["pos"]

            pntId = blocks[nBlock]['pointings'][0]["id"]
            pntN = blocks[nBlock]['pointings'][0]["name"]
            pntPos = blocks[nBlock]['pointings'][0]["pos"]

            # compile the telescope list for this block
            telV = []
            for idNow in blkTelIds:
                telPosNow = telPos[idNow] if idNow in telPos else self.pos0

                data["tel"].append({
                    "id": idNow, "trgId": trgId, "pntId": pntId, "pos": telPosNow
                })

                telV.append({"id": idNow})

                if idNow in allTelIds:
                    allTelIds.remove(idNow)

                self.telPntPos[idNow] = pntPos

            # add the target for this block, if we dont already have it
            if trgId not in [x["id"] for x in data["trg"]]:
                data["trg"].append({
                    "id": trgId, "N": trgN, "pos": trgPos
                })

            # add the pointing for this block
            data["pnt"].append({
                "id": pntId, "N": pntN, "pos": pntPos, "telIds": blkTelIds
            })

        # -----------------------------------------------------------------------------------------------------------
        # now take care of all free telescopes
        # -----------------------------------------------------------------------------------------------------------
        telV = []
        for idNow in allTelIds:
            telPosNow = telPos[idNow] if idNow in telPos else self.pos0

            data["tel"].append({
                "id": idNow, "trgId": noSubArrName, "pntId": noSubArrName, "pos": telPosNow
            })

            telV.append({"id": idNow})

        return data
