'use strict'
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// mainScriptTag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    '/js/widget_'+mainScriptTag+'.js'
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
/* global ScrollBox */
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
loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 6.75
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
  //     'widgetSource':widgetSource, 'widgetName':widgetType, 'widgetId':widgetId,
  //     'methodName':'schedBlocksControllerAskTelData',
  //     'methodArgs':data
  //   };
  //   sock.socket.emit('widget', dataEmit);
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
      // .attr('viewBox', '0 0 '+lenD.w[0]+' '+lenD.h[0] * whRatio)
      // .classed('svgInGridStack_inner', true)
      .style('background', '#383B42') // .style('background', 'red')// .style('border','1px solid red')
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

    // createPullPanel()
    // createPushPanel()
    com.dataIn = dataIn

    svgBlocksQueue.initData(dataIn.data)
    svgCommitCopyStrip.initData(dataIn.data)
    svgBlocksQueueCreator.initData(dataIn.data)
    // svgMiddleInfo.initData(dataIn.data)

    svgSchedulingBlocksOverview.initData({
      tag: 'schedulingBlocksOverview',
      g: svg.g.append('g'),
      box: {x: (lenD.w[0] * 0.02), y: lenD.h[0] * 0.59, w: lenD.w[0] * 0.6, h: lenD.h[0] * 0.37},
      shrinked: {
        g: undefined,
        box: {x: 0, y: 0, w: 1, h: 0.18},
        child: {}
      },
      content: {
        g: undefined,
        box: {x: 0, y: 0.15, w: 1, h: 0.85},
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
    svgBlocksQueueCreator.update(dataIn.data)
    // svgMiddleInfo.updateData(dataIn.data)
    svgSchedulingBlocksOverview.updateData({
      lastRawData: dataIn.data.blocks,
      formatedData: undefined,
      currentTime: {date: new Date(dataIn.data.timeOfNight.date_now), time: Number(dataIn.data.timeOfNight.now)},
      startTime: {date: new Date(dataIn.data.timeOfNight.date_start), time: Number(dataIn.data.timeOfNight.start)},
      endTime: {date: new Date(dataIn.data.timeOfNight.date_end), time: Number(dataIn.data.timeOfNight.end)}
    })
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
      w0 = lenD.w[0] * 0.6
      h0 = lenD.h[0] * 0.18 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.02)
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
        .attr('x', 0)
        .attr('y', -10)
        // .attr('rx', 2)
        // .attr('ry', 2)
        .attr('width', blockBoxData.w + 0)
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
      w0 = lenD.w[0] * 0.6
      h0 = lenD.h[0] * 0.25 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.02)
      y0 = lenD.h[0] * 0.3
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
        .attr('x', -0)
        .attr('y', -10) // - 15)
        // .attr('rx', 2)
        // .attr('ry', 2)
        .attr('width', blockBoxData.w + 0)
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
              box: {x: 0, y: blockBoxData.h * 0.66, w: blockBoxData.w, h: blockBoxData.h * 0.34, marg: blockBoxData.marg}
            },
            cancel: {
              g: undefined,
              box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h * 0.2, marg: blockBoxData.marg}
            },
            modification: {
              g: undefined,
              box: {x: 0, y: blockBoxData.h * 0.24, w: blockBoxData.w, h: blockBoxData.h * 0.36, marg: blockBoxData.marg}
            }
          },
          events: {
            click: () => {},
            mouseover: svgSchedulingBlocksOverview.schedBlocksOverRecepter,
            mouseout: svgSchedulingBlocksOverview.schedBlocksOutRecepter
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
        },
        pattern: {}
      })

      updateData(dataIn)
    }
    this.initData = initData

    function updateData (dataIn) {
      let telIds = []
      $.each(dataIn.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })

      blockQueueCreator.updateData({
        currentTime: {date: new Date(dataIn.timeOfNight.date_now), time: Number(dataIn.timeOfNight.now)},
        startTime: {date: new Date(dataIn.timeOfNight.date_start), time: Number(dataIn.timeOfNight.start)},
        endTime: {date: new Date(dataIn.timeOfNight.date_end), time: Number(dataIn.timeOfNight.end)},
        data: dataIn.blocks,
        telIds: telIds
      })
    }
    this.updateData = updateData

    function update (dataIn) {
      blockQueueCreator.update({
        currentTime: {date: new Date(dataIn.timeOfNight.date_now), time: Number(dataIn.timeOfNight.now)},
        startTime: {date: new Date(dataIn.timeOfNight.date_start), time: Number(dataIn.timeOfNight.start)},
        endTime: {date: new Date(dataIn.timeOfNight.date_end), time: Number(dataIn.timeOfNight.end)}
      })
    }
    this.update = update
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
      // com.shrinked.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', com.shrinked.box.w)
      //   .attr('height', com.shrinked.box.h)
      //   .attr('fill', '#aaaaaa')
      com.shrinked.child.centralBlockG = com.shrinked.g.append('g')
    }
    function initContent () {
      com.content.box.x = com.box.w * com.content.box.x
      com.content.box.y = com.box.h * com.content.box.y
      com.content.box.w = com.box.w * com.content.box.w
      com.content.box.h = com.box.h * com.content.box.h

      com.content.g = com.g.append('g')
        .attr('transform', 'translate(' + com.content.box.x + ',' + com.content.box.y + ')')
      // com.content.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', com.content.box.w)
      //   .attr('height', com.content.box.h)
      //   .attr('fill', '#cccccc')
      com.content.child.centralBlockG = com.content.g.append('g')
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
    function schedBlocksOverEmiter (data) {
      blockQueueCreator.focusOnSchedBlocks(data)
    }
    function schedBlocksOverRecepter (data) {
      com.shrinked.child.schedulingBlocks.selectAll('rect.background')
        .each(function (d) {
          if (Number(d.scheduleId) === data.data.metaData.nSched) {
            let length = com.data.formatedData.length
            let dim = {h: (length < 19 ? ((com.shrinked.box.h) * 0.8) : ((com.shrinked.box.h) * 0.5)), w: (com.shrinked.box.h) * 0.8}
            d3.select(this)
              .attr('fill', '#546E7A')
              .attr('stroke', '#90A4AE')
              .transition()
              .duration(400)
              .attr('stroke-width', 2.2)
              .attr('stroke-dasharray', [0, 0, dim.w + dim.h, 0, dim.h + dim.w, 0])
          }
        })
    }
    this.schedBlocksOverRecepter = schedBlocksOverRecepter
    function schedBlocksOutEmiter (data) {
      blockQueueCreator.unfocusOnSchedBlocks(data)
    }
    function schedBlocksOutRecepter (data) {
      com.shrinked.child.schedulingBlocks.selectAll('rect.background')
        .each(function (d) {
          if (Number(d.scheduleId) === data.data.metaData.nSched) {
            let length = com.data.formatedData.length
            let dim = {h: (length < 19 ? ((com.shrinked.box.h) * 0.8) : ((com.shrinked.box.h) * 0.5)), w: (com.shrinked.box.h) * 0.8}
            d3.select(this)
              .attr('fill', '#455A64')
              .attr('stroke', '#78909C')
              .transition()
              .duration(400)
              .attr('stroke-width', 1.8)
              .attr('stroke-dasharray', [0, dim.w * 0.5, dim.w * 0.5 + dim.h * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5])
          }
        })
    }
    this.schedBlocksOutRecepter = schedBlocksOutRecepter
    function populateShrink () {
      let length = com.data.formatedData.length
      let dim = {h: (length < 19 ? ((com.shrinked.box.h) * 0.8) : ((com.shrinked.box.h) * 0.5)), w: (com.shrinked.box.h) * 0.8}
      com.shrinked.dim = dim
      length += 1
      let offset = (com.box.w - (length < 19
        ? (dim.w * 1.1) * length
        : (length % 2 === 0
          ? ((dim.w * 1.1) * (length - (length % 2)) - ((dim.w * 1.1) * (length - (length % 2))) / 2)
          : ((dim.w * 1.1) / 2 * length)))) * 0.5
      length -= 1

      com.shrinked.child.schedulingBlocks = com.shrinked.g
        .selectAll('g.schedulingBlocks')
        .data(com.data.formatedData, function (d) {
          return d.scheduleId
        })
      let enterSchedulingBlocks = com.shrinked.child.schedulingBlocks
        .enter()
        .append('g')
        .attr('class', 'schedulingBlocks')
        .attr('transform', function (d, i) {
          let translate = {
            x: ((dim.w * 1.1) + offset + (length < 19
              ? (dim.w * 1.1) * i
              : (length % 2 === 0
                ? ((dim.w * 1.1) * (i - (i % 2)) - ((dim.w * 1.1) * (i - (i % 2))) / 2)
                : ((dim.w * 1.1) / 2 * i)))),
            y: (length < 19 ? 0 : ((com.shrinked.box.h / 2) * (i % 2)))
          }
          d.translate = translate
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterSchedulingBlocks.append('rect')
        .attr('class', 'background')
        .attr('x', function (d, i) {
          return dim.w * 0.05
        })
        .attr('y', function (d, i) {
          return dim.h * 0.05
        })
        .attr('width', function (d, i) {
          return dim.w
        })
        .attr('height', function (d, i) {
          return dim.h
        })
        .attr('fill', function (d, i) {
          return '#455A64'
        })
        .attr('stroke', '#78909C')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', [0, dim.w * 0.5, dim.w * 0.5 + dim.h * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5])
        .on('mouseover', function (d) {
          if (com.data.focusOn === d.scheduleId) return
          d3.select(this)
            .attr('fill', '#546E7A')
            .attr('stroke', '#90A4AE')
            .transition()
            .duration(400)
            .attr('stroke-width', 2.2)
            .attr('stroke-dasharray', [0, 0, dim.w + dim.h, 0, dim.h + dim.w, 0])
          schedBlocksOverEmiter(d)
        })
        .on('mouseout', function (d) {
          if (com.data.focusOn === d.scheduleId) return
          d3.select(this)
            .attr('fill', '#455A64')
            .attr('stroke', '#78909C')
            .transition()
            .duration(400)
            .attr('stroke-width', 1.8)
            .attr('stroke-dasharray', [0, dim.w * 0.5, dim.w * 0.5 + dim.h * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5 + dim.w * 0.5, dim.h * 0.5])
          schedBlocksOutEmiter(d)
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
          if (com.data.focusOn === d.scheduleId) {
            unfocusOnSchedulingBlocks()
            com.data.focusOn = undefined
            d3.select(this)
              .attr('fill', '#455A64')
              .attr('stroke', '#78909C')
              .transition()
              .duration(400)
              .attr('stroke-width', 1.8)
              .attr('stroke-dasharray', [4, 4])
          } else {
            if (com.data.focusOn !== undefined) {
              schedBlocksOutRecepter({data: {metaData: {nSched: Number(com.data.focusOn)}}})
              schedBlocksOutEmiter({scheduleId: com.data.focusOn})
            }
            com.data.focusOn = d.scheduleId
            focusOnSchedulingBlocks(d)
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
        .style('font-size', dim.h * 0.25)
        .attr('dy', dim.h * 0.15)
        .style('pointer-events', 'none')
        .attr('fill', '#CFD8DC')
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
            return com.style.recCol(d)
          })
          .style('opacity', 0.7)
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2)
          .style('pointer-events', 'none')
      })

      com.shrinked.child.schedulingBlocks = enterSchedulingBlocks.merge(com.shrinked.child.schedulingBlocks)
      com.shrinked.child.schedulingBlocks.each(function (d) {
        d3.select(this).selectAll('rect.subBlocks')
          .data(d.blocks, function (d) {
            return d.obId
          })
          .transition()
          .duration(800)
          .attr('fill', function (d, i) {
            return com.style.recCol(d)
          })
      })

      if (com.shrinked.child.newButton) return
      com.shrinked.child.newButton = com.shrinked.g
        .append('g')
        .attr('class', 'newButton')
        .attr('transform', 'translate(' + offset + ',' + (length < 19 ? 0 : (com.shrinked.box.h * 0.25)) + ')')
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
        .on('mouseover', function (d) {
          // if (com.data.focusOn === d.scheduleId) return
          d3.select(this)
            .attr('fill', '#90A4AE')
            .attr('stroke', '#90A4AE')
            .transition()
            .duration(400)
        })
        .on('mouseout', function (d) {
          // if (com.data.focusOn === d.scheduleId) return
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
          if (optIn.endTime < com.data.currentTime.time) return '#626262'
          let state = hasVar(optIn.state)
            ? optIn.state
            : optIn.exeState.state
          let canRun = hasVar(optIn.canRun)
            ? optIn.canRun
            : optIn.exeState.canRun
          if (state === 'wait') return '#dddddd'
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
      initContent()
      formatData()
      populateShrink()
    }
    this.initData = initData

    function createSchedulingBlocksInfoPanel (data) {
      let dim = {
        w: com.content.box.w * 0.35,
        h: com.content.box.h * 0.9,
        margH: com.content.box.h * 0.05
      }
      let borderSize = 2

      com.content.child.schedulingBlocksInfoPanelG = com.content.g.append('g')
      let heightLine = 16
      let fo = com.content.child.schedulingBlocksInfoPanelG.append('foreignObject')
        .style('width', dim.w + 'px')
        .style('height', dim.h + 'px')
        .style('x', 0 + 'px')
        .style('y', dim.margH + 'px')
      let div = fo.append('xhtml:div')
        .attr('class', 'overflowVerticalDiv')
        .style('border', borderSize + 'px solid #78909C')
        .style('background-color', '#ECEFF1')
      div.append('input')
        .attr('type', 'text')
        .attr('value', 'SB ' + data.scheduleId)
        .text('SB ' + data.scheduleId)
        .style('text-align', 'center')
        // .style('position', 'absolute')
        // .style('border-radius', '2px')
        .style('width', dim.w - borderSize * 2 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', borderSize + 'px')
        .style('margin-left', borderSize + 'px')
        .style('background-color', '#ECEFF1')
        .style('border-style', 'solid')
        .style('border', '0px solid #ffffff')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')

      div.append('label')
        .html('Target')
        .style('display', 'block')
        // .style('position', 'absolute')
        .style('text-align', 'center')
        // .style('border-radius', '2px')
        .style('width', dim.w - borderSize * 2 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', heightLine + 'px')
        .style('margin-left', 1.8 + 'px')
        .style('background-color', '#ECEFF1')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
      let color = 0
      div.append('label')
        .html('Name')
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 2 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
      div.append('label')
        .html(': ' + data.blocks[0].targetName)
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 1 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', borderSize * 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('text-align', 'left')
      color += 1
      div.append('label')
        .html('Id')
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 2 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
      div.append('label')
        .html(': ' + data.blocks[0].targetId)
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 1 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', borderSize * 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('text-align', 'left')
      color += 1
      div.append('label')
        .html('Position')
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 2 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
      div.append('label')
        .html(': ' + data.blocks[0].targetPos)
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 1 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', borderSize * 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('text-align', 'left')

      div.append('label')
        .html('Other')
        .style('display', 'inline-block')
        // .style('position', 'absolute')
        .style('text-align', 'center')
        // .style('border-radius', '2px')
        .style('width', dim.w - borderSize * 2 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', heightLine * 0.5 + 'px')
        .style('margin-left', 1.8 + 'px')
        .style('background-color', '#ECEFF1')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
      color = 0
      div.append('label')
        .html('other1:')
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 2 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
      div.append('label')
        .html('value1')
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 1 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', borderSize * 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('text-align', 'left')
      color += 1
      div.append('label')
        .html('other2:')
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 2 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
      div.append('label')
        .html('value2')
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 1 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', borderSize * 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('text-align', 'left')
      color += 1
      div.append('label')
        .html('other3:')
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 2 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
      div.append('label')
        .html('value3')
        .style('float', 'left')
        .style('width', (dim.w) * 0.5 - borderSize * 1 + 'px')
        .style('height', heightLine + 'px')
        .style('margin-top', 0 + 'px')
        .style('margin-left', borderSize * 0 + 'px')
        .style('background-color', color % 2 === 1 ? '#CFD8DC' : '#B0BEC5')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('text-align', 'left')
    }
    function createCentralBlock (data) {
      let position = {
        x: com.content.box.w * 0.4,
        y: com.content.box.h * 0.5
      }

      com.shrinked.child.centralBlockLine1 = com.shrinked.child.centralBlockG.append('line')
        .attr('x1', data.translate.x + com.shrinked.dim.w * 0.5)
        .attr('y1', data.translate.y + com.shrinked.dim.w * 0.5)
        .attr('x2', data.translate.x + com.shrinked.dim.w * 0.5)
        .attr('y2', com.shrinked.box.h)
        .attr('stroke', '#78909C')
        .attr('stroke-width', 4)
      com.shrinked.child.centralBlockLine2 = com.shrinked.child.centralBlockG.append('line')
        .attr('x1', data.translate.x + com.shrinked.dim.w * 0.5)
        .attr('y1', com.shrinked.box.h)
        .attr('x2', position.x)
        .attr('y2', com.shrinked.box.h)
        .attr('stroke', '#78909C')
        .attr('stroke-width', 4)

      com.content.child.centralBlockLine = com.content.child.centralBlockG.append('line')
        .attr('x1', position.x)
        .attr('y1', 0)
        .attr('x2', position.x)
        .attr('y2', position.y)
        .attr('stroke', '#78909C')
        .attr('stroke-width', 4)

      com.content.child.centralBlock = com.content.child.centralBlockG.append('circle')
        .attr('cx', position.x)
        .attr('cy', position.y)
        .attr('r', 10)
        .attr('fill', '#78909C')
        .attr('stroke', 'none')

      com.content.child.centralBlockLine1 = com.content.child.centralBlockG.append('line')
        .attr('x1', position.x)
        .attr('y1', position.y)
        .attr('x2', position.x + com.content.box.w * 0.05)
        .attr('y2', position.y)
        .attr('stroke', '#78909C')
        .attr('stroke-width', 4)
      com.content.child.centralBlockLine2 = com.content.child.centralBlockG.append('line')
        .attr('x1', position.x)
        .attr('y1', position.y)
        .attr('x2', position.x - com.content.box.w * 0.05)
        .attr('y2', position.y)
        .attr('stroke', '#78909C')
        .attr('stroke-width', 4)
    }
    function createBlocksInScheduleIcons (data) {
      let dim = {
        w: com.content.box.w * 0.55,
        h: com.content.box.h * 0.9,
        margH: com.content.box.h * 0.05
      }
      let position = {
        x: com.content.box.w * 0.45,
        y: 0
      }
      let dimBlocks = {h: (com.shrinked.box.h) * 0.6, w: (com.shrinked.box.h) * 0.6}
      let length = data.blocks.length
      let subBlocks = com.content.g
        .selectAll('g.subBlocks')
        .data(data.blocks, function (d) {
          return d.metaData.blockName
        })

      let enterSubBlocks = subBlocks
        .enter()
        .append('g')
        .attr('class', 'subBlocks')
        .attr('transform', function (d, i) {
          let transX = position.x
          let transY = (dim.h / (length + 1)) * (i + 1)
          return 'translate(' + transX + ',' + transY + ')'
        })
      enterSubBlocks.append('rect')
        .attr('class', 'block')
        .attr('y', function (d, i) {
          return 0
        })
        .attr('x', function (d, i) {
          return 0
        })
        .attr('width', function (d, i) {
          return dimBlocks.h
        })
        .attr('height', function (d, i) {
          return dimBlocks.h
        })
        .attr('fill', function (d, i) {
          return com.style.recCol(d)
        })
        .style('opacity', 0.7)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.2)
        .style('pointer-events', 'auto')
      enterSubBlocks.append('text')
        .text(function (d) {
          return d.metaData.nObs
        })
        .attr('x', dim.w * 0.1)
        .attr('y', dimBlocks.h * 0.6)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'start')
        .style('font-size', 10)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', '#CFD8DC')
        .attr('stroke', 'none')
      enterSubBlocks.append('text')
        .text(function (d) {
          return 'Time:' + d.startTime + ' -> ' + d.endTime
        })
        .attr('x', dim.w * 0.2)
        .attr('y', dimBlocks.h * 0.6)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'start')
        .style('font-size', 10)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', '#CFD8DC')
        .attr('stroke', 'none')

      subBlocks.each(function (d, i) {
        d3.select(this).select('rect.block')
          .transition()
          .duration(800)
          .attr('fill', function () {
            return com.style.recCol(d)
          })
      })
    }

    function removeSchedulingBlocksInfoPanel (data) {
      if (com.content.child.schedulingBlocksInfoPanelG) com.content.child.schedulingBlocksInfoPanelG.remove()
    }
    function removeCentralBlock (data) {
      console.log('removecentrla');
      com.shrinked.child.centralBlockG.selectAll('*').remove()
      com.content.child.centralBlockG.selectAll('*').remove()

    }
    function removeBlocksInScheduleIcons () {
      console.log('removerigth');
      com.content.g
        .selectAll('g.subBlocks')
        .remove()
    }

    function focusOnSchedulingBlocks (data) {
      unfocusOnSchedulingBlocks()
      createCentralBlock(data)
      createSchedulingBlocksInfoPanel(data)
      createBlocksInScheduleIcons(data)
    }
    this.focusOnSchedulingBlocks = focusOnSchedulingBlocks
    function unfocusOnSchedulingBlocks () {
      removeBlocksInScheduleIcons()
      removeCentralBlock()
      removeSchedulingBlocksInfoPanel()
    }
    this.unfocusOnSchedulingBlocks = unfocusOnSchedulingBlocks

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
      dataIn.focusOn = com.data.focusOn
      com.data = dataIn
      formatData()
      populateShrink()
      // for (let i = 0; i < com.data.formatedData.length; i++) {
      //   if (com.data.formatedData[i].scheduleId === com.data.focusOn) {
      //     for (let j = 0; j < com.data.formatedData[i].blocks.length; j++) {
      //       console.log(com.data.formatedData[i].blocks[j].exeState.state);
      //     }
      //   }
      // }
      if (com.data.focusOn) {
        for (let i = 0; i < com.data.formatedData.length; i++) {
          if (com.data.formatedData[i].scheduleId === com.data.focusOn) createBlocksInScheduleIcons(com.data.formatedData[i])
        }
      }
      // com.shrinked.child.schedulingBlocks.selectAll('rect.subBlocks')
      //   .attr('fill', function (d, i) {
      //     return com.style.recCol(d)
      //   })
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

      // let defaultPanel2 = new CustomPanel()
      // defaultPanel2.init({
      //   id: 'test2',
      //   tab: {
      //     g: undefined,
      //     repaint: drawDefaultTab(defaultPanel2),
      //     select: selectTab,
      //     unselect: unselectTab,
      //     close: () => {}
      //   },
      //   content: {
      //     g: undefined,
      //     repaint: drawDefaultContent
      //   }
      // })
      // com.panelManager.addNewPanel(defaultPanel2)
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
      let defaultChangeNotification = {
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
      let modifications = [
        {id: 'm1',
          block: {sched: '2', 'block': '1'},
          prop: 'startTime',
          value: {old: 12000, new: 7800},
          conflicts: ['c1', 'c3']
        },
        {id: 'm2',
          block: {sched: '2', 'block': '2'},
          prop: 'startTime',
          value: {old: 4900, new: 11680},
          conflicts: []
        },
        {id: 'm3',
          block: {sched: '5', 'block': '0'},
          prop: 'startTime',
          value: {old: 2900, new: 500},
          conflicts: ['c2']
        },
        {id: 'm4',
          block: {sched: '6', 'block': '2'},
          prop: 'startTime',
          value: {old: 11459, new: 4900},
          conflicts: []
        },
        {id: 'm5',
          block: {sched: '6', 'block': '5'},
          prop: 'startTime',
          value: {old: 13000, new: 10680},
          conflicts: ['c4']
        }
      ]

      let dim = {x: Number(g.attr('width')) * 0.05, y: Number(g.attr('height')) * 0.11, w: Number(g.attr('width')) * 0.9, h: Number(g.attr('height') * 0.5)}
      let dimModifs = {x: Number(g.attr('width')) * 0.05, y: Number(g.attr('height')) * 0.07, w: Number(g.attr('width')) * 0.9, h: Number(g.attr('height') * 0.15)}
      let dimBack = {x: 1.5, y: 5, w: Number(g.attr('width')) - 3, h: Number(g.attr('height') * 1)}

      let dimTop = {x: Number(g.attr('width')) * 0.05, y: 0 + Number(g.attr('height') * 0.06), w: Number(g.attr('width')) * 0.9, h: Number(g.attr('height')) * 0.29}
      let dimMiddle = {x: Number(g.attr('width')) * 0.05, y: Number(g.attr('height')) * 0.4, w: Number(g.attr('width')) * 0.9, h: Number(g.attr('height') * 0.29)}
      let dimBottom = {x: Number(g.attr('width')) * 0.05, y: 0 + Number(g.attr('height') * 7), w: Number(g.attr('width')) * 0.9, h: Number(g.attr('height')) * 0.29}
      // let gridB = new GridBagLayout()
      // gridB.init({
      //   size: {r: 6, c: 4},
      //   merge: [{s: {r: 0, c: 0}, e: {r: 2, c: 0}},
      //     {s: {r: 4, c: 0}, e: {r: 5, c: 0}},
      //     {s: {r: 1, c: 1}, e: {r: 2, c: 1}}],
      //   grid: []
      // })

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
        .attr('fill', '#ECEFF1')
        .attr('stroke-width', 6)
        .attr('stroke-opacity', 1)
      g.append('rect')
        .attr('class', 'bottom-back')
        .attr('x', dimTop.x)
        .attr('y', dimTop.y - 4)
        .attr('width', dimTop.w)
        .attr('height', dimMiddle.h)
        .attr('stroke', '#37474F')
        .attr('stroke-dasharray', [dimTop.w * 0.4, dimTop.w * 0.2, dimTop.w * 0.4, dimTop.h + dimTop.w + dimTop.h])
        .attr('fill', '#ECEFF1')
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 1)
      g.append('text')
        .text(function (data) {
          return 'Modifications'
        })
        .attr('x', dimBack.x + dimBack.w * 0.5)
        .attr('y', dimTop.y - 4)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 10)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', '#000000')
        .attr('stroke', 'none')

      // g.append('rect')
      //   .attr('x', dimTop.x)
      //   .attr('y', dimTop.y)
      //   .attr('width', dimTop.w)
      //   .attr('height', dimTop.h)
      //   .attr('stroke', 'none')
      //   .attr('fill', '#ffffbb')
      //
      // // let defs = g.append('defs')
      // // let pattern = defs.append('pattern')
      // //   .attr('id', 'patternMoved')
      // //   .attr('x', '0')
      // //   .attr('y', '0')
      // //   .attr('width', 4)
      // //   .attr('height', 4)
      // //   .attr('fill', '#ffffff')
      // //   .attr('patternUnits', 'userSpaceOnUse')
      // // pattern.append('line')
      // //   .attr('x1', 2)
      // //   .attr('y1', 0)
      // //   .attr('x2', 2)
      // //   .attr('y2', 4)
      // //   .attr('stroke', '#444444')
      // //   .attr('stroke-width', 0.1)
      // // pattern.append('line')
      // //   .attr('x1', 0)
      // //   .attr('y1', 2)
      // //   .attr('x2', 4)
      // //   .attr('y2', 2)
      // //   .attr('stroke', '#444444')
      // //   .attr('stroke-width', 0.1)
      // // g.append('rect')
      // //   .attr('x', dimMiddle.x)
      // //   .attr('y', dimMiddle.y)
      // //   .attr('width', dimMiddle.w)
      // //   .attr('height', dimMiddle.h)
      // //   .attr('stroke', '#000000')
      // //   .attr('stroke-width', 0.2)
      // //   .style('fill', '#ffffff')
      // // g.append('rect')
      // //   .attr('x', dimMiddle.x)
      // //   .attr('y', dimMiddle.y)
      // //   .attr('width', dimMiddle.w)
      // //   .attr('height', dimMiddle.h)
      // //   .attr('stroke', '#000000')
      // //   .attr('stroke-width', 0.2)
      // //   .style('fill', 'url(#patternMoved)')
      // g.append('rect')
      //   .attr('x', dimBottom.x)
      //   .attr('y', dimBottom.y)
      //   .attr('width', dimBottom.w)
      //   .attr('height', dimBottom.h)
      //   .attr('stroke', 'none')
      //   .attr('fill', '#ddddbb')
      //
      // let sizeBlockModif = 20
      // let blocksModif = g.selectAll('rect.modification')
      //   .data(modifications)
      // blocksModif.enter()
      //   .append('rect')
      //   .attr('class', 'modification')
      //   .attr('x', function (d, i) {
      //     let space = (dimTop.w / modifications.length)
      //     d.position = {x: dimTop.x + (space * i) + space * 0.5 - sizeBlockModif * 0.5,
      //       y: dimTop.y + dimTop.h * 0.5 - sizeBlockModif * 0.5}
      //     return dimTop.x + (space * i) + space * 0.5 - sizeBlockModif * 0.5
      //   })
      //   .attr('y', dimTop.y + dimTop.h * 0.5 - sizeBlockModif * 0.5)
      //   .attr('width', sizeBlockModif)
      //   .attr('height', sizeBlockModif)
      //   .attr('fill', '#ffffff')
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)
      //
      // let data = {nodes: [], links: []}
      // // for (let i = 0; i < modifications.length; i++) {
      // //   data.nodes.push({type: 'modification', id: modifications[i].id, data: modifications[i], fx: modifications[i].position.x, fy: modifications[i].position.y})
      // //   for (let j = 0; j < modifications[i].conflicts.length; j++) {
      // //     data.links.push({source: modifications[i].id, target: modifications[i].conflicts[j]})
      // //   }
      // // }
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
      //
      // let smallRadius = 7
      // let bigRadius = 14
      // let simulation = d3.forceSimulation()
      //   .force('link', d3.forceLink().id(function (d) { return d.id }))
      //   .force('collide', d3.forceCollide(function (d) { return (d.type === 'conflict' ? bigRadius * 1.5 : smallRadius * 1.5) }).iterations(32))
      //   .force('charge', d3.forceManyBody().strength(function (d) {
      //     return (d.type === 'conflict' ? -20 : -20)
      //   }))
      //   .force('center', d3.forceCenter(dimMiddle.x + (dimMiddle.w / 2), dimMiddle.y + (dimMiddle.h / 2)))
      //   .force('y', d3.forceY(0))
      //   .force('x', d3.forceX(0))
      // simulation.nodes(data.nodes)
      // simulation.force('link').links(data.links)
      //
      // var link = g.append('g')
      //   .attr('class', 'links')
      //   .selectAll('line')
      //   .data(data.links)
      //   .enter()
      //   .append('line')
      //   .attr('stroke', 'black')
      //
      // var node = g.append('g')
      //   .attr('class', 'nodes')
      //   .selectAll('circle')
      //   .data(data.nodes)
      //   .enter().append('circle')
      //   .attr('id', function (d) { return d.id })
      //   .attr('r', function (d) {
      //     return (d.type === 'conflict' ? bigRadius : smallRadius)
      //   })
      //   .attr('fill', '#CFD8DC')
      //   .attr('stroke', '#111111')// '#ECEFF1')
      //   .attr('stroke-width', 0.5)
      //
      // simulation.on('tick', function () {
      //   link
      //     .attr('x1', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(dimMiddle.x + radius, Math.min(dimMiddle.x + dimMiddle.w - radius, d.source.x)) })
      //     .attr('y1', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(dimMiddle.y + radius, Math.min(dimMiddle.y + dimMiddle.h - radius, d.source.y)) })
      //     .attr('x2', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(dimMiddle.x + radius, Math.min(dimMiddle.x + dimMiddle.w - radius, d.target.x)) })
      //     .attr('y2', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(dimMiddle.y + radius, Math.min(dimMiddle.y + dimMiddle.h - radius, d.target.y)) })
      //
      //   node
      //     .attr('cx', function (d) {
      //       let radius = (d.type === 'conflict' ? bigRadius : smallRadius)
      //       d.x = Math.max(dimMiddle.x + radius, Math.min(dimMiddle.x + dimMiddle.w - radius, d.x))
      //       return d.x
      //     })
      //     .attr('cy', function (d) {
      //       let radius = (d.type === 'conflict' ? bigRadius : smallRadius)
      //       d.y = Math.max(dimMiddle.y + radius, Math.min(dimMiddle.y + dimMiddle.h - radius, d.y))
      //       return d.y
      //     })
      // })

      // let lineGenerator = d3.line()
      //   .x(function (d) { return d.x })
      //   .y(function (d) { return d.y })
      // let curveGenerator = d3.line()
      //   .curve(d3.curveBasis)
      //   .x(function (d) { return d.x })
      //   .y(function (d) { return d.y })
      // let dataPointsTop = [
      //   {x: dimMiddle.x, y: dimMiddle.y},
      //
      //   {x: dimMiddle.x + (dimMiddle.w * 0.8), y: dimMiddle.y},
      //   {x: dimMiddle.x + dimMiddle.w, y: dimMiddle.y + (dimMiddle.h * 0.2)},
      //
      //   {x: dimMiddle.x + (dimMiddle.w * 0.3), y: dimMiddle.y + dimMiddle.h},
      //   {x: dimMiddle.x, y: dimMiddle.y + (dimMiddle.h * 0.75)},
      //
      //   {x: dimMiddle.x, y: dimMiddle.y}
      // ]
      // let dataPointsBottomIntern = [
      //   {x: dimMiddle.x + dimMiddle.w, y: dimMiddle.y + (dimMiddle.h * 0.2)},
      //   {x: dimMiddle.x + dimMiddle.w, y: dimMiddle.y + (dimMiddle.h * 0.7)},
      //   {x: dimMiddle.x + dimMiddle.w, y: dimMiddle.y + dimMiddle.h},
      //   {x: dimMiddle.x + (dimMiddle.w * 0.7), y: dimMiddle.y + dimMiddle.h},
      //   {x: dimMiddle.x + (dimMiddle.w * 0.3), y: dimMiddle.y + dimMiddle.h}
      // ]
      // let dataPointsBottomExtern = [
      //   {x: 20 + dimMiddle.x + dimMiddle.w, y: dimMiddle.y + (dimMiddle.h * 0.2)},
      //   {x: 20 + dimMiddle.x + dimMiddle.w, y: 20 + dimMiddle.y + (dimMiddle.h * 0.7)},
      //   {x: 20 + dimMiddle.x + dimMiddle.w, y: 20 + dimMiddle.y + dimMiddle.h},
      //   {x: 20 + dimMiddle.x + (dimMiddle.w * 0.7), y: 20 + dimMiddle.y + dimMiddle.h},
      //   {x: dimMiddle.x + (dimMiddle.w * 0.3), y: 20 + dimMiddle.y + dimMiddle.h}
      // ]
      // let pathTop = g.append('path')
      //   .data([dataPointsTop])
      //   .attr('class', 'line')
      //   .attr('d', lineGenerator)
      //   .attr('fill', '#bbbbbb')
      // let pathBottomExtern = g.append('path')
      //   .data([dataPointsBottomExtern])
      //   .attr('class', 'line')
      //   .attr('d', curveGenerator)console.log(this);
      //   .attr('fill', 'none')
      // let pathBottomIntern = g.append('path')
      // pathBottomIntern.data([dataPointsBottomIntern])
      //   .attr('class', 'line')
      //   .attr('d', curveGenerator)
      //   .attr('fill', '#CFD8DC')
      // let totBlocks = [].concat(com.data.lastRawData.run).concat(com.data.lastRawData.wait)
      // let blocksConflicts = g.selectAll('rect.conflict')
      //   .data(totBlocks)
      //   .enter()
      //   .append('rect')
      //   .attr('class', 'conflict')
      //   .attr('x', function (d, i) {
      //     let sizeIntern = pathBottomIntern.node().getTotalLength() / totBlocks.length
      //     return pathBottomIntern.node().getPointAtLength((sizeIntern * i) + (sizeIntern * 0.1)).x
      //   })
      //   .attr('y', function (d, i) {
      //     let sizeIntern = pathBottomIntern.node().getTotalLength() / totBlocks.length
      //     return pathBottomIntern.node().getPointAtLength((sizeIntern * i) + (sizeIntern * 0.1)).y
      //   })
      //   .attr('width', 16)
      //   .attr('height', 16)
      //   .attr('fill', '#bbbbbb')

      // let blocksConflicts = g.selectAll('path.conflict')
      //   .data(totBlocks)
      //   .enter()
      //   .append('path')
      //   .attr('class', 'conflict')
      //   .attr('d', function (d, i) {
      //     let sizeIntern = pathBottomIntern.node().getTotalLength() / totBlocks.length
      //     let sizeExtern = pathBottomExtern.node().getTotalLength() / totBlocks.length
      //     let points = [
      //       pathBottomIntern.node().getPointAtLength((sizeIntern * i) + (sizeIntern * 0.1)),
      //       pathBottomExtern.node().getPointAtLength((sizeExtern * i) + (sizeExtern * 0.1)),
      //       pathBottomExtern.node().getPointAtLength((sizeExtern * (i + 1)) - (sizeExtern * 0.1)),
      //       pathBottomIntern.node().getPointAtLength((sizeIntern * (i + 1)) - (sizeIntern * 0.1))
      //     ]
      //     return lineGenerator(points)
      //   })
      //   .attr('fill', '#CFD8DC')
      // g.append('text')
      //   .text(function (data) {
      //     return 'Sched. Blocks'
      //   })
      //   .attr('x', dim.x + dim.w * 0.1)
      //   .attr('y', dimBack.y + dimBack.h * 0.08)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 8)
      //   .attr('dy', 0)
      //   .style('pointer-events', 'none')
      //   .attr('fill', '#000000')
      //   .attr('stroke', 'none')
      // g.append('text')
      //   .text(function (data) {
      //     return 'Blocks'
      //   })
      //   .attr('x', dim.x + dim.w * 0.3)
      //   .attr('y', dimBack.y + dimBack.h * 0.08)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 8)
      //   .attr('dy', 0)
      //   .style('pointer-events', 'none')
      //   .attr('fill', '#000000')
      //   .attr('stroke', 'none')
      // g.append('text')
      //   .text(function (data) {
      //     return 'Properties'
      //   })
      //   .attr('x', dimBack.x + dimBack.w * 0.7)
      //   .attr('y', dimBack.y + dimBack.h * 0.08)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 8)
      //   .attr('dy', 0)
      //   .style('pointer-events', 'none')
      //   .attr('fill', '#000000')
      //   .attr('stroke', 'none')
      // g.append('rect')
      //   .attr('class', 'back_modif')
      //   .attr('x', dimModifs.x)
      //   .attr('y', dimModifs.y - 4)
      //   .attr('width', dimModifs.w)
      //   .attr('height', dimModifs.h + 19)
      //   .attr('stroke', '#37474F')
      //   .attr('fill', 'none')
      //   .attr('stroke-width', 0.5)
      //   .attr('stroke-opacity', 1)
      //   .attr('stroke-dasharray', [dimModifs.w * 0.4, dimModifs.w * 0.2, dimModifs.w * 0.4, dimModifs.h + 19 + dimModifs.w + dimModifs.h + 19])

      // let fo = g.append('foreignObject')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', g.attr('width'))
      //   .attr('height', g.attr('height'))
      // let div = fo.append('xhtml:div')
      // let sizeProp = 25

      let fo = g.append('foreignObject')
        .style('width', dimTop.w + 'px')
        .style('height', dimTop.h + 'px')
        .style('x', dimTop.x + 'px')
        .style('y', dimTop.y + 'px')
      let rootDiv = fo.append('xhtml:div')
        .style('display', 'inline-block')
        .style('border', 0 + 'px solid #78909C')
        .style('background-color', '#ECEFF1')
        .style('width', '92%')
        .style('height', 'calc(100% - 15px)')
      let quickDiv = fo.append('xhtml:div')
        .style('display', 'inline-block')
        .style('background-color', '#333333')
        .style('width', '8%')
        .style('height', 'calc(100% - 15px)')
      let titleDiv = rootDiv.append('div')
        .style('height', '15px')
        .style('border', 0 + 'px solid #78909C')
        .style('background-color', '#ECEFF1')
      let div = rootDiv.append('div')
        .attr('class', 'overflowVerticalDiv')
        .style('border', 0 + 'px solid #78909C')
        .style('background-color', '#ECEFF1')
        // .style('transform', 'scale(1,-1)')

      // let space = 2.5
      // let dimSB = {y: 0, h: dimModifs.h * 0.28}
      // let dimBLC = {y: dimModifs.h * 0.3, h: dimModifs.h * 0.23}
      // let dimProp = {y: dimModifs.h * 0.55, h: dimModifs.h * 0.45}
      // for (var SB in defaultChangeNotification) {
      //   let totalProp = 0
      //   let totalBLC = 0
      //   let currentX = 0
      //   let allBlocks = defaultChangeNotification[SB]
      //   let currentSVG = div.append('svg')
      //     .style('display', 'inline-block')
      //     .style('background', '#ECEFF1')
      //     .style('border', 0 + 'px solid #78909C')
      //     .style('transform', 'scale(1,-1)')
      //     .style('margin-left', space)
      //     .style('margin-right', space)
      //     .attr('height', dimModifs.h)
      //   let rectSB = currentSVG.append('rect')
      //     .attr('x', 0)
      //     .attr('y', dimSB.y)
      //     .attr('height', dimSB.h)
      //     .attr('fill', function (d, i) {
      //       return '#455A64'
      //     })
      //     .attr('stroke', '#78909C')
      //     .attr('stroke-width', 1.8)
      //
      //   for (var BLC in allBlocks) {
      //     let allProp = allBlocks[BLC]
      //     let totProp = 0
      //     let rectBLC = currentSVG.append('rect')
      //       .attr('x', currentX)
      //       .attr('y', dimBLC.y)
      //       .attr('height', dimBLC.h)
      //       .attr('fill', '#bcbcbc')
      //     for (var prop in allProp) {
      //       let currentProp = allProp[prop]
      //       currentSVG.append('rect')
      //         .attr('x', currentX)
      //         .attr('y', dimProp.y)
      //         .attr('height', dimProp.h)
      //         .attr('width', sizeProp)
      //         .attr('fill', '#dddddd')
      //       totProp += 1
      //       totalProp += 1
      //       currentX += (sizeProp + space)
      //     }
      //     rectBLC.attr('width', totProp * (sizeProp + space) - space)
      //     currentX += space
      //     totalBLC += 1
      //   }
      //   let width = totalProp * (sizeProp + space) - space + (totalBLC - 1) * (space)
      //   currentSVG.attr('width', width)
      //   rectSB.attr('width', width)
      //   currentSVG.append('text')
      //     .text(SB)
      //     .attr('x', width * 0.5)
      //     .attr('y', dimSB.h * 0.5)
      //     .style('font-weight', 'bold')
      //     .attr('text-anchor', 'middle')
      //     .style('font-size', dimSB.h * 0.6)
      //     .attr('dy', dimSB.h * 0.35)
      //     .style('pointer-events', 'none')
      //     .attr('fill', '#CFD8DC')
      //     .attr('stroke', 'none')
      // }

      function fillModifDiv (div, modifs, title) {
        let innerDiv = div.append('div')
          .style('margin-bottom', '6px')
          .style('background', '#cccccc')
        innerDiv.append('label')
          .html(title)
          .style('display', 'block')
          .style('color', '#ffffff')
          .style('background', '#000000')
          .style('font-size', 10 + 'px')
        for (var i = 0; i < modifs.length; i++) {
          let modif = modifs[i]
          let lineDiv = innerDiv.append('div')
          lineDiv.append('label')
            .html(modif.prop)
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 10 + 'px')
          lineDiv.append('label')
            .html(':')
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 10 + 'px')
          lineDiv.append('label')
            .html(modif.old)
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 10 + 'px')
          lineDiv.append('label')
            .html('-> ')
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 10 + 'px')
          lineDiv.append('label')
            .html(modif.new)
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 10 + 'px')
        }
      }

      let titleSBModifDiv = titleDiv.append('div')
        .style('display', 'inline-block')
        .style('width', 'calc(50% - 4px)')
        .style('height', '15px')
        .style('background', '#dddddd')
      let titleBLCModifDiv = titleDiv.append('div')
        .style('display', 'inline-block')
        .style('width', 'calc(50% - 4px)')
        .style('height', '15px')
        .style('background', '#acacac')

      for (let SB in defaultChangeNotification) {
        let modifAndBlocks = defaultChangeNotification[SB]
        let parentDiv = div.append('div')
          .attr('id', 'SB_' + SB)
          .style('width', '100%')
        let SBModifDiv = parentDiv.append('div')
          .style('display', 'inline-block')
          .style('width', 'calc(50% - 2px)')
          .style('background', '#aaaaaa')
          .style('vertical-align', 'top')
          .style('border-rigth', '2px solid #ffffff')
        let BLCModifDiv = parentDiv.append('div')
          .style('display', 'inline-block')
          .style('width', 'calc(50% - 2px)')
          .style('border-left', '2px solid #ffffff')

        fillModifDiv(SBModifDiv, modifAndBlocks.modifications, SB)

        for (var BLC in modifAndBlocks.blocks) {
          let allProp = modifAndBlocks.blocks[BLC]
          fillModifDiv(BLCModifDiv, allProp.modifications, BLC)
        }
      }

      let totOffset = 0
      let totScrollHeight = div._groups[0][0].scrollHeight
      let even = 0
      for (let SB in defaultChangeNotification) {
        let setOffsetTo = totOffset
        let scrollHeight = div.select('div#SB_' + SB)._groups[0][0].scrollHeight

        quickDiv.append('div')
          .style('width', '100%')
          .style('height', ((scrollHeight / totScrollHeight) * 100) + '%')
          .style('background', (even % 2 === 1 ? '#dddddd' : '#bbbbbb'))
          .on('mouseover', function () {
            div
              .transition()
              .delay(300)
              .duration(400)
              .on('start', function () {
                div.attr('canInterrupt', false)
              })
              .tween('scroll', function () {
                let that = this
                var i = d3.interpolateNumber(that.scrollTop, setOffsetTo)
                return function (t) { that.scrollTop = i(t) }
              })
              .on('end', function () {
                div.attr('canInterrupt', true)
              })
          })
          .on('mouseout', function () {
            if (div.attr('canInterrupt') === 'true') {
              div.interrupt()
            }
          })
          .on('wheel.zoom', function () {
            d3.event.preventDefault()
            let newScrollTop = div._groups[0][0].scrollTop + d3.event.deltaY
            if (newScrollTop < setOffsetTo) {
              div
                .transition()
                .duration(300)
                .ease(d3.easeLinear)
                .tween('scroll', function () {
                  let that = this
                  var i = d3.interpolateNumber(that.scrollTop, setOffsetTo)
                  return function (t) { that.scrollTop = i(t) }
                })
            } else if ((newScrollTop + div._groups[0][0].clientHeight) > (setOffsetTo + scrollHeight)) {
              div
                .transition()
                .duration(300)
                .ease(d3.easeLinear)
                .tween('scroll', function () {
                  let that = this
                  var i = d3.interpolateNumber(that.scrollTop, (setOffsetTo + scrollHeight - div._groups[0][0].clientHeight))
                  return function (t) { that.scrollTop = i(t) }
                })
            } else {
              div
                .transition()
                .duration(300)
                .ease(d3.easeLinear)
                .tween('scroll', function () {
                  let that = this
                  var i = d3.interpolateNumber(that.scrollTop, newScrollTop)
                  return function (t) { that.scrollTop = i(t) }
                })
            }
          })

        totOffset += scrollHeight
        even += 1
      }

      // let evenSB = 0
      // let evenBLC = 0
      // let evenProp = 0
      // let allLine = 0
      // let sizeProp = 18
      // for (var SB in defaultChangeNotification) {
      //   let allBlocks = defaultChangeNotification[SB]
      //   let totLine = 0
      //   let nbBLC = -1
      //   let svgSB = div.append('label')
      //     .style('margin-top', (evenSB * 8) + (evenBLC * 6) + (evenProp * sizeProp) + dim.y + 'px')
      //
      //   for (var BLC in allBlocks) {
      //     nbBLC += 1
      //     let allProp = allBlocks[BLC]
      //     let totProp = 0
      //     let svgBLC = div.append('label')
      //       .style('margin-top', (evenSB * 8) + (evenBLC * 6) + (evenProp * sizeProp) + dim.y + 'px')
      //
      //     for (var prop in allProp) {
      //       let currentProp = allProp[prop]
      //       div.append('label')
      //         .html(prop)
      //         .style('display', 'block')
      //         // .style('border-radius', '2px')
      //         .style('width', (0.15 * dim.w) + 'px')
      //         .style('height', sizeProp - 2 + 'px')
      //         .style('margin-top', (evenSB * 8) + (evenBLC * 6) + (evenProp * sizeProp) + dim.y + 'px')
      //         .style('margin-left', (0.4 * dim.w) + dim.x + 'px')
      //         .style('background-color', (evenProp % 2 ? '#CFD8DC' : '#CFD8DC'))
      //         .style('color', '#000000')
      //         .style('font-size', 10 + 'px')
      //       div.append('label')
      //         .html(':')
      //         .style('display', 'block')
      //         // .style('border-radius', '2px')
      //         .style('width', (0.025 * dim.w) + 'px')
      //         .style('height', sizeProp - 2 + 'px')
      //         .style('margin-top', (evenSB * 8) + (evenBLC * 6) + (evenProp * sizeProp) + dim.y + 'px')
      //         .style('margin-left', (0.4 * dim.w) + (0.15 * dim.w) + dim.x + 'px')
      //         .style('background-color', (evenProp % 2 ? '#CFD8DC' : '#CFD8DC'))
      //         .style('color', '#000000')
      //         .style('font-size', 10 + 'px')
      //       div.append('label')
      //         .html(currentProp.old)
      //         .style('display', 'block')
      //         // .style('border-radius', '2px')
      //         .style('width', (0.15 * dim.w) + 'px')
      //         .style('height', sizeProp - 2 + 'px')
      //         .style('margin-top', (evenSB * 8) + (evenBLC * 6) + (evenProp * sizeProp) + dim.y + 'px')
      //         .style('margin-left', (0.4 * dim.w) + (0.15 * dim.w) + (0.025 * dim.w) + dim.x + 'px')
      //         .style('background-color', (evenProp % 2 ? '#CFD8DC' : '#CFD8DC'))
      //         .style('color', '#000000')
      //         .style('font-size', 10 + 'px')
      //       div.append('label')
      //         .html('-> ')
      //         .style('display', 'block')
      //         // .style('border-radius', '2px')
      //         .style('width', (0.025 * dim.w) + 'px')
      //         .style('height', sizeProp - 2 + 'px')
      //         .style('margin-top', (evenSB * 8) + (evenBLC * 6) + (evenProp * sizeProp) + dim.y + 'px')
      //         .style('margin-left', (0.4 * dim.w) + (0.15 * dim.w) + (0.15 * dim.w) + (0.025 * dim.w) + dim.x + 'px')
      //         .style('background-color', (evenProp % 2 ? '#CFD8DC' : '#CFD8DC'))
      //         .style('color', '#000000')
      //         .style('font-size', 10 + 'px')
      //       div.append('label')
      //         .html(currentProp.new)
      //         .style('display', 'block')
      //         // .style('border-radius', '2px')
      //         .style('width', (0.15 * dim.w) + 'px')
      //         .style('height', sizeProp - 2 + 'px')
      //         .style('margin-top', (evenSB * 8) + (evenBLC * 6) + (evenProp * sizeProp) + dim.y + 'px')
      //         .style('margin-left', (0.4 * dim.w) + (0.15 * dim.w) + (0.15 * dim.w) + (0.025 * dim.w) + (0.025 * dim.w) + dim.x + 'px')
      //         .style('background-color', (evenProp % 2 ? '#CFD8DC' : '#CFD8DC'))
      //         .style('color', '#000000')
      //         .style('font-size', 10 + 'px')
      //       div.append('label')
      //         .style('display', 'block')
      //         .style('border-radius', '0px 2px 2px 0px')
      //         .style('width', (0.1 * dim.w) + 'px')
      //         .style('height', sizeProp - 2 + 'px')
      //         .style('margin-top', (evenSB * 8) + (evenBLC * 6) + (evenProp * sizeProp) + dim.y + 'px')
      //         .style('margin-left', (0.4 * dim.w) + (0.15 * dim.w) + (0.15 * dim.w) + (0.15 * dim.w) + (0.025 * dim.w) + (0.025 * dim.w) + dim.x + 'px')
      //         .style('background-color', (evenProp % 2 ? '#CFD8DC' : '#CFD8DC'))
      //         .style('color', '#000000')
      //         .style('font-size', 10 + 'px')
      //       totProp += 1
      //       evenProp += 1
      //     }
      //     svgBLC.html(BLC)
      //       .style('display', 'block')
      //       .style('border-radius', '0px 0px 0px 0px')
      //       .style('width', (0.2 * dim.w) + 'px')
      //       .style('height', (totProp * sizeProp) - 2 + 'px')
      //       .style('margin-left', (0.2 * dim.w) + dim.x + 'px')
      //       .style('background-color', (evenBLC % 2 ? '#B0BEC5' : '#B0BEC5'))
      //       .style('color', '#000000')
      //       .style('font-size', 12 + 'px')
      //     evenBLC += 1
      //     totLine += totProp
      //   }
      //   svgSB.html(SB)
      //     .style('display', 'block')
      //     .style('border-radius', '2px 0px 0px 2px')
      //     .style('width', (0.2 * dim.w) + 'px')
      //     .style('height', (totLine * sizeProp) + (6 * nbBLC) - 2 + 'px')
      //     .style('margin-left', (0 * dim.w) + dim.x + 'px')
      //     .style('background-color', (evenSB % 2 ? '#90A4AE' : '#90A4AE'))
      //     .style('color', '#000000')
      //     .style('font-size', 14 + 'px')
      //   evenSB += 1
      // }

      g.append('rect')
        .attr('class', 'bottom-back')
        .attr('x', dimMiddle.x)
        .attr('y', dimMiddle.y - 16)
        .attr('width', dimMiddle.w)
        .attr('height', dimMiddle.h)
        .attr('stroke', '#37474F')
        .attr('stroke-dasharray', [dimMiddle.w * 0.4, dimMiddle.w * 0.2, dimMiddle.w * 0.4, dimMiddle.h + dimMiddle.w + dimMiddle.h])
        .attr('fill', '#ECEFF1')
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 1)
      g.append('text')
        .text(function (data) {
          return 'Conflicts'
        })
        .attr('x', dimMiddle.x + dimMiddle.w * 0.5)
        .attr('y', dimMiddle.y - 12)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 10)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', '#000000')
        .attr('stroke', 'none')
      // g.append('circle')
      //   .attr('cx', dimMiddle.x + dimMiddle.w * 0.5)
      //   .attr('cy', dimMiddle.y + dimMiddle.h * 0.5)
      //   .attr('r', dimMiddle.h * 0.25)
      //   .attr('stroke-width', 8)
      //   .attr('stroke', '#CFD8DC')
      //   .attr('fill', 'none')
      // g.append('line')
      //   .attr('x1', dimMiddle.x + dimMiddle.w * 0.5 + dimMiddle.h * 0.3)
      //   .attr('y1', dimMiddle.y + dimMiddle.h * 0.5 - dimMiddle.h * 0.3)
      //   .attr('x2', dimMiddle.x + dimMiddle.w * 0.5 - dimMiddle.h * 0.3)
      //   .attr('y2', dimMiddle.y + dimMiddle.h * 0.5 + dimMiddle.h * 0.3)
      //   .attr('r', dimMiddle.h * 0.25)
      //   .attr('stroke-width', 8)
      //   .attr('stroke', '#CFD8DC')

      let conflicts = [
        {id: 'c1', type: 'shareTels', blocks: [{id: 'b1(1)'}, {id: 'b2(2)'}, {id: 'b7(0)'}]},
        {id: 'c2', type: 'shareTels', blocks: [{id: 'b9(2)'}, {id: 'b5(4)'}, {id: 'b2(1)'}]},
        {id: 'c3', type: 'shareTels', blocks: [{id: 'b2(5)'}, {id: 'b2(1)'}, {id: 'b7(4)'}, {id: 'b9(3)'}]},
        {id: 'c4', type: 'shareTels', blocks: [{id: 'b3(2)'}, {id: 'b5(3)'}]},
        {id: 'c5', type: 'shareTels', blocks: [{id: 'b5(1)'}, {id: 'b2(1)'}, {id: 'b8(3)'}, {id: 'b9(3)'}]},
        {id: 'c6', type: 'shareTels', blocks: [{id: 'b0(4)'}, {id: 'b3(3)'}, {id: 'b7(4)'}, {id: 'b11(1)'}]}
      ]

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
        for (let j = 0; j < (30 + Math.floor(Math.random() * Math.floor(60))); j++) {
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
        .force('center', d3.forceCenter((dimMiddle.w / 2), (dimMiddle.h / 2)))
        .force('y', d3.forceY(0))
        .force('x', d3.forceX(0))
      simulation.nodes(data.nodes)
      simulation.force('link').links(data.links).distance(function (d) {
        if (d.type === 'short') return 1
        else return 20
      })

      var middleGroup = g.append('g')
        .attr('transform', 'translate(' + dimMiddle.x + ',' + dimMiddle.y + ')')
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
        .attr('fill', '#CFD8DC')
        .attr('stroke', '#000000')// '#ECEFF1')
        .attr('stroke-width', 0.2)

      simulation.on('tick', function () {
        link
          .attr('x1', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(radius, Math.min(dimMiddle.w - radius, d.source.x)) })
          .attr('y1', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(radius, Math.min(dimMiddle.h - radius, d.source.y)) })
          .attr('x2', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(radius, Math.min(dimMiddle.w - radius, d.target.x)) })
          .attr('y2', function (d) { let radius = (d.type === 'conflict' ? bigRadius : smallRadius); return Math.max(radius, Math.min(dimMiddle.h - radius, d.target.y)) })

        node
          .attr('cx', function (d) {
            let radius = (d.type === 'conflict' ? bigRadius : smallRadius)
            d.x = Math.max(radius, Math.min(dimMiddle.w - radius, d.x))
            return d.x
          })
          .attr('cy', function (d) {
            let radius = (d.type === 'conflict' ? bigRadius : smallRadius)
            d.y = Math.max(radius, Math.min(dimMiddle.h - radius, d.y))
            return d.y
          })
      })

      // div.append('input')
      //   //.attr('class', 'formMngrInput')
      //   .attr('type', 'text')
      //   .attr('value', 'none')
      //   .attr('required', 'true')
      //   .style('height', '100%')
      // div.append('textarea')
      //   .attr('class', 'comment')
      //   // .text('This is a test comment')
      //   .style('background-color', '#37474F')
      //   .style('border', 'none')
      //   .style('width', '98.5%')
      //   .style('height', Number(g.attr('height')) * 0.96 + 'px')
      //   .style('margin-top', (evenSB * 8) + (evenBLC * 6) + '1px')
      //   .style('margin-left', '4px')
      //   .style('resize', 'none')
      //   .style('pointer-events', 'none')
    }
    function unselectTab (g) {
      g.select('rect.back')
        .attr('fill', '#546E7A')
        .attr('stroke', '#546E7A')
        .attr('height', Number(g.attr('height')) - 1)
    }
    function selectTab (g) {
      g.select('rect.back')
        .attr('fill', '#ECEFF1')
        .attr('stroke', '#ECEFF1')
        .attr('height', Number(g.attr('height')) + 16)
    }
    function drawDefaultTab (panel) {
      return function (g) {
        g.selectAll('*').remove()
        g.append('rect')
          .attr('class', 'back')
          .attr('x', 3)
          .attr('y', 0)
          // .attr('rx', 4)
          // .attr('ry', 4)
          .attr('width', Number(g.attr('width')) - 6)
          .attr('height', Number(g.attr('height')) - 1)
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
            return 'Schedule 1'
          })
          .attr('x', Number(g.attr('width')) / 2)
          .attr('y', Number(g.attr('height')) / 2)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .style('font-size', Number(g.attr('height')) * 0.6)
          .attr('dy', Number(g.attr('height')) * 0.3)
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
  let svgMiddleInfo = new SvgMiddleInfo()
}
