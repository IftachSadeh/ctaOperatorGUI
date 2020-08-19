from ctaGuiFront.py.utils.ArrZoomer import ArrZoomer
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
# ArrZoomerView
# ------------------------------------------------------------------
class ArrZoomerView(BaseWidget):
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id='', socket_manager=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            socket_manager=socket_manager,
        )

        # ------------------------------------------------------------------
        # widget-specific initialisations
        # ------------------------------------------------------------------
        self.ArrZoomer = ArrZoomer(parent=self)
        self.my_utils += [self.ArrZoomer]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        # standard common initialisations
        BaseWidget.setup(self, *args)

        # initial dataset and send to client
        opt_in = {'widget': self}
        self.socket_manager.send_widget_init_data(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # standard common initialisations
        BaseWidget.back_from_offline(self)

        # with ArrZoomerView.lock:
        #     print('-- back_from_offline',self.widget_name,self.widget_id)
        return
