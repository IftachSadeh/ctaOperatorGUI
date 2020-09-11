from datetime import timedelta
from datetime import datetime
from shared.utils import get_time_of_night
from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class CommentSched(BaseWidget):

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id=None, sm=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        # # widget-specific initialisations
        # self.block_keys = [['wait'], ['run'], ['done', 'cancel', 'fail']]
        # self.blocks = {}
        # for keys_now in self.block_keys:
        #     self.blocks[keys_now[0]] = []

        # self.time_of_night = {}

        # self.inst_health = []

        # self.tel_ids = self.sm.inst_data.get_inst_ids(
        #     inst_types=['LST', 'MST', 'SST']
        # )

        # # FIXME - need to add lock?
        # if len(self.inst_health) == 0:
        #     for id_now in self.tel_ids:
        #         self.inst_health.append({'id': id_now, 'val': 0})

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

    # ------------------------------------------------------------------
    async def back_from_offline(self, *args):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, args)

        return

    # ------------------------------------------------------------------
    async def get_data(self):
        # self.time_of_night = get_time_of_night(self)
        # time_of_night_date = {
        #     'date_start':
        #     datetime(2018, 9, 16, 21, 30).strftime('%Y-%m-%d %H:%M:%S'),
        #     'date_end': (
        #         datetime(2018, 9, 16, 21, 30)
        #         + timedelta(seconds=int(self.time_of_night['end']))
        #     ).strftime('%Y-%m-%d %H:%M:%S'),
        #     'date_now': (
        #         datetime(2018, 9, 16, 21, 30)
        #         + timedelta(seconds=int(self.time_of_night['now']))
        #     ).strftime('%Y-%m-%d %H:%M:%S'),
        #     'now':
        #     int(self.time_of_night['now']),
        #     'start':
        #     int(self.time_of_night['start']),
        #     'end':
        #     int(self.time_of_night['end'])
        # }

        # self.get_blocks()
        # self.get_tel_health()
        # self.get_events()
        # self.get_clock_events()

        # data = {
        #     'time_of_night': time_of_night_date,
        #     'inst_health': self.inst_health,
        #     'blocks': self.blocks,
        #     'external_events': self.external_events,
        #     'external_clock_events': self.external_clock_events
        # }

        # return data

        return {}

    # # ------------------------------------------------------------------
    # def get_events(self):
    #     pipe = self.redis.get_pipe()
    #     pipe.get(name='external_events')
    #     redis_data = pipe.execute()

    #     self.external_events = redis_data

    #     return

    # def get_clock_events(self):
    #     pipe = self.redis.get_pipe()
    #     pipe.get(name='external_clock_events')
    #     redis_data = pipe.execute()

    #     self.external_clock_events = redis_data

    #     return

    # # ------------------------------------------------------------------
    # def get_tel_health(self):
    #     pipe = self.redis.get_pipe()
    #     for id_now in self.tel_ids:
    #         pipe.h_get(name='inst_health;' + str(id_now), key='health')
    #     redis_data = pipe.execute()

    #     for i in range(len(redis_data)):
    #         id_now = self.tel_ids[i]
    #         self.inst_health[i]['val'] = redis_data[i]

    #     return

    # # ------------------------------------------------------------------
    # def get_blocks(self):
    #     for keys_now in self.block_keys:
    #         pipe = self.redis.get_pipe()
    #         for key in keys_now:
    #             pipe.get('obs_block_ids_' + key)

    #         data = pipe.execute()
    #         obs_block_ids = sum(data, [])  # flatten the list of lists

    #         pipe = self.redis.get_pipe()
    #         for obs_block_id in obs_block_ids:
    #             pipe.get(obs_block_id)

    #         key = keys_now[0]
    #         blocks = pipe.execute()

    #         self.blocks[key] = sorted(
    #             blocks, key=lambda a: float(a['time']['start'])
    #             # cmp=lambda a, b: int(a['time']['start']) - int(b['time']['start'])
    #         )

    #     return
