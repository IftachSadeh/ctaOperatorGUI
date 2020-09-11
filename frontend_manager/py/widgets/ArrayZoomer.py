from frontend_manager.py.utils.BaseWidget import BaseWidget


class ArrayZoomer(BaseWidget):
    # ------------------------------------------------------------------
    def __init__(self, widget_id='', sm=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        # optionally turn off updates for debugging
        # self.do_data_updates = False

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await BaseWidget.setup(self, args)

        # send initialisation event. for this view, no data are sent, as
        # all the interesting stuff happens as part of the arr_zoomer_ask_for_init_data
        # event, which is part of the ArrZoomerUtil utility
        opt_in = {
            'widget': self,
            'event_name': 'init_data',
        }
        await self.sm.emit_widget_event(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    async def back_from_offline(self, *args):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, args)

        return
