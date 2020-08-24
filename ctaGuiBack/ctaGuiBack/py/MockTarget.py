from random import Random

from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
class MockTarget():
    """target simulation class, simulating the execution of observations
    """

    # ------------------------------------------------------------------
    def __init__(self, base_config):
        self.log = LogParser(base_config=base_config, title=__name__)
        self.log.info([['g', ' - starting MockTarget ...']])

        self.base_config = base_config
        self.site_type = self.base_config.site_type

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(
            name=self.class_name, base_config=self.base_config, log=self.log
        )

        # ------------------------------------------------------------------
        rnd_seed = 10989152934
        # self.rnd_gen = Random(rnd_seed)
        self.rnd_gen = Random()

        self.az_min_max = [-180, 180]
        self.zen_min_max_tel = [0, 70]

        self.init()

        return

    # ------------------------------------------------------------------
    def init(self):
        self.create_target()
        return

    # ------------------------------------------------------------------
    def create_target(self):
        n_rnd_targets = max(5, int(self.rnd_gen.random() * 12))
        start_time_sec = 0
        end_time_sec = 28800
        step = end_time_sec / (n_rnd_targets + 1)
        offset = step * 0.66

        self.target_ids = []
        self.targets = []

        pipe = self.redis.get_pipe()

        for index in range(n_rnd_targets):
            # if self.redis.exists('inst_pos'):
            #     inst_pos_in = self.redis.h_get_all(name="inst_pos",
            target = {
                "id": "target_" + str(index),
                "name": "target_" + str(index),
            }

            target["pos"] = []
            target["pos"] += [
                self.rnd_gen.random() *
                (self.az_min_max[1] - self.az_min_max[0]) + self.az_min_max[0]
            ]
            target["pos"] += [
                self.rnd_gen.random() *
                (self.zen_min_max_tel[1] - self.zen_min_max_tel[0])
                + self.zen_min_max_tel[0]
            ]

            minimal = start_time_sec + (step * index) - (self.rnd_gen.random() * offset)

            optimal = 1500 + start_time_sec + (step * index) + (step * 0.5) + (
                (self.rnd_gen.random() - 0.5) * offset
            )

            maximal = 4000 + start_time_sec + (step * (index + 1)) + (
                self.rnd_gen.random() * offset
            )

            target["observability"] = {
                "minimal": minimal,
                "optimal": optimal,
                "maximal": maximal
            }

            self.target_ids.append("target_" + str(index))
            self.targets.append(target)

            pipe.set(name='target_' + str(index), data=target)

        pipe.execute()

        pipe.set(name='target_ids', data=self.target_ids)
        pipe.execute()

        return
