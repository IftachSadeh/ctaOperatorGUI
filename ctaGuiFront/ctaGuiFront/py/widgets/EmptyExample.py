from ctaGuiUtils.py.utils import get_time, get_rnd
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class EmptyExample(BaseWidget):

    # ------------------------------------------------------------------
    def __init__(self, widget_id='', socket_manager=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            socket_manager=socket_manager,
        )

        # widget-specific initialisations
        pass

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        BaseWidget.setup(self, *args)

        # initial dataset and send to client
        opt_in = {
            'widget': self,
            'event_name': 'init_data',
            'data_func': self.get_data_widget_id,
            'loop_id': 'init_data'
        }
        await self.socket_manager.emit_widget_event(opt_in=opt_in)

        # start a thread which will call update_data() and send 1Hz data updates to
        # all sessions in the group
        opt_in = {
            'widget': self,
            'loop_group': 'widget_id',
            'data_func': self.get_data_widget_id,
            'sleep_sec': 3,
            'loop_id': 'update_data_widget_id',
            'event_name': 'update_data',
        }
        await self.socket_manager.add_widget_loop(opt_in=opt_in)

        opt_in = {
            'widget': self,
            'loop_group': 'widget_name',
            'data_func': self.get_data_widget_name,
            'sleep_sec': 5,
            'loop_id': 'update_data_widget_name',
            'event_name': 'update_data_widget_name',
        }
        await self.socket_manager.add_widget_loop(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    def back_from_offline(self):
        # standard common initialisations
        BaseWidget.back_from_offline(self)

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
                           ['g', str(data['my_message'])], ['y', ")"]])
        return
