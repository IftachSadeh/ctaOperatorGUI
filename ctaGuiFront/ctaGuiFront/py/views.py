from pyramid.httpexceptions import HTTPFound
from pyramid.response import Response
from pyramid.view import view_config, forbidden_view_config
from pyramid.security import remember, forget
from models import DBSession, MyModel

# the socket.io manager
from socketio import socketio_manage

# import the utils module to allow access to utils.appPrefix
import ctaGuiUtils.py.utils as utils

# base-class for all widgets which use sockets
from mySock import mySock


# -----------------------------------------------------------------------------------------------------------
# socketioService
# -----------------------------------------------------------------------------------------------------------
def socketioService(request):
    sockDict = dict()
    sockDict["/"+"index"] = mySock
    sockDict["/"+"viewRefreshAll"] = mySock
    # sockDict["/"+"view100"] = mySock_view100

    for widgetName in utils.allWidgets:
        if not ('/'+widgetName) in sockDict:
            sockDict['/'+widgetName] = mySock

    socketio_manage(request.environ, sockDict, request=request)

    return Response('')


def get_display_userid(request):
    userid = request.authenticated_userid
    return ('' if userid is None else userid)


def viewLogin(request):
    # -----------------------------------------------------------------------------------------------------------
    # login page with authentication - check the DB for the given userId/password
    # -----------------------------------------------------------------------------------------------------------
    widget_name = "login"

    # if already logged in, go to the index
    if request.authenticated_userid is not None:
        return HTTPFound(location=request.route_url("index"))

    # preform the authentication check against the DB
    if 'username' in request.params and 'password' in request.params:
        login = request.params['username']
        password = request.params['password']
        dbLookup = DBSession.query(MyModel).filter(
            MyModel.userId == login).first()

        # check if succesfull login
        if dbLookup is not None:
            if str(dbLookup.userId) == login and str(dbLookup.passwd) == password:
                headers = remember(request, login)

                return HTTPFound(location=request.route_url("index"), headers=headers)

    return dict(
        location=request.route_url(widget_name),
        login=request.authenticated_userid,
        app_prefix=utils.appPrefix,
        ns_type=utils.nsType,
        widget_name=widget_name,
        display_userid=get_display_userid(request),
    )


def viewLogout(request):
    # -----------------------------------------------------------------------------------------------------------
    # logout page with a redirect to the login
    # -----------------------------------------------------------------------------------------------------------
    # forget the current loged-in user
    headers = forget(request)
    # redirect to the login page
    return HTTPFound(location=request.route_url("index"), headers=headers)


@forbidden_view_config()
def viewForbidden(request):
    # -----------------------------------------------------------------------------------------------------------
    # forbidden view redirects to the login
    # -----------------------------------------------------------------------------------------------------------
    return HTTPFound(location=request.route_url("login"))


def viewIndex(request):
    # -----------------------------------------------------------------------------------------------------------
    # index, empty, not-found
    # -----------------------------------------------------------------------------------------------------------
    widget_name = "index"

    return dict(
        ns_type=utils.nsType,
        widget_name=widget_name,
        app_prefix=utils.appPrefix,
        login=request.authenticated_userid,
        came_from=request.route_url(widget_name),
        display_userid=get_display_userid(request),
    )


def viewEmpty(request):
    return HTTPFound(location=request.route_url("index"))


def viewNotFound(request):
    widget_name = "notFound"

    return dict(
        ns_type=utils.nsType,
        widget_name=widget_name,
        app_prefix=utils.appPrefix,
        login=request.authenticated_userid,
        location=request.route_url(widget_name),
        display_userid=get_display_userid(request),
    )


def viewCommon(request):
    # -----------------------------------------------------------------------------------------------------------
    # now for the widgets
    # -----------------------------------------------------------------------------------------------------------
    widget_name = request.matched_route.name

    return dict(
        ns_type=utils.nsType,
        widget_name=widget_name,
        app_prefix=utils.appPrefix,
        login=request.authenticated_userid,
        came_from=request.route_url(widget_name),
        display_userid=get_display_userid(request),
    )
