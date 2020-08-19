import importlib
# from random import Random
# from math import ceil
# import traceback
# try:
#     from gevent.coros import BoundedSemaphore
# except:
#     from gevent.lock import BoundedSemaphore
# from socketio.namespace import BaseNamespace
# from socketio.mixins import BroadcastMixin

# from ctaGuiUtils.py.LogParser import LogParser
# from ctaGuiUtils.py.utils import get_rnd_seed
from ctaGuiUtils.py.utils import get_time
from ctaGuiUtils.py.utils import get_rnd
# from ctaGuiUtils.py.RedisManager import RedisManager

import asyncio


class WidgetManager():

    # ------------------------------------------------------------------
    def check_panel_sync(self):
        """prevent panle sync based on a global setting & user-name
        """

        allow = False
        if self.allow_panel_sync:
            allow = (self.user_id != 'guest')

        return allow

    # ------------------------------------------------------------------
    async def widget(self, data_in):
        """general communication with a widget (will
           import and instantiate a class if needed)
        """

        # n_sess_try = 0
        # while self.sess_id is None:
        #     n_sess_try += 1
        #     if n_sess_try >= 20:
        #         self.log.warning([['rb', ' - ignoring zombie session - on_widget('],
        #                           ['yb', data_in], ['rb', ') !!!!!!!!']])
        #         return
        #     sleep(0.5)

        # basic widget info
        data = data_in['data']
        widget_id = data['widget_id']

        # dynamically load the module for the requested widget
        # (no need for a 'from dynamicLoadWidget import dynWidg_0' statement)
        # has_widget_id = self.redis.h_exists(name='ws;widget_infos', key=widget_id)
        async with await self.get_redis_lock('ws;lock'):
            async with await self.get_redis_lock('ws;lock;' + self.server_id):
                widget_inits = await self.get_server_attr(name='widget_inits')

            has_widget_id = widget_id in widget_inits
            if not has_widget_id:
                await self.init_widget(data_in)

        # call the method named args[1] with optional arguments args[2],
        # equivalent e.g., to widget.method_name(optionalArgs)
        if 'method_name' in data:
            async with await self.get_redis_lock('ws;lock;' + self.server_id):
                widget_inits = await self.get_server_attr(name='widget_inits')
            async with await self.get_redis_lock('ws;lock;' + self.sess_id):
                method_func = getattr(widget_inits[widget_id], data['method_name'])
                if 'method_arg' in data:
                    await method_func(data['method_arg'])
                else:
                    await method_func()

        return

    # ------------------------------------------------------------------
    async def init_widget(self, data_in):
        """importing the class for the widget and registring the id
        """

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('init_widget expected to be locked ?!?')

        data = data_in['data']
        widget_id = data['widget_id']
        widget_source = 'widgets.' + data['widget_source']
        widget_name = data['widget_name']
        n_sync_group = data['n_sync_group'] if 'n_sync_group' in data else 0
        sync_type = data['sync_type'] if 'sync_type' in data else 0

        if not self.check_panel_sync():
            n_sync_group = -1

        # the following is equivalent e.g., to:
        #   from dynamicLoadWidget import dynWidg_0
        #   widget = dynWidg_0(widget_id=widget_id, __old_SocketManager__=self)
        # widget_module = __import__(widget_source, globals=globals())
        widget_module = importlib.import_module(
            widget_source,
            package=None,
        )
        widget_cls = getattr(widget_module, widget_name)

        async with await self.get_redis_lock('ws;lock;' + self.server_id):
            widget_inits = await self.get_server_attr(name='widget_inits')
            widget_inits[widget_id] = widget_cls(widget_id=widget_id, socket_manager=self)

        # make sure the requested widget has been registered as a legitimate class
        is_not_synced = (widget_name in self.allowed_widget_types['not_synced'])
        is_synced = widget_name in self.allowed_widget_types['synced']
        if not (is_not_synced or is_synced):
            raise Exception(
                ' - widget_name =', widget_name,
                '' + 'has not been registered in allowed_widget_types'
            )

        # if this is not a synced panel, it has no sync group or icon
        if is_not_synced:
            n_sync_group = -1
            n_icon = -1

        # if it is a synced panel, derive the icon as the next one after all
        # existing panels
        if is_synced:
            n_icon = self.allowed_widget_types['synced'].index(widget_name)
            while True:
                user_widget_ids = self.redis.l_get('ws;user_widget_ids;' + self.user_id)
                if len(user_widget_ids) == 0:
                    break

                widget_infos = self.redis.h_m_get(
                    name='ws;widget_infos', key=user_widget_ids, filter=True
                )
                n_icons = [x['n_icon'] for x in widget_infos]

                if n_icon in n_icons:
                    n_icon += len(self.allowed_widget_types['synced'])
                else:
                    break

        # bookkeeping and future reference of the class we just loaded
        # ------------------------------------------------------------------
        widget_now = dict()
        widget_now['n_icon'] = n_icon
        widget_now['user_id'] = self.user_id
        widget_now['sess_id'] = self.sess_id
        widget_now['widget_name'] = widget_name
        widget_now['widget_state'] = dict()

        # register the new widget
        self.redis.h_set(name='ws;widget_infos', key=widget_id, data=widget_now)
        self.redis.r_push(name='ws;user_widget_ids;' + self.user_id, data=widget_id)
        self.redis.r_push(name='ws;sess_widget_ids;' + self.sess_id, data=widget_id)

        # sync group initialization
        # ------------------------------------------------------------------
        n_sync_group = min(max(n_sync_group, -1), 0)

        if sync_type > 2 or sync_type < 0:
            self.log.warning([[
                'rb', ' - sync_type = ', sync_type, ' too large - on_widget('
            ], ['yb', data], ['rb', ') !!!!!!!!']])
            sync_type = min(max(sync_type, 0), 2)

        if n_sync_group == 0:
            sync_groups = self.redis.h_get(
                name='ws;sync_groups', key=self.user_id, default_val=[]
            )

            # ------------------------------------------------------------------
            # add new empty sync group if needed
            # ------------------------------------------------------------------
            group_indices = []
            if len(sync_groups) > 0:
                group_indices = [
                    i for i, x in enumerate(sync_groups) if x['id'] == 'grp_0'
                ]
            if len(group_indices) > 0:
                group_index = group_indices[0]
            else:
                group_index = len(sync_groups)

                # the sync_group['id'] must correspond to the pattern defined
                # by the client for new groups (e.g., 'grp_0') !!!
                sync_group = dict()
                sync_group['id'] = 'grp_0'
                sync_group['title'] = 'Group 0'
                sync_group['sync_states'] = [[], [], []]
                sync_group['sync_types'] = dict()

                sync_groups.append(sync_group)

            # add the new widget to the requested sync group and sync state
            icon_id = 'icn_' + get_rnd(out_type=str)
            sync_groups[group_index]['sync_states'][sync_type].append([
                widget_id, icon_id
            ])

            self.redis.h_set(
                name='ws;sync_groups',
                key=self.user_id,
                data=sync_groups,
            )

        if n_sync_group != -1:
            await self.update_sync_group()

        return

    # ------------------------------------------------------------------
    async def update_sync_group(self):
        if not await self.is_redis_locked('ws;lock'):
            raise Exception('update_sync_group expected to be locked ?!?')

        async with await self.get_redis_lock('ws;lock;' + self.server_id):
            widget_inits = await self.get_server_attr(name='widget_inits')

            widget_ids = []
            widget_infos = self.redis.h_get_all(name='ws;widget_infos')
            for widget_id, widget_now in widget_infos.items():
                if widget_id in widget_inits:
                    if widget_now['n_icon'] == -1:
                        widget_ids.append(widget_id)

            for widget_id in widget_ids:
                getattr(widget_inits[widget_id], 'update_sync_groups')()

        return

    # ------------------------------------------------------------------
    async def send_widget_init_data(self, opt_in=None):
        """initial dataset and send to client
        """

        widget = opt_in['widget']
        data_func = (opt_in['data_func'] if 'data_func' in opt_in else lambda: dict())

        metadata = {
            'widget_type': widget.widget_name,
            'widget_id': widget.widget_id,
            'n_icon': widget.n_icon,
        }
        data = data_func()

        await self.emit_to_queue(event_name='init_data', data=data, metadata=metadata)

        return

    # ------------------------------------------------------------------
    async def add_widget_loop(self, opt_in=None):

        # =============================================================
        # =============================================================
        # =============================================================
        # =============================================================
        # cleanup of widget spawns
        # shared widget spawn ?!?
        # =============================================================
        # =============================================================
        # =============================================================
        # =============================================================

        widget = opt_in['widget']

        if 'event_name' not in opt_in.keys():
            opt_in['event_name'] = 'update_data'

        loop_func = (
            opt_in['loop_func'] if 'loop_func' in opt_in else self.basic_widget_loop
        )
        loop_id = (
            opt_in['loop_id'] if 'loop_id' in opt_in else
            str(get_time('msec') + self.rnd_gen.randint(0, 100000))
        )

        if opt_in['loop_group'] == 'widget_id':
            loop_group = 'ws;widget_id;' + widget.widget_id
        elif opt_in['loop_group'] == 'widget_name':
            loop_group = 'ws;widget_name;' + widget.widget_name
        else:
            raise Exception('unknown loop_group for: ', opt_in)

        loop_info = {
            'id': loop_id,
            'func': loop_func,
            'group': loop_group,
            'heartbeat': 'ws;sess_heartbeat;' + self.sess_id,
        }

        if not self.get_loop_state(loop_info):
            await self.set_loop_state(state=True, loop_info=loop_info)
            self.spawn(loop_info['func'], loop_info=loop_info, opt_in=opt_in)

        return

        if 0:

            if 'is_group_asy_func' not in opt_in:
                opt_in['is_group_asy_func'] = True

            widget = opt_in['widget']

            asy_func_group = (
                opt_in['asy_func_group'] if 'asy_func_group' in opt_in else 'update_data'
            )
            opt_in['asy_func_group'] = asy_func_group

            asy_func_func = opt_in['asy_func_func'] if 'asy_func_func' in opt_in else None
            if asy_func_func is None and asy_func_group == 'update_data':
                asy_func_func = self.widget_asy_func_func

            is_group_asy_func = opt_in['is_group_asy_func']

            with widget.lock:
                if is_group_asy_func:
                    if widget.widget_group not in widget.widget_group_sess:
                        widget.widget_group_sess[widget.widget_group] = []

                    widget.widget_group_sess[widget.widget_group].append(
                        widget.socket_manager.sess_id
                    )

                    if self.get_asy_func_id(widget.widget_group, asy_func_group) == -1:
                        with __old_SocketManager__.lock:
                            opt_in['asy_func_id'] = self.set_asy_func_state(
                                widget.widget_group, asy_func_group, True
                            )

                            gevent.spawn(asy_func_func, opt_in=opt_in)
                else:
                    if self.get_asy_func_id(widget.widget_id, asy_func_group) == -1:
                        with __old_SocketManager__.lock:
                            opt_in['asy_func_id'] = self.set_asy_func_state(
                                widget.widget_id, asy_func_group, True
                            )

                            gevent.spawn(asy_func_func, opt_in=opt_in)

            return

    # ------------------------------------------------------------------
    async def basic_widget_loop(self, loop_info, opt_in):

        self.log.info([
            ['y', ' - starting '],
            ['b', 'basic_widget_loop'],
            ['y', ' for widget_id: '],
            ['c', loop_info['group']],
            ['b', ' for event_name '],
            ['c', opt_in['event_name']],
        ])

        widget = opt_in['widget']
        event_name = opt_in['event_name']
        sleep_sec = (
            opt_in['sleep_sec'] if 'sleep_sec' in opt_in else self.basic_widget_sleep_sec
        )

        # if 'func_args' in opt_in.keys():
        #     def get_data():
        #         return opt_in['data_func'](opt_in['func_args'])
        # else:
        #     def get_data():
        #         return opt_in['data_func']()

        sess_widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)

        metadata = {
            'widget_type': widget.widget_name,
            'widget_id': widget.widget_id,
            'sess_widget_ids': sess_widget_ids,
        }

        while self.get_loop_state(loop_info):
            async with await self.get_redis_lock('ws;lock'):
                data = opt_in['data_func']()

                await self.emit_to_queue(
                    event_name=event_name,
                    data=data,
                    metadata=metadata,
                )

            await asyncio.sleep(sleep_sec)

        self.log.info([
            ['r', ' - ending '],
            ['b', 'basic_widget_loop'],
            ['r', ' for widget_id: '],
            ['c', loop_info['group']],
            ['r', ' for event_name '],
            ['c', opt_in['event_name']],
        ])

        return

    # ------------------------------------------------------------------
    async def set_active_widget(self, data_in):
        data = data_in['data']
        active_widget = self.redis.h_get(
            name='ws;active_widget', key=self.user_id, default_val=None
        )

        if active_widget != data['widget_id']:
            self.redis.h_set(
                name='ws;active_widget', key=self.user_id, data=data['widget_id']
            )

        return
