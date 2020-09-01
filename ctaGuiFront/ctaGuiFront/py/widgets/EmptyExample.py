from ctaGuiUtils.py.utils import get_time, get_rnd
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class EmptyExample(BaseWidget):

    # ------------------------------------------------------------------
    def __init__(self, widget_id='', sm=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        # widget-specific initialisations
        pass

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await BaseWidget.setup(self, *args)

        # initialise dataset and send to client
        opt_in = {
            'widget': self,
            'event_name': 'init_data',
            'data_func': self.get_data_widget_id,
        }
        await self.sm.emit_widget_event(opt_in=opt_in)

        # start a loop which will call get_data_widget_id() and send updates to
        # all sessions in the group
        opt_in = {
            'widget': self,
            'loop_group': 'widget_id',
            'data_func': self.get_data_widget_id,
            'sleep_sec': 3,
            'loop_id': 'update_data_widget_id',
            'event_name': 'update_data_by_widget_id',
        }
        await self.sm.add_widget_loop(opt_in=opt_in)

        opt_in = {
            'widget': self,
            'loop_group': 'widget_name',
            'data_func': self.get_data_widget_name,
            'sleep_sec': 5,
            'loop_id': 'update_data_all_widgets',
            'event_name': 'update_data_all_widgets',
        }
        await self.sm.add_widget_loop(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    async def back_from_offline(self, data):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, data)

        # additional custom stuff
        pass

        return

    # ------------------------------------------------------------------
    async def get_data_widget_id(self):
        data = {
            'rnd': get_rnd(),
            'time': get_time('msec'),
            'n_circ': 0,
            'anim_speed': 500,
        }
        return data

    # ------------------------------------------------------------------
    async def get_data_widget_name(self):
        data = {
            'rnd': get_rnd(),
            'time': get_time('msec'),
            'n_circ': 1,
            'anim_speed': 500,
        }
        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    async def send_rnd_message(self, data):
        debug_msg = False
        if debug_msg:
            self.log.info([['y', ' - got event: send_rnd_message('],
                           ['g', str(data['my_message'])], ['y', ')'],])
        return
