import os
import copy
import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from math import sqrt, ceil, floor
from datetime import datetime
import random
from random import Random
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import my_log, my_assert, delta_seconds, getTime
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
#  EmptyExample
# ------------------------------------------------------------------
class EmptyExample():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # all session ids for this user/widget
    widget_group_sess = dict()

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id="", socket_manager=None, *args, **kwargs):
        self.log = my_log(title=__name__)

        # the id of this instance
        self.widget_id = widget_id
        # the parent of this widget
        self.socket_manager = socket_manager
        my_assert(log=self.log, msg=[
               " - no socket_manager handed to", self.__class__.__name__], state=(self.socket_manager is not None))

        # widget-class and widget group names
        self.widget_name = self.__class__.__name__
        self.widget_group = self.socket_manager.user_group_id+''+self.widget_name

        self.redis = RedisManager(name=self.widget_name, log=self.log)

        # turn on periodic data updates
        self.do_data_updates = True
        # some etra logging messages for this module
        self.log_send_packet = False
        #
        self.n_icon = -1

        # self.tel_ids = self.socket_manager.InstData.get_inst_ids()

        return


    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        with self.socket_manager.lock:
            wgt = self.redis.hGet(
                name='all_widgets', key=self.widget_id, packed=True)
            self.n_icon = wgt["n_icon"]

        # override the global logging variable with a name corresponding to the current session id
        self.log = my_log(title=str(self.socket_manager.user_id)+"/" +
                         str(self.socket_manager.sess_id)+"/"+__name__+"/"+self.widget_id)

        # initial dataset and send to client
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.send_init_widget(opt_in=opt_in)

        # start a thread which will call update_data() and send 1Hz data updates to
        # all sessions in the group
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.socket_manager.add_widget_tread(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # with EmptyExample.lock:
        #   print '-- back_from_offline',self.widget_name, self.widget_id
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        data = {
            "rnd": Random(getTime()).random(), 'time': getTime()
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def send_rnd_message(self, data):
        # self.log.info([
        #     ['y', ' - got event: send_rnd_message('],
        #     ['g', str(data['myMessage'])], ['y', ")"]
        # ])

        return
