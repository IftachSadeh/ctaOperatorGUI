# ------------------------------------------------------------------
#!/usr/bin/env python
# ------------------------------------------------------------------
# no need to patch, as the gevent worker does that already...
# from gevent import monkey
# monkey.patch_all()
# ------------------------------------------------------------------

# logging interface - important to init the logger vefore importing any ACS -
from ctaGuiUtils.py.utils import myLog
log = myLog(title=__name__)

import pyramid
from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.exceptions import NotFound
from sqlalchemy import engine_from_config, create_engine

# the models.py file contains the users/groups/passwords
from ctaGuiFront.py.models import DBSession, Base, groupFinder

# import the utils module to allow access to some global variables
import ctaGuiUtils.py.utils as utils
from ctaGuiUtils.py.arrayData import arrayData

# the definition of all sockets (including an entry for each view)
from ctaGuiFront.py.views import socketioService

# basic views for login, index, redirection etc.
from ctaGuiFront.py.views import viewLogin, viewLogout, viewIndex, viewNotFound, viewEmpty, viewForbidden
# the commmon view used by most (maybe all) widgets
from ctaGuiFront.py.views import viewCommon

# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def main(global_config, **settings):
  log.info([['wg'," - Starting pyramid app - ctaGuiFront ..."]])
  log.info([['p'," - hasACS = "],[('g' if utils.hasACS else 'r'),utils.hasACS]])

  # the app name (corresponding to the directory name)
  appName = settings['app_name']

  # southern or northen CTA sites have different telescope configurations
  utils.nsType = 'S'
  utils.nsType = 'N'
  # utils.nsType = settings['ns_type']

  # define the prefix to all urls (must be non-empy string)
  utils.appPrefix = settings['app_prefix']

  # global setting to allow panel syncronization
  utils.allowPanelSync = bool(settings['allow_panel_sync'])

  # set the list of telescopes for this particular site
  myArrayData = arrayData(nsType=utils.nsType)
  # utils.telIds = myArrayData.telIds

  # database and authentication
  engine = engine_from_config(settings, 'sqlalchemy.')
  # engine = create_engine('sqlite:///ctaGuiFront.db') # if not set in the .ini file

  DBSession.configure(bind=engine)
  Base.metadata.bind = engine

  authn_policy = AuthTktAuthenticationPolicy('sosecret', callback=groupFinder, hashalg='sha512')
  authz_policy = ACLAuthorizationPolicy()

  config = Configurator(settings=settings,root_factory=appName+'.py.models.RootFactory')

  config.set_authentication_policy(authn_policy)
  config.set_authorization_policy(authz_policy)

  config.include('pyramid_jinja2')
  renderer = appName+":templates/view_common.jinja2"

  # ------------------------------------------------------------------
  # forbidden view, which simply redirects to the login
  # ------------------------------------------------------------------
  config.add_forbidden_view(viewForbidden)

  # ------------------------------------------------------------------
  # basic view, open to everyone, for login/logout/redirect
  # ------------------------------------------------------------------
  config.add_route('login','/'+utils.appPrefix+'/login')
  config.add_view(viewLogin, route_name='login', renderer=renderer)

  config.add_route('logout','/'+utils.appPrefix+'/logout')
  config.add_view(viewLogout, route_name='logout', renderer=renderer)

  config.add_route('notFound','/'+utils.appPrefix+'/notFound')
  config.add_view(viewNotFound, context=NotFound, renderer=renderer)

  config.add_route('/','/')
  config.add_view(viewEmpty, route_name="/", renderer=renderer)

  config.add_route(utils.appPrefix,'/'+utils.appPrefix)
  config.add_view(viewEmpty, route_name=utils.appPrefix, renderer=renderer)

  # ------------------------------------------------------------------
  # permission to view index page and sockets (set in models.py for all groups of logged-in users)
  # ------------------------------------------------------------------
  perm = "permit_all"
  # ------------------------------------------------------------------
  # the index page
  config.add_route("index",'/'+utils.appPrefix+'/'+"index")
  config.add_view(viewIndex, route_name='index', renderer=renderer, permission=perm)

  # the uri for sockets
  config.add_route('socket_io','socket.io/*remaining')
  config.add_view(socketioService, route_name='socket_io', permission=perm)

  # ------------------------------------------------------------------
  # priviliged view (right now, only for pre-defined users in models.initUsers)
  # ------------------------------------------------------------------
  perm = "permit_a"
  # ------------------------------------------------------------------
  # list here all views, which use the shared view function
  # these would eg be mapped to: [ http://localhost:8090/cta/view200 ]
  utils.allWidgets = [
    "view102", "view000", "viewRefreshAll",
    "view200", "view201", "view202", "view203", "view204", "view205", "view206", "view207", "view2051"
  ]

  for viewName in utils.allWidgets:
      config.add_route(viewName,'/'+utils.appPrefix+'/'+viewName)
      config.add_view(
        viewCommon, route_name=viewName, permission=perm, renderer=renderer
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
  config.add_static_view('bower_components', 'bower_components', cache_max_age=cache_max_age)

  app = config.make_wsgi_app()

  return app
