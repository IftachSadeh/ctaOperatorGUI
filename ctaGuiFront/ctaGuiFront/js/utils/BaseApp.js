'use strict'
// -------------------------------------------------------------------
/* global $ */

function BaseApp() {
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init(opt_in) {
        let widget_name = opt_in.widget_name
        let has_side_menu = true
        let is_socket_view = true
        let is_login = widget_name == 'login'

        if (widget_name === 'not_found') {
            console.warn('ready(base-app)...', widget_name)
            // let main_div = document.querySelector('#base_app_div')

            let title_div = document.querySelector('#title_div')
            let menu_div = title_div.appendChild(document.createElement('div'))
            menu_div.classList.add('menu_header')
            menu_div.setAttribute(
                'style',
                'margin: 5%; font-size: 30px; text-align: left;'
            )
            menu_div.innerHTML = 'Page not found - Redirecting home ...'

            let top_menu_div = document.querySelector('#top_menu_inner')
            top_menu_div.setAttribute('style', 'opacity: 0;')

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
            site_nav_menu_div.setAttribute('style', 'width: 60%')

            add_site_nav_menu(site_nav_menu_div)
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        if (is_login) {
            let main_div = document.querySelector('#base_app_div')

            let login_div = main_div.appendChild(document.createElement('div'))
            login_div.setAttribute(
                'style',
                'padding: 50px; text-align: center; '
                + 'width: 80%; display: block; margin: auto;'
            )

            let form = login_div.appendChild(document.createElement('form'))
            form.id = 'login_form'
            form.setAttribute('style', 'text-align: center; width: 100%;')
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
            msg_div.setAttribute(
                'style',
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
        logout_btn_div.setAttribute('style', logout_btn_style)

        let logout_btn = document.querySelector('#logout_btn')
        logout_btn.onclick = function() {
            window.location.href = 'logout'
        }

        if (!is_login) {
            get_connection_stat_div(false, '').setAttribute('style', 'opacity: 1;')
        }

        if (!is_login) {
            let server_con_stat_div = document.querySelector('#server_con_stat_div')
            let serverConStatStyle = 'opacity:1; pointer-events:auto;'
            server_con_stat_div.setAttribute('style', serverConStatStyle)
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let top_menu_div = document.querySelector('#top_menu_left')
        let tog_menu_div = append_ele_after(document.createElement('a'), top_menu_div)
        let site_name_div = append_ele_after(document.createElement('div'), tog_menu_div)

        let tog_menu = tog_menu_div.appendChild(document.createElement('i'))
        let tog_menu_style = 'margin-right: 10px;'
        if (!has_side_menu) {
            tog_menu_style += (
                'pointer-events: none; opacity: '
                + (is_login ? 0 : 0.5) + ';'
            )
        }
        tog_menu.setAttribute('style', tog_menu_style)
        tog_menu.classList.add(
            'fa',
            'fa-bars',
            'sized-button',
            'fa-circle-button',
            'fa-circle-button-bright'
        )

        if (!is_login) {
            site_name_div.innerHTML = (
                'CTA ' + (window.SITE_TYPE == 'S' ? 'South' : 'North')
            )
        }
        site_name_div.setAttribute('style', 'opacity:0.8; pointer-events:none;')
        site_name_div.classList.add('menu_header')

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let top_padding_div = document.querySelector('#top_padding_div')
        let top_padding_style = (
            'width: 100%; padding-top: '
            + site_name_div.offsetHeight * 3 + 'px;'
        )
        top_padding_div.setAttribute('style', top_padding_style)

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let side_menu_w = '50%'
        let body_back_color = '#ececec'
        let top_menu_back_color = '#383B42'

        if (has_side_menu) {
            let side_menu_div = document.querySelector('#side_menu')
            side_menu_div.setAttribute('style', 'overflow: hidden;')

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
            side_menu_back_div.setAttribute('style', side_menu_back_style)

            let side_menu_front_style = (
                'width: 0%; background-color: ' + body_back_color + ';'
                + ' opacity: 1; position: fixed; top: 0; bottom: 0;'
                + ' padding-top: ' + site_name_div.offsetHeight * 3 + 'px;'
                + ' padding-bottom: ' + site_name_div.offsetHeight * 1 + 'px;'
                + ' overflow-x: hidden; '
            )
            side_menu_front_div.setAttribute('style', side_menu_front_style)
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
                // side_menu_front_div.style.WebkitTransition = 'width 0.6s';
                // side_menu_front_div.style.MozTransition = 'width 0.6s';

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

            tog_menu_div.onclick = tog_side_menu
            side_menu_back_div.onclick = tog_side_menu
            tog_side_menu()

            let side_menu_front_inner_div = side_menu_front_div.appendChild(
                document.createElement('div')
            )
            let side_menu_front_inner_style = 'width: 95%' // ' padding-left: 2%; '
            side_menu_front_inner_div.setAttribute(
                'style', side_menu_front_inner_style
            )

            add_site_nav_menu(side_menu_front_inner_div)
        }

        if (is_socket_view) {
            $.getScript('/js/utils/setup_view.js')
        }
    }
    this.init = init

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
            onclick: function() {
                window.location.href = 'view102'
            },
        },
        {
            text: 'Home',
            onclick: function() {
                window.location.href = 'index'
            },
        },
        {
            text: 'Array zoomer',
            onclick: function() {
                window.location.href = 'view200'
            },
        },
        {
            text: 'Plots Dashboard',
            onclick: function() {
                window.location.href = 'view201'
            },
        },
        {
            text: 'Sub-array pointings',
            onclick: function() {
                window.location.href = 'view202'
            },
        },
        {
            text: 'Observation blocks',
            onclick: function() {
                window.location.href = 'view204'
            },
        },
        {
            text: 'Scheduling Block Control',
            onclick: function() {
                window.location.href = 'view206'
            },
        },
        {
            text: 'Weather Monitoring',
            onclick: function() {
                window.location.href = 'view207'
            },
        },
        {
            text: 'Comment Night Schedule',
            onclick: function() {
                window.location.href = 'view205'
            },
        },
        {
            text: 'Panel synchronization',
            onclick: function() {
                window.location.href = 'view203'
            },
        },
        {
            text: 'Empty Example',
            onclick: function() {
                window.location.href = 'view000'
            },
        },
    ]

    $.each(btns, function(i, d) {
        let side_menu_btn = side_menu_btn_grb_div.appendChild(
            document.createElement('button')
        )
        side_menu_btn.classList.add('site-nav-btn')

        side_menu_btn.onclick = d.onclick

        let btn_text = side_menu_btn.appendChild(document.createElement('div'))
        btn_text.innerHTML = d.text
        btn_text.classList.add('site-nav-btn-text')
    })
}

window.base_app = new BaseApp()
