# from datetime import timedelta
# from datetime import datetime
# from shared.utils import get_time_of_night
from shared.utils import secs_to_datetime
from shared.ClockSim import get_clock_sim_data
# from frontend_manager.py.utils.BaseWidget import BaseWidget
from frontend_manager.py.widgets.SchedBlockController import SchedBlockController


# ------------------------------------------------------------------
class SchedBlockInspector(SchedBlockController):

    # ------------------------------------------------------------------
    def __init__(self, widget_id=None, sm=None, *args, **kwargs):
        # standard common initialisations
        SchedBlockController.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await SchedBlockController.setup(self, *args)

        return

    # ------------------------------------------------------------------
    async def back_from_offline(self, *args):
        # standard common initialisations
        await SchedBlockController.back_from_offline(self, args)

        return

    # ------------------------------------------------------------------
    async def client_sched_update(self, *args):
        expire_sec = 86400  # one day
        # print('client_sched_update')

        data = args[0]
        new_schedule = data['new_schedule']

        self.redis.set(name='obs_block_update', data=new_schedule)

        opt_in = {
            'widget': self,
            'event_name': 'server_sched_update',
        }
        await self.sm.emit_widget_event(opt_in=opt_in)

        return
