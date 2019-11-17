import gevent
from gevent import sleep
# from gevent.coros import BoundedSemaphore
import copy
from math import sqrt, ceil, floor
import utils
from utils import myLog, Assert, getTime


# ------------------------------------------------------------------
# physical position of telescopes etc.
# ------------------------------------------------------------------
class arrayData():
    inst_info = None
    inst_health = None
    nsType = None
    tel_ids = None
    inst_Ids = None
    tel_id_to_types = None
    sub_array_tels = None
    tel_id_to_sub_array = None

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, nsType, lock=None, *args, **kwargs):
        self.log = myLog(title=__name__)

        def init():
            self.log.debug([
                ['y', " - initializing arrayData - "],
                ['g', 'initTelPos()'], ['y', " ..."]
            ])

            arrayData.nsType = nsType
            
            arrayData.tel_ids = self.initTelIds()
            self.initTelPos()
            
            arrayData.aux_ids = self.init_aux_ids()
            self.init_aux_pos()

            arrayData.inst_Ids = copy.deepcopy(arrayData.tel_ids + arrayData.aux_ids)

            self.init_sub_array_tels()
            
            self.initTelHealth()
            self.set_inst_id_to_types()

        if arrayData.inst_info is None:
            if lock is not None:
                with lock:
                    init()
            else:
                init()

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_sub_array_tels(self):
        sub_array_tels = dict()

        print(' -- FIXME -- implement SBs ....')

        try:
            # ------------------------------------------------------------------
            # south
            # ------------------------------------------------------------------
            if arrayData.nsType == 'S': 
                idNow = 'SA_0'
                sub_array_tels[idNow] = [
                    'Lx00', 'Lx01', 'Lx02', 'Lx03', 'Mx04',
                ]
                idNow = 'SA_1'
                sub_array_tels[idNow] = [
                    'Lx00', 'Lx01', 'Lx02', 'Lx03', 'Mx04',
                    'Mx05', 'Mx06', 'Mx07', 'Mx08', 'Mx09',
                ]
            
            # ------------------------------------------------------------------
            # north
            # ------------------------------------------------------------------
            elif arrayData.nsType == 'N':
                idNow = 'SA_0'
                sub_array_tels[idNow] = [
                    'Lx00', 'Lx01', 'Lx02', 'Lx03', 'Mx04',
                ]
                idNow = 'SA_1'
                sub_array_tels[idNow] = [
                    'Mx05', 'Mx06', 'Mx07', 'Mx08', 'Mx09',
                ]
                idNow = 'SA_2'
                sub_array_tels[idNow] = [
                    'Mx05', 'Mx06', 'Mx07',
                ]
            else:
                raise
        except Exception:
            Assert(msg=' - trying to do init_sub_array_tels() with nsType = ' +
                   str(arrayData.nsType), state=False)

        arrayData.sub_array_tels = sub_array_tels
        self.set_tel_id_to_sub_array()
        
        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def set_tel_id_to_sub_array(self):
        tel_id_to_sub_array = dict()
        sub_array_tels = arrayData.sub_array_tels

        for (sa_id, tel_ids) in sub_array_tels.items():
            for tel_id in tel_ids:
                if tel_id not in tel_id_to_sub_array:
                    tel_id_to_sub_array[tel_id] = []
                tel_id_to_sub_array[tel_id] += [ sa_id ]

        for tel_id in tel_id_to_sub_array.keys():
            tel_id_to_sub_array[tel_id].sort()

        arrayData.tel_id_to_sub_array = tel_id_to_sub_array
        
        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def initTelIds(self):
        try:
            # ------------------------------------------------------------------
            # south
            # ------------------------------------------------------------------
            if arrayData.nsType == 'S': 
                tel_ids = [
                    'Lx00', 'Lx01', 'Lx02', 'Lx03', 'Mx04',
                    'Mx05', 'Mx06', 'Mx07', 'Mx08', 'Mx09',
                    'Mx10', 'Mx11', 'Mx12', 'Mx13', 'Mx14',
                    'Mx15', 'Mx16', 'Mx17', 'Mx18', 'Mx19',
                    'Mx20', 'Mx21', 'Mx22', 'Mx23', 'Mx24',
                    'Mx25', 'Mx26', 'Mx27', 'Mx28', 'Sx29',
                    'Sx30', 'Sx31', 'Sx32', 'Sx33', 'Sx34',
                    'Sx35', 'Sx36', 'Sx37', 'Sx38', 'Sx39',
                    'Sx40', 'Sx41', 'Sx42', 'Sx43', 'Sx44',
                    'Sx45', 'Sx46', 'Sx47', 'Sx48', 'Sx49',
                    'Sx50', 'Sx51', 'Sx52', 'Sx53', 'Sx54',
                    'Sx55', 'Sx56', 'Sx57', 'Sx58', 'Sx59',
                    'Sx60', 'Sx61', 'Sx62', 'Sx63', 'Sx64',
                    'Sx65', 'Sx66', 'Sx67', 'Sx68', 'Sx69',
                    'Sx70', 'Sx71', 'Sx72', 'Sx73', 'Sx74',
                    'Sx75', 'Sx76', 'Sx77', 'Sx78', 'Sx79',
                    'Sx80', 'Sx81', 'Sx82', 'Sx83', 'Sx84',
                    'Sx85', 'Sx86', 'Sx87', 'Sx88', 'Sx89',
                    'Sx90', 'Sx91', 'Sx92', 'Sx93', 'Sx94', 
                    'Sx95', 'Sx96', 'Sx97', 'Sx98',
                ]

            # ------------------------------------------------------------------
            # north
            # ------------------------------------------------------------------
            elif arrayData.nsType == 'N':
                tel_ids = [
                    'Lx00', 'Lx01', 'Lx02', 'Lx03', 'Mx04', 
                    'Mx05', 'Mx06', 'Mx07', 'Mx08', 'Mx09',
                    'Mx10', 'Mx11', 'Mx12', 'Mx13', 'Mx14',
                    'Mx15', 'Mx16', 'Mx17', 'Mx18',
                    # 'Lx00', 'Lx01', 'Mx05', 'Mx06', 'Mx07', 'Mx08', 'Mx09',
                ]
            else:
                raise
        except Exception:
            Assert(msg=' - trying to do initTelIds() with nsType = ' +
                   str(arrayData.nsType), state=False)

        return tel_ids


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_aux_ids(self):
        try:
            # south
            if arrayData.nsType == 'S': 
                aux_ids = [
                    'Ax00', 'Ax01', 'Ax02', 'Ax03',
                ]
            # north
            elif arrayData.nsType == 'N':
                aux_ids = [
                    'Ax00', 'Ax01', 'Ax02',
                ]
            else:
                raise
        except Exception:
            Assert(msg=' - trying to do init_aux_ids() with nsType = ' +
                   str(arrayData.nsType), state=False)

        return aux_ids

    
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def initTelPos(self):
        if arrayData.inst_info is None:
            arrayData.inst_info = dict()

        def add_dict_id(idNow, entry):
            try:
                arrayData.inst_info[idNow] = entry
                if idNow not in arrayData.tel_ids:
                    raise
            except Exception:
                Assert(msg=' - idNow not in self.tel_ids for idNow= ' +
                       str(idNow), state=False)
            return

        # ------------------------------------------------------------------
        # south
        # ------------------------------------------------------------------
        if arrayData.nsType == 'S':
            idNow = "Lx00"
            add_dict_id(idNow, {'x':  65, 'y': -20, 'type': 'LST'})
            idNow = "Lx01"
            add_dict_id(idNow, {'x': -65, 'y': -20, 'type': 'LST'})
            idNow = "Lx02"
            add_dict_id(idNow, {'x':  0, 'y':  80, 'type': 'LST'})
            idNow = "Lx03"
            add_dict_id(idNow, {'x':  0, 'y': -110, 'type': 'LST'})
            idNow = "Mx04"
            add_dict_id(idNow, {'x': -151.2, 'y':  0, 'type': 'MST'})
            idNow = "Mx05"
            add_dict_id(idNow, {'x':  151.2, 'y':  0, 'type': 'MST'})
            idNow = "Mx06"
            add_dict_id(idNow, {'x': -105.6, 'y': -136.656, 'type': 'MST'})
            idNow = "Mx07"
            add_dict_id(idNow, {'x':  105.6, 'y': -136.656, 'type': 'MST'})
            idNow = "Mx08"
            add_dict_id(idNow, {'x': -85.6, 'y': -136.656, 'type': 'MST'})
            idNow = "Mx09"
            add_dict_id(idNow, {'x':  85.6, 'y': -136.656, 'type': 'MST'})
            idNow = "Mx10"
            add_dict_id(idNow, {'x':  0, 'y': -308.41, 'type': 'MST'})
            idNow = "Mx11"
            add_dict_id(idNow, {'x':  0, 'y':  308.41, 'type': 'MST'})
            idNow = "Mx12"
            add_dict_id(idNow, {
                'x': -238.474, 'y': -154.205, 'type': 'MST'})
            idNow = "Mx13"
            add_dict_id(idNow, {
                'x':  238.474, 'y': -154.205, 'type': 'MST'})
            idNow = "Mx14"
            add_dict_id(idNow, {
                'x': -238.474, 'y':  154.205, 'type': 'MST'})
            idNow = "Mx15"
            add_dict_id(idNow, {
                'x':  238.474, 'y':  154.205, 'type': 'MST'})
            idNow = "Mx16"
            add_dict_id(idNow, {'x':  0, 'y': -582.17, 'type': 'MST'})
            idNow = "Mx17"
            add_dict_id(idNow, {'x':  0, 'y':  582.17, 'type': 'MST'})
            idNow = "Mx18"
            add_dict_id(idNow, {
                'x':  450.155, 'y': -291.085, 'type': 'MST'})
            idNow = "Mx19"
            add_dict_id(idNow, {
                'x': -450.155, 'y': -291.085, 'type': 'MST'})
            idNow = "Mx20"
            add_dict_id(idNow, {
                'x': -450.155, 'y':  291.085, 'type': 'MST'})
            idNow = "Mx21"
            add_dict_id(idNow, {
                'x':  450.155, 'y':  291.085, 'type': 'MST'})
            idNow = "Mx22"
            add_dict_id(idNow, {
                'x': -162.621, 'y': -345.468, 'type': 'MST'})
            idNow = "Mx23"
            add_dict_id(idNow, {
                'x':  162.621, 'y': -345.468, 'type': 'MST'})
            idNow = "Mx24"
            add_dict_id(idNow, {
                'x': -162.621, 'y':  315.468, 'type': 'MST'})
            idNow = "Mx25"
            add_dict_id(idNow, {
                'x':  162.621, 'y':  315.468, 'type': 'MST'})
            idNow = "Mx26"
            add_dict_id(idNow, {'x': -325.242, 'y':  0, 'type': 'MST'})
            idNow = "Mx27"
            add_dict_id(idNow, {'x':  325.242, 'y':  0, 'type': 'MST'})
            idNow = "Mx28"
            add_dict_id(idNow, {'x':  0, 'y':  0, 'type': 'MST'})
            idNow = "Sx29"
            add_dict_id(idNow, {'x': -723.527, 'y':  0, 'type': 'SST'})
            idNow = "Sx30"
            add_dict_id(idNow, {'x':  723.527, 'y':  0, 'type': 'SST'})
            idNow = "Sx31"
            add_dict_id(idNow, {'x': -100, 'y': -494.469, 'type': 'SST'})
            idNow = "Sx32"
            add_dict_id(idNow, {'x':  100, 'y': -494.469, 'type': 'SST'})
            idNow = "Sx33"
            add_dict_id(idNow, {'x': -100, 'y':  494.469, 'type': 'SST'})
            idNow = "Sx34"
            add_dict_id(idNow, {'x':  100, 'y':  494.469, 'type': 'SST'})
            idNow = "Sx35"
            add_dict_id(idNow, {
                'x':  424.824, 'y': -164.823, 'type': 'SST'})
            idNow = "Sx36"
            add_dict_id(idNow, {
                'x': -424.824, 'y': -164.823, 'type': 'SST'})
            idNow = "Sx37"
            add_dict_id(idNow, {
                'x': -424.824, 'y':  164.823, 'type': 'SST'})
            idNow = "Sx38"
            add_dict_id(idNow, {
                'x':  424.824, 'y':  164.823, 'type': 'SST'})
            idNow = "Sx39"
            add_dict_id(idNow, {'x': -519.795, 'y':  0, 'type': 'SST'})
            idNow = "Sx40"
            add_dict_id(idNow, {'x':  519.795, 'y':  0, 'type': 'SST'})
            idNow = "Sx41"
            add_dict_id(idNow, {
                'x':  569.216, 'y': -662.533, 'type': 'SST'})
            idNow = "Sx42"
            add_dict_id(idNow, {
                'x': -569.216, 'y': -662.533, 'type': 'SST'})
            idNow = "Sx43"
            add_dict_id(idNow, {
                'x':  569.216, 'y':  662.533, 'type': 'SST'})
            idNow = "Sx44"
            add_dict_id(idNow, {
                'x': -569.216, 'y':  662.533, 'type': 'SST'})
            idNow = "Sx45"
            add_dict_id(idNow, {
                'x': -796.903, 'y': -220.844, 'type': 'SST'})
            idNow = "Sx46"
            add_dict_id(idNow, {
                'x':  796.903, 'y': -220.844, 'type': 'SST'})
            idNow = "Sx47"
            add_dict_id(idNow, {
                'x':  796.903, 'y':  220.844, 'type': 'SST'})
            idNow = "Sx48"            
            add_dict_id(idNow, {
                'x': -796.903, 'y':  220.844, 'type': 'SST'})
            idNow = "Sx49"
            add_dict_id(idNow, {
                'x': -227.687, 'y': -883.377, 'type': 'SST'})
            idNow = "Sx50"
            add_dict_id(idNow, {
                'x':  227.687, 'y': -883.377, 'type': 'SST'})
            idNow = "Sx51"
            add_dict_id(idNow, {
                'x': -227.687, 'y':  883.377, 'type': 'SST'})
            idNow = "Sx52"
            add_dict_id(idNow, {
                'x':  227.687, 'y':  883.377, 'type': 'SST'})
            idNow = "Sx53"
            add_dict_id(idNow, {'x': -944.301, 'y':  0, 'type': 'SST'})
            idNow = "Sx54"
            add_dict_id(idNow, {'x':  944.301, 'y':  0, 'type': 'SST'})
            idNow = "Sx55"
            add_dict_id(idNow, {
                'x':  472.151, 'y': -915.923, 'type': 'SST'})
            idNow = "Sx56"
            add_dict_id(idNow, {
                'x': -472.151, 'y': -915.923, 'type': 'SST'})
            idNow = "Sx57"
            add_dict_id(idNow, {
                'x': -472.151, 'y':  915.923, 'type': 'SST'})
            idNow = "Sx58"
            add_dict_id(idNow, {
                'x':  472.151, 'y':  915.923, 'type': 'SST'})
            idNow = "Sx59"
            add_dict_id(idNow, {
                'x': -971.21, 'y': -471.012, 'type': 'SST'})
            idNow = "Sx60"
            add_dict_id(idNow, {
                'x':  971.21, 'y': -471.012, 'type': 'SST'})
            idNow = "Sx61"
            add_dict_id(idNow, {
                'x': -971.21, 'y':  471.012, 'type': 'SST'})
            idNow = "Sx62"
            add_dict_id(idNow, {
                'x':  971.21, 'y':  471.012, 'type': 'SST'})
            idNow = "Sx63"
            add_dict_id(idNow, {
                'x':  849.809, 'y': -706.518, 'type': 'SST'})
            idNow = "Sx64"
            add_dict_id(idNow, {
                'x': -849.809, 'y': -706.518, 'type': 'SST'})
            idNow = "Sx65"
            add_dict_id(idNow, {
                'x': -849.809, 'y':  706.518, 'type': 'SST'})
            idNow = "Sx66"
            add_dict_id(idNow, {
                'x':  849.809, 'y':  706.518, 'type': 'SST'})
            idNow = "Sx67"
            add_dict_id(idNow, {
                'x':  369.912, 'y': -1195.98, 'type': 'SST'})
            idNow = "Sx68"
            add_dict_id(idNow, {
                'x': -369.912, 'y': -1195.98, 'type': 'SST'})
            idNow = "Sx69"
            add_dict_id(idNow, {
                'x': -369.912, 'y':  1195.98, 'type': 'SST'})
            idNow = "Sx70"
            add_dict_id(idNow, {
                'x':  369.912, 'y':  1195.98, 'type': 'SST'})
            idNow = "Sx71"
            add_dict_id(idNow, {
                'x':  1109.73, 'y': -239.197, 'type': 'SST'})
            idNow = "Sx72"
            add_dict_id(idNow, {
                'x': -1109.73, 'y': -239.197, 'type': 'SST'})
            idNow = "Sx73"
            add_dict_id(idNow, {
                'x': -1109.73, 'y':  239.197, 'type': 'SST'})
            idNow = "Sx74"
            add_dict_id(idNow, {
                'x':  1109.73, 'y':  239.197, 'type': 'SST'})
            idNow = "Sx75"
            add_dict_id(idNow, {
                'x':  739.823, 'y': -956.787, 'type': 'SST'})
            idNow = "Sx76"
            add_dict_id(idNow, {
                'x': -739.823, 'y': -956.787, 'type': 'SST'})
            idNow = "Sx77"
            add_dict_id(idNow, {
                'x': -739.823, 'y':  956.787, 'type': 'SST'})
            idNow = "Sx78"
            add_dict_id(idNow, {
                'x':  739.823, 'y':  956.787, 'type': 'SST'})
            idNow = "Sx79"
            add_dict_id(idNow, {
                'x':  403.739, 'y': -391.606, 'type': 'SST'})
            idNow = "Sx80"
            add_dict_id(idNow, {
                'x': -403.739, 'y': -391.606, 'type': 'SST'})
            idNow = "Sx81"
            add_dict_id(idNow, {
                'x': -403.739, 'y':  391.606, 'type': 'SST'})
            idNow = "Sx82"
            add_dict_id(idNow, {
                'x':  403.739, 'y':  391.606, 'type': 'SST'})
            idNow = "Sx83"
            add_dict_id(idNow, {
                'x':  318.611, 'y': -618.073, 'type': 'SST'})
            idNow = "Sx84"
            add_dict_id(idNow, {
                'x': -318.611, 'y': -618.073, 'type': 'SST'})
            idNow = "Sx85"
            add_dict_id(idNow, {
                'x': -318.611, 'y':  618.073, 'type': 'SST'})
            idNow = "Sx86"
            add_dict_id(idNow, {
                'x':  318.611, 'y':  618.073, 'type': 'SST'})
            idNow = "Sx87"
            add_dict_id(idNow, {
                'x':  673.186, 'y': -435.304, 'type': 'SST'})
            idNow = "Sx88"
            add_dict_id(idNow, {
                'x': -673.186, 'y': -435.304, 'type': 'SST'})
            idNow = "Sx89"
            add_dict_id(idNow, {
                'x': -673.186, 'y':  435.304, 'type': 'SST'})
            idNow = "Sx90"
            add_dict_id(idNow, {
                'x':  673.186, 'y':  435.304, 'type': 'SST'})
            idNow = "Sx91"
            add_dict_id(idNow, {'x':  168.9, 'y': -225.5, 'type': 'SST'})
            idNow = "Sx92"
            add_dict_id(idNow, {'x': -168.9, 'y': -225.5, 'type': 'SST'})
            idNow = "Sx93"
            add_dict_id(idNow, {'x': -158.9, 'y':  205.5, 'type': 'SST'})
            idNow = "Sx94"
            add_dict_id(idNow, {'x':  158.9, 'y':  205.5, 'type': 'SST'})
            idNow = "Sx95"
            add_dict_id(idNow, {'x':  0, 'y':  1100, 'type': 'SST'})
            idNow = "Sx96"
            add_dict_id(idNow, {'x':  0, 'y': -1100, 'type': 'SST'})
            idNow = "Sx97"
            add_dict_id(idNow, {'x':  0, 'y': -820, 'type': 'SST'})
            idNow = "Sx98"
            add_dict_id(idNow, {'x':  0, 'y':  820, 'type': 'SST'})

            # ------------------------------------------------------------------
            #
            # ------------------------------------------------------------------
            idNow = "Mx06"
            arrayData.inst_info[idNow]['x'] -= 50
            idNow = "Mx07"
            arrayData.inst_info[idNow]['x'] += 50
            idNow = "Mx08"
            arrayData.inst_info[idNow]['x'] += 5
            idNow = "Mx09"
            arrayData.inst_info[idNow]['x'] -= 5

            for idNow, eleNow in arrayData.inst_info.iteritems():
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

        # ------------------------------------------------------------------
        # north
        # ------------------------------------------------------------------
        if arrayData.nsType == 'N':
            idNow = "Lx00"
            add_dict_id(idNow, {'x':  7.23, 'y': -70.05, 'type': 'LST'})
            idNow = "Lx01"
            add_dict_id(idNow, {'x': -71.29, 'y': -12.3, 'type': 'LST'})
            idNow = "Lx02"
            add_dict_id(idNow, {'x': -8.2, 'y':  71.82, 'type': 'LST'})
            idNow = "Lx03"
            add_dict_id(idNow, {'x':  68.07, 'y':  9.31, 'type': 'LST'})
            idNow = "Mx04"
            add_dict_id(idNow, {'x':  0, 'y':  0, 'type': 'MST'})
            idNow = "Mx05"
            add_dict_id(idNow, {'x': -196.9, 'y': -22.53, 'type': 'MST'})
            idNow = "Mx06"
            add_dict_id(idNow, {'x': -124.51, 'y':  100.94, 'type': 'MST'})
            idNow = "Mx07"
            add_dict_id(idNow, {'x': -28.52, 'y':  180.32, 'type': 'MST'})
            idNow = "Mx08"
            add_dict_id(idNow, {'x':  125.28, 'y':  169.43, 'type': 'MST'})
            idNow = "Mx09"
            add_dict_id(idNow, {'x':  199.05, 'y':  20.56, 'type': 'MST'})
            idNow = "Mx10"
            add_dict_id(idNow, {'x':  126.3, 'y': -97.35, 'type': 'MST'})
            idNow = "Mx11"
            add_dict_id(idNow, {'x':  26.45, 'y': -198.59, 'type': 'MST'})
            idNow = "Mx12"
            add_dict_id(idNow, {'x': -124.22, 'y': -168.79, 'type': 'MST'})
            idNow = "Mx13"
            add_dict_id(idNow, {'x': -212.53, 'y':  246.7, 'type': 'MST'})
            idNow = "Mx14"
            add_dict_id(idNow, {'x':  62.3, 'y':  316.37, 'type': 'MST'})
            idNow = "Mx15"
            add_dict_id(idNow, {'x':  285.57, 'y':  141.75, 'type': 'MST'})
            idNow = "Mx16"
            add_dict_id(idNow, {'x':  267.24, 'y': -131.76, 'type': 'MST'})
            idNow = "Mx17"
            add_dict_id(idNow, {'x': -284.99, 'y': -116.01, 'type': 'MST'})
            idNow = "Mx18"
            add_dict_id(idNow, {'x': -321.44, 'y':  66.39, 'type': 'MST'})

            # ------------------------------------------------------------------
            #
            # ------------------------------------------------------------------
            for idNow, eleNow in arrayData.inst_info.iteritems():
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

     
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_aux_pos(self):
        if arrayData.inst_info is None:
            arrayData.inst_info = dict()

        def add_dict_id(idNow, entry):
            try:
                arrayData.inst_info[idNow] = entry
                if idNow not in arrayData.aux_ids:
                    raise
            except Exception:
                Assert(msg=' - idNow not in self.aux_ids for idNow= ' +
                       str(idNow), state=False)
            return


        # ------------------------------------------------------------------
        # south
        # ------------------------------------------------------------------
        if arrayData.nsType == 'S':
            # ------------------------------------------------------------------
            # 
            # ------------------------------------------------------------------
            idNow = "Ax00"
            add_dict_id(idNow, {'x':  190, 'y':  320, 'type': 'AUX'})
            idNow = "Ax01"
            add_dict_id(idNow, {'x':  15, 'y': -35, 'type': 'AUX'})
            idNow = "Ax02"
            add_dict_id(idNow, {'x': -185, 'y':  170, 'type': 'AUX'})
            idNow = "Ax03"
            add_dict_id(idNow, {'x': -210, 'y': -290, 'type': 'AUX'})

            for idNow, eleNow in arrayData.inst_info.iteritems():
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

        # ------------------------------------------------------------------
        # north
        # ------------------------------------------------------------------
        if arrayData.nsType == 'N':
            # ------------------------------------------------------------------
            # 
            # ------------------------------------------------------------------
            idNow = "Ax00"
            add_dict_id(idNow, {'x':  30, 'y':  92, 'type': 'AUX'})
            idNow = "Ax01"
            add_dict_id(idNow, {'x':  45, 'y': -35, 'type': 'AUX'})
            idNow = "Ax02"
            add_dict_id(idNow, {'x': -50, 'y':  -70, 'type': 'AUX'})

            for idNow, eleNow in arrayData.inst_info.iteritems():
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

    
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def initTelHealth(self):
        inst_health = dict()
        tel_ids = arrayData.tel_ids
        aux_ids = arrayData.aux_ids

        # ------------------------------------------------------------------
        # 
        # ------------------------------------------------------------------
        for idNow in tel_ids:
            inst_health[idNow] = dict()

            inst_health[idNow]["camera"] = {
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

            inst_health[idNow]["mount"] = {
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

            if arrayData.inst_info[idNow]['type'] == 'LST':
                inst_health[idNow]["mirror"] = {
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

            # else:
            #     inst_health[idNow]["mirror"] = {
            #         "id": "mirror", "ttl": "Mirror", "val": 10,
            #         "children": [
            #             {"id": "mirror_0", "ttl": "Mirror_0", "val": 3},
            #             {"id": "mirror_1", "ttl": "Mirror_1", "val": 78},
            #         ]
            #     }

            inst_health[idNow]["daq"] = {
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

            if arrayData.inst_info[idNow]['type'] == 'LST':
                inst_health[idNow]["aux"] = {
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

        
        # ------------------------------------------------------------------
        # 
        # ------------------------------------------------------------------
        for idNow in aux_ids:
            inst_health[idNow] = dict()

            inst_health[idNow]["inst_0"] = {
                "id": "inst_0", "ttl": "Inst_0", "val": 20,
                "children": [
                    {"id": "inst_00", "ttl": "Inst_00", "val": 100},
                    {"id": "inst_01", "ttl": "Inst_01", "val": 10,
                     "children": [
                           {"id": "inst_01_0", "ttl": "Inst_01_0", "val": 3},
                           {"id": "inst_01_1", "ttl": "Inst_01_1", "val": 78},
                     ]
                     },
                    {"id": "inst_06", "ttl": "Inst_06", "val": 80},
                    {"id": "inst_08", "ttl": "Inst_08", "val": 80},
                ]
            }
            inst_health[idNow]["inst_1"] = {
                "id": "inst_1", "ttl": "Inst_1", "val": 20,
                "children": [
                    {"id": "inst_10", "ttl": "Inst_10", "val": 100},
                    {"id": "inst_11", "ttl": "Inst_11", "val": 10,
                     "children": [
                           {"id": "inst_11_0", "ttl": "Inst_11_0", "val": 3},
                           {"id": "inst_11_1", "ttl": "Inst_11_1", "val": 78},
                           {"id": "inst_11_2", "ttl": "Inst_11_2", "val": 78},
                     ]
                     },
                    {"id": "inst_18", "ttl": "Inst_18", "val": 80},
                ]
            }



        arrayData.inst_health = inst_health

        return

    
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_pos(self):
        while arrayData.inst_info is None:
            sleep(0.01)
        return self.inst_info


    # ------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------
    def get_tel_type(self, tel_id):
        try:
            tel_type = arrayData.inst_info[tel_id]['type'] 
        except Exception:
            Assert(msg=(' - get_tel_type(' + str(tel_id) +
                '): tel_id not defined?'), state=False)

        return tel_type
    # ------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------
    def is_tel_type(self, tel_id, comp_type):
        is_type = (self.get_tel_type(tel_id) == comp_type)
        return is_type


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def set_inst_id_to_types(self):
        arrayData.tel_id_to_types = dict()
        for tel_id in arrayData.inst_Ids:
            arrayData.tel_id_to_types[tel_id] = self.get_tel_type(tel_id)

        return

        
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_inst_id_to_types(self):
        while arrayData.tel_id_to_types is None:
            sleep(0.01)
        return copy.deepcopy(arrayData.tel_id_to_types)


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_inst_ids(self, inst_types=None):
        while arrayData.inst_Ids is None:
            sleep(0.01)

        if inst_types is None:
            inst_Ids = copy.deepcopy(arrayData.inst_Ids)
        else:
            if isinstance(inst_types, str):
                inst_types = [inst_types]
            inst_Ids = [
                i for i in arrayData.inst_Ids
                if any(self.is_tel_type(i, inst_type) for inst_type in inst_types)
            ]
        return inst_Ids

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getTelHealthD(self):
        while arrayData.inst_health is None:
            sleep(0.01)
        return copy.deepcopy(arrayData.inst_health)


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_sub_array_insts(self):
        while arrayData.sub_array_tels is None:
            sleep(0.01)
        return copy.deepcopy(arrayData.sub_array_tels)


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_inst_id_to_sub_array(self):
        while arrayData.tel_id_to_sub_array is None:
            sleep(0.01)
        return copy.deepcopy(arrayData.tel_id_to_sub_array)






