import gevent
from gevent import sleep
from random import Random

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import my_log, inst_pos_0
from ctaGuiUtils.py.RedisManager import RedisManager


class InstPos():
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, site_type, clock_sim, inst_data):
        self.log = my_log(title=__name__)
        self.log.info([['y', " - InstPos - "], ['g', site_type]])

        self.site_type = site_type
        self.inst_data = inst_data
        self.tel_ids = self.inst_data.get_inst_ids()

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(
            name=self.class_name, port=utils.redis_port, log=self.log
        )

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        rnd_seed = 10989152934
        self.rnd_gen = Random(rnd_seed)

        self.init()

        gevent.spawn(self.loop)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init(self):
        self.log.info([['g', " - InstPos.init() ..."]])

        self.update_inst_pos()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_inst_pos(self):
        min_delta_pos_sqr = pow(0.05, 2)
        frac_delta_pos = 0.25
        max_target_dif = 0.75

        inst_pos_in = dict()
        if self.redis.exists('inst_pos'):
            inst_pos_in = self.redis.h_get_all(name="inst_pos", packed=True)

        obs_block_ids = self.redis.get(
            name=('obs_block_ids_' + 'run'), packed=True, default_val=[]
        )

        for obs_block_id in obs_block_ids:
            self.redis.pipe.get(obs_block_id)

        blocks = self.redis.pipe.execute(packed=True)

        tel_point_pos = dict()
        for n_block in range(len(blocks)):
            if len(blocks[n_block]["pointings"]) == 0:
                continue
            tel_ids = blocks[n_block]["telescopes"]["large"]["ids"] + blocks[n_block][
                "telescopes"]["medium"]["ids"] + blocks[n_block]["telescopes"]["small"][
                    "ids"]
            point_pos = blocks[n_block]["pointings"][0]["pos"]

            for id_now in tel_ids:
                tel_point_pos[id_now] = point_pos

        for id_now in self.tel_ids:
            inst_pos_now = inst_pos_in[id_now] if id_now in inst_pos_in else inst_pos_0
            if inst_pos_now is None:
                inst_pos_now = inst_pos_0
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

            self.redis.pipe.h_set(
                name="inst_pos", key=id_now, data=inst_pos_new, packed=True
            )

        self.redis.pipe.execute()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting inst_pos.loop ..."]])
        sleep(2)

        while True:
            self.update_inst_pos()

            sleep(2)

        return
