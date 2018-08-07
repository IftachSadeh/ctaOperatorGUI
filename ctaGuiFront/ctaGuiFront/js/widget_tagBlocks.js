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
var mainScriptTag = 'tagBlocks'
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
/* global BlockQueueModif */
/* global bckPattern */
/* global telHealthCol */
/* global colsPurplesBlues */
/* global colsYellows */
/* global colsReds */
/* global colsGreens */
/* global colPrime */
/* global Locker */
/* global appendToDom */
/* global runWhenReady */

window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueModif.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 12
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = { SockFunc: sockTagBlocks, MainFunc: mainTagBlocks }
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
let sockTagBlocks = function (optIn) {
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
  //     "methodName":"tagBlocksAskTelData",
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
let mainTagBlocks = function (optIn) {
  // let myUniqueId = unique()
  let widgetType = optIn.widgetType
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

  let blockQueue = new BlockQueue()

  // let thisTagBlocks = this
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
      .attr('fill', '#ffffff')

    com.dataIn = dataIn

    svgBlocks.initData(dataIn.data)
    svgTels.initData(dataIn.data)
    svgFilterBlocks.initData()
    svgFilterTels.initData()
    svgMiddleInfo.initData()
  }
  this.initData = initData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateData (dataIn) {
    com.dataIn = dataIn

    clusterData(com.dataIn.data)
    filterData(com.dataIn.data)
    svgBlocks.updateData(dataIn.data)
    svgTels.updateData(dataIn.data)
    svgFilterBlocks.updateData(dataIn.data)
    svgMiddleInfo.updateData(dataIn.data)
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
    // let thisMain = this

    let tagTagBlocks = widgetType
    let tagBlockQueue = 'blockQueue'

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      // ---------------------------------------------------------------------------------------------------
      // create the main svg element
      // ---------------------------------------------------------------------------------------------------
      // the background grid
      // bckPattern({
      //   com: com,
      //   gNow: svg.g,
      //   gTag: 'hex',
      //   lenWH: [lenD.w[0], lenD.h[0]],
      //   opac: 0.1,
      //   hexR: 15
      // })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let x0, y0, w0, h0, marg
      let gBlockBox = svg.g.append('g')

      w0 = lenD.w[0] * 0.83
      h0 = lenD.h[0] * 0.2 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.12)
      y0 = (lenD.h[0] * 0.02)
      marg = w0 * 0.01
      let blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      blockQueue.init({
        tag: tagBlockQueue,
        gBox: gBlockBox,
        boxData: blockBoxData,

        doPhase: false,
        click: function (d) {
          svgMiddleInfo.blockFocus(d.data)
        },
        // mouseover: function (d) {
        //   svgMiddleInfo.blockPreview(d.data)
        // },
        // mouseout: function () {
        //   svgMiddleInfo.cleanPreview()
        // },

        verticalScroll: false,
        horizontalScroll: false,
        mainShift: 'timeBar',

        hasAxis: true,

        locker: locker,
        lockerV: [tagTagBlocks + 'updateData'],
        lockerZoom: {
          all: tagBlockQueue + 'zoom',
          during: tagBlockQueue + 'zoomDuring',
          end: tagBlockQueue + 'zoomEnd'
        },
        runLoop: runLoop
      })

      // ---------------------------------------------------------------------------------------------------

      // w0 = blockBoxData.w
      // x0 = blockBoxData.x
      // y0 = blockBoxData.y + blockBoxData.h + blockBoxData.x
      // h0 = lenD.h[0] - y0 - blockBoxData.x
      // marg = blockBoxData.marg * 2

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      updateDataOnce(dataIn)

      runWhenReady({
        pass: function () {
          return locker.isFree(tagTagBlocks + 'updateData')
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
    runLoop.init({ tag: 'updateData', func: updateDataOnce, nKeep: 1 })

    function updateData (dataIn) {
      if (!locker.isFree('inInit')) {
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }

      runLoop.push({ tag: 'updateData', data: dataIn }) //, time:dataIn.emitTime
    }
    this.updateData = updateData

    function updateDataOnce (dataIn) {
      if (
        !locker.isFreeV([
          tagTagBlocks + 'updateData',
          tagBlockQueue + 'zoom'
        ])
      ) {
        // console.log('will delay updateRecData',locker.getActiveV([tagTagBlocks+"updateDataOnce", tagBlockQueue+"_zoom"]));
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }
      locker.add(tagTagBlocks + 'updateData')

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let telIds = []
      let telHealth = {}
      $.each(dataIn.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
        telHealth[dataNow.id] = dataNow.val
      })
      blockQueue.set({ tag: 'telIds', data: telIds })
      blockQueue.set({ tag: 'time', data: dataIn.timeOfNight })
      blockQueue.update(dataIn.blocks)

      locker.remove(tagTagBlocks + 'updateData')
    }
    // ---------------------------------------------------------------------------------------------------
  }
  let SvgTels = function () {
    let gBlockBox, blockBoxData
    let telsL, telsM, telsS

    function initData (dataIn) {
      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.83
      h0 = lenD.h[0] * 0.2 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.12)
      y0 = (lenD.h[0] * 0.78)
      marg = w0 * 0.01
      blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      gBlockBox = svg.g.append('g')
      gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
      // gBlockBox.append('line')
      //   .attr('x1', -1)
      //   .attr('y1', blockBoxData.h * 0.4)
      //   .attr('x2', blockBoxData.w * 1.04)
      //   .attr('y2', blockBoxData.h * 0.4)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)

      // gBlockBox.append('line')
      //   .attr('x1', -1)
      //   .attr('y1', blockBoxData.h * 0.908)
      //   .attr('x2', blockBoxData.w * 0.05)
      //   .attr('y2', blockBoxData.h * 0.908)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.05)
      //   .attr('y1', blockBoxData.h * 0.908 - 6)
      //   .attr('x2', blockBoxData.w * 0.05)
      //   .attr('y2', blockBoxData.h * 0.908 + 6)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      gBlockBox.append('text')
        .text('LSTs')
        .attr('x', (blockBoxData.w * 0.08))
        .attr('y', (blockBoxData.h * 0.908) + 4)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 14)

      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.11)
      //   .attr('y1', blockBoxData.h * 0.908 - 6)
      //   .attr('x2', blockBoxData.w * 0.11)
      //   .attr('y2', blockBoxData.h * 0.908 + 6)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.11)
      //   .attr('y1', blockBoxData.h * 0.908)
      //   .attr('x2', blockBoxData.w * 0.37)
      //   .attr('y2', blockBoxData.h * 0.908)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.37)
      //   .attr('y1', blockBoxData.h * 0.908 - 6)
      //   .attr('x2', blockBoxData.w * 0.37)
      //   .attr('y2', blockBoxData.h * 0.908 + 6)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      gBlockBox.append('text')
        .text('MSTs')
        .attr('x', (blockBoxData.w * 0.4))
        .attr('y', (blockBoxData.h * 0.908) + 4)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 14)

      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.43)
      //   .attr('y1', blockBoxData.h * 0.908 - 6)
      //   .attr('x2', blockBoxData.w * 0.43)
      //   .attr('y2', blockBoxData.h * 0.908 + 6)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.43)
      //   .attr('y1', blockBoxData.h * 0.908)
      //   .attr('x2', blockBoxData.w * 0.8)
      //   .attr('y2', blockBoxData.h * 0.908)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.8)
      //   .attr('y1', blockBoxData.h * 0.908 - 6)
      //   .attr('x2', blockBoxData.w * 0.8)
      //   .attr('y2', blockBoxData.h * 0.908 + 6)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      gBlockBox.append('text')
        .text('SSTs')
        .attr('x', (blockBoxData.w * 0.83))
        .attr('y', (blockBoxData.h * 0.908) + 4)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 14)

      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.86)
      //   .attr('y1', blockBoxData.h * 0.908 - 6)
      //   .attr('x2', blockBoxData.w * 0.86)
      //   .attr('y2', blockBoxData.h * 0.908 + 6)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.86)
      //   .attr('y1', blockBoxData.h * 0.908)
      //   .attr('x2', blockBoxData.w * 1.04)
      //   .attr('y2', blockBoxData.h * 0.908)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)

      telsL = gBlockBox.append('g')
      telsM = gBlockBox.append('g')
      telsM.attr('transform', 'translate(' + blockBoxData.w * 0.19 + ',' + 0 + ')')
      telsS = gBlockBox.append('g')
      telsS.attr('transform', 'translate(' + blockBoxData.w * 0.62 + ',' + 0 + ')')

      telsL.selectAll('circle.telsL')
        .data(com.dataIn.data.telHealth.slice(0, 4), function (d) {
          return d.id
        })
        .enter()
        .append('circle')
        .attr('class', 'telsL')
        .attr('cx', function (d, i) {
          return 0 + (36 * ((i % 2) + 1)) + ((i % 2) * 30)
        })
        .attr('cy', function (d, i) {
          return 10 + (36 * (parseInt(i / 2) + 1)) + (parseInt(i / 2) * 30)
        })
        .attr('r', 26)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5)
        .attr('fill', function (d) {
          return telHealthCol(parseInt(d.val))
        })
      telsM.selectAll('circle.telsM')
        .data(com.dataIn.data.telHealth.slice(4, 29), function (d) {
          return d.id
        })
        .enter()
        .append('circle')
        .attr('class', 'telsM')
        .attr('cx', function (d, i) {
          let factor = 0
          let ii = i
          if (i < 8) { factor = 1; ii = i }
          else if (i < 17) { factor = 0; ii = i - 8 }
          else { factor = 1; ii = i - 17 }
          return (20 * factor) + (22 * ((ii % (8 + (1 - factor))) + 1)) + ((ii % (8 + (1 - factor))) * 16)
        })
        .attr('cy', function (d, i) {
          let factor = 0
          if (i < 8) factor = 0
          else if (i < 17) factor = 1
          else factor = 2
          return 8 + (28 * (factor + 1)) + (factor * 16)
        })
        .attr('r', 16)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5)
        .attr('fill', function (d) {
          return telHealthCol(parseInt(d.val))
        })
      telsS.selectAll('circle.telsS')
        .data(com.dataIn.data.telHealth.slice(29, 99), function (d) {
          return d.id
        })
        .enter()
        .append('circle')
        .attr('class', 'telsS')
        .attr('cx', function (d, i) {
          return 20 + (12 * ((i % 14) + 1)) + ((i % 14) * 10)
        })
        .attr('cy', function (d, i) {
          return 12 + (16 * (parseInt(i / 14) + 1)) + (parseInt(i / 14) * 10)
        })
        .attr('r', 10)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5)
        .attr('fill', function (d) {
          return telHealthCol(parseInt(d.val))
        })

      updateDataOnce()
    }
    this.initData = initData

    function updateData () {
      updateDataOnce()
      // if (!locker.isFree('inInit')) {
      //   setTimeout(function () {
      //     updateData(dataIn)
      //   }, 10)
      //   return
      // }
      //
      // runLoop.push({ tag: 'updateData', data: dataIn }) //, time:dataIn.emitTime
    }
    this.updateData = updateData

    function updateDataOnce () {
      telsL.selectAll('circle.telsL')
        .data(com.dataIn.data.telHealth.slice(0, 4), function (d) {
          return d.id
        })
        .transition()
        .duration(timeD.animArc)
        .attr('fill', function (d) {
          return telHealthCol(parseInt(d.val))
        })
      telsM.selectAll('circle.telsM')
        .data(com.dataIn.data.telHealth.slice(4, 29), function (d) {
          return d.id
        })
        .transition()
        .duration(timeD.animArc)
        .attr('fill', function (d) {
          return telHealthCol(parseInt(d.val))
        })

      telsS.selectAll('circle.telsS')
        .data(com.dataIn.data.telHealth.slice(29, 99), function (d) {
          return d.id
        })
        .transition()
        .duration(timeD.animArc)
        .attr('fill', function (d) {
          return telHealthCol(parseInt(d.val))
        })
    }
    // ---------------------------------------------------------------------------------------------------
  }
  let SvgFilterBlocks = function () {
    let gBlockBox, gBlockInfo, gBlockState, gBlockError
    let blockBoxData = {}

    function initData (dataIn) {
      gBlockBox = svg.g.append('g')

      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.099
      h0 = lenD.h[0] * 0.48 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.01)
      y0 = lenD.h[0] * 0.02
      marg = w0 * 0.01
      blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0)
      //   .attr('y1', blockBoxData.h * 0.166)
      //   .attr('x2', blockBoxData.w * 0.98)
      //   .attr('y2', blockBoxData.h * 0.166)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      gBlockBox.append('line')
        .attr('x1', blockBoxData.w * 0.6)
        .attr('y1', blockBoxData.h * 0)
        .attr('x2', blockBoxData.w * 0.6)
        .attr('y2', blockBoxData.h)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
      gBlockBox.append('line')
        .attr('x1', blockBoxData.w * 0.6)
        .attr('y1', blockBoxData.h * 0.2)
        .attr('x2', blockBoxData.w * 1.1)
        .attr('y2', blockBoxData.h * 0.2)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)

      gBlockInfo = gBlockBox.append('g')
      gBlockState = gBlockBox.append('g')
      gBlockError = gBlockBox.append('g')
      // gBlockInfo.append('circle')
      //   .attr('cx', blockBoxData.w * 0.5)
      //   .attr('cy', blockBoxData.h * 0.1)
      //   .attr('r', blockBoxData.w * 0.43)
      //   .attr('fill', 'none')
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 0.4)
      // gBlockInfo.append('circle')
      //   .attr('class', 'done')
      //   .attr('cx', blockBoxData.w * 0.5)
      //   .attr('cy', blockBoxData.h * 0.1)
      //   .attr('fill', 'none')
      //   .attr('stroke', colsGreens[0])
      //   .style('opacity', 0.6)
      //   .attr('vector-effect', 'non-scaling-stroke')
      // gBlockInfo.append('circle')
      //   .attr('class', 'fail')
      //   .attr('cx', blockBoxData.w * 0.5)
      //   .attr('cy', blockBoxData.h * 0.1)
      //   .attr('fill', 'none')
      //   .attr('stroke', '#cf1717')
      //   .style('opacity', 0.6)
      //   .attr('vector-effect', 'non-scaling-stroke')
      // gBlockInfo.append('circle')
      //   .attr('class', 'cancel')
      //   .attr('cx', blockBoxData.w * 0.5)
      //   .attr('cy', blockBoxData.h * 0.1)
      //   .attr('fill', 'none')
      //   .attr('stroke', 'grey')
      //   .style('opacity', 0.6)
      //   .attr('vector-effect', 'non-scaling-stroke')

      gBlockState.attr('transform', 'translate(' + 0 + ',' + -blockBoxData.h * 0.02 + ')')
      gBlockState.append('line')
        .attr('x1', -10)
        .attr('y1', (blockBoxData.h * 0.075) - 5)
        .attr('x2', blockBoxData.x - 6)
        .attr('y2', (blockBoxData.h * 0.075) - 5)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockState.append('line')
        .attr('x1', blockBoxData.x - 6)
        .attr('y1', (blockBoxData.h * 0.075) - 5 - 6)
        .attr('x2', blockBoxData.x - 6)
        .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockState.append('line')
        .attr('x2', blockBoxData.x - 6)
        .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34)
        .attr('x1', blockBoxData.x)
        .attr('y1', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockState.append('line')
        .attr('x2', blockBoxData.x)
        .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34 - 6)
        .attr('x1', blockBoxData.x)
        .attr('y1', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.34 + 6)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockState.append('text')
        .text('States')
        .attr('x', (blockBoxData.w * 0.26))
        .attr('y', (blockBoxData.h * 0.075))
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 14)
      gBlockState.append('text')
        .text('Tot: 0 Bs')
        .attr('x', blockBoxData.x + 4)
        .attr('y', (blockBoxData.h * 0.075) - 1 + blockBoxData.h * 0.34)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'start')
        .style('font-size', 9)
        // .attr('transform', 'rotate(-30)')

      gBlockError.attr('transform', 'translate(' + 0 + ',' + blockBoxData.h * 0.42 + ')')
      gBlockError.append('line')
        .attr('x1', -10)
        .attr('y1', (blockBoxData.h * 0.075) - 5)
        .attr('x2', blockBoxData.x - 6)
        .attr('y2', (blockBoxData.h * 0.075) - 5)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockError.append('line')
        .attr('x1', blockBoxData.x - 6)
        .attr('y1', (blockBoxData.h * 0.075) - 5 - 6)
        .attr('x2', blockBoxData.x - 6)
        .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockError.append('line')
        .attr('x2', blockBoxData.x - 6)
        .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48)
        .attr('x1', blockBoxData.x)
        .attr('y1', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockError.append('line')
        .attr('x2', blockBoxData.x)
        .attr('y2', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48 - 6)
        .attr('x1', blockBoxData.x)
        .attr('y1', (blockBoxData.h * 0.075) - 5 + blockBoxData.h * 0.48 + 6)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockError.append('text')
        .text('Errors')
        .attr('x', (blockBoxData.w * 0.26))
        .attr('y', (blockBoxData.h * 0.075))
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 14)
      gBlockError.append('text')
        .text('Tot: 0 Bs')
        .attr('x', blockBoxData.x + 4)
        .attr('y', (blockBoxData.h * 0.075) - 1 + blockBoxData.h * 0.48)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'start')
        .style('font-size', 9)
        // .attr('transform', 'rotate(-30)')
      // .append('rect')
      // .attr('x', 0)
      // .attr('y', 0)
      // .attr('width', blockBoxData.w)
      // .attr('height', blockBoxData.h)
      // .attr('fill', '#000000')s
    }
    this.initData = initData

    function updateData (dataIn) {
      updateStateToken()
      updateErrorToken()
      updateBlockInfo()
    }
    this.updateData = updateData

    function addStateFilter (id, data) {
      filters.states.push({id: id, data: data})
      blockQueue.addStateFilter(id, data)
    }
    function removeStateFilter (id, data) {
      for (var i = 0; i < filters.states.length; i++) {
        if (filters.states[i].id === id) filters.states.splice(i, 1)
      }
      blockQueue.removeStateFilter(id, data)
    }
    function addErrorFilter (id, data) {
      filters.errors.push({id: id, data: data})
      blockQueue.addErrorFilter(id, data)
    }
    function removeErrorFilter (id, data) {
      for (var i = 0; i < filters.errors.length; i++) {
        if (filters.errors[i].id === id) filters.errors.splice(i, 1)
      }
      blockQueue.removeErrorFilter(id, data)
    }

    function updateStateToken () {
      let data = []
      for (let key in tokens.blockState) {
        if (tokens.blockState.hasOwnProperty(key)) {
          data.push({id: key, data: tokens.blockState[key]})
        }
      }

      let circlesGroup = gBlockState
        .selectAll('g')
        .data(data, function (d) {
          return d.id
        })

      let tokenR = 10
      let spaceBetweenToken = 14
      let jump = (2 * tokenR) + spaceBetweenToken
      // let positions =
      // [
      //   [(blockBoxData.w / 4)],
      //   [(blockBoxData.w / 4) - (spaceBetweenToken / 2) - tokenR, (blockBoxData.w / 4) + (spaceBetweenToken / 2) + tokenR],
      //   [(blockBoxData.w / 4), (blockBoxData.w / 4) - (2 * tokenR) - spaceBetweenToken, (blockBoxData.w / 4) + (2 * tokenR) + spaceBetweenToken]
      // ]

      let circleGroupEnter = circlesGroup.enter().append('g').attr('class', 'group.state').attr('id', function (d) { return widgetId + '-' + d.id })
      circleGroupEnter.append('line')
        .attr('x1', function (d, i) {
          return (blockBoxData.w / 12) + 12
        })
        .attr('y1', function (d, i) {
          return (blockBoxData.h * 0.12) + i * (jump)
        })
        .attr('x2', function (d, i) {
          return blockBoxData.w * 0.6
        })
        .attr('y2', function (d, i) {
          return ((blockBoxData.h * 0.12) + i * (jump))
        })
        .attr('stroke', '#000000')
        .attr('stroke-width', 0)
        .style('stroke-linecap', 'round')
        .transition()
        .duration(timeD.animArc)
        .attr('stroke-width', 0.5)
      circleGroupEnter.append('text')
        .text(function (d) {
          return d.id
        })
        .attr('x', function (d, i) {
          return blockBoxData.w * 0.36
        })
        .attr('y', function (d, i) {
          return ((blockBoxData.h * 0.12) + i * (jump)) - 9 / 4
        })
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 9)
      circleGroupEnter.append('text')
        .attr('class', 'nbBs')
        .text(function (d) {
          return d.data.length + ' Bs'
        })
        .attr('x', function (d, i) {
          return blockBoxData.w * 0.36
        })
        .attr('y', function (d, i) {
          return ((blockBoxData.h * 0.12) + i * (jump)) + 9
        })
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 9)
      circleGroupEnter.append('circle')
        .style('opacity', 1)
        .attr('cx', function (d, i) {
          return blockBoxData.w / 12
        })
        .attr('cy', function (d, i) {
          return (blockBoxData.h * 0.12) + i * (jump)
        })
        .attr('stroke', '#000000')
        .attr('fill', '#ffffff')
        .attr('fill-opacity', 1)
        .style('stroke-opacity', 1)
        .attr('stroke-width', 0.5)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('r', 12)
      circleGroupEnter.append('circle')
        .style('opacity', 0.6)
        .attr('cx', function (d, i) {
          return blockBoxData.w / 12
        })
        .attr('cy', function (d, i) {
          return (blockBoxData.h * 0.12) + i * (jump)
        })
        .attr('r', 0)
        .attr('stroke', '#000000')
        .attr('fill', function (d) {
          // return 'none'
          if (d.id === 'done') return colsGreens[0]
          if (d.id === 'fail') return '#cf1717'
          if (d.id === 'cancel') return 'grey'
        })
        .attr('fill-opacity', 1)
        .style('stroke-opacity', 1)
        .attr('stroke-width', 0.5)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('state', 'disabled')
        .transition()
        .duration(timeD.animArc)
        .style('opacity', 0.6)
        .attr('r', 12)
      // circleGroupEnter.append('circle')
      //   .attr('class', 'percentFilter')
      //   .attr('cx', function (d, i) {
      //     return 0 + blockBoxData.w * 0.6
      //   })
      //   .attr('cy', function (d, i) {
      //     return 0 + ((blockBoxData.h * 0.12) + i * (jump))
      //   })
      //   .attr('r', 5.5)
      //   .attr('height', 12)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 15.5)
      circleGroupEnter.append('rect')
        .attr('x', function (d, i) {
          return -5 + blockBoxData.w * 0.6
        })
        .attr('y', function (d, i) {
          return -5 + ((blockBoxData.h * 0.12) + i * (jump))
        })
        .attr('width', 10)
        .attr('height', 10)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0)
        .attr('fill', 'white')
        .style('stroke-linecap', 'round')
        .on('click', function (d, i) {
          if (d3.select(this).attr('state') === 'disabled') {
            d3.select(this)
              .attr('state', 'enabled')
              .transition()
              .duration(timeD.animArc)
              .attr('fill', '#80dfff')
            addStateFilter(d.id, d.data)
          } else {
            d3.select(this)
              .attr('state', 'disabled')
              .transition()
              .duration(timeD.animArc)
              .attr('fill', 'white')
            removeStateFilter(d.id, d.data)
          }
        })
        .transition()
        .duration(timeD.animArc)
        .attr('stroke-width', 0.5)

      let circlesGroupMerge = circleGroupEnter.merge(circlesGroup)
      circlesGroupMerge.select('text.nbBs')
        .text(function (d) {
          return d.data.length + ' Bs'
        })
      // circlesGroupMerge.select('circle.percentFilter')
      //   .transition()
      //   .duration(timeD.animArc)
      //   .attr('stroke-dasharray', function (d) {
      //     let peri = 2 * Math.PI * 5.5
      //     let percent = 0
      //     if (filteredTokens.blockState[d.id]) percent = filteredTokens.blockState[d.id].length / d.data.length
      //     return [peri / 2 * percent, peri * (1 - percent) + (peri / 2 * percent)]
      //   })
      //   .attr('stroke-dashoffset', function () {
      //     let peri = 2 * Math.PI * 5.5
      //     return peri * 0.25
      //   })

      circlesGroup
        .exit()
        .remove()
    }
    function updateErrorToken () {
      let data = []
      for (let key in tokens.blockError) {
        if (tokens.blockError.hasOwnProperty(key)) {
          data.push({id: key, data: tokens.blockError[key]})
        }
      }

      let circlesGroup = gBlockError
        .selectAll('g')
        .data(data, function (d) {
          return d.id
        })

      let tokenR = 10
      let spaceBetweenToken = 14
      let jump = (2 * tokenR) + spaceBetweenToken
      // let positions =
      // [
      //   [(blockBoxData.w / 4)],
      //   [(blockBoxData.w / 4) - (spaceBetweenToken / 2) - tokenR, (blockBoxData.w / 4) + (spaceBetweenToken / 2) + tokenR],
      //   [(blockBoxData.w / 4), (blockBoxData.w / 4) - (2 * tokenR) - spaceBetweenToken, (blockBoxData.w / 4) + (2 * tokenR) + spaceBetweenToken]
      // ]

      let circleGroupEnter = circlesGroup.enter().append('g').attr('class', 'group.state').attr('id', function (d) { return widgetId + '-' + d.id })
      circleGroupEnter.append('line')
        .attr('x1', function (d, i) {
          return (blockBoxData.w / 12) + 12
        })
        .attr('y1', function (d, i) {
          return (blockBoxData.h * 0.12) + i * (jump)
        })
        .attr('x2', function (d, i) {
          return blockBoxData.w * 0.6
        })
        .attr('y2', function (d, i) {
          return ((blockBoxData.h * 0.12) + i * (jump))
        })
        .attr('stroke', '#000000')
        .attr('stroke-width', 0)
        .style('stroke-linecap', 'round')
        .transition()
        .duration(timeD.animArc)
        .attr('stroke-width', 0.5)
      circleGroupEnter.append('text')
        .text(function (d) {
          return d.id
        })
        .attr('x', function (d, i) {
          return blockBoxData.w * 0.36
        })
        .attr('y', function (d, i) {
          return ((blockBoxData.h * 0.12) + i * (jump)) - 9 / 4
        })
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 9)
      circleGroupEnter.append('text')
        .attr('class', 'nbBs')
        .text(function (d) {
          return d.data.length + ' Bs'
        })
        .attr('x', function (d, i) {
          return blockBoxData.w * 0.36
        })
        .attr('y', function (d, i) {
          return ((blockBoxData.h * 0.12) + i * (jump)) + 9
        })
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 9)
      circleGroupEnter.append('circle')
        .style('opacity', 1)
        .attr('cx', function (d, i) {
          return blockBoxData.w / 12
        })
        .attr('cy', function (d, i) {
          return (blockBoxData.h * 0.12) + i * (jump)
        })
        .attr('stroke', '#000000')
        .attr('fill', '#ffffff')
        .attr('fill-opacity', 1)
        .style('stroke-opacity', 1)
        .attr('stroke-width', 0.5)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('r', 12)
      circleGroupEnter.append('circle')
        .style('opacity', 0.6)
        .attr('cx', function (d, i) {
          return blockBoxData.w / 12
        })
        .attr('cy', function (d, i) {
          return (blockBoxData.h * 0.12) + i * (jump)
        })
        .attr('r', 0)
        .attr('stroke', '#000000')
        .attr('fill', function (d) {
          return '#bbbbbb'
        })
        .attr('fill-opacity', 1)
        .style('stroke-opacity', 1)
        .attr('stroke-width', 0.5)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('state', 'disabled')
        .transition()
        .duration(timeD.animArc)
        .style('opacity', 0.6)
        .attr('r', 12)
      circleGroupEnter.append('circle')
        .attr('class', 'percentFilter')
        .attr('cx', function (d, i) {
          return 0 + blockBoxData.w * 0.6
        })
        .attr('cy', function (d, i) {
          return 0 + ((blockBoxData.h * 0.12) + i * (jump))
        })
        .attr('r', 5.5)
        .attr('height', 12)
        .attr('stroke', '#000000')
        .attr('stroke-width', 15.5)
      circleGroupEnter.append('circle')
        .attr('cx', function (d, i) {
          return 0 + blockBoxData.w * 0.6
        })
        .attr('cy', function (d, i) {
          return 0 + ((blockBoxData.h * 0.12) + i * (jump))
        })
        .attr('r', 5.5)
        .attr('height', 12)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0)
        .attr('fill', 'white')
        .style('stroke-linecap', 'round')
        .on('click', function (d, i) {
          if (d3.select(this).attr('state') === 'disabled') {
            d3.select(this)
              .attr('state', 'enabled')
              .transition()
              .duration(timeD.animArc)
              .attr('fill', '#80dfff')
            addErrorFilter(d.id, d.data)
          } else {
            d3.select(this)
              .attr('state', 'disabled')
              .transition()
              .duration(timeD.animArc)
              .attr('fill', 'white')
            removeErrorFilter(d.id, d.data)
          }
        })
        .transition()
        .duration(timeD.animArc)
        .attr('stroke-width', 0.5)

      let circlesGroupMerge = circleGroupEnter.merge(circlesGroup)
      circlesGroupMerge.select('text.nbBs')
        .text(function (d) {
          return d.data.length + ' Bs'
        })
      circlesGroupMerge.select('circle.percentFilter')
        .transition()
        .duration(timeD.animArc)
        .attr('stroke-dasharray', function (d) {
          let peri = 2 * Math.PI * 5.5
          let percent = 0
          if (filteredTokens.blockError[d.id]) percent = filteredTokens.blockError[d.id].length / d.data.length
          return [peri / 2 * percent, peri * (1 - percent) + (peri / 2 * percent)]
        })
        .attr('stroke-dashoffset', function () {
          let peri = 2 * Math.PI * 5.5
          return peri * 0.25
        })

      circlesGroup
        .exit()
        .remove()
    }
    function updateBlockInfo () {
      // let tokens = { blockState: {}, blockError: {} }
      // let filteredTokens = { blockState: {}, blockError: {} }
      let rayon = blockBoxData.w * 0.44
      let total = 0
      for (var key in tokens.blockState) {
        if (tokens.blockState.hasOwnProperty(key)) {
          total += tokens.blockState[key].length
        }
      }
      let totalR = 0
      let newStrokeWidth = tokens.blockState['done'] ? rayon * (tokens.blockState['done'].length / total) : 0
      gBlockInfo.select('circle.done')
        .transition()
        .duration(timeD.animArc)
        .attr('r', newStrokeWidth / 2)
        .attr('stroke-width', newStrokeWidth * 1.6)
        .attr('stroke-dasharray', function () {
          let peri = 2 * Math.PI * (newStrokeWidth / 2)
          let percent = 0
          if (filteredTokens.blockState['done']) percent = filteredTokens.blockState['done'].length / tokens.blockState['done'].length
          return [peri * percent, peri * (1 - percent)]
        })
        .attr('stroke-dashoffset', function () {
          let peri = 2 * Math.PI * (newStrokeWidth / 2)
          return peri * 0.25
        })
      totalR += newStrokeWidth

      newStrokeWidth = tokens.blockState['fail'] ? rayon * (tokens.blockState['fail'].length / total) : 0
      gBlockInfo.select('circle.fail')
        .transition()
        .duration(timeD.animArc)
        .attr('r', totalR + newStrokeWidth / 2)
        .attr('stroke-width', newStrokeWidth * 1.6)
        .attr('stroke-dasharray', function (d) {
          let peri = 1 * (2 * Math.PI * (totalR + newStrokeWidth))
          let percent = 0
          if (filteredTokens.blockState['fail']) percent = filteredTokens.blockState['fail'].length / tokens.blockState['fail'].length
          console.log(percent);
          return [peri * percent, peri * (1 - percent)]
        })
        .attr('stroke-dashoffset', function () {
          let peri = (2 * Math.PI * (totalR + newStrokeWidth))
          return peri * 0.25
        })
      totalR += newStrokeWidth

      newStrokeWidth = tokens.blockState['cancel'] ? rayon * (tokens.blockState['cancel'].length / total) : 0
      gBlockInfo.select('circle.cancel')
        .transition()
        .duration(timeD.animArc)
        .attr('r', totalR + newStrokeWidth / 2)
        .attr('stroke-width', newStrokeWidth * 1.6)
        .attr('stroke-dasharray', function (d) {
          let peri = 1 * (2 * Math.PI * (totalR + newStrokeWidth))
          let percent = 0
          if (filteredTokens.blockState['cancel']) percent = filteredTokens.blockState['cancel'].length / tokens.blockState['cancel'].length
          return [peri * percent, peri * (1 - percent)]
        })
        .attr('stroke-dashoffset', function () {
          let peri = 1 * (2 * Math.PI * (totalR + newStrokeWidth))
          return peri * 0.25
        })
      totalR += newStrokeWidth
    }
  }
  let SvgFilterTels = function () {
    let gBlockBox, gBlockInfo, gBlockState, gBlockError
    let blockBoxData = {}
    let filtersTels = []

    function initData (dataIn) {
      gBlockBox = svg.g.append('g')

      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.099
      h0 = lenD.h[0] * 0.21 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.01)
      y0 = lenD.h[0] * 0.77
      marg = w0 * 0.01
      blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0)
      //   .attr('y1', blockBoxData.h * 0.166)
      //   .attr('x2', blockBoxData.w * 0.98)
      //   .attr('y2', blockBoxData.h * 0.166)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)
      gBlockBox.append('line')
        .attr('x1', blockBoxData.w * 0.6)
        .attr('y1', blockBoxData.h * 0)
        .attr('x2', blockBoxData.w * 0.6)
        .attr('y2', blockBoxData.h)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.6)
      //   .attr('y1', blockBoxData.h * 0.96)
      //   .attr('x2', blockBoxData.w * 1.1)
      //   .attr('y2', blockBoxData.h * 0.96)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1)

      gBlockState = gBlockBox.append('g')
      // gBlockInfo.append('circle')
      //   .attr('cx', blockBoxData.w * 0.5)
      //   .attr('cy', blockBoxData.h * 0.1)
      //   .attr('r', blockBoxData.w * 0.43)
      //   .attr('fill', 'none')
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 0.4)
      // gBlockInfo.append('circle')
      //   .attr('class', 'done')
      //   .attr('cx', blockBoxData.w * 0.5)
      //   .attr('cy', blockBoxData.h * 0.1)
      //   .attr('fill', 'none')
      //   .attr('stroke', colsGreens[0])
      //   .style('opacity', 0.6)
      //   .attr('vector-effect', 'non-scaling-stroke')
      // gBlockInfo.append('circle')
      //   .attr('class', 'fail')
      //   .attr('cx', blockBoxData.w * 0.5)
      //   .attr('cy', blockBoxData.h * 0.1)
      //   .attr('fill', 'none')
      //   .attr('stroke', '#cf1717')
      //   .style('opacity', 0.6)
      //   .attr('vector-effect', 'non-scaling-stroke')
      // gBlockInfo.append('circle')
      //   .attr('class', 'cancel')
      //   .attr('cx', blockBoxData.w * 0.5)
      //   .attr('cy', blockBoxData.h * 0.1)
      //   .attr('fill', 'none')
      //   .attr('stroke', 'grey')
      //   .style('opacity', 0.6)
      //   .attr('vector-effect', 'non-scaling-stroke')

      gBlockState.attr('transform', 'translate(' + 0 + ',' + blockBoxData.h * 0 + ')')
      gBlockState.append('line')
        .attr('x1', -10)
        .attr('y1', (blockBoxData.h * 0.075) - 5)
        .attr('x2', blockBoxData.x - 6)
        .attr('y2', (blockBoxData.h * 0.075) - 5)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockState.append('line')
        .attr('x1', blockBoxData.x - 6)
        .attr('y1', (blockBoxData.h * 0.075) - 5 - 6)
        .attr('x2', blockBoxData.x - 6)
        .attr('y2', blockBoxData.h * 0.96)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockState.append('line')
        .attr('x2', blockBoxData.x - 6)
        .attr('y2', blockBoxData.h * 0.96)
        .attr('x1', blockBoxData.x)
        .attr('y1', blockBoxData.h * 0.96)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockState.append('line')
        .attr('x2', blockBoxData.x)
        .attr('y2', blockBoxData.h * 0.96 - 6)
        .attr('x1', blockBoxData.x)
        .attr('y1', blockBoxData.h * 0.96 + 6)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
      gBlockState.append('text')
        .text('Props')
        .attr('x', (blockBoxData.w * 0.26))
        .attr('y', (blockBoxData.h * 0.075))
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 14)
      gBlockState.append('text')
        .text('Tot: 0 Bs')
        .attr('x', blockBoxData.x + 4)
        .attr('y', blockBoxData.h * 0.96)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'start')
        .style('font-size', 9)
        // .attr('transform', 'rotate(-30)')

      createPropToken()
    }
    this.initData = initData

    function updateData (dataIn) {
      //updateStateToken()
    }
    this.updateData = updateData

    function createPropToken () {
      let data = ['Mirror', 'Camera', 'Mount', 'Aux']

      let circlesGroup = gBlockState
        .selectAll('g')
        .data(data, function (d) {
          return d.id
        })

      let tokenR = 10
      let spaceBetweenToken = 14
      let jump = (2 * tokenR) + spaceBetweenToken
      // let positions =
      // [
      //   [(blockBoxData.w / 4)],
      //   [(blockBoxData.w / 4) - (spaceBetweenToken / 2) - tokenR, (blockBoxData.w / 4) + (spaceBetweenToken / 2) + tokenR],
      //   [(blockBoxData.w / 4), (blockBoxData.w / 4) - (2 * tokenR) - spaceBetweenToken, (blockBoxData.w / 4) + (2 * tokenR) + spaceBetweenToken]
      // ]

      let circleGroupEnter = circlesGroup.enter().append('g')
        .attr('class', 'group.prop')
        .attr('transform', 'translate(' + 0 + ',' + blockBoxData.h * 0.1 + ')')
      circleGroupEnter.append('line')
        .attr('x1', function (d, i) {
          return (blockBoxData.w / 12) + 12
        })
        .attr('y1', function (d, i) {
          return (blockBoxData.h * 0.12) + i * (jump)
        })
        .attr('x2', function (d, i) {
          return blockBoxData.w * 0.6
        })
        .attr('y2', function (d, i) {
          return ((blockBoxData.h * 0.12) + i * (jump))
        })
        .attr('stroke', '#000000')
        .attr('stroke-width', 0)
        .style('stroke-linecap', 'round')
        .transition()
        .duration(timeD.animArc)
        .attr('stroke-width', 0.5)
      circleGroupEnter.append('text')
        .text(function (d) {
          return d.id
        })
        .attr('x', function (d, i) {
          return blockBoxData.w * 0.36
        })
        .attr('y', function (d, i) {
          return ((blockBoxData.h * 0.12) + i * (jump)) - 9 / 4
        })
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 9)
      circleGroupEnter.append('text')
        .attr('class', 'nbBs')
        .text(function (d) {
          return d
        })
        .attr('x', function (d, i) {
          return blockBoxData.w * 0.36
        })
        .attr('y', function (d, i) {
          return ((blockBoxData.h * 0.12) + i * (jump)) + 9
        })
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 9)
      circleGroupEnter.append('circle')
        .style('opacity', 1)
        .attr('cx', function (d, i) {
          return blockBoxData.w / 12
        })
        .attr('cy', function (d, i) {
          return (blockBoxData.h * 0.12) + i * (jump)
        })
        .attr('stroke', '#000000')
        .attr('fill', '#ffffff')
        .attr('fill-opacity', 1)
        .style('stroke-opacity', 1)
        .attr('stroke-width', 0.5)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('r', 12)
      circleGroupEnter.append('circle')
        .style('opacity', 0.6)
        .attr('cx', function (d, i) {
          return blockBoxData.w / 12
        })
        .attr('cy', function (d, i) {
          return (blockBoxData.h * 0.12) + i * (jump)
        })
        .attr('r', 0)
        .attr('stroke', '#000000')
        .attr('fill', function (d) {
          return 'none'
        })
        .attr('fill-opacity', 1)
        .style('stroke-opacity', 1)
        .attr('stroke-width', 0.5)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('state', 'disabled')
        .transition()
        .duration(timeD.animArc)
        .style('opacity', 0.6)
        .attr('r', 12)
      // circleGroupEnter.append('circle')
      //   .attr('class', 'percentFilter')
      //   .attr('cx', function (d, i) {
      //     return 0 + blockBoxData.w * 0.6
      //   })
      //   .attr('cy', function (d, i) {
      //     return 0 + ((blockBoxData.h * 0.12) + i * (jump))
      //   })
      //   .attr('r', 5.5)
      //   .attr('height', 12)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 15.5)
      circleGroupEnter.append('rect')
        .attr('x', function (d, i) {
          return -5 + blockBoxData.w * 0.6
        })
        .attr('y', function (d, i) {
          return -5 + ((blockBoxData.h * 0.12) + i * (jump))
        })
        .attr('width', 10)
        .attr('height', 10)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0)
        .attr('fill', 'white')
        .style('stroke-linecap', 'round')
        .on('click', function (d, i) {
          if (d3.select(this).attr('state') === 'disabled') {
            d3.select(this)
              .attr('state', 'enabled')
              .transition()
              .duration(timeD.animArc)
              .attr('fill', '#80dfff')
            addStateFilter(d.id, d.data)
          } else {
            d3.select(this)
              .attr('state', 'disabled')
              .transition()
              .duration(timeD.animArc)
              .attr('fill', 'white')
            removeStateFilter(d.id, d.data)
          }
        })
        .transition()
        .duration(timeD.animArc)
        .attr('stroke-width', 0.5)
      // circlesGroupMerge.select('circle.percentFilter')
      //   .transition()
      //   .duration(timeD.animArc)
      //   .attr('stroke-dasharray', function (d) {
      //     let peri = 2 * Math.PI * 5.5
      //     let percent = 0
      //     if (filteredTokens.blockState[d.id]) percent = filteredTokens.blockState[d.id].length / d.data.length
      //     return [peri / 2 * percent, peri * (1 - percent) + (peri / 2 * percent)]
      //   })
      //   .attr('stroke-dashoffset', function () {
      //     let peri = 2 * Math.PI * 5.5
      //     return peri * 0.25
      //   })
    }
  }
  let SvgMiddleInfo = function () {
    let gBlockBox, gMiddleBox, gPreviewBox, gHistoryBox
    let blockBoxData = {}
    let focusOn = {}
    let focusHistory = []

    function blockPreview (optIn) {
      gBlockBox.select('text.startTime')
        .text('StartTime: ' + optIn.startTime)
      gBlockBox.select('text.duration')
        .text('Duration: ' + optIn.duration)
      gBlockBox.select('text.endTime')
        .text('EndTime: ' + optIn.endTime)
      gBlockBox.select('text.id')
        .text('Id: ' + optIn.obId)
      gBlockBox.select('rect.exeStateRect')
        .attr('stroke', function () {
          let state = optIn.exeState.state
          let canRun = optIn.exeState.canRun

          if (state === 'wait') return "#e6e6e6"
          else if (state === 'done') return colsGreens[0]
          else if (state === 'run') {
            return colsPurplesBlues[0] // [nObs % colsPurplesBlues.length]
          } else if (state === 'cancel') {
            if (hasVar(canRun)) {
              if (!canRun) return colsYellows[5]
            }
            return colsYellows[5]
          } else if (state === 'fail') return colsReds[3]
          else return colPrime
        })
    }
    this.blockPreview = blockPreview
    function blockFocus (optIn) {
      focusOn = optIn
      let mid = gMiddleBox.selectAll('rect.blockFocusOn')
        .data([focusOn])
      mid.enter()
        .append('rect')
        .attr('class', 'blockFocusOn')
        .attr('x', 20)
        .attr('y', 10)
        .attr('width', -40 + blockBoxData.w * 0.8)
        .attr('height', -20 + blockBoxData.h * 1)
        .attr('fill', '#efefef')
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 0.4)
        .merge(mid)
        .attr('stroke', function () {
          let state = optIn.exeState.state
          let canRun = optIn.exeState.canRun
          if (state === 'wait') return '#e6e6e6'
          else if (state === 'done') return colsGreens[0]
          else if (state === 'run') {
            return colsPurplesBlues[0] // [nObs % colsPurplesBlues.length]
          } else if (state === 'cancel') {
            if (hasVar(canRun)) {
              if (!canRun) return colsYellows[5]
            }
            return colsYellows[5]
          } else if (state === 'fail') return colsReds[3]
          else return colPrime
        })
      // gBlockBox.select('text.startTime')
      //   .style('opacity', 1)
      // gBlockBox.select('text.duration')
      //   .style('opacity', 1)
      // gBlockBox.select('text.endTime')
      //   .style('opacity', 1)
      // gBlockBox.select('text.id')
      //   .style('opacity', 1)
      // gBlockBox.select('rect.blockFocusOn')
      //   .transition()
      //   .duration(timeD.animArc * 2)
      //   .attr('x', blockBoxData.w / 2)
      //   .attr('y', blockBoxData.h * 0.94)
      //   .attr('width', 0)
      //   .attr('height', 0)
      //   .remove()
      // gBlockBox.append('rect')
      //   .attr('class', 'blockFocusOn')
      //   .attr('x', blockBoxData.w / 2)
      //   .attr('y', 0)
      //   .attr('width', 0)
      //   .attr('height', 0)
      //   .attr('fill', '#aaaaaa')
      //   .transition()
      //   .duration(timeD.animArc * 2)
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', blockBoxData.w)
      //   .attr('height', blockBoxData.h * 0.94)
    }
    this.blockFocus = blockFocus
    function cleanPreview () {

    }
    this.cleanPreview = cleanPreview
    function TelPreview (optIn) {
    }
    this.blockPreview = blockPreview
    function TelFocus (optIn) {
    }
    this.blockFocus = blockFocus

    function initData (dataIn) {
      gBlockBox = svg.g.append('g')

      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.86
      h0 = lenD.h[0] * 0.4 // h0 *= 2.5;
      x0 = (lenD.w[0] * 0.12)
      y0 = lenD.h[0] * 0.32
      marg = w0 * 0.01
      blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')
      // gBlockBox.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', blockBoxData.w)
      //   .attr('height', blockBoxData.h)
      //   .attr('fill', '#cccccc')
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1.5)
      gPreviewBox = gBlockBox.append('g').attr('transform', 'translate(' + 0 + ',' + 0 + ')')
      gPreviewBox.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', blockBoxData.w * 0.1)
        .attr('height', blockBoxData.h)
        .attr('fill', '#cccccc')
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5)
      gMiddleBox = gBlockBox.append('g').attr('transform', 'translate(' + blockBoxData.w * 0.1 + ',' + 0 + ')')
      // gMiddleBox.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', blockBoxData.w * 0.8)
      //   .attr('height', blockBoxData.h)
      //   .attr('fill', '#cccccc')
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1.5)
      gHistoryBox = gBlockBox.append('g').attr('transform', 'translate(' + blockBoxData.w * 0.9 + ',' + 0 + ')')
      gHistoryBox.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', blockBoxData.w * 0.1)
        .attr('height', blockBoxData.h)
        .attr('fill', '#cccccc')
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5)
      //
      // gBlockBox.append('rect')
      //   .attr('x', blockBoxData.w * 0.35)
      //   .attr('y', 0)
      //   .attr('width', blockBoxData.w * 0.3)
      //   .attr('height', blockBoxData.h * 0.2)
      //   .attr('fill', '#eeeeee')
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 1.5)
      //   // .attr('stroke-dasharray',
      //   //   [blockBoxData.w * 0.05, blockBoxData.w * 0.8, blockBoxData.w * 0.05 + blockBoxData.h * 0.94 * 0.05, blockBoxData.h * 0.94 * 0.8,
      //   //     blockBoxData.h * 0.94 * 0.05 + blockBoxData.w * 0.05, blockBoxData.w * 0.8, blockBoxData.w * 0.05 + blockBoxData.h * 0.94 * 0.05, blockBoxData.h * 0.94 * 0.8])
      // gBlockBox.append('text')
      //   .attr('class', 'id')
      //   .text('Id:')
      //   .attr('x', (blockBoxData.w * 0.5))
      //   .attr('y', (blockBoxData.h * 0.1) - 30)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 13)
      //   .style('opacity', 0.4)
      // gBlockBox.append('text')
      //   .attr('class', 'startTime')
      //   .text('StartTime:')
      //   .attr('x', (blockBoxData.w * 0.5))
      //   .attr('y', (blockBoxData.h * 0.1) - 10)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 13)
      //   .style('opacity', 0.4)
      // gBlockBox.append('text')
      //   .attr('class', 'duration')
      //   .text('Duration:')
      //   .attr('x', (blockBoxData.w * 0.5))
      //   .attr('y', (blockBoxData.h * 0.1) + 10)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 13)
      //   .style('opacity', 0.4)
      // gBlockBox.append('text')
      //   .attr('class', 'endTime')
      //   .text('endTime:')
      //   .attr('x', (blockBoxData.w * 0.5))
      //   .attr('y', (blockBoxData.h * 0.1) + 30)
      //   .style('font-weight', 'normal')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', 13)
      //   .style('opacity', 0.4)
      // gBlockBox.append('rect')
      //   .attr('class', 'exeStateRect')
      //   .attr('x', blockBoxData.w * 0.35 + 3)
      //   .attr('y', 3)
      //   .attr('width', blockBoxData.w * 0.3 - 5)
      //   .attr('height', blockBoxData.h * 0.2 - 5)
      //   .attr('fill', '#ffffff')
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 6)
      //   .style('opacity', 0.4)

      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.05)
      //   .attr('y1', blockBoxData.h)
      //   .attr('x2', blockBoxData.w * 0.95)
      //   .attr('y2', blockBoxData.h)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 1)
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.05)
      //   .attr('y1', blockBoxData.h - 10)
      //   .attr('x2', blockBoxData.w * 0.05)
      //   .attr('y2', blockBoxData.h + 10)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 1)
      // gBlockBox.append('line')
      //   .attr('x1', blockBoxData.w * 0.95)
      //   .attr('y1', blockBoxData.h - 10)
      //   .attr('x2', blockBoxData.w * 0.95)
      //   .attr('y2', blockBoxData.h + 10)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 1)
    }
    this.initData = initData

    function updateData (dataIn) {
    }
    this.updateData = updateData
  }

  let svgBlocks = new SvgBlocks()
  let svgTels = new SvgTels()
  let svgFilterBlocks = new SvgFilterBlocks()
  let svgFilterTels = new SvgFilterTels()
  let svgMiddleInfo = new SvgMiddleInfo()
}