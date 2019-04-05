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
/* global TelescopeDisplayer */
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
window.loadScript({ source: mainScriptTag, script: '/js/utils_telescopeDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockDisplayer.js' })
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
  let telescopeRunning = null

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
        x: lenD.w[0] * 0.0,
        y: lenD.h[0] * 0.585,
        w: lenD.w[0] * 1,
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
      let telsBox = deepCopy(box.freeTels)
      // telsBox.x = telsBox.w * 0.1
      // telsBox.w = telsBox.w * 0.8
      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + box.freeTels.x + ',' + box.freeTels.y + ')')

      let xx = telsBox.w * 0.1
      let ww = telsBox.w * 0.8
      let largeBox = {
        x: xx,
        y: 0,
        w: ww * 0.1,
        h: telsBox.h
      }
      let mediumBox = {
        x: xx + ww * 0.13,
        y: 0,
        w: ww * 0.3,
        h: telsBox.h
      }
      let smallBox = {
        x: xx + ww * 0.46,
        y: 0,
        w: ww * 0.54,
        h: telsBox.h
      }

      telescopeRunning = new TelescopeDisplayer({
        main: {
          tag: 'telescopeRootTag',
          g: reserved.g,
          scroll: {},
          box: telsBox,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          isSouth: isSouth,
          colorTheme: colorTheme
        },

        displayer: 'gridBib',
        gridBib: {
          header: {
            txtSize: 16,
            stripHeight: 23
          },
          telescope: {
            enabled: true,
            large: {
              g: undefined,
              opt: {
                telsPerRow: 2,
                nbl: 0,
                size: 2,
                ratio: 1
              },
              box: largeBox
            },
            medium: {
              g: undefined,
              opt: {
                telsPerRow: 6,
                nbl: 0,
                size: 1.3,
                ratio: 1
              },
              box: mediumBox
            },
            small: {
              g: undefined,
              opt: {
                telsPerRow: 14,
                nbl: 0,
                size: 1,
                ratio: 1
              },
              box: smallBox
            }
          },
          idle: {
            enabled: true
          },
          blocks: {
            right: {
              enabled: true
            },
            left: {
              enabled: true
            }
          }
        },

        filters: {
          telescopeFilters: [],
          filtering: []
        },
        data: {
          raw: {
            telescopes: []
          },
          filtered: {},
          modified: []
        },
        debug: {
          enabled: false
        },
        pattern: {
          select: {}
        },
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
          telescope: {
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
          over: {
            telescope: undefined
          },
          focus: {
            telescope: undefined
          }
        }
      })
      telescopeRunning.init()

      updateData()
    }
    this.initData = initData

    function updateData () {
      let tels = []
      for (let i = 0; i < shared.data.server.telIds.length; i++) {
        let id = shared.data.server.telIds[i]
        tels.push({id: id, health: getTelHealthById(id).val})
      }
      telescopeRunning.updateData({
        data: {
          raw: {
            telescopes: tels,
            blocks: shared.data.server.blocks.run
          },
          modified: []
        }
      })
    }
    this.updateData = updateData
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
}
