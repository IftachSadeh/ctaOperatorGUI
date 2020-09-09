import importlib
from math import ceil

from shared.LogParser import LogParser
from shared.RedisManager import RedisManager


# ------------------------------------------------------------------
class BaseUtil():

    # ------------------------------------------------------------------
    def __init__(self, util_id=None, parent=None, *args, **kwargs):
        self.class_name = self.__class__.__name__

        self.log = LogParser(base_config=parent.base_config, title=__name__)

        # the parent of this widget
        self.parent = parent
        # the id of this inistance
        self.util_id = util_id

        # keep a reference of the parent widget
        self.parent = parent
        # the shared basic configuration class
        self.base_config = self.parent.base_config
        # the id of this instance
        self.widget_id = parent.widget_id
        # the parent of this widget
        self.sm = parent.sm
        # widget-class and widget group names
        self.widget_type = parent.widget_type
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
            'widget_type',
            'redis',
            'do_data_updates',
            'log_send_packet',
            'n_icon',
            'icon_id',
        ]

        for init_property in check_init_properties:
            if not hasattr(parent, init_property):
                raise Exception(
                    ' - bad initialisation of ArrZoomerUtil()... - missing property: ',
                    init_property,
                )

        return

    # ------------------------------------------------------------------
    async def back_from_offline(self, data=None):
        # do common stuff here
        pass

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        """minimal mandatory implementation for a method, which must be defined
           by any instance of BaseUtil (part of the life-cycle of utils, as
           implemented in BaseWidget.util_func())
        """
        self.n_icon = self.parent.n_icon
        self.icon_id = self.parent.icon_id

        return

    # ------------------------------------------------------------------
    async def util_init(self, data):
        """placeholder for a mandatory method, which must be overloaded
           by any instance of BaseUtil (part of the life-cycle of utils, as
           implemented in BaseWidget.util_func())
        """

        return
