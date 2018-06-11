import copy
import time
import gevent
from gevent import sleep
from datetime import datetime
from gevent.coros import BoundedSemaphore, DummySemaphore
from random import Random
from math import ceil

from socketio.namespace import BaseNamespace
from socketio.mixins import BroadcastMixin

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import myLog, Assert, deltaSec, allowedWidgetTypeV, getTime
from ctaGuiUtils.py.utils_redis import redisManager
from ctaGuiUtils.py.arrayData import arrayData

# -----------------------------------------------------------------------------------------------------------
# general class for views corresponding to sockets, from which specific view can also inherit
# -----------------------------------------------------------------------------------------------------------
class mySock(BaseNamespace, BroadcastMixin):
    serverName = None
    sessExpire = 10
    cleanupSleep = 60

    # common dictionaries for all instances of the class (keeping track of all sessions etc.)
    sessToEndpointD = dict()
    threadToSigD = dict()
    widgetInitV = dict()

    lock = BoundedSemaphore(1)
    # lock = DummySemaphore()

    threadIdGen = Random(1)

    # -----------------------------------------------------------------------------------------------------------
    # individual parameters for a particular session
    # -----------------------------------------------------------------------------------------------------------
    def __init__(self, *args, **kwargs):
        super(mySock, self).__init__(*args, **kwargs)

        self.log = myLog(title=__name__)
        self.sessId = None
        self.userId = ""
        self.userGroup = ""
        self.usrGrpId = ""
        self.sessName = ""
        self.logSendPkt = False

        self.redis = redisManager(name=self.__class__.__name__, log=self.log)

        mySock.arrayData = arrayData(lock=mySock.lock)

        # -----------------------------------------------------------------------------------------------------------
        # cleanup the database of old sessions upon restart
        # -----------------------------------------------------------------------------------------------------------
        with mySock.lock:
            if mySock.serverName is None:
                mySock.serverName = 'server_'+str(getTime())

                # sessIds = self.redis.lGet('allSessIds')
                # for sessId in sessIds:
                #   self.cleanupSession(sessId)
                # self.redis.delete('userIds')
                # self.redis.delete('widgetV')

        return

    # -----------------------------------------------------------------------------------------------------------
    # upon any new connection
    # -----------------------------------------------------------------------------------------------------------
    def recv_connect(self):
        self.emit('initialConnect', {'serverName': mySock.serverName})
        return

    # -----------------------------------------------------------------------------------------------------------
    # upon reconnection to an existing session
    # -----------------------------------------------------------------------------------------------------------
    def on_backFromOffline(self):
        # print 'on_backFromOffline.................'
        # first validate that eg the server hasnt been restarted while this session has been offline
        sessIdV = self.redis.lGet('allSessIds')
        serverName = mySock.serverName if self.sessId in sessIdV else ''

        self.emit('reConnect', {'serverName': serverName})

        # now run any widget specific functions
        with mySock.lock:
            widgetIdV = self.redis.lGet('sessWidgetV;'+self.sessId)
            for widgetId in widgetIdV:
                if widgetId in mySock.widgetInitV:
                    getattr(mySock.widgetInitV[widgetId], "backFromOffline")()

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def on_setOnlineState(self, data):
        # print 'setOnlineState',data

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def on_joinSession(self, sesIdNow):
        self.userId = self.request.authenticated_userid
        if not self.userId:
            self.userId = ""
        for princ in self.request.effective_principals:
            if princ.startswith("group:"):
                self.userGroup = princ[len("group:"):]

        self.sessId = str(sesIdNow)
        self.usrGrpId = self.userGroup+''+self.userId
        self.sessName = self.usrGrpId+''+self.sessId

        # override the global logging variable with a name corresponding to the current session ids
        self.log = myLog(title=str(self.userId)+"/" +
                         str(self.sessId)+"/"+__name__)

        self.log.info([
            ['b', " -- new session: "],
            ['g', self.sessId, '', self.ns_name], ['b', ' --']
        ])
        self.log.debug([
            ['b', " - session details: "],
            ['y', mySock.serverName, ''], ['p', self.usrGrpId, ''],
            ['y', self.userId, ''], ['p', self.usrGrpId, ''],
            ['y', self.sessId, ''],
            ['p', self.sessName, ''], ['y', self.ns_name, '']
        ])

        with mySock.lock:
            userIdV = self.redis.lGet('userIds')
            if self.userId not in userIdV:
                self.redis.lPush(name='userIds', data=self.userId)

            # -----------------------------------------------------------------------------------------------------------
            # all session ids in one list (heartbeat should be first to
            # avoid cleanup racing conditions!)
            # -----------------------------------------------------------------------------------------------------------
            self.redis.set(name='sessHeartbeat;'+self.sessId,
                           expire=(int(mySock.sessExpire)*2))
            self.redis.lPush(name='allSessIds', data=self.sessId)

            # -----------------------------------------------------------------------------------------------------------
            # the socket endpoint type registry for this session
            # -----------------------------------------------------------------------------------------------------------
            mySock.sessToEndpointD[self.sessId] = self.ns_name

            # -----------------------------------------------------------------------------------------------------------
            #
            # -----------------------------------------------------------------------------------------------------------
            if not self.redis.hExists(name='syncGroups', key=self.userId):
                self.redis.hSet(name='syncGroups',
                                key=self.userId, data=[], packed=True)

            # -----------------------------------------------------------------------------------------------------------
            # list of all sessions for this user
            # -----------------------------------------------------------------------------------------------------------
            self.redis.lPush(name='userSessIds;'+self.userId, data=self.sessId)

        # -----------------------------------------------------------------------------------------------------------
        # initiate the threads which does periodic cleanup, heartbeat managment etc.
        # -----------------------------------------------------------------------------------------------------------
        with mySock.lock:
            if self.getThreadId("commonThread", "sessHeartbeat") == -1:
                threadId = self.setThreadState(
                    "commonThread", "sessHeartbeat", True)
                gevent.spawn(self.sessHeartbeat, threadId)

            if self.getThreadId("commonThread", "cleanup") == -1:
                threadId = self.setThreadState("commonThread", "cleanup", True)
                gevent.spawn(self.cleanup, threadId)

            if self.getThreadId("commonThread", "pubSubSocketEvtWidgetV") == -1:
                threadId = self.setThreadState(
                    "commonThread", "pubSubSocketEvtWidgetV", True)
                gevent.spawn(self.pubSubSocketEvtWidgetV, threadId)

        # -----------------------------------------------------------------------------------------------------------
        # transmit the initial data to the client
        # -----------------------------------------------------------------------------------------------------------
        joinSessionData = {
            "sessProps": {
                "sessId": str(self.sessId),
                "userId": str(self.userId)
            }
        }

        self.socketEvtThisSession(
            evtName='joinSessionData', data=joinSessionData)

        # -----------------------------------------------------------------------------------------------------------
        # function which may be overloaded, setting up individual
        # properties for a given session-type
        # -----------------------------------------------------------------------------------------------------------
        self.on_joinSession_()

        # -----------------------------------------------------------------------------------------------------------
        #
        # -----------------------------------------------------------------------------------------------------------
        self.initUserToSyncLoopV()

        return

    # -----------------------------------------------------------------------------------------------------------
    # general communication with a widget (will import and instantiate a class if needed)
    # -----------------------------------------------------------------------------------------------------------
    def on_widget(self, data):
        nSessTry = 0
        while self.sessId is None:
            nSessTry += 1
            if nSessTry >= 10:
                self.log.warning([
                    ['rb', " - ignoring zombie session - on_widget("],
                    ['yb', data], ['rb', ") !!!!!!!!"]
                ])
                return
            sleep(1)

        # basic widget info
        # -----------------------------------------------------------------------------------------------------------
        widgetId = data["widgetId"]
        widgetSource = data["widgetSource"]
        widgetName = data["widgetName"]
        nSyncGroup = data["nSyncGroup"] if "nSyncGroup" in data else 0
        syncType = data["syncType"] if "syncType" in data else 0

        if not self.doAllowPanelSync():
            nSyncGroup = -1

        # first make sure the requested widget has been registered as a legitimate class
        isPanelSync = (widgetName in allowedWidgetTypeV["notSynced"])
        if not isPanelSync and widgetName not in allowedWidgetTypeV["synced"]:
            Assert(self.log, " - widgetName='"+widgetName +
                   "' has not been registered in allowedWidgetTypeV ?!?!", False, True)
            return

        # -----------------------------------------------------------------------------------------------------------
        # dynamically load the module for the requested widget
        # (no need for a 'from dynamicLoadWidget import dynWidg_0' statement)
        # -----------------------------------------------------------------------------------------------------------
        with mySock.lock:
            hasWgtId = self.redis.hExists(name='widgetV', key=widgetId)

        if not hasWgtId:
            # the following is equivalent e.g., to:
            #   from dynamicLoadWidget import dynWidg_0
            #   widget = dynWidg_0(widgetId=widgetId, mySock=self)
            widgetMod = __import__(widgetSource, globals=globals())
            with mySock.lock:
                mySock.widgetInitV[widgetId] = getattr(
                    widgetMod, widgetName)(widgetId=widgetId, mySock=self)

            with mySock.lock:
                if isPanelSync:
                    nSyncGroup = -1
                    nIcon = -1
                else:
                    nIcon = allowedWidgetTypeV["synced"].index(widgetName)
                    while True:
                        widgetIdV = self.redis.lGet('userWidgetV;'+self.userId)
                        if len(widgetIdV) == 0:
                            break

                        widgetV = self.redis.hMget(
                            name='widgetV', key=widgetIdV, packed=True, filter=True)
                        nIconV = [x['nIcon'] for x in widgetV]

                        if nIcon in nIconV:
                            nIcon += len(allowedWidgetTypeV["synced"])
                        else:
                            break

                # bookkeeping and future reference of the class we just loaded
                # -----------------------------------------------------------------------------------------------------------
                widgetNow = dict()
                widgetNow["nIcon"] = nIcon
                widgetNow["userId"] = self.userId
                widgetNow["sessId"] = self.sessId
                widgetNow["widgetName"] = widgetName
                widgetNow["widgetState"] = dict()

                # register the new widget
                self.redis.hSet(name='widgetV', key=widgetId,
                                data=widgetNow, packed=True)
                self.redis.lPush(name='userWidgetV;' +
                                 self.userId, data=widgetId)
                self.redis.lPush(name='sessWidgetV;' +
                                 self.sessId, data=widgetId)

                # sync group initialization
                # -----------------------------------------------------------------------------------------------------------
                nSyncGroup = min(max(nSyncGroup, -1), 0)

                if syncType > 2 or syncType < 0:
                    self.log.warning([
                        ['rb', " - syncType = ", syncType, " too large - on_widget("],
                        ['yb', data], ['rb', ") !!!!!!!!"]
                    ])
                    syncType = min(max(syncType, 0), 2)

                if nSyncGroup == 0:
                    syncGroupV = self.redis.hGet(
                        name='syncGroups', key=self.userId, packed=True, defVal=[])

                    # -----------------------------------------------------------------------------------------------------------
                    # add new empty sync group if needed
                    # -----------------------------------------------------------------------------------------------------------
                    grpIndexV = []
                    if len(syncGroupV) > 0:
                        grpIndexV = [i for i, x in enumerate(
                            syncGroupV) if x["id"] == 'grp_0']
                    if len(grpIndexV) > 0:
                        grpIndex = grpIndexV[0]
                    else:
                        grpIndex = len(syncGroupV)

                        # the syncGroup["id"] must correspond to the pattern defined by the client
                        # for new groups (e.g., "grp_0") !!!
                        syncGroup = dict()
                        syncGroup["id"] = "grp_0"
                        syncGroup["title"] = "Group 0"
                        syncGroup["syncStateV"] = [[], [], []]
                        syncGroup["syncTypeV"] = dict()

                        syncGroupV.append(syncGroup)

                    # add the new widget to the requested sync group and sync state
                    iconId = "icn_"+str(getTime())
                    syncGroupV[grpIndex]["syncStateV"][syncType].append(
                        [widgetId, iconId])

                    self.redis.hSet(
                        name='syncGroups', key=self.userId, data=syncGroupV, packed=True)

            if nSyncGroup != -1:
                self.syncGroupUpdate()

        # -----------------------------------------------------------------------------------------------------------
        # call the method named args[1] with optional arguments args[2], equivalent e.g., to:
        #   widget.methodName(optionalArgs)
        # -----------------------------------------------------------------------------------------------------------
        if "methodName" in data and widgetId in mySock.widgetInitV:
            widgetIdV = self.redis.lGet('sessWidgetV;'+self.sessId)
            if "methodArgs" in data:
                getattr(mySock.widgetInitV[widgetId], data["methodName"])(
                    data["methodArgs"])
            else:
                getattr(mySock.widgetInitV[widgetId], data["methodName"])()

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------

    def initUserToSyncLoopV(self):
        return

    # -----------------------------------------------------------------------------------------------------------
    # prevent panle sync based on a global setting & user-name
    # -----------------------------------------------------------------------------------------------------------
    def doAllowPanelSync(self):
        allow = False
        if utils.allowPanelSync:
            allow = (self.userId != "guest")

        return allow

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def syncGroupUpdate(self):
        widgetIdV = []
        with mySock.lock:
            widgetD = self.redis.hGetAll(name='widgetV', packed=True)
            for widgetId, widgetNow in widgetD.iteritems():
                if widgetNow["nIcon"] == -1 and widgetId in mySock.widgetInitV:
                    widgetIdV.append(widgetId)

        for widgetId in widgetIdV:
            getattr(mySock.widgetInitV[widgetId], "updateSyncGroups")()

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def on_syncStateSend(self, dataIn):
        if not self.doAllowPanelSync():
            return
        if "widgetId" not in dataIn:
            return
        if not self.redis.hExists(name='activeWidget', key=self.userId):
            return

        allSyncIds = []
        with mySock.lock:
            if self.redis.hGet(name='activeWidget', key=self.userId) != dataIn["widgetId"]:
                return

            syncGroupV = self.redis.hGet(
                name='syncGroups', key=self.userId, packed=True, defVal=[])

            for syncGroup in syncGroupV:
                states0 = [i[0] for i in syncGroup["syncStateV"][0]]
                states1 = [i[0] for i in syncGroup["syncStateV"][1]]
                states2 = [i[0] for i in syncGroup["syncStateV"][2]]

                getV = states0 + states2
                isSend = (dataIn["widgetId"] in states0 or
                          dataIn["widgetId"] in states1)
                if isSend:
                    syncGroup["syncTypeV"][dataIn["type"]] = dataIn["data"]

                    for idNow in getV:
                        if (idNow != dataIn["widgetId"] and idNow not in allSyncIds):
                            allSyncIds.append(idNow)

            self.redis.hSet(name='syncGroups', key=self.userId,
                            data=syncGroupV, packed=True)

        data = {
            "widgetId": dataIn["widgetId"],
            "type": dataIn["type"],
            "data": dataIn["data"]
        }

        self.socketEvtWidgetV(evtName="syncStateGet",
                              data=data, widgetIdV=allSyncIds)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def on_setActiveWidget(self, data):
        activeWidget = self.redis.hGet(
            name='activeWidget', key=self.userId, defVal=None)

        if activeWidget != data["widgetId"]:
            self.redis.hSet(name='activeWidget',
                            key=self.userId, data=data["widgetId"])

        return

    # -----------------------------------------------------------------------------------------------------------
    # placeholder for overloaded method, to be run as part of on_leaveSession
    # -----------------------------------------------------------------------------------------------------------
    def on_leaveSession_(self):
        return

    # -----------------------------------------------------------------------------------------------------------
    # initial dataset and send to client
    # -----------------------------------------------------------------------------------------------------------
    def sendWidgetInit(self, optIn=None):
        widget = optIn['widget']
        dataFunc = optIn['dataFunc']
        threadType = optIn['threadType'] if 'threadType' in optIn else 'initData'

        with widget.lock:
            dataEmit = {
                "widgetType": widget.widgetName,
                'evtName': threadType,
                "nIcon": widget.nIcon,
                "data": dataFunc()
            }

            widget.log.info([
                ['y', " - sending - ("], ['b', widget.widgetName, threadType],
                ['y', ","], ['g', self.sessId, '/', widget.widgetId], ['y', ")"]
            ])

            self.socketEvtThisSession(
                widgetId=widget.widgetId, evtName=threadType, data=dataEmit)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def addWidgetTread(self, optIn=None):
        widget = optIn['widget']

        threadType = optIn['threadType'] if 'threadType' in optIn else 'updateData'
        optIn['threadType'] = threadType

        threadFunc = optIn['threadFunc'] if 'threadFunc' in optIn else None
        if threadFunc is None and threadType == 'updateData':
            threadFunc = self.widgetThreadFunc

        with widget.lock:
            if widget.widgetGroup not in widget.wgtGrpToSessV:
                widget.wgtGrpToSessV[widget.widgetGroup] = []

            widget.wgtGrpToSessV[widget.widgetGroup].append(
                widget.mySock.sessId)

            if self.getThreadId(widget.widgetGroup, threadType) == -1:
                with mySock.lock:
                    optIn['threadId'] = self.setThreadState(
                        widget.widgetGroup, threadType, True)

                    gevent.spawn(threadFunc, optIn=optIn)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def widgetThreadFunc(self, optIn=None):
        widget = optIn['widget']
        threadId = optIn['threadId']
        threadType = optIn['threadType']
        dataFunc = optIn['dataFunc']
        sleepTime = optIn['sleepTime'] if 'sleepTime' in optIn else 5

        dataEmit = {
            "widgetType": widget.widgetName, 'evtName': threadType
        }

        sleep(sleepTime)

        while (threadId == self.getThreadId(widget.widgetGroup, threadType)):
            with widget.lock:
                sessIdV = widget.wgtGrpToSessV[widget.widgetGroup]
                dataEmit['data'] = dataFunc()

                self.socketEvtWidgetV(evtName=threadType,
                                      data=dataEmit, sessIdV=sessIdV)

                if len(widget.wgtGrpToSessV[widget.widgetGroup]) == 0:
                    with self.lock:
                        self.clearThreadsByType(widget.widgetGroup)
                        widget.wgtGrpToSessV.pop(widget.widgetGroup, None)
                        break

            sleep(sleepTime)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def pubSubSocketEvtWidgetV(self, threadId):
        self.log.info([
            ['y', " - starting commonThread("],
            ['g', "pubSubSocketEvtWidgetV"], ['y', ")"]
        ])
        sleep(3)

        while self.redis.setPubSub("socketEvtWidgetV") is None:
            self.log.info([
                ['y', " - setting up PubSub - "],
                ['b', "socketEvtWidgetV"], ['y', ' ...']
            ])
            sleep(0.1)

        while (threadId == self.getThreadId("commonThread", "pubSubSocketEvtWidgetV")):
            sleep(0.1)

            msg = self.redis.getPubSub("socketEvtWidgetV", packed=True)
            if msg is None:
                continue

            data = msg['data']['data']
            evtName = msg['data']['evtName']
            sessIdV = msg['data']['sessIdV']
            widgetIdV = msg['data']['widgetIdV']

            with mySock.lock:
                if sessIdV is None:
                    sessIdV = self.redis.lGet('allSessIds')

                if self.logSendPkt:
                    self.log.info([
                        ['b', 'start '+evtName+"  --> "+lts(sessIdV)]
                    ])
                    self.log.info([
                        ['b', 'start '+evtName+"  --> "+"["+(',').join(sessIdV)+"]"]
                    ])

                userSessIds = self.redis.lGet('userSessIds;'+self.userId)
                sessIdV = [
                    x for x in sessIdV if
                    (x in self.socket.server.sockets and x in userSessIds)
                ]

                for sessId in sessIdV:
                    idV = self.redis.lGet('sessWidgetV;'+sessId)
                    if widgetIdV is None:
                        data["sessWidgetIds"] = idV
                    else:
                        data["sessWidgetIds"] = [
                            i for i in idV if i in widgetIdV
                        ]

                    data["emitTime"] = getTime()

                    pkt = dict(type='event', name=evtName, args=data,
                               endpoint=mySock.sessToEndpointD[sessId])
                    self.socket.server.sockets[sessId].send_packet(pkt)

            if self.logSendPkt:
                self.log.info(['r', 'end of send '+evtName])

        self.log.info([
            ['y', " - ending commonThread("],
            ['g', "pubSubSocketEvtWidgetV"], ['y', ")"]
        ])

        return

    # -----------------------------------------------------------------------------------------------------------
    # emit an event to the current session, or to a list of sessions
    # -----------------------------------------------------------------------------------------------------------
    def socketEvtWidgetV(self, evtName="", data={}, sessIdV=None, widgetIdV=None):
        message = {
            "evtName": evtName,
            "data": data,
            "sessIdV": sessIdV,
            "widgetIdV": widgetIdV
        }

        self.redis.publish(channel="socketEvtWidgetV",
                           message=message, packed=True)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def socketEvtThisSession(self, widgetId='', evtName=None, data=None):
        data = {} if data is None else data
        data["widgetId"] = widgetId

        evtName = data["evtName"] if evtName is None else evtName
        data["evtName"] = evtName

        with mySock.lock:
            if self.sessId in self.socket.server.sockets:
                data["emitTime"] = getTime()

                pkt = dict(type='event', name=evtName, args=data,
                           endpoint=mySock.sessToEndpointD[self.sessId])
                self.socket.server.sockets[self.sessId].send_packet(pkt)

        return

    # -----------------------------------------------------------------------------------------------------------
    # bookkeeping of threads and thread-signal cleanup
    # make sure the function which calls this has secured the thred-lock (mySock.lock)
    # -----------------------------------------------------------------------------------------------------------
    def setThreadState(self, threadType, threadTag, state):
        if state:
            if threadType not in mySock.threadToSigD:
                mySock.threadToSigD[threadType] = []

            threadIdNow = mySock.threadIdGen.randint(10000000000, 99999999999)

            for nEleNow in range(len(mySock.threadToSigD[threadType])):
                if mySock.threadToSigD[threadType][nEleNow][0] == threadTag:
                    mySock.threadToSigD[threadType][nEleNow][1] = threadIdNow
                    return threadIdNow

            mySock.threadToSigD[threadType].append([threadTag, threadIdNow])

            return threadIdNow
        else:
            for nEleNow in range(len(mySock.threadToSigD[threadType])):
                if mySock.threadToSigD[threadType][nEleNow][0] == threadTag:
                    mySock.threadToSigD[threadType][nEleNow][1] = -1

            return -1

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getThreadId(self, threadType, threadTag):
        if threadType in mySock.threadToSigD:
            for eleNow in mySock.threadToSigD[threadType]:
                if eleNow[0] == threadTag:
                    return eleNow[1]

        return -1

    # -----------------------------------------------------------------------------------------------------------
    # clean unneeded threads, assuming we are already in a thread
    # lock, for safe modification of mySock.threadToSigD
    # -----------------------------------------------------------------------------------------------------------
    def clearThreadsByType(self, threadType):
        if threadType in mySock.threadToSigD:
            mySock.threadToSigD.pop(threadType, None)

            self.log.info([
                ['r', ' - clearThreadsByType('+str(threadType)+') ...']
            ])

        return

    # -----------------------------------------------------------------------------------------------------------
    # for development - a refresh-all event
    # -----------------------------------------------------------------------------------------------------------
    def on_refreshAll(self, hasLock=False):
        def doRefresh():
            sessIdV = self.redis.lGet('allSessIds')
            sessIdV = [x for x in sessIdV if x in self.socket.server.sockets]

            for sessId in sessIdV:
                data = {"emitTime": getTime()}

                pkt = dict(type='event', name="refreshAll", args=data,
                           endpoint=mySock.sessToEndpointD[sessId])
                self.socket.server.sockets[sessId].send_packet(pkt)

            return

        if hasLock:
            doRefresh()
        else:
            with mySock.lock:
                doRefresh()

        return

    # -----------------------------------------------------------------------------------------------------------
    # disconnection may be received even if not explicitly emmitted by the user leaving the session
    # (e.g., internet connection loss or server freeze), therefore call on_leaveSession() explicitly
    # -----------------------------------------------------------------------------------------------------------
    def recv_disconnect(self):
        self.log.debug([
            ['r', " - Connection to "],
            ['p', self.sessName], ['r', " terminated..."]
        ])

        sessIdV = self.redis.lGet('allSessIds')
        if (self.sessName != "") and (self.sessId in sessIdV):
            self.on_leaveSession()

        self.disconnect(silent=True)
        return

    # -----------------------------------------------------------------------------------------------------------
    # on leaving the session
    # -----------------------------------------------------------------------------------------------------------
    def on_leaveSession(self):
        with mySock.lock:
            sessIds = self.redis.lGet('userSessIds;'+self.userId)
            self.log.info([
                ['b', " - leaving session "], ['y', self.sessName+" , "+self.userId],
                ['b', " where all Ids("], ['g', str(len(sessIds))],
                ['b', ") = ["], ['p', (',').join(sessIds)], ['b', "]"]
            ])

            # remove the widgets which belong to this session
            widgetIdV = self.redis.lGet('sessWidgetV;'+self.sessId)
            syncGroupV = self.redis.hGet(
                name='syncGroups', key=self.userId, packed=True, defVal=[])

            for widgetId in widgetIdV:
                self.redis.hDel(name='widgetV', key=widgetId)

                for syncGroup in syncGroupV:
                    for syncStateV in syncGroup["syncStateV"]:
                        rmEleV = []
                        for syncTypeNow in syncStateV:
                            if syncTypeNow[0] == widgetId:
                                rmEleV.append(syncTypeNow)
                        for rmEle in rmEleV:
                            syncStateV.remove(rmEle)

            self.redis.hSet(name='syncGroups', key=self.userId,
                            data=syncGroupV, packed=True)

            # -----------------------------------------------------------------------------------------------------------
            # remove this session from the general registry
            # -----------------------------------------------------------------------------------------------------------
            self.cleanupSession(self.sessId)

            # -----------------------------------------------------------------------------------------------------------
            # cleanup possible threads belonging to this specific session
            # -----------------------------------------------------------------------------------------------------------
            self.clearThreadsByType(self.sessName)

        self.syncGroupUpdate()

        self.on_leaveSession_()

        return

    # -----------------------------------------------------------------------------------------------------------
    # placeholder for overloaded method, to be run as part of on_joinSession
    # -----------------------------------------------------------------------------------------------------------
    def on_joinSession_(self):
        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def cleanupSession(self, sessId=None):
        if sessId is None:
            return
        self.log.info([
            ['b', ' - cleanupSession sessionId(', mySock.serverName, ') '], ['p', sessId]
        ])

        userIdV = self.redis.lGet('userIds')
        widgetIdV = self.redis.lGet('sessWidgetV;'+sessId)

        for userId in userIdV:
            self.redis.lRem(name='userSessIds;'+userId, data=sessId)

        for widgetId in widgetIdV:
            self.log.info([
                ['b', ' - cleanupSession widgetId (', mySock.serverName, ') '],
                ['p', widgetId]
            ])

            self.redis.hDel(name='widgetV', key=widgetId)
            if widgetId in mySock.widgetInitV:
                mySock.widgetInitV.pop(widgetId, None)
            for userId in userIdV:
                self.redis.lRem(name='userWidgetV;'+userId, data=widgetId)

        self.redis.delete('sessWidgetV;'+sessId)
        self.redis.delete('sessHeartbeat;'+sessId)
        self.redis.lRem(name='allSessIds', data=sessId)

        if sessId in mySock.sessToEndpointD:
            mySock.sessToEndpointD.pop(sessId, None)

        return

    # -----------------------------------------------------------------------------------------------------------
    # renew session heartbeat token (run in thread) for all active sessions
    # -----------------------------------------------------------------------------------------------------------
    def sessHeartbeat(self, threadId):
        self.log.info([
            ['y', " - starting commonThread("],
            ['g', "sessHeartbeat"], ['y', ") - ", mySock.serverName]
        ])
        sleep(3)

        sleepTime = max(ceil(mySock.sessExpire*0.1), 10)
        sessExpire = int(max(mySock.sessExpire, sleepTime*2))

        while (threadId == self.getThreadId("commonThread", "sessHeartbeat")):
            with mySock.lock:
                sessIdV = self.redis.lGet('allSessIds')
                sessIdV = [
                    x for x in sessIdV if x in self.socket.server.sockets]

                for sessId in sessIdV:
                    if self.redis.exists('sessHeartbeat;'+sessId):
                        self.redis.expire(
                            name='sessHeartbeat;'+sessId, expire=sessExpire)
                    else:
                        self.cleanupSession(sessId)

            sleep(sleepTime)

        self.log.info([
            ['y', " - ending commonThread("], ['g', "sessHeartbeat"]
        ])

        return

    # -----------------------------------------------------------------------------------------------------------
    # cleanup (run in thread) for all the bookkeeping elements
    # -----------------------------------------------------------------------------------------------------------
    def cleanup(self, threadId):
        self.log.info([
            ['y', " - starting commonThread("],
            ['g', "cleanup"], ['y', ") - ", mySock.serverName]
        ])
        sleep(3)

        while (threadId == self.getThreadId("commonThread", "cleanup")):
            with mySock.lock:
                userIdV = self.redis.lGet('userIds')
                sessIdV = self.redis.lGet('allSessIds')

                for sessId in sessIdV:
                    if not self.redis.exists('sessHeartbeat;'+sessId):
                        self.cleanupSession(sessId)

                sessIdV = self.redis.lGet('allSessIds')
                for userId in userIdV:
                    sessIds = self.redis.lGet('userSessIds;'+userId)
                    zombieIds = [x for x in sessIds if x not in sessIdV]
                    for sessId in zombieIds:
                        self.redis.lRem(name='userSessIds;' +
                                        userId, data=sessId)

                    # just in case, cleanup any remaining widgets
                    if len(sessIds) == len(zombieIds):
                        widgetIdV = self.redis.lGet('userWidgetV;'+userId)
                        for widgetId in widgetIdV:
                            self.redis.hDel(name='widgetV', key=widgetId)
                            if widgetId in mySock.widgetInitV:
                                mySock.widgetInitV.pop(widgetId, None)

                        self.redis.delete('userSessIds;'+userId)
                        self.redis.delete('userWidgetV;'+userId)
                        self.redis.hDel(name='activeWidget', key=userId)
                        self.redis.lRem(name='userIds', data=userId)

                if not self.redis.exists('userIds'):
                    break

            sleep(mySock.cleanupSleep)

        self.clearThreadsByType('commonThread')
        # self.setThreadState("commonThread", "cleanup", False)
        # self.setThreadState("commonThread", "sessHeartbeat", False)
        # self.setThreadState("commonThread", "pubSubSocketEvtWidgetV", False)

        self.log.info([['y', " - ending commonThread("], ['g', "cleanup"]])

        return
