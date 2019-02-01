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
        .style('background', colorTheme.bright.background)

      svg.back.append('rect')
        .attr('x', -lenD.w[0] * 0.1)
        .attr('y', lenD.h[0] * 0.005)
        .attr('width', lenD.w[0] * 0.59)
        .attr('height', lenD.h[0] * 0.475 + lenD.h[0] * 0.0)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.2)
        .attr('rx', 0)
      svg.back.append('text')
        .text('Scheduling blocks & Events')
        .style('fill', colorTheme.medium.text)
        // .style('stroke', colorTheme.medium.text)
        // .style('stroke-size', 0.1)
        .style('font-weight', '')
        .style('font-size', '10px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + ((-lenD.w[0] * 0.15 + lenD.w[0] * 0.59) * 0.5) + ',' + (lenD.h[0] * 0.03) + ')')
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.54 * 0.5 - lenD.w[0] * 0.05)
      //   .attr('y', lenD.h[0] * 0.025 - lenD.h[0] * 0.015)
      //   .attr('width', lenD.w[0] * 0.1)
      //   .attr('height', lenD.h[0] * 0.03)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.6)
      //   .attr('rx', 2)
      svg.back.append('rect')
        .attr('x', -lenD.w[0] * 0.1)
        .attr('y', lenD.h[0] * 0.487)
        .attr('width', lenD.w[0] * 0.59)
        .attr('height', lenD.h[0] * 0.5075)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.2)
        .attr('rx', 0)
      svg.back.append('text')
        .text('Telescopes')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '10px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + ((-lenD.w[0] * 0.15 + lenD.w[0] * 0.59) * 0.5) + ',' + (lenD.h[0] * 0.51) + ')')
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.54 * 0.5 - lenD.w[0] * 0.05)
      //   .attr('y', lenD.h[0] * 0.5 - lenD.h[0] * 0.0125)
      //   .attr('width', lenD.w[0] * 0.1)
      //   .attr('height', lenD.h[0] * 0.025)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', colorTheme.medium.stroke)
      //   .attr('stroke-width', 0.4)

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.493)
        .attr('y', lenD.h[0] * 0)
        .attr('width', lenD.w[0] * 0.507)
        .attr('height', lenD.h[0] * 1)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.2)
    }
    function initBox () {
      box.blockQueueServer = {
        x: lenD.w[0] * 0.01,
        y: lenD.h[0] * 0.035,
        w: lenD.w[0] * 0.38,
        h: lenD.h[0] * 0.24,
        marg: lenD.w[0] * 0.01
      }
      box.eventQueueServer = {
        x: lenD.w[0] * 0.01,
        y: lenD.h[0] * 0.27,
        w: lenD.w[0] * 0.38,
        h: lenD.h[0] * 0.24,
        marg: lenD.w[0] * 0.01
      }
      box.telescopes = {
        x: lenD.w[0] * 0,
        y: lenD.h[0] * 0.5,
        w: lenD.w[0] * 0.48,
        h: lenD.h[0] * 0.5,
        marg: lenD.w[0] * 0.01
      }
      box.textEditor = {
        x: lenD.w[0] * 0.5,
        y: lenD.h[0] * 0.0,
        w: lenD.w[0] * 0.5,
        h: lenD.h[0] * 0.9,
        marg: lenD.w[0] * 0.01
      }
      box.clock = {
        x: lenD.w[0] * 0.5,
        y: lenD.h[0] * 0.92,
        w: lenD.w[0] * 0.49,
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

    svgBlocksQueueServer.initData(dataIn.data)
    svgEvents.initData(dataIn.data)
    svgTelescopes.initData(dataIn.data)
    svgTextEditor.initData(dataIn.data)
    svgBottomInfo.initData(dataIn.data)
  }
  this.initData = initData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateData (dataIn) {
    com.dataIn = dataIn

    // clusterData(com.dataIn.data)
    // filterData(com.dataIn.data)

    svgBlocksQueueServer.updateData(dataIn.data)
    // svgEvents.updateData(dataIn.data)
    // svgTels.updateData(dataIn.data)
    // svgFilterBlocks.updateData(dataIn.data)
    // svgMiddleInfo.updateData(dataIn.data)
    svgBottomInfo.updateData(dataIn.data)
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
  //
  // ---------------------------------------------------------------------------------------------------
  let SvgBlocksQueueServer = function () {
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServer.x + box.blockQueueServer.w * 0.03,
        y: box.blockQueueServer.y + box.blockQueueServer.h * 0.05,
        w: box.blockQueueServer.w * 0.94,
        h: box.blockQueueServer.h * 0.8,
        marg: lenD.w[0] * 0.01
      }

      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
      gBlockBox.append('text')
        .text('Current schedule')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-5,' + (box.blockQueueServer.h * 0.4) + ') rotate(270)')

      blockQueueServer = new BlockQueueCreator({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          box: adjustedBox,
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
        filters: {
          enabled: true,
          g: undefined,
          box: {x: adjustedBox.w * 1.01, y: adjustedBox.h * 0, w: adjustedBox.w * 0.22, h: adjustedBox.h * 1, marg: 0},
          filters: []
        },
        timeBars: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
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

      blockQueueServer.init()
      updateData()
    }
    this.initData = initData

    function updateData () {
      let telIds = []
      console.log(shared.data.current);
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
    let gBlockBox // , gEvents
    let blockBoxData
    let tagEventQueue = 'tagEventQueue'
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
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
          enabled: true,
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
    this.initData = initData

    function updateData (dataIn) {
      eventQueue.update({
        currentTime: {date: new Date(dataIn.timeOfNight.date_now), time: Number(dataIn.timeOfNight.now)},
        startTime: {date: new Date(dataIn.timeOfNight.date_start), time: Number(dataIn.timeOfNight.start)},
        endTime: {date: new Date(dataIn.timeOfNight.date_end), time: Number(dataIn.timeOfNight.end)},
        data: dataIn.external_events[0]
      })
    }
    this.updateData = updateData
  }
  // let SvgMiddleInfo = function () {
  //   let gBlockBox, gMiddleBox, gBackPattern
  //   let blockBoxData = {}
  //   let panelManager = null
  //   let currentPanels = []
  //   let commentPanel
  //
  //   function createMiddlePanel () {
  //     panelManager = new PanelManager()
  //     let optIn = {
  //       transX: 8,
  //       transY: 40,
  //       width: (-40 + blockBoxData.w * 0.93) / 1,
  //       height: (-20 + blockBoxData.h * 0.91) / 1,
  //       g: gMiddleBox.append('g'),
  //       manager: panelManager,
  //       dragable: {
  //         general: false,
  //         tab: false
  //       },
  //       closable: true
  //     }
  //     let g = gMiddleBox.append('g').attr('transform','translate(60,0)')
  //     optIn = {
  //       tag: 'tagDefaultPanelManager',
  //       g: g,
  //       box: {
  //         x: 1000,
  //         y: 40,
  //         w: (blockBoxData.w * 0.8),
  //         h: (-20 + blockBoxData.h * 0.91)
  //       },
  //       tab: {
  //         enabled: true,
  //         g: g.append('g'),
  //         box: {
  //           x: 0,
  //           y: 0,
  //           w: 1,
  //           h: 0.1
  //         },
  //         dimension: {w: 0, h: 0},
  //         dragable: false,
  //         closable: false
  //       },
  //       content: {
  //         enabled: true,
  //         g: g.append('g'),
  //         box: {
  //           x: 0,
  //           y: 0.1,
  //           w: 1,
  //           h: 0.9
  //         }
  //       },
  //       panels: {
  //         current: undefined,
  //         all: []
  //       },
  //       options: {
  //         dragable: false,
  //         closable: false
  //       }
  //     }
  //     panelManager.init(optIn)
  //
  //     commentPanel = new CustomPanel()
  //     commentPanel.setTabProperties('dragable', optIn.dragable)
  //     commentPanel.setTabProperties('closable', optIn.closable)
  //
  //     commentPanel.setRepaintPanel(drawCommentDisabled)
  //     commentPanel.setRepaintTab(drawTabDisabled)
  //
  //     panelManager.addNewPanel(commentPanel)
  //     currentPanels.push(commentPanel)
  //
  //     // backPattern.append('path')
  //     //   .attr('stroke', '#546E7A')
  //     //   .attr('fill', '#546E7A')
  //     //   .attr('stroke-width', 2)
  //     //   .attr('d', 'M 250 30 L 350 60 L 300 60 L 300 80 L 200 80 L 200 60 L 150 60 L 250 30')
  //   }
  //   this.createMiddlePanel = createMiddlePanel
  //
  //   function createBlockPanels (data) {
  //     let generalCommentLayout = function (g) {
  //       let scrollTable = new ScrollTable()
  //       let formManager = new FormManager()
  //
  //       let scrollTableData = {
  //         x: 0,
  //         y: 0,
  //         w: Number(g.attr('width')),
  //         h: Number(g.attr('height')),
  //         marg: 10
  //       }
  //       scrollTable.init({
  //         tag: 'tagScrollTable1',
  //         gBox: g,
  //         canScroll: true,
  //         useRelativeCoords: true,
  //         boxData: scrollTableData,
  //         locker: locker,
  //         lockerV: [widgetType + 'updateData'],
  //         lockerZoom: {
  //           all: tagBlockQueue + 'zoom',
  //           during: tagBlockQueue + 'zoomDuring',
  //           end: tagBlockQueue + 'zoomEnd'
  //         },
  //         runLoop: runLoop,
  //         background: '#ECEFF1'
  //       })
  //
  //       let innerBox = scrollTable.get('innerBox')
  //       let table = {
  //         id: 'xxx',
  //         x: innerBox.marg,
  //         y: innerBox.marg,
  //         marg: innerBox.marg,
  //         rowW: innerBox.w,
  //         rowH: innerBox.h / 4,
  //         rowsIn: []
  //       }
  //
  //       // table.rowsIn.push({ h: 9, colsIn: [{id:'01', w:0.3}], marg: innerBox.marg })
  //       table.rowsIn.push({
  //         h: 2,
  //         colsIn: [
  //           { id: '00', w: 1, title: 'BlockName', disabled: 1, text: data.metaData.blockName }
  //         ],
  //         marg: innerBox.marg
  //       })
  //       table.rowsIn.push({
  //         h: 2,
  //         colsIn: [
  //           { id: '01', w: 0.5, title: 'State', disabled: 1, text: data.exeState.state },
  //           { id: '02', w: 0.5, title: 'Schedule', disabled: 1, text: data.startTime + '-' + data.endTime + '(' + data.duration + ')' }
  //         ],
  //         marg: innerBox.marg
  //       })
  //       table.rowsIn.push({
  //         h: 2,
  //         colsIn: [
  //           { id: '10', w: 1, title: 'Pointing', disabled: 1 }
  //         ],
  //         marg: innerBox.marg
  //       })
  //       table.rowsIn.push({
  //         h: 2,
  //         colsIn: [
  //           { id: '20', w: 0.333, title: 'Id', disabled: 1, text: data.pointingId },
  //           { id: '21', w: 0.333, title: 'Name', disabled: 1, text: data.pointingName },
  //           { id: '22', w: 0.333, title: 'Pos', disabled: 1, text: '' + (data.pointingPos) }
  //         ],
  //         marg: innerBox.marg
  //       })
  //       table.rowsIn.push({
  //         h: 2,
  //         colsIn: [
  //           { id: '30', w: 1, title: 'Target', disabled: 1 }
  //         ],
  //         marg: innerBox.marg
  //       })
  //       table.rowsIn.push({
  //         h: 2,
  //         colsIn: [
  //           { id: '40', w: 0.5, title: 'Id', disabled: 1, text: data.targetId },
  //           { id: '41', w: 0.5, title: 'Position', disabled: 1, text: '' + data.targetPos }
  //         ],
  //         marg: innerBox.marg
  //       })
  //       scrollTable.updateTable({ table: table })
  //
  //       let innerG = scrollTable.get('innerG')
  //       let tagForms = 'tagForeignObject'
  //
  //       formManager.init({
  //         tag: 'tagFormManager'
  //       })
  //       com.getScaleWH = function () {
  //         return {
  //           w: lenD.w[0] / +svg.svg.node().getBoundingClientRect().width,
  //           h: lenD.h[0] / +svg.svg.node().getBoundingClientRect().height
  //         }
  //       }
  //       $.each(table.recV, function (i, d) {
  //         formManager.addForm({
  //           id: d.id,
  //           data: d,
  //           selection: innerG,
  //           formSubFunc: function (optIn) {
  //             console.log('formSubFunc:', optIn)
  //           },
  //           tagForm: tagForms,
  //           disabled: d.data.disabled ? d.data.disabled : 0,
  //           getScaleWH: com.getScaleWH,
  //           background: {
  //             input: '#ECEFF1',
  //             title: '#ECEFF1'
  //           }
  //         })
  //       })
  //
  //       // g.selectAll('*').remove()
  //       // g.append('rect')
  //       //   .attr('class', 'back')
  //       //   .attr('x', 0)
  //       //   .attr('y', 0)
  //       //   .attr('rx', 3)
  //       //   .attr('ry', 3)
  //       //   .attr('width', g.attr('width'))
  //       //   .attr('height', g.attr('height'))
  //       //   .attr('stroke', '#607D8B')
  //       //   .attr('fill', '#607D8B')
  //       //   .attr('stroke-width', 3.5)
  //       //   .attr('stroke-opacity', 1)
  //       // let fo = g.append('foreignObject')
  //       //   .attr('x', 0)
  //       //   .attr('y', 0)
  //       //   .attr('width', g.attr('width'))
  //       //   .attr('height', g.attr('height'))
  //       // let div = fo.append('xhtml:div')
  //       // div.append('textarea')
  //       //   .attr('class', 'comment')
  //       //   // .text('This is a test comment')
  //       //   .style('background-color', '#37474F')
  //       //   .style('border', 'none')
  //       //   .style('width', '98.5%')
  //       //   .style('height', Number(g.attr('height')) * 0.96 + 'px')
  //       //   .style('margin-top', '1px')
  //       //   .style('margin-left', '4px')
  //       //   .style('resize', 'none')
  //       //   .style('pointer-events', 'none')
  //       // console.log(g);
  //     }
  //     let generalTabLayout = function (g) {
  //       g.selectAll('*').remove()
  //       g.append('rect')
  //         .attr('class', 'back')
  //         .attr('x', 0)
  //         .attr('y', 0)
  //         .attr('rx', 4)
  //         .attr('ry', 4)
  //         .attr('width', g.attr('width'))
  //         .attr('height', g.attr('height'))
  //         .attr('fill', '#B0BEC5')
  //         .attr('stroke-width', 3.5)
  //         .attr('stroke-opacity', 1)
  //         .attr('stroke', '#B0BEC5')
  //       g.append('text')
  //         .attr('class', 'tabName')
  //         .text(function (data) {
  //           return 'General'
  //         })
  //         .attr('x', Number(g.attr('width')) / 2)
  //         .attr('y', Number(g.attr('height')) / 2)
  //         .style('font-weight', 'bold')
  //         .attr('text-anchor', 'middle')
  //         .style('font-size', 18)
  //         .attr('dy', 9)
  //         .style('pointer-events', 'none')
  //         .attr('fill', '#37474F')
  //         .attr('stroke', 'none')
  //     }
  //     let generalCustomPanel = new CustomPanel()
  //     generalCustomPanel.setTabProperties('dragable', optIn.dragable)
  //     generalCustomPanel.setTabProperties('closable', optIn.closable)
  //     generalCustomPanel.bindData({'tabName': 'INFORMATIONS'})
  //     generalCustomPanel.setRepaintPanel(generalCommentLayout)
  //     generalCustomPanel.setRepaintTab(generalTabLayout)
  //     panelManager.addNewPanel(generalCustomPanel)
  //     currentPanels.push(generalCustomPanel)
  //
  //     // let tlsCommentLayout = function (g) {
  //     //   g.selectAll('*').remove()
  //     //   g.append('rect')
  //     //     .attr('class', 'back')
  //     //     .attr('x', 0)
  //     //     .attr('y', 0)
  //     //     .attr('rx', 3)
  //     //     .attr('ry', 3)
  //     //     .attr('width', g.attr('width'))
  //     //     .attr('height', g.attr('height'))
  //     //     .attr('stroke', '#546E7A')
  //     //     .attr('fill', '#546E7A')
  //     //     .attr('stroke-width', 3.5)
  //     //     .attr('stroke-opacity', 1)
  //     //   let fo = g.append('foreignObject')
  //     //     .attr('x', 0)
  //     //     .attr('y', 0)
  //     //     .attr('width', g.attr('width'))
  //     //     .attr('height', g.attr('height'))
  //     //   let div = fo.append('xhtml:div')
  //     //   div.append('textarea')
  //     //     .attr('class', 'comment')
  //     //     // .text('This is a test comment')
  //     //     .style('background-color', '#37474F')
  //     //     .style('border', 'none')
  //     //     .style('width', '98.5%')
  //     //     .style('height', Number(g.attr('height')) * 0.96 + 'px')
  //     //     .style('margin-top', '1px')
  //     //     .style('margin-left', '4px')
  //     //     .style('resize', 'none')
  //     //     .style('pointer-events', 'none')
  //     // }
  //     // let tlsTabLayout = function (g) {
  //     //   g.selectAll('*').remove()
  //     //   g.append('rect')
  //     //     .attr('class', 'back')
  //     //     .attr('x', 0)
  //     //     .attr('y', 0)
  //     //     .attr('rx', 4)
  //     //     .attr('ry', 4)
  //     //     .attr('width', g.attr('width'))
  //     //     .attr('height', g.attr('height'))
  //     //     .attr('fill', '#546E7A')
  //     //     .attr('stroke-width', 3.5)
  //     //     .attr('stroke-opacity', 1)
  //     //     .attr('stroke', '#546E7A')
  //     //   // if (com.tab.closable) {
  //     //   //   com.tab.g.append('rect')
  //     //   //     .attr('class', 'close')
  //     //   //     .attr('x', com.tab.dimension.width - 16)
  //     //   //     .attr('y', (com.tab.dimension.height / 2) - 8)
  //     //   //     .attr('rx', 4)
  //     //   //     .attr('ry', 4)
  //     //   //     .attr('width', 13)
  //     //   //     .attr('height', 13)
  //     //   //     .attr('fill', '#aaaaaa')
  //     //   // }
  //     //   g.append('text')
  //     //     .attr('class', 'tabName')
  //     //     .text(function (data) {
  //     //       return 'COMMENTS'
  //     //     })
  //     //     .attr('x', Number(g.attr('width')) / 2)
  //     //     .attr('y', Number(g.attr('height')) / 2)
  //     //     .style('font-weight', 'bold')
  //     //     .attr('text-anchor', 'middle')
  //     //     .style('font-size', 18)
  //     //     .attr('dy', 9)
  //     //     .style('pointer-events', 'none')
  //     //     .attr('fill', '#37474F')
  //     //     .attr('stroke', 'none')
  //     // }
  //     // let tlsCustomPanel = new CustomPanel()
  //     // tlsCustomPanel.setTabProperties('dragable', optIn.dragable)
  //     // tlsCustomPanel.setTabProperties('closable', optIn.closable)
  //     // tlsCustomPanel.bindData({'tabName': 'INFORMATIONS'})
  //     // tlsCustomPanel.setRepaintPanel(tlsCommentLayout)
  //     // tlsCustomPanel.setRepaintTab(tlsTabLayout)
  //     // panelManager.addNewPanel(tlsCustomPanel)
  //     // currentPanels.push(tlsCustomPanel)
  //   }
  //   this.createBlockPanels = createBlockPanels
  //
  //   function createEventPanels (data) {
  //
  //   }
  //   this.createEventPanels = createEventPanels
  //
  //   function changeFocusElement (type, data) {
  //     for (let i = 0; i < currentPanels.length; i++) {
  //       panelManager.removePanel(currentPanels[i])
  //     }
  //     currentPanels = []
  //
  //     if (type === 'block') {
  //       createBlockPanels(data)
  //     } else if (type === 'event') {
  //       createEventPanels(data)
  //     }
  //     // commentPanel.callFunInfo(transitionDisabledToEnabled)
  //     // transitionDisabledToEnabled(commentPanel.getTabProperties('g'), commentPanel.getPanelGroup())
  //     // commentPanel.setRepaintPanel(drawCommentEnabled)
  //     // commentPanel.setRepaintTab(drawTabEnabled)
  //   }
  //   this.changeFocusElement = changeFocusElement
  //   function drawCommentDisabled (g) {
  //     g.selectAll('*').remove()
  //     g.append('rect')
  //       .attr('class', 'back')
  //       .attr('x', 0)
  //       .attr('y', 0)
  //       .attr('rx', 3)
  //       .attr('ry', 3)
  //       .attr('width', g.attr('width'))
  //       .attr('height', g.attr('height'))
  //       .attr('stroke', '#546E7A')
  //       .attr('fill', '#546E7A')
  //       .attr('stroke-width', 3.5)
  //       .attr('stroke-opacity', 1)
  //     let fo = g.append('foreignObject')
  //       .attr('x', 0)
  //       .attr('y', 0)
  //       .attr('width', g.attr('width'))
  //       .attr('height', g.attr('height'))
  //     let div = fo.append('xhtml:div')
  //     div.append('textarea')
  //       .attr('class', 'comment')
  //       // .text('This is a test comment')
  //       .style('background-color', '#37474F')
  //       .style('border', 'none')
  //       .style('width', '98.5%')
  //       .style('height', Number(g.attr('height')) * 0.96 + 'px')
  //       .style('margin-top', '1px')
  //       .style('margin-left', '4px')
  //       .style('resize', 'none')
  //       .style('pointer-events', 'none')
  //   }
  //   function drawTabDisabled (g) {
  //     g.selectAll('*').remove()
  //     g.append('rect')
  //       .attr('class', 'back')
  //       .attr('x', 0)
  //       .attr('y', 0)
  //       .attr('rx', 4)
  //       .attr('ry', 4)
  //       .attr('width', g.attr('width'))
  //       .attr('height', g.attr('height'))
  //       .attr('fill', '#546E7A')
  //       .attr('stroke-width', 3.5)
  //       .attr('stroke-opacity', 1)
  //       .attr('stroke', '#546E7A')
  //     // if (com.tab.closable) {
  //     //   com.tab.g.append('rect')
  //     //     .attr('class', 'close')
  //     //     .attr('x', com.tab.dimension.width - 16)
  //     //     .attr('y', (com.tab.dimension.height / 2) - 8)
  //     //     .attr('rx', 4)
  //     //     .attr('ry', 4)
  //     //     .attr('width', 13)
  //     //     .attr('height', 13)
  //     //     .attr('fill', '#aaaaaa')
  //     // }
  //     g.append('text')
  //       .attr('class', 'tabName')
  //       .text(function (data) {
  //         return 'COMMENTS'
  //       })
  //       .attr('x', Number(g.attr('width')) / 2)
  //       .attr('y', Number(g.attr('height')) / 2)
  //       .style('font-weight', 'bold')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 18)
  //       .attr('dy', 9)
  //       .style('pointer-events', 'none')
  //       .attr('fill', '#37474F')
  //       .attr('stroke', 'none')
  //   }
  //   // function drawCommentEnabled (g) {
  //   //   g.append('rect')
  //   //     .attr('class', 'back')
  //   //     .attr('x', 0)
  //   //     .attr('y', 0)
  //   //     .attr('rx', 3)
  //   //     .attr('ry', 3)
  //   //     .attr('width', g.attr('width'))
  //   //     .attr('height', g.attr('height'))
  //   //     .attr('fill', '#efefef')
  //   //     .attr('stroke-width', 1.5)
  //   //     .attr('stroke-opacity', 1)
  //   //     .attr('stroke', 'black')
  //   //   let fo = g.append('foreignObject')
  //   //     .attr('x', 0)
  //   //     .attr('y', 0)
  //   //     .attr('width', g.attr('width'))
  //   //     .attr('height', g.attr('height'))
  //   //   let div = fo.append('xhtml:div')
  //   //   div.append('textarea')
  //   //     .attr('class', 'comment')
  //   //     // .text('This is a test comment')
  //   //     .style('background-color', '#ffffff')
  //   //     .style('border', 'none')
  //   //     .style('width', '98%')
  //   //     .style('height', Number(g.attr('height')) * 0.8 + 'px')
  //   //     .style('margin-top', '1px')
  //   //     .style('margin-left', '1px')
  //   //     .style('resize', 'none')
  //   // }
  //   // function transitionDisabledToEnabled (gTab, gPanel) {
  //   //   gTab.select('rect.back')
  //   //     .transition()
  //   //     .duration(400)
  //   //     .ease(d3.easeLinear)
  //   //     .attr('fill', '#455A64')
  //   //     .attr('stroke', '#455A64')
  //   //   gTab.select('text.tabName')
  //   //     .transition()
  //   //     .duration(400)
  //   //     .ease(d3.easeLinear)
  //   //     .attr('fill', '#CFD8DC')
  //   //
  //   //   gPanel.select('rect.back')
  //   //     .transition()
  //   //     .duration(400)
  //   //     .ease(d3.easeLinear)
  //   //     .attr('stroke', '#455A64')
  //   //     .attr('fill', '#455A64')
  //   //   gPanel.select('textarea.comment')
  //   //     .transition()
  //   //     .duration(400)
  //   //     .ease(d3.easeLinear)
  //   //     .style('background-color', '#CFD8DC')
  //   //     .style('pointer-events', 'auto')
  //   //     // .on('end', function () {
  //   //     //   commentPanel.setDrawInfo(drawCommentEnabled)
  //   //     // })
  //   // }
  //   // function createCommentPanel () {
  //   //   return
  //   //   let panelManager = new PanelManager()
  //   //   let optIn = {
  //   //     transX: 475,
  //   //     transY: 40,
  //   //     width: (-40 + blockBoxData.w * 0.35) / 1,
  //   //     height: (-20 + blockBoxData.h * 0.83) / 1,
  //   //     g: gMiddleBox.append('g'),
  //   //     manager: panelManager,
  //   //     dragable: {
  //   //       general: false,
  //   //       tab: false
  //   //     },
  //   //     closable: false
  //   //   }
  //   //   panelManager.init(optIn)
  //   //
  //   //   commentPanel = new CustomPanel()
  //   //   commentPanel.setTabProperties('dragable', optIn.dragable)
  //   //   commentPanel.setTabProperties('closable', optIn.closable)
  //   //   commentPanel.bindData({'tabName': 'COMMENTS'})
  //   //
  //   //   commentPanel.setRepaintPanel(drawCommentDisabled)
  //   //   commentPanel.setRepaintTab(drawTabDisabled)
  //   //
  //   //   panelManager.addNewPanel(commentPanel)
  //   // }
  //
  //   function initData (dataIn) {
  //     gBlockBox = svg.g.append('g')
  //
  //     let x0, y0, w0, h0, marg
  //     w0 = lenD.w[0] * 0.96
  //     h0 = lenD.h[0] * 0.5 // h0 *= 2.5;
  //     x0 = (lenD.w[0] * 0.02)
  //     y0 = lenD.h[0] * 0.39
  //     marg = w0 * 0.01
  //     blockBoxData = {
  //       x: x0,
  //       y: y0,
  //       w: w0,
  //       h: h0,
  //       marg: marg
  //     }
  //     gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
  //     gBackPattern = gBlockBox.append('g').attr('transform', 'translate(' + 0 + ',' + 40 + ')')
  //     gMiddleBox = gBlockBox.append('g').attr('transform', 'translate(' + blockBoxData.w * 0.1 + ',' + 0 + ')')
  //
  //     gBackPattern.append('rect')
  //       .attr('x', -3)
  //       .attr('y', 0)
  //       .attr('rx', 2)
  //       .attr('ry', 2)
  //       .attr('width', 41)
  //       .attr('height', 30)
  //       .attr('stroke', '#546E7A')
  //       .attr('fill', '#546E7A')
  //       .attr('stroke-width', 3.5)
  //       .attr('stroke-opacity', 1)
  //     gBackPattern.append('rect')
  //       .attr('x', 5)
  //       .attr('y', 3)
  //       .attr('rx', 2)
  //       .attr('ry', 2)
  //       .attr('width', 24)
  //       .attr('height', 24)
  //       .attr('stroke', '#CFD8DC')
  //       .attr('fill', '#CFD8DC')
  //       .attr('stroke-width', 0.5)
  //       .attr('stroke-opacity', 1)
  //     gBackPattern.append('svg:image')
  //       .attr('class', 'icon')
  //       .attr('xlink:href', '/static/commit.svg')
  //       .attr('width', 30)
  //       .attr('height', 30)
  //       .attr('x', 2)
  //       .attr('y', 0)
  //
  //     gBackPattern.append('rect')
  //       .attr('x', 47)
  //       .attr('y', 0)
  //       .attr('rx', 2)
  //       .attr('ry', 2)
  //       .attr('width', 68)
  //       .attr('height', 30)
  //       .attr('stroke', '#546E7A')
  //       .attr('fill', '#546E7A')
  //       .attr('stroke-width', 3.5)
  //       .attr('stroke-opacity', 1)
  //     gBackPattern.append('rect')
  //       .attr('x', 53)
  //       .attr('y', 3)
  //       .attr('rx', 2)
  //       .attr('ry', 2)
  //       .attr('width', 24)
  //       .attr('height', 24)
  //       .attr('stroke', '#000000')
  //       .attr('fill', '#CFD8DC')
  //       .attr('stroke-width', 3.5)
  //       .attr('stroke-opacity', 1)
  //     gBackPattern.append('svg:image')
  //       .attr('class', 'icon')
  //       .attr('xlink:href', '/static/plus.svg')
  //       .attr('width', 18)
  //       .attr('height', 18)
  //       .attr('x', 56)
  //       .attr('y', 6)
  //     gBackPattern.append('rect')
  //       .attr('x', 86)
  //       .attr('y', 3)
  //       .attr('rx', 2)
  //       .attr('ry', 2)
  //       .attr('width', 24)
  //       .attr('height', 24)
  //       .attr('stroke', '#000000')
  //       .attr('fill', '#CFD8DC')
  //       .attr('stroke-width', 3.5)
  //       .attr('stroke-opacity', 1)
  //     gBackPattern.append('svg:image')
  //       .attr('class', 'icon')
  //       .attr('xlink:href', '/static/option.svg')
  //       .attr('width', 28)
  //       .attr('height', 28)
  //       .attr('x', 84)
  //       .attr('y', 2)
  //
  //     createMiddlePanel()
  //     //createCommentPanel()
  //   }
  //   this.initData = initData
  //
  //   function updateData (dataIn) {
  //   }
  //   this.updateData = updateData
  // }
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
  let SvgTextEditor = function () {
    let reserved = {}

    function initinputHistory () {
      function initLocalHistory () {
        reserved.inputHistory.local.scroll.scrollBoxG = reserved.inputHistory.local.g.append('g')
        let historyBox = reserved.inputHistory.local.box
        reserved.inputHistory.local.scroll.scrollBoxG.append('rect')
          .attr('x', historyBox.x)
          .attr('y', historyBox.y)
          .attr('width', historyBox.w)
          .attr('height', historyBox.h)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        reserved.inputHistory.local.scroll.scrollBox = new ScrollBox()
        reserved.inputHistory.local.scroll.scrollBox.init({
          tag: 'inputHistoryScrollBox',
          gBox: reserved.inputHistory.local.scroll.scrollBoxG,
          boxData: {
            x: historyBox.x,
            y: historyBox.y,
            w: historyBox.w,
            h: historyBox.h,
            marg: 0
          },
          useRelativeCoords: true,
          locker: new Locker(),
          lockerV: [widgetId + 'updateData'],
          lockerZoom: {
            all: 'ScrollBox' + 'zoom',
            during: 'ScrollBox' + 'zoomDuring',
            end: 'ScrollBox' + 'zoomEnd'
          },
          runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
          canScroll: true,
          scrollVertical: true,
          scrollHorizontal: false,
          scrollHeight: 0.1 + historyBox.h,
          scrollWidth: 0,
          background: 'transparent',
          scrollRecH: {h: 2},
          scrollRecV: {w: 2}
        })
        reserved.inputHistory.local.scroll.scrollG = reserved.inputHistory.local.scroll.scrollBox.get('innerG')
      }
      function initGeneralHistory () {
        reserved.inputHistory.general.scroll.scrollBoxG = reserved.inputHistory.general.g.append('g')
        let historyBox = reserved.inputHistory.general.box
        reserved.inputHistory.general.scroll.scrollBoxG.append('rect')
          .attr('x', historyBox.x)
          .attr('y', historyBox.y)
          .attr('width', historyBox.w)
          .attr('height', historyBox.h)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        reserved.inputHistory.general.scroll.scrollBox = new ScrollBox()
        reserved.inputHistory.general.scroll.scrollBox.init({
          tag: 'inputHistoryScrollBox',
          gBox: reserved.inputHistory.general.scroll.scrollBoxG,
          boxData: {
            x: historyBox.x,
            y: historyBox.y,
            w: historyBox.w,
            h: historyBox.h,
            marg: 0
          },
          useRelativeCoords: true,
          locker: new Locker(),
          lockerV: [widgetId + 'updateData'],
          lockerZoom: {
            all: 'ScrollBox' + 'zoom',
            during: 'ScrollBox' + 'zoomDuring',
            end: 'ScrollBox' + 'zoomEnd'
          },
          runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
          canScroll: true,
          scrollVertical: true,
          scrollHorizontal: false,
          scrollHeight: 0.1 + historyBox.h,
          scrollWidth: 0,
          background: 'transparent',
          scrollRecH: {h: 2},
          scrollRecV: {w: 2}
        })
        reserved.inputHistory.general.scroll.scrollG = reserved.inputHistory.general.scroll.scrollBox.get('innerG')
      }

      reserved.inputHistory.main.g.attr('transform', 'translate(' + reserved.inputHistory.main.box.x + ',' + reserved.inputHistory.main.box.y + ')')
      reserved.inputHistory.main.g.append('text')
        .text('Operators operations :')
        .attr('x', 2)
        .attr('y', 0 - reserved.inputHistory.main.box.h * 0.03)
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '8px')
        .attr('text-anchor', 'start')
      reserved.inputHistory.main.g.append('line')
        .attr('x1', 2)
        .attr('y1', 0 - reserved.inputHistory.main.box.h * 0.02)
        .attr('x2', reserved.inputHistory.main.box.w * 0.9)
        .attr('y2', 0 - reserved.inputHistory.main.box.h * 0.02)
        .attr('stroke-width', 0.4)
        .attr('stroke', colorTheme.medium.stroke)

      reserved.inputHistory.general = {
        g: reserved.inputHistory.main.g.append('g'),
        box: {
          x: 0,
          y: reserved.inputHistory.main.box.h * 0.0,
          w: reserved.inputHistory.main.box.w * 1,
          h: reserved.inputHistory.main.box.h * 0.49
        },
        scroll: {}
      }
      reserved.inputHistory.local = {
        g: reserved.inputHistory.main.g.append('g'),
        box: {
          x: reserved.inputHistory.main.box.w * 0.3,
          y: reserved.inputHistory.main.box.h * 0.51,
          w: reserved.inputHistory.main.box.w * 0.7,
          h: reserved.inputHistory.main.box.h * 0.49
        },
        scroll: {}
      }
      initGeneralHistory()
      initLocalHistory()
    }
    function initOnlineOperator () {
      reserved.onlineOperator.main.g.attr('transform', 'translate(' + reserved.onlineOperator.main.box.x + ',' + reserved.onlineOperator.main.box.y + ')')
      reserved.onlineOperator.main.g.append('text')
        .text('Operators online :')
        .attr('x', 2)
        .attr('y', 0 - reserved.onlineOperator.main.box.h * 0.03)
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '8px')
        .attr('text-anchor', 'start')
      reserved.onlineOperator.main.g.append('line')
        .attr('x1', 2)
        .attr('y1', 0 - reserved.onlineOperator.main.box.h * 0.02)
        .attr('x2', reserved.onlineOperator.main.box.w * 0.9)
        .attr('y2', 0 - reserved.onlineOperator.main.box.h * 0.02)
        .attr('stroke-width', 0.4)
        .attr('stroke', colorTheme.medium.stroke)

      let op = reserved.onlineOperator.main.g.selectAll('g.operators')
        .data([{icon: 'A', name: 'Anna'}, {icon: 'B', name: 'Bob'}, {icon: 'C', name: 'Connor'}])
      let opEnter = op.enter()
        .append('g')
        .attr('class', 'operators')
        .attr('transform', function (d, i) {
          let tx = reserved.onlineOperator.main.box.w * 0.1
          let ty = 0 + reserved.onlineOperator.main.box.w * 0.25 * (i)
          return 'translate(' + tx + ',' + ty + ')'
        })
      opEnter.each(function (d) {
        d3.select(this).append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', reserved.onlineOperator.main.box.w * 0.2)
          .attr('height', reserved.onlineOperator.main.box.w * 0.2)
          .attr('stroke', '#000000')
          .attr('stroke-width', 0.2)
          .attr('fill', colorTheme.dark.background)
        d3.select(this).append('text')
          .text(d.icon)
          .attr('x', reserved.onlineOperator.main.box.w * 0.1)
          .attr('y', reserved.onlineOperator.main.box.w * 0.1)
          .attr('dy', 3)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')
        d3.select(this).append('text')
          .text(d.name)
          .attr('x', reserved.onlineOperator.main.box.w * 0.3)
          .attr('y', reserved.onlineOperator.main.box.w * 0.1)
          .attr('dy', 3)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'start')
      })
    }
    function initFocusedItemHeader () {
      reserved.focusedItemHeader.main.g.append('text')
        .text('No element on focus')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '14px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' +
          (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.5) +
          ',' +
          (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.6) + ')')
      reserved.focusedItemHeader.main.g.append('text')
        .text('X')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' +
          (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.15) +
          ',' +
          (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.9) + ')')
      reserved.focusedItemHeader.main.g.append('text')
        .text('X')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' +
          (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.85) +
          ',' +
          (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.9) + ')')
    }
    function initFocusedItemInfo () {
      function initFocusPreview () {
        reserved.focusedItemInfo.preview.g.append('rect')
          .attr('x', reserved.focusedItemInfo.preview.box.x)
          .attr('y', reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.0)
          .attr('width', reserved.focusedItemInfo.preview.box.h * 1)
          .attr('height', reserved.focusedItemInfo.preview.box.h * 1)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 1.5)
        reserved.focusedItemInfo.preview.g = reserved.focusedItemInfo.preview.g.append('g')
        reserved.focusedItemInfo.preview.g.append('text')
          .text('Preview')
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' +
            (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
            ',' +
            (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.25) + ')')
        reserved.focusedItemInfo.preview.g.append('text')
          .text('of')
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' +
            (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
            ',' +
            (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.4) + ')')
        reserved.focusedItemInfo.preview.g.append('text')
          .text('Block /')
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' +
            (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
            ',' +
            (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.55) + ')')
        reserved.focusedItemInfo.preview.g.append('text')
          .text('Telescope /')
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' +
            (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
            ',' +
            (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.7) + ')')
        reserved.focusedItemInfo.preview.g.append('text')
          .text('...')
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' +
            (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
            ',' +
            (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.85) + ')')
      }
      function initFocusFields () {
        reserved.focusedItemInfo.fields.scroll.scrollBoxG = reserved.focusedItemInfo.fields.g.append('g')
        let historyBox = reserved.focusedItemInfo.fields.box
        reserved.focusedItemInfo.fields.scroll.scrollBoxG.append('rect')
          .attr('x', historyBox.x)
          .attr('y', historyBox.y)
          .attr('width', historyBox.w)
          .attr('height', historyBox.h)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        reserved.focusedItemInfo.fields.scroll.scrollBox = new ScrollBox()
        reserved.focusedItemInfo.fields.scroll.scrollBox.init({
          tag: 'inputHistoryScrollBox',
          gBox: reserved.focusedItemInfo.fields.scroll.scrollBoxG,
          boxData: {
            x: historyBox.x,
            y: historyBox.y,
            w: historyBox.w,
            h: historyBox.h,
            marg: 0
          },
          useRelativeCoords: true,
          locker: new Locker(),
          lockerV: [widgetId + 'updateData'],
          lockerZoom: {
            all: 'ScrollBox' + 'zoom',
            during: 'ScrollBox' + 'zoomDuring',
            end: 'ScrollBox' + 'zoomEnd'
          },
          runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
          canScroll: true,
          scrollVertical: true,
          scrollHorizontal: false,
          scrollHeight: 0.1 + historyBox.h,
          scrollWidth: 0,
          background: 'transparent',
          scrollRecH: {h: 6},
          scrollRecV: {w: 6}
        })
        reserved.focusedItemInfo.info.scroll.scrollG = reserved.focusedItemInfo.fields.scroll.scrollBox.get('innerG')

        let dimField = {
          w: reserved.focusedItemInfo.fields.box.w,
          h: reserved.focusedItemInfo.fields.box.h * 0.1,
          margW: 0, // reserved.focusedItemInfo.focusFields.box.w * 0.04,
          margH: 0 // reserved.focusedItemInfo.focusFields.box.h * 0.04
        }
        let fields = reserved.focusedItemInfo.info.g.selectAll('g.fields')
          .data([{name: 'A'}, {name: 'B'}, {name: 'C'}, {name: 'D'}, {name: 'E'}, {name: 'F'}, {name: 'G'}, {name: 'H'}])
        let fieldsEnter = fields.enter()
          .append('g')
          .attr('class', 'fields')
          .attr('transform', function (d, i) {
            let tx = reserved.focusedItemInfo.info.box.x + dimField.margW * ((i % 4) + 1) + (dimField.w * (i % 4))
            let ty = reserved.focusedItemInfo.info.box.y + dimField.margH * (parseInt(i / 4) + 1) + (dimField.h * parseInt(i / 4))
            return 'translate(' + tx + ',' + ty + ')'
          })
        fieldsEnter.each(function (d) {
          d3.select(this).append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', dimField.w)
            .attr('height', dimField.h)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.2)
            .attr('fill', colorTheme.dark.background)
          // d3.select(this).append('text')
          //   .text(d.name)
          //   .attr('x', 0)
          //   .attr('y', 2)
          //   .style('fill', colorTheme.medium.text)
          //   .style('font-weight', '')
          //   .style('font-size', '7px')
          //   .attr('text-anchor', 'middle')
        })
      }
      function initFocusInfo () {
        reserved.focusedItemInfo.info.scroll.scrollBoxG = reserved.focusedItemInfo.info.g.append('g')
        reserved.focusedItemInfo.info.scroll.scrollBoxG.append('rect')
          .attr('x', reserved.focusedItemInfo.info.box.x)
          .attr('y', reserved.focusedItemInfo.info.box.y)
          .attr('width', reserved.focusedItemInfo.info.box.w)
          .attr('height', reserved.focusedItemInfo.info.box.h)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        let historyBox = reserved.focusedItemInfo.info.box
        reserved.focusedItemInfo.info.scroll.scrollBoxG.append('rect')
          .attr('x', historyBox.x)
          .attr('y', historyBox.y)
          .attr('width', historyBox.w)
          .attr('height', historyBox.h)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        reserved.focusedItemInfo.info.scroll.scrollBox = new ScrollBox()
        reserved.focusedItemInfo.info.scroll.scrollBox.init({
          tag: 'inputHistoryScrollBox',
          gBox: reserved.focusedItemInfo.info.scroll.scrollBoxG,
          boxData: {
            x: historyBox.x,
            y: historyBox.y,
            w: historyBox.w,
            h: historyBox.h,
            marg: 0
          },
          useRelativeCoords: true,
          locker: new Locker(),
          lockerV: [widgetId + 'updateData'],
          lockerZoom: {
            all: 'ScrollBox' + 'zoom',
            during: 'ScrollBox' + 'zoomDuring',
            end: 'ScrollBox' + 'zoomEnd'
          },
          runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
          canScroll: true,
          scrollVertical: true,
          scrollHorizontal: false,
          scrollHeight: 0.1 + historyBox.h,
          scrollWidth: 0,
          background: 'transparent',
          scrollRecH: {h: 6},
          scrollRecV: {w: 6}
        })
        reserved.focusedItemInfo.info.scroll.scrollG = reserved.focusedItemInfo.info.scroll.scrollBox.get('innerG')
      }
      reserved.focusedItemInfo.main.g.attr('transform', 'translate(' + reserved.focusedItemInfo.main.box.x + ',' + reserved.focusedItemInfo.main.box.y + ')')
      reserved.focusedItemInfo.preview = {
        g: reserved.focusedItemInfo.main.g.append('g'),
        box: {
          x: 0,
          y: 0,
          w: reserved.focusedItemInfo.main.box.h * 0.325,
          h: reserved.focusedItemInfo.main.box.h * 0.325
        }
      }
      reserved.focusedItemInfo.fields = {
        g: reserved.focusedItemInfo.main.g.append('g'),
        box: {
          x: 0,
          y: 0 + reserved.focusedItemInfo.main.box.h * 0.35,
          w: reserved.focusedItemInfo.main.box.h * 0.325,
          h: reserved.focusedItemInfo.main.box.h * 0.65
        },
        scroll: {}
      }
      reserved.focusedItemInfo.info = {
        g: reserved.focusedItemInfo.main.g.append('g'),
        box: {
          x: 0 + reserved.focusedItemInfo.main.box.h * 0.35,
          y: 0,
          w: reserved.focusedItemInfo.main.box.w - (reserved.focusedItemInfo.main.box.h * 0.35),
          h: reserved.focusedItemInfo.main.box.h
        },
        scroll: {}
      }
      initFocusPreview()
      initFocusFields()
      initFocusInfo()
    }
    function initTextInput () {
      reserved.textInput.main.g.append('rect')
        .attr('x', reserved.textInput.main.box.x)
        .attr('y', reserved.textInput.main.box.y)
        .attr('width', reserved.textInput.main.box.w)
        .attr('height', reserved.textInput.main.box.h)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
    }
    function initData (dataIn) {
      reserved.adjustedBox = {
        x: 0,
        y: box.textEditor.marg,
        w: box.textEditor.w - 1 * box.textEditor.marg,
        h: box.textEditor.h - 2 * box.textEditor.marg,
        marg: box.textEditor.marg * 0.5
      }
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.textEditor.x + ',' + box.textEditor.y + ')')

      reserved.inputHistory = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: reserved.adjustedBox.x,
            y: reserved.adjustedBox.y + box.textEditor.h * 0.06,
            w: box.textEditor.w * 0.165,
            h: box.textEditor.h * 0.45,
            marg: box.telescopes.marg
          }
        }
      }
      reserved.onlineOperator = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: reserved.adjustedBox.x + box.textEditor.w * 0.825,
            y: reserved.adjustedBox.y + box.textEditor.h * 0.06,
            w: box.textEditor.w * 0.165,
            h: box.textEditor.h * 0.45,
            marg: box.telescopes.marg
          }
        }
      }
      reserved.focusedItemHeader = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: reserved.adjustedBox.x + box.textEditor.w * 0.175,
            y: reserved.adjustedBox.y + box.textEditor.h * 0.0,
            w: box.textEditor.w * 0.65,
            h: box.textEditor.h * 0.06,
            marg: box.telescopes.marg * 0.5
          }
        }
      }
      reserved.focusedItemInfo = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: reserved.adjustedBox.x + box.textEditor.w * 0.15,
            y: reserved.adjustedBox.y + box.textEditor.h * 0.53,
            w: box.textEditor.w * 0.7,
            h: box.textEditor.h * 0.4,
            marg: box.telescopes.marg * 0.5
          }
        }
      }
      reserved.textInput = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: reserved.adjustedBox.x + box.textEditor.w * 0.175,
            y: reserved.adjustedBox.y + box.textEditor.h * 0.06,
            w: box.textEditor.w * 0.65,
            h: box.textEditor.h * 0.45,
            marg: box.telescopes.marg * 0.5
          }
        }
      }

      initinputHistory()
      initOnlineOperator()
      initFocusedItemHeader()
      initFocusedItemInfo()
      initTextInput()
    }
    this.initData = initData

    function updateData (dataIn) {}
    this.updateData = updateData
  }
  let SvgBottomInfo = function () {
    let gBlockBox
    let clockEvents

    function initData (dataIn) {
      gBlockBox = svg.g.append('g')

      clockEvents = new ClockEvents()
      clockEvents.init({
        g: gBlockBox,
        box: box.clock,
        colorTheme: colorTheme.medium
      })
      clockEvents.setHour(new Date(com.dataIn.data.timeOfNight.date_now))
      clockEvents.setSendFunction(function (date) {
        blockQueueServer.addExtraBar(date)
        eventQueue.addExtraBar(date)
      })
      clockEvents.addEvent(com.dataIn.data.external_clockEvents[0])

      // let startEvent = new Date(com.dataIn.data.timeOfNight.now).getTime() + ((Math.random() * 3) + 2) * 60000
      // let endEvent = new Date(startEvent).getTime() + 10000
      // clockEvents.addEvent({id: 'E' + Math.floor(Math.random() * 1000000), name: 'moonrise', icon: null, startTime: startEvent, endTime: endEvent})
    }
    this.initData = initData

    function updateData (dataIn) {
      clockEvents.setHour(new Date(com.dataIn.data.timeOfNight.date_now))
      clockEvents.addEvent(com.dataIn.data.external_clockEvents[0])
      // let rnd = Math.random()
      // if (rnd < 0.8) {
      //   let startEvent = new Date(com.dataIn.data.timeOfNight.now).getTime() + ((Math.random() * 3) + 0.4) * 60000
      //   let endEvent = new Date(startEvent).getTime() + 10000
      //   clockEvents.addEvent({id: Math.floor(Math.random() * 100000), name: 'moonrise', icon: null, startTime: startEvent, endTime: endEvent})
      // }
    }
    this.updateData = updateData
  }

  let svgBlocksQueueServer = new SvgBlocksQueueServer()
  let svgEvents = new SvgEvents()
  let svgTelescopes = new SvgTelescopes()
  let svgTextEditor = new SvgTextEditor()
  // let svgTels = new SvgTels()
  // let svgFilterBlocks = new SvgFilterBlocks()
  // let svgFilterTels = new SvgFilterTels()
  // let svgMiddleInfo = new SvgMiddleInfo()
  let svgBottomInfo = new SvgBottomInfo()
}
