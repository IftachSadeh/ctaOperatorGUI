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

        setattr(
            self.sm,
            'clock_sim_update_sim_params',
            self.clock_sim_update_sim_params,
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

    # ---------------------------------------------------------------------------
    async def clock_sim_update_sim_params(self, loop_info):

        self.log.info([
            ['y', ' - starting '],
            ['b', 'clock_sim_sim_params'],
            ['y', ' for server: '],
            ['c', self.sm.server_id],
        ])
        sleep_sec = 0.1

        # setup the channel once
        pubsub_tag = 'clock_sim_updated_sim_params'
        while self.redis.set_pubsub(pubsub_tag) is None:
            await asyncio.sleep(sleep_sec)

        while self.sm.get_loop_state(loop_info):
            await asyncio.sleep(sleep_sec)

            msg = self.redis.get_pubsub(key=pubsub_tag)
            if msg is None:
                continue

            async with self.sm.locker.locks.acquire('server'):
                managers = await self.sm.get_server_attr('managers')

            all_sess_ids = self.redis.s_get('ws;server_sess_ids;' + self.sm.server_id)

            all_sess_ids = [s for s in all_sess_ids if s in managers.keys()]
            for sess_id in all_sess_ids:
                await managers[sess_id].ask_sim_clock_sim_params()

        self.log.info([
            ['r', ' - ending '],
            ['b', 'clock_sim_sim_params'],
            ['r', ' for server: '],
            ['c', self.sm.server_id],
        ])

        return
