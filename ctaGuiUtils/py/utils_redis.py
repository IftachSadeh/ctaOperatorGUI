import sys
import redis
from gevent import GreenletExit
from msgpack import packb, unpackb

redisPort = 6379
# redisPort = dict()
# redisPort["N"] = 6379
# redisPort["S"] = 6379
# #  ugly temporery hack for development:
# if userName == "verdingi":
#   hasACS = False
#   redisPort["N"] += 1
#   redisPort["S"] += 1


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class redisBase(object):
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

            if packed and (data is not None):
                data = packb(data)

            out = self.base.set(name, data)

            if expire is not None:
                out = self.base.expire(name, expire)

            return out

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.set() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def hSet(self, name=None, key=None, data=None, packed=False):
        try:
            if (name is None) or (key is None):
                raise

            if packed and (data is not None):
                data = packb(data)

            out = self.base.hset(name, key, data)
            return out

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.hset() for ',
                        str(key), ' in ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def hDel(self, name=None, key=None):
        try:
            if (name is None) or (key is None):
                raise

            out = self.base.hdel(name, key)
            return out

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.hDel() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def hGet(self, name=None, key=None, packed=False, defVal=None):
        try:
            if (name is None) or (key is None):
                raise

            data = self.base.hget(name, key)

            if isEmpty(data):
                data = defVal
            elif packed:
                data = unPackObj(data)

        except GreenletExit:
            pass
            return defVal
        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.hget() for ',
                        str(key), ' in ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            data = None

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def hMget(self, name=None, key=None, packed=False, filter=False):
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
                if not isEmpty(data) and data != [None]:
                    data = unPackObj(data)

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.hmget() for ',
                        str(key), ' in ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            data = None

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def lPush(self, name=None, data=None, packed=False):
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

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.lPush() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def lRem(self, name=None, data=None, packed=False):
        try:
            if (name is None):
                raise

            if packed and (data is not None):
                data = unPackObj(data)

            out = self.base.lrem(name=name, value=data, count=0)
            return out

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.lRem() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def zAdd(self, name=None, score=None, data=None,
             packed=False, clipScore=None, packedScore=False):
        try:
            if (name is None) or (score is None):
                raise

            if packedScore:
                data = packb({'score': score, 'data': data})
            elif packed and (data is not None):
                data = packb(data)

            out = self.base.zadd(name, score, data)

            # ------------------------------------------------------------------
            # temporary inefficient way to clip the time series.........
            if (clipScore is not None):
                out = self.base.zremrangebyscore(name, 0, clipScore)
            # ------------------------------------------------------------------

            return out

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.zAdd() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def expire(self, name=None, expire=None):
        try:
            if (name is None) or (expire is None):
                raise

            out = self.base.expire(name, expire)
            return out

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.expire() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def delete(self, name=None):
        try:
            if (name is None):
                raise

            out = self.base.delete(name)
            return out

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.delete() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return False


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class redisManager(redisBase):

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, name='', log=None, port=redisPort, host='localhost'):
        super(redisManager, self).__init__(name=name, log=log)

        self.name = name
        self.log = log

        self.redis = redis.StrictRedis(host=host, port=port, db=0)
        self.pipe = pipeManager(name=name, log=log, redis=self.redis)
        self.base = self.redis

        self.pubSub = dict()

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get(self, name=None, packed=False, defVal=None):
        data = defVal

        try:
            if self.exists(name):
                data = self.redis.get(name)

            if isEmpty(data):
                data = defVal
            elif packed:
                data = unPackObj(data)

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.get() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def hGetAll(self, name=None, packed=False):
        try:
            if name is None:
                raise

            data = self.redis.hgetall(name)

            if packed and not isEmpty(data):
                data = unPackObj(data)

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.hGetAll() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            data = {}

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def zGet(self, name=None, packed=False, packedScore=False):
        try:
            if (name is None):
                raise

            data = self.base.zrevrange(
                name=name, start=0, end=-1, withscores=True, score_cast_func=int)

            if (packed or packedScore) and not isEmpty(data):
                data = unPackObj(data)

            if isinstance(data, list):
                data = [x for x in data if x[0] is not None]
            else:
                raise

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.zGet() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return []

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def lGet(self, name=None, packed=False):
        try:
            if (name is None):
                raise

            data = self.base.lrange(name=name, start=0, end=-1)

            if packed and not isEmpty(data):
                data = unPackObj(data)

        except GreenletExit:
            pass
            return []
        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.lGet() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return []

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

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.exists() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])

        return exists

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def hExists(self, name=None, key=None):
        exists = False

        try:
            if (name is None) or (key is None):
                raise

            exists = self.redis.hexists(name, key)

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.hExists() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])

        return exists

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def publish(self, channel=None, message='', packed=False):
        try:
            if channel is None:
                raise

            if packed and not isEmpty(message):
                message = packb(message)

            out = self.redis.publish(channel, message)
            return out

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.publish() for ', str(channel)],
                    ['r', ' '+str(sys.exc_info())]
                ])

            return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def setPubSub(self, key=None, ignoreSubscribeMessages=True):
        try:
            if key is None:
                raise

            if key not in self.pubSub:
                pubSub = self.redis.pubsub(
                    ignore_subscribe_messages=ignoreSubscribeMessages)
                pubSub.subscribe(key)

                self.pubSub[key] = pubSub

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.setPubSub() for ', str(key)],
                    ['r', ' '+str(sys.exc_info())]
                ])

        pubSub = self.pubSub[key] if key in self.pubSub else None
        return pubSub

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def getPubSub(self, key=None, timeout=3600, packed=False):
        msg = None

        try:
            if (key is None) or (key not in self.pubSub):
                raise
        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - undefined key', str(key),
                        ' for redis.pubsub() ...'],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return msg

        try:
            msg = self.pubSub[key].get_message(timeout=timeout)

            if packed and isinstance(msg, dict):
                if 'data' in msg:
                    if not isEmpty(msg['data']):
                        msg['data'] = unPackObj(msg['data'])

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.getPubSub() for ', str(key)],
                    ['r', ' '+str(sys.exc_info())]
                ])

        return msg


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
class pipeManager(redisBase):

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def __init__(self, name='', log=None, redis=None):
        super(pipeManager, self).__init__(name=name, log=log)

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

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.get() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])

            return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def zGet(self, name=None, withscores=True, score_cast_func=int):
        try:
            if (name is None):
                raise

            out = self.pipe.zrevrange(
                name=name, start=0, end=-1, withscores=withscores, score_cast_func=score_cast_func)

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.zGet() for ', str(name)],
                    ['r', ' '+str(sys.exc_info())]
                ])

            return False

        return out

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def execute(self, packed=False, packedScore=False):
        data = []

        try:
            data = self.pipe.execute()

            if data is None or data == '':
                data = []
            else:
                data = [x for x in data if not isEmpty(x)]
                # data = filter(lambda x: x is not None, self.pipe.execute())

            if (packed or packedScore) and not isEmpty(data):
                data = unPackObj(data)
                data = [] if data is None else data

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.pipe.execute() ...'],
                    ['r', ' '+str(sys.exc_info())]
                ])

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def reset(self):
        try:
            self.pipe.reset()
            return True

        except Exception:
            if self.log:
                self.log.error([
                    ['wr', ' - ', self.name, ' - could not do redis.pipe.reset()'],
                    ['r', ' '+str(sys.exc_info())]
                ])
            return False


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def unPackObj(dataIn, log=None):
    try:
        if isinstance(dataIn, str):
            data = unpackb(dataIn)

        elif isinstance(dataIn, list):
            data = []
            for dataNow0 in dataIn:
                data += [unPackObj(dataNow0, log)]

        elif isinstance(dataIn, dict):
            data = dict()
            for k, v in dataIn.iteritems():
                data[k] = unPackObj(v, log)

        elif isinstance(dataIn, tuple):
            data = ()
            for v in dataIn:
                data += (unPackObj(v, log), )

        elif isinstance(dataIn, (int, long, float, complex)) or (dataIn is None):
            data = dataIn

        else:
            raise

    except Exception:
        if log:
            log.error([
                ['wr', ' - ', self.name, ' - could not do unPackObj() for ', str(dataIn)],
                ['r', ' '+str(sys.exc_info())]
            ])
        data = None

    return data


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def isEmpty(data):
    return (data is None or data == '')
