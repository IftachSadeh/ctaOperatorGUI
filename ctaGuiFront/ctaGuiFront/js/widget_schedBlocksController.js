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
var mainScriptTag = 'schedBlocksController'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global hasVar */
/* global disableScrollSVG */
/* global RunLoop */
/* global BlockQueueModif */
/* global BlockQueueCreator */
/* global ClockEvents */
/* global GridBagLayout */
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

window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueModif.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueCreator.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_panelManager.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_gridBagLayout.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_clockEvents.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollTable.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_formManager.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 12
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
  //     "methodName":"schedBlocksControllerAskTelData",
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
let mainSchedBlocksController = function (optIn) {
  // let myUniqueId = unique()
  let widgetType = optIn.widgetType
  let tagBlockQueue = 'blockQueue'
  let tagArrZoomerPlotsSvg = optIn.baseName

  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  let com = {}
  let svg = {}

  let lenD = {}

  let blockQueue = new BlockQueue()
  let blockQueueCreator = new BlockQueueCreator()

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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
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
      // .classed("svgInGridStack_inner", true)
      .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
      // .call(com.svgZoom)
      .on('dblclick.zoom', null)

    if (disableScrollSVG) {
      svg.svg.on('wheel', function () {
        d3.event.preventDefault()
      })
    }

    com.svgZoomNode = svg.svg.nodes()[0]

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
      .attr('fill', '#37474F')
    // svg.g.append('rect')
    //   .attr('x', 0)
    //   .attr('y', 0)
    //   .attr('width', lenD.w[0])
    //   .attr('height', lenD.h[0] * 0.3)
    //   .style('fill', '#455A64')

    createPullPanel()
    createPushPanel()
    com.dataIn = dataIn

    svgBlocksQueue.initData(dataIn.data)
    svgCommitCopyStrip.initData(dataIn.data)
    svgBlocksQueueCreator.initData(dataIn.data)
    // svgMiddleInfo.initData(dataIn.data)

    svgSchedulingBlocksOverview.initData({
      tag: 'schedulingBlocksOverview',
      g: svg.g.append('g'),
      box: {x: (lenD.w[0] * 0.02), y: lenD.h[0] * 0.59, w: lenD.w[0] * 0.96, h: lenD.h[0] * 0.1},
      shrinked: {
        g: undefined,
        box: {x: 0, y: 0, w: 1, h: 1},
        child: {}
      },
      data: {
        lastRawData: dataIn.data.blocks,
        formatedData: undefined,
        currentTime: {date: new Date(dataIn.data.timeOfNight.date_now), time: Number(dataIn.data.timeOfNight.now)},
        startTime: {date: new Date(dataIn.data.timeOfNight.date_start), time: Number(dataIn.data.timeOfNight.start)},
        endTime: {date: new Date(dataIn.data.timeOfNight.date_end), time: Number(dataIn.data.timeOfNight.end)}
      },
      debug: {
        enabled: false
      }
    })
    svgSchedulingBlock.initData({
      tag: 'schedulingBlocksOverview',
      g: svg.g.append('g'),
      box: {x: lenD.w[0] * 0.03, y: lenD.h[0] * 0.66, w: lenD.w[0] * 0.45, h: lenD.h[0] * 0.3},
      shrinked: {
        g: undefined,
        box: {x: 0, y: 0, w: 0.2, h: 1},
        child: {}
      },
      extended: {
        g: undefined,
        box: {x: 0, y: 0, w: 1, h: 1},
        child: {}
      },
      data: {
        lastRawData: dataIn.data.blocks,
        formatedData: undefined
      },
      debug: {
        enabled: false
      }
    })
    svgBlocks.initData(dataIn.data)
    svgMiddleInfo.initData({
      tag: 'scheduleModification',
      g: svg.g.append('g'),
      box: {x: lenD.w[0] * 0.52, y: lenD.h[0] * 0.66, w: lenD.w[0] * 0.45, h: lenD.h[0] * 0.3},
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
        lastRawData: dataIn.data.blocks,
        formatedData: undefined
      },
      debug: {
        enabled: false
      }
    })
  }
  this.initData = initData

  function createPullPanel () {
    let x0, y0, w0, h0, marg
    w0 = lenD.w[0] * 0.16
    h0 = lenD.h[0] * 0.6 // h0 *= 2.5;
    x0 = 0
    y0 = 0
    marg = w0 * 0.01
    let box = {
      x: x0,
      y: y0,
      w: w0,
      h: h0,
      marg: marg
    }
    let gBlockBox = svg.g.append('g')
      .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
    // gBlockBox.append('rect')
    //   .attr('x', box.w * 0.95)
    //   .attr('y', box.h * 0.04)
    //   .attr('width', box.w * 0.04)
    //   .attr('height', box.h * 0.3)
    //   .style('fill', '#CFD8DC')

    let path = 'M ' + box.w * 1 + ' ' + box.h * 0.2 + ' ' +
    'L ' + box.w * 0.8 + ' ' + box.h * 0.2 + ' ' +
    'L ' + box.w * 0.8 + ' ' + box.h * 0.8 + ' ' +
    'L ' + box.w * 1 + ' ' + box.h * 0.8 + ' '
    // 'L ' + box.w + ' ' + box.h + ' '
    gBlockBox.append('path')
      .attr('stroke', '#546E7A')
      .attr('fill', 'none')
      .attr('stroke-width', 12)
      .attr('d', path)

    gBlockBox.append('rect')
      .attr('width', 32)
      .attr('height', 32)
      .attr('x', box.w * 0.26 + 4)
      .attr('y', box.h * 0.35 + 4)
      .attr('fill', '#CFD8DC')
    gBlockBox.append('svg:image')
      .attr('class', 'icon')
      .attr('xlink:href', '/static/commit.svg')
      .attr('width', 40)
      .attr('height', 40)
      .attr('x', box.w * 0.26)
      .attr('y', box.h * 0.35)

    gBlockBox.append('text')
      .text('Duplicate')
      .attr('x', box.w * 0.38)
      .attr('y', box.h * 0.28)
      .style('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .style('font-size', 16)
      .attr('dy', 9)
      .style('pointer-events', 'none')
      .attr('fill', '#CFD8DC')
      .attr('stroke', 'none')
    gBlockBox.append('text')
      .text('Schedule')
      .attr('x', box.w * 0.38)
      .attr('y', box.h * 0.31)
      .style('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .style('font-size', 16)
      .attr('dy', 9)
      .style('pointer-events', 'none')
      .attr('fill', '#CFD8DC')
      .attr('stroke', 'none')

    // gBlockBox.append('text')
    //   .text('OR')
    //   .attr('x', box.w * 0.38)
    //   .attr('y', box.h * 0.49)
    //   .style('font-weight', 'bold')
    //   .attr('text-anchor', 'middle')
    //   .style('font-size', 18)
    //   .attr('dy', 9)
    //   .style('pointer-events', 'none')
    //   .attr('fill', '#CFD8DC')
    //   .attr('stroke', 'none')

    // gBlockBox.append('text')
    //   .text('Load old')
    //   .attr('x', box.w * 0.38)
    //   .attr('y', box.h * 0.6)
    //   .style('font-weight', 'bold')
    //   .attr('text-anchor', 'middle')
    //   .style('font-size', 16)
    //   .attr('dy', 9)
    //   .style('pointer-events', 'none')
    //   .attr('fill', '#CFD8DC')
    //   .attr('stroke', 'none')
    // gBlockBox.append('text')
    //   .text('Schedule')
    //   .attr('x', box.w * 0.38)
    //   .attr('y', box.h * 0.63)
    //   .style('font-weight', 'bold')
    //   .attr('text-anchor', 'middle')
    //   .style('font-size', 16)
    //   .attr('dy', 9)
    //   .style('pointer-events', 'none')
    //   .attr('fill', '#CFD8DC')
    //   .attr('stroke', 'none')

    // gBlockBox.append('rect')
    //   .attr('width', 32)
    //   .attr('height', 32)
    //   .attr('x', box.w * 0.26 + 4)
    //   .attr('y', box.h * 0.67 + 4)
    //   .attr('fill', '#CFD8DC')
    // gBlockBox.append('svg:image')
    //   .attr('class', 'icon')
    //   .attr('xlink:href', '/static/commit.svg')
    //   .attr('width', 40)
    //   .attr('height', 40)
    //   .attr('x', box.w * 0.26)
    //   .attr('y', box.h * 0.67)
  }
  function createPushPanel () {
    let x0, y0, w0, h0, marg
    w0 = lenD.w[0] * 0.16
    h0 = lenD.h[0] * 0.6
    x0 = lenD.w[0] * 0.84
    y0 = 0
    marg = w0 * 0.01
    let box = {
      x: x0,
      y: y0,
      w: w0,
      h: h0,
      marg: marg
    }
    let gBlockBox = svg.g.append('g')
      .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
    // gBlockBox.append('rect')
    //   .attr('x', box.x)
    //   .attr('y', box.y)
    //   .attr('width', box.w)
    //   .attr('height', box.h)
    //   .style('fill', '#546E7A')
    let path = 'M ' + box.w * 0.02 + ' ' + box.h * 0.2 + ' ' +
    'L ' + box.w * 0.2 + ' ' + box.h * 0.2 + ' ' +
    'L ' + box.w * 0.2 + ' ' + box.h * 0.8 + ' ' +
    'L ' + box.w * 0.02 + ' ' + box.h * 0.8 + ' '
    // 'L ' + box.w + ' ' + box.h + ' '
    gBlockBox.append('path')
      .attr('stroke', '#546E7A')
      .attr('fill', 'none')
      .attr('stroke-width', 12)
      .attr('d', path)

    gBlockBox.append('rect')
      .attr('width', 32)
      .attr('height', 32)
      .attr('x', box.w * 0.5 + 4)
      .attr('y', box.h * 0.25 + 4)
      .attr('fill', '#CFD8DC')
    gBlockBox.append('svg:image')
      .attr('class', 'icon')
      .attr('xlink:href', '/static/commit.svg')
      .attr('width', 40)
      .attr('height', 40)
      .attr('x', box.w * 0.5)
      .attr('y', box.h * 0.25)
  }
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateData (dataIn) {
    com.dataIn = dataIn

    svgBlocksQueue.updateData(dataIn.data)
    svgBlocksQueueCreator.updateData(dataIn.data)
    // svgMiddleInfo.updateData(dataIn.data)
    svgSchedulingBlocksOverview.updateData(dataIn.data)
    // svgSchedulingBlock.updateData(dataIn.data)
    svgBlocks.updateData(dataIn.data)
  }
  this.updateData = updateData

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
  let SvgBlocksQueue = function () {
    // let axis = {}
    let gBlockBox // , gEvents
    let blockBoxData
    let tagBlockQueue = 'tagBlockQueue'
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.68
      h0 = lenD.h[0] * 0.18 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.16)
      y0 = (lenD.h[0] * 0.02)
      marg = w0 * 0.01
      blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
      gBlockBox.append('rect')
        .attr('x', -6)
        .attr('y', -10)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', blockBoxData.w + 12)
        .attr('height', blockBoxData.h + 12) // + 35)
        // .attr('stroke', '#546E7A')
        // .attr('stroke-width', 12)
        // .attr('stroke-dasharray', [blockBoxData.w + 10 + blockBoxData.h + 10 + 35 + 6, blockBoxData.w + 10 - 12, blockBoxData.h + 10 + 35 + 16])
        .style('fill', '#546E7A')

      blockQueue.init({
        tag: 'blockQueueDefaultTag',
        g: gBlockBox,
        box: blockBoxData,
        axis: {
          enabled: true,
          group: {
            g: undefined,
            box: {x: 0, y: blockBoxData.h, w: blockBoxData.w, h: 0, marg: blockBoxData.marg}
          },
          axis: undefined,
          scale: undefined,
          domain: [0, 1000],
          range: [0,0],
          showText: true,
          orientation: 'axisTop'
        },
        blocks: {
          enabled: true,
          group: {
            run: {
              g: undefined,
              box: {x: 0, y:blockBoxData.h * 0.45, w: blockBoxData.w, h:blockBoxData.h * 0.55, marg: blockBoxData.marg}
            },
            cancel: {
              g: undefined,
              box: {x: 0, y:0, w: blockBoxData.w, h:blockBoxData.h * 0.3, marg: blockBoxData.marg}
            }
          },
          events: {
            click: () => {},//svgMiddleInfo.createBlockPanels,
            mouseover: () => {},
            mouseout: () => {}
          }
        },
        filters: {
          enabled: false,
          group: {
            g: undefined,
            box: {x:0, y:blockBoxData.h * 0.15, w:lenD.w[0] * 0.12, h:blockBoxData.h * 0.7, marg: 0}
          },
          filters: []
        },
        timeBars: {
          enabled: true,
          group: {
            g: undefined,
            box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h, marg: blockBoxData.marg}
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
      let telIds = []
      $.each(dataIn.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })

      blockQueue.update({
        currentTime: {date: new Date(dataIn.timeOfNight.date_now), time: Number(dataIn.timeOfNight.now)},
        startTime: {date: new Date(dataIn.timeOfNight.date_start), time: Number(dataIn.timeOfNight.start)},
        endTime: {date: new Date(dataIn.timeOfNight.date_end), time: Number(dataIn.timeOfNight.end)},
        data: dataIn.blocks,
        telIds: telIds
      })
    }
    this.updateData = updateData
  }
  let SvgBlocksQueueCreator = function () {
    // let axis = {}
    let gBlockBox // , gEvents
    let blockBoxData
    let tagEventQueue = 'tagBlocksCopyQueue'
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.68
      h0 = lenD.h[0] * 0.18 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.16)
      y0 = lenD.h[0] * 0.37
      marg = w0 * 0.01
      blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
      gBlockBox.append('rect')
        .attr('x', -6)
        .attr('y', -10) // - 15)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', blockBoxData.w + 12)
        .attr('height', blockBoxData.h + 12) // + 45)
        // .attr('stroke', '#546E7A')
        // .attr('stroke-width', 12)
        // .attr('stroke-dasharray', [blockBoxData.w + 10 + blockBoxData.h + 10 + 35 + 6, blockBoxData.w + 10 - 12, blockBoxData.h + 10 + 35 + 16])
        .style('fill', '#546E7A')

      blockQueueCreator.init({
        tag: 'blockQueueDefaultTag',
        g: gBlockBox,
        box: blockBoxData,
        axis: {
          enabled: true,
          group: {
            g: undefined,
            box: {x: 0, y: blockBoxData.h, w: blockBoxData.w, h: 0, marg: blockBoxData.marg}
          },
          axis: undefined,
          scale: undefined,
          domain: [0, 1000],
          range: [0,0],
          showText: true,
          orientation: 'axisTop'
        },
        blocks: {
          enabled: true,
          group: {
            run: {
              g: undefined,
              box: {x: 0, y:blockBoxData.h * 0.45, w:blockBoxData.w, h:blockBoxData.h * 0.55, marg: blockBoxData.marg}
            },
            cancel: {
              g: undefined,
              box: {x: 0, y:0, w: blockBoxData.w, h:blockBoxData.h * 0.3, marg: blockBoxData.marg}
            }
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
            box: {x:0, y:blockBoxData.h * 0.15, w:lenD.w[0] * 0.12, h:blockBoxData.h * 0.7, marg: 0}
          },
          filters: []
        },
        timeBars: {
          enabled: true,
          group: {
            g: undefined,
            box: {x: 0, y:0, w: blockBoxData.w, h: blockBoxData.h, marg: blockBoxData.marg}
          }
        },
        data: {
          currentTime: {date: new Date(dataIn.timeOfNight.date_now), time: Number(dataIn.timeOfNight.now)},
          startTime: {date: new Date(dataIn.timeOfNight.date_start), time: Number(dataIn.timeOfNight.start)},
          endTime: {date: new Date(dataIn.timeOfNight.date_end), time: Number(dataIn.timeOfNight.end)},
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
      let telIds = []
      $.each(dataIn.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })

      blockQueueCreator.update({
        currentTime: {date: new Date(dataIn.timeOfNight.date_now), time: Number(dataIn.timeOfNight.now)},
        startTime: {date: new Date(dataIn.timeOfNight.date_start), time: Number(dataIn.timeOfNight.start)},
        endTime: {date: new Date(dataIn.timeOfNight.date_end), time: Number(dataIn.timeOfNight.end)},
        data: dataIn.blocks,
        telIds: telIds
      })
    }
    this.updateData = updateData
  }
  let SvgCommitCopyStrip = function () {
    let gBlockBox
    let blockBoxData

    function initData (dataIn) {
      let x0, y0, w0, h0, marg
      w0 = lenD.w[0]
      h0 = lenD.h[0] * 0.12 // h0 *= 2.5;
      x0 = 0
      y0 = lenD.h[0] * 0.23
      marg = w0 * 0.01
      blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + x0 + ',' + y0 + ')')

      // gBlockBox.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', blockBoxData.w * 0.16)
      //   .attr('height', blockBoxData.h)
      //   .style('fill', '#546E7A')
      gBlockBox.append('rect')
        .attr('x', blockBoxData.w * 0.16)
        .attr('y', 0)
        .attr('width', blockBoxData.w * 0.68)
        .attr('height', blockBoxData.h)
        .style('fill', 'none')
      // gBlockBox.append('rect')
      //   .attr('x', blockBoxData.w * 0.862)
      //   .attr('y', 0)
      //   .attr('width', blockBoxData.w * 0.138)
      //   .attr('height', blockBoxData.h)
      //   .style('fill', '#546E7A')
    }
    this.initData = initData
  }
  let SvgSchedulingBlocksOverview = function () {
    let com = {}
    let template = {
      tag: 'schedulingBlocksOverview',
      g: undefined,
      child: {},
      box: {x: 0, y: 0, w: 0, h: 0},
      shrinked: {
        box: {x: 0, y: 0, w: 0, h: 0}
      },
      data: {
        lastRawData: undefined,
        formatedData: undefined
      },
      debug: {
        enabled: false
      }
    }
    this.template = template

    function initShrink () {
      com.shrinked.box.x = com.box.w * com.shrinked.box.x
      com.shrinked.box.y = com.box.h * com.shrinked.box.y
      com.shrinked.box.w = com.box.w * com.shrinked.box.w
      com.shrinked.box.h = com.box.h * com.shrinked.box.h

      com.shrinked.g = com.g.append('g')
        .attr('transform', 'translate(' + com.shrinked.box.x + ',' + com.shrinked.box.y + ')')
    }
    function formatData () {
      let res = {}
      for (var key in com.data.lastRawData) {
        for (var i = 0; i < com.data.lastRawData[key].length; i++) {
          let ns = com.data.lastRawData[key][i].metaData.nSched
          if (ns in res) res[ns].push(com.data.lastRawData[key][i])
          else res[ns] = [com.data.lastRawData[key][i]]
        }
      }
      com.data.formatedData = []
      Object.keys(res).map(function (key, index) {
        com.data.formatedData.push({scheduleId: key, blocks: res[key]})
      })
    }
    function populateShrink () {
      let length = com.data.formatedData.length
      let dim = {h: (com.shrinked.box.h / 2) * 0.9, w: (com.shrinked.box.h / 2) * 0.9}
      length += 1
      let offset = (com.box.w - (length < 18
        ? (dim.w * 1.1) * length
        : (length % 2 === 0
          ? ((dim.w * 1.1) * (length - (length % 2)) - ((dim.w * 1.1) * (length - (length % 2))) / 2)
          : ((dim.w * 1.1) / 2 * length)))) * 0.5
      length -= 1

      com.shrinked.child.schedulingBlocks = com.shrinked.g
        .selectAll('g.schedulingBlocks')
        .data(com.data.formatedData)
      let enterSchedulingBlocks = com.shrinked.child.schedulingBlocks
        .enter()
        .append('g')
        .attr('class', 'schedulingBlocks')
        .attr('transform', function (d, i) {
          return 'translate(' +
          ((dim.w * 1.1) + offset + (length < 18
            ? (dim.w * 1.1) * i
            : (length % 2 === 0
              ? ((dim.w * 1.1) * (i - (i % 2)) - ((dim.w * 1.1) * (i - (i % 2))) / 2)
              : ((dim.w * 1.1) / 2 * i)))) +
          ',' +
          (length < 18 ? 0 : ((com.shrinked.box.h / 2) * (i % 2))) +
          ')'
        })
      enterSchedulingBlocks.append('rect')
        .attr('class', 'background')
        .attr('x', function (d, i) {
          return dim.w * 0.05
        })
        .attr('y', function (d, i) {
          return dim.h * 0.05
        })
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('width', function (d, i) {
          return dim.w * 0.9
        })
        .attr('height', function (d, i) {
          return dim.h * 0.9
        })
        .attr('fill', function (d, i) {
          return '#455A64'
        })
        .attr('stroke', '#78909C')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', [dim.w * 1, dim.h * 0.7])
        .on('mouseover', function () {
          if (com.data.focusOn === this) return
          d3.select(this)
            .attr('fill', '#546E7A')
            .attr('stroke', '#90A4AE')
            .transition()
            .duration(400)
            .attr('stroke-width', 2.2)
            .attr('stroke-dasharray', [dim.w * 2, 0])
        })
        .on('mouseout', function () {
          if (com.data.focusOn === this) return
          d3.select(this)
            .attr('fill', '#455A64')
            .attr('stroke', '#78909C')
            .transition()
            .duration(400)
            .attr('stroke-width', 1.8)
            .attr('stroke-dasharray', [dim.w * 1, dim.h * 0.7])
        })
        .on('click', function (d) {
          function loop () {
            d3.select(this).transition()
              .duration(4000)
              .ease(d3.easeLinear)
              .attr('stroke-dashoffset', function () {
                return Number(d3.select(this).attr('stroke-dashoffset')) + dim.w
              })
              .on('end', loop)
          }
          if (com.data.focusOn === this) {
            svgSchedulingBlock.unfocusOnSchedulingBlocks(d)
            com.data.focusOn = undefined
            d3.select(this)
              .attr('fill', '#455A64')
              .attr('stroke', '#78909C')
              .transition()
              .duration(400)
              .attr('stroke-width', 1.8)
              .attr('stroke-dasharray', [dim.w * 1, dim.h * 0.7])
          } else {
            if (com.data.focusOn !== undefined) {
              d3.select(com.data.focusOn)
                .attr('fill', '#455A64')
                .attr('stroke', '#78909C')
                .transition()
                .duration(400)
                .attr('stroke-width', 1.8)
                .attr('stroke-dasharray', [dim.w * 1, dim.h * 0.7])
            }
            svgSchedulingBlock.focusOnSchedulingBlocks(d)
            com.data.focusOn = this
            d3.select(this)
              .attr('stroke-dashoffset', 0)
              .transition()
              .duration(400)
              .attr('stroke-dasharray', [dim.w * 0.1, dim.w * 0.1])
              .on('end', loop)
          }
        })
      enterSchedulingBlocks.append('text')
        .attr('class', 'name')
        .text(function (d) {
          return 'SB ' + d.scheduleId
        })
        .attr('x', function (d, i) {
          return dim.w * 0.5
        })
        .attr('y', function (d, i) {
          return dim.h * 0.2
        })
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', 12)
        .attr('dy', 9)
        .style('pointer-events', 'none')
        .attr('fill', '#CFD8DC')
        .attr('stroke', 'none')
      enterSchedulingBlocks.each(function (d) {
        let group = d3.select(this)
        let dimBlocks = dim.h * 0.16
        let length = d.blocks.length
        let offset = ((dim.w /* - dimBlocks * 2 */) - (length < 4 ? (dimBlocks * 1.2 * length) : (length % 2 === 0 ? (dimBlocks * 0.6 * length) : (dimBlocks * 0.7 * length)))) * 0.5

        let subBlocks = group
          .selectAll('rect.subBlocks')
          .data(d.blocks)

        let enterSubBlocks = subBlocks
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
            return '#aaaaaa'//com.style.recCol(d.blocks)
          })
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2)
          .style('pointer-events', 'none')
      })

      com.shrinked.child.newButton = com.shrinked.g
        .append('g')
        .attr('class', 'newButton')
        .attr('transform', 'translate(' + offset + ',' + (length < 18 ? 0 : (com.shrinked.box.h * 0.25)) + ')')
      com.shrinked.child.newButton.append('rect')
        .attr('x', function (d, i) {
          return dim.w * 0.05
        })
        .attr('y', function (d, i) {
          return dim.h * 0.05
        })
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('width', function (d, i) {
          return dim.w * 0.9
        })
        .attr('height', function (d, i) {
          return dim.h * 0.9
        })
        .attr('fill', function (d, i) {
          return '#607D8B'
        })
        .attr('stroke', 'none')
        .attr('stroke-width', 1.8)
        .on('mouseover', function () {
          if (com.data.focusOn === this) return
          d3.select(this)
            .attr('fill', '#90A4AE')
            .attr('stroke', '#90A4AE')
            .transition()
            .duration(400)
        })
        .on('mouseout', function () {
          if (com.data.focusOn === this) return
          d3.select(this)
            .attr('fill', '#607D8B')
            .attr('stroke', 'none')
            .transition()
            .duration(400)
        })
        .on('click', function (d) {
          console.log('new')
        })
      com.shrinked.child.newButton.append('line')
        .attr('x1', dim.h * 0.5)
        .attr('x2', dim.h * 0.5)
        .attr('y1', dim.h * 0.3)
        .attr('y2', dim.h * 0.7)
        .attr('stroke', '#263238')
        .attr('stroke-width', 4)
        .style('pointer-events', 'none')
      com.shrinked.child.newButton.append('line')
        .attr('x1', dim.h * 0.3)
        .attr('x2', dim.h * 0.7)
        .attr('y1', dim.h * 0.5)
        .attr('y2', dim.h * 0.5)
        .attr('stroke', '#263238')
        .attr('stroke-width', 4)
        .style('pointer-events', 'none')
    }

    function initData (dataIn) {
      com = dataIn
      com.g.attr('transform', 'translate(' + com.box.x + ',' + com.box.y + ')')

      com.style = {}
      com.style.recCol = optIn.recCol
      if (!hasVar(com.style.recCol)) {
        com.style.recCol = function (optIn) {
          if (optIn.endTime < com.data.currentTime.time) return '#424242'
          let state = hasVar(optIn.state)
            ? optIn.state
            : optIn.exeState.state
          let canRun = hasVar(optIn.canRun)
            ? optIn.canRun
            : optIn.exeState.canRun

          if (state === 'wait') return '#e6e6e6'
          else if (state === 'run') {
            return d3.color(colsPurplesBlues[0]).brighter()
          } else if (state === 'cancel') {
            if (hasVar(canRun)) {
              if (!canRun) return d3.color(colsPurples[3]).brighter()
            }
            return d3.color(colsPurples[4])
          } else return d3.color(colPrime).brighter()
        }
      }

      initShrink()

      formatData()
      populateShrink()
    }
    this.initData = initData

    function shrink () {
      com.extended.child.back.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .style('opacity', 0)
      com.extended.child.shrinkButton.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .style('opacity', 0)
      com.extended.child.shrinkButtonHitBox
        .on('click', extend)
        .style('pointer-events', 'none')

      com.shrinked.child.shrinkButton.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .style('opacity', 1)
      com.shrinked.child.shrinkButtonHitBox
        .style('pointer-events', 'auto')
    }
    this.shrink = shrink

    function updateData (dataIn) {

    }
    this.updateData = updateData
  }
  let SvgSchedulingBlock = function () {
    let com = {}
    let template = {
      tag: 'schedulingBlocksOverview',
      g: undefined,
      child: {},
      box: {x: 0, y: 0, w: 0, h: 0},
      shrinked: {
        box: {x: 0, y: 0, w: 0, h: 0}
      },
      extended: {
        box: {x: 0, y: 0, w: 0, h: 0}
      },
      data: {
        lastRawData: undefined,
        formatedData: undefined
      },
      debug: {
        enabled: false
      }
    }
    this.template = template

    function initShrink () {
      com.shrinked.box.x = com.box.w * com.shrinked.box.x
      com.shrinked.box.y = com.box.h * com.shrinked.box.y
      com.shrinked.box.w = com.box.w * com.shrinked.box.w
      com.shrinked.box.h = com.box.h * com.shrinked.box.h
    }
    function initExtend () {
      com.extended.box.x = com.box.w * com.extended.box.x
      com.extended.box.y = com.box.h * com.extended.box.y
      com.extended.box.w = com.box.w * com.extended.box.w
      com.extended.box.h = com.box.h * com.extended.box.h
    }

    function initData (dataIn) {
      com = dataIn
      com.g.attr('transform', 'translate(' + com.box.x + ',' + com.box.y + ')')

      com.style = {}
      com.style.recCol = optIn.recCol
      if (!hasVar(com.style.recCol)) {
        com.style.recCol = function (optIn) {
          if (optIn.endTime < com.data.currentTime.time) return '#424242'
          let state = hasVar(optIn.state)
            ? optIn.state
            : optIn.exeState.state
          let canRun = hasVar(optIn.canRun)
            ? optIn.canRun
            : optIn.exeState.canRun

          if (state === 'wait') return '#e6e6e6'
          else if (state === 'run') {
            return d3.color(colsPurplesBlues[0]).brighter()
          } else if (state === 'cancel') {
            if (hasVar(canRun)) {
              if (!canRun) return d3.color(colsPurples[3]).brighter()
            }
            return d3.color(colsPurples[4])
          } else return d3.color(colPrime).brighter()
        }
      }

      initShrink()
      initExtend()
    }
    this.initData = initData

    function focusOnSchedulingBlocks (data) {
      // let length = com.data.formatedData.length
      // let lineLeftColumn = Math.floor((length + 1) / 2)
      let dim = {w: (com.extended.box.w) * 0.98, h: (com.shrinked.box.h) * 0.98}
      // let lineRigthColumn = Math.floor((Object.keys(com.data.formatedData).length) / 2)

      com.data.SBFocus = data
      com.shrinked.child.SBFocus = com.g
        .selectAll('g.schedulingBlocksFocus')
        .data([data])

      let enterSchedulingBlocks = com.shrinked.child.SBFocus
        .enter()
        .append('g')
        .attr('class', 'schedulingBlocksFocus')
        .attr('transform', function (d, i) {
          return 'translate(' +
          (com.extended.box.w / 2) +
          ',' +
          (com.extended.box.h / 2) +
          ')'
        })
      enterSchedulingBlocks.append('rect')
        .attr('class', 'background')
        .attr('x', function (d, i) {
          return 0
        })
        .attr('y', function (d, i) {
          return 0
        })
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('width', function (d, i) {
          return 0
        })
        .attr('height', function (d, i) {
          return 0
        })
        .attr('fill', function (d, i) {
          return '#455A64'
        })
        .attr('stroke', '#78909C')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', [dim.w * 1, dim.h * 0.7])
        // .on('mouseover', function () {
        //   d3.select(this)
        //     .attr('fill', '#546E7A')
        //     .attr('stroke', '#90A4AE')
        //     .transition()
        //     .duration(400)
        //     .attr('stroke-width', 2.2)
        //     .attr('stroke-dasharray', [dim.w * 2, 0])
        // })
        // .on('mouseout', function () {
        //   d3.select(this)
        //     .attr('fill', '#455A64')
        //     .attr('stroke', '#78909C')
        //     .transition()
        //     .duration(400)
        //     .attr('stroke-width', 1.8)
        //     .attr('stroke-dasharray', [dim.w * 1, dim.h * 0.7])
        // })
        // .on('click', function (d) {
        //   svgSchedulingBlock.focusOnSchedulingBlocks(d)
        // })
      enterSchedulingBlocks.append('text')
        .attr('class', 'name')
        .text(function (d) {
          return 'SB ' + d.scheduleId
        })
        .attr('x', function (d, i) {
          return 0
        })
        .attr('y', function (d, i) {
          return 0
        })
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', 0)
        .attr('dy', 9)
        .style('pointer-events', 'none')
        .attr('fill', '#CFD8DC')
        .attr('stroke', 'none')
      enterSchedulingBlocks.each(function (d) {
        let group = d3.select(this)
        let dimBlocks = dim.h * 0.1
        let length = d.blocks.length
        let offset = ((dim.h /* - dimBlocks * 2 */) - (length < 7 ? (dimBlocks * 1.4 * length) : (length % 2 === 0 ? (dimBlocks * 0.6 * length) : (dimBlocks * 0.7 * length)))) * 0.6

        let subBlocks = group
          .selectAll('rect.subBlocks')
          .data(d.blocks)

        let enterSubBlocks = subBlocks
          .enter()
          .append('rect')
          .attr('class', 'subBlocks')
          .attr('y', function (d, i) {
            return offset + (length < 7 ? (dimBlocks * i * 1.4) : (length % 2 === 0 ? (0.6 * dimBlocks * (i - (i % 2))) : (dimBlocks * i * 0.6)))
          })
          .attr('x', function (d, i) {
            return dim.w * 0.6
          })
          .attr('width', function (d, i) {
            return dimBlocks
          })
          .attr('height', function (d, i) {
            return dimBlocks
          })
          .attr('fill', function (d, i) {
            return '#aaaaaa'//com.style.recCol(d.blocks)
          })
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2)
          .style('pointer-events', 'none')
      })
      let mergeSchedulingBlocks = enterSchedulingBlocks.merge(com.shrinked.child.SBFocus)
      mergeSchedulingBlocks.transition()
        .duration(1000)
        .attr('transform', function (d, i) {
          return 'translate(' +
          (com.extended.box.w * 0.02) +
          ',' +
          (com.extended.box.h * 0.02) +
          ')'
        })
      mergeSchedulingBlocks.select('rect.background')
        .transition()
        .duration(1000)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('width', function (d, i) {
          return com.extended.box.w * 0.98
        })
        .attr('height', function (d, i) {
          return com.extended.box.h * 0.98
        })
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', [com.extended.box.w * 0.98 * 1, com.extended.box.h * 0.98 * 0.7])
      mergeSchedulingBlocks.select('text.name')
        .transition()
        .duration(1000)
        .attr('x', function (d, i) {
          return com.extended.box.w * 0.5
        })
        .attr('y', function (d, i) {
          return com.extended.box.h * 0.06
        })
        .style('font-size', 16)
    }
    this.focusOnSchedulingBlocks = focusOnSchedulingBlocks

    function unfocusOnSchedulingBlocks () {

    }
    this.unfocusOnSchedulingBlocks = unfocusOnSchedulingBlocks

    function focusOnBlock () {

    }
    this.focusOnBlock = focusOnBlock

    function updateData (dataIn) {

    }
    this.updateData = updateData
  }
  let SvgBlocks = function () {
    function initData (dataIn) {

    }
    this.initData = initData
    function updateData (dataIn) {

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
        formatedData: undefined
      },
      debug: {
        enabled: false
      }
    }
    let com = template

    function createDefaultPanel () {
      com.panelManager = new PanelManager()
      com.panelManager.init({
        tag: 'tagDefaultPanelManager',
        g: com.g,
        box: com.box,
        tab: {
          enabled: true,
          g: com.g.append('g'),
          box: com.tab.box,
          dimension: {w: 0, h: 0},
          dragable: false,
          closable: false
        },
        content: {
          enabled: true,
          g: com.g.append('g'),
          box: com.content.box
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

      let defaultPanel = new CustomPanel()
      defaultPanel.init({
        id: 'test1',
        tab: {
          g: undefined,
          repaint: drawDefaultTab(defaultPanel),
          select: selectTab,
          unselect: unselectTab,
          close: () => {}
        },
        content: {
          g: undefined,
          repaint: drawDefaultContent
        }
      })
      // defaultPanel.setRepaintPanel(drawDefaultContent)
      // defaultPanel.setRepaintTab(drawDefaultTab)
      com.panelManager.addNewPanel(defaultPanel)

      let defaultPanel2 = new CustomPanel()
      defaultPanel2.init({
        id: 'test2',
        tab: {
          g: undefined,
          repaint: drawDefaultTab(defaultPanel2),
          select: selectTab,
          unselect: unselectTab,
          close: () => {}
        },
        content: {
          g: undefined,
          repaint: drawDefaultContent
        }
      })
      com.panelManager.addNewPanel(defaultPanel2)
    }
    this.createDefaultPanel = createDefaultPanel

    function changeFocusElement (type, data) {
      for (let i = 0; i < currentPanels.length; i++) {
        panelManager.removePanel(currentPanels[i])
      }
      currentPanels = []

      if (type === 'block') {
        createBlockPanels(data)
      } else if (type === 'event') {
        createEventPanels(data)
      }
    }
    this.changeFocusElement = changeFocusElement
    function drawDefaultContent (g) {
      let gridB = new GridBagLayout()
      gridB.init({
        size: {r: 6, c: 4},
        merge: [{s: {r: 0, c: 0}, e: {r: 2, c: 0}},
          {s: {r: 4, c: 0}, e: {r: 5, c: 0}},
          {s: {r: 1, c: 1}, e: {r: 2, c: 1}}],
        grid: []
      })


      g.selectAll('*').remove()
      g.append('rect')
        .attr('class', 'back')
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('width', g.attr('width'))
        .attr('height', g.attr('height'))
        .attr('stroke', '#CFD8DC')
        .attr('fill', '#CFD8DC')
        .attr('stroke-width', 5.5)
        .attr('stroke-opacity', 1)
      let fo = g.append('foreignObject')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', g.attr('width'))
        .attr('height', g.attr('height'))
      let div = fo.append('xhtml:div')
      div.append('input')
        //.attr('class', 'formMngrInput')
        .attr('type', 'text')
        .attr('value', 'none')
        .attr('required', 'true')
        .style('height', '100%')
      // div.append('textarea')
      //   .attr('class', 'comment')
      //   // .text('This is a test comment')
      //   .style('background-color', '#37474F')
      //   .style('border', 'none')
      //   .style('width', '98.5%')
      //   .style('height', Number(g.attr('height')) * 0.96 + 'px')
      //   .style('margin-top', '1px')
      //   .style('margin-left', '4px')
      //   .style('resize', 'none')
      //   .style('pointer-events', 'none')
    }
    function unselectTab (g) {
      g.select('rect.back')
        .attr('fill', '#546E7A')
        .attr('stroke', '#546E7A')
        .attr('height', Number(g.attr('height')) - 6)
    }
    function selectTab (g) {
      g.select('rect.back')
        .attr('fill', '#CFD8DC')
        .attr('stroke', '#CFD8DCs')
        .attr('height', g.attr('height'))
    }
    function drawDefaultTab (panel) {
      return function (g) {
        g.selectAll('*').remove()
        g.append('rect')
          .attr('class', 'back')
          .attr('x', 3)
          .attr('y', 0)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('width', Number(g.attr('width')) - 6)
          .attr('height', Number(g.attr('height')) - 6)
          .attr('fill', '#546E7A')
          .attr('stroke-width', 3.5)
          .attr('stroke-opacity', 1)
          .attr('stroke', '#546E7A')
          .on('click', function () {
            console.log(panel.get('id'))
          })
        g.append('text')
          .attr('class', 'tabName')
          .text(function (data) {
            return 'COMMENTS'
          })
          .attr('x', Number(g.attr('width')) / 2)
          .attr('y', Number(g.attr('height')) / 2)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .style('font-size', 18)
          .attr('dy', 7)
          .style('pointer-events', 'none')
          .attr('fill', '#37474F')
          .attr('stroke', 'none')
      }
    }
    function initData (dataIn) {
      com = dataIn

      com.g.attr('transform', 'translate(' + com.box.x + ',' + com.box.y + ')')
      // gBackPattern = gBlockBox.append('g').attr('transform', 'translate(' + 0 + ',' + 40 + ')')
      // gMiddleBox = gBlockBox.append('g').attr('transform', 'translate(' + blockBoxData.w * 0.1 + ',' + 0 + ')')

      createDefaultPanel()
      //createCommentPanel()
    }
    this.initData = initData

    function updateData (dataIn) {
    }
    this.updateData = updateData
  }

  let svgBlocksQueue = new SvgBlocksQueue()
  let svgBlocksQueueCreator = new SvgBlocksQueueCreator()
  let svgCommitCopyStrip = new SvgCommitCopyStrip()

  let svgSchedulingBlocksOverview = new SvgSchedulingBlocksOverview()
  let svgSchedulingBlock = new SvgSchedulingBlock()
  let svgBlocks = new SvgBlocksQueue()
  let svgMiddleInfo = new SvgMiddleInfo()
}
