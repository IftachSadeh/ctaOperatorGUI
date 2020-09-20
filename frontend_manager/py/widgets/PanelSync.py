import asyncio
# from datetime import datetime
# from shared.utils import date_to_string
from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class PanelSync(BaseWidget):

    # ------------------------------------------------------------------
    def __init__(self, widget_id=None, sm=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        # widget-specific initialisations
        self.restore_delay_sec = 2

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await BaseWidget.setup(self, args)

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
            'sleep_sec': 5,
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
    async def set_client_sync_groups(self, *args):
        data = args[0]

        widget_ids = self.redis.l_get('ws;user_widget_ids;' + self.user_id)

        pipe = self.redis.get_pipe()
        for child_0 in data['data']['children']:
            grp_id = child_0['id']
            grp_title = child_0['title']

            pipe.h_set(
                name='ws;user_sync_groups;' + self.user_id,
                key=grp_id,
                data={
                    'title': grp_title,
                }
            )

            sync_group = dict()
            sync_group['id'] = child_0['id']
            sync_group['title'] = child_0['title']
            sync_group['sync_states'] = []

            for n_sync_type in range(len(child_0['children'])):
                child_1 = child_0['children'][n_sync_type]
                widget_info = [wgt for wgt in child_1 if wgt[0] in widget_ids]

                for (widget_id, icon_id) in widget_info:
                    pipe.h_set(
                        name='ws;user_sync_group_widgets;' + self.user_id + ';' + grp_id,
                        key=widget_id,
                        data={
                            'icon_id': icon_id,
                            'n_sync_type': n_sync_type,
                        },
                    )

                sync_group['sync_states'].append(widget_info)

        pipe.execute()

        await self.sm.update_widget_recovery_info()

        await self.update_sync_groups(ignore_id=self.widget_id)

        return

    # ------------------------------------------------------------------
    async def update_sync_groups(self, ignore_id=None):

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

        widget_ids = self.redis.l_get('ws;user_widget_ids;' + self.user_id)

        widget_info = self.redis.h_m_get(
            name='ws;widget_info',
            keys=widget_ids,
            default_val=[],
        )

        try:
            children_0 = []
            rm_grp_ids = []
            rm_widget_ids = [[], []]

            user_sync_groups = self.redis.h_get_all(
                name='ws;user_sync_groups;' + self.user_id, default_val=dict()
            )

            for (grp_id, grp_data) in user_sync_groups.items():
                grp_title = grp_data['title']

                user_sync_group_widgets = self.redis.h_get_all(
                    name='ws;user_sync_group_widgets;' + self.user_id + ';' + grp_id,
                    default_val=dict(),
                )

                children_1 = []
                for n_sync_type in range(3):
                    # the sync_group['id'] must correspond to the pattern
                    # defined by the client for new groups (e.g., for 'grp_0',
                    # we have ['grp_0_0','grp_0_1','grp_0_2'])
                    grp_id_now = str(grp_id) + '_' + str(n_sync_type)
                    grp_title_now = str(grp_title) + ' ' + str(n_sync_type)
                    children_1 += [{
                        'id': grp_id_now,
                        'title': grp_title_now,
                        'children': [],
                    }]

                for (widget_id, widget_data) in user_sync_group_widgets.items():
                    icon_id = widget_data['icon_id']
                    n_sync_type = widget_data['n_sync_type']

                    try:
                        n_widget = widget_ids.index(widget_id)
                        if widget_info[n_widget] is None:
                            raise ValueError

                    except ValueError:
                        rm_widget_ids[0] += [widget_id]
                        rm_widget_ids[1] += [grp_id]
                        raise ValueError

                    children_1[n_sync_type]['children'] += [{
                        'id':
                        icon_id,
                        'trg_widg_id':
                        widget_id,
                        'n_icon':
                        widget_info[n_widget]['n_icon']
                    }]

                if len(user_sync_group_widgets.keys()) == 0:
                    rm_grp_ids += [grp_id]
                else:
                    children_0.append({
                        'id': grp_id,
                        'title': grp_title,
                        'children': children_1
                    })

            # cleanup empty groups
            for grp_id in rm_grp_ids:
                self.redis.h_del(
                    name='ws;user_sync_groups;' + self.user_id,
                    key=grp_id,
                )

        except ValueError:
            await asyncio.sleep(0.01)

            max_n_try = 10
            if n_try >= max_n_try:
                raise Exception(
                    'reached recursion limit for attempted cleaning ...', widget_ids,
                    widget_info
                )

            if n_try < -2:
                # give the widget time to register itself if it is being restored
                await asyncio.sleep(self.restore_delay_sec)
            else:
                await self.sm.cleanup_sess_widget(
                    widget_ids=rm_widget_ids[0],
                    grp_ids=rm_widget_ids[1],
                )

            n_try += 1
            all_groups = await self.panel_sync_get_groups(n_try=n_try)
            return all_groups

        except Exception as e:
            raise e

        all_sync_widgets = []
        for n_widget in range(len(widget_ids)):
            try:
                widget_id = widget_ids[n_widget]
                widget_now = widget_info[n_widget]
                if widget_now is None:
                    continue
                if widget_now['n_icon'] is not None:
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

        all_groups = {
            'id': 'all_groups',
            'children': children_0,
            'all_sync_widgets': all_sync_widgets
        }

        # print('-'*80)
        # for child0 in children_0:
        #     for child1 in child0['children']:
        #         print(' ------- ', child1['id'])
        #         for child2 in child1['children']:
        #             print('      -- ', child2['trg_widg_id'], child2['n_icon'], '  \t ', child2['id'])
        # print('-'*100) ; print()

        return all_groups
