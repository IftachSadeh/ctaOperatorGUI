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

window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueModif.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueCreator.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_panelManager.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_buttonPanel.js' })
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
      box: {x: (lenD.w[0] * 0.02), y: lenD.h[0] * 0.62, w: lenD.w[0] * 0.96, h: lenD.h[0] * 0.36},
      shrinked: {
        g: undefined,
        box: {x: 0, y: 0, w: 0.1, h: 1},
        child: {}
      },
      extended: {
        g: undefined,
        box: {x: 0.1, y: 0, w: 0.89, h: 1},
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
    // svgSchedulingBlock.initData({
    //   tag: 'schedulingBlocksOverview',
    //   g: svg.g.append('g'),
    //   child: {},
    //   box: {x: (lenD.w[0] * 0.125), y: lenD.h[0] * 0.62, w: lenD.w[0] * 0.855, h: lenD.h[0] * 0.36},
    //   shrinked: {
    //     box: {x: (lenD.w[0] * 0.125), y: lenD.h[0] * 0.62, w: lenD.w[0] * 0.10, h: lenD.h[0] * 0.36}
    //   },
    //   extended: {
    //     box: {x: (lenD.w[0] * 0.125), y: lenD.h[0] * 0.62, w: lenD.w[0] * 0.855, h: lenD.h[0] * 0.36}
    //   },
    //   data: {
    //     lastRawData: dataIn.data.blocks,
    //     formatedData: undefined
    //   },
    //   debug: {
    //     enabled: false
    //   }
    // })
    svgBlocks.initData(dataIn.data)
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
  // let SvgMiddleInfo = function () {
  //   let gBlockBox, gMiddleBox, gBackPattern, gHistoryBox
  //   let blockBoxData = {}
  //   let panelManager = null
  //   let currentPanels = []
  //   let commentPanel
  //
  //   function createMiddlePanel () {
  //     panelManager = new PanelManager()
  //     let optIn = {
  //       transX: blockBoxData.w * 0.19,
  //       transY: -1,
  //       width: blockBoxData.w * 0.8,
  //       height: (blockBoxData.h * 0.88) / 1,
  //       g: gMiddleBox.append('g'),
  //       manager: panelManager,
  //       dragable: {
  //           general: false,
  //           tab: false
  //         },
  //       closable: true
  //     }
  //     panelManager.init(optIn)
  //
  //     commentPanel = new CustomPanel()
  //     commentPanel.setTabProperties('dragable', optIn.dragable)
  //     commentPanel.setTabProperties('closable', optIn.closable)
  //     commentPanel.bindData({'tabName': 'INFORMATIONS'})
  //
  //     commentPanel.setRepaintPanel(drawCommentDisabled)
  //     commentPanel.setRepaintTab(drawTabDisabled)
  //
  //     panelManager.addNewPanel(commentPanel)
  //
  //     commentPanel = new CustomPanel()
  //     commentPanel.setTabProperties('dragable', optIn.dragable)
  //     commentPanel.setTabProperties('closable', optIn.closable)
  //     commentPanel.bindData({'tabName': 'INFORMATIONS'})
  //
  //     commentPanel.setRepaintPanel(drawCommentDisabled)
  //     commentPanel.setRepaintTab(drawTabDisabled)
  //
  //     panelManager.addNewPanel(commentPanel)
  //     currentPanels.push(commentPanel)
  //
  //     let panelManager2 = new PanelManager()
  //     let optIn2 = {
  //       transX: 0,
  //       transY: 0,
  //       width: blockBoxData.w * 0.20,
  //       height: (blockBoxData.h * 0.88) / 1,
  //       g: gMiddleBox.append('g'),
  //       manager: panelManager2,
  //       dragable: {
  //         general: false,
  //         tab: false
  //       },
  //       closable: true
  //     }
  //     panelManager2.init(optIn2)
  //
  //     let commentPanel2 = new CustomPanel()
  //     commentPanel2.setTabProperties('dragable', optIn.dragable)
  //     commentPanel2.setTabProperties('closable', optIn.closable)
  //     commentPanel2.bindData({'tabName': 'INFORMATIONS'})
  //
  //     commentPanel2.setRepaintPanel(drawCommentDisabled)
  //     commentPanel2.setRepaintTab(drawTabDisabled)
  //
  //     panelManager2.addNewPanel(commentPanel2)
  //     currentPanels.push(commentPanel2)
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
  //       return
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
  //       //   .attr('stroke', '#546E7A')
  //       //   .attr('fill', '#546E7A')
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
  //     let resultPanel = new CustomPanel()
  //     resultPanel.setTabProperties('dragable', optIn.dragable)
  //     resultPanel.setTabProperties('closable', optIn.closable)
  //     resultPanel.bindData({'tabName': 'INFORMATIONS'})
  //     resultPanel.setRepaintPanel(() => {})
  //     resultPanel.setRepaintTab(generalTabLayout)
  //     panelManager.addNewPanel(resultPanel)
  //
  //     let emptyPanel = new CustomPanel()
  //     emptyPanel.setTabProperties('dragable', optIn.dragable)
  //     emptyPanel.setTabProperties('closable', optIn.closable)
  //     emptyPanel.bindData({'tabName': 'INFORMATIONS'})
  //     emptyPanel.setRepaintPanel(() => {})
  //     emptyPanel.setRepaintTab(() => {})
  //     panelManager.addNewPanel(emptyPanel)
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
  //         return 'BLOCKS'
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
  //     h0 = lenD.h[0] * 0.4 // h0 *= 2.5;
  //     x0 = (lenD.w[0] * 0.01)
  //     y0 = lenD.h[0] * 0.62
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
  //     gMiddleBox = gBlockBox.append('g').attr('transform', 'translate(' + 0 + ',' + 0 + ')')
  //
  //     // gBackPattern.append('rect')
  //     //   .attr('x', -3)
  //     //   .attr('y', 0)
  //     //   .attr('rx', 2)
  //     //   .attr('ry', 2)
  //     //   .attr('width', 41)
  //     //   .attr('height', 30)
  //     //   .attr('stroke', '#546E7A')
  //     //   .attr('fill', '#546E7A')
  //     //   .attr('stroke-width', 3.5)
  //     //   .attr('stroke-opacity', 1)
  //     // gBackPattern.append('rect')
  //     //   .attr('x', 5)
  //     //   .attr('y', 3)
  //     //   .attr('rx', 2)
  //     //   .attr('ry', 2)
  //     //   .attr('width', 24)
  //     //   .attr('height', 24)
  //     //   .attr('stroke', '#CFD8DC')
  //     //   .attr('fill', '#CFD8DC')
  //     //   .attr('stroke-width', 0.5)
  //     //   .attr('stroke-opacity', 1)
  //     // gBackPattern.append('svg:image')
  //     //   .attr('class', 'icon')
  //     //   .attr('xlink:href', '/static/commit.svg')
  //     //   .attr('width', 30)
  //     //   .attr('height', 30)
  //     //   .attr('x', 2)
  //     //   .attr('y', 0)
  //     //
  //     // gBackPattern.append('rect')
  //     //   .attr('x', 47)
  //     //   .attr('y', 0)
  //     //   .attr('rx', 2)
  //     //   .attr('ry', 2)
  //     //   .attr('width', 68)
  //     //   .attr('height', 30)
  //     //   .attr('stroke', '#546E7A')
  //     //   .attr('fill', '#546E7A')
  //     //   .attr('stroke-width', 3.5)
  //     //   .attr('stroke-opacity', 1)
  //     // gBackPattern.append('rect')
  //     //   .attr('x', 53)
  //     //   .attr('y', 3)
  //     //   .attr('rx', 2)
  //     //   .attr('ry', 2)
  //     //   .attr('width', 24)
  //     //   .attr('height', 24)
  //     //   .attr('stroke', '#000000')
  //     //   .attr('fill', '#CFD8DC')
  //     //   .attr('stroke-width', 3.5)
  //     //   .attr('stroke-opacity', 1)
  //     // gBackPattern.append('svg:image')
  //     //   .attr('class', 'icon')
  //     //   .attr('xlink:href', '/static/plus.svg')
  //     //   .attr('width', 18)
  //     //   .attr('height', 18)
  //     //   .attr('x', 56)
  //     //   .attr('y', 6)
  //     // gBackPattern.append('rect')
  //     //   .attr('x', 86)
  //     //   .attr('y', 3)
  //     //   .attr('rx', 2)
  //     //   .attr('ry', 2)
  //     //   .attr('width', 24)
  //     //   .attr('height', 24)
  //     //   .attr('stroke', '#000000')
  //     //   .attr('fill', '#CFD8DC')
  //     //   .attr('stroke-width', 3.5)
  //     //   .attr('stroke-opacity', 1)
  //     // gBackPattern.append('svg:image')
  //     //   .attr('class', 'icon')
  //     //   .attr('xlink:href', '/static/option.svg')
  //     //   .attr('width', 28)
  //     //   .attr('height', 28)
  //     //   .attr('x', 84)
  //     //   .attr('y', 2)
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

    function initExtended () {
      com.extended.box.x = com.box.w * com.extended.box.x
      com.extended.box.y = com.box.h * com.extended.box.y
      com.extended.box.w = com.box.w * com.extended.box.w
      com.extended.box.h = com.box.h * com.extended.box.h

      com.extended.g = com.g.append('g')
        .attr('transform', 'translate(' + com.extended.box.x + ',' + com.extended.box.y + ')')
      com.extended.child.back = com.extended.g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', com.extended.box.w)
        .attr('height', com.extended.box.h)
        .attr('fill', '#546E7A')
        .attr('stroke', 'none')

      let pathShrinkButton =
      'M' + com.extended.box.w * 0.99 + ' ' + com.extended.box.h * 0.45 + ' ' +
      'L' + com.extended.box.w * 0.98 + ' ' + com.extended.box.h * 0.5 + ' ' +
      'L' + com.extended.box.w * 0.99 + ' ' + com.extended.box.h * 0.55 + ' '
      com.extended.child.shrinkButton = com.extended.g.append('path')
        .attr('stroke', '#222222')
        .attr('fill', 'none')
        .attr('stroke-width', 6)
        .attr('d', pathShrinkButton)
        .style('pointer-events', 'none')
      com.extended.child.shrinkButtonHitBox = com.extended.g.append('rect')
        .attr('x', com.extended.box.w * 0.97)
        .attr('y', com.extended.box.h * 0.43)
        .attr('width', com.extended.box.w * 0.03)
        .attr('height', com.extended.box.h * 0.14)
        .attr('fill-opacity', '0')
        .attr('stroke', 'none')
        .on('mouseover', function () {
          com.extended.child.shrinkButton.attr('stroke', '#90A4AE')
        })
        .on('mouseout', function () {
          com.extended.child.shrinkButton.attr('stroke', '#222222')
        })
        .on('click', shrink)
    }
    function initShrink () {
      com.shrinked.box.x = com.box.w * com.shrinked.box.x
      com.shrinked.box.y = com.box.h * com.shrinked.box.y
      com.shrinked.box.w = com.box.w * com.shrinked.box.w
      com.shrinked.box.h = com.box.h * com.shrinked.box.h

      com.shrinked.g = com.g.append('g')
        .attr('transform', 'translate(' + com.shrinked.box.x + ',' + com.shrinked.box.y + ')')
      com.shrinked.child.back = com.shrinked.g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', com.shrinked.box.w)
        .attr('height', com.shrinked.box.h)
        .attr('fill', '#546E7A')
        .attr('stroke', 'none')

      let pathShrinkButton =
        'M' + com.shrinked.box.w * 1.05 + ' ' + com.shrinked.box.h * 0.45 + ' ' +
        'L' + com.shrinked.box.w * 1.16 + ' ' + com.shrinked.box.h * 0.5 + ' ' +
        'L' + com.shrinked.box.w * 1.05 + ' ' + com.shrinked.box.h * 0.55 + ' '
      com.shrinked.child.shrinkButton = com.shrinked.g.append('path')
        .attr('stroke', '#222222')
        .attr('fill', 'none')
        .attr('stroke-width', 6)
        .attr('d', pathShrinkButton)
        .style('opacity', 0)
        .style('pointer-events', 'none')
      com.shrinked.child.shrinkButtonHitBox = com.shrinked.g.append('rect')
        .attr('x', com.shrinked.box.w * 1)
        .attr('y', com.shrinked.box.h * 0.43)
        .attr('width', com.shrinked.box.w * 0.25)
        .attr('height', com.shrinked.box.h * 0.14)
        .attr('fill-opacity', '0')
        .attr('stroke', 'none')
        .style('pointer-events', 'none')
        .on('mouseover', function () {
          com.shrinked.child.shrinkButton.attr('stroke', '#90A4AE')
        })
        .on('mouseout', function () {
          com.shrinked.child.shrinkButton.attr('stroke', '#222222')
        })
        .on('click', extend)
    }
    function initData (dataIn) {
      com = dataIn
      com.g.attr('transform', 'translate(' + com.box.x + ',' + com.box.y + ')')

      initExtended()
      initShrink()
    }
    this.initData = initData

    function extend () {
      com.extended.child.back.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .style('opacity', 1)
      com.extended.child.shrinkButton.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .style('opacity', 1)
      com.extended.child.shrinkButtonHitBox
        .style('pointer-events', 'auto')

      com.shrinked.child.shrinkButton.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .style('opacity', 0)
      com.shrinked.child.shrinkButtonHitBox
        .style('pointer-events', 'none')
    }
    this.extend = extend
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

    function initData (dataIn) {
      com = dataIn
      com.g.attr('transform', 'translate(' + com.box.x + ',' + com.box.y + ')')

      com.child.back = com.g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', com.extended.box.w)
        .attr('height', com.extended.box.h)
        .attr('fill', '#546E7A')
        .attr('stroke', 'none')
        .style('opacity', 0)

      let pathShrinkButton =
      'M' + com.extended.box.w * 0.99 + ' ' + com.extended.box.h * 0.45 + ' ' +
      'L' + com.extended.box.w * 0.98 + ' ' + com.extended.box.h * 0.5 + ' ' +
      'L' + com.extended.box.w * 0.99 + ' ' + com.extended.box.h * 0.55 + ' '
      com.child.shrinkButton = com.g.append('path')
        .attr('stroke', '#222222')
        .attr('fill', 'none')
        .attr('stroke-width', 6)
        .attr('d', pathShrinkButton)
        .style('pointer-events', 'none')
        .style('opacity', 0)
      com.child.shrinkButtonHitBox = com.g.append('rect')
        .attr('x', com.extended.box.w * 0.97)
        .attr('y', com.extended.box.h * 0.43)
        .attr('width', com.extended.box.w * 0.03)
        .attr('height', com.extended.box.h * 0.14)
        .attr('fill-opacity', '0')
        .attr('stroke', 'none')
        .style('opacity', 0)
        .on('mouseover', function () {
          com.child.shrinkButton.attr('stroke', '#90A4AE')
        })
        .on('mouseout', function () {
          com.child.shrinkButton.attr('stroke', '#222222')
        })
        .on('click', shrink)

      console.log(com.data.lastRawData);
    }
    this.initData = initData

    function extend () {
      com.child.back.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr('width', com.extended.box.w)
        .attr('height', com.extended.box.h)

      let pathShrinkButton =
        'M' + com.extended.box.w * 0.99 + ' ' + com.extended.box.h * 0.45 + ' ' +
        'L' + com.extended.box.w * 0.98 + ' ' + com.extended.box.h * 0.5 + ' ' +
        'L' + com.extended.box.w * 0.99 + ' ' + com.extended.box.h * 0.55 + ' '
      com.child.shrinkButton.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr('d', pathShrinkButton)
      com.child.shrinkButtonHitBox
        .on('click', shrink)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr('x', com.extended.box.w * 0.97)
        .attr('y', com.extended.box.h * 0.43)
    }
    this.extend = extend
    function shrink () {
      com.child.back.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr('width', com.shrinked.box.w)
        .attr('height', com.shrinked.box.h)

      let pathShrinkButton =
        'M' + com.shrinked.box.w * 1.05 + ' ' + com.shrinked.box.h * 0.45 + ' ' +
        'L' + com.shrinked.box.w * 1.16 + ' ' + com.shrinked.box.h * 0.5 + ' ' +
        'L' + com.shrinked.box.w * 1.05 + ' ' + com.shrinked.box.h * 0.55 + ' '
      com.child.shrinkButton.transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr('d', pathShrinkButton)
      com.child.shrinkButtonHitBox
        .on('click', extend)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr('x', com.shrinked.box.w * 1)
        .attr('y', com.shrinked.box.h * 0.43)
    }
    this.shrink = shrink

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

  let svgBlocksQueue = new SvgBlocksQueue()
  let svgBlocksQueueCreator = new SvgBlocksQueueCreator()
  let svgCommitCopyStrip = new SvgCommitCopyStrip()
  // let svgMiddleInfo = new SvgMiddleInfo()

  let svgSchedulingBlocksOverview = new SvgSchedulingBlocksOverview()
  let svgSchedulingBlock = new SvgSchedulingBlock()
  let svgBlocks = new SvgBlocksQueue()
}
