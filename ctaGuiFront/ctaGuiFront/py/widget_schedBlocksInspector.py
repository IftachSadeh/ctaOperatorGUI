from gevent.coros import BoundedSemaphore
from ctaGuiUtils.py.utils import myLog, Assert, getTimeOfNight
from ctaGuiUtils.py.utils_redis import redisManager
from datetime import timedelta
from datetime import datetime


# ------------------------------------------------------------------
#  schedBlocksInspector
# ------------------------------------------------------------------
class schedBlocksInspector():
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
        Assert(log=self.log,
               msg=[" - no mySock handed to", self.__class__.__name__],
               state=(self.mySock is not None))

        # widget-class and widget group names
        self.widgetName = self.__class__.__name__
        self.widgetGroup = self.mySock.usrGrpId+''+self.widgetName

        self.redis = redisManager(name=self.widgetName, log=self.log)

        # # turn on periodic data updates
        # self.doDataUpdates = True
        # # some etra logging messages for this module
        # self.logSendPkt =  False
        self.nIcon = -1

        # self.telIds = self.mySock.arrayData.get_inst_ids()
        self.telIds = self.mySock.arrayData.get_inst_ids(
            inst_types=['LST', 'MST', 'SST']
        )

        # ------------------------------------------------------------------
        # need to add lock ?!?!?!?!?
        # ------------------------------------------------------------------
        if len(schedBlocksInspector.telHealth) == 0:
            for idNow in self.telIds:
                schedBlocksInspector.telHealth.append({"id": idNow, "val": 0})

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        with self.mySock.lock:
            wgt = self.redis.hGet(
                name='widgetV', key=self.widgetId, packed=True)
            self.nIcon = wgt["nIcon"]

        # override the global logging variable with a name
        # corresponding to the current session id
        self.log = myLog(title=str(self.mySock.userId) + "/" +
                         str(self.mySock.sessId) + "/" + __name__ + "/"
                         + self.widgetId)

        # initial dataset and send to client
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.sendWidgetInit(optIn=optIn)

        # start a thread which will call updateData() and send
        # 1Hz data updates to all sessions in the group
        optIn = {'widget': self, 'dataFunc': self.getData}
        self.mySock.addWidgetTread(optIn=optIn)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def backFromOffline(self):
        # with schedBlocksInspector.lock:
        #   print '-- backFromOffline',self.widgetName, self.widgetId
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getData(self):
        schedBlocksInspector.timeOfNight = getTimeOfNight(self)

        self.getBlocks()
        self.getTelHealth()
        self.getEvents()
        self.getClockEvents()
        self.getTarget()
        timeOfNightDate = {
            "date_start": datetime(2018, 9, 16, 21, 30).strftime('%Y-%m-%d %H:%M:%S'),
            "date_end": (datetime(2018, 9, 16, 21, 30) + timedelta(seconds=int(schedBlocksInspector.timeOfNight['end']))).strftime('%Y-%m-%d %H:%M:%S'),
            "date_now": (datetime(2018, 9, 16, 21, 30) + timedelta(seconds=int(schedBlocksInspector.timeOfNight['now']))).strftime('%Y-%m-%d %H:%M:%S'),
            "now": int(schedBlocksInspector.timeOfNight['now']),
            "start": int(schedBlocksInspector.timeOfNight['start']),
            "end": int(schedBlocksInspector.timeOfNight['end'])
            }

        data = {
            "timeOfNight": timeOfNightDate,
            "telHealth": schedBlocksInspector.telHealth,
            "blocks": schedBlocksInspector.blocks,
            "external_events": schedBlocksInspector.external_events,
            "external_clockEvents": schedBlocksInspector.external_clockEvents,
            "targets": schedBlocksInspector.targets
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getEvents(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_events")
        readData = self.redis.pipe.execute(packed=True)

        schedBlocksInspector.external_events = readData

        return

    def getClockEvents(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_clockEvents")
        readData = self.redis.pipe.execute(packed=True)

        schedBlocksInspector.external_clockEvents = readData

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getTelHealth(self):
        self.redis.pipe.reset()
        for idNow in self.telIds:
            self.redis.pipe.hGet(name="telHealth;"+str(idNow), key="health")
        redData = self.redis.pipe.execute()

        for i in range(len(redData)):
            idNow = self.telIds[i]
            schedBlocksInspector.telHealth[i]["val"] = redData[i]

        return

    def getTarget(self):
        self.redis.pipe.reset()

        schedBlocksInspector.targetsIds = self.redis.get(name='targetsIds', packed=True, defVal=[])
        for id in schedBlocksInspector.targetsIds:
            self.redis.pipe.get(id)
        schedBlocksInspector.targets = self.redis.pipe.execute(packed=True)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getBlocks(self):
        for keyV in schedBlocksInspector.blockKeys:
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
            schedBlocksInspector.blocks[key] = sorted(
                blocks,
                #cmp=lambda a, b: int((datetime.strptime(a['startTime'],"%Y-%m-%d %H:%M:%S") - datetime.strptime(b['startTime'],"%Y-%m-%d %H:%M:%S")).total_seconds())
                cmp=lambda a, b: int(a['time']['start']) - int(b['time']['start'])
            )

        return

    # data.zoomTarget = name of telescope focus on (ex: L_2)
    def schedBlockInspectorPushNewSchedule(self, *args):
        self.expire = 86400 # one day
        print 'schedBlockInspectorPushNewSchedule'
        data = args[0]['newSchedule']
        self.redis.pipe.reset()
        self.redis.pipe.set(name='blockUpdate', data=data, packed=True)
        # blockIds = {"wait": [], "run": [], "done": [], "cancel": [], "fail": []}
        # newBlocks = []
        # for key in data:
        #     for i in range(len(data[key])):
        #         if self.redis.exists(data[key][i]["obId"]):
        #             blockIds[data[key][i]['exeState']['state']].append(data[key][i]["obId"])
        #             self.redis.pipe.set(
        #                 name=data[key][i]["obId"], data=data[key][i], expire=self.expire, packed=True)
        #         else:
        #             newBlocks.append(data[key][i])
        # for key, val in blockIds.iteritems():
        #     self.redis.pipe.set(name='obsBlockIds_'+key, data=val, packed=True)

        self.redis.pipe.execute()
        # print newBlocks

        self.mySock.socketEvtWidgetV(
            evtName="newSchedulePushed",
            data={},
            sessIdV=[self.mySock.sessId],
            widgetIdV=[self.widgetId]
        )

        return
