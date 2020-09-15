# from datetime import timedelta
# from datetime import datetime
# from shared.utils import get_time_of_night
from shared.utils import secs_to_datetime
from shared.ClockSim import get_clock_sim_data
from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class SchedBlockController(BaseWidget):

    # ------------------------------------------------------------------
    def __init__(self, widget_id=None, sm=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        # widget-specific initialisations
        self.block_keys = [['wait'], ['run'], ['done', 'cancel', 'fail']]
        self.blocks = {}
        for keys_now in self.block_keys:
            self.blocks[keys_now[0]] = []

        self.inst_health = []

        # self.tel_ids = self.sm.inst_data.get_inst_ids()
        self.tel_ids = self.sm.inst_data.get_inst_ids(inst_types=['LST', 'MST', 'SST'])

        # FIXME - need to add lock?
        if len(self.inst_health) == 0:
            for id_now in self.tel_ids:
                self.inst_health.append({'id': id_now, 'val': 0})

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await BaseWidget.setup(self, args)

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

    # # ------------------------------------------------------------------
    # def setup(self, *args):
    #     # standard common initialisations
    #     BaseWidget.setup(self, args)

    #     # initial dataset and send to client
    #     opt_in = {'widget': self, 'data_func': self.get_data}
    #     self.sm.send_widget_init_data(opt_in=opt_in)

    #     # start a thread which will call update_data() and send
    #     # 1Hz data updates to all sessions in the group
    #     opt_in = {'widget': self, 'data_func': self.get_data}
    #     self.sm.add_widget_loop(opt_in=opt_in)

    #     return

    # ------------------------------------------------------------------
    async def back_from_offline(self, *args):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, args)

        return

    # ------------------------------------------------------------------
    async def get_data(self):
        self.get_blocks()
        self.get_tel_health()
        self.get_events()
        self.get_clock_events()
        self.get_target()

        clock_sim = get_clock_sim_data(self)

        time_now_sec = clock_sim['time_now_sec']
        night_start_sec = clock_sim['night_start_sec']
        night_end_sec = clock_sim['night_end_sec']
        # print('----', time_now_sec, night_start_sec, night_end_sec)

        time_of_night_date = {
            'date_start': secs_to_datetime(night_start_sec).strftime('%Y-%m-%d %H:%M:%S'),
            'date_end': secs_to_datetime(night_end_sec).strftime('%Y-%m-%d %H:%M:%S'),
            'date_now': secs_to_datetime(time_now_sec).strftime('%Y-%m-%d %H:%M:%S'),
            'now': int(time_now_sec),
            'start': int(night_start_sec),
            'end': int(night_end_sec),
        }

        data = {
            'time_of_night': time_of_night_date,
            'inst_health': self.inst_health,
            'blocks': self.blocks,
            'external_events': self.external_events,
            'external_clock_events': self.external_clock_events,
            'targets': self.targets
        }

        return data

    # ------------------------------------------------------------------
    def get_events(self):

        pipe = self.redis.get_pipe()
        pipe.get(name='external_events')
        redis_data = pipe.execute()

        self.external_events = redis_data

        return

    # ------------------------------------------------------------------
    def get_clock_events(self):
        pipe = self.redis.get_pipe()
        pipe.get(name='external_clock_events')
        redis_data = pipe.execute()

        self.external_clock_events = redis_data

        return

    # ------------------------------------------------------------------
    def get_tel_health(self):
        pipe = self.redis.get_pipe()
        for id_now in self.tel_ids:
            pipe.h_get(name='inst_health;' + str(id_now), key='health')
        redis_data = pipe.execute()

        for i in range(len(redis_data)):
            id_now = self.tel_ids[i]
            self.inst_health[i]['val'] = redis_data[i]

        return

    # ------------------------------------------------------------------
    def get_target(self):

        self.target_ids = self.redis.get(name='target_ids', default_val=[])

        pipe = self.redis.get_pipe()
        for id in self.target_ids:
            pipe.get(id)
        self.targets = pipe.execute()

        return

    # ------------------------------------------------------------------
    def get_blocks(self):
        for keys_now in self.block_keys:
            pipe = self.redis.get_pipe()
            for key in keys_now:
                pipe.get('obs_block_ids_' + key)

            data = pipe.execute()
            obs_block_ids = sum(data, [])  # flatten the list of lists

            pipe.reset()
            for obs_block_id in obs_block_ids:
                pipe.get(obs_block_id)

            key = keys_now[0]
            blocks = pipe.execute()
            self.blocks[key] = sorted(blocks, key=lambda a: float(a['time']['start']))

            # if key == 'run' and len(self.blocks[key]) > 0:
            #     print(self.blocks[key][0])
        # for k,v in self.blocks.items():
        #     print(k, len(v))

        return

    # ???????????????????????????????????????????????????????????????????????
    # DL_FIXME - who is supposed to be using this.pushNewBlockQueue or
    # this sched_block_controller_new_queue event ?
    # ???????????????????????????????????????????????????????????????????????
    # def sched_block_controller_push_queue(self, *args):
    #     # print('sched_block_controller_push_queue')

    #     # one day
    #     expire_sec = 86400

    #     data = args[0]['new_block_queue']['blocks']
    #     obs_block_ids = {'wait': [], 'run': [], 'done': [], 'cancel': [], 'fail': [],}

    #     pipe = self.redis.get_pipe()

    #     new_blocks = []
    #     for key in data:
    #         for i in range(len(data[key])):
    #             if self.redis.exists(data[key][i]['obs_block_id']):
    #                 obs_block_ids[data[key][i]['exe_state']['state']].append(
    #                     data[key][i]['obs_block_id']
    #                 )
    #                 pipe.set(
    #                     name=data[key][i]['obs_block_id'],
    #                     data=data[key][i],
    #                     expire_sec=expire_sec,
    #                 )
    #             else:
    #                 new_blocks.append(data[key][i])
    #     for key, val in obs_block_ids.items():
    #         pipe.set(name='obs_block_ids_' + key, data=val)

    #     pipe.execute()
    #     # print(new_blocks)

    #     print('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
    #     if 0:
    #         self.sm.socket_event_widgets(
    #             event_name='sched_block_controller_new_queue',
    #             data={},
    #             sess_ids=[self.sm.sess_id],
    #             widget_ids=[self.widget_id]
    #         )

    #     return
