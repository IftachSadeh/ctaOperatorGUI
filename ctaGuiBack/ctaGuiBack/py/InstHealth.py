from math import ceil
import random
from random import Random

from time import sleep
from threading import Lock

from ctaGuiUtils.py.ThreadManager import ThreadManager
from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.utils import flatten_dict
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class InstHealth(ThreadManager):
    is_active = False
    lock = Lock()

    def __init__(self, base_config, interrupt_sig):
        self.log = LogParser(base_config=base_config, title=__name__)
        self.log.info([['y', ' - InstHealth - ']])

        if InstHealth.is_active:
            raise Exception('Can not instantiate InstHealth more than once...')
        else:
            InstHealth.is_active = True

        self.base_config = base_config
        self.site_type = self.base_config.site_type
        self.clock_sim = self.base_config.clock_sim
        self.inst_data = self.base_config.inst_data

        self.interrupt_sig = interrupt_sig

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(
            name=self.class_name, port=self.base_config.redis_port, log=self.log
        )

        self.tel_ids = self.inst_data.get_inst_ids()

        self.inst_health_s0 = dict()
        self.inst_health_s1 = dict()
        self.inst_health_sub = dict()
        self.inst_health_sub_flat = dict()

        # minimum interval of simulation-time to wait before randomising values
        min_wait_update_sec = 10
        self.check_update_opts = {
            'prev_update': None,
            'min_wait': min_wait_update_sec,
        }

        # the fraction of telescopes to randomely update
        self.update_frac = 0.05

        self.inst_data = self.base_config.inst_data
        self.health_tag = self.inst_data.health_tag

        # sleep duration for thread loops
        self.loop_sleep_sec = 1
        # minimal real-time delay between randomisations (once every self.loop_act_rate sec)
        self.loop_act_rate = max(int(5 / self.loop_sleep_sec), 1)

        self.init()
        
        self.setup_threads()

        return

    # ---------------------------------------------------------------------------
    def setup_threads(self):
        self.add_thread(target=self.main_loop)
        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init(self):
        self.log.info([['g', ' - inst_health.init() ...']])
        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        for id_now in self.tel_ids:
            self.inst_health_s0[id_now] = {
                self.health_tag: 100,
                'status': 'run',
                'camera': 100,
                'mirror': 100,
                'mount': 100,
                'daq': 100,
                'aux': 100
            }

            for key, val in self.inst_health_s0[id_now].items():
                self.redis.pipe.h_set(
                    name='inst_health;' + str(id_now), key=key, data=val
                )

            # self.redPipe.hmset('inst_health_s0'+str(id_now), self.inst_health_s0[id_now])

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        self.inst_health_sub = self.inst_data.get_tel_healths()

        # a flat dict with references to each level of the original dict
        self.inst_health_sub_flat = dict()
        for id_now in self.tel_ids:
            self.inst_health_sub_flat[id_now] = flatten_dict(self.inst_health_sub[id_now])

        for id_now in self.tel_ids:
            self.set_tel_health_s1(id_now)

            for key, val in self.inst_health_sub_flat[id_now].items():
                if 'val' in val['data']:
                    self.redis.pipe.h_set(
                        name='inst_health;' + str(id_now),
                        key=key,
                        data=val['data']['val']
                    )

        self.redis.pipe.execute()

        self.rand_once(update_frac=1)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def set_tel_health_s1(self, id_now):
        self.inst_health_s1[id_now] = {
            'id':
            id_now,
            self.health_tag:
            self.inst_health_s0[id_now][self.health_tag],
            'status':
            'run',
            'data': [
                v for (k, v) in self.inst_health_sub[id_now].items()
                # self.inst_health_sub[id_now]['camera'],
                # self.inst_health_sub[id_now]['mirror'],
                # self.inst_health_sub[id_now]['mount'],
                # self.inst_health_sub[id_now]['daq'],
                # self.inst_health_sub[id_now]['aux']
            ]
        }

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def rand_once(self, rnd_seed=-1, update_frac=None):
        ids = self.rand_s0(rnd_seed=rnd_seed, update_frac=update_frac)
        self.rand_s1(tel_id_in=ids, rnd_seed=rnd_seed)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def rand_s0(self, rnd_seed=-1, update_frac=None):
        if rnd_seed < 0:
            rnd_seed = random.randint(0, 100000)
        rnd_gen = Random(rnd_seed)

        arr_props = dict()

        if update_frac is None:
            update_frac = self.update_frac

        rnd_props = [
            'camera',
            'mirror',
            'mount',
            'daq',
            'aux',
            'inst_0',
            'inst_1',
            'prc_0',
            'prc_1',
        ]
        n_rnd_props = len(rnd_props)

        for id_now in self.tel_ids:
            if (rnd_gen.random() > update_frac):
                continue

            arr_props[id_now] = self.inst_health_s0[id_now]

            rnd = rnd_gen.random()
            if rnd < 0.06:
                health_tot = rnd_gen.randint(0, 100)
            elif rnd < 0.1:
                health_tot = rnd_gen.randint(40, 100)
            else:
                health_tot = rnd_gen.randint(60, 100)

            arr_props[id_now][self.health_tag] = health_tot

            bad = 100 - health_tot
            for n_prop_now in range(n_rnd_props):
                rnd = rnd_gen.randint(0, bad)

                if n_prop_now == n_rnd_props - 1:
                    rnd = bad
                else:
                    bad -= rnd

                if rnd_props[n_prop_now] in arr_props[id_now]:
                    arr_props[id_now][rnd_props[n_prop_now]] = 100 - rnd

            self.inst_health_s0[id_now] = arr_props[id_now]

            self.inst_health_s1[id_now][self.health_tag] = health_tot

            for key, val in self.inst_health_s0[id_now].items():
                self.redis.pipe.h_set(
                    name='inst_health;' + str(id_now), key=key, data=val
                )

        self.redis.pipe.execute()

        ids = [id_now for id_now in arr_props]

        return ids

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def rand_s1(self, tel_id_in=None, rnd_seed=-1):
        rnd_props = ['camera', 'mirror', 'mount', 'daq', 'aux', 'inst_0', 'inst_1',]

        if rnd_seed < 0:
            rnd_seed = random.randint(0, 100000)
        rnd_gen = Random(rnd_seed)

        # recursive randomization of all 'val' values of the dict and its child elements
        def set_rnd_props(data_in):
            for key, value in data_in.items():
                if key == 'children':
                    for child in data_in[key]:
                        set_rnd_props(child)

                if key == 'val':
                    rnd_now = rnd_gen.uniform(-10, 10)
                    if rnd_gen.random() < 0.1:
                        rnd_now = rnd_gen.uniform(-30, 30)
                    val = data_in['val'] + ceil(rnd_now)
                    data_in['val'] = max(20, min(100, int(val)))

            return

        ids = self.tel_ids if (tel_id_in is None) else tel_id_in

        for id_now in self.tel_ids:
            random.shuffle(rnd_props)

            # call the randomization function
            if id_now in ids:
                for prop_name in rnd_props:
                    if prop_name not in self.inst_health_sub[id_now]:
                        continue

                    set_rnd_props(self.inst_health_sub[id_now][prop_name])
                    # if id_now=='L_0': print self.inst_health_sub[id_now][prop_name]

                    # sync with the value in self.inst_health_s0
                    prop_value = self.inst_health_sub[id_now][prop_name]['val']
                    self.inst_health_s0[id_now][prop_name] = prop_value
                    self.redis.pipe.h_set(
                        name='inst_health;' + str(id_now), key=prop_name, data=prop_value
                    )
                    # if id_now=='Ax00':print id_now,prop_name,prop_value

                self.redis.pipe.execute()
                self.set_tel_health_s1(id_now)

            time_now_sec = self.clock_sim.get_time_now_sec()
            time_min = self.clock_sim.get_time_series_start_time_sec()
            base_name = 'inst_health;' + str(id_now)

            for key, val in self.inst_health_sub_flat[id_now].items():
                if 'val' in val['data']:
                    self.redis.pipe.h_set(
                        name=base_name, key=key, data=val['data']['val']
                    )
                    self.redis.pipe.z_add(
                        name=base_name + ';' + key,
                        score=time_now_sec,
                        data={
                            'time_sec': time_now_sec,
                            'value': val['data']['val'],
                        },
                        packed_score=True,
                        clip_score=time_min
                    )

            self.redis.pipe.execute()

        # # self.redis.z_get('inst_health;Lx03;camera_1', packed_score=True)
        # data = self.redis.z_get('inst_health;Lx03;camera_1', packed_score=True)
        # print('----------->', data)
        # return
        # # self.redis.pipe.z_get('inst_health;Lx03;camera_1')
        # # data = self.redis.pipe.execute(packed_score=True)
        # print('--->>> 0  ', data )
        # print('--->>> 0  ', data[0] )
        # print('--->>> 0  ', data[0][0] )
        # print('--->>> 0  ', data[0][0][0]['data'] )
        # print('--->>> 0  ', data[0][0][1] )
        # # print('--->>> 1  ', data[0][1] )
        # # print('--->>> 1  ', data[0][2] )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def main_loop(self):
        self.log.info([['g', ' - starting InstHealth.main_loop ...']])
        sleep(0.1)

        n_loop = 0
        rnd_seed = 12564654
        while self.can_loop(self.interrupt_sig):
            n_loop += 1
            sleep(self.loop_sleep_sec)
            if n_loop % self.loop_act_rate != 0:
                continue

            need_update = self.clock_sim.need_data_update(
                update_opts=self.check_update_opts,
            )
            if not need_update:
                continue

            with InstHealth.lock:
                self.rand_once(rnd_seed=rnd_seed)
                rnd_seed += 1

        return
