import gevent
from gevent import sleep
# from gevent.coros import BoundedSemaphore
import copy
from math import sqrt, ceil, floor
import utils
from utils import my_log, my_assert, getTime
# from typing import Iterable


# ------------------------------------------------------------------
# physical position of telescopes etc.
# ------------------------------------------------------------------
class InstData():
    inst_info = None
    inst_health = None
    site_type = None
    tel_ids = None
    inst_Ids = None
    categorical_types = None
    tel_id_to_types = None
    sub_array_tels = None
    tel_id_to_sub_array = None

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, site_type, lock=None, *args, **kwargs):
        self.log = my_log(title=__name__)

        def init():
            self.log.debug([
                ['y', " - initializing InstData - "],
                ['g', 'init_inst_pos()'], ['y', " ..."]
            ])

            InstData.site_type = site_type

            InstData.tel_ids = self.init_tel_ids()
            self.init_inst_pos()

            InstData.aux_ids = self.init_aux_ids()
            self.init_aux_pos()
            
            InstData.proc_ids = self.init_proc_ids()
            self.init_proc_pos()

            InstData.inst_Ids = copy.deepcopy(
                InstData.tel_ids + InstData.aux_ids + 
                InstData.proc_ids)

            self.init_sub_array_tels()
            self.init_tel_health()
            self.set_inst_id_to_types()

        if InstData.inst_info is None:
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
            if InstData.site_type == 'S':
                id_now = 'SA_0'
                sub_array_tels[id_now] = [
                    'Lx00', 'Lx01', 'Lx02', 'Lx03', 'Mx04',
                ]
                id_now = 'SA_1'
                sub_array_tels[id_now] = [
                    'Lx00', 'Lx01', 'Lx02', 'Lx03', 'Mx04',
                    'Mx05', 'Mx06', 'Mx07', 'Mx08', 'Mx09',
                ]

            # ------------------------------------------------------------------
            # north
            # ------------------------------------------------------------------
            elif InstData.site_type == 'N':
                id_now = 'SA_0'
                sub_array_tels[id_now] = [
                    'Lx00', 'Lx01', 'Lx02', 'Lx03', 'Mx04',
                ]
                id_now = 'SA_1'
                sub_array_tels[id_now] = [
                    'Mx05', 'Mx06', 'Mx07', 'Mx08', 'Mx09',
                ]
                id_now = 'SA_2'
                sub_array_tels[id_now] = [
                    'Mx05', 'Mx06', 'Mx07',
                ]
            else:
                raise
        except Exception:
            my_assert(msg=' - trying to do init_sub_array_tels() with site_type = ' +
                   str(InstData.site_type), state=False)

        InstData.sub_array_tels = sub_array_tels
        self.set_tel_id_to_sub_array()

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def set_tel_id_to_sub_array(self):
        tel_id_to_sub_array = dict()
        sub_array_tels = InstData.sub_array_tels

        for (sa_id, tel_ids) in sub_array_tels.items():
            for tel_id in tel_ids:
                if tel_id not in tel_id_to_sub_array:
                    tel_id_to_sub_array[tel_id] = []
                tel_id_to_sub_array[tel_id] += [ sa_id ]

        for tel_id in tel_id_to_sub_array.keys():
            tel_id_to_sub_array[tel_id].sort()

        InstData.tel_id_to_sub_array = tel_id_to_sub_array

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_tel_ids(self):
        try:
            # ------------------------------------------------------------------
            # south
            # ------------------------------------------------------------------
            if InstData.site_type == 'S':
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
            elif InstData.site_type == 'N':
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
            my_assert(msg=' - trying to do init_tel_ids() with site_type = ' +
                   str(InstData.site_type), state=False)

        return tel_ids


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_aux_ids(self):
        try:
            # south
            if InstData.site_type == 'S':
                aux_ids = [
                    'Ax00', 'Ax01', 'Ax02', 'Ax03',
                ]
            # north
            elif InstData.site_type == 'N':
                aux_ids = [
                    'Ax00', 'Ax01', 
                    # 'Ax02',
                ]
            else:
                raise
        except Exception:
            my_assert(msg=' - trying to do init_aux_ids() with site_type = ' +
                   str(InstData.site_type), state=False)

        return aux_ids


    # ------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------
    def init_proc_ids(self):
        try:
            proc_ids = [
                'Px00', 'Px01', 'Px02',
            ]
        except Exception:
            my_assert(msg=' - trying to do init_proc_ids() with site_type = ' +
                   str(InstData.site_type), state=False)

        return proc_ids


    # ------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------
    def add_inst_info_id(self, ids):
        def add_dict_id(id_now, entry):
            try:
                InstData.inst_info[id_now] = entry
                if id_now not in ids:
                    raise
            except Exception:
                my_assert(msg=' - id_now not in InstData for id_now= ' +
                       str(id_now), state=False)
            return
        return add_dict_id

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_inst_pos(self):
        if InstData.inst_info is None:
            InstData.inst_info = dict()

        add_dict_id = self.add_inst_info_id(InstData.tel_ids)

        # ------------------------------------------------------------------
        # south
        # ------------------------------------------------------------------
        if InstData.site_type == 'S':
            id_now = "Lx00"
            add_dict_id(id_now, {'x':  65, 'y': -20, 'type': 'LST'})
            id_now = "Lx01"
            add_dict_id(id_now, {'x': -65, 'y': -20, 'type': 'LST'})
            id_now = "Lx02"
            add_dict_id(id_now, {'x':  0, 'y':  80, 'type': 'LST'})
            id_now = "Lx03"
            add_dict_id(id_now, {'x':  0, 'y': -110, 'type': 'LST'})
            id_now = "Mx04"
            add_dict_id(id_now, {'x': -151.2, 'y':  0, 'type': 'MST'})
            id_now = "Mx05"
            add_dict_id(id_now, {'x':  151.2, 'y':  0, 'type': 'MST'})
            id_now = "Mx06"
            add_dict_id(id_now, {'x': -105.6, 'y': -136.656, 'type': 'MST'})
            id_now = "Mx07"
            add_dict_id(id_now, {'x':  105.6, 'y': -136.656, 'type': 'MST'})
            id_now = "Mx08"
            add_dict_id(id_now, {'x': -85.6, 'y': -136.656, 'type': 'MST'})
            id_now = "Mx09"
            add_dict_id(id_now, {'x':  85.6, 'y': -136.656, 'type': 'MST'})
            id_now = "Mx10"
            add_dict_id(id_now, {'x':  0, 'y': -308.41, 'type': 'MST'})
            id_now = "Mx11"
            add_dict_id(id_now, {'x':  0, 'y':  308.41, 'type': 'MST'})
            id_now = "Mx12"
            add_dict_id(id_now, {
                'x': -238.474, 'y': -154.205, 'type': 'MST'})
            id_now = "Mx13"
            add_dict_id(id_now, {
                'x':  238.474, 'y': -154.205, 'type': 'MST'})
            id_now = "Mx14"
            add_dict_id(id_now, {
                'x': -238.474, 'y':  154.205, 'type': 'MST'})
            id_now = "Mx15"
            add_dict_id(id_now, {
                'x':  238.474, 'y':  154.205, 'type': 'MST'})
            id_now = "Mx16"
            add_dict_id(id_now, {'x':  0, 'y': -582.17, 'type': 'MST'})
            id_now = "Mx17"
            add_dict_id(id_now, {'x':  0, 'y':  582.17, 'type': 'MST'})
            id_now = "Mx18"
            add_dict_id(id_now, {
                'x':  450.155, 'y': -291.085, 'type': 'MST'})
            id_now = "Mx19"
            add_dict_id(id_now, {
                'x': -450.155, 'y': -291.085, 'type': 'MST'})
            id_now = "Mx20"
            add_dict_id(id_now, {
                'x': -450.155, 'y':  291.085, 'type': 'MST'})
            id_now = "Mx21"
            add_dict_id(id_now, {
                'x':  450.155, 'y':  291.085, 'type': 'MST'})
            id_now = "Mx22"
            add_dict_id(id_now, {
                'x': -162.621, 'y': -345.468, 'type': 'MST'})
            id_now = "Mx23"
            add_dict_id(id_now, {
                'x':  162.621, 'y': -345.468, 'type': 'MST'})
            id_now = "Mx24"
            add_dict_id(id_now, {
                'x': -162.621, 'y':  315.468, 'type': 'MST'})
            id_now = "Mx25"
            add_dict_id(id_now, {
                'x':  162.621, 'y':  315.468, 'type': 'MST'})
            id_now = "Mx26"
            add_dict_id(id_now, {'x': -325.242, 'y':  0, 'type': 'MST'})
            id_now = "Mx27"
            add_dict_id(id_now, {'x':  325.242, 'y':  0, 'type': 'MST'})
            id_now = "Mx28"
            add_dict_id(id_now, {'x':  0, 'y':  0, 'type': 'MST'})
            id_now = "Sx29"
            add_dict_id(id_now, {'x': -723.527, 'y':  0, 'type': 'SST'})
            id_now = "Sx30"
            add_dict_id(id_now, {'x':  723.527, 'y':  0, 'type': 'SST'})
            id_now = "Sx31"
            add_dict_id(id_now, {'x': -100, 'y': -494.469, 'type': 'SST'})
            id_now = "Sx32"
            add_dict_id(id_now, {'x':  100, 'y': -494.469, 'type': 'SST'})
            id_now = "Sx33"
            add_dict_id(id_now, {'x': -100, 'y':  494.469, 'type': 'SST'})
            id_now = "Sx34"
            add_dict_id(id_now, {'x':  100, 'y':  494.469, 'type': 'SST'})
            id_now = "Sx35"
            add_dict_id(id_now, {
                'x':  424.824, 'y': -164.823, 'type': 'SST'})
            id_now = "Sx36"
            add_dict_id(id_now, {
                'x': -424.824, 'y': -164.823, 'type': 'SST'})
            id_now = "Sx37"
            add_dict_id(id_now, {
                'x': -424.824, 'y':  164.823, 'type': 'SST'})
            id_now = "Sx38"
            add_dict_id(id_now, {
                'x':  424.824, 'y':  164.823, 'type': 'SST'})
            id_now = "Sx39"
            add_dict_id(id_now, {'x': -519.795, 'y':  0, 'type': 'SST'})
            id_now = "Sx40"
            add_dict_id(id_now, {'x':  519.795, 'y':  0, 'type': 'SST'})
            id_now = "Sx41"
            add_dict_id(id_now, {
                'x':  569.216, 'y': -662.533, 'type': 'SST'})
            id_now = "Sx42"
            add_dict_id(id_now, {
                'x': -569.216, 'y': -662.533, 'type': 'SST'})
            id_now = "Sx43"
            add_dict_id(id_now, {
                'x':  569.216, 'y':  662.533, 'type': 'SST'})
            id_now = "Sx44"
            add_dict_id(id_now, {
                'x': -569.216, 'y':  662.533, 'type': 'SST'})
            id_now = "Sx45"
            add_dict_id(id_now, {
                'x': -796.903, 'y': -220.844, 'type': 'SST'})
            id_now = "Sx46"
            add_dict_id(id_now, {
                'x':  796.903, 'y': -220.844, 'type': 'SST'})
            id_now = "Sx47"
            add_dict_id(id_now, {
                'x':  796.903, 'y':  220.844, 'type': 'SST'})
            id_now = "Sx48"
            add_dict_id(id_now, {
                'x': -796.903, 'y':  220.844, 'type': 'SST'})
            id_now = "Sx49"
            add_dict_id(id_now, {
                'x': -227.687, 'y': -883.377, 'type': 'SST'})
            id_now = "Sx50"
            add_dict_id(id_now, {
                'x':  227.687, 'y': -883.377, 'type': 'SST'})
            id_now = "Sx51"
            add_dict_id(id_now, {
                'x': -227.687, 'y':  883.377, 'type': 'SST'})
            id_now = "Sx52"
            add_dict_id(id_now, {
                'x':  227.687, 'y':  883.377, 'type': 'SST'})
            id_now = "Sx53"
            add_dict_id(id_now, {'x': -944.301, 'y':  0, 'type': 'SST'})
            id_now = "Sx54"
            add_dict_id(id_now, {'x':  944.301, 'y':  0, 'type': 'SST'})
            id_now = "Sx55"
            add_dict_id(id_now, {
                'x':  472.151, 'y': -915.923, 'type': 'SST'})
            id_now = "Sx56"
            add_dict_id(id_now, {
                'x': -472.151, 'y': -915.923, 'type': 'SST'})
            id_now = "Sx57"
            add_dict_id(id_now, {
                'x': -472.151, 'y':  915.923, 'type': 'SST'})
            id_now = "Sx58"
            add_dict_id(id_now, {
                'x':  472.151, 'y':  915.923, 'type': 'SST'})
            id_now = "Sx59"
            add_dict_id(id_now, {
                'x': -971.21, 'y': -471.012, 'type': 'SST'})
            id_now = "Sx60"
            add_dict_id(id_now, {
                'x':  971.21, 'y': -471.012, 'type': 'SST'})
            id_now = "Sx61"
            add_dict_id(id_now, {
                'x': -971.21, 'y':  471.012, 'type': 'SST'})
            id_now = "Sx62"
            add_dict_id(id_now, {
                'x':  971.21, 'y':  471.012, 'type': 'SST'})
            id_now = "Sx63"
            add_dict_id(id_now, {
                'x':  849.809, 'y': -706.518, 'type': 'SST'})
            id_now = "Sx64"
            add_dict_id(id_now, {
                'x': -849.809, 'y': -706.518, 'type': 'SST'})
            id_now = "Sx65"
            add_dict_id(id_now, {
                'x': -849.809, 'y':  706.518, 'type': 'SST'})
            id_now = "Sx66"
            add_dict_id(id_now, {
                'x':  849.809, 'y':  706.518, 'type': 'SST'})
            id_now = "Sx67"
            add_dict_id(id_now, {
                'x':  369.912, 'y': -1195.98, 'type': 'SST'})
            id_now = "Sx68"
            add_dict_id(id_now, {
                'x': -369.912, 'y': -1195.98, 'type': 'SST'})
            id_now = "Sx69"
            add_dict_id(id_now, {
                'x': -369.912, 'y':  1195.98, 'type': 'SST'})
            id_now = "Sx70"
            add_dict_id(id_now, {
                'x':  369.912, 'y':  1195.98, 'type': 'SST'})
            id_now = "Sx71"
            add_dict_id(id_now, {
                'x':  1109.73, 'y': -239.197, 'type': 'SST'})
            id_now = "Sx72"
            add_dict_id(id_now, {
                'x': -1109.73, 'y': -239.197, 'type': 'SST'})
            id_now = "Sx73"
            add_dict_id(id_now, {
                'x': -1109.73, 'y':  239.197, 'type': 'SST'})
            id_now = "Sx74"
            add_dict_id(id_now, {
                'x':  1109.73, 'y':  239.197, 'type': 'SST'})
            id_now = "Sx75"
            add_dict_id(id_now, {
                'x':  739.823, 'y': -956.787, 'type': 'SST'})
            id_now = "Sx76"
            add_dict_id(id_now, {
                'x': -739.823, 'y': -956.787, 'type': 'SST'})
            id_now = "Sx77"
            add_dict_id(id_now, {
                'x': -739.823, 'y':  956.787, 'type': 'SST'})
            id_now = "Sx78"
            add_dict_id(id_now, {
                'x':  739.823, 'y':  956.787, 'type': 'SST'})
            id_now = "Sx79"
            add_dict_id(id_now, {
                'x':  403.739, 'y': -391.606, 'type': 'SST'})
            id_now = "Sx80"
            add_dict_id(id_now, {
                'x': -403.739, 'y': -391.606, 'type': 'SST'})
            id_now = "Sx81"
            add_dict_id(id_now, {
                'x': -403.739, 'y':  391.606, 'type': 'SST'})
            id_now = "Sx82"
            add_dict_id(id_now, {
                'x':  403.739, 'y':  391.606, 'type': 'SST'})
            id_now = "Sx83"
            add_dict_id(id_now, {
                'x':  318.611, 'y': -618.073, 'type': 'SST'})
            id_now = "Sx84"
            add_dict_id(id_now, {
                'x': -318.611, 'y': -618.073, 'type': 'SST'})
            id_now = "Sx85"
            add_dict_id(id_now, {
                'x': -318.611, 'y':  618.073, 'type': 'SST'})
            id_now = "Sx86"
            add_dict_id(id_now, {
                'x':  318.611, 'y':  618.073, 'type': 'SST'})
            id_now = "Sx87"
            add_dict_id(id_now, {
                'x':  673.186, 'y': -435.304, 'type': 'SST'})
            id_now = "Sx88"
            add_dict_id(id_now, {
                'x': -673.186, 'y': -435.304, 'type': 'SST'})
            id_now = "Sx89"
            add_dict_id(id_now, {
                'x': -673.186, 'y':  435.304, 'type': 'SST'})
            id_now = "Sx90"
            add_dict_id(id_now, {
                'x':  673.186, 'y':  435.304, 'type': 'SST'})
            id_now = "Sx91"
            add_dict_id(id_now, {'x':  168.9, 'y': -225.5, 'type': 'SST'})
            id_now = "Sx92"
            add_dict_id(id_now, {'x': -168.9, 'y': -225.5, 'type': 'SST'})
            id_now = "Sx93"
            add_dict_id(id_now, {'x': -158.9, 'y':  205.5, 'type': 'SST'})
            id_now = "Sx94"
            add_dict_id(id_now, {'x':  158.9, 'y':  205.5, 'type': 'SST'})
            id_now = "Sx95"
            add_dict_id(id_now, {'x':  0, 'y':  1100, 'type': 'SST'})
            id_now = "Sx96"
            add_dict_id(id_now, {'x':  0, 'y': -1100, 'type': 'SST'})
            id_now = "Sx97"
            add_dict_id(id_now, {'x':  0, 'y': -820, 'type': 'SST'})
            id_now = "Sx98"
            add_dict_id(id_now, {'x':  0, 'y':  820, 'type': 'SST'})

            # ------------------------------------------------------------------
            #
            # ------------------------------------------------------------------
            id_now = "Mx06"
            InstData.inst_info[id_now]['x'] -= 50
            id_now = "Mx07"
            InstData.inst_info[id_now]['x'] += 50
            id_now = "Mx08"
            InstData.inst_info[id_now]['x'] += 5
            id_now = "Mx09"
            InstData.inst_info[id_now]['x'] -= 5

            for id_now, ele_now in InstData.inst_info.iteritems():
                ref = sqrt(ele_now['x']*ele_now['x']+ele_now['y']*ele_now['y'])
                if ref > 900:
                    add_factor = 0.50
                elif ref > 700:
                    add_factor = 0.55
                elif ref > 310:
                    add_factor = 0.65
                elif ref > 140:
                    add_factor = 0.75
                elif ref > 50:
                    add_factor = 0.90
                else:
                    add_factor = 1
                for xy_now in ['x', 'y']:
                    ele_now[xy_now] *= add_factor

        # ------------------------------------------------------------------
        # north
        # ------------------------------------------------------------------
        if InstData.site_type == 'N':
            id_now = "Lx00"
            add_dict_id(id_now, {'x':  7.23, 'y': -70.05, 'type': 'LST'})
            id_now = "Lx01"
            add_dict_id(id_now, {'x': -71.29, 'y': -12.3, 'type': 'LST'})
            id_now = "Lx02"
            add_dict_id(id_now, {'x': -8.2, 'y':  71.82, 'type': 'LST'})
            id_now = "Lx03"
            add_dict_id(id_now, {'x':  68.07, 'y':  9.31, 'type': 'LST'})
            id_now = "Mx04"
            add_dict_id(id_now, {'x':  0, 'y':  0, 'type': 'MST'})
            id_now = "Mx05"
            add_dict_id(id_now, {'x': -196.9, 'y': -22.53, 'type': 'MST'})
            id_now = "Mx06"
            add_dict_id(id_now, {'x': -124.51, 'y':  100.94, 'type': 'MST'})
            id_now = "Mx07"
            add_dict_id(id_now, {'x': -28.52, 'y':  180.32, 'type': 'MST'})
            id_now = "Mx08"
            add_dict_id(id_now, {'x':  125.28, 'y':  169.43, 'type': 'MST'})
            id_now = "Mx09"
            add_dict_id(id_now, {'x':  199.05, 'y':  20.56, 'type': 'MST'})
            id_now = "Mx10"
            add_dict_id(id_now, {'x':  126.3, 'y': -97.35, 'type': 'MST'})
            id_now = "Mx11"
            add_dict_id(id_now, {'x':  26.45, 'y': -198.59, 'type': 'MST'})
            id_now = "Mx12"
            add_dict_id(id_now, {'x': -124.22, 'y': -168.79, 'type': 'MST'})
            id_now = "Mx13"
            add_dict_id(id_now, {'x': -212.53, 'y':  246.7, 'type': 'MST'})
            id_now = "Mx14"
            add_dict_id(id_now, {'x':  62.3, 'y':  316.37, 'type': 'MST'})
            id_now = "Mx15"
            add_dict_id(id_now, {'x':  285.57, 'y':  141.75, 'type': 'MST'})
            id_now = "Mx16"
            add_dict_id(id_now, {'x':  267.24, 'y': -131.76, 'type': 'MST'})
            id_now = "Mx17"
            add_dict_id(id_now, {'x': -284.99, 'y': -116.01, 'type': 'MST'})
            id_now = "Mx18"
            add_dict_id(id_now, {'x': -321.44, 'y':  66.39, 'type': 'MST'})

            # ------------------------------------------------------------------
            #
            # ------------------------------------------------------------------
            for id_now, ele_now in InstData.inst_info.iteritems():
                ref = sqrt(ele_now['x']*ele_now['x']+ele_now['y']*ele_now['y'])
                if ref > 210:
                    add_factor = 0.55
                elif ref > 100:
                    add_factor = 0.8
                else:
                    add_factor = 1
                for xy_now in ['x', 'y']:
                    ele_now[xy_now] *= add_factor

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_aux_pos(self):
        if InstData.inst_info is None:
            InstData.inst_info = dict()

        add_dict_id = self.add_inst_info_id(InstData.aux_ids)

        # ------------------------------------------------------------------
        # south
        # ------------------------------------------------------------------
        if InstData.site_type == 'S':
            # ------------------------------------------------------------------
            #
            # ------------------------------------------------------------------
            id_now = "Ax00"
            add_dict_id(id_now, {'x':  190, 'y':  320, 'type': 'AUX'})
            id_now = "Ax01"
            add_dict_id(id_now, {'x':  15, 'y': -35, 'type': 'AUX'})
            id_now = "Ax02"
            add_dict_id(id_now, {'x': -185, 'y':  170, 'type': 'AUX'})
            id_now = "Ax03"
            add_dict_id(id_now, {'x': -210, 'y': -290, 'type': 'AUX'})

            for id_now, ele_now in InstData.inst_info.iteritems():
                ref = sqrt(ele_now['x']*ele_now['x']+ele_now['y']*ele_now['y'])
                if ref > 900:
                    add_factor = 0.50
                elif ref > 700:
                    add_factor = 0.55
                elif ref > 310:
                    add_factor = 0.65
                elif ref > 140:
                    add_factor = 0.75
                elif ref > 50:
                    add_factor = 0.90
                else:
                    add_factor = 1
                for xy_now in ['x', 'y']:
                    ele_now[xy_now] *= add_factor

        # ------------------------------------------------------------------
        # north
        # ------------------------------------------------------------------
        if InstData.site_type == 'N':
            # ------------------------------------------------------------------
            #
            # ------------------------------------------------------------------
            id_now = "Ax00"
            add_dict_id(id_now, {'x':  30, 'y':  92, 'type': 'AUX'})
            id_now = "Ax01"
            add_dict_id(id_now, {'x':  45, 'y': -35, 'type': 'AUX'})
            # id_now = "Ax02"
            # add_dict_id(id_now, {'x': -50, 'y':  -70, 'type': 'AUX'})

            for id_now, ele_now in InstData.inst_info.iteritems():
                ref = sqrt(ele_now['x']*ele_now['x']+ele_now['y']*ele_now['y'])
                if ref > 210:
                    add_factor = 0.55
                elif ref > 100:
                    add_factor = 0.8
                else:
                    add_factor = 1
                for xy_now in ['x', 'y']:
                    ele_now[xy_now] *= add_factor

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_proc_pos(self):
        if InstData.inst_info is None:
            InstData.inst_info = dict()

        add_dict_id = self.add_inst_info_id(InstData.proc_ids)

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        id_now = "Px00"
        add_dict_id(id_now, {'x':  5, 'y':  0, 'type': 'PROC'})
        id_now = "Px01"
        add_dict_id(id_now, {'x':  0, 'y':  5, 'type': 'PROC'})
        id_now = "Px02"
        add_dict_id(id_now, {'x':  0, 'y':  -5, 'type': 'PROC'})


        # ------------------------------------------------------------------
        # 
        # ------------------------------------------------------------------
        InstData.categorical_types = ['PROC']

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_tel_health(self):
        inst_health = dict()
        tel_ids = InstData.tel_ids
        aux_ids = InstData.aux_ids
        proc_ids = InstData.proc_ids

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        for id_now in tel_ids:
            inst_health[id_now] = dict()

            inst_health[id_now]["camera"] = {
                "id": "camera", "title": "Camera", "val": 20,
                "children": [
                    {"id": "camera_0", "title": "Camera_0", "val": 100},
                    {"id": "camera_1", "title": "Camera_1", "val": 10,
                     "children": [
                           {"id": "camera_1_0", "title": "Camera_1_0", "val": 3},
                           {"id": "camera_1_1", "title": "Camera_1_1", "val": 78},
                     ]
                     },
                    {"id": "camera_6", "title": "Camera_6", "val": 80},
                    {"id": "camera_8", "title": "Camera_8", "val": 80},
                ]
            }

            inst_health[id_now]["mount"] = {
                "id": "mount", "title": "Mount", "val": 100,
                "children": [
                    {"id": "mount_0", "title": "Mount_0", "val": 10},
                    {"id":  "mount_1", "title": "Mount_1", "val": 78,
                     "children": [
                         {"id": "mount_1_0", "title": "Mount_1_0", "val": 10},
                         {"id":  "mount_1_1", "title": "Mount_1_1", "val": 90,
                          "children": [
                              {"id": "mount_1_1_0",
                               "title": "Mount_1_1_0", "val": 95},
                              {"id": "mount_1_1_1",
                               "title": "Mount_1_1_1", "val": 95},
                              {"id": "mount_1_1_2",
                               "title": "Mount_1_1_2", "val": 95},
                              {"id": "mount_1_1_3",
                               "title": "Mount_1_1_3", "val": 95},
                          ]
                          },
                         {"id": "mount_1_2", "title": "Mount_1_2", "val": 60},
                         {"id":  "mount_1_3", "title": "Mount_1_3", "val": 90,
                          "children": [
                              {"id": "mount_1_3_0",
                               "title": "Mount_1_3_0", "val": 95},
                              {"id": "mount_1_3_1",
                               "title": "Mount_1_3_1", "val": 95},
                              {"id": "mount_1_3_2",
                               "title": "Mount_1_3_2", "val": 95},
                              {"id": "mount_1_3_3",
                               "title": "Mount_1_3_3", "val": 95},
                          ]
                          },
                         {"id": "mount_1_4", "title": "Mount_1_4", "val": 85},
                     ]
                     },
                    {"id": "mount_2", "title": "Mount_2", "val": 40},
                ]
            }

            if InstData.inst_info[id_now]['type'] == 'LST':
                inst_health[id_now]["mirror"] = {
                    "id": "mirror", "title": "Mirror", "val": 10,
                    "children": [
                        {"id": "mirror_0", "title": "Mirror_0", "val": 3},
                        {"id":  "mirror_1", "title": "Mirror_1", "val": 78,
                         "children": [
                             {"id": "mirror_1_1", "title": "Mirror_0", "val": 3},
                             {"id":  "mirror_1_0", "title": "Mirror_1_0", "val": 28,
                              "children": [
                                  {"id": "mirror_1_0_0",
                                   "title": "Mirror_1_0_0", "val": 90},
                                  {"id": "mirror_1_0_1",
                                   "title": "Mirror_1_0_1", "val": 90},
                              ]
                              },
                         ]
                         },
                    ]
                }

            # else:
            #     inst_health[id_now]["mirror"] = {
            #         "id": "mirror", "title": "Mirror", "val": 10,
            #         "children": [
            #             {"id": "mirror_0", "title": "Mirror_0", "val": 3},
            #             {"id": "mirror_1", "title": "Mirror_1", "val": 78},
            #         ]
            #     }

            inst_health[id_now]["daq"] = {
                "id": "daq", "title": "DAQ", "val": 87,
                "children": [
                    {"id":  "daq_3", "title": "DAQ_3", "val": 50},
                    {"id":  "daq_7", "title": "DAQ_7", "val": 50,
                     "children": [
                         {"id": "daq_7_0", "title": "DAQ_7_0", "val": 10},
                         {"id": "daq_7_1", "title": "DAQ_7_1", "val": 20},
                         {"id": "daq_7_2", "title": "DAQ_7_2", "val": 85},
                         {"id": "daq_7_3", "title": "DAQ_7_3", "val": 85},
                         {"id": "daq_7_4", "title": "DAQ_7_4", "val": 85},
                         {"id": "daq_7_5", "title": "DAQ_7_5", "val": 85},
                         {"id": "daq_7_6", "title": "DAQ_7_6", "val": 85},
                     ]
                     },
                    {"id":  "daq_8", "title": "DAQ_8", "val": 50,
                     "children": [
                         {"id": "daq_8_0", "title": "DAQ_8_0", "val": 10},
                         {"id": "daq_8_1", "title": "DAQ_8_1", "val": 90},
                         {"id": "daq_8_2", "title": "DAQ_8_2", "val": 85},
                         {"id": "daq_8_30000", "title": "DAQ_8_30000", "val": 85},
                     ]
                     },
                ]
            }

            if InstData.inst_info[id_now]['type'] == 'LST':
                inst_health[id_now]["aux"] = {
                    "id": "aux", "title": "Aux", "val": 70,
                    "children": [
                        {"id": "aux_0", "title": "Aux_0", "val": 90},
                        {"id":  "aux_1", "title": "Aux_1", "val": 78,
                         "children": [
                             {"id": "aux_1_0", "title": "Aux_1_0", "val": 10},
                             {"id": "aux_1_4", "title": "Aux_1_4", "val": 85},
                         ]
                         },
                        {"id":  "aux_3", "title": "Aux_3", "val": 78,
                         "children": [
                             {"id": "aux_3_0", "title": "Aux_3_0", "val": 90},
                             {"id": "aux_3_1", "title": "Aux_3_1", "val": 15},
                             {"id": "aux_3_2", "title": "Aux_3_2", "val": 5},
                         ]
                         },
                    ]
                }


        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        for id_now in aux_ids:
            inst_health[id_now] = dict()

            inst_health[id_now]["inst_0"] = {
                "id": "inst_0", "title": "Inst_0", "val": 20,
                "children": [
                    {"id": "inst_00", "title": "Inst_00", "val": 100},
                    {"id": "inst_01", "title": "Inst_01", "val": 10,
                     "children": [
                           {"id": "inst_01_0", "title": "Inst_01_0", "val": 3},
                           {"id": "inst_01_1", "title": "Inst_01_1", "val": 78},
                     ]
                     },
                    {"id": "inst_06", "title": "Inst_06", "val": 80},
                    {"id": "inst_08", "title": "Inst_08", "val": 80},
                ]
            }
            inst_health[id_now]["inst_1"] = {
                "id": "inst_1", "title": "Inst_1", "val": 20,
                "children": [
                    {"id": "inst_10", "title": "Inst_10", "val": 100},
                    {"id": "inst_11", "title": "Inst_11", "val": 10,
                     "children": [
                           {"id": "inst_11_0", "title": "Inst_11_0", "val": 3},
                           {"id": "inst_11_1", "title": "Inst_11_1", "val": 78},
                           {"id": "inst_11_2", "title": "Inst_11_2", "val": 78},
                     ]
                     },
                    {"id": "inst_18", "title": "Inst_18", "val": 80},
                ]
            }


        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        for id_now in proc_ids:
            inst_health[id_now] = dict()

            inst_health[id_now]["prc_0"] = {
                "id": "prc_0", "title": "Prc_0", "val": 20,
                "children": [
                    {"id": "prc_00", "title": "Prc_00", "val": 100},
                    {"id": "prc_01", "title": "Prc_01", "val": 10,
                     "children": [
                           {"id": "prc_01_0", "title": "Prc_01_0", "val": 3},
                           {"id": "prc_01_1", "title": "Prc_01_1", "val": 78},
                           {"id": "prc_01_2", "title": "Prc_01_1", "val": 78},
                     ]
                     },
                     {"id": "prc_02", "title": "Prc_02", "val": 10,
                      "children": [
                            {"id": "prc_02_0", "title": "Prc_02_0", "val": 3},
                            {"id": "prc_02_1", "title": "Prc_02_1", "val": 78},
                      ]
                      },
                    {"id": "prc_03", "title": "Prc_03", "val": 80},
                    {"id": "prc_04", "title": "Prc_04", "val": 80},
                    {"id": "prc_05", "title": "Prc_05", "val": 80},
                ]
            }
            inst_health[id_now]["prc_1"] = {
                "id": "prc_1", "title": "Prc_1", "val": 20,
                "children": [
                    {"id": "prc_11", "title": "Prc_11", "val": 10,
                     "children": [
                           {"id": "prc_11_1", "title": "Prc_11_1", "val": 78},
                           {"id": "prc_11_2", "title": "Prc_11_2", "val": 78},
                     ]
                     },
                    {"id": "prc_15", "title": "Prc_15", "val": 80},
                    {"id": "prc_16", "title": "Prc_16", "val": 10,
                     "children": [
                           {"id": "prc_16_1", "title": "Prc_16_1", "val": 78},
                           {"id": "prc_16_2", "title": "Prc_16_2", "val": 78},
                           {"id": "prc_16_4", "title": "Prc_16_4", "val": 78},
                     ]
                     },
                ]
            }

        # ------------------------------------------------------------------
        # 
        # ------------------------------------------------------------------
        InstData.inst_health = inst_health

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_inst_pos(self):
        while InstData.inst_info is None:
            sleep(0.01)
        return self.inst_info


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_type(self, tel_id):
        try:
            tel_type = InstData.inst_info[tel_id]['type']
        except Exception:
            my_assert(msg=(' - get_tel_type(' + str(tel_id) +
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
        InstData.tel_id_to_types = dict()
        for tel_id in InstData.inst_Ids:
            InstData.tel_id_to_types[tel_id] = self.get_tel_type(tel_id)

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_inst_id_to_types(self):
        while InstData.tel_id_to_types is None:
            sleep(0.01)
        return copy.deepcopy(InstData.tel_id_to_types)


    # ------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------
    def get_categorical_types(self):
        while InstData.categorical_types is None:
            sleep(0.01)
        return copy.deepcopy(InstData.categorical_types)

    
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_inst_ids(self, inst_types=None):
        n_tries, max_n_tries = 0, 1e3
        while InstData.inst_Ids is None:
            n_tries += 1
            my_assert(msg=' - cant init InstData ?!?', 
                state=(n_tries < max_n_tries))
            sleep(0.01)

        if inst_types is None:
            inst_Ids = copy.deepcopy(InstData.inst_Ids)
        else:
            if isinstance(inst_types, str):
                inst_types = [inst_types]
            # else:
            #     my_assert(msg=' - inst_types must be str or list ... ' +
            #            str(inst_types), state=isinstance(inst_types, Iterable))

            inst_Ids = [
                i for i in InstData.inst_Ids
                if any(
                    self.is_tel_type(i, inst_type) 
                    for inst_type in inst_types
                )
            ]
        return inst_Ids


    # ------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------
    def get_proc_ids(self, inst_types=None):
        n_tries, max_n_tries = 0, 1e3
        while InstData.proc_ids is None:
            n_tries += 1
            my_assert(msg=' - cant init InstData ?!?', 
                state=(n_tries < max_n_tries))
            sleep(0.01)

        return copy.deepcopy(InstData.proc_ids)


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_healths(self):
        while InstData.inst_health is None:
            sleep(0.01)
        return copy.deepcopy(InstData.inst_health)


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_sub_array_insts(self):
        while InstData.sub_array_tels is None:
            sleep(0.01)
        return copy.deepcopy(InstData.sub_array_tels)


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_inst_id_to_sub_array(self):
        while InstData.tel_id_to_sub_array is None:
            sleep(0.01)
        return copy.deepcopy(InstData.tel_id_to_sub_array)


