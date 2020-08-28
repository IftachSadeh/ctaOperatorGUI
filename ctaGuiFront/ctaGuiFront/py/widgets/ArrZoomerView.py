from ctaGuiFront.py.utils.ArrZoomer import ArrZoomer
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


class ArrZoomerView(BaseWidget):
    # ------------------------------------------------------------------
    def __init__(self, widget_id='', socket_manager=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            socket_manager=socket_manager,
        )

        # optionally turn off updates for debugging
        # self.do_data_updates = False

        # widget-specific initialisations
        self.ArrZoomer = ArrZoomer(parent=self)
        self.my_utils += [
            self.ArrZoomer,
        ]

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await BaseWidget.setup(self, *args)

        # send initialisation event. for this view, no data are sent, as
        # all the interesting stuff happens as part of the arr_zoomer_ask_for_init_data
        # event, which is part of the ArrZoomer utility
        opt_in = {
            'widget': self,
            'event_name': 'init_data',
        }
        await self.socket_manager.emit_widget_event(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    def back_from_offline(self):
        # standard common initialisations
        BaseWidget.back_from_offline(self)

        # with ArrZoomerView.lock:
        #     print('-- back_from_offline',self.widget_name,self.widget_id)
        return
