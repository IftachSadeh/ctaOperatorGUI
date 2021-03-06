from random import Random
from time import sleep
from threading import Lock

from shared.LogParser import LogParser
from shared.RedisManager import RedisManager
from shared.ServiceManager import ServiceManager


class InstPos(ServiceManager):
    """telescope pointing-position simulation class, simulating changes of pointing

       Only a single active instance is allowed to exist
    """

    lock = Lock()

    # ------------------------------------------------------------------
    def __init__(self, base_config, service_name, interrupt_sig):
        self.class_name = self.__class__.__name__
        service_name = (service_name if service_name is not None else self.class_name)
        super().__init__(service_name=service_name)

        self.log = LogParser(base_config=base_config, title=__name__)

        self.base_config = base_config
        self.site_type = self.base_config.site_type
        self.clock_sim = self.base_config.clock_sim
        self.inst_data = self.base_config.inst_data

        self.service_name = service_name
        self.interrupt_sig = interrupt_sig

        self.tel_ids = self.inst_data.get_inst_ids()

        self.inst_pos_0 = self.base_config.inst_pos_0

        self.redis = RedisManager(
            name=self.class_name, base_config=self.base_config, log=self.log
        )

        # ------------------------------------------------------------------
        rnd_seed = 10989152934
        self.rnd_gen = Random(rnd_seed)

        # minimum interval of simulation-time to wait before randomising values
        min_wait_update_sec = 10
        self.check_update_opts = {
            'prev_update': None,
            'min_wait': min_wait_update_sec,
        }

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
        # self.log.info([['g', ' - InstPos.init() ...']])

        with InstPos.lock:
            self.update_inst_pos()

        return

    # ------------------------------------------------------------------
    def update_inst_pos(self):
        min_delta_pos_sqr = pow(0.05, 2)
        frac_delta_pos = 0.25

        inst_pos_in = dict()
        if self.redis.exists('inst_pos'):
            inst_pos_in = self.redis.h_get_all(name='inst_pos')

        obs_block_ids = self.redis.get(name=('obs_block_ids_' + 'run'), default_val=[])

        pipe = self.redis.get_pipe()
        for obs_block_id in obs_block_ids:
            pipe.get(obs_block_id)
        blocks = pipe.execute()

        tel_point_pos = dict()
        for n_block in range(len(blocks)):
            if not isinstance(blocks[n_block], dict):
                continue
            if len(blocks[n_block]['pointings']) == 0:
                continue
            tel_ids = (
                blocks[n_block]['telescopes']['large']['ids']
                + blocks[n_block]['telescopes']['medium']['ids']
                + blocks[n_block]['telescopes']['small']['ids']
            )
            point_pos = blocks[n_block]['pointings'][0]['pos']

            for id_now in tel_ids:
                tel_point_pos[id_now] = point_pos

        for id_now in self.tel_ids:
            inst_pos_now = inst_pos_in[id_now
                                       ] if id_now in inst_pos_in else self.inst_pos_0
            if inst_pos_now is None:
                inst_pos_now = self.inst_pos_0
            inst_pos_new = inst_pos_now

            if id_now in tel_point_pos:
                point_pos = tel_point_pos[id_now]

                pos_dif = [(point_pos[0] - inst_pos_now[0]),
                           (point_pos[1] - inst_pos_now[1])]
                if (pos_dif[0] > 360):
                    pos_dif[0] -= 360
                elif (pos_dif[0] < -360):
                    pos_dif[0] += 360
                # if(pos_dif[0] > 180):
                #   pos_dif[0] -= 360
                # elif(pos_dif[0] < -180):
                #   pos_dif[0] += 360
                if (pos_dif[1] >= 90):
                    pos_dif[1] -= 90

                rnd_scale = 1
                if (pos_dif[0] * pos_dif[0]
                        + pos_dif[1] * pos_dif[1]) < min_delta_pos_sqr:
                    rnd_scale = -1.5 if (self.rnd_gen.random() < 0.5) else 1.5

                inst_pos_new = [
                    inst_pos_now[0]
                    + pos_dif[0] * rnd_scale * self.rnd_gen.random() * frac_delta_pos,
                    inst_pos_now[1]
                    + pos_dif[1] * rnd_scale * self.rnd_gen.random() * frac_delta_pos
                ]

            pipe.h_set(name='inst_pos', key=id_now, data=inst_pos_new)

        pipe.execute()

        return

    # ------------------------------------------------------------------
    def loop_main(self):
        self.log.info([['g', ' - starting InstPos.loop_main ...']])
        sleep(0.1)

        n_loop = 0
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

            with InstPos.lock:
                self.update_inst_pos()

        self.log.info([['c', ' - ending InstPos.loop_main ...']])

        return
