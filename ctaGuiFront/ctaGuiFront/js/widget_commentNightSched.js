'use strict'
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// mainScriptTag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    "/js/widget_"+mainScriptTag+".js"
var mainScriptTag = 'commentNightSched'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global minMaxObj */
/* global sock */
/* global timeD */
/* global hasVar */
/* global telInfo */
/* global disableScrollSVG */
/* global RunLoop */
/* global BlockDisplayer */
/* global BlockList */
/* global BlockFilters */
/* global BlockQueueCreator */
/* global TelsArray */
/* global EventQueue */
/* global ClockEvents */
/* global ButtonPanel */
/* global PanelManager */
/* global bckPattern */
/* global telHealthCol */
/* global colsPurplesBlues */
/* global colsYellows */
/* global ScrollTable */
/* global colsReds */
/* global colsPurples */
/* global colsGreens */
/* global colPrime */
/* global Locker */
/* global FormManager */
/* global appendToDom */
/* global runWhenReady */
/* global ScrollBox */

window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueCreator.js' })
// window.loadScript({ source: mainScriptTag, script: '/js/utils_blockList.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockFilters.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_EventQueue.js' })
// window.loadScript({ source: mainScriptTag, script: '/js/utils_TelsArray.js' })

window.loadScript({ source: mainScriptTag, script: '/js/utils_panelManager.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_buttonPanel.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_clockEvents.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollTable.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_formManager.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 6
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = { SockFunc: sockCommentNightSched, MainFunc: mainCommentNightSched }
  optIn.widgetDivId = optIn.widgetId + 'widgetDiv'
  optIn.eleProps = {}
  optIn.eleProps[divKey] = {
    autoPos: true,
    isDarkEle: true,
    gsId: optIn.widgetDivId + divKey,
    x: x0,
    y: y0,
    w: w0,
    h: h0,
    content: "<div id='" + optIn.baseName + divKey + "'></div>"
  }

  sock.addToTable(optIn)
}

// ---------------------------------------------------------------------------------------------------
// additional socket events for this particular widget type
// ---------------------------------------------------------------------------------------------------
let sockCommentNightSched = function (optIn) {
  // let widgetType   = optIn.widgetType;
  // let widgetSource = optIn.widgetSource;
  // // ---------------------------------------------------------------------------------------------------
  // // get data from the server for a given telescope
  // // ---------------------------------------------------------------------------------------------------
  // this.askTelData = function(optIn) {
  //   if(sock.conStat.isOffline()) return;
  //   let data         = {};
  //   data.widgetId = widgetId;
  //   data.telId    = optIn.telId;
  //   data.propId   = optIn.propId;
  //   let dataEmit = {
  //     "widgetSource":widgetSource, "widgetName":widgetType, "widgetId":widgetId,
  //     "methodName":"commentNightSchedAskTelData",
  //     "methodArgs":data
  //   };
  //   sock.socket.emit("widget", dataEmit);
  //   return;
  // }
}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainCommentNightSched = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  // let myUniqueId = unique()
  let widgetType = optIn.widgetType
  let tagBlockQueue = 'blockQueue'
  let tagArrZoomerPlotsSvg = optIn.baseName

  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  let shared = {
    data: {
      server: undefined,
      copy: [],
      current: 0
    },
    focus: {
      schedBlocks: undefined,
      block: undefined
    }
  }
  let svg = {}
  let box = {}
  let lenD = {}

  let com = {}

  let filters = {states: [], errors: []}
  let tokens = { blockState: {}, blockError: {} }
  let filteredTokens = { blockState: {}, blockError: {} }

  let blockQueueServer = null
  let blockFilters = null

  let eventQueue = new EventQueue()

  // let thisCommentNightSched = this
  // let isSouth = window.__nsType__ === 'S'

  let sgvTag = {}
  $.each(widgetEle, function (index, eleNow) {
    sgvTag[eleNow.id] = {
      id: tagArrZoomerPlotsSvg + eleNow.id,
      widget: eleNow.widget,
      whRatio: eleNow.w / eleNow.h
    }
  })

  // delay counters
  let locker = new Locker()
  locker.add('inInit')

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function initData (dataIn) {
    function initSvg () {
      lenD.w = {}
      lenD.h = {}
      lenD.w[0] = 1000
      lenD.h[0] = lenD.w[0] / sgvTag.main.whRatio

      svg.svg = d3
        .select(svgDiv)
        .append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', '0 0 ' + lenD.w[0] + ' ' + lenD.h[0])
        .style('position', 'relative')
        .style('width', '100%')
        .style('height', '100%')
        .style('top', '0px')
        .style('left', '0px')
        .on('dblclick.zoom', null)

      if (disableScrollSVG) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }

      com.svgZoomNode = svg.svg.nodes()[0]
      svg.back = svg.svg.append('g')
      svg.g = svg.svg.append('g')
    }
    function initBackground () {
      svg.svg
        .style('background', '#444444')// colorTheme.bright.background)

      // svg.back.append('rect')
      //   .attr('x', -lenD.w[0] * 0.1)
      //   .attr('y', lenD.h[0] * 0.005)
      //   .attr('width', lenD.w[0] * 0.59)
      //   .attr('height', lenD.h[0] * 0.475 + lenD.h[0] * 0.0)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)
      //   .attr('rx', 0)
      // svg.back.append('text')
      //   .text('Scheduling blocks & Events')
      //   .style('fill', colorTheme.medium.text)
      //   // .style('stroke', colorTheme.medium.text)
      //   // .style('stroke-size', 0.1)
      //   .style('font-weight', '')
      //   .style('font-size', '10px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(' + ((-lenD.w[0] * 0.15 + lenD.w[0] * 0.59) * 0.5) + ',' + (lenD.h[0] * 0.03) + ')')
      // // svg.back.append('rect')
      // //   .attr('x', lenD.w[0] * 0.54 * 0.5 - lenD.w[0] * 0.05)
      // //   .attr('y', lenD.h[0] * 0.025 - lenD.h[0] * 0.015)
      // //   .attr('width', lenD.w[0] * 0.1)
      // //   .attr('height', lenD.h[0] * 0.03)
      // //   .attr('fill', colorTheme.medium.background)
      // //   .attr('stroke', '#000000')
      // //   .attr('stroke-width', 0.6)
      // //   .attr('rx', 2)
      // svg.back.append('rect')
      //   .attr('x', -lenD.w[0] * 0.1)
      //   .attr('y', lenD.h[0] * 0.487)
      //   .attr('width', lenD.w[0] * 0.59)
      //   .attr('height', lenD.h[0] * 0.405)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)
      //   .attr('rx', 0)
      // svg.back.append('text')
      //   .text('Telescopes')
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', '')
      //   .style('font-size', '10px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(' + ((-lenD.w[0] * 0.15 + lenD.w[0] * 0.59) * 0.5) + ',' + (lenD.h[0] * 0.51) + ')')
      // // svg.back.append('rect')
      // //   .attr('x', lenD.w[0] * 0.54 * 0.5 - lenD.w[0] * 0.05)
      // //   .attr('y', lenD.h[0] * 0.5 - lenD.h[0] * 0.0125)
      // //   .attr('width', lenD.w[0] * 0.1)
      // //   .attr('height', lenD.h[0] * 0.025)
      // //   .attr('fill', colorTheme.medium.background)
      // //   .attr('stroke', colorTheme.medium.stroke)
      // //   .attr('stroke-width', 0.4)
      // svg.back.append('rect')
      //   .attr('x', -lenD.w[0] * 0.1)
      //   .attr('y', lenD.h[0] * 0.9)
      //   .attr('width', lenD.w[0] * 0.59)
      //   .attr('height', lenD.h[0] * 0.1)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)
      //   .attr('rx', 0)
      //
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.493)
      //   .attr('y', lenD.h[0] * 0)
      //   .attr('width', lenD.w[0] * 0.507)
      //   .attr('height', lenD.h[0] * 1)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)
    }
    function initBox () {
      let marg = lenD.w[0] * 0.01
      box.log = {
        x: lenD.w[0] * 0 + marg,
        y: lenD.h[0] * 0.0 + marg,
        w: lenD.w[0] * 0.5 - 2 * marg,
        h: lenD.h[0] * 1 - 2 * marg,
        marg: marg
      }
      box.logInfo = {
        x: box.log.x * 0.0 + box.log.w * 0.0,
        y: box.log.y * 0.0 + box.log.w * 0.0,
        w: box.log.w * 0.75,
        h: box.log.h * 0.1,
        marg: box.log.marg
      }
      box.logHistory = {
        x: box.log.x * 0.0 + box.log.w * 0.75,
        y: box.log.y * 0.0 + box.log.w * 0.0,
        w: box.log.w * 0.25,
        h: box.log.h * 0.4,
        marg: box.log.marg
      }
      box.logCategories = {
        x: box.log.x * 0.0 + box.log.w * 0.5,
        y: box.log.y * 0.0 + box.log.w * 0.1,
        w: box.log.w * 0.25,
        h: box.log.h * 0.3,
        marg: box.log.marg
      }
      box.logText = {
        x: box.log.x * 0.0 + box.log.w * 0.0,
        y: box.log.y * 0.0 + box.log.w * 0.1,
        w: box.log.w * 0.5,
        h: box.log.h * 0.9,
        marg: box.log.marg
      }
      box.logAssociatedElement = {
        x: box.log.w * 0.6,
        y: box.log.h * 0.7,
        w: box.log.w * 0.4 - marg,
        h: box.log.h * 0.3 - marg,
        marg: box.log.marg
      }

      box.rightPanel = {
        x: lenD.w[0] * 0.5,
        y: lenD.h[0] * 0.0,
        w: lenD.w[0] * 0.5,
        h: lenD.h[0] * 1.0,
        marg: lenD.w[0] * 0.01
      }
      box.blockQueueServer = box.rightPanel
      // box.blockQueueServer = {
      //   x: lenD.w[0] * 0.5,
      //   y: lenD.h[0] * 0.0,
      //   w: lenD.w[0] * 0.5,
      //   h: lenD.h[0] * 0.5,
      //   marg: lenD.w[0] * 0.01
      // }
      box.blockQueueServerIcon = {
        x: box.blockQueueServer.w * 0.4625,
        y: box.blockQueueServer.h * 0.4625,
        w: box.blockQueueServer.w * 0.075,
        h: box.blockQueueServer.h * 0.075,
        marg: box.blockQueueServer.marg
      }
      box.blockQueueServerTab = {
        x: box.blockQueueServer.w * 0.225,
        y: box.blockQueueServer.h * 0.175,
        w: box.blockQueueServer.w * 0.05,
        h: box.blockQueueServer.h * 0.05,
        marg: box.blockQueueServer.marg
      }
      box.blockQueueServerTitle = {
        x: box.blockQueueServer.w * 0.0,
        y: box.blockQueueServer.h * 0.0,
        w: box.blockQueueServer.w * 0.8,
        h: box.blockQueueServer.h * 0.1,
        marg: box.blockQueueServer.marg
      }
      box.blockQueueServerFilter = {
        x: box.blockQueueServer.w * 0.1,
        y: box.blockQueueServer.h * 0.1,
        w: box.blockQueueServer.w * 0.6,
        h: box.blockQueueServer.h * 0.4,
        marg: box.blockQueueServer.marg
      }
      box.blockQueueServerContent = {
        x: box.blockQueueServer.marg * 3,
        y: box.blockQueueServer.h * 0.575,
        w: box.blockQueueServer.w * 0.85,
        h: box.blockQueueServer.h * 0.35,
        marg: box.blockQueueServer.marg
      }

      box.eventQueue = {
        x: lenD.w[0] * 0.5,
        y: lenD.h[0] * 0.34,
        w: lenD.w[0] * 0.5,
        h: lenD.h[0] * 0.33,
        marg: lenD.w[0] * 0.01
      }
      box.eventQueueServer = {
        x: box.eventQueue.x + box.eventQueue.w * 0.23,
        y: box.eventQueue.y + box.eventQueue.h * 0.0,
        w: box.eventQueue.w * 0.74,
        h: box.eventQueue.h * 0.8,
        marg: box.eventQueue.marg
      }
      box.telescopes = {
        x: lenD.w[0] * 0.5,
        y: lenD.h[0] * 0.56,
        w: lenD.w[0] * 0.48,
        h: lenD.h[0] * 0.5,
        marg: lenD.w[0] * 0.01
      }
      box.clock = {
        x: lenD.w[0] * 0.002,
        y: lenD.h[0] * 0.92,
        w: lenD.w[0] * 0.485,
        h: lenD.h[0] * 0.05,
        marg: lenD.w[0] * 0.01
      }
    }
    function initDefaultStyle () {
      shared.style = {}
      shared.style.runRecCol = colsBlues[2]
      shared.style.blockCol = function (optIn) {
        let endTime = hasVar(optIn.endTime)
          ? optIn.endTime
          : undefined
        if (endTime < Number(shared.data.server.timeOfNight.now)) return colorTheme.blocks.shutdown

        let state = hasVar(optIn.exeState.state)
          ? optIn.exeState.state
          : undefined
        console.log(state);
        let canRun = hasVar(optIn.exeState.canRun)
          ? optIn.exeState.canRun
          : undefined
        if (state === 'wait') {
          return colorTheme.blocks.wait
        } else if (state === 'done') {
          return colorTheme.blocks.done
        } else if (state === 'fail') {
          return colorTheme.blocks.fail
        } else if (state === 'run') {
          return colorTheme.blocks.run
        } else if (state === 'cancel') {
          if (hasVar(canRun)) {
            if (!canRun) return colorTheme.blocks.cancelOp
          }
          return colorTheme.blocks.cancelSys
        } else return colorTheme.blocks.shutdown
      }
    }

    if (sock.multipleInit({ id: widgetId, data: dataIn })) return
    window.sideDiv = sock.setSideDiv({
      id: sideId,
      nIcon: dataIn.nIcon,
      iconDivV: iconDivV
    })
    let svgDivId = sgvTag.main.id + 'svg'
    let svgDiv = sgvTag.main.widget.getEle(svgDivId)
    if (!hasVar(svgDiv)) {
      let parent = sgvTag.main.widget.getEle(sgvTag.main.id)
      let svgDiv = document.createElement('div')
      svgDiv.id = svgDivId

      appendToDom(parent, svgDiv)

      runWhenReady({
        pass: function () {
          return hasVar(sgvTag.main.widget.getEle(svgDivId))
        },
        execute: function () {
          initData(dataIn)
        }
      })

      return
    }
    sock.emitMouseMove({ eleIn: svgDiv, data: { widgetId: widgetId } })

    initSvg()
    initDefaultStyle()
    initBackground()
    initBox()

    com.dataIn = dataIn
    shared.data.server = dataIn.data

    svgTextEditor.initData(dataIn.data)
    svgBlocksQueueServer.initData(dataIn.data)
    svgEvents.initData(dataIn.data)
    // svgTelescopes.initData(dataIn.data)
    // svgDAQ.initData()
    // svgBottomInfo.initData(dataIn.data)
  }
  this.initData = initData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateData (dataIn) {
    com.dataIn = dataIn
    shared.data.server = dataIn.data

    // clusterData(com.dataIn.data)
    // filterData(com.dataIn.data)

    svgBlocksQueueServer.updateData()
    svgEvents.updateData(dataIn.data)
    // svgTelescopes.updateData(dataIn.data)
    // svgFilterBlocks.updateData(dataIn.data)
    // svgMiddleInfo.updateData(dataIn.data)
    // svgBottomInfo.updateData(dataIn.data)
  }
  this.updateData = updateData

  function clusterData (dataIn) {
    tokens.blockState = {}
    tokens.blockError = {}
    for (var i = 0; i < dataIn.blocks.done.length; i++) {
      if (hasVar(tokens.blockState[dataIn.blocks.done[i].exeState.state])) {
        if (!tokens.blockState[dataIn.blocks.done[i].exeState.state].includes(dataIn.blocks.done[i].obId)) {
          tokens.blockState[dataIn.blocks.done[i].exeState.state].push(dataIn.blocks.done[i].obId)
        }
      } else {
        tokens.blockState[dataIn.blocks.done[i].exeState.state] = [dataIn.blocks.done[i].obId]
      }

      if (dataIn.blocks.done[i].exeState.state === 'cancel' || dataIn.blocks.done[i].exeState.state === 'fail') {
        if (hasVar(tokens.blockError[dataIn.blocks.done[i].exeState.error])) {
          if (!tokens.blockError[dataIn.blocks.done[i].exeState.error].includes(dataIn.blocks.done[i].obId)) {
            tokens.blockError[dataIn.blocks.done[i].exeState.error].push(dataIn.blocks.done[i].obId)
          }
        } else {
          tokens.blockError[dataIn.blocks.done[i].exeState.error] = [dataIn.blocks.done[i].obId]
        }
      }
    }
  }
  function checkWithErrorsFilters (block) {
    if (filters.errors.length === 0) return true
    for (let i = 0; i < filters.errors.length; i++) {
      if (filters.errors[i].id === block.error) return true
    }
    return false
  }
  function checkWithStatesFilters (block) {
    if (filters.states.length === 0) return true
    for (let i = 0; i < filters.states.length; i++) {
      if (filters.states[i].id === block.state) return true
    }
    return false
  }
  function filterData (dataIn) {
    filteredTokens.blockState = {}
    filteredTokens.blockError = {}
    for (var i = 0; i < dataIn.blocks.done.length; i++) {
      if (checkWithErrorsFilters(dataIn.blocks.done[i].exeState)) {
        if (hasVar(filteredTokens.blockState[dataIn.blocks.done[i].exeState.state])) {
          if (!filteredTokens.blockState[dataIn.blocks.done[i].exeState.state].includes(dataIn.blocks.done[i].obId)) {
            filteredTokens.blockState[dataIn.blocks.done[i].exeState.state].push(dataIn.blocks.done[i].obId)
          }
        } else {
          filteredTokens.blockState[dataIn.blocks.done[i].exeState.state] = [dataIn.blocks.done[i].obId]
        }
      }

      if (checkWithStatesFilters(dataIn.blocks.done[i].exeState)) {
        if (dataIn.blocks.done[i].exeState.state === 'cancel' || dataIn.blocks.done[i].exeState.state === 'fail') {
          if (hasVar(filteredTokens.blockError[dataIn.blocks.done[i].exeState.error])) {
            if (!filteredTokens.blockError[dataIn.blocks.done[i].exeState.error].includes(dataIn.blocks.done[i].obId)) {
              filteredTokens.blockError[dataIn.blocks.done[i].exeState.error].push(dataIn.blocks.done[i].obId)
            }
          } else {
            filteredTokens.blockError[dataIn.blocks.done[i].exeState.error] = [dataIn.blocks.done[i].obId]
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function syncStateSend (dataIn) {
    if (sock.conStat.isOffline()) return

    sock.sockSyncStateSend({
      widgetId: widgetId,
      type: dataIn.type,
      data: dataIn
    })
  }

  // ---------------------------------------------------------------------------------------------------
  let SvgTextEditor = function () {
    let reserved = {
      main: {
        g: undefined,
        box: {}
      }
    }

    // function initinputHistory () {
    //   function initLocalHistory () {
    //     reserved.inputHistory.local.scroll.scrollBoxG = reserved.inputHistory.local.g.append('g')
    //     let historyBox = reserved.inputHistory.local.box
    //     reserved.inputHistory.local.scroll.scrollBoxG.append('rect')
    //       .attr('x', historyBox.x)
    //       .attr('y', historyBox.y)
    //       .attr('width', historyBox.w)
    //       .attr('height', historyBox.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     reserved.inputHistory.local.scroll.scrollBox = new ScrollBox()
    //     reserved.inputHistory.local.scroll.scrollBox.init({
    //       tag: 'inputHistoryScrollBox',
    //       gBox: reserved.inputHistory.local.scroll.scrollBoxG,
    //       boxData: {
    //         x: historyBox.x,
    //         y: historyBox.y,
    //         w: historyBox.w,
    //         h: historyBox.h,
    //         marg: 0
    //       },
    //       useRelativeCoords: true,
    //       locker: new Locker(),
    //       lockerV: [widgetId + 'updateData'],
    //       lockerZoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoomDuring',
    //         end: 'ScrollBox' + 'zoomEnd'
    //       },
    //       runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
    //       canScroll: true,
    //       scrollVertical: true,
    //       scrollHorizontal: false,
    //       scrollHeight: 0.1 + historyBox.h,
    //       scrollWidth: 0,
    //       background: 'transparent',
    //       scrollRecH: {h: 2},
    //       scrollRecV: {w: 2}
    //     })
    //     reserved.inputHistory.local.scroll.scrollG = reserved.inputHistory.local.scroll.scrollBox.get('innerG')
    //   }
    //   function initGeneralHistory () {
    //     reserved.inputHistory.general.scroll.scrollBoxG = reserved.inputHistory.general.g.append('g')
    //     let historyBox = reserved.inputHistory.general.box
    //     reserved.inputHistory.general.scroll.scrollBoxG.append('rect')
    //       .attr('x', historyBox.x)
    //       .attr('y', historyBox.y)
    //       .attr('width', historyBox.w)
    //       .attr('height', historyBox.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     reserved.inputHistory.general.scroll.scrollBox = new ScrollBox()
    //     reserved.inputHistory.general.scroll.scrollBox.init({
    //       tag: 'inputHistoryScrollBox',
    //       gBox: reserved.inputHistory.general.scroll.scrollBoxG,
    //       boxData: {
    //         x: historyBox.x,
    //         y: historyBox.y,
    //         w: historyBox.w,
    //         h: historyBox.h,
    //         marg: 0
    //       },
    //       useRelativeCoords: true,
    //       locker: new Locker(),
    //       lockerV: [widgetId + 'updateData'],
    //       lockerZoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoomDuring',
    //         end: 'ScrollBox' + 'zoomEnd'
    //       },
    //       runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
    //       canScroll: true,
    //       scrollVertical: true,
    //       scrollHorizontal: false,
    //       scrollHeight: 0.1 + historyBox.h,
    //       scrollWidth: 0,
    //       background: 'transparent',
    //       scrollRecH: {h: 2},
    //       scrollRecV: {w: 2}
    //     })
    //     reserved.inputHistory.general.scroll.scrollG = reserved.inputHistory.general.scroll.scrollBox.get('innerG')
    //   }
    //
    //   reserved.inputHistory.main.g.attr('transform', 'translate(' + reserved.inputHistory.main.box.x + ',' + reserved.inputHistory.main.box.y + ')')
    //   reserved.inputHistory.main.g.append('text')
    //     .text('Operators operations :')
    //     .attr('x', 2)
    //     .attr('y', 0 - reserved.inputHistory.main.box.h * 0.03)
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', '')
    //     .style('font-size', '8px')
    //     .attr('text-anchor', 'start')
    //   reserved.inputHistory.main.g.append('line')
    //     .attr('x1', 2)
    //     .attr('y1', 0 - reserved.inputHistory.main.box.h * 0.02)
    //     .attr('x2', reserved.inputHistory.main.box.w * 0.9)
    //     .attr('y2', 0 - reserved.inputHistory.main.box.h * 0.02)
    //     .attr('stroke-width', 0.4)
    //     .attr('stroke', colorTheme.medium.stroke)
    //
    //   reserved.inputHistory.general = {
    //     g: reserved.inputHistory.main.g.append('g'),
    //     box: {
    //       x: 0,
    //       y: reserved.inputHistory.main.box.h * 0.0,
    //       w: reserved.inputHistory.main.box.w * 1,
    //       h: reserved.inputHistory.main.box.h * 0.49
    //     },
    //     scroll: {}
    //   }
    //   reserved.inputHistory.local = {
    //     g: reserved.inputHistory.main.g.append('g'),
    //     box: {
    //       x: reserved.inputHistory.main.box.w * 0.3,
    //       y: reserved.inputHistory.main.box.h * 0.51,
    //       w: reserved.inputHistory.main.box.w * 0.7,
    //       h: reserved.inputHistory.main.box.h * 0.49
    //     },
    //     scroll: {}
    //   }
    //   initGeneralHistory()
    //   initLocalHistory()
    // }
    // function initOnlineOperator () {
    //   reserved.onlineOperator.main.g.attr('transform', 'translate(' + reserved.onlineOperator.main.box.x + ',' + reserved.onlineOperator.main.box.y + ')')
    //   reserved.onlineOperator.main.g.append('text')
    //     .text('Operators online :')
    //     .attr('x', 2)
    //     .attr('y', 0 - reserved.onlineOperator.main.box.h * 0.03)
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', '')
    //     .style('font-size', '8px')
    //     .attr('text-anchor', 'start')
    //   reserved.onlineOperator.main.g.append('line')
    //     .attr('x1', 2)
    //     .attr('y1', 0 - reserved.onlineOperator.main.box.h * 0.02)
    //     .attr('x2', reserved.onlineOperator.main.box.w * 0.9)
    //     .attr('y2', 0 - reserved.onlineOperator.main.box.h * 0.02)
    //     .attr('stroke-width', 0.4)
    //     .attr('stroke', colorTheme.medium.stroke)
    //
    //   let op = reserved.onlineOperator.main.g.selectAll('g.operators')
    //     .data([{icon: 'A', name: 'Anna'}, {icon: 'B', name: 'Bob'}, {icon: 'C', name: 'Connor'}])
    //   let opEnter = op.enter()
    //     .append('g')
    //     .attr('class', 'operators')
    //     .attr('transform', function (d, i) {
    //       let tx = reserved.onlineOperator.main.box.w * 0.1
    //       let ty = 0 + reserved.onlineOperator.main.box.w * 0.25 * (i)
    //       return 'translate(' + tx + ',' + ty + ')'
    //     })
    //   opEnter.each(function (d) {
    //     d3.select(this).append('rect')
    //       .attr('x', 0)
    //       .attr('y', 0)
    //       .attr('width', reserved.onlineOperator.main.box.w * 0.2)
    //       .attr('height', reserved.onlineOperator.main.box.w * 0.2)
    //       .attr('stroke', '#000000')
    //       .attr('stroke-width', 0.2)
    //       .attr('fill', colorTheme.dark.background)
    //     d3.select(this).append('text')
    //       .text(d.icon)
    //       .attr('x', reserved.onlineOperator.main.box.w * 0.1)
    //       .attr('y', reserved.onlineOperator.main.box.w * 0.1)
    //       .attr('dy', 3)
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //     d3.select(this).append('text')
    //       .text(d.name)
    //       .attr('x', reserved.onlineOperator.main.box.w * 0.3)
    //       .attr('y', reserved.onlineOperator.main.box.w * 0.1)
    //       .attr('dy', 3)
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'start')
    //   })
    // }
    // function initFocusedItemHeader () {
    //   reserved.focusedItemHeader.main.g.append('text')
    //     .text('No element on focus')
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', '')
    //     .style('font-size', '14px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' +
    //       (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.5) +
    //       ',' +
    //       (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.6) + ')')
    //   reserved.focusedItemHeader.main.g.append('text')
    //     .text('X')
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', 'bold')
    //     .style('font-size', '14px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' +
    //       (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.15) +
    //       ',' +
    //       (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.9) + ')')
    //   reserved.focusedItemHeader.main.g.append('text')
    //     .text('X')
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', 'bold')
    //     .style('font-size', '14px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' +
    //       (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.85) +
    //       ',' +
    //       (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.9) + ')')
    // }
    // function initFocusedItemInfo () {
    //   function initFocusPreview () {
    //     reserved.focusedItemInfo.preview.g.append('rect')
    //       .attr('x', reserved.focusedItemInfo.preview.box.x)
    //       .attr('y', reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.0)
    //       .attr('width', reserved.focusedItemInfo.preview.box.h * 1)
    //       .attr('height', reserved.focusedItemInfo.preview.box.h * 1)
    //       .attr('fill', colorTheme.medium.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 1.5)
    //     reserved.focusedItemInfo.preview.g = reserved.focusedItemInfo.preview.g.append('g')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('Preview')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.25) + ')')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('of')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.4) + ')')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('Block /')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.55) + ')')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('Telescope /')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.7) + ')')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('...')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.85) + ')')
    //   }
    //   function initFocusFields () {
    //     reserved.focusedItemInfo.fields.scroll.scrollBoxG = reserved.focusedItemInfo.fields.g.append('g')
    //     let historyBox = reserved.focusedItemInfo.fields.box
    //     reserved.focusedItemInfo.fields.scroll.scrollBoxG.append('rect')
    //       .attr('x', historyBox.x)
    //       .attr('y', historyBox.y)
    //       .attr('width', historyBox.w)
    //       .attr('height', historyBox.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     reserved.focusedItemInfo.fields.scroll.scrollBox = new ScrollBox()
    //     reserved.focusedItemInfo.fields.scroll.scrollBox.init({
    //       tag: 'inputHistoryScrollBox',
    //       gBox: reserved.focusedItemInfo.fields.scroll.scrollBoxG,
    //       boxData: {
    //         x: historyBox.x,
    //         y: historyBox.y,
    //         w: historyBox.w,
    //         h: historyBox.h,
    //         marg: 0
    //       },
    //       useRelativeCoords: true,
    //       locker: new Locker(),
    //       lockerV: [widgetId + 'updateData'],
    //       lockerZoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoomDuring',
    //         end: 'ScrollBox' + 'zoomEnd'
    //       },
    //       runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
    //       canScroll: true,
    //       scrollVertical: true,
    //       scrollHorizontal: false,
    //       scrollHeight: 0.1 + historyBox.h,
    //       scrollWidth: 0,
    //       background: 'transparent',
    //       scrollRecH: {h: 6},
    //       scrollRecV: {w: 6}
    //     })
    //     reserved.focusedItemInfo.info.scroll.scrollG = reserved.focusedItemInfo.fields.scroll.scrollBox.get('innerG')
    //
    //     let dimField = {
    //       w: reserved.focusedItemInfo.fields.box.w,
    //       h: reserved.focusedItemInfo.fields.box.h * 0.1,
    //       margW: 0, // reserved.focusedItemInfo.focusFields.box.w * 0.04,
    //       margH: 0 // reserved.focusedItemInfo.focusFields.box.h * 0.04
    //     }
    //     let fields = reserved.focusedItemInfo.info.g.selectAll('g.fields')
    //       .data([{name: 'A'}, {name: 'B'}, {name: 'C'}, {name: 'D'}, {name: 'E'}, {name: 'F'}, {name: 'G'}, {name: 'H'}])
    //     let fieldsEnter = fields.enter()
    //       .append('g')
    //       .attr('class', 'fields')
    //       .attr('transform', function (d, i) {
    //         let tx = reserved.focusedItemInfo.info.box.x + dimField.margW * ((i % 4) + 1) + (dimField.w * (i % 4))
    //         let ty = reserved.focusedItemInfo.info.box.y + dimField.margH * (parseInt(i / 4) + 1) + (dimField.h * parseInt(i / 4))
    //         return 'translate(' + tx + ',' + ty + ')'
    //       })
    //     fieldsEnter.each(function (d) {
    //       d3.select(this).append('rect')
    //         .attr('x', 0)
    //         .attr('y', 0)
    //         .attr('width', dimField.w)
    //         .attr('height', dimField.h)
    //         .attr('stroke', '#000000')
    //         .attr('stroke-width', 0.2)
    //         .attr('fill', colorTheme.dark.background)
    //       // d3.select(this).append('text')
    //       //   .text(d.name)
    //       //   .attr('x', 0)
    //       //   .attr('y', 2)
    //       //   .style('fill', colorTheme.medium.text)
    //       //   .style('font-weight', '')
    //       //   .style('font-size', '7px')
    //       //   .attr('text-anchor', 'middle')
    //     })
    //   }
    //   function initFocusInfo () {
    //     reserved.focusedItemInfo.info.scroll.scrollBoxG = reserved.focusedItemInfo.info.g.append('g')
    //     reserved.focusedItemInfo.info.scroll.scrollBoxG.append('rect')
    //       .attr('x', reserved.focusedItemInfo.info.box.x)
    //       .attr('y', reserved.focusedItemInfo.info.box.y)
    //       .attr('width', reserved.focusedItemInfo.info.box.w)
    //       .attr('height', reserved.focusedItemInfo.info.box.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     let historyBox = reserved.focusedItemInfo.info.box
    //     reserved.focusedItemInfo.info.scroll.scrollBoxG.append('rect')
    //       .attr('x', historyBox.x)
    //       .attr('y', historyBox.y)
    //       .attr('width', historyBox.w)
    //       .attr('height', historyBox.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     reserved.focusedItemInfo.info.scroll.scrollBox = new ScrollBox()
    //     reserved.focusedItemInfo.info.scroll.scrollBox.init({
    //       tag: 'inputHistoryScrollBox',
    //       gBox: reserved.focusedItemInfo.info.scroll.scrollBoxG,
    //       boxData: {
    //         x: historyBox.x,
    //         y: historyBox.y,
    //         w: historyBox.w,
    //         h: historyBox.h,
    //         marg: 0
    //       },
    //       useRelativeCoords: true,
    //       locker: new Locker(),
    //       lockerV: [widgetId + 'updateData'],
    //       lockerZoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoomDuring',
    //         end: 'ScrollBox' + 'zoomEnd'
    //       },
    //       runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
    //       canScroll: true,
    //       scrollVertical: true,
    //       scrollHorizontal: false,
    //       scrollHeight: 0.1 + historyBox.h,
    //       scrollWidth: 0,
    //       background: 'transparent',
    //       scrollRecH: {h: 6},
    //       scrollRecV: {w: 6}
    //     })
    //     reserved.focusedItemInfo.info.scroll.scrollG = reserved.focusedItemInfo.info.scroll.scrollBox.get('innerG')
    //   }
    //   reserved.focusedItemInfo.main.g.attr('transform', 'translate(' + reserved.focusedItemInfo.main.box.x + ',' + reserved.focusedItemInfo.main.box.y + ')')
    //   reserved.focusedItemInfo.preview = {
    //     g: reserved.focusedItemInfo.main.g.append('g'),
    //     box: {
    //       x: 0,
    //       y: 0,
    //       w: reserved.focusedItemInfo.main.box.h * 0.325,
    //       h: reserved.focusedItemInfo.main.box.h * 0.325
    //     }
    //   }
    //   reserved.focusedItemInfo.fields = {
    //     g: reserved.focusedItemInfo.main.g.append('g'),
    //     box: {
    //       x: 0,
    //       y: 0 + reserved.focusedItemInfo.main.box.h * 0.35,
    //       w: reserved.focusedItemInfo.main.box.h * 0.325,
    //       h: reserved.focusedItemInfo.main.box.h * 0.65
    //     },
    //     scroll: {}
    //   }
    //   reserved.focusedItemInfo.info = {
    //     g: reserved.focusedItemInfo.main.g.append('g'),
    //     box: {
    //       x: 0 + reserved.focusedItemInfo.main.box.h * 0.35,
    //       y: 0,
    //       w: reserved.focusedItemInfo.main.box.w - (reserved.focusedItemInfo.main.box.h * 0.35),
    //       h: reserved.focusedItemInfo.main.box.h
    //     },
    //     scroll: {}
    //   }
    //   initFocusPreview()
    //   initFocusFields()
    //   initFocusInfo()
    // }
    // function initTextInput () {
    //   reserved.textInput.main.g.append('rect')
    //     .attr('x', reserved.textInput.main.box.x)
    //     .attr('y', reserved.textInput.main.box.y)
    //     .attr('width', reserved.textInput.main.box.w)
    //     .attr('height', reserved.textInput.main.box.h)
    //     .attr('fill', colorTheme.dark.background)
    //     .attr('stroke', colorTheme.dark.stroke)
    //     .attr('stroke-width', 0.2)
    // }
    function initAssociatedElement () {
      reserved.associatedElement.g.attr('transform', 'translate(' + reserved.associatedElement.box.x + ',' + reserved.associatedElement.box.y + ')')

      reserved.associatedElement.g.append('text')
        .text('Associated elements')
        .attr('x', reserved.associatedElement.box.w * 0.5)
        .attr('y', 3)
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '9px')
        .attr('text-anchor', 'middle')

      reserved.associatedElement.blocks.icon = reserved.associatedElement.g.append('g')
        .attr('transform', 'translate(' + (reserved.associatedElement.box.w * 0.8) + ',' + (reserved.associatedElement.box.h * 0.2) + ')')
      reserved.associatedElement.blocks.icon.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.associatedElement.box.w * 0.11)
        .attr('height', reserved.associatedElement.box.w * 0.1)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
        .attr('opacity', 0)
        .on('mouseover', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
        })
        .on('mouseout', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
        })
      reserved.associatedElement.blocks.icon.append('svg:image')
        .attr('xlink:href', '/static/icons/blocks.svg')
        .attr('width', reserved.associatedElement.box.w * 0.075)
        .attr('height', reserved.associatedElement.box.w * 0.075)
        .attr('x', reserved.associatedElement.box.w * 0.01)
        .attr('y', reserved.associatedElement.box.h * 0.01)
        .style('pointer-events', 'none')
      reserved.associatedElement.blocks.icon.append('text')
        .text('+')
        .style('font-size', '11px')
        .attr('x', reserved.associatedElement.box.w * 0.075)
        .attr('y', reserved.associatedElement.box.h * 0.145)
        .style('pointer-events', 'none')
        .style('pointer-events', 'none')

      reserved.associatedElement.events.icon = reserved.associatedElement.g.append('g')
        .attr('transform', 'translate(' + (reserved.associatedElement.box.w * 0.8) + ',' + (reserved.associatedElement.box.h * 0.45) + ')')
      reserved.associatedElement.events.icon.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.associatedElement.box.w * 0.11)
        .attr('height', reserved.associatedElement.box.w * 0.1)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
        .attr('opacity', 0)
        .on('mouseover', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
        })
        .on('mouseout', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
        })
      reserved.associatedElement.events.icon.append('svg:image')
        .attr('xlink:href', '/static/icons/warning.svg')
        .attr('width', reserved.associatedElement.box.w * 0.08)
        .attr('height', reserved.associatedElement.box.w * 0.08)
        .attr('x', reserved.associatedElement.box.w * 0.01)
        .attr('y', reserved.associatedElement.box.h * 0.01)
        .style('pointer-events', 'none')
      reserved.associatedElement.events.icon.append('text')
        .text('+')
        .style('font-size', '11px')
        .attr('x', reserved.associatedElement.box.w * 0.075)
        .attr('y', reserved.associatedElement.box.h * 0.145)
        .style('pointer-events', 'none')

      reserved.associatedElement.tels.icon = reserved.associatedElement.g.append('g')
        .attr('transform', 'translate(' + (reserved.associatedElement.box.w * 0.8) + ',' + (reserved.associatedElement.box.h * 0.7) + ')')
      reserved.associatedElement.tels.icon.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.associatedElement.box.w * 0.11)
        .attr('height', reserved.associatedElement.box.w * 0.1)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
        .attr('opacity', 0)
        .on('mouseover', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
        })
        .on('mouseout', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
        })
      reserved.associatedElement.tels.icon.append('svg:image')
        .attr('xlink:href', '/static/icons/telescope.svg')
        .attr('width', reserved.associatedElement.box.w * 0.1)
        .attr('height', reserved.associatedElement.box.w * 0.09)
        .attr('x', reserved.associatedElement.box.w * 0.00)
        .attr('y', reserved.associatedElement.box.h * 0.005)
        .style('pointer-events', 'none')
      reserved.associatedElement.tels.icon.append('text')
        .text('+')
        .style('font-size', '11px')
        .attr('x', reserved.associatedElement.box.w * 0.075)
        .attr('y', reserved.associatedElement.box.h * 0.145)
        .style('pointer-events', 'none')
        .style('pointer-events', 'none')
    }
    function initData (dataIn) {
      reserved.main.box = {
        x: box.log.x,
        y: box.log.y,
        w: box.log.w,
        h: box.log.h,
        marg: box.log.marg
      }
      reserved.main.g = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.main.box.x + ',' + reserved.main.box.y + ')')
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .curve(d3.curveLinear)
      let dataPointFuturTop = [
        {x: 0, y: 0},
        {x: -5, y: 5},
        {x: -5, y: reserved.main.box.h + 5},
        {x: reserved.main.box.w - 5, y: reserved.main.box.h + 5},
        {x: reserved.main.box.w + 0, y: reserved.main.box.h},
        {x: 0, y: reserved.main.box.h},
        {x: -5, y: reserved.main.box.h + 5},
        {x: 0, y: reserved.main.box.h},
        {x: 0, y: 0}
      ]
      reserved.main.g.append('path')
        .data([dataPointFuturTop])
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
      reserved.main.g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.main.box.w)
        .attr('height', reserved.main.box.h)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('stroke-width', 0.2)

      reserved.associatedElement = {
        g: reserved.main.g.append('g'),
        box: box.logAssociatedElement,
        blocks: {
          icon: undefined
        },
        events: {
          icon: undefined
        },
        tels: {
          icon: undefined
        }
      }
      // reserved.inputHistory = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x,
      //       y: reserved.adjustedBox.y + box.log.h * 0.06,
      //       w: box.log.w * 0.165,
      //       h: box.log.h * 0.45,
      //       marg: box.telescopes.marg
      //     }
      //   }
      // }
      // reserved.onlineOperator = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x + box.log.w * 0.825,
      //       y: reserved.adjustedBox.y + box.log.h * 0.06,
      //       w: box.log.w * 0.165,
      //       h: box.log.h * 0.45,
      //       marg: box.telescopes.marg
      //     }
      //   }
      // }
      // reserved.focusedItemHeader = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x + box.log.w * 0.175,
      //       y: reserved.adjustedBox.y + box.log.h * 0.0,
      //       w: box.log.w * 0.65,
      //       h: box.log.h * 0.06,
      //       marg: box.telescopes.marg * 0.5
      //     }
      //   }
      // }
      // reserved.focusedItemInfo = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x + box.log.w * 0.15,
      //       y: reserved.adjustedBox.y + box.log.h * 0.53,
      //       w: box.log.w * 0.7,
      //       h: box.log.h * 0.4,
      //       marg: box.telescopes.marg * 0.5
      //     }
      //   }
      // }
      // reserved.textInput = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x + box.log.w * 0.175,
      //       y: reserved.adjustedBox.y + box.log.h * 0.06,
      //       w: box.log.w * 0.65,
      //       h: box.log.h * 0.45,
      //       marg: box.telescopes.marg * 0.5
      //     }
      //   }
      // }

      initAssociatedElement()
      // initinputHistory()
      // initOnlineOperator()
      // initFocusedItemHeader()
      // initFocusedItemInfo()
      // initTextInput()
    }
    this.initData = initData

    function updateData (dataIn) {}
    this.updateData = updateData
  }
  let SvgBlocksQueueServer = function () {
    let reserved = {
      main: {
        g: undefined,
        mode: 'icon'
      },
      back: {
        g: undefined
      },
      icon: {
        g: undefined
      },
      title: {
        g: undefined
      },
      filter: {
        g: undefined
      },
      content: {
        g: undefined
      }
    }

    function initData () {
      reserved.main.g = svg.g.append('g')
        .attr('transform', 'translate(' + box.blockQueueServer.x + ',' + box.blockQueueServer.y + ')')

      reserved.icon.g = reserved.main.g.append('g')
        .attr('transform', 'translate(' + box.blockQueueServerIcon.x + ',' + box.blockQueueServerIcon.y + ')')
        .attr('opacity', 1)
      reserved.title.g = reserved.main.g.append('g')
        .attr('transform', 'translate(' + box.blockQueueServerTitle.x + ',' + box.blockQueueServerTitle.y + ')')
      reserved.filter.g = reserved.main.g.append('g')
        .attr('transform', 'translate(' + box.blockQueueServerFilter.x + ',' + box.blockQueueServerFilter.y + ')')
      reserved.content.g = reserved.main.g.append('g')
        .attr('transform', 'translate(' + box.blockQueueServerContent.x + ',' + box.blockQueueServerContent.y + ')')

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .curve(d3.curveLinear)
      let dataPointFuturTop = [
        {x: 0, y: 0},
        {x: -5, y: 5},
        {x: -5, y: box.blockQueueServerIcon.h + 5},
        {x: box.blockQueueServerIcon.w - 5, y: box.blockQueueServerIcon.h + 5},
        {x: box.blockQueueServerIcon.w + 0, y: box.blockQueueServerIcon.h},
        {x: 0, y: box.blockQueueServerIcon.h},
        {x: -5, y: box.blockQueueServerIcon.h + 5},
        {x: 0, y: box.blockQueueServerIcon.h},
        {x: 0, y: 0}
      ]
      reserved.icon.g.append('path')
        .data([dataPointFuturTop])
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
      reserved.icon.g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.blockQueueServerIcon.w)
        .attr('height', box.blockQueueServerIcon.h)
        .attr('fill', colorTheme.bright.background)
        .attr('stroke', colorTheme.bright.stroke)
        .attr('stroke-width', 0.2)
        .on('mouseover', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('fill', colorTheme.dark.background)
        })
        .on('mouseout', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('fill', colorTheme.bright.background)
        })
        .on('click', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('x', -5).attr('y', 5)
          reserved.icon.g.transition().duration(timeD.animArc).attr('opacity', 0).on('end', function () {
            reserved.main.mode = 'expand'
            drawBlockQueueServer()
          })
        })
      reserved.icon.g.append('svg:image')
        .attr('xlink:href', '/static/icons/blocks.svg')
        .attr('width', box.blockQueueServerIcon.w * 0.6)
        .attr('height', box.blockQueueServerIcon.h * 0.6)
        .attr('x', box.blockQueueServerIcon.w * 0.2)
        .attr('y', box.blockQueueServerIcon.h * 0.2)
        .style('pointer-events', 'none')
    }
    this.initData = initData

    function drawBlockQueueServer () {
      function drawBack () {
        let lineGenerator = d3.line()
          .x(function (d) { return d.x })
          .y(function (d) { return d.y })
          .curve(d3.curveLinear)
        let b = {
          x: box.blockQueueServer.marg,
          y: box.blockQueueServer.marg,
          w: box.blockQueueServer.w - (2 * box.blockQueueServer.marg),
          h: box.blockQueueServer.h - (2 * box.blockQueueServer.marg)
        }
        let dataPointBottom = [
          {x: b.x, y: b.y},
          {x: b.x + b.w * 0.8, y: b.y},
          {x: b.x + b.w * 0.8, y: b.y + b.h * 0.5},
          {x: b.x + b.w, y: b.y + b.h * 0.5},
          {x: b.x + b.w, y: b.y + b.h},
          {x: b.x, y: b.y + b.h},
          {x: b.x, y: b.y}
        ]
        reserved.back.g.append('path')
          .data([dataPointBottom])
          .attr('d', lineGenerator)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.medium.stroke)
          .attr('stroke-width', 0.2)

        let dataPointFuturTop = [
          {x: b.x, y: b.y},
          {x: b.x - 5, y: b.y + 5},
          {x: b.x - 5, y: b.y + b.h + 5},
          {x: b.x + b.w - 5, y: b.y + b.h + 5},
          {x: b.x + b.w, y: b.y + b.h},
          {x: b.x, y: b.y + b.h},
          {x: b.x - 5, y: b.y + b.h + 5},
          {x: b.x, y: b.y + b.h},
          {x: b.x, y: b.y}
        ]
        reserved.back.g.append('path')
          .data([dataPointFuturTop])
          .attr('d', lineGenerator)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
      }
      function drawTitle () {
        reserved.title.g.append('svg:image')
          .attr('xlink:href', '/static/icons/blocks.svg')
          .attr('width', box.blockQueueServerTitle.h * 0.6)
          .attr('height', box.blockQueueServerTitle.h * 0.6)
          .attr('x', box.blockQueueServerTitle.w * 0.075 - (box.blockQueueServerTitle.h * 0.3))
          .attr('y', box.blockQueueServerTitle.h * 0.6 - (box.blockQueueServerTitle.h * 0.3))
          .style('pointer-events', 'none')
        reserved.title.g.append('text')
          .text('Scheduling blocks')
          .attr('x', box.blockQueueServerTitle.w * 0.125)
          .attr('y', box.blockQueueServerTitle.h * 0.7)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '14px')
          .attr('text-anchor', 'start')
          // .attr('transform', 'translate(' +
          //   (box.blockQueueServerTitle.x + box.blockQueueServerTitle.w * 0.5) +
          //   ',' + (box.blockQueueServerTitle.y + box.blockQueueServerTitle.h * 1.0) + ')')
      }

      reserved.back.g = reserved.main.g.append('g')
        .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
      reserved.title.g = reserved.main.g.append('g')
        .attr('transform', 'translate(' + box.blockQueueServerTitle.x + ',' + box.blockQueueServerTitle.y + ')')
      reserved.filter.g = reserved.main.g.append('g')
        .attr('transform', 'translate(' + box.blockQueueServerFilter.x + ',' + box.blockQueueServerFilter.y + ')')
      reserved.content.g = reserved.main.g.append('g')
        .attr('transform', 'translate(' + box.blockQueueServerContent.x + ',' + box.blockQueueServerContent.y + ')')

      drawBack()
      drawTitle()

      reserved.content.g.append('rect')
        .attr('x', 0)
        .attr('y', -20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '')
        .on('click', function () {
          blockQueueServer.changeDisplayer('blockQueue')
        })
      reserved.content.g.append('rect')
        .attr('x', 20)
        .attr('y', -20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '')
        .on('click', function () {
          blockQueueServer.changeDisplayer('blockQueue2')
        })
      reserved.content.g.append('rect')
        .attr('x', 40)
        .attr('y', -20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '')
        .on('click', function () {
          blockQueueServer.changeDisplayer('blockList')
        })
      reserved.content.g.append('rect')
        .attr('x', 60)
        .attr('y', -20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '')
        .on('click', function () {
          blockQueueServer.changeDisplayer('blockForm')
        })

      let fbox = box.blockQueueServerFilter
      blockFilters = new BlockFilters({
        main: {
          tag: 'blockQueueFilterTag',
          g: reserved.filter.g,
          box: box.blockQueueServerFilter,
          mode: 'beginner',
          background: {
            fill: colorTheme.dark.background,
            stroke: colorTheme.dark.stroke,
            strokeWidth: 0.1
          },
          colorTheme: colorTheme
        },
        blocks: {
          colorPalette: colorTheme.blocks
        },
        beginner: {
          middle: {
            g: reserved.filter.g.append('g'),
            box: {
              x: 0,
              y: 0,
              w: box.blockQueueServerFilter.w,
              h: box.blockQueueServerFilter.h
            }
          },
          states: {
            g: reserved.filter.g.append('g'),
            box: {
              x: 0,
              y: 0,
              w: box.blockQueueServerFilter.w * 0.5,
              h: box.blockQueueServerFilter.h * 0.5
            },
            token: {
              id: 'statesToken',
              type: 'states',
              filtering: []
            }
          },
          tels: {
            g: reserved.filter.g.append('g'),
            box: {
              x: box.blockQueueServerFilter.x + (box.blockQueueServerFilter.w * 0.5),
              y: box.blockQueueServerFilter.y,
              w: box.blockQueueServerFilter.w * 0.5,
              h: box.blockQueueServerFilter.h * 0.5
            },
            token: {
              id: 'telsToken',
              type: 'tels',
              filtering: []
            }
          },
          targets: {
            g: reserved.filter.g.append('g'),
            box: {
              x: box.blockQueueServerFilter.x,
              y: box.blockQueueServerFilter.y + box.blockQueueServerFilter.h * 0.5,
              w: box.blockQueueServerFilter.w * 0.5,
              h: box.blockQueueServerFilter.h * 0.5
            },
            token: {
              id: 'targetsToken',
              type: 'targets',
              filtering: []
            }
          },
          time: {
            g: reserved.filter.g.append('g'),
            box: {
              x: box.blockQueueServerFilter.x + box.blockQueueServerFilter.w * 0.5,
              y: box.blockQueueServerFilter.y + box.blockQueueServerFilter.h * 0.5,
              w: box.blockQueueServerFilter.w * 0.5,
              h: box.blockQueueServerFilter.h * 0.5
            },
            token: {
              id: 'timeToken',
              type: 'time',
              filtering: []
            }
          }
        },
        expert: {
          tokenFocus: {},
          enabled: {
            g: reserved.filter.g.append('g'),
            box: {x: 0, y: 0, w: fbox.w * 1, h: fbox.h * 0.15},
            scroll: {
              direction: 'vertical'
            }
          },
          disabled: {
            g: reserved.filter.g.append('g'),
            box: {x: 0, y: 0 + fbox.h * 0.85, w: fbox.w * 1, h: fbox.h * 0.15},
            scroll: {
              direction: 'vertical'
            }
          },
          content: {
            g: reserved.filter.g.append('g'),
            box: {x: 0, y: 0 + fbox.h * 0.15, w: fbox.w * 1, h: fbox.h * 0.7},
            button: {
              g: undefined
            },
            panel: {
              g: undefined
            }
          },
        },
        // title: {
        //   g: reserved.filter.g.append('g'),
        //   box: {x: 0, y: 0 + fbox.h * 0.0, w: fbox.w * 0.8, h: fbox.h * 0.1}
        // },
        // result: {
        //   g: reserved.filter.g.append('g'),
        //   box: {x: 0, y: 0 + fbox.h * 0.84, w: fbox.w * 0.8, h: fbox.h * 0.16}
        // },
        filters: [],
        blockQueue: []
      })
      blockFilters.init()

      blockQueueServer = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: reserved.content.g,
          scroll: {},
          box: box.blockQueueServerContent,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'blockQueue',
        blockQueue: {
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: box.blockQueueServerContent.h, w: box.blockQueueServerContent.w, h: 0, marg: box.blockQueueServerContent.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showText: true,
            orientation: 'axisTop',
            attr: {
              text: {
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              },
              path: {
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              }
            }
          },
          blocks: {
            enabled: true,
            run: {
              enabled: true,
              g: undefined,
              box: {x: 0, y: box.blockQueueServerContent.h * 0.66875, w: box.blockQueueServerContent.w, h: box.blockQueueServerContent.h * 0.33125, marg: box.blockQueueServerContent.marg},
              events: {
                click: () => {},
                mouseover: () => {},
                mouseout: () => {},
                drag: {
                  start: () => {},
                  tick: () => {},
                  end: () => {}
                }
              },
              background: {
                fill: colorTheme.brighter.background,
                stroke: 'none',
                strokeWidth: 0
              }
            },
            cancel: {
              enabled: true,
              g: undefined,
              box: {x: 0, y: box.blockQueueServerContent.h * 0.15, w: box.blockQueueServerContent.w, h: box.blockQueueServerContent.h * 0.1525, marg: box.blockQueueServerContent.marg},
              events: {
                click: () => {},
                mouseover: () => {},
                mouseout: () => {},
                drag: {
                  start: () => {},
                  tick: () => {},
                  end: () => {}
                }
              },
              background: {
                fill: colorTheme.brighter.background,
                stroke: colorTheme.brighter.stroke,
                strokeWidth: 0
              }
            },
            modification: {
              enabled: true,
              g: undefined,
              box: {x: 0, y: box.blockQueueServerContent.h * 0.5, w: box.blockQueueServerContent.w, h: box.blockQueueServerContent.h * 0.47, marg: box.blockQueueServerContent.marg},
              events: {
                click: () => {},
                mouseover: () => {},
                mouseout: () => {},
                drag: {
                  start: () => {},
                  tick: () => {},
                  end: () => {}
                }
              },
              background: {
                fill: colorTheme.brighter.background,
                stroke: colorTheme.brighter.stroke,
                strokeWidth: 0
              }
            },
            colorPalette: colorTheme.blocks
          },
          timeBars: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: box.blockQueueServerContent.h * 0.025, w: box.blockQueueServerContent.w, h: box.blockQueueServerContent.h * 0.975, marg: box.blockQueueServerContent.marg}
          }
        },
        blockQueue2: {
          g: undefined,
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: box.blockQueueServerContent.h, w: box.blockQueueServerContent.w, h: 0, marg: box.blockQueueServerContent.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showText: true,
            orientation: 'axisTop',
            attr: {
              text: {
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              },
              path: {
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              }
            }
          },
          timeBars: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: box.blockQueueServerContent.h * 0.025, w: box.blockQueueServerContent.w, h: box.blockQueueServerContent.h * 0.975, marg: box.blockQueueServerContent.marg}
          }
        },
        blockList: {

        },
        blockForm: {
          mosaic: {
            box: {x: 0, y: 0, w: box.blockQueueServerContent.w * 0.2, h: box.blockQueueServerContent.h, marg: box.blockQueueServerContent.marg},
            order: 'nSched'
          },
          forms: {
            g: undefined,
            box: {x: box.blockQueueServerContent.w * 0.22,
              y: box.blockQueueServerContent.h * 0.02,
              w: box.blockQueueServerContent.w * 0.78 - box.blockQueueServerContent.h * 0.02,
              h: box.blockQueueServerContent.h * 0.96,
              marg: box.blockQueueServerContent.marg},
            display: 'list',
            scroll: {}
          }
        },

        filters: {
          blockFilters: [],
          filtering: []
        },
        time: {
          currentTime: {time: 0, date: undefined},
          startTime: {time: 0, date: undefined},
          endTime: {time: 0, date: undefined}
        },
        data: {
          raw: undefined,
          formated: undefined,
          modified: undefined
        },
        debug: {
          enabled: false
        },
        pattern: {},
        events: {
          block: {
            click: (d) => { console.log(d) },
            mouseover: (d) => { console.log(d) },
            mouseout: (d) => { console.log(d) },
            drag: {
              start: () => {},
              tick: () => {},
              end: () => {}
            }
          },
          sched: {
            click: (d) => { console.log(d) },
            mouseover: (d) => { console.log(d) },
            mouseout: (d) => { console.log(d) }
          }
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })
      blockQueueServer.init()

      blockFilters.plugBlockQueue(blockQueueServer, true)

      updateData()
    }

    function updateData () {
      if (reserved.main.mode === 'icon') return
      let telIds = []
      $.each(shared.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      blockQueueServer.updateData({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        },
        data: {
          raw: {
            blocks: shared.data.server.blocks,
            telIds: telIds
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      if (reserved.main.mode === 'icon') return
      blockQueueServer.update({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        }
      })
    }
    this.update = update
  }
  let SvgEvents = function () {
    // let axis = {}
    let reserved = {
      main: {
        g: undefined,
        mode: 'icon'
      }
    }
    let gBlockBox // , gEvents
    let blockBoxData
    let tagEventQueue = 'tagEventQueue'
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
    }
    this.initData = initData

    function drawEvents () {
      let adjustedBox = {
        x: box.eventQueueServer.x + box.eventQueueServer.w * 0.03,
        y: box.eventQueueServer.y + box.eventQueueServer.h * 0.05,
        w: box.eventQueueServer.w * 0.94,
        h: box.eventQueueServer.h * 0.8,
        marg: lenD.w[0] * 0.01
      }

      gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
      gBlockBox.append('text')
        .text('Occured events')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-5,' + (adjustedBox.h * 0.5) + ') rotate(270)')

      eventQueue.init({
        main: {
          tag: 'eventQueueDefaultTag',
          g: gBlockBox,
          box: adjustedBox,
          background: {
            fill: colorTheme.dark.background,
            stroke: colorTheme.dark.stroke,
            strokeWidth: 0.1
          },
          colorTheme: colorTheme
        },
        tag: 'eventQueueDefaultTag',
        g: gBlockBox,
        box: adjustedBox,
        axis: {
          enabled: true,
          group: {
            g: undefined,
            box: {x: 0, y: 0, w: adjustedBox.w, h: 0, marg: 0}
          },
          axis: undefined,
          scale: undefined,
          domain: [0, 1000],
          range: [0, 0],
          showText: true,
          orientation: 'axisTop'
        },
        blocks: {
          enabled: true,
          group: {
            g: undefined,
            box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
          },
          events: {
            click: () => {},
            mouseover: () => {},
            mouseout: () => {}
          }
        },
        filters: {
          enabled: false,
          group: {
            g: undefined,
            box: {x: adjustedBox.w * 1.03, y: adjustedBox.h * 0, w: adjustedBox.w * 0.22, h: adjustedBox.h * 1, marg: 0},
          },
          filters: []
        },
        timeBars: {
          enabled: true,
          group: {
            g: undefined,
            box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
          }
        },
        data: {
          currentTime: {time: 0, date: undefined},
          startTime: {time: 0, date: undefined},
          endTime: {time: 0, date: undefined},
          lastRawData: undefined,
          formatedData: undefined
        },
        debug: {
          enabled: false
        }
      })

      updateData(dataIn)
    }

    function updateData (dataIn) {
      if (reserved.main.mode === 'icon') return
      eventQueue.update({
        currentTime: {date: new Date(dataIn.timeOfNight.date_now), time: Number(dataIn.timeOfNight.now)},
        startTime: {date: new Date(dataIn.timeOfNight.date_start), time: Number(dataIn.timeOfNight.start)},
        endTime: {date: new Date(dataIn.timeOfNight.date_end), time: Number(dataIn.timeOfNight.end)},
        data: dataIn.external_events[0]
      })
    }
    this.updateData = updateData
  }
  let SvgTelescopes = function () {
    let reserved = {}

    function dummy () {
      reserved.plot.main.g.append('rect')
        .attr('x', reserved.plot.main.box.x)
        .attr('y', reserved.plot.main.box.y)
        .attr('width', reserved.plot.main.box.w)
        .attr('height', reserved.plot.main.box.h)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
    }

    function initFilters () {
      function createSystemsHealthFilter (key, box) {
        reserved.filters.g.append('text')
          .text(key)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (box.x + box.w * 0.5) + ',' + (box.y + box.h - box.w * 0.6) + ')')
        reserved.filters.g.append('rect')
          .attr('x', box.x + box.w * 0.325)
          .attr('y', box.y + box.h - box.w * 0.5)
          .attr('width', box.w * 0.35)
          .attr('height', box.w * 0.35)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)


        reserved.filters.g.append('rect')
          .attr('x', box.x + box.w * 0.35)
          .attr('y', box.y - box.w * 0.1)
          .attr('width', box.w * 0.3)
          .attr('height', box.w * 0.1)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        reserved.filters.g.append('line')
          .attr('x1', box.x + box.w * 0.5)
          .attr('y1', box.y)
          .attr('x2', box.x + box.w * 0.5)
          .attr('y2', box.y + box.h - box.w * 1.25)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        reserved.filters.g.append('rect')
          .attr('x', box.x + box.w * 0.35)
          .attr('y', box.y + box.h - box.w * 1.25)
          .attr('width', box.w * 0.3)
          .attr('height', box.w * 0.1)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)

        let height = (box.h - box.w * 1.25)
        reserved.filters.g.append('rect')
          .attr('x', box.x + box.w * 0.5 + box.w * 0.1)
          .attr('y', box.y + height - (height * 0.75) - box.w * 0.125)
          .attr('width', box.w * 0.25)
          .attr('height', box.w * 0.25)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        reserved.filters.g.append('rect')
          .attr('x', box.x + box.w * 0.5 + box.w * 0.1)
          .attr('y', box.y + height - (height * 0.5) - box.w * 0.125)
          .attr('width', box.w * 0.25)
          .attr('height', box.w * 0.25)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
      }
      reserved.filters = {
        g: reserved.gBlockBox.append('g'),
        box: {
          x: box.telescopes.w * 0.4 - box.telescopes.marg * 2.5,
          y: box.telescopes.marg * 3,
          w: box.telescopes.w * 0.19 + box.telescopes.marg * 2,
          h: box.telescopes.h * 0.8 - 6 * box.telescopes.marg,
          marg: box.telescopes.marg
        }
      }
      reserved.filters.g.attr('transform', 'translate(' + reserved.filters.box.x + ',' + reserved.filters.box.y + ')')
      // reserved.filters.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.filters.box.w)
      //   .attr('height', reserved.filters.box.h)
      //   .attr('fill', colorTheme.darker.background)
      //   .attr('stroke', colorTheme.darker.stroke)
      //   .attr('stroke-width', 0.2)

      reserved.filters.g.append('text')
        .text('Tels types:')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (reserved.filters.box.w * 0.5) + ',' + (reserved.filters.box.h * 0.06) + ')')

      reserved.filters.g.append('text')
        .text('LTs:')
        .style('fill', colorTheme.medium.text)
        // .style('stroke', colorTheme.medium.text)
        // .style('stroke-size', 0.1)
        .style('font-weight', '')
        .style('font-size', '7px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (reserved.filters.box.w * 0.09) + ',' + (reserved.filters.box.h * 0.16) + ')')
      reserved.filters.g.append('rect')
        .attr('x', reserved.filters.box.w * (0.03 + 0.18))
        .attr('y', reserved.filters.box.h * 0.1)
        .attr('width', reserved.filters.box.h * 0.07)
        .attr('height', reserved.filters.box.h * 0.07)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)

      reserved.filters.g.append('text')
        .text('MTs:')
        .style('fill', colorTheme.medium.text)
        // .style('stroke', colorTheme.medium.text)
        // .style('stroke-size', 0.1)
        .style('font-weight', '')
        .style('font-size', '7px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (reserved.filters.box.w * 0.36) + ',' + (reserved.filters.box.h * 0.16) + ')')
      reserved.filters.g.append('rect')
        .attr('x', reserved.filters.box.w * (0.36 + 0.15))
        .attr('y', reserved.filters.box.h * 0.1)
        .attr('width', reserved.filters.box.h * 0.07)
        .attr('height', reserved.filters.box.h * 0.07)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)

      reserved.filters.g.append('text')
        .text('STs:')
        .style('fill', colorTheme.medium.text)
        // .style('stroke', colorTheme.medium.text)
        // .style('stroke-size', 0.1)
        .style('font-weight', '')
        .style('font-size', '7px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (reserved.filters.box.w * 0.66) + ',' + (reserved.filters.box.h * 0.16) + ')')
      reserved.filters.g.append('rect')
        .attr('x', reserved.filters.box.w * (0.66 + 0.13))
        .attr('y', reserved.filters.box.h * 0.1)
        .attr('width', reserved.filters.box.h * 0.07)
        .attr('height', reserved.filters.box.h * 0.07)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)

      reserved.filters.g.append('text')
        .text('Systems & health:')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (reserved.filters.box.w * 0.5) + ',' + (reserved.filters.box.h * 0.3) + ')')

      createSystemsHealthFilter('Cam', {x: 0, y: reserved.filters.box.h * 0.4, w: reserved.filters.box.w * 0.25, h: reserved.filters.box.h * 0.6})
      createSystemsHealthFilter('Mir', {x: reserved.filters.box.w * 0.25, y: reserved.filters.box.h * 0.4, w: reserved.filters.box.w * 0.25, h: reserved.filters.box.h * 0.6})
      createSystemsHealthFilter('Mou', {x: reserved.filters.box.w * 0.5, y: reserved.filters.box.h * 0.4, w: reserved.filters.box.w * 0.25, h: reserved.filters.box.h * 0.6})
      createSystemsHealthFilter('Aux', {x: reserved.filters.box.w * 0.75, y: reserved.filters.box.h * 0.4, w: reserved.filters.box.w * 0.25, h: reserved.filters.box.h * 0.6})
    }
    function initView () {
      function createArrZoomerButton () {
        reserved.view.main.g.append('rect')
          .attr('x', reserved.view.main.box.x + reserved.view.main.box.marg * 1.2)
          .attr('y', reserved.view.main.box.y)
          .attr('width', 1.8 * reserved.view.main.box.marg)
          .attr('height', 1.8 * reserved.view.main.box.marg)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
      }
      function createListButton () {
        reserved.view.main.g.append('rect')
          .attr('x', reserved.view.main.box.x + reserved.view.main.box.marg * 1.2)
          .attr('y', reserved.view.main.box.y + 1.8 * reserved.view.main.box.marg)
          .attr('width', 1.8 * reserved.view.main.box.marg)
          .attr('height', 1.8 * reserved.view.main.box.marg)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
      }
      reserved.view = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: 0,
            y: 0,
            w: box.telescopes.w * 0.5,
            h: box.telescopes.h * 1,
            marg: box.telescopes.marg
          }
        },
        telsList: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: box.telescopes.marg * 1 + box.telescopes.w * 0.0,
            y: box.telescopes.marg * 2 + box.telescopes.h * 0.0,
            w: box.telescopes.w * 0.4 - box.telescopes.marg * 4,
            h: box.telescopes.h * 0.8 - box.telescopes.marg * 4,
            marg: box.telescopes.marg
          }
          // box: {
          //   x: box.telescopes.marg * 4,
          //   y: box.telescopes.marg * 2,
          //   w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
          //   h: box.telescopes.h * 0.9 - 4 * box.telescopes.marg,
          //   marg: box.telescopes.marg
          // }
        },
        projection: 'arrZoomer' // 'list'
      }

      reserved.view.main.g.attr('transform', 'translate(' + reserved.view.main.box.x + ',' + reserved.view.main.box.y + ')')
      reserved.view.telsList.g.attr('transform', 'translate(' + reserved.view.telsList.box.x + ',' + reserved.view.telsList.box.y + ')')

      // reserved.view.telsList.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.view.telsList.box.w)
      //   .attr('height', reserved.view.telsList.box.h)
      //   .attr('fill', colorTheme.darker.stroke)
      //   .attr('stroke', colorTheme.darker.stroke)
      //   .attr('stroke-width', 0.2)

      // createArrZoomerButton()
      // createListButton()

      // let telsArray = new TelsArray({
      //   main: {
      //     tag: 'telsArrayTag',
      //     g: reserved.view.main.g,
      //     box: {x: reserved.view.main.box.x + 3 * reserved.view.main.box.marg,
      //       y: reserved.view.main.box.y,
      //       w: reserved.view.main.box.w - 2 * reserved.view.main.box.marg,
      //       h: reserved.view.main.box.h,
      //       marg: 0},
      //     colorTheme: colorTheme
      //   },
      //   dataPanel: {
      //     g: undefined,
      //     box: {x: 0,
      //       y: 0,
      //       w: reserved.view.main.box.w - 2 * reserved.view.main.box.marg,
      //       h: reserved.view.main.box.h,
      //       marg: 0},
      //     zoomable: true,
      //     telsId: true,
      //     event: {
      //       click: () => {},
      //       mouseover: () => {},
      //       mouseout: () => {}
      //     }
      //   },
      //   optionsPanel: {
      //     g: undefined,
      //     box: {x: 0, y: 0, w: 100, h: 100, marg: 0}
      //   },
      //   focusOverlay: {
      //     enabled: true,
      //     g: undefined
      //   },
      //   highlightOverlay: {
      //     enabled: true,
      //     g: undefined
      //   },
      //   time: {
      //     currentTime: shared.data.server.timeOfNight.now
      //   },
      //   data: {
      //     raw: {
      //       blocks: [],
      //       telIds: []
      //     }
      //   },
      //   debug: {
      //     enabled: false
      //   }
      // })
      // telsArray.init()
      updateTelsList()
    }
    function initData (dataIn) {
      reserved.adjustedBox = {
        x: box.telescopes.marg,
        y: box.telescopes.marg,
        w: box.telescopes.w - 2 * box.telescopes.marg,
        h: box.telescopes.h - 2 * box.telescopes.marg,
        marg: box.telescopes.marg
      }
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.telescopes.x + ',' + box.telescopes.y + ')')
      // reserved.gBlockBox.append('rect')
      //   .attr('x', reserved.adjustedBox.x)
      //   .attr('y', reserved.adjustedBox.y)
      //   .attr('width', reserved.adjustedBox.w)
      //   .attr('height', reserved.adjustedBox.h)
      //   .attr('fill', colorTheme.dark.background)
      //   .attr('stroke', colorTheme.dark.stroke)
      //   .attr('stroke-width', 0.2)

      reserved.plot = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: box.telescopes.w * 0.5 + box.telescopes.marg * 4,
            y: box.telescopes.marg * 2,
            w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
            h: box.telescopes.h * 0.8 - 4 * box.telescopes.marg,
            marg: box.telescopes.marg
          }
        }
      }

      // reserved.gBlockBox.append('text')
      //   .text('Unused Telescopes')
      //   .style('fill', colorTheme.dark.text)
      //   .style('font-weight', 'normal')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(4,' + (reserved.view.main.box.h * 0.5) + ') rotate(270)')
      // reserved.view.main.g = reserved.gBlockBox.append('g')
      //   .attr('transform', 'translate(' + reserved.view.main.box.marg + ',0)')
      initView()
      initFilters()
      dummy()
    }
    this.initData = initData

    function updateTelsList () {
      function strokeSize (val) {
        return 0.4 // (2 - (2 * (val / 100)))
      }
      function fillOpacity (val) {
        return 1 // (0.9 - (0.5 * (val / 100)))
      }

      let tels = deepCopy(shared.data.server.telHealth)
      let defaultHeightView = reserved.view.telsList.box.h
      let widthBlocks = reserved.view.telsList.box.w
      // let offsetX = (box.currentBlocks.w - widthBlocks) * 0.5

      let telsPerRow = 8
      let sizeTelsRow = 0.0715
      let offsetTelsType = 0.5

      let ratio = 1

      let off = 0
      if (tels.length > 0 && tels[0].id.split('_')[0] === 'M') off -= 1
      if (tels.length > 0 && tels[0].id.split('_')[0] === 'S') off -= 2

      let telsBox = {
        x: reserved.view.telsList.box.marg,
        y: reserved.view.telsList.box.marg,
        w: widthBlocks,
        h: defaultHeightView
      }
      let offset = {
        x: telsBox.w / telsPerRow,
        ty: (ratio * offsetTelsType * sizeTelsRow * defaultHeightView),
        y: (ratio * sizeTelsRow * defaultHeightView)
      }

      let currentTels = reserved.view.telsList.g
        .selectAll('g.currentTel')
        .data(tels, function (d) {
          return d.id
        })
      let enterCurrentTels = currentTels
        .enter()
        .append('g')
        .attr('class', 'currentTel')
      enterCurrentTels.each(function (d, i) {
        let toff = off
        if (d.id.split('_')[0] === 'M') toff += 1
        if (d.id.split('_')[0] === 'S') toff += 2

        d3.select(this).attr('transform', function (d) {
          let tx = -(parseInt((i + toff) / telsPerRow) % 2) === 0 ?
            (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
            (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
          if (toff % 2 === 1) tx += offset.x
          let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)
          return 'translate(' + tx + ',' + ty + ')'
        })
        d3.select(this).append('rect')
          .attr('x', function (d) {
            return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('y', function (d) {
            return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('width', function (d) {
            return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
          })
          .attr('height', function (d) {
            return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
          })
          .attr('fill', function (d) {
            return telHealthCol(d.val)
          })
          .attr('fill-opacity', function (d) {
            return fillOpacity(d.val)
          })
          .attr('stroke-width', function (d) {
            return strokeSize(d.val)
          })
          .attr('stroke', function (d) {
            return telHealthCol(d.val)
          })
          .attr('stroke-opacity', function (d) {
            return 1
          })
        d3.select(this).append('text')
          .attr('x', 0)
          .attr('y', offset.y * 0.2)
          .attr('dy', 0)
          .text(function (d) {
            return d.id // d.id.split('_')[1]
          })
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', function (d) {
            return 6.2 // - (2 * (d.val / 100))
          })
          .attr('text-anchor', 'middle')
      })

      let mergeCurrentTels = currentTels.merge(enterCurrentTels)
      mergeCurrentTels.each(function (d, i) {
        let toff = off
        if (d.id.split('_')[0] === 'M') toff += 1
        if (d.id.split('_')[0] === 'S') toff += 2

        d3.select(this)
          .attr('transform', function (d) {
            let tx = -(parseInt((i + toff) / telsPerRow) % 2) === 0 ?
              (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
              (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
            // if (toff % 2 === 1) tx += 2 * offset.x
            let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)
            return 'translate(' + tx + ',' + ty + ')'
          })
          .style('opacity', function () {
            if (!d.running) return 1
            return 0.4
          })
        d3.select(this).select('rect')
          .transition()
          .duration(timeD.animArc)
          .attr('x', function (d) {
            return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('y', function (d) {
            return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('width', function (d) {
            return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
          })
          .attr('height', function (d) {
            return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
          })
          .attr('fill', function (d) {
            if (!d.running) return telHealthCol(d.val)
            return colorTheme.dark.background
          })
          // .attr('fill-opacity', function (d) {
          //   return fillOpacity(d.val)
          // })
          .attr('stroke-width', function (d) {
            return strokeSize(d.val)
          })
          .attr('stroke', function (d) {
            // if (!d.running) return telHealthCol(d.val)
            return colorTheme.dark.stroke
          })
          // .attr('stroke-opacity', function (d) {
          //   if (!d.running) return 1
          //   return 1
          // })
        d3.select(this).select('text')
          .attr('x', 0)
          .attr('y', offset.y * 0.2)
          .attr('dy', 0)
          .text(function (d) {
            return d.id // d.id.split('_')[1]
          })
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', function (d) {
            return 6.2 // - (2 * (d.val / 100))
          })
          .attr('text-anchor', 'middle')
      })

      currentTels
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    this.updateTelsList = updateTelsList
    function updateData (dataIn) {
    }
    this.updateData = updateData
  }
  let SvgDAQ = function () {
    function init () {

    }
    this.init = init
  }
  // let SvgBottomInfo = function () {
  //   let gBlockBox
  //   let clockEvents
  //
  //   function initData (dataIn) {
  //     gBlockBox = svg.g.append('g')
  //
  //     clockEvents = new ClockEvents()
  //     clockEvents.init({
  //       g: gBlockBox,
  //       box: box.clock,
  //       colorTheme: colorTheme.medium
  //     })
  //     clockEvents.setHour(new Date(com.dataIn.data.timeOfNight.date_now))
  //     clockEvents.setSendFunction(function (date) {
  //       blockQueueServer.addExtraBar(date)
  //       eventQueue.addExtraBar(date)
  //     })
  //     clockEvents.addEvent(com.dataIn.data.external_clockEvents[0])
  //
  //     // let startEvent = new Date(com.dataIn.data.timeOfNight.now).getTime() + ((Math.random() * 3) + 2) * 60000
  //     // let endEvent = new Date(startEvent).getTime() + 10000
  //     // clockEvents.addEvent({id: 'E' + Math.floor(Math.random() * 1000000), name: 'moonrise', icon: null, startTime: startEvent, endTime: endEvent})
  //   }
  //   this.initData = initData
  //
  //   function updateData (dataIn) {
  //     clockEvents.setHour(new Date(com.dataIn.data.timeOfNight.date_now))
  //     clockEvents.addEvent(com.dataIn.data.external_clockEvents[0])
  //     // let rnd = Math.random()
  //     // if (rnd < 0.8) {
  //     //   let startEvent = new Date(com.dataIn.data.timeOfNight.now).getTime() + ((Math.random() * 3) + 0.4) * 60000
  //     //   let endEvent = new Date(startEvent).getTime() + 10000
  //     //   clockEvents.addEvent({id: Math.floor(Math.random() * 100000), name: 'moonrise', icon: null, startTime: startEvent, endTime: endEvent})
  //     // }
  //   }
  //   this.updateData = updateData
  // }

  let svgBlocksQueueServer = new SvgBlocksQueueServer()
  let svgEvents = new SvgEvents()
  let svgTelescopes = new SvgTelescopes()
  let svgDAQ = new SvgDAQ()
  let svgTextEditor = new SvgTextEditor()
  // let svgTels = new SvgTels()
  // let svgFilterBlocks = new SvgFilterBlocks()
  // let svgFilterTels = new SvgFilterTels()
  // let svgMiddleInfo = new SvgMiddleInfo()
  // let svgBottomInfo = new SvgBottomInfo()
}
