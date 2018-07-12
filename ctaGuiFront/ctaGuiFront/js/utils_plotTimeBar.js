// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
// window.loadScript({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global colsMix */
/* global deepCopy */

window.PlotTimeBar = function () {
  let com = {}

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------

  function initAxis (optIn) {
    com.top = {}
    com.top.axis = {}
    com.top.scale = {}
    com.top.g = {}
    com.top.g.axis = com.gBox.append('g')

    com.bot = {}
    com.bot.axis = {}
    com.bot.scale = {}
    com.bot.g = {}
    com.bot.g.axis = com.gBox.append('g')

    com.top.box = {
      x: com.innerBox.x,
      y: 0.2 * com.innerBox.h,
      w: com.innerBox.w,
      h: com.innerBox.h * 0.1,
      margWidth: com.innerBox.margWidth,
      margHeight: com.innerBox.margHeight
    }

    com.bot.box = {
      x: com.top.box.x,
      y: com.innerBox.h * 0.8,
      w: com.top.box.w,
      h: com.innerBox.h * 0.6,
      margWidth: com.innerBox.margWidth,
      margHeight: com.innerBox.margHeight
    }

    com.top.axis.transX =
      'translate(' +
      com.top.box.x +
      ',' +
      (com.top.box.y) +
      ')'
    com.bot.axis.transX =
      'translate(' +
      com.bot.box.x +
      ',' +
      (com.bot.box.y) +
      ')'

    com.top.scale.x = d3.scaleTime().range([0, com.top.box.w])
    com.top.scale.y = d3.scaleLinear().range([com.bot.box.h, 0])

    com.bot.scale.x = d3.scaleTime().range([0, com.bot.box.w])

    com.bot.scale.y = d3.scaleLinear().range([0, com.bot.box.h])
    com.bot.scale.y.domain([105, 0])

    com.top.axis.x = d3.axisTop(com.top.scale.x)
    if (optIn.isPartofPlot) com.top.axis.x = d3.axisBottom(com.top.scale.x)
    com.bot.axis.x = d3.axisBottom(com.bot.scale.x)
    // com.bot.axis.y = d3.axisLeft(com.top.scale.y)

    com.top.g.axis
      .append('g')
      .attr('class', 'axisX')
      .attr('transform', com.top.axis.transX)
      .call(com.top.axis.x)
    com.bot.g.axis
      .append('g')
      .attr('class', 'axisX')
      .attr('transform', com.bot.axis.transX)
      .call(com.bot.axis.x)
    // com.top.g.axis
    //   .append('g')
    //   .attr('class', 'axisY')
    //   .attr('transform', com.top.axis.transX)
    //   .call(com.bot.axis.y)
  }
  function initMiddle (optIn) {
    com.parse = {}
    com.parse.x = d3.timeParse('%Q')
    com.parse.y = function (d) {
      return +d
    }

    com.middle = {}
    com.middle.range = com.bot.scale.x.range()
    com.middle.box = {
      x: com.bot.box.x,
      y: com.top.box.y,
      w: com.bot.box.w,
      h: com.innerBox.h * 0.6
    }

    com.top.g.data = com.gBox.append('g')
    com.bot.g.data = com.gBox.append('g')
    com.bot.g.brush = com.bot.g.data.append('g')

    // comment data 1
    // com.top.g.data.attr(
    //   'transform',
    //   'translate(' + com.top.box.x + ',' + com.top.box.y + ')'
    // )

    com.bot.g.data.attr(
      'transform',
      'translate(' + com.middle.box.x + ',' + com.middle.box.y + ')'
    )

    com.top.domain = null

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.tagClipPath = optIn.tagClipPath

    // comment data 2
    if (!hasVar(com.tagClipPath)) {
      com.tagClipPath = {
        top: com.mainTag + 'clipPathTop',
        bot: com.mainTag + 'clipPathBot'
      }
    }

    let topBot = com.bot

    topBot.defs = topBot.g.data.append('defs')
    topBot.clipPath = topBot.defs
      .append('clipPath')
      .attr('id', com.tagClipPath.top)

    console.log(topBot.box)
    topBot.clipRec = topBot.clipPath
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', com.middle.box.w)
      .attr('height', com.middle.box.h)
    topBot.g.data.attr('clip-path', 'url(#' + com.tagClipPath.top + ')')
  }
  function init (optIn) {
    if (hasVar(com.mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }

    com.mainTag = optIn.tag
    com.locker = optIn.locker
    com.runLoop = optIn.runLoop

    let lockerZoom = optIn.lockerZoom
    if (!hasVar(lockerZoom)) {
      lockerZoom = {
        all: com.mainTag + 'zoom',
        during: com.mainTag + 'zoomDuring',
        end: com.mainTag + 'zoomEnd'
      }
    }
    com.lockerZoom = lockerZoom

    let lockerV = {}
    lockerV.lockerV = hasVar(optIn.lockerV) ? optIn.lockerV : []
    lockerV.zoomDuring = lockerV.lockerV
      .slice()
      .concat([lockerZoom.during])
    lockerV.zoomEnd = lockerV.lockerV
      .slice()
      .concat([lockerZoom.end])
    com.lockerV = lockerV

    com.yAxisMarginFrac = hasVar(optIn.yAxisMarginFrac)
      ? optIn.yAxisMarginFrac
      : 0.5

    com.forceUpdate = hasVar(optIn.forceUpdate) ? optIn.forceUpdate : false

    setStyle(optIn.style)
    com.plotTimeSeries = []
    com.gBox = optIn.gBox
    com.outerBox = deepCopy(optIn.boxData)
    com.outerBox.x = 0
    com.outerBox.y = 0
    com.innerBox = {
      x: com.outerBox.x,
      y: com.outerBox.y,
      w: com.outerBox.w,
      h: com.outerBox.h,
      margWidth: com.outerBox.margWidth,
      margHeight: com.outerBox.margHeight
    }
    com.boxTrans = { x: optIn.boxData.x, y: optIn.boxData.y, k: 1 }
    transScaleBox()

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------

    com.hasBot = true
    initAxis(optIn)
    initMiddle(optIn)

    setupZoomBrush()
  }
  this.init = init

  function plugPlotTimeSeries (plotTimeSeries) {
    com.plotTimeSeries.push(plotTimeSeries)
  }
  this.plugPlotTimeSeries = plugPlotTimeSeries
  function unplugPlotTimeSeries () {

  }
  this.unplugPlotTimeSeries = unplugPlotTimeSeries
  // ---------------------------------------------------------------------------------------------------
  // styling
  // ---------------------------------------------------------------------------------------------------
  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    com.style = {}

    com.style.hasOutline = hasVar(optIn.hasOutline) ? optIn.hasOutline : false
  }
  this.setStyle = setStyle
  function transScaleBox (optIn) {
    let duration = 0
    if (hasVar(optIn)) {
      if (hasVar(optIn.x)) {
        duration = timeD.animArc
        com.boxTrans.x = optIn.x
      }
      if (hasVar(optIn.y)) {
        duration = timeD.animArc
        com.boxTrans.y = optIn.y
      }
      if (hasVar(optIn.k)) {
        duration = timeD.animArc
        com.boxTrans.k = optIn.k
      }
      if (hasVar(optIn.duration)) {
        duration = optIn.duration
      }
    }

    let trans =
      'translate(' +
      com.boxTrans.x +
      ',' +
      com.boxTrans.y +
      ')scale(' +
      com.boxTrans.k +
      ')'

    if (duration > 0) {
      com.gBox
        .transition('moveBox')
        .duration(duration)
        .attr('transform', trans)
    } else com.gBox.attr('transform', trans)
  }
  this.transScaleBox = transScaleBox

  // function updateTopAxis (dataIn) {
  //   com.top.g.axis
  //     .selectAll('.axisX')
  //     .transition('inOut')
  //     .duration(timeD.animArc)
  //     .call(com.top.axis.x)
  // }
  function updateTopAxis (optIn) {
    if (!hasVar(optIn)) optIn = {}
    com.top.g.axis.selectAll('.axisX').call(com.top.axis.x)
    optIn.topScaleX = com.top.scale.x

    for (var i = 0; i < com.plotTimeSeries.length; i++) {
      com.plotTimeSeries[i].updateAxisPlot(optIn)
    }
  }
  function updateBottomAxis (dataIn) {
    com.bot.g.axis
      .selectAll('.axisX')
      .transition('inOut')
      .duration(timeD.animArc)
      .call(com.bot.axis.x)
  }
  function updateBrushPosition () {
    com.bot.g.brush
      .transition('inOut')
      .duration(timeD.animArc)
      .call(com.bot.brush.move, com.middle.range)
  }
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  // com.updateupdateupdate=0;
  function updateLine (dataIn) {
    updateCirc(dataIn)
    updateBrushPosition()
  }
  this.updateLine = updateLine

  function updateBottomAxisDomain (data) {
    // Update Bottom Axis according to Data
    com.bot.scale.x.domain(
      d3.extent(data, function (d) {
        return d.x
      })
    )
    updateBottomAxis()
    if (com.top.domain) {
      let thisDom = com.bot.scale.x.domain()
      let prevDom = [com.top.domain[0], com.top.domain[1]]
      let thisDelta = thisDom[1] - thisDom[0]
      let prevDelta = prevDom[1] - prevDom[0]

      prevDom[0] = Math.max(prevDom[0], thisDom[0])
      prevDom[1] = prevDom[0] + prevDelta
      prevDom[1] = Math.min(prevDom[1], thisDom[1])
      prevDom = [com.parse.x(prevDom[0]), com.parse.x(prevDom[1])]

      com.middle.range = [
        com.top.box.w * (prevDom[0] - thisDom[0]) / thisDelta,
        com.top.box.w * (prevDom[1] - thisDom[0]) / thisDelta
      ]
      com.top.domain = prevDom
      com.top.scale.x.domain(prevDom)
    } else {
      com.middle.range = com.bot.scale.x.range()
      com.top.scale.x.domain(com.bot.scale.x.domain())
    }
    updateTopAxis()
  }
  this.updateBottomAxisDomain = updateBottomAxisDomain

  function updateCirc (dataIn) {
    let data = dataIn.data
    let tag = dataIn.tag

    let lineData = []
    $.each(data, function (i, d) {
      if (i === data.length - 1) return

      let d0 = data[i]
      let d1 = data[i + 1]
      lineData.push({
        id: d0.id + d1.id,
        x1: d0.x,
        y1: d0.y,
        x2: d1.x,
        y2: d1.y
      })
    })

    com.lineClass = tag + 'line'
    let line = com.bot.g.data
      .selectAll('line.' + com.lineClass)
      .data(lineData, function (d) {
        return d.id
      })
    line
      .enter()
      .append('line')
      .attr('class', com.lineClass)
      .attr('stroke-opacity', 0)
      .attr('x1', function (d, i) {
        return com.bot.scale.x(d.x1)
      })
      .attr('x2', function (d, i) {
        return com.bot.scale.x(d.x2)
      })
      .attr('y1', function (d, i) {
        return com.bot.scale.y(d.y1)
      })
      .attr('y2', function (d, i) {
        return com.bot.scale.y(d.y2)
      })
      .style('stroke-width', 1)
      .style('pointer-events', 'none')
      .style('vector-effect', 'non-scaling-stroke')
      // .style("stroke-dasharray",  "5,1")
      .attr('stroke', '#000099')
      .merge(line)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('stroke-opacity', 0.5)
      .attr('x1', function (d, i) {
        return com.bot.scale.x(d.x1)
      })
      .attr('x2', function (d, i) {
        return com.bot.scale.x(d.x2)
      })
      .attr('y1', function (d, i) {
        return com.bot.scale.y(d.y1)
      })
      .attr('y2', function (d, i) {
        return com.bot.scale.y(d.y2)
      })

    line
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('stroke-opacity', 0)
      .remove()

    let nTopBot = 1
    if (!hasVar(com.circClass)) com.circClass = {}
    com.circClass[nTopBot] = com.mainTag + 'circ' + nTopBot

    // let circ = topBot.g.data
    //   .selectAll('circle.' + com.circClass[nTopBot])
    //   .data(data, function (d) {
    //     return d.id
    //   })
    //
    // circ
    //   .enter()
    //   .append('circle')
    //   .attr('class', com.circClass[nTopBot])
    //   .style('opacity', 0)
    //   .attr('stroke-opacity', 1)
    //   .style('fill-opacity', 0.7)
    //   .attr('vector-effect', 'non-scaling-stroke')
    //   .attr('cx', function (d) {
    //     return topBot.scale.x(d.x)
    //   })
    //   .attr('cy', function (d) {
    //     return topBot.scale.y(d.y)
    //   })
    //   .attr('r', 2)
    //   .attr('fill', colsMix[nTopBot])
    //   .attr('pointer-events', pointerEvents)
    //   .merge(circ)
    //   .transition('inOut')
    //   .duration(timeD.animArc)
    //   .style('opacity', 1)
    //   .attr('cx', function (d) {
    //     return topBot.scale.x(d.x)
    //   })
    //   .attr('cy', function (d) {
    //     return topBot.scale.y(d.y)
    //   })
    //
    // circ
    //   .exit()
    //   .transition('inOut')
    //   .duration(timeD.animArc)
    //   .style('opacity', 0)
    //   .remove()
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setupZoomBrush () {
    let locker = com.locker
    let lockerV = com.lockerV
    let lockerZoom = com.lockerZoom

    function initZoomBrush () {
      com.zoom = {}
      com.zoom.sel = {}
      com.zoom.trans = {}

      com.zoom.zoom = d3
        .zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [com.top.box.w, com.top.box.h]])
        .extent([[0, 0], [com.top.box.w, com.top.box.h]])

      com.zoom.zoom
        .on('start', function (d) {
          com.zoomStart(this)
        })
        .on('zoom', function (d) {
          com.zoomDuring(this)
        })
        .on('end', function (d) {
          com.zoomEnd(this)
        })

      com.gBox.on('wheel', function () {
        d3.event.preventDefault()
      })

      com.bot.brush = d3
        .brushX()
        .extent([[0, 0], [com.bot.box.w, com.bot.box.h]])

      com.bot.brush
        .on('start', com.brushStart)
        .on('brush', com.brushDuring)
        .on('end', com.brushEnd)

      com.brushClass = com.mainTag + 'brush'
      com.bot.g.brush
        .attr('class', com.brushClass)
        .call(com.bot.brush)
        .call(com.zoom.zoom)

      com.zoom.sel[com.brushClass] = function () {
        return com.bot.g.brush
      }
    }

    com.zoomStart = function (ele) {
      com.isInZoom = true
    }
    com.zoomDuring = function (ele) {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return // ignore zoom-by-brush

      com.inUserZoom = hasVar(d3.event.sourceEvent)

      if (locker.isFreeV(lockerV.zoomDuring)) {
        locker.add({ id: lockerZoom.all, override: true })
        locker.add({ id: lockerZoom.during, override: true })

        // Update top Axis
        let trans = d3.event.transform
        com.top.domain = trans.rescaleX(com.bot.scale.x).domain()
        com.top.scale.x.domain(com.top.domain)
        updateTopAxis()

        // Update Grey Brush Position and Size
        com.bot.g.brush.call(
          com.bot.brush.move,
          com.top.scale.x.range().map(trans.invertX, trans)
        )

        locker.remove({ id: lockerZoom.during })
      }
    }
    com.zoomEnd = function (ele) {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return // ignore zoom-by-brush

      // let trans = d3.event.transform
      // let srcClass = d3.select(ele).attr('class')
      //
      // com.zoom.trans[srcClass] = trans

      // check if we are zoomed out (full range shown)
      if (com.top.domain) {
        let isSame0 = com.top.domain[0] - com.bot.scale.x.domain()[0] <= 0
        let isSame1 = com.top.domain[1] - com.bot.scale.x.domain()[1] >= 0
        if (isSame0 && isSame1) com.top.domain = null
      }
      updateTopAxis()
      com.isInZoom = false
      locker.remove({
        id: lockerZoom.all,
        override: true,
        delay: timeD.animArc
      })

      // let sel = Object.keys(com.zoom.sel).filter(function (d) {
      //   return com.zoom.trans[d] !== trans
      // })

      // doDomainTrans({ trans: trans, sel: sel })
    }

    com.brushStart = function () {
      com.isInBrush = true
    }
    com.brushDuring = function () {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return // ignore brush-by-zoom
      // console.log('brushDuring');

      if (locker.isFreeV(lockerV.zoomDuring)) {
        locker.add({ id: lockerZoom.all, override: true })
        locker.add({ id: lockerZoom.during, override: true })

        if (d3.event.sourceEvent) {
          let s = d3.event.selection || com.bot.scale.x.range()

          // Update Top Axis
          com.top.scale.x.domain(s.map(com.bot.scale.x.invert, com.bot.scale.x))
          com.top.domain = com.top.scale.x.domain()
          updateTopAxis()

          // Keep Track of brush position to prevent jump when zoom
          let k = com.top.box.w / (s[1] - s[0])
          let x = -s[0]
          let t = d3.zoomIdentity.scale(k).translate(x, 0)
          $.each(com.zoom.sel, function (selName, selFunc) {
            selFunc().call(com.zoom.zoom.transform, t)
          })
        }

        locker.remove({ id: lockerZoom.during })
      }
    }
    com.brushEnd = function () {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return // ignore brush-by-zoom

      // check if we are zoomed out (full range shown)
      if (com.top.domain) {
        let isSame0 = com.top.domain[0] - com.bot.scale.x.domain()[0] <= 0
        let isSame1 = com.top.domain[1] - com.bot.scale.x.domain()[1] >= 0
        if (isSame0 && isSame1) com.top.domain = null
      }
      updateTopAxis()

      com.isInBrush = false
      locker.remove({
        id: lockerZoom.all,
        override: true,
        delay: timeD.animArc
      })
    }

    initZoomBrush()
  }
  // function doDomainTrans (optIn) {
  //   for (var i = 0; i < com.plotTimeSeries.length; i++) {
  //     com.plotTimeSeries[i].doDomainTrans(optIn)
  //   }
  // }
}
