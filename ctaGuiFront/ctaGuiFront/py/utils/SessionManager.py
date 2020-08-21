from ctaGuiFront.py.utils.security import USERS

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

        self.log.info([['c', ' - sess_disconnected '], ['p', self.sess_id]])

        self.set_sess_state(state=False)

        try:
            async with self.get_lock('sess'):
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
            'server_id': self.server_id,
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

        is_existing_sess = (self.sess_id != data['sess_id'])

        # ------------------------------------------------------------------
        # for development, its conveniet to reload if the server was restarted, but
        # for deployment, the same session can simply be restored
        if self.is_HMI_dev:
            if is_existing_sess:
                self.sess_id = data['sess_id']
                await self.emit(event_name='reload_session')
                return
        # ------------------------------------------------------------------

        if is_existing_sess:
            self.sess_id = data['sess_id']
            self.log.info([
                ['p', ' - restoring existing session: '],
                ['c', self.sess_id],
            ])

        async with self.get_lock('sess'):
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

            # # override the global logging variable with a
            # # name corresponding to the current session ids
            # self.log = LogParser(
            #     base_config=self.base_config,
            #     title=(str(self.user_id) + '/' + str(self.sess_id) + '/' + __name__),
            # )

            # keep track of all instances for broadcasting events (cleaned up
            # as part of cleanup_session())
            await self.add_server_attr(name='managers', key=self.sess_id, value=self)

            # register the user_name if needed (cleanup as part of cleanup_server())
            async with self.get_lock('global'):
                # registed the server id in the global server list
                # (cleanup explicitly done as part of cleanup_server())
                all_server_ids = self.redis.l_get('ws;all_server_ids')
                if self.server_id not in all_server_ids:
                    self.redis.r_push(name='ws;all_server_ids', data=self.server_id)

                all_user_ids = self.redis.l_get('ws;all_user_ids')
                if self.user_id not in all_user_ids:
                    self.redis.r_push(name='ws;all_user_ids', data=self.user_id)

                # registed the session id in the global session list, and in the server
                # session list (cleanup explicitly done as part of cleanup_session(),
                # also if loosing heartbeat as part of cleanup_server())
                all_sess_ids = self.redis.l_get('ws;all_sess_ids')
                if self.sess_id not in all_sess_ids:
                    self.redis.r_push(name='ws;all_sess_ids', data=self.sess_id)

                # register the user_id for the heartbeat monitor
                # (expires on its own, inless renewed by server_sess_heartbeat_loop() )
                self.redis.set(
                    name=self.get_heartbeat_name('user'),
                    expire=(int(self.sess_expire) * 10),
                )

            async with self.get_lock('user'):
                # list of all sessions for this user
                user_sess_ids = self.redis.l_get('ws;user_sess_ids;' + self.user_id)
                if self.sess_id not in user_sess_ids:
                    self.redis.r_push(
                        name='ws;user_sess_ids;' + self.user_id, data=self.sess_id
                    )

                # synchronisation groups for users (cleaned up as part of
                # cleanup_server(), when no more sessions remain alive for this user)
                if not self.redis.h_exists(name='ws;sync_groups', key=self.user_id):
                    self.redis.h_set(name='ws;sync_groups', key=self.user_id, data=[])

            async with self.get_lock('server'):
                # register the server_id for the heartbeat monitor
                # (expires on its own, inless renewed by server_sess_heartbeat_loop() )
                self.redis.set(
                    name=self.get_heartbeat_name('server'),
                    expire=(int(self.sess_expire) * 10),
                )

                server_sess_ids = self.redis.l_get('ws;server_sess_ids;' + self.server_id)
                if self.sess_id not in server_sess_ids:
                    self.redis.r_push(
                        name='ws;server_sess_ids;' + self.server_id, data=self.sess_id
                    )

            # register the sess_id for the heartbeat monitor
            # (expires on its own, inless renewed by server_sess_heartbeat_loop() )
            self.redis.set(
                name=self.get_heartbeat_name('sess'),
                expire=(int(self.sess_expire) * 10),
            )

        # start up (if not already running) loops for this server / user / session
        # async with self.get_lock(('user', 'server', 'sess')):
        await self.init_common_loops()

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
            'r', ' - sess_to_online not implemented ', self.sess_id, '!' * 90
        ]])

        self.is_sess_offline = False

        # prevent the ping/pong heartbeat for the first iteration
        self.sess_ping_time = None

        # if self.sess_id is None:
        #     return

        # # print 'on_back_from_offline.................'
        # # first validate that eg the server hasnt been restarted while this session has been offline
        # sess_ids = self.redis.l_get('ws;all_sess_ids')
        # server_id = __old_SocketManager__.server_id if self.sess_id in sess_ids else ''

        # self.emit('reconnect', {'server_id': server_id})

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
            'r', ' - sess_to_offline not implemented ', self.sess_id, '!' * 90
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
    def client_log(self, data):
        """interface for client logs to be processed by the server

            This function is not awaited, since we need maximal fidelity that
            all messages are proccessed and in order
        
            Parameters
            ----------
            data : dict
                client data and metadata related to the logging event
        """

        if data['log_level'] == 'ERROR':
            self.log.error([['wr', ' - client_log:'], ['p', '', self.sess_id, ''],
                            ['y', data]])

        elif data['log_level'] in ['WARN', 'WARNING']:
            self.log.warn([['b', ' - client_log:'], ['p', '', self.sess_id, ''],
                           ['y', data]])

        elif data['log_level'] == 'INFO':
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
        self.log.info([['c', ' - test_socket_evt:'], ['p', '', self.sess_id, '\n\t\t\t'],
                       ['g', data]])

    # ------------------------------------------------------------------
    # ------------------------------------------------------------------
