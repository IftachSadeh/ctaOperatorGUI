'use strict'
// -------------------------------------------------------------------
/* global $ */

function BaseApp () {
  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function init (opt_in) {
    let widget_name = opt_in.widget_name
    let hasSideMenu = true
    let is_socket_view = true
    let isLogin = widget_name == 'login'

    if (widget_name === 'not_found') {
      console.warn('ready(base-app)...', widget_name)
      let main_div = document.querySelector('#base_app')

      let title_div = document.querySelector('#title_div')
      let menu_div = title_div.appendChild(document.createElement('div'))
      menu_div.classList.add('menu_header')
      menu_div.setAttribute(
        'style',
        'margin: 5%; font-size: 30px; text-align: left;'
      )
      menu_div.innerHTML = 'Page not found - Redirecting home ...'

      let topMenu_div = document.querySelector('#top_menu_inner')
      topMenu_div.setAttribute('style', 'opacity: 0;')

      hasSideMenu = false
      is_socket_view = false
      setTimeout(function () {
        window.location.replace('/' + window.__app_prefix__ + '/index')
      }, 2000)
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    if (widget_name == 'index') {
      let main_div = document.querySelector('#base_app')

      let siteNavMenu_div = main_div.appendChild(document.createElement('div'))
      siteNavMenu_div.setAttribute('style', 'width: 60%')

      addSiteNavMenu(siteNavMenu_div)
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    if (isLogin) {
      let main_div = document.querySelector('#base_app')

      let login_div = main_div.appendChild(document.createElement('div'))
      login_div.setAttribute(
        'style',
        'padding: 50px; text-align: center; width: 80%; display: block; margin: auto;'
      )

      let form = login_div.appendChild(document.createElement('form'))
      form.id = 'login_form'
      form.setAttribute('style', 'text-align: center; width: 100%;')
      form.classList.add('form')

      let entry, row, th
      let formTbl = form.appendChild(document.createElement('table'))
      formTbl.classList.add('form-table')

      row = formTbl.appendChild(document.createElement('tr'))
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

      row = formTbl.appendChild(document.createElement('tr'))
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

      // row = formTbl.appendChild(document.createElement('tr'))
      // th = row.appendChild(document.createElement('th'))
      entry = form.appendChild(document.createElement('input'))
      entry.type = 'submit'
      entry.value = 'Login'
      entry.focus()
      entry.classList.add('form-btn')

      let msg_div = main_div.appendChild(document.createElement('div'))
      msg_div.innerHTML =
        'Log-in is implemented for development purposes...<br>' +
        " Please use username = 'guest' and a password '123' or 'user0' with 'xxx'"
      msg_div.classList.add('menu_header')
      msg_div.setAttribute(
        'style',
        'margin: 5%; font-size: 18px; text-align: left;'
      )

      is_socket_view = false
      hasSideMenu = false
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let logout_btn_style
    if (isLogin) logout_btn_style = 'opacity:0; pointer-events:none;'
    else logout_btn_style = 'opacity:1; pointer-events:auto;'

    let logout_btn_div = document.querySelector('#logout_btn_div')
    logout_btn_div.setAttribute('style', logout_btn_style)

    let logout_btn = document.querySelector('#logout_btn')
    logout_btn.onclick = function () {
      window.location.href = 'logout'
    }

    if (!isLogin) {
      getConStat_div(false, '').setAttribute('style', 'opacity: 1;')
    }

    if (!isLogin) {
      let server_con_stat_div = document.querySelector('#server_con_stat_div')
      let serverConStatStyle = 'opacity:1; pointer-events:auto;'
      server_con_stat_div.setAttribute('style', serverConStatStyle)
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let topMenu_div = document.querySelector('#top_menu_left')
    let togMenu_div = append_ele_after(document.createElement('a'), topMenu_div)
    let siteName_div = append_ele_after(document.createElement('div'), togMenu_div)

    let togMenu = togMenu_div.appendChild(document.createElement('i'))
    let togMenuStyle = 'margin-right: 10px;'
    if (!hasSideMenu) {
      togMenuStyle +=
        'pointer-events: none; opacity: ' + (isLogin ? 0 : 0.5) + ';'
    }
    togMenu.setAttribute('style', togMenuStyle)
    togMenu.classList.add(
      'fa',
      'fa-bars',
      'sized-button',
      'fa-circle-button',
      'fa-circle-button-bright'
    )

    if (!isLogin) {
      siteName_div.innerHTML =
        'CTA ' + (window.__site_type__ == 'N' ? 'North' : 'South')
    }
    siteName_div.setAttribute('style', 'opacity:0.8; pointer-events:none;')
    siteName_div.classList.add('menu_header')

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let top_padding_div = document.querySelector('#top_padding_div')
    let topPaddingStyle =
      'width: 100%; padding-top: ' + siteName_div.offsetHeight * 3 + 'px;'
    top_padding_div.setAttribute('style', topPaddingStyle)

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let side_menuW = '50%'
    let bodyBackgroundColor = '#ececec'
    let topMenuBackgroundColor = '#383B42'

    if (hasSideMenu) {
      let side_menu_div = document.querySelector('#side_menu')
      side_menu_div.setAttribute('style', 'overflow: hidden;')

      let side_menuBack_div = side_menu_div.appendChild(
        document.createElement('div')
      )
      let side_menuFront_div = side_menu_div.appendChild(
        document.createElement('div')
      )

      let side_menuBackStyle =
        'width: 100%; background-color: ' + topMenuBackgroundColor + ';'
      side_menuBackStyle += '; opacity: 0; pointer-events: none; '
      side_menuBackStyle += '; position: fixed; height: 100%; top: 0; '
      side_menuBack_div.setAttribute('style', side_menuBackStyle)

      let side_menuFrontStyle =
        'width: 0%; background-color: ' + bodyBackgroundColor + ';'
      side_menuFrontStyle += ' opacity: 1; position: fixed; top: 0; bottom: 0;'
      side_menuFrontStyle +=
        ' padding-top: ' + siteName_div.offsetHeight * 3 + 'px;'
      side_menuFrontStyle +=
        ' padding-bottom: ' + siteName_div.offsetHeight * 1 + 'px;'
      side_menuFrontStyle += ' overflow-x: hidden; '
      side_menuFront_div.setAttribute('style', side_menuFrontStyle)
      // side_menuFront_div.style.boxShadow = '0 41px 18px 0 rgba(0, 0, 0, 0.2), 0 16px 70px 0 rgba(0, 0, 0, 0.19);'

      let isSideMenuOpen = true
      function togSideMenu () {
        side_menuBack_div.style.WebkitTransition = 'opacity 0.5s'
        side_menuBack_div.style.MozTransition = 'opacity 0.5s'
        if (isSideMenuOpen) {
          side_menuBack_div.style.opacity = '0%'
          side_menuBack_div.style.pointerEvents = 'none'
        } else {
          side_menuBack_div.style.opacity = '40%'
          side_menuBack_div.style.pointerEvents = 'auto'
        }

        side_menuFront_div.style.WebkitTransition = 'width 0.3s'
        side_menuFront_div.style.MozTransition = 'width 0.3s'
        // side_menuFront_div.style.WebkitTransition = 'width 0.6s';
        // side_menuFront_div.style.MozTransition = 'width 0.6s';

        if (isSideMenuOpen) {
          side_menuFront_div.style.width = '0%'
          side_menuFront_div.style.pointerEvents = 'none'
        } else {
          side_menuFront_div.style.width = side_menuW
          side_menuFront_div.style.pointerEvents = 'auto'
        }

        isSideMenuOpen = !isSideMenuOpen
      }

      togMenu_div.onclick = togSideMenu
      side_menuBack_div.onclick = togSideMenu
      togSideMenu()
      // side_menuBack_div.addEventListener('click', function (event) { togSideMenu(); })
      // setInterval(function(){ togSideMenu() }, 2000);

      let side_menuFrontInner_div = side_menuFront_div.appendChild(
        document.createElement('div')
      )
      let side_menuFrontInnerStyle = 'width: 95%' // ' padding-left: 2%; '
      side_menuFrontInner_div.setAttribute('style', side_menuFrontInnerStyle)

      addSiteNavMenu(side_menuFrontInner_div)
    }

    if (is_socket_view) {
      $.getScript('/js/utils/setup_view.js')
    }
  }
  this.init = init

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function getConStat_div (is_server, tag) {
    if (is_server) {
      return document.querySelector('#' + 'server_con_stat_div' + tag)
    } else {
      return document.querySelector('#' + 'user_con_stat_div' + tag)
    }
  }
  this.getConStat_div = getConStat_div

  // let userName_div = document.querySelector("#"+"userName_div")
  // if(window.__user_id__ !== 'None') {
  //   userName_div.innerHTML = window.__user_id__
  //   userName_div.style.opacity = '80%'
  // }
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
function append_ele_after (new_ele, target_ele) {
  // target is what you want it to go after. Look for this elements parent.
  let parent = target_ele.parentNode

  // if the parents lastchild is the target_ele...
  if (parent.lastChild == target_ele) {
    // add the new_ele after the target element.
    return parent.appendChild(new_ele)
  } else {
    // else the target has siblings, insert the new element between the target and it's next sibling.
    return parent.insertBefore(new_ele, target_ele.nextSibling)
  }
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
function addSiteNavMenu (parent_ele) {
  let side_menu_btn_grb_div = parent_ele.appendChild(document.createElement('div'))
  // side_menu_btn_grb_div.innerHTML = 'lllllllllllllllllllllllllllllll'
  side_menu_btn_grb_div.classList.add('site-nav-btn-group')

  let btns = [
    {
      text: 'Home',
      onclick: function () {
        window.location.href = 'index'
      }
    },
    {
      text: 'Array zoomer',
      onclick: function () {
        window.location.href = 'view200'
      }
    },
    {
      text: 'Plots Dashboard',
      onclick: function () {
        window.location.href = 'view201'
      }
    },
    {
      text: 'Sub-array pointings',
      onclick: function () {
        window.location.href = 'view202'
      }
    },
    {
      text: 'Observation blocks',
      onclick: function () {
        window.location.href = 'view204'
      }
    },
    {
      text: 'Scheduling Block Control',
      onclick: function () {
        window.location.href = 'view206'
      }
    },
    {
      text: 'Weather Monitoring',
      onclick: function () {
        window.location.href = 'view207'
      }
    },
    {
      text: 'Comment Night Schedule',
      onclick: function () {
        window.location.href = 'view2051'
      }
    },
    {
      text: 'Nightly Schedule',
      onclick: function () {
        window.location.href = 'view205'
      }
    },
    {
      text: 'Panel synchronization',
      onclick: function () {
        window.location.href = 'view203'
      }
    },
    {
      text: 'Empty Example',
      onclick: function () {
        window.location.href = 'view000'
      }
    },
    {
      text: 'Development',
      onclick: function () {
        window.location.href = 'view102'
      }
    }
  ]

  $.each(btns, function (i, d) {
    let side_menu_btn = side_menu_btn_grb_div.appendChild(
      document.createElement('button')
    )
    side_menu_btn.classList.add('site-nav-btn')

    side_menu_btn.onclick = d.onclick

    let btnTxt = side_menu_btn.appendChild(document.createElement('div'))
    btnTxt.innerHTML = d.text
    btnTxt.classList.add('site-nav-btn-text')
  })
}

window.baseApp = new BaseApp()
