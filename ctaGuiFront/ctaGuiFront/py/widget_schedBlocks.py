import os
import copy
import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
from datetime import datetime
from datetime import timedelta
import time
import random
from random import Random
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import myLog, Assert, deltaSec, getTimeOfNight
from ctaGuiUtils.py.utils_redis import redisManager


# ------------------------------------------------------------------
#  schedBlocks
# ------------------------------------------------------------------
class schedBlocks():
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
               " - no mySock handed to", self.__class__.__name__],
               state=(self.mySock is not None))

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
        
        # ------------------------------------------------------------------
        # need to add lock ?!?!?!?!?
        # ------------------------------------------------------------------
        if len(schedBlocks.telHealth) == 0:
            for idNow in self.telIds:
                schedBlocks.telHealth.append({"id": idNow, "val": 0})

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

        # initial dataset and send to client
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.sendWidgetInit(optIn=optIn)

        # start a thread which will call updateData() and send 1Hz data updates
        # to all sessions in the group
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.addWidgetTread(optIn=optIn)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def backFromOffline(self):
        # with schedBlocks.lock:
        #   print 'backFromOffline',self.widgetName, self.widgetId
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getData(self):
        schedBlocks.timeOfNight = getTimeOfNight(self)
        self.getBlocks()
        self.getEvents()
        self.getClockEvents()
        self.getTelHealth()
        #  int(time.mktime(datetime(2018, 9, 16, 21, 30).timetuple()))
        timeOfNightDate = {
            "date_start": datetime(2018, 9, 16, 21, 30).strftime('%Y-%m-%d %H:%M:%S'),
            "date_end": (datetime(2018, 9, 16, 21, 30) + timedelta(seconds=int(schedBlocks.timeOfNight['end']))).strftime('%Y-%m-%d %H:%M:%S'),
            "date_now": (datetime(2018, 9, 16, 21, 30) + timedelta(seconds=int(schedBlocks.timeOfNight['now']))).strftime('%Y-%m-%d %H:%M:%S'),
            "now": int(schedBlocks.timeOfNight['now']),
            "start": int(schedBlocks.timeOfNight['start']),
            "end": int(schedBlocks.timeOfNight['end'])
        }
        data = {
            "timeOfNight": timeOfNightDate,
            "telHealth": schedBlocks.telHealth,
            "telIds": self.telIds,
            "blocks": schedBlocks.blocks,
            "external_events": schedBlocks.external_events,
            "external_clockEvents": schedBlocks.external_clockEvents
        }

        return data

    def getTelHealth(self):
        self.redis.pipe.reset()
        for idNow in self.telIds:
            self.redis.pipe.hGet(name="telHealth;"+str(idNow), key="health")
        redData = self.redis.pipe.execute()

        for i in range(len(redData)):
            idNow = self.telIds[i]
            schedBlocks.telHealth[i]["val"] = redData[i]

        return

    def getEvents(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_events")
        readData = self.redis.pipe.execute(packed=True)

        schedBlocks.external_events = readData

        return

    def getClockEvents(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_clockEvents")
        readData = self.redis.pipe.execute(packed=True)

        schedBlocks.external_clockEvents = readData

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getBlocks(self):
        for keyV in schedBlocks.blockKeys:
            self.redis.pipe.reset()
            for key in keyV:
                self.redis.pipe.get('obsBlockIds_'+key)

            data = self.redis.pipe.execute(packed=True)
            obsBlockIds = sum(data, [])  # flatten the list of lists
            # obsBlockIds = [] if data is None else sum(data, []) # flatten the list of lists

            self.redis.pipe.reset()
            for obId in obsBlockIds:
                self.redis.pipe.get(obId)

            key = keyV[0]
            blocks = self.redis.pipe.execute(packed=True)
            schedBlocks.blocks[key] = sorted(
                blocks, cmp=lambda a, b: int(a['time']['start']) - int(b['time']['start']))

        # schedBlocks.blocks['run'] = schedBlocks.blocks['wait'][0:6]
        # for bb in (schedBlocks.blocks['run']):
        #   bb['exeState']['state'] = 'run'
        # self.doDataUpdates = False


        # self.redis.pipe.reset()
        # self.redis.pipe.get('obsBlockIds_'+'wait')
        # self.redis.pipe.get('obsBlockIds_'+'run')
        # self.redis.pipe.get('obsBlockIds_'+'done')
        # self.redis.pipe.get('obsBlockIds_'+'cancel')
        # self.redis.pipe.get('obsBlockIds_'+'fail')

        # data = self.redis.pipe.execute(packed=True)
        # obsBlockIds = sum(data, [])  # flatten the list of lists
        # # print 'wwwwwwww',obsBlockIds
        # # obsBlockIds = self.redis.get(key=('obsBlockIds_'+'all'), packed=True, defVal=[])
        # # print 'xxxxxxxx',obsBlockIds

        # self.redis.pipe.reset()
        # for obId in obsBlockIds:
        #     self.redis.pipe.get(obId)

        # blocks = self.redis.pipe.execute(packed=True)
        # schedBlocks.blocks = sorted(blocks, cmp=lambda a, b: int(
        #     a['timeStamp']) - int(b['timeStamp']))
        # # print schedBlocks.blocks

        # # dur = [x['duration'] for x in schedBlocks.blocks] ; print dur

        # # schedBlocks.blocks = [ unpackb(x) for x in redData ]

        # # schedBlocks.blocks = []
        # # for block in redData:
        # #   schedBlocks.blocks.append(unpackb(block))

        # # self.sortBlocks()

        # # if len(schedBlocks.blocks) > 10: schedBlocks.blocks = schedBlocks.blocks[0:9]
        # # # if len(schedBlocks.blocks) > 25: schedBlocks.blocks = schedBlocks.blocks[0:14]
        # # if len(schedBlocks.blocks) > 20: schedBlocks.blocks = schedBlocks.blocks[0:13]
        # # print schedBlocks.blocks
        # # # for bb in range(9):
        # # for bb in range(25):
        # #   if len(schedBlocks.blocks) <= bb: break
        # #   # schedBlocks.blocks[bb]['exeState'] = 'done'
        # #   schedBlocks.blocks[bb]['exeState'] = 'run'
        # #   print schedBlocks.blocks[bb]
        # # schedBlocks.blocks[bb]['runPhase'] = ['run_takeData']
        # #   # schedBlocks.blocks[bb]['runPhase'] = ['run_config_mount']
        # #   # print schedBlocks.blocks[bb]
        # #   # if bb < 10: schedBlocks.blocks[bb]['exeState'] = 'run'
        # #   # else:     schedBlocks.blocks[bb]['exeState'] = 'wait'

        return
