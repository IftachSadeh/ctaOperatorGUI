from random import Random
from time import sleep
from threading import Lock

from shared.ServiceManager import ServiceManager
from shared.LogParser import LogParser
from shared.utils import get_rnd_seed
from shared.RedisManager import RedisManager
from MockSched import MockSched
from shared.utils import has_acs

from SchedulerUtils import get_rnd_targets
from SchedulerUtils import get_rnd_pointings
from SchedulerUtils import update_sub_arrs
from SchedulerUtils import external_generate_events
from SchedulerUtils import external_generate_clock_events

if has_acs:
    # from Acspy.Clients.SimpleClient import PySimpleClient
    import sb
    # import jsonAcs

    # template = jsonAcs.classFactory.defaultValues[sb.ObservationBlock]
    # # template = jsonAcs.classFactory.defaultValues[sb.SchedulingBlock]
    # template = jsonAcs.encode(template)
    # print template


# ------------------------------------------------------------------
class SchedulerACS(ServiceManager):
    """scheduler interface class, simulating the execution of scheduling blocks

       Only a single active instance is allowed to exist
    """

    lock = Lock()

    # ------------------------------------------------------------------
    def __init__(self, base_config, service_name, interrupt_sig):
        self.class_name = self.__class__.__name__
        service_name = (service_name if service_name is not None else self.class_name)
        super().__init__(service_name=service_name)

        self.log = LogParser(base_config=base_config, title=__name__)
        # self.log.info([['y', ' - SchedulerACS - '], ['g', base_config.site_type]])

        self.base_config = base_config
        self.site_type = self.base_config.site_type
        self.clock_sim = self.base_config.clock_sim
        self.inst_data = self.base_config.inst_data

        self.service_name = service_name
        self.interrupt_sig = interrupt_sig

        self.tel_ids = self.inst_data.get_inst_ids(inst_types=['LST', 'MST', 'SST'])

        self.no_sub_arr_name = self.base_config.no_sub_arr_name

        self.redis = RedisManager(
            name=self.class_name, base_config=self.base_config, log=self.log
        )

        self.debug = not True
        self.expire_sec = 86400  # one day
        # self.expire_sec = 5

        self.MockSched = None

        # self.client = PySimpleClient()
        # self.supervisor = self.client.getComponent('ArraySupervisor')
        # self.log.info([['y',' - SchedulerACS - '],['p','got supervisor!']])

        self.phases_exe = dict()
        self.phases_exe['start'] = [
            'run_config_mount',
            'run_config_camera',
            'run_config_daq',
            'run_config_mirror',
        ]
        self.phases_exe['during'] = [
            'run_take_data',
        ]
        self.phases_exe['finish'] = [
            'run_finish_mount',
            'run_finish_camera',
            'run_finish_daq',
        ]

        self.az_min_max = [-180, 180]

        self.loop_sleep_sec = 3

        rnd_seed = get_rnd_seed()
        # rnd_seed = 10987268332
        self.rnd_gen = Random(rnd_seed)

        # make sure this is the only active instance
        self.init_active_instance()

        self.setup_threads()

        self.MockSched = MockSched(
            base_config=self.base_config, interrupt_sig=self.interrupt_sig
        )

        # temporary hack to be consistent with SchedulerStandalone
        self.external_events = []
        self.external_clock_events = []
        external_generate_clock_events(self)
        external_generate_events(self)

        return

    # ------------------------------------------------------------------
    def setup_threads(self):

        self.add_thread(target=self.loop_main)

        return

    # ------------------------------------------------------------------
    def reset_blocks(self):
        debug_tmp = False
        # debug_tmp = True

        if debug_tmp:
            self.log.info([['p', ' - SchedulerACS.reset_blocks() ...']])

        if self.MockSched is None:
            sleep(0.1)
            self.log.debug([[
                'r', ' - no MockSched ... will try to reset_blocks() again ...'
            ]])
            self.reset_blocks()
            return

        night_duration_sec = self.clock_sim.get_night_duration_sec()

        sched_blocks = self.MockSched.get_blocks()

        obs_block_ids = dict()
        obs_block_ids['wait'] = []
        obs_block_ids['run'] = []
        obs_block_ids['done'] = []
        obs_block_ids['cancel'] = []
        obs_block_ids['fail'] = []

        blocks_run = []
        active = sched_blocks['active']

        pipe = self.redis.get_pipe()

        for sched_blk_id, schBlock in sched_blocks['blocks'].items():

            sub_array_tels = (
                schBlock['sched_block'].config.instrument.sub_array.telescopes
            )
            tel_ids = [x.id for x in sub_array_tels]

            obs_blocks = schBlock['sched_block'].observation_blocks

            # get the total duration of all obs blocks
            block_duration_sec = 0
            for n_obs_block_now in range(len(obs_blocks)):
                obs_block_id = obs_blocks[n_obs_block_now].id
                block_duration_sec += (sched_blocks['metadata'][obs_block_id]['duration'])

            targets = get_rnd_targets(
                self=self,
                night_duration_sec=night_duration_sec,
                block_duration_sec=block_duration_sec,
            )

            for n_obs_block_now in range(len(obs_blocks)):
                obs_block_now = obs_blocks[n_obs_block_now]
                obs_block_id = obs_block_now.id
                # trg_id = obs_block_now.src.id
                # coords = obs_block_now.src.coords.horizontal

                sched_metadata = sched_blocks['metadata'][obs_block_id]
                timestamp = sched_metadata['timestamp']
                metadata = sched_metadata['metadata']
                status = sched_metadata['status']
                phases = sched_metadata['phases']
                duration = sched_metadata['duration']
                start_time_sec_plan = sched_metadata['start_time_sec_plan']
                start_time_sec_exe = sched_metadata['start_time_sec_exe']

                start_time_sec = (
                    start_time_sec_plan
                    if start_time_sec_exe is None else start_time_sec_exe
                )

                # state of ob
                if status == sb.OB_PENDING:
                    state = 'wait'
                elif status == sb.OB_RUNNING:
                    state = 'run'
                elif status == sb.OB_CANCELED:
                    state = 'cancel'
                elif status == sb.OB_FAILED:
                    state = 'fail'
                else:
                    state = 'done'

                # final sanity check
                if state == 'run' and sched_blk_id not in active:
                    state = 'done'

                run_phase = []
                if state == 'run':
                    for p in phases:
                        if p.status == sb.OB_RUNNING:
                            phase_name = 'run_' + p.name
                            for phases_exe in self.phases_exe:
                                if phase_name in self.phases_exe[phases_exe]:
                                    run_phase.append(phase_name)

                    if debug_tmp:
                        self.log.debug([
                            ['b', ' -- run_phase - '],
                            ['y', run_phase, ' '],
                            ['b', tel_ids],
                        ])

                can_run = True
                if state == 'cancel' or state == 'fail':
                    can_run = (self.clock_sim.get_time_now_sec() >= start_time_sec)

                exe_state = {'state': state, 'can_run': can_run}

                time = {
                    'start': start_time_sec,
                    'duration': duration,
                }
                time['end'] = time['start'] + time['duration']

                telescopes = {
                    'large': {
                        'min': int(len(list(filter(lambda x: 'L' in x, tel_ids))) / 2),
                        'max': 4,
                        'ids': list(filter(lambda x: 'L' in x, tel_ids))
                    },
                    'medium': {
                        'min': int(len(list(filter(lambda x: 'M' in x, tel_ids))) / 2),
                        'max': 25,
                        'ids': list(filter(lambda x: 'M' in x, tel_ids))
                    },
                    'small': {
                        'min': int(len(list(filter(lambda x: 'S' in x, tel_ids))) / 2),
                        'max': 70,
                        'ids': list(filter(lambda x: 'S' in x, tel_ids))
                    }
                }

                pointings = get_rnd_pointings(
                    self=self,
                    tel_ids=tel_ids,
                    targets=targets,
                    sched_block_id=sched_blk_id,
                    obs_block_id=obs_block_id,
                    n_obs_now=n_obs_block_now,
                )

                block = dict()
                block['sched_block_id'] = sched_blk_id
                block['obs_block_id'] = obs_block_id
                block['time'] = time
                block['metadata'] = metadata
                block['timestamp'] = timestamp
                block['telescopes'] = telescopes
                block['exe_state'] = exe_state
                block['run_phase'] = run_phase
                block['targets'] = targets
                block['pointings'] = pointings
                block['tel_ids'] = tel_ids

                if state == 'run':
                    blocks_run += [block]

                obs_block_ids[state].append(obs_block_id)

                pipe.set(name=obs_block_id, data=block, expire_sec=self.expire_sec)

        pipe.set(name='obs_block_ids_' + 'wait', data=obs_block_ids['wait'])
        pipe.set(name='obs_block_ids_' + 'run', data=obs_block_ids['run'])
        pipe.set(name='obs_block_ids_' + 'done', data=obs_block_ids['done'])
        pipe.set(name='obs_block_ids_' + 'cancel', data=obs_block_ids['cancel'])
        pipe.set(name='obs_block_ids_' + 'fail', data=obs_block_ids['fail'])

        pipe.execute()

        update_sub_arrs(self=self, blocks=blocks_run)

        return

    # # ------------------------------------------------------------------
    # def update_sub_arrs(self, blocks=None):
    #     # inst_pos = self.redis.h_get_all(name='inst_pos')
    #     pipe = self.redis.get_pipe()

    #     if blocks is None:
    #         obs_block_ids = self.redis.get(
    #             name=('obs_block_ids_' + 'run'), default_val=[]
    #         )
    #         for obs_block_id in obs_block_ids:
    #             pipe.get(obs_block_id)

    #         blocks = pipe.execute()

    #     # sort so last is first in the list (latest sub-array defined gets the telescope)
    #     blocks = sorted(
    #         blocks, cmp=lambda a, b: int(b['timestamp']) - int(a['timestamp'])
    #     )
    #     # print [a['timestamp'] for a in blocks]

    #     sub_arrs = []
    #     all_tel_ids_in = []
    #     for n_block in range(len(blocks)):
    #         block_tel_ids = blocks[n_block]['tel_ids']
    #         pnt_id = blocks[n_block]['point_id']
    #         pointing_name = blocks[n_block]['pointing_name']

    #         # compile the telescope list for this block
    #         tels = []
    #         for id_now in block_tel_ids:
    #             if id_now not in all_tel_ids_in:
    #                 all_tel_ids_in.append(id_now)
    #                 tels.append({'id': id_now})

    #         # add the telescope list for this block
    #         sub_arrs.append({'id': pnt_id, 'N': pointing_name, 'children': tels})

    #     # ------------------------------------------------------------------
    #     # now take care of all free telescopes
    #     # ------------------------------------------------------------------
    #     tels = []
    #     all_tel_ids = [x for x in self.tel_ids if x not in all_tel_ids_in]
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
    def loop_main(self):
        self.log.info([['g', ' - starting SchedulerACS.loop_main ...']])

        print(' -- SchedulerACS.loop_main has not been verified, since no acs ...')
        print(' -- SchedulerACS.loop_main has not been verified, since no acs ...')
        print(' -- SchedulerACS.loop_main has not been verified, since no acs ...')

        pipe = self.redis.get_pipe()

        pipe.set(name='obs_block_ids_' + 'wait', data='')
        pipe.set(name='obs_block_ids_' + 'run', data='')
        pipe.set(name='obs_block_ids_' + 'done', data='')
        pipe.set(name='obs_block_ids_' + 'cancel', data='')
        pipe.set(name='obs_block_ids_' + 'fail', data='')

        pipe.execute()

        update_sub_arrs(self=self, blocks=[])

        while self.can_loop():
            sleep(self.loop_sleep_sec)

            with SchedulerACS.lock:
                self.reset_blocks()

        self.log.info([['c', ' - ending SchedulerACS.loop_main ...']])

        return
