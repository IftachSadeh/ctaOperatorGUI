import gevent
from gevent import sleep

import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.utils import my_log
from ctaGuiUtils.py.RedisManager import RedisManager

from msgpack import packb
from msgpack import unpackb


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class PubsubTest():
    def __init__(self, site_type):
        self.log = my_log(title=__name__)
        self.log.info([['y', " - PubsubTest - "], ['g', site_type]])

        self.class_name = self.__class__.__name__
        self.redis = RedisManager(
            name=self.class_name, port=utils.redis_port, log=self.log
        )

        gevent.spawn(self.loop)
        gevent.spawn(self.exe_func_loop)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def ask_data(self, rnd_seed=-1):
        self.log.info([['y', " --------------------------------------------"]])
        self.log.info([['g', " - PubsubTest.ask_data -  "], ['p', rnd_seed]])

        args = {"func_name": "test_func", "arg0": rnd_seed}
        self.redis.publish(channel="exe_func_loop", message=packb(args))

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def exe_func_loop(self):
        self.log.info([['g', " - starting PubsubTest.exe_func_loop ..."]])

        redis_pubsub = None
        while True:
            while redis_pubsub is None:
                redis_pubsub = self.redis.set_pubsub("exe_func_loop")
                sleep(0.5)

            msg = self.redis.get_pubsub("exe_func_loop")
            if msg:
                args = unpackb(msg["data"])

                # call as blocking
                getattr(self, args["func_name"])(args)

                # call as non-blocking
                def exe_async_func(args):
                    getattr(self, args["func_name"])(args)

                gevent.spawn(exe_async_func, args)

            sleep(0.01)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def test_func(self, args=None):
        self.log.info([['g', " - PubsubTest.test_func - "], ['p', args["arg0"]]])
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def loop(self):
        self.log.info([['g', " - starting PubsubTest.loop ..."]])
        sleep(2)

        rnd_seed = 9823987423
        while True:
            self.ask_data(rnd_seed=rnd_seed)

            rnd_seed += 1
            sleep(2)

        return
