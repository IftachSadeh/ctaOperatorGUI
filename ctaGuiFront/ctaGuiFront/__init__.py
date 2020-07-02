# ------------------------------------------------------------------
#!/usr/bin/env python
# ------------------------------------------------------------------
# no need to patch, as the gevent worker does that already...
# from gevent import monkey
# monkey.patch_all()
# ------------------------------------------------------------------
from asgiref.wsgi import WsgiToAsgi

from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.exceptions import NotFound
from sqlalchemy import engine_from_config

# import the utils module to allow access to some global variables
from ctaGuiUtils.py.BaseConfig import BaseConfig
from ctaGuiUtils.py.InstData import InstData

import ctaGuiUtils.py.utils as utils
# logging interface - important to init the logger vefore importing any ACS ?
from ctaGuiUtils.py.LogParser import LogParser
from ctaGuiFront.py.utils.ViewManager import ViewManager
from ctaGuiFront.py.utils.Models import db_session, sql_base, get_groups



# 


settings = {'app_name': 'ctaGuiFront', 'allow_panel_sync': '1', 'pyramid.reload_templates': 'true', 'is_simulation': '1', 'app_prefix': 'cta', 'redis_port': '6379', 'sqlalchemy.url': 'sqlite://///Users/sadeh/test/ctaOperatorGUI/ctaGuiFront/ctaGuiFront.db', 'site_type': 'N'}



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

log = LogParser(base_config=base_config, title=__name__)
log.info([['wg', ' - Starting pyramid app - ctaGuiFront ...']])
log.info([['p', ' - has_acs = '], [('g' if utils.has_acs else 'r'), utils.has_acs]])

# set the list of telescopes for this particular site
InstData(base_config=base_config)

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
    settings=settings, root_factory=app_name + '.py.utils.Models.RootFactory'
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
cache_max_age = 3600
config.add_static_view('js', 'js', cache_max_age=cache_max_age)
config.add_static_view('fonts', 'fonts', cache_max_age=cache_max_age)
config.add_static_view('static', 'static', cache_max_age=cache_max_age)
config.add_static_view('styles', 'styles', cache_max_age=cache_max_age)
config.add_static_view('templates', 'templates', cache_max_age=cache_max_age)
config.add_static_view(
    'bower_components', 'bower_components', cache_max_age=cache_max_age
)

wsgi_app = config.make_wsgi_app()



class ExtendedWsgiToAsgi(WsgiToAsgi):

    """Extends the WsgiToAsgi wrapper to include an ASGI consumer protocol router"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.protocol_router = {"http": {}, "websocket": {}}

    def __call__(self, scope, **kwargs):
        protocol = scope["type"]
        path = scope["path"]
        try:
            consumer = self.protocol_router[protocol][path]
        except KeyError:
            consumer = None
        if consumer is not None:
            return consumer(scope)
        return super().__call__(scope, **kwargs)

    def route(self, rule, *args, **kwargs):
        try:
            protocol = kwargs["protocol"]
        except KeyError:
            raise Exception("You must define a protocol type for an ASGI handler")

        def _route(func):
            self.protocol_router[protocol][rule] = func

        return _route

# app = WsgiToAsgi(wsgi_app)
app = ExtendedWsgiToAsgi(wsgi_app)


# Define ASGI consumers
@app.route("/ws", protocol="websocket")
def hello_websocket(scope):
    async def asgi_instance(receive, send):
        while True:
            message = await receive()
            if message["type"] == "websocket.connect":
                await send({"type": "websocket.accept"})
            if message["type"] == "websocket.receive":
                text = message.get("text")
                print('--------------------websocket.receive', message )
                if text:
                    await send({"type": "websocket.send", "text": text})
                else:
                    await send({"type": "websocket.send", "bytes": message.get("bytes")})
            if message["type"] == "websocket.disconnect":
                print('--------------------websocket.disconnect', message )
                break

    return asgi_instance




# def main():



#     # # ------------------------------------------------------------------
#     # # forbidden view, which simply redirects to the login
#     # # ------------------------------------------------------------------
#     # config.add_forbidden_view(view_manager.view_forbidden)

#     # # ------------------------------------------------------------------
#     # # basic view, open to everyone, for login/logout/redirect
#     # # ------------------------------------------------------------------
#     # config.add_route('login', '/' + app_prefix + '/login')
#     # config.add_view(
#     #     view_manager.view_login,
#     #     route_name='login',
#     #     renderer=renderer,
#     # )

#     # config.add_route('logout', '/' + app_prefix + '/logout')
#     # config.add_view(
#     #     view_manager.view_logout,
#     #     route_name='logout',
#     #     renderer=renderer,
#     # )

#     # config.add_route('not_found', '/' + app_prefix + '/not_found')
#     # config.add_view(
#     #     view_manager.view_not_found,
#     #     context=NotFound,
#     #     renderer=renderer,
#     # )

#     # config.add_route('/', '/')
#     # config.add_view(
#     #     view_manager.view_empty,
#     #     route_name='/',
#     #     renderer=renderer,
#     # )

#     # config.add_route(app_prefix, '/' + app_prefix)
#     # config.add_view(
#     #     view_manager.view_empty,
#     #     route_name=app_prefix,
#     #     renderer=renderer,
#     # )

#     # # ------------------------------------------------------------------
#     # # permission to view index page and sockets (set in Models.py for
#     # # all groups of logged-in users)
#     # # ------------------------------------------------------------------
#     # perm = 'permit_all'
#     # # ------------------------------------------------------------------
#     # # the index page
#     # config.add_route('index', '/' + app_prefix + '/' + 'index')
#     # config.add_view(
#     #     view_manager.view_index,
#     #     route_name='index',
#     #     renderer=renderer,
#     #     permission=perm,
#     # )

#     # the uri for sockets
#     config.add_route('socket_io', 'socket.io/*remaining')
#     config.add_view(
#         view_manager.socket_view,
#         route_name='socket_io',
#         permission=perm,
#     )

#     # # ------------------------------------------------------------------
#     # # priviliged view (right now, only for pre-defined users in Models.init_user_passes)
#     # # ------------------------------------------------------------------
#     # perm = 'permit_a'
#     # # ------------------------------------------------------------------

#     # for view_name in base_config.all_widgets:
#     #     config.add_route(view_name, '/' + app_prefix + '/' + view_name)
#     #     config.add_view(
#     #         view_manager.view_common,
#     #         route_name=view_name,
#     #         permission=perm,
#     #         renderer=renderer,
#     #     )

#     # # ------------------------------------------------------------------
#     # # add paths the server will be able to access for resources
#     # # see: http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/assets.html
#     # # see: http://docs.pylonsproject.org/projects/pyramid_cookbook/en/latest/pylons/static.html
#     # # ------------------------------------------------------------------
#     # cache_max_age = 3600
#     # config.add_static_view('js', 'js', cache_max_age=cache_max_age)
#     # config.add_static_view('fonts', 'fonts', cache_max_age=cache_max_age)
#     # config.add_static_view('static', 'static', cache_max_age=cache_max_age)
#     # config.add_static_view('styles', 'styles', cache_max_age=cache_max_age)
#     # config.add_static_view('templates', 'templates', cache_max_age=cache_max_age)
#     # config.add_static_view(
#     #     'bower_components', 'bower_components', cache_max_age=cache_max_age
#     # )

#     # wsgi_app = config.make_wsgi_app()
#     # app = ExtendedWsgiToAsgi(wsgi_app)
#     # # app = WsgiToAsgi(wsgi_app)

#     return app
