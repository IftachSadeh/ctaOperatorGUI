import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
import random
from random import Random
import time
import copy

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import myLog, Assert, getTime, noSubArrName, hasACS

if hasACS:
    import ACS__POA
    from ACS import CBDescIn
    from Acspy.Clients.SimpleClient import PySimpleClient
    import sb
    import jsonAcs


# -----------------------------------------------------------------------------------------------------------
#
# -----------------------------------------------------------------------------------------------------------
class mockSched():
    isActive = False

    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def __init__(self, nsType, timeOfNight):
        self.log = myLog(title=__name__)
        self.log.info([['y', " - mockSched - "], ['g', nsType]])

        # -----------------------------------------------------------------------------------------------------------
        # sanity check for development only
        if mockSched.isActive:
            print 'isActive isActive isActive isActive isActive isActive isActive isActive isActive'
            return
        mockSched.isActive = True
        # -----------------------------------------------------------------------------------------------------------
        if not hasACS:
            print 'no ACS ......'
            return
        # -----------------------------------------------------------------------------------------------------------

        self.nsType = nsType

        self.timeOfNight = timeOfNight

        self.debug = True
        self.debug = False

        self.cycleBlocks = []
        self.acs_blocks = dict()
        self.acs_blocks['blocks'] = dict()
        self.acs_blocks['metaData'] = dict()
        self.acs_blocks['active'] = []

        self.activeSchedBlock = 0
        self.nSchedSubs = 0
        self.nInitCycle = -1
        self.namePrefix = str(getTime())
        if len(self.namePrefix) > 6:
            self.namePrefix = self.namePrefix[len(self.namePrefix)-6:]

        self.client = PySimpleClient()
        # self.client.makeCompImmortal("ArraySupervisor", True)
        self.supervisor = self.client.getComponent("ArraySupervisor")
        self.log.info([['y', " - mockSched - "], ['p', 'got supervisor!']])

        self.scriptName = "guiACS_schedBlocks_script0"
        self.maxNcycles = 100
        self.minNschedBlock = 2
        self.maxNschedBlock = 5
        self.minNobsBlock = 1
        self.maxNobsBlock = 3
        self.minNtelBlock = 4
        self.maxNfreeTels = 5

        self.timeOfNight.resetNight()
        self.obsBlockDuration = 1800  # 30 minutes
        # 0.035 -> one minute instead of 30 for gui testing
        self.durationScale = self.timeOfNight.getTimeScale()
        self.durationNight = self.timeOfNight.getTotalTime()  # 28800 -> 8 hour night
        self.prevResetTime = self.timeOfNight.getResetTime()

        # -----------------------------------------------------------------------------------------------------------
        # -----------------------------------------------------------------------------------------------------------
        # -----------------------------------------------------------------------------------------------------------
        # self.durationScale /= 2
        # -----------------------------------------------------------------------------------------------------------
        # -----------------------------------------------------------------------------------------------------------
        # -----------------------------------------------------------------------------------------------------------

        self.azMinMax = [0, 360]
        self.zenMinMaxTel = [0, 70]
        self.zenMinMaxPnt = [0, 20]

        self.loopSleep = 3

        rndSeed = getTime()
        # rndSeed = 10987268332
        self.rndGen = Random(rndSeed)

        gevent.spawn(self.loop)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getBlocks(self):
        with mockSched.lock:
            self.setActiveSchedBlocks(hasLock=True)
            return copy.deepcopy(self.acs_blocks)

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def cancelSchedBlocks(self, schedBlockId):
        class MyVoid(ACS__POA.CBvoid):
            def working(self, completion, desc):
                # print "bbbbbbbbbb Callback working",schedBlockId
                return

            def done(self, completion, desc):
                # print "bbbbbbbbbbbbb Callback done",schedBlockId
                return

        desc = CBDescIn(0L, 0L, 0L)
        cb = MyVoid()
        # self.log.info([['r'," ---- mockSched.cancelSchedBlocks() ... "],['g',schedBlockId]])
        self.supervisor.cancelSchedulingBlock(
            schedBlockId, self.client.activateOffShoot(cb), desc)
        # self.log.info([['r'," ++++ mockSched.cancelSchedBlocks() ... "],['g',schedBlockId]])

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def cancelZombieSchedBlocks(self, schedBlkIds=None):
        if schedBlkIds is None:
            try:
                active = self.supervisor.listSchedulingBlocks()
            except Exception as e:
                self.log.debug(
                    [['b', "- Exception - mockSched.listSchedulingBlocks: "], ['r', e]])
                active = []
            schedBlkIds = [
                x for x in active if x not in self.acs_blocks['blocks']]

        if len(schedBlkIds) == 0:
            return

        self.log.debug(
            [['r', " - mockSched.cancelZombieSchedBlocks() ..."], ['y', schedBlkIds]])
        for schedBlkIdNow in schedBlkIds:
            gevent.spawn(self.cancelSchedBlocks, schedBlkIdNow)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def initBlockCycle(self):
        with mockSched.lock:
            self.log.info([['p', " - mockSched.initBlockCycle() ..."]])
            debugTmp = not True

            currentBlocks = self.acs_blocks['blocks'].keys()
            if len(currentBlocks) > 0:
                self.log.info(
                    [['r', "- will discard sched blocks: "], ['b', currentBlocks]])

            if 0:
                blabla = 0
                # # Create a client and the ArraySupervisor component
                # client = PySimpleClient()
                # supervisor = client.getComponent("ArraySupervisor")

                # # Create a dummy scheduling block that will be passed to the array supervisor.
                # # Scheduling block is a very complex structure and because of ACS/Corba all fields
                # # and structures inside the SchedulingBlock have to be non None. The clients could
                # # share some common builder utility methods to construct the scheduling blocks

                # config = sb.Configuration(sb.InstrumentConfiguration(
                #         sb.PointingMode(2, sb.Divergent(2)),
                #         sb.Subarray([], [sb.Telescope("telescope_id", sb.LST)])
                #     ), "camera", "rta")
                # coords = sb.Coordinates(3, sb.GalacticCoordinates(10, 10))
                # observing_mode = sb.ObservingMode(sb.Slewing(
                #     1), sb.ObservingType(2, sb.GridSurvey(1, 1, 1)))
                # src = sb.Source("source", sb.placeholder, sb.High,
                #                 sb.RegionOfInterest(100), observing_mode, coords)
                # obs = sb.ObservingConditions(sb.DateTime(
                #     1), 0, 1, sb.Quality(1, 1, 1), sb.Weather(1, 1, 1, 1))
                # ob = sb.ObservationBlock("ob", src, obs, "waitScript", 0)
                # schedulingBlock = sb.SchedulingBlock(
                #     "sb_0001", sb.Proposal("id"), config, [ob])

                # # Submit the scheduling block to the array supervisor
                # print "Submit the scheduling block to the array supervisor"
                # comp = supervisor.putSchedulingBlock(schedulingBlock)
                # # Print the command execution completion
                # print comp

                # return

            # cancel schedBlocks which should have expired
            self.cancelZombieSchedBlocks()

            # init local bookkeeping objects
            self.cycleBlocks = []
            self.acs_blocks = dict()
            self.acs_blocks['blocks'] = dict()
            self.acs_blocks['metaData'] = dict()
            self.acs_blocks['active'] = []

            self.timeOfNight.resetNight(log=self.log)
            self.prevResetTime = self.timeOfNight.getResetTime()
            # startTime = self.timeOfNight.getStartTime()
            self.nInitCycle += 1

            overheadDuration = 30
            isCycleDone = False
            nCycleNow = 0
            totBlockDuration = 0
            maxBlockDuration = self.durationNight - self.obsBlockDuration

            if debugTmp:
                print '-------------------------------------------------------------------------'
                print 'durationNight: ', self.durationNight

            while totBlockDuration < maxBlockDuration and \
                    nCycleNow < self.maxNcycles and \
                    not isCycleDone:

                # baseName = str(getTime())+"_"
                baseName = self.namePrefix+"_" + \
                    str(self.nInitCycle)+"_"+str(nCycleNow)+"_"
                nCycleNow += 1

                telIds = copy.deepcopy(utils.telIds)
                nTels = len(telIds)
                nSchedBlks = min(
                    floor(nTels/self.minNtelBlock), self.maxNschedBlock)
                nSchedBlks = max(self.rndGen.randint(
                    1, nSchedBlks), self.minNschedBlock)
                # nSchedBlks = 50
                # nSchedBlks = 3

                if debugTmp:
                    print '------------------------------------------------------------'
                    print (
                        '- nCycleNow', nCycleNow, 'totBlockDuration / percentage:',
                        totBlockDuration, (totBlockDuration /
                                           float(self.durationNight))
                    )

                # generate random target/pointing ids
                trgPos = dict()
                # blockTrgs = dict()
                # blockTrgPnt = dict()
                # nTrgs = self.rndGen.randint(1, nSchedBlks)
                # for nTrgTry in range(nSchedBlks):
                #   nTrgNow = self.rndGen.randint(0, nTrgs-1)
                #   if nTrgNow not in blockTrgs:
                #     blockTrgs[nTrgNow] = [ nTrgTry ]
                #   else:
                #     blockTrgs[nTrgNow].append(nTrgTry)

                #   blockTrgPnt[nTrgTry] = { "nTrg":nTrgNow, "nPnt":len(blockTrgs[nTrgNow])-1 }

                cycleBlocksNow = []
                totSchedBlockDuration = []
                # -----------------------------------------------------------------------------------------------------------
                #
                # -----------------------------------------------------------------------------------------------------------
                for nSchedNow in range(nSchedBlks):
                    schedBlockId = "schBlock_"+baseName+str(nSchedNow)

                    if nSchedNow < nSchedBlks-1:
                        nTelNow = max(self.minNtelBlock,
                                      len(telIds) - nSchedBlks)
                        nTelNow = self.rndGen.randint(
                            self.minNtelBlock, nTelNow)
                        nTelNow = min(nTelNow, len(telIds))
                    else:
                        nTelNow = len(telIds) - \
                            self.rndGen.randint(0, self.maxNfreeTels)
                    if nTelNow < self.minNtelBlock:
                        continue

                    schedTelIds = random.sample(telIds, nTelNow)
                    telIds = [x for x in telIds if x not in schedTelIds]

                    subArr = []
                    for schedTelIdNow in schedTelIds:
                        telType = sb.SST if schedTelIdNow[0] == 'S' else sb.MST if schedTelIdNow[0] == 'M' else sb.LST

                        subArr += [sb.Telescope(schedTelIdNow, telType)]
                    # subArr = [sb.Telescope("L_0", sb.LST), sb.Telescope(
                    #     "L0", sb.LST), sb.Telescope("T0", sb.LST)]
                    # subArr = [sb.Telescope("T1", sb.LST), sb.Telescope(
                    #     "T1", sb.MST), sb.Telescope("T1", sb.SST)]
                    # print subArr

                    schedConf = sb.Configuration(
                        sb.InstrumentConfiguration(
                            sb.PointingMode(2, sb.Divergent(2)),
                            sb.Subarray([], subArr)
                        ),
                        "camera",
                        "rta"
                    )

                    nObsBlocks = self.rndGen.randint(
                        self.minNobsBlock, self.maxNobsBlock)

                    # nTrg = blockTrgPnt[nSchedNow]["nTrg"]
                    # nPnt = blockTrgPnt[nSchedNow]["nPnt"]
                    nTrg = nSchedNow

                    if nTrg not in trgPos:
                        deltaAz = self.azMinMax[1] - self.azMinMax[0]
                        deltaZen = self.zenMinMaxTel[1] - self.zenMinMaxTel[0]
                        trgPos[nTrg] = [
                            (self.rndGen.random() *
                             deltaAz + self.azMinMax[0]),
                            (self.rndGen.random() *
                             deltaZen + self.zenMinMaxTel[0])
                        ]

                    targetId = "trg_"+str(nTrg)

                    if debugTmp:
                        print (
                            ' -- nSchedNow / nTelNow:', nSchedNow,
                            nTelNow, '-------', schedBlockId
                        )

                    obsBlockV = []
                    totObsBlockDuration = 0
                    obsBlockStartTime = totBlockDuration

                    for nObsNow in range(nObsBlocks):
                        obsBlockId = "obsBlock_"+baseName + \
                            str(nSchedNow)+"_"+str(nObsNow)

                        rnd = self.rndGen.random()
                        obsBlockDuration = self.obsBlockDuration
                        # if rnd < 0.1:
                        #   obsBlockDuration /= 3
                        # elif rnd < 0.3:
                        #   obsBlockDuration /= 2
                        if rnd < 0.05:
                            obsBlockDuration /= 1.8
                        elif rnd < 0.3:
                            obsBlockDuration /= 1.5
                        elif rnd < 0.5:
                            obsBlockDuration /= 1.1
                        obsBlockDuration = int(floor(obsBlockDuration))

                        if obsBlockStartTime + obsBlockDuration > self.durationNight:
                            isCycleDone = True
                            if debugTmp:
                                print (
                                    ' - isCycleDone - nObsNow / startTime / duration:',
                                    nObsNow, obsBlockStartTime, obsBlockDuration
                                )
                            break

                        # integrated time for all obs blocks within this sched block
                        totObsBlockDuration += obsBlockDuration

                        # correct for the fact that the config/finish stages take time and
                        # are not scaled
                        scaledDuration = obsBlockDuration * self.durationScale - overheadDuration
                        scaledDuration = max(1, scaledDuration)

                        pntPos = copy.deepcopy(trgPos[nTrg])
                        pntPos[0] += (self.rndGen.random() - 0.5) * 10
                        pntPos[1] += (self.rndGen.random() - 0.5) * 10

                        if pntPos[0] > self.azMinMax[1]:
                            pntPos[0] -= 360
                        elif pntPos[0] < self.azMinMax[0]:
                            pntPos[0] += 360

                        if debugTmp:
                            print (
                                ' --- nObsNow / startTime / duration / scaledDuration:',
                                nObsNow, obsBlockStartTime, obsBlockDuration,
                                scaledDuration, '-------', obsBlockId
                            )

                        obsCords = sb.Coordinates(
                            2,
                            sb.HorizontalCoordinates(
                                trgPos[nTrg][1], trgPos[nTrg][0])
                        )
                        obsMode = sb.ObservingMode(
                            sb.Slewing(1),
                            sb.ObservingType(2, sb.GridSurvey(1, 1, 1))
                        )
                        obsSrc = sb.Source(
                            targetId,
                            sb.placeholder,
                            sb.High,
                            sb.RegionOfInterest(100),
                            obsMode,
                            obsCords
                        )
                        obsCond = sb.ObservingConditions(
                            sb.DateTime(1),
                            scaledDuration,
                            1,
                            sb.Quality(1, 1, 1),
                            sb.Weather(1, 1, 1, 1)
                        )
                        obsBlock = sb.ObservationBlock(
                            obsBlockId,
                            obsSrc,
                            obsCond,
                            self.scriptName,
                            0
                        )

                        # metadata of the observing block
                        _nSchedBlocks = len(self.acs_blocks['blocks'].keys())
                        _nObsBlocks = len(obsBlockV)
                        metaData = {
                            'nSched': _nSchedBlocks, 'nObs': _nObsBlocks,
                            'blockName': str(_nSchedBlocks)+" ("+str(_nObsBlocks)+")"
                        }

                        # temporary way to store meta-data - should be replaced by
                        # global coordinate access function
                        self.acs_blocks['metaData'][obsBlockId] = {
                            'metaData': metaData,
                            'timeStamp': getTime(),
                            'pntPos': pntPos,
                            'duration': obsBlockDuration,
                            'startTime_planed': obsBlockStartTime,
                            'startTime_executed': None,
                            'status': sb.OB_PENDING,
                            'phases': []
                        }

                        obsBlockV += [obsBlock]
                        obsBlockStartTime += obsBlockDuration

                    if len(obsBlockV) > 0:
                        schedBlk = sb.SchedulingBlock(
                            schedBlockId,
                            sb.Proposal("proposalId"),
                            schedConf,
                            obsBlockV
                        )

                        cycleBlocksNow.append(schedBlk)

                        self.acs_blocks['blocks'][schedBlockId] = {
                            'timeStamp': getTime(),
                            'state': 'wait',
                            'schedBlock': schedBlk
                        }

                        # list of duration of all sched blocks within this cycle
                        totSchedBlockDuration += [totObsBlockDuration]

                # the maximal duration of all blocks within this cycle
                totBlockDuration += max(totSchedBlockDuration)

                if len(cycleBlocksNow) > 0:
                    self.cycleBlocks.append(cycleBlocksNow)

            # print '-----',len(self.cycleBlocks)

        return

    # -----------------------------------------------------------------------------------------------------------
    # move one from wait to run
    # -----------------------------------------------------------------------------------------------------------
    def setActiveSchedBlocks(self, hasLock=False):
        metaData = self.acs_blocks['metaData']
        blocks = self.acs_blocks['blocks']

        def setBlocks():
            try:
                active = self.supervisor.listSchedulingBlocks()
            except Exception as e:
                self.log.debug(
                    [['b', "- Exception - mockSched.setActiveSchedBlocks: "], ['r', e]])
                active = []

            obsBlockDelays = dict()
            self.acs_blocks['active'] = []
            for schedBlockId in blocks:
                obsBlockDelays[schedBlockId] = None

                obsBlocksStatus = None
                if schedBlockId in active:
                    try:
                        obsBlocksStatus = self.supervisor.getSbOperationStatus(
                            schedBlockId).ob_statuses
                    except Exception as e:
                        self.log.debug(
                            [['b', "- Exception - mockSched.getSbOperationStatus: "], ['r', e]])

                if obsBlocksStatus is not None:
                    self.acs_blocks['active'].append(schedBlockId)
                    blocks[schedBlockId]['state'] = 'run'

                    # schedBlockStatus = self.supervisor.getSchedulingBlockStatus(
                    #     schedBlockId)
                    # schedBlockOpStatus = self.supervisor.getSbOperationStatus(
                    #     schedBlockId)
                    # self.log.info([
                    #     ['y', " - active_scheduling_blocks - ", schedBlockId, ' '], [
                    #      'g', active, '-> '], ['y', schedBlockOpStatus, ' ']
                    # ])

                    for obsBlockNow in obsBlocksStatus:
                        obsBlockId = obsBlockNow.id
                        if obsBlockId in metaData:
                            metaData[obsBlockId]['status'] = obsBlockNow.status
                            metaData[obsBlockId]['phases'] = obsBlockNow.phases

                            # all state definitions:
                            # enum SchedulingBlockStatus {
                            #   SB_WAITING, SB_PENDING, SB_RUNNING, SB_SUCCEEDED,
                            #   SB_TRUNCATED, SB_CANCELED, SB_FAILED, SB_ABORTED
                            # };
                            # enum ObservationBlockStatus {
                            #   OB_PENDING, OB_RUNNING, OB_SUCCEEDED, OB_CANCELED,
                            #   OB_TRUNCATED, OB_FAILED
                            # };

                            if (
                                metaData[obsBlockId]['startTime_executed'] is None and
                                obsBlockNow.status != sb.OB_PENDING
                            ):

                                timeNow = self.timeOfNight.getCurrentTime()
                                metaData[obsBlockId]['startTime_executed'] = timeNow

                                timeDif = timeNow - \
                                    metaData[obsBlockId]['startTime_planed']
                                if timeDif > 0:
                                    obsBlockDelays[schedBlockId] = timeDif

                                self.log.info([
                                    ['y', "- obs block is now running: "], ['r',
                                                                            obsBlockId],
                                    [
                                        'g', ' - planned/executed time: ',
                                        metaData[obsBlockId]['startTime_planed'], ' / ', timeNow
                                    ]
                                ])

                            # phases = obsBlockNow.phases
                            # for p in phases:
                            #     self.log.debug([
                            #         [
                            #             'y', " -- phases - ", schedBlockId, ' ',
                            #             obsBlockId, ' ', obsBlockNow.status, ' '
                            #         ], [
                            #             'g', p.heartbeat_counter, ' ', p.name,
                            #             ' ', p.status, ' ', p.progress_message
                            #         ]
                            #     ])

                if (
                    obsBlocksStatus is None and
                    blocks[schedBlockId]['state'] == 'run'
                ):
                    blocks[schedBlockId]['state'] = 'done'

                    obsBlocks = blocks[schedBlockId]['schedBlock'].observation_blocks
                    for obsBlock in obsBlocks:
                        obsBlockId = obsBlock.id
                        rndNow = self.rndGen.random()
                        if rndNow < 0.05:
                            metaData[obsBlockId]['status'] = sb.OB_CANCELED
                        elif rndNow < 0.1:
                            metaData[obsBlockId]['status'] = sb.OB_FAILED
                        else:
                            metaData[obsBlockId]['status'] = sb.OB_SUCCEEDED

                        metaData[obsBlockId]['phases'] = []

                    self.log.info([['b', "- sched block is done "], ['r', schedBlockId],
                                   ['g', ' - currentTime: ', self.timeOfNight.getCurrentTime()]])

            # adjust the start time of all future OBs --- this will NOT take care of OBs of
            # currently active SB, which may overshoot the end of the night !
            timeDifs = [x for x in obsBlockDelays.values() if x is not None]
            if len(timeDifs) > 0:
                # adjust the start time of all future OBs in the currently active SBs
                activeSchedBlock = len(self.cycleBlocks)
                for schedBlockId in self.acs_blocks['active']:
                    if obsBlockDelays[schedBlockId] is None:
                        continue

                    updatedObsBlocks = []
                    schedBlk = blocks[schedBlockId]['schedBlock']
                    for obsBlock in schedBlk.observation_blocks:
                        obsBlockId = obsBlock.id

                        if metaData[obsBlockId]['startTime_executed'] is None:
                            updatedObsBlocks += [[obsBlockId,
                                                  obsBlockDelays[schedBlockId]]]
                            metaData[obsBlockId]['startTime_planed'] += obsBlockDelays[schedBlockId]

                    if len(updatedObsBlocks) > 0:
                        self.log.info([
                            ['b', " -+- updating startTime_planed of",
                                schedBlockId, " "],
                            ['y', updatedObsBlocks]
                        ])

                    for nCycleNow in range(len(self.cycleBlocks)):
                        if schedBlk in self.cycleBlocks[nCycleNow]:
                            activeSchedBlock = nCycleNow

                # adjust the start time of all OBs in future SBs
                self.log.info([['g', "- will delay future SBs ..."]])

                self.delaySchedBlks(activeSchedBlock=(
                    activeSchedBlock+1), timeDif=max(timeDifs))

            # -----------------------------------------------------------------------------------------------------------
            # ????????????????????????????????????????????????????????????????
            # how do i get the status of a ob which has: OB_SUCCEEDED, OB_CANCELED,
            # OB_TRUNCATED, OB_FAILED ????????????????
            # ????????????????????????????????????????????????????????????????
            # -----------------------------------------------------------------------------------------------------------

            return

        if hasLock:
            setBlocks()
        else:
            with mockSched.lock:
                setBlocks()

        # self.log.info([['p'," - setActiveSchedBlocks() ... ",self.acs_blocks['active']]])
        return

    # -----------------------------------------------------------------------------------------------------------
    # update the estimated starting times of all blocks based on the current state of execution
    # clip the list if any block ends up lasting after the night is supposed to end
    # -----------------------------------------------------------------------------------------------------------
    def delaySchedBlks(self, activeSchedBlock=None, timeDif=None):
        if activeSchedBlock is None:
            activeSchedBlock = self.activeSchedBlock
        if activeSchedBlock >= len(self.cycleBlocks)-1:
            return

        # get the maximal difference between planned and current time for each
        # OB of each SB in the cycle which will is about to be submitted
        if timeDif is None:
            timeDifMax = -1
            for schedBlk in self.cycleBlocks[activeSchedBlock]:
                obsBlockId = schedBlk.observation_blocks[0].id

                startTime = self.acs_blocks['metaData'][obsBlockId]['startTime_planed']
                timeDifNow = self.timeOfNight.getCurrentTime() - startTime
                timeDifMax = max(timeDifMax, timeDifNow)
        else:
            timeDifMax = timeDif

        # if any of the OBs is late, adjust the planned start time of all OBs in all SBs
        # and remove any OBs which will overshoot the end of the night
        if timeDifMax > 0:
            self.log.info([
                ['r', "- updating startTime_planed by: "],
                ['b', timeDifMax]
            ])

            # perform the adjustment for all future SBs in all cycles
            for nCycleNow in range(activeSchedBlock, len(self.cycleBlocks)):
                schedBlkOverV = []
                for schedBlk in self.cycleBlocks[nCycleNow]:
                    self.log.info([
                        ['b', " -+- updating ", schedBlk.id, " "],
                        ['y', [x.id for x in schedBlk.observation_blocks]]
                    ])

                    # adjust the start time of all OBs in this SB
                    for obsBlock in schedBlk.observation_blocks:
                        obsBlockId = obsBlock.id
                        self.acs_blocks['metaData'][obsBlockId]['startTime_planed'] += timeDifMax

                        endTime = self.acs_blocks['metaData'][obsBlockId]['startTime_planed'] + \
                            self.acs_blocks['metaData'][obsBlockId]['duration']

                        # a simplistic approach - cancel any SB if at least one of
                        # its OBs overshoots the end of the night
                        if endTime > self.durationNight and (schedBlk not in schedBlkOverV):
                            schedBlkOverV.append(schedBlk)

                # remove all overshooting SBs from the cycle and apdate the bookkeeping
                for schedBlk in schedBlkOverV:
                    self.log.info([
                        ['r', "- cancelling all OBs from future cycle for SB "],
                        ['p', schedBlk.id]
                    ])

                    for obsBlock in schedBlk.observation_blocks:
                        self.acs_blocks['metaData'][obsBlock.id]['status'] = sb.OB_CANCELED
                        # self.acs_blocks['metaData'].pop(obsBlock.id, None)

                    self.acs_blocks['blocks'][schedBlk.id]['state'] = 'cancel'
                    # self.acs_blocks['blocks'].pop(schedBlk.id, None)
                    self.cycleBlocks[nCycleNow].remove(schedBlk)

            # remove any cycle which has no SBs letf in it
            self.cycleBlocks = [x for x in self.cycleBlocks if len(x) > 0]

        return

    # -----------------------------------------------------------------------------------------------------------
    # move one from wait to run
    # -----------------------------------------------------------------------------------------------------------
    def submitBlockCycle(self):
        self.log.info([['g', " - starting mockSched.submitBlockCycle ..."]])

        hasResetNight = (self.timeOfNight.getResetTime() > self.prevResetTime)
        if hasResetNight:
            self.log.info(
                [['p', " - hasResetNight - will cancel all running blocks and reset cycles ..."]])

        if self.activeSchedBlock >= len(self.cycleBlocks) or hasResetNight:
            self.nSchedSubs = 0
            self.activeSchedBlock = 0

            self.initBlockCycle()

        # update the start time of all fufute SBs
        with mockSched.lock:
            self.delaySchedBlks()

        # check if has removed all executable blocks
        if self.activeSchedBlock >= len(self.cycleBlocks):
            self.submitBlockCycle()
            return

        # -----------------------------------------------------------------------------------------------------------
        # submit new blocks
        # -----------------------------------------------------------------------------------------------------------
        with mockSched.lock:
            self.nSchedSubs = 0
            for schedBlk in self.cycleBlocks[self.activeSchedBlock]:

                if self.acs_blocks['blocks'][schedBlk.id]['state'] == 'wait':
                    # increase the self.nSchedSubs counter BEFORE spawning the thread
                    self.nSchedSubs += 1
                    # spawn a new SB submision (will wait for its start time to
                    # arrive before actually submitting)
                    gevent.spawn(self.submitOneBlock, schedBlk)

            self.setActiveSchedBlocks(hasLock=True)

        self.activeSchedBlock += 1

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def submitOneBlock(self, schedBlk):
        with mockSched.lock:
            obsBlockId = schedBlk.observation_blocks[0].id

            nSubTries = 0
            while True:
                if (self.timeOfNight.getResetTime() > self.prevResetTime):
                    return

                startTime = self.acs_blocks['metaData'][obsBlockId]['startTime_planed']
                timeDif = self.timeOfNight.getCurrentTime() - startTime
                if timeDif >= 0:
                    break

                if nSubTries % 10 == 0:
                    self.log.info([
                        ['b', "- waiting to submit "],
                        ['g', schedBlk.id],
                        ['b', ' - remaining time: ', timeDif]
                    ])
                nSubTries += 1

                sleep(0.5)

            try:
                complt = self.supervisor.putSchedulingBlock(schedBlk)

                blkMeta = self.acs_blocks['metaData']
                blkTimes = [
                    (
                        (str(x.id) + " --> " + str(blkMeta[x.id]['metaData']['nSched']) +
                            " (" + str(blkMeta[x.id]['metaData']['nObs']) + ")"),
                        [
                            int(floor(blkMeta[x.id]['startTime_planed'])),
                            int(floor(blkMeta[x.id]['startTime_planed'] +
                                      blkMeta[x.id]['duration']))
                        ]
                    ) for x in schedBlk.observation_blocks
                ]

                self.log.info([
                    ['y', "- submitted sched block: "],
                    ['p', schedBlk.id, ' '],
                    ['g', blkTimes]
                ])

            except Exception as e:
                self.log.debug([
                    ['b', "- Exception - mockSched.putSchedulingBlock: "],
                    ['r', e]
                ])

            # as the last action in this thread, update the self.nSchedSubs counter
            self.nSchedSubs -= 1

        return

    # -----------------------------------------------------------------------------------------------------------
    # move one from wait to run
    # -----------------------------------------------------------------------------------------------------------
    def checkSchedBlocks(self):
        self.log.debug([['b', " - starting mockSched.checkSchedBlocks ..."]])

        with mockSched.lock:
            self.setActiveSchedBlocks(hasLock=True)

            for sbName in self.acs_blocks['active']:
                status = self.supervisor.getSchedulingBlockStatus(sbName)
                opstatus = self.supervisor.getSbOperationStatus(sbName)
                self.log.debug([['y', " - active_scheduling_blocks - "],
                                ['g', self.acs_blocks['active'], '-> '], ['y', status, ' ']])

                for nob in range(len(opstatus.ob_statuses)):
                    phases = opstatus.ob_statuses[nob].phases
                    for p in phases:
                        self.log.debug([
                            [
                                'y', " -- phases - ", sbName, ' ',
                                opstatus.ob_statuses[nob].id, ' ',
                                opstatus.ob_statuses[nob].status, ' '
                            ],
                            [
                                'g', p.heartbeat_counter, ' ', p.name, ' ',
                                p.status, ' ', p.progress_message
                            ]
                        ])

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting mockSched.loop ..."]])

        self.submitBlockCycle()

        while True:
            self.setActiveSchedBlocks()
            if len(self.acs_blocks['active']) == 0 and self.nSchedSubs == 0:
                self.submitBlockCycle()

            # self.checkSchedBlocks()
            sleep(self.loopSleep)

        return
