# ------------------------------------------------------------------
#!/usr/bin/env python
# ------------------------------------------------------------------
# no need to patch, as the gevent worker does that already...
# from gevent import monkey
# monkey.patch_all()
# ------------------------------------------------------------------

# logging interface - important to init the logger vefore importing any ACS -
from ctaGuiUtils.py.utils import my_log

from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.exceptions import NotFound
from sqlalchemy import engine_from_config

# the Models.py file contains the users/groups/passwords
from ctaGuiFront.py.utils.Models import DBSession, Base, get_groups

# import the utils module to allow access to some global variables
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.InstData import InstData

# the definition of all sockets (including an entry for each view)
from ctaGuiFront.py.utils.views import socketio_service

# basic views for login, index, redirection etc.
from ctaGuiFront.py.utils.views import view_login, view_logout, view_index
from ctaGuiFront.py.utils.views import view_not_found, view_empty, view_forbidden
# the commmon view used by most (maybe all) widgets
from ctaGuiFront.py.utils.views import view_common

log = my_log(title=__name__)


def main(global_config, **settings):
    log.info([['wg', ' - Starting pyramid app - ctaGuiFront ...']])
    log.info([['p', ' - has_acs = '], [('g' if utils.has_acs else 'r'), utils.has_acs]])

    # the app name (corresponding to the directory name)
    app_name = settings['app_name']

    # southern or northen CTA sites have different telescope configurations
    utils.site_type = settings['site_type']

    # the redis port use for this site
    utils.redis_port = settings['redis_port']

    # define the prefix to all urls (must be non-empy string)
    utils.app_prefix = settings['app_prefix']

    # global setting to allow panel syncronization
    utils.allow_panel_sync = bool(settings['allow_panel_sync'])

    # set the list of telescopes for this particular site
    InstData(site_type=utils.site_type)

    # database and authentication
    engine = engine_from_config(settings, 'sqlalchemy.')
    # engine = create_engine('sqlite:///ctaGuiFront.db') # if not set in the .ini file

    DBSession.configure(bind=engine)
    Base.metadata.bind = engine

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
    config.add_forbidden_view(view_forbidden)

    # ------------------------------------------------------------------
    # basic view, open to everyone, for login/logout/redirect
    # ------------------------------------------------------------------
    config.add_route('login', '/' + utils.app_prefix + '/login')
    config.add_view(view_login, route_name='login', renderer=renderer)

    config.add_route('logout', '/' + utils.app_prefix + '/logout')
    config.add_view(view_logout, route_name='logout', renderer=renderer)

    config.add_route('not_found', '/' + utils.app_prefix + '/not_found')
    config.add_view(view_not_found, context=NotFound, renderer=renderer)

    config.add_route('/', '/')
    config.add_view(view_empty, route_name='/', renderer=renderer)

    config.add_route(utils.app_prefix, '/' + utils.app_prefix)
    config.add_view(view_empty, route_name=utils.app_prefix, renderer=renderer)

    # ------------------------------------------------------------------
    # permission to view index page and sockets (set in Models.py for
    # all groups of logged-in users)
    # ------------------------------------------------------------------
    perm = 'permit_all'
    # ------------------------------------------------------------------
    # the index page
    config.add_route('index', '/' + utils.app_prefix + '/' + 'index')
    config.add_view(view_index, route_name='index', renderer=renderer, permission=perm)

    # the uri for sockets
    config.add_route('socket_io', 'socket.io/*remaining')
    config.add_view(socketio_service, route_name='socket_io', permission=perm)

    # ------------------------------------------------------------------
    # priviliged view (right now, only for pre-defined users in Models.initUsers)
    # ------------------------------------------------------------------
    perm = 'permit_a'
    # ------------------------------------------------------------------
    # list here all views, which use the shared view function
    # these would eg be mapped to: [ http://localhost:8090/cta/view200 ]
    utils.all_widgets = [
        'view102',
        'view000',
        'view_refresh_all',
        'view200',
        'view201',
        'view202',
        'view203',
        'view204',
        'view205',
        'view206',
        'view207',
    ]

    for view_name in utils.all_widgets:
        config.add_route(view_name, '/' + utils.app_prefix + '/' + view_name)
        config.add_view(
            view_common, route_name=view_name, permission=perm, renderer=renderer
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

    app = config.make_wsgi_app()

    return app
