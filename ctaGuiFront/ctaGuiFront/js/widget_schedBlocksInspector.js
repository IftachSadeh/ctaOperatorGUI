'use strict'
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// stric mode for the following script or function (must reservede at the very begining!)
// see: http://www.w3schools.reserved/js/js_strict.asp
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// mainScriptTag used locally (will be overriden by other scripts...)
// must be reservedpatible with the name of this js file, according to:
//    '/js/widget_'+mainScriptTag+'.js'
var mainScriptTag = 'schedBlocksInspector'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global hasVar */
/* global disableScrollSVG */
/* global TelescopeDisplayer */
/* global RunLoop */
/* global getTelState */
/* global BlockDisplayer */
/* global ObsblockForm */
/* global TargetForm */
/* global SchedblockForm */
/* global TelescopeForm */
/* global PlotBrushZoom */
/* global ScrollBox */
/* global telHealthCol */
/* global createD3Node */
/* global getColorTheme */
/* global colsBlues */
/* global Locker */
/* global appendToDom */
/* global runWhenReady */
/* global timeD */
/* global deepCopy */

window.loadScript({ source: mainScriptTag, script: '/js/telescopes/utils_telescopeDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/telescopes/utils_telescopeForm.js' })
window.loadScript({ source: mainScriptTag, script: '/js/targets/utils_targetDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/targets/utils_targetCommon.js' })
window.loadScript({ source: mainScriptTag, script: '/js/blocks/utils_blockDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/blocks/utils_obsblockForm.js' })
window.loadScript({ source: mainScriptTag, script: '/js/blocks/utils_schedblockForm.js' })
window.loadScript({ source: mainScriptTag, script: '/js/targets/utils_targetForm.js' })
window.loadScript({ source: mainScriptTag, script: '/js/events/utils_eventDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_plotBrushZoom.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 6
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = { SockFunc: sockSchedBlocksInspector, MainFunc: mainSchedBlocksInspector }
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
    content: "<div id='" + optIn.baseName + divKey + "'></div>"
  }

  sock.addToTable(optIn)
}

// ---------------------------------------------------------------------------------------------------
// additional socket events for this particular widget type
// ---------------------------------------------------------------------------------------------------
let sockSchedBlocksInspector = function (optIn) {
  let widgetType = optIn.widgetType
  let widgetSource = optIn.widgetSource
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
  //     'widgetSource':widgetSource, 'widgetName':widgetType, 'widgetId':widgetId,
  //     'methodName':'schedBlocksInspectorAskTelData',
  //     'methodArgs':data
  //   };
  //   sock.socket.emit('widget', dataEmit);
  //   return;
  // }

  // FUNCTION TO SEND DATA TO THE REDIS DATABASE (need eqivalent function in .py)
  this.pushNewSchedule = function (optIn) {
    if (sock.conStat.isOffline()) return

    let data = {}
    data.widgetId = optIn.widgetId
    data.newSchedule = optIn.newSchedule

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: data.widgetId,
      methodName: 'schedBlockInspectorPushNewSchedule',
      methodArgs: data
    }
    sock.socket.emit('widget', dataEmit)
  }

  // EXEMPLE OF FUNCTION TO RECEIVE DATA FROM THE REDIS DATABASE
  // ---------------------------------------------------------------------------------------------------
  // get update for state1 data which was explicitly asked for by a given module
  // ---------------------------------------------------------------------------------------------------
  sock.socket.on('newSchedulePushed', function (data) {
    if (sock.conStat.isOffline()) return
    console.log('newSchedulePushed received')

    $.each(sock.widgetV[widgetType].widgets, function (widgetIdNow, modNow) {
      console.log(widgetIdNow, modNow)
      if (data.sessWidgetIds.indexOf(widgetIdNow) >= 0) {
        console.log(sock.widgetV[widgetType])
        sock.widgetV[widgetType].widgets[widgetIdNow].scheduleSuccessfullyUpdate()
      }
    })
  })
}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainSchedBlocksInspector = function (optIn) {
  // let myUniqueId = unique()
  let colorTheme = getColorTheme('bright-Grey')
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
      server: undefined,
      copy: undefined
      // current: 0
    },
    focus: undefined, // {type: block, id: idBlock}
    history: {list: [], index: -1},
    over: undefined,
    mode: 'modifier'
  }
  let svg = {}
  let box = {}
  let lenD = {}

  let blockQueueOverlay = null
  let blockQueue = null
  let eventQueueServer = null
  let brushZoom = null

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

  function setStandbyMode () {
    let modificationOverlay = svg.svg.append('g')
    let sizepat = 5
    let pattern = {}
    pattern.select = {}
    pattern.select.defs = modificationOverlay.append('defs')
    pattern.select.patternLock = pattern.select.defs.append('pattern')
      .attr('id', 'bar')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', sizepat)
      .attr('height', sizepat)
      .attr('fill', '#000000')
      .attr('patternUnits', 'userSpaceOnUse')
    pattern.select.patternLock.append('rect')
      .attr('x', sizepat * 0.05)
      .attr('y', sizepat * 0.05)
      .attr('width', sizepat * 0.9)
      .attr('height', sizepat * 0.9)
      .attr('fill', colorPalette.darker.background)
      .attr('stroke', colorPalette.medium.background)
      .attr('stroke-width', sizepat * 0.1)
    // pattern.select.patternLock.append('line')
    //   .attr('x1', sizepat)
    //   .attr('y1', 0)
    //   .attr('x2', 0)
    //   .attr('y2', sizepat)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 1)
    let modificationOverlayRect = modificationOverlay.append('g')
    modificationOverlayRect.append('rect')
      .attr('id', 'blockQueue')
      .attr('x', lenD.w[0] * 0.34)
      .attr('y', lenD.h[0] * 0.02)
      .attr('width', lenD.w[0] * 0.66)
      .attr('height', lenD.h[0] * 0.96) // - 2 * lenD.h[0] * 0.02)
      .attr('fill', 'url(#bar)')
      .style('opacity', 0.9)
      .on('click', function () {
        shared.mode = 'modifier'
        svgBlocksQueueServer.updateData()
        modificationOverlayRect.select('rect#blockQueue')
          .transition()
          .duration(400)
          .style('opacity', 0)
          .on('end', function () {
            modificationOverlayRect.remove()
            // pattern.select.patternLock.selectAll('rect')
            //   .transition()
            //   .duration(400)
            //   .attr('x', sizepat * 0.5)
            //   .attr('y', sizepat * 0.5)
            //   .attr('width', sizepat * 0.0)
            //   .attr('height', sizepat * 0.0)
          })

        svgTargets.updateData()
        svgTelsConflict.updateData()
        modificationOverlayRect.select('rect#targets')
          .transition()
          .duration(400)
          .style('opacity', 0)
      })
      // .style('pointer-events', 'none')
    // modificationOverlayRect.append('rect')
    //   .attr('id', 'targets')
    //   .attr('x', lenD.w[0] * 0.34)
    //   .attr('y', lenD.h[0] * 0.68)
    //   .attr('width', lenD.w[0] * 0.66)
    //   .attr('height', lenD.h[0] * 0.3) // - 2 * lenD.h[0] * 0.02)
    //   .attr('fill', 'url(#bar)')
    //   .style('opacity', 0.9)
    //   .on('click', function () {
    //     pattern.select.patternLock.selectAll('rect')
    //       .transition()
    //       .duration(400)
    //       .attr('stroke-width', 0)
    //       .attr('x', sizepat * 0.5)
    //       .attr('y', sizepat * 0.5)
    //       .attr('width', sizepat * 0.0)
    //       .attr('height', sizepat * 0.0)
    //       .on('end', function () {
    //         shared.mode = 'modifier'
    //         svgBlocksQueueServer.updateData()
    //         svgTargets.updateData()
    //         svgTelsConflict.updateData()
    //
    //         // pattern.select.patternLock.selectAll('rect')
    //         //   .transition()
    //         //   .duration(400)
    //         //   .attr('x', sizepat * 0.5)
    //         //   .attr('y', sizepat * 0.5)
    //         //   .attr('width', sizepat * 0.0)
    //         //   .attr('height', sizepat * 0.0)
    //       })
    //   })
      // .style('pointer-events', 'none')

    // modificationOverlayRect.append('rect')
    //   .attr('id', 'menu')
    //   .attr('x', lenD.w[0] * 0.005)
    //   .attr('y', lenD.h[0] * 0.02)
    //   .attr('width', lenD.w[0] * 0.315)
    //   .attr('height', lenD.h[0] * 0.1)
    //   .attr('fill', 'url(#bar)')
    //   .style('opacity', 1)
    //   .on('click', function () {
    //     pattern.select.patternLock.selectAll('rect')
    //       .transition()
    //       .duration(400)
    //       .attr('stroke-width', 0)
    //       .attr('x', sizepat * 0.5)
    //       .attr('y', sizepat * 0.5)
    //       .attr('width', sizepat * 0.0)
    //       .attr('height', sizepat * 0.0)
    //       .on('end', function () {
    //         shared.mode = 'modifier'
    //         svgBlocksQueueServer.updateData()
    //         svgTargets.updateData()
    //         svgTelsConflict.updateData()
    //
    //         // pattern.select.patternLock.selectAll('rect')
    //         //   .transition()
    //         //   .duration(400)
    //         //   .attr('x', sizepat * 0.5)
    //         //   .attr('y', sizepat * 0.5)
    //         //   .attr('width', sizepat * 0.0)
    //         //   .attr('height', sizepat * 0.0)
    //       })
    //   })
    //   // .style('pointer-events', 'none')

    modificationOverlayRect.append('rect')
      .attr('id', 'modifications')
      .attr('x', lenD.w[0] * 0.005)
      .attr('y', lenD.h[0] * 0.28)
      .attr('width', lenD.w[0] * 0.315)
      .attr('height', lenD.h[0] * 0.6)
      .attr('fill', 'url(#bar)')
      .style('opacity', 1)
      .on('click', function () {
        pattern.select.patternLock.selectAll('rect')
          .transition()
          .duration(400)
          .attr('stroke-width', 0)
          .attr('x', sizepat * 0.5)
          .attr('y', sizepat * 0.5)
          .attr('width', sizepat * 0.0)
          .attr('height', sizepat * 0.0)
          .on('end', function () {
            shared.mode = 'modifier'
            svgBlocksQueueServer.updateData()
            svgTargets.updateData()
            svgTelsConflict.updateData()

            // pattern.select.patternLock.selectAll('rect')
            //   .transition()
            //   .duration(400)
            //   .attr('x', sizepat * 0.5)
            //   .attr('y', sizepat * 0.5)
            //   .attr('width', sizepat * 0.0)
            //   .attr('height', sizepat * 0.0)
          })
      })
      // .style('pointer-events', 'none')

    modificationOverlayRect.append('rect')
      .attr('id', 'conflicts')
      .attr('x', lenD.w[0] * 0.005)
      .attr('y', lenD.h[0] * 0.915)
      .attr('width', lenD.w[0] * 0.315)
      .attr('height', lenD.h[0] * 0.08)
      .attr('fill', 'url(#bar)')
      .style('opacity', 1)
      .on('click', function () {
        pattern.select.patternLock.selectAll('rect')
          .transition()
          .duration(400)
          .attr('stroke-width', 0)
          .attr('x', sizepat * 0.5)
          .attr('y', sizepat * 0.5)
          .attr('width', sizepat * 0.0)
          .attr('height', sizepat * 0.0)
          .on('end', function () {
            shared.mode = 'modifier'
            svgBlocksQueueServer.updateData()
            svgTargets.updateData()
            svgTelsConflict.updateData()

            // pattern.select.patternLock.selectAll('rect')
            //   .transition()
            //   .duration(400)
            //   .attr('x', sizepat * 0.5)
            //   .attr('y', sizepat * 0.5)
            //   .attr('width', sizepat * 0.0)
            //   .attr('height', sizepat * 0.0)
          })
      })
      // .style('pointer-events', 'none')

    modificationOverlayRect.append('rect')
      .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.025 - 24)
      .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 - 24)
      .attr('width', 48)
      .attr('height', 48)
      .attr('fill', colorTheme.bright.background)
      .attr('stroke', colorTheme.bright.stroke)
      .attr('stroke-width', 0.1)
      .attr('rx', 48)
      .on('click', function () {
        shared.mode = 'modifier'
        modificationOverlayRect.select('image').remove()
        svgBlocksQueueServer.updateData()
        modificationOverlayRect.remove()
        // modificationOverlayRect.select('rect#blockQueue')
        //   .transition()
        //   .duration(0)
        //   .style('opacity', 0)
        //   .on('end', function () {
        //     modificationOverlayRect.remove()
        //     // pattern.select.patternLock.selectAll('rect')
        //     //   .transition()
        //     //   .duration(400)
        //     //   .attr('x', sizepat * 0.5)
        //     //   .attr('y', sizepat * 0.5)
        //     //   .attr('width', sizepat * 0.0)
        //     //   .attr('height', sizepat * 0.0)
        //   })

        svg.back.append('text')
          .text('Local copy:')
          .attr('stroke', colorTheme.bright.background)
          .attr('stroke-width', 0.5)
          .attr('fill', colorTheme.bright.background)
          .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.03)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.03)
          .style('font-weight', '')
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        svg.back.append('text')
          .attr('id', 'currentHour')
          .attr('stroke', colorTheme.bright.background)
          .attr('stroke-width', 0.5)
          .attr('fill', colorTheme.bright.background)
          .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.03)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.08)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .style('font-size', '24px')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        let currentTime = {date: new Date(shared.data.server.timeOfNight.date_now)}
        svg.back.select('text#currentHour').text(d3.timeFormat('%H:%M')(currentTime.date))

        svg.back.append('rect')
          .attr('id', 'pushonServer')
          .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.25 - 24)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 - 24)
          .attr('width', 48)
          .attr('height', 48)
          .attr('fill', colorTheme.bright.background)
          .attr('stroke', colorTheme.bright.stroke)
          .attr('stroke-width', 0.1)
          .attr('rx', 48)
          .on('click', function () {
            pushNewSchedule()
          })
          .on('mouseover', function (d) {
            d3.select(this).attr('fill', colorTheme.darkest.background)
          })
          .on('mouseout', function (d) {
            d3.select(this).attr('fill', colorTheme.bright.background)
          })
        svg.back.append('image')
          .attr('xlink:href', '/static/icons/server-from-client.svg')
          .attr('x', lenD.w[0] * 0.25 + lenD.w[0] * 0.025 - 18)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 - 15)
          .attr('width', 30)
          .attr('height', 30)
          .style('opacity', 0.8)
          .style('pointer-events', 'none')

        svg.back.append('rect')
          .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.09 - 11)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 - 11)
          .attr('width', 22)
          .attr('height', 22)
          .attr('fill', colorTheme.bright.background)
          .attr('stroke', colorTheme.bright.stroke)
          .attr('stroke-width', 0.1)
          .attr('rx', 48)
          .on('click', function () {

          })
          .on('mouseover', function (d) {
            d3.select(this).attr('fill', colorTheme.darkest.background)
          })
          .on('mouseout', function (d) {
            d3.select(this).attr('fill', colorTheme.bright.background)
          })
        svg.back.append('image')
          .attr('xlink:href', '/static/icons/circular-rotating-arrow.svg')
          .attr('x', lenD.w[0] * 0.09 + lenD.w[0] * 0.02 - 10)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 - 9)
          .attr('width', 18)
          .attr('height', 18)
          .style('opacity', 0.8)
          .style('pointer-events', 'none')

        svg.back.append('rect')
          .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.25 - 40)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 - 12.5)
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', '#43A047')
          .attr('stroke', colorTheme.bright.stroke)
          .attr('stroke-width', 0.1)
        svg.back.append('text')
          .text('Modifications:')
          .attr('stroke', colorTheme.bright.background)
          .attr('stroke-width', 0.5)
          .attr('fill', colorTheme.bright.background)
          .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.25 - 42)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 - 5)
          .style('font-weight', '')
          .attr('text-anchor', 'end')
          .style('font-size', '9px')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        svg.back.append('rect')
          .attr('id', 'conflictlighton')
          .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.25 - 40)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 + 5)
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', '#43A047')
          .attr('stroke', colorTheme.bright.stroke)
          .attr('stroke-width', 0.1)
        svg.back.append('text')
          .text('Conflicts:')
          .attr('stroke', colorTheme.bright.background)
          .attr('stroke-width', 0.5)
          .attr('fill', colorTheme.bright.background)
          .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.25 - 42)
          .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 + 12.5)
          .style('font-weight', '')
          .attr('text-anchor', 'end')
          .style('font-size', '9px')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        svgTargets.updateData()
        svgTelsConflict.update()
        modificationOverlayRect.select('rect#targets')
          .transition()
          .duration(400)
          .style('opacity', 0)

        let poly = [
          // {x: -2 + box.brushZoom.x, y: 8 + box.blockQueueServer.y + box.blockQueueServer.h + box.brushZoom.h * 0.3},
          {x: -1.5 + box.brushZoom.x, y: 1.2 + box.blockQueueServer.y + box.blockQueueServer.h},
          {x: -2 + box.brushZoom.x - (lenD.w[0] * 0.03 * 0.85), y: 1.2 + box.blockQueueServer.y + box.blockQueueServer.h},

          {x: -2 + box.brushZoom.x - (lenD.w[0] * 0.03), y: 1.2 + box.blockQueueServer.y + box.blockQueueServer.h + (10 + box.brushZoom.h) * 0.3},
          {x: -2 + box.brushZoom.x - (lenD.w[0] * 0.03), y: 1.2 + box.blockQueueServer.y + box.blockQueueServer.h + (10 + box.brushZoom.h) * 0.7},

          {x: -2 + box.brushZoom.x - (lenD.w[0] * 0.03 * 0.85), y: 1.2 + box.blockQueueServer.y + box.blockQueueServer.h + (10 + box.brushZoom.h)},
          {x: -1.5 + box.brushZoom.x, y: 1.2 + box.blockQueueServer.y + box.blockQueueServer.h + (10 + box.brushZoom.h)}
          // {x: -2 + box.brushZoom.x, y: 8 + box.blockQueueServer.y + box.blockQueueServer.h + box.brushZoom.h * 0.7}
        ]
        svg.g.append('polygon')
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
          .attr('points', function () {
            return poly.map(function (d) {
              return [d.x, d.y].join(',')
            }).join(' ')
          })
          .on('click', function () {
            createDummyBlock()
          })
          .on('mouseover', function () {
            d3.select(this).attr('fill', colorPalette.darker.background)
            // com.events.sched.mouseover('schedBlock', d.id)
          })
          .on('mouseout', function () {
            d3.select(this).attr('fill', colorTheme.dark.background)
            // com.events.sched.mouseout('schedBlock', d.id)
          })
        svg.g.append('text')
          .text('+')
          .style('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 1)
          .style('fill', colorTheme.dark.background)
          .attr('x', box.brushZoom.x - (lenD.w[0] * 0.03 * 0.5))
          .attr('y', 12 + box.blockQueueServer.y + box.blockQueueServer.h + box.brushZoom.h * 0.8)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .style('font-size', '26px')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        svg.g.append('image')
          .attr('xlink:href', '/static/icons/up-triangle.svg')
          .attr('x', box.brushZoom.x - (lenD.w[0] * 0.03 * 0.5) - 4)
          .attr('y', box.blockQueueServer.y + box.blockQueueServer.h + box.brushZoom.h * 0.1)
          .attr('width', 8)
          .attr('height', 8)
          .style('opacity', 0.8)
          .style('pointer-events', 'none')
      })
      .on('mouseover', function (d) {
        pattern.select.patternLock.select('rect')
          .style('opacity', 0.8)
          .attr('fill', d3.color(colorPalette.darker.background).darker(0.1))
        d3.select(this).attr('fill', colorTheme.darkest.background)
      })
      .on('mouseout', function (d) {
        pattern.select.patternLock.select('rect')
          .style('opacity', 1)
          .attr('fill', colorPalette.darker.background)
        d3.select(this).attr('fill', colorTheme.bright.background)
      })
    modificationOverlayRect.append('image')
      .attr('xlink:href', '/static/icons/server-to-client.svg')
      .attr('x', lenD.w[0] * 0.02 + lenD.w[0] * 0.025 - 15)
      .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.05 - 15)
      .attr('width', 30)
      .attr('height', 30)
      .style('opacity', 0.8)
      .style('pointer-events', 'none')

    // svg.svg.append('rect')
    //   .attr('x', lenD.w[0] * 0.0)
    //   .attr('y', lenD.h[0] * 0.02)
    //   .attr('width', lenD.w[0] * 0.25)
    //   .attr('height', lenD.h[0] * 0.25)
    //   .attr('stroke', colorPalette.darker.stroke)
    //   .attr('stroke-width', 0.4)
    //   .attr('fill', colorPalette.darker.background)
    //   .style('opacity', 1)
  }

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
      // svg.svg
      //   .style('background', colorTheme.medium.background)
      svg.back = svg.svg.append('g')
      // svg.back.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', lenD.w[0] * 0.12)
      //   .attr('height', lenD.h[0] * 0.02)
      //   .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
      //   .attr('stroke', 'none')
      //   .attr('rx', 0)
      // svg.back.append('text')
      //   .text('Menu')
      //   .style('fill', colorTheme.bright.background)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(' + (lenD.w[0] * 0.06) + ',' + (lenD.h[0] * 0.015) + ')')

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.34)
        .attr('y', 0)
        .attr('width', lenD.w[0] * 0.66)
        .attr('height', lenD.h[0] * 0.02)
        .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Scheduling & observation blocks')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.67) + ',' + (lenD.h[0] * 0.015) + ')')

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.34)
        .attr('y', lenD.h[0] * 0.98)
        .attr('width', lenD.w[0] * 0.66)
        .attr('height', lenD.h[0] * 0.02)
        .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Visualization tools')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.67) + ',' + (lenD.h[0] * 0.995) + ')')

      svg.back.append('rect')
        .attr('x', lenD.w[0] * 0.0)
        .attr('y', 0)
        .attr('width', lenD.w[0] * 0.32)
        .attr('height', lenD.h[0] * 0.14)
        .attr('fill', colorTheme.darker.stroke) // colorTheme.dark.background)
        .attr('stroke', 'none')
        .attr('rx', 0)
      svg.back.append('text')
        .text('Information')
        .style('fill', colorTheme.bright.background)
        .style('font-weight', 'bold')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (lenD.w[0] * 0.16) + ',' + (lenD.h[0] * 0.015) + ')')
    }
    function initBox () {
      box.blockQueueServer = {
        x: lenD.w[0] * 0.374,
        y: lenD.h[0] * 0.155,
        w: lenD.w[0] * 0.59,
        h: lenD.h[0] * 0.47,
        marg: lenD.w[0] * 0.01
      }
      box.eventQueueServer = {
        x: lenD.w[0] * 0.374,
        y: lenD.h[0] * 0.03,
        w: lenD.w[0] * 0.59,
        h: lenD.h[0] * 0.112,
        marg: lenD.w[0] * 0.01
      }
      box.brushZoom = {
        x: lenD.w[0] * 0.374,
        y: lenD.h[0] * 0.655,
        w: lenD.w[0] * 0.59,
        h: lenD.h[0] * 0.05,
        marg: lenD.w[0] * 0.01
      }
      box.tools = {
        x: lenD.w[0] * 0.374,
        y: lenD.h[0] * 0.75,
        w: lenD.w[0] * 0.59,
        h: lenD.h[0] * 0.225,
        marg: lenD.w[0] * 0.01
      }
      box.focusOverlay = {
        x: lenD.w[0] * 0.374,
        y: lenD.h[0] * 0.025,
        w: lenD.w[0] * 0.59,
        h: lenD.h[0] * 0.955,
        marg: lenD.w[0] * 0.01
      }

      box.rightInfo = {
        x: lenD.w[0] * 0.004, // lenD.w[0] * 0.68,
        y: lenD.h[0] * 0.15,
        w: lenD.w[0] * 0.315,
        h: lenD.h[0] * 0.845,
        marg: lenD.w[0] * 0.01
      }
      // box.tab = {
      //   x: 0,
      //   y: box.rightPanel.h * 0.01,
      //   w: box.rightPanel.w,
      //   h: box.rightPanel.h * 0.05
      // }
      // box.content = {
      //   x: 0,
      //   y: box.rightPanel.h * 0.15,
      //   w: box.rightPanel.w,
      //   h: box.rightPanel.h * 0.84
      // }
    }
    function initDefaultStyle () {
      shared.style = {}
      shared.style.runRecCol = colsBlues[2]
      shared.style.blockCol = function (optIn) {
        // let endTime = hasVar(optIn.endTime)
        //   ? optIn.endTime
        //   : undefined
        // if (endTime < Number(shared.data.server.timeOfNight.now)) return colorTheme.blocks.shutdown
        let state = hasVar(optIn.exeState.state)
          ? optIn.exeState.state
          : undefined
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

    shared.data.server = dataIn.data
    shared.data.server.schedBlocks = createSchedBlocks(shared.data.server.blocks)
    let ce = shared.data.server.external_clockEvents[0]
    for (let i = 0; i < ce.length; i++) {
      ce[i].start_time = (new Date(ce[i].start_date).getTime() - new Date(shared.data.server.timeOfNight.date_start)) / 1000
      ce[i].end_time = ce[i].end_date === '' ? undefined : (new Date(ce[i].end_date).getTime() - new Date(shared.data.server.timeOfNight.date_start)) / 1000
    }
    let cp = deepCopy(shared.data.server.blocks)
    shared.data.copy = {
      blocks: cp,
      schedBlocks: createSchedBlocks(cp),
      conflicts: [],
      modifications: []
    }

    svgBrush.initData()
    svgEventsQueueServer.initData()
    // svgWarningArea.initData({
    //   tag: 'pushPull',
    //   g: svg.g.append('g'),
    //   box: box.pushPull,
    //   attr: {
    //     text: {
    //       size: 9
    //     },
    //     icon: {
    //       size: 20
    //     }
    //   },
    //   pull: {
    //     g: undefined,
    //     box: {x: 0, y: 0, w: 0.5, h: 1},
    //     child: {}
    //   },
    //   push: {
    //     g: undefined,
    //     box: {x: 0.5, y: 0, w: 0.5, h: 1},
    //     child: {}
    //   },
    //   debug: {
    //     enabled: false
    //   }
    // })
    svgTargets.initData()
    svgTelsConflict.initData()
    svgBlocksQueueServer.initData()
    svgFocusOverlay.initData()
    svgRightInfo.initData()
    // svgBlocksQueueCopy.initData()

    svgBrush.updateData()

    svgBlocksQueueServer.updateData()
    svgTargets.updateData()
    svgTelsConflict.updateData()

    shared.mode = 'standby'
    setStandbyMode()
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
    shared.data.server.schedBlocks = createSchedBlocks(shared.data.server.blocks)
    let ce = shared.data.server.external_clockEvents[0]
    for (let i = 0; i < ce.length; i++) {
      ce[i].start_time = (new Date(ce[i].start_date).getTime() - new Date(shared.data.server.timeOfNight.date_start)) / 1000
      ce[i].end_time = ce[i].end_date === '' ? undefined : (new Date(ce[i].end_date).getTime() - new Date(shared.data.server.timeOfNight.date_start)) / 1000
    }
    console.log(shared);
    console.log([].concat(shared.data.copy.blocks['wait']).concat(shared.data.copy.blocks['run']).concat(shared.data.copy.blocks['done']).length);
    updateRuntoDoneBlocks()
    console.log([].concat(shared.data.copy.blocks['wait']).concat(shared.data.copy.blocks['run']).concat(shared.data.copy.blocks['done']).length);

    svgBlocksQueueServer.updateData()
    svgEventsQueueServer.updateData()
    svgBrush.updateData()
    svgRightInfo.update()

    let currentTime = {date: new Date(shared.data.server.timeOfNight.date_now)}
    svg.back.select('text#currentHour').text(d3.timeFormat('%H:%M')(currentTime.date))

    locker.remove('updateData')
  }
  function updateData (dataIn) {
    runLoop.push({ tag: 'updateData', data: dataIn })
  }
  this.updateData = updateData
  runLoop.init({ tag: 'updateData', func: updateDataOnce, nKeep: 1 })

  function updatePushonServer () {
    if (shared.data.copy.conflicts.length > 0) {
      svg.back.select('rect#conflictlighton')
        .attr('fill', colorPalette.blocks.fail.background)
      svg.back.select('rect#pushonServer')
        .attr('fill', colorTheme.darkest.stroke)
        .on('click', () => {})
        .on('mouseover', () => {})
        .on('mouseout', () => {})
    } else {
      svg.back.select('rect#conflictlighton')
        .attr('fill', '#43A047')
      svg.back.select('rect#pushonServer')
        .attr('fill', colorTheme.bright.background)
        .on('click', function () {
          pushNewSchedule()
        })
        .on('mouseover', function (d) {
          d3.select(this).attr('fill', colorTheme.darkest.background)
        })
        .on('mouseout', function (d) {
          d3.select(this).attr('fill', colorTheme.bright.background)
        })
    }
  }
  function updateRuntoDoneBlocks () {
    let change = false
    for (let i = shared.data.copy.blocks['run'].length - 1; i >= 0; i--) {
      let d = getBlockById(shared.data.server.blocks, shared.data.copy.blocks['run'][i].obId)
      if (d.key === 'done') {
        shared.data.copy.blocks['run'].splice(i, 1)
        shared.data.copy.blocks['done'].push(d.data)
        change = true
      }
    }
    for (let i = shared.data.copy.blocks['wait'].length - 1; i >= 0; i--) {
      let d = getBlockById(shared.data.server.blocks, shared.data.copy.blocks['wait'][i].obId)
      if (d.key === 'run') {
        shared.data.copy.blocks['wait'].splice(i, 1)
        shared.data.copy.blocks['run'].push(d.data)
        change = true
      } else if (d.key === 'done') {
        shared.data.copy.blocks['wait'].splice(i, 1)
        shared.data.copy.blocks['done'].push(d.data)
        // let ex = shared.data.copy.blocks['wait'].splice(i, 1)[0]
        // ex.exeState = d.data.exeState
        // shared.data.copy.blocks['done'].push(ex)
        change = true
      }
    }
    if (change) createModificationsList()
  }
  function getBlocksData (from) {
    if (from === 'server') {
      return shared.data.server.blocks
    } else if (from === 'copy') {
      return shared.data.copy.blocks
    }
    return shared.data.copy.blocks
  }
  function getSchedBlocksData () {
    if (shared.mode === 'inspector') {
      return shared.data.server.schedBlocks
    }
    if (shared.mode === 'modifier') {
      return shared.data.copy.schedBlocks
    }
  }
  let focusManager = new function () {
    function unfocusCore (type, id) {
      function schedBlock () {
        svgRightInfo.clean()
        // svgInformation.unfocusSchedBlocks()
        // svgSchedBlocksIcons.unfocusOnSchedBlocks()
        //
        // blockQueue.unfocusOnSchedBlocks()
        // blockQueueModif.unfocusOnSchedBlocks()
        // blockQueueOptimized.unfocusOnSchedBlocks()
        // shared.focus.schedBlocks = undefined
      }
      function block () {
        svgRightInfo.clean()
        svgFocusOverlay.unfocusOnBlock(id)
        // if (!shared.focus.block) return
        // svgInformation.unfocusBlock()
        // svgInformation.focusOnSchedBlocks(shared.focus.schedBlocks)
        // blockQueue.unfocusOnBlock(shared.focus.block)
        // blockQueueModif.unfocusOnBlock(shared.focus.block)
        // blockQueueOptimized.unfocusOnBlock(shared.focus.block)
        // let dataB = getBlockById(shared.focus.block)
        // dataB = dataB.optimized.data ? dataB.optimized.data : dataB.insert.data
        // svgFocusOverlay.unfocusOnBlock({data: dataB})
        // shared.focus.block = undefined
      }
      function target () {
        svgRightInfo.clean()
      }
      function telescope () {
        svgRightInfo.clean()
      }
      if (type === 'schedBlock') schedBlock()
      if (type === 'block') block()
      if (type === 'target') target()
      if (type === 'telescope') telescope()
    }
    function focusCore (type, id) {
      function schedBlock () {
        // svgInformation.unfocusSchedBlocks()
        // svgSchedBlocksIcons.unfocusOnSchedBlocks()
        //
        // blockQueue.unfocusOnSchedBlocks()
        // blockQueueModif.unfocusOnSchedBlocks()
        // blockQueueOptimized.unfocusOnSchedBlocks()
        // shared.focus.schedBlocks = undefined
        svgRightInfo.focusOnSchedBlock(id)
      }
      function block () {
        svgRightInfo.focusOnBlock(id)
        // if (shared.over && shared.over.type === type && shared.over.id === id) return
        svgFocusOverlay.focusOnBlock(id)
        // console.log(shared.focus.block, block);
        // if (shared.focus.block !== undefined) {
        //   if (shared.focus.block === block.obId) {
        //     mainUnfocusOnBlock()
        //     return
        //   }
        //   mainUnfocusOnBlock()
        // }
        // mainUnfocusOnSchedBlocks()
        // mainFocusOnSchedBlocks(block.sbId)
        // shared.focus.block = block.obId
        // // svgSchedBlocksIcons.focusOnSchedBlocks(block)
        // svgInformation.focusOnBlock(block.obId)
        // blockQueue.focusOnBlock(block.obId)
        // blockQueueModif.focusOnBlock(block.obId)
        // blockQueueOptimized.focusOnBlock(block.obId)
        // svgFocusOverlay.focusOnBlock({data: block})
      }
      function target () {
        svgRightInfo.focusOnTarget(id)
      }
      function telescope () {
        svgRightInfo.focusOnTelescope(id)
      }

      if (type === 'schedBlock') schedBlock()
      if (type === 'block') block()
      if (type === 'target') target()
      if (type === 'telescope') telescope()
    }

    function outCore (type, id) {
      function schedBlock () {
        // svgRightInfo.clean()
      }
      function block () {
        svgFocusOverlay.outBlock(id)
      }
      function target () {
        // svgRightInfo.clean()
      }
      function telescope () {
        // svgRightInfo.clean()
      }
      if (type === 'schedBlock') schedBlock()
      if (type === 'block') block()
      if (type === 'target') target()
      if (type === 'telescope') telescope()
    }
    function overCore (type, id) {
      function schedBlock () {
        // svgRightInfo.focusOnSchedBlock(id)
      }
      function block () {
        svgFocusOverlay.overBlock(shared.over.id)
      }
      function target () {
        // svgRightInfo.focusOnTarget(id)
      }
      function telescope () {
        // svgRightInfo.focusOnTelescope(id)
      }

      if (type === 'schedBlock') schedBlock()
      if (type === 'block') block()
      if (type === 'target') target()
      if (type === 'telescope') telescope()
    }

    function unfocus () {
      let type = shared.focus.type
      let id = shared.focus.id
      shared.focus = undefined
      unfocusCore(type, id)
    }
    this.unfocus = unfocus
    function focusOn (type, id) {
      if (shared.focus) {
        if (shared.focus.type === type && shared.focus.id === id) {
          unfocus()
        } else {
          unfocus()
          shared.focus = {type: type, id: id}
          // if (shared.history.index === -1 || shared.history.list[shared.history.index].id !== id) {
          //   shared.history.list.push({type: type, id: id})
          //   shared.history.index = shared.history.list.length - 1
          // }
          // if (shared.history.index === shared.history.list.length - 1) {
          //   shared.history.list.push({type: type, id: id})
          //   shared.history.index = shared.history.list.length - 1
          // } else {
          //   shared.history.list.splice(shared.history.index, shared.history.list.length, {type: type, id: id})
          //   shared.history.index = shared.history.list.length - 1
          // }
          focusCore(shared.focus.type, shared.focus.id)
        }
      } else {
        shared.focus = {type: type, id: id}
        // if (shared.history.index === -1 || shared.history.list[shared.history.index].id !== id) {
        //   shared.history.list.push({type: type, id: id})
        //   shared.history.index = shared.history.list.length - 1
        // }
        // if (shared.history.index === shared.history.list.length - 1) {
        //   shared.history.list.push({type: type, id: id})
        //   shared.history.index = shared.history.list.length - 1
        // } else {
        //   shared.history.list.splice(shared.history.index, shared.history.list.length, {type: type, id: id})
        //   shared.history.index = shared.history.list.length - 1
        // }
        focusCore(shared.focus.type, shared.focus.id)
      }
    }
    this.focusOn = focusOn

    function over (type, id) {
      if (shared.focus) {
        if (shared.over) {
          if (shared.over.type !== type && shared.over.id !== id) {
            shared.over = {type: type, id: id}
            overCore(type, id)
          }
        } else {
          shared.over = {type: type, id: id}
          if (shared.focus.type === type && shared.focus.id === id) return
          overCore(type, id)
        }
      } else {
        shared.over = {type: type, id: id}
        overCore(type, id)
      }
    }
    this.over = over
    function out (type, id) {
      if (shared.focus) {
        if (shared.focus.type === shared.over.type && shared.focus.id === shared.over.id) {
          shared.over = undefined
          return
        }
      }
      // let type = shared.over.type
      // let id = shared.over.id
      shared.over = undefined
      outCore(type, id)
    }
    this.out = out
  }()
  function navigateHistory (mode) {
    if (mode === 'backward') {
      shared.history.index -= 1
      if (shared.history.index === -1) shared.data.copy.blocks = deepCopy(getBlocksData('server'))
      else shared.data.copy.blocks = deepCopy(shared.history.list[shared.history.index].data)
    } else if (mode === 'forward') {
      shared.history.index += 1
      shared.data.copy.blocks = deepCopy(shared.history.list[shared.history.index].data)
    }
    updateRuntoDoneBlocks()
    createModificationsList()
    svgBlocksQueueServer.updateData()
    svgTelsConflict.update()
    svgRightInfo.updateOverview()
    // console.log(shared.data.copy.blocks);
    // console.log(getBlocksData('server'))
  }

  function scheduleSuccessfullyUpdate () {
    svg.g.selectAll('g.pushingNewSchedule')
      .append('text')
      .text('... Success')
      .style('fill', colorTheme.darker.text)
      .style('font-weight', 'bold')
      .style('font-size', '30px')
      .attr('text-anchor', 'middle')
      .attr('x', lenD.w[0] * 0.7)
      .attr('y', lenD.h[0] * 0.6)
    svg.g.selectAll('g.pushingNewSchedule')
      .transition()
      .delay(1000)
      .duration(400)
      .style('opacity', 0)
      .on('end', function () {
        svg.g.selectAll('g.pushingNewSchedule').remove()
        locker.remove('pushNewSchedule')
      })
  }
  this.scheduleSuccessfullyUpdate = scheduleSuccessfullyUpdate
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
  function setCol (optIn) {
    if (optIn.endTime < Number(shared.data.server.timeOfNight.now)) return colorTheme.blocks.shutdown
    let state = hasVar(optIn.state)
      ? optIn.state
      : optIn.exeState.state
    let canRun = hasVar(optIn.canRun)
      ? optIn.canRun
      : optIn.exeState.canRun

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
  function cleanBlocks () {
    let cleanSchedule = []
    for (let key in shared.data.copy.blocks) {
      let group = shared.data.copy.blocks[key]
      for (let i = 0; i < group.length; i++) {
        let cleanBlock = deepCopy(group[i])
        delete cleanBlock.display
        delete cleanBlock.filtered
        delete cleanBlock.nLine
        cleanSchedule.push(cleanBlock)
      }
    }
    return cleanSchedule
  }
  function pushNewSchedule () {
    console.log(shared.data.copy);
    locker.add('pushNewSchedule')
    let pushingG = svg.g.append('g')
      .attr('class', 'pushingNewSchedule')
    pushingG.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', lenD.w[0])
      .attr('height', lenD.h[0])
      .attr('fill', colorTheme.darker.background)
      .style('opacity', 0)
      .transition()
      .duration(400)
      .style('opacity', 0.8)
      .on('end', function () {
        let cleanQueue = cleanBlocks()
        sock.widgetV[widgetType].SockFunc.pushNewSchedule({
          widgetId: widgetId,
          newSchedule: cleanQueue
        })

        function loop (circle) {
          circle
            .attr('stroke-dashoffset', (2 * Math.PI * 25) * 0.35)
            .transition()
            .duration(1000)
            .ease(d3.easeCubic)
            .attr('stroke-dashoffset', -(2 * Math.PI * 25) * 0.65)
            .on('end', function () {
              loop(innerCircle)
            })
        }
        pushingG.append('circle')
          .attr('cx', lenD.w[0] * 0.5)
          .attr('cy', lenD.h[0] * 0.33)
          .attr('r', 25)
          .attr('fill', 'transparent')
          .attr('stroke', colorTheme.medium.background)
          .attr('stroke-width', 10)
        let innerCircle = pushingG.append('circle')
          .attr('cx', lenD.w[0] * 0.5)
          .attr('cy', lenD.h[0] * 0.33)
          .attr('r', 25)
          .attr('fill', 'transparent')
          .attr('stroke', colorTheme.medium.stroke)
          .attr('stroke-width', 10)
          .attr('stroke-dasharray', [(2 * Math.PI * 25) * 0.2, (2 * Math.PI * 25) * 0.8])
          .attr('stroke-dashoffset', (2 * Math.PI * 25) * 0.35)
        loop(innerCircle)

        pushingG.append('text')
          .text('Overriding schedule ...')
          .style('fill', colorTheme.darker.text)
          .style('font-weight', 'bold')
          .style('font-size', '30px')
          .attr('text-anchor', 'middle')
          .attr('x', lenD.w[0] * 0.3)
          .attr('y', lenD.h[0] * 0.6)
      })
  }
  this.pushNewSchedule = pushNewSchedule

  function switchMainMode () {
    svgBrush.translateTo(box.brushZoom.x, box.brushZoom.y + 24)
    svg.g.append('rect')
      .attr('id', 'createNewSchedButton')
      .attr('x', box.brushZoom.x)
      .attr('y', box.brushZoom.y + lenD.h[0] * 0.015)
      .attr('width', box.brushZoom.w)
      .attr('height', 21)
      .attr('fill', colorTheme.brighter.background)
      .attr('stroke', colorTheme.brighter.stroke)
      .attr('stroke-width', 0.2)
      .attr('rx', 2)
      .on('click', function () {
        createDummyBlock()
      })
  }
  function pullData () {
    let ori = {blocks: deepCopy(shared.data.server).blocks}
    for (var key in ori.blocks) {
      for (var i = 0; i < ori.blocks[key].length; i++) {
        ori.blocks[key][i].modifications = {
          created: false,
          modified: false,
          userModifications: {},
          optimizerModifications: {}
        }
      }
    }
    let opti = deepCopy(ori)
    let modi = deepCopy(ori)

    if (shared.data.copy.length === 0) {
      shared.data.current = 0
      shared.data.copy.push({original: ori, modified: modi, creation: {blocks: {done: [], run: [], wait: []}}, optimized: opti})
    } else {
      shared.data.copy[shared.data.current].original = ori
      shared.data.copy[shared.data.current].modified = modi
      shared.data.copy[shared.data.current].creation = {blocks: {done: [], run: [], wait: []}}
      shared.data.copy[shared.data.current].optimized = opti
    }

    updateAllBlocksQueue()
    svgTargets.updateData()
    svgTelsConflict.updateData()
    svgFocusOverlay.updateData()
  }
  function createSchedBlocks (blocks) {
    let temp = {}
    function core (blocks) {
      for (let i = 0; i < blocks.length; i++) {
        let b = blocks[i]
        if (!temp[b.sbId]) {
          temp[b.sbId] = {
            exeState: {
              state: b.exeState.state,
              canRun: true
            },
            targets: b.targets,
            blocks: [b]
          }
        } else {
          let sb = temp[b.sbId]
          sb.blocks.push(b)
          if (b.exeState.state === 'run' || sb.exeState.state === 'run') sb.exeState.state = 'run'
          else if (b.exeState.state === 'wait' && sb.exeState.state === 'done') sb.exeState.state = 'run'
          else if (b.exeState.state === 'done' && sb.exeState.state === 'wait') sb.exeState.state = 'run'
        }
      }
    }
    if (Array.isArray(blocks)) {
      core(blocks)
    } else {
      for (let key in blocks) {
        core(blocks[key])
      }
    }
    return temp
  }
  function optimizer () {
    shared.data.copy[shared.data.current].optimized = deepCopy(shared.data.copy[shared.data.current].modified)

    function isSameTime (s1, e1, s2, e2) {
      if (s1 > s2 && s1 < e2) return true
      if (e1 > s2 && e1 < e2) return true
      if (s1 < s2 && e1 > e2) return true
      return false
    }
    function shareSameTels (b1, b2) {
      let remTels1 = []
      let remTels2 = []
      for (let i = b1.telIds.length - 1; i > -1; i--) {
        for (let j = b2.telIds.length - 1; j > -1; j--) {
          if (b1.telIds[i] === b2.telIds[j]) {
            if (Math.random() > 0.5) remTels1.push(b1.telIds.splice(i, 1)[0])
            else remTels2.push(b2.telIds.splice(j, 1)[0])
            break
          }
        }
      }
      if (remTels1.length > 0) {
        b1.modifications.optimizerModifications.telescopes = []
        b1.modifications.optimizerModifications.telescopes.push({old: remTels1, new: []})
        b1.modifications.modified = true
      }
      if (remTels2.length > 0) {
        b2.modifications.optimizerModifications.telescopes = []
        b2.modifications.optimizerModifications.telescopes.push({old: remTels2, new: []})
        b2.modifications.modified = true
      }
    }
    for (let i = shared.data.copy[shared.data.current].optimized.blocks.wait.length - 1; i > -1; i--) {
      let tb = shared.data.copy[shared.data.current].optimized.blocks.wait[i]
      for (let j = 0; j < shared.data.copy[shared.data.current].optimized.blocks.run.length; j++) {
        let mb = shared.data.copy[shared.data.current].optimized.blocks.run[j]
        if (isSameTime(mb.startTime, mb.endTime, tb.startTime, tb.endTime)) {
          shareSameTels(mb, tb)
        }
      }
      for (let j = 0; j < shared.data.copy[shared.data.current].optimized.blocks.wait.length; j++) {
        let mb = shared.data.copy[shared.data.current].optimized.blocks.wait[j]
        if (isSameTime(mb.startTime, mb.endTime, tb.startTime, tb.endTime)) {
          shareSameTels(mb, tb)
        }
      }
    }
    svgBlocksQueueOptimized.updateData()
  }
  function groupBlocksBySchedule (blocks) {
    let res = {}
    for (var key in blocks) {
      for (var i = 0; i < blocks[key].length; i++) {
        let ns = blocks[key][i].metaData.nSched
        if (ns in res) res[ns].push(blocks[key][i])
        else res[ns] = [blocks[key][i]]
      }
    }
    let ret = []
    Object.keys(res).map(function (key, index) {
      ret.push({schedName: key, scheduleId: res[key][0].sbId, blocks: res[key]})
    })
    return ret
  }
  function getTargetById (id) {
    for (let i = 0; i < shared.data.server.targets.length; i++) {
      if (shared.data.server.targets[i].id === id) {
        return shared.data.server.targets[i]
      }
    }
  }
  function getTelescopeById (id) {
    for (let i = 0; i < shared.data.server.telHealth.length; i++) {
      if (shared.data.server.telHealth[i].id === id) {
        return shared.data.server.telHealth[i]
      }
    }
  }
  function getBlockById (blockList, blockId) {
    let block = {data: undefined, key: undefined, index: undefined}
    for (let key in blockList) {
      let group = blockList[key]
      for (let i = 0; i < group.length; i++) {
        if (group[i].obId === blockId) {
          block = {data: group[i], key: key, index: i}
          return block
        }
      }
    }
    // for (let key in shared.data.copy[shared.data.current].original.blocks) {
    //   let group = shared.data.copy[shared.data.current].original.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       block.original = {data: group[i], key: key, index: i}
    //     }
    //   }
    // }
    // for (let key in shared.data.copy[shared.data.current].modified.blocks) {
    //   let group = shared.data.copy[shared.data.current].modified.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       block.modified = {data: group[i], key: key, index: i}
    //     }
    //   }
    // }
    // for (let key in shared.data.copy[shared.data.current].optimized.blocks) {
    //   let group = shared.data.copy[shared.data.current].optimized.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       block.optimized = {data: group[i], key: key, index: i}
    //     }
    //   }
    // }
    // for (let key in shared.data.copy[shared.data.current].creation.blocks) {
    //   let group = shared.data.copy[shared.data.current].creation.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       block.insert = {data: group[i], key: key, index: i}
    //     }
    //   }
    // }
    return block
  }
  function overrideProperties (from, to) {
    for (let key in from) {
      to[key] = from[key]
    }
  }

  function createModificationsList () {
    shared.data.copy.modifications = []
    for (let key in shared.data.copy.blocks) {
      for (let i = 0; i < shared.data.copy.blocks[key].length; i++) {
        let block = shared.data.copy.blocks[key][i]
        let sched = shared.data.copy.modifications.filter(d => d.id === block.sbId)
        let old = getBlockById(getBlocksData('server'), block.obId).data
        let diff = checkBlocksDifference(old, block)

        if (sched.length === 0) {
          if (diff.length !== 0) shared.data.copy.modifications.push({id: block.sbId, name: block.metaData.nSched, blocks: [block]})
        } else {
          let b = sched[0].blocks.filter(d => d.obId === block.obId)
          if (b.length === 0) {
            if (diff.length !== 0) sched[0].blocks.push(block)
          } else {
            if (diff.length !== 0) b = block
            else {
              sched[0].blocks.splice(sched[0].blocks.indexOf(b), 1)
              if (sched[0].blocks.length === 0) {
                shared.data.copy.modifications.splice(shared.data.copy.modifications.indexOf(sched[0]), 1)
              }
            }
          }
        }
      }
    }
    console.log(shared.data.copy.modifications);
  }
  function checkBlocksDifference (reference, changed) {
    let diff = []
    function diffTime () {
      if (reference === undefined) {
        diff.push({type: 'time',
          start: {old: undefined, new: changed.time.start},
          duration: {old: undefined, new: changed.time.duration},
          end: {old: undefined, new: changed.time.end}
        })
        return
      }
      if (reference.time.start !== changed.time.start || reference.time.duration !== changed.time.duration) {
        diff.push({type: 'time',
          start: {old: reference.time.start, new: changed.time.start},
          duration: {old: reference.time.duration, new: changed.time.duration},
          end: {old: reference.time.end, new: changed.time.end}
        })
      }
    }
    function diffState () {
      if (reference === undefined) {
        diff.push({type: 'state', old: undefined, new: changed.exeState.state})
        return
      }
      if (reference.exeState.state !== changed.exeState.state) {
        diff.push({type: 'state', old: reference.exeState.state, new: changed.exeState.state})
      }
    }
    function diffPointing () {
    }
    function diffTel () {
      if (reference === undefined) {
        diff.push({type: 'telescope',
          small: {diff: changed.telescopes.small.ids.length, new: changed.telescopes.small.ids, rem: []},
          medium: {diff: changed.telescopes.medium.ids.length, new: changed.telescopes.medium.ids, rem: []},
          large: {diff: changed.telescopes.large.ids.length, new: changed.telescopes.large.ids, rem: []}
        })
        return
      }

      let l = changed.telescopes.large.ids.length - reference.telescopes.large.ids.length
      let nl = changed.telescopes.large.ids.filter(d => reference.telescopes.large.ids.indexOf(d) === -1)
      let rl = reference.telescopes.large.ids.filter(d => changed.telescopes.large.ids.indexOf(d) === -1)

      let m = changed.telescopes.medium.ids.length - reference.telescopes.medium.ids.length
      let nm = changed.telescopes.medium.ids.filter(d => reference.telescopes.medium.ids.indexOf(d) === -1)
      let rm = reference.telescopes.medium.ids.filter(d => changed.telescopes.medium.ids.indexOf(d) === -1)

      let s = changed.telescopes.small.ids.length - reference.telescopes.small.ids.length
      let ns = changed.telescopes.small.ids.filter(d => reference.telescopes.small.ids.indexOf(d) === -1)
      let rs = reference.telescopes.small.ids.filter(d => changed.telescopes.small.ids.indexOf(d) === -1)

      if ((nl.length > 0 || rl.length > 0) || (nm.length > 0 || rm.length > 0) || (ns.length > 0 || rs.length > 0)) {
        diff.push({type: 'telescope',
          small: {diff: s, new: ns, rem: rs},
          medium: {diff: m, new: nm, rem: rm},
          large: {diff: l, new: nl, rem: rl}
        })
      }
    }
    diffState()
    diffTime()
    diffPointing()
    diffTel()
    return diff
  }
  let globalcounth = 0
  function changeBlockProperties (block, nohistory, type) {
    console.log(nohistory, type);
    createModificationsList()
    if (!nohistory) {
      shared.history.list.splice(shared.history.index + 1, shared.history.list.length)
      let last = shared.history.list[shared.history.index]
      if (shared.history.index >= 0 && last.id === block.obId && last.type === type) {
        shared.history.list[shared.history.index] = {data: deepCopy(getBlocksData('copy')), count: globalcounth, id: block.obId, type: type}
      } else {
        shared.history.list.push({data: deepCopy(getBlocksData('copy')), count: globalcounth, id: block.obId, type: type})
        shared.history.index = shared.history.list.length - 1
        globalcounth++
      }
    }
    svgRightInfo.updateOverview()
  }

  function createDummyBlock () {
    let newBlock = deepCopy(blockTemplate)

    let nSched = 80 + Math.floor(Math.random() * 20)

    newBlock.time = {
      start: 0,
      duration: 2000,
      end: 2000
    }
    newBlock.exeState = {state: 'wait', canRun: true}
    newBlock.metaData = {blockName: nSched + ' (0)', nObs: 0, nSched: nSched}
    newBlock.obId = 'newBlockObID_' + nSched + '_0'
    newBlock.sbId = 'newBlockSbID_' + nSched
    newBlock.timeStamp = 101010209020
    newBlock.runPhase = []
    newBlock.created = true
    newBlock.targets = []
    newBlock.pointings = []
    newBlock.telescopes = {
      large: { min: 0, max: 4, ids: [] },
      medium: { min: 0, max: 25, ids: [] },
      small: { min: 0, max: 70, ids: [] }
    }
    shared.data.copy.blocks.wait.push(newBlock)
    shared.data.copy.schedBlocks = createSchedBlocks(shared.data.copy.blocks)

    focusManager.focusOn('schedBlock', newBlock.sbId)
    // console.log(getSchedBlocksData()['newBlockSbID'])
  }
  function createNewBlockInSchedule (schedB) {
    let newBlock = deepCopy(blockTemplate)

    let nSched = schedB.blocks[0].metaData.nSched
    newBlock.time = {
      start: schedB.blocks[schedB.blocks.length - 1].time.end + (60 * 1),
      duration: schedB.blocks[schedB.blocks.length - 1].time.duration,
      end: schedB.blocks[schedB.blocks.length - 1].time.end + (60 * 1) + schedB.blocks[schedB.blocks.length - 1].time.duration
    }
    newBlock.exeState = {state: 'wait', canRun: true}
    newBlock.metaData = {blockName: nSched + ' (' + schedB.blocks.length + ')', nObs: schedB.blocks.length, nSched: nSched}
    newBlock.obId = 'newBlockObID_' + nSched + '_' + schedB.blocks.length
    newBlock.sbId = schedB.blocks[0].sbId
    newBlock.timeStamp = 101010209020
    newBlock.runPhase = []
    newBlock.created = true
    newBlock.targets = []
    newBlock.pointings = []
    newBlock.telescopes = {
      large: { min: 0, max: 4, ids: [] },
      medium: { min: 0, max: 25, ids: [] },
      small: { min: 0, max: 70, ids: [] }
    }
    shared.data.copy.blocks.wait.push(newBlock)
    shared.data.copy.schedBlocks = createSchedBlocks(shared.data.copy.blocks)

    focusManager.focusOn('block', newBlock.obId)

    changeBlockProperties(newBlock, false, 'newblock')
    updateView()
  }
  function updateBlockState (block, newState) {
    if (block.exeState.state === newState) return
    let totBlock = getBlocksData()
    if (block.exeState.state === 'wait') {
      for (let i = 0; i < totBlock.wait.length; i++) {
        if (totBlock.wait[i].obId === block.obId) {
          let block = totBlock.wait.splice(i, 1)[0]
          block.exeState.state = newState
          if (block.exeState.state === 'run') {
            totBlock.run.push(block)
          } else if (block.exeState.state === 'cancel') {
            totBlock.done.push(block)
          }
        }
      }
    } else if (block.exeState.state === 'run') {
      for (let i = 0; i < totBlock.run.length; i++) {
        if (totBlock.run[i].obId === block.obId) {
          let block = totBlock.run.splice(i, 1)[0]
          block.exeState.state = newState
          if (block.exeState.state === 'cancel') {
            totBlock.done.push(block)
          }
        }
      }
    } else if (block.exeState.state === 'cancel') {
      for (let i = 0; i < totBlock.done.length; i++) {
        if (totBlock.done[i].obId === block.obId) {
          let block = totBlock.done.splice(i, 1)[0]
          block.exeState.state = newState
          if (block.exeState.state === 'run') {
            totBlock.run.push(block)
          } else if (block.exeState.state === 'wait') {
            totBlock.wait.push(block)
          }
        }
      }
    }
    updateView()
  }
  function updateView () {
    svgBlocksQueueServer.updateData()
  }


  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  // let SvgBlocksQueue = function () {
  //   // ---------------------------------------------------------------------------------------------------
  //   //
  //   // ---------------------------------------------------------------------------------------------------
  //   function initData () {
  //     let x0, y0, w0, h0, marg
  //     w0 = lenD.w[0] * 0.45 // 0.6
  //     h0 = lenD.h[0] * 0.14 // 0.18
  //     x0 = (lenD.w[0] * 0.02)
  //     y0 = (lenD.h[0] * 0.04)
  //     marg = w0 * 0.01
  //     let blockBoxData = {
  //       x: x0,
  //       y: y0,
  //       w: w0,
  //       h: h0,
  //       marg: marg
  //     }
  //     let gBlockBox = svg.g.append('g')
  //       .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
  //     gBlockBox.append('text')
  //       .text('CURRENT SCHEDULE')
  //       .style('fill', colorTheme.medium.text)
  //       .style('font-weight', 'bold')
  //       .style('font-size', '8px')
  //       .attr('text-anchor', 'left')
  //       .attr('transform', 'translate(-5,' + (y0 + h0 * 0.8) + ') rotate(270)')
  //     // gBlockBox.append('rect')
  //     //   .attr('x', 0)
  //     //   .attr('y', -10)
  //     //   // .attr('rx', 2)
  //     //   // .attr('ry', 2)
  //     //   .attr('width', blockBoxData.w + 0)
  //     //   .attr('height', blockBoxData.h + 12) // + 35)
  //     //   .attr('stroke', colorTheme.brighter.stroke)
  //     //   .attr('stroke-width', 0.4)
  //     //   // .attr('stroke-width', 12)
  //     //   // .attr('stroke-dasharray', [blockBoxData.w + 10 + blockBoxData.h + 10 + 35 + 6, blockBoxData.w + 10 - 12, blockBoxData.h + 10 + 35 + 16])
  //     //   .style('fill', colorTheme.brighter.background)
  //     blockQueue = new BlockQueue({
  //       main: {
  //         tag: 'blockQueueTopTag',
  //         g: gBlockBox,
  //         box: blockBoxData,
  //         background: {
  //           fill: colorTheme.dark.background,
  //           stroke: colorTheme.dark.stroke,
  //           strokeWidth: 0.1
  //         },
  //         colorTheme: colorTheme
  //       },
  //       axis: {
  //         enabled: true,
  //         g: undefined,
  //         box: {x: 0, y: blockBoxData.h, w: blockBoxData.w, h: 0, marg: blockBoxData.marg},
  //         axis: undefined,
  //         scale: undefined,
  //         domain: [0, 1000],
  //         range: [0, 0],
  //         showText: true,
  //         orientation: 'axisTop',
  //         attr: {
  //           text: {
  //             stroke: colorTheme.medium.stroke,
  //             fill: colorTheme.medium.stroke
  //           },
  //           path: {
  //             stroke: colorTheme.medium.stroke,
  //             fill: colorTheme.medium.stroke
  //           }
  //         }
  //       },
  //       blocks: {
  //         enabled: true,
  //         run: {
  //           enabled: true,
  //           g: undefined,
  //           box: {x: 0, y: blockBoxData.h * 0.45, w: blockBoxData.w, h: blockBoxData.h * 0.55, marg: blockBoxData.marg},
  //           events: {
  //             click: () => {},
  //             mouseover: () => {},
  //             mouseout: () => {},
  //             drag: {
  //               start: () => {},
  //               tick: () => {},
  //               end: () => {}
  //             }
  //           },
  //           background: {
  //             fill: colorTheme.brighter.background,
  //             stroke: 'none',
  //             strokeWidth: 0
  //           }
  //         },
  //         cancel: {
  //           enabled: true,
  //           g: undefined,
  //           box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h * 0.3, marg: blockBoxData.marg},
  //           events: {
  //             click: () => {},
  //             mouseover: () => {},
  //             mouseout: () => {},
  //             drag: {
  //               start: () => {},
  //               tick: () => {},
  //               end: () => {}
  //             }
  //           },
  //           background: {
  //             fill: colorTheme.brighter.background,
  //             stroke: colorTheme.brighter.stroke,
  //             strokeWidth: 0
  //           }
  //         },
  //         modification: {
  //           enabled: false,
  //           g: undefined,
  //           box: undefined,
  //           events: {
  //             click: undefined,
  //             mouseover: undefined,
  //             mouseout: undefined,
  //             drag: {
  //               start: () => {},
  //               tick: () => {},
  //               end: () => {}
  //             }
  //           },
  //           background: {
  //             fill: undefined,
  //             stroke: undefined,
  //             strokeWidth: undefined
  //           }
  //         },
  //         colorPalette: colorTheme.blocks
  //       },
  //       filters: {
  //         enabled: false,
  //         g: undefined,
  //         box: {x: 0, y: blockBoxData.h * 0.15, w: lenD.w[0] * 0.12, h: blockBoxData.h * 0.7, marg: 0},
  //         filters: []
  //       },
  //       timeBars: {
  //         enabled: true,
  //         g: undefined,
  //         box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h, marg: blockBoxData.marg}
  //       },
  //       time: {
  //         currentTime: {time: 0, date: undefined},
  //         startTime: {time: 0, date: undefined},
  //         endTime: {time: 0, date: undefined},
  //       },
  //       data: {
  //         raw: undefined,
  //         formated: undefined,
  //         modified: undefined
  //       },
  //       debug: {
  //         enabled: false
  //       },
  //       pattern: {},
  //       event: {
  //       },
  //       input: {
  //         focus: {schedBlocks: undefined, block: undefined},
  //         over: {schedBlocks: undefined, block: undefined},
  //         selection: []
  //       }
  //     })
  //
  //     blockQueue.init()
  //     updateData()
  //   }
  //   this.initData = initData
  //
  //   function updateData () {
  //     let telIds = []
  //     $.each(shared.data.server.telHealth, function (index, dataNow) {
  //       telIds.push(dataNow.id)
  //     })
  //     blockQueue.updateData({
  //       time: {
  //         currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
  //         startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
  //         endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
  //       },
  //       data: {
  //         raw: {
  //           blocks: shared.data.server.blocks,
  //           telIds: telIds
  //         }
  //       }
  //     })
  //   }
  //   this.updateData = updateData
  // }
  let SvgEventsQueueServer = function () {
    let reserved = {}
    function initData () {
      let adjustedBox = {
        x: box.eventQueueServer.x,
        y: box.eventQueueServer.y,
        w: box.eventQueueServer.w,
        h: box.eventQueueServer.h,
        marg: lenD.w[0] * 0.01
      }

      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

      eventQueueServer = new EventDisplayer({
        main: {
          tag: 'eventDisplayerMiddleTag',
          g: reserved.g,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: 'none',
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0
          },
          colorTheme: colorTheme
        },

        displayer: 'eventTrack',
        eventQueue: {
          g: undefined,
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: 0, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            show: false,
            orientation: 'top',
            attr: {
              text: {
                size: 14,
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              },
              path: {
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              }
            }
          },
          details: {
            range: 'in',
            anchor: 'right'
          }
        },
        eventTrack: {
          g: undefined,
          schedBlocks: {
            label: {
              enabled: true,
              position: 'left'
            }
          },
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: 0, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            show: false,
            orientation: 'top',
            attr: {
              text: {
                size: 14,
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              },
              path: {
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              }
            }
          },
          timeBars: {
            enabled: false,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },

        filters: {
          eventFilters: [],
          filtering: []
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
        events: {
          event: {
            click: (d) => { console.log(d) },
            mouseover: (d) => { console.log(d) },
            mouseout: (d) => { console.log(d) },
            drag: {
              start: () => {},
              tick: () => {},
              end: () => {}
            }
          }
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })
      eventQueueServer.init()
    }
    this.initData = initData

    function blurry () {
      reserved.g.style('opacity', 0.1)
    }
    this.blurry = blurry
    function focus () {
      reserved.g.style('opacity', 1)
    }
    this.focus = focus

    function updateData () {
      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}
      eventQueueServer.updateData({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: startTime,
          endTime: endTime
        },
        data: {
          raw: {
            events_ponctual: shared.data.server.external_events[0],
            events_scheduled: shared.data.server.external_clockEvents[0]
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      // blockQueueServerPast.update({
      //   time: {
      //     currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
      //     startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
      //     endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
      //   }
      // })
    }
    this.update = update
  }
  let SvgBlocksQueueServer = function () {
    let reserved = {}
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServer.x,
        y: box.blockQueueServer.y,
        w: box.blockQueueServer.w,
        h: box.blockQueueServer.h,
        marg: lenD.w[0] * 0.01
      }
      let overlay = svg.g.append('g')
        .attr('transform', 'translate(' + (adjustedBox.x) + ',' + adjustedBox.y + ')')
        .style('opacity', 0.3)
        .style('pointer-events', 'auto')
      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
        .style('opacity', 1)
        .style('pointer-events', 'auto')

      blockQueueOverlay = new BlockDisplayer({
        main: {
          tag: 'blockQueueOverlayMiddleTag',
          g: overlay,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: 'none',
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'blockQueue2', // 'blockQueue2',
        blockQueue: {
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
              box: {x: 0, y: adjustedBox.h * 0.6, w: adjustedBox.w, h: adjustedBox.h * 0.6, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.0, w: adjustedBox.w, h: adjustedBox.h * 0.33, marg: adjustedBox.marg},
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
          timeBars: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockQueue2: {
          g: undefined,
          schedBlocks: {
            label: {
              enabled: false,
              position: 'left',
              clickable: true,
              size: (lenD.w[0] * 0.65 - adjustedBox.w)
            },
            layout: undefined
          },
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showAxis: false,
            orientation: 'axisTop',
            attr: {
              text: {
                size: 10,
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              },
              path: {
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              }
            }
          },
          timeBars: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: -adjustedBox.h, w: adjustedBox.w, h: adjustedBox.h * 4, marg: adjustedBox.marg}
          }
        },

        filters: {
          blockFilters: [],
          filtering: []
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
        events: {},
        input: {
          focus: {schedBlocks: [], blocks: []},
          over: {schedBlocks: [], blocks: []},
          selection: []
        }
      })
      blockQueueOverlay.init()

      blockQueue = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: reserved.g,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: 'none',
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.0
          },
          colorTheme: colorTheme
        },

        displayer: 'blockQueue2', // 'blockQueue2',
        blockQueue: {
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
              box: {x: 0, y: adjustedBox.h * 0.6, w: adjustedBox.w, h: adjustedBox.h * 0.6, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.0, w: adjustedBox.w, h: adjustedBox.h * 0.33, marg: adjustedBox.marg},
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
          timeBars: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockQueue2: {
          g: undefined,
          schedBlocks: {
            label: {
              enabled: true,
              position: 'left',
              clickable: true,
              size: (lenD.w[0] * 0.62 - adjustedBox.w)
            }
          },
          axis: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showAxis: true,
            orientation: 'axisTop',
            attr: {
              text: {
                size: 10,
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              },
              path: {
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              }
            }
          },
          timeBars: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: -adjustedBox.h, w: adjustedBox.w, h: adjustedBox.h * 4, marg: adjustedBox.marg}
          }
        },
        blockTrackShrink: {
          g: undefined,
          schedBlocks: {
            label: {
              enabled: true,
              position: 'left'
            }
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
            orientation: 'bottom',
            attr: {
              text: {
                size: 14,
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              },
              path: {
                stroke: colorTheme.medium.stroke,
                fill: colorTheme.medium.stroke
              }
            }
          },
          timeBars: {
            enabled: false,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockList: {

        },
        blockForm: {
          mosaic: {
            box: {x: 0, y: 0, w: adjustedBox.w * 0.2, h: adjustedBox.h, marg: adjustedBox.marg},
            order: 'nSched'
          },
          forms: {
            g: undefined,
            box: {x: adjustedBox.w * 0.22,
              y: adjustedBox.h * 0.02,
              w: adjustedBox.w * 0.78 - adjustedBox.h * 0.02,
              h: adjustedBox.h * 0.96,
              marg: adjustedBox.marg},
            display: 'list',
            scroll: {}
          }
        },

        filters: {
          blockFilters: [],
          filtering: []
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
        events: {
          block: {
            click: d => focusManager.focusOn('block', d.obId),
            dbclick: function (d) {
              d.exeState.state = 'cancel'
              changeBlockProperties(d, false, 'state')
            },
            mouseover: focusManager.over,
            mouseout: focusManager.out,
            drag: {
              start: svgFocusOverlay.dragStart,
              tick: svgFocusOverlay.dragTick,
              end: function (d) {
                let res = svgFocusOverlay.dragEnd(d)
                if (res) changeBlockProperties(d, false, 'startTime')
              }
            }
          },
          sched: {
            click: focusManager.focusOn,
            mouseover: focusManager.over,
            mouseout: focusManager.out
          }
        },
        input: {
          focus: {schedBlocks: [], blocks: []},
          over: {schedBlocks: [], blocks: []},
          selection: []
        }
      })
      blockQueue.init()
      blockQueue.switchStyle({
        runRecCol: colorTheme.blocks.shutdown,
        blockCol: function (optIn) {
          let state = hasVar(optIn.state)
            ? optIn.state
            : optIn.d.exeState.state
          let canRun = hasVar(optIn.canRun)
            ? optIn.canRun
            : optIn.d.exeState.canRun
          let modified = optIn.d.modifications ? optIn.d.modifications.userModifications.length > 0 : false

          if (state === 'wait') {
            if (modified) return colorTheme.blocks.wait
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
          // let startT = hasVar(optIn.startTime)
          //   ? optIn.startTime
          //   : optIn.d.startTime
          // if (startT < shared.data.server.timeOfNight.now) return colorTheme.blocks.shutdown
          // let state = hasVar(optIn.state)
          //   ? optIn.state
          //   : optIn.d.exeState.state
          // let canRun = hasVar(optIn.canRun)
          //   ? optIn.canRun
          //   : optIn.d.exeState.canRun
          // let modified = optIn.d.modifications ? optIn.d.modifications.userModifications.length > 0 : false
          //
          // if (state === 'wait') {
          //   if (modified) return colorTheme.blocks.wait
          //   return colorTheme.blocks.wait
          // } else if (state === 'cancel') {
          //   if (hasVar(canRun)) {
          //     if (!canRun) return colorTheme.blocks.cancelOp
          //   }
          //   return colorTheme.blocks.cancelSys
          // } else return colorTheme.blocks.shutdown
        },
        blockOpac: function (optIn) {
          let state = hasVar(optIn.state)
            ? optIn.state
            : optIn.d.exeState.state
          let canRun = hasVar(optIn.canRun)
            ? optIn.canRun
            : optIn.d.exeState.canRun
          let modified = optIn.d.modifications ? optIn.d.modifications.userModifications.length > 0 : false

          if (state === 'wait') {
            if (modified) return 0.2
            return 1
          } else if (state === 'run') {
            return 1
          } else if (state === 'cancel') {
            if (hasVar(canRun)) {
              if (!canRun) return 1
            }
            return 1
          } else return 1
        },
        blockPattern: function (optIn) {
          let startT = hasVar(optIn.startTime)
            ? optIn.startTime
            : optIn.d.startTime
          if (startT < shared.data.server.timeOfNight.now) return 'url(#patternLock)'
          return 'none'
        }
      })

      let axisTop = brushZoom.getAxis('top')
      reserved.g.append('rect')
        .attr('id', 'cloak')
        .attr('x', 0)
        .attr('y', -adjustedBox.y)
        .attr('width', 0)
        .attr('height', lenD.h[0])
        .attr('fill', colorTheme.darker.stroke)
        .attr('stroke', 'none')
        .style('opacity', 0.2)
        .style('pointer-events', 'none')
    }
    this.initData = initData

    function blurry () {
      reserved.g.style('opacity', 0.1)
    }
    this.blurry = blurry
    function focus () {
      reserved.g.style('opacity', 1)
    }
    this.focus = focus

    function updateData () {
      let telIds = []
      $.each(shared.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })

      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let newWidth = brushZoom.getAxis('top').scale(new Date(shared.data.server.timeOfNight.date_now))
      if (newWidth < 0) newWidth = 0
      if (newWidth > box.blockQueueServer.w) newWidth = box.blockQueueServer.w
      reserved.g.select('rect#cloak').attr('width', newWidth)

      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}

      blockQueue.updateData({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: startTime,
          endTime: endTime
        },
        data: {
          raw: {
            blocks: getBlocksData(),
            telIds: telIds
          },
          modified: []
        }
      })
      blockQueueOverlay.setLineLayout(blockQueue.getLineLayout())
      blockQueueOverlay.updateData({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: startTime,
          endTime: endTime
        },
        data: {
          raw: {
            blocks: getBlocksData('server'),
            telIds: telIds
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}

      blockQueueOverlay.update({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: startTime,
          endTime: endTime
        }
      })
      blockQueue.update({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: startTime,
          endTime: endTime
        }
      })
    }
    this.update = update
  }
  let SvgBrush = function () {
    let reserved = {}
    function initData () {
      let brushBox = {
        x: box.brushZoom.x,
        y: box.brushZoom.y,
        w: box.brushZoom.w,
        h: box.brushZoom.h,
        marg: lenD.w[0] * 0.01
      }
      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + brushBox.x + ',' + brushBox.y + ')')
      reserved.g.append('rect')
        .attr('x', 0)
        .attr('y', -brushBox.h * 0.6)
        .attr('width', brushBox.w)
        .attr('height', brushBox.h * 0.7)
        .attr('fill', colorPalette.darkest.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0) // 1.6)
        .attr('stroke-dasharray', [0, brushBox.w, brushBox.h * 0.7, brushBox.w, brushBox.h * 0.7])

      brushZoom = new PlotBrushZoom({
        main: {
          g: reserved.g,
          box: brushBox
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
              box: {x: 0, y: brushBox.h * 0.2, w: brushBox.w, h: brushBox.h * 0.2, marg: 0},
              type: 'bottom',
              attr: {
                text: {
                  enabled: false,
                  size: 14,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                },
                path: {
                  enabled: false,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                }
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, brushBox.w],
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
              box: {x: 0, y: brushBox.h * 0.95, w: brushBox.w, h: brushBox.h * 0.0, marg: 0},
              type: 'top',
              attr: {
                text: {
                  enabled: true,
                  size: 10,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                },
                path: {
                  enabled: false,
                  stroke: colorTheme.medium.background,
                  fill: colorTheme.medium.background
                }
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, brushBox.w],
            brush: {
              zoom: false,
              brush: false
            }
          },
          {
            id: 'bottom',
            enabled: true,
            showAxis: true,
            main: {
              g: undefined,
              box: {x: 0, y: brushBox.h * 0.6, w: brushBox.w, h: brushBox.h * 0.2, marg: 0},
              type: 'top',
              attr: {
                text: {
                  enabled: false,
                  size: 14,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                },
                path: {
                  enabled: true,
                  stroke: colorTheme.medium.stroke,
                  fill: colorTheme.medium.stroke
                }
              }
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, brushBox.w],
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
            box: {x: 0, y: brushBox.h * 0.15, w: brushBox.w, h: brushBox.h * 0.65, marg: 0},
            attr: {
              fill: colorPalette.medium.background
            }
          }
        },
        focus: {
          enabled: true,
          main: {
            g: undefined,
            box: {x: 0, y: brushBox.h * 0.15, w: brushBox.w, h: brushBox.h * 0.65, marg: 0},
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
            svgBlocksQueueServer.updateData()
            svgEventsQueueServer.updateData()
            svgTargets.updateData()
            svgTelsConflict.update()
            svgFocusOverlay.update()
          }
        }
      })
      brushZoom.init()
    }
    this.initData = initData

    function blurry () {
      reserved.g.style('opacity', 0.1)
    }
    this.blurry = blurry
    function focus () {
      reserved.g.style('opacity', 1)
    }
    this.focus = focus

    function translateTo (x, y) {
      reserved.g.attr('transform', 'translate(' + x + ',' + y + ')')
    }
    this.translateTo = translateTo

    function updateData () {
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}

      brushZoom.updateAxis({
        id: 'top',
        domain: [startTime.date, endTime.date]
      })
      brushZoom.updateAxis({
        id: 'middle',
        domain: [startTime.date, endTime.date]
      })
      brushZoom.updateAxis({
        id: 'bottom',
        domain: [startTime.date, endTime.date]
      })
    }
    this.updateData = updateData

    function update () {}
    this.update = update
  }
  let SvgWarningArea = function () {
    let reserved = {}
    function createWarning (pullOrPush) {
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
      // let dataPointsPull = [
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.1},
      //   {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.1},
      //   {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.2},
      //   {x: reserved[pullOrPush].box.w * 0.7, y: reserved[pullOrPush].box.h * 0.8},
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.8},
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.1}
      // ]
      // let dataPointsPush = [
      //   {x: reserved[pullOrPush].box.w * 0.28, y: reserved[pullOrPush].box.h * 0.1},
      //   {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.1},
      //   {x: reserved[pullOrPush].box.w * 0.9, y: reserved[pullOrPush].box.h * 0.8},
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.8},
      //   {x: reserved[pullOrPush].box.w * 0.1, y: reserved[pullOrPush].box.h * 0.6},
      //   {x: reserved[pullOrPush].box.w * 0.28, y: reserved[pullOrPush].box.h * 0.1}
      // ]
      let dataPoints = [
        {x: reserved[pullOrPush].box.w * 0.05, y: reserved[pullOrPush].box.h * 0.25},
        {x: reserved[pullOrPush].box.w * 0.95, y: reserved[pullOrPush].box.h * 0.25},
        {x: reserved[pullOrPush].box.w * 0.95, y: reserved[pullOrPush].box.h * 0.9},
        {x: reserved[pullOrPush].box.w * 0.05, y: reserved[pullOrPush].box.h * 0.9},
        {x: reserved[pullOrPush].box.w * 0.05, y: reserved[pullOrPush].box.h * 0.25}
      ]

      function loop (bool, pullOrPush) {
        reserved[pullOrPush].child.warningExclamation
          .transition()
          .delay(4000)
          .duration(100)
          .ease(d3.easeLinear)
          .attr('font-size', function () {
            return reserved.attr.text.size * 6 + 'px'
          })
          // .attr('dy', function () {
          //   return reserved[pullOrPush].box.h * 0.02
          // })
          .transition()
          .duration(100)
          .ease(d3.easeLinear)
          .attr('font-size', function () {
            return reserved.attr.text.size * 4 + 'px'
          })
          // .attr('dy', function () {
          //   return reserved[pullOrPush].box.h * 0.3
          // })
          .on('end', function () {
            return loop(!bool, pullOrPush)
          })
        // reserved[pullOrPush].child.warningExclamationBack
        //   .transition()
        //   .delay(4000)
        //   .duration(100)
        //   .ease(d3.easeLinear)
        //   .attr('fill', function () {
        //     return '#FFEB3B'
        //   })
        //   .transition()
        //   .duration(100)
        //   .ease(d3.easeLinear)
        //   .attr('fill', function () {
        //     return '#FFEB3B'
        //   })
      }
      reserved[pullOrPush].child.warningTriangle = reserved[pullOrPush].g.append('path')
        .data(function () {
          if (pullOrPush === 'pull') return [dataPoints]
          else return [dataPoints]
        })
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.brighter.background)
        .attr('stroke', colorTheme.brighter.stroke)
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 0.4)
        .attr('fill-opacity', 1)
        .on('click', function () {
          if (reserved[pullOrPush].g.attr('opacity') === '0.01') reserved[pullOrPush].g.attr('opacity', 1)
          else reserved[pullOrPush].g.attr('opacity', 0.01)
        })

      // reserved[pullOrPush].child.warningExclamationBack = reserved[pullOrPush].g.append('rect')
      //   .attr('width', reserved[pullOrPush].box.w * 0.2)
      //   .attr('height', reserved[pullOrPush].box.h * 0.6)
      //   .attr('x', function () {
      //     if (pullOrPush === 'pull') return reserved[pullOrPush].box.w * 0.74
      //     else return reserved[pullOrPush].box.w * 0.17
      //   })
      //   .attr('y', reserved[pullOrPush].box.h * 0.28)
      //   .attr('rx', 3)
      //   .attr('ry', 3)
      //   .attr('fill', colorTheme.warning.background)
      //   .attr('fill-opacity', 0.6)
      //   .attr('stroke-width', 0.0)
      //   .attr('stroke', colorTheme.warning.stroke)
      reserved[pullOrPush].child.warningExclamation = reserved[pullOrPush].g.append('text')
        .text(function (d) {
          return '! '
        })
        .attr('x', function () {
          if (pullOrPush === 'pull') return reserved[pullOrPush].box.w * 0.85
          else return reserved[pullOrPush].box.w * 0.85
        })
        .attr('y', reserved[pullOrPush].box.h * 0.75)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .attr('font-size', reserved.attr.text.size * 4 + 'px')
        // .attr('dy', reserved[pullOrPush].box.h * 0.3)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.warning.text)
      loop(true, pullOrPush)

      function pullWarning () {
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Online Schedule'
          })
          .attr('x', reserved[pullOrPush].box.w * 0.4)
          .attr('y', reserved[pullOrPush].box.h * 0.35)
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size + 'px')
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine2 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'has changed'
          })
          .attr('x', reserved[pullOrPush].box.w * 0.4)
          .attr('y', reserved[pullOrPush].box.h * 0.45)
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size + 'px')
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        // reserved[pullOrPush].child.warningLine3 = reserved[pullOrPush].g.append('text')
        //   .text(function (d) {
        //     return 'new schedule.'
        //   })
        //   .attr('x', function () {
        //     return reserved[pullOrPush].box.w * 0.22
        //   })
        //   .attr('y', reserved[pullOrPush].box.h * 0.88)
        //   .attr('text-anchor', 'start')
        //   .attr('font-size', reserved.attr.text.size)
        //   .attr('dy', reserved[pullOrPush].box.h * 0.02)
        //   .style('pointer-events', 'none')
        //   .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Please Update'
          })
          .attr('x', reserved[pullOrPush].box.w * 0.4)
          .attr('y', reserved[pullOrPush].box.h * 0.65)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size + 'px')
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'or Reset'
          })
          .attr('x', reserved[pullOrPush].box.w * 0.4)
          .attr('y', reserved[pullOrPush].box.h * 0.75)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size + 'px')
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
      }
      function pushWarning () {
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Some modifications'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.45
          })
          .attr('y', reserved[pullOrPush].box.h * 0.4)
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size + 'px')
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine2 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'will be invalidate'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.4
          })
          .attr('y', reserved[pullOrPush].box.h * 0.55)
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size + 'px')
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
        // reserved[pullOrPush].child.warningLine3 = reserved[pullOrPush].g.append('text')
        //   .text(function (d) {
        //     return 'changes will be lost.'
        //   })
        //   .attr('x', function () {
        //     return reserved[pullOrPush].box.w * 0.26
        //   })
        //   .attr('y', reserved[pullOrPush].box.h * 0.88)
        //   .attr('text-anchor', 'start')
        //   .attr('font-size', reserved.attr.text.size)
        //   .attr('dy', reserved[pullOrPush].box.h * 0.02)
        //   .style('pointer-events', 'none')
        //   .style('fill', colorTheme.brighter.text)
        reserved[pullOrPush].child.warningLine4 = reserved[pullOrPush].g.append('text')
        // reserved[pullOrPush].child.warningLine41 = reserved[pullOrPush].g.append('text')
        //   .text(function (d) {
        //     return '10:00'
        //   })
        //   .attr('x', function () {
        //     return reserved[pullOrPush].box.w * 0.65
        //   })
        //   .attr('y', reserved[pullOrPush].box.h * 0.35)
        //   .style('font-weight', 'bold')
        //   .attr('text-anchor', 'middle')
        //   .attr('font-size', reserved.attr.text.size)
        //   .attr('dy', reserved[pullOrPush].box.h * 0.02)
        //   .style('pointer-events', 'none')
        //   .style('fill', colorTheme.brighter.text)
        function countDown () {
          var countDownDate = new Date()
          countDownDate = countDownDate.setMinutes(countDownDate.getMinutes() + 10)
          var cd = setInterval(function () {
            var now = new Date()
            var distance = countDownDate - now
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            var seconds = Math.floor((distance % (1000 * 60)) / 1000)

            reserved[pullOrPush].child.warningLine41
              .text(function (d) {
                return (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds)
              })

            // If the count down is finished, write some text
            if (distance < 0) {
              clearInterval(cd)
            }
          }, 1000)
        }
        // countDown()
        reserved[pullOrPush].child.warningLine1 = reserved[pullOrPush].g.append('text')
          .text(function (d) {
            return 'Please Validate'
          })
          .attr('x', function () {
            return reserved[pullOrPush].box.w * 0.4
          })
          .attr('y', reserved[pullOrPush].box.h * 0.8)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .attr('font-size', reserved.attr.text.size + 'px')
          .attr('dy', reserved[pullOrPush].box.h * 0.02)
          .style('pointer-events', 'none')
          .style('fill', colorTheme.brighter.text)
      }

      if (pullOrPush === 'pull') pullWarning()
      else pushWarning()
    }
    function createPullButton () {
      createWarning('pull')
      reserved.pull.child.buttonBack = reserved.pull.g.append('rect')
        .attr('id', 'pull')
        .attr('width', reserved.pull.box.w * 0.4)
        .attr('height', reserved.attr.icon.size)
        .attr('x', reserved.pull.box.w * 0.1 - reserved.attr.icon.size * 0.5)
        .attr('y', -reserved.attr.icon.size * 0.5)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      // reserved.pull.child.buttonIcon = reserved.g.append('svg:image')
      //   .attr('class', 'icon')
      //   .attr('xlink:href', '/static/arrow-up.svg')
      //   .attr('width', reserved.attr.icon.size)
      //   .attr('height', reserved.attr.icon.size)
      //   .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.88 - reserved.pull.box.h * 0.24)
      //   .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.78 - reserved.pull.box.h * 0.24)
      //   .on('click', function () {
      //     pullData()
      //   })
      reserved.pull.child.infoText = reserved.pull.g.append('text')
        .attr('id', 'reset')
        .text(function (d) {
          return 'Reset'
        })
        .attr('x', reserved.pull.box.w * 0.2)
        .attr('y', reserved.attr.icon.size * 0.1)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', reserved.attr.text.size + 'px')
        .style('pointer-events', 'none')
        .style('fill', colorTheme.bright.text)

      reserved.pull.g.attr('opacity', 0)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('opacity', 1)
    }
    function createMergeButton () {
      reserved.pull.child.merge = {}
      reserved.pull.child.merge.buttonBack = reserved.pull.g.append('rect')
        .attr('id', 'merge')
        .attr('width', reserved.pull.box.w * 0.4)
        .attr('height', reserved.attr.icon.size)
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.55)
        .attr('y', -reserved.attr.icon.size * 0.5)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      // reserved.pull.child.buttonIcon = reserved.g.append('svg:image')
      //   .attr('class', 'icon')
      //   .attr('xlink:href', '/static/arrow-up.svg')
      //   .attr('width', reserved.attr.icon.size)
      //   .attr('height', reserved.attr.icon.size)
      //   .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.88 - reserved.pull.box.h * 0.24)
      //   .attr('y', reserved.pull.box.y + reserved.pull.box.h * 0.22 - reserved.pull.box.h * 0.24)
      //   .on('click', function () {
      //     pullData()
      //   })
      reserved.pull.child.merge.infoText = reserved.pull.g.append('text')
        .attr('id', 'merge')
        .text(function (d) {
          return 'Update'
        })
        .attr('x', reserved.pull.box.x + reserved.pull.box.w * 0.75)
        .attr('y', reserved.attr.icon.size * 0.1)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', reserved.attr.text.size + 'px')
        .style('pointer-events', 'none')
        .style('fill', colorTheme.bright.text)

      reserved.pull.g.attr('opacity', 0)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('opacity', 1)
    }
    function createPushButton () {
      createWarning('push')
      reserved.push.child.merge = {}
      reserved.push.child.merge.buttonBack = reserved.push.g.append('rect')
        .attr('id', 'merge')
        .attr('width', reserved.push.box.w * 0.4)
        .attr('height', reserved.attr.icon.size)
        .attr('x', reserved.push.box.w * 0.3)
        .attr('y', -reserved.attr.icon.size * 0.5)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      // reserved.push.child.buttonIcon = reserved.g.append('svg:image')
      //   .attr('class', 'icon')
      //   .attr('xlink:href', '/static/arrow-up.svg')
      //   .attr('width', reserved.attr.icon.size)
      //   .attr('height', reserved.attr.icon.size)
      //   .attr('x', reserved.push.box.x + reserved.pull.box.w * 0.12 - reserved.pull.box.h * 0.24)
      //   .attr('y', reserved.push.box.y + reserved.pull.box.h * 0.5 - reserved.pull.box.h * 0.24)
      //   .on('click', function () {
      //     pushNewBlockQueue()
      //   })

      reserved.push.child.merge.infoText = reserved.push.g.append('text')
        .attr('id', 'merge')
        .text(function (d) {
          return 'Validate'
        })
        .attr('x', reserved.push.box.w * 0.5)
        .attr('y', reserved.attr.icon.size * 0.1)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', reserved.attr.text.size + 'px')
        .style('pointer-events', 'none')
        .style('fill', colorTheme.bright.text)

      reserved.push.g.attr('opacity', 0)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('opacity', 1)
    }

    function initPull () {
      reserved.pull.box = {
        x: reserved.box.w * 0.05,
        y: reserved.box.h * 0.25,
        w: reserved.box.w * 0.9,
        h: reserved.box.h * 0.28
      }
      reserved.pull.g = reserved.g.append('g')
        .attr('transform', 'translate(' + reserved.pull.box.x + ',' + reserved.pull.box.y + ')')
    }
    function initPush () {
      reserved.push.box = {
        x: reserved.box.w * 0.05,
        y: reserved.box.h * 0.6,
        w: reserved.box.w * 0.9,
        h: reserved.box.h * 0.2
      }
      reserved.push.g = reserved.g.append('g')
        .attr('transform', 'translate(' + reserved.push.box.x + ',' + reserved.push.box.y + ')')
    }
    function showPushPull () {
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .curve(d3.curveLinear)
      reserved.initGroup.g.append('path')
        .attr('id', 'arrow')
        .attr('d', function (d) {
          let targetPoints = [
            {x: reserved.box.w * 0.5 - 2, y: reserved.box.h * 0.2},
            {x: reserved.box.w * 0.5 - 2, y: reserved.box.h * 0.54},
            {x: reserved.box.w * 0.5 - 6, y: reserved.box.h * 0.54},
            {x: reserved.box.w * 0.5, y: reserved.box.h * 0.56},
            {x: reserved.box.w * 0.5 + 6, y: reserved.box.h * 0.54},
            {x: reserved.box.w * 0.5 + 2, y: reserved.box.h * 0.54},
            {x: reserved.box.w * 0.5 + 2, y: reserved.box.h * 0.2}
          ]
          return lineGenerator(targetPoints)
        })
        .attr('fill', colorTheme.darker.stroke)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.1)
      initPull()
      createMergeButton()
      createPullButton()
      initPush()
      createPushButton()
    }
    function hidePushPull () {
      reserved.initGroup.g.select('path#arrow').remove()
      reserved.pull.g.selectAll('*').remove()
      reserved.push.g.selectAll('*').remove()
    }
    // function hideInspector () {
    //   reserved.initGroup.g.selectAll('*').remove()
    //   reserved.initGroup = {}
    // }
    function showInspector () {
      reserved.initGroup = {}
      reserved.initGroup.g = reserved.g.append('g')
      reserved.initGroup.infoText = reserved.initGroup.g.append('text')
        .text(function (d) {
          return 'Modification status:'
        })
        .attr('x', reserved.box.w * 0.5)
        .attr('y', reserved.box.h * 0.06)
        .attr('text-anchor', 'middle')
        .style('font-weight', '')
        .style('font-size', reserved.attr.text.size)
        .style('pointer-events', 'none')
        .style('fill', colorTheme.bright.text)
      reserved.initGroup.g.append('rect')
        .attr('x', reserved.box.w * 0.5 - reserved.attr.icon.size * 0.5)
        .attr('y', reserved.box.h * 0.125 - reserved.attr.icon.size * 0.5)
        .attr('width', reserved.attr.icon.size)
        .attr('height', reserved.attr.icon.size)
        .attr('fill', '#aaaaaa')
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.1)
        .on('click', function () {
          if (shared.mode === 'inspector') {
            showPushPull()
            shared.mode = 'modifier'
            switchMainMode()
          } else if (shared.mode === 'modifier') {
            hidePushPull()
            shared.mode = 'inspector'
            switchMainMode()
          }
        })
    }
    function initData (optIn) {
      reserved = optIn
      reserved.g.attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')

      // reserved.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.box.w)
      //   .attr('height', reserved.box.h)
      //   .attr('fill', '#999999')
      showInspector()
      // initPull()
      // initPush()
      // createMergeButton()
      // createPushButton()
      // createPullButton()
    }
    this.initData = initData

    function updateData () {

    }
    this.updateData = updateData
  }
  let SvgTargets = function () {
    let reserved = {}
    reserved.drag = {}
    function initData () {
      reserved.box = {
        x: box.tools.x,
        y: box.tools.y + box.tools.h * 0.0,
        w: box.tools.w,
        h: box.tools.h * 0.5,
        marg: lenD.w[0] * 0.01
      }

      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      reserved.g = gBlockBox
      // gBlockBox.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.box.w)
      //   .attr('height', reserved.box.h)
      //   .attr('fill', 'none')
      //   .attr('stroke', '#444444')
      //   .attr('stroke-width', 0.2)
      //   .attr('stroke-dasharray', [0, reserved.box.w, reserved.box.h, reserved.box.w, reserved.box.h])
      // gBlockBox.append('text')
      //   .text('MODIFICATIONS')
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(-5,' + (reserved.box.h * 0.5) + ') rotate(270)')
      reserved.clipping = {}
      reserved.clipping.g = gBlockBox.append('g')
      reserved.clipping.g.append('defs').append('svg:clipPath')
        .attr('id', 'clipTarget')
        .append('svg:rect')
        .attr('id', 'clip-rect')
        .attr('x', '0')
        .attr('y', '0')
        .attr('width', reserved.box.w)
        .attr('height', reserved.box.h)
      reserved.clipping.clipBody = reserved.clipping.g.append('g')
        .attr('clip-path', 'url(#clipTarget)')
    }
    this.initData = initData
    function updateData () {
      drawTargets()
    }
    this.updateData = updateData
    function update () {}
    this.update = update

    function blurry () {
      reserved.g.style('opacity', 0.1)
    }
    this.blurry = blurry
    function focus () {
      reserved.g.style('opacity', 1)
    }
    this.focus = focus

    function drawTargets () {
      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}
      let scaleX = d3.scaleLinear()
        .range([0, reserved.box.w])
        .domain([startTime.time, endTime.time])
      let scaleY = d3.scaleLinear()
        .range([reserved.box.h, reserved.box.h * 0.2])
        .domain([0, 1])
      let lineGenerator = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .curve(d3.curveNatural)

      let allg = reserved.clipping.clipBody.selectAll('g.target')
        .data(shared.data.server.targets, function (d) {
          return d.id
        })
      let gEnter = allg.enter()
        .append('g')
        .attr('class', 'target')
      gEnter.append('path')
        .attr('d', function (d) {
          let targetPoints = [
            {x: scaleX(d.observability.minimal), y: scaleY(0)},
            {x: scaleX(d.observability.optimal), y: scaleY(1)},
            {x: scaleX(d.observability.maximal), y: scaleY(0)}
          ]
          return lineGenerator(targetPoints)
        })
        .attr('fill', function (d) {
          // if (block.targetId === d.id) return colorTheme.dark.background
          return 'none'
        })
        .attr('stroke', function (d) {
          // if (block.targetId === d.id) return colorTheme.dark.stroke
          return colorTheme.dark.stroke
        })
        .attr('stroke-width', function (d) {
          // if (block.targetId === d.id) return 0.2
          return 0.4
        })
        .attr('stroke-opacity', function (d) {
          // if (block.targetId === d.id) return 1
          return 0.4
        })
        .attr('fill-opacity', 0.15)
        .attr('stroke-dasharray', function (d) {
          // if (block.targetId === d.id) return []
          return [4, 6]
        })
      gEnter.append('text')
        .text(function (d) {
          return d.id
        })
        .attr('x', function (d) {
          let xx = scaleX(d.observability.minimal) + 10
          return xx
          // return (xx < 0) ? 10 : xx
        })
        .attr('y', reserved.box.h - 3)
        .attr('text-anchor', 'start')
        .attr('font-size', 10)
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .style('fill', function (d) {
          // if (block.targetId === d.id) return colorTheme.dark.stroke
          return colorTheme.dark.stroke
        })
        .style('fill-opacity', function (d) {
          // if (block.targetId === d.id) return 1
          return 0.6
        })
      let gMerge = allg.merge(gEnter)
      gMerge.select('path').attr('d', function (d) {
        let targetPoints = [
          {x: scaleX(d.observability.minimal), y: scaleY(0)},
          {x: scaleX(d.observability.optimal), y: scaleY(1)},
          {x: scaleX(d.observability.maximal), y: scaleY(0)}
        ]
        return lineGenerator(targetPoints)
      })
      gMerge.select('text').attr('x', function (d) {
        let xx = scaleX(d.observability.minimal) + 10
        return xx
        // return (xx < 0) ? 10 : xx
      })
    }
    function showPercentTarget (block) {
      reserved.clipping.clipBody.select('text.percentStart').remove()
      reserved.clipping.clipBody.select('text.percentEnd').remove()

      if (!block.targetId) return
      let target = reserved.clipping.clipBody.selectAll('g.target')
        .filter(function (d) { return (block.targetId === d.id) }).select('path')._groups[0][0]
      let scaleX = d3.scaleLinear()
        .range([0, reserved.box.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
      function dichotomiePath (targetedX, start, end, path, precision, step, maxStack) {
        if (step > maxStack) return {x: -1, y: -1}
        let middle = (end + start) * 0.5
        let point = path.getPointAtLength(middle)
        if (Math.abs(point.x - targetedX) < precision) return point
        if (point.x > targetedX) return dichotomiePath(targetedX, start, middle, path, precision, step + 1, maxStack)
        if (point.x < targetedX) return dichotomiePath(targetedX, middle, end, path, precision, step + 1, maxStack)
      }
      let scaleY = d3.scaleLinear()
        .range([reserved.box.h, reserved.box.h * 0.2])
        .domain([0, 1])
      let projBlockStart = {x: scaleX(block.time.start), y: -1}

      if (projBlockStart.x < target.getPointAtLength(0).x || projBlockStart.x > target.getPointAtLength(target.getTotalLength()).x) {
        projBlockStart.y = scaleY(0)
        reserved.clipping.clipBody.append('text')
          .attr('class', 'percentStart')
          .text(function (d) {
            return '0.00%'
          })
          .attr('x', projBlockStart.x - 5)
          .attr('y', projBlockStart.y - 5)
          .attr('text-anchor', 'end')
          .attr('font-size', 8)
          .attr('dy', 0)
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .style('fill', colorTheme.dark.stroke)
          .style('fill-opacity', 1)
      } else {
        projBlockStart = dichotomiePath(projBlockStart.x, 0, target.getTotalLength(), target, 0.1, 0, 30)
        reserved.clipping.clipBody.append('text')
          .attr('class', 'percentStart')
          .text(function (d) {
            return (scaleY.invert(projBlockStart.y) * 100).toFixed(2) + '%'
          })
          .attr('x', projBlockStart.x - 5)
          .attr('y', projBlockStart.y - 5)
          .attr('text-anchor', 'end')
          .attr('font-size', 8)
          .attr('dy', 0)
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .style('fill', colorTheme.dark.stroke)
          .style('fill-opacity', 1)
      }

      let projBlockEnd = {x: scaleX(block.time.end), y: -1}
      if (projBlockEnd.x < target.getPointAtLength(0).x || projBlockEnd.x > target.getPointAtLength(target.getTotalLength()).x) {
        projBlockEnd.y = scaleY(0)
        reserved.clipping.clipBody.append('text')
          .attr('class', 'percentEnd')
          .text(function (d) {
            return '0.00%'
          })
          .attr('x', projBlockEnd.x + 5)
          .attr('y', projBlockEnd.y - 5)
          .attr('text-anchor', 'start')
          .attr('font-size', 8)
          .attr('dy', 0)
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .style('fill', colorTheme.dark.stroke)
          .style('fill-opacity', 1)
      } else {
        projBlockEnd = dichotomiePath(projBlockEnd.x, 0, target.getTotalLength(), target, 0.1, 0, 30)
        reserved.clipping.clipBody.append('text')
          .attr('class', 'percentEnd')
          .text(function (d) {
            return (scaleY.invert(projBlockEnd.y) * 100).toFixed(2) + '%'
          })
          .attr('x', projBlockEnd.x + 5)
          .attr('y', projBlockEnd.y - 5)
          .attr('text-anchor', 'start')
          .attr('font-size', 8)
          .attr('dy', 0)
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .style('fill', colorTheme.dark.stroke)
          .style('fill-opacity', 1)
      }
    }
    this.showPercentTarget = showPercentTarget
    function highlightTarget (block) {
      let tarG = reserved.clipping.clipBody.selectAll('g.target')
        .filter(function (d) {
          for (let i = 0; i < block.targets.length; i++) {
            if (block.targets[i].id === d.id) return true
          }
          return false
        })
      tarG.select('path')
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.8)
        .attr('stroke-opacity', 1)
        .attr('fill-opacity', 0.55)
        .attr('stroke-dasharray', [])
      tarG.select('text')
        .style('fill', colorTheme.dark.stroke)
        .style('fill-opacity', 1)
      showPercentTarget(block)
    }
    this.highlightTarget = highlightTarget
    function unhighlightTarget (block) {
      if (!block) return
      reserved.clipping.clipBody.selectAll('text.percentStart').remove()
      reserved.clipping.clipBody.selectAll('text.percentEnd').remove()
      let tarG = reserved.clipping.clipBody.selectAll('g.target')
        .filter(function (d) {
          for (let i = 0; i < block.targets.length; i++) {
            if (block.targets[i].id === d.id) return true
          }
          return false
        })
      tarG.select('path')
        .attr('fill', 'none')
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('stroke-opacity', 0.4)
        .attr('fill-opacity', 0.15)
        .attr('stroke-dasharray', [4, 6])
      tarG.select('text')
        .style('fill', colorTheme.dark.stroke)
        .style('fill-opacity', 0.3)
    }
    this.unhighlightTarget = unhighlightTarget
  }

  let SvgTelsConflict = function () {
    let reserved = {}
    reserved.drag = {}
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initClipping () {
      reserved.clipping = {}
      reserved.clipping.g = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      reserved.clipping.g.append('defs').append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('id', 'clip-rect')
        .attr('x', '0')
        .attr('y', '0')
        .attr('width', reserved.box.w)
        .attr('height', reserved.box.h)
      reserved.clipping.clipBody = reserved.clipping.g.append('g')
        .attr('clip-path', 'url(#clip)')
    }
    function initData () {
      reserved.box = {
        x: box.tools.x,
        y: box.tools.y + box.tools.h * 0.5,
        w: box.tools.w,
        h: box.tools.h * 0.5,
        marg: lenD.w[0] * 0.01
      }
      initClipping()
      // gBlockBox.append('text')
      //   .text('MODIFICATIONS')
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(-5,' + (reserved.box.h * 0.5) + ') rotate(270)')

      reserved.gTargets = reserved.clipping.clipBody.append('g')

      let range = reserved.box.h * 0.33333

      reserved.clipping.g.append('text')
        .text('L')
        .style('fill', colorTheme.dark.stroke)
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (-10) + ',' + (range * 0.5 + 5) + ')')
      reserved.clipping.g.append('text')
        .text('M')
        .style('fill', colorTheme.dark.stroke)
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (-10) + ',' + (range * 1.5 + 5) + ')')
      reserved.clipping.g.append('text')
        .text('S')
        .style('fill', colorTheme.dark.stroke)
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (-10) + ',' + (range * 2.5 + 5) + ')')

      reserved.gTargets.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.dark.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
      reserved.gTargets.append('rect')
        .attr('x', 0)
        .attr('y', range * 1)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.medium.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
      reserved.gTargets.append('rect')
        .attr('x', 0)
        .attr('y', range * 2)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.dark.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
    }
    this.initData = initData
    function updateData () {
      // drawTelsAvailabilityCurve()
    }
    this.updateData = updateData
    function update () {
      drawTelsAvailabilityCurve()
      // linkConflicts()
    }
    this.update = update

    function blurry () {
      reserved.g.style('opacity', 0.1)
    }
    this.blurry = blurry
    function focus () {
      reserved.g.style('opacity', 1)
    }
    this.focus = focus

    function drawTelsAvailabilityCurve (block) {
      function mouseHover (g, d) {
        g.style('opacity', 0.3)
        let dim = {
          w: 40,
          h: 40,
          marg: 1
        }
        let middleoffset = scaleX(d.end) + scaleX(d.start)
        let finaloffset = ((middleoffset - ((dim.w + dim.marg) * d.blocks.length) + dim.marg) * 0.5)
        if (finaloffset < 0) finaloffset = 0
        if ((finaloffset + ((dim.w + dim.marg) * d.blocks.length) - dim.marg) > reserved.box.w) finaloffset = reserved.box.w - (((dim.w + dim.marg) * d.blocks.length) - dim.marg)
        let inngerg = reserved.clipping.g.append('g')
          .attr('id', 'innerg' + d.id)
          .attr('transform', 'translate(' + finaloffset + ',0)')
        for (let i = 0; i < d.blocks.length; i++) {
          let b = getBlockById(getBlocksData(), d.blocks[i]).data
          let bcolor = blockStyle(b)
          inngerg.append('rect')
            .attr('x', i * (dim.w + dim.marg))
            .attr('y', -dim.h)
            .attr('width', dim.w)
            .attr('height', dim.h)
            .attr('fill', bcolor.color.background)
            .attr('stroke', bcolor.color.stroke)
            .attr('stroke-width', 0.2)
          inngerg.append('text')
            .text(function () {
              return b.metaData.blockName
            })
            .attr('x', i * (dim.w + dim.marg) + dim.w * 0.5)
            .attr('y', -dim.h + 11) // - Number(reserved.drag.oldRect.attr('height')))
            .style('font-weight', '')
            .style('fill', '#000000')
            .style('stroke-width', 0.3)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .style('stroke', 'none')
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
        }
      }
      function mouseOut (g, d) {
        g.style('opacity', 0)
        reserved.clipping.g.select('g#innerg' + d.id).remove()
      }
      let curve = computeTelsCurve(block)
      conflictSquare = []

      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}
      let scaleX = d3.scaleLinear()
        .range([0, reserved.box.w])
        .domain([startTime.time, endTime.time])
      let range = reserved.box.h * 0.33333
      let scaleYSmall = d3.scaleLinear()
        .range([0, range])
        .domain([0, 70])
      let scaleYMedium = d3.scaleLinear()
        .range([0, range])
        .domain([0, 25])
      let scaleYLarge = d3.scaleLinear()
        .range([0, range])
        .domain([0, 4])
      let allg = reserved.gTargets.selectAll('g.telsCurve')
        .data(curve, function (d, i) {
          return d.id
        })
      let gEnter = allg.enter()
        .append('g')
        .attr('id', d => d.id)
        .attr('class', 'telsCurve')
      gEnter.append('rect').attr('class', 'hover')
      gEnter.append('rect').attr('class', 'small')
      gEnter.append('rect').attr('class', 'medium')
      gEnter.append('rect').attr('class', 'high')

      let gMerge = allg.merge(gEnter)

      gMerge.select('rect.small')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', function (d) {
          let y = Math.abs(scaleYSmall(d.smallTels))
          if (d.smallTels >= scaleYSmall.domain()[1]) y = range
          if (d.smallTels <= scaleYSmall.domain()[0]) y = 0
          return range * 2 + y
        })
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('fill', function (d, i) {
          if (d.smallTels < scaleYSmall.domain()[0]) {
            return '#FF5722'
          }
          return '#43A047'
        })
        .attr('height', function (d) {
          let height = range - Math.abs(scaleYSmall(d.smallTels))
          if (d.smallTels >= scaleYSmall.domain()[1]) height = 0
          if (d.smallTels <= scaleYSmall.domain()[0]) height = range
          return height
        })
        .attr('stroke', function (d) {
          return colorTheme.dark.stroke
        })
        .attr('stroke-width', function (d) {
          return 0
        })
        .attr('stroke-opacity', function (d) {
          return 1
        })
        .attr('fill-opacity', 0.6)
        .on('mouseover', function (d) {
          mouseHover(gMerge.select('g#' + d.id + ' rect.hover'), d)
        })
        .on('mouseout', function (d) {
          mouseOut(gMerge.select('g#' + d.id + ' rect.hover'), d)
        })
        .each(function (d) {
          if (d.smallTels < scaleYSmall.domain()[0]) conflictSquare.push({d3: d3.select(this), d: d})
        })
      gMerge.select('rect.medium')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', function (d) {
          let y = Math.abs(scaleYMedium(d.mediumTels))
          if (d.mediumTels >= scaleYMedium.domain()[1]) y = range
          if (d.mediumTels <= scaleYMedium.domain()[0]) y = 0
          return range + y
        })
        .attr('fill', function (d, i) {
          if (d.mediumTels < scaleYMedium.domain()[0]) {
            return '#FF5722'
          }
          return '#43A047'
        })
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('height', function (d) {
          let height = range - Math.abs(scaleYMedium(d.mediumTels))
          if (d.mediumTels >= scaleYMedium.domain()[1]) height = 0
          if (d.mediumTels <= scaleYMedium.domain()[0]) height = range
          return height
        })
        .attr('stroke', function (d) {
          return colorTheme.dark.stroke
        })
        .attr('stroke-width', function (d) {
          return 0
        })
        .attr('stroke-opacity', function (d) {
          return 1
        })
        .attr('fill-opacity', 0.6)
        .on('mouseover', function (d) {
          mouseHover(gMerge.select('g#' + d.id + ' rect.hover'), d)
        })
        .on('mouseout', function (d) {
          mouseOut(gMerge.select('g#' + d.id + ' rect.hover'), d)
        })
        .each(function (d) {
          if (d.mediumTels < scaleYMedium.domain()[0]) conflictSquare.push({d3: d3.select(this), d: d})
        })
      gMerge.select('rect.high')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', function (d) {
          let y = Math.abs(scaleYLarge(d.largeTels))
          if (d.largeTels >= scaleYLarge.domain()[1]) y = range
          if (d.largeTels <= scaleYLarge.domain()[0]) y = 0
          return range * 0 + y
        })
        .attr('fill', function (d, i) {
          if (d.largeTels < scaleYLarge.domain()[0]) {
            return '#FF5722'
          }
          return '#43A047'
        })
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('height', function (d) {
          let height = range - Math.abs(scaleYLarge(d.largeTels))
          if (d.largeTels >= scaleYLarge.domain()[1]) height = 0
          if (d.largeTels <= scaleYLarge.domain()[0]) height = range
          return height
        })
        .attr('stroke', function (d) {
          return colorTheme.dark.stroke
        })
        .attr('stroke-width', function (d) {
          return 0
        })
        .attr('stroke-opacity', function (d) {
          return 1
        })
        .attr('fill-opacity', 0.6)
        .on('mouseover', function (d) {
          mouseHover(gMerge.select('g#' + d.id + ' rect.hover'), d)
        })
        .on('mouseout', function (d) {
          mouseOut(gMerge.select('g#' + d.id + ' rect.hover'), d)
        })
        .each(function (d) {
          if (d.largeTels < scaleYLarge.domain()[0]) conflictSquare.push({d3: d3.select(this), d: d})
        })
      gMerge.select('rect.hover')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', 0)
        .attr('fill', colorPalette.darker.stroke)
        .style('opacity', 0)
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('height', range * 3)
        .on('mouseover', function (d) {
          mouseHover(d3.select(this), d)
        })
        .on('mouseout', function (d) {
          mouseOut(d3.select(this), d)
        })

      allg
        .exit()
        .style('opacity', 0)
        .remove()

      listAllConflicts(curve)
    }
    this.drawTelsAvailabilityCurve = drawTelsAvailabilityCurve
    function computeTelsCurve (block) {
      function core (b) {
        if (!largeTels[b.time.start]) largeTels[b.time.start] = 0// 4
        if (!mediumTels[b.time.start]) mediumTels[b.time.start] = 0// 24
        if (!smallTels[b.time.start]) smallTels[b.time.start] = 0// 70
        if (!largeTels[b.time.end]) largeTels[b.time.end] = 0// 4
        if (!mediumTels[b.time.end]) mediumTels[b.time.end] = 0// 24
        if (!smallTels[b.time.end]) smallTels[b.time.end] = 0// 70

        smallTels[b.time.start] += b.telescopes.small.min
        smallTels[b.time.end] -= b.telescopes.small.min
        mediumTels[b.time.start] += b.telescopes.medium.min
        mediumTels[b.time.end] -= b.telescopes.medium.min
        largeTels[b.time.start] += b.telescopes.large.min
        largeTels[b.time.end] -= b.telescopes.large.min

        if (!bIds[b.time.start]) bIds[b.time.start] = {type: 'add', ids: []}
        if (!bIds[b.time.end]) bIds[b.time.end] = {type: 'rem', ids: []}
        bIds[b.time.start].ids.push(b.obId)
        bIds[b.time.end].ids.push(b.obId)
      }
      let largeTels = {}
      let mediumTels = {}
      let smallTels = {}
      let bIds = {}
      // smallTels[shared.data.server.timeOfNight.start] = 0
      // mediumTels[shared.data.server.timeOfNight.start] = 0
      // largeTels[shared.data.server.timeOfNight.start] = 0
      let focusBlockList = getBlocksData()
      for (let key in focusBlockList) {
        for (let i = 0; i < focusBlockList[key].length; i++) {
          let b = focusBlockList[key][i]
          if (b.exeState.state === 'cancel') continue
          if (block && b.obId === block.obId) continue

          core(b)
        }
      }
      if (block) {
        core(block)
      }

      let timeMarker = []
      for (var key in smallTels) {
        timeMarker.push(Number(key))
      }
      timeMarker.sort((a, b) => a - b)

      let telsFree = []
      let currentBlockIds = []
      for (let i = -1; i < timeMarker.length; i++) {
        if (i === -1) {
          telsFree.push({
            id: 'LMS' + timeMarker[i] + Number(shared.data.server.timeOfNight.start),
            start: Number(shared.data.server.timeOfNight.start),
            end: timeMarker[i + 1],
            smallTels: 70,
            mediumTels: 25,
            largeTels: 4,
            blocks: []
          })
        } else if (i === timeMarker.length - 1) {
          telsFree.push({
            id: 'LMS' + timeMarker[i] + Number(shared.data.server.timeOfNight.end),
            start: timeMarker[i],
            end: Number(shared.data.server.timeOfNight.end),
            smallTels: 70,
            mediumTels: 25,
            largeTels: 4,
            blocks: []
          })
        } else {
          if (bIds[timeMarker[i]].type === 'rem') {
            currentBlockIds = currentBlockIds.filter(d => bIds[timeMarker[i]].ids.indexOf(d) < 0)
          } else {
            currentBlockIds = currentBlockIds.concat(bIds[timeMarker[i]].ids.filter(d => currentBlockIds.indexOf(d) < 0))
          }
          telsFree.push({
            id: 'LMS' + timeMarker[i] + timeMarker[i + 1],
            start: timeMarker[i],
            end: timeMarker[i + 1],
            smallTels: telsFree[i].smallTels - smallTels[timeMarker[i]],
            mediumTels: telsFree[i].mediumTels - mediumTels[timeMarker[i]],
            largeTels: telsFree[i].largeTels - largeTels[timeMarker[i]],
            blocks: deepCopy(currentBlockIds)
          })
        }
      }
      return telsFree
    }
  }
  let SvgFocusOverlay = function () {
    let reserved = {}
    reserved.drag = {}
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initClipping () {
      reserved.clipping = {}
      reserved.drag.box = {
        x: box.focusOverlay.x,
        y: box.focusOverlay.y,
        w: box.focusOverlay.w,
        h: box.focusOverlay.h,
        marg: lenD.w[0] * 0.01
      }
      reserved.clipping.g = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.drag.box.x + ',' + reserved.drag.box.y + ')')
      reserved.clipping.g.append('defs').append('svg:clipPath')
        .attr('id', 'clipOverlay')
        .append('svg:rect')
        .attr('id', 'clip-rect')
        .attr('x', '0')
        .attr('y', '-4')
        .attr('width', reserved.drag.box.w)
        .attr('height', reserved.drag.box.h + 4)
      reserved.clipping.clipBody = reserved.clipping.g.append('g')
        .attr('clip-path', 'url(#clipOverlay)')
      reserved.main = {
        g: reserved.clipping.clipBody.append('g')
      }
    }
    function initData () {
      reserved.hasData = false
      initClipping()
    }
    this.initData = initData

    function blurry () {
      reserved.main.g.style('opacity', 0.2)
    }
    this.blurry = blurry
    function focus () {
      reserved.main.g.style('opacity', 1)
    }
    this.focus = focus

    function updateData () {
      reserved.hasData = true
    }
    this.updateData = updateData
    function update () {
      if (!shared.focus || shared.focus.type !== 'block') return
      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}
      reserved.drag.timeScale = d3.scaleLinear()
        .range([0, reserved.drag.box.w])
        .domain([startTime.time, endTime.time])
      let d = getBlockById(getBlocksData(), shared.focus.id).data
      reserved.drag.position = {
        width: reserved.drag.timeScale(d.time.end) - reserved.drag.timeScale(d.time.start),
        left: reserved.drag.timeScale(d.time.start),
        right: reserved.drag.timeScale(d.time.end)
      }
      updateDragColumn()
      updateDragTimer()
    }
    this.update = update

    function createDragColumn (d) {
      reserved.drag.column = {}
      reserved.drag.column.g = reserved.drag.g.append('g')
      reserved.drag.column.g.append('rect')
        .attr('class', 'area')
        .attr('x', reserved.drag.position.left)
        // .attr('y', function () { return d.y + reserved.drag.box.h * 0.19 }) // - Number(reserved.drag.oldRect.attr('height')))
        .attr('width', reserved.drag.position.right - reserved.drag.position.left)
        // .attr('height', function () { return d.h })
        .attr('fill', '#ffffff')
        .attr('stroke', 'none')
        .attr('fill-opacity', 0.2)
        .style('pointer-events', 'none')
        .attr('y', 0)
        .attr('height', reserved.drag.box.h)
      reserved.drag.column.g.append('line')
        .attr('class', 'left')
        .attr('x1', reserved.drag.position.left)
        // .attr('y1', function () { return d.y + reserved.drag.box.h * 0.19 })
        .attr('x2', reserved.drag.position.left)
        // .attr('y2', function () { return d.y + reserved.drag.box.h * 0.19 + d.h })
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.2)
        .transition()
        .duration(150)
        .attr('y1', 0)
        .attr('y2', reserved.drag.box.h)
        // .attr('stroke-dasharray', [reserved.drag.box.h * 0.02, reserved.drag.box.h * 0.02])
      reserved.drag.column.g.append('line')
        .attr('class', 'right')
        .attr('x1', reserved.drag.position.right)
        // .attr('y1', function () { return d.y + reserved.drag.box.h * 0.19 })
        .attr('x2', reserved.drag.position.right)
        // .attr('y2', function () { return d.y + reserved.drag.box.h * 0.19 + d.h })
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.2)
        .transition()
        .duration(150)
        .attr('y1', 0)
        .attr('y2', reserved.drag.box.h)
        // .attr('stroke-dasharray', [reserved.drag.box.h * 0.02, reserved.drag.box.h * 0.02])
      reserved.drag.column.g.append('rect')
        .attr('class', 'top')
        .attr('x', reserved.drag.position.left - 4)
        .attr('y', -3) // - Number(reserved.drag.oldRect.attr('height')))
        .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
        .attr('height', 3)
        .attr('fill', colorTheme.darker.stroke)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('opacity', 0)
        .transition()
        .duration(50)
        .delay(0)
        .attr('opacity', 1)
      reserved.drag.column.g.append('rect')
        .attr('class', 'bottom')
        .attr('x', reserved.drag.position.left - 4)
        .attr('y', reserved.drag.box.h - 2) // - Number(reserved.drag.oldRect.attr('height')))
        .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
        .attr('height', 3)
        .attr('fill', colorTheme.darker.stroke)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('opacity', 0)
        .transition()
        .duration(50)
        .delay(0)
        .attr('opacity', 1)
    }
    function createDragTimer (d) {
      reserved.drag.timer = {}
      reserved.drag.timer.g = reserved.drag.g.append('g')
        .attr('transform', 'translate(' + reserved.drag.position.left + ',' + (reserved.drag.box.h * 0.66) + ')')
      reserved.drag.timer.g.append('line')
        .attr('id', 'leftBar')
        .attr('x1', -6)
        .attr('y1', 26)
        .attr('x2', 0)
        .attr('y2', 21)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 1)
      reserved.drag.timer.g.append('circle')
        .attr('id', 'leftCircle')
        .attr('cx', 0)
        .attr('cy', 21)
        .attr('r', 2)
        .attr('fill', colorTheme.dark.stroke)

      reserved.drag.timer.g.append('line')
        .attr('id', 'rightBar')
        .attr('x1', reserved.drag.position.width)
        .attr('y1', 21)
        .attr('x2', reserved.drag.position.width + 6)
        .attr('y2', 26)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 1)
      reserved.drag.timer.g.append('circle')
        .attr('id', 'rightCircle')
        .attr('cx', reserved.drag.position.width)
        .attr('cy', 21)
        .attr('r', 2)
        .attr('fill', colorTheme.dark.stroke)

      reserved.drag.timer.g.append('text')
        .attr('class', 'hourLeft')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
          return d3.timeFormat('%H:')(time)
        })
        .attr('x', -34)
        .attr('y', 32) // - Number(reserved.drag.oldRect.attr('height')))
        .style('font-weight', 'bold')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .attr('dy', '0px')
      reserved.drag.timer.g.append('text')
        .attr('class', 'minuteLeft')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
          return d3.timeFormat('%M')(time)
        })
        .attr('x', -18)
        .attr('y', 32) // - Number(reserved.drag.oldRect.attr('height')))
        .style('font-weight', 'bold')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .attr('dy', '0px')

      reserved.drag.timer.g.append('text')
        .attr('class', 'hourRight')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
          return d3.timeFormat('%H:')(time)
        })
        .attr('x', reserved.drag.position.width + 18)
        .attr('y', 32) // - Number(reserved.drag.oldRect.attr('height')))
        .style('font-weight', 'bold')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .attr('dy', '0px')
      reserved.drag.timer.g.append('text')
        .attr('class', 'minuteRight')
        .text(function () {
          let time = new Date(shared.data.server.timeOfNight.date_start)
          time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
          return d3.timeFormat('%M')(time)
        })
        .attr('x', reserved.drag.position.width + 34)
        .attr('y', 32) // - Number(reserved.drag.oldRect.attr('height')))
        .style('font-weight', 'bold')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .attr('dy', '0px')
    }

    function updateDragColumn (d) {
      reserved.drag.column.g.select('rect.area')
        .attr('x', reserved.drag.position.left)
        .attr('width', reserved.drag.position.right - reserved.drag.position.left)
      reserved.drag.column.g.select('line.left')
        .attr('x1', reserved.drag.position.left)
        .attr('x2', reserved.drag.position.left)
      reserved.drag.column.g.select('line.right')
        .attr('x1', reserved.drag.position.right)
        .attr('x2', reserved.drag.position.right)
      reserved.drag.column.g.select('rect.top')
        .attr('x', reserved.drag.position.left - 4)
        .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
      reserved.drag.column.g.select('rect.bottom')
        .attr('x', reserved.drag.position.left - 4)
        .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
    }
    function updateDragTimer (d) {
      reserved.drag.timer.g.attr('transform', 'translate(' + reserved.drag.position.left + ',' + (reserved.drag.box.h * 0.66) + ')')

      reserved.drag.timer.g.select('line#rightBar')
        .attr('x1', reserved.drag.position.width)
        .attr('x2', reserved.drag.position.width + 6)

      reserved.drag.timer.g.select('text.hourRight')
        .attr('x', reserved.drag.position.width + 18)
      reserved.drag.timer.g.select('text.minuteRight')
        .attr('x', reserved.drag.position.width + 34)
    }

    function hideBlockInfo (d) {
      if (!reserved.drag.g) return
      if (reserved.drag.locked) return

      reserved.drag.g.remove()
      reserved.drag = {}
      svgTargets.unhighlightTarget(d)
    }
    function showBlockInfo (d) {
      if (reserved.drag.g) return
      hideBlockInfo()
      // if (!reserved.hasData) return
      // if (reserved.drag.g) return
      svgTargets.highlightTarget(d)

      reserved.drag.g = reserved.main.g.append('g')
      // reserved.drag.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.drag.box.w)
      //   .attr('height', reserved.drag.box.h)
      //   .attr('fill', 'transparent')
      //   .style('pointer-events', 'none')
      reserved.drag.box = {
        x: box.focusOverlay.x,
        y: box.focusOverlay.y,
        w: box.focusOverlay.w,
        h: box.focusOverlay.h,
        marg: lenD.w[0] * 0.01
      }
      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}
      reserved.drag.timeScale = d3.scaleLinear()
        .range([0, reserved.drag.box.w])
        .domain([startTime.time, endTime.time])

      reserved.drag.position = {
        width: reserved.drag.timeScale(d.time.end) - reserved.drag.timeScale(d.time.start),
        left: reserved.drag.timeScale(d.time.start),
        right: reserved.drag.timeScale(d.time.end)
      }
      createDragColumn(d)
      // createDragBlock(d)
      createDragTimer(d)
    }

    function focusOnBlock (id) {
      let d = getBlockById(getBlocksData(), id).data
      showBlockInfo(d)
    }
    this.focusOnBlock = focusOnBlock
    function unfocusOnBlock (id) {
      let d = getBlockById(getBlocksData(), id).data
      hideBlockInfo(d)
    }
    this.unfocusOnBlock = unfocusOnBlock
    function overBlock (id) {
      if (shared.focus) unfocusOnBlock(shared.focus.id)
      let d = getBlockById(getBlocksData(), id).data
      showBlockInfo(d)
    }
    this.overBlock = overBlock
    function outBlock (id) {
      let d = getBlockById(getBlocksData(), id).data
      hideBlockInfo(d)
      if (shared.focus) focusOnBlock(shared.focus.id)
    }
    this.outBlock = outBlock

    function canDrag (d) {
      if (d.created) return true
      if (d.exeState.state === 'wait' || d.exeState.state === 'cancel') return true
      return false
      // if (d.time.end > Number(shared.data.server.timeOfNight.now) && d.time.start < Number(shared.data.server.timeOfNight.now)) return
      // if (d.time.end < Number(shared.data.server.timeOfNight.now)) return
    }
    function dragStart (d) {
      if (!canDrag(d)) return
      // reserved.drag.atLeastOneTick = false
      reserved.drag.mousecursor = d3.mouse(reserved.drag.g._groups[0][0])
      reserved.drag.offset = reserved.drag.mousecursor[0] - reserved.drag.position.left

      reserved.drag.mode = {}
      reserved.drag.mode.current = 'general'
      reserved.drag.mode.previous = 'general'
      reserved.drag.atLeastOneTick = false
      reserved.drag.locked = true
    }
    this.dragStart = dragStart
    function dragTick (d) {
      if (!canDrag(d)) return
      if (d.exeState.state === 'run') return

      reserved.drag.atLeastOneTick = true

      if (d3.event.dx < 0 &&
        Math.floor(reserved.drag.timeScale.invert(reserved.drag.position.left)) < Number(shared.data.server.timeOfNight.now)) return
      reserved.drag.position.left += d3.event.dx
      if (reserved.drag.position.left < 0) reserved.drag.position.left = 0
      if (reserved.drag.position.left + reserved.drag.position.width > reserved.drag.box.x + reserved.drag.box.w) {
        reserved.drag.position.left = reserved.drag.box.w - reserved.drag.position.width
      }

      reserved.drag.position.right = reserved.drag.position.left + reserved.drag.position.width

      reserved.drag.g.select('line.left')
        .attr('x1', reserved.drag.position.left)
        .attr('x2', reserved.drag.position.left)
      reserved.drag.g.select('line.right')
        .attr('x1', reserved.drag.position.right)
        .attr('x2', reserved.drag.position.right)
      // reserved.drag.g.select('g rect.modified')
      //   .attr('x', reserved.drag.position.left)
      reserved.drag.g.select('g text.modified')
        .attr('x', reserved.drag.position.left + reserved.drag.position.width * 0.5)
      reserved.drag.g.select('rect.area')
        .attr('x', reserved.drag.position.left)
      reserved.drag.g.select('rect.top')
        .attr('x', reserved.drag.position.left - 4)
      reserved.drag.g.select('rect.bottom')
        .attr('x', reserved.drag.position.left - 4)

      // reserved.drag.g.select('rect.timelineCursor')
      //   .attr('x', reserved.drag.position.left)
      reserved.drag.timer.g.attr('transform', function () {
        let t = reserved.drag.timer.g.attr('transform')
        t = t.split(',')
        t[0] = Number(t[0].split('(')[1])
        t[1] = Number(t[1].split(')')[0])
        return 'translate(' + Number(reserved.drag.g.select('line.left').attr('x1')) + ',' + t[1] + ')'
      })
      reserved.drag.timer.g.select('text.hourLeft').text(function () {
        let time = new Date(shared.data.server.timeOfNight.date_start)
        time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
        return d3.timeFormat('%H:')(time)
      })
      reserved.drag.timer.g.select('text.minuteLeft').text(function () {
        let time = new Date(shared.data.server.timeOfNight.date_start)
        time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
        return d3.timeFormat('%M')(time)
      })
      reserved.drag.timer.g.select('text.hourRight').text(function () {
        let time = new Date(shared.data.server.timeOfNight.date_start)
        time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
        return d3.timeFormat('%H:')(time)
      })
      reserved.drag.timer.g.select('text.minuteRight').text(function () {
        let time = new Date(shared.data.server.timeOfNight.date_start)
        time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
        return d3.timeFormat('%M')(time)
      })

      svgTargets.showPercentTarget({data: {targetId: d.targetId,
        startTime: reserved.drag.timeScale.invert(reserved.drag.position.left),
        endTime: reserved.drag.timeScale.invert(reserved.drag.position.right)}})
      svgTelsConflict.drawTelsAvailabilityCurve(d)

      d.time.start = Math.floor(reserved.drag.timeScale.invert(reserved.drag.position.left))
      d.time.end = d.time.start + d.time.duration
      svgBlocksQueueServer.update()
    }
    this.dragTick = dragTick
    function dragEnd (d) {
      reserved.drag.locked = false
      if (!reserved.drag.atLeastOneTick) return
      balanceBlocks(d)
      svgTelsConflict.drawTelsAvailabilityCurve(d)
      // listAllConflicts()
      // linkConflicts()
      changeBlockProperties(d, false, 'startTime')
      // if (!reserved.drag.atLeastOneTick) return
      // console.log('dragEnd')
      // d3.event.sourceEvent.stopPropagation()
      // if (d.endTime < Number(shared.data.server.timeOfNight.now)) return
      //
      // let newBlock = deepCopy(d)
      // if (reserved.drag.finalTime) {
      //   let t = (reserved.drag.finalTime.getTime() - (new Date(shared.data.server.timeOfNight.date_start)).getTime()) / 1000
      //   reserved.drag.position.left = reserved.drag.timeScale(t)
      // }
      // let newStart = Math.floor(reserved.drag.timeScale.invert(reserved.drag.position.left))
      // let modif = [{prop: 'startTime', old: newBlock.data.startTime, new: newStart}]
      //
      // // if (reserved.drag.mode.current === 'cancel') {
      // //   modif.push({prop: 'state', old: d.exeState.state, new: 'cancel'})
      // // }
      //
      // // blockQueue.saveModificationAndUpdateBlock(newBlock, modif)
      // // if (isGeneratingTelsConflict(newBlock)) {
      // //   com.data.modified.conflict.push(newBlock)
      // // } else {
      // //   com.data.modified.integrated.push(newBlock)
      // // }
      // if (reserved.drag.mode.previous === 'precision') {
      //   reserved.drag.timer.g.attr('transform', 'translate(' + reserved.drag.timeScale(newStart) + ',' + (reserved.drag.box.h * 0.49) + ')')
      //   reserved.drag.timer.g.select('text.hour')
      //     .transition()
      //     .duration(600)
      //     .text(function () {
      //       return d3.timeFormat('%H:')(reserved.drag.finalTime)
      //     })
      //     .attr('x', 15)
      //     .attr('y', 9)
      //     .style('font-weight', 'normal')
      //   reserved.drag.timer.g.select('text.minute')
      //     .transition()
      //     .duration(600)
      //     .text(function () {
      //       return d3.timeFormat('%M')(reserved.drag.finalTime)
      //     })
      //     .attr('x', 27)
      //     .attr('y', 9)
      //     .style('font-weight', 'normal').style('font-size', '10px')
      //   reserved.drag.timer.g.select('text.second')
      //     .transition()
      //     .duration(600)
      //     .style('font-size', '0px')
      //     .style('opacity', 0)
      //     .remove()
      //   reserved.drag.timer.g.select('rect.timelineOpacity')
      //     .transition()
      //     .duration(600)
      //     .attr('x', 0)
      //     .attr('width', 40)
      //     .attr('height', 10)
      //     .attr('fill-opacity', 0.9)
      //   reserved.drag.timer.g.select('g.hourMin')
      //     .attr('opacity', 1)
      //     .transition()
      //     .duration(600)
      //     .attr('opacity', 0)
      //     .on('end', function () {
      //       reserved.drag.timer.g.select('g.hourMin').remove()
      //     })
      //   delete reserved.drag.finalTime
      // }
      //
      // return {id: d.obId, modif: modif}

      // reserved.drag.oldG.select('rect.back')
      //   .style('fill-opacity', 0.1)
      //   .style('stroke-opacity', 0.1)
      //   .style('pointer-events', 'none')
      // reserved.drag.oldG.remove()
    }
    this.dragEnd = dragEnd
  }

  function balanceBlocks (block) {
    let idle
    function checkAndReplace (block1, block2, type) {
      let inter = block1.telescopes[type].ids.filter(value => block2.telescopes[type].ids.includes(value))
      for (let i = 0; i < inter.length; i++) {
        removeTelescopeFromBlock(block1, {id: inter[i]})
        if (idle[type].length > 0) addTelescopeToBlock(block1, idle[type].splice(0, 1)[0])
      }
    }

    if (block.telescopes.large.ids.length < block.telescopes.large.min &&
      block.telescopes.medium.ids.length < block.telescopes.medium.min &&
      block.telescopes.small.ids.length < block.telescopes.small.min) return // continue

    let cblocks = getBlocksByTime(getBlocksData(), block.time.start, block.time.end)
    idle = {
      large: shared.data.server.telHealth.filter(d => d.id.includes('L')).filter(function (d) {
        for (let i = 0; i < cblocks.length; i++) {
          if (cblocks[i].telescopes.large.ids.indexOf(d.id) !== -1) return false
        }
        return true
      }),
      medium: shared.data.server.telHealth.filter(d => d.id.includes('M')).filter(function (d) {
        for (let i = 0; i < cblocks.length; i++) {
          if (cblocks[i].telescopes.medium.ids.indexOf(d.id) !== -1) return false
        }
        return true
      }),
      small: shared.data.server.telHealth.filter(d => d.id.includes('S')).filter(function (d) {
        for (let i = 0; i < cblocks.length; i++) {
          if (cblocks[i].telescopes.small.ids.indexOf(d.id) !== -1) return false
        }
        return true
      })
    }
    let fcblocks = cblocks.filter(d => d.obId !== block.obId)

    for (let j = 0; j < fcblocks.length; j++) {
      checkAndReplace(block, fcblocks[j], 'large')
      checkAndReplace(block, fcblocks[j], 'medium')
      checkAndReplace(block, fcblocks[j], 'small')
    }
    balanceTelescopesBetweenBlocks(block, fcblocks)

    // if (block.telescopes.large.ids.length < block.telescopes.large.min) svgRightInfo.addConflict(cblocks)
    // else if (block.telescopes.medium.ids.length < block.telescopes.medium.min) svgRightInfo.addConflict(cblocks)
    // else if (block.telescopes.small.ids.length < block.telescopes.small.min) svgRightInfo.addConflict(cblocks)
    // }
  }

  let conflictFocused = {d: undefined, d3: undefined}
  let conflictSquare = []
  let conflictButton = []
  function linkConflicts () {
    // for (let i = conflictSquare.length - 1; i >= 0; i--) {
    // let linkedButton = []
    // for (let j = conflictButton.length - 1; j >= 0; j--) {
    //   if (conflictButton[j].d.large + conflictSquare[i].d.largeTels === 4 &&
    //     conflictButton[j].d.medium + conflictSquare[i].d.mediumTels === 25 &&
    //     conflictButton[j].d.small + conflictSquare[i].d.smallTels === 70) {
    //     linkedButton.push(conflictButton[j])
    //   }
    // }
    //   if (linkedButton.length > 0) {
    //     let linkedOther = []
    //     for (let j = conflictSquare.length - 1; j >= 0; j--) {
    //       if (i !== j && conflictSquare[i].d.id === conflictSquare[j].d.id) {
    //         linkedOther.push(conflictSquare[j])
    //       }
    //     }
    //     conflictSquare[i].d3
    //       .on('click', function () {
    //         svgRightInfo.focusOnConflict(linkedButton[0])
    //       })
    //       .on('mouseover', function (d) {
    //         d3.select(this).style('cursor', 'pointer')
    //         d3.select(this).attr('fill', d3.color('#000000').darker(0.9))
    //         for (let j = linkedButton.length - 1; j >= 0; j--) {
    //           if (linkedButton[j].d3) linkedButton[j].d3.select('rect').attr('fill', colorPalette.darkest.background)
    //           blockQueue.highlightBlocks(linkedButton[j].d.blocks)
    //         }
    //         for (let j = linkedOther.length - 1; j >= 0; j--) {
    //           linkedOther[j].d3.attr('fill', d3.color('#000000').darker(0.9))
    //         }
    //       })
    //       .on('mouseout', function (d) {
    //         d3.select(this).style('cursor', 'default')
    //         d3.select(this).attr('fill', '#FF5722')
    //         // for (let j = linkedButton.length - 1; j >= 0; j--) {
    //         //   if (conflictFocused.d === linkedButton[j].d) return
    //         // }
    //         for (let j = linkedButton.length - 1; j >= 0; j--) {
    //           if (linkedButton[j].d3) linkedButton[j].d3.select('rect').attr('fill', colorPalette.dark.background)
    //           blockQueue.highlightBlocks([])
    //         }
    //         for (let j = linkedOther.length - 1; j >= 0; j--) {
    //           linkedOther[j].d3.attr('fill', '#FF5722')
    //         }
    //       })
    //   } else {
    //     conflictSquare[i].d3
    //       .on('click', function () {})
    //       .on('mouseover', function (d) {})
    //       .on('mouseout', function (d) {})
    //     conflictSquare.splice(i, 1)
    //   }
    // }

    let azerty = []
    let totLinked = 0
    for (let j = conflictButton.length - 1; j >= 0; j--) {
      let linked = []
      for (let i = conflictSquare.length - 1; i >= 0; i--) {
        // let allIntersect = true
        // for (var z = 0; z < conflictButton[j].d.blocks.length; z++) {
        //   if (!blocksIntersect(conflictButton[j].d.blocks[z], {time: {start: conflictSquare[i].d.start, end: conflictSquare[i].d.end}})) allIntersect = false
        // }
        let intersect = conflictButton[j].d.blocks.filter(value => conflictSquare[i].d.blocks.includes(value.obId))
        if (intersect.length === conflictSquare[i].d.blocks.length) {
          linked.push(conflictSquare[i])
          azerty.push(conflictSquare[i])
          totLinked++
        }
        // if (allIntersect) linked.push(conflictSquare[i])
      }
      for (let i = 0; i < linked.length; i++) {
        linked[i].d3
          .on('click', function () {
            svgRightInfo.focusOnConflict(conflictButton[j])
          })
          .on('mouseover', function (d) {
            for (let j = 0; j < linked.length; j++) {
              linked[j].d3.attr('fill', d3.color('#000000').darker(0.9))
            }
            d3.select(this).style('cursor', 'pointer')
            if (conflictButton[j].d3) conflictButton[j].d3.select('rect').attr('fill', colorPalette.darkest.background)
            blockQueue.highlightBlocks(conflictButton[j].d.blocks)
            // d3.select(this).attr('fill', d3.color('#000000').darker(0.9))
            // for (let j = linkedButton.length - 1; j >= 0; j--) {
            //   if (linkedButton[j].d3) linkedButton[j].d3.select('rect').attr('fill', colorPalette.darkest.background)
            //   blockQueue.highlightBlocks(linkedButton[j].d.blocks)
            // }
            // for (let j = linkedOther.length - 1; j >= 0; j--) {
            //   linkedOther[j].d3.attr('fill', d3.color('#000000').darker(0.9))
            // }
          })
          .on('mouseout', function (d) {
            for (let j = 0; j < linked.length; j++) {
              linked[j].d3.attr('fill', '#FF5722')
            }
            d3.select(this).style('cursor', 'default')
            if (conflictButton[j].d3) conflictButton[j].d3.select('rect').attr('fill', colorPalette.darker.background)
            blockQueue.highlightBlocks([])
            // d3.select(this).attr('fill', '#FF5722')
            // for (let j = linkedButton.length - 1; j >= 0; j--) {
            //   if (conflictFocused.d === linkedButton[j].d) return
            // }
            // for (let j = linkedButton.length - 1; j >= 0; j--) {
            //   if (linkedButton[j].d3) linkedButton[j].d3.select('rect').attr('fill', colorPalette.dark.background)
            //   blockQueue.highlightBlocks([])
            // }
            // for (let j = linkedOther.length - 1; j >= 0; j--) {
            //   linkedOther[j].d3.attr('fill', '#FF5722')
            // }
          })
      }
      if (conflictButton[j].d3) {
        conflictButton[j].d3
          .on('mouseover', function (d) {
            d3.select(this)
              .style('cursor', 'pointer')
              .select('rect').attr('fill', colorPalette.darkest.background)
            blockQueue.highlightBlocks(conflictButton[j].d.blocks)
            for (let j = linked.length - 1; j >= 0; j--) {
              linked[j].d3.attr('fill', d3.color('#000000'))
            }
          })
          .on('mouseout', function (d) {
            d3.select(this).style('cursor', 'default')
            if (conflictFocused.d === conflictButton[j].d) return
            blockQueue.highlightBlocks([])
            d3.select(this).select('rect').attr('fill', colorPalette.darker.background)
            for (let j = linked.length - 1; j >= 0; j--) {
              linked[j].d3.attr('fill', '#FF5722')
            }
          })
      }
      // console.log(conflictButton, conflictSquare.filter(d => azerty.indexOf(d) === -1));
    }
  }
  function listAllConflicts (data) {
    let conflicts = []
    let allBlocks = []
    conflictButton = []
    //
    for (let key in getBlocksData()) {
      allBlocks = allBlocks.concat(getBlocksData()[key])
    }

    // function checkDuplicata (idg) {
    //   let ids = idg.split('|')
    //   for (let i = 0; i < conflicts.length; i++) {
    //     let cids = conflicts[i].id.split('|')
    //     let count = 0
    //     cids.map(function (d) {
    //       if (ids.indexOf(d) !== -1) count += 1
    //     })
    //     if (count === ids.length && count === cids.length) return true
    //   }
    //   return false
    // }
    // let blocks = clusterBlocksByTime(allBlocks)

    let filtered = data.filter(d => (d.smallTels < 0 || d.mediumTels < 0 || d.largeTels < 0))
    // for (let j = 0; j < filtered.length; j++) {
    //   for (let z = j + 1; z < filtered.length; z++) {
    //     let intersect = filtered[j].blocks.filter(value => filtered[z].blocks.includes(value))
    //     if (intersect.length === filtered[j].blocks.length) {
    //       filtered[j].blocks = filtered[z].blocks
    //       filtered.splice(z, 1)
    //       z--
    //       break
    //     } else if (intersect.length === filtered[z].blocks.length) {
    //       filtered.splice(z, 1)
    //       z--
    //       break
    //     }
    //   }
    // }
    for (let j = 0; j < filtered.length; j++) {
      let group = filtered[j]
      // let s = 0
      // let m = 0
      // let l = 0
      // let idg = ''
      // group.map(function (d) { idg += '|' + d.obId; l += d.telescopes.large.min; m += d.telescopes.medium.min; s += d.telescopes.small.min })
      // idg = idg.slice(1)
      // if (!checkDuplicata(idg)) {
      let blocks = group.blocks.map(d => allBlocks.filter(ab => ab.obId === d)[0])
      conflicts.push({id: group.id, blocks: blocks, small: 70 - group.smallTels, medium: 25 - group.mediumTels, large: 4 - group.largeTels})
      conflictButton.push({d: {id: group.id, blocks: blocks, small: 70 - group.smallTels, medium: 25 - group.mediumTels, large: 4 - group.largeTels}, d3: undefined})
      // }
    }

    shared.data.copy.conflicts = conflicts
    svgRightInfo.updateOverview()
    linkConflicts()

    updatePushonServer()
  }

  let SvgRightInfo = function () {
    let template = {
      tag: 'rightInfo',
      g: undefined,
      box: {x: 1, y: 1, w: 1, h: 1},
      debug: {
        enabled: false
      }
    }
    let reserved = template

    let titleSize = 11
    let headerSize = 10
    let txtSize = 9

    function initData (dataIn) {
      reserved.box = deepCopy(box.rightInfo)
      reserved.g = svg.g.append('g').attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      reserved.quickg = svg.g.append('g').attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      reserved.historyg = svg.g.append('g').attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      // reserved.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.box.w)
      //   .attr('height', reserved.box.h)
      //   .attr('fill', colorTheme.dark.background)
      createHistoryArrow()
      createQuickAccess()
      initOverview()
      updateOverview()
    }
    this.initData = initData
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

    function update () {
      updateOverview()
    }
    this.update = update

    function createHistoryArrow () {
      let box = {
        x: reserved.box.w * 0.092,
        y: 0,
        w: reserved.box.w * 0.2,
        h: reserved.box.h * 0.03
      }
      reserved.historyg.append('svg:image')
        .attr('xlink:href', '/static/icons/arrow-left.svg')
        .attr('x', box.x - box.w * 0.5)
        .attr('y', box.y)
        .attr('width', box.w * 0.5)
        .attr('height', box.h)
        .style('opacity', 0.5)
        // .style('pointer-events', 'none')
        .on('click', function () {
          if (shared.history.index === -1) return
          navigateHistory('backward')
        })
        .on('mouseover', function (d) {
          d3.select(this).style('cursor', 'pointer')
          d3.select(this).style('opacity', 1)
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          d3.select(this).style('opacity', 0.5)
        })
      reserved.historyg.append('svg:image')
        .attr('xlink:href', '/static/icons/arrow-right.svg')
        .attr('x', box.x)
        .attr('y', box.y)
        .attr('width', box.w * 0.5)
        .attr('height', box.h)
        .style('opacity', 0.5)
        // .style('pointer-events', 'none')
        .on('click', function () {
          if (shared.history.index === shared.history.list.length - 1) return
          navigateHistory('forward')
        })
        .on('mouseover', function (d) {
          d3.select(this).style('cursor', 'pointer')
          d3.select(this).style('opacity', 1)
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          d3.select(this).style('opacity', 0.5)
        })
    }

    function createQuickAccess () {
      let box = {
        icons: {
          x: reserved.box.w * 0.8,
          y: 0,
          w: reserved.box.w * 0.2,
          h: reserved.box.h * 0.12
        },
        mapping: {
          x: reserved.box.w * 0.0,
          y: 0,
          w: reserved.box.w * 0.9,
          h: reserved.box.h * 0.6
        }
      }
      let display
      let gback = reserved.quickg.append('g').attr('id', 'quickAccessBack')
      let gfore = reserved.quickg.append('g').attr('id', 'quickAccessFore')

      function cleanBack () {
        gback.selectAll('*').remove()
        reserved.g.attr('opacity', 1)
        reserved.historyg.attr('opacity', 1)
      }
      function createBlockMapping () {
        reserved.g.attr('opacity', 0.05)
        reserved.historyg.attr('opacity', 0)

        let scheds = []
        let inter = getSchedBlocksData()
        for (let key in inter) {
          inter[key].id = key
          scheds.push(inter[key])
        }

        let height = headerSize * 2.5
        let square = parseInt(Math.sqrt(scheds.length))
        square = 11 // square + (scheds.length % square === 0 ? 0 : 1)
        let marg = 0
        let origin = {
          x: box.mapping.x + box.mapping.w,
          y: box.mapping.y
        }

        function blockCore (blocks, g, offset, index) {
          let current = g
            .selectAll('g.block')
            .data(blocks, function (d) {
              return d.obId
            })
          let enter = current
            .enter()
            .append('g')
            .attr('class', 'block')
          enter.each(function (d, i) {
            let g = d3.select(this)
            let color = shared.style.blockCol(d)
            g.append('rect')
              .attr('x', 0)
              .attr('y', height * 0.1)
              .attr('width', height * 0.95)
              .attr('height', height * 0.8)
              .attr('fill', color.background)
              .attr('stroke', color.stroke)
              .attr('stroke-width', 0.1)
              .on('click', function () {
                cleanBack()
                display = undefined
                focusManager.focusOn('block', d.obId)
              })
              .on('mouseover', function (d) {
                d3.select(this).style('cursor', 'pointer')
                d3.select(this).attr('fill', d3.color(color.background).darker(0.9))
              })
              .on('mouseout', function (d) {
                d3.select(this).style('cursor', 'default')
                d3.select(this).attr('fill', color.background)
              })
            g.append('text')
              .text(d.metaData.nObs)
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('font-size', headerSize + 'px')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(' + (height * 0.5) + ',' + (height * 0.5 + txtSize * 0.3) + ')')
              .style('pointer-events', 'none')
          })
          let merge = current.merge(enter)
          merge.each(function (d, i) {
            let g = d3.select(this)
            let overflow = (index % square) + blocks.length > square ? square - ((index % square) + blocks.length) : 0
            g.attr('transform', 'translate(' + (height * (i + overflow)) + ',' + (offset) + ')')
          })
          current
            .exit()
            .transition('inOut')
            .duration(timeD.animArc)
            .style('opacity', 0)
            .remove()
          // offsetY += line * 1
        }
        function schedCore (scheds, g, offset) {
          let current = g
            .selectAll('g.sched')
            .data(scheds, function (d) {
              return d.id
            })
          let enter = current
            .enter()
            .append('g')
            .attr('class', 'sched')
          enter.each(function (d, i) {
            let g = d3.select(this)
            let dimPoly = height * 0.9
            let poly = [
              {x: dimPoly * 0.3, y: dimPoly * 0.0},
              {x: dimPoly * 0.7, y: dimPoly * 0.0},

              {x: dimPoly * 1, y: dimPoly * 0.3},
              {x: dimPoly * 1, y: dimPoly * 0.7},

              {x: dimPoly * 0.7, y: dimPoly * 1},
              {x: dimPoly * 0.3, y: dimPoly * 1},

              {x: dimPoly * 0.0, y: dimPoly * 0.7},
              {x: dimPoly * 0.0, y: dimPoly * 0.3}
            ]
            g.selectAll('polygon')
              .data([poly])
              .enter()
              .append('polygon')
              .attr('points', function (d) {
                return d.map(function (d) {
                  return [d.x, d.y].join(',')
                }).join(' ')
              })
              .attr('fill', colorTheme.dark.background)
              .attr('stroke', colorTheme.dark.stroke)
              .attr('stroke-width', 0.6)
              .on('click', function () {
                cleanBack()
                display = undefined
                focusManager.focusOn('schedBlock', d.id)
              })
              .on('mouseover', function () {
                gback.select('g#blocks').remove()
                let gb = g.append('g').attr('id', 'blocks')
                // let overflow = (i % square) + d.blocks.length > square ? square - ((i % square) + d.blocks.length) : 0
                // gb.append('rect')
                //   .attr('x', overflow * height)
                //   .attr('y', height * 0.75)
                //   .attr('width', d.blocks.length * height)
                //   .attr('height', height * 1.25)
                blockCore(d.blocks, gb, height, i)
                d3.select(this).style('cursor', 'pointer')
                d3.select(this).attr('fill', colorTheme.darker.background)
              })
              .on('mouseout', function () {
                // g.select('g#blocks').remove()
                d3.select(this).style('cursor', 'default')
                d3.select(this).attr('fill', colorTheme.dark.background)
              })
            g.append('text')
              .text('S' + d.blocks[0].metaData.nSched)
              .style('fill', colorTheme.dark.text)
              .style('font-weight', 'bold')
              .style('font-size', titleSize + 'px')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(' + (dimPoly * 0.5) + ',' + (dimPoly * 0.5 + txtSize * 0.33) + ')')
              .style('pointer-events', 'none')
          })
          let merge = current.merge(enter)
          merge.each(function (d, i) {
            let g = d3.select(this)
            let line = parseInt(i / square) * 2
            let column = square - (i % square)
            g.attr('transform', 'translate(' + (origin.x - ((height + marg) * column) + (marg * 0.5)) + ',' + (offset + origin.y + (marg * 1) + ((height + marg) * line)) + ')')
            // innerOffset += line
            // blockCore(d.blocks, g, 0)
          })
          current
            .exit()
            .transition('inOut')
            .duration(timeD.animArc)
            .style('opacity', 0)
            .remove()
        }
        schedCore(scheds, gback, txtSize)
      }
      function createTargetsMapping () {
        reserved.g.attr('opacity', 0.05)
        reserved.historyg.attr('opacity', 0)

        let height = headerSize * 3
        let square = parseInt(Math.sqrt(shared.data.server.targets.length))
        square = 8 // square + (shared.data.server.targets.length % square === 0 ? 0 : 1)
        let marg = txtSize
        let origin = {
          x: box.mapping.x + box.mapping.w,
          y: box.mapping.y
        }

        let targets = gback
          .selectAll('g.target')
          .data(shared.data.server.targets, function (d) {
            return d.id
          })
        let enter = targets
          .enter()
          .append('g')
          .attr('class', 'target')
        enter.each(function (d, i) {
          let g = d3.select(this)
          g.attr('opacity', 0).transition().delay(0).duration(200).attr('opacity', 1)
          g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', height)
            .attr('height', height)
            .attr('fill', colorTheme.dark.background)
            .attr('stroke', colorTheme.medium.stroke)
            .attr('stroke-width', 0.6)
            // .style('boxShadow', '10px 20px 30px black')
            .attr('rx', height)
            .on('click', function () {
              cleanBack()
              display = undefined
              focusManager.focusOn('target', d.id)
            })
            .on('mouseover', function (d) {
              d3.select(this).style('cursor', 'pointer')
              d3.select(this).attr('fill', colorTheme.darker.background)
            })
            .on('mouseout', function (d) {
              d3.select(this).style('cursor', 'default')
              d3.select(this).attr('fill', colorTheme.dark.background)
            })
          g.append('svg:image')
            .attr('xlink:href', '/static/icons/round-target.svg')
            .attr('width', height * 1)
            .attr('height', height * 1)
            .attr('x', height * 0.0)
            .attr('y', height * 0.5 - height * 0.5)
            .style('opacity', 0.5)
            .style('pointer-events', 'none')
          g.append('text')
            .text('T' + d.name.split('_')[1])
            .attr('x', height * 0.5)
            .attr('y', height * 0.5 + txtSize * 0.3)
            .style('font-weight', '')
            .attr('text-anchor', 'middle')
            .style('font-size', headerSize + 'px')
            .attr('dy', 0)
            .style('pointer-events', 'none')
            .attr('fill', colorTheme.dark.text)
            .attr('stroke', 'none')
        })
        let merge = enter.merge(targets)
        merge.each(function (d, i) {
          let g = d3.select(this)
          let line = parseInt(i / square)
          let column = square - (i % square)
          g.attr('transform', 'translate(' + (origin.x - ((height + marg * 0.5) * column) + (marg * 0)) + ',' + (origin.y + (marg * 1) + ((height + marg * 0.5) * line)) + ')')
        })
        targets
          .exit()
          .transition('inOut')
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()
      }
      function createTelescopesMapping () {
        reserved.g.attr('opacity', 0.1)
        reserved.historyg.attr('opacity', 0)

        let xx = box.mapping.w * 0.05
        let ww = box.mapping.w * 0.95
        let largeBox = {
          x: xx,
          y: 0,
          w: ww * 0.1,
          h: box.mapping.h
        }
        let mediumBox = {
          x: xx + ww * 0.13,
          y: 0,
          w: ww * 0.3,
          h: box.mapping.h
        }
        let smallBox = {
          x: xx + ww * 0.45,
          y: 0,
          w: ww * 0.54,
          h: box.mapping.h
        }
        let gt = gback.append('g')
          .attr('id', 'telsMapping')
          .attr('transform', 'translate(' + box.mapping.x + ',' + box.mapping.y + ')')
        let telescopeRunning = new TelescopeDisplayer({
          main: {
            tag: 'telescopeMapping',
            g: gt,
            scroll: {},
            box: box.mapping,
            background: {
              fill: 'none',
              stroke: '#000000',
              strokeWidth: 0
            },
            isSouth: isSouth,
            colorTheme: colorTheme
          },

          displayer: 'gridBib',
          gridBib: {
            header: {
              text: {
                size: 9,
                color: colorTheme.medium.background
              },
              background: {
                height: 10,
                color: colorTheme.dark.stroke
              }
            },
            telescope: {
              enabled: true,
              centering: false,
              large: {
                g: undefined,
                opt: {
                  telsPerRow: 1,
                  nbl: 0,
                  size: 1.4,
                  ratio: 1
                },
                box: largeBox
              },
              medium: {
                g: undefined,
                opt: {
                  telsPerRow: 3,
                  nbl: 0,
                  size: 0.9,
                  ratio: 1
                },
                box: mediumBox
              },
              small: {
                g: undefined,
                opt: {
                  telsPerRow: 6,
                  nbl: 0,
                  size: 0.84,
                  ratio: 1
                },
                box: smallBox
              }
            },
            idle: {
              txtSize: 0,
              enabled: true,
              background: {
                middle: {
                  color: 'none',
                  opacity: 0
                },
                side: {
                  color: 'none',
                  opacity: 0
                }
              }
            },
            blocks: {
              txtSize: 0,
              right: {
                enabled: false
              },
              left: {
                enabled: false
              }
            }
          },

          filters: {
            telescopeFilters: [],
            filtering: []
          },
          data: {
            raw: {
              telescopes: shared.data.server.telHealth,
              blocks: [] // shared.data.server.blocks.run
            },
            filtered: {},
            modified: []
          },
          debug: {
            enabled: false
          },
          pattern: {
            select: {}
          },
          events: {
            block: {
              click: (d) => {},
              mouseover: (d) => {},
              mouseout: (d) => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            telescope: {
              click: (d) => { cleanBack(); display = undefined; focusManager.focusOn('telescope', d.id) },
              mouseover: (d) => {},
              mouseout: (d) => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            }
          },
          input: {
            over: {
              telescope: undefined
            },
            focus: {
              telescope: undefined
            }
          }
        })
        telescopeRunning.init()
        telescopeRunning.updateData({
          data: {
            raw: {
              telescopes: shared.data.server.telHealth,
              blocks: [] // shared.data.server.blocks.run
            },
            modified: []
          }
        })
      }

      createD3Node(gfore,
        'rect',
        {'x': box.icons.x + box.icons.w * 0.6,
          'y': box.icons.y + box.icons.h * 0.025,
          'width': box.icons.w * 0.3,
          height: box.icons.h * 0.3,
          fill: colorTheme.dark.background,
          stroke: colorTheme.dark.stroke,
          'stroke-width': 0.2,
          'rx': 2
        }
      ).on('click', function () {
        if (display) {
          cleanBack()
          if (display === 'blocks') {
            display = undefined
            return
          }
        }
        display = 'blocks'
        createBlockMapping()
      }).on('mouseover', function () {
        d3.select(this).attr('fill', colorTheme.darker.background)
      }).on('mouseout', function () {
        d3.select(this).attr('fill', colorTheme.dark.background)
      })
      createD3Node(gfore,
        'svg:image',
        {'x': box.icons.x + box.icons.w * 0.65,
          'y': box.icons.y + box.icons.h * 0.075,
          'width': box.icons.w * 0.2,
          height: box.icons.h * 0.2,
          'xlink:href': '/static/icons/blocks.svg'
        },
        {'pointer-events': 'none', opacity: 0.6}
      )

      createD3Node(gfore,
        'rect',
        {'x': box.icons.x + box.icons.w * 0.6,
          'y': box.icons.y + box.icons.h * 0.35,
          'width': box.icons.w * 0.3,
          height: box.icons.h * 0.3,
          fill: colorTheme.dark.background,
          stroke: colorTheme.dark.stroke,
          'stroke-width': 0.2,
          'rx': 2
        }
      ).on('click', function () {
        if (display) {
          cleanBack()
          if (display === 'targets') {
            display = undefined
            return
          }
        }
        display = 'targets'
        createTargetsMapping()
      }).on('mouseover', function () {
        d3.select(this).attr('fill', colorTheme.darker.background)
      }).on('mouseout', function () {
        d3.select(this).attr('fill', colorTheme.dark.background)
      })
      createD3Node(gfore,
        'svg:image',
        {'x': box.icons.x + box.icons.w * 0.65,
          'y': box.icons.y + box.icons.h * 0.4,
          'width': box.icons.w * 0.2,
          height: box.icons.h * 0.2,
          'xlink:href': '/static/icons/target.svg'
        },
        {'pointer-events': 'none', opacity: 0.6}
      )

      createD3Node(gfore,
        'rect',
        {'x': box.icons.x + box.icons.w * 0.6,
          'y': box.icons.y + box.icons.h * 0.675,
          'width': box.icons.w * 0.3,
          height: box.icons.h * 0.3,
          fill: colorTheme.dark.background,
          stroke: colorTheme.dark.stroke,
          'stroke-width': 0.2,
          'rx': 2
        }
      ).on('click', function () {
        if (display) {
          cleanBack()
          if (display === 'telescopes') {
            display = undefined
            return
          }
        }
        display = 'telescopes'
        createTelescopesMapping()
      }).on('mouseover', function () {
        d3.select(this).attr('fill', colorTheme.darker.background)
      }).on('mouseout', function () {
        d3.select(this).attr('fill', colorTheme.dark.background)
      })
      createD3Node(gfore,
        'svg:image',
        {'x': box.icons.x + box.icons.w * 0.65,
          'y': box.icons.y + box.icons.h * 0.725,
          'width': box.icons.w * 0.2,
          height: box.icons.h * 0.2,
          'xlink:href': '/static/icons/telescope.svg'
        },
        {'pointer-events': 'none', opacity: 0.6}
      )
    }

    let allBox

    function initOverview () {
      reserved.overview = {
        modifications: {},
        conflicts: {}
      }
      allBox = {
        blocks: {
          x: 0,
          y: 0,
          w: reserved.box.w * 0.8,
          h: reserved.box.h * 0.2
        },
        modifications: {
          x: 0,
          y: reserved.box.h * 0.125,
          h: reserved.box.h * 0.75,
          w: reserved.box.w
        },
        conflicts: {
          x: 0,
          y: reserved.box.h * 0.9,
          w: reserved.box.w,
          h: reserved.box.h * 0.1
        }
      }
      function createModificationsInformation () {
        let box = allBox.modifications
        let g = reserved.g.append('g')
          .attr('id', 'modificationsInformation')
          .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
        box.y = 0
        g.append('text')
          .text('Modifications')
          .attr('x', box.w * 0.01)
          .attr('y', box.y)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'start')
          .style('font-size', titleSize + 'px')
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.dark.text)
          .attr('stroke', 'none')
        box.y += 2
        g.append('line')
          .attr('x1', 0)
          .attr('y1', box.y)
          .attr('x2', reserved.box.w)
          .attr('y2', box.y)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
        g.append('rect')
          .attr('id', 'headerStrip')
          .attr('x', 0)
          .attr('y', box.y)
          .attr('width', box.w)
          .attr('height', headerSize)
          .attr('fill', colorTheme.dark.stroke)
        let label = [
          {x: box.w * 0.0, y: box.y + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.13, text: 'Scheds'},
          {x: box.w * 0.13, y: box.y + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.13, text: 'Blocks'},
          {x: box.w * (0.26 + 0.185 * 0), y: box.y + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.185, text: 'State'},
          {x: box.w * (0.26 + 0.185 * 1), y: box.y + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.185, text: 'Scheduled'},
          {x: box.w * (0.26 + 0.185 * 2), y: box.y + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.185, text: 'Pointing'},
          {x: box.w * (0.26 + 0.185 * 3), y: box.y + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.185, text: 'Telescope'}
        ]
        for (let i = 0; i < label.length; i++) {
          g.append('text')
            .text(label[i].text)
            .style('fill', colorTheme.medium.background)
            .style('font-weight', 'bold')
            .style('font-size', txtSize + 'px')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (label[i].x) + ',' + (label[i].y) + ')')
        }

        box.y += 10
        box.h -= 16
        let scrollg = g.append('g')
          .attr('id', 'modificationsInformation')
          .attr('transform', 'translate(' + 0 + ',' + box.y + ')')
        reserved.overview.modifications.scrollBox = initScrollBox('modificationsListScroll', scrollg, box, {enabled: false}, true)
      }
      function createConflictsInformation () {
        let box = allBox.conflicts
        let g = reserved.g.append('g')
          .attr('id', 'conflictsInformation')
          .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
        box.y = 0
        g.append('text')
          .text('Conflicts')
          .attr('x', box.w * 0.01)
          .attr('y', box.y)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'start')
          .style('font-size', titleSize + 'px')
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.dark.text)
          .attr('stroke', 'none')
        box.y += 2
        g.append('line')
          .attr('x1', 0)
          .attr('y1', box.y)
          .attr('x2', reserved.box.w)
          .attr('y2', box.y)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
        let line = 38
        let marg = 4
        g.append('rect')
          .attr('x', marg)
          .attr('y', marg)
          .attr('width', line)
          .attr('height', line)
          .attr('open', false)
          .attr('fill', colorPalette.dark.background)
          .attr('stroke', colorPalette.dark.stroke)
          .attr('stroke-width', 0.1)
          .style('opacity', 0.2)
        g.append('text')
          .text('Obs')
          .attr('x', marg + line * 0.5)
          .attr('y', marg + line * 0.3 + titleSize * 0.33)
          .style('font-weight', '')
          .attr('text-anchor', 'middle')
          .style('font-size', titleSize + 'px')
          .style('pointer-events', 'none')
          .attr('fill', colorPalette.dark.text)
          .attr('stroke', 'none')
          .style('opacity', 0.2)
        g.append('text')
          .text('L M S')
          .attr('x', marg + line * 0.5)
          .attr('y', marg + line * 0.66 + titleSize * 0.33)
          .style('font-weight', '')
          .attr('text-anchor', 'middle')
          .style('font-size', headerSize + 'px')
          .style('pointer-events', 'none')
          .attr('fill', colorPalette.dark.text)
          .attr('stroke', 'none')
          .style('opacity', 0.2)

        reserved.overview.conflicts.scrollBox = initScrollBox('conflictListScroll', g, box, {enabled: false}, false)
      }

      createModificationsInformation()
      createConflictsInformation()
    }

    function openOtherBlocks (conflict) {
      allBox = {
        blocks: {
          x: 0,
          y: 0,
          w: reserved.box.w * 0.8,
          h: reserved.box.h * 0.2
        },
        modifications: {
          x: 0,
          y: reserved.box.h * 0.125,
          h: reserved.box.h * 0.42,
          w: reserved.box.w
        },
        conflicts: {
          x: 0,
          y: reserved.box.h * 0.62,
          w: reserved.box.w,
          h: reserved.box.h * 0.37
        }
      }
      reserved.g.select('g#conflictsInformation').select('g#otherg').remove()
      // svgEventsQueueServer.blurry()
      // svgBlocksQueueServer.blurry()
      // svgBrush.blurry()
      // svgTargets.blurry()
      // svgTelsConflict.blurry()
      // svgFocusOverlay.blurry()

      let allTel = shared.data.server.telHealth
      let innerOtherBlock = {}
      let box = {
        x: 0,
        y: -6,
        w: allBox.conflicts.w,
        h: allBox.modifications.h * 1.4 + 70
      }
      let otherg = reserved.g.select('g#conflictsInformation').append('g').attr('id', 'otherg')
        .attr('transform', 'translate(' + 0 + ',' + (-allBox.modifications.h * 1.75) + ')')
      otherg.append('rect')
        .attr('id', 'background')
        .attr('x', box.x)
        .attr('y', box.y)
        .attr('width', box.w)
        .attr('height', box.h)
        .attr('fill', colorPalette.bright.background)
      let scroll = initScrollBox('focusedConflictListScroll', otherg, box, {enabled: false}, true)
      function initTelescopeInformation (block, box) {
        innerOtherBlock[block.obId] = {}
        let g = scroll.get('innerG').append('g')
          .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        // g.append('rect')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('width', box.w)
        //   .attr('height', box.h)
        //   .attr('fill', colorPalette.dark.background)
        //   .attr('stroke', colorPalette.dark.stroke)
        //   .attr('stroke-width', 0.2)

        innerOtherBlock[block.obId].g = g
        box.y = 0
        box.x = 45
        g.append('text')
          .text(block.metaData.blockName)
          .attr('x', box.x)
          .attr('y', box.y + titleSize * 1.5)
          .style('font-weight', 'bold')
          .attr('text-anchor', 'end')
          .style('font-size', titleSize + 'px')
          .style('pointer-events', 'none')
          .attr('fill', colorPalette.dark.text)
          .attr('stroke', 'none')
        box.x = 50
        box.w -= 60
        box.y = 4
        let largeBox = {
          x: 0,
          y: 0,
          w: box.w * 0.16,
          h: box.h
        }
        let mediumBox = {
          x: box.w * 0.16,
          y: 0,
          w: box.w * 0.35,
          h: box.h
        }
        let smallBox = {
          x: box.w * 0.51,
          y: 0,
          w: box.w * 0.49,
          h: box.h
        }
        box.h -= titleSize * 2
        let gt = g.append('g')
          .attr('id', 'telsDisplayer')
          .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        console.log(('BOX', box));
        innerOtherBlock[block.obId].displayer = new TelescopeDisplayer({
          main: {
            tag: 'telescopeRootTag' + block.obId,
            g: gt,
            scroll: {},
            box: box,
            background: {
              fill: colorPalette.medium.background,
              stroke: colorPalette.medium.stroke,
              strokeWidth: 0.1
            },
            isSouth: true,
            colorPalette: colorPalette
          },

          displayer: 'gridBib',
          gridBib: {
            header: {
              top: true,
              text: {
                size: 0, //headerSize,
                color: colorPalette.medium.background
              },
              background: {
                height: 0, //headerSize + 2,
                color: colorPalette.dark.stroke
              }
            },
            telescope: {
              enabled: true,
              centering: true,
              large: {
                g: undefined,
                opt: {
                  telsPerRow: 3,
                  nbl: 0,
                  size: 2,
                  ratio: 1
                },
                box: largeBox
              },
              medium: {
                g: undefined,
                opt: {
                  telsPerRow: 10,
                  nbl: 0,
                  size: 1,
                  ratio: 1
                },
                box: mediumBox
              },
              small: {
                g: undefined,
                opt: {
                  telsPerRow: 18,
                  nbl: 0,
                  size: 0.5,
                  ratio: 1
                },
                box: smallBox
              }
            },
            idle: {
              txtSize: 0,
              enabled: true,
              background: {
                middle: {
                  color: colorPalette.darker.background,
                  opacity: 1
                },
                side: {
                  color: colorPalette.darker.background,
                  opacity: 1
                }
              }
            },
            blocks: {
              txtSize: 10,
              right: {
                enabled: false
              },
              left: {
                enabled: true
              },
              background: {
                middle: {
                  color: colorPalette.darkest.background,
                  opacity: 0.3
                },
                side: {
                  color: colorPalette.darker.background,
                  opacity: 1
                }
              }
            }
          },

          filters: {
            telescopeFilters: [],
            filtering: []
          },
          data: {
            raw: {
              telescopes: []
            },
            filtered: {},
            modified: []
          },
          debug: {
            enabled: false
          },
          pattern: {
            select: {}
          },
          events: {
            block: {
              click: (d) => {}, // com.telescope.events.click('block', d.obId) },
              mouseover: (d) => {},
              mouseout: (d) => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            telescope: {
              click: (d) => {},
              mouseover: (d) => {},
              mouseout: (d) => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            other: {
              delTel: (d) => {}, // removeTel(d) },
              switchTel: (elem, t) => {} // switchTel(elem, t) }
            }
          },
          interaction: {
            delete: {
              enabled: false,
              event: () => {}
            },
            drag: {
              enabled: false,
              event: () => {}
            },
            switch: {
              enabled: false,
              event: () => {}
            }
          }
        })
        innerOtherBlock[block.obId].displayer.init()

        function changeOtherTelescopeNumber (type, d) {
          let data = block.telescopes[type]
          function errorInTelescopeNumber () {

          }
          function decreaseMinimumTelsNumber () {
            data.min = Number(d)
            for (let i = data.min; i < data.ids.length; i++) {
              let t = data.ids[0]
              forceExtractTelsFromBlock([block], t)
              // addTelescopeToBlock(com.data.block, {id: t})
            }
          }
          function increaseMinimumTelsNumber () {
            data.min = Number(d)
            if (data.min < data.ids.length) {
              return
            } else {
              let diff = d - data.ids.length
              let allTelCopy = allTel.filter(function (d) {
                return (type === 'large' ? d.id.includes('L') : (type === 'medium' ? d.id.includes('M') : d.id.includes('S')))
              })
              let idle = allTelCopy.filter(function (d) {
                for (let i = 0; i < conflict.blocks.length; i++) {
                  if (conflict.blocks[i].telescopes[type].ids.indexOf(d.id) !== -1) return false
                }
                return true
              })
              for (let i = 0; (i < diff && i < idle.length); i++) {
                addTelescopeToBlock(block, idle[i])
              }
              for (let i = data.ids.length; i < data.min; i++) {
                let t = extractRandomTelsFromBlock(conflict.blocks.filter(d => d.obId !== block.obId), type)
                if (t === undefined) break
                addTelescopeToBlock(block, {id: t})
              }
            }
          }
          if (data.min < d) increaseMinimumTelsNumber()
          if (data.min > d) decreaseMinimumTelsNumber()

          if (data.ids.length < data.min) {
            errorInTelescopeNumber()
          }

          for (let i = 0; i < conflict.blocks.length; i++) {
            innerOtherBlock[conflict.blocks[i].obId].updateOtherInput()
            innerOtherBlock[conflict.blocks[i].obId].updateOtherTelescopeInformation()
          }
          updateTotals()
          svgTelsConflict.drawTelsAvailabilityCurve()
          // linkConflicts()
          // updateInput()
          // updateTelescopeInformation()
        }
        innerOtherBlock[block.obId].updateOtherInput = function () {
          innerOtherBlock[block.obId].tels.large.property('value', function () {
            return block.telescopes.large.min
          })
          innerOtherBlock[block.obId].tels.medium.property('value', function () {
            return block.telescopes.medium.min
          })
          innerOtherBlock[block.obId].tels.small.property('value', function () {
            return block.telescopes.small.min
          })
        }
        innerOtherBlock[block.obId].updateOtherTelescopeInformation = function () {
          let tels = []
          for (let i = 0; i < block.telescopes.large.ids.length; i++) {
            tels.push({id: block.telescopes.large.ids[i], health: allTel.find(x => x.id === block.telescopes.large.ids[i]).val})
          }
          for (let i = 0; i < block.telescopes.medium.ids.length; i++) {
            tels.push({id: block.telescopes.medium.ids[i], health: allTel.find(x => x.id === block.telescopes.medium.ids[i]).val})
          }
          for (let i = 0; i < block.telescopes.small.ids.length; i++) {
            tels.push({id: block.telescopes.small.ids[i], health: allTel.find(x => x.id === block.telescopes.small.ids[i]).val})
          }
          innerOtherBlock[block.obId].displayer.updateData({
            data: {
              raw: {
                telescopes: tels,
                blocks: block
              },
              modified: []
            }
          })
        }

        innerOtherBlock[block.obId].tels = {}
        innerOtherBlock[block.obId].tels.large = inputNumber(g,
          {x: box.x + 2, y: (box.y + box.h + 1), w: 40, h: 15},
          'large',
          {disabled: false, value: block.telescopes.large.min, min: 0, max: block.telescopes.large.max, step: 1},
          {change: (d) => { changeOtherTelescopeNumber('large', d) }, enter: (d) => { changeOtherTelescopeNumber('large', d) }})
        innerOtherBlock[block.obId].tels.medium = inputNumber(g,
          {x: box.x + (5 + mediumBox.x + mediumBox.w * 0.5 - 20), y: (box.y + box.h + 1), w: 40, h: 15},
          'small',
          {disabled: false, value: block.telescopes.medium.min, min: 0, max: block.telescopes.medium.max, step: 1},
          {change: (d) => { changeOtherTelescopeNumber('medium', d) }, enter: (d) => { changeOtherTelescopeNumber('medium', d) }})
        innerOtherBlock[block.obId].tels.small = inputNumber(g,
          {x: box.x + (smallBox.x + smallBox.w * 0.5 - 25), y: (box.y + box.h + 1), w: 40, h: 15},
          'small',
          {disabled: false, value: block.telescopes.small.min, min: 0, max: block.telescopes.small.max, step: 1},
          {change: (d) => { changeOtherTelescopeNumber('small', d) }, enter: (d) => { changeOtherTelescopeNumber('small', d) }})
        innerOtherBlock[block.obId].updateOtherTelescopeInformation()
      }
      let sizeRow = (allBox.modifications.h * 1.5) / 6
      for (let i = 0; i < conflict.blocks.length; i++) {
        let ibox = {
          x: 0,
          y: sizeRow * i + (conflict.blocks.length < 6 ? (sizeRow * (5.5 - conflict.blocks.length)) : 0),
          w: allBox.conflicts.w * 1,
          h: sizeRow
        }
        initTelescopeInformation(conflict.blocks[i], ibox)
      }
      scroll.resetVerticalScroller({canScroll: true, scrollHeight: sizeRow * conflict.blocks.length})

      otherg.append('line')
        .attr('x1', 0)
        .attr('y1', allBox.modifications.h * 1.4)
        .attr('x2', box.w)
        .attr('y2', allBox.modifications.h * 1.4)
        .attr('stroke', colorPalette.dark.stroke)
        .attr('stroke-width', 0.4)
      otherg.append('rect')
        .attr('id', 'isbalanced')
        .attr('x', 0)
        .attr('y', allBox.modifications.h * 1.4)
        .attr('width', box.w)
        .attr('height', allBox.modifications.h * 0.2)
        .attr('fill', function () {
          return  '#FFCCBC'
        })
      otherg.append('text')
        .text('Totals:')
        .attr('x', box.w * 0.12)
        .attr('y', allBox.modifications.h * 1.5)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .style('font-size', titleSize + 'px')
        .style('pointer-events', 'none')
        .attr('fill', colorPalette.dark.text)
        .attr('stroke', 'none')
      otherg.append('text')
        .attr('id', 'totalLarge')
        .text(conflict.blocks.reduce((accumulator, currentValue) => accumulator + currentValue.telescopes.large.min, 0))
        .attr('x', box.w * 0.23)
        .attr('y', allBox.modifications.h * 1.5)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .style('font-size', titleSize + 'px')
        .style('pointer-events', 'none')
        .attr('fill', colorPalette.dark.text)
        .attr('stroke', 'none')
      otherg.append('text')
        .attr('id', 'totalMedium')
        .text(conflict.blocks.reduce((accumulator, currentValue) => accumulator + currentValue.telescopes.medium.min, 0))
        .attr('x', box.w * 0.45)
        .attr('y', allBox.modifications.h * 1.5)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .style('font-size', titleSize + 'px')
        .style('pointer-events', 'none')
        .attr('fill', colorPalette.dark.text)
        .attr('stroke', 'none')
      otherg.append('text')
        .attr('id', 'totalSmall')
        .text(conflict.blocks.reduce((accumulator, currentValue) => accumulator + currentValue.telescopes.small.min, 0))
        .attr('x', box.w * 0.78)
        .attr('y', allBox.modifications.h * 1.5)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .style('font-size', titleSize + 'px')
        .style('pointer-events', 'none')
        .attr('fill', colorPalette.dark.text)
        .attr('stroke', 'none')

      otherg.append('text')
        .text('/4')
        .attr('x', box.w * 0.27)
        .attr('y', allBox.modifications.h * 1.54)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .style('font-size', titleSize + 'px')
        .style('pointer-events', 'none')
        .attr('fill', colorPalette.dark.text)
        .attr('stroke', 'none')
      otherg.append('text')
        .text('/25')
        .attr('x', box.w * 0.5)
        .attr('y', allBox.modifications.h * 1.54)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .style('font-size', titleSize + 'px')
        .style('pointer-events', 'none')
        .attr('fill', colorPalette.dark.text)
        .attr('stroke', 'none')
      otherg.append('text')
        .text('/70')
        .attr('x', box.w * 0.84)
        .attr('y', allBox.modifications.h * 1.54)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .style('font-size', titleSize + 'px')
        .style('pointer-events', 'none')
        .attr('fill', colorPalette.dark.text)
        .attr('stroke', 'none')

      otherg.append('rect')
        .attr('id', 'validateConflict')
        .attr('x', box.w - 24)
        .attr('y', allBox.modifications.h * 1.4 + (allBox.modifications.h * 0.2 - 20) * 0.5)
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', colorPalette.darker.background)
        .attr('stroke', colorPalette.darker.stroke)
        .attr('stroke-width', 0.1)
        .style('opacity', 0)
        .on('click', function () {
          for (let i = 0; i < conflict.blocks.length; i++) {
            reassignTelescope(conflict.blocks[i])
          }
          blockQueue.highlightBlocks([])
          closeOtherBlocks()
          svgTelsConflict.drawTelsAvailabilityCurve()
          // listAllConflicts()
          linkConflicts()
        })
        .on('mouseover', function () {
          d3.select(this).attr('fill', colorPalette.darkest.background)
        })
        .on('mouseout', function (d) {
          d3.select(this).attr('fill', colorPalette.darker.background)
        })
      otherg.append('image')
        .attr('id', 'checkedConflict')
        .attr('xlink:href', '/static/icons/checked.svg')
        .attr('x', box.w - 20)
        .attr('y', allBox.modifications.h * 1.4 + (allBox.modifications.h * 0.2 - 20) * 0.5 + 4)
        .attr('width', 12)
        .attr('height', 12)
        .style('opacity', 0)
        .style('pointer-events', 'none')
      function updateTotals () {
        let l = conflict.blocks.reduce((accumulator, currentValue) => accumulator + Number(currentValue.telescopes.large.min), 0)
        let m = conflict.blocks.reduce((accumulator, currentValue) => accumulator + Number(currentValue.telescopes.medium.min), 0)
        let s = conflict.blocks.reduce((accumulator, currentValue) => accumulator + Number(currentValue.telescopes.small.min), 0)
        otherg.select('text#totalLarge')
          .text(l)
        otherg.select('text#totalMedium')
          .text(m)
        otherg.select('text#totalSmall')
          .text(s)
        otherg.select('rect#isbalanced')
          .attr('fill', function () {
            if (l > 4 || m > 25 || s > 70) return '#FFCCBC'
            return '#C8E6C9'
          })
        otherg.select('rect#validateConflict')
          .style('opacity', function () {
            if (l > 4 || m > 25 || s > 70) return 0
            return 0.8
          })
        otherg.select('image#checkedConflict')
          .style('opacity', function () {
            if (l > 4 || m > 25 || s > 70) return 0
            return 0.8
          })
      }
      updateTotals()
    }
    function closeOtherBlocks () {
      reserved.g.select('g#conflictsInformation').select('g#otherg').remove()
      svgTelsConflict.drawTelsAvailabilityCurve()
    }
    function focusOnConflict (d) {
      if (shared.focus) focusManager.focusOn(shared.focus.type, shared.focus.id)
      if (!conflictFocused.d) {
        conflictFocused = d
        openOtherBlocks(d.d)
      } else if (conflictFocused.d.id === d.d.id) {
        conflictFocused = {d: undefined, d3: undefined}
        closeOtherBlocks(d)
      } else {
        conflictFocused = d
        closeOtherBlocks(d)
        openOtherBlocks(d.d)
      }
    }
    this.focusOnConflict = focusOnConflict
    function updateOverview () {
      if (shared.focus) return
      function updateModificationsInformation () {
        if (!shared.data.copy) return
        let box = allBox.modifications
        let innerg = reserved.overview.modifications.scrollBox.get('innerG')
        let line = 25
        let marg = 2
        let labels = [
          {x: box.w * 0.0, w: box.w * 0.13},
          {x: box.w * 0.13, w: box.w * 0.13},
          {x: box.w * (0.26 + 0.185 * 0), w: box.w * 0.185},
          {x: box.w * (0.26 + 0.185 * 1), w: box.w * 0.185},
          {x: box.w * (0.26 + 0.185 * 2), w: box.w * 0.185},
          {x: box.w * (0.26 + 0.185 * 3), w: box.w * 0.185}
        ]

        let popupOffset = 0

        let schedIndex = 0
        let blockIndex = 0
        let propIndex = 0

        function schedCore (scheds, g, offset) {
          let current = g
            .selectAll('g.sched')
            .data(scheds, function (d) {
              return d.id
            })
          let enter = current
            .enter()
            .append('g')
            .attr('class', 'sched')
          enter.each(function (d, i) {
            let g = d3.select(this)
            g.append('path')
              .attr('id', 'backpath')
              .attr('fill', 'none')
              .attr('stroke', colorPalette.darker.background)
              .attr('stroke-width', 2)
            g.append('g').attr('id', 'blocks')
            let header = g.append('g').attr('id', 'header')

            let dimPoly = line
            let poly = [
              {x: dimPoly * 0.3, y: dimPoly * 0.0},
              {x: dimPoly * 0.7, y: dimPoly * 0.0},

              {x: dimPoly * 1, y: dimPoly * 0.3},
              {x: dimPoly * 1, y: dimPoly * 0.7},

              {x: dimPoly * 0.7, y: dimPoly * 1},
              {x: dimPoly * 0.3, y: dimPoly * 1},

              {x: dimPoly * 0.0, y: dimPoly * 0.7},
              {x: dimPoly * 0.0, y: dimPoly * 0.3}
            ]
            header.selectAll('polygon')
              .data([poly])
              .enter()
              .append('polygon')
              .attr('points', function (d) {
                return d.map(function (d) {
                  return [d.x, d.y].join(',')
                }).join(' ')
              })
              .attr('fill', colorPalette.dark.background)
              .attr('stroke', colorPalette.dark.stroke)
              .attr('stroke-width', 0.8)
              .on('click', function () {
                focusManager.focusOn('schedBlock', d.id)
              })
              .on('mouseover', function (d) {
                d3.select(this).style('cursor', 'pointer')
                d3.select(this).attr('fill', colorPalette.darker.background)
              })
              .on('mouseout', function (d) {
                d3.select(this).style('cursor', 'default')
                d3.select(this).attr('fill', colorPalette.dark.background)
              })
              .attr('transform', 'translate(' + ((labels[0].w - dimPoly) * 0.5) + ',' + ((line - dimPoly) * 0.5) + ')')
            header.append('text')
              .text('S' + d.blocks[0].metaData.nSched)
              .style('fill', colorPalette.dark.text)
              .style('font-weight', 'bold')
              .style('font-size', titleSize + 'px')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(' + (labels[0].w * 0.5) + ',' + (line * 0.5 + txtSize * 0.3) + ')')
              .style('pointer-events', 'none')
          })
          let merge = current.merge(enter)
          merge.each(function (d, i) {
            let g = d3.select(this)
            g.attr('transform', 'translate(' + -5 + ',' + (schedIndex * (line + marg) + offset) + ')')

            let points = [{x: labels[0].w * 0.5, y: labels[0].w * 0.5}]
            for (let j = 0; j < d.blocks.length; j++) {
              points.push({x: labels[0].w * 0.5, y: (line + marg) * ((j + 1) + 0.5)})
              points.push({x: line * 2, y: (line + marg) * ((j + 1) + 0.5)})
              points.push({x: labels[0].w * 0.5, y: (line + marg) * ((j + 1) + 0.5)})
            }
            let lineGenerator = d3.line()
              .x(function (d) { return d.x })
              .y(function (d) { return d.y })
              .curve(d3.curveLinear)
            g.select('path#backpath')
              .attr('d', lineGenerator(points))
            // innerOffset += line
            blockIndex = 1
            blockCore(d.blocks, g.select('g#header'), 0)
            schedIndex += blockIndex
            // index += 1
          })
          current
            .exit()
            .transition('inOut')
            .duration(timeD.animArc)
            .style('opacity', 0)
            .remove()
        }
        function blockCore (blocks, maing, offset) {
          let current = maing
            .selectAll('g.block')
            .data(blocks, function (d) {
              return d.obId
            })
          let enter = current
            .enter()
            .append('g')
            .attr('class', 'block')
          enter.each(function (d, i) {
            let g = d3.select(this)
            let palette = blockStyle(d)
            g.append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', line)
              .attr('height', line)
              .attr('fill', function () {
                return palette.color.background
              })
              .attr('stroke', palette.color.stroke)
              .attr('stroke-width', 0.1)
              .on('click', function () {})
              .on('mouseover', function (d) {
                d3.select(this).style('cursor', 'pointer')
                d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
              })
              .on('mouseout', function (d) {
                d3.select(this).style('cursor', 'default')
                d3.select(this).attr('fill', palette.color.background)
              })
            g.append('text')
              .text(d.metaData.nObs)
              .style('fill', '#000000')
              .style('font-weight', 'bold')
              .style('font-size', headerSize + 'px')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(' + (line * 0.5) + ',' + (line * 0.5 + txtSize * 0.3) + ')')
              .style('pointer-events', 'none')
            g.append('rect')
              .attr('width', 12)
              .attr('height', 12)
              .attr('x', -line * 0.7)
              .attr('y', line * 0.4)
              .attr('fill', function () {
                return 'transparent'
              })
              .on('click', function () {})
              .on('mouseover', function (d) {
                d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
              })
              .on('mouseout', function (d) {
                d3.select(this).attr('fill', 'transparent')
              })
          })
          let merge = current.merge(enter)
          merge.each(function (d, i) {
            let g = d3.select(this)
            g.attr('transform', 'translate(' + (labels[1].x) + ',' + (offset + (line + marg) * blockIndex) + ')')
            let old = getBlockById(getBlocksData('server'), d.obId).data
            let diff = checkBlocksDifference(old, d)
            propIndex = 0
            // g.selectAll('g#props').remove()
            propCore(diff, g, 0)
            blockIndex += 1
          })
          current
            .exit()
            .transition('inOut')
            .duration(timeD.animArc)
            .style('opacity', 0)
            .remove()
        }
        function propCore (props, g, offset) {
          function drawDiffTime (g, d) {
            let localoffset = (line + marg) * (propIndex + blockIndex + schedIndex)
            function drawHoverClock () {
              let timeSOld = new Date(shared.data.server.timeOfNight.date_start)
              timeSOld.setSeconds(timeSOld.getSeconds() + d.start.old)
              let timeSNew = new Date(shared.data.server.timeOfNight.date_start)
              timeSNew.setSeconds(timeSNew.getSeconds() + d.start.new)

              let g = reserved.g.select('g#modificationsInformation')
              let clockg = g.append('g')
                .attr('id', 'clockhover')
                .style('pointer-events', 'none')
                .attr('transform', function () {
                  let tx = 0
                  let ty = localoffset + popupOffset
                  return 'translate(' + tx + ',' + ty + ')'
                })
              clockg.append('rect')
                .attr('x', labels[3].x - 38)
                .attr('y', line * 0.5)
                .attr('width', 40)
                .attr('height', line)
                .attr('fill', colorPalette.dark.background)
                .attr('stroke', colorPalette.dark.stroke)
                .attr('stroke-width', 0.2)
                .attr('rx', 2)

              clockg.append('image')
                .attr('xlink:href', '/static/icons/arrow-curve-rtl.svg')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', line * 1)
                .attr('height', line * 1)
                .style('opacity', 0.8)
                .style('pointer-events', 'none')
                .attr('transform', 'translate(' + (labels[3].x - 38) + ',' + (line * 1.4) + '), rotate(-90) scale(0.75,0.65)')
              clockg.append('text')
                .text(d3.timeFormat('%H:%M')(timeSOld))
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', headerSize + 'px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (labels[3].x - 12) + ',' + (line * 0.83 + txtSize * 0.3) + ')')
                .style('pointer-events', 'none')
              clockg.append('text')
                .text(d3.timeFormat('%H:%M')(timeSNew))
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', headerSize + 'px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (labels[3].x - 12) + ',' + (line * 1.3 + txtSize * 0.3) + ')')
                .style('pointer-events', 'none')
            }
            function drawHoverSandclock () {
              let timeSOld = new Date()
              timeSOld.setHours(d.duration.old / 3600)
              timeSOld.setMinutes((d.duration.old % 3600) / 60)
              // timeSOld.setHours(d.duration.old % 3600)
              let timeSNew = new Date()
              timeSNew.setHours(d.duration.new / 3600)
              timeSNew.setMinutes((d.duration.new % 3600) / 60)

              let g = reserved.g.select('g#modificationsInformation')
              let clockg = g.append('g')
                .attr('id', 'sandclockhover')
                .style('pointer-events', 'none')
                .attr('transform', function () {
                  let tx = 0
                  let ty = localoffset + popupOffset
                  return 'translate(' + tx + ',' + ty + ')'
                })
              clockg.append('rect')
                .attr('x', labels[3].x + labels[3].w - 12)
                .attr('y', line * 0.5)
                .attr('width', 40)
                .attr('height', line)
                .attr('fill', colorPalette.dark.background)
                .attr('stroke', colorPalette.dark.stroke)
                .attr('stroke-width', 0.2)
                .attr('rx', 2)
              clockg.append('image')
                .attr('xlink:href', '/static/icons/arrow-curve-rtl.svg')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', line * 1)
                .attr('height', line * 1)
                .style('opacity', 0.8)
                .style('pointer-events', 'none')
                .attr('transform', 'translate(' + (labels[3].x + labels[3].w + 30) + ',' + (line * 1.4) + '), rotate(-90) scale(0.75,-0.65)')
              clockg.append('text')
                .text(d3.timeFormat('%H:%M')(timeSOld))
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', headerSize + 'px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (labels[3].x + labels[3].w + 3) + ',' + (line * 0.83 + txtSize * 0.3) + ')')
                .style('pointer-events', 'none')
              clockg.append('text')
                .text(d3.timeFormat('%H:%M')(timeSNew))
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', headerSize + 'px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (labels[3].x + labels[3].w + 3) + ',' + (line * 1.3 + txtSize * 0.3) + ')')
                .style('pointer-events', 'none')
            }
            let offset = labels[3].x - labels[1].x - labels[1].w

            if (d.start.new !== d.start.old) {
              if (!g.select('rect#timeStart').empty()) {
                g.select('image#timeStartIncDec')
                  .attr('xlink:href', '/static/icons/arrow-' + (d.start.new > d.start.old ? 'right' : 'left') + '.svg')
              } else {
                g.append('rect')
                  .attr('id', 'timeStart')
                  .attr('x', offset + labels[3].w * 0.15)
                  .attr('y', line * 0.0)
                  .attr('width', line * 0.66)
                  .attr('height', line)
                  .attr('fill', 'transparent')
                  .attr('rx', 0)
                  .on('mouseover', function () {
                    d3.select(this).attr('fill', colorPalette.darkest.background)
                    drawHoverClock()
                  })
                  .on('mouseout', function () {
                  d3.select(this).attr('fill', 'transparent')
                  reserved.g.selectAll('g#clockhover').remove()
                })
                g.append('image')
                  .attr('id', 'timeStartIncDec')
                  .attr('xlink:href', '/static/icons/arrow-' + (d.start.new > d.start.old ? 'right' : 'left') + '.svg')
                  .attr('x', offset + line * 0.33) //  + (d.start.new > d.start.old ? 4 : -4))
                  .attr('y', line * 0.0)
                  .attr('width', line * 0.66)
                  .attr('height', line * 0.33)
                  .style('opacity', 0.8)
                  .style('pointer-events', 'none')
                g.append('image')
                  .attr('xlink:href', '/static/icons/clock.svg')
                  .attr('x', offset + labels[3].w * 0.15)
                  .attr('y', line * 0.33)
                  .attr('width', line * 0.66)
                  .attr('height', line * 0.66)
                  .style('opacity', 0.8)
                  .style('pointer-events', 'none')
              }
            }
            if (d.duration.new !== d.duration.old) {
              if (!g.select('rect#timeDuration').empty()) {
                g.select('text#timeDurationIncDec')
                  .text(d.duration.new > d.duration.old ? '+' : '-')
              } else {
                g.append('rect')
                  .attr('id', 'timeDuration')
                  .attr('x', offset + labels[3].w * 0.85 - line * 0.66)
                  .attr('y', line * 0.0)
                  .attr('width', line * 0.66)
                  .attr('height', line)
                  .attr('fill', 'transparent')
                  .attr('rx', 4)
                  .on('mouseover', function () {
                    d3.select(this).attr('fill', colorPalette.darkest.background)
                    drawHoverSandclock()
                  })
                  .on('mouseout', function () {
                    d3.select(this).attr('fill', 'transparent')
                    reserved.g.selectAll('g#sandclockhover').remove()
                  })
                g.append('text')
                  .attr('id', 'timeDurationIncDec')
                  .text(d.duration.new > d.duration.old ? '+' : '-')
                  .style('fill', '#000000')
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (offset + labels[3].w * 0.85 - line * 0.33) + ',' + (txtSize * 0.8) + ')')
                  .style('pointer-events', 'none')
                g.append('image')
                  .attr('xlink:href', '/static/icons/sandclock.svg')
                  .attr('x', offset + labels[3].w * 0.85 - line * 0.66)
                  .attr('y', line * 0.33)
                  .attr('width', line * 0.66)
                  .attr('height', line * 0.66)
                  .style('opacity', 0.8)
                  .style('pointer-events', 'none')
              }
            }
          }
          function drawDiffState (g, d) {
            let offset = labels[2].x - labels[1].x - labels[1].w

            if (!g.select('text').empty()) {
              if (d.old) {
                g.select('rect')
                  .attr('fill', colorPalette.blocks[d.old === 'cancel' ? 'cancelOp' : d.old].background)
                  .attr('stroke', colorPalette.blocks[d.old === 'cancel' ? 'cancelOp' : d.old].stroke)
              }
              g.select('text').text(d.old ? d.old.substring(0, 4) : 'New')
              return
            }
            g.append('image')
              .attr('xlink:href', '/static/icons/arrow-left.svg')
              .attr('x', -line * 0.4)
              .attr('y', line * 0.6)
              .attr('width', line * 0.7)
              .attr('height', line * 0.7)
              .style('opacity', 0.8)
              .style('pointer-events', 'none')
              .attr('transform', 'translate(0, ' + 0 + ') scale(1,0.5)')
            if (d.old) {
              g.append('rect')
                .attr('x', offset + labels[2].w * 0.3 - line * 0.16)
                .attr('y', line * 0.275)
                .attr('width', line * 0.45)
                .attr('height', line * 0.45)
                .attr('fill', colorPalette.blocks[d.old === 'cancel' ? 'cancelOp' : d.old].background)
                .attr('stroke', colorPalette.blocks[d.old === 'cancel' ? 'cancelOp' : d.old].stroke)
                .attr('stroke-width', 0.2)
            }
            g.append('text')
              .text(d.old ? d.old.substring(0, 4) : 'New')
              .style('fill', '#000000')
              .style('font-weight', d.old ? '' : 'bold')
              .style('font-size', headerSize + 'px')
              .attr('text-anchor', 'start')
              .attr('transform', 'translate(' + (offset + labels[2].w * 0.3 + (d.old ? line * 0.43 : 0)) + ',' + (line * 0.5 + txtSize * 0.35) + ')')
              .style('pointer-events', 'none')
          }
          function drawDiffTels (g, d) {
            let localoffset = (line + marg) * (propIndex + blockIndex + schedIndex)
            let marg1 = 6
            let marg2 = 2
            function drawHoverLarge () {
              if (d.large.new.length === 0 && d.large.rem.length === 0) return
              let marg = 2 * marg1 + ((d.large.new.length > 0 && d.large.rem.length > 0) ? marg1 * 2 : 0)
              let newH = (titleSize + marg2) * (parseInt(d.large.new.length / 2) + (d.large.new.length % 2 !== 0 ? 1 : 0))
              let remH = (titleSize + marg2) * (parseInt(d.large.rem.length / 2) + (d.large.rem.length % 2 !== 0 ? 1 : 0))

              let g = reserved.g.select('g#modificationsInformation')
              let largeg = g.append('g')
                .attr('id', 'largehover')
                .style('pointer-events', 'none')
                .attr('transform', function () {
                  let tx = 0
                  let ty = localoffset + popupOffset
                  return 'translate(' + tx + ',' + ty + ')'
                })
              largeg.append('rect')
                .attr('x', labels[5].x - 55)
                .attr('y', line * 0.5)
                .attr('width', 54)
                .attr('height', function () {
                  return newH + marg * 0.5 - 1
                })
                .attr('fill', colorPalette.darker.background)
                .attr('stroke-width', 0)
              largeg.append('rect')
                .attr('x', labels[5].x - 55)
                .attr('y', line * 0.5 + marg * 0.5 + newH + 2)
                .attr('width', 54)
                .attr('height', function () {
                  return remH + marg * 0.5 - 1
                })
                .attr('fill', colorPalette.darker.background)
                .attr('stroke-width', 0)
              largeg.append('rect')
                .attr('x', labels[5].x - 55)
                .attr('y', line * 0.5)
                .attr('width', 54)
                .attr('height', function () {
                  return marg + newH + remH
                })
                .attr('fill', function () {
                  if (d.large.new.length === 0) return colorPalette.darker.background
                  else if (d.large.rem.length === 0) return colorPalette.darker.background
                  else return 'none'
                })
                .attr('stroke', colorPalette.medium.stroke)
                .attr('stroke-dasharray', function () {
                  if (d.large.new.length === 0) return [54 + newH + marg + remH + 20, 14, 20 + remH + marg + newH]
                  else if (d.large.rem.length === 0) return [20, 14, 20 + newH + marg + remH + 54 + remH + marg + newH]
                  else return [20, 14, 20 + newH, marg, remH + 20, 14, 20 + remH, marg, newH]
                })
                .attr('stroke-width', 1)
                // .attr('rx', 2)
              if (d.large.new.length > 0) {
                largeg.append('text')
                  .text('+')
                  .attr('x', labels[5].x - 28)
                  .attr('y', line * 0.5 + titleSize * 0.33)
                  .style('fill', '#000000')
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .style('pointer-events', 'none')
              }
              if (d.large.rem.length > 0) {
                largeg.append('text')
                  .text('-')
                  .attr('x', labels[5].x - 28)
                  .attr('y',  marg + newH + remH + line * 0.5 + titleSize * 0.33)
                  .style('fill', '#000000')
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .style('pointer-events', 'none')
              }

              for (let i = 0; i < d.large.new.length; i++) {
                largeg.append('text')
                  .text(d.large.new[i])
                  .attr('x', labels[5].x - 55)
                  .attr('y', line * 0.5)
                  .style('fill', '#000000')
                  .style('font-weight', '')
                  .style('font-size', headerSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (15 + 22 * (i % 2)) + ',' + ((marg1 + titleSize) + (titleSize + marg2) * parseInt(i / 2)) + ')')
                  .style('pointer-events', 'none')
              }
              let midOffset = d.large.new.length > 0 ? (marg1 * 2 + (titleSize + marg2) * Math.ceil(d.large.new.length / 2)) : 0
              for (let i = 0; i < d.large.rem.length; i++) {
                largeg.append('text')
                  .text(d.large.rem[i])
                  .attr('x', labels[5].x - 55)
                  .attr('y', line * 0.5)
                  .style('fill', '#000000')
                  .style('font-weight', '')
                  .style('font-size', headerSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (15 + 22 * (i % 2)) + ',' + (midOffset + (marg1 + titleSize) + (titleSize + marg2) * parseInt(i / 2)) + ')')
                  .style('pointer-events', 'none')
              }
            }
            function drawHoverMedium () {
              if (d.medium.new.length === 0 && d.medium.rem.length === 0) return
              let marg = 2 * marg1 + ((d.medium.new.length > 0 && d.medium.rem.length > 0) ? (marg1 * 2) : 0)
              let newH = (headerSize + marg2) * (parseInt(d.medium.new.length / 2) + (d.medium.new.length % 2 !== 0 ? 1 : 0))
              let remH = (headerSize + marg2) * (parseInt(d.medium.rem.length / 2) + (d.medium.rem.length % 2 !== 0 ? 1 : 0))

              let g = reserved.g.select('g#modificationsInformation')
              let mediumg = g.append('g')
                .attr('id', 'mediumhover')
                .style('pointer-events', 'none')
                .attr('transform', function () {
                  let tx = 0
                  let ty = localoffset + popupOffset
                  return 'translate(' + tx + ',' + ty + ')'
                })

              mediumg.append('rect')
                .attr('x', labels[5].x - 55)
                .attr('y', line * 0.5)
                .attr('width', 74)
                .attr('height', function () {
                  return newH + marg * 0.5 - 1
                })
                .attr('fill', colorPalette.darker.background)
                .attr('stroke-width', 0)
              mediumg.append('rect')
                .attr('x', labels[5].x - 55)
                .attr('y', line * 0.5 + marg * 0.5 + newH + 2)
                .attr('width', 74)
                .attr('height', function () {
                  return remH + marg * 0.5 - 1
                })
                .attr('fill', colorPalette.darker.background)
                .attr('stroke-width', 0)
              mediumg.append('rect')
                .attr('x', labels[5].x - 55)
                .attr('y', line * 0.5)
                .attr('width', 74)
                .attr('height', function () {
                  return marg + newH + remH
                })
                .attr('fill', function () {
                  if (d.medium.new.length === 0) return colorPalette.darker.background
                  else if (d.medium.rem.length === 0) return colorPalette.darker.background
                  else return 'none'
                })
                .attr('stroke', colorPalette.medium.stroke)
                .attr('stroke-dasharray', function () {
                  if (d.medium.new.length === 0) return [74 + newH + marg + remH + 30, 14, 30 + remH + marg + newH]
                  else if (d.medium.rem.length === 0) return [30, 14, 30 + newH + marg + remH + 74 + remH + marg + newH]
                  else return [30, 14, 30 + newH, marg, remH + 30, 14, 30 + remH, marg, newH]
                })
                .attr('stroke-width', 1)
              if (d.medium.new.length > 0) {
                mediumg.append('text')
                  .text('+')
                  .attr('x', labels[5].x - 18)
                  .attr('y', line * 0.5 + titleSize * 0.33)
                  .style('fill', '#000000')
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .style('pointer-events', 'none')
              }
              if (d.medium.rem.length > 0) {
                mediumg.append('text')
                  .text('-')
                  .attr('x', labels[5].x - 18)
                  .attr('y', marg + newH + remH + line * 0.5 + titleSize * 0.33)
                  .style('fill', '#000000')
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .style('pointer-events', 'none')
              }

              for (let i = 0; i < d.medium.new.length; i++) {
                mediumg.append('text')
                  .text(d.medium.new[i])
                  .attr('x', labels[5].x - 55)
                  .attr('y', line * 0.5)
                  .style('fill', '#000000')
                  .style('font-weight', '')
                  .style('font-size', headerSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (18 + 38 * (i % 2)) + ',' + ((marg1 + headerSize) + (headerSize + marg2) * parseInt(i / 2)) + ')')
                  .style('pointer-events', 'none')
              }
              let midOffset = d.medium.new.length > 0 ? (marg1 * 2 + (headerSize + marg2) * Math.ceil(d.medium.new.length / 2)) : 0
              for (let i = 0; i < d.medium.rem.length; i++) {
                mediumg.append('text')
                  .text(d.medium.rem[i])
                  .attr('x', labels[5].x - 55)
                  .attr('y', line * 0.5)
                  .style('fill', '#000000')
                  .style('font-weight', '')
                  .style('font-size', headerSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (18 + 38 * (i % 2)) + ',' + (midOffset + (marg1 + headerSize) + (headerSize + marg2) * parseInt(i / 2)) + ')')
                  .style('pointer-events', 'none')
              }
            }
            function drawHoverSmall () {
              if (d.small.new.length === 0 && d.small.rem.length === 0) return
              let marg = 2 * marg1 + ((d.small.new.length > 0 && d.small.rem.length > 0) ? marg1 * 2 : 0)
              let newH = (txtSize + marg2) * (parseInt(d.small.new.length / 3) + (d.small.new.length % 3 !== 0 ? 1 : 0))
              let remH = (txtSize + marg2) * (parseInt(d.small.rem.length / 3) + (d.small.rem.length % 3 !== 0 ? 1 : 0))

              let g = reserved.g.select('g#modificationsInformation')
              let smallg = g.append('g')
                .attr('id', 'smallhover')
                .style('pointer-events', 'none')
                .attr('transform', function () {
                  let tx = 0
                  let ty = localoffset + popupOffset
                  return 'translate(' + tx + ',' + ty + ')'
                })
              smallg.append('rect')
                .attr('x', labels[5].x - 55)
                .attr('y', line * 0.5)
                .attr('width', 94)
                .attr('height', function () {
                  return newH + marg * 0.5 - 1
                })
                .attr('fill', colorPalette.darker.background)
                .attr('stroke-width', 0)
              smallg.append('rect')
                .attr('x', labels[5].x - 55)
                .attr('y', line * 0.5 + marg * 0.5 + newH + 2)
                .attr('width', 94)
                .attr('height', function () {
                  return remH + marg * 0.5 - 1
                })
                .attr('fill', colorPalette.darker.background)
                .attr('stroke-width', 0)
              smallg.append('rect')
                .attr('x', labels[5].x - 55)
                .attr('y', line * 0.5)
                .attr('width', 94)
                .attr('height', function () {
                  return marg + newH + remH
                })
                .attr('fill', function () {
                  if (d.small.new.length === 0) return colorPalette.darker.background
                  else if (d.small.rem.length === 0) return colorPalette.darker.background
                  else return 'none'
                })
                .attr('stroke', colorPalette.medium.stroke)
                .attr('stroke-dasharray', function () {
                  if (d.small.new.length === 0) return [94 + newH + marg + remH + 40, 14, 40 + remH + marg + newH]
                  else if (d.small.rem.length === 0) return [40, 14, 40 + newH + marg + remH + 94 + remH + marg + newH]
                  else return [40, 14, 40 + newH, marg, remH + 40, 14, 40 + remH, marg, newH]
                })
                .attr('stroke-width', 1)
              if (d.small.new.length > 0) {
                smallg.append('text')
                  .text('+')
                  .attr('x', labels[5].x - 8)
                  .attr('y', line * 0.5 + titleSize * 0.33)
                  .style('fill', '#000000')
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .style('pointer-events', 'none')
              }
              if (d.small.rem.length > 0) {
                smallg.append('text')
                  .text('-')
                  .attr('x', labels[5].x - 8)
                  .attr('y', marg + newH + remH + line * 0.5 + titleSize * 0.33)
                  .style('fill', '#000000')
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .style('pointer-events', 'none')
              }

              for (let i = 0; i < d.small.new.length; i++) {
                smallg.append('text')
                  .text(d.small.new[i])
                  .attr('x', labels[5].x - 55)
                  .attr('y', line * 0.5)
                  .style('fill', '#000000')
                  .style('font-weight', '')
                  .style('font-size', txtSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (18 + 28 * (i % 3)) + ',' + ((marg1 + txtSize) + (txtSize + marg2) * parseInt(i / 3)) + ')')
                  .style('pointer-events', 'none')
              }
              let midOffset = d.small.new.length > 0 ? (marg1 * 2 + (txtSize + marg2) * Math.ceil(d.small.new.length / 3)) : 0
              for (let i = 0; i < d.small.rem.length; i++) {
                smallg.append('text')
                  .text(d.small.rem[i])
                  .attr('x', labels[5].x - 55)
                  .attr('y', line * 0.5)
                  .style('fill', '#000000')
                  .style('font-weight', '')
                  .style('font-size', txtSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (18 + 28 * (i % 3)) + ',' + (midOffset + (marg1 + txtSize) + (txtSize + marg2) * parseInt(i / 3)) + ')')
                  .style('pointer-events', 'none')
              }
            }

            let offset = labels[5].x - labels[1].x - labels[1].w

            if (d.large.new.length !== 0 || d.large.rem.length !== 0) {
              if (!g.select('g#circleLarge').empty()) {
                g.select('g#circleLarge').select('text')
                  .text(Math.abs(d.large.diff))
              } else {
                let glarge = g.append('g')
                  .attr('id', 'circleLarge')
                  .attr('transform', 'translate(' + (offset + labels[5].w * 0.2) + ',' + (line * 0.5) + ')')
                glarge.append('circle')
                  .attr('cx', 0)
                  .attr('cy', 0)
                  .attr('r', labels[5].w * 0.2)
                  .attr('fill', colorPalette.dark.background)
                  .attr('stroke', '#000000')
                  .attr('stroke-width', 0.2)
                  .on('mouseover', function () {
                    d3.select(this).attr('fill', colorPalette.darkest.background)
                    drawHoverLarge()
                  })
                  .on('mouseout', function () {
                    d3.select(this).attr('fill', colorPalette.dark.background)
                    reserved.g.selectAll('g#largehover').remove()
                  })
                g.append('text')
                  .text(Math.abs(d.large.diff))
                  .style('fill', d.large.diff < 0 ? 'red' : (d.large.diff > 0 ? 'green' : '#000000'))
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (offset + labels[5].w * 0.2) + ',' + (line * 0.5 + titleSize * 0.3) + ')')
                  .style('pointer-events', 'none')
              }
            }
            if (d.medium.new.length !== 0 || d.medium.rem.length !== 0) {
              if (!g.select('g#circleMedium').empty()) {
                g.select('g#circleMedium').select('text')
                  .text(Math.abs(d.medium.diff))
              } else {
                let gmedium = g.append('g')
                  .attr('id', 'circleMedium')
                  .attr('transform', 'translate(' + (offset + labels[5].w * 0.56) + ',' + (line * 0.5) + ')')
                gmedium.append('circle')
                  .attr('cx', 0)
                  .attr('cy', 0)
                  .attr('r', labels[5].w * 0.16)
                  .attr('fill', colorPalette.dark.background)
                  .attr('stroke', '#000000')
                  .attr('stroke-width', 0.2)
                  .on('mouseover', function () {
                    d3.select(this).attr('fill', colorPalette.darkest.background)
                    drawHoverMedium()
                  })
                  .on('mouseout', function () {
                    d3.select(this).attr('fill', colorPalette.dark.background)
                    reserved.g.selectAll('g#mediumhover').remove()
                  })
                g.append('text')
                  .text(Math.abs(d.medium.diff))
                  .style('fill', d.medium.diff < 0 ? 'red' : (d.medium.diff > 0 ? 'green' : '#000000'))
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (offset + labels[5].w * 0.56) + ',' + (line * 0.5 + titleSize * 0.3) + ')')
                  .style('pointer-events', 'none')
              }
            }
            if (d.small.new.length !== 0 || d.small.rem.length !== 0) {
              if (!g.select('g#circleSmall').empty()) {
                g.select('g#circleSmall').select('text')
                  .text(Math.abs(d.small.diff))
              } else {
                let gsmall = g.append('g')
                  .attr('id', 'circleSmall')
                  .attr('transform', 'translate(' + (offset + labels[5].w * 0.86) + ',' + (line * 0.5) + ')')
                gsmall.append('circle')
                  .attr('cx', 0)
                  .attr('cy', 0)
                  .attr('r', labels[5].w * 0.14)
                  .attr('fill', colorPalette.dark.background)
                  .attr('stroke', '#000000')
                  .attr('stroke-width', 0.2)
                  .on('mouseover', function () {
                    d3.select(this).attr('fill', colorPalette.darkest.background)
                    drawHoverSmall()
                  })
                  .on('mouseout', function () {
                    d3.select(this).attr('fill', colorPalette.dark.background)
                    reserved.g.selectAll('g#smallhover').remove()
                  })
                g.append('text')
                  .text(Math.abs(d.small.diff))
                  .style('fill', d.small.diff < 0 ? 'red' : (d.small.diff > 0 ? 'green' : '#000000'))
                  .style('font-weight', 'bold')
                  .style('font-size', titleSize + 'px')
                  .attr('text-anchor', 'middle')
                  .attr('transform', 'translate(' + (offset + labels[5].w * 0.86) + ',' + (line * 0.5 + titleSize * 0.3) + ')')
                  .style('pointer-events', 'none')
              }
            }
          }
          let current = g
            .selectAll('g.prop')
            .data(props, function (d, i) {
              return i
            })
          let enter = current
            .enter()
            .append('g')
            .attr('class', 'prop')
          enter.each(function (d, i) {
            let g = d3.select(this)
            if (d.type === 'time') drawDiffTime(g, d)
            else if (d.type === 'state') drawDiffState(g, d)
            else if (d.type === 'telescope') drawDiffTels(g, d)
          })
          let merge = current.merge(enter)
          merge.each(function (d, i) {
            let g = d3.select(this)
            g.attr('transform', 'translate(' + (labels[1].x) + ',' + (offset + (line + marg) * propIndex) + ')')
            if (d.type === 'time') drawDiffTime(g, d)
            else if (d.type === 'state') drawDiffState(g, d)
            else if (d.type === 'telescope') drawDiffTels(g, d)
            // propIndex += 1
          })
          current
            .exit()
            .transition('inOut')
            .duration(timeD.animArc)
            .style('opacity', 0)
            .remove()
        }
        schedCore(shared.data.copy.modifications, innerg, marg)

        // reserved.overview.modifications.scrollBox.moveVerticalScrollerTo(0.5)
        reserved.overview.modifications.scrollBox.resetVerticalScroller({canScroll: true, keepFrac: true, scrollHeight: (line + marg) * (schedIndex + 0)})
        let scrollProp = reserved.overview.modifications.scrollBox.getScrollProp('vertical')
        popupOffset = scrollProp.now
      }
      function updateConflictsInformation () {
        conflictButton = []
        // let tbox = {x: label[0].x, y: 3 + headerSize + (com.target.editable ? (headerSize * 2) : 0), w: label[0].w, h: com.target.editable ? (box.h - headerSize * 3) : (box.h - headerSize * 1)}
        // let blocktg = g.append('g').attr('transform', 'translate(' + tbox.x + ',' + tbox.y + ')')
        let line = 38
        let marg = 4
        let innerg = reserved.overview.conflicts.scrollBox.get('innerG')
        innerg.selectAll('*').remove()
        let current = innerg
          .selectAll('g.conflict')
          .data(shared.data.copy.conflicts, function (d, i) {
            return d.id
          })
        let enter = current
          .enter()
          .append('g')
          .attr('class', 'conflict')
        enter.each(function (d, i) {
          let g = d3.select(this)
          g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', line)
            .attr('height', line)
            .attr('open', false)
            .attr('fill', colorPalette.dark.background)
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.1)
            .on('click', function () {
              focusOnConflict({d3: d3.select(this), d: d})
            })
          g.append('text')
            .text(d.blocks.length + ' obs')
            .attr('x', line * 0.5)
            .attr('y', line * 0.2 + titleSize * 0.33)
            .style('font-weight', '')
            .attr('text-anchor', 'middle')
            .style('font-size', titleSize + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')
          g.append('text')
            .text(d.large + '-' + d.medium + '-' + d.small)
            .attr('x', line * 0.5)
            .attr('y', line * 0.55 + txtSize * 0.33)
            .style('font-weight', '')
            .attr('text-anchor', 'middle')
            .style('font-size', txtSize + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')
          g.append('text')
            .text('L - M - S')
            .attr('x', line * 0.5)
            .attr('y', line * 0.8 + titleSize * 0.33)
            .style('font-weight', '')
            .attr('text-anchor', 'middle')
            .style('font-size', txtSize + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')

          let offX = marg * 1 + (line + marg) * i
          let offY = marg * 1
          g.attr('transform', 'translate(' + offX + ',' + offY + ')')
          conflictButton.push({d3: g, d: d})
        })
        // let merge = current.merge(enter)
        // merge.each(function (d, i) {
        //   let g = d3.select(this)
        //   let offX = marg * 1 + (line + marg) * i
        //   let offY = marg * 1
        //   g.attr('transform', 'translate(' + offX + ',' + offY + ')')
        //   conflictButton.push({d3: g, d: d})
        // })
        // current
        //   .exit()
        //   .each(d => console.log(d.id))
        //   .transition('inOut')
        //   .duration(timeD.animArc)
        //   .style('opacity', 0)
        //   .remove()
        reserved.overview.conflicts.scrollBox.resetHorizontalScroller({canScroll: true, scrollWidth: (line + marg) * shared.data.copy.conflicts.length})
      }

      updateModificationsInformation()
      updateConflictsInformation()
    }
    this.updateOverview = updateOverview

    function createSchedBlocksInfoPanel (id) {
      let schedB = getSchedBlocksData()[id]
      let g = reserved.g.append('g')
      let innerbox = {
        x: box.rightInfo.w * 0.0,
        y: box.rightInfo.h * 0.0,
        w: box.rightInfo.w * 1.0,
        h: box.rightInfo.h * 1.0
      }
      let allBox = {
        tree: {
          x: box.rightInfo.w * 0.0,
          y: box.rightInfo.h * 0.0,
          w: box.rightInfo.w * 1,
          h: box.rightInfo.h * 0.1
        },
        time: {
          x: box.rightInfo.w * 0.0,
          y: box.rightInfo.h * 0.125,
          w: box.rightInfo.w * 1.0,
          h: box.rightInfo.h * 0.25
        },
        target: {
          x: box.rightInfo.w * 0.0,
          y: box.rightInfo.h * 0.41,
          w: box.rightInfo.w * 1.0,
          h: box.rightInfo.h * 0.59
        }
      }
      reserved.schedblockForm = new SchedblockForm({
        main: {
          tag: 'schedblockFormTag',
          g: g,
          scroll: {},
          box: innerbox,
          background: {
            fill: colorTheme.brighter.background,
            stroke: colorTheme.brighter.stroke,
            strokeWidth: 0.5
          }
        },
        tree: {
          box: allBox.tree,
          events: {
            change: createNewBlockInSchedule,
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        schedule: {
          editabled: true,
          box: allBox.time,
          events: {
            change: updateBlockState,
            click: updateView,
            over: undefined,
            out: undefined
          }
        },
        target: {
          box: allBox.target,
          events: {
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        data: {
          schedB: schedB,
          timeOfNight: shared.data.server.timeOfNight
        },
        debug: {
          enabled: false
        },
        input: {
          over: {
            schedBlocks: undefined,
            block: undefined
          },
          focus: {
            schedBlocks: undefined,
            block: undefined
          }
        },
        events: {
          blurry: function () {
            svgEventsQueueServer.blurry()
            svgBlocksQueueServer.blurry()
            svgBrush.blurry()
            svgTargets.blurry()
            svgTelsConflict.blurry()
            svgFocusOverlay.blurry()
          },
          focus: function () {
            svgEventsQueueServer.focus()
            svgBlocksQueueServer.focus()
            svgBrush.focus()
            svgTargets.focus()
            svgTelsConflict.focus()
            svgFocusOverlay.focus()
          },
          conflict: function (d) {
            balanceBlocks(d)
            svgTelsConflict.drawTelsAvailabilityCurve(d)
            // listAllConflicts()
            // linkConflicts()
          },
          modification: changeBlockProperties
        }
      })
      reserved.schedblockForm.init()
    }
    function focusOnSchedBlock (bId) {
      clean()
      conflictFocused = {d: undefined, d3: undefined}
      createSchedBlocksInfoPanel(bId)
    }
    this.focusOnSchedBlock = focusOnSchedBlock

    function createBlocksInfoPanel (idBlock) {
      let data = getBlockById(getBlocksData(), idBlock).data
      let schedB = getSchedBlocksData()[data.sbId]
      let g = reserved.g.append('g')
      let innerbox = {
        x: box.rightInfo.w * 0.0,
        y: box.rightInfo.h * 0.0,
        w: box.rightInfo.w * 1.0,
        h: box.rightInfo.h * 1.0
      }
      let allBox = {
        tree: {
          x: box.rightInfo.w * 0.0,
          y: box.rightInfo.h * 0.0,
          w: box.rightInfo.w * 1.0,
          h: box.rightInfo.h * 0.1
        },
        time: {
          x: box.rightInfo.w * 0.0,
          y: box.rightInfo.h * 0.125,
          w: box.rightInfo.w * 1.0,
          h: box.rightInfo.h * 0.1
        },
        target: {
          x: box.rightInfo.w * 0.0,
          y: box.rightInfo.h * 0.25,
          w: box.rightInfo.w * 1.0,
          h: box.rightInfo.h * 0.3
        },
        tels: {
          x: box.rightInfo.w * 0.0,
          y: box.rightInfo.h * 0.6,
          w: box.rightInfo.w * 1.0,
          h: box.rightInfo.h * 0.39
        }
      }

      reserved.obsblockForm = new ObsblockForm({
        main: {
          tag: 'blockFormTag',
          g: g,
          scroll: {},
          box: innerbox,
          background: {
            fill: colorTheme.brighter.background,
            stroke: colorTheme.brighter.stroke,
            strokeWidth: 0.5
          }
        },
        tree: {
          box: allBox.tree,
          events: {
            change: createNewBlockInSchedule,
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        schedule: {
          editabled: true,
          box: allBox.time,
          events: {
            change: updateBlockState,
            click: updateView,
            over: undefined,
            out: undefined
          }
        },
        target: {
          editable: true,
          box: allBox.target,
          events: {
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        telescope: {
          box: allBox.tels,
          events: {
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        data: {
          block: data,
          schedB: schedB,
          timeOfNight: shared.data.server.timeOfNight,
          target: shared.data.server.targets,
          tels: shared.data.server.telHealth
        },
        debug: {
          enabled: false
        },
        input: {
          over: {
            schedBlocks: undefined,
            block: undefined
          },
          focus: {
            schedBlocks: undefined,
            block: undefined
          }
        },
        events: {
          allTel: function () { return {allTels: shared.data.server.telHealth, blocks: getBlocksByTime(getBlocksData(), data.time.start, data.time.end)} },
          blurry: function () {
            svgEventsQueueServer.blurry()
            svgBlocksQueueServer.blurry()
            svgBrush.blurry()
            svgTargets.blurry()
            svgTelsConflict.blurry()
            svgFocusOverlay.blurry()
          },
          focus: function () {
            svgEventsQueueServer.focus()
            svgBlocksQueueServer.focus()
            svgBrush.focus()
            svgTargets.focus()
            svgTelsConflict.focus()
            svgFocusOverlay.focus()
          },
          conflict: function (d) {
            balanceBlocks(d)
            svgTelsConflict.drawTelsAvailabilityCurve(d)
            // listAllConflicts()
            // linkConflicts()
          },
          modification: changeBlockProperties
        }
      })
      reserved.obsblockForm.init()
      // reserved.telescopeRunningBlock.updateData({
      //   data: {
      //     raw: {
      //       telescopes: [].concat(tels.small).concat(tels.medium).concat(tels.large),
      //       blocks: []// shared.data.server.blocks.run
      //     },
      //     modified: []
      //   }
      // })
    }
    function focusOnBlock (bId) {
      clean()
      conflictFocused = {d: undefined, d3: undefined}
      createBlocksInfoPanel(bId)
    }
    this.focusOnBlock = focusOnBlock

    function createTargetInfoPanel (id) {
      let tar = getTargetById(id)
      let inter = createSchedBlocks(shared.data.server.blocks)
      let scheds = []
      for (let key in inter) {
        for (let j = 0; j < inter[key].targets.length; j++) {
          if (inter[key].targets[j].id !== tar.id) continue
          inter[key].id = key
          scheds.push(inter[key])
        }
      }
      let innerbox = {
        x: box.rightInfo.w * 0.0,
        y: box.rightInfo.h * 0.0,
        w: box.rightInfo.w * 1.0,
        h: box.rightInfo.h * 1.0
      }
      let allBox = {
        title: {
          x: 0,
          y: reserved.box.h * 0.015,
          w: reserved.box.w,
          h: reserved.box.h * 0.1
        },
        blocks: {
          x: 0,
          y: reserved.box.h * 0.125,
          h: reserved.box.h * 0.3,
          w: reserved.box.w
        },
        target: {
          x: box.rightInfo.w * 0.0,
          y: box.rightInfo.h * 0.45,
          w: box.rightInfo.w * 1.0,
          h: box.rightInfo.h * 0.55
        }
      }

      let g = reserved.g.append('g')
      reserved.targetForm = new TargetForm({
        main: {
          tag: 'targetFormTag',
          g: g,
          scroll: {},
          box: innerbox,
          background: {
            fill: colorTheme.brighter.background,
            stroke: colorTheme.brighter.stroke,
            strokeWidth: 0.5
          }
        },
        tree: {
          box: allBox.title,
          events: {
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        ressource: {
          box: allBox.blocks,
          events: {
            click: focusManager.focusOn,
            over: undefined,
            out: undefined
          }
        },
        target: {
          box: allBox.target,
          events: {
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        data: {
          schedB: scheds,
          target: tar
        },
        debug: {
          enabled: false
        },
        input: {
          over: {
            schedBlocks: undefined,
            block: undefined
          },
          focus: {
            schedBlocks: undefined,
            block: undefined
          }
        }
      })
      reserved.targetForm.init()
    }
    function focusOnTarget (id) {
      clean()
      conflictFocused = {d: undefined, d3: undefined}
      createTargetInfoPanel(id)
    }
    this.focusOnTarget = focusOnTarget

    function createTelescopeInfoPanel (telId) {
      let tel = getTelescopeById(telId)
      let innerbox = {
        x: box.rightInfo.w * 0.0,
        y: box.rightInfo.h * 0.0,
        w: box.rightInfo.w * 1.0,
        h: box.rightInfo.h * 1.0
      }
      let allBox = {
        title: {
          x: 0,
          y: reserved.box.h * 0.01,
          w: reserved.box.w * 0.8,
          h: reserved.box.h * 0.12
        },
        blocks: {
          x: 0,
          y: reserved.box.h * 0.125,
          h: reserved.box.h * 0.87,
          w: reserved.box.w
        }
      }
      let g = reserved.g.append('g')

      let blocks = []
      let copyBlock = getBlocksData()
      for (let key in copyBlock) {
        blocks = blocks.concat(copyBlock[key])
      }
      blocks = blocks.filter(b => b.telIds.includes(tel.id))
      let scheds = createSchedBlocks(blocks)

      reserved.telescopeForm = new TelescopeForm({
        main: {
          tag: 'telescopeFormTag',
          g: g,
          scroll: {},
          box: innerbox,
          background: {
            fill: colorTheme.brighter.background,
            stroke: colorTheme.brighter.stroke,
            strokeWidth: 0.5
          }
        },
        tree: {
          box: allBox.title,
          events: {
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        ressource: {
          box: allBox.blocks,
          events: {
            click: focusManager.focusOn,
            over: undefined,
            out: undefined
          }
        },
        data: {
          schedB: scheds,
          telescope: tel
        },
        debug: {
          enabled: false
        },
        input: {
          over: {
            schedBlocks: undefined,
            block: undefined
          },
          focus: {
            schedBlocks: undefined,
            block: undefined
          }
        }
      })
      reserved.telescopeForm.init()
    }
    function focusOnTelescope (telId) {
      clean()
      conflictFocused = {d: undefined, d3: undefined}
      createTelescopeInfoPanel(telId)
    }
    this.focusOnTelescope = focusOnTelescope

    function clean () {
      reserved.g.selectAll('*').remove()
      if (shared.focus === undefined) {
        initOverview()
        updateOverview()
      }
    }
    this.clean = clean
  }

  let svgEventsQueueServer = new SvgEventsQueueServer()
  let svgBlocksQueueServer = new SvgBlocksQueueServer()
  let svgBrush = new SvgBrush()
  let svgWarningArea = new SvgWarningArea()
  let svgTargets = new SvgTargets()
  let svgTelsConflict = new SvgTelsConflict()
  let svgFocusOverlay = new SvgFocusOverlay()
  let svgRightInfo = new SvgRightInfo()
}
