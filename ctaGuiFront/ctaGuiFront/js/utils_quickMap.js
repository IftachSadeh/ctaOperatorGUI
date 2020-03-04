// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
// window.loadScript({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global sock */
/* global timeD */
/* global hasVar */
/* global appendToDom */
/* global runWhenReady */
/* global colsPurples */
/* global doZoomToTarget */
/* global telHealthCol */
/* global bckPattern */
/* global colsBlues */
/* global telInfo */
/* global moveNodeUp */
/* global vorPloyFunc */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.QuickMap = function (optIn0) {
  let thisQuickMap = this
  let runLoop = optIn0.runLoop
  let sgvTag = optIn0.sgvTag
  let widgetId = optIn0.widgetId
  let locker = optIn0.locker
  let isSouth = optIn0.isSouth

  let baseH = 500
  let aspectRatioChes = 10
  
  let addChesOutline = false
  let showVor = false

  // let svg = {}
  let svgMainArrZoomer = optIn0.svgMainArrZoomer
  let gQuickD = svgMainArrZoomer.quick
  gQuickD.g = svgMainArrZoomer.gSvg.append('g')
  gQuickD.gMini = gQuickD.g.append('g')
  gQuickD.gChes = gQuickD.g.append('g')

  gQuickD.gBaseMini = gQuickD.gMini.append('g')
  gQuickD.gBaseChes = gQuickD.gChes.append('g')

  // ------------------------------------------------------------------
  // scale to 100x100 px (executed after createChessMap())
  // ------------------------------------------------------------------
  function gTrans() {
    let scaleMini = 100 / baseH
    gQuickD.gBaseMini.attr('transform', function (d) {
      return 'translate(0,0)scale(' + scaleMini + ')'
    })
    
    let transChes = [-1*com.chesXY.x.min, -1*com.chesXY.y.min]
    gQuickD.svgChes.attr('transform', function (d) {
      return 'translate(' + transChes[0] + ', ' + transChes[1] + ')'
    })
    
    let scaleChes = 100 / (com.chesXY.x.max - com.chesXY.x.min)
    gQuickD.gBaseChes.attr('transform', function (d) {
      return 'scale(' + scaleChes + ')'
    })

    return
  }

  // ------------------------------------------------------------------
  // to avoid bugs, this is the g which should be used
  // for translations and sacling of this element
  // ------------------------------------------------------------------
  function getG (tag) {
    // make sure we start with upper case
    tag = tag.charAt(0).toUpperCase() + tag.slice(1)
    return gQuickD['g' + tag]
  }
  thisQuickMap.getG = getG



  console.log('222222222222222')
  thisQuickMap.getG('ches').attr('transform', function (d) {
    return 'translate(100,0)scale(4)'
  })




  let com = {}
  com.chesXY = { x: {}, y: {} }

  let rScale = {}
  rScale[0] = {}
  rScale[1] = {}

  rScale[0].health0 = 1.1
  rScale[0].health1 = 1.2
  rScale[0].health2 = 1.35
  rScale[0].line0 = 1.2
  rScale[0].line1 = 1.8
  rScale[0].percent = 0.6
  rScale[0].label = 1.95
  rScale[0].title = 2.05

  rScale[1].health0 = 1.5
  rScale[1].health1 = 1.65
  rScale[1].innerH0 = 1.25
  rScale[1].innerH1 = 1.3

  let zoomTarget = null
  let zoomLen = {}
  let telData = null
  let telTypeV = null
  let prop0 = 'health'

  let miniMapCol = {}
  miniMapCol.b = ['#64B5F6']
  miniMapCol.p = ['#9575CD']

  locker.add('inInitQuick')

  zoomLen['0.0'] = 1
  if (isSouth) {
    zoomLen['0.1'] = 2 // - 0.4
    zoomLen['0.2'] = 12 // - 4
    zoomLen['1.0'] = 15 // - 6
    zoomLen['1.1'] = zoomLen['1.0'] + 0.1
    zoomLen['1.2'] = zoomLen['1.0'] + 2
    zoomLen['1.3'] = 20
    // zoomLen["0.1"]  = 4  //- 4
    // zoomLen["0.2"]  = 10 //- 15.5
    // zoomLen["1.0"]  = 12 //- 16.5
    // zoomLen["1.1"]  = zoomLen["1.0"] + 0.1
    // zoomLen["1.2"]  = zoomLen["1.0"] + 2
    // zoomLen["1.3"]  = 90
  } else {
    zoomLen['0.1'] = 2 // - 0.4
    zoomLen['0.2'] = 5 // - 4
    zoomLen['1.0'] = 6.5 // - 6
    zoomLen['1.1'] = zoomLen['1.0'] + 0.1
    zoomLen['1.2'] = zoomLen['1.0'] + 1
    zoomLen['1.3'] = 9
  }
  zoomLen.prev = zoomLen['0.0']

  let zoomToTargetTag = {
    mini: 'zoomToTargetMini',
    ches: 'zoomToTargetChes'
  }

  // ------------------------------------------------------------------
  //  MiniMap function
  // ------------------------------------------------------------------
  function createMiniMap (optIn) {
    com.svgMiniZoom = d3.zoom().scaleExtent([zoomLen['0.0'], zoomLen['1.3']])
    // com.svgMiniZoom.on('start', com.svgZoomStart)
    // com.svgMiniZoom.on('zoom', com.svgZoomDuringMini)
    // com.svgMiniZoom.on('end', com.svgZoomEnd)

    gQuickD.svgMini = gQuickD.gBaseMini.append('g')

    gQuickD.gBaseMini
      // .call(com.svgMiniZoom)
      .on('dblclick.zoom', null)
      .on('wheel', function () {
        d3.event.preventDefault()
      })

    // save the svg node to use for d3.zoomTransform() later
    gQuickD.svgMiniZoomNode = gQuickD.gBaseMini.nodes()[0]
    gQuickD.gMiniZoomed = gQuickD.svgMini.append('g')

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    getScale = function () {
      return d3.zoomTransform(gQuickD.svgMiniZoomNode).k
    }
    getTrans = function () {
      return [
        d3.zoomTransform(gQuickD.svgMiniZoomNode).x,
        d3.zoomTransform(gQuickD.svgMiniZoomNode).y
      ]
    }
    thisQuickMap.getScale = getScale
    thisQuickMap.getTrans = getTrans

    // add one rectangle as background
    // ------------------------------------------------------------------
    gQuickD.svgMini
      .append('g')
      .selectAll('rect')
      .data([0])
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', baseH)
      .attr('height', baseH)
      .attr('stroke', '#383B42')
      .attr('stroke-width', 2)
      .attr('fill', '#383B42')

    // gQuickD.gMiniZoomed = gQuickD.svgMini.append('g')
    gQuickD.gMini = gQuickD.svgMini.append('g')
    // gQuickD.gMiniZoomed = gQuickD.gMini // to actually see the zoom...

    // add one circle as background
    // ------------------------------------------------------------------
    gQuickD.gMini
      .append('g')
      .selectAll('circle')
      .data([0])
      .enter()
      .append('circle')
      .attr('r', 0)
      .attr('cx', baseH / 2)
      .attr('cy', baseH / 2)
      .attr('fill', '#F2F2F2')
      .transition('inOut')
      .duration(timeD.animArc / 3)
      .attr('r', baseH / 2.1)

    // the background grid
    bckPattern({
      com: com,
      gNow: gQuickD.gMini,
      gTag: 'svgMini',
      lenWH: [baseH, baseH],
      opac: 0.2,
      hexR: 50
    })

    com.gMini = {}
    com.gMini.circ = gQuickD.gMini.append('g')
    com.gMini.rect = gQuickD.gMini.append('g')
    com.gMini.vor = gQuickD.gMini.append('g')
  }
  this.createMiniMap = createMiniMap
 
  function updateMiniMap (optIn) {
    let dataV = telData.tel
    let gNow = com.gMini.circ
    let posTag = 'mini'
    let tagNow = prop0

    // operate on new elements only

    let circ = gNow.selectAll('circle.' + tagNow).data(dataV, function (d) {
      return d.id
    })

    circ
      .enter()
      .append('circle')
      .attr('class', tagNow)
      .style('opacity', '1')
      .attr('r', function (d) {
        return telData[posTag][d.id].r * rScale[0].health2
      })
      .style('stroke-width', '0.5')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('transform', function (d) {
        return (
          'translate(' +
          telData[posTag][d.id].x +
          ',' +
          telData[posTag][d.id].y +
          ')'
        )
      })
      .merge(circ)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('transform', function (d) {
        return (
          'translate(' +
          telData[posTag][d.id].x +
          ',' +
          telData[posTag][d.id].y +
          ')'
        )
      })
      .style('fill', function (d) {
        return telHealthCol(d[tagNow])
      })
      .style('stroke', function (d) {
        return telHealthCol(d[tagNow], 0.5)
      })
  }
  this.updateMiniMap = updateMiniMap
  
  // ---------------------------------------------------------------------------
  //  Blue square on miniMap
  // ---------------------------------------------------------------------------
  function miniZoomViewRec () {
    runLoop.push({ tag: 'miniZoomViewRec' })
  }
  this.miniZoomViewRec = miniZoomViewRec
  
  function miniZoomViewRecOnce () {
    if (
      !locker.isFreeV([
        'autoZoomTarget',
        'zoomToTargetMini',
        'zoomToTargetChes'
      ])
    ) {
      miniZoomViewRec()
      return
    }
    let tagNow = 'miniZoomViewRec'
    let scale = getScale()
    let trans = getTrans()
    let data = []

    if (scale < (isSouth ? 2 : 1.5)) {
      scale = 1
      trans = [0, 0]
    } else data = [{ id: 0 }]

    let w =
      (1 + (isSouth ? 2 * scale / zoomLen['1.3'] : 0)) * baseH / scale
    let h =
      (1 + (isSouth ? 2 * scale / zoomLen['1.3'] : 0)) * baseH / scale
    let x = (baseH / 2 - trans[0]) / scale - w / 2
    let y = (baseH / 2 - trans[1]) / scale - h / 2

    let strkW = 1 + 0.1 * scale / (zoomLen['1.3'] - zoomLen['0.0'])
    let opac = 0.95 * Math.sqrt(scale / (zoomLen['1.3'] - zoomLen['0.0']))

    // operate on new elements only
    let rect = com.gMini.rect
      .selectAll('rect.' + tagNow)
      .data(data, function (d) {
        return d.id
      })

    rect
      .enter()
      .append('rect')
      .attr('class', tagNow)
      .style('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .attr('stroke', d3.rgb(miniMapCol.b).darker(0.5))
      .attr('stroke-width', '1')
      .attr('fill', miniMapCol.b) // .attr("fill", "red")
      .attr('vector-effect', 'non-scaling-stroke')
      .merge(rect)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .attr('stroke-width', strkW)
      .style('opacity', 1)
      .style('fill-opacity', opac)
      .attr('stroke-opacity', opac)

    rect
      .exit()
      .transition('out')
      .duration(timeD.animArc)
      .style('opacity', '0')
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .remove()
  }
  
  // ---------------------------------------------------------------------------
  //  Zoom to target when click on miniMap
  // ---------------------------------------------------------------------------
  function miniZoomClick () {
    // let tagNow = 'miniZoomClick'

    let vorFunc = d3
      .voronoi()
      .x(function (d) {
        return d.x
      })
      .y(function (d) {
        return d.y
      })
      .extent([[0, 0], [baseH, baseH]])

    com.gMini.vor
      .selectAll('path')
      .data(vorFunc.polygons(telData.vor.data))
      .enter()
      .append('path')
      .style('fill', 'transparent')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('stroke-width', 0)
      .style('opacity', 0)
      .style('stroke', '#383B42')
      // .style("opacity", "0.25").style("stroke-width", "0.75").style("stroke", "#E91E63")//.style("stroke", "white")
      .call(function (d) {
        d.attr('d', vorPloyFunc)
      })
      .on('click', function (d) {
        telData.vorDblclick({ source: 'minizoomclick', d: d, isInOut: false })
      })
      // .on("click", function(d) {
      //   let scaleToZoom = telData.vorDblclick({d:d, isInOut:false });
      //   thisQuickMap.zoomToTrgQuick({ target:d.data.id, scale:scaleToZoom, durFact:-1 });
      // })
      // .on("dblclick", function(d) {  // dousnt work well...
      //   let scaleToZoom = telData.vorDblclick({d:d, isInOut:true });
      //   thisQuickMap.zoomToTrgQuick({ target:d.data.id, scale:scaleToZoom, durFact:-1 });
      // })
      .on('mouseover', function (d) {
        thisQuickMap.target = d.data.id
      })
  }

  // ------------------------------------------------------------------
  //  Chess function
  // ------------------------------------------------------------------
  function createChessMap (optIn) {
    com.svgChesZoom = d3.zoom().scaleExtent([zoomLen['0.0'], zoomLen['1.3']])
    // com.svgChesZoom.on('start', com.svgZoomStart)
    // com.svgChesZoom.on('zoom', com.svgZoomDuringChes)
    // com.svgChesZoom.on('end', com.svgZoomEnd)

    gQuickD.svgChes = gQuickD.gBaseChes.append('g')

    gQuickD.gBaseChes
      .call(com.svgChesZoom)
      .on('dblclick.zoom', null)
      .on('wheel', function () {
        d3.event.preventDefault()
      })

    // save the svg node to use for d3.zoomTransform() later
    gQuickD.svgChesZoomNode = gQuickD.gBaseChes.nodes()[0]
    gQuickD.gChesZoomed = gQuickD.svgChes.append('g')

    // add one rectangle as background, and to allow click to zoom
    // ------------------------------------------------------------------

    let gChesRec = gQuickD.svgChes.append('g')

    com.gChes = {}
    com.gChes.g = gQuickD.svgChes.append('g')
    com.gChes.xyr = {}

    // let nRows     = isSouth ? 5 : 2;
    // let nEle = isSouth ? 99 : 19
    let nEleInRow = isSouth ? [18, 18, 18, 18, 18] : [8, 8, 8]
    let eleR = isSouth ? baseH / 16 : baseH / 6
    let eleSpace = isSouth ? [3.9, 2.5] : [3.1, 1.5]
    let eleShift = isSouth ? [2, 2] : [2, 3]

    let vorData = []
    let nEleRow = 0
    $.each(telTypeV, function (index, idNow) {
      let nEleNowInRow = nEleRow
      let nEleNowInCol = 0

      $.each(Array(nEleInRow.length), function (i, d) {
        if (nEleNowInRow >= nEleInRow[i]) {
          nEleNowInRow -= nEleInRow[i]
          nEleNowInCol++
        }
      })
      nEleRow++

      let x =
        eleR / eleShift[0] +
        eleR +
        ((isSouth ? 0.3 : 0.15 * 6) + nEleNowInRow) * (eleSpace[0] * eleR)
      let y = eleR / eleShift[1] + eleR + nEleNowInCol * (eleSpace[1] * eleR)

      com.gChes.xyr[idNow] = {
        id: idNow,
        rc: [nEleNowInRow, nEleNowInCol],
        x: x,
        y: y,
        r: eleR * 1.5
      }
      vorData.push({ id: idNow, x: x, y: y })
    })
    // console.log(Object.keys(telData.mini).length, telData.mini)

    let xyrFlat = Object.values(com.gChes.xyr)
    com.chesXY.x.min = minMaxObj({
      minMax: 'min', data: xyrFlat, func: (x => x.x - 1.1 * x.r)
    })
    com.chesXY.x.max = minMaxObj({
      minMax: 'max', data: xyrFlat, func: (x => x.x + 1.1 * x.r)
    })
    com.chesXY.y.min = minMaxObj({
      minMax: 'min', data: xyrFlat, func: (x => x.y - 1.1 * x.r)
    })
    com.chesXY.y.max = minMaxObj({
      minMax: 'max', data: xyrFlat, func: (x => x.y + 1.1 * x.r)
    })

    gChesRec
      // .selectAll('rect').data([0]).enter()
      // .attr('class', 'sssss')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', (com.chesXY.x.max - com.chesXY.x.min))
      .attr('height', (com.chesXY.y.max - com.chesXY.y.min))
      .attr('stroke-width', '0')
      .attr('transform', function (d) {
        return 'translate(' + com.chesXY.x.min + ', '+ com.chesXY.y.min +')'
      })
      .attr('fill', '#383b42')
      // .attr("fill", "#d698bc")// .attr("fill", "#F2F2F2")

    if(addChesOutline) {
      gChesRec
        .selectAll('rect')
        .attr('stroke', '#F2F2F2')
        .attr('stroke-width', 1)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
    }

    let vorFunc = d3
      .voronoi()
      .x(function (d) {
        return d.x
      })
      .y(function (d) {
        return d.y
      })
      .extent([[com.chesXY.x.min, com.chesXY.y.min], [com.chesXY.x.max, com.chesXY.y.max]])

    com.gChes.vor = vorFunc.polygons(vorData)
  }
  this.createChessMap = createChessMap
  
  function updateChessMap (dataV, shiftY) {
    let tagCirc = prop0
    let tagLbl = 'lbls00title'
    let tagState = 'state_00'
    // let tagTxt = tagState + tagLbl

    let fontScale = isSouth ? 2.7 : 4
    let titleSize = (isSouth ? 16 : 17) * fontScale

    let circStrk = 0
    let textStrk = isSouth ? 0.3 : 0.8
    let fillOpac = 1

    //
    let circ = com.gChes.g
      .selectAll('circle.' + tagCirc)
      .data(dataV, function (d) {
        return d.id
      })
    circ
      .enter()
      .append('circle')
      .attr('class', tagCirc)
      .attr('stroke-width', circStrk)
      .style('stroke-opacity', 1)
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('transform', function (d) {
        return (
          'translate(' +
          com.gChes.xyr[d.id].x +
          ',' +
          com.gChes.xyr[d.id].y +
          ')'
        )
      })
      .style('fill-opacity', fillOpac)
      .attr('r', function (d) {
        return com.gChes.xyr[d.id].r
      })
      .style('opacity', 1)
      .style('fill', '#383b42')
      .merge(circ)
      .transition('inOut')
      .duration(timeD.animArc)
      // .style("fill", function(d) { return telHealthCol(d[tagCirc],0.5); } )
      .style('stroke', function (d) {
        return telHealthCol(d[tagCirc], 0.5)
      })

    circ
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('r', 0)
      .remove()

    function txtColRC (d) {
      let index = com.gChes.xyr[d.id].rc[0] + com.gChes.xyr[d.id].rc[1]
      return index % 2 === 0
        ? d3.rgb(colsPurples[4]).brighter(0.5)
        : d3.rgb(colsBlues[3]).brighter(0.1)
      // return (index%2 == 0) ? d3.rgb(colsYellows[1]).brighter(0.5) : d3.rgb(colsGreens[4]).brighter(0.1);
    }
    function txtColRCb (d) {
      return d3.rgb(txtColRC(d)).brighter(0.2)
    }

    // attach new data (select by id, and so will override existing data if has the same id)
    let text = com.gChes.g.selectAll('text.' + tagLbl).data(dataV, function (d) {
      return d.id
    })

    // operate on new elements only
    text
      .enter()
      .append('text')
      .text(function (d) {
        return telInfo.getTitle(d.id)
      })
      // .attr("id",      function(d) { return myUniqueId+d.id+tagTxt; })
      .attr('class', tagState + ' ' + tagLbl)
      .style('font-weight', 'normal')
      .attr('stroke-width', textStrk)
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .each(function (d, i) {
        d.fontScale = String(fontScale)
        d.shiftY = shiftY
      })
      // .style("stroke",    function(d) { return "#F2F2F2";  return "#383b42"; })
      // .style("stroke",   function(d) { return telHealthCol(d[tagCirc]); } )
      .style('stroke', txtColRCb)
      .style('fill', txtColRC)
      .style('font-size', titleSize + 'px')
      .attr('transform', function (d, i) {
        return (
          'translate(' +
          com.gChes.xyr[d.id].x +
          ',' +
          com.gChes.xyr[d.id].y +
          ')'
        )
      })
      .attr('dy', titleSize / 3 + 'px')
      .attr('text-anchor', 'middle')
      .style('font-size', titleSize + 'px')
      .transition('inOut')
      .duration(timeD.animArc)
      .delay(100)
      .style('opacity', '1')

    text
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()

    // ------------------------------------------------------------------
    // the highlight function
    // ------------------------------------------------------------------
    function focusTel (dIn, isOn) {
      locker.add('svgQuickFocusTel')

      let delay = 250
      setTimeout(function () {
        if (locker.nActive('svgQuickFocusTel') === 1) {
          _focusTel(dIn, isOn)
        }
        locker.remove('svgQuickFocusTel')
      }, delay)
    }

    function _focusTel (dIn, isOn) {
      let rScale = isSouth ? 2.0 : 1.1

      let isEleOn
      let dInId = hasVar(dIn.data) ? dIn.data.id : ''
      if (isOn) {
        isEleOn = function (d) {
          return d.id === dInId
        }
      } else {
        isEleOn = function () {
          return false
        }
      }

      //
      let circ = com.gChes.g.selectAll('circle.' + tagCirc)
      let text = com.gChes.g.selectAll('text.' + tagLbl)

      circ.each(function (d) {
        if (isEleOn(d)) moveNodeUp(this, 2)
      })
      text.each(function (d) {
        if (isEleOn(d)) moveNodeUp(this, 2)
      })

      //
      circ
        .transition('update')
        .duration(timeD.animArc * (isOn ? 0.5 : 0.1))
        // .style("opacity", function(d) { return isEleOn(d) ? 1 : (isOn?0.5:1);  })
        .style('fill-opacity', function (d) {
          return isEleOn(d) ? 1 : 0
        })
        .attr('r', function (d) {
          return com.gChes.xyr[d.id].r * (isEleOn(d) ? rScale : 1)
        })
        .attr('stroke-width', function (d) {
          return isEleOn(d) ? circStrk + 1.5 : 0
        })

      //
      text
        .transition('update')
        .duration(timeD.animArc * (isOn ? 1 : 0.1))
        .style('font-size', function (d) {
          return (isEleOn(d) ? titleSize * rScale : titleSize) + 'px'
        })
        .attr('dy', function (d) {
          return (isEleOn(d) ? titleSize * rScale : titleSize) / 3 + 'px'
        })
        .attr('stroke-width', function (d) {
          return isEleOn(d) ? textStrk + 0.7 : textStrk
        })
        .style('font-weight', function (d) {
          return isEleOn(d) ? 'bold' : 'normal'
        })

      //
      let hovData = []
      if (isOn && hasVar(telData.mini[dInId])) hovData.push({ id: dInId })

      miniHoverViewCirc(hovData)
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function miniHoverViewCirc (dataV) {
      let tagNow = 'miniHoverViewCirc'

      let circ = com.gMini.circ
        .selectAll('circle.' + tagNow)
        .data(dataV, function (d) {
          return d.i
        })

      circ
        .enter()
        .append('circle')
        .attr('class', tagNow)
        .style('opacity', '0')
        .style('fill-opacity', 0.2)
        .style('stroke-width', 0.5)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('transform', function (d) {
          return (
            'translate(' +
            telData.mini[d.id].x +
            ',' +
            telData.mini[d.id].y +
            ')'
          )
        })
        .attr('r', function (d) {
          return telData.mini[d.id].r * (isSouth ? 12 : 5)
        })
        .merge(circ)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('transform', function (d) {
          return (
            'translate(' +
            telData.mini[d.id].x +
            ',' +
            telData.mini[d.id].y +
            ')'
          )
        })
        .style('fill', function (d) {
          return miniMapCol.p
        })
        .style('stroke', function (d) {
          return d3.rgb(miniMapCol.p[0]).darker(0.5)
        })
        .style('opacity', 1)

      circ
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }

    // ------------------------------------------------------------------
    // vor cels for selection
    // ------------------------------------------------------------------
    com.gChes.g
      .selectAll('path')
      .data(com.gChes.vor)
      .enter()
      .append('path')
      .style('fill', 'transparent')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('opacity', '0')
      .style('stroke-width', 0)
      .style('stroke', '#383B42')
      // .style("opacity", "0.25").style("stroke-width", "0.75").style("stroke", "#E91E63")//.style("stroke", "white")
      .call(function (d) {
        d.attr('d', vorPloyFunc)
      })
      .on('click', function (d) {
        telData.vorDblclick({ source: 'com.gches.g', d: d, isInOut: false })
      })
      // .on("dblclick",  function(d) { telData.vorDblclick({ d:d, isInOut:true }); }) // dousnt work well...
      .on('mouseover', function (d) {
        focusTel(d, true)
      })
      .on('mouseout', function (d) {
        focusTel(d, false)
      })

    if (showVor) {
      com.gChes.g
        .selectAll('path')
        .style('opacity', '0.5')
        .style('stroke-width', '1.5')
        .style('stroke', '#E91E63')
    }
  }

  // ------------------------------------------------------------------
  //  Global function
  // ------------------------------------------------------------------
  // let rScale = svgMain.rScale
  function initData (dataIn) {
    if (hasVar(gQuickD.svgMini)) return

    // ------------------------------------------------------------------
    // create the main svg element
    // ------------------------------------------------------------------
    com['svgDivId'] = sgvTag.quick.id + '_svg'
    com['svgDiv'] = sgvTag.quick.widget.getEle(com['svgDivId'])
    // ------------------------------------------------------------------
    // Initialize svg if it don't exist
    // ------------------------------------------------------------------
    if (!hasVar(com['svgDiv'])) {
      let parent = sgvTag.quick.widget.getEle(sgvTag.quick.id)
      com['svgDiv'] = document.createElement('span')
      com['svgDiv'].id = com['svgDivId']

      appendToDom(parent, com['svgDiv'])

      runWhenReady({
        pass: function () {
          return hasVar(sgvTag.quick.widget.getEle(com['svgDivId']))
        },
        execute: function () {
          initData(dataIn)
        }
      })

      return
    }
    sock.emitMouseMove({ eleIn: com['svgDiv'], data: { widgetId: widgetId } })

    // ------------------------------------------------------------------
    // background container
    // ------------------------------------------------------------------
    let whRatio = sgvTag.quick.whRatio
    let whFracMini = 1
    let whFracChes = whRatio - whFracMini
    com['svgMiniW'] = 100 * whFracMini / whRatio + '%'
    // let svgMiniH = '100%'
    // let svgMiniT  = "0px";
    // let svgMiniL  = "0px";
    com['svgChesW'] = 100 * whFracChes / whRatio + '%'
    // let svgChesH = '100%'
    // let svgChesT  = "0px";
    // let svgChesL  = (100*whFracMini/whRatio)+"%";

    telData = dataIn.instrumentData
    telTypeV = dataIn.telTypeV

    createMiniMap()
    createChessMap()
    gTrans()

    // initialize the target name for hovering->zoom
    thisQuickMap.target = zoomTarget
    // programatic zoom to some target and scale - only use the last of any set of ovelapping zoom requests
    runLoop.init({
      tag: zoomToTargetTag.mini,
      func: doZoomToTarget,
      nKeep: -1
    })
    runLoop.init({
      tag: zoomToTargetTag.ches,
      func: doZoomToTarget,
      nKeep: -1
    })

    // the actual function to be called when a zoom needs to be put in the queue
    zoomToTrgQuick = function (optIn) {
      zoomToTargetNow(optIn, 'mini')
      zoomToTargetNow(optIn, 'ches')
    }
    thisQuickMap.zoomToTrgQuick = zoomToTrgQuick

    // // the background grid
    // bckPattern({
    //   com:com, gNow:gQuickD.svgChes, gTag:"gChes", lenWH:[baseH,baseH],
    //   opac:0.1, textureOrient:"5/8", textureSize:120
    // });
    runLoop.init({
      tag: 'miniZoomViewRec',
      func: miniZoomViewRecOnce,
      nKeep: 1
    })
    miniZoomViewRec()
    miniZoomClick()

    setStateOnce(dataIn)
    locker.remove('inInitQuick')
  }
  this.initData = initData
  
  function setStateOnce (dataIn) {
    updateMiniMap({
      dataV: telData.tel,
      gNow: com.gMini.circ,
      posTag: 'mini'
    })
    updateChessMap(telData.tel, false)
    // updateChessMap(telData.tel, isSouth ? 2.7 : 5, false)
  }
  this.setStateOnce = setStateOnce

  // initialize a global function (to be overriden below)
  let zoomToTrgQuick = function (optIn) {
    if (!locker.isFree('inInit')) {
      setTimeout(function () {
        zoomToTrgQuick(optIn)
      }, timeD.waitLoop)
    }
  }
  thisQuickMap.zoomToTrgQuick = zoomToTrgQuick
  // initialize a couple of functions to be overriden below
  
  let getScale = function () {
    return zoomLen['0.0']
  }
  this.getScale = getScale
  
  let getTrans = function () {
    return [0, 0]
  }
  this.getTrans = getTrans

  function zoomToTargetNow (optIn, tagNow) {
    let tagNowUp = tagNow
    if (tagNowUp === 'mini') {
      tagNowUp = 'Mini'
    }
    if (tagNowUp === 'ches') {
      tagNowUp = 'Ches'
    }

    if (!locker.isFree('inInit')) {
      setTimeout(function () {
        zoomToTargetNow(optIn, tagNow)
      }, timeD.waitLoop)
      return
    }
    if (!locker.isFreeV(['autoZoomTarget', 'zoomToTarget' + tagNowUp])) {
      return
    }

    // if(tagNow=='mini')console.log('zoomToTrgQuick');

    let targetName = optIn.target
    let targetScale = optIn.scale
    let durFact = optIn.durFact

    if (targetScale < zoomLen['0.0']) targetScale = getScale()

    // let transTo = [ telData.mini[targetName].x, telData.mini[targetName].y ];
    let transTo
    if (targetName === '' || !hasVar(telData.mini[targetName])) {
      let scale = getScale()
      let trans = getTrans()
      let x = (baseH / 2 - trans[0]) / scale
      let y = (baseH / 2 - trans[1]) / scale
      transTo = [x, y]
    } else {
      transTo = [telData.mini[targetName].x, telData.mini[targetName].y]
    }

    let funcStart = function () {
      locker.add({ id: 'zoomToTarget' + tagNowUp, override: true })
      // console.log('xxx',targetName);
    }
    let funcDuring = function () {}
    let funcEnd = function () {
      locker.remove('zoomToTarget' + tagNowUp)
    }

    let outD = {
      trgScale: targetScale,
      durFact: durFact,
      baseTime: 300,
      transTo: transTo,
      wh: [baseH, baseH],
      cent: null,
      funcStart: funcStart,
      funcEnd: funcEnd,
      funcDuring: funcDuring,
      svg: gQuickD['svg' + tagNowUp],
      svgZoom: com['svg' + tagNowUp + 'Zoom'],
      svgBox: gQuickD['g' + tagNowUp + 'Zoomed'],
      svgZoomNode: gQuickD['svg' + tagNowUp + 'ZoomNode']
    }

    if (durFact < 0) {
      outD.durFact = 0
      doZoomToTarget(outD)
    } else {
      runLoop.push({ tag: zoomToTargetTag[tagNow], data: outD })
    }
  }

  return
}
