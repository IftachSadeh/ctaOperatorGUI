# from datetime import timedelta
# from datetime import datetime
# from shared.utils import get_time_of_night
from shared.utils import secs_to_datetime
from shared.ClockSim import get_clock_sim_data
from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
#  SchedBlockInspector
# ------------------------------------------------------------------
class SchedBlockInspector(BaseWidget):
    block_keys = [['wait'], ['run'], ['done', 'cancel', 'fail']]
    blocks = {}
    for keys_now in block_keys:
        blocks[keys_now[0]] = []

    # time_of_night = {}

    inst_health = []

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
        if len(SchedBlockInspector.inst_health) == 0:
            for id_now in self.tel_ids:
                SchedBlockInspector.inst_health.append({"id": id_now, "val": 0})

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

        # start a thread which will call update_data() and send
        # 1Hz data updates to all sessions in the group
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.add_widget_loop(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    async def back_from_offline(self, data=None):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, data=None)

        # with SchedBlockInspector.lock:
        #     print('-- back_from_offline',self.widget_type,self.widget_id)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
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
            "date_start": secs_to_datetime(night_start_sec).strftime('%Y-%m-%d %H:%M:%S'),
            "date_end": secs_to_datetime(night_end_sec).strftime('%Y-%m-%d %H:%M:%S'),
            "date_now": secs_to_datetime(time_now_sec).strftime('%Y-%m-%d %H:%M:%S'),
            "now": int(time_now_sec),
            "start": int(night_start_sec),
            "end": int(night_end_sec),
        }
        # print(time_of_night_date)

        # SchedBlockInspector.time_of_night = get_time_of_night(self)

        # time_of_night_date = {
        #     "date_start":
        #     datetime(2018, 9, 16, 21, 30).strftime('%Y-%m-%d %H:%M:%S'),
        #     "date_end": (
        #         datetime(2018, 9, 16, 21, 30)
        #         + timedelta(seconds=int(SchedBlockInspector.time_of_night['end']))
        #     ).strftime('%Y-%m-%d %H:%M:%S'),
        #     "date_now": (
        #         datetime(2018, 9, 16, 21, 30)
        #         + timedelta(seconds=int(SchedBlockInspector.time_of_night['now']))
        #     ).strftime('%Y-%m-%d %H:%M:%S'),
        #     "now":
        #     int(SchedBlockInspector.time_of_night['now']),
        #     "start":
        #     int(SchedBlockInspector.time_of_night['start']),
        #     "end":
        #     int(SchedBlockInspector.time_of_night['end'])
        # }

        data = {
            "time_of_night": time_of_night_date,
            "inst_health": SchedBlockInspector.inst_health,
            "blocks": SchedBlockInspector.blocks,
            "external_events": SchedBlockInspector.external_events,
            "external_clock_events": SchedBlockInspector.external_clock_events,
            "targets": SchedBlockInspector.targets
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_events(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_events")
        redis_data = self.redis.pipe.execute()

        SchedBlockInspector.external_events = redis_data

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_clock_events(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_clock_events")
        redis_data = self.redis.pipe.execute()

        SchedBlockInspector.external_clock_events = redis_data

        return

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
            SchedBlockInspector.inst_health[i]["val"] = redis_data[i]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_target(self):
        self.redis.pipe.reset()

        SchedBlockInspector.target_ids = self.redis.get(name='target_ids', default_val=[])
        for id in SchedBlockInspector.target_ids:
            self.redis.pipe.get(id)
        SchedBlockInspector.targets = self.redis.pipe.execute()
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_blocks(self):
        for keys_now in SchedBlockInspector.block_keys:
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
            SchedBlockInspector.blocks[key] = sorted(
                blocks,
                #cmp=lambda a, b: int((datetime.strptime(a['start_time_sec'],"%Y-%m-%d %H:%M:%S") - datetime.strptime(b['start_time_sec'],"%Y-%m-%d %H:%M:%S")).total_seconds())
                cmp=(lambda a, b: int(a['time']['start']) - int(b['time']['start']))
            )

        return

    # data.zoom_target = name of telescope focus on (ex: L_2)
    def sched_block_inspector_push_schedule(self, *args):
        self.expire_sec = 86400  # one day
        print 'sched_block_inspector_push_schedule'
        data = args[0]['newSchedule']
        self.redis.pipe.reset()
        self.redis.pipe.set(name='obs_block_update', data=data)
        # obs_block_ids = {"wait": [], "run": [], "done": [], "cancel": [], "fail": []}
        # new_blocks = []
        # for key in data:
        #     for i in range(len(data[key])):
        #         if self.redis.exists(data[key][i]["obs_block_id"]):
        #             obs_block_ids[data[key][i]['exe_state']['state']].append(data[key][i]["obs_block_id"])
        #             self.redis.pipe.set(
        #                 name=data[key][i]["obs_block_id"], data=data[key][i], expire_sec=self.expire_sec)
        #         else:
        #             new_blocks.append(data[key][i])
        # for key, val in obs_block_ids.items():
        #     self.redis.pipe.set(name='obs_block_ids_'+key, data=val)

        self.redis.pipe.execute()
        # print new_blocks

        self.socket_manager.socket_event_widgets(
            event_name="sched_block_controller_new_queue",
            data={},
            sess_ids=[self.socket_manager.sess_id],
            widget_ids=[self.widget_id]
        )

        return