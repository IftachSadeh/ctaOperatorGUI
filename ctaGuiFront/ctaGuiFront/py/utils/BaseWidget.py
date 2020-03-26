from gevent.coros import BoundedSemaphore
from ctaGuiUtils.py.utils import my_log, my_assert
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
# BaseWidget
# ------------------------------------------------------------------
class BaseWidget():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # all session ids for this user/widget
    widget_group_sess = dict()

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id='', socket_manager=None, *args, **kwargs):
        # ------------------------------------------------------------------
        # standard initialisations
        # ------------------------------------------------------------------
        self.log = my_log(title=__name__)

        # the id of this instance
        self.widget_id = widget_id
        # the parent of this widget
        self.socket_manager = socket_manager
        # widget-class and widget group names
        self.widget_name = self.__class__.__name__
        # for common threading
        self.widget_group = (self.socket_manager.user_group_id + '_' + self.widget_name)
        # redis interface
        self.redis = RedisManager(name=self.widget_name, log=self.log)
        # turn on periodic data updates
        self.do_data_updates = True
        # some etra logging messages for this module
        self.log_send_packet = False
        # fixed or dynamic icon
        self.n_icon = -1
        # list of utility classes to loop over
        self.my_utils = []

        my_assert(
            log=self.log,
            state=(self.socket_manager is not None),
            msg=[' - no socket_manager handed to', self.__class__.__name__],
        )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        with self.socket_manager.lock:
            wgt = self.redis.hGet(
                name='all_widgets',
                key=self.widget_id,
                packed=True,
            )
            if self.n_icon == -1:
                self.n_icon = wgt['n_icon']

        # override the global logging variable with a
        # name corresponding to the current session id
        self.log = my_log(
            title=(
                str(self.socket_manager.user_id) 
                + '/' + str(self.socket_manager.sess_id)
                + '/' + __name__ + '/' + self.widget_id
            )
        )

        # loop over utils
        for util_now in self.my_utils:
            util_now.setup(args)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # loop over utils
        for util_now in self.my_utils:
            util_now.back_from_offline()

        return
