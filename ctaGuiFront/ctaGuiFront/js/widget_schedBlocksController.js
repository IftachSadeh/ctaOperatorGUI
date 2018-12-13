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
/* global BlockQueueCreator */
/* global BlockQueueModif */
/* global BlockQueueOptimizer*/
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
/* global colsGreens */
/* global colPrime */
/* global Locker */
/* global FormManager */
/* global appendToDom */
/* global runWhenReady */
/* global deepCopy */
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueue.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueCreator.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueModif.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueOptimizer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_panelManager.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_gridBagLayout.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_clockEvents.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollForm.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_formManager.js' })
window.loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })

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

  let widgetType = optIn.widgetType
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
  // let shared = {
  //   data: {
  //     server: undefined,
  //     copy: {
  //       original: {},
  //       modified: {},
  //       optimized: {}
  //     },
  //     oldCopy: []
  //   },
  //   focus: {
  //     schedBlocks: undefined,
  //     block: undefined
  //   },
  //   formatedData: {
  //     schedGroup: []
  //   }
  // }
  let svg = {}
  let lenD = {}

  let blockQueue = null
  let blockQueueCreator = null
  let blockQueueModif = null
  let blockQueueOptimized = null

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

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })

  function initData (dataIn) {
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

    // reserved.svgZoomNode = svg.svg.nodes()[0]

    svg.g = svg.svg.append('g')
    createBackground()

    shared.data.server = dataIn.data

    // svgBlocksQueue.initData()
    svgBlocksQueueOptimized.initData()
    svgBlocksQueueModif.initData()
    svgBlocksQueueCreator.initData()
    svgWarningArea.initData({
      tag: 'warningArea',
      g: svg.g.append('g'),
      box: {x: lenD.w[0] * 0.02, y: lenD.h[0] * 0.32, w: lenD.w[0] * 0.6, h: lenD.h[0] * 0.05},
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
    svgMiddleInfo.initData({
      tag: 'scheduleModification',
      g: svg.g.append('g'),
      box: {x: lenD.w[0] * 0.63, y: lenD.h[0] * 0.01, w: lenD.w[0] * 0.37, h: lenD.h[0] * 0.98},
      panelManager: undefined,
      panel: {
        current: undefined,
        all: []
      },
      tab: {
        g: undefined,
        box: {x: 0, y: 0, w: 1, h: 0.1},
        child: {}
      },
      content: {
        g: undefined,
        box: {x: 0, y: 0.1, w: 1, h: 0.9},
        child: {}
      },
      data: {
        modificationsFormated: undefined
      },
      debug: {
        enabled: false
      }
    })
  }
  this.initData = initData

  runLoop.init({ tag: 'updateData', func: updateDataOnce, nKeep: 1 })
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

    // svgBlocksQueue.updateData()
    svgBlocksQueueCreator.update()
    svgSchedulingBlocksOverview.update()
    svgBlocksQueueOptimized.update()
    locker.remove('updateData')
  }
  function updateData (dataIn) {
    runLoop.push({ tag: 'updateData', data: dataIn })
  }
  this.updateData = updateData

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
    createSchedBlocks()
    svgBlocksQueueCreator.updateData()
    svgBlocksQueueModif.updateData()
    svgBlocksQueueOptimized.updateData()
    svgSchedulingBlocksOverview.updateData()
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

  function createSchedBlocks () {
    shared.data.copy[shared.data.current].schedBlocks = {}
    for (let key in shared.data.copy[shared.data.current].modified.blocks) {
      for (let i = 0; i < shared.data.copy[shared.data.current].modified.blocks[key].length; i++) {
        let b = shared.data.copy[shared.data.current].modified.blocks[key][i]
        if (!shared.data.copy[shared.data.current].schedBlocks[b.sbId]) {
          shared.data.copy[shared.data.current].schedBlocks[b.sbId] = {
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
          let sb = shared.data.copy[shared.data.current].schedBlocks[b.sbId]
          sb.blocks.push(b)
          if (b.exeState.state === 'run' || sb.exeState.state === 'run') sb.exeState.state = 'run'
          else if (b.exeState.state === 'wait' && sb.exeState.state === 'done') sb.exeState.state = 'run'
          else if (b.exeState.state === 'done' && sb.exeState.state === 'wait') sb.exeState.state = 'run'
        }
      }
    }
  }
  function pullData () {
    let ori = {blocks: deepCopy(shared.data.server).blocks}
    for (var key in ori.blocks) {
      for (var i = 0; i < ori.blocks[key].length; i++) {
        ori.blocks[key][i].modifications = {
          modified: false,
          userModifications: {},
          optimizerModifications: {}
        }
      }
    }
    let modi = deepCopy(ori)
    let opti = deepCopy(ori)

    if (shared.data.copy.length === 0) {
      shared.data.current = 0
      shared.data.copy.push({original: ori, modified: modi, optimized: opti})
    } else {
      shared.data.copy[shared.data.current].original = ori
      shared.data.copy[shared.data.current].modified = modi
      shared.data.copy[shared.data.current].optimized = opti
    }

    updateAllBlocksQueue()
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

  function mainFocusOnSchedBlocks (schedB) {
    if (shared.focus.schedBlocks !== undefined) {
      if (shared.focus.schedBlocks === schedB) {
        mainUnfocusOnSchedBlocks(schedB)
        return
      }
      mainUnfocusOnSchedBlocks(shared.focus.schedBlocks)
      svgInformation.unfocusSchedBlocks()
      mainUnfocusOnBlock(shared.focus.block)
    }
    shared.focus.schedBlocks = schedB
    svgSchedulingBlocksOverview.focusOnSchedBlocks(schedB)
    svgInformation.focusOnSchedBlocks(schedB)
    blockQueueCreator.focusOnSchedBlocks(schedB)
    blockQueueModif.focusOnSchedBlocks(schedB)
    blockQueueOptimized.focusOnSchedBlocks(schedB)
    console.log(shared.focus.schedBlocks);
  }
  function mainUnfocusOnSchedBlocks () {
    svgInformation.unfocusSchedBlocks()
    svgSchedulingBlocksOverview.unfocusOnSchedBlocks()

    blockQueueCreator.unfocusOnSchedBlocks()
    blockQueueModif.unfocusOnSchedBlocks()
    blockQueueOptimized.unfocusOnSchedBlocks()
    shared.focus.schedBlocks = undefined
  }

  function mainFocusOnBlock (block) {
    if (shared.focus.block !== undefined) {
      if (shared.focus.block === block.obId) {
        mainUnfocusOnBlock(block)
        return
      }
      mainUnfocusOnBlock(shared.focus.block)
    }
    mainUnfocusOnSchedBlocks()
    mainFocusOnSchedBlocks(block.sbId)

    shared.focus.block = block.obId
    // svgSchedulingBlocksOverview.focusOnSchedBlocks(block)
    svgInformation.focusOnBlock(block.obId)
    blockQueueCreator.focusOnBlock(block.obId)
    blockQueueModif.focusOnBlock(block.obId)
    blockQueueOptimized.focusOnBlock(block.obId)
  }
  function mainUnfocusOnBlock () {
    if (!shared.focus.block) return
    svgInformation.unfocusBlock()
    svgInformation.focusOnSchedBlocks(shared.focus.schedBlocks)
    blockQueueCreator.unfocusOnBlock(shared.focus.block)
    blockQueueModif.unfocusOnBlock(shared.focus.block)
    blockQueueOptimized.unfocusOnBlock(shared.focus.block)
    shared.focus.block = undefined
  }

  function mainOverSchedBlocks (schedB) {
    svgSchedulingBlocksOverview.overSchedBlocks(schedB)
    blockQueueCreator.overSchedBlocks(schedB)
    blockQueueModif.overSchedBlocks(schedB)
    blockQueueOptimized.overSchedBlocks(schedB)
  }
  function mainOutSchedBlocks (schedB) {
    svgSchedulingBlocksOverview.outSchedBlocks(schedB)
    blockQueueCreator.outSchedBlocks(schedB)
    blockQueueModif.outSchedBlocks(schedB)
    blockQueueOptimized.outSchedBlocks(schedB)
  }

  function mainOverBlock (block) {
    svgInformation.overBlock(block.obId)
    blockQueueCreator.overBlock(block.obId)
    blockQueueModif.overBlock(block.obId)
    blockQueueOptimized.overBlock(block.obId)
    mainOverSchedBlocks(block.sbId)
  }
  function mainOutBlock (block) {
    svgInformation.outBlock(block.obId)
    blockQueueCreator.outBlock(block.obId)
    blockQueueModif.outBlock(block.obId)
    blockQueueOptimized.outBlock(block.obId)
    mainOutSchedBlocks(block.sbId)
  }

  function getBlocksBySched (schedId) {
    let blocks = {
      original: [],
      modified: [],
      optimized: []
    }
    for (let key in shared.data.copy[shared.data.current].original.blocks) {
      let group = shared.data.copy[shared.data.current].original.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].sbId === schedId) {
          blocks.original.push({data: group[i], key: key, index: i})
        }
      }
    }
    for (let key in shared.data.copy[shared.data.current].modified.blocks) {
      let group = shared.data.copy[shared.data.current].modified.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].sbId === schedId) {
          blocks.modified.push({data: group[i], key: key, index: i})
        }
      }
    }
    for (let key in shared.data.copy[shared.data.current].optimized.blocks) {
      let group = shared.data.copy[shared.data.current].optimized.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].sbId === schedId) {
          blocks.optimized.push({data: group[i], key: key, index: i})
        }
      }
    }
    return blocks
  }
  function getBlockById (blockId) {
    let block = {
      original: {data: undefined, key: undefined, index: undefined},
      modified: {data: undefined, key: undefined, index: undefined},
      optimized: {data: undefined, key: undefined, index: undefined}
    }
    for (let key in shared.data.copy[shared.data.current].original.blocks) {
      let group = shared.data.copy[shared.data.current].original.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].obId === blockId) {
          block.original = {data: group[i], key: key, index: i}
        }
      }
    }
    for (let key in shared.data.copy[shared.data.current].modified.blocks) {
      let group = shared.data.copy[shared.data.current].modified.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].obId === blockId) {
          block.modified = {data: group[i], key: key, index: i}
        }
      }
    }
    for (let key in shared.data.copy[shared.data.current].optimized.blocks) {
      let group = shared.data.copy[shared.data.current].optimized.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].obId === blockId) {
          block.optimized = {data: group[i], key: key, index: i}
        }
      }
    }
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
  function addSchedBlocksModifications (from, schedId, modifs) {
    for (let key in shared.data.copy[shared.data.current].modified.blocks) {
      let group = shared.data.copy[shared.data.current].modified.blocks[key]
      for (let i = group.length - 1; i > -1; i--) {
        if (group[i].sbId === schedId) {
          addBlockModifications(from, group[i].obId, modifs)
        }
      }
    }
    // let blocks = getBlocksBySched(schedId)
    // for (let key in shared.data.copy[shared.data.current].original.blocks) {
    //   let group = shared.data.copy[shared.data.current].original.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].sbId === schedId) {
    //       group[i].modifications.modified = true
    //     }
    //   }
    // }
    // for (let i = 0; i < blocks.original.length; i++) {
    //   blocks.original[i].data.modifications.modified = true
    // }
    // for (let i = 0; i < blocks.modified.length; i++) {
    //   blocks.modified[i].data.modifications.modified = true
    // }

    // for (let key in shared.data.copy[shared.data.current].modified.blocks) {
    //   let group = shared.data.copy[shared.data.current].modified.blocks[key]
    //   for (let i = group.length - 1; i > -1; i--) {
    //     if (group[i].sbId === schedId) {
    //       let block = group[i]
    //       block.modifications.modified = true
    //       for (let modif in modifs) {
    //         block = applyModification(block, modifs[modif])
    //         if (modifs[modif].prop === 'state') {
    //           group.splice(i, 1)
    //           shared.data.copy[shared.data.current].modified.blocks['done'].push(block)
    //         }
    //       }
    //     }
    //   }
    // }
    // for (let i = blocks.modified.length - 1; i > -1; i--) {
    //   let block = blocks.modified[i]
    //   for (let modif in modifs) {
    //     block.data = applyModification(block.data, modifs[modif])
    //     if (modifs[modif].prop === 'state') {
    //       if (modifs[modif].new === 'cancel') {
    //         shared.data.copy[shared.data.current].modified.blocks[block.key].splice(block.index, 1)
    //         shared.data.copy[shared.data.current].modified.blocks['done'].push(block.data)
    //       } else if (modifs[modif].new === 'wait') {
    //         console.log(block.key);
    //         console.log(shared.data.copy[shared.data.current].modified.blocks[block.key].splice(block.index, 1))
    //         shared.data.copy[shared.data.current].modified.blocks['wait'].push(block.data)
    //       } else if (modifs[modif].new === 'run') {
    //         shared.data.copy[shared.data.current].modified.blocks[block.key].splice(block.index, 1)
    //         shared.data.copy[shared.data.current].modified.blocks['run'].push(block.data)
    //       }
    //     }
    //   }
    // }
    // // shared.data.copy[shared.data.current].blocks.modified.push(block)
    // // console.log(shared.data.copy[shared.data.current].blocks);
    // svgBlocksQueueCreator.updateData()
    // svgMiddleInfo.updateData()
    // svgBlocksQueueModif.updateData()
    // optimizer()
  }
  function addBlockModifications (from, blockId, modifs) {
    console.log(blockId);
    let block = getBlockById(blockId)
    console.log(block);
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
    block.modified.data.modifications.modified = true
    for (let modif in modifs) {
      let modifSucceed = applyModification(block, modifs[modif])
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
    if (Object.keys(block.modified.data.modifications.userModifications).length === 0) {
      block.original.data.modifications.modified = false
      block.modified.data.modifications.modified = false
    }

    // shared.data.copy[shared.data.current].blocks.modified.push(block)
    // console.log(shared.data.copy[shared.data.current].blocks);
    updateAllBlocksQueue()
    optimizer()
    svgMiddleInfo.update()
  }

  function createBackground () {
    svg.svg
      .style('background', colorTheme.medium.background)
    svg.background = svg.g

    // let lineGenerator = d3.line()
    //   .x(function (d) { return d.x })
    //   .y(function (d) { return d.y })
    // let dataPoints1 = [
    //   {x: lenD.w[0] * 0, y: lenD.h[0] * 0.25},
    //   {x: lenD.w[0] * 0.48, y: lenD.h[0] * 0.25},
    //   {x: lenD.w[0] * 0.525, y: lenD.h[0] * 0.155},
    //   {x: lenD.w[0] * 0.5525, y: lenD.h[0] * 0.155},
    //   {x: lenD.w[0] * 0.5525, y: lenD.h[0] * 0.105},
    //   {x: lenD.w[0] * 0.58, y: lenD.h[0] * 0.105},
    //   {x: lenD.w[0] * 0.625, y: lenD.h[0] * 0}
    // ]
    // svg.background.append('path')
    //   .data([dataPoints1])
    //   .attr('class', 'line')
    //   .attr('d', lineGenerator)
    //   .attr('fill', 'none')
    //   .attr('stroke', colorTheme.bright.stroke)
    //   .attr('stroke-width', 0.5)
    //   .attr('stroke-dasharray', [6, 2])

    // let dataPoints1 = [
    //   {x: lenD.w[0] * 0, y: lenD.h[0] * 0},
    //   {x: lenD.w[0] * 0.48, y: lenD.h[0] * 0},
    //   {x: lenD.w[0] * 0.48, y: lenD.h[0] * 0.25},
    //   {x: lenD.w[0] * 0, y: lenD.h[0] * 0.25}
    // ]
    // svg.background.append('path')
    //   .data([dataPoints1])
    //   .attr('class', 'line')
    //   .attr('d', lineGenerator)
    //   .attr('fill', '#37474F')
    //   .attr('stroke', '#37474F')
    //   .attr('stroke-width', 1)
    // let dataPoints2 = [
    //   {x: lenD.w[0] * 0.48, y: lenD.h[0] * 0},
    //   {x: lenD.w[0] * 0.625, y: lenD.h[0] * 0},
    //   {x: lenD.w[0] * 0.625, y: lenD.h[0] * 0.1},
    //   {x: lenD.w[0] * 0.555, y: lenD.h[0] * 0.1},
    //   {x: lenD.w[0] * 0.555, y: lenD.h[0] * 0.15},
    //   {x: lenD.w[0] * 0.48, y: lenD.h[0] * 0.15}
    // ]
    // svg.background.append('path')
    //   .data([dataPoints2])
    //   .attr('class', 'line')
    //   .attr('d', lineGenerator)
    //   .attr('fill', '#37474F')
    //   .attr('stroke', '#37474F')
    //   .attr('stroke-width', 1)
    // let dataPoints3 = [
    //   {x: lenD.w[0] * 0.48, y: lenD.h[0] * 0.15},
    //   {x: lenD.w[0] * 0.555, y: lenD.h[0] * 0.15},
    //   {x: lenD.w[0] * 0.555, y: lenD.h[0] * 0.1},
    //   {x: lenD.w[0] * 0.625, y: lenD.h[0] * 0.1},
    //   {x: lenD.w[0] * 0.625, y: lenD.h[0] * 0.25},
    //   {x: lenD.w[0] * 0.48, y: lenD.h[0] * 0.25}
    // ]
    // svg.background.append('path')
    //   .data([dataPoints3])
    //   .attr('class', 'line')
    //   .attr('d', lineGenerator)
    //   .attr('fill', '#37474F')
    //   .attr('stroke', '#37474F')
    //   .attr('stroke-width', 1)
    // let dataPoints4 = [
    //   {x: lenD.w[0] * 0, y: lenD.h[0] * 0.25},
    //   {x: lenD.w[0] * 0.625, y: lenD.h[0] * 0.25},
    //   {x: lenD.w[0] * 0.625, y: lenD.h[0] * 0},
    //   {x: lenD.w[0] * 1, y: lenD.h[0] * 0},
    //   {x: lenD.w[0] * 1, y: lenD.h[0] * 1},
    //   {x: lenD.w[0] * 0, y: lenD.h[0] * 1}
    // ]
    // svg.background.append('path')
    //   .data([dataPoints4])
    //   .attr('class', 'line')
    //   .attr('d', lineGenerator)
    //   .attr('fill', '#37474F')
    //   .attr('stroke', '#37474F')
    //   .attr('stroke-width', 1)
  }
  // function clusterData (dataIn) {
  //   tokens.blockState = {}
  //   tokens.blockError = {}
  //   for (var i = 0; i < dataIn.blocks.done.length; i++) {
  //     if (hasVar(tokens.blockState[dataIn.blocks.done[i].exeState.state])) {
  //       if (!tokens.blockState[dataIn.blocks.done[i].exeState.state].includes(dataIn.blocks.done[i].obId)) {
  //         tokens.blockState[dataIn.blocks.done[i].exeState.state].push(dataIn.blocks.done[i].obId)
  //       }
  //     } else {
  //       tokens.blockState[dataIn.blocks.done[i].exeState.state] = [dataIn.blocks.done[i].obId]
  //     }
  //
  //     if (dataIn.blocks.done[i].exeState.state === 'cancel' || dataIn.blocks.done[i].exeState.state === 'fail') {
  //       if (hasVar(tokens.blockError[dataIn.blocks.done[i].exeState.error])) {
  //         if (!tokens.blockError[dataIn.blocks.done[i].exeState.error].includes(dataIn.blocks.done[i].obId)) {
  //           tokens.blockError[dataIn.blocks.done[i].exeState.error].push(dataIn.blocks.done[i].obId)
  //         }
  //       } else {
  //         tokens.blockError[dataIn.blocks.done[i].exeState.error] = [dataIn.blocks.done[i].obId]
  //       }
  //     }
  //   }
  // }
  // function checkWithErrorsFilters (block) {
  //   if (filters.errors.length === 0) return true
  //   for (let i = 0; i < filters.errors.length; i++) {
  //     if (filters.errors[i].id === block.error) return true
  //   }
  //   return false
  // }
  // function checkWithStatesFilters (block) {
  //   if (filters.states.length === 0) return true
  //   for (let i = 0; i < filters.states.length; i++) {
  //     if (filters.states[i].id === block.state) return true
  //   }
  //   return false
  // }
  // function filterData (dataIn) {
  //   filteredTokens.blockState = {}
  //   filteredTokens.blockError = {}
  //   for (var i = 0; i < dataIn.blocks.done.length; i++) {
  //     if (checkWithErrorsFilters(dataIn.blocks.done[i].exeState)) {
  //       if (hasVar(filteredTokens.blockState[dataIn.blocks.done[i].exeState.state])) {
  //         if (!filteredTokens.blockState[dataIn.blocks.done[i].exeState.state].includes(dataIn.blocks.done[i].obId)) {
  //           filteredTokens.blockState[dataIn.blocks.done[i].exeState.state].push(dataIn.blocks.done[i].obId)
  //         }
  //       } else {
  //         filteredTokens.blockState[dataIn.blocks.done[i].exeState.state] = [dataIn.blocks.done[i].obId]
  //       }
  //     }
  //
  //     if (checkWithStatesFilters(dataIn.blocks.done[i].exeState)) {
  //       if (dataIn.blocks.done[i].exeState.state === 'cancel' || dataIn.blocks.done[i].exeState.state === 'fail') {
  //         if (hasVar(filteredTokens.blockError[dataIn.blocks.done[i].exeState.error])) {
  //           if (!filteredTokens.blockError[dataIn.blocks.done[i].exeState.error].includes(dataIn.blocks.done[i].obId)) {
  //             filteredTokens.blockError[dataIn.blocks.done[i].exeState.error].push(dataIn.blocks.done[i].obId)
  //           }
  //         } else {
  //           filteredTokens.blockError[dataIn.blocks.done[i].exeState.error] = [dataIn.blocks.done[i].obId]
  //         }
  //       }
  //     }
  //   }
  // }

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
  let SvgBlocksQueueCreator = function () {
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData () {
      let blockBoxData = {
        x: (lenD.w[0] * 0.02),
        y: lenD.h[0] * 0.02,
        w: lenD.w[0] * 0.6,
        h: lenD.h[0] * 0.25,
        marg: (lenD.w[0] * 0.6) * 0.01
      }
      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
      console.log(gBlockBox.append('text')
        .text('CURRENT SCHEDULE')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-5,' + (blockBoxData.h * 0.5) + ') rotate(270)'))

      blockQueueCreator = new BlockQueueCreator({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          box: blockBoxData,
          background: {
            fill: colorTheme.dark.background,
            stroke: colorTheme.dark.stroke,
            strokeWidth: 0.1
          },
          colorTheme: colorTheme
        },
        axis: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: blockBoxData.h, w: blockBoxData.w, h: 0, marg: blockBoxData.marg},
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
            box: {x: 0, y: blockBoxData.h * 0.46875, w: blockBoxData.w, h: blockBoxData.h * 0.53125, marg: blockBoxData.marg},
            events: {
              click: mainFocusOnBlock,
              mouseover: mainOverBlock,
              mouseout: mainOutBlock,
              drag: {
                start: svgBlocksQueueModif.dragStart,
                tick: svgBlocksQueueModif.dragTick,
                end: svgBlocksQueueModif.dragEnd
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
            box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h * 0.3125, marg: blockBoxData.marg},
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
            enabled: true,
            g: undefined,
            box: {x: 0, y: blockBoxData.h * 0.5, w: blockBoxData.w, h: blockBoxData.h * 0.47, marg: blockBoxData.marg},
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
        filters: {
          enabled: false,
          g: undefined,
          box: {x: 0, y: blockBoxData.h * 0.15, w: lenD.w[0] * 0.12, h: blockBoxData.h * 0.7, marg: 0},
          filters: []
        },
        timeBars: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h, marg: blockBoxData.marg}
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

      blockQueueCreator.init()
      updateData()
    }
    this.initData = initData

    function updateData () {
      let telIds = []
      console.log(shared.data.current);
      $.each(shared.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      blockQueueCreator.updateData({
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
      blockQueueCreator.update({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        }
      })
    }
    this.update = update
  }
  let SvgBlocksQueueModif = function () {
    let reserved = {}
    reserved.drag = {}
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData () {
      reserved.box = {
        x: lenD.w[0] * 0.02,
        y: lenD.h[0] * 0.7,
        w: lenD.w[0] * 0.6,
        h: lenD.h[0] * 0.28,
        marg: lenD.w[0] * 0.6 * 0.01
      }
      reserved.modifQueue = {
        x: lenD.w[0] * 0.02,
        y: reserved.box.y,
        w: lenD.w[0] * 0.6,
        h: reserved.box.h * 0.33,
        marg: lenD.w[0] * 0.6 * 0.01
      }
      reserved.targetBox = {
        x: lenD.w[0] * 0.02,
        y: reserved.box.h * 0.5,
        w: lenD.w[0] * 0.6,
        h: reserved.box.h * 0.25,
        marg: lenD.w[0] * 0.6 * 0.01
      }
      reserved.conflictBox = {
        x: lenD.w[0] * 0.02,
        y: reserved.box.h * 0.75,
        w: lenD.w[0] * 0.6,
        h: reserved.box.h * 0.25,
        marg: lenD.w[0] * 0.6 * 0.01
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
        .attr('clip-path', 'url(#clip)')

      let range = reserved.conflictBox.h * 0.33333
      reserved.clipBody.append('rect')
        .attr('x', 0)
        .attr('y', reserved.conflictBox.y)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.dark.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
      reserved.clipBody.append('rect')
        .attr('x', 0)
        .attr('y', reserved.conflictBox.y + range * 1)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.medium.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
      reserved.clipBody.append('rect')
        .attr('x', 0)
        .attr('y', reserved.conflictBox.y + range * 2)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.dark.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)

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
                start: svgBlocksQueueModif.dragStart,
                tick: svgBlocksQueueModif.dragTick,
                end: svgBlocksQueueModif.dragEnd
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
      let modifiedData = {}
      for (let key in shared.data.copy[shared.data.current].modified.blocks) {
        modifiedData[key] = []
        let group = shared.data.copy[shared.data.current].modified.blocks[key]
        for (let i = 0; i < group.length; i++) {
          if (!(Object.keys(group[i].modifications.userModifications).length === 0 && group[i].modifications.userModifications.constructor === Object)) {
            modifiedData[key].push(group[i])
          }
        }
      }
      blockQueueModif.updateData({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        },
        data: {
          raw: {
            blocks: modifiedData,
            telIds: telIds
          },
          modified: []
        }
      })
      drawTargets()
      drawTelsAvailabilityCurve()
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

    function createDragColumn (d) {
      reserved.drag.column = {}
      reserved.drag.column.g = reserved.drag.g.append('g')
      reserved.drag.column.g.append('rect')
        .attr('class', 'area')
        .attr('x', reserved.drag.position.left)
        .attr('y', function () { return d.y + reserved.drag.box.h * 0.19 }) // - Number(reserved.drag.oldRect.attr('height')))
        .attr('width', reserved.drag.position.right - reserved.drag.position.left)
        .attr('height', function () { return d.h })
        .attr('fill', '#ffffff')
        .attr('stroke', 'none')
        .attr('fill-opacity', 0.2)
        .transition()
        .duration(300)
        .attr('y', 0)
        .attr('height', reserved.drag.box.h)
      reserved.drag.column.g.append('line')
        .attr('class', 'left')
        .attr('x1', reserved.drag.position.left)
        .attr('y1', function () { return d.y + reserved.drag.box.h * 0.19 })
        .attr('x2', reserved.drag.position.left)
        .attr('y2', function () { return d.y + reserved.drag.box.h * 0.19 + d.h })
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
        .attr('y1', function () { return d.y + reserved.drag.box.h * 0.19 })
        .attr('x2', reserved.drag.position.right)
        .attr('y2', function () { return d.y + reserved.drag.box.h * 0.19 + d.h })
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
        .delay(150)
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
        .delay(150)
        .attr('opacity', 1)
    }
    function createDragBlock (d) {
      reserved.drag.block = {}
      reserved.drag.block.g = reserved.drag.g.selectAll('g.modifG')
        .data([d])
      let enter = reserved.drag.block.g
        .enter()
        .append('g')
        .attr('class', 'modifG')
        // .attr('transform', 'translate(0,' +
        //   (com.blocks.cancel.box.h + com.blocks.modification.box.h) +
        //   ')')
      // enter.append('rect')
      //   .attr('class', 'modified')
      //   .attr('x', d.x)
      //   .attr('y', d.y + reserved.drag.box.h * 0.19) // - Number(reserved.drag.oldRect.attr('height')))
      //   .attr('width', d.w)
      //   .attr('height', d.h)
      //   .attr('fill', d.fill)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.5)
      enter.append('text')
        .attr('class', 'modified')
        .text(function (d, i) {
          return d.data.metaData.blockName
        })
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', function (d) {
          return '#000000'
        })
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', function (d) {
          return '#000000'
        })
        .attr('x', function (d, i) {
          return reserved.drag.position.left + reserved.drag.position.width * 0.5
        })
        .attr('y', function (d, i) {
          return d.y + (reserved.drag.box.h * 0.19) + (d.h * 0.5)
        })
        .attr('text-anchor', 'middle')
        .style('font-size', function (d) {
          return d.size + 'px'
        })
        .attr('dy', function (d) {
          return 0 + 'px'
        })
        .transition()
        .duration(150)
        .attr('y', function (d, i) {
          return 8
        })
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        .style('font-size', function (d) {
          return 8 + 'px'
        })
    }
    function createDragTimer (d) {
      reserved.drag.timer = {}
      reserved.drag.timer.g = reserved.drag.g.append('g')
        .attr('transform', 'translate(' + reserved.drag.position.left + ',' + (reserved.drag.box.h * 0.49) + ')')
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
        .attr('x', 0)
        .attr('y', 0) // - Number(reserved.drag.oldRect.attr('height')))
        .attr('width', 40)
        .attr('height', 10)
        .attr('fill', colorTheme.brighter.background)
        .attr('stroke', '#ffffff')
        .attr('fill-opacity', 0.9)
        .on('mouseover', function () {})
      reserved.drag.timer.g.append('text')
        .attr('class', 'hour')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
          return d3.timeFormat('%H:')(time)
        })
        .attr('x', 15)
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
        .attr('class', 'minute')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
          return d3.timeFormat('%M')(time)
        })
        .attr('x', 27)
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

    function dragStart (d) {
      if (d.data.endTime < Number(shared.data.server.timeOfNight.now)) return

      reserved.drag.box = {
        x: (lenD.w[0] * 0.02),
        y: (lenD.h[0] * 0.4),
        w: (lenD.w[0] * 0.6),
        h: (lenD.h[0] * 0.595)
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
      reserved.drag.mousecursor = d3.mouse(reserved.drag.g._groups[0][0])
      reserved.drag.offset = reserved.drag.mousecursor[0] - reserved.drag.position.left

      reserved.drag.mode = {}
      reserved.drag.mode.current = 'general'
      reserved.drag.mode.previous = 'general'
      // reserved.drag.topLimit = (com.blocks.cancel.box.y + com.blocks.cancel.box.h)

      createDragColumn(d)
      createDragBlock(d)
      createDragTimer(d)
      // reserved.drag.firstDrag = false
      // blockQueue.focusOnBlock(d.id)
    }
    this.dragStart = dragStart
    function dragTick (d) {
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
        reserved.drag.timer.g.select('text.modified')
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
        console.log(reserved.drag.position.left);
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

        if (reserved.drag.mousecursor[1] > (reserved.drag.box.h * 0.49)) {
          reserved.drag.mode.previous = reserved.drag.mode.current
          reserved.drag.mode.current = 'precision'
        } else {
          reserved.drag.mode.previous = reserved.drag.mode.current
          reserved.drag.mode.current = 'general'
        }
        // else if (reserved.drag.mousecursor[1] < (reserved.drag.topLimit - 1)) reserved.drag.mode.current = 'cancel'

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

          if (reserved.drag.mode.previous === 'precision') {
            delete reserved.drag.finalTime
            reserved.drag.offset = reserved.drag.position.width * 0.5
            reserved.drag.timer.g.select('text.hour')
              .transition()
              .duration(600)
              .text(function () {
                return d3.timeFormat('%H:')(reserved.drag.timeScale.invert(reserved.drag.position.left))
              })
              .attr('x', 15)
              .attr('y', 9)
              .style('font-weight', 'normal')
            reserved.drag.timer.g.select('text.minute')
              .transition()
              .duration(600)
              .text(function () {
                return d3.timeFormat('%M')(reserved.drag.timeScale.invert(reserved.drag.position.left))
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
          }
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
            reserved.drag.timer.g.select('text.hour').text(function () {
              let time = new Date(shared.data.server.timeOfNight.date_start)
              time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
              return d3.timeFormat('%H:')(time)
            })
            reserved.drag.timer.g.select('text.minute').text(function () {
              let time = new Date(shared.data.server.timeOfNight.date_start)
              time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
              return d3.timeFormat('%M')(time)
            })
          }
        } else if (reserved.drag.mode.current === 'precision') {
          if (reserved.drag.mode.previous === 'general') {
            reserved.drag.finalTime = new Date(shared.data.server.timeOfNight.date_start)
            reserved.drag.finalTime.setSeconds(reserved.drag.finalTime.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))

            reserved.drag.timer.g.select('text.hour')
              .transition()
              .duration(600)
              .text(function () {
                return d3.timeFormat('%H:')(reserved.drag.finalTime)
              })
              .attr('x', 15)
              .attr('y', 10.5)
              .style('font-weight', 'bold')
            reserved.drag.timer.g.select('text.minute')
              .transition()
              .duration(600)
              .text(function () {
                return d3.timeFormat('%M')(reserved.drag.finalTime)
              })
              .attr('x', 29)
              .attr('y', 6.5)
              .style('font-weight', 'bold').style('font-size', '7px')
            reserved.drag.timer.g.append('text')
              .attr('class', 'second')
              .text(function () {
                return d3.timeFormat('%S')(reserved.drag.finalTime)
              })
              .attr('x', 29)
              .attr('y', 13) // - Number(reserved.drag.oldRect.attr('height')))
              .style('font-weight', 'bold')
              .style('opacity', 1)
              .style('fill-opacity', 0.7)
              .style('fill', '#000000')
              .style('stroke-width', 0.3)
              .style('stroke-opacity', 1)
              .attr('vector-effect', 'non-scaling-stroke')
              .style('pointer-events', 'none')
              .style('stroke', 'none')
              .attr('text-anchor', 'middle')
              .style('font-size', '7px')
              .attr('dy', '0px')

            reserved.drag.timer.g
              .transition()
              .duration(600)
              .attr('x', -70)
              .attr('width', 180)
              .attr('height', 25)
              .attr('fill-opacity', 1)
            let hourMinG = reserved.drag.timer.g.append('g').attr('class', 'hourMin')
            for (let i = 1; i < 6; i++) {
              hourMinG.append('rect')
                .attr('class', function (d) {
                  let date = new Date(reserved.drag.finalTime)
                  date.setMinutes(date.getMinutes() - i)
                  return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
                })
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 0)
                .attr('height', 15)
                .attr('fill', (i % 2 === 1 ? colorTheme.darker.background : colorTheme.darker.background))
                .attr('stroke', 'none')
                .attr('fill-opacity', 0.4)
                .on('mouseover', function (d) {
                  let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
                  let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
                  let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
                  changeMinute(newDate, newHour, newMin)
                  d3.select(this).attr('fill-opacity', 0.9)
                })
                .on('mouseout', function () {
                  d3.select(this).attr('fill-opacity', 0.4)
                })
                .transition()
                .duration(600)
                .attr('x', 5.5 - 15 * i)
                .attr('width', 15)
              hourMinG.append('text')
                .attr('class', 'hourMin-' + i)
                .text(function () {
                  let date = new Date(reserved.drag.finalTime)
                  date.setMinutes(date.getMinutes() - i)
                  return d3.timeFormat(':%M')(date)
                })
                .attr('x', 20)
                .attr('y', 10)
                .style('font-weight', 'normal')
                .style('opacity', 1)
                .style('fill-opacity', 0)
                .style('fill', '#000000')
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .style('stroke', 'none')
                .attr('text-anchor', 'middle')
                .style('font-size', '7px')
                .attr('dy', '0px')
                .transition()
                .duration(600)
                .style('fill-opacity', 0.7)
                .attr('x', 13 - 15 * i)
            }
            for (let i = 1; i < 6; i++) {
              hourMinG.append('rect')
                .attr('class', function (d) {
                  let date = new Date(reserved.drag.finalTime)
                  date.setMinutes(date.getMinutes() + (i - 1))
                  return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
                })
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 0)
                .attr('height', 15)
                .attr('fill', (i % 2 === 1 ? colorTheme.darker.background : colorTheme.darker.background))
                .attr('stroke', 'none')
                .attr('fill-opacity', 0.4)
                .on('mouseover', function (d) {
                  let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
                  let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
                  let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
                  changeMinute(newDate, newHour, newMin)
                  d3.select(this).attr('fill-opacity', 0.9)
                })
                .on('mouseout', function () {
                  d3.select(this).attr('fill-opacity', 0.4)
                })
                .transition()
                .duration(600)
                .attr('x', 19.5 + 15 * i)
                .attr('width', 15)
              hourMinG.append('text')
                .attr('class', 'hourMin+' + (i - 1))
                .text(function () {
                  let date = new Date(reserved.drag.finalTime)
                  date.setMinutes(date.getMinutes() + (i - 1))
                  return d3.timeFormat(':%M')(date)
                })
                .attr('x', 27 + 15 * i)
                .attr('y', 10) // - Number(reserved.drag.oldRect.attr('height')))
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
                .style('font-size', '7px')
                .attr('dy', '0px')
            }
            for (let i = 0; i < 12; i++) {
              hourMinG.append('rect')
                .attr('class', function (d) {
                  let date = new Date()
                  date.setSeconds(5 * i)
                  return 'hourSec:' + date.getSeconds()
                })
                .attr('x', 20)
                .attr('y', 14)
                .attr('width', 0)
                .attr('height', 12)
                .attr('fill', (i % 2 === 1 ? colorTheme.darker.background : colorTheme.darker.background))
                .attr('stroke', '#222222')
                .attr('stroke-width', 0.3)
                .attr('stroke-dasharray', [0, 5, 5, 8, 6, 21, 6, 3])
                .attr('fill-opacity', 0.4)
                .on('mouseover', function (d) {
                  changeSecond(Number(d3.select(this).attr('class').split(':')[1]))
                  d3.select(this).attr('fill-opacity', 1)
                })
                .on('mouseout', function () {
                  d3.select(this).attr('fill-opacity', 0.4)
                })
                .transition()
                .duration(600)
                .attr('x', -62 - 8 + 15 * i)
                .attr('width', 15)
              hourMinG.append('text')
                .attr('class', 'Min_sec' + i)
                .text(function () {
                  let date = new Date()
                  date.setSeconds(5 * i)
                  return d3.timeFormat(':%S')(date)
                })
                .attr('x', -62 + 15 * i)
                .attr('y', 22) // - Number(reserved.drag.oldRect.attr('height')))
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
                .style('font-size', '7px')
                .attr('dy', '0px')
            }
          }
        }
      }
    }
    this.dragTick = dragTick
    function dragEnd (d) {
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

      addBlockModifications('', d.data.obId, modif)
      // blockQueue.saveModificationAndUpdateBlock(newBlock, modif)
      // if (isGeneratingTelsConflict(newBlock)) {
      //   com.data.modified.conflict.push(newBlock)
      // } else {
      //   com.data.modified.integrated.push(newBlock)
      // }

      // reserved.drag.oldG.select('rect.back')
      //   .style('fill-opacity', 0.1)
      //   .style('stroke-opacity', 0.1)
      //   .style('pointer-events', 'none')
      // reserved.drag.oldG.remove()
      reserved.drag.g.remove()
      reserved.drag = {}
    }
    this.dragEnd = dragEnd

    function drawTargets () {
      let scaleX = d3.scaleLinear()
        .range([0, reserved.targetBox.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
      // console.log(blockQueue.get('axis').range, blockQueue.get('axis').domain);
      let scaleY = d3.scaleLinear()
        .range([reserved.targetBox.y + reserved.targetBox.h, reserved.targetBox.y])
        .domain([0.01, 1.01])
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .curve(d3.curveNatural)

      let allg = reserved.clipBody.selectAll('g.target')
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
          return 0.9
        })
        .attr('fill-opacity', 0.6)
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
        .attr('y', reserved.targetBox.y + reserved.targetBox.h - 3)
        .attr('text-anchor', 'start')
        .attr('font-size', 7)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .style('fill', function (d) {
          // if (block.data.targetId === d.id) return colorTheme.dark.stroke
          return colorTheme.dark.stroke
        })
        .style('fill-opacity', function (d) {
          // if (block.data.targetId === d.id) return 1
          return 0.5
        })
    }
    function highlightTarget (block) {
      let tarG = reserved.clipBody.selectAll('g.target')
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
    }
    this.highlightTarget = highlightTarget
    function unhighlightTarget (block) {
      let tarG = reserved.clipBody.selectAll('g.target')
        .filter(function (d) { return (block.data.targetId === d.id) })
      tarG.select('path')
        .attr('fill', 'none')
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('stroke-opacity', 0.9)
        .attr('fill-opacity', 0.6)
        .attr('stroke-dasharray', [4, 6])
      tarG.select('text')
        .style('fill', colorTheme.dark.stroke)
        .style('fill-opacity', 0.5)
    }
    this.unhighlightTarget = unhighlightTarget

    function drawTelsAvailabilityCurve () {
      let curve = computeTelsCurve()

      let scaleX = d3.scaleLinear()
        .range([0, reserved.box.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
      // console.log(blockQueue.get('axis').range, blockQueue.get('axis').domain);
      let range = reserved.conflictBox.h * 0.33333
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
        .attr('y', function (d) { return (reserved.conflictBox.y + range * 0.5) - Math.abs(scaleYSmall(d.smallTels)) })
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
        .attr('y', function (d) { return (reserved.conflictBox.y + range * 1.5) - Math.abs(scaleYMedium(d.mediumTels)) })
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
        .attr('y', function (d) { return (reserved.conflictBox.y + range * 2.5) - Math.abs(scaleYLarge(d.largeTels)) })
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
    function computeTelsCurve () {
      let largeTels = {}
      let mediumTels = {}
      let smallTels = {}
      // smallTels[shared.data.server.timeOfNight.start] = 0
      // mediumTels[shared.data.server.timeOfNight.start] = 0
      // largeTels[shared.data.server.timeOfNight.start] = 0

      for (let key in shared.data.copy[shared.data.current].modified.blocks) {
        for (let i = 0; i < shared.data.copy[shared.data.current].modified.blocks[key].length; i++) {
          let b = shared.data.copy[shared.data.current].modified.blocks[key][i]
          if (b.exeState.state === 'cancel') continue

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
      // smallTels[shared.data.server.timeOfNight.end] = 0
      // mediumTels[shared.data.server.timeOfNight.end] = 0
      // largeTels[shared.data.server.timeOfNight.end] = 0

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
  let SvgBlockQueueOptimized = function () {
    function initData () {
      let blockBoxData = {
        x: (lenD.w[0] * 0.02),
        y: lenD.h[0] * 0.4,
        w: lenD.w[0] * 0.6,
        h: lenD.h[0] * 0.25,
        marg: (lenD.w[0] * 0.6) * 0.01
      }
      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
      gBlockBox.append('text')
        .text('OPTIMIZED SCHEDULE')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-5,' + (blockBoxData.h * 0.5) + ') rotate(270)')
      blockQueueOptimized = new BlockQueueOptimizer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          box: blockBoxData,
          background: {
            fill: colorTheme.dark.background,
            stroke: colorTheme.dark.stroke,
            strokeWidth: 0.1
          },
          colorTheme: colorTheme
        },
        axis: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: blockBoxData.h, w: blockBoxData.w, h: 0, marg: blockBoxData.marg},
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
            box: {x: 0, y: blockBoxData.h * 0.46875, w: blockBoxData.w, h: blockBoxData.h * 0.53125, marg: blockBoxData.marg},
            events: {
              click: mainFocusOnBlock,
              mouseover: mainOverBlock,
              mouseout: mainOutBlock,
              drag: {
                start: svgBlocksQueueModif.dragStart,
                tick: svgBlocksQueueModif.dragTick,
                end: svgBlocksQueueModif.dragEnd
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
            box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h * 0.3125, marg: blockBoxData.marg},
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
            box: {x: 0, y: blockBoxData.h * 0.24, w: blockBoxData.w, h: blockBoxData.h * 0.36, marg: blockBoxData.marg},
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
          box: {x: 0, y: blockBoxData.h * 0.15, w: lenD.w[0] * 0.12, h: blockBoxData.h * 0.7, marg: 0},
          filters: []
        },
        timeBars: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h, marg: blockBoxData.marg}
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

      blockQueueOptimized.init()
      update()
    }
    this.initData = initData

    function updateData () {
      // blockQueueCreator.shrink()
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
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        }
      })
    }
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
        {x: reserved[pullOrPush].box.w * 0.2, y: reserved[pullOrPush].box.h * 0.0},
        {x: reserved[pullOrPush].box.w * 0.8, y: reserved[pullOrPush].box.h * 0.0},
        {x: reserved[pullOrPush].box.w * 0.8, y: reserved[pullOrPush].box.h * 1.0},
        {x: reserved[pullOrPush].box.w * 0.2, y: reserved[pullOrPush].box.h * 1.0},
        {x: reserved[pullOrPush].box.w * 0.2, y: reserved[pullOrPush].box.h * 0.0}
      ]

      function loop (bool, pullOrPush) {
        reserved[pullOrPush].child.warningExclamation
          .transition()
          .delay(4000)
          .duration(100)
          .ease(d3.easeLinear)
          .attr('font-size', function () {
            return reserved[pullOrPush].box.h * 0.25
          })
          .attr('dy', function () {
            return reserved[pullOrPush].box.h * 0.02
          })
          .transition()
          .duration(100)
          .ease(d3.easeLinear)
          .attr('font-size', function () {
            return reserved[pullOrPush].box.h * 0.8
          })
          .attr('dy', function () {
            return reserved[pullOrPush].box.h * 0.3
          })
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

      reserved[pullOrPush].child.warningExclamationBack = reserved[pullOrPush].g.append('rect')
        .attr('width', reserved[pullOrPush].box.w * 0.06)
        .attr('height', reserved[pullOrPush].box.h * 1)
        .attr('x', function () {
          if (pullOrPush === 'pull') return reserved[pullOrPush].box.w * 0.77
          else return reserved[pullOrPush].box.w * 0.17
        })
        .attr('y', reserved[pullOrPush].box.h * 0)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', colorTheme.warning.background)
        .attr('stroke-width', 0.5)
        .attr('stroke', colorTheme.warning.stroke)
      reserved[pullOrPush].child.warningExclamation = reserved[pullOrPush].g.append('text')
        .text(function (d) {
          return '! '
        })
        .attr('x', function () {
          if (pullOrPush === 'pull') return reserved[pullOrPush].box.w * 0.8
          else return reserved[pullOrPush].box.w * 0.2
        })
        .attr('y', reserved[pullOrPush].box.h * 0.5)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .attr('font-size', reserved[pullOrPush].box.h * 0.8)
        .attr('dy', reserved[pullOrPush].box.h * 0.3)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.warning.text)
      loop(true, pullOrPush)

      function pullWarning () {
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Something occur that'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.22
          })
          .attr('y', reserved[pullOrPush].box.h * 0.27)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.3)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine2 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'could invalidate the'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.22
          })
          .attr('y', reserved[pullOrPush].box.h * 0.58)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.3)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine3 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'new schedule.'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.22
          })
          .attr('y', reserved[pullOrPush].box.h * 0.88)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.3)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Please Pull'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.5
          })
          .attr('y', reserved[pullOrPush].box.h * 0.4)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.4)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'or Merge'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.5
          })
          .attr('y', reserved[pullOrPush].box.h * 0.8)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.4)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
      }
      function pushWarning () {
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Because of time'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.26
          })
          .attr('y', reserved[pullOrPush].box.h * 0.27)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.3)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine2 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'constraints, some'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.26
          })
          .attr('y', reserved[pullOrPush].box.h * 0.58)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.3)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine3 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'changes will be lost.'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.26
          })
          .attr('y', reserved[pullOrPush].box.h * 0.88)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.3)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
        reserved[pullOrPush].child.warningLine41 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return '10:00'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.65
          })
          .attr('y', reserved[pullOrPush].box.h * 0.35)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved[pullOrPush].box.h * 0.3)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
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
        countDown()
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Please Push'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.55
          })
          .attr('y', reserved[pullOrPush].box.h * 0.8)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.4)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
      }

      if (pullOrPush === 'pull') pullWarning()
      else pushWarning()
    }
    function createPullButton () {
      // let lineGenerator = d3.line()
      //   .x(function (d) { return d.x })
      //   .y(function (d) { return d.y })
      // let dataPoints = [
      //   {x: reserved.box.w * 0, y: reserved.box.h * 0.31},
      //   {x: reserved.box.w * 0.56, y: reserved.box.h * 0.31},
      //   {x: reserved.box.w * 0.56, y: reserved.box.h * 0.85},
      //   {x: reserved.box.w * 0.33, y: reserved.box.h * 1},
      //   {x: reserved.box.w * 0.1, y: reserved.box.h * 0.85},
      //   {x: reserved.box.w * 0.1, y: reserved.box.h * 0.6},
      //   {x: reserved.box.w * 0.1, y: reserved.box.h * 0.6},
      //   {x: reserved.box.w * 0, y: reserved.box.h * 0.6}
      // ]
      // reserved.pull.child.warningTriangle = reserved.pull.g.append('path')
      //   .data([dataPoints])
      //   .attr('class', 'line')
      //   .attr('d', lineGenerator)
      //   .attr('fill', colorPalette.dark.greyBlue[7])
      //   .attr('stroke-width', 3)

      createWarning('pull')

      reserved.pull.child.buttonBack = reserved.g.append('rect')
        .attr('width', reserved.pull.box.h * 0.48)
        .attr('height', reserved.pull.box.h * 0.48)
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.88 - reserved.pull.box.h * 0.24)
        .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.78 - reserved.pull.box.h * 0.24)
        .attr('fill', colorTheme.bright.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.6)
      reserved.pull.child.buttonIcon = reserved.g.append('svg:image')
        .attr('class', 'icon')
        .attr('xlink:href', '/static/arrow-up.svg')
        .attr('width', reserved.pull.box.h * 0.48)
        .attr('height', reserved.pull.box.h * 0.48)
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.88 - reserved.pull.box.h * 0.24)
        .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.78 - reserved.pull.box.h * 0.24)
        .on('click', function () {
          pullData()
        })
      reserved.pull.child.infoText = reserved.g.append('text')
        .text(function (d) {
          return 'PULL'
        })
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.89 + reserved.pull.box.h * 0.24)
        .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.78 + reserved.pull.box.h * 0.14)
        .attr('text-anchor', 'start')
        .style('font-weight', 'bold')
        .style('font-size', reserved.box.h * 0.3)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.bright.text)

      reserved.pull.g.attr('opacity', 0)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('opacity', 1)
    }
    function createMergeButton () {
      reserved.pull.child.buttonBack = reserved.g.append('rect')
        .attr('width', reserved.pull.box.h * 0.48)
        .attr('height', reserved.pull.box.h * 0.48)
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.88 - reserved.pull.box.h * 0.24)
        .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.22 - reserved.pull.box.h * 0.24)
        .attr('fill', colorTheme.bright.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.6)
      reserved.pull.child.buttonIcon = reserved.g.append('svg:image')
        .attr('class', 'icon')
        .attr('xlink:href', '/static/arrow-up.svg')
        .attr('width', reserved.pull.box.h * 0.48)
        .attr('height', reserved.pull.box.h * 0.48)
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.88 - reserved.pull.box.h * 0.24)
        .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.22 - reserved.pull.box.h * 0.24)
        .on('click', function () {
          pullData()
        })
      reserved.pull.child.infoText = reserved.g.append('text')
        .text(function (d) {
          return 'MERGE'
        })
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.89 + reserved.pull.box.h * 0.24)
        .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.22 + reserved.pull.box.h * 0.1)
        .attr('text-anchor', 'start')
        .style('font-weight', 'bold')
        .style('font-size', reserved.box.h * 0.3)
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
      reserved.push.child.buttonBack = reserved.g.append('rect')
        .attr('width', reserved.pull.box.h * 0.48)
        .attr('height', reserved.pull.box.h * 0.48)
        .attr('x', reserved.push.box.x + reserved.pull.box.w * 0.12 - reserved.pull.box.h * 0.24)
        .attr('y', reserved.push.box.y + reserved.pull.box.h * 0.5 - reserved.pull.box.h * 0.24)
        .attr('fill', colorTheme.bright.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.6)
      reserved.push.child.buttonIcon = reserved.g.append('svg:image')
        .attr('class', 'icon')
        .attr('xlink:href', '/static/arrow-up.svg')
        .attr('width', reserved.pull.box.h * 0.48)
        .attr('height', reserved.pull.box.h * 0.48)
        .attr('x', reserved.push.box.x + reserved.pull.box.w * 0.12 - reserved.pull.box.h * 0.24)
        .attr('y', reserved.push.box.y + reserved.pull.box.h * 0.5 - reserved.pull.box.h * 0.24)
        .on('click', function () {
          pushNewBlockQueue()
        })

      reserved.push.child.infoText = reserved.g.append('text')
        .text(function (d) {
          return 'PUSH'
        })
        .attr('x', reserved.push.box.x + reserved.push.box.w * 0.11 - reserved.pull.box.h * 0.24)
        .attr('y', reserved.push.box.y + reserved.push.box.h * 0.5 + reserved.push.box.h * 0.1)
        .attr('text-anchor', 'end')
        .style('font-weight', 'bold')
        .style('font-size', reserved.box.h * 0.3)
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
        x: reserved.pull.box.x * reserved.box.w,
        y: reserved.pull.box.y * reserved.box.h,
        w: reserved.pull.box.w * reserved.box.w,
        h: reserved.pull.box.h * reserved.box.h
      }
      reserved.pull.g = reserved.g.append('g')
        .attr('transform', 'translate(' + reserved.pull.box.x + ',' + reserved.pull.box.y + ')')
    }
    function initPush () {
      reserved.push.box = {
        x: reserved.push.box.x * reserved.box.w,
        y: reserved.push.box.y * reserved.box.h,
        w: reserved.push.box.w * reserved.box.w,
        h: reserved.push.box.h * reserved.box.h
      }
      reserved.push.g = reserved.g.append('g')
        .attr('transform', 'translate(' + reserved.push.box.x + ',' + reserved.push.box.y + ')')
    }

    function initData (optIn) {
      reserved = optIn
      reserved.g.attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')

      initPull()
      initPush()
      // reserved.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.box.w)
      //   .attr('height', reserved.box.h)
      //   .attr('fill', '#999999')
      createMergeButton()
      createPushButton()
      createPullButton()
    }
    this.initData = initData

    function updateData () {

    }
    this.updateData = updateData
  }

  let SvgMiddleInfo = function () {
    let template = {
      tag: 'scheduleModification',
      g: undefined,
      box: {x: 1, y: 1, w: 1, h: 1},
      panelManager: undefined,
      panel: {
        current: undefined,
        all: []
      },
      tab: {
        g: undefined,
        box: {x: 1, y: 1, w: 1, h: 1},
        child: {}
      },
      content: {
        g: undefined,
        box: {x: 1, y: 1, w: 1, h: 1},
        child: {}
      },
      data: {
        lastRawData: undefined,
        formatedData: undefined,
        modifications: {
          SB1: {
            modifications: [
              {prop: 'prop1', old: 'Old Value', new: 'New Value'},
              {prop: 'prop2', old: 'Old Value', new: 'New Value'},
              {prop: 'prop3', old: 'Old Value', new: 'New Value'},
              {prop: 'prop4', old: 'Old Value', new: 'New Value'}
            ],
            blocks: {
              B2: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop3', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop4', old: 'Old Value', new: 'New Value'}
                ]
              },
              B3: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'}
                ]
              }
            }
          },
          SB3: {
            modifications: [
              {prop: 'prop1', old: 'Old Value', new: 'New Value'},
              {prop: 'prop2', old: 'Old Value', new: 'New Value'},
              {prop: 'prop3', old: 'Old Value', new: 'New Value'},
              {prop: 'prop4', old: 'Old Value', new: 'New Value'},
              {prop: 'prop5', old: 'Old Value', new: 'New Value'}
            ],
            blocks: {
              B2: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'}
                ]
              }
            }
          },
          SB7: {
            modifications: [
              {prop: 'prop1', old: 'Old Value', new: 'New Value'},
              {prop: 'prop2', old: 'Old Value', new: 'New Value'},
              {prop: 'prop3', old: 'Old Value', new: 'New Value'},
              {prop: 'prop4', old: 'Old Value', new: 'New Value'},
              {prop: 'prop5', old: 'Old Value', new: 'New Value'},
              {prop: 'prop6', old: 'Old Value', new: 'New Value'}
            ],
            blocks: {
              B1: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop3', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop4', old: 'Old Value', new: 'New Value'}
                ]
              },
              B5: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop3', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop4', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop5', old: 'Old Value', new: 'New Value'}
                ]
              }
            }
          }
        }
      },
      debug: {
        enabled: false
      }
    }
    let reserved = template
    let defaultPanel

    // function changeFocusElement (type, data) {
    //   for (let i = 0; i < currentPanels.length; i++) {
    //     panelManager.removePanel(currentPanels[i])
    //   }
    //   currentPanels = []
    //
    //   if (type === 'block') {
    //     createBlockPanels(data)
    //   } else if (type === 'event') {
    //     createEventPanels(data)
    //   }
    // }
    // this.changeFocusElement = changeFocusElement
    function drawCurrentContent (g) {
      let dimBack = {x: 1.5, y: 5, w: Number(g.attr('width')) * 0.98, h: Number(g.attr('height') * 0.99)}
      let dimLeft = {x: 2, y: 2, w: Number(g.attr('width')) * 0.15, h: Number(g.attr('height')) * 1}
      let dimTop = {x: Number(g.attr('width')) * 0.17, y: 0 + Number(g.attr('height') * 0.085), w: Number(g.attr('width')) * 0.78, h: Number(g.attr('height')) * 0.28}
      let dimMiddle = {x: Number(g.attr('width')) * 0.17, y: Number(g.attr('height')) * 0.38, w: Number(g.attr('width')) * 0.78, h: Number(g.attr('height') * 0.27)}
      let dimBottom = {x: Number(g.attr('width')) * 0.17, y: 0 + Number(g.attr('height') * 0.7), w: Number(g.attr('width')) * 0.78, h: Number(g.attr('height')) * 0.28}

      g.selectAll('*').remove()
      g.append('rect')
        .attr('class', 'back')
        .attr('x', dimBack.x)
        .attr('y', dimBack.y)
        .attr('rx', 1)
        .attr('ry', 1)
        .attr('width', dimBack.w)
        .attr('height', dimBack.h)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke-width', 0.2)
        .attr('stroke-opacity', 1)

      // g.append('rect')
      //   .attr('class', 'back')
      //   .attr('x', dimBottom.x)
      //   .attr('y', dimBottom.y)
      //   .attr('rx', 3)
      //   .attr('ry', 3)
      //   .attr('width', dimBottom.w)
      //   .attr('height', dimBottom.h)
      //   .attr('stroke', 'none')
      //   .attr('fill', colorTheme.darker.background)
      //   .attr('stroke-width', 6)
      //   .attr('stroke-opacity', 1)
      shared.schedBlocks = {
        g: g.append('g'),
        box: dimLeft
      }
      shared.modifications = {
        g: g.append('g'),
        box: dimMiddle
      }
      shared.conflicts = {
        g: g.append('g'),
        box: dimBottom
      }
      shared.information = {
        g: g.append('g'),
        box: dimTop
      }

      svgSchedulingBlocksOverview.initData(shared.schedBlocks)
      svgModifications.initData(shared.modifications)
      svgConflicts.initData(shared.conflicts)
      svgInformation.initData(shared.information)
    }
    function drawCurrentTab (g, data) {
      g.selectAll('*').remove()
      let dataPoints = [
        {x: Number(g.attr('width')) * 0.1, y: 0},
        {x: Number(g.attr('width')) * 0.96, y: 0},
        {x: Number(g.attr('width')) * 0.96, y: Number(g.attr('height')) + 1},
        {x: Number(g.attr('width')) * 0.02, y: Number(g.attr('height')) + 1},
        {x: Number(g.attr('width')) * 0.02, y: Number(g.attr('height')) * 0.5},
        {x: Number(g.attr('width')) * 0.1, y: 0}
      ]
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      g.append('path')
        .attr('class', 'back')
        .data([dataPoints])
        .attr('d', lineGenerator)
        // .attr('x', 3)
        // .attr('y', 0)
        // .attr('width', Number(g.attr('width')) - 6)
        // .attr('height', Number(g.attr('height')) - 1)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke-width', 0.2)
        .attr('stroke-opacity', 1)
        .attr('stroke', colorTheme.darker.stroke)
      g.append('text')
        .attr('class', 'tabName')
        .text(function () {
          return 'Schedule:' + data.index
        })
        .attr('x', Number(g.attr('width')) / 2)
        .attr('y', Number(g.attr('height')) / 2)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', Number(g.attr('height')) * 0.6)
        .attr('dy', Number(g.attr('height')) * 0.3)
        .style('pointer-events', 'none')
        .attr('fill', colorTheme.darker.text)
        .attr('stroke', 'none')
    }
    function duplicateTab () {
      shared.data.copy.push(deepCopy(shared.data.copy[shared.data.current]))
      shared.data.current = shared.data.copy.length - 1
      // for (var key in shared.data.copy[shared.data.current].original.blocks) {
      //   for (var i = 0; i < shared.data.copy[shared.data.current].original.blocks[key].length; i++) {
      //     shared.data.copy[shared.data.current].original.blocks[key][i].modifications = {
      //       modified: false,
      //       userModifications: {},
      //       optimizerModifications: {}
      //     }
      //   }
      // }
      // shared.data.copy[shared.data.current].modified = deepCopy(shared.data.copy[shared.data.current].original)
      // shared.data.copy[shared.data.current].optimized = deepCopy(shared.data.copy[shared.data.current].original)

      //updateAllBlocksQueue()

      let newPanel = new CustomPanel()
      newPanel.init({
        id: 'sched-' + (shared.data.copy.length - 1),
        opt: {
          focusable: true,
          focusOnCreation: true,
          insert: 'after'
        },
        tab: {
          g: undefined,
          repaint: drawCurrentTab,
          select: selectTab,
          unselect: unselectTab,
          close: () => {}
        },
        content: {
          g: undefined,
          repaint: drawCurrentContent
        },
        data: {
          index: shared.data.copy.length - 1
        }
      })
      reserved.panelManager.addNewPanel(newPanel)
    }

    function unselectTab (g, data) {
      let dataPoints = [
        {x: Number(g.attr('width')) * 0.1, y: 0},
        {x: Number(g.attr('width')) * 0.96, y: 0},
        {x: Number(g.attr('width')) * 0.96, y: Number(g.attr('height')) + 1},
        {x: Number(g.attr('width')) * 0.02, y: Number(g.attr('height')) + 1},
        {x: Number(g.attr('width')) * 0.02, y: Number(g.attr('height')) * 0.5},
        {x: Number(g.attr('width')) * 0.1, y: 0}
      ]
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      g.select('path.back')
        .data([dataPoints])
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
      g.select('text.tabName')
        .text(function () {
          return 'Schedule:' + data.index
        })
        .attr('x', Number(g.attr('width')) * 0.5)
        .attr('fill', colorTheme.darker.text)
      g.selectAll('rect.copyTab').remove()
    }
    function selectTab (g, data) {
      shared.data.current = data.index
      updateAllBlocksQueue()

      let dataPoints = [
        {x: Number(g.attr('width')) * 0.02, y: 0},
        {x: Number(g.attr('width')) * 0.96, y: 0},
        {x: Number(g.attr('width')) * 0.96, y: Number(g.attr('height')) * 1.1},
        {x: Number(g.attr('width')) * 0.02, y: Number(g.attr('height')) * 1.1},
        {x: Number(g.attr('width')) * 0.02, y: 0}
      ]
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      g.select('path.back')
        .data([dataPoints])
        .attr('d', lineGenerator)
        // .attr('height', Number(g.attr('height')) + 16)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
      g.select('text.tabName')
        .text(function () {
          return 'Sched:' + data.index
        })
        .attr('x', Number(g.attr('width')) / 3)
        .attr('fill', colorTheme.dark.text)

      g.append('rect')
        .attr('class', 'copyTab')
        .attr('x', Number(g.attr('width')) * 0.7)
        .attr('y', Number(g.attr('height')) * 0.3)
        .attr('width', Number(g.attr('height')) * 0.72)
        .attr('height', Number(g.attr('height')) * 0.6)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke-width', 3.5)
        .attr('stroke-opacity', 1)
        .attr('stroke', colorTheme.darker.background)
        .on('click', function () {
          d3.event.stopPropagation()
          duplicateTab()
        })
    }

    function initData (dataIn) {
      reserved = dataIn
      reserved.g.attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')

      reserved.panelManager = new PanelManager()
      reserved.panelManager.init({
        tag: 'tagDefaultPanelManager',
        g: reserved.g,
        box: reserved.box,
        tab: {
          enabled: true,
          g: reserved.g.append('g'),
          box: reserved.tab.box,
          dimension: {w: 0, h: 0},
          dragable: false,
          closable: false
        },
        content: {
          enabled: true,
          g: reserved.g.append('g'),
          box: reserved.content.box
        },
        panels: {
          current: undefined,
          all: []
        },
        options: {
          dragable: false,
          closable: false
        },
        debug: false
      })

      defaultPanel = new CustomPanel()
      defaultPanel.init({
        id: 'sched-0',
        opt: {
          focusable: true,
          focusOnCreation: true,
          insert: 'after'
        },
        tab: {
          g: undefined,
          repaint: drawCurrentTab,
          select: selectTab,
          unselect: unselectTab,
          close: () => {}
        },
        content: {
          g: undefined,
          repaint: drawCurrentContent
        },
        data: {index: 0}
      })
      reserved.panelManager.addNewPanel(defaultPanel)

      // let newTab = new CustomPanel()
      // newTab.init({
      //   id: 'newTab',
      //   opt: {
      //     focusable: false,
      //     focusOnCreation: false,
      //     insert: 'last'
      //   },
      //   tab: {
      //     g: undefined,
      //     repaint: drawNewTab,
      //     select: createNewTab,
      //     unselect: () => {},
      //     close: () => {}
      //   },
      //   content: {
      //     g: undefined,
      //     repaint: () => {}
      //   },
      //   data: {index: 0}
      // })
      // reserved.panelManager.addNewPanel(newTab)
    }
    this.initData = initData

    function update () {
      reserved.panelManager.updateInformation()
    }
    this.update = update
  }
  let SvgSchedulingBlocksOverview = function () {
    let template = {
      tag: 'schedulingBlocksOverview',
      g: undefined,
      box: {x: 0, y: 0, w: 0, h: 0},
      formatedData: undefined
    }
    let reserved = template

    function initData (optIn) {
      reserved.g = optIn.g
      reserved.box = optIn.box

      reserved.g.attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      reserved.g.append('rect')
        .attr('class', 'title')
        .attr('x', 0)
        .attr('y', 5)
        .attr('width', reserved.box.w)
        .attr('height', 30)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', 'none')
        .attr('stroke-width', 0.2)
        .attr('stroke-opacity', 1)
        .attr('stroke-dasharray', [0, reserved.box.w + 4, 26 + reserved.box.w - 4, 30])
      reserved.g.append('text')
        .text(function (data) {
          return 'Scheduling'
        })
        .attr('x', reserved.box.w * 0.5)
        .attr('y', 16)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', 9)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', colorTheme.dark.text)
        .attr('stroke', 'none')
      reserved.g.append('text')
        .text(function (data) {
          return 'Blocks'
        })
        .attr('x', reserved.box.w * 0.1)
        .attr('y', 30)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'start')
        .style('font-size', 9)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', colorTheme.dark.text)
        .attr('stroke', 'none')
      reserved.g.append('rect')
        .attr('class', 'extend')
        .attr('x', reserved.box.w * 0.65)
        .attr('y', 19)
        .attr('width', reserved.box.w * 0.27)
        .attr('height', 14)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', 'transparent')
        .attr('stroke-width', 0)
        .attr('stroke-opacity', 0)
        .on('mouseover', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', colorTheme.darker.background)
        })
        .on('mouseout', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', 'transparent')
        })
        .on('click', function () {
          hide()
        })

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: reserved.box.w * 0.7, y: 28},
        {x: reserved.box.w * 0.785, y: 24},
        {x: reserved.box.w * 0.87, y: 28}
      ]
      reserved.g.append('path')
        .data([dataPoint])
        .attr('class', 'arrow')
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', colorTheme.dark.stroke)
        .style('pointer-events', 'none')

      reserved.g.append('rect')
        .attr('class', 'back')
        .attr('x', 0)
        .attr('y', 35)
        .attr('width', reserved.box.w)
        .attr('height', reserved.box.h - 48)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', 'none')
        .attr('stroke-width', 0.4)
        .attr('stroke-opacity', 1)
        .attr('stroke-dasharray', [0, 4, reserved.box.w - 4 + (reserved.box.h - 48) + reserved.box.w - 4, (reserved.box.h - 48)])
      reserved.fo = reserved.g.append('foreignObject')
        .attr('width', reserved.box.w + 'px')
        .attr('height', reserved.box.h - 48 + 'px')
        .attr('x', 0 + 'px')
        .attr('y', 35 + 'px')
      reserved.rootDiv = reserved.fo.append('xhtml:div')
        .attr('class', 'overflowVerticalDiv')
      // reserved.innerDiv = reserved.rootDiv.append('div')
      //   .attr('width', '100%')
      //   .attr('height', reserved.box.h - 48 + 'px')
      reserved.svg = reserved.rootDiv.append('svg')
        .attr('width', '100%')
        .attr('height', '100%')

      if (shared.data.copy.length > 0) updateData()
    }
    this.initData = initData

    function populateShrink (schedGroup) {
      let length = schedGroup.length
      let dim = {h: reserved.box.w * 0.4, w: reserved.box.w * 0.5}

      let height = reserved.box.h - 48
      if (length * dim.h > (reserved.box.h - 48)) height = (length * dim.h)
      reserved.svg.attr('height', height + 'px')

      let schedulingBlocks = reserved.svg
        .selectAll('g.schedulingBlocks')
        .data(schedGroup, function (d) {
          return d.scheduleId
        })
      let enterSchedulingBlocks = schedulingBlocks
        .enter()
        .append('g')
        .attr('class', 'schedulingBlocks')
        .attr('transform', function (d, i) {
          let offset = (height - (length * dim.h)) / (length + 1)
          let translate = {
            y: (offset * (i + 1)) + (dim.h * i),
            x: (reserved.box.w * 0.5) - (dim.w * 0.5) // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
          }
          d.translate = translate
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterSchedulingBlocks.append('rect')
        .attr('class', 'background')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', function (d, i) {
          return dim.w
        })
        .attr('height', function (d, i) {
          return dim.h
        })
        .attr('fill', function (d, i) {
          return colorTheme.dark.background
        })
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
        .attr('stroke-dasharray', []) // [0, dim.w * 0.5, dim.w * 0.5 + dim.h * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5])
        .on('mouseover', function (d) {
          mainOverSchedBlocks(d.scheduleId)
        })
        .on('mouseout', function (d) {
          mainOutSchedBlocks(d.scheduleId)
        })
        .on('click', function (d) {
          mainFocusOnSchedBlocks(d.scheduleId)
        })
      enterSchedulingBlocks.append('text')
        .attr('class', 'name')
        .text(function (d) {
          return 'SB ' + d.schedName
        })
        .attr('x', function (d, i) {
          return dim.w * 0.5
        })
        .attr('y', function (d, i) {
          return dim.h * 0.2
        })
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', dim.h * 0.25)
        .attr('dy', dim.h * 0.15)
        .style('pointer-events', 'none')
        .attr('fill', colorTheme.darker.text)
        .attr('stroke', 'none')
      enterSchedulingBlocks.each(function (d) {
        let dimBlocks = dim.h * 0.16
        let length = d.blocks.length
        let offset = ((dim.w /* - dimBlocks * 2 */) - (length < 4 ? (dimBlocks * 1.2 * length) : (length % 2 === 0 ? (dimBlocks * 0.6 * length) : (dimBlocks * 0.7 * length)))) * 0.5

        d3.select(this).selectAll('rect.subBlocks')
          .data(d.blocks, function (d) {
            return d.obId
          })
          .enter()
          .append('rect')
          .attr('class', 'subBlocks')
          .attr('x', function (d, i) {
            return offset + (length < 4 ? (dimBlocks * i * 1.2) : (length % 2 === 0 ? (0.6 * dimBlocks * (i - (i % 2))) : (dimBlocks * i * 0.6)))
          })
          .attr('y', function (d, i) {
            return dim.h - dimBlocks * 1.8 - (length < 4 ? dimBlocks * 0.5 : dimBlocks * 1.2 * (i % 2))
          })
          .attr('width', function (d, i) {
            return dimBlocks
          })
          .attr('height', function (d, i) {
            return dimBlocks
          })
          .attr('fill', function (d, i) {
            return setCol(d).background
          })
          .style('opacity', 1)
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2)
          .style('pointer-events', 'none')
      })

      schedulingBlocks = enterSchedulingBlocks.merge(schedulingBlocks)
      schedulingBlocks.each(function (d) {
        d3.select(this).selectAll('rect.subBlocks')
          .data(d.blocks, function (d) {
            return d.obId
          })
          .transition()
          .duration(800)
          .attr('fill', function (d, i) {
            return setCol(d).background
          })
      })
    }

    function show () {
      reserved.fo
        .transition()
        .duration(1000)
        .attr('height', reserved.box.h - 48)
      reserved.g.select('rect.back')
        .transition()
        .duration(1000)
        .attr('height', reserved.box.h - 48)
        .attr('stroke-dasharray', [0, 4, reserved.box.w - 4 + (reserved.box.h - 48) + reserved.box.w - 4, (reserved.box.h - 48)])
        .on('end', function () {
          reserved.rootDiv.style('overflow-y', 'scroll')
        })
      reserved.g.select('rect.extend')
        .on('click', function () {
          hide()
        })

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: reserved.box.w * 0.7, y: 28},
        {x: reserved.box.w * 0.785, y: 24},
        {x: reserved.box.w * 0.87, y: 28}
      ]
      reserved.g.select('path.arrow')
        .data([dataPoint])
        .transition()
        .duration(400)
        .attr('d', lineGenerator)
    }

    function hide () {
      reserved.rootDiv.style('overflow-y', 'hidden')
      reserved.fo
        .transition()
        .duration(1000)
        .attr('height', 0)
      reserved.g.select('rect.back')
        .transition()
        .duration(1000)
        .attr('height', 0)
        .attr('stroke-dasharray', [0, 4, reserved.box.w - 4 + 0 + reserved.box.w - 4, 0])
      reserved.g.select('rect.extend')
        .on('click', function () {
          show()
        })

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: reserved.box.w * 0.7, y: 24},
        {x: reserved.box.w * 0.785, y: 28},
        {x: reserved.box.w * 0.87, y: 24}
      ]
      reserved.g.select('path.arrow')
        .data([dataPoint])
        .transition()
        .duration(400)
        .attr('d', lineGenerator)
    }

    function focusOnSchedBlocks (schedId) {
      unfocusOnSchedBlocks()
      reserved.g.selectAll('g.schedulingBlocks rect.background')
        .attr('fill', function (d) {
          return (d.scheduleId === schedId ? colorTheme.darker.background : colorTheme.dark.background)
        })
        .attr('stroke-width', function (d) {
          return (d.scheduleId === schedId ? 2 : 0.2)
        })
    }
    this.focusOnSchedBlocks = focusOnSchedBlocks
    function unfocusOnSchedBlocks () {
      reserved.g.selectAll('g.schedulingBlocks rect.background')
        .attr('fill', function (d) {
          return colorTheme.dark.background
        })
        .attr('stroke-width', function (d) {
          return 0.2
        })
    }
    this.unfocusOnSchedBlocks = unfocusOnSchedBlocks

    function overSchedBlocks (schedId) {
      reserved.g.selectAll('g.schedulingBlocks rect.background')
        .attr('stroke-width', function (d) {
          return (d.scheduleId === schedId ? 2 : d3.select(this).attr('stroke-width'))
        })
    }
    this.overSchedBlocks = overSchedBlocks
    function outSchedBlocks (schedId) {
      reserved.g.selectAll('g.schedulingBlocks rect.background')
        .attr('stroke-width', function (d) {
          return 0.2 // (d.scheduleId === schedId ? 0.2 : d3.select(this).attr('stroke-width'))
        })
    }
    this.outSchedBlocks = outSchedBlocks

    function update () {

    }
    this.update = update
    function updateData () {
      let schedGroup = groupBlocksBySchedule(shared.data.copy[shared.data.current].modified.blocks)
      populateShrink(schedGroup)
    }
    this.updateData = updateData
  }
  let SvgModifications = function () {
    let template = {
      tag: 'SvgModification',
      g: undefined,
      box: {x: 1, y: 1, w: 1, h: 1},
      data: {
        lastRawData: undefined,
        formatedData: undefined,
        modifications: {
          SB1: {
            modifications: [
              {prop: 'prop1', old: 'Old Value', new: 'New Value'},
              {prop: 'prop2', old: 'Old Value', new: 'New Value'},
              {prop: 'prop3', old: 'Old Value', new: 'New Value'},
              {prop: 'prop4', old: 'Old Value', new: 'New Value'}
            ],
            blocks: {
              B2: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop3', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop4', old: 'Old Value', new: 'New Value'}
                ]
              },
              B3: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'}
                ]
              }
            }
          },
          SB3: {
            modifications: [
              {prop: 'prop1', old: 'Old Value', new: 'New Value'},
              {prop: 'prop2', old: 'Old Value', new: 'New Value'},
              {prop: 'prop3', old: 'Old Value', new: 'New Value'},
              {prop: 'prop4', old: 'Old Value', new: 'New Value'},
              {prop: 'prop5', old: 'Old Value', new: 'New Value'}
            ],
            blocks: {
              B2: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'}
                ]
              }
            }
          },
          SB7: {
            modifications: [
              {prop: 'prop1', old: 'Old Value', new: 'New Value'},
              {prop: 'prop2', old: 'Old Value', new: 'New Value'},
              {prop: 'prop3', old: 'Old Value', new: 'New Value'},
              {prop: 'prop4', old: 'Old Value', new: 'New Value'},
              {prop: 'prop5', old: 'Old Value', new: 'New Value'},
              {prop: 'prop6', old: 'Old Value', new: 'New Value'}
            ],
            blocks: {
              B1: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop3', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop4', old: 'Old Value', new: 'New Value'}
                ]
              },
              B5: {
                modifications: [
                  {prop: 'prop1', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop2', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop3', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop4', old: 'Old Value', new: 'New Value'},
                  {prop: 'prop5', old: 'Old Value', new: 'New Value'}
                ]
              }
            }
          }
        }
      },
      debug: {
        enabled: false
      }
    }
    let reserved = template
    function initData (optIn) {
      reserved.g = optIn.g
      reserved.box = optIn.box

      optIn.g.append('line')
        .attr('x1', optIn.box.x)
        .attr('y1', optIn.box.y + 14)
        .attr('x2', optIn.box.x + optIn.box.w)
        .attr('y2', optIn.box.y + 14)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('stroke-opacity', 1)
      optIn.g.append('text')
        .text(function (data) {
          return 'Modifications'
        })
        .attr('x', optIn.box.x)
        .attr('y', optIn.box.y + 11)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'start')
        .style('font-size', 11)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', colorTheme.dark.text)
        .attr('stroke', 'none')

      optIn.g.append('rect')
        .attr('class', 'extend')
        .attr('x', optIn.box.x + optIn.box.w - 24)
        .attr('y', optIn.box.y)
        .attr('width', 18)
        .attr('height', 13)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', 'transparent')
        .attr('stroke-width', 0)
        .attr('stroke-opacity', 0)
        .on('mouseover', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', colorTheme.darker.background)
        })
        .on('mouseout', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', 'transparent')
        })
        .on('click', function () {
          hide()
        })
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: optIn.box.x + optIn.box.w - 20, y: optIn.box.y + 4},
        {x: optIn.box.x + optIn.box.w - 15, y: optIn.box.y + 9},
        {x: optIn.box.x + optIn.box.w - 10, y: optIn.box.y + 4}
      ]
      optIn.g.append('path')
        .data([dataPoint])
        .attr('class', 'arrow')
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', colorTheme.dark.stroke)
        .style('pointer-events', 'none')

      createModificationsList()
      drawModifications()
    }
    this.initData = initData
    function update () {
      console.log('updateModif');
      createModificationsList()
      drawModifications()
    }
    this.update = update

    function show () {
      reserved.g.select('rect.extend')
        .on('click', function () {
          hide()
        })

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: reserved.box.x + reserved.box.w - 20, y: reserved.box.y + 4},
        {x: reserved.box.x + reserved.box.w - 15, y: reserved.box.y + 9},
        {x: reserved.box.x + reserved.box.w - 10, y: reserved.box.y + 4}
      ]
      reserved.g.select('path.arrow')
        .data([dataPoint])
        .transition()
        .duration(400)
        .attr('d', lineGenerator)
    }
    function hide () {
      reserved.g.select('rect.extend')
        .on('click', function () {
          show()
        })

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: reserved.box.x + reserved.box.w - 20, y: reserved.box.y + 9},
        {x: reserved.box.x + reserved.box.w - 15, y: reserved.box.y + 4},
        {x: reserved.box.x + reserved.box.w - 10, y: reserved.box.y + 9}
      ]
      reserved.g.select('path.arrow')
        .data([dataPoint])
        .transition()
        .duration(400)
        .attr('d', lineGenerator)
    }

    function drawModifications () {
      let formBox = deepCopy(reserved.box)
      formBox.y += 20
      formBox.height -= 20
      if (reserved.data.modifications.childs.length === 0) {
        // let scrollForm = new ScrollForm({
        //   main: {
        //     g: reserved.g,
        //     box: formBox,
        //     colorTheme: colorTheme
        //   },
        //   titles: {
        //     data: [
        //       // {
        //       //   title: 'Schedule unchanged',
        //       //   extension: '',
        //       //   sortOptions: {
        //       //
        //       //   },
        //       //   width: '100%',
        //       //   quickScroll: true,
        //       //   anchor: 'center'
        //       // }
        //     ],
        //     height: '20px'
        //   },
        //   quickScroll: {
        //     enabled: true,
        //     width: '3%'
        //   },
        //   data: {}
        // })
      } else {
        let scrollForm = new ScrollForm({
          main: {
            g: reserved.g,
            box: formBox,
            colorTheme: colorTheme
          },
          titles: {
            data: [
              {
                title: 'Sched-Blocks',
                sortOptions: {

                },
                width: '50%',
                quickScroll: true,
                anchor: 'center'
              },
              {
                title: 'Blocks',
                sortOptions: {

                },
                width: '50%',
                quickScroll: true,
                anchor: 'center'
              }
            ],
            height: '20px'
          },
          quickScroll: {
            enabled: true,
            width: '3%'
          },
          data: {}
        })
        scrollForm.updateData(reserved.data.modifications, 'modification')
      }
    }
    function createModificationsList () {
      reserved.data.modifications = {title: {}, style: {}, childs: []}
      if (shared.data.copy.length === 0) return
      let groupBySched = groupBlocksBySchedule(shared.data.copy[shared.data.current].modified.blocks)

      for (let i = 0; i < groupBySched.length; i++) {
        let group = groupBySched[i]
        let sbInfo = {
          key: 'Sched.B: ' + group.schedName,
          format: 'plainText',
          style: {'default': 'subTitle'},
          childs: []
        }
        let bList = {title: {}, style: {}, childs: []}
        for (let j = 0; j < group.blocks.length; j++) {
          let block = group.blocks[j]
          if (!(Object.keys(block.modifications.userModifications).length === 0 && block.modifications.userModifications.constructor === Object)) {
            let b = '' + block.metaData.nObs
            let bInfo = {
              key: 'Block: ' + b,
              format: 'plainText',
              style: {'default': 'subTitle'},
              childs: []
            }
            for (let key in block.modifications.userModifications) {
              let modifList = block.modifications.userModifications[key]
              bInfo.childs.push({
                style: {'default': 'info'},
                format: 'modification',
                key: key,
                value: {
                  old: modifList[modifList.length - 1].old,
                  new: modifList[modifList.length - 1].new
                },
                childs: []
              })
            }
            for (let key in block.modifications.optimizerModifications) {
              let modifList = block.modifications.optimizerModifications[key]
              bInfo.childs.push({
                style: {'default': 'info'},
                format: 'modification',
                key: key,
                value: {
                  old: modifList[modifList.length - 1].old,
                  new: modifList[modifList.length - 1].new
                },
                childs: []
              })
            }

            bList.childs.push(bInfo)
          }
        }
        if (bList.childs.length > 0) reserved.data.modifications.childs.push([[sbInfo], [bList]])
        else if (sbInfo.childs.length > 0) reserved.data.modifications.childs.push(sbInfo)
      }
    }
  }
  let SvgConflicts = function () {
    let reserved = {}
    function initData (optIn) {
      reserved.g = optIn.g
      reserved.box = optIn.box

      optIn.g.append('line')
        .attr('x1', optIn.box.x)
        .attr('y1', optIn.box.y + 14)
        .attr('x2', optIn.box.x + optIn.box.w)
        .attr('y2', optIn.box.y + 14)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('stroke-opacity', 1)
      optIn.g.append('text')
        .text(function (data) {
          return 'Conflicts'
        })
        .attr('x', optIn.box.x)
        .attr('y', optIn.box.y + 11)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'start')
        .style('font-size', 11)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', colorTheme.dark.text)
        .attr('stroke', 'none')

      optIn.g.append('rect')
        .attr('class', 'extend')
        .attr('x', optIn.box.x + optIn.box.w - 24)
        .attr('y', optIn.box.y)
        .attr('width', 18)
        .attr('height', 13)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', 'transparent')
        .attr('stroke-width', 0)
        .attr('stroke-opacity', 0)
        .on('mouseover', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', colorTheme.darker.background)
        })
        .on('mouseout', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', 'transparent')
        })
        .on('click', function () {
          hide()
        })
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: optIn.box.x + optIn.box.w - 20, y: optIn.box.y + 4},
        {x: optIn.box.x + optIn.box.w - 15, y: optIn.box.y + 9},
        {x: optIn.box.x + optIn.box.w - 10, y: optIn.box.y + 4}
      ]
      optIn.g.append('path')
        .data([dataPoint])
        .attr('class', 'arrow')
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', colorTheme.dark.stroke)
        .style('pointer-events', 'none')
      // drawConflicts()
    }
    this.initData = initData

    function show () {
      reserved.g.select('rect.extend')
        .on('click', function () {
          hide()
        })

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: reserved.box.x + reserved.box.w - 20, y: reserved.box.y + 4},
        {x: reserved.box.x + reserved.box.w - 15, y: reserved.box.y + 9},
        {x: reserved.box.x + reserved.box.w - 10, y: reserved.box.y + 4}
      ]
      reserved.g.select('path.arrow')
        .data([dataPoint])
        .transition()
        .duration(400)
        .attr('d', lineGenerator)
    }
    function hide () {
      reserved.g.select('rect.extend')
        .on('click', function () {
          show()
        })

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: reserved.box.x + reserved.box.w - 20, y: reserved.box.y + 9},
        {x: reserved.box.x + reserved.box.w - 15, y: reserved.box.y + 4},
        {x: reserved.box.x + reserved.box.w - 10, y: reserved.box.y + 9}
      ]
      reserved.g.select('path.arrow')
        .data([dataPoint])
        .transition()
        .duration(400)
        .attr('d', lineGenerator)
    }

    function update () {
      // drawConflicts()
    }
    this.update = update

    function drawConflicts () {
      // g.append('circle')
      //   .attr('cx', dimMiddle.x + dimMiddle.w * 0.5)
      //   .attr('cy', dimMiddle.y + dimMiddle.h * 0.5)
      //   .attr('r', dimMiddle.h * 0.25)
      //   .attr('stroke-width', 8)
      //   .attr('stroke', colorPalette.dark.greyBlue[1])
      //   .attr('fill', 'none')
      // g.append('line')
      //   .attr('x1', dimMiddle.x + dimMiddle.w * 0.5 + dimMiddle.h * 0.3)
      //   .attr('y1', dimMiddle.y + dimMiddle.h * 0.5 - dimMiddle.h * 0.3)
      //   .attr('x2', dimMiddle.x + dimMiddle.w * 0.5 - dimMiddle.h * 0.3)
      //   .attr('y2', dimMiddle.y + dimMiddle.h * 0.5 + dimMiddle.h * 0.3)
      //   .attr('r', dimMiddle.h * 0.25)
      //   .attr('stroke-width', 8)
      //   .attr('stroke', colorPalette.dark.greyBlue[1])
      shared.conflicts.g.append('rect')
        .attr('class', 'bottom-back')
        .attr('x', shared.conflicts.box.x)
        .attr('y', shared.conflicts.box.y)
        .attr('rx', 2)
        .attr('width', shared.conflicts.box.w)
        .attr('height', shared.conflicts.box.h)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke-width', 0.2)
        .attr('stroke-opacity', 1)
      let conflicts = [
        {id: 'c1', type: 'shareTels', blocks: [{id: 'b1(1)'}, {id: 'b2(2)'}, {id: 'b7(0)'}]},
        {id: 'c2', type: 'shareTels', blocks: [{id: 'b9(2)'}, {id: 'b5(4)'}, {id: 'b2(1)'}]},
        {id: 'c3', type: 'shareTels', blocks: [{id: 'b2(5)'}, {id: 'b2(1)'}, {id: 'b7(4)'}, {id: 'b9(3)'}]},
        {id: 'c4', type: 'shareTels', blocks: [{id: 'b3(2)'}, {id: 'b5(3)'}]},
        {id: 'c5', type: 'shareTels', blocks: [{id: 'b5(1)'}, {id: 'b2(1)'}, {id: 'b8(3)'}, {id: 'b9(3)'}]},
        {id: 'c6', type: 'shareTels', blocks: [{id: 'b0(4)'}, {id: 'b3(3)'}, {id: 'b7(4)'}, {id: 'b11(1)'}]}
      ]
      let conflictBox = {x: shared.conflicts.box.x + shared.conflicts.box.w * 0.3,
        y: shared.conflicts.box.y,
        w: shared.conflicts.box.w * 0.7,
        h: shared.conflicts.box.h
      }

      let data = {nodes: [], links: []}
      // for (let i = 0; i < modifications.length; i++) {
      //   data.nodes.push({type: 'modification', id: modifications[i].id, data: modifications[i], fx: modifications[i].position.x, fy: modifications[i].position.y})
      //   for (let j = 0; j < modifications[i].conflicts.length; j++) {
      //     data.links.push({source: modifications[i].id, target: modifications[i].conflicts[j]})
      //   }
      // }
      // for (let i = 0; i < conflicts.length; i++) {
      //   data.nodes.push({type: 'conflict', id: conflicts[i].id, data: conflicts[i]})
      //   for (let j = 0; j < conflicts[i].blocks.length; j++) {
      //     let insert = true
      //     for (var z = 0; z < data.nodes.length; z++) {
      //       if (data.nodes[z].id === conflicts[i].blocks[j].id) insert = false
      //     }
      //     if (insert) {
      //       data.nodes.push({type: 'block', id: conflicts[i].blocks[j].id, data: conflicts[i].blocks[j]})
      //     }
      //     data.links.push({source: conflicts[i].id, target: conflicts[i].blocks[j].id})
      //   }
      // }

      for (let i = 0; i < conflicts.length; i++) {
        data.nodes.push({type: 'conflict', id: conflicts[i].id, data: conflicts[i]})
        for (let j = 0; j < (1 + Math.floor(Math.random() * 600)); j++) {
          data.nodes.push({type: 'tel', id: 'tel' + i + j, data: {}})
          data.links.push({type: 'short', source: conflicts[i].id, target: 'tel' + i + j})
        }
        for (let j = 0; j < conflicts[i].blocks.length; j++) {
          let insert = true
          for (var z = 0; z < data.nodes.length; z++) {
            if (data.nodes[z].id === conflicts[i].blocks[j].id) insert = false
          }
          if (insert) {
            // data.nodes.push({type: 'block', id: conflicts[i].blocks[j].id, data: conflicts[i].blocks[j]})
          }
          // data.links.push({type: 'long', source: conflicts[i].id, target: conflicts[i].blocks[j].id})
        }
      }

      let microRadius = 2
      let smallRadius = 4
      let bigRadius = 8
      let simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(function (d) { return d.id }))
        .force('collide', d3.forceCollide(function (d) {
          if (d.type === 'conflict') return bigRadius * 1.5
          if (d.type === 'block') return smallRadius * 1.5
          return microRadius
        }).iterations(32))
        .force('charge', d3.forceManyBody().strength(function (d) {
          if (d.type === 'conflict') return -60
          if (d.type === 'block') return -60
          if (d.type === 'tel') return 0
        }))
        .force('center', d3.forceCenter((conflictBox.w / 2), (conflictBox.h / 2)))
        .force('y', d3.forceY(0))
        .force('x', d3.forceX(0))
      simulation.nodes(data.nodes)
      simulation.force('link').links(data.links).distance(function (d) {
        if (d.type === 'short') return 1
        else return 20
      })

      var middleGroup = shared.conflicts.g.append('g')
        .attr('transform', 'translate(' + conflictBox.x + ',' + conflictBox.y + ')')

      middleGroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('width', conflictBox.w)
        .attr('height', conflictBox.h)
        .attr('stroke', 'none')
        .attr('fill', colorPalette.dark.greyBlue[5])
        .attr('fill-opacity', 0.04)
        .attr('stroke', colorPalette.dark.greyBlue[8])
        .attr('stroke-width', 4)
        .attr('stroke-opacity', 1)
        .attr('stroke-dasharray', [
          conflictBox.w * 0.3,
          conflictBox.w * 0.4,
          conflictBox.w * 0.3 + conflictBox.h * 0.3,
          conflictBox.h * 0.4,
          conflictBox.w * 0.3 + conflictBox.h * 0.3,
          conflictBox.w * 0.4,
          conflictBox.w * 0.3 + conflictBox.h * 0.3,
          conflictBox.h * 0.4,
          conflictBox.h * 0.3
        ])
        // .attr('stroke-dashoffset', conflictBox.w * 0.3)

      let defs = shared.conflicts.g.append('defs')
      let pattern = defs.append('pattern')
        .attr('id', 'patternMoved')
        .attr('x', '0')
        .attr('y', '0')
        .attr('width', conflictBox.w * 0.1)
        .attr('height', conflictBox.h * 0.1)
        .attr('fill', '#ffffff')
        .attr('patternUnits', 'userSpaceOnUse')
      pattern.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', conflictBox.w * 0.1)
        .attr('y2', conflictBox.h * 0.1)
        .attr('stroke', '#444444')
        .attr('stroke-width', 0.1)
      pattern.append('line')
        .attr('x1', conflictBox.w * 0.1)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', conflictBox.h * 0.1)
        .attr('stroke', '#444444')
        .attr('stroke-width', 0.1)
      middleGroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('width', conflictBox.w)
        .attr('height', conflictBox.h)
        .attr('stroke', colorPalette.dark.greyBlue[8])
        .attr('stroke-opacity', 1)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', [
          0,
          conflictBox.w * 0.3,
          conflictBox.w * 0.4,
          conflictBox.w * 0.3 + conflictBox.h * 0.3,
          conflictBox.h * 0.4,
          conflictBox.w * 0.3 + conflictBox.h * 0.3,
          conflictBox.w * 0.4,
          conflictBox.w * 0.3 + conflictBox.h * 0.3,
          conflictBox.h * 0.4,
          conflictBox.h * 0.3
        ])
        .style('fill', 'none')
        // .style('fill', 'url(#patternMoved)')

      var link = middleGroup.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .enter()
        .append('line')
        .attr('stroke', 'black')
        .attr('stroke-width', 0.4)

      var node = middleGroup.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(data.nodes)
        .enter().append('circle')
        .attr('id', function (d) { return d.id })
        .attr('r', function (d) {
          if (d.type === 'conflict') return bigRadius * 1.5
          if (d.type === 'block') return smallRadius * 1.5
          return microRadius
        })
        .attr('fill', colorPalette.dark.greyBlue[1])
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.2)

      let simulationDurationInMs = 3000
      let startTime = Date.now()
      let endTime = startTime + simulationDurationInMs
      simulation.on('tick', function () {
        if (Date.now() > endTime) {
          simulation.stop()
          return
        }
        link
          .attr('x1', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(radius, Math.min(conflictBox.w - radius, d.source.x)) })
          .attr('y1', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(radius, Math.min(conflictBox.h - radius, d.source.y)) })
          .attr('x2', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(radius, Math.min(conflictBox.w - radius, d.target.x)) })
          .attr('y2', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(radius, Math.min(conflictBox.h - radius, d.target.y)) })

        node
          .attr('cx', function (d) {
            let radius = (d.type === 'conflict' ? bigRadius : smallRadius)
            d.x = Math.max(radius, Math.min(conflictBox.w - radius, d.x))
            return d.x
          })
          .attr('cy', function (d) {
            let radius = (d.type === 'conflict' ? bigRadius : smallRadius)
            d.y = Math.max(radius, Math.min(conflictBox.h - radius, d.y))
            return d.y
          })
      })
    }
  }
  let SvgInformation = function () {
    let reserved = {}
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (optIn) {
      reserved = optIn
      reserved.g.attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      // createBackground()

      optIn.g.append('line')
        .attr('x1', 0)
        .attr('y1', 14)
        .attr('x2', optIn.box.w)
        .attr('y2', 14)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('stroke-opacity', 1)
      optIn.g.append('text')
        .text(function (data) {
          return 'Selection'
        })
        .attr('x', 0)
        .attr('y', 0 + 11)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'start')
        .style('font-size', 11)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', colorTheme.dark.text)
        .attr('stroke', 'none')

      optIn.g.append('rect')
        .attr('class', 'extend')
        .attr('x', 0 + optIn.box.w - 24)
        .attr('y', 0)
        .attr('width', 18)
        .attr('height', 13)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', 'transparent')
        .attr('stroke-width', 0)
        .attr('stroke-opacity', 0)
        .on('mouseover', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', colorTheme.darker.background)
        })
        .on('mouseout', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', 'transparent')
        })
        .on('click', function () {
          hide()
        })
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: optIn.box.w - 20, y: 4},
        {x: optIn.box.w - 15, y: 9},
        {x: optIn.box.w - 10, y: 4}
      ]
      optIn.g.append('path')
        .data([dataPoint])
        .attr('class', 'arrow')
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', colorTheme.dark.stroke)
        .style('pointer-events', 'none')

      if (shared.focus.block) createBlocksInfoPanel(shared.focus.block)
      else if (shared.focus.schedBlocks) focusOnSchedBlocks(shared.focus.schedBlocks)
      else createDefaultInfoPanel()
    }
    this.initData = initData
    function update () {

    }
    this.update = update
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function createBackground () {
      let dim = {
        x: 0,
        y: 0,
        w: reserved.box.w * 0.12,
        h: reserved.box.h,
        margH: reserved.box.h * 0.06
      }
      reserved.g.append('rect')
        .attr('class', 'bottom-back')
        .attr('x', -2)
        .attr('y', 0 - 0.2)
        .attr('rx', 2)
        .attr('width', dim.w + dim.margH)
        .attr('height', reserved.box.h + 0.4)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke-width', 0.1)
        .attr('stroke-opacity', 1)
      // reserved.g.append('rect')
      //   .attr('class', 'bottom-back')
      //   .attr('x', 0) // + dim.w + dim.margH - 0.2)
      //   .attr('y', 0) // - 0.2)
      //   .attr('width', reserved.box.w) // - dim.w - dim.margH + 0)
      //   .attr('height', reserved.box.h) // + 0.4)
      //   .attr('stroke', colorTheme.medium.stroke)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke-width', 0.1)
      //   .attr('stroke-opacity', 1)
    }
    function show () {
      reserved.g.select('rect.extend')
        .on('click', function () {
          hide()
        })

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: reserved.box.w - 20, y: 4},
        {x: reserved.box.w - 15, y: 9},
        {x: reserved.box.w - 10, y: 4}
      ]
      reserved.g.select('path.arrow')
        .data([dataPoint])
        .transition()
        .duration(400)
        .attr('d', lineGenerator)
    }
    function hide () {
      reserved.g.select('rect.extend')
        .on('click', function () {
          show()
        })

      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      let dataPoint = [
        {x: reserved.box.w - 20, y: 9},
        {x: reserved.box.w - 15, y: 4},
        {x: reserved.box.w - 10, y: 9}
      ]
      reserved.g.select('path.arrow')
        .data([dataPoint])
        .transition()
        .duration(400)
        .attr('d', lineGenerator)
    }
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function createDefaultInfoPanel () {
      let dim = {
        x: reserved.box.w * 0.15,
        y: 15,
        w: reserved.box.w * 0.85,
        h: reserved.box.h - 15,
        margH: reserved.box.h * 0.05
      }
      let schedulingBlocksInfoPanelG = reserved.g.append('g')
        .attr('class', 'form')
      let scrollForm = new ScrollForm({
        main: {
          g: schedulingBlocksInfoPanelG,
          box: {x: dim.x, y: dim.y, w: dim.w, h: dim.h},
          colorTheme: colorTheme
        },
        titles: {
          data: [
            {
              title: 'No Blocks/Sched.B selected',
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
          enabled: true,
          width: '3%'
        },
        data: {}
      })
      scrollForm.updateData({}, 'info')
    }
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function schedBlocksEvent (value, d) {
      addSchedBlocksModifications('svgInformation',
        shared.focus.schedBlocks,
        [{prop: (d.key.charAt(0).toLowerCase() + d.key.slice(1)), new: value}])
    }
    function createSBPropertiesList (id) {
      let sb = shared.data.copy[shared.data.current].schedBlocks[id]

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
          click: schedBlocksEvent,
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
          current: sb.exeState.canRun,
          select: ['true', 'false']
        },
        event: {
          click: schedBlocksEvent,
          mouseover: () => {},
          mouseout: () => {}
        },
        childs: []
      })

      let target = {
        key: 'Target',
        format: 'plainText',
        style: {'default': 'subTitle'},
        childs: []
      }
      target.childs.push({
        style: {'default': 'info'},
        format: 'comboList',
        key: 'id',
        value: {
          current: sb.target.id,
          select: ['trg_1', 'trg_2', 'trg_3', 'trg_4', 'trg_5']
        },
        event: {
          click: blockEvent,
          mouseover: () => {},
          mouseout: () => {}
        },
        childs: []
      })
      target.childs.push({
        style: {'default': 'info'},
        format: 'info',
        key: 'Name',
        value: sb.target.name,
        childs: []
      })
      target.childs.push({
        style: {'default': 'info'},
        format: 'info',
        key: 'pos',
        value: sb.target.pos,
        childs: []
      })
      target.childs.push({
        style: {'default': 'info'},
        format: 'info',
        key: 'observability',
        value: sb.target.observability,
        childs: []
      })

      let root = {title: {}, style: {}, childs: [exeState, target]}
      return root
    }
    function createSchedBlocksInfoPanel (data) {
      let dim = {
        x: reserved.box.w * 0.15,
        y: 15,
        w: reserved.box.w * 0.85,
        h: reserved.box.h - 15,
        margH: reserved.box.h * 0.05
      }
      let schedulingBlocksInfoPanelG = reserved.g.append('g')
        .attr('class', 'form')
      let scrollForm = new ScrollForm({
        main: {
          g: schedulingBlocksInfoPanelG,
          box: {x: dim.x, y: dim.y, w: dim.w, h: dim.h},
          colorTheme: colorTheme
        },
        titles: {
          data: [
            {
              title: 'Sched.Blocks ' + data.blocks[0].metaData.nSched,
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
          enabled: true,
          width: '3%'
        },
        data: {}
      })
      let sbPropList = createSBPropertiesList(data.scheduleId)
      scrollForm.updateData(sbPropList, 'info')
    }
    function createBlocksInScheduleIcons (data) {
      let dim = {
        x: 0,
        y: 32.5,
        w: reserved.box.w * 0.12,
        h: reserved.box.h - 30,
        margH: reserved.box.h * 0.05
      }

      let dimBlocks = {h: reserved.box.w * 0.15 * 0.4, w: reserved.box.w * 0.15 * 0.6}
      let length = data.blocks.length
      reserved.g.selectAll('g.subBlocks').remove()
      let subBlocks = reserved.g
        .selectAll('g.subBlocks')
        .data(data.blocks, function (d) {
          return d.metaData.blockName
        })

      let enterSubBlocks = subBlocks
        .enter()
        .append('g')
        .attr('class', 'subBlocks')
        .attr('transform', function (d, i) {
          let transX = 0
          let transY = dim.y + ((dim.h - (length * dimBlocks.h)) / (length + 1)) * (i + 1) + (dimBlocks.h * i)
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
        .attr('stroke-width', 0.2)
        .attr('stroke-dasharray', [])
        .on('mouseover', function (d) {
          mainOverBlock(d)
        })
        .on('mouseout', function (d) {
          mainOutBlock(d)
        })
        .on('click', function (d) {
          mainFocusOnBlock(d)
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

      subBlocks.each(function (d, i) {
        d3.select(this).select('rect.block')
          .transition()
          .duration(800)
          .attr('fill', function () {
            return reserved.style.recCol(d)
          })
      })
    }
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function blockEvent (value, d) {
      addBlockModifications('svgInformation',
        shared.focus.block,
        [{prop: (d.key.charAt(0).toLowerCase() + d.key.slice(1)), new: value}])
    }
    function createBPropertiesList (b) {
      let startHS = {
        style: {'default': 'info'},
        format: 'info',
        key: 'Start',
        value: b.startTime,
        event: {},
        childs: []
      }
      let durHS = {
        style: {'default': 'info'},
        format: 'info',
        key: 'Duration',
        value: b.duration,
        event: {},
        childs: []
      }
      let endHS = {
        style: {'default': 'info'},
        format: 'info',
        key: 'End',
        value: b.endTime,
        event: {},
        childs: []
      }
      let startS = {
        style: {'default': 'info'},
        format: 'info',
        key: '',
        value: b.startTime,
        event: {},
        childs: []
      }
      let durS = {
        style: {'default': 'info'},
        format: 'info',
        key: '',
        value: b.duration,
        event: {},
        childs: []
      }
      let endS = {
        style: {'default': 'info'},
        format: 'info',
        key: '',
        value: b.endTime,
        event: {},
        childs: []
      }
      let time = {
        key: 'Time',
        format: 'plainText',
        style: {'default': 'subTitle'},
        childs: [[[startHS, durHS, endHS], [startS, durS, endS]]]
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
          click: blockEvent,
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
          click: blockEvent,
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
        style: {'default': 'info'},
        format: 'info',
        key: 'Id',
        value: b.pointingId,
        event: {},
        childs: []
      })
      pointing.childs.push({
        style: {'default': 'info'},
        format: 'info',
        key: 'Name',
        value: b.pointingName,
        childs: []
      })
      pointing.childs.push({
        style: {'default': 'info'},
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
    function createBlocksInfoPanel (idBlock) {
      let data = getBlockById(idBlock).modified.data
      let dim = {
        x: reserved.box.w * 0.15,
        y: 15,
        w: reserved.box.w * 0.85,
        h: reserved.box.h - 15,
        margH: reserved.box.h * 0.05
      }
      let schedulingBlocksInfoPanelG = reserved.g.append('g')
        .attr('class', 'form')
      let scrollForm = new ScrollForm({
        main: {
          g: schedulingBlocksInfoPanelG,
          box: {x: dim.x, y: dim.y, w: dim.w, h: dim.h},
          colorTheme: colorTheme
        },
        titles: {
          data: [
            {
              title: 'Block: ' + data.metaData.blockName,
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
          enabled: true,
          width: '3%'
        },
        data: {}
      })
      let bPropList = createBPropertiesList(data)
      scrollForm.updateData(bPropList, 'info')
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function focusOnSchedBlocks (schedId) {
      reserved.g.selectAll('g').remove()
      let schedGroup = groupBlocksBySchedule(shared.data.copy[shared.data.current].modified.blocks)
      for (var i = 0; i < schedGroup.length; i++) {
        if (schedGroup[i].scheduleId === schedId) {
          createSchedBlocksInfoPanel(schedGroup[i])
          createBlocksInScheduleIcons(schedGroup[i])
        }
      }
    }
    this.focusOnSchedBlocks = focusOnSchedBlocks

    function unfocusSchedBlocks () {
      reserved.g.selectAll('g').remove()
      // createBackground()
      createDefaultInfoPanel()
    }
    this.unfocusSchedBlocks = unfocusSchedBlocks
    function unfocusBlock () {
      reserved.g.selectAll('g').remove()
    }
    this.unfocusBlock = unfocusBlock

    function focusOnBlock (bId) {
      unfocusOnBlock()
      reserved.g.selectAll('g.subBlocks rect.back')
        .each(function (d) {
          d3.select(this).attr('stroke-width', (d.obId === bId ? 2 : 0.2))
          if (d.obId === bId) createBlocksInfoPanel(bId)
        })
    }
    this.focusOnBlock = focusOnBlock
    function unfocusOnBlock () {
      reserved.g.selectAll('g.form').remove()
      reserved.g.selectAll('g.subBlocks rect.back')
        .attr('stroke-width', function (d) {
          return 0.2
        })
    }
    this.unfocusOnBlock = unfocusOnBlock

    function overBlock (bId) {
      reserved.g.selectAll('g.subBlocks rect.back')
        .attr('stroke-width', function (d) {
          return (d.obId === bId ? 2 : d3.select(this).attr('stroke-width'))
        })
    }
    this.overBlock = overBlock
    function outBlock (bId) {
      reserved.g.selectAll('g.subBlocks rect.back')
        .attr('stroke-width', function (d) {
          return (d.obId === bId ? 0.2 : d3.select(this).attr('stroke-width'))
        })
    }
    this.outBlock = outBlock
  }

  // let svgBlocksQueue = new SvgBlocksQueue()
  let svgBlocksQueueCreator = new SvgBlocksQueueCreator()
  let svgBlocksQueueModif = new SvgBlocksQueueModif()
  let svgBlocksQueueOptimized = new SvgBlockQueueOptimized()

  let svgWarningArea = new SvgWarningArea()

  let svgMiddleInfo = new SvgMiddleInfo()
  let svgSchedulingBlocksOverview = new SvgSchedulingBlocksOverview()
  let svgModifications = new SvgModifications()
  let svgConflicts = new SvgConflicts()
  let svgInformation = new SvgInformation()
}
