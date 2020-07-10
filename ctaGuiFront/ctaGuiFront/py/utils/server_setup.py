from asgiref.wsgi import WsgiToAsgi

from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.exceptions import NotFound
from sqlalchemy import engine_from_config

from ctaGuiUtils.py.BaseConfig import BaseConfig
from ctaGuiUtils.py.InstData import InstData

from ctaGuiUtils.py.utils import has_acs

from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiFront.py.utils.ViewManager import ViewManager
from ctaGuiFront.py.utils.Models import RootFactory, db_session, sql_base, get_groups

from ctaGuiFront.py.utils.server_args import parse_args


# ------------------------------------------------------------------
def setup_app():
    try:
        view_manager = ViewManager(base_config=base_config)

        # database and authentication
        engine = engine_from_config(settings, 'sqlalchemy.')
        # engine = create_engine('sqlite:///ctaGuiFront.db') # if not set in the .ini file

        db_session.configure(bind=engine)
        sql_base.metadata.bind = engine

        authn_policy = AuthTktAuthenticationPolicy(
            'sosecret', callback=get_groups, hashalg='sha512'
        )
        authz_policy = ACLAuthorizationPolicy()

        config = Configurator(
            settings=settings,
            # root_factory=RootFactory
            # settings=settings, root_factory=app_name + '.py.utils.Models.RootFactory'
        )
        config.set_authentication_policy(authn_policy)
        config.set_authorization_policy(authz_policy)

        config.include('pyramid_jinja2')

        renderer = app_name + ':templates/view_common.jinja2'

        # ------------------------------------------------------------------
        # forbidden view, which simply redirects to the login
        # ------------------------------------------------------------------
        config.add_forbidden_view(view_manager.view_forbidden)

        # ------------------------------------------------------------------
        # basic view, open to everyone, for login/logout/redirect
        # ------------------------------------------------------------------
        config.add_route('login', '/' + app_prefix + '/login')
        config.add_view(
            view_manager.view_login,
            route_name='login',
            renderer=renderer,
        )

        config.add_route('logout', '/' + app_prefix + '/logout')
        config.add_view(
            view_manager.view_logout,
            route_name='logout',
            renderer=renderer,
        )

        config.add_route('not_found', '/' + app_prefix + '/not_found')
        config.add_view(
            view_manager.view_not_found,
            context=NotFound,
            renderer=renderer,
        )

        config.add_route('/', '/')
        config.add_view(
            view_manager.view_empty,
            route_name='/',
            renderer=renderer,
        )

        config.add_route(app_prefix, '/' + app_prefix)
        config.add_view(
            view_manager.view_empty,
            route_name=app_prefix,
            renderer=renderer,
        )

        # ------------------------------------------------------------------
        # permission to view index page and sockets (set in Models.py for
        # all groups of logged-in users)
        # ------------------------------------------------------------------
        perm = 'permit_all'
        # ------------------------------------------------------------------
        # the index page
        config.add_route('index', '/' + app_prefix + '/' + 'index')
        config.add_view(
            view_manager.view_index,
            route_name='index',
            renderer=renderer,
            permission=perm,
        )

        # # # the uri for sockets
        # config.add_route('ws', '/ws')
        # config.add_view(
        #     # view_manager.view_index,
        #     view_manager.socket_view,
        #     route_name='ws',
        #     permission=perm,
        # )

        # ------------------------------------------------------------------
        # priviliged view (right now, only for pre-defined users in Models.init_user_passes)
        # ------------------------------------------------------------------
        perm = 'permit_a'
        # ------------------------------------------------------------------

        for view_name in base_config.all_widgets:
            config.add_route(view_name, '/' + app_prefix + '/' + view_name)
            config.add_view(
                view_manager.view_common,
                route_name=view_name,
                permission=perm,
                renderer=renderer,
            )

        # ------------------------------------------------------------------
        # add paths the server will be able to access for resources
        # see: http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/assets.html
        # see: http://docs.pylonsproject.org/projects/pyramid_cookbook/en/latest/pylons/static.html
        # ------------------------------------------------------------------
        rel_path = '../../'
        static_views = [
            'js', 'fonts', 'static', 'styles', 'templates', 'bower_components'
        ]
        for static_view in static_views:
            config.add_static_view(
                static_view, rel_path + static_view, cache_max_age=3600
            )

        wsgi_app = config.make_wsgi_app()

    except Exception as e:
        log.info([['c', e]])
        raise e

    return wsgi_app


# ------------------------------------------------------------------
class ExtendedWsgiToAsgi(WsgiToAsgi):
    """Extends the WsgiToAsgi wrapper to include an ASGI consumer protocol router"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.protocol_router = {"http": {}, "websocket": {}}

    async def __call__(self, scope, *args, **kwargs):
        protocol = scope["type"]
        path = scope["path"]
        try:
            consumer = self.protocol_router[protocol][path]
        except KeyError:
            consumer = None
        if consumer is not None:
            await consumer(scope, *args, **kwargs)
        try:
            if scope['type'] == 'http':
                await super().__call__(scope, *args, **kwargs)
        except Exception as e:
            raise e

    def route(self, rule, *args, **kwargs):
        try:
            protocol = kwargs["protocol"]
        except KeyError:
            raise Exception("You must define a protocol type for an ASGI handler")

        def _route(func):
            self.protocol_router[protocol][rule] = func

        return _route




from random import Random
import json
from ctaGuiUtils.py.utils import get_rnd_seed, get_time
rnd_seed = get_rnd_seed()
rnd_gen = Random(rnd_seed)


# ------------------------------------------------------------------
def extend_app_to_asgi(wsgi_app):
    app = ExtendedWsgiToAsgi(wsgi_app)

    class AsyncSocketManager:
        server_name = None

        def __init__(self, *args, **kwargs):
            # super(SocketManager, self).__init__(*args, **kwargs)

            self.sess_id = get_time('msec') + rnd_gen.randint(1000000, (1000000 * 10) -1)
            self.user_id = ''
            self.user_group = ''
            self.user_group_id = ''
            self.sess_name = ''
            self.log_send_packet = False
            self.sess_expire = 10
            self.cleanup_sleep = 60

        def websocket_send(self, data):
            data = json.dumps(data)
            return {"type": "websocket.send", "text": data}

        async def send(self, send, data):
            data['sess_id'] = self.sess_id
            data = json.dumps(data)
            await send(self.websocket_send(data))
            return


    # see: https://asgi.readthedocs.io/en/latest/specs/www.html
    @app.route("/my_ws", protocol="websocket")
    async def hello_websocket(scope, receive, send):
        ss = AsyncSocketManager()
        
        while True:
            message = await receive()
            if message["type"] == "websocket.connect":
                await send({"type": "websocket.accept"})
                log.info([['b', ' - websocket.connect '], ['p', ss.sess_id, message]])

                data = {'xxx':'ssssssssssss', 'sess_id':ss.sess_id}
                data = json.dumps(data)
                await send({"type": "websocket.send", "text": data})


                data = {'qqq': 298798723493287, 'gggg':'dddddddddddddddddddddddddddddd'}
                await ss.send(send, data)
            
            elif message["type"] == "websocket.receive":
                text = message.get("text")
                # print(' - websocket.receive', message)

                # print('qqqqqqqqqqqqqqqqqq',message)
                if text:
                    # text = ['got mes:', text]
                    text = json.dumps(text)
                    await send({"type": "websocket.send", "text": text})
                else:
                    await send({"type": "websocket.send", "bytes": message.get("bytes")})
            
            elif message["type"] == "websocket.disconnect":
                # print('-------------------- websocket.disconnect', message )
                break
            # else:
            #     print('ddddddddddddddd',message["type"])

    # return wsgi_app
    return app






# ------------------------------------------------------------------
try:
    settings = parse_args()

    # the app name (corresponding to the directory name)
    app_name = settings['app_name']
    # southern or northen CTA sites have different telescope configurations
    site_type = settings['site_type']
    # the redis port use for this site
    redis_port = settings['redis_port']
    # define the prefix to all urls (must be non-empy string)
    app_prefix = settings['app_prefix']
    # global setting to allow panel syncronization
    allow_panel_sync = bool(settings['allow_panel_sync'])
    # is this a simulation
    is_simulation = settings['is_simulation']

    # ------------------------------------------------------------------
    # instantiate the general settings class (must come first!)
    # ------------------------------------------------------------------
    base_config = BaseConfig(
        is_simulation=is_simulation,
        site_type=site_type,
        redis_port=redis_port,
        app_prefix=app_prefix,
        allow_panel_sync=allow_panel_sync,
    )

    log = LogParser(
        base_config=base_config,
        title=__name__,
        log_level='INFO',
        log_file='logs/ctaGuiFront_uvicorn.log',
    )
    log.info([['wg', ' - Starting pyramid app - ctaGuiFront ...']])
    log.info([['p', ' - has_acs = '], [('g' if has_acs else 'r'), has_acs]])

    # set the list of telescopes for this particular site
    InstData(base_config=base_config)

    # ------------------------------------------------------------------
    wsgi_app = setup_app()
    app = extend_app_to_asgi(wsgi_app)

except Exception as e:
    log.info([['c', e]])
    raise e










import asyncio
import time

lock = asyncio.Lock()
if 0:
    try:
        loop = asyncio.get_running_loop()
        if not (loop and loop.is_running()):
            raise RuntimeError
    except RuntimeError:
        raise Exception('no running event loop ?!?')


    async def main():

        async def say_after(delay, what):
            await asyncio.sleep(delay)
            # async with lock:
            for _ in range(8):
                await asyncio.sleep(0.5)
                log.info([['b', _, what]])

        async def hello(i):
            print(f"started at {time.strftime('%X')}")

            await say_after(1, ' x ' + str(i))
            # await say_after(4, 'world')

            # print(f"finished at {time.strftime('%X')}")


        for _ in range(3):
            # print('ssssssssssssss', _)  
            tsk = loop.create_task(hello(_))
            # await asyncio.sleep(0.1)

    tsk = loop.create_task(main())
















