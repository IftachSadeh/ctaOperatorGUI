'use strict'
// -------------------------------------------------------------------
/* global $ */
/* global sock */
/* global times */
/* global is_def */
/* global run_when_ready */
/* global add_switch_btn */
/* global add_status_indicator */
/* global add_flex_line */
/* global add_accordion_div */
/* global add_slider */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
$.getScript('/js/utils/common.js', function() {
    let base_app = new BaseApp()
    window.base_app = base_app
    
    let output = base_app.init()
    let is_socket_view = output.is_socket_view

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    if (is_socket_view) {
        $.getScript('/js/utils/setup_view.js', function() {
            $.getScript('/js/utils/SocketManager.js', function() {
                sock.setup_socket()
    
                run_when_ready({
                    pass: function() {
                        return sock.has_joined_session
                    },
                    execute: function() {
                        base_app.setup_opt_socks()
                    },
                    wait: 100,
                })
            })
        })
    }

})


// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
function BaseApp() {
    let this_top = this
    
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init() {
        let widget_name = window.WIDGET_NAME
        let has_side_menu = true
        let is_socket_view = true
        let is_login = widget_name == 'login'

        if (widget_name === 'not_found') {
            console.warn('ready(base-app)...', widget_name)
            // let main_div = document.querySelector('#base_app_div')

            let title_div = document.querySelector('#title_div')
            let menu_div = title_div.appendChild(document.createElement('div'))
            menu_div.classList.add('menu_header')
            menu_div.style = (
                'margin: 5%; font-size: 30px; text-align: left;'
            )
            menu_div.innerHTML = 'Page not found - Redirecting home ...'

            let top_menu_div = document.querySelector('#top_menu_inner')
            top_menu_div.style = 'opacity: 0;'

            has_side_menu = false
            is_socket_view = false
            setTimeout(function() {
                window.location.replace('/' + window.APP_PREFIX + '/index')
            }, 2000)
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        if (widget_name == 'index') {
            let main_div = document.querySelector('#base_app_div')

            let site_nav_menu_div = main_div.appendChild(document.createElement('div'))
            site_nav_menu_div.style = 'width: 60%'

            add_site_nav_menu(site_nav_menu_div)
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        if (is_login) {
            let main_div = document.querySelector('#base_app_div')

            let login_div = main_div.appendChild(document.createElement('div'))
            login_div.style = (
                'padding: 50px; text-align: center; '
                + 'width: 80%; display: block; margin: auto;'
            )

            let form = login_div.appendChild(document.createElement('form'))
            form.id = 'login_form'
            form.style = 'text-align: center; width: 100%;'
            form.classList.add('form')

            let entry, row, th
            let form_table = form.appendChild(document.createElement('table'))
            form_table.classList.add('form-table')

            row = form_table.appendChild(document.createElement('tr'))
            th = row.appendChild(document.createElement('th'))
            th.innerHTML = 'Username'
            th.classList.add('form-label')

            th = row.appendChild(document.createElement('th'))
            entry = th.appendChild(document.createElement('input'))
            entry.id = 'username'
            entry.name = 'username'
            entry.label = 'Username'
            entry.value = 'user0'
            entry.classList.add('form-input')

            row = form_table.appendChild(document.createElement('tr'))
            th = row.appendChild(document.createElement('th'))
            th.innerHTML = 'Password'
            th.classList.add('form-label')

            th = row.appendChild(document.createElement('th'))
            entry = th.appendChild(document.createElement('input'))
            entry.id = 'password'
            entry.name = 'password'
            entry.label = 'Password'
            entry.value = 'xxx'
            entry.type = 'password'
            entry.classList.add('form-input')
            // entry.setAttribute("style", 'font-size: 30px; padding: 15px; text-align: left;')

            // row = form_table.appendChild(document.createElement('tr'))
            // th = row.appendChild(document.createElement('th'))
            entry = form.appendChild(document.createElement('input'))
            entry.type = 'submit'
            entry.value = 'Login'
            entry.focus()
            entry.classList.add('form-btn')

            let msg_div = main_div.appendChild(document.createElement('div'))
            msg_div.innerHTML = (
                'Log-in is implemented for development purposes...<br>'
                + ' Please use username = \'guest\' '
                + 'and a password \'123\' or \'user0\' with \'xxx\''
            )
            msg_div.classList.add('menu_header')
            msg_div.style = (
                'margin: 5%; font-size: 18px; text-align: left;'
            )

            is_socket_view = false
            has_side_menu = false
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let logout_btn_style
        if (is_login) {
            logout_btn_style = 'opacity:0; pointer-events:none;'
        }
        else {
            logout_btn_style = 'opacity:1; pointer-events:auto;'
        }

        let logout_btn_div = document.querySelector('#logout_btn_div')
        logout_btn_div.style = logout_btn_style

        let logout_btn = document.querySelector('#logout_btn')
        logout_btn.onclick = function() {
            window.location.href = 'logout'
        }

        if (!is_login) {
            get_connection_stat_div(false, '').style = 'opacity: 1;'
        }

        if (!is_login) {
            let server_con_stat_div = document.querySelector('#server_con_stat_div')
            let serverConStatStyle = 'opacity:1; pointer-events:auto;'
            server_con_stat_div.style = serverConStatStyle
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let top_menu_div = document.querySelector('#top_menu_left')
        let site_name_div = append_ele_after(
            document.createElement('div'), top_menu_div
        )
        let tog_opt_menu_div = append_ele_after(
            document.createElement('a'), top_menu_div
        )
        let tog_side_menu_div = append_ele_after(
            document.createElement('a'), top_menu_div
        )

        let btns = [
            {
                div: tog_side_menu_div,
                icon: 'fa-bars',
            },
            {
                div: tog_opt_menu_div,
                icon: 'fa-cog',
            },
        ]
        $.each(btns, function(_, d) {
            let div = d.div
            let icon = d.icon
            
            let btn_now = div.appendChild(document.createElement('i'))
            let tog_menu_style = 'margin-right: 10px;'
            if (!has_side_menu) {
                tog_menu_style += (
                    'pointer-events: none; opacity: '
                    + (is_login ? 0 : 0.5) + ';'
                )
            }
            btn_now.style = tog_menu_style
            btn_now.classList.add(
                'fa',
                icon,
                'sized-button',
                'fa-circle-button',
                'fa-circle-button-bright'
            )
        })

        if (!is_login) {
            site_name_div.innerHTML = (
                'CTA ' + (window.SITE_TYPE == 'S' ? 'South' : 'North')
            )
        }
        site_name_div.style = 'opacity:0.8; pointer-events:none;'
        site_name_div.classList.add('menu_header')

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let top_padding_div = document.querySelector('#top_padding_div')
        let top_padding_style = (
            'width: 100%; padding-top: '
            + site_name_div.offsetHeight * 3 + 'px;'
        )
        top_padding_div.style = top_padding_style

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        add_switch_btn({
            main_div: document.querySelector('#user_con_stat_div'),
            top_div_id: 'user_con_stat_div_tog',
            input_id: 'user_con_stat_div_btn',
            checked: true,
            tooltip: {
                text: 'Connection status',
                class_list: [ 'tooltip-bottom-left' ],
            },
        })

        add_status_indicator({
            main_div: document.querySelector('#server_con_stat_div'),
            top_div_id: 'server_con_stat_div_container',
            input_id: 'server_con_stat_div_btn',
            checked: true,
            tooltip: {
                text: 'Server status',
                class_list: [ 'tooltip-bottom-left' ],
            },
        })

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        if (has_side_menu) {
            set_side_menu_div({
                main_div: tog_side_menu_div,
                site_name_div: site_name_div,
                tog_side_menu_div: tog_side_menu_div,
            })
        }

        setup_opt_div({
            main_div: tog_opt_menu_div,
        })

        let output = {
            is_socket_view: is_socket_view,
        }
        return output
    }
    this_top.init = init


    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function set_side_menu_div(opt_in) {
        // let main_div = opt_in.main_div
        let site_name_div = opt_in.site_name_div
        let tog_side_menu_div = opt_in.tog_side_menu_div

        let side_menu_w = '50%'
        let body_back_color = '#ececec'
        let top_menu_back_color = '#383B42'

        let side_menu_div = document.querySelector('#side_menu')
        side_menu_div.style = 'overflow: hidden;'

        let side_menu_back_div = side_menu_div.appendChild(
            document.createElement('div')
        )
        let side_menu_front_div = side_menu_div.appendChild(
            document.createElement('div')
        )

        let side_menu_back_style = (
            'width: 100%; background-color: '
            + top_menu_back_color
            + '; opacity: 0; pointer-events: none; '
            + '; position: fixed; height: 100%; top: 0; '
        )
        side_menu_back_div.style = side_menu_back_style

        let side_menu_front_style = (
            'width: 0%; background-color: ' + body_back_color + ';'
            + ' opacity: 1; position: fixed; top: 0; bottom: 0;'
            + ' padding-top: ' + site_name_div.offsetHeight * 3 + 'px;'
            + ' padding-bottom: ' + site_name_div.offsetHeight * 1 + 'px;'
            + ' overflow-x: hidden; '
        )
        side_menu_front_div.style = side_menu_front_style
        // side_menu_front_div.style.boxShadow = '0 41px 18px 0 rgba(0, 0, 0, 0.2), 0 16px 70px 0 rgba(0, 0, 0, 0.19);'

        let is_side_menu_open = true
        
        let tog_side_menu = function() {
            side_menu_back_div.style.WebkitTransition = 'opacity 0.5s'
            side_menu_back_div.style.MozTransition = 'opacity 0.5s'
            if (is_side_menu_open) {
                side_menu_back_div.style.opacity = '0%'
                side_menu_back_div.style.pointerEvents = 'none'
            }
            else {
                side_menu_back_div.style.opacity = '40%'
                side_menu_back_div.style.pointerEvents = 'auto'
            }

            side_menu_front_div.style.WebkitTransition = 'width 0.3s'
            side_menu_front_div.style.MozTransition = 'width 0.3s'

            if (is_side_menu_open) {
                side_menu_front_div.style.width = '0%'
                side_menu_front_div.style.pointerEvents = 'none'
            }
            else {
                side_menu_front_div.style.width = side_menu_w
                side_menu_front_div.style.pointerEvents = 'auto'
            }

            is_side_menu_open = !is_side_menu_open
            
            return
        }

        tog_side_menu_div.onclick = tog_side_menu
        side_menu_back_div.onclick = tog_side_menu
        tog_side_menu()

        let side_menu_front_inner_div = side_menu_front_div.appendChild(
            document.createElement('div')
        )
        let side_menu_front_inner_style = 'width: 95%' // ' padding-left: 2%; '
        side_menu_front_inner_div.style = side_menu_front_inner_style

        add_site_nav_menu(side_menu_front_inner_div)

        return
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setup_opt_div(opt_in) {
        let main_div = opt_in.main_div

        let opt_menu_w = '80%'
        let is_opt_menu_open = false
        let opt_menu_div = document.querySelector('#general_ops_div')
        let opt_menu_div_style = (
            ''
            + 'position: fixed;'
            + 'top: 60px;'
            // + 'outline: 0.1px solid #d4d2d2;'
            + 'box-shadow: 1px 1px 4px 0px #d4d2d2;'
            + 'overflow: overlay;'
            + 'left: 0px;'
            + 'width:' + opt_menu_w + ';'
            + 'opacity: 0%;'
            + 'min-height: 50px;'
            + 'max-height: 70%;'
            + 'overflow-x: hidden;'
            + 'border-radius: 6px;'
        )
        opt_menu_div.style = opt_menu_div_style
        opt_menu_div.classList.add('floating-div-container')

        let tog_opt_menu = function() {
            opt_menu_div.style.WebkitTransition = 'opacity 0.3s'
            opt_menu_div.style.MozTransition = 'opacity 0.3s'

            if (is_opt_menu_open) {
                opt_menu_div.style.opacity = '0%'
                opt_menu_div.style.pointerEvents = 'none'
            }
            else {
                opt_menu_div.style.opacity = '100%'
                opt_menu_div.style.pointerEvents = 'auto'
            }

            is_opt_menu_open = !is_opt_menu_open

            return
        }

        main_div.onclick = tog_opt_menu

        // for debugging
        let is_open = false
        if (is_open) {
            setTimeout(function() {
                tog_opt_menu()
            }, times.wait_loop)
        }

        // ------------------------------------------------------------------
        // add options categories
        // ------------------------------------------------------------------
        add_placeholder_opts({
            main_div: opt_menu_div,
        })

        return
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setup_opt_socks() {
        let is_simulation = window.sock.session_props.is_simulation
        
        if (is_simulation) {
            let opt_menu_div = document.querySelector('#general_ops_div')
            add_clock_sim_opts({
                main_div: opt_menu_div,
            })

            setup_clock_sim_opt_socks()
        }

        return
    }
    this_top.setup_opt_socks = setup_opt_socks

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function add_placeholder_opts(opt_in) {
        let main_div = opt_in.main_div
        let base_tag = 'placeholder_opts'

        let accordion = add_accordion_div({
            main_div: main_div,
            title_text: 'Placeholder for additional settings...',
            is_open: false,
        })

        // let title_div = accordion.title_div
        let content_div = accordion.content_div

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let short_night_line = add_flex_line({
            main_div: content_div,
        })

        short_night_line.div_left.innerHTML = 'example toggle'

        add_switch_btn({
            main_div: short_night_line.div_right,
            top_div_id: base_tag + '_placeholder_opts_container',
            input_id: base_tag + '_placeholder_opts',
            checked: true,
        })
     
        return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function add_clock_sim_opts(opt_in) {
        let main_div = opt_in.main_div
        let base_tag = 'clock_sim_opts'

        // for debugging
        let is_open = true
        
        let accordion = add_accordion_div({
            main_div: main_div,
            title_text: 'Clock simulation:',
            is_open: is_open,
        })

        // let title_div = accordion.title_div
        let content_div = accordion.content_div
        
        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let skip_daytime_line = add_flex_line({
            main_div: content_div,
        })

        skip_daytime_line.div_left.innerHTML = 'Skip daytime'

        add_switch_btn({
            main_div: skip_daytime_line.div_right,
            top_div_id: base_tag + '_skip_daytime_container',
            input_id: base_tag + '_skip_daytime',
            checked: true,
        })

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let short_night_line = add_flex_line({
            main_div: content_div,
        })

        short_night_line.div_left.innerHTML = 'Shorten night'

        add_switch_btn({
            main_div: short_night_line.div_right,
            top_div_id: base_tag + '_short_night_container',
            input_id: base_tag + '_short_night',
            checked: true,
            // tooltip: {
            //     text: 'ssssssssssssss',
            //     class_list: ['tooltip-top-right'],
            // },
        })

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let slider_line = add_flex_line({
            main_div: content_div,
        })

        slider_line.div_left.innerHTML = 'Speed factor (real to simulated [sec] ratio)'

        add_slider({
            main_div: slider_line.div_right,
            top_div_id: base_tag + '_slider_container',
            slider_id: base_tag + '_slider',
            slider_type: 'range',
            input_text: {
                id: base_tag + '_text',
                is_before: true,
                size: 3,
            },
            // hover_ranges: {
            // },
            // tooltip: {
            //     text: 'ssssssssssssss',
            //     class_list: ['tooltip-top-right'],
            // },
        })

        return
    }


    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setup_clock_sim_opt_socks() {
        let base_tag = 'clock_sim_opts'
        let socket = window.sock.socket

        let slider = document.querySelector('#' + base_tag + '_slider')
        let text = document.querySelector('#' + base_tag + '_text')

        let tog_skip_daytime = document.querySelector('#' + base_tag + '_skip_daytime')
        let tog_short_night = document.querySelector('#' + base_tag + '_short_night')

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        text.addEventListener('change', function(e) {
            let value = e.srcElement.value
            if (value < slider.min || value > slider.max) {
                value = Math.min(Math.max(value, slider.min), slider.max)
                text.value = value
            }

            update_eles({
                speed_factor: value,
                div_id: this.id,
            })
            update_server({
                speed_factor: value,
            })
            return
        })

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        slider.addEventListener('change', function(e) {
            update_eles({
                speed_factor: e.srcElement.value,
                div_id: this.id,
            })
            update_server({
                speed_factor: e.srcElement.value,
            })
            return
        })

        let is_mouse_down = false
        slider.addEventListener('mousedown', function(_) {
            is_mouse_down = true
            return
        })
        slider.addEventListener('mouseup', function(_) {
            is_mouse_down = false
            return
        })
        slider.addEventListener('mousemove', function(e) {
            if (!is_mouse_down) {
                return
            }
            update_eles({
                speed_factor: e.srcElement.value,
                div_id: this.id,
            })
            return
        })

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        tog_skip_daytime.addEventListener('change', function(e) {
            update_server({
                is_skip_daytime: e.srcElement.checked,
            })
            return
        })

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        tog_short_night.addEventListener('change', function(e) {
            update_server({
                is_short_night: e.srcElement.checked,
            })
            return
        })
        
        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let updt_eles = [ slider, text ]
        function update_eles(opt_in) {
            let div_id = opt_in.id
            let speed_factor = opt_in.speed_factor
            let min_speed_factor = opt_in.min_speed_factor
            let max_speed_factor = opt_in.max_speed_factor
            let is_skip_daytime = opt_in.is_skip_daytime
            let is_short_night = opt_in.is_short_night

            // update slider range before value
            if (is_def(min_speed_factor)) {
                slider.min = min_speed_factor
            }
            if (is_def(max_speed_factor)) {
                slider.max = max_speed_factor
            }
            
            // update slider value
            $.each(updt_eles, function(_, d) {
                if (d.id != div_id) {
                    d.value = speed_factor
                }
            })

            // update toggles
            if (is_def(is_skip_daytime)) {
                tog_skip_daytime.checked = is_skip_daytime
            }
            if (is_def(is_short_night)) {
                tog_short_night.checked = is_short_night
            }

            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function update_server(opt_in) {
            let speed_factor = opt_in.speed_factor
            let is_skip_daytime = opt_in.is_skip_daytime
            let is_short_night = opt_in.is_short_night
            let data_emit = {
                data: {
                    speed_factor: speed_factor,
                    is_skip_daytime: is_skip_daytime,
                    is_short_night: is_short_night,
                },
            }
            socket.emit('set_sim_clock_sim_params', data_emit)

            return
        }

        socket.on('get_sim_clock_sim_params', function(data_in) {
            let data = {
                speed_factor: data_in.data.speed_factor,
                min_speed_factor: data_in.data.min_speed_factor,
                max_speed_factor: data_in.data.max_speed_factor,
                is_skip_daytime: data_in.data.is_skip_daytime,
                is_short_night: data_in.data.is_short_night,
            }
            update_eles(data)
        })

        setTimeout(function() {
            let data_emit = {
                sess_id: window.sock.session_props.sess_id,
            }
            socket.emit('get_sim_clock_sim_params', data_emit)
        }, times.wait_loop)

        // data_emit = {
        //     data: {
        //         speed_factor: 999,
        //     },
        // }
        // socket.emit('set_sim_clock_sim_params', data_emit)


        return
    }


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function get_connection_stat_div(is_server, tag) {

        if (is_server) {
            return document.querySelector('#' + 'server_con_stat_div' + tag)
        }
        else {
            return document.querySelector('#' + 'user_con_stat_div' + tag)
        }
    }
    this.get_connection_stat_div = get_connection_stat_div

    // let userName_div = document.querySelector("#"+"userName_div")
    // if(window.USER_ID !== 'None') {
    //   userName_div.innerHTML = window.USER_ID
    //   userName_div.style.opacity = '80%'
    // }
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
function append_ele_after(new_ele, target_ele) {
    // target is what you want it to go after. Look for this elements parent.
    let parent = target_ele.parentNode

    // if the parents lastchild is the target_ele...
    if (parent.lastChild == target_ele) {
        // add the new_ele after the target element.
        return parent.appendChild(new_ele)
    }
    else {
        // else the target has siblings, insert the new
        // element between the target and it's next sibling.
        return parent.insertBefore(new_ele, target_ele.nextSibling)
    }
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
function add_site_nav_menu(parent_ele) {
    let side_menu_btn_grb_div = parent_ele.appendChild(document.createElement('div'))
    side_menu_btn_grb_div.classList.add('site-nav-btn-group')

    let btns = [
        {
            text: 'Development',
            on_click: function() {
                window.location.href = 'view102'
            },
        },
        {
            text: 'Home',
            on_click: function() {
                window.location.href = 'index'
            },
        },
        {
            text: 'Array zoomer',
            on_click: function() {
                window.location.href = 'view200'
            },
        },
        {
            text: 'Plots Dashboard',
            on_click: function() {
                window.location.href = 'view201'
            },
        },
        {
            text: 'Sub-array pointings',
            on_click: function() {
                window.location.href = 'view202'
            },
        },
        {
            text: 'Observation blocks',
            on_click: function() {
                window.location.href = 'view204'
            },
        },
        {
            text: 'Scheduling Block Control',
            on_click: function() {
                window.location.href = 'view206'
            },
        },
        {
            text: 'Weather Monitoring',
            on_click: function() {
                window.location.href = 'view207'
            },
        },
        {
            text: 'Comment Night Schedule',
            on_click: function() {
                window.location.href = 'view205'
            },
        },
        {
            text: 'Panel synchronization',
            on_click: function() {
                window.location.href = 'view203'
            },
        },
        {
            text: 'Empty Example',
            on_click: function() {
                window.location.href = 'view000'
            },
        },
    ]

    $.each(btns, function(i, d) {
        let side_menu_btn = side_menu_btn_grb_div.appendChild(
            document.createElement('button')
        )
        side_menu_btn.classList.add('site-nav-btn')

        side_menu_btn.onclick = d.on_click

        let btn_text = side_menu_btn.appendChild(document.createElement('div'))
        btn_text.innerHTML = d.text
        btn_text.classList.add('site-nav-btn-text')
    })
}

