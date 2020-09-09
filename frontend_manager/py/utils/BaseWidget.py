import importlib
from math import ceil

from shared.LogParser import LogParser
from shared.RedisManager import RedisManager


# ------------------------------------------------------------------
class BaseWidget():
    # all session ids for this user/widget
    widget_group_sess = dict()

    # ------------------------------------------------------------------
    def __init__(self, widget_id=None, sm=None, *args, **kwargs):
        self.log = LogParser(base_config=sm.base_config, title=__name__)

        # the parent of this widget
        self.sm = sm
        # the shared basic configuration class
        self.base_config = self.sm.base_config

        # the id of this instance
        self.widget_id = widget_id
        # widget-class and widget group names
        self.widget_type = self.__class__.__name__
        # for common threading
        self.widget_group = self.sm.user_group_id + '_' + self.widget_type

        # redis interface
        self.redis = RedisManager(
            name=self.widget_type, base_config=self.base_config, log=self.log
        )

        # turn on periodic data updates
        self.do_data_updates = True
        # some etra logging messages for this module
        self.log_send_packet = False

        # fixed or dynamic icon
        self.n_icon = -1
        self.icon_id = -1

        # list of utility classes to loop over
        self.my_utils = dict()

        # arguments given to the setup function, to later be
        # passed to utils if needed
        self.setup_args = None

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        self.setup_args = args

        widget_info = self.redis.h_get(name='ws;widget_info', key=self.widget_id)
        if self.n_icon == -1:
            self.n_icon = widget_info['n_icon']
            self.icon_id = widget_info['icon_id']

        # override the global logging variable with a
        # name corresponding to the current session id
        self.log = LogParser(
            base_config=self.base_config,
            title=(
                str(self.sm.user_id) + '/' + str(self.sm.sess_id) + '/' + __name__ + '/'
                + self.widget_id
            ),
        )

        return

    # ------------------------------------------------------------------
    async def util_setup(self, data):
        """load a utility class and set it up
        """

        util_id = data['util_id']
        util_type = data['util_type']

        self.log.debug([
            ['b', ' - util_setup: '],
            ['y', util_type],
            ['b', ' with '],
            ['y', util_id],
            ['b', ' to '],
            ['o', self.widget_id],
        ])

        # dynamic loading of the module
        util_source = self.sm.util_module_dir + '.' + util_type
        util_module = importlib.import_module(util_source, package=None)
        util_cls = getattr(util_module, util_type)

        # instantiate the util class
        self.my_utils[util_id] = util_cls(util_id=util_id, parent=self)

        # add a lock for initialisation. needed in case of restoration
        # of sessions, in order to make sure the initialisation
        # method is called before any other
        expire_sec = self.my_utils[util_id].sm.get_expite_sec(name='widget_init_expire')

        self.my_utils[util_id].locker.semaphores.add(
            name=self.get_util_lock_name(util_id),
            key=util_id,
            expire_sec=expire_sec,
        )

        # run the setup function of the util
        await self.my_utils[util_id].setup(self.setup_args)

        widget_info = self.redis.h_get(name='ws;widget_info', key=self.widget_id)
        if util_id not in widget_info['util_ids']:
            widget_info['util_ids'] += [util_id]

        self.redis.h_set(name='ws;widget_info', key=self.widget_id, data=widget_info)

        return

    # ------------------------------------------------------------------
    async def util_func(self, data):
        """execute util methods following client events
        """

        util_id = data['util_id']
        method_name = data['method_name']
        method_args = data['method_args'] if 'method_args' in data else dict()

        # is this the initialisation method
        is_init_func = (method_name == 'util_init')

        # in case this is the first call, the util should be loaded
        if util_id not in self.my_utils:
            await self.util_setup(data)

            # if the first call is not the initialisation method, this is probably
            # a restored session. in this case we send the client a request to
            # send the initialisation method request, and the current method call will
            # be blocked by the initialisation lock
            if not is_init_func:
                opt_in = {
                    'widget': self,
                    'event_name': ('ask_init_util;' + util_id),
                }
                await self.sm.emit_widget_event(opt_in=opt_in)

        # block non-initialisation calls if initialisation has not finished yet
        if not is_init_func:
            max_lock_sec = self.sm.get_expite_sec(
                name='widget_init_expire',
                is_lock_check=True,
            )
            await self.my_utils[util_id].locker.semaphores.async_block(
                is_locked=await self.is_util_init_locked(util_id),
                max_lock_sec=max_lock_sec,
            )

        # execute the requested method
        init_func = getattr(self.my_utils[util_id], method_name)
        await init_func(method_args)

        # remove the initialisation lock
        if is_init_func:
            self.my_utils[util_id].locker.semaphores.remove(
                name=self.get_util_lock_name(util_id),
                key=util_id,
            )

        return

    # ------------------------------------------------------------------
    def get_util_lock_name(self, util_id):
        """a unique name for initialisation locking
        """

        lock_name = (
            'ws;base_widget;util_func;' + self.my_utils[util_id].class_name + ';'
            + self.my_utils[util_id].util_id
        )

        return lock_name

    # ------------------------------------------------------------------
    async def is_util_init_locked(self, util_id):
        """a function which checks if the initialisation is locked
        """
        async def is_locked():
            locked = self.my_utils[util_id].locker.semaphores.check(
                name=self.get_util_lock_name(util_id),
                key=util_id,
            )
            return locked

        return is_locked

    # ------------------------------------------------------------------
    async def back_from_offline(self, *args):
        """interface function for back-from-offline events
        """

        # check if any util is missing (e.g., in case we are back
        # after a session recovery) and ask the client to respond

        widget_info = self.redis.h_get(name='ws;widget_info', key=self.widget_id)
        util_ids = widget_info['util_ids']
        util_ids = [u for u in util_ids if u not in self.my_utils.keys()]

        for util_id in util_ids:
            opt_in = {
                'widget': self,
                'event_name': ('ask_init_util;' + util_id),
            }
            await self.sm.emit_widget_event(opt_in=opt_in)

        # loop over utils
        for util_now in self.my_utils.values():
            await util_now.back_from_offline(args)

        return
