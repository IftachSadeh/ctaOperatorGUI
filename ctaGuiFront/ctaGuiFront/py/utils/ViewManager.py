from pyramid.httpexceptions import HTTPFound
from pyramid.response import Response
from pyramid.view import forbidden_view_config
from pyramid.security import remember, forget

# the socket.io manager
from socketio import socketio_manage

# import the utils module to allow access to self.app_prefix
from ctaGuiUtils.py.LogParser import LogParser
# base-class for all widgets which use sockets
from ctaGuiFront.py.utils.SocketManager import SocketManager
# 
from ctaGuiFront.py.utils.security import USERS, check_password





# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
class ViewManager():
    # ---------------------------------------------------------------------------
    #
    # ---------------------------------------------------------------------------
    def __init__(self, base_config, *args, **kwargs):
        self.log = LogParser(base_config=base_config, title=__name__)
        self.log.info([['y', " - ViewManager - "], ['g', base_config.site_type]])

        self.base_config = base_config
        self.app_prefix = base_config.app_prefix
        self.site_type = base_config.site_type

        # attach the BaseConfig instance to the socket
        setattr(SocketManager, 'base_config', self.base_config)

        return

    # ------------------------------------------------------------------
    # socketio_service
    # ------------------------------------------------------------------
    def socket_view(self, request):
        print('--+--'*30)
        
        socks = dict()
        socks["/" + "index"] = SocketManager
        socks["/" + "view_refresh_all"] = SocketManager
        # socks["/"+"view100"] = socket_manager_view100

        for widget_name in self.base_config.all_widgets:
            if not ('/' + widget_name) in socks:
                socks['/' + widget_name] = SocketManager

        print('-=-'*30)
        print(list(request.environ.keys()))
        print('--+--'*30)
        # print(request.environ)
        # print(request.environ['socketio'])
        # socketio_manage(request.environ, socks, request=request)

        print('----'*30)

        return Response('')

    # ------------------------------------------------------------------
    #
    # ------------------------------------------------------------------
    def get_display_userid(self, request):
        userid = request.authenticated_userid
        return ('' if userid is None else userid)

    # ------------------------------------------------------------------
    # login page with authentication - check the DB for
    # the given user_id/password
    # ------------------------------------------------------------------
    def view_login(self, request):
        view_name = "login"

        # forget(request)

        # if already logged in, go to the index
        if request.authenticated_userid is not None:
            return HTTPFound(location=request.route_url("index"))

        # preform the authentication check against the DB
        if 'username' in request.params and 'password' in request.params:
            login = request.params['username']
            password = request.params['password']
            hashed_pw = USERS.get(login)

            if hashed_pw and check_password(password, hashed_pw):
                headers = remember(request, login)
                return HTTPFound(location=request.route_url("index"), headers=headers)

        return dict(
            location=request.route_url(view_name),
            login=request.authenticated_userid,
            app_prefix=self.app_prefix,
            ns_type=self.site_type,
            widget_name=view_name,
            display_userid=self.get_display_userid(request),
        )

    # ------------------------------------------------------------------
    # logout page with a redirect to the login
    # ------------------------------------------------------------------
    def view_logout(self, request):
        # forget the current loged-in user
        headers = forget(request)
        # redirect to the login page
        return HTTPFound(location=request.route_url("index"), headers=headers)

    # ------------------------------------------------------------------
    # forbidden view redirects to the login
    # ------------------------------------------------------------------
    @forbidden_view_config()
    def view_forbidden(self, request):
        return HTTPFound(location=request.route_url("login"))

    # ------------------------------------------------------------------
    # index, empty, not-found
    # ------------------------------------------------------------------
    def view_index(self, request):
        view_name = "index"

        return dict(
            ns_type=self.site_type,
            widget_name=view_name,
            app_prefix=self.app_prefix,
            login=request.authenticated_userid,
            came_from=request.route_url(view_name),
            display_userid=self.get_display_userid(request),
        )

    # ------------------------------------------------------------------
    # redirects
    # ------------------------------------------------------------------
    def view_empty(self, request):
        return HTTPFound(location=request.route_url("index"))

    def view_not_found(self, request):
        view_name = "not_found"

        return dict(
            ns_type=self.site_type,
            widget_name=view_name,
            app_prefix=self.app_prefix,
            login=request.authenticated_userid,
            location=request.route_url(view_name),
            display_userid=self.get_display_userid(request),
        )

    # ------------------------------------------------------------------
    # now for the widgets
    # ------------------------------------------------------------------
    def view_common(self, request):
        view_name = request.matched_route.name

        return dict(
            ns_type=self.site_type,
            widget_name=view_name,
            app_prefix=self.app_prefix,
            login=request.authenticated_userid,
            came_from=request.route_url(view_name),
            display_userid=self.get_display_userid(request),
        )
