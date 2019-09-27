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
/* global PlotTimeBar */

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
    com.locker = optIn.locker
    com.runLoop = optIn.runLoop
    com.hasBotPlot = !optIn.hasBotPlot
    com.updateDomainY = optIn.updateDomainY
    com.overviewLine = optIn.overviewLine

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

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------
    com.outerBox = deepCopy(optIn.boxData)
    com.boxTrans = { x: optIn.boxData.x, y: optIn.boxData.y, k: 1 }
    com.gBox = optIn.gBox
    transScaleBox()
    com.innerBox = com.outerBox
    com.innerBox.x = 0
    com.innerBox.y = 0

    com.bck = {}
    com.bck.g = com.gBox.append('g')

    com.top = {}
    com.top.scale = {}
    com.top.axis = {}
    com.bot = {}
    com.timeBar = []

    if (!optIn.hasBotPlot) {
      com.top.box = com.innerBox
      com.bot = null
    } else {
      com.top.box = {
        x: com.innerBox.x,
        y: com.innerBox.y,
        w: com.innerBox.w,
        h: (com.innerBox.h * 0.6) + (com.innerBox.h * 0.4 * 0.2)
      }
      com.bot.box = {
        x: com.innerBox.x,
        y: com.innerBox.y + (com.innerBox.h * 0.6),
        w: com.innerBox.w,
        h: com.innerBox.h * 0.4
      }
    }
    console.log(com.top);

    com.top.axis.transX =
      'translate(' +
      com.top.box.x +
      ',' +
      (com.top.box.y + com.top.box.h) +
      ')'
    com.top.axis.transY =
      'translate(' + (com.top.box.x) + ',' + (com.top.box.y) + ')'

    com.top.g = {}
    com.top.g.axis = com.gBox.append('g')
    com.top.g.data = com.gBox.append('g')
    com.top.g.data.attr(
      'transform',
      'translate(' + com.top.box.x + ',' + com.top.box.y + ')'
    )
    com.top.domain = null

    com.parse = {}
    com.parse.x = d3.timeParse('%Q')
    com.parse.y = function (d) {
      return +d
    }

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
    let topBot = com.top
    topBot.defs = topBot.g.data.append('defs')
    topBot.clipPath = topBot.defs
      .append('clipPath')
      .attr('id', com.tagClipPath.top)
    topBot.clipRec = topBot.clipPath
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', topBot.box.w)
      .attr('height', topBot.box.h)
    topBot.g.data.attr('clip-path', 'url(#' + com.tagClipPath.top + ')')

    setStyle(optIn.style)
    initPlot(optIn)

    if (optIn.hasBotPlot) {
      let newTimeBar = new PlotTimeBar()
      let tagPlot = 'internalTimeBar' + optIn.tag
      newTimeBar.init({
        tag: optIn.tag,
        gBox: com.gBox.append('g'),
        hasBotPlot: true,
        isPartofPlot: true,
        style: { hasOutline: true },
        boxData: com.bot.box,
        locker: com.locker,
        lockerV: [tagPlot + 'updateData'],
        lockerZoom: {
          all: tagPlot + 'zoom',
          during: tagPlot + 'zoomDuring',
          end: tagPlot + 'zoomEnd'
        },
        runLoop: null
      })
      com.timeBar.push(newTimeBar)
    }
  }
  this.init = init

  function unplugPlotTimeBar (PlotTimeBar) {
    PlotTimeBar.unplugPlotTimeSeries()
  }
  this.unplugPlotTimeBar = unplugPlotTimeBar
  function plugPlotTimeBar (PlotTimeBar) {
    com.timeBar.push(PlotTimeBar)
    PlotTimeBar.plugPlotTimeSeries(this)
  }
  this.plugPlotTimeBar = plugPlotTimeBar

  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    com.style = {}

    com.style.hasOutline = hasVar(optIn.hasOutline) ? optIn.hasOutline : false
    com.style.bckColor = hasVar(optIn.bckColor) ? optIn.bckColor : '#F2F2F2'
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
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function initPlot (optIn) {
    com.top.scale.x = d3.scaleTime().range([0, com.top.box.w])
    com.top.scale.y = d3.scaleLinear().range([com.top.box.h, 0])

    if (!optIn.hasBotPlot) {
      com.top.axis.x = d3.axisBottom(com.top.scale.x)
      com.top.g.axis
        .append('g')
        .attr('class', 'axisX')
        .attr('transform', com.top.axis.transX)
        .call(com.top.axis.x)
    }
    com.top.axis.y = d3.axisLeft(com.top.scale.y)
    com.top.g.axis
      .append('g')
      .attr('class', 'axisY')
      .attr('transform', com.top.axis.transY)
      .call(com.top.axis.y)
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  // com.updateupdateupdate=0;
  function update (dataIn) {
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

    for (var i = 0; i < com.timeBar.length; i++) {
      // probably need to modify
      com.timeBar[i].updateBottomAxisDomain(com.data)
      if (com.overviewLine) com.timeBar[i].updateLine({data: com.data, tag: com.mainTag})
    }
  }
  this.update = update

  function updateAxisPlot (optIn) {
    let data = hasVar(optIn.data) ? optIn.data : com.data
    if (!data) return

    com.top.scale.x.domain(optIn.topScaleX.domain())
    updateDomainY()

    com.top.g.axis.selectAll('.axisX').call(com.top.axis.x)
    com.top.g.axis
      .selectAll('.axisY')
      .transition('inOut')
      .duration(timeD.animArc)
      .call(com.top.axis.y)

    updateCirc({ data: com.data })
  }
  this.updateAxisPlot = updateAxisPlot

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

    $.each([false], function (nTopBot, isBot) {
      if (!com.hasBot && isBot) return
      let topBot = isBot ? com.bot : com.top
      // let pointerEvents = isBot ? 'none'   : 'auto';
      let pointerEvents = 'none'

      if (!hasVar(com.circClass)) com.circClass = {}
      com.circClass[nTopBot] = com.mainTag + 'circ' + nTopBot

      // let circ = topBot.g.data
      //   .selectAll('circle.' + com.circClass[nTopBot])
      //   .data(data, function (d) {
      //     return d.id
      //   })
      // circ
      //   .enter()
      //   .append('circle')
      //   .attr('class', com.circClass[nTopBot])
      //   .style('opacity', 0)
      //   .attr('stroke-opacity', 1)
      //   .style('fill-opacity', 0.7)
      //   .attr('vector-effect', 'non-scaling-stroke')
      //   .attr('cx', function (d) {
      //     return com.top.scale.x(d.x)
      //   })
      //   .attr('cy', function (d) {
      //     return com.top.scale.y(d.y)
      //   })
      //   .attr('r', 2)
      //   .attr('fill', colsMix[nTopBot])
      //   // .attr("stroke-width", com.style.strokeWidth)
      //   // .attr("fill", function(d,i) { return
      //   // com.style.fill(d,d.data.nBlock); }) .attr("stroke", function(d,i) {
      //   // return com.style.stroke(d,d.data.nBlock); })
      //   // .attr("stroke-opacity", com.style.strokeOpacity)
      //   .attr('pointer-events', pointerEvents)
      //   // .call(com.zoom.zoom)
      //   // .on('click', com.style.click)
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
    })
  }
  function updateDomainY (optIn) {
    if (!hasVar(optIn)) optIn = {}

    let data = hasVar(optIn.data) ? optIn.data : com.data
    let domain = hasVar(optIn.domain) ? optIn.domain : com.top.scale.x.domain()

    let dataInDom = data
    dataInDom = dataInDom.filter(function (d) {
      return d.x >= domain[0] && d.x <= domain[1]
    })
    dataInDom = dataInDom.map(function (d) {
      return d.y
    })
    let yMinMax = [d3.min(dataInDom), d3.max(dataInDom)]
    let deltaY = com.yAxisMarginFrac * (yMinMax[1] - yMinMax[0])
    if (yMinMax[1] === yMinMax[0]) {
      if (yMinMax[0] === 0) deltaY = 1
      else deltaY = com.yAxisMarginFrac * yMinMax[0]
    }
    // yMinMax = [yMinMax[0] - deltaY, yMinMax[1] + deltaY]
    if (!com.updateDomainY) {
      yMinMax = [0, 100.5]
    } else {
      yMinMax = [yMinMax[0] - deltaY, yMinMax[1] + deltaY]
    }
    com.top.scale.y.domain(yMinMax)
    com.top.g.axis
      .selectAll('.axisY')
      .transition('inOut')
      .duration(timeD.animArc)
      .call(com.top.axis.y)
  }

  function onScaleUpdate (optIn) {
    com.top.scale.x.domain(optIn.topScaleX.domain())

    if (!optIn.hasBotPlot) com.top.axis.x = d3.axisBottom(com.top.scale.x)

    if (!hasVar(optIn)) optIn = {}
    let doY = optIn.doY
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
  this.onScaleUpdate = onScaleUpdate

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
  this.doDomainTrans = doDomainTrans
}
