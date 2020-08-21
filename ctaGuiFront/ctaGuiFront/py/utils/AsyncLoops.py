# from random import Random
from math import ceil
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
# from ctaGuiUtils.py.utils import get_rnd
# from ctaGuiUtils.py.RedisManager import RedisManager

import asyncio


class AsyncLoops():

    # ------------------------------------------------------------------
    def setup_loops(self):
        """define the default set of asy_funcs to run in the background
        """

        loops = []

        # session heartbeat (shared between all sessions for this server)
        loops += [
            {
                'id': 'server_sess_heartbeat_loop',
                'func': self.server_sess_heartbeat_loop,
                'group': 'ws;server;' + self.server_id,
                'heartbeat': 'ws;server_heartbeat;' + self.server_id,
            },
        ]

        # session cleanup (shared between all sessions for this server)
        loops += [
            {
                'id': 'cleanup_loop',
                'func': self.cleanup_loop,
                'group': 'ws;server;' + self.server_id,
                'heartbeat': 'ws;server_heartbeat;' + self.server_id,
            },
        ]

        # #
        # loops += [
        #     {
        #         'id': None,
        #         'group': 'shared_asy_func',
        #         'tag': 'get_pubsub_loop',
        #         'func': self.get_pubsub_loop,
        #     },
        # ]

        #
        # loops += [
        #     {
        #         'id': None,
        #         'group': 'shared_asy_func',
        #         'tag': 'pubsub_socket_evt_widgets',
        #         'func': self.pubsub_socket_evt_widgets,
        #     },
        # ]

        # client ping/pong heartbeat for a particular session
        loops += [
            {
                'id': 'client_sess_heartbeat_loop',
                'func': self.client_sess_heartbeat_loop,
                'group': 'ws;sess;' + self.sess_id,
                'heartbeat': 'ws;sess_heartbeat;' + self.sess_id,
            },
        ]

        # received event execution (one instance for each session)
        loops += [
            {
                'id': 'receive_queue_loop',
                'func': self.receive_queue_loop,
                'group': 'ws;sess;' + self.sess_id,
                'heartbeat': 'ws;sess_heartbeat;' + self.sess_id,
            },
        ]

        if self.is_simulation:
            loops += [
                {
                    'id': 'clock_sim_update_sim_params_loop',
                    'func': self.clock_sim_update_sim_params,
                    'group': 'ws;server;' + self.server_id,
                    'heartbeat': 'ws;server_heartbeat;' + self.server_id,
                },
            ]

        # async_loops = []
        # for loop_info in loops:
        #     has_asy_func = any([
        #         (loop_info['group'] == c['group'] and loop_info['id'] == c['id'])
        #         for c in async_loops
        #     ])
        #     if not has_asy_func:
        #         async_loops += [loop_info]

        # return async_loops

        return loops

    # ------------------------------------------------------------------
    async def init_common_loops(self):
        """initialise shared maintenance asy_funcs
        """

        async_loops = self.setup_loops()

        async with self.get_lock(names=('server', 'sess')):
            for loop_info in async_loops:
                if not self.get_loop_state(loop_info):
                    await self.set_loop_state(state=True, loop_info=loop_info)
                    self.spawn(loop_info['func'], loop_info=loop_info)

        return

    # ------------------------------------------------------------------
    def get_loop_state(self, loop_info):
        state = self.redis.h_exists(
            name=self.loop_group_prefix + loop_info['group'],
            key=loop_info['id'],
        )
        return state

    # ------------------------------------------------------------------
    async def set_loop_state(self, state, loop_info=None, group=None):
        async with self.get_lock('loop_state'):
            if state:
                if loop_info is None:
                    raise Exception(
                        'unsupported option for set_loop_state', state, loop_info, group
                    )

                # validate that this group/id loop has not already been registered
                has_loop = self.redis.h_exists(
                    name=self.loop_group_prefix + loop_info['group'],
                    key=loop_info['id'],
                )
                if has_loop:
                    raise Exception('trying to set existing loop', loop_info)

                # register this group/id loop
                self.redis.h_set(
                    name=self.loop_group_prefix + loop_info['group'],
                    key=loop_info['id'],
                )

                # register the heartbeat (kept up in server_sess_heartbeat_loop())
                # for this group, in order to facilitate cleanup as part of cleanup_loops()
                self.redis.h_set(
                    name='ws;all_loop_groups',
                    key=loop_info['group'],
                    data=loop_info['heartbeat']
                )

            else:
                if int(loop_info is None) + int(group is None) != 1:
                    raise Exception(
                        'unsupported option for set_loop_state', state, loop_info, group
                    )

                if group is not None:
                    self.redis.delete(name=self.loop_group_prefix + group)
                    self.redis.h_del(name='ws;all_loop_groups', key=group)
                else:
                    self.redis.h_del(
                        name=self.loop_group_prefix + loop_info['group'],
                        key=loop_info['id'],
                    )

                # if group is not None:
                #     self.log.info([['r', ' - clear loop '], ['c', group], ['r', ' ...'],])
                # else:
                #     self.log.info([['r', ' - clear loop '], ['c', loop_info['group']], ['r', ' / '], ['c', loop_info['id']], ['r', ' ...'],])
        return

    # ------------------------------------------------------------------
    async def server_sess_heartbeat_loop(self, loop_info):
        """renew session heartbeat tokens

            run in asy_func so long as there are active sessions
            renewes all sessions which belong to this server
            (registered in redis:('ws;all_sess_ids'))

            sessiosns which are not meaintained by any running server will expire, and
            thier cleanup will be handled by self.cleanup_loop()
        
            Parameters
            ----------
            loop_info : dict
                metadata needed to determine when is the loop should continue
        """

        self.log.info([
            ['y', ' - starting '],
            ['b', 'server_sess_heartbeat_loop'],
            ['y', ' by: '],
            ['c', self.sess_id],
            ['y', ' for server: '],
            ['c', self.server_id],
        ])

        sleep_sec = min(1, max(ceil(self.sess_expire * 0.1), 10))
        sess_expire = ceil(max(self.sess_expire, sleep_sec * 5))
        server_expire = ceil(sess_expire * 2)
        user_expire = ceil(sess_expire * 1.5)

        while self.get_loop_state(loop_info):
            sess_ids = self.redis.l_get('ws;server_sess_ids;' + self.server_id)
            for sess_id in sess_ids:
                if not self.redis.exists('ws;sess_heartbeat;' + sess_id):
                    continue

                # heartbeat for any session renews the server
                self.redis.expire(
                    name='ws;server_heartbeat;' + self.server_id, expire=server_expire
                )

                # heartbeat for any session renews the user
                self.redis.expire(
                    name='ws;user_heartbeat;' + self.user_id, expire=user_expire
                )

                # heartbeat for this session renews itself
                self.redis.expire(name='ws;sess_heartbeat;' + sess_id, expire=sess_expire)

            await asyncio.sleep(sleep_sec)

        await self.cleanup_server(server_id=self.server_id)

        self.log.info([
            ['r', ' - ending '],
            ['b', 'server_sess_heartbeat_loop'],
            ['r', ' for server: '],
            ['c', self.server_id],
        ])

        return

    # ------------------------------------------------------------------
    async def client_sess_heartbeat_loop(self, loop_info):
        """send ping/pong heartbeat message to client to verify the connection
        
            Parameters
            ----------
            loop_info : dict
                metadata needed to determine when is the loop should continue
        """

        self.log.info([
            ['y', ' - starting '],
            ['b', 'client_sess_heartbeat_loop'],
            ['y', ' for session: '],
            ['c', self.sess_id],
        ])

        # the interval to sleep between heartbeats
        send_interval_msec = self.sess_ping['send_interval_msec']

        # the maximal interval achieved in practice between heartbeats,
        # to test for server overloads
        max_ping_interval_msec = (
            send_interval_msec + self.sess_ping['max_interval_good_msec']
        )

        interval_now_msec = 0
        sleep_sec = send_interval_msec * 1e-3

        while self.get_loop_state(loop_info):
            data = {
                'ping_interval_msec': interval_now_msec,
            }
            self.sess_ping_time = get_time('msec')
            await self.emit(event_name='heartbeat_ping', data=data)

            # update the interval between pings
            interval_now_msec = get_time('msec')
            await asyncio.sleep(sleep_sec)
            interval_now_msec = get_time('msec') - interval_now_msec

            # for now we only produce a log warning in case of these kinds of problems
            if interval_now_msec > max_ping_interval_msec:
                self.log.warn([
                    ['y', ' - high server load / slow connection for '],
                    ['r', self.sess_id],
                    ['y', ' ? --> '],
                    ['o', interval_now_msec, ' msec delay'],
                ])

        self.log.info([
            ['r', ' - ending '],
            ['b', 'client_sess_heartbeat_loop'],
            ['r', ' for session: '],
            ['c', self.sess_id],
        ])

        return

    # ------------------------------------------------------------------
    async def heartbeat_pong(self, data):
        """server check for bad connections (maybe not needed...?!?)
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the event
        """

        # if eg we are offline or just back from offline
        if self.sess_ping_time is None or self.is_sess_offline:
            return

        ping_delay = data['send_time_msec'] - self.sess_ping_time

        if ping_delay > self.sess_ping['max_interval_good_msec']:
            is_slow = (ping_delay < self.sess_ping['max_interval_slow_msec'])

            log_func = self.log.warn if is_slow else self.log.error
            log_txt = 'unstable connection for ' if is_slow else 'not connected to '
            log_func([
                ['y', ' - ', log_txt],
                ['r', self.sess_id, '\n'],
                ['g', self.sess_ping_time, ' --> '],
                ['o', data],
            ])

        return

    # ------------------------------------------------------------------
    async def cleanup_loop(self, loop_info):

        self.log.info([
            ['y', ' - starting '],
            ['b', 'cleanup_loop'],
            ['y', ' by: '],
            ['c', self.sess_id],
            ['y', ' for server: '],
            ['c', self.server_id],
        ])

        # self.cleanup_sleep = 2

        while self.get_loop_state(loop_info):
            await asyncio.sleep(self.cleanup_sleep)

            # run the cleanup for this server
            await self.cleanup_server(server_id=self.server_id)

            # run the cleanup for possible zombie sessions
            all_sess_ids = self.redis.l_get('ws;all_sess_ids')
            for sess_id in all_sess_ids:
                if not self.redis.exists('ws;sess_heartbeat;' + sess_id):
                    await self.cleanup_session(sess_id=sess_id)

            # run the cleanup for possible zombie widgets
            widget_infos = self.redis.h_get_all('ws;widget_infos')
            for widget_id, widget_info in widget_infos.items():
                sess_id = widget_info['sess_id']
                if not self.redis.exists('ws;sess_heartbeat;' + sess_id):
                    # explicitly take care of the widget
                    await self.cleanup_widget(widget_ids=widget_id)
                    # for good measure, make sure the session is also gone
                    await self.cleanup_session(sess_id=sess_id)

            # run the cleanup for possible zombie servers
            all_server_ids = self.redis.l_get('ws;all_server_ids')
            for server_id in all_server_ids:
                if not self.redis.exists('ws;server_heartbeat;' + server_id):
                    await self.cleanup_server(server_id=server_id)

            # run the cleanup for possible zombie loops
            await self.cleanup_loops()

            # run the cleanup for users who have no active sessions
            await self.cleanup_users()

            # sanity check: make sure that the local manager has been cleaned
            sess_ids = self.redis.l_get('ws;server_sess_ids;' + self.server_id)

            managers = await self.get_server_attr('managers')
            sess_ids_check = [s for s in managers.keys() if s not in sess_ids]

            if len(sess_ids_check) > 0:
                self.log.warn([
                    ['r', ' - mismatch between sess_ids ?', sess_ids,
                     managers.keys()],
                ])
                for sess_id in sess_ids_check:
                    await self.cleanup_session(sess_id=sess_id)

            # sanity check: after the cleanup for this particular session, check if the
            # heartbeat is still there for the server / user (if any session at all is alive)
            async with self.get_lock('user'):
                if not self.redis.exists('ws;user_heartbeat;' + self.user_id):
                    user_sess_ids = self.redis.l_get('ws;user_sess_ids;' + self.user_id)
                    if len(user_sess_ids) > 0:
                        raise Exception(
                            'no heartbeat, but sessions remaining ?!?!', self.user_id,
                            user_sess_ids
                        )

                if not self.redis.exists('ws;server_heartbeat;' + self.server_id):
                    server_sess_ids = self.redis.l_get(
                        'ws;server_sess_ids;' + self.server_id
                    )
                    if len(server_sess_ids) > 0:
                        raise Exception(
                            'no heartbeat, but sessions remaining ?!?!', self.server_id,
                            server_sess_ids
                        )

            check_all_ws_keys = False
            # check_all_ws_keys = True
            if check_all_ws_keys:
                async with self.get_lock('global'):
                    cursor, scans = 0, []
                    while True:
                        # await asyncio.sleep(0.001)
                        cursor, scan = self.redis.scan(
                            cursor=cursor, count=500, match='ws;*'
                        )
                        if len(scan) > 0:
                            scans += scan
                        if cursor == 0:
                            break
                    print(' - scans:\n', scans, '\n')

        self.log.info([
            ['r', ' - ending '],
            ['b', 'cleanup_loop'],
            ['r', ' by: '],
            ['c', self.sess_id],
            ['r', ' for server: '],
            ['c', self.server_id],
        ])

        return
