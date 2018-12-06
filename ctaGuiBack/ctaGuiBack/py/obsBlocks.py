import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
import random
from random import Random
import time
import copy
from datetime import timedelta
from datetime import datetime

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import myLog, Assert, getTime, noSubArrName, hasACS
from ctaGuiUtils.py.utils_redis import redisManager
from mockSched import mockSched

if hasACS:
    from Acspy.Clients.SimpleClient import PySimpleClient
    import sb
    import jsonAcs

    # template = jsonAcs.classFactory.defaultValues[sb.ObservationBlock]
    # # template = jsonAcs.classFactory.defaultValues[sb.SchedulingBlock]
    # template = jsonAcs.encode(template)
    # print template


# -----------------------------------------------------------------------------------------------------------
#
# -----------------------------------------------------------------------------------------------------------
class obsBlocks():
    def __init__(self, nsType, timeOfNight):
        self.log = myLog(title=__name__)
        self.log.info([['y', " - obsBlocks - "], ['g', nsType]])

        self.nsType = nsType

        self.timeOfNight = timeOfNight

        self.className = self.__class__.__name__
        self.redis = redisManager(name=self.className, log=self.log)

        self.debug = not True
        self.expire = 86400  # one day
        # self.expire = 5

        self.mockSched = None

        # self.client = PySimpleClient()
        # self.supervisor = self.client.getComponent("ArraySupervisor")
        # self.log.info([['y'," - obsBlocks - "],['p','got supervisor!']])

        self.exePhases = dict()
        self.exePhases["start"] = ["run_config_mount",
                                   "run_config_camera", "run_config_daq", "run_config_mirror"]
        self.exePhases["during"] = ["run_takeData"]
        self.exePhases["finish"] = ["run_finish_mount",
                                    "run_finish_camera", "run_finish_daq"]

        self.loopSleep = 3

        rndSeed = getTime()
        # rndSeed = 10987268332
        self.rndGen = Random(rndSeed)

        gevent.spawn(self.loop)

        self.mockSched = mockSched(nsType=nsType, timeOfNight=self.timeOfNight)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def resetBlocks(self):
        debugTmp = not True
        if debugTmp:
            self.log.info([['p', " - obsBlocks.resetBlocks() ..."]])

        if self.mockSched is None:
            sleep(0.5)
            self.log.debug([
                ['r', " - no mockSched ... will try to resetBlocks() again ..."]
            ])
            self.resetBlocks()
            return

        schBlocks = self.mockSched.getBlocks()

        obsBlockIds = dict()
        obsBlockIds['wait'] = []
        obsBlockIds['run'] = []
        obsBlockIds['done'] = []
        obsBlockIds['cancel'] = []
        obsBlockIds['fail'] = []

        blocksRun = []
        active = schBlocks['active']

        for schedBlkId, schBlock in schBlocks['blocks'].iteritems():

            subArrayTels = schBlock['schedBlock'].config.instrument.sub_array.telescopes
            telIds = [x.id for x in subArrayTels]

            obsBlocks = schBlock['schedBlock'].observation_blocks

            for nObsBlockNow in range(len(obsBlocks)):
                obsBlockNow = obsBlocks[nObsBlockNow]
                obsBlockId = obsBlockNow.id
                trgId = obsBlockNow.src.id
                coords = obsBlockNow.src.coords.horizontal
                trgPos = [coords.az, coords.alt]

                obsBlockJson = jsonAcs.encode(obsBlockNow)

                timeStamp = schBlocks['metaData'][obsBlockId]["timeStamp"]
                metaData = schBlocks['metaData'][obsBlockId]["metaData"]

                pntPos = schBlocks['metaData'][obsBlockId]["pntPos"]
                status = schBlocks['metaData'][obsBlockId]["status"]
                phases = schBlocks['metaData'][obsBlockId]["phases"]
                duration = schBlocks['metaData'][obsBlockId]["duration"]
                startTime_planed = schBlocks['metaData'][obsBlockId]["startTime_planed"]
                startTime_executed = schBlocks['metaData'][obsBlockId]["startTime_executed"]

                startTime = startTime_planed if startTime_executed is None else startTime_executed

                if trgPos[0] > 180:
                    trgPos[0] -= 360
                if trgPos[0] < -180:
                    trgPos[0] += 360
                if pntPos[0] > 180:
                    pntPos[0] -= 360
                if pntPos[0] < -180:
                    pntPos[0] += 360

                # state of ob
                if status == sb.OB_PENDING:
                    state = 'wait'
                elif status == sb.OB_RUNNING:
                    state = 'run'
                elif status == sb.OB_CANCELED:
                    state = 'cancel'
                elif status == sb.OB_FAILED:
                    state = 'fail'
                else:
                    state = 'done'

                # final sanity check
                if state == 'run' and schedBlkId not in active:
                    state = 'done'

                # if debugTmp:
                #     for p in phases:
                #         self.log.debug([
                #             ['y', " -- phases - ", schedBlkId, ' ', obsBlockId, ' '],
                #             ['p', status, ' '],
                #             [
                #                 'g', p.heartbeat_counter, ' ', p.name,
                #                 ' ', p.status, ' ', p.progress_message
                #             ]
                #         ])

                runPhase = []
                if state == 'run':
                    for p in phases:
                        if p.status == sb.OB_RUNNING:
                            phaseName = 'run_'+p.name
                            for exePhases in self.exePhases:
                                if phaseName in self.exePhases[exePhases]:
                                    runPhase.append(phaseName)

                    if debugTmp:
                        self.log.debug(
                            [['b', " -- runPhase - "], ['y', runPhase, ' '], ['b', telIds]])

                canRun = True
                if state == 'cancel' or state == 'fail':
                    canRun = (self.timeOfNight.getCurrentTime() >= startTime)

                exeState = {'state': state, 'canRun': canRun}

                # if not canRun or state == 'cancel' or state == 'fail':
                #     print 'cant run:', canRun, schedBlkId, obsBlockId, state, [
                #         self.timeOfNight.getCurrentTime(), startTime]

                block = dict()
                block["sbId"] = schedBlkId
                block["obId"] = obsBlockId
                block["metaData"] = metaData
                block["timeStamp"] = timeStamp
                block["startTime"] = startTime
                block["endTime"] = startTime+duration
                block["duration"] = duration
                block["telIds"] = telIds
                block["targetId"] = trgId
                block["targetName"] = trgId
                block["targetPos"] = trgPos
                block["pointingId"] = schedBlkId+"_"+obsBlockId
                block["pointingName"] = block["targetName"] + \
                    "/p_"+str(nObsBlockNow)
                block["pointingPos"] = pntPos
                block["exeState"] = exeState
                block["runPhase"] = runPhase
                # block["fullObsBlock"] = obsBlockJson

                if state == 'run':
                    blocksRun += [block]

                obsBlockIds[state].append(obsBlockId)

                self.redis.pipe.set(name=obsBlockId, data=block,
                                    expire=self.expire, packed=True)

        self.redis.pipe.set(name='obsBlockIds_'+'wait',
                            data=obsBlockIds['wait'], packed=True)
        self.redis.pipe.set(name='obsBlockIds_'+'run',
                            data=obsBlockIds['run'], packed=True)
        self.redis.pipe.set(name='obsBlockIds_'+'done',
                            data=obsBlockIds['done'], packed=True)
        self.redis.pipe.set(name='obsBlockIds_'+'cancel',
                            data=obsBlockIds['cancel'], packed=True)
        self.redis.pipe.set(name='obsBlockIds_'+'fail',
                            data=obsBlockIds['fail'], packed=True)

        self.redis.pipe.execute()

        self.updateSubArrs(blocks=blocksRun)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def updateSubArrs(self, blocks=None):
        # telPos = self.redis.hGetAll(name="telPos")

        if blocks is None:
            obsBlockIds = self.redis.get(
                name=('obsBlockIds_'+'run'), packed=True, defVal=[])
            for obId in obsBlockIds:
                self.redis.pipe.get(obId)

            blocks = self.redis.pipe.execute(packed=True)

        # sort so last is first in the list (latest sub-array defined gets the telescope)
        blocks = sorted(blocks, cmp=lambda a, b: int(
            b['timeStamp']) - int(a['timeStamp']))
        # print [a['timeStamp'] for a in blocks]

        subArrs = []
        allTelIdsIn = []
        for nBlock in range(len(blocks)):
            blkTelIds = blocks[nBlock]["telIds"]
            pntId = blocks[nBlock]["pointingId"]
            pntN = blocks[nBlock]["pointingName"]

            # compile the telescope list for this block
            telV = []
            for idNow in blkTelIds:
                if idNow not in allTelIdsIn:
                    allTelIdsIn.append(idNow)
                    telV.append({"id": idNow})

            # add the telescope list for this block
            subArrs.append({
                "id": pntId, "N": pntN, "children": telV
            })

        # -----------------------------------------------------------------------------------------------------------
        # now take care of all free telescopes
        # -----------------------------------------------------------------------------------------------------------
        telV = []
        allTelIds = [x for x in utils.telIds if x not in allTelIdsIn]
        for idNow in allTelIds:
            telV.append({"id": idNow})

        subArrs.append({
            "id": noSubArrName, "children": telV
        })

        # -----------------------------------------------------------------------------------------------------------
        # for now - a simple/stupid solution, where we write the sub-arrays and publish each
        # time, even if the content is actually the same ...
        # -----------------------------------------------------------------------------------------------------------
        self.redis.set(name='subArrs', data=subArrs, packed=True)
        self.redis.publish(channel="subArrs")

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting obsBlocks.loop ..."]])

        self.redis.pipe.set(name='obsBlockIds_'+'wait', data='')
        self.redis.pipe.set(name='obsBlockIds_'+'run', data='')
        self.redis.pipe.set(name='obsBlockIds_'+'done', data='')
        self.redis.pipe.set(name='obsBlockIds_'+'cancel', data='')
        self.redis.pipe.set(name='obsBlockIds_'+'fail', data='')

        self.redis.pipe.execute()

        self.updateSubArrs(blocks=[])

        while True:
            self.resetBlocks()

            sleep(self.loopSleep)

        return


# -----------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------
class obsBlocks_noACS():
    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def __init__(self, nsType, timeOfNight):
        self.log = myLog(title=__name__)
        self.log.info([['y', " - obsBlocks_noACS - "], ['g', nsType]])

        self.nsType = nsType

        self.timeOfNight = timeOfNight

        self.className = self.__class__.__name__
        self.redis = redisManager(name=self.className, log=self.log)

        self.debug = not True
        self.expire = 86400  # one day
        # self.expire = 5

        # -----------------------------------------------------------------------------------------------------------
        #
        # -----------------------------------------------------------------------------------------------------------
        self.maxNobsBlock = 4 if self.nsType == "N" else 7
        self.maxNobsBlock = min(self.maxNobsBlock, floor(len(utils.telIds)/4))
        self.loopSleep = 4

        self.maxNcycles = 100
        self.minNschedBlock = 2
        self.maxNschedBlock = 5
        self.minNobsBlock = 1
        self.maxNobsBlock = 5
        self.minNtelBlock = 4
        self.maxNfreeTels = 5

        self.nInitCycle = -1
        self.namePrefix = str(getTime())
        if len(self.namePrefix) > 6:
            self.namePrefix = self.namePrefix[len(self.namePrefix)-6:]

        self.azMinMax = [-180, 180]
        self.zenMinMaxTel = [0, 70]
        self.zenMinMaxPnt = [0, 20]

        self.exePhases = dict()
        self.exePhases["start"] = ["run_config_mount",
                                   "run_config_camera", "run_config_DAQ", "run_config_mirror"]
        self.exePhases["during"] = ["run_takeData"]
        self.exePhases["finish"] = ["run_finish_mount",
                                    "run_finish_camera", "run_finish_clenaUp"]

        self.errorRndFrac = dict()
        self.errorRndFrac["E1"] = 0.3
        self.errorRndFrac["E2"] = 0.4
        self.errorRndFrac["E3"] = 0.5
        self.errorRndFrac["E4"] = 0.6
        self.errorRndFrac["E5"] = 0.7
        self.errorRndFrac["E6"] = 0.8
        self.errorRndFrac["E7"] = 0.9
        self.errorRndFrac["E8"] = 1

        self.phaseRndFrac = dict()
        self.phaseRndFrac["start"] = 0.29
        self.phaseRndFrac["finish"] = 0.1
        self.phaseRndFrac["cancel"] = 0.2
        self.phaseRndFrac["fail"] = 0.41
        self.loopSleep = 2

        self.obsBlockDuration = 1800 # timedelta(weeks = 0, days = 0, hours = 0, minutes = 30 * self.timeOfNight.getTimeScale(), seconds = 0, milliseconds = 0, microseconds = 0)  # 1800 = 30 minutes

        self.timeOfNight.resetNight()
        # self.durationScale = self.timeOfNight.getTimeScale() #  0.035 -> one
        # minute instead of 30 for gui testing
        self.durationNight = self.timeOfNight.getTotalTime()  # 28800 -> 8 hour night
        self.prevResetTime = self.timeOfNight.getResetTime()

        rndSeed = getTime()
        # rndSeed = 10987268332
        self.rndGen = Random(rndSeed)

        self.external_clockEvents = []
        self.external_generateClockEvents()

        self.init()

        gevent.spawn(self.loop)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def init(self):
        self.log.info([['p', " - obsBlocks_noACS.init() ..."]])
        debugTmp = not True

        self.exePhase = dict()
        self.allBlocks = []
        self.external_events = []

        self.timeOfNight.resetNight()
        self.prevResetTime = self.timeOfNight.getResetTime()
        # startTime = self.timeOfNight.getStartTime()
        self.nInitCycle += 1

        isCycleDone = False
        nCycleNow = 0
        nSchedBlocks = -1
        totBlockDuration = 0
        maxBlockDuration = self.durationNight - self.obsBlockDuration
        overheadDuration = self.obsBlockDuration * 0.05 # timedelta(seconds = 90 * 0.05 * self.timeOfNight.getTimeScale()) # self.obsBlockDuration * 0.05

        targetsIds = self.redis.get(name='targetsIds', packed=True, defVal=[])
        # for obId in obsBlockIds:
        #     self.redis.pipe.get(obId)

        while totBlockDuration < maxBlockDuration and \
                nCycleNow < self.maxNcycles and \
                not isCycleDone:

            baseName = self.namePrefix+"_" + \
                str(self.nInitCycle)+"_"+str(nCycleNow)+"_"
            nCycleNow += 1

            telIds = copy.deepcopy(utils.telIds)
            nTels = len(telIds)
            # choose number of Scheduling blocks for this part of night (while loop)-----------------------------------------------------
            nSchedBlks = min(floor(nTels/self.minNtelBlock),
                             self.maxNschedBlock)
            nSchedBlks = max(self.rndGen.randint(
                1, nSchedBlks), self.minNschedBlock)
            # ------------------------------------------------------------------------------------------------------
            if debugTmp:
                print '-------------------------------------------------------------------------'
                print ('- nCycleNow', nCycleNow, 'totBlockDuration / percentage:',
                       totBlockDuration, (totBlockDuration/self.durationNight))

            trgPos = dict()

            totSchedBlockDuration = []

            # -----------------------------------------------------------------------------------------------------------
            #
            # -----------------------------------------------------------------------------------------------------------
            for nSchedNow in range(nSchedBlks):
                schedBlockId = "schBlock_"+baseName+str(nSchedNow)

                nSchedBlocks += 1

                if nSchedNow < nSchedBlks-1:
                    nTelNow = max(self.minNtelBlock, len(telIds) - nSchedBlks)
                    nTelNow = self.rndGen.randint(self.minNtelBlock, nTelNow)
                    nTelNow = min(nTelNow, len(telIds))
                else:
                    nTelNow = len(telIds) - \
                        self.rndGen.randint(0, self.maxNfreeTels)
                if nTelNow < self.minNtelBlock:
                    continue

                # choose some tels in available ones
                schedTelIds = random.sample(telIds, nTelNow)
                # and remove them from allTels list
                telIds = [x for x in telIds if x not in schedTelIds]
                # choose the number of obsBlock inside this schedBlocks
                nObsBlocks = self.rndGen.randint(
                    self.minNobsBlock, self.maxNobsBlock)


                # nTrg = nSchedNow
                #
                # if not nTrg in trgPos:
                #     trgPos[nTrg] = [
                #         (self.rndGen.random() *
                #          (self.azMinMax[1] - self.azMinMax[0])) + self.azMinMax[0],
                #         (self.rndGen.random(
                #         ) * (self.zenMinMaxTel[1] - self.zenMinMaxTel[0])) + self.zenMinMaxTel[0]
                #     ]

                if debugTmp:
                    print ' -- nSchedNow / nTelNow:', nSchedNow, nTelNow, '-------', schedBlockId

                totObsBlockDuration = 0
                obsBlockStartTime = totBlockDuration

                idIndex = (obsBlockStartTime / (self.durationNight / len(targetsIds))) + 0.75
                idIndex = int(idIndex + ((self.rndGen.random() - 0.5) * 2))
                idIndex = min(max(0, idIndex), len(targetsIds) -1)

                targetId = targetsIds[idIndex]
                print targetId
                target = self.redis.get(name=targetId, packed=True, defVal={})

                for nObsNow in range(nObsBlocks):
                    obsBlockId = "obsBlock_"+baseName + \
                        str(nSchedNow)+"_"+str(nObsNow)

                    self.exePhase[obsBlockId] = ""

                    rnd = self.rndGen.random()
                    obsBlockDuration = self.obsBlockDuration
                    if rnd < 0.05:
                        obsBlockDuration /= 1.8
                    elif rnd < 0.3:
                        obsBlockDuration /= 1.5
                    elif rnd < 0.5:
                        obsBlockDuration /= 1.1
                    obsBlockDuration = int(floor(obsBlockDuration)) # timedelta(seconds = obsBlockDuration)

                    if obsBlockStartTime + obsBlockDuration > self.durationNight:
                        isCycleDone = True
                        if debugTmp:
                            print (' - isCycleDone - nObsNow / startTime / duration:',
                                   nObsNow, obsBlockStartTime, obsBlockDuration)
                        break

                    # integrated time for all obs blocks within this sched block
                    totObsBlockDuration += obsBlockDuration

                    pntPos = copy.deepcopy(target["pos"])
                    pntPos[0] += (self.rndGen.random() - 0.5) * 10
                    pntPos[1] += (self.rndGen.random() - 0.5) * 10

                    if pntPos[0] > self.azMinMax[1]:
                        pntPos[0] -= 360
                    elif pntPos[0] < self.azMinMax[0]:
                        pntPos[0] += 360

                    if debugTmp:
                        print ' --- nObsNow / startTime / duration:', \
                            nObsNow, obsBlockStartTime, obsBlockDuration, '-------', obsBlockId

                    exeState = {'state': "wait", 'canRun': True}
                    metaData = {'nSched': nSchedBlocks, 'nObs': nObsNow,
                                'blockName': str(nSchedBlocks)+" ("+str(nObsNow)+")"}
                    block = dict()
                    block["sbId"] = schedBlockId
                    block["obId"] = obsBlockId
                    block["metaData"] = metaData
                    block["timeStamp"] = getTime()
                    block["telIds"] = schedTelIds
                    # block["startTime"] = obsBlockStartTime.strftime("%Y-%m-%d %H:%M:%S")
                    # block["duration"] = (obsBlockDuration-overheadDuration).total_seconds()
                    # block["endTime"] = (obsBlockStartTime+(obsBlockDuration-overheadDuration)).strftime("%Y-%m-%d %H:%M:%S")
                    block["startTime"] = obsBlockStartTime
                    block["duration"] = obsBlockDuration-overheadDuration
                    block["endTime"] = block["startTime"]+block["duration"]
                    block["exeState"] = exeState
                    block["runPhase"] = []
                    block["targetId"] = targetId
                    block["targetName"] = targetId
                    block["targetPos"] = target["pos"]
                    block["pointingId"] = schedBlockId+"_"+obsBlockId
                    block["pointingName"] = block["targetName"] + \
                        "/p_"+str(nObsNow)
                    block["pointingPos"] = pntPos
                    # block["fullObsBlock"] = self.getObsBlockTemplate()
                    self.redis.pipe.set(
                        name=block["obId"], data=block, expire=self.expire, packed=True)

                    self.allBlocks.append(block)

                    obsBlockStartTime += obsBlockDuration

                # list of duration of all sched blocks within this cycle
                if totObsBlockDuration >  0: # timedelta(seconds = 0):
                    totSchedBlockDuration += [totObsBlockDuration]
            # -----------------------------------------------------------------------------------------------------------

            # the maximal duration of all blocks within this cycle
            totBlockDuration += max(totSchedBlockDuration)

        self.redis.pipe.set(name="external_events", data=self.external_events, packed=True)
        self.redis.pipe.set(name="external_clockEvents", data=self.external_clockEvents, packed=True)

        self.redis.pipe.execute()

        self.updateExeStatusLists()

        return

    # -----------------------------------------------------------------------------------------------------------
    # temporary hardcoded dict......
    # -----------------------------------------------------------------------------------------------------------

    def getObsBlockTemplate(self):
        # generated with:
        #   print jsonAcs.encode(jsonAcs.classFactory.defaultValues[sb.ObservationBlock])

        template = {
            "py/object": "sb.ObservationBlock",
            "src": {
                "py/object": "sb.Source",
                "proposal_priority": {
                    "py/object": "sb.High"
                },
                "proposal_type": {
                    "py/object": "sb.placeholder"
                },
                "region_of_interest": {
                    "py/object": "sb.RegionOfInterest",
                    "circle_radius": 100
                },
                "coords": {
                    "py/object": "sb.Coordinates",
                    "equatorial": {
                        "py/object": "sb.EquatorialCoordinates",
                        "dec": 4,
                        "ra": 2
                    }
                },
                "id": "source",
                "observing_mode": {
                    "py/object": "sb.ObservingMode",
                    "slewing_": {
                        "py/object": "sb.Slewing",
                        "take_data": 1
                    },
                    "observing_type": {
                        "py/object": "sb.ObservingType",
                        "wobble_": {
                            "py/object": "sb.Wobble",
                            "angle": 1,
                            "offset": 1
                        }
                    }
                }
            },
            "observing_conditions": {
                "py/object": "sb.ObservingConditions",
                "quality_": {
                    "py/object": "sb.Quality",
                    "illumination": 1,
                    "min_nsb_range": 1,
                    "max_nsb_range": 1
                },
                "start_time": {
                    "py/object": "sb.DateTime",
                    "placeholder": 1
                },
                "weather_": {
                    "py/object": "sb.Weather",
                    "wind_speed": 1,
                    "precision_pointing": 1,
                    "cloudiness": 1,
                    "humidity": 1
                },
                "duration": 0,
                "tolerance": 1
            },
            "max_script_duration": 0,
            "script_id": "script_id",
            "id": "ob_id"
        }

        return template

    # -----------------------------------------------------------------------------------------------------------
    # move one from wait to run
    # -----------------------------------------------------------------------------------------------------------

    def waitToRun(self):
        timeNow = self.timeOfNight.getCurrentTime()

        # move to run state
        # -----------------------------------------------------------------------------------------------------------
        waitV = [x for x in self.allBlocks if x['exeState']['state'] == 'wait']

        hasChange = False
        for block in waitV:
            if timeNow < block["startTime"] - self.loopSleep: # datetime.strptime(block["startTime"], "%Y-%m-%d %H:%M:%S"): # - deltatime(self.loopSleep):
                continue

            block['exeState']['state'] = "run"

            self.exePhase[block["obId"]] = "start"
            block['runPhase'] = copy.deepcopy(self.exePhases["start"])

            hasChange = True
            self.redis.pipe.set(
                name=block["obId"], data=block, expire=self.expire, packed=True)

        if hasChange:
            self.redis.pipe.execute()

            # -----------------------------------------------------------------------------------------------------------
            # check for blocks which cant begin as their time is already past
            # -----------------------------------------------------------------------------------------------------------
            waitV = [x for x in self.allBlocks if x['exeState']
                     ['state'] == 'wait']

            hasChange = False
            for block in waitV:
                # # adjust the starting/ending time
                # block["endTime"] = block["startTime"] + block["duration"]

                if timeNow >= block["endTime"] or (self.rndGen.random() < self.phaseRndFrac["cancel"] * 0.1): # datetime.strptime(block["endTime"], "%Y-%m-%d %H:%M:%S") or (self.rndGen.random() < self.phaseRndFrac["cancel"] * 0.1):
                    block['exeState']['state'] = "cancel"
                    if self.rndGen.random() < self.errorRndFrac["E1"]:
                        block['exeState']['error'] = "E1"
                    elif self.rndGen.random() < self.errorRndFrac["E2"]:
                        block['exeState']['error'] = "E2"
                    elif self.rndGen.random() < self.errorRndFrac["E3"]:
                        block['exeState']['error'] = "E3"
                    elif self.rndGen.random() < self.errorRndFrac["E4"]:
                        block['exeState']['error'] = "E4"
                    elif self.rndGen.random() < self.errorRndFrac["E8"]:
                        block['exeState']['error'] = "E8"
                    block['exeState']['canRun'] = False
                    block['runPhase'] = []

                    self.exePhase[block["obId"]] = ""

                    hasChange = True
                    self.redis.pipe.set(
                        name=block["obId"], data=block, expire=self.expire, packed=True)

            if hasChange:
                self.redis.pipe.execute()

        return

    # -----------------------------------------------------------------------------------------------------------
    # progress run phases
    # -----------------------------------------------------------------------------------------------------------
    def runPhases(self):
        timeNow = self.timeOfNight.getCurrentTime()

        # runV = [ x for x in self.allBlocks if self.exePhase[x["obId"]] != "" ]
        # print [ x['obId'] for x in runV]
        # if len(runV) == 0:
        #   return

        # # runV = [ x for x in self.allBlocks if x['exeState']['state'] == 'run' ]
        # # nDone = 0
        # # for block in runV:
        # #   if self.exePhase[block["obId"]] == "":
        # #     nDone += 1
        # # if nDone == len(runV):
        # #   return

        runV = [x for x in self.allBlocks if x['exeState']['state'] == 'run']

        hasChange = False
        for block in runV:
            phase = self.exePhase[block["obId"]]
            if phase == "":
                continue

            for phaseNow in self.exePhases[phase]:
                if phaseNow in block['runPhase']:

                    if phaseNow in self.exePhases['start']:
                        isDone = (self.rndGen.random() <
                                  self.phaseRndFrac['start'])
                        # if isDone:
                        #   block["endTime"] = block["startTime"] + block["duration"]

                    elif phaseNow in self.exePhases["during"]:
                        isDone = (
                            timeNow >= (block["endTime"] -
                                        block["duration"] * self.phaseRndFrac['finish']))# (datetime.strptime(block["endTime"], "%Y-%m-%d %H:%M:%S") - timedelta(seconds = int(block["duration"]) * self.phaseRndFrac['finish'])))

                    else:
                        isDone = (timeNow >= block["endTime"]) # isDone = (timeNow >= datetime.strptime(block["endTime"], "%Y-%m-%d %H:%M:%S"))

                    if isDone:
                        block['runPhase'].remove(phaseNow)
                    # print isDone,block['runPhase']

            if len(block['runPhase']) == 0:
                nextPhase = ""
                if phase == "start":
                    nextPhase = "during"
                elif phase == "during":
                    nextPhase = "finish"

                if nextPhase in self.exePhases:
                    block['runPhase'] = copy.deepcopy(
                        self.exePhases[nextPhase])

                self.exePhase[block["obId"]] = nextPhase

            hasChange = True
            self.redis.pipe.set(
                name=block["obId"], data=block, expire=self.expire, packed=True)

        if hasChange:
            self.redis.pipe.execute()

        return

    # -----------------------------------------------------------------------------------------------------------
    # move one from run to done
    # -----------------------------------------------------------------------------------------------------------
    def runToDone(self):
        timeNow = self.timeOfNight.getCurrentTime()

        runV = [x for x in self.allBlocks if x['exeState']['state'] == 'run']

        hasChange = False
        for block in runV:
            if  timeNow < block["endTime"]: #timeNow < datetime.strptime(block["endTime"], "%Y-%m-%d %H:%M:%S"):
                continue

            if self.rndGen.random() < self.phaseRndFrac["cancel"]:
                block['exeState']['state'] = "cancel"
                if self.rndGen.random() < self.errorRndFrac["E1"]:
                    block['exeState']['error'] = "E1"
                elif self.rndGen.random() < self.errorRndFrac["E2"]:
                    block['exeState']['error'] = "E2"
                elif self.rndGen.random() < self.errorRndFrac["E3"]:
                    block['exeState']['error'] = "E3"
                elif self.rndGen.random() < self.errorRndFrac["E4"]:
                    block['exeState']['error'] = "E4"
                elif self.rndGen.random() < self.errorRndFrac["E8"]:
                    block['exeState']['error'] = "E8"
            elif self.rndGen.random() < self.phaseRndFrac["fail"]:
                block['exeState']['state'] = "fail"
                if self.rndGen.random() < self.errorRndFrac["E1"]:
                    block['exeState']['error'] = "E1"
                elif self.rndGen.random() < self.errorRndFrac["E2"]:
                    block['exeState']['error'] = "E2"
                elif self.rndGen.random() < self.errorRndFrac["E3"]:
                    block['exeState']['error'] = "E3"
                elif self.rndGen.random() < self.errorRndFrac["E4"]:
                    block['exeState']['error'] = "E4"
                elif self.rndGen.random() < self.errorRndFrac["E8"]:
                    block['exeState']['error'] = "E8"
            else:
                block['exeState']['state'] = "done"

            block['runPhase'] = []

            hasChange = True
            self.redis.pipe.set(
                name=block["obId"], data=block, expire=self.expire, packed=True)

            self.exePhase[block["obId"]] = ""

        if hasChange:
            self.redis.pipe.execute()

        return

    # -----------------------------------------------------------------------------------------------------------
    # update the exeStatus lists in redis
    # -----------------------------------------------------------------------------------------------------------
    def updateExeStatusLists(self):
        blocksRun = []
        blockIds = {"wait": [], "run": [],
                    "done": [], "cancel": [], "fail": []}

        for block in self.allBlocks:
            obId = block['obId']
            exeState = block['exeState']['state']

            if self.redis.exists(obId):
                blockIds[exeState].append(obId)

                if exeState == "run":
                    blocksRun += [block]

        for key, val in blockIds.iteritems():
            self.redis.pipe.set(name='obsBlockIds_'+key, data=val, packed=True)

        self.redis.pipe.execute()

        self.updateSubArrs(blocksRun)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def updateSubArrs(self, blocks=None):
        # telPos = self.redis.hGetAll(name="telPos")

        if blocks is None:
            obsBlockIds = self.redis.get(
                name=('obsBlockIds_'+'run'), packed=True, defVal=[])
            for obId in obsBlockIds:
                self.redis.pipe.get(obId)

            blocks = self.redis.pipe.execute(packed=True)

        #
        subArrs = []
        allTelIds = copy.deepcopy(utils.telIds)

        for nBlock in range(len(blocks)):
            blkTelIds = blocks[nBlock]["telIds"]
            pntId = blocks[nBlock]["pointingId"]
            pntN = blocks[nBlock]["pointingName"]

            # compile the telescope list for this block
            telV = []
            for idNow in blkTelIds:
                telV.append({"id": idNow})

                if idNow in allTelIds:
                    allTelIds.remove(idNow)

            # add the telescope list for this block
            subArrs.append({
                "id": pntId, "N": pntN, "children": telV
            })

        # -----------------------------------------------------------------------------------------------------------
        # now take care of all free telescopes
        # -----------------------------------------------------------------------------------------------------------
        telV = []
        for idNow in allTelIds:
            telV.append({"id": idNow})

        subArrs.append({
            "id": noSubArrName, "children": telV
        })

        # -----------------------------------------------------------------------------------------------------------
        # for now - a simple/stupid solution, where we write the sub-arrays and publish each
        # time, even if the content is actually the same ...
        # -----------------------------------------------------------------------------------------------------------
        self.redis.set(name='subArrs', data=subArrs, packed=True)
        self.redis.publish(channel="subArrs")

        return

    def external_generateEvents(self):
        if self.rndGen.random() < 0.2:
            newEvent = {'id': getTime() + random.randint(1, 99999), 'time': self.timeOfNight.getCurrentTime(), 'date': self.timeOfNight.getCurrentDate().strftime("%Y-%m-%d %H:%M:%S")}
            newEvent['priority'] = random.randint(1, 3)
            if self.rndGen.random() < 0.33:
                newEvent['name'] = 'alarm'
            elif self.rndGen.random() < 0.66:
                newEvent['name'] = 'grb'
            elif self.rndGen.random() < 1:
                newEvent['name'] = 'hardware'
            self.external_events.append(newEvent)
        self.redis.pipe.set(name="external_events", data=self.external_events, packed=True)

    def external_generateClockEvents(self):
        newEvent = {}
        newEvent['start_date'] = datetime(2018, 9, 16, 21, 42).strftime("%Y-%m-%d %H:%M:%S")
        newEvent['end_date'] = ''
        newEvent['icon'] = 'moon.svg'
        newEvent['name'] = 'Moonrise'
        newEvent['comment'] = ''
        newEvent['id'] = 'CE' + str(self.rndGen.randint(0, 100000000))
        self.external_clockEvents.append(newEvent)

        newEvent = {}
        newEvent['start_date'] = datetime(2018, 9, 16, 23, 07).strftime("%Y-%m-%d %H:%M:%S")
        newEvent['end_date'] = datetime(2018, 9, 17, 4, 30).strftime("%Y-%m-%d %H:%M:%S")
        newEvent['icon'] = 'rain.svg'
        newEvent['name'] = 'Raining'
        newEvent['comment'] = ''
        newEvent['id'] = 'CE' + str(self.rndGen.randint(0, 100000000))
        self.external_clockEvents.append(newEvent)

        newEvent = {}
        newEvent['start_date'] = datetime(2018, 9, 17, 1, 03).strftime("%Y-%m-%d %H:%M:%S")
        newEvent['end_date'] = datetime(2018, 9, 17, 2, 00).strftime("%Y-%m-%d %H:%M:%S")
        newEvent['icon'] = 'storm.svg'
        newEvent['name'] = 'Storm'
        newEvent['comment'] = ''
        newEvent['id'] = 'CE' + str(self.rndGen.randint(0, 100000000))
        self.external_clockEvents.append(newEvent)

        newEvent = {}
        newEvent['start_date'] = datetime(2018, 9, 17, 1, 28).strftime("%Y-%m-%d %H:%M:%S")
        newEvent['end_date'] = datetime(2018, 9, 17, 2, 30).strftime("%Y-%m-%d %H:%M:%S")
        newEvent['icon'] = 'handshake.svg'
        newEvent['name'] = 'Collab'
        newEvent['comment'] = ''
        newEvent['id'] = 'CE' + str(self.rndGen.randint(0, 100000000))
        self.external_clockEvents.append(newEvent)

        newEvent = {}
        newEvent['start_date'] = datetime(2018, 9, 17, 5, 21).strftime("%Y-%m-%d %H:%M:%S")
        newEvent['end_date'] = ''
        newEvent['icon'] = 'sun.svg'
        newEvent['name'] = 'Sunrise'
        newEvent['comment'] = ''
        newEvent['id'] = 'CE' + str(self.rndGen.randint(0, 100000000))
        self.external_clockEvents.append(newEvent)

        self.redis.pipe.set(name="external_clockEvents", data=self.external_clockEvents, packed=True)

    def external_updateAllBlocksFromRedis(self):
        for block in self.allBlocks:
            self.redis.pipe.get(block['obId'])
        self.allBlocks = self.redis.pipe.execute(packed=True)
    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting obsBlocks_noACS.loop ..."]])
        sleep(2)

        while True:
            if self.timeOfNight.getResetTime() > self.prevResetTime:
                self.init()
            else:
                self.external_updateAllBlocksFromRedis()
                waitV = [x for x in self.allBlocks if x['exeState']
                         ['state'] == 'wait']
                runV = [x for x in self.allBlocks if x['exeState']
                        ['state'] == 'run']
                if len(waitV)+len(runV) == 0:
                    self.init()
                else:
                    self.waitToRun()
                    self.runPhases()
                    self.runToDone()
                    self.external_generateEvents()

            self.updateExeStatusLists()

            sleep(self.loopSleep)
            # sleep(0.5)

        return
# -----------------------------------------------------------------------------------------------------------
