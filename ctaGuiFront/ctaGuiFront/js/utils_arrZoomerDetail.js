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
  let thisQuickMap = this
  let runLoop = optIn0.runLoop
  let sgvTag = optIn0.sgvTag
  let widgetId = optIn0.widgetId
  let locker = optIn0.locker
  let isSouth = optIn0.isSouth

  let instruments = optIn0.instruments
  let rScale = instruments.rScale

  let baseH = 500
  let addChesOutline = false
  let showVor = false

  let svgMainArrZoomer = optIn0.svgMainArrZoomer
  let gChesD = svgMainArrZoomer.ches
  gChesD.g = svgMainArrZoomer.gSvg.append('g')
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
  function getG (tag) {
    return gChesD.gChes
    // // make sure we start with upper case
    // tag = tag.charAt(0).toUpperCase() + tag.slice(1)
    // return gChesD['g' + tag]
  }
  thisQuickMap.getG = getG
  // thisQuickMap.getG('ches').attr('transform', function (d) {
  //   return 'translate(100,0)scale(4)'
  // })



  let com = {}
  com.chesXY = { x: {}, y: {} }

  let zoomTarget = null
  let zoomLen = {}
  let telData = null
  let telTypeV = null
  let prop0 = 'health'

  locker.add('inInitChes')

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
    if (hasVar(gChesD.svgChes)) return

    telData = dataIn.instrumentData
    telTypeV = dataIn.telTypeV

    createChessMap()
    gTrans()

    // initialize the target name for hovering->zoom
    thisQuickMap.target = zoomTarget
    // programatic zoom to some target and scale - only use the last of any set of ovelapping zoom requests
    runLoop.init({
      tag: zoomToTargetTag.ches,
      func: doZoomToTarget,
      nKeep: -1
    })

    // the actual function to be called when a zoom needs to be put in the queue
    zoomToTrgQuick = function (optIn) {
      zoomToTargetNow(optIn, 'ches')
    }
    thisQuickMap.zoomToTrgQuick = zoomToTrgQuick

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

  // ------------------------------------------------------------------
  // initialize a global function (to be overriden below)
  // ------------------------------------------------------------------
  let zoomToTrgQuick = function (optIn) {
    if (!locker.isFree('inInit')) {
      setTimeout(function () {
        zoomToTrgQuick(optIn)
      }, timeD.waitLoop)
    }
  }
  thisQuickMap.zoomToTrgQuick = zoomToTrgQuick
  // initialize a couple of functions to be overriden below
  
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

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function zoomToTargetNow (optIn, tagNow) {
    console.log('zoomToTargetNow')
    let tagNowUp = tagNow
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

    let targetName = optIn.target
    let targetScale = optIn.scale
    let durFact = optIn.durFact

    console.log('dddddd',telData.mini)

    if (targetScale < zoomLen['0.0']) targetScale = getScale()

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
      svg: gChesD['svg' + tagNowUp],
      svgZoom: com['svg' + tagNowUp + 'Zoom'],
      svgBox: gChesD['g' + tagNowUp + 'Zoomed'],
      svgZoomNode: gChesD['svg' + tagNowUp + 'ZoomNode']
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













// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerDetail = function (optIn0) {
  let thisArrZoomerDetail = this
  let runLoop = optIn0.runLoop
  let sgvTag = optIn0.sgvTag
  let widgetId = optIn0.widgetId
  let locker = optIn0.locker
  let isSouth = optIn0.isSouth


  let svgMain = optIn0.svgMain
  let svgMainArrZoomer = optIn0.svgMainArrZoomer
  let instruments = optIn0.instruments
  let zoomD = optIn0.zoomD
  let rScale = instruments.rScale

  let aspectRatio = optIn0.aspectRatio
  let arrZoomerBase = optIn0.arrZoomerBase
  let getPropPosShift = arrZoomerBase.getPropPosShift
  let interpolate01 = arrZoomerBase.interpolate01
  let setZoomState = arrZoomerBase.setZoomState
  let propsS1 = arrZoomerBase.propsS1

  thisArrZoomerDetail.hasInit = false

  let lenD = {}
  lenD.w = {}
  lenD.h = {}

  lenD.w[0] = 500
  lenD.h[0] = lenD.w[0] * aspectRatio

  // let svg = {}
  let gDetailD = svgMainArrZoomer.detail
  gDetailD.g = svgMainArrZoomer.gSvg.append('g')
  gDetailD.gOuter = gDetailD.g.append('g')

  gDetailD.gS0 = gDetailD.gOuter.append('g')
  gDetailD.gS1 = gDetailD.gOuter.append('g')

  // ------------------------------------------------------------------
  // scale to 100x100 px
  // ------------------------------------------------------------------
  gDetailD.gOuter.attr('transform', function (d) {
    return 'translate(0,0)scale('+ (100 / lenD.w[0]) +')'
  })

  // ------------------------------------------------------------------
  // to avoid bugs, this is the g which should be used
  // for translations and sacling of this element
  // ------------------------------------------------------------------
  function getG () {
    return gDetailD.g
  }
  thisArrZoomerDetail.getG = getG

  console.log('111111111111111')
  thisArrZoomerDetail.getG().attr('transform', function (d) {
    return 'translate(250,250)scale(2.5)'
  })

  let com = {}
  let arcFunc = {}
  let arcPrev = {}
  arcPrev.ang = {}
  arcPrev.rad = {}

  let zoomTargetProp = ''

  let avgTelD = []
  $.each([0, 1], function (nState_, nState) {
    if (nState === 0) {
      avgTelD.push({ r: lenD.w[0] / 4, x: lenD.w[0] / 2, y: lenD.h[0] / 2 })
    }
    if (nState === 1) {
      let propH = lenD.h[0] / instruments.allProps0.length
      let propR = Math.min(propH * 0.4, lenD.w[0] / 15)
      let propY = propR * 1.25

      avgTelD.push({ r: propR, h: propY * 2 })
      $.each(instruments.allProps0, function (index, porpNow) {
        avgTelD[1][porpNow + 'x'] = propH * (0.5 + index)
        avgTelD[1][porpNow + 'y'] = lenD.h[0] - propY
      })
    }
  })
  // console.log('avgTelD',avgTelD)

  lenD.w[1] = lenD.w[0] // - avgTelD[1].h;
  lenD.h[1] = lenD.h[0] - avgTelD[1].h * 2

  // initialize a global function (to be overriden below)
  let zoomToPos = function (optIn) {
    if (!locker.isFree('inInit')) {
      setTimeout(function () {
        zoomToPos(optIn)
      }, timeD.waitLoop)
    }
  }
  this.zoomToPos = zoomToPos

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function initData (dataIn) {
    if(thisArrZoomerDetail.hasInit) return
    thisArrZoomerDetail.hasInit = true


    // ------------------------------------------------------------------
    // add one rectangle as background, and to allow click to zoom
    // ------------------------------------------------------------------
    gDetailD.gS0
      .append('g')
      .selectAll('rect')
      .data([0])
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', lenD.w[0])
      .attr('height', lenD.h[0])
      .attr('stroke-width', '0')
      .attr('fill', '#F2F2F2') // .attr("fill", "red")
      .on('click', function () {
        let scale = svgMain.getScale()
        if (scale >= zoomD.len['0.1'] && scale < zoomD.len['1.0']) {

          // console.log('FIXME - detail-0 - uncomment zoomToTrgMain')
          svgMain.zoomToTrgMain({
            target: zoomD.target,
            scale: zoomD.len['1.2'],
            durFact: 1
          })

        }
      })

    // the background grid
    bckPattern({
      com: com,
      gNow: gDetailD.gS0,
      gTag: 'gS0',
      lenWH: [lenD.w[0], lenD.h[0]],
      opac: 0.05,
      textureOrient: '2/8'
    })

    let s1Trans =
      'translate(' +
      0.05 * lenD.w[1] +
      ',' +
      0.2 * lenD.h[1] +
      ')scale(' +
      0.9 +
      ')'
    gDetailD.gS1.attr('transform', s1Trans)

    // ------------------------------------------------------------------
    // some initialization
    // ------------------------------------------------------------------
    // see: http://bl.ocks.org/mbostock/5100636
    com.arcTween = function (transition, optIn) {
      // if(optIn.skip != undefined && optIn.skip) return null;
      transition.attrTween('d', function (d, i) {
        let id = d.id
        if (hasVar(optIn.indexId)) id = optIn.indexId ? d.id : i

        if (hasVar(optIn.incIdV)) {
          if (optIn.incIdV.indexOf(id) === -1) return null
        }
        if (hasVar(optIn.excIdV)) {
          if (optIn.excIdV.indexOf(id) >= 0) return null
        }

        let tagNow = optIn.tagNow
        let angStr0 = optIn.angStr0
          ? arcFunc[tagNow][optIn.angStr0](d)
          : optIn.arcPrev[tagNow].ang[id][0]
        let angStr1 = optIn.angStr1
          ? arcFunc[tagNow][optIn.angStr1](d)
          : optIn.arcPrev[tagNow].ang[id][0]
        let angEnd0 = optIn.angEnd0
          ? arcFunc[tagNow][optIn.angEnd0](d)
          : optIn.arcPrev[tagNow].ang[id][1]
        let angEnd1 = optIn.angEnd1
          ? arcFunc[tagNow][optIn.angEnd1](d)
          : optIn.arcPrev[tagNow].ang[id][1]
        let radInr0 = optIn.radInr0
          ? arcFunc[tagNow][optIn.radInr0](d)
          : optIn.arcPrev[tagNow].rad[id][0]
        let radInr1 = optIn.radInr1
          ? arcFunc[tagNow][optIn.radInr1](d)
          : optIn.arcPrev[tagNow].rad[id][0]
        let radOut0 = optIn.radOut0
          ? arcFunc[tagNow][optIn.radOut0](d)
          : optIn.arcPrev[tagNow].rad[id][1]
        let radOut1 = optIn.radOut1
          ? arcFunc[tagNow][optIn.radOut1](d)
          : optIn.arcPrev[tagNow].rad[id][1]
        // console.log(tagNow,[angStr0,angStr1],[angEnd0,angEnd1],[radInr0,radInr1],[radOut0,radOut1])

        let needUpd = 0
        if (Math.abs(angStr0 - angStr1) / angStr0 > 1e-5) needUpd++
        if (Math.abs(angEnd0 - angEnd1) / angEnd0 > 1e-5) needUpd++
        if (Math.abs(radInr0 - radInr1) / radInr0 > 1e-5) needUpd++
        if (Math.abs(radOut0 - radOut1) / radOut0 > 1e-5) needUpd++
        if (needUpd === 0) return null

        let arc = d3.arc()
        return function (t) {
          let intrNow = interpolate01(t)
          d.startAngle = angStr0 + (angStr1 - angStr0) * intrNow
          d.endAngle = angEnd0 + (angEnd1 - angEnd0) * intrNow
          d.innerRadius = radInr0 + (radInr1 - radInr0) * intrNow
          d.outerRadius = radOut0 + (radOut1 - radOut0) * intrNow

          optIn.arcPrev[tagNow].ang[id][0] = d.startAngle
          optIn.arcPrev[tagNow].ang[id][1] = d.endAngle
          optIn.arcPrev[tagNow].rad[id][0] = d.innerRadius
          optIn.arcPrev[tagNow].rad[id][1] = d.outerRadius

          return arc(d)
        }
      })
    }

    // state-01 initialization (needed before s01inner(), s01outer())
    com.s01 = {}
    com.s01.g = gDetailD.gS0.append('g')
    com.s01.gText = gDetailD.gS0.append('g')

    // state-1 initialization (needed before updateLiveDataS1())
    com.s10 = {}
    com.s10.g = gDetailD.gS1.append('g')

    locker.remove('inInitDetail')
  }
  this.initData = initData

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setStateOnce () {
    // console.log('setStateDetail ----',getScale(),optIn)
    let scale = svgMain.getScale()

    if (scale < zoomD.len['1.0']) {
      telHirch({ telId: '', clickIn: false, remove: true })
    }

    if (scale <= zoomD.len['0.1']) {
      let propsIn = {
        telId: 'avg',
        propD: instruments.props[''],
        propDv: instruments.props0[''],
        propTtlD: instruments.propTitles['']
      }

      telArcs([instruments.data.avg], propsIn, 0)
      setSubProp({ telId: 'avg', propIn: '' })
    } else {
      let targetIndex = instruments.data.idToIndex[zoomD.target]
      let propsIn = {
        telId: zoomD.target,
        propD: instruments.props[zoomD.target],
        propDv: instruments.props0[zoomD.target],
        propTtlD: instruments.propTitles['']
      }

      if (scale < zoomD.len['1.0']) {
        telArcs([instruments.data.tel[targetIndex]], propsIn, 0)
        setSubProp({ telId: zoomD.target, propIn: '' })
      } else {
        telArcs([instruments.data.tel[targetIndex]], propsIn, 1)
      }
    }
  }
  this.setStateOnce = setStateOnce

  // ------------------------------------------------------------------
  // innner arcs for the different properties
  // ------------------------------------------------------------------
  function telArcs (dataV, propsIn, state) {
    let tagState = 'state01'
    let telIdIn = propsIn.telId
    let propDin = propsIn.propD
    let propDinV = propsIn.propDv
    let propTtlIn = propsIn.propTtlD

    function getPropIndex (id, porpIn) {
      return instruments.props[id].indexOf(porpIn)
    }

    if (!hasVar(com.s01.inner)) {
      com.s01.inner = true

      $.each(instruments.allProps, function (_, porpNow) {
        $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
          let tagNow = porpNow + nArcDrawNow
          let is0 = nArcDrawNow === 0
          // console.log('--0--',tagNow)

          arcFunc[tagNow] = {}
          arcFunc[tagNow].rad00 = function (d) {
            return avgTelD[d.state].r * (is0 ? 0.1 : 0.1)
          }
          arcFunc[tagNow].rad01 = function (d) {
            return avgTelD[d.state].r * (is0 ? 0.95 : 0.99)
          }
          arcFunc[tagNow].ang00 = function (d) {
            if (d[porpNow] === undefined) return 0
            return getPropIndex(d.id, porpNow) * instruments.tauFracs[d.id] + instruments.tauSpace
          }
          arcFunc[tagNow].ang01 = function (d) {
            if (d[porpNow] === undefined) return 0
            return (
              getPropIndex(d.id, porpNow) * instruments.tauFracs[d.id] +
              instruments.tauSpace +
              (instruments.tauFracs[d.id] - instruments.tauSpace * 2) *
                (is0 ? 1 : telHealthFrac(d[porpNow]))
            )
          }
          arcFunc[tagNow].ang10 = function (d) {
            if (d[porpNow] === undefined) return 0
            return 0.1
          }
          arcFunc[tagNow].ang11 = function (d) {
            if (d[porpNow] === undefined) return 0
            return is0 ? tau : tau * telHealthFrac(d[porpNow])
          }
        })
      })
    }

    // ------------------------------------------------------------------
    // innner arcs for the different properties
    // ------------------------------------------------------------------
    let pos = {}
    let angState = {}
    let radState = {}

    $.each(instruments.allProps0, function (_, porpNow) {
      if (state === 0) {
        pos[porpNow] = { x: avgTelD[state].x, y: avgTelD[state].y }
        angState = { angStr1: 'ang00', angEnd1: 'ang01' }
        radState = { radInr1: 'rad00', radOut1: 'rad01' }
      } else {
        pos[porpNow] = {
          x: avgTelD[state][porpNow + 'x'],
          y: avgTelD[state][porpNow + 'y']
        }
        angState = { angStr1: 'ang10', angEnd1: 'ang11' }
        radState = { radInr1: 'rad10', radOut1: 'rad11' }
      }
    })

    $.each(instruments.allProps, function (_, porpNow) {
      $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
        let tagNow = porpNow + nArcDrawNow

        let is0 = nArcDrawNow === 0

        if (!hasVar(arcPrev[tagNow])) {
          arcPrev[tagNow] = {}
          arcPrev[tagNow].ang = {}
          arcPrev[tagNow].rad = {}
        }

        let dataVnow = dataV
        if (dataV.length > 0) {
          if (dataV[0][porpNow] === undefined) {
            dataVnow = []
          }
        }

        let path = com.s01.g
          .selectAll('path.' + tagNow)
          .data(dataVnow, function (d, i) {
            return i
          })

        // operate on new elements only
        path
          .enter()
          .append('path')
          .style('stroke-width', '0.05')
          .style('pointer-events', 'none')
          .attr('vector-effect', 'non-scaling-stroke')
          // .attr("id",        function(d) { return myUniqueId+d.id+tagNow; })
          .attr('class', tagState + ' ' + tagNow)
          // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
          .style('opacity', function (d) {
            return is0 ? '0.5' : '1'
          })
          .attr('transform', function (d) {
            return 'translate(' + pos[porpNow].x + ',' + pos[porpNow].y + ')'
          })
          .style('stroke', function (d) {
            return is0 ? null : telHealthCol(d[porpNow])
          })
          .style('fill', function (d) {
            return telHealthCol(d[porpNow])
          })
          .each(function (d, i) {
            d.state = state
            arcPrev[tagNow].ang[i] = [
              arcFunc[tagNow].ang00(d),
              arcFunc[tagNow].ang00(d)
            ]
            arcPrev[tagNow].rad[i] = [
              arcFunc[tagNow].rad00(d),
              arcFunc[tagNow].rad01(d)
            ]
          })
          .merge(path)
          .each(function (d, i) {
            d.state = state
          })
          .transition('update')
          .duration(timeD.animArc * 2)
          .attr('transform', function (d, i) {
            return 'translate(' + pos[porpNow].x + ',' + pos[porpNow].y + ')'
          })
          .style('stroke', function (d) {
            return is0 ? null : telHealthCol(d[porpNow])
          })
          .style('fill', function (d) {
            return telHealthCol(d[porpNow])
          })
          // .each(function (d, i) {
          //   // console.log('MNM', i, tagNow, '!!!',arcPrev[tagNow].ang[0], '!!!', d)
          // })
          // .each(function (d, i) {
          //   d.tauFracNow = tauFracIn
          // })
          .call(com.arcTween, {
            tagNow: tagNow,
            arcPrev: arcPrev,
            indexId: false,
            angStr0: null,
            angStr1: angState.angStr1,
            angEnd0: null,
            angEnd1: angState.angEnd1,
            radInr0: null,
            radInr1: 'rad00',
            radOut0: null,
            radOut1: 'rad01'
          })

        // operate on exiting elements only
        path
          .exit()
          .transition('out')
          .duration(timeD.animArc)
          .call(com.arcTween, {
            tagNow: tagNow,
            arcPrev: arcPrev,
            indexId: false,
            angStr0: null,
            angStr1: 'ang00',
            angEnd0: null,
            angEnd1: 'ang00',
            radInr0: null,
            radInr1: 'rad00',
            radOut0: null,
            radOut1: 'rad01'
          })
          .remove()
      })
    })

    // ------------------------------------------------------------------
    // outer rings for the instruments.prop0 (equivalent of s00_D metric in s01_D)
    // ------------------------------------------------------------------
    let porpAll = instruments.prop0

    if (!hasVar(com.s01.outer)) {
      com.s01.outer = true

      $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
        let tagNow = porpAll + nArcDrawNow
        let is0 = nArcDrawNow === 0

        arcFunc[tagNow] = {}
        arcFunc[tagNow].rad00 = function (d) {
          return avgTelD[d.state].r * rScale[0].health0 * (is0 ? 1 : 0.95)
        }
        arcFunc[tagNow].rad01 = function (d) {
          return avgTelD[d.state].r * rScale[0].health1 * (is0 ? 1 : 1.05)
        }
        arcFunc[tagNow].rad10 = function (d) {
          return avgTelD[d.state].r * rScale[1].health0 * (is0 ? 0.475 : 0.4)
        }
        arcFunc[tagNow].rad11 = function (d) {
          return avgTelD[d.state].r * rScale[1].health1 * (is0 ? 0.525 : 0.6)
        }
        arcFunc[tagNow].ang00 = function (d) {
          return 0
        }
        arcFunc[tagNow].ang01 = function (d) {
          return is0 ? tau : tau * telHealthFrac(d[instruments.prop0])
        }
      })
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
      let tagNow = porpAll + nArcDrawNow
      let is0 = nArcDrawNow === 0

      if (!hasVar(arcPrev[tagNow])) {
        arcPrev[tagNow] = {}
        arcPrev[tagNow].ang = {}
        arcPrev[tagNow].rad = {}
      }

      let path = com.s01.g
        .selectAll('path.' + tagNow)
        .data(dataV, function (d, i) {
          return i
        })

      // operate on new elements only
      path
        .enter()
        .append('path')
        .style('stroke-width', 0.05)
        .style('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
        // .attr("id",        function(d) { return myUniqueId+d.id+tagNow; })
        .attr('class', tagState + ' ' + tagNow)
        // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
        .style('opacity', function (d) {
          return is0 ? '0.5' : '1'
        })
        .attr('transform', function (d) {
          return 'translate(' + pos[porpAll].x + ',' + pos[porpAll].y + ')'
        })
        .style('stroke', function (d) {
          return is0 ? null : telHealthCol(d[porpAll])
        })
        .style('fill', function (d) {
          return telHealthCol(d[porpAll])
        })
        .each(function (d, i) {
          d.state = state
          arcPrev[tagNow].ang[i] = [
            arcFunc[tagNow].ang00(d),
            arcFunc[tagNow].ang00(d)
          ]
          arcPrev[tagNow].rad[i] = [
            arcFunc[tagNow].rad00(d),
            arcFunc[tagNow].rad01(d)
          ]
        })
        .merge(path)
        .each(function (d, i) {
          d.state = state
        })
        .transition('update')
        .duration(timeD.animArc * 2) // .delay(timeD.animArc)
        .attr('transform', function (d) {
          return 'translate(' + pos[porpAll].x + ',' + pos[porpAll].y + ')'
        })
        .style('stroke', function (d) {
          return is0 ? null : telHealthCol(d[porpAll])
        })
        .style('fill', function (d) {
          return telHealthCol(d[porpAll])
        })
        .call(com.arcTween, {
          tagNow: tagNow,
          arcPrev: arcPrev,
          indexId: false,
          angStr0: null,
          angStr1: null,
          angEnd0: null,
          angEnd1: 'ang01',
          radInr0: null,
          radInr1: radState.radInr1,
          radOut0: null,
          radOut1: radState.radOut1
        })

      // operate on exiting elements only
      path
        .exit()
        .transition('out')
        .duration(timeD.animArc)
        .call(com.arcTween, {
          tagNow: tagNow,
          arcPrev: arcPrev,
          indexId: false,
          angStr0: null,
          angStr1: 'ang00',
          angEnd0: null,
          angEnd1: 'ang00',
          radInr0: null,
          radInr1: 'rad00',
          radOut0: null,
          radOut1: 'rad01'
        })
        .remove()
    })

    // ------------------------------------------------------------------
    // invisible rectangle for selecting a property
    // ------------------------------------------------------------------
    let tagTitle = tagState + '_title'
    let tagRect = tagState + 'rect'

    let textD = []
    let recD = []

    let allPropsNow = state ? instruments.allProps0 : propDinV

    $.each(allPropsNow, function (_, porpNow) {
      let propIndex = getPropIndex(telIdIn, porpNow)
      let txtR = avgTelD[state].r * rScale[state].health1 * 1.2
      let xy = getPropPosShift('xy', txtR, propIndex, propDin.length)
      let opac = state === 0 ? 0.7 : 0.9
      if (state === 1 && propDin.indexOf(porpNow) === -1) opac *= 0.5

      if (instruments.allProps.indexOf(porpNow) >= 0) {
        textD.push({
          id: tagTitle + porpNow,
          text: propTtlIn[porpNow],
          prop: porpNow,
          h: state === 0 ? 30 : 16,
          xy: state === 0 ? xy : [0, 0],
          x: state === 0 ? avgTelD[state].x - xy[0] : pos[porpNow].x,
          y: state === 0 ? avgTelD[state].y - xy[1] : pos[porpNow].y,
          strkW: state === 1 ? 0.5 : 0.2,
          fWgt: state === 0 ? 'bold' : 'normal',
          opac: opac,
          anch:
            state === 1 || Math.abs(xy[0] / avgTelD[state].r) < 0.001
              ? 'middle'
              : xy[0] < 0 ? 'start' : 'end'
        })
      }

      let recH = avgTelD[1].h
      let recW = Math.abs(
        avgTelD[1][instruments.allProps[0] + 'x'] - avgTelD[1][instruments.allProps[1] + 'x']
      )
      let recX = avgTelD[1][porpNow + 'x'] - recH / 2 - (recW - recH) / 2
      let recY = lenD.h[0] - recH

      recD.push({
        id: tagRect + porpNow,
        prop: porpNow,
        h: avgTelD[1].h,
        w: recW,
        x: recX,
        y: recY
      })
    })

    let eleH = null

    let title = com.s01.gText
      .selectAll('text.' + tagTitle)
      .data(textD, function (d) {
        return d.id
      })

    title
      .enter()
      .append('text')
      // .attr("id", function(d) { return myUniqueId+d.id; })
      .text(function (d) {
        return d.text
      })
      .attr('class', tagState + ' ' + tagTitle) // class list for easy selection
      .style('opacity', '0')
      .style('fill-opacity', 0.7)
      .style('fill', '#383b42')
      // .attr("stroke-width", function(d) { return d.strkW; })
      .style('stroke', function (d) {
        return '#383b42'
      })
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .merge(title)
      .style('font-size', function (d) {
        return d.h + 'px'
      })
      .transition('update1')
      .duration(timeD.animArc * 2)
      .style('stroke-width', function (d) {
        return d.strkW
      })
      .style('stroke-opacity', 1)
      .style('font-weight', function (d) {
        return d.fWgt
      })
      .attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .attr('text-anchor', function (d) {
        return d.anch
      })
      .attr('dy', function (d) {
        if (!hasVar(eleH)) {
          eleH = getNodeHeightById({
            selction: com.s01.gText.selectAll('text.' + tagTitle),
            id: d.id,
            txtScale: true
          })
        }
        return eleH + 'px'
      })
      .style('opacity', function (d) {
        return d.opac
      })

    title
      .exit()
      .transition('exit')
      .duration(timeD.animArc)
      .style('opacity', '0')
      .remove()

    // ------------------------------------------------------------------
    // invisible rectangle for the selecting a property
    // ------------------------------------------------------------------
    let recDnow = state === 1 ? recD : []
    let rect = com.s01.gText
      .selectAll('rect.' + tagRect)
      .data(recDnow, function (d) {
        return d.id
      })

    rect
      .enter()
      .append('rect')
      .attr('class', tagRect)
      .attr('opacity', 0)
      // .attr('opacity', 0.1)
      .style('stroke-width', '0')
      // .style("fill", "#383b42").style("stroke", "red").attr("opacity", 0.1).style("stroke-width", "1")
      .attr('height', function (d) {
        return d.h
      })
      .attr('width', function (d) {
        return d.w
      })
      // .attr('height', recH)
      // .attr('width', recW)
      // .attr('transform', function (d) {
      //   return 'translate(' + -recW * 2 + ',' + recY + ')'
      // })
      .merge(rect)
      .on('click', recClick)
      .transition('enter')
      .duration(timeD.animArc)
      .attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })

    rect
      .exit()
      .transition('out')
      .duration(1)
      .remove()

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function recClick (d, i) {
      if (
        !locker.isFreeV(['s10bckArcChange', 'dataChange', 's10clickHirch'])
      ) {
        return
      }

      let clickIn = d.prop !== instruments.prop0
      let propIn = clickIn ? d.prop : ''
      if (propDin.indexOf(d.prop) === -1) {
        clickIn = true
        propIn = ''
      }

      // propsS1({ telId:zoomD.target, clickIn:clickIn, propIn:propIn, debug:"telArcs" }); // before 29/9

      // console.log('FIXME - detail-1 - uncomment zoomToTrgMain')
      svgMain.zoomToTrgMain({
        target: zoomD.target,
        scale: zoomD.len['1.2'],
        durFact: 1
      })

      propsS1({
        telId: zoomD.target,
        clickIn: clickIn,
        propIn: propIn,
        doFunc: ['bckArcClick'],
        debug: 'telArcs'
      })

      // // initialize the zoom
      // thisArrZoomerDetail.zoomToPos({ target:null, scale:1, durFact:1 });
    }
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  let prevTelHirchProp = ''
  function telHirch (optIn) {
    function mayUpdate () {
      return locker.isFree([
        'updateTelHirchDetail',
        'dataChange',
        's10bckArcChange',
        's10clickHirch',
        'updateTelHirch',
        'zoom',
        'autoZoomTarget',
        'zoomToTargetMini',
        'zoomToTargetChes'
      ])
    }
    if (!mayUpdate()) {
      setTimeout(function () {
        telHirch(optIn)
      }, timeD.animArc / 3)
      return
    }
    // if(!hasVar(optIn)) return;
    // console.log('telHirch',optIn);

    let tagState = 'state10'
    let tagNodes = tagState + 'circ'
    let tagText = tagState + '_text'
    let tagVor = tagState + '_vor'
    let tagLinks = tagState + '_path'

    let nodeR = 15
    let diffW = lenD.w[1] * 0.1
    let treeW = lenD.w[1] - diffW
    let treeH = lenD.h[1]

    function getEleId (d) {
      return d.data.id
    }

    let telId = ''
    let clickIn = false
    let propIn = ''
    let remove = false
    if (hasVar(optIn)) {
      if (hasVar(optIn.telId)) telId = optIn.telId
      if (hasVar(optIn.clickIn)) clickIn = optIn.clickIn
      if (hasVar(optIn.remove)) remove = optIn.remove
      if (hasVar(optIn.propIn)) propIn = optIn.propIn
    } else {
      // if(!hasVar(optIn) || isUpdate)
      propIn = prevTelHirchProp
      clickIn = propIn !== ''
    }

    if (zoomD.target !== telId || !hasVar(instruments.data.propDataS1[telId])) {
      clickIn = false
      remove = true
    } else if (propIn === '') {
      clickIn = false
    }

    // ------------------------------------------------------------------
    // update the title
    // ------------------------------------------------------------------
    setSubProp({ telId: telId, propIn: clickIn ? propIn : '' })

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    if (!remove && propIn !== '') {
      if (!hasVar(instruments.data.propDataS1[telId][propIn])) {
        return
      }
    }

    locker.add({ id: 'updateTelHirchDetail', override: true })

    // ------------------------------------------------------------------
    // define the containing g with small margins on the sides
    // ------------------------------------------------------------------
    if (!hasVar(com.s10.gHirch)) {
      com.s10.gHirch = com.s10.g.append('g')
      com.s10.gHirch.attr('transform', function (d) {
        return 'translate(' + diffW / 2 + ',' + 0 + ')'
      })
      // com.s10.gHirch.append("rect").style('opacity',0.3).style("fill",'transparent').attr("height", treeH).attr("width", treeW).style("stroke","red")
    }

    let hasDataBase = !clickIn && !remove && hasVar(instruments.data.dataBaseS1[telId])

    // ------------------------------------------------------------------
    // the tree hierarchy
    // ------------------------------------------------------------------
    let desc = []
    let dataPath = []
    let maxDepth = 0
    if (clickIn || hasDataBase) {
      // initialize the zoom upon any change of the hirch
      thisArrZoomerDetail.zoomToPos({
        target: null,
        scale: zoomD.len['0.0'],
        durFact: 1
      })

      let dataHirch = clickIn
        ? instruments.data.propDataS1[telId][propIn]
        : instruments.data.dataBaseS1[telId]
      let hirch = d3.hierarchy(dataHirch)

      // if(!clickIn) console.log('----===--',instruments.data.dataBaseS1[telId])
      // console.log('--==--',telId,propIn,hasVar(instruments.data.propDataS1[telId][propIn]),clickIn,dataHirch)

      let tree = d3.tree().size([treeH, treeW])
      tree(hirch)

      desc = hirch.descendants()
      dataPath = desc.slice(1)

      $.each(desc, function (index, dataNow) {
        maxDepth = Math.max(maxDepth, dataNow.depth)
      })

      let xV = []
      $.each(desc, function (index, dataNow) {
        if (maxDepth === dataNow.depth) {
          xV.push(Number(dataNow.x))
        }
      })

      let diffMin = -1
      if (xV.length > 1) {
        xV.sort(d3.ascending)

        diffMin = xV[1] - xV[0]
        $.each(xV, function (index, xNow) {
          if (index > 0) {
            let diffNow = xV[index] - xV[index - 1]
            if (diffNow < diffMin) diffMin = diffNow
          }
        })

        nodeR = Math.min(diffMin / 2.3, nodeR)
      } else {
        nodeR = 5
      }
      // console.log('---',xV,diffMin,nodeR)

      prevTelHirchProp = propIn
    } else {
      prevTelHirchProp = ''
    }

    function fontSize (d) {
      return Math.max(10, Math.min(d.nodeR * 2, 15))
    }

    // ------------------------------------------------------------------
    // circles
    // ------------------------------------------------------------------
    let circs = com.s10.gHirch
      .selectAll('circle.' + tagNodes)
      .data(desc, getEleId) // d.data.id

    circs
      .enter()
      .append('circle')
      .attr('class', tagNodes)
      // .attr("id", function(d) { return myUniqueId+tagNodes+d.data.id; })
      .attr('r', 0)
      .attr('transform', function (d) {
        return 'translate(' + d.y + ',' + d.x + ')'
      })
      .style('stroke', function (d) {
        return telHealthCol(d.data.val, 0.5)
      })
      .style('fill', function (d) {
        return telHealthCol(d.data.val)
      })
      .attr('opacity', 0.85)
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('pointer-events', 'none')
      .style('fill-opacity', 1)
      .merge(circs)
      .each(function (d) {
        d.nodeR = nodeR
      })
      .transition('update')
      .duration(timeD.animArc)
      .attr('transform', function (d) {
        return 'translate(' + d.y + ',' + d.x + ')'
      })
      .attr('r', function (d) {
        return d.nodeR
      })
      .style('stroke', function (d) {
        return telHealthCol(d.data.val)
      })
      .style('fill', function (d) {
        return telHealthCol(d.data.val)
      })
    // .each(function(d,i){ console.log(i,d.data); })

    circs
      .exit()
      .transition('out')
      .duration(timeD.animArc / 2)
      .attr('r', 0)
      .remove()

    // ------------------------------------------------------------------
    // labels
    // ------------------------------------------------------------------
    let text = com.s10.gHirch
      .selectAll('text.' + tagText)
      .data(desc, getEleId)

    text
      .enter()
      .append('text')
      .attr('class', tagText)
      .text(getTxt)
      .attr('transform', txtTrans)
      .style('font-size', function (d) {
        return fontSize(d) + 'px'
      })
      .style('text-anchor', txtAnch)
      .style('stroke', '#383b42')
      .attr('pointer-events', 'none')
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('opacity', 0)
      .merge(text)
      .style('stroke-width', clickIn ? 1 : 0.2)
      .style('font-size', function (d) {
        return fontSize(d) + 'px'
      })
      .transition('update')
      .duration(timeD.animArc)
      .attr('opacity', 1)
      .attr('transform', txtTrans)
      .style('text-anchor', txtAnch)
      // .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(getTxt)

    text
      .exit()
      .transition('out')
      .duration(timeD.animArc / 2)
      .attr('opacity', 0)
      .remove()

    function txtTrans (d, i) {
      let d0 = d.nodeR + Math.min(10, d.nodeR)
      let d1 = getNodeHeightById({
        selction: com.s10.gHirch.selectAll('text.' + tagText),
        id: getEleId(d),
        idFunc: getEleId,
        txtScale: true
      })

      return 'translate(' + (d.y - d0) + ',' + (d.x + d1) + ')'
    }
    function txtAnch (d) {
      return 'end'
      // if     (!d.parent)           return "start";
      // else if(maxDepth == d.depth) return "end";
      // else                         return "middle";
    }
    function getTxt (d) {
      return !d.parent || d.data.id === propIn ? '' : d.data.ttl
    }

    // ------------------------------------------------------------------
    // links
    // ------------------------------------------------------------------
    let path = com.s10.gHirch
      .selectAll('path.' + tagLinks)
      .data(dataPath, getEleId)

    path
      .enter()
      .append('path')
      .attr('class', tagLinks)
      .style('fill', 'transparent')
      .style('stroke', '#383b42')
      .style('stroke-width', '1')
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('pointer-events', 'none')
      .attr('opacity', 0)
      .attr('d', linkFunc)
      .merge(path)
      .attr('opacity', 0.15)
      .transition('update')
      .duration(timeD.animArc)
      .attr('d', linkFunc)

    path
      .exit()
      .transition('out')
      .duration(timeD.animArc / 2)
      .attr('opacity', 0)
      .remove()

    function linkFunc (d) {
      return (
        'M' +
        d.y +
        ',' +
        d.x +
        'C' +
        (d.y + d.parent.y) / 2 +
        ',' +
        d.x +
        ' ' +
        (d.y + d.parent.y) / 2 +
        ',' +
        d.parent.x +
        ' ' +
        d.parent.y +
        ',' +
        d.parent.x
      )
    }

    // ------------------------------------------------------------------
    // highlight on hover, using voronoi mapping
    // ------------------------------------------------------------------
    let vorFunc = d3
      .voronoi()
      .x(function (d) {
        return d.y
      })
      .y(function (d) {
        return d.x
      })
      .extent([[0, 0], [treeW, treeH]])

    let vor = com.s10.gHirch
      .selectAll('path.' + tagVor)
      .data(vorFunc.polygons(desc))

    vor
      .enter()
      .append('path')
      .attr('class', tagVor)
      .style('fill', 'transparent')
      .style('opacity', '0')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('stroke-width', 0)
      .style('opacity', 0)
      // .style("stroke-width", "1").style("opacity", "1")
      .style('stroke', '#383B42')
      .on('mouseover', function (d) {
        focusEle(d, true)
      })
      .on('mouseout', function (d) {
        focusEle(d, false)
      })
      .on('click', vorClick)
      .merge(vor)
      .call(function (d) {
        d.attr('d', vorPloyFunc)
      })

    vor
      .exit()
      .transition('out')
      .duration(timeD.animArc / 2)
      .attr('opacity', 0)
      .remove()

    // the click function
    // ------------------------------------------------------------------
    function vorClick (d) {
      setSubProp({ telId: telId, propIn: d.data.data.id })

      let clickIn = true
      let dId = d.data.data.id
      let idNow = hasVar(d.data.parent) ? d.data.parent.data.id : dId

      let parentName = instruments.data.propParentS1[telId][dId]
      if (parentName === dId) {
        idNow = parentName
      }

      // console.log('===',[parentName,dId,propIn,idNow],clickIn);
      if (!hasVar(parentName)) {
        parentName = ''
        clickIn = false
      }
      // console.log('---',[parentName,dId,propIn,idNow],clickIn); console.log('-------------------------------------');

      setZoomState()

      svgMain.bckArcClick({
        clickIn: clickIn,
        propIn: parentName,
        onlyOpen: true
      })

      svgMain.hirchStyleClick({
        propIn: parentName,
        id: idNow,
        isOpen: true,
        syncProp: dId
      })
    }

    // the highlight function
    // ------------------------------------------------------------------
    function focusEle (dIn, isOn) {
      let dInId = dIn.data.data.id

      if (isOn) {
        if (!mayUpdate()) return

        com.s10.gHirch
          .selectAll('circle.' + tagNodes)
          .transition('highlight')
          .duration(timeD.animArc / 2)
          .attr('r', function (d) {
            return d.data.id === dInId ? d.nodeR * 1.5 : d.nodeR
          })
          .style('fill-opacity', function (d) {
            return d.data.id === dInId ? 0.6 : 1
          })

        com.s10.gHirch
          .selectAll('text.' + tagText)
          .transition('highlight')
          .duration(timeD.animArc / 2)
          .style('font-size', function (d) {
            return (
              (d.data.id === dInId ? fontSize(d) * 2 : fontSize(d)) + 'px'
            )
          })
          .style('font-weight', function (d) {
            return d.data.id === dInId ? 'bold' : 'normal'
          })
      } else {
        if (!mayUpdate()) {
          setTimeout(function () {
            resetR()
          }, 20)
          return
        }

        resetR()
      }

      function resetR () {
        com.s10.gHirch
          .selectAll('circle.' + tagNodes)
          .transition('highlight')
          .duration(timeD.animArc / 2)
          .attr('r', function (d) {
            return d.nodeR
          })
          .style('fill-opacity', 1)

        com.s10.gHirch
          .selectAll('text.' + tagText)
          .transition('highlight')
          .duration(timeD.animArc / 2)
          .style('font-size', function (d) {
            return fontSize(d) + 'px'
          })
          .style('font-weight', 'normal')
      }
    }

    locker.remove({ id: 'updateTelHirchDetail', delay: timeD.animArc })
  }
  this.telHirch = telHirch

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setSubProp (optIn) {
    // console.log('setSubProp',optIn)
    zoomTargetProp = optIn.propIn
    let telId = optIn.telId
    let propIn = optIn.propIn
    let parentName =
      propIn === '' ? null : instruments.data.propParentS1[telId][propIn]

    telPropTitle({ telId: telId, propIn: propIn, parentName: parentName })
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function telPropTitle (optIn) {
    let telId = optIn.telId
    let propIn = optIn.propIn
    let parentName = optIn.parentName

    if (propIn !== '' && !hasVar(parentName)) return
    // console.log('telPropTitle',optIn)

    // ------------------------------------------------------------------
    // title on top
    // ------------------------------------------------------------------
    let tagState = 'state10'
    let tagNow = tagState + '_title'

    let ttlData = []
    ttlData.push({
      id: tagNow + 'telId',
      text: telId === 'avg' ? 'Array' : telInfo.getTitle(telId),
      x: 20,
      y: avgTelD[1].h / 2,
      h: 30,
      strkW: 1
    })

    if (hasVar(parentName)) {
      ttlData.push({
        id: tagNow + parentName,
        text: instruments.propTitles[telId][parentName],
        x: 10,
        y: avgTelD[1].h / 2,
        h: 30,
        strkW: 1
      })

      if (propIn !== parentName) {
        ttlData.push({
          id: tagNow + propIn,
          text: instruments.data.propTitleS1[telId][propIn],
          x: 10,
          y: avgTelD[1].h / 2,
          h: 25,
          strkW: 0
        })
      }
    }

    let title = com.s01.gText
      .selectAll('text.' + tagNow)
      .data(ttlData, function (d, i) {
        return i
      })

    let eleWH = [[], null]
    $.each(ttlData, function (i, d) {
      eleWH[0].push(null)
    })

    function textPos (d, i, isX) {
      if (isX) {
        let x = d.x
        $.each(ttlData, function (index0, dataNow0) {
          if (index0 < i) {
            if (!hasVar(eleWH[0][index0]) || eleWH[0][index0] === 0) {
              eleWH[0][index0] = getNodeWidthById({
                selction: com.s01.gText.selectAll('text.' + tagNow),
                id: dataNow0.id
              })
            }
            x += dataNow0.x + eleWH[0][index0]
          }
        })
        return x
      } else {
        if (!hasVar(eleWH[1]) || eleWH[1] === 0) {
          eleWH[1] = getNodeHeightById({
            selction: com.s01.gText.selectAll('text.' + tagNow),
            id: ttlData[0].id,
            txtScale: true
          })
        }
        return d.y + eleWH[1]
      }
    }

    title
      .enter()
      .append('text')
      .text(function (d) {
        return d.text
      })
      .attr('class', tagState + ' ' + tagNow) // class list for easy selection
      .style('font-weight', function (d, i) {
        return i === 0 ? 'bold' : 'normal'
      })
      .style('opacity', 0)
      .style('fill', '#383b42')
      .style('stroke-width', function (d) {
        return d.strkW
      })
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .style('stroke', function (d) {
        return '#383b42'
      })
      .attr('font-size', function (d) {
        return d.h + 'px'
      })
      .attr('transform', function (d, i) {
        d.pos = [lenD.w[0] * 1.1, textPos(d, i, false)]
        return 'translate(' + d.pos[0] + ',' + d.pos[1] + ')'
      })
      .merge(title)
      .text(function (d) {
        return d.text
      })
      .transition('update1')
      .duration(timeD.animArc) // .delay(timeD.animArc/2)
      .attr('transform', function (d, i) {
        d.pos = [textPos(d, i, true), textPos(d, i, false)]
        return 'translate(' + d.pos[0] + ',' + d.pos[1] + ')'
      })
      .style('opacity', 1)

    title
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('transform', function (d, i) {
        return 'translate(' + d.pos[0] * 2 + ',' + d.pos[1] + ')'
      })
      .style('opacity', 0)
      .remove()

    // ------------------------------------------------------------------
    // highlight rectangle for the selected property
    // ------------------------------------------------------------------
    let tagRect = tagState + '_rectSelect'

    // let propsNow = getTelProps(Object.keys(instruments.data.propParentS1[telId]), telId)

    let porpNow = propIn
    if (propIn !== '') {
      porpNow = instruments.data.propParentS1[telId][propIn]
    }
    // let porpNow =
    //   propD.indexOf(propIn) >= 0 || propIn === ''
    //     ? propIn
    //     : instruments.data.propParentS1[telId][propIn]
    // console.log('llllll', [propIn, porpNow], instruments.data.propParentS1[telId])

    // let porpX   = ((porpNow == "" || !clickIn) ? instruments.prop0: porpNow) + "x";
    let porpX = (porpNow === '' ? instruments.prop0 : porpNow) + 'x'
    let recH = avgTelD[1].h
    let recW = recH * 1.5
    let recX = avgTelD[1][porpX] - recH / 2 - (recW - recH) / 2
    let recY = lenD.h[0] - recH

    let dataV = svgMain.getScale() >= zoomD.len['1.0'] ? [{ id: porpX }] : []
    let rect = com.s01.g
      .selectAll('rect.' + tagRect)
      .data(dataV, function (d, i) {
        return i
      })
    // let rect = com.s01.g.selectAll("rect."+tagRect).data( (clickIn || hasDataBase) ? [{id:0}] : [] )

    rect
      .enter()
      .append('rect')
      .attr('class', tagRect)
      .style('fill', '#383b42')
      // .style("stroke", "#383b42")
      .style('pointer-events', 'none')
      .style('stroke-width', '0')
      .attr('opacity', 0)
      .attr('height', recH)
      .attr('width', recW)
      .attr('transform', function (d) {
        return 'translate(' + -recW * 2 + ',' + recY + ')'
      })
      .merge(rect)
      .transition('enter')
      .duration(timeD.animArc)
      .attr('opacity', 0.05)
      .attr('transform', function (d) {
        return 'translate(' + recX + ',' + recY + ')'
      })

    rect
      .exit()
      .transition('out')
      .duration(timeD.animArc)
      .attr('transform', function (d) {
        return 'translate(' + lenD.h[0] + ',' + recY + ')'
      })
      .attr('opacity', 0)
      .remove()
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function updateS1 (dataIn) {
    if (
      !locker.isFreeV([
        's10bckArcChange',
        's10clickHirch',
        'updateTelHirch'
      ]) ||
      !hasVar(com.s10.gHirch)
    ) {
      // console.log('will delay updateS1',dataIn);
      setTimeout(function () {
        updateS1(dataIn)
      }, timeD.animArc / 3)
      return
    }
    locker.add('updateTelHirch')

    com.s10.gHirch
      .selectAll('circle')
      .each(function (d) {
        if (d.data.id === instruments.prop0) {
          // console.log('updt',d.data.id,d.data.val,hasVar(dataIn[instruments.prop0]));
          d.data.val = dataIn[instruments.prop0]
        } else if (hasVar(dataIn.data[d.data.id])) {
          // console.log('updt',d.data.id,dataIn.data[d.data.id]);
          d.data.val = dataIn.data[d.data.id]
        }
      })
      .transition('s1_updtData')
      .duration(timeD.animArc)
      .style('stroke', function (d) {
        return telHealthCol(d.data.val)
      })
      .style('fill', function (d) {
        return telHealthCol(d.data.val)
      })

    locker.remove('updateTelHirch')
  }
  this.updateS1 = updateS1

  function getWidgetState () {
    return {
      zoomTargetProp: zoomTargetProp
    }
  }
  this.getWidgetState = getWidgetState

  return
}