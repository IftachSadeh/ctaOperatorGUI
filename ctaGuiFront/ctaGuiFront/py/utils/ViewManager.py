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


# ------------------------------------------------------------------
class ViewManager():
    # ------------------------------------------------------------------
    def __init__(self, base_config, *args, **kwargs):
        self.log = LogParser(base_config=base_config, title=__name__)
        self.log.info([['y', " - ViewManager - "], ['g', base_config.site_type]])

        self.base_config = base_config
        self.app_prefix = base_config.app_prefix
        self.site_type = base_config.site_type
        self.websocket_route = base_config.websocket_route

        # attach the BaseConfig instance to the socket
        setattr(SocketManager, 'base_config', self.base_config)

        return

    # ------------------------------------------------------------------
    # socketio_service
    # ------------------------------------------------------------------
    def socket_view(self, request):
        print('--+--' * 30)

        socks = dict()
        socks["/" + "index"] = SocketManager
        socks["/" + "view_refresh_all"] = SocketManager
        # socks["/"+"view100"] = socket_manager_view100

        for widget_name in self.base_config.all_widgets:
            if not ('/' + widget_name) in socks:
                socks['/' + widget_name] = SocketManager

        print('-=-' * 30)
        print(list(request.environ.keys()))
        print('--+--' * 30)
        # print(request.environ)
        # print(request.environ['socketio'])
        # socketio_manage(request.environ, socks, request=request)

        print('----' * 30)

        return Response('')

    # ------------------------------------------------------------------
    def get_display_user_id(self, request):
        user_id = request.authenticated_userid
        return ('' if user_id is None else user_id)

    # ------------------------------------------------------------------
    def get_display_user_group(self, request):
        user_group = ''
        for princ in request.effective_principals:
            if princ.startswith('group:'):
                user_group = princ[len('group:'):]
        return str(user_group)

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
        if 'user_name' in request.params and 'password' in request.params:
            user_name = request.params['user_name']
            password = request.params['password']
            hashed_pw = USERS.get(user_name)

            if hashed_pw and check_password(password, hashed_pw):
                headers = remember(request, user_name)
                return HTTPFound(location=request.route_url("index"), headers=headers)

        return dict(
            location=request.route_url(view_name),
            login=request.authenticated_userid,
            app_prefix=self.app_prefix,
            ns_type=self.site_type,
            websocket_route=self.websocket_route['client'],
            widget_name=view_name,
            display_user_id=self.get_display_user_id(request),
            display_user_group=self.get_display_user_group(request),
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
            websocket_route=self.websocket_route['client'],
            widget_name=view_name,
            app_prefix=self.app_prefix,
            login=request.authenticated_userid,
            came_from=request.route_url(view_name),
            display_user_id=self.get_display_user_id(request),
            display_user_group=self.get_display_user_group(request),
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
            websocket_route=self.websocket_route['client'],
            widget_name=view_name,
            app_prefix=self.app_prefix,
            login=request.authenticated_userid,
            location=request.route_url(view_name),
            display_user_id=self.get_display_user_id(request),
            display_user_group=self.get_display_user_group(request),
        )

    # ------------------------------------------------------------------
    # now for the widgets
    # ------------------------------------------------------------------
    def view_common(self, request):
        view_name = request.matched_route.name

        return dict(
            ns_type=self.site_type,
            websocket_route=self.websocket_route['client'],
            widget_name=view_name,
            app_prefix=self.app_prefix,
            login=request.authenticated_userid,
            came_from=request.route_url(view_name),
            display_user_id=self.get_display_user_id(request),
            display_user_group=self.get_display_user_group(request),
        )
