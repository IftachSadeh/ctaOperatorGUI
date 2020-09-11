import copy
import asyncio

from frontend_manager.py.utils.BaseWidget import BaseWidget


# ------------------------------------------------------------------
class SubArrGrp(BaseWidget):

    # ------------------------------------------------------------------
    def __init__(self, widget_id=None, sm=None, *args, **kwargs):
        # standard common initialisations
        BaseWidget.__init__(
            self,
            widget_id=widget_id,
            sm=sm,
        )

        self.no_sub_arr_name = self.base_config.no_sub_arr_name

        # widget-specific initialisations
        self.pos0 = [0, 90]

        self.tel_ids = self.sm.inst_data.get_inst_ids(inst_types=['LST', 'MST', 'SST'])

        return

    # ------------------------------------------------------------------
    async def setup(self, *args):
        # standard common initialisations
        await BaseWidget.setup(self, args)

        # initialise dataset and send to client
        opt_in = {
            'widget': self,
            'event_name': 'init_data',
            'data_func': self.get_data,
        }
        await self.sm.emit_widget_event(opt_in=opt_in)

        # start an update loop for this particular instance
        opt_in = {
            'widget': self,
            'loop_scope': 'unique_by_id',
            'data_func': self.get_data,
            'sleep_sec': 3,
            'loop_id': 'update_data_widget_id',
            'event_name': 'update_data',
        }
        await self.sm.add_widget_loop(opt_in=opt_in)

        return

    # ------------------------------------------------------------------
    async def back_from_offline(self, *args):
        # standard common initialisations
        await BaseWidget.back_from_offline(self, args)

        return

    # ------------------------------------------------------------------
    async def get_data(self):

        for redis_key in ['obs_block_ids_' + 'run', 'inst_pos']:
            n_tries = 0
            while not self.redis.exists(redis_key):
                self.log.warning(
                    [['r', ' - no - '], ['p', redis_key],
                     ['r', ' - in redis. will try again ... (', n_tries, ')']]
                )
                if n_tries > 4:
                    return {}
                n_tries += 1
                await asyncio.sleep(0.1)

        sub_arrs = self.redis.get(name='sub_arrs', default_val=[])
        obs_block_ids = self.redis.get(name=('obs_block_ids_' + 'run'), default_val=[])
        inst_pos = self.redis.h_get_all(name='inst_pos', default_val={})

        data = {
            'tel': [],
            'trg': [],
            'pnt': [],
            'sub_arr': {
                'id': 'sub_arr',
                'children': sub_arrs
            }
        }

        pipe = self.redis.get_pipe()
        for obs_block_id in obs_block_ids:
            pipe.get(obs_block_id)
        blocks = pipe.execute()

        #
        all_tel_ids = copy.deepcopy(self.tel_ids)
        self.tel_point_pos = dict()

        for n_block in range(len(blocks)):
            block_tel_ids = blocks[n_block]['tel_ids']

            trg_id = blocks[n_block]['targets'][0]['id']
            target_name = blocks[n_block]['targets'][0]['name']
            target_pos = blocks[n_block]['targets'][0]['pos']

            pnt_id = blocks[n_block]['pointings'][0]['id']
            pointing_name = blocks[n_block]['pointings'][0]['name']
            point_pos = blocks[n_block]['pointings'][0]['pos']

            # compile the telescope list for this block
            tels = []
            for id_now in block_tel_ids:
                inst_pos_now = inst_pos[id_now] if id_now in inst_pos else self.pos0

                data['tel'].append({
                    'id': id_now,
                    'trg_id': trg_id,
                    'pnt_id': pnt_id,
                    'pos': inst_pos_now,
                })

                tels.append({'id': id_now})

                if id_now in all_tel_ids:
                    all_tel_ids.remove(id_now)

                self.tel_point_pos[id_now] = point_pos

            # add the target for this block, if we dont already have it
            if trg_id not in [x['id'] for x in data['trg']]:
                data['trg'].append({'id': trg_id, 'N': target_name, 'pos': target_pos})

            # add the pointing for this block
            data['pnt'].append({
                'id': pnt_id,
                'N': pointing_name,
                'pos': point_pos,
                'tel_ids': block_tel_ids,
            })

        # now take care of all free telescopes
        tels = []
        for id_now in all_tel_ids:
            inst_pos_now = inst_pos[id_now] if id_now in inst_pos else self.pos0

            data['tel'].append({
                'id': id_now,
                'trg_id': self.no_sub_arr_name,
                'pnt_id': self.no_sub_arr_name,
                'pos': inst_pos_now,
            })

            tels.append({'id': id_now})

        return data
