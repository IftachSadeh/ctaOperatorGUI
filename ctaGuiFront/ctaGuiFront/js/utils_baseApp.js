
'use strict'
// -------------------------------------------------------------------
/* global $ */

function BaseApp() {

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function init(optIn) {
    let widgetName = optIn.widget_name
    let hasSideMenu = true
    let isSocketView = true

    if(widgetName === 'notFound') {
      console.warn('ready(base-app)...',widgetName)
      let mainDiv = document.querySelector('#baseAppNEW')

      let titleDiv = mainDiv.appendChild(document.createElement('div'))
      titleDiv.classList.add('menuHeader')
      titleDiv.setAttribute("style", 'font-size: 30px; padding: 15px; text-align: center;')
      titleDiv.innerHTML = 'CTA operator Interface'

      titleDiv = mainDiv.appendChild(document.createElement('div'))
      titleDiv.classList.add('menuHeader')
      titleDiv.setAttribute("style", 'margin: 5%; font-size: 30px;')
      titleDiv.innerHTML = 'Page not found - Redirecting home ...'

      hasSideMenu = false
      isSocketView = false
      setTimeout(function() { 
        window.location.replace('/'+window.__appPrefix__+'/index'); 
      }, 2000);
    }

    // -------------------------------------------------------------------
    // 
    // -------------------------------------------------------------------
    if(widgetName == 'index') {
      let mainDiv = document.querySelector('#baseAppNEW')

      let titleDiv = mainDiv.appendChild(document.createElement('div'))
      titleDiv.classList.add('menuHeader')
      titleDiv.setAttribute("style", 'font-size: 30px; padding: 15px; text-align: center;')
      titleDiv.innerHTML = 'CTA operator Interface'
      
      let siteNavMenuDiv = mainDiv.appendChild(document.createElement('div'))
      siteNavMenuDiv.setAttribute("style", 'width: 80%')

      addSiteNavMenu(siteNavMenuDiv)
    }

    
    // -------------------------------------------------------------------
    // 
    // -------------------------------------------------------------------
    if(widgetName == 'login') {
      let mainDiv = document.querySelector('#baseAppNEW')
      
      let titleDiv = mainDiv.appendChild(document.createElement('div'))
      titleDiv.classList.add('menuHeader')
      titleDiv.setAttribute("style", 'font-size: 30px; padding: 15px; text-align: center;')
      titleDiv.innerHTML = 'CTA operator Interface'

      let loginDiv = mainDiv.appendChild(document.createElement('div'))
      loginDiv.setAttribute("style", 'padding: 20px; text-align: center; width: 80%; display: block; margin: auto;')
      
      let form = loginDiv.appendChild(document.createElement('form'))
      form.id = 'loginForm'
      form.setAttribute("style", 'text-align: center; width: 100%;')
      form.classList.add('form')

      let entry, row, th
      let formTbl = form.appendChild(document.createElement('table'))
      // formTbl.setAttribute("style", ' width: 100%;')
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
      entry.classList.add('form-btn')
      
      isSocketView = false
      hasSideMenu = false
    }
    
    // -------------------------------------------------------------------
    // 
    // -------------------------------------------------------------------
    let logoutBtnStyle
    if(widgetName === 'login') 
      logoutBtnStyle = 'opacity:0; pointer-events:none;'
    else 
      logoutBtnStyle = 'opacity:1; pointer-events:auto;'
    
    let logoutBtnDiv = document.querySelector("#logoutBtnDiv")
    logoutBtnDiv.setAttribute("style", logoutBtnStyle)

    let logoutBtn = document.querySelector("#logoutBtn")
    logoutBtn.onclick = function() { window.location.href='logout'; }

    if(widgetName !== 'login') {
      connectStatusDiv('').setAttribute("style", 'opacity: 1;')
      // document.querySelector("#topMenu").style.opacity = 1
    }

    // -------------------------------------------------------------------
    // 
    // -------------------------------------------------------------------
    let topMenuDiv = document.querySelector("#topMenuLeft")
    let togMenuDiv  = appendEleAfter(document.createElement('a'), topMenuDiv)
    let siteNameDiv = appendEleAfter(document.createElement('div'), togMenuDiv)

    let togMenu = togMenuDiv.appendChild(document.createElement('i'))
    let togMenuStyle = 'margin-right: 10px;'
    if(!hasSideMenu) {
      togMenuStyle += 'pointer-events: none; opacity: 0.7;'
    }
    togMenu.setAttribute("style", togMenuStyle)
    togMenu.classList.add('fa', 'fa-bars', 'sized-button', 'fa-circle-button-bright')
    
    siteNameDiv.innerHTML = 'CTA '+((window.__nsType__ == 'N') ? 'North' : 'South')
    siteNameDiv.setAttribute("style", 'opacity:0.8; pointer-events:none;')
    siteNameDiv.classList.add("menuHeader");


    // -------------------------------------------------------------------
    // 
    // -------------------------------------------------------------------
    let topPaddingDiv = document.querySelector("#topPaddingDiv")
    let topPaddingStyle = 'width: 100%; padding-top: ' + (siteNameDiv.offsetHeight*3) + 'px;'
    topPaddingDiv.setAttribute("style", topPaddingStyle)

    
    // -------------------------------------------------------------------
    // 
    // -------------------------------------------------------------------
    let sideMenuW = '50%'
    let bodyBackgroundColor = '#ececec'
    let topMenuBackgroundColor = '#383B42'

    if(hasSideMenu) {
      let sideMenuDiv = document.querySelector("#sideMenu")
      sideMenuDiv.setAttribute("style", 'overflow: hidden;')
      
      let sideMenuBackDiv = sideMenuDiv.appendChild(document.createElement('div'))
      let sideMenuFrontDiv = sideMenuDiv.appendChild(document.createElement('div'))
      
      let sideMenuBackStyle = 'width: 100%; background-color: ' + topMenuBackgroundColor + ';'
      sideMenuBackStyle += '; opacity: 0; pointer-events: none; '
      sideMenuBackStyle += '; position: fixed; height: 100%; top: 0; '
      sideMenuBackDiv.setAttribute("style", sideMenuBackStyle)

      let sideMenuFrontStyle = 'width: 0%; background-color: ' + bodyBackgroundColor + ';'
      sideMenuFrontStyle += ' opacity: 1; position: fixed; top: 0; bottom: 0;'
      sideMenuFrontStyle += ' padding-top: ' + (siteNameDiv.offsetHeight*3.) + 'px;'
      sideMenuFrontStyle += ' padding-bottom: ' + (siteNameDiv.offsetHeight*1) + 'px;'
      sideMenuFrontStyle += ' overflow-x: hidden; '
      sideMenuFrontDiv.setAttribute("style", sideMenuFrontStyle)
      // sideMenuFrontDiv.style.boxShadow = '0 41px 18px 0 rgba(0, 0, 0, 0.2), 0 16px 70px 0 rgba(0, 0, 0, 0.19);'

      let isSideMenuOpen = true
      function togSideMenu() {
        sideMenuBackDiv.style.WebkitTransition = 'opacity 0.5s';
        sideMenuBackDiv.style.MozTransition = 'opacity 0.5s';
        if(isSideMenuOpen) {
          sideMenuBackDiv.style.opacity = '0%'
          sideMenuBackDiv.style.pointerEvents = 'none'
        }
        else {
          sideMenuBackDiv.style.opacity = '40%'
          sideMenuBackDiv.style.pointerEvents = 'auto'
        }

        sideMenuFrontDiv.style.WebkitTransition = 'width 0.3s';
        sideMenuFrontDiv.style.MozTransition = 'width 0.3s';
        // sideMenuFrontDiv.style.WebkitTransition = 'width 0.6s';
        // sideMenuFrontDiv.style.MozTransition = 'width 0.6s';

        if(isSideMenuOpen) {
          sideMenuFrontDiv.style.width = '0%'
          sideMenuFrontDiv.style.pointerEvents = 'none'
        }
        else {
          sideMenuFrontDiv.style.width = sideMenuW
          sideMenuFrontDiv.style.pointerEvents = 'auto'
        }

        isSideMenuOpen = !isSideMenuOpen
        return
      }

      togMenuDiv.onclick = togSideMenu
      sideMenuBackDiv.onclick = togSideMenu
      togSideMenu()
      // sideMenuBackDiv.addEventListener('click', function (event) { togSideMenu(); })
      // setInterval(function(){ togSideMenu() }, 2000);

      let sideMenuFrontInnerDiv = sideMenuFrontDiv.appendChild(document.createElement('div'))
      let sideMenuFrontInnerStyle = 'width: 95%' //' padding-left: 2%; '
      sideMenuFrontInnerDiv.setAttribute("style", sideMenuFrontInnerStyle)

      addSiteNavMenu(sideMenuFrontInnerDiv)
    }

    if(isSocketView) {
      $.getScript('/js/utils_setupView.js')
    }

    return
  }
  this.init = init

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function connectStatusDiv(tag) {
    return document.querySelector("#"+"connectStatusDiv"+tag)
  }
  this.connectStatusDiv = connectStatusDiv

  let userNameDiv = document.querySelector("#"+"userNameDiv")
  if(window.__userId__ !== 'None') {
    userNameDiv.innerHTML = window.__userId__
    userNameDiv.style.opacity = '80%'
  }

  return

}


// ------------------------------------------------------------------
// 
// ------------------------------------------------------------------
function appendEleAfter(newElement,targetElement) {
    // target is what you want it to go after. Look for this elements parent.
    let parent = targetElement.parentNode;

    // if the parents lastchild is the targetElement...
    if (parent.lastChild == targetElement) {
        // add the newElement after the target element.
        return parent.appendChild(newElement);
    } else {
        // else the target has siblings, insert the new element between the target and it's next sibling.
        return parent.insertBefore(newElement, targetElement.nextSibling);
    }
}


// ------------------------------------------------------------------
// 
// ------------------------------------------------------------------
function addSiteNavMenu(parentEle) {
  let sideMenuBtnGrbDiv = parentEle.appendChild(document.createElement('div'))
  // sideMenuBtnGrbDiv.innerHTML = 'lllllllllllllllllllllllllllllll'
  sideMenuBtnGrbDiv.classList.add("site-nav-btn-group");

  let btns = [
    {
      text: 'Home',
      onclick: function() { window.location.href='index'; },
    },
    {
      text: 'Array zoomer',
      onclick: function() { window.location.href='view200'; },
    },
    {
      text: 'Plots Dashboard',
      onclick: function() { window.location.href='view201'; },
    },
    {
      text: 'Sub-array pointings',
      onclick: function() { window.location.href='view202'; },
    },
    {
      text: 'Observation blocks',
      onclick: function() { window.location.href='view204'; },
    },
    {
      text: 'Scheduling Block Control',
      onclick: function() { window.location.href='view206'; },
    },
    {
      text: 'Weather Monitoring',
      onclick: function() { window.location.href='view207'; },
    },
    {
      text: 'Comment Night Schedule',
      onclick: function() { window.location.href='view2051'; },
    },
    {
      text: 'Nightly Schedule',
      onclick: function() { window.location.href='view205'; },
    },
    {
      text: 'Panel synchronization',
      onclick: function() { window.location.href='view203'; },
    },
    {
      text: 'Empty Example',
      onclick: function() { window.location.href='view000'; },
    },
    {
      text: 'Development',
      onclick: function() { window.location.href='view102'; },
    },


  ]


  $.each(btns, function(i, d) {
    let sideMenuBtn = sideMenuBtnGrbDiv.appendChild(document.createElement('button'))
    sideMenuBtn.classList.add("site-nav-btn");
  
    sideMenuBtn.onclick = d.onclick
  
    let btnTxt = sideMenuBtn.appendChild(document.createElement('div'))
    btnTxt.innerHTML = d.text
    btnTxt.classList.add('site-nav-btn-text')

  })

  return
}


window.baseApp = new BaseApp()
