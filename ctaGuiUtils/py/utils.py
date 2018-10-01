import os
import logging
import numbers
import time
from datetime import datetime
from datetime import timedelta
import numpy as np
from math import sqrt, ceil, floor

import gevent
from gevent import sleep

from utils_redis import redisManager

# --------------------------------------------------------------------------------------------------
# initialize the color dict (may choose not to use colors here)
# --------------------------------------------------------------------------------------------------
# useLogTitle = False if os.uname()[1] == "sadehMac" else True
useLogTitle = False
addMsgEleSpace = False

noSubArrName = "emptySA"
telPos0 = [0, 90]

# --------------------------------------------------------------------------------------------------
# check if ACS is available (assumed yes if the 'ACSROOT' env variable is defined)
# --------------------------------------------------------------------------------------------------
hasACS = ('ACSROOT' in os.environ)  # (os.uname()[1] == "dawn.ifh.de")

# userName = os.getlogin()
# redisPort = dict()
# redisPort = 6379
# #  ugly temporery hack for development:
# if userName == "verdingi":
#   hasACS = False
#   redisPort += 1

# --------------------------------------------------------------------------------------------------
# for safety, make sure registered widgets can be requested by the client
# e.g., expect a module file named "AAA.py", containing a class AAA
allWidgets = []
allowedWidgetTypeV = {
    "synced": [
        "arrZoomer", "azPlots", "telPos_0", "subArrGrp", "telPntSky",
        "schedBlocks", "nightSched", "obsBlockControl", "emptyExample",
        "myTestExample", "commentNightSched"
    ],
    "notSynced": [
        "panelSync"
    ]
}
# syncTypeV = [ "syncTelFocus" ]


# --------------------------------------------------------------------------------------------------
#
# --------------------------------------------------------------------------------------------------
class myLog():

    # --------------------------------------------------------------------------------------------------
    #
    # --------------------------------------------------------------------------------------------------
    def __init__(self, name='', title='', doParseMsg=True, useColors=True):
        self.doParseMsg = doParseMsg
        self.name = "root" if name is "" else name
        self.log = logging.getLogger(self.name)

        self.setColors(useColors)
        self.title = self.colorV['c']("" if title is "" else (
            " ["+title+"]" if useLogTitle else ""))

        # common lock for all loggers
        self.lock = myLock("myLog")

        return

    # --------------------------------------------------------------------------------------------------
    #
    # --------------------------------------------------------------------------------------------------
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
                        if addMsgEleSpace and msg != "":
                            msg += " "
                        msg += str(msgNow[0])
                    # list with multiple elements
                    elif len(msgNow) >= 2:
                        # first element is a color indicator
                        if msgNow[0] in self.colorV:
                            colFunc = self.colorV[msgNow[0]]
                            # either can be one or more messages after the color indicator
                            if len(msgNow) == 2:
                                msgStr = str(msgNow[1])
                            else:
                                msgStr = (" ").join([str(eleNow)
                                                     for eleNow in msgNow[1:]])
                        # there is no color indicator, just a list of messages
                        else:
                            colFunc = self.colorV['']
                            msgStr = (" ").join([str(eleNow)
                                                 for eleNow in msgNow])

                        # compose the colored output from the (joined list of) messages(s)
                        if addMsgEleSpace and msg != "":
                            msg += colFunc(" ")
                        msg += colFunc(msgStr)

                # --------------------------------------------------------------------------------------------------
                # if there is a single message (non-list)
                # --------------------------------------------------------------------------------------------------
                else:
                    if addMsgEleSpace and msg != "":
                        msg += " "
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

    # --------------------------------------------------------------------------------------------------
    # color output
    # --------------------------------------------------------------------------------------------------
    def getColDict(self, useColors):
        colDef = "\033[0m"
        colBlue = "\033[34m"
        colRed = "\033[31m"
        colLightBlue = "\033[94m"
        colYellow = "\033[33m"
        colUnderLine = "\033[4;30m"
        colWhiteOnBlack = "\33[40;37;1m"
        colWhiteOnGreen = "\33[42;37;1m"
        colWhiteOnYellow = "\33[43;37;1m"
        colGreen = "\033[32m"
        colWhiteOnRed = "\33[41;37;1m"
        colPurple = "\033[35m"
        colCyan = "\033[36m"

        def noCol(msg): return '' if (str(msg) is '') else str(msg)

        def blue(msg): return '' if (
            str(msg) is '') else colBlue + str(msg)+colDef

        def red(msg): return '' if (
            str(msg) is '') else colRed + str(msg)+colDef

        def green(msg): return '' if (
            str(msg) is '') else colGreen + str(msg)+colDef

        def lBlue(msg): return '' if (
            str(msg) is '') else colLightBlue + str(msg)+colDef

        def yellow(msg): return '' if (
            str(msg) is '') else colYellow + str(msg)+colDef

        def purple(msg): return '' if (
            str(msg) is '') else colPurple + str(msg)+colDef

        def cyan(msg): return '' if (
            str(msg) is '') else colCyan + str(msg)+colDef

        def whtOnBlck(msg): return '' if (
            str(msg) is '') else colWhiteOnBlack + str(msg)+colDef

        def redOnBlck(msg): return '' if (
            str(msg) is '') else colWhiteOnBlack+ColRed + str(msg)+colDef

        def bluOnBlck(msg): return '' if (
            str(msg) is '') else colWhiteOnBlack+ColBlue + str(msg)+colDef

        def yellOnBlck(msg): return '' if (
            str(msg) is '') else colWhiteOnBlack+ColYellow+str(msg)+colDef

        def whtOnRed(msg): return '' if (
            str(msg) is '') else colWhiteOnRed + str(msg)+colDef

        def yellowOnRed(msg): return '' if (
            str(msg) is '') else colWhiteOnRed+ColYellow + str(msg)+colDef

        def whtOnYellow(msg): return '' if (
            str(msg) is '') else colWhiteOnYellow + str(msg)+colDef

        def whtOnGreen(msg): return '' if (
            str(msg) is '') else colWhiteOnGreen + str(msg)+colDef

        colorV = dict()

        colorV[''] = noCol if not useColors else noCol
        colorV['r'] = noCol if not useColors else red
        colorV['g'] = noCol if not useColors else green
        colorV['b'] = noCol if not useColors else blue
        colorV['y'] = noCol if not useColors else yellow
        colorV['p'] = noCol if not useColors else purple
        colorV['c'] = noCol if not useColors else cyan
        colorV['lb'] = noCol if not useColors else lBlue
        colorV['wb'] = noCol if not useColors else whtOnBlck
        colorV['rb'] = noCol if not useColors else redOnBlck
        colorV['bb'] = noCol if not useColors else bluOnBlck
        colorV['yb'] = noCol if not useColors else yellOnBlck
        colorV['wr'] = noCol if not useColors else whtOnRed
        colorV['yr'] = noCol if not useColors else yellowOnRed
        colorV['wy'] = noCol if not useColors else whtOnYellow
        colorV['wg'] = noCol if not useColors else whtOnGreen

        return colorV

    def setColors(self, useColors):
        self.colorV = self.getColDict(useColors)
        return

# --------------------------------------------------------------------------------------------------
# locker class by name
# --------------------------------------------------------------------------------------------------


class myLock():
    locks = {}

    def __init__(self, name='', checkEvery=None):
        self.name = "generic" if name is "" else name

        self.checkEvery = max(0.0001, min(
            0.5, (checkEvery if isinstance(checkEvery, numbers.Number) else 0.05)))
        self.maxChecks = max(5/self.checkEvery, 2)

        if self.name not in myLock.locks:
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


# --------------------------------------------------------------------------------------------------
# assertion with a msg
# --------------------------------------------------------------------------------------------------
def Assert(log=None, msg="", state=False, onlyWarn=False):
    if state:
        return

    if log is None:
        log = myLog(title="Assert/"+__name__)

    if onlyWarn:
        log.warning([['wr', msg]])
    else:
        log.critical([['wr', msg, " - Will terminate !!!!"]])
        raise Exception(msg)

    return


# -----------------------------------------------------------------------------------------------------------
#
# -----------------------------------------------------------------------------------------------------------
def initTelIds(nsType):
    try:
        # south
        if nsType == 'S':
            telIds = [
                'L_0', 'L_1', 'L_2', 'L_3', 'M_4', 'M_5', 'M_6', 'M_7', 'M_8', 'M_9',
                'M_10', 'M_11', 'M_12', 'M_13', 'M_14', 'M_15', 'M_16', 'M_17', 'M_18', 'M_19',
                'M_20', 'M_21', 'M_22', 'M_23', 'M_24', 'M_25', 'M_26', 'M_27', 'M_28', 'S_29',
                'S_30', 'S_31', 'S_32', 'S_33', 'S_34', 'S_35', 'S_36', 'S_37', 'S_38', 'S_39',
                'S_40', 'S_41', 'S_42', 'S_43', 'S_44', 'S_45', 'S_46', 'S_47', 'S_48', 'S_49',
                'S_50', 'S_51', 'S_52', 'S_53', 'S_54', 'S_55', 'S_56', 'S_57', 'S_58', 'S_59',
                'S_60', 'S_61', 'S_62', 'S_63', 'S_64', 'S_65', 'S_66', 'S_67', 'S_68', 'S_69',
                'S_70', 'S_71', 'S_72', 'S_73', 'S_74', 'S_75', 'S_76', 'S_77', 'S_78', 'S_79',
                'S_80', 'S_81', 'S_82', 'S_83', 'S_84', 'S_85', 'S_86', 'S_87', 'S_88', 'S_89',
                'S_90', 'S_91', 'S_92', 'S_93', 'S_94', 'S_95', 'S_96', 'S_97', 'S_98'
            ]

        # north
        elif nsType == 'N':
            telIds = [
                'L_0', 'L_1', 'L_2', 'L_3', 'M_4', 'M_5', 'M_6', 'M_7', 'M_8', 'M_9',
                'M_10', 'M_11', 'M_12', 'M_13', 'M_14', 'M_15', 'M_16', 'M_17', 'M_18'
            ]
        else:
            raise
    except Exception:
        Assert(msg=' - trying to do initTelIds() with nsType = ' +
               str(nsType), state=False)

    return telIds


# --------------------------------------------------------------------------------------------------
#
# --------------------------------------------------------------------------------------------------
class timeOfNight():
    isActive = False

    def __init__(self, nsType, endTime=None, timeScale=None, *args, **kwargs):
        self.log = myLog(title=__name__)

        if timeOfNight.isActive:
            raise ValueError(
                'Can not instantiate timeOfNight more than once...')
        else:
            timeOfNight.isActive = True

        # 28800 -> 8 hour night
        self.timeScale = 0.01 if timeScale is None else timeScale

        self.startDate = datetime(2018, 9, 16, 21, 30)
        self.startTime = 0

        self.endDate = datetime(2018, 9, 17, 5, 30)
        self.endTime = (self.endDate - self.startDate).total_seconds() if endTime is None else endTime # self.startTime + nightDuration if endTime is None else endTime # 28000

        self.timeNow = 0
        self.dateNow = self.startDate
        # 0.035 -> have 30 minutes last for one minute in real time
        # 0.0035 -> have 30 minutes last for 6 sec in real time
        # if not hasACS:
        #   self.timeScale /= 2
        # self.timeScale /= 20

        self.className = self.__class__.__name__
        self.redis = redisManager(name=self.className, log=self.log)

        self.nNight = -1

        # range in seconds of time-series data to be stored for eg monitoring points
        self.epoch = datetime.utcfromtimestamp(0)
        self.timeSeriesLen = 60 * 30
        self.secondScale = 1000

        self.resetNight()

        gevent.spawn(self.loop)

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def getTotalTime(self):
        return self.endTime
    def getEndDate(self):
        return self.endDate
    # -----------------------------------------------------------------------------------------------------------
    def getNnight(self):
        return self.nNight
    # -----------------------------------------------------------------------------------------------------------
    def getTimeScale(self):
        return self.timeScale

    # -----------------------------------------------------------------------------------------------------------
    def getCurrentTime(self): # , nDigits=3):
        return self.timeNow
        # if nDigits >= 0 and nDigits is not None:
        #     return int(floor(self.timeNow)) if nDigits == 0 else round(self.timeNow, nDigits)
        # else:
        #     return self.timeNow
    def getCurrentDate(self):
        return self.dateNow
    # -----------------------------------------------------------------------------------------------------------
    def getSecondScale(self):
        return self.secondScale

    # -----------------------------------------------------------------------------------------------------------
    def getResetTime(self):
        return self.realResetTime

    # -----------------------------------------------------------------------------------------------------------
    # the global function for the current system time
    # -----------------------------------------------------------------------------------------------------------
    def getRealTime(self):
        return int((datetime.utcnow() - self.epoch).total_seconds() * self.secondScale)

    # -----------------------------------------------------------------------------------------------------------
    def getTimeSeriesStartTime(self):
        return self.getRealTime() - self.timeSeriesLen * self.secondScale

    # -----------------------------------------------------------------------------------------------------------
    def getStartTime(self):
        return self.startTime
    def getStartDate(self):
        return self.startDate

    # -------------------------------------------'time': self.timeOfNight.getCurrentTime(), ----------------------------------------------------------------
    def resetNight(self, log=None):
        self.nNight += 1
        self.realResetTime = self.getRealTime()

        # timeNow = int(floor(self.getStartTime()))
        self.timeNow = self.getStartTime()
        self.dateNow = self.getStartDate()

        if log is not None:
            self.log.info([
                ['r', "- resetNight(): "],
                ['y', 'timeNow:', self.timeNow, ', '],
                ['b', 'nNight:', self.nNight, ', '],
                ['g', 'realResetTime:', self.realResetTime]
            ])

        self.redis.pipe.set(name='timeOfNight_'+'scale', data=self.timeScale)
        self.redis.pipe.set(name='timeOfNight_'+'start', data=self.startTime)
        self.redis.pipe.set(name='timeOfNight_'+'end', data=self.endTime)
        self.redis.pipe.set(name='timeOfNight_'+'now', data=self.timeNow)
        self.redis.pipe.set(name='timeOfNight_'+'date_start', data=self.startDate)
        self.redis.pipe.set(name='timeOfNight_'+'date_end', data=self.endDate)
        self.redis.pipe.set(name='timeOfNight_'+'date_now', data=self.dateNow)

        self.redis.pipe.execute()

        return

    # -----------------------------------------------------------------------------------------------------------
    #
    # -----------------------------------------------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting timeOfNight.loop ..."]])

        nSleep = 1
        while True:
            self.timeNow += nSleep / self.timeScale # nSleep / self.timeScale
            self.dateNow = self.startDate + timedelta(seconds = self.timeNow)
            if self.timeNow > self.endTime:
                self.resetNight()

            self.redis.pipe.set(name='timeOfNight_'+'now', data=self.timeNow)
            self.redis.pipe.set(name='timeOfNight_'+'date_now', data=self.dateNow)
            self.redis.pipe.execute()

            sleep(nSleep)

        return


# -----------------------------------------------------------------------------------------------------------
#
# -----------------------------------------------------------------------------------------------------------
def getTimeOfNight(parent):
    parent.redis.pipe.get('timeOfNight_'+'start')
    parent.redis.pipe.get('timeOfNight_'+'end')
    parent.redis.pipe.get('timeOfNight_'+'now')
    parent.redis.pipe.get('timeOfNight_'+'date_start')
    parent.redis.pipe.get('timeOfNight_'+'date_end')
    parent.redis.pipe.get('timeOfNight_'+'date_now')

    timeOfNight = parent.redis.pipe.execute()

    if len(timeOfNight) != 6:
        parent.log.warning([
            ['r', ' - ', parent.widgetName, " - could not get timeOfNight - "],
            ['p', str(timeOfNight)], ['r', ' - will use fake range ...']
        ])
        timeOfNight = [0, 100, 0]

    data = {
        'start': timeOfNight[0],
        'end': timeOfNight[1],
        'now': timeOfNight[2],
        'date_start': timeOfNight[3],
        'date_end': timeOfNight[4],
        'date_now': timeOfNight[5]
    }

    return data


# --------------------------------------------------------------------------------------------------
#
# --------------------------------------------------------------------------------------------------
def dictModFunc(data, key, val, newVals):
    if key == "id" and val in newVals:
        data['val'] = newVals[val]
    return

# --------------------------------------------------------------------------------------------------
#
# --------------------------------------------------------------------------------------------------


def objTraverse(data, newVals, modFunc=None):
    if modFunc is None:
        modFunc = dictModFunc

    if isinstance(data, dict):
        for k, v in data.iteritems():
            if isinstance(v, dict) or isinstance(v, list) or isinstance(v, tuple):
                objTraverse(data=v, newVals=newVals, modFunc=modFunc)
            else:
                modFunc(data, k, v, newVals)
    elif isinstance(data, list) or isinstance(data, tuple):
        for v in data:
            objTraverse(data=v, newVals=newVals, modFunc=modFunc)
    return


# --------------------------------------------------------------------------------------------------
#
# --------------------------------------------------------------------------------------------------
# def flatDictByIdOrig(data, flatDict, id="id"):
#   if isinstance(data, dict):
#     for k,v in data.items():
#       if isinstance(v, dict) or isinstance(v, list) or isinstance(v, tuple):
#         flatDictByIdOrig(data=v, flatDict=flatDict, id=id)
#       else:
#         if k == id:
#           # print v
#           flatDict[v] = data
#   elif isinstance(data, list) or isinstance(data, tuple):
#     for v in data:
#       flatDictByIdOrig(data=v, flatDict=flatDict, id=id)
#   return

# --------------------------------------------------------------------------------------------------
#
# --------------------------------------------------------------------------------------------------
def flatDictById(dataIn, id='id', childVid='children', siblingVid='siblings'):
    dataOut = dict()

    def flatten(data, depth):
        if isinstance(data, dict) and (id in data.keys()):
            depth += 1

        if isinstance(data, dict):
            for key, ele in data.items():
                if isinstance(ele, dict) or isinstance(ele, list) or isinstance(ele, tuple):
                    flatten(data=ele, depth=depth)
                elif key == id:
                    dataOut[ele] = {
                        'depth': depth,
                        'height': None,
                        'parent': None,
                        childVid: [],
                        siblingVid: [],
                        'data': data
                    }
                else:
                    continue
        elif isinstance(data, list) or isinstance(data, tuple):
            for ele in data:
                flatten(data=ele, depth=depth)

        return

    flatten(dataIn, -1)

    maxDepth = max([x['depth'] for x in dataOut.values()])

    for key, ele in dataOut.items():
        ele['height'] = maxDepth - ele['depth']

        if childVid in ele['data']:
            for child in ele['data'][childVid]:
                if isinstance(child, dict) and (id in child):
                    dataOut[child[id]]['parent'] = key
                    ele[childVid].append(child[id])
                else:
                    # fixme - try/except instead ...
                    Assert(
                        None, " - expect a dict with a key ["+str(id)+"] ?!?! "+str(child), False)

    for key0, ele0 in dataOut.items():
        for key1, ele1 in dataOut.items():
            if (ele0['parent'] is not None) and \
                (ele0['parent'] == ele1['parent']) and \
                    (key0 != key1):
                ele0[siblingVid].append(key1)

    return dataOut


# --------------------------------------------------------------------------------------------------
# for debugging, and easier time counter ...
# --------------------------------------------------------------------------------------------------
# nTimeCount = 0
# def getTime():
#     global nTimeCount
#     if nTimeCount > 1e7:
#         nTimeCount = 0
#     nTimeCount += 1
#     return nTimeCount
# --------------------------------------------------------------------------------------------------

# -----------------------------------------------------------------------------------------------------------
# time since epoch in milisecond
# -----------------------------------------------------------------------------------------------------------
def getTime():
    return int(time.time()*1e3)
# def getDateTimeFormat():
#   return '%Y/%m/%d,%H:%m:%S'
# def getDateTimeStr():
#   return datetime.utcnow().strftime(getDateTimeFormat())


# -----------------------------------------------------------------------------------------------------------
#
# -----------------------------------------------------------------------------------------------------------
def deltaSec(date0, date1, isMicro=False):
    if isMicro:
        nSec = (date1 - date0).days * 86400 * \
            1000000 + (date1 - date0).microseconds
    else:
        nSec = (date1 - date0).days * 86400 + (date1 - date0).seconds
    return nSec


# -----------------------------------------------------------------------------------------------------------
#
# -----------------------------------------------------------------------------------------------------------
def dateToStr(dateIn, timeStr='%H:%m:%S'):
    return str(dateIn.date().strftime('%Y/%m/%d')) + "," + str(dateIn.time().strftime(timeStr))


# -----------------------------------------------------------------------------------------------------------
#
# -----------------------------------------------------------------------------------------------------------
def floatStrFormat(x):
    return str("{0:.4e}".format(x))


# -----------------------------------------------------------------------------------------------------------
# resampling function for reducing the size of datasets
# -----------------------------------------------------------------------------------------------------------
def pdResampler(arrIn):
    if len(arrIn) > 0:
        return arrIn[0]
    else:
        return np.nan


# --------------------------------------------------------------------------------------------------
#
# --------------------------------------------------------------------------------------------------
def hasDataResampler(arrIn):
    if len(arrIn) > 0:
        return 1
    else:
        return np.nan


# --------------------------------------------------------------------------------------------------
#
# --------------------------------------------------------------------------------------------------
def formatUnits(unitsIn):
    units = unitsIn
    if units == ".." or units == "-":
        units = ""
    return units
