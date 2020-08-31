import asyncio
from ctaGuiFront.py.utils.security import USERS

from ctaGuiUtils.py.utils import get_time


# ------------------------------------------------------------------
class SessionManager():

    # ------------------------------------------------------------------
    def set_sess_state(self, state):
        self.is_sess_open = state
        self.is_sess_offline = not state
        return

    # ------------------------------------------------------------------
    async def sess_disconnected(self):
        """local cleanup for the current server session upon disconnection
        """

        self.log.info([['c', ' - session disconnected '], ['p', self.sess_id]])

        self.set_sess_state(state=False)

        try:
            await self.cleanup_session(sess_id=self.sess_id)

        except Exception as e:
            raise e

        return

    # ------------------------------------------------------------------
    async def send_initial_connect(self):
        """upon any new connection, send the client initialisation data
        """

        await self.set_sess_id()

        self.set_sess_state(state=True)

        tel_ids = self.inst_data.get_inst_ids()
        tel_id_to_types = self.inst_data.get_inst_id_to_types()
        categorical_types = self.inst_data.get_categorical_types()

        data = {
            'serv_id': self.serv_id,
            'sess_id': self.sess_id,
            'sess_ping': self.sess_ping,
            'tel_ids': tel_ids,
            'tel_id_to_types': tel_id_to_types,
            'categorical_types': categorical_types,
            'is_simulation': self.is_simulation,
        }
        await self.emit(event_name='initial_connect', data=data)

        return

    # ------------------------------------------------------------------
    async def sess_setup_begin(self, data):
        """the replay of the client to the initial_connect event

            set the session-id which is derived by the client upon connecting the socket
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the event
        """

        is_existing_sess = (self.sess_id != data['metadata']['sess_id'])

        # ------------------------------------------------------------------
        # for development, its conveniet to reload if the server was restarted, but
        # for deployment, the same session can simply be restored
        if self.base_config.debug_opts['dev'] and 1:
            if is_existing_sess:
                self.sess_id = data['metadata']['sess_id']
                await self.emit(event_name='reload_session')
                return
        # ------------------------------------------------------------------

        if is_existing_sess:
            self.sess_id = data['metadata']['sess_id']
            self.log.info([
                ['wr', ' - restoring existing session: '],
                ['o', self.sess_id],
            ])

        async with self.locker.locks.acquire('sess'):
            # add a lock impacting the cleanup loop
            self.locker.semaphores.add(
                name=self.sess_config_lock,
                key=self.sess_id,
                expire_sec=self.sess_config_expire_sec,
            )

            # wait for the cleanup loop from this server to complete
            async def is_locked():
                locked = self.locker.semaphores.check(
                    name=self.cleanup_loop_lock,
                    key=self.serv_id,
                )
                return locked

            await self.locker.semaphores.async_block(
                is_locked=is_locked, max_lock_sec=self.cleanup_loop_expire_sec
            )

            # get and validate the user id
            self.user_id = str(data['data']['display_user_id'])
            if self.user_id == 'None':
                self.user_id = ''
            else:
                # sanity check
                hashed_pw = USERS.get(self.user_id)
                if not hashed_pw:
                    raise Exception(
                        'got unidentified user_name in sess_setup_begin ...', data
                    )

            # get the user group and set some names
            self.user_group = str(data['data']['display_user_group'])
            self.user_group_id = self.user_group + '_' + self.user_id
            self.sess_name = self.user_group_id + '_' + self.sess_id

            self.log.info([
                ['b', ' - websocket.connected '],
                ['p', self.sess_id],
                ['y', '', self.user_id, '/', self.user_group],
            ])

            # register the user_id for the heartbeat monitor
            # (expires on its own, inless renewed by server_sess_heartbeat_loop())
            self.redis.set(
                name=self.get_heartbeat_name(scope='user'),
                expire_sec=(int(self.sess_expire) * 10),
            )
            # register the serv_id for the heartbeat monitor
            # (expires on its own, inless renewed by server_sess_heartbeat_loop())
            self.redis.set(
                name=self.get_heartbeat_name(scope='serv'),
                expire_sec=(int(self.sess_expire) * 10),
            )
            # register the sess_id for the heartbeat monitor
            # (expires on its own, inless renewed by server_sess_heartbeat_loop())
            self.redis.set(
                name=self.get_heartbeat_name(scope='sess'),
                expire_sec=(int(self.sess_expire) * 10),
            )

            # start up (if not already running) loops for this server / user / session
            async with self.locker.locks.acquire(names='serv'):
                await self.init_common_loops()

            # # override the global logging variable with a
            # # name corresponding to the current session ids
            # self.log = LogParser(
            #     base_config=self.base_config,
            #     title=(str(self.user_id) + '/' + str(self.sess_id) + '/' + __name__),
            # )

            # keep track of all instances for broadcasting events (cleaned up
            # as part of cleanup_session())
            async with self.locker.locks.acquire('serv'):
                await self.add_server_attr(name='managers', key=self.sess_id, value=self)

            # registed the server id in the global server list
            # (cleanup explicitly done as part of cleanup_server())
            all_server_ids = self.redis.s_get('ws;all_server_ids')
            if self.serv_id not in all_server_ids:
                self.redis.s_add(name='ws;all_server_ids', data=self.serv_id)

            # register the user_name if needed (cleanup as part of cleanup_server())
            all_user_ids = self.redis.s_get('ws;all_user_ids')
            if self.user_id not in all_user_ids:
                self.redis.s_add(name='ws;all_user_ids', data=self.user_id)

            # registed the session id in the global session list, and in the server
            # session list (cleanup explicitly done as part of cleanup_session(),
            # also if loosing heartbeat as part of cleanup_server())
            all_sess_ids = self.redis.s_get('ws;all_sess_ids')
            if self.sess_id not in all_sess_ids:
                self.redis.s_add(name='ws;all_sess_ids', data=self.sess_id)

            # list of all sessions for this user
            user_sess_ids = self.redis.s_get('ws;user_sess_ids;' + self.user_id)
            if self.sess_id not in user_sess_ids:
                self.redis.s_add(
                    name='ws;user_sess_ids;' + self.user_id, data=self.sess_id
                )

            # synchronisation groups for users (cleaned up as part of
            # cleanup_server(), when no more sessions remain alive for this user)
            if not self.redis.h_exists(name='ws;sync_groups', key=self.user_id):
                self.redis.h_set(name='ws;sync_groups', key=self.user_id, data=[])

            async with self.locker.locks.acquire('serv'):
                server_sess_ids = self.redis.s_get('ws;server_sess_ids;' + self.serv_id)
                if self.sess_id not in server_sess_ids:
                    self.redis.s_add(
                        name='ws;server_sess_ids;' + self.serv_id, data=self.sess_id
                    )

            # remove the lock impacting the cleanup loop
            self.locker.semaphores.remove(
                name=self.sess_config_lock,
                key=self.sess_id,
            )

        # function which may be overloaded, setting up individual
        # properties for a given session-type
        if not is_existing_sess:
            self.on_join_session_()

        self.init_user_sync_loops()

        return

    # ------------------------------------------------------------------
    async def sess_setup_finalised(self, data):
        """as the final step within the lock, flag the session as initialised
        """
        self.has_init_sess = True
        return

    # ------------------------------------------------------------------
    def on_join_session_(self):
        """placeholder for overloaded method, to be run as part of on_join_session
        """
        return

    # ------------------------------------------------------------------
    def on_leave_session_(self):
        """placeholder for overloaded method, to be run as part of on_leave_session
        """
        return

    # ------------------------------------------------------------------
    async def sess_to_online(self, data):
        """upon reconnection to an existing session
        """

        self.log.warn([[
            'o', ' - sess_to_online  not implemented ', self.sess_id, '!' * 50
        ]])

        self.is_sess_offline = False

        # prevent the ping/pong heartbeat for the first iteration
        self.sess_ping_time = None

        # if self.sess_id is None:
        #     return

        return

    # ------------------------------------------------------------------
    async def back_from_offline(self, data):

        self.log.warn([[
            'o', ' - back_from_offline needs you     ', self.sess_id, '!' * 50
        ]])

        # # print 'on_back_from_offline.................'
        # # first validate that eg the server hasnt been restarted while this session has been offline
        # sess_ids = self.redis.s_get('ws;all_sess_ids')
        # serv_id = __old_SocketManager__.serv_id if self.sess_id in sess_ids else ''

        # self.emit('reconnect', {'serv_id': serv_id})

        # # now run any widget specific functions
        # with __old_SocketManager__.lock:
        #     widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)
        #     for widget_id in widget_ids:
        #         if widget_id in __old_SocketManager__.widget_inits:
        #             getattr(__old_SocketManager__.widget_inits[widget_id], 'back_from_offline')()

        return

    # ------------------------------------------------------------------
    async def sess_to_offline(self, data):
        """upon reconnection to an existing session
        """

        self.is_sess_offline = True

        self.log.warn([[
            'o', ' - sess_to_offline not implemented ', self.sess_id, '!' * 50
        ]])

        return

    # ------------------------------------------------------------------
    # is this still needed ?!?!?!?!?!?!?!?!
    # is this still needed ?!?!?!?!?!?!?!?!
    # ------------------------------------------------------------------
    def init_user_sync_loops(self):
        print('need init_user_sync_loops ... ?')
        # self.log.warn([['g', ' - need init_user_sync_loops ... ?']])
        return

    # ------------------------------------------------------------------
    def update_sync_state_from_client(self, data_in):
        data = data_in['data']

        if not self.check_panel_sync():
            return
        if 'widget_id' not in data:
            return
        # if not self.redis.h_exists(name='ws;active_widget', key=self.user_id):
        #     return

        active_widget = self.redis.h_get(
            name='ws;active_widget',
            key=self.user_id,
            default_val=None,
        )
        if active_widget != data['widget_id']:
            return

        all_sync_ids = []
        sync_groups = self.redis.h_get(
            name='ws;sync_groups', key=self.user_id, default_val=[]
        )

        for sync_group in sync_groups:
            states_0 = [s[0] for s in sync_group['sync_states'][0]]
            states_1 = [s[0] for s in sync_group['sync_states'][1]]
            states_2 = [s[0] for s in sync_group['sync_states'][2]]

            get_states = states_0 + states_2
            do_send = (data['widget_id'] in states_0 or data['widget_id'] in states_1)
            if do_send:
                sync_group['sync_types'][data['type']] = data['data']

                for id_now in get_states:
                    add_id = (id_now != data['widget_id'] and id_now not in all_sync_ids)
                    if add_id:
                        all_sync_ids.append(id_now)

        self.redis.h_set(name='ws;sync_groups', key=self.user_id, data=sync_groups)
        data_send = {
            'widget_id': data['widget_id'],
            'type': data['type'],
            'data': data['data']
        }

        self.redis.publish(
            channel='ws;update_sync_state;' + self.user_id,
            message=data_send,
        )

        return

    # ------------------------------------------------------------------
    async def update_sync_state_to_client(self, data_in=None):
        # print('update_sync_state_to_client !!!!!!!!!!!!!!!!!!!!!', data_in)

        await self.emit_to_queue(
            event_name='update_sync_state_from_server',
            data=data_in['pubsub_data'],
        )

        return

    # ------------------------------------------------------------------
    def client_log(self, data):
        """interface for client logs to be processed by the server

            This function is not awaited, since we need maximal fidelity that
            all messages are proccessed and in order
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the logging event
        """

        if data['metadata']['log_level'] == 'ERROR':
            self.log.error([['wr', ' - client_log:'], ['p', '', self.sess_id, ''],
                            ['y', data]])

        elif data['metadata']['log_level'] in ['WARN', 'WARNING']:
            self.log.warn([['b', ' - client_log:'], ['p', '', self.sess_id, ''],
                           ['y', data]])

        elif data['metadata']['log_level'] == 'INFO':
            self.log.info([['b', ' - client_log:'], ['p', '', self.sess_id, ''],
                           ['y', data]])

        else:
            raise Exception('unrecognised logging level from client', self.sess_id, data)

        return

    # ------------------------------------------------------------------
    # ------------------------------------------------------------------
    # for debugging
    # ------------------------------------------------------------------
    async def test_socket_evt(self, data):
        self.log.info([
            ['c', ' - test_socket_evt:'],
            ['p', '', self.sess_id, '\n\t\t\t'],
            ['g', data],
        ])

    # ------------------------------------------------------------------
    # ------------------------------------------------------------------