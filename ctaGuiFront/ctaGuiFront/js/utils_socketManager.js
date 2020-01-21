'use strict'
// -------------------------------------------------------------------
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

// -------------------------------------------------------------------
// setup the socket and load resources
// ---------------------------------------------------------------------------
// basice setup of the righ-side drawer menu
// let baseApp = document.querySelector("#baseApp");
// baseApp.paperDrawerPanel1().drawerWidth  = "40%";
// baseApp.paperDrawerPanel1().disableSwipe = true;
// baseApp.paperDrawerPanel1().forceNarrow  = true;
// baseApp.topRightMenuTog  ().setAttribute("style","");

// document.getElementById('topRightMenuTog').setAttribute("style","");

// ---------------------------------------------------------------------------
// manager for sockets
// ---------------------------------------------------------------------------
function SocketManager () {
  let topThis = this
  let debugMode = true
  // let gsIdV = []
  let viewInitV = {}
  let isSouth = window.__nsType__ === 'S'
  let serverName = null
  let baseApp = window.baseApp
  let tabTableTitleId = 'table_title'
  let tabTableMainId = 'table_content'
  this.socket = null
  this.conStat = null
  this.widgetV = {}
  this.widgetTable = {}

  // ---------------------------------------------------------------------------
  // the socket
  // ---------------------------------------------------------------------------
  function setupSocket () {
    let widgetName = window.__widgetName__
    topThis.socket = io.connect('/' + widgetName)

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    topThis.socket.on('initialConnect', function (dataIn) {
      // console.log("initialConnect");
      // console.log('initialConnect',dataIn);

      let telInfo = {}
      telInfo.telIds = dataIn.telIds
      telInfo.telIdToTypes = dataIn.telIdToTypes
      window.__sockTelInfo__ = telInfo

      validateServer(dataIn.serverName)

      let sockId = this.socket.sessionid

      topThis.isReload = false
      topThis.socket.emit('joinSession', sockId)

      topThis.conStat = new ConnectionState()
      topThis.conStat.setServerConState(true)
      topThis.conStat.setUserConStateOpts(true)

      checkIsOffline()
      checkIsHidden()
      checkWasOffline()
    })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    topThis.socket.on('reConnect', function (dataIn) {
      // console.log('reConnect',dataIn);
      topThis.isReload = false
      validateServer(dataIn.serverName)
    })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function validateServer (nameIn) {
      if (serverName == null) serverName = nameIn
      else if (serverName !== nameIn) {
        window.location.reload()
      }
    }

    function isSocketConnected() {
      return topThis.socket.socket.connected
    }
    topThis.isSocketConnected = isSocketConnected

    // -------------------------------------------------------------------
    // if the window/tab is hidden (minimized or another tab is focused), then flush the time
    // function -> execute all zero-delay transitions at once. If this is not running on a loop forever
    // then updates on a hidden tab will not go through in real-time (see: https://github.com/d3/d3-timer)
    // -------------------------------------------------------------------
    function checkIsHidden () {
      setTimeout(function () {
        if (document.hidden) d3.timerFlush()
        checkIsHidden()
      }, 5000)
    }

    // -------------------------------------------------------------------
    // ask for wakeup data if returning from an offline state
    // -------------------------------------------------------------------
    function checkIsOffline () {
      setTimeout(function () {
       isSocketConnected  = topThis.isSocketConnected()
       topThis.conStat.setServerConState(isSocketConnected)
        // if(!isSocketConnected) {
        //   if (topThis.conStat.userBtn.checked) {
        //     topThis.conStat.setUserConStateOpts(false)
        //   }
        // }
        checkIsOffline()
      }, 500)
    }

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


    // -------------------------------------------------------------------
    // upon leaving the session or leaving the page
    // -------------------------------------------------------------------
    window.addEventListener('beforeunload', function (event, doReload) {
      topThis.isReload = true
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
      // console.log('disconnect',topThis.isReload)
      if (!topThis.isReload) {
        topThis.conStat.setServerConState(false)
        topThis.conStat.setUserConStateOpts(false)
      }
    })

    // topThis.socket.on('error', function(obj) {
    //   console.log("error", obj);
    // });

    // -------------------------------------------------------------------
    // run the respective syncStateGet() function for each widget
    // -------------------------------------------------------------------
    topThis.socket.on('syncStateGet', function (dataIn) {
      if (topThis.conStat.isOffline()) return

      $.each(topThis.widgetV, function (index0, ele0) {
        $.each(ele0.widgets, function (index1, ele1) {
          if (hasVar(ele1.syncStateGet)) ele1.syncStateGet(dataIn)
        })
      })
    })

    // // -------------------------------------------------------------------
    // // -------------------------------------------------------------------
    // // for development...
    // // -------------------------------------------------------------------
    // topThis.socket.on('refreshAll', function (data) {
    //   if (widgetName !== 'viewRefreshAll') {
    //     debugMode = false // prevent double reloadding
    //     window.location.reload()
    //   }
    // })
    // // -------------------------------------------------------------------
    // // -------------------------------------------------------------------

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let hasLoaded = false
    topThis.socket.on('joinSessionData', function (data) {
      if (!hasLoaded) {
        if (hasVar(setupView[widgetName])) {
          setupView[widgetName]()
        }
        hasLoaded = true
      }
    })
  }
  this.setupSocket = setupSocket

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function ConnectionState (isConnect) {
    let isServerOn_XXX = false
    let isUserOn_XXX = true
    let offOpacity = '40%'
    
    let serverBtn = baseApp.getConStatDiv(true, '_btn')
    let userBtn = baseApp.getConStatDiv(false, '_btn')
    let userTog = baseApp.getConStatDiv(false, '_tog')

    this.userBtn = userBtn

    function setServerConState (isCon) {
      isServerOn_XXX = isCon
      if(isCon) {
        serverBtn.classList.add('status-indicator-on')
      }
      else {
        serverBtn.classList.remove('status-indicator-on')
      }
      return
    }
    this.setServerConState = setServerConState

    function setUserConStateOpts(isCon) {
      if (isCon) {
        userTog.setAttribute('style', 'opacity:1;')
      } else {
        userTog.setAttribute(
          'style',
          'opacity: ' + offOpacity + '; pointer-events: none;'
        )
      }
      return
    }
    this.setUserConStateOpts = setUserConStateOpts

    userBtn.addEventListener('change', function (customEvent) {
      isUserOn_XXX = customEvent.target.checked
      return
    })

    function isOffline () {
      let out = false
      if(!topThis.isSocketConnected()) {
        out = true
      }
      else if (document.hidden) {
        out = true 
      }
      else if (!isServerOn_XXX || !isUserOn_XXX) {
        out = true 
      }
      // console.log('-isOffline-',out, topThis.isSocketConnected())
      return out
    }
    this.isOffline = isOffline

    return
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function isOldSync (prevSync, dataIn) {
    if (!hasVar(prevSync[dataIn.type])) return false

    return prevSync[dataIn.type].syncTime >= dataIn.syncTime
  }
  this.isOldSync = isOldSync

  // -------------------------------------------------------------------
  // the server keeps the id of the current active widget, to avoid sending spurious sync events
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
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

              topThis.widgetV[widgetType].widgets[widgetIdNow].updateData(
                dataUpd
              )
            }
          })
        })
      }

      // -------------------------------------------------------------------
      // add the widget
      // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function setBadgeIcon (optIn) {
    if (hasVar(optIn.iconDivV)) {
      $.each(optIn.iconDivV, function (index, iconDivNow) {
        iconBadge.setWidgetIcon({ iconDiv: iconDivNow, nIcon: optIn.nIcon })
      })
    }
  }
  this.setBadgeIcon = setBadgeIcon

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function addWidget (optIn) {
    let nameTag = optIn.nameTag
    let tableTitle = optIn.tableTitle
    // let hasDrawer = optIn.hasDrawer
    let hasIcon = optIn.hasIcon

    let mainScriptName = '/js/widget_' + nameTag + '.js'

    let mainDiv = document.querySelector('#baseAppNEW')
    let iconDivV = [null, null]

    // create the table element
    let tabTableId = unique()
    let widgetId = unique()
    let mainId = widgetId + 'main'
    let gsName = tabTableId + 'tbl'

    if (hasIcon) iconDivV[0] = { id: mainId + 'iconDiv' }
    // if (hasDrawer) iconDivV[1] = { id: sideId + 'iconDiv' }

    let tabTableNEW = mainDiv.appendChild(document.createElement('div'))
    tabTableNEW.id = tabTableId
    tabTableNEW.classList.add('tableCard')

    let tabTableTitle = tabTableNEW.appendChild(document.createElement('div'))
    tabTableTitle.id = tabTableTitleId
    // tabTableTitle.setAttribute("style", 'width: 100%; display: flex; align-items: center')
    tabTableTitle.classList.add('tableTitle')

    let tabTableTitleText = tabTableTitle.appendChild(
      document.createElement('div')
    )
    let tabTableTitleIcon = tabTableTitle.appendChild(
      document.createElement('div')
    )

    tabTableTitleIcon.classList.add('tableTitleIcon')
    if (hasIcon) {
      let tabTableTitleIconInner = tabTableTitleIcon.appendChild(
        document.createElement('div')
      )
      tabTableTitleIconInner.id = iconDivV[0].id
      // tabTableTitleIconInner.innerHTML = '000000000'
    }
    tabTableTitleText.innerHTML = tableTitle
    // tabTableTitleText.setAttribute("style", 'width: 100%; text-align: left; margin-left: 1%; margin-right: 1%;')
    tabTableTitleText.classList.add('tableTitleText')

    let tabTableMain = tabTableNEW.appendChild(document.createElement('div'))
    tabTableMain.id = tabTableMainId
    // tabTableMain.setAttribute("style", 'width: 100%;')
    tabTableMain.classList.add('gridEleBodyDark')

    // console.log(tabTableNEW)

    // -------------------------------------------------------------------
    // proceed once the table has been added (with possible recursive calls to loadScript())
    // -------------------------------------------------------------------
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

    // -------------------------------------------------------------------
    // create the side-menu and widget
    // -------------------------------------------------------------------
    function setWidgit () {
      let widgetOpt = {
        nameTag: nameTag,
        widgetId: widgetId,
        baseName: nameTag + widgetId,
        gsName: gsName,
        tabTable: tabTableNEW,
        // sideId: sideId,
        iconDivV: iconDivV,
        isSouth: isSouth,
        widget: null,
        widgetFunc: null,
        widgetDivId: null,
        eleProps: null
      }

      // console.log(nameTag) console.log(topThis.widgetTable[nameTag] === undefined)

      topThis.widgetTable[nameTag](widgetOpt)
    }

    // // -------------------------------------------------------------------
    // // after setting up the event listners, can finally add the element
    // // -------------------------------------------------------------------
    // gsIdV.push({ tabTable: tabTableNEW, gsName: gsName })
    // winResize()
  }
  this.addWidget = addWidget

  // -------------------------------------------------------------------
  // create the side-menu and widget
  // -------------------------------------------------------------------
  function addToTable (optIn) {
    let widgetType = optIn.nameTag
    let widgetSource = 'widget_' + widgetType
    let widgetFunc = optIn.widgetFunc
    let baseName = optIn.baseName
    let gsName = optIn.gsName
    let widgetId = optIn.widgetId
    let tabTable = optIn.tabTable
    let iconDivV = optIn.iconDivV
    // let sideId = optIn.sideId
    let eleProps = optIn.eleProps
    let widgetDivId = optIn.widgetDivId
    let widgetTypes = Object.keys(optIn.eleProps)
    let setupData = optIn.setupData

    let widgetEle = []
    $.each(widgetTypes, function (index, dataNow) {
      widgetEle.push(null)
      let itemNow = tabTable
        .querySelector('#' + tabTableMainId)
        .appendChild(document.createElement('div'))
      itemNow.innerHTML = eleProps[dataNow]['content']

      let widgetIndex = 0
      let widgetTag = null
      $.each(widgetTypes, function (index, dataNow1) {
        if (eleProps[dataNow]['gsId'] === widgetDivId + dataNow1) {
          widgetIndex = index
          widgetTag = dataNow1
        }
      })

      if (!hasVar(widgetTag)) return

      let WidgetFunc = function () {
        this.getEle = function (tag) {
          return itemNow.querySelector('#' + tag)
        }
      }
      let widgetFunc = new WidgetFunc()

      widgetEle[widgetIndex] = {
        id: widgetTag,
        widget: widgetFunc,
        w: eleProps[widgetTag].w,
        h: eleProps[widgetTag].h
      }

      let gsW = eleProps[widgetTag].w
      let gsH = eleProps[widgetTag].h

      var ow = itemNow.offsetWidth
      var h0 = ow * 0.08
      var wTot = 12
      var w0 = gsW / wTot
      var width = 100 * w0 - 0.5 + '%'
      var height = h0 * gsH + 'px'
      var maxHeight = $(document).height() * 0.8
      let itemNowStyle =
        'width:' +
        width +
        '; height:' +
        height +
        '; max-height:' +
        maxHeight +
        'px'
      itemNow.setAttribute('style', itemNowStyle)
      itemNow.classList.add('tableItem')
      // tabTable._addWidget(gsName, eleProps[dataNow])
    })

    // -------------------------------------------------------------------
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
          // sideId: sideId,
          widgetEle: widgetEle,
          setupData: setupData
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

  // let prevResize = null
  // function winResize () {
  //   console.log(' ..... winResize .........') ; return
  //   if (hasVar(prevResize)) return
  //   prevResize = Date.now()

  //   runLoopCom.init({ tag: 'winResize', func: resizeNowOnce, nKeep: 1 })
  //   function resizeNow () {
  //     runLoopCom.push({ tag: 'winResize' })
  //   }

  //   function resizeNowOnce () {
  //     if (Date.now() - prevResize < timeD.animArc) {
  //       resizeNow()
  //       return
  //     }

  //     prevResize = Date.now()
  //     $.each(gsIdV, function (index, gsNow) {
  //       gsNow.tabTable.setAllWidgetWH(gsNow.gsName)
  //     })
  //   }

  //   $.each(gsIdV, function (index, gsNow) {
  //     let tblNow = gsNow.tabTable.getEle(gsNow.gsName)
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
