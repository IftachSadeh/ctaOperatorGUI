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
    isDarkEle: false,
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
  let sideId = optIn.sideId

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
    window.sideDiv = sock.setSideDiv({
      id: sideId,
      nIcon: dataIn.nIcon,
      iconDivV: iconDivV
    })
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

    loadMesures()

    svgUrgentPlots.initData()
    svgPinnedPlots.initData()
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
  function updateMeasures () {
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
    let index = 1
    for (let z = shared.server.measures.length - 1; z >= 0; z--) {
      if (z === 2 || z === 4) index = 1
      let type = shared.server.measures[z][0].type
      for (let i = shared.server.measures[z].length - 1; i >= 0; i--) {
        let todelete = Math.random() > 0.95
        if (todelete && !shared.server.measures[z][i].ended) {
          shared.server.measures[z][i].ended = shared.time.current
          // shared.server.measures[z].splice(i, 1)
          // continue
        }
        shared.server.measures[z][i].status = fillfun(index)
        index += 1
        for (let j = 0; j < shared.server.measures[z][i].subMeasures.length; j++) {
          shared.server.measures[z][i].subMeasures[j].status = fillfun(index)
          index += 1
        }
      }
      for (let i = shared.server.measures[z].length - 1; i >= 0; i--) {
        if (shared.server.measures[z][i].ended) {
          if ((shared.time.current.getTime() - shared.server.measures[z][i].ended.getTime()) > 400000) shared.server.measures[z].splice(i, 1)
        }
      }
      let toadd = Math.random() > 0.8
      if (toadd) {
        for (let i = 0; i < Math.floor(Math.random() * 2); i++) {
          shared.server.measures[z].push(
            {id: 'id' + Math.floor(Math.random() * 200), added: shared.time.current, type: type, name: 'NEW', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []})
        }
      }
      if (shared.server.measures[z].length === 0) shared.server.measures.splice(z, 1)
    }
    // console.log(shared.server.measures[0].length + shared.server.measures[1].length + shared.server.measures[2].length);
  }
  function loadMesures () {
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
    let index = 0
    let weather = [
      {id: 'id0', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id1', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id2', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id3', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id4', name: 'subMeasure.14', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id5', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure5', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id6', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id7', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id8', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id9', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
      //   {id: 'id10', name: 'subMeasure.14', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      // ]},
      // {id: 'id11', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure5', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
    ]
    let telescopes = [
      {id: 'id0', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id1', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    ]
    index = 0
    let other1 = [
      {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id1', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id2', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure10', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id3', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure11', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id4', name: 'subMeasure.14', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]}
    ]
    let other2 = [
      {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
    ]
    let other3 = [
      {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id1', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id2', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure10', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id3', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id4', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id5', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure10', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id6', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id7', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      // {id: 'id8', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure10', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
    ]
    shared.server.measures = [
      weather,
      telescopes,
      other1,
      other2,
      other3
    ]

    let weatherP = [
      {id: 'id0', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id1', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id2', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id3', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id4', name: 'subMeasure.14', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id5', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id6', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id7', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id8', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id9', name: 'subMeasure.14', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id10', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure5', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
    ]
    let telescopesP = [
      {id: 'id0', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id1', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id2', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id3', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id4', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id5', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id6', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id7', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id8', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id9', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id10', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
    ]
    let otherP = [
      {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id1', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id2', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id3', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
    ]
    shared.server.pinned = [
      weatherP,
      telescopesP,
      otherP
    ]
  }

  function drawfakefocus () {
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
    plotObject.bindData(shared.server.measures[0][0].id, [shared.server.measures[0][0].status.current].concat(shared.server.measures[0][0].status.previous), 'bottom', 'left')
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
      for (let i = 0; i < shared.server.measures.length; i++) {
        tot += shared.server.measures[i].length
      }
      scrollbox.updateBox({x: 0, y: 40, w: box.pinnedPlots.w, h: box.pinnedPlots.h - 80})
      scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: (15 + plotbox.h * 0.15 + (plotbox.h + 20) * Math.ceil(tot / nbperline))})
      // scrollbox.updateHorizontalScroller({canScroll: true, scrollWidth: 0})
    }
    this.adjustScrollBox = adjustScrollBox
    // function adjustPlotDistribution () {
    //   // let nbperline = Math.floor(box.pinnedPlots.w / (plotbox.w + 29))
    //   // console.log(d3.select(plotList[6].get('main').g.node().parentNode.parentNode.parentNode.parentNode).attr('transform'))
    //   for (let i = 0; i < shared.server.measures.length.length; i++) {
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
      for (let i = 0; i < shared.server.measures.length; i++) {
        tot += shared.server.measures[i].length
      }
      let nbperline = Math.floor(box.pinnedPlots.w / (plotbox.w + offset))
      let xlimArray = []
      let limit = 0
      for (let i = 0; i < shared.server.measures.length; i++) {
        let inter = Math.round((shared.server.measures[i].length * nbperline) / tot)
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
          .data(shared.server.measures)
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
          .data(shared.server.measures)
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
          .data(shared.server.measures)
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

    let topg
    let topDim

    let bottomg
    let bottomDim

    let middleg
    let scrollbox

    let plotbox = {
      x: 0,
      y: 0,
      w: 80,
      h: 50
    }
    let allPlots

    let xscale
    let yscale
    let xaxis
    let yaxis
    let xg
    let yg
    let showingplot
    // let plotList = []

    function adjustScrollBox () {
      return
      if (!scrollbox) return
      let nbperline = Math.floor(box.urgentPlots.w / (plotbox.w + 29))
      let tot = 0
      for (let i = 0; i < shared.server.measures.length; i++) {
        tot += shared.server.measures[i].length
      }
      scrollbox.updateBox({x: 0, y: 40, w: box.urgentPlots.w, h: box.urgentPlots.h - 80})
      scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: (15 + plotbox.h * 0.15 + (plotbox.h + 20) * Math.ceil(tot / nbperline))})
      // scrollbox.updateHorizontalScroller({canScroll: true, scrollWidth: 0})
    }
    this.adjustScrollBox = adjustScrollBox
    // function adjustPlotDistribution () {
    //   // let nbperline = Math.floor(box.urgentPlots.w / (plotbox.w + 29))
    //   // console.log(d3.select(plotList[6].get('main').g.node().parentNode.parentNode.parentNode.parentNode).attr('transform'))
    //   for (let i = 0; i < shared.server.measures.length.length; i++) {
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
      leftDim = {x: 0, y: 0, w: box.urgentPlots.w * 0.35 - 41, h: box.urgentPlots.h}
      topDim = {x: 0, y: 0, w: 100, h: box.urgentPlots.h}
      bottomDim = {x: box.urgentPlots.w - 100, y: 0, w: 100, h: box.urgentPlots.h}


      let plotlistg = svg.svg.append('g').attr('id', 'plotList')
        .attr('transform', 'translate(' + box.urgentPlots.x + ',' + box.urgentPlots.y + ')')
        .style('pointer-events', 'auto')

      xscale = d3.scaleTime()
      yscale = d3.scaleLinear()

      xscale.range([0, box.urgentPlots.w * 0.36]).domain([shared.time.from, shared.time.current])
      yscale.range([0, box.urgentPlots.h - 40]).domain([100, 0])

      xaxis = d3.axisBottom(xscale)
      yaxis = d3.axisRight(yscale)

      xaxis.tickFormat(d3.timeFormat('%H:%M'))

      xg = plotlistg.append('g').attr('transform', 'translate(' + (box.urgentPlots.w * 0.35 - 41) + ',' + (box.urgentPlots.h - 20) + ')')
      yg = plotlistg.append('g').attr('transform', 'translate(' + (box.urgentPlots.w * 0.71 - 40) + ',' + 20 + ')')
      showingplot = plotlistg.append('g').attr('transform', 'translate(' + (box.urgentPlots.w * 0.35 - 41) + ',' + (20) + ')')
      xg.attr('class', 'axis')
        .call(xaxis)
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      yg.attr('class', 'axis')
        .call(yaxis)
        .style('pointer-events', 'none')
        .style('user-select', 'none')

      leftg = plotlistg.append('g').attr('id', 'topurgent').attr('transform', 'translate(' + leftDim.x + ',' + leftDim.y + ')')
      topg = plotlistg.append('g').attr('id', 'topurgent').attr('transform', 'translate(' + topDim.x + ',' + topDim.y + ')')
      bottomg = plotlistg.append('g').attr('id', 'bottomurgent').attr('transform', 'translate(' + bottomDim.x + ',' + bottomDim.y + ')')
      middleg = plotlistg.append('g').attr('id', 'plotListscroll').attr('transform', 'translate(' + (box.urgentPlots.w * 0.71) + ',' + 0 + ')')
      scrollbox = initScrollBox('urgentPlotsScrollbox', middleg, box.urgentPlots, {}, true)

      updateData()
      adjustScrollBox()
      drawfakefinished()
    }
    this.initData = initData

    function drawfakefinished () {
      let first = showingplot.append('g').attr('class', 'finished')
      first.attr('transform', 'translate(' + (box.urgentPlots.w * 0.3 - 41) + ',' + (box.urgentPlots.h - 40 - plotbox.h) + ')')
        .transition()
        .duration(690000)
        .ease(d3.easeLinear)
        .attr('transform', 'translate(' + (0) + ',' + (box.urgentPlots.h - 40 - plotbox.h) + ')')
      first.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', plotbox.w)
        .attr('height', plotbox.h)
        .attr('stroke', colorPalette.bright.stroke)
        .attr('stroke-width', 0.4)
        .attr('fill', 'none')
      first.append('text')
        .text('Measure1')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('user-select', 'none')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + ((plotbox.w * 0.5)) + ',' + (16) + ')')
      first.append('text')
        .text(39 + '' + 'C°' + '')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .style('user-select', 'none')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (plotbox.w * 0.5) + ',' + (plotbox.h * 0.5 + 12) + ')')

      let second = showingplot.append('g').attr('class', 'finished')
      second.attr('transform', 'translate(' + (box.urgentPlots.w * 0.2 - 41) + ',' + (box.urgentPlots.h - 40 - plotbox.h) + ')')
        .transition()
        .duration(690000)
        .ease(d3.easeLinear)
        .attr('transform', 'translate(' + (0) + ',' + (box.urgentPlots.h - 40 - plotbox.h) + ')')
      second.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', plotbox.w)
        .attr('height', plotbox.h)
        .attr('stroke', colorPalette.bright.stroke)
        .attr('stroke-width', 0.4)
        .attr('fill', 'none')
      second.append('text')
        .text('Measure2')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('user-select', 'none')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + ((plotbox.w * 0.5)) + ',' + (16) + ')')
      second.append('text')
        .text(12 + '' + 'C°' + '')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .style('user-select', 'none')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (plotbox.w * 0.5) + ',' + (plotbox.h * 0.5 + 12) + ')')

      let third = showingplot.append('g').attr('class', 'finished')
      third.attr('transform', 'translate(' + (box.urgentPlots.w * 0.32 - 41) + ',' + (box.urgentPlots.h - 40 - plotbox.h * 2) + ')')
        .transition()
        .duration(690000)
        .ease(d3.easeLinear)
        .attr('transform', 'translate(' + (0) + ',' + (box.urgentPlots.h - 40 - plotbox.h * 2) + ')')
      third.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', plotbox.w)
        .attr('height', plotbox.h)
        .attr('stroke', colorPalette.bright.stroke)
        .attr('stroke-width', 0.4)
        .attr('fill', 'none')
      third.append('text')
        .text('Measure6')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('user-select', 'none')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + ((plotbox.w * 0.5)) + ',' + (16) + ')')
      third.append('text')
        .text(39 + '' + 'C°' + '')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .style('user-select', 'none')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (plotbox.w * 0.5) + ',' + (plotbox.h * 0.5 + 12) + ')')
    }

    function updateData () {
      drawRightPart()
      drawLeftPart()
    }
    this.updateData = updateData

    function drawLeftPart () {
      let offset = 2

      let tot = 0
      for (let i = 0; i < shared.server.measures.length; i++) {
        tot += shared.server.measures[i].length
      }
      let nbperline = Math.floor((leftDim.w - plotbox.w) / (plotbox.w + offset))
      let xlimArray = []
      let limit = 0
      for (let i = 0; i < shared.server.measures.length; i++) {
        let inter = Math.round((shared.server.measures[i].length * nbperline) / tot)
        if (inter < 1) inter = 1
        xlimArray.push(inter)
        limit += inter
      }
      while (limit > nbperline) {
        xlimArray[xlimArray.indexOf(Math.max(...xlimArray))] -= 1
        limit -= 1
      }

      function drawMiddleg () {
        let allGroup = leftg.selectAll('g.group')
          .data(shared.server.measures)
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'group')
        gEnterGroup.each(function (d, i) {
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
          d3.select(this).append('text')
            .text(d[0].type)
            .style('fill', '#000000')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .style('user-select', 'none')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (box.urgentPlots.x + 10) + ',' + (box.urgentPlots.y + 16) + ')')
          d3.select(this)
            .transition()
            .duration(400)
            .attr('transform', 'translate(' + (leftDim.w - plotbox.w) + ',' + (leftDim.h - ((i + 1) * (offset + (plotbox.h)))) + ')')
          d3.select(this).on('mouseenter', function () {
            let plotbox = {
              x: 0,
              y: 0,
              w: 140,
              h: 70
            }
            let plotb = {
              x: 10,
              y: 20,
              w: 90,
              h: 30
            }
            let nbperline = Math.floor((leftDim.w - plotbox.w) / (plotbox.w + offset))
            allPlots = leftg.selectAll('g.plot')
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
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + ((plotbox.w * 0.5)) + ',' + (12 + offset) + ')')
              d3.select(this).append('text')
                .text('80')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '11px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (plotb.x + plotb.w + offset) + ',' + (plotb.y + plotb.h) + ')')
              d3.select(this).append('text')
                .text(dd.status.current.y + '' + dd.unit + '')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '11px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (plotb.x + plotb.w + offset) + ',' + (plotb.y + plotb.h * 0.2) + ')')
              d3.select(this).append('text')
                .text(d3.timeFormat('%H:%M')(new Date(shared.time.from)))
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '11px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (plotb.x) + ',' + (plotb.y + plotb.h + 12) + ')')
              d3.select(this).append('text')
                .text(d3.timeFormat('%H:%M')(new Date(shared.server.timeOfNight.date_now)))
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '11px')
                .attr('text-anchor', 'end')
                .attr('transform', 'translate(' + (plotb.x + plotb.w) + ',' + (plotb.y + plotb.h + 12) + ')')

              let optIn = {g: d3.select(this),
                box: plotb
              }
              optIn.g = optIn.g.append('g') // .style('opacity', 0.8)
              dd.plotObject = createPlot(optIn)
            })
            let gMerge = allPlots.merge(gEnter)
            let generalIndex = [0, 0]
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
                .attr('transform', 'translate(' + (generalIndex[0] * (offset + (plotbox.w))) + ',' + ((generalIndex[1] * (offset + (plotbox.h)))) + ')')
              generalIndex[0] = (generalIndex[0] + 1)
              if (generalIndex[0] > nbperline) {
                generalIndex[0] = 0
                generalIndex[1] += 1
              }
            })
            allPlots
              .exit()
              .style('opacity', 0)
              .remove()
          })
        })
        let gMergeGroup = allGroup.merge(gEnterGroup)
        gMergeGroup.each(function (d, i) {
          d3.select(this)
            .transition()
            .duration(800)
            .attr('transform', 'translate(' + (leftDim.w - plotbox.w) + ',' + (leftDim.h - ((i + 1) * (offset + (plotbox.h)))) + ')')
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }
      drawMiddleg()
    }
    this.drawLeftPart = drawLeftPart

    function drawRightPart () {
      let offset = 2
      let groupOffset = 0

      let tot = 0
      for (let i = 0; i < shared.server.measures.length; i++) {
        tot += shared.server.measures[i].length
      }
      let nbperline = Math.floor(box.urgentPlots.w * 0.26 / (plotbox.w + offset))
      let xlimArray = []
      let limit = 0
      for (let i = 0; i < shared.server.measures.length; i++) {
        let inter = Math.round((shared.server.measures[i].length * nbperline) / tot)
        if (inter < 1) inter = 1
        xlimArray.push(inter)
        limit += inter
      }
      while (limit > nbperline) {
        xlimArray[xlimArray.indexOf(Math.max(...xlimArray))] -= 1
        limit -= 1
      }
      // let plotb = {
      //   x: plotbox.x + plotbox.w * 0.05,
      //   y: plotbox.y + plotbox.h * 0.35,
      //   w: plotbox.w * 0.4,
      //   h: plotbox.h * 0.4
      // }

      let generalIndex = [0, 0]

      function drawTopg () {
        let allGroup = topg.selectAll('g.group')
          .data(shared.server.measures)
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
            .attr('transform', 'translate(' + (box.urgentPlots.x + 10) + ',' + (box.urgentPlots.y + 16) + ')')
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
          .data(shared.server.measures)
        let gEnterGroup = allGroup.enter()
          .append('g')
          .attr('class', 'group')
        gEnterGroup.each(function (d, i) {
          // let xlim = xlimArray[i]
          // d3.select(this)
          //   .transition()
          //   .duration(400)
          //   .attr('transform', 'translate(' + (generalIndex[0] * (offset + (plotbox.w))) + ',' + ((generalIndex[1] * (offset + (plotbox.h)))) + ')')
          // groupOffset += xlim * (offset + (plotbox.w))
        })
        // groupOffset = 0
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
              .attr('stroke-width', 6)
              .style('fill-opacity', 1)
              .attr('fill', colorPalette.bright.background)
              .transition()
              .delay(4000)
              .duration(4000)
              .attr('stroke-width', 0.4)
            d3.select(this).append('text')
              .text(dd.name)
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('font-size', '12px')
              .style('user-select', 'none')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(' + ((plotbox.w * 0.5)) + ',' + (12 + offset) + ')')
            // d3.select(this).append('text')
            //   .text(dd.unit)
            //   .style('fill', '#000000')
            //   .style('font-weight', 'bold')
            //   .style('font-size', '12px')
            //   .attr('text-anchor', 'end')
            //   .attr('transform', 'translate(' + (plotbox.w - offset * 3) + ',' + (12 + offset) + ')')
            // d3.select(this).append('text')
            //   .text('80')
            //   .style('fill', '#000000')
            //   .style('font-weight', 'bold')
            //   .style('font-size', '11px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + (plotbox.w * 0.75) + ',' + (plotbox.h * 0.6 + 12) + ')')
            d3.select(this).append('text')
              .text(dd.status.current.y + '' + dd.unit + '')
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('font-size', '16px')
              .style('user-select', 'none')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(' + (plotbox.w * 0.5) + ',' + (plotbox.h * 0.5 + 12) + ')')
            // d3.select(this).append('rect')
            //   .attr('id', 'disapearingBar')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', plotbox.w - offset)
            //   .attr('height', plotbox.h - offset)
            //   .style('fill-opacity', 0.4)
            //   .attr('fill', (d) => {
            //     if (d.type === 'weather') return '#4c11a2'
            //     if (d.type === 'other') return '#0065be'
            //     if (d.type === 'telescopes') return '#6b8998'
            //     return 'none'
            //   })
            //   .transition()
            //   .delay(4000)
            //   .duration(2000)
            //   .attr('y', plotbox.h - offset * 2)
            //   .attr('height', offset * 1)
            // let optIn = {g: d3.select(this),
            //   box: plotb
            // }
            // optIn.g = optIn.g.append('g') // .style('opacity', 0.8)
            // dd.plotObject = createPlot(optIn)
            d3.select(this).on('mouseenter', function () {
              let linefunction = d3.line()
                .x(function (d) { return xscale(d.x) })
                .y(function (d) { return yscale(d.y) })
              showingplot.append('path')
                .attr('d', linefunction([dd.status.current].concat(dd.status.previous)))
                .attr('fill', 'none')
                .attr('stroke-width', 2)
                .attr('stroke', '#000000')
              showingplot.selectAll('.finished')
                .style('opacity', 0.1)
            })
            d3.select(this).on('mouseleave', function () {
              showingplot.select('path').remove()
              showingplot.selectAll('.finished')
                .style('opacity', 1)
            })

            // let xlim = xlimArray[i]
            // d3.select(this)
            //   .attr('transform', 'translate(' + (generalIndex[0] * (offset + (plotbox.w))) + ',' + ((generalIndex[1] * (offset + (plotbox.h)))) + ')')
            // generalIndex[0] = (generalIndex[0] + 1)
            // if (generalIndex[0] > nbperline) {
            //   generalIndex[0] = 0
            //   generalIndex[1] += 1
            // }
          })
          let gMerge = allPlots.merge(gEnter)
          gMerge.each(function (dd, ii) {
            // let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
            // let endTime = {date: new Date(shared.server.timeOfNight.date_now), time: Number(shared.server.timeOfNight.now)}

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
              .transition()
              .duration(800)
              .attr('transform', 'translate(' + (4 + generalIndex[0] * (offset + (plotbox.w))) + ',' + ((generalIndex[1] * (offset + (plotbox.h)))) + ')')
            generalIndex[0] = (generalIndex[0] + 1)
            if (generalIndex[0] > nbperline) {
              generalIndex[0] = 0
              generalIndex[1] += 1
            }
          })
          allPlots
            .exit()
            .style('opacity', 0)
            .remove()

          // let xlim = xlimArray[i]
          // d3.select(this)
          //   .transition()
          //   .duration(800)
          //   .attr('transform', 'translate(' + (generalIndex[0] * (offset + (plotbox.w))) + ',' + ((generalIndex[1] * (offset + (plotbox.h)))) + ')')
          // groupOffset += xlim * (offset + (plotbox.w))
        })
        allGroup
          .exit()
          .style('opacity', 0)
          .remove()
      }
      function drawBottomg () {
        let allGroup = bottomg.selectAll('g.group')
          .data(shared.server.measures)
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
            .attr('transform', 'translate(' + (box.urgentPlots.x + 10) + ',' + (box.urgentPlots.y + 16) + ')')
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

      // drawTopg()
      drawMiddleg()
      // drawBottomg()
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
