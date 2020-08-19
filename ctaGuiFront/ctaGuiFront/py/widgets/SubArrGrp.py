import copy
from gevent import sleep
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
#  SubArrGrp
# ------------------------------------------------------------------
class SubArrGrp(BaseWidget):
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id="", socket_manager=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            socket_manager=socket_manager,
        )

        self.no_sub_arr_name = self.base_config.no_sub_arr_name

        # ------------------------------------------------------------------
        # widget-specific initialisations
        # ------------------------------------------------------------------
        self.pos0 = [0, 90]

        self.tel_ids = self.socket_manager.inst_data.get_inst_ids(
            inst_types=['LST', 'MST', 'SST']
        )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        # standard common initialisations
        BaseWidget.setup(self, *args)

        # initial dataset and send to client
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.send_widget_init_data(opt_in=opt_in)

        # start a thread which will call update_data() and send 1Hz data updates
        # to all sessions in the group
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.add_widget_loop(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # standard common initialisations
        BaseWidget.back_from_offline(self)

        # with SubArrGrp.lock:
        #     print('-- back_from_offline',self.widget_name,self.widget_id)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        for redis_key in ['obs_block_ids_' + 'run', 'inst_pos']:
            n_tries = 0
            while not self.redis.exists(redis_key):
                self.log.warning(
                    [['r', " - no - "], ['p', redis_key],
                     ['r', " - in redis. will try again ... (", n_tries, ")"]]
                )
                if n_tries > 4:
                    return {}
                n_tries += 1
                sleep(0.5)

        sub_arrs = self.redis.get(name="sub_arrs", default_val=[])
        obs_block_ids = self.redis.get(name=('obs_block_ids_' + 'run'), default_val=[])
        inst_pos = self.redis.h_get_all(name="inst_pos")

        data = {
            "tel": [],
            "trg": [],
            "pnt": [],
            "sub_arr": {
                "id": "sub_arr",
                "children": sub_arrs
            }
        }

        self.redis.pipe.reset()
        for obs_block_id in obs_block_ids:
            self.redis.pipe.get(obs_block_id)
        blocks = self.redis.pipe.execute()

        #
        all_tel_ids = copy.deepcopy(self.tel_ids)
        self.tel_point_pos = dict()

        for n_block in range(len(blocks)):
            block_tel_ids = blocks[n_block]["tel_ids"]

            trg_id = blocks[n_block]['targets'][0]["id"]
            target_name = blocks[n_block]['targets'][0]["name"]
            target_pos = blocks[n_block]['targets'][0]["pos"]

            pnt_id = blocks[n_block]['pointings'][0]["id"]
            pointing_name = blocks[n_block]['pointings'][0]["name"]
            point_pos = blocks[n_block]['pointings'][0]["pos"]

            # compile the telescope list for this block
            tels = []
            for id_now in block_tel_ids:
                inst_pos_now = inst_pos[id_now] if id_now in inst_pos else self.pos0

                data["tel"].append({
                    "id": id_now,
                    "trg_id": trg_id,
                    "pnt_id": pnt_id,
                    "pos": inst_pos_now,
                })

                tels.append({"id": id_now})

                if id_now in all_tel_ids:
                    all_tel_ids.remove(id_now)

                self.tel_point_pos[id_now] = point_pos

            # add the target for this block, if we dont already have it
            if trg_id not in [x["id"] for x in data["trg"]]:
                data["trg"].append({"id": trg_id, "N": target_name, "pos": target_pos})

            # add the pointing for this block
            data["pnt"].append({
                "id": pnt_id,
                "N": pointing_name,
                "pos": point_pos,
                "tel_ids": block_tel_ids,
            })

        # ------------------------------------------------------------------
        # now take care of all free telescopes
        # ------------------------------------------------------------------
        tels = []
        for id_now in all_tel_ids:
            inst_pos_now = inst_pos[id_now] if id_now in inst_pos else self.pos0

            data["tel"].append({
                "id": id_now,
                "trg_id": self.no_sub_arr_name,
                "pnt_id": self.no_sub_arr_name,
                "pos": inst_pos_now,
            })

            tels.append({"id": id_now})

        return data
