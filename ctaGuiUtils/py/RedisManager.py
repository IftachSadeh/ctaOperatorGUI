import sys
import redis
# from gevent import GreenletExit
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

        # self.async_redis = AsyncRedisBase(redis_base=self)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def set(self, name=None, data=None, expire=None, packed=True):
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
                self.log.error([
                    ['r', ' - could not do redis.set() for ',
                     str(name)],
                ])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_set(self, name=None, key=None, data=None, packed=True):
        try:
            if (name is None) or (key is None):
                raise

            if packed and (data is not None):
                data = packb(data)

            out = self.base.hset(name, key, data)
            return out

        except Exception as e:
            if self.log:
                self.log.error([
                    [
                        'r', ' - could not do redis.hset() for ',
                        str(key), ' in ',
                        str(name)
                    ],
                    ['r', '\n', e],
                ])
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
                self.log.error([
                    ['r', ' - could not do redis.h_del() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
            raise e
            # return False

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_get(self, name=None, key=None, packed=True, default_val=None):
        try:
            if (name is None) or (key is None):
                raise

            data = self.base.hget(name, key)

            if is_empty(data):
                data = default_val
            elif packed:
                data = unpack_object(data)

        # except GreenletExit:
        #     pass
        #     return default_val
        except Exception as e:
            if self.log:
                self.log.error([
                    [
                        'r', ' - could not do redis.hget() for ',
                        str(key), ' in ',
                        str(name)
                    ],
                    ['r', '\n', e],
                ])
            data = None
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_m_get(self, name=None, key=None, packed=True, filter=False):
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
                self.log.error([
                    [
                        'r', ' - could not do redis.hmget() for ',
                        str(key), ' in ',
                        str(name)
                    ],
                    ['r', '\n', e],
                ])
            data = None
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def r_push(self, name=None, data=None, packed=True):
        try:
            if (name is None):
                raise

            if data is None:
                data = ''
            if packed:
                if isinstance(data, list):
                    data = [packb(v) for v in data]
                else:
                    data = packb(data)

            out = self.base.rpush(name, data)
            return out

        except Exception as e:
            if self.log:
                self.log.error([
                    ['r', ' - could not do redis.r_push() for ', str(name)],
                    ['r', '\n', e],
                ])
            raise e

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def l_rem(self, name=None, data=None, packed=True):
        try:
            if (name is None):
                raise

            if packed and (data is not None):
                data = packb(data)

            out = self.base.lrem(name=name, value=data, count=0)
            return out

        except Exception as e:
            if self.log:
                self.log.error([
                    ['r', ' - could not do redis.l_rem() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
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
        packed=True,
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
                self.log.error([
                    ['r', ' - could not do redis.z_add() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
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
                self.log.error([
                    ['r', ' - could not do redis.expire() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
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
                self.log.error([
                    ['r', ' - could not do redis.delete() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
            raise e
            # return False


# # ------------------------------------------------------------------
# class AsyncRedisBase(object):
#     def __init__(self, redis_base):
#         self.redis_base = redis_base

#     async def set(self, *arg, **kwargs):
#         return self.redis_base.set(*arg, **kwargs)
    
#     async def h_set(self, *arg, **kwargs):
#         return self.redis_base.h_set(*arg, **kwargs)
    
#     async def h_del(self, *arg, **kwargs):
#         return self.redis_base.h_del(*arg, **kwargs)
    
#     async def h_get(self, *arg, **kwargs):
#         return self.redis_base.h_get(*arg, **kwargs)
    
#     async def h_m_get(self, *arg, **kwargs):
#         return self.redis_base.h_m_get(*arg, **kwargs)
    
#     async def r_push(self, *arg, **kwargs):
#         return self.redis_base.r_push(*arg, **kwargs)
    
#     async def l_rem(self, *arg, **kwargs):
#         return self.redis_base.l_rem(*arg, **kwargs)
    
#     async def z_add(self, *arg, **kwargs):
#         return self.redis_base.z_add(*arg, **kwargs)
    
#     async def expire(self, *arg, **kwargs):
#         return self.redis_base.expire(*arg, **kwargs)
    
#     async def delete(self, *arg, **kwargs):
#         return self.redis_base.delete(*arg, **kwargs)

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

        # self.async_redis = AsyncRedisManager(redis_mngr=self)

        return

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get(self, name=None, packed=True, default_val=None):
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
                self.log.error([
                    ['r', ' - could not do redis.get() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def h_get_all(self, name=None, packed=True):
        try:
            if name is None:
                raise

            data = self.redis.hgetall(name)

            if packed and not is_empty(data):
                data = unpack_object(data)

        except Exception as e:
            if self.log:
                self.log.error([
                    ['r', ' - could not do redis.h_get_all() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
            data = {}
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def z_get(self, name=None, packed=True, packed_score=False):
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
                self.log.error([
                    ['r', ' - could not do redis.z_get() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
            return []
            raise e

        return data

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    # async def async_l_get(self, *arg, **kwargs):
    #     return self.l_get(*arg, **kwargs)

    def l_get(self, name=None, packed=True):
        try:
            if (name is None):
                raise

            data = self.base.lrange(name=name, start=0, end=-1)

            if not is_empty(data):
                if packed:
                    data = unpack_object(data)
                else:
                    data = [d.decode("utf-8") for d in data]

        # except GreenletExit:
        #     pass
        #     return []
        except Exception as e:
            if self.log:
                self.log.error([
                    ['r', ' - could not do redis.l_get() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
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
                self.log.error([
                    ['r', ' - could not do redis.exists() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
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
                self.log.error([
                    ['r', ' - could not do redis.h_exists() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
            raise e

        return exists

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def publish(self, channel=None, message='', packed=True):
        try:
            if channel is None:
                raise

            if packed and not is_empty(message):
                message = packb(message)

            out = self.redis.publish(channel, message)
            return out

        except Exception as e:
            if self.log:
                self.log.error([
                    ['r', ' - could not do redis.publish() for ',
                     str(channel)],
                    ['r', '\n', e],
                ])
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
                self.log.error([
                    ['r', ' - could not do redis.set_pubsub() for ',
                     str(key)],
                    ['r', '\n', e],
                ])
            raise e

        pubsub = self.pubsub[key] if key in self.pubsub else None
        return pubsub

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_pubsub(self, key=None, timeout=0, packed=True, ignore_subscribe_messages=True):
        msg = None

        try:
            if (key is None) or (key not in self.pubsub):
                raise
        except Exception as e:
            if self.log:
                self.log.error([
                    ['r', ' - undefined key',
                     str(key), ' for redis.pubsub() ...'],
                    ['r', '\n', e],
                ])
            raise e
            # return msg

        try:
            msg = self.pubsub[key].get_message(
                timeout=timeout,
                ignore_subscribe_messages=ignore_subscribe_messages,
            )

            if packed and isinstance(msg, dict):
                if 'data' in msg:
                    if not is_empty(msg['data']):
                        msg['data'] = unpack_object(msg['data'])

        except Exception as e:
            if self.log:
                self.log.error([
                    ['r', ' - could not do redis.get_pubsub() for ',
                     str(key)],
                    ['r', '\n', e],
                ])
            raise e

        return msg

    # # ------------------------------------------------------------------
    # #
    # # ------------------------------------------------------------------
    # def has_pubsub(self, key=None, timeout=0, packed=True):
    #     if not ((key is None) or (key not in self.pubsub)):
    #         msg = self.pubsub[key].get_message(timeout=timeout)
    #         print(msg)
    #     return not ((key is None) or (key not in self.pubsub))


# # ------------------------------------------------------------------
# class AsyncRedisManager(object):
#     def __init__(self, redis_mngr):
#         self.redis_mngr = redis_mngr

#     async def get(self, *arg, **kwargs):
#         return self.redis_mngr.get(*arg, **kwargs)
    
#     async def h_get_all(self, *arg, **kwargs):
#         return self.redis_mngr.h_get_all(*arg, **kwargs)
    
#     async def z_get(self, *arg, **kwargs):
#         return self.redis_mngr.z_get(*arg, **kwargs)
    
#     async def l_get(self, *arg, **kwargs):
#         return self.redis_mngr.l_get(*arg, **kwargs)
    
#     async def exists(self, *arg, **kwargs):
#         return self.redis_mngr.exists(*arg, **kwargs)
    
#     async def h_exists(self, *arg, **kwargs):
#         return self.redis_mngr.h_exists(*arg, **kwargs)

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

        # self.async_redis = AsyncPipeRedisManager(redis_pipe=self)

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
                self.log.error([
                    ['r', ' - could not do redis.get() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
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
                self.log.error([
                    ['r', ' - could not do redis.z_get() for ',
                     str(name)],
                    ['r', '\n', e],
                ])
            raise e
            # return False

        return out

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def execute(self, packed=True, packed_score=False):
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
                self.log.error([
                    ['r', ' - could not do redis.pipe.execute() ...'],
                    ['r', '\n', e],
                ])
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
                self.log.error([
                    ['r', ' - could not do redis.pipe.reset()'],
                    ['r', '\n', e],
                ])
            raise e
            # return False


# # ------------------------------------------------------------------
# class AsyncPipeRedisManager(object):
#     def __init__(self, redis_pipe):
#         self.redis_pipe = redis_pipe

#     async def get(self, *arg, **kwargs):
#         return self.redis_pipe.get(*arg, **kwargs)
    
#     async def z_get(self, *arg, **kwargs):
#         return self.redis_pipe.z_get(*arg, **kwargs)
    
#     async def execute(self, *arg, **kwargs):
#         return self.redis_pipe.execute(*arg, **kwargs)
    
#     async def reset(self, *arg, **kwargs):
#         return self.redis_pipe.reset(*arg, **kwargs)

# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def unpack_object(data_in, log=None):
    try:
        if isinstance(data_in, str):
            data = data_in
        elif isinstance(data_in, bytes):
            try:
                data = unpackb(data_in, encoding="utf-8")
            except Exception as e:
                if data_in == b'':
                    data = '' 
                else:
                    raise e
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
            log.error([
                ['r', ' - could not do unpack_object() for ',
                 str(data_in)],
                ['r', '\n', e],
            ])
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





# import inspect
# def add_async_attrs():
#     class AsyncDecorator():
#         pass
#         # def __init__(self, arg):
#         #     super(AsyncDecorator, self).__init__()
#         #     self.arg = arg

#     # async def a(self):
#     #     print('aaaaaaaa')
#     #     return 99
#     # setattr(RedisBase, 'async_'+ 'a', a)
    
#     for redis_cls in [RedisBase, RedisManager, RedisPipeManager]:
#         a = inspect.getmembers(redis_cls)
#         for f in a:
#             name, func = f[0], f[1]
#             if not inspect.isfunction(func):
#                 continue
#             if name.startswith('__') and name.endswith('__'):
#                 continue
#             if name.startswith('async_'):
#                 continue
#             # print(name, ' \t\t\t', func)


#             async def async_func(self, *arg, **kwargs):
#                 print('111111111111')
#                 # xx = func(*arg, **kwargs)
#                 # xx = self.l_get(*arg, **kwargs)
#                 # xx = 77
#                 return self.l_get(*arg, **kwargs)

#             # async def async_func(*arg, **kwargs):
#             #     print('111111111111')
#             #     xx = func(*arg, **kwargs)
#             #     xx = 77
#             #     return xx

#             # xx = await l_get('all_sess_ids')
#             # print('qqqqqqqqqqq', xx)

#             print('async_'+ name, ' \t\t\t',async_func)
#             setattr(redis_cls, 'async_'+ name, func)
#             # setattr(redis_cls, 'async_'+ name, async_func)

#         # a = inspect.getmembers(AsyncDecorator)
#         # print(a)
#         # setattr(redis_cls, 'asyncio', AsyncDecorator)

#     # def qqq(self):
#     #     print('eeeeeeeeeeeeeeeeeeee')
#     # setattr(RedisBase, 'qqq', qqq)
#     return

#             # getattr(SocketManager.widget_inits[widget_id], 'update_sync_groups')()


# add_async_attrs()