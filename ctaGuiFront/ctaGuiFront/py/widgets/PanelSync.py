from datetime import datetime
from ctaGuiUtils.py.utils import date_to_string
from ctaGuiFront.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
#  PanelSync
# ------------------------------------------------------------------
class PanelSync(BaseWidget):
    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, widget_id='', socket_manager=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            socket_manager=socket_manager,
        )

        # ------------------------------------------------------------------
        # widget-specific initialisations
        # ------------------------------------------------------------------
        pass

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setup(self, *args):
        # standard common initialisations
        BaseWidget.setup(self, *args)

        # initial dataset and send to client
        opt_in = {'widget': self, 'data_func': self.get_init_data}
        self.socket_manager.send_init_widget(opt_in=opt_in)

        # start a thread which will call update_data() and send 1Hz data
        # updates to all sessions in the group
        opt_in = {
            'widget': self,
            'data_func': self.panel_sync_get_groups,
            'sleep_seconds': 5
        }
        self.socket_manager.add_widget_tread(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def back_from_offline(self):
        # standard common initialisations
        BaseWidget.back_from_offline(self)

        # with panel_sync.lock:
        #     print('-- back_from_offline',self.widget_name,self.widget_id)
        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_init_data(self):
        return {
            'groups': self.panel_sync_get_groups(),
            'allow_panel_sync': self.socket_manager.allow_panel_sync()
        }

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def ask_data(self):
        emit_data = {
            'widget_type': self.widget_name,
            'event_name': 'update_data',
            'data': self.panel_sync_get_groups()
        }

        self.socket_manager.socket_event_widgets(
            event_name=emit_data['event_name'],
            data=emit_data,
            sess_ids=[self.socket_manager.sess_id],
            widget_ids=[self.widget_id]
        )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def setSyncGroups(self, *args):
        data = args[0]

        with self.socket_manager.lock:
            widget_ids = self.redis.lGet('user_widgets;' + self.socket_manager.user_id)

            sync_groups = []
            for child_0 in data['data']['children']:
                sync_group = dict()
                sync_group['id'] = child_0['id']
                sync_group['title'] = child_0['title']
                sync_group['sync_states'] = []
                sync_group['sync_types'] = dict()

                for child_1 in child_0['children']:
                    all_widgets = [wgt for wgt in child_1 if wgt[0] in widget_ids]
                    sync_group['sync_states'].append(all_widgets)

                sync_groups.append(sync_group)

            self.redis.hSet(
                name='sync_groups',
                key=self.socket_manager.user_id,
                data=sync_groups,
                packed=True
            )

        self.update_sync_groups(ignore_id=self.widget_id)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def update_sync_groups(self, ignore_id=None):

        # ------------------------------------------------------------------
        # get the current set of widgest which need an update
        # ------------------------------------------------------------------
        sess_widgets = [[], []]
        with self.socket_manager.lock:
            widget_ids = self.redis.lGet('user_widgets;' + self.socket_manager.user_id)
            all_widgets = self.redis.hMget(
                name='all_widgets', key=widget_ids, packed=True
            )

            for n_widget in range(len(widget_ids)):
                widget_id = widget_ids[n_widget]
                widget_now = all_widgets[n_widget]
                if widget_now is None:
                    continue
                if widget_now['widget_name'] != self.widget_name:
                    continue
                if ignore_id is not None and ignore_id == widget_id:
                    continue

                sess_widgets[0].append(widget_now['sess_id'])
                sess_widgets[1].append(widget_id)

        # ------------------------------------------------------------------
        # send the data
        # ------------------------------------------------------------------
        emit_data = {
            'widget_type': self.widget_name,
            'event_name': 'update_data',
            'data': self.panel_sync_get_groups()
        }

        self.socket_manager.socket_event_widgets(
            event_name=emit_data['event_name'],
            data=emit_data,
            sess_ids=sess_widgets[0],
            widget_ids=sess_widgets[1]
        )

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------

    def panel_sync_get_groups(self):
        with self.socket_manager.lock:
            widget_ids = self.redis.lGet('user_widgets;' + self.socket_manager.user_id)
            all_widgets = self.redis.hMget(
                name='all_widgets', key=widget_ids, packed=True
            )

            all_sync_widgets = []
            for n_widget in range(len(widget_ids)):
                widget_id = widget_ids[n_widget]
                widget_now = all_widgets[n_widget]
                if widget_now is None:
                    continue
                if widget_now['n_icon'] >= 0:
                    all_sync_widgets.append({
                        'id': 'icn_' + widget_id,
                        'trg_widg_id': widget_id,
                        'n_icon': widget_now['n_icon']
                    })

            rm_elements = []
            children_0 = []

            sync_groups = self.redis.hGet(
                name='sync_groups',
                key=self.socket_manager.user_id,
                packed=True,
                default_val=[]
            )

            for sync_group in sync_groups:
                sync_states = sync_group['sync_states']

                n_widget_group = 0
                children_1 = []
                for n_sync_type in range(len(sync_states)):
                    children_2 = []
                    for [widget_id, icon_id] in sync_states[n_sync_type]:
                        try:
                            n_widget = widget_ids.index(widget_id)

                            n_widget_group += 1
                            children_2.append({
                                'id': icon_id,
                                'trg_widg_id': widget_id,
                                'n_icon': all_widgets[n_widget]['n_icon']
                            })

                        except Exception:
                            continue

                    # ------------------------------------------------------------------
                    # the sync_group['id'] must correspond to the pattern
                    # defined by the client for new groups (e.g., for 'grp_0',
                    # we have ['grp_0_0','grp_0_1','grp_0_2'])
                    # ------------------------------------------------------------------
                    children_1.append({
                        'id':
                        str(sync_group['id']) + '_' + str(n_sync_type),
                        'title':
                        str(sync_group['title']) + ' ' + str(n_sync_type),
                        'children':
                        children_2
                    })

                if n_widget_group > 0:
                    children_0.append({
                        'id': sync_group['id'],
                        'title': sync_group['title'],
                        'children': children_1
                    })
                else:
                    rm_elements.append(sync_group)

            # cleanup empty groups
            if len(rm_elements) > 0:
                for rm_element in rm_elements:
                    sync_groups.remove(rm_element)

                self.redis.hSet(
                    name='sync_groups',
                    key=self.socket_manager.user_id,
                    data=sync_groups,
                    packed=True
                )

        all_groups = {
            'date': date_to_string(datetime.utcnow(), '%H:%M:%S:%f'),
            'id': 'all_groups',
            'children': children_0,
            'all_sync_widgets': all_sync_widgets
        }

        return all_groups
