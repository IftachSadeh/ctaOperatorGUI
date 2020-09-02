from shared.utils import get_time_of_night
from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
#  ObsBlockControl
# ------------------------------------------------------------------
class ObsBlockControl(BaseWidget):
    time_of_night = {}
    inst_health = []
    block_keys = [['wait'], ['run'], ['done', 'cancel', 'fail']]
    blocks = {}
    for keys_now in block_keys:
        blocks[keys_now[0]] = []

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

        # ------------------------------------------------------------------
        # widget-specific initialisations
        # ------------------------------------------------------------------
        self.tel_ids = self.socket_manager.inst_data.get_inst_ids(
            inst_types=['LST', 'MST', 'SST']
        )

        # FIXME - need to add lock?
        if len(ObsBlockControl.inst_health) == 0:
            for id_now in self.tel_ids:
                ObsBlockControl.inst_health.append({"id": id_now, "val": 0})

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def setup(self, *args):
        # standard common initialisations
        BaseWidget.setup(self, *args)

        with self.socket_manager.lock:
            wgt = self.redis.h_get(
                name='ws;widget_info',
                key=self.widget_id,
            )
            self.widget_state = wgt["widget_state"]
            self.widget_state["focus_id"] = ""

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
    async def back_from_offline(self, data):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, data)

        # with ObsBlockControl.lock:
        #     print('-- back_from_offline',self.widget_type,self.widget_id)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        ObsBlockControl.time_of_night = get_time_of_night(self)
        self.get_blocks()
        self.get_tel_health()

        data = {
            "time_of_night": ObsBlockControl.time_of_night,
            "inst_health": ObsBlockControl.inst_health,
            "blocks": ObsBlockControl.blocks
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_health(self):
        self.redis.pipe.reset()
        for id_now in self.tel_ids:
            self.redis.pipe.h_get(name="inst_health;" + str(id_now), key="health")
        redis_data = self.redis.pipe.execute()

        for i in range(len(redis_data)):
            id_now = self.tel_ids[i]
            ObsBlockControl.inst_health[i]["val"] = redis_data[i]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_blocks(self):
        for keys_now in ObsBlockControl.block_keys:
            self.redis.pipe.reset()
            for key in keys_now:
                self.redis.pipe.get('obs_block_ids_' + key)

            data = self.redis.pipe.execute()
            obs_block_ids = sum(data, [])  # flatten the list of lists

            self.redis.pipe.reset()
            for obs_block_id in obs_block_ids:
                self.redis.pipe.get(obs_block_id)

            key = keys_now[0]
            blocks = self.redis.pipe.execute()
            ObsBlockControl.blocks[key] = sorted(
                blocks,
                cmp=lambda a, b: int(a['time']['start']) - int(b['time']['start'])
            )

        # print ObsBlockControl.blocks

        # dur = [x['timestamp'] for x in ObsBlockControl.blocks] ; print dur
        # print ObsBlockControl.blocks['wait'][5]['exe_state']

        # ObsBlockControl.blocks = [ unpackb(x) for x in redis_data ]

        # ObsBlockControl.blocks = []
        # for block in redis_data:
        #   ObsBlockControl.blocks.append(unpackb(block))

        # self.sortBlocks()

        # if len(ObsBlockControl.blocks) > 10: ObsBlockControl.blocks = ObsBlockControl.blocks[0:9]
        # if len(ObsBlockControl.blocks) > 20: ObsBlockControl.blocks = ObsBlockControl.blocks[0:11]
        # # # # print ObsBlockControl.blocks
        # # for bb in range(9):
        # for bb in range(20):
        #   if len(ObsBlockControl.blocks) <= bb: break
        #   ObsBlockControl.blocks[bb]['exe_state'] = 'run'
        #   ObsBlockControl.blocks[bb]['run_phase'] = ['run_take_data']
        #   # ObsBlockControl.blocks[bb]['run_phase'] = ['run_config_mount']
        #   # print ObsBlockControl.blocks[bb]
        #   # if bb < 10: ObsBlockControl.blocks[bb]['exe_state'] = 'run'
        #   # else:     ObsBlockControl.blocks[bb]['exe_state'] = 'wait'

        return
