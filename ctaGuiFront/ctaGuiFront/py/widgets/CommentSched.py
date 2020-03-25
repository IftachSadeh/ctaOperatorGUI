from datetime import timedelta
from datetime import datetime
from ctaGuiUtils.py.utils import get_time_of_night
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
#  CommentSched
# ------------------------------------------------------------------
class CommentSched(BaseWidget):
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
        # self.tel_ids = self.socket_manager.InstData.get_inst_ids()
        self.tel_ids = self.socket_manager.InstData.get_inst_ids(
            inst_types=['LST', 'MST', 'SST']
        )

        # FIXME - need to add lock?
        if len(CommentSched.inst_health) == 0:
            for id_now in self.tel_ids:
                CommentSched.inst_health.append({"id": id_now, "val": 0})

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        # standard common initialisations
        BaseWidget.setup(self, *args)

        # initial dataset and send to client
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.send_init_widget(opt_in=opt_in)

        # start a thread which will call update_data() and send
        # 1Hz data updates to all sessions in the group
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.add_widget_tread(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # standard common initialisations
        BaseWidget.back_from_offline(self)

        # with CommentSched.lock:
        #     print('-- back_from_offline',self.widget_name,self.widget_id)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        CommentSched.time_of_night = get_time_of_night(self)
        time_of_night_date = {
            "date_start":
            datetime(2018, 9, 16, 21, 30).strftime('%Y-%m-%d %H:%M:%S'),
            "date_end": (
                datetime(2018, 9, 16, 21, 30)
                + timedelta(seconds=int(CommentSched.time_of_night['end']))
            ).strftime('%Y-%m-%d %H:%M:%S'),
            "date_now": (
                datetime(2018, 9, 16, 21, 30)
                + timedelta(seconds=int(CommentSched.time_of_night['now']))
            ).strftime('%Y-%m-%d %H:%M:%S'),
            "now":
            int(CommentSched.time_of_night['now']),
            "start":
            int(CommentSched.time_of_night['start']),
            "end":
            int(CommentSched.time_of_night['end'])
        }

        self.get_blocks()
        self.get_tel_health()
        self.get_events()
        self.get_clock_events()

        data = {
            "time_of_night": time_of_night_date,
            "inst_health": CommentSched.inst_health,
            "blocks": CommentSched.blocks,
            "external_events": CommentSched.external_events,
            "external_clock_events": CommentSched.external_clock_events
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_events(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_events")
        redis_data = self.redis.pipe.execute(packed=True)

        CommentSched.external_events = redis_data

        return

    def get_clock_events(self):
        self.redis.pipe.reset()
        self.redis.pipe.get(name="external_clock_events")
        redis_data = self.redis.pipe.execute(packed=True)

        CommentSched.external_clock_events = redis_data

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_health(self):
        self.redis.pipe.reset()
        for id_now in self.tel_ids:
            self.redis.pipe.hGet(name="inst_health;" + str(id_now), key="health")
        redis_data = self.redis.pipe.execute()

        for i in range(len(redis_data)):
            id_now = self.tel_ids[i]
            CommentSched.inst_health[i]["val"] = redis_data[i]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_blocks(self):
        for keys_now in CommentSched.block_keys:
            self.redis.pipe.reset()
            for key in keys_now:
                self.redis.pipe.get('obs_block_ids_' + key)

            data = self.redis.pipe.execute(packed=True)
            obs_block_ids = sum(data, [])  # flatten the list of lists

            self.redis.pipe.reset()
            for obs_block_id in obs_block_ids:
                self.redis.pipe.get(obs_block_id)

            key = keys_now[0]
            blocks = self.redis.pipe.execute(packed=True)
            CommentSched.blocks[key] = sorted(
                blocks,
                #cmp=lambda a, b: int((datetime.strptime(a['startTime'],"%Y-%m-%d %H:%M:%S") - datetime.strptime(b['startTime'],"%Y-%m-%d %H:%M:%S")).total_seconds())
                cmp=lambda a, b: int(a['time']['start']) - \
                int(b['time']['start'])
            )

        return
