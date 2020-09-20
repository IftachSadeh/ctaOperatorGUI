from math import floor
import random
from random import Random
import copy

from time import sleep
from threading import Lock

from shared.ServiceManager import ServiceManager
from shared.LogParser import LogParser
from shared.utils import get_rnd
from shared.utils import get_time
from shared.utils import get_rnd_seed
from shared.RedisManager import RedisManager

from SchedulerUtils import get_rnd_targets
from SchedulerUtils import get_rnd_pointings
from SchedulerUtils import update_sub_arrs
from SchedulerUtils import external_generate_events
from SchedulerUtils import external_generate_clock_events


# ------------------------------------------------------------------
class SchedulerStandalone(ServiceManager):
    """scheduler simulation class, simulating the execution of scheduling blocks

       Only a single active instance is allowed to exist
    """

    lock = Lock()

    # ------------------------------------------------------------------
    def __init__(self, base_config, service_name, interrupt_sig):
        self.class_name = self.__class__.__name__
        service_name = (service_name if service_name is not None else self.class_name)
        super().__init__(service_name=service_name)

        self.log = LogParser(base_config=base_config, title=__name__)
        self.log.info([['g', ' - starting SchedulerStandalone ...']])

        self.base_config = base_config
        self.site_type = self.base_config.site_type
        self.clock_sim = self.base_config.clock_sim
        self.inst_data = self.base_config.inst_data

        self.service_name = service_name
        self.interrupt_sig = interrupt_sig

        self.tel_ids = self.inst_data.get_inst_ids(inst_types=['LST', 'MST', 'SST'])
        self.sub_array_insts = self.inst_data.get_sub_array_insts()

        self.no_sub_arr_name = self.base_config.no_sub_arr_name

        self.redis = RedisManager(
            name=self.class_name, base_config=self.base_config, log=self.log
        )

        self.debug = not True
        self.expire_sec = 86400 * 2  # two days
        # self.expire_sec = 5

        # self.max_n_obs_block = 4 if self.site_type == 'N' else 7
        # self.max_n_obs_block = min(self.max_n_obs_block, floor(len(self.tel_ids) / 4))

        # sleep duration for thread loops
        self.loop_sleep_sec = 1
        # minimal real-time delay between randomisations (once every self.loop_act_rate sec)
        self.loop_act_rate = max(int(2 / self.loop_sleep_sec), 1)

        self.max_n_cycles = 100
        self.min_n_sched_block = 2  # 2
        self.max_n_sched_block = 5  # 5
        self.min_n_obs_block = 1
        self.max_n_obs_block = 5
        self.min_n_tel_block = 4
        self.max_n_free_tels = 5

        self.name_prefix = get_rnd(n_digits=5, out_type=str)

        self.az_min_max = [-180, 180]
        self.zen_min_max_tel = [0, 70]
        self.zen_min_max_pnt = [0, 20]

        self.phases_exe = {
            'start': [
                'run_config_mount', 'run_config_camera', 'run_config_DAQ',
                'run_config_mirror'
            ],
            'during': ['run_take_data'],
            'finish': ['run_finish_mount', 'run_finish_camera', 'run_finish_cleanup'],
        }

        self.error_rnd_frac = {
            'E1': 0.3,
            'E2': 0.4,
            'E3': 0.5,
            'E4': 0.6,
            'E5': 0.7,
            'E6': 0.8,
            'E7': 0.9,
            'E8': 1,
        }

        self.phase_rnd_frac = {
            'start': 0.29,
            'finish': 0.1,
            'cancel': 0.06,
            'fail': 0.1,
        }

        # 1800 = 30 minutes
        self.obs_block_sec = 1800

        self.n_init_cycle = -1
        self.n_nights = -1

        self.update_name = 'obs_block_update'
        self.sched_block_prefix = 'sched_block_'
        self.obs_block_prefix = 'obs_block_'

        rnd_seed = get_rnd_seed()
        self.rnd_gen = Random(rnd_seed)

        self.external_clock_events = []
        external_generate_clock_events(self)

        self.redis.delete(self.update_name)

        self.init()

        # make sure this is the only active instance
        self.init_active_instance()

        self.setup_threads()

        return

    # ------------------------------------------------------------------
    def setup_threads(self):

        self.add_thread(target=self.loop_main)

        return

    # ------------------------------------------------------------------
    def init(self):
        debug_tmp = False
        # debug_tmp = True

        self.exe_phase = dict()
        self.all_obs_blocks = []
        self.external_events = []

        self.n_nights = self.clock_sim.get_n_nights()
        night_start_sec = self.clock_sim.get_night_start_sec()
        night_end_sec = self.clock_sim.get_night_end_sec()
        night_duration_sec = self.clock_sim.get_night_duration_sec()

        self.n_init_cycle += 1

        is_cycle_done = False
        n_cycle_now = 0
        n_sched_block = -1
        overhead_sec = self.obs_block_sec * 0.05

        tot_sched_duration_sec = night_start_sec
        max_block_duration_sec = night_end_sec - self.obs_block_sec

        pipe = self.redis.get_pipe()

        while True:
            can_break = not ((tot_sched_duration_sec < max_block_duration_sec) and
                             (n_cycle_now < self.max_n_cycles) and (not is_cycle_done))
            if can_break:
                break

            base_cycle_name = (
                self.name_prefix + '_' + str(self.n_init_cycle) + '_' + str(n_cycle_now)
                + '_'
            )
            n_cycle_now += 1

            # derive a random combination of sub-arrays which do not
            # conflict with each other
            sub_array_ids = list(self.sub_array_insts.keys())
            n_sa_0 = self.rnd_gen.randint(0, len(sub_array_ids) - 1)
            sa_id_0 = sub_array_ids[n_sa_0]

            allowed_sa_ids = self.inst_data.get_allowed_sub_arrays(sa_id_0)

            sa_ids = [sa_id_0]
            while len(allowed_sa_ids) > 0:
                # select a random id from the allowed list of the initial sa
                check_n_sa = self.rnd_gen.randint(0, len(allowed_sa_ids) - 1)
                sa_id_add = allowed_sa_ids[check_n_sa]
                allowed_sa_ids.remove(sa_id_add)

                # check if this id is allowed by all included sas
                check_sa_ids = []
                for sa_id in sa_ids:
                    check_sa_ids_now = self.inst_data.get_allowed_sub_arrays(sa_id)
                    check_sa_ids += [int(sa_id_add in check_sa_ids_now)]

                # add the new sa if it is allowed by all
                if sum(check_sa_ids) == len(check_sa_ids):
                    sa_ids += [sa_id_add]

            if debug_tmp:
                precent = (tot_sched_duration_sec - night_start_sec) / night_duration_sec
                print()
                print('-' * 100)
                print(
                    ' -    n_nights/n_cycle_now',
                    [self.n_nights, n_cycle_now],
                    'tot_sched_duration_sec / percentage:',
                    [tot_sched_duration_sec, int(100 * precent)],
                )

            sched_block_duration_sec = []

            # for n_sched_block_now in range(n_cycle_sched_blocks):
            for n_sched_block_now in range(len(sa_ids)):
                sched_block_id = (
                    self.sched_block_prefix + base_cycle_name + str(n_sched_block_now)
                )

                n_sched_block += 1

                sa_id = sa_ids[n_sched_block_now]
                tel_ids = self.sub_array_insts[sa_id]
                n_tel_now = len(tel_ids)

                if debug_tmp:
                    print(' --   sub-array:', sa_id, '\n', ' ' * 15, tel_ids)

                # choose the number of obs blocks inside these blocks
                n_obs_blocks = self.rnd_gen.randint(
                    self.min_n_obs_block, self.max_n_obs_block
                )

                if debug_tmp:
                    print(
                        ' ---  n_sched_block:', n_sched_block,
                        ' ---  n_sched_block_now / n_tel_now:', n_sched_block_now,
                        n_tel_now, '-------', sched_block_id
                    )

                tot_obs_block_duration_sec = 0
                block_duration_sec = tot_sched_duration_sec

                targets = get_rnd_targets(
                    self=self,
                    night_duration_sec=night_duration_sec,
                    block_duration_sec=block_duration_sec,
                )

                for n_obs_now in range(n_obs_blocks):
                    obs_block_id = (
                        self.obs_block_prefix + base_cycle_name + str(n_sched_block_now)
                        + '_' + str(n_obs_now)
                    )

                    obs_block_name = (str(n_sched_block) + ' (' + str(n_obs_now) + ')')

                    self.exe_phase[obs_block_id] = ''

                    rnd = self.rnd_gen.random()
                    obs_block_sec = self.obs_block_sec
                    if rnd < 0.05:
                        obs_block_sec /= 1.8
                    elif rnd < 0.3:
                        obs_block_sec /= 1.5
                    elif rnd < 0.5:
                        obs_block_sec /= 1.1
                    obs_block_sec = int(floor(obs_block_sec))

                    planed_block_end_sec = block_duration_sec + obs_block_sec
                    is_cycle_done = (planed_block_end_sec > night_end_sec)
                    if is_cycle_done:
                        if debug_tmp:
                            print(
                                ' - is_cycle_done - ',
                                'n_obs_now / start_time_sec / duration:', n_obs_now,
                                block_duration_sec, obs_block_sec
                            )
                        break

                    # integrated time for all obs blocks within this sched block
                    tot_obs_block_duration_sec += obs_block_sec

                    pointings = get_rnd_pointings(
                        self=self,
                        tel_ids=tel_ids,
                        targets=targets,
                        sched_block_id=sched_block_id,
                        obs_block_id=obs_block_id,
                        n_obs_now=n_obs_now,
                    )

                    if debug_tmp:
                        print(
                            ' ---- n_obs_now / start_time_sec / duration:',
                            n_obs_now,
                            block_duration_sec,
                            obs_block_sec,
                            '-------',
                            obs_block_id,
                        )

                    time = {
                        'start': block_duration_sec,
                        'duration': obs_block_sec - overhead_sec,
                    }
                    time['end'] = time['start'] + time['duration']

                    exe_state = {'state': 'wait', 'can_run': True}

                    metadata = {
                        'n_sched': n_sched_block,
                        'n_obs': n_obs_now,
                        'block_name': obs_block_name
                    }

                    telescopes = {
                        'large': {
                            'min':
                            int(len(list(filter(lambda x: 'L' in x, tel_ids))) / 2),
                            'max': 4,
                            'ids': list(filter(lambda x: 'L' in x, tel_ids))
                        },
                        'medium': {
                            'min':
                            int(len(list(filter(lambda x: 'M' in x, tel_ids))) / 2),
                            'max': 25,
                            'ids': list(filter(lambda x: 'M' in x, tel_ids))
                        },
                        'small': {
                            'min':
                            int(len(list(filter(lambda x: 'S' in x, tel_ids))) / 2),
                            'max': 70,
                            'ids': list(filter(lambda x: 'S' in x, tel_ids))
                        }
                    }

                    block = {
                        'sched_block_id': sched_block_id,
                        'obs_block_id': obs_block_id,
                        'time': time,
                        'metadata': metadata,
                        'timestamp': get_time('msec'),
                        'telescopes': telescopes,
                        'exe_state': exe_state,
                        'run_phase': [],
                        'targets': targets,
                        'pointings': pointings,
                        'tel_ids': tel_ids,
                    }

                    pipe.set(
                        name=block['obs_block_id'],
                        data=block,
                        expire_sec=self.expire_sec
                    )

                    self.all_obs_blocks.append(block)

                    block_duration_sec += obs_block_sec

                # list of duration of all sched blocks within this cycle
                if tot_obs_block_duration_sec > 0:  # timedelta(seconds = 0):
                    sched_block_duration_sec += [tot_obs_block_duration_sec]

            # the maximal duration of all blocks within this cycle
            tot_sched_duration_sec += max(sched_block_duration_sec)

        pipe.set(name='external_events', data=self.external_events)
        pipe.set(name='external_clock_events', data=self.external_clock_events)

        pipe.execute()

        self.update_exe_statuses()

        return

    # ------------------------------------------------------------------
    def get_obs_block_template(self):
        """temporary hardcoded dict......
        """

        # generated with:
        #   print jsonAcs.encode(jsonAcs.classFactory.defaultValues[sb.ObservationBlock])

        template = {
            'py/object': 'sb.ObservationBlock',
            'src': {
                'py/object': 'sb.Source',
                'proposal_priority': {
                    'py/object': 'sb.High'
                },
                'proposal_type': {
                    'py/object': 'sb.placeholder'
                },
                'region_of_interest': {
                    'py/object': 'sb.RegionOfInterest',
                    'circle_radius': 100
                },
                'coords': {
                    'py/object': 'sb.Coordinates',
                    'equatorial': {
                        'py/object': 'sb.EquatorialCoordinates',
                        'dec': 4,
                        'ra': 2
                    }
                },
                'id': 'source',
                'observing_mode': {
                    'py/object': 'sb.ObservingMode',
                    'slewing_': {
                        'py/object': 'sb.Slewing',
                        'take_data': 1
                    },
                    'observing_type': {
                        'py/object': 'sb.ObservingType',
                        'wobble_': {
                            'py/object': 'sb.Wobble',
                            'angle': 1,
                            'offset': 1
                        }
                    }
                }
            },
            'observing_conditions': {
                'py/object': 'sb.ObservingConditions',
                'quality_': {
                    'py/object': 'sb.Quality',
                    'illumination': 1,
                    'min_nsb_range': 1,
                    'max_nsb_range': 1
                },
                'start_time_sec': {
                    'py/object': 'sb.DateTime',
                    'placeholder': 1
                },
                'weather_': {
                    'py/object': 'sb.Weather',
                    'wind_speed': 1,
                    'precision_pointing': 1,
                    'cloudiness': 1,
                    'humidity': 1
                },
                'duration': 0,
                'tolerance': 1
            },
            'max_script_duration': 0,
            'script_id': 'script_id',
            'id': 'ob_id'
        }

        return template

    # ------------------------------------------------------------------
    def wait_to_run(self):
        """move one from wait to run
        """

        # time_now_sec = self.time_of_night.get_current_time()
        time_now_sec = self.clock_sim.get_time_now_sec()

        # move to run state
        wait_blocks = [
            x for x in self.all_obs_blocks if (x['exe_state']['state'] == 'wait')
        ]

        pipe = self.redis.get_pipe()

        has_change = False
        for block in wait_blocks:
            time_comp = (
                block['time']['start'] - (self.loop_sleep_sec * self.loop_act_rate)
            )
            if time_now_sec < time_comp:
                # datetime.strptime(block['start_time_sec'], '%Y-%m-%d %H:%M:%S'):
                # - deltatime((self.loop_sleep_sec * self.loop_act_rate))
                continue

            block['exe_state']['state'] = 'run'

            self.exe_phase[block['obs_block_id']] = 'start'
            block['run_phase'] = copy.deepcopy(self.phases_exe['start'])

            has_change = True
            pipe.set(name=block['obs_block_id'], data=block, expire_sec=self.expire_sec)

        if has_change:
            pipe.execute()

            # check for blocks which cant begin as their time is already past
            wait_blocks = [
                x for x in self.all_obs_blocks if x['exe_state']['state'] == 'wait'
            ]

            has_change = False
            for block in wait_blocks:
                # # adjust the starting/ending time
                # block['end_time_sec'] = block['start_time_sec'] + block['duration']

                is_over_time = time_now_sec >= block['time']['end']
                is_rnd_stop = (
                    self.rnd_gen.random() < self.phase_rnd_frac['cancel'] * 0.1
                )
                if is_over_time or is_rnd_stop:

                    block['exe_state']['state'] = 'cancel'
                    if self.rnd_gen.random() < self.error_rnd_frac['E1']:
                        block['exe_state']['error'] = 'E1'
                    elif self.rnd_gen.random() < self.error_rnd_frac['E2']:
                        block['exe_state']['error'] = 'E2'
                    elif self.rnd_gen.random() < self.error_rnd_frac['E3']:
                        block['exe_state']['error'] = 'E3'
                    elif self.rnd_gen.random() < self.error_rnd_frac['E4']:
                        block['exe_state']['error'] = 'E4'
                    elif self.rnd_gen.random() < self.error_rnd_frac['E8']:
                        block['exe_state']['error'] = 'E8'

                    block['exe_state']['can_run'] = False

                    block['run_phase'] = []

                    self.exe_phase[block['obs_block_id']] = ''

                    has_change = True
                    pipe.set(
                        name=block['obs_block_id'],
                        data=block,
                        expire_sec=self.expire_sec,
                    )

            if has_change:
                pipe.execute()

        return

    # ------------------------------------------------------------------
    def run_phases(self):
        """progress run phases
        """

        time_now_sec = self.clock_sim.get_time_now_sec()

        runs = [x for x in self.all_obs_blocks if (x['exe_state']['state'] == 'run')]

        pipe = self.redis.get_pipe()

        has_change = False
        for block in runs:
            phase = self.exe_phase[block['obs_block_id']]
            if phase == '':
                continue

            for phase_now in self.phases_exe[phase]:
                if phase_now in block['run_phase']:

                    if phase_now in self.phases_exe['start']:
                        is_done = (self.rnd_gen.random() < self.phase_rnd_frac['start'])
                        # if is_done:
                        #   block['end_time_sec'] = block['start_time_sec'] + block['duration']

                    elif phase_now in self.phases_exe['during']:
                        is_done = (
                            time_now_sec >= (
                                block['time']['end'] -
                                block['time']['duration'] * self.phase_rnd_frac['finish']
                            )
                        )  # (datetime.strptime(block['end_time_sec'], '%Y-%m-%d %H:%M:%S') - timedelta(seconds = int(block['duration']) * self.phase_rnd_frac['finish'])))

                    else:
                        is_done = (
                            time_now_sec >= block['time']['end']
                        )  # is_done = (time_now_sec >= datetime.strptime(block['end_time_sec'], '%Y-%m-%d %H:%M:%S'))

                    if is_done:
                        block['run_phase'].remove(phase_now)
                    # print is_done,block['run_phase']

            if len(block['run_phase']) == 0:
                next_phase = ''
                if phase == 'start':
                    next_phase = 'during'
                elif phase == 'during':
                    next_phase = 'finish'

                if next_phase in self.phases_exe:
                    block['run_phase'] = copy.deepcopy(self.phases_exe[next_phase])

                self.exe_phase[block['obs_block_id']] = next_phase

            has_change = True
            pipe.set(name=block['obs_block_id'], data=block, expire_sec=self.expire_sec)

        if has_change:
            pipe.execute()

        return

    # ------------------------------------------------------------------
    def run_to_done(self):
        """move one from run to done
        """

        # time_now_sec = self.time_of_night.get_current_time()
        time_now_sec = self.clock_sim.get_time_now_sec()

        runs = [x for x in self.all_obs_blocks if x['exe_state']['state'] == 'run']

        pipe = self.redis.get_pipe()

        has_change = False
        for block in runs:
            if time_now_sec < block['time']['end']:
                continue

            if self.rnd_gen.random() < self.phase_rnd_frac['cancel']:
                block['exe_state']['state'] = 'cancel'
                if self.rnd_gen.random() < self.error_rnd_frac['E1']:
                    block['exe_state']['error'] = 'E1'
                elif self.rnd_gen.random() < self.error_rnd_frac['E2']:
                    block['exe_state']['error'] = 'E2'
                elif self.rnd_gen.random() < self.error_rnd_frac['E3']:
                    block['exe_state']['error'] = 'E3'
                elif self.rnd_gen.random() < self.error_rnd_frac['E4']:
                    block['exe_state']['error'] = 'E4'
                elif self.rnd_gen.random() < self.error_rnd_frac['E8']:
                    block['exe_state']['error'] = 'E8'

            elif self.rnd_gen.random() < self.phase_rnd_frac['fail']:
                block['exe_state']['state'] = 'fail'
                if self.rnd_gen.random() < self.error_rnd_frac['E1']:
                    block['exe_state']['error'] = 'E1'
                elif self.rnd_gen.random() < self.error_rnd_frac['E2']:
                    block['exe_state']['error'] = 'E2'
                elif self.rnd_gen.random() < self.error_rnd_frac['E3']:
                    block['exe_state']['error'] = 'E3'
                elif self.rnd_gen.random() < self.error_rnd_frac['E4']:
                    block['exe_state']['error'] = 'E4'
                elif self.rnd_gen.random() < self.error_rnd_frac['E8']:
                    block['exe_state']['error'] = 'E8'

            else:
                block['exe_state']['state'] = 'done'

            block['run_phase'] = []

            has_change = True
            pipe.set(name=block['obs_block_id'], data=block, expire_sec=self.expire_sec)

            self.exe_phase[block['obs_block_id']] = ''

        if has_change:
            pipe.execute()

        return

    # ------------------------------------------------------------------
    def update_exe_statuses(self):
        """update the exeStatus lists in redis
        """

        blocks_run = []
        obs_block_ids = {'wait': [], 'run': [], 'done': [], 'cancel': [], 'fail': []}

        pipe = self.redis.get_pipe()

        for block in self.all_obs_blocks:
            obs_block_id = block['obs_block_id']
            exe_state = block['exe_state']['state']

            if self.redis.exists(obs_block_id):
                obs_block_ids[exe_state].append(obs_block_id)

                if exe_state == 'run':
                    blocks_run += [block]

        for key, val in obs_block_ids.items():
            pipe.set(name='obs_block_ids_' + key, data=val)

        pipe.execute()

        update_sub_arrs(self=self, blocks=blocks_run)

        return

    # # ------------------------------------------------------------------
    # def update_sub_arrs(self, blocks=None):
    #     pipe = self.redis.get_pipe()
    #     if blocks is None:
    #         obs_block_ids = self.redis.get(
    #             name=('obs_block_ids_' + 'run'), default_val=[]
    #         )
    #         for obs_block_id in obs_block_ids:
    #             pipe.get(obs_block_id)

    #         blocks = pipe.execute()

    #     #
    #     sub_arrs = []
    #     all_tel_ids = copy.deepcopy(self.tel_ids)

    #     for n_block in range(len(blocks)):
    #         block_tel_ids = (
    #             blocks[n_block]['telescopes']['large']['ids']
    #             + blocks[n_block]['telescopes']['medium']['ids']
    #             + blocks[n_block]['telescopes']['small']['ids']
    #         )
    #         pnt_id = blocks[n_block]['pointings'][0]['id']
    #         pointing_name = blocks[n_block]['pointings'][0]['name']

    #         # compile the telescope list for this block
    #         tels = []
    #         for id_now in block_tel_ids:
    #             tels.append({'id': id_now})

    #             if id_now in all_tel_ids:
    #                 all_tel_ids.remove(id_now)

    #         # add the telescope list for this block
    #         sub_arrs.append({'id': pnt_id, 'N': pointing_name, 'children': tels})

    #     # ------------------------------------------------------------------
    #     # now take care of all free telescopes
    #     # ------------------------------------------------------------------
    #     tels = []
    #     for id_now in all_tel_ids:
    #         tels.append({'id': id_now})

    #     sub_arrs.append({'id': self.no_sub_arr_name, 'children': tels})

    #     # ------------------------------------------------------------------
    #     # for now - a simple/stupid solution, where we write the sub-arrays and publish each
    #     # time, even if the content is actually the same ...
    #     # ------------------------------------------------------------------
    #     self.redis.set(name='sub_arrs', data=sub_arrs)
    #     self.redis.publish(channel='sub_arrs')

    #     return

    # ------------------------------------------------------------------
    def external_add_new_redis_blocks(self):
        obs_block_update = self.redis.get(self.update_name, default_val=None)
        if obs_block_update is None:
            return

        pipe = self.redis.get_pipe()

        # for key in self.all_obs_blocks[0]:
        #     self.log.info([['g', key, self.all_obs_blocks[0][key]]])

        # self.log.info([['g', obs_block_update]])
        self.log.info([['g', len(obs_block_update), len(self.all_obs_blocks)]])

        total = 0
        for n_block in range(len(obs_block_update)):
            if self.redis.exists(obs_block_update[n_block]['obs_block_id']):
                # for x in self.all_obs_blocks:
                #     if x['obs_block_id'] == obs_block_update[n_block]['obs_block_id']:
                #         current = [x][0]

                current = [
                    x for x in self.all_obs_blocks
                    if x['obs_block_id'] == obs_block_update[n_block]['obs_block_id']
                ]
                if len(current) == 0:
                    current = obs_block_update[n_block]
                    self.all_obs_blocks.append(current)
                    # for key in obs_block_update[n_block]:
                    #     self.log.info([['g', key, obs_block_update[n_block][key]]])
                else:
                    current = current[0]
                if current['exe_state']['state'] not in ['wait', 'run']:
                    continue

                total += 1

                pipe.set(
                    name=obs_block_update[n_block]['obs_block_id'],
                    data=obs_block_update[n_block],
                    expire_sec=self.expire_sec,
                )
                current = obs_block_update[n_block]

            else:
                self.all_obs_blocks.append(obs_block_update[n_block])
                pipe.set(
                    name=obs_block_update[n_block]['obs_block_id'],
                    data=obs_block_update[n_block],
                    expire_sec=self.expire_sec,
                )

        self.update_exe_statuses()
        # for block in self.all_obs_blocks:
        #     exe_state = block['exe_state']['state']
        #     self.log.info([['g', block['metadata']['block_name'] + ' ' + exe_state]])

        pipe.delete(self.update_name)
        pipe.execute()

        self.log.info([['g', total, len(obs_block_update), len(self.all_obs_blocks)]])

        return

    # ------------------------------------------------------------------
    def loop_main(self):
        self.log.info([['g', ' - starting SchedulerStandalone.loop_main ...']])
        sleep(0.1)

        n_loop = 0
        while self.can_loop():
            n_loop += 1
            sleep(self.loop_sleep_sec)
            if n_loop % self.loop_act_rate != 0:
                continue

            with SchedulerStandalone.lock:
                if self.n_nights < self.clock_sim.get_n_nights():
                    self.init()
                else:
                    self.external_add_new_redis_blocks()
                    wait_blocks = [
                        x for x in self.all_obs_blocks
                        if (x['exe_state']['state'] == 'wait')
                    ]
                    runs = [
                        x for x in self.all_obs_blocks
                        if (x['exe_state']['state'] == 'run')
                    ]

                    if len(wait_blocks) + len(runs) == 0:
                        self.init()
                    else:
                        self.wait_to_run()
                        self.run_phases()
                        self.run_to_done()
                        external_generate_events(self)

                self.update_exe_statuses()

        self.log.info([['c', ' - ending SchedulerStandalone.loop_main ...']])

        return
