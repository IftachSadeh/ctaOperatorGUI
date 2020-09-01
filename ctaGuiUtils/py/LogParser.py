import logging
import logging.config as config
from threading import Lock


# ------------------------------------------------------------------
class LogParser():
    lock = Lock()

    logging_config = None

    web_server_name = 'uvicorn'
    handlers = {
        '': ['console', 'info_rotating_file_handler'],
        'server': ['info_rotating_file_handler'],
    }

    # ------------------------------------------------------------------
    def __init__(
        self,
        base_config,
        title='',
        do_parse_msg=True,
        use_colors=True,
        log_level=None,
        log_file=None,
    ):
        self.base_config = base_config
        if self.base_config is None:
            self.use_log_title = False
            self.add_msg_ele_space = False
        else:
            self.use_log_title = self.base_config.use_log_title
            self.add_msg_ele_space = self.base_config.add_msg_ele_space

        self.do_parse_msg = do_parse_msg

        self.log_file = log_file

        if log_level is None:
            self.log_level = self.base_config.log_level
        else:
            self.log_level = log_level
        # print('oooooooooooooooo', LogParser.logging_config is None, log_level)

        # before getting the logger
        self.set_logging_config()

        self.log = logging.getLogger('')
        self.log.setLevel(self.log_level)

        self.set_colors(use_colors)
        self.base_title = title
        self.title = (
            self.colors['c'](
                '' if (title == ''
                       ) else ((' [' + title + ']' if self.use_log_title else ''))
            )
        )

        return

    # ------------------------------------------------------------------
    def set_logging_config(self):
        if LogParser.logging_config is not None:
            return

        if self.log_file is None:
            raise Exception('trying to configure logging without log_file')

        LogParser.logging_config = {
            'version': 1,
            'disable_existing_loggers': False,
            'formatters': {
                'standard': {
                    'format': '[%(asctime)s %(levelname)-5.5s] %(message)s',
                    'datefmt': '%d/%m, %H:%M:%S',
                },
            },
            'handlers': {
                'console': {
                    # 'level': 'INFO',
                    'formatter': 'standard',
                    'class': 'logging.StreamHandler',
                    # 'stream': 'ext://sys.stdout',  # Default is stderr
                },
                'info_rotating_file_handler': {
                    # 'level': 'INFO',
                    'formatter': 'standard',
                    'class': 'logging.handlers.RotatingFileHandler',
                    'filename': self.log_file,
                    'mode': 'a',
                    'maxBytes': 1048576,
                    'backupCount': 10,
                },
            },
            'loggers': {
                '': {  # root logger
                    'handlers': self.handlers[''],
                    'level': 'INFO',
                    # 'level': 'WARNING',
                    'propagate': True,
                    # 'propagate': False,
                },
                self.web_server_name: {
                    # 'handlers': ['console', 'info_rotating_file_handler'],
                    'handlers': self.handlers['server'],
                    'level': 'WARNING',
                    # 'level': 'INFO',
                    'propagate': False,
                },
            }
        }

        config.dictConfig(config=LogParser.logging_config)

        return

    # ------------------------------------------------------------------
    def parse_msg(self, msg_in):
        if not self.do_parse_msg:
            return msg_in

        # ------------------------------------------------------------------
        # if the input is a list
        # ------------------------------------------------------------------
        if isinstance(msg_in, (list, set)):
            msg = ''
            for msg_now in msg_in:
                # ------------------------------------------------------------------
                #  if there is a list of messages
                # ------------------------------------------------------------------
                if isinstance(msg_now, (list, set)):
                    # list with one element
                    if len(msg_now) == 1:
                        if self.add_msg_ele_space and msg != '':
                            msg += ' '
                        msg += str(msg_now[0])
                    # list with multiple elements
                    elif len(msg_now) >= 2:
                        # first element is a color indicator
                        if msg_now[0] in self.colors:
                            color_func = self.colors[msg_now[0]]
                            # either can be one or more messages after the color indicator
                            if len(msg_now) == 2:
                                msg_str = str(msg_now[1])
                            else:
                                msg_str = (' ').join([
                                    str(ele_now) for ele_now in msg_now[1:]
                                ])
                        # there is no color indicator, just a list of messages
                        else:
                            color_func = self.colors['']
                            msg_str = (' ').join([str(ele_now) for ele_now in msg_now])

                        # compose the colored output from the (joined list of) messages(s)
                        if self.add_msg_ele_space and msg != '':
                            msg += color_func(' ')
                        msg += color_func(msg_str)

                # ------------------------------------------------------------------
                # if there is a single message (non-list)
                # ------------------------------------------------------------------
                else:
                    if self.add_msg_ele_space and msg != '':
                        msg += ' '
                    msg += str(msg_now)

        # ------------------------------------------------------------------
        # if the input is a simple element (non-list)
        # ------------------------------------------------------------------
        else:
            msg = str(msg_in)

        # finally, send the output, with the optional title added
        # ------------------------------------------------------------------
        return (msg + self.title)

    def debug(self, msg_in, *args, **kwargs):
        with LogParser.lock:
            self.log.debug(self.parse_msg(msg_in), *args, **kwargs)

    def info(self, msg_in, *args, **kwargs):
        with LogParser.lock:
            self.log.info(self.parse_msg(msg_in), *args, **kwargs)

    def warning(self, msg_in, *args, **kwargs):
        with LogParser.lock:
            self.log.warning(self.parse_msg(msg_in), *args, **kwargs)

    def warn(self, msg_in, *args, **kwargs):
        with LogParser.lock:
            self.log.warn(self.parse_msg(msg_in), *args, **kwargs)

    def error(self, msg_in, *args, **kwargs):
        with LogParser.lock:
            self.log.error(self.parse_msg(msg_in), *args, **kwargs)

    def critical(self, msg_in, *args, **kwargs):
        with LogParser.lock:
            self.log.critical(self.parse_msg(msg_in), *args, **kwargs)

    # ------------------------------------------------------------------
    # color output
    # ------------------------------------------------------------------
    def get_col_dict(self, use_colors):
        col_def = '\033[0m'
        col_blue = '\033[34m'
        col_red = '\033[31m'
        col_light_blue = '\033[94m'
        col_yellow = '\033[33m'
        col_orange = "\033[48;95;38;5;215m"
        # col_underline = '\033[4;30m'
        col_white_on_black = '\33[40;37;1m'
        col_white_on_green = '\33[42;37;1m'
        col_white_on_yellow = '\33[43;37;1m'
        col_green = '\033[32m'
        col_white_on_red = '\33[41;37;1m'
        col_purple = '\033[35m'
        col_cyan = '\033[36m'

        def no_color(msg):
            return '' if (str(msg) == '') else str(msg)

        def blue(msg):
            return '' if (str(msg) == '') else col_blue + str(msg) + col_def

        def red(msg):
            return '' if (str(msg) == '') else col_red + str(msg) + col_def

        def green(msg):
            return '' if (str(msg) == '') else col_green + str(msg) + col_def

        def light_blue(msg):
            return '' if (str(msg) == '') else col_light_blue + str(msg) + col_def

        def yellow(msg):
            return '' if (str(msg) == '') else col_yellow + str(msg) + col_def

        def orange(msg):
            return '' if (str(msg) == '') else col_orange + str(msg) + col_def

        def purple(msg):
            return '' if (str(msg) == '') else col_purple + str(msg) + col_def

        def cyan(msg):
            return '' if (str(msg) == '') else col_cyan + str(msg) + col_def

        def white_on_black(msg):
            return '' if (str(msg) == '') else col_white_on_black + str(msg) + col_def

        def red_on_black(msg):
            return '' if (str(msg)
                          == '') else col_white_on_black + col_red + str(msg) + col_def

        def blue_on_black(msg):
            return '' if (str(msg)
                          == '') else col_white_on_black + col_blue + str(msg) + col_def

        def yellow_on_black(msg):
            return '' if (str(msg) == ''
                          ) else col_white_on_black + col_yellow + str(msg) + col_def

        def white_on_red(msg):
            return '' if (str(msg) == '') else col_white_on_red + str(msg) + col_def

        def yellow_on_red(msg):
            return '' if (str(msg)
                          == '') else col_white_on_red + col_yellow + str(msg) + col_def

        def white_on_yellow(msg):
            return '' if (str(msg) == '') else col_white_on_yellow + str(msg) + col_def

        def white_on_green(msg):
            return '' if (str(msg) == '') else col_white_on_green + str(msg) + col_def

        colors = dict()

        colors[''] = no_color if not use_colors else no_color
        colors['r'] = no_color if not use_colors else red
        colors['g'] = no_color if not use_colors else green
        colors['b'] = no_color if not use_colors else blue
        colors['y'] = no_color if not use_colors else yellow
        colors['o'] = no_color if not use_colors else orange
        colors['p'] = no_color if not use_colors else purple
        colors['c'] = no_color if not use_colors else cyan
        colors['lb'] = no_color if not use_colors else light_blue
        colors['wb'] = no_color if not use_colors else white_on_black
        colors['rb'] = no_color if not use_colors else red_on_black
        colors['bb'] = no_color if not use_colors else blue_on_black
        colors['yb'] = no_color if not use_colors else yellow_on_black
        colors['wr'] = no_color if not use_colors else white_on_red
        colors['yr'] = no_color if not use_colors else yellow_on_red
        colors['wy'] = no_color if not use_colors else white_on_yellow
        colors['wg'] = no_color if not use_colors else white_on_green

        return colors

    def set_colors(self, use_colors):
        self.colors = self.get_col_dict(use_colors)
        return

    # ------------------------------------------------------------------
    def get_title(self):
        return self.base_title


# ------------------------------------------------------------------
# locker class by name
# ------------------------------------------------------------------
# class LogLock():
#     locks = {}

#     def __init__(self, name='', seconds_to_check=None):
#         self.name = 'generic' if name == '' else name

#         self.seconds_to_check = max(
#             0.0001,
#             min(
#                 0.5, (
#                     seconds_to_check
#                     if isinstance(seconds_to_check, numbers.Number) else 0.05
#                 )
#             )
#         )
#         self.n_max_checks = max(5 / self.seconds_to_check, 2)

#         if self.name not in LogLock.locks:
#             LogLock.locks[self.name] = False

#     def __enter__(self):
#         n_checked = 0
#         while LogLock.locks[self.name]:
#             n_checked += 1
#             if n_checked > self.n_max_checks:
#                 raise Warning(' - could not get lock for ' + self.name + ' ...')
#                 break
#             sleep(self.seconds_to_check)

#         LogLock.locks[self.name] = True

#     def __exit__(self, type, value, traceback):
#         LogLock.locks[self.name] = False
