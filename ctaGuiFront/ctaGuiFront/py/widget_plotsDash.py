import os
import copy
import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
from datetime import datetime, timedelta
import random
from random import Random
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import myLog, Assert, deltaSec, getTimeOfNight, flatDictById, getTime
from ctaGuiUtils.py.utils_redis import redisManager


# -----------------------------------------------------------------------------------------------------------
#  plotsDash
# -----------------------------------------------------------------------------------------------------------
class plotsDash():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # all session ids for this user/widget
    wgtGrpToSessV = dict()

    timeOfNight = {}

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

        # self.telIds = self.mySock.arrayData.get_inst_ids()
        self.telIds = self.mySock.arrayData.get_inst_ids(
            inst_types=['LST', 'MST', 'SST']
        )

        self.PrimaryGroup = ['LSTS','MSTS','SSTS','AUX']
        self.PrimaryKey = ['mirror','camera','mount','aux']

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

        self.initTelHealth()
        self.initUrgentCurrent()
        self.initUrgentPast()


        # initial dataset and send to client
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.sendWidgetInit(optIn=optIn)

        # start a thread which will call updateData() and send 1Hz data updates to
        # all sessions in the group
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.addWidgetTread(optIn=optIn)

        return

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

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def backFromOffline(self):
        # with plotsDash.lock:
        #   print '-- backFromOffline',self.widgetName, self.widgetId
        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getData(self):
        timeOfNightDate = {
            "date_now": datetime.fromtimestamp(getTime()/1000.0).strftime('%Y-%m-%d %H:%M:%S'),
            "now": getTime()
            }

        dataOut = self.retrieveData('Mx10', ['camera','mount'])

        self.updateUrgentCurrent()
        self.updateUrgentPast()
        orderedPast = self.orderUrgentPastByKey([['auxiliary', 'mount', 'mirror', 'daq', 'camera', 'high', 'low']])
        orderedTimestamp = self.orderUrgentPastByKeyTime([['auxiliary', 'mount', 'mirror', 'daq', 'camera', 'high', 'low']])
        orderedCurrent = self.orderUrgentCurrentByKey([['auxiliary', 'mount', 'mirror', 'daq', 'camera', 'high', 'low']])

        data = {
            "timeOfNight": timeOfNightDate,
            "dataOut":dataOut,
            "urgentKey": ['auxiliary', 'mount', 'mirror', 'daq', 'camera', 'high', 'low'],
            "urgentCurrent":orderedCurrent,
            "urgentTimestamp":orderedTimestamp,
            "urgentPast": orderedPast
            # "telHealthAggregate":self.agregateTelHealth(telHealth)
        }

        return data

    def retrieveData(self, id, keyV):
        res = {"id": id}
        data = {}
        for key in keyV:
            self.redis.pipe.zGet('telHealth;'+id+';'+key)
            data[key] = self.redis.pipe.execute(packedScore=True)
        # nEle = sum([len(v) for v in keyV])
        # if len(data) != nEle:
        #     print keyV
        #     print data
        #     Assert(self.log, " - problem with redis.pipe.execute ?!?! " +
        #            str(len(data))+"/"+str(nEle), False)
        for key in keyV:
            res[key] = [{'y': x[0]['data'], 'x':x[1]} for x in data[key][0]]
            # res[key].append({'id': id+';'+key, 'data': [{'y': x[0]['data'], 'x':x[1]} for x in data[key]]})
        return res

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def sendRndomMessage(self, data):
        # self.log.info([
        #     ['y', ' - got event: sendRndomMessage('],
        #     ['g', str(data['myMessage'])], ['y', ")"]
        # ])

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getSubArrGrp(self):
        #print 'getSubArrGrp'
        with plotsDash.lock:
            subArrs = self.redis.get(name="subArrs", packed=True, defVal=[])
            self.subArrGrp = {"id": "subArr", "children": subArrs}

        return


    def checkSytemHealth(self, agregate, key, row):
        if float(row["mirror"]) < 30:
            agregate["critical"]["mirror"].append(key)
        elif float(row["mirror"]) < 55:
            agregate["warning"]["mirror"].append(key)

        if float(row["camera"]) < 30:
            agregate["critical"]["camera"].append(key)
        elif float(row["camera"]) < 55:
            agregate["warning"]["camera"].append(key)

        if float(row["aux"]) < 30:
            agregate["critical"]["aux"].append(key)
        elif float(row["aux"]) < 55:
            agregate["warning"]["aux"].append(key)

        if float(row["mount"]) < 30:
            agregate["critical"]["mount"].append(key)
        elif float(row["mount"]) < 55:
            agregate["warning"]["mount"].append(key)

    def agregateTelHealth(self, telHealth):
        agregate = {
            "LST":{"health":0, "number":0,
                "warning":{"camera":[], "mirror":[], "mount":[], "aux":[]},
                "critical":{"camera":[], "mirror":[], "mount":[], "aux":[]},
                "unknow":{"camera":[], "mirror":[], "mount":[], "aux":[]}},
            "MST":{"health":0, "number":0,
                "warning":{"camera":[], "mirror":[], "mount":[], "aux":[]},
                "critical":{"camera":[], "mirror":[], "mount":[], "aux":[]},
                "unknow":{"camera":[], "mirror":[], "mount":[], "aux":[]}},
            "SST":{"health":0, "number":0,
                "warning":{"camera":[], "mirror":[], "mount":[], "aux":[]},
                "critical":{"camera":[], "mirror":[], "mount":[], "aux":[]},
                "unknow":{"camera":[], "mirror":[], "mount":[], "aux":[]}},
            "AUX":{"health":0, "number":0,
                "warning":{"camera":[], "mirror":[], "mount":[], "aux":[]},
                "critical":{"camera":[], "mirror":[], "mount":[], "aux":[]},
                "unknow":{"camera":[], "mirror":[], "mount":[], "aux":[]}}
        }

        for key in telHealth:
            if (telHealth[key]["health"] is None):
                continue
            if self.mySock.arrayData.is_tel_type(key, 'LST'):
                agregate["LST"]["health"] += float(telHealth[key]["health"])
                agregate["LST"]["number"] += 1
                self.checkSytemHealth(agregate["LST"], key, telHealth[key])

            elif self.mySock.arrayData.is_tel_type(key, 'MST'):
                agregate["MST"]["health"] += float(telHealth[key]["health"])
                agregate["MST"]["number"] += 1
                self.checkSytemHealth(agregate["MST"], key, telHealth[key])

            elif self.mySock.arrayData.is_tel_type(key, 'SST'):
                agregate["SST"]["health"] += float(telHealth[key]["health"])
                agregate["SST"]["number"] += 1
                self.checkSytemHealth(agregate["SST"], key, telHealth[key])

        if agregate["LST"]["number"] > 0:
            agregate["LST"]["health"] = agregate["LST"]["health"] / agregate["LST"]["number"]
        if agregate["MST"]["number"] > 0:
            agregate["MST"]["health"] = agregate["MST"]["health"] / agregate["MST"]["number"]
        if agregate["SST"]["number"] > 0:
            agregate["SST"]["health"] = agregate["SST"]["health"] / agregate["SST"]["number"]
        return agregate

    def getTelsTresholdType(self, key):
        if key == 'health':
            return [{"name": "ERROR", "value": "30", "func": "<="},
        {"name": "WARNING", "value": "55", "func": "<="},
        {"name": "NOMINAL", "value": "100", "func": "<="}]
        return {}
    def getTelsMeasureType(self, key):
        if key == 'mount':
            return {"name": "Health", "key": "health", "short": "hlt", "unit": "%", "treshold": self.getTelsTresholdType("health")}
        if key == 'mirror':
            return {"name": "Health", "key": "health", "short": "hlt", "unit": "%", "treshold": self.getTelsTresholdType("health")}
        if key == 'daq':
            return {"name": "Health", "key": "health", "short": "hlt", "unit": "%", "treshold": self.getTelsTresholdType("health")}
        if key == 'camera':
            return {"name": "Health", "key": "health", "short": "hlt", "unit": "%", "treshold": self.getTelsTresholdType("health")}
        if key == 'aux':
            return {"name": "Health", "key": "health", "short": "hlt", "unit": "%", "treshold": self.getTelsTresholdType("health")}
        return {}
    def initUrgentCurrent(self):
        self.urgentCurrent = []
        telHealth = self.getTelHealth()
        for idTel, vect in telHealth.items():
            for key, value in vect.items():
                if (key != "status" and value != None and self.getTelState(int(value)) == "ERROR"):
                    self.urgentCurrent.append({"id": idTel+key, "keys": [idTel, key], "name": idTel, "data": {"measures": [{"value": value, "timestamp": getTime()}], "type": self.getTelsMeasureType(key)}})
    def updateUrgentCurrent(self):
        self.urgentCurrent = []
        telHealth = self.getTelHealth()
        for idTel, vect in telHealth.items():
            for key, value in vect.items():
                if (key != "status" and value != None and self.getTelState(int(value)) == "ERROR"):
                    self.urgentCurrent.append({"id": idTel+key, "keys": [idTel, key], "name": idTel, "data": {"measures": [{"value": value, "timestamp": getTime()}], "type": self.getTelsMeasureType(key)}})
    def orderUrgentCurrentByKey(self, vKeys):
        def interOrdering(vector, index):
            if index >= len(vKeys): return vector
            interOrder = []
            for key in vKeys[index]:
                ordered = {"key": key, "data": []}
                for v in vector:
                    if key in v["keys"]:
                        ordered["data"].append(v)
                ordered["data"] = interOrdering(ordered["data"], index+1)
                interOrder.append(ordered)
            return interOrder
        return interOrdering(self.urgentCurrent, 0)

    def initUrgentPast(self):
        self.urgentPast = []
    def updateUrgentPast(self):
        for curr in self.urgentCurrent:
            insert = True
            for past in self.urgentPast:
                if curr["id"] == past["id"]:
                    past["data"]["measures"].append(curr["data"]["measures"][0])
                    insert = False
                    break
            if insert:
                self.urgentPast.append(curr)
    def orderByTimestamp(self, vector):
        orderedV = []
        timestampList = []
        for v in vector:
            for mes in v["data"]["measures"]:
                if mes["timestamp"] not in timestampList:
                    timestampList.append(mes["timestamp"])
        timestampList.sort()
        prevOrder = {"timestamp": None, "data": []}
        for ts in timestampList:
            order = {"timestamp": ts, "data": []}
            for v in vector:
                me = v["data"]["measures"]
                if ts >= me[0]["timestamp"] and ts <= me[len(me) - 1]["timestamp"]:
                    order["data"].append(v["id"])
            if set(prevOrder["data"]) != set(order["data"]):
                orderedV.append(order)
                prevOrder = order
        return orderedV
    def orderUrgentPastByKeyTime(self, vKeys):
        def interOrdering(vector, index):
            if index >= len(vKeys): return self.orderByTimestamp(vector)
            interOrder = []
            for key in vKeys[index]:
                ordered = {"key": key, "data": []}
                for v in vector:
                    if key in v["keys"]:
                        ordered["data"].append(v)
                ordered["data"] = interOrdering(ordered["data"], index+1)
                interOrder.append(ordered)
            return interOrder
        return interOrdering(self.urgentPast, 0)
    def orderUrgentPastByKey(self, vKeys):
        def interOrdering(vector, index):
            if index >= len(vKeys): return vector
            interOrder = []
            for key in vKeys[index]:
                ordered = {"key": key, "data": []}
                for v in vector:
                    if key in v["keys"]:
                        ordered["data"].append(v)
                ordered["data"] = interOrdering(ordered["data"], index+1)
                interOrder.append(ordered)
            return interOrder
        return interOrdering(self.urgentPast, 0)

    def getTelState(self, health):
      if (health < 80): return "ERROR"
      elif (health < 55): return "WARNING"
      else: return "NOMINAL"

    def getTelHealth(self, idIn=None):
        data = dict()
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
