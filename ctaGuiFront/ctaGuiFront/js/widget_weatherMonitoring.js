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
var mainScriptTag = 'weatherMonitoring'
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
  let h0 = 10
  let w0 = 12
  let divKey = 'main'
  let content = "<div id='" + optIn.baseName + divKey + "'>" +
  // '<iframe width="600" height="500" id="gmap_canvas" src="https://maps.google.com/maps?q=la%20palma&t=&z=13&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>' +
  // '<iframe width="650" height="650" src="https://embed.windy.com/embed2.html?lat=28.718&lon=-17.849&zoom=11&level=surface&overlay=wind&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=48.683&detailLon=2.133&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" frameborder="0"></iframe>' +
  '</div>'

  optIn.widgetFunc = {
    SockFunc: sockWeatherMonitoring,
    MainFunc: mainWeatherMonitoring
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
let sockWeatherMonitoring = function (optIn) {}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainWeatherMonitoring = function (optIn) {
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

  function initData (dataIn) {
    function initSvg () {
      lenD.w = {}
      lenD.h = {}
      lenD.w[0] = 1000
      lenD.h[0] = lenD.w[0]// / sgvTag.main.whRatio

      d3.select(svgDiv)
        .style('width', 'calc(100% - 200px)')
        .style('height', '100%')
        .style('top', '0%')
        .style('margin-left', '200px')
        .style('overflow', 'scroll')
        .style('max-height', ($(document).height() * 0.8) + 'px')
      svg.svg = d3
        .select(svgDiv)
        .append('svg')
        // .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', '0 0 ' + lenD.w[0] + ' ' + lenD.h[0])
        .style('position', 'relative')
        .style('width', '100%')
        .style('height', '100%')
        .style('top', '0%')
        .style('left', '0%')
        // .style('max-height', ($(document).height() * 0.8) + 'px')
        .on('dblclick.zoom', null)

      d3.select(svgDivFM)
        .style('position', 'absolute')
        .style('width', '200px')
        .style('height', '100%')
        .style('top', '0%')
        .style('left', '0%')
        .style('pointer-events', 'none')
        // .style('max-height', ($(document).height() * 0.8) + 'px')
      svg.floatingMenu = d3
        .select(svgDivFM)
        .append('svg')
        // .attr('preserveAspectRatio', 'xMidYMid meet')
        // .attr('viewBox', '0 0 ' + lenD.w[0] + ' ' + lenD.h[0])
        .style('width', '100%')
        .style('height', '100%')
        .style('top', '0%')
        .style('left', '0%')
        .style('pointer-events', 'none')
      svg.floatingMenu.append('rect')
        .attr('x', '98%')
        .attr('y', 0)
        .attr('width', '1px')
        .attr('height', '100%')
        .attr('fill', colorPalette.darkest.stroke)
        .attr('stroke', colorPalette.darkest.stroke)
        .attr('stroke-width', 0.0)

      // function adjustDim () {
      //   // $(svg.floatingMenu.node()).width($(svgDiv).width())
      //   $(svg.floatingMenu.node()).height($(svgDiv).height())
      // }
      //
      // $(window).resize(
      //   function () {
      //     adjustDim()
      //   })
      // adjustDim()

      svg.floatingMenuRoot = svg.floatingMenu.append('g')
      // .attr('transform', 'translate(' + -lenD.w[0] * 0.12 + ',' + 0 + ')')

      if (disableScrollSVG) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }
      svg.back = svg.svg.append('g')
      svg.g = svg.svg.append('g')
    }
    function initBackground () {
      let pattern = {select: {}}
      pattern.select.defs = svg.g.append('defs')
      pattern.select.patternLock = pattern.select.defs.append('pattern')
        .attr('id', 'patternLock')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', 'none')
        .attr('patternUnits', 'userSpaceOnUse')
      pattern.select.patternLock.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 20)
        .attr('y2', 20)
        .attr('stroke', 'gold')
        .attr('stroke-width', 8)
        .attr('stroke-opacity', 0.6)

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.0)
        .attr('y', lenD.h[0] * 0.0)
        .attr('width', lenD.w[0] * 0.26)
        .attr('height', 30)
        .attr('fill', colorPalette.darker.background)
      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.26 - 30)
        .attr('y', lenD.h[0] * 0.0)
        .attr('width', 30)
        .attr('height', lenD.h[0] * 1)
        .attr('fill', colorPalette.darker.background)
      svg.back.append('text')
        .text('Data tracking')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '22px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (4) + ',' + (lenD.h[0] * 0.022) + ')')

      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.26)
      //   .attr('y', lenD.h[0] * 0.17)
      //   .attr('width', lenD.w[0] * 0.48)
      //   .attr('height', lenD.h[0] * 0.4)
      //   .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      svg.back.append('text')
        .text('Big Plot')
        .style('fill', colorPalette.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.5) + ',' + (lenD.h[0] * 0.25) + ')')
      let fo = svg.back.append('foreignObject')
        .attr('x', lenD.w[0] * 0.5 + 'px')
        .attr('y', lenD.h[0] * 0.6 + 'px')
        .attr('width', lenD.w[0] * 0.48 + 'px')
        .attr('height', lenD.h[0] * 0.495 + 'px').node()

      let iframe = document.createElement('iframe')
      iframe.width = (lenD.w[0] * 0.48) + 'px'
      iframe.height = (lenD.h[0] * 0.4) + 'px'
      iframe.src = "https://embed.windy.com/embed2.html?lat=28.718&lon=-17.849&zoom=11&level=surface&overlay=wind&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=48.683&detailLon=2.133&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1"

      fo.appendChild(iframe)
      // svg.svg._groups[0][0].appendChild(fo)

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.27)
        .attr('y', 0)
        .attr('width', lenD.w[0] * 0.25)
        .attr('height', lenD.h[0] * 0.02)
        .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Plots List')
        .style('fill', colorPalette.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.34) + ',' + (lenD.h[0] * 0.015) + ')')
      for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 2; j++) {
          svg.back.append('rect')
            .attr('x', lenD.w[0] * 0.27 + i * lenD.w[0] * 0.12)
            .attr('y', lenD.h[0] * 0.03 + j * (lenD.h[0] * 0.06 + lenD.h[0] * 0.01))
            .attr('width', lenD.w[0] * 0.10)
            .attr('height', lenD.h[0] * 0.06)
            .attr('fill', colorPalette.darker.background) // colorPalette.dark.background)
            .attr('stroke', 'none')
            .attr('rx', 0)
        }
      }
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.78)
      //   .attr('y', lenD.h[0] * 0.98)
      //   .attr('width', lenD.w[0] * 0.25)
      //   .attr('height', lenD.h[0] * 0.02)
      //   .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.back.append('text')
      //   .text('Plots List')
      //   .style('fill', colorPalette.bright.background)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(' + (lenD.w[0] * 0.875) + ',' + (lenD.h[0] * 0.995) + ')')

      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.0)
      //   .attr('y', 0)
      //   .attr('width', lenD.w[0] * 0.32)
      //   .attr('height', lenD.h[0] * 0.14)
      //   .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.back.append('text')
      //   .text('Information')
      //   .style('fill', colorPalette.bright.background)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(' + (lenD.w[0] * 0.16) + ',' + (lenD.h[0] * 0.015) + ')')
    }
    function initBox () {
      box.blockQueueServer = {
        x: lenD.w[0] * 0.374,
        y: lenD.h[0] * 0.155,
        w: lenD.w[0] * 0.59,
        h: lenD.h[0] * 0.47,
        marg: lenD.w[0] * 0.01
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
    let svgDivId = sgvTag.main.id + 'svg'
    let svgDivFMId = sgvTag.main.id + 'FM'
    let parent = sgvTag.main.widget.getEle(sgvTag.main.id)

    let svgDiv = sgvTag.main.widget.getEle(svgDivId)
    let svgDivFM = sgvTag.main.widget.getEle(svgDivFMId)
    if (!hasVar(svgDiv)) {
      let svgDiv = document.createElement('div')
      svgDiv.id = svgDivId
      appendToDom(parent, svgDiv)

      let svgDivFM = document.createElement('div')
      svgDivFM.id = svgDivFMId
      appendToDom(parent, svgDivFM)

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
    shared.time.range = 1000 * (3600 * parseInt(6) + 60 * parseInt(0))
    shared.time.from = new Date()
    shared.time.from.setTime(shared.time.current.getTime() - shared.time.range)
    loadMesures()

    svgMeasuredData.initData()
    svgHeathMapSensors.initData()
    svgFMDate.initData()
    svgFMTimeline.initData()
    svgFMSupervision.initData()

    svgPlotDisplay.initData()
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

    shared.server = dataIn.data

    // svgPlotDisplay.updateData()
    shared.time.current = new Date(shared.server.timeOfNight.date_now)
    svgFMDate.updateData()

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
  function addDataToPlot (data) {
    for (let i = 0; i < shared.data.length; i++) {
      if (shared.data[i].id === data.id) {
        shared.data.splice(i, 1)
        svgPlotDisplay.unbindData(data)
        return
      }
    }
    shared.data.push(data)
    svgPlotDisplay.bindData(data)
  }
  function loadMesures () {
    let fillfun = function (index) {
      let status = {current: '', previous: []}
      status.current = shared.server.dataOut[Math.floor(index / 4)][index % 4].data[0]
      status.current.x = new Date(shared.server.timeOfNight.date_now)
      for (let i = 1; i < (shared.time.range / 100 / 3600); i++) {
        status.previous.push(shared.server.dataOut[Math.floor(index / 4)][index % 4].data[i * 2])
        status.previous[i - 1].x = new Date ()
        status.previous[i - 1].x.setTime(status.current.x.getTime() - i * 3600 * 100)
      }
      return status
    }
    shared.server.measures = [
      {id: 'id0', name: 'Measure1', status: fillfun(1), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id1', name: 'Measure2', status: fillfun(2), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id2', name: 'Measure3', status: fillfun(3), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id3', name: 'Measure4', status: fillfun(4), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id4', name: 'subMeasure.14', status: fillfun(5), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id5', name: 'Measure5', status: fillfun(6), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id6', name: 'Measure6', status: fillfun(7), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id7', name: 'subMeasure6.1', status: fillfun(8), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id8', name: 'Measure7', status: fillfun(9), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id9', name: 'subMeasure7.1', status: fillfun(10), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id10', name: 'subMeasure7.2', status: fillfun(11), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id11', name: 'Measure8', status: fillfun(12), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id12', name: 'subMeasure8.1', status: fillfun(13), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id13', name: 'subMeasure8.2', status: fillfun(14), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id14', name: 'subMeasure8.3', status: fillfun(15), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id15', name: 'subMeasure8.4', status: fillfun(16), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id16', name: 'subMeasure8.5', status: fillfun(17), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id17', name: 'Measure9', status: fillfun(18), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id18', name: 'subMeasure9.1', status: fillfun(19), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id19', name: 'subMeasure9.2', status: fillfun(20), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id20', name: 'Measure10', status: fillfun(21), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id21', name: 'Measure11', status: fillfun(22), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id22', name: 'subMeasure11.1', status: fillfun(23), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
      ]}
    ]
  }

  let SvgPlotDisplay = function () {
    let plotbox
    let plot
    let brushbox
    let brush

    function addPlot (optIn) {
      let plotg = svg.g.append('g')

      plot = new PlotTimeSeries()
      plot.init({
        main: {
          g: plotg,
          box: plotbox,
          clipping: true
        },
        axis: [
          {
            id: 'bottom',
            showAxis: false,
            main: {
              g: undefined,
              box: {x: 0, y: 0, w: 0, h: plotbox.h, marg: 0},
              type: 'bottom',
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
                }
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
                  enabled: true,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                }
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
            id: 'right',
            showAxis: true,
            main: {
              g: undefined,
              box: {x: plotbox.w, y: 0, w: 0, h: 0, marg: 0},
              type: 'right',
              mode: 'linear',
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
                }
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
        content: {}
      })
    }
    function addBrush (optIn) {
      let brushg = svg.g.append('g')

      brush = new PlotBrushZoom({
        main: {
          g: brushg,
          box: brushbox
        },
        clipping: {
          enabled: false
        },
        axis: [
          {
            id: 'top',
            enabled: true,
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: brushbox.h * 0.14, w: brushbox.w, h: brushbox.h * 0.2, marg: 0},
              type: 'bottom',
              attr: {
                text: {
                  enabled: true,
                  size: 14,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                }
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, brushbox.w],
            brush: {
              zoom: true,
              brush: true
            }
          },
          {
            id: 'middle',
            enabled: true,
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: brushbox.h * 0.9, w: brushbox.w, h: brushbox.h * 0.0, marg: 0},
              type: 'top',
              attr: {
                text: {
                  enabled: true,
                  size: 11,
                  stroke: colorPalette.medium.stroke,
                  fill: colorPalette.medium.stroke
                },
                path: {
                  enabled: false,
                  stroke: colorPalette.medium.background,
                  fill: colorPalette.medium.background
                }
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, brushbox.w],
            brush: {
              zoom: false,
              brush: false
            }
          }
        ],
        content: {
          enabled: true,
          main: {
            g: undefined,
            box: {x: 0, y: brushbox.h * 0.15, w: brushbox.w, h: brushbox.h * 0.65, marg: 0},
            attr: {
              fill: colorPalette.medium.background
            }
          }
        },
        focus: {
          enabled: true,
          main: {
            g: undefined,
            box: {x: 0, y: brushbox.h * 0.5, w: brushbox.w, h: brushbox.h * 0.3, marg: 0},
            attr: {
              fill: colorPalette.darkest.background,
              opacity: 1,
              stroke: colorPalette.darkest.background
            }
          }
        },
        brush: {
          coef: {x: 0, y: 0},
          callback: () => {}
        },
        zoom: {
          coef: {kx: 1, ky: 1, x: 0, y: 0},
          callback: function () {
            plot.updateAxis({
              id: 'bottom',
              domain: brush.getAxis('top').scale.domain(),
              range: [0, plotbox.w]
            })
            plot.updateData()
          }
        }
      })
      brush.init()
    }

    function initData () {
      plotbox = {
        x: lenD.w[0] * 0.5 + 20,
        y: lenD.h[0] * 0.17 + 20,
        w: lenD.w[0] * 0.48 - 40,
        h: lenD.h[0] * 0.4 - 40
      }
      brushbox = {
        x: lenD.w[0] * 0.5 + 20,
        y: lenD.h[0] * 0.57 - 26,
        w: lenD.w[0] * 0.48 - 40,
        h: lenD.h[0] * 0.05
      }

      addPlot()
      addBrush()

      updateData()
    }
    this.initData = initData

    function bindData (data) {
      plot.bindData(data.id, [data.status.current].concat(data.status.previous), 'bottom', 'left')
    }
    this.bindData = bindData
    function unbindData (data) {
      plot.unbindData(data.id)
    }
    this.unbindData = unbindData

    function updateData () {
      let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
      let endTime = {date: new Date(shared.server.timeOfNight.date_now), time: Number(shared.server.timeOfNight.now)}
      plot.updateAxis({
        id: 'bottom',
        domain: [startTime.date, endTime.date],
        range: [0, plotbox.w]
      })
      plot.updateAxis({
        id: 'left',
        domain: [0, 100],
        range: [plotbox.h, 0]
      })
      plot.updateAxis({
        id: 'right',
        domain: [0, 100],
        range: [plotbox.h, 0]
      })

      brush.updateAxis({
        id: 'top',
        domain: [startTime.date, endTime.date]
      })
      brush.updateAxis({
        id: 'middle',
        domain: [startTime.date, endTime.date]
      })
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgHeathMapSensors = function () {
    let box
    let step = 20
    let currentState = 'default'
    let spaceSize = 6
    let lineSize
    let scrollbox
    // reserved.overview.modifications.scrollBox.get('innerG')
    function changeState (from, action) {
      if (from === 'heatmap') {
        if (currentState === 'default') {
          currentState = 'expanded'
          expandSensor()
        } else if (currentState === 'expanded') {
          currentState = 'default'
          defaultDisplay()
        } else if (currentState === 'shift') {
          currentState = 'expanded'
          expandSensor()
        }
      } else if (from === 'measured') {
        if (action === 'expanded') {
          currentState = 'shift'
          shrinkSensor()
        } else if (action === 'default') {
          currentState = 'default'
          defaultDisplay()
        }
      }
    }
    this.changeState = changeState
    function shrinkSensor () {
      svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
        .each(function (d) {
          let g = d3.select(this)
          g.on('mouseenter', () => {})
          g.on('mouseleave', () => {})
          g.selectAll('g.sensorline')
            .transition()
            .duration(600)
            .attr('transform', function (d, i) {
              return 'translate(' + 0 + ',' + 0 + ')'
            })
        })
      svg.g.select('g#hardwareMonitoring').selectAll('rect#label').remove()
      svg.g.select('g#hardwareMonitoring').selectAll('text#label').remove()

      let count = svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline').size()
      svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline')
        .attr('opacity', 1)
        .transition()
        .duration(400)
        .delay((d, i) => i * (400 / count))
        .attr('opacity', 0)
        .on('end', function () {
          d3.select(this).attr('visibility', 'hidden')
        })

      svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
        .transition()
        .duration(600)
        .delay((d, i) => i * (600 / count))
        .attr('transform', function (d, i) {
          return 'translate(' + (-box.w * 0.7 + box.w * 0.25 * (i % 4)) + ',' + (parseInt(i / 4) * 30) + ')'
        })
    }
    // function unshift () {
    //
    //   let offset = 0
    //   svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
    //     .transition()
    //     .duration(400)
    //     .delay((d, i) => 400 - i * (400 / count))
    //     .attr('transform', (d, i) => {
    //       let trans = offset
    //       offset += 12 + d.length * (lineSize)
    //       return 'translate(' + 0 + ',' + trans + ')'
    //     })
    //
    //   // let offset = 0
    //   // svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
    //   //   .each(function (d, i) {
    //   //     let g = d3.select(this)
    //   //     g.transition()
    //   //       .duration(600)
    //   //       .delay((d, i) => 600 - i * (600 / count))
    //   //       .attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
    //   //     offset += 12 + d.length * (lineSize)
    //   //   })
    // }
    function displayOnOffButton (g) {
      g.select('rect#background').attr('fill', d3.color(colorPalette.darker.background).darker(0.2))
      g.selectAll('g.sensorline').transition()
        .duration(300)
        .attr('transform', function (d, i) {
          return 'translate(' + 28 + ',' + (i * 12) + ')'
        })

      let ig = g.selectAll('g.sensorline')
        .append('g')
        .attr('id', 'onoffButton')
        .on('click', function (d, i) {
          if (d[i].running) {
            d[i].running = false
            ig.select('rect#slideback')
              .transition()
              .duration(200)
              .attr('fill', (d, i) => {
                return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
              })
            ig.select('circle#slidebutton')
              .transition()
              .duration(200)
              .attr('cx', (d, i) => {
                return d[i].running ? -12 : -22
              })
              .attr('fill', (d, i) => {
                return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
              })
          } else {
            d[i].running = true
            ig.select('rect#slideback')
              .transition()
              .duration(200)
              .attr('fill', (d, i) => {
                return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
              })
            ig.select('circle#slidebutton')
              .transition()
              .duration(200)
              .attr('cx', (d, i) => {
                return d[i].running ? -12 : -22
              })
              .attr('fill', (d, i) => {
                return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
              })
          }
          onOffSensor(d3.select(d3.select(this).node().parentNode), i)
        })
      ig.append('rect')
        .attr('id', 'slideback')
        .attr('x', -28)
        .attr('y', (d, i) => (i * 8.5) - 4)
        .attr('width', 22)
        .attr('height', 12)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5)
        .attr('fill', (d, i) => {
          return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
        })
        .style('opacity', 0.5)
        .attr('rx', 6)
      ig.append('circle')
        .attr('id', 'slidebutton')
        .attr('cx', (d, i) => {
          return d[i].running ? -12 : -22
        })
        .attr('cy', (d, i) => (i * 8.5) + 2)
        .attr('r', 5.5)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5)
        .attr('fill', (d, i) => {
          return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
        })
      // ig.append('rect')
      //   .attr('id', 'slideoverlay')
      //   .attr('x', -28)
      //   .attr('y', (d, i) => (i * 8.5) - 4)
      //   .attr('width', 22)
      //   .attr('height', 12)
      //   .attr('stroke', 'none')
      //   .attr('fill', 'transparent')
      //   .attr('rx', 6)
      //   .on('click', function (d, i) {
      //     if (d[i].running) {
      //       d[i].running = false
      //       ig.select('rect#slideback')
      //         .attr('fill', (d, i) => {
      //           return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
      //         })
      //       ig.select('circle#slidebutton')
      //         .attr('cx', (d, i) => {
      //           return d[i].running ? -12 : -22
      //         })
      //         .attr('fill', (d, i) => {
      //           return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
      //         })
      //     } else {
      //       d[i].running = true
      //       ig.select('rect#slideback')
      //         .attr('fill', (d, i) => {
      //           return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
      //         })
      //       ig.select('circle#slidebutton')
      //         .attr('cx', (d, i) => {
      //           return d[i].running ? -12 : -22
      //         })
      //         .attr('fill', (d, i) => {
      //           return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
      //         })
      //     }
      //   })
    }
    function hideOnOffButton (g) {
      g.selectAll('g.sensorline').selectAll('g#onoffButton').remove()
      g.select('rect#background').attr('fill', 'transparent')
      g.selectAll('g.sensorline').transition()
        .duration(300)
        .attr('transform', function (d, i) {
          return 'translate(' + 0 + ',' + (i * 12) + ')'
        })
    }
    function expandSensor () {
      // svgMeasuredData.shift()
      let offset = 0
      svg.g.select('g#hardwareMonitoring')
        .transition()
        .duration(600)
        .attr('transform', 'translate(' + 0 + ',' + -box.y * 0.2 + ')')
      svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline')
        .attr('visibility', 'visible')
        .transition()
        .duration(600)
        .attr('opacity', 1)
      svg.g.select('g#heatmapSensors').selectAll('g.sensor')
        .each(function (d, i) {
          let g = d3.select(this)
          g.on('mouseenter', function (d) {
            displayOnOffButton(g)
          })
          g.on('mouseleave', function (d) {
            hideOnOffButton(g)
          })
          // g.on('click', () => {
          //   console.log(d3.event);
          //   console.log('click2')
          // })
          offset += 24
          // let localCpOffset = offset
          g.append('text')
            .attr('id', 'label')
            .text(d => d[0].name)
            .attr('x', -6)
            .attr('y', '-14px')
            .style('font-weight', 'bold')
            .style('font-size', '12px')
          g.append('rect')
            .attr('id', 'label')
            .attr('x', -4)
            .attr('y', -11)
            .attr('width', 2)
            .attr('height', d.length * (lineSize + 12))
          g.select('rect#background')
            .attr('x', -6)
            .attr('y', -26)
            .attr('width', box.w)
            .attr('height', d.length * (lineSize + 12) + 8 + 16)
            .attr('fill', 'transparent')
          g.transition()
            .duration(600)
            .attr('transform', 'translate(' + 6 + ',' + (offset) + ')')

          g.selectAll('g.sensorline')
            .append('text')
            .attr('id', 'label')
            .text((d, i) => d[i].id)
            .attr('x', 0)
            .attr('y', -1)
            .style('font-size', '10px')
            .attr('transform', function (d, i) {
              return 'translate(' + 0 + ',' + (i * 9) + ')'
            })
          g.selectAll('g.sensorline')
            .transition()
            .duration(600)
            .attr('transform', function (d, i) {
              return 'translate(' + 0 + ',' + (i * 12) + ')'
            })
          offset += d.length * (lineSize + 11)
        })

      scrollbox.updateBox({x: 0, y: 0, w: box.w, h: (box.y * 0.2 + box.h)})
      scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: (offset)})
    }
    function defaultDisplay () {
      // svgMeasuredData.unshift()
      svg.g.select('g#hardwareMonitoring')
        .transition()
        .duration(600)
        .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
        .on('end', function () {
          scrollbox.updateBox({x: 0, y: 0, w: box.w, h: box.h})
          scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: 0})
        })
      let count = svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline').size()
      svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline')
        .attr('visibility', 'visible')
        .transition()
        .duration(600)
        .delay((d, i) => i * (600 / count))
        .attr('opacity', 1)
      let offset = 0
      svg.g.select('g#heatmapSensors').selectAll('g.sensor')
        .each(function (d) {
          let g = d3.select(this)
          g.on('mouseenter', () => {})
          g.on('mouseleave', () => {})
          g.transition()
            .duration(600)
            .attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
          g.selectAll('g.sensorline')
            .transition()
            .duration(600)
            .attr('transform', function (d, i) {
              return 'translate(' + 0 + ',' + 0 + ')'
            })
          offset += spaceSize + d.length * (lineSize)
        })
      svg.g.select('g#heatmapSensors').selectAll('rect#label').remove()
      svg.g.select('g#heatmapSensors').selectAll('text#label').remove()
    }
    function onOffSensor (g, j) {
      g.selectAll('rect#timestamp')
        .attr('fill', (d, i) => {
          if (d[j].status.previous[i] === 'RUNNING') return d[j].running === true ? d3.color(colorPalette.blocks.done.background) : d3.color(colorPalette.blocks.done.background).darker().darker()
          if (d[j].status.previous[i] === 'ERROR') return d[j].running === true ? d3.color(colorPalette.blocks.fail.background) : d3.color(colorPalette.blocks.fail.background).darker().darker()
          if (d[j].status.previous[i] === 'OFF') return d[j].running === true ? d3.color('#333333') : d3.color('#333333').darker().darker()
        })
      g.selectAll('rect#current')
        .attr('fill', (d, i) => {
          if (d[j].status.current === 'RUNNING') return d[j].running === true ? d3.color(colorPalette.blocks.done.background) : d3.color(colorPalette.blocks.done.background).darker()
          if (d[j].status.current === 'ERROR') return d[j].running === true ? d3.color(colorPalette.blocks.fail.background) : d3.color(colorPalette.blocks.fail.background).darker()
          if (d[j].status.current === 'OFF') return d[j].running === true ? d3.color('#333333') : d3.color('#333333').darker()
        })
    }
    function SensorCore (sensors, g) {
      let rows = 0
      for (let el in sensors) {
        rows += sensors[el].length
      }
      lineSize = (box.h - sensors.length * spaceSize) / rows
      let current = g
        .selectAll('g.sensor')
        .data(sensors, function (d) {
          return d.id
        })
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'sensor')

      enter.each(function (d, i) {
        let g = d3.select(this)
        g.append('rect').attr('id', 'background')
        for (let j = 0; j < d.length; j++) {
          let ig = g.append('g').attr('class', 'sensorline')
          let tg = ig.append('g').attr('id', 'timestampsline')
          for (let i = 0; i < d[j].status.previous.length; i++) {
            tg.append('rect')
              .attr('id', 'timestamp')
              .attr('x', 0 + (i * (box.w * 0.8) / d[j].status.previous.length))
              .attr('y', j * lineSize)
              .attr('width', (box.w * 0.8) / d[j].status.previous.length)
              .attr('height', lineSize)
              .attr('fill', () => {
                if (d[j].status.previous[i] === 'RUNNING') return d[j].running === true ? d3.color(colorPalette.blocks.done.background) : d3.color(colorPalette.blocks.done.background).darker().darker()
                if (d[j].status.previous[i] === 'ERROR') return d[j].running === true ? d3.color(colorPalette.blocks.fail.background) : d3.color(colorPalette.blocks.fail.background).darker().darker()
                if (d[j].status.previous[i] === 'OFF') return d[j].running === true ? d3.color('#333333') : d3.color('#333333').darker().darker()
              }) // colorPalette.dark.background)
              .attr('stroke', '#000000')
              .attr('stroke-width', 0.1)
              // .style('opacity', d[j].running === true ? 1 : 0.2)
          }
          ig.append('rect')
            .attr('id', 'current')
            .attr('x', box.w * 0.85)
            .attr('y', j * lineSize)
            .attr('width', (box.w * 0.05))
            .attr('height', lineSize)
            .attr('fill', () => {
              if (d[j].status.current === 'RUNNING') return d[j].running === true ? d3.color(colorPalette.blocks.done.background) : d3.color(colorPalette.blocks.done.background).darker()
              if (d[j].status.current === 'ERROR') return d[j].running === true ? d3.color(colorPalette.blocks.fail.background) : d3.color(colorPalette.blocks.fail.background).darker()
              if (d[j].status.current === 'OFF') return d[j].running === true ? d3.color('#333333') : d3.color('#333333').darker()
            }) // colorPalette.dark.background)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.2)
            .attr('rx', 0)
          // if (d[j].status.current === 'ERROR') {
            // ig.append('rect')
            //   .attr('x', box.w * 0.8)
            //   .attr('y', 0 + j * lineSize - lineSize * 0.5)
            //   .attr('width', lineSize * 2)
            //   .attr('height', lineSize * 2)
            //   .attr('fill', 'gold')
            //   .attr('stroke-width', 0)
            //   // .style('boxShadow', '10px 20px 30px black')
            //   // .on('click', function () {
            //   //   cleanBack()
            //   //   display = undefined
            //   //   focusManager.focusOn('target', d.id)
            //   // })
            //   // .on('mouseover', function (d) {
            //   //   d3.select(this).style('cursor', 'pointer')
            //   //   d3.select(this).attr('fill', colorTheme.darker.background)
            //   // })
            //   // .on('mouseout', function (d) {
            //   //   d3.select(this).style('cursor', 'default')
            //   //   d3.select(this).attr('fill', colorTheme.dark.background)
            //   // })
            // ig.append('svg:image')
            //   .attr('xlink:href', '/static/icons/warning-tri.svg')
            //   .attr('x', box.w * 0.8)
            //   .attr('y', 0 + j * lineSize - lineSize * 0.5)
            //   .attr('width', lineSize * 2)
            //   .attr('height', lineSize * 2)
            //   .style('opacity', 0.5)
            //   .style('pointer-events', 'none')
          // }
        }
      })
      let merge = current.merge(enter)

      let offset = 0
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
        offset += spaceSize + d.length * (lineSize)
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    function initData () {
      box = {
        x: lenD.w[0] * 0.0,
        y: lenD.h[0] * 0.7,
        w: lenD.w[0] * 0.23,
        h: lenD.h[0] * 0.28,
        marg: lenD.w[0] * 0.01
      }

      let fillfun = function () {
        let status = {current: '', previous: []}
        let rand = Math.random()
        if (rand < 0.75) status.current = 'RUNNING'
        else if (rand < 0.9) status.current = 'ERROR'
        else if (rand <= 1) status.current = 'OFF'
        for (let i = 0; i < step; i++) {
          let rand = Math.random()
          if (rand < 0.92) status.previous.push('RUNNING')
          else if (rand < 0.96) status.previous.push('ERROR')
          else if (rand <= 1) status.previous.push('OFF')
        }
        return status
      }
      shared.server.sensors = [
        [{id: 'id0', name: 'Illuminator', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id1', name: 'Photometer', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id2', name: 'All-sky-camera', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id3', name: 'Ceilometer', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id4', name: 'Ceilometer', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id5', name: 'FRAM', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id6', name: 'LIDARs', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id7', name: 'LIDARs', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id8', name: 'Weather-stations', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id9', name: 'Weather-stations', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id10', name: 'Weather-stations', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id11', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id12', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id13', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id14', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id15', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id16', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id17', name: 'Precipitation', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id18', name: 'Precipitation', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id19', name: 'Precipitation', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id20', name: 'Dust', status: fillfun(), running: Math.random() < 0.5}],
        [{id: 'id21', name: 'Accelerometers', status: fillfun(), running: Math.random() < 0.5},
          {id: 'id22', name: 'Accelerometers', status: fillfun(), running: true}]
      ]

      let main = svg.g.append('g').attr('id', 'hardwareMonitoring')
      scrollbox = initScrollBox('heatmapScrollbox', main.append('g').attr('id', 'heatmapSensors').attr('transform', 'translate(' + box.x + ',' + (box.y + box.h * 0.05) + ')'), box, {}, true)
      // main.append('rect')
      //   .attr('x', box.x)
      //   .attr('y', box.y)
      //   .attr('width', box.w)
      //   .attr('height', box.y)
      //   .attr('fill', colorPalette.darker.background)
      main.append('rect')
        .attr('x', box.x)
        .attr('y', (box.y - 18) + 'px')
        .attr('width', box.w)
        .attr('height', '24px')
        .attr('fill', colorPalette.darker.background)
      main.append('text')
        .text('Hardware Monitoring')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .style('user-select', 'none')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (box.x + 2) + ',' + (box.y) + ')')

      let gsens = scrollbox.get('innerG')
      main.append('rect')
        .attr('x', box.x + box.w * 0.9)
        .attr('y', (box.y - 14) + 'px')
        .attr('width', '16px')
        .attr('height', '16px')
        .attr('fill', 'transparent')
        .attr('stroke-width', 0)
        .style('boxShadow', '10px 20px 30px black')
        .on('click', function () {
          changeState('heatmap')
        })
        .on('mouseover', function (d) {
          d3.select(this).style('cursor', 'pointer')
          d3.select(this).attr('fill', colorPalette.darker.background)
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          d3.select(this).attr('fill', 'transparent')
        })
      main.append('svg:image')
        .attr('xlink:href', '/static/icons/full-size.svg')
        .attr('x', box.x + box.w * 0.9)
        .attr('y', (box.y - 14) + 'px')
        .attr('width', '16px')
        .attr('height', '16px')
        .style('pointer-events', 'none')

      SensorCore(shared.server.sensors, gsens)
    }
    this.initData = initData

    function updateData () {}
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgMeasuredData = function () {
    let box
    let expanded = false
    let scrollbox

    function shift () {
      svg.g.select('g#measuredData')
        .transition()
        .duration(600)
        .attr('transform', 'translate(' + 0 + ',' + box.h * 0.7 + ')')
    }
    this.shift = shift
    function unshift () {
      svg.g.select('g#measuredData')
        .transition()
        .duration(600)
        .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    }
    this.unshift = unshift
    function expand (g) {
      // svgHeathMapSensors.changeState('measured', 'expanded')

      // svg.g.select('g#measuredData')
      //   .transition()
      //   .delay(250)
      //   .duration(600)
      //   .attr('transform', 'translate(' + 0 + ',' + -box.h * 0.35 + ')')
    }
    function shrink (g) {
      svgHeathMapSensors.changeState('measured', 'default')

      // svg.g.select('g#measuredData')
      //   .transition()
      //   .duration(600)
      //   .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    }
    function measuredCore () {
      console.log(shared.server.measures);
      let current = scrollbox.get('innerG')
        .selectAll('g.measures')
        .data(shared.server.measures, function (d) {
          return d.id
        })
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'measures')

      enter.each(function (d, i) {
        let g = d3.select(this)
        g.append('rect').attr('id', 'background')
        let main = g.append('g').attr('id', 'mainMeasure')
          .on('mouseenter', () => {
            d3.select(this).style('cursor', 'pointer')
            main.select('#background').attr('fill', colorPalette.darker.background)
          })
          .on('mouseleave', () => {
            d3.select(this).style('cursor', 'default')
            main.select('#background').attr('fill', 'transparent')
          })
          .on('click', () => addDataToPlot(d))
        main.append('rect')
          .attr('id', 'background')
          .attr('x', 0)
          .attr('y', -18)
          .attr('width', box.w)
          .attr('height', 38)
          .attr('fill', 'transparent')
        let min = Math.min(...d.status.previous.map((a) => a.y), d.status.current.y)
        let max = Math.max(...d.status.previous.map((a) => a.y), d.status.current.y)

        // main.append('defs')
        //   .append('clipPath')
        //   .attr('id', 'rect-clip' + d.id)
        //   .append('rect')
        //   .attr('x', 12 + (box.w * 0.45 / 50 * min))
        //   .attr('y', -12)
        //   .attr('width', (box.w * 0.45 / 50 * (max - min)))
        //   .attr('height', 12)
        //   .style('fill-opacity', 0)
        // main.append('rect')
        //   .attr('x', 0)
        //   .attr('y', -12)
        //   .attr('width', box.w * 0.075)
        //   .attr('height', 12)
        //   .attr('fill', colorPalette.blocks.fail.background)
        //   .attr('stroke', 'none')
        //   .attr('rx', 0)
        //   .style('opacity', 0.8)
        //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
        // main.append('rect')
        //   .attr('x', 0 + box.w * 0.075)
        //   .attr('y', -12)
        //   .attr('width', box.w * 0.075)
        //   .attr('height', 12)
        //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
        //   .attr('stroke', 'none')
        //   .attr('rx', 0)
        //   .style('opacity', 0.8)
        //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
        // main.append('rect')
        //   .attr('x', 0 + box.w * 0.15)
        //   .attr('y', -12)
        //   .attr('width', box.w * 0.15)
        //   .attr('height', 12)
        //   .attr('fill', colorPalette.blocks.done.background) // colorPalette.dark.background)
        //   .attr('stroke', 'none')
        //   .attr('rx', 0)
        //   .style('opacity', 0.8)
        //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
        // main.append('rect')
        //   .attr('x', 0 + box.w * 0.3)
        //   .attr('y', -12)
        //   .attr('width', box.w * 0.075)
        //   .attr('height', 12)
        //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
        //   .attr('stroke', 'none')
        //   .attr('rx', 0)
        //   .style('opacity', 0.8)
        //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
        // main.append('rect')
        //   .attr('x', 0 + box.w * 0.375)
        //   .attr('y', -12)
        //   .attr('width', box.w * 0.075)
        //   .attr('height', 12)
        //   .attr('fill', colorPalette.blocks.fail.background)
        //   .attr('stroke', 'none')
        //   .attr('rx', 0)
        //   .style('opacity', 0.8)
        //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
        //
        // main.append('rect')
        //   .attr('x', 0 + (box.w * 0.45 / 50 * d.status.current))
        //   .attr('y', -12)
        //   .attr('width', 3)
        //   .attr('height', 12)
        //   .attr('fill', '#000000') // colorPalette.dark.background)
        //   .attr('stroke', 'none')
        //   .attr('rx', 0)
        //
        // main.append('text')
        //   .attr('id', 'measurelabel')
        //   .text(d.name + ':')
        //   .attr('x', box.w * 0.48)
        //   .attr('y', 0)
        //   .style('font-size', '12px')
        // main.append('text')
        //   .attr('id', 'valuelabel')
        //   .text(d.status.current)
        //   .attr('x', box.w * 0.75)
        //   .attr('y', 0)
        //   .style('font-size', '12px')
        //   .style('font-weight', 'bold')
        // main.append('text')
        //   .attr('id', 'unitlabel')
        //   .text(d.unit)
        //   .attr('x', box.w * 0.88)
        //   .attr('y', 0)
        //   .style('font-size', '9px')
        //   .style('font-weight', '')

        main.append('rect')
          .attr('x', 12)
          .attr('y', -13)
          .attr('width', (box.w * 0.45))
          .attr('height', 30)
          .attr('fill', 'none')
          .attr('stroke', '#000000')
          .attr('stroke-width', 0.1)
        main.append('defs')
          .append('clipPath')
          .attr('id', 'rect-clip' + d.id)
          .append('rect')
          .attr('x', 12 + (box.w * 0.45 / 100 * min))
          .attr('y', -13)
          .attr('width', (box.w * 0.45 / 100 * (max - min)))
          .attr('height', 30)
          .style('fill-opacity', 0)
        let healthg = main.append('g').attr('id', 'healthGroup')
        healthg.append('rect')
          .attr('x', 12)
          .attr('y', -13)
          .attr('width', box.w * 0.075)
          .attr('height', 30)
          .attr('fill', colorPalette.blocks.fail.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.8)
          .attr('clip-path', 'url(#rect-clip' + d.id + ')')
        healthg.append('rect')
          .attr('x', 12 + box.w * 0.075)
          .attr('y', -13)
          .attr('width', box.w * 0.075)
          .attr('height', 30)
          .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.8)
          .attr('clip-path', 'url(#rect-clip' + d.id + ')')
        healthg.append('rect')
          .attr('x', 12 + box.w * 0.15)
          .attr('y', -13)
          .attr('width', box.w * 0.15)
          .attr('height', 30)
          .attr('fill', colorPalette.blocks.done.background) // colorPalette.dark.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.8)
          .attr('clip-path', 'url(#rect-clip' + d.id + ')')
        healthg.append('rect')
          .attr('x', 12 + box.w * 0.3)
          .attr('y', -13)
          .attr('width', box.w * 0.075)
          .attr('height', 30)
          .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.8)
          .attr('clip-path', 'url(#rect-clip' + d.id + ')')
        healthg.append('rect')
          .attr('x', 12 + box.w * 0.375)
          .attr('y', -13)
          .attr('width', box.w * 0.075)
          .attr('height', 30)
          .attr('fill', colorPalette.blocks.fail.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.8)
          .attr('clip-path', 'url(#rect-clip' + d.id + ')')

        main.append('rect')
          .attr('x', 12 + (box.w * 0.45 / 100 * d.status.current.y))
          .attr('y', -13)
          .attr('width', 1)
          .attr('height', 30)
          .attr('fill', '#000000') // colorPalette.dark.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
        main.append('circle')
          .attr('cx', 13 + (box.w * 0.45 / 100 * d.status.current.y))
          .attr('cy', 0)
          .attr('r', 4)
          .attr('fill', '#000000')
          .attr('stroke', 'none')
          .attr('rx', 0)

        main.append('text')
          .attr('id', 'measurelabel')
          .text(d.name)
          .attr('x', box.w * 0.55)
          .attr('y', -5)
          .style('font-size', '12px')
          .style('user-select', 'none')
        main.append('text')
          .attr('id', 'valuelabel')
          .text(d.status.current.y)
          .attr('x', box.w * 0.55)
          .attr('y', 12)
          .style('font-size', '16px')
          .style('font-weight', 'bold')
          .style('user-select', 'none')
        main.append('text')
          .attr('id', 'unitlabel')
          .text(d.unit)
          .attr('x', box.w * 0.73)
          .attr('y', 12)
          .style('font-size', '10px')
          .style('font-weight', '')
          .style('user-select', 'none')
      })
      let merge = current.merge(enter)

      let offset = 16
      merge.each(function (d, i) {
        let min = Math.min(...d.status.previous.map((a) => a.y), d.status.current.y)
        let max = Math.max(...d.status.previous.map((a) => a.y), d.status.current.y)

        let g = d3.select(this)
        g.select('g#mainMeasure')
          .on('click', () => addDataToPlot(d))
        g.select('g#mainMeasure clipPath#rect-clip' + d.id + ' rect')
          .transition()
          .duration(400)
          .attr('x', 12 + (box.w * 0.45 / 100 * min))
          .attr('width', (box.w * 0.45 / 100 * (max - min)))
        g.attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
        offset += 38
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    function initData () {
      box = {
        x: lenD.w[0] * 0.0,
        y: 48,
        w: lenD.w[0] * 0.23,
        h: lenD.h[0] * 0.55,
        marg: lenD.w[0] * 0.01
      }

      let main = svg.g.append('g').attr('id', 'measuredData')
      scrollbox = initScrollBox('measuredScrollbox', main.append('g').attr('id', 'measured').attr('transform', 'translate(' + box.x + ',' + (box.y + box.h * 0.03) + ')'), box, {}, true)

      main.append('rect')
        .attr('x', box.x)
        .attr('y', (box.y - 18) + 'px')
        .attr('width', box.w)
        .attr('height', '24px')
        .attr('fill', colorPalette.dark.background)
      main.append('text')
        .text('Measured Data')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .style('user-select', 'none')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + box.x + 4 + ',' + box.y + ')')
      // let startY = lenD.h[0] * 0.4
      // let endY = lenD.h[0] * 0.6
      // svg.g.append('rect')
      //   .attr('x', lenD.w[0] * 0.0)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.015)
      //   .attr('height', endY)
      //   .attr('fill', '#0288D1')
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.g.append('rect')
      //   .attr('x', lenD.w[0] * 0.015)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.015)
      //   .attr('height', endY)
      //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.g.append('rect')
      //   .attr('x', lenD.w[0] * 0.03)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.03)
      //   .attr('height', endY)
      //   .attr('fill', colorPalette.blocks.done.background) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.g.append('rect')
      //   .attr('x', lenD.w[0] * 0.06)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.015)
      //   .attr('height', endY)
      //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.g.append('rect')
      //   .attr('x', lenD.w[0] * 0.075)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.015)
      //   .attr('height', endY)
      //   .attr('fill', '#0288D1')
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)

      main.append('rect')
        .attr('x', box.x + box.w * 0.9)
        .attr('y', (box.y - 14) + 'px')
        .attr('width', '16px')
        .attr('height', '16px')
        .attr('fill', 'transparent')
        .attr('stroke-width', 0)
        .style('boxShadow', '10px 20px 30px black')
        .on('click', function () {
          if (expanded) {
            expanded = false
            shrink(gmes)
          } else {
            expanded = true
            expand(gmes)
          }
        })
        .on('mouseover', function (d) {
          d3.select(this).style('cursor', 'pointer')
          d3.select(this).attr('fill', colorPalette.darker.background)
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          d3.select(this).attr('fill', 'transparent')
        })
      main.append('svg:image')
        .attr('xlink:href', '/static/icons/full-size.svg')
        .attr('x', box.x + box.w * 0.9)
        .attr('y', (box.y - 14) + 'px')
        .attr('width', '16px')
        .attr('height', '16px')
        .style('pointer-events', 'none')

      measuredCore()
    }
    this.initData = initData

    function updateData () {
      measuredCore()
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgFMSupervision = function () {
    let box
    let expanded = false
    let scrollbox

    // function expand (g) {
    //   // svgHeathMapSensors.changeState('measured', 'expanded')
    //
    //   // svg.g.select('g#measuredData')
    //   //   .transition()
    //   //   .delay(250)
    //   //   .duration(600)
    //   //   .attr('transform', 'translate(' + 0 + ',' + -box.h * 0.35 + ')')
    // }
    // function shrink (g) {
    //   svgHeathMapSensors.changeState('measured', 'default')
    //
    //   // svg.g.select('g#measuredData')
    //   //   .transition()
    //   //   .duration(600)
    //   //   .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    // }
    function createUrgentList () {
      let urgentList = []
      for (let i = 0; i < shared.server.sensors.length; i++) {
        for (let j = 0; j < shared.server.sensors[i].length; j++) {
          if (shared.server.sensors[i][j].status.current === 'ERROR') urgentList.push({type: 'sensor', data: shared.server.sensors[i][j]})
        }
      }
      for (let i = 0; i < shared.server.sensors.length; i++) {
        if (shared.server.measures[i].status.current < 10 || shared.server.measures[i].status.current > 40) {
          urgentList.push({type: 'measure', data: shared.server.measures[i]})
        }
      }
      return urgentList
    }
    function serpervisionCore (g) {
      let data = createUrgentList()
      let size = {x: 6, y: 26, w: 30, h: 30, marg: 4}

      let current = g
        .selectAll('g.urgent')
        .data(data)
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'urgent')

      enter.each(function (d, i) {
        let g = d3.select(this)
        g.append('rect')
          .attr('x', size.x)
          .attr('y', size.y)
          .attr('width', size.w)
          .attr('height', size.h)
          .attr('fill', function () {
            if (d.type === 'measure') return 'red'
            if (d.type === 'sensor') return 'blue'
          })
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.6)

        g.append('text')
          .attr('id', 'label')
          .text(function () {
            if (d.type === 'measure') return d.data.name
            if (d.type === 'sensor') return d.data.name
          })
          .attr('x', size.x)
          .attr('y', size.y + size.h / 2)
          .style('font-size', '14px')
        // g.append('text')
        //   .attr('id', 'unitlabel')
        //   .text(d.unit)
        //   .attr('x', box.w * 0.72)
        //   .attr('y', 14)
        //   .style('font-size', '12px')
        //   .style('font-weight', '')
      })
      let merge = current.merge(enter)

      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + ((i % 1) * (size.w + size.marg)) + ',' + (parseInt(i / 1) * (size.h + size.marg)) + ')')
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    function initData () {
      box = {
        x: 8,
        y: lenD.h[0] * 0.2,
        w: lenD.w[0] * 0.18,
        h: lenD.h[0] * 0.4,
        marg: lenD.w[0] * 0.01
      }

      let main = svg.floatingMenuRoot.append('g').attr('id', 'urgentSupervision')
        .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
      scrollbox = initScrollBox('supervisionScrollbox', main.append('g').attr('id', 'supervision').attr('transform', 'translate(' + 0 + ',' + 6 + ')'), box, {}, true)

      // main.append('rect')
      //   .attr('x', box.x)
      //   .attr('y', box.y)
      //   .attr('width', box.w)
      //   .attr('height', box.h)
      //   .attr('fill', 'none') // 'url(#patternLock)')
      //   .attr('stroke', colorPalette.dark.stroke)
      //   .attr('stroke-width', 0.2)
      //   .style('opacity', 0.2)
      main.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.w)
        .attr('height', '22px')
        .attr('fill', colorPalette.darkest.background)
      main.append('text')
        .text('Urgent supervision')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '15px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (4) + ',' + (16) + ')')

      let gmes = scrollbox.get('innerG')

      // main.append('rect')
      //   .attr('x', box.x + box.w * 0.9)
      //   .attr('y', (box.y - 14) + 'px')
      //   .attr('width', '16px')
      //   .attr('height', '16px')
      //   .attr('fill', 'transparent')
      //   .attr('stroke-width', 0)
      //   .style('boxShadow', '10px 20px 30px black')
      //   .on('click', function () {
      //     if (expanded) {
      //       expanded = false
      //       shrink(gmes)
      //     } else {
      //       expanded = true
      //       expand(gmes)
      //     }
      //   })
      //   .on('mouseover', function (d) {
      //     d3.select(this).style('cursor', 'pointer')
      //     d3.select(this).attr('fill', colorPalette.darker.background)
      //   })
      //   .on('mouseout', function (d) {
      //     d3.select(this).style('cursor', 'default')
      //     d3.select(this).attr('fill', 'transparent')
      //   })
      // main.append('svg:image')
      //   .attr('xlink:href', '/static/icons/full-size.svg')
      //   .attr('x', box.x + box.w * 0.9)
      //   .attr('y', (box.y - 14) + 'px')
      //   .attr('width', '16px')
      //   .attr('height', '16px')
      //   .style('pointer-events', 'none')
      serpervisionCore(gmes)
    }
    this.initData = initData

    function updateData () {}
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgFMDate = function () {
    let box

    function initData () {
      box = {
        x: 8,
        y: 0,
        w: lenD.w[0] * 0.18,
        h: lenD.h[0] * 0.065
      }

      let main = svg.floatingMenuRoot.append('g').attr('id', 'fmdate')

      main.append('rect')
        .attr('x', box.x)
        .attr('y', box.y)
        .attr('width', box.w)
        .attr('height', box.h)
        .attr('fill', colorPalette.darkest.stroke)
        .attr('stroke', colorPalette.darkest.stroke)
        .attr('stroke-width', 0.3)
        .attr('rx', 0)
      main.append('text')
        .attr('id', 'currentHourTop')
        .attr('stroke', colorPalette.bright.background)
        .attr('stroke-width', 0.0)
        .attr('fill', colorPalette.bright.background)
        .attr('x', box.w * 0.5)
        .attr('y', box.h * 0.4)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      main.append('text')
        .attr('id', 'currentHourBottom')
        .attr('stroke', colorPalette.bright.background)
        .attr('stroke-width', 0.0)
        .attr('fill', colorPalette.bright.background)
        .attr('x', box.w * 0.5)
        .attr('y', box.h * 0.8)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', '20px')
        .style('pointer-events', 'none')
        .style('user-select', 'none')

      updateData()
    }
    this.initData = initData

    function updateData () {
      let currentTime = {date: new Date(shared.server.timeOfNight.date_now)}
      svg.floatingMenuRoot.select('g#fmdate text#currentHourTop').text(d3.timeFormat('%b %a %d, %Y')(currentTime.date))
      svg.floatingMenuRoot.select('g#fmdate text#currentHourBottom').text(d3.timeFormat('%H:%M:%S UTC')(currentTime.date))
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgFMTimeline = function () {
    let box
    let stock = {}

    function changeBlockTime (a, b) {
      shared.time.range = 1000 * (3600 * (parseInt(a) - 1) + 60 * parseInt(b))
      shared.time.from.setTime(shared.time.current.getTime() - shared.time.range)
      loadMesures()
      svgMeasuredData.updateData()
      svgPlotDisplay.updateData()
    }
    function createInput (type, g, innerbox) {
      stock[type + 'MinusButton'] = new buttonD3()
      stock[type + 'MinusButton'].init({
        main: {
          id: type + 'MinusButton',
          g: g,
          box: {x: innerbox.x - 3, y: innerbox.y + 12, width: 9, height: 9},
          background: {
            common: {
              style: {
                fill: colorPalette.medium.background,
                stroke: colorPalette.medium.stroke,
                'stroke-width': 0.1
              },
              attr: {
                rx: 2
              }
            },
            hovered: {
              style: {
                fill: colorPalette.darkest.background,
                stroke: colorPalette.darkest.stroke,
                'stroke-width': 0.1
              },
              attr: {}
            }
          }
        },
        foreground: {
          type: 'text',
          value: '-',
          common: {
            style: {
              font: 'bold',
              'font-size': '9px',
              fill: colorPalette.medium.text,
              anchor: 'middle',
              'pointer-events': 'none',
              'user-select': 'none'
            },
            attr: {
              x: innerbox.x - 3 + 3,
              y: innerbox.y + 12 + 7
            }
          },
          hovered: {
            style: {
              font: 'bold',
              'font-size': '14px',
              fill: colorPalette.medium.text,
              anchor: 'start',
              'pointer-events': 'none',
              'user-select': 'none'
            },
            attr: {}
          }
        },
        events: {
          click: (d) => {
            let oldValue = parseInt(stock[type].property('value'))
            let newVal = oldValue
            if (oldValue > stock[type + 'Opts'].min) {
              newVal = oldValue - 1
            } else {
              newVal = stock[type + 'Opts'].max
            }
            stock[type].property('value', ('0' + newVal).slice(-2))
            changeBlockTime(stock.hour.property('value'), stock.minute.property('value'))
          }
        }
      })

      stock[type + 'PlusButton'] = new buttonD3()
      stock[type + 'PlusButton'].init({
        main: {
          id: type + 'PlusButton',
          g: g,
          box: {x: innerbox.x + 6, y: innerbox.y + 12, width: 9, height: 9},
          background: {
            common: {
              style: {
                fill: colorPalette.medium.background,
                stroke: colorPalette.medium.stroke,
                'stroke-width': 0.1
              },
              attr: {
                rx: 2
              }
            },
            hovered: {
              style: {
                fill: colorPalette.darkest.background,
                stroke: colorPalette.darkest.stroke,
                'stroke-width': 0.1
              },
              attr: {}
            }
          }
        },
        foreground: {
          type: 'text',
          value: '+',
          common: {
            style: {
              font: 'bold',
              'font-size': '9px',
              fill: colorPalette.medium.text,
              anchor: 'middle',
              'pointer-events': 'none',
              'user-select': 'none'
            },
            attr: {
              x: innerbox.x + 6 + 2,
              y: innerbox.y + 12 + 7
            }
          },
          hovered: {
            style: {
              font: 'bold',
              'font-size': '14px',
              fill: colorPalette.medium.text,
              anchor: 'start',
              'pointer-events': 'none',
              'user-select': 'none'
            },
            attr: {}
          }
        },
        events: {
          click: (d) => {
            let oldValue = parseInt(stock[type].property('value'))
            let newVal = oldValue
            if (oldValue < stock[type + 'Opts'].max) {
              newVal = oldValue + 1
            } else {
              newVal = stock[type + 'Opts'].min
            }
            stock[type].property('value', ('0' + newVal).slice(-2))
            changeBlockTime(stock.hour.property('value'), stock.minute.property('value'))
          }
        }
      })
    }
    function initData () {
      box = {
        x: 8,
        y: lenD.h[0] * 0.07,
        w: lenD.w[0] * 0.18,
        h: lenD.h[0] * 0.1
      }

      let main = svg.floatingMenuRoot.append('g').attr('id', 'fmdate')
        .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
        .style('pointer-events', 'auto')

      main.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.w)
        .attr('height', '22px')
        .attr('fill', colorPalette.darkest.background)
      main.append('text')
        .text('Timeline range')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '15px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (4) + ',' + (16) + ')')
      main.append('rect')
        .attr('x', 0)
        .attr('y', box.h * 0.26)
        .attr('width', box.w * 0.96)
        .attr('height', box.h * 0.38)
        .attr('fill', colorPalette.dark.background)
        .attr('rx', 2)
      main.append('rect')
        .attr('x', 0)
        .attr('y', box.h * 0.68)
        .attr('width', box.w * 0.96)
        .attr('height', box.h * 0.42)
        .attr('fill', colorPalette.dark.background)
        .attr('rx', 2)

      let gDateSelector = main.append('g').attr('transform', 'translate(' + (box.w * 0.0) + ',' + (box.h * 0.28) + '), scale(1.5,1.5)')
      gDateSelector.append('text')
        .text('Last:')
        .style('fill', '#000000')
        .style('font-weight', '')
        .style('font-size', '9px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (15) + ',' + (box.h * 0.12) + ')')

      let fontSize = 11
      let time = new Date(18000000)
      let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
      let hbox = {
        x: box.w * 0.3,
        y: 0,
        w: 14,
        h: 18
      }
      let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
      let mbox = {
        x: box.w * 0.45,
        y: 0,
        w: 14,
        h: 18
      }

      stock.hourOpts = {disabled: false, value: hour, min: 0, max: 23, step: 1}
      stock.hour = inputDateD3(gDateSelector,
        hbox,
        'hour',
        stock.hourOpts,
        {change: (d) => { changeBlockTime(d, stock.minute.property('value')) }, enter: (d) => { stock.minute.node().focus() }})
      createInput('hour', gDateSelector, hbox)
      gDateSelector.append('text')
        .text(':')
        .style('fill', colorPalette.dark.stroke)
        .style('font-size', fontSize + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5 + 5) + ',' + (hbox.h * 0.5) + ')')
      stock.minuteOpts = {disabled: false, value: min, min: 0, max: 59, step: 1}
      stock.minute = inputDateD3(gDateSelector,
        mbox,
        'minute',
        stock.minuteOpts,
        {change: (d) => { changeBlockTime(stock.hour.property('value'), d) }, enter: (d) => { stock.second.node().focus() }})
      createInput('minute', gDateSelector, mbox)

      let gFromToSelector = main.append('g').attr('transform', 'translate(' + (box.w * 0.03) + ',' + (box.h * 0.7) + ')')
        .style('opacity', 0.2)
      gFromToSelector.append('text')
        .text('From:')
        .style('fill', '#000000')
        .style('font-weight', '')
        .style('font-size', '13.5px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (15) + ',' + (box.h * 0.12) + ')')
      gFromToSelector.append('text')
        .text('To:')
        .style('fill', '#000000')
        .style('font-weight', '')
        .style('font-size', '13.5px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (15) + ',' + (box.h * 0.34) + ')')

      updateData()
    }
    this.initData = initData

    function updateData () {
      let currentTime = {date: new Date(shared.server.timeOfNight.date_now)}
      svg.floatingMenuRoot.select('text#currentHourTop').text(d3.timeFormat('%b %a %d, %Y')(currentTime.date))
      svg.floatingMenuRoot.select('text#currentHourBottom').text(d3.timeFormat('%H:%M:%S UTC')(currentTime.date))
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let svgFMTimeline = new SvgFMTimeline()
  let svgFMDate = new SvgFMDate()
  let svgFMSupervision = new SvgFMSupervision()
  let svgMeasuredData = new SvgMeasuredData()
  let svgHeathMapSensors = new SvgHeathMapSensors()
  let svgPlotDisplay = new SvgPlotDisplay()
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
