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

class MockSched():
  # ------------------------------------------------------------------
  # 
  # ------------------------------------------------------------------
  def __init__(self, site_type):
    self.log = my_log(title=__name__)
    self.log.info([['y'," - MockSched - "],['g',site_type]])

    self.site_type = site_type
    self.tel_ids = tel_ids[site_type]

    self.debug =  False
    self.expire = 86400 # one day

    self.cycle_blocks = []
    self.acs_blocks = dict()
    self.acs_blocks['sched_block'] = dict()
    self.acs_blocks['metadata'] = dict()

    self.active_sched_block = 0

    self.client = PySimpleClient()
    self.supervisor = self.client.getComponent("ArraySupervisor")
    # print 'got ArraySupervisor ............'
    
    self.n_sched_block = [5, 15]
    self.max_n_obs_block = 7 if self.site_type == "N" else 32
    self.max_n_obs_block = min(self.max_n_obs_block, len(self.tel_ids))
    # self.max_n_obs_block = len(self.tel_ids)
    self.loop_sleep = 4

    self.az_min_max = [0, 360]
    self.zen_min_max_tel = [0, 70]
    self.zen_min_max_pnt = [0, 20]

    rnd_seed = getTime()
    rnd_seed = 10987268332
    self.rnd_gen = Random(rnd_seed)


    
    print 'xxxxxxxxxxx'
    active = self.supervisor.listSchedulingBlocks()
    print '-----',active

    self.cancel_sched_blocks(active[0])
    print 'sleep...'
    sleep(10)
    print 'check...'
    print '---',len(self.supervisor.getSbOperationStatus(active[0]).ob_statuses),'------------',self.supervisor.getSbOperationStatus(active[0]).ob_statuses
    print '---',self.supervisor.getSbOperationStatus(active[0]).ob_statuses[-1].status
    activeNow = self.supervisor.listSchedulingBlocks()
    print 'active now ....',activeNow



    # self.threads = []
    # run_event = threading.Event()
    # run_event.set()

    # t = threading.Thread(target=self.loop, args = (run_event,))
    # t.start()
    # self.threads.append(t)

    # try:
    #   while 1:
    #     sleep(.1)
    # except KeyboardInterrupt:
    #   run_event.clear()
    #   for t in self.threads:
    #     t.join()

    return

  # ------------------------------------------------------------------
  # 
  # ------------------------------------------------------------------
  def cancel_sched_blocks(self, sched_blk_id):
    class MyVoid(ACS__POA.CBvoid):
      def working (self, completion, desc):
        # print "bbbbbbbbbb Callback working",sched_blk_id
        return

      def done(self, completion, desc):
        # print "bbbbbbbbbbbbb Callback done",sched_blk_id
        return

    desc = CBDescIn(0L, 0L, 0L)
    cb = MyVoid() 

    self.log.info([['r'," ---- MockSched.cancel_sched_blocks() ... "],['g',sched_blk_id]])
    self.supervisor.cancelSchedulingBlock(sched_blk_id, self.client.activateOffShoot(cb), desc)
    self.log.info([['r'," ++++ MockSched.cancel_sched_blocks() ... "],['g',sched_blk_id]])
 
    return

  # ------------------------------------------------------------------
  # 
  # ------------------------------------------------------------------
  def cancel_zombie_sched_blocks(self, sched_block_ids=None):
    if sched_block_ids is None:
      try:
        active = self.supervisor.listSchedulingBlocks()
      except Exception as e:
        self.log.debug([['b',"- Exception - MockSched.listSchedulingBlocks: "],['r',e]])
        active = []
      sched_block_ids = [ x for x in active if x not in self.acs_blocks['sched_block'] ]


    sched_block_ids = active

    if len(sched_block_ids) == 0:
      return

    self.log.info([['r'," - MockSched.cancel_zombie_sched_blocks() ..."],['y',sched_block_ids]])
    for sched_block_id_now in sched_block_ids:
      self.cancel_sched_blocks(sched_block_id_now)
      # t = threading.Thread(target=self.cancel_sched_blocks,args=(sched_block_id_now,))
      # t.start()
      # t.join()
      # self.threads.append(t)

    return

  # ------------------------------------------------------------------
  # 
  # ------------------------------------------------------------------
  def init_block_cycle(self):
    self.log.info([['p'," - MockSched.init_block_cycle() ..."]])

    script_name = "guiACS_sched_blocks_script0"
    self.nCycles = [1,5]
    self.n_sched_block = 40
    self.max_n_obs_block = 1
    self.obs_block_seconds = 20

    # cancel sched_blocks which should have expired
    # self.cancel_zombie_sched_blocks()

    # init local bookkeeping objects
    self.cycle_blocks = []
    self.acs_blocks = dict()
    self.acs_blocks['sched_block'] = dict()
    self.acs_blocks['metadata'] = dict()

    nCycles = self.rnd_gen.randint(self.nCycles[0], self.nCycles[1])
    for n_cycle_now in range(nCycles):
      base_name = str(getTime())+"_"

      tel_ids = copy.deepcopy(self.tel_ids)
      n_tels = len(tel_ids)
      # n_sched_blocks = self.rnd_gen.randint(1, min(n_tels, self.n_sched_block))
      n_sched_blocks = self.n_sched_block

      # generate random target/pointing ids
      target_pos = dict()
      blockTrgs = dict()
      blockTrgPnt = dict()
      n_trgs = self.rnd_gen.randint(1, n_sched_blocks)
      for n_trg_try in range(n_sched_blocks):
        n_trg_now = self.rnd_gen.randint(0, n_trgs-1)
        if n_trg_now not in blockTrgs:
          blockTrgs[n_trg_now] = [ n_trg_try ]
        else:
          blockTrgs[n_trg_now].append(n_trg_try)
        
        blockTrgPnt[n_trg_try] = { "n_trg":n_trg_now, "n_pnt":len(blockTrgs[n_trg_now])-1 }

      cycle_blocks = []
      for n_sched_block_now in range(n_sched_blocks):
        sched_block_id = "schBlock_"+base_name+str(n_sched_block_now)

        n_tel_now = self.rnd_gen.randint(1, max(1, len(tel_ids) - n_sched_blocks))

        # sched_tel_ids = random.sample(tel_ids, n_tel_now)
        # tel_ids = [x for x in tel_ids if x not in sched_tel_ids]

        sub_arr = []
        # for sched_tel_id_now in sched_tel_ids:        
        #   tel_type = sb.SST if sched_tel_id_now[0] == 'S' else sb.MST if sched_tel_id_now[0] == 'M' else sb.LST
        #   sub_arr += [ sb.Telescope(sched_tel_id_now, tel_type) ]

        sched_conf = sb.Configuration(
          sb.InstrumentConfiguration(
            sb.PointingMode(2,sb._divergent(2)),
            sb.Subarray([], sub_arr)
          ),
          "camera",
          "rta"
        )

        n_obs_blocks = self.rnd_gen.randint(1, self.max_n_obs_block)
        
        n_trg = blockTrgPnt[n_sched_block_now]["n_trg"]
        n_pnt = blockTrgPnt[n_sched_block_now]["n_pnt"]

        if not n_trg in target_pos:
          target_pos[n_trg] = [
            (self.rnd_gen.random() * (self.az_min_max[1] - self.az_min_max[0])) + self.az_min_max[0] ,
            (self.rnd_gen.random() * (self.zen_min_max_tel[1] - self.zen_min_max_tel[0])) + self.zen_min_max_tel[0]
          ]

        target_id = "target_"+str(n_trg)

        obs_blocks = []
        for n_blockNow in range(n_obs_blocks):
          obs_block_id = "obs_block_"+str(getTime())

          point_pos = copy.deepcopy(target_pos[n_trg])
          point_pos[0] += (self.rnd_gen.random() - 0.5) * 10
          point_pos[1] += (self.rnd_gen.random() - 0.5) * 10

          if point_pos[0] > self.az_min_max[1]:
            point_pos[0] -= 360
          elif point_pos[0] < self.az_min_max[0]:
            point_pos[0] += 360

          obs_coords = sb.Coordinates(2,sb.HorizontalCoordinates(target_pos[n_trg][1],target_pos[n_trg][0]))
          # obs_coords = sb.Coordinates(3,sb.GalacticCoordinates(target_pos[n_trg][1],target_pos[n_trg][0]))
          obs_mode = sb.ObservingMode(sb.Slewing(1), sb.ObservingType(2,sb.GridSurvey(1,1,1)))
          obs_source = sb.Source(target_id, sb.placeholder, sb.High, sb.RegionOfInterest(100), obs_mode, obs_coords)
          obs_conds = sb.ObservingConditions(sb.DateTime(1), self.obs_block_seconds, 1, sb.Quality(1, 1, 1), sb.Weather(1, 1, 1, 1))
          obs_block = sb.ObservationBlock(obs_block_id, obs_source, obs_conds, script_name, 0)

          obs_blocks += [ obs_block ]

          # temporary way to store meta-data
          # should be replaced by global coordinate access function
          self.acs_blocks['metadata'][obs_block_id+"_"+"point_pos"] = point_pos

        sched_block = sb.SchedulingBlock(sched_block_id, sb.Proposal("proposalId"), sched_conf, obs_blocks)

        cycle_blocks.append(sched_block)

        self.acs_blocks['sched_block'][sched_block_id] = sched_block

      self.cycle_blocks.append(cycle_blocks)


    return

  # ------------------------------------------------------------------
  # move one from wait to run
  # ------------------------------------------------------------------
  def submit_block_cycle(self):
    self.log.info([['g'," - starting MockSched.submit_block_cycle ..."]])

    if len(self.cycle_blocks) >= self.active_sched_block:
      self.active_sched_block = 0
      self.init_block_cycle()

    # grab the current sched_block from the queue
    blockCycle = self.cycle_blocks[self.active_sched_block]
    self.active_sched_block += 1

    # submit the scheduling blocks
    self.log.info([['g'," - submitting ..."]])
    for sched_block in blockCycle:
      try:
        self.log.info([['y'," --- try putSchedulingBlock ",sched_block.id]])
        complt = self.supervisor.putSchedulingBlock(sched_block)
      except Exception as e:
        self.log.debug([['b',"- Exception - MockSched.putSchedulingBlock: "],['r',e]])

    self.log.info([['y'," ----- try putSchedulingBlock done !"]])
    return

  # ------------------------------------------------------------------
  # move one from wait to run
  # ------------------------------------------------------------------
  def check_sched_blocks(self):
    self.log.debug([['b'," - starting MockSched.check_sched_blocks ..."]])

    try:
      active = self.supervisor.listSchedulingBlocks()
    except Exception as e:
      self.log.debug([['b',"- Exception - MockSched.listSchedulingBlocks: "],['r',e]])
      active = []

    active = [ x for x in active if x in self.acs_blocks['sched_block'] ]
    
    self.log.debug([['b'," --- got ",len(active)," active blocks"]])
    
    # for block_name in active:
    #   status = self.supervisor.getSchedulingBlockStatus(block_name)
    #   opstatus = self.supervisor.getSbOperationStatus(block_name)
    #   self.log.info([['y'," - active_scheduling_blocks - "],['g',active,'-> '],['y',status,' ']])
      
    #   for nob in range(len(opstatus.ob_statuses)):
    #     phases = opstatus.ob_statuses[nob].phases
    #     # for p in phases:
    #     #   self.log.info([['y'," -- phases - ",block_name,' ',opstatus.ob_statuses[nob].id,' ',opstatus.ob_statuses[nob].status,' '],['g',p.heartbeat_counter,' ',p.name,' ',p.status,' ',p.progress_message]])
    #     #   break

    return len(active)


  # ------------------------------------------------------------------
  # 
  # ------------------------------------------------------------------
  def loop(self, run_event):
    self.log.info([['g'," - starting MockSched.loop ..."]])
    
    self.submit_block_cycle()

    while run_event.is_set():
      n_sched_blocks = self.check_sched_blocks()
      self.log.info([['g'," - will now wait for 5 sec ..."]])
      sleep(5)
      self.log.info([['g'," - will now try to cancel all ..."]])
      self.cancel_zombie_sched_blocks()

      if n_sched_blocks == 0:
        self.submit_block_cycle()

      sleep(self.loop_sleep)
    
    return





















# ------------------------------------------------------------------
# ignore everything below .....
# ignore everything below .....
# ignore everything below .....
# ------------------------------------------------------------------

import logging
import numbers
import numpy as np
import time
useCol = 1 #; useCol = 0
use_log_title = False
add_msg_ele_space = False
no_sub_arr_name = "empty_sub_array"
inst_pos_0 = [0, 90]
has_acs = True

# ------------------------------------------------------------------
# different databases/configurations for north or south
# ------------------------------------------------------------------
def initTelIds(site_type):
  tel_ids = []
  # ------------------------------------------------------------------
  # south
  # ------------------------------------------------------------------
  if site_type == "S":
    tel_ids += ["L_0" ]
    tel_ids += ["L_1" ]
    tel_ids += ["L_2" ]
    tel_ids += ["L_3" ]
    tel_ids += ["M_0" ]
    tel_ids += ["M_1" ]
    tel_ids += ["M_2" ]
    tel_ids += ["M_3" ]
    tel_ids += ["M_4" ]
    tel_ids += ["M_5" ]
    tel_ids += ["M_6" ]
    tel_ids += ["M_7" ]
    tel_ids += ["M_8" ]
    tel_ids += ["M_9" ]
    tel_ids += ["M_10"]
    tel_ids += ["M_11"]
    tel_ids += ["M_12"]
    tel_ids += ["M_13"]
    tel_ids += ["M_14"]
    tel_ids += ["M_15"]
    tel_ids += ["M_16"]
    tel_ids += ["M_17"]
    tel_ids += ["M_18"]
    tel_ids += ["M_19"]
    tel_ids += ["M_20"]
    tel_ids += ["M_21"]
    tel_ids += ["M_22"]
    tel_ids += ["M_23"]
    tel_ids += ["M_24"]
    tel_ids += ["S_0" ]
    tel_ids += ["S_1" ]
    tel_ids += ["S_2" ]
    tel_ids += ["S_3" ]
    tel_ids += ["S_4" ]
    tel_ids += ["S_5" ]
    tel_ids += ["S_6" ]
    tel_ids += ["S_7" ]
    tel_ids += ["S_8" ]
    tel_ids += ["S_9" ]
    tel_ids += ["S_10"]
    tel_ids += ["S_11"]
    tel_ids += ["S_12"]
    tel_ids += ["S_13"]
    tel_ids += ["S_14"]
    tel_ids += ["S_15"]
    tel_ids += ["S_16"]
    tel_ids += ["S_17"]
    tel_ids += ["S_18"]
    tel_ids += ["S_19"]
    tel_ids += ["S_20"]
    tel_ids += ["S_21"]
    tel_ids += ["S_22"]
    tel_ids += ["S_23"]
    tel_ids += ["S_24"]
    tel_ids += ["S_25"]
    tel_ids += ["S_26"]
    tel_ids += ["S_27"]
    tel_ids += ["S_28"]
    tel_ids += ["S_29"]
    tel_ids += ["S_30"]
    tel_ids += ["S_31"]
    tel_ids += ["S_32"]
    tel_ids += ["S_33"]
    tel_ids += ["S_34"]
    tel_ids += ["S_35"]
    tel_ids += ["S_36"]
    tel_ids += ["S_37"]
    tel_ids += ["S_38"]
    tel_ids += ["S_39"]
    tel_ids += ["S_40"]
    tel_ids += ["S_41"]
    tel_ids += ["S_42"]
    tel_ids += ["S_43"]
    tel_ids += ["S_44"]
    tel_ids += ["S_45"]
    tel_ids += ["S_46"]
    tel_ids += ["S_47"]
    tel_ids += ["S_48"]
    tel_ids += ["S_49"]
    tel_ids += ["S_50"]
    tel_ids += ["S_51"]
    tel_ids += ["S_52"]
    tel_ids += ["S_53"]
    tel_ids += ["S_54"]
    tel_ids += ["S_55"]
    tel_ids += ["S_56"]
    tel_ids += ["S_57"]
    tel_ids += ["S_58"]
    tel_ids += ["S_59"]
    tel_ids += ["S_60"]
    tel_ids += ["S_61"]
    tel_ids += ["S_62"]
    tel_ids += ["S_63"]
    tel_ids += ["S_64"]
    tel_ids += ["S_65"]
    tel_ids += ["S_66"]
    tel_ids += ["S_67"]
    tel_ids += ["S_68"]
    tel_ids += ["S_69"]

  # ------------------------------------------------------------------
  # north
  # ------------------------------------------------------------------
  if site_type == "N":
    tel_ids += ["L_0" ]
    tel_ids += ["L_1" ]
    tel_ids += ["L_2" ]
    tel_ids += ["L_3" ]
    tel_ids += ["M_0" ]
    tel_ids += ["M_1" ]
    tel_ids += ["M_2" ]
    tel_ids += ["M_3" ]
    tel_ids += ["M_4" ]
    tel_ids += ["M_5" ]
    tel_ids += ["M_6" ]
    tel_ids += ["M_7" ]
    tel_ids += ["M_8" ]
    tel_ids += ["M_9" ]
    tel_ids += ["M_10"]
    tel_ids += ["M_11"]
    tel_ids += ["M_12"]
    tel_ids += ["M_13"]
    tel_ids += ["M_14"]
  
  return tel_ids

tel_ids = dict()
tel_ids["N"] = initTelIds("N")
tel_ids["S"] = initTelIds("S")

def getTime():
  return int(time.time()*1e6)

# --------------------------------------------------------------------------------------------------
# color output
# --------------------------------------------------------------------------------------------------
def setColDict():
  col_blue="\033[34m"        ; col_red="\033[31m"         ; ColGreen="\033[32m"       ; ColDef="\033[0m"
  ColLightBlue="\033[94m"     ; col_yellow="\033[33m"      ; ColPurple="\033[35m"      ; ColCyan="\033[36m"
  ColUnderLine="\033[4;30m"     ; ColWhiteOnBlack="\33[40;37;1m"  ; ColWhiteOnRed="\33[41;37;1m"
  ColWhiteOnGreen="\33[42;37;1m"  ; ColWhiteOnYellow="\33[43;37;1m"

  def no_color    (msg): return '' if (str(msg) is '') else str(msg)
  def blue     (msg): return '' if (str(msg) is '') else col_blue          +str(msg)+ColDef
  def red    (msg): return '' if (str(msg) is '') else col_red           +str(msg)+ColDef
  def green    (msg): return '' if (str(msg) is '') else ColGreen         +str(msg)+ColDef
  def light_blue    (msg): return '' if (str(msg) is '') else ColLightBlue       +str(msg)+ColDef
  def yellow   (msg): return '' if (str(msg) is '') else col_yellow        +str(msg)+ColDef
  def purple   (msg): return '' if (str(msg) is '') else ColPurple        +str(msg)+ColDef
  def cyan     (msg): return '' if (str(msg) is '') else ColCyan          +str(msg)+ColDef
  def white_on_black  (msg): return '' if (str(msg) is '') else ColWhiteOnBlack      +str(msg)+ColDef
  def red_on_black  (msg): return '' if (str(msg) is '') else ColWhiteOnBlack+col_red   +str(msg)+ColDef
  def blue_on_black  (msg): return '' if (str(msg) is '') else ColWhiteOnBlack+col_blue  +str(msg)+ColDef
  def yellow_on_black (msg): return '' if (str(msg) is '') else ColWhiteOnBlack+col_yellow+str(msg)+ColDef
  def white_on_red   (msg): return '' if (str(msg) is '') else ColWhiteOnRed      +str(msg)+ColDef
  def yellow_on_red(msg): return '' if (str(msg) is '') else ColWhiteOnRed+col_yellow  +str(msg)+ColDef
  def white_on_yellow(msg): return '' if (str(msg) is '') else ColWhiteOnYellow     +str(msg)+ColDef
  def white_on_green (msg): return '' if (str(msg) is '') else ColWhiteOnGreen      +str(msg)+ColDef

  colD = [dict(),dict()]

  colD[0][''  ] = no_color ; colD[1][''  ] = no_color    
  colD[0]['r' ] = no_color ; colD[1]['r' ] = red    
  colD[0]['g' ] = no_color ; colD[1]['g' ] = green    
  colD[0]['b' ] = no_color ; colD[1]['b' ] = blue     
  colD[0]['y' ] = no_color ; colD[1]['y' ] = yellow   
  colD[0]['p' ] = no_color ; colD[1]['p' ] = purple   
  colD[0]['c' ] = no_color ; colD[1]['c' ] = cyan     
  colD[0]['lb'] = no_color ; colD[1]['lb'] = light_blue    
  colD[0]['wb'] = no_color ; colD[1]['wb'] = white_on_black  
  colD[0]['rb'] = no_color ; colD[1]['rb'] = red_on_black  
  colD[0]['bb'] = no_color ; colD[1]['bb'] = blue_on_black  
  colD[0]['yb'] = no_color ; colD[1]['yb'] = yellow_on_black 
  colD[0]['wr'] = no_color ; colD[1]['wr'] = white_on_red   
  colD[0]['yr'] = no_color ; colD[1]['yr'] = yellow_on_red
  colD[0]['wy'] = no_color ; colD[1]['wy'] = white_on_yellow
  colD[0]['wg'] = no_color ; colD[1]['wg'] = white_on_green 

  return colD

colD = setColDict()

class my_log():
  def __init__(self, name = '', title = '', do_parse_msg = True, *args, **kwargs):
    self.do_parse_msg = do_parse_msg
    self.name = "root" if name is "" else name
    self.title = colD[useCol]['c']("" if title is "" else (" ["+title+"]" if use_log_title else ""))
    self.log = logging.getLogger(self.name)

    # common lock for all loggers
    self.lock = my_lock("my_log")

  def parse_msg(self, msg_in):
    if not self.do_parse_msg:
      return msg_in

    # --------------------------------------------------------------------------------------------------
    # if the input is a list
    # --------------------------------------------------------------------------------------------------
    if isinstance(msg_in, list):
      msg = ""
      for msg_now in msg_in:
        # --------------------------------------------------------------------------------------------------
        #  if there is a list of messages
        # --------------------------------------------------------------------------------------------------
        if isinstance(msg_now, list):
          # list with one element
          if len(msg_now) == 1:
            if add_msg_ele_space and msg is not "": msg += " "
            msg += str(msg_now[0])
          # list with multiple elements
          elif len(msg_now) >= 2:
            # first element is a color indicator
            if msg_now[0] in colD[useCol]:
              color_func = colD[useCol][msg_now[0]]
              # either can be one or more messages after the color indicator
              if len(msg_now) == 2: msg_str = str(msg_now[1])
              else:        msg_str  = (" ").join([ str(ele_now) for ele_now in msg_now[1:] ])
            # there is no color indicator, just a list of messages
            else:
              color_func = colD[useCol]['']
              msg_str  = (" ").join([ str(ele_now) for ele_now in msg_now ])

            # compose the colored output from the (joined list of) messages(s)
            if add_msg_ele_space and msg is not "": msg += color_func(" ")
            msg += color_func(msg_str)
        
        # --------------------------------------------------------------------------------------------------
        # if there is a single message (non-list)
        # --------------------------------------------------------------------------------------------------
        else:
          if add_msg_ele_space and msg is not "": msg += " "
          msg += str(msg_now)

    # --------------------------------------------------------------------------------------------------
    # if the input is a simple element (non-list)
    # --------------------------------------------------------------------------------------------------
    else:
      msg = str(msg_in)
    
    # finally, send the output, with the optional title added
    # --------------------------------------------------------------------------------------------------
    return (msg + self.title)

  def debug(self, msg_in, *args, **kwargs):
    with self.lock:
      self.log.debug(self.parse_msg(msg_in), *args, **kwargs)

  def info(self, msg_in, *args, **kwargs):
    with self.lock:
      self.log.info(self.parse_msg(msg_in), *args, **kwargs)
  
  def warning(self, msg_in, *args, **kwargs):
    with self.lock:
      self.log.warning(self.parse_msg(msg_in), *args, **kwargs)
  
  def warn(self, msg_in, *args, **kwargs):
    with self.lock:
      self.log.warn(self.parse_msg(msg_in), *args, **kwargs)
  
  def error(self, msg_in, *args, **kwargs):
    with self.lock:
      self.log.error(self.parse_msg(msg_in), *args, **kwargs)
  
  def critical(self, msg_in, *args, **kwargs):
    with self.lock:
      self.log.critical(self.parse_msg(msg_in), *args, **kwargs)

# locker class by name
class my_lock():
  locks = {}
  
  def __init__(self, name = '', seconds_to_check = None):
    self.name = "generic" if name is "" else name
    
    self.seconds_to_check = max(0.0001, min(0.5, (seconds_to_check if isinstance(seconds_to_check, numbers.Number) else 0.05)))
    self.n_max_checks = max(5/self.seconds_to_check, 2)

    if not self.name in my_lock.locks:
      my_lock.locks[self.name] = False
  
  def __enter__(self):
    n_checked = 0
    while my_lock.locks[self.name]:
      n_checked += 1
      if n_checked > self.n_max_checks:
        raise Warning(" - could not get lock for "+self.name+" ...")
      sleep(self.seconds_to_check)

    my_lock.locks[self.name] = True

  def __exit__(self, type, value, traceback):
    my_lock.locks[self.name] = False


MockSched('N')
