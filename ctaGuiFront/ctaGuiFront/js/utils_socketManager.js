'use strict'
// ---------------------------------------------------------------------------------------------------
/* global $ */
/* global io */
/* global d3 */
/* global timeD */
/* global unique */
/* global hasVar */
/* global baseApp */
/* global deepCopy */
/* global setupView */
/* global iconBadge */
/* global runLoopCom */
/* global appendToDom */
/* global runWhenReady */
/* global loadedScripts */

// ---------------------------------------------------------------------------------------------------
// setup the socket and load resources
// -----------------------------------------------------------------------------------------------------------
// basice setup of the righ-side drawer menu
// let baseApp = document.querySelector("#baseApp");
// baseApp.paperDrawerPanel1().drawerWidth  = "40%";
// baseApp.paperDrawerPanel1().disableSwipe = true;
// baseApp.paperDrawerPanel1().forceNarrow  = true;
// baseApp.topRightMenuTog  ().setAttribute("style","");

// document.getElementById('topRightMenuTog').setAttribute("style","");

// -----------------------------------------------------------------------------------------------------------
// manager for sockets
// -----------------------------------------------------------------------------------------------------------
function SocketManager () {
  let topThis = this
  let debugMode = true
  let gsIdV = []
  let viewInitV = {}
  let isSouth = window.__nsType__ === 'S'
  let serverName = null
  let debugServerName = true
  this.socket = null
  this.conStat = null
  this.widgetV = {}
  this.widgetTable = {}

  // -----------------------------------------------------------------------------------------------------------
  // the socket
  // -----------------------------------------------------------------------------------------------------------
  function setupSocket () {
    let widgetName = window.__widgetName__
    topThis.socket = io.connect('/' + widgetName)

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    topThis.socket.on('initialConnect', function (dataIn) {
      console.log("initialConnect");
      // console.log('initialConnect',dataIn);

      validateServer(dataIn.serverName)

      let sockId = this.socket.sessionid

      topThis.socket.emit('joinSession', sockId)

      topThis.conStat = new ConnectionState()
      topThis.conStat.setState(true)

      checkIsHidden()
      checkWasOffline()
    })

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    topThis.socket.on('reConnect', function (dataIn) {
      // console.log('reConnect',dataIn);
      validateServer(dataIn.serverName)
    })

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function validateServer (nameIn) {
      if (serverName == null) serverName = nameIn
      else if (serverName !== nameIn) {
        window.location.reload()
      }
    }

    // ---------------------------------------------------------------------------------------------------
    // if the window/tab is hidden (minimized or another tab is focused), then flush the time
    // function -> execute all zero-delay transitions at once. If this is not running on a loop forever
    // then updates on a hidden tab will not go through in real-time (see: https://github.com/d3/d3-timer)
    // ---------------------------------------------------------------------------------------------------
    function checkIsHidden () {
      setTimeout(function () {
        if (document.hidden) d3.timerFlush()
        checkIsHidden()
      }, 5000)
    }

    // ---------------------------------------------------------------------------------------------------
    // ask for wakeup data if returning from an offline state
    // ---------------------------------------------------------------------------------------------------
    let socketWasOffline = false
    function checkWasOffline () {
      setTimeout(function () {
        let isOffline = topThis.conStat.isOffline()
        if (isOffline) socketWasOffline = true

        if (socketWasOffline) {
          if (!isOffline) {
            socketWasOffline = false
            if (hasVar(topThis.socket)) {
              topThis.socket.emit('backFromOffline')
            }
          }
        }
        checkWasOffline()
      }, 500)
    }

    // ---------------------------------------------------------------------------------------------------
    // upon leaving the session or leaving the page
    // ---------------------------------------------------------------------------------------------------
    window.addEventListener('beforeunload', function (event, doReload) {
      // explicitly needed for firefox, but good in any case...
      if (topThis.socket) {
        topThis.socket.disconnect()
        topThis.socket = null
      }
      if (debugMode) {
        window.location.reload() // clear cache
      }
    })

    // in case we disconnect (internet is off or server is down)
    topThis.socket.on('disconnect', function () {
      // console.log('disconnect............');
      topThis.conStat.setState(false)
    })

    // topThis.socket.on('error', function(obj) {
    //   console.log("error", obj);
    // });

    // ---------------------------------------------------------------------------------------------------
    // run the respective syncStateGet() function for each widget
    // ---------------------------------------------------------------------------------------------------
    topThis.socket.on('syncStateGet', function (dataIn) {
      if (topThis.conStat.isOffline()) return

      $.each(topThis.widgetV, function (index0, ele0) {
        $.each(ele0.widgets, function (index1, ele1) {
          if (hasVar(ele1.syncStateGet)) ele1.syncStateGet(dataIn)
        })
      })
    })

    // ---------------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------------
    // for development...
    // ---------------------------------------------------------------------------------------------------
    topThis.socket.on('refreshAll', function (data) {
      if (widgetName !== 'viewRefreshAll') {
        debugMode = false // prevent double reloadding
        window.location.reload()
      }
    })
    // ---------------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let hasLoaded = false
    topThis.socket.on('joinSessionData', function (data) {
      if (debugServerName) {
        topThis.conStat.setUserName(data.sessProps.userId + '/' + serverName)
      } else topThis.conStat.setUserName(data.sessProps.userId)

      if (!hasLoaded) {
        if (hasVar(setupView[widgetName])) {
          setupView[widgetName]()
        }
        hasLoaded = true
      }
    })
  }
  this.setupSocket = setupSocket

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function ConnectionState (isConnect) {
    let isOn = false
    let user = true
    let txt = baseApp.connectStatusDiv('_txt')
    let tog = baseApp.connectStatusDiv('_btn')

    baseApp.connectStatusDiv('').setAttribute('style', 'opacity:1;')

    tog.addEventListener('change', function (customEvent) {
      user = tog.active
      isOn = user

      togTxt(user)
    })

    function togTxt (isOnline) {
      if (isOnline) txt.classList.remove('connectStatusDivTxtCol')
      else txt.classList.add('connectStatusDivTxtCol')

      txt.innerHTML = isOnline ? 'Online' : 'Offline'

      topThis.socket.emit('setOnlineState', { isOnline: isOnline })
    }

    function setState (isConnect) {
      if (isConnect) {
        tog.setAttribute('style', 'opacity:1;')
      } else {
        tog.setAttribute('style', 'opacity:0.4;pointer-events:none;')
      }

      if (user) {
        tog.checked = isConnect
        isOn = isConnect
      }

      togTxt(isConnect)
    }
    this.setState = setState

    function setUserName (userIdIn) {
      window.userId = userIdIn
      baseApp.userNameDiv().innerHTML = userIdIn
    }
    this.setUserName = setUserName

    function isOffline () {
      return document.hidden || !isOn
    }
    this.isOffline = isOffline
  }
  // this.ConnectionState = ConnectionState;

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function sockSyncStateSend (optIn) {
    if (document.hidden) return
    if (topThis.conStat.isOffline()) return

    let dataNow = {}
    dataNow.NS = optIn.NS
    dataNow.widgetId = optIn.widgetId
    dataNow.type = optIn.type
    dataNow.data = optIn.data

    if (hasVar(topThis.socket)) topThis.socket.emit('syncStateSend', dataNow)
  }
  this.sockSyncStateSend = sockSyncStateSend

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function isSameSync (prevSync, dataIn) {
    if (!hasVar(prevSync[dataIn.type])) return false

    let isSame = true
    $.each(dataIn, function (tagNow, objNow) {
      if (tagNow !== 'syncTime') {
        if (!(prevSync[dataIn.type][tagNow] === objNow)) isSame = false
      }
    })
    return isSame
  }
  this.isSameSync = isSameSync

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function isOldSync (prevSync, dataIn) {
    if (!hasVar(prevSync[dataIn.type])) return false

    return prevSync[dataIn.type].syncTime >= dataIn.syncTime
  }
  this.isOldSync = isOldSync

  // ---------------------------------------------------------------------------------------------------
  // the server keeps the id of the current active widget, to avoid sending spurious sync events
  // ---------------------------------------------------------------------------------------------------
  let waitMouseMove = 250
  let prevMouseMove = Date.now()
  function emitMouseMove (optIn) {
    let eleIn
    if (
      (typeof optIn.eleId === 'string' || optIn.eleId instanceof String) &&
      hasVar(optIn.eleId)
    ) {
      eleIn = optIn.eleId
      if (!(eleIn.indexOf('#') === 0)) eleIn = '#' + eleIn
    } else {
      eleIn = optIn.eleIn
    }

    $(eleIn).mousemove(function (e) {
      if (Date.now() - prevMouseMove < waitMouseMove) return
      prevMouseMove = Date.now()

      if (!topThis.conStat.isOffline() && hasVar(topThis.socket)) {
        topThis.socket.emit('setActiveWidget', optIn.data)
      }
      // console.log("onmousemove",optIn.data.widgetId)
    })
  }
  this.emitMouseMove = emitMouseMove
  // $(document).mouseenter(function () { console.log('in'); });
  // $(document).mouseleave(function () { console.log('out'); });

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setSocketModule (optIn) {
    let widgetId = optIn.widgetId
    let widgetType = optIn.widgetType
    let widgetFunc = optIn.widgetFunc
    let widgetSource = optIn.widgetSource

    let isFirst = !hasVar(topThis.widgetV[widgetType])

    if (isFirst) topThis.widgetV[widgetType] = { SockFunc: null, widgets: {} }

    if (!hasVar(topThis.widgetV[widgetType].widgets[widgetId])) {
      topThis.widgetV[widgetType].widgets[widgetId] = new widgetFunc.MainFunc(
        optIn
      )
      viewInitV[widgetId] = false

      if (isFirst) {
        topThis.widgetV[widgetType].SockFunc = new widgetFunc.SockFunc(optIn)

        // common sicket calls, which should be added only once!
        topThis.socket.on('initData', function (dataIn) {
          if (dataIn.widgetType === widgetType) {
            if (hasVar(topThis.widgetV[widgetType].widgets[dataIn.widgetId])) {
              topThis.widgetV[widgetType].widgets[dataIn.widgetId].initData(
                dataIn
              )
              viewInitV[dataIn.widgetId] = true
            }
          }
        })

        topThis.socket.on('updateData', function (dataIn) {
          if (topThis.conStat.isOffline()) return
          if (dataIn.widgetType !== widgetType) return

          let nWigitNow = 0
          let nWigits = Object.keys(topThis.widgetV[widgetType].widgets).length

          $.each(topThis.widgetV[widgetType].widgets, function (
            widgetIdNow,
            modNow
          ) {
            if (dataIn.sessWidgetIds.indexOf(widgetIdNow) >= 0) {
              // make sure we dont sent the same data twice (as it could be modified)
              nWigitNow += 1
              let dataUpd =
                nWigits === 1 || nWigitNow === nWigits
                  ? dataIn
                  : deepCopy(dataIn)

              topThis.widgetV[widgetType].widgets[widgetIdNow].updateData(dataUpd)
            }
          })
        })
      }

      // ---------------------------------------------------------------------------------------------------
      // add the widget
      // ---------------------------------------------------------------------------------------------------
      topThis.socket.emit('widget', {
        widgetSource: widgetSource,
        widgetName: widgetType,
        widgetId: widgetId,
        methodName: 'setup'
      })
    }

    return topThis.widgetV[widgetType].widgets[widgetId]
  }
  // this.setSocketModule = setSocketModule;

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function multipleInit (optIn) {
    if (viewInitV[optIn.id]) {
      console.error(
        'trying to initData multiple times ?!?!',
        optIn.id,
        optIn.data
      )
      return true
    }
    return false
  }
  this.multipleInit = multipleInit

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setSideDiv (optIn) {
    let sideDiv = document.querySelector('#baseApp').drawer()
    if (hasVar(sideDiv)) sideDiv = sideDiv.getEle(optIn.id)

    if (hasVar(optIn.iconDivV)) {
      $.each(optIn.iconDivV, function (index, iconDivNow) {
        iconBadge.setWidgetIcon({ iconDiv: iconDivNow, nIcon: optIn.nIcon })
      })
    }

    return sideDiv
  }
  this.setSideDiv = setSideDiv

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function addWidget (optIn) {
    let nameTag = optIn.nameTag
    let tableTitle = optIn.tableTitle
    let hasDrawer = optIn.hasDrawer
    let hasIcon = optIn.hasIcon

    let mainScriptName = '/js/widget_' + nameTag + '.js'

    let mainDiv = document
      .querySelector('#baseApp')
      .main()
      .content()
    let sideDiv = document.querySelector('#baseApp').drawer()

    if (hasDrawer) {
      if (!hasVar(sideDiv)) {
        let drawerDiv = document
          .querySelector('#baseApp')
          .getEle('addRightSideMenu')
        let drawerName = document.querySelector('#baseApp').getDrawerName()

        let drawerEle = document.createElement(drawerName)
        drawerEle.id = drawerName

        appendToDom(drawerDiv, drawerEle)

        runWhenReady({
          pass: function () {
            return hasVar(document.querySelector('#baseApp').drawer())
          },
          execute: function () {
            addWidget(optIn)
          },
          msgFail: function () {
            console.error(['cant initialize drawer in addWidget(): ', optIn])
          }
        })
        return
      } else {
        sideDiv = sideDiv.content()
      }
    }

    let iconDivV = [null, null]

    // create the table element
    let tabTableId = unique()
    let widgetId = unique()
    let mainId = widgetId + 'main'
    let sideId = widgetId + 'side'
    let gsName = tabTableId + 'tbl'

    if (hasIcon) iconDivV[0] = { id: mainId + 'iconDiv' }
    if (hasDrawer) iconDivV[1] = { id: sideId + 'iconDiv' }

    let tabTable = document.createElement('svg-tab-table')
    tabTable.id = tabTableId

    // ---------------------------------------------------------------------------------------------------
    // create the table once the svg-tab-table is ready
    // ---------------------------------------------------------------------------------------------------
    tabTable.addEventListener('svg-tab-table-ready', function (e) {
      tabTable._addTable({
        tableId: gsName,
        iconDivId: hasIcon ? iconDivV[0].id : null,
        tableTitle: tableTitle + (window.debugWidgetTitle ? widgetId : '')
      })

      if (hasIcon) iconDivV[0].ele = tabTable.getEle(iconDivV[0].id)
    })

    // ---------------------------------------------------------------------------------------------------
    // proceed once the table has been added (with possible recursive calls to loadScript())
    // ---------------------------------------------------------------------------------------------------
    tabTable.addEventListener('_addTable' + gsName, function (e) {
      window.loadScript({ source: nameTag, script: mainScriptName })

      runWhenReady({
        pass: function () {
          let intersect = loadedScripts.queued.filter(n =>
            loadedScripts.loaded.includes(n)
          )
          return intersect.length === loadedScripts.queued.length
        },
        execute: setWidgit
      })
    })

    // ---------------------------------------------------------------------------------------------------
    // create the side-menu and widget
    // ---------------------------------------------------------------------------------------------------
    function setWidgit () {
      // console.log([' -- loaded',nameTag,' - queued: '+JSON.stringify(loadedScripts.queued),' - loaded: '+JSON.stringify(loadedScripts.loaded)]);

      let widgetOpt = {
        nameTag: nameTag,
        widgetId: widgetId,
        baseName: nameTag + widgetId,
        gsName: gsName,
        tabTable: tabTable,
        sideId: sideId,
        iconDivV: iconDivV,
        isSouth: isSouth,
        widget: null,
        widgetFunc: null,
        widgetDivId: null,
        eleProps: null
      }

      if (!hasVar(sideDiv)) {
        topThis.widgetTable[nameTag](widgetOpt)
        return
      }

      let sideMenu = document.createElement(
        String('widget-drawer').toLowerCase()
      )
      sideMenu.id = sideId
      sideMenu.setWidgetId(widgetId)

      sideMenu.addEventListener('widget-drawer-ready', function (e) {
        if (hasVar(iconDivV[1])) {
          sideMenu.setIconDivId(iconDivV[1].id)

          iconDivV[1].ele = sideMenu.getEle(iconDivV[1].id)
        }

        topThis.widgetTable[nameTag](widgetOpt)

        runWhenReady({
          pass: function () {
            return hasVar(widgetOpt.widget)
          },
          execute: function () {
            sideMenu.setWidget(widgetOpt.widget)
          },
          msgFail: function () {
            console.error([
              'cant initialize widgit setWidgit() with: ',
              nameTag,
              widgetId,
              widgetOpt
            ])
          }
        })
      })

      appendToDom(sideDiv, sideMenu)
    }

    // ---------------------------------------------------------------------------------------------------
    // after setting up the event listners, can finally add the element
    // ---------------------------------------------------------------------------------------------------
    appendToDom(mainDiv, document.createElement('br'))
    appendToDom(mainDiv, tabTable)

    gsIdV.push({ tabTable: tabTable, gsName: gsName })
    winResize()
  }
  this.addWidget = addWidget

  // ---------------------------------------------------------------------------------------------------
  // create the side-menu and widget
  // ---------------------------------------------------------------------------------------------------
  function addToTable (optIn) {
    let widgetType = optIn.nameTag
    let widgetSource = 'widget_' + widgetType
    let widgetFunc = optIn.widgetFunc
    let baseName = optIn.baseName
    let gsName = optIn.gsName
    let widgetId = optIn.widgetId
    let tabTable = optIn.tabTable
    let iconDivV = optIn.iconDivV
    let sideId = optIn.sideId
    let eleProps = optIn.eleProps
    let widgetDivId = optIn.widgetDivId
    let widgetTypes = Object.keys(optIn.eleProps)

    let widgetEle = []
    $.each(widgetTypes, function (index, dataNow) {
      widgetEle.push(null)
      tabTable._addWidget(gsName, eleProps[dataNow])
    })

    // ---------------------------------------------------------------------------------------------------
    tabTable.addEventListener('_addWidget', function (e) {
      let widgetIndex = 0
      let widgetTag = null
      $.each(widgetTypes, function (index, dataNow) {
        if (e.detail.id === widgetDivId + dataNow) {
          widgetIndex = index
          widgetTag = dataNow
        }
      })
      if (!hasVar(widgetTag)) return

      let widget = e.detail.widget
      widgetEle[widgetIndex] = {
        id: widgetTag,
        widget: widget,
        w: eleProps[widgetTag].w,
        h: eleProps[widgetTag].h
      }
    })

    // ---------------------------------------------------------------------------------------------------
    runWhenReady({
      pass: function () {
        let nReady = 0
        $.each(widgetTypes, function (index, dataNow) {
          if (hasVar(widgetEle[index])) nReady += 1
        })
        return nReady === widgetTypes.length
      },
      execute: function () {
        optIn.widget = setSocketModule({
          widgetType: widgetType,
          widgetSource: widgetSource,
          widgetFunc: widgetFunc,
          baseName: baseName,
          widgetId: widgetId,
          iconDivV: iconDivV,
          sideId: sideId,
          widgetEle: widgetEle
        })
      },
      msgFail: function () {
        console.error([
          'cant initialize widgit ' + widgetType + ' with:',
          widgetId
        ])
      }
    })
  }
  this.addToTable = addToTable

  let prevResize = null
  function winResize () {
    if (hasVar(prevResize)) return
    prevResize = Date.now()

    runLoopCom.init({ tag: 'winResize', func: resizeNowOnce, nKeep: 1 })
    function resizeNow () {
      runLoopCom.push({ tag: 'winResize' })
    }

    function resizeNowOnce () {
      if (Date.now() - prevResize < timeD.animArc) {
        resizeNow()
        return
      }

      prevResize = Date.now()
      $.each(gsIdV, function (index, gsNow) {
        gsNow.tabTable.setAllWidgetWH(gsNow.gsName)
      })
    }

    $.each(gsIdV, function (index, gsNow) {
      let tblNow = gsNow.tabTable.getEle(gsNow.gsName)
      $(tblNow).on('resizestop', function (event, ui) {
        resizeNow()
      })
    })

    window.addEventListener('resize', function (e) {
      resizeNow()
    })
  }
  // this.winResize = winResize;
}

// ---------------------------------------------------------------------------------------------------
// the global instance of the socket manager
// ---------------------------------------------------------------------------------------------------
window.sock = new SocketManager()
