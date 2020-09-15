from shared.utils import get_time_of_night
from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class ObsBlockControl(BaseWidget):

    # ------------------------------------------------------------------
    def __init__(self, widget_id=None, sm=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        # widget-specific initialisations
        self.time_of_night = {}
        self.inst_health = []
        self.block_keys = [['wait'], ['run'], ['done', 'cancel', 'fail']]
        self.blocks = {}
        for keys_now in self.block_keys:
            self.blocks[keys_now[0]] = []

        self.tel_ids = self.sm.inst_data.get_inst_ids(inst_types=['LST', 'MST', 'SST'])

        if len(self.inst_health) == 0:
            for id_now in self.tel_ids:
                self.inst_health.append({'id': id_now, 'val': 0})

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await BaseWidget.setup(self, args)

        with self.sm.lock:
            wgt = self.redis.h_get(
                name='ws;widget_info',
                key=self.widget_id,
                default_val=None,
            )
            # do stuff on None!!!!!!!!!!!!!!

            self.widget_state = wgt['widget_state']
            self.widget_state['focus_id'] = ''

        # initialise dataset and send to client
        opt_in = {
            'widget': self,
            'event_name': 'init_data',
            'data_func': self.get_data,
        }
        await self.sm.emit_widget_event(opt_in=opt_in)

        # start an update loop for this particular instance
        opt_in = {
            'widget': self,
            'loop_scope': 'unique_by_id',
            'data_func': self.get_data,
            'sleep_sec': 3,
            'loop_id': 'update_data_widget_id',
            'event_name': 'update_data',
        }
        await self.sm.add_widget_loop(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    async def back_from_offline(self, *args):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, args)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    async def get_data(self):
        self.time_of_night = get_time_of_night(self)
        self.get_blocks()
        self.get_tel_health()

        data = {
            'time_of_night': self.time_of_night,
            'inst_health': self.inst_health,
            'blocks': self.blocks
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_health(self):
        self.redis.pipe.reset()
        for id_now in self.tel_ids:
            self.redis.pipe.h_get(name='inst_health;' + str(id_now), key='health')
        redis_data = self.redis.pipe.execute()

        for i in range(len(redis_data)):
            id_now = self.tel_ids[i]
            self.inst_health[i]['val'] = redis_data[i]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_blocks(self):
        for keys_now in self.block_keys:
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
            self.blocks[key] = sorted(
                blocks,
                cmp=lambda a, b: int(a['time']['start']) - int(b['time']['start'])
            )

        # print self.blocks

        # dur = [x['timestamp'] for x in self.blocks] ; print dur
        # print self.blocks['wait'][5]['exe_state']

        # self.blocks = [ unpackb(x) for x in redis_data ]

        # self.blocks = []
        # for block in redis_data:
        #   self.blocks.append(unpackb(block))

        # self.sortBlocks()

        # if len(self.blocks) > 10: self.blocks = self.blocks[0:9]
        # if len(self.blocks) > 20: self.blocks = self.blocks[0:11]
        # # # # print self.blocks
        # # for bb in range(9):
        # for bb in range(20):
        #   if len(self.blocks) <= bb: break
        #   self.blocks[bb]['exe_state'] = 'run'
        #   self.blocks[bb]['run_phase'] = ['run_take_data']
        #   # self.blocks[bb]['run_phase'] = ['run_config_mount']
        #   # print self.blocks[bb]
        #   # if bb < 10: self.blocks[bb]['exe_state'] = 'run'
        #   # else:     self.blocks[bb]['exe_state'] = 'wait'

        return
