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
  this.pushNewBlockQueue = function (optIn) {
    if (sock.conStat.isOffline()) return

    let data = {}
    data.widgetId = optIn.widgetId
    data.newBlockQueue = optIn.newBlockQueue

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: data.widgetId,
      methodName: 'schedBlockInspectorPushNewBlockQueue',
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
    over: undefined,
    mode: 'modifier'
  }
  let svg = {}
  let box = {}
  let lenD = {}

  let blockQueue = null
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
      .attr('height', lenD.h[0] * 0.64) // - 2 * lenD.h[0] * 0.02)
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
    modificationOverlayRect.append('rect')
      .attr('id', 'targets')
      .attr('x', lenD.w[0] * 0.34)
      .attr('y', lenD.h[0] * 0.68)
      .attr('width', lenD.w[0] * 0.66)
      .attr('height', lenD.h[0] * 0.3) // - 2 * lenD.h[0] * 0.02)
      .attr('fill', 'url(#bar)')
      .style('opacity', 0.9)
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
      .attr('id', 'menu')
      .attr('x', lenD.w[0] * 0.005)
      .attr('y', lenD.h[0] * 0.02)
      .attr('width', lenD.w[0] * 0.315)
      .attr('height', lenD.h[0] * 0.1)
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
      .attr('id', 'modifications')
      .attr('x', lenD.w[0] * 0.005)
      .attr('y', lenD.h[0] * 0.265)
      .attr('width', lenD.w[0] * 0.315)
      .attr('height', lenD.h[0] * 0.28)
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
      .attr('y', lenD.h[0] * 0.6)
      .attr('width', lenD.w[0] * 0.315)
      .attr('height', lenD.h[0] * 0.4)
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

    // modificationOverlayRect.append('rect')
    //   .attr('x', lenD.w[0] * 0.45)
    //   .attr('y', lenD.h[0] * 0.45)
    //   .attr('width', lenD.w[0] * 0.1)
    //   .attr('height', lenD.h[0] * 0.1)
    //   .attr('fill', colorTheme.dark.background)
    //   .attr('stroke', colorTheme.medium.stroke)
    //   .attr('stroke-width', 0.6)
    //   // .style('boxShadow', '10px 20px 30px black')
    //   .on('click', function () {
    //   })
    //   .on('mouseover', function (d) {
    //     d3.select(this).style('cursor', 'pointer')
    //     d3.select(this).attr('fill', colorTheme.darker.background)
    //   })
    //   .on('mouseout', function (d) {
    //     d3.select(this).style('cursor', 'default')
    //     d3.select(this).attr('fill', colorTheme.dark.background)
    //   })
    modificationOverlayRect.append('image')
      .attr('xlink:href', '/static/icons/server-to-client.svg')
      .attr('x', lenD.w[0] * 0.34 + lenD.w[0] * 0.33 - 20)
      .attr('y', lenD.h[0] * 0.02 + lenD.h[0] * 0.32 - 20)
      .attr('width', 40)
      .attr('height', 40)
      .style('opacity', 0.8)
      // .style('pointer-events', 'none')
      .on('click', function () {
        shared.mode = 'modifier'
        modificationOverlayRect.select('image').remove()
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
      .on('mouseover', function (d) {
        d3.select(this).style('cursor', 'pointer')
        pattern.select.patternLock.select('rect')
          .style('opacity', 0.8)
          .attr('fill', d3.color(colorPalette.darker.background).darker(0.1))
        // d3.select(this).attr('fill', colorTheme.darker.background)
      })
      .on('mouseout', function (d) {
        d3.select(this).style('cursor', 'default')
        pattern.select.patternLock.select('rect')
          .style('opacity', 1)
          .attr('fill', colorPalette.darker.background)
        // d3.select(this).attr('fill', colorTheme.dark.background)
      })

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
      svg.svg
        .style('background', colorTheme.medium.background)
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
        .attr('height', lenD.h[0] * 0.02)
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
        y: lenD.h[0] * 0.025,
        w: lenD.w[0] * 0.62,
        h: lenD.h[0] * 0.6,
        marg: lenD.w[0] * 0.01
      }
      box.brushZoom = {
        x: lenD.w[0] * 0.374,
        y: lenD.h[0] * 0.612,
        w: lenD.w[0] * 0.62,
        h: lenD.h[0] * 0.05,
        marg: lenD.w[0] * 0.01
      }
      box.tools = {
        x: lenD.w[0] * 0.374,
        y: lenD.h[0] * 0.707,
        w: lenD.w[0] * 0.62,
        h: lenD.h[0] * 0.268,
        marg: lenD.w[0] * 0.01
      }
      box.focusOverlay = {
        x: lenD.w[0] * 0.374,
        y: lenD.h[0] * 0.025,
        w: lenD.w[0] * 0.62,
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
    let cp = deepCopy(shared.data.server.blocks)
    shared.data.copy = {
      blocks: cp,
      schedBlocks: createSchedBlocks(cp)
    }

    svgBrush.initData()
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
    svgRightInfo.initData()
    svgBlocksQueueServer.initData()
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
      // console.log('pushing...');
      setTimeout(function () {
        updateDataOnce(dataIn)
      }, 10)
      return
    }
    locker.add('updateData')
    shared.data.server = dataIn.data
    shared.data.server.schedBlocks = createSchedBlocks(shared.data.server.blocks)

    svgBlocksQueueServer.updateData()
    svgBrush.updateData()
    svgRightInfo.update()

    locker.remove('updateData')
  }
  function updateData (dataIn) {
    runLoop.push({ tag: 'updateData', data: dataIn })
  }
  this.updateData = updateData
  runLoop.init({ tag: 'updateData', func: updateDataOnce, nKeep: 1 })

  function getBlocksData () {
    if (shared.mode === 'inspector') {
      return shared.data.server.blocks
    }
    if (shared.mode === 'modifier') {
      return shared.data.copy.blocks
    }
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
          focusCore(shared.focus.type, shared.focus.id)
        }
      } else {
        shared.focus = {type: type, id: id}
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
  function cleanOptimizedBlockQueue () {
    let cleanQueue = deepCopy(shared.data.copy[shared.data.current].optimized)
    for (let key in cleanQueue.blocks) {
      let group = cleanQueue.blocks[key]
      for (let i = 0; i < group.length; i++) {
        delete group[i].modifications
      }
    }
    return cleanQueue
  }
  function pushNewBlockQueue () {
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
        let cleanQueue = cleanOptimizedBlockQueue()
        sock.widgetV[widgetType].SockFunc.pushNewBlockQueue({
          widgetId: widgetId,
          newBlockQueue: cleanQueue
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
  this.pushNewBlockQueue = pushNewBlockQueue

  function createDummyBlock () {
    let newBlock = deepCopy(blockTemplate)
    newBlock.startTime = 0
    newBlock.duration = 2000
    newBlock.endTime = 2000
    newBlock.exeState = {state: 'wait', canRun: true}
    newBlock.metaData = {blockName: '80 (0)', nObs: 0, nSched: 80}
    newBlock.obId = 'newBlockObID'
    newBlock.sbId = 'newBlockSbID'
    newBlock.timeStamp = 101010209020
    newBlock.runPhase = []
    newBlock.modified = true
    shared.data.copy.blocks.wait.push(newBlock)
    shared.data.copy.schedBlocks = createSchedBlocks(shared.data.copy.blocks)

    // console.log(getSchedBlocksData()['newBlockSbID'])
  }
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
            target: {
              id: b.targetId,
              name: b.targetName,
              pos: b.targetPos,
              observability: {}
            },
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
  // ---------------------------------------------------------------------------------------------------
  // modify blocks
  // ---------------------------------------------------------------------------------------------------
  function applyModification (block, modif) {
    let old
    switch (modif.prop) {
      case 'startTime':
        old = block.modified.data.startTime
        block.modified.data.startTime = modif.new
        block.modified.data.endTime = modif.new + block.modified.data.duration

        if (block.original.data.startTime === modif.new) {
          delete block.modified.data.modifications.userModifications[modif.prop]
          return false
        }
        if (!block.modified.data.modifications.userModifications[modif.prop]) block.modified.data.modifications.userModifications[modif.prop] = []
        block.modified.data.modifications.userModifications[modif.prop].push({new: modif.new, old: old})
        break
      case ('state'):
        old = block.modified.data.exeState.state
        block.modified.data.exeState.state = modif.new
        if (block.original.data.exeState.state === modif.new) {
          delete block.modified.data.modifications.userModifications[modif.prop]
          return false
        }

        if (!block.modified.data.modifications.userModifications['state']) block.modified.data.modifications.userModifications['state'] = []
        block.modified.data.modifications.userModifications['state'].push({new: modif.new, old: old})
        break
      case ('canRun'):
        old = block.modified.data.exeState
        block.modified.data.exeState = {state: 'cancel', canRun: modif.new}

        if (block.original.data.exeState.canRun === modif.new) {
          delete block.modified.data.modifications.userModifications[modif.prop]
          return false
        }
        if (old.state !== 'cancel') {
          if (!block.modified.data.modifications.userModifications['state']) block.modified.data.modifications.userModifications['state'] = []
          block.modified.data.modifications.userModifications['state'].push({new: 'cancel', old: old.state})
        }
        if (!block.modified.data.modifications.userModifications[modif.prop]) block.modified.data.modifications.userModifications[modif.prop] = []
        block.modified.data.modifications.userModifications['canRun'].push({new: modif.new, old: old.canRun})
        break
      default:
    }
    return true
  }
  function changeSchedBlocksProperties (from, schedId, modifs) {
    for (let key in shared.data.copy[shared.data.current].modified.blocks) {
      let group = shared.data.copy[shared.data.current].modified.blocks[key]
      for (let i = group.length - 1; i > -1; i--) {
        if (group[i].sbId === schedId) {
          changeBlockProperties(from, group[i].obId, modifs)
        }
      }
    }
  }
  function changeBlockProperties (from, blockId, modifs) {
    let block = getBlockById(blockId)
    // for (let key in shared.data.copy[shared.data.current].original.blocks) {
    //   let group = shared.data.copy[shared.data.current].original.blocks[key]
    //   for (let i = 0; i < group.length; i++) {
    //     if (group[i].obId === blockId) {
    //       group[i].modifications.modified = true
    //     }
    //   }
    // }
    // shared.data.copy[shared.data.current].original.blocks[block.original.key][block.original.index]
    block.original.data.modifications.modified = true
    block.optimized.data.modifications.modified = true
    for (let modif in modifs) {
      applyModification(block, modifs[modif])
      if (modifs[modif].prop === 'state') {
        shared.data.copy[shared.data.current].modified.blocks[block.modified.key].splice(block.modified.index, 1)
        if (modifs[modif].new === 'cancel') {
          shared.data.copy[shared.data.current].modified.blocks['done'].push(block.modified.data)
        } else if (modifs[modif].new === 'wait') {
          shared.data.copy[shared.data.current].modified.blocks['wait'].push(block.modified.data)
        } else if (modifs[modif].new === 'run') {
          shared.data.copy[shared.data.current].modified.blocks['run'].push(block.modified.data)
        }
      }
    }
    if (Object.keys(block.optimized.data.modifications.userModifications).length === 0) {
      block.original.data.modifications.modified = false
      block.optimized.data.modifications.modified = false
    }

    optimizer()
    updateAllBlocksQueue()
    svgMiddleInfo.update()
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
  let SvgBlocksQueueServer = function () {
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServer.x,
        y: box.blockQueueServer.y,
        w: box.blockQueueServer.w,
        h: box.blockQueueServer.h,
        marg: lenD.w[0] * 0.01
      }
      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

      blockQueue = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: colorTheme.medium.background,
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
              enabled: true,
              position: 'left',
              clickable: true,
              size: (lenD.w[0] * 0.65 - adjustedBox.w)
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
            box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h * 2, marg: adjustedBox.marg}
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
            click: focusManager.focusOn,
            mouseover: focusManager.over,
            mouseout: focusManager.out,
            drag: {
              start: svgFocusOverlay.dragStart,
              tick: svgFocusOverlay.dragTick,
              end: function (d) {
                let res = svgFocusOverlay.dragEnd(d)
                if (res) changeBlockProperties('', res.id, res.modif)
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
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
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
    }
    this.initData = initData

    function updateData () {
      let telIds = []
      $.each(shared.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })

      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
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
    }
    this.updateData = updateData

    function update () {
      let axisTop = brushZoom.getAxis('top').axis.scale().domain()
      let startTime = {date: axisTop[0].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[0].getTime()) / -1000}
      let endTime = {date: axisTop[1].getTime(), time: (new Date(shared.data.server.timeOfNight.date_start).getTime() - axisTop[1].getTime()) / -1000}

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

      brushZoom = new PlotBrushZoom({
        main: {
          g: reserved.g,
          box: brushBox
        },
        clipping: {
          enabled: true
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
            box: {x: 0, y: brushBox.h * 0.2, w: brushBox.w, h: brushBox.h * 0.6, marg: 0},
            attr: {
              fill: colorTheme.medium.background
            }
          }
        },
        focus: {
          enabled: true,
          main: {
            g: undefined,
            box: {x: 0, y: brushBox.h * 0.2, w: brushBox.w, h: brushBox.h * 0.6, marg: 0},
            attr: {
              fill: colorTheme.darker.background,
              opacity: 1,
              stroke: colorTheme.darker.background
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
          }
        }
      })
      brushZoom.init()
    }
    this.initData = initData

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

    function drawTargets () {
      let scaleX = d3.scaleLinear()
        .range([0, reserved.box.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
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
      // gEnter.append('rect')
      //   .attr('x', function (d) { return scaleX(d.observability.minimal) })
      //   .attr('y', reserved.box.h * 0.65)
      //   .attr('width', function (d) { return scaleX(d.observability.maximal) - scaleX(d.observability.minimal) })
      //   .attr('height', reserved.box.h * 0.1)
      //   .attr('fill', colorTheme.darker.background)
      //   .attr('fill-opacity', 0.3)
      //   .attr('stroke', colorTheme.darker.stroke)
      //   .attr('stroke-width', 0.1)
      gEnter.append('text')
        .text(function (d) {
          return d.id
        })
        .attr('x', function (d) {
          let xx = scaleX(d.observability.minimal) + 10
          return (xx < 0) ? 10 : xx
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
        .filter(function (d) { return (block.targetId === d.id) })
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
      reserved.clipping.clipBody.select('text.percentStart').remove()
      reserved.clipping.clipBody.select('text.percentEnd').remove()
      let tarG = reserved.clipping.clipBody.selectAll('g.target')
        .filter(function (d) { return (block.targetId === d.id) })
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
    function initData () {
      reserved.box = {
        x: box.tools.x,
        y: box.tools.y + box.tools.h * 0.5,
        w: box.tools.w,
        h: box.tools.h * 0.5,
        marg: lenD.w[0] * 0.01
      }

      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
      // gBlockBox.append('text')
      //   .text('MODIFICATIONS')
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(-5,' + (reserved.box.h * 0.5) + ') rotate(270)')

      reserved.gTargets = gBlockBox.append('g')
      reserved.gTargets.append('defs').append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('id', 'clip-rect')
        .attr('x', '0')
        .attr('y', '0')
        .attr('width', reserved.box.w)
        .attr('height', reserved.box.h)
      reserved.clipBody = reserved.gTargets.append('g')
        .attr('clip-path', '') // 'url(#clip)')

      let range = reserved.box.h * 0.33333
      reserved.clipBody.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.dark.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
      reserved.clipBody.append('rect')
        .attr('x', 0)
        .attr('y', range * 1)
        .attr('width', reserved.box.w)
        .attr('height', range)
        .attr('fill', colorTheme.medium.background)
        .attr('fill-opacity', 0.55)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.5)
      reserved.clipBody.append('rect')
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
      drawTelsAvailabilityCurve()
    }
    this.updateData = updateData
    function update () {}
    this.update = update

    function drawTelsAvailabilityCurve (block) {
      let curve = computeTelsCurve(block)

      let scaleX = d3.scaleLinear()
        .range([0, reserved.box.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
      // console.log(blockQueue.get('axis').range, blockQueue.get('axis').domain);
      let range = reserved.box.h * 0.33333
      let scaleYSmall = d3.scaleLinear()
        .range([0, range * 0.5])
        .domain([0, 69])
      let scaleYMedium = d3.scaleLinear()
        .range([0, range * 0.5])
        .domain([0, 25])
      let scaleYLarge = d3.scaleLinear()
        .range([0, range * 0.5])
        .domain([0, 4])
      let allg = reserved.clipBody.selectAll('g.telsCurve')
        .data(curve, function (d, i) {
          return i
        })
      let gEnter = allg.enter()
        .append('g')
        .attr('class', 'telsCurve')
      gEnter.append('rect').attr('class', 'small')
      gEnter.append('rect').attr('class', 'medium')
      gEnter.append('rect').attr('class', 'high')
      let gMerge = allg.merge(gEnter)

      gMerge.select('rect.small')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', function (d) { return (range * 1) - 2 * Math.abs(scaleYSmall(d.smallTels)) })
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('fill', function (d, i) {
          return '#43A047'
        })
        .attr('height', function (d) {
          let height = scaleYSmall(d.smallTels) * 2
          if (height < 0) d3.select(this).attr('fill', '#FF5722')
          return Math.abs(height)
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

      gMerge.select('rect.medium')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', function (d) { return (range * 2) - 2 * Math.abs(scaleYMedium(d.mediumTels)) })
        .attr('fill', function (d, i) {
          return '#43A047'
        })
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('height', function (d) {
          let height = scaleYMedium(d.mediumTels) * 2
          if (height < 0) d3.select(this).attr('fill', '#FF5722')
          return Math.abs(height)
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

      gMerge.select('rect.high')
        .attr('x', function (d) { return scaleX(d.start) })
        .attr('y', function (d) { return (range * 3) - 2 * Math.abs(scaleYLarge(d.largeTels)) })
        .attr('fill', function (d, i) {
          return '#43A047'
        })
        .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
        .attr('height', function (d) {
          let height = scaleYLarge(d.largeTels) * 2
          if (height < 0) d3.select(this).attr('fill', '#FF5722')
          return Math.abs(height)
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
    }
    this.drawTelsAvailabilityCurve = drawTelsAvailabilityCurve
    function computeTelsCurve (block) {
      let largeTels = {}
      let mediumTels = {}
      let smallTels = {}
      // smallTels[shared.data.server.timeOfNight.start] = 0
      // mediumTels[shared.data.server.timeOfNight.start] = 0
      // largeTels[shared.data.server.timeOfNight.start] = 0
      let focusBlockList = getBlocksData()
      for (let key in focusBlockList) {
        for (let i = 0; i < focusBlockList[key].length; i++) {
          let b = focusBlockList[key][i]
          if (b.exeState.state === 'cancel') continue
          if (block && b.obId === block.obId) continue

          if (!largeTels[b.time.start]) largeTels[b.time.start] = 0// 4
          if (!mediumTels[b.time.start]) mediumTels[b.time.start] = 0// 24
          if (!smallTels[b.time.start]) smallTels[b.time.start] = 0// 70
          if (!largeTels[b.time.end]) largeTels[b.time.end] = 0// 4
          if (!mediumTels[b.time.end]) mediumTels[b.time.end] = 0// 24
          if (!smallTels[b.time.end]) smallTels[b.time.end] = 0// 70

          smallTels[b.time.start] -= b.telescopes.small.ids.length
          smallTels[b.time.end] += b.telescopes.small.ids.length
          mediumTels[b.time.start] -= b.telescopes.medium.ids.length
          mediumTels[b.time.end] += b.telescopes.medium.ids.length
          largeTels[b.time.start] -= b.telescopes.large.ids.length
          largeTels[b.time.end] += b.telescopes.large.ids.length
          // for (let j = 0; j < b.telIds.length; j++) {
          //   let tid = b.telIds[j]
          //   if (tid[0] === 'S') {
          //     smallTels[b.startTime] -= 1
          //     smallTels[b.endTime] += 1
          //   } else if (tid[0] === 'M') {
          //     mediumTels[b.startTime] -= 1
          //     mediumTels[b.endTime] += 1
          //   } else if (tid[0] === 'L') {
          //     largeTels[b.startTime] -= 1
          //     largeTels[b.endTime] += 1
          //   }
          // }
        }
      }
      if (block) {
        if (!largeTels[block.time.start]) largeTels[block.time.start] = 0// 4
        if (!mediumTels[block.time.start]) mediumTels[block.time.start] = 0// 24
        if (!smallTels[block.time.start]) smallTels[block.time.start] = 0// 70
        if (!largeTels[block.time.end]) largeTels[block.time.end] = 0// 4
        if (!mediumTels[block.time.end]) mediumTels[block.time.end] = 0// 24
        if (!smallTels[block.time.end]) smallTels[block.time.end] = 0// 70

        smallTels[block.time.start] -= block.telescopes.small.ids.length
        smallTels[block.time.end] += block.telescopes.small.ids.length
        mediumTels[block.time.start] -= block.telescopes.medium.ids.length
        mediumTels[block.time.end] += block.telescopes.medium.ids.length
        largeTels[block.time.start] -= block.telescopes.large.ids.length
        largeTels[block.time.end] += block.telescopes.large.ids.length
        // for (let j = 0; j < block.telIds.length; j++) {
        //   let tid = block.telIds[j]
        //   if (tid[0] === 'S') {
        //     smallTels[block.startTime] -= 1
        //     smallTels[block.endTime] += 1
        //   } else if (tid[0] === 'M') {
        //     mediumTels[block.startTime] -= 1
        //     mediumTels[block.endTime] += 1
        //   } else if (tid[0] === 'L') {
        //     largeTels[block.startTime] -= 1
        //     largeTels[block.endTime] += 1
        //   }
        // }
      // smallTels[shared.data.server.timeOfNight.end] = 0
      // mediumTels[shared.data.server.timeOfNight.end] = 0
      // largeTels[shared.data.server.timeOfNight.end] = 0
      }
      let timeMarker = []
      for (var key in smallTels) {
        timeMarker.push(Number(key))
      }
      timeMarker.sort((a, b) => a - b)
      let telsFree = []
      for (let i = -1; i < timeMarker.length; i++) {
        if (i === -1) {
          telsFree.push({
            start: Number(shared.data.server.timeOfNight.start),
            end: timeMarker[i + 1],
            smallTels: 69,
            mediumTels: 25,
            largeTels: 4
          })
        } else if (i === timeMarker.length - 1) {
          telsFree.push({
            start: timeMarker[i],
            end: Number(shared.data.server.timeOfNight.end),
            smallTels: 69,
            mediumTels: 25,
            largeTels: 4
          })
        } else {
          telsFree.push({
            start: timeMarker[i],
            end: timeMarker[i + 1],
            smallTels: telsFree[i].smallTels + smallTels[timeMarker[i]],
            mediumTels: telsFree[i].mediumTels + mediumTels[timeMarker[i]],
            largeTels: telsFree[i].largeTels + largeTels[timeMarker[i]]
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
    function initData () {
      reserved.hasData = false
    }
    this.initData = initData
    function updateData () {
      reserved.hasData = true
    }
    this.updateData = updateData
    function update () {}
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
    function createDragBlock (d) {
      reserved.drag.block = {}
      reserved.drag.block.g = reserved.drag.g.append('g')
      reserved.drag.block.g.append('text')
        .attr('class', 'modified')
        .text(function () {
          return d.metaData.blockName
        })
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', function () {
          return '#000000'
        })
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', function () {
          return '#000000'
        })
        .attr('x', function () {
          return reserved.drag.position.left + reserved.drag.position.width * 0.5
        })
        .attr('y', function () {
          return 8
        })
        .attr('text-anchor', 'middle')
        .style('font-size', function () {
          return 4 + 'px'
        })
        // .attr('dy', function () {
        //   return 0 + 'px'
        // })
        .transition()
        .duration(150)
        .attr('y', function () {
          return 8
        })
        .attr('dy', function () {
          return 3 + 'px'
        })
        .style('font-size', function () {
          return 8 + 'px'
        })
    }
    function createDragTimer (d) {
      reserved.drag.timer = {}
      reserved.drag.timer.g = reserved.drag.g.append('g')
        .attr('transform', 'translate(' + reserved.drag.position.left + ',' + (reserved.drag.box.h * 0.66) + ')')
      // reserved.drag.timer.g.append('rect')
      //   .attr('class', 'timelineCursor')
      //   .attr('x', reserved.drag.position.left)
      //   .attr('y', 100) // - Number(reserved.drag.oldRect.attr('height')))
      //   .attr('width', reserved.drag.position.right - reserved.drag.position.left)
      //   .attr('height', 2)
      //   .attr('fill', colorTheme.brighter.background)
      //   .attr('stroke', '#333333')
      //   .attr('fill-opacity', 0.99)

      // reserved.drag.timer.timer.g = reserved.drag.timer.g.append('g')
      //   .attr('class', 'timeline')
      //   .attr('transform', 'translate(' + (reserved.drag.position.left) + ',' + (com.blocks.run.box.y + com.blocks.run.box.h) + ')')
      if (shared.mode === 'inspector') {
        reserved.drag.timer.g.append('line')
          .attr('id', 'leftBar')
          .attr('x1', -4)
          .attr('y1', 4)
          .attr('x2', 0)
          .attr('y2', -1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.6)
        reserved.drag.timer.g.append('line')
          .attr('id', 'rightBar')
          .attr('x1', reserved.drag.position.width + 4)
          .attr('y1', 4)
          .attr('x2', reserved.drag.position.width)
          .attr('y2', -1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.6)
        reserved.drag.timer.g.append('text')
          .attr('class', 'hourLeft')
          .text(function () {
            let time = new Date(shared.data.server.timeOfNight.date_start)
            time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
            return d3.timeFormat('%H:')(time)
          })
          .attr('x', -24)
          .attr('y', 9) // - Number(reserved.drag.oldRect.attr('height')))
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
          .style('font-size', '10px')
          .attr('dy', '0px')
        reserved.drag.timer.g.append('text')
          .attr('class', 'minuteLeft')
          .text(function () {
            let time = new Date(shared.data.server.timeOfNight.date_start)
            time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
            return d3.timeFormat('%M')(time)
          })
          .attr('x', -12)
          .attr('y', 9) // - Number(reserved.drag.oldRect.attr('height')))
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
          .style('font-size', '10px')
          .attr('dy', '0px')

        reserved.drag.timer.g.append('text')
          .attr('class', 'hourRight')
          .text(function () {
            let time = new Date(shared.data.server.timeOfNight.date_start)
            time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
            return d3.timeFormat('%H:')(time)
          })
          .attr('x', reserved.drag.position.width + 12)
          .attr('y', 9) // - Number(reserved.drag.oldRect.attr('height')))
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
          .style('font-size', '10px')
          .attr('dy', '0px')
        reserved.drag.timer.g.append('text')
          .attr('class', 'minuteRight')
          .text(function () {
            let time = new Date(shared.data.server.timeOfNight.date_start)
            time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.right))
            return d3.timeFormat('%M')(time)
          })
          .attr('x', reserved.drag.position.width + 24)
          .attr('y', 9) // - Number(reserved.drag.oldRect.attr('height')))
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
          .style('font-size', '10px')
          .attr('dy', '0px')
      } else {
        reserved.drag.timer.g.append('line')
          .attr('id', 'leftBar')
          .attr('x1', -6)
          .attr('y1', 2)
          .attr('x2', 0)
          .attr('y2', 8)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 2)
        reserved.drag.timer.g.append('line')
          .attr('id', 'rightBar')
          .attr('x1', reserved.drag.position.width)
          .attr('y1', 8)
          .attr('x2', reserved.drag.position.width + 6)
          .attr('y2', 2)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 2)
        reserved.drag.timer.g.append('text')
          .attr('class', 'hourLeft')
          .text(function () {
            let time = new Date(shared.data.server.timeOfNight.date_start)
            time.setSeconds(time.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
            return d3.timeFormat('%H:')(time)
          })
          .attr('x', -28)
          .attr('y', 0) // - Number(reserved.drag.oldRect.attr('height')))
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
          .attr('x', -12)
          .attr('y', 0) // - Number(reserved.drag.oldRect.attr('height')))
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
          .attr('x', reserved.drag.position.width + 12)
          .attr('y', 0) // - Number(reserved.drag.oldRect.attr('height')))
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
          .attr('x', reserved.drag.position.width + 28)
          .attr('y', 0) // - Number(reserved.drag.oldRect.attr('height')))
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
      // reserved.drag.oldG.select('rect.back').style('fill-opacity', 1)
      // reserved.drag.oldG.select('rect.back').style('stroke-opacity', 1)
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
      reserved.drag.box = {
        x: box.focusOverlay.x,
        y: box.focusOverlay.y,
        w: box.focusOverlay.w,
        h: box.focusOverlay.h,
        marg: lenD.w[0] * 0.01
      }
      reserved.drag.g = svg.g.append('g')
        .attr('transform', 'translate(' + reserved.drag.box.x + ',' + reserved.drag.box.y + ')')
      // reserved.drag.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.drag.box.w)
      //   .attr('height', reserved.drag.box.h)
      //   .attr('fill', 'transparent')
      //   .style('pointer-events', 'none')

      reserved.drag.timeScale = d3.scaleLinear()
        .range([0, reserved.drag.box.w])
        .domain([Number(shared.data.server.timeOfNight.start), Number(shared.data.server.timeOfNight.end)])
      reserved.drag.position = {
        width: reserved.drag.timeScale(d.endTime) - reserved.drag.timeScale(d.startTime),
        left: reserved.drag.timeScale(d.startTime),
        right: reserved.drag.timeScale(d.endTime)
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

    function dragStart (d) {
      if (d.endTime > Number(shared.data.server.timeOfNight.now) && d.startTime < Number(shared.data.server.timeOfNight.now)) return
      if (d.endTime < Number(shared.data.server.timeOfNight.now)) return
      // reserved.drag.atLeastOneTick = false
      reserved.drag.mousecursor = d3.mouse(reserved.drag.g._groups[0][0])
      reserved.drag.offset = reserved.drag.mousecursor[0] - reserved.drag.position.left

      reserved.drag.mode = {}
      reserved.drag.mode.current = 'general'
      reserved.drag.mode.previous = 'general'
      reserved.drag.atLeastOneTick = true
      reserved.drag.locked = true
    }
    this.dragStart = dragStart
    function dragTick (d) {
      if (d.endTime > Number(shared.data.server.timeOfNight.now) && d.startTime < Number(shared.data.server.timeOfNight.now)) return
      if (d.endTime < Number(shared.data.server.timeOfNight.now)) return
      // console.log(reserved.drag.atLeastOneTick);
      // if (!reserved.drag.atLeastOneTick) {
      //   // if (shared.focus.type === 'block' !== d.obId) mainFocusOnBlock(d)
      //   reserved.drag.mousecursor = d3.mouse(reserved.drag.g._groups[0][0])
      //   reserved.drag.offset = reserved.drag.mousecursor[0] - reserved.drag.position.left
      //
      //   reserved.drag.mode = {}
      //   reserved.drag.mode.current = 'general'
      //   reserved.drag.mode.previous = 'general'
      //   reserved.drag.atLeastOneTick = true
      // }

      function changeMinute (date, hour, min) {
        reserved.drag.finalTime.setDate(date)
        reserved.drag.finalTime.setHours(hour)
        reserved.drag.finalTime.setMinutes(min)
        reserved.drag.timer.g.select('text.minute')
          .text(function () {
            return d3.timeFormat('%M')(reserved.drag.finalTime)
          })

        changePosition()
      }
      function changeSecond (sec) {
        reserved.drag.finalTime.setSeconds(sec)
        reserved.drag.timer.g.select('text.second')
          .text(function () {
            return d3.timeFormat('%S')(reserved.drag.finalTime)
          })

        changePosition()
      }
      function changePosition () {
        let t = (reserved.drag.finalTime.getTime() - (new Date(shared.data.server.timeOfNight.date_start)).getTime()) / 1000
        // reserved.drag.position.left = reserved.drag.timeScale(t)

        reserved.drag.g.select('line.left')
          .attr('x1', reserved.drag.timeScale(t))
          .attr('x2', reserved.drag.timeScale(t))
        reserved.drag.g.select('line.right')
          .attr('x1', reserved.drag.timeScale(t) + reserved.drag.position.width)
          .attr('x2', reserved.drag.timeScale(t) + reserved.drag.position.width)
        // reserved.drag.newG.select('rect.modified')
        //   .attr('x', reserved.drag.timeScale(reserved.drag.finalTime))
        reserved.drag.block.g.select('text.modified')
          .attr('x', reserved.drag.timeScale(t) + reserved.drag.position.width * 0.5)
        reserved.drag.g.select('rect.area')
          .attr('x', reserved.drag.timeScale(t))
        reserved.drag.column.g.select('rect.top')
          .attr('x', reserved.drag.timeScale(t) - 4)
        reserved.drag.column.g.select('rect.bottom')
          .attr('x', reserved.drag.timeScale(t) - 4)
      }
      // return
      if (d.endTime < Number(shared.data.server.timeOfNight.now)) return
      //
      // if (!reserved.drag.firstDrag) {
      //   dragCopy.start(d)
      //   reserved.drag.firstDrag = true
      //   reserved.drag.g = com.blocks.cancel.g.append('g')
      //   reserved.drag.box = deepCopy(com.blocks.cancel.box)
      //   reserved.drag.box.h = com.main.box.h
      //   reserved.drag.mode = {}
      //   reserved.drag.mode.current = 'general'
      //   reserved.drag.mode.previous = 'general'
      //   reserved.drag.topLimit = (com.blocks.cancel.box.y + com.blocks.cancel.box.h)
      //   reserved.drag.bottomLimit = (com.blocks.run.box.y + com.blocks.run.box.h)
      //
      //   reserved.drag.newG = reserved.drag.newG.merge(enter)
      // }
      else {
        // let delta = {
        //   x: d3.mouse(com.main.g._groups[0][0])[0] - reserved.drag.mousecursor[0],
        //   y: d3.mouse(com.main.g._groups[0][0])[1] - reserved.drag.mousecursor[1]
        // }
        // reserved.drag.mousecursor = d3.mouse(reserved.drag.g._groups[0][0])

        reserved.drag.position.left += d3.event.dx
        if (reserved.drag.position.left < 0) reserved.drag.position.left = 0
        if (reserved.drag.position.left + reserved.drag.position.width > reserved.drag.box.x + reserved.drag.box.w) {
          reserved.drag.position.left = reserved.drag.box.w - reserved.drag.position.width
        }

        reserved.drag.position.right = reserved.drag.position.left + reserved.drag.position.width
        console.log(reserved.drag.position.left);

        // if (reserved.drag.mousecursor[1] > (reserved.drag.box.h * 0.49)) {
        //   reserved.drag.mode.previous = reserved.drag.mode.current
        //   reserved.drag.mode.current = 'precision'
        // } else {
        //   reserved.drag.mode.previous = reserved.drag.mode.current
        //   reserved.drag.mode.current = 'general'
        // }

        if (reserved.drag.mode.current === 'general') { // || reserved.drag.mode.current === 'cancel') {
          // if (reserved.drag.mode.current === 'general' && reserved.drag.mode.previous === 'cancel') {
          //   reserved.drag.newG.select('g rect.modified').attr('fill', reserved.drag.oldG.select('rect.back').style('fill'))
          //   reserved.drag.newG.select('g rect.modified').attr('y', 0)
          //   reserved.drag.newG.select('g rect.modified').attr('height', reserved.drag.oldG.select('rect.back').attr('height'))
          //
          //   let text = {}
          //   text.y = Number(reserved.drag.oldG.select('rect.back').attr('height')) * 0.5
          //   reserved.drag.newG.select('g text.modified').attr('y', text.y)
          //   reserved.drag.newG.select('g text.modified').style('font-size', '12px')
          // } else if (reserved.drag.mode.current === 'cancel' && reserved.drag.mode.previous === 'general') {
          //   // reserved.drag.newG.select('g rect.modified').attr('x', reserved.drag.oldG.select('rect.back').attr('x'))
          //   reserved.drag.newG.select('g rect.modified').attr('y', -com.blocks.run.box.h * 0.4)
          //   reserved.drag.newG.select('g rect.modified').attr('height', 10)
          //   reserved.drag.newG.select('g rect.modified').attr('fill', colorTheme.blocks.cancelOp.background)
          //
          //   let text = {}
          //   text.x = Number(reserved.drag.oldG.select('rect.back').attr('x')) + Number(reserved.drag.oldG.select('rect.back').attr('width')) * 0.5
          //   text.y = -com.blocks.run.box.h * 0.4 + 5
          //   // reserved.drag.newG.select('g text.modified').attr('x', text.x)
          //   reserved.drag.newG.select('g text.modified').attr('y', text.y)
          //   reserved.drag.newG.select('g text.modified').style('font-size', '8px')
          // }

          if (d.exeState.state === 'run') return

          // if (reserved.drag.mode.previous === 'precision') {
          //   delete reserved.drag.finalTime
          //   reserved.drag.offset = reserved.drag.position.width * 0.5
          //   reserved.drag.timer.g.select('text.hour')
          //     .transition()
          //     .duration(600)
          //     .text(function () {
          //       return d3.timeFormat('%H:')(reserved.drag.timeScale.invert(reserved.drag.position.left))
          //     })
          //     .attr('x', 15)
          //     .attr('y', 9)
          //     .style('font-weight', 'normal')
          //   reserved.drag.timer.g.select('text.minute')
          //     .transition()
          //     .duration(600)
          //     .text(function () {
          //       return d3.timeFormat('%M')(reserved.drag.timeScale.invert(reserved.drag.position.left))
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
          // }
          if (true) {
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
            svgTelsConflict.drawTelsAvailabilityCurve({
              obId: d.obId,
              startTime: reserved.drag.timeScale.invert(reserved.drag.position.left),
              endTime: reserved.drag.timeScale.invert(reserved.drag.position.right),
              telIds: d.telIds
            })

            d.startTime = Math.floor(reserved.drag.timeScale.invert(reserved.drag.position.left))
            d.endTime = d.startTime + d.duration
            svgBlocksQueueServer.update()
          }
        }
        // else if (reserved.drag.mode.current === 'precision') {
        //   if (reserved.drag.mode.previous === 'general') {
        //     reserved.drag.finalTime = new Date(shared.data.server.timeOfNight.date_start)
        //     reserved.drag.finalTime.setSeconds(reserved.drag.finalTime.getSeconds() + reserved.drag.timeScale.invert(reserved.drag.position.left))
        //
        //     reserved.drag.timer.g.select('text.hour')
        //       .transition()
        //       .duration(600)
        //       .text(function () {
        //         return d3.timeFormat('%H:'target)(reserved.drag.finalTime)
        //       })
        //       .attr('x', 15)
        //       .attr('y', 10.5)
        //       .style('font-weight', 'bold')
        //     reserved.drag.timer.g.select('text.minute')
        //       .transition()
        //       .duration(600)
        //       .text(function () {
        //         return d3.timeFormat('%M')(reserved.drag.finalTime)
        //       })
        //       .attr('x', 29)
        //       .attr('y', 6.5)
        //       .style('font-weight', 'bold').style('font-size', '7px')
        //     reserved.drag.timer.g.append('text')
        //       .attr('class', 'second')
        //       .text(function () {
        //         return d3.timeFormat('%S')(reserved.drag.finalTime)
        //       })
        //       .attr('x', 29)
        //       .attr('y', 13) // - Number(reserved.drag.oldRect.attr('height')))
        //       .style('font-weight', 'bold')
        //       .style('opacity', 1)
        //       .style('fill-opacity', 0.7)
        //       .style('fill', '#000000')
        //       .style('stroke-width', 0.3)
        //       .style('stroke-opacity', 1)
        //       .attr('vector-effect', 'non-scaling-stroke')
        //       .style('pointer-events', 'none')
        //       .style('stroke', 'none')
        //       .attr('text-anchor', 'middle')
        //       .style('font-size', '7px')
        //       .attr('dy', '0px')
        //
        //     reserved.drag.timer.g
        //       .transition()
        //       .duration(600)
        //       .attr('x', -70)
        //       .attr('width', 180)
        //       .attr('height', 25)
        //       .attr('fill-opacity', 1)
        //     let hourMinG = reserved.drag.timer.g.append('g').attr('class', 'hourMin')
        //     for (let i = 1; i < 6; i++) {
        //       hourMinG.append('rect')
        //         .attr('class', function (d) {
        //           let date = new Date(reserved.drag.finalTime)
        //           date.setMinutes(date.getMinutes() - i)
        //           return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
        //         })
        //         .attr('x', 0)
        //         .attr('y', 0)
        //         .attr('width', 0)
        //         .attr('height', 15)
        //         .attr('fill', (i % 2 === 1 ? colorTheme.darker.background : colorTheme.darker.background))
        //         .attr('stroke', 'none')
        //         .attr('fill-opacity', 0.4)
        //         .on('mouseover', function (d) {
        //           let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
        //           let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
        //           let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
        //           changeMinute(newDate, newHour, newMin)
        //           d3.select(this).attr('fill-opacity', 0.9)
        //         })
        //         .on('mouseout', function () {
        //           d3.select(this).attr('fill-opacity', 0.4)
        //         })
        //         .transition()
        //         .duration(600)
        //         .attr('x', 5.5 - 15 * i)
        //         .attr('width', 15)
        //       hourMinG.append('text')
        //         .attr('class', 'hourMin-' + i)
        //         .text(function () {
        //           let date = new Date(reserved.drag.finalTime)
        //           date.setMinutes(date.getMinutes() - i)
        //           return d3.timeFormat(':%M')(date)
        //         })
        //         .attr('x', 20)
        //         .attr('y', 10)
        //         .style('font-weight', 'normal')
        //         .style('opacity', 1)
        //         .style('fill-opacity', 0)
        //         .style('fill', '#000000')
        //         .attr('vector-effect', 'non-scaling-stroke')
        //         .style('pointer-events', 'none')
        //         .style('stroke', 'none')
        //         .attr('text-anchor', 'middle')
        //         .style('font-size', '7px')
        //         .attr('dy', '0px')
        //         .transition()
        //         .duration(600)
        //         .style('fill-opacity', 0.7)
        //         .attr('x', 13 - 15 * i)
        //     }
        //     for (let i = 1; i < 6; i++) {
        //       hourMinG.append('rect')
        //         .attr('class', function (d) {
        //           let date = new Date(reserved.drag.finalTime)
        //           date.setMinutes(date.getMinutes() + (i - 1))
        //           return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
        //         })
        //         .attr('x', 0)
        //         .attr('y', 0)
        //         .attr('width', 0)
        //         .attr('height', 15)
        //         .attr('fill', (i % 2 === 1 ? colorTheme.darker.background : colorTheme.darker.background))
        //         .attr('stroke', 'none')
        //         .attr('fill-opacity', 0.4)
        //         .on('mouseover', function (d) {
        //           let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
        //           let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
        //           let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
        //           changeMinute(newDate, newHour, newMin)
        //           d3.select(this).attr('fill-opacity', 0.9)
        //         })
        //         .on('mouseout', function () {
        //           d3.select(this).attr('fill-opacity', 0.4)
        //         })
        //         .transition()
        //         .duration(600)
        //         .attr('x', 19.5 + 15 * i)
        //         .attr('width', 15)
        //       hourMinG.append('text')
        //         .attr('class', 'hourMin+' + (i - 1))
        //         .text(function () {
        //           let date = new Date(reserved.drag.finalTime)
        //           date.setMinutes(date.getMinutes() + (i - 1))
        //           return d3.timeFormat(':%M')(date)
        //         })
        //         .attr('x', 27 + 15 * i)
        //         .attr('y', 10) // - Number(reserved.drag.oldRect.attr('height')))
        //         .style('font-weight', 'normal')
        //         .style('opacity', 1)
        //         .style('fill-opacity', 0.7)
        //         .style('fill', '#000000')
        //         .style('stroke-width', 0.3)
        //         .style('stroke-opacity', 1)
        //         .attr('vector-effect', 'non-scaling-stroke')
        //         .style('pointer-events', 'none')
        //         .style('stroke', 'none')
        //         .attr('text-anchor', 'middle')
        //         .style('font-size', '7px')
        //         .attr('dy', '0px')
        //     }
        //     for (let i = 0; i < 12; i++) {
        //       hourMinG.append('rect')
        //         .attr('class', function (d) {
        //           let date = new Date()
        //           date.setSeconds(5 * i)
        //           return 'hourSec:' + date.getSeconds()
        //         })
        //         .attr('x', 20)
        //         .attr('y', 14)
        //         .attr('width', 0)
        //         .attr('height', 12)
        //         .attr('fill', (i % 2 === 1 ? colorTheme.darker.background : colorTheme.darker.background))
        //         .attr('stroke', '#222222')
        //         .attr('stroke-width', 0.3)
        //         .attr('stroke-dasharray', [0, 5, 5, 8, 6, 21, 6, 3])
        //         .attr('fill-opacity', 0.4)
        //         .on('mouseover', function (d) {
        //           changeSecond(Number(d3.select(this).attr('class').split(':')[1]))
        //           d3.select(this).attr('fill-opacity', 1)
        //         })
        //         .on('mouseout', function () {
        //           d3.select(this).attr('fill-opacity', 0.4)
        //         })
        //         .transition()
        //         .duration(600)
        //         .attr('x', -62 - 8 + 15 * i)
        //         .attr('width', 15)
        //       hourMinG.append('text')
        //         .attr('class', 'Min_sec' + i)
        //         .text(function () {
        //           let date = new Date()
        //           date.setSeconds(5 * i)
        //           return d3.timeFormat(':%S')(date)
        //         })
        //         .attr('x', -62 + 15 * i)
        //         .attr('y', 22) // - Number(reserved.drag.oldRect.attr('height')))
        //         .style('font-weight', 'normal')
        //         .style('opacity', 1)
        //         .style('fill-opacity', 0.7)
        //         .style('fill', '#000000')
        //         .style('stroke-width', 0.3)
        //         .style('stroke-opacity', 1)
        //         .attr('vector-effect', 'non-scaling-stroke')
        //         .style('pointer-events', 'none')
        //         .style('stroke', 'none')
        //         .attr('text-anchor', 'middle')
        //         .style('font-size', '7px')
        //         .attr('dy', '0px')
        //     }
        //   }
        // }
      }
    }
    this.dragTick = dragTick
    function dragEnd (d) {
      reserved.drag.locked = false
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
      // // changeBlockProperties('', d.obId, modif)
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
      // reserved.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.box.w)
      //   .attr('height', reserved.box.h)
      //   .attr('fill', colorTheme.dark.background)
      createQuickAccess()
      initOverview()
      updateOverview()
    }
    this.initData = initData
    function initScrollBox (tag, g, box, background) {
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
        scrollVertical: true,
        scrollHorizontal: false,
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
      }
      function createBlockMapping () {
        let scheds = []
        let inter = getSchedBlocksData()
        for (let key in inter) {
          inter[key].id = key
          scheds.push(inter[key])
        }

        reserved.g.attr('opacity', 0.05)

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

    function initOverview () {
      reserved.overview = {}
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
      }

      let allBox = {
        blocks: {
            x: 0,
            y: 0,
            w: reserved.box.w * 0.8,
            h: reserved.box.h * 0.2
          },
        modifications: {
            x: 0,
            y: reserved.box.h * 0.125,
            h: reserved.box.h * 0.32,
            w: reserved.box.w
          },
        conflicts: {
            x: 0,
            y: reserved.box.h * 0.52,
            w: reserved.box.w,
            h: reserved.box.h * 0.47
          }
      }
      createModificationsInformation()
      createConflictsInformation()
    }
    function updateOverview () {
      let allBox
      function updateBlocksInformation () {
        let box = allBox.blocks
        let g = reserved.g.select('#blocksInformation')

        let tot = shared.data.server.blocks.done.length +
          shared.data.server.blocks.wait.length +
          shared.data.server.blocks.run.length
        let infoState = [
          {state: 'run', nb: shared.data.server.blocks.run.length, percent: shared.data.server.blocks.run.length / tot},
          {state: 'done', nb: 0, percent: 0},
          {state: 'fail', nb: 0, percent: 0},
          {state: 'cancel', nb: 0, percent: 0},
          {state: 'wait', nb: shared.data.server.blocks.wait.length, percent: shared.data.server.blocks.wait.length / tot}
        ]
        for (let i = 0; i < shared.data.server.blocks.done.length; i++) {
          let b = shared.data.server.blocks.done[i]
          if (b.exeState.state === 'done') {
            infoState[1].nb += 1
          } else if (b.exeState.state === 'fail') {
            infoState[2].nb += 1
          } else if (b.exeState.state === 'cancel') {
            // if (hasVar(b.exeState.canRun)) {
            //   if (!b.exeState.canRun) return colorTheme.blocks.cancelOp
            // }
            infoState[3].nb += 1
          }
        }
        infoState[1].percent = infoState[1].nb / tot
        infoState[2].percent = infoState[2].nb / tot
        infoState[3].percent = infoState[3].nb / tot

        let width = box.w * 1
        let offset = 0

        g.select('text#sbs').text(Object.keys(shared.data.server.schedBlocks).length)
        g.select('text#obs').text(tot)

        let rects = g
          .selectAll('g.state')
          .data(infoState, function (d) {
            return d.state
          })
        rects.each(function (d) {
          if (d.percent === 0) return
          d3.select(this).select('rect')
            .attr('x', offset + 1)
            .attr('width', width * d.percent - 2)
          d3.select(this).select('text')
            .text(d.nb)
            .attr('x', offset + 1 + (width * d.percent - 2) * 0.5)
          offset += width * d.percent
        })
      }
      function updatePointingInformation () {
        let box = allBox.targets
        let innerg = reserved.overview.scrollBox.get('innerG')
        let rectBox = {
          y: 0,
          w: box.w,
          h: Math.max(Math.min((box.h - headerSize + 4) / shared.data.server.targets.length, 50), 30)
        }
        let height = rectBox.h * 0.9
        let schedB = getSchedBlocksData()

        let targets = innerg
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
          g.attr('transform', 'translate(' + (0) + ',' + (rectBox.y + rectBox.h * i) + ')')
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
          let nbSched = 0
          let nbObs = 0
          let runningObs = []
          for (let key in schedB) {
            if (schedB[key].target.id === d.id) {
              nbSched += 1
              nbObs += schedB[key].blocks.length
              for (let i = 0; i < schedB[key].blocks.length; i++) {
                if (schedB[key].blocks[i].exeState.state === 'run') {
                  runningObs.push(schedB[key].blocks[i])
                }
              }
            }
          }

          let txt = g.append('text')
            .text(nbSched)
            .attr('x', rectBox.w * 0.15)
            .attr('y', rectBox.h * 0.5)
            .style('font-weight', 'bold')
            .attr('text-anchor', 'start')
            .style('font-size', txtSize + 'px')
            .attr('dy', 0)
            .style('pointer-events', 'none')
            .attr('fill', colorTheme.dark.text)
            .attr('stroke', 'none')
          let bbox = txt.node().getBBox()
          txt = g.append('text')
            .text('\xa0' + 'Sbs')
            .attr('x', bbox.x + bbox.width)
            .attr('y', rectBox.h * 0.5)
            .style('font-weight', '')
            .attr('text-anchor', 'start')
            .style('font-size', txtSize * 0.8 + 'px')
            .attr('dy', 0)
            .style('pointer-events', 'none')
            .attr('fill', colorTheme.dark.text)
            .attr('stroke', 'none')
          bbox = txt.node().getBBox()
          txt = g.append('text')
            .text(nbObs)
            .attr('x', rectBox.w * 0.3)
            .attr('y', rectBox.h * 0.5)
            .style('font-weight', 'bold')
            .attr('text-anchor', 'start')
            .style('font-size', txtSize + 'px')
            .attr('dy', 0)
            .style('pointer-events', 'none')
            .attr('fill', colorTheme.dark.text)
            .attr('stroke', 'none')
          bbox = txt.node().getBBox()
          g.append('text')
            .text('\xa0' + 'Obs')
            .attr('x', bbox.x + bbox.width)
            .attr('y', rectBox.h * 0.5)
            .style('font-weight', '')
            .attr('text-anchor', 'start')
            .style('font-size', txtSize * 0.8 + 'px')
            .attr('dy', 0)
            .style('pointer-events', 'none')
            .attr('fill', colorTheme.dark.text)
            .attr('stroke', 'none')
        })
        let merge = enter.merge(targets)
        merge.each(function (d, i) {
          let g = d3.select(this)
          g.attr('transform', 'translate(' + (0) + ',' + (rectBox.y + rectBox.h * i) + ')')
          let runningObs = []
          for (let key in schedB) {
            if (schedB[key].target.id === d.id) {
              for (let i = 0; i < schedB[key].blocks.length; i++) {
                if (schedB[key].blocks[i].exeState.state === 'run') {
                  runningObs.push(schedB[key].blocks[i])
                }
              }
            }
          }

          let current = g
            .selectAll('g.block')
            .data(runningObs, function (d) {
              return d.obId
            })
          let enter = current
            .enter()
            .append('g')
            .attr('class', 'block')
          enter.each(function (d, i) {
            let color = shared.style.blockCol(d)
            let g = d3.select(this)
            g.attr('transform', 'translate(' + (rectBox.w * 0.5 + rectBox.w * 0.09 * i) + ',' + (0) + ')')
            g.append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', rectBox.w * 0.08)
              .attr('height', rectBox.h * 0.8)
              .attr('fill', color.background)
              .attr('stroke', color.stroke)
              .attr('stroke-width', 0.2)
              .on('click', function () {
                focusManager.focusOn('block', d.obId)
              })
              .on('mouseover', function (d) {
                d3.select(this).style('cursor', 'pointer')
              })
              .on('mouseout', function (d) {
                d3.select(this).style('cursor', 'default')
              })
            g.append('text')
              .text(d.metaData.blockName.replace(' ', ''))
              .style('fill', color.text)
              .style('font-weight', '')
              .style('font-size', txtSize * 0.8 + 'px')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(' + (rectBox.w * 0.04) + ',' + (rectBox.h * 0.4 + txtSize * 0.3) + ')')
              .style('pointer-events', 'none')
          })
          let merge = current.merge(enter)
          merge.each(function (d, i) {
            let g = d3.select(this)
            g.attr('transform', 'translate(' + (rectBox.w * 0.45 + rectBox.w * 0.09 * i) + ',' + (0) + ')')
          })
          current
            .exit()
            .transition('inOut')
            .duration(timeD.animArc)
            .style('opacity', 0)
            .remove()
        })
        targets
          .exit()
          .transition('inOut')
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()
        reserved.overview.scrollBox.updateVerticalScroller({canScroll: true, scrollHeight: shared.data.server.targets.length * rectBox.h})
      }
      function updateTelescopeInformation () {
        reserved.telescopeRunning.updateData({
          data: {
            raw: {
              telescopes: shared.data.server.telHealth,
              blocks: shared.data.server.blocks.run
            },
            modified: []
          }
        })
      }
      if (shared.mode === 'inspector') {
        allBox = {
          blocks: {
            x: 0,
            y: 0,
            w: reserved.box.w * 0.8,
            h: reserved.box.h * 0.2
          },
          targets: {
            x: 0,
            y: reserved.box.h * 0.125,
            h: reserved.box.h * 0.3,
            w: reserved.box.w
          },
          tels: {
            x: 0,
            y: reserved.box.h * 0.52,
            w: reserved.box.w,
            h: reserved.box.h * 0.47
          }
        }
        updateBlocksInformation()
        updatePointingInformation()
        updateTelescopeInformation()
      }
    }

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
          w: box.rightInfo.w * 0.8,
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
          h: box.rightInfo.h * 0.3
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
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        schedule: {
          editabled: true,
          box: allBox.time,
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
          schedB: schedB,
          timeOfNight: shared.data.server.timeOfNight,
          target: getTargetById(schedB.target.id)
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
      reserved.schedblockForm.init()
    }
    function focusOnSchedBlock (bId) {
      clean()
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

      let tels = {
        large: [],
        medium: [],
        small: []
      }
      for (let i = 0; i < data.telIds.length; i++) {
        let id = data.telIds[i]
        if (id[0] === 'S') {
          tels.small.push(getTelescopeById(id))
        } else if (id[0] === 'M') {
          tels.medium.push(getTelescopeById(id))
        } else if (id[0] === 'L') {
          tels.large.push(getTelescopeById(id))
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
            click: focusManager.focusOn,
            over: () => {},
            out: () => {}
          }
        },
        schedule: {
          editabled: true,
          box: allBox.time,
          events: {
            click: undefined,
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
          target: getTargetById(data.targetId),
          tels: tels
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
      createBlocksInfoPanel(bId)
    }
    this.focusOnBlock = focusOnBlock

    function createTargetInfoPanel (id) {
      let tar = getTargetById(id)
      let inter = createSchedBlocks(shared.data.server.blocks)
      let scheds = []
      for (let key in inter) {
        if (inter[key].target.id !== tar.id) continue
        inter[key].id = key
        scheds.push(inter[key])
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
          h: reserved.box.h * 0.2,
          w: reserved.box.w
        },
        target: {
          x: box.rightInfo.w * 0.0,
          y: box.rightInfo.h * 0.4,
          w: box.rightInfo.w * 1.0,
          h: box.rightInfo.h * 0.3
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
      for (let key in shared.data.server.blocks) {
        blocks = blocks.concat(shared.data.server.blocks[key])
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
      createTelescopeInfoPanel(telId)
    }
    this.focusOnTelescope = focusOnTelescope

    function clean () {
      reserved.g.selectAll('*').remove()
      console.log();
      if (shared.focus === undefined) {
        initOverview()
        updateOverview()
      }
    }
    this.clean = clean
  }

  let svgBlocksQueueServer = new SvgBlocksQueueServer()
  let svgBrush = new SvgBrush()
  let svgWarningArea = new SvgWarningArea()
  let svgTargets = new SvgTargets()
  let svgTelsConflict = new SvgTelsConflict()
  let svgFocusOverlay = new SvgFocusOverlay()
  let svgRightInfo = new SvgRightInfo()
}
