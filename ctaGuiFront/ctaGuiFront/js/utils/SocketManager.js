'use strict'
// -------------------------------------------------------------------
/* global $ */
/* global io */
/* global d3 */
/* global unique */
/* global is_def */
/* global deep_copy */
/* global setup_view */
/* global icon_badge */
/* global run_when_ready */
/* global loaded_scripts */
/* global get_time_msec */
/* global LOG_LEVELS */

// -------------------------------------------------------------------
// setup the socket and load resources
// ---------------------------------------------------------------------------
// basice setup of the righ-side drawer menu
// let base_app = document.querySelector("#base_app");
// base_app.paper_drawerPanel1().drawerWidth  = "40%";
// base_app.paper_drawerPanel1().disableSwipe = true;
// base_app.paper_drawerPanel1().force_narrow  = true;
// base_app.topRightMenuTog  ().setAttribute("style","");

// document.getElementById('topRightMenuTog').setAttribute("style","");


// ---------------------------------------------------------------------------
/**
 * general manager for sockets
 */
// ---------------------------------------------------------------------------
function SocketManager() {
    let this_top = this
    let is_debug = true
    // let gs_idV = []
    let init_views = {
    }
    let is_south = window.SITE_TYPE === 'S'
    // let server_id = null
    let base_app = window.base_app
    let tab_table_title_id = 'table_title'
    let tab_table_main_id = 'table_content'
    
    this_top.con_states = {
        'CONNECTED': 'CONNECTED',
        'SLOW_CONNECTION': 'SLOW_CONNECTION',
        'NOT_CONNECTED': 'NOT_CONNECTED',
    }

    this_top.socket = null
    this_top.con_stat = null
    this_top.widget_infos = {
    }
    this_top.widget_table = {
    }

    this_top.has_joined_session = false
    this_top.session_props = null

    this_top.state_change_funcs = []

    this_top.n_client_msg = 0

    this_top.n_wigits = -1

    // wrappers for encoding/decoding data for socket communications
    const stringify_replacer = (key, value) => !is_def(value) ? null : value
    function encode_socket_data(data) {
        return JSON.stringify(data, stringify_replacer)
    }
    function decode_socket_data(data) {
        return JSON.parse(data)
    }


    // ---------------------------------------------------------------------------
    /**
     * wrapper for WebSocket events
     */
    // ---------------------------------------------------------------------------
    function SocketInterface() {
        let this_sock_int = this
        let ws = null
        this_sock_int.connected = false

        // obj for all event names
        let events = {
        }

        // open the WebSocket and add interfaces
        function setup_websocket() {
            ws = new WebSocket(window.WEBSOCKET_ROUTE)

            //
            ws.onopen = function(event) {
                // console.log(' -ZZZ- onopen - ')
                return
            }

            //
            ws.onmessage = function(event) {
                try {
                    if (!event.data) {
                        throw [
                            'no event data in this_sock_int.ws.onmessage',
                        ]
                    }

                    let event_data = decode_socket_data(event.data)
                    let event_name = event_data.event_name

                    if (is_def(events[event_name])) {
                        // console.log(' - onmessage - ', [event_data.sess_id, event_name])
                        events[event_name](event_data)
                    }
                    else {
                        throw [
                            'undefined event_name', event.data,
                        ]
                    }
                }
                catch (err) {
                    this_top.socket.server_log({
                        data: err,
                        is_verb: true,
                        log_level: LOG_LEVELS.ERROR,
                    })
                }

                return
            }

            //
            ws.onclose = function(event) {
                // console.log(' -ZZZ- onclose - ')

                this_top.con_stat.set_server_con_state(this_top.con_states.NOT_CONNECTED)
                this_top.con_stat.set_user_con_state_opts(false)
                this_top.con_stat.set_check_heartbeat(false)

                // try to reconnect the session
                setTimeout(function() {
                    setup_websocket()
                }, 100)
                // window.location.reload()

                return
            }

            ws.onerror = function(event) {
                // console.log(' -ZZZ- onerror - ', event)
                this_top.socket.server_log({
                    data: {
                        event_name: 'ws.onerror',
                        event: event,
                    },
                    is_verb: true,
                    log_level: LOG_LEVELS.ERROR,
                })
             
                return
            }
        }
        this_sock_int.setup_websocket = setup_websocket

        // on event of a given type, use the registered function
        function on(event_name, func) {
            events[event_name] = func
            return
        }
        this_sock_int.on = on

        // send a socket event by event name
        function emit(event_name, data_in, metadata_in) {
            if (!is_def(data_in)) {
                data_in = {
                }
            }
            let data = {
                event_name: event_name,
                sess_id: this_top.sess_id,
                n_client_msg: this_top.n_client_msg,
                send_time_msec: get_time_msec(),
                data: data_in,
            }
            if (is_def(metadata_in)) {
                $.each(metadata_in, function(key, data_now) {
                    data[key] = data_now
                })
            }
            this_top.n_client_msg += 1
            
            // console.log('sending ', event_name)
            if (is_ws_open()) {
                ws.send(
                    encode_socket_data(data)
                )
            }

            return
        }
        this_sock_int.emit = emit

        // logging event interface
        function server_log(data_in) {
            let event_name = 'client_log'
            let log_level = is_def(data_in.log_level) ? data_in.log_level : LOG_LEVELS.ERROR
            let is_verb = is_def(data_in.is_verb) ? data_in.is_verb : false
            
            let metadata = {
                log_level: log_level,
            }

            this_sock_int.emit(event_name, data_in.data, metadata)

            // local print in the client if needed
            if (log_level === LOG_LEVELS.ERROR) {
                console.error(event_name, metadata, data_in.data)
            }
            else if (is_verb) {
                console.log(event_name, metadata, data_in.data)
            }
            
            return
        }
        this_sock_int.server_log = server_log

        // check if the socket is open for buisness
        function is_ws_open() {
            return (ws.readyState === ws.OPEN)
        }
        this_sock_int.is_ws_open = is_ws_open

        // close the socket manually (will trigger ws.onclose())
        function close_ws() {
            ws.close()
            return
        }
        this_sock_int.close_ws = close_ws

        return
    }

    // ---------------------------------------------------------------------------
    /**
     * initial setup of socket functionalities
     */
    // ---------------------------------------------------------------------------
    function setup_socket() {
        let widget_name = window.WIDGET_NAME

        this_top.socket = new SocketInterface()
        this_top.socket.setup_websocket()

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let is_first = true
        function initial_connect(data_in) {
            // console.log(' -ZZZ- initial_connect - ')
            
            let tel_info = {
            }
            tel_info.tel_ids = data_in.tel_ids
            tel_info.tel_id_to_types = data_in.tel_id_to_types
            tel_info.categorical_types = data_in.categorical_types
            window.SOCKET_INFO = tel_info
            
            this_top.sess_id = String(data_in.sess_id)
            // this_top.sess_id = String('_xx_00_xx_') // for debugging
            // this_top.sess_id = String(unique({prefix: ''}))

            this_top.sess_ping = data_in.sess_ping

            this_top.session_props = {
                sess_id: this_top.sess_id,
                user_id: window.DISPLAY_USER_ID,
                is_simulation: data_in.is_simulation,
            }

            let data_out = {
                display_user_id: window.DISPLAY_USER_ID,
                display_user_group: window.DISPLAY_USER_GROUP,
            }
            
            let test_log = 0
            if (test_log) {
                this_top.socket.server_log({
                    data: {
                        ssssssssss: 1,
                    },
                    is_verb: true,
                    log_level: LOG_LEVELS.INFO,
                })
            }

            // this_top.socket.emit('test_socket_evt', {test: 0})
            // this_top.socket.emit('test_socket_evt', {test: 1})
            
            this_top.socket.emit('sess_setup_begin', data_out)

            // this_top.socket.emit('test_socket_evt', {test: 2})

            if (test_log) {
                this_top.socket.server_log({
                    data: {
                        ssssssssss: 1,
                    },
                    is_verb: true,
                    log_level: LOG_LEVELS.ERROR,
                })
            }

            if (is_first) {
                this_top.n_wigits += 1
            }

            if (is_first) {
                this_top.con_stat = new connection_state()

                // periodically flush the d3 timer for hidden windows
                flush_hidden_d3()
                // check_was_offline()

                // start the ping/pong heartbeat loop
                check_ping_delay()
            }
            
            // set the connection status indicators
            this_top.con_stat.set_server_con_state(this_top.con_states.CONNECTED)
            this_top.con_stat.set_user_con_state_opts(true)
            this_top.con_stat.set_check_heartbeat(true)



            if (is_first) {
                if (is_def(setup_view[widget_name])) {
                    setup_view[widget_name]()
                }
                this_top.has_joined_session = true
            }
            is_first = false

            return
        }

        let is_init = true
        this_top.socket.on('initial_connect', function(data_in) {
            // console.log('xxxxXXXXXXXXxxx initial_connect', is_init)
            if (is_init) {
                is_init = false
                initial_connect(data_in.data)
            }
            else {
                // if this is an exsisting session reconnecting, override
                // the sess_id, which will also be transmitted to the server
                data_in.sess_id = this_top.sess_id
                data_in.data.sess_id = this_top.sess_id

                // console.log(' - reconnect - ', data_in)
                initial_connect(data_in.data)
                // reconnect(data_in)
            }
        })


        //
        this_top.socket.on('reload_session', function(data_in) {
            setTimeout(function() {
                window.location.reload()
            }, 100)
        })

        // -------------------------------------------------------------------
        // get/send heartbeat ping/pong messages to the server
        // -------------------------------------------------------------------
        let ping_time_msec, ping_latest_delay_msec
        function reset_ping() {
            ping_time_msec = null
            ping_latest_delay_msec = 0
            return
        }
        reset_ping()
        
        this_top.socket.on('heartbeat_ping', function(data_in) {
            // console.log(' - got heartbeat_ping', data_in)
            // if this is not the first ping, check that the delay is within the allowed range
            if (document.hidden) {
                reset_ping()
                return
            }

            if (is_def(ping_time_msec)) {
                let ping_interval_msec = get_time_msec() - ping_time_msec
                ping_latest_delay_msec = Math.abs(
                    ping_interval_msec - data_in.data.ping_interval_msec
                )

                this_top.con_stat.set_check_heartbeat(true)
                // console.log(' xxx', ping_interval_msec)
            }

            // update the local variable
            ping_time_msec = get_time_msec()
            // let the server know that the ping was received
            this_top.socket.emit('heartbeat_pong')
        })

        // -------------------------------------------------------------------
        // func to run continously and check that the ping/pong heartbeat
        // is within accepted limits
        // -------------------------------------------------------------------
        function check_ping_delay() {
            setTimeout(function() {

                // // let is_offline = this_top.con_stat.is_offline()
                // if (document.hidden) {
                //     reset_ping()
                //     return
                // }

                // this_top.socket.emit('test_socket_evt', {test: 1})

                // if this is not the first ping, check that the delay is within the allowed range
                let ping_total_delay_msec = 0
                if (is_def(ping_time_msec)) {
                    let ping_interval_msec = get_time_msec() - ping_time_msec
                    ping_total_delay_msec = (
                        ping_interval_msec - this_top.sess_ping.send_interval_msec
                    )
                    // console.log('check_ping_delay:', ping_latest_delay_msec, ping_total_delay_msec)
                }

                // mostly ping_total_delay_msec will be negative if the connecition is ok
                // and so the latest (event) delay will be taken
                let ping_compare_delay_msec = Math.max(
                    ping_latest_delay_msec, ping_total_delay_msec
                )

                if (!this_top.con_stat.do_check_heartbeat()) {
                    // after setting the state in the previous iteration (to make
                    // sure we do not attempt to send further messages), close the socket
                    if (this_top.socket.is_ws_open()) {
                        let do_ws_close = (
                            ping_compare_delay_msec > this_top.sess_ping.max_interval_bad_msec
                        )
                        if (do_ws_close) {
                            this_top.socket.close_ws()
                        }
                    }

                    check_ping_delay()
                    return
                }

                let state = null
                if (ping_compare_delay_msec < this_top.sess_ping.max_interval_good_msec) {
                    state = this_top.con_states.CONNECTED
                    // console.log('            GOOD connection ?!')
                }
                else if (ping_compare_delay_msec < this_top.sess_ping.max_interval_slow_msec) {
                    state = this_top.con_states.SLOW_CONNECTION
                    // console.log(' SLOW_CONNECTION connection ?!')
                }
                else {
                    state = this_top.con_states.NOT_CONNECTED
                    // console.log('              NO  connection ?!')
                }

                let prev_state = this_top.con_stat.get_server_con_state()
                
                if (prev_state !== state) {
                    // send a log entry to the server
                    if (!document.hidden) {
                        if (state !== this_top.con_states.CONNECTED) {
                            let level = (
                                state === this_top.con_states.NOT_CONNECTED
                                    ? LOG_LEVELS.ERROR
                                    : LOG_LEVELS.WARNING
                            )
                            this_top.socket.server_log({
                                data: {
                                    event_name: state,
                                    ping_latest_delay_msec: ping_latest_delay_msec,
                                    ping_total_delay_msec: ping_total_delay_msec,
                                },
                                is_verb: true,
                                log_level: level,
                            })
                        }
                    }

                    // modify the connection state of the client
                    let is_con = (state !== this_top.con_states.NOT_CONNECTED)

                    this_top.con_stat.set_server_con_state(state)
                    this_top.con_stat.set_user_con_state_opts(is_con)
                    this_top.con_stat.set_check_heartbeat(is_con)
                }

                check_ping_delay()
                return

            }, 500)
        }

        // -------------------------------------------------------------------
        // if the window/tab is hidden (minimized or another tab
        // is focused), then flush the time function -> execute all zero-delay
        // transitions at once. If this is not running on a loop forever
        // then updates on a hidden tab will not go through in
        // real-time (see: https://github.com/d3/d3-timer)
        // -------------------------------------------------------------------
        function flush_d3() {
            d3.timerFlush()
            return
        }
        this_top.flush_d3 = flush_d3
        
        // if we are offline, but the user and server are connected, then
        // this implied document.hidden, and we periodically flush the d3 timer
        function flush_hidden_d3() {
            setTimeout(function() {
                let need_flush = (
                    this_top.con_stat.is_offline()
                    && this_top.socket.is_user_state_on
                    && this_top.socket.is_server_state_on
                )
                if (need_flush) {
                    flush_d3()
                }
                flush_hidden_d3()
            }, 5000)
        }

        // function to be registered in state_change_funcs and
        // run every time this_top.con_stat.is_offline() runs, which includes
        // every time a window.visibilitychange event happens
        function hidden_state_change(opt_in) {
            let is_first = opt_in.is_first
            let is_offline = opt_in.is_offline
            let has_changed = opt_in.has_changed

            if (!is_offline && has_changed) {
                reset_ping()
            }
            if (has_changed) {
                if (is_offline) {
                    this_top.socket.emit('sess_to_offline')
                }
                else if (!is_first) {
                    this_top.socket.emit('sess_to_online')
                // this_top.socket.emit('back_from_offline')
                }
            }
        }
        this_top.state_change_funcs.push(hidden_state_change)

        // function connection_debug() {
        //     setTimeout(function() {
        //         console.log(' -     ', get_time_msec())
        //         console.log('sock   ', this_top.socket.connected, this_top.socket.is_ws_open())
        //         console.log('server ', this_top.socket.is_server_state_on)
        //         console.log('user   ', this_top.socket.is_user_state_on)
        //         console.log('hidden ', document.hidden)
        //         console.log('')
        //         connection_debug()
        //     }, 1000)
        // }
        // connection_debug()


        // -------------------------------------------------------------------
        // run the respective sync-state function for each widget
        // -------------------------------------------------------------------
        this_top.socket.on('get_sync_state', function(data_in) {
            if (this_top.con_stat.is_offline()) {
                return
            }

            $.each(this_top.widget_infos, function(index_0, ele_0) {
                $.each(ele_0.widgets, function(index1, ele_1) {
                    if (is_def(ele_1.get_sync_state)) {
                        ele_1.get_sync_state(data_in)
                    }
                })
            })
        })


        // // -------------------------------------------------------------------
        // //
        // // -------------------------------------------------------------------
        // this_top.socket.on('join_session_data', function(data_in) {
        //     if (!this_top.has_joined_session) {
        //         if (is_def(setup_view[widget_name])) {
        //             setup_view[widget_name]()
        //         }
        //         this_top.has_joined_session = true
        //         this_top.session_props = data_in.session_props
        //     }
        // })

        return
    }
    this_top.setup_socket = setup_socket


    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function connection_state(is_connect) {
        let this_con_state_top = this
        let off_opacity = '40%'
        
        this_top.socket.is_server_state_on = false
        this_top.socket.is_user_state_on = true

        let server_btn = base_app.get_connection_stat_div(true, '_btn')
        let user_btn = base_app.get_connection_stat_div(false, '_btn')
        let user_tog = base_app.get_connection_stat_div(false, '_tog')

        let tooltip_span_id = 'server_con_stat_div_container_extra_tooltip'
        let tooltip_span = document.querySelector('#' + tooltip_span_id)
        if (!is_def(tooltip_span)) {
            let tooltip_div = document.querySelector('#server_con_stat_div_container')
            if (is_def(tooltip_div)) {
                let texts = tooltip_div.getElementsByClassName('tooltip-text')
                if (texts && texts.length > 0) {
                    tooltip_span = texts[0].appendChild(
                        document.createElement('span')
                    )
                    tooltip_span.id = tooltip_span_id
                }
            }
        }

        this_con_state_top.user_btn = user_btn

        //
        function set_server_con_state(state) {
            let is_con = false
            if (state == this_top.con_states.CONNECTED) {
                is_con = true
                server_btn.classList.add('status-indicator-on')
                server_btn.classList.remove('status-indicator-warn')
                if (is_def(tooltip_span)) {
                    tooltip_span.innerHTML = 'Server connected'
                }
            }
            else if (state == this_top.con_states.SLOW_CONNECTION) {
                is_con = true
                server_btn.classList.add('status-indicator-warn')
                server_btn.classList.remove('status-indicator-on')
                if (is_def(tooltip_span)) {
                    tooltip_span.innerHTML = 'Unstable server connection'
                }
            }
            else if (state == this_top.con_states.NOT_CONNECTED) {
                is_con = false
                server_btn.classList.remove('status-indicator-on')
                server_btn.classList.remove('status-indicator-warn')
                if (is_def(tooltip_span)) {
                    tooltip_span.innerHTML = 'Server not connected'
                }
            }
            else {
                console.error('unrecognised connection state ?!?!?!')
            }

            // just in case, explicitly check the ws status (though its possible
            // that is_con will be false and is_ws_open() will be true, eg in case
            // the server is frozen)
            if (!this_top.socket.is_ws_open()) {
                is_con = false
            }

            server_con_state = state
            this_top.socket.connected = is_con
            this_top.socket.is_server_state_on = is_con

            return
        }
        this_con_state_top.set_server_con_state = set_server_con_state

        //
        let server_con_state = this_top.con_states.NOT_CONNECTED
        function get_server_con_state() {
            return server_con_state
        }
        this_con_state_top.get_server_con_state = get_server_con_state

        //
        function set_user_con_state_opts(is_con) {
            if (is_con) {
                user_tog.style = 'opacity: 1;'
            }
            else {
                user_tog.style = (
                    'opacity: ' + off_opacity + '; pointer-events: none;'
                )
            }
            return
        }
        this_con_state_top.set_user_con_state_opts = set_user_con_state_opts

        //
        let check_heartbeat = false
        function set_check_heartbeat(is_con) {
            // console.log(' -ZZZ- set_check_heartbeat ', is_con)
            check_heartbeat = is_con
            return
        }
        this_con_state_top.set_check_heartbeat = set_check_heartbeat

        function do_check_heartbeat() {
            return check_heartbeat
        }
        this_con_state_top.do_check_heartbeat = do_check_heartbeat

        user_btn.addEventListener('change', function(e) {
            this_top.socket.is_user_state_on = e.target.checked
            return
        })

        let is_first = true
        let has_changed = null
        function is_offline() {
            let is_offline_now = false
            if (!this_top.socket.connected) {
                is_offline_now = true
            }
            else if (document.hidden) {
                is_offline_now = true
            }
            else if (!this_top.socket.is_server_state_on || !this_top.socket.is_user_state_on) {
                is_offline_now = true
            }

            // run functions which can be registered by other code
            has_changed = (has_changed !== is_offline_now)
            $.each(this_top.state_change_funcs, function(_, func) {
                func({
                    is_first: is_first,
                    is_offline: is_offline_now,
                    has_changed: has_changed,
                })
            })
            is_first = false
            has_changed = is_offline_now

            // console.log('-is_offline-',is_offline_now, this_top.socket.connected)
            return is_offline_now
        }
        this_con_state_top.is_offline = is_offline

        // add a listener, so that every time the visibility changes,
        // we run all the state_change_funcs functions (including socket event)
        document.addEventListener('visibilitychange', is_offline, false)

        return
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function sock_sync_state_send(opt_in) {
        if (document.hidden) {
            return
        }
        if (this_top.con_stat.is_offline()) {
            return
        }

        let data_now = {
        }
        data_now.NS = opt_in.NS
        data_now.widget_id = opt_in.widget_id
        data_now.type = opt_in.type
        data_now.data = opt_in.data

        if (is_def(this_top.socket)) {
            this_top.socket.emit('sync_state_send', data_now)
        }
    }
    this_top.sock_sync_state_send = sock_sync_state_send

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function is_same_sync(prev_sync, data_in) {
        if (!is_def(prev_sync[data_in.type])) {
            return false
        }

        let is_same = true
        $.each(data_in, function(tag_now, obj_now) {
            if (tag_now !== 'sync_time') {
                if (!(prev_sync[data_in.type][tag_now] === obj_now)) {
                    is_same = false
                }
            }
        })
        return is_same
    }
    this_top.is_same_sync = is_same_sync

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function is_old_sync(prev_sync, data_in) {
        if (!is_def(prev_sync[data_in.type])) {
            return false
        }

        return prev_sync[data_in.type].sync_time >= data_in.sync_time
    }
    this_top.is_old_sync = is_old_sync

    // -------------------------------------------------------------------
    // the server keeps the id of the current active widget,
    // to avoid sending spurious sync events
    // -------------------------------------------------------------------
    let wait_mouse_move = 250
    let prev_mouse_move = Date.now()
    function emit_mouse_move(opt_in) {
        let eleIn
        if (
            (typeof opt_in.eleId === 'string' || opt_in.eleId instanceof String)
              && is_def(opt_in.eleId)
        ) {
            eleIn = opt_in.eleId
            if (!(eleIn.indexOf('#') === 0)) {
                eleIn = '#' + eleIn
            }
        }
        else {
            eleIn = opt_in.eleIn
        }

        $(eleIn).mousemove(function(_) {
            if (Date.now() - prev_mouse_move < wait_mouse_move) {
                return
            }
            prev_mouse_move = Date.now()

            if (!this_top.con_stat.is_offline() && is_def(this_top.socket)) {
                this_top.socket.emit('set_active_widget', opt_in.data)
            }
            // console.log("onmousemove",opt_in.data.widget_id)
        })
    }
    this_top.emit_mouse_move = emit_mouse_move
    // $(document).mouseenter(function () { console.log('in'); });
    // $(document).mouseleave(function () { console.log('out'); });

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function set_socket_module(opt_in) {
        let widget_id = opt_in.widget_id
        let widget_type = opt_in.widget_type
        let widget_func = opt_in.widget_func
        let widget_source = opt_in.widget_source

        let is_first = !is_def(this_top.widget_infos[widget_type])

        if (is_first) {
            this_top.widget_infos[widget_type] = {
                sock_func: null,
                widgets: {
                },
            }
        }
        let widget_data = this_top.widget_infos[widget_type]

        if (!is_def(widget_data.widgets[widget_id])) {
            widget_data.widgets[widget_id] = (
                new widget_func.main_func(opt_in)
            )
            init_views[widget_id] = false

            if (is_first) {
                widget_data.sock_func = new widget_func.sock_func(opt_in)

                // -------------------------------------------------------------------
                // common sicket calls, which should be added only once!
                // -------------------------------------------------------------------
                this_top.socket.on('init_data', function(data_in) {
                    if (data_in.widget_type === widget_type) {
                        let widget_now = (
                            widget_data.widgets[data_in.widget_id]
                        )
                        if (is_def(widget_now)) {
                            widget_now.init_data(data_in)
                            init_views[data_in.widget_id] = true
                        }
                    }
                })

                this_top.socket.on('update_data', function(data_in) {
                    if (this_top.con_stat.is_offline()) {
                        return
                    }
                    if (data_in.widget_type !== widget_type) {
                        return
                    }

                    let n_wigit_now = 0
                    let n_wigits = Object.keys(widget_data.widgets).length

                    $.each(widget_data.widgets, function(
                        widget_id_now,
                        module_now
                    ) {
                        if (data_in.sess_widget_ids.indexOf(widget_id_now) >= 0) {
                            // make sure we dont send the same data twice (as it could be modified)
                            n_wigit_now += 1
                            let data_update
                                = (n_wigits === 1 || n_wigit_now === n_wigits)
                                    ? data_in
                                    : deep_copy(data_in)

                            widget_data.widgets[widget_id_now].update_data(
                                data_update
                            )
                        }
                    })
                })
            }

            // -------------------------------------------------------------------
            // add the widget
            // -------------------------------------------------------------------
            this_top.socket.emit('widget', {
                widget_source: widget_source,
                widget_name: widget_type,
                widget_id: widget_id,
                method_name: 'setup',
            })
        }

        return widget_data.widgets[widget_id]
    }
    // this.set_socket_module = set_socket_module;

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function multiple_inits(opt_in) {
        if (init_views[opt_in.id]) {
            console.error(
                'trying to init_data multiple times ?!?!',
                opt_in.id,
                opt_in.data
            )
            return true
        }
        return false
    }
    this_top.multiple_inits = multiple_inits

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function set_icon_badge(opt_in) {
        if (is_def(opt_in.icon_divs)) {
            $.each(opt_in.icon_divs, function(index, icon_div_now) {
                icon_badge.set_widget_icon({
                    icon_div: icon_div_now,
                    n_icon: opt_in.n_icon,
                })
            })
        }
    }
    this_top.set_icon_badge = set_icon_badge

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function add_widget(opt_in) {
        let name_tag = opt_in.name_tag
        let table_title = opt_in.table_title
        // let has_drawer = opt_in.has_drawer
        let has_icon = opt_in.has_icon

        let main_script_name = '/js/widgets/' + name_tag + '.js'

        let main_div = document.querySelector('#base_app_div')
        let icon_divs = [ null, null ]

        // create the table element
        let tab_table_id = unique()
        let widget_id = (
            this_top.sess_id + '_widg_'
            + String(this_top.n_wigits).padStart(3, '0')
        )
        let main_id = widget_id + 'main'
        let gs_name = tab_table_id + 'tbl'

        if (has_icon) {
            icon_divs[0] = {
                id: main_id + 'icon_div',
            }
        }

        let tab_table_NEW = main_div.appendChild(document.createElement('div'))
        tab_table_NEW.id = tab_table_id
        tab_table_NEW.classList.add('table_card')

        let tab_table_title = tab_table_NEW.appendChild(document.createElement('div'))
        tab_table_title.id = tab_table_title_id
        // tab_table_title.setAttribute("style", 'width: 100%; display: flex; align-items: center')
        tab_table_title.classList.add('table_title')

        let tab_table_title_text = tab_table_title.appendChild(
            document.createElement('div')
        )
        let tab_table_title_icon = tab_table_title.appendChild(
            document.createElement('div')
        )

        tab_table_title_icon.classList.add('table_title_icon')
        if (has_icon) {
            let tab_table_title_icon_inner = tab_table_title_icon.appendChild(
                document.createElement('div')
            )
            tab_table_title_icon_inner.id = icon_divs[0].id
            // tab_table_title_icon_inner.innerHTML = '000000000'
        }
        tab_table_title_text.innerHTML = table_title
        // tab_table_title_text.setAttribute("style", 'width: 100%; text-align: left; margin-left: 1%; margin-right: 1%;')
        tab_table_title_text.classList.add('table_title_text')

        let tab_table_main = tab_table_NEW.appendChild(document.createElement('div'))
        tab_table_main.id = tab_table_main_id
        // tab_table_main.setAttribute("style", 'width: 100%;')
        // tab_table_main.classList.add('grid_ele_dark')

        // console.log(tab_table_NEW)

        // -------------------------------------------------------------------
        // proceed once the table has been added (with possible recursive calls to load_script())
        // -------------------------------------------------------------------
        window.load_script({
            source: name_tag,
            script: main_script_name,
        })

        run_when_ready({
            pass: function() {
                let intersect = loaded_scripts.queued.filter(n =>
                    loaded_scripts.loaded.includes(n)
                )
                return intersect.length === loaded_scripts.queued.length
            },
            execute: set_widgit,
        })

        // -------------------------------------------------------------------
        // create the side-menu and widget
        // -------------------------------------------------------------------
        function set_widgit() {
            let widget_opt = {
                name_tag: name_tag,
                widget_id: widget_id,
                base_name: name_tag + widget_id,
                gs_name: gs_name,
                tab_table: tab_table_NEW,
                icon_divs: icon_divs,
                is_south: is_south,
                widget: null,
                widget_func: null,
                widget_div_id: null,
                ele_props: null,
            }

            this_top.widget_table[name_tag](widget_opt)
        }

        // // -------------------------------------------------------------------
        // // after setting up the event listners, can finally add the element
        // // -------------------------------------------------------------------
        // gs_idV.push({ tab_table: tab_table_NEW, gs_name: gs_name })
        // winResize()
    }
    this_top.add_widget = add_widget

    // -------------------------------------------------------------------
    // create the side-menu and widget
    // -------------------------------------------------------------------
    function add_to_table(opt_in) {
        let widget_type = opt_in.name_tag
        let widget_source = widget_type
        // let widget_source = 'widget_' + widget_type
        let widget_func = opt_in.widget_func
        let base_name = opt_in.base_name
        // let gs_name = opt_in.gs_name
        let widget_id = opt_in.widget_id
        let tab_table = opt_in.tab_table
        let icon_divs = opt_in.icon_divs
        let ele_props = opt_in.ele_props
        let widget_div_id = opt_in.widget_div_id
        let widget_types = Object.keys(opt_in.ele_props)
        let setup_data = opt_in.setup_data

        let widget_ele = []
        $.each(widget_types, function(index, data_now) {
            widget_ele.push(null)
      
            let tab_table_main = tab_table.querySelector('#' + tab_table_main_id)
            tab_table_main.setAttribute(
                'class',
                (ele_props[data_now].is_dark_ele
                    ? ' class: grid_ele_dark' : ' class: grid_eleBody')
            )
      
            let item_now = tab_table.
                querySelector('#' + tab_table_main_id).
                appendChild(document.createElement('div'))
            item_now.innerHTML = ele_props[data_now]['content']

            let widget_index = 0
            let widget_tag = null
            $.each(widget_types, function(index, data_now1) {
                if (ele_props[data_now]['gs_id'] === widget_div_id + data_now1) {
                    widget_index = index
                    widget_tag = data_now1
                }
            })

            if (!is_def(widget_tag)) {
                return
            }

            let Widget_func_now = function() {
                this.get_ele = function(tag) {
                    return item_now.querySelector('#' + tag)
                }
            }
            let widget_func_now = new Widget_func_now()

            widget_ele[widget_index] = {
                id: widget_tag,
                widget: widget_func_now,
                w: ele_props[widget_tag].w,
                h: ele_props[widget_tag].h,
            }

            let gs_w = ele_props[widget_tag].w
            // let gs_h = ele_props[widget_tag].h

            // var ow = item_now.offsetWidth
            // var h0 = ow * 0.08
            var w_tot = 12
            var w0 = gs_w / w_tot
            var width = (100 * w0) + '%'
            // var width = 100 * w0 - 0.5 + '%'
            // var height = h0 * gs_h + 'px'
            // var maxHeight = $(document).height() * 0.8
            let item_now_style = 'width:' + width
            // + '; height:'
            // + height
            // + '; max-height:'
            // + maxHeight
            // + 'px'
            item_now.style = item_now_style
            item_now.classList.add('table_item')
            // tab_table._add_widget(gs_name, ele_props[data_now])
        })

        // -------------------------------------------------------------------
        run_when_ready({
            pass: function() {
                let n_ready = 0
                $.each(widget_types, function(index, data_now) {
                    if (is_def(widget_ele[index])) {
                        n_ready += 1
                    }
                })
                return n_ready === widget_types.length
            },
            execute: function() {
                opt_in.widget = set_socket_module({
                    widget_type: widget_type,
                    widget_source: widget_source,
                    widget_func: widget_func,
                    base_name: base_name,
                    widget_id: widget_id,
                    icon_divs: icon_divs,
                    widget_ele: widget_ele,
                    setup_data: setup_data,
                })
            },
            fail_log: function() {
                console.error([
                    'cant initialize widgit ' + widget_type + ' with:',
                    widget_id,
                ])
            },
        })
    }
    this_top.add_to_table = add_to_table

    return
}


// -------------------------------------------------------------------
// the global instance of the socket manager
// -------------------------------------------------------------------
window.sock = new SocketManager()


// let prevResize = null
// function winResize () {
//   console.log(' ..... winResize .........') ; return
//   if (is_def(prevResize)) return
//   prevResize = Date.now()

//   run_loop_com.init({ tag: 'winResize', func: resizeNowOnce, n_keep: 1 })
//   function resizeNow () {
//     run_loop_com.push({ tag: 'winResize' })
//   }

//   function resizeNowOnce () {
//     if (Date.now() - prevResize < times.anim) {
//       resizeNow()
//       return
//     }

//     prevResize = Date.now()
//     $.each(gs_idV, function (index, gsNow) {
//       gsNow.tab_table.set_all_widget_wh(gsNow.gs_name)
//     })
//   }

//   $.each(gs_idV, function (index, gsNow) {
//     let tblNow = gsNow.tab_table.get_ele(gsNow.gs_name)
//     $(tblNow).on('resizestop', function (event, ui) {
//       resizeNow()
//     })
//   })

//   window.addEventListener('resize', function (e) {
//     resizeNow()
//   })
// }
// // this.winResize = winResize;


// // -------------------------------------------------------------------
// // upon leaving the session or leaving the page
// // -------------------------------------------------------------------
// window.addEventListener('beforeunload', function(_, do_reload) {
//     // explicitly needed for firefox, but good in any case...
//     if (this_top.socket) {
//         // this_top.socket.disconnect()
//         this_top.socket = null
//     }
//     if (is_debug) {
//         window.location.reload() // clear cache
//     }
// })
// // in case we disconnect (internet is off or server is down)
// this_top.socket.on('disconnect', function() {
//     console.log('disconnect',this_top.is_reload)
//     if (!this_top.is_reload) {
//         this_top.con_stat.set_server_con_state(this_top.con_states.NOT_CONNECTED)
//         this_top.con_stat.set_user_con_state_opts(false)
//     }
// })
// this_top.socket.on('error', function(obj) {
//   console.log("error", obj);
// });

