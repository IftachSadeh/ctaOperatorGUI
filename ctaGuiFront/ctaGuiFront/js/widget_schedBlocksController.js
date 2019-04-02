'use strict'
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// stric mode for the following script or function (must reservede at the very begining!)
// see: http://www.w3schools.reserved/js/js_strict.asp
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// mainScriptTag used locally (will be overriden by other scripts...)
// must be reservedpatible with the name of this js file, according to:
//    '/js/widget_'+mainScriptTag+'.js'
var mainScriptTag = 'schedBlocksController'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global hasVar */
/* global disableScrollSVG */
/* global RunLoop */
/* global BlockQueue */
/* global BlockQueue */
/* global BlockQueueModif */
/* global BlockQueueOptimizer*/
/* global BlockDisplayer */
/* global PlotBrushZoom */
/* global ClockEvents */
/* global GridBagLayout */
/* global ScrollBox */
/* global PanelManager */
/* global bckPattern */
/* global telHealthCol */
/* global colsPurplesBlues */
/* global colsYellows */
/* global getColorTheme */
/* global ScrollForm */
/* global colsReds */
/* global colsPurples */
/* global colsBlues */
/* global colsGreens */
/* global colPrime */
/* global Locker */
/* global FormManager */
/* global appendToDom */
/* global runWhenReady */
/* global timeD */
/* global deepCopy */

window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueue.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueue.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueModif.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueOptimizer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_plotBrushZoom.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_panelManager.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_gridBagLayout.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_clockEvents.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollForm.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_formManager.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 6
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = { SockFunc: sockSchedBlocksController, MainFunc: mainSchedBlocksController }
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
let sockSchedBlocksController = function (optIn) {
  let widgetType = optIn.widgetType
  let widgetSource = optIn.widgetSource
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
  //     'widgetSource':widgetSource, 'widgetName':widgetType, 'widgetId':widgetId,
  //     'methodName':'schedBlocksControllerAskTelData',
  //     'methodArgs':data
  //   };
  //   sock.socket.emit('widget', dataEmit);
  //   return;
  // }

  // FUNCTION TO SEND DATA TO THE REDIS DATABASE (need eqivalent function in .py)
  this.pushNewBlockQueue = function (optIn) {
    if (sock.conStat.isOffline()) return

    let data = {}
    data.widgetId = optIn.widgetId
    data.newBlockQueue = optIn.newBlockQueue

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: data.widgetId,
      methodName: 'schedBlockControllerPushNewBlockQueue',
      methodArgs: data
    }
    sock.socket.emit('widget', dataEmit)
  }

  // EXEMPLE OF FUNCTION TO RECEIVE DATA FROM THE REDIS DATABASE
  // ---------------------------------------------------------------------------------------------------
  // get update for state1 data which was explicitly asked for by a given module
  // ---------------------------------------------------------------------------------------------------
  sock.socket.on('newSchedulePushed', function (data) {
    if (sock.conStat.isOffline()) return
    console.log('newSchedulePushed received');

    $.each(sock.widgetV[widgetType].widgets, function (widgetIdNow, modNow) {
      console.log(widgetIdNow, modNow);
      if (data.sessWidgetIds.indexOf(widgetIdNow) >= 0) {
        console.log(sock.widgetV[widgetType]);
        sock.widgetV[widgetType].widgets[widgetIdNow].scheduleSuccessfullyUpdate()
      }
    })
  })
}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainSchedBlocksController = function (optIn) {
  // let myUniqueId = unique()
  let colorTheme = getColorTheme('bright-Grey')
  let isSouth = window.__nsType__ === 'S'

  let widgetType = optIn.widgetType
  let tagArrZoomerPlotsSvg = optIn.baseName

  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  let shared = {
    data: {
      server: undefined,
      copy: undefined
      // current: 0
    },
    focus: undefined, // {type: block, id: idBlock}
    over: undefined,
    mode: 'inspector'
  }
  let svg = {}
  let box = {}
  let lenD = {}

  let blockQueue = null
  let blockQueueModif = null
  let blockQueueOptimized = null
  let brushZoom = null

  // let thisSchedBlocksController = this
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
  // locker.add('inInit')
  let runLoop = new RunLoop({ tag: widgetId })

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
      svg.g = svg.svg.append('g')
    }
    function initBackground () {
      svg.svg
        .style('background', colorTheme.medium.background)
      svg.back = svg.svg.append('g')
      svg.back.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.w[0] * 0.12)
        .attr('height', lenD.h[0] * 0.02)
        .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Menu')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.06) + ',' + (lenD.h[0] * 0.015) + ')')

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.14)
        .attr('y', 0)
        .attr('width', lenD.w[0] * 0.52)
        .attr('height', lenD.h[0] * 0.02)
        .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Scheduling & observation blocks')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.4) + ',' + (lenD.h[0] * 0.015) + ')')

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.14)
        .attr('y', lenD.h[0] * 0.98)
        .attr('width', lenD.w[0] * 0.52)
        .attr('height', lenD.h[0] * 0.02)
        .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Visualization tools')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.4) + ',' + (lenD.h[0] * 0.995) + ')')

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.68)
        .attr('y', 0)
        .attr('width', lenD.w[0] * 0.32)
        .attr('height', lenD.h[0] * 0.02)
        .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Information')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.84) + ',' + (lenD.h[0] * 0.015) + ')')
    }
    function initBox () {
      box.blockQueueServer = {
        x: lenD.w[0] * 0.14,
        y: lenD.h[0] * 0.025,
        w: lenD.w[0] * 0.48,
        h: lenD.h[0] * 0.6,
        marg: lenD.w[0] * 0.01
      }
      box.brushZoom = {
        x: lenD.w[0] * 0.14,
        y: lenD.h[0] * 0.612,
        w: lenD.w[0] * 0.48,
        h: lenD.h[0] * 0.05,
        marg: lenD.w[0] * 0.01
      }
      box.tools = {
        x: lenD.w[0] * 0.14,
        y: lenD.h[0] * 0.707,
        w: lenD.w[0] * 0.48,
        h: lenD.h[0] * 0.268,
        marg: lenD.w[0] * 0.01
      }
      box.focusOverlay = {
        x: lenD.w[0] * 0.14,
        y: lenD.h[0] * 0.025,
        w: lenD.w[0] * 0.48,
        h: lenD.h[0] * 0.955,
        marg: lenD.w[0] * 0.01
      }

      box.pushPull = {
        x: lenD.w[0] * 0.0,
        y: lenD.h[0] * 0.03,
        w: lenD.w[0] * 0.12,
        h: lenD.h[0] * 0.6,
        marg: lenD.w[0] * 0.01
      }
      box.blockQueueOptimized = {
        x: lenD.w[0] * 0.0,
        y: lenD.h[0] * 0.35,
        w: lenD.w[0] * 0.625,
        h: lenD.h[0] * 0.3,
        marg: lenD.w[0] * 0.01
      }
      box.blockQueueModif = {
        x: lenD.w[0] * 0.0,
        y: lenD.h[0] * 0.65,
        w: lenD.w[0] * 0.625,
        h: lenD.h[0] * 0.35,
        marg: lenD.w[0] * 0.01
      }
      box.rightInfo = {
        x: lenD.w[0] * 0.68,
        y: lenD.h[0] * 0.025,
        w: lenD.w[0] * 0.315,
        h: lenD.h[0] * 0.97,
        marg: lenD.w[0] * 0.01
      }
      // box.tab = {
      //   x: 0,
      //   y: box.rightPanel.h * 0.01,
      //   w: box.rightPanel.w,
      //   h: box.rightPanel.h * 0.05
      // }
      // box.content = {
      //   x: 0,
      //   y: box.rightPanel.h * 0.15,
      //   w: box.rightPanel.w,
      //   h: box.rightPanel.h * 0.84
      // }
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

    shared.data.server = dataIn.data

    svgBrush.initData()
    svgWarningArea.initData({
      tag: 'pushPull',
      g: svg.g.append('g'),
      box: box.pushPull,
      attr: {
        text: {
          size: 9
        },
        icon: {
          size: 20
        }
      },
      pull: {
        g: undefined,
        box: {x: 0, y: 0, w: 0.5, h: 1},
        child: {}
      },
      push: {
        g: undefined,
        box: {x: 0.5, y: 0, w: 0.5, h: 1},
        child: {}
      },
      debug: {
        enabled: false
      }
    })
    svgTargets.initData()
    svgTelsConflict.initData()
    svgRightInfo.initData()
    svgBlocksQueueServer.initData()

    svgBlocksQueueServer.updateData()
    svgBrush.updateData()
    svgTargets.updateData()
    svgTelsConflict.updateData()
  }
  this.initData = initData
  function updateDataOnce (dataIn) {
    if (!locker.isFreeV(['pushNewSchedule'])) {
      // console.log('pushing...');
      setTimeout(function () {
        updateDataOnce(dataIn)
      }, 10)
      return
    }
    locker.add('updateData')
    shared.data.server = dataIn.data
    shared.data.server.schedBlocks = createSchedBlocks(shared.data.server.blocks)

    svgBlocksQueueServer.updateData()
    svgBrush.updateData()

    locker.remove('updateData')
  }
  function updateData (dataIn) {
    runLoop.push({ tag: 'updateData', data: dataIn })
  }
  this.updateData = updateData
  runLoop.init({ tag: 'updateData', func: updateDataOnce, nKeep: 1 })

  function getBlocksData () {
    if (shared.mode === 'inspector') {
      return shared.data.server.blocks
    }
    if (shared.mode === 'modifier') {
      return shared.data.copy.blocks
    }
  }
  function getSchedBlocksData () {
    if (shared.mode === 'inspector') {
      return shared.data.server.schedBlocks
    }
    if (shared.mode === 'modifier') {
      return shared.data.copy.schedBlocks
    }
  }
  let focusManager = new function () {
    function unfocusCore (type, id) {
      function schedBlock () {
        svgRightInfo.clean()
        // svgInformation.unfocusSchedBlocks()
        // svgSchedBlocksIcons.unfocusOnSchedBlocks()
        //
        // blockQueue.unfocusOnSchedBlocks()
        // blockQueueModif.unfocusOnSchedBlocks()
        // blockQueueOptimized.unfocusOnSchedBlocks()
        // shared.focus.schedBlocks = undefined
      }
      function block () {
        svgRightInfo.clean()
        // if (!shared.focus.block) return
        // svgInformation.unfocusBlock()
        // svgInformation.focusOnSchedBlocks(shared.focus.schedBlocks)
        // blockQueue.unfocusOnBlock(shared.focus.block)
        // blockQueueModif.unfocusOnBlock(shared.focus.block)
        // blockQueueOptimized.unfocusOnBlock(shared.focus.block)
        // let dataB = getBlockById(shared.focus.block)
        // dataB = dataB.optimized.data ? dataB.optimized.data : dataB.insert.data
        // svgFocusOverlay.unfocusOnBlock({data: dataB})
        // shared.focus.block = undefined
      }
      function target () {

      }
      function telescope () {

      }
      if (type === 'schedBlock') schedBlock()
      if (type === 'block') block()
      if (type === 'target') target()
      if (type === 'telescope') telescope()
    }
    function focusCore (type, id) {
      function schedBlock () {
        // svgInformation.unfocusSchedBlocks()
        // svgSchedBlocksIcons.unfocusOnSchedBlocks()
        //
        // blockQueue.unfocusOnSchedBlocks()
        // blockQueueModif.unfocusOnSchedBlocks()
        // blockQueueOptimized.unfocusOnSchedBlocks()
        // shared.focus.schedBlocks = undefined
        svgRightInfo.focusOnSchedBlock(id)
      }
      function block () {
        svgRightInfo.focusOnBlock(id)
        // console.log(shared.focus.block, block);
        // if (shared.focus.block !== undefined) {
        //   if (shared.focus.block === block.obId) {
        //     mainUnfocusOnBlock()
        //     return
        //   }
        //   mainUnfocusOnBlock()
        // }
        // mainUnfocusOnSchedBlocks()
        // mainFocusOnSchedBlocks(block.sbId)
        // shared.focus.block = block.obId
        // // svgSchedBlocksIcons.focusOnSchedBlocks(block)
        // svgInformation.focusOnBlock(block.obId)
        // blockQueue.focusOnBlock(block.obId)
        // blockQueueModif.focusOnBlock(block.obId)
        // blockQueueOptimized.focusOnBlock(block.obId)
        // svgFocusOverlay.focusOnBlock({data: block})
      }
      function target () {

      }
      function telescope () {

      }

      if (type === 'schedBlock') schedBlock()
      if (type === 'block') block()
      if (type === 'target') target()
      if (type === 'telescope') telescope()
    }

    function unfocus () {
      unfocusCore(shared.focus.type, shared.focus.id)
      shared.focus = undefined
    }
    this.unfocus = unfocus
    function focusOn (type, id) {
      if (shared.focus && shared.focus.type === type && shared.focus.id === id) {
        unfocus()
      } else {
        shared.focus = {type: type, id: id}
        if (shared.over && shared.over.type === type && shared.over.id === id) return
        focusCore(shared.focus.type, shared.focus.id)
      }
    }
    this.focusOn = focusOn

    function over (type, id) {
      if (shared.focus) {
        if (shared.over) {
          if (shared.over.type !== type && shared.over.id !== id) {
            shared.over = {type: type, id: id}
            focusCore(type, id)
          }
        } else {
          shared.over = {type: type, id: id}
          if (shared.focus.type === type && shared.focus.id === id) return
          focusCore(type, id)
        }
      } else {
        shared.over = {type: type, id: id}
        focusCore(type, id)
      }
    }
    this.over = over
    function out (type, id) {
      if (shared.focus) {
        if (shared.focus.type === shared.over.type && shared.focus.id === shared.over.id) {
          shared.over = undefined
          return
        }
        let type = shared.focus.type
        let id = shared.focus.id
        focusCore(type, id)
        shared.over = undefined
      } else {
        unfocusCore(shared.over.type, shared.over.id)
        shared.over = undefined
      }
    }
    this.out = out
  }()

  function scheduleSuccessfullyUpdate () {
    svg.g.selectAll('g.pushingNewSchedule')
      .append('text')
      .text('... Success')
      .style('fill', colorTheme.darker.text)
      .style('font-weight', 'bold')
      .style('font-size', '30px')
      .attr('text-anchor', 'middle')
      .attr('x', lenD.w[0] * 0.7)
      .attr('y', lenD.h[0] * 0.6)
    svg.g.selectAll('g.pushingNewSchedule')
      .transition()
      .delay(1000)
      .duration(400)
      .style('opacity', 0)
      .on('end', function () {
        svg.g.selectAll('g.pushingNewSchedule').remove()
        locker.remove('pushNewSchedule')
      })
  }
  this.scheduleSuccessfullyUpdate = scheduleSuccessfullyUpdate
  function syncStateSend (dataIn) {
    if (sock.conStat.isOffline()) return

    sock.sockSyncStateSend({
      widgetId: widgetId,
      type: dataIn.type,
      data: dataIn
    })
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setCol (optIn) {
    if (optIn.endTime < Number(shared.data.server.timeOfNight.now)) return colorTheme.blocks.shutdown
    let state = hasVar(optIn.state)
      ? optIn.state
      : optIn.exeState.state
    let canRun = hasVar(optIn.canRun)
      ? optIn.canRun
      : optIn.exeState.canRun

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
  function cleanOptimizedBlockQueue () {
    let cleanQueue = deepCopy(shared.data.copy[shared.data.current].optimized)
    for (let key in cleanQueue.blocks) {
      let group = cleanQueue.blocks[key]
      for (let i = 0; i < group.length; i++) {
        delete group[i].modifications
      }
    }
    return cleanQueue
  }
  function updateAllBlocksQueue () {
    if (shared.data.copy.length === 0) return
    // createSchedBlocks()
    svgBlocksQueueServer.updateData()
    svgBlocksQueueInsert.updateData()
    svgBlocksQueueOptimized.updateData()
    svgSchedBlocksIcons.updateData()
    svgTelsConflict.updateData()
  }
  function pushNewBlockQueue () {
    locker.add('pushNewSchedule')
    let pushingG = svg.g.append('g')
      .attr('class', 'pushingNewSchedule')
    pushingG.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', lenD.w[0])
      .attr('height', lenD.h[0])
      .attr('fill', colorTheme.darker.background)
      .style('opacity', 0)
      .transition()
      .duration(400)
      .style('opacity', 0.8)
      .on('end', function () {
        let cleanQueue = cleanOptimizedBlockQueue()
        sock.widgetV[widgetType].SockFunc.pushNewBlockQueue({
          widgetId: widgetId,
          newBlockQueue: cleanQueue
        })

        function loop (circle) {
          circle
            .attr('stroke-dashoffset', (2 * Math.PI * 25) * 0.35)
            .transition()
            .duration(1000)
            .ease(d3.easeCubic)
            .attr('stroke-dashoffset', -(2 * Math.PI * 25) * 0.65)
            .on('end', function () {
              loop(innerCircle)
            })
        }
        pushingG.append('circle')
          .attr('cx', lenD.w[0] * 0.5)
          .attr('cy', lenD.h[0] * 0.33)
          .attr('r', 25)
          .attr('fill', 'transparent')
          .attr('stroke', colorTheme.medium.background)
          .attr('stroke-width', 10)
        let innerCircle = pushingG.append('circle')
          .attr('cx', lenD.w[0] * 0.5)
          .attr('cy', lenD.h[0] * 0.33)
          .attr('r', 25)
          .attr('fill', 'transparent')
          .attr('stroke', colorTheme.medium.stroke)
          .attr('stroke-width', 10)
          .attr('stroke-dasharray', [(2 * Math.PI * 25) * 0.2, (2 * Math.PI * 25) * 0.8])
          .attr('stroke-dashoffset', (2 * Math.PI * 25) * 0.35)
        loop(innerCircle)

        pushingG.append('text')
          .text('Overriding schedule ...')
          .style('fill', colorTheme.darker.text)
          .style('font-weight', 'bold')
          .style('font-size', '30px')
          .attr('text-anchor', 'middle')
          .attr('x', lenD.w[0] * 0.3)
          .attr('y', lenD.h[0] * 0.6)
      })

  }
  this.pushNewBlockQueue = pushNewBlockQueue

  function pullData () {
    let ori = {blocks: deepCopy(shared.data.server).blocks}
    for (var key in ori.blocks) {
      for (var i = 0; i < ori.blocks[key].length; i++) {
        ori.blocks[key][i].modifications = {
          created: false,
          modified: false,
          userModifications: {},
          optimizerModifications: {}
        }
      }
    }
    let opti = deepCopy(ori)
    let modi = deepCopy(ori)

    if (shared.data.copy.length === 0) {
      shared.data.current = 0
      shared.data.copy.push({original: ori, modified: modi, creation: {blocks: {done: [], run: [], wait: []}}, optimized: opti})
    } else {
      shared.data.copy[shared.data.current].original = ori
      shared.data.copy[shared.data.current].modified = modi
      shared.data.copy[shared.data.current].creation = {blocks: {done: [], run: [], wait: []}}
      shared.data.copy[shared.data.current].optimized = opti
    }

    updateAllBlocksQueue()
    svgTargets.updateData()
    svgTelsConflict.updateData()
    svgFocusOverlay.updateData()
  }
  function createSchedBlocks (blocks) {
    let temp = {}
    for (let key in blocks) {
      for (let i = 0; i < blocks[key].length; i++) {
        let b = blocks[key][i]
        if (!temp[b.sbId]) {
          temp[b.sbId] = {
            exeState: {
              state: b.exeState.state,
              canRun: true
            },
            target: {
              id: b.targetId,
              name: b.targetName,
              pos: b.targetPos,
              observability: {}
            },
            blocks: [b]
          }
        } else {
          let sb = temp[b.sbId]
          sb.blocks.push(b)
          if (b.exeState.state === 'run' || sb.exeState.state === 'run') sb.exeState.state = 'run'
          else if (b.exeState.state === 'wait' && sb.exeState.state === 'done') sb.exeState.state = 'run'
          else if (b.exeState.state === 'done' && sb.exeState.state === 'wait') sb.exeState.state = 'run'
        }
      }
    }
    return temp
  }
  function optimizer () {
    shared.data.copy[shared.data.current].optimized = deepCopy(shared.data.copy[shared.data.current].modified)

    function isSameTime (s1, e1, s2, e2) {
      if (s1 > s2 && s1 < e2) return true
      if (e1 > s2 && e1 < e2) return true
      if (s1 < s2 && e1 > e2) return true
      return false
    }
    function shareSameTels (b1, b2) {
      let remTels1 = []
      let remTels2 = []
      for (let i = b1.telIds.length - 1; i > -1; i--) {
        for (let j = b2.telIds.length - 1; j > -1; j--) {
          if (b1.telIds[i] === b2.telIds[j]) {
            if (Math.random() > 0.5) remTels1.push(b1.telIds.splice(i, 1)[0])
            else remTels2.push(b2.telIds.splice(j, 1)[0])
            break
          }
        }
      }
      if (remTels1.length > 0) {
        b1.modifications.optimizerModifications.telescopes = []
        b1.modifications.optimizerModifications.telescopes.push({old: remTels1, new: []})
        b1.modifications.modified = true
      }
      if (remTels2.length > 0) {
        b2.modifications.optimizerModifications.telescopes = []
        b2.modifications.optimizerModifications.telescopes.push({old: remTels2, new: []})
        b2.modifications.modified = true
      }
    }
    for (let i = shared.data.copy[shared.data.current].optimized.blocks.wait.length - 1; i > -1; i--) {
      let tb = shared.data.copy[shared.data.current].optimized.blocks.wait[i]
      for (let j = 0; j < shared.data.copy[shared.data.current].optimized.blocks.run.length; j++) {
        let mb = shared.data.copy[shared.data.current].optimized.blocks.run[j]
        if (isSameTime(mb.startTime, mb.endTime, tb.startTime, tb.endTime)) {
          shareSameTels(mb, tb)
        }
      }
      for (let j = 0; j < shared.data.copy[shared.data.current].optimized.blocks.wait.length; j++) {
        let mb = shared.data.copy[shared.data.current].optimized.blocks.wait[j]
        if (isSameTime(mb.startTime, mb.endTime, tb.startTime, tb.endTime)) {
          shareSameTels(mb, tb)
        }
      }
    }
    svgBlocksQueueOptimized.updateData()
  }
  function groupBlocksBySchedule (blocks) {
    let res = {}
    for (var key in blocks) {
      for (var i = 0; i < blocks[key].length; i++) {
        let ns = blocks[key][i].metaData.nSched
        if (ns in res) res[ns].push(blocks[key][i])
        else res[ns] = [blocks[key][i]]
      }
    }
    let ret = []
    Object.keys(res).map(function (key, index) {
      ret.push({schedName: key, scheduleId: res[key][0].sbId, blocks: res[key]})
    })
    return ret
  }
  function getTargetById (id) {
    for (let i = 0; i < shared.data.server.targets.length; i++) {
      if (shared.data.server.targets[i].id === id) {
        return shared.data.server.targets[i]
      }
    }
  }

  function getBlockById (blockList, blockId) {
    let block = {data: undefined, key: undefined, index: undefined}
    for (let key in blockList) {
      let group = blockList[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].obId === blockId) {
          block = {data: group[i], key: key, index: i}
          return block
        }
      }
    }
    // for (let key in shared.data.copy[shared.data.current].original.blocks) {
    //   let group = shared.data.copy[shared.data.current].original.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       block.original = {data: group[i], key: key, index: i}
    //     }
    //   }
    // }
    // for (let key in shared.data.copy[shared.data.current].modified.blocks) {
    //   let group = shared.data.copy[shared.data.current].modified.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       block.modified = {data: group[i], key: key, index: i}
    //     }
    //   }
    // }
    // for (let key in shared.data.copy[shared.data.current].optimized.blocks) {
    //   let group = shared.data.copy[shared.data.current].optimized.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       block.optimized = {data: group[i], key: key, index: i}
    //     }
    //   }
    // }
    // for (let key in shared.data.copy[shared.data.current].creation.blocks) {
    //   let group = shared.data.copy[shared.data.current].creation.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       block.insert = {data: group[i], key: key, index: i}
    //     }
    //   }
    // }
    return block
  }
  // ---------------------------------------------------------------------------------------------------
  // modify blocks
  // ---------------------------------------------------------------------------------------------------
  function applyModification (block, modif) {
    let old
    switch (modif.prop) {
      case 'startTime':
        old = block.modified.data.startTime
        block.modified.data.startTime = modif.new
        block.modified.data.endTime = modif.new + block.modified.data.duration

        if (block.original.data.startTime === modif.new) {
          delete block.modified.data.modifications.userModifications[modif.prop]
          return false
        }
        if (!block.modified.data.modifications.userModifications[modif.prop]) block.modified.data.modifications.userModifications[modif.prop] = []
        block.modified.data.modifications.userModifications[modif.prop].push({new: modif.new, old: old})
        break
      case ('state'):
        old = block.modified.data.exeState.state
        block.modified.data.exeState.state = modif.new
        if (block.original.data.exeState.state === modif.new) {
          delete block.modified.data.modifications.userModifications[modif.prop]
          return false
        }

        if (!block.modified.data.modifications.userModifications['state']) block.modified.data.modifications.userModifications['state'] = []
        block.modified.data.modifications.userModifications['state'].push({new: modif.new, old: old})
        break
      case ('canRun'):
        old = block.modified.data.exeState
        block.modified.data.exeState = {state: 'cancel', canRun: modif.new}

        if (block.original.data.exeState.canRun === modif.new) {
          delete block.modified.data.modifications.userModifications[modif.prop]
          return false
        }
        if (old.state !== 'cancel') {
          if (!block.modified.data.modifications.userModifications['state']) block.modified.data.modifications.userModifications['state'] = []
          block.modified.data.modifications.userModifications['state'].push({new: 'cancel', old: old.state})
        }
        if (!block.modified.data.modifications.userModifications[modif.prop]) block.modified.data.modifications.userModifications[modif.prop] = []
        block.modified.data.modifications.userModifications['canRun'].push({new: modif.new, old: old.canRun})
        break
      default:
    }
    return true
  }
  function changeSchedBlocksProperties (from, schedId, modifs) {
    for (let key in shared.data.copy[shared.data.current].modified.blocks) {
      let group = shared.data.copy[shared.data.current].modified.blocks[key]
      for (let i = group.length - 1; i > -1; i--) {
        if (group[i].sbId === schedId) {
          changeBlockProperties(from, group[i].obId, modifs)
        }
      }
    }
  }
  function changeBlockProperties (from, blockId, modifs) {
    let block = getBlockById(blockId)
    // for (let key in shared.data.copy[shared.data.current].original.blocks) {
    //   let group = shared.data.copy[shared.data.current].original.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       group[i].modifications.modified = true
    //     }
    //   }
    // }
    // shared.data.copy[shared.data.current].original.blocks[block.original.key][block.original.index]
    block.original.data.modifications.modified = true
    block.optimized.data.modifications.modified = true
    for (let modif in modifs) {
      applyModification(block, modifs[modif])
      if (modifs[modif].prop === 'state') {
        shared.data.copy[shared.data.current].modified.blocks[block.modified.key].splice(block.modified.index, 1)
        if (modifs[modif].new === 'cancel') {
          shared.data.copy[shared.data.current].modified.blocks['done'].push(block.modified.data)
        } else if (modifs[modif].new === 'wait') {
          shared.data.copy[shared.data.current].modified.blocks['wait'].push(block.modified.data)
        } else if (modifs[modif].new === 'run') {
          shared.data.copy[shared.data.current].modified.blocks['run'].push(block.modified.data)
        }
      }
    }
    if (Object.keys(block.optimized.data.modifications.userModifications).length === 0) {
      block.original.data.modifications.modified = false
      block.optimized.data.modifications.modified = false
    }

    optimizer()
    updateAllBlocksQueue()
    svgMiddleInfo.update()
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  // let SvgBlocksQueue = function () {
  //   // ---------------------------------------------------------------------------------------------------
  //   //
  //   // ---------------------------------------------------------------------------------------------------
  //   function initData () {
  //     let x0, y0, w0, h0, marg
  //     w0 = lenD.w[0] * 0.45 // 0.6
  //     h0 = lenD.h[0] * 0.14 // 0.18
  //     x0 = (lenD.w[0] * 0.02)
  //     y0 = (lenD.h[0] * 0.04)
  //     marg = w0 * 0.01
  //     let blockBoxData = {
  //       x: x0,
  //       y: y0,
  //       w: w0,
  //       h: h0,
  //       marg: marg
  //     }
  //     let gBlockBox = svg.g.append('g')
  //       .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
  //     gBlockBox.append('text')
  //       .text('CURRENT SCHEDULE')
  //       .style('fill', colorTheme.medium.text)
  //       .style('font-weight', 'bold')
  //       .style('font-size', '8px')
  //       .attr('text-anchor', 'left')
  //       .attr('transform', 'translate(-5,' + (y0 + h0 * 0.8) + ') rotate(270)')
  //     // gBlockBox.append('rect')
  //     //   .attr('x', 0)
  //     //   .attr('y', -10)
  //     //   // .attr('rx', 2)
  //     //   // .attr('ry', 2)
  //     //   .attr('width', blockBoxData.w + 0)
  //     //   .attr('height', blockBoxData.h + 12) // + 35)
  //     //   .attr('stroke', colorTheme.brighter.stroke)
  //     //   .attr('stroke-width', 0.4)
  //     //   // .attr('stroke-width', 12)
  //     //   // .attr('stroke-dasharray', [blockBoxData.w + 10 + blockBoxData.h + 10 + 35 + 6, blockBoxData.w + 10 - 12, blockBoxData.h + 10 + 35 + 16])
  //     //   .style('fill', colorTheme.brighter.background)
  //     blockQueue = new BlockQueue({
  //       main: {
  //         tag: 'blockQueueTopTag',
  //         g: gBlockBox,
  //         box: blockBoxData,
  //         background: {
  //           fill: colorTheme.dark.background,
  //           stroke: colorTheme.dark.stroke,
  //           strokeWidth: 0.1
  //         },
  //         colorTheme: colorTheme
  //       },
  //       axis: {
  //         enabled: true,
  //         g: undefined,
  //         box: {x: 0, y: blockBoxData.h, w: blockBoxData.w, h: 0, marg: blockBoxData.marg},
  //         axis: undefined,
  //         scale: undefined,
  //         domain: [0, 1000],
  //         range: [0, 0],
  //         showText: true,
  //         orientation: 'axisTop',
  //         attr: {
  //           text: {
  //             stroke: colorTheme.medium.stroke,
  //             fill: colorTheme.medium.stroke
  //           },
  //           path: {
  //             stroke: colorTheme.medium.stroke,
  //             fill: colorTheme.medium.stroke
  //           }
  //         }
  //       },
  //       blocks: {
  //         enabled: true,
  //         run: {
  //           enabled: true,
  //           g: undefined,
  //           box: {x: 0, y: blockBoxData.h * 0.45, w: blockBoxData.w, h: blockBoxData.h * 0.55, marg: blockBoxData.marg},
  //           events: {
  //             click: () => {},
  //             mouseover: () => {},
  //             mouseout: () => {},
  //             drag: {
  //               start: () => {},
  //               tick: () => {},
  //               end: () => {}
  //             }
  //           },
  //           background: {
  //             fill: colorTheme.brighter.background,
  //             stroke: 'none',
  //             strokeWidth: 0
  //           }
  //         },
  //         cancel: {
  //           enabled: true,
  //           g: undefined,
  //           box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h * 0.3, marg: blockBoxData.marg},
  //           events: {
  //             click: () => {},
  //             mouseover: () => {},
  //             mouseout: () => {},
  //             drag: {
  //               start: () => {},
  //               tick: () => {},
  //               end: () => {}
  //             }
  //           },
  //           background: {
  //             fill: colorTheme.brighter.background,
  //             stroke: colorTheme.brighter.stroke,
  //             strokeWidth: 0
  //           }
  //         },
  //         modification: {
  //           enabled: false,
  //           g: undefined,
  //           box: undefined,
  //           events: {
  //             click: undefined,
  //             mouseover: undefined,
  //             mouseout: undefined,
  //             drag: {
  //               start: () => {},
  //               tick: () => {},
  //               end: () => {}
  //             }
  //           },
  //           background: {
  //             fill: undefined,
  //             stroke: undefined,
  //             strokeWidth: undefined
  //           }
  //         },
  //         colorPalette: colorTheme.blocks
  //       },
  //       filters: {
  //         enabled: false,
  //         g: undefined,
  //         box: {x: 0, y: blockBoxData.h * 0.15, w: lenD.w[0] * 0.12, h: blockBoxData.h * 0.7, marg: 0},
  //         filters: []
  //       },
  //       timeBars: {
  //         enabled: true,
  //         g: undefined,
  //         box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h, marg: blockBoxData.marg}
  //       },
  //       time: {
  //         currentTime: {time: 0, date: undefined},
  //         startTime: {time: 0, date: undefined},
  //         endTime: {time: 0, date: undefined},
  //       },
  //       data: {
  //         raw: undefined,
  //         formated: undefined,
  //         modified: undefined
  //       },
  //       debug: {
  //         enabled: false
  //       },
  //       pattern: {},
  //       event: {
  //       },
  //       input: {
  //         focus: {schedBlocks: undefined, block: undefined},
  //         over: {schedBlocks: undefined, block: undefined},
  //         selection: []
  //       }
  //     })
  //
  //     blockQueue.init()
  //     updateData()
  //   }
  //   this.initData = initData
  //
  //   function updateData () {
  //     let telIds = []
  //     $.each(shared.data.server.telHealth, function (index, dataNow) {
  //       telIds.push(dataNow.id)
  //     })
  //     blockQueue.updateData({
  //       time: {
  //         currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
  //         startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
  //         endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
  //       },
  //       data: {
  //         raw: {
  //           blocks: shared.data.server.blocks,
  //           telIds: telIds
  //         }
  //       }
  //     })
  //   }
  //   this.updateData = updateData
  // }
  let SvgBlocksQueueServer = function () {
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServer.x,
        y: box.blockQueueServer.y,
        w: box.blockQueueServer.w,
        h: box.blockQueueServer.h,
        marg: lenD.w[0] * 0.01
      }
      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

      blockQueue = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'blockQueue2', // 'blockQueue2',
        blockQueue: {
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.6, w: adjustedBox.w, h: adjustedBox.h * 0.6, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.0, w: adjustedBox.w, h: adjustedBox.h * 0.33, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.5, w: adjustedBox.w, h: adjustedBox.h * 0.47, marg: adjustedBox.marg},
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
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockQueue2: {
          g: undefined,
          schedBlocks: {
            label: {
              enabled: true,
              position: 'right',
              clickable: true
            }
          },
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showAxis: false,
            orientation: 'axisTop',
            attr: {
              text: {
                size: 10,
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
            box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h * 2, marg: adjustedBox.marg}
          }
        },
        blockTrackShrink: {
          g: undefined,
          schedBlocks: {
            label: {
              enabled: true,
              position: 'left'
            }
          },
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showText: true,
            orientation: 'bottom',
            attr: {
              text: {
                size: 14,
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
            enabled: false,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockList: {

        },
        blockForm: {
          mosaic: {
            box: {x: 0, y: 0, w: adjustedBox.w * 0.2, h: adjustedBox.h, marg: adjustedBox.marg},
            order: 'nSched'
          },
          forms: {
            g: undefined,
            box: {x: adjustedBox.w * 0.22,
              y: adjustedBox.h * 0.02,
              w: adjustedBox.w * 0.78 - adjustedBox.h * 0.02,
              h: adjustedBox.h * 0.96,
              marg: adjustedBox.marg},
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
            click: focusManager.focusOn,
            mouseover: focusManager.over,
            mouseout: focusManager.out,
            drag: {
              start: svgFocusOverlay.dragStart,
              tick: svgFocusOverlay.dragTick,
              end: function (d) {
                let res = svgFocusOverlay.dragEnd(d)
                if (res) changeBlockProperties('', res.id, res.modif)
              }
            }
          },
          sched: {
            click: focusManager.focusOn,
            mouseover: focusManager.over,
            mouseout: focusManager.out
          }
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })
      blockQueue.init()
    }
    this.initData = initData

    function updateData () {
      let telIds = []
      $.each(shared.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })

      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}

      blockQueue.updateData({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: startTime,
          endTime: endTime
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
      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}

      blockQueue.update({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: startTime,
          endTime: endTime
        }
      })
    }
    this.update = update
  }
  let SvgBrush = function () {
    let reserved = {}
    function initData () {
      let brushBox = {
        x: box.brushZoom.x,
        y: box.brushZoom.y,
        w: box.brushZoom.w,
        h: box.brushZoom.h,
        marg: lenD.w[0] * 0.01
      }
      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + brushBox.x + ',' + brushBox.y + ')')

      brushZoom = new PlotBrushZoom({
        main: {
          g: svg.g.append('g').append('g'),
          box: brushBox
        },
        clipping: {
          enabled: true
        },
        axis: [
          {
            id: 'top',
            enabled: true,
            main: {
              g: undefined,
              box: {x: 0, y: brushBox.h * 0.0, w: brushBox.w, h: brushBox.h * 0.2, marg: 0},
              type: 'top',
              attr: {
                text: {
                  enabled: false,
                  size: 14,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                }
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, brushBox.w],
            brush: {
              zoom: true,
              brush: true
            }
          },
          {
            id: 'middle',
            enabled: true,
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: brushBox.h * 0.9, w: brushBox.w, h: brushBox.h * 0.0, marg: 0},
              type: 'top',
              attr: {
                text: {
                  enabled: true,
                  size: 10,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                },
                path: {
                  enabled: false,
                  stroke: colorTheme.medium.background,
                  fill: colorTheme.medium.background
                }
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, brushBox.w],
            brush: {
              zoom: false,
              brush: false
            }
          },
          {
            id: 'bottom',
            enabled: true,
            main: {
              g: undefined,
              box: {x: 0, y: brushBox.h * 0.8, w: brushBox.w, h: brushBox.h * 0.2, marg: 0},
              type: 'bottom',
              attr: {
                text: {
                  enabled: false,
                  size: 14,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                }
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, brushBox.w],
            brush: {
              zoom: true,
              brush: true
            }
          }
        ],
        content: {
          enabled: true,
          main: {
            g: undefined,
            box: {x: 0, y: brushBox.h * 0.2, w: brushBox.w, h: brushBox.h * 0.6, marg: 0},
            attr: {
              fill: colorTheme.medium.background
            }
          }
        },
        focus: {
          enabled: true,
          main: {
            g: undefined,
            box: {x: 0, y: brushBox.h * 0.2, w: brushBox.w, h: brushBox.h * 0.6, marg: 0},
            attr: {
              fill: colorTheme.darker.background,
              opacity: 1,
              stroke: colorTheme.darker.background
            }
          }
        },
        brush: {
          coef: {x: 0, y: 0},
          callback: () => {}
        },
        zoom: {
          coef: {kx: 1, ky: 1, x: 0, y: 0},
          callback: function () {
            svgBlocksQueueServer.updateData()
          }
        }
      })
      brushZoom.init()
    }
    this.initData = initData

    function updateData () {
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}

      brushZoom.updateAxis({
        id: 'top',
        domain: [startTime.date, endTime.date]
      })
      brushZoom.updateAxis({
        id: 'middle',
        domain: [startTime.date, endTime.date]
      })
      brushZoom.updateAxis({
        id: 'bottom',
        domain: [startTime.date, endTime.date]
      })
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgWarningArea = function () {
    let reserved = {}
    function createWarning (pullOrPush) {
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      // let dataPointsPull = [
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.1},
      //   {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.1},
      //   {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.2},
      //   {x: reserved[pullOrPush].box.w * 0.7, y: reserved[pullOrPush].box.h * 0.8},
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.8},
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.1}
      // ]
      // let dataPointsPush = [
      //   {x: reserved[pullOrPush].box.w * 0.28, y: reserved[pullOrPush].box.h * 0.1},
      //   {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.1},
      //   {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.8},
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.8},
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.6},
      //   {x: reserved[pullOrPush].box.w * 0.28, y: reserved[pullOrPush].box.h * 0.1}
      // ]
      let dataPoints = [
        {x: reserved[pullOrPush].box.w * 0.05, y: reserved[pullOrPush].box.h * 0.25},
        {x: reserved[pullOrPush].box.w * 0.95, y: reserved[pullOrPush].box.h * 0.25},
        {x: reserved[pullOrPush].box.w * 0.95, y: reserved[pullOrPush].box.h * 0.9},
        {x: reserved[pullOrPush].box.w * 0.05, y: reserved[pullOrPush].box.h * 0.9},
        {x: reserved[pullOrPush].box.w * 0.05, y: reserved[pullOrPush].box.h * 0.25}
      ]

      function loop (bool, pullOrPush) {
        reserved[pullOrPush].child.warningExclamation
          .transition()
          .delay(4000)
          .duration(100)
          .ease(d3.easeLinear)
          .attr('font-size', function () {
            return reserved.attr.text.size * 6
          })
          // .attr('dy', function () {
          //   return reserved[pullOrPush].box.h * 0.02
          // })
          .transition()
          .duration(100)
          .ease(d3.easeLinear)
          .attr('font-size', function () {
            return reserved.attr.text.size * 4
          })
          // .attr('dy', function () {
          //   return reserved[pullOrPush].box.h * 0.3
          // })
          .on('end', function () {
            return loop(!bool, pullOrPush)
          })
        // reserved[pullOrPush].child.warningExclamationBack
        //   .transition()
        //   .delay(4000)
        //   .duration(100)
        //   .ease(d3.easeLinear)
        //   .attr('fill', function () {
        //     return '#FFEB3B'
        //   })
        //   .transition()
        //   .duration(100)
        //   .ease(d3.easeLinear)
        //   .attr('fill', function () {
        //     return '#FFEB3B'
        //   })
      }
      reserved[pullOrPush].child.warningTriangle = reserved[pullOrPush].g.append('path')
        .data(function () {
          if (pullOrPush === 'pull') return [dataPoints]
          else return [dataPoints]
        })
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.brighter.background)
        .attr('stroke', colorTheme.brighter.stroke)
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 0.4)
        .attr('fill-opacity', 1)
        .on('click', function () {
          if (reserved[pullOrPush].g.attr('opacity') === '0.01') reserved[pullOrPush].g.attr('opacity', 1)
          else reserved[pullOrPush].g.attr('opacity', 0.01)
        })

      // reserved[pullOrPush].child.warningExclamationBack = reserved[pullOrPush].g.append('rect')
      //   .attr('width', reserved[pullOrPush].box.w * 0.2)
      //   .attr('height', reserved[pullOrPush].box.h * 0.6)
      //   .attr('x', function () {
      //     if (pullOrPush === 'pull') return reserved[pullOrPush].box.w * 0.74
      //     else return reserved[pullOrPush].box.w * 0.17
      //   })
      //   .attr('y', reserved[pullOrPush].box.h * 0.28)
      //   .attr('rx', 3)
      //   .attr('ry', 3)
      //   .attr('fill', colorTheme.warning.background)
      //   .attr('fill-opacity', 0.6)
      //   .attr('stroke-width', 0.0)
      //   .attr('stroke', colorTheme.warning.stroke)
      reserved[pullOrPush].child.warningExclamation = reserved[pullOrPush].g.append('text')
        .text(function (d) {
          return '! '
        })
        .attr('x', function () {
          if (pullOrPush === 'pull') return reserved[pullOrPush].box.w * 0.85
          else return reserved[pullOrPush].box.w * 0.85
        })
        .attr('y', reserved[pullOrPush].box.h * 0.75)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .attr('font-size', reserved.attr.text.size * 4)
        // .attr('dy', reserved[pullOrPush].box.h * 0.3)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.warning.text)
      loop(true, pullOrPush)

      function pullWarning () {
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Online Schedule'
          })
          .attr('x', reserved[pullOrPush].box.w * 0.4)
          .attr('y', reserved[pullOrPush].box.h * 0.35)
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine2 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'has changed'
          })
          .attr('x', reserved[pullOrPush].box.w * 0.4)
          .attr('y', reserved[pullOrPush].box.h * 0.45)
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        // reserved[pullOrPush].child.warningLine3 = reserved[pullOrPush].g.append('text')
        //   .text(function (d) {
        //     return 'new schedule.'
        //   })
        //   .attr('x', function () {
        //     return reserved[pullOrPush].box.w * 0.22
        //   })
        //   .attr('y', reserved[pullOrPush].box.h * 0.88)
        //   .attr('text-anchor', 'start')
        //   .attr('font-size', reserved.attr.text.size)
        //   .attr('dy', reserved[pullOrPush].box.h * 0.02)
        //   .style('pointer-events', 'none')
        //   .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Please Update'
          })
          .attr('x', reserved[pullOrPush].box.w * 0.4)
          .attr('y', reserved[pullOrPush].box.h * 0.65)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'or Reset'
          })
          .attr('x', reserved[pullOrPush].box.w * 0.4)
          .attr('y', reserved[pullOrPush].box.h * 0.75)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
      }
      function pushWarning () {
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Some modifications'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.45
          })
          .attr('y', reserved[pullOrPush].box.h * 0.4)
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine2 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'will be invalidate'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.4
          })
          .attr('y', reserved[pullOrPush].box.h * 0.55)
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        // reserved[pullOrPush].child.warningLine3 = reserved[pullOrPush].g.append('text')
        //   .text(function (d) {
        //     return 'changes will be lost.'
        //   })
        //   .attr('x', function () {
        //     return reserved[pullOrPush].box.w * 0.26
        //   })
        //   .attr('y', reserved[pullOrPush].box.h * 0.88)
        //   .attr('text-anchor', 'start')
        //   .attr('font-size', reserved.attr.text.size)
        //   .attr('dy', reserved[pullOrPush].box.h * 0.02)
        //   .style('pointer-events', 'none')
        //   .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
        // reserved[pullOrPush].child.warningLine41 = reserved[pullOrPush].g.append('text')
        //   .text(function (d) {
        //     return '10:00'
        //   })
        //   .attr('x', function () {
        //     return reserved[pullOrPush].box.w * 0.65
        //   })
        //   .attr('y', reserved[pullOrPush].box.h * 0.35)
        //   .style('font-weight', 'bold')
        //   .attr('text-anchor', 'middle')
        //   .attr('font-size', reserved.attr.text.size)
        //   .attr('dy', reserved[pullOrPush].box.h * 0.02)
        //   .style('pointer-events', 'none')
        //   .style('fill', colorTheme.brighter.text)
        function countDown () {
          var countDownDate = new Date()
          countDownDate = countDownDate.setMinutes(countDownDate.getMinutes() + 10)
          var cd = setInterval(function () {
            var now = new Date()
            var distance = countDownDate - now
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            var seconds = Math.floor((distance % (1000 * 60)) / 1000)

            reserved[pullOrPush].child.warningLine41
              .text(function (d) {
                return (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds)
              })

            // If the count down is finished, write some text
            if (distance < 0) {
              clearInterval(cd)
            }
          }, 1000)
        }
        // countDown()
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Please Validate'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.4
          })
          .attr('y', reserved[pullOrPush].box.h * 0.8)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
      }

      if (pullOrPush === 'pull') pullWarning()
      else pushWarning()
    }
    function createPullButton () {
      createWarning('pull')
      reserved.pull.child.buttonBack = reserved.pull.g.append('rect')
        .attr('id', 'pull')
        .attr('width', reserved.pull.box.w * 0.4)
        .attr('height', reserved.attr.icon.size)
        .attr('x', reserved.pull.box.w * 0.1 - reserved.attr.icon.size * 0.5)
        .attr('y', -reserved.attr.icon.size * 0.5)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      // reserved.pull.child.buttonIcon = reserved.g.append('svg:image')
      //   .attr('class', 'icon')
      //   .attr('xlink:href', '/static/arrow-up.svg')
      //   .attr('width', reserved.attr.icon.size)
      //   .attr('height', reserved.attr.icon.size)
      //   .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.88 - reserved.pull.box.h * 0.24)
      //   .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.78 - reserved.pull.box.h * 0.24)
      //   .on('click', function () {
      //     pullData()
      //   })
      reserved.pull.child.infoText = reserved.pull.g.append('text')
        .attr('id', 'reset')
        .text(function (d) {
          return 'Reset'
        })
        .attr('x', reserved.pull.box.w * 0.2)
        .attr('y', reserved.attr.icon.size * 0.1)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', reserved.attr.text.size)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.bright.text)

      reserved.pull.g.attr('opacity', 0)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('opacity', 1)
    }
    function createMergeButton () {
      reserved.pull.child.merge = {}
      reserved.pull.child.merge.buttonBack = reserved.pull.g.append('rect')
        .attr('id', 'merge')
        .attr('width', reserved.pull.box.w * 0.4)
        .attr('height', reserved.attr.icon.size)
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.55)
        .attr('y', -reserved.attr.icon.size * 0.5)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      // reserved.pull.child.buttonIcon = reserved.g.append('svg:image')
      //   .attr('class', 'icon')
      //   .attr('xlink:href', '/static/arrow-up.svg')
      //   .attr('width', reserved.attr.icon.size)
      //   .attr('height', reserved.attr.icon.size)
      //   .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.88 - reserved.pull.box.h * 0.24)
      //   .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.22 - reserved.pull.box.h * 0.24)
      //   .on('click', function () {
      //     pullData()
      //   })
      reserved.pull.child.merge.infoText = reserved.pull.g.append('text')
        .attr('id', 'merge')
        .text(function (d) {
          return 'Update'
        })
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.75)
        .attr('y', reserved.attr.icon.size * 0.1)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', reserved.attr.text.size)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.bright.text)

      reserved.pull.g.attr('opacity', 0)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('opacity', 1)
    }
    function createPushButton () {
      createWarning('push')
      reserved.push.child.merge = {}
      reserved.push.child.merge.buttonBack = reserved.push.g.append('rect')
        .attr('id', 'merge')
        .attr('width', reserved.push.box.w * 0.4)
        .attr('height', reserved.attr.icon.size)
        .attr('x', reserved.push.box.w * 0.3)
        .attr('y', -reserved.attr.icon.size * 0.5)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      // reserved.push.child.buttonIcon = reserved.g.append('svg:image')
      //   .attr('class', 'icon')
      //   .attr('xlink:href', '/static/arrow-up.svg')
      //   .attr('width', reserved.attr.icon.size)
      //   .attr('height', reserved.attr.icon.size)
      //   .attr('x', reserved.push.box.x + reserved.pull.box.w * 0.12 - reserved.pull.box.h * 0.24)
      //   .attr('y', reserved.push.box.y + reserved.pull.box.h * 0.5 - reserved.pull.box.h * 0.24)
      //   .on('click', function () {
      //     pushNewBlockQueue()
      //   })

      reserved.push.child.merge.infoText = reserved.push.g.append('text')
        .attr('id', 'merge')
        .text(function (d) {
          return 'Validate'
        })
        .attr('x', reserved.push.box.w * 0.5)
        .attr('y', reserved.attr.icon.size * 0.1)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', reserved.attr.text.size)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.bright.text)

      reserved.push.g.attr('opacity', 0)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('opacity', 1)
    }

    function initPull () {
      reserved.pull.box = {
        x: reserved.box.w * 0.05,
        y: reserved.box.h * 0.25,
        w: reserved.box.w * 0.9,
        h: reserved.box.h * 0.28
      }
      reserved.pull.g = reserved.g.append('g')
        .attr('transform', 'translate(' + reserved.pull.box.x + ',' + reserved.pull.box.y + ')')
    }
    function initPush () {
      reserved.push.box = {
        x: reserved.box.w * 0.05,
        y: reserved.box.h * 0.6,
        w: reserved.box.w * 0.9,
        h: reserved.box.h * 0.2
      }
      reserved.push.g = reserved.g.append('g')
        .attr('transform', 'translate(' + reserved.push.box.x + ',' + reserved.push.box.y + ')')
    }
    function showPushPull () {
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .curve(d3.curveLinear)
      reserved.initGroup.g.append('path')
        .attr('id', 'arrow')
        .attr('d', function (d) {
          let targetPoints = [
            {x: reserved.box.w * 0.5 - 2, y: reserved.box.h * 0.2},
            {x: reserved.box.w * 0.5 - 2, y: reserved.box.h * 0.54},
            {x: reserved.box.w * 0.5 - 6, y: reserved.box.h * 0.54},
            {x: reserved.box.w * 0.5, y: reserved.box.h * 0.56},
            {x: reserved.box.w * 0.5 + 6, y: reserved.box.h * 0.54},
            {x: reserved.box.w * 0.5 + 2, y: reserved.box.h * 0.54},
            {x: reserved.box.w * 0.5 + 2, y: reserved.box.h * 0.2}
          ]
          return lineGenerator(targetPoints)
        })
        .attr('fill', colorTheme.darker.stroke)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.1)
      initPull()
      createMergeButton()
      createPullButton()
      initPush()
      createPushButton()
    }
    function hidePushPull () {
      reserved.initGroup.g.select('path#arrow').remove()
      reserved.pull.g.selectAll('*').remove()
      reserved.push.g.selectAll('*').remove()
    }
    // function hideInspector () {
    //   reserved.initGroup.g.selectAll('*').remove()
    //   reserved.initGroup = {}
    // }
    function showInspector () {
      reserved.initGroup = {}
      reserved.initGroup.g = reserved.g.append('g')
      reserved.initGroup.infoText = reserved.initGroup.g.append('text')
        .text(function (d) {
          return 'Modification status:'
        })
        .attr('x', reserved.box.w * 0.5)
        .attr('y', reserved.box.h * 0.06)
        .attr('text-anchor', 'middle')
        .style('font-weight', '')
        .style('font-size', reserved.attr.text.size)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.bright.text)
      reserved.initGroup.g.append('rect')
        .attr('x', reserved.box.w * 0.5 - reserved.attr.icon.size * 0.5)
        .attr('y', reserved.box.h * 0.125 - reserved.attr.icon.size * 0.5)
        .attr('width', reserved.attr.icon.size)
        .attr('height', reserved.attr.icon.size)
        .attr('fill', '#aaaaaa')
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.1)
        .on('click', function () {
          if (shared.mode === 'inspector') {
            showPushPull()
            shared.mode = 'modifier'
          } else if (shared.mode === 'modifier') {
            hidePushPull()
            shared.mode = 'inspector'
          }
        })
    }
    function initData (optIn) {
      reserved = optIn
      reserved.g.attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')

      // reserved.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.box.w)
      //   .attr('height', reserved.box.h)
      //   .attr('fill', '#999999')
      showInspector()
      // initPull()
      // initPush()
      // createMergeButton()
      // createPushButton()
      // createPullButton()
    }
    this.initData = initData

    function updateData () {

    }
    this.updateData = updateData
  }
  let SvgBlockQueueOptimized = function () {
    function initData () {
      let adjustedBox = {
        x: box.blockQueueOptimized.x + box.blockQueueOptimized.w * 0.03,
        y: box.blockQueueOptimized.y + box.blockQueueOptimized.h * 0.05,
        w: box.blockQueueOptimized.w * 0.94,
        h: box.blockQueueOptimized.h * 0.8,
        marg: lenD.w[0] * 0.01
      }

      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
      gBlockBox.append('text')
        .text('OPTIMIZED SCHEDULE')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-5,' + (adjustedBox.h * 0.5) + ') rotate(270)')

      blockQueueOptimized = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'blockQueue2', // 'blockQueue2',
        blockQueue: {
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.6, w: adjustedBox.w, h: adjustedBox.h * 0.6, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.0, w: adjustedBox.w, h: adjustedBox.h * 0.33, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.5, w: adjustedBox.w, h: adjustedBox.h * 0.47, marg: adjustedBox.marg},
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
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockQueue2: {
          g: undefined,
          schedBlocks: {
            label: {
              enabled: true,
              position: 'right'
            }
          },
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showText: true,
            orientation: 'axisTop',
            attr: {
              text: {
                size: 10,
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
            enabled: false,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockTrackShrink: {
          g: undefined,
          schedBlocks: {
            label: {
              enabled: true,
              position: 'left'
            }
          },
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showText: true,
            orientation: 'axisTop',
            attr: {
              text: {
                size: 14,
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
            enabled: false,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockList: {

        },
        blockForm: {
          mosaic: {
            box: {x: 0, y: 0, w: adjustedBox.w * 0.2, h: adjustedBox.h, marg: adjustedBox.marg},
            order: 'nSched'
          },
          forms: {
            g: undefined,
            box: {x: adjustedBox.w * 0.22,
              y: adjustedBox.h * 0.02,
              w: adjustedBox.w * 0.78 - adjustedBox.h * 0.02,
              h: adjustedBox.h * 0.96,
              marg: adjustedBox.marg},
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
            click: mainFocusOnBlock,
            mouseover: mainOverBlock,
            mouseout: mainOutBlock,
            drag: {
              start: svgFocusOverlay.dragStart,
              tick: svgFocusOverlay.dragTick,
              end: function (d) {
                let res = svgFocusOverlay.dragEnd(d)
                if (res) changeBlockProperties('', res.id, res.modif)
              }
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
      // blockQueueOptimized = new BlockQueueOptimizer({
      //   main: {
      //     tag: 'blockQueueMiddleTag',
      //     g: gBlockBox,
      //     box: adjustedBox,
      //     background: {
      //       fill: colorTheme.dark.background,
      //       stroke: colorTheme.dark.stroke,
      //       strokeWidth: 0.1
      //     },
      //     colorTheme: colorTheme
      //   },
      //   axis: {
      //     enabled: true,
      //     g: undefined,
      //     box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
      //     axis: undefined,
      //     scale: undefined,
      //     domain: [0, 1000],
      //     range: [0, 0],
      //     showText: true,
      //     orientation: 'axisTop',
      //     attr: {
      //       text: {
      //         stroke: colorTheme.medium.stroke,
      //         fill: colorTheme.medium.stroke
      //       },
      //       path: {
      //         stroke: colorTheme.medium.stroke,
      //         fill: colorTheme.medium.stroke
      //       }
      //     }
      //   },
      //   blocks: {
      //     enabled: true,
      //     run: {
      //       enabled: true,
      //       g: undefined,
      //       box: {x: 0, y: adjustedBox.h * 0.46875, w: adjustedBox.w, h: adjustedBox.h * 0.53125, marg: adjustedBox.marg},
      //       events: {
      //         click: mainFocusOnBlock,
      //         mouseover: mainOverBlock,
      //         mouseout: mainOutBlock,
      //         drag: {
      //           start: svgFocusOverlay.dragStart,
      //           tick: svgFocusOverlay.dragTick,
      //           end: function (d) {
      //             let res = svgFocusOverlay.dragEnd(d)
      //             if (res) changeBlockProperties('', res.id, res.modif)
      //           }
      //         }
      //       },
      //       background: {
      //         fill: colorTheme.brighter.background,
      //         stroke: 'none',
      //         strokeWidth: 0
      //       }
      //     },
      //     cancel: {
      //       enabled: true,
      //       g: undefined,
      //       box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h * 0.3125, marg: adjustedBox.marg},
      //       events: {
      //         click: mainFocusOnBlock,
      //         mouseover: mainOverBlock,
      //         mouseout: mainOutBlock,
      //         drag: {
      //           start: () => {},
      //           tick: () => {},
      //           end: () => {}
      //         }
      //       },
      //       background: {
      //         fill: colorTheme.brighter.background,
      //         stroke: colorTheme.brighter.stroke,
      //         strokeWidth: 0
      //       }
      //     },
      //     modification: {
      //       enabled: false,
      //       g: undefined,
      //       box: {x: 0, y: adjustedBox.h * 0.24, w: adjustedBox.w, h: adjustedBox.h * 0.36, marg: adjustedBox.marg},
      //       events: {
      //         click: mainFocusOnBlock,
      //         mouseover: mainOverBlock,
      //         mouseout: mainOutBlock,
      //         drag: {
      //           start: () => {},
      //           tick: () => {},
      //           end: () => {}
      //         }
      //       },
      //       background: {
      //         fill: colorTheme.brighter.background,
      //         stroke: colorTheme.brighter.stroke,
      //         strokeWidth: 0
      //       }
      //     },
      //     colorPalette: colorTheme.blocks
      //   },
      //   filters: {
      //     enabled: false,
      //     g: undefined,
      //     box: {x: 0, y: adjustedBox.h * 0.15, w: adjustedBox * 0.12, h: adjustedBox.h * 0.7, marg: 0},
      //     filters: []
      //   },
      //   timeBars: {
      //     enabled: true,
      //     g: undefined,
      //     box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
      //   },
      //   time: {
      //     currentTime: {time: 0, date: undefined},
      //     startTime: {time: 0, date: undefined},
      //     endTime: {time: 0, date: undefined}
      //   },
      //   data: {
      //     raw: undefined,
      //     formated: undefined,
      //     modified: undefined
      //   },
      //   debug: {
      //     enabled: false
      //   },
      //   pattern: {},
      //   event: {
      //     modifications: () => {}
      //   },
      //   input: {
      //     focus: {schedBlocks: undefined, block: undefined},
      //     over: {schedBlocks: undefined, block: undefined},
      //     selection: []
      //   }
      // })

      blockQueueOptimized.init()
      // update()
    }
    this.initData = initData

    function updateData () {
      // blockQueue.shrink()
      let telIds = []
      $.each(shared.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      blockQueueOptimized.updateData({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        },
        data: {
          raw: {
            blocks: shared.data.copy[shared.data.current].optimized.blocks,
            telIds: telIds
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      if (!blockQueueOptimized) return
      blockQueueOptimized.update({
        data: {
          raw: {
            blocks: [],
            telIds: []
          },
          modified: []
        },
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        }
      })
    }
    this.update = update
  }
  let SvgBlocksQueueInsert = function () {
    let reserved = {}
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData () {
      reserved.box = {
        x: box.blockQueueModif.x + box.blockQueueModif.w * 0.03,
        y: box.blockQueueModif.y + box.blockQueueModif.h * 0.05,
        w: box.blockQueueModif.w * 0.94,
        h: box.blockQueueModif.h * 0.9,
        marg: lenD.w[0] * 0.01
      }
      reserved.modifQueue = {
        x: reserved.box.x,
        y: 0,
        w: reserved.box.w,
        h: reserved.box.h * 0.73,
        marg: reserved.box.marg
      }

      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      gBlockBox.append('text')
        .text('MODIFICATIONS')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-5,' + (reserved.box.h * 0.5) + ') rotate(270)')

      blockQueueModif = new BlockQueueModif({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          box: reserved.modifQueue,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.1
          },
          colorTheme: colorTheme
        },
        axis: {
          enabled: false,
          g: undefined,
          box: {x: 0, y: reserved.modifQueue.h, w: reserved.modifQueue.w, h: 0, marg: reserved.modifQueue.marg},
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
            box: {x: 0, y: reserved.modifQueue.h * 0.24, w: reserved.modifQueue.w, h: reserved.modifQueue.h * 0.25, marg: reserved.modifQueue.marg},
            events: {
              click: mainFocusOnBlock,
              mouseover: mainOverBlock,
              mouseout: mainOutBlock,
              drag: {
                start: svgFocusOverlay.dragStart,
                tick: svgFocusOverlay.dragTick,
                end: function (d) {
                  let res = svgFocusOverlay.dragEnd(d)
                  if (res) svgSchedAndBlockCreator.changeBlockStartTime(res.modif[0].new, d)
                }
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
            box: {x: 0, y: reserved.modifQueue.h * 0.02, w: reserved.modifQueue.w, h: reserved.modifQueue.h * 0.2, marg: reserved.modifQueue.marg},
            events: {
              click: mainFocusOnBlock,
              mouseover: mainOverBlock,
              mouseout: mainOutBlock,
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
            enabled: false,
            g: undefined,
            box: {x: 0, y: reserved.modifQueue.h * 0.5, w: reserved.modifQueue.w, h: reserved.modifQueue.h * 0.47, marg: reserved.modifQueue.marg},
            events: {
              click: mainFocusOnBlock,
              mouseover: mainOverBlock,
              mouseout: mainOutBlock,
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
        filters: {
          enabled: false,
          g: undefined,
          box: {x: 0, y: reserved.modifQueue.h * 0.15, w: lenD.w[0] * 0.12, h: reserved.modifQueue.h * 0.7, marg: 0},
          filters: []
        },
        timeBars: {
          enabled: false,
          g: undefined,
          box: {x: 0, y: 0, w: reserved.modifQueue.w, h: reserved.modifQueue.h, marg: reserved.modifQueue.marg}
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
        event: {
          modifications: () => {}
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })

      blockQueueModif.init()
      update()
    }
    this.initData = initData
    function updateData () {
      let telIds = []
      $.each(shared.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      blockQueueModif.updateData({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        },
        data: {
          raw: {
            blocks: shared.data.copy[shared.data.current].creation.blocks,
            telIds: telIds
          },
          modified: []
        }
      })
    }
    this.updateData = updateData
    function update () {
      blockQueueModif.update({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        }
      })
    }
    this.update = update
  }
  let SvgTargets = function () {
    let reserved = {}
    reserved.drag = {}
    function initData () {
      reserved.box = {
        x: box.tools.x,
        y: box.tools.y + box.tools.h * 0.0,
        w: box.tools.w,
        h: box.tools.h * 0.5,
        marg: lenD.w[0] * 0.01
      }

      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      // gBlockBox.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.box.w)
      //   .attr('height', reserved.box.h)
      //   .attr('fill', 'none')
      //   .attr('stroke', '#444444')
      //   .attr('stroke-width', 0.2)
      //   .attr('stroke-dasharray', [0, reserved.box.w, reserved.box.h, reserved.box.w, reserved.box.h])
      // gBlockBox.append('text')
      //   .text('MODIFICATIONS')
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(-5,' + (reserved.box.h * 0.5) + ') rotate(270)')
      reserved.clipping = {}
      reserved.clipping.g = gBlockBox.append('g')
      reserved.clipping.g.append('defs').append('svg:clipPath')
        .attr('id', 'clipTarget')
        .append('svg:rect')
        .attr('id', 'clip-rect')
        .attr('x', '0')
        .attr('y', '0')
        .attr('width', reserved.box.w)
        .attr('height', reserved.box.h)
      reserved.clipping.clipBody = reserved.clipping.g.append('g')
        .attr('clip-path', 'url(#clipTarget)')
    }
    this.initData = initData
    function updateData () {
      drawTargets()
    }
    this.updateData = updateData
    function update () {}
    this.update = update

    function drawTargets () {
      let scaleX = d3.scaleLinear()
        .range([0, reserved.box.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
      let scaleY = d3.scaleLinear()
        .range([reserved.box.h, reserved.box.h * 0.2])
        .domain([0, 1])
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .curve(d3.curveNatural)

      let allg = reserved.clipping.clipBody.selectAll('g.target')
        .data(shared.data.server.targets, function (d) {
          return d.id
        })
      let gEnter = allg.enter()
        .append('g')
        .attr('class', 'target')
      gEnter.append('path')
        .attr('d', function (d) {
          let targetPoints = [
            {x: scaleX(d.observability.minimal), y: scaleY(0)},
            {x: scaleX(d.observability.optimal), y: scaleY(1)},
            {x: scaleX(d.observability.maximal), y: scaleY(0)}
          ]
          return lineGenerator(targetPoints)
        })
        .attr('fill', function (d) {
          // if (block.data.targetId === d.id) return colorTheme.dark.background
          return 'none'
        })
        .attr('stroke', function (d) {
          // if (block.data.targetId === d.id) return colorTheme.dark.stroke
          return colorTheme.dark.stroke
        })
        .attr('stroke-width', function (d) {
          // if (block.data.targetId === d.id) return 0.2
          return 0.4
        })
        .attr('stroke-opacity', function (d) {
          // if (block.data.targetId === d.id) return 1
          return 0.4
        })
        .attr('fill-opacity', 0.15)
        .attr('stroke-dasharray', function (d) {
          // if (block.data.targetId === d.id) return []
          return [4, 6]
        })
      // gEnter.append('rect')
      //   .attr('x', function (d) { return scaleX(d.observability.minimal) })
      //   .attr('y', reserved.box.h * 0.65)
      //   .attr('width', function (d) { return scaleX(d.observability.maximal) - scaleX(d.observability.minimal) })
      //   .attr('height', reserved.box.h * 0.1)
      //   .attr('fill', colorTheme.darker.background)
      //   .attr('fill-opacity', 0.3)
      //   .attr('stroke', colorTheme.darker.stroke)
      //   .attr('stroke-width', 0.1)
      gEnter.append('text')
        .text(function (d) {
          return d.id
        })
        .attr('x', function (d) {
          let xx = scaleX(d.observability.minimal) + 10
          return (xx < 0) ? 10 : xx
        })
        .attr('y', reserved.box.h - 3)
        .attr('text-anchor', 'start')
        .attr('font-size', 10)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .style('fill', function (d) {
          // if (block.data.targetId === d.id) return colorTheme.dark.stroke
          return colorTheme.dark.stroke
        })
        .style('fill-opacity', function (d) {
          // if (block.data.targetId === d.id) return 1
          return 0.6
        })
    }
    function showPercentTarget (block) {
      reserved.clipping.clipBody.select('text.percentStart').remove()
      reserved.clipping.clipBody.select('text.percentEnd').remove()

      if (!block.data.targetId) return
      let target = reserved.clipping.clipBody.selectAll('g.target')
        .filter(function (d) { return (block.data.targetId === d.id) }).select('path')._groups[0][0]
      let scaleX = d3.scaleLinear()
        .range([0, reserved.box.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
      function dichotomiePath (targetedX, start, end, path, precision, step, maxStack) {
        if (step > maxStack) return {x: -1, y: -1}
        let middle = (end + start) * 0.5
        let point = path.getPointAtLength(middle)
        if (Math.abs(point.x - targetedX) < precision) return point
        if (point.x > targetedX) return dichotomiePath(targetedX, start, middle, path, precision, step + 1, maxStack)
        if (point.x < targetedX) return dichotomiePath(targetedX, middle, end, path, precision, step + 1, maxStack)
      }
      let scaleY = d3.scaleLinear()
        .range([reserved.box.h, reserved.box.h * 0.2])
        .domain([0, 1])
      let projBlockStart = {x: scaleX(block.data.startTime), y: -1}

      if (projBlockStart.x < target.getPointAtLength(0).x || projBlockStart.x > target.getPointAtLength(target.getTotalLength()).x) {
        projBlockStart.y = scaleY(0)
        reserved.clipping.clipBody.append('text')
          .attr('class', 'percentStart')
          .text(function (d) {
            return '0.00%'
          })
          .attr('x', projBlockStart.x - 5)
          .attr('y', projBlockStart.y - 5)
          .attr('text-anchor', 'end')
          .attr('font-size', 8)
          .attr('dy', 0)
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .style('fill', colorTheme.dark.stroke)
          .style('fill-opacity', 1)
      } else {
        projBlockStart = dichotomiePath(projBlockStart.x, 0, target.getTotalLength(), target, 0.1, 0, 30)
        reserved.clipping.clipBody.append('text')
          .attr('class', 'percentStart')
          .text(function (d) {
            return (scaleY.invert(projBlockStart.y) * 100).toFixed(2) + '%'
          })
          .attr('x', projBlockStart.x - 5)
          .attr('y', projBlockStart.y - 5)
          .attr('text-anchor', 'end')
          .attr('font-size', 8)
          .attr('dy', 0)
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .style('fill', colorTheme.dark.stroke)
          .style('fill-opacity', 1)
      }

      let projBlockEnd = {x: scaleX(block.data.endTime), y: -1}
      if (projBlockEnd.x < target.getPointAtLength(0).x || projBlockEnd.x > target.getPointAtLength(target.getTotalLength()).x) {
        projBlockEnd.y = scaleY(0)
        reserved.clipping.clipBody.append('text')
          .attr('class', 'percentEnd')
          .text(function (d) {
            return '0.00%'
          })
          .attr('x', projBlockEnd.x + 5)
          .attr('y', projBlockEnd.y - 5)
          .attr('text-anchor', 'start')
          .attr('font-size', 8)
          .attr('dy', 0)
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .style('fill', colorTheme.dark.stroke)
          .style('fill-opacity', 1)
      } else {
        projBlockEnd = dichotomiePath(projBlockEnd.x, 0, target.getTotalLength(), target, 0.1, 0, 30)
        reserved.clipping.clipBody.append('text')
          .attr('class', 'percentEnd')
          .text(function (d) {
            return (scaleY.invert(projBlockEnd.y) * 100).toFixed(2) + '%'
          })
          .attr('x', projBlockEnd.x + 5)
          .attr('y', projBlockEnd.y - 5)
          .attr('text-anchor', 'start')
          .attr('font-size', 8)
          .attr('dy', 0)
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .style('fill', colorTheme.dark.stroke)
          .style('fill-opacity', 1)
      }
    }
    this.showPercentTarget = showPercentTarget
    function highlightTarget (block) {
      let tarG = reserved.clipping.clipBody.selectAll('g.target')
        .filter(function (d) { return (block.data.targetId === d.id) })
      tarG.select('path')
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.8)
        .attr('stroke-opacity', 1)
        .attr('fill-opacity', 0.55)
        .attr('stroke-dasharray', [])
      tarG.select('text')
        .style('fill', colorTheme.dark.stroke)
        .style('fill-opacity', 1)
      showPercentTarget(block)
    }
    this.highlightTarget = highlightTarget
    function unhighlightTarget (block) {
      if (!block.data) return
      reserved.clipping.clipBody.select('text.percentStart').remove()
      reserved.clipping.clipBody.select('text.percentEnd').remove()
      let tarG = reserved.clipping.clipBody.selectAll('g.target')
        .filter(function (d) { return (block.data.targetId === d.id) })
      tarG.select('path')
        .attr('fill', 'none')
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('stroke-opacity', 0.4)
        .attr('fill-opacity', 0.15)
        .attr('stroke-dasharray', [4, 6])
      tarG.select('text')
        .style('fill', colorTheme.dark.stroke)
        .style('fill-opacity', 0.3)
    }
    this.unhighlightTarget = unhighlightTarget
  }
  let SvgTelsConflict = function () {
    let reserved = {}
    reserved.drag = {}
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData () {
      reserved.box = {
        x: box.tools.x,
        y: box.tools.y + box.tools.h * 0.5,
        w: box.tools.w,
        h: box.tools.h * 0.5,
        marg: lenD.w[0] * 0.01
      }

      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      // gBlockBox.append('text')
      //   .text('MODIFICATIONS')
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(-5,' + (reserved.box.h * 0.5) + ') rotate(270)')

      reserved.gTargets = gBlockBox.append('g')
      reserved.gTargets.append('defs').append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('id', 'clip-rect')
        .attr('x', '0')
        .attr('y', '0')
        .attr('width', reserved.box.w)
        .attr('height', reserved.box.h)
      reserved.clipBody = reserved.gTargets.append('g')
        .attr('clip-path', '') //'url(#clip)')

      let range = reserved.box.h * 0.33333
      reserved.clipBody.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.dark.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
      reserved.clipBody.append('rect')
        .attr('x', 0)
        .attr('y', range * 1)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.medium.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
      reserved.clipBody.append('rect')
        .attr('x', 0)
        .attr('y', range * 2)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.dark.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
    }
    this.initData = initData
    function updateData () {
      drawTelsAvailabilityCurve()
    }
    this.updateData = updateData
    function update () {}
    this.update = update

    function drawTelsAvailabilityCurve (block) {
      let curve = computeTelsCurve(block)

      let scaleX = d3.scaleLinear()
        .range([0, reserved.box.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
      // console.log(blockQueue.get('axis').range, blockQueue.get('axis').domain);
      let range = reserved.box.h * 0.33333
      let scaleYSmall = d3.scaleLinear()
        .range([0, range * 0.5])
        .domain([0, 69])
      let scaleYMedium = d3.scaleLinear()
        .range([0, range * 0.5])
        .domain([0, 25])
      let scaleYLarge = d3.scaleLinear()
        .range([0, range * 0.5])
        .domain([0, 4])
      let allg = reserved.clipBody.selectAll('g.telsCurve')
        .data(curve, function (d, i) {
          return i
        })
      let gEnter = allg.enter()
        .append('g')
        .attr('class', 'telsCurve')
      gEnter.append('rect').attr('class', 'small')
      gEnter.append('rect').attr('class', 'medium')
      gEnter.append('rect').attr('class', 'high')
      let gMerge = allg.merge(gEnter)

      gMerge.select('rect.small')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', function (d) { return (range * 1) - 2 * Math.abs(scaleYSmall(d.smallTels)) })
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('fill', function (d, i) {
          return '#43A047'
        })
        .attr('height', function (d) {
          let height = scaleYSmall(d.smallTels) * 2
          if (height < 0) d3.select(this).attr('fill', '#FF5722')
          return Math.abs(height)
        })
        .attr('stroke', function (d) {
          return colorTheme.dark.stroke
        })
        .attr('stroke-width', function (d) {
          return 0
        })
        .attr('stroke-opacity', function (d) {
          return 1
        })
        .attr('fill-opacity', 0.6)

      gMerge.select('rect.medium')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', function (d) { return (range * 2) - 2 * Math.abs(scaleYMedium(d.mediumTels)) })
        .attr('fill', function (d, i) {
          return '#43A047'
        })
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('height', function (d) {
          let height = scaleYMedium(d.mediumTels) * 2
          if (height < 0) d3.select(this).attr('fill', '#FF5722')
          return Math.abs(height)
        })
        .attr('stroke', function (d) {
          return colorTheme.dark.stroke
        })
        .attr('stroke-width', function (d) {
          return 0
        })
        .attr('stroke-opacity', function (d) {
          return 1
        })
        .attr('fill-opacity', 0.6)

      gMerge.select('rect.high')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', function (d) { return (range * 3) - 2 * Math.abs(scaleYLarge(d.largeTels)) })
        .attr('fill', function (d, i) {
          return '#43A047'
        })
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('height', function (d) {
          let height = scaleYLarge(d.largeTels) * 2
          if (height < 0) d3.select(this).attr('fill', '#FF5722')
          return Math.abs(height)
        })
        .attr('stroke', function (d) {
          return colorTheme.dark.stroke
        })
        .attr('stroke-width', function (d) {
          return 0
        })
        .attr('stroke-opacity', function (d) {
          return 1
        })
        .attr('fill-opacity', 0.6)
    }
    this.drawTelsAvailabilityCurve = drawTelsAvailabilityCurve
    function computeTelsCurve (block) {
      let largeTels = {}
      let mediumTels = {}
      let smallTels = {}
      // smallTels[shared.data.server.timeOfNight.start] = 0
      // mediumTels[shared.data.server.timeOfNight.start] = 0
      // largeTels[shared.data.server.timeOfNight.start] = 0
      let focusBlockList = getBlocksData()
      for (let key in focusBlockList) {
        for (let i = 0; i < focusBlockList[key].length; i++) {
          let b = focusBlockList[key][i]
          if (b.exeState.state === 'cancel') continue
          if (block && b.obId === block.obId) continue

          if (!largeTels[b.startTime]) largeTels[b.startTime] = 0// 4
          if (!mediumTels[b.startTime]) mediumTels[b.startTime] = 0// 24
          if (!smallTels[b.startTime]) smallTels[b.startTime] = 0// 70
          if (!largeTels[b.endTime]) largeTels[b.endTime] = 0// 4
          if (!mediumTels[b.endTime]) mediumTels[b.endTime] = 0// 24
          if (!smallTels[b.endTime]) smallTels[b.endTime] = 0// 70

          for (let j = 0; j < b.telIds.length; j++) {
            let tid = b.telIds[j]
            if (tid[0] === 'S') {
              smallTels[b.startTime] -= 1
              smallTels[b.endTime] += 1
            } else if (tid[0] === 'M') {
              mediumTels[b.startTime] -= 1
              mediumTels[b.endTime] += 1
            } else if (tid[0] === 'L') {
              largeTels[b.startTime] -= 1
              largeTels[b.endTime] += 1
            }
          }
        }
      }
      if (block) {
        if (!largeTels[block.startTime]) largeTels[block.startTime] = 0
        if (!mediumTels[block.startTime]) mediumTels[block.startTime] = 0
        if (!smallTels[block.startTime]) smallTels[block.startTime] = 0
        if (!largeTels[block.endTime]) largeTels[block.endTime] = 0
        if (!mediumTels[block.endTime]) mediumTels[block.endTime] = 0
        if (!smallTels[block.endTime]) smallTels[block.endTime] = 0

        for (let j = 0; j < block.telIds.length; j++) {
          let tid = block.telIds[j]
          if (tid[0] === 'S') {
            smallTels[block.startTime] -= 1
            smallTels[block.endTime] += 1
          } else if (tid[0] === 'M') {
            mediumTels[block.startTime] -= 1
            mediumTels[block.endTime] += 1
          } else if (tid[0] === 'L') {
            largeTels[block.startTime] -= 1
            largeTels[block.endTime] += 1
          }
        }
      // smallTels[shared.data.server.timeOfNight.end] = 0
      // mediumTels[shared.data.server.timeOfNight.end] = 0
      // largeTels[shared.data.server.timeOfNight.end] = 0
      }
      let timeMarker = []
      for (var key in smallTels) {
        timeMarker.push(Number(key))
      }
      timeMarker.sort((a, b) => a - b)
      let telsFree = []
      for (let i = -1; i < timeMarker.length; i++) {
        if (i === -1) {
          telsFree.push({
            start: Number(shared.data.server.timeOfNight.start),
            end: timeMarker[i + 1],
            smallTels: 69,
            mediumTels: 25,
            largeTels: 4
          })
        } else if (i === timeMarker.length - 1) {
          telsFree.push({
            start: timeMarker[i],
            end: Number(shared.data.server.timeOfNight.end),
            smallTels: 69,
            mediumTels: 25,
            largeTels: 4
          })
        } else {
          telsFree.push({
            start: timeMarker[i],
            end: timeMarker[i + 1],
            smallTels: telsFree[i].smallTels + smallTels[timeMarker[i]],
            mediumTels: telsFree[i].mediumTels + mediumTels[timeMarker[i]],
            largeTels: telsFree[i].largeTels + largeTels[timeMarker[i]]
          })
        }
      }
      return telsFree
    }
  }
  let SvgFocusOverlay = function () {
    let reserved = {}
    reserved.drag = {}
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData () {
      reserved.hasData = false
    }
    this.initData = initData
    function updateData () {
      reserved.hasData = true
    }
    this.updateData = updateData
    function update () {}
    this.update = update

    function createDragColumn (d) {
      reserved.drag.column = {}
      reserved.drag.column.g = reserved.drag.g.append('g')
      reserved.drag.column.g.append('rect')
        .attr('class', 'area')
        .attr('x', reserved.drag.position.left)
        // .attr('y', function () { return d.y + reserved.drag.box.h * 0.19 }) // - Number(reserved.drag.oldRect.attr('height')))
        .attr('width', reserved.drag.position.right - reserved.drag.position.left)
        // .attr('height', function () { return d.h })
        .attr('fill', '#ffffff')
        .attr('stroke', 'none')
        .attr('fill-opacity', 0.2)
        .style('pointer-events', 'none')
        .transition()
        .duration(300)
        .attr('y', 0)
        .attr('height', reserved.drag.box.h)
      reserved.drag.column.g.append('line')
        .attr('class', 'left')
        .attr('x1', reserved.drag.position.left)
        // .attr('y1', function () { return d.y + reserved.drag.box.h * 0.19 })
        .attr('x2', reserved.drag.position.left)
        // .attr('y2', function () { return d.y + reserved.drag.box.h * 0.19 + d.h })
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5)
        .transition()
        .duration(150)
        .attr('y1', 0)
        .attr('y2', reserved.drag.box.h)
        // .attr('stroke-dasharray', [reserved.drag.box.h * 0.02, reserved.drag.box.h * 0.02])
      reserved.drag.column.g.append('line')
        .attr('class', 'right')
        .attr('x1', reserved.drag.position.right)
        // .attr('y1', function () { return d.y + reserved.drag.box.h * 0.19 })
        .attr('x2', reserved.drag.position.right)
        // .attr('y2', function () { return d.y + reserved.drag.box.h * 0.19 + d.h })
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5)
        .transition()
        .duration(150)
        .attr('y1', 0)
        .attr('y2', reserved.drag.box.h)
        // .attr('stroke-dasharray', [reserved.drag.box.h * 0.02, reserved.drag.box.h * 0.02])
      reserved.drag.column.g.append('rect')
        .attr('class', 'top')
        .attr('x', reserved.drag.position.left - 4)
        .attr('y', -3) // - Number(reserved.drag.oldRect.attr('height')))
        .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
        .attr('height', 3)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('opacity', 0)
        .transition()
        .duration(50)
        .delay(0)
        .attr('opacity', 1)
      reserved.drag.column.g.append('rect')
        .attr('class', 'bottom')
        .attr('x', reserved.drag.position.left - 4)
        .attr('y', reserved.drag.box.h - 2) // - Number(reserved.drag.oldRect.attr('height')))
        .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
        .attr('height', 3)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('opacity', 0)
        .transition()
        .duration(50)
        .delay(0)
        .attr('opacity', 1)
    }
    function createDragBlock (d) {
      reserved.drag.block = {}
      reserved.drag.block.g = reserved.drag.g.append('g')
      reserved.drag.block.g.append('text')
        .attr('class', 'modified')
        .text(function () {
          return d.data.metaData.blockName
        })
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', function () {
          return '#000000'
        })
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', function () {
          return '#000000'
        })
        .attr('x', function () {
          return reserved.drag.position.left + reserved.drag.position.width * 0.5
        })
        .attr('y', function () {
          return 8
        })
        .attr('text-anchor', 'middle')
        .style('font-size', function () {
          return 4 + 'px'
        })
        // .attr('dy', function () {
        //   return 0 + 'px'
        // })
        .transition()
        .duration(150)
        .attr('y', function () {
          return 8
        })
        .attr('dy', function () {
          return 3 + 'px'
        })
        .style('font-size', function () {
          return 8 + 'px'
        })
    }
    function createDragTimer (d) {
      reserved.drag.timer = {}
      reserved.drag.timer.g = reserved.drag.g.append('g')
        .attr('transform', 'translate(' + reserved.drag.position.left + ',' + (reserved.drag.box.h * 0.45) + ')')
      // reserved.drag.timer.g.append('rect')
      //   .attr('class', 'timelineCursor')
      //   .attr('x', reserved.drag.position.left)
      //   .attr('y', 100) // - Number(reserved.drag.oldRect.attr('height')))
      //   .attr('width', reserved.drag.position.right - reserved.drag.position.left)
      //   .attr('height', 2)
      //   .attr('fill', colorTheme.brighter.background)
      //   .attr('stroke', '#333333')
      //   .attr('fill-opacity', 0.99)

      // reserved.drag.timer.timer.g = reserved.drag.timer.g.append('g')
      //   .attr('class', 'timeline')
      //   .attr('transform', 'translate(' + (reserved.drag.position.left) + ',' + (com.blocks.run.box.y + com.blocks.run.box.h) + ')')
      reserved.drag.timer.g.append('rect')
        .attr('class', 'timelineOpacity')
        .attr('x', -4)
        .attr('y', 4) // - Number(reserved.drag.oldRect.attr('height')))
        .attr('width', reserved.drag.position.width + 8)
        .attr('height', 2)
        .attr('fill', colorTheme.darker.stroke)
        .attr('stroke', 'none')
        .attr('fill-opacity', 0.9)
        .on('mouseover', function () {})
      reserved.drag.timer.g.append('text')
        .attr('class', 'hourLeft')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
          return d3.timeFormat('%H:')(time)
        })
        .attr('x', -24)
        .attr('y', 9) // - Number(reserved.drag.oldRect.attr('height')))
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .attr('dy', '0px')
      reserved.drag.timer.g.append('text')
        .attr('class', 'minuteLeft')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
          return d3.timeFormat('%M')(time)
        })
        .attr('x', -12)
        .attr('y', 9) // - Number(reserved.drag.oldRect.attr('height')))
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .attr('dy', '0px')

      reserved.drag.timer.g.append('text')
        .attr('class', 'hourRight')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
          return d3.timeFormat('%H:')(time)
        })
        .attr('x', reserved.drag.position.width + 12)
        .attr('y', 9) // - Number(reserved.drag.oldRect.attr('height')))
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .attr('dy', '0px')
      reserved.drag.timer.g.append('text')
        .attr('class', 'minuteRight')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
          return d3.timeFormat('%M')(time)
        })
        .attr('x', reserved.drag.position.width + 24)
        .attr('y', 9) // - Number(reserved.drag.oldRect.attr('height')))
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .attr('dy', '0px')
      // reserved.drag.oldG.select('rect.back').style('fill-opacity', 1)
      // reserved.drag.oldG.select('rect.back').style('stroke-opacity', 1)
    }

    function hideBlockInfo (d) {
      console.log(d);
      if (!reserved.drag.g) return

      reserved.drag.g.remove()
      reserved.drag = {}
      svgTargets.unhighlightTarget(d)
    }
    function showBlockInfo (d) {
      // if (!reserved.hasData) return
      // if (reserved.drag.g) return

      svgTargets.highlightTarget(d)
      reserved.drag.box = {
        x: box.focusOverlay.x,
        y: box.focusOverlay.y,
        w: box.focusOverlay.w,
        h: box.focusOverlay.h,
        marg: lenD.w[0] * 0.01
      }
      reserved.drag.g = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.drag.box.x + ',' + reserved.drag.box.y + ')')

      reserved.drag.timeScale = d3.scaleLinear()
        .range([0, reserved.drag.box.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
      reserved.drag.position = {
        width: reserved.drag.timeScale(d.data.endTime) - reserved.drag.timeScale(d.data.startTime),
        left: reserved.drag.timeScale(d.data.startTime),
        right: reserved.drag.timeScale(d.data.endTime)
      }
      createDragColumn(d)
      createDragBlock(d)
      createDragTimer(d)
    }

    function focusOnBlock (d) {
      showBlockInfo(d)
    }
    this.focusOnBlock = focusOnBlock
    function unfocusOnBlock (d) {
      hideBlockInfo(d)
    }
    this.unfocusOnBlock = unfocusOnBlock
    function overBlock (d) {
      if (!shared.focus.block) {
        showBlockInfo(d)
      }
    }
    this.overBlock = overBlock
    function outBlock (d) {
      if (shared.focus.block) {
      } else {
        hideBlockInfo(d)
      }
    }
    this.outBlock = outBlock

    function dragStart (d) {
      return
      if (d.endTime < Number(shared.data.server.timeOfNight.now)) return
      reserved.drag.atLeastOneTick = false
    }
    this.dragStart = dragStart
    function dragTick (d) {
      return
      if (d.endTime < Number(shared.data.server.timeOfNight.now)) return
      if (!reserved.drag.atLeastOneTick) {
        if (shared.focus.block !== d.data.obId) mainFocusOnBlock(d.data)

        reserved.drag.mousecursor = d3.mouse(reserved.drag.g._groups[0][0])
        reserved.drag.offset = reserved.drag.mousecursor[0] - reserved.drag.position.left

        reserved.drag.mode = {}
        reserved.drag.mode.current = 'general'
        reserved.drag.mode.previous = 'general'
        reserved.drag.atLeastOneTick = true
      }

      console.log('dragTick');
      function changeMinute (date, hour, min) {
        reserved.drag.finalTime.setDate(date)
        reserved.drag.finalTime.setHours(hour)
        reserved.drag.finalTime.setMinutes(min)
        reserved.drag.timer.g.select('text.minute')
          .text(function () {
            return d3.timeFormat('%M')(reserved.drag.finalTime)
          })

        changePosition()
      }
      function changeSecond (sec) {
        reserved.drag.finalTime.setSeconds(sec)
        reserved.drag.timer.g.select('text.second')
          .text(function () {
            return d3.timeFormat('%S')(reserved.drag.finalTime)
          })

        changePosition()
      }
      function changePosition () {
        let t = (reserved.drag.finalTime.getTime() - (new Date(shared.data.server.timeOfNight.date_start)).getTime()) / 1000
        // reserved.drag.position.left = reserved.drag.timeScale(t)

        reserved.drag.g.select('line.left')
          .attr('x1', reserved.drag.timeScale(t))
          .attr('x2', reserved.drag.timeScale(t))
        reserved.drag.g.select('line.right')
          .attr('x1', reserved.drag.timeScale(t) + reserved.drag.position.width)
          .attr('x2', reserved.drag.timeScale(t) + reserved.drag.position.width)
        // reserved.drag.newG.select('rect.modified')
        //   .attr('x', reserved.drag.timeScale(reserved.drag.finalTime))
        reserved.drag.block.g.select('text.modified')
          .attr('x', reserved.drag.timeScale(t) + reserved.drag.position.width * 0.5)
        reserved.drag.g.select('rect.area')
          .attr('x', reserved.drag.timeScale(t))
        reserved.drag.column.g.select('rect.top')
          .attr('x', reserved.drag.timeScale(t) - 4)
        reserved.drag.column.g.select('rect.bottom')
          .attr('x', reserved.drag.timeScale(t) - 4)
      }
      // return
      if (d.data.endTime < Number(shared.data.server.timeOfNight.now)) return
      //
      // if (!reserved.drag.firstDrag) {
      //   dragCopy.start(d)
      //   reserved.drag.firstDrag = true
      //   reserved.drag.g = com.blocks.cancel.g.append('g')
      //   reserved.drag.box = deepCopy(com.blocks.cancel.box)
      //   reserved.drag.box.h = com.main.box.h
      //   reserved.drag.mode = {}
      //   reserved.drag.mode.current = 'general'
      //   reserved.drag.mode.previous = 'general'
      //   reserved.drag.topLimit = (com.blocks.cancel.box.y + com.blocks.cancel.box.h)
      //   reserved.drag.bottomLimit = (com.blocks.run.box.y + com.blocks.run.box.h)
      //
      //   reserved.drag.newG = reserved.drag.newG.merge(enter)
      // }
      else {
        // let delta = {
        //   x: d3.mouse(com.main.g._groups[0][0])[0] - reserved.drag.mousecursor[0],
        //   y: d3.mouse(com.main.g._groups[0][0])[1] - reserved.drag.mousecursor[1]
        // }
        reserved.drag.mousecursor = d3.mouse(reserved.drag.g._groups[0][0])

        reserved.drag.position.left = reserved.drag.mousecursor[0] - reserved.drag.offset
        if (reserved.drag.position.left < 0) reserved.drag.position.left = 0
        if (reserved.drag.position.left + reserved.drag.position.width > reserved.drag.box.x + reserved.drag.box.w) {
          reserved.drag.position.left = reserved.drag.box.w - reserved.drag.position.width
        }

        reserved.drag.position.right = reserved.drag.position.left + reserved.drag.position.width

        // if (reserved.drag.mousecursor[1] > (reserved.drag.box.h * 0.49)) {
        //   reserved.drag.mode.previous = reserved.drag.mode.current
        //   reserved.drag.mode.current = 'precision'
        // } else {
        //   reserved.drag.mode.previous = reserved.drag.mode.current
        //   reserved.drag.mode.current = 'general'
        // }

        if (reserved.drag.mode.current === 'general') { // || reserved.drag.mode.current === 'cancel') {
          // if (reserved.drag.mode.current === 'general' && reserved.drag.mode.previous === 'cancel') {
          //   reserved.drag.newG.select('g rect.modified').attr('fill', reserved.drag.oldG.select('rect.back').style('fill'))
          //   reserved.drag.newG.select('g rect.modified').attr('y', 0)
          //   reserved.drag.newG.select('g rect.modified').attr('height', reserved.drag.oldG.select('rect.back').attr('height'))
          //
          //   let text = {}
          //   text.y = Number(reserved.drag.oldG.select('rect.back').attr('height')) * 0.5
          //   reserved.drag.newG.select('g text.modified').attr('y', text.y)
          //   reserved.drag.newG.select('g text.modified').style('font-size', '12px')
          // } else if (reserved.drag.mode.current === 'cancel' && reserved.drag.mode.previous === 'general') {
          //   // reserved.drag.newG.select('g rect.modified').attr('x', reserved.drag.oldG.select('rect.back').attr('x'))
          //   reserved.drag.newG.select('g rect.modified').attr('y', -com.blocks.run.box.h * 0.4)
          //   reserved.drag.newG.select('g rect.modified').attr('height', 10)
          //   reserved.drag.newG.select('g rect.modified').attr('fill', colorTheme.blocks.cancelOp.background)
          //
          //   let text = {}
          //   text.x = Number(reserved.drag.oldG.select('rect.back').attr('x')) + Number(reserved.drag.oldG.select('rect.back').attr('width')) * 0.5
          //   text.y = -com.blocks.run.box.h * 0.4 + 5
          //   // reserved.drag.newG.select('g text.modified').attr('x', text.x)
          //   reserved.drag.newG.select('g text.modified').attr('y', text.y)
          //   reserved.drag.newG.select('g text.modified').style('font-size', '8px')
          // }

          if (d.data.exeState.state === 'run') return

          // if (reserved.drag.mode.previous === 'precision') {
          //   delete reserved.drag.finalTime
          //   reserved.drag.offset = reserved.drag.position.width * 0.5
          //   reserved.drag.timer.g.select('text.hour')
          //     .transition()
          //     .duration(600)
          //     .text(function () {
          //       return d3.timeFormat('%H:')(reserved.drag.timeScale.invert(reserved.drag.position.left))
          //     })
          //     .attr('x', 15)
          //     .attr('y', 9)
          //     .style('font-weight', 'normal')
          //   reserved.drag.timer.g.select('text.minute')
          //     .transition()
          //     .duration(600)
          //     .text(function () {
          //       return d3.timeFormat('%M')(reserved.drag.timeScale.invert(reserved.drag.position.left))
          //     })
          //     .attr('x', 27)
          //     .attr('y', 9)
          //     .style('font-weight', 'normal').style('font-size', '10px')
          //   reserved.drag.timer.g.select('text.second')
          //     .transition()
          //     .duration(600)
          //     .style('font-size', '0px')
          //     .style('opacity', 0)
          //     .remove()
          //   reserved.drag.timer.g.select('rect.timelineOpacity')
          //     .transition()
          //     .duration(600)
          //     .attr('x', 0)
          //     .attr('width', 40)
          //     .attr('height', 10)
          //     .attr('fill-opacity', 0.9)
          //   reserved.drag.timer.g.select('g.hourMin')
          //     .attr('opacity', 1)
          //     .transition()
          //     .duration(600)
          //     .attr('opacity', 0)
          //     .on('end', function () {
          //       reserved.drag.timer.g.select('g.hourMin').remove()
          //     })
          // }
          if (true) {
            reserved.drag.g.select('line.left')
              .attr('x1', reserved.drag.position.left)
              .attr('x2', reserved.drag.position.left)
            reserved.drag.g.select('line.right')
              .attr('x1', reserved.drag.position.right)
              .attr('x2', reserved.drag.position.right)
            // reserved.drag.g.select('g rect.modified')
            //   .attr('x', reserved.drag.position.left)
            reserved.drag.g.select('g text.modified')
              .attr('x', reserved.drag.position.left + reserved.drag.position.width * 0.5)
            reserved.drag.g.select('rect.area')
              .attr('x', reserved.drag.position.left)
            reserved.drag.g.select('rect.top')
              .attr('x', reserved.drag.position.left - 4)
            reserved.drag.g.select('rect.bottom')
              .attr('x', reserved.drag.position.left - 4)

            // reserved.drag.g.select('rect.timelineCursor')
            //   .attr('x', reserved.drag.position.left)
            reserved.drag.timer.g.attr('transform', function () {
              let t = reserved.drag.timer.g.attr('transform')
              t = t.split(',')
              t[0] = Number(t[0].split('(')[1])
              t[1] = Number(t[1].split(')')[0])
              return 'translate(' + Number(reserved.drag.g.select('line.left').attr('x1')) + ',' + t[1] + ')'
            })
            reserved.drag.timer.g.select('text.hourLeft').text(function () {
              let time = new Date(shared.data.server.timeOfNight.date_start)
              time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
              return d3.timeFormat('%H:')(time)
            })
            reserved.drag.timer.g.select('text.minuteLeft').text(function () {
              let time = new Date(shared.data.server.timeOfNight.date_start)
              time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
              return d3.timeFormat('%M')(time)
            })
            reserved.drag.timer.g.select('text.hourRight').text(function () {
              let time = new Date(shared.data.server.timeOfNight.date_start)
              time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
              return d3.timeFormat('%H:')(time)
            })
            reserved.drag.timer.g.select('text.minuteRight').text(function () {
              let time = new Date(shared.data.server.timeOfNight.date_start)
              time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
              return d3.timeFormat('%M')(time)
            })

            svgTargets.showPercentTarget({data: {targetId: d.data.targetId,
              startTime: reserved.drag.timeScale.invert(reserved.drag.position.left),
              endTime: reserved.drag.timeScale.invert(reserved.drag.position.right)}})
            svgTelsConflict.drawTelsAvailabilityCurve({
              obId: d.data.obId,
              startTime: reserved.drag.timeScale.invert(reserved.drag.position.left),
              endTime: reserved.drag.timeScale.invert(reserved.drag.position.right),
              telIds: d.data.telIds
            })
          }
        }
        // else if (reserved.drag.mode.current === 'precision') {
        //   if (reserved.drag.mode.previous === 'general') {
        //     reserved.drag.finalTime = new Date(shared.data.server.timeOfNight.date_start)
        //     reserved.drag.finalTime.setSeconds(reserved.drag.finalTime.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
        //
        //     reserved.drag.timer.g.select('text.hour')
        //       .transition()
        //       .duration(600)
        //       .text(function () {
        //         return d3.timeFormat('%H:'target)(reserved.drag.finalTime)
        //       })
        //       .attr('x', 15)
        //       .attr('y', 10.5)
        //       .style('font-weight', 'bold')
        //     reserved.drag.timer.g.select('text.minute')
        //       .transition()
        //       .duration(600)
        //       .text(function () {
        //         return d3.timeFormat('%M')(reserved.drag.finalTime)
        //       })
        //       .attr('x', 29)
        //       .attr('y', 6.5)
        //       .style('font-weight', 'bold').style('font-size', '7px')
        //     reserved.drag.timer.g.append('text')
        //       .attr('class', 'second')
        //       .text(function () {
        //         return d3.timeFormat('%S')(reserved.drag.finalTime)
        //       })
        //       .attr('x', 29)
        //       .attr('y', 13) // - Number(reserved.drag.oldRect.attr('height')))
        //       .style('font-weight', 'bold')
        //       .style('opacity', 1)
        //       .style('fill-opacity', 0.7)
        //       .style('fill', '#000000')
        //       .style('stroke-width', 0.3)
        //       .style('stroke-opacity', 1)
        //       .attr('vector-effect', 'non-scaling-stroke')
        //       .style('pointer-events', 'none')
        //       .style('stroke', 'none')
        //       .attr('text-anchor', 'middle')
        //       .style('font-size', '7px')
        //       .attr('dy', '0px')
        //
        //     reserved.drag.timer.g
        //       .transition()
        //       .duration(600)
        //       .attr('x', -70)
        //       .attr('width', 180)
        //       .attr('height', 25)
        //       .attr('fill-opacity', 1)
        //     let hourMinG = reserved.drag.timer.g.append('g').attr('class', 'hourMin')
        //     for (let i = 1; i < 6; i++) {
        //       hourMinG.append('rect')
        //         .attr('class', function (d) {
        //           let date = new Date(reserved.drag.finalTime)
        //           date.setMinutes(date.getMinutes() - i)
        //           return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
        //         })
        //         .attr('x', 0)
        //         .attr('y', 0)
        //         .attr('width', 0)
        //         .attr('height', 15)
        //         .attr('fill', (i % 2 === 1 ? colorTheme.darker.background : colorTheme.darker.background))
        //         .attr('stroke', 'none')
        //         .attr('fill-opacity', 0.4)
        //         .on('mouseover', function (d) {
        //           let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
        //           let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
        //           let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
        //           changeMinute(newDate, newHour, newMin)
        //           d3.select(this).attr('fill-opacity', 0.9)
        //         })
        //         .on('mouseout', function () {
        //           d3.select(this).attr('fill-opacity', 0.4)
        //         })
        //         .transition()
        //         .duration(600)
        //         .attr('x', 5.5 - 15 * i)
        //         .attr('width', 15)
        //       hourMinG.append('text')
        //         .attr('class', 'hourMin-' + i)
        //         .text(function () {
        //           let date = new Date(reserved.drag.finalTime)
        //           date.setMinutes(date.getMinutes() - i)
        //           return d3.timeFormat(':%M')(date)
        //         })
        //         .attr('x', 20)
        //         .attr('y', 10)
        //         .style('font-weight', 'normal')
        //         .style('opacity', 1)
        //         .style('fill-opacity', 0)
        //         .style('fill', '#000000')
        //         .attr('vector-effect', 'non-scaling-stroke')
        //         .style('pointer-events', 'none')
        //         .style('stroke', 'none')
        //         .attr('text-anchor', 'middle')
        //         .style('font-size', '7px')
        //         .attr('dy', '0px')
        //         .transition()
        //         .duration(600)
        //         .style('fill-opacity', 0.7)
        //         .attr('x', 13 - 15 * i)
        //     }
        //     for (let i = 1; i < 6; i++) {
        //       hourMinG.append('rect')
        //         .attr('class', function (d) {
        //           let date = new Date(reserved.drag.finalTime)
        //           date.setMinutes(date.getMinutes() + (i - 1))
        //           return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
        //         })
        //         .attr('x', 0)
        //         .attr('y', 0)
        //         .attr('width', 0)
        //         .attr('height', 15)
        //         .attr('fill', (i % 2 === 1 ? colorTheme.darker.background : colorTheme.darker.background))
        //         .attr('stroke', 'none')
        //         .attr('fill-opacity', 0.4)
        //         .on('mouseover', function (d) {
        //           let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
        //           let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
        //           let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
        //           changeMinute(newDate, newHour, newMin)
        //           d3.select(this).attr('fill-opacity', 0.9)
        //         })
        //         .on('mouseout', function () {
        //           d3.select(this).attr('fill-opacity', 0.4)
        //         })
        //         .transition()
        //         .duration(600)
        //         .attr('x', 19.5 + 15 * i)
        //         .attr('width', 15)
        //       hourMinG.append('text')
        //         .attr('class', 'hourMin+' + (i - 1))
        //         .text(function () {
        //           let date = new Date(reserved.drag.finalTime)
        //           date.setMinutes(date.getMinutes() + (i - 1))
        //           return d3.timeFormat(':%M')(date)
        //         })
        //         .attr('x', 27 + 15 * i)
        //         .attr('y', 10) // - Number(reserved.drag.oldRect.attr('height')))
        //         .style('font-weight', 'normal')
        //         .style('opacity', 1)
        //         .style('fill-opacity', 0.7)
        //         .style('fill', '#000000')
        //         .style('stroke-width', 0.3)
        //         .style('stroke-opacity', 1)
        //         .attr('vector-effect', 'non-scaling-stroke')
        //         .style('pointer-events', 'none')
        //         .style('stroke', 'none')
        //         .attr('text-anchor', 'middle')
        //         .style('font-size', '7px')
        //         .attr('dy', '0px')
        //     }
        //     for (let i = 0; i < 12; i++) {
        //       hourMinG.append('rect')
        //         .attr('class', function (d) {
        //           let date = new Date()
        //           date.setSeconds(5 * i)
        //           return 'hourSec:' + date.getSeconds()
        //         })
        //         .attr('x', 20)
        //         .attr('y', 14)
        //         .attr('width', 0)
        //         .attr('height', 12)
        //         .attr('fill', (i % 2 === 1 ? colorTheme.darker.background : colorTheme.darker.background))
        //         .attr('stroke', '#222222')
        //         .attr('stroke-width', 0.3)
        //         .attr('stroke-dasharray', [0, 5, 5, 8, 6, 21, 6, 3])
        //         .attr('fill-opacity', 0.4)
        //         .on('mouseover', function (d) {
        //           changeSecond(Number(d3.select(this).attr('class').split(':')[1]))
        //           d3.select(this).attr('fill-opacity', 1)
        //         })
        //         .on('mouseout', function () {
        //           d3.select(this).attr('fill-opacity', 0.4)
        //         })
        //         .transition()
        //         .duration(600)
        //         .attr('x', -62 - 8 + 15 * i)
        //         .attr('width', 15)
        //       hourMinG.append('text')
        //         .attr('class', 'Min_sec' + i)
        //         .text(function () {
        //           let date = new Date()
        //           date.setSeconds(5 * i)
        //           return d3.timeFormat(':%S')(date)
        //         })
        //         .attr('x', -62 + 15 * i)
        //         .attr('y', 22) // - Number(reserved.drag.oldRect.attr('height')))
        //         .style('font-weight', 'normal')
        //         .style('opacity', 1)
        //         .style('fill-opacity', 0.7)
        //         .style('fill', '#000000')
        //         .style('stroke-width', 0.3)
        //         .style('stroke-opacity', 1)
        //         .attr('vector-effect', 'non-scaling-stroke')
        //         .style('pointer-events', 'none')
        //         .style('stroke', 'none')
        //         .attr('text-anchor', 'middle')
        //         .style('font-size', '7px')
        //         .attr('dy', '0px')
        //     }
        //   }
        // }
      }
    }
    this.dragTick = dragTick
    function dragEnd (d) {
      return
      if (!reserved.drag.atLeastOneTick) return
      console.log('dragEnd')
      d3.event.sourceEvent.stopPropagation()
      if (d.data.endTime < Number(shared.data.server.timeOfNight.now)) return

      let newBlock = deepCopy(d)
      if (reserved.drag.finalTime) {
        let t = (reserved.drag.finalTime.getTime() - (new Date(shared.data.server.timeOfNight.date_start)).getTime()) / 1000
        reserved.drag.position.left = reserved.drag.timeScale(t)
      }
      let newStart = Math.floor(reserved.drag.timeScale.invert(reserved.drag.position.left))
      let modif = [{prop: 'startTime', old: newBlock.data.startTime, new: newStart}]

      // if (reserved.drag.mode.current === 'cancel') {
      //   modif.push({prop: 'state', old: d.data.exeState.state, new: 'cancel'})
      // }

      // changeBlockProperties('', d.data.obId, modif)
      // blockQueue.saveModificationAndUpdateBlock(newBlock, modif)
      // if (isGeneratingTelsConflict(newBlock)) {
      //   com.data.modified.conflict.push(newBlock)
      // } else {
      //   com.data.modified.integrated.push(newBlock)
      // }
      if (reserved.drag.mode.previous === 'precision') {
        reserved.drag.timer.g.attr('transform', 'translate(' + reserved.drag.timeScale(newStart) + ',' + (reserved.drag.box.h * 0.49) + ')')
        reserved.drag.timer.g.select('text.hour')
          .transition()
          .duration(600)
          .text(function () {
            return d3.timeFormat('%H:')(reserved.drag.finalTime)
          })
          .attr('x', 15)
          .attr('y', 9)
          .style('font-weight', 'normal')
        reserved.drag.timer.g.select('text.minute')
          .transition()
          .duration(600)
          .text(function () {
            return d3.timeFormat('%M')(reserved.drag.finalTime)
          })
          .attr('x', 27)
          .attr('y', 9)
          .style('font-weight', 'normal').style('font-size', '10px')
        reserved.drag.timer.g.select('text.second')
          .transition()
          .duration(600)
          .style('font-size', '0px')
          .style('opacity', 0)
          .remove()
        reserved.drag.timer.g.select('rect.timelineOpacity')
          .transition()
          .duration(600)
          .attr('x', 0)
          .attr('width', 40)
          .attr('height', 10)
          .attr('fill-opacity', 0.9)
        reserved.drag.timer.g.select('g.hourMin')
          .attr('opacity', 1)
          .transition()
          .duration(600)
          .attr('opacity', 0)
          .on('end', function () {
            reserved.drag.timer.g.select('g.hourMin').remove()
          })
        delete reserved.drag.finalTime
      }

      return {id: d.data.obId, modif: modif}

      // reserved.drag.oldG.select('rect.back')
      //   .style('fill-opacity', 0.1)
      //   .style('stroke-opacity', 0.1)
      //   .style('pointer-events', 'none')
      // reserved.drag.oldG.remove()
    }
    this.dragEnd = dragEnd
  }

  let SvgRightInfo = function () {
    let template = {
      tag: 'rightInfo',
      g: undefined,
      box: {x: 1, y: 1, w: 1, h: 1},
      debug: {
        enabled: false
      }
    }
    let reserved = template

    function initData (dataIn) {
      reserved.box = deepCopy(box.rightInfo)
      reserved.g = svg.g.append('g').attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      // reserved.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.box.w)
      //   .attr('height', reserved.box.h)
      //   .attr('fill', colorTheme.dark.background)

      runningOverview()
    }
    this.initData = initData

    function update () {}
    this.update = update

    function runningOverview () {
      function createBlocksInformation () {
        reserved.g.append('text')
          .text(function (data) {
            return 'Execution'
          })
          .attr('x', reserved.box.w * 0.5)
          .attr('y', reserved.box.h * 0.02)
          .style('font-weight', '')
          .attr('text-anchor', 'middle')
          .style('font-size', 10)
          .attr('dy', 0)
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.dark.text)
          .attr('stroke', 'none')

        let tot = shared.data.server.blocks.done.length +
          shared.data.server.blocks.wait.length +
          shared.data.server.blocks.run.length
        let infoState = [
          {state: 'run', percent: shared.data.server.blocks.run.length / tot},
          {state: 'done', percent: 0},
          {state: 'fail', percent: 0},
          {state: 'cancel', percent: 0},
          {state: 'wait', percent: shared.data.server.blocks.wait.length / tot}
        ]
        for (let i = 0; i < shared.data.server.blocks.done.length; i++) {
          let b = shared.data.server.blocks.done[i]
          if (b.exeState.state === 'done') {
            infoState[1].percent += 1
          } else if (b.exeState.state === 'fail') {
            infoState[2].percent += 1
          } else if (b.exeState.state === 'cancel') {
            // if (hasVar(b.exeState.canRun)) {
            //   if (!b.exeState.canRun) return colorTheme.blocks.cancelOp
            // }
            infoState[3].percent += 1
          }
        }
        infoState[1].percent /= tot
        infoState[2].percent /= tot
        infoState[3].percent /= tot

        let r = reserved.box.w * 0.14
        let perimeter = 2 * Math.PI * r
        let offset = 0

        let circles = reserved.g
          .selectAll('g.state')
          .data(infoState, function (d) {
            return d.state
          })
        let enter = circles
          .enter()
          .append('g')
          .attr('class', 'state')
        enter.each(function (d) {
          d3.select(this).append('circle')
            .attr('cx', reserved.box.w - r * 1.5)
            .attr('cy', r * 1.8)
            .attr('r', r)
            .attr('fill', 'none')
            .attr('stroke', setCol({state: d.state, canRun: true}).background)
            .attr('stroke-width', reserved.box.w * 0.08)
            .attr('stroke-dasharray', [0, offset + 1, perimeter * d.percent - 2, 1 + (perimeter * (1 - d.percent)) - offset])
            .attr('stroke-dashoffset', -perimeter * 0.25 + infoState[0].percent * perimeter * 0.5)
          offset += perimeter * d.percent
        })
        // schedulingBlocks = enter.merge(schedulingBlocks)
        // schedulingBlocks.each(function (d) {
        //   d3.select(this).selectAll('rect.subBlocks')
        //     .data(d.blocks, function (d) {
        //       return d.obId
        //     })
        //     .transition()
        //     .duration(800)
        //     .attr('fill', function (d, i) {
        //       return setCol(d).background
        //     })
        // })
        let size = 16
        reserved.g.append('text')
          .text(function (data) {
            return tot + ' Obs'
          })
          .attr('x', reserved.box.w - r * 1.5)
          .attr('y', r * 1.7 + size * 0.5)
          .style('font-weight', '')
          .attr('text-anchor', 'middle')
          .style('font-size', size)
          .attr('dy', 0)
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.dark.text)
          .attr('stroke', 'none')
      }
      function createPointingInformation () {
        let box = {
          x: 0,
          y: reserved.box.h * 0.33,
          h: reserved.box.h * 0.3,
          w: reserved.box.w
        }

        reserved.g.append('text')
          .text(function (data) {
            return 'Targets'
          })
          .attr('x', box.w * 0.5)
          .attr('y', box.y - 10)
          .style('font-weight', '')
          .attr('text-anchor', 'middle')
          .style('font-size', 10)
          .attr('dy', 0)
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.dark.text)
          .attr('stroke', 'none')
        // let perLine = Math.floor(Math.sqrt(shared.data.server.targets.length)) + 1
        let rectBox = {
          w: box.w,
          h: box.h / shared.data.server.targets.length
        }
        // let lastLine = {
        //   index: shared.data.server.targets.length - (shared.data.server.targets.length % perLine),
        //   offset: box.w - rectBox.w * (shared.data.server.targets.length % perLine) * 0.5
        // }
        let targets = reserved.g
          .selectAll('g.target')
          .data(shared.data.server.targets, function (d) {
            return d.id
          })
        let enter = targets
          .enter()
          .append('g')
          .attr('class', 'target')
        enter.each(function (d, i) {
          let g = d3.select(this)
          g.attr('transform', 'translate(' + (0) + ',' + (12 + box.y + rectBox.h * i) + ')')
          // g.append('rect')
          //   .attr('x', rectBox.w * 0.0)
          //   .attr('y', rectBox.h * 0.05)
          //   .attr('width', rectBox.w)
          //   .attr('height', rectBox.h * 0.7)
          //   .attr('fill', colorTheme.medium.background)
          //   .attr('stroke', colorTheme.medium.stroke)
          //   .attr('stroke-width', 0.1)
          //   .attr('stroke-dasharray', [rectBox.w * 0.15, rectBox.w * 0.85 + rectBox.h * 0.9, rectBox.w + rectBox.h * 0.9])
          g.append('rect')
            .attr('x', rectBox.w * 0.5 - 20)
            .attr('y', -12)
            .attr('width', 40)
            .attr('height', 12 + rectBox.h * 0.05)
            .attr('fill', colorTheme.dark.background)
            .attr('stroke', colorTheme.medium.stroke)
            .attr('stroke-width', 0.1)
          g.append('text')
            .text(function () {
              return d.name
            })
            .attr('x', rectBox.w * 0.5)
            .attr('y', rectBox.h * 0.0)
            .style('font-weight', '')
            .attr('text-anchor', 'middle')
            .style('font-size', 10)
            .attr('dy', 0)
            .style('pointer-events', 'none')
            .attr('fill', colorTheme.dark.text)
            .attr('stroke', 'none')
          // g.append('text')
          //   .text(function () {
          //     return 'fullName of ' + d.id
          //   })
          //   .attr('x', rectBox.w * 0.16)
          //   .attr('y', rectBox.h * 0.0)
          //   .style('font-weight', '')
          //   .attr('text-anchor', 'start')
          //   .style('font-size', 10)
          //   .attr('dy', 0)
          //   .style('pointer-events', 'none')
          //   .attr('fill', colorTheme.dark.text)
          //   .attr('stroke', 'none')
        })
      }
      createBlocksInformation()
      createPointingInformation()
    }

    function createSchedBlocksInfoPanel (id) {
      let schedB = getSchedBlocksData()[id]
      console.log(schedB);
      let innerbox = {
        x: box.rightInfo.w * 0.0,
        y: box.rightInfo.h * 0.0,
        w: box.rightInfo.w * 1.0,
        h: box.rightInfo.h * 1.0,
        margH: box.rightInfo.h * 0.05
      }

      function createSchedulingObservingBlocksTree () {
        let txtSize = 10
        let dim = {
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.12
        }
        let color = shared.style.blockCol(data)
        let offset = (dim.w * 0.75) / schedB.blocks.length
        let width = Math.min(offset, dim.w * 0.1)

        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (innerbox.w * 0) + ',' + (innerbox.h * 0) + ')')
        g.append('rect')
          .attr('x', dim.w * 0.05)
          .attr('y', dim.h * 0.1)
          .attr('width', dim.w * 0.15)
          .attr('height', dim.h * 0.8)
          .attr('fill', color.background)
          .attr('stroke', color.stroke)
          .attr('stroke-width', 2)
        g.append('text')
          .text(data.metaData.blockName)
          .style('fill', color.text)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.125) + ',' + (dim.h * 0.5 + txtSize * 0.3) + ')')

        // g.append('text')
        //   .text('sched. block:')
        //   .style('fill', color.text)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize * 1.2)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (dim.w * 0.25) + ',' + (dim.h * 0.25 + txtSize * 0.3) + ')')
        g.append('rect')
          .attr('x', dim.w * 0.25)
          .attr('y', dim.h * 0.1)
          .attr('width', ((schedB.blocks.length - 1) * width) + width * 0.9)
          .attr('height', dim.h * 0.3)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', color.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('S' + data.metaData.nSched)
          .style('fill', color.text)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.25 + (((schedB.blocks.length - 1) * width) + width * 0.9) * 0.5) + ',' + (dim.h * 0.25 + txtSize * 0.3) + ')')

        // g.append('text')
        //   .text('obs. blocks:')
        //   .style('fill', color.text)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize * 1.2)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (dim.w * 0.25) + ',' + (dim.h * 0.75 + txtSize * 0.3) + ')')
        for (let i = 0; i < schedB.blocks.length; i++) {
          color = shared.style.blockCol(schedB.blocks[i])
          g.append('rect')
            .attr('x', (dim.w * 0.25) + (width * i))
            .attr('y', dim.h * 0.6)
            .attr('width', width * 0.9)
            .attr('height', dim.h * 0.3)
            .attr('fill', data.obId === schedB.blocks[i].obId ? colorTheme.darker.background : color.background)
            .attr('stroke', color.stroke)
            .attr('stroke-width', data.obId === schedB.blocks[i].obId ? 2 : 0.2)
          g.append('text')
            .text(schedB.blocks[i].metaData.nObs)
            .style('fill', color.text)
            .style('font-weight', '')
            .style('font-size', txtSize)
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + ((dim.w * 0.25) + (width * i) + (width * 0.45)) + ',' + (dim.h * 0.75 + txtSize * 0.3) + ')')
        }
      }
      function createStatusInformation () {
        let txtSize = 8.5
        let dim = {
          x: 0,
          y: innerbox.h * 0.15,
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.05
        }
        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (dim.x) + ',' + (dim.y) + ')')
        g.append('text')
          .text('Details:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.0) + ',' + (dim.h * 0.1 + txtSize * 0.3) + ')')
        g.append('line')
          .attr('x1', dim.w * 0.0)
          .attr('y1', (dim.h * 0.1 + txtSize * 0.5))
          .attr('x2', dim.w * 1.0)
          .attr('y2', (dim.h * 0.1 + txtSize * 0.5))
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('Scheduling block ID:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-style', 'italic')
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.8 + txtSize * 0.3) + ')')
        g.append('text')
          .text(data.sbId)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + (dim.h * 0.8 + txtSize * 0.3) + ')')

        g.append('text')
          .text('Observing block ID:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-style', 'italic')
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.8 + txtSize * 1.6) + ')')
        g.append('text')
          .text(data.obId)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + (dim.h * 0.8 + txtSize * 1.6) + ')')
      }
      function createTimeInformation () {
        let txtSize = 8.5
        let dim = {
          x: 0,
          y: innerbox.h * 0.25,
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.15
        }
        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (dim.x) + ',' + (dim.y) + ')')
        g.append('text')
          .text('Schedule:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize * 1.4)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.0) + ',' + (dim.h * 0.05 + txtSize * 0.3) + ')')
        g.append('line')
          .attr('x1', dim.w * 0.0)
          .attr('y1', (dim.h * 0.05 + txtSize * 0.5))
          .attr('x2', dim.w * 1.0)
          .attr('y2', (dim.h * 0.05 + txtSize * 0.5))
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        let height = dim.h * 0.25
        let width = Math.min((dim.w * 0.95) / schedB.blocks.length, dim.w * 0.18)
        let offset = dim.w * 0.02 + ((dim.w * 0.95) - (width * schedB.blocks.length)) * 0.5
        let current = g
          .selectAll('g.block')
          .data(schedB.blocks, function (d) {
            return d.obId
          })
        let enter = current
          .enter()
          .append('g')
          .attr('class', 'block')
        enter.each(function (d, i) {
          let startTime = new Date(shared.data.server.timeOfNight.date_start)
          startTime.setSeconds(startTime.getSeconds() + d.startTime)
          // let duration = Math.floor(d.duration / 3600) + ':' + Math.floor((d.duration % 3600) / 60) + ':' + (d.duration % 60) + ''
          let endTime = new Date(shared.data.server.timeOfNight.date_start)
          endTime.setSeconds(endTime.getSeconds() + d.startTime + d.duration)

          let color = shared.style.blockCol(d)

          let g = d3.select(this)
          g.attr('transform', 'translate(' + (offset + width * i) + ',' + (dim.h * 0.6 + (i % 2 === 1 ? height * 0.5 : 0)) + ')')

          g.append('rect')
            .attr('x', width * 0.1)
            .attr('y', 0)
            .attr('width', width * 0.8)
            .attr('height', height)
            .attr('fill', color.background)
            .attr('stroke', color.stroke)
            .attr('stroke-width', 0.2)
          g.append('text')
            .text(d.metaData.nObs)
            .style('fill', color.stroke)
            .style('font-weight', '')
            .style('font-size', txtSize)
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (width * 0.5) + ',' + (height * 0.5 + txtSize * 0.3) + ')')
          g.append('text')
            .text(d.startTime + ' s')
            .style('fill', colorTheme.dark.stroke)
            .style('font-weight', '')
            .style('font-size', txtSize)
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (width * 0.1) + ',' + (i % 2 === 0 ? (-txtSize - 2) : (dim.h * 0.25 + txtSize)) + ')')
          g.append('text')
            .text(d3.timeFormat('%H:%M:%S')(startTime))
            .style('fill', colorTheme.dark.stroke)
            .style('font-weight', '')
            .style('font-size', txtSize)
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (width * 0.1) + ',' + (i % 2 === 1 ? ((dim.h * 0.25 + txtSize) + txtSize) : -2) + ')')

          // g.append('text')
          //   .text(d.duration + ' s')
          //   .style('fill', colorTheme.dark.stroke)
          //   .style('font-weight', '')
          //   .style('font-size', txtSize)
          //   .attr('text-anchor', 'middle')
          //   .attr('transform', 'translate(' + (width * 0.5) + ',' + (i % 2 === 0 ? (-txtSize) : (dim.h * 0.25 + txtSize)) + ')')
          // g.append('text')
          //   .text(duration)
          //   .style('fill', colorTheme.dark.stroke)
          //   .style('font-weight', '')
          //   .style('font-size', txtSize)
          //   .attr('text-anchor', 'middle')
          //   .attr('transform', 'translate(' + (width * 0.5) + ',' + (i % 2 === 1 ? ((dim.h * 0.25 + txtSize) + txtSize) : 0) + ')')

          g.append('text')
            .text(d.endTime + ' s')
            .style('fill', colorTheme.dark.stroke)
            .style('font-weight', '')
            .style('font-size', txtSize)
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (width * 0.9) + ',' + (i % 2 === 0 ? (-txtSize - 2) : (dim.h * 0.25 + txtSize)) + ')')
          g.append('text')
            .text(d3.timeFormat('%H:%M:%S')(endTime))
            .style('fill', colorTheme.dark.stroke)
            .style('font-weight', '')
            .style('font-size', txtSize)
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (width * 0.9) + ',' + (i % 2 === 1 ? ((dim.h * 0.25 + txtSize) + txtSize) : -2) + ')')
        })

        let merge = current.merge(enter)

        merge.each(function (d, i) {
        })
        current
          .exit()
          .transition('inOut')
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()

        let startDay = new Date(shared.data.server.timeOfNight.date_start)
        startDay.setSeconds(startDay.getSeconds() + schedB.blocks[0].startTime)
        let endDay = new Date(shared.data.server.timeOfNight.date_start)
        endDay.setSeconds(endDay.getSeconds() + schedB.blocks[schedB.blocks.length - 1].startTime + schedB.blocks[schedB.blocks.length - 1].duration)
        g.append('text')
          .text(d3.timeFormat('%a %d %b %Y')(startDay))
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize * 1.1)
          .attr('text-anchor', (startDay.getDay() === endDay.getDay() ? 'middle' : 'end'))
          .attr('transform', 'translate(' + (dim.w * (startDay.getDay() === endDay.getDay() ? 0.5 : 0.45)) + ',' + (txtSize * 1.1 + 8) + ')')
        if (startDay.getDay() === endDay.getDay()) return
        g.append('text')
          .text(d3.timeFormat('%a %d %b %Y')(endDay))
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize * 1.1)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.55) + ',' + (txtSize * 1.1 + 8) + ')')
      }
      function createPointingInformation () {
        let txtSize = 8.5
        let dim = {
          x: 0,
          y: innerbox.h * 0.45,
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.25
        }
        let target = getTargetById(schedB.target.id)

        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (dim.x) + ',' + (dim.y) + ')')
        g.append('text')
          .text('Pointing:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize * 1.4)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.0) + ',' + (dim.h * 0.1 + txtSize * 0.3) + ')')
        g.append('line')
          .attr('x1', dim.w * 0.0)
          .attr('y1', (dim.h * 0.1 + txtSize * 0.5))
          .attr('x2', dim.w * 1.0)
          .attr('y2', (dim.h * 0.1 + txtSize * 0.5))
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        g.append('rect')
          .attr('x', dim.w * 0.0)
          .attr('y', dim.h * 0.2)
          .attr('width', dim.h * 0.8)
          .attr('height', dim.h * 0.8)
          .attr('fill', colorTheme.bright.background)
          .attr('stroke', colorTheme.bright.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('+')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize * 1.4)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.h * 0.4) + ',' + (dim.h * 0.6 + txtSize * 0.3) + ')')
        g.append('text')
          .text('trg')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.h * 0.4) + ',' + ((target.pos[1] < target.pos[1] ? txtSize * 1.3 : -txtSize * 1.3) + dim.h * 0.6) + ')')

        // let offX = (data.pointingPos[0] - target.pos[0]) * 4
        // let offY = (data.pointingPos[1] - target.pos[1]) * 4
        // g.append('text')
        //   .text('+')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-size', txtSize * 1.4)
        //   .attr('text-anchor', 'middle')
        //   .attr('transform', 'translate(' + (dim.h * 0.4 + offX) + ',' + (dim.h * 0.6 + offY + txtSize * 0.3) + ')')
        // g.append('text')
        //   .text('ptg')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'middle')
        //   .attr('transform', 'translate(' + (dim.h * 0.4 + offX) + ',' + ((data.pointingPos[1] < target.pos[1] ? -txtSize * 1.3 : txtSize * 1.3) + dim.h * 0.6 + offY) + ')')
        //
        // g.append('text')
        //   .text('Target name:')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-style', 'italic')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'start')
        //   .style('text-decoration', 'underline')
        //   .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + dim.h * 0.3 + ')')
        // g.append('text')
        //   .text(data.targetName)
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize * 1.0)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (dim.w * 0.52) + ',' + dim.h * 0.3 + ')')
        //
        // g.append('text')
        //   .text('id:')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-style', 'italic')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'start')
        //   .style('text-decoration', 'underline')
        //   .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + (dim.h * 0.3 + txtSize * 1.3) + ')')
        // g.append('text')
        //   .text(data.targetId)
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize * 1.0)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (dim.w * 0.4) + ',' + (dim.h * 0.3 + txtSize * 1.3) + ')')
        //
        // g.append('text')
        //   .text('Pointing name:')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-style', 'italic')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'start')
        //   .style('text-decoration', 'underline')
        //   .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + dim.h * 0.55 + ')')
        // g.append('text')
        //   .text(data.pointingName)
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize * 1.0)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (dim.w * 0.54) + ',' + dim.h * 0.55 + ')')
        //
        // g.append('text')
        //   .text('id:')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-style', 'italic')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'start')
        //   .style('text-decoration', 'underline')
        //   .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + (dim.h * 0.55 + txtSize * 1.3) + ')')
        // g.append('text')
        //   .text(data.pointingId)
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize * 1.0)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (dim.w * 0.4) + ',' + (dim.h * 0.55 + txtSize * 1.3) + ')')
        //
        // g.append('text')
        //   .text('target:')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-style', 'italic')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'middle')
        //   .style('text-decoration', 'underline')
        //   .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + dim.h * 0.8 + ')')
        // g.append('text')
        //   .text(target.pos[0])
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'middle')
        //   .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + dim.h * 0.9 + ')')
        // g.append('text')
        //   .text(target.pos[1])
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'middle')
        //   .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + (dim.h * 0.9 + txtSize * 1.3) + ')')
        //
        // g.append('text')
        //   .text('pointing:')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-style', 'italic')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'middle')
        //   .style('text-decoration', 'underline')
        //   .attr('transform', 'translate(' + (dim.w * 0.82) + ',' + dim.h * 0.8 + ')')
        // g.append('text')
        //   .text(data.pointingPos[0])
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'middle')
        //   .attr('transform', 'translate(' + (dim.w * 0.82) + ',' + dim.h * 0.9 + ')')
        // g.append('text')
        //   .text(data.pointingPos[1])
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize)
        //   .attr('text-anchor', 'middle')
        //   .attr('transform', 'translate(' + (dim.w * 0.82) + ',' + (dim.h * 0.9 + txtSize * 1.3) + ')')
      }
      function createTelescopeInformation () {
        let txtSize = 8.5
        let dim = {
          x: 0,
          y: innerbox.h * 0.65,
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.35
        }

        let largeT = []
        let mediumT = []
        let smallT = []

        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (dim.x) + ',' + (dim.y) + ')')

        function drawTels (tels, g, box, opt) {
          if (tels.length === 0) return
          let nbline = parseInt(tels.length / opt.telsPerRow) + (tels.length % opt.telsPerRow !== 0 ? 1 : 0)
          let size = {
            w: (box.w / opt.telsPerRow) / 2,
            h: Math.min(box.h / nbline / 2, (box.h * 0.15 * opt.size))
          }
          let fontsize = Math.max(Math.min(size.w * 0.4, 26), 10)
          let offset = {
            x: (box.w - (opt.telsPerRow * size.w * 2)) * 0.5, // (opt.telsPerRow + 1),
            y: (box.h - (nbline * size.h * 2)) * 0.5// (nbline + 1)
          }
          let lastLineOffset = {
            index: parseInt(((nbline - 1) * opt.telsPerRow)) - 1,
            x: (tels.length % opt.telsPerRow !== 0) ? (box.w - ((tels.length % opt.telsPerRow) * size.w * 2)) * 0.5 : offset.x
          }
          g.attr('transform', 'translate(' + (box.x) + ',' + 0 + ')')
          let current = g
            .selectAll('g.tel')
            .data(tels, function (d) {
              return d.id
            })
          let enter = current
            .enter()
            .append('g')
            .attr('class', 'tel')
          enter.each(function (d, i) {
            d3.select(this).attr('transform', function (d) {
              let tx = size.w * 0.5 + (size.w * 2) * (i % opt.telsPerRow) + (i > lastLineOffset.index ? lastLineOffset.x : offset.x)
              let ty = box.y + offset.y + (size.h * 2) * parseInt(i / opt.telsPerRow) + size.h * 0.5
              return 'translate(' + tx + ',' + ty + ')'
            })
            d3.select(this).append('ellipse')
              .attr('cx', size.w * 0.5)
              .attr('cy', size.h * 0.5)
              .attr('rx', size.w)
              .attr('ry', size.h)
              .attr('fill', telHealthCol(d.val))
              .attr('fill-opacity', 1)
              .attr('stroke-width', 0.2)
              .attr('stroke', colorTheme.dark.stroke)
            d3.select(this).append('text')
              .attr('x', size.w * 0.5)
              .attr('y', size.h * 0.5 + fontsize * 0.33)
              .style('font-size', fontsize)
              .text(function (d) {
                return d.split('_')[1]
              })
              .style('fill', colorTheme.blocks.run.text)
              .style('stroke', colorTheme.blocks.run.text)
              .style('font-weight', '')
              .style('stroke-width', 0.2)
              .attr('text-anchor', 'middle')
          })

          let merge = current.merge(enter)
          merge.each(function (d, i) {
            d3.select(this)
              .attr('opacity', 0)
              .transition()
              .duration(timeD.animArc)
              .attr('opacity', 1)
            //   .attr('transform', function (d) {
            //     let tx = size.w * 0.5 + (size.w * 2) * (i % opt.telsPerRow) + (i > lastLineOffset.index ? lastLineOffset.x : offset.x)
            //     let ty = box.y + offset.y + (size.h * 2) * parseInt(i / opt.telsPerRow) + size.h * 0.5
            //     return 'translate(' + tx + ',' + ty + ')'
            //   })
            // d3.select(this).select('ellipse')
            //   .transition()
            //   .duration(timeD.animArc)
            //   .attr('fill', telHealthCol(d.val))
            //   .attr('cx', size.w * 0.5)
            //   .attr('cy', size.h * 0.5)
            //   .attr('rx', size.w)
            //   .attr('ry', size.h)
            // d3.select(this).select('text')
            //   .text(function (d) {
            //     return d.split('_')[1]
            //   })
              // .attr('x', size.w * 0.5)
              // .attr('y', size.h * 0.5 + fontsize * 0.33)
              // .style('font-size', fontsize)
          })

          // current
          //   .exit()
          //   .transition('inOut')
          //   .duration(timeD.animArc)
          //   .style('opacity', 0)
          //   .remove()
        }
        function computeSizeRows () {
          reserved.large = {
            g: g.append('g'),
            opt: {
              telsPerRow: 1,
              nbl: 0,
              size: 1,
              ratio: 1
            },
            box: {
              x: 0,
              y: dim.h * 0.38,
              w: dim.w * 0.1,
              h: dim.h * 0.61
            }
          }
          reserved.medium = {
            g: g.append('g'),
            opt: {
              telsPerRow: 4,
              nbl: 0,
              size: 0.9,
              ratio: 1
            },
            box: {
              x: dim.w * 0.13,
              y: dim.h * 0.38,
              w: dim.w * 0.3,
              h: dim.h * 0.61
            }
          }
          reserved.small = {
            g: g.append('g'),
            opt: {
              telsPerRow: 8,
              nbl: 0,
              size: 0.75,
              ratio: 1
            },
            box: {
              x: dim.w * 0.46,
              y: dim.h * 0.38,
              w: dim.w * 0.54,
              h: dim.h * 0.61
            }
          }

          for (let j = 0; j < data.telIds.length; j++) {
            let t = data.telIds[j]
            if (t[0] === 'L') largeT.push(t)
            if (t[0] === 'M') mediumT.push(t)
            if (t[0] === 'S') smallT.push(t)
          }
          largeT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
          mediumT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
          smallT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })

          let l = reserved.large.opt.size * (parseInt(largeT.length / reserved.large.opt.telsPerRow) + (largeT.length % reserved.large.opt.telsPerRow !== 0 ? 1 : 0))
          let m = reserved.medium.opt.size * (parseInt(mediumT.length / reserved.medium.opt.telsPerRow) + (mediumT.length % reserved.medium.opt.telsPerRow !== 0 ? 1 : 0))
          let s = reserved.small.opt.size * (parseInt(smallT.length / reserved.small.opt.telsPerRow) + (smallT.length % reserved.small.opt.telsPerRow !== 0 ? 1 : 0))

          let max = Math.max(Math.max(l, m), s)
          let ratio = max
          reserved.large.opt.ratio = reserved.large.opt.size / ratio
          reserved.medium.opt.ratio = reserved.medium.opt.size / ratio
          reserved.small.opt.ratio = reserved.small.opt.size / ratio
          drawTels(largeT, reserved.large.g, reserved.large.box, reserved.large.opt)
          drawTels(mediumT, reserved.medium.g, reserved.medium.box, reserved.medium.opt)
          drawTels(smallT, reserved.small.g, reserved.small.box, reserved.small.opt)
        }
        computeSizeRows()

        g.append('text')
          .text('Telescopes:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.0) + ',' + (dim.h * 0.1 + txtSize * 0.3) + ')')
        g.append('line')
          .attr('x1', dim.w * 0.0)
          .attr('y1', (dim.h * 0.1 + txtSize * 0.5))
          .attr('x2', dim.w * 1.0)
          .attr('y2', (dim.h * 0.1 + txtSize * 0.5))
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        g.append('text')
          .text('Large')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.2) + ')')
        g.append('text')
          .text(largeT.length)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.2 + txtSize * 1.4) + ')')

        g.append('text')
          .text('Medium')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.28) + ',' + (dim.h * 0.2) + ')')
        g.append('text')
          .text(mediumT.length)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.28) + ',' + (dim.h * 0.2 + txtSize * 1.4) + ')')

        g.append('text')
          .text('Small')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.73) + ',' + (dim.h * 0.2) + ')')
        g.append('text')
          .text(smallT.length)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.73) + ',' + (dim.h * 0.2 + txtSize * 1.4) + ')')
      }

      // createSchedulingObservingBlocksTree()
      // createStatusInformation()
      createTimeInformation()
      createPointingInformation()
      // createTelescopeInformation()
    }
    function focusOnSchedBlock (bId) {
      clean()
      createSchedBlocksInfoPanel(bId)
    }
    this.focusOnSchedBlock = focusOnSchedBlock

    function createBlocksInfoPanel (idBlock) {
      let data = getBlockById(getBlocksData(), idBlock).data
      let schedB = getSchedBlocksData()[data.sbId]
      let innerbox = {
        x: box.rightInfo.w * 0.0,
        y: box.rightInfo.h * 0.0,
        w: box.rightInfo.w * 1.0,
        h: box.rightInfo.h * 1.0,
        margH: box.rightInfo.h * 0.05
      }

      function createSchedulingObservingBlocksTree () {
        let txtSize = 10
        let dim = {
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.12
        }
        let color = shared.style.blockCol(data)
        let offset = (dim.w * 0.75) / schedB.blocks.length
        let width = Math.min(offset, dim.w * 0.1)

        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (innerbox.w * 0) + ',' + (innerbox.h * 0) + ')')
        g.append('rect')
          .attr('x', dim.w * 0.05)
          .attr('y', dim.h * 0.1)
          .attr('width', dim.w * 0.15)
          .attr('height', dim.h * 0.8)
          .attr('fill', color.background)
          .attr('stroke', color.stroke)
          .attr('stroke-width', 2)
        g.append('text')
          .text(data.metaData.blockName)
          .style('fill', color.text)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.125) + ',' + (dim.h * 0.5 + txtSize * 0.3) + ')')

        // g.append('text')
        //   .text('sched. block:')
        //   .style('fill', color.text)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize * 1.2)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (dim.w * 0.25) + ',' + (dim.h * 0.25 + txtSize * 0.3) + ')')
        g.append('rect')
          .attr('x', dim.w * 0.25)
          .attr('y', dim.h * 0.1)
          .attr('width', ((schedB.blocks.length - 1) * width) + width * 0.9)
          .attr('height', dim.h * 0.3)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', color.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('S' + data.metaData.nSched)
          .style('fill', color.text)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.25 + (((schedB.blocks.length - 1) * width) + width * 0.9) * 0.5) + ',' + (dim.h * 0.25 + txtSize * 0.3) + ')')

        // g.append('text')
        //   .text('obs. blocks:')
        //   .style('fill', color.text)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize * 1.2)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (dim.w * 0.25) + ',' + (dim.h * 0.75 + txtSize * 0.3) + ')')
        for (let i = 0; i < schedB.blocks.length; i++) {
          color = shared.style.blockCol(schedB.blocks[i])
          g.append('rect')
            .attr('x', (dim.w * 0.25) + (width * i))
            .attr('y', dim.h * 0.6)
            .attr('width', width * 0.9)
            .attr('height', dim.h * 0.3)
            .attr('fill', data.obId === schedB.blocks[i].obId ? colorTheme.darker.background : color.background)
            .attr('stroke', color.stroke)
            .attr('stroke-width', data.obId === schedB.blocks[i].obId ? 2 : 0.2)
          g.append('text')
            .text(schedB.blocks[i].metaData.nObs)
            .style('fill', color.text)
            .style('font-weight', '')
            .style('font-size', txtSize)
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + ((dim.w * 0.25) + (width * i) + (width * 0.45)) + ',' + (dim.h * 0.75 + txtSize * 0.3) + ')')
        }
      }
      function createStatusInformation () {
        let txtSize = 8.5
        let dim = {
          x: 0,
          y: innerbox.h * 0.15,
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.05
        }
        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (dim.x) + ',' + (dim.y) + ')')
        g.append('text')
          .text('Details:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.0) + ',' + (dim.h * 0.1 + txtSize * 0.3) + ')')
        g.append('line')
          .attr('x1', dim.w * 0.0)
          .attr('y1', (dim.h * 0.1 + txtSize * 0.5))
          .attr('x2', dim.w * 1.0)
          .attr('y2', (dim.h * 0.1 + txtSize * 0.5))
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('Scheduling block ID:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-style', 'italic')
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.8 + txtSize * 0.3) + ')')
        g.append('text')
          .text(data.sbId)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + (dim.h * 0.8 + txtSize * 0.3) + ')')

        g.append('text')
          .text('Observing block ID:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-style', 'italic')
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.8 + txtSize * 1.6) + ')')
        g.append('text')
          .text(data.obId)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + (dim.h * 0.8 + txtSize * 1.6) + ')')
      }
      function createTimeInformation () {
        let txtSize = 8.5
        let dim = {
          x: 0,
          y: innerbox.h * 0.25,
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.15
        }
        let color = shared.style.blockCol(data)

        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (dim.x) + ',' + (dim.y) + ')')
        g.append('text')
          .text('Schedule:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.0) + ',' + (dim.h * 0.05 + txtSize * 0.3) + ')')
        g.append('line')
          .attr('x1', dim.w * 0.0)
          .attr('y1', (dim.h * 0.05 + txtSize * 0.5))
          .attr('x2', dim.w * 1.0)
          .attr('y2', (dim.h * 0.05 + txtSize * 0.5))
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        let startTime = new Date(shared.data.server.timeOfNight.date_start)
        startTime.setSeconds(startTime.getSeconds() + data.startTime)
        let duration = Math.floor(data.duration / 3600) + ':' + Math.floor((data.duration % 3600) / 60) + ':' + (data.duration % 60) + ''
        let endTime = new Date(shared.data.server.timeOfNight.date_start)
        endTime.setSeconds(endTime.getSeconds() + data.startTime + data.duration)

        g.append('text')
          .text(d3.timeFormat('%A %d')(startTime))
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.4) + ')')
        g.append('text')
          .text(d3.timeFormat('%B %Y')(startTime))
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.4 + txtSize * 1.5) + ')')
        g.append('text')
          .text('GMT' + d3.timeFormat('%Z')(startTime))
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.4 + txtSize * 3) + ')')

        g.append('rect')
          .attr('x', dim.w * 0.45)
          .attr('y', dim.h * 0.59)
          .attr('width', dim.w * 0.4)
          .attr('height', dim.h * 0.01)
          .attr('fill', color.background)
          .attr('stroke', color.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text(data.startTime + ' s')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.43) + ',' + (dim.h * 0.48) + ')')
        g.append('text')
          .text(d3.timeFormat('%H:%M:%S')(startTime))
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.43) + ',' + (dim.h * 0.7 + txtSize) + ')')

        g.append('text')
          .text(data.duration + ' s')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.65) + ',' + (dim.h * 0.48) + ')')
        g.append('text')
          .text(duration)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.65) + ',' + (dim.h * 0.7 + txtSize) + ')')

        g.append('text')
          .text(data.endTime + ' s')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.87) + ',' + (dim.h * 0.48) + ')')
        g.append('text')
          .text(d3.timeFormat('%H:%M:%S')(endTime))
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.87) + ',' + (dim.h * 0.7 + txtSize) + ')')
      }
      function createPointingInformation () {
        let txtSize = 8.5
        let dim = {
          x: 0,
          y: innerbox.h * 0.4,
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.25
        }
        let target = getTargetById(data.targetId)

        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (dim.x) + ',' + (dim.y) + ')')
        g.append('text')
          .text('Pointing:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.0) + ',' + (dim.h * 0.1 + txtSize * 0.3) + ')')
        g.append('line')
          .attr('x1', dim.w * 0.0)
          .attr('y1', (dim.h * 0.1 + txtSize * 0.5))
          .attr('x2', dim.w * 1.0)
          .attr('y2', (dim.h * 0.1 + txtSize * 0.5))
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        g.append('rect')
          .attr('x', dim.w * 0.0)
          .attr('y', dim.h * 0.2)
          .attr('width', dim.h * 0.8)
          .attr('height', dim.h * 0.8)
          .attr('fill', colorTheme.bright.background)
          .attr('stroke', colorTheme.bright.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('+')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize * 1.4)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.h * 0.4) + ',' + (dim.h * 0.6 + txtSize * 0.3) + ')')
        g.append('text')
          .text('trg')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.h * 0.4) + ',' + ((data.pointingPos[1] < target.pos[1] ? txtSize * 1.3 : -txtSize * 1.3) + dim.h * 0.6) + ')')

        let offX = (data.pointingPos[0] - target.pos[0]) * 4
        let offY = (data.pointingPos[1] - target.pos[1]) * 4
        g.append('text')
          .text('+')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize * 1.4)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.h * 0.4 + offX) + ',' + (dim.h * 0.6 + offY + txtSize * 0.3) + ')')
        g.append('text')
          .text('ptg')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.h * 0.4 + offX) + ',' + ((data.pointingPos[1] < target.pos[1] ? -txtSize * 1.3 : txtSize * 1.3) + dim.h * 0.6 + offY) + ')')

        g.append('text')
          .text('Target name:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-style', 'italic')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + dim.h * 0.3 + ')')
        g.append('text')
          .text(data.targetName)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize * 1.0)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.52) + ',' + dim.h * 0.3 + ')')

        g.append('text')
          .text('id:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-style', 'italic')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + (dim.h * 0.3 + txtSize * 1.3) + ')')
        g.append('text')
          .text(data.targetId)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize * 1.0)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.4) + ',' + (dim.h * 0.3 + txtSize * 1.3) + ')')

        g.append('text')
          .text('Pointing name:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-style', 'italic')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + dim.h * 0.55 + ')')
        g.append('text')
          .text(data.pointingName)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize * 1.0)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.54) + ',' + dim.h * 0.55 + ')')

        g.append('text')
          .text('id:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-style', 'italic')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.35) + ',' + (dim.h * 0.55 + txtSize * 1.3) + ')')
        g.append('text')
          .text(data.pointingId)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize * 1.0)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.4) + ',' + (dim.h * 0.55 + txtSize * 1.3) + ')')

        g.append('text')
          .text('target:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-style', 'italic')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + dim.h * 0.8 + ')')
        g.append('text')
          .text(target.pos[0])
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + dim.h * 0.9 + ')')
        g.append('text')
          .text(target.pos[1])
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + (dim.h * 0.9 + txtSize * 1.3) + ')')


        g.append('text')
          .text('pointing:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-style', 'italic')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .style('text-decoration', 'underline')
          .attr('transform', 'translate(' + (dim.w * 0.82) + ',' + dim.h * 0.8 + ')')
        g.append('text')
          .text(data.pointingPos[0])
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.82) + ',' + dim.h * 0.9 + ')')
        g.append('text')
          .text(data.pointingPos[1])
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.82) + ',' + (dim.h * 0.9 + txtSize * 1.3) + ')')
      }
      function createTelescopeInformation () {
        let txtSize = 8.5
        let dim = {
          x: 0,
          y: innerbox.h * 0.65,
          w: innerbox.w * 1.0,
          h: innerbox.h * 0.35
        }

        let largeT = []
        let mediumT = []
        let smallT = []

        let g = reserved.g.append('g')
          .attr('transform', 'translate(' + (dim.x) + ',' + (dim.y) + ')')

        function drawTels (tels, g, box, opt) {
          if (tels.length === 0) return
          let nbline = parseInt(tels.length / opt.telsPerRow) + (tels.length % opt.telsPerRow !== 0 ? 1 : 0)
          let size = {
            w: (box.w / opt.telsPerRow) / 2,
            h: Math.min(box.h / nbline / 2, (box.h * 0.15 * opt.size))
          }
          let fontsize = Math.max(Math.min(size.w * 0.4, 26), 10)
          let offset = {
            x: (box.w - (opt.telsPerRow * size.w * 2)) * 0.5, // (opt.telsPerRow + 1),
            y: (box.h - (nbline * size.h * 2)) * 0.5// (nbline + 1)
          }
          let lastLineOffset = {
            index: parseInt(((nbline - 1) * opt.telsPerRow)) - 1,
            x: (tels.length % opt.telsPerRow !== 0) ? (box.w - ((tels.length % opt.telsPerRow) * size.w * 2)) * 0.5 : offset.x
          }
          g.attr('transform', 'translate(' + (box.x) + ',' + 0 + ')')
          let current = g
            .selectAll('g.tel')
            .data(tels, function (d) {
              return d.id
            })
          let enter = current
            .enter()
            .append('g')
            .attr('class', 'tel')
          enter.each(function (d, i) {
            d3.select(this).attr('transform', function (d) {
              let tx = size.w * 0.5 + (size.w * 2) * (i % opt.telsPerRow) + (i > lastLineOffset.index ? lastLineOffset.x : offset.x)
              let ty = box.y + offset.y + (size.h * 2) * parseInt(i / opt.telsPerRow) + size.h * 0.5
              return 'translate(' + tx + ',' + ty + ')'
            })
            d3.select(this).append('ellipse')
              .attr('cx', size.w * 0.5)
              .attr('cy', size.h * 0.5)
              .attr('rx', size.w)
              .attr('ry', size.h)
              .attr('fill', telHealthCol(d.val))
              .attr('fill-opacity', 1)
              .attr('stroke-width', 0.2)
              .attr('stroke', colorTheme.dark.stroke)
            d3.select(this).append('text')
              .attr('x', size.w * 0.5)
              .attr('y', size.h * 0.5 + fontsize * 0.33)
              .style('font-size', fontsize)
              .text(function (d) {
                return d.split('_')[1]
              })
              .style('fill', colorTheme.blocks.run.text)
              .style('stroke', colorTheme.blocks.run.text)
              .style('font-weight', '')
              .style('stroke-width', 0.2)
              .attr('text-anchor', 'middle')
          })

          let merge = current.merge(enter)
          merge.each(function (d, i) {
            d3.select(this)
              .attr('opacity', 0)
              .transition()
              .duration(timeD.animArc)
              .attr('opacity', 1)
            //   .attr('transform', function (d) {
            //     let tx = size.w * 0.5 + (size.w * 2) * (i % opt.telsPerRow) + (i > lastLineOffset.index ? lastLineOffset.x : offset.x)
            //     let ty = box.y + offset.y + (size.h * 2) * parseInt(i / opt.telsPerRow) + size.h * 0.5
            //     return 'translate(' + tx + ',' + ty + ')'
            //   })
            // d3.select(this).select('ellipse')
            //   .transition()
            //   .duration(timeD.animArc)
            //   .attr('fill', telHealthCol(d.val))
            //   .attr('cx', size.w * 0.5)
            //   .attr('cy', size.h * 0.5)
            //   .attr('rx', size.w)
            //   .attr('ry', size.h)
            // d3.select(this).select('text')
            //   .text(function (d) {
            //     return d.split('_')[1]
            //   })
              // .attr('x', size.w * 0.5)
              // .attr('y', size.h * 0.5 + fontsize * 0.33)
              // .style('font-size', fontsize)
          })

          // current
          //   .exit()
          //   .transition('inOut')
          //   .duration(timeD.animArc)
          //   .style('opacity', 0)
          //   .remove()
        }
        function computeSizeRows () {
          reserved.large = {
            g: g.append('g'),
            opt: {
              telsPerRow: 1,
              nbl: 0,
              size: 1,
              ratio: 1
            },
            box: {
              x: 0,
              y: dim.h * 0.38,
              w: dim.w * 0.1,
              h: dim.h * 0.61
            }
          }
          reserved.medium = {
            g: g.append('g'),
            opt: {
              telsPerRow: 4,
              nbl: 0,
              size: 0.9,
              ratio: 1
            },
            box: {
              x: dim.w * 0.13,
              y: dim.h * 0.38,
              w: dim.w * 0.3,
              h: dim.h * 0.61
            }
          }
          reserved.small = {
            g: g.append('g'),
            opt: {
              telsPerRow: 8,
              nbl: 0,
              size: 0.75,
              ratio: 1
            },
            box: {
              x: dim.w * 0.46,
              y: dim.h * 0.38,
              w: dim.w * 0.54,
              h: dim.h * 0.61
            }
          }

          for (let j = 0; j < data.telIds.length; j++) {
            let t = data.telIds[j]
            if (t[0] === 'L') largeT.push(t)
            if (t[0] === 'M') mediumT.push(t)
            if (t[0] === 'S') smallT.push(t)
          }
          largeT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
          mediumT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
          smallT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })

          let l = reserved.large.opt.size * (parseInt(largeT.length / reserved.large.opt.telsPerRow) + (largeT.length % reserved.large.opt.telsPerRow !== 0 ? 1 : 0))
          let m = reserved.medium.opt.size * (parseInt(mediumT.length / reserved.medium.opt.telsPerRow) + (mediumT.length % reserved.medium.opt.telsPerRow !== 0 ? 1 : 0))
          let s = reserved.small.opt.size * (parseInt(smallT.length / reserved.small.opt.telsPerRow) + (smallT.length % reserved.small.opt.telsPerRow !== 0 ? 1 : 0))

          let max = Math.max(Math.max(l, m), s)
          let ratio = max
          reserved.large.opt.ratio = reserved.large.opt.size / ratio
          reserved.medium.opt.ratio = reserved.medium.opt.size / ratio
          reserved.small.opt.ratio = reserved.small.opt.size / ratio
          drawTels(largeT, reserved.large.g, reserved.large.box, reserved.large.opt)
          drawTels(mediumT, reserved.medium.g, reserved.medium.box, reserved.medium.opt)
          drawTels(smallT, reserved.small.g, reserved.small.box, reserved.small.opt)
        }
        computeSizeRows()

        g.append('text')
          .text('Telescopes:')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'start')
          .attr('transform', 'translate(' + (dim.w * 0.0) + ',' + (dim.h * 0.1 + txtSize * 0.3) + ')')
        g.append('line')
          .attr('x1', dim.w * 0.0)
          .attr('y1', (dim.h * 0.1 + txtSize * 0.5))
          .attr('x2', dim.w * 1.0)
          .attr('y2', (dim.h * 0.1 + txtSize * 0.5))
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        g.append('text')
          .text('Large')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.2) + ')')
        g.append('text')
          .text(largeT.length)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.05) + ',' + (dim.h * 0.2 + txtSize * 1.4) + ')')

        g.append('text')
          .text('Medium')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.28) + ',' + (dim.h * 0.2) + ')')
        g.append('text')
          .text(mediumT.length)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.28) + ',' + (dim.h * 0.2 + txtSize * 1.4) + ')')

        g.append('text')
          .text('Small')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.73) + ',' + (dim.h * 0.2) + ')')
        g.append('text')
          .text(smallT.length)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize)
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dim.w * 0.73) + ',' + (dim.h * 0.2 + txtSize * 1.4) + ')')
      }

      createSchedulingObservingBlocksTree()
      createStatusInformation()
      createTimeInformation()
      createPointingInformation()
      createTelescopeInformation()
    }
    function focusOnBlock (bId) {
      clean()
      createBlocksInfoPanel(bId)
    }
    this.focusOnBlock = focusOnBlock

    function clean () {
      reserved.g.selectAll('*').remove()
    }
    this.clean = clean
  }

  let SvgSchedAndBlockCreator = function () {
    let reserved = {}
    // let reserved = {
    //   topButton: {
    //     box: {x: 0, y: 0, w: 1, h: 0.1}
    //   },
    //   schedBlockInfo: {
    //     box: {x: 0, y: 0.1, w: 1, h: 0.4}
    //   },
    //   blockButton: {
    //     box: {x: 0, y: 0.5, w: 0.2, h: 0.5}
    //   },
    //   blockInfo: {
    //     box: {x: 0.2, y: 0.5, w: 0.8, h: 0.5}
    //   }
    // }
    function updateData () {
      reserved.overlay.selectAll('g.form').remove()
      drawSchedBlocksInfoPanel(createSBPropertiesList(reserved.newSchedB))
      drawBlocksIcons(reserved.newBlocks)
      drawBlocksInfoPanel(createBPropertiesList(reserved.newBlocks[reserved.blockOnFocus]))
    }
    function closeCreator () {
      reserved.overlay.remove()
      reserved = {}
      shared.data.copy[shared.data.current].creation.blocks.wait = []
      updateAllBlocksQueue()
    }
    function saveCreator () {
      function canSave () {
        for (let i = 0; i < shared.data.copy[shared.data.current].creation.blocks.wait.length; i++) {
          let b = shared.data.copy[shared.data.current].creation.blocks.wait[i]
          if (!b.targetId) return false
          if (!b.targetName) return false
          if (!b.targetPos) return false
          if (!b.pointingId) return false
          if (!b.pointingName) return false
          if (!b.pointingPos) return false
        }
        return true
      }

      if (!canSave()) return
      for (let i = 0; i < shared.data.copy[shared.data.current].creation.blocks.wait.length; i++) {
        let b = shared.data.copy[shared.data.current].creation.blocks.wait[i]
        b.modifications = {
          created: true,
          modified: false,
          userModifications: {},
          optimizerModifications: {}
        }
        shared.data.copy[shared.data.current].modified.blocks.wait.push(b)
      }
      optimizer()
      closeCreator()
      svgMiddleInfo.update()
    }

    function drawButton () {
      let validate = reserved.overlay.append('g').attr('class', 'validate')
      validate.append('rect')
        .attr('class', 'validate')
        .attr('x', box.rightPanel.w * 0.03)
        .attr('y', box.rightPanel.h * 0.03)
        .attr('width', box.rightPanel.w * 0.05)
        .attr('height', box.rightPanel.w * 0.05)
        .attr('stroke', 'none')
        .attr('fill', colorTheme.darker.background)
        .attr('fill-opacity', 0)
        .on('mouseover', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('fill-opacity', 1)
        })
        .on('mouseout', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('fill-opacity', 0)
        })
        .on('click', function () {
          saveCreator()
        })
      validate.append('line')
        .attr('x1', box.rightPanel.w * 0.03 + box.rightPanel.w * 0.01)
        .attr('y1', box.rightPanel.h * 0.03 + box.rightPanel.w * 0.02)
        .attr('x2', box.rightPanel.w * 0.03 + box.rightPanel.w * 0.025)
        .attr('y2', box.rightPanel.h * 0.03 + box.rightPanel.w * 0.04)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke-width', 2)
        .style('pointer-events', 'none')
      validate.append('line')
        .attr('x1', box.rightPanel.w * 0.03 + box.rightPanel.w * 0.04)
        .attr('y1', box.rightPanel.h * 0.03 + box.rightPanel.w * 0.01)
        .attr('x2', box.rightPanel.w * 0.03 + box.rightPanel.w * 0.025)
        .attr('y2', box.rightPanel.h * 0.03 + box.rightPanel.w * 0.04)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke-width', 2)
        .style('pointer-events', 'none')
      let close = reserved.overlay.append('g').attr('class', 'close')
      close.append('rect')
        .attr('class', 'close')
        .attr('x', box.rightPanel.w * 0.9)
        .attr('y', box.rightPanel.h * 0.03)
        .attr('width', box.rightPanel.w * 0.05)
        .attr('height', box.rightPanel.w * 0.05)
        .attr('stroke', 'none')
        .attr('fill', colorTheme.darker.background)
        .attr('fill-opacity', 0)
        .on('mouseover', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('fill-opacity', 1)
        })
        .on('mouseout', function () {
          d3.select(this).transition().duration(timeD.animArc).attr('fill-opacity', 0)
        })
        .on('click', function () {
          closeCreator()
        })
      close.append('line')
        .attr('x1', box.rightPanel.w * 0.9 + box.rightPanel.w * 0.01)
        .attr('y1', box.rightPanel.h * 0.03 + box.rightPanel.w * 0.01)
        .attr('x2', box.rightPanel.w * 0.9 + box.rightPanel.w * 0.04)
        .attr('y2', box.rightPanel.h * 0.03 + box.rightPanel.w * 0.04)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 2)
        .attr('fill', colorTheme.dark.background)
        .style('pointer-events', 'none')
      close.append('line')
        .attr('x1', box.rightPanel.w * 0.9 + box.rightPanel.w * 0.04)
        .attr('y1', box.rightPanel.h * 0.03 + box.rightPanel.w * 0.01)
        .attr('x2', box.rightPanel.w * 0.9 + box.rightPanel.w * 0.01)
        .attr('y2', box.rightPanel.h * 0.03 + box.rightPanel.w * 0.04)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 2)
        .attr('fill', colorTheme.dark.background)
        .style('pointer-events', 'none')
    }
    function drawBlocksIcons (blocks) {
      let dim = {
        x: box.rightPanel.w * 0.01,
        y: box.rightPanel.h * 0.41,
        w: box.rightPanel.w * 0.09,
        h: box.rightPanel.h * 0.53,
        margH: box.rightPanel.h * 0.05
      }
      let dimBlocks = {h: dim.w * 0.6, w: dim.w * 0.8}
      let length = blocks.length
      let step = dim.h - (length * dimBlocks.h)
      if (step > 10) step = 10

      function drawBlocks () {
        function computeTransY (i) {
          return dim.y + dimBlocks.h + (dim.h * 0.5) - ((length * dimBlocks.h) + (step * (length - 1))) * 0.5 + (dimBlocks.h * i) + (step * i)
        }
        let subBlocks = reserved.overlay
          .selectAll('g.subBlocks')
          .data(blocks, function (d) {
            return d.metaData.blockName
          })
        let enterSubBlocks = subBlocks
          .enter()
          .append('g')
          .attr('class', 'subBlocks')
          .attr('transform', function (d, i) {
            let transX = (dim.w - dimBlocks.w)
            let transY = computeTransY(i)
            return 'translate(' + transX + ',' + transY + ')'
          })
        enterSubBlocks.append('rect')
          .attr('class', 'back')
          .attr('y', function (d, i) {
            return 0
          })
          .attr('x', function (d, i) {
            return (dim.w - dimBlocks.w) * 0.5
          })
          .attr('width', function (d, i) {
            return dimBlocks.w
          })
          .attr('height', function (d, i) {
            return dimBlocks.h
          })
          .attr('fill', function (d, i) {
            return setCol(d).background
          })
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', function (d) {
            return (reserved.blockOnFocus === Number(d.metaData.nObs)) ? 2.5 : 0.2
          })
          .attr('stroke-dasharray', [])
          .on('mouseover', function (d) {
            d3.select(this).attr('stroke-width', function (d) {
              return (reserved.blockOnFocus === Number(d.metaData.nObs)) ? 2.5 : 1
            })
          })
          .on('mouseout', function (d) {
            d3.select(this).attr('stroke-width', function (d) {
              return (reserved.blockOnFocus === Number(d.metaData.nObs)) ? 2.5 : 0.2
            })
          })
          .on('click', function (d) {
            focusOnBlock(Number(d.metaData.nObs))
            updateData()
          })
        enterSubBlocks.append('text')
          .text(function (d) {
            return 'B-' + d.metaData.nObs
          })
          .attr('x', dim.w * 0.5)
          .attr('y', dimBlocks.h * 0.7)
          .style('font-weight', 'normal')
          .attr('text-anchor', 'middle')
          .style('font-size', 9.5)
          .attr('dy', 0)
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.darker.text)
          .attr('stroke', 'none')
        enterSubBlocks.each(function (d) {
          for (let i = 0; i < shared.data.copy[shared.data.current].creation.blocks.wait.length; i++) {
            if (shared.data.copy[shared.data.current].creation.blocks.wait[i].obId === d.obId) {
              d3.select(this).append('circle')
                .attr('class', 'delete')
                .attr('cy', function (d, i) {
                  return 0
                })
                .attr('cx', function (d, i) {
                  return dimBlocks.w * 1.1
                })
                .attr('r', function (d, i) {
                  return dimBlocks.w * 0.2
                })
                .attr('fill', function (d, i) {
                  return colorTheme.darker.background
                })
                .attr('stroke', colorTheme.dark.stroke)
                .attr('stroke-width', function (d) {
                  return 0.2
                })
                .on('mouseover', function (d) {
                  d3.select(this).attr('stroke-width', function (d) {
                    return 1
                  })
                })
                .on('mouseout', function (d) {
                  d3.select(this).attr('stroke-width', function (d) {
                    return 0.2
                  })
                })
                .on('click', function (d) {
                  deleteBlock(d)
                })
            }
          }
        })

        let mergeSubBlock = enterSubBlocks.merge(subBlocks)
        mergeSubBlock.transition()
          .duration(timeD.animArc)
          .attr('transform', function (d, i) {
            let transX = (dim.w - dimBlocks.w)
            let transY = computeTransY(i)
            return 'translate(' + transX + ',' + transY + ')'
          })
        mergeSubBlock.each(function (d) {
          d3.select(this).select('rect.back')
            .attr('stroke-width', function (d) {
              return (reserved.blockOnFocus === Number(d.metaData.nObs)) ? 2.5 : 0.2
            })
            .transition()
            .duration(800)
            .attr('fill', function () {
              return shared.style.blockCol(d).background
            })
          d3.select(this).select('text')
            .transition()
            .duration(800)
            .text(function (d) {
              return 'B-' + d.metaData.nObs
            })
        })

        subBlocks.exit()
          .transition()
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()
      }
      function drawAddNewBlock () {
        let subBlocks = reserved.overlay
          .selectAll('g.addNewBlock')
          .data([{}])
        let enterSubBlocks = subBlocks
          .enter()
          .append('g')
          .attr('class', 'addNewBlock')
          .attr('transform', function () {
            let transX = (dim.w - dimBlocks.w)
            let transY = dim.y + dimBlocks.h
            return 'translate(' + transX + ',' + transY + ')'
          })
        enterSubBlocks.append('rect')
          .attr('class', 'back')
          .attr('y', function (d, i) {
            return 0
          })
          .attr('x', function (d, i) {
            return (dim.w - dimBlocks.w) * 0.5
          })
          .attr('width', function (d, i) {
            return dimBlocks.w
          })
          .attr('height', function (d, i) {
            return dimBlocks.h
          })
          .attr('fill', function (d, i) {
            return colorTheme.blocks.wait.background
          })
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
          .attr('stroke-dasharray', [])
          .on('mouseover', function (d) {
            d3.select(this).attr('stroke-width', function (d) {
              return 1
            })
          })
          .on('mouseout', function (d) {
            d3.select(this).attr('stroke-width', function (d) {
              return 0.2
            })
          })
          .on('click', function (d) {
            d3.select(this).attr('stroke-width', 2.5)
            reserved.newBlocks.push(createEmptyBlock(reserved.newBlocks[0].metaData.nSched))
            focusOnBlock(reserved.newBlocks.length - 1)
            updateData()
          })
        enterSubBlocks.append('text')
          .text(function (d) {
            return 'New'
          })
          .attr('x', dim.w * 0.5)
          .attr('y', dimBlocks.h * 0.7)
          .style('font-weight', 'normal')
          .attr('text-anchor', 'middle')
          .style('font-size', 9.5)
          .attr('dy', 0)
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.darker.text)
          .attr('stroke', 'none')

        let mergeSubBlock = enterSubBlocks.merge(subBlocks)
        mergeSubBlock.each(function (d) {
          d3.select(this).select('rect.back')
            .transition()
            .duration(800)
            .attr('fill', colorTheme.blocks.wait.background)
            .attr('stroke-width', 0.2)
        })
      }
      drawBlocks()
      drawAddNewBlock()
    }

    function updateSchedBlockTarget (value) {
      let target = getTargetById(value)
      reserved.newSchedB.target = {
        id: !target ? undefined : target.id,
        name: !target ? undefined : target.name,
        pos: !target ? undefined : target.pos,
        observability: !target ? undefined : target.observability
      }
      for (let i = 0; i < reserved.newBlocks.length; i++) {
        updateBlockTarget(reserved.newBlocks[i], target)
      }
      updateData()
    }
    function createSBPropertiesList (sb) {
      let exeState = {
        key: 'Execution State',
        format: 'plainText',
        style: {'default': 'subTitle'},
        childs: []
      }
      exeState.childs.push({
        style: {'default': 'info'},
        format: 'comboList',
        key: 'State',
        value: {
          current: sb.exeState.state,
          select: ['wait', 'cancel', 'run']
        },
        event: {
          click: () => {},
          mouseover: () => {},
          mouseout: () => {}
        },
        childs: [],
        editable: false
      })
      exeState.childs.push({
        style: {'default': 'info'},
        format: 'comboList',
        key: 'canRun',
        value: {
          current: sb.exeState.canRun,
          select: ['true', 'false']
        },
        event: {
          click: () => {},
          mouseover: () => {},
          mouseout: () => {}
        },
        childs: [],
        editable: false
      })

      let target = {
        key: 'Target',
        format: 'plainText',
        style: {'default': 'subTitle'},
        childs: []
      }
      let targetIds = ['Undefined']
      for (let i = 0; i < shared.data.server.targets.length; i++) { targetIds.push(shared.data.server.targets[i].id) }
      target.childs.push({
        style: {
          'default': 'info',
          'color': sb.target.id ? colorTheme.brighter.background : '#FFCCBC'
        },
        format: 'comboList',
        key: 'id',
        value: {
          current: sb.target.id,
          select: targetIds
        },
        event: {
          click: updateSchedBlockTarget,
          mouseover: () => {},
          mouseout: () => {}
        },
        childs: [],
        editable: true
      })
      target.childs.push({
        style: {
          'default': 'info',
          'color': sb.target.name ? colorTheme.brighter.background : '#FFCCBC'
        },
        format: 'info',
        key: 'Name',
        value: sb.target.name,
        childs: [],
        editable: false
      })
      target.childs.push({
        style: {
          'default': 'info',
          'color': sb.target.pos ? colorTheme.brighter.background : '#FFCCBC'
        },
        format: 'info',
        key: 'pos',
        value: sb.target.pos,
        childs: [],
        editable: false
      })
      target.childs.push({
        style: {
          'default': 'info',
          'color': sb.target.observability ? colorTheme.brighter.background : '#FFCCBC'
        },
        format: 'info',
        key: 'observability',
        value: sb.target.observability,
        childs: [],
        editable: false
      })

      let root = {title: {}, style: {}, childs: [exeState, target]}
      return root
    }
    function drawSchedBlocksInfoPanel (sbPropList) {
      let dim = {
        x: box.rightPanel.w * 0.01,
        y: 20,
        w: box.rightPanel.w * 0.96,
        h: box.rightPanel.h * 0.35,
        margH: box.rightPanel.h * 0.05
      }
      let schedulingBlocksInfoPanelG = reserved.overlay.append('g')
        .attr('class', 'form')
      let scrollForm = new ScrollForm({
        main: {
          tag: 'schedBlockScrollForm',
          g: schedulingBlocksInfoPanelG,
          box: {x: dim.x, y: dim.y, w: dim.w, h: dim.h},
          colorTheme: colorTheme
        },
        titles: {
          data: [
            {
              title: 'Sched.Blocks: ' + reserved.newSchedB.schId,
              extension: '',
              sortOptions: {

              },
              width: '100%',
              quickScroll: true,
              anchor: 'center'
            }
          ],
          height: '20px'
        },
        quickScroll: {
          enabled: false,
          width: '3%'
        },
        data: {}
      })
      scrollForm.updateData(sbPropList, 'info')
    }

    function updateBlockTarget (block, target) {
      block.targetId = !target ? '' : reserved.newSchedB.target.id
      block.targetName = !target ? '' : reserved.newSchedB.target.name
      block.targetPos = !target ? '' : reserved.newSchedB.target.pos

      block.pointingId = !target ? '' : target.id
      block.pointingName = !target ? '' : target.id + '/p_' + block.metaData.nObs
      block.pointingPos = !target ? '' : target.pos
    }
    function changeBlockStartTime (value, block) {
      let b = reserved.newBlocks[reserved.blockOnFocus]
      if (block) {
        for (let i = 0; i < reserved.newBlocks.length; i++) {
          if (reserved.newBlocks[i].obId === block.id) {
            b = reserved.newBlocks[i]
            break
          }
        }
      }
      b.startTime = Number(value)
      b.endTime = Number(b.startTime) + Number(b.duration)
      if (!block) drawBlocksInfoPanel(createBPropertiesList(reserved.newBlocks[reserved.blockOnFocus]))
      updateAllBlocksQueue()
    }
    this.changeBlockStartTime = changeBlockStartTime
    function changeBlockDuration (value) {
      let b = reserved.newBlocks[reserved.blockOnFocus]
      b.duration = Number(value)
      b.endTime = Number(b.startTime) + Number(b.duration)
      drawBlocksInfoPanel(createBPropertiesList(reserved.newBlocks[reserved.blockOnFocus]))
      updateAllBlocksQueue()
    }
    function createBPropertiesList (b) {
      let startTime = new Date(shared.data.server.timeOfNight.date_start)
      startTime.setSeconds(startTime.getSeconds() + b.startTime)
      let startHS = {
        style: {'default': 'info'},
        format: 'info',
        key: '',
        value: d3.timeFormat('%H:%M:%S,&nbsp &nbsp %m/%d/%y')(startTime),
        event: {},
        childs: []
      }
      let duration = Math.floor(b.duration / 3600) + 'h ' + Math.floor((b.duration % 3600) / 60) + 'm ' + (b.duration % 60) + 's'
      let durHS = {
        style: {'default': 'info'},
        format: 'info',
        key: '',
        value: duration,
        event: {},
        childs: []
      }
      startTime.setSeconds(startTime.getSeconds() + b.duration)
      let endHS = {
        style: {'default': 'info'},
        format: 'info',
        key: '',
        value: d3.timeFormat('%H:%M:%S,&nbsp &nbsp %m/%d/%y')(startTime),
        event: {},
        childs: []
      }

      let startS = {
        style: {'default': 'info'},
        format: 'input_number',
        key: 'Start',
        value: b.startTime,
        range: [0, 28800],
        event: {change: changeBlockStartTime},
        childs: []
      }
      let durS = {
        style: {'default': 'info'},
        format: 'input_number',
        key: 'Duration',
        value: b.duration,
        range: [0, 28800],
        event: {change: changeBlockDuration},
        childs: []
      }
      let endS = {
        style: {'default': 'info'},
        format: 'info',
        key: 'End',
        value: b.endTime,
        event: {},
        childs: []
      }

      let st = {key: 'rootStart', format: 'none', childs: [[[startS], [startHS]]]}
      let du = {key: 'rootDurat', format: 'none', childs: [[[durS], [durHS]]]}
      let en = {key: 'rootEnd', format: 'none', childs: [[[endS], [endHS]]]}
      let time = {
        key: 'Time',
        format: 'plainText',
        style: {'default': 'subTitle'},
        childs: [st, du, en]
        // childs: [[[startS, durS, endS], [startHS, durHS, endHS]]]
      }

      let exeState = {
        key: 'Execution State',
        format: 'plainText',
        style: {'default': 'subTitle'},
        childs: []
      }
      exeState.childs.push({
        style: {'default': 'info'},
        format: 'comboList',
        key: 'State',
        value: {
          current: b.exeState.state,
          select: ['wait', 'cancel', 'run']
        },
        event: {
          click: () => {},
          mouseover: () => {},
          mouseout: () => {}
        },
        childs: []
      })
      exeState.childs.push({
        style: {'default': 'info'},
        format: 'comboList',
        key: 'canRun',
        value: {
          current: b.exeState.canRun,
          select: ['true', 'false']
        },
        event: {
          click: () => {},
          mouseover: () => {},
          mouseout: () => {}
        },
        childs: []
      })

      let pointing = {
        key: 'Pointing',
        format: 'plainText',
        style: {'default': 'subTitle'},
        childs: []
      }
      pointing.childs.push({
        style: {
          'default': 'info',
          'color': b.pointingId ? colorTheme.brighter.background : '#FFCCBC'
        },
        format: 'info',
        key: 'Id',
        value: b.pointingId,
        event: {},
        childs: []
      })
      pointing.childs.push({
        style: {
          'default': 'info',
          'color': b.pointingName ? colorTheme.brighter.background : '#FFCCBC'
        },
        format: 'info',
        key: 'Name',
        value: b.pointingName,
        childs: []
      })
      pointing.childs.push({
        style: {
          'default': 'info',
          'color': b.pointingPos ? colorTheme.brighter.background : '#FFCCBC'
        },
        format: 'info',
        key: 'Position',
        value: b.pointingPos,
        childs: []
      })

      let telescopes = {
        key: 'Telescopes',
        format: 'plainText',
        style: {'default': 'subTitle'},
        childs: []
      }
      telescopes.childs.push({
        style: {'default': 'info'},
        format: 'list',
        key: '',
        value: b.telIds,
        event: {},
        childs: []
      })

      let root = {title: {}, style: {}, childs: [exeState, time, pointing, telescopes]}
      return root
    }
    function drawBlocksInfoPanel (bPropList) {
      let dim = {
        x: box.rightPanel.w * 0.11,
        y: box.rightPanel.h * 0.40,
        w: box.rightPanel.w * 0.85,
        h: box.rightPanel.h * 0.55,
        margH: box.rightPanel.h * 0.05
      }
      let schedulingBlocksInfoPanelG = reserved.overlay.append('g')
        .attr('class', 'form')
      let scrollForm = new ScrollForm({
        main: {
          tag: 'blockScrollForm',
          g: schedulingBlocksInfoPanelG,
          box: {x: dim.x, y: dim.y, w: dim.w, h: dim.h},
          colorTheme: colorTheme
        },
        titles: {
          data: [
            {
              title: 'Block: ' + reserved.newBlocks[reserved.blockOnFocus].obId,
              extension: '',
              sortOptions: {

              },
              width: '100%',
              quickScroll: true,
              anchor: 'center'
            }
          ],
          height: '20px'
        },
        quickScroll: {
          enabled: false,
          width: '3%'
        },
        data: {}
      })
      scrollForm.updateData(bPropList, 'info')
    }

    function createBlockForm () {
      let sb = shared.data.copy[shared.data.current].schedBlocks[shared.focus.schedBlocks]

      reserved.overlay = svg.g.append('g')
        .attr('transform', 'translate(' + box.rightPanel.x + ',' + box.rightPanel.y + ')')
      reserved.overlay.append('rect')
        .attr('x', box.rightPanel.w * 0.489)
        .attr('y', box.rightPanel.h * 0.5)
        .attr('width', box.rightPanel.w * 0.0)
        .attr('height', box.rightPanel.h * 0.0)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('fill', colorTheme.dark.background)
        .attr('fill-opacity', 0)
        .transition()
        .duration(timeD.animArc)
        .attr('x', box.rightPanel.w * 0)
        .attr('y', box.rightPanel.h * 0)
        .attr('width', box.rightPanel.w * 1)
        .attr('height', box.rightPanel.h * 1)
        .attr('stroke-width', 0.4)
        .attr('fill-opacity', 1)

      let schId = sb.blocks[0].metaData.nSched

      reserved.newSchedB = sb
      reserved.newSchedB.schId = schId
      reserved.newBlocks = sb.blocks
      reserved.newBlocks.push(createEmptyBlock(schId))
      focusOnBlock(reserved.newBlocks.length - 1)

      updateData()
      drawButton()
    }
    this.createBlockForm = createBlockForm
    function createSchedForm () {
      reserved.overlay = svg.g.append('g')
        .attr('transform', 'translate(' + box.rightPanel.x + ',' + box.rightPanel.y + ')')
      reserved.overlay.append('rect')
        .attr('x', box.rightPanel.w * 0.489)
        .attr('y', box.rightPanel.h * 0.5)
        .attr('width', box.rightPanel.w * 0.0)
        .attr('height', box.rightPanel.h * 0.0)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('fill', colorTheme.dark.background)
        .attr('fill-opacity', 0)
        .transition()
        .duration(timeD.animArc)
        .attr('x', box.rightPanel.w * 0)
        .attr('y', box.rightPanel.h * 0)
        .attr('width', box.rightPanel.w * 1)
        .attr('height', box.rightPanel.h * 1)
        .attr('stroke-width', 0.4)
        .attr('fill-opacity', 1)

      let schedGroup = groupBlocksBySchedule(shared.data.copy[shared.data.current].optimized.blocks)
      let schId = Number(schedGroup[schedGroup.length - 1].schedName) + 1

      reserved.newSchedB = {
        exeState: {
          state: 'wait',
          canRun: true
        },
        target: {
          id: undefined,
          name: undefined,
          pos: undefined,
          observability: undefined
        },
        blocks: [],
        schId: schId
      }
      reserved.newBlocks = []
      reserved.newBlocks.push(createEmptyBlock(schId))
      focusOnBlock(0)

      updateData()
      drawButton()
    }
    this.createSchedForm = createSchedForm

    function focusOnBlock (index) {
      reserved.blockOnFocus = index
    }
    function createEmptyBlock (schId) {
      let newBlock = JSON.parse(JSON.stringify(blockTemplate))
      newBlock.exeState = {
        state: 'wait',
        canRun: true
      }
      newBlock.metaData = {
        blockName: schId + ' (' + reserved.newBlocks.length + ')',
        nObs: reserved.newBlocks.length,
        nSched: schId
      }
      newBlock.obId = newBlock.metaData.blockName
      newBlock.sbId = 'Sched' + newBlock.metaData.nSched
      newBlock.timeStamp = Date.now()

      newBlock.targetId = ''
      newBlock.targetName = ''
      newBlock.targetPos = ''
      newBlock.pointingId = ''
      newBlock.pointingName = ''
      newBlock.pointingPos = ''
      if (reserved.newSchedB.target.id) {
        let target = getTargetById(reserved.newSchedB.target.id)
        updateBlockTarget(newBlock, target)
      }

      newBlock.runphase = []

      newBlock.startTime = Number(shared.data.server.timeOfNight.now) + (Number(shared.data.server.timeOfNight.end) - Number(shared.data.server.timeOfNight.now)) * 0.5
      newBlock.duration = 1800
      newBlock.endTime = newBlock.startTime + newBlock.duration

      newBlock.telIds = ["S_68", "S_80", "M_20", "S_78", "S_74", "S_67", "S_79", "S_34", "S_46", "M_27", "S_40", "S_65", "S_95", "S_32", "M_11", "S_86", "S_36", "S_81", "S_59", "L_0", "S_96", "S_52", "M_8", "S_97", "S_41", "S_70", "S_42", "S_83", "S_37", "M_7", "S_45", "S_58", "S_39", "S_82", "L_3", "S_73", "M_12", "S_33", "L_1"]

      shared.data.copy[shared.data.current].creation.blocks.wait.push(newBlock)
      updateAllBlocksQueue()
      return newBlock
    }
    function deleteBlock (block) {
      for (let i = shared.data.copy[shared.data.current].creation.blocks.wait.length - 1; i > -1; i--) {
        if (shared.data.copy[shared.data.current].creation.blocks.wait[i].obId === block.obId) {
          shared.data.copy[shared.data.current].creation.blocks.wait.splice(i, 1)
          break
        }
      }
      for (let i = reserved.newBlocks.length - 1; i > -1; i--) {
        if (reserved.newBlocks[i].obId === block.obId) {
          reserved.newBlocks.splice(i, 1)
          // for (let j = i; j < reserved.newBlocks.length; j++) {
          //   reserved.newBlocks[j].metaData.nObs -= 1
          //   reserved.newBlocks[j].metaData.blockName = reserved.newBlocks[j].metaData.nSched + ' (' + reserved.newBlocks[j].metaData.nObs + ')'
          //   reserved.newBlocks[j].obId = reserved.newBlocks[j].metaData.blockName
          // }
          break
        }
      }

      if (reserved.newBlocks.length === 0) {
        reserved.newBlocks.push(createEmptyBlock(reserved.newSchedB.schId))
        focusOnBlock(0)
      } else {
        focusOnBlock(0)
      }

      updateData()
      updateAllBlocksQueue()
    }
  }

  let svgBlocksQueueServer = new SvgBlocksQueueServer()
  let svgBrush = new SvgBrush()
  let svgWarningArea = new SvgWarningArea()
  let svgBlocksQueueOptimized = new SvgBlockQueueOptimized()
  let svgBlocksQueueInsert = new SvgBlocksQueueInsert()
  let svgTargets = new SvgTargets()
  let svgTelsConflict = new SvgTelsConflict()
  let svgFocusOverlay = new SvgFocusOverlay()
  let svgRightInfo = new SvgRightInfo()

  let svgSchedAndBlockCreator = new SvgSchedAndBlockCreator()
}
