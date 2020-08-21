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
    def get_heartbeat_name(self, scope, postfix=None):
        """names for heartbeat monitors for different scopes
           
           examples:
           'ws;heartbeat;sess;serv_8090_473838_sess_000001'
           which defines the scope for all constituents of a session
           with id 'serv_8090_473838_sess_000001'
           
           'ws;heartbeat;widget;serv_8090_530136;EmptyExample'
           which defines the scope for all constituents of a widget
           of type 'EmptyExample' operating under a server with id 'serv_8090_530136'
        """
        
        prefix = self.heartbeat_prefix + scope
        
        if scope == 'user':
            if postfix is None:
                postfix = self.user_id
            name = prefix + ';' + postfix

        elif scope == 'server':
            if postfix is None:
                postfix = self.server_id
            name = prefix + ';' + postfix

        elif scope == 'sess':
            if postfix is None:
                postfix = self.sess_id
            name = prefix + ';' + postfix

        elif scope == 'widget':
            if postfix is None:
                raise Exception('must provide widget_name as postfix for heartbeat')
            name = prefix + ';' + self.server_id + ';' + postfix
        
        else:
            raise Exception('unknown scope for heartbeat')

        return name

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
                'group': self.loop_prefix + 'server;' + self.server_id,
                'heartbeat': self.get_heartbeat_name('server'),
            },
        ]

        # session cleanup (shared between all sessions for this server)
        loops += [
            {
                'id': 'cleanup_loop',
                'func': self.cleanup_loop,
                'group': self.loop_prefix + 'server;' + self.server_id,
                'heartbeat': self.get_heartbeat_name('server'),
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
                'group': self.loop_prefix + 'sess;' + self.sess_id,
                'heartbeat': self.get_heartbeat_name('sess'),
            },
        ]

        # received event execution (one instance for each session)
        loops += [
            {
                'id': 'receive_queue_loop',
                'func': self.receive_queue_loop,
                'group': self.loop_prefix + 'sess;' + self.sess_id,
                'heartbeat': self.get_heartbeat_name('sess'),
            },
        ]

        if self.is_simulation:
            loops += [
                {
                    'id': 'clock_sim_update_sim_params_loop',
                    'func': self.clock_sim_update_sim_params,
                    'group': self.loop_prefix + 'server;' + self.server_id,
                    'heartbeat': self.get_heartbeat_name('server'),
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

        # await self.add_async_loop(loop_infos=loops)
        # return

        return loops

    # # ------------------------------------------------------------------
    # async def add_async_loop(self, loop_infos):
    #     if not isinstance(loop_infos, list):
    #         loop_infos = [loop_infos]
    #     async with self.get_lock('loop_state'):
    #         async with self.get_lock('sess'):
    #             for loop_info in loop_infos:
    #                 has_asy_func = any([
    #                     (
    #                         loop_info['group'] == c['group']
    #                         and loop_info['id'] == c['id']
    #                     )
    #                     for c in self.async_loops
    #                 ])
    #                 if not has_asy_func:
    #                     self.async_loops += [loop_info]
    #     return


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
            name=loop_info['group'],
            key=loop_info['id'],
        )
        return state

    # ------------------------------------------------------------------
    async def set_loop_state(self, state, loop_info=None, group=None):
        async with self.get_lock('loop_state'):
            if state:
                if loop_info is None:
                    raise Exception(
                        'unsupported option for set_loop_state',
                        state, loop_info, group
                    )

                # validate that this group/id loop has not already been registered
                has_loop = self.redis.h_exists(
                    name=loop_info['group'],
                    key=loop_info['id'],
                )
                if has_loop:
                    raise Exception('trying to set existing loop', loop_info)

                # register this group/id loop
                self.redis.h_set(
                    name=loop_info['group'],
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
                        'unsupported option for set_loop_state',
                        state, loop_info, group
                    )

                if group is not None:
                    self.redis.delete(name=group)
                    self.redis.h_del(name='ws;all_loop_groups', key=group)
                else:
                    self.redis.h_del(
                        name=loop_info['group'],
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
                if not self.redis.exists(self.get_heartbeat_name('sess', sess_id)):
                    continue

                # heartbeat for any session renews the server
                self.redis.expire(
                    name=self.get_heartbeat_name('server'), expire=server_expire
                )

                # heartbeat for any session renews the user
                self.redis.expire(
                    name=self.get_heartbeat_name('user'), expire=user_expire
                )

                # heartbeat for this session renews itself
                self.redis.expire(name=self.get_heartbeat_name('sess', sess_id), expire=sess_expire)

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

