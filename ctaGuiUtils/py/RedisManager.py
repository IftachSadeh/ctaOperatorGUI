import sys
import redis
from ctaGuiUtils.py.Serialisation import Serialisation


# ------------------------------------------------------------------
class RedisBase(object):
    """interface class for the redis database
    """

    # ------------------------------------------------------------------
    def __init__(self, name='', log=None):
        self.name = name
        self.log = log

        return

    # ------------------------------------------------------------------
    def pack(self, data):
        return Serialisation.pack(data, log=self.log)

    # ------------------------------------------------------------------
    def unpack(self, data):
        return Serialisation.unpack(data, log=self.log)

    # ------------------------------------------------------------------
    def is_empty(self, data):
        return Serialisation.is_empty_obj(data)

    # ------------------------------------------------------------------
    def set(self, name=None, data=None, expire=None):
        try:
            if name is None:
                raise Exception('redis.set(): name is None')

            if data is None:
                data = ''
            data = self.pack(data)
            out = self.base.set(name, data)

            if expire is not None:
                out = self.base.expire(name, expire)

        except Exception as e:
            self.log.error([['r', 'redis.set(): '], ['o', name, data, expire]])
            raise e

        return out

    # ------------------------------------------------------------------
    def h_set(self, name=None, key=None, data=None):
        try:
            if (name is None) or (key is None):
                raise Exception('redis.h_set(): name/key is None', name, key)

            if data is None:
                data = ''
            else:
                data = self.pack(data)
            out = self.base.hset(name, key, data)

        except Exception as e:
            self.log.error([['r', 'redis.h_set(): '], ['o', name, key, data]])
            raise e

        return out

    # ------------------------------------------------------------------
    def h_del(self, name=None, key=None):
        try:
            if (name is None) or (key is None):
                raise Exception('redis.h_del(): name/key is None', name, key)

            out = self.base.hdel(name, key)

        except Exception as e:
            self.log.error([['r', 'redis.h_del(): '], ['o', name, key]])
            raise e

        return out

    # ------------------------------------------------------------------
    def h_get_keys(self, name=None, default_val=[]):
        try:
            if name is None:
                raise Exception('redis.h_get_keys(): name is None', name)

            data = self.base.hkeys(name)

            if self.is_empty(data):
                data = default_val
            else:
                data = self.unpack(data)

        except Exception as e:
            self.log.error([['r', 'redis.h_get_keys(): '], ['o', name, key]])
            raise e

        return data

    # ------------------------------------------------------------------
    def h_get(self, name=None, key=None, default_val=None):
        try:
            if (name is None) or (key is None):
                raise Exception('redis.h_get(): name/key is None', name, key)

            # return value for this key
            data = self.base.hget(name, key)

            if self.is_empty(data):
                data = default_val
            else:
                data = self.unpack(data)

        except Exception as e:
            self.log.error([['r', 'redis.h_get(): '], ['o', name, key]])
            raise e

        return data

    # ------------------------------------------------------------------
    def h_m_get(self, name=None, key=None, filter=False):
        try:
            if (name is None) or (key is None):
                raise Exception('redis.h_m_get(): name/key is None', name, key)

            if isinstance(key, list) and len(key) == 0:
                return []

            # returns a list of entries (if empty, gives [None])
            data = self.base.hmget(name, key)

            if filter:
                if isinstance(data, list):
                    data = [x for x in data if x is not None]

            if not self.is_empty(data) and data != [None]:
                data = self.unpack(data)

        except Exception as e:
            self.log.error([['r', 'redis.h_m_get(): '], ['o', name, key]])
            raise e

        return data

    # ------------------------------------------------------------------
    def r_push(self, name=None, data=None):
        try:
            if name is None:
                raise Exception('redis.r_push(): name is None', name)

            if data is None:
                data = ''
            elif isinstance(data, list):
                data = [self.pack(v) for v in data]
            else:
                data = self.pack(data)

            out = self.base.rpush(name, data)

        except Exception as e:
            self.log.error([['r', 'redis.r_push(): '], ['o', name, data]])
            raise e

        return out

    # ------------------------------------------------------------------
    def l_rem(self, name=None, data=None):
        try:
            if name is None:
                raise Exception('redis.l_rem(): name is None', name)

            if data is not None:
                data = self.pack(data)

            out = self.base.lrem(name=name, value=data, count=0)

        except Exception as e:
            self.log.error([['r', 'redis.l_rem(): '], ['o', name, data]])
            raise e

        return out

    # ------------------------------------------------------------------
    def z_add(self, name=None, score=None, data=None, clip_score=None):
        try:
            if (name is None) or (score is None):
                raise Exception('redis.z_add(): name/score is None', name, score)

            data = self.pack({'data': data})
            out = self.base.zadd(name, {data: score})

            # ------------------------------------------------------------------
            # temporary inefficient way to clip the time series.........
            if (clip_score is not None):
                out = self.base.zremrangebyscore(name, 0, clip_score)
            # ------------------------------------------------------------------

        except Exception as e:
            self.log.error([['r', 'redis.z_add(): '],
                            ['o', name, score, data, clip_score],])
            raise e

        return out

    # ------------------------------------------------------------------
    def expire(self, name=None, expire=None):
        try:
            if (name is None) or (expire is None):
                raise Exception('redis.expire(): name/expire is None', name, expire)

            out = self.base.expire(name, expire)

        except Exception as e:
            self.log.error([['r', 'redis.expire(): '], ['o', name, expire]])
            raise e

        return out

    # ------------------------------------------------------------------
    def delete(self, name=None):
        try:
            if name is None:
                raise Exception('redis.delete(): name is None', name)

            out = self.base.delete(name)

        except Exception as e:
            self.log.error([['r', 'redis.delete(): '], ['o', name]])
            raise e

        return out

    # ------------------------------------------------------------------
    def scan(self, cursor=0, match=None, count=None, _type=None):
        try:
            # if name is None:
            #     raise Exception('redis.set(): name is None')

            data = self.base.scan(cursor=cursor, match=match, count=count, _type=_type)
            out = self.unpack(data)


        except Exception as e:
            self.log.error([['r', 'redis.set(): '], ['o', cursor, match, count, _type]])
            raise e

        return out



# ------------------------------------------------------------------
class RedisManager(RedisBase):

    # ------------------------------------------------------------------
    def __init__(self, name='', log=None, port=None, host='localhost'):
        self.name = name
        self.log = log

        self.redis = redis.StrictRedis(host=host, port=port, db=0)
        self.pipe = RedisPipeManager(name=name, log=log, redis=self.redis)
        self.base = self.redis

        self.pubsub = dict()

        return

    # ------------------------------------------------------------------
    def get(self, name=None, default_val=None):
        data = default_val

        try:
            if self.exists(name):
                data = self.redis.get(name)

            if self.is_empty(data):
                data = default_val
            else:
                data = self.unpack(data)

        except Exception as e:
            self.log.error([['r', 'redis.get(): '], ['o', name]])
            raise e

        return data

    # ------------------------------------------------------------------
    def h_get_all(self, name=None):
        try:
            if name is None:
                raise Exception('redis.h_get_all(): name is None', name)

            data = self.redis.hgetall(name)

            if not self.is_empty(data):
                data = self.unpack(data)

        except Exception as e:
            self.log.error([['r', 'redis.h_get_all(): '], ['o', name]])
            raise e

        return data

    # ------------------------------------------------------------------
    def z_get(self, name=None):
        try:
            if name is None:
                raise Exception('redis.z_get(): name is None', name)

            data = self.base.zrevrange(
                name=name, start=0, end=-1, withscores=True, score_cast_func=int
            )

            if not self.is_empty(data):
                data = self.unpack(data)

            if isinstance(data, list):
                data = [x for x in data if x[0] is not None]
            else:
                raise Exception('redis.z_get(): problem with data: ', data)

        except Exception as e:
            self.log.error([['r', 'redis.z_get(): '], ['o', name]])
            raise e

        return data

    # ------------------------------------------------------------------
    def l_get(self, name=None):
        try:
            if name is None:
                raise Exception('redis.l_get(): name is None', name)

            data = self.base.lrange(name=name, start=0, end=-1)

            if not self.is_empty(data):
                data = self.unpack(data)

        except Exception as e:
            self.log.error([['r', 'redis.l_get(): '], ['o', name]])
            raise e

        return data

    # ------------------------------------------------------------------
    def exists(self, name):
        exists = False

        try:
            if name is None:
                raise Exception('redis.exists(): name is None', name)

            exists = self.redis.exists(name)

        except Exception as e:
            self.log.error([['r', 'redis.exists(): '], ['o', name]])
            raise e

        return exists

    # ------------------------------------------------------------------
    def h_exists(self, name=None, key=None):
        exists = False

        try:
            if (name is None) or (key is None):
                raise Exception('redis.h_exists(): name/key is None', name, key)

            exists = self.redis.hexists(name, key)

        except Exception as e:
            self.log.error([['r', 'redis.h_exists(): '], ['o', name, key]])
            raise e

        return exists

    # ------------------------------------------------------------------
    def publish(self, channel=None, message=''):
        try:
            if channel is None:
                raise Exception('redis.publish(): channel is None', channel)

            if not self.is_empty(message):
                message = self.pack(message)

            out = self.redis.publish(channel, message)

        except Exception as e:
            self.log.error([['r', 'redis.publish(): '], ['o', channel, message]])
            raise e

        return out

    # ------------------------------------------------------------------
    def set_pubsub(self, key=None, ignore_subscribe_messages=True):
        try:
            if key is None:
                raise Exception('redis.set_pubsub(): key is None', key)

            if key not in self.pubsub:
                pubsub = self.redis.pubsub(
                    ignore_subscribe_messages=ignore_subscribe_messages
                )
                pubsub.subscribe(key)

                self.pubsub[key] = pubsub
                out = self.pubsub[key] if key in self.pubsub else None

        except Exception as e:
            self.log.error([['r', 'redis.set_pubsub(): '], ['o', key]])
            raise e

        return out

    # ------------------------------------------------------------------
    def get_pubsub(self, key=None, timeout=0, ignore_subscribe_messages=True):
        msg = None

        try:
            if (key is None) or (key not in self.pubsub):
                raise Exception(
                    'redis.get_pubsub(): key is None/not registered',
                    key,
                    self.pubsub.keys(),
                )

            msg = self.pubsub[key].get_message(
                timeout=timeout,
                ignore_subscribe_messages=ignore_subscribe_messages,
            )

            if isinstance(msg, dict):
                if 'data' in msg and not self.is_empty(msg['data']):
                    msg['data'] = self.unpack(msg['data'])

        except Exception as e:
            self.log.error([['r', 'redis.get_pubsub(): '], ['o', key, timeout]])
            raise e

        return msg


# ------------------------------------------------------------------
class RedisPipeManager(RedisBase):

    # ------------------------------------------------------------------
    def __init__(self, name='', log=None, redis=None):
        self.name = name
        self.log = log
        self.redis = redis

        self.pipe = self.redis.pipeline()
        self.base = self.pipe

        return

    # ------------------------------------------------------------------
    def get(self, name=None):
        try:
            if name is None:
                raise Exception('redis.pipe.get(): name is None', name)

            out = self.pipe.get(name)

        except Exception as e:
            self.log.error([['r', 'redis.pipe.get(): '], ['o', name]])
            raise e

        return out

    # ------------------------------------------------------------------
    def z_get(self, name=None, withscores=True, score_cast_func=int):
        try:
            if name is None:
                raise Exception('redis.pipe.z_get(): name is None', name)

            out = self.pipe.zrevrange(
                name=name,
                start=0,
                end=-1,
                withscores=withscores,
                score_cast_func=score_cast_func
            )

        except Exception as e:
            self.log.error([['r', 'redis.pipe.z_get(): '], ['o', name]])
            raise e

        return out

    # ------------------------------------------------------------------
    def execute(self):
        try:
            data = self.pipe.execute()

            if data is None or data == '':
                data = []
            else:
                data = [self.unpack(x) for x in data if not self.is_empty(x)]

            if not self.is_empty(data):
                data = self.unpack(data)
                data = [] if data is None else data

        except Exception as e:
            self.log.error([['r', 'redis.pipe.execute()']])
            raise e

        return data

    # ------------------------------------------------------------------
    def reset(self):
        try:
            self.pipe.reset()

        except Exception as e:
            self.log.error([['r', 'redis.pipe.reset()']])
            raise e

        return True
