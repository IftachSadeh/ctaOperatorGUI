import time
import ACS__POA
from ACS import CBDescIn
from Acspy.Clients.SimpleClient import PySimpleClient
import random
from utils import myLog
import threading

# acs client
client = PySimpleClient()

# get the components
t1_double = client.getComponent("TEST_JAVA_T1")
t2_double = client.getComponent("TEST_JAVA_T2")


class SimComp:
    def __init__(self, nsType):
        self.log = myLog(title=__name__)
        self.log.info([['y', " - SimComp - "], ['g', nsType]])

        t = threading.Thread(target=self.sim_loop)

        # set the thread to daemon for quicker termination
        t.daemon = True
        t.start()
        return

    def sim_loop(self):
        """
        changes the values on the properties every second
        """
        while True:
            # every second set a random value on the property
            t1_double.doubleRWProp.set_sync(random.random())
            t2_double.doubleRWProp.set_sync(random.random())
            time.sleep(1)
