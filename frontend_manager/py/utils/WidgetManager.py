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

# from shared.LogParser import LogParser
# from shared.utils import get_rnd_seed
from shared.utils import get_time
from shared.utils import get_rnd
# from shared.RedisManager import RedisManager

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

        # basic widget info
        data = data_in['data']
        widget_id = data['widget_id']

        # dynamically load the module for the requested widget
        # (no need for a 'from dynamicLoadWidget import dynWidg_0' statement)
        async with self.locker.locks.acquire('serv'):
            widget_inits = await self.get_server_attr(name='widget_inits')

        has_widget_id = (widget_id in widget_inits)
        if not has_widget_id:
            await self.init_widget(data_in)

        # self.log.info([
        #     ['r', ' - KMKMKMKM '], ['y', data['method_name']]
        # ])

        # call the method named args[1] with optional arguments args[2],
        # equivalent e.g., to widget.method_name(optionalArgs)
        if 'method_name' in data:
            try:
                async with self.locker.locks.acquire('serv'):
                    widget_inits = await self.get_server_attr(name='widget_inits')
                    method_func = getattr(widget_inits[widget_id], data['method_name'])

                if 'method_args' in data:
                    await method_func(data['method_args'])
                else:
                    await method_func()
            except Exception as e:
                self.log.error([
                    ['r', ' - problem with method_name: '],
                    ['y', data['method_name'], ''],
                    ['o', data],
                ])
                raise e

        return

    # ------------------------------------------------------------------
    async def init_widget(self, data_in):
        """importing the class for the widget and registring the id
        """

        async with self.locker.locks.acquire('sess'):
            data = data_in['data']
            widget_id = data['widget_id']
            widget_type = data['widget_type']
            widget_source = self.widget_module_dir + '.' + widget_type
            n_icon = data['n_icon']
            icon_id = data['icon_id']
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
            widget_cls = getattr(widget_module, widget_type)

            async with self.locker.locks.acquire('serv'):
                widget_inits = await self.get_server_attr(name='widget_inits')
                widget_inits[widget_id] = widget_cls(widget_id=widget_id, sm=self)

            # make sure the requested widget has been registered as a legitimate class
            is_not_synced = (widget_type in self.allowed_widget_types['not_synced'])
            is_synced = widget_type in self.allowed_widget_types['synced']
            if not (is_not_synced or is_synced):
                raise Exception(
                    ' - widget_type =', widget_type,
                    '' + 'has not been registered in allowed_widget_types'
                )

            # allow for the possibility of a restored session, where the icon has
            # already been defined
            if n_icon < 0:
                icon_id = self.icon_prefix + get_rnd(n_digits=6, out_type=str)

            # if this is not a synced panel, it has no sync group or icon
            if is_not_synced:
                n_sync_group = -1
                n_icon = -1

            # if it is a synced panel, derive the icon as the next one after all
            # existing panels
            if is_synced and n_icon < 0:
                n_icon = self.allowed_widget_types['synced'].index(widget_type)
                while True:
                    user_widget_ids = self.redis.l_get(
                        'ws;user_widget_ids;' + self.user_id
                    )
                    if len(user_widget_ids) == 0:
                        break

                    widget_info = self.redis.h_m_get(
                        name='ws;widget_info', keys=user_widget_ids, filter_out=True
                    )
                    n_icons = [x['n_icon'] for x in widget_info]

                    if n_icon in n_icons:
                        n_icon += len(self.allowed_widget_types['synced'])
                    else:
                        break

            # bookkeeping and future reference of the class we just loaded
            # ------------------------------------------------------------------
            widget_now = dict()
            widget_now['n_icon'] = n_icon
            widget_now['icon_id'] = icon_id
            widget_now['user_id'] = self.user_id
            widget_now['sess_id'] = self.sess_id
            widget_now['widget_type'] = widget_type
            widget_now['widget_state'] = dict()
            widget_now['util_ids'] = []

            # register the new widget
            self.redis.h_set(name='ws;widget_info', key=widget_id, data=widget_now)
            self.redis.r_push(name='ws;user_widget_ids;' + self.user_id, data=widget_id)
            self.redis.r_push(name='ws;sess_widget_ids;' + self.sess_id, data=widget_id)

            # sync group initialization
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

                # add new empty sync group if needed
                group_indices = []
                if len(sync_groups) > 0:
                    group_indices = [
                        i for (i, x) in enumerate(sync_groups)
                        if x['id'] == self.sync_group_prefix + str(n_sync_group)
                    ]
                if len(group_indices) > 0:
                    group_index = group_indices[0]
                else:
                    group_index = len(sync_groups)

                    # the sync_group['id'] must correspond to the pattern defined
                    # by the client for new groups (e.g., 'grp_0') !!!
                    sync_group = dict()
                    sync_group['id'] = self.sync_group_prefix + str(n_sync_group)
                    sync_group['title'] = 'Group 0'
                    sync_group['sync_states'] = [[], [], []]
                    sync_group['sync_types'] = dict()

                    sync_groups.append(sync_group)

                # add the new widget to the requested sync group and sync state
                sync_groups[group_index]['sync_states'][sync_type].append([
                    widget_id, icon_id
                ])

                self.redis.h_set(
                    name='ws;sync_groups',
                    key=self.user_id,
                    data=sync_groups,
                )

        if widget_type in ['PanelSync']:
            await self.update_sync_group()

        return

    # ------------------------------------------------------------------
    async def update_sync_group(self):

        # print('lock for update_sync_group !?')

        # async with self.locker.locks.acquire('serv'):
        widget_inits = await self.get_server_attr(name='widget_inits')

        widget_ids = []
        widget_info = self.redis.h_get_all(name='ws;widget_info', default_val={})
        for widget_id, widget_now in widget_info.items():
            if widget_id in widget_inits:
                if widget_now['n_icon'] == -1:
                    widget_ids.append(widget_id)

        for widget_id in widget_ids:
            await getattr(widget_inits[widget_id], 'update_sync_groups')()

        return

    # ------------------------------------------------------------------
    async def validate_sess_widgets(self, sess_id, sess_widgets):
        """check that widgets listed as session resources
           are valid
        """

        for widget_id, info in sess_widgets.items():
            widget_info = self.redis.h_get(
                name='ws;widget_info',
                key=widget_id,
                default_val=None,
            )

            # possibly, the widget will not be registered, (eg redis has been
            # flushed). recovery is then not possible - we make sure the session
            # heartbeat is stopped and the session does not try to restore itself
            if widget_info is None:
                # forcibly stop the heartbeat
                loop_info = {
                    'id': 'client_sess_heartbeat_loop',
                    'group': self.get_loop_group_name(scope='sess', postfix=sess_id),
                }
                await self.set_loop_state(state=False, loop_info=loop_info)

                # send the client a kill event, to prevent further attempts at connection
                await self.emit(event_name='kill_socket_connection')

            elif 'utils' in info:
                await self.validate_widget_utils(
                    widget_id=widget_id,
                    widget_info=widget_info,
                    utils=info['utils'],
                )

        return

    # ------------------------------------------------------------------
    async def validate_widget_utils(self, widget_id, widget_info, utils):
        """check that widget utilities listed as session resources
           are registered in redis. in case of a mismatch, send the
           corresponding back_from_offline event, which will allow
           them to ask the client to go through initialisation
        """

        util_ids = widget_info['util_ids']
        miss_util_ids = [u['util_id'] for u in utils if u['util_id'] not in util_ids]

        if len(miss_util_ids) > 0:
            widget_info['util_ids'] += miss_util_ids
            self.redis.h_set(name='ws;widget_info', key=widget_id, data=widget_info)

            for util in miss_util_ids:
                async with self.locker.locks.acquire('serv'):
                    widget_inits = await self.get_server_attr(name='widget_inits')
                if widget_id in widget_inits.keys():
                    await getattr(widget_inits[widget_id], 'back_from_offline')()
        return

    # ------------------------------------------------------------------
    async def emit_widget_event(self, opt_in=None):
        """send a one-time event to client
        """

        widget = opt_in['widget']
        event_name = opt_in['event_name']
        data_func_args = opt_in['data_func_args'] if 'data_func_args' in opt_in else None

        metadata = {
            'widget_type': widget.widget_type,
            'widget_id': widget.widget_id,
            'n_icon': widget.n_icon,
            'icon_id': widget.icon_id,
            # 'sess_widget_ids': [widget.widget_id],
        }

        data = dict()
        if 'data' in opt_in:
            data = opt_in['data']
        elif 'data_func' in opt_in:
            if data_func_args is None:
                data = await opt_in['data_func']()
            else:
                data = await opt_in['data_func'](data_func_args)

        await self.emit_to_queue(event_name=event_name, data=data, metadata=metadata)

        return

        if 0:
            # ------------------------------------------------------------------
            def socket_event_widgets(
                self, event_name='', data={}, sess_ids=None, widget_ids=None
            ):
                message = {
                    'event_name': event_name,
                    'data': data,
                    'sess_ids': sess_ids,
                    'widget_ids': widget_ids
                }

                self.redis.publish(channel='socket_event_widgets', message=message)

                return

    # ------------------------------------------------------------------
    async def add_widget_loop(self, opt_in=None):

        widget = opt_in['widget']

        if 'event_name' not in opt_in:
            opt_in['event_name'] = 'update_data'

        loop_func = (opt_in['loop_func'] if 'loop_func' in opt_in else None)
        loop_id = opt_in['loop_id']

        if opt_in['loop_scope'] == 'unique_by_id':
            heartbeat = self.get_heartbeat_name(scope='sess')
            loop_group = self.get_loop_group_name(scope='sess')
            if loop_func is None:
                loop_func = self.loop_widget_id
            loop_id = 'widget;' + widget.widget_id + ';' + loop_id

        elif opt_in['loop_scope'] == 'shared_by_type':
            # heartbeat = self.get_heartbeat_name(scope='widget', postfix=widget.widget_type)

            heartbeat = self.get_heartbeat_name(scope='user')
            loop_group = self.get_loop_group_name(
                scope='widget',
                postfix=widget.widget_type,
            )
            if loop_func is None:
                loop_func = self.loop_widget_type

        else:
            raise Exception('unknown loop_scope for: ', opt_in)

        # =============================================================
        # =============================================================
        # =============================================================
        '''
            - general widget type heartbeat cleanup if list of widget_ids of a given type is empty
            since now we have all loops tied to the server/user, even if no widgets are alive...

            - sync_groups --> 
                - not persistified after server restart for recovered sees 
        '''
        # =============================================================
        # =============================================================
        # =============================================================

        if opt_in['loop_scope'] == 'unique_by_id':
            data = {
                'id': loop_id,
                'group': loop_group,
            }
            name = 'ws;sess_widget_loops;' + widget.widget_id
            self.redis.r_push(name=name, data=data)

        elif opt_in['loop_scope'] == 'shared_by_type':
            data = {
                'sess_id': self.sess_id,
                'widget_id': widget.widget_id,
            }
            name = (
                'ws;server_user_widget_loops;' + self.serv_id + ';' + self.user_id + ';'
                + widget.widget_type
            )
            self.redis.r_push(name=name, data=data)

            widget_types = self.redis.h_get(
                name='ws;server_user_widgets' + self.serv_id,
                key=self.user_id,
                default_val=[],
            )
            if widget.widget_type not in widget_types:
                widget_types += [widget.widget_type]
                self.redis.h_set(
                    name='ws;server_user_widgets' + self.serv_id,
                    key=self.user_id,
                    data=widget_types,
                )

        loop_info = {
            'id': loop_id,
            'func': loop_func,
            'group': loop_group,
            'heartbeat': heartbeat,
        }

        # if not self.get_loop_state(loop_info):
        #     print('+'*80) ; print(loop_info) ; print('-'*120) ; print()

        widget_lock_name = self.get_widget_lock_name(widget.widget_type)
        async with self.locker.locks.acquire(names=(widget_lock_name, 'user')):
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
                        widget.sm.sess_id
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
    async def loop_widget_id(self, loop_info, opt_in):
        """loop for emitting an event to a specific widget, based on widget_id
        """

        widget = opt_in['widget']

        self.log.info([
            ['y', ' - starting '],
            ['b', 'loop_widget_id'],
            ['y', ' with '],
            ['c', loop_info['group']],
            ['y', ' for '],
            ['c', widget.widget_type],
            ['y', ' / '],
            ['c', widget.widget_id],
            ['y', ' / '],
            ['c', opt_in['event_name']],
        ])

        # name of event to transmit to the client
        event_name = opt_in['event_name']

        # interval to sleep between transmisions in se
        sleep_sec = (
            opt_in['sleep_sec'] if 'sleep_sec' in opt_in else self.basic_widget_sleep_sec
        )

        # function to call to get the dat to transmit
        data_func_args = opt_in['data_func_args'] if 'data_func_args' in opt_in else None

        # function to call to modify the data, metadate to transmit
        update_data_func = (
            opt_in['update_data_func'] if 'update_data_func' in opt_in else None
        )

        # function to call to verify that the event should be transmitted
        verify_data = opt_in['verify_data'] if 'verify_data' in opt_in else None

        while self.get_loop_state(loop_info):
            await asyncio.sleep(sleep_sec)

            if data_func_args is None:
                data = await opt_in['data_func']()
            else:
                data = await opt_in['data_func'](data_func_args)

            metadata = {
                'widget_type': widget.widget_type,
                'widget_id': widget.widget_id,
                # 'sess_widget_ids': [widget.widget_id],
            }

            if update_data_func is not None:
                metadata = await update_data_func(metadata)

            if verify_data is not None:
                if not await verify_data(data, metadata):
                    continue

            await self.emit_to_queue(
                event_name=event_name,
                data=data,
                metadata=metadata,
            )

        self.log.info([
            ['r', ' - ending '],
            ['b', 'loop_widget_id'],
            ['r', ' with '],
            ['c', loop_info['group']],
            ['r', ' for '],
            ['c', widget.widget_type],
            ['r', ' / '],
            ['c', widget.widget_id],
            ['r', ' / '],
            ['c', opt_in['event_name']],
        ])

        return

    # ------------------------------------------------------------------
    async def loop_widget_type(self, loop_info, opt_in):
        """loop for emitting an event to all widgets of a type (within this server)
        """

        widget = opt_in['widget']

        self.log.info([
            ['y', ' - starting '],
            ['b', 'loop_widget_type'],
            ['y', ' with '],
            ['c', loop_info['group']],
            ['y', ' for '],
            ['c', widget.widget_type],
            ['y', ' / '],
            ['c', opt_in['event_name']],
        ])

        # name of event to transmit to the client
        event_name = opt_in['event_name']

        # interval to sleep between transmisions in se
        sleep_sec = (
            opt_in['sleep_sec'] if 'sleep_sec' in opt_in else self.basic_widget_sleep_sec
        )

        # function to call to get the dat to transmit
        data_func_args = opt_in['data_func_args'] if 'data_func_args' in opt_in else None

        # function to call to modify the metadate to transmit
        update_data_func = (
            opt_in['update_data_func'] if 'update_data_func' in opt_in else None
        )

        # function to call to verify that the event should be transmitted
        verify_data = opt_in['verify_data'] if 'verify_data' in opt_in else None

        while self.get_loop_state(loop_info):
            await asyncio.sleep(sleep_sec)

            name = (
                'ws;server_user_widget_loops;' + self.serv_id + ';' + self.user_id + ';'
                + widget.widget_type
            )
            loop_widgets = self.redis.l_get(name=name)
            if len(loop_widgets) > 0:
                if data_func_args is None:
                    data = await opt_in['data_func']()
                else:
                    data = await opt_in['data_func'](data_func_args)

            # only send once for each session, regardles of the number of widgets
            # (if different data are needed for each widget, use
            # loop_widget_id() instead...)
            sent_sess_ids = []
            for loop_widget in loop_widgets:
                sess_id = loop_widget['sess_id']
                if sess_id in sent_sess_ids:
                    continue
                sent_sess_ids += [sess_id]

                widget_id = loop_widget['widget_id']

                metadata = {
                    'widget_type': widget.widget_type,
                    # 'widget_id': widget_id,
                    # 'sess_widget_ids': [widget_id],
                }

                if update_data_func is not None:
                    data, metadata = await update_data_func(data, metadata)

                if verify_data is not None:
                    if not await verify_data(data, metadata):
                        continue

                # instead of locking the server, we accept a possible KeyError
                # in case another process changes the managers dict
                try:
                    async with self.locker.locks.acquire('serv'):
                        managers = await self.get_server_attr('managers')

                    if sess_id in managers:
                        await managers[sess_id].emit_to_queue(
                            event_name=event_name,
                            data=data,
                            metadata=metadata,
                        )
                except KeyError as e:
                    pass
                except Exception as e:
                    raise e

        self.log.info([
            ['r', ' - ending '],
            ['b', 'loop_widget_type'],
            ['r', ' with '],
            ['c', loop_info['group']],
            ['r', ' for '],
            ['c', widget.widget_type],
            ['r', ' / '],
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