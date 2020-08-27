import asyncio


# ------------------------------------------------------------------
class ClockSimInterface():
    def __init__(self, socket_manager, *args, **kwargs):
        self.sm = socket_manager
        self.log = self.sm.log
        self.redis = self.sm.redis

        setattr(
            self.sm,
            'ask_sim_clock_sim_params',
            self.ask_sim_clock_sim_params,
        )

        setattr(
            self.sm,
            'set_sim_clock_sim_params',
            self.set_sim_clock_sim_params,
        )

        return

    # ------------------------------------------------------------------
    async def ask_sim_clock_sim_params(self, data_in=None):
        data = self.redis.get('clock_sim_sim_params')

        # temporary hack
        if data is None:
            self.log.warn([['r', ' - could not get clock_sim_sim_params ...']])
            # raise Exception('could not get clock_sim_sim_params')
            return

        await self.sm.emit_to_queue(
            event_name='get_sim_clock_sim_params',
            data=data,
        )

        return

    # ------------------------------------------------------------------
    def set_sim_clock_sim_params(self, data_in):
        data_pubsub = data_in['data']

        self.redis.publish(
            channel='clock_sim_set_sim_params',
            message=data_pubsub,
        )

        return
