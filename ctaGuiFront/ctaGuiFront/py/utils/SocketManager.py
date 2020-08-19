import gevent
from gevent import sleep
from random import Random
from math import ceil
import importlib
try:
    from gevent.coros import BoundedSemaphore
except:
    from gevent.lock import BoundedSemaphore
from socketio.namespace import BaseNamespace
from socketio.mixins import BroadcastMixin

from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiUtils.py.utils import get_time, get_rnd
from ctaGuiUtils.py.RedisManager import RedisManager


# ------------------------------------------------------------------
# general class for views corresponding to sockets,
# from which specific view can also inherit
# ------------------------------------------------------------------
class SocketManager(BaseNamespace, BroadcastMixin):
    server_id = None

    # common dictionaries for all instances of
    # the class (keeping track of all sessions etc.)
    sess_endpoints = dict()
    thread_sigs = dict()
    widget_inits = dict()

    lock = BoundedSemaphore(1)

    # ------------------------------------------------------------------
    # individual parameters for a particular session
    # ------------------------------------------------------------------
    def __init__(self, *args, **kwargs):
        super(SocketManager, self).__init__(*args, **kwargs)

        self.log = LogParser(base_config=self.base_config, title=__name__)

        self.allowed_widget_types = self.base_config.allowed_widget_types
        self.redis_port = self.base_config.redis_port
        self.site_type = self.base_config.site_type
        self.allow_panel_sync = self.base_config.allow_panel_sync
        self.is_simulation = self.base_config.is_simulation

        self.sess_id = None
        self.user_id = ''
        self.user_group = ''
        self.user_group_id = ''
        self.sess_name = ''
        self.log_send_packet = False
        self.sess_expire = 10
        self.cleanup_sleep = 60

        self.redis = RedisManager(
            name=self.__class__.__name__, port=self.redis_port, log=self.log
        )

        self.inst_data = self.base_config.inst_data

        # ------------------------------------------------------------------
        # add some extra methods, as needed
        # ------------------------------------------------------------------
        SocketDecorator(self)

        # ------------------------------------------------------------------
        # cleanup the database of old sessions upon restart
        # ------------------------------------------------------------------
        with SocketManager.lock:
            if SocketManager.server_id is None:
                SocketManager.server_id = 'server_' + get_rnd(n_digits=10, out_type=str)

                # sess_ids_now = self.redis.l_get('ws;all_sess_ids')
                # for sess_id in sess_ids_now:
                #   self.cleanup_session(sess_id)
                # self.redis.delete('ws;all_user_ids')
                # self.redis.delete('ws;widget_infos')

        return

    # ------------------------------------------------------------------
    # upon any new connection
    # ------------------------------------------------------------------
    def recv_connect(self):
        server_id = SocketManager.server_id
        tel_ids = self.inst_data.get_inst_ids()
        tel_id_to_types = self.inst_data.get_inst_id_to_types()
        categorical_types = self.inst_data.get_categorical_types()

        self.emit(
            'initial_connect', {
                'server_id': server_id,
                'tel_ids': tel_ids,
                'tel_id_to_types': tel_id_to_types,
                'categorical_types': categorical_types,
            }
        )
        return

    # ------------------------------------------------------------------
    # upon reconnection to an existing session
    # ------------------------------------------------------------------
    def on_back_from_offline(self):
        if self.sess_id is None:
            return

        # print 'on_back_from_offline.................'
        # first validate that eg the server hasnt been restarted while this session has been offline
        sess_ids = self.redis.l_get('ws;all_sess_ids')
        server_id = SocketManager.server_id if self.sess_id in sess_ids else ''

        self.emit('reconnect', {'server_id': server_id})

        # now run any widget specific functions
        with SocketManager.lock:
            widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)
            for widget_id in widget_ids:
                if widget_id in SocketManager.widget_inits:
                    getattr(SocketManager.widget_inits[widget_id], 'back_from_offline')()

        return

    # ------------------------------------------------------------------
    def on_set_online_state(self, data):
        # print 'set_online_state',data

        return

    # ------------------------------------------------------------------
    def on_join_session(self, ses_id_now):
        self.user_id = self.request.authenticated_userid
        if not self.user_id:
            self.user_id = ''
        for princ in self.request.effective_principals:
            if princ.startswith('group:'):
                self.user_group = princ[len('group:'):]

        self.sess_id = str(ses_id_now)
        self.user_group_id = self.user_group + '_' + self.user_id
        self.sess_name = self.user_group_id + '_' + self.sess_id

        # override the global logging variable with a
        # name corresponding to the current session ids
        self.log = LogParser(
            base_config=self.base_config,
            title=(str(self.user_id) + '/' + str(self.sess_id) + '/' + __name__),
        )

        self.log.info([
            ['b', ' -- new session: '],
            ['g', self.sess_id, '', self.ns_name],
            ['b', ' --'],
        ])
        self.log.debug([
            ['b', ' - session details: '],
            ['y', SocketManager.server_id, ''],
            ['p', self.user_group_id, ''],
            ['y', self.user_id, ''],
            ['p', self.user_group_id, ''],
            ['y', self.sess_id, ''],
            ['p', self.sess_name, ''],
            ['y', self.ns_name, ''],
        ])

        with SocketManager.lock:
            all_user_ids = self.redis.l_get('ws;all_user_ids')
            if self.user_id not in all_user_ids:
                self.redis.r_push(name='ws;all_user_ids', data=self.user_id)

            # ------------------------------------------------------------------
            # all session ids in one list (heartbeat should be first to
            # avoid cleanup racing conditions!)
            # ------------------------------------------------------------------
            self.redis.set(
                name='sess_heartbeat;' + self.sess_id, expire=(int(self.sess_expire) * 2)
            )
            self.redis.r_push(name='ws;all_sess_ids', data=self.sess_id)

            # ------------------------------------------------------------------
            # the socket endpoint type registry for this session
            # ------------------------------------------------------------------
            SocketManager.sess_endpoints[self.sess_id] = self.ns_name

            # ------------------------------------------------------------------
            if not self.redis.h_exists(name='ws;sync_groups', key=self.user_id):
                self.redis.h_set(name='ws;sync_groups', key=self.user_id, data=[])

            # ------------------------------------------------------------------
            # list of all sessions for this user
            # ------------------------------------------------------------------
            self.redis.r_push(name='ws;user_sess_ids;' + self.user_id, data=self.sess_id)

        # ------------------------------------------------------------------
        # initiate the threads which does periodic cleanup, heartbeat managment etc.
        # ------------------------------------------------------------------
        with SocketManager.lock:
            threads = [
                {
                    'id': -1,
                    'group': 'shared_thread',
                    'tag': 'sess_heartbeat',
                    'func': self.sess_heartbeat,
                },
                {
                    'id': -1,
                    'group': 'shared_thread',
                    'tag': 'cleanup',
                    'func': self.cleanup,
                },
                {
                    'id': -1,
                    'group': 'shared_thread',
                    'tag': 'pubsub_socket_evt_widgets',
                    'func': self.pubsub_socket_evt_widgets,
                },
            ]

            for thread_info in threads:
                if self.check_thread(thread_info):
                    thread_info['id'] = self.set_thread_state(
                        thread_info['group'], thread_info['tag'], True
                    )
                    gevent.spawn(thread_info['func'], thread_info)

        # ------------------------------------------------------------------
        # transmit the initial data to the client
        # ------------------------------------------------------------------
        join_session_data = {
            'session_props': {
                'sess_id': str(self.sess_id),
                'user_id': str(self.user_id),
                'is_simulation': self.is_simulation,
            },
        }

        self.socket_evt_session(event_name='join_session_data', data=join_session_data)

        # ------------------------------------------------------------------
        # function which may be overloaded, setting up individual
        # properties for a given session-type
        # ------------------------------------------------------------------
        self.on_join_session_()

        # ------------------------------------------------------------------
        self.init_user_sync_loops()

        return

    # ------------------------------------------------------------------
    # general communication with a widget (will import and instantiate a class if needed)
    # ------------------------------------------------------------------
    def on_widget(self, data):
        n_sess_try = 0
        while self.sess_id is None:
            n_sess_try += 1
            if n_sess_try >= 20:
                self.log.warning([['rb', ' - ignoring zombie session - on_widget('],
                                  ['yb', data], ['rb', ') !!!!!!!!']])
                return
            sleep(0.5)

        # basic widget info
        # ------------------------------------------------------------------
        widget_id = data['widget_id']
        widget_source = 'widgets.' + data['widget_source']
        widget_name = data['widget_name']
        n_sync_group = data['n_sync_group'] if 'n_sync_group' in data else 0
        sync_type = data['sync_type'] if 'sync_type' in data else 0

        if not self.check_panel_sync():
            n_sync_group = -1

        # first make sure the requested widget has been registered as a legitimate class
        is_panel_sync = (widget_name in self.allowed_widget_types['not_synced'])
        is_allowed = widget_name in self.allowed_widget_types['synced']
        if not is_panel_sync and not is_allowed:
            self.log.critical([
                ['wr', ' - widget_name =', widget_name, ''],
                ['wr', 'has not been registered in allowed_widget_types ?!?!'],
                ['wr', ' --> Will terminate!'],
            ])
            raise Exception()

            return

        # ------------------------------------------------------------------
        # dynamically load the module for the requested widget
        # (no need for a 'from dynamicLoadWidget import dynWidg_0' statement)
        # ------------------------------------------------------------------
        with SocketManager.lock:
            has_widget_id = self.redis.h_exists(name='ws;widget_infos', key=widget_id)

        if not has_widget_id:
            # the following is equivalent e.g., to:
            #   from dynamicLoadWidget import dynWidg_0
            #   widget = dynWidg_0(widget_id=widget_id, SocketManager=self)
            # widget_module = __import__(widget_source, globals=globals())
            widget_module = importlib.import_module(
                widget_source,
                package=None,
            )

            with SocketManager.lock:
                SocketManager.widget_inits[widget_id] = getattr(
                    widget_module, widget_name
                )(widget_id=widget_id, socket_manager=self)

            with SocketManager.lock:
                if is_panel_sync:
                    n_sync_group = -1
                    n_icon = -1
                else:
                    n_icon = self.allowed_widget_types['synced'].index(widget_name)
                    while True:
                        widget_ids = self.redis.l_get('ws;user_widget_ids;' + self.user_id)
                        if len(widget_ids) == 0:
                            break

                        widget_infos = self.redis.h_m_get(
                            name='ws;widget_infos', key=widget_ids, filter=True
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

                        # the sync_group['id'] must correspond to the pattern defined by the client
                        # for new groups (e.g., 'grp_0') !!!
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
                self.update_sync_group()

        # ------------------------------------------------------------------
        # call the method named args[1] with optional arguments args[2], equivalent e.g., to:
        #   widget.method_name(optionalArgs)
        # ------------------------------------------------------------------
        if 'method_name' in data and widget_id in SocketManager.widget_inits:
            widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)
            if 'method_arg' in data:
                getattr(SocketManager.widget_inits[widget_id], data['method_name'])(
                    data['method_arg']
                )
            else:
                getattr(SocketManager.widget_inits[widget_id], data['method_name'])()

        return

    # ------------------------------------------------------------------

    def init_user_sync_loops(self):
        return

    # ------------------------------------------------------------------
    # prevent panle sync based on a global setting & user-name
    # ------------------------------------------------------------------
    def check_panel_sync(self):
        allow = False
        if self.allow_panel_sync:
            allow = (self.user_id != 'guest')

        return allow

    # ------------------------------------------------------------------
    def update_sync_group(self):
        widget_ids = []
        with SocketManager.lock:
            widget_infos = self.redis.h_get_all(name='ws;widget_infos')
            for widget_id, widget_now in widget_infos.items():
                if widget_now['n_icon'] == -1 and widget_id in SocketManager.widget_inits:
                    widget_ids.append(widget_id)

        for widget_id in widget_ids:
            getattr(SocketManager.widget_inits[widget_id], 'update_sync_groups')()

        return

    # ------------------------------------------------------------------
    def on_sync_state_send(self, data_in):
        if not self.check_panel_sync():
            return
        if 'widget_id' not in data_in:
            return
        if not self.redis.h_exists(name='ws;active_widget', key=self.user_id):
            return
        all_sync_ids = []
        with SocketManager.lock:
            if self.redis.h_get(name='ws;active_widget',
                                key=self.user_id) != data_in['widget_id']:
                return

            sync_groups = self.redis.h_get(
                name='ws;sync_groups', key=self.user_id, default_val=[]
            )

            for sync_group in sync_groups:
                states_0 = [i[0] for i in sync_group['sync_states'][0]]
                states_1 = [i[0] for i in sync_group['sync_states'][1]]
                states_2 = [i[0] for i in sync_group['sync_states'][2]]

                get_states = states_0 + states_2
                do_send = (
                    data_in['widget_id'] in states_0 or data_in['widget_id'] in states_1
                )
                if do_send:
                    sync_group['sync_types'][data_in['type']] = data_in['data']

                    for id_now in get_states:
                        if (id_now != data_in['widget_id']
                                and id_now not in all_sync_ids):
                            all_sync_ids.append(id_now)

            self.redis.h_set(name='ws;sync_groups', key=self.user_id, data=sync_groups)
        data = {
            'widget_id': data_in['widget_id'],
            'type': data_in['type'],
            'data': data_in['data']
        }
        self.socket_event_widgets(
            event_name='get_sync_state', data=data, widget_ids=all_sync_ids
        )

        return

    # ------------------------------------------------------------------
    def on_set_active_widget(self, data):
        active_widget = self.redis.h_get(
            name='ws;active_widget', key=self.user_id, default_val=None
        )

        if active_widget != data['widget_id']:
            self.redis.h_set(
                name='ws;active_widget', key=self.user_id, data=data['widget_id']
            )

        return

    # ------------------------------------------------------------------
    # placeholder for overloaded method, to be run as part of on_leave_session
    # ------------------------------------------------------------------
    def on_leave_session_(self):
        return

    # ------------------------------------------------------------------
    # initial dataset and send to client
    # ------------------------------------------------------------------
    def send_widget_init_data(self, opt_in=None):
        widget = opt_in['widget']
        data_func = (opt_in['data_func'] if 'data_func' in opt_in else lambda: dict())
        thread_group = (
            opt_in['thread_group'] if 'thread_group' in opt_in else 'init_data'
        )

        with widget.lock:
            emit_data = {
                'widget_type': widget.widget_name,
                'event_name': thread_group,
                'n_icon': widget.n_icon,
                'data': data_func()
            }

            widget.log.info([['y', ' - sending - ('],
                             ['b', widget.widget_name, thread_group], ['y', ','],
                             ['g', self.sess_id, '/', widget.widget_id], ['y', ')']])

            # print('widget.widget_id',widget.widget_id, thread_group, emit_data)
            self.socket_evt_session(
                widget_id=widget.widget_id, event_name=thread_group, data=emit_data
            )

        return

    # ------------------------------------------------------------------
    def add_widget_loop(self, opt_in=None):
        if 'is_group_thread' not in opt_in:
            opt_in['is_group_thread'] = True

        widget = opt_in['widget']

        thread_group = opt_in['thread_group'
                              ] if 'thread_group' in opt_in else 'update_data'
        opt_in['thread_group'] = thread_group

        thread_func = opt_in['thread_func'] if 'thread_func' in opt_in else None
        if thread_func is None and thread_group == 'update_data':
            thread_func = self.widget_thread_func

        is_group_thread = opt_in['is_group_thread']

        with widget.lock:
            if is_group_thread:
                if widget.widget_group not in widget.widget_group_sess:
                    widget.widget_group_sess[widget.widget_group] = []

                widget.widget_group_sess[widget.widget_group].append(
                    widget.socket_manager.sess_id
                )

                if self.get_thread_id(widget.widget_group, thread_group) == -1:
                    with SocketManager.lock:
                        opt_in['thread_id'] = self.set_thread_state(
                            widget.widget_group, thread_group, True
                        )

                        gevent.spawn(thread_func, opt_in=opt_in)
            else:
                if self.get_thread_id(widget.widget_id, thread_group) == -1:
                    with SocketManager.lock:
                        opt_in['thread_id'] = self.set_thread_state(
                            widget.widget_id, thread_group, True
                        )

                        gevent.spawn(thread_func, opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    def widget_thread_func(self, opt_in=None):
        widget = opt_in['widget']
        thread_id = opt_in['thread_id']
        thread_group = opt_in['thread_group']
        data_func = opt_in['data_func']
        sleep_seconds = opt_in['sleep_seconds'] if 'sleep_seconds' in opt_in else 5
        is_group_thread = opt_in['is_group_thread']

        emit_data = {'widget_type': widget.widget_name, 'event_name': thread_group}

        sleep(sleep_seconds)

        if is_group_thread:
            while (thread_id == self.get_thread_id(widget.widget_group, thread_group)):
                with widget.lock:
                    sess_ids = widget.widget_group_sess[widget.widget_group]
                    emit_data['data'] = data_func()

                    self.socket_event_widgets(
                        event_name=thread_group, data=emit_data, sess_ids=sess_ids
                    )

                    if len(widget.widget_group_sess[widget.widget_group]) == 0:
                        with self.lock:
                            self.clear_threads_type(widget.widget_group)
                            widget.widget_group_sess.pop(widget.widget_group, None)
                            break

                sleep(sleep_seconds)

        else:
            while (thread_id == self.get_thread_id(widget.widget_id, thread_group)):
                with widget.lock:
                    sess_ids = [widget.socket_manager.sess_id]
                    emit_data['data'] = data_func()

                    self.socket_event_widgets(
                        event_name=thread_group, data=emit_data, sess_ids=sess_ids
                    )

                sleep(sleep_seconds)

        return

    # ------------------------------------------------------------------
    def pubsub_socket_evt_widgets(self, thread_info):
        self.log.info([['y', ' - starting shared_thread('],
                       ['g', 'pubsub_socket_evt_widgets'], ['y', ')']])

        while self.redis.set_pubsub('socket_event_widgets') is None:
            self.log.info([['y', ' - setting up PubSub - '],
                           ['b', 'socket_event_widgets'], ['y', ' ...']])
            sleep(0.1)

        while self.check_thread(thread_info):
            sleep(0.1)

            msg = self.redis.get_pubsub('socket_event_widgets')
            if msg is None:
                continue

            data = msg['data']['data']
            event_name = msg['data']['event_name']
            sess_ids = msg['data']['sess_ids']
            widget_ids = msg['data']['widget_ids']

            with SocketManager.lock:
                if sess_ids is None:
                    sess_ids = self.redis.l_get('ws;all_sess_ids')

                if self.log_send_packet:
                    self.log.info([[
                        'b', 'start ' + event_name + '  --> ' + lts(sess_ids)
                    ]])
                    self.log.info([[
                        'b', 'start ' + event_name + '  --> ' + '[' +
                        (',').join(sess_ids) + ']'
                    ]])

                user_sess_ids = self.redis.l_get('ws;user_sess_ids;' + self.user_id)
                sess_ids = [
                    x for x in sess_ids
                    if (x in self.socket.server.sockets and x in user_sess_ids)
                ]

                for sess_id in sess_ids:
                    ids = self.redis.l_get('ws;sess_widget_ids;' + sess_id)
                    if widget_ids is None:
                        data['sess_widget_ids'] = ids
                    else:
                        data['sess_widget_ids'] = [i for i in ids if i in widget_ids]

                    data['emit_time'] = get_time('msec')

                    pkt = dict(
                        type='event',
                        name=event_name,
                        args=data,
                        endpoint=SocketManager.sess_endpoints[sess_id]
                    )
                    self.socket.server.sockets[sess_id].send_packet(pkt)

            if self.log_send_packet:
                self.log.info(['r', 'end of send ' + event_name])

        self.log.info([['y', ' - ending shared_thread('],
                       ['g', 'pubsub_socket_evt_widgets'], ['y', ')']])

        return

    # ------------------------------------------------------------------
    # emit an event to the current session, or to a list of sessions
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
    def socket_evt_session(self, widget_id='', event_name=None, data=None):
        data = {} if data is None else data
        data['widget_id'] = widget_id

        event_name = data['event_name'] if event_name is None else event_name
        data['event_name'] = event_name

        with SocketManager.lock:
            if self.sess_id in self.socket.server.sockets:
                data['emit_time'] = get_time('msec')

                pkt = dict(
                    type='event',
                    name=event_name,
                    args=data,
                    endpoint=SocketManager.sess_endpoints[self.sess_id]
                )
                self.socket.server.sockets[self.sess_id].send_packet(pkt)

        return

    # ------------------------------------------------------------------
    # bookkeeping of threads and thread-signal cleanup
    # make sure the function which calls this has secured the thred-lock (SocketManager.lock)
    # ------------------------------------------------------------------
    def set_thread_state(self, thread_group, thread_tag, state):
        if state:
            if thread_group not in SocketManager.thread_sigs:
                SocketManager.thread_sigs[thread_group] = []

            thread_id_now = get_rnd(n_digits=15, out_type=int)

            for n_ele_now in range(len(SocketManager.thread_sigs[thread_group])):
                if SocketManager.thread_sigs[thread_group][n_ele_now][0] == thread_tag:
                    SocketManager.thread_sigs[thread_group][n_ele_now][1] = thread_id_now
                    return thread_id_now

            SocketManager.thread_sigs[thread_group].append([thread_tag, thread_id_now])

            return thread_id_now
        else:
            for n_ele_now in range(len(SocketManager.thread_sigs[thread_group])):
                if SocketManager.thread_sigs[thread_group][n_ele_now][0] == thread_tag:
                    SocketManager.thread_sigs[thread_group][n_ele_now][1] = -1

            return -1

    # ------------------------------------------------------------------
    def get_thread_id(self, thread_group, thread_tag):
        if thread_group in SocketManager.thread_sigs:
            for ele_now in SocketManager.thread_sigs[thread_group]:
                if ele_now[0] == thread_tag:
                    return ele_now[1]

        return -1

    # ------------------------------------------------------------------
    def check_thread(self, thread_info):
        thread_id = thread_info['id']
        thread_group = thread_info['group']
        thread_tag = thread_info['tag']

        is_valid = (thread_id == self.get_thread_id(thread_group, thread_tag))
        return is_valid

    # ------------------------------------------------------------------
    # clean unneeded threads, assuming we are already in a thread
    # lock, for safe modification of SocketManager.thread_sigs
    # ------------------------------------------------------------------
    def clear_threads_type(self, thread_group):
        if thread_group in SocketManager.thread_sigs:
            SocketManager.thread_sigs.pop(thread_group, None)

            self.log.info([['r', ' - clear_threads_type(' + str(thread_group) + ') ...']])

        return

    # # ------------------------------------------------------------------
    # # for development - a refresh-all event
    # # ------------------------------------------------------------------
    # def on_refreshAll(self, has_lock=False):
    #     def doRefresh():
    #         sess_ids = self.redis.l_get('ws;all_sess_ids')
    #         sess_ids = [x for x in sess_ids if x in self.socket.server.sockets]

    #         for sess_id in sess_ids:
    #             data = {'emit_time': get_time('msec')}

    #             pkt = dict(type='event', name='refreshAll', args=data,
    #                        endpoint=SocketManager.sess_endpoints[sess_id])
    #             self.socket.server.sockets[sess_id].send_packet(pkt)

    #         return

    #     if has_lock:
    #         doRefresh()
    #     else:
    #         with SocketManager.lock:
    #             doRefresh()

    #     return

    # ------------------------------------------------------------------
    # disconnection may be received even if not explicitly emmitted by
    # the user leaving the session (e.g., internet connection loss or
    # server freeze), therefore call on_leave_session() explicitly
    # ------------------------------------------------------------------
    def recv_disconnect(self):
        self.log.debug([
            ['r', ' - Connection to '],
            ['p', self.sess_name],
            ['r', ' terminated...'],
        ])

        sess_ids = self.redis.l_get('ws;all_sess_ids')
        if (self.sess_name != '') and (self.sess_id in sess_ids):
            self.on_leave_session()

        self.disconnect(silent=True)
        return

    # ------------------------------------------------------------------
    # on leaving the session
    # ------------------------------------------------------------------
    def on_leave_session(self):
        with SocketManager.lock:
            sess_ids_now = self.redis.l_get('ws;user_sess_ids;' + self.user_id)
            self.log.info([
                ['b', ' - leaving session '],
                ['y', self.sess_name + ' , ' + self.user_id],
                ['b', ' where all Ids('],
                ['g', str(len(sess_ids_now))],
                ['b', ') = ['],
                ['p', (',').join(sess_ids_now)],
                ['b', ']'],
            ])

            # remove the widgets which belong to this session
            widget_ids = self.redis.l_get('ws;sess_widget_ids;' + self.sess_id)
            sync_groups = self.redis.h_get(
                name='ws;sync_groups', key=self.user_id, default_val=[]
            )

            for widget_id in widget_ids:
                self.redis.h_del(name='ws;widget_infos', key=widget_id)

                for sync_group in sync_groups:
                    for sync_states in sync_group['sync_states']:
                        rm_elements = []
                        for sync_type_now in sync_states:
                            if sync_type_now[0] == widget_id:
                                rm_elements.append(sync_type_now)
                        for rm_element in rm_elements:
                            sync_states.remove(rm_element)

                self.clear_threads_type(widget_id)

            self.redis.h_set(name='ws;sync_groups', key=self.user_id, data=sync_groups)

            # ------------------------------------------------------------------
            # remove this session from the general registry
            # ------------------------------------------------------------------
            self.cleanup_session(self.sess_id)

            # ------------------------------------------------------------------
            # cleanup possible threads belonging to this specific session
            # ------------------------------------------------------------------
            self.clear_threads_type(self.sess_name)

        self.update_sync_group()

        self.on_leave_session_()

        return

    # ------------------------------------------------------------------
    # placeholder for overloaded method, to be run as part of on_join_session
    # ------------------------------------------------------------------
    def on_join_session_(self):
        return

    # ------------------------------------------------------------------
    def cleanup_session(self, sess_id=None):
        if sess_id is None:
            return
        self.log.info([
            ['b', ' - cleanup_session sessionId(', SocketManager.server_id, ') '],
            ['p', sess_id],
        ])

        all_user_ids = self.redis.l_get('ws;all_user_ids')
        widget_ids = self.redis.l_get('ws;sess_widget_ids;' + sess_id)

        for user_id in all_user_ids:
            self.redis.l_rem(name='ws;user_sess_ids;' + user_id, data=sess_id)

        for widget_id in widget_ids:
            self.log.info([[
                'b', ' - cleanup_session widget_id (', SocketManager.server_id, ') '
            ], ['p', widget_id]])

            self.redis.h_del(name='ws;widget_infos', key=widget_id)
            if widget_id in SocketManager.widget_inits:
                SocketManager.widget_inits.pop(widget_id, None)
            for user_id in all_user_ids:
                self.redis.l_rem(name='ws;user_widget_ids;' + user_id, data=widget_id)

        self.redis.delete('ws;sess_widget_ids;' + sess_id)
        self.redis.delete('sess_heartbeat;' + sess_id)
        self.redis.l_rem(name='ws;all_sess_ids', data=sess_id)

        if sess_id in SocketManager.sess_endpoints:
            SocketManager.sess_endpoints.pop(sess_id, None)

        return

    # ------------------------------------------------------------------
    # renew session heartbeat token (run in thread) for all active sessions
    # ------------------------------------------------------------------
    def sess_heartbeat(self, thread_info):
        self.log.info([['y', ' - starting shared_thread('], ['g', 'sess_heartbeat'],
                       ['y', ') - ', SocketManager.server_id]])

        sleep_seconds = max(ceil(self.sess_expire * 0.1), 10)
        sess_expire = int(max(self.sess_expire, sleep_seconds * 2))

        while self.check_thread(thread_info):
            with SocketManager.lock:
                sess_ids = self.redis.l_get('ws;all_sess_ids')
                sess_ids = [x for x in sess_ids if x in self.socket.server.sockets]

                for sess_id in sess_ids:
                    if self.redis.exists('sess_heartbeat;' + sess_id):
                        self.redis.expire(
                            name='sess_heartbeat;' + sess_id, expire=sess_expire
                        )
                    else:
                        self.cleanup_session(sess_id)

            sleep(sleep_seconds)

        self.log.info([['y', ' - ending shared_thread('], ['g', 'sess_heartbeat']])

        return

    # ------------------------------------------------------------------
    # cleanup (run in thread) for all the bookkeeping elements
    # ------------------------------------------------------------------
    def cleanup(self, thread_info):
        self.log.info([['y', ' - starting shared_thread('], ['g', 'cleanup'],
                       ['y', ') - ', SocketManager.server_id]])
        sleep(3)

        while self.check_thread(thread_info):
            with SocketManager.lock:
                all_user_ids = self.redis.l_get('ws;all_user_ids')
                sess_ids = self.redis.l_get('ws;all_sess_ids')

                for sess_id in sess_ids:
                    if not self.redis.exists('sess_heartbeat;' + sess_id):
                        self.cleanup_session(sess_id)

                sess_ids = self.redis.l_get('ws;all_sess_ids')
                for user_id in all_user_ids:
                    sess_ids_now = self.redis.l_get('ws;user_sess_ids;' + user_id)
                    zombie_ids = [x for x in sess_ids_now if x not in sess_ids]
                    for sess_id in zombie_ids:
                        self.redis.l_rem(name='ws;user_sess_ids;' + user_id, data=sess_id)

                    # just in case, cleanup any remaining widgets
                    if len(sess_ids_now) == len(zombie_ids):
                        widget_ids = self.redis.l_get('ws;user_widget_ids;' + user_id)
                        for widget_id in widget_ids:
                            self.redis.h_del(name='ws;widget_infos', key=widget_id)
                            if widget_id in SocketManager.widget_inits:
                                SocketManager.widget_inits.pop(widget_id, None)

                        self.redis.delete('ws;user_sess_ids;' + user_id)
                        self.redis.delete('ws;user_widget_ids;' + user_id)
                        self.redis.h_del(name='ws;active_widget', key=user_id)
                        self.redis.l_rem(name='ws;all_user_ids', data=user_id)

                if not self.redis.exists('ws;all_user_ids'):
                    break

            sleep(self.cleanup_sleep)

        self.clear_threads_type('shared_thread')
        # self.set_thread_state('shared_thread', 'cleanup', False)
        # self.set_thread_state('shared_thread', 'sess_heartbeat', False)
        # self.set_thread_state('shared_thread', 'pubsub_socket_evt_widgets', False)

        self.log.info([['y', ' - ending shared_thread('], ['g', 'cleanup']])

        return


# ------------------------------------------------------------------
# add some functionality to the socket_manager for specific tasks, which
# can easily be turned off via flags
# ------------------------------------------------------------------
class SocketDecorator():
    def __init__(self, socket_manager, *args, **kwargs):
        self.socket_manager = socket_manager
        self.log = self.socket_manager.log

        if self.socket_manager.is_simulation:
            ClockSimDecorator(socket_manager)

        return


# ------------------------------------------------------------------
class ClockSimDecorator():
    def __init__(self, socket_manager, *args, **kwargs):
        self.socket_manager = socket_manager
        self.log = self.socket_manager.log
        self.redis = self.socket_manager.redis

        setattr(
            self.socket_manager,
            'on_get_sim_clock_sim_params',
            self.on_get_sim_clock_sim_params,
        )

        setattr(
            self.socket_manager,
            'on_set_sim_clock_sim_params',
            self.on_set_sim_clock_sim_params,
        )

        thread_info = {
            'id': -1,
            'group': 'shared_thread',
            'tag': 'clock_sim_sim_params',
        }
        if self.socket_manager.check_thread(thread_info):
            thread_info['id'] = self.socket_manager.set_thread_state(
                thread_info['group'], thread_info['tag'], True
            )

            gevent.spawn(self.update_sim_params, thread_info)

        return

    # ------------------------------------------------------------------
    def on_get_sim_clock_sim_params(self, data_in):
        sess_id = data_in['sess_id']

        data = self.redis.get('clock_sim_sim_params')
        emit_data = {'data': data}

        # send the requested data back to the same session
        self.socket_manager.socket_event_widgets(
            event_name='get_sim_clock_sim_params',
            sess_ids=[sess_id],
            data=emit_data,
        )

        return

    # ------------------------------------------------------------------
    def on_set_sim_clock_sim_params(self, data_in):
        data_pubsub = data_in['data']

        self.redis.publish(
            channel='clock_sim_set_sim_params',
            message=data_pubsub,
        )

        return

    # ------------------------------------------------------------------
    def update_sim_params(self, thread_info):
        self.log.info([
            ['y', ' - starting shared_thread('],
            ['g', 'clock_sim_sim_params'],
            ['y', ') - ', self.socket_manager.server_id],
        ])

        # setup the channel once
        pubsub_tag = 'clock_sim_updated_sim_params'
        while self.redis.set_pubsub(pubsub_tag) is None:
            sleep(0.1)

        while self.socket_manager.check_thread(thread_info):
            msg = self.redis.get_pubsub(pubsub_tag)
            if msg is None:
                continue

            # get the full data structure
            data = self.redis.get('clock_sim_sim_params')
            emit_data = {'data': data}

            # send the updated value to all sessions
            self.socket_manager.socket_event_widgets(
                event_name='get_sim_clock_sim_params',
                data=emit_data,
            )

            sleep(0.1)

        return
