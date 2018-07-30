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
/* global colsGreens */
/* global Locker */
/* global appendToDom */
/* global runWhenReady */

window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueModif.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 8
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

    svgMain.initData(dataIn.data)
    svgFilter.initData()
  }
  this.initData = initData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateData (dataIn) {
    svgMain.updateData(dataIn.data)
    svgFilter.updateData(dataIn.data)
  }
  this.updateData = updateData

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
  let SvgMain = function () {
    // let thisMain = this

    let tagTagBlocks = widgetType
    let tagBlockQueue = 'blockQueue'

    let blockQueue = new BlockQueue()

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

      w0 = lenD.w[0] * 0.95
      h0 = lenD.h[0] * 0.25 // h0 *= 2.5;
      x0 = (lenD.w[0] - w0) / 2
      y0 = x0
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
          blockFocus({ id: d.id })
        },

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
    //
    // ---------------------------------------------------------------------------------------------------
    function blockFocus (optIn) {
      let data = { type: 'syncObFocus', syncTime: Date.now(), obId: optIn.id }
      sock.sockSyncStateSend({
        widgetId: widgetId,
        type: data.type,
        data: data
      })
    }
    // ---------------------------------------------------------------------------------------------------
  }

  let SvgFilter = function () {
    let gBlockBox, gBlockState, gBlockError
    let tokens = { blockState: {}, blockError: {} }
    let blockBoxData = {}

    function initData (dataIn) {
      gBlockBox = svg.g.append('g')
      gBlockState = gBlockBox.append('g')
      gBlockError = gBlockBox.append('g')

      let x0, y0, w0, h0, marg
      w0 = lenD.w[0] * 0.95
      h0 = lenD.h[0] * 0.125 // h0 *= 2.5;
      x0 = (lenD.w[0] - w0) / 2
      y0 = lenD.h[0] * 0.33
      marg = w0 * 0.01
      blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      gBlockBox.attr('transform', 'translate(' + blockBoxData.x + ',' + blockBoxData.y + ')')

      gBlockState.attr('transform', 'translate(' + 0 + ',' + 0 + ')')
      gBlockState.append('text')
        .text('Blocks States')
        .attr('x', (blockBoxData.w / 4))
        .attr('y', (blockBoxData.h))
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 18)

      gBlockError.attr('transform', 'translate(' + (blockBoxData.w / 2) + ',' + 0 + ')')
      gBlockError.append('text')
        .text('Blocks Errors')
        .attr('x', (blockBoxData.w / 4))
        .attr('y', (blockBoxData.h))
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', 18)
      // .append('rect')
      // .attr('x', 0)
      // .attr('y', 0)
      // .attr('width', blockBoxData.w)
      // .attr('height', blockBoxData.h)
      // .attr('fill', '#000000')s
    }
    this.initData = initData

    function updateData (dataIn) {
      for (var i = 0; i < dataIn.blocks.done.length; i++) {
        if (hasVar(tokens.blockState[dataIn.blocks.done[i].exeState.state])) {
          if (!tokens.blockState[dataIn.blocks.done[i].exeState.state].includes(dataIn.blocks.done[i].obId)) {
            tokens.blockState[dataIn.blocks.done[i].exeState.state].push(dataIn.blocks.done[i].obId)
          }
        } else {
          tokens.blockState[dataIn.blocks.done[i].exeState.state] = [dataIn.blocks.done[i].obId]
        }
      }
      updateStateToken()
      updateErrorToken()
    }
    this.updateData = updateData

    function updateStateToken () {
      let data = []
      let total = 0
      for (let key in tokens.blockState) {
        total += tokens.blockState[key].length
      }
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
      let spaceBetweenToken = 20
      // let offset = 1
      // if (data.length % 2 === 1) offset = 0
      let stripWidth = (data.length - 1) * (tokenR + spaceBetweenToken)

      let circleGroupEnter = circlesGroup.enter().append('g').attr('class', 'group.state')
      // circleGroupEnter.append('line')
      //   .attr('x1', function (d, i) {
      //     return (blockBoxData.w / 4) - ((2 * tokenR * data.length) - ((data.length - 1) * spaceBetweenToken) / 2) + (i * spaceBetweenToken) + (i * tokenR * 2) + (tokenR * offset)
      //   })
      //   .attr('x2', function (d, i) {
      //     return (blockBoxData.w / 4) - ((2 * tokenR * data.length) - ((data.length - 1) * spaceBetweenToken) / 2) + (i * spaceBetweenToken) + (i * tokenR * 2) + (tokenR * offset)
      //   })
      //   .attr('y1', 1 * blockBoxData.h / 5)
      //   .attr('y2', 3 * blockBoxData.h / 5)
      //   .attr('stroke', 'black')
      //   .attr('stroke-width', 0)
      circleGroupEnter.append('circle')
        .style('opacity', 0.6)
        .attr('cx', function (d, i) {
          return (blockBoxData.w / 4) - (stripWidth / 2) + i * (spaceBetweenToken + (tokenR * 2)) // + (tokenR * offset)
        })
        .attr('cy', function (d, i) {
          return 3 * blockBoxData.h / 5
        })
        .attr('r', 10)
        .attr('stroke', 'white')
        .attr('fill', function (d) {
          // return 'none'
          if (d.id === 'done') return colsGreens[0]
          if (d.id === 'fail') return '#cf1717'
          if (d.id === 'cancel') return 'grey'
        })
        .attr('fill-opacity', 1)
        .style('stroke-opacity', 1)
        .attr('stroke-width', 1)
        .attr('vector-effect', 'non-scaling-stroke')

      let circleGroupMerge = circlesGroup.merge(circleGroupEnter)
      // circleGroupEnter.select('line')
      //   .attr('x1', function (d, i) {
      //     return (blockBoxData.w / 4) - ((2 * tokenR * data.length) - ((data.length - 1) * spaceBetweenToken) / 2) + (i * spaceBetweenToken) + (i * tokenR * 2) + (tokenR * offset)
      //   })
      //   .attr('x2', function (d, i) {
      //     return (blockBoxData.w / 4) - ((2 * tokenR * data.length) - ((data.length - 1) * spaceBetweenToken) / 2) + (i * spaceBetweenToken) + (i * tokenR * 2) + (tokenR * offset)
      //   })
      //   .attr('y1', 1 * blockBoxData.h / 5)
      //   .attr('y2', 3 * blockBoxData.h / 5)
      //   .attr('stroke', '#eeeeee')
      //   .attr('stroke-width', 20)
      //   .style('stroke-linecap', 'round')
      circleGroupMerge.select('circle')
        .transition()
        .duration(timeD.animArc)
        .style('opacity', 0.6)
        .attr('r', function (d) {
          return 10
          // return 25 * (d.data.length / total)
        })
        .attr('cx', function (d, i) {
          return (blockBoxData.w / 4) - (stripWidth / 2) + i * (spaceBetweenToken + (tokenR * 2)) // + (tokenR * offset)
        })
        .attr('cy', function (d, i) {
          return 3 * blockBoxData.h / 5
        })

        // .attr('fill-opacity', 0.3)
        // .style('stroke-opacity', 0.15)
        // .attr('stroke-width', 3)
        // .attr('x', function (d, i) {
        //   return 500
        // })
        // .attr("y", function(d,i) { return d.y; })

      circlesGroup
        .exit()
        .remove()
    }

    function updateErrorToken () {
    }
  }

  let svgMain = new SvgMain()
  let svgFilter = new SvgFilter()
}
