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
# from ctaGuiUtils.py.utils import get_time
# from ctaGuiUtils.py.utils import get_rnd
# from ctaGuiUtils.py.RedisManager import RedisManager


class Housekeeping():

    # ------------------------------------------------------------------
    async def cleanup_session(self, sess_id):
        """clean up a session

           as this is not necessarily self.sess_id, we do not assume that we
           have the identical self.user_id or self.server_id (as another user
           # potentially using a different server, might have initiated this function)
        """

        if sess_id is None:
            return

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_session expected to be locked ?!?')

        self.log.info([['c', ' - cleanup-session '], ['p', sess_id], ['c', ' ...']])

        # remove the heartbeat for the session
        self.redis.delete('ws;sess_heartbeat;' + sess_id)

        # remove the the session from the global list
        self.redis.l_rem(name='ws;all_sess_ids', data=sess_id)

        # remove the the session from the server list
        all_server_ids = self.redis.l_get('ws;all_server_ids')
        for server_id in all_server_ids:
            self.redis.l_rem(name='ws;server_sess_ids;' + server_id, data=sess_id)

        # remove the the session from the user list (go over all users until
        # the right one is found)
        all_user_ids = self.redis.l_get('ws;all_user_ids')
        for user_id in all_user_ids:
            self.redis.l_rem(name='ws;user_sess_ids;' + user_id, data=sess_id)

        await self.set_loop_state(
            state=False,
            group='ws;sess;' + sess_id,
        )

        # remove the session from the manager list if it
        # exists (if this is the current server)
        async with await self.get_redis_lock('ws;lock;' + self.server_id):
            await self.server_attr_dic_rm(name='managers', key=self.sess_id)

        # clean up all widgets for this session
        sess_widget_ids = self.redis.l_get('ws;sess_widget_ids;' + sess_id)
        for widget_id in sess_widget_ids:
            await self.cleanup_widget(widget_ids=widget_id)

        self.on_leave_session_()

        return

    # ------------------------------------------------------------------
    async def cleanup_loops(self):
        """clean up zombie loops
        """

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_widget expected to be locked ?!?')

        all_loop_groups = self.redis.h_get_all('ws;all_loop_groups')

        heartbeats = []
        for heartbeat in list(all_loop_groups.values()):
            if heartbeat not in heartbeats:
                heartbeats += [heartbeat]

        has_context = dict([(c, self.redis.exists(c)) for c in heartbeats])

        for group, heartbeat in all_loop_groups.items():
            if not has_context[heartbeat]:
                await self.set_loop_state(state=False, group=group)
                self.redis.h_del(name='ws;all_loop_groups', key=group)

        return

    # ------------------------------------------------------------------
    async def cleanup_widget(self, widget_ids):
        """clean up a list of input widget ids
        """

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_widget expected to be locked ?!?')

        if not isinstance(widget_ids, list):
            widget_ids = [widget_ids]

        self.log.info([['c', ' - cleanup-widget_ids '], ['p', widget_ids]])

        all_user_ids = self.redis.l_get('ws;all_user_ids')

        sync_groups = self.redis.h_get(
            name='ws;sync_groups', key=self.user_id, default_val=[]
        )
        # print(' - sync_groups\n',sync_groups)

        for widget_id in widget_ids:
            widget_info = self.redis.h_get(name='ws;widget_infos', key=widget_id)
            self.redis.delete('ws;sess_widget_ids;' + widget_info['sess_id'])

            self.redis.h_del(name='ws;widget_infos', key=widget_id)

            for user_id in all_user_ids:
                self.redis.l_rem(name='ws;user_widget_ids;' + user_id, data=widget_id)

            async with await self.get_redis_lock('ws;lock;' + self.server_id):
                await self.server_attr_dic_rm(name='widget_inits', key=widget_id)

            await self.set_loop_state(
                state=False,
                group='ws;widget_id;' + widget_id,
            )

            #
            for sync_group in sync_groups:
                for sync_states in sync_group['sync_states']:
                    rm_elements = []
                    for sync_type_now in sync_states:
                        if sync_type_now[0] == widget_id:
                            rm_elements.append(sync_type_now)
                    for rm_element in rm_elements:
                        sync_states.remove(rm_element)

        # print(' + sync_groups\n',sync_groups)
        self.redis.h_set(name='ws;sync_groups', key=self.user_id, data=sync_groups)

        await self.update_sync_group()

        return

    # ------------------------------------------------------------------
    async def cleanup_server(self, server_id):
        """clean up servers and the corresponding sessions
        """

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_server expected to be locked ?!?')

        # cleanup expired sessions (for this particular server)
        sess_ids = self.redis.l_get('ws;server_sess_ids;' + server_id)
        for sess_id in sess_ids:
            if not self.redis.exists('ws;sess_heartbeat;' + sess_id):
                await self.cleanup_session(sess_id=sess_id)

        # after the cleanup for dead sessions, check if
        # the heartbeat is still there for the server (if any session at all is alive)
        if not self.redis.exists('ws;server_heartbeat;' + server_id):
            self.log.info([['c', ' - cleanup-server '], ['p', server_id], ['c', ' ...']])

            await self.set_loop_state(
                state=False,
                group='ws;server;' + server_id,
            )
            self.redis.l_rem(name='ws;all_server_ids', data=server_id)

        return

    # ------------------------------------------------------------------
    async def cleanup_users(self):
        """clean up all user lists in case this use has no more sessions
           alive (sessions might belong to any server)
        """

        if not await self.is_redis_locked('ws;lock'):
            raise Exception('cleanup_users expected to be locked ?!?')

        all_user_ids = self.redis.l_get('ws;all_user_ids')
        for user_id in all_user_ids:
            user_sess_ids = self.redis.l_get('ws;user_sess_ids;' + user_id)
            if len(user_sess_ids) == 0:
                self.log.info([['c', ' - cleanup-user '], ['p', user_id], ['c', ' ...']])

                self.redis.l_rem(name='ws;all_user_ids', data=user_id)
                self.redis.h_del(name='ws;sync_groups', key=user_id)

                self.redis.h_del(name='ws;active_widget', key=user_id)
                self.redis.delete(name='ws;user_widget_ids;' + user_id)

        return
