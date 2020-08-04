import sys
import redis
from gevent import GreenletExit
from msgpack import packb
from msgpack import unpackb

# redis_port = 6378
# redis_port = dict()
# redis_port["N"] = 6379
# redis_port["S"] = 6379
# #  ugly temporery hack for development:
# if userName == "verdingi":
#   has_acs = False
#   redis_port["N"] += 1
#   redis_port["S"] += 1


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class RedisBase(object):
    def __init__(self, name='', log=None):
        self.name = name
        self.log = log

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def set(self, name=None, data=None, expire=None, packed=False):
        try:
            if (name is None):
                raise

            if data is None:
                data = ''
            if packed:
                data = packb(data)

            out = self.base.set(name, data)

            if expire is not None:
                out = self.base.expire(name, expire)

            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.set() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_set(self, name=None, key=None, data=None, packed=False):
        try:
            if (name is None) or (key is None):
                raise

            if packed and (data is not None):
                data = packb(data)

            out = self.base.hset(name, key, data)
            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.hset() for ',
                    str(key), ' in ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_del(self, name=None, key=None):
        try:
            if (name is None) or (key is None):
                raise

            out = self.base.hdel(name, key)
            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.h_del() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_get(self, name=None, key=None, packed=False, default_val=None):
        try:
            if (name is None) or (key is None):
                raise

            data = self.base.hget(name, key)

            if is_empty(data):
                data = default_val
            elif packed:
                data = unpack_object(data)

        except GreenletExit:
            pass
            return default_val
        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.hget() for ',
                    str(key), ' in ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            data = None
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_m_get(self, name=None, key=None, packed=False, filter=False):
        try:
            if (name is None) or (key is None):
                raise

            if key == []:
                return []

            # returns a list of entries (if empty, gives [None])
            data = self.base.hmget(name, key)

            if filter:
                if isinstance(data, list):
                    data = [x for x in data if x is not None]

            if packed:
                if not is_empty(data) and data != [None]:
                    data = unpack_object(data)

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.hmget() for ',
                    str(key), ' in ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            data = None
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def r_push(self, name=None, data=None, packed=False):
        try:
            if (name is None):
                raise

            if packed and (data is not None):
                if isinstance(data, list):
                    data = [packb(v) for v in data]
                else:
                    data = packb(data)

            out = self.base.rpush(name, data)
            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.r_push() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def l_rem(self, name=None, data=None, packed=False):
        try:
            if (name is None):
                raise

            if packed and (data is not None):
                data = unpack_object(data)

            out = self.base.lrem(name=name, value=data, count=0)
            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.l_rem() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def z_add(
        self,
        name=None,
        score=None,
        data=None,
        packed=False,
        clip_score=None,
        packed_score=False
    ):
        try:
            if (name is None) or (score is None):
                raise

            if packed_score:
                data = packb({'data': data})
            elif packed and (data is not None):
                data = packb(data)

            # out = self.base.zadd(name, score, data)
            out = self.base.zadd(name, {data: score})

            # ------------------------------------------------------------------
            # temporary inefficient way to clip the time series.........
            if (clip_score is not None):
                out = self.base.zremrangebyscore(name, 0, clip_score)
            # ------------------------------------------------------------------
            # if name == 'inst_health;Lx03;camera_1':
            #     print('add', name, score, clip_score)

            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.z_add() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def expire(self, name=None, expire=None):
        try:
            if (name is None) or (expire is None):
                raise

            out = self.base.expire(name, expire)
            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.expire() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def delete(self, name=None):
        try:
            if (name is None):
                raise

            out = self.base.delete(name)
            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.delete() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class RedisManager(RedisBase):

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, name='', log=None, port=None, host='localhost'):
        super(RedisManager, self).__init__(name=name, log=log)

        self.name = name
        self.log = log

        self.redis = redis.StrictRedis(host=host, port=port, db=0)
        self.pipe = RedisPipeManager(name=name, log=log, redis=self.redis)
        self.base = self.redis

        self.pubsub = dict()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get(self, name=None, packed=False, default_val=None):
        data = default_val

        try:
            if self.exists(name):
                data = self.redis.get(name)

            if is_empty(data):
                data = default_val
            elif packed:
                data = unpack_object(data)

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.get() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_get_all(self, name=None, packed=False):
        try:
            if name is None:
                raise

            data = self.redis.hgetall(name)

            if packed and not is_empty(data):
                data = unpack_object(data)

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.h_get_all() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            data = {}
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def z_get(self, name=None, packed=False, packed_score=False):
        try:
            if (name is None):
                raise

            data = self.base.zrevrange(
                name=name, start=0, end=-1, withscores=True, score_cast_func=int
            )

            if (packed or packed_score) and not is_empty(data):
                data = unpack_object(data)

            if isinstance(data, list):
                data = [x for x in data if x[0] is not None]
            else:
                raise

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.z_get() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            return []
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def l_get(self, name=None, packed=False):
        try:
            if (name is None):
                raise

            data = self.base.lrange(name=name, start=0, end=-1)

            if not is_empty(data):
                if packed:
                    data = unpack_object(data)
                else:
                    data = [ d.decode("utf-8") for d in data ]

        except GreenletExit:
            pass
            return []
        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.l_get() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            return []
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def exists(self, name):
        exists = False

        try:
            if name is None:
                raise

            exists = self.redis.exists(name)

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.exists() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e

        return exists

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_exists(self, name=None, key=None):
        exists = False

        try:
            if (name is None) or (key is None):
                raise

            exists = self.redis.hexists(name, key)

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.h_exists() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e

        return exists

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def publish(self, channel=None, message='', packed=False):
        try:
            if channel is None:
                raise

            if packed and not is_empty(message):
                message = packb(message)

            out = self.redis.publish(channel, message)
            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.publish() for ',
                    str(channel)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def set_pubsub(self, key=None, ignore_subscribe_messages=True):
        try:
            if key is None:
                raise

            if key not in self.pubsub:
                pubsub = self.redis.pubsub(
                    ignore_subscribe_messages=ignore_subscribe_messages
                )
                pubsub.subscribe(key)

                self.pubsub[key] = pubsub

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.set_pubsub() for ',
                    str(key)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e

        pubsub = self.pubsub[key] if key in self.pubsub else None
        return pubsub

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_pubsub(self, key=None, timeout=3600, packed=False):
        msg = None

        try:
            if (key is None) or (key not in self.pubsub):
                raise
        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - undefined key',
                    str(key), ' for redis.pubsub() ...'
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return msg

        try:
            msg = self.pubsub[key].get_message(timeout=timeout)

            if packed and isinstance(msg, dict):
                if 'data' in msg:
                    if not is_empty(msg['data']):
                        msg['data'] = unpack_object(msg['data'])

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.get_pubsub() for ',
                    str(key)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e

        return msg

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def has_pubsub(self, key=None, timeout=3600, packed=False):
    #     if not ((key is None) or (key not in self.pubsub)):
    #         msg = self.pubsub[key].get_message(timeout=timeout)
    #         print(msg)
    #     return not ((key is None) or (key not in self.pubsub))


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class RedisPipeManager(RedisBase):

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, name='', log=None, redis=None):
        super(RedisPipeManager, self).__init__(name=name, log=log)

        self.name = name
        self.log = log
        self.redis = redis

        self.pipe = self.redis.pipeline()
        self.base = self.pipe

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get(self, name=None):
        try:
            if (name is None):
                raise

            out = self.pipe.get(name)

            return out

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.get() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def z_get(self, name=None, withscores=True, score_cast_func=int):
        try:
            if (name is None):
                raise

            out = self.pipe.zrevrange(
                name=name,
                start=0,
                end=-1,
                withscores=withscores,
                score_cast_func=score_cast_func
            )

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.z_get() for ',
                    str(name)
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False

        return out

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def execute(self, packed=False, packed_score=False):
        data = []

        try:
            data = self.pipe.execute()

            if data is None or data == '':
                data = []
            else:
                data = [x for x in data if not is_empty(x)]
                # data = filter(lambda x: x is not None, self.pipe.execute())

            if (packed or packed_score) and not is_empty(data):
                data = unpack_object(data)
                data = [] if data is None else data

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.pipe.execute() ...'
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def reset(self):
        try:
            self.pipe.reset()
            return True

        except Exception as e:
            if self.log:
                self.log.error([[
                    'wr', ' - ', self.name, ' - could not do redis.pipe.reset()'
                ], ['r', ' ' + str(sys.exc_info())]])
            raise e
            # return False


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def unpack_object(data_in, log=None):
    try:
        if isinstance(data_in, (str, bytes)):
            data = unpackb(data_in, encoding = "utf-8")
        elif isinstance(data_in, list):
            data = []
            for data_now_0 in data_in:
                data += [unpack_object(data_now_0, log)]

        elif isinstance(data_in, dict):
            data = dict()
            for k, v in data_in.items():
                data[k] = unpack_object(v, log)

        elif isinstance(data_in, tuple):
            data = ()
            for v in data_in:
                data += (unpack_object(v, log), )

        elif isinstance(data_in, (int, float, complex)) or (data_in is None):
            data = data_in

        else:
            raise Exception('unknown data type')

    except Exception as e:
        if log:
            log.error([[
                'wr', ' - ', self.name, ' - could not do unpack_object() for ',
                str(data_in)
            ], ['r', ' ' + str(sys.exc_info())]])
        data = None
        raise e

    return data


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def is_empty(data):
    if isinstance(data, list):
        return (len(data) == 0)
    else:
        return (data is None or data == '')
