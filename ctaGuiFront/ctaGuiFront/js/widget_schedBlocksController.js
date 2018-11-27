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
  // sock.socket.on('arrZoomerGetDataS1', function (data) {
  //   if (sock.conStat.isOffline()) return
  //
  //   if (data.id !== '' && data.type === 's11') {
  //     // console.log('-server- getDataS1 ',data);
  //     if (hasVar(sock.widgetV[widgetType].widgets[data.widgetId])) {
  //       sock.widgetV[widgetType].widgets[data.widgetId].getDataS1(
  //         data.widgetId,
  //         data
  //       )
  //     }
  //   }
  // })
}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainSchedBlocksController = function (optIn) {
  // let myUniqueId = unique()
  let colorTheme = getColorTheme('bright-Grey')

  let colorPalette = {dark: {}, bright: {}}
  colorPalette.dark.greyBlue = ['#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238']
  // colorPalette.dark.grey = ['#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121']
  // colorPalette.bright.grey = ['#212121', '#424242', '#616161', '#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0', '#EEEEEE', '#F5F5F5', '#FAFAFA']

  let widgetType = optIn.widgetType
  let tagBlockQueue = 'blockQueue'
  let tagArrZoomerPlotsSvg = optIn.baseName

  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  let shared = {
    main: {
      data: {
        server: undefined,
        copy: {
          original: {},
          modified: {},
          optimized: {}
        },
        oldCopy: []
      },
      focus: {
        schedBlocks: undefined,
        block: undefined
      },
      formatedData: {
        schedGroup: []
      }
    },
    svgBlocksQueue: {

    },
    svgBlocksQueueCreator: {

    },
    svgWarningArea: {

    },
    svgSchedulingBlocksOverview: {

    },
    svgMiddleInfo: {},
    schedBlocks: {
      tag: 'schedulingBlocksOverview',
      g: undefined,
      box: {x: 0, y: 0, w: 0, h: 0},
      formatedData: undefined
    },
    modifications: {
      g: undefined,
      box: undefined
    },
    conflicts: {
      g: undefined,
      box: undefined
    },
    information: {
      g: undefined,
      box: undefined
    }
  }
  let reserved = {

  }
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
  locker.add('inInit')

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
      // .style('background', '#383B42')
      .append('svg')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '0 0 ' + lenD.w[0] + ' ' + lenD.h[0])
      .style('position', 'relative')
      .style('width', '100%')
      .style('height', '100%')
      .style('top', '0px')
      .style('left', '0px')
      // .attr('viewBox', '0 0 '+lenD.w[0]+' '+lenD.h[0] * whRatio)
      // .classed('svgInGridStack_inner', true)
      // .call(reserved.svgZoom)
      .on('dblclick.zoom', null)

    if (disableScrollSVG) {
      svg.svg.on('wheel', function () {
        d3.event.preventDefault()
      })
    }

    // reserved.svgZoomNode = svg.svg.nodes()[0]

    svg.g = svg.svg.append('g')
    createBackground()

    shared.main.data.server = dataIn.data

    svgBlocksQueue.initData()
    svgBlocksQueueOptimized.initData()
    svgBlocksQueueModif.initData()
    svgBlocksQueueCreator.initData()
    svgWarningArea.initData({
      tag: 'warningArea',
      g: svg.g.append('g'),
      box: {x: lenD.w[0] * 0.48, y: lenD.h[0] * 0, w: lenD.w[0] * 0.145, h: lenD.h[0] * 0.25},
      pull: {
        g: undefined,
        box: {x: 0, y: 0, w: 1, h: 0.45},
        child: {}
      },
      push: {
        g: undefined,
        box: {x: 0, y: 0.64, w: 1, h: 0.45},
        child: {}
      },
      debug: {
        enabled: false
      }
    })
    // svgSchedulingBlocksOverview.initData({
    //   tag: 'schedulingBlocksOverview',
    //   g: svg.g.append('g'),
    //   box: {x: (lenD.w[0] * 0.02), y: lenD.h[0] * 0.61, w: lenD.w[0] * 0.6, h: lenD.h[0] * 0.39},
    //   shrinked: {
    //     g: undefined,
    //     box: {x: 0, y: 0, w: 1, h: 0.18},
    //     child: {}
    //   },
    //   content: {
    //     g: undefined,
    //     box: {x: 0, y: 0.15, w: 1, h: 0.85},
    //     child: {}
    //   },
    //   data: {
    //     formatedData: undefined
    //   },
    //   debug: {
    //     enabled: false
    //   }
    // })
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
  function updateData (dataIn) {
    shared.main.data.server = dataIn.data

    svgBlocksQueue.updateData()
    svgBlocksQueueCreator.update()
    svgSchedulingBlocksOverview.update()
    svgBlocksQueueOptimized.update()
  }
  this.updateData = updateData
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
    if (optIn.endTime < Number(shared.main.data.server.timeOfNight.now)) return colorTheme.blocks.shutdown
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
    let cleanQueue = deepCopy(shared.main.data.copy.optimized)
    for (let key in cleanQueue.blocks) {
      let group = cleanQueue.blocks[key]
      for (let i = 0; i < group.length; i++) {
        delete group[i].modifications
      }
    }
    return cleanQueue
  }
  function pushNewBlockQueue () {
    let cleanQueue = cleanOptimizedBlockQueue()
    sock.widgetV[widgetType].SockFunc.pushNewBlockQueue({
      widgetId: widgetId,
      newBlockQueue: cleanQueue
    })
    shared.main.data.oldCopy.push(deepCopy(shared.main.data.copy))
    shared.main.data.copy.original = cleanQueue
    for (var key in shared.main.data.copy.original.blocks) {
      for (var i = 0; i < shared.main.data.copy.original.blocks[key].length; i++) {
        shared.main.data.copy.original.blocks[key][i].modifications = {
          modified: false,
          userModifications: {},
          optimizerModifications: {}
        }
      }
    }
    shared.main.data.copy.modified = deepCopy(shared.main.data.copy.original)
    shared.main.data.copy.optimized = deepCopy(shared.main.data.copy.original)

    createSchedBlocks()

    svgBlocksQueueCreator.updateData()
    svgBlocksQueueModif.updateData()
    svgBlocksQueueOptimized.updateData()
    svgSchedulingBlocksOverview.updateData()
    svgMiddleInfo.addNewTab()
    // pullData()
  }
  this.pushNewBlockQueue = pushNewBlockQueue
  function createSchedBlocks () {
    shared.main.data.copy.schedBlocks = {}
    for (let key in shared.main.data.copy.modified.blocks) {
      for (let i = 0; i < shared.main.data.copy.modified.blocks[key].length; i++) {
        let b = shared.main.data.copy.modified.blocks[key][i]
        if (!shared.main.data.copy.schedBlocks[b.sbId]) {
          shared.main.data.copy.schedBlocks[b.sbId] = {
            exeState: {
              state: b.exeState.state,
              canRun: true
            },
            target: {
              id: b.targetId,
              name: b.targetName,
              pos: b.targetPos,
              observability: {}
            }
          }
        } else {
          let sb = shared.main.data.copy.schedBlocks[b.sbId]
          if (b.exeState.state === 'run' || sb.exeState.state === 'run') sb.exeState.state = 'run'
          if (b.exeState.state === 'wait' && sb.exeState.state === 'done') sb.exeState.state = 'run'
          if (b.exeState.state === 'done' && sb.exeState.state === 'wait') sb.exeState.state = 'run'
        }
      }
    }
  }
  function pullData () {
    shared.main.data.copy.original = {blocks: deepCopy(shared.main.data.server).blocks}

    for (var key in shared.main.data.copy.original.blocks) {
      for (var i = 0; i < shared.main.data.copy.original.blocks[key].length; i++) {
        shared.main.data.copy.original.blocks[key][i].modifications = {
          modified: false,
          userModifications: {},
          optimizerModifications: {}
        }
      }
    }

    shared.main.data.copy.modified = deepCopy(shared.main.data.copy.original)
    shared.main.data.copy.optimized = deepCopy(shared.main.data.copy.original)

    createSchedBlocks()

    svgBlocksQueueCreator.updateData()
    svgBlocksQueueModif.updateData()
    svgBlocksQueueOptimized.updateData()
    svgSchedulingBlocksOverview.updateData()
  }
  function optimizer () {
    shared.main.data.copy.optimized = deepCopy(shared.main.data.copy.modified)

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
    for (let i = shared.main.data.copy.optimized.blocks.wait.length - 1; i > -1; i--) {
      let tb = shared.main.data.copy.optimized.blocks.wait[i]
      for (let j = 0; j < shared.main.data.copy.optimized.blocks.run.length; j++) {
        let mb = shared.main.data.copy.optimized.blocks.run[j]
        if (isSameTime(mb.startTime, mb.endTime, tb.startTime, tb.endTime)) {
          shareSameTels(mb, tb)
        }
      }
      for (let j = 0; j < shared.main.data.copy.optimized.blocks.wait.length; j++) {
        let mb = shared.main.data.copy.optimized.blocks.wait[j]
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
    if (shared.main.focus.schedBlocks !== undefined) {
      if (shared.main.focus.schedBlocks === schedB) {
        mainUnfocusOnSchedBlocks(schedB)
        return
      }
      mainUnfocusOnSchedBlocks(shared.main.focus.schedBlocks)
      svgInformation.unfocusSchedBlocks()
      mainUnfocusOnBlock(shared.main.focus.block)
    }
    shared.main.focus.schedBlocks = schedB
    svgSchedulingBlocksOverview.focusOnSchedBlocks(schedB)
    svgInformation.focusOnSchedBlocks(schedB)
    blockQueueCreator.focusOnSchedBlocks(schedB)
    blockQueueModif.focusOnSchedBlocks(schedB)
    blockQueueOptimized.focusOnSchedBlocks(schedB)
    console.log(shared.main.focus.schedBlocks);
  }
  function mainUnfocusOnSchedBlocks () {
    svgInformation.unfocusSchedBlocks()
    svgSchedulingBlocksOverview.unfocusOnSchedBlocks()

    blockQueueCreator.unfocusOnSchedBlocks()
    blockQueueModif.unfocusOnSchedBlocks()
    blockQueueOptimized.unfocusOnSchedBlocks()
    shared.main.focus.schedBlocks = undefined
  }

  function mainFocusOnBlock (block) {
    if (shared.main.focus.block !== undefined) {
      if (shared.main.focus.block === block.obId) {
        mainUnfocusOnBlock(block)
        return
      }
      mainUnfocusOnBlock(shared.main.focus.block)
    }
    mainUnfocusOnSchedBlocks()
    mainFocusOnSchedBlocks(block.sbId)

    shared.main.focus.block = block.obId
    // svgSchedulingBlocksOverview.focusOnSchedBlocks(block)
    svgInformation.focusOnBlock(block.obId)
    blockQueueCreator.focusOnBlock(block.obId)
    blockQueueModif.focusOnBlock(block.obId)
    blockQueueOptimized.focusOnBlock(block.obId)
  }
  function mainUnfocusOnBlock () {
    if (!shared.main.focus.block) return
    svgInformation.unfocusBlock()
    svgInformation.focusOnSchedBlocks(shared.main.focus.schedBlocks)
    blockQueueCreator.unfocusOnBlock(shared.main.focus.block)
    blockQueueModif.unfocusOnBlock(shared.main.focus.block)
    blockQueueOptimized.unfocusOnBlock(shared.main.focus.block)
    shared.main.focus.block = undefined
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
    for (let key in shared.main.data.copy.original.blocks) {
      let group = shared.main.data.copy.original.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].sbId === schedId) {
          blocks.original.push({data: group[i], key: key, index: i})
        }
      }
    }
    for (let key in shared.main.data.copy.modified.blocks) {
      let group = shared.main.data.copy.modified.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].sbId === schedId) {
          blocks.modified.push({data: group[i], key: key, index: i})
        }
      }
    }
    for (let key in shared.main.data.copy.optimized.blocks) {
      let group = shared.main.data.copy.optimized.blocks[key]
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
    for (let key in shared.main.data.copy.original.blocks) {
      let group = shared.main.data.copy.original.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].obId === blockId) {
          block.original = {data: group[i], key: key, index: i}
        }
      }
    }
    for (let key in shared.main.data.copy.modified.blocks) {
      let group = shared.main.data.copy.modified.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].obId === blockId) {
          block.modified = {data: group[i], key: key, index: i}
        }
      }
    }
    for (let key in shared.main.data.copy.optimized.blocks) {
      let group = shared.main.data.copy.optimized.blocks[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].obId === blockId) {
          block.optimized = {data: group[i], key: key, index: i}
        }
      }
    }
    return block
  }

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
    for (let key in shared.main.data.copy.modified.blocks) {
      let group = shared.main.data.copy.modified.blocks[key]
      for (let i = group.length - 1; i > -1; i--) {
        if (group[i].sbId === schedId) {
          addBlockModifications(from, group[i].obId, modifs)
        }
      }
    }
    // let blocks = getBlocksBySched(schedId)
    // for (let key in shared.main.data.copy.original.blocks) {
    //   let group = shared.main.data.copy.original.blocks[key]
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

    // for (let key in shared.main.data.copy.modified.blocks) {
    //   let group = shared.main.data.copy.modified.blocks[key]
    //   for (let i = group.length - 1; i > -1; i--) {
    //     if (group[i].sbId === schedId) {
    //       let block = group[i]
    //       block.modifications.modified = true
    //       for (let modif in modifs) {
    //         block = applyModification(block, modifs[modif])
    //         if (modifs[modif].prop === 'state') {
    //           group.splice(i, 1)
    //           shared.main.data.copy.modified.blocks['done'].push(block)
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
    //         shared.main.data.copy.modified.blocks[block.key].splice(block.index, 1)
    //         shared.main.data.copy.modified.blocks['done'].push(block.data)
    //       } else if (modifs[modif].new === 'wait') {
    //         console.log(block.key);
    //         console.log(shared.main.data.copy.modified.blocks[block.key].splice(block.index, 1))
    //         shared.main.data.copy.modified.blocks['wait'].push(block.data)
    //       } else if (modifs[modif].new === 'run') {
    //         shared.main.data.copy.modified.blocks[block.key].splice(block.index, 1)
    //         shared.main.data.copy.modified.blocks['run'].push(block.data)
    //       }
    //     }
    //   }
    // }
    // // shared.main.data.copy.blocks.modified.push(block)
    // // console.log(shared.main.data.copy.blocks);
    // svgBlocksQueueCreator.updateData()
    // svgMiddleInfo.updateData()
    // svgBlocksQueueModif.updateData()
    // optimizer()
  }
  function addBlockModifications (from, blockId, modifs) {
    let block = getBlockById(blockId)
    // for (let key in shared.main.data.copy.original.blocks) {
    //   let group = shared.main.data.copy.original.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       group[i].modifications.modified = true
    //     }
    //   }
    // }
    // shared.main.data.copy.original.blocks[block.original.key][block.original.index]
    block.original.data.modifications.modified = true
    block.modified.data.modifications.modified = true
    for (let modif in modifs) {
      let modifSucceed = applyModification(block, modifs[modif])
      if (modifs[modif].prop === 'state') {
        shared.main.data.copy.modified.blocks[block.modified.key].splice(block.modified.index, 1)
        if (modifs[modif].new === 'cancel') {
          shared.main.data.copy.modified.blocks['done'].push(block.modified.data)
        } else if (modifs[modif].new === 'wait') {
          shared.main.data.copy.modified.blocks['wait'].push(block.modified.data)
        } else if (modifs[modif].new === 'run') {
          shared.main.data.copy.modified.blocks['run'].push(block.modified.data)
        }
      }
    }
    if (Object.keys(block.modified.data.modifications.userModifications).length === 0) {
      block.original.data.modifications.modified = false
      block.modified.data.modifications.modified = false
    }

    // shared.main.data.copy.blocks.modified.push(block)
    // console.log(shared.main.data.copy.blocks);
    createSchedBlocks()
    svgBlocksQueueCreator.updateData()
    svgMiddleInfo.updateData()
    svgBlocksQueueModif.updateData()
    optimizer()
  }
  this.addBlockModifications = addBlockModifications
  function createBackground () {
    let lineGenerator = d3.line()
      .x(function (d) { return d.x })
      .y(function (d) { return d.y })

    svg.svg
      .style('background', colorTheme.medium.background)
    svg.background = svg.g

    let dataPoints1 = [
      {x: lenD.w[0] * 0, y: lenD.h[0] * 0.25},
      {x: lenD.w[0] * 0.48, y: lenD.h[0] * 0.25},
      {x: lenD.w[0] * 0.525, y: lenD.h[0] * 0.155},
      {x: lenD.w[0] * 0.5525, y: lenD.h[0] * 0.155},
      {x: lenD.w[0] * 0.5525, y: lenD.h[0] * 0.105},
      {x: lenD.w[0] * 0.58, y: lenD.h[0] * 0.105},
      {x: lenD.w[0] * 0.625, y: lenD.h[0] * 0}
    ]
    svg.background.append('path')
      .data([dataPoints1])
      .attr('class', 'line')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colorTheme.bright.stroke)
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', [6, 2])
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
  let SvgBlocksQueue = function () {
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData () {
      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.45 // 0.6
      h0 = lenD.h[0] * 0.14 // 0.18
      x0 = (lenD.w[0] * 0.02)
      y0 = (lenD.h[0] * 0.04)
      marg = w0 * 0.01
      let blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
      gBlockBox.append('text')
        .text('CURRENT SCHEDULE')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'left')
        .attr('transform', 'translate(-5,' + (y0 + h0 * 0.8) + ') rotate(270)')
      // gBlockBox.append('rect')
      //   .attr('x', 0)
      //   .attr('y', -10)
      //   // .attr('rx', 2)
      //   // .attr('ry', 2)
      //   .attr('width', blockBoxData.w + 0)
      //   .attr('height', blockBoxData.h + 12) // + 35)
      //   .attr('stroke', colorTheme.brighter.stroke)
      //   .attr('stroke-width', 0.4)
      //   // .attr('stroke-width', 12)
      //   // .attr('stroke-dasharray', [blockBoxData.w + 10 + blockBoxData.h + 10 + 35 + 6, blockBoxData.w + 10 - 12, blockBoxData.h + 10 + 35 + 16])
      //   .style('fill', colorTheme.brighter.background)
      blockQueue = new BlockQueue({
        main: {
          tag: 'blockQueueTopTag',
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
            box: {x: 0, y: blockBoxData.h * 0.45, w: blockBoxData.w, h: blockBoxData.h * 0.55, marg: blockBoxData.marg},
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
            box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h * 0.3, marg: blockBoxData.marg},
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
            enabled: false,
            g: undefined,
            box: undefined,
            events: {
              click: undefined,
              mouseover: undefined,
              mouseout: undefined,
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            background: {
              fill: undefined,
              stroke: undefined,
              strokeWidth: undefined
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
          endTime: {time: 0, date: undefined},
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
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })

      blockQueue.init()
      updateData()
    }
    this.initData = initData

    function updateData () {
      let telIds = []
      $.each(shared.main.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      blockQueue.updateData({
        time: {
          currentTime: {date: new Date(shared.main.data.server.timeOfNight.date_now), time: Number(shared.main.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.main.data.server.timeOfNight.date_start), time: Number(shared.main.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.main.data.server.timeOfNight.date_end), time: Number(shared.main.data.server.timeOfNight.end)}
        },
        data: {
          raw: {
            blocks: shared.main.data.server.blocks,
            telIds: telIds
          }
        }
      })
    }
    this.updateData = updateData
  }
  let SvgBlocksQueueCreator = function () {
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData () {
      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.6
      h0 = lenD.h[0] * 0.485 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.02)
      y0 = lenD.h[0] * 0.265
      marg = w0 * 0.01
      let blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
      gBlockBox.append('text')
        .text('CURRENT SCHEDULE (copy)')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'left')
        .attr('transform', 'translate(-5,' + (y0 - h0 * 0.11) + ') rotate(270)')

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
          enabled: false,
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
            box: {x: 0, y: blockBoxData.h * 0.2, w: blockBoxData.w, h: blockBoxData.h * 0.2190, marg: blockBoxData.marg},
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
              stroke: 'none',
              strokeWidth: 0
            }
          },
          cancel: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h * 0.1289, marg: blockBoxData.marg},
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
          modifications: addBlockModifications
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })

      blockQueueCreator.init()
      update()
    }
    this.initData = initData

    function updateData () {
      let telIds = []
      $.each(shared.main.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      blockQueueCreator.updateData({
        time: {
          currentTime: {date: new Date(shared.main.data.server.timeOfNight.date_now), time: Number(shared.main.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.main.data.server.timeOfNight.date_start), time: Number(shared.main.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.main.data.server.timeOfNight.date_end), time: Number(shared.main.data.server.timeOfNight.end)}
        },
        data: {
          raw: {
            blocks: shared.main.data.copy.original.blocks,
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
          currentTime: {date: new Date(shared.main.data.server.timeOfNight.date_now), time: Number(shared.main.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.main.data.server.timeOfNight.date_start), time: Number(shared.main.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.main.data.server.timeOfNight.date_end), time: Number(shared.main.data.server.timeOfNight.end)}
        }
      })
    }
    this.update = update
  }
  let SvgBlocksQueueModif = function () {
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData () {
      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.6
      h0 = lenD.h[0] * 0.255// h0 *= 2.5;
      x0 = (lenD.w[0] * 0.02)
      y0 = lenD.h[0] * 0.4925
      marg = w0 * 0.01
      let blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
      gBlockBox.append('text')
        .text('MODIFICATIONS')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'left')
        .attr('transform', 'translate(-5,' + (y0 - h0 * 1.2) + ') rotate(270)')
      blockQueueModif = new BlockQueueModif({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          box: blockBoxData,
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
            box: {x: 0, y: blockBoxData.h * 0.6, w: blockBoxData.w, h: blockBoxData.h * 0.283, marg: blockBoxData.marg},
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
              stroke: 'none',
              strokeWidth: 0
            }
          },
          cancel: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: blockBoxData.h * 0.02, w: blockBoxData.w, h: blockBoxData.h * 0.2, marg: blockBoxData.marg},
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
            box: {x: 0, y: blockBoxData.h * 0.5, w: blockBoxData.w, h: blockBoxData.h * 0.47, marg: blockBoxData.marg},
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
          enabled: false,
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
          modifications: addBlockModifications
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
      $.each(shared.main.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      let modifiedData = {}
      for (let key in shared.main.data.copy.modified.blocks) {
        modifiedData[key] = []
        let group = shared.main.data.copy.modified.blocks[key]
        for (let i = 0; i < group.length; i++) {
          if (!(Object.keys(group[i].modifications.userModifications).length === 0 && group[i].modifications.userModifications.constructor === Object)) {
            modifiedData[key].push(group[i])
          }
        }
      }
      blockQueueModif.updateData({
        time: {
          currentTime: {date: new Date(shared.main.data.server.timeOfNight.date_now), time: Number(shared.main.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.main.data.server.timeOfNight.date_start), time: Number(shared.main.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.main.data.server.timeOfNight.date_end), time: Number(shared.main.data.server.timeOfNight.end)}
        },
        data: {
          raw: {
            blocks: modifiedData,
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
          currentTime: {date: new Date(shared.main.data.server.timeOfNight.date_now), time: Number(shared.main.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.main.data.server.timeOfNight.date_start), time: Number(shared.main.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.main.data.server.timeOfNight.date_end), time: Number(shared.main.data.server.timeOfNight.end)}
        }
      })
    }
    this.update = update
  }
  let SvgBlockQueueOptimized = function () {
    function initData () {
      let blockBoxData = {
        x: (lenD.w[0] * 0.02),
        y: lenD.h[0] * 0.75,
        w: lenD.w[0] * 0.6,
        h: lenD.h[0] * 0.2,
        marg: (lenD.w[0] * 0.6) * 0.01
      }
      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
      gBlockBox.append('text')
        .text('OPTIMIZED SCHEDULE')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'left')
        .attr('transform', 'translate(-5,' + (blockBoxData.y - blockBoxData.h * 2.8) + ') rotate(270)')
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
      $.each(shared.main.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      blockQueueOptimized.updateData({
        time: {
          currentTime: {date: new Date(shared.main.data.server.timeOfNight.date_now), time: Number(shared.main.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.main.data.server.timeOfNight.date_start), time: Number(shared.main.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.main.data.server.timeOfNight.date_end), time: Number(shared.main.data.server.timeOfNight.end)}
        },
        data: {
          raw: {
            blocks: shared.main.data.copy.optimized.blocks,
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
          currentTime: {date: new Date(shared.main.data.server.timeOfNight.date_now), time: Number(shared.main.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.main.data.server.timeOfNight.date_start), time: Number(shared.main.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.main.data.server.timeOfNight.date_end), time: Number(shared.main.data.server.timeOfNight.end)}
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
      let dataPointsPull = [
        {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.1},
        {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.1},
        {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.2},
        {x: reserved[pullOrPush].box.w * 0.7, y: reserved[pullOrPush].box.h * 0.8},
        {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.8},
        {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.1}
      ]
      let dataPointsPush = [
        {x: reserved[pullOrPush].box.w * 0.28, y: reserved[pullOrPush].box.h * 0.1},
        {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.1},
        {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.8},
        {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.8},
        {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.6},
        {x: reserved[pullOrPush].box.w * 0.28, y: reserved[pullOrPush].box.h * 0.1}
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
            return reserved[pullOrPush].box.h * 0.45
          })
          .attr('dy', function () {
            return reserved[pullOrPush].box.h * 0.1
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
          if (pullOrPush === 'pull') return [dataPointsPull]
          else return [dataPointsPush]
        })
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.brighter.background)
        .attr('stroke', colorTheme.brighter.stroke)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.4)
        .attr('fill-opacity', 1)
        .on('click', function () {
          if (reserved[pullOrPush].g.attr('opacity') === '0.01') reserved[pullOrPush].g.attr('opacity', 1)
          else reserved[pullOrPush].g.attr('opacity', 0.01)
        })

      reserved[pullOrPush].child.warningExclamationBack = reserved[pullOrPush].g.append('rect')
        .attr('width', reserved[pullOrPush].box.w * 0.13)
        .attr('height', reserved[pullOrPush].box.h * 0.6)
        .attr('x', function () {
          if (pullOrPush === 'pull') return reserved[pullOrPush].box.w * 0.12
          else return reserved[pullOrPush].box.w * (1 - 0.25)
        })
        .attr('y', reserved[pullOrPush].box.h * 0.15)
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
          if (pullOrPush === 'pull') return reserved[pullOrPush].box.w * 0.18
          else return reserved[pullOrPush].box.w * (1 - 0.185)
        })
        .attr('y', reserved[pullOrPush].box.h * 0.5)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .attr('font-size', reserved[pullOrPush].box.h * 0.45)
        .attr('dy', reserved[pullOrPush].box.h * 0.1)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.warning.text)
      loop(true, pullOrPush)

      function pullWarning () {
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Something occur that'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.28
          })
          .attr('y', reserved[pullOrPush].box.h * 0.25)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.12)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine2 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'could invalidate the'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.28
          })
          .attr('y', reserved[pullOrPush].box.h * 0.37)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.12)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine3 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'new schedule.'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.28
          })
          .attr('y', reserved[pullOrPush].box.h * 0.49)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.12)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Please Pull'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.28
          })
          .attr('y', reserved[pullOrPush].box.h * 0.69)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.15)
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
            return reserved[pullOrPush].box.w * 0.28
          })
          .attr('y', reserved[pullOrPush].box.h * 0.25)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.12)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine2 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'constraints, some'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.24
          })
          .attr('y', reserved[pullOrPush].box.h * 0.37)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.12)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine3 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'changes will be lost.'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.2
          })
          .attr('y', reserved[pullOrPush].box.h * 0.49)
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.12)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine41 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return '10:00'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.24
          })
          .attr('y', reserved[pullOrPush].box.h * 0.69)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved[pullOrPush].box.h * 0.15)
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
        reserved[pullOrPush].child.warningLine42 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Please Push'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.35
          })
          .attr('y', reserved[pullOrPush].box.h * 0.69)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.15)
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Please Push'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.35
          })
          .attr('y', reserved[pullOrPush].box.h * 0.69)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'start')
          .attr('font-size', reserved[pullOrPush].box.h * 0.15)
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
        .attr('width', 18)
        .attr('height', 18)
        .attr('x', reserved.box.w * 0.4 - 9)
        .attr('y', reserved.box.h * 0.52 - 9)
        .attr('fill', colorTheme.bright.background)
        .attr('stroke', '#000000')
      reserved.pull.child.buttonIcon = reserved.g.append('svg:image')
        .attr('class', 'icon')
        .attr('xlink:href', '/static/arrow-up.svg')
        .attr('width', 25)
        .attr('height', 25)
        .attr('x', reserved.box.w * 0.4 - 12.5)
        .attr('y', reserved.box.h * 0.52 - 12.5)
        .on('click', function () {
          pullData()
        })
      reserved.pull.child.infoText = reserved.g.append('text')
        .text(function (d) {
          return 'PULL'
        })
        .attr('x', reserved.box.w * 0.4 - 15)
        .attr('y', reserved.box.h * 0.55)
        .attr('text-anchor', 'end')
        .style('font-weight', 'bold')
        .style('font-size', reserved.box.h * 0.07)
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
        .attr('width', 18)
        .attr('height', 18)
        .attr('x', reserved.box.w * 0.6 - 9)
        .attr('y', reserved.box.h * 0.52 - 9)
        .attr('fill', colorTheme.bright.background)
        .attr('stroke', '#000000')
      reserved.push.child.buttonIcon = reserved.g.append('svg:image')
        .attr('class', 'icon')
        .attr('xlink:href', '/static/arrow-up.svg')
        .attr('width', 25)
        .attr('height', 25)
        .attr('x', reserved.box.w * 0.6 - 12.5)
        .attr('y', reserved.box.h * 0.52 - 12.5)
        .on('click', function () {
          pushNewBlockQueue()
        })

      reserved.push.child.infoText = reserved.g.append('text')
        .text(function (d) {
          return 'PUSH'
        })
        .attr('x', reserved.box.w * 0.6 + 15)
        .attr('y', reserved.box.h * 0.55)
        .attr('text-anchor', 'start')
        .style('font-weight', 'bold')
        .style('font-size', reserved.box.h * 0.07)
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
      let dimLeft = {x: Number(g.attr('width')) * 0.04, y: 0 + Number(g.attr('height') * 0.06), w: Number(g.attr('width')) * 0.1, h: Number(g.attr('height')) * 0.92}
      let dimTop = {x: Number(g.attr('width')) * 0.17, y: 0 + Number(g.attr('height') * 0.035), w: Number(g.attr('width')) * 0.78, h: Number(g.attr('height')) * 0.3}
      let dimMiddle = {x: Number(g.attr('width')) * 0.17, y: Number(g.attr('height')) * 0.35, w: Number(g.attr('width')) * 0.78, h: Number(g.attr('height') * 0.32)}
      let dimBottom = {x: Number(g.attr('width')) * 0.17, y: 0 + Number(g.attr('height') * 0.685), w: Number(g.attr('width')) * 0.78, h: Number(g.attr('height')) * 0.295}

      g.selectAll('*').remove()
      g.append('rect')
        .attr('class', 'back')
        .attr('x', dimBack.x)
        .attr('y', dimBack.y)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('width', dimBack.w)
        .attr('height', dimBack.h)
        .attr('stroke', 'none')
        .attr('fill', colorTheme.dark.background)
        .attr('stroke-width', 6)
        .attr('stroke-opacity', 1)
      g.append('rect')
        .attr('class', 'back')
        .attr('x', dimLeft.x + dimLeft.w * 0.4)
        .attr('y', dimLeft.y)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('width', dimLeft.w * 0.2)
        .attr('height', dimLeft.h)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke-width', 0.1)
        .attr('stroke-opacity', 1)
      g.append('rect')
        .attr('class', 'back')
        .attr('x', dimBottom.x)
        .attr('y', dimBottom.y)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('width', dimBottom.w)
        .attr('height', dimBottom.h)
        .attr('stroke', 'none')
        .attr('fill', colorTheme.darker.background)
        .attr('stroke-width', 6)
        .attr('stroke-opacity', 1)
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

      svgSchedulingBlocksOverview.initData()

      // g.append('text')
      //   .text(function (data) {
      //     return 'Modifications'
      //   })
      //   .attr('x', dimMiddle.x + dimMiddle.w * 0.5)
      //   .attr('y', dimMiddle.y - 4)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 10)
      //   .attr('dy', 0)
      //   .style('pointer-events', 'none')
      //   .attr('fill', colorTheme.darker.text)
      //   .attr('stroke', 'none')
      svgModifications.initData(shared.modifications)

      // g.append('text')
      //   .text(function (data) {
      //     return 'Conflicts'
      //   })
      //   .attr('x', dimBottom.x + dimBottom.w * 0.5)
      //   .attr('y', dimBottom.y - 6)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 10)
      //   .attr('dy', 0)
      //   .style('pointer-events', 'none')
      //   .attr('fill', colorTheme.brighter.text)
      //   .attr('stroke', 'none')
      svgConflicts.initData()

      // g.append('text')
      //   .text(function (data) {
      //     return 'On Focus'
      //   })
      //   .attr('x', dimTop.x + dimTop.w * 0.5)
      //   .attr('y', dimTop.y - 5)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 10)
      //   .attr('dy', 0)
      //   .style('pointer-events', 'none')
      //   .attr('fill', colorTheme.brighter.text)
      //   .attr('stroke', 'none')
      svgInformation.initData()

      // let dim = {x: Number(g.attr('width')) * 0.05, y: Number(g.attr('height')) * 0.11, w: Number(g.attr('width')) * 0.9, h: Number(g.attr('height') * 0.5)}
      // let dimModifs = {x: Number(g.attr('width')) * 0.05, y: Number(g.attr('height')) * 0.07, w: Number(g.attr('width')) * 0.9, h: Number(g.attr('height') * 0.15)}
      //
      // let gridB = new GridBagLayout()
      // gridB.init({
      //   size: {r: 6, c: 4},
      //   merge: [{s: {r: 0, c: 0}, e: {r: 2, c: 0}},
      //     {s: {r: 4, c: 0}, e: {r: 5, c: 0}},
      //     {s: {r: 1, c: 1}, e: {r: 2, c: 1}}],
      //   grid: []
      // })
      // function drawResolve () {
      //   let rect = g.append('rect')
      //     .attr('class', 'bottom-back')
      //     .attr('x', dimBottom.x)
      //     .attr('y', dimBottom.y - 16)
      //     .attr('width', dimBottom.w)
      //     .attr('height', dimBottom.h)
      //     .attr('stroke-dasharray', [dimBottom.w * 0.4, dimBottom.w * 0.2, dimBottom.w * 0.4, dimBottom.h + dimBottom.w + dimBottom.h])
      //     .attr('fill', colorTheme.brighter.background)
      //     .attr('stroke-width', 0.5)
      //     .attr('stroke-opacity', 1)
      //   let text = g.append('text')
      //     .text(function (data) {
      //       return 'Resolve'
      //     })
      //     .attr('x', dimBottom.x + dimBottom.w * 0.5)
      //     .attr('y', dimBottom.y - 12)
      //     .style('font-weight', 'normal')
      //     .attr('text-anchor', 'middle')
      //     .style('font-size', 10)
      //     .attr('dy', 0)
      //     .style('pointer-events', 'none')
      //     .attr('fill', colorTheme.darker.text)
      //     .attr('stroke', 'none')
      //
      //   let optimizeButton = g.append('rect')
      //     .attr('x', dimBottom.x + 16)
      //     .attr('y', dimBottom.y + 16)
      //     .attr('width', 30)
      //     .attr('height', 30)
      //     .attr('stroke', '#000000')
      //     .attr('fill', '#999999')
      //     .attr('stroke-width', 0.5)
      //     .attr('stroke-opacity', 1)
      //     .on('click', optimizer)
      // }
      //
      // drawResolve()
      // div.append('input')
      //   //.attr('class', 'formMngrInput')
      //   .attr('type', 'text')
      //   .attr('value', 'none')
      //   .attr('required', 'true')
      //   .style('height', '100%')
      // div.append('textarea')
      //   .attr('class', 'reservedment')
      //   // .text('This is a test reservedment')
      //   .style('background-color', colorPalette.dark.greyBlue[8])
      //   .style('border', 'none')
      //   .style('width', '98.5%')
      //   .style('height', Number(g.attr('height')) * 0.96 + 'px')
      //   .style('margin-top', (evenSB * 8) + (evenBLC * 6) + '1px')
      //   .style('margin-left', '4px')
      //   .style('resize', 'none')
      //   .style('pointer-events', 'none')
    }
    function drawCurrentTab (g) {

        g.selectAll('*').remove()
        g.append('rect')
          .attr('class', 'back')
          .attr('x', 3)
          .attr('y', 0)
          .attr('width', Number(g.attr('width')) - 6)
          .attr('height', Number(g.attr('height')) - 1)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke-width', 3.5)
          .attr('stroke-opacity', 1)
          .attr('stroke', colorTheme.darker.background)
        g.append('text')
          .attr('class', 'tabName')
          .text(function (data) {
            return 'Schedule 1'
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

    function drawOldContent (g, data) {
      let dimBack = {x: 1.5, y: 5, w: Number(g.attr('width')) * 0.98, h: Number(g.attr('height') * 0.99)}
      let dimMiddle = {
        x: Number(g.attr('width')) * 0.05,
        y: Number(g.attr('height')) * 0.05,
        w: Number(g.attr('width')) * 0.9,
        h: Number(g.attr('height') * 0.9)
      }
      g.selectAll('*').remove()
      g.append('rect')
        .attr('class', 'back')
        .attr('x', dimBack.x)
        .attr('y', dimBack.y)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('width', dimBack.w)
        .attr('height', dimBack.h)
        .attr('stroke', 'none')
        .attr('fill', colorTheme.dark.background)
        .attr('stroke-width', 6)
        .attr('stroke-opacity', 1)
      let svgOldModification = new SvgModifications()
      svgOldModification.initData({g: g, box: dimMiddle, oldSource: data.index})
      // shared.schedBlocks = {
      //   g: g.append('g'),
      //   box: dimLeft
      // }

    }
    function drawOldTab (g, data) {
        g.selectAll('*').remove()
        g.append('rect')
          .attr('class', 'back')
          .attr('x', 3)
          .attr('y', 0)
          .attr('width', Number(g.attr('width')) - 6)
          .attr('height', Number(g.attr('height')) - 1)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke-width', 3.5)
          .attr('stroke-opacity', 1)
          .attr('stroke', colorTheme.darker.background)
        g.append('text')
          .attr('class', 'tabName')
          .text('Version:' + data.index)
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

    function addNewTab () {
      let newPanel = new CustomPanel()
      newPanel.init({
        id: 'test2',
        tab: {
          g: undefined,
          repaint: drawOldTab,
          select: selectTab,
          unselect: unselectTab,
          close: () => {}
        },
        content: {
          g: undefined,
          repaint: drawOldContent
        },
        data: {
          index: shared.main.data.oldCopy.length - 1
        }
      })
      reserved.panelManager.addNewPanel(newPanel)
    }
    this.addNewTab = addNewTab

    function unselectTab (g) {
      g.select('rect.back')
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.background)
        .attr('height', Number(g.attr('height')) - 1)
    }
    function selectTab (g, data) {
      console.log(data);
      g.select('rect.back')
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.background)
        .attr('height', Number(g.attr('height')) + 16)
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
        }
      })

      defaultPanel = new CustomPanel()
      defaultPanel.init({
        id: 'test1',
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
        data: {}
      })
      reserved.panelManager.addNewPanel(defaultPanel)
    }
    this.initData = initData

    function updateData () {
      reserved.panelManager.updateInformation()
    }
    this.updateData = updateData
  }
  let SvgSchedulingBlocksOverview = function () {
    let template = {
      tag: 'schedulingBlocksOverview',
      g: undefined,
      box: {x: 0, y: 0, w: 0, h: 0},
      formatedData: undefined
    }

    // function initShrink () {
    //   reserved.shrinked.box.x = reserved.box.w * reserved.shrinked.box.x
    //   reserved.shrinked.box.y = reserved.box.h * reserved.shrinked.box.y
    //   reserved.shrinked.box.w = reserved.box.w * reserved.shrinked.box.w
    //   reserved.shrinked.box.h = reserved.box.h * reserved.shrinked.box.h
    //
    //   reserved.shrinked.g = reserved.g.append('g')
    //     .attr('transform', 'translate(' + reserved.shrinked.box.x + ',' + reserved.shrinked.box.y + ')')
    //   // reserved.shrinked.g.append('rect')
    //   //   .attr('x', 0)
    //   //   .attr('y', 0)
    //   //   .attr('width', reserved.shrinked.box.w)
    //   //   .attr('height', reserved.shrinked.box.h)
    //   //   .attr('fill', '#aaaaaa')
    //   reserved.shrinked.child.centralBlockG = reserved.shrinked.g.append('g')
    // }
    // function initContent () {
    //   reserved.content.box.x = reserved.box.w * reserved.content.box.x
    //   reserved.content.box.y = reserved.box.h * reserved.content.box.y
    //   reserved.content.box.w = reserved.box.w * reserved.content.box.w
    //   reserved.content.box.h = reserved.box.h * reserved.content.box.h
    //
    //   reserved.content.g = reserved.g.append('g')
    //     .attr('transform', 'translate(' + reserved.content.box.x + ',' + reserved.content.box.y + ')')
    //   // reserved.content.g.append('rect')
    //   //   .attr('x', 0)
    //   //   .attr('y', 0)
    //   //   .attr('width', reserved.content.box.w)
    //   //   .attr('height', reserved.content.box.h)
    //   //   .attr('fill', '#cccccc')
    //   reserved.content.child.centralBlockG = reserved.content.g.append('g')
    // }

    // function schedBlocksOverEmiter (data) {
    //   blockQueueCreator.focusOnSchedBlocks(data)
    // }
    // function schedBlocksOverRecepter (data) {
    //   schedulingBlocks.selectAll('rect.background')
    //     .each(function (d) {
    //       if (Number(d.scheduleId) === data.data.metaData.nSched) {
    //         let length = reserved.data.formatedData.length
    //         let dim = {h: (length < 19 ? ((reserved.shrinked.box.h) * 0.8) : ((reserved.shrinked.box.h) * 0.5)), w: (reserved.shrinked.box.h) * 0.8}
    //         d3.select(this)
    //           .attr('fill', colorPalette.dark.greyBlue[6])
    //           .attr('stroke', colorPalette.dark.greyBlue[3])
    //           .transition()
    //           .duration(400)
    //           .attr('stroke-width', 2.2)
    //           .attr('stroke-dasharray', [0, 0, dim.w + dim.h, 0, dim.h + dim.w, 0])
    //       }
    //     })
    // }
    // this.schedBlocksOverRecepter = schedBlocksOverRecepter
    // function schedBlocksOutEmiter (data) {
    //   blockQueueCreator.unfocusOnSchedBlocks(data)
    // }
    // function schedBlocksOutRecepter (data) {
    //   schedulingBlocks.selectAll('rect.background')
    //     .each(function (d) {
    //       if (Number(d.scheduleId) === data.data.metaData.nSched) {
    //         let length = reserved.data.formatedData.length
    //         let dim = {h: (length < 19 ? ((reserved.shrinked.box.h) * 0.8) : ((reserved.shrinked.box.h) * 0.5)), w: (reserved.shrinked.box.h) * 0.8}
    //         d3.select(this)
    //           .attr('fill', colorPalette.dark.greyBlue[7])
    //           .attr('stroke', colorPalette.dark.greyBlue[4])
    //           .transition()
    //           .duration(400)
    //           .attr('stroke-width', 1.8)
    //           .attr('stroke-dasharray', [0, dim.w * 0.5, dim.w * 0.5 + dim.h * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5])
    //       }
    //     })
    // }
    // this.schedBlocksOutRecepter = schedBlocksOutRecepter

    function populateShrink () {
      let length = shared.main.formatedData.schedGroup.length
      let dim = {h: shared.schedBlocks.box.w * 0.6, w: shared.schedBlocks.box.w * 0.8}
      // length += 1
      // let offset = (shared.schedBlocks.box.h - (length < 19
      //   ? (dim.h * 1.1) * length
      //   : (length % 2 === 0
      //     ? ((dim.h * 1.1) * (length - (length % 2)) - ((dim.h * 1.1) * (length - (length % 2))) / 2)
      //     : ((dim.h * 1.1) / 2 * length)))) * 0.5
      // length -= 1

      let schedulingBlocks = shared.schedBlocks.g
        .selectAll('g.schedulingBlocks')
        .data(shared.main.formatedData.schedGroup, function (d) {
          return d.scheduleId
        })
      let enterSchedulingBlocks = schedulingBlocks
        .enter()
        .append('g')
        .attr('class', 'schedulingBlocks')
        .attr('transform', function (d, i) {
          // let translate = {
          //   y: ((dim.h * 1.1) + offset + (length < 19
          //     ? (dim.h * 1.1) * i
          //     : (length % 2 === 0
          //       ? ((dim.h * 1.1) * (i - (i % 2)) - ((dim.h * 1.1) * (i - (i % 2))) / 2)
          //       : ((dim.h * 1.1) / 2 * i)))),
          //   x: (shared.schedBlocks.box.w * 0.5) - (dim.w * 0.5) // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
          // }
          let offset = (shared.schedBlocks.box.h - (length * dim.h)) / (length + 1)
          let translate = {
            y: (offset * (i + 1)) + (dim.h * i),
            x: (shared.schedBlocks.box.w * 0.5) - (dim.w * 0.5) // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
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
          // if (shared.main.focus.schedBlocks === d.scheduleId) return
          // d3.select(this)
          //   .attr('fill', colorTheme.dark.background)
          //   .attr('stroke', colorTheme.dark.stroke)
          //   .transition()
          //   .duration(200)
          //   .attr('stroke-width', 2)
          //   .attr('stroke-dasharray', [])
          // schedBlocksOverEmiter(d)
        })
        .on('mouseout', function (d) {
          mainOutSchedBlocks(d.scheduleId)
          // console.log(shared.main.focus.schedBlocks);
          // if (shared.main.focus.schedBlocks === d.scheduleId) return
          // d3.select(this)
          //   .attr('fill', colorTheme.dark.background)
          //   .attr('stroke', colorTheme.dark.stroke)
          //   .transition()
          //   .duration(200)
          //   .attr('stroke-width', 0.2)
          //   .attr('stroke-dasharray', [])
          // schedBlocksOutEmiter(d)
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

      // if (reserved.shrinked.child.newButton) return
      // reserved.shrinked.child.newButton = reserved.shrinked.g
      //   .append('g')
      //   .attr('class', 'newButton')
      //   .attr('transform', 'translate(' + offset + ',' + (length < 19 ? 0 : (reserved.shrinked.box.h * 0.25)) + ')')
      // reserved.shrinked.child.newButton.append('rect')
      //   .attr('x', function (d, i) {
      //     return dim.w * 0.05
      //   })
      //   .attr('y', function (d, i) {
      //     return dim.h * 0.05
      //   })
      //   .attr('rx', 6)
      //   .attr('ry', 6)
      //   .attr('width', function (d, i) {
      //     return dim.w * 0.9
      //   })
      //   .attr('height', function (d, i) {
      //     return dim.h * 0.9
      //   })
      //   .attr('fill', function (d, i) {
      //     return colorPalette.dark.greyBlue[5]
      //   })
      //   .attr('stroke', 'none')
      //   .attr('stroke-width', 1.8)
      //   .on('mouseover', function (d) {
      //     // if (shared.main.data.copy.focusOn === d.scheduleId) return
      //     d3.select(this)
      //       .attr('fill', colorPalette.dark.greyBlue[3])
      //       .attr('stroke', colorPalette.dark.greyBlue[3])
      //       .transition()
      //       .duration(400)
      //   })
      //   .on('mouseout', function (d) {
      //     // if (shared.main.data.copy.focusOn === d.scheduleId) return
      //     d3.select(this)
      //       .attr('fill', colorPalette.dark.greyBlue[5])
      //       .attr('stroke', 'none')
      //       .transition()
      //       .duration(400)
      //   })
      //   .on('click', function (d) {
      //     console.log('new')
      //   })
      // reserved.shrinked.child.newButton.append('line')
      //   .attr('x1', dim.h * 0.5)
      //   .attr('x2', dim.h * 0.5)
      //   .attr('y1', dim.h * 0.3)
      //   .attr('y2', dim.h * 0.7)
      //   .attr('stroke', colorPalette.dark.greyBlue[9])
      //   .attr('stroke-width', 4)
      //   .style('pointer-events', 'none')
      // reserved.shrinked.child.newButton.append('line')
      //   .attr('x1', dim.h * 0.3)
      //   .attr('x2', dim.h * 0.7)
      //   .attr('y1', dim.h * 0.5)
      //   .attr('y2', dim.h * 0.5)
      //   .attr('stroke', colorPalette.dark.greyBlue[9])
      //   .attr('stroke-width', 4)
      //   .style('pointer-events', 'none')
    }
    function initData (optIn) {
      // optIn = {
      //   tag: 'schedulingBlocksOverview',
      //   g: svg.g.append('g'),
      //   box: {x: (lenD.w[0] * 0.02), y: lenD.h[0] * 0.61, w: lenD.w[0] * 0.6, h: lenD.h[0] * 0.39},
      //   shrinked: {
      //     g: undefined,
      //     box: {x: 0, y: 0, w: 1, h: 0.18},
      //     child: {}
      //   },
      //   content: {
      //     g: undefined,
      //     box: {x: 0, y: 0.15, w: 1, h: 0.85},
      //     child: {}
      //   },
      //   data: {
      //     formatedData: undefined
      //   },
      //   debug: {
      //     enabled: false
      //   }
      // }
      shared.schedBlocks.g.attr('transform', 'translate(' + shared.schedBlocks.box.x + ',' + shared.schedBlocks.box.y + ')')
      shared.schedBlocks.g.append('rect')
        .attr('class', 'back')
        .attr('x', 0)
        .attr('y', -12)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', shared.schedBlocks.box.w)
        .attr('height', 15)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke-width', 0.1)
        .attr('stroke-opacity', 1)
      shared.schedBlocks.g.append('text')
        .text(function (data) {
          return 'Sched.B'
        })
        .attr('x', shared.schedBlocks.box.w * 0.5)
        .attr('y', 0)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', 8)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', colorTheme.dark.text)
        .attr('stroke', 'none')

      // reserved.style = {}
      // reserved.style.recCol = function () { return 'blue'} // optIn.recCol
      // if (!hasVar(reserved.style.recCol)) {
      //   reserved.style.recCol = function (optIn) {
      //     if (optIn.endTime < Number(shared.main.data.server.timeOfNight.now)) return '#626262'
      //     let state = hasVar(optIn.state)
      //       ? optIn.state
      //       : optIn.exeState.state
      //     let canRun = hasVar(optIn.canRun)
      //       ? optIn.canRun
      //       : optIn.exeState.canRun
      //     if (state === 'wait') return '#dddddd'
      //     else if (state === 'run') {
      //       return d3.color(colsPurplesBlues[0]).brighter()
      //     } else if (state === 'cancel') {
      //       if (hasVar(canRun)) {
      //         if (!canRun) return d3.color(colsPurples[3]).brighter()
      //       }
      //       return d3.color(colsPurples[4])
      //     } else return d3.color(colPrime).brighter()
      //   }
      // }
      // initShrink()
      // initContent()

      if (shared.main.data.copy.modified) updateData()
    }
    this.initData = initData

    // function removeSchedulingBlocksInfoPanel (data) {
    //   if (schedulingBlocksInfoPanelG) schedulingBlocksInfoPanelG.remove()
    // }
    // function removeCentralBlock (data) {
    //   reserved.shrinked.child.centralBlockG.selectAll('*').remove()
    //   reserved.content.child.centralBlockG.selectAll('*').remove()
    // }
    // function removeBlocksInScheduleIcons () {
    //   reserved.content.g
    //     .selectAll('g.subBlocks')
    //     .remove()
    // }

    function focusOnSchedBlocks (schedId) {
      unfocusOnSchedBlocks()
      shared.schedBlocks.g.selectAll('g.schedulingBlocks rect.background')
        .attr('fill', function (d) {
          return (d.scheduleId === schedId ? colorTheme.darker.background : colorTheme.dark.background)
        })
        .attr('stroke-width', function (d) {
          return (d.scheduleId === schedId ? 2 : 0.2)
        })
      // createCentralBlock(data)
      // createSchedBlocksInfoPanel(data)
      // createBlocksInScheduleIcons(data)
    }
    this.focusOnSchedBlocks = focusOnSchedBlocks
    function unfocusOnSchedBlocks () {
      shared.schedBlocks.g.selectAll('g.schedulingBlocks rect.background')
        .attr('fill', function (d) {
          return colorTheme.dark.background
        })
        .attr('stroke-width', function (d) {
          return 0.2
        })
      // removeBlocksInScheduleIcons()
      // removeCentralBlock()
      // removeSchedBlocksInfoPanel()
    }
    this.unfocusOnSchedBlocks = unfocusOnSchedBlocks

    function overSchedBlocks (schedId) {
      shared.schedBlocks.g.selectAll('g.schedulingBlocks rect.background')
        .attr('stroke-width', function (d) {
          return (d.scheduleId === schedId ? 2 : d3.select(this).attr('stroke-width'))
        })
    }
    this.overSchedBlocks = overSchedBlocks
    function outSchedBlocks (schedId) {
      shared.schedBlocks.g.selectAll('g.schedulingBlocks rect.background')
        .attr('stroke-width', function (d) {
          return 0.2 // (d.scheduleId === schedId ? 0.2 : d3.select(this).attr('stroke-width'))
        })
    }
    this.outSchedBlocks = outSchedBlocks

    function update () {

    }
    this.update = update
    function updateData () {
      shared.main.formatedData.schedGroup = groupBlocksBySchedule(shared.main.data.copy.modified.blocks)
      populateShrink()

      // if (shared.main.data.copy.focusOn) {
      //   for (let i = 0; i < reserved.data.formatedData.length; i++) {
      //     if (reserved.data.formatedData[i].scheduleId === shared.main.data.copy.focusOn) createBlocksInScheduleIcons(reserved.data.formatedData[i])
      //   }
      // }
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
      reserved.oldSource = optIn.oldSource

      optIn.g.append('rect')
        .attr('class', 'bottom-back')
        .attr('x', optIn.box.x)
        .attr('y', optIn.box.y)
        .attr('rx', 2)
        .attr('width', optIn.box.w)
        .attr('height', optIn.box.h)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke-width', 0.2)
        .attr('stroke-opacity', 1)

      createModificationsList()
      drawModifications()
    }
    this.initData = initData
    function update () {
      // reserved.data.modifications = {
      //   1: {
      //     modifications: [
      //       {prop: 'prop1', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop2', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop3', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop4', old: 'Old Value', new: 'New Value'}
      //     ],
      //     blocks: {
      //       2: {
      //         modifications: [
      //           {prop: 'prop1', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop2', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop3', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop4', old: 'Old Value', new: 'New Value'}
      //         ]
      //       },
      //       3: {
      //         modifications: [
      //           {prop: 'prop1', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop2', old: 'Old Value', new: 'New Value'}
      //         ]
      //       }
      //     }
      //   },
      //   3: {
      //     modifications: [
      //       {prop: 'prop1', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop2', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop3', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop4', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop5', old: 'Old Value', new: 'New Value'}
      //     ],
      //     blocks: {
      //       2: {
      //         modifications: [
      //           {prop: 'prop1', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop2', old: 'Old Value', new: 'New Value'}
      //         ]
      //       }
      //     }
      //   },
      //   7: {
      //     modifications: [
      //       {prop: 'prop1', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop2', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop3', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop4', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop5', old: 'Old Value', new: 'New Value'},
      //       {prop: 'prop6', old: 'Old Value', new: 'New Value'}
      //     ],
      //     blocks: {
      //       1: {
      //         modifications: [
      //           {prop: 'prop1', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop2', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop3', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop4', old: 'Old Value', new: 'New Value'}
      //         ]
      //       },
      //       5: {
      //         modifications: [
      //           {prop: 'prop1', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop2', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop3', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop4', old: 'Old Value', new: 'New Value'},
      //           {prop: 'prop5', old: 'Old Value', new: 'New Value'}
      //         ]
      //       }
      //     }
      //   }
      // }
      createModificationsList()
      drawModifications()
    }
    this.update = update

    function drawModifications () {
      if (reserved.data.modifications.childs.length === 0) {
        let scrollForm = new ScrollForm({
          main: {
            g: reserved.g,
            box: reserved.box,
            colorTheme: colorTheme
          },
          titles: {
            data: [
              {
                title: 'Schedule unchanged',
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
      } else {
        let scrollForm = new ScrollForm({
          main: {
            g: reserved.g,
            box: reserved.box,
            colorTheme: colorTheme
          },
          titles: {
            data: [
              {
                title: 'Sched-Blocks',
                extension: 'SB: ',
                sortOptions: {

                },
                width: '50%',
                quickScroll: true,
                anchor: 'left'
              },
              {
                title: 'Blocks',
                extension: 'B: ',
                sortOptions: {

                },
                width: '50%',
                quickScroll: true,
                anchor: 'left'
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
      let groupBySched
      if (reserved.oldSource !== undefined) {
        groupBySched = groupBlocksBySchedule(shared.main.data.oldCopy[reserved.oldSource].modified.blocks)
      } else groupBySched = groupBlocksBySchedule(shared.main.data.copy.modified.blocks)
      reserved.data.modifications = {title: {}, style: {}, childs: []}
      if (!shared.main.data.copy.modified) return

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
            // if (!reserved.data.modifications[sb]) reserved.data.modifications[sb] = {data: {}, childs: {}}
            // if (!reserved.data.modifications[sb].childs[b]) reserved.data.modifications[sb].childs[b] = {data: {}, childs: {}}
            let b = '' + block.metaData.nObs
            let bInfo = {
              key: 'Block: ' + b,
              format: 'plainText',
              style: {'default': 'subTitle'},
              childs: []
            }

            for (let key in block.modifications.userModifications) {
              let modifList = block.modifications.userModifications[key]
              // reserved.data.modifications[sb].childs[b].data[key] = []
              // for (let j = 0; j < modifList.length; j++) {
              //   reserved.data.modifications[sb].childs[b].data[key].push(modifList[j])
              // }
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
              // reserved.data.modifications[sb].childs[b].data[key] = []
              // for (let j = 0; j < modifList.length; j++) {
              //   reserved.data.modifications[sb].childs[b].data[key].push(modifList[j])
              // }
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
      console.log(reserved.data.modifications.childs);
    }
  }
  let SvgConflicts = function () {
    function initData (dataIn) {
      drawConflicts()
    }
    this.initData = initData
    function update () {
      drawConflicts()
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
      return
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
    function createBackground () {
      let dim = {
        x: 0,
        y: 0,
        w: shared.information.box.w * 0.12,
        h: shared.information.box.h,
        margH: shared.information.box.h * 0.06
      }
      shared.information.g.append('rect')
        .attr('class', 'bottom-back')
        .attr('x', -2)
        .attr('y', 0 - 0.2)
        .attr('rx', 2)
        .attr('width', dim.w + dim.margH)
        .attr('height', shared.information.box.h + 0.4)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke-width', 0.1)
        .attr('stroke-opacity', 1)
      shared.information.g.append('rect')
        .attr('class', 'bottom-back')
        .attr('x', 0 + dim.w + dim.margH - 0.2)
        .attr('y', 0 - 0.2)
        .attr('width', shared.information.box.w - dim.w - dim.margH + 0)
        .attr('height', shared.information.box.h + 0.4)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke-width', 0.1)
        .attr('stroke-opacity', 1)
    }
    function initData (dataIn) {
      shared.information.g.attr('transform', 'translate(' + shared.information.box.x + ',' + shared.information.box.y + ')')
      createBackground()
      if (shared.main.focus.block) createBlocksInfoPanel(shared.main.focus.block)
      else if (shared.main.focus.schedBlocks) focusOnSchedBlocks(shared.main.focus.schedBlocks)
      else createDefaultInfoPanel()
    }
    this.initData = initData
    function update () {

    }
    this.update = update

    function createDefaultInfoPanel () {
      let dim = {
        x: shared.information.box.w * 0.15,
        y: 0,
        w: shared.information.box.w * 0.85,
        h: shared.information.box.h,
        margH: shared.information.box.h * 0.05
      }
      let schedulingBlocksInfoPanelG = shared.information.g.append('g')
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

    function schedBlocksEvent (value, d) {
      addSchedBlocksModifications('svgInformation',
        shared.main.focus.schedBlocks,
        [{prop: (d.key.charAt(0).toLowerCase() + d.key.slice(1)), new: value}])
    }
    function createSBPropertiesList (id) {
      let sb = shared.main.data.copy.schedBlocks[id]

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
        x: shared.information.box.w * 0.15,
        y: 0,
        w: shared.information.box.w * 0.85,
        h: shared.information.box.h,
        margH: shared.information.box.h * 0.05
      }
      let schedulingBlocksInfoPanelG = shared.information.g.append('g')
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
        y: 0,
        w: shared.information.box.w * 0.12,
        h: shared.information.box.h,
        margH: shared.information.box.h * 0.05
      }

      // shared.information.g.append('rect')
      //   .attr('y', function (d, i) {
      //     return 0
      //   })
      //   .attr('x', function (d, i) {
      //     return 0 - dim.margH * 0.5
      //   })
      //   .attr('width', function (d, i) {
      //     return dim.w + dim.margH
      //   })
      //   .attr('height', function (d, i) {
      //     return dim.h
      //   })
      //   .attr('fill', function (d, i) {
      //     return colorTheme.medium.background
      //   })
      //   .attr('rx', 2)
      //   .attr('ry', 2)
      //   .attr('stroke', colorTheme.medium.stroke)
      //   .attr('stroke-width', 0.1)
      let dimBlocks = {h: shared.information.box.w * 0.15 * 0.5, w: shared.information.box.w * 0.15 * 0.6}
      let length = data.blocks.length
      shared.information.g.selectAll('g.subBlocks').remove()
      let subBlocks = shared.information.g
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
          let transY = ((dim.h - (length * dimBlocks.h)) / (length + 1)) * (i + 1) + (dimBlocks.h * i)
          return 'translate(' + transX + ',' + transY + ')'
        })
      enterSubBlocks.append('rect')
        .attr('class', 'back')
        .attr('y', function (d, i) {
          return 0
        })
        .attr('x', function (d, i) {
          return 2
        })
        .attr('width', function (d, i) {
          return dim.w
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
          // if (shared.main.focus.block === d.obId) return
          mainOverBlock(d)
          // if (shared.main.focus.schedBlocks === d.scheduleId) return
          // d3.select(this)
          //   .attr('fill', colorTheme.dark.background)
          //   .attr('stroke', colorTheme.dark.stroke)
          //   .transition()
          //   .duration(200)
          //   .attr('stroke-width', 2)
          //   .attr('stroke-dasharray', [])
          // schedBlocksOverEmiter(d)
        })
        .on('mouseout', function (d) {
          // if (shared.main.focus.block === d.obId) return
          mainOutBlock(d)
          // console.log(shared.main.focus.schedBlocks);
          // if (shared.main.focus.schedBlocks === d.scheduleId) return
          // d3.select(this)
          //   .attr('fill', colorTheme.dark.background)
          //   .attr('stroke', colorTheme.dark.stroke)
          //   .transition()
          //   .duration(200)
          //   .attr('stroke-width', 0.2)
          //   .attr('stroke-dasharray', [])
          // schedBlocksOutEmiter(d)
        })
        .on('click', function (d) {
          mainFocusOnBlock(d)
        })
        // .on('mouseover', function (d) {
        //   if (shared.main.data.copy.focusOn === d.scheduleId) return
        //   d3.select(this)
        //     .attr('fill', colorTheme.dark.background)
        //     .attr('stroke', colorTheme.dark.stroke)
        //     .transition()
        //     .duration(200)
        //     .attr('stroke-width', 2)
        //     .attr('stroke-dasharray', [])
        //   schedBlocksOverEmiter(d)
        // })
        // .on('mouseout', function (d) {
        //   if (shared.main.data.copy.focusOn === d.scheduleId) return
        //   d3.select(this)
        //     .attr('fill', colorTheme.dark.background)
        //     .attr('stroke', colorTheme.dark.stroke)
        //     .transition()
        //     .duration(200)
        //     .attr('stroke-width', 0.2)
        //     .attr('stroke-dasharray', [])
        //   schedBlocksOutEmiter(d)
        // })
        // .on('click', function (d) {
        //   let that = d3.select(this)
        //   that.attr('fill', colorTheme.darker.background)
        //     .attr('stroke', colorTheme.darker.stroke)
        //     .transition()
        //     .duration(200)
        //     .attr('stroke-width', 2)
        //     .attr('stroke-dasharray', [])
        //   createBlocksInfoPanel(d)
        // })
      // enterSubBlocks.append('rect')
      //   .attr('class', 'block')
      //   .attr('y', function (d, i) {
      //     return 3
      //   })
      //   .attr('x', function (d, i) {
      //     return 7
      //   })
      //   .attr('width', function (d, i) {
      //     return dimBlocks.h - 6
      //   })
      //   .attr('height', function (d, i) {
      //     return dimBlocks.h - 6
      //   })
      //   .attr('fill', function (d, i) {
      //     return colorTheme.medium.background
      //   })
      //   .style('opacity', 1)
      //   .attr('stroke', function (d, i) {
      //     return colorTheme.medium.stroke
      //   })
      //   .attr('stroke-width', 0.2)
      //   .style('pointer-events', 'none')
      enterSubBlocks.append('text')
        .text(function (d) {
          return 'Block-' + d.metaData.nObs
        })
        .attr('x', dim.w * 0.04 + 2)
        .attr('y', dimBlocks.h * 0.6)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'start')
        .style('font-size', 9.5)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', colorTheme.darker.text)
        .attr('stroke', 'none')
      // enterSubBlocks.append('text')
      //   .text(function (d) {
      //     return 'Time:' + d.startTime + ' -> ' + d.endTime
      //   })
      //   .attr('x', dim.w * 0.2)
      //   .attr('y', dimBlocks.h * 0.6)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'start')
      //   .style('font-size', 10)
      //   .attr('dy', 0)
      //   .style('pointer-events', 'none')
      //   .attr('fill', colorPalette.dark.greyBlue[1])
      //   .attr('stroke', 'none')

      subBlocks.each(function (d, i) {
        d3.select(this).select('rect.block')
          .transition()
          .duration(800)
          .attr('fill', function () {
            return reserved.style.recCol(d)
          })
      })
    }

    function blockEvent (value, d) {
      addBlockModifications('svgInformation',
        shared.main.focus.block,
        [{prop: (d.key.charAt(0).toLowerCase() + d.key.slice(1)), new: value}])
    }
    function createBPropertiesList (b) {
      // let prop = {}

      // prop.time = {data: {}, childs: {}}
      // prop.time.data.start = [b.startTime]
      // prop.time.data.end = [b.endTime]
      // prop.time.data.duration = [b.duration]
      //
      // prop.pointing = {data: {}, childs: {}}
      // prop.pointing.data.id = [b.pointingId]
      // prop.pointing.data.name = [b.pointingName]
      // prop.pointing.data.pos = [b.pointingPos]

      // prop.telescopes = {data: {}, childs: {}}
      // prop.telescopes.data.telescopes = [b.telIds]

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
        x: shared.information.box.w * 0.15,
        y: 0,
        w: shared.information.box.w * 0.85,
        h: shared.information.box.h,
        margH: shared.information.box.h * 0.05
      }
      let schedulingBlocksInfoPanelG = shared.information.g.append('g')
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

    function focusOnSchedBlocks (schedId) {
      for (var i = 0; i < shared.main.formatedData.schedGroup.length; i++) {
        if (shared.main.formatedData.schedGroup[i].scheduleId === schedId) {
          createSchedBlocksInfoPanel(shared.main.formatedData.schedGroup[i])
          createBlocksInScheduleIcons(shared.main.formatedData.schedGroup[i])
        }
      }
    }
    this.focusOnSchedBlocks = focusOnSchedBlocks
    // function focusOnBlock (blockId) {
    //   unfocusOnSchedBlocks()
    //   shared.schedBlocks.g.selectAll('g.schedulingBlocks rect.background')
    //     .attr('fill', function (d) {
    //       return (d.scheduleId === schedId ? colorTheme.darker.background : colorTheme.dark.background)
    //     })
    //     .attr('stroke-width', function (d) {
    //       return (d.scheduleId === schedId ? 2 : 0.2)
    //     })
    //   // createCentralBlock(data)
    //   // createSchedBlocksInfoPanel(data)
    //   // createBlocksInScheduleIcons(data)
    // }
    // this.focusOnSchedBlocks = focusOnSchedBlocks
    function unfocusSchedBlocks () {
      shared.information.g.selectAll('*').remove()
      createBackground()
      createDefaultInfoPanel()
    }
    this.unfocusSchedBlocks = unfocusSchedBlocks
    function unfocusBlock () {
      shared.information.g.select('g.form').remove()
    }
    this.unfocusBlock = unfocusBlock

    function focusOnBlock (bId) {
      unfocusOnBlock()
      shared.information.g.selectAll('g.subBlocks rect.back')
        .each(function (d) {
          d3.select(this).attr('fill', (d.obId === bId ? colorTheme.darker.background : colorTheme.dark.background))
          d3.select(this).attr('stroke-width', (d.obId === bId ? 2 : 0.2))
          if (d.obId === bId) createBlocksInfoPanel(bId)
        })
    }
    this.focusOnBlock = focusOnBlock
    function unfocusOnBlock () {
      shared.information.g.selectAll('g.subBlocks rect.back')
        .attr('fill', function (d) {
          return colorTheme.dark.background
        })
        .attr('stroke-width', function (d) {
          return 0.2
        })
    }
    this.unfocusOnBlock = unfocusOnBlock

    function overBlock (bId) {
      shared.information.g.selectAll('g.subBlocks rect.back')
        .attr('stroke-width', function (d) {
          return (d.obId === bId ? 2 : d3.select(this).attr('stroke-width'))
        })
    }
    this.overBlock = overBlock
    function outBlock (bId) {
      shared.information.g.selectAll('g.subBlocks rect.back')
        .attr('stroke-width', function (d) {
          return (d.obId === bId ? 0.2 : d3.select(this).attr('stroke-width'))
        })
    }
    this.outBlock = outBlock
  }

  let svgBlocksQueue = new SvgBlocksQueue()
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
