
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">

    <meta http-equiv="Expires" content="-1">

    <!-- set a global variable (must come before anything else) -->
    <script>
        window.APP_PREFIX = '${app_prefix}'
        window.SITE_TYPE = '${ns_type}'
        window.WIDGET_NAME = '${widget_name}'
        window.DISPLAY_USERID = '${display_userid}'
    </script>

    <meta charset="UTF-8" />
    <title>CTA</title>

    <meta name="description" content="" />
    <meta name="keywords" content="" />
    <meta name="author" content="" />
    <!-- <link rel="icon" type="image/x-icon" href="/static/site_icon.png"/> -->
    <link rel="icon" type="image/x-icon" href="/static/icon-batman.png"/>

    <!-- executed sed 's/d3/d3_3_5_17/g' bower_components/d3/d3.min.js -->
    <script type="text/javascript" src="/bower_components/d3/d3.js"></script>
    <script type="text/javascript" src="/js/d3_hexbin/d3-hexbin.v0.2.min.js"></script>
    <script type="text/javascript" src="/bower_components/textures/dist/textures.js"></script>
    <script type="text/javascript" src="/bower_components/jquery/dist/jquery.min.js"></script>
    <link rel="stylesheet" type="text/css" href="/styles/fonts.css"/>
    <link rel="stylesheet" type="text/css" href="/styles/general_style.css"/>
    <link href="/static/fontawesome-free-5.12.0-web/css/all.css" rel="stylesheet">

  </head>

  <!-- ========================================================================= -->
  <body>
    <div id="top_padding_div"></div>

    <div id="title_div" class="menu_header site_header"></div>
    
    <div id="base_app_div"></div>

    <div id="general_ops_div"></div>

    <div id="side_menu"></div>
    <div id="topMenu" class="horizontal_ele grid_ele_dark" style="width: 100%; display: flex; align-items: center; position: fixed; top: 0; opacity: 1;">
      <div id="top_menu_inner" class="horizontal_ele" style="width: 100%; margin-top: 12px; margin-bottom: 12px; ">
        <div style="margin-left: 2%;"></div>

        <div id="top_menu_left"></div>

        <div class="flex_ele"></div>

        <div class="menu_header" id="userName_div" style="opacity:0.8; pointer-events:none">${display_userid}</div>
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









    <script>

        // var ws = new WebSocket("ws://localhost:8090/ws");
        // const socket = new WebSocket('ws://localhost:8090');
        // var ws = new WebSocket("ws://0.0.0.0:8090/ws")
        if (0) {
            var ws = new WebSocket('ws://127.0.0.1:8090/my_ws')
            window.ws = ws

            ws.onopen = function(event) {
                // let mes = 'opened .........'
                // console.log(mes, event)

                // ws.send('here i am')
                data = {xxx:'here i am', yyy:4}
                data = 'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww '
                ws.send(JSON.stringify(data))

            }

            ws.onmessage = function(event) {
                let event_data = JSON.parse(event.data)
                let event_name = event_data.event_name
                let data = event_data.data

                console.log('event_nameevent_name',event_name)

            }


            // temporary reload....
            ws.onclose = function(event) {
                // let mes = 'closed .........'
                // console.log(mes, event)

                setTimeout(function() {
                    window.location.reload() 
                }, 10) 
            }
        }
        
        // setTimeout(function() {
        // }, 100);
        

        // var ws = new WebSocket("ws://0.0.0.0:8090/socket_io");
        // ws.onmessage = function(event) {
        //     var messages = document.getElementById('base_app_div')
        //     var message = document.createElement('li')
        //     var content = document.createTextNode(event.data)
        //     message.appendChild(content)
        //     messages.appendChild(message)
        // };
        // function sendMessage(event) {
        //     // var input = document.getElementById("messageText")
        //     // ws.send(input.value)
        //     // input.value = ''
        //     // event.preventDefault()
        // }
    </script>









    <script type="text/javascript">
      $.getScript('/js/utils/BaseApp.js')
    </script>

    <!-- <paper-toast opened class='it-bottom' duration='0' text="Log-in is implemented for development purposes... Please use username = 'guest' and a password '123' or 'user0' with 'xxx'"></paper-toast> -->

  </body>
</html>
  <!-- ========================================================================= -->
