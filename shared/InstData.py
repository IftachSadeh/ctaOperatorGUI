import sys
import copy
from time import sleep
from random import Random

from shared.LogParser import LogParser


# ------------------------------------------------------------------
# physical position of telescopes etc.
# ------------------------------------------------------------------
class InstData():
    inst_info = None
    inst_health = None
    site_type = None
    tel_ids = None
    inst_ids = None
    categorical_types = None
    tel_id_to_types = None
    sub_array_tels = None
    tel_id_to_sub_array = None
    has_init = False

    # ------------------------------------------------------------------
    def __init__(self, base_config, lock=None, *args, **kwargs):
        self.log = LogParser(base_config=base_config, title=__name__)

        def init():
            self.log.debug([
                ['y', ' - initializing InstData - '],
                ['g', 'init_inst_pos()'],
                ['y', ' ...'],
            ])

            self.base_config = base_config
            self.base_config.inst_data = self

            InstData.site_type = self.base_config.site_type

            InstData.tel_ids = self.init_tel_ids()
            self.init_inst_pos()

            InstData.aux_ids = self.init_aux_ids()
            self.init_aux_pos()

            InstData.proc_ids = self.init_proc_ids()
            self.init_proc_pos()

            self.scale_inst_pos()

            InstData.inst_ids = copy.deepcopy(
                InstData.tel_ids + InstData.aux_ids + InstData.proc_ids
            )

            self.init_sub_array_tels()
            self.init_tel_health()
            self.set_inst_id_to_types()
            self.set_inst_states()

            InstData.has_init = True

            return

        if InstData.inst_info is None:
            if lock is not None:
                with lock:
                    init()
            else:
                init()

        return

    # ------------------------------------------------------------------
    @property
    def health_tag(self):
        return 'health'

    # ------------------------------------------------------------------
    @property
    def health_title(self):
        return 'Health'

    # ------------------------------------------------------------------
    @property
    def inst_states(self):
        return self._inst_states

    # ------------------------------------------------------------------
    def set_inst_states(self):

        small_negative = -10 * sys.float_info.epsilon
        err_thresh = 30
        warn_thresh = 55
        nominal_thresh = 101

        InstData._inst_states = [
            {
                'name': 'DISCONNECTED',
                'thresholds': [-1 * nominal_thresh, small_negative],
            },
            {
                'name': 'ERROR',
                'thresholds': [small_negative, err_thresh],
            },
            {
                'name': 'WARNING',
                'thresholds': [err_thresh, warn_thresh],
            },
            {
                'name': 'NOMINAL',
                'thresholds': [warn_thresh, nominal_thresh],
            },
        ]

        return

    # ------------------------------------------------------------------
    def init_sub_array_tels(self):
        sub_array_tels = dict()

        # print(' -- FIXME -- implement SBs ....')

        try:
            # south
            if self.is_south_site():
                id_now = 'SA_00'
                sub_array_tels[id_now] = ['Lx01', 'Lx02', 'Lx03', 'Lx04']
                id_now = 'SA_01'
                sub_array_tels[id_now] = [
                    'Mx01', 'Mx02', 'Mx03', 'Mx04', 'Mx05', 'Mx06', 'Mx07', 'Mx08',
                    'Mx09', 'Mx10', 'Mx11', 'Mx12', 'Mx13'
                ]
                id_now = 'SA_02'
                sub_array_tels[id_now] = [
                    'Mx14', 'Mx15', 'Mx16', 'Mx17', 'Mx18', 'Mx19', 'Mx20', 'Mx21',
                    'Mx22', 'Mx23', 'Mx24', 'Mx25'
                ]
                id_now = 'SA_03'
                sub_array_tels[id_now] = [
                    'Sx01', 'Sx02', 'Sx03', 'Sx04', 'Sx05', 'Sx06', 'Sx07', 'Sx08',
                    'Sx09', 'Sx10', 'Sx11', 'Sx12', 'Sx13', 'Sx14', 'Sx15', 'Sx16',
                    'Sx17', 'Sx18', 'Sx19', 'Sx20', 'Sx21', 'Sx22', 'Sx23', 'Sx24',
                    'Sx25', 'Sx26', 'Sx27', 'Sx28', 'Sx29', 'Sx30', 'Sx31', 'Sx32',
                    'Sx33', 'Sx34', 'Sx35', 'Sx36', 'Sx37', 'Sx38', 'Sx39', 'Sx40',
                    'Sx41', 'Sx42', 'Sx43', 'Sx44', 'Sx45', 'Sx46', 'Sx47', 'Sx48',
                    'Sx49', 'Sx50', 'Sx51', 'Sx52', 'Sx53', 'Sx54', 'Sx55', 'Sx56',
                    'Sx57', 'Sx58', 'Sx59', 'Sx60', 'Sx61', 'Sx62', 'Sx63', 'Sx64',
                    'Sx65', 'Sx66', 'Sx67', 'Sx68', 'Sx69', 'Sx70'
                ]

            # north
            elif not self.is_south_site():
                id_now = 'SA_00'
                sub_array_tels[id_now] = ['Lx01', 'Lx02']
                id_now = 'SA_01'
                sub_array_tels[id_now] = ['Lx03', 'Lx04']
                id_now = 'SA_02'
                sub_array_tels[id_now] = [
                    'Mx01', 'Mx02', 'Mx03', 'Mx04', 'Mx05', 'Mx06', 'Mx07', 'Mx08'
                ]
                id_now = 'SA_03'
                sub_array_tels[id_now] = [
                    'Mx09', 'Mx10', 'Mx11', 'Mx12', 'Mx13', 'Mx14', 'Mx15'
                ]
            else:
                raise Exception()
        except Exception:
            self.log.critical([
                ['wr', ' - cant do init_sub_array_tels()...'],
                ['wr', ' --> Will terminate!'],
            ])
            raise Exception()

        id_now = 'SA_04'
        sub_array_tels[id_now] = sub_array_tels['SA_00'] + sub_array_tels['SA_01']

        id_now = 'SA_05'
        sub_array_tels[id_now] = sub_array_tels['SA_04'] + sub_array_tels['SA_02']
        id_now = 'SA_06'
        sub_array_tels[id_now] = sub_array_tels['SA_04'] + sub_array_tels['SA_03']
        id_now = 'SA_07'
        sub_array_tels[id_now] = sub_array_tels['SA_02'] + sub_array_tels['SA_03']
        id_now = 'SA_08'
        sub_array_tels[id_now] = sub_array_tels['SA_04'] + sub_array_tels['SA_07']

        id_now = 'SA_09'
        sub_array_tels[id_now] = sub_array_tels['SA_00'] + sub_array_tels['SA_02']
        id_now = 'SA_11'
        sub_array_tels[id_now] = sub_array_tels['SA_01'] + sub_array_tels['SA_03']

        InstData.sub_array_tels = sub_array_tels
        self.set_tel_id_to_sub_array()

        return

    # ------------------------------------------------------------------
    def set_tel_id_to_sub_array(self):
        tel_id_to_sub_array = dict()
        sub_array_tels = InstData.sub_array_tels

        for (sa_id, tel_ids) in sub_array_tels.items():
            for tel_id in tel_ids:
                if tel_id not in tel_id_to_sub_array:
                    tel_id_to_sub_array[tel_id] = []
                tel_id_to_sub_array[tel_id] += [sa_id]

        for tel_id in tel_id_to_sub_array.keys():
            tel_id_to_sub_array[tel_id].sort()

        InstData.tel_id_to_sub_array = tel_id_to_sub_array

        return

    # ------------------------------------------------------------------
    def init_tel_ids(self):
        try:
            # ------------------------------------------------------------------
            # south
            # ------------------------------------------------------------------
            if self.is_south_site():
                tel_ids = [
                    'Lx01', 'Lx02', 'Lx03', 'Lx04', 'Mx01', 'Mx02', 'Mx03', 'Mx04',
                    'Mx05', 'Mx06', 'Mx07', 'Mx08', 'Mx09', 'Mx10', 'Mx11', 'Mx12',
                    'Mx13', 'Mx14', 'Mx15', 'Mx16', 'Mx17', 'Mx18', 'Mx19', 'Mx20',
                    'Mx21', 'Mx22', 'Mx23', 'Mx24', 'Mx25', 'Sx01', 'Sx02', 'Sx03',
                    'Sx04', 'Sx05', 'Sx06', 'Sx07', 'Sx08', 'Sx09', 'Sx10', 'Sx11',
                    'Sx12', 'Sx13', 'Sx14', 'Sx15', 'Sx16', 'Sx17', 'Sx18', 'Sx19',
                    'Sx20', 'Sx21', 'Sx22', 'Sx23', 'Sx24', 'Sx25', 'Sx26', 'Sx27',
                    'Sx28', 'Sx29', 'Sx30', 'Sx31', 'Sx32', 'Sx33', 'Sx34', 'Sx35',
                    'Sx36', 'Sx37', 'Sx38', 'Sx39', 'Sx40', 'Sx41', 'Sx42', 'Sx43',
                    'Sx44', 'Sx45', 'Sx46', 'Sx47', 'Sx48', 'Sx49', 'Sx50', 'Sx51',
                    'Sx52', 'Sx53', 'Sx54', 'Sx55', 'Sx56', 'Sx57', 'Sx58', 'Sx59',
                    'Sx60', 'Sx61', 'Sx62', 'Sx63', 'Sx64', 'Sx65', 'Sx66', 'Sx67',
                    'Sx68', 'Sx69', 'Sx70'
                ]

            # ------------------------------------------------------------------
            # north
            # ------------------------------------------------------------------
            elif not self.is_south_site():
                tel_ids = [
                    'Lx01', 'Lx02', 'Lx03', 'Lx04', 'Mx01', 'Mx02', 'Mx03', 'Mx04',
                    'Mx05', 'Mx06', 'Mx07', 'Mx08', 'Mx09', 'Mx10', 'Mx11', 'Mx12',
                    'Mx13', 'Mx14', 'Mx15'
                ]
            else:
                raise Exception()
        except Exception:
            self.log.critical([
                ['wr', ' - cant do init_tel_ids()...'],
                ['wr', ' --> Will terminate!'],
            ])
            raise Exception()

        return tel_ids

    # ------------------------------------------------------------------
    def init_aux_ids(self):
        try:
            # south
            if self.is_south_site():
                aux_ids = ['Ax00', 'Ax01', 'Ax02', 'Ax03']
            # north
            elif not self.is_south_site():
                aux_ids = ['Ax00', 'Ax01']
            else:
                raise Exception()
        except Exception:
            self.log.critical([
                ['wr', ' - cant do init_aux_ids()...'],
                ['wr', ' --> Will terminate!'],
            ])
            raise Exception()

        return aux_ids

    # ------------------------------------------------------------------
    def init_proc_ids(self):
        try:
            proc_ids = ['Px00', 'Px01', 'Px02']
        except Exception:
            self.log.critical([
                ['wr', ' - cant do init_proc_ids()...'],
                ['wr', ' --> Will terminate!'],
            ])
            raise Exception()

        return proc_ids

    # ------------------------------------------------------------------
    def add_inst_info_id(self, ids):
        def add_dict_id(id_now, entry):
            try:
                InstData.inst_info[id_now] = entry
                if id_now not in ids:
                    raise
            except Exception:
                self.log.critical([
                    ['wr', ' - cant do add_inst_info_id()...'],
                    ['wr', ' --> Will terminate!'],
                ])
                raise Exception()
            return

        return add_dict_id

    # ------------------------------------------------------------------
    def init_inst_pos(self):
        if InstData.inst_info is None:
            InstData.inst_info = dict()

        add_dict_id = self.add_inst_info_id(InstData.tel_ids)

        # ------------------------------------------------------------------
        # south
        # ------------------------------------------------------------------
        if self.is_south_site():
            id_now = 'Lx01'
            add_dict_id(id_now, {'x': -20.000, 'y': 65.000, 'type': 'LST'})
            id_now = 'Lx02'
            add_dict_id(id_now, {'x': -20.000, 'y': -65.000, 'type': 'LST'})
            id_now = 'Lx03'
            add_dict_id(id_now, {'x': 80.000, 'y': 0.000, 'type': 'LST'})
            id_now = 'Lx04'
            add_dict_id(id_now, {'x': -120.000, 'y': 0.000, 'type': 'LST'})
            id_now = 'Mx01'
            add_dict_id(id_now, {'x': 0.000, 'y': 0.000, 'type': 'MST'})
            id_now = 'Mx02'
            add_dict_id(id_now, {'x': 0.000, 'y': 151.200, 'type': 'MST'})
            id_now = 'Mx03'
            add_dict_id(id_now, {'x': 0.000, 'y': -151.200, 'type': 'MST'})
            id_now = 'Mx04'
            add_dict_id(id_now, {'x': 146.656, 'y': 75.600, 'type': 'MST'})
            id_now = 'Mx05'
            add_dict_id(id_now, {'x': 146.656, 'y': -75.600, 'type': 'MST'})
            id_now = 'Mx06'
            add_dict_id(id_now, {'x': -146.656, 'y': 85.600, 'type': 'MST'})
            id_now = 'Mx07'
            add_dict_id(id_now, {'x': -146.656, 'y': -85.600, 'type': 'MST'})
            id_now = 'Mx08'
            add_dict_id(id_now, {'x': 154.205, 'y': 238.474, 'type': 'MST'})
            id_now = 'Mx09'
            add_dict_id(id_now, {'x': 154.205, 'y': -238.474, 'type': 'MST'})
            id_now = 'Mx10'
            add_dict_id(id_now, {'x': 308.410, 'y': 0.000, 'type': 'MST'})
            id_now = 'Mx11'
            add_dict_id(id_now, {'x': -154.205, 'y': 238.474, 'type': 'MST'})
            id_now = 'Mx12'
            add_dict_id(id_now, {'x': -154.205, 'y': -238.474, 'type': 'MST'})
            id_now = 'Mx13'
            add_dict_id(id_now, {'x': -308.410, 'y': 0.000, 'type': 'MST'})
            id_now = 'Mx14'
            add_dict_id(id_now, {'x': 0.000, 'y': 325.242, 'type': 'MST'})
            id_now = 'Mx15'
            add_dict_id(id_now, {'x': 0.000, 'y': -325.242, 'type': 'MST'})
            id_now = 'Mx16'
            add_dict_id(id_now, {'x': 315.468, 'y': 162.621, 'type': 'MST'})
            id_now = 'Mx17'
            add_dict_id(id_now, {'x': 315.468, 'y': -162.621, 'type': 'MST'})
            id_now = 'Mx18'
            add_dict_id(id_now, {'x': -315.468, 'y': 162.621, 'type': 'MST'})
            id_now = 'Mx19'
            add_dict_id(id_now, {'x': -315.468, 'y': -162.621, 'type': 'MST'})
            id_now = 'Mx20'
            add_dict_id(id_now, {'x': 291.085, 'y': 450.155, 'type': 'MST'})
            id_now = 'Mx21'
            add_dict_id(id_now, {'x': 291.085, 'y': -450.155, 'type': 'MST'})
            id_now = 'Mx22'
            add_dict_id(id_now, {'x': 582.170, 'y': 0.000, 'type': 'MST'})
            id_now = 'Mx23'
            add_dict_id(id_now, {'x': -291.085, 'y': 450.155, 'type': 'MST'})
            id_now = 'Mx24'
            add_dict_id(id_now, {'x': -291.085, 'y': -450.155, 'type': 'MST'})
            id_now = 'Mx25'
            add_dict_id(id_now, {'x': -582.170, 'y': 0.000, 'type': 'MST'})
            id_now = 'Sx01'
            add_dict_id(id_now, {'x': 205.500, 'y': 158.900, 'type': 'SST'})
            id_now = 'Sx02'
            add_dict_id(id_now, {'x': 205.500, 'y': -158.900, 'type': 'SST'})
            id_now = 'Sx03'
            add_dict_id(id_now, {'x': -205.500, 'y': 158.900, 'type': 'SST'})
            id_now = 'Sx04'
            add_dict_id(id_now, {'x': -205.500, 'y': -158.900, 'type': 'SST'})
            id_now = 'Sx05'
            add_dict_id(id_now, {'x': 164.823, 'y': 424.824, 'type': 'SST'})
            id_now = 'Sx06'
            add_dict_id(id_now, {'x': 164.823, 'y': -424.824, 'type': 'SST'})
            id_now = 'Sx07'
            add_dict_id(id_now, {'x': -164.823, 'y': 424.824, 'type': 'SST'})
            id_now = 'Sx08'
            add_dict_id(id_now, {'x': -164.823, 'y': -424.824, 'type': 'SST'})
            id_now = 'Sx09'
            add_dict_id(id_now, {'x': 494.469, 'y': 110.000, 'type': 'SST'})
            id_now = 'Sx10'
            add_dict_id(id_now, {'x': 494.469, 'y': -110.000, 'type': 'SST'})
            id_now = 'Sx11'
            add_dict_id(id_now, {'x': -494.469, 'y': 110.000, 'type': 'SST'})
            id_now = 'Sx12'
            add_dict_id(id_now, {'x': -494.469, 'y': -110.000, 'type': 'SST'})
            id_now = 'Sx13'
            add_dict_id(id_now, {'x': 0.000, 'y': 519.795, 'type': 'SST'})
            id_now = 'Sx14'
            add_dict_id(id_now, {'x': 0.000, 'y': -519.795, 'type': 'SST'})
            id_now = 'Sx15'
            add_dict_id(id_now, {'x': 391.606, 'y': 403.739, 'type': 'SST'})
            id_now = 'Sx16'
            add_dict_id(id_now, {'x': 391.606, 'y': -403.739, 'type': 'SST'})
            id_now = 'Sx17'
            add_dict_id(id_now, {'x': -391.606, 'y': 403.739, 'type': 'SST'})
            id_now = 'Sx18'
            add_dict_id(id_now, {'x': -391.606, 'y': -403.739, 'type': 'SST'})
            id_now = 'Sx19'
            add_dict_id(id_now, {'x': 618.073, 'y': 318.611, 'type': 'SST'})
            id_now = 'Sx20'
            add_dict_id(id_now, {'x': 618.073, 'y': -318.611, 'type': 'SST'})
            id_now = 'Sx21'
            add_dict_id(id_now, {'x': -618.073, 'y': 318.611, 'type': 'SST'})
            id_now = 'Sx22'
            add_dict_id(id_now, {'x': -618.073, 'y': -318.611, 'type': 'SST'})
            id_now = 'Sx23'
            add_dict_id(id_now, {'x': 0.000, 'y': 723.527, 'type': 'SST'})
            id_now = 'Sx24'
            add_dict_id(id_now, {'x': 0.000, 'y': -723.527, 'type': 'SST'})
            id_now = 'Sx25'
            add_dict_id(id_now, {'x': 820.000, 'y': 0.000, 'type': 'SST'})
            id_now = 'Sx26'
            add_dict_id(id_now, {'x': -820.000, 'y': 0.000, 'type': 'SST'})
            id_now = 'Sx27'
            add_dict_id(id_now, {'x': 435.304, 'y': 673.186, 'type': 'SST'})
            id_now = 'Sx28'
            add_dict_id(id_now, {'x': 435.304, 'y': -673.186, 'type': 'SST'})
            id_now = 'Sx29'
            add_dict_id(id_now, {'x': -435.304, 'y': 673.186, 'type': 'SST'})
            id_now = 'Sx30'
            add_dict_id(id_now, {'x': -435.304, 'y': -673.186, 'type': 'SST'})
            id_now = 'Sx31'
            add_dict_id(id_now, {'x': 220.844, 'y': 796.903, 'type': 'SST'})
            id_now = 'Sx32'
            add_dict_id(id_now, {'x': 220.844, 'y': -796.903, 'type': 'SST'})
            id_now = 'Sx33'
            add_dict_id(id_now, {'x': 662.533, 'y': 569.216, 'type': 'SST'})
            id_now = 'Sx34'
            add_dict_id(id_now, {'x': 662.533, 'y': -569.216, 'type': 'SST'})
            id_now = 'Sx35'
            add_dict_id(id_now, {'x': 883.377, 'y': 227.687, 'type': 'SST'})
            id_now = 'Sx36'
            add_dict_id(id_now, {'x': 883.377, 'y': -227.687, 'type': 'SST'})
            id_now = 'Sx37'
            add_dict_id(id_now, {'x': -220.844, 'y': 796.903, 'type': 'SST'})
            id_now = 'Sx38'
            add_dict_id(id_now, {'x': -220.844, 'y': -796.903, 'type': 'SST'})
            id_now = 'Sx39'
            add_dict_id(id_now, {'x': -662.533, 'y': 569.216, 'type': 'SST'})
            id_now = 'Sx40'
            add_dict_id(id_now, {'x': -662.533, 'y': -569.216, 'type': 'SST'})
            id_now = 'Sx41'
            add_dict_id(id_now, {'x': -883.377, 'y': 227.687, 'type': 'SST'})
            id_now = 'Sx42'
            add_dict_id(id_now, {'x': -883.377, 'y': -227.687, 'type': 'SST'})
            id_now = 'Sx43'
            add_dict_id(id_now, {'x': 0.000, 'y': 944.301, 'type': 'SST'})
            id_now = 'Sx44'
            add_dict_id(id_now, {'x': 0.000, 'y': -944.301, 'type': 'SST'})
            id_now = 'Sx45'
            add_dict_id(id_now, {'x': 915.923, 'y': 472.151, 'type': 'SST'})
            id_now = 'Sx46'
            add_dict_id(id_now, {'x': 915.923, 'y': -472.151, 'type': 'SST'})
            id_now = 'Sx47'
            add_dict_id(id_now, {'x': -915.923, 'y': 472.151, 'type': 'SST'})
            id_now = 'Sx48'
            add_dict_id(id_now, {'x': -915.923, 'y': -472.151, 'type': 'SST'})
            id_now = 'Sx49'
            add_dict_id(id_now, {'x': 1100.000, 'y': 0.000, 'type': 'SST'})
            id_now = 'Sx50'
            add_dict_id(id_now, {'x': -1100.000, 'y': 0.000, 'type': 'SST'})
            id_now = 'Sx51'
            add_dict_id(id_now, {'x': 471.012, 'y': 971.210, 'type': 'SST'})
            id_now = 'Sx52'
            add_dict_id(id_now, {'x': 471.012, 'y': -971.210, 'type': 'SST'})
            id_now = 'Sx53'
            add_dict_id(id_now, {'x': 706.518, 'y': 849.809, 'type': 'SST'})
            id_now = 'Sx54'
            add_dict_id(id_now, {'x': 706.518, 'y': -849.809, 'type': 'SST'})
            id_now = 'Sx55'
            add_dict_id(id_now, {'x': -471.012, 'y': 971.210, 'type': 'SST'})
            id_now = 'Sx56'
            add_dict_id(id_now, {'x': -471.012, 'y': -971.210, 'type': 'SST'})
            id_now = 'Sx57'
            add_dict_id(id_now, {'x': -706.518, 'y': 849.809, 'type': 'SST'})
            id_now = 'Sx58'
            add_dict_id(id_now, {'x': -706.518, 'y': -849.809, 'type': 'SST'})
            id_now = 'Sx59'
            add_dict_id(id_now, {'x': 239.197, 'y': 1109.735, 'type': 'SST'})
            id_now = 'Sx60'
            add_dict_id(id_now, {'x': 239.197, 'y': -1109.735, 'type': 'SST'})
            id_now = 'Sx61'
            add_dict_id(id_now, {'x': 956.787, 'y': 739.823, 'type': 'SST'})
            id_now = 'Sx62'
            add_dict_id(id_now, {'x': 956.787, 'y': -739.823, 'type': 'SST'})
            id_now = 'Sx63'
            add_dict_id(id_now, {'x': -239.197, 'y': 1109.735, 'type': 'SST'})
            id_now = 'Sx64'
            add_dict_id(id_now, {'x': -239.197, 'y': -1109.735, 'type': 'SST'})
            id_now = 'Sx65'
            add_dict_id(id_now, {'x': -956.787, 'y': 739.823, 'type': 'SST'})
            id_now = 'Sx66'
            add_dict_id(id_now, {'x': -956.787, 'y': -739.823, 'type': 'SST'})
            id_now = 'Sx67'
            add_dict_id(id_now, {'x': 1195.984, 'y': 369.912, 'type': 'SST'})
            id_now = 'Sx68'
            add_dict_id(id_now, {'x': 1195.984, 'y': -369.912, 'type': 'SST'})
            id_now = 'Sx69'
            add_dict_id(id_now, {'x': -1195.984, 'y': 369.912, 'type': 'SST'})
            id_now = 'Sx70'
            add_dict_id(id_now, {'x': -1195.984, 'y': -369.912, 'type': 'SST'})

        # ------------------------------------------------------------------
        # north
        # ------------------------------------------------------------------
        if not self.is_south_site():
            id_now = 'Lx01'
            add_dict_id(id_now, {'x': 376.159, 'y': 343.521, 'type': 'LST'})
            id_now = 'Lx02'
            add_dict_id(id_now, {'x': 288.810, 'y': 328.030, 'type': 'LST'})
            id_now = 'Lx03'
            add_dict_id(id_now, {'x': 320.642, 'y': 261.530, 'type': 'LST'})
            id_now = 'Lx04'
            add_dict_id(id_now, {'x': 386.446, 'y': 285.861, 'type': 'LST'})
            id_now = 'Mx01'
            add_dict_id(id_now, {'x': 344.926, 'y': 404.945, 'type': 'MST'})
            id_now = 'Mx02'
            add_dict_id(id_now, {'x': 256.740, 'y': 370.062, 'type': 'MST'})
            id_now = 'Mx03'
            add_dict_id(id_now, {'x': 230.490, 'y': 257.401, 'type': 'MST'})
            id_now = 'Mx04'
            add_dict_id(id_now, {'x': 317.343, 'y': 208.857, 'type': 'MST'})
            id_now = 'Mx05'
            add_dict_id(id_now, {'x': 451.269, 'y': 212.410, 'type': 'MST'})
            id_now = 'Mx06'
            add_dict_id(id_now, {'x': 443.099, 'y': 327.589, 'type': 'MST'})
            id_now = 'Mx07'
            add_dict_id(id_now, {'x': 424.508, 'y': 396.707, 'type': 'MST'})
            id_now = 'Mx08'
            add_dict_id(id_now, {'x': 190.637, 'y': 328.672, 'type': 'MST'})
            id_now = 'Mx09'
            add_dict_id(id_now, {'x': 524.691, 'y': 182.636, 'type': 'MST'})
            id_now = 'Mx10'
            add_dict_id(id_now, {'x': 524.877, 'y': 264.413, 'type': 'MST'})
            id_now = 'Mx11'
            add_dict_id(id_now, {'x': 505.525, 'y': 399.122, 'type': 'MST'})
            id_now = 'Mx12'
            add_dict_id(id_now, {'x': 182.629, 'y': 425.677, 'type': 'MST'})
            id_now = 'Mx13'
            add_dict_id(id_now, {'x': 283.345, 'y': 449.753, 'type': 'MST'})
            id_now = 'Mx14'
            add_dict_id(id_now, {'x': 383.626, 'y': 467.621, 'type': 'MST'})
            id_now = 'Mx15'
            add_dict_id(id_now, {'x': 338.955, 'y': 305.371, 'type': 'MST'})

        return

    # ------------------------------------------------------------------
    def scale_inst_pos(self):
        if self.is_south_site():
            pos_scale = 0.18
        else:
            pos_scale = 1

        for id_now, ele_now in InstData.inst_info.items():
            for xy_now in ['x', 'y']:
                ele_now[xy_now] *= pos_scale

        if self.is_south_site():
            # transform the coordinate system, where originally:
            #     MC x position [->North] in meters.
            #     MC y position [->West] in meters.
            for id_now, ele_now in InstData.inst_info.items():
                x = -1 * ele_now['y']
                y = -1 * ele_now['x']

                ele_now.update({'x': x, 'y': y})

            # additional scaling for inner telescopes
            ids_scale = [
                {
                    'scale': 1.3,
                    'ids': ['Lx01', 'Lx02', 'Lx03', 'Lx04'],
                },
                {
                    'scale':
                    1.1,
                    'ids': [
                        'Mx02', 'Mx03', 'Mx04', 'Mx05', 'Mx06', 'Mx07', 'Sx02', 'Sx01',
                        'Sx03', 'Sx04'
                    ],
                },
            ]
            for id_scale in ids_scale:
                for id_now in id_scale['ids']:
                    ele_now = InstData.inst_info[id_now]
                    x = id_scale['scale'] * ele_now['x']
                    y = id_scale['scale'] * ele_now['y']

                    ele_now.update({'x': x, 'y': y})

        return

    # ------------------------------------------------------------------
    def init_aux_pos(self):
        if InstData.inst_info is None:
            InstData.inst_info = dict()

        add_dict_id = self.add_inst_info_id(InstData.aux_ids)

        # ------------------------------------------------------------------
        # south
        # ------------------------------------------------------------------
        if self.is_south_site():
            id_now = 'Ax00'
            add_dict_id(id_now, {'x': 550, 'y': -750, 'type': 'AUX'})
            id_now = 'Ax01'
            add_dict_id(id_now, {'x': 670, 'y': 150, 'type': 'AUX'})
            id_now = 'Ax02'
            add_dict_id(id_now, {'x': -710, 'y': 175, 'type': 'AUX'})
            id_now = 'Ax03'
            add_dict_id(id_now, {'x': 1100, 'y': 200, 'type': 'AUX'})

        # ------------------------------------------------------------------
        # north
        # ------------------------------------------------------------------
        if not self.is_south_site():
            id_now = 'Ax00'
            add_dict_id(id_now, {'x': 403.866, 'y': 151.528, 'type': 'AUX'})
            id_now = 'Ax01'
            add_dict_id(id_now, {'x': 455.675, 'y': 466.823, 'type': 'AUX'})

        return

    # ------------------------------------------------------------------
    def init_proc_pos(self):
        if InstData.inst_info is None:
            InstData.inst_info = dict()

        add_dict_id = self.add_inst_info_id(InstData.proc_ids)

        # ------------------------------------------------------------------
        id_now = 'Px00'
        add_dict_id(id_now, {'x': 5, 'y': 0, 'type': 'PROC'})
        id_now = 'Px01'
        add_dict_id(id_now, {'x': 0, 'y': 5, 'type': 'PROC'})
        id_now = 'Px02'
        add_dict_id(id_now, {'x': 0, 'y': -5, 'type': 'PROC'})

        # ------------------------------------------------------------------
        InstData.categorical_types = ['PROC']

        return

    # ------------------------------------------------------------------
    def init_tel_health(self):
        rnd_gen = Random(11239487)

        inst_health = dict()
        tel_ids = InstData.tel_ids
        aux_ids = InstData.aux_ids
        proc_ids = InstData.proc_ids

        # ------------------------------------------------------------------
        for id_now in tel_ids:
            inst_health[id_now] = dict()

            inst_health[id_now]['camera'] = {
                'id':
                'camera',
                'title':
                'Camera',
                'val':
                20,
                'children': [
                    {
                        'id': 'camera_0',
                        'title': 'Camera_0',
                        'val': 100
                    },
                    {
                        'id':
                        'camera_1',
                        'title':
                        'Camera_1',
                        'val':
                        10,
                        'children': [
                            {
                                'id': 'camera_1_0',
                                'title': 'Camera_1_0',
                                'val': 3
                            },
                            {
                                'id': 'camera_1_1',
                                'title': 'Camera_1_1',
                                'val': 78
                            },
                        ]
                    },
                    {
                        'id': 'camera_6',
                        'title': 'Camera_6',
                        'val': 80
                    },
                    {
                        'id': 'camera_8',
                        'title': 'Camera_8',
                        'val': 80
                    },
                ]
            }

            inst_health[id_now]['mount'] = {
                'id':
                'mount',
                'title':
                'Mount',
                'val':
                100,
                'children': [
                    {
                        'id': 'mount_0',
                        'title': 'Mount_0',
                        'val': 10
                    },
                    {
                        'id':
                        'mount_1',
                        'title':
                        'Mount_1',
                        'val':
                        78,
                        'children': [
                            {
                                'id': 'mount_1_0',
                                'title': 'Mount_1_0',
                                'val': 10
                            },
                            {
                                'id': 'mount_1_1',
                                'title': 'Mount_1_1',
                                'val': 90,
                                # 'children': [
                                #     {
                                #         'id': 'mount_1_1_0',
                                #         'title': 'Mount_1_1_0',
                                #         'val': 95
                                #     },
                                #     {
                                #         'id': 'mount_1_1_1',
                                #         'title': 'Mount_1_1_1',
                                #         'val': 95
                                #     },
                                #     {
                                #         'id': 'mount_1_1_2',
                                #         'title': 'Mount_1_1_2',
                                #         'val': 95
                                #     },
                                #     {
                                #         'id': 'mount_1_1_3',
                                #         'title': 'Mount_1_1_3',
                                #         'val': 95
                                #     },
                                # ]
                            },
                            {
                                'id': 'mount_1_2',
                                'title': 'Mount_1_2',
                                'val': 60
                            },
                            {
                                'id': 'mount_1_3',
                                'title': 'Mount_1_3',
                                'val': 90,
                                # 'children': [
                                #     {
                                #         'id': 'mount_1_3_0',
                                #         'title': 'Mount_1_3_0',
                                #         'val': 95
                                #     },
                                #     {
                                #         'id': 'mount_1_3_1',
                                #         'title': 'Mount_1_3_1',
                                #         'val': 95
                                #     },
                                #     {
                                #         'id': 'mount_1_3_2',
                                #         'title': 'Mount_1_3_2',
                                #         'val': 95
                                #     },
                                #     {
                                #         'id': 'mount_1_3_3',
                                #         'title': 'Mount_1_3_3',
                                #         'val': 95
                                #     },
                                # ]
                            },
                            {
                                'id': 'mount_1_4',
                                'title': 'Mount_1_4',
                                'val': 85
                            },
                        ]
                    },
                    {
                        'id': 'mount_2',
                        'title': 'Mount_2',
                        'val': 40
                    },
                ]
            }

            if InstData.inst_info[id_now]['type'] == 'LST':
                inst_health[id_now]['mirror'] = {
                    'id':
                    'mirror',
                    'title':
                    'Mirror',
                    'val':
                    10,
                    'children': [
                        {
                            'id': 'mirror_0',
                            'title': 'Mirror_0',
                            'val': 3
                        },
                        {
                            'id':
                            'mirror_1',
                            'title':
                            'Mirror_1',
                            'val':
                            78,
                            'children': [
                                {
                                    'id': 'mirror_1_1',
                                    'title': 'Mirror_0',
                                    'val': 3
                                },
                                {
                                    'id': 'mirror_1_0',
                                    'title': 'Mirror_1_0',
                                    'val': 28,
                                    # 'children': [
                                    #     {
                                    #         'id': 'mirror_1_0_0',
                                    #         'title': 'Mirror_1_0_0',
                                    #         'val': 90
                                    #     },
                                    #     {
                                    #         'id': 'mirror_1_0_1',
                                    #         'title': 'Mirror_1_0_1',
                                    #         'val': 90
                                    #     },
                                    # ]
                                },
                            ]
                        },
                    ]
                }

            # else:
            #     inst_health[id_now]['mirror'] = {
            #         'id': 'mirror', 'title': 'Mirror', 'val': 10,
            #         'children': [
            #             {'id': 'mirror_0', 'title': 'Mirror_0', 'val': 3},
            #             {'id': 'mirror_1', 'title': 'Mirror_1', 'val': 78},
            #         ]
            #     }

            inst_health[id_now]['daq'] = {
                'id':
                'daq',
                'title':
                'DAQ',
                'val':
                87,
                'children': [
                    {
                        'id': 'daq_3',
                        'title': 'DAQ_3',
                        'val': 50
                    },
                    {
                        'id':
                        'daq_7',
                        'title':
                        'DAQ_7',
                        'val':
                        50,
                        'children': [
                            {
                                'id': 'daq_7_0',
                                'title': 'DAQ_7_0',
                                'val': 10
                            },
                            {
                                'id': 'daq_7_1',
                                'title': 'DAQ_7_1',
                                'val': 20
                            },
                            {
                                'id': 'daq_7_2',
                                'title': 'DAQ_7_2',
                                'val': 85
                            },
                            {
                                'id': 'daq_7_3',
                                'title': 'DAQ_7_3',
                                'val': 85
                            },
                            {
                                'id': 'daq_7_4',
                                'title': 'DAQ_7_4',
                                'val': 85
                            },
                            {
                                'id': 'daq_7_5',
                                'title': 'DAQ_7_5',
                                'val': 85
                            },
                            {
                                'id': 'daq_7_6',
                                'title': 'DAQ_7_6',
                                'val': 85
                            },
                        ]
                    },
                    {
                        'id':
                        'daq_8',
                        'title':
                        'DAQ_8',
                        'val':
                        50,
                        'children': [
                            {
                                'id': 'daq_8_0',
                                'title': 'DAQ_8_0',
                                'val': 10
                            },
                            {
                                'id': 'daq_8_1',
                                'title': 'DAQ_8_1',
                                'val': 90
                            },
                            {
                                'id': 'daq_8_2',
                                'title': 'DAQ_8_2',
                                'val': 85
                            },
                            {
                                'id': 'daq_8_30000',
                                'title': 'DAQ_8_30000',
                                'val': 85
                            },
                        ]
                    },
                ]
            }

            if InstData.inst_info[id_now]['type'] == 'LST':
                inst_health[id_now]['aux'] = {
                    'id':
                    'aux',
                    'title':
                    'Aux',
                    'val':
                    70,
                    'children': [
                        {
                            'id': 'aux_0',
                            'title': 'Aux_0',
                            'val': 90
                        },
                        {
                            'id':
                            'aux_1',
                            'title':
                            'Aux_1',
                            'val':
                            78,
                            'children': [
                                {
                                    'id': 'aux_1_0',
                                    'title': 'Aux_1_0',
                                    'val': 10
                                },
                                {
                                    'id': 'aux_1_4',
                                    'title': 'Aux_1_4',
                                    'val': 85
                                },
                            ]
                        },
                        {
                            'id':
                            'aux_3',
                            'title':
                            'Aux_3',
                            'val':
                            78,
                            'children': [
                                {
                                    'id': 'aux_3_0',
                                    'title': 'Aux_3_0',
                                    'val': 90
                                },
                                {
                                    'id': 'aux_3_1',
                                    'title': 'Aux_3_1',
                                    'val': 15
                                },
                                {
                                    'id': 'aux_3_2',
                                    'title': 'Aux_3_2',
                                    'val': 5
                                },
                            ]
                        },
                    ]
                }

        # ------------------------------------------------------------------
        for id_now in aux_ids:
            inst_health[id_now] = dict()

            inst_health[id_now]['inst_0'] = {
                'id':
                'inst_0',
                'title':
                'Inst_0',
                'val':
                20,
                'children': [
                    {
                        'id': 'inst_00',
                        'title': 'Inst_00',
                        'val': 100
                    },
                    {
                        'id':
                        'inst_01',
                        'title':
                        'Inst_01',
                        'val':
                        10,
                        'children': [
                            {
                                'id': 'inst_01_0',
                                'title': 'Inst_01_0',
                                'val': 3
                            },
                            {
                                'id': 'inst_01_1',
                                'title': 'Inst_01_1',
                                'val': 78
                            },
                        ]
                    },
                    {
                        'id': 'inst_06',
                        'title': 'Inst_06',
                        'val': 80
                    },
                    {
                        'id': 'inst_08',
                        'title': 'Inst_08',
                        'val': 80
                    },
                ]
            }
            inst_health[id_now]['inst_1'] = {
                'id':
                'inst_1',
                'title':
                'Inst_1',
                'val':
                20,
                'children': [
                    {
                        'id': 'inst_10',
                        'title': 'Inst_10',
                        'val': 100
                    },
                    {
                        'id':
                        'inst_11',
                        'title':
                        'Inst_11',
                        'val':
                        10,
                        'children': [
                            {
                                'id': 'inst_11_0',
                                'title': 'Inst_11_0',
                                'val': 3
                            },
                            {
                                'id': 'inst_11_1',
                                'title': 'Inst_11_1',
                                'val': 78
                            },
                            {
                                'id': 'inst_11_2',
                                'title': 'Inst_11_2',
                                'val': 78
                            },
                        ]
                    },
                    {
                        'id': 'inst_18',
                        'title': 'Inst_18',
                        'val': 80
                    },
                ]
            }

        # ------------------------------------------------------------------
        for id_now in proc_ids:
            inst_health[id_now] = dict()

            inst_health[id_now]['prc_0'] = {
                'id':
                'prc_0',
                'title':
                'Prc_0',
                'val':
                20,
                'children': [
                    {
                        'id': 'prc_00',
                        'title': 'Prc_00',
                        'val': 100
                    },
                    {
                        'id':
                        'prc_01',
                        'title':
                        'Prc_01',
                        'val':
                        10,
                        'children': [
                            {
                                'id': 'prc_01_0',
                                'title': 'Prc_01_0',
                                'val': 3
                            },
                            {
                                'id': 'prc_01_1',
                                'title': 'Prc_01_1',
                                'val': 78
                            },
                            {
                                'id': 'prc_01_2',
                                'title': 'Prc_01_1',
                                'val': 78
                            },
                        ]
                    },
                    {
                        'id':
                        'prc_02',
                        'title':
                        'Prc_02',
                        'val':
                        10,
                        'children': [
                            {
                                'id': 'prc_02_0',
                                'title': 'Prc_02_0',
                                'val': 3
                            },
                            {
                                'id': 'prc_02_1',
                                'title': 'Prc_02_1',
                                'val': 78
                            },
                        ]
                    },
                    {
                        'id': 'prc_03',
                        'title': 'Prc_03',
                        'val': 80
                    },
                    {
                        'id': 'prc_04',
                        'title': 'Prc_04',
                        'val': 80
                    },
                    {
                        'id': 'prc_05',
                        'title': 'Prc_05',
                        'val': 80
                    },
                ]
            }
            inst_health[id_now]['prc_1'] = {
                'id':
                'prc_1',
                'title':
                'Prc_1',
                'val':
                20,
                'children': [
                    {
                        'id':
                        'prc_11',
                        'title':
                        'Prc_11',
                        'val':
                        10,
                        'children': [
                            {
                                'id': 'prc_11_1',
                                'title': 'Prc_11_1',
                                'val': 78
                            },
                            {
                                'id': 'prc_11_2',
                                'title': 'Prc_11_2',
                                'val': 78
                            },
                        ]
                    },
                    {
                        'id': 'prc_15',
                        'title': 'Prc_15',
                        'val': 80
                    },
                    {
                        'id':
                        'prc_16',
                        'title':
                        'Prc_16',
                        'val':
                        10,
                        'children': [
                            {
                                'id': 'prc_16_1',
                                'title': 'Prc_16_1',
                                'val': 78
                            },
                            {
                                'id': 'prc_16_2',
                                'title': 'Prc_16_2',
                                'val': 78
                            },
                            {
                                'id': 'prc_16_4',
                                'title': 'Prc_16_4',
                                'val': 78
                            },
                        ]
                    },
                ]
            }

        # ------------------------------------------------------------------
        InstData.inst_health = inst_health

        # ------------------------------------------------------------------
        # add entries for the 3rd level of the hierarchy, given range_full_props ~100,
        # we get ~200k properties overall for the South
        range_full_props = [80, 120]

        inst_health_deep = dict()
        for (inst_id, inst) in inst_health.items():
            inst_health_deep[inst_id] = dict()
            for (field_id, data) in inst.items():
                if 'children' in data:
                    for child_0 in data['children']:
                        if 'children' in child_0:
                            for child_1 in child_0['children']:
                                child_id = child_1['id']
                                child_title = child_1['title']
                                # child_val = child_1['val']

                                inst_health_deep[inst_id][child_id] = []
                                for n_prop in range(rnd_gen.randint(*range_full_props)):
                                    if rnd_gen.random() < 0.2:
                                        val = rnd_gen.randint(11, 40)
                                    else:
                                        val = rnd_gen.randint(60, 99)
                                    inst_health_deep[inst_id][child_id] += [{
                                        'id': (child_id + '_' + str(n_prop)),
                                        'title': (child_title + '_' + str(n_prop)),
                                        'val':
                                        val
                                    }]

        InstData.inst_health_deep = inst_health_deep

        return

    # ------------------------------------------------------------------
    def get_inst_info(self):
        while not InstData.has_init:
            sleep(0.01)

        return InstData.inst_info

    # ------------------------------------------------------------------
    def get_tel_type(self, tel_id):
        try:
            tel_type = InstData.inst_info[tel_id]['type']
        except Exception:
            self.log.critical([
                ['wr', ' - cant do get_tel_type(',
                 str(tel_id), ')...'],
                ['wr', ' --> Will terminate!'],
            ])
            raise Exception()

        return tel_type

    # ------------------------------------------------------------------
    def is_tel_type(self, tel_id, comp_type):
        is_type = (self.get_tel_type(tel_id) == comp_type)
        return is_type

    # ------------------------------------------------------------------
    def set_inst_id_to_types(self):
        InstData.tel_id_to_types = dict()
        for tel_id in InstData.inst_ids:
            InstData.tel_id_to_types[tel_id] = self.get_tel_type(tel_id)

        return

    # ------------------------------------------------------------------
    def get_allowed_sub_arrays(self, sa_id, include_self=False):
        while not InstData.has_init:
            sleep(0.01)

        sub_array_tels = InstData.sub_array_tels

        allowed_sub_arrays = []

        tel_ids = sub_array_tels[sa_id]
        n_tels = len(tel_ids)

        for (check_sa_id, check_tel_ids) in sub_array_tels.items():
            if sa_id == check_sa_id and not include_self:
                continue
            check_n_tels = len(check_tel_ids)
            common_ids = set(tel_ids + check_tel_ids)
            if len(common_ids) == n_tels + check_n_tels:
                allowed_sub_arrays += [check_sa_id]

        return allowed_sub_arrays

    # ------------------------------------------------------------------
    def get_inst_id_to_types(self, is_copy=True):
        while not InstData.has_init:
            sleep(0.01)

        out = InstData.tel_id_to_types
        if is_copy:
            out = copy.deepcopy(out)
        return out

    # ------------------------------------------------------------------
    def get_categorical_types(self, is_copy=True):
        while not InstData.has_init:
            sleep(0.01)

        out = InstData.categorical_types
        if is_copy:
            out = copy.deepcopy(out)
        return out

    # ------------------------------------------------------------------
    def get_inst_ids(self, inst_types=None, is_copy=True):
        n_tries, max_n_tries = 0, 1e3
        try:
            while not InstData.has_init:
                sleep(0.01)
                n_tries += 1
                if n_tries > max_n_tries:
                    raise
        except Exception:
            self.log.critical([
                ['wr', ' - cant do get_inst_ids(', inst_types, ')...'],
                ['wr', ' --> Will terminate!'],
            ])
            raise Exception()

        if inst_types is None:
            inst_ids = InstData.inst_ids
            if is_copy:
                inst_ids = copy.deepcopy(inst_ids)
        else:
            if isinstance(inst_types, str):
                inst_types = [inst_types]

            inst_ids = [
                i for i in InstData.inst_ids
                if any(self.is_tel_type(i, inst_type) for inst_type in inst_types)
            ]
        return inst_ids

    # ------------------------------------------------------------------
    def get_proc_ids(self, inst_types=None, is_copy=True):
        n_tries, max_n_tries = 0, 1e3
        try:
            while not InstData.has_init:
                sleep(0.01)
                n_tries += 1
                if n_tries > max_n_tries:
                    raise
        except Exception:
            self.log.critical([
                ['wr', ' - cant do get_proc_ids(', inst_types, ')...'],
                ['wr', ' --> Will terminate!'],
            ])
            raise Exception()

        out = InstData.proc_ids
        if is_copy:
            out = copy.deepcopy(out)
        return out

    # ------------------------------------------------------------------
    def is_south_site(self):
        return (InstData.site_type == 'S')

    # ------------------------------------------------------------------
    def get_inst_healths(self, is_copy=False):
        while not InstData.has_init:
            sleep(0.01)

        out = InstData.inst_health
        if is_copy:
            out = copy.deepcopy(out)
        return out

    # ------------------------------------------------------------------
    def get_inst_health_fulls(self, is_copy=False):
        while not InstData.has_init:
            sleep(0.01)

        out = InstData.inst_health_deep
        if is_copy:
            out = copy.deepcopy(out)
        return out

    # ------------------------------------------------------------------
    def get_sub_array_insts(self, is_copy=False):
        while not InstData.has_init:
            sleep(0.01)

        out = InstData.sub_array_tels
        if is_copy:
            out = copy.deepcopy(out)
        return out

    # ------------------------------------------------------------------
    def get_inst_id_to_sub_array(self, is_copy=False):
        while not InstData.has_init:
            sleep(0.01)

        out = InstData.tel_id_to_sub_array
        if is_copy:
            out = copy.deepcopy(out)
        return out

    # ------------------------------------------------------------------
    def get_inst_health_state(self, health):
        """mapping between numerical health values and a state
           used eg to determine the colour code for a given metric

            Parameters
            ----------
            name : health
                a health metric, with expected values within [0, 100]
                for connected instruments. negative values indicate
                disconnected instruments.
        
            Returns
            -------
            str
                the name of the state
        """

        # make sure we are ordered in the threshold value
        states = sorted(InstData._inst_states, key=lambda x: x['thresholds'][1])

        out = None
        for state in states:
            if health <= state['thresholds'][1]:
                out = state['name']
                break

        if out is None:
            if health > states[-1]['thresholds'][1]:
                out = states[-1]['name']
            else:
                out = states[0]['name']

            self.log.warning([
                ['y', ' - trying to get get_inst_health_state() beyond bounds for '],
                ['b', health],
                ['y', ' --> setting to '],
                ['c', out],
            ])

        return out
