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
var mainScriptTag = 'schedBlocks'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global timeD */
/* global hasVar */
/* global BlockDisplayer */
/* global BlockQueueOld */
/* global PlotBrushZoom */
/* global RunLoop */
/* global Locker */
/* global deepCopy */
/* global unique */
/* global appendToDom */
/* global runWhenReady */
/* global colsPurples */
/* global colsYellows */
/* global colsBlues */
/* global disableScrollSVG */
/* global bckPattern */
/* global ScrollBox */
/* global EventDisplayer */
/* global colsBlk */
/* global telHealthCol */

window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollGrid.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueOld.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueCreator.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_eventDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollBox.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_plotBrushZoom.js' })
// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 10
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = { SockFunc: sockSchedBlocks, MainFunc: mainSchedBlocks }
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
function sockSchedBlocks (optIn) {}

function mainSchedBlocks (optIn) {
  let colorTheme = getColorTheme('bright-Grey')

  let myUniqueId = unique()
  let displayMode = 'detail'
  // let widgetType = optIn.widgetType
  let tagSchedBlocksSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  let shared = {
    data: {
      serverPast: undefined,
      blocks : {}
    },
    focus: {
      schedBlocks: undefined,
      block: undefined
    }
  }

  let svg = {}
  let box = {}
  let lenD = {}

  let eventQueueServerPast = null
  let eventQueueServerFutur = null
  let brushZoomPast = null
  let brushZoomFutur = null
  let blockQueueServerPast = null
  let blockQueueServerFutur = null

  // let thisSchedBlocks = this
  let isSouth = window.__nsType__ === 'S'

  // let sgvTag = {};
  // $.each(widgetEle, function(index,eleNow) {
  //   sgvTag[eleNow.id] = { id:tagSchedBlocksSvg+"_"+eleNow.id, whRatio:(eleNow.w/eleNow.h) };
  // })
  let sgvTag = {}
  $.each(widgetEle, function (index, eleNow) {
    sgvTag[eleNow.id] = {
      id: tagSchedBlocksSvg + eleNow.id,
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
  let prevSync = {}
  function syncStateGet (dataIn) {
    if (document.hidden) return
    if (sock.conStat.isOffline()) return

    let sessWidgetIds = dataIn.sessWidgetIds
    if (sessWidgetIds.indexOf(widgetId) < 0 || widgetId === dataIn.widgetId) {
      return
    }

    let type = dataIn.type
    if (type === 'syncObFocus') {
      if (prevSync[type] !== dataIn.data.obId) {
        prevSync[type] = dataIn.data.obId
        svgMain.blockFocus({ id: dataIn.data.obId })
      }
    }
  }
  this.syncStateGet = syncStateGet

  function sortBlocksByState (array) {
    if (!array) return
    let blocks = {}
    blocks.success = []
    blocks.fail = []
    blocks.cancel = []
    blocks.wait = []

    for (var i = 0; i < array.length; i++) {
      let b = array[i]
      if (b.exeState.state === 'done') blocks.success.push(b)
      else if (b.exeState.state === 'fail') blocks.fail.push(b)
      else if (b.exeState.state === 'cancel') blocks.cancel.push(b)
      else if (b.exeState.state === 'wait') blocks.wait.push(b)
    }
    return blocks
  }
  function getTelHealthById (id) {
    let index = Number(id.split('_')[1])
    return shared.data.server.telHealth[index]
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
  function setCol (optIn) {
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
      svg.back = svg.svg.append('g')
      svg.g = svg.svg.append('g')
      svg.foreground = svg.svg.append('g')
    }
    function initBackground () {
      svg.svg
        .style('background', colorTheme.medium.background)
      svg.back.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.w[0] * 1)
        .attr('height', lenD.h[0] * 0.03)
        .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Executed')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '20px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.25) + ',' + (lenD.h[0] * 0.02) + ')')
      svg.back.append('text')
        .text('Running')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '20px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.5) + ',' + (lenD.h[0] * 0.02) + ')')
      svg.back.append('text')
        .text('Waiting')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '20px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.75) + ',' + (lenD.h[0] * 0.02) + ')')
      // svg.back.append('rect')
      //   .attr('x', 0)
      //   .attr('y', lenD.h[0] * 0.495)
      //   .attr('width', lenD.w[0] * 1)
      //   .attr('height', lenD.h[0] * 0.01)
      //   .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
      //   .attr('stroke', 'none')
    }
    function initForeground () {
      svg.foreground.append('rect')
        .attr('x', box.currentBlocks.x + box.currentBlocks.w * 0.05)
        .attr('y', box.brushFutur.y + box.brushFutur.h * 0.22)
        .attr('width', box.currentBlocks.w * 0.95)
        .attr('height', box.brushFutur.h * 0.56)
        .attr('fill', colorTheme.dark.stroke)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.0)
      svg.foreground.append('text')
        .attr('id', 'currentHour')
        .attr('stroke', colorTheme.bright.background)
        .attr('stroke-width', 0.5)
        .attr('fill', colorTheme.bright.background)
        .attr('x', box.currentBlocks.x + box.currentBlocks.w * 0.5)
        .attr('y', box.brushFutur.y + box.brushFutur.h * 0.7)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', '24px')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
    }
    function initBox () {
      box.eventQueueServerPast = {
        x: lenD.w[0] * 0.0,
        y: lenD.h[0] * 0.03,
        w: lenD.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
        h: lenD.h[0] * 0.12,
        marg: lenD.w[0] * 0.01
      }
      box.eventQueueServerFutur = {
        x: lenD.w[0] * (displayMode === 'refine' ? 0.5 : 0.6),
        y: lenD.h[0] * 0.03,
        w: lenD.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
        h: lenD.h[0] * 0.12,
        marg: lenD.w[0] * 0.01
      }
      box.brushPast = {
        x: lenD.w[0] * 0.0,
        y: lenD.h[0] * 0.14,
        w: lenD.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
        h: lenD.h[0] * 0.05,
        marg: lenD.w[0] * 0.01
      }
      box.brushFutur = {
        x: lenD.w[0] * (displayMode === 'refine' ? 0.5 : 0.6),
        y: lenD.h[0] * 0.14,
        w: lenD.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
        h: lenD.h[0] * 0.05,
        marg: lenD.w[0] * 0.01
      }
      box.blockQueueServerPast = {
        x: lenD.w[0] * 0.0,
        y: lenD.h[0] * 0.18,
        w: lenD.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
        h: lenD.h[0] * 0.405,
        marg: lenD.w[0] * 0.01
      }
      box.blockQueueServerFutur = {
        x: lenD.w[0] * (displayMode === 'refine' ? 0.5 : 0.6),
        y: lenD.h[0] * 0.18,
        w: lenD.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
        h: lenD.h[0] * 0.405,
        marg: lenD.w[0] * 0.01
      }
      box.freeTels = {
        x: lenD.w[0] * 0.01,
        y: lenD.h[0] * 0.585,
        w: lenD.w[0] * 0.98,
        h: lenD.h[0] * 0.414,
        marg: lenD.w[0] * 0.01
      }
      box.currentBlocks = {
        x: lenD.w[0] * 0.405,
        y: lenD.h[0] * 0.18,
        w: lenD.w[0] * 0.18,
        h: lenD.h[0] * 0.405,
        marg: lenD.w[0] * 0.01
      }

      // box.execution = {
      //   x: lenD.w[0] * 0.65,
      //   y: lenD.h[0] * 0.15,
      //   w: lenD.w[0] * 0.35,
      //   h: lenD.h[0] * 0.85,
      //   marg: lenD.w[0] * 0.01
      // }
      // box.details = {
      //   x: lenD.w[0] * 0,
      //   y: lenD.h[0] * 0.01,
      //   w: lenD.w[0] * 0,
      //   h: lenD.h[0] * 0.05
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
    // sortBlocksByState()

    svgBrushPast.initData()
    svgBrushFutur.initData()
    svgEventsQueueServerPast.initData()
    svgEventsQueueServerFutur.initData()
    svgBlocksQueueServerPast.initData()
    svgRunningPhase.initData()
    svgBlocksQueueServerFutur.initData()

    // svg.g.append('rect')
    //   .attr('x', 0)
    //   .attr('y', lenD.h[0] * 0.03)
    //   .attr('width', lenD.w[0] * 1)
    //   .attr('height', lenD.h[0] * 0.026)
    //   .attr('fill', colorTheme.medium.background) // colorTheme.dark.background)
    //   .attr('stroke', 'none')
    //   .attr('rx', 0)
    // svg.g.append('rect')
    //   .attr('x', 0)
    //   .attr('y', lenD.h[0] * 0.584)
    //   .attr('width', lenD.w[0] * 1)
    //   .attr('height', lenD.h[0] * 0.026)
    //   .attr('fill', colorTheme.medium.background) // colorTheme.dark.background)
    //   .attr('stroke', 'none')
    //   .attr('rx', 0)

    // svgRunningTels.initData()

    // svgStateScheduleMatrix.initData()
    // svgWaitScheduleMatrix.initData()
    svgFreeTels.initData()
    initForeground()
    // svgSuccessQueue.initData()
    // svgFailQueue.initData()
    // svgCancelQueue.initData()
    update()
    // svgMain.initData(dataIn.data)
  }
  this.initData = initData

  function update () {
    svgEventsQueueServerPast.updateData()
    svgEventsQueueServerFutur.updateData()
    svgBrushPast.updateData()
    svgBrushFutur.updateData()
    svgBlocksQueueServerPast.updateData()
    svgBlocksQueueServerFutur.updateData()
    svgRunningPhase.updateData()
    svgFreeTels.updateData()

    let currentTime = {date: new Date(shared.data.server.timeOfNight.date_now)}
    svg.foreground.select('text#currentHour').text(d3.timeFormat('%H:%M')(currentTime.date))
  }
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateData (dataIn) {
    shared.data.server = dataIn.data

    let ce = shared.data.server.external_clockEvents[0]
    for (let i = 0; i < ce.length; i++) {
      ce[i].start_time = (new Date(ce[i].start_date).getTime() - new Date(shared.data.server.timeOfNight.date_now)) / 1000
      ce[i].end_time = ce[i].end_date === '' ? ce[i].start_time + 1000 : (new Date(ce[i].end_date).getTime() - new Date(shared.data.server.timeOfNight.date_now)) / 1000
    }
    // sortBlocksByState()
    update()

    // svgRunningTels.updateData()

    // svgStateScheduleMatrix.updateData()
    // svgWaitScheduleMatrix.updateData()
    // svgFreeTels.updateData()
    // svgCancelQueue.updateData()
    // svgSuccessQueue.updateData()
    // svgFailQueue.updateData()

    // svgMain.updateData(dataIn.data)
  }
  this.updateData = updateData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let SvgMain = function () {
    let com = {}
    let recD = {}
    let confD = {}
    let recOpt = {}
    let scrollGrid = null
    let svg = {}

    let blockQueue = new BlockQueueOld()

    let rScale = {}
    rScale[0] = {}
    rScale[1] = {}

    rScale[0].health0 = 1.1
    rScale[0].health1 = 1.2
    rScale[0].health2 = 1.35
    rScale[0].line0 = 1.2
    rScale[0].line1 = 1.8
    rScale[0].percent = 0.6
    rScale[0].label = 1.95
    rScale[0].title = 2.05

    rScale[1].health0 = 1.5
    rScale[1].health1 = 1.65
    rScale[1].innerH0 = 1.25
    rScale[1].innerH1 = 1.3

    this.rScale = rScale

    let siteScale = isSouth ? 4 / 9 : 1

    let lenD = {}
    lenD.w = {}
    lenD.h = {}
    // lenD.w[0] = 400;
    // lenD.h[0] = lenD.w[0];
    lenD.w[0] = 1000
    lenD.h[0] = lenD.w[0] / sgvTag.main.whRatio
    // isSouth ? 900 : 400;

    lenD.r = {}
    lenD.r.s00 = [12, 13, 14]
    if (isSouth) lenD.r.s00 = [12 * siteScale, 13 * siteScale, 14 * siteScale]

    let sbTag = 'scrollGrid'
    let bqTag = 'blockQueue'
    let tagDataIn = 'dataIn'
    let tagClipPath = 'clipPath'
    let tagPrevTag = 'prevTag'

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      if (hasVar(svg.svg)) return

      // ---------------------------------------------------------------------------------------------------
      // create the main svg element
      // ---------------------------------------------------------------------------------------------------
      let svgDivId = sgvTag.main.id + 'svg'
      let svgDiv = sgvTag.main.widget.getEle(svgDivId)
      console.log(svgDivId, svgDiv);

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

      svg.svg = d3
        .select(svgDiv)
        // .classed("svgInGridStackOuter", true)
        .style('background', '#383B42')
        .append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', '0 0 ' + lenD.w[0] + ' ' + lenD.h[0])
        .style('position', 'relative')
        .style('width', '100%')
        .style('height', '100%')
        .style('top', '0px')
        .style('left', '0px')
        // .attr("viewBox", "0 0 "+lenD.w[0]+" "+lenD.h[0] * whRatio)
        // .classed("svgInGridStackInner", true)
        .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
        // .call(com.svgZoom)
        .on('dblclick.zoom', null)

      if (disableScrollSVG) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }

      svg.g = svg.svg.append('g')

      // add one rect as background
      // ---------------------------------------------------------------------------------------------------
      svg.g
        .append('g')
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.w[0])
        .attr('height', lenD.h[0])
        .attr('fill', '#F2F2F2')

      // the background grid
      bckPattern({
        com: com,
        gNow: svg.g,
        gTag: 'hex',
        lenWH: [lenD.w[0], lenD.h[0]],
        opac: 0.1,
        hexR: 15
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      updateRecD(dataIn)

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      recD.tag = sbTag
      recD.gBase = svg.g.append('g')
      recD.gBack = recD.gBase.append('g')
      recD.dataG = recD.gBase.append('g')

      confD.s0 = {
        id: ['run_config', 'run_takeData', 'run_finish'],
        title: ['Configure', 'Take data', 'Finish']
      }

      confD.s1 = {
        run_config: {
          // id:   ["run_config_mount","run_config_camera","run_config_camera","run_config_mirror"],
          // title:["Mount","Camera","DAQ","Mirror"]
          id: ['run_config_mount', 'run_config_camera', 'run_config_camera'],
          title: ['Mount', 'Camera', 'DAQ']
        },
        run_takeData: {
          id: ['run_takeData'],
          title: ['']
        },
        run_finish: {
          id: ['run_finish_mount', 'run_finish_camera', 'run_finish_camera'],
          title: ['Mount', 'Camera', 'DAQ']
        }
      }

      // ---------------------------------------------------------------------------------------------------
      // define the geometry if this is the first time
      // ---------------------------------------------------------------------------------------------------
      confD.opt = []
      let x0, y0, w0, h0, marg
      let baseW = lenD.w[0] * 0.95
      let outerStrkOpac = 0.2

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      // ====================================================
      let gBlockBox = svg.g.append('g')
      // ====================================================

      w0 = baseW
      // w0   = baseW * 0.95 ;
      // h0   = lenD.h[0] * 0.32;
      h0 = lenD.h[0] * 0.12
      y0 = lenD.w[0] * 0.025
      x0 = lenD.w[0] * 0.95 - w0 + y0
      marg = w0 * 0.01
      // w0 = lenD.w[0]*0.95;  h0 = lenD.h[0]*0.14;  x0 = (lenD.w[0]-w0)/2;  y0 = x0;

      let blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      blockQueue.init({
        tag: bqTag,
        gBox: gBlockBox,
        doPhase: false,
        doText: true,
        style: {
          recCol: function (optIn) {
            if (optIn.d.id === blockQueue.get('focusId')) return colsPurples[1]
            else return colsYellows[2]
          },
          recFillOpac: function (d, state) {
            if (d.id === blockQueue.get('focusId')) return 0.5
            else if (state === 'run') return 0.3
            else return 0.1
          },
          textOpac: function (d) {
            return d.id === blockQueue.get('focusId') ? 1 : 0
          }
        },
        click: function (d) {
          blockFocus({ id: d.id })
        },
        boxData: blockBoxData,
        locker: locker,
        lockerV: [sbTag + 'updateData'],
        lockerZoom: {
          all: bqTag + 'zoom',
          during: bqTag + 'zoomDuring',
          end: bqTag + 'zoomEnd'
        },
        runLoop: runLoop
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      w0 = baseW
      h0 = lenD.h[0] * 0.12
      x0 = (lenD.w[0] - w0) / 2
      y0 = lenD.h[0] * 0.19

      // // ====================================================
      // // ====================================================
      // // ====================================================
      // // for debugging scroll
      // y0 = lenD.h[0] * 0.4;
      // // ====================================================
      // // ====================================================
      // // ====================================================

      recOpt.t = {
        id: sbTag + 'top',
        tagVecDataIn: 'wait',
        x0: x0,
        y0: y0,
        w0: w0,
        h0: h0,
        focus0: 0,
        recOrder: 'botLeftUpDown',
        isInvOrder: false,
        isHorz: true,
        recH: h0 * 0.45,
        recW: h0 * 0.45, // botLeftToRight
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.t)

      let wB0 = baseW
      let hB0 = lenD.h[0] * 0.1
      let xB0 = (lenD.w[0] - wB0) / 2
      let yB0 = lenD.h[0] - xB0 - 2.15 * hB0 // lenD.h[0] * 0.86;

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      recOpt.b0 = {
        id: sbTag + 'Bottom0',
        tagVecDataIn: 'done',
        x0: xB0,
        y0: yB0,
        w0: wB0,
        h0: hB0,
        focus0: 0,
        recOrder: 'botRightUpDown',
        isInvOrder: true,
        isHorz: true,
        recH: hB0 * 0.45,
        recW: hB0 * 0.45,
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.b0)

      let wB1 = wB0 * 0.49
      let hB1 = hB0
      let xB1 = xB0
      let yB1 = lenD.h[0] - xB0 - hB0

      recOpt.b1 = {
        id: sbTag + 'Bottom1',
        tagVecDataIn: 'cancel',
        x0: xB1,
        y0: yB1,
        w0: wB1,
        h0: hB1,
        focus0: 0,
        recOrder: 'botRightUpDown',
        isInvOrder: true,
        isHorz: true,
        recH: hB1 * 0.45,
        recW: hB1 * 0.45,
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.b1)

      let wB2 = wB1
      let hB2 = hB1
      let xB2 = xB1 + wB2 + (0.5 - wB1 / wB0) * wB0 * 2
      let yB2 = yB1

      recOpt.b2 = {
        id: sbTag + 'Bottom2',
        tagVecDataIn: 'fail',
        x0: xB2,
        y0: yB2,
        w0: wB2,
        h0: hB2,
        focus0: 0,
        recOrder: 'botRightUpDown',
        isInvOrder: true,
        isHorz: true,
        recH: hB2 * 0.45,
        recW: hB2 * 0.45,
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.b2)

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let dh = recOpt.b0.y0 - (recOpt.t.y0 + recOpt.t.h0)
      w0 = lenD.h[0] * 0.15
      h0 = dh * 0.9
      x0 = recOpt.t.x0
      y0 = recOpt.t.y0 + recOpt.t.h0 + (dh - h0) / 2

      recOpt.l = {
        id: sbTag + 'left',
        tagVecDataIn: 'run',
        x0: x0,
        y0: y0,
        w0: w0,
        h0: h0,
        focus0: 0,
        recOrder: 'topLeftToRight',
        isInvOrder: true,
        isHorz: false,
        recH: w0 * 0.45,
        recW: w0 * 0.45,
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.l)

      let title0h = recOpt.l.h0 * 0.07
      let titleSize = title0h * 0.6

      // first three are for the column titles (x,y filled in the loop below)
      let txtData = [
        {
          id: 'col' + '0',
          type: 0,
          size: titleSize,
          x: 0,
          y: 0,
          txt: confD.s0.title[0]
        },
        {
          id: 'col' + '1',
          type: 0,
          size: titleSize,
          x: 0,
          y: 0,
          txt: confD.s0.title[1]
        },
        {
          id: 'col' + '2',
          type: 0,
          size: titleSize,
          x: 0,
          y: 0,
          txt: confD.s0.title[2]
        }
      ]

      txtData.push({
        id: 'main' + '0',
        type: 1,
        size: titleSize * 0.8,
        txt: 'Pending blocks',
        x: lenD.w[0] / 2,
        y: recOpt.t.y0 - lenD.h[0] * 0.015
      })
      txtData.push({
        id: 'main' + '1',
        type: 1,
        size: titleSize * 0.8,
        trans: 'rotate(-90)',
        txt: 'Running blocks',
        x: recOpt.t.x0 / 2,
        y: recOpt.l.y0 + recOpt.l.h0 / 2 - lenD.h[0] * 0.015
      })
      txtData.push({
        id: 'main' + '2',
        type: 1,
        size: titleSize * 0.8,
        txt: 'Successful blocks',
        x: lenD.w[0] / 2,
        // y:(recOpt.b0.y0 - recOpt.b1.h0*0.125)
        y: recOpt.b0.y0 - lenD.h[0] * 0.015
        // y:(lenD.h[0] - (lenD.h[0]-recOpt.b0.y0-recOpt.b0.h0)/2)
      })
      txtData.push({
        id: 'main' + '2',
        type: 1,
        size: titleSize * 0.8,
        txt: 'Cancelled blocks',
        x: recOpt.b1.x0 + recOpt.b1.w0 / 2,
        y: lenD.h[0] - (lenD.h[0] - recOpt.b1.y0 - recOpt.b1.h0) / 2
      })
      txtData.push({
        id: 'main' + '2',
        type: 1,
        size: titleSize * 0.8,
        txt: 'Failed blocks',
        x: recOpt.b2.x0 + recOpt.b2.w0 / 2,
        y: lenD.h[0] - (lenD.h[0] - recOpt.b2.y0 - recOpt.b2.h0) / 2
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let inFracH = 0.9
      let inFracW = 0.95
      let inner = {}
      inner.x0 = recOpt.l.x0 + recOpt.l.w0 * 1.1
      inner.y0 = recOpt.l.y0 + recOpt.l.h0 * (1 - inFracH) / 2 + title0h
      inner.w0 = (recOpt.t.x0 + recOpt.t.w0 - inner.x0) * inFracW
      inner.h0 = recOpt.l.h0 * inFracH - title0h
      inner.x0 += inner.w0 * ((1 - inFracW) / inFracW) / 2

      let colRowV = []
      colRowV.push({
        width: 0.3,
        isHorz: true,
        rows: confD.s1[confD.s0.id[0]].title
      })
      colRowV.push({
        width: 0.4,
        isHorz: false,
        rows: confD.s1[confD.s0.id[1]].title
      })
      colRowV.push({
        width: 0.3,
        isHorz: true,
        rows: confD.s1[confD.s0.id[2]].title
      })

      // ---------------------------------------------------------------------------------------------------
      // let nCol = colRowV.length
      $.each(colRowV, function (nColNow, colData) {
        let colW = inner.w0 * colData.width
        let nColRow = colData.rows.length
        for (let nRowNow = 0; nRowNow < nColRow; nRowNow++) {
          let w0 = colW
          let h0 = inner.h0 / nColRow
          let x0 = inner.x0
          let y0 = inner.y0 + nRowNow * h0

          for (let nPrevColNow = 0; nPrevColNow < nColNow; nPrevColNow++) {
            x0 += inner.w0 * colRowV[nPrevColNow].width
          }

          // derive the title's position (before adding the margin)
          if (nRowNow === 0) {
            txtData[nColNow].x = x0 + w0 / 2
            txtData[nColNow].y = y0 - title0h / 2
          }

          let marg = inner.w0 * 0.015
          w0 -= marg
          h0 -= marg
          x0 += marg / 2
          y0 += marg / 2

          let m0 = 0
          if (nColRow > 1) {
            m0 = title0h * 0.8
            txtData.push({
              id: 'row' + nColNow + nRowNow,
              type: 1,
              size: titleSize * 0.9 * (m0 / title0h),
              x: x0 + w0 / 2,
              y: y0 + m0 / 2,
              txt: colData.rows[nRowNow]
            })
          }

          let colTag = confD.s0.id[nColNow]
          let rowTag = confD.s1[colTag].id[nRowNow]
          // let orient = '1/8' // (nRowNow%3 + 1 + 4*(nColNow%2)) + "/8"; // allow "1,2,3,5,6,7"+"/8"
          let recWH = colData.isHorz ? w0 * 0.15 : w0 * 0.2

          let nBoxRows = rowTag === 'run_takeData' ? 3 : 1
          // console.log('-----',colTag,rowTag,nBoxRows);

          recOpt['inner' + nColNow + nRowNow] = {
            id: sbTag + 'inner' + nColNow + nRowNow,
            tagVecDataIn: rowTag,
            x0: x0,
            y0: y0,
            w0: w0,
            h0: h0,
            m0: m0,
            nRows: nBoxRows,
            focus0: 0,
            recOrder: 'topLeftToRight',
            isInvOrder: colData.isHorz,
            isHorz: colData.isHorz,
            recH: recWH,
            recW: recWH,
            bckRecOpt: {
              circType: 'lighter',
              size: 7,
              textureOpac: 0.05,
              frontProp: { strkW: 1, fillOcp: 0.025, strkWOcp: 0.2 }
              // textureOrient:orient, textureOpac:0.04, frontProp:{ strkW:1, fillOcp:0.025, strkWOcp:0.2 }
            }
          }

          confD.opt.push(recOpt['inner' + nColNow + nRowNow])
        }
      })

      // attach new data (select by id, and so will override existing data if has the same id)
      let tagTtl = sbTag + 'title'
      let text = recD.gBase
        .selectAll('text.' + tagTtl)
        .data(txtData, function (d) {
          return d.id
        })

      // operate on new elements only
      // ---------------------------------------------------------------------------------------------------
      text
        .enter()
        .append('text')
        .attr('class', tagTtl)
        .text(function (d) {
          return d.txt
        })
        .attr('id', function (d) {
          return myUniqueId + sbTag + d.id + tagTtl
        })
        .style('font-weight', function (d) {
          return d.type === 0 ? 'normal' : 'normal'
        })
        .style('opacity', '0')
        .style('fill-opacity', function (d) {
          return d.type === 0 ? 0.8 : 0.8
        })
        .style('fill', '#383b42')
        .style('stroke-width', function (d) {
          return d.type === 0 ? 0.3 : 0
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        // .each(function(d,i){ d.fontScale = String(fontScale); d.shiftY = shiftY; })
        .style('stroke', function (d) {
          return '#383b42'
        })
        .style('font-size', function (d) {
          return d.size + 'px'
        })
        // this comes last -  translate after the labels are drawn, so that the element size is available
        .attr('transform', function (d, i) {
          if (hasVar(d.trans)) {
            return 'translate(' + d.x + ',' + d.y + ')' + d.trans
          } else {
            return 'translate(' + d.x + ',' + d.y + ')'
          }
        })
        // .attr("transform", function(d,i) { return "translate("+d.x+","+d.y+")" + hasVar(d.trans)?d.trans:""; })
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        // .attr("dy", (titleSize*0.8/3)+'px')
        .attr('text-anchor', 'middle')
        // .style("font-size", titleSize+'px')
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', '1')

      text
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()

      recD[tagClipPath + 'outer'] = recD.gBase
        .append('defs')
        .append('clipPath')
        .attr('id', tagClipPath + 'outer')
      recD[tagClipPath + 'outer']
        .append('rect')
        .attr('x', recOpt.t.x0)
        .attr('y', recOpt.t.y0)
        .attr('width', recOpt.t.w0)
        .attr('height', recOpt.b2.y0 + recOpt.b2.h0 - recOpt.t.y0)
      // .attr("stroke", 'red').attr("stroke-width","2")

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      updateRecDataOnce(dataIn)

      runWhenReady({
        pass: function () {
          return locker.isFree(sbTag + 'updateData')
        },
        execute: function () {
          locker.remove('inInit')
        }
      })
    }
    this.initData = initData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateRecD (dataIn) {
      com.blocks = dataIn.blocks
      com.telIds = dataIn.telIds
      com.timeOfNight = dataIn.timeOfNight

      let allBlocks = []
        .concat(dataIn.blocks.wait)
        .concat(dataIn.blocks.run)
        .concat(dataIn.blocks.done)

      let sbIndex = {}
      sbIndex.sbGlobalCounter = 0

      let prevTags = {}
      if (!hasVar(recD[tagPrevTag])) recD[tagPrevTag] = {}

      recD[tagDataIn] = {}
      $.each(allBlocks, function (index, dataNow) {
        if (!hasVar(sbIndex[dataNow.sbId])) {
          sbIndex[dataNow.sbId] = { sb: sbIndex.sbGlobalCounter, ob: 0 }
          sbIndex.sbGlobalCounter++
        }

        // console.log(index,dataNow);
        let id = 'blk' + dataNow.sbId + dataNow.obId

        dataNow.runPhase.unshift(dataNow.exeState.state)

        $.each(dataNow.runPhase, function (nState, stateNow) {
          if (!hasVar(recD[tagDataIn][stateNow])) recD[tagDataIn][stateNow] = []

          let idNow = id
          if (nState !== 0) {
            dataNow = deepCopy(dataNow)
            idNow += stateNow
          }
          dataNow.id = idNow
          // console.log(nState,stateNow);

          recD[tagDataIn][stateNow].push(dataNow)

          if (hasVar(recD[tagPrevTag][idNow])) {
            prevTags[idNow] = recD[tagPrevTag][idNow]
          }
        })

        sbIndex[dataNow.sbId].ob++
      })

      recD[tagPrevTag] = prevTags
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateData (dataIn) {
      if (!locker.isFree('inInit')) {
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }

      updateRecData(dataIn)
    }
    this.updateData = updateData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    runLoop.init({ tag: 'updateRecData', func: updateRecDataOnce, nKeep: 1 })

    function updateRecData (dataIn) {
      runLoop.push({ tag: 'updateRecData', data: dataIn }) //, time:dataIn.emitTime
    }

    function updateRecDataOnce (dataIn) {
      if (
        !locker.isFreeV([
          sbTag + 'updateData',
          sbTag + 'zoom',
          bqTag + 'zoom'
        ])
      ) {
        // console.log('will delay updateRecData',locker.getActiveV([sbTag+"UpdateData", sbTag+"Zoom", bqTag+"Zoom"]));
        setTimeout(function () {
          updateRecData(dataIn)
        }, 10)
        return
      }
      locker.add(sbTag + 'updateData')

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let hasNewData = false
      if (!hasVar(scrollGrid)) {
        scrollGrid = {}
        $.each(confD.opt, function (index, optIn) {
          optIn.gBox = recD.gBase
          optIn.gBack = recD.gBack // explicitly give the shared g
          optIn.gBckData = recD.dataG // explicitly give the shared g
          optIn.recV = recD[tagDataIn][optIn.tagVecDataIn]
          optIn.tagClipPath = tagClipPath
          optIn.autoClipPath = false
          optIn.scrollRecW = lenD.w[0] * 0.015
          optIn.recD = recD
          // optIn.showCounts    = false;
          optIn.lockerV = [sbTag + 'updateData']
          optIn.lockerZoom = {
            all: sbTag + 'zoom',
            during: sbTag + 'zoomDuring',
            end: sbTag + 'zoomEnd'
          }
          optIn.onZoom = {
            start: onZoomStart,
            during: onZoomDuring,
            end: onZoomDuring
          }
          // optIn.vorOpt        = { onlyMid:true, mouseover:null, click:null, dblclick:null };
          optIn.vorOpt = { mouseover: null, click: onVorClick, dblclick: null }
          optIn.runLoop = runLoop
          optIn.locker = locker

          scrollGrid[optIn.id] = new ScrollGrid(optIn)
        })

        hasNewData = true
      } else {
        updateRecD(dataIn)

        $.each(confD.opt, function (index, optIn) {
          let id = optIn.id
          let recV = recD[tagDataIn][optIn.tagVecDataIn]
          if (!hasVar(recV)) recV = []

          // console.log(index,id,recV.length,optIn.tagVecDataIn);
          let recVprev = scrollGrid[id].getRecV()
          let recIdV0 = recV.map(function (d) {
            return d.id
          })
          let recIdV1 = recVprev.map(function (d) {
            return d.id
          })
          let recIdV2 = recIdV0.filter(function (n) {
            return recIdV1.includes(n)
          })

          if (
            recIdV0.length === recIdV1.length &&
            recIdV0.length === recIdV2.length
          ) {
            return
          }

          scrollGrid[id].update({ recV: recV })

          hasNewData = true
        })
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      blockQueue.set({ tag: 'telIds', data: com.telIds })
      blockQueue.set({ tag: 'time', data: com.timeOfNight })
      blockQueue.update(com.blocks)

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      if (hasNewData) {
        updateRecs()
        locker.remove({
          id: sbTag + 'updateData',
          delay: timeD.animArc * 2
        })
      } else {
        locker.remove({ id: sbTag + 'updateData' })
      }
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    runLoop.init({ tag: 'blockFocus', func: blockFocusOnce, nKeep: 1 })

    function blockFocus (dataIn) {
      runLoop.push({ tag: 'blockFocus', data: dataIn }) //, time:dataIn.emitTime
    }
    this.blockFocus = blockFocus

    function blockFocusOnce (optIn) {
      if (
        !locker.isFreeV([
          sbTag + 'updateData',
          sbTag + 'zoom',
          bqTag + 'zoom'
        ])
      ) {
        // console.log('will delay _blockFocus_');
        setTimeout(function () {
          blockFocus(optIn)
        }, 10)
        return
      }
      locker.add(sbTag + 'updateData')
      // console.log(' will run _blockFocus_...');

      if (!hasVar(optIn)) optIn = {}
      com.focusId = hasVar(optIn.id) ? optIn.id : ''

      com.focusBlock = getFocusBlock({
        blocks: com.blocks,
        focusId: com.focusId
      })

      if (blockQueue.get('focusId') !== com.focusId) {
        blockQueue.set({ tag: 'focusId', data: com.focusId })
        blockQueue.setBlockRect()
      }

      syncStateSend({
        type: 'syncObFocus',
        syncTime: Date.now(),
        obId: com.focusId
      })

      locker.remove({ id: sbTag + 'updateData' })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function recCol (d, i) {
      return colsBlk[d.data.metaData.nSched % colsBlk.length]
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateRecs () {
      let tagRec = sbTag + 'rec'
      let tagTxtIn = sbTag + 'recTxtIn'
      // let tagTxtOut = sbTag + 'recTxtOut'
      let animT = timeD.animArc * 2
      // animT *= 6

      let dataRec = []
      $.each(confD.opt, function (index, optIn) {
        let id = optIn.id
        let dataNow = recD[id]
        dataRec = dataRec.concat(dataNow)
      })

      // check if the clip-path needs to be expanded for an element which chanes scrollGridId
      let isNewTag = {}
      $.each(dataRec, function (index, dataNow) {
        let id = dataNow.id

        isNewTag[id] =
          hasVar(recD[tagPrevTag][id]) &&
          recD[tagPrevTag][id] !== dataNow.scrollGridId

        recD[tagPrevTag][id] = dataNow.scrollGridId
      })

      let rect = recD.dataG
        .selectAll('rect.' + tagRec)
        .data(dataRec, function (d) {
          return d.id
        })

      let yTop = recOpt.t.y0 + recOpt.t.h0
      let yBot = recOpt.b0.y0
      let xLeft = recOpt.l.x0 + recOpt.l.w0

      // let xTopLeft = recOpt.t.x0
      // let xTopRight = recOpt.t.x0 + recOpt.t.w0
      // let yTopMid = recOpt.t.y0 + recOpt.t.h0 / 2
      // let yBotMid = recOpt.b0.y0 + recOpt.b0.h0 / 2

      rect
        .enter()
        .append('rect')
        .attr('stroke', function (d, i) {
          return d3.rgb(recCol(d, i)).darker(1.0)
        }) // "#383B42"
        .attr('stroke-width', 0.5)
        .style('stroke-opacity', 0.7)
        .style('fill-opacity', 0)
        .style('opacity', 0)
        .attr('x', function (d) {
          return d.x
        })
        .attr('y', function (d) {
          return d.y
        })
        // .attr("x", function(d){ return d.x+d.w/2; })
        // .attr("y", function(d){ return d.y+d.h/2; })
        .attr('width', function (d) {
          return d.w
        })
        .attr('height', function (d) {
          return d.h
        })
        .style('fill', recCol)
        .attr('vector-effect', 'non-scaling-stroke')
        .merge(rect)
        .attr('class', function (d) {
          return tagRec
        })
        .each(function (d) {
          d.recX0 = +d3.select(this).attr('x')
          d.recY0 = +d3.select(this).attr('y')

          d.recXyRatio = d.recY0 / (d.recX0 + d.recY0)

          if (d.recY0 <= yTop || d.recY0 >= yBot) d.recOrder = 1
          else if (d.recX0 < xLeft) d.recOrder = 0
          else d.recOrder = -1
        })
        .attr('clip-path', function (d, i) {
          return isNewTag[d.id]
            ? 'url(#' + tagClipPath + 'outer' + ')'
            : 'url(#' + tagClipPath + d.scrollGridId + ')'
        })
        .transition('inOut')
        .duration(animT)
        .attr('width', function (d) {
          return d.w
        })
        .attr('height', function (d) {
          return d.h
        })
        .style('opacity', 1)
        .style('fill', recCol)
        .style('fill-opacity', 0.3)
        .attrTween('x', function (d) {
          return transRecXY(d, 'x', [1, 0])
        })
        .attrTween('y', function (d) {
          return transRecXY(d, 'y', [0, 1])
        })
        // .attr("x", function(d){ return d.x; })
        // .attr("y", function(d){ return d.y; })
        .transition('clipPath')
        .duration(1)
        .attr('clip-path', function (d) {
          return 'url(#' + tagClipPath + d.scrollGridId + ')'
        })

      rect
        .exit()
        .transition('inOut')
        .duration(timeD.animArc / 2)
        .style('opacity', 0)
        .remove()

      let textIn = recD.dataG
        .selectAll('text.' + tagTxtIn)
        .data(dataRec, function (d) {
          return d.id
        })

      textIn
        .enter()
        .append('text')
        .text(function (d) {
          return d.data.metaData.blockName
        })
        .each(function (d) {
          d.nodeId = sbTag + d.id + tagTxtIn
        })
        .style('font-weight', 'normal')
        .style('opacity', 0)
        .style('fill-opacity', 0.7)
        .style('fill', '#383b42')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', function (d) {
          return '#383b42'
        })
        // .attr("transform", function(d,i) { return "translate("+(d.x+d.w/2)+","+(d.y+d.h/2)+")"; })
        .attr('x', function (d, i) {
          return d.x + d.w / 2
        })
        .attr('y', function (d, i) {
          return d.y + d.h / 2
        })
        .attr('text-anchor', 'middle')
        .merge(textIn)
        .attr('class', function (d) {
          return tagTxtIn
        })
        .each(function (d, i) {
          d.textX0 = +d3.select(this).attr('x') - d.w / 2
          d.textY0 = +d3.select(this).attr('y') - d.h / 2

          d.textXyRatio = d.textY0 / (d.textX0 + d.textY0)

          if (d.textY0 <= yTop || d.textY0 >= yBot) {
            d.textOrder = 1
          } else if (d.textX0 < xLeft) {
            d.textOrder = 0
          } else {
            d.textOrder = -1
          }

          d.size = d.w / 4
        })
        .style('font-size', function (d) {
          return d.size + 'px'
        })
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        .attr('clip-path', function (d, i) {
          return isNewTag[d.id]
            ? 'url(#' + tagClipPath + 'outer' + ')'
            : 'url(#' + tagClipPath + d.scrollGridId + ')'
        })
        .transition('inOut')
        .duration(animT)
        // .attrTween("transform", transRec)
        .style('opacity', 1)
        .attrTween('x', function (d) {
          return transTxtXY(d, 'x', 'w', [1, 0])
        })
        .attrTween('y', function (d) {
          return transTxtXY(d, 'y', 'h', [0, 1])
        })
        // .attr("x", function(d){ return (d.x+d.w/2); })
        // .attr("y", function(d){ return (d.y+d.h/2); })
        .transition('clipPath')
        .duration(1)
        .attr('clip-path', function (d) {
          return 'url(#' + tagClipPath + d.scrollGridId + ')'
        })

      textIn
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let zoomTargets = {}
    function onZoomStart (optIn) {
      let tagRec = sbTag + 'rec'
      let tagTxtIn = sbTag + 'recTxtIn'

      zoomTargets.rect = recD.dataG
        .selectAll('rect.' + tagRec)
        .filter(function (d) {
          return d.scrollGridId === optIn.id
        })

      zoomTargets.text = recD.dataG
        .selectAll('text.' + tagTxtIn)
        .filter(function (d) {
          return d.scrollGridId === optIn.id
        })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function onZoomDuring (optIn) {
      let xy = optIn.xy
      let delta = optIn.wh / 2
      let duration = optIn.duration

      if (duration <= 0) {
        zoomTargets.rect.attr(xy, function (d, i) {
          return d[xy]
        })
        zoomTargets.text.attr(xy, function (d, i) {
          return d[xy] + delta
        })
      } else {
        zoomTargets.rect
          .transition('move')
          .duration(duration)
          .attr(xy, function (d, i) {
            return d[xy]
          })
        zoomTargets.text
          .transition('move')
          .duration(duration)
          .attr(xy, function (d, i) {
            return d[xy] + delta
          })
      }
    }
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    // function onZoomEnd(optIn) {
    //   onZoomDuring(optIn);
    //   return;
    // }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function onVorClick (d) {
      // console.log('-onVorClick-',d.data.data.obId);

      blockFocus({ id: d.data.data.obId })

      let data = {
        type: 'syncObFocus',
        syncTime: Date.now(),
        obId: d.data.data.obId
      }
      sock.sockSyncStateSend({
        widgetId: widgetId,
        type: data.type,
        data: data
      })
    }

    // ---------------------------------------------------------------------------------------------------
    // functions to compute moevemnt of blocks according to set grid
    // ---------------------------------------------------------------------------------------------------
    function xyOrder (indexV, xyOrder, xyRatio, t) {
      if (xyOrder === indexV[0]) {
        if (t < xyRatio) return t / xyRatio
        else return 1
      } else if (xyOrder === indexV[1]) {
        if (t < xyRatio) return 0
        else return (t - xyRatio) / (1 - xyRatio)
      } else return t
    }
    function transRecXY (d, xy, indexV) {
      let XY = xy.toUpperCase()
      return function (t) {
        let tNow = xyOrder(indexV, d.recOrder, d.recXyRatio, t)
        return d['rec' + XY + '0'] + (d[xy] - d['rec' + XY + '0']) * tNow
      }
    }
    function transTxtXY (d, xy, wh, indexV) {
      let XY = xy.toUpperCase()
      return function (t) {
        let tNow = xyOrder(indexV, d.textOrder, d.textXyRatio, t)
        return (
          d['text' + XY + '0'] +
          (d[xy] - d['text' + XY + '0']) * tNow +
          d[wh] / 2
        )
      }
    }

    // function spiral() {
    //   let centerX = w0/2,
    //       centerY = h0*2,
    //       radius = 150,
    //       coils = 8;

    //   let rotation = 2 * Math.PI;
    //   let thetaMax = coils * 2 * Math.PI;
    //   let awayStep = radius / thetaMax;
    //   let chord = 23.5;

    //   let newTime = [];

    //   for ( theta = chord / awayStep; theta <= thetaMax; ) {
    //       away = awayStep * theta;
    //       around = theta + rotation;

    //       x = centerX + Math.cos ( around ) * away;
    //       y = centerY + Math.sin ( around ) * away;

    //       theta += chord / away;

    //       newTime.push({x: x, y: y});
    //   }

    //   let svggg = com.queue.gBase;

    //   let lineFunction = d3.line()
    //                       .x(function(d) { return d.x; })
    //                       .y(function(d) { return d.y; })
    //                       .curve(d3.curveCatmullRom.alpha(0.5))

    //   svggg.append("path")
    //     .attr("d", lineFunction(newTime))
    //     .attr("stroke", "gray")
    //     .attr("stroke-width", 0.5)
    //     .attr("fill", "none");

    //   let circles = svggg.selectAll("circle")
    //      .data(newTime)
    //      .enter()
    //        .append("circle")
    //        .attr("cx", function (d) { return d.x; })
    //        .attr("cy", function (d) { return d.y; })
    //        .attr("r", 1);
    // }
  }

  let SvgEventsQueueServerPast = function () {
    let reserved = {}
    function initData () {
      let adjustedBox = {
        x: box.eventQueueServerPast.x,
        y: box.eventQueueServerPast.y,
        w: box.eventQueueServerPast.w,
        h: box.eventQueueServerPast.h,
        marg: lenD.w[0] * 0.01
      }

      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

      eventQueueServerPast = new EventDisplayer({
        main: {
          tag: 'eventDisplayerMiddleTag',
          g: reserved.g,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'eventQueue',
        eventTrack: {
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
            box: {x: 0, y: 0, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            show: false,
            orientation: 'top',
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

        filters: {
          eventFilters: [],
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
          event: {
            click: (d) => { console.log(d) },
            mouseover: (d) => { console.log(d) },
            mouseout: (d) => { console.log(d) },
            drag: {
              start: () => {},
              tick: () => {},
              end: () => {}
            }
          }
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })
      eventQueueServerPast.init()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let axisTop = brushZoomPast.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}
      eventQueueServerPast.updateData({
        time: {
          currentTime: currentTime,
          startTime: startTime,
          endTime: endTime
        },
        data: {
          raw: {
            events_ponctual: shared.data.server.external_events[0],
            events_scheduled: shared.data.server.external_clockEvents[0]
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      // blockQueueServerPast.update({
      //   time: {
      //     currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
      //     startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
      //     endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
      //   }
      // })
    }
    this.update = update
  }
  let SvgEventsQueueServerFutur = function () {
    let reserved = {}
    function initData () {
      let adjustedBox = {
        x: box.eventQueueServerFutur.x,
        y: box.eventQueueServerFutur.y,
        w: box.eventQueueServerFutur.w,
        h: box.eventQueueServerFutur.h,
        marg: lenD.w[0] * 0.01
      }

      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

      eventQueueServerFutur = new EventDisplayer({
        main: {
          tag: 'eventDisplayerMiddleTag',
          g: reserved.g,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'eventQueue',
        eventTrack: {
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
            box: {x: 0, y: 0, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            show: false,
            orientation: 'top',
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

        filters: {
          eventFilters: [],
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
          event: {
            click: (d) => { console.log(d) },
            mouseover: (d) => { console.log(d) },
            mouseout: (d) => { console.log(d) },
            drag: {
              start: () => {},
              tick: () => {},
              end: () => {}
            }
          }
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })
      eventQueueServerFutur.init()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let axisTop = brushZoomFutur.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}

      eventQueueServerFutur.updateData({
        time: {
          currentTime: currentTime,
          startTime: startTime,
          endTime: endTime
        },
        data: {
          raw: {
            events_ponctual: shared.data.server.external_events[0],
            events_scheduled: shared.data.server.external_clockEvents[0]
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      // let date = new Date(shared.data.server.timeOfNight.date_now)
      // let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      // let startTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.timeOfNight.now)}
      // let endTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds() + (3600 * 8)), time: Number(shared.data.server.timeOfNight.now) + (3600 * 8)}
      // blockQueueServerFutur.updateData({
      //   time: {
      //     currentTime: currentTime,
      //     startTime: startTime,
      //     endTime: endTime
      //   }
      // })
    }
    this.update = update
  }
  let SvgBrushPast = function () {
    let reserved = {}
    function initData () {
      let brushBox = {
        x: box.brushPast.x,
        y: box.brushPast.y,
        w: box.brushPast.w,
        h: box.brushPast.h,
        marg: lenD.w[0] * 0.01
      }

      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + brushBox.x + ',' + brushBox.y + ')')

      brushZoomPast = new PlotBrushZoom({
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
            showAxis: true,
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
              box: {x: 0, y: brushBox.h * 0.8, w: brushBox.w, h: brushBox.h * 0.0, marg: 0},
              type: 'top',
              attr: {
                text: {
                  enabled: true,
                  size: 16,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorTheme.dark.stroke,
                  fill: colorTheme.dark.stroke
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
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: brushBox.h * 0.2, w: brushBox.w, h: brushBox.h * 0.2, marg: 0},
              type: 'bottom',
              attr: {
                text: {
                  enabled: false,
                  size: 16,
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
            svgBlocksQueueServerPast.updateData()
            svgEventsQueueServerPast.updateData()
          }
        }
      })
      brushZoomPast.init()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds() - (3600 * 8)), time: Number(shared.data.server.timeOfNight.now) - (3600 * 8)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.timeOfNight.now)}

      brushZoomPast.updateAxis({
        id: 'top',
        domain: [startTime.date, endTime.date]
      })
      brushZoomPast.updateAxis({
        id: 'middle',
        domain: [startTime.date, endTime.date]
      })
      brushZoomPast.updateAxis({
        id: 'bottom',
        domain: [startTime.date, endTime.date]
      })
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgBrushFutur = function () {
    let reserved = {}
    function initData () {
      let brushBox = {
        x: box.brushFutur.x,
        y: box.brushFutur.y,
        w: box.brushFutur.w,
        h: box.brushFutur.h,
        marg: lenD.w[0] * 0.01
      }

      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + brushBox.x + ',' + brushBox.y + ')')

      brushZoomFutur = new PlotBrushZoom({
        main: {
          g: reserved.g,
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
              box: {x: 0, y: brushBox.h * 0.8, w: brushBox.w, h: brushBox.h * 0.0, marg: 0},
              type: 'top',
              attr: {
                text: {
                  enabled: true,
                  size: 16,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorTheme.dark.stroke,
                  fill: colorTheme.dark.stroke
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
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: brushBox.h * 0.2, w: brushBox.w, h: brushBox.h * 0.2, marg: 0},
              type: 'bottom',
              attr: {
                text: {
                  enabled: false,
                  size: 16,
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
              stroke: colorTheme.darker.stroke
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
            svgBlocksQueueServerFutur.updateData()
            svgEventsQueueServerFutur.updateData()
          }
        }
      })
      brushZoomFutur.init()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.timeOfNight.now)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds() + (3600 * 8)), time: Number(shared.data.server.timeOfNight.now) + (3600 * 8)}

      brushZoomFutur.updateAxis({
        id: 'top',
        domain: [startTime.date, endTime.date]
      })
      brushZoomFutur.updateAxis({
        id: 'middle',
        domain: [startTime.date, endTime.date]
      })
      brushZoomFutur.updateAxis({
        id: 'bottom',
        domain: [startTime.date, endTime.date]
      })
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgBlocksQueueServerPast = function () {
    let reserved = {}
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServerPast.x,
        y: box.blockQueueServerPast.y,
        w: box.blockQueueServerPast.w,
        h: box.blockQueueServerPast.h,
        marg: lenD.w[0] * 0.01
      }

      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

      blockQueueServerPast = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: reserved.g,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'blockTrackShrinkBib', // 'blockQueue2',
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
            orientation: 'bottom',
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
      blockQueueServerPast.init()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let axisTop = brushZoomPast.getAxis('bottom').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}

      blockQueueServerPast.updateData({
        time: {
          currentTime: currentTime,
          startTime: startTime,
          endTime: endTime
        },
        data: {
          raw: {
            blocks: shared.data.server.blocks,
            telIds: shared.data.server.telIds
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      blockQueueServerPast.update({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        }
      })
    }
    this.update = update
  }
  let SvgBlocksQueueServerFutur = function () {
    let reserved = {}
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServerFutur.x,
        y: box.blockQueueServerFutur.y,
        w: box.blockQueueServerFutur.w,
        h: box.blockQueueServerFutur.h,
        marg: lenD.w[0] * 0.01
      }

      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

      blockQueueServerFutur = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: reserved.g,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'blockTrackShrinkBib', // blockTrackShrinkBib
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
            orientation: 'bottom',
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
              box: {x: 0, y: adjustedBox.h * 0.66875, w: adjustedBox.w, h: adjustedBox.h * 0.33125, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.15, w: adjustedBox.w, h: adjustedBox.h * 0.1525, marg: adjustedBox.marg},
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
            orientation: 'bottom',
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
      blockQueueServerFutur.init()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let axisTop = brushZoomFutur.getAxis('bottom').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}

      blockQueueServerFutur.updateData({
        time: {
          currentTime: currentTime,
          startTime: startTime,
          endTime: endTime
        },
        data: {
          raw: {
            blocks: shared.data.server.blocks,
            telIds: shared.data.server.telIds
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.timeOfNight.now)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds() + (3600 * 8)), time: Number(shared.data.server.timeOfNight.now) + (3600 * 8)}
      blockQueueServerFutur.updateData({
        time: {
          currentTime: currentTime,
          startTime: startTime,
          endTime: endTime
        }
      })
    }
    this.update = update
  }

  let SvgRunningPhase = function () {
    let reserved = {}

    function initData () {
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.currentBlocks.x + ',' + box.currentBlocks.y + ')')
      // reserved.gBlockBox.append('text')
      //   .text('Running')
      //   .style('fill', colorTheme.bright.background)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '20px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(' + (box.currentBlocks.w * 0.5) + ',' + (box.currentBlocks.y - (box.currentBlocks.h * 0.08)) + ')')
      // reserved.gBlockBox.append('rect')
      //   .attr('x', box.currentBlocks.w * 0.045)
      //   .attr('y', box.currentBlocks.h * 0.05)
      //   .attr('width', box.currentBlocks.w * 0.965)
      //   .attr('height', box.currentBlocks.h * 0.9)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.0)

      let header = reserved.gBlockBox.append('g')
      header.append('rect')
        .attr('x', box.currentBlocks.w * 0.05)
        .attr('y', 0)
        .attr('width', box.currentBlocks.w * 0.95)
        .attr('height', box.currentBlocks.h * 0.05)
        .attr('fill', colorTheme.dark.stroke)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.0)
      header.append('text')
        .text('Finish')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (box.currentBlocks.w * 0.2) + ',' + (box.currentBlocks.h * 0.04) + ')')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      header.append('text')
        .text('Data')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (box.currentBlocks.w * 0.5) + ',' + (box.currentBlocks.h * 0.04) + ')')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      header.append('text')
        .text('Config')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (box.currentBlocks.w * 0.8) + ',' + (box.currentBlocks.h * 0.04) + ')')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      header.attr('transform', 'translate(' + 0 + ',' + box.currentBlocks.h * 0.0 + ')')
      // updateData()
      // box.currentBlocks.h = box.currentBlocks.h * 0.9
    }
    this.initData = initData

    function updateData () {
      let b = deepCopy(box.currentBlocks)
      b.y = b.h * 0.08
      b.h = b.h * 0.9

      let ratioHeight = 0.2
      let ratioWidth = 0.99
      let offsetRunningBlocks = 0.035

      let ratio = 1

      let queueRun = blockQueueServerFutur.getBlocksRows()

      queueRun = queueRun.filter(b => b.block.exeState.state === 'run')
      queueRun.sort(function (a, b) { return a.y > b.y })
      let totHeight = offsetRunningBlocks * (queueRun.length - 1) + queueRun.length * ratioHeight

      if (totHeight > 1) {
        ratio = 1 / totHeight
        totHeight = 1
      } else if (totHeight < 0.25) offsetRunningBlocks = 0.3
      else if (totHeight < 0.50) offsetRunningBlocks = 0.2
      else if (totHeight < 0.75) offsetRunningBlocks = 0.1

      ratioHeight = ratioHeight * ratio
      offsetRunningBlocks = offsetRunningBlocks * ratio

      let offsetY = (b.h * (1 - totHeight)) * 0.5

      let blockBox = {
        x: (b.w * 0.5) - (b.w * ratioWidth * 0.5) + (b.w * 0.045),
        y: b.h * offsetRunningBlocks,
        w: b.w * 0.965 * ratioWidth,
        h: b.h * ratioHeight
      }
      let headerBoxId = {
        x: blockBox.w * 0.0,
        y: blockBox.h * 0.0,
        w: blockBox.w * 1.0,
        h: blockBox.h * 1.0
      }
      let headerBoxRunningPhase = {
        x: blockBox.w * 0.0,
        y: blockBox.h * 0.0,
        w: blockBox.w * 1.0,
        h: blockBox.h * 1.0
      }

      let colorLock = colorTheme.blocks.run.background
      let colorFree = colorTheme.dark.background
      let transConfig = headerBoxRunningPhase.w * 0.7 // 0.38
      let scaleTake = queueRun.length > 6 ? 1 : 1
      let transTake = headerBoxRunningPhase.w * (0.33 / scaleTake)
      let transFinish = -headerBoxRunningPhase.w * 0 // 0.38

      function updateConfigDataFinish (g) {
        let template = [
          [],
          [],
          [],
          [],
          [{x: 0, y: 0, w: 0.49, h: 0.49}, {x: 0.5, y: 0, w: 0.49, h: 0.49}, {x: 0, y: 0.5, w: 0.49, h: 0.49}, {x: 0.5, y: 0.5, w: 0.49, h: 0.49}]
        ]
        let categories = ['mount', 'mirror', 'daq', 'camera']
        let box = {
          y: headerBoxRunningPhase.h * 0.05,
          w: headerBoxRunningPhase.w * 0.33,
          h: headerBoxRunningPhase.h * 0.9
        }
        for (let i = 0; i < categories.length; i++) {
          g.select('rect#' + categories[i])
            .attr('x', headerBoxRunningPhase.x + box.w * template[categories.length][i].x)
            .attr('y', headerBoxRunningPhase.y + box.y + box.h * template[categories.length][i].y)
            .attr('width', box.w * template[categories.length][i].w)
            .attr('height', box.h * template[categories.length][i].h)
          g.select('text#' + categories[i].charAt(0).toUpperCase() + categories[i].slice(1))
            .attr('x', headerBoxRunningPhase.x + box.w * (template[categories.length][i].x + (template[categories.length][i].w * 0.5)))
            .attr('y', headerBoxRunningPhase.y + box.y + box.h * (template[categories.length][i].y + (template[categories.length][i].h * 0.7)))
            .style('font-size', Math.max((box.h * template[categories.length][i].h) * 0.4, 9))
        }
      }
      function initConfigDataFinish (g) {
        let categories = ['mount', 'mirror', 'daq', 'camera']
        for (let i = 0; i < categories.length; i++) {
          g.append('rect')
            .attr('id', categories[i])
            .attr('fill', colorFree)
            .attr('fill-opacity', 0.6)
            .attr('stroke', colorTheme.darker.stroke)
            .attr('stroke-width', 0)
          g.append('text')
            .attr('id', categories[i].charAt(0).toUpperCase() + categories[i].slice(1))
            .text(categories[i].charAt(0).toUpperCase() + categories[i].charAt(1)) // categories[i].slice(1))
            .style('font-weight', '')
            .style('fill', colorTheme.blocks.run.text)
            .attr('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        }
        updateConfigDataFinish(g)
      }

      function initRunPhase (g, runPhase, gt) {
        if (runPhase.length < 1) return
        if (runPhase[0].includes('config')) initConfig(g, runPhase, gt)
        if (runPhase[0].includes('takeData')) initTake(g, runPhase, gt)
        if (runPhase[0].includes('finish')) initFinish(g, runPhase, gt)
      }
      function initConfig (g, runPhase, gt) {
        g.attr('transform', 'translate(' + transConfig + ',0)')
        // gt.attr('transform', 'translate(' + transConfig + ',0)')

        g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorFree) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorFree) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorFree) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('Daq')) g.select('#daq').attr('fill', colorFree) // .attr('stroke-width', 0.2)
        }
      }
      function initTake (g, runPhase, gt) {
        g.attr('transform', 'translate(' + transTake + ',0)')
        // gt.attr('transform', 'translate(' + transTake + ',0)')

        g.select('text#Mount').attr('opacity', 0)
        g.select('text#Camera').attr('opacity', 0)
        g.select('text#Mirror').attr('opacity', 0)
        g.select('text#Daq').attr('opacity', 0)

        g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
      }
      function initFinish (g, runPhase, gt) {
        g.attr('transform', 'translate(' + transFinish + ',0)')
        // gt.attr('transform', 'translate(' + transFinish + ',0)')

        g.select('text#Mount').attr('opacity', 1)
        g.select('text#Camera').attr('opacity', 1)
        g.select('text#Mirror').attr('opacity', 1)
        g.select('text#Daq').attr('opacity', 1)

        g.select('#mount').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorFree) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('Daq')) g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 0.2)
        }
      }

      function dispatchRunPhase (g, runPhase, gt) {
        if (runPhase.length < 1) return
        if (runPhase[0].includes('config')) {
          dispatchConfig(g, runPhase, gt)
          return 'config'
        } else if (runPhase[0].includes('takeData')) {
          dispatchTake(g, runPhase, gt)
          return 'take'
        } else if (runPhase[0].includes('finish')) {
          dispatchFinish(g, runPhase, gt)
          return 'finish'
        }
      }
      function dispatchConfig (g, runPhase, gt) {
        g.transition().duration(timeD.animArc).attr('transform', 'translate(' + transConfig + ',0)')
        // gt.transition().duration(timeD.animArc).attr('transform', 'translate(' + transConfig + ',0)')

        g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorFree) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorFree) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorFree) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('Daq')) g.select('#daq').attr('fill', colorFree) // .attr('stroke-width', 0.2)
        }
      }
      function dispatchTake (g, runPhase, gt) {
        g.transition().duration(timeD.animArc).attr('transform', 'translate(' + transTake + ',0), scale(' + scaleTake + ',1)')
        // gt.transition().duration(timeD.animArc).attr('transform', 'translate(' + transTake + ',0)')

        g.select('text#Mount').attr('opacity', 0)
        g.select('text#Camera').attr('opacity', 0)
        g.select('text#Mirror').attr('opacity', 0)
        g.select('text#Daq').attr('opacity', 0)

        g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
      }
      function dispatchFinish (g, runPhase, gt) {
        g.transition().duration(timeD.animArc).attr('transform', 'translate(' + transFinish + ',0)')
        // gt.transition().duration(timeD.animArc).attr('transform', 'translate(' + transFinish + ',0)')

        g.select('text#Mount').attr('opacity', 1)
        g.select('text#Camera').attr('opacity', 1)
        g.select('text#Mirror').attr('opacity', 1)
        g.select('text#Daq').attr('opacity', 1)

        g.select('#mount').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorFree) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('Daq')) g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 0.2)
        }
      }

      let currentBlocks = reserved.gBlockBox
        .selectAll('g.currentBlock')
        .data(queueRun, function (d) {
          return d.block.obId
        })
      let enterCurrentBlocks = currentBlocks
        .enter()
        .append('g')
        .attr('class', 'currentBlock')
      enterCurrentBlocks.each(function (d, i) {
        d = d.block
        let middleRect = headerBoxRunningPhase.x + (headerBoxRunningPhase.w * 0.5)
        let grunphase = d3.select(this).append('g').attr('id', 'grunphase')

        initConfigDataFinish(grunphase)

        d3.select(this).append('rect')
          .attr('id', 'middle')
          .attr('x', queueRun.length > 6 ? middleRect - (headerBoxRunningPhase.w * 0.8 * 0.5) : middleRect - (headerBoxRunningPhase.w * 0.33 * 0.5))
          .attr('y', headerBoxRunningPhase.y + headerBoxRunningPhase.h * 0.05)
          .attr('width', queueRun.length > 6 ? headerBoxRunningPhase.w * 0.55 : headerBoxRunningPhase.w * 0.32)
          .attr('height', headerBoxRunningPhase.h * 0.9)
          .attr('fill', colorTheme.blocks.run.background)
          .attr('fill-opacity', 0.6)
          .attr('stroke', colorTheme.dark.stroke)

        let gtext = d3.select(this).append('g').attr('id', 'text')
        initRunPhase(grunphase, d.runPhase, gtext)

        gtext.append('text')
          .attr('id', 'name')
          .text(function () {
            return d.metaData.blockName
          })
          .attr('x', queueRun.length > 6 ? headerBoxId.w * 0.5 - 4 : headerBoxId.w * 0.5)
          .attr('y', queueRun.length > 6 ? headerBoxId.h * 0.75 : headerBoxId.h * 0.4)
          .attr('dy', 0)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'bold')
          .style('font-size', Math.max(12, Math.min(20, headerBoxId.h * 0.6)))
          .attr('text-anchor', queueRun.length > 6 ? 'end' : 'middle')
        gtext.append('text')
          .attr('id', 'percent')
          .attr('x', queueRun.length > 6 ? headerBoxId.w * 0.4 + 4 : headerBoxId.w * 0.5)
          .attr('y', queueRun.length > 6 ? headerBoxId.h * 0.65 : headerBoxId.h * 0.80)
          .attr('dy', 0)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', '')
          .style('font-size', Math.max(12, Math.min(20, headerBoxId.h * 0.6)))
          .attr('text-anchor', queueRun.length > 6 ? 'start' : 'middle')
      })

      let mergeCurrentBlocks = currentBlocks.merge(enterCurrentBlocks)

      mergeCurrentBlocks.each(function (d, i) {
        let block = d.block
        let translate = {
          x: blockBox.x,
          y: b.y + offsetY + (blockBox.y + blockBox.h) * i
        }

        let grunphase = d3.select(this).select('g#grunphase')
        updateConfigDataFinish(grunphase)
        let step = dispatchRunPhase(d3.select(this).select('#grunphase'), block.runPhase, d3.select(this).select('#text'))
        let percent = 1 - (block.endTime - shared.data.server.timeOfNight.now) / (block.endTime - block.startTime)
        let middleRect = headerBoxRunningPhase.x + (headerBoxRunningPhase.w * 0.5)

        d3.select(this).select('#middle')
          .attr('x', middleRect - (headerBoxRunningPhase.w * 0.33 * 0.5))
          .attr('width', headerBoxRunningPhase.w * 0.33)
          .attr('height', headerBoxRunningPhase.h * 0.9)
          .attr('stroke-width', queueRun.length > 6 ? 6 : 6)
          .attr('stroke-dasharray', [0, (1 - percent) * headerBoxRunningPhase.w * 0.33, percent * headerBoxRunningPhase.w * 0.33, headerBoxRunningPhase.w * 0.33 + headerBoxRunningPhase.h * 0.9 * 2])

        d3.select(this).select('#name')
          .attr('x', headerBoxId.w * 0.5)
          .attr('y', queueRun.length > 6 ? headerBoxId.h * 0.65 : headerBoxId.h * 0.4)
          .style('font-size', Math.max(6, Math.min(16, headerBoxId.h * 0.5)))
          .attr('text-anchor', queueRun.length > 6 ? 'middle' : 'middle')
        d3.select(this).select('#percent')
          .text(function () {
            return Math.floor(percent * 100) + '%'
          })
          .attr('x', queueRun.length > 6 ? (headerBoxId.w * (step === 'take' ? 0.55 : (step === 'finish' ? 0.64 : 0.45))) : headerBoxId.w * 0.5)
          .attr('y', queueRun.length > 6 ? headerBoxId.h * 0.65 : headerBoxId.h * 0.80)
          .style('font-size', Math.max(6, Math.min(14, headerBoxId.h * 0.5)))
          .attr('text-anchor', queueRun.length > 6 ? 'start' : 'middle')
          .style('opacity', queueRun.length > 6 ? 0 : 1)

        d3.select(this)
          .transition()
          .duration(timeD.animArc)
          .attr('transform', function () {
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })

        // let lineGenerator = d3.line()
        //   .x(function (d) { return d.x })
        //   .y(function (d) { return d.y })
        //   .curve(d3.curveBasis)
        // let dataPointFuturTop = [
        //   {x: blockBox.w + blockBox.x, y: -translate.y + box.blockQueueServerPast.y + d.y + d.h * 0.5},
        //   {x: blockBox.w + (blockBox.x) * 0.5, y: -translate.y + box.blockQueueServerPast.y + d.y + d.h * 0.5 - blockBox.h * 0.5},
        //   {x: blockBox.w + (blockBox.x) * 0.5, y: blockBox.h * 0.5},
        //   {x: blockBox.w, y: blockBox.h * 0.5},
        //
        //   {x: blockBox.w * 0.5, y: blockBox.h * 0.5},
        //
        //   {x: 0, y: blockBox.h * 0.5},
        //   {x: 0 - (blockBox.x * 0.5), y: blockBox.h * 0.5},
        //   {x: 0 - (blockBox.x * 0.5), y: -translate.y + box.blockQueueServerPast.y + d.y + d.h * 0.5 - blockBox.h * 0.5},
        //   {x: -blockBox.x, y: -translate.y + box.blockQueueServerPast.y + d.y + d.h * 0.5}
        // ]
        // d3.select(this).select('path')
        //   .data([dataPointFuturTop])
        //   .transition()
        //   .duration(timeD.animArc)
        //   .attr('d', lineGenerator)
      })
      currentBlocks
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    this.updateData = updateData
  }
  let SvgFreeTels = function () {
    let reserved = {}

    function initData () {
      reserved.back = svg.g.append('g')
        .attr('transform', 'translate(' + box.freeTels.x + ',' + box.freeTels.y + ')')
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.freeTels.x + ',' + box.freeTels.y + ')')
      let telsBox = deepCopy(box.freeTels)
      telsBox.x = telsBox.w * 0.1
      telsBox.w = telsBox.w * 0.8
      reserved.large = {
        g: reserved.gBlockBox.append('g'),
        opt: {
          telsPerRow: 2,
          nbl: 0,
          size: 2,
          ratio: 1
        },
        box: {
          x: telsBox.x,
          y: 0,
          w: telsBox.w * 0.1,
          h: telsBox.h
        }
      }
      reserved.medium = {
        g: reserved.gBlockBox.append('g'),
        opt: {
          telsPerRow: 6,
          nbl: 0,
          size: 1.3,
          ratio: 1
        },
        box: {
          x: telsBox.x + telsBox.w * 0.13,
          y: 0,
          w: telsBox.w * 0.3,
          h: telsBox.h
        }
      }
      reserved.small = {
        g: reserved.gBlockBox.append('g'),
        opt: {
          telsPerRow: 14,
          nbl: 0,
          size: 1,
          ratio: 1
        },
        box: {
          x: telsBox.x + telsBox.w * 0.46,
          y: 0,
          w: telsBox.w * 0.54,
          h: telsBox.h
        }
      }

      reserved.back.append('rect')
        .attr('id', 'idle')
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      reserved.back.append('rect')
        .attr('id', 'idleMiddle')
        .attr('fill', colorTheme.darker.background)
        .attr('stroke-width', 0.0)
        .attr('stroke', colorTheme.dark.stroke)
      reserved.back.append('text')
        .attr('id', 'idle')
        .text('Idle')
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .attr('text-anchor', 'middle')
      reserved.back.append('rect')
        .attr('id', 'name')
        .attr('x', box.freeTels.w - lenD.w[0] + box.freeTels.x)
        .attr('y', 0)
        .attr('width', lenD.w[0])
        .attr('height', 23)
        .attr('fill', colorTheme.dark.stroke)

      reserved.large.g.attr('transform', 'translate(' + reserved.large.box.x + ',' + reserved.large.box.y + ')')
      reserved.large.g.append('text')
        .attr('id', 'title')
        .text('Large')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (reserved.large.box.w * 0.5) + ',' + (-reserved.large.box.h * 0.0) + ')')

      reserved.medium.g.attr('transform', 'translate(' + reserved.medium.box.x + ',' + reserved.medium.box.y + ')')
      reserved.medium.g.append('text')
        .attr('id', 'title')
        .text('Medium')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (reserved.medium.box.w * 0.5) + ',' + (-reserved.medium.box.h * 0.0) + ')')

      if (isSouth) {
        reserved.small.g.attr('transform', 'translate(' + reserved.small.box.x + ',' + reserved.small.box.y + ')')
        reserved.small.g.append('text')
          .attr('id', 'title')
          .text('Small')
          .style('fill', colorTheme.bright.background)
          .style('font-weight', 'bold')
          .style('font-size', '18px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (reserved.small.box.w * 0.5) + ',' + (-reserved.small.box.h * 0.0) + ')')
      }

      updateData()
    }
    this.initData = initData

    function updateData () {
      let ratio = 0
      let header = 25
      let maxHeight = reserved.large.box.h - header // / (shared.data.server.blocks.run.length + 1)) * shared.data.server.blocks.run.length
      let runTels = []
      let freeTels = deepCopy(shared.data.server.telIds)
      let idleRow = 0

      function computeSizeRows () {
        for (let i = 0; i < shared.data.server.blocks.run.length; i++) {
          runTels = runTels.concat(shared.data.server.blocks.run[i].telIds)
          let largeT = []
          let mediumT = []
          let smallT = []
          for (let j = 0; j < shared.data.server.blocks.run[i].telIds.length; j++) {
            let t = shared.data.server.blocks.run[i].telIds[j]
            if (t[0] === 'L') largeT.push(t)
            if (t[0] === 'M') mediumT.push(t)
            if (t[0] === 'S') smallT.push(t)
          }
          let l = reserved.large.opt.size * (parseInt(largeT.length / reserved.large.opt.telsPerRow) + (largeT.length % reserved.large.opt.telsPerRow !== 0 ? 1 : 0))
          let m = reserved.medium.opt.size * (parseInt(mediumT.length / reserved.medium.opt.telsPerRow) + (mediumT.length % reserved.medium.opt.telsPerRow !== 0 ? 1 : 0))
          let s = reserved.small.opt.size * (parseInt(smallT.length / reserved.small.opt.telsPerRow) + (smallT.length % reserved.small.opt.telsPerRow !== 0 ? 1 : 0))

          shared.data.server.blocks.run[i].telsInfo = {
            large: largeT.length,
            medium: mediumT.length,
            small: smallT.length
          }
          let max = Math.max(Math.max(l, m), s)
          shared.data.server.blocks.run[i].rowHeight = max
          ratio += max
        }

        freeTels = freeTels.filter(value => !runTels.includes(value))
        let largeT = []
        let mediumT = []
        let smallT = []
        for (let i = 0; i < freeTels.length; i++) {
          let t = freeTels[i]
          if (t[0] === 'L') largeT.push(t)
          if (t[0] === 'M') mediumT.push(t)
          if (t[0] === 'S') smallT.push(t)
        }
        let l = reserved.large.opt.size * (parseInt(largeT.length / reserved.large.opt.telsPerRow) + (largeT.length % reserved.large.opt.telsPerRow !== 0 ? 1 : 0))
        let m = reserved.medium.opt.size * (parseInt(mediumT.length / reserved.medium.opt.telsPerRow) + (mediumT.length % reserved.medium.opt.telsPerRow !== 0 ? 1 : 0))
        let s = reserved.small.opt.size * (parseInt(smallT.length / reserved.small.opt.telsPerRow) + (smallT.length % reserved.small.opt.telsPerRow !== 0 ? 1 : 0))

        let max = Math.max(Math.max(l, m), s)
        max = shared.data.server.blocks.run.length === 0 ? 9 : max
        ratio += max
        idleRow = max / ratio

        for (let i = 0; i < shared.data.server.blocks.run.length; i++) {
          shared.data.server.blocks.run[i].rowHeight = shared.data.server.blocks.run[i].rowHeight / ratio
        }
        reserved.large.opt.ratio = reserved.large.opt.size / ratio
        reserved.medium.opt.ratio = reserved.medium.opt.size / ratio
        reserved.small.opt.ratio = reserved.small.opt.size / ratio
      }
      function drawTels (tels, g, box, opt) {
        if (tels.length === 0) return
        let nbline = parseInt(tels.length / opt.telsPerRow) + (tels.length % opt.telsPerRow !== 0 ? 1 : 0)
        let dim = {
          w: maxHeight * opt.ratio * 0.9,
          h: maxHeight * opt.ratio * 0.9
        }
        let size = {
          w: Math.min(16, Math.max(14, dim.w * 0.48)),
          h: Math.min(16, Math.max(6, dim.h * 0.48))
        }
        let fontsize = Math.max(Math.min(size.w * 0.4, 26), 11)
        let offset = {
          x: (box.w - (opt.telsPerRow * size.w * 2)) * 0.5, // (opt.telsPerRow + 1),
          y: (box.h - (nbline * size.h * 2)) * 0.5// (nbline + 1)
        }
        let lastLineOffset = {
          index: parseInt(((nbline - 1) * opt.telsPerRow)) - 1,
          x: (tels.length % opt.telsPerRow !== 0) ? (box.w - ((tels.length % opt.telsPerRow) * size.w * 2)) * 0.5 : offset.x
        }

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
            let tx = offset.x + (size.w) * (i % opt.telsPerRow) + (i > lastLineOffset.index ? lastLineOffset.x : 0)
            let ty = box.y + offset.y + (size.h) * parseInt((i / opt.telsPerRow))
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
            .text(function (d) {
              return d.id.split('_')[1]
            })
            .style('fill', colorTheme.blocks.run.text)
            .style('stroke', colorTheme.blocks.run.text)
            .style('font-weight', '')
            .style('font-size', size.w * 0.1)
            .style('stroke-width', 0.2)
            .attr('text-anchor', 'middle')
        })

        let merge = current.merge(enter)
        merge.each(function (d, i) {
          d3.select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('transform', function (d) {
              let tx = size.w * 0.5 + (size.w * 2) * (i % opt.telsPerRow) + (i > lastLineOffset.index ? lastLineOffset.x : offset.x)
              let ty = box.y + offset.y + (size.h * 2) * parseInt(i / opt.telsPerRow) + size.h * 0.5
              return 'translate(' + tx + ',' + ty + ')'
            })
          d3.select(this).select('ellipse')
            .transition()
            .duration(timeD.animArc)
            .attr('fill', telHealthCol(d.val))
            .attr('cx', size.w * 0.5)
            .attr('cy', size.h * 0.5)
            .attr('rx', size.w)
            .attr('ry', size.h)
          d3.select(this).select('text')
            .text(function (d) {
              return d.id.split('_')[1]
            })
            .attr('x', size.w * 0.5)
            .attr('y', size.h * 0.5 + fontsize * 0.33)
            .style('font-size', fontsize)
        })

        // current
        //   .exit()
        //   .transition('inOut')
        //   .duration(timeD.animArc)
        //   .style('opacity', 0)
        //   .remove()
      }
      computeSizeRows()

      reserved.back.select('rect#name')
        .transition()
        .duration(timeD.animArc)
        .attr('y', 0)
      reserved.large.g.select('text#title')
        .transition()
        .duration(timeD.animArc)
        .attr('y', header * 0.75)
      reserved.medium.g.select('text#title')
        .transition()
        .duration(timeD.animArc)
        .attr('y', header * 0.75)
      reserved.small.g.select('text#title')
        .transition()
        .duration(timeD.animArc)
        .attr('y', header * 0.75)

      let offset = {
        x: 0,
        y: 25
      }
      let current = reserved.back
        .selectAll('g.block')
        .data(shared.data.server.blocks.run, function (d) {
          return d.obId
        })
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'block')
      enter.each(function (d, i) {
        let sizeRow = maxHeight * d.rowHeight
        d3.select(this).attr('transform', function (d) {
          let tx = offset.x
          let ty = offset.y
          offset.y += sizeRow
          return 'translate(' + tx + ',' + ty + ')'
        })
        d3.select(this).append('rect')
          .attr('id', 'strip')
          .attr('x', 0)
          .attr('y', sizeRow * 0.08)
          .attr('width', box.freeTels.w * 1.0)
          .attr('height', sizeRow * 0.84)
          .attr('fill', colorTheme.blocks.run.background)
          .attr('fill-opacity', 0.3)
          .attr('stroke-width', 0.0)
          .attr('stroke', colorTheme.dark.stroke)
        d3.select(this).append('rect')
          .attr('id', 'stripMiddle')
          .attr('x', reserved.medium.box.x)
          .attr('y', sizeRow * 0.08)
          .attr('width', reserved.medium.box.w)
          .attr('height', sizeRow * 0.84)
          .attr('fill', colorTheme.blocks.run.background)
          .attr('fill-opacity', 0.4)
          .attr('stroke-width', 0.0)
          .attr('stroke', colorTheme.dark.stroke)

        d3.select(this).append('rect')
          .attr('id', 'blockleft')
          .attr('x', 0)
          .attr('y', sizeRow * 0.05)
          .attr('width', box.freeTels.w * 0.08)
          .attr('height', sizeRow * 0.9)
          .attr('fill', colorTheme.blocks.run.background)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 0.4)
          .attr('stroke', colorTheme.dark.stroke)
        d3.select(this).append('text')
          .attr('id', 'name')
          .attr('x', box.freeTels.w * 0.04)
          .attr('y', sizeRow * 0.5 + 0.5 * Math.max(Math.min(sizeRow * 0.24, 18), 18))
          .text(function (d) {
            return d.metaData.blockName
          })
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'bold')
          .style('font-size', Math.max(Math.min(sizeRow * 0.26, 18), 18) + 'px')
          .attr('text-anchor', 'middle')
        // d3.select(this).append('text')
        //   .attr('id', 'pointing')
        //   .text(d.pointingName.split('/')[1])
        //   .attr('x', box.freeTels.w * 0.08 * 0.5)
        //   .attr('y', sizeRow * 0.33 + 2 * Math.max(Math.min(sizeRow * 0.26, 22), 8))
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-weight', 'normal')
        //   .style('font-size', Math.max(Math.min(sizeRow * 0.24, 15), 8) + 'px')
        //   .attr('text-anchor', 'middle')

        d3.select(this).append('rect')
          .attr('id', 'blockright')
          .attr('x', box.freeTels.w - box.freeTels.w * 0.08)
          .attr('y', sizeRow * 0.05)
          .attr('width', box.freeTels.w * 0.08)
          .attr('height', sizeRow * 0.9)
          .attr('fill', colorTheme.blocks.run.background)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 0.4)
          .attr('stroke', colorTheme.dark.stroke)
        d3.select(this).append('text')
          .attr('id', 'target')
          .text(d.pointingName.split('/')[0])
          .attr('x', box.freeTels.w - box.freeTels.w * 0.04)
          .attr('y', sizeRow * 0.5 + 0.5 * Math.max(Math.min(sizeRow * 0.24, 18), 18))
          // .attr('x', box.freeTels.w * 0.08 * 0.5)
          // .attr('y', sizeRow * 0.33 + Math.max(Math.min(sizeRow * 0.26, 22), 8))
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', Math.max(Math.min(sizeRow * 0.24, 18), 18) + 'px')
          .attr('text-anchor', 'middle')
        // d3.select(this).append('text')
        //   .text('L =  ' + d.telsInfo.large)
        //   // .text(d.telsInfo.large + ' :L: ' + Math.floor(d.telsInfo.large / 4 * 100) + '%')
        //   .attr('x', box.freeTels.w - box.freeTels.w * 0.04)
        //   .attr('y', sizeRow * 0.5 - 0.7 * Math.max(Math.min(sizeRow * 0.24, 18), 8))
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-weight', 'normal')
        //   .style('font-size', Math.max(Math.min(sizeRow * 0.24, 18), 8) + 'px')
        //   .attr('text-anchor', 'middle')
        // d3.select(this).append('text')
        //   .text('M =  ' + d.telsInfo.medium)
        //   // .text(d.telsInfo.medium + ' :M: ' + Math.floor(d.telsInfo.medium / 25 * 100) + '%')
        //   .attr('x', box.freeTels.w - box.freeTels.w * 0.04)
        //   .attr('y', sizeRow * 0.5 + 0.5 * Math.max(Math.min(sizeRow * 0.24, 18), 8))
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-weight', 'normal')
        //   .style('font-size', Math.max(Math.min(sizeRow * 0.24, 18), 8) + 'px')
        //   .attr('text-anchor', 'middle')
        // d3.select(this).append('text')
        //   .text('S =  ' + d.telsInfo.small)
        //   // .text(d.telsInfo.small + ' :S: ' + Math.floor(d.telsInfo.small / 70 * 100) + '%')
        //   .attr('x', box.freeTels.w - box.freeTels.w * 0.04)
        //   .attr('y', sizeRow * 0.5 + 1.7 * Math.max(Math.min(sizeRow * 0.24, 18), 8))
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-weight', 'normal')
        //   .style('font-size', Math.max(Math.min(sizeRow * 0.24, 18), 8) + 'px')
        //   .attr('text-anchor', 'middle')
      })
      offset = {
        x: 0,
        y: header
      }
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let sizeRow = maxHeight * d.rowHeight
        d3.select(this).attr('transform', function (d) {
          let tx = offset.x
          let ty = offset.y
          offset.y += sizeRow
          return 'translate(' + tx + ',' + ty + ')'
        })
        d3.select(this).select('rect#blockleft')
          .transition()
          .duration(timeD.animArc)
          .attr('x', 0)
          .attr('y', 1)
          .attr('width', box.freeTels.w * 0.08)
          .attr('height', sizeRow - 2)
        d3.select(this).select('rect#blockright')
          .transition()
          .duration(timeD.animArc)
          .attr('x', box.freeTels.w - box.freeTels.w * 0.08)
          .attr('y', 1)
          .attr('width', box.freeTels.w * 0.08)
          .attr('height', sizeRow - 2)
        d3.select(this).select('rect#strip')
          .transition()
          .duration(timeD.animArc)
          .attr('x', 0)
          .attr('y', 2)
          .attr('width', box.freeTels.w * 1)
          .attr('height', sizeRow - 4)
        d3.select(this).select('rect#stripMiddle')
          .transition()
          .duration(timeD.animArc)
          .attr('x', reserved.medium.box.x)
          .attr('y', 2)
          .attr('width', reserved.medium.box.w)
          .attr('height', sizeRow - 4)

        let sizeFont = Math.max(Math.min(sizeRow * 0.24, 18), 10)
        d3.select(this).select('text#name')
          .attr('y', sizeRow * 0.5 + 0.35 * sizeFont)
          .style('font-size', sizeFont + 'px')
        d3.select(this).select('text#target')
          .attr('y', sizeRow * 0.5 + 0.35 * sizeFont)
          .style('font-size', sizeFont + 'px')
          // .attr('x', box.freeTels.w * 0.08 * 0.5)
          // .attr('y', sizeRow * 0.33 + Math.max(Math.min(sizeRow * 0.26, 22), 8))
        // d3.select(this).select('text#pointing')
        //   .attr('x', box.freeTels.w * 0.08 * 0.5)
        //   .attr('y', sizeRow * 0.33 + 2 * Math.max(Math.min(sizeRow * 0.26, 22), 8))
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()

      offset = {
        x: 0,
        y: header
      }
      for (let i = 0; i < shared.data.server.blocks.run.length; i++) {
        let sizeRow = maxHeight * shared.data.server.blocks.run[i].rowHeight
        let largeT = []
        let mediumT = []
        let smallT = []
        for (let j = 0; j < shared.data.server.blocks.run[i].telIds.length; j++) {
          let t = getTelHealthById(shared.data.server.blocks.run[i].telIds[j])
          t.running = false
          if (t.id[0] === 'L') largeT.push(t)
          if (t.id[0] === 'M') mediumT.push(t)
          if (t.id[0] === 'S') smallT.push(t)
        }
        largeT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
        mediumT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
        smallT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
        let lb = {x: reserved.large.box.x, y: offset.y, w: reserved.large.box.w, h: sizeRow}
        let mb = {x: reserved.medium.box.x, y: offset.y, w: reserved.medium.box.w, h: sizeRow}
        let sb = {x: reserved.small.box.x, y: offset.y, w: reserved.small.box.w, h: sizeRow}
        drawTels(largeT, reserved.large.g, lb, reserved.large.opt)
        drawTels(mediumT, reserved.medium.g, mb, reserved.medium.opt)
        drawTels(smallT, reserved.small.g, sb, reserved.small.opt)
        offset.y += sizeRow
      }

      let sizeRow = maxHeight * idleRow
      let largeT = []
      let mediumT = []
      let smallT = []
      for (let i = 0; i < freeTels.length; i++) {
        let t = getTelHealthById(freeTels[i])
        t.running = false
        if (t.id[0] === 'L') largeT.push(t)
        if (t.id[0] === 'M') mediumT.push(t)
        if (t.id[0] === 'S') smallT.push(t)
      }
      largeT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
      mediumT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
      smallT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
      let lb = {x: reserved.large.box.x, y: offset.y, w: reserved.large.box.w, h: sizeRow}
      let mb = {x: reserved.medium.box.x, y: offset.y, w: reserved.medium.box.w, h: sizeRow}
      let sb = {x: reserved.small.box.x, y: offset.y, w: reserved.small.box.w, h: sizeRow}
      drawTels(largeT, reserved.large.g, lb, reserved.large.opt)
      drawTels(mediumT, reserved.medium.g, mb, reserved.medium.opt)
      drawTels(smallT, reserved.small.g, sb, reserved.small.opt)

      let sizeFont = Math.max(Math.min(sizeRow * 0.24, 18), 10)
      reserved.back.select('text#idle')
        .transition()
        .duration(timeD.animArc)
        .attr('x', box.freeTels.w * 0.04)
        .attr('y', (sizeRow * 0.5) + (sizeFont * 0.4) + offset.y)
        .attr('opacity', freeTels.length === 0 ? 0 : 1)
        .style('font-size', sizeFont + 'px')
      reserved.back.select('rect#idle')
        .transition()
        .duration(timeD.animArc)
        .attr('x', 0)
        .attr('y', offset.y + 4)
        .attr('width', box.freeTels.w * 1.0)
        .attr('height', sizeRow - 8)
      reserved.back.select('rect#idleMiddle')
        .transition()
        .duration(timeD.animArc)
        .attr('x', reserved.medium.box.x)
        .attr('y', offset.y + 4)
        .attr('width', reserved.medium.box.w)
        .attr('height', sizeRow - 8)
    }
    this.updateData = updateData
    // function updateData () {
    //   function strokeSize (val) {
    //     return 0.4 // (2 - (2 * (val / 100)))
    //   }
    //   function fillOpacity (val) {
    //     return 1 // (0.9 - (0.5 * (val / 100)))
    //   }
    //
    //   let runTels = []
    //   for (let i = 0; i < shared.data.server.blocks.run.length; i++) {
    //     runTels = runTels.concat(shared.data.server.blocks.run[i].telIds)
    //   }
    //   let freeTels = deepCopy(shared.data.server.telIds)
    //   freeTels = freeTels.filter(value => !runTels.includes(value))
    //   let tels = []
    //   for (let i = 0; i < runTels.length; i++) {
    //     let t = getTelHealthById(runTels[i])
    //     t.running = true
    //     tels.push(t)
    //   }
    //   for (let i = 0; i < freeTels.length; i++) {
    //     let t = getTelHealthById(freeTels[i])
    //     t.running = false
    //     tels.push(t)
    //   }
    //
    //   tels.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
    //
    //   let defaultHeightView = box.freeTels.h
    //   let widthBlocks = box.freeTels.w - box.freeTels.marg
    //   // let offsetX = (box.currentBlocks.w - widthBlocks) * 0.5
    //
    //   let telsPerRow = 12
    //   let sizeTelsRow = 0.1
    //   let offsetTelsType = 0.5
    //
    //   let ratio = 1
    //
    //   // let toff = 0
    //   // for (let i = 0; i < tels.length - 1; i++) {
    //   //   if (tels[i].id.split('_')[0] !== tels[i + 1].id.split('_')[0]) toff += 1
    //   // }
    //
    //   // let nTel = tels.length + toff
    //   // let nLine = (nTel % telsPerRow === 0) ? (nTel / telsPerRow) : (1 + parseInt(nTel / telsPerRow))
    //   // nLine = nLine < 1 ? 1 : nLine
    //
    //   let off = 0
    //   if (tels.length > 0 && tels[0].id.split('_')[0] === 'M') off -= 1
    //   if (tels.length > 0 && tels[0].id.split('_')[0] === 'S') off -= 2
    //
    //   let telsBox = {
    //     x: box.freeTels.marg,
    //     y: 0,
    //     w: widthBlocks,
    //     h: defaultHeightView
    //   }
    //   let offset = {
    //     x: telsBox.w / telsPerRow,
    //     ty: (ratio * offsetTelsType * sizeTelsRow * defaultHeightView),
    //     y: (ratio * sizeTelsRow * defaultHeightView)
    //   }
    //
    //   let currentTels = reserved.telsBox
    //     .selectAll('g.currentTel')
    //     .data(tels, function (d) {
    //       return d.id
    //     })
    //   let enterCurrentTels = currentTels
    //     .enter()
    //     .append('g')
    //     .attr('class', 'currentTel')
    //   enterCurrentTels.each(function (d, i) {
    //     let toff = off
    //     if (d.id.split('_')[0] === 'M') toff += 1
    //     if (d.id.split('_')[0] === 'S') toff += 2
    //
    //     d3.select(this).attr('transform', function (d) {
    //       let tx = -(parseInt((i + toff) / telsPerRow) % 2) === 0 ?
    //         (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
    //         (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
    //       let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)
    //       return 'translate(' + tx + ',' + ty + ')'
    //     })
    //     d3.select(this).append('rect')
    //       .attr('x', function (d) {
    //         return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
    //       })
    //       .attr('y', function (d) {
    //         return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
    //       })
    //       .attr('width', function (d) {
    //         return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
    //       })
    //       .attr('height', function (d) {
    //         return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
    //       })
    //       .attr('fill', function (d) {
    //         return telHealthCol(d.val)
    //       })
    //       .attr('fill-opacity', function (d) {
    //         return fillOpacity(d.val)
    //       })
    //       .attr('stroke-width', function (d) {
    //         return strokeSize(d.val)
    //       })
    //       .attr('stroke', function (d) {
    //         return telHealthCol(d.val)
    //       })
    //       .attr('stroke-opacity', function (d) {
    //         return 1
    //       })
    //       .attr('rx', 20)
    //       .attr('ry', 20)
    //     d3.select(this).append('text')
    //       .attr('x', 0)
    //       .attr('y', offset.y * 0.2)
    //       .attr('dy', 0)
    //       .text(function (d) {
    //         return d.id // d.id.split('_')[1]
    //       })
    //       .style('fill', colorTheme.blocks.run.text)
    //       .style('font-weight', 'normal')
    //       .style('font-size', function (d) {
    //         return 6.2 // - (2 * (d.val / 100))
    //       })
    //       .attr('text-anchor', 'middle')
    //   })
    //
    //   let mergeCurrentTels = currentTels.merge(enterCurrentTels)
    //   mergeCurrentTels.each(function (d, i) {
    //     let toff = off
    //     if (d.id.split('_')[0] === 'M') toff += 1
    //     if (d.id.split('_')[0] === 'S') toff += 2
    //
    //     d3.select(this)
    //       .attr('transform', function (d) {
    //         let tx = -(parseInt((i + toff) / telsPerRow) % 2) === 0 ?
    //           (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
    //           (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
    //         let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)
    //         return 'translate(' + tx + ',' + ty + ')'
    //       })
    //       .style('opacity', function () {
    //         if (!d.running) return 1
    //         return 0.4
    //       })
    //     d3.select(this).select('rect')
    //       .transition()
    //       .duration(timeD.animArc)
    //       .attr('x', function (d) {
    //         return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
    //       })
    //       .attr('y', function (d) {
    //         return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
    //       })
    //       .attr('width', function (d) {
    //         return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
    //       })
    //       .attr('height', function (d) {
    //         return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
    //       })
    //       .attr('fill', function (d) {
    //         if (!d.running) return telHealthCol(d.val)
    //         return colorTheme.dark.background
    //       })
    //       // .attr('fill-opacity', function (d) {
    //       //   return fillOpacity(d.val)
    //       // })
    //       .attr('stroke-width', function (d) {
    //         return strokeSize(d.val)
    //       })
    //       .attr('stroke', function (d) {
    //         // if (!d.running) return telHealthCol(d.val)
    //         return colorTheme.dark.stroke
    //       })
    //       // .attr('stroke-opacity', function (d) {
    //       //   if (!d.running) return 1
    //       //   return 1
    //       // })
    //     d3.select(this).select('text')
    //       .attr('x', 0)
    //       .attr('y', offset.y * 0.2)
    //       .attr('dy', 0)
    //       .text(function (d) {
    //         return d.id // d.id.split('_')[1]
    //       })
    //       .style('fill', colorTheme.blocks.run.text)
    //       .style('font-weight', 'normal')
    //       .style('font-size', function (d) {
    //         return 6.2 // - (2 * (d.val / 100))
    //       })
    //       .attr('text-anchor', 'middle')
    //   })
    //
    //   currentTels
    //     .exit()
    //     .transition('inOut')
    //     .duration(timeD.animArc)
    //     .style('opacity', 0)
    //     .remove()
    // }
    // this.updateData = updateData
  }

  let svgEventsQueueServerPast = new SvgEventsQueueServerPast()
  let svgEventsQueueServerFutur = new SvgEventsQueueServerFutur()
  let svgBrushPast = new SvgBrushPast()
  let svgBrushFutur = new SvgBrushFutur()
  let svgBlocksQueueServerPast = new SvgBlocksQueueServerPast()
  let svgBlocksQueueServerFutur = new SvgBlocksQueueServerFutur()
  let svgRunningPhase = new SvgRunningPhase()
  let svgFreeTels = new SvgFreeTels()
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function getFocusBlock (optIn) {
    let focusBlock = null
    let blocks = optIn.blocks

    if (hasVar(blocks)) {
      $.each(blocks, function (index0, dataNow0) {
        if (hasVar(focusBlock)) return
        $.each(dataNow0, function (index1, dataNow1) {
          if (optIn.focusId === dataNow1.obId) focusBlock = dataNow1
        })
      })
    }

    return hasVar(focusBlock) ? focusBlock : {}
  }

  // // ---------------------------------------------------------------------------------------------------
  // //
  // // ---------------------------------------------------------------------------------------------------
  // function syncStateGet(dataIn) {
  //   // console.log(' - _schedBlocks_ - syncStateGet ',dataIn);
  //   return;
  // }
  // this.syncStateGet = syncStateGet;

  let svgMain = new SvgMain()
}

// // ---------------------------------------------------------------------------------------------------
// //
// // ---------------------------------------------------------------------------------------------------
// let _utils = function() {

//   // ---------------------------------------------------------------------------------------------------
//   //
//   // ---------------------------------------------------------------------------------------------------
//   function getFocusBlock(optIn) {
//     let focusBlock = null;
//     let blocks = optIn.blocks;

//     if(hasVar(blocks)) {
//       $.each(blocks, function(index0,dataNow0) {
//         if(hasVar(focusBlock)) return;
//         $.each(dataNow0, function(index1,dataNow1) {
//           if(optIn.focusId == dataNow1.obId) focusBlock = dataNow1;
//         });
//       });
//     }

//     return hasVar(focusBlock) ? focusBlock : {};
//   }
//   this.getFocusBlock = getFocusBlock;

//   return;
// }
