import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
import random
from random import Random
import time
import copy
from datetime import timedelta
from datetime import datetime

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import my_log, my_assert, getTime, no_sub_arr_name, has_acs
from ctaGuiUtils.py.RedisManager import RedisManager
from MockSched import MockSched

if has_acs:
    from Acspy.Clients.SimpleClient import PySimpleClient
    import sb
    import jsonAcs

    # template = jsonAcs.classFactory.defaultValues[sb.ObservationBlock]
    # # template = jsonAcs.classFactory.defaultValues[sb.SchedulingBlock]
    # template = jsonAcs.encode(template)
    # print template


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class ObsBlocks():
    def __init__(self, site_type, time_of_night, InstData):
        self.log = my_log(title=__name__)
        self.log.info([['y', " - ObsBlocks - "], ['g', site_type]])

        self.site_type = site_type
        self.time_of_night = time_of_night
        self.InstData = InstData
        # self.tel_ids = self.InstData.get_inst_ids()
        self.tel_ids = self.InstData.get_inst_ids(inst_types=['LST', 'MST', 'SST'])

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(name=self.class_name, log=self.log)

        self.debug = not True
        self.expire = 86400  # one day
        # self.expire = 5

        self.MockSched = None

        # self.client = PySimpleClient()
        # self.supervisor = self.client.getComponent("ArraySupervisor")
        # self.log.info([['y'," - ObsBlocks - "],['p','got supervisor!']])

        self.phases_exe = dict()
        self.phases_exe["start"] = [
            "run_config_mount", "run_config_camera", "run_config_daq", "run_config_mirror"
        ]
        self.phases_exe["during"] = ["run_take_data"]
        self.phases_exe["finish"] = [
            "run_finish_mount", "run_finish_camera", "run_finish_daq"
        ]

        self.loop_sleep = 3

        rnd_seed = getTime()
        # rnd_seed = 10987268332
        self.rnd_gen = Random(rnd_seed)

        gevent.spawn(self.loop)

        self.MockSched = MockSched(site_type=site_type, time_of_night=self.time_of_night)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def reset_blocks(self):
        debug_tmp = not True
        if debug_tmp:
            self.log.info([['p', " - ObsBlocks.reset_blocks() ..."]])

        if self.MockSched is None:
            sleep(0.5)
            self.log.debug([[
                'r', " - no MockSched ... will try to reset_blocks() again ..."
            ]])
            self.reset_blocks()
            return

        schBlocks = self.MockSched.get_blocks()

        obs_block_ids = dict()
        obs_block_ids['wait'] = []
        obs_block_ids['run'] = []
        obs_block_ids['done'] = []
        obs_block_ids['cancel'] = []
        obs_block_ids['fail'] = []

        blocks_run = []
        active = schBlocks['active']

        for sched_blk_id, schBlock in schBlocks['blocks'].iteritems():

            sub_array_tels = schBlock['sched_block'].config.instrument.sub_array.telescopes
            tel_ids = [x.id for x in sub_array_tels]

            obs_blocks = schBlock['sched_block'].observation_blocks

            for n_obs_block_now in range(len(obs_blocks)):
                obs_block_now = obs_blocks[n_obs_block_now]
                obs_block_id = obs_block_now.id
                trg_id = obs_block_now.src.id
                coords = obs_block_now.src.coords.horizontal
                target_pos = [coords.az, coords.alt]

                # obs_block_json = jsonAcs.encode(obs_block_now)

                timestamp = schBlocks['metadata'][obs_block_id]["timestamp"]
                metadata = schBlocks['metadata'][obs_block_id]["metadata"]

                point_pos = schBlocks['metadata'][obs_block_id]["point_pos"]
                status = schBlocks['metadata'][obs_block_id]["status"]
                phases = schBlocks['metadata'][obs_block_id]["phases"]
                duration = schBlocks['metadata'][obs_block_id]["duration"]
                start_time_plan = schBlocks['metadata'][obs_block_id]["start_time_plan"]
                start_time_exe = schBlocks['metadata'][obs_block_id]["start_time_exe"]

                start_time = start_time_plan if start_time_exe is None else start_time_exe

                if target_pos[0] > 180:
                    target_pos[0] -= 360
                if target_pos[0] < -180:
                    target_pos[0] += 360
                if point_pos[0] > 180:
                    point_pos[0] -= 360
                if point_pos[0] < -180:
                    point_pos[0] += 360

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

                # if debug_tmp:
                #     for p in phases:
                #         self.log.debug([
                #             ['y', " -- phases - ", sched_blk_id, ' ', obs_block_id, ' '],
                #             ['p', status, ' '],
                #             [
                #                 'g', p.heartbeat_counter, ' ', p.name,
                #                 ' ', p.status, ' ', p.progress_message
                #             ]
                #         ])

                run_phase = []
                if state == 'run':
                    for p in phases:
                        if p.status == sb.OB_RUNNING:
                            phaseName = 'run_' + p.name
                            for phases_exe in self.phases_exe:
                                if phaseName in self.phases_exe[phases_exe]:
                                    run_phase.append(phaseName)

                    if debug_tmp:
                        self.log.debug([['b', " -- run_phase - "], ['y', run_phase, ' '],
                                        ['b', tel_ids]])

                can_run = True
                if state == 'cancel' or state == 'fail':
                    can_run = (self.time_of_night.get_current_time() >= start_time)

                exe_state = {'state': state, 'can_run': can_run}

                # if not can_run or state == 'cancel' or state == 'fail':
                #     print 'cant run:', can_run, sched_blk_id, obs_block_id, state, [
                #         self.time_of_night.get_current_time(), start_time]

                block = dict()
                block["sched_block_id"] = sched_blk_id
                block["obs_block_id"] = obs_block_id
                block["metadata"] = metadata
                block["timestamp"] = timestamp
                block["start_time"] = start_time
                block["end_time"] = start_time + duration
                block["duration"] = duration
                block["tel_ids"] = tel_ids
                block["target_id"] = trg_id
                block["target_name"] = trg_id
                block["target_pos"] = target_pos
                block["point_id"] = sched_blk_id + "_" + obs_block_id
                block["pointing_name"] = block["target_name"] + \
                    "/p_"+str(n_obs_block_now)
                block["pointing_pos"] = point_pos
                block["exe_state"] = exe_state
                block["run_phase"] = run_phase
                # block["fullObsBlock"] = obs_block_json

                if state == 'run':
                    blocks_run += [block]

                obs_block_ids[state].append(obs_block_id)

                self.redis.pipe.set(
                    name=obs_block_id, data=block, expire=self.expire, packed=True
                )

        self.redis.pipe.set(
            name='obs_block_ids_' + 'wait', data=obs_block_ids['wait'], packed=True
        )
        self.redis.pipe.set(
            name='obs_block_ids_' + 'run', data=obs_block_ids['run'], packed=True
        )
        self.redis.pipe.set(
            name='obs_block_ids_' + 'done', data=obs_block_ids['done'], packed=True
        )
        self.redis.pipe.set(
            name='obs_block_ids_' + 'cancel', data=obs_block_ids['cancel'], packed=True
        )
        self.redis.pipe.set(
            name='obs_block_ids_' + 'fail', data=obs_block_ids['fail'], packed=True
        )

        self.redis.pipe.execute()

        self.update_sub_arrs(blocks=blocks_run)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_sub_arrs(self, blocks=None):
        # inst_pos = self.redis.hGetAll(name="inst_pos")

        if blocks is None:
            obs_block_ids = self.redis.get(
                name=('obs_block_ids_' + 'run'), packed=True, default_val=[]
            )
            for obs_block_id in obs_block_ids:
                self.redis.pipe.get(obs_block_id)

            blocks = self.redis.pipe.execute(packed=True)

        # sort so last is first in the list (latest sub-array defined gets the telescope)
        blocks = sorted(
            blocks, cmp=lambda a, b: int(b['timestamp']) - int(a['timestamp'])
        )
        # print [a['timestamp'] for a in blocks]

        sub_arrs = []
        all_tel_ids_in = []
        for n_block in range(len(blocks)):
            block_tel_ids = blocks[n_block]["tel_ids"]
            pnt_id = blocks[n_block]["point_id"]
            pointing_name = blocks[n_block]["pointing_name"]

            # compile the telescope list for this block
            tels = []
            for id_now in block_tel_ids:
                if id_now not in all_tel_ids_in:
                    all_tel_ids_in.append(id_now)
                    tels.append({"id": id_now})

            # add the telescope list for this block
            sub_arrs.append({"id": pnt_id, "N": pointing_name, "children": tels})

        # ------------------------------------------------------------------
        # now take care of all free telescopes
        # ------------------------------------------------------------------
        tels = []
        all_tel_ids = [x for x in self.tel_ids if x not in all_tel_ids_in]
        for id_now in all_tel_ids:
            tels.append({"id": id_now})

        sub_arrs.append({"id": no_sub_arr_name, "children": tels})

        # ------------------------------------------------------------------
        # for now - a simple/stupid solution, where we write the sub-arrays and publish each
        # time, even if the content is actually the same ...
        # ------------------------------------------------------------------
        self.redis.set(name='sub_arrs', data=sub_arrs, packed=True)
        self.redis.publish(channel="sub_arrs")

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting ObsBlocks.loop ..."]])

        self.redis.pipe.set(name='obs_block_ids_' + 'wait', data='')
        self.redis.pipe.set(name='obs_block_ids_' + 'run', data='')
        self.redis.pipe.set(name='obs_block_ids_' + 'done', data='')
        self.redis.pipe.set(name='obs_block_ids_' + 'cancel', data='')
        self.redis.pipe.set(name='obs_block_ids_' + 'fail', data='')

        self.redis.pipe.execute()

        self.update_sub_arrs(blocks=[])

        while True:
            self.reset_blocks()

            sleep(self.loop_sleep)

        return


# ------------------------------------------------------------------
# ------------------------------------------------------------------
# ------------------------------------------------------------------
class ObsBlocksNoACS():
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, site_type, time_of_night, InstData):
        self.log = my_log(title=__name__)
        self.log.info([['y', " - ObsBlocksNoACS - "], ['g', site_type]])

        self.site_type = site_type
        self.time_of_night = time_of_night
        self.InstData = InstData
        # self.tel_ids = self.InstData.get_inst_ids()
        self.tel_ids = self.InstData.get_inst_ids(inst_types=['LST', 'MST', 'SST'])

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(name=self.class_name, log=self.log)

        self.debug = not True
        self.expire = 86400  # one day
        # self.expire = 5

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        self.max_n_obs_block = 4 if self.site_type == "N" else 7
        self.max_n_obs_block = min(self.max_n_obs_block, floor(len(self.tel_ids) / 4))
        self.loop_sleep = 4

        self.max_n_cycles = 100
        self.min_n_sched_block = 2  # 2
        self.max_n_sched_block = 5  # 5
        self.min_n_obs_block = 1
        self.max_n_obs_block = 5
        self.min_n_tel_block = 4
        self.max_n_free_tels = 5

        self.n_init_cycle = -1
        self.name_prefix = str(getTime())
        if len(self.name_prefix) > 6:
            self.name_prefix = self.name_prefix[len(self.name_prefix) - 6:]

        self.az_min_max = [-180, 180]
        self.zen_min_max_tel = [0, 70]
        self.zen_min_max_pnt = [0, 20]

        self.phases_exe = dict()
        self.phases_exe["start"] = [
            "run_config_mount", "run_config_camera", "run_config_DAQ", "run_config_mirror"
        ]
        self.phases_exe["during"] = ["run_take_data"]
        self.phases_exe["finish"] = [
            "run_finish_mount", "run_finish_camera", "run_finish_cleanup"
        ]

        self.error_rnd_frac = dict()
        self.error_rnd_frac["E1"] = 0.3
        self.error_rnd_frac["E2"] = 0.4
        self.error_rnd_frac["E3"] = 0.5
        self.error_rnd_frac["E4"] = 0.6
        self.error_rnd_frac["E5"] = 0.7
        self.error_rnd_frac["E6"] = 0.8
        self.error_rnd_frac["E7"] = 0.9
        self.error_rnd_frac["E8"] = 1

        self.phase_rnd_frac = dict()
        self.phase_rnd_frac["start"] = 0.29
        self.phase_rnd_frac["finish"] = 0.1
        self.phase_rnd_frac["cancel"] = 0.06
        self.phase_rnd_frac["fail"] = 0.1
        self.loop_sleep = 2

        self.obs_block_seconds = 1800  # timedelta(weeks = 0, days = 0, hours = 0, minutes = 30 * self.time_of_night.get_timescale(), seconds = 0, milliseconds = 0, microseconds = 0)  # 1800 = 30 minutes

        self.time_of_night.reset_night()
        # self.duration_scale = self.time_of_night.get_timescale() #  0.035 -> one
        # minute instead of 30 for gui testing
        self.duration_night = self.time_of_night.get_total_time_seconds(
        )  # 28800 -> 8 hour night
        self.prev_reset_time = self.time_of_night.get_reset_time()

        rnd_seed = getTime()
        # rnd_seed = 10987268332
        self.rnd_gen = Random(rnd_seed)

        self.external_clock_events = []
        self.external_generate_clock_events()

        self.redis.pipe.delete('obs_block_update')

        self.init()

        gevent.spawn(self.loop)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init(self):
        self.log.info([['p', " - ObsBlocksNoACS.init() ..."]])
        debug_tmp = not True

        self.exe_phase = dict()
        self.all_obs_blocks = []
        self.external_events = []

        self.time_of_night.reset_night()
        self.prev_reset_time = self.time_of_night.get_reset_time()
        # start_time = self.time_of_night.get_start_time()
        self.n_init_cycle += 1

        is_cycle_done = False
        n_cycle_now = 0
        n_sched_blocks = -1
        tot_block_seconds = 0
        max_block_seconds = self.duration_night - self.obs_block_seconds
        overhead_seconds = self.obs_block_seconds * 0.05  # timedelta(seconds = 90 * 0.05 * self.time_of_night.get_timescale()) # self.obs_block_seconds * 0.05

        target_ids = self.redis.get(name='target_ids', packed=True, default_val=[])
        # for obs_block_id in obs_block_ids:
        #     self.redis.pipe.get(obs_block_id)

        while tot_block_seconds < max_block_seconds and \
                n_cycle_now < self.max_n_cycles and \
                not is_cycle_done:

            base_name = self.name_prefix+"_" + \
                str(self.n_init_cycle)+"_"+str(n_cycle_now)+"_"
            n_cycle_now += 1

            tel_ids = copy.deepcopy(self.tel_ids)
            n_tels = len(tel_ids)
            # choose number of Scheduling blocks for this part of night (while loop)-----------------------------------------------------
            n_sched_blocks = min(
                floor(n_tels / self.min_n_tel_block), self.max_n_sched_block
            )
            n_sched_blocks = max(
                self.rnd_gen.randint(1, n_sched_blocks), self.min_n_sched_block
            )
            # ---------------------------------------------------------------------
            if debug_tmp:
                print '-------------------------------------------------------------------------'
                print(
                    '- n_cycle_now', n_cycle_now, 'tot_block_seconds / percentage:',
                    tot_block_seconds, (tot_block_seconds / self.duration_night)
                )

            target_pos = dict()

            tot_sched_block_seconds = []

            # ------------------------------------------------------------------
            #
            # ------------------------------------------------------------------
            for n_sched_block_now in range(n_sched_blocks):
                sched_block_id = "schBlock_" + base_name + str(n_sched_block_now)

                n_sched_blocks += 1

                if n_sched_block_now < n_sched_blocks - 1:
                    n_tel_now = max(self.min_n_tel_block, len(tel_ids) - n_sched_blocks)
                    n_tel_now = self.rnd_gen.randint(self.min_n_tel_block, n_tel_now)
                    n_tel_now = min(n_tel_now, len(tel_ids))
                else:
                    n_tel_now = len(tel_ids) - \
                        self.rnd_gen.randint(0, self.max_n_free_tels)
                if n_tel_now < self.min_n_tel_block:
                    continue

                # choose some tels in available ones
                sched_tel_ids = random.sample(tel_ids, n_tel_now)
                # and remove them from allTels list
                tel_ids = [x for x in tel_ids if x not in sched_tel_ids]
                # choose the number of obs blocks inside this sched_blocks
                n_obs_blocks = self.rnd_gen.randint(
                    self.min_n_obs_block, self.max_n_obs_block
                )

                # n_trg = n_sched_block_now
                #
                # if not n_trg in target_pos:
                #     target_pos[n_trg] = [
                #         (self.rnd_gen.random() *
                #          (self.az_min_max[1] - self.az_min_max[0])) + self.az_min_max[0],
                #         (self.rnd_gen.random(
                #         ) * (self.zen_min_max_tel[1] - self.zen_min_max_tel[0])) + self.zen_min_max_tel[0]
                #     ]

                if debug_tmp:
                    print ' -- n_sched_block_now / n_tel_now:', n_sched_block_now, n_tel_now, '-------', sched_block_id

                tot_obs_block_seconds = 0
                obs_block_duration = tot_block_seconds

                n_rnd_targets = max(1, int(self.rnd_gen.random() * 3))
                target_ids_now = []
                targets = []
                for z in range(n_rnd_targets):
                    n_id = (
                        obs_block_duration / (self.duration_night / len(target_ids))
                    ) + 0.75
                    n_id = int(n_id + ((self.rnd_gen.random() - 0.5) * 3))
                    n_id = min(max(0, n_id), len(target_ids) - 1)
                    if not (target_ids[n_id] in target_ids_now):
                        target_ids_now.append(target_ids[n_id])
                        targets.append(
                            self.redis.get(
                                name=target_ids[n_id], packed=True, default_val={}
                            )
                        )

                for n_obs_now in range(n_obs_blocks):
                    obs_block_id = "obs_block_"+base_name + \
                        str(n_sched_block_now)+"_"+str(n_obs_now)

                    self.exe_phase[obs_block_id] = ""

                    rnd = self.rnd_gen.random()
                    obs_block_seconds = self.obs_block_seconds
                    if rnd < 0.05:
                        obs_block_seconds /= 1.8
                    elif rnd < 0.3:
                        obs_block_seconds /= 1.5
                    elif rnd < 0.5:
                        obs_block_seconds /= 1.1
                    obs_block_seconds = int(
                        floor(obs_block_seconds)
                    )  # timedelta(seconds = obs_block_seconds)

                    if obs_block_duration + obs_block_seconds > self.duration_night:
                        is_cycle_done = True
                        if debug_tmp:
                            print(
                                ' - is_cycle_done - n_obs_now / start_time / duration:',
                                n_obs_now, obs_block_duration, obs_block_seconds
                            )
                        break

                    # integrated time for all obs blocks within this sched block
                    tot_obs_block_seconds += obs_block_seconds

                    pointings = []
                    n_rnd_divs = max(1, int(self.rnd_gen.random() * 5))
                    all_tel_ids = copy.deepcopy(sched_tel_ids)
                    for z in range(n_rnd_divs):
                        trg = targets[max(0, int(self.rnd_gen.random() * len(targets)))]
                        pnt = {
                            'id': sched_block_id + "_" + obs_block_id,
                            'name': trg["name"] + "/p_" + str(n_obs_now) + "-" + str(z)
                        }

                        point_pos = copy.deepcopy(trg["pos"])
                        point_pos[0] += (self.rnd_gen.random() - 0.5) * 10
                        point_pos[1] += (self.rnd_gen.random() - 0.5) * 10

                        if point_pos[0] > self.az_min_max[1]:
                            point_pos[0] -= 360
                        elif point_pos[0] < self.az_min_max[0]:
                            point_pos[0] += 360
                        pnt['pos'] = point_pos
                        pointings.append(pnt)
                        rnd_tels = random.sample(
                            all_tel_ids, int(len(sched_tel_ids) / n_rnd_divs)
                        )
                        if z == n_rnd_divs - 1:
                            rnd_tels = all_tel_ids
                        # and remove them from allTels list
                        all_tel_ids = [x for x in all_tel_ids if x not in rnd_tels]
                        pnt['tel_ids'] = rnd_tels

                    if debug_tmp:
                        print ' --- n_obs_now / start_time / duration:', \
                            n_obs_now, obs_block_duration, obs_block_seconds, '-------', obs_block_id

                    # exe_state = {'state': "wait", 'can_run': True}
                    # metadata = {'n_sched': n_sched_blocks, 'n_obs': n_obs_now,
                    #             'block_name': str(n_sched_blocks)+" ("+str(n_obs_now)+")"}
                    # block = dict()
                    # block["sched_block_id"] = sched_block_id
                    # block["obs_block_id"] = obs_block_id
                    # block["metadata"] = metadata
                    # block["timestamp"] = getTime()
                    # block["tel_ids"] = sched_tel_ids
                    # # block["start_time"] = obs_block_duration.strftime("%Y-%m-%d %H:%M:%S")
                    # # block["duration"] = (obs_block_seconds-overhead_seconds).total_seconds()
                    # # block["end_time"] = (obs_block_duration+(obs_block_seconds-overhead_seconds)).strftime("%Y-%m-%d %H:%M:%S")
                    # block["start_time"] = obs_block_duration
                    # block["duration"] = obs_block_seconds-overhead_seconds
                    # block["end_time"] = block["start_time"]+block["duration"]
                    # block["exe_state"] = exe_state
                    # block["run_phase"] = []
                    # block["target_id"] = target_id
                    # block["target_name"] = target_id
                    # block["target_pos"] = target["pos"]
                    # block["point_id"] = sched_block_id+"_"+obs_block_id
                    # block["pointing_name"] = block["target_name"] + \
                    #     "/p_"+str(n_obs_now)
                    # block["pointing_pos"] = point_pos

                    time = {
                        'start': obs_block_duration,
                        'duration': obs_block_seconds - overhead_seconds,
                        'end': obs_block_duration + obs_block_seconds - overhead_seconds
                    }
                    exe_state = {'state': "wait", 'can_run': True}
                    metadata = {
                        'n_sched': n_sched_blocks,
                        'n_obs': n_obs_now,
                        'block_name': str(n_sched_blocks) + " (" + str(n_obs_now) + ")"
                    }
                    # min int(len(filter(lambda x: 'L' in x, sched_tel_ids)) / 3)
                    telescopes = {
                        'large': {
                            'min':
                            int(len(filter(lambda x: 'L' in x, sched_tel_ids)) / 2),
                            'max': 4,
                            'ids': filter(lambda x: 'L' in x, sched_tel_ids)
                        },
                        'medium': {
                            'min':
                            int(len(filter(lambda x: 'M' in x, sched_tel_ids)) / 2),
                            'max': 25,
                            'ids': filter(lambda x: 'M' in x, sched_tel_ids)
                        },
                        'small': {
                            'min':
                            int(len(filter(lambda x: 'S' in x, sched_tel_ids)) / 2),
                            'max': 70,
                            'ids': filter(lambda x: 'S' in x, sched_tel_ids)
                        }
                    }
                    block = dict()
                    block["sched_block_id"] = sched_block_id
                    block["obs_block_id"] = obs_block_id
                    block["time"] = time
                    block["metadata"] = metadata
                    block["timestamp"] = getTime()
                    block["telescopes"] = telescopes
                    block["exe_state"] = exe_state
                    block["run_phase"] = []
                    block["targets"] = targets
                    block["pointings"] = pointings
                    block["tel_ids"] = sched_tel_ids
                    # block["start_time"] = obs_block_duration.strftime("%Y-%m-%d %H:%M:%S")
                    # block["duration"] = (obs_block_seconds-overhead_seconds).total_seconds()
                    # block["end_time"] = (obs_block_duration+(obs_block_seconds-overhead_seconds)).strftime("%Y-%m-%d %H:%M:%S")
                    # block["start_time"] = obs_block_duration
                    # block["duration"] = obs_block_seconds-overhead_seconds
                    # block["end_time"] = block["start_time"]+block["duration"]
                    # block["target_id"] = target_id
                    # block["target_name"] = target_id
                    # block["target_pos"] = target["pos"]
                    # block["point_id"] = sched_block_id+"_"+obs_block_id
                    # block["pointing_name"] = block["target_name"] + \
                    #     "/p_"+str(n_obs_now)
                    # block["pointing_pos"] = point_pos
                    # block["fullObsBlock"] = self.get_obs_block_template()
                    self.redis.pipe.set(
                        name=block["obs_block_id"],
                        data=block,
                        expire=self.expire,
                        packed=True
                    )

                    self.all_obs_blocks.append(block)

                    obs_block_duration += obs_block_seconds

                # list of duration of all sched blocks within this cycle
                if tot_obs_block_seconds > 0:  # timedelta(seconds = 0):
                    tot_sched_block_seconds += [tot_obs_block_seconds]
            # ------------------------------------------------------------------

            # the maximal duration of all blocks within this cycle
            tot_block_seconds += max(tot_sched_block_seconds)

        self.redis.pipe.set(
            name="external_events", data=self.external_events, packed=True
        )
        self.redis.pipe.set(
            name="external_clock_events", data=self.external_clock_events, packed=True
        )

        self.redis.pipe.execute()

        self.update_exe_statuses()

        return

    # ------------------------------------------------------------------
    # temporary hardcoded dict......
    # ------------------------------------------------------------------

    def get_obs_block_template(self):
        # generated with:
        #   print jsonAcs.encode(jsonAcs.classFactory.defaultValues[sb.ObservationBlock])

        template = {
            "py/object": "sb.ObservationBlock",
            "src": {
                "py/object": "sb.Source",
                "proposal_priority": {
                    "py/object": "sb.High"
                },
                "proposal_type": {
                    "py/object": "sb.placeholder"
                },
                "region_of_interest": {
                    "py/object": "sb.RegionOfInterest",
                    "circle_radius": 100
                },
                "coords": {
                    "py/object": "sb.Coordinates",
                    "equatorial": {
                        "py/object": "sb.EquatorialCoordinates",
                        "dec": 4,
                        "ra": 2
                    }
                },
                "id": "source",
                "observing_mode": {
                    "py/object": "sb.ObservingMode",
                    "slewing_": {
                        "py/object": "sb.Slewing",
                        "take_data": 1
                    },
                    "observing_type": {
                        "py/object": "sb.ObservingType",
                        "wobble_": {
                            "py/object": "sb.Wobble",
                            "angle": 1,
                            "offset": 1
                        }
                    }
                }
            },
            "observing_conditions": {
                "py/object": "sb.ObservingConditions",
                "quality_": {
                    "py/object": "sb.Quality",
                    "illumination": 1,
                    "min_nsb_range": 1,
                    "max_nsb_range": 1
                },
                "start_time": {
                    "py/object": "sb.DateTime",
                    "placeholder": 1
                },
                "weather_": {
                    "py/object": "sb.Weather",
                    "wind_speed": 1,
                    "precision_pointing": 1,
                    "cloudiness": 1,
                    "humidity": 1
                },
                "duration": 0,
                "tolerance": 1
            },
            "max_script_duration": 0,
            "script_id": "script_id",
            "id": "ob_id"
        }

        return template

    # ------------------------------------------------------------------
    # move one from wait to run
    # ------------------------------------------------------------------

    def wait_to_run(self):
        time_now = self.time_of_night.get_current_time()

        # move to run state
        # ------------------------------------------------------------------
        wait_blocks = [
            x for x in self.all_obs_blocks if x['exe_state']['state'] == 'wait'
        ]

        has_change = False
        for block in wait_blocks:
            if time_now < block["time"][
                    "start"
            ] - self.loop_sleep:  # datetime.strptime(block["start_time"], "%Y-%m-%d %H:%M:%S"): # - deltatime(self.loop_sleep):
                continue

            block['exe_state']['state'] = "run"

            self.exe_phase[block["obs_block_id"]] = "start"
            block['run_phase'] = copy.deepcopy(self.phases_exe["start"])

            has_change = True
            self.redis.pipe.set(
                name=block["obs_block_id"], data=block, expire=self.expire, packed=True
            )

        if has_change:
            self.redis.pipe.execute()

            # ------------------------------------------------------------------
            # check for blocks which cant begin as their time is already past
            # ------------------------------------------------------------------
            wait_blocks = [
                x for x in self.all_obs_blocks if x['exe_state']['state'] == 'wait'
            ]

            has_change = False
            for block in wait_blocks:
                # # adjust the starting/ending time
                # block["end_time"] = block["start_time"] + block["duration"]

                if time_now >= block["time"]["end"] or (
                        self.rnd_gen.random() < self.phase_rnd_frac["cancel"] * 0.1
                ):  # datetime.strptime(block["end_time"], "%Y-%m-%d %H:%M:%S") or (self.rnd_gen.random() < self.phase_rnd_frac["cancel"] * 0.1):
                    block['exe_state']['state'] = "cancel"
                    if self.rnd_gen.random() < self.error_rnd_frac["E1"]:
                        block['exe_state']['error'] = "E1"
                    elif self.rnd_gen.random() < self.error_rnd_frac["E2"]:
                        block['exe_state']['error'] = "E2"
                    elif self.rnd_gen.random() < self.error_rnd_frac["E3"]:
                        block['exe_state']['error'] = "E3"
                    elif self.rnd_gen.random() < self.error_rnd_frac["E4"]:
                        block['exe_state']['error'] = "E4"
                    elif self.rnd_gen.random() < self.error_rnd_frac["E8"]:
                        block['exe_state']['error'] = "E8"
                    block['exe_state']['can_run'] = False
                    block['run_phase'] = []

                    self.exe_phase[block["obs_block_id"]] = ""

                    has_change = True
                    self.redis.pipe.set(
                        name=block["obs_block_id"],
                        data=block,
                        expire=self.expire,
                        packed=True
                    )

            if has_change:
                self.redis.pipe.execute()

        return

    # ------------------------------------------------------------------
    # progress run phases
    # ------------------------------------------------------------------
    def run_phases(self):
        time_now = self.time_of_night.get_current_time()

        # runs = [ x for x in self.all_obs_blocks if self.exe_phase[x["obs_block_id"]] != "" ]
        # print [ x['obs_block_id'] for x in runs]
        # if len(runs) == 0:
        #   return

        # # runs = [ x for x in self.all_obs_blocks if x['exe_state']['state'] == 'run' ]
        # # nDone = 0
        # # for block in runs:
        # #   if self.exe_phase[block["obs_block_id"]] == "":
        # #     nDone += 1
        # # if nDone == len(runs):
        # #   return

        runs = [x for x in self.all_obs_blocks if x['exe_state']['state'] == 'run']

        has_change = False
        for block in runs:
            phase = self.exe_phase[block["obs_block_id"]]
            if phase == "":
                continue

            for phaseNow in self.phases_exe[phase]:
                if phaseNow in block['run_phase']:

                    if phaseNow in self.phases_exe['start']:
                        is_done = (self.rnd_gen.random() < self.phase_rnd_frac['start'])
                        # if is_done:
                        #   block["end_time"] = block["start_time"] + block["duration"]

                    elif phaseNow in self.phases_exe["during"]:
                        is_done = (
                            time_now >= (
                                block["time"]["end"] -
                                block["time"]["duration"] * self.phase_rnd_frac['finish']
                            )
                        )  # (datetime.strptime(block["end_time"], "%Y-%m-%d %H:%M:%S") - timedelta(seconds = int(block["duration"]) * self.phase_rnd_frac['finish'])))

                    else:
                        is_done = (
                            time_now >= block["time"]["end"]
                        )  # is_done = (time_now >= datetime.strptime(block["end_time"], "%Y-%m-%d %H:%M:%S"))

                    if is_done:
                        block['run_phase'].remove(phaseNow)
                    # print is_done,block['run_phase']

            if len(block['run_phase']) == 0:
                nextPhase = ""
                if phase == "start":
                    nextPhase = "during"
                elif phase == "during":
                    nextPhase = "finish"

                if nextPhase in self.phases_exe:
                    block['run_phase'] = copy.deepcopy(self.phases_exe[nextPhase])

                self.exe_phase[block["obs_block_id"]] = nextPhase

            has_change = True
            self.redis.pipe.set(
                name=block["obs_block_id"], data=block, expire=self.expire, packed=True
            )

        if has_change:
            self.redis.pipe.execute()

        return

    # ------------------------------------------------------------------
    # move one from run to done
    # ------------------------------------------------------------------
    def run_to_done(self):
        time_now = self.time_of_night.get_current_time()

        runs = [x for x in self.all_obs_blocks if x['exe_state']['state'] == 'run']

        has_change = False
        for block in runs:
            if time_now < block["time"][
                    "end"
            ]:  #time_now < datetime.strptime(block["end_time"], "%Y-%m-%d %H:%M:%S"):
                continue

            if self.rnd_gen.random() < self.phase_rnd_frac["cancel"]:
                block['exe_state']['state'] = "cancel"
                if self.rnd_gen.random() < self.error_rnd_frac["E1"]:
                    block['exe_state']['error'] = "E1"
                elif self.rnd_gen.random() < self.error_rnd_frac["E2"]:
                    block['exe_state']['error'] = "E2"
                elif self.rnd_gen.random() < self.error_rnd_frac["E3"]:
                    block['exe_state']['error'] = "E3"
                elif self.rnd_gen.random() < self.error_rnd_frac["E4"]:
                    block['exe_state']['error'] = "E4"
                elif self.rnd_gen.random() < self.error_rnd_frac["E8"]:
                    block['exe_state']['error'] = "E8"
            elif self.rnd_gen.random() < self.phase_rnd_frac["fail"]:
                block['exe_state']['state'] = "fail"
                if self.rnd_gen.random() < self.error_rnd_frac["E1"]:
                    block['exe_state']['error'] = "E1"
                elif self.rnd_gen.random() < self.error_rnd_frac["E2"]:
                    block['exe_state']['error'] = "E2"
                elif self.rnd_gen.random() < self.error_rnd_frac["E3"]:
                    block['exe_state']['error'] = "E3"
                elif self.rnd_gen.random() < self.error_rnd_frac["E4"]:
                    block['exe_state']['error'] = "E4"
                elif self.rnd_gen.random() < self.error_rnd_frac["E8"]:
                    block['exe_state']['error'] = "E8"
            else:
                block['exe_state']['state'] = "done"

            block['run_phase'] = []

            has_change = True
            self.redis.pipe.set(
                name=block["obs_block_id"], data=block, expire=self.expire, packed=True
            )

            self.exe_phase[block["obs_block_id"]] = ""

        if has_change:
            self.redis.pipe.execute()

        return

    # ------------------------------------------------------------------
    # update the exeStatus lists in redis
    # ------------------------------------------------------------------
    def update_exe_statuses(self):
        blocks_run = []
        obs_block_ids = {"wait": [], "run": [], "done": [], "cancel": [], "fail": []}

        for block in self.all_obs_blocks:
            obs_block_id = block['obs_block_id']
            exe_state = block['exe_state']['state']

            if self.redis.exists(obs_block_id):
                obs_block_ids[exe_state].append(obs_block_id)

                if exe_state == "run":
                    blocks_run += [block]

        for key, val in obs_block_ids.iteritems():
            self.redis.pipe.set(name='obs_block_ids_' + key, data=val, packed=True)

        self.redis.pipe.execute()

        self.update_sub_arrs(blocks_run)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_sub_arrs(self, blocks=None):
        # inst_pos = self.redis.hGetAll(name="inst_pos")

        if blocks is None:
            obs_block_ids = self.redis.get(
                name=('obs_block_ids_' + 'run'), packed=True, default_val=[]
            )
            for obs_block_id in obs_block_ids:
                self.redis.pipe.get(obs_block_id)

            blocks = self.redis.pipe.execute(packed=True)

        #
        sub_arrs = []
        all_tel_ids = copy.deepcopy(self.tel_ids)

        for n_block in range(len(blocks)):
            block_tel_ids = blocks[n_block]["telescopes"]["large"]["ids"] + blocks[
                n_block]["telescopes"]["medium"]["ids"] + blocks[n_block]["telescopes"][
                    "small"]["ids"]
            pnt_id = blocks[n_block]["pointings"][0]["id"]
            pointing_name = blocks[n_block]["pointings"][0]["name"]

            # compile the telescope list for this block
            tels = []
            for id_now in block_tel_ids:
                tels.append({"id": id_now})

                if id_now in all_tel_ids:
                    all_tel_ids.remove(id_now)

            # add the telescope list for this block
            sub_arrs.append({"id": pnt_id, "N": pointing_name, "children": tels})

        # ------------------------------------------------------------------
        # now take care of all free telescopes
        # ------------------------------------------------------------------
        tels = []
        for id_now in all_tel_ids:
            tels.append({"id": id_now})

        sub_arrs.append({"id": no_sub_arr_name, "children": tels})

        # ------------------------------------------------------------------
        # for now - a simple/stupid solution, where we write the sub-arrays and publish each
        # time, even if the content is actually the same ...
        # ------------------------------------------------------------------
        self.redis.set(name='sub_arrs', data=sub_arrs, packed=True)
        self.redis.publish(channel="sub_arrs")

        return

    def external_generate_events(self):
        if self.rnd_gen.random() < 0.001:
            new_event = {
                'id': getTime() + random.randint(1, 99999),
                'start_time': self.time_of_night.get_current_time()
            }
            new_event['priority'] = random.randint(1, 3)
            if self.rnd_gen.random() < 0.1:
                new_event['name'] = 'alarm'
                new_event['icon'] = 'alarm.svg'
            elif self.rnd_gen.random() < 0.3:
                new_event['name'] = 'grb'
                new_event['icon'] = 'grb.svg'
            elif self.rnd_gen.random() < 0.5:
                new_event['name'] = 'hardware'
                new_event['icon'] = 'hardwareBreak.svg'
            elif self.rnd_gen.random() < 0.7:
                new_event['name'] = 'moon'
                new_event['icon'] = 'moon.svg'
            elif self.rnd_gen.random() < 1:
                new_event['name'] = 'sun'
                new_event['icon'] = 'sun.svg'
            # elif self.rnd_gen.random() < 0.6:
            #     new_event['name'] = 'dolphin'
            #     new_event['icon'] = 'dolphin.svg'
            # elif self.rnd_gen.random() < 0.8:
            #     new_event['name'] = 'eagle'
            #     new_event['icon'] = 'eagle.svg'
            # elif self.rnd_gen.random() < 1:
            #     new_event['name'] = 'chicken'
            #     new_event['icon'] = 'chicken.svg'
            self.external_events.append(new_event)
        self.redis.pipe.set(
            name="external_events", data=self.external_events, packed=True
        )

    def external_generate_clock_events(self):
        new_event = {}
        new_event['start_date'] = datetime(2018, 9, 16, 21,
                                           42).strftime("%Y-%m-%d %H:%M:%S")
        new_event['end_date'] = ''
        new_event['icon'] = 'moon.svg'
        new_event['name'] = 'Moonrise'
        new_event['comment'] = ''
        new_event['id'] = 'CE' + str(self.rnd_gen.randint(0, 100000000))
        self.external_clock_events.append(new_event)

        new_event = {}
        new_event['start_date'] = datetime(2018, 9, 16, 23,
                                           07).strftime("%Y-%m-%d %H:%M:%S")
        new_event['end_date'] = datetime(2018, 9, 17, 4, 30).strftime("%Y-%m-%d %H:%M:%S")
        new_event['icon'] = 'rain.svg'
        new_event['name'] = 'Raining'
        new_event['comment'] = ''
        new_event['id'] = 'CE' + str(self.rnd_gen.randint(0, 100000000))
        self.external_clock_events.append(new_event)

        new_event = {}
        new_event['start_date'] = datetime(2018, 9, 17, 1,
                                           03).strftime("%Y-%m-%d %H:%M:%S")
        new_event['end_date'] = datetime(2018, 9, 17, 2, 00).strftime("%Y-%m-%d %H:%M:%S")
        new_event['icon'] = 'storm.svg'
        new_event['name'] = 'Storm'
        new_event['comment'] = ''
        new_event['id'] = 'CE' + str(self.rnd_gen.randint(0, 100000000))
        self.external_clock_events.append(new_event)

        new_event = {}
        new_event['start_date'] = datetime(2018, 9, 17, 1,
                                           28).strftime("%Y-%m-%d %H:%M:%S")
        new_event['end_date'] = datetime(2018, 9, 17, 2, 30).strftime("%Y-%m-%d %H:%M:%S")
        new_event['icon'] = 'handshake.svg'
        new_event['name'] = 'Collab'
        new_event['comment'] = ''
        new_event['id'] = 'CE' + str(self.rnd_gen.randint(0, 100000000))
        self.external_clock_events.append(new_event)

        new_event = {}
        new_event['start_date'] = datetime(2018, 9, 17, 5,
                                           21).strftime("%Y-%m-%d %H:%M:%S")
        new_event['end_date'] = ''
        new_event['icon'] = 'sun.svg'
        new_event['name'] = 'Sunrise'
        new_event['comment'] = ''
        new_event['id'] = 'CE' + str(self.rnd_gen.randint(0, 100000000))
        self.external_clock_events.append(new_event)

        self.redis.pipe.set(
            name="external_clock_events", data=self.external_clock_events, packed=True
        )

    def external_add_new_redis_blocks(self):
        if self.redis.exists('obs_block_update'):
            # for key in self.all_obs_blocks[0]:
            #     self.log.info([['g', key, self.all_obs_blocks[0][key]]])
            self.redis.pipe.get('obs_block_update')
            obs_block_update = self.redis.pipe.execute(packed=True)[0]
            # self.log.info([['g', obs_block_update]])
            self.log.info([['g', len(obs_block_update), len(self.all_obs_blocks)]])
            total = 0
            for i in range(len(obs_block_update)):
                if self.redis.exists(obs_block_update[i]["obs_block_id"]):
                    # for x in self.all_obs_blocks:
                    #     if x['obs_block_id'] == obs_block_update[i]['obs_block_id']:
                    #         current = [x][0]

                    current = [
                        x for x in self.all_obs_blocks
                        if x['obs_block_id'] == obs_block_update[i]['obs_block_id']
                    ]
                    if len(current) == 0:
                        current = obs_block_update[i]
                        self.all_obs_blocks.append(current)
                        # for key in obs_block_update[i]:
                        #     self.log.info([['g', key, obs_block_update[i][key]]])
                    else:
                        current = current[0]
                    if current['exe_state']['state'] not in ['wait', 'run']:
                        continue
                    total += 1
                    self.redis.pipe.set(
                        name=obs_block_update[i]["obs_block_id"],
                        data=obs_block_update[i],
                        expire=self.expire,
                        packed=True
                    )
                    current = obs_block_update[i]
                else:
                    self.all_obs_blocks.append(obs_block_update[i])
                    self.redis.pipe.set(
                        name=obs_block_update[i]["obs_block_id"],
                        data=obs_block_update[i],
                        expire=self.expire,
                        packed=True
                    )

            self.update_exe_statuses()
            for block in self.all_obs_blocks:
                exe_state = block['exe_state']['state']

                # self.log.info([['g', block['metadata']['block_name'] + ' ' + exe_state]])

            self.redis.pipe.delete('obs_block_update')
            self.redis.pipe.execute(packed=True)

            self.log.info([['g', total, len(obs_block_update), len(self.all_obs_blocks)]])

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting ObsBlocksNoACS.loop ..."]])
        sleep(2)

        while True:
            if self.time_of_night.get_reset_time() > self.prev_reset_time:
                self.init()
            else:
                self.external_add_new_redis_blocks()
                wait_blocks = [
                    x for x in self.all_obs_blocks if x['exe_state']['state'] == 'wait'
                ]
                runs = [
                    x for x in self.all_obs_blocks if x['exe_state']['state'] == 'run'
                ]
                if len(wait_blocks) + len(runs) == 0:
                    self.init()
                else:
                    self.wait_to_run()
                    self.run_phases()
                    self.run_to_done()
                    self.external_generate_events()

            self.update_exe_statuses()

            sleep(self.loop_sleep)
            # sleep(0.5)

        return


# ------------------------------------------------------------------
