'use strict'
// -------------------------------------------------------------------
/* global $ */
/* global io */
/* global d3 */
/* global times */
/* global unique */
/* global is_def */
/* global baseApp */
/* global deep_copy */
/* global setup_view */
/* global icon_badge */
/* global run_loop_com */
/* global dom_add */
/* global run_when_ready */
/* global loaded_scripts */

// -------------------------------------------------------------------
// setup the socket and load resources
// ---------------------------------------------------------------------------
// basice setup of the righ-side drawer menu
// let baseApp = document.querySelector("#baseApp");
// baseApp.paper_drawerPanel1().drawerWidth  = "40%";
// baseApp.paper_drawerPanel1().disableSwipe = true;
// baseApp.paper_drawerPanel1().force_narrow  = true;
// baseApp.topRightMenuTog  ().setAttribute("style","");

// document.getElementById('topRightMenuTog').setAttribute("style","");

// ---------------------------------------------------------------------------
// manager for sockets
// ---------------------------------------------------------------------------
function SocketManager () {
  let this_top = this
  let is_debug = true
  // let gsIdV = []
  let init_views = {}
  let is_south = window.__site_type__ === 'S'
  let server_name = null
  let baseApp = window.baseApp
  let tab_table_title_id = 'table_title'
  let tab_table_main_id = 'table_content'
  this.socket = null
  this.con_stat = null
  this.all_widgets = {}
  this.widget_table = {}

  // ---------------------------------------------------------------------------
  // the socket
  // ---------------------------------------------------------------------------
  function setup_socket () {
    let widget_name = window.__widget_name__
    this_top.socket = io.connect('/' + widget_name)

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    this_top.socket.on('initial_connect', function (data_in) {
      // console.log("initial_connect");
      // console.log('initial_connect',data_in);

      let tel_info = {}
      tel_info.tel_ids = data_in.tel_ids
      tel_info.tel_id_to_types = data_in.tel_id_to_types
      window.__socktel_info__ = tel_info

      validate_server(data_in.server_name)

      let sockId = this.socket.sessionid

      this_top.is_reload = false
      this_top.socket.emit('join_session', sockId)

      this_top.con_stat = new connection_state()
      this_top.con_stat.set_server_con_state(true)
      this_top.con_stat.set_user_con_state_opts(true)

      check_is_offline()
      check_is_hidden()
      check_was_offline()
    })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    this_top.socket.on('reconnect', function (data_in) {
      // console.log('reconnect',data_in);
      this_top.is_reload = false
      validate_server(data_in.server_name)
    })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function validate_server (name_in) {
      if (server_name == null) server_name = name_in
      else if (server_name !== name_in) {
        window.location.reload()
      }
    }

    function is_socket_connected() {
      return this_top.socket.socket.connected
    }
    this_top.is_socket_connected = is_socket_connected

    // -------------------------------------------------------------------
    // if the window/tab is hidden (minimized or another tab is focused), then flush the time
    // function -> execute all zero-delay transitions at once. If this is not running on a loop forever
    // then updates on a hidden tab will not go through in real-time (see: https://github.com/d3/d3-timer)
    // -------------------------------------------------------------------
    function check_is_hidden () {
      setTimeout(function () {
        if (document.hidden) d3.timerFlush()
        check_is_hidden()
      }, 5000)
    }

    // -------------------------------------------------------------------
    // ask for wakeup data if returning from an offline state
    // -------------------------------------------------------------------
    function check_is_offline () {
      setTimeout(function () {
       is_socket_connected  = this_top.is_socket_connected()
       this_top.con_stat.set_server_con_state(is_socket_connected)
        // if(!is_socket_connected) {
        //   if (this_top.con_stat.user_btn.checked) {
        //     this_top.con_stat.set_user_con_state_opts(false)
        //   }
        // }
        check_is_offline()
      }, 500)
    }

    let socket_was_offline = false
    function check_was_offline () {
      setTimeout(function () {
        let is_offline = this_top.con_stat.is_offline()
        if (is_offline) socket_was_offline = true

        if (socket_was_offline) {
          if (!is_offline) {
            socket_was_offline = false
            if (is_def(this_top.socket)) {
              this_top.socket.emit('back_from_offline')
            }
          }
        }
        check_was_offline()
      }, 500)
    }


    // -------------------------------------------------------------------
    // upon leaving the session or leaving the page
    // -------------------------------------------------------------------
    window.addEventListener('beforeunload', function (event, do_reload) {
      this_top.is_reload = true
      // explicitly needed for firefox, but good in any case...
      if (this_top.socket) {
        this_top.socket.disconnect()
        this_top.socket = null
      }
      if (is_debug) {
        window.location.reload() // clear cache
      }
    })

    // in case we disconnect (internet is off or server is down)
    this_top.socket.on('disconnect', function () {
      // console.log('disconnect',this_top.is_reload)
      if (!this_top.is_reload) {
        this_top.con_stat.set_server_con_state(false)
        this_top.con_stat.set_user_con_state_opts(false)
      }
    })

    // this_top.socket.on('error', function(obj) {
    //   console.log("error", obj);
    // });

    // -------------------------------------------------------------------
    // run the respective get_sync_state() function for each widget
    // -------------------------------------------------------------------
    this_top.socket.on('get_sync_state', function (data_in) {
      if (this_top.con_stat.is_offline()) return

      $.each(this_top.all_widgets, function (index0, ele0) {
        $.each(ele0.widgets, function (index1, ele1) {
          if (is_def(ele1.get_sync_state)) ele1.get_sync_state(data_in)
        })
      })
    })

    // // -------------------------------------------------------------------
    // // -------------------------------------------------------------------
    // // for development...
    // // -------------------------------------------------------------------
    // this_top.socket.on('refreshAll', function (data) {
    //   if (widget_name !== 'view_refresh_all') {
    //     is_debug = false // prevent double reloadding
    //     window.location.reload()
    //   }
    // })
    // // -------------------------------------------------------------------
    // // -------------------------------------------------------------------

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let has_loaded = false
    this_top.socket.on('join_session_data', function (data) {
      if (!has_loaded) {
        if (is_def(setup_view[widget_name])) {
          setup_view[widget_name]()
        }
        has_loaded = true
      }
    })
  }
  this.setup_socket = setup_socket

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function connection_state (is_connect) {
    let is_server_on_XXX = false
    let is_user_on_XXX = true
    let off_opacity = '40%'

    let server_btn = baseApp.getConStat_div(true, '_btn')
    let user_btn = baseApp.getConStat_div(false, '_btn')
    let user_tog = baseApp.getConStat_div(false, '_tog')

    this.user_btn = user_btn

    function set_server_con_state (is_con) {
      is_server_on_XXX = is_con
      if(is_con) {
        server_btn.classList.add('status-indicator-on')
      }
      else {
        server_btn.classList.remove('status-indicator-on')
      }
      return
    }
    this.set_server_con_state = set_server_con_state

    function set_user_con_state_opts(is_con) {
      if (is_con) {
        user_tog.setAttribute('style', 'opacity:1;')
      } else {
        user_tog.setAttribute(
          'style',
          'opacity: ' + off_opacity + '; pointer-events: none;'
        )
      }
      return
    }
    this.set_user_con_state_opts = set_user_con_state_opts

    user_btn.addEventListener('change', function (customEvent) {
      is_user_on_XXX = customEvent.target.checked
      return
    })

    function is_offline () {
      let out = false
      if(!this_top.is_socket_connected()) {
        out = true
      }
      else if (document.hidden) {
        out = true
      }
      else if (!is_server_on_XXX || !is_user_on_XXX) {
        out = true
      }
      // console.log('-is_offline-',out, this_top.is_socket_connected())
      return out
    }
    this.is_offline = is_offline

    return
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function sock_sync_state_send (opt_in) {
    if (document.hidden) return
    if (this_top.con_stat.is_offline()) return

    let data_now = {}
    data_now.NS = opt_in.NS
    data_now.widget_id = opt_in.widget_id
    data_now.type = opt_in.type
    data_now.data = opt_in.data

    if (is_def(this_top.socket)) this_top.socket.emit('sync_state_send', data_now)
  }
  this.sock_sync_state_send = sock_sync_state_send

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function is_same_sync (prev_sync, data_in) {
    if (!is_def(prev_sync[data_in.type])) return false

    let is_same = true
    $.each(data_in, function (tag_now, obj_now) {
      if (tag_now !== 'syncTime') {
        if (!(prev_sync[data_in.type][tag_now] === obj_now)) is_same = false
      }
    })
    return is_same
  }
  this.is_same_sync = is_same_sync

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function is_old_sync (prev_sync, data_in) {
    if (!is_def(prev_sync[data_in.type])) return false

    return prev_sync[data_in.type].syncTime >= data_in.syncTime
  }
  this.is_old_sync = is_old_sync

  // -------------------------------------------------------------------
  // the server keeps the id of the current active widget, 
  // to avoid sending spurious sync events
  // -------------------------------------------------------------------
  let wait_mouse_move = 250
  let prev_mouse_move = Date.now()
  function emit_mouse_move (opt_in) {
    let eleIn
    if (
      (typeof opt_in.eleId === 'string' || opt_in.eleId instanceof String) &&
      is_def(opt_in.eleId)
    ) {
      eleIn = opt_in.eleId
      if (!(eleIn.indexOf('#') === 0)) eleIn = '#' + eleIn
    } else {
      eleIn = opt_in.eleIn
    }

    $(eleIn).mousemove(function (e) {
      if (Date.now() - prev_mouse_move < wait_mouse_move) return
      prev_mouse_move = Date.now()

      if (!this_top.con_stat.is_offline() && is_def(this_top.socket)) {
        this_top.socket.emit('set_active_widget', opt_in.data)
      }
      // console.log("onmousemove",opt_in.data.widget_id)
    })
  }
  this.emit_mouse_move = emit_mouse_move
  // $(document).mouseenter(function () { console.log('in'); });
  // $(document).mouseleave(function () { console.log('out'); });

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function set_socket_module (opt_in) {
    let widget_id = opt_in.widget_id
    let widget_type = opt_in.widget_type
    let widget_func = opt_in.widget_func
    let widget_source = opt_in.widget_source

    let is_first = !is_def(this_top.all_widgets[widget_type])

    if (is_first) this_top.all_widgets[widget_type] = { sock_func: null, widgets: {} }

    if (!is_def(this_top.all_widgets[widget_type].widgets[widget_id])) {
      this_top.all_widgets[widget_type].widgets[widget_id] = new widget_func.main_func(
        opt_in
      )
      init_views[widget_id] = false

      if (is_first) {
        this_top.all_widgets[widget_type].sock_func = new widget_func.sock_func(opt_in)

        // common sicket calls, which should be added only once!
        this_top.socket.on('init_data', function (data_in) {
          if (data_in.widget_type === widget_type) {
            if (is_def(this_top.all_widgets[widget_type].widgets[data_in.widget_id])) {
              this_top.all_widgets[widget_type].widgets[data_in.widget_id].init_data(
                data_in
              )
              init_views[data_in.widget_id] = true
            }
          }
        })

        this_top.socket.on('update_data', function (data_in) {
          if (this_top.con_stat.is_offline()) return
          if (data_in.widget_type !== widget_type) return

          let n_wigit_now = 0
          let n_wigits = Object.keys(this_top.all_widgets[widget_type].widgets).length

          $.each(this_top.all_widgets[widget_type].widgets, function (
            widget_id_now,
            module_now
          ) {
            if (data_in.sess_widget_ids.indexOf(widget_id_now) >= 0) {
              // make sure we dont sent the same data twice (as it could be modified)
              n_wigit_now += 1
              let data_update =
                n_wigits === 1 || n_wigit_now === n_wigits
                  ? data_in
                  : deep_copy(data_in)

              this_top.all_widgets[widget_type].widgets[widget_id_now].update_data(
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
        method_name: 'setup'
      })
    }

    return this_top.all_widgets[widget_type].widgets[widget_id]
  }
  // this.set_socket_module = set_socket_module;

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function multiple_inits (opt_in) {
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
  this.multiple_inits = multiple_inits

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function set_icon_badge (opt_in) {
    if (is_def(opt_in.icon_divs)) {
      $.each(opt_in.icon_divs, function (index, icon_div_now) {
        icon_badge.set_widget_icon({ icon_div: icon_div_now, n_icon: opt_in.n_icon })
      })
    }
  }
  this.set_icon_badge = set_icon_badge

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function add_widget (opt_in) {
    let name_tag = opt_in.name_tag
    let table_title = opt_in.table_title
    // let has_drawer = opt_in.has_drawer
    let has_icon = opt_in.has_icon

    let main_script_name = '/js/widgets/' + name_tag + '.js'

    let main_div = document.querySelector('#base_app')
    let icon_divs = [null, null]

    // create the table element
    let tab_table_id = unique()
    let widget_id = unique()
    let main_id = widget_id + 'main'
    let gs_name = tab_table_id + 'tbl'

    if (has_icon) icon_divs[0] = { id: main_id + 'icon_div' }
    // if (has_drawer) icon_divs[1] = { id: sideId + 'icon_div' }

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
    window.load_script({ source: name_tag, script: main_script_name })

    run_when_ready({
      pass: function () {
        let intersect = loaded_scripts.queued.filter(n =>
          loaded_scripts.loaded.includes(n)
        )
        return intersect.length === loaded_scripts.queued.length
      },
      execute: set_widgit
    })

    // -------------------------------------------------------------------
    // create the side-menu and widget
    // -------------------------------------------------------------------
    function set_widgit () {
      let widget_opt = {
        name_tag: name_tag,
        widget_id: widget_id,
        base_name: name_tag + widget_id,
        gs_name: gs_name,
        tab_table: tab_table_NEW,
        // sideId: sideId,
        icon_divs: icon_divs,
        is_south: is_south,
        widget: null,
        widget_func: null,
        widget_div_id: null,
        ele_props: null
      }

      this_top.widget_table[name_tag](widget_opt)
    }

    // // -------------------------------------------------------------------
    // // after setting up the event listners, can finally add the element
    // // -------------------------------------------------------------------
    // gsIdV.push({ tab_table: tab_table_NEW, gs_name: gs_name })
    // winResize()
  }
  this.add_widget = add_widget

  // -------------------------------------------------------------------
  // create the side-menu and widget
  // -------------------------------------------------------------------
  function add_to_table (opt_in) {
    let widget_type = opt_in.name_tag
    let widget_source = widget_type
    // let widget_source = 'widget_' + widget_type
    let widget_func = opt_in.widget_func
    let base_name = opt_in.base_name
    let gs_name = opt_in.gs_name
    let widget_id = opt_in.widget_id
    let tab_table = opt_in.tab_table
    let icon_divs = opt_in.icon_divs
    // let sideId = opt_in.sideId
    let ele_props = opt_in.ele_props
    let widget_div_id = opt_in.widget_div_id
    let widget_types = Object.keys(opt_in.ele_props)
    let setup_data = opt_in.setup_data

    let widget_ele = []
    $.each(widget_types, function (index, data_now) {
      widget_ele.push(null)
      
      let tab_table_main = tab_table.querySelector("#" + tab_table_main_id)
      tab_table_main.setAttribute(
        'class', 
        (ele_props[data_now].is_dark_ele 
          ? ' class: grid_ele_dark' : ' class: grid_eleBody')
      )
      
      let item_now = tab_table.
        querySelector("#" + tab_table_main_id).
        appendChild(document.createElement('div'))
      item_now.innerHTML = ele_props[data_now]["content"]

      let widget_index = 0
      let widget_tag = null
      $.each(widget_types, function (index, data_now1) {
        if (ele_props[data_now]['gsId'] === widget_div_id + data_now1) {
          widget_index = index
          widget_tag = data_now1
        }
      })

      if (!is_def(widget_tag)) return

      let Widget_func_now = function () {
        this.get_ele = function (tag) {
          return item_now.querySelector('#' + tag)
        }
      }
      let widget_func_now = new Widget_func_now()

      widget_ele[widget_index] = {
        id: widget_tag,
        widget: widget_func_now,
        w: ele_props[widget_tag].w,
        h: ele_props[widget_tag].h
      }

      let gs_w = ele_props[widget_tag].w
      let gs_h = ele_props[widget_tag].h

      var ow = item_now.offsetWidth
      // var h0 = ow * 0.08
      var w_tot = 12
      var w0 = gs_w / w_tot
      var width = (100 * w0) + '%'
      // var width = 100 * w0 - 0.5 + '%'
      // var height = h0 * gs_h + 'px'
      // var maxHeight = $(document).height() * 0.8
      let item_now_style =
        'width:'
        + width
        // + '; height:'
        // + height
        // + '; max-height:'
        // + maxHeight
        // + 'px'
      item_now.setAttribute('style', item_now_style)
      item_now.classList.add('table_item')
      // tab_table._add_widget(gs_name, ele_props[data_now])
    })

    // -------------------------------------------------------------------
    run_when_ready({
      pass: function () {
        let n_ready = 0
        $.each(widget_types, function (index, data_now) {
          if (is_def(widget_ele[index])) n_ready += 1
        })
        return n_ready === widget_types.length
      },
      execute: function () {
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
      fail_log: function () {
        console.error([
          'cant initialize widgit ' + widget_type + ' with:',
          widget_id
        ])
      }
    })
  }
  this.add_to_table = add_to_table

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
  //     if (Date.now() - prevResize < times.anim_arc) {
  //       resizeNow()
  //       return
  //     }

  //     prevResize = Date.now()
  //     $.each(gsIdV, function (index, gsNow) {
  //       gsNow.tab_table.setAllWidgetWH(gsNow.gs_name)
  //     })
  //   }

  //   $.each(gsIdV, function (index, gsNow) {
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
}

// -------------------------------------------------------------------
// the global instance of the socket manager
// -------------------------------------------------------------------
window.sock = new SocketManager()