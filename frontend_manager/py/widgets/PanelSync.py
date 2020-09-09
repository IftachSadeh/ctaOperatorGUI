import asyncio

from datetime import datetime
from shared.utils import date_to_string
from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class PanelSync(BaseWidget):

    # ------------------------------------------------------------------
    def __init__(self, widget_id='', sm=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        # widget-specific initialisations
        pass

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await BaseWidget.setup(self, *args)

        # initialise dataset and send to client
        opt_in = {
            'widget': self,
            'event_name': 'init_data',
            'data_func': self.get_init_data,
        }
        await self.sm.emit_widget_event(opt_in=opt_in)

        # start an update loop for this particular instance
        opt_in = {
            'widget': self,
            'loop_scope': 'unique_by_id',
            'data_func': self.panel_sync_get_groups,
            'sleep_sec': 3,
            'loop_id': 'update_data_widget_id',
            'event_name': 'update_data',
        }
        await self.sm.add_widget_loop(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    async def back_from_offline(self, *args):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, args)

        # with panel_sync.lock:
        #     print('-- back_from_offline',self.widget_type,self.widget_id)
        return

    # ------------------------------------------------------------------
    async def get_init_data(self):
        data = {
            'icon_prefix': self.sm.icon_prefix,
            'sync_group_id_prefix': self.sm.sync_group_id_prefix,
            'sync_group_title_prefix': self.sm.sync_group_title_prefix,
            'groups': await self.panel_sync_get_groups(),
            'allow_panel_sync': self.sm.check_panel_sync(),
        }
        return data

    # ------------------------------------------------------------------
    async def ask_data(self):
        opt_in = {
            'widget': self,
            'data_func': self.panel_sync_get_groups,
            'event_name': 'update_data',
        }

        await self.sm.emit_widget_event(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    async def set_sync_groups(self, *args):
        data = args[0]

        print('--------', data['data']['children'] )

        widget_ids = self.redis.l_get('ws;user_widget_ids;' + self.sm.user_id)

        sync_groups = []
        for child_0 in data['data']['children']:
            sync_group = dict()
            sync_group['id'] = child_0['id']
            sync_group['title'] = child_0['title']
            sync_group['sync_states'] = []
            sync_group['sync_types'] = dict()

            for child_1 in child_0['children']:
                widget_info = [wgt for wgt in child_1 if wgt[0] in widget_ids]
                sync_group['sync_states'].append(widget_info)

            sync_groups.append(sync_group)

        self.redis.h_set(
            name='ws;sync_groups',
            key=self.sm.user_id,
            data=sync_groups,
        )

        await self.update_sync_groups(ignore_id=self.widget_id)

        return

    # ------------------------------------------------------------------
    async def update_sync_groups(self, ignore_id=None):

        # get the current set of widgest which need an update
        sess_widget_ids = [[], []]

        widget_ids = self.redis.l_get('ws;user_widget_ids;' + self.sm.user_id)
        widget_info = self.redis.h_m_get(
            name='ws;widget_info',
            keys=widget_ids,
            default_val=[],
        )

        for n_widget in range(len(widget_ids)):
            try:
                widget_id = widget_ids[n_widget]
                widget_now = widget_info[n_widget]
            except IndexError as e:
                self.log.warn([
                    ['r', ' - mismatch between widget_ids, widget_info ?!'],
                    ['o', widget_ids],
                    ['y', widget_info],
                ])
                sess_widget_ids = [[], []]
                break
            if widget_now is None:
                continue
            if widget_now['widget_type'] != self.widget_type:
                continue
            if ignore_id is not None and ignore_id == widget_id:
                continue

            sess_widget_ids[0].append(widget_now['sess_id'])
            sess_widget_ids[1].append(widget_id)

        # send the data
        opt_in = {
            'widget': self,
            'data_func': self.panel_sync_get_groups,
            'event_name': 'update_data',
        }

        await self.sm.emit_widget_event(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    async def panel_sync_get_groups(self, n_try=0):
        async def clean_and_retry():
            max_n_try = 10
            if n_try >= max_n_try:
                raise Exception(
                    'reached recursion limit for attempted cleaning ...',
                    widget_ids,
                    widget_info,
                    sync_groups,
                )

            clean_widget_ids = []
            for _n_sync_type in range(len(sync_states)):
                for (_widget_id, _icon_id) in sync_states[_n_sync_type]:
                    if _widget_id not in widget_ids:
                        clean_widget_ids += [_widget_id]

            await self.sm.cleanup_widget(widget_ids=clean_widget_ids)
            await asyncio.sleep(0.1)

            return

        widget_ids = self.redis.l_get('ws;user_widget_ids;' + self.sm.user_id)
        widget_info = self.redis.h_m_get(
            name='ws;widget_info',
            keys=widget_ids,
            default_val=[],
        )

        all_sync_widgets = []
        for n_widget in range(len(widget_ids)):
            try:
                widget_id = widget_ids[n_widget]
                widget_now = widget_info[n_widget]
                if widget_now is None:
                    continue
                if widget_now['n_icon'] >= 0:
                    all_sync_widgets.append({
                        'id': self.sm.icon_prefix + widget_id,
                        'trg_widg_id': widget_id,
                        'n_icon': widget_now['n_icon']
                    })
            except IndexError as e:
                self.log.warn([
                    ['r', ' - mismatch between widget_ids, widget_info ?!'],
                    ['o', widget_ids],
                    ['y', widget_info],
                ])
                all_sync_widgets = []
                break
            except Exception as e:
                raise e

        rm_elements = []
        children_0 = []

        sync_groups = self.redis.h_get(
            name='ws;sync_groups', key=self.sm.user_id, default_val=[]
        )

        for sync_group in sync_groups:
            sync_states = sync_group['sync_states']

            n_widget_group = 0
            children_1 = []
            for n_sync_type in range(len(sync_states)):
                children_2 = []

                for (widget_id, icon_id) in sync_states[n_sync_type]:
                    try:
                        n_widget = widget_ids.index(widget_id)

                        n_widget_group += 1
                        children_2.append({
                            'id': icon_id,
                            'trg_widg_id': widget_id,
                            'n_icon': widget_info[n_widget]['n_icon']
                        })

                    except ValueError:
                        await clean_and_retry()

                        n_try += 1
                        all_groups = await self.panel_sync_get_groups(n_try=n_try)
                        return all_groups

                    except Exception as e:
                        raise e

                # ------------------------------------------------------------------
                # the sync_group['id'] must correspond to the pattern
                # defined by the client for new groups (e.g., for 'grp_0',
                # we have ['grp_0_0','grp_0_1','grp_0_2'])
                # ------------------------------------------------------------------
                grp_id = str(sync_group['id']) + '_' + str(n_sync_type)
                grp_ttl = str(sync_group['title']) + ' ' + str(n_sync_type)
                children_1.append({
                    'id': grp_id,
                    'title': grp_ttl,
                    'children': children_2,
                })

                # print('children_1', children_1[-1])

            if n_widget_group > 0:
                children_0.append({
                    'id': sync_group['id'],
                    'title': sync_group['title'],
                    'children': children_1
                })
                # print('children_0', children_0[-1])
            else:
                rm_elements.append(sync_group)

        # cleanup empty groups
        if len(rm_elements) > 0:
            for rm_element in rm_elements:
                sync_groups.remove(rm_element)

            self.redis.h_set(
                name='ws;sync_groups',
                key=self.sm.user_id,
                data=sync_groups,
            )

        all_groups = {
            'date': date_to_string(datetime.utcnow(), '%H:%M:%S:%f'),
            'id': 'all_groups',
            'children': children_0,
            'all_sync_widgets': all_sync_widgets
        }

        return all_groups
