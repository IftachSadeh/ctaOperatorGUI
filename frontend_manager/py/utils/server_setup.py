from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.exceptions import NotFound
from frontend_manager.py.utils.security import groupfinder, RootFactory

from shared.BaseConfig import BaseConfig
from shared.InstData import InstData

from shared.utils import has_acs

from shared.LogParser import LogParser
from frontend_manager.py.utils.ViewManager import ViewManager

from shared.server_args import parse_args
from frontend_manager.py.utils.ConnectionManager import extend_app_to_asgi
from frontend_manager.py.utils.ConnectionManager import WebsocketManager


# ------------------------------------------------------------------
def setup_app():
    try:
        view_manager = ViewManager(base_config=base_config)

        config = Configurator(settings=settings, root_factory=RootFactory)

        authn_policy = AuthTktAuthenticationPolicy(
            'sosecret',
            callback=groupfinder,
            hashalg='sha512',
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

        for view_name in base_config.widget_info:
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
        static_views = ['js', 'fonts', 'static', 'styles', 'templates']
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
    app_name = 'frontend_manager'
    settings = parse_args(app_name=app_name)

    # the app name (corresponding to the directory name)
    app_name = settings['app_name']
    # southern or northen CTA sites have different telescope configurations
    site_type = settings['site_type']
    # the address for the site
    app_host = settings['app_host']
    # local log file location
    log_file = settings['log_file']
    # logging level
    log_level = settings['log_level']
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
    debug_opts = settings['debug_opts']
    # do we flush redis on startup
    do_flush_redis = settings['do_flush_redis']
    # all allowed view names
    widget_info = settings['widget_info']
    # all allowed widget types (class names)
    allowed_widget_types = settings['allowed_widget_types']

    websocket_postfix = '/websockets'
    websocket_route = {
        'server':
        '/' + app_prefix + websocket_postfix,
        'client':
        'ws://' + app_host + ':' + str(app_port) + '/' + app_prefix + websocket_postfix,
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
        log_level=log_level,
        websocket_route=websocket_route,
        allow_panel_sync=allow_panel_sync,
        debug_opts=debug_opts,
        is_simulation=is_simulation,
        widget_info=widget_info,
        allowed_widget_types=allowed_widget_types,
    )

    log = LogParser(
        base_config=base_config,
        title=__name__,
        log_level=log_level,
        log_file=log_file,
    )
    log.info([['wg', ' - Starting pyramid app -', app_name, '...']])
    log.info([['c', ' - has_acs = '], [('g' if has_acs else 'r'), has_acs]])

    settings_log = [['g', ' - server settings:\n']]
    for k, v in settings.items():
        settings_log += [['b', str(k)], [': ']]
        settings_log += [['c', str(v)], [',  ']]
    log.info(settings_log)

    # # do_flush_redis = True
    # if do_flush_redis:
    #     from shared.RedisManager import RedisManager
    #     log.warn([['wr', ' ---- flusing redis ... ----']])
    #     _redis = RedisManager(name='_init_', base_config=base_config, log=log)
    #     _redis.redis.flushall()

    # set the list of telescopes for this particular site and attach it to base_config
    InstData(base_config=base_config)

    #
    setattr(WebsocketManager, 'base_config', base_config)

    # ------------------------------------------------------------------
    wsgi_app = setup_app()
    app = extend_app_to_asgi(wsgi_app, websocket_route)

except Exception as e:
    log.info([['c', e]])
    raise e
