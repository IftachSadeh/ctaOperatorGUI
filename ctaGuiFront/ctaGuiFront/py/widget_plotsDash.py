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
from ctaGuiUtils.py.utils import myLog, Assert, deltaSec, telIds, getTimeOfNight
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

        # initial dataset and send to client
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.sendWidgetInit(optIn=optIn)

        # start a thread which will call updateData() and send 1Hz data updates to
        # all sessions in the group
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.addWidgetTread(optIn=optIn)

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
        plotsDash.timeOfNight = getTimeOfNight(self)
        timeOfNightDate = {
            "date_start": datetime(2018, 9, 16, 21, 30).strftime('%Y-%m-%d %H:%M:%S'),
            "date_end": (datetime(2018, 9, 16, 21, 30) + timedelta(seconds=int(plotsDash.timeOfNight['end']))).strftime('%Y-%m-%d %H:%M:%S'),
            "date_now": (datetime(2018, 9, 16, 21, 30) + timedelta(seconds=int(plotsDash.timeOfNight['now']))).strftime('%Y-%m-%d %H:%M:%S'),
            "now": int(plotsDash.timeOfNight['now']),
            "start": int(plotsDash.timeOfNight['start']),
            "end": int(plotsDash.timeOfNight['end'])
            }

        indexRange = 6
        keyV = {}
        keyV[0] = ['mirror','camera','mount','aux']
        dataOut = {}

        for index in range(indexRange):
            for k, v in keyV.items():
                for key in v:
                    self.redis.pipe.zGet('telHealth;'+telIds[index]+';'+key)
            data = self.redis.pipe.execute(packedScore=True)
            nEle = sum([len(v) for k, v in keyV.items()])
            if len(data) != nEle:
                print keyV
                print data
                Assert(self.log, " - problem with redis.pipe.execute ?!?! " +
                       str(len(data))+"/"+str(nEle), False)
            nEleNow = 0
            for k, v in keyV.items():
                dataOut[index] = []
                for key in v:
                    dataNow = data[nEleNow]
                    nEleNow += 1
                    dataOut[index].append(
                        {'id': telIds[index]+';'+key, 'data': [{'y': x[0]['data'], 'x':x[1]} for x in dataNow]})

        data = {
            "timeOfNight": timeOfNightDate,
            "dataOut":dataOut
        }

        return data

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def sendRndomMessage(self, data):
        # self.log.info([
        #     ['y', ' - got event: sendRndomMessage('],
        #     ['g', str(data['myMessage'])], ['y', ")"]
        # ])

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
