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
var mainScriptTag = 'plotsDash'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global sock */
/* global Locker */
/* global RunLoop */
/* global appendToDom */
/* global runWhenReady */
/* global disableScrollSVG */
/* global PlotTimeSeries */
/* global ScrollBox */
/* global PlotBrushZoom */

window.loadScript({source: mainScriptTag, script: '/js/utils_plotTimeSeriesV2.js'})
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollBox.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_plotTimeBar.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_plotBrushZoom.js' })
window.loadScript({ source: 'utils_scrollTable', script: '/js/utils_commonD3.js' })
// // load additional js files:
// window.loadScript({ source:mainScriptTag, script:"/js/utils_scrollGrid.js"});

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 12
  let w0 = 12
  let divKey = 'main'
  let content = "<div id='" + optIn.baseName + divKey + "'>" +
  '</div>'

  optIn.widgetFunc = {
    SockFunc: sockPlotsDash,
    MainFunc: mainPlotsDash
  }
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
    content: content
  }

  sock.addToTable(optIn)
}

// ---------------------------------------------------------------------------------------------------
// additional socket events for this particular widget type
// ---------------------------------------------------------------------------------------------------
let sockPlotsDash = function (optIn) {}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainPlotsDash = function (optIn) {
  // let myUniqueId = unique()
  window.colorPalette = getColorTheme('bright-Grey')
  let isSouth = window.__nsType__ === 'S'

  let widgetType = optIn.widgetType
  let tagArrZoomerPlotsSvg = optIn.baseName

  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV

  let shared = {
    server: {},
    time: {
      current: undefined,
      from: undefined,
      range: undefined
    },
    data: []
  }
  let svg = {}
  let box = {}
  let lenD = {}

  // let thisSchedBlocksInspector = this
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
  // locker.add('inInit')
  let runLoop = new RunLoop({ tag: widgetId })
  let middleSeparation = 0

  function initData (dataIn) {
    function initSvg () {
      lenD.w = {}
      lenD.h = {}
      lenD.w[0] = 1000
      lenD.h[0] = lenD.w[0] * 1.33 // / sgvTag.main.whRatio

      d3.select(svgDiv)
        .style('position', 'absolute')
        .style('width', '100%')
        .style('height', '100%')
        .style('top', '0px')
        .style('left', '0px')
        // .style('max-height', ($(document).height() * 0.8) + 'px')
      svg.svg = d3
        .select(svgDiv)
        .append('svg')
        // .attr('preserveAspectRatio', 'xMidYMid meet')
        // .attr('viewBox', '0 0 ' + lenD.w[0] + ' ' + lenD.h[0])
        .style('width', '100%')
        .style('height', '100%')
        .style('top', '0%')
        .style('left', '0%')

      function adjustDim () {
        box.urgentPlots = {
          x: 0,
          y: 0,
          w: $(svg.svg.node()).width(),
          h: middleSeparation - 20 // $(svg.svg.node()).height() * 0.5
        }
        svgUrgentPlots.adjustScrollBox()
        svgUrgentPlots.updateData()

        box.pinnedPlots = {
          x: 0,
          y: $(svg.svg.node()).height() * 0.5,
          w: $(svg.svg.node()).width() * 0.5,
          h: $(svg.svg.node()).height() * 0.5
        }
        svgPinnedPlots.adjustScrollBox()
        svgPinnedPlots.adjustPlotDistribution()
      }

      $(window).resize(
        function () {
          adjustDim()
        })

      if (disableScrollSVG) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }
      svg.back = svg.svg.append('g')
      svg.g = svg.svg.append('g')

      middleSeparation = $(svg.svg.node()).height() * 0.365
    }
    function initBackground () {
      svg.svg.style('background', colorPalette.medium.background)
      let middleBarPos = {
        x: 0,
        y: middleSeparation
      }
      function dragstarted (d) {}
      function dragged (d) {
        console.log(middleBarPos.y, d3.event.dy)
        middleBarPos.y = middleBarPos.y + d3.event.dy
        gmiddle.attr('transform', 'translate(' + middleBarPos.x + ',' + middleBarPos.y + ')')
      }
      function dragended (d) {}

      let gmiddle = svg.back.append('g')
        .attr('transform', 'translate(' + middleBarPos.x + ',' + middleBarPos.y + ')')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))
      gmiddle.append('rect')
        .attr('x', 0)
        .attr('y', -10)
        .attr('width', $(svg.svg.node()).width())
        .attr('height', 20)
        .style('opacity', 0)
        .style('cursor', 'pointer')
      gmiddle.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', $(svg.svg.node()).width())
        .attr('y2', 0)
        .attr('stroke', '#000000')
        .attr('stroke-width', 4)
        .attr('stroke-opacity', 0.6)
        .style('pointer-events', 'none')
      gmiddle.append('svg:image')
        .attr('xlink:href', '/static/icons/up-triangle.svg')
        .attr('x', ($(svg.svg.node()).width() - 18) + 'px')
        .attr('y', -14 + 'px')
        .attr('width', '12px')
        .attr('height', '12px')
        .style('pointer-events', 'none')
      gmiddle.append('svg:image')
        .attr('xlink:href', '/static/icons/down-triangle.svg')
        .attr('x', ($(svg.svg.node()).width() - 18) + 'px')
        .attr('y', 2 + 'px')
        .attr('width', '12px')
        .attr('height', '12px')
        .style('pointer-events', 'none')
    }
    function initBox () {
      box.urgentPlots = {
        x: 0,
        y: 0,
        w: $(svg.svg.node()).width(),
        h: middleSeparation - 20
      }
      box.pinnedPlots = {
        x: 0,
        y: middleSeparation + 20,
        w: $(svg.svg.node()).width() * 0.5,
        h: $(svg.svg.node()).height() - middleSeparation - 20
      }
      box.focusPlots = {
        x: $(svg.svg.node()).width() * 0.5,
        y: middleSeparation + 20,
        w: $(svg.svg.node()).width() * 0.5,
        h: $(svg.svg.node()).height() - middleSeparation - 20
      }
    }
    function initDefaultStyle () {
      shared.style = {}
      shared.style.runRecCol = colsBlues[2]
      shared.style.blockCol = function (optIn) {
        // let endTime = hasVar(optIn.endTime)
        //   ? optIn.endTime
        //   : undefined
        // if (endTime < Number(shared.data.server.timeOfNight.now)) return colorPalette.blocks.shutdown
        let state = hasVar(optIn.exeState.state)
          ? optIn.exeState.state
          : undefined
        let canRun = hasVar(optIn.exeState.canRun)
          ? optIn.exeState.canRun
          : undefined
        if (state === 'wait') {
          return colorPalette.blocks.wait
        } else if (state === 'done') {
          return colorPalette.blocks.done
        } else if (state === 'fail') {
          return colorPalette.blocks.fail
        } else if (state === 'run') {
          return colorPalette.blocks.run
        } else if (state === 'cancel') {
          if (hasVar(canRun)) {
            if (!canRun) return colorPalette.blocks.cancelOp
          }
          return colorPalette.blocks.cancelSys
        } else return colorPalette.blocks.shutdown
      }
    }

    if (sock.multipleInit({ id: widgetId, data: dataIn })) return

    sock.setBadgeIcon({ nIcon: dataIn.nIcon, iconDivV: iconDivV })

    let svgDivId = sgvTag.main.id + ''
    let parent = sgvTag.main.widget.getEle(sgvTag.main.id)

    let svgDiv = sgvTag.main.widget.getEle(svgDivId)
    if (!hasVar(svgDiv)) {
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

    shared.server = dataIn.data
    shared.time.current = new Date(shared.server.timeOfNight.date_now)
    shared.time.range = 1000 * (3600 * parseInt(3) + 60 * parseInt(0))
    shared.time.from = new Date()
    shared.time.from.setTime(shared.time.current.getTime() - shared.time.range)

    // loadMesures()

    svgUrgentPlots.initData()
    // svgPinnedPlots.initData()
    drawfakefocus()
  }
  this.initData = initData
  function updateDataOnce (dataIn) {
    if (shared.mode === 'standby') return
    if (!locker.isFreeV(['pushNewSchedule'])) {
      setTimeout(function () {
        updateDataOnce(dataIn)
      }, 10)
      return
    }

    locker.add('updateData')
    for (let key in dataIn.data) {
      shared.server[key] = dataIn.data[key]
    }
    shared.time.current = new Date(shared.server.timeOfNight.date_now)
    // updateMeasures()
    // svgPinnedPlots.updateData()
    svgUrgentPlots.updateData()

    locker.remove('updateData')
  }
  function updateData (dataIn) {
    runLoop.push({ tag: 'updateData', data: dataIn })
  }
  this.updateData = updateData
  runLoop.init({ tag: 'updateData', func: updateDataOnce, nKeep: 1 })

  function initScrollBox (tag, g, box, background, isVertical) {
    if (background.enabled) {
      g.append('rect')
        .attr('class', 'background')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.w)
        .attr('height', box.h)
        .style('fill', background.fill)
        .style('stroke', background.stroke)
        .style('stroke-width', background.strokeWidth)
    }

    let scrollBox = new ScrollBox()
    scrollBox.init({
      tag: tag,
      gBox: g,
      boxData: {
        x: 0,
        y: 0,
        w: box.w,
        h: box.h
      },
      useRelativeCoords: true,
      locker: new Locker(),
      lockerV: [tag + 'updateData'],
      lockerZoom: {
        all: tag + 'zoom',
        during: tag + 'zoomDuring',
        end: tag + 'zoomEnd'
      },
      runLoop: new RunLoop({tag: tag}),
      canScroll: true,
      scrollVertical: isVertical,
      scrollHorizontal: !isVertical,
      scrollHeight: 0,
      scrollWidth: 0,
      background: 'transparent',
      scrollRecH: {h: 4},
      scrollRecV: {w: 4}
    })
    return scrollBox
  }
  let colorCategory = ['#440154FF', '#482677FF', '#404788FF', '#33638DFF', '#287D8EFF', '#1F968BFF', '#29AF7FFF', '#55C667FF', '#95D840FF', '#DCE319FF']
  // let colorCategory = ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#dedede','#c7eae5','#80cdc1','#35978f','#01665e','#003c30']
  function updateMeasures () {
    function addPlot () {
      for (let z = 0; z < shared.server.urgentKey.length; z++) {
        if (Math.random() > 0.85) {
          // let insert = true
          let toadd = {id: 'id' + Math.floor(Math.random() * 200), added: shared.time.current, type: shared.server.urgentKey[z], name: shared.server.urgentKey[z], status: fillfun(0), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
          shared.server.fullList.push(toadd)
          shared.server.urgentCurrent[z].data.push(toadd)
          shared.server.category[z].data.push(toadd)
          // insert = false
          // if (insert) {
          //   shared.server.urgentCurrent.push({key: shared.server.urgentKey[z], data: [toadd]})
          // }

          if (shared.server.history.timeStamp.length === 0) {
            shared.server.history.timeStamp.push({key: shared.time.current})
          }
          if (shared.server.history.timeStamp.length > 0 && shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1].key === shared.time.current) {
            if (shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1].hasOwnProperty(toadd.type)) shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1][toadd.type].data.push(toadd)
            else shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1][toadd.type] = {data: [toadd], remove: []}
            let tot = 0
            $.each(shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1], function (key, value) {
              if (key !== 'key' && value.data.length > shared.server.history.max) shared.server.history.max = value.data.length
            })
            // if (tot > shared.server.history.max) {
            //   shared.server.history.max = tot
            // }
          } else {
            let newt = deepCopy(shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1])
            newt.key = shared.time.current
            if (newt.hasOwnProperty(toadd.type)) newt[toadd.type].data.push(toadd)
            else newt[toadd.type] = {data: [toadd], remove: []}
            shared.server.history.timeStamp.push(newt)
            let tot = 0
            $.each(newt, function (key, value) {
              if (key !== 'key' && value.data.length > shared.server.history.max) shared.server.history.max = value.data.length
            })
            // if (tot > shared.server.history.max) {
            //   shared.server.history.max = tot
            // }
          }
        }
      }
    }
    function update () {
      // for (let z = shared.server.urgentCurrent.length - 1; z >= 0; z--) {
      //   let type = shared.server.urgentCurrent[z][0].type
      //   for (let i = shared.server.urgentCurrent[z].length - 1; i >= 0; i--) {
      //     let todelete = Math.random() > 0.95
      //     if (todelete && !shared.server.urgentCurrent[z][i].ended) {
      //       shared.server.urgentCurrent[z][i].ended = shared.time.current
      //       // shared.server.urgentCurrent[z].splice(i, 1)
      //       // continue
      //     }
      //     shared.server.urgentCurrent[z][i].status = fillfun(index)
      //     index += 1
      //     for (let j = 0; j < shared.server.urgentCurrent[z][i].subMeasures.length; j++) {
      //       shared.server.urgentCurrent[z][i].subMeasures[j].status = fillfun(index)
      //       index += 1
      //     }
      //   }
      //   for (let i = shared.server.urgentCurrent[z].length - 1; i >= 0; i--) {
      //     if (shared.server.urgentCurrent[z][i].ended) {
      //       if ((shared.time.current.getTime() - shared.server.urgentCurrent[z][i].ended.getTime()) > 400000) shared.server.urgentCurrent[z].splice(i, 1)
      //     }
      //   }
      // }
    }
    function removePlot () {
      for (let z = 0; z < shared.server.urgentKey.length; z++) {
        for (let i = shared.server.urgentCurrent[z].data.length - 1; i >= 0; i--) {
          if (Math.random() > 0.95) {
            let rem = shared.server.urgentCurrent[z].data.splice(i, 1)[0]
            rem.ended = shared.time.current

            // let insert = true
            // for (let i = 0; i < shared.server.fullList.length; i++) {
            //   if (shared.server.fullList[i].key === rem.type) {
            //     shared.server.fullList[i].data.push(rem)
            //     insert = false
            //     continue
            //   }
            // }
            // if (insert) {
            //   shared.server.fullList.push({key: rem.type,
            //     data: [rem]})
            // }
            // if (shared.server.urgentCurrent[z].data.length === 0) shared.server.urgentCurrent.splice(z, 1)

            if (shared.server.history.timeStamp.length > 0 && shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1].key === shared.time.current) {
              let index = shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1][rem.type].data.indexOf(rem.id)
              if (index !== -1) {
                shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1][rem.type].data.splice(index, 1)
                shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1][rem.type].remove.push(rem)
              }
            } else {
              let newt = deepCopy(shared.server.history.timeStamp[shared.server.history.timeStamp.length - 1])
              Object.keys(newt).forEach(function (key) { if (key !== 'key') newt[key].remove = [] })
              newt.key = shared.time.current
              newt[rem.type].data.splice(newt[rem.type].data.indexOf(rem.id), 1)
              newt[rem.type].remove.push(rem)
              shared.server.history.timeStamp.push(newt)
            }
          }
        }
      }
    }

    let fillfun = function (index) {
      let status = {current: '', previous: []}
      status.current = deepCopy(shared.server.dataOut[Math.floor(index / 4)][index % 4].data[0])
      status.current.x = new Date(shared.server.timeOfNight.date_now)
      status.gradient = Math.floor((Math.random() * 20) - 10)
      for (let i = 0; i < (shared.time.range / 100 / 3600); i++) {
        if (shared.server.dataOut[Math.floor(index / 4)][index % 4].data[i * 2] === undefined ||
          shared.server.dataOut[Math.floor(index / 4)][index % 4].data[i * 2].y === undefined) break
        status.previous.push(deepCopy(shared.server.dataOut[Math.floor(index / 4)][index % 4].data[i * 2]))
        status.previous[i].x = new Date()
        status.previous[i].x.setTime(status.current.x.getTime() - i * 3600 * 100)
      }
      return status
    }

    removePlot()
    update()
    addPlot()
  }
  function loadMesures () {
    let fillfun = function (index) {
      index = 0
      let status = {current: '', previous: []}
      status.current = deepCopy(shared.server.dataOut[Math.floor(index / 4)][index % 4].data[0])
      status.current.x = new Date(shared.server.timeOfNight.date_now)
      status.gradient = Math.floor((Math.random() * 20) - 10)
      for (let i = 0; i < (shared.time.range / 100 / 3600); i++) {
        if (shared.server.dataOut[Math.floor(index / 4)][index % 4].data[i * 2] === undefined ||
          shared.server.dataOut[Math.floor(index / 4)][index % 4].data[i * 2].y === undefined) break
        status.previous.push(deepCopy(shared.server.dataOut[Math.floor(index / 4)][index % 4].data[i * 2]))
        status.previous[i].x = new Date()
        status.previous[i].x.setTime(status.current.x.getTime() - i * 3600 * 100)
      }
      return status
    }
    shared.server.urgentCurrent = []
    shared.server.category = []
    for (let z = 0; z < shared.server.urgentKey.length; z++) {
      shared.server.urgentCurrent.push({key: shared.server.urgentKey[z], data: []})
      shared.server.category.push({key: shared.server.urgentKey[z], data: []})
    }
    shared.server.fullList = []

    // let index = 0
    // // let A = [
    // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
    // //     {id: 'id4', name: 'subMeasure.14', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
    // //   ]},
    // //   {id: 'id5', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure5', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   // {id: 'id6', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   // {id: 'id7', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   // {id: 'id8', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   // {id: 'id9', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
    // //   //   {id: 'id10', name: 'subMeasure.14', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
    // //   // ]},
    // //   // {id: 'id11', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure5', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
    // // ]
    // // let B = [
    // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // // ]
    // // index = 0
    // // let C = [
    // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure10', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure11', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
    // //     {id: 'id4', name: 'subMeasure.14', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
    // //   ]}
    // // ]
    // // let D = [
    // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // // ]
    // // index = 0
    // // let E = [
    // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    // // ]
    // // shared.server.urgentCurrent = [
    // //   A,
    // //   B,
    // //   C,
    // //   D,
    // //   E
    // // ]
    //
    // let weatherP = [
    //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
    //     {id: 'id4', name: 'subMeasure.14', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
    //   ]},
    //   {id: 'id5', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id6', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id7', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id8', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
    //     {id: 'id9', name: 'subMeasure.14', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
    //   ]},
    //   {id: 'id10', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure5', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
    // ]
    // index = 0
    // let telescopesP = [
    //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id4', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id5', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id6', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id7', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id8', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id9', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id10', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
    // ]
    // index = 0
    // let otherP = [
    //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
    // ]
    // shared.server.pinned = [
    //   weatherP,
    //   telescopesP,
    //   otherP
    // ]

    shared.server.history = {max: 0, min: 0, timeStamp: []}
  }

  function drawfakefocus () {
    return
    let plotlistg = svg.svg.append('g')
      .attr('transform', 'translate(' + box.focusPlots.x + ',' + box.focusPlots.y + ')')
      .style('pointer-events', 'auto')
    let topg = plotlistg.append('g')
    let bottomg = plotlistg.append('g').attr('transform', 'translate(' + 0 + ',' + box.focusPlots.h * 0.6 + ')')

    function createPlot (optIn) {
      let plot = new PlotTimeSeries()
      plot.init({
        main: {
          g: optIn.g,
          box: optIn.box,
          clipping: true
        },
        interaction: {
          pinned: {
            enabled: false,
            event: () => { console.log('pinned') }
          },
          remove: {
            enabled: false,
            event: () => { console.log('remove') }
          }
        },
        axis: [
          {
            id: 'bottom',
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: 0, w: 0, h: optIn.box.h, marg: 0},
              type: 'bottom',
              attr: {
                text: {
                  enabled: false,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                tickSize: -optIn.box.h
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            brush: {
              zoom: true,
              brush: true
            }
          },
          {
            id: 'left',
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: 0, w: 0, h: 0, marg: 0},
              type: 'left',
              mode: 'linear',
              attr: {
                text: {
                  enabled: false,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                tickSize: -optIn.box.w
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            brush: {
              zoom: true,
              brush: true
            }
          }
          // {
          //   id: 'right',
          //   showAxis: true,
          //   main: {
          //     g: undefined,
          //     box: {x: plotbox.w, y: 0, w: 0, h: 0, marg: 0},
          //     type: 'right',
          //     mode: 'linear',
          //     attr: {
          //       text: {
          //         enabled: true,
          //         size: 11,
          //         stroke: colorPalette.medium.stroke,
          //         fill: colorPalette.medium.stroke
          //       },
          //       path: {
          //         enabled: true,
          //         stroke: colorPalette.medium.stroke,
          //         fill: colorPalette.medium.stroke
          //       },
          //       tickSize: -plotbox.w
          //     }
          //   },
          //   axis: undefined,
          //   scale: undefined,
          //   domain: [0, 1000],
          //   range: [0, 0],
          //   brush: {
          //     zoom: true,
          //     brush: true
          //   }
          // }
        ],
        content: []
      })
      return plot
    }

    let plotb = {
      x: 0,
      y: 0,
      w: box.focusPlots.w * 0.9,
      h: box.focusPlots.h * 0.6
    }
    let optIn = {g: topg,
      box: plotb
    }
    optIn.g = optIn.g.append('g') // .style('opacity', 0.8)
    let plotObject = createPlot(optIn)
    let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
    let endTime = {date: new Date(shared.server.timeOfNight.date_now), time: Number(shared.server.timeOfNight.now)}

    plotObject.updateAxis({
      id: 'bottom',
      domain: [startTime.date, endTime.date],
      range: [0, plotb.w]
    })
    plotObject.updateAxis({
      id: 'left',
      domain: [0, 100],
      range: [plotb.h, 0]
    })
    plotObject.bindData(shared.server.urgentCurrent[0][0].id, [shared.server.urgentCurrent[0][0].status.current].concat(shared.server.urgentCurrent[0][0].status.previous), 'bottom', 'left')
  }

  let SvgPinnedPlots = function () {
    let topg
    let topDim

    let bottomg
    let bottomDim

    let middleg
    let scrollbox

    let plotbox = {
      x: 0,
      y: 0,
      w: 100,
      h: 80
    }
    let allPlots

    function adjustScrollBox () {
      if (!scrollbox) return
      let nbperline = Math.floor(box.pinnedPlots.w / (plotbox.w + 29))
      let tot = 0
      for (let i = 0; i < shared.server.urgentCurrent.length; i++) {
        tot += shared.server.urgentCurrent[i].length
      }
      scrollbox.updateBox({x: 0, y: 40, w: box.pinnedPlots.w, h: box.pinnedPlots.h - 80})
      scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: (15 + plotbox.h * 0.15 + (plotbox.h + 20) * Math.ceil(tot / nbperline))})
      // scrollbox.updateHorizontalScroller({canScroll: true, scrollWidth: 0})
    }
    this.adjustScrollBox = adjustScrollBox
    // function adjustPlotDistribution () {
    //   // let nbperline = Math.floor(box.pinnedPlots.w / (plotbox.w + 29))
    //   // console.log(d3.select(plotList[6].get('main').g.node().parentNode.parentNode.parentNode.parentNode).attr('transform'))
    //   for (let i = 0; i < shared.server.urgentCurrent.length.length; i++) {
    //
    //   }
    // }
    // this.adjustPlotDistribution = adjustPlotDistribution
    function createPlot (optIn) {
      let plot = new PlotTimeSeries()
      plot.init({
        main: {
          g: optIn.g,
          box: optIn.box,
          clipping: true
        },
        interaction: {
          pinned: {
            enabled: false,
            event: () => { console.log('pinned') }
          },
          remove: {
            enabled: false,
            event: () => { console.log('remove') }
          }
        },
        axis: [
          {
            id: 'bottom',
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: 0, w: 0, h: optIn.box.h, marg: 0},
              type: 'bottom',
              attr: {
                text: {
                  enabled: false,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                tickSize: -optIn.box.h
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            brush: {
              zoom: true,
              brush: true
            }
          },
          {
            id: 'left',
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: 0, w: 0, h: 0, marg: 0},
              type: 'left',
              mode: 'linear',
              attr: {
                text: {
                  enabled: false,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                tickSize: -optIn.box.w
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            brush: {
              zoom: true,
              brush: true
            }
          }
          // {
          //   id: 'right',
          //   showAxis: true,
          //   main: {
          //     g: undefined,
          //     box: {x: plotbox.w, y: 0, w: 0, h: 0, marg: 0},
          //     type: 'right',
          //     mode: 'linear',
          //     attr: {
          //       text: {
          //         enabled: true,
          //         size: 11,
          //         stroke: colorPalette.medium.stroke,
          //         fill: colorPalette.medium.stroke
          //       },
          //       path: {
          //         enabled: true,
          //         stroke: colorPalette.medium.stroke,
          //         fill: colorPalette.medium.stroke
          //       },
          //       tickSize: -plotbox.w
          //     }
          //   },
          //   axis: undefined,
          //   scale: undefined,
          //   domain: [0, 1000],
          //   range: [0, 0],
          //   brush: {
          //     zoom: true,
          //     brush: true
          //   }
          // }
        ],
        content: []
      })
      return plot
    }

    function initData () {
      topDim = {x: 0, y: 0, w: box.pinnedPlots.w, h: 40}
      bottomDim = {x: 0, y: box.pinnedPlots.h - 40, w: box.pinnedPlots.w, h: 40}

      let plotlistg = svg.svg.append('g').attr('id', 'plotList')
        .attr('transform', 'translate(' + box.pinnedPlots.x + ',' + box.pinnedPlots.y + ')')
        .style('pointer-events', 'auto')
      topg = plotlistg.append('g').attr('id', 'topurgent').attr('transform', 'translate(' + topDim.x + ',' + topDim.y + ')')
      bottomg = plotlistg.append('g').attr('id', 'bottomurgent').attr('transform', 'translate(' + bottomDim.x + ',' + bottomDim.y + ')')
      middleg = plotlistg.append('g').attr('id', 'plotListscroll').attr('transform', 'translate(' + 0 + ',' + 0 + ')')
      scrollbox = initScrollBox('pinnedPlotsScrollbox', middleg, box.pinnedPlots, {}, true)

      updateData()

      adjustScrollBox()

      // plotlistg.append('rect')
      //   .attr('x', box.pinnedPlots.x + box.pinnedPlots.w * 0.26)
      //   .attr('y', box.pinnedPlots.y)
      //   .attr('width', '200px')
      //   .attr('height', '20px')
      //   .attr('fill', colorPalette.darkest.background) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // plotlistg.append('text')
      //   .text('Pinned Plots')
      //   .style('fill', '#000000')
      //   .style('font-weight', 'bold')
      //   .style('font-size', '14px')
      //   .attr('text-anchor', 'start')
      //   .attr('transform', 'translate(' + (box.pinnedPlots.x + box.pinnedPlots.w * 0.26 + 10) + ',' + (box.pinnedPlots.y + 16) + ')')

      // function drawFakeTitle () {
      //   function drawTitle (i) {
      //     plotlistg.append('text')
      //       .text('Title')
      //       .style('fill', '#000000')
      //       .style('font-weight', 'bold')
      //       .style('font-size', '14px')
      //       .attr('text-anchor', 'start')
      //       .attr('transform', 'translate(' + (box.pinnedPlots.x + 10) + ',' + (box.pinnedPlots.y + 30 + i * 18) + ')')
      //   }
      //   function drawLine (i) {
      //     plotlistg.append('text')
      //       .text('Information Information')
      //       .style('fill', '#000000')
      //       .style('font-weight', '')
      //       .style('font-size', '12px')
      //       .attr('text-anchor', 'start')
      //       .attr('transform', 'translate(' + (box.pinnedPlots.x + 16) + ',' + (box.pinnedPlots.y + 30 + i * 18) + ')')
      //   }
      //   drawTitle(0)
      //   drawLine(1)
      //   drawLine(2)
      //   drawLine(3)
      //   drawLine(4)
      //   drawTitle(5)
      //   drawLine(6)
      //   drawLine(7)
      //   drawTitle(8)
      //   drawLine(9)
      //   drawLine(10)
      //   drawLine(11)
      //   drawLine(12)
      //   drawLine(13)
      //   drawLine(14)
      //   drawTitle(15)
      //   drawLine(16)
      //   drawLine(17)
      //   drawLine(18)
      //   drawLine(19)
      //   drawLine(20)
      // }
      // drawFakeTitle()
    }
    this.initData = initData

    function updateData () {
      let offset = 5
      let groupOffset = 0

      let tot = 0
      for (let i = 0; i < shared.server.urgentCurrent.length; i++) {
        tot += shared.server.urgentCurrent[i].length
      }
      let nbperline = Math.floor(box.pinnedPlots.w / (plotbox.w + offset))
      let xlimArray = []
      let limit = 0
      for (let i = 0; i < shared.server.urgentCurrent.length; i++) {
        let inter = Math.round((shared.server.urgentCurrent[i].length * nbperline) / tot)
        if (inter < 1) inter = 1
        xlimArray.push(inter)
        limit += inter
      }
      while (limit > nbperline) {
        xlimArray[xlimArray.indexOf(Math.max(...xlimArray))] -= 1
        limit -= 1
      }
      let plotb = {
        x: plotbox.x + plotbox.w * 0.05,
        y: plotbox.y + plotbox.h * 0.35,
        w: plotbox.w * 0.4,
        h: plotbox.h * 0.4
      }
      console.log(nbperline, xlimArray);

      function drawTopg () {
        let allGroup = topg.selectAll('g.group')
          .data(shared.server.urgentCurrent)
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'group')
        gEnterGroup.each(function (d, i) {
          let xlim = xlimArray[i]
          d3.select(this).append('rect')
            .attr('x', offset)
            .attr('y', 0)
            .attr('width', plotbox.w - offset)
            .attr('height', '40px')
            .attr('stroke', (d) => {
              if (d[0].type === 'weather') return '#4c11a2'
              if (d[0].type === 'other') return '#0065be'
              if (d[0].type === 'telescopes') return '#6b8998'
              return 'none'
            })
            .attr('stroke-width', 0)
            .style('fill-opacity', 0.2)
            .attr('fill', (d) => {
              if (d[0].type === 'weather') return '#4c11a2'
              if (d[0].type === 'other') return '#0065be'
              if (d[0].type === 'telescopes') return '#6b8998'
              return 'none'
            })
          d3.select(this).append('rect')
            .attr('x', offset)
            .attr('y', 38)
            .attr('width', (plotbox.w + offset) * xlim - offset)
            .attr('height', '2px')
            .attr('stroke', (d) => {
              if (d[0].type === 'weather') return '#4c11a2'
              if (d[0].type === 'other') return '#0065be'
              if (d[0].type === 'telescopes') return '#6b8998'
              return 'none'
            })
            .attr('stroke-width', 0)
            .style('fill-opacity', 0.2)
            .attr('fill', (d) => {
              if (d[0].type === 'weather') return '#4c11a2'
              if (d[0].type === 'other') return '#0065be'
              if (d[0].type === 'telescopes') return '#6b8998'
              return 'none'
            })
          d3.select(this).append('text')
            .text(d[0].type)
            .style('fill', '#000000')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (box.pinnedPlots.x + 10) + ',' + (16) + ')')
          d3.select(this)
            .transition()
            .duration(400)
            .attr('transform', 'translate(' + (groupOffset) + ',' + (0) + ')')
          groupOffset += xlim * (offset + (plotbox.w))
        })
        groupOffset = 0
        let gMergeGroup = allGroup.merge(gEnterGroup)
        gMergeGroup.each(function (d, i) {
          let xlim = xlimArray[i]
          d3.select(this)
            .transition()
            .duration(800)
            .attr('transform', 'translate(' + (groupOffset) + ',' + (0) + ')')
          groupOffset += xlim * (offset + (plotbox.w))
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }
      function drawMiddleg () {
        let allGroup = scrollbox.get('innerG').selectAll('g.group')
          .data(shared.server.urgentCurrent)
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'group')
        gEnterGroup.each(function (d, i) {
          let xlim = xlimArray[i]
          d3.select(this)
            .transition()
            .duration(400)
            .attr('transform', 'translate(' + (groupOffset) + ',' + (0) + ')')
          groupOffset += xlim * (offset + (plotbox.w))
        })
        groupOffset = 0
        let gMergeGroup = allGroup.merge(gEnterGroup)
        gMergeGroup.each(function (d, i) {
          allPlots = d3.select(this).selectAll('g.plot')
            .data(d, function (dd) {
              return dd.id
            })
          let gEnter = allPlots.enter()
            .append('g')
            .attr('class', 'plot')
          gEnter.each(function (dd, ii) {
            d3.select(this).append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', plotbox.w - offset)
              .attr('height', plotbox.h - offset)
              .attr('stroke', colorPalette.bright.stroke)
              .attr('stroke-width', 0.2)
              .style('fill-opacity', 1)
              .attr('fill', colorPalette.bright.background)
            d3.select(this).append('text')
              .text(dd.name)
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('font-size', '12px')
              .attr('text-anchor', 'start')
              .attr('transform', 'translate(' + (offset) + ',' + (12 + offset) + ')')
            d3.select(this).append('text')
              .text(dd.unit)
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('font-size', '12px')
              .attr('text-anchor', 'end')
              .attr('transform', 'translate(' + (plotbox.w - offset * 3) + ',' + (12 + offset) + ')')
            d3.select(this).append('text')
              .text('80')
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('font-size', '11px')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(' + (plotbox.w * 0.75) + ',' + (plotbox.h * 0.6 + 12) + ')')
            d3.select(this).append('text')
              .text(dd.status.current.y)
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('font-size', '22px')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(' + (plotbox.w * 0.75) + ',' + (plotbox.h * 0.38 + 12) + ')')
            d3.select(this).append('rect')
              .attr('id', 'disapearingBar')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', plotbox.w - offset)
              .attr('height', plotbox.h - offset)
              .style('fill-opacity', 0.4)
              .attr('fill', (d) => {
                if (d.type === 'weather') return '#4c11a2'
                if (d.type === 'other') return '#0065be'
                if (d.type === 'telescopes') return '#6b8998'
                return 'none'
              })
              .transition()
              .delay(4000)
              .duration(2000)
              .attr('y', plotbox.h - offset * 2)
              .attr('height', offset * 1)
            let optIn = {g: d3.select(this),
              box: plotb
            }
            optIn.g = optIn.g.append('g') // .style('opacity', 0.8)
            dd.plotObject = createPlot(optIn)

            let xlim = xlimArray[i]
            d3.select(this)
              .attr('transform', 'translate(' + (offset + (plotbox.w) * (ii % xlim)) + ',' + (offset + (plotbox.h + offset) * parseInt(ii / xlim)) + ')')
          })
          let gMerge = allPlots.merge(gEnter)
          gMerge.each(function (dd, ii) {
            let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
            let endTime = {date: new Date(shared.server.timeOfNight.date_now), time: Number(shared.server.timeOfNight.now)}

            dd.plotObject.updateAxis({
              id: 'bottom',
              domain: [startTime.date, endTime.date],
              range: [0, plotb.w]
            })
            dd.plotObject.updateAxis({
              id: 'left',
              domain: [0, 100],
              range: [plotb.h, 0]
            })
            dd.plotObject.bindData(dd.id, [dd.status.current].concat(dd.status.previous), 'bottom', 'left')

            if (dd.ended) {
              let percent = (shared.time.current.getTime() - dd.ended.getTime()) / 400000
              d3.select(this).style('opacity', 1 - percent)
              d3.select(this).select('rect#disapearingBar')
                .attr('width', (plotbox.w - offset) * ((1 - percent) < 0 ? 0 : (1 - percent)))
            }

            let xlim = xlimArray[i]
            d3.select(this)
              .transition()
              .duration(800)
              .attr('transform', 'translate(' + (offset + (plotbox.w) * (ii % xlim)) + ',' + (offset + (plotbox.h + offset) * parseInt(ii / xlim)) + ')')
          })
          allPlots
            .exit()
            .style('opacity', 0)
            .remove()

          let xlim = xlimArray[i]
          d3.select(this)
            .transition()
            .duration(800)
            .attr('transform', 'translate(' + (groupOffset) + ',' + (0) + ')')
          groupOffset += xlim * (offset + (plotbox.w))
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }
      function drawBottomg () {
        let allGroup = bottomg.selectAll('g.group')
          .data(shared.server.urgentCurrent)
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'group')
        gEnterGroup.each(function (d, i) {
          let xlim = xlimArray[i]
          d3.select(this).append('rect')
            .attr('x', offset)
            .attr('y', 0)
            .attr('width', plotbox.w - offset)
            .attr('height', '40px')
            .attr('stroke', (d) => {
              if (d[0].type === 'weather') return '#4c11a2'
              if (d[0].type === 'other') return '#0065be'
              if (d[0].type === 'telescopes') return '#6b8998'
              return 'none'
            })
            .attr('stroke-width', 0)
            .style('fill-opacity', 0.2)
            .attr('fill', (d) => {
              if (d[0].type === 'weather') return '#4c11a2'
              if (d[0].type === 'other') return '#0065be'
              if (d[0].type === 'telescopes') return '#6b8998'
              return 'none'
            })
          d3.select(this).append('rect')
            .attr('x', offset)
            .attr('y', 0)
            .attr('width', (plotbox.w + offset) * xlim - offset)
            .attr('height', '2px')
            .attr('stroke', (d) => {
              if (d[0].type === 'weather') return '#4c11a2'
              if (d[0].type === 'other') return '#0065be'
              if (d[0].type === 'telescopes') return '#6b8998'
              return 'none'
            })
            .attr('stroke-width', 0)
            .style('fill-opacity', 0.2)
            .attr('fill', (d) => {
              if (d[0].type === 'weather') return '#4c11a2'
              if (d[0].type === 'other') return '#0065be'
              if (d[0].type === 'telescopes') return '#6b8998'
              return 'none'
            })
          d3.select(this).append('text')
            .text(d[0].type)
            .style('fill', '#000000')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (box.pinnedPlots.x + 10) + ',' + (box.pinnedPlots.y + 16) + ')')
          d3.select(this)
            .transition()
            .duration(400)
            .attr('transform', 'translate(' + (groupOffset) + ',' + (0) + ')')
          groupOffset += xlim * (offset + (plotbox.w))
        })
        groupOffset = 0
        let gMergeGroup = allGroup.merge(gEnterGroup)
        gMergeGroup.each(function (d, i) {
          let xlim = xlimArray[i]
          d3.select(this)
            .transition()
            .duration(800)
            .attr('transform', 'translate(' + (groupOffset) + ',' + (0) + ')')
          groupOffset += xlim * (offset + (plotbox.w))
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }

      drawTopg()
      drawMiddleg()
      drawBottomg()
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgUrgentPlots = function () {
    let leftg
    let leftDim
    let categoryBox
    let categoryDim
    let itemBox
    let itemDim

    let middleg
    let middleDim

    let rightg
    let rightCats
    let rightItems
    let scrollbox
    let rightDim
    let rightBox

    let plotbox = {
      x: 0,
      y: 0,
      w: 90,
      h: 70
    }
    let allPlots
    let miniPlotsVect = {}

    let middleplot
    let overlaymiddleplot
    let line
    let spaceline

    let categoryfocus = []
    let focusScrollbox

    function createPlot (optIn) {
      let plot = new PlotTimeSeries()
      plot.init({
        main: {
          g: optIn.g,
          box: optIn.box,
          clipping: true
        },
        interaction: {
          pinned: {
            enabled: false,
            event: () => { console.log('pinned') }
          },
          remove: {
            enabled: false,
            event: () => { console.log('remove') }
          }
        },
        axis: [
          {
            id: 'bottom',
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: 0, w: 0, h: optIn.box.h, marg: 0},
              type: 'bottom',
              attr: {
                text: {
                  enabled: false,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                tickSize: -optIn.box.h
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            brush: {
              zoom: true,
              brush: true
            }
          },
          {
            id: 'left',
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: 0, w: 0, h: 0, marg: 0},
              type: 'left',
              mode: 'linear',
              attr: {
                text: {
                  enabled: false,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                tickSize: -optIn.box.w
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            brush: {
              zoom: true,
              brush: true
            }
          }
          // {
          //   id: 'right',
          //   showAxis: true,
          //   main: {
          //     g: undefined,
          //     box: {x: plotbox.w, y: 0, w: 0, h: 0, marg: 0},
          //     type: 'right',
          //     mode: 'linear',
          //     attr: {
          //       text: {
          //         enabled: true,
          //         size: 11,
          //         stroke: colorPalette.medium.stroke,
          //         fill: colorPalette.medium.stroke
          //       },
          //       path: {
          //         enabled: true,
          //         stroke: colorPalette.medium.stroke,
          //         fill: colorPalette.medium.stroke
          //       },
          //       tickSize: -plotbox.w
          //     }
          //   },
          //   axis: undefined,
          //   scale: undefined,
          //   domain: [0, 1000],
          //   range: [0, 0],
          //   brush: {
          //     zoom: true,
          //     brush: true
          //   }
          // }
        ],
        content: []
      })
      return plot
    }
    function createMiddlePlot (optIn) {
      let allGroup = optIn.g.selectAll('g.group')
        .data(shared.server.urgentCurrent)
      let gEnterGroup = allGroup.enter()
        .append('g')
        .attr('class', 'group')
      gEnterGroup.each(function (d, i) {
        let g = d3.select(this)
        g.append('rect')
          .attr('id', 'front')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', middleDim.w)
          .attr('height', spaceline - 2)
          .attr('stroke-width', 0.1)
          .attr('stroke', '#000000')
          .attr('fill', 'none')
      })
      let gMergeGroup = allGroup.merge(gEnterGroup)
      gMergeGroup.each(function (d, i) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', 'translate(' + (0) + ',' + (i * (spaceline) + 2) + ')')
      })
      allGroup
        .exit()
        .style('opacity', 0)
        .remove()

      middleplot = new PlotTimeSeries()
      let optIn2 = {
        main: {
          g: optIn.g,
          box: optIn.box,
          clipping: true
        },
        interaction: {
          pinned: {
            enabled: false,
            event: () => { console.log('pinned') }
          },
          remove: {
            enabled: false,
            event: () => { console.log('remove') }
          }
        },
        axis: [
          {
            id: 'bottom',
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: 0, w: 0, h: optIn.box.h, marg: 0},
              type: 'bottom',
              mode: 'time',
              attr: {
                text: {
                  enabled: true,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                tickSize: 10
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            brush: {
              zoom: true,
              brush: true
            }
          }
        ],
        content: []
      }
      for (let i = 0; i < shared.server.urgentKey.length; i++) {
        optIn2.axis.push(
          {
            id: 'left' + shared.server.urgentKey[i],
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: spaceline * i + 2, w: 0, h: 0, marg: 0},
              type: 'left',
              mode: 'linear',
              attr: {
                text: {
                  enabled: false,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                tickSize: 4
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            brush: {
              zoom: true,
              brush: true
            }
          }
        )
      }
      for (let i = 0; i < shared.server.urgentKey.length; i++) {
        optIn2.axis.push(
          {
            id: 'right' + shared.server.urgentKey[i],
            showAxis: true,
            main: {
              g: undefined,
              box: {x: middleDim.w, y: spaceline * i + 2, w: 0, h: 0, marg: 0},
              type: 'right',
              mode: 'linear',
              attr: {
                text: {
                  enabled: false,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                tickSize: 4
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            brush: {
              zoom: true,
              brush: true
            }
          }
        )
      }
      middleplot.init(optIn2)
      middleplot.getClipping().append('g').attr('id', 'timestampOverlay')
    }

    function initBox () {
      leftDim = {x: 4, y: 10, w: 100, h: box.urgentPlots.h - 20}
      middleDim = {x: (leftDim.x + leftDim.w) + 5, y: 10, w: (box.urgentPlots.w * 0.5) - (leftDim.x + leftDim.w) + 5, h: box.urgentPlots.h - 20}
      rightDim = {x: box.urgentPlots.w * 0.5 + 10, y: 10, w: box.urgentPlots.w * 0.5 - 20, h: box.urgentPlots.h - 20}
    }
    function initLeftPart (g) {
      itemBox = {x: 100, y: leftDim.y, w: 200, h: leftDim.h}
      itemDim = {offsetL: 2, offsetR: 0, offsetT: 2, offsetB: 0, w: 60, h: 60}
      categoryBox = {x: 0, y: leftDim.y, w: 100, h: leftDim.h}
      categoryDim = {offsetL: 0, offsetR: 0, offsetT: 0, offsetB: 0, w: categoryBox.w - 0, h: (categoryBox.h - 0 * shared.server.urgentCurrent.length) / shared.server.urgentCurrent.length}
      leftg = g.append('g').attr('id', 'lefturgent').attr('transform', 'translate(' + leftDim.x + ',' + leftDim.y + ')')
      focusScrollbox = initScrollBox('focusScrollbox', leftg.append('g').attr('transform', 'translate(' + itemBox.x + ',' + 0 + ')'), itemBox, {}, true)
    }
    function initMiddlePart (g) {
      line = shared.server.urgentKey.length
      spaceline = middleDim.h / line
      middleg = g.append('g').attr('id', 'middleurgent').attr('transform', 'translate(' + middleDim.x + ',' + middleDim.y + ')')
      createMiddlePlot({g: middleg, box: middleDim})
    }
    function initRightPart (g) {
      // rightDim = {x: (middleDim.x + middleDim.w) + 5, y: 20, w: (box.urgentPlots.w - leftDim.w) * 0.4, h: box.urgentPlots.h - 10}
      // rightBox = {x: spaceline, y: rightDim.y, w: rightDim.w - spaceline, h: rightDim.h}
      rightBox = {x: spaceline, y: 0, w: rightDim.w - spaceline, h: rightDim.h}
      rightg = g.append('g').attr('id', 'righturgent').attr('transform', 'translate(' + rightDim.x + ',' + rightDim.y + ')')
      rightCats = rightg.append('g').attr('id', 'rightCats').attr('transform', 'translate(' + 0 + ',' + 0 + ')')
      rightItems = rightg.append('g').attr('id', 'rightItems').attr('transform', 'translate(' + rightBox.x + ',' + rightBox.y + ')')
      // rightItems.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', rightBox.w).attr('height', rightBox.h)
      //   .attr('stroke-width', 0)
      //   .style('opacity', 1)
      //   .attr('fill', 'black')
      scrollbox = initScrollBox('urgentPlotsScrollbox', rightg.append('g').attr('transform', 'translate(' + rightBox.x + ',' + 0 + ')'), rightBox, {}, true)
    }
    function initData () {
      let plotlistg = svg.svg.append('g').attr('id', 'plotList')
        .attr('transform', 'translate(' + box.urgentPlots.x + ',' + box.urgentPlots.y + ')')
        .style('pointer-events', 'auto')

      // middleplot = createMiddlePlot({g: plotlistg.append('g'), box: {x: (box.urgentPlots.w * 0.35 - 41), y: 20, w: box.urgentPlots.w * 0.36, h: box.urgentPlots.h - 40}})
      //
      overlaymiddleplot = plotlistg.append('g').attr('transform', 'translate(' + (box.urgentPlots.w * 0.35 - 41) + ',' + (20) + ')')
      // leftg.on('mouseleave', function () {
      //   categoryfocus = []
      //   leftg.selectAll('rect#extendBack').attr('width', categoryDim.w)
      //   drawLeftPart()
      // })

      initBox()
      initMiddlePart(plotlistg)
      initLeftPart(plotlistg)
      initRightPart(plotlistg)

      updateData()
      // adjustScrollBox()
    }
    this.initData = initData

    function updateData () {
      drawMiddlePart()
      drawRightPart()
      drawLeftPart()
    }
    this.updateData = updateData

    function drawMiddlePart () {
      let currentDate = new Date(shared.server.timeOfNight.date_now)
      let previousDate = new Date(shared.server.timeOfNight.date_now).setHours(currentDate.getHours() - 1)
      middleplot.updateAxis({
        id: 'bottom',
        domain: [previousDate, currentDate],
        range: [0, middleDim.w]
      })
      let max = 0
      for (let i = 0; i < shared.server.urgentTimestamp.length; i++) {
        for (let j = 0; j < shared.server.urgentTimestamp[i].data.length; j++) {
          if (max < shared.server.urgentTimestamp[i].data[j].data.length) max = shared.server.urgentTimestamp[i].data[j].data.length
        }
      }
      for (let i = 0; i < shared.server.urgentKey.length; i++) {
        middleplot.updateAxis({
          id: 'right' + shared.server.urgentKey[i],
          domain: [0, max],
          range: [spaceline - 4, 0]
        })
      }
      for (let i = 0; i < shared.server.urgentKey.length; i++) {
        middleplot.updateAxis({
          id: 'left' + shared.server.urgentKey[i],
          domain: [0, max],
          range: [spaceline - 4, 0]
        })
      }

      function drawCurve () {
        let allGroup = middleplot.getClipping().select('g#timestampOverlay').selectAll('g.group')
          .data(shared.server.urgentTimestamp)
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'group')
        let gMergeGroup = allGroup.merge(gEnterGroup)
        gMergeGroup.each(function (d, i) {
          let allTimestamp = d3.select(this).selectAll('g.timeStamp')
            .data(d.data, function (dd, ii) {
              return dd.timeStamp
            })
          let gEnterTimestamp = allTimestamp.enter()
            .append('g')
            .attr('class', 'timeStamp')
          gEnterTimestamp.each(function (dd, ii) {
            let g = d3.select(this)
            g.append('rect')
              .attr('id', d.key + dd.timestamp)
              // .attr('x', 0)
              // .attr('y', middleDim.h - offset - height)
              // .attr('width', width + 1)
              // .attr('height', height)
              .attr('fill', colorCategory[shared.server.urgentKey.indexOf(d.key)])
              // if (d[key].remove.length > 0) {
              //   g.append('circle')
              //     .attr('id', key)
              //     .attr('cx', -0)
              //     .attr('cy', middleDim.h - offset - height - 0)
              //     .attr('r', 4)
              // }
              .on('mouseenter', function () {
                console.log(dd.data);
              })
          })
          let gMergeTimestamp = allTimestamp.merge(gEnterTimestamp)
          gMergeTimestamp.each(function (dd, ii) {
            let width = (d.data.length > 2 && ii < d.data.length - 1) ?
              middleplot.getAxis('bottom').scale(new Date(d.data[ii + 1].timestamp)) - middleplot.getAxis('bottom').scale(new Date(dd.timestamp)) :
              4
            let g = d3.select(this)
            let height = -middleplot.getAxis('right' + d.key).scale(dd.data.length) + middleplot.getAxis('right' + d.key).scale(0)
            // height = spaceline
            g.select('rect#' + d.key + dd.timestamp)
              .attr('x', 0)
              .attr('y', 0 + (spaceline * 0.5 - (height * 0.5)))
              .attr('width', width + 1)
              .attr('height', height)
              // g.select('circle#' + key).attr('cy', middleDim.h - offset - height - 4)

            g.attr('transform', 'translate(' + (middleplot.getAxis('bottom').scale(new Date(dd.timestamp))) + ',' + 0 + ')')
          })
          allTimestamp
            .exit()
            .style('opacity', 0)
            .remove()

          d3.select(this).attr('transform', 'translate(' + (0) + ',' + (i * (categoryDim.offsetT + categoryDim.h) + 2) + ')')
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }
      function drawMiddleg () {
        let allGroup = overlaymiddleplot.selectAll('g.group')
          .data(shared.server.fullList, function (d) {
            return d.key
          })
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'group')
        gEnterGroup.each(function (d, i) {})
        let gMergeGroup = allGroup.merge(gEnterGroup)
        gMergeGroup.each(function (d, i) {
          allPlots = d3.select(this).selectAll('g.plot')
            .data(d.data, function (dd) {
              return dd.id
            })
          let gEnter = allPlots.enter()
            .append('g')
            .attr('class', 'plot')
          gEnter.each(function (dd, ii) {
            d3.select(this).append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', 2)
              .attr('height', 2)
              .attr('stroke', colorPalette.bright.stroke)
              .style('fill-opacity', 1)
              .attr('fill', colorPalette.bright.background)
              .attr('stroke-width', 0.4)
            // d3.select(this).append('text')
            //   .text(dd.name)
            //   .style('fill', '#000000')
            //   .style('font-weight', 'bold')
            //   .style('font-size', '12px')
            //   .style('user-select', 'none')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + (x) + ',' + (0) + ')')
            // d3.select(this).append('text')
            //   .text(dd.status.current.y + '' + dd.unit + '')
            //   .style('fill', '#000000')
            //   .style('font-weight', 'bold')
            //   .style('font-size', '16px')
            //   .style('user-select', 'none')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + (x) + ',' + (0) + ')')
          })
          let gMerge = allPlots.merge(gEnter)
          gMerge.each(function (dd, ii) {
            d3.select(this)
              .attr('transform', 'translate(' + (middleplot.getAxis('bottom').scale(new Date(dd.added))) + ',' + (middleDim.h) + ')')
          })
          allPlots
            .exit()
            .style('opacity', 0)
            .remove()
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }

      drawCurve()
      // drawMiddleg()
    }

    function drawLeftPart () {
      function drawItem () {
        let nbperline = Math.floor((itemBox.w) / (itemDim.w + itemDim.offsetL))
        allPlots = focusScrollbox.get('innerG').selectAll('g.plot')
          .data(categoryfocus, function (d) {
            return d.id
          })
        let gEnter = allPlots.enter()
          .append('g')
          .attr('class', 'plot')
        gEnter.each(function (d, i) {
          d3.select(this).append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', itemDim.w)
            .attr('height', itemDim.h)
            .attr('stroke', colorPalette.bright.stroke)
            .attr('stroke-width', 0.2)
            .style('fill-opacity', 1)
            .attr('fill', colorPalette.bright.background)
          d3.select(this).append('text')
            .text(d.id)
            .style('fill', '#000000')
            .style('font-weight', 'bold')
            .style('font-size', '12px')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (itemDim.w * 0.5) + ',' + (12) + ')')
          // d3.select(this).append('text')
          //   .text('80')
          //   .style('fill', '#000000')
          //   .style('font-weight', 'bold')
          //   .style('font-size', '11px')
          //   .attr('text-anchor', 'start')
          //   .attr('transform', 'translate(' + (itemDim.x + itemDim.w) + ',' + (itemDim.y + itemDim.h) + ')')
          // d3.select(this).append('text')
          //   .text(d.status.current.y + '' + d.unit + '')
          //   .style('fill', '#000000')
          //   .style('font-weight', 'bold')
          //   .style('font-size', '11px')
          //   .attr('text-anchor', 'start')
          //   .attr('transform', 'translate(' + (itemDim.x + itemDim.w) + ',' + (itemDim.y + itemDim.h * 0.2) + ')')
          // d3.select(this).append('text')
          //   .text(d3.timeFormat('%H:%M')(new Date(shared.time.from)))
          //   .style('fill', '#000000')
          //   .style('font-weight', 'bold')
          //   .style('font-size', '11px')
          //   .attr('text-anchor', 'start')
          //   .attr('transform', 'translate(' + (2) + ',' + (itemDim.h - 22) + ')')
          // d3.select(this).append('text')
          //   .text(d3.timeFormat('%H:%M')(new Date(shared.server.timeOfNight.date_now)))
          //   .style('fill', '#000000')
          //   .style('font-weight', 'bold')
          //   .style('font-size', '11px')
          //   .attr('text-anchor', 'start')
          //   .attr('transform', 'translate(' + (2) + ',' + (itemDim.h - 12) + ')')

          // let optIn = {g: d3.select(this),
          //   box: plotb
          // }
          // optIn.g = optIn.g.append('g') // .style('opacity', 0.8)
          // dd.plotObject = createPlot(optIn)
        })

        let gMerge = allPlots.merge(gEnter)
        let generalIndex = [0, 0]
        gMerge.each(function (d, i) {
          // let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
          // let endTime = {date: new Date(shared.server.timeOfNight.date_now), time: Number(shared.server.timeOfNight.now)}
          //
          // dd.plotObject.updateAxis({
          //   id: 'bottom',
          //   domain: [startTime.date, endTime.date],
          //   range: [0, plotb.w]
          // })
          // dd.plotObject.updateAxis({
          //   id: 'left',
          //   domain: [0, 100],
          //   range: [plotb.h, 0]
          // })
          // dd.plotObject.bindData(dd.id, [dd.status.current].concat(dd.status.previous), 'bottom', 'left')

          // if (dd.ended) {
          //   let percent = (shared.time.current.getTime() - dd.ended.getTime()) / 400000
          //   d3.select(this).style('opacity', 1 - percent)
          //   d3.select(this).select('rect#disapearingBar')
          //     .attr('width', (plotbox.w - offset) * ((1 - percent) < 0 ? 0 : (1 - percent)))
          // }

          // let xlim = xlimArray[i]
          d3.select(this)
            // .transition()
            // .duration(800)
            // .attr('transform', 'translate(' + (itemDim.offsetL) + ',' + (itemDim.offsetT + i * (itemDim.offsetT + itemDim.h)) + ')')
            .attr('transform', 'translate(' + (itemDim.offsetL + generalIndex[0] * (itemDim.offsetL + itemDim.w)) + ',' + (itemDim.offsetT + (generalIndex[1] * (itemDim.offsetT + itemDim.h))) + ')')
          generalIndex[0] = (generalIndex[0] + 1)
          if (generalIndex[0] >= nbperline) {
            generalIndex[0] = 0
            generalIndex[1] += 1
          }
        })

        allPlots
          .exit()
          .style('opacity', 0)
          .remove()
      }
      function drawCategory () {
        let allGroup = leftg.selectAll('g.group')
          .data(shared.server.urgentPast)
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'group')
        gEnterGroup.each(function (d, i) {
          let g = d3.select(this)
          // g.append('rect')
          //   .attr('id', 'extendBack')
          //   .attr('x', 0)
          //   .attr('y', 0)
          //   .attr('width', categoryDim.w)
          //   .attr('height', categoryDim.h - 2)
          //   .attr('stroke-width', 0.4)
          //   .attr('stroke', '#000000')
          //   .attr('fill', 'none')
          g.append('rect')
            .attr('id', 'front')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', categoryDim.w)
            .attr('height', categoryDim.h - 2)
            .attr('stroke-width', 0.2)
            .attr('stroke', '#000000')
            .style('opacity', d.data.length > 0 ? 1 : 0.1)
            .attr('fill', colorCategory[i])
          g.append('text')
            .text(d.key)
            .style('fill', '#000000')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .style('user-select', 'none')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (categoryDim.w * 0.5) + ',' + (categoryDim.h * 0.5 + 4) + ')')
          g.transition()
            .duration(400)
            .attr('transform', 'translate(' + (categoryDim.offsetL) + ',' + (i * (categoryDim.offsetT + categoryDim.h)) + ')')
          g.on('mouseenter', function () {
            categoryfocus = d.data
            leftg.selectAll('rect#extendBack').attr('width', categoryDim.w)
            g.select('rect#extendBack')
              .attr('width', categoryDim.w + middleDim.w + 40)
            drawItem()
          })
        })
        let gMergeGroup = allGroup.merge(gEnterGroup)
        gMergeGroup.each(function (d, i) {
          d3.select(this).select('rect#front')
            .style('opacity', d.data.length > 0 ? 1 : 0.1)
          // .attr('fill', d.data.length > 0 ? colorCategory[i] : '#dddddd')
          d3.select(this)
            .transition()
            .duration(800)
            .attr('transform', 'translate(' + (categoryBox.x + categoryDim.offsetL) + ',' + (i * (categoryDim.offsetT + categoryDim.h) + 2) + ')')
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }
      drawCategory()
      drawItem()
    }
    this.drawLeftPart = drawLeftPart

    // function adjustScrollBox () {
    //   if (!scrollbox) return
    //   let tot = 0
    //   let offset = 2
    //   for (let i = 0; i < shared.server.urgentCurrent.length; i++) {
    //     tot += shared.server.urgentCurrent[i].data.length
    //   }
    //   let nbperline = Math.floor(rightDim.w / (plotbox.w + offset))
    //   scrollbox.updateBox({x: 0, y: 0, w: rightDim.w, h: rightDim.h})
    //   scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: (plotbox.h + offset) * Math.floor(tot / nbperline)})
    // }
    function findnbperline () {
      let line = []
      for (let i = 0; i < shared.server.urgentCurrent.length; i++) {
        line.push(shared.server.urgentCurrent[i].data.length)
      }
      let maxiter = 15
      function bestFit (index) {
        if (maxiter < 0) return {w: 0, h: 0}
        let max = rightBox.w * rightBox.h
        let dim = {w: rightBox.w / index, h: rightBox.h / index}
        let tot = 0
        for (let i = 0; i < line.length; i++) {
          tot += Math.ceil(line[i] / index) * index * (dim.w * dim.h)
        }
        maxiter -= 1
        if ((max - tot) < 0) return bestFit(index += 1)
        else return index
      }
      return bestFit(1)
    }
    function drawRightPart () {
      let mode = 1
      let offset = 4
      // let surface = Math.sqrt((rightBox.h * rightBox.w) / tot) - (offset * offset * 2)
      // let dim = {w: surface, h: surface}
      let nbperline = findnbperline()
      let factor = {x: 0.8, y: 0.8}
      let basicDim = {w: 200 * factor.x, h: 200 * factor.y}
      function adjustTemplate (dim, temp) {
        return {
          x: (temp.x * dim.w) / basicDim.w,
          y: (temp.y * dim.h) / basicDim.h,
          w: (temp.w * dim.w) / basicDim.w,
          h: (temp.h * dim.h) / basicDim.h
        }
      }
      let dim = {w: (rightBox.w / nbperline) - offset, h: (rightBox.h / nbperline) - offset}
      dim.w = dim.w > basicDim.w ? basicDim.w : dim.w
      dim.h = dim.h > basicDim.h ? basicDim.h : dim.h
      dim.w -= offset
      dim.h -= offset

      function chooseTemplate (dim) {
        console.log(dim);
        let basicTemplate = {
          title1: {display: true, x: 4 * factor.x, y: 4 * factor.y, w: 192 * factor.x, h: 46 * factor.y},
          title2: {display: true, x: 4 * factor.x, y: 50 * factor.y, w: 192 * factor.x, h: 46 * factor.y},
          plot: {display: true, x: 4 * factor.x, y: 104 * factor.y, w: 92 * factor.x, h: 92 * factor.y},
          value1: {display: true, x: 104 * factor.x, y: 104 * factor.y, w: 92 * factor.x, h: 46 * factor.y},
          value2: {display: true, x: 104 * factor.x, y: 150 * factor.y, w: 92 * factor.x, h: 46 * factor.y}
        }
        let mediumTemplate = {
          title1: {display: true, x: 4 * factor.x, y: 4 * factor.y, w: 192 * factor.x, h: 46 * factor.y},
          title2: {display: true, x: 4 * factor.x, y: 50 * factor.y, w: 192 * factor.x, h: 46 * factor.y},
          plot: {display: true, x: 4 * factor.x, y: 104 * factor.y, w: 22 * factor.x, h: 92 * factor.y},
          value1: {display: true, x: 34 * factor.x, y: 104 * factor.y, w: 162 * factor.x, h: 46 * factor.y},
          value2: {display: true, x: 34 * factor.x, y: 150 * factor.y, w: 162 * factor.x, h: 46 * factor.y}
        }
        let smallTemplate = {
          title1: {display: true, x: 4 * factor.x, y: 4 * factor.y, w: 192 * factor.x, h: 96 * factor.y},
          title2: {display: true, x: 4 * factor.x, y: 104 * factor.y, w: 192 * factor.x, h: 96 * factor.y},
          plot: {display: false, x: 4 * factor.x, y: 104 * factor.y, w: 22 * factor.x, h: 92 * factor.y},
          value1: {display: false, x: 34 * factor.x, y: 104 * factor.y, w: 162 * factor.x, h: 46 * factor.y},
          value2: {display: false, x: 34 * factor.x, y: 150 * factor.y, w: 162 * factor.x, h: 46 * factor.y}
        }
        let miniTemplate = {
          title1: {display: true, x: 4 * factor.x, y: 4 * factor.y, w: 192 * factor.x, h: 192 * factor.y},
          title2: {display: false, x: 4 * factor.x, y: 50 * factor.y, w: 192 * factor.x, h: 46 * factor.y},
          plot: {display: false, x: 4 * factor.x, y: 104 * factor.y, w: 22 * factor.x, h: 92 * factor.y},
          value1: {display: false, x: 34 * factor.x, y: 104 * factor.y, w: 162 * factor.x, h: 46 * factor.y},
          value2: {display: false, x: 34 * factor.x, y: 150 * factor.y, w: 162 * factor.x, h: 46 * factor.y}
        }
        if (dim.h < 20) return miniTemplate
        if (dim.h < 60) return smallTemplate
        if (dim.w < 100) return mediumTemplate
        return basicTemplate
      }
      let choosenTemplate = chooseTemplate(dim)

      let offsetLine = 0
      let tot = 0
      for (let i = 0; i < shared.server.urgentCurrent.length; i++) {
        tot += shared.server.urgentCurrent[i].data.length
        offsetLine += Math.ceil(shared.server.urgentCurrent[i].data.length / nbperline)
      }
      offsetLine = (rightBox.h - (offsetLine * (dim.h + offset))) / (shared.server.urgentCurrent.length)
      // if ((rightBox.h * rightBox.w) - (((dim.w + offset) * (dim.h + offset)) * tot) < 0) {
      //   dim = {w: 60, h: 20}
      //   if ((rightBox.h * rightBox.w) - (((dim.w + offset) * (dim.h + offset)) * tot) < 0) {
      //     dim = {w: 10, h: 10}
      //     if ((rightBox.h * rightBox.w) - (((dim.w + offset) * (dim.h + offset)) * tot) < 0) {
      //       mode = 2
      //     }
      //   }
      // }
      // let nbperline = Math.floor((rightBox.w + offset) / (dim.w + offset))

      let xlimArray = []
      let limit = 0
      for (let i = 0; i < shared.server.urgentCurrent.length; i++) {
        let inter = Math.round((shared.server.urgentCurrent[i].data.length * nbperline) / tot)
        if (inter < 1) inter = 1
        xlimArray.push(inter)
        limit += inter
      }
      while (limit > nbperline) {
        xlimArray[xlimArray.indexOf(Math.max(...xlimArray))] -= 1
        limit -= 1
      }

      let generalIndex = [0, 0]

      function drawCategory () {
        let allGroup = rightCats.selectAll('g.labelCategory')
          .data(shared.server.urgentKey)
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'labelCategory')
          .attr('id', d => d)
        gEnterGroup.each(function (d, i) {
          let g = d3.select(this)
          // scrollbox.get('innerG').append('g').attr('id', d => d)
          g.style('opacity', 0.2)
          g.append('rect')
            .attr('id', 'front')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', spaceline - 2)
            .attr('height', spaceline - 2)
            .attr('stroke-width', 0.2)
            .attr('stroke', '#000000')
            .attr('fill', colorCategory[i])
            .style('fill-opacity', 0.7)
          g.append('text')
            .text('0')
            .attr('x', spaceline * 0.5)
            .attr('y', spaceline * 0.5 + 2)
            .style('fill', '#000000')
            .style('font-weight', 'bold')
            .style('font-size', '11px')
            .style('user-select', 'none')
            .attr('text-anchor', 'middle')
          g.on('mouseenter', function () {

          })

          let gext = g.append('g').attr('id', 'extension').style('opacity', 0)
          gext.append('circle')
            .attr('cx', rightDim.w - spaceline * 0.4)
            .attr('cy', spaceline * 0.5)
            .attr('r', spaceline * 0.4)
            .attr('stroke-width', 0.4)
            .attr('stroke', '#000000')
            .attr('fill', '#dddddd')
          gext.append('text')
            .text('')
            .attr('x', rightDim.w - spaceline * 0.4)
            .attr('y', spaceline * 0.5 + 3)
            .style('fill', '#000000')
            .style('font-weight', 'bold')
            .style('font-size', '12px')
            .style('user-select', 'none')
            .attr('text-anchor', 'middle')
        })
        let gMergeGroup = allGroup.merge(gEnterGroup)
        gMergeGroup.each(function (d, i) {
          // drawItem(d, i)
          // d3.select(this).select('text').text(d.data.length)
          // d3.select(this).style('opacity', d.data.length > 0 ? 1 : 0.2)
          // if (mode === 1) d3.select(this).select('g#extension').style('opacity', 0)
          // else if (mode === 2) d3.select(this).select('g#extension').style('opacity', 1)
          d3.select(this)
            .transition()
            .duration(200)
            .attr('transform', 'translate(' + (0) + ',' + (i * (spaceline) + 2) + ')')
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }
      function drawItem () {
        let allGroup = rightItems.selectAll('g.category') // scrollbox.get('innerG').selectAll('g.category')
          .data(shared.server.urgentCurrent)
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'category')
          .attr('id', d => d.key)
        gEnterGroup.each(function (d, i) {})
        let gMergeGroup = allGroup.merge(gEnterGroup)

        gMergeGroup.each(function (d, i) {
          let labelCat = rightCats.selectAll('g.labelCategory').filter('g#' + d.key)
          labelCat.style('opacity', d.data.length > 0 ? 1 : 0.2)
          labelCat.select('text').text(d.data.length)

          // if (d.data.length > nbperline) {
          //   if (mode === 1) labelCat.select('g#extension').style('opacity', 0)
          //   else if (mode === 2) labelCat.select('g#extension').style('opacity', 1)
          //   labelCat.select('g#extension text').text('+' + (d.data.length - nbperline))
          // }
          allPlots = d3.select(this).selectAll('g.plot')
            .data(d.data, function (dd) {
              return dd.id
            })
          let gEnter = allPlots.enter()
            .append('g')
            .attr('class', 'plot')
          gEnter.each(function (dd, ii) {
            d3.select(this).append('rect')
              .attr('id', 'back')
              .attr('x', 0)
              .attr('y', 0)
              .attr('stroke-width', 0)
              .attr('fill', colorCategory[i])
            d3.select(this).append('rect')
              .attr('id', 'front')
              .attr('x', 0)
              .attr('y', 0)
              .attr('stroke', colorPalette.bright.stroke)
              .attr('stroke-width', 0.4)
              .attr('fill', colorPalette.medium.background)

            d3.select(this).append('text')
              .attr('id', 'name1')
              .text(dd.name)
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('user-select', 'none')
              .attr('text-anchor', 'middle')
            d3.select(this).append('text')
              .attr('id', 'name2')
              .text(dd.data.type.name)
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('user-select', 'none')
              .attr('text-anchor', 'middle')
            d3.select(this).append('text')
              .attr('id', 'currentvalue')
              .text(dd.data.measures[0].value + '' + (dd.unit ? dd.unit : '%') + '+3')
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('user-select', 'none')
              .attr('text-anchor', 'middle')
            d3.select(this).append('text')
              .attr('id', 'treshold')
              .text('30')
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('user-select', 'none')
              .attr('text-anchor', 'middle')

            let optIn = {g: d3.select(this).append('g'),
              box: choosenTemplate.plot
            }
            miniPlotsVect[dd.id] = createPlot(optIn)

            // let gtresh = d3.select(this).append('g').attr('id', 'treshold')
            // gtresh.append('rect')
            //   .attr('id', 'column')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', plotbox.w * 0.1)
            //   .attr('height', plotbox.h - offset)
            //   .attr('stroke', colorPalette.bright.stroke)
            //   .attr('stroke-width', 0.2)
            //   .style('opacity', 1)
            //   .attr('fill', colorPalette.medium.background)

            // let tempg = d3.select(this).append('g')
            // tempg.append('circle')
            //   .attr('id', 'tempCirc')
            //   .attr('cx', plotbox.w * 0.9)
            //   .attr('cy', plotbox.h * 0.8 + 2)
            //   .attr('r', 10)
            //   .style('fill', 'none')
            //   .attr('stroke', '#000000')
            //   .attr('stroke-width', 4)
            //   .attr('stroke-dasharray', [2 * Math.PI * 10, 0])
            //   .transition()
            //   .delay(8000)
            //   .duration(8000)
            //   .attr('stroke-dasharray', [0, 2 * Math.PI * 10])
            //   .on('end', () => tempg.remove())
            // tempg.append('text')
            //   .attr('id', 'tempText')
            //   .text('+')
            //   .style('fill', '#000000')
            //   .style('font-weight', 'bold')
            //   .style('font-size', '26px')
            //   .style('user-select', 'none')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + (plotbox.w * 0.9) + ',' + (plotbox.h * 0.8 + 11) + ')')

            d3.select(this).on('mouseenter', function () {
              middleplot.bindData(dd.id, [dd.status.current].concat(dd.status.previous), 'bottom', 'right')
              // let linefunction = d3.line()
              //   .x(function (d) { return xscale(d.x) })
              //   .y(function (d) { return yscale(d.y) })
              // overlaymiddleplot.append('path')
              //   .attr('d', linefunction([dd.status.current].concat(dd.status.previous)))
              //   .attr('fill', 'none')
              //   .attr('stroke-width', 2)
              //   .attr('stroke', '#000000')
              overlaymiddleplot.selectAll('.finished')
                .style('opacity', 0.1)
            })
            d3.select(this).on('mouseleave', function () {
              middleplot.unbindData(dd.id)
              // overlaymiddleplot.select('path').remove()
              overlaymiddleplot.selectAll('.finished')
                .style('opacity', 1)
            })
          })
          let gMerge = allPlots.merge(gEnter)
          gMerge.each(function (dd, ii) {
            if (mode === 1) {
              d3.select(this).select('g#treshold').style('opacity', 1)
              if (generalIndex[0] >= nbperline) {
                generalIndex[0] = 0
                generalIndex[1] += 1
              }

              d3.select(this).select('rect#front')
                .attr('width', dim.w - offset)
                .attr('height', dim.h - offset)
              d3.select(this).select('rect#back')
                .attr('width', dim.w)
                .attr('height', dim.h)

              let newtitle1box = adjustTemplate(dim, choosenTemplate.title1)
              d3.select(this).select('text#name1')
                .attr('transform', 'translate(' + (newtitle1box.x + newtitle1box.w * 0.5) + ',' + (newtitle1box.y + newtitle1box.h * 0.5) + ')')
                .style('font-size', (newtitle1box.h * 0.75) + 'px')
                .attr('dy', newtitle1box.h * 0.75 * 0.5)

              let newtitle2box = adjustTemplate(dim, choosenTemplate.title2)
              d3.select(this).select('text#name2')
                .attr('transform', 'translate(' + (newtitle2box.x + newtitle2box.w * 0.5) + ',' + (newtitle2box.y + newtitle2box.h * 0.5) + ')')
                .style('font-size', (newtitle2box.h * 0.75) + 'px')
                .attr('dy', newtitle1box.h * 0.75 * 0.5)

              let newvalue1box = adjustTemplate(dim, choosenTemplate.value1)
              d3.select(this).select('text#currentvalue')
                .text(dd.data.measures[0].value + '' + (dd.unit ? dd.unit : '%') + '+3')
                .attr('transform', 'translate(' + (newvalue1box.x + newvalue1box.w * 0.5) + ',' + (newvalue1box.y + newvalue1box.h * 0.5) + ')')
                .style('font-size', (newvalue1box.h * 0.75) + 'px')
                .attr('dy', newtitle1box.h * 0.75 * 0.5)

              let newvalue2box = adjustTemplate(dim, choosenTemplate.value2)
              d3.select(this).select('text#treshold')
                .text('30')
                .attr('transform', 'translate(' + (newvalue2box.x + newvalue2box.w * 0.5) + ',' + (newvalue2box.y + newvalue2box.h * 0.5) + ')')
                .style('font-size', (newvalue2box.h * 0.75) + 'px')
                .attr('dy', newtitle2box.h * 0.75 * 0.5)

              let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
              let endTime = {date: new Date(shared.server.timeOfNight.date_now), time: Number(shared.server.timeOfNight.now)}

              let newplotbox = adjustTemplate(dim, choosenTemplate.plot)
              newplotbox.h -= offset
              miniPlotsVect[dd.id].updateBox(newplotbox)
              miniPlotsVect[dd.id].updateAxis({
                id: 'bottom',
                domain: [startTime.date, endTime.date],
                range: [0, newplotbox.w],
                box: {x: 0, y: 0, w: newplotbox.w, h: newplotbox.h},
                tickSize: -newplotbox.h
              })
              miniPlotsVect[dd.id].updateAxis({
                id: 'left',
                domain: [0, 100],
                range: [newplotbox.h, 0],
                box: {x: 0, y: 0, w: newplotbox.w, h: newplotbox.h},
                tickSize: -newplotbox.w
              })
              // dd.plotObject.bindData(dd.id, [dd.status.current].concat(dd.status.previous), 'bottom', 'left')

              let cap = d.data.length % nbperline
              let offleft = (ii >= (d.data.length - cap))
                ? (rightBox.w - (offset * (cap - 1) + dim.w * cap)) * 0.5
                : (rightBox.w - (offset * (nbperline - 1) + dim.w * nbperline)) * 0.5
              d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', 'translate(' + (offleft + generalIndex[0] * (offset + (dim.w))) + ',' + ((generalIndex[1] * (offset + (dim.h)))) + ')')
              generalIndex[0] = (generalIndex[0] + 1)
            } else if (mode === 2) {
              // d3.select(this).select('g#treshold').style('opacity', 0)
              // d3.select(this).select('rect#background')
              //   .attr('width', plotbox.w * 0.75 - offset)
              //   .attr('height', spaceline - 2)
              //   // .attr('fill', colorCategory[d.data.length])
              // d3.select(this).select('text#name1')
              //   .attr('transform', 'translate(' + ((plotbox.w * 0.75 * 0.5)) + ',' + (spaceline * 0.5 + offset) + ')')
              // d3.select(this).select('text#name2')
              //   .attr('transform', 'translate(' + ((plotbox.w * 0.75 * 0.5)) + ',' + (spaceline * 0.5 + offset) + ')')
              // d3.select(this).select('text#currentvalue')
              //   .style('opacity', 0)
              // d3.select(this)
              //   .style('opacity', 1 - Math.log10(ii))
              //   .transition()
              //   .duration(200)
              //   .attr('transform', 'translate(' + ((plotbox.w * 0.75) * ii) + ',' + (0) + ')')
            }
          })
          allPlots
            .exit()
            .style('opacity', 0)
            .remove()
          if (d.data.length > 0) {
            generalIndex[0] = 0
            generalIndex[1] += 1
          }
          if (mode === 1) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('transform', 'translate(' + (0) + ',' + (offsetLine * (i + 1)) + ')')
          } else if (mode === 2) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('transform', 'translate(' + (0) + ',' + (shared.server.urgentKey.indexOf(d.key) * (spaceline) + 2) + ')')
          }
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }

      drawCategory()
      drawItem()

      // adjustScrollBox()
    }
    this.drawRightPart = drawRightPart

    function update () {}
    this.update = update
  }
  let svgUrgentPlots = new SvgUrgentPlots()
  let svgPinnedPlots = new SvgPinnedPlots()
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
