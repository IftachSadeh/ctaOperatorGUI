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
      svg.g = svg.svg.append('g')
    }
    function initBackground () {
      svg.svg
        .style('background', colorTheme.medium.background)
    }
    function initBox () {
      box.blockQueueServer = {
        x: lenD.w[0] * 0,
        y: lenD.h[0] * 0,
        w: lenD.w[0] * 0.45,
        h: lenD.h[0] * 0.25,
        marg: lenD.w[0] * 0.01
      }
      box.eventQueueServer = {
        x: lenD.w[0] * 0,
        y: lenD.h[0] * 0.25,
        w: lenD.w[0] * 0.45,
        h: lenD.h[0] * 0.25,
        marg: lenD.w[0] * 0.01
      }
      box.telescopes = {
        x: lenD.w[0] * 0,
        y: lenD.h[0] * 0.5,
        w: lenD.w[0] * 0.5,
        h: lenD.h[0] * 0.5,
        marg: lenD.w[0] * 0.01
      }
      box.textEditor = {
        x: lenD.w[0] * 0.55,
        y: lenD.h[0] * 0.0,
        w: lenD.w[0] * 0.45,
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
        .text('CURRENT SCHEDULE')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-5,' + (box.blockQueueServer.h * 0.5) + ') rotate(270)')

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
            box: {x: 0, y: adjustedBox.h * 0.46875, w: adjustedBox.w, h: adjustedBox.h * 0.53125, marg: adjustedBox.marg},
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
            box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h * 0.3125, marg: adjustedBox.marg},
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
          enabled: false,
          g: undefined,
          box: {x: 0, y: adjustedBox.h * 0.15, w: adjustedBox * 0.12, h: adjustedBox.h * 0.7, marg: 0},
          filters: []
        },
        timeBars: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
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
          enabled: false,
          group: {
            g: undefined,
            box: {x: 0, y: 0, w: adjustedBox.w * 0.12, h: adjustedBox.h, marg: 0}
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
      reserved.view.main.g.append('rect')
        .attr('x', reserved.view.main.box.x)
        .attr('y', reserved.view.main.box.y)
        .attr('width', reserved.view.main.box.w)
        .attr('height', reserved.view.main.box.h)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
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
      reserved.gBlockBox.append('rect')
        .attr('x', reserved.adjustedBox.x)
        .attr('y', reserved.adjustedBox.y)
        .attr('width', reserved.adjustedBox.w)
        .attr('height', reserved.adjustedBox.h)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      reserved.view = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: box.telescopes.marg * 2,
            y: box.telescopes.marg * 2,
            w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
            h: box.telescopes.h * 0.9 - 4 * box.telescopes.marg,
            marg: box.telescopes.marg
          }
        }
      }

      reserved.plot = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: box.telescopes.w * 0.5 + box.telescopes.marg * 2,
            y: box.telescopes.marg * 2,
            w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
            h: box.telescopes.h * 0.9 - 4 * box.telescopes.marg,
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
      //   .attr('transform', 'translate(4,' + (box.freeTels.h * 0.5) + ') rotate(270)')
      // reserved.telsBox = reserved.gBlockBox.append('g')
      //   .attr('transform', 'translate(' + box.freeTels.marg + ',0)')
      dummy()
    }
    this.initData = initData
    function updateData (dataIn) {}
    this.updateData = updateData
  }
  let SvgTextEditor = function () {
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
      reserved.view.main.g.append('rect')
        .attr('x', reserved.view.main.box.x)
        .attr('y', reserved.view.main.box.y)
        .attr('width', reserved.view.main.box.w)
        .attr('height', reserved.view.main.box.h)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
    }
    function initData (dataIn) {
      reserved.adjustedBox = {
        x: box.textEditor.marg,
        y: box.textEditor.marg,
        w: box.textEditor.w - 2 * box.textEditor.marg,
        h: box.textEditor.h - 2 * box.textEditor.marg,
        marg: box.textEditor.marg
      }
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.textEditor.x + ',' + box.textEditor.y + ')')
      reserved.gBlockBox.append('rect')
        .attr('x', reserved.adjustedBox.x)
        .attr('y', reserved.adjustedBox.y)
        .attr('width', reserved.adjustedBox.w)
        .attr('height', reserved.adjustedBox.h)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      reserved.view = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: box.telescopes.marg * 2,
            y: box.telescopes.marg * 2,
            w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
            h: box.telescopes.h * 0.9 - 4 * box.telescopes.marg,
            marg: box.telescopes.marg
          }
        }
      }

      reserved.plot = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: box.telescopes.w * 0.5 + box.telescopes.marg * 2,
            y: box.telescopes.marg * 2,
            w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
            h: box.telescopes.h * 0.9 - 4 * box.telescopes.marg,
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
      //   .attr('transform', 'translate(4,' + (box.freeTels.h * 0.5) + ') rotate(270)')
      // reserved.telsBox = reserved.gBlockBox.append('g')
      //   .attr('transform', 'translate(' + box.freeTels.marg + ',0)')
      // dummy()
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
