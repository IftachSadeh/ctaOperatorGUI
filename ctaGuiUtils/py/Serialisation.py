import msgpack


# ------------------------------------------------------------------
class Serialisation():
    """serialisation interface
    """

    # ------------------------------------------------------------------
    def __init__(self, log=None):
        self.log = log
        return

    # ------------------------------------------------------------------
    @classmethod
    def pack(self, data_in, log=None):
        try:
            data = msgpack.packb(data_in)
        except Exception as e:
            if log is None:
                log = self.log
            if log is not None:
                log.error([
                    ['r', ' - could not do pack() for ',
                     str(data_in)],
                    ['r', '\n', e],
                ])
            raise e

        return data

    # ------------------------------------------------------------------
    @classmethod
    def unpack(self, data_in, log=None):
        try:
            if isinstance(data_in, str):
                data = data_in
            elif isinstance(data_in, bytes):
                try:
                    data = msgpack.unpackb(data_in, encoding="utf-8")
                except Exception:
                    try:
                        data = data_in.decode("utf-8")
                    except Exception as e:
                        if data_in == b'':
                            data = ''
                        else:
                            raise e
            elif isinstance(data_in, list):
                data = []
                for data_now_0 in data_in:
                    data += [self.unpack(data_now_0, log)]

            elif isinstance(data_in, dict):
                data = dict()
                for k, v in data_in.items():
                    data[self.unpack(k, log)] = self.unpack(v, log)

            elif isinstance(data_in, tuple):
                data = ()
                for v in data_in:
                    data += (self.unpack(v, log), )

            elif isinstance(data_in, (int, float, complex)) or (data_in is None):
                data = data_in

            else:
                raise Exception('unknown data type')

        except Exception as e:
            if log is None:
                log = self.log
            if log is not None:
                log.error([
                    ['r', ' - could not do unpack() for ',
                     str(data_in)],
                    ['r', '\n', e],
                ])
            raise e

        return data

    # ------------------------------------------------------------------
    @classmethod
    def is_empty_obj(self, data):
        if isinstance(data, list):
            is_empty = (len(data) == 0)
        else:
            is_empty = (data is None or data == '')

        return is_empty
