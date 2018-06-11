import logging
import time
from time import sleep
from Acspy.Clients.SimpleClient import PySimpleClient

client = PySimpleClient()
supervisor = None

logging.basicConfig()
log = logging.getLogger()

while True:
  try:
    supervisor = client.getComponent("ArraySupervisor")
  except Exception as e:
    log.info(' - could not get supervisor ...'+str(e))
  
  log.info(' - I"m alive ... '+str(time.time()))
  
  sleep(15)

