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
from ctaGuiUtils.py.utils import myLog, Assert, deltaSec, telIds, getTime, flatDictById
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

        # initial dataset and send to client
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.sendWidgetInit(optIn=optIn)

        # start a thread which will call updateData() and send 1Hz
        # data updates to all sessions in the group
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.addWidgetTread(optIn=optIn)

        return

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
    def initTelHealth(self):
        self.telSubHealth = self.mySock.arrayData.getTelHealthD()

        # a flat dict with references to each level of the original dict
        self.telSubHealthFlat = dict()
        for idNow in telIds:
            self.telSubHealthFlat[idNow] = flatDictById(
                self.telSubHealth[idNow])

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getData(self):
        idNow = telIds[0]

        key0 = 'mount_1_1'
        keyParent = self.telSubHealthFlat[idNow][key0]['parent']

        keyV = {}
        keyV[0] = self.telSubHealthFlat[idNow][keyParent]['siblings'] + [keyParent]
        keyV[1] = self.telSubHealthFlat[idNow][key0]['siblings'] + [key0]
        keyV[2] = self.telSubHealthFlat[idNow][key0]['children']

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

        return dataOut
