import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import floor
import random
from random import Random
import copy

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import get_rnd, get_time, get_rnd_seed
from ctaGuiUtils.py.utils import my_log, has_acs

if has_acs:
    import ACS__POA
    from ACS import CBDescIn
    from Acspy.Clients.SimpleClient import PySimpleClient
    import sb
    # import jsonAcs


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class MockSched():
    is_active = False

    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, site_type, time_of_night):
        self.log = my_log(title=__name__)
        self.log.info([['y', " - MockSched - "], ['g', site_type]])

        # ------------------------------------------------------------------
        # sanity check for development only
        if MockSched.is_active:
            print 'is_active is_active is_active is_active is_active is_active is_active is_active is_active'
            return
        MockSched.is_active = True
        # ------------------------------------------------------------------
        if not has_acs:
            print 'no ACS ......'
            return
        # ------------------------------------------------------------------

        self.site_type = site_type

        self.time_of_night = time_of_night

        self.debug = True
        self.debug = False

        self.cycle_blocks = []
        self.acs_blocks = dict()
        self.acs_blocks['blocks'] = dict()
        self.acs_blocks['metadata'] = dict()
        self.acs_blocks['active'] = []

        self.active_sched_block = 0
        self.n_sched_subs = 0
        self.n_init_cycle = -1
        self.name_prefix = get_rnd(n_digits=6, out_type=str)

        self.client = PySimpleClient()
        # self.client.makeCompImmortal("ArraySupervisor", True)
        self.supervisor = self.client.getComponent("ArraySupervisor")
        self.log.info([['y', " - MockSched - "], ['p', 'got supervisor!']])

        self.script_name = "guiACS_sched_blocks_script0"
        self.max_n_cycles = 100
        self.min_n_sched_block = 2
        self.max_n_sched_block = 5
        self.min_n_obs_block = 1
        self.max_n_obs_block = 3
        self.min_n_tel_block = 4
        self.max_n_free_tels = 5

        self.time_of_night.reset_night()
        self.obs_block_seconds = 1800  # 30 minutes
        # 0.035 -> one minute instead of 30 for gui testing
        self.duration_scale = self.time_of_night.get_timescale()
        self.duration_night = self.time_of_night.get_total_time_seconds(
        )  # 28800 -> 8 hour night
        self.prev_reset_time = self.time_of_night.get_reset_time()

        # ------------------------------------------------------------------
        # ------------------------------------------------------------------
        # ------------------------------------------------------------------
        # self.duration_scale /= 2
        # ------------------------------------------------------------------
        # ------------------------------------------------------------------
        # ------------------------------------------------------------------

        self.az_min_max = [0, 360]
        self.zen_min_max_tel = [0, 70]
        self.zen_min_max_pnt = [0, 20]

        self.loop_sleep = 3

        rnd_seed = get_rnd_seed()
        # rnd_seed = 10987268332
        self.rnd_gen = Random(rnd_seed)

        gevent.spawn(self.loop)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_blocks(self):
        with MockSched.lock:
            self.set_active_sched_blocks(has_lock=True)
            return copy.deepcopy(self.acs_blocks)

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def cancel_sched_blocks(self, sched_block_id):
        class MyVoid(ACS__POA.CBvoid):
            def working(self, completion, desc):
                # print "bbbbbbbbbb Callback working",sched_block_id
                return

            def done(self, completion, desc):
                # print "bbbbbbbbbbbbb Callback done",sched_block_id
                return

        desc = CBDescIn(0L, 0L, 0L)
        cb = MyVoid()
        # self.log.info([['r'," ---- MockSched.cancel_sched_blocks() ... "],['g',sched_block_id]])
        self.supervisor.cancelSchedulingBlock(
            sched_block_id, self.client.activateOffShoot(cb), desc
        )
        # self.log.info([['r'," ++++ MockSched.cancel_sched_blocks() ... "],['g',sched_block_id]])

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def cancel_zombie_sched_blocks(self, sched_block_ids=None):
        if sched_block_ids is None:
            try:
                active = self.supervisor.listSchedulingBlocks()
            except Exception as e:
                self.log.debug([['b', "- Exception - MockSched.listSchedulingBlocks: "],
                                ['r', e]])
                active = []
            sched_block_ids = [x for x in active if x not in self.acs_blocks['blocks']]

        if len(sched_block_ids) == 0:
            return

        self.log.debug([['r', " - MockSched.cancel_zombie_sched_blocks() ..."],
                        ['y', sched_block_ids]])
        for sched_block_id_now in sched_block_ids:
            gevent.spawn(self.cancel_sched_blocks, sched_block_id_now)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_block_cycle(self):
        with MockSched.lock:
            self.log.info([['p', " - MockSched.init_block_cycle() ..."]])
            debug_tmp = not True

            current_blocks = self.acs_blocks['blocks'].keys()
            if len(current_blocks) > 0:
                self.log.info([['r', "- will discard sched blocks: "],
                               ['b', current_blocks]])

            if 0:
                blabla = 0
                # # Create a client and the ArraySupervisor component
                # client = PySimpleClient()
                # supervisor = client.getComponent("ArraySupervisor")

                # # Create a dummy scheduling block that will be passed to the array supervisor.
                # # Scheduling block is a very complex structure and because of ACS/Corba all fields
                # # and structures inside the SchedulingBlock have to be non None. The clients could
                # # share some common builder utility methods to construct the scheduling blocks

                # config = sb.Configuration(sb.InstrumentConfiguration(
                #         sb.PointingMode(2, sb._divergent(2)),
                #         sb.Subarray([], [sb.Telescope("telescope_id", sb.LST)])
                #     ), "camera", "rta")
                # coords = sb.Coordinates(3, sb.GalacticCoordinates(10, 10))
                # observing_mode = sb.ObservingMode(sb.Slewing(
                #     1), sb.ObservingType(2, sb.GridSurvey(1, 1, 1)))
                # src = sb.Source("source", sb.placeholder, sb.High,
                #                 sb.RegionOfInterest(100), observing_mode, coords)
                # obs = sb.ObservingConditions(sb.DateTime(
                #     1), 0, 1, sb.Quality(1, 1, 1), sb.Weather(1, 1, 1, 1))
                # ob = sb.ObservationBlock("ob", src, obs, "waitScript", 0)
                # schedulingBlock = sb.SchedulingBlock(
                #     "sb_0001", sb.Proposal("id"), config, [ob])

                # # Submit the scheduling block to the array supervisor
                # print "Submit the scheduling block to the array supervisor"
                # comp = supervisor.putSchedulingBlock(schedulingBlock)
                # # Print the command execution completion
                # print comp

                # return

            # cancel sched_blocks which should have expired
            self.cancel_zombie_sched_blocks()

            # init local bookkeeping objects
            self.cycle_blocks = []
            self.acs_blocks = dict()
            self.acs_blocks['blocks'] = dict()
            self.acs_blocks['metadata'] = dict()
            self.acs_blocks['active'] = []

            self.time_of_night.reset_night(log=self.log)
            self.prev_reset_time = self.time_of_night.get_reset_time()
            # start_time_sec = self.time_of_night.get_start_time_sec()
            self.n_init_cycle += 1

            overhead_seconds = 30
            is_cycle_done = False
            n_cycle_now = 0
            tot_block_seconds = 0
            max_block_seconds = self.duration_night - self.obs_block_seconds

            if debug_tmp:
                print '-------------------------------------------------------------------------'
                print 'duration_night: ', self.duration_night

            while tot_block_seconds < max_block_seconds and \
                    n_cycle_now < self.max_n_cycles and \
                    not is_cycle_done:

                base_name = (
                    self.name_prefix + "_"
                    + str(self.n_init_cycle) + "_"
                    + str(n_cycle_now) + "_"
                )
                n_cycle_now += 1

                tel_ids = copy.deepcopy(utils.tel_ids)
                n_tels = len(tel_ids)
                n_sched_blocks = min(
                    floor(n_tels / self.min_n_tel_block), self.max_n_sched_block
                )
                n_sched_blocks = max(
                    self.rnd_gen.randint(1, n_sched_blocks), self.min_n_sched_block
                )
                # n_sched_blocks = 50
                # n_sched_blocks = 3

                if debug_tmp:
                    print '------------------------------------------------------------'
                    print(
                        '- n_cycle_now', n_cycle_now, 'tot_block_seconds / percentage:',
                        tot_block_seconds,
                        (tot_block_seconds / float(self.duration_night))
                    )

                # generate random target/pointing ids
                target_pos = dict()
                # blockTrgs = dict()
                # blockTrgPnt = dict()
                # n_trgs = self.rnd_gen.randint(1, n_sched_blocks)
                # for n_trg_try in range(n_sched_blocks):
                #   n_trg_now = self.rnd_gen.randint(0, n_trgs-1)
                #   if n_trg_now not in blockTrgs:
                #     blockTrgs[n_trg_now] = [ n_trg_try ]
                #   else:
                #     blockTrgs[n_trg_now].append(n_trg_try)

                #   blockTrgPnt[n_trg_try] = { "n_trg":n_trg_now, "n_pnt":len(blockTrgs[n_trg_now])-1 }

                cycle_blocks_now = []
                tot_sched_block_seconds = []
                # ------------------------------------------------------------------
                #
                # ------------------------------------------------------------------
                for n_sched_block_now in range(n_sched_blocks):
                    sched_block_id = "schBlock_" + base_name + str(n_sched_block_now)

                    if n_sched_block_now < n_sched_blocks - 1:
                        n_tel_now = max(
                            self.min_n_tel_block,
                            len(tel_ids) - n_sched_blocks
                        )
                        n_tel_now = self.rnd_gen.randint(self.min_n_tel_block, n_tel_now)
                        n_tel_now = min(n_tel_now, len(tel_ids))
                    else:
                        n_tel_now = len(tel_ids) - \
                            self.rnd_gen.randint(0, self.max_n_free_tels)
                    if n_tel_now < self.min_n_tel_block:
                        continue

                    sched_tel_ids = random.sample(tel_ids, n_tel_now)
                    tel_ids = [x for x in tel_ids if x not in sched_tel_ids]

                    sub_arr = []
                    for sched_tel_id_now in sched_tel_ids:
                        tel_type = sb.SST if sched_tel_id_now[
                            0] == 'S' else sb.MST if sched_tel_id_now[0] == 'M' else sb.LST

                        sub_arr += [sb.Telescope(sched_tel_id_now, tel_type)]
                    # sub_arr = [sb.Telescope("L_0", sb.LST), sb.Telescope(
                    #     "L0", sb.LST), sb.Telescope("T0", sb.LST)]
                    # sub_arr = [sb.Telescope("T1", sb.LST), sb.Telescope(
                    #     "T1", sb.MST), sb.Telescope("T1", sb.SST)]
                    # print sub_arr

                    sched_conf = sb.Configuration(
                        sb.InstrumentConfiguration(
                            sb.PointingMode(2, sb._divergent(2)), sb.Subarray([], sub_arr)
                        ), "camera", "rta"
                    )

                    n_obs_blocks = self.rnd_gen.randint(
                        self.min_n_obs_block, self.max_n_obs_block
                    )

                    # n_trg = blockTrgPnt[n_sched_block_now]["n_trg"]
                    # n_pnt = blockTrgPnt[n_sched_block_now]["n_pnt"]
                    n_trg = n_sched_block_now

                    if n_trg not in target_pos:
                        delta_az = self.az_min_max[1] - self.az_min_max[0]
                        delta_zen = self.zen_min_max_tel[1] - self.zen_min_max_tel[0]
                        target_pos[n_trg] = [
                            (self.rnd_gen.random() * delta_az + self.az_min_max[0]),
                            (self.rnd_gen.random() * delta_zen + self.zen_min_max_tel[0])
                        ]

                    target_id = "target_" + str(n_trg)

                    if debug_tmp:
                        print(
                            ' -- n_sched_block_now / n_tel_now:', n_sched_block_now,
                            n_tel_now, '-------', sched_block_id
                        )

                    obs_blocks = []
                    tot_obs_block_seconds = 0
                    block_duration_sec = tot_block_seconds

                    for n_obs_now in range(n_obs_blocks):
                        obs_block_id = "obs_block_"+base_name + \
                            str(n_sched_block_now)+"_"+str(n_obs_now)

                        rnd = self.rnd_gen.random()
                        obs_block_seconds = self.obs_block_seconds
                        # if rnd < 0.1:
                        #   obs_block_seconds /= 3
                        # elif rnd < 0.3:
                        #   obs_block_seconds /= 2
                        if rnd < 0.05:
                            obs_block_seconds /= 1.8
                        elif rnd < 0.3:
                            obs_block_seconds /= 1.5
                        elif rnd < 0.5:
                            obs_block_seconds /= 1.1
                        obs_block_seconds = int(floor(obs_block_seconds))

                        if block_duration_sec + obs_block_seconds > self.duration_night:
                            is_cycle_done = True
                            if debug_tmp:
                                print(
                                    ' - is_cycle_done - n_obs_now / start_time_sec / duration:',
                                    n_obs_now, block_duration_sec, obs_block_seconds
                                )
                            break

                        # integrated time for all obs blocks within this sched block
                        tot_obs_block_seconds += obs_block_seconds

                        # correct for the fact that the config/finish stages take time and
                        # are not scaled
                        scaled_duration = obs_block_seconds * self.duration_scale - overhead_seconds
                        scaled_duration = max(1, scaled_duration)

                        point_pos = copy.deepcopy(target_pos[n_trg])
                        point_pos[0] += (self.rnd_gen.random() - 0.5) * 10
                        point_pos[1] += (self.rnd_gen.random() - 0.5) * 10

                        if point_pos[0] > self.az_min_max[1]:
                            point_pos[0] -= 360
                        elif point_pos[0] < self.az_min_max[0]:
                            point_pos[0] += 360

                        if debug_tmp:
                            print(
                                ' --- n_obs_now / start_time_sec / duration / scaled_duration:',
                                n_obs_now, block_duration_sec, obs_block_seconds,
                                scaled_duration, '-------', obs_block_id
                            )

                        obs_coords = sb.Coordinates(
                            2,
                            sb.HorizontalCoordinates(
                                target_pos[n_trg][1], target_pos[n_trg][0]
                            )
                        )
                        obs_mode = sb.ObservingMode(
                            sb.Slewing(1), sb.ObservingType(2, sb.GridSurvey(1, 1, 1))
                        )
                        obs_source = sb.Source(
                            target_id, sb.placeholder, sb.High, sb.RegionOfInterest(100),
                            obs_mode, obs_coords
                        )
                        obs_conds = sb.ObservingConditions(
                            sb.DateTime(1), scaled_duration, 1, sb.Quality(1, 1, 1),
                            sb.Weather(1, 1, 1, 1)
                        )
                        obs_block = sb.ObservationBlock(
                            obs_block_id, obs_source, obs_conds, self.script_name, 0
                        )

                        # metadata of the observing block
                        _n_sched_blocks = len(self.acs_blocks['blocks'].keys())
                        _n_obs_blocks = len(obs_blocks)
                        metadata = {
                            'n_sched':
                            _n_sched_blocks,
                            'n_obs':
                            _n_obs_blocks,
                            'block_name':
                            str(_n_sched_blocks) + " (" + str(_n_obs_blocks) + ")"
                        }

                        # temporary way to store meta-data - should be replaced by
                        # global coordinate access function
                        self.acs_blocks['metadata'][obs_block_id] = {
                            'metadata': metadata,
                            'timestamp': get_time('msec'),
                            'point_pos': point_pos,
                            'duration': obs_block_seconds,
                            'start_time_sec_plan': block_duration_sec,
                            'start_time_sec_exe': None,
                            'status': sb.OB_PENDING,
                            'phases': []
                        }

                        obs_blocks += [obs_block]
                        block_duration_sec += obs_block_seconds

                    if len(obs_blocks) > 0:
                        sched_block = sb.SchedulingBlock(
                            sched_block_id, sb.Proposal("proposalId"), sched_conf,
                            obs_blocks
                        )

                        cycle_blocks_now.append(sched_block)

                        self.acs_blocks['blocks'][sched_block_id] = {
                            'timestamp': get_time('msec'),
                            'state': 'wait',
                            'sched_block': sched_block
                        }

                        # list of duration of all sched blocks within this cycle
                        tot_sched_block_seconds += [tot_obs_block_seconds]

                # the maximal duration of all blocks within this cycle
                tot_block_seconds += max(tot_sched_block_seconds)

                if len(cycle_blocks_now) > 0:
                    self.cycle_blocks.append(cycle_blocks_now)

            # print '-----',len(self.cycle_blocks)

        return

    # ------------------------------------------------------------------
    # move one from wait to run
    # ------------------------------------------------------------------
    def set_active_sched_blocks(self, has_lock=False):
        metadata = self.acs_blocks['metadata']
        blocks = self.acs_blocks['blocks']

        def set_blocks():
            try:
                active = self.supervisor.listSchedulingBlocks()
            except Exception as e:
                self.log.debug([[
                    'b', "- Exception - MockSched.set_active_sched_blocks: "
                ], ['r', e]])
                active = []

            obs_block_delays = dict()
            self.acs_blocks['active'] = []
            for sched_block_id in blocks:
                obs_block_delays[sched_block_id] = None

                obs_blocks_status = None
                if sched_block_id in active:
                    try:
                        obs_blocks_status = self.supervisor.getSbOperationStatus(
                            sched_block_id
                        ).ob_statuses
                    except Exception as e:
                        self.log.debug([[
                            'b', "- Exception - MockSched.getSbOperationStatus: "
                        ], ['r', e]])

                if obs_blocks_status is not None:
                    self.acs_blocks['active'].append(sched_block_id)
                    blocks[sched_block_id]['state'] = 'run'

                    # sched_block_status = self.supervisor.getSchedulingBlockStatus(
                    #     sched_block_id)
                    # sched_block_op_status = self.supervisor.getSbOperationStatus(
                    #     sched_block_id)
                    # self.log.info([
                    #     ['y', " - active_scheduling_blocks - ", sched_block_id, ' '], [
                    #      'g', active, '-> '], ['y', sched_block_op_status, ' ']
                    # ])

                    for obs_block_now in obs_blocks_status:
                        obs_block_id = obs_block_now.id
                        if obs_block_id in metadata:
                            metadata[obs_block_id]['status'] = obs_block_now.status
                            metadata[obs_block_id]['phases'] = obs_block_now.phases

                            # all state definitions:
                            # enum SchedulingBlockStatus {
                            #   SB_WAITING, SB_PENDING, SB_RUNNING, SB_SUCCEEDED,
                            #   SB_TRUNCATED, SB_CANCELED, SB_FAILED, SB_ABORTED
                            # };
                            # enum ObservationBlockStatus {
                            #   OB_PENDING, OB_RUNNING, OB_SUCCEEDED, OB_CANCELED,
                            #   OB_TRUNCATED, OB_FAILED
                            # };

                            if (metadata[obs_block_id]['start_time_sec_exe'] is None
                                    and obs_block_now.status != sb.OB_PENDING):

                                time_now_sec = self.time_of_night.get_current_time()
                                metadata[obs_block_id]['start_time_sec_exe'] = time_now_sec

                                time_dif = time_now_sec - \
                                    metadata[obs_block_id]['start_time_sec_plan']
                                if time_dif > 0:
                                    obs_block_delays[sched_block_id] = time_dif

                                self.log.info(
                                    [['y', "- obs block is now running: "],
                                     ['r', obs_block_id],
                                     [
                                         'g', ' - planned/executed time: ',
                                         metadata[obs_block_id]['start_time_sec_plan'], ' / ',
                                         time_now_sec
                                     ]]
                                )

                            # phases = obs_block_now.phases
                            # for p in phases:
                            #     self.log.debug([
                            #         [
                            #             'y', " -- phases - ", sched_block_id, ' ',
                            #             obs_block_id, ' ', obs_block_now.status, ' '
                            #         ], [
                            #             'g', p.heartbeat_counter, ' ', p.name,
                            #             ' ', p.status, ' ', p.progress_message
                            #         ]
                            #     ])

                if (obs_blocks_status is None
                        and blocks[sched_block_id]['state'] == 'run'):
                    blocks[sched_block_id]['state'] = 'done'

                    obs_blocks = blocks[sched_block_id]['sched_block'].observation_blocks
                    for obs_block in obs_blocks:
                        obs_block_id = obs_block.id
                        rnd_now = self.rnd_gen.random()
                        if rnd_now < 0.05:
                            metadata[obs_block_id]['status'] = sb.OB_CANCELED
                        elif rnd_now < 0.1:
                            metadata[obs_block_id]['status'] = sb.OB_FAILED
                        else:
                            metadata[obs_block_id]['status'] = sb.OB_SUCCEEDED

                        metadata[obs_block_id]['phases'] = []

                    self.log.info([
                        ['b', "- sched block is done "], ['r', sched_block_id],
                        [
                            'g', ' - currentTime: ',
                            self.time_of_night.get_current_time(),
                        ],
                    ])

            # adjust the start time of all future OBs --- this will NOT take care of OBs of
            # currently active SB, which may overshoot the end of the night !
            time_difs = [x for x in obs_block_delays.values() if x is not None]
            if len(time_difs) > 0:
                # adjust the start time of all future OBs in the currently active SBs
                active_sched_block = len(self.cycle_blocks)
                for sched_block_id in self.acs_blocks['active']:
                    if obs_block_delays[sched_block_id] is None:
                        continue

                    updated_obs_blocks = []
                    sched_block = blocks[sched_block_id]['sched_block']
                    for obs_block in sched_block.observation_blocks:
                        obs_block_id = obs_block.id

                        if metadata[obs_block_id]['start_time_sec_exe'] is None:
                            updated_obs_blocks += [[
                                obs_block_id, obs_block_delays[sched_block_id]
                            ]]
                            metadata[obs_block_id]['start_time_sec_plan'] += obs_block_delays[
                                sched_block_id]

                    if len(updated_obs_blocks) > 0:
                        self.log.info([[
                            'b', " -+- updating start_time_sec_plan of", sched_block_id, " "
                        ], ['y', updated_obs_blocks]])

                    for n_cycle_now in range(len(self.cycle_blocks)):
                        if sched_block in self.cycle_blocks[n_cycle_now]:
                            active_sched_block = n_cycle_now

                # adjust the start time of all OBs in future SBs
                self.log.info([['g', "- will delay future SBs ..."]])

                self.delay_sched_blocks(
                    active_sched_block=(active_sched_block + 1), time_dif=max(time_difs)
                )

            # ------------------------------------------------------------------
            # ????????????????????????????????????????????????????????????????
            # how do i get the status of a ob which has: OB_SUCCEEDED, OB_CANCELED,
            # OB_TRUNCATED, OB_FAILED ????????????????
            # ????????????????????????????????????????????????????????????????
            # ------------------------------------------------------------------

            return

        if has_lock:
            set_blocks()
        else:
            with MockSched.lock:
                set_blocks()

        # self.log.info([['p'," - set_active_sched_blocks() ... ",self.acs_blocks['active']]])
        return

    # ------------------------------------------------------------------
    # update the estimated starting times of all blocks based on the current state of execution
    # clip the list if any block ends up lasting after the night is supposed to end
    # ------------------------------------------------------------------
    def delay_sched_blocks(self, active_sched_block=None, time_dif=None):
        if active_sched_block is None:
            active_sched_block = self.active_sched_block
        if active_sched_block >= len(self.cycle_blocks) - 1:
            return

        # get the maximal difference between planned and current time for each
        # OB of each SB in the cycle which will is about to be submitted
        if time_dif is None:
            time_dif_max = -1
            for sched_block in self.cycle_blocks[active_sched_block]:
                obs_block_id = sched_block.observation_blocks[0].id

                start_time_sec = self.acs_blocks['metadata'][obs_block_id]['start_time_sec_plan']
                time_dif_now = self.time_of_night.get_current_time() - start_time_sec
                time_dif_max = max(time_dif_max, time_dif_now)
        else:
            time_dif_max = time_dif

        # if any of the OBs is late, adjust the planned start time of all OBs in all SBs
        # and remove any OBs which will overshoot the end of the night
        if time_dif_max > 0:
            self.log.info([['r', "- updating start_time_sec_plan by: "], ['b', time_dif_max]])

            # perform the adjustment for all future SBs in all cycles
            for n_cycle_now in range(active_sched_block, len(self.cycle_blocks)):
                sched_blockOverV = []
                for sched_block in self.cycle_blocks[n_cycle_now]:
                    self.log.info([['b', " -+- updating ", sched_block.id, " "],
                                   ['y', [x.id for x in sched_block.observation_blocks]]])

                    # adjust the start time of all OBs in this SB
                    for obs_block in sched_block.observation_blocks:
                        obs_block_id = obs_block.id
                        self.acs_blocks['metadata'][obs_block_id]['start_time_sec_plan'
                                                                  ] += time_dif_max

                        end_time_sec = self.acs_blocks['metadata'][obs_block_id]['start_time_sec_plan'] + \
                            self.acs_blocks['metadata'][obs_block_id]['duration']

                        # a simplistic approach - cancel any SB if at least one of
                        # its OBs overshoots the end of the night
                        if end_time_sec > self.duration_night and (
                                sched_block not in sched_blockOverV):
                            sched_blockOverV.append(sched_block)

                # remove all overshooting SBs from the cycle and apdate the bookkeeping
                for sched_block in sched_blockOverV:
                    self.log.info([[
                        'r', "- cancelling all OBs from future cycle for SB "
                    ], ['p', sched_block.id]])

                    for obs_block in sched_block.observation_blocks:
                        self.acs_blocks['metadata'][obs_block.id
                                                    ]['status'] = sb.OB_CANCELED
                        # self.acs_blocks['metadata'].pop(obs_block.id, None)

                    self.acs_blocks['blocks'][sched_block.id]['state'] = 'cancel'
                    # self.acs_blocks['blocks'].pop(sched_block.id, None)
                    self.cycle_blocks[n_cycle_now].remove(sched_block)

            # remove any cycle which has no SBs letf in it
            self.cycle_blocks = [x for x in self.cycle_blocks if len(x) > 0]

        return

    # ------------------------------------------------------------------
    # move one from wait to run
    # ------------------------------------------------------------------
    def submit_block_cycle(self):
        self.log.info([['g', " - starting MockSched.submit_block_cycle ..."]])

        has_reset_night = (self.time_of_night.get_reset_time() > self.prev_reset_time)
        if has_reset_night:
            self.log.info([[
                'p',
                " - has_reset_night - will cancel all running blocks and reset cycles ..."
            ]])

        if self.active_sched_block >= len(self.cycle_blocks) or has_reset_night:
            self.n_sched_subs = 0
            self.active_sched_block = 0

            self.init_block_cycle()

        # update the start time of all fufute SBs
        with MockSched.lock:
            self.delay_sched_blocks()

        # check if has removed all executable blocks
        if self.active_sched_block >= len(self.cycle_blocks):
            self.submit_block_cycle()
            return

        # ------------------------------------------------------------------
        # submit new blocks
        # ------------------------------------------------------------------
        with MockSched.lock:
            self.n_sched_subs = 0
            for sched_block in self.cycle_blocks[self.active_sched_block]:

                if self.acs_blocks['blocks'][sched_block.id]['state'] == 'wait':
                    # increase the self.n_sched_subs counter BEFORE spawning the thread
                    self.n_sched_subs += 1
                    # spawn a new SB submision (will wait for its start time to
                    # arrive before actually submitting)
                    gevent.spawn(self.submit_one_block, sched_block)

            self.set_active_sched_blocks(has_lock=True)

        self.active_sched_block += 1

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def submit_one_block(self, sched_block):
        with MockSched.lock:
            obs_block_id = sched_block.observation_blocks[0].id

            n_sub_tries = 0
            while True:
                if (self.time_of_night.get_reset_time() > self.prev_reset_time):
                    return

                start_time_sec = self.acs_blocks['metadata'][obs_block_id]['start_time_sec_plan']
                time_dif = self.time_of_night.get_current_time() - start_time_sec
                if time_dif >= 0:
                    break

                if n_sub_tries % 10 == 0:
                    self.log.info([['b', "- waiting to submit "], ['g', sched_block.id],
                                   ['b', ' - remaining time: ', time_dif]])
                n_sub_tries += 1

                sleep(0.5)

            try:
                complt = self.supervisor.putSchedulingBlock(sched_block)

                block_meta = self.acs_blocks['metadata']
                block_times = [((
                    str(x.id) + " --> " + str(block_meta[x.id]['metadata']['n_sched'])
                    + " (" + str(block_meta[x.id]['metadata']['n_obs']) + ")"
                ), [
                    int(floor(block_meta[x.id]['start_time_sec_plan'])),
                    int(
                        floor(
                            block_meta[x.id]['start_time_sec_plan']
                            + block_meta[x.id]['duration']
                        )
                    )
                ]) for x in sched_block.observation_blocks]

                self.log.info([['y', "- submitted sched block: "],
                               ['p', sched_block.id, ' '], ['g', block_times]])

            except Exception as e:
                self.log.debug([['b', "- Exception - MockSched.putSchedulingBlock: "],
                                ['r', e]])

            # as the last action in this thread, update the self.n_sched_subs counter
            self.n_sched_subs -= 1

        return

    # ------------------------------------------------------------------
    # move one from wait to run
    # ------------------------------------------------------------------
    def check_sched_blocks(self):
        self.log.debug([['b', " - starting MockSched.check_sched_blocks ..."]])

        with MockSched.lock:
            self.set_active_sched_blocks(has_lock=True)

            for block_name in self.acs_blocks['active']:
                status = self.supervisor.getSchedulingBlockStatus(block_name)
                opstatus = self.supervisor.getSbOperationStatus(block_name)
                self.log.debug([['y', " - active_scheduling_blocks - "],
                                ['g', self.acs_blocks['active'], '-> '],
                                ['y', status, ' ']])

                for nob in range(len(opstatus.ob_statuses)):
                    phases = opstatus.ob_statuses[nob].phases
                    for p in phases:
                        self.log.debug([[
                            'y', " -- phases - ", block_name, ' ',
                            opstatus.ob_statuses[nob].id, ' ',
                            opstatus.ob_statuses[nob].status, ' '
                        ],
                                        [
                                            'g', p.heartbeat_counter, ' ', p.name, ' ',
                                            p.status, ' ', p.progress_message
                                        ]])

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting MockSched.loop ..."]])

        self.submit_block_cycle()

        while True:
            self.set_active_sched_blocks()
            if len(self.acs_blocks['active']) == 0 and self.n_sched_subs == 0:
                self.submit_block_cycle()

            # self.check_sched_blocks()
            sleep(self.loop_sleep)

        return
