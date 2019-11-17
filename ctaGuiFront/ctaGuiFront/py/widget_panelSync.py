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
from ctaGuiUtils.py.utils import myLog, Assert, deltaSec, dateToStr, getTime
from ctaGuiUtils.py.utils_redis import redisManager


# ------------------------------------------------------------------
#  panelSync
# ------------------------------------------------------------------
class panelSync():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # all session ids for this user/widget
    wgtGrpToSessV = dict()

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        with self.mySock.lock:
            wgt = self.redis.hGet(
                name='widgetV', key=self.widgetId, packed=True)
            self.nIcon = wgt["nIcon"]

        # override the global logging variable with a name corresponding to the current session id
        self.log = myLog(title=str(self.mySock.userId)+"/" +
                         str(self.mySock.sessId)+"/"+__name__+"/"+self.widgetId)

        # initial dataset and send to client
        optIn = {'widget': self, 'dataFunc': self.getDataInit}
        self.mySock.sendWidgetInit(optIn=optIn)

        # start a thread which will call updateData() and send 1Hz data
        # updates to all sessions in the group
        optIn = {'widget': self,
                 'dataFunc': self.panelSync_getGroups, 'sleepTime': 5}
        self.mySock.addWidgetTread(optIn=optIn)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def backFromOffline(self):
        # with panelSync.lock:
        #   print '-- backFromOffline',self.widgetName, self.widgetId
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getDataInit(self):
        return {
            'groups': self.panelSync_getGroups(),
            "allowPanelSync": self.mySock.doAllowPanelSync()
        }

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def askData(self):
        dataEmit = {
            'widgetType': self.widgetName,
            'evtName': "updateData",
            'data': self.panelSync_getGroups()
        }

        self.mySock.socketEvtWidgetV(
            evtName=dataEmit['evtName'],
            data=dataEmit,
            sessIdV=[self.mySock.sessId],
            widgetIdV=[self.widgetId]
        )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def setSyncGroups(self, *args):
        data = args[0]

        with self.mySock.lock:
            widgetIdV = self.redis.lGet('userWidgetV;'+self.mySock.userId)

            syncGroupV = []
            for child_0 in data["data"]["children"]:
                syncGroup = dict()
                syncGroup["id"] = child_0["id"]
                syncGroup["title"] = child_0["ttl"]
                syncGroup["syncStateV"] = []
                syncGroup["syncTypeV"] = dict()

                for child_1 in child_0["children"]:
                    widgetV = [wgt for wgt in child_1 if wgt[0] in widgetIdV]
                    syncGroup["syncStateV"].append(widgetV)

                syncGroupV.append(syncGroup)

            self.redis.hSet(
                name='syncGroups', key=self.mySock.userId, data=syncGroupV, packed=True)

        self.updateSyncGroups(ignoreId=self.widgetId)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def updateSyncGroups(self, ignoreId=None):

        # ------------------------------------------------------------------
        # get the current set of widgest which need an update
        # ------------------------------------------------------------------
        sessWidgetV = [[], []]
        with self.mySock.lock:
            widgetIdV = self.redis.lGet('userWidgetV;'+self.mySock.userId)
            widgetV = self.redis.hMget(
                name='widgetV', key=widgetIdV, packed=True)

            for nWidgetNow in range(len(widgetIdV)):
                widgetId = widgetIdV[nWidgetNow]
                widgetNow = widgetV[nWidgetNow]
                if widgetNow is None:
                    continue
                if widgetNow["widgetName"] != self.widgetName:
                    continue
                if ignoreId is not None and ignoreId == widgetId:
                    continue

                sessWidgetV[0].append(widgetNow["sessId"])
                sessWidgetV[1].append(widgetId)

        # ------------------------------------------------------------------
        # send the data
        # ------------------------------------------------------------------
        dataEmit = {
            'widgetType': self.widgetName,
            'evtName': "updateData",
            'data': self.panelSync_getGroups()
        }

        self.mySock.socketEvtWidgetV(
            evtName=dataEmit['evtName'],
            data=dataEmit,
            sessIdV=sessWidgetV[0],
            widgetIdV=sessWidgetV[1]
        )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def panelSync_getGroups(self):
        with self.mySock.lock:
            widgetIdV = self.redis.lGet('userWidgetV;'+self.mySock.userId)
            widgetV = self.redis.hMget(
                name='widgetV', key=widgetIdV, packed=True)

            allWidgetV = []
            for nWidgetNow in range(len(widgetIdV)):
                widgetId = widgetIdV[nWidgetNow]
                widgetNow = widgetV[nWidgetNow]
                if widgetNow is None:
                    continue
                if widgetNow["nIcon"] >= 0:
                    allWidgetV.append({
                        "id": "icn_"+widgetId,
                        "trgWidgId": widgetId,
                        "nIcon": widgetNow["nIcon"]
                    })

            rmEleV = []
            childV_0 = []

            syncGroupV = self.redis.hGet(
                name='syncGroups', key=self.mySock.userId, packed=True, defVal=[])

            for syncGroup in syncGroupV:
                syncStateV = syncGroup["syncStateV"]

                nGrpWidg = 0
                childV_1 = []
                for nSyncType in range(len(syncStateV)):
                    childV_2 = []
                    for [widgetId, iconId] in syncStateV[nSyncType]:
                        try:
                            nWidgetNow = widgetIdV.index(widgetId)

                            nGrpWidg += 1
                            childV_2.append({
                                "id": iconId,
                                "trgWidgId": widgetId,
                                "nIcon": widgetV[nWidgetNow]["nIcon"]
                            })

                        except Exception:
                            continue

                    # ------------------------------------------------------------------
                    # the syncGroup["id"] must correspond to the pattern defined by the client for
                    # new groups (e.g., for "grp_0", we have ["grp_0_0","grp_0_1","grp_0_2"])
                    # ------------------------------------------------------------------
                    childV_1.append({
                        "id": str(syncGroup["id"])+"_"+str(nSyncType),
                        "ttl": str(syncGroup["title"])+" "+str(nSyncType),
                        "children": childV_2
                    })

                if nGrpWidg > 0:
                    childV_0.append({
                        "id": syncGroup["id"],
                        "ttl": syncGroup["title"],
                        "children": childV_1
                    })
                else:
                    rmEleV.append(syncGroup)

            # cleanup empty groups
            if len(rmEleV) > 0:
                for rmEle in rmEleV:
                    syncGroupV.remove(rmEle)

                self.redis.hSet(
                    name='syncGroups', key=self.mySock.userId, data=syncGroupV, packed=True)

        allGrps = {
            "date": dateToStr(datetime.utcnow(), '%H:%M:%S:%f'),
            "id": "allGrps",
            "children": childV_0,
            "allWidgetV": allWidgetV
        }

        return allGrps
