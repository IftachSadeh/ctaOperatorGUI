import asyncio
from math import ceil

from shared.utils import get_time


class Housekeeping():

    # ------------------------------------------------------------------
    async def cleanup_loop(self, loop_info):

        self.log.info([
            ['y', ' - starting '],
            ['b', 'cleanup_loop'],
            ['y', ' by: '],
            ['c', self.sess_id],
            ['y', ' for server: '],
            ['c', self.serv_id],
        ])

        # self.cleanup_sleep_sec = 5
        # self.cleanup_sleep_sec = 3

        while self.get_loop_state(loop_info):
            await asyncio.sleep(self.cleanup_sleep_sec)

            # wait for all session configurations from this server to complete
            async def is_locked():
                sess_ids = self.redis.s_get('ws;server_sess_ids;' + self.serv_id)
                sess_locks = self.locker.semaphores.get_actives(
                    name=self.sess_config_lock,
                    default_val=[],
                )
                locked = any(s in sess_ids for s in sess_locks)
                return locked

            max_lock_sec = self.get_expite_sec(
                name='sess_config_expire',
                is_lock_check=True,
            )
            await self.locker.semaphores.async_block(
                is_locked=is_locked,
                max_lock_sec=max_lock_sec,
            )

            # add a lock impacting session configurations. the name
            # and key are global. so that we dont have zombie entries
            # after a server restart!
            self.locker.semaphores.add(
                name=self.cleanup_loop_lock,
                key=self.serv_id,
                expire_sec=self.get_expite_sec(name='cleanup_loop_expire'),
            )

            # run the cleanup for this server
            await self.cleanup_server(serv_id=self.serv_id)

            # run the cleanup for possible zombie sessions
            all_sess_ids = self.redis.s_get('ws;all_sess_ids')
            for sess_id in all_sess_ids:
                heartbeat_name = self.get_heartbeat_name(scope='sess', postfix=sess_id)
                if not self.redis.exists(heartbeat_name):
                    await self.cleanup_session(sess_id=sess_id)

            # run the cleanup for possible zombie widgets
            widget_info = self.redis.h_get_all('ws;widget_info', default_val={})
            for widget_id, info in widget_info.items():
                sess_id = info['sess_id']
                heartbeat_name = self.get_heartbeat_name(scope='sess', postfix=sess_id)
                if not self.redis.exists(heartbeat_name):
                    # explicitly take care of the widget
                    await self.cleanup_sess_widget(widget_ids=widget_id)
                    # for good measure, make sure the session is also gone
                    await self.cleanup_session(sess_id=sess_id)

            # run the cleanup for possible zombie servers
            all_server_ids = self.redis.s_get('ws;all_server_ids')
            for serv_id in all_server_ids:
                heartbeat_name = self.get_heartbeat_name(scope='serv', postfix=serv_id)
                if not self.redis.exists(heartbeat_name):
                    await self.cleanup_server(serv_id=serv_id)

            # run the cleanup for possible zombie loops
            await self.cleanup_loops()

            # run the cleanup for users who have no heartbeats
            all_user_ids = self.redis.s_get('ws;all_user_ids')
            for user_id in all_user_ids:
                heartbeat_name = self.get_heartbeat_name(scope='user', postfix=user_id)
                if not self.redis.exists(heartbeat_name):
                    await self.cleanup_users(user_ids=user_id)

            # sanity check: make sure that the local manager has been cleaned
            sess_ids = self.redis.s_get('ws;server_sess_ids;' + self.serv_id)

            # instead of locking the server, we accept a possible KeyError
            # in case another process changes the managers dict
            try:
                async with self.locker.locks.acquire('serv'):
                    managers = await self.get_server_attr('managers')
                sess_ids_check = [s for s in managers.keys() if s not in sess_ids]
            except KeyError as e:
                pass
            except Exception as e:
                raise e

            if len(sess_ids_check) > 0:
                self.log.warn([
                    ['r', ' - mismatch between sess_ids ?', sess_ids,
                     managers.keys()],
                ])
                for sess_id in sess_ids_check:
                    await self.cleanup_session(sess_id=sess_id)

            # sanity check: after the cleanup for this particular session,
            # check if the heartbeat is still there for the server / user
            # (if any session at all is alive)
            # async with self.locker.locks.acquire('user'):
            #     if not self.redis.exists(self.get_heartbeat_name(scope='user')):
            #         user_sess_ids = self.redis.s_get('ws;user_sess_ids;' + self.user_id)
            #         if len(user_sess_ids) > 0:
            #             raise Exception(
            #                 'no heartbeat, but sessions remaining ?!?!', self.user_id,
            #                 user_sess_ids
            #             )

            async with self.locker.locks.acquire('serv'):
                if not self.redis.exists(self.get_heartbeat_name(scope='serv')):
                    server_sess_ids = self.redis.s_get(
                        'ws;server_sess_ids;' + self.serv_id
                    )
                    if len(server_sess_ids) > 0:
                        raise Exception(
                            'no heartbeat, but sessions remaining ?!?!', self.serv_id,
                            server_sess_ids
                        )

            # cleanup widgets by their own heartbeat
            await self.cleanup_widgets()

            # ------------------------------------------------------------------
            # ------------------------------------------------------------------
            check_all_ws_keys = False
            # check_all_ws_keys = True
            if check_all_ws_keys:
                # async with self.locker.locks.acquire('serv'):
                cursor, scans = 0, []
                while True:
                    # await asyncio.sleep(0.001)
                    cursor, scan = self.redis.scan(cursor=cursor, count=500, match='ws;*')
                    if len(scan) > 0:
                        scans += scan
                    if cursor == 0:
                        break
                print(' - scans:\n', scans, '\n')
            # ------------------------------------------------------------------
            # ------------------------------------------------------------------

            # remove the lock impacting session configurations
            self.locker.semaphores.remove(
                name=self.cleanup_loop_lock,
                key=self.serv_id,
            )

        self.log.info([
            ['r', ' - ending '],
            ['b', 'cleanup_loop'],
            ['r', ' by: '],
            ['c', self.sess_id],
            ['r', ' for server: '],
            ['c', self.serv_id],
        ])

        return

    # ------------------------------------------------------------------
    async def cleanup_session(self, sess_id):
        """clean up a session

           as this is not necessarily self.sess_id, we do not assume that we
           have the identical self.user_id or self.serv_id (as another user
           # potentially using a different server, might have initiated this function)
        """

        if sess_id is None:
            return

        async with self.locker.locks.acquire('sess'):
            # add a lock impacting the cleanup loop
            self.locker.semaphores.add(
                name=self.sess_config_lock,
                key=sess_id,
                expire_sec=self.get_expite_sec(name='sess_config_expire'),
            )

            self.log.info([['c', ' - cleanup-session '], ['p', sess_id], ['c', ' ...']])

            # remove the heartbeat for the session
            self.redis.delete(self.get_heartbeat_name(scope='sess', postfix=sess_id))

            # remove the the session from the global list
            self.redis.s_rem(name='ws;all_sess_ids', data=sess_id)

            # remove the the session from the server list
            all_server_ids = self.redis.s_get('ws;all_server_ids')
            for serv_id in all_server_ids:
                self.redis.s_rem(name='ws;server_sess_ids;' + serv_id, data=sess_id)

            # remove the the session from the user list (go over all users until
            # the right one is found)
            all_user_ids = self.redis.s_get('ws;all_user_ids')
            for user_id in all_user_ids:
                self.redis.s_rem(name='ws;user_sess_ids;' + user_id, data=sess_id)

            await self.set_loop_state(
                state=False,
                group=self.get_loop_group_name(scope='sess', postfix=sess_id),
            )

            # remove the session from the manager list if it
            # exists (if this is the current server)
            async with self.locker.locks.acquire('serv'):
                await self.remove_server_attr(name='managers', key=self.sess_id)

            # clean up all widgets for this session
            sess_widget_ids = self.redis.l_get('ws;sess_widget_ids;' + sess_id)
            for widget_id in sess_widget_ids:
                await self.cleanup_sess_widget(widget_ids=widget_id)

            # remove the lock impacting the cleanup loop
            self.locker.semaphores.remove(
                name=self.sess_config_lock,
                key=sess_id,
            )

        return

    # ------------------------------------------------------------------
    async def cleanup_loops(self):
        """clean up zombie loops
        """

        all_loop_groups = self.redis.h_get_all(name='ws;all_loop_groups', default_val={})

        heartbeats = []
        for heartbeat in list(all_loop_groups.values()):
            if heartbeat not in heartbeats:
                heartbeats += [heartbeat]

        has_context = dict([(h, self.redis.exists(h)) for h in heartbeats])

        for group, heartbeat in all_loop_groups.items():
            if not has_context[heartbeat]:
                await self.set_loop_state(state=False, group=group)
                self.redis.h_del(name='ws;all_loop_groups', key=group)

        return

    # ------------------------------------------------------------------
    async def cleanup_widgets(self):
        """cleanup widgets by their own heartbeat
        """

        reco_info = self.redis.h_get_all(
            'ws;recovery_info',
            default_val={},
        )

        widget_ids = []
        for widget_id in reco_info.keys():
            heartbeat_name = self.get_heartbeat_name(scope='widget_id', postfix=widget_id)
            if not self.redis.exists(heartbeat_name):
                widget_ids += [widget_id]

        if len(widget_ids) > 0:
            self.redis.h_del(
                'ws;recovery_info',
                keys=widget_ids,
            )
            await self.cleanup_sess_widget(widget_ids=widget_ids)

        return

    # ------------------------------------------------------------------
    async def cleanup_sess_widget(self, widget_ids, grp_ids=None):
        """clean up a list of input widget ids
        """

        if not isinstance(widget_ids, (list, set)):
            widget_ids = [widget_ids]
        if len(widget_ids) == 0:
            return
        if grp_ids is not None:
            if not isinstance(grp_ids, (list, set)):
                grp_ids = [grp_ids]

        self.log.info([
            ['c', ' - cleanup-widget_ids '],
            ['p', widget_ids],
            ['y', '', grp_ids if grp_ids is not None else ''],
        ])

        all_user_ids = self.redis.s_get('ws;all_user_ids')

        for widget_id in widget_ids:
            widget_info = self.redis.h_get(
                name='ws;widget_info', key=widget_id, default_val={}
            )
            if 'sess_id' in widget_info:
                self.redis.delete('ws;sess_widget_ids;' + widget_info['sess_id'])

            self.redis.h_del(name='ws;widget_info', key=widget_id)

            for user_id in all_user_ids:
                self.redis.l_rem(name='ws;user_widget_ids;' + user_id, data=widget_id)

            async with self.locker.locks.acquire('serv'):
                await self.remove_server_attr(name='widget_inits', key=widget_id)

            sess_widget_loops = self.redis.l_get('ws;sess_widget_loops;' + widget_id)
            for widget_loop in sess_widget_loops:
                await self.set_loop_state(
                    state=False,
                    loop_info=widget_loop,
                )
            self.redis.delete('ws;sess_widget_loops;' + widget_id)

        # synchronisation groups
        pipe = self.redis.get_pipe()
        for widget_id in widget_ids:
            user_sync_groups = self.redis.h_get_all(
                name='ws;user_sync_groups;' + self.user_id, default_val=dict()
            )
            check_grp_ids = list(user_sync_groups.keys())
            if grp_ids is not None:
                check_grp_ids += grp_ids

            for grp_id_now in set(check_grp_ids):
                pipe.h_del(
                    name='ws;user_sync_group_widgets;' + self.user_id + ';' + grp_id_now,
                    key=widget_id,
                )
        pipe.execute()

        # # if a PanelSync widget is instantiated, update it
        # await self.publish_sync_groups_update()

        return

    # ------------------------------------------------------------------
    async def cleanup_server(self, serv_id):
        """clean up servers and the corresponding sessions
        """

        # cleanup expired sessions (for this particular server)
        sess_ids = self.redis.s_get('ws;server_sess_ids;' + serv_id)
        for sess_id in sess_ids:
            heartbeat_name = self.get_heartbeat_name(scope='sess', postfix=sess_id)
            if not self.redis.exists(heartbeat_name):
                await self.cleanup_session(sess_id=sess_id)

        # after the cleanup for dead sessions, check if
        # the heartbeat is still there for the server (if any session at all is alive)
        heartbeat_name = self.get_heartbeat_name(scope='serv', postfix=serv_id)
        if not self.redis.exists(heartbeat_name):
            self.log.info([['c', ' - cleanup-server '], ['p', serv_id], ['c', ' ...']])

            await self.set_loop_state(
                state=False,
                group=self.get_loop_group_name(scope='serv', postfix=serv_id),
            )
            self.redis.s_rem(name='ws;all_server_ids', data=serv_id)

        return

    # ------------------------------------------------------------------
    async def cleanup_users(self, user_ids=None):
        """clean up all user lists in case this use has heartbeat
        """

        if user_ids is None:
            user_ids = self.redis.s_get('ws;all_user_ids', default_val=[])
        elif isinstance(user_ids, str):
            user_ids = [user_ids]

        for user_id in user_ids:
            user_sess_ids = self.redis.s_get(
                'ws;user_sess_ids;' + user_id,
                default_val=None,
            )
            if user_sess_ids is not None:
                continue

            self.log.info([
                ['c', ' - cleanup-user '],
                ['p', user_id],
                ['c', ' ...'],
            ])

            self.redis.s_rem(name='ws;all_user_ids', data=user_id)

            user_sync_groups = self.redis.h_get_all(
                name='ws;user_sync_groups;' + user_id, default_val=dict()
            )
            for grp_id in user_sync_groups.keys():
                self.redis.delete(
                    name='ws;user_sync_group_widgets;' + user_id + ';' + grp_id,
                )

            self.redis.delete(name='ws;user_sync_groups;' + user_id)

            # cleanup widgets
            widget_types = self.redis.h_get(
                name='ws;server_user_widgets' + self.serv_id, key=user_id, default_val=[]
            )
            for widget_type in widget_types:
                name = (
                    'ws;server_user_widget_loops;' + self.serv_id + ';' + user_id + ';'
                    + widget_type
                )
                self.redis.delete(name=name)

            self.redis.h_del(name='ws;server_user_widgets' + self.serv_id, key=user_id)

            self.redis.h_del(name='ws;active_widget', key=user_id)
            self.redis.delete(name='ws;user_widget_ids;' + user_id)

        return
