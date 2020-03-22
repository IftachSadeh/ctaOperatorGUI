from gevent.coros import BoundedSemaphore
from ctaGuiUtils.py.utils import my_log, my_assert, get_time_of_night
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
#  NightSched
# ------------------------------------------------------------------
class NightSched():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # all session ids for this user/widget
    widget_group_sess = dict()

    block_keys = [['wait'], ['run'], ['done', 'cancel', 'fail']]
    blocks = {}
    for keys_now in block_keys:
        blocks[keys_now[0]] = []

    time_of_night = {}

    inst_health = []

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id="", SockManager=None, *args, **kwargs):
        self.log = my_log(title=__name__)

        # the id of this instance
        self.widget_id = widget_id
        # the parent of this widget
        self.SockManager = SockManager
        my_assert(log=self.log,
               msg=[" - no SockManager handed to", self.__class__.__name__],
               state=(self.SockManager is not None))

        # widget-class and widget group names
        self.widget_name = self.__class__.__name__
        self.widget_group = self.SockManager.user_group_id+''+self.widget_name

        self.redis = RedisManager(name=self.widget_name, log=self.log)

        # # turn on periodic data updates
        # self.do_data_updates = True
        # # some etra logging messages for this module
        # self.log_send_packet =  False
        self.n_icon = -1

        # self.tel_ids = self.SockManager.InstData.get_inst_ids()
        self.tel_ids = self.SockManager.InstData.get_inst_ids(
            inst_types=['LST', 'MST', 'SST']
        )

        # ------------------------------------------------------------------
        # need to add lock ?!?!?!?!?
        # ------------------------------------------------------------------
        if len(NightSched.inst_health) == 0:
            for id_now in self.tel_ids:
                NightSched.inst_health.append({"id": id_now, "val": 0})

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        with self.SockManager.lock:
            wgt = self.redis.hGet(
                name='all_widgets', key=self.widget_id, packed=True)
            self.n_icon = wgt["n_icon"]

        # override the global logging variable with a name
        # corresponding to the current session id
        self.log = my_log(title=str(self.SockManager.user_id) + "/" +
                         str(self.SockManager.sess_id) + "/" + __name__ + "/"
                         + self.widget_id)

        # initial dataset and send to client
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.SockManager.send_init_widget(opt_in=opt_in)

        # start a thread which will call update_data() and send
        # 1Hz data updates to all sessions in the group
        opt_in = {'widget': self, 'data_func': self.get_data}
        self.SockManager.add_widget_tread(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # with NightSched.lock:
        #   print '-- back_from_offline',self.widget_name, self.widget_id
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_data(self):
        NightSched.time_of_night = get_time_of_night(self)

        self.get_blocks()
        self.get_tel_health()

        data = {
            "time_of_night": NightSched.time_of_night,
            "inst_health": NightSched.inst_health,
            "blocks": NightSched.blocks
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_tel_health(self):
        self.redis.pipe.reset()
        for id_now in self.tel_ids:
            self.redis.pipe.hGet(name="inst_health;"+str(id_now), key="health")
        redis_data = self.redis.pipe.execute()

        for i in range(len(redis_data)):
            id_now = self.tel_ids[i]
            NightSched.inst_health[i]["val"] = redis_data[i]

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_blocks(self):
        for keys_now in NightSched.block_keys:
            self.redis.pipe.reset()
            for key in keys_now:
                self.redis.pipe.get('obs_block_ids_'+key)

            data = self.redis.pipe.execute(packed=True)
            obs_block_ids = sum(data, [])  # flatten the list of lists

            self.redis.pipe.reset()
            for obs_block_id in obs_block_ids:
                self.redis.pipe.get(obs_block_id)

            key = keys_now[0]
            blocks = self.redis.pipe.execute(packed=True)
            NightSched.blocks[key] = sorted(
                blocks,
                cmp=lambda a, b: int(a['time']['start']) - int(b['time']['start'])
            )

        return