# from datetime import datetime, timedelta
# from shared.utils import get_time_of_night
from shared.utils import secs_to_datetime
from shared.ClockSim import get_clock_sim_data
from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
#  SchedBlocks
# ------------------------------------------------------------------
class SchedBlocks(BaseWidget):
    block_keys = [['wait'], ['run'], ['done', 'cancel', 'fail']]
    blocks = {}
    for keys_now in block_keys:
        blocks[keys_now[0]] = []

    time_of_night = {}
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
        if len(SchedBlocks.inst_health) == 0:
            for id_now in self.tel_ids:
                SchedBlocks.inst_health.append({"id": id_now, "val": 0})

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
    async def back_from_offline(self, data):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, data)

        # with SchedBlocks.lock:
        #     print('-- back_from_offline',self.widget_type,self.widget_id)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        self.get_blocks()
        self.get_events()
        self.get_clock_events()
        self.get_tel_health()

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

        # SchedBlocks.time_of_night = get_time_of_night(self)

        # #  int(time.mktime(datetime(2018, 9, 16, 21, 30).timetuple()))
        # time_of_night_date = {
        #     "date_start":
        #     datetime(2018, 9, 16, 21, 30).strftime('%Y-%m-%d %H:%M:%S'),
        #     "date_end": (
        #         datetime(2018, 9, 16, 21, 30)
        #         + timedelta(seconds=int(SchedBlocks.time_of_night['end']))
        #     ).strftime('%Y-%m-%d %H:%M:%S'),
        #     "date_now": (
        #         datetime(2018, 9, 16, 21, 30)
        #         + timedelta(seconds=int(SchedBlocks.time_of_night['now']))
        #     ).strftime('%Y-%m-%d %H:%M:%S'),
        #     "now":
        #     int(SchedBlocks.time_of_night['now']),
        #     "start":
        #     int(SchedBlocks.time_of_night['start']),
        #     "end":
        #     int(SchedBlocks.time_of_night['end'])
        # }

        data = {
            "time_of_night": time_of_night_date,
            "inst_health": SchedBlocks.inst_health,
            "tel_ids": self.tel_ids,
            "blocks": SchedBlocks.blocks,
            "external_events": SchedBlocks.external_events,
            "external_clock_events": SchedBlocks.external_clock_events
        }

        return data

    def get_tel_health(self):
        self.redis.pipe.reset()
        for id_now in self.tel_ids:
            self.redis.pipe.h_get(name="inst_health;" + str(id_now), key="health")
        redis_data = self.redis.pipe.execute()

        for i in range(len(redis_data)):
            id_now = self.tel_ids[i]
            SchedBlocks.inst_health[i]["val"] = redis_data[i]

        return

    def get_events(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_events")
        redis_data = self.redis.pipe.execute()

        SchedBlocks.external_events = redis_data

        return

    def get_clock_events(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_clock_events")
        redis_data = self.redis.pipe.execute()

        SchedBlocks.external_clock_events = redis_data

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_blocks(self):
        for keys_now in SchedBlocks.block_keys:
            self.redis.pipe.reset()
            for key in keys_now:
                self.redis.pipe.get('obs_block_ids_' + key)

            data = self.redis.pipe.execute()
            obs_block_ids = sum(data, [])  # flatten the list of lists
            # obs_block_ids = [] if data is None else sum(data, []) # flatten the list of lists

            self.redis.pipe.reset()
            for obs_block_id in obs_block_ids:
                self.redis.pipe.get(obs_block_id)

            key = keys_now[0]
            blocks = self.redis.pipe.execute()
            SchedBlocks.blocks[key] = sorted(
                blocks,
                cmp=lambda a, b: int(a['time']['start']) - int(b['time']['start'])
            )

        # SchedBlocks.blocks['run'] = SchedBlocks.blocks['wait'][0:6]
        # for bb in (SchedBlocks.blocks['run']):
        #   bb['exe_state']['state'] = 'run'
        # self.do_data_updates = False

        # self.redis.pipe.reset()
        # self.redis.pipe.get('obs_block_ids_'+'wait')
        # self.redis.pipe.get('obs_block_ids_'+'run')
        # self.redis.pipe.get('obs_block_ids_'+'done')
        # self.redis.pipe.get('obs_block_ids_'+'cancel')
        # self.redis.pipe.get('obs_block_ids_'+'fail')

        # data = self.redis.pipe.execute()
        # obs_block_ids = sum(data, [])  # flatten the list of lists
        # # print 'wwwwwwww',obs_block_ids
        # # obs_block_ids = self.redis.get(key=('obs_block_ids_'+'all'), default_val=[])
        # # print 'xxxxxxxx',obs_block_ids

        # self.redis.pipe.reset()
        # for obs_block_id in obs_block_ids:
        #     self.redis.pipe.get(obs_block_id)

        # blocks = self.redis.pipe.execute()
        # SchedBlocks.blocks = sorted(blocks, cmp=lambda a, b: int(
        #     a['timestamp']) - int(b['timestamp']))
        # # print SchedBlocks.blocks

        # # dur = [x['duration'] for x in SchedBlocks.blocks] ; print dur

        # # SchedBlocks.blocks = [ unpackb(x) for x in redis_data ]

        # # SchedBlocks.blocks = []
        # # for block in redis_data:
        # #   SchedBlocks.blocks.append(unpackb(block))

        # # self.sortBlocks()

        # # if len(SchedBlocks.blocks) > 10: SchedBlocks.blocks = SchedBlocks.blocks[0:9]
        # # # if len(SchedBlocks.blocks) > 25: SchedBlocks.blocks = SchedBlocks.blocks[0:14]
        # # if len(SchedBlocks.blocks) > 20: SchedBlocks.blocks = SchedBlocks.blocks[0:13]
        # # print SchedBlocks.blocks
        # # # for bb in range(9):
        # # for bb in range(25):
        # #   if len(SchedBlocks.blocks) <= bb: break
        # #   # SchedBlocks.blocks[bb]['exe_state'] = 'done'
        # #   SchedBlocks.blocks[bb]['exe_state'] = 'run'
        # #   print SchedBlocks.blocks[bb]
        # # SchedBlocks.blocks[bb]['run_phase'] = ['run_take_data']
        # #   # SchedBlocks.blocks[bb]['run_phase'] = ['run_config_mount']
        # #   # print SchedBlocks.blocks[bb]
        # #   # if bb < 10: SchedBlocks.blocks[bb]['exe_state'] = 'run'
        # #   # else:     SchedBlocks.blocks[bb]['exe_state'] = 'wait'

        return
