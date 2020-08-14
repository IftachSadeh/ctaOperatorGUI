import random
import copy
from datetime import datetime

from ctaGuiUtils.py.utils import get_rnd


# ------------------------------------------------------------------
def get_rnd_targets(self, night_duration_sec, block_duration_sec):
    target_ids_now = []
    targets = []

    target_ids = self.redis.get(name='target_ids', default_val=[])

    n_rnd_targets = max(1, int(self.rnd_gen.random() * 3))

    for _ in range(n_rnd_targets):
        n_id = (block_duration_sec / (night_duration_sec / len(target_ids)))
        n_id += 0.75
        n_id = int(n_id + ((self.rnd_gen.random() - 0.5) * 3))
        n_id = min(max(0, n_id), len(target_ids) - 1)

        if not (target_ids[n_id] in target_ids_now):
            target_ids_now.append(target_ids[n_id])

            targets.append(self.redis.get(name=target_ids[n_id], default_val={}))
    return targets


# ------------------------------------------------------------------
def get_rnd_pointings(self, tel_ids, targets, sched_block_id, obs_block_id, n_obs_now):
    pointings = []
    n_rnd_divs = max(1, int(self.rnd_gen.random() * 5))
    all_tel_ids = copy.deepcopy(tel_ids)

    for n_rnd_div in range(n_rnd_divs):
        trg = targets[max(0, int(self.rnd_gen.random() * len(targets)))]
        pnt = {
            'id': sched_block_id + '_' + obs_block_id,
            'name': trg['name'] + '/p_' + str(n_obs_now) + '-' + str(n_rnd_div)
        }

        point_pos = copy.deepcopy(trg['pos'])
        point_pos[0] += (self.rnd_gen.random() - 0.5) * 10
        point_pos[1] += (self.rnd_gen.random() - 0.5) * 10

        if point_pos[0] > self.az_min_max[1]:
            point_pos[0] -= 360
        elif point_pos[0] < self.az_min_max[0]:
            point_pos[0] += 360
        pnt['pos'] = point_pos

        pointings.append(pnt)

        rnd_tels = random.sample(all_tel_ids, int(len(tel_ids) / n_rnd_divs))

        if n_rnd_div == n_rnd_divs - 1:
            rnd_tels = all_tel_ids

        # and remove them from allTels list
        all_tel_ids = [x for x in all_tel_ids if x not in rnd_tels]
        pnt['tel_ids'] = rnd_tels

        return pointings


# ------------------------------------------------------------------
def update_sub_arrs(self, blocks=None):
    # inst_pos = self.redis.h_get_all(name='inst_pos')

    if blocks is None:
        obs_block_ids = self.redis.get(name=('obs_block_ids_' + 'run'), default_val=[])
        for obs_block_id in obs_block_ids:
            self.redis.pipe.get(obs_block_id)

        blocks = self.redis.pipe.execute()

    #
    sub_arrs = []
    all_tel_ids = copy.deepcopy(self.tel_ids)

    for n_block in range(len(blocks)):
        block_tel_ids = (
            blocks[n_block]['telescopes']['large']['ids']
            + blocks[n_block]['telescopes']['medium']['ids']
            + blocks[n_block]['telescopes']['small']['ids']
        )
        pnt_id = blocks[n_block]['pointings'][0]['id']
        pointing_name = blocks[n_block]['pointings'][0]['name']

        # compile the telescope list for this block
        tels = []
        for id_now in block_tel_ids:
            tels.append({'id': id_now})

            if id_now in all_tel_ids:
                all_tel_ids.remove(id_now)

        # add the telescope list for this block
        sub_arrs.append({'id': pnt_id, 'N': pointing_name, 'children': tels})

    # now take care of all free telescopes
    tels = []
    for id_now in all_tel_ids:
        tels.append({'id': id_now})

    sub_arrs.append({'id': self.no_sub_arr_name, 'children': tels})

    # for now - a simple/stupid solution, where we write the sub-arrays and publish each
    # time, even if the content is actually the same ...
    self.redis.set(name='sub_arrs', data=sub_arrs)
    self.redis.publish(channel='sub_arrs')

    return


# ------------------------------------------------------------------
def external_generate_events(self):
    time_now_sec = self.clock_sim.get_time_now_sec()

    if self.rnd_gen.random() < 0.001:
        new_event = {
            'id': get_rnd(n_digits=7, out_type=str),
            'start_time_sec': time_now_sec,
        }
        new_event['priority'] = random.randint(1, 3)

        if self.rnd_gen.random() < 0.1:
            new_event['name'] = 'alarm'
            new_event['icon'] = 'alarm.svg'
        elif self.rnd_gen.random() < 0.3:
            new_event['name'] = 'grb'
            new_event['icon'] = 'grb.svg'
        elif self.rnd_gen.random() < 0.5:
            new_event['name'] = 'hardware'
            new_event['icon'] = 'hardwareBreak.svg'
        elif self.rnd_gen.random() < 0.7:
            new_event['name'] = 'moon'
            new_event['icon'] = 'moon.svg'
        elif self.rnd_gen.random() < 1:
            new_event['name'] = 'sun'
            new_event['icon'] = 'sun.svg'

        # elif self.rnd_gen.random() < 0.6:
        #     new_event['name'] = 'dolphin'
        #     new_event['icon'] = 'dolphin.svg'
        # elif self.rnd_gen.random() < 0.8:
        #     new_event['name'] = 'eagle'
        #     new_event['icon'] = 'eagle.svg'
        # elif self.rnd_gen.random() < 1:
        #     new_event['name'] = 'chicken'
        #     new_event['icon'] = 'chicken.svg'

        self.external_events.append(new_event)

    self.redis.set(name='external_events', data=self.external_events)

    return


# ------------------------------------------------------------------
def external_generate_clock_events(self):
    self.log.warn([[
        'r',
        ' - FIXME - external_generate_clock_events should be updated to use ClockSim ...'
    ]])

    new_event = {
        'start_date': datetime(2018, 9, 16, 21, 42).strftime('%Y-%m-%d %H:%M:%S'),
        'end_date': '',
        'icon': 'moon.svg',
        'name': 'Moonrise',
        'comment': '',
        'id': 'CE' + str(self.rnd_gen.randint(0, 100000000)),
    }
    self.external_clock_events.append(new_event)

    new_event = {
        'start_date': datetime(2018, 9, 16, 23, 7).strftime('%Y-%m-%d %H:%M:%S'),
        'end_date': datetime(2018, 9, 17, 4, 30).strftime('%Y-%m-%d %H:%M:%S'),
        'icon': 'rain.svg',
        'name': 'Raining',
        'comment': '',
        'id': 'CE' + str(self.rnd_gen.randint(0, 100000000)),
    }
    self.external_clock_events.append(new_event)

    new_event = {
        'start_date': datetime(2018, 9, 17, 1, 3).strftime('%Y-%m-%d %H:%M:%S'),
        'end_date': datetime(2018, 9, 17, 2, 0).strftime('%Y-%m-%d %H:%M:%S'),
        'icon': 'storm.svg',
        'name': 'Storm',
        'comment': '',
        'id': 'CE' + str(self.rnd_gen.randint(0, 100000000)),
    }
    self.external_clock_events.append(new_event)

    new_event = {
        'start_date': datetime(2018, 9, 17, 1, 28).strftime('%Y-%m-%d %H:%M:%S'),
        'end_date': datetime(2018, 9, 17, 2, 30).strftime('%Y-%m-%d %H:%M:%S'),
        'icon': 'handshake.svg',
        'name': 'Collab',
        'comment': '',
        'id': 'CE' + str(self.rnd_gen.randint(0, 100000000)),
    }
    self.external_clock_events.append(new_event)

    new_event = {
        'start_date': datetime(2018, 9, 17, 5, 21).strftime('%Y-%m-%d %H:%M:%S'),
        'end_date': '',
        'icon': 'sun.svg',
        'name': 'Sunrise',
        'comment': '',
        'id': 'CE' + str(self.rnd_gen.randint(0, 100000000)),
    }
    self.external_clock_events.append(new_event)

    self.redis.set(name='external_clock_events', data=self.external_clock_events)

    return
