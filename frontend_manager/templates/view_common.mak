
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">

    <meta http-equiv="Expires" content="-1">

    <!-- set a global variable (must come before anything else) -->
    <script>
        window.APP_PREFIX = '${app_prefix}'
        window.SITE_TYPE = '${ns_type}'
        window.WEBSOCKET_ROUTE = '${websocket_route}'
        window.WIDGET_NAME = '${widget_name}'
        window.DISPLAY_USER_ID = '${display_user_id}'
        window.DISPLAY_USER_GROUP = '${display_user_group}'
    </script>

    <meta charset="UTF-8" />
    <title>CTA</title>

    <meta name="description" content="" />
    <meta name="keywords" content="" />
    <meta name="author" content="" />
    <!-- <link rel="icon" type="image/x-icon" href="/static/site_icon.png"/> -->
    <link rel="icon" type="image/x-icon" href="/static/icon-batman.png"/>

    <script type="text/javascript" src="/static/d3/d3.js"></script>
    <script type="text/javascript" src="/static/d3_hexbin/d3-hexbin.v0.2.min.js"></script>
    <script type="text/javascript" src="/static/textures/dist/textures.js"></script>
    <script type="text/javascript" src="/static/jquery/dist/jquery.min.js"></script>
    <link rel="stylesheet" type="text/css" href="/styles/fonts.css"/>
    <link rel="stylesheet" type="text/css" href="/styles/general_style.css"/>
    <link href="/static/fontawesome-free-5.12.0-web/css/all.css" rel="stylesheet">

  </head>

  <!-- ========================================================================= -->
  <body>
    <div id="top_padding_div"></div>

    <div id="title_div" class="menu_header site_header"></div>
    
    <div class="menu_header" style="opacity: 0; padding-left: 24px; padding-bottom: 5px; margin-top: -40px; font-size: 15px;" id="debug_text_div">${display_user_id}</div>

    <div id="base_app_div"></div>

    <div id="general_ops_div"></div>

    <div id="side_menu"></div>
    <div id="topMenu" class="horizontal_ele grid_ele_dark" style="width: 100%; display: flex; align-items: center; position: fixed; top: 0; opacity: 1;">
      <div id="top_menu_inner" class="horizontal_ele" style="width: 100%; margin-top: 12px; margin-bottom: 12px; ">
        <div style="margin-left: 2%;"></div>

        <div id="top_menu_left"></div>

        <div class="flex_ele"></div>

        <div class="menu_header" id="user_name_div" style="opacity:0.8; pointer-events:none">${display_user_id}</div>
        <div style="margin-right: 3px;"></div>


        <div id="logout_btn_div" class="tooltip" style="opacity:1; pointer-events:none;">
          <div id="logout_btn" class="fa fa-sign-out-alt fa-circle-button fa-circle-button-dark" style="padding-left: 10px; padding-right: 10px;"></div>
          <span class="tooltip-text tooltip-bottom-left">Log out</span>
        </div>

        <div id="user_con_stat_div" style="opacity: 0; pointer-events:none"></div>
        <div id="server_con_stat_div" style="opacity: 0; pointer-events:none"></div>

        <div style="margin-right: 2%;"></div>
      </div>
    </div>

    <script type="text/javascript">
      $.getScript('/js/utils/BaseApp.js')
    </script>

    <!-- <paper-toast opened class='it-bottom' duration='0' text="Log-in is implemented for development purposes... Please use username = 'guest' and a password '123' or 'user0' with 'xxx'"></paper-toast> -->

  </body>
</html>
  <!-- ========================================================================= -->
