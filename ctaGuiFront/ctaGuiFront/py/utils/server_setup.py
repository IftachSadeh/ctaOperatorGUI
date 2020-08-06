from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.exceptions import NotFound
from ctaGuiFront.py.utils.security import groupfinder, RootFactory

from ctaGuiUtils.py.BaseConfig import BaseConfig
from ctaGuiUtils.py.InstData import InstData

from ctaGuiUtils.py.utils import has_acs

from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiFront.py.utils.ViewManager import ViewManager

from ctaGuiFront.py.utils.server_args import parse_args
from ctaGuiFront.py.utils.AsyncSocketManager import AsyncSocketManager, extend_app_to_asgi


# ------------------------------------------------------------------
def setup_app():
    try:
        view_manager = ViewManager(base_config=base_config)

        config = Configurator(
            settings=settings,
            root_factory=RootFactory
        )

        authn_policy = AuthTktAuthenticationPolicy(
            'sosecret', callback=groupfinder, hashalg='sha512',
        )
        authz_policy = ACLAuthorizationPolicy()
        config.set_authentication_policy(authn_policy)
        config.set_authorization_policy(authz_policy)

        config.include('pyramid_mako')
        renderer = app_name + ':templates/view_common.mak'

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
try:
    settings = parse_args()

    # the app name (corresponding to the directory name)
    app_name = settings['app_name']
    # southern or northen CTA sites have different telescope configurations
    site_type = settings['site_type']
    # the address for the site
    app_host = settings['app_host']
    # the port for the site
    app_port = settings['app_port']
    # the redis port use for this site
    redis_port = settings['redis_port']
    # define the prefix to all urls (must be non-empy string)
    app_prefix = settings['app_prefix']
    # global setting to allow panel syncronization
    allow_panel_sync = bool(settings['allow_panel_sync'])
    # is this a simulation
    is_simulation = settings['is_simulation']
    # development mode
    is_HMI_dev = settings['is_HMI_dev']
    # do we flush redis on startup
    do_flush_redis = settings['do_flush_redis']

    websocket_postfix = '/websockets'
    websocket_route = {
        'server': '/' + app_prefix + websocket_postfix,
        'client': 'ws://' + app_host + ':' + str(app_port) + '/' + app_prefix + websocket_postfix,
    }

    # ------------------------------------------------------------------
    # instantiate the general settings class (must come first!)
    # ------------------------------------------------------------------
    base_config = BaseConfig(
        site_type=site_type,
        redis_port=redis_port,
        app_port=app_port,
        app_prefix=app_prefix,
        app_host=app_host,
        websocket_route=websocket_route,
        allow_panel_sync=allow_panel_sync,
        is_HMI_dev=is_HMI_dev,
        is_simulation=is_simulation,
    )

    log = LogParser(
        base_config=base_config,
        title=__name__,
        log_level='INFO',
        log_file='logs/ctaGuiFront_uvicorn.log',
    )
    log.info([['wg', ' - Starting pyramid app - ctaGuiFront ...']])
    log.info([['c', ' - has_acs = '], [('g' if has_acs else 'r'), has_acs]])

    settings_log = [['g', ' - server settings:\n']]
    for k,v in settings.items():
        settings_log += [['b', str(k)], [': ']]
        settings_log += [['c', str(v)], [',  ']]
    log.info(settings_log)

    # do_flush_redis = True
    if do_flush_redis:
        from ctaGuiUtils.py.RedisManager import RedisManager
        log.warn([['wr', ' ---- flusing redis ... ----']])
        _redis = RedisManager(name='_init_', port=redis_port, log=log)
        _redis.redis.flushall()

    # set the list of telescopes for this particular site
    InstData(base_config=base_config)

    # 
    setattr(AsyncSocketManager, 'base_config', base_config)


    # ------------------------------------------------------------------
    wsgi_app = setup_app()
    app = extend_app_to_asgi(wsgi_app, websocket_route)

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
















