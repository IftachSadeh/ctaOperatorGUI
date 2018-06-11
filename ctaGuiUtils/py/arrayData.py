import gevent
from gevent import sleep
# from gevent.coros import BoundedSemaphore
import copy
from math import sqrt, ceil, floor
import utils
from utils import myLog, Assert, getTime


# -----------------------------------------------------------------------------------------------------------
# physical position of telescopes etc.
# -----------------------------------------------------------------------------------------------------------
class arrayData():
    telPosD = None
    telHealthD = None

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def __init__(self, lock=None, *args, **kwargs):
        self.log = myLog(title=__name__)

        def init():
            self.log.debug([
                ['y', " - initializing arrayData - "],
                ['g', 'initTelPos()'], ['y', " ..."]
            ])
            self.initTelPos()
            self.initTelHealth()

        if arrayData.telPosD is None:
            if lock is not None:
                with lock:
                    init()
            else:
                init()

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------

    def initTelPos(self):
        arrayData.telPosD = dict()

        # -----------------------------------------------------------------------------------------------------------
        # south
        # -----------------------------------------------------------------------------------------------------------
        if utils.nsType == "S":
            idNow = "L_0"
            arrayData.telPosD[idNow] = {"x":  65, "y": -20, "t": "LST"}
            idNow = "L_1"
            arrayData.telPosD[idNow] = {"x": -65, "y": -20, "t": "LST"}
            idNow = "L_2"
            arrayData.telPosD[idNow] = {"x":  0, "y":  80, "t": "LST"}
            idNow = "L_3"
            arrayData.telPosD[idNow] = {"x":  0, "y": -110, "t": "LST"}
            idNow = "M_4"
            arrayData.telPosD[idNow] = {"x": -151.2, "y":  0, "t": "MST"}
            idNow = "M_5"
            arrayData.telPosD[idNow] = {"x":  151.2, "y":  0, "t": "MST"}
            idNow = "M_6"
            arrayData.telPosD[idNow] = {"x": -105.6, "y": -136.656, "t": "MST"}
            idNow = "M_7"
            arrayData.telPosD[idNow] = {"x":  105.6, "y": -136.656, "t": "MST"}
            idNow = "M_8"
            arrayData.telPosD[idNow] = {"x": -85.6, "y": -136.656, "t": "MST"}
            idNow = "M_9"
            arrayData.telPosD[idNow] = {"x":  85.6, "y": -136.656, "t": "MST"}
            idNow = "M_10"
            arrayData.telPosD[idNow] = {"x":  0, "y": -308.41, "t": "MST"}
            idNow = "M_11"
            arrayData.telPosD[idNow] = {"x":  0, "y":  308.41, "t": "MST"}
            idNow = "M_12"
            arrayData.telPosD[idNow] = {
                "x": -238.474, "y": -154.205, "t": "MST"}
            idNow = "M_13"
            arrayData.telPosD[idNow] = {
                "x":  238.474, "y": -154.205, "t": "MST"}
            idNow = "M_14"
            arrayData.telPosD[idNow] = {
                "x": -238.474, "y":  154.205, "t": "MST"}
            idNow = "M_15"
            arrayData.telPosD[idNow] = {
                "x":  238.474, "y":  154.205, "t": "MST"}
            idNow = "M_16"
            arrayData.telPosD[idNow] = {"x":  0, "y": -582.17, "t": "MST"}
            idNow = "M_17"
            arrayData.telPosD[idNow] = {"x":  0, "y":  582.17, "t": "MST"}
            idNow = "M_18"
            arrayData.telPosD[idNow] = {
                "x":  450.155, "y": -291.085, "t": "MST"}
            idNow = "M_19"
            arrayData.telPosD[idNow] = {
                "x": -450.155, "y": -291.085, "t": "MST"}
            idNow = "M_20"
            arrayData.telPosD[idNow] = {
                "x": -450.155, "y":  291.085, "t": "MST"}
            idNow = "M_21"
            arrayData.telPosD[idNow] = {
                "x":  450.155, "y":  291.085, "t": "MST"}
            idNow = "M_22"
            arrayData.telPosD[idNow] = {
                "x": -162.621, "y": -345.468, "t": "MST"}
            idNow = "M_23"
            arrayData.telPosD[idNow] = {
                "x":  162.621, "y": -345.468, "t": "MST"}
            idNow = "M_24"
            arrayData.telPosD[idNow] = {
                "x": -162.621, "y":  315.468, "t": "MST"}
            idNow = "M_25"
            arrayData.telPosD[idNow] = {
                "x":  162.621, "y":  315.468, "t": "MST"}
            idNow = "M_26"
            arrayData.telPosD[idNow] = {"x": -325.242, "y":  0, "t": "MST"}
            idNow = "M_27"
            arrayData.telPosD[idNow] = {"x":  325.242, "y":  0, "t": "MST"}
            idNow = "M_28"
            arrayData.telPosD[idNow] = {"x":  0, "y":  0, "t": "MST"}
            idNow = "S_29"
            arrayData.telPosD[idNow] = {"x": -723.527, "y":  0, "t": "SST"}
            idNow = "S_30"
            arrayData.telPosD[idNow] = {"x":  723.527, "y":  0, "t": "SST"}
            idNow = "S_31"
            arrayData.telPosD[idNow] = {"x": -100, "y": -494.469, "t": "SST"}
            idNow = "S_32"
            arrayData.telPosD[idNow] = {"x":  100, "y": -494.469, "t": "SST"}
            idNow = "S_33"
            arrayData.telPosD[idNow] = {"x": -100, "y":  494.469, "t": "SST"}
            idNow = "S_34"
            arrayData.telPosD[idNow] = {"x":  100, "y":  494.469, "t": "SST"}
            idNow = "S_35"
            arrayData.telPosD[idNow] = {
                "x":  424.824, "y": -164.823, "t": "SST"}
            idNow = "S_36"
            arrayData.telPosD[idNow] = {
                "x": -424.824, "y": -164.823, "t": "SST"}
            idNow = "S_37"
            arrayData.telPosD[idNow] = {
                "x": -424.824, "y":  164.823, "t": "SST"}
            idNow = "S_38"
            arrayData.telPosD[idNow] = {
                "x":  424.824, "y":  164.823, "t": "SST"}
            idNow = "S_39"
            arrayData.telPosD[idNow] = {"x": -519.795, "y":  0, "t": "SST"}
            idNow = "S_40"
            arrayData.telPosD[idNow] = {"x":  519.795, "y":  0, "t": "SST"}
            idNow = "S_41"
            arrayData.telPosD[idNow] = {
                "x":  569.216, "y": -662.533, "t": "SST"}
            idNow = "S_42"
            arrayData.telPosD[idNow] = {
                "x": -569.216, "y": -662.533, "t": "SST"}
            idNow = "S_43"
            arrayData.telPosD[idNow] = {
                "x":  569.216, "y":  662.533, "t": "SST"}
            idNow = "S_44"
            arrayData.telPosD[idNow] = {
                "x": -569.216, "y":  662.533, "t": "SST"}
            idNow = "S_45"
            arrayData.telPosD[idNow] = {
                "x": -796.903, "y": -220.844, "t": "SST"}
            idNow = "S_46"
            arrayData.telPosD[idNow] = {
                "x":  796.903, "y": -220.844, "t": "SST"}
            idNow = "S_47"
            arrayData.telPosD[idNow] = {
                "x":  796.903, "y":  220.844, "t": "SST"}
            idNow = "S_48"
            arrayData.telPosD[idNow] = {
                "x": -796.903, "y":  220.844, "t": "SST"}
            idNow = "S_49"
            arrayData.telPosD[idNow] = {
                "x": -227.687, "y": -883.377, "t": "SST"}
            idNow = "S_50"
            arrayData.telPosD[idNow] = {
                "x":  227.687, "y": -883.377, "t": "SST"}
            idNow = "S_51"
            arrayData.telPosD[idNow] = {
                "x": -227.687, "y":  883.377, "t": "SST"}
            idNow = "S_52"
            arrayData.telPosD[idNow] = {
                "x":  227.687, "y":  883.377, "t": "SST"}
            idNow = "S_53"
            arrayData.telPosD[idNow] = {"x": -944.301, "y":  0, "t": "SST"}
            idNow = "S_54"
            arrayData.telPosD[idNow] = {"x":  944.301, "y":  0, "t": "SST"}
            idNow = "S_55"
            arrayData.telPosD[idNow] = {
                "x":  472.151, "y": -915.923, "t": "SST"}
            idNow = "S_56"
            arrayData.telPosD[idNow] = {
                "x": -472.151, "y": -915.923, "t": "SST"}
            idNow = "S_57"
            arrayData.telPosD[idNow] = {
                "x": -472.151, "y":  915.923, "t": "SST"}
            idNow = "S_58"
            arrayData.telPosD[idNow] = {
                "x":  472.151, "y":  915.923, "t": "SST"}
            idNow = "S_59"
            arrayData.telPosD[idNow] = {
                "x": -971.21, "y": -471.012, "t": "SST"}
            idNow = "S_60"
            arrayData.telPosD[idNow] = {
                "x":  971.21, "y": -471.012, "t": "SST"}
            idNow = "S_61"
            arrayData.telPosD[idNow] = {
                "x": -971.21, "y":  471.012, "t": "SST"}
            idNow = "S_62"
            arrayData.telPosD[idNow] = {
                "x":  971.21, "y":  471.012, "t": "SST"}
            idNow = "S_63"
            arrayData.telPosD[idNow] = {
                "x":  849.809, "y": -706.518, "t": "SST"}
            idNow = "S_64"
            arrayData.telPosD[idNow] = {
                "x": -849.809, "y": -706.518, "t": "SST"}
            idNow = "S_65"
            arrayData.telPosD[idNow] = {
                "x": -849.809, "y":  706.518, "t": "SST"}
            idNow = "S_66"
            arrayData.telPosD[idNow] = {
                "x":  849.809, "y":  706.518, "t": "SST"}
            idNow = "S_67"
            arrayData.telPosD[idNow] = {
                "x":  369.912, "y": -1195.98, "t": "SST"}
            idNow = "S_68"
            arrayData.telPosD[idNow] = {
                "x": -369.912, "y": -1195.98, "t": "SST"}
            idNow = "S_69"
            arrayData.telPosD[idNow] = {
                "x": -369.912, "y":  1195.98, "t": "SST"}
            idNow = "S_70"
            arrayData.telPosD[idNow] = {
                "x":  369.912, "y":  1195.98, "t": "SST"}
            idNow = "S_71"
            arrayData.telPosD[idNow] = {
                "x":  1109.73, "y": -239.197, "t": "SST"}
            idNow = "S_72"
            arrayData.telPosD[idNow] = {
                "x": -1109.73, "y": -239.197, "t": "SST"}
            idNow = "S_73"
            arrayData.telPosD[idNow] = {
                "x": -1109.73, "y":  239.197, "t": "SST"}
            idNow = "S_74"
            arrayData.telPosD[idNow] = {
                "x":  1109.73, "y":  239.197, "t": "SST"}
            idNow = "S_75"
            arrayData.telPosD[idNow] = {
                "x":  739.823, "y": -956.787, "t": "SST"}
            idNow = "S_76"
            arrayData.telPosD[idNow] = {
                "x": -739.823, "y": -956.787, "t": "SST"}
            idNow = "S_77"
            arrayData.telPosD[idNow] = {
                "x": -739.823, "y":  956.787, "t": "SST"}
            idNow = "S_78"
            arrayData.telPosD[idNow] = {
                "x":  739.823, "y":  956.787, "t": "SST"}
            idNow = "S_79"
            arrayData.telPosD[idNow] = {
                "x":  403.739, "y": -391.606, "t": "SST"}
            idNow = "S_80"
            arrayData.telPosD[idNow] = {
                "x": -403.739, "y": -391.606, "t": "SST"}
            idNow = "S_81"
            arrayData.telPosD[idNow] = {
                "x": -403.739, "y":  391.606, "t": "SST"}
            idNow = "S_82"
            arrayData.telPosD[idNow] = {
                "x":  403.739, "y":  391.606, "t": "SST"}
            idNow = "S_83"
            arrayData.telPosD[idNow] = {
                "x":  318.611, "y": -618.073, "t": "SST"}
            idNow = "S_84"
            arrayData.telPosD[idNow] = {
                "x": -318.611, "y": -618.073, "t": "SST"}
            idNow = "S_85"
            arrayData.telPosD[idNow] = {
                "x": -318.611, "y":  618.073, "t": "SST"}
            idNow = "S_86"
            arrayData.telPosD[idNow] = {
                "x":  318.611, "y":  618.073, "t": "SST"}
            idNow = "S_87"
            arrayData.telPosD[idNow] = {
                "x":  673.186, "y": -435.304, "t": "SST"}
            idNow = "S_88"
            arrayData.telPosD[idNow] = {
                "x": -673.186, "y": -435.304, "t": "SST"}
            idNow = "S_89"
            arrayData.telPosD[idNow] = {
                "x": -673.186, "y":  435.304, "t": "SST"}
            idNow = "S_90"
            arrayData.telPosD[idNow] = {
                "x":  673.186, "y":  435.304, "t": "SST"}
            idNow = "S_91"
            arrayData.telPosD[idNow] = {"x":  168.9, "y": -225.5, "t": "SST"}
            idNow = "S_92"
            arrayData.telPosD[idNow] = {"x": -168.9, "y": -225.5, "t": "SST"}
            idNow = "S_93"
            arrayData.telPosD[idNow] = {"x": -158.9, "y":  205.5, "t": "SST"}
            idNow = "S_94"
            arrayData.telPosD[idNow] = {"x":  158.9, "y":  205.5, "t": "SST"}
            idNow = "S_95"
            arrayData.telPosD[idNow] = {"x":  0, "y":  1100, "t": "SST"}
            idNow = "S_96"
            arrayData.telPosD[idNow] = {"x":  0, "y": -1100, "t": "SST"}
            idNow = "S_97"
            arrayData.telPosD[idNow] = {"x":  0, "y": -820, "t": "SST"}
            idNow = "S_98"
            arrayData.telPosD[idNow] = {"x":  0, "y":  820, "t": "SST"}

            # -----------------------------------------------------------------------------------------------------------
            #
            # -----------------------------------------------------------------------------------------------------------
            idNow = "M_6"
            arrayData.telPosD[idNow]["x"] -= 50
            idNow = "M_7"
            arrayData.telPosD[idNow]["x"] += 50
            idNow = "M_8"
            arrayData.telPosD[idNow]["x"] += 5
            idNow = "M_9"
            arrayData.telPosD[idNow]["x"] -= 5

            for idNow, eleNow in arrayData.telPosD.iteritems():
                ref = sqrt(eleNow['x']*eleNow['x']+eleNow['y']*eleNow['y'])
                if ref > 900:
                    addFact = 0.50
                elif ref > 700:
                    addFact = 0.55
                elif ref > 310:
                    addFact = 0.65
                elif ref > 140:
                    addFact = 0.75
                elif ref > 50:
                    addFact = 0.90
                else:
                    addFact = 1
                for xyNow in ['x', 'y']:
                    eleNow[xyNow] *= addFact

        # -----------------------------------------------------------------------------------------------------------
        # north
        # -----------------------------------------------------------------------------------------------------------
        if utils.nsType == "N":
            idNow = "L_0"
            arrayData.telPosD[idNow] = {"x":  7.23, "y": -70.05, "t": "LST"}
            idNow = "L_1"
            arrayData.telPosD[idNow] = {"x": -71.29, "y": -12.3, "t": "LST"}
            idNow = "L_2"
            arrayData.telPosD[idNow] = {"x": -8.2, "y":  71.82, "t": "LST"}
            idNow = "L_3"
            arrayData.telPosD[idNow] = {"x":  68.07, "y":  9.31, "t": "LST"}
            idNow = "M_4"
            arrayData.telPosD[idNow] = {"x":  0, "y":  0, "t": "MST"}
            idNow = "M_5"
            arrayData.telPosD[idNow] = {"x": -196.9, "y": -22.53, "t": "MST"}
            idNow = "M_6"
            arrayData.telPosD[idNow] = {"x": -124.51, "y":  100.94, "t": "MST"}
            idNow = "M_7"
            arrayData.telPosD[idNow] = {"x": -28.52, "y":  180.32, "t": "MST"}
            idNow = "M_8"
            arrayData.telPosD[idNow] = {"x":  125.28, "y":  169.43, "t": "MST"}
            idNow = "M_9"
            arrayData.telPosD[idNow] = {"x":  199.05, "y":  20.56, "t": "MST"}
            idNow = "M_10"
            arrayData.telPosD[idNow] = {"x":  126.3, "y": -97.35, "t": "MST"}
            idNow = "M_11"
            arrayData.telPosD[idNow] = {"x":  26.45, "y": -198.59, "t": "MST"}
            idNow = "M_12"
            arrayData.telPosD[idNow] = {"x": -124.22, "y": -168.79, "t": "MST"}
            idNow = "M_13"
            arrayData.telPosD[idNow] = {"x": -212.53, "y":  246.7, "t": "MST"}
            idNow = "M_14"
            arrayData.telPosD[idNow] = {"x":  62.3, "y":  316.37, "t": "MST"}
            idNow = "M_15"
            arrayData.telPosD[idNow] = {"x":  285.57, "y":  141.75, "t": "MST"}
            idNow = "M_16"
            arrayData.telPosD[idNow] = {"x":  267.24, "y": -131.76, "t": "MST"}
            idNow = "M_17"
            arrayData.telPosD[idNow] = {"x": -284.99, "y": -116.01, "t": "MST"}
            idNow = "M_18"
            arrayData.telPosD[idNow] = {"x": -321.44, "y":  66.39, "t": "MST"}

            # -----------------------------------------------------------------------------------------------------------
            #
            # -----------------------------------------------------------------------------------------------------------
            for idNow, eleNow in arrayData.telPosD.iteritems():
                ref = sqrt(eleNow['x']*eleNow['x']+eleNow['y']*eleNow['y'])
                if ref > 210:
                    addFact = 0.55
                elif ref > 100:
                    addFact = 0.8
                else:
                    addFact = 1
                for xyNow in ['x', 'y']:
                    eleNow[xyNow] *= addFact

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def initTelHealth(self):
        arrayData.telHealthD = dict()

        for idNow in arrayData.telPosD:
            arrayData.telHealthD[idNow] = dict()

            arrayData.telHealthD[idNow]["camera"] = {
                "id": "camera", "ttl": "Camera", "val": 20,
                "children": [
                    {"id": "camera_0", "ttl": "Camera_0", "val": 100},
                    {"id": "camera_1", "ttl": "Camera_1", "val": 10,
                     "children": [
                           {"id": "camera_1_0", "ttl": "Camera_1_0", "val": 3},
                           {"id": "camera_1_1", "ttl": "Camera_1_1", "val": 78},
                     ]
                     },
                    {"id": "camera_6", "ttl": "Camera_6", "val": 80},
                    {"id": "camera_8", "ttl": "Camera_8", "val": 80},
                ]
            }

            arrayData.telHealthD[idNow]["mount"] = {
                "id": "mount", "ttl": "Mount", "val": 100,
                "children": [
                    {"id": "mount_0", "ttl": "Mount_0", "val": 10},
                    {"id":  "mount_1", "ttl": "Mount_1", "val": 78,
                     "children": [
                         {"id": "mount_1_0", "ttl": "Mount_1_0", "val": 10},
                         {"id":  "mount_1_1", "ttl": "Mount_1_1", "val": 90,
                          "children": [
                              {"id": "mount_1_1_0",
                               "ttl": "Mount_1_1_0", "val": 95},
                              {"id": "mount_1_1_1",
                               "ttl": "Mount_1_1_1", "val": 95},
                              {"id": "mount_1_1_2",
                               "ttl": "Mount_1_1_2", "val": 95},
                              {"id": "mount_1_1_3",
                               "ttl": "Mount_1_1_3", "val": 95},
                          ]
                          },
                         {"id": "mount_1_2", "ttl": "Mount_1_2", "val": 60},
                         {"id":  "mount_1_3", "ttl": "Mount_1_3", "val": 90,
                          "children": [
                              {"id": "mount_1_3_0",
                               "ttl": "Mount_1_3_0", "val": 95},
                              {"id": "mount_1_3_1",
                               "ttl": "Mount_1_3_1", "val": 95},
                              {"id": "mount_1_3_2",
                               "ttl": "Mount_1_3_2", "val": 95},
                              {"id": "mount_1_3_3",
                               "ttl": "Mount_1_3_3", "val": 95},
                          ]
                          },
                         {"id": "mount_1_4", "ttl": "Mount_1_4", "val": 85},
                     ]
                     },
                    {"id": "mount_2", "ttl": "Mount_2", "val": 40},
                ]
            }

            if idNow[0] == "L":
                arrayData.telHealthD[idNow]["mirror"] = {
                    "id": "mirror", "ttl": "Mirror", "val": 10,
                    "children": [
                        {"id": "mirror_0", "ttl": "Mirror_0", "val": 3},
                        {"id":  "mirror_1", "ttl": "Mirror_1", "val": 78,
                         "children": [
                             {"id": "mirror_1_1", "ttl": "Mirror_0", "val": 3},
                             {"id":  "mirror_1_0", "ttl": "Mirror_1_0", "val": 28,
                              "children": [
                                  {"id": "mirror_1_0_0",
                                   "ttl": "Mirror_1_0_0", "val": 90},
                                  {"id": "mirror_1_0_1",
                                   "ttl": "Mirror_1_0_1", "val": 90},
                              ]
                              },
                         ]
                         },
                    ]
                }

            else:
                arrayData.telHealthD[idNow]["mirror"] = {
                    "id": "mirror", "ttl": "Mirror", "val": 10,
                    "children": [
                        {"id": "mirror_0", "ttl": "Mirror_0", "val": 3},
                        {"id": "mirror_1", "ttl": "Mirror_1", "val": 78},
                    ]
                }

            arrayData.telHealthD[idNow]["daq"] = {
                "id": "daq", "ttl": "DAQ", "val": 87,
                "children": [
                    {"id":  "daq_3", "ttl": "DAQ_3", "val": 50},
                    {"id":  "daq_7", "ttl": "DAQ_7", "val": 50,
                     "children": [
                         {"id": "daq_7_0", "ttl": "DAQ_7_0", "val": 10},
                         {"id": "daq_7_1", "ttl": "DAQ_7_1", "val": 20},
                         {"id": "daq_7_2", "ttl": "DAQ_7_2", "val": 85},
                         {"id": "daq_7_3", "ttl": "DAQ_7_3", "val": 85},
                         {"id": "daq_7_4", "ttl": "DAQ_7_4", "val": 85},
                         {"id": "daq_7_5", "ttl": "DAQ_7_5", "val": 85},
                         {"id": "daq_7_6", "ttl": "DAQ_7_6", "val": 85},
                     ]
                     },
                    {"id":  "daq_8", "ttl": "DAQ_8", "val": 50,
                     "children": [
                         {"id": "daq_8_0", "ttl": "DAQ_8_0", "val": 10},
                         {"id": "daq_8_1", "ttl": "DAQ_8_1", "val": 90},
                         {"id": "daq_8_2", "ttl": "DAQ_8_2", "val": 85},
                         {"id": "daq_8_30000", "ttl": "DAQ_8_30000", "val": 85},
                     ]
                     },
                ]
            }

            arrayData.telHealthD[idNow]["aux"] = {
                "id": "aux", "ttl": "Aux", "val": 70,
                "children": [
                    {"id": "aux_0", "ttl": "Aux_0", "val": 90},
                    {"id":  "aux_1", "ttl": "Aux_1", "val": 78,
                     "children": [
                         {"id": "aux_1_0", "ttl": "Aux_1_0", "val": 10},
                         {"id": "aux_1_4", "ttl": "Aux_1_4", "val": 85},
                     ]
                     },
                    {"id":  "aux_3", "ttl": "Aux_3", "val": 78,
                     "children": [
                         {"id": "aux_3_0", "ttl": "Aux_3_0", "val": 90},
                         {"id": "aux_3_1", "ttl": "Aux_3_1", "val": 15},
                         {"id": "aux_3_2", "ttl": "Aux_3_2", "val": 5},
                     ]
                     },
                ]
            }

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getTelPosD(self):
        while arrayData.telPosD is None:
            sleep(0.01)
        return self.telPosD

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------

    def getTelHealthD(self):
        while arrayData.telHealthD is None:
            sleep(0.01)
        return copy.deepcopy(self.telHealthD)
        # return self.telHealthD
