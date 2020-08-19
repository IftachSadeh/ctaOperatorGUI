from ctaGuiUtils.py.utils import get_time, get_rnd
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class EmptyExample(BaseWidget):

    # ------------------------------------------------------------------
    def __init__(self, widget_id="", socket_manager=None, *args, **kwargs):
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
        opt_in = {'widget': self, 'data_func': self.get_data}
        await self.socket_manager.send_widget_init_data(opt_in=opt_in)

        # start a thread which will call update_data() and send 1Hz data updates to
        # all sessions in the group
        opt_in = {'widget': self, 'loop_group': 'widget_id', 'data_func': self.get_data, 'sleep_sec': 5,}
        # opt_in = {'widget': self, 'loop_group': 'widget_name', 'data_func': self.get_data, 'sleep_sec': 5,}
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
    def get_data(self):
        data = {"rnd": get_rnd(), 'time': get_time('msec')}

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    async def send_rnd_message(self, data):
        # self.log.info([
        #     ['y', ' - got event: send_rnd_message('],
        #     ['g', str(data['myMessage'])], ['y', ")"]
        # ])

        return
