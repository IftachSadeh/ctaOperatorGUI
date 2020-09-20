from math import ceil
import random
from random import Random

from time import sleep
from threading import Lock

from shared.ServiceManager import ServiceManager
from shared.LogParser import LogParser
from shared.utils import flatten_dict
from shared.RedisManager import RedisManager


# ------------------------------------------------------------------
class InstHealth(ServiceManager):
    """instrument health simulation class, simulating changes to the metrics of instruments

       Only a single active instance is allowed to exist
    """

    lock = Lock()

    # ------------------------------------------------------------------
    def __init__(self, base_config, service_name, interrupt_sig):
        self.class_name = self.__class__.__name__
        service_name = (service_name if service_name is not None else self.class_name)
        super().__init__(service_name=service_name)

        self.log = LogParser(base_config=base_config, title=__name__)
        # self.log.info([['y', ' - InstHealth - ']])

        self.base_config = base_config
        self.site_type = self.base_config.site_type
        self.clock_sim = self.base_config.clock_sim
        self.inst_data = self.base_config.inst_data

        self.service_name = service_name
        self.interrupt_sig = interrupt_sig

        self.redis = RedisManager(
            name=self.class_name, base_config=self.base_config, log=self.log
        )

        self.tel_ids = self.inst_data.get_inst_ids()

        self.inst_health_s0 = dict()
        self.inst_health_s1 = dict()
        self.inst_health = dict()
        self.inst_health_sub_flat = dict()

        # minimum interval of simulation-time to wait before randomising values
        min_wait_update_sec = 10
        self.check_update_opts = {
            'prev_update': None,
            'min_wait': min_wait_update_sec,
        }

        # the fraction of telescopes to randomely update
        self.update_frac = 0.05

        # set debug_updates to 0 to have mild updates, to 1 to have frequent
        # updates for a single inst, or to 2 to frequently update all instruments
        self.debug_updates = 1

        self.inst_data = self.base_config.inst_data
        self.health_tag = self.inst_data.health_tag

        # sleep duration for thread loops
        self.loop_sleep_sec = 1
        # minimal real-time delay between randomisations (once every self.loop_act_rate sec)
        self.loop_act_rate = max(int(5 / self.loop_sleep_sec), 1)

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
        # self.log.info([['g', ' - inst_health.init() ...']])

        pipe = self.redis.get_pipe()

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
                pipe.h_set(
                    name='inst_health_summary;' + str(id_now),
                    key=key,
                    data=val,
                )

            # self.redPipe.hmset('inst_health_s0'+str(id_now), self.inst_health_s0[id_now])

        self.inst_health = self.inst_data.get_inst_healths()

        # derive the top-level properties, eg:
        #   {'inst_0', 'camera', 'prc_0', 'mount', 'mirror',
        #    'prc_1', 'aux', 'inst_1', 'daq'}
        self.rnd_props = set()
        for (k_0, v_0) in self.inst_health.items():
            for (k_1, v_1) in v_0.items():
                self.rnd_props.add(k_1)
        self.rnd_props = list(self.rnd_props)

        # a flat dict with references to each level of the original dict
        self.inst_health_sub_flat = dict()
        for id_now in self.tel_ids:
            self.inst_health_sub_flat[id_now] = flatten_dict(self.inst_health[id_now])

        for id_now in self.tel_ids:
            self.set_tel_health_s1(id_now)

            for key, val in self.inst_health_sub_flat[id_now].items():
                if 'val' in val['data']:
                    pipe.h_set(
                        name='inst_health_summary;' + str(id_now),
                        key=key,
                        data=val['data']['val']
                    )

        # set the full health metrics for each instrument
        self.inst_health_deep = self.inst_data.get_inst_health_fulls()
        for (id_now, inst) in self.inst_health_deep.items():
            for (field_id, data) in inst.items():
                pipe.h_set(
                    name='inst_health_deep;' + str(id_now),
                    key=field_id,
                    data=data,
                )

        pipe.execute()

        self.rand_once(update_frac=1)

        return

    # ------------------------------------------------------------------
    def set_tel_health_s1(self, id_now):
        self.inst_health_s1[id_now] = {
            'id': id_now,
            self.health_tag: self.inst_health_s0[id_now][self.health_tag],
            'status': 'run',
            'data': [v for v in self.inst_health[id_now].values()]
        }

        return

    # ------------------------------------------------------------------
    def rand_once(self, rnd_seed=-1, update_frac=None):
        ids = self.rand_s0(rnd_seed=rnd_seed, update_frac=update_frac)
        self.rand_s1(tel_id_in=ids, rnd_seed=rnd_seed)

        return

    # ------------------------------------------------------------------
    def rand_s0(self, rnd_seed=-1, update_frac=None):
        if rnd_seed < 0:
            rnd_seed = random.randint(0, 100000)
        rnd_gen = Random(rnd_seed)

        arr_props = dict()

        if update_frac is None:
            update_frac = self.update_frac

        n_rnd_props = len(self.rnd_props)

        pipe = self.redis.get_pipe()

        for id_now in self.tel_ids:

            # example change of the connection status (negative health value)
            if (id_now in ['Lx02']):
                rnd = rnd_gen.random()
                sign = 1 if rnd < 0.5 else -1

                self.inst_health_s0[id_now][self.health_tag] = (
                    sign * abs(self.inst_health_s0[id_now][self.health_tag])
                )

                pipe.h_set(
                    name='inst_health_summary;' + str(id_now),
                    key=self.health_tag,
                    data=self.inst_health_s0[id_now][self.health_tag],
                )

            if (self.debug_updates >= 2) or (id_now in ['Lx01']):
                update_frac_now = 1
            else:
                update_frac_now = update_frac

            rnd = rnd_gen.random()
            if self.debug_updates == 0:
                if rnd > update_frac_now:
                    continue
            elif self.debug_updates == 1:
                if (id_now not in ['Lx01']) and (rnd < 0.5):
                    continue
                elif rnd > update_frac_now:
                    continue
            elif self.debug_updates == 2:
                pass

            arr_props[id_now] = self.inst_health_s0[id_now]

            rnd = rnd_gen.random()
            if rnd < 0.06:
                health_tot = rnd_gen.randint(0, 100)
            elif rnd < 0.1:
                health_tot = rnd_gen.randint(40, 100)
            else:
                health_tot = rnd_gen.randint(60, 100)

            if self.debug_updates == 0:
                pass
            elif self.debug_updates == 1:
                if (id_now in ['Lx01']) and rnd < 0.5:
                    health_tot = rnd_gen.randint(0, 100)
            elif self.debug_updates >= 2:
                health_tot = rnd_gen.randint(0, 100)

            arr_props[id_now][self.health_tag] = health_tot

            bad = 100 - health_tot
            for n_prop_now in range(n_rnd_props):
                rnd = rnd_gen.randint(0, bad)

                if n_prop_now == n_rnd_props - 1:
                    rnd = bad
                else:
                    bad -= rnd

                if self.rnd_props[n_prop_now] in arr_props[id_now]:
                    arr_props[id_now][self.rnd_props[n_prop_now]] = 100 - rnd

            self.inst_health_s0[id_now] = arr_props[id_now]

            self.inst_health_s1[id_now][self.health_tag] = health_tot

            for key, val in self.inst_health_s0[id_now].items():
                pipe.h_set(name='inst_health_summary;' + str(id_now), key=key, data=val)
                # print('inst_health_summary;' + str(id_now), key, val)

        pipe.execute()

        ids = [id_now for id_now in arr_props]

        return ids

    # ------------------------------------------------------------------
    def rand_s1(self, tel_id_in=None, rnd_seed=-1):

        if rnd_seed < 0:
            rnd_seed = random.randint(0, 100000)
        rnd_gen = Random(rnd_seed)

        rnd_props = [p for p in self.rnd_props]

        # recursive randomization of all 'val' values of the
        # dict and its child elements
        def set_rnd_props(data_in):
            keys = data_in.keys()

            if 'children' in keys:
                for child in data_in['children']:
                    set_rnd_props(child)

            if 'val' in keys:
                rnd_val(data_in)

            return

        # in-place randomisation of the 'val' key of an input dict
        def rnd_val(data_in):
            if rnd_gen.random() < 0.1:
                rnd_now = rnd_gen.uniform(-30, 30)
            else:
                rnd_now = rnd_gen.uniform(-10, 10)

            val = data_in['val'] + ceil(rnd_now)
            val = max(-1, min(100, int(val)))
            data_in['val'] = val

            return

        ids = self.tel_ids if (tel_id_in is None) else tel_id_in

        pipe = self.redis.get_pipe()

        n_rnd_props_0 = 3
        n_rnd_props_1 = 10

        for id_now in self.tel_ids:
            random.shuffle(rnd_props)

            # call the randomization function
            if id_now in ids:
                # randomise the main metrics
                for prop_name in rnd_props:
                    if prop_name not in self.inst_health[id_now]:
                        continue

                    set_rnd_props(self.inst_health[id_now][prop_name])
                    # if id_now == 'Lx01':
                    #     print (id_now, prop_name, '\n', self.inst_health[id_now][prop_name])

                    # sync with the value in self.inst_health_s0
                    prop_value = self.inst_health[id_now][prop_name]['val']
                    self.inst_health_s0[id_now][prop_name] = prop_value
                    pipe.h_set(
                        name='inst_health_summary;' + str(id_now),
                        key=prop_name,
                        data=prop_value
                    )

                # randomise the list of full health
                inst_health_deep = self.redis.h_get_all(
                    name='inst_health_deep;' + str(id_now),
                    default_val={},
                )

                # select a sub sample of properties to randomise
                props_0 = inst_health_deep.keys()
                props_0 = random.sample(props_0, min(n_rnd_props_0, len(props_0) - 1))

                # for debugging, always randomise this particular property
                if id_now == 'Lx01' and 'camera_1_0' not in props_0:
                    if 'camera_1_0' in inst_health_deep.keys():
                        props_0 += ['camera_1_0']

                for n_prop_0 in range(len(props_0)):
                    prop_0_name = props_0[n_prop_0]
                    props_1 = inst_health_deep[prop_0_name]

                    # select a random sub sample of properties
                    # by picking their indices in the list
                    update_indices = random.sample(
                        range(len(props_1) - 1),
                        min(n_rnd_props_1,
                            len(props_1) - 1),
                    )
                    # randomise in-place the val of the selected properties
                    for n_prop_1 in range(len(update_indices)):
                        prop_1_name = update_indices[n_prop_1]
                        rnd_val(props_1[prop_1_name])

                    pipe.h_set(
                        name='inst_health_deep;' + str(id_now),
                        key=props_0[n_prop_0],
                        data=props_1,
                    )

                pipe.execute()

                self.set_tel_health_s1(id_now)

            time_now_sec = self.clock_sim.get_time_now_sec()
            time_min = self.clock_sim.get_time_series_start_time_sec()

            base_name = 'inst_health_summary;' + str(id_now)

            for key, val in self.inst_health_sub_flat[id_now].items():
                if 'val' in val['data']:
                    pipe.h_set(name=base_name, key=key, data=val['data']['val'])
                    pipe.z_add(
                        name=base_name + ';' + key,
                        score=time_now_sec,
                        data={
                            'time_sec': time_now_sec,
                            'value': val['data']['val'],
                        },
                        clip_score=time_min
                    )

            pipe.execute()

        # # self.redis.z_get('inst_health_summary;Lx03;camera_1')
        # data = self.redis.z_get('inst_health_summary;Lx03;camera_1')
        # print('----------->', data)
        # raise Exception('aaaaa aaaaaaaaaa')

        return

    # ------------------------------------------------------------------
    def loop_main(self):
        self.log.info([['g', ' - starting InstHealth.loop_main ...']])
        sleep(0.1)

        n_loop = 0
        rnd_seed = 12564654
        while self.can_loop():
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

        self.log.info([['c', ' - ending InstHealth.loop_main ...']])

        return
