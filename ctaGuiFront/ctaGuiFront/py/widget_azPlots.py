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
from ctaGuiUtils.py.utils import myLog, Assert, deltaSec, getTime, flatDictById
from ctaGuiUtils.py.utils_redis import redisManager


# -----------------------------------------------------------------------------------------------------------
#  azPlots
# -----------------------------------------------------------------------------------------------------------
class azPlots():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

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
        self.widgetState = None

        self.PrimaryGroup = ['LSTS','MSTS','SSTS','AUX']
        self.PrimaryKey = ['mirror','camera','mount','aux']

        self.telIds = self.mySock.arrayData.get_inst_ids()

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
        self.widgetState["zoomTarget"] = ""

        # self.initTelHealth()

        # initial dataset and send to client
        optIn = {'widget': self, 'dataFunc': self.getInitData}
        self.mySock.sendWidgetInit(optIn=optIn)

        # start a thread which will call updateData() and send 1Hz
        # data updates to all sessions in the group
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.addWidgetTread(optIn=optIn)

        # self.telId = ''
        # self.propId = ''

        # with self.mySock.lock:
        #     if self.mySock.getThreadId(self.mySock.usrGrpId, "azPlotsUpdateData") == -1:
        #         if self.logSendPkt:
        #             self.log.info([
        #               ['y', " - starting azPlotsUpdateData("],
        #               ['g', self.mySock.usrGrpId], ['y', ")"]
        #             ])
        #
        #         threadId = self.mySock.setThreadState(
        #             self.mySock.usrGrpId, "azPlotsUpdateData", True)
        #         aThread = gevent.spawn(self.azPlotsUpdateData, threadId)

        return

    # -----------------------------------------------------------------------------------------------------------
    # get info of telescope 0-100 for each fields
    # -----------------------------------------------------------------------------------------------------------
    def getTelHealthS0(self, idIn=None):
        #print 'getTelHealthS0'
        data = dict()

        fields = ["health", "status", "camera",
                  "mirror", "mount", "daq", "aux"]
        nFilelds = len(fields)

        idV = self.telIds if (idIn is None) else [idIn]

        self.redis.pipe.reset()
        for idNow in idV:
            self.redis.pipe.zGet('telHealth;'+idNow+';'+'mirror')
            #self.redis.pipe.hMget(name="telHealth;"+str(idNow), key=fields)
        redData = self.redis.pipe.execute()

        for i in range(len(redData)):
            idNow = idV[i]
            data[idNow] = dict()

            for j in range(nFilelds):
                data[idNow][fields[j]] = redData[i][j]

        return data if (idIn is None) else data[idNow]

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def backFromOffline(self):
        # with azPlots.lock:
        #   print '-- backFromOffline',self.widgetName, self.widgetId
        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    # def initTelHealth(self):
    #     # self.telHealth = dict()
    #     # self.telSubHealthFields = dict()
    #
    #     self.telSubHealth = self.mySock.arrayData.getTelHealthD()
    #
    #     # a flat dict with references to each level of the original dict
    #     self.telSubHealthFlat = dict()
    #     for idNow in self.telIds:
    #         self.telSubHealthFlat[idNow] = flatDictById(self.telSubHealth[idNow])
    #
    #     # for idNow in self.telIds:
    #     #     self.telHealth[idNow] = {
    #     #         "id": idNow, "health": 0, "status": "",
    #     #         "data": [
    #     #             self.telSubHealth[idNow]["camera"],
    #     #             self.telSubHealth[idNow]["mirror"],
    #     #             self.telSubHealth[idNow]["mount"],
    #     #             self.telSubHealth[idNow]["daq"],
    #     #             self.telSubHealth[idNow]["aux"]
    #     #         ]
    #     #     }
    #     #     self.telSubHealthFields[idNow] = []
    #     #     for key, val in self.telSubHealthFlat[idNow].iteritems():
    #     #         if 'val' in val['data']:
    #     #             self.telSubHealthFields[idNow] += [key]
    #     return

    # -----------------------------------------------------------------------------------------------------------
    #   Retrieve health of all Telescope and create a mean
    # -----------------------------------------------------------------------------------------------------------
    # def getGeneralData(self):
    #     fields = ['mirror','camera','mount','aux']
    #     self.redis.pipe.reset()
    #
    #     for idNow in self.telIds:
    #         for key in fields:
    #             self.redis.pipe.zGet('telHealth;'+idNow+';'+key)
    #     data = self.redis.pipe.execute(packedScore=True)
    #     return data[0]

    def getInitData(self):
        inst_info = self.mySock.arrayData.get_tel_pos()
        data = {
            "arrPosD": inst_info,
            "arrInit": self.getData(),
            "arrProp": self.getTelHealthS0()
        }
        return data
    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getData(self):
        #print self.getTelHealthS0()['S_65']
        # print " "
        # print " "
        # print " "
        # print " "
        # print self.getGeneralData()
        idNow = self.telIds[0]

        key0 = 'mirror'
        #keyParent = self.telSubHealthFlat[idNow][key0]['parent']

        keyV = {}
        keyV[0] = ['mirror','camera','mount','aux']
        # keyV[0] = self.telSubHealthFlat[idNow][keyParent]['siblings'] + [keyParent]
        # keyV[1] = self.telSubHealthFlat[idNow][key0]['siblings'] + [key0]
        # keyV[2] = self.telSubHealthFlat[idNow][key0]['children']

        # print key0, keyParent
        # print keyV[0]
        # print keyV[1]
        # print keyV[2]
        # print '--------------------------------'

        # # keyV[0] = [ 'mount_0', 'mount_1', 'mount_2' ]
        # # keyV[1] = [ 'mount_1_0', 'mount_1_1', 'mount_1_2', 'mount_1_3', 'mount_1_4' ]
        # # keyV[2] = [ 'mount_1_1_0', 'mount_1_1_1', 'mount_1_1_2', 'mount_1_1_3' ]

        for k, v in keyV.items():
            for key in v:
                self.redis.pipe.zGet('telHealth;'+idNow+';'+key)
        data = self.redis.pipe.execute(packedScore=True)

        # sanity chekc (rewrite nicer...)
        nEle = sum([len(v) for k, v in keyV.items()])
        if len(data) != nEle:
            print keyV
            print data
            Assert(self.log, " - problem with redis.pipe.execute ?!?! " +
                   str(len(data))+"/"+str(nEle), False)

        nEleNow = 0
        dataOut = {}
        for k, v in keyV.items():
            dataOut[k] = []
            for key in v:
                dataNow = data[nEleNow]
                nEleNow += 1
                # print k,v,key
                dataOut[k].append(
                    {'id': idNow+';'+key, 'data': [{'y': x[0]['data'], 'x':x[1]} for x in dataNow]})

        # key='mount_1_1_0'
        # data = self.redis.zGet('telHealth;'+idNow+';'+key, packedScore=True)
        # # # data = self.redis.redis.zrevrange(name='telHealth;L_0;daq_8_1', start=0, end=-1,
        # # # withscores=True, score_cast_func=int)
        # # # data = self.redis.redis.zrange(name='telHealth;'+idNow+';'+key, start=0, end=-1,
        # # # withscores=True)
        # # print '+++++++++++++++++++++++++',data
        # # for w in data: print '  --  ',w

        # # data = self.redis.redis.zrevrange(name='telHealth;'+idNow+';'+key, start=0, end=-1,
        # # # withscores=True)
        # dataOut = [ { "id":idNow+';'+key, 'y':x[0]['data'], 'x':x[1] } for x in data ]
        # # dataOut.sort(key=lambda x: x['x'], reverse=True)

        # # print '============',dataOut
        # # print idNow,'==========',len(dataOut),key
        # # ww = dataOut[0:6]
        # # ww = dataOut
        # # for w in ww: print '  --  ',w['x']
        # dataOut["arrProp"] = self.getTelHealthS0()
        telHealth = self.getTelHealthS0()
        return {
            "dataOut":dataOut,
            "telHealth":telHealth,
            "telHealthAggregate":self.agregateTelHealth(telHealth)
        }

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

    def getTelHealthS0(self, idIn=None):
        #print 'getTelHealthS0'
        data = dict()

        fields = ["health", "status", "camera",
                  "mirror", "mount", "daq", "aux"]
        nFilelds = len(fields)

        idV = self.telIds if (idIn is None) else [idIn]

        self.redis.pipe.reset()
        for idNow in idV:
            self.redis.pipe.hMget(name="telHealth;"+str(idNow), key=fields)
        redData = self.redis.pipe.execute()

        for i in range(len(redData)):
            idNow = idV[i]
            data[idNow] = dict()

            for j in range(nFilelds):
                data[idNow][fields[j]] = redData[i][j]

        return data if (idIn is None) else data[idNow]


    # # -----------------------------------------------------------------------------------------------------------
    # #
    # # -----------------------------------------------------------------------------------------------------------
    # def azPlotsUpdateDataOnce(self):
    #     # get the current set of widgest which need an update
    #     # with self.mySock.lock:
    #     #     with azPlots.lock:
    #     #         azPlots.sendV["s_0"] = {"sessId": [], "widgetId": []}
    #     #         azPlots.sendV["s_1"] = dict()
    #     #
    #     #         widgetD = self.redis.hGetAll(name='widgetV', packed=True)
    #     #         for widgetId, widgetNow in widgetD.iteritems():
    #     #             if widgetNow["widgetName"] != self.widgetName:
    #     #                 continue
    #     #             if widgetId not in self.mySock.widgetInitV:
    #     #                 continue
    #     #
    #     #             azPlots.sendV["s_0"]["sessId"].append(
    #     #                 widgetNow["sessId"])
    #     #             azPlots.sendV["s_0"]["widgetId"].append(widgetId)
    #     #
    #     #             if self.mySock.widgetInitV[widgetId].widgetState["zoomState"] == 1:
    #     #                 zoomTarget = self.mySock.widgetInitV[widgetId].widgetState["zoomTarget"]
    #     #                 if zoomTarget not in azPlots.sendV["s_1"]:
    #     #                     azPlots.sendV["s_1"][zoomTarget] = {
    #     #                         "sessId": [], "widgetId": []
    #     #                     }
    #     #                 azPlots.sendV["s_1"][zoomTarget]["sessId"].append(
    #     #                     widgetNow["sessId"])
    #     #                 azPlots.sendV["s_1"][zoomTarget]["widgetId"].append(
    #     #                     widgetId)
    #     #
    #     # # -----------------------------------------------------------------------------------------------------------
    #     # #
    #     # # -----------------------------------------------------------------------------------------------------------
    #     # propDs1 = dict()
    #     # for zoomTarget in azPlots.sendV["s_1"]:
    #     #     self.updateTelHealthS1(idIn=zoomTarget)
    #     #
    #     #     propDs1[zoomTarget] = self.getFlatTelHealth(zoomTarget)
    #     #
    #     # # -----------------------------------------------------------------------------------------------------------
    #     # # transmit the values
    #     # # -----------------------------------------------------------------------------------------------------------
    #     # dataEmitS0 = {
    #     #     "widgetId": "",
    #     #     "type": "s00",
    #     #     "data": self.getTelHealthS0()
    #     # }
    #     #
    #     # self.mySock.socketEvtWidgetV(
    #     #     evtName="azPlotsUpdateData",
    #     #     data=dataEmitS0,
    #     #     sessIdV=azPlots.sendV["s_0"]["sessId"],
    #     #     widgetIdV=azPlots.sendV["s_0"]["widgetId"]
    #     # )
    #     #
    #     # for zoomTarget in azPlots.sendV["s_1"]:
    #     #     dataEmitS1 = {
    #     #         "widgetId": "",
    #     #         "type": "s11",
    #     #         "data": propDs1[zoomTarget]
    #     #     }
    #     #
    #     #     self.mySock.socketEvtWidgetV(
    #     #         evtName="azPlotsUpdateData",
    #     #         data=dataEmitS1,
    #     #         sessIdV=azPlots.sendV["s_1"][zoomTarget]["sessId"],
    #     #         widgetIdV=azPlots.sendV["s_1"][zoomTarget]["widgetId"]
    #     #     )
    #
    #     return
    #
    # # -----------------------------------------------------------------------------------------------------------
    # #
    # # -----------------------------------------------------------------------------------------------------------
    # def azPlotsUpdateData(self, threadId):
    #     if not self.doDataUpdates:
    #         return
    #
    #     sleep(3)
    #
    #     while (threadId == self.mySock.getThreadId(self.mySock.usrGrpId, "azPlotsUpdateData")):
    #         self.azPlotsUpdateDataOnce()
    #         sleep(10)
    #
    #     return
