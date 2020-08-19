# try:
#     from gevent.coros import BoundedSemaphore
# except:
#     from gevent.lock import BoundedSemaphore
from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
class BaseWidget():
    # all session ids for this user/widget
    widget_group_sess = dict()

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id='', socket_manager=None, *args, **kwargs):
        self.log = LogParser(base_config=socket_manager.base_config, title=__name__)

        # the id of this instance
        self.widget_id = widget_id
        # the parent of this widget
        self.socket_manager = socket_manager
        # the shared basic configuration class
        self.base_config = self.socket_manager.base_config
        # widget-class and widget group names
        self.widget_name = self.__class__.__name__
        # for common threading
        self.widget_group = (self.socket_manager.user_group_id + '_' + self.widget_name)
        # redis interface
        redis_port = self.base_config.redis_port
        self.redis = RedisManager(name=self.widget_name, port=redis_port, log=self.log)
        # turn on periodic data updates
        self.do_data_updates = True
        # some etra logging messages for this module
        self.log_send_packet = False
        # fixed or dynamic icon
        self.n_icon = -1
        # list of utility classes to loop over
        self.my_utils = []

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        wgt = self.redis.h_get(name='ws;widget_infos', key=self.widget_id)
        if self.n_icon == -1:
            self.n_icon = wgt['n_icon']

        # override the global logging variable with a
        # name corresponding to the current session id
        self.log = LogParser(
            base_config=self.base_config,
            title=(
                str(self.socket_manager.user_id) + '/' + str(self.socket_manager.sess_id)
                + '/' + __name__ + '/' + self.widget_id
            ),
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
