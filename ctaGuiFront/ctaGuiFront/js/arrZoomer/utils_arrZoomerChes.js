// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
/* global $ */
/* global d3 */
/* global sock */
/* global timeD */
/* global hasVar */
/* global telHealthCol */
/* global bckPattern */
/* global telInfo */
/* global vorPloyFunc */

// ------------------------------------------------------------------
// 
// ------------------------------------------------------------------
window.ArrZoomerChes = function (optIn0) {
  let thisTop = this
  let runLoop = optIn0.runLoop
  let sgvTag = optIn0.sgvTag
  let widgetId = optIn0.widgetId
  let locker = optIn0.locker
  let isSouth = optIn0.isSouth

  let svgBase = optIn0.svgBase
  svgBase.elements.ches = thisTop

  let instruments = svgBase.instruments
  let rScale = instruments.rScale

  let baseH = 500
  let addChesOutline = false
  let showVor = false

  let gChesD = svgBase.svgD.ches

  gChesD.g = svgBase.svgD.gSvg.append('g')
  gChesD.gChes = gChesD.g.append('g')
  gChesD.gBaseChes = gChesD.gChes.append('g')

  // ------------------------------------------------------------------
  // scale to 100x100 px (executed after createChessMap())
  // ------------------------------------------------------------------
  function gTrans() {
    let transChes = [-1*com.chesXY.x.min, -1*com.chesXY.y.min]
    gChesD.svgChes.attr('transform', function (d) {
      return 'translate(' + transChes[0] + ', ' + transChes[1] + ')'
    })
    
    let scaleChes = 100 / (com.chesXY.x.max - com.chesXY.x.min)
    gChesD.gBaseChes.attr('transform', function (d) {
      return 'scale(' + scaleChes + ')'
    })

    return
  }

  // ------------------------------------------------------------------
  // to avoid bugs, this is the g which should be used
  // for translations and sacling of this element
  // ------------------------------------------------------------------
  thisTop.setTransform = function (trans) {
    if (hasVar(trans)) gChesD.gChes.attr('transform', trans)
    return gChesD.gChes
  }




  let com = {}
  com.chesXY = { x: {}, y: {} }

  let zoomTarget = null
  let zoomLen = {}
  let telData = null
  let telTypeV = null
  let prop0 = 'health'

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
    ches: 'zoomToTargetChes'
  }


  // ------------------------------------------------------------------
  //  Chess function
  // ------------------------------------------------------------------
  function createChessMap (optIn) {
    com.svgChesZoom = d3.zoom().scaleExtent([zoomLen['0.0'], zoomLen['1.3']])
    // com.svgChesZoom.on('start', com.svgZoomStart)
    // com.svgChesZoom.on('zoom', com.svgZoomDuringChes)
    // com.svgChesZoom.on('end', com.svgZoomEnd)

    gChesD.svgChes = gChesD.gBaseChes.append('g')

    gChesD.gBaseChes
      .call(com.svgChesZoom)
      .on('dblclick.zoom', null)
      .on('wheel', function () {
        d3.event.preventDefault()
      })

    // save the svg node to use for d3.zoomTransform() later
    gChesD.svgChesZoomNode = gChesD.gBaseChes.nodes()[0]
    gChesD.gChesZoomed = gChesD.svgChes.append('g')

    // add one rectangle as background, and to allow click to zoom
    // ------------------------------------------------------------------

    let gChesRec = gChesD.svgChes.append('g')

    com.gChes = {}
    com.gChes.g = gChesD.svgChes.append('g')
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

    let xyrFlat = Object.values(com.gChes.xyr)
    com.chesXY.x.min = minMaxObj({
      minMax: 'min', data: xyrFlat, func: (x => x.x - 1. * x.r)
    })
    com.chesXY.x.max = minMaxObj({
      minMax: 'max', data: xyrFlat, func: (x => x.x + 1. * x.r)
    })
    com.chesXY.y.min = minMaxObj({
      minMax: 'min', data: xyrFlat, func: (x => x.y - 1. * x.r)
    })
    com.chesXY.y.max = minMaxObj({
      minMax: 'max', data: xyrFlat, func: (x => x.y + 1. * x.r)
    })

    gChesRec
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
  function initData (dataIn) {
    if (hasVar(gChesD.svgChes)) return

    telData = dataIn.instrumentData
    telTypeV = dataIn.telTypeV

    createChessMap()
    gTrans()

    // initialize the target name for hovering->zoom
    thisTop.target = zoomTarget
    // programatic zoom to some target and scale - only use the last of any set of ovelapping zoom requests
    runLoop.init({
      tag: zoomToTargetTag.ches,
      func: doZoomToTarget,
      nKeep: -1
    })

    // // the actual function to be called when a zoom needs to be put in the queue
    // zoomToTrgQuick = function (optIn) {
    //   zoomToTargetNow(optIn, 'ches')
    // }
    // thisTop.zoomToTrgQuick = zoomToTrgQuick

    setStateOnce(dataIn)

    locker.remove('inInitChes')
  }
  this.initData = initData
  
  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function setStateOnce (dataIn) {
    updateChessMap(telData.tel, false)
    // updateChessMap(telData.tel, isSouth ? 2.7 : 5, false)
  }
  this.setStateOnce = setStateOnce

  // // ------------------------------------------------------------------
  // // initialize a global function (to be overriden below)
  // // ------------------------------------------------------------------
  // let zoomToTrgQuick = function (optIn) {
  //   if (!locker.isFree('inInit')) {
  //     setTimeout(function () {
  //       zoomToTrgQuick(optIn)
  //     }, timeD.waitLoop)
  //   }
  // }
  // thisTop.zoomToTrgQuick = zoomToTrgQuick
  // // initialize a couple of functions to be overriden below
  
  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let getScale = function () {
    return zoomLen['0.0']
  }
  this.getScale = getScale
  
  let getTrans = function () {
    return [0, 0]
  }
  this.getTrans = getTrans

  // // ------------------------------------------------------------------
  // // 
  // // ------------------------------------------------------------------
  // function zoomToTargetNow (optIn, tagNow) {
  //   console.log(' X??X zoomToTargetNow')
  //   let tagNowUp = tagNow
  //   if (tagNowUp === 'ches') {
  //     tagNowUp = 'Ches'
  //   }

  //   if (!locker.isFree('inInit')) {
  //     setTimeout(function () {
  //       zoomToTargetNow(optIn, tagNow)
  //     }, timeD.waitLoop)
  //     return
  //   }
  //   if (!locker.isFreeV(['autoZoomTarget', 'zoomToTarget' + tagNowUp])) {
  //     return
  //   }

  //   let targetName = optIn.target
  //   let targetScale = optIn.scale
  //   let durFact = optIn.durFact

  //   // console.log('dddddd',telData.mini)

  //   if (targetScale < zoomLen['0.0']) targetScale = getScale()

  //   let transTo
  //   if (targetName === '' || !hasVar(telData.mini[targetName])) {
  //     let scale = getScale()
  //     let trans = getTrans()
  //     let x = (baseH / 2 - trans[0]) / scale
  //     let y = (baseH / 2 - trans[1]) / scale
  //     transTo = [x, y]
  //   } else {
  //     transTo = [telData.mini[targetName].x, telData.mini[targetName].y]
  //   }

  //   let funcStart = function () {
  //     locker.add({ id: 'zoomToTarget' + tagNowUp, override: true })
  //     // console.log('xxx',targetName);
  //   }
  //   let funcDuring = function () {}
  //   let funcEnd = function () {
  //     locker.remove('zoomToTarget' + tagNowUp)
  //   }

  //   let outD = {
  //     trgScale: targetScale,
  //     durFact: durFact,
  //     baseTime: 300,
  //     transTo: transTo,
  //     wh: [baseH, baseH],
  //     cent: null,
  //     funcStart: funcStart,
  //     funcEnd: funcEnd,
  //     funcDuring: funcDuring,
  //     svg: gChesD['svg' + tagNowUp],
  //     svgZoom: com['svg' + tagNowUp + 'Zoom'],
  //     svgBox: gChesD['g' + tagNowUp + 'Zoomed'],
  //     svgZoomNode: gChesD['svg' + tagNowUp + 'ZoomNode']
  //   }

  //   if (durFact < 0) {
  //     outD.durFact = 0
  //     doZoomToTarget(outD)
  //   } else {
  //     runLoop.push({ tag: zoomToTargetTag[tagNow], data: outD })
  //   }
  // }

  return
}

