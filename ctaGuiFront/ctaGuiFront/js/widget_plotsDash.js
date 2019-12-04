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
          h: $(svg.svg.node()).height() * 0.5
        }
        svgUrgentPlots.adjustScrollBox()
        svgUrgentPlots.adjustPlotDistribution()

        box.pinnedPlots = {
          x: 0,
          y: $(svg.svg.node()).height() * 0.5,
          w: $(svg.svg.node()).width(),
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
        w: $(svg.svg.node()).width(),
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

    // svgPlotDisplay.updateData()
    shared.time.current = new Date(shared.server.timeOfNight.date_now)

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
    shared.server.measures = [
      {id: 'id0', name: 'Measure1', status: fillfun(1), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id1', name: 'Measure2', status: fillfun(2), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id2', name: 'Measure3', status: fillfun(3), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id3', name: 'Measure4', status: fillfun(4), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id4', name: 'subMeasure.14', status: fillfun(5), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id5', name: 'Measure5', status: fillfun(6), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id6', name: 'Measure6', status: fillfun(7), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id7', name: 'subMeasure6.1', status: fillfun(8), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id8', name: 'Measure7', status: fillfun(9), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id9', name: 'subMeasure7.1', status: fillfun(10), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id10', name: 'subMeasure7.2', status: fillfun(11), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id11', name: 'Measure8', status: fillfun(12), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id12', name: 'subMeasure8.1', status: fillfun(13), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id13', name: 'subMeasure8.2', status: fillfun(14), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id14', name: 'subMeasure8.3', status: fillfun(15), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id15', name: 'subMeasure8.4', status: fillfun(16), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id16', name: 'subMeasure8.5', status: fillfun(17), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id17', name: 'Measure9', status: fillfun(18), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id18', name: 'subMeasure9.1', status: fillfun(19), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]},
        {id: 'id19', name: 'subMeasure9.2', status: fillfun(20), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]},
      {id: 'id20', name: 'Measure10', status: fillfun(21), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
      {id: 'id21', name: 'Measure11', status: fillfun(22), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        {id: 'id22', name: 'subMeasure11.1', status: fillfun(23), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
      ]}
    ]
  }

  let SvgPinnedPlots = function () {
    let scrollbox
    let miniPlotbox
    let lastPlotbox
    let focusPlotbox
    let plotList = []

    function adjustScrollBox () {
      return
      if (!scrollbox) return
      let nbperline = Math.floor(box.pinnedPlots.w / (plotbox.w + 29))
      scrollbox.updateBox({x: 0, y: 0, w: box.pinnedPlots.w, h: box.pinnedPlots.h})
      scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: (15 + plotbox.h * 0.15 + (plotbox.h + 20) * Math.ceil(plotList.length / nbperline))})
      // scrollbox.updateHorizontalScroller({canScroll: true, scrollWidth: 0})
    }
    this.adjustScrollBox = adjustScrollBox
    function adjustPlotDistribution () {
      return
      let nbperline = Math.floor(box.pinnedPlots.w / (plotbox.w + 29))
      console.log(d3.select(plotList[6].get('main').g.node().parentNode.parentNode.parentNode.parentNode).attr('transform'))
      for (let i = 0; i < plotList.length; i++) {
        d3.select(plotList[i].get('main').g.node().parentNode.parentNode.parentNode.parentNode)
          .transition()
          .duration(400)
          .attr('transform', 'translate(' + (25 + (plotbox.w + 30) * (i % nbperline)) + ',' + (15 + plotbox.h * 0.15 + (plotbox.h + 20) * parseInt(i / nbperline)) + ')')
      }
    }
    this.adjustPlotDistribution = adjustPlotDistribution
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
            enabled: true,
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
          },
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
        content: {}
      })
      return plot
    }

    function initData () {
      miniPlotbox = {
        x: lenD.w[0] * 0.21,
        y: 10,
        w: 180 * 0.72,
        h: 125 * 0.72
      }
      lastPlotbox = {
        x: 0,
        y: 0,
        w: 180,
        h: 125
      }
      focusPlotbox = {
        x: 0,
        y: 0,
        w: 180,
        h: 125
      }

      let plotlistg = svg.svg.append('g').attr('id', 'plotList')
        .style('pointer-events', 'auto')
      let gg = plotlistg.append('g').attr('id', 'plotListscroll').attr('transform', 'translate(' + box.pinnedPlots.x + ',' + box.pinnedPlots.y + ')')
      scrollbox = initScrollBox('pinnedPlotsScrollbox', gg, box.pinnedPlots, {}, true)
      let pinnedPlot = scrollbox.get('innerG')

      let nbperline = Math.floor(box.pinnedPlots.w * 0.8 / (miniPlotbox.w + 29))
      for (var i = 0; i < 16; i++) {
        let optIn = {g: pinnedPlot.append('g'),
          box: miniPlotbox
        }
        optIn.g.attr('transform', 'translate(' + (25 + (miniPlotbox.w + 30) * (i % nbperline)) + ',' + (15 + miniPlotbox.h * 0.15 + (miniPlotbox.h + 20) * parseInt(i / nbperline)) + ')')
        optIn.g = optIn.g.append('g')
        let plot = createPlot(optIn)
        plotList.push(plot)

        let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
        let endTime = {date: new Date(shared.server.timeOfNight.date_now), time: Number(shared.server.timeOfNight.now)}
        plot.updateAxis({
          id: 'bottom',
          domain: [startTime.date, endTime.date],
          range: [0, optIn.box.w]
        })
        plot.updateAxis({
          id: 'left',
          domain: [0, 100],
          range: [optIn.box.h, 0]
        })

        let data = shared.server.measures[Math.floor((Math.random() * 11))]
        plot.bindData(data.id, [data.status.current].concat(data.status.previous), 'bottom', 'left')
      }

      adjustScrollBox()
      adjustPlotDistribution()

      plotlistg.append('rect')
        .attr('x', box.pinnedPlots.x + box.pinnedPlots.w * 0.26)
        .attr('y', box.pinnedPlots.y)
        .attr('width', '200px')
        .attr('height', '20px')
        .attr('fill', colorPalette.darkest.background) // colorPalette.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      plotlistg.append('text')
        .text('Pinned Plots')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (box.pinnedPlots.x + box.pinnedPlots.w * 0.26 + 10) + ',' + (box.pinnedPlots.y + 16) + ')')

      function drawFakeTitle () {
        function drawTitle (i) {
          plotlistg.append('text')
            .text('Title')
            .style('fill', '#000000')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (box.pinnedPlots.x + 10) + ',' + (box.pinnedPlots.y + 30 + i * 18) + ')')
        }
        function drawLine (i) {
          plotlistg.append('text')
            .text('Information Information')
            .style('fill', '#000000')
            .style('font-weight', '')
            .style('font-size', '12px')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (box.pinnedPlots.x + 16) + ',' + (box.pinnedPlots.y + 30 + i * 18) + ')')
        }
        drawTitle(0)
        drawLine(1)
        drawLine(2)
        drawLine(3)
        drawLine(4)
        drawTitle(5)
        drawLine(6)
        drawLine(7)
        drawTitle(8)
        drawLine(9)
        drawLine(10)
        drawLine(11)
        drawLine(12)
        drawLine(13)
        drawLine(14)
        drawTitle(15)
        drawLine(16)
        drawLine(17)
        drawLine(18)
        drawLine(19)
        drawLine(20)
      }
      drawFakeTitle()
    }
    this.initData = initData

    function updateData () {
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgUrgentPlots = function () {
    let scrollbox
    let plotbox
    let plotList = []

    function adjustScrollBox () {
      if (!scrollbox) return
      let nbperline = Math.floor(box.urgentPlots.w / (plotbox.w + 29))
      scrollbox.updateBox({x: 0, y: 0, w: box.urgentPlots.w, h: box.urgentPlots.h})
      scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: (15 + plotbox.h * 0.15 + (plotbox.h + 20) * Math.ceil(plotList.length / nbperline))})
      // scrollbox.updateHorizontalScroller({canScroll: true, scrollWidth: 0})
    }
    this.adjustScrollBox = adjustScrollBox
    function adjustPlotDistribution () {
      let nbperline = Math.floor(box.urgentPlots.w / (plotbox.w + 29))
      console.log(d3.select(plotList[6].get('main').g.node().parentNode.parentNode.parentNode.parentNode).attr('transform'))
      for (let i = 0; i < plotList.length; i++) {
        d3.select(plotList[i].get('main').g.node().parentNode.parentNode.parentNode.parentNode)
          .transition()
          .duration(400)
          .attr('transform', 'translate(' + (25 + (plotbox.w + 30) * (i % nbperline)) + ',' + (15 + plotbox.h * 0.15 + (plotbox.h + 20) * parseInt(i / nbperline)) + ')')
      }
    }
    this.adjustPlotDistribution = adjustPlotDistribution
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
            enabled: true,
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
        content: {}
      })
      return plot
    }

    function initData () {
      plotbox = {
        x: 0,
        y: 10,
        w: lenD.w[0] * 0.18,
        h: lenD.h[0] * 0.16 * 0.5
      }

      let plotlistg = svg.svg.append('g').attr('id', 'plotList')
        .style('pointer-events', 'auto')
      let gg = plotlistg.append('g').attr('id', 'plotListscroll').attr('transform', 'translate(' + box.urgentPlots.x + ',' + box.urgentPlots.y + ')')
      scrollbox = initScrollBox('urgentPlotsScrollbox', gg, box.urgentPlots, {}, true)
      let pinnedPlot = scrollbox.get('innerG')

      // let nbperline = Math.floor(box.urgentPlots.w / (plotbox.w + 29))
      for (var i = 0; i < 12; i++) {
        let plotb = {
          x: plotbox.x,
          y: plotbox.y,
          w: plotbox.w,
          h: plotbox.h * 0.9
        }
        let optIn = {g: pinnedPlot.append('g'),
          box: plotb
        }
        // optIn.g.attr('transform', 'translate(' + (25 + (plotbox.w + 30) * (i % nbperline)) + ',' + (15 + plotbox.h * 0.15 + (plotbox.h + 20) * parseInt(i / nbperline)) + ')')
        optIn.g = optIn.g.append('g')
        let plot = createPlot(optIn)
        plotList.push(plot)

        let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
        let endTime = {date: new Date(shared.server.timeOfNight.date_now), time: Number(shared.server.timeOfNight.now)}
        plot.updateAxis({
          id: 'bottom',
          domain: [startTime.date, endTime.date],
          range: [0, optIn.box.w]
        })
        plot.updateAxis({
          id: 'left',
          domain: [0, 100],
          range: [optIn.box.h, 0]
        })

        let data = shared.server.measures[Math.floor((Math.random() * 11))]
        plot.bindData(data.id, [data.status.current].concat(data.status.previous), 'bottom', 'left')
      }

      adjustScrollBox()
      adjustPlotDistribution()

      plotlistg.append('rect')
        .attr('x', box.urgentPlots.x)
        .attr('y', box.urgentPlots.y)
        .attr('width', '200px')
        .attr('height', '20px')
        .attr('fill', colorPalette.darkest.background) // colorPalette.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      plotlistg.append('text')
        .text('Urgent Plots')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (box.urgentPlots.x + 10) + ',' + (box.urgentPlots.y + 16) + ')')
    }
    this.initData = initData

    function updateData () {
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let svgUrgentPlots = new SvgUrgentPlots()
  let svgPinnedPlots = new SvgPinnedPlots()
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
