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
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.0)
      //   .attr('y', lenD.h[0] * 0.07)
      //   .attr('width', lenD.w[0] * 0.25)
      //   .attr('height', lenD.h[0] * 0.25)
      //   .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)

      // svg.back.append('text')
      //   .text('Measured Data')
      //   .style('fill', '#000000')
      //   .style('font-weight', 'bold')
      //   .style('font-size', '18px')
      //   .attr('text-anchor', 'start')
      //   .attr('transform', 'translate(' + (lenD.w[0] * 0.0) + ',' + (lenD.h[0] * 0.38) + ')')
      // let startY = lenD.h[0] * 0.4
      // let endY = lenD.h[0] * 0.6
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.0)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.015)
      //   .attr('height', endY)
      //   .attr('fill', '#0288D1')
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.015)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.015)
      //   .attr('height', endY)
      //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.03)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.03)
      //   .attr('height', endY)
      //   .attr('fill', colorPalette.blocks.done.background) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.06)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.015)
      //   .attr('height', endY)
      //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.075)
      //   .attr('y', startY)
      //   .attr('width', lenD.w[0] * 0.015)
      //   .attr('height', endY)
      //   .attr('fill', '#0288D1')
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)


      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.0)
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
      //   .attr('transform', 'translate(' + (lenD.w[0] * 0.125) + ',' + (lenD.h[0] * 0.995) + ')')

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

    function expandSensor (g) {
      let offset = 0
      g.selectAll('g.sensor')
        .each(function (d) {
          let g = d3.select(this)
          offset += 24
          g.transition()
            .duration(600)
            .attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
          g.selectAll('g.sensorline')
            .transition()
            .duration(600)
            .attr('transform', function (d, i) {
              return 'translate(' + 0 + ',' + (i * 10) + ')'
            })
          offset += d.length * (box.h / 30 + 11)
        })
    }
    function shrinkSensor (g) {

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
        for (let j = 0; j < d.length; j++) {
          let ig = g.append('g').attr('class', 'sensorline')
          for (let i = 0; i < d[j].status.previous.length; i++) {
            ig.append('rect')
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
          if (d[j].status.current === 'ERROR') {
            ig.append('rect')
              .attr('x', box.w * 0.8)
              .attr('y', 0 + j * box.h / 30)
              .attr('width', box.h / 30)
              .attr('height', box.h / 30)
              .attr('fill', 'none')
              .attr('stroke-width', 0)
              // .style('boxShadow', '10px 20px 30px black')
              // .on('click', function () {
              //   cleanBack()
              //   display = undefined
              //   focusManager.focusOn('target', d.id)
              // })
              // .on('mouseover', function (d) {
              //   d3.select(this).style('cursor', 'pointer')
              //   d3.select(this).attr('fill', colorTheme.darker.background)
              // })
              // .on('mouseout', function (d) {
              //   d3.select(this).style('cursor', 'default')
              //   d3.select(this).attr('fill', colorTheme.dark.background)
              // })
            ig.append('svg:image')
              .attr('xlink:href', '/static/icons/warning-tri.svg')
              .attr('x', box.w * 0.8)
              .attr('y', 0 + j * box.h / 30 - box.h / 30 * 0.5)
              .attr('width', box.h / 30 * 2)
              .attr('height', box.h / 30 * 2)
              .style('opacity', 0.5)
              .style('pointer-events', 'none')
          }
        }
      })
      let merge = current.merge(enter)

      let offset = 0
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
        offset += 2 + d.length * (box.h / 30)
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
        [{id: 'id0', name: 'Illuminator', status: fillfun(), running: true}],
        [{id: 'id1', name: 'Photometer', status: fillfun(), running: true}],
        [{id: 'id2', name: 'All-sky-camera', status: fillfun(), running: true}],
        [{id: 'id3', name: 'Ceilometer', status: fillfun(), running: false},
          {id: 'id4', name: 'Ceilometer', status: fillfun(), running: true}],
        [{id: 'id5', name: 'FRAM', status: fillfun(), running: true}],
        [{id: 'id6', name: 'LIDARs', status: fillfun(), running: false},
          {id: 'id7', name: 'LIDARs', status: fillfun(), running: true}],
        [{id: 'id8', name: 'Weather-stations', status: fillfun(), running: true},
          {id: 'id9', name: 'Weather-stations', status: fillfun(), running: true},
          {id: 'id10', name: 'Weather-stations', status: fillfun(), running: true}],
        [{id: 'id11', name: 'Anemometers', status: fillfun(), running: true},
          {id: 'id12', name: 'Anemometers', status: fillfun(), running: true},
          {id: 'id13', name: 'Anemometers', status: fillfun(), running: true},
          {id: 'id14', name: 'Anemometers', status: fillfun(), running: false},
          {id: 'id15', name: 'Anemometers', status: fillfun(), running: true},
          {id: 'id16', name: 'Anemometers', status: fillfun(), running: true}],
        [{id: 'id17', name: 'Precipitation', status: fillfun(), running: false},
          {id: 'id18', name: 'Precipitation', status: fillfun(), running: true},
          {id: 'id19', name: 'Precipitation', status: fillfun(), running: true}],
        [{id: 'id20', name: 'Dust', status: fillfun(), running: true}],
        [{id: 'id21', name: 'Accelerometers', status: fillfun(), running: false},
          {id: 'id22', name: 'Accelerometers', status: fillfun(), running: true}]
      ]

      svg.g.append('text')
        .text('Hardware Monitoring')
        .style('fill', '#000000')
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')

      let gsens = svg.g.append('g')
        .attr('id', 'heatmapSensors')
        .attr('transform', 'translate(' + box.x + ',' + (box.y + box.h * 0.05) + ')')

      svg.g.append('rect')
        .attr('x', box.x + box.w * 0.72)
        .attr('y', (box.y - 14) + 'px')
        .attr('width', '16px')
        .attr('height', '16px')
        .attr('fill', 'transparent')
        .attr('stroke-width', 0)
        .style('boxShadow', '10px 20px 30px black')
        .on('click', function () {
          expandSensor(gsens)
        })
        .on('mouseover', function (d) {
          d3.select(this).style('cursor', 'pointer')
          d3.select(this).attr('fill', colorPalette.darkest.background)
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          d3.select(this).attr('fill', 'transparent')
        })
      svg.g.append('svg:image')
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
  let svgHeathMapSensors = new SvgHeathMapSensors()
  let svgBlocksQueueServer = new SvgBlocksQueueServer()
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
