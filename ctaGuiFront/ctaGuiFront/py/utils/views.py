from pyramid.httpexceptions import HTTPFound
from pyramid.response import Response
from pyramid.view import view_config, forbidden_view_config
from pyramid.security import remember, forget
from Models import DBSession, MyModel

# the socket.io manager
from socketio import socketio_manage

# import the utils module to allow access to utils.app_prefix
import ctaGuiUtils.py.utils as utils

# base-class for all widgets which use sockets
from SockManager import SockManager


# ------------------------------------------------------------------
# socketio_service
# ------------------------------------------------------------------
def socketio_service(request):
    socks = dict()
    socks["/"+"index"] = SockManager
    socks["/"+"view_refresh_all"] = SockManager
    # socks["/"+"view100"] = SockManager_view100

    for widget_name in utils.all_widgets:
        if not ('/'+widget_name) in socks:
            socks['/'+widget_name] = SockManager

    socketio_manage(request.environ, socks, request=request)

    return Response('')


def get_display_userid(request):
    userid = request.authenticated_userid
    return ('' if userid is None else userid)


def view_login(request):
    # ------------------------------------------------------------------
    # login page with authentication - check the DB for the given user_id/password
    # ------------------------------------------------------------------
    view_name = "login"

    # if already logged in, go to the index
    if request.authenticated_userid is not None:
        return HTTPFound(location=request.route_url("index"))

    # preform the authentication check against the DB
    if 'username' in request.params and 'password' in request.params:
        login = request.params['username']
        password = request.params['password']
        db_lookup = DBSession.query(MyModel).filter(
            MyModel.userId == login).first()

        # check if succesfull login
        if db_lookup is not None:
            if str(db_lookup.userId) == login and str(db_lookup.passwd) == password:
                headers = remember(request, login)

                return HTTPFound(location=request.route_url("index"), headers=headers)

    return dict(
        location=request.route_url(view_name),
        login=request.authenticated_userid,
        app_prefix=utils.app_prefix,
        ns_type=utils.site_type,
        widget_name=view_name,
        display_userid=get_display_userid(request),
    )


def view_logout(request):
    # ------------------------------------------------------------------
    # logout page with a redirect to the login
    # ------------------------------------------------------------------
    # forget the current loged-in user
    headers = forget(request)
    # redirect to the login page
    return HTTPFound(location=request.route_url("index"), headers=headers)


@forbidden_view_config()
def view_forbidden(request):
    # ------------------------------------------------------------------
    # forbidden view redirects to the login
    # ------------------------------------------------------------------
    return HTTPFound(location=request.route_url("login"))


def view_index(request):
    # ------------------------------------------------------------------
    # index, empty, not-found
    # ------------------------------------------------------------------
    view_name = "index"

    return dict(
        ns_type=utils.site_type,
        widget_name=view_name,
        app_prefix=utils.app_prefix,
        login=request.authenticated_userid,
        came_from=request.route_url(view_name),
        display_userid=get_display_userid(request),
    )


def view_empty(request):
    return HTTPFound(location=request.route_url("index"))


def view_not_found(request):
    view_name = "not_found"

    return dict(
        ns_type=utils.site_type,
        widget_name=view_name,
        app_prefix=utils.app_prefix,
        login=request.authenticated_userid,
        location=request.route_url(view_name),
        display_userid=get_display_userid(request),
    )


def view_common(request):
    # ------------------------------------------------------------------
    # now for the widgets
    # ------------------------------------------------------------------
    view_name = request.matched_route.name

    return dict(
        ns_type=utils.site_type,
        widget_name=view_name,
        app_prefix=utils.app_prefix,
        login=request.authenticated_userid,
        came_from=request.route_url(view_name),
        display_userid=get_display_userid(request),
    )
