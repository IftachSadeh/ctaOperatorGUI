import asyncio

from shared.utils import flatten_dict
from shared.LogParser import LogParser


# ------------------------------------------------------------------
class ArrZoomer():

    # ------------------------------------------------------------------
    def __init__(self, parent):
        ArrZoomer.log = LogParser(
            base_config=parent.base_config,
            title=(parent.log.get_title() + '/' + __name__),
        )

        self.set_parent_widget(parent)

        self.inst_data = parent.base_config.inst_data
        self.inst_ids = self.inst_data.get_inst_ids()
        self.proc_ids = self.inst_data.get_proc_ids()
        self.inst_types = self.inst_data.get_inst_id_to_types()
        self.inst_info = self.inst_data.get_inst_info()
        self.inst_tel_health = self.inst_data.get_inst_healths(is_copy=True)

        self.zoom_state = None

        self.sleep_sec = 5

        # a flat dict with references to each level of the original dict
        # (as this is a shallow copy of the content, any change to
        # self.tel_sub_health_flat will be reflected in self.inst_tel_health
        # and self.tel_health, except for the top level)
        self.tel_sub_health_flat = dict()
        for id_now in self.inst_ids:
            self.tel_sub_health_flat[id_now] = flatten_dict(self.inst_tel_health[id_now])

        # other useful representations of the same underlying data (all shallow copies of
        # the content of self.inst_tel_health)
        self.tel_health = dict()
        self.tel_sub_health_fields = dict()
        for id_now in self.inst_ids:
            self.tel_health[id_now] = {
                'id': id_now,
                'health': 0,
                'status': '',
                'data': [v for v in self.inst_tel_health[id_now].values()],
            }

            self.tel_sub_health_fields[id_now] = []
            items = self.tel_sub_health_flat[id_now].items()
            for key, val in items:
                if 'val' in val['data']:
                    self.tel_sub_health_fields[id_now] += [key]

        self.tel_fields = dict()
        for id_now in self.inst_ids:
            self.tel_fields[id_now] = ['health', 'status']
            self.tel_fields[id_now] += [
                v['id'] for v in self.inst_tel_health[id_now].values()
            ]

        # self.get_sub_arr_grp()

        return

    # ------------------------------------------------------------------
    def set_parent_widget(self, parent):
        """copy & validate parent properties, add local function interfaces
        """

        # keep a reference of the parent widget
        self.parent = parent
        # the id of this instance
        self.widget_id = parent.widget_id
        # the parent of this widget
        self.sm = parent.sm
        # widget-class and widget group names
        self.widget_name = parent.widget_name
        # redis interface
        self.redis = parent.redis
        # turn on periodic data updates
        self.do_data_updates = parent.do_data_updates
        # some etra logging messages for this module
        self.log_send_packet = parent.log_send_packet
        # locker
        self.locker = self.sm.locker

        # validate that all required properties have been defined
        check_init_properties = [
            'widget_id',
            'sm',
            'widget_name',
            'redis',
            'do_data_updates',
            'log_send_packet',
            'n_icon',
            'icon_id',
        ]

        for init_property in check_init_properties:
            if not hasattr(parent, init_property):
                ArrZoomer.log.error([
                    ['wr', ' - bad initialisation of ArrZoomer()...', 'Missing: '],
                    ['yr', init_property, ''],
                ])
                print('FIXME - need proper exception handling ...')
                raise

        # functional interface - arr_zoomer_ask_for_init_data
        self.parent.arr_zoomer_ask_for_init_data = self.arr_zoomer_ask_for_init_data
        # ask the client to end session parameters which may be needed in case
        # of eg restoration of a session (in which case init is not rerun)
        self.parent.get_arr_zoomer_param_from_client = (
            self.get_arr_zoomer_param_from_client
        )
        # functional interface - get_zoomer_state
        self.parent.get_zoomer_state = self.get_zoomer_state
        # functional interface - arr_zoomer_ask_for_data_s1
        self.parent.arr_zoomer_ask_for_data_s1 = self.arr_zoomer_ask_for_data_s1
        # functional interface - setter for the zoom state
        self.parent.arr_zoomer_set_widget_state = self.arr_zoomer_set_widget_state

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        self.n_icon = self.parent.n_icon
        self.icon_id = self.parent.icon_id

        wgt = self.redis.h_get(
            name='ws;widget_info',
            key=self.widget_id,
            default_val=None,
        )
        if wgt is None:
            return

        self.zoom_state = wgt['widget_state']
        self.zoom_state['zoom_state'] = 0
        self.zoom_state['zoom_target'] = ''

        # shared loop for all widgets of this type to update the s0 data
        async def tel_health_s0():
            # setting arr_zoomer_id to None, since this is done on the global level
            data = {
                'arr_zoomer_id': None,
                'data': await self.get_tel_health_s0(),
            }
            return data

        # function to prevent the event if the zoom target is not relevant
        async def verify_s0(data, metadata):
            is_ok = True
            if not self.do_data_updates:
                is_ok = False
            return is_ok

        opt_in = {
            'widget': self,
            'loop_group': 'widget_name',
            'data_func': tel_health_s0,
            'verify_data': verify_s0,
            'sleep_sec': self.sleep_sec,
            'loop_id': 'arr_zoomer_update_data_s0',
            'event_name': 'arr_zoomer_update_data_s0',
        }
        await self.sm.add_widget_loop(opt_in=opt_in)

        # function to get the s1 data for this specific widget_id
        async def tel_health_s1():
            data = None

            zoomer_state = self.get_zoomer_state()
            if zoomer_state['zoom_state'] != 1:
                return data

            zoom_target = zoomer_state['zoom_target']

            await self.update_tel_health_s1(id_in=zoom_target)

            try:
                data = {
                    'arr_zoomer_id': self.arr_zoomer_id,
                    'data': self.get_flat_tel_health(zoom_target),
                }
            except AttributeError:
                # AttributeError can arise for a restored session, for which
                # we do not repeat arr_zoomer_ask_for_init_data(),
                # and so arr_zoomer_id is not set
                await self.ask_arr_zoomer_param_from_client()
                data = None
            except Exception as e:
                raise e

            return data

        # function to prevent the event if the zoom target is not relevant
        async def verify_s1(data, metadata):
            is_ok = True
            if not self.do_data_updates:
                is_ok = False
            else:
                is_ok = data is not None
            return is_ok

        opt_in = {
            'widget': self,
            'loop_group': 'widget_id',
            'data_func': tel_health_s1,
            'verify_data': verify_s1,
            'sleep_sec': self.sleep_sec,
            'loop_id': 'arr_zoomer_update_data_s1',
            'event_name': 'arr_zoomer_update_data_s1',
        }
        await self.sm.add_widget_loop(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    async def back_from_offline(self, data):
        await self.ask_arr_zoomer_param_from_client()
        return

    # ------------------------------------------------------------------
    def get_zoomer_state(self):
        return self.zoom_state

    # ------------------------------------------------------------------
    async def arr_zoomer_set_widget_state(self, *args):
        """set the zoom state of the widget
        """

        data = args[0]
        self.zoom_state['zoom_state'] = data['zoom_state']
        self.zoom_state['zoom_target'] = data['zoom_target']
        self.zoom_state['zoom_target_prop'] = data['zoom_target_prop']

        return

    # ------------------------------------------------------------------
    def filter_inst(self, filt_rules):
        """filter instruments
        """

        if len(filt_rules.keys()) == 0:
            return

        # possible filter rules for which instruments to include
        filt_inst = [[] for id in self.inst_ids]
        if 'inst_ids' in filt_rules:
            for n_id in range(len(self.inst_ids)):
                filt_inst[n_id] += [self.inst_ids[n_id] in filt_rules['inst_ids']]

        if 'inst_types' in filt_rules:
            for n_id in range(len(self.inst_ids)):
                id = self.inst_ids[n_id]
                filt_inst[n_id] += [self.inst_types[id] in filt_rules['inst_types']]

        filt_inst = [any(filt) for filt in filt_inst]

        if sum(filt_inst) == 0:
            self.log.warn([
                ['r', ' - filters leave no accepted instruments ... will ignore!'],
                ['b', ' filt_rules: '],
                ['y', '', filt_rules],
            ])

            return

        self.inst_ids = [
            self.inst_ids[n_id] for n_id in range(len(self.inst_ids)) if filt_inst[n_id]
        ]
        self.inst_types = (
            dict((k, v) for (k, v) in self.inst_types.items() if k in self.inst_ids)
        )
        self.inst_info = (
            dict((k, v) for (k, v) in self.inst_info.items() if k in self.inst_ids)
        )

        return

    # ------------------------------------------------------------------
    async def ask_arr_zoomer_param_from_client(self):
        """interface to ask for a list of requested parameters from the client
        """

        data = {
            'params': ['arr_zoomer_id'],
        }

        opt_in = {
            'widget': self,
            'data': data,
            'event_name': 'ask_arr_zoomer_param_from_client',
        }

        await self.sm.emit_widget_event(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    async def get_arr_zoomer_param_from_client(self, *args):
        """interface to get a list of requested parameters from the client
        """

        data_in = args[0]
        for (k, v) in data_in.items():
            setattr(self, k, v)

        return

    # ------------------------------------------------------------------
    async def arr_zoomer_ask_for_init_data(self, *args):
        """initialise dataset and send to client when the client asks for it
        """

        data_in = args[0]
        if 'inst_filter' in data_in:
            self.filter_inst(data_in['inst_filter'])

        self.arr_zoomer_id = data_in['arr_zoomer_id']

        self.log.debug([
            ['b', ' - ArrZoomer arr_zoomer_ask_for_init_data '],
            ['c', self.arr_zoomer_id, ' , '],
            ['b', ' , '],
            ['y', data_in],
        ])

        # data access function for the socket
        async def get_data():
            inst_prop_types = dict()

            for id_now in self.inst_ids:
                inst_prop_types[id_now] = []
                for val in self.inst_tel_health[id_now].values():
                    inst_prop_types[id_now] += [{
                        'id': val['id'],
                        'title': val['title'],
                    }]

            data = {
                'arr_zoomer_id': self.arr_zoomer_id,
                # 'sub_arr': self.sub_arr_grp,
                'arr_init': self.inst_info,
                'arr_props': await self.get_tel_health_s0(),
                'tel_prop_types': inst_prop_types,
                'tel_types': self.inst_types,
                'health_tag': self.inst_data.health_tag,
                'health_title': self.inst_data.health_title,
            }

            return data

        opt_in = {
            'widget': self,
            'data_func': get_data,
            'event_name': 'arr_zoomer_get_init_data',
        }

        await self.sm.emit_widget_event(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    async def get_tel_health_s0(self, id_in=None):
        """get instrument s0 data
        """

        pipe = self.redis.get_pipe()

        ids = self.inst_ids if (id_in is None) else [id_in]
        for id_now in ids:
            pipe.h_m_get(
                name='inst_health;' + str(id_now),
                keys=self.tel_fields[id_now],
                default_val=[],
            )
        redis_data = pipe.execute()

        data = dict()
        for n_id in range(len(redis_data)):
            id_now = ids[n_id]
            data[id_now] = dict()

            for n_field in range(len(self.tel_fields[id_now])):
                field_now = self.tel_fields[id_now][n_field]
                data[id_now][field_now] = redis_data[n_id][n_field]

        out = data if id_in is None else data[id_in]

        return out

    # ------------------------------------------------------------------
    async def update_tel_health_s1(self, id_in):
        """get instrument s1 data
        """

        # update the top level of the object, where all the children are shalow copies
        # of self.inst_tel_health, and so are updated through self.tel_sub_health_flat
        data_s0 = await self.get_tel_health_s0(id_in=id_in)
        self.tel_health[id_in].update({
            'health': data_s0['health'],
            'status': data_s0['status'],
        })

        fields = self.tel_sub_health_fields[id_in]
        redis_data = self.redis.h_m_get(
            name='inst_health;' + str(id_in),
            keys=fields,
            default_val=[],
        )
        if any([d is None for d in redis_data]):
            self.log.warn([
                ['r', ' - update_tel_health_s1 failed to get name: '],
                ['y', 'inst_health;' + str(id_in)],
                ['r', ' , '],
                ['y', fields],
                ['r', ' ?!? '],
                ['o', redis_data],
            ])
            redis_data = [(d if d is not None else 0) for d in redis_data]

        for n_id in range(len(redis_data)):
            key = fields[n_id]
            self.tel_sub_health_flat[id_in][key]['data']['val'] = redis_data[n_id]

        return

    # ------------------------------------------------------------------
    def get_flat_tel_health(self, id_in):
        data = dict()

        data['id'] = id_in
        data['health'] = self.tel_health[id_in]['health']
        data['status'] = self.tel_health[id_in]['status']

        data['data'] = dict()
        for key in self.tel_sub_health_fields[id_in]:
            data['data'][key] = self.tel_sub_health_flat[id_in][key]['data']['val']

        return data

    # ------------------------------------------------------------------
    async def arr_zoomer_ask_for_data_s1(self, *args):
        data = args[0]

        # AttributeError can arise for a restored session, for which
        # we do not repeat arr_zoomer_ask_for_init_data(),
        # and so arr_zoomer_id is not set
        try:
            arr_zoomer_id = self.arr_zoomer_id

        except AttributeError as e:
            await self.ask_arr_zoomer_param_from_client()
            await asyncio.sleep(0.01)
            await self.arr_zoomer_ask_for_data_s1(*args)
            return

        except Exception as e:
            raise e

        self.log.debug([
            ['b', ' - arr_zoomer_ask_for_data_s1 '],
            ['b', self.sm.sess_id, ' , '],
            ['g', data['zoom_state']],
            ['b', ' , '],
            ['y', data['zoom_target']],
        ])

        self.zoom_state['zoom_state'] = data['zoom_state']
        self.zoom_state['zoom_target'] = data['zoom_target']

        await self.update_tel_health_s1(id_in=data['zoom_target'])

        emit_data_s1 = {
            'arr_zoomer_id': self.arr_zoomer_id,
            'widget_id': data['widget_id'],
            'type': 's11',
            'data': self.tel_health[data['zoom_target']],
        }

        opt_in = {
            'widget': self,
            'event_name': 'arr_zoomer_get_data_s1',
            'data': emit_data_s1,
        }
        await self.sm.emit_widget_event(opt_in=opt_in)

        return

    # # ------------------------------------------------------------------
    # def get_sub_arr_grp(self):
    #     # with ArrZoomer.lock:
    #     if 1:
    #         sub_arrs = self.redis.get(
    #             name='sub_arrs',
    #             default_val=[],
    #         )
    #         self.sub_arr_grp = {
    #             'id': 'sub_arr',
    #             'children': sub_arrs,
    #         }

    #     return

    # # ------------------------------------------------------------------
    # def update_sub_arr(self, thread_id):
    #     n_sec_sleep = 5
    #     sleep(n_sec_sleep)

    #     def get_thread_id():
    #         return self.sm.get_thread_id(
    #             self.sm.user_group_id,
    #             'arr_zoomer_update_sub_arr',
    #         )

    #     redis_pubsub = None
    #     while (get_thread_id() == thread_id):
    #         while redis_pubsub is None:
    #             redis_pubsub = self.redis.set_pubsub('sub_arrs')
    #             sleep(0.5)

    #         msg = self.redis.get_pubsub('sub_arrs')
    #         if msg is not None:
    #             self.get_sub_arr_grp()

    #             data_now = ArrZoomer.send_data['s_0']
    #             sess_ids = data_now['sess_id']
    #             widget_ids = data_now['widget_id']
    #             data = {
    #                 'widget_id': '',
    #                 'type': 'sub_arr',
    #                 'data': self.sub_arr_grp,
    #             }

    #             self.sm.socket_event_widgets(
    #                 event_name='arr_zoomer_update_data',
    #                 sess_ids=sess_ids,
    #                 widget_ids=widget_ids,
    #                 data=data,
    #             )

    #         return
    #         sleep(n_sec_sleep)

    #     return


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
