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

window.PlotTimeSeries = function () {
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
  function init (optIn) {
    if (hasVar(com.mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }

    com.mainTag = optIn.tag
    com.checkFree = optIn.checkFree
    com.runLoop = optIn.runLoop

    let checkFreeZoom = optIn.checkFreeZoom
    if (!hasVar(checkFreeZoom)) {
      checkFreeZoom = {
        all: com.mainTag + 'zoom',
        during: com.mainTag + 'zoomDuring',
        end: com.mainTag + 'zoomEnd'
      }
    }
    com.checkFreeZoom = checkFreeZoom

    let checkFreeV = {}
    checkFreeV.checkFreeV = hasVar(optIn.checkFreeV) ? optIn.checkFreeV : []
    checkFreeV.zoomDuring = checkFreeV.checkFreeV
      .slice()
      .concat([checkFreeZoom.during])
    checkFreeV.zoomEnd = checkFreeV.checkFreeV
      .slice()
      .concat([checkFreeZoom.end])
    com.checkFreeV = checkFreeV

    com.yAxisMarginFrac = hasVar(optIn.yAxisMarginFrac)
      ? optIn.yAxisMarginFrac
      : 0.5

    com.forceUpdate = hasVar(optIn.forceUpdate) ? optIn.forceUpdate : false

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------
    com.outerBox = deepCopy(optIn.boxData)
    com.outerBox.x = 0
    com.outerBox.y = 0

    com.innerBox = {
      x: com.outerBox.x + com.outerBox.marg,
      y: com.outerBox.y + com.outerBox.marg,
      w: com.outerBox.w - 2 * com.outerBox.marg,
      h: com.outerBox.h - 2 * com.outerBox.marg,
      marg: com.outerBox.marg
    }

    com.boxTrans = { x: optIn.boxData.x, y: optIn.boxData.y, k: 1 }

    com.hasBot = optIn.hasBotPlot

    com.gBox = optIn.gBox
    transScaleBox()

    // com.outerG = com.gBox.append("g");
    // com.innerG = com.gBox.append("g");
    // let innerScale  = 0.9;
    // let innerTransX = 0.5*(1-innerScale)*com.outerBox.w;
    // let innerTransY = 0.5*(1-innerScale)*com.outerBox.h;
    // com.innerG.attr("transform", function(d,i) {
    //   return
    //   "translate("+(innerTransX)+","+(innerTransY)+")"+"scale("+(innerScale)+")";
    // })

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.top = {}
    com.bot = {}
    com.top.scale = {}
    com.top.axis = {}
    com.bot.axis = {}
    com.bot.scale = {}

    com.parse = {}
    com.parse.x = d3.timeParse('%Q')
    com.parse.y = function (d) {
      return +d
    }

    let botRelH = 0.25
    let padd = com.innerBox.w * 0.01

    if (com.hasBot) {
      com.top.box = {
        x: com.innerBox.x,
        y: com.innerBox.y,
        w: com.innerBox.w,
        h: com.innerBox.h * (1 - botRelH),
        marg: com.innerBox.marg
      }

      com.top.box.x += padd * 4
      com.top.box.y += padd * 1
      com.top.box.w -= padd * 5
      com.top.box.h -= padd * 5

      com.bot.box = {
        x: com.top.box.x,
        y: com.top.box.y + com.top.box.h,
        w: com.top.box.w,
        h: com.innerBox.h - com.top.box.h,
        marg: com.top.box.marg
      }

      com.bot.box.h -= padd * 8
      com.bot.box.y += padd * 4

      com.top.axis.transX =
        'translate(' +
        com.top.box.x +
        ',' +
        (com.top.box.y + com.top.box.h + padd) +
        ')'
      com.top.axis.transY =
        'translate(' + (com.top.box.x - padd) + ',' + com.top.box.y + ')'
      com.bot.axis.transX =
        'translate(' +
        com.bot.box.x +
        ',' +
        (com.bot.box.y + com.bot.box.h + padd) +
        ')'

      // com.testClip = true;
    } else {
      com.top.box = com.innerBox
      com.bot.box = null
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.top.g = {}
    com.bot.g = {}
    com.bck = {}
    com.bck.g = com.gBox.append('g')
    com.top.g.axis = com.gBox.append('g')
    com.bot.g.axis = com.gBox.append('g')
    com.top.g.data = com.gBox.append('g')
    com.bot.g.data = com.gBox.append('g')
    com.bot.g.brush = com.bot.g.data.append('g')

    com.top.g.data.attr(
      'transform',
      'translate(' + com.top.box.x + ',' + com.top.box.y + ')'
    )

    if (com.hasBot) {
      com.bot.g.data.attr(
        'transform',
        'translate(' + com.bot.box.x + ',' + com.bot.box.y + ')'
      )
    }

    com.top.domain = null

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.tagClipPath = optIn.tagClipPath
    if (!hasVar(com.tagClipPath)) {
      com.tagClipPath = {
        top: com.mainTag + 'clipPathTop',
        bot: com.mainTag + 'clipPathBot'
      }
    }

    $.each([false, true], function (nTopBot, isBot) {
      if (!com.hasBot && isBot) return
      let topBot = isBot ? com.bot : com.top

      topBot.defs = topBot.g.data.append('defs')
      topBot.clipPath = topBot.defs
        .append('clipPath')
        .attr('id', com.tagClipPath.top)

      // topBot.g.data.append("rect").attr("class", "testRec"+isBot)
      topBot.clipRec = topBot.clipPath
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        // .attr("x",topBot.box.x).attr("y",topBot.box.y)
        .attr('width', topBot.box.w)
        .attr('height', topBot.box.h)
      // .attr("fill", 'transparent')
      // .attr("stroke", colsMix[3])
      // .attr("stroke-width", 8)
      // .attr("stroke-opacity", 0.5)

      topBot.g.data.attr('clip-path', 'url(#' + com.tagClipPath.top + ')')
    })

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    setStyle(optIn.style)

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    initPlot()
    setupZoomBrush()
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  // styling
  // ---------------------------------------------------------------------------------------------------
  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    com.style = {}

    com.style.hasOutline = hasVar(optIn.hasOutline) ? optIn.hasOutline : false
    com.style.bckColor = hasVar(optIn.bckColor) ? optIn.bckColor : '#F2F2F2'
  }
  this.setStyle = setStyle

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function initPlot () {
    com.top.scale.x = d3.scaleTime().range([0, com.top.box.w])
    com.top.scale.y = d3.scaleLinear().range([com.top.box.h, 0])
    if (com.hasBot) {
      com.bot.scale.x = d3.scaleTime().range([0, com.bot.box.w])
      com.bot.scale.y = d3.scaleLinear().range([com.bot.box.h, 0])
    }

    com.top.axis.x = d3.axisBottom(com.top.scale.x)
    com.top.axis.y = d3.axisLeft(com.top.scale.y)
    if (com.hasBot) {
      com.bot.axis.x = d3.axisBottom(com.bot.scale.x)
    }

    com.top.g.axis
      .append('g')
      .attr('class', 'axisX')
      .attr('transform', com.top.axis.transX)
      .call(com.top.axis.x)

    com.top.g.axis
      .append('g')
      .attr('class', 'axisY')
      .attr('transform', com.top.axis.transY)
      .call(com.top.axis.y)

    if (com.hasBot) {
      com.bot.g.axis
        .append('g')
        .attr('class', 'axisX')
        .attr('transform', com.bot.axis.transX)
        .call(com.bot.axis.x)
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  // com.updateupdateupdate=0;
  function update (dataIn) {
    // if(com.updateupdateupdate > 1e4) return; else com.updateupdateupdate+=1;

    let data = dataIn.map(function (d) {
      return { id: d.x, x: com.parse.x(d.x), y: com.parse.y(d.y) }
    })
    data.sort(function (a, b) {
      return a.x - b.x
    })

    let dataIds = data.map(function (d) {
      return d.id
    })

    if (hasVar(com.dataIds) && !com.forceUpdate) {
      if (com.dataIds.length === dataIds.length) {
        let hasNewData = false
        $.each(dataIds, function (i, id) {
          if (com.dataIds[i] !== id) hasNewData = true
        })
        if (!hasNewData) return
      }
    }

    com.data = data
    com.dataIds = dataIds

    // //
    // ===========================================================================
    // //
    // ===========================================================================
    // com.data = com.data.slice(com.data.length-60,com.data.length)
    // //
    // ===========================================================================
    // //
    // ===========================================================================

    com.top.scale.x.domain(
      d3.extent(com.data, function (d) {
        return d.x
      })
    )
    updateDomainY()

    if (com.hasBot) {
      com.bot.scale.x.domain(com.top.scale.x.domain())
      com.bot.scale.y.domain(com.top.scale.y.domain())
    }
    if (com.hasBot) {
      com.bot.g.axis
        .selectAll('.axisX')
        .transition('inOut')
        .duration(timeD.animArc)
        .call(com.bot.axis.x)
    }

    let range = com.top.scale.x.range()

    // if we are zoomed-in, preserve the domain
    if (com.top.domain) {
      let thisDom = com.top.scale.x.domain()
      let prevDom = [com.top.domain[0], com.top.domain[1]]
      let thisDelta = thisDom[1] - thisDom[0]
      let prevDelta = prevDom[1] - prevDom[0]

      prevDom[0] = Math.max(prevDom[0], thisDom[0])
      prevDom[1] = prevDom[0] + prevDelta
      prevDom[1] = Math.min(prevDom[1], thisDom[1])
      prevDom = [com.parse.x(prevDom[0]), com.parse.x(prevDom[1])]

      range = [
        com.top.box.w * (prevDom[0] - thisDom[0]) / thisDelta,
        com.top.box.w * (prevDom[1] - thisDom[0]) / thisDelta
      ]
      com.top.domain = prevDom

      com.top.scale.x.domain(prevDom)

      updateDomainY()
    }

    com.top.g.axis
      .selectAll('.axisX')
      .transition('inOut')
      .duration(timeD.animArc)
      .call(com.top.axis.x)

    com.top.g.axis
      .selectAll('.axisY')
      .transition('inOut')
      .duration(timeD.animArc)
      .call(com.top.axis.y)

    updateCirc({ data: com.data })

    if (com.hasBot) {
      com.bot.g.brush
        .transition('inOut')
        .duration(timeD.animArc)
        .call(com.bot.brush.move, range)
    }
  }
  this.update = update

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateCirc (optIn) {
    let data = optIn.data

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

    com.lineClass = com.mainTag + 'line'
    let line = com.top.g.data
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
        return com.top.scale.x(d.x1)
      })
      .attr('x2', function (d, i) {
        return com.top.scale.x(d.x2)
      })
      .attr('y1', function (d, i) {
        return com.top.scale.y(d.y1)
      })
      .attr('y2', function (d, i) {
        return com.top.scale.y(d.y2)
      })
      .style('stroke-width', 1)
      .style('pointer-events', 'none')
      .style('vector-effect', 'non-scaling-stroke')
      // .style("stroke-dasharray",  "5,1")
      .attr('stroke', colsMix[0])
      .merge(line)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('stroke-opacity', 0.5)
      .attr('x1', function (d, i) {
        return com.top.scale.x(d.x1)
      })
      .attr('x2', function (d, i) {
        return com.top.scale.x(d.x2)
      })
      .attr('y1', function (d, i) {
        return com.top.scale.y(d.y1)
      })
      .attr('y2', function (d, i) {
        return com.top.scale.y(d.y2)
      })

    line
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('stroke-opacity', 0)
      .remove()

    $.each([false, true], function (nTopBot, isBot) {
      if (!com.hasBot && isBot) return
      let topBot = isBot ? com.bot : com.top
      // let pointerEvents = isBot ? 'none'   : 'auto';
      let pointerEvents = 'none'

      if (!hasVar(com.circClass)) com.circClass = {}
      com.circClass[nTopBot] = com.mainTag + 'circ' + nTopBot

      let circ = topBot.g.data
        .selectAll('circle.' + com.circClass[nTopBot])
        .data(data, function (d) {
          return d.id
        })

      circ
        .enter()
        .append('circle')
        .attr('class', com.circClass[nTopBot])
        .style('opacity', 0)
        .attr('stroke-opacity', 1)
        .style('fill-opacity', 0.7)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('cx', function (d) {
          return topBot.scale.x(d.x)
        })
        .attr('cy', function (d) {
          return topBot.scale.y(d.y)
        })
        .attr('r', 5)
        .attr('fill', colsMix[nTopBot])
        // .attr("stroke-width", com.style.strokeWidth)
        // .attr("fill", function(d,i) { return
        // com.style.fill(d,d.data.nBlock); }) .attr("stroke", function(d,i) {
        // return com.style.stroke(d,d.data.nBlock); })
        // .attr("stroke-opacity", com.style.strokeOpacity)
        .attr('pointer-events', pointerEvents)
        // .call(com.zoom.zoom)
        // .on('click', com.style.click)
        .merge(circ)
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 1)
        .attr('cx', function (d) {
          return topBot.scale.x(d.x)
        })
        .attr('cy', function (d) {
          return topBot.scale.y(d.y)
        })
      // .attr("r", com.style.r)
      // .attr("stroke-width", com.style.strokeWidth)
      // .style("opacity", com.style.opacity)
      // .attr("fill", function(d,i) { return com.style.fill(d,d.data.nBlock);
      // }) .attr("stroke", function(d) { return
      // com.style.stroke(d,d.data.nBlock); }) .attr("stroke-opacity",
      // com.style.strokeOpacity)

      circ
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()

      // if(!isBot) {
      //   if(!hasVar(com.zoom.sel[com.circClass[nTopBot]])) {
      //     com.zoom.sel[com.circClass[nTopBot]] = function(){
      //       return topBot.g.data.selectAll("circle."+com.circClass[nTopBot]);
      //     };
      //   }
      // }
    })
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setupZoomBrush () {
    let checkFree = com.checkFree
    let checkFreeV = com.checkFreeV
    let checkFreeZoom = com.checkFreeZoom

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

      com.bckClass = com.mainTag + 'outlineRect'
      com.bck.g
        .append('rect')
        .attr('class', com.bckClass)
        .attr('x', com.outerBox.x)
        .attr('y', com.outerBox.y)
        .attr('width', com.outerBox.w)
        .attr('height', com.outerBox.h)
        .attr('fill', com.style.bckColor)
        // .style("pointer-events", "none")
        .attr('stroke', '#383B42')
        .attr('stroke-width', '1')
        .attr('stroke-opacity', com.style.hasOutline ? 0.6 : 0)
        .call(com.zoom.zoom, { xx: true })
        .on('dblclick.zoom', null)

      com.zoom.sel[com.bckClass] = function () {
        return com.bck.g.selectAll('rect.' + com.bckClass)
      }

      com.gBox.on('wheel', function () {
        d3.event.preventDefault()
      })

      if (com.hasBot) {
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

      if (com.testClip) {
        $.each([false, true], function (nTopBot, isBot) {
          if (!com.hasBot && isBot) return
          let topBot = isBot ? com.bot : com.top

          com.gBox
            .append('rect')
            .attr('class', 'testRec' + isBot)
            .attr('x', topBot.box.x)
            .attr('y', topBot.box.y)
            .attr('width', topBot.box.w)
            .attr('height', topBot.box.h)
            .attr('fill', 'transparent')
            .attr('pointer-events', 'none')
            .attr('stroke', colsMix[2])
            .attr('stroke-width', 4)
            .attr('stroke-opacity', 0.7)
        })
      }
    }

    com.zoomStart = function (ele) {
      // console.log('start',d3.select(ele).attr('class'));
      com.isInZoom = true
    }

    com.zoomDuring = function (ele) {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return // ignore zoom-by-brush

      com.inUserZoom = hasVar(d3.event.sourceEvent)

      if (checkFree.isFreeV(checkFreeV.zoomDuring)) {
        checkFree.add({ id: checkFreeZoom.all, override: true })
        checkFree.add({ id: checkFreeZoom.during, override: true })

        let trans = d3.event.transform
        // console.log('zoomDuring',trans,ele,d3.select(ele).attr('class'));

        com.top.domain = trans.rescaleX(com.bot.scale.x).domain()
        com.top.scale.x.domain(com.top.domain)

        onScaleUpdate()

        if (com.hasBot) {
          com.bot.g.brush.call(
            com.bot.brush.move,
            com.top.scale.x.range().map(trans.invertX, trans)
          )
        }

        checkFree.remove({ id: checkFreeZoom.during })
      }
    }

    com.zoomEnd = function (ele) {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return // ignore zoom-by-brush

      updateDomainY()
      onScaleUpdate({ doY: true })

      let trans = d3.event.transform
      let srcClass = d3.select(ele).attr('class')

      com.zoom.trans[srcClass] = trans

      // check if we are zoomed out (full range shown)
      if (com.top.domain) {
        let isSame0 = com.top.domain[0] - com.bot.scale.x.domain()[0] <= 0
        let isSame1 = com.top.domain[1] - com.bot.scale.x.domain()[1] >= 0
        if (isSame0 && isSame1) com.top.domain = null
      }

      com.isInZoom = false
      checkFree.remove({
        id: checkFreeZoom.all,
        override: true,
        delay: timeD.animArc
      })

      let sel = Object.keys(com.zoom.sel).filter(function (d) {
        return com.zoom.trans[d] !== trans
      })
      // console.log('------ doDomainTrans ------------------',srcClass);
      // console.log(Object.keys(com.zoom.sel), sel);

      doDomainTrans({ trans: trans, sel: sel })
    }

    com.brushStart = function () {
      com.isInBrush = true
    }

    com.brushDuring = function () {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return // ignore brush-by-zoom
      // console.log('brushDuring');

      if (checkFree.isFreeV(checkFreeV.zoomDuring)) {
        checkFree.add({ id: checkFreeZoom.all, override: true })
        checkFree.add({ id: checkFreeZoom.during, override: true })

        let s = d3.event.selection || com.bot.scale.x.range()

        com.top.scale.x.domain(s.map(com.bot.scale.x.invert, com.bot.scale.x))

        if (d3.event.sourceEvent) {
          onScaleUpdate()
          com.top.domain = com.top.scale.x.domain()
        }

        let k = com.top.box.w / (s[1] - s[0])
        let x = -s[0]
        let t = d3.zoomIdentity.scale(k).translate(x, 0)
        $.each(com.zoom.sel, function (selName, selFunc) {
          selFunc().call(com.zoom.zoom.transform, t)
        })

        checkFree.remove({ id: checkFreeZoom.during })
      }
    }

    com.brushEnd = function () {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return // ignore brush-by-zoom

      updateDomainY()
      onScaleUpdate({ doY: true })

      // check if we are zoomed out (full range shown)
      if (com.top.domain) {
        let isSame0 = com.top.domain[0] - com.bot.scale.x.domain()[0] <= 0
        let isSame1 = com.top.domain[1] - com.bot.scale.x.domain()[1] >= 0
        if (isSame0 && isSame1) com.top.domain = null
      }

      com.isInBrush = false
      checkFree.remove({
        id: checkFreeZoom.all,
        override: true,
        delay: timeD.animArc
      })
    }

    initZoomBrush()
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function onScaleUpdate (optIn) {
    if (!hasVar(optIn)) optIn = {}
    let doY = optIn.doY
    // console.log('onScaleUpdate');
    $.each([false, true], function (nTopBot, isBot) {
      if (!com.hasBot && isBot) return
      let topBot = isBot ? com.bot : com.top

      let circ = topBot.g.data.selectAll('circle.' + com.circClass[nTopBot])
      circ.attr('cx', function (d) {
        return topBot.scale.x(d.x)
      })

      if (doY) {
        circ
          .transition('inOut')
          .duration(timeD.animArc / 2)
          .attr('cy', function (d) {
            return topBot.scale.y(d.y)
          })
      }
    })

    let line = com.top.g.data.selectAll('line.' + com.lineClass)
    line
      .attr('x1', function (d, i) {
        return com.top.scale.x(d.x1)
      })
      .attr('x2', function (d, i) {
        return com.top.scale.x(d.x2)
      })

    if (doY) {
      line
        .transition('inOut')
        .duration(timeD.animArc / 2)
        .attr('y1', function (d, i) {
          return com.top.scale.y(d.y1)
        })
        .attr('y2', function (d, i) {
          return com.top.scale.y(d.y2)
        })
    }

    com.top.g.axis.selectAll('.axisX').call(com.top.axis.x)
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateDomainY (optIn) {
    if (!hasVar(optIn)) optIn = {}
    let data = hasVar(optIn.data) ? optIn.data : com.data
    let domain = hasVar(optIn.domain) ? optIn.domain : com.top.scale.x.domain()

    $.each([false, true], function (nTopBot, isBot) {
      if (!com.hasBot && isBot) return
      let topBot = isBot ? com.bot : com.top

      let dataInDom = data
      if (!isBot) {
        dataInDom = dataInDom.filter(function (d) {
          return d.x >= domain[0] && d.x <= domain[1]
        })
      }
      dataInDom = dataInDom.map(function (d) {
        return d.y
      })

      let yMinMax = [d3.min(dataInDom), d3.max(dataInDom)]
      let deltaY = com.yAxisMarginFrac * (yMinMax[1] - yMinMax[0])
      if (yMinMax[1] === yMinMax[0]) {
        if (yMinMax[0] === 0) deltaY = 1
        else deltaY = com.yAxisMarginFrac * yMinMax[0]
      }
      yMinMax = [yMinMax[0] - deltaY, yMinMax[1] + deltaY]

      topBot.scale.y.domain(yMinMax)

      if (!isBot) {
        topBot.g.axis
          .selectAll('.axisY')
          .transition('inOut')
          .duration(timeD.animArc)
          .call(topBot.axis.y)
      }
    })
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function doDomainTrans (optIn) {
    let trans = optIn.trans
    let selV = hasVar(optIn.sel) ? optIn.sel : Object.keys(com.zoom.sel)
    if (selV.length === 0) return

    if (!hasVar(trans)) {
      if (!hasVar(optIn.domain)) {
        console.error(' - must provide either trans or domain ... !!!', optIn)
        return
      }
      // note that the order matters, ie: d3.zoomIdentity.scale(k).translate(x,
      // 0) is equivalent to d3.zoomIdentity.translate(x*k, 0).scale(k)
      let domain = optIn.domain
      let k =
        com.top.box.w /
        (com.top.scale.x(domain[1]) - com.top.scale.x(domain[0]))
      let x = -com.top.scale.x(domain[0])
      trans = d3.zoomIdentity.scale(k).translate(x, 0)
    }

    $.each(selV, function (nSel, selName) {
      if (com.zoom.trans[selName] !== trans) {
        com.zoom.trans[selName] = trans

        if (hasVar(optIn.duration)) {
          com.zoom.sel[selName]()
            .transition('inOut')
            .duration(optIn.duration)
            .call(com.zoom.zoom.transform, trans)
        } else {
          com.zoom.sel[selName]().call(com.zoom.zoom.transform, trans)
        }
      }
    })
  }
}
