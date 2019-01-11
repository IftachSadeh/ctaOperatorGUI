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

window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueCreator.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_EventQueue.js' })

window.loadScript({ source: mainScriptTag, script: '/js/utils_panelManager.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_buttonPanel.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_clockEvents.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollTable.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_formManager.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 8
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

  let com = {}
  let svg = {}

  let lenD = {}

  let filters = {states: [], errors: []}
  let tokens = { blockState: {}, blockError: {} }
  let filteredTokens = { blockState: {}, blockError: {} }

  let blockQueue = null
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
    function initBackground () {
      svg.svg
        .style('background', colorTheme.medium.background)
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
    // svg.g
    //   .append('g')
    //   .selectAll('rect')
    //   .data([0])
    //   .enter()
    //   .append('rect')
    //   .attr('x', 0)
    //   .attr('y', 0)
    //   .attr('width', lenD.w[0])
    //   .attr('height', lenD.h[0])
    //   .attr('fill', '#37474F')

    initBackground()

    com.dataIn = dataIn

    svgBlocks.initData(dataIn.data)
    svgEvents.initData(dataIn.data)
    // svgTels.initData(dataIn.data)
    // svgFilterBlocks.initData()
    // svgFilterTels.initData()
    // svgMiddleInfo.initData(dataIn.data)
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

    svgBlocks.updateData(dataIn.data)
    svgEvents.updateData(dataIn.data)
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
  let SvgBlocks = function () {
    // let axis = {}
    let gBlockBox // , gEvents
    let blockBoxData
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.94
      h0 = lenD.h[0] * 0.18 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.015)
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

      blockQueue = new BlockQueueCreator({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          box: blockBoxData,
          background: {
            box: {x: (lenD.w[0] * 0.145), y: 0, w: lenD.w[0] * 0.82, h: blockBoxData.h, marg: blockBoxData.marg},
            fill: colorTheme.dark.background,
            stroke: colorTheme.dark.stroke,
            strokeWidth: 0.1
          },
          colorTheme: colorTheme
        },
        axis: {
          enabled: true,
          g: undefined,
          box: {x: (lenD.w[0] * 0.145), y: blockBoxData.h, w: lenD.w[0] * 0.82, h: 0, marg: blockBoxData.marg},
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
            box: {x: (lenD.w[0] * 0.145), y: blockBoxData.h * 0.45, w: lenD.w[0] * 0.82, h: blockBoxData.h * 0.55, marg: blockBoxData.marg},
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
            box: {x: (lenD.w[0] * 0.145), y: 0, w: lenD.w[0] * 0.82, h: blockBoxData.h * 0.3, marg: blockBoxData.marg},
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
          enabled: true,
          g: undefined,
          box: {x: 0, y: 0, w: lenD.w[0] * 0.12, h: blockBoxData.h, marg: 0},
          filters: []
        },
        timeBars: {
          enabled: true,
          g: undefined,
          box: {x: (lenD.w[0] * 0.145), y: 0, w: lenD.w[0] * 0.82, h: blockBoxData.h, marg: blockBoxData.marg}
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
      blockQueue.init()
      // blockQueue.init({
      //   tag: 'blockQueueDefaultTag',
      //   g: gBlockBox,
      //   box: blockBoxData,
      //   axis: {
      //     enabled: true,
      //     group: {
      //       g: undefined,
      //       box: {x: (lenD.w[0] * 0.145), y: blockBoxData.h, w: lenD.w[0] * 0.82, h: 0, marg: blockBoxData.marg}
      //     },
      //     axis: undefined,
      //     scale: undefined,
      //     domain: [0, 1000],
      //     range: [0,0],
      //     showText: true,
      //     orientation: 'axisTop'
      //   },
      //   blocks: {
      //     enabled: true,
      //     group: {
      //       run: {
      //         g: undefined,
      //         box: {x:(lenD.w[0] * 0.145), y:blockBoxData.h * 0.45, w:lenD.w[0] * 0.82, h:blockBoxData.h * 0.55, marg: blockBoxData.marg}
      //       },
      //       cancel: {
      //         g: undefined,
      //         box: {x:(lenD.w[0] * 0.145), y:0, w:lenD.w[0] * 0.82, h:blockBoxData.h * 0.3, marg: blockBoxData.marg}
      //       }
      //     },
      //     events: {
      //       click: () => {},
      //       mouseover: () => {},
      //       mouseout: () => {}
      //     }
      //   },
      //   filters: {
      //     enabled: true,
      //     group: {
      //       g: undefined,
      //       box: {x:0, y:0, w:lenD.w[0] * 0.12, h:blockBoxData.h, marg: 0}
      //     },
      //     filters: []
      //   },
      //   timeBars: {
      //     enabled: true,
      //     group: {
      //       g: undefined,
      //       box: {x: (lenD.w[0] * 0.145), y:0, w: lenD.w[0] * 0.82, h: blockBoxData.h, marg: blockBoxData.marg}
      //     }
      //   },
      //   data: {
      //     currentTime: {time: 0, date: undefined},
      //     startTime: {time: 0, date: undefined},
      //     endTime: {time: 0, date: undefined},
      //     lastRawData: undefined,
      //     formatedData: undefined
      //   },
      //   debug: {
      //     enabled: false
      //   }
      // })

      updateData(dataIn)
    }
    this.initData = initData

    function updateData (dataIn) {
      let telIds = []
      $.each(dataIn.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      blockQueue.updateData({
        time: {
          currentTime: {date: new Date(dataIn.timeOfNight.date_now), time: Number(dataIn.timeOfNight.now)},
          startTime: {date: new Date(dataIn.timeOfNight.date_start), time: Number(dataIn.timeOfNight.start)},
          endTime: {date: new Date(dataIn.timeOfNight.date_end), time: Number(dataIn.timeOfNight.end)}
        },
        data: {
          raw: {
            blocks: dataIn.blocks,
            telIds: telIds
          },
          modified: []
        }
      })
    }
    this.updateData = updateData
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
      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.94
      h0 = lenD.h[0] * 0.18 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.015)
      y0 = 3 * (lenD.h[0] * 0.022) + lenD.h[0] * 0.18
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

      eventQueue.init({
        tag: 'eventQueueDefaultTag',
        g: gBlockBox,
        box: blockBoxData,
        axis: {
          enabled: true,
          group: {
            g: undefined,
            box: {x:(lenD.w[0] * 0.145), y:0, w: lenD.w[0] * 0.82, h:0, marg: 0}
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
            g: undefined,
            box: {x:(lenD.w[0] * 0.145), y:0, w:lenD.w[0] * 0.82, h:blockBoxData.h, marg: blockBoxData.marg}
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
            box: {x:0, y:0, w:lenD.w[0] * 0.12, h:blockBoxData.h, marg: 0}
          },
          filters: []
        },
        timeBars: {
          enabled: true,
          group: {
            g: undefined,
            box: {x:(lenD.w[0] * 0.145), y:0, w: lenD.w[0] * 0.82, h: blockBoxData.h, marg: marg}
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
  // let SvgTels = function () {
  //   let gBlockBox, blockBoxData
  //   let telsL, telsM, telsS
  //
  //   function initData (dataIn) {
  //     let x0, y0, w0, h0, marg
  //     w0 = lenD.w[0] * 0.83
  //     h0 = lenD.h[0] * 0.2 // h0 *= 2.5;
  //     x0 = (lenD.w[0] * 0.12)
  //     y0 = (lenD.h[0] * 0.78)
  //     marg = w0 * 0.01
  //     blockBoxData = {
  //       x: x0,
  //       y: y0,
  //       w: w0,
  //       h: h0,
  //       marg: marg
  //     }
  //
  //     gBlockBox = svg.g.append('g')
  //     gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
  //     // gBlockBox.append('line')
  //     //   .attr('x1', -1)
  //     //   .attr('y1', blockBoxData.h * 0.4)
  //     //   .attr('x2', blockBoxData.w * 1.04)
  //     //   .attr('y2', blockBoxData.h * 0.4)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //
  //     // gBlockBox.append('line')
  //     //   .attr('x1', -1)
  //     //   .attr('y1', blockBoxData.h * 0.908)
  //     //   .attr('x2', blockBoxData.w * 0.05)
  //     //   .attr('y2', blockBoxData.h * 0.908)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.05)
  //     //   .attr('y1', blockBoxData.h * 0.908 - 6)
  //     //   .attr('x2', blockBoxData.w * 0.05)
  //     //   .attr('y2', blockBoxData.h * 0.908 + 6)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     gBlockBox.append('text')
  //       .text('LSTs')
  //       .attr('x', (blockBoxData.w * 0.08))
  //       .attr('y', (blockBoxData.h * 0.908) + 4)
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 14)
  //
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.11)
  //     //   .attr('y1', blockBoxData.h * 0.908 - 6)
  //     //   .attr('x2', blockBoxData.w * 0.11)
  //     //   .attr('y2', blockBoxData.h * 0.908 + 6)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.11)
  //     //   .attr('y1', blockBoxData.h * 0.908)
  //     //   .attr('x2', blockBoxData.w * 0.37)
  //     //   .attr('y2', blockBoxData.h * 0.908)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.37)
  //     //   .attr('y1', blockBoxData.h * 0.908 - 6)
  //     //   .attr('x2', blockBoxData.w * 0.37)
  //     //   .attr('y2', blockBoxData.h * 0.908 + 6)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     gBlockBox.append('text')
  //       .text('MSTs')
  //       .attr('x', (blockBoxData.w * 0.4))
  //       .attr('y', (blockBoxData.h * 0.908) + 4)
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 14)
  //
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.43)
  //     //   .attr('y1', blockBoxData.h * 0.908 - 6)
  //     //   .attr('x2', blockBoxData.w * 0.43)
  //     //   .attr('y2', blockBoxData.h * 0.908 + 6)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.43)
  //     //   .attr('y1', blockBoxData.h * 0.908)
  //     //   .attr('x2', blockBoxData.w * 0.8)
  //     //   .attr('y2', blockBoxData.h * 0.908)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.8)
  //     //   .attr('y1', blockBoxData.h * 0.908 - 6)
  //     //   .attr('x2', blockBoxData.w * 0.8)
  //     //   .attr('y2', blockBoxData.h * 0.908 + 6)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     gBlockBox.append('text')
  //       .text('SSTs')
  //       .attr('x', (blockBoxData.w * 0.83))
  //       .attr('y', (blockBoxData.h * 0.908) + 4)
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 14)
  //
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.86)
  //     //   .attr('y1', blockBoxData.h * 0.908 - 6)
  //     //   .attr('x2', blockBoxData.w * 0.86)
  //     //   .attr('y2', blockBoxData.h * 0.908 + 6)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.86)
  //     //   .attr('y1', blockBoxData.h * 0.908)
  //     //   .attr('x2', blockBoxData.w * 1.04)
  //     //   .attr('y2', blockBoxData.h * 0.908)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //
  //     telsL = gBlockBox.append('g')
  //     telsM = gBlockBox.append('g')
  //     telsM.attr('transform', 'translate(' + blockBoxData.w * 0.19 + ',' + 0 + ')')
  //     telsS = gBlockBox.append('g')
  //     telsS.attr('transform', 'translate(' + blockBoxData.w * 0.62 + ',' + 0 + ')')
  //
  //     telsL.selectAll('circle.telsL')
  //       .data(com.dataIn.data.telHealth.slice(0, 4), function (d) {
  //         return d.id
  //       })
  //       .enter()
  //       .append('circle')
  //       .attr('class', 'telsL')
  //       .attr('cx', function (d, i) {
  //         return 0 + (36 * ((i % 2) + 1)) + ((i % 2) * 30)
  //       })
  //       .attr('cy', function (d, i) {
  //         return 10 + (36 * (parseInt(i / 2) + 1)) + (parseInt(i / 2) * 30)
  //       })
  //       .attr('r', 26)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.5)
  //       .attr('fill', function (d) {
  //         return telHealthCol(parseInt(d.val))
  //       })
  //     telsM.selectAll('circle.telsM')
  //       .data(com.dataIn.data.telHealth.slice(4, 29), function (d) {
  //         return d.id
  //       })
  //       .enter()
  //       .append('circle')
  //       .attr('class', 'telsM')
  //       .attr('cx', function (d, i) {
  //         let factor = 0
  //         let ii = i
  //         if (i < 8) { factor = 1; ii = i }
  //         else if (i < 17) { factor = 0; ii = i - 8 }
  //         else { factor = 1; ii = i - 17 }
  //         return (20 * factor) + (22 * ((ii % (8 + (1 - factor))) + 1)) + ((ii % (8 + (1 - factor))) * 16)
  //       })
  //       .attr('cy', function (d, i) {
  //         let factor = 0
  //         if (i < 8) factor = 0
  //         else if (i < 17) factor = 1
  //         else factor = 2
  //         return 8 + (28 * (factor + 1)) + (factor * 16)
  //       })
  //       .attr('r', 16)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.5)
  //       .attr('fill', function (d) {
  //         return telHealthCol(parseInt(d.val))
  //       })
  //     telsS.selectAll('circle.telsS')
  //       .data(com.dataIn.data.telHealth.slice(29, 99), function (d) {
  //         return d.id
  //       })
  //       .enter()
  //       .append('circle')
  //       .attr('class', 'telsS')
  //       .attr('cx', function (d, i) {
  //         return 20 + (12 * ((i % 14) + 1)) + ((i % 14) * 10)
  //       })
  //       .attr('cy', function (d, i) {
  //         return 12 + (16 * (parseInt(i / 14) + 1)) + (parseInt(i / 14) * 10)
  //       })
  //       .attr('r', 10)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.5)
  //       .attr('fill', function (d) {
  //         return telHealthCol(parseInt(d.val))
  //       })
  //
  //     updateDataOnce()
  //   }
  //   this.initData = initData
  //
  //   function updateData () {
  //     updateDataOnce()
  //     // if (!locker.isFree('inInit')) {
  //     //   setTimeout(function () {
  //     //     updateData(dataIn)
  //     //   }, 10)
  //     //   return
  //     // }
  //     //
  //     // runLoop.push({ tag: 'updateData', data: dataIn }) //, time:dataIn.emitTime
  //   }
  //   this.updateData = updateData
  //
  //   function updateDataOnce () {
  //     telsL.selectAll('circle.telsL')
  //       .data(com.dataIn.data.telHealth.slice(0, 4), function (d) {
  //         return d.id
  //       })
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('fill', function (d) {
  //         return telHealthCol(parseInt(d.val))
  //       })
  //     telsM.selectAll('circle.telsM')
  //       .data(com.dataIn.data.telHealth.slice(4, 29), function (d) {
  //         return d.id
  //       })
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('fill', function (d) {
  //         return telHealthCol(parseInt(d.val))
  //       })
  //
  //     telsS.selectAll('circle.telsS')
  //       .data(com.dataIn.data.telHealth.slice(29, 99), function (d) {
  //         return d.id
  //       })
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('fill', function (d) {
  //         return telHealthCol(parseInt(d.val))
  //       })
  //   }
  //   // ---------------------------------------------------------------------------------------------------
  // }
  // let SvgFilterBlocks = function () {
  //   let gBlockBox, gBlockInfo, gBlockState, gBlockError
  //   let blockBoxData = {}
  //
  //   function initData (dataIn) {
  //     gBlockBox = svg.g.append('g')
  //
  //     let x0, y0, w0, h0, marg
  //     w0 = lenD.w[0] * 0.099
  //     h0 = lenD.h[0] * 0.48 // h0 *= 2.5;
  //     x0 = (lenD.w[0] * 0.01)
  //     y0 = lenD.h[0] * 0.02
  //     marg = w0 * 0.01
  //     blockBoxData = {
  //       x: x0,
  //       y: y0,
  //       w: w0,
  //       h: h0,
  //       marg: marg
  //     }
  //     gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0)
  //     //   .attr('y1', blockBoxData.h * 0.166)
  //     //   .attr('x2', blockBoxData.w * 0.98)
  //     //   .attr('y2', blockBoxData.h * 0.166)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     gBlockBox.append('line')
  //       .attr('x1', blockBoxData.w * 0.6)
  //       .attr('y1', blockBoxData.h * 0)
  //       .attr('x2', blockBoxData.w * 0.6)
  //       .attr('y2', blockBoxData.h)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 1)
  //     gBlockBox.append('line')
  //       .attr('x1', blockBoxData.w * 0.6)
  //       .attr('y1', blockBoxData.h * 0.2)
  //       .attr('x2', blockBoxData.w * 1.1)
  //       .attr('y2', blockBoxData.h * 0.2)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 1)
  //
  //     gBlockInfo = gBlockBox.append('g')
  //     gBlockState = gBlockBox.append('g')
  //     gBlockError = gBlockBox.append('g')
  //     // gBlockInfo.append('circle')
  //     //   .attr('cx', blockBoxData.w * 0.5)
  //     //   .attr('cy', blockBoxData.h * 0.1)
  //     //   .attr('r', blockBoxData.w * 0.43)
  //     //   .attr('fill', 'none')
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 0.4)
  //     // gBlockInfo.append('circle')
  //     //   .attr('class', 'done')
  //     //   .attr('cx', blockBoxData.w * 0.5)
  //     //   .attr('cy', blockBoxData.h * 0.1)
  //     //   .attr('fill', 'none')
  //     //   .attr('stroke', colsGreens[0])
  //     //   .style('opacity', 0.6)
  //     //   .attr('vector-effect', 'non-scaling-stroke')
  //     // gBlockInfo.append('circle')
  //     //   .attr('class', 'fail')
  //     //   .attr('cx', blockBoxData.w * 0.5)
  //     //   .attr('cy', blockBoxData.h * 0.1)
  //     //   .attr('fill', 'none')
  //     //   .attr('stroke', '#cf1717')
  //     //   .style('opacity', 0.6)
  //     //   .attr('vector-effect', 'non-scaling-stroke')
  //     // gBlockInfo.append('circle')
  //     //   .attr('class', 'cancel')
  //     //   .attr('cx', blockBoxData.w * 0.5)
  //     //   .attr('cy', blockBoxData.h * 0.1)
  //     //   .attr('fill', 'none')
  //     //   .attr('stroke', 'grey')
  //     //   .style('opacity', 0.6)
  //     //   .attr('vector-effect', 'non-scaling-stroke')
  //
  //     gBlockState.attr('transform', 'translate(' + 0 + ',' + -blockBoxData.h * 0.02 + ')')
  //     gBlockState.append('line')
  //       .attr('x1', -10)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5)
  //       .attr('x2', blockBoxData.x - 6)
  //       .attr('y2', (blockBoxData.h * 0.075) - 5)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockState.append('line')
  //       .attr('x1', blockBoxData.x - 6)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5 - 6)
  //       .attr('x2', blockBoxData.x - 6)
  //       .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockState.append('line')
  //       .attr('x2', blockBoxData.x - 6)
  //       .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34)
  //       .attr('x1', blockBoxData.x)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockState.append('line')
  //       .attr('x2', blockBoxData.x)
  //       .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34 - 6)
  //       .attr('x1', blockBoxData.x)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34 + 6)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockState.append('text')
  //       .text('States')
  //       .attr('x', (blockBoxData.w * 0.26))
  //       .attr('y', (blockBoxData.h * 0.075))
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 14)
  //     gBlockState.append('text')
  //       .text('Tot: 0 Bs')
  //       .attr('x', blockBoxData.x + 4)
  //       .attr('y', (blockBoxData.h * 0.075) - 1 + blockBoxData.h * 0.34)
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'start')
  //       .style('font-size', 9)
  //       // .attr('transform', 'rotate(-30)')
  //
  //     gBlockError.attr('transform', 'translate(' + 0 + ',' + blockBoxData.h * 0.42 + ')')
  //     gBlockError.append('line')
  //       .attr('x1', -10)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5)
  //       .attr('x2', blockBoxData.x - 6)
  //       .attr('y2', (blockBoxData.h * 0.075) - 5)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockError.append('line')
  //       .attr('x1', blockBoxData.x - 6)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5 - 6)
  //       .attr('x2', blockBoxData.x - 6)
  //       .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockError.append('line')
  //       .attr('x2', blockBoxData.x - 6)
  //       .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48)
  //       .attr('x1', blockBoxData.x)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockError.append('line')
  //       .attr('x2', blockBoxData.x)
  //       .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48 - 6)
  //       .attr('x1', blockBoxData.x)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48 + 6)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockError.append('text')
  //       .text('Errors')
  //       .attr('x', (blockBoxData.w * 0.26))
  //       .attr('y', (blockBoxData.h * 0.075))
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 14)
  //     gBlockError.append('text')
  //       .text('Tot: 0 Bs')
  //       .attr('x', blockBoxData.x + 4)
  //       .attr('y', (blockBoxData.h * 0.075) - 1 + blockBoxData.h * 0.48)
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'start')
  //       .style('font-size', 9)
  //       // .attr('transform', 'rotate(-30)')
  //     // .append('rect')
  //     // .attr('x', 0)
  //     // .attr('y', 0)
  //     // .attr('width', blockBoxData.w)
  //     // .attr('height', blockBoxData.h)
  //     // .attr('fill', '#000000')s
  //   }
  //   this.initData = initData
  //
  //   function updateData (dataIn) {
  //     updateStateToken()
  //     updateErrorToken()
  //     updateBlockInfo()
  //   }
  //   this.updateData = updateData
  //
  //   function addStateFilter (id, data) {
  //     filters.states.push({id: id, data: data})
  //     blockQueue.addStateFilter(id, data)
  //   }
  //   function removeStateFilter (id, data) {
  //     for (var i = 0; i < filters.states.length; i++) {
  //       if (filters.states[i].id === id) filters.states.splice(i, 1)
  //     }
  //     blockQueue.removeStateFilter(id, data)
  //   }
  //   function addErrorFilter (id, data) {
  //     filters.errors.push({id: id, data: data})
  //     blockQueue.addErrorFilter(id, data)
  //   }
  //   function removeErrorFilter (id, data) {
  //     for (var i = 0; i < filters.errors.length; i++) {
  //       if (filters.errors[i].id === id) filters.errors.splice(i, 1)
  //     }
  //     blockQueue.removeErrorFilter(id, data)
  //   }
  //
  //   function updateStateToken () {
  //     let data = []
  //     for (let key in tokens.blockState) {
  //       if (tokens.blockState.hasOwnProperty(key)) {
  //         data.push({id: key, data: tokens.blockState[key]})
  //       }
  //     }
  //
  //     let circlesGroup = gBlockState
  //       .selectAll('g')
  //       .data(data, function (d) {
  //         return d.id
  //       })
  //
  //     let tokenR = 10
  //     let spaceBetweenToken = 14
  //     let jump = (2 * tokenR) + spaceBetweenToken
  //     // let positions =
  //     // [
  //     //   [(blockBoxData.w / 4)],
  //     //   [(blockBoxData.w / 4) - (spaceBetweenToken / 2) - tokenR, (blockBoxData.w / 4) + (spaceBetweenToken / 2) + tokenR],
  //     //   [(blockBoxData.w / 4), (blockBoxData.w / 4) - (2 * tokenR) - spaceBetweenToken, (blockBoxData.w / 4) + (2 * tokenR) + spaceBetweenToken]
  //     // ]
  //
  //     let circleGroupEnter = circlesGroup.enter().append('g').attr('class', 'group.state').attr('id', function (d) { return widgetId + '-' + d.id })
  //     circleGroupEnter.append('line')
  //       .attr('x1', function (d, i) {
  //         return (blockBoxData.w / 12) + 12
  //       })
  //       .attr('y1', function (d, i) {
  //         return (blockBoxData.h * 0.12) + i * (jump)
  //       })
  //       .attr('x2', function (d, i) {
  //         return blockBoxData.w * 0.6
  //       })
  //       .attr('y2', function (d, i) {
  //         return ((blockBoxData.h * 0.12) + i * (jump))
  //       })
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 0)
  //       .style('stroke-linecap', 'round')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('stroke-width', 0.5)
  //     circleGroupEnter.append('text')
  //       .text(function (d) {
  //         return d.id
  //       })
  //       .attr('x', function (d, i) {
  //         return blockBoxData.w * 0.36
  //       })
  //       .attr('y', function (d, i) {
  //         return ((blockBoxData.h * 0.12) + i * (jump)) - 9 / 4
  //       })
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 9)
  //     circleGroupEnter.append('text')
  //       .attr('class', 'nbBs')
  //       .text(function (d) {
  //         return d.data.length + ' Bs'
  //       })
  //       .attr('x', function (d, i) {
  //         return blockBoxData.w * 0.36
  //       })
  //       .attr('y', function (d, i) {
  //         return ((blockBoxData.h * 0.12) + i * (jump)) + 9
  //       })
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 9)
  //     circleGroupEnter.append('circle')
  //       .style('opacity', 1)
  //       .attr('cx', function (d, i) {
  //         return blockBoxData.w / 12
  //       })
  //       .attr('cy', function (d, i) {
  //         return (blockBoxData.h * 0.12) + i * (jump)
  //       })
  //       .attr('stroke', '#000000')
  //       .attr('fill', '#ffffff')
  //       .attr('fill-opacity', 1)
  //       .style('stroke-opacity', 1)
  //       .attr('stroke-width', 0.5)
  //       .attr('vector-effect', 'non-scaling-stroke')
  //       .attr('r', 12)
  //     circleGroupEnter.append('circle')
  //       .style('opacity', 0.6)
  //       .attr('cx', function (d, i) {
  //         return blockBoxData.w / 12
  //       })
  //       .attr('cy', function (d, i) {
  //         return (blockBoxData.h * 0.12) + i * (jump)
  //       })
  //       .attr('r', 0)
  //       .attr('stroke', '#000000')
  //       .attr('fill', function (d) {
  //         // return 'none'
  //         if (d.id === 'done') return colsGreens[0]
  //         if (d.id === 'fail') return '#cf1717'
  //         if (d.id === 'cancel') return 'grey'
  //       })
  //       .attr('fill-opacity', 1)
  //       .style('stroke-opacity', 1)
  //       .attr('stroke-width', 0.5)
  //       .attr('vector-effect', 'non-scaling-stroke')
  //       .attr('state', 'disabled')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .style('opacity', 0.6)
  //       .attr('r', 12)
  //     // circleGroupEnter.append('circle')
  //     //   .attr('class', 'percentFilter')
  //     //   .attr('cx', function (d, i) {
  //     //     return 0 + blockBoxData.w * 0.6
  //     //   })
  //     //   .attr('cy', function (d, i) {
  //     //     return 0 + ((blockBoxData.h * 0.12) + i * (jump))
  //     //   })
  //     //   .attr('r', 5.5)
  //     //   .attr('height', 12)
  //     //   .attr('stroke', '#000000')
  //     //   .attr('stroke-width', 15.5)
  //     circleGroupEnter.append('rect')
  //       .attr('x', function (d, i) {
  //         return -5 + blockBoxData.w * 0.6
  //       })
  //       .attr('y', function (d, i) {
  //         return -5 + ((blockBoxData.h * 0.12) + i * (jump))
  //       })
  //       .attr('width', 10)
  //       .attr('height', 10)
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 0)
  //       .attr('fill', 'white')
  //       .style('stroke-linecap', 'round')
  //       .on('click', function (d, i) {
  //         if (d3.select(this).attr('state') === 'disabled') {
  //           d3.select(this)
  //             .attr('state', 'enabled')
  //             .transition()
  //             .duration(timeD.animArc)
  //             .attr('fill', '#80dfff')
  //           addStateFilter(d.id, d.data)
  //         } else {
  //           d3.select(this)
  //             .attr('state', 'disabled')
  //             .transition()
  //             .duration(timeD.animArc)
  //             .attr('fill', 'white')
  //           removeStateFilter(d.id, d.data)
  //         }
  //       })
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('stroke-width', 0.5)
  //
  //     let circlesGroupMerge = circleGroupEnter.merge(circlesGroup)
  //     circlesGroupMerge.select('text.nbBs')
  //       .text(function (d) {
  //         return d.data.length + ' Bs'
  //       })
  //     // circlesGroupMerge.select('circle.percentFilter')
  //     //   .transition()
  //     //   .duration(timeD.animArc)
  //     //   .attr('stroke-dasharray', function (d) {
  //     //     let peri = 2 * Math.PI * 5.5
  //     //     let percent = 0
  //     //     if (filteredTokens.blockState[d.id]) percent = filteredTokens.blockState[d.id].length / d.data.length
  //     //     return [peri / 2 * percent, peri * (1 - percent) + (peri / 2 * percent)]
  //     //   })
  //     //   .attr('stroke-dashoffset', function () {
  //     //     let peri = 2 * Math.PI * 5.5
  //     //     return peri * 0.25
  //     //   })
  //
  //     circlesGroup
  //       .exit()
  //       .remove()
  //   }
  //   function updateErrorToken () {
  //     let data = []
  //     for (let key in tokens.blockError) {
  //       if (tokens.blockError.hasOwnProperty(key)) {
  //         data.push({id: key, data: tokens.blockError[key]})
  //       }
  //     }
  //
  //     let circlesGroup = gBlockError
  //       .selectAll('g')
  //       .data(data, function (d) {
  //         return d.id
  //       })
  //
  //     let tokenR = 10
  //     let spaceBetweenToken = 14
  //     let jump = (2 * tokenR) + spaceBetweenToken
  //     // let positions =
  //     // [
  //     //   [(blockBoxData.w / 4)],
  //     //   [(blockBoxData.w / 4) - (spaceBetweenToken / 2) - tokenR, (blockBoxData.w / 4) + (spaceBetweenToken / 2) + tokenR],
  //     //   [(blockBoxData.w / 4), (blockBoxData.w / 4) - (2 * tokenR) - spaceBetweenToken, (blockBoxData.w / 4) + (2 * tokenR) + spaceBetweenToken]
  //     // ]
  //
  //     let circleGroupEnter = circlesGroup.enter().append('g').attr('class', 'group.state').attr('id', function (d) { return widgetId + '-' + d.id })
  //     circleGroupEnter.append('line')
  //       .attr('x1', function (d, i) {
  //         return (blockBoxData.w / 12) + 12
  //       })
  //       .attr('y1', function (d, i) {
  //         return (blockBoxData.h * 0.12) + i * (jump)
  //       })
  //       .attr('x2', function (d, i) {
  //         return blockBoxData.w * 0.6
  //       })
  //       .attr('y2', function (d, i) {
  //         return ((blockBoxData.h * 0.12) + i * (jump))
  //       })
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 0)
  //       .style('stroke-linecap', 'round')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('stroke-width', 0.5)
  //     circleGroupEnter.append('text')
  //       .text(function (d) {
  //         return d.id
  //       })
  //       .attr('x', function (d, i) {
  //         return blockBoxData.w * 0.36
  //       })
  //       .attr('y', function (d, i) {
  //         return ((blockBoxData.h * 0.12) + i * (jump)) - 9 / 4
  //       })
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 9)
  //     circleGroupEnter.append('text')
  //       .attr('class', 'nbBs')
  //       .text(function (d) {
  //         return d.data.length + ' Bs'
  //       })
  //       .attr('x', function (d, i) {
  //         return blockBoxData.w * 0.36
  //       })
  //       .attr('y', function (d, i) {
  //         return ((blockBoxData.h * 0.12) + i * (jump)) + 9
  //       })
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 9)
  //     circleGroupEnter.append('circle')
  //       .style('opacity', 1)
  //       .attr('cx', function (d, i) {
  //         return blockBoxData.w / 12
  //       })
  //       .attr('cy', function (d, i) {
  //         return (blockBoxData.h * 0.12) + i * (jump)
  //       })
  //       .attr('stroke', '#000000')
  //       .attr('fill', '#ffffff')
  //       .attr('fill-opacity', 1)
  //       .style('stroke-opacity', 1)
  //       .attr('stroke-width', 0.5)
  //       .attr('vector-effect', 'non-scaling-stroke')
  //       .attr('r', 12)
  //     circleGroupEnter.append('circle')
  //       .style('opacity', 0.6)
  //       .attr('cx', function (d, i) {
  //         return blockBoxData.w / 12
  //       })
  //       .attr('cy', function (d, i) {
  //         return (blockBoxData.h * 0.12) + i * (jump)
  //       })
  //       .attr('r', 0)
  //       .attr('stroke', '#000000')
  //       .attr('fill', function (d) {
  //         return '#bbbbbb'
  //       })
  //       .attr('fill-opacity', 1)
  //       .style('stroke-opacity', 1)
  //       .attr('stroke-width', 0.5)
  //       .attr('vector-effect', 'non-scaling-stroke')
  //       .attr('state', 'disabled')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .style('opacity', 0.6)
  //       .attr('r', 12)
  //     circleGroupEnter.append('circle')
  //       .attr('class', 'percentFilter')
  //       .attr('cx', function (d, i) {
  //         return 0 + blockBoxData.w * 0.6
  //       })
  //       .attr('cy', function (d, i) {
  //         return 0 + ((blockBoxData.h * 0.12) + i * (jump))
  //       })
  //       .attr('r', 5.5)
  //       .attr('height', 12)
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 15.5)
  //     circleGroupEnter.append('circle')
  //       .attr('cx', function (d, i) {
  //         return 0 + blockBoxData.w * 0.6
  //       })
  //       .attr('cy', function (d, i) {
  //         return 0 + ((blockBoxData.h * 0.12) + i * (jump))
  //       })
  //       .attr('r', 5.5)
  //       .attr('height', 12)
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 0)
  //       .attr('fill', 'white')
  //       .style('stroke-linecap', 'round')
  //       .on('click', function (d, i) {
  //         if (d3.select(this).attr('state') === 'disabled') {
  //           d3.select(this)
  //             .attr('state', 'enabled')
  //             .transition()
  //             .duration(timeD.animArc)
  //             .attr('fill', '#80dfff')
  //           addErrorFilter(d.id, d.data)
  //         } else {
  //           d3.select(this)
  //             .attr('state', 'disabled')
  //             .transition()
  //             .duration(timeD.animArc)
  //             .attr('fill', 'white')
  //           removeErrorFilter(d.id, d.data)
  //         }
  //       })
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('stroke-width', 0.5)
  //
  //     let circlesGroupMerge = circleGroupEnter.merge(circlesGroup)
  //     circlesGroupMerge.select('text.nbBs')
  //       .text(function (d) {
  //         return d.data.length + ' Bs'
  //       })
  //     circlesGroupMerge.select('circle.percentFilter')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('stroke-dasharray', function (d) {
  //         let peri = 2 * Math.PI * 5.5
  //         let percent = 0
  //         if (filteredTokens.blockError[d.id]) percent = filteredTokens.blockError[d.id].length / d.data.length
  //         return [peri / 2 * percent, peri * (1 - percent) + (peri / 2 * percent)]
  //       })
  //       .attr('stroke-dashoffset', function () {
  //         let peri = 2 * Math.PI * 5.5
  //         return peri * 0.25
  //       })
  //
  //     circlesGroup
  //       .exit()
  //       .remove()
  //   }
  //   function updateBlockInfo () {
  //     // let tokens = { blockState: {}, blockError: {} }
  //     // let filteredTokens = { blockState: {}, blockError: {} }
  //     let rayon = blockBoxData.w * 0.44
  //     let total = 0
  //     for (var key in tokens.blockState) {
  //       if (tokens.blockState.hasOwnProperty(key)) {
  //         total += tokens.blockState[key].length
  //       }
  //     }
  //     let totalR = 0
  //     let newStrokeWidth = tokens.blockState['done'] ? rayon * (tokens.blockState['done'].length / total) : 0
  //     gBlockInfo.select('circle.done')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('r', newStrokeWidth / 2)
  //       .attr('stroke-width', newStrokeWidth * 1.6)
  //       .attr('stroke-dasharray', function () {
  //         let peri = 2 * Math.PI * (newStrokeWidth / 2)
  //         let percent = 0
  //         if (filteredTokens.blockState['done']) percent = filteredTokens.blockState['done'].length / tokens.blockState['done'].length
  //         return [peri * percent, peri * (1 - percent)]
  //       })
  //       .attr('stroke-dashoffset', function () {
  //         let peri = 2 * Math.PI * (newStrokeWidth / 2)
  //         return peri * 0.25
  //       })
  //     totalR += newStrokeWidth
  //
  //     newStrokeWidth = tokens.blockState['fail'] ? rayon * (tokens.blockState['fail'].length / total) : 0
  //     gBlockInfo.select('circle.fail')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('r', totalR + newStrokeWidth / 2)
  //       .attr('stroke-width', newStrokeWidth * 1.6)
  //       .attr('stroke-dasharray', function (d) {
  //         let peri = 1 * (2 * Math.PI * (totalR + newStrokeWidth))
  //         let percent = 0
  //         if (filteredTokens.blockState['fail']) percent = filteredTokens.blockState['fail'].length / tokens.blockState['fail'].length
  //         console.log(percent);
  //         return [peri * percent, peri * (1 - percent)]
  //       })
  //       .attr('stroke-dashoffset', function () {
  //         let peri = (2 * Math.PI * (totalR + newStrokeWidth))
  //         return peri * 0.25
  //       })
  //     totalR += newStrokeWidth
  //
  //     newStrokeWidth = tokens.blockState['cancel'] ? rayon * (tokens.blockState['cancel'].length / total) : 0
  //     gBlockInfo.select('circle.cancel')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('r', totalR + newStrokeWidth / 2)
  //       .attr('stroke-width', newStrokeWidth * 1.6)
  //       .attr('stroke-dasharray', function (d) {
  //         let peri = 1 * (2 * Math.PI * (totalR + newStrokeWidth))
  //         let percent = 0
  //         if (filteredTokens.blockState['cancel']) percent = filteredTokens.blockState['cancel'].length / tokens.blockState['cancel'].length
  //         return [peri * percent, peri * (1 - percent)]
  //       })
  //       .attr('stroke-dashoffset', function () {
  //         let peri = 1 * (2 * Math.PI * (totalR + newStrokeWidth))
  //         return peri * 0.25
  //       })
  //     totalR += newStrokeWidth
  //   }
  // }
  // let SvgFilterTels = function () {
  //   let gBlockBox, gBlockInfo, gBlockState, gBlockError
  //   let blockBoxData = {}
  //   let filtersTels = []
  //
  //   function initData (dataIn) {
  //     gBlockBox = svg.g.append('g')
  //
  //     let x0, y0, w0, h0, marg
  //     w0 = lenD.w[0] * 0.099
  //     h0 = lenD.h[0] * 0.21 // h0 *= 2.5;
  //     x0 = (lenD.w[0] * 0.01)
  //     y0 = lenD.h[0] * 0.77
  //     marg = w0 * 0.01
  //     blockBoxData = {
  //       x: x0,
  //       y: y0,
  //       w: w0,
  //       h: h0,
  //       marg: marg
  //     }
  //     gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0)
  //     //   .attr('y1', blockBoxData.h * 0.166)
  //     //   .attr('x2', blockBoxData.w * 0.98)
  //     //   .attr('y2', blockBoxData.h * 0.166)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //     gBlockBox.append('line')
  //       .attr('x1', blockBoxData.w * 0.6)
  //       .attr('y1', blockBoxData.h * 0)
  //       .attr('x2', blockBoxData.w * 0.6)
  //       .attr('y2', blockBoxData.h)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 1)
  //     // gBlockBox.append('line')
  //     //   .attr('x1', blockBoxData.w * 0.6)
  //     //   .attr('y1', blockBoxData.h * 0.96)
  //     //   .attr('x2', blockBoxData.w * 1.1)
  //     //   .attr('y2', blockBoxData.h * 0.96)
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 1)
  //
  //     gBlockState = gBlockBox.append('g')
  //     // gBlockInfo.append('circle')
  //     //   .attr('cx', blockBoxData.w * 0.5)
  //     //   .attr('cy', blockBoxData.h * 0.1)
  //     //   .attr('r', blockBoxData.w * 0.43)
  //     //   .attr('fill', 'none')
  //     //   .attr('stroke', 'black')
  //     //   .attr('stroke-width', 0.4)
  //     // gBlockInfo.append('circle')
  //     //   .attr('class', 'done')
  //     //   .attr('cx', blockBoxData.w * 0.5)
  //     //   .attr('cy', blockBoxData.h * 0.1)
  //     //   .attr('fill', 'none')
  //     //   .attr('stroke', colsGreens[0])
  //     //   .style('opacity', 0.6)
  //     //   .attr('vector-effect', 'non-scaling-stroke')
  //     // gBlockInfo.append('circle')
  //     //   .attr('class', 'fail')
  //     //   .attr('cx', blockBoxData.w * 0.5)
  //     //   .attr('cy', blockBoxData.h * 0.1)
  //     //   .attr('fill', 'none')
  //     //   .attr('stroke', '#cf1717')
  //     //   .style('opacity', 0.6)
  //     //   .attr('vector-effect', 'non-scaling-stroke')
  //     // gBlockInfo.append('circle')
  //     //   .attr('class', 'cancel')
  //     //   .attr('cx', blockBoxData.w * 0.5)
  //     //   .attr('cy', blockBoxData.h * 0.1)
  //     //   .attr('fill', 'none')
  //     //   .attr('stroke', 'grey')
  //     //   .style('opacity', 0.6)
  //     //   .attr('vector-effect', 'non-scaling-stroke')
  //
  //     gBlockState.attr('transform', 'translate(' + 0 + ',' + blockBoxData.h * 0 + ')')
  //     gBlockState.append('line')
  //       .attr('x1', -10)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5)
  //       .attr('x2', blockBoxData.x - 6)
  //       .attr('y2', (blockBoxData.h * 0.075) - 5)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockState.append('line')
  //       .attr('x1', blockBoxData.x - 6)
  //       .attr('y1', (blockBoxData.h * 0.075) - 5 - 6)
  //       .attr('x2', blockBoxData.x - 6)
  //       .attr('y2', blockBoxData.h * 0.96)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockState.append('line')
  //       .attr('x2', blockBoxData.x - 6)
  //       .attr('y2', blockBoxData.h * 0.96)
  //       .attr('x1', blockBoxData.x)
  //       .attr('y1', blockBoxData.h * 0.96)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockState.append('line')
  //       .attr('x2', blockBoxData.x)
  //       .attr('y2', blockBoxData.h * 0.96 - 6)
  //       .attr('x1', blockBoxData.x)
  //       .attr('y1', blockBoxData.h * 0.96 + 6)
  //       .attr('stroke', 'black')
  //       .attr('stroke-width', 0.8)
  //     gBlockState.append('text')
  //       .text('Props')
  //       .attr('x', (blockBoxData.w * 0.26))
  //       .attr('y', (blockBoxData.h * 0.075))
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 14)
  //     gBlockState.append('text')
  //       .text('Tot: 0 Bs')
  //       .attr('x', blockBoxData.x + 4)
  //       .attr('y', blockBoxData.h * 0.96)
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'start')
  //       .style('font-size', 9)
  //       // .attr('transform', 'rotate(-30)')
  //
  //     createPropToken()
  //   }
  //   this.initData = initData
  //
  //   function updateData (dataIn) {
  //     //updateStateToken()
  //   }
  //   this.updateData = updateData
  //
  //   function createPropToken () {
  //     let data = ['Mirror', 'Camera', 'Mount', 'Aux']
  //
  //     let circlesGroup = gBlockState
  //       .selectAll('g')
  //       .data(data, function (d) {
  //         return d.id
  //       })
  //
  //     let tokenR = 10
  //     let spaceBetweenToken = 14
  //     let jump = (2 * tokenR) + spaceBetweenToken
  //     // let positions =
  //     // [
  //     //   [(blockBoxData.w / 4)],
  //     //   [(blockBoxData.w / 4) - (spaceBetweenToken / 2) - tokenR, (blockBoxData.w / 4) + (spaceBetweenToken / 2) + tokenR],
  //     //   [(blockBoxData.w / 4), (blockBoxData.w / 4) - (2 * tokenR) - spaceBetweenToken, (blockBoxData.w / 4) + (2 * tokenR) + spaceBetweenToken]
  //     // ]
  //
  //     let circleGroupEnter = circlesGroup.enter().append('g')
  //       .attr('class', 'group.prop')
  //       .attr('transform', 'translate(' + 0 + ',' + blockBoxData.h * 0.1 + ')')
  //     circleGroupEnter.append('line')
  //       .attr('x1', function (d, i) {
  //         return (blockBoxData.w / 12) + 12
  //       })
  //       .attr('y1', function (d, i) {
  //         return (blockBoxData.h * 0.12) + i * (jump)
  //       })
  //       .attr('x2', function (d, i) {
  //         return blockBoxData.w * 0.6
  //       })
  //       .attr('y2', function (d, i) {
  //         return ((blockBoxData.h * 0.12) + i * (jump))
  //       })
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 0)
  //       .style('stroke-linecap', 'round')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('stroke-width', 0.5)
  //     circleGroupEnter.append('text')
  //       .text(function (d) {
  //         return d.id
  //       })
  //       .attr('x', function (d, i) {
  //         return blockBoxData.w * 0.36
  //       })
  //       .attr('y', function (d, i) {
  //         return ((blockBoxData.h * 0.12) + i * (jump)) - 9 / 4
  //       })
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 9)
  //     circleGroupEnter.append('text')
  //       .attr('class', 'nbBs')
  //       .text(function (d) {
  //         return d
  //       })
  //       .attr('x', function (d, i) {
  //         return blockBoxData.w * 0.36
  //       })
  //       .attr('y', function (d, i) {
  //         return ((blockBoxData.h * 0.12) + i * (jump)) + 9
  //       })
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', 9)
  //     circleGroupEnter.append('circle')
  //       .style('opacity', 1)
  //       .attr('cx', function (d, i) {
  //         return blockBoxData.w / 12
  //       })
  //       .attr('cy', function (d, i) {
  //         return (blockBoxData.h * 0.12) + i * (jump)
  //       })
  //       .attr('stroke', '#000000')
  //       .attr('fill', '#ffffff')
  //       .attr('fill-opacity', 1)
  //       .style('stroke-opacity', 1)
  //       .attr('stroke-width', 0.5)
  //       .attr('vector-effect', 'non-scaling-stroke')
  //       .attr('r', 12)
  //     circleGroupEnter.append('circle')
  //       .style('opacity', 0.6)
  //       .attr('cx', function (d, i) {
  //         return blockBoxData.w / 12
  //       })
  //       .attr('cy', function (d, i) {
  //         return (blockBoxData.h * 0.12) + i * (jump)
  //       })
  //       .attr('r', 0)
  //       .attr('stroke', '#000000')
  //       .attr('fill', function (d) {
  //         return 'none'
  //       })
  //       .attr('fill-opacity', 1)
  //       .style('stroke-opacity', 1)
  //       .attr('stroke-width', 0.5)
  //       .attr('vector-effect', 'non-scaling-stroke')
  //       .attr('state', 'disabled')
  //       .transition()
  //       .duration(timeD.animArc)
  //       .style('opacity', 0.6)
  //       .attr('r', 12)
  //     // circleGroupEnter.append('circle')
  //     //   .attr('class', 'percentFilter')
  //     //   .attr('cx', function (d, i) {
  //     //     return 0 + blockBoxData.w * 0.6
  //     //   })
  //     //   .attr('cy', function (d, i) {
  //     //     return 0 + ((blockBoxData.h * 0.12) + i * (jump))
  //     //   })
  //     //   .attr('r', 5.5)
  //     //   .attr('height', 12)
  //     //   .attr('stroke', '#000000')
  //     //   .attr('stroke-width', 15.5)
  //     circleGroupEnter.append('rect')
  //       .attr('x', function (d, i) {
  //         return -5 + blockBoxData.w * 0.6
  //       })
  //       .attr('y', function (d, i) {
  //         return -5 + ((blockBoxData.h * 0.12) + i * (jump))
  //       })
  //       .attr('width', 10)
  //       .attr('height', 10)
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 0)
  //       .attr('fill', 'white')
  //       .style('stroke-linecap', 'round')
  //       .on('click', function (d, i) {
  //         if (d3.select(this).attr('state') === 'disabled') {
  //           d3.select(this)
  //             .attr('state', 'enabled')
  //             .transition()
  //             .duration(timeD.animArc)
  //             .attr('fill', '#80dfff')
  //           addStateFilter(d.id, d.data)
  //         } else {
  //           d3.select(this)
  //             .attr('state', 'disabled')
  //             .transition()
  //             .duration(timeD.animArc)
  //             .attr('fill', 'white')
  //           removeStateFilter(d.id, d.data)
  //         }
  //       })
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('stroke-width', 0.5)
  //     // circlesGroupMerge.select('circle.percentFilter')
  //     //   .transition()
  //     //   .duration(timeD.animArc)
  //     //   .attr('stroke-dasharray', function (d) {
  //     //     let peri = 2 * Math.PI * 5.5
  //     //     let percent = 0
  //     //     if (filteredTokens.blockState[d.id]) percent = filteredTokens.blockState[d.id].length / d.data.length
  //     //     return [peri / 2 * percent, peri * (1 - percent) + (peri / 2 * percent)]
  //     //   })
  //     //   .attr('stroke-dashoffset', function () {
  //     //     let peri = 2 * Math.PI * 5.5
  //     //     return peri * 0.25
  //     //   })
  //   }
  // }
  let SvgMiddleInfo = function () {
    let gBlockBox, gMiddleBox, gBackPattern
    let blockBoxData = {}
    let panelManager = null
    let currentPanels = []
    let commentPanel

    function createMiddlePanel () {
      panelManager = new PanelManager()
      let optIn = {
        transX: 8,
        transY: 40,
        width: (-40 + blockBoxData.w * 0.93) / 1,
        height: (-20 + blockBoxData.h * 0.91) / 1,
        g: gMiddleBox.append('g'),
        manager: panelManager,
        dragable: {
          general: false,
          tab: false
        },
        closable: true
      }
      let g = gMiddleBox.append('g').attr('transform','translate(60,0)')
      optIn = {
        tag: 'tagDefaultPanelManager',
        g: g,
        box: {
          x: 1000,
          y: 40,
          w: (blockBoxData.w * 0.8),
          h: (-20 + blockBoxData.h * 0.91)
        },
        tab: {
          enabled: true,
          g: g.append('g'),
          box: {
            x: 0,
            y: 0,
            w: 1,
            h: 0.1
          },
          dimension: {w: 0, h: 0},
          dragable: false,
          closable: false
        },
        content: {
          enabled: true,
          g: g.append('g'),
          box: {
            x: 0,
            y: 0.1,
            w: 1,
            h: 0.9
          }
        },
        panels: {
          current: undefined,
          all: []
        },
        options: {
          dragable: false,
          closable: false
        }
      }
      panelManager.init(optIn)

      commentPanel = new CustomPanel()
      commentPanel.setTabProperties('dragable', optIn.dragable)
      commentPanel.setTabProperties('closable', optIn.closable)

      commentPanel.setRepaintPanel(drawCommentDisabled)
      commentPanel.setRepaintTab(drawTabDisabled)

      panelManager.addNewPanel(commentPanel)
      currentPanels.push(commentPanel)

      // backPattern.append('path')
      //   .attr('stroke', '#546E7A')
      //   .attr('fill', '#546E7A')
      //   .attr('stroke-width', 2)
      //   .attr('d', 'M 250 30 L 350 60 L 300 60 L 300 80 L 200 80 L 200 60 L 150 60 L 250 30')
    }
    this.createMiddlePanel = createMiddlePanel

    function createBlockPanels (data) {
      let generalCommentLayout = function (g) {
        let scrollTable = new ScrollTable()
        let formManager = new FormManager()

        let scrollTableData = {
          x: 0,
          y: 0,
          w: Number(g.attr('width')),
          h: Number(g.attr('height')),
          marg: 10
        }
        scrollTable.init({
          tag: 'tagScrollTable1',
          gBox: g,
          canScroll: true,
          useRelativeCoords: true,
          boxData: scrollTableData,
          locker: locker,
          lockerV: [widgetType + 'updateData'],
          lockerZoom: {
            all: tagBlockQueue + 'zoom',
            during: tagBlockQueue + 'zoomDuring',
            end: tagBlockQueue + 'zoomEnd'
          },
          runLoop: runLoop,
          background: '#ECEFF1'
        })

        let innerBox = scrollTable.get('innerBox')
        let table = {
          id: 'xxx',
          x: innerBox.marg,
          y: innerBox.marg,
          marg: innerBox.marg,
          rowW: innerBox.w,
          rowH: innerBox.h / 4,
          rowsIn: []
        }

        // table.rowsIn.push({ h: 9, colsIn: [{id:'01', w:0.3}], marg: innerBox.marg })
        table.rowsIn.push({
          h: 2,
          colsIn: [
            { id: '00', w: 1, title: 'BlockName', disabled: 1, text: data.metaData.blockName }
          ],
          marg: innerBox.marg
        })
        table.rowsIn.push({
          h: 2,
          colsIn: [
            { id: '01', w: 0.5, title: 'State', disabled: 1, text: data.exeState.state },
            { id: '02', w: 0.5, title: 'Schedule', disabled: 1, text: data.startTime + '-' + data.endTime + '(' + data.duration + ')' }
          ],
          marg: innerBox.marg
        })
        table.rowsIn.push({
          h: 2,
          colsIn: [
            { id: '10', w: 1, title: 'Pointing', disabled: 1 }
          ],
          marg: innerBox.marg
        })
        table.rowsIn.push({
          h: 2,
          colsIn: [
            { id: '20', w: 0.333, title: 'Id', disabled: 1, text: data.pointingId },
            { id: '21', w: 0.333, title: 'Name', disabled: 1, text: data.pointingName },
            { id: '22', w: 0.333, title: 'Pos', disabled: 1, text: '' + (data.pointingPos) }
          ],
          marg: innerBox.marg
        })
        table.rowsIn.push({
          h: 2,
          colsIn: [
            { id: '30', w: 1, title: 'Target', disabled: 1 }
          ],
          marg: innerBox.marg
        })
        table.rowsIn.push({
          h: 2,
          colsIn: [
            { id: '40', w: 0.5, title: 'Id', disabled: 1, text: data.targetId },
            { id: '41', w: 0.5, title: 'Position', disabled: 1, text: '' + data.targetPos }
          ],
          marg: innerBox.marg
        })
        scrollTable.updateTable({ table: table })

        let innerG = scrollTable.get('innerG')
        let tagForms = 'tagForeignObject'

        formManager.init({
          tag: 'tagFormManager'
        })
        com.getScaleWH = function () {
          return {
            w: lenD.w[0] / +svg.svg.node().getBoundingClientRect().width,
            h: lenD.h[0] / +svg.svg.node().getBoundingClientRect().height
          }
        }
        $.each(table.recV, function (i, d) {
          formManager.addForm({
            id: d.id,
            data: d,
            selection: innerG,
            formSubFunc: function (optIn) {
              console.log('formSubFunc:', optIn)
            },
            tagForm: tagForms,
            disabled: d.data.disabled ? d.data.disabled : 0,
            getScaleWH: com.getScaleWH,
            background: {
              input: '#ECEFF1',
              title: '#ECEFF1'
            }
          })
        })

        // g.selectAll('*').remove()
        // g.append('rect')
        //   .attr('class', 'back')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('rx', 3)
        //   .attr('ry', 3)
        //   .attr('width', g.attr('width'))
        //   .attr('height', g.attr('height'))
        //   .attr('stroke', '#607D8B')
        //   .attr('fill', '#607D8B')
        //   .attr('stroke-width', 3.5)
        //   .attr('stroke-opacity', 1)
        // let fo = g.append('foreignObject')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('width', g.attr('width'))
        //   .attr('height', g.attr('height'))
        // let div = fo.append('xhtml:div')
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
        // console.log(g);
      }
      let generalTabLayout = function (g) {
        g.selectAll('*').remove()
        g.append('rect')
          .attr('class', 'back')
          .attr('x', 0)
          .attr('y', 0)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('width', g.attr('width'))
          .attr('height', g.attr('height'))
          .attr('fill', '#B0BEC5')
          .attr('stroke-width', 3.5)
          .attr('stroke-opacity', 1)
          .attr('stroke', '#B0BEC5')
        g.append('text')
          .attr('class', 'tabName')
          .text(function (data) {
            return 'General'
          })
          .attr('x', Number(g.attr('width')) / 2)
          .attr('y', Number(g.attr('height')) / 2)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .style('font-size', 18)
          .attr('dy', 9)
          .style('pointer-events', 'none')
          .attr('fill', '#37474F')
          .attr('stroke', 'none')
      }
      let generalCustomPanel = new CustomPanel()
      generalCustomPanel.setTabProperties('dragable', optIn.dragable)
      generalCustomPanel.setTabProperties('closable', optIn.closable)
      generalCustomPanel.bindData({'tabName': 'INFORMATIONS'})
      generalCustomPanel.setRepaintPanel(generalCommentLayout)
      generalCustomPanel.setRepaintTab(generalTabLayout)
      panelManager.addNewPanel(generalCustomPanel)
      currentPanels.push(generalCustomPanel)

      // let tlsCommentLayout = function (g) {
      //   g.selectAll('*').remove()
      //   g.append('rect')
      //     .attr('class', 'back')
      //     .attr('x', 0)
      //     .attr('y', 0)
      //     .attr('rx', 3)
      //     .attr('ry', 3)
      //     .attr('width', g.attr('width'))
      //     .attr('height', g.attr('height'))
      //     .attr('stroke', '#546E7A')
      //     .attr('fill', '#546E7A')
      //     .attr('stroke-width', 3.5)
      //     .attr('stroke-opacity', 1)
      //   let fo = g.append('foreignObject')
      //     .attr('x', 0)
      //     .attr('y', 0)
      //     .attr('width', g.attr('width'))
      //     .attr('height', g.attr('height'))
      //   let div = fo.append('xhtml:div')
      //   div.append('textarea')
      //     .attr('class', 'comment')
      //     // .text('This is a test comment')
      //     .style('background-color', '#37474F')
      //     .style('border', 'none')
      //     .style('width', '98.5%')
      //     .style('height', Number(g.attr('height')) * 0.96 + 'px')
      //     .style('margin-top', '1px')
      //     .style('margin-left', '4px')
      //     .style('resize', 'none')
      //     .style('pointer-events', 'none')
      // }
      // let tlsTabLayout = function (g) {
      //   g.selectAll('*').remove()
      //   g.append('rect')
      //     .attr('class', 'back')
      //     .attr('x', 0)
      //     .attr('y', 0)
      //     .attr('rx', 4)
      //     .attr('ry', 4)
      //     .attr('width', g.attr('width'))
      //     .attr('height', g.attr('height'))
      //     .attr('fill', '#546E7A')
      //     .attr('stroke-width', 3.5)
      //     .attr('stroke-opacity', 1)
      //     .attr('stroke', '#546E7A')
      //   // if (com.tab.closable) {
      //   //   com.tab.g.append('rect')
      //   //     .attr('class', 'close')
      //   //     .attr('x', com.tab.dimension.width - 16)
      //   //     .attr('y', (com.tab.dimension.height / 2) - 8)
      //   //     .attr('rx', 4)
      //   //     .attr('ry', 4)
      //   //     .attr('width', 13)
      //   //     .attr('height', 13)
      //   //     .attr('fill', '#aaaaaa')
      //   // }
      //   g.append('text')
      //     .attr('class', 'tabName')
      //     .text(function (data) {
      //       return 'COMMENTS'
      //     })
      //     .attr('x', Number(g.attr('width')) / 2)
      //     .attr('y', Number(g.attr('height')) / 2)
      //     .style('font-weight', 'bold')
      //     .attr('text-anchor', 'middle')
      //     .style('font-size', 18)
      //     .attr('dy', 9)
      //     .style('pointer-events', 'none')
      //     .attr('fill', '#37474F')
      //     .attr('stroke', 'none')
      // }
      // let tlsCustomPanel = new CustomPanel()
      // tlsCustomPanel.setTabProperties('dragable', optIn.dragable)
      // tlsCustomPanel.setTabProperties('closable', optIn.closable)
      // tlsCustomPanel.bindData({'tabName': 'INFORMATIONS'})
      // tlsCustomPanel.setRepaintPanel(tlsCommentLayout)
      // tlsCustomPanel.setRepaintTab(tlsTabLayout)
      // panelManager.addNewPanel(tlsCustomPanel)
      // currentPanels.push(tlsCustomPanel)
    }
    this.createBlockPanels = createBlockPanels

    function createEventPanels (data) {

    }
    this.createEventPanels = createEventPanels

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
      // commentPanel.callFunInfo(transitionDisabledToEnabled)
      // transitionDisabledToEnabled(commentPanel.getTabProperties('g'), commentPanel.getPanelGroup())
      // commentPanel.setRepaintPanel(drawCommentEnabled)
      // commentPanel.setRepaintTab(drawTabEnabled)
    }
    this.changeFocusElement = changeFocusElement
    function drawCommentDisabled (g) {
      g.selectAll('*').remove()
      g.append('rect')
        .attr('class', 'back')
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('width', g.attr('width'))
        .attr('height', g.attr('height'))
        .attr('stroke', '#546E7A')
        .attr('fill', '#546E7A')
        .attr('stroke-width', 3.5)
        .attr('stroke-opacity', 1)
      let fo = g.append('foreignObject')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', g.attr('width'))
        .attr('height', g.attr('height'))
      let div = fo.append('xhtml:div')
      div.append('textarea')
        .attr('class', 'comment')
        // .text('This is a test comment')
        .style('background-color', '#37474F')
        .style('border', 'none')
        .style('width', '98.5%')
        .style('height', Number(g.attr('height')) * 0.96 + 'px')
        .style('margin-top', '1px')
        .style('margin-left', '4px')
        .style('resize', 'none')
        .style('pointer-events', 'none')
    }
    function drawTabDisabled (g) {
      g.selectAll('*').remove()
      g.append('rect')
        .attr('class', 'back')
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('width', g.attr('width'))
        .attr('height', g.attr('height'))
        .attr('fill', '#546E7A')
        .attr('stroke-width', 3.5)
        .attr('stroke-opacity', 1)
        .attr('stroke', '#546E7A')
      // if (com.tab.closable) {
      //   com.tab.g.append('rect')
      //     .attr('class', 'close')
      //     .attr('x', com.tab.dimension.width - 16)
      //     .attr('y', (com.tab.dimension.height / 2) - 8)
      //     .attr('rx', 4)
      //     .attr('ry', 4)
      //     .attr('width', 13)
      //     .attr('height', 13)
      //     .attr('fill', '#aaaaaa')
      // }
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
        .attr('dy', 9)
        .style('pointer-events', 'none')
        .attr('fill', '#37474F')
        .attr('stroke', 'none')
    }
    // function drawCommentEnabled (g) {
    //   g.append('rect')
    //     .attr('class', 'back')
    //     .attr('x', 0)
    //     .attr('y', 0)
    //     .attr('rx', 3)
    //     .attr('ry', 3)
    //     .attr('width', g.attr('width'))
    //     .attr('height', g.attr('height'))
    //     .attr('fill', '#efefef')
    //     .attr('stroke-width', 1.5)
    //     .attr('stroke-opacity', 1)
    //     .attr('stroke', 'black')
    //   let fo = g.append('foreignObject')
    //     .attr('x', 0)
    //     .attr('y', 0)
    //     .attr('width', g.attr('width'))
    //     .attr('height', g.attr('height'))
    //   let div = fo.append('xhtml:div')
    //   div.append('textarea')
    //     .attr('class', 'comment')
    //     // .text('This is a test comment')
    //     .style('background-color', '#ffffff')
    //     .style('border', 'none')
    //     .style('width', '98%')
    //     .style('height', Number(g.attr('height')) * 0.8 + 'px')
    //     .style('margin-top', '1px')
    //     .style('margin-left', '1px')
    //     .style('resize', 'none')
    // }
    // function transitionDisabledToEnabled (gTab, gPanel) {
    //   gTab.select('rect.back')
    //     .transition()
    //     .duration(400)
    //     .ease(d3.easeLinear)
    //     .attr('fill', '#455A64')
    //     .attr('stroke', '#455A64')
    //   gTab.select('text.tabName')
    //     .transition()
    //     .duration(400)
    //     .ease(d3.easeLinear)
    //     .attr('fill', '#CFD8DC')
    //
    //   gPanel.select('rect.back')
    //     .transition()
    //     .duration(400)
    //     .ease(d3.easeLinear)
    //     .attr('stroke', '#455A64')
    //     .attr('fill', '#455A64')
    //   gPanel.select('textarea.comment')
    //     .transition()
    //     .duration(400)
    //     .ease(d3.easeLinear)
    //     .style('background-color', '#CFD8DC')
    //     .style('pointer-events', 'auto')
    //     // .on('end', function () {
    //     //   commentPanel.setDrawInfo(drawCommentEnabled)
    //     // })
    // }
    // function createCommentPanel () {
    //   return
    //   let panelManager = new PanelManager()
    //   let optIn = {
    //     transX: 475,
    //     transY: 40,
    //     width: (-40 + blockBoxData.w * 0.35) / 1,
    //     height: (-20 + blockBoxData.h * 0.83) / 1,
    //     g: gMiddleBox.append('g'),
    //     manager: panelManager,
    //     dragable: {
    //       general: false,
    //       tab: false
    //     },
    //     closable: false
    //   }
    //   panelManager.init(optIn)
    //
    //   commentPanel = new CustomPanel()
    //   commentPanel.setTabProperties('dragable', optIn.dragable)
    //   commentPanel.setTabProperties('closable', optIn.closable)
    //   commentPanel.bindData({'tabName': 'COMMENTS'})
    //
    //   commentPanel.setRepaintPanel(drawCommentDisabled)
    //   commentPanel.setRepaintTab(drawTabDisabled)
    //
    //   panelManager.addNewPanel(commentPanel)
    // }

    function initData (dataIn) {
      gBlockBox = svg.g.append('g')

      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.96
      h0 = lenD.h[0] * 0.5 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.02)
      y0 = lenD.h[0] * 0.39
      marg = w0 * 0.01
      blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
      gBackPattern = gBlockBox.append('g').attr('transform', 'translate(' + 0 + ',' + 40 + ')')
      gMiddleBox = gBlockBox.append('g').attr('transform', 'translate(' + blockBoxData.w * 0.1 + ',' + 0 + ')')

      gBackPattern.append('rect')
        .attr('x', -3)
        .attr('y', 0)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', 41)
        .attr('height', 30)
        .attr('stroke', '#546E7A')
        .attr('fill', '#546E7A')
        .attr('stroke-width', 3.5)
        .attr('stroke-opacity', 1)
      gBackPattern.append('rect')
        .attr('x', 5)
        .attr('y', 3)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', 24)
        .attr('height', 24)
        .attr('stroke', '#CFD8DC')
        .attr('fill', '#CFD8DC')
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 1)
      gBackPattern.append('svg:image')
        .attr('class', 'icon')
        .attr('xlink:href', '/static/commit.svg')
        .attr('width', 30)
        .attr('height', 30)
        .attr('x', 2)
        .attr('y', 0)

      gBackPattern.append('rect')
        .attr('x', 47)
        .attr('y', 0)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', 68)
        .attr('height', 30)
        .attr('stroke', '#546E7A')
        .attr('fill', '#546E7A')
        .attr('stroke-width', 3.5)
        .attr('stroke-opacity', 1)
      gBackPattern.append('rect')
        .attr('x', 53)
        .attr('y', 3)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', 24)
        .attr('height', 24)
        .attr('stroke', '#000000')
        .attr('fill', '#CFD8DC')
        .attr('stroke-width', 3.5)
        .attr('stroke-opacity', 1)
      gBackPattern.append('svg:image')
        .attr('class', 'icon')
        .attr('xlink:href', '/static/plus.svg')
        .attr('width', 18)
        .attr('height', 18)
        .attr('x', 56)
        .attr('y', 6)
      gBackPattern.append('rect')
        .attr('x', 86)
        .attr('y', 3)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', 24)
        .attr('height', 24)
        .attr('stroke', '#000000')
        .attr('fill', '#CFD8DC')
        .attr('stroke-width', 3.5)
        .attr('stroke-opacity', 1)
      gBackPattern.append('svg:image')
        .attr('class', 'icon')
        .attr('xlink:href', '/static/option.svg')
        .attr('width', 28)
        .attr('height', 28)
        .attr('x', 84)
        .attr('y', 2)

      createMiddlePanel()
      //createCommentPanel()
    }
    this.initData = initData

    function updateData (dataIn) {
    }
    this.updateData = updateData
  }
  let SvgBottomInfo = function () {
    let gBlockBox
    let clockEvents

    function initData (dataIn) {
      gBlockBox = svg.g.append('g')

      let x0, y0, w0, h0
      w0 = lenD.w[0] * 0.96
      h0 = lenD.h[0] * 0.08 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.02)
      y0 = lenD.h[0] * 0.91
      let blockBoxData = {
        x: x0,
        y: y0,
        width: w0,
        height: h0
      }

      clockEvents = new ClockEvents()
      clockEvents.init({
        g: gBlockBox,
        box: blockBoxData,
        colorTheme: colorTheme.medium
      })
      clockEvents.setHour(new Date(com.dataIn.data.timeOfNight.date_now))
      clockEvents.setSendFunction(function (date) {
        blockQueue.addExtraBar(date)
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

  let svgBlocks = new SvgBlocks()
  let svgEvents = new SvgEvents()
  // let svgTels = new SvgTels()
  // let svgFilterBlocks = new SvgFilterBlocks()
  // let svgFilterTels = new SvgFilterTels()
  let svgMiddleInfo = new SvgMiddleInfo()
  let svgBottomInfo = new SvgBottomInfo()
}
