import threading
import thread
from time import sleep
from math import sqrt, ceil, floor
import random
from random import Random
import time
import copy

import ACS__POA
from ACS import CBDescIn
from Acspy.Clients.SimpleClient import PySimpleClient
import sb
import jsonAcs

class mockSched():
  # -----------------------------------------------------------------------------------------------------------
  # 
  # -----------------------------------------------------------------------------------------------------------
  def __init__(self, nsType):
    self.log = myLog(title=__name__)
    self.log.info([['y'," - mockSched - "],['g',nsType]])

    self.nsType = nsType
    self.telIds = telIds[nsType]

    self.debug =  False
    self.expire = 86400 # one day

    self.cycleBlocks = []
    self.acs_blocks = dict()
    self.acs_blocks['schedBlock'] = dict()
    self.acs_blocks['metaData'] = dict()

    self.activeSchedBlock = 0

    self.client = PySimpleClient()
    self.supervisor = self.client.getComponent("ArraySupervisor")
    # print 'got ArraySupervisor ............'
    
    self.nSchedBlock = [5, 15]
    self.maxNobsBlock = 7 if self.nsType == "N" else 32
    self.maxNobsBlock = min(self.maxNobsBlock, len(self.telIds))
    # self.maxNobsBlock = len(self.telIds)
    self.loopSleep = 4

    self.azMinMax = [0, 360]
    self.zenMinMaxTel = [0, 70]
    self.zenMinMaxPnt = [0, 20]

    rndSeed = getTime()
    rndSeed = 10987268332
    self.rndGen = Random(rndSeed)


    
    print 'xxxxxxxxxxx'
    active = self.supervisor.listSchedulingBlocks()
    print '-----',active

    self.cancelSchedBlocks(active[0])
    print 'sleep...'
    sleep(10)
    print 'check...'
    print '---',len(self.supervisor.getSbOperationStatus(active[0]).ob_statuses),'------------',self.supervisor.getSbOperationStatus(active[0]).ob_statuses
    print '---',self.supervisor.getSbOperationStatus(active[0]).ob_statuses[-1].status
    activeNow = self.supervisor.listSchedulingBlocks()
    print 'active now ....',activeNow
    return



    self.threads = []
    run_event = threading.Event()
    run_event.set()

    t = threading.Thread(target=self.loop, args = (run_event,))
    t.start()
    self.threads.append(t)

    try:
      while 1:
        sleep(.1)
    except KeyboardInterrupt:
      run_event.clear()
      for t in self.threads:
        t.join()

    return

  # -----------------------------------------------------------------------------------------------------------
  # 
  # -----------------------------------------------------------------------------------------------------------
  def cancelSchedBlocks(self, schedBlkId):
    class MyVoid(ACS__POA.CBvoid):
      def working (self, completion, desc):
        # print "bbbbbbbbbb Callback working",schedBlkId
        return

      def done(self, completion, desc):
        # print "bbbbbbbbbbbbb Callback done",schedBlkId
        return

    desc = CBDescIn(0L, 0L, 0L)
    cb = MyVoid() 

    self.log.info([['r'," ---- mockSched.cancelSchedBlocks() ... "],['g',schedBlkId]])
    self.supervisor.cancelSchedulingBlock(schedBlkId, self.client.activateOffShoot(cb), desc)
    self.log.info([['r'," ++++ mockSched.cancelSchedBlocks() ... "],['g',schedBlkId]])
 
    return

  # -----------------------------------------------------------------------------------------------------------
  # 
  # -----------------------------------------------------------------------------------------------------------
  def cancelZombieSchedBlocks(self, schedBlkIds=None):
    if schedBlkIds is None:
      try:
        active = self.supervisor.listSchedulingBlocks()
      except Exception as e:
        self.log.debug([['b',"- Exception - mockSched.listSchedulingBlocks: "],['r',e]])
        active = []
      schedBlkIds = [ x for x in active if x not in self.acs_blocks['schedBlock'] ]


    schedBlkIds = active

    if len(schedBlkIds) == 0:
      return

    self.log.info([['r'," - mockSched.cancelZombieSchedBlocks() ..."],['y',schedBlkIds]])
    for schedBlkIdNow in schedBlkIds:
      self.cancelSchedBlocks(schedBlkIdNow)
      # t = threading.Thread(target=self.cancelSchedBlocks,args=(schedBlkIdNow,))
      # t.start()
      # t.join()
      # self.threads.append(t)

    return

  # -----------------------------------------------------------------------------------------------------------
  # 
  # -----------------------------------------------------------------------------------------------------------
  def initBlockCycle(self):
    self.log.info([['p'," - mockSched.initBlockCycle() ..."]])

    scriptName = "guiACS_schedBlocks_script0"
    self.nCycles = [1,5]
    self.nSchedBlock = 40
    self.maxNobsBlock = 1
    self.obsBlockDuration = 20

    # cancel schedBlocks which should have expired
    # self.cancelZombieSchedBlocks()

    # init local bookkeeping objects
    self.cycleBlocks = []
    self.acs_blocks = dict()
    self.acs_blocks['schedBlock'] = dict()
    self.acs_blocks['metaData'] = dict()

    nCycles = self.rndGen.randint(self.nCycles[0], self.nCycles[1])
    for nCycleNow in range(nCycles):
      baseName = str(getTime())+"_"

      telIds = copy.deepcopy(self.telIds)
      nTels = len(telIds)
      # nSchedBlks = self.rndGen.randint(1, min(nTels, self.nSchedBlock))
      nSchedBlks = self.nSchedBlock

      # generate random target/pointing ids
      trgPos = dict()
      blockTrgs = dict()
      blockTrgPnt = dict()
      nTrgs = self.rndGen.randint(1, nSchedBlks)
      for nTrgTry in range(nSchedBlks):
        nTrgNow = self.rndGen.randint(0, nTrgs-1)
        if nTrgNow not in blockTrgs:
          blockTrgs[nTrgNow] = [ nTrgTry ]
        else:
          blockTrgs[nTrgNow].append(nTrgTry)
        
        blockTrgPnt[nTrgTry] = { "nTrg":nTrgNow, "nPnt":len(blockTrgs[nTrgNow])-1 }

      cycleBlocks = []
      for nSchedNow in range(nSchedBlks):
        schedBlockId = "schBlock_"+baseName+str(nSchedNow)

        nTelNow = self.rndGen.randint(1, max(1, len(telIds) - nSchedBlks))

        # schedTelIds = random.sample(telIds, nTelNow)
        # telIds = [x for x in telIds if x not in schedTelIds]

        subArr = []
        # for schedTelIdNow in schedTelIds:        
        #   telType = sb.SST if schedTelIdNow[0] == 'S' else sb.MST if schedTelIdNow[0] == 'M' else sb.LST
        #   subArr += [ sb.Telescope(schedTelIdNow, telType) ]

        schedConf = sb.Configuration(
          sb.InstrumentConfiguration(
            sb.PointingMode(2,sb.Divergent(2)),
            sb.Subarray([], subArr)
          ),
          "camera",
          "rta"
        )

        nObsBlocks = self.rndGen.randint(1, self.maxNobsBlock)
        
        nTrg = blockTrgPnt[nSchedNow]["nTrg"]
        nPnt = blockTrgPnt[nSchedNow]["nPnt"]

        if not nTrg in trgPos:
          trgPos[nTrg] = [
            (self.rndGen.random() * (self.azMinMax[1] - self.azMinMax[0])) + self.azMinMax[0] ,
            (self.rndGen.random() * (self.zenMinMaxTel[1] - self.zenMinMaxTel[0])) + self.zenMinMaxTel[0]
          ]

        targetId = "trg_"+str(nTrg)

        obsBlockV = []
        for nBlockNow in range(nObsBlocks):
          obsBlockId = "obsBlock_"+str(getTime())

          pntPos = copy.deepcopy(trgPos[nTrg])
          pntPos[0] += (self.rndGen.random() - 0.5) * 10
          pntPos[1] += (self.rndGen.random() - 0.5) * 10

          if pntPos[0] > self.azMinMax[1]:
            pntPos[0] -= 360
          elif pntPos[0] < self.azMinMax[0]:
            pntPos[0] += 360

          obsCords = sb.Coordinates(2,sb.HorizontalCoordinates(trgPos[nTrg][1],trgPos[nTrg][0]))
          # obsCords = sb.Coordinates(3,sb.GalacticCoordinates(trgPos[nTrg][1],trgPos[nTrg][0]))
          obsMode = sb.ObservingMode(sb.Slewing(1), sb.ObservingType(2,sb.GridSurvey(1,1,1)))
          obsSrc = sb.Source(targetId, sb.placeholder, sb.High, sb.RegionOfInterest(100), obsMode, obsCords)
          obsCond = sb.ObservingConditions(sb.DateTime(1), self.obsBlockDuration, 1, sb.Quality(1, 1, 1), sb.Weather(1, 1, 1, 1))
          obsBlock = sb.ObservationBlock(obsBlockId, obsSrc, obsCond, scriptName, 0)

          obsBlockV += [ obsBlock ]

          # temporary way to store meta-data
          # should be replaced by global coordinate access function
          self.acs_blocks['metaData'][obsBlockId+"_"+"pntPos"] = pntPos

        schedBlk = sb.SchedulingBlock(schedBlockId, sb.Proposal("proposalId"), schedConf, obsBlockV)

        cycleBlocks.append(schedBlk)

        self.acs_blocks['schedBlock'][schedBlockId] = schedBlk

      self.cycleBlocks.append(cycleBlocks)


    return

  # -----------------------------------------------------------------------------------------------------------
  # move one from wait to run
  # -----------------------------------------------------------------------------------------------------------
  def submitBlockCycle(self):
    self.log.info([['g'," - starting mockSched.submitBlockCycle ..."]])

    if len(self.cycleBlocks) >= self.activeSchedBlock:
      self.activeSchedBlock = 0
      self.initBlockCycle()

    # grab the current schedBlock from the queue
    blockCycle = self.cycleBlocks[self.activeSchedBlock]
    self.activeSchedBlock += 1

    # submit the scheduling blocks
    self.log.info([['g'," - submitting ..."]])
    for schedBlk in blockCycle:
      try:
        self.log.info([['y'," --- try putSchedulingBlock ",schedBlk.id]])
        complt = self.supervisor.putSchedulingBlock(schedBlk)
      except Exception as e:
        self.log.debug([['b',"- Exception - mockSched.putSchedulingBlock: "],['r',e]])

    self.log.info([['y'," ----- try putSchedulingBlock done !"]])
    return

  # -----------------------------------------------------------------------------------------------------------
  # move one from wait to run
  # -----------------------------------------------------------------------------------------------------------
  def checkSchedBlocks(self):
    self.log.debug([['b'," - starting mockSched.checkSchedBlocks ..."]])

    try:
      active = self.supervisor.listSchedulingBlocks()
    except Exception as e:
      self.log.debug([['b',"- Exception - mockSched.listSchedulingBlocks: "],['r',e]])
      active = []

    active = [ x for x in active if x in self.acs_blocks['schedBlock'] ]
    
    self.log.debug([['b'," --- got ",len(active)," active blocks"]])
    
    # for sbName in active:
    #   status = self.supervisor.getSchedulingBlockStatus(sbName)
    #   opstatus = self.supervisor.getSbOperationStatus(sbName)
    #   self.log.info([['y'," - active_scheduling_blocks - "],['g',active,'-> '],['y',status,' ']])
      
    #   for nob in range(len(opstatus.ob_statuses)):
    #     phases = opstatus.ob_statuses[nob].phases
    #     # for p in phases:
    #     #   self.log.info([['y'," -- phases - ",sbName,' ',opstatus.ob_statuses[nob].id,' ',opstatus.ob_statuses[nob].status,' '],['g',p.heartbeat_counter,' ',p.name,' ',p.status,' ',p.progress_message]])
    #     #   break

    return len(active)


  # -----------------------------------------------------------------------------------------------------------
  # 
  # -----------------------------------------------------------------------------------------------------------
  def loop(self, run_event):
    self.log.info([['g'," - starting mockSched.loop ..."]])
    
    self.submitBlockCycle()

    while run_event.is_set():
      nSchedBlocks = self.checkSchedBlocks()
      self.log.info([['g'," - will now wait for 5 sec ..."]])
      sleep(5)
      self.log.info([['g'," - will now try to cancel all ..."]])
      self.cancelZombieSchedBlocks()

      if nSchedBlocks == 0:
        self.submitBlockCycle()

      sleep(self.loopSleep)
    
    return





















# -----------------------------------------------------------------------------------------------------------
# ignore everything below .....
# ignore everything below .....
# ignore everything below .....
# -----------------------------------------------------------------------------------------------------------

import logging
import numbers
import numpy as np
import time
useCol = 1 #; useCol = 0
useLogTitle = False
addMsgEleSpace = False
noSubArrName = "emptySA"
telPos0 = [0, 90]
hasACS = True

# -----------------------------------------------------------------------------------------------------------
# different databases/configurations for north or south
# -----------------------------------------------------------------------------------------------------------
def initTelIds(nsType):
  telIds = []
  # -----------------------------------------------------------------------------------------------------------
  # south
  # -----------------------------------------------------------------------------------------------------------
  if nsType == "S":
    telIds += ["L_0" ]
    telIds += ["L_1" ]
    telIds += ["L_2" ]
    telIds += ["L_3" ]
    telIds += ["M_0" ]
    telIds += ["M_1" ]
    telIds += ["M_2" ]
    telIds += ["M_3" ]
    telIds += ["M_4" ]
    telIds += ["M_5" ]
    telIds += ["M_6" ]
    telIds += ["M_7" ]
    telIds += ["M_8" ]
    telIds += ["M_9" ]
    telIds += ["M_10"]
    telIds += ["M_11"]
    telIds += ["M_12"]
    telIds += ["M_13"]
    telIds += ["M_14"]
    telIds += ["M_15"]
    telIds += ["M_16"]
    telIds += ["M_17"]
    telIds += ["M_18"]
    telIds += ["M_19"]
    telIds += ["M_20"]
    telIds += ["M_21"]
    telIds += ["M_22"]
    telIds += ["M_23"]
    telIds += ["M_24"]
    telIds += ["S_0" ]
    telIds += ["S_1" ]
    telIds += ["S_2" ]
    telIds += ["S_3" ]
    telIds += ["S_4" ]
    telIds += ["S_5" ]
    telIds += ["S_6" ]
    telIds += ["S_7" ]
    telIds += ["S_8" ]
    telIds += ["S_9" ]
    telIds += ["S_10"]
    telIds += ["S_11"]
    telIds += ["S_12"]
    telIds += ["S_13"]
    telIds += ["S_14"]
    telIds += ["S_15"]
    telIds += ["S_16"]
    telIds += ["S_17"]
    telIds += ["S_18"]
    telIds += ["S_19"]
    telIds += ["S_20"]
    telIds += ["S_21"]
    telIds += ["S_22"]
    telIds += ["S_23"]
    telIds += ["S_24"]
    telIds += ["S_25"]
    telIds += ["S_26"]
    telIds += ["S_27"]
    telIds += ["S_28"]
    telIds += ["S_29"]
    telIds += ["S_30"]
    telIds += ["S_31"]
    telIds += ["S_32"]
    telIds += ["S_33"]
    telIds += ["S_34"]
    telIds += ["S_35"]
    telIds += ["S_36"]
    telIds += ["S_37"]
    telIds += ["S_38"]
    telIds += ["S_39"]
    telIds += ["S_40"]
    telIds += ["S_41"]
    telIds += ["S_42"]
    telIds += ["S_43"]
    telIds += ["S_44"]
    telIds += ["S_45"]
    telIds += ["S_46"]
    telIds += ["S_47"]
    telIds += ["S_48"]
    telIds += ["S_49"]
    telIds += ["S_50"]
    telIds += ["S_51"]
    telIds += ["S_52"]
    telIds += ["S_53"]
    telIds += ["S_54"]
    telIds += ["S_55"]
    telIds += ["S_56"]
    telIds += ["S_57"]
    telIds += ["S_58"]
    telIds += ["S_59"]
    telIds += ["S_60"]
    telIds += ["S_61"]
    telIds += ["S_62"]
    telIds += ["S_63"]
    telIds += ["S_64"]
    telIds += ["S_65"]
    telIds += ["S_66"]
    telIds += ["S_67"]
    telIds += ["S_68"]
    telIds += ["S_69"]

  # -----------------------------------------------------------------------------------------------------------
  # north
  # -----------------------------------------------------------------------------------------------------------
  if nsType == "N":
    telIds += ["L_0" ]
    telIds += ["L_1" ]
    telIds += ["L_2" ]
    telIds += ["L_3" ]
    telIds += ["M_0" ]
    telIds += ["M_1" ]
    telIds += ["M_2" ]
    telIds += ["M_3" ]
    telIds += ["M_4" ]
    telIds += ["M_5" ]
    telIds += ["M_6" ]
    telIds += ["M_7" ]
    telIds += ["M_8" ]
    telIds += ["M_9" ]
    telIds += ["M_10"]
    telIds += ["M_11"]
    telIds += ["M_12"]
    telIds += ["M_13"]
    telIds += ["M_14"]
  
  return telIds

telIds = dict()
telIds["N"] = initTelIds("N")
telIds["S"] = initTelIds("S")

def getTime():
  return int(time.time()*1e6)

# --------------------------------------------------------------------------------------------------
# color output
# --------------------------------------------------------------------------------------------------
def setColDict():
  ColBlue="\033[34m"        ; ColRed="\033[31m"         ; ColGreen="\033[32m"       ; ColDef="\033[0m"
  ColLightBlue="\033[94m"     ; ColYellow="\033[33m"      ; ColPurple="\033[35m"      ; ColCyan="\033[36m"
  ColUnderLine="\033[4;30m"     ; ColWhiteOnBlack="\33[40;37;1m"  ; ColWhiteOnRed="\33[41;37;1m"
  ColWhiteOnGreen="\33[42;37;1m"  ; ColWhiteOnYellow="\33[43;37;1m"

  def noCol    (msg): return '' if (str(msg) is '') else str(msg)
  def blue     (msg): return '' if (str(msg) is '') else ColBlue          +str(msg)+ColDef
  def red    (msg): return '' if (str(msg) is '') else ColRed           +str(msg)+ColDef
  def green    (msg): return '' if (str(msg) is '') else ColGreen         +str(msg)+ColDef
  def lBlue    (msg): return '' if (str(msg) is '') else ColLightBlue       +str(msg)+ColDef
  def yellow   (msg): return '' if (str(msg) is '') else ColYellow        +str(msg)+ColDef
  def purple   (msg): return '' if (str(msg) is '') else ColPurple        +str(msg)+ColDef
  def cyan     (msg): return '' if (str(msg) is '') else ColCyan          +str(msg)+ColDef
  def whtOnBlck  (msg): return '' if (str(msg) is '') else ColWhiteOnBlack      +str(msg)+ColDef
  def redOnBlck  (msg): return '' if (str(msg) is '') else ColWhiteOnBlack+ColRed   +str(msg)+ColDef
  def bluOnBlck  (msg): return '' if (str(msg) is '') else ColWhiteOnBlack+ColBlue  +str(msg)+ColDef
  def yellOnBlck (msg): return '' if (str(msg) is '') else ColWhiteOnBlack+ColYellow+str(msg)+ColDef
  def whtOnRed   (msg): return '' if (str(msg) is '') else ColWhiteOnRed      +str(msg)+ColDef
  def yellowOnRed(msg): return '' if (str(msg) is '') else ColWhiteOnRed+ColYellow  +str(msg)+ColDef
  def whtOnYellow(msg): return '' if (str(msg) is '') else ColWhiteOnYellow     +str(msg)+ColDef
  def whtOnGreen (msg): return '' if (str(msg) is '') else ColWhiteOnGreen      +str(msg)+ColDef

  colD = [dict(),dict()]

  colD[0][''  ] = noCol ; colD[1][''  ] = noCol    
  colD[0]['r' ] = noCol ; colD[1]['r' ] = red    
  colD[0]['g' ] = noCol ; colD[1]['g' ] = green    
  colD[0]['b' ] = noCol ; colD[1]['b' ] = blue     
  colD[0]['y' ] = noCol ; colD[1]['y' ] = yellow   
  colD[0]['p' ] = noCol ; colD[1]['p' ] = purple   
  colD[0]['c' ] = noCol ; colD[1]['c' ] = cyan     
  colD[0]['lb'] = noCol ; colD[1]['lb'] = lBlue    
  colD[0]['wb'] = noCol ; colD[1]['wb'] = whtOnBlck  
  colD[0]['rb'] = noCol ; colD[1]['rb'] = redOnBlck  
  colD[0]['bb'] = noCol ; colD[1]['bb'] = bluOnBlck  
  colD[0]['yb'] = noCol ; colD[1]['yb'] = yellOnBlck 
  colD[0]['wr'] = noCol ; colD[1]['wr'] = whtOnRed   
  colD[0]['yr'] = noCol ; colD[1]['yr'] = yellowOnRed
  colD[0]['wy'] = noCol ; colD[1]['wy'] = whtOnYellow
  colD[0]['wg'] = noCol ; colD[1]['wg'] = whtOnGreen 

  return colD

colD = setColDict()

class myLog():
  def __init__(self, name = '', title = '', doParseMsg = True, *args, **kwargs):
    self.doParseMsg = doParseMsg
    self.name = "root" if name is "" else name
    self.title = colD[useCol]['c']("" if title is "" else (" ["+title+"]" if useLogTitle else ""))
    self.log = logging.getLogger(self.name)

    # common lock for all loggers
    self.lock = myLock("myLog")

  def parseMsg(self, msgIn):
    if not self.doParseMsg:
      return msgIn

    # --------------------------------------------------------------------------------------------------
    # if the input is a list
    # --------------------------------------------------------------------------------------------------
    if isinstance(msgIn, list):
      msg = ""
      for msgNow in msgIn:
        # --------------------------------------------------------------------------------------------------
        #  if there is a list of messages
        # --------------------------------------------------------------------------------------------------
        if isinstance(msgNow, list):
          # list with one element
          if len(msgNow) == 1:
            if addMsgEleSpace and msg is not "": msg += " "
            msg += str(msgNow[0])
          # list with multiple elements
          elif len(msgNow) >= 2:
            # first element is a color indicator
            if msgNow[0] in colD[useCol]:
              colFunc = colD[useCol][msgNow[0]]
              # either can be one or more messages after the color indicator
              if len(msgNow) == 2: msgStr = str(msgNow[1])
              else:        msgStr  = (" ").join([ str(eleNow) for eleNow in msgNow[1:] ])
            # there is no color indicator, just a list of messages
            else:
              colFunc = colD[useCol]['']
              msgStr  = (" ").join([ str(eleNow) for eleNow in msgNow ])

            # compose the colored output from the (joined list of) messages(s)
            if addMsgEleSpace and msg is not "": msg += colFunc(" ")
            msg += colFunc(msgStr)
        
        # --------------------------------------------------------------------------------------------------
        # if there is a single message (non-list)
        # --------------------------------------------------------------------------------------------------
        else:
          if addMsgEleSpace and msg is not "": msg += " "
          msg += str(msgNow)

    # --------------------------------------------------------------------------------------------------
    # if the input is a simple element (non-list)
    # --------------------------------------------------------------------------------------------------
    else:
      msg = str(msgIn)
    
    # finally, send the output, with the optional title added
    # --------------------------------------------------------------------------------------------------
    return (msg + self.title)

  def debug(self, msgIn, *args, **kwargs):
    with self.lock:
      self.log.debug(self.parseMsg(msgIn), *args, **kwargs)

  def info(self, msgIn, *args, **kwargs):
    with self.lock:
      self.log.info(self.parseMsg(msgIn), *args, **kwargs)
  
  def warning(self, msgIn, *args, **kwargs):
    with self.lock:
      self.log.warning(self.parseMsg(msgIn), *args, **kwargs)
  
  def warn(self, msgIn, *args, **kwargs):
    with self.lock:
      self.log.warn(self.parseMsg(msgIn), *args, **kwargs)
  
  def error(self, msgIn, *args, **kwargs):
    with self.lock:
      self.log.error(self.parseMsg(msgIn), *args, **kwargs)
  
  def critical(self, msgIn, *args, **kwargs):
    with self.lock:
      self.log.critical(self.parseMsg(msgIn), *args, **kwargs)

# locker class by name
class myLock():
  locks = {}
  
  def __init__(self, name = '', checkEvery = None):
    self.name = "generic" if name is "" else name
    
    self.checkEvery = max(0.0001, min(0.5, (checkEvery if isinstance(checkEvery, numbers.Number) else 0.05)))
    self.maxChecks = max(5/self.checkEvery, 2)

    if not self.name in myLock.locks:
      myLock.locks[self.name] = False
  
  def __enter__(self):
    nChecked = 0
    while myLock.locks[self.name]:
      nChecked += 1
      if nChecked > self.maxChecks:
        raise Warning(" - could not get lock for "+self.name+" ...")
        break
      sleep(self.checkEvery)

    myLock.locks[self.name] = True

  def __exit__(self, type, value, traceback):
    myLock.locks[self.name] = False


mockSched('N')