import os
import copy
import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore, DummySemaphore
from math import sqrt, ceil, floor
from datetime import datetime
import random
from random import Random
from ctaGuiUtils.py.utils import myLog, Assert, deltaSec, flatDictById
from ctaGuiUtils.py.utils_redis import redisManager
# from json import dumps, loads
# rndGen = Random(111111)


# # list of initial monitoring points that roughly correspond to the different assemblies
# if False:
#   mount:
#     poiting accuracy (az/el) from drive system (target coordinate and readback value consistent)
#     check vias pointin monitoring (star huider) if on target
#     status of motors (several motors, depends on tel type)
#   amc:
#     status of actuator (60 or whatever per tel)
#     status of lazer used for alighnment
#     status of system (alighned or mis-alighned)
#   camera:
#     humidity limit
#     temprature limit
#     internal cooling system status
#     high-voltage status -> maye divid into sectors
#     max event rate too high
#     camera lid working
#     safety module online and ok
#     timing board status (telescope coincidence)
#   daq:
#     camera trigger rate
#     throughput from tel
#     camera server status
#     on camera initial analyis (pre calibration / event building)


# sub-array grouping
# telescope type grouping
# position grouping
# all offline telescops grouping
# mount == drive-system, structual monitoring, pointing monitoring


# ------------------------------------------------------------------
#  arrZoomer
# ------------------------------------------------------------------
class arrZoomer():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)
    # lock = DummySemaphore()

    # all session ids for this user/widget
    wgtGrpToSessV = dict()

    sendV = {"s_0": {"sessId": [], "widgetId": []}, "s_1": dict()}

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

        # turn on periodic data updates
        self.doDataUpdates = True
        # some etra logging messages for this module
        self.logSendPkt = False
        # south or north array
        self.nIcon = -1
        #
        self.widgetState = None

        self.redis = redisManager(name=self.widgetName, log=self.log)

        self.telIds = self.mySock.arrayData.get_inst_ids()

        return

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

        self.widgetState = wgt["widgetState"]
        self.widgetState["zoomState"] = 0
        self.widgetState["zoomTarget"] = ""

        self.initTelHealth()

        # ------------------------------------------------------------------
        # initial dataset and send to client
        # ------------------------------------------------------------------
        optIn = {'widget': self, 'dataFunc': self.getInitData}
        self.mySock.sendWidgetInit(optIn=optIn)

        # ------------------------------------------------------------------
        # start threads for updating data
        # ------------------------------------------------------------------
        with self.mySock.lock:
            if self.mySock.getThreadId(self.mySock.usrGrpId, "arrZoomerUpdateData") == -1:
                if self.logSendPkt:
                    self.log.info([
                      ['y', " - starting arrZoomerUpdateData("],
                      ['g', self.mySock.usrGrpId], ['y', ")"]
                    ])

                threadId = self.mySock.setThreadState(
                    self.mySock.usrGrpId, "arrZoomerUpdateData", True)
                aThread = gevent.spawn(self.arrZoomerUpdateData, threadId)

            if self.mySock.getThreadId(self.mySock.usrGrpId, "arrZoomerUpdateSubArrs") == -1:
                if self.logSendPkt:
                    self.log.info([
                      ['y', " - starting arrZoomerUpdateSubArrs("],
                      ['g', self.mySock.usrGrpId], ['y', ")"]
                    ])

                threadId = self.mySock.setThreadState(
                    self.mySock.usrGrpId, "arrZoomerUpdateSubArrs", True)
                aThread = gevent.spawn(self.arrZoomerUpdateSubArrs, threadId)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def backFromOffline(self):
        # with arrZoomer.lock:
        #   #print '-- backFromOffline',self.widgetName, self.widgetId
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getInitData(self):
        inst_info = self.mySock.arrayData.get_tel_pos()

        inst_prop_types = dict()
        inst_prop_types = dict()
        inst_ids = self.mySock.arrayData.get_inst_ids()
        for id_now in inst_ids:
            inst_prop_types[id_now] = [
                { 'id': v['id'], 'title': v['ttl'], }
                for (k,v) in self.telSubHealth[id_now].items()
            ]

        data = {
            'arrZoomer': {
                "subArr": self.subArrGrp,
                "arrInit": inst_info,
                "arrProp": self.getTelHealthS0(),
                'telPropTypes': inst_prop_types,
            }
        }
        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def arrZoomerSetWidgetState(self, *args):
        data = args[0]

        self.widgetState["zoomState"] = data["zoomState"]
        self.widgetState["zoomTarget"] = data["zoomTarget"]
        self.widgetState["zoomTargetProp"] = data["zoomTargetProp"]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def initTelHealth(self):
        self.telHealth = dict()
        self.telSubHealthFlat = dict()
        self.telSubHealthFields = dict()

        self.telSubHealth = self.mySock.arrayData.getTelHealthD()

        # a flat dict with references to each level of the original dict
        self.telSubHealthFlat = dict()
        for idNow in self.telIds:
            self.telSubHealthFlat[idNow] = flatDictById(
                self.telSubHealth[idNow])

        for idNow in self.telIds:
            self.telHealth[idNow] = {
                "id": idNow, "health": 0, "status": "",
                "data": [
                    v for (k,v) in self.telSubHealth[idNow].items()
                ]
            }

            self.telSubHealthFields[idNow] = []
            for key, val in self.telSubHealthFlat[idNow].iteritems():
                if 'val' in val['data']:
                    self.telSubHealthFields[idNow] += [key]

        self.getSubArrGrp()

        return

    # ------------------------------------------------------------------
    # get info of telescope 0-100 for each fields
    # ------------------------------------------------------------------
    def getTelHealthS0(self, idIn=None):
        #print 'getTelHealthS0'
        data = dict()

        # fields = ["health", "status", "camera", "mirror", "mount", "daq", "aux"]
        fields = dict()
        for id_now in self.telIds:
            fields[id_now] = [ "health", "status" ]
            fields[id_now] += [
                v['id'] for (k,v) in self.telSubHealth[id_now].items()
            ]

        idV = self.telIds if (idIn is None) else [idIn]

        self.redis.pipe.reset()
        for id_now in idV:
            self.redis.pipe.hMget(name="telHealth;"+str(id_now), key=fields[id_now])
        redData = self.redis.pipe.execute()

        for i in range(len(redData)):
            id_now = idV[i]
            data[id_now] = dict()

            for j in range(len(fields[id_now])):
                data[id_now][fields[id_now][j]] = redData[i][j]

        return data if (idIn is None) else data[id_now]

    # ------------------------------------------------------------------
    #   Load data relative to telescope on focus
    # ------------------------------------------------------------------
    def updateTelHealthS1(self, idIn):
        #print 'updateTelHealthS1'
        redData = self.redis.hMget(
            name="telHealth;"+str(idIn), key=self.telSubHealthFields[idIn])

        for i in range(len(redData)):
            key = self.telSubHealthFields[idIn][i]
            self.telSubHealthFlat[idIn][key]['data']['val'] = redData[i]

        dataS0 = self.getTelHealthS0(idIn=idIn)
        self.telHealth[idIn]["health"] = dataS0["health"]
        self.telHealth[idIn]["status"] = dataS0["status"]

        return

    # ------------------------------------------------------------------
    # return data of zoomTarget in dict() form
    # ------------------------------------------------------------------
    def getFlatTelHealth(self, idIn):
        #print 'getFlatTelHealth'
        data = dict()

        data["id"] = idIn
        data["health"] = self.telHealth[idIn]["health"]
        data["status"] = self.telHealth[idIn]["status"]

        data["data"] = dict()
        for key in self.telSubHealthFields[idIn]:
            data["data"][key] = self.telSubHealthFlat[idIn][key]['data']['val']

        return data

    # ------------------------------------------------------------------
    # uniqu methods for this socket
    # ------------------------------------------------------------------
    def arrZoomerAskDataS1(self, *args):
        data = args[0]
        if self.mySock.logSendPkt:
            self.log.info([
              ['b', " - getDataS1", self.mySock.sessId, " , "],
              ['g', data["zoomState"]], ['b', " , "], ['y', data["zoomTarget"]]
            ])

        self.widgetState["zoomState"] = data["zoomState"]
        self.widgetState["zoomTarget"] = data["zoomTarget"]

        # ------------------------------------------------------------------
        # to avoid missmatch while waiting for the loop in 
        # arrZoomerUpdateData, send s0 too...
        # ------------------------------------------------------------------
        with arrZoomer.lock:
            self.updateTelHealthS1(idIn=data["zoomTarget"])
            propDs1 = self.telHealth[data["zoomTarget"]]

            dataEmitS1 = {
                "widgetId": data["widgetId"],
                "type": "s11",
                "data": propDs1
            }

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        self.mySock.socketEvtWidgetV(
            evtName="arrZoomerGetDataS1",
            data=dataEmitS1,
            sessIdV=[self.mySock.sessId],
            widgetIdV=[self.widgetId]
        )

        self.arrZoomerUpdateDataOnce()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def arrZoomerUpdateDataOnce(self):
        #print 'arrZoomerUpdateDataOnce'
        # get the current set of widgest which need an update
        with self.mySock.lock:
            with arrZoomer.lock:
                arrZoomer.sendV["s_0"] = {"sessId": [], "widgetId": []}
                arrZoomer.sendV["s_1"] = dict()

                widgetD = self.redis.hGetAll(name='widgetV', packed=True)
                for widgetId, widgetNow in widgetD.iteritems():
                    if widgetNow["widgetName"] != self.widgetName:
                        continue
                    if widgetId not in self.mySock.widgetInitV:
                        continue

                    arrZoomer.sendV["s_0"]["sessId"].append(
                        widgetNow["sessId"])
                    arrZoomer.sendV["s_0"]["widgetId"].append(widgetId)

                    if self.mySock.widgetInitV[widgetId].widgetState["zoomState"] == 1:
                        zoomTarget = self.mySock.widgetInitV[widgetId].widgetState["zoomTarget"]
                        if zoomTarget not in arrZoomer.sendV["s_1"]:
                            arrZoomer.sendV["s_1"][zoomTarget] = {
                                "sessId": [], "widgetId": []
                            }
                        arrZoomer.sendV["s_1"][zoomTarget]["sessId"].append(
                            widgetNow["sessId"])
                        arrZoomer.sendV["s_1"][zoomTarget]["widgetId"].append(
                            widgetId)

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        propDs1 = dict()
        for zoomTarget in arrZoomer.sendV["s_1"]:
            self.updateTelHealthS1(idIn=zoomTarget)

            propDs1[zoomTarget] = self.getFlatTelHealth(zoomTarget)

        # ------------------------------------------------------------------
        # transmit the values
        # ------------------------------------------------------------------
        dataEmitS0 = {
            "widgetId": "",
            "type": "s00",
            "data": self.getTelHealthS0()
        }

        self.mySock.socketEvtWidgetV(
            evtName="arrZoomerUpdateData",
            data=dataEmitS0,
            sessIdV=arrZoomer.sendV["s_0"]["sessId"],
            widgetIdV=arrZoomer.sendV["s_0"]["widgetId"]
        )

        for zoomTarget in arrZoomer.sendV["s_1"]:
            dataEmitS1 = {
                "widgetId": "",
                "type": "s11",
                "data": propDs1[zoomTarget]
            }

            self.mySock.socketEvtWidgetV(
                evtName="arrZoomerUpdateData",
                data=dataEmitS1,
                sessIdV=arrZoomer.sendV["s_1"][zoomTarget]["sessId"],
                widgetIdV=arrZoomer.sendV["s_1"][zoomTarget]["widgetId"]
            )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def arrZoomerUpdateData(self, threadId):
        #print 'arrZoomerUpdateData'
        if not self.doDataUpdates:
            return

        sleep(3)

        while (threadId == self.mySock.getThreadId(self.mySock.usrGrpId, "arrZoomerUpdateData")):
            self.arrZoomerUpdateDataOnce()
            sleep(10)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getSubArrGrp(self):
        #print 'getSubArrGrp'
        with arrZoomer.lock:
            subArrs = self.redis.get(name="subArrs", packed=True, defVal=[])
            self.subArrGrp = {"id": "subArr", "children": subArrs}

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def arrZoomerUpdateSubArrs(self, threadId):
        #print 'arrZoomerUpdateSubArrs'
        sleep(1)

        redSub = None
        while (
          threadId == self.mySock.getThreadId(self.mySock.usrGrpId, "arrZoomerUpdateSubArrs")
        ):
            while redSub is None:
                redSub = self.redis.setPubSub("subArrs")
                sleep(0.5)

            msg = self.redis.getPubSub("subArrs")
            if msg is not None:
                self.getSubArrGrp()

                data = {
                    "widgetId": "",
                    "type": "subArr",
                    "data": self.subArrGrp
                }

                self.mySock.socketEvtWidgetV(
                    evtName="arrZoomerUpdateData",
                    data=data,
                    sessIdV=arrZoomer.sendV["s_0"]["sessId"],
                    widgetIdV=arrZoomer.sendV["s_0"]["widgetId"]
                )

            # sleep(0.5)
            return
            sleep(5)

        return
