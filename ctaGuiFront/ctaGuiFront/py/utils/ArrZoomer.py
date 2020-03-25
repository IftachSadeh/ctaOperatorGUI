import gevent
from gevent import sleep
from gevent.coros import BoundedSemaphore
from ctaGuiUtils.py.utils import my_log, my_assert, flatten_dict


# ------------------------------------------------------------------
#  ArrZoomer
# ------------------------------------------------------------------
class ArrZoomer():
    # privat lock for this widget type
    lock = BoundedSemaphore(1)

    # all session ids for this user/widget
    widget_group_sess = dict()

    send_data = {
        's_0': {'sess_id': [], 'widget_id': []},
        's_1': dict(),
    }

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, parent_widget):
        self.set_parent_widget(parent_widget)
        self.add_parent_interfaces()

        log_title = parent_widget.log.get_title() + '/' + __name__
        ArrZoomer.log = my_log(title=log_title)

        # the id of this instance
        self.widget_id = parent_widget.widget_id
        # the parent of this widget
        self.socket_manager = parent_widget.socket_manager
        # widget-class and widget group names
        self.widget_name = parent_widget.widget_name
        # redis interface
        self.redis = parent_widget.redis
        # turn on periodic data updates
        self.do_data_updates = parent_widget.do_data_updates
        # some etra logging messages for this module
        self.log_send_packet = parent_widget.log_send_packet

        my_assert(
            log=ArrZoomer.log, state=(self.socket_manager is not None),
            msg=[' - no socket_manager handed to', self.__class__.__name__],
        )

        self.zoom_state = None
        self.inst_data = self.socket_manager.InstData
        self.inst_ids = self.inst_data.get_inst_ids()
        self.proc_ids = self.inst_data.get_proc_ids()
        self.inst_types = self.inst_data.get_inst_id_to_types()

        return

    # ------------------------------------------------------------------
    # validate that the parent has all the required properties
    # ------------------------------------------------------------------
    def set_parent_widget(self, parent_widget):
        self.parent_widget = parent_widget

        check_init_properties = [
            'widget_id', 'socket_manager', 'widget_name',
            'redis', 'do_data_updates', 'log_send_packet', 'n_icon',
        ]

        for init_property in check_init_properties:
            if not hasattr(parent_widget, init_property):
                ArrZoomer.log.error([
                    ['wr', ' - bad initialisation of ArrZoomer()...',
                     'Missing: '], ['yr', init_property, ''],
                ])
                print('FIXME - need proper exception handling ...')
                raise

        return

    # ------------------------------------------------------------------
    # add interface functions to the parent related eg to socket events
    # ------------------------------------------------------------------
    def add_parent_interfaces(self):
        # get_zoomer_state
        def get_zoomer_state():
            return self.zoom_state
        self.parent_widget.get_zoomer_state = get_zoomer_state

        # arr_zoomer_ask_data_s1
        def ask_data_s1(*args):
            self.ask_data_s1(*args)
            return
        self.parent_widget.arr_zoomer_ask_data_s1 = ask_data_s1

        # arr_zoomer_set_widget_state
        def set_widget_state(*args):
            self.set_widget_state(*args)
            return
        self.parent_widget.arr_zoomer_set_widget_state = set_widget_state

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        self.n_icon = self.parent_widget.n_icon

        with self.socket_manager.lock:
            wgt = self.redis.hGet(
                name='all_widgets', key=self.widget_id, packed=True,
            )

        self.zoom_state = wgt['widget_state']
        self.zoom_state['zoom_state'] = 0
        self.zoom_state['zoom_target'] = ''

        self.init_tel_health()

        # ------------------------------------------------------------------
        # initial dataset and send to client
        # ------------------------------------------------------------------
        opt_in = {
            'widget': self,
            'data_func': self.get_init_data,
            'thread_type': 'init_data'# + 'ArrZoomer',
            # + self.widget_id,
        }

        self.socket_manager.send_init_widget(opt_in=opt_in)
        
        # ------------------------------------------------------------------
        # spawn updating threads if needed
        # ------------------------------------------------------------------
        with self.socket_manager.lock:
            self.start_threads()

        return

    # ------------------------------------------------------------------
    # start threads for updating data
    # ------------------------------------------------------------------
    def start_threads(self):
        # ------------------------------------------------------------------
        # start arr_zoomer_update_data thread
        # ------------------------------------------------------------------
        thread_id = self.socket_manager.get_thread_id(
            self.socket_manager.user_group_id,
            'arr_zoomer_update_data',
        )
        if thread_id == -1:
            if self.log_send_packet:
                ArrZoomer.log.info([
                    ['y', ' - starting arr_zoomer_update_data('],
                    ['g', self.socket_manager.user_group_id], ['y', ')']
                ])

            thread_id = self.socket_manager.set_thread_state(
                self.socket_manager.user_group_id,
                'arr_zoomer_update_data', True,
            )
            _ = gevent.spawn(self.update_data, thread_id)

        # ------------------------------------------------------------------
        # start arr_zoomer_update_sub_arr thread
        # ------------------------------------------------------------------
        thread_id = self.socket_manager.get_thread_id(
            self.socket_manager.user_group_id,
            'arr_zoomer_update_sub_arr',
        )
        if thread_id == -1:
            if self.log_send_packet:
                ArrZoomer.log.info([
                    ['y', ' - starting arr_zoomer_update_sub_arr('],
                    ['g', self.socket_manager.user_group_id], ['y', ')']
                ])

            thread_id = self.socket_manager.set_thread_state(
                self.socket_manager.user_group_id,
                'arr_zoomer_update_sub_arr', True,
            )
            _ = gevent.spawn(self.update_sub_arr, thread_id)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # with ArrZoomer.lock:
        #     print('-- back_from_offline',self.widget_name,self.widget_id)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_init_data(self):
        inst_info = self.inst_data.get_inst_pos()

        inst_prop_types = dict()
        inst_prop_types = dict()
        inst_ids = self.inst_data.get_inst_ids()
        for id_now in inst_ids:
            inst_prop_types[id_now] = [
                {'id': v['id'], 'title': v['title'], }
                for (k, v) in self.tel_sub_health[id_now].items()
            ]

        data = {
            'arr_zoomer': {
                'sub_arr': self.sub_arr_grp,
                'arr_init': inst_info,
                'arrProp': self.get_tel_health_s0(),
                'tel_prop_types': inst_prop_types,
                'tel_types': self.inst_types,
            }
        }

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def set_widget_state(self, *args):
        data = args[0]

        self.zoom_state['zoom_state'] = data['zoom_state']
        self.zoom_state['zoom_target'] = data['zoom_target']
        self.zoom_state['zoom_target_prop'] = data['zoom_target_prop']

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def init_tel_health(self):
        self.tel_health = dict()
        self.tel_sub_health_flat = dict()
        self.tel_sub_health_fields = dict()

        self.tel_sub_health = self.inst_data.get_tel_healths()

        # a flat dict with references to each level of the original dict
        self.tel_sub_health_flat = dict()
        for id_now in self.inst_ids:
            self.tel_sub_health_flat[id_now] = flatten_dict(
                self.tel_sub_health[id_now]
            )

        for id_now in self.inst_ids:
            self.tel_health[id_now] = {
                'id': id_now, 'health': 0, 'status': '',
                'data': [
                    v for (k, v) in self.tel_sub_health[id_now].items()
                ],
            }

            self.tel_sub_health_fields[id_now] = []
            items = self.tel_sub_health_flat[id_now].iteritems()
            for key, val in items:
                if 'val' in val['data']:
                    self.tel_sub_health_fields[id_now] += [key]

        self.get_sub_arr_grp()

        return

    # ------------------------------------------------------------------
    # get info of telescope 0-100 for each fields
    # ------------------------------------------------------------------
    def get_tel_health_s0(self, id_in=None):
        data = dict()
        fields = dict()

        for id_now in self.inst_ids:
            fields[id_now] = ['health', 'status']
            fields[id_now] += [
                v['id'] for (k, v)
                in self.tel_sub_health[id_now].items()
            ]

        ids = self.inst_ids if (id_in is None) else [id_in]

        self.redis.pipe.reset()
        for id_now in ids:
            self.redis.pipe.hMget(
                name='inst_health;'+str(id_now), key=fields[id_now]
            )
        redis_data = self.redis.pipe.execute()

        for n_id in range(len(redis_data)):
            id_now = ids[n_id]
            data[id_now] = dict()

            for n_field in range(len(fields[id_now])):
                field_now = fields[id_now][n_field]
                data[id_now][field_now] = redis_data[n_id][n_field]

        return data if (id_in is None) else data[id_now]

    # ------------------------------------------------------------------
    #   Load data relative to telescope on focus
    # ------------------------------------------------------------------
    def update_tel_health_s1(self, id_in):
        redis_data = self.redis.hMget(
            name='inst_health;'+str(id_in),
            key=self.tel_sub_health_fields[id_in],
        )

        for n_id in range(len(redis_data)):
            key = self.tel_sub_health_fields[id_in][n_id]
            self.tel_sub_health_flat[id_in][key]['data']['val'] = (
                redis_data[n_id]
            )

        data_s0 = self.get_tel_health_s0(id_in=id_in)
        self.tel_health[id_in]['health'] = data_s0['health']
        self.tel_health[id_in]['status'] = data_s0['status']

        return

    # ------------------------------------------------------------------
    # return data of zoom_target in dict() form
    # ------------------------------------------------------------------
    def get_flat_tel_health(self, id_in):
        data = dict()

        data['id'] = id_in
        data['health'] = self.tel_health[id_in]['health']
        data['status'] = self.tel_health[id_in]['status']

        data['data'] = dict()
        for key in self.tel_sub_health_fields[id_in]:
            data['data'][key] = (
                self.tel_sub_health_flat[id_in][key]['data']['val']
            )

        return data

    # ------------------------------------------------------------------
    # uniqu methods for this socket
    # ------------------------------------------------------------------
    def ask_data_s1(self, *args):
        data = args[0]
        if self.socket_manager.log_send_packet:
            ArrZoomer.log.info([
                ['b', ' - get_data_s1 '],
                ['b', self.socket_manager.sess_id, ' , '],
                ['g', data['zoom_state']], ['b', ' , '],
                ['y', data['zoom_target']],
            ])

        self.zoom_state['zoom_state'] = data['zoom_state']
        self.zoom_state['zoom_target'] = data['zoom_target']

        # ------------------------------------------------------------------
        # to avoid missmatch while waiting for the loop in
        # update_data, send s0 too...
        # ------------------------------------------------------------------
        with ArrZoomer.lock:
            self.update_tel_health_s1(id_in=data['zoom_target'])
            prop_s1 = self.tel_health[data['zoom_target']]

            emit_data_s1 = {
                'widget_id': data['widget_id'],
                'type': 's11',
                'data': prop_s1,
            }

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        self.socket_manager.socket_event_widgets(
            event_name='arr_zoomer_get_data_s1',
            data=emit_data_s1,
            sess_ids=[self.socket_manager.sess_id],
            widget_ids=[self.widget_id],
        )

        self.update_data_once()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def set_send_data(self):
        ArrZoomer.send_data['s_0'] = {
            'sess_id': [], 'widget_id': [],
        }
        ArrZoomer.send_data['s_1'] = dict()

        all_widgets = self.redis.hGetAll(
            name='all_widgets', packed=True,
        )

        for widget_id, widget_now in all_widgets.iteritems():
            if widget_now['widget_name'] != self.widget_name:
                continue
            if widget_id not in self.socket_manager.widget_inits:
                continue

            ArrZoomer.send_data['s_0']['sess_id'].append(
                widget_now['sess_id']
            )
            ArrZoomer.send_data['s_0']['widget_id'].append(
                widget_id
            )

            zoomer_state = (
                self.socket_manager.widget_inits[widget_id]
                    .get_zoomer_state()
            )

            if zoomer_state['zoom_state'] == 1:
                zoom_target = zoomer_state['zoom_target']

                if zoom_target not in ArrZoomer.send_data['s_1']:
                    ArrZoomer.send_data['s_1'][zoom_target] = {
                        'sess_id': [], 'widget_id': []
                    }

                ArrZoomer.send_data['s_1'][zoom_target]['sess_id'].append(
                    widget_now['sess_id']
                )
                ArrZoomer.send_data['s_1'][zoom_target]['widget_id'].append(
                    widget_id,
                )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_data_once(self):
        # get the current set of widgest which need an update
        with self.socket_manager.lock:
            with ArrZoomer.lock:
                self.set_send_data()

        # ------------------------------------------------------------------
        #
        # ------------------------------------------------------------------
        prop_s1 = dict()
        for zoom_target in ArrZoomer.send_data['s_1']:
            self.update_tel_health_s1(id_in=zoom_target)

            prop_s1[zoom_target] = self.get_flat_tel_health(
                zoom_target
            )

        # ------------------------------------------------------------------
        # transmit the values
        # ------------------------------------------------------------------
        data_now = ArrZoomer.send_data['s_0']
        sess_ids = data_now['sess_id']
        widget_ids = data_now['widget_id']
        emit_data_s0 = {
            'widget_id': '', 'type': 's00',
            'data': self.get_tel_health_s0()
        }

        self.socket_manager.socket_event_widgets(
            event_name='arr_zoomer_update_data',
            sess_ids=sess_ids, widget_ids=widget_ids,
            data=emit_data_s0,
        )

        for zoom_target in ArrZoomer.send_data['s_1']:
            data_now = ArrZoomer.send_data['s_1'][zoom_target]
            sess_ids = data_now['sess_id']
            widget_ids = data_now['widget_id']
            emit_data_s1 = {
                'widget_id': '', 'type': 's11',
                'data': prop_s1[zoom_target]
            }

            self.socket_manager.socket_event_widgets(
                event_name='arr_zoomer_update_data',
                sess_ids=sess_ids, widget_ids=widget_ids,
                data=emit_data_s1,
            )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_data(self, thread_id):
        if not self.do_data_updates:
            return

        n_sec_sleep = 10
        sleep(n_sec_sleep)

        def get_thread_id(): return self.socket_manager.get_thread_id(
            self.socket_manager.user_group_id,
            'arr_zoomer_update_data',
        )

        while (get_thread_id() == thread_id):
            self.update_data_once()
            sleep(n_sec_sleep)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_sub_arr_grp(self):
        with ArrZoomer.lock:
            sub_arrs = self.redis.get(
                name='sub_arrs', packed=True, default_val=[],
            )
            self.sub_arr_grp = {
                'id': 'sub_arr', 'children': sub_arrs,
            }

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_sub_arr(self, thread_id):
        n_sec_sleep = 10
        sleep(n_sec_sleep)

        def get_thread_id(): return self.socket_manager.get_thread_id(
            self.socket_manager.user_group_id,
            'arr_zoomer_update_sub_arr',
        )

        redis_pubsub = None
        while (get_thread_id() == thread_id):
            while redis_pubsub is None:
                redis_pubsub = self.redis.set_pubsub('sub_arrs')
                sleep(0.5)

            msg = self.redis.get_pubsub('sub_arrs')
            if msg is not None:
                self.get_sub_arr_grp()

                data_now = ArrZoomer.send_data['s_0']
                sess_ids = data_now['sess_id']
                widget_ids = data_now['widget_id']
                data = {
                    'widget_id': '',
                    'type': 'sub_arr',
                    'data': self.sub_arr_grp
                }

                self.socket_manager.socket_event_widgets(
                    event_name='arr_zoomer_update_data',
                    sess_ids=sess_ids, widget_ids=widget_ids,
                    data=data,
                )

            return
            sleep(n_sec_sleep)

        return


# # list of initial monitoring points that roughly correspond to the different assemblies
# if False:
#   mount:
#     poiting accuracy (az/el) from drive system (target coordinate and readback value consistent)
#     check vias pointin monitoring (star huider) if on target
#     status of motors (several motors, depends on tel type)
#   amc:
#     status of actuator (60 or whatever per tel)
#     status of lazer used for alighnment
#     status of system (alighned or mis-alighned)
#   camera:
#     humidity limit
#     temprature limit
#     internal cooling system status
#     high-voltage status -> maye divid into sectors
#     max event rate too high
#     camera lid working
#     safety module online and ok
#     timing board status (telescope coincidence)
#   daq:
#     camera trigger rate
#     throughput from tel
#     camera server status
#     on camera initial analyis (pre calibration / event building)


# sub-array grouping
# telescope type grouping
# position grouping
# all offline telescops grouping
# mount == drive-system, structual monitoring, pointing monitoring
