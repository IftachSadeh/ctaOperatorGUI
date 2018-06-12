import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
import random
from random import Random
import time
import copy

from utils import myLog, Assert, getTime, noSubArrName
from utils import telIds, redisPort, flatDictById

import redis
from msgpack import packb as pack


from Acspy.Clients.SimpleClient import PySimpleClient
import sb
import jsonAcs

# install scripts by eg:
#   ln -s $PWD/ctaOperatorGUI/py/guiACS_schedBlocks_script0.py $INTROOT/config/scripts/.


# -----------------------------------------------------------------------------------------------------------
#
# -----------------------------------------------------------------------------------------------------------
class tmpTest():
    def __init__(self, nsType):
        self.log = myLog(title=__name__)
        self.log.info([['y', " - tmpTest - "], ['g', nsType]])

        self.nsType = nsType
        self.telIds = telIds[nsType]

        self.redis = redis.StrictRedis(
            host='localhost', port=redisPort[nsType], db=0)
        self.redPipe = self.redis.pipeline()

        self.loopSleep = 4

        # rndSeed = 10987268332
        rndSeed = getTime()
        self.rndGen = Random(rndSeed)

        # Create a client and the ArraySupervisor component
        client = PySimpleClient()
        supervisor = client.getComponent("ArraySupervisor")

        config = sb.Configuration(sb.InstrumentConfiguration(
            sb.PointingMode(2, sb.Divergent(2)), sb.Subarray([], [])), "camera", "rta")
        coords = sb.Coordinates(3, sb.GalacticCoordinates(10, 10))
        observing_mode = sb.ObservingMode(sb.Slewing(
            1), sb.ObservingType(2, sb.GridSurvey(1, 1, 1)))
        src = sb.Source("source", sb.placeholder, sb.High,
                        sb.RegionOfInterest(100), observing_mode, coords)
        obs = sb.ObservingConditions(sb.DateTime(
            1), 60, 1, sb.Quality(1, 1, 1), sb.Weather(1, 1, 1, 1))

        ob = sb.ObservationBlock(
            "ob", src, obs, "guiACS_schedBlocks_script0", 0)
        # ob.observing_conditions.duration = 20
        print 'xxxxxxxx', obs, '------', ob.observing_conditions.duration
        schedulingBlock = sb.SchedulingBlock(
            "sb", sb.Proposal("id"), config, [ob])

        # Submit the scheduling block to the array supervisor
        print "Submit the scheduling block to the array supervisor"
        comp = supervisor.putSchedulingBlock(schedulingBlock)
        # Print the command execution completion
        print comp
        print ""

        # Retrieve the ids of all scheduling blocks currently running on the array supervisor
        print ""
        print "Retrieve the ids of all scheduling blocks currently running on the array supervisor"
        active = supervisor.listSchedulingBlocks()
        while True:
            active = supervisor.listSchedulingBlocks()
            for sbName in active:
                status = supervisor.getSchedulingBlockStatus(sbName)
                opstatus = supervisor.getSbOperationStatus(sbName)
                phases = opstatus.ob_statuses[0].phases
                for p in phases:
                    print 'xxx', sbName, p
                self.log.info([['y', " - active_scheduling_blocks - "],
                               ['g', active, '-> '], ['y', status, ' '], ['p', opstatus]])
            if len(active) == 0:
                break
            sleep(.5)

        # # Read the status of the scheduling block with the id "sb"
        # print "Read the status of the scheduling block with the id 'sb'"
        # status = supervisor.getSchedulingBlockStatus("sb")
        # print status
        # print ""

        # # Read the operation status of the scheduling block with the id "sb"
        # print "Read the operation status of the scheduling block with the id 'sb'"
        # opstatus = supervisor.getSbOperationStatus("sb")
        # print opstatus
        # print ""

        return
        active_scheduling_blocks = supervisor.listSchedulingBlocks()
        print active_scheduling_blocks

        zz = jsonAcs.classFactory.defaultValues[sb.SchedulingBlock]
        print zz
        print '--------------------------------'
        for block in zz.observation_blocks:
            block.observing_conditions.duration = 30  # .observing_conditions
        print zz.observation_blocks
        zz = jsonAcs.encode(zz)

        sb3 = jsonAcs.decode(zz)
        sb3.id = 'sb3'

        supervisor.putSchedulingBlock(sb3)
        active_scheduling_blocks = supervisor.listSchedulingBlocks()
        self.log.info([['y', " - active_scheduling_blocks - "],
                       ['g', active_scheduling_blocks]])

        while len(active_scheduling_blocks) > 0:
            self.log.info([['y', " - active_scheduling_blocks - "],
                           ['g', active_scheduling_blocks]])
            sleep(.5)
            active_scheduling_blocks = supervisor.listSchedulingBlocks()

        print 'ended!', active_scheduling_blocks

        # self.init()

        # gevent.spawn(self.loop)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def init(self):
        self.log.info([['p', " - tmpTest.init() ..."]])

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting tmpTest.loop ..."]])
        sleep(2)

        while True:

            sleep(self.loopSleep)

        return
