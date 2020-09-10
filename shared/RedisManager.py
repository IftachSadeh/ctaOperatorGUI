import sys
import redis
from shared.Serialisation import Serialisation


# ------------------------------------------------------------------
class RedisBase():
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
    def is_empty(self, data, check_pipe=True):
        is_pipe = check_pipe and (self.base is not self.redis)

        if not is_pipe:
            out = Serialisation.is_empty_obj(data)
        else:
            out = True

        return out

    # ------------------------------------------------------------------
    def flush(self):
        self.redis.flushall()
        return

    # ------------------------------------------------------------------
    def set(self, name=None, data=None, expire_sec=None):
        out, ex_out = None, None
        try:
            if name is None:
                raise Exception('redis.set(): name is None')

            if data is None:
                data = ''
            data = self.pack(data)
            out = self.base.set(name, data)

            if expire_sec is not None:
                ex_out = self.base.expire(name, expire_sec)

        except Exception as e:
            self.log.error([['r', 'redis.set(): '], ['o', name, data, expire_sec]])
            raise e

        output = {
            'set': out,
            'expire': ex_out,
        }
        return output

    # ------------------------------------------------------------------
    def set_nx(self, name=None, data=None, expire_sec=None):
        out, ex_out = None, None
        try:
            if name is None:
                raise Exception('redis.set_nx(): name is None')

            if data is None:
                data = ''
            data = self.pack(data)
            out = self.base.setnx(name, data)

            if expire_sec is not None:
                ex_out = self.base.expire(name, expire_sec)

        except Exception as e:
            self.log.error([['r', 'redis.set_nx(): '], ['o', name, data, expire_sec]])
            raise e

        output = {
            'set_nx': out,
            'expire': ex_out,
        }
        return output

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
    def h_del(self, name=None, key=None, keys=None):
        try:
            if name is None:
                raise Exception('redis.h_del(): name is None', name)

            if (int(key is None) + int(keys is None)) != 1:
                raise Exception(
                    'redis.h_del(): must provide exactly one of key,keys',
                    (name, key, keys),
                )

            if key is not None and not isinstance(key, str):
                raise Exception(
                    'redis.h_del(): key must be of type str',
                    (name, key, keys),
                )

            if keys is not None and not isinstance(keys, (list, set, tuple)):
                raise Exception(
                    'redis.h_del(): keys must be one of (list, set, tuple)',
                    (name, key, keys),
                )

            if key is not None:
                out = self.base.hdel(name, key)
            else:
                out = [self.base.hdel(name, k) for k in keys]

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
    def h_m_get(
        self, name=None, key=None, keys=None, filter_none=False, default_val=None
    ):
        try:
            if name is None:
                raise Exception('redis.h_m_get(): name is None', name)

            if (int(key is None) + int(keys is None)) != 1:
                raise Exception(
                    'redis.h_m_get(): must provide exactly one of key,keys',
                    (name, key, keys),
                )

            if key is not None and not isinstance(key, str):
                raise Exception(
                    'redis.h_m_get(): key must be of type str',
                    (name, key, keys),
                )

            if keys is not None and not isinstance(keys, (list, set, tuple)):
                raise Exception(
                    'redis.h_m_get(): keys must be one of (list, set, tuple)',
                    (name, key, keys),
                )

            if keys is not None and len(keys) == 0:
                return default_val

            # returns a list of entries (if empty, gives [None])
            data = self.base.hmget(name, (key if keys is None else keys))

            if filter_none:
                if isinstance(data, (list, set, tuple)):
                    data = [x for x in data if x is not None]

            if self.is_empty(data):
                return default_val
            else:
                data = self.unpack(data)

        except Exception as e:
            self.log.error([['r', 'redis.h_m_get(): '], ['o', name, key, keys]])
            raise e

        return data

    # ------------------------------------------------------------------
    def r_push(self, name=None, data=None):
        try:
            if (name is None) or (data is None):
                raise Exception('redis.r_push(): name/data is None', name, data)
            # if name is None:
            #     raise Exception('redis.r_push(): name is None', name)

            # if data is None:
            #     data = ''
            if isinstance(data, list):
                data = [self.pack(v) for v in data]
            else:
                data = self.pack(data)

            out = self.base.rpush(name, data)

        except Exception as e:
            self.log.error([['r', 'redis.r_push(): '], ['o', name, data]])
            raise e

        return out

    # ------------------------------------------------------------------
    def s_add(self, name=None, data=None, expire_sec=None):
        try:
            if (name is None) or (data is None):
                raise Exception('redis.s_add(): name/data is None', name, data)

            if isinstance(data, list):
                data = [self.pack(v) for v in data]
            else:
                data = self.pack(data)

            out = self.base.sadd(name, data)

            if expire_sec is not None:
                out = self.base.setex(name, expire_sec, data)

        except Exception as e:
            self.log.error([['r', 'redis.s_add(): '], ['o', name, data]])
            raise e

        return out

    # ------------------------------------------------------------------
    def s_get(self, name=None, default_val={}):
        try:
            if name is None:
                raise Exception('redis.s_get(): name is None', name)

            data = self.base.smembers(name=name)

            if self.is_empty(data):
                data = default_val
            else:
                data = self.unpack(data)

        except Exception as e:
            self.log.error([['r', 'redis.s_get(): '], ['o', name]])
            raise e

        return data

    # ------------------------------------------------------------------
    def s_rem(self, name=None, data=None):
        try:
            if name is None:
                raise Exception('redis.s_rem(): name is None', name)

            if data is not None:
                data = self.pack(data)

            out = self.base.srem(name, data)

        except Exception as e:
            self.log.error([['r', 'redis.s_rem(): '], ['o', name, data]])
            raise e

        return out

    # ------------------------------------------------------------------
    def s_exists(self, name, data=None):
        exists = False

        try:
            if name is None:
                raise Exception('redis.s_exists(): name is None', name)

            if data is None:
                exists = self.exists(name)
            else:
                data = self.pack(data)
                exists = self.redis.sismember(name, data)

        except Exception as e:
            self.log.error([['r', 'redis.s_exists(): '], ['o', name]])
            raise e

        return exists

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
            if clip_score is not None:
                out = self.base.zremrangebyscore(name, 0, clip_score)
            # ------------------------------------------------------------------

        except Exception as e:
            self.log.error([
                ['r', 'redis.z_add(): '],
                ['o', name, score, data, clip_score],
            ])
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
    def __init__(self, name='', log=None, base_config=None, host='localhost'):
        self.name = name
        self.log = log

        port = base_config.redis_port
        self.redis = redis.StrictRedis(host=host, port=port, db=0)
        # self.pipe = RedisPipeManager(name=name, log=log, redis=self.redis)
        self.base = self.redis

        return

    # ------------------------------------------------------------------
    def get_pipe(self):
        return RedisPipeManager(name=self.name, log=self.log, redis=self.redis)

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
    def h_get_all(self, name=None, key=None, default_val=None):

        try:
            if name is None:
                raise Exception('redis.h_get_all(): name is None', name)

            if key is not None:
                return self.h_get(name=name, key=key, default_val=default_val)

            data = self.redis.hgetall(name)

            if self.is_empty(data):
                data = default_val
            else:
                data = self.unpack(data)

        except Exception as e:
            self.log.error([['r', 'redis.h_get_all(): '], ['o', name]])
            raise e

        return data

    # ------------------------------------------------------------------
    def z_get(self, name=None, filter_none=False):
        try:
            if name is None:
                raise Exception('redis.z_get(): name is None', name)

            data = self.base.zrevrange(
                name=name, start=0, end=-1, withscores=True, score_cast_func=int
            )

            if not self.is_empty(data):
                data = self.unpack(data)

            if isinstance(data, (list, set, tuple)):
                if filter_none:
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
    def expire_sec(self, name=None, expire_sec=None):
        """set expiration for an existing redis key

           this is not implemented for the pipe, as then it would not be possible
           to effectively check the existance of keys with any performance boost
        """

        try:
            if (name is None) or (expire_sec is None):
                raise Exception(
                    'redis.expire_sec(): name/expire_sec is None', name, expire_sec
                )

            out = self.base.expire(name, expire_sec)
            if not out:
                raise Exception(
                    'redis.expire_sec(): trying to expire non-existing name', name
                )

        except Exception as e:
            self.log.error([['r', 'redis.expire_sec(): '], ['o', name, expire_sec]])
            raise e

        return out

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
    def pubsub_subscribe(self, key=None, ignore_subscribe_messages=True):
        try:
            if key is None:
                raise Exception('redis.pubsub_subscribe(): key is None', key)

            pubsub = self.redis.pubsub(
                ignore_subscribe_messages=ignore_subscribe_messages
            )
            pubsub.subscribe(key)

        except Exception as e:
            self.log.error([['r', 'redis.pubsub_subscribe(): '], ['o', key]])
            raise e

        return pubsub

    # ------------------------------------------------------------------
    def pubsub_get_message(self, pubsub, timeout=None, ignore_subscribe_messages=True):
        msg = None

        # for loops monitoring pubsub events, the delay between messages
        # is integrated in the loop, therefore redis itself should
        # NOT be blocking --> timeout is extreemly tiny
        if timeout is None:
            timeout = 0.001

        try:
            if not isinstance(pubsub, redis.client.PubSub):
                raise Exception(
                    'redis.pubsub_get_message(): pubsub should be a PubSub object',
                    pubsub,
                    self.pubsub.keys(),
                )

            msg = pubsub.get_message(
                timeout=timeout,
                ignore_subscribe_messages=ignore_subscribe_messages,
            )

            if isinstance(msg, dict):
                if 'data' in msg and not self.is_empty(msg['data']):
                    msg['data'] = self.unpack(msg['data'])

        except Exception as e:
            self.log.error([
                ['r', 'redis.pubsub_get_message(): '],
                ['o', timeout, ignore_subscribe_messages],
            ])
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

            if self.is_empty(data, check_pipe=False):
                data = []
            else:
                for n_ele in range(len(data)):
                    if not self.is_empty(data[n_ele], check_pipe=False):
                        data[n_ele] = self.unpack(data[n_ele])
                # data = [
                #     self.unpack(x)
                #     for x in data
                #     if not self.is_empty(x, check_pipe=False)
                # ]

            # if not self.is_empty(data):
            #     data = self.unpack(data, check_pipe=False)
            #     data = [] if data is None else data

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
