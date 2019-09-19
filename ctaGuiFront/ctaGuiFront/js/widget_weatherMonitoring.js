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
/* global bckPattern */
/* global colsMix */
/* global unique */

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
    data: {
      server: undefined
    }
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
      svg.g = svg.svg.append('g')
    }
    function initBackground () {
      svg.back = svg.svg.append('g')

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.0)
        .attr('y', 0)
        .attr('width', lenD.w[0] * 0.25)
        .attr('height', lenD.h[0] * 0.06)
        .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Date Time')
        .style('fill', colorPalette.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.125) + ',' + (lenD.h[0] * 0.015) + ')')

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.0)
        .attr('y', lenD.h[0] * 0.98)
        .attr('width', lenD.w[0] * 0.25)
        .attr('height', lenD.h[0] * 0.02)
        .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Plots List')
        .style('fill', colorPalette.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.125) + ',' + (lenD.h[0] * 0.995) + ')')

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.26)
        .attr('y', lenD.h[0] * 0.0)
        .attr('width', lenD.w[0] * 0.48)
        .attr('height', lenD.h[0] * 0.495)
        .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Big Plot')
        .style('fill', colorPalette.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.5) + ',' + (lenD.h[0] * 0.25) + ')')
      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.26)
        .attr('y', lenD.h[0] * 0.505)
        .attr('width', lenD.w[0] * 0.48)
        .attr('height', lenD.h[0] * 0.495)
        .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Map plot')
        .style('fill', colorPalette.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.5) + ',' + (lenD.h[0] * 0.75) + ')')
      let fo = svg.back.append('foreignObject')
        .attr('x', lenD.w[0] * 0.26 + 'px')
        .attr('y', lenD.h[0] * 0.505 + 'px')
        .attr('width', lenD.w[0] * 0.48 + 'px')
        .attr('height', lenD.h[0] * 0.495 + 'px').node()

      let iframe = document.createElement('iframe')
      iframe.width = '650px'
      iframe.height = '650px'
      iframe.src = "https://embed.windy.com/embed2.html?lat=28.718&lon=-17.849&zoom=11&level=surface&overlay=wind&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=48.683&detailLon=2.133&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1"

      fo.appendChild(iframe)
      svg.svg._groups[0][0].appendChild(fo)

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.75)
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
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.875) + ',' + (lenD.h[0] * 0.015) + ')')
      for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 2; j++) {
          svg.back.append('rect')
            .attr('x', lenD.w[0] * 0.75 + j * lenD.w[0] * 0.13)
            .attr('y', lenD.h[0] * 0.03 + i * (lenD.h[0] * 0.1 + lenD.h[0] * 0.02))
            .attr('width', lenD.w[0] * 0.12)
            .attr('height', lenD.h[0] * 0.1)
            .attr('fill', colorPalette.darker.background) // colorPalette.dark.background)
            .attr('stroke', 'none')
            .attr('rx', 0)
        }
      }
      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.75)
        .attr('y', lenD.h[0] * 0.98)
        .attr('width', lenD.w[0] * 0.25)
        .attr('height', lenD.h[0] * 0.02)
        .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Plots List')
        .style('fill', colorPalette.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.875) + ',' + (lenD.h[0] * 0.995) + ')')

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

    svgHeathMapSensors.initData()
    svgMeasuredData.initData()

    shared.data.server = dataIn.data

    svgBlocksQueueServer.initData()
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

    shared.data.server = dataIn.data

    svgBlocksQueueServer.updateData()

    locker.remove('updateData')
  }
  function updateData (dataIn) {
    runLoop.push({ tag: 'updateData', data: dataIn })
  }
  this.updateData = updateData
  runLoop.init({ tag: 'updateData', func: updateDataOnce, nKeep: 1 })



  let SvgBlocksQueueServer = function () {
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServer.x,
        y: box.blockQueueServer.y,
        w: box.blockQueueServer.w,
        h: box.blockQueueServer.h,
        marg: lenD.w[0] * 0.01
      }
    }
    this.initData = initData

    function updateData () {}
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgHeathMapSensors = function () {
    let box
    let step = 20
    let expanded = false

    function shift () {
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
    this.shift = shift
    function unshift () {
      let count = svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline').size()
      svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline')
        .attr('visibility', 'visible')
        .attr('opacity', 0)
        .transition()
        .duration(600)
        .delay((d, i) => 600 - i * (600 / count))
        .attr('opacity', 1)

      let offset = 0
      svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
        .transition()
        .duration(400)
        .delay((d, i) => 400 - i * (400 / count))
        .attr('transform', (d, i) => {
          let trans = offset
          offset += 12 + d.length * (box.h / 30)
          return 'translate(' + 0 + ',' + trans + ')'
        })

      // let offset = 0
      // svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
      //   .each(function (d, i) {
      //     let g = d3.select(this)
      //     g.transition()
      //       .duration(600)
      //       .delay((d, i) => 600 - i * (600 / count))
      //       .attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
      //     offset += 12 + d.length * (box.h / 30)
      //   })
    }
    this.unshift = unshift
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
    function expandSensor (g) {
      svgMeasuredData.shift()
      let offset = 0
      g.selectAll('g.sensor')
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
            .attr('height', d.length * (box.h / 30 + 12))
          g.select('rect#background')
            .attr('x', -6)
            .attr('y', -26)
            .attr('width', box.w)
            .attr('height', d.length * (box.h / 30 + 12) + 8 + 16)
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
              return 'translate(' + 0 + ',' + (i * 8) + ')'
            })
          g.selectAll('g.sensorline')
            .transition()
            .duration(600)
            .attr('transform', function (d, i) {
              return 'translate(' + 0 + ',' + (i * 12) + ')'
            })
          offset += d.length * (box.h / 30 + 11)
        })
    }
    function shrinkSensor (g) {
      svgMeasuredData.unshift()
      let offset = 0
      g.selectAll('g.sensor')
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
          offset += 12 + d.length * (box.h / 30)
        })
      g.selectAll('rect#label').remove()
      g.selectAll('text#label').remove()
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
              .attr('x', 0 + (i * (box.w * 0.66) / d[j].status.previous.length))
              .attr('y', 0 + j * box.h / 30)
              .attr('width', (box.w * 0.66) / d[j].status.previous.length)
              .attr('height', box.h / 30)
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
            .attr('x', box.w * 0.72)
            .attr('y', 0 + j * box.h / 30)
            .attr('width', (box.w * 0.05))
            .attr('height', box.h / 30)
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
            //   .attr('y', 0 + j * box.h / 30 - box.h / 30 * 0.5)
            //   .attr('width', box.h / 30 * 2)
            //   .attr('height', box.h / 30 * 2)
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
            //   .attr('y', 0 + j * box.h / 30 - box.h / 30 * 0.5)
            //   .attr('width', box.h / 30 * 2)
            //   .attr('height', box.h / 30 * 2)
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
        offset += 12 + d.length * (box.h / 30)
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
        y: lenD.h[0] * 0.09,
        w: lenD.w[0] * 0.25,
        h: lenD.h[0] * 0.25,
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
      let data = [
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
      main.append('text')
        .text('Hardware Monitoring')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')

      let gsens = main.append('g')
        .attr('id', 'heatmapSensors')
        .attr('transform', 'translate(' + box.x + ',' + (box.y + box.h * 0.05) + ')')

      main.append('rect')
        .attr('x', box.x + box.w * 0.72)
        .attr('y', (box.y - 14) + 'px')
        .attr('width', '16px')
        .attr('height', '16px')
        .attr('fill', 'transparent')
        .attr('stroke-width', 0)
        .style('boxShadow', '10px 20px 30px black')
        .on('click', function () {
          if (expanded) {
            expanded = false
            shrinkSensor(gsens)
          } else {
            expanded = true
            expandSensor(gsens)
          }
        })
        .on('mouseover', function (d) {
          d3.select(this).style('cursor', 'pointer')
          d3.select(this).attr('fill', colorPalette.darkest.background)
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          d3.select(this).attr('fill', 'transparent')
        })
      main.append('svg:image')
        .attr('xlink:href', '/static/icons/full-size.svg')
        .attr('x', box.x + box.w * 0.72)
        .attr('y', (box.y - 14) + 'px')
        .attr('width', '16px')
        .attr('height', '16px')
        .style('pointer-events', 'none')

      SensorCore(data, gsens)
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

    function shift () {
      svg.g.select('g#measuredData')
        .transition()
        .duration(600)
        .attr('transform', 'translate(' + 0 + ',' + box.h + ')')
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
      svgHeathMapSensors.shift()
    }
    function shrink (g) {
      svgHeathMapSensors.unshift()
    }
    function measuredCore (data, g) {
      let current = g
        .selectAll('g.sensor')
        .data(data, function (d) {
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
        main.append('rect')
          .attr('x', 12)
          .attr('y', 4)
          .attr('width', box.w * 0.075)
          .attr('height', 8)
          .attr('fill', colorPalette.blocks.fail.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.6)
        main.append('rect')
          .attr('x', 12 + box.w * 0.075)
          .attr('y', 4)
          .attr('width', box.w * 0.075)
          .attr('height', 8)
          .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.6)
        main.append('rect')
          .attr('x', 12 + box.w * 0.15)
          .attr('y', 4)
          .attr('width', box.w * 0.15)
          .attr('height', 8)
          .attr('fill', colorPalette.blocks.done.background) // colorPalette.dark.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.6)
        main.append('rect')
          .attr('x', 12 + box.w * 0.3)
          .attr('y', 4)
          .attr('width', box.w * 0.075)
          .attr('height', 8)
          .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.6)
        main.append('rect')
          .attr('x', 12 + box.w * 0.375)
          .attr('y', 4)
          .attr('width', box.w * 0.075)
          .attr('height', 8)
          .attr('fill', colorPalette.blocks.fail.background)
          .attr('stroke', 'none')
          .attr('rx', 0)
          .style('opacity', 0.6)

        main.append('text')
          .attr('id', 'measurelabel')
          .text(d.name)
          .attr('x', box.w * 0)
          .attr('y', -2)
          .style('font-size', '14px')
        main.append('text')
          .attr('id', 'valuelabel')
          .text(d.status.current)
          .attr('x', box.w * 0.55)
          .attr('y', 14)
          .style('font-size', '14px')
          .style('font-weight', 'bold')
        main.append('text')
          .attr('id', 'unitlabel')
          .text(d.unit)
          .attr('x', box.w * 0.72)
          .attr('y', 14)
          .style('font-size', '12px')
          .style('font-weight', '')
      })
      let merge = current.merge(enter)

      let offset = 0
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
        offset += 30
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
        y: lenD.h[0] * 0.45,
        w: lenD.w[0] * 0.25,
        h: lenD.h[0] * 0.55,
        marg: lenD.w[0] * 0.01
      }

      let fillfun = function () {
        let status = {current: '', previous: []}
        status.current = (Math.random() * 50).toFixed(2)
        for (let i = 0; i < 4; i++) {
          status.previous.push((Math.random() * 50).toFixed(2))
        }
        return status
      }
      let data = [
        {id: 'id0', name: 'Measure1', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        {id: 'id1', name: 'Measure2', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        {id: 'id2', name: 'Measure3', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        {id: 'id3', name: 'Measure4', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
          {id: 'id4', name: 'subMeasure.14', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
        ]},
        {id: 'id5', name: 'Measure5', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        {id: 'id6', name: 'Measure6', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
          {id: 'id7', name: 'subMeasure6.1', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
        ]},
        {id: 'id8', name: 'Measure7', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
          {id: 'id9', name: 'subMeasure7.1', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
          {id: 'id10', name: 'subMeasure7.2', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
        ]},
        {id: 'id11', name: 'Measure8', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
          {id: 'id12', name: 'subMeasure8.1', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
          {id: 'id13', name: 'subMeasure8.2', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
          {id: 'id14', name: 'subMeasure8.3', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
          {id: 'id15', name: 'subMeasure8.4', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
          {id: 'id16', name: 'subMeasure8.5', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
        ]},
        {id: 'id17', name: 'Measure9', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
          {id: 'id18', name: 'subMeasure9.1', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]},
          {id: 'id19', name: 'subMeasure9.2', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
        ]},
        {id: 'id20', name: 'Measure10', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        {id: 'id21', name: 'Measure11', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
          {id: 'id22', name: 'subMeasure11.1', status: fillfun(), unit: ['C°', '%', 'µg/m3', 'km/h'][Math.floor((Math.random() * 3))]}
        ]}
      ]

      let main = svg.g.append('g').attr('id', 'measuredData')
      main.append('text')
        .text('Measured Data')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
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
      let gmes = main.append('g')
        .attr('id', 'measured')
        .attr('transform', 'translate(' + box.x + ',' + (box.y + box.h * 0.05) + ')')

      main.append('rect')
        .attr('x', box.x + box.w * 0.72)
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
          d3.select(this).attr('fill', colorPalette.darkest.background)
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          d3.select(this).attr('fill', 'transparent')
        })
      main.append('svg:image')
        .attr('xlink:href', '/static/icons/full-size.svg')
        .attr('x', box.x + box.w * 0.72)
        .attr('y', (box.y - 14) + 'px')
        .attr('width', '16px')
        .attr('height', '16px')
        .style('pointer-events', 'none')

      measuredCore(data, gmes)
    }
    this.initData = initData

    function updateData () {}
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let svgMeasuredData = new SvgMeasuredData()
  let svgHeathMapSensors = new SvgHeathMapSensors()
  let svgBlocksQueueServer = new SvgBlocksQueueServer()
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
