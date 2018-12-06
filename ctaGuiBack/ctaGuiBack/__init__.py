# import ctaGuiUtils
# from ctaGuiUtils.py.utils import myLog


# make sure we have the local acs modules of the gui
import os, sys
baseGuiAcsDir = os.path.dirname(os.getcwd())+"/acs"
if not baseGuiAcsDir in sys.path:
  sys.path.append(baseGuiAcsDir)

# my specialized logging interface - important to init the logger vefore importing any ACS ....
from ctaGuiUtils.py.utils import myLog
log = myLog(title=__name__)

# import the utils module to allow access to utils.appPrefix
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.arrayData import arrayData

from ctaGuiBack.py.mockTarget import mockTarget
from ctaGuiBack.py.telHealth import telHealth
from ctaGuiBack.py.telPos import telPos
from ctaGuiBack.py.obsBlocks import obsBlocks, obsBlocks_noACS
from ctaGuiBack.py.pubSubTest import pubSubTest
# from ctaGuiBack.py.propertyMonitor import PropertyMonitorQueue, PropertyMonitorGlobal, PropertyMonitorLocal
# from ctaGuiBack.py.simComp import SimComp

# if utils.hasACS:
#   from ctaGuiBack.py.tmpTest import tmpTest

# from ctaGuiUtils.py.utils import redisPort

def main(global_config, **settings):
  log.info([['wg'," - Starting redis-filler ..."]])
  log.info([['p'," - hasACS = "],[('g' if utils.hasACS else 'r'),utils.hasACS]])

  # -----------------------------------------------------------------------------------------------------------
  # run it
  # -----------------------------------------------------------------------------------------------------------
  # utils.nsType = "N"
  utils.nsType = "S"

  myTimeOfNight = utils.timeOfNight(nsType=utils.nsType)
  # myTimeOfNight = utils.timeOfNight(nsType=utils.nsType, timeScale = 0.001)

  # set the list of telescopes for this particular site
  utils.telIds = utils.initTelIds(utils.nsType)

  myArrayData = arrayData()

  # -----------------------------------------------------------------------------------------------------------
  # -----------------------------------------------------------------------------------------------------------
  # for debugging....
  flushRedisOnStart = 0
  if flushRedisOnStart:
    from ctaGuiBack.py.utils_redis import redisManager
    redis_ = redisManager(name='__init__')
    redis_.redis.flushall()
  # -----------------------------------------------------------------------------------------------------------
  # -----------------------------------------------------------------------------------------------------------

  # -----------------------------------------------------------------------------------------------------------
  # -----------------------------------------------------------------------------------------------------------
  # if utils.hasACS:
  #   tmpTest(nsType=nsType)

  telHealth(nsType=utils.nsType, timeOfNight=myTimeOfNight, arrayData=myArrayData)
  telPos(nsType=utils.nsType)
  mockTarget(nsType=utils.nsType)

  if utils.hasACS:
    obsBlocks(nsType=utils.nsType, timeOfNight=myTimeOfNight)
  else:
    obsBlocks_noACS(nsType=utils.nsType, timeOfNight=myTimeOfNight)




  # # pubSubTest(nsType=utils.nsType)
  # # SimComp(nsType=utils.nsType)
  # # PropertyMonitorQueue(nsType=utils.nsType)
  # # PropertyMonitorGlobal(nsType=utils.nsType)
  # # PropertyMonitorLocal(nsType=utils.nsType)

  return
