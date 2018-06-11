/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global bckPattern */
/* global vorPloyFunc */
/* global doZoomToTarget */
/* global runLoop */
/* global checkFree */
/* global colsMix */

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.ScrollGrid = function (optIn) {
  let com = {}
  let mainTag = optIn.id
  let recD = optIn.recD
  let x0 = optIn.x0
  let y0 = optIn.y0
  let w0 = optIn.w0
  let h0 = optIn.h0
  let m0 = optIn.m0
  let runLoop = optIn.runLoop
  // let focus0 = optIn.focus0
  // let recOrder = optIn.recOrder
  let isHorz = optIn.isHorz
  // let tagVecDataIn = optIn.tagVecDataIn
  let checkFree = optIn.checkFree
  // let gIn = optIn.g
  let xy = isHorz ? 'x' : 'y'
  let wh0 = isHorz ? w0 : h0

  let isInvOrder = hasVar(optIn.isInvOrder) ? optIn.isInvOrder : false
  let showCounts = hasVar(optIn.showCounts) ? optIn.showCounts : true
  let tagClipPath = hasVar(optIn.tagClipPath)
    ? optIn.tagClipPath
    : mainTag + 'clipPath'
  let autoClipPath = hasVar(optIn.autoClipPath) ? optIn.autoClipPath : true

  let bckRecOpt = optIn.bckRecOpt
  if (!hasVar(bckRecOpt)) {
    bckRecOpt = { textureOrient: '5/8', frontProp: { strkWOcp: 0.2 } }
  }

  let onZoom = hasVar(optIn.onZoom) ? optIn.onZoom : {}
  // if(!hasVar(onZoom.start))  onZoom.start  = function(){};
  // if(!hasVar(onZoom.during)) onZoom.during = function(){};
  // if(!hasVar(onZoom.end))    onZoom.end    = function(){};

  com.gBase = optIn.gBox
  com.gBack = hasVar(optIn.gBack) ? optIn.gBack : com.gBase.append('g')
  com.gBckData = hasVar(optIn.gBckData) ? optIn.gBckData : com.gBase.append('g')
  com.gVor = hasVar(optIn.gVor) ? optIn.gVor : com.gBase.append('g')
  com.gFrntData = hasVar(optIn.gFrntData)
    ? optIn.gFrntData
    : com.gBase.append('g')

  let recV = hasVar(optIn.recV) ? optIn.recV : []
  let vorOpt = hasVar(optIn.vorOpt) ? optIn.vorOpt : {}
  // let invertZoom = hasVar(optIn.invertZoom) ? optIn.invertZoom : !isHorz

  let nRows = hasVar(optIn.nRows) ? optIn.nRows : 1
  let recW = hasVar(optIn.recW) ? optIn.recW : 45
  let recH = hasVar(optIn.recH) ? optIn.recH : recW
  let recM = hasVar(optIn.recM) ? optIn.recM : Math.min(recW, recH) * 0.2
  let recE = hasVar(optIn.recE) ? optIn.recE : recM * 3
  let recWH = isHorz ? recW : recH

  let scrollRec = hasVar(optIn.scrollRec) ? optIn.scrollRec : {}
  if (!hasVar(scrollRec.w)) scrollRec.w = (isHorz ? h0 : w0) * 0.125
  if (!hasVar(scrollRec.h)) scrollRec.h = 0
  if (!hasVar(scrollRec.marg)) scrollRec.marg = 0.6
  if (!hasVar(scrollRec.fontSize)) scrollRec.fontSize = scrollRec.w

  let checkFreeZoom = optIn.checkFreeZoom
  if (!hasVar(checkFreeZoom)) {
    checkFreeZoom = {
      all: mainTag + 'zoom',
      during: mainTag + 'zoomDuring',
      end: mainTag + 'zoomEnd'
    }
  }

  let checkFreeV = {}
  checkFreeV.checkFreeV = hasVar(optIn.checkFreeV) ? optIn.checkFreeV : []
  checkFreeV.zoomDuring = checkFreeV.checkFreeV
    .slice()
    .concat([checkFreeZoom.during])
  checkFreeV.zoomEnd = checkFreeV.checkFreeV.slice().concat([checkFreeZoom.end])

  let vorShowLines = hasVar(vorOpt.vorShowLines) ? vorOpt.vorShowLines : false
  let vorMouseover = hasVar(vorOpt.mouseover) ? vorOpt.mouseover : null
  let vorMouseout = hasVar(vorOpt.mouseout) ? vorOpt.mouseout : null
  let vorDblclick = hasVar(vorOpt.dblclick) ? vorOpt.dblclick : null
  let vorClick = hasVar(vorOpt.click) ? vorOpt.click : null
  let vorCall = hasVar(vorOpt.call) ? vorOpt.call : null

  let gName = mainTag + 'g'
  let tagOuter = mainTag + 'outer'
  // let tagInner = mainTag + 'inner'
  let tagZoom = mainTag + 'zoom'
  let tagDrag = mainTag + 'drag'
  let tagVor = mainTag + 'vor'
  let tagScrollBar = mainTag + 'scrollBar'
  let tagTxtOut = mainTag + 'recCounters'

  let isInDrag = false
  let isInScrollDrag = false
  // let isInZoom = false
  let inUserZoom = false
  let hasBotTop = false
  let scrollBarRec = null

  let zoomD = {
    xy0: isHorz ? x0 + recE : y0 + recE,
    xy1: isHorz ? x0 + w0 - recE - recW : y0 + h0 - recE - recH,
    // delta:    (isHorz ? 1 : -1) * recWH * 0.15,
    duration: 0,
    pause: 10,
    extent: [1, 1e20, 1e4],
    drag: { xy: isHorz ? x0 : y0, frac: 0 }
  }

  let recIn = {}
  recIn.idV = {}
  recIn.xyFrac = 0
  recIn.isLastIn = false

  recD[mainTag] = []

  // adjust for a possible top/left margin for a title
  if (hasVar(m0)) {
    if (isHorz) {
      h0 -= m0
      y0 += m0
    } else {
      w0 -= m0
      x0 += m0
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  this.set = function (type, data) {
    com[type] = data
  }
  // this.set = function(optIn) {
  //   if     (hasVar(optIn.data)) com[optIn.tag] = optIn.data;
  //   else if(hasVar(optIn.def))  com[optIn.tag] = optIn.def;
  //   else                        com[optIn.tag] = null;
  // };
  this.get = function (type) {
    return com[type]
  }
  this.getBackDataG = function () {
    return com.gBckData
  }
  this.getFrontDataG = function () {
    return com.gFrntData
  }

  // now add the vor tessalation
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setVor () {
    let scrollRecMarg
    if (!hasBotTop) scrollRecMarg = [0, 0]
    else scrollRecMarg = [isHorz ? 0 : scrollRec.w, isHorz ? scrollRec.w : 0]

    let extent = [
      [x0, y0],
      [x0 + w0 - scrollRecMarg[0], y0 + h0 - scrollRecMarg[1]]
    ]

    let vorFunc = d3
      .voronoi()
      .x(function (d) {
        return d.x + d.w / 2
      })
      .y(function (d) {
        return d.y + d.h / 2
      })
      .extent(extent)

    let vorData = recD[mainTag]

    let vor = com.gVor
      .selectAll('path.' + tagVor)
      .data(vorFunc.polygons(vorData), function (d) {
        if (d) return d.data.id
      })

    vor
      .enter()
      .append('path')
      .attr('class', tagVor)
      .style('fill', 'transparent')
      .style('opacity', '0')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('stroke-width', 0)
      .style('opacity', 0)
      .style('stroke', '#383B42')
      .style('stroke-width', '.5')
      .style('opacity', vorShowLines ? 1 : 0)
      .style('stroke', '#4F94CD')
      .on('mouseover', vorMouseover)
      .on('mouseout', vorMouseout)
      .on('dblclick', vorDblclick)
      .on('click', vorClick)
      // .style("pointer-events", "none")
      // .call(com[tagDrag])
      // .on("mouseover", function(d) { console.log(d.data.id);  }) // debugging
      .merge(vor)
      // .transition("clipPath").duration(1000)
      .call(function (d) {
        d.attr('d', vorPloyFunc)
      })

    vor.exit().remove()

    if (vorCall) {
      com.gVor.selectAll('path.' + tagVor).call(vorCall)
    } else if (hasBotTop) {
      com.gVor.selectAll('path.' + tagVor).call(com[tagDrag])
    }
  }

  function xyFracZoom (xyFracIn) {
    let trans = 0
    let recLen = recD[mainTag].length

    recIn.xyFrac = 0

    if (recLen < 2) return trans

    let xyMinMax =
      recWH + recD[mainTag][recLen - 1][xy] - recD[mainTag][0][xy] + 2 * recE
    let fracScale = xyMinMax - wh0

    if (recD[mainTag][0][xy] < zoomD.xy0) {
      recIn.xyFrac = (zoomD.xy0 - recD[mainTag][0][xy]) / fracScale
      recIn.xyFrac = Math.min(1, Math.max(0, recIn.xyFrac))
    }

    if (hasVar(xyFracIn)) {
      let fracDif = Math.min(
        1,
        Math.max(0.0001, Math.abs(xyFracIn - recIn.xyFrac))
      )
      trans = (xyFracIn > recIn.xyFrac ? 1 : -1) * fracDif * fracScale
    }

    return trans
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateCounts () {
    let xyMin = (isHorz ? x0 : y0) - recWH / 2
    let xyMax = (isHorz ? x0 + w0 : y0 + h0) - recWH / 2
    let xyEdgeX = isHorz
      ? [x0, x0 + w0]
      : [x0 + w0 - scrollRec.w / 2, x0 + w0 - scrollRec.w / 2]
    let xyEdgeY = isHorz
      ? [y0 + h0 - scrollRec.w / 2, y0 + h0 - scrollRec.w / 2]
      : [y0, y0 + h0]
    // let focusEdge = isHorz ? x0 : y0;

    recIn.idV = {}
    recIn.xyFrac = 0
    recIn.isLastIn = false
    let recLen = recD[mainTag].length

    if (recLen > 0) {
      xyFracZoom()

      let nRecOut = [0, 0]
      $.each(recD[mainTag], function (index, dataNow) {
        if (dataNow[xy] < xyMin) {
          nRecOut[0] += 1
        } else if (dataNow[xy] > xyMax) {
          nRecOut[1] += 1
        } else {
          recIn.idV[dataNow.id] = dataNow[xy]
          if (index === recLen - 1) recIn.isLastIn = true
        }
      })

      if (showCounts) {
        let textDataOut = []
        $.each(nRecOut, function (index, nRecOutNow) {
          if (nRecOutNow > 0) {
            let rNow = scrollRec.fontSize * (nRecOutNow < 100 ? 1.2 : 1.5)
            textDataOut.push({
              id: mainTag + 'nRecOut' + index,
              txt: '' + nRecOutNow,
              x: xyEdgeX[index],
              y: xyEdgeY[index],
              r: rNow
            })
          }
        })

        let circOut = com.gVor
          .selectAll('circle.' + tagTxtOut)
          .data(textDataOut, function (d) {
            return d.id
          })

        let textOut = com.gVor
          .selectAll('text.' + tagTxtOut)
          .data(textDataOut, function (d) {
            return d.id
          })

        circOut
          .enter()
          .append('circle')
          .attr('class', tagTxtOut)
          .style('opacity', 0)
          .attr('cx', function (d) {
            return d.x
          })
          .attr('cy', function (d) {
            return d.y
          })
          .attr('r', 0)
          .style('stroke-width', 0)
          .attr('vector-effect', 'non-scaling-stroke')
          .style('pointer-events', 'none')
          .attr('fill', '#383b42')
          .merge(circOut)
          .transition('inOut')
          .duration(timeD.animTxt)
          .attr('r', function (d) {
            return d.r
          })
          .style('opacity', 0.7)

        circOut
          .exit()
          .transition('inOut')
          .delay(timeD.animTxt)
          .duration(timeD.animTxt)
          .attr('r', 0)
          .style('opacity', 0)
          .remove()

        textOut
          .enter()
          .append('text')
          .attr('class', tagTxtOut)
          .style('font-weight', 'bold')
          .style('opacity', 0)
          .style('fill-opacity', 0.9)
          .attr('fill', '#F2F2F2')
          .attr('vector-effect', 'non-scaling-stroke')
          .style('pointer-events', 'none')
          .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')'
          })
          .attr('text-anchor', 'middle')
          .merge(textOut)
          // .text(function (d) { return d.txt; })
          .style('font-size', function (d) {
            return scrollRec.fontSize + 'px'
          })
          .attr('dy', function (d) {
            return scrollRec.fontSize / 3 + 'px'
          })
          .transition('inOut')
          .duration(timeD.animTxt)
          .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')'
          })
          .tween('text', function (d) {
            return tweenText(d3.select(this), +d.txt)
          })
          .style('opacity', 1)

        textOut
          .exit()
          .transition('inOut')
          .duration(timeD.animTxt)
          .tween('text', function (d) {
            return tweenText(d3.select(this), 0)
          })
          .style('opacity', 0)
          .remove()
      }
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let formatInt = d3.format('d')
  function tweenText (thisEle, newVal) {
    let prevText = thisEle.text()
    let interpolate = d3.interpolate(prevText, newVal)
    return function (t) {
      thisEle.text(formatInt(interpolate(t)))
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  com.totTrans = 0
  function setupZoom () {
    com.zoomStart = function () {
      if (!hasBotTop) return
      if (hasVar(onZoom.start)) {
        onZoom.start({ id: mainTag, type: 'start', duration: 0 })
      }
    }

    let delay = 0
    com.zoomDuring = function () {
      if (!hasBotTop) return
      // if(!hasVar(d3.event.sourceEvent)) return;
      // isInZoom = true
      inUserZoom = hasVar(d3.event.sourceEvent)

      if (checkFree.isFreeV(checkFreeV.zoomDuring)) {
        checkFree.add({ id: checkFreeZoom.all, override: true })
        checkFree.add({ id: checkFreeZoom.during, override: true })

        let trans = null
        delay = 0
        if (inUserZoom) {
          let wdX = d3.event.sourceEvent.deltaX
          let wdY = d3.event.sourceEvent.deltaY
          let wdXY = Math.abs(wdX) > Math.abs(wdY) ? -1 * wdX : wdY //* (isHorz?1:-1);

          // trans = hasVar(wdXY) ? (((wdXY > 0)?1:-1) * zoomD.delta) : 0;
          trans = hasVar(wdXY) ? -1 * wdXY : 0
        }

        com.doTrans(trans)

        checkFree.remove({ id: checkFreeZoom.during, delay: delay })
      }

      // console.log(d3.zoomTransform(com[tagZoom+"zoomNode"]).k);
    }

    com.doTrans = function (trans) {
      if (Math.abs(trans) < wh0 * 1e-10) return

      if (hasVar(trans)) {
        let recLastI = recD[mainTag].length - 1

        if (recD[mainTag][0][xy] + trans > zoomD.xy0) {
          if (recD[mainTag][0][xy] < zoomD.xy0) {
            trans = zoomD.xy0 - recD[mainTag][0][xy]
          } else trans = null
        } else if (recD[mainTag][recLastI][xy] + trans < zoomD.xy1) {
          if (recD[mainTag][recLastI][xy] > zoomD.xy1) {
            trans = zoomD.xy1 - recD[mainTag][recLastI][xy]
          } else trans = null
        }
      }

      if (hasVar(trans)) {
        delay = zoomD.pause

        $.each(recD[mainTag], function (index, dataNow) {
          dataNow[xy] += trans
        })

        if (hasVar(onZoom.during)) {
          onZoom.during({
            id: mainTag,
            type: 'during',
            xy: xy,
            wh: recWH,
            duration: 0
          })
        }
        // else {
        //   let totTrans = recD[mainTag][0][xy] - recD[mainTag][0].xy0;

        //   com.gBckData.attr("transform", function(d,i) {
        //     return "translate(0,"+totTrans+")";
        //   })

        //   com.clipRec.attr("transform", function(d,i) {
        //     return "translate(0,"+(-1*totTrans)+")";
        //   })
        // }

        updateCounts()
        zoomScrollBarUpdate()
      }
    }

    com.zoomEnd = function () {
      if (!hasBotTop) return

      let hasUpdCount = false
      if (checkFree.isFreeV(checkFreeV.zoomEnd)) {
        checkFree.add({ id: checkFreeZoom.end, override: true })

        // let delta    = zoomD.delta;
        let recLastI = recD[mainTag].length - 1

        let trans = null
        if (recLastI > 0) {
          if (recD[mainTag][0][xy] > zoomD.xy0) {
            trans = zoomD.xy0 - recD[mainTag][0][xy]
          }
          if (recD[mainTag][recLastI][xy] < zoomD.xy1) {
            trans = zoomD.xy1 - recD[mainTag][recLastI][xy]
          }
        }
        if (hasVar(trans)) {
          $.each(recD[mainTag], function (index, dataNow) {
            dataNow[xy] += trans
          })

          hasUpdCount = true
          updateCounts()
          zoomScrollBarUpdate()
        }

        if (hasVar(onZoom.end)) {
          onZoom.end({
            id: mainTag,
            type: 'end',
            xy: xy,
            wh: recWH,
            duration: zoomD.duration
          })
        }

        // reset the zoom to allow infinity scrolling
        let outD = {
          trgScale: zoomD.extent[2],
          durFact: 0,
          baseTime: 0,
          transTo: [0, 0],
          wh: [w0, h0],
          cent: null,
          funcEnd: function () {
            checkFree.remove({
              id: checkFreeZoom.end,
              override: true,
              delay: zoomD.duration
            })
          },
          svg: com.gVor,
          svgZoom: com[tagZoom],
          svgBox: com[tagZoom + 'zoomed'],
          svgZoomNode: com[tagZoom + 'zoomNode']
        }

        doZoomToTarget(outD)

        setVor()

        return
      }

      if (!hasUpdCount) {
        updateCounts()
        zoomScrollBarUpdate()
      }

      if (!isInDrag) {
        checkFree.remove({
          id: checkFreeZoom.all,
          override: true,
          delay: zoomD.duration
        })
      }
      // isInZoom = false
      inUserZoom = false

      zoomD.duration = 0
    }

    com.dragStart = function (coords) {
      checkFree.add({ id: checkFreeZoom.all, override: true })

      // if has a scrill bar and the mouse is over it (otherwise it will interfere with click)
      isInScrollDrag = false
      if (hasBotTop) {
        if (isHorz && coords[1] > y0 + h0 - scrollRec.w) isInScrollDrag = true
        if (!isHorz && coords[0] > x0 + w0 - scrollRec.w) isInScrollDrag = true
      }

      if (isInScrollDrag) {
        if (isHorz) zoomD.drag.xy = coords[0] - (x0 + zoomD.drag.frac * w0)
        else zoomD.drag.xy = coords[1] - (y0 + zoomD.drag.frac * h0)
      } else {
        com.zoomStart()
      }
    }

    com.dragDuring = function (coordsIn) {
      isInDrag = true

      if (isInScrollDrag) {
        let coords = [coordsIn[0], coordsIn[1]]
        if (isHorz) coords[0] -= zoomD.drag.xy
        else coords[1] -= zoomD.drag.xy

        _recBckClick({ coords: coords, duration: 0 })
      } else {
        let trans = isHorz ? -d3.event.dx : d3.event.dy
        com.doTrans(trans)
      }
    }

    com.dragEnd = function () {
      checkFree.remove({ id: checkFreeZoom.all, override: true })

      if (!isInScrollDrag) com.zoomEnd()

      isInDrag = false
      isInScrollDrag = false
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com[tagZoom] = d3.zoom().scaleExtent([zoomD.extent['0'], zoomD.extent['1']])
    com[tagZoom]
      .on('start', com.zoomStart)
      .on('zoom', com.zoomDuring)
      .on('end', com.zoomEnd)

    // needed for auotomatic zoom
    com[tagZoom + 'zoomNode'] = com.gVor.nodes()[0]
    com[tagZoom + 'zoomed'] = com.gVor.append('g')

    com[tagDrag] = d3.drag()
    com[tagDrag]
      .on('start', function (d) {
        com.dragStart(d3.mouse(this))
      })
      .on('drag', function (d) {
        com.dragDuring(d3.mouse(this))
      })
      .on('end', function (d) {
        com.dragEnd()
      })

    setZoomStatus()
  }

  // ---------------------------------------------------------------------------------------------------
  // activate/disable the zoom behaviour
  // ---------------------------------------------------------------------------------------------------
  function setZoomStatus () {
    if (hasBotTop) com.gVor.call(com[tagZoom]).on('dblclick.zoom', null)
    else com.gVor.on('.zoom', null)
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function zoomScrollBarUpdate () {
    if (!hasVar(scrollBarRec)) return

    // instant transition in case of dragging
    if (isInDrag || inUserZoom) {
      scrollBarRec.attr('transform', zoomScrollBarTrans)
    } else {
      scrollBarRec
        .transition('move')
        .duration(timeD.animArc)
        .attr('transform', zoomScrollBarTrans)
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function zoomScrollBarInit () {
    if (!checkFree.isFree(mainTag + 'zoomScrollBarInit')) return

    checkFree.add({ id: mainTag + 'zoomScrollBarInit', override: true })
    scrollBarRec = null

    // ---------------------------------------------------------------------------------------------------
    let nDone = 0
    let dataBck = hasBotTop ? [{ id: 'zoomScrollBarBck', x: wh0 }] : []
    let recBck = com.gVor
      .selectAll('rect.' + tagScrollBar + 'bck')
      .data(dataBck, function (d) {
        return d.id
      })

    recBck
      .enter()
      .append('rect')
      .attr('class', tagScrollBar + 'bck')
      .attr('stroke', '#383B42')
      .attr('stroke-width', '0.5')
      .style('stroke-opacity', '0.5')
      .style('fill', '#383B42')
      .style('fill-opacity', '0.05')
      // .style("pointer-events", "none")
      .attr('x', isHorz ? x0 : x0 + w0)
      .attr('y', isHorz ? y0 + h0 : y0)
      .attr('width', isHorz ? w0 : 0)
      .attr('height', isHorz ? 0 : h0)
      .on('click', function (d) {
        _recBckClick({ coords: d3.mouse(this) })
      })
      .call(com[tagDrag])
      .style('opacity', 1)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('x', isHorz ? x0 : x0 + w0 - scrollRec.w)
      .attr('y', isHorz ? y0 + h0 - scrollRec.w : y0)
      .attr('width', isHorz ? w0 : scrollRec.w)
      .attr('height', isHorz ? scrollRec.w : h0)
      .on('end', function (d) {
        nDone += 1
      })

    recBck
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('x', isHorz ? x0 : x0 + w0)
      .attr('y', isHorz ? y0 + h0 : y0)
      .attr('width', isHorz ? w0 : 0)
      .attr('height', isHorz ? 0 : h0)
      .remove()
      .on('end', function (d) {
        nDone += 1
      })

    // ---------------------------------------------------------------------------------------------------
    setRecScroll()

    // ---------------------------------------------------------------------------------------------------
    let nTries = 0
    let maxTries = 500
    function scrollBarRecSet () {
      setTimeout(function () {
        // console.log('ndone',nDone);

        if (nDone < 1 && nTries < maxTries) {
          scrollBarRecSet()
        } else {
          if (nTries >= maxTries) {
            console.error('cant seem to init zoomScrollBar ...')
          }

          scrollBarRec = com.gVor.selectAll('rect.' + tagScrollBar + 'scroll')
          checkFree.remove({ id: mainTag + 'zoomScrollBarInit' })
        }
        nTries += 1
      }, timeD.animArc / 5)
    }

    if (hasBotTop) {
      scrollBarRecSet()
    } else {
      checkFree.remove({ id: mainTag + 'zoomScrollBarInit' })
    }
  }

  // ---------------------------------------------------------------------------------------------------
  function setRecScroll () {
    let marg = scrollRec.w * scrollRec.marg / 2
    let recLen = recD[mainTag].length
    let xyMinMax = wh0
    if (recLen > 0) {
      if (hasVar(recD[mainTag][recLen - 1])) {
        xyMinMax =
          recWH +
          recD[mainTag][recLen - 1][xy] -
          recD[mainTag][0][xy] +
          2 * recE
      }
    }
    scrollRec.h = wh0 * (wh0 / xyMinMax)

    let dataScroll = hasBotTop ? [{ id: 'zoomScrollBarScroll' }] : []
    let recScroll = com.gVor
      .selectAll('rect.' + tagScrollBar + 'scroll')
      .data(dataScroll, function (d) {
        return d.id
      })

    recScroll
      .enter()
      .append('rect')
      .attr('class', tagScrollBar + 'scroll')
      .attr('stroke', '#383B42')
      .attr('stroke-width', '1')
      .style('stroke-opacity', '0.5')
      .style('fill', '#383B42')
      .style('fill-opacity', '0.9')
      .style('pointer-events', 'none')
      .attr('x', isHorz ? x0 + marg : x0 + w0)
      .attr('y', isHorz ? y0 + h0 : y0 + marg)
      .attr('width', isHorz ? scrollRec.h - marg * 2 : 0)
      .attr('height', isHorz ? 0 : scrollRec.h - marg * 2)
      .attr('transform', zoomScrollBarTrans)
      .merge(recScroll)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('transform', zoomScrollBarTrans)
      .attr('x', isHorz ? x0 + marg : x0 + w0 - scrollRec.w + marg)
      .attr('y', isHorz ? y0 + h0 - scrollRec.w + marg : y0 + marg)
      .attr('width', isHorz ? scrollRec.h - marg * 2 : scrollRec.w - marg * 2)
      .attr('height', isHorz ? scrollRec.w - marg * 2 : scrollRec.h - marg * 2)

    if (isHorz) {
      recScroll
        .exit()
        // .transition("inOut").duration(timeD.animArc/4)
        // .attr("transform", "translate(0,0)")
        // .attr("width", (w0 - marg*2))
        // .style("opacity","0.05")
        .transition('inOut')
        .duration(timeD.animArc * 3 / 4)
        .attr('x', x0 + marg)
        .attr('y', y0 + h0)
        .attr('height', 0)
        .remove()
    } else {
      recScroll
        .exit()
        // .transition("inOut").duration(timeD.animArc/4)
        // .attr("transform", "translate(0,0)")
        // .attr("height", (h0 - marg*2))
        // .style("opacity","0.05")
        .transition('inOut')
        .duration(timeD.animArc * 3 / 4)
        .attr('x', x0 + w0)
        .attr('y', y0 + marg)
        .attr('width', 0)
        .remove()
    }

    // update the variable used for initil drag events
    zoomD.drag.frac = recIn.xyFrac
  }

  // ---------------------------------------------------------------------------------------------------
  function zoomScrollBarTrans () {
    // let pos = recIn.xyFrac * wh0 - scrollRec.h * 0.5;
    // pos = Math.max(0, Math.min(wh0- scrollRec.h, pos));
    // // console.log('pos',recIn.xyFrac,pos);

    let pos = recIn.xyFrac * (wh0 - scrollRec.h)
    if (isHorz) return 'translate(' + pos + ',0)'
    else return 'translate(0,' + pos + ')'
  }

  // ---------------------------------------------------------------------------------------------------
  runLoop.init({ tag: mainTag + 'recBckClick', func: _recBckClick, nKeep: 1 })

  function recBckClick (dataIn) {
    runLoop.push({ tag: mainTag + 'recBckClick', data: dataIn })
  }

  function _recBckClick (dataIn) {
    if (!checkFree.isFreeV(checkFreeV.zoomDuring)) {
      setTimeout(function () {
        recBckClick(dataIn)
      }, timeD.animArc / 2)
      return
    }

    if (!hasVar(dataIn)) return
    if (!hasVar(dataIn.coords)) return

    // zoomD.drag.frac = isHorz ? (dataIn.coords[0] - zoomD.xy0)/w0 : (dataIn.coords[1] - zoomD.xy0)/h0;
    zoomD.drag.frac = isHorz
      ? (dataIn.coords[0] - x0) / w0
      : (dataIn.coords[1] - y0) / h0
    zoomD.drag.frac = Math.min(1, Math.max(0, zoomD.drag.frac))

    let trans = xyFracZoom(zoomD.drag.frac)

    $.each(recD[mainTag], function (index, dataNow) {
      dataNow[xy] -= trans
    })

    let duration = hasVar(dataIn.duration) ? dataIn.duration : timeD.animArc

    let outD = {
      trgScale: zoomD.extent[2],
      durFact: 0,
      baseTime: 0,
      transTo: [0, 0],
      wh: [w0, h0],
      cent: null,
      funcStart: function () {
        zoomD.duration = duration
      },
      svg: com.gVor,
      svgZoom: com[tagZoom],
      svgBox: com[tagZoom + 'zoomed'],
      svgZoomNode: com[tagZoom + 'zoomNode']
    }

    doZoomToTarget(outD)
  }

  // ---------------------------------------------------------------------------------------------------
  // access function for getRecV
  // ---------------------------------------------------------------------------------------------------
  function getRecV () {
    return recV
  }
  this.getRecV = getRecV

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function update (optIn) {
    // let recVin = hasVar(optIn.recV) ? optIn.recV : recV;
    let recVin = recV
    if (hasVar(optIn.recV)) {
      recVin = optIn.recV
      recV = recVin
    }
    // optIn.recV = recVin;

    // reverse changes the order in-place, so first make a new copy with slice()
    if (isInvOrder) recVin = recVin.slice().reverse()

    let nRecIn = recVin.length
    let nRows0 = Math.min(nRows, nRecIn)
    let recVinLen = nRows0 <= 1 ? nRecIn : Math.ceil(nRecIn / nRows0 - 0.0001)
    let allRecLen = recVinLen * (recWH + recM) - recM
    hasBotTop = isHorz ? allRecLen > w0 : allRecLen > h0

    let xCent = x0
    let yCent = y0
    if (isHorz) {
      let _h0 = hasBotTop ? h0 - scrollRec.w : h0
      xCent += recE
      yCent += (_h0 - (recH + (nRows0 - 1) * (recH + recM))) / 2
    } else {
      let _w0 = hasBotTop ? w0 - scrollRec.w : w0
      xCent += (_w0 - (recW + (nRows0 - 1) * (recW + recM))) / 2
      yCent += recE
    }

    if (!hasBotTop) {
      if (isHorz) xCent += (w0 - (allRecLen + 2 * recE)) / 2
      else yCent += (h0 - (allRecLen + 2 * recE)) / 2
    }

    let xStep = recW + recM
    let yStep = recH + recM

    let indexShift = 0
    if (isInvOrder && nRecIn > nRows) {
      indexShift = (nRows0 - nRecIn % nRows0) % nRows0
    }
    // let indexShift = (isInvOrder && nRecIn > nRows) ? ((nRows0 - nRecIn % nRows0) % nRows0) : 0;

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    recD[mainTag] = []
    $.each(recVin, function (index, recNow) {
      let indexNow0 = index + indexShift
      let nRowNow0 = indexNow0 % nRows0
      let nColNow0 = Math.floor((indexNow0 - nRowNow0) / nRows0 + 0.00001)

      let nColNow = isHorz ? nColNow0 : nRowNow0
      let nRowNow = isHorz ? nRowNow0 : nColNow0

      let xNow = nColNow * xStep
      let yNow = nRowNow * yStep

      let dataNow = {}
      dataNow.scrollGridId = mainTag
      dataNow.x = xCent + xNow
      dataNow.y = yCent + yNow
      dataNow.w = recW
      dataNow.h = recH
      dataNow.id = recNow.id
      dataNow.data = recNow

      recD[mainTag].push(dataNow)
    })

    // ---------------------------------------------------------------------------------------------------
    // correct for current zoom scrolling - match the position of the first rec in view
    // ---------------------------------------------------------------------------------------------------
    if (hasBotTop) {
      let trans = null
      let recLastI = recD[mainTag].length - 1

      $.each(recD[mainTag], function (index, recNow) {
        // get first element which was already in view
        if (!hasVar(trans)) {
          if (hasVar(recIn.idV[recNow.id])) {
            trans = recIn.idV[recNow.id] - recNow[xy]
          }
        }
        // if inverted order, get the last element which was originally in view
        if (isInvOrder || recIn.isLastIn) {
          if (hasVar(recIn.idV[recNow.id])) {
            trans = recIn.idV[recNow.id] - recNow[xy]
          }
        }
      })

      if (recD[mainTag][0][xy] + trans > zoomD.xy0) {
        if (recD[mainTag][0][xy] < zoomD.xy0) {
          trans = zoomD.xy0 - recD[mainTag][0][xy]
        } else trans = null
      } else if (recD[mainTag][recLastI][xy] + trans < zoomD.xy1) {
        if (recD[mainTag][recLastI][xy] > zoomD.xy1) {
          trans = zoomD.xy1 - recD[mainTag][recLastI][xy]
        } else trans = null
      }

      if (hasVar(trans)) {
        $.each(recD[mainTag], function (index, dataNow) {
          dataNow[xy] += trans
        })
      }
    }

    // // ---------------------------------------------------------------------------------------------------
    // // adjust the transition length for scrolling
    // // ---------------------------------------------------------------------------------------------------
    // let outFrac = 0;
    // if(hasBotTop) {
    //   let xyMin = minMaxObj({
    //     minMax:'min', data:recD[mainTag], func: xy
    //   });
    //   let xyMax = minMaxObj({
    //     minMax:'max', data:recD[mainTag],
    //     func: isHorz ? function(d,i) { return d.x+d.w; } : function(d,i) { return d.y+d.h; }
    //   });
    //   outFrac = (xyMax - xyMin) / ( isHorz?w0:h0 );
    // }
    // zoomD.delta = (isHorz ? 1 : -1) * recWH * 0.1 * outFrac;

    // ---------------------------------------------------------------------------------------------------
    // activate/disable the zoom behaviour after updating hasBotTop
    // ---------------------------------------------------------------------------------------------------
    setZoomStatus()

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function onZoomEnd () {
      setVor()
      updateCounts()
      // // zoomScrollBar();

      if (
        (hasBotTop && !hasVar(scrollBarRec)) ||
        (!hasBotTop && hasVar(scrollBarRec))
      ) {
        zoomScrollBarInit()
      }

      if (hasBotTop) setRecScroll()
    }

    let outD = {
      trgScale: zoomD.extent[2],
      durFact: 0,
      baseTime: 0,
      transTo: [0, 0],
      wh: [w0, h0],
      cent: null,
      funcEnd: onZoomEnd,
      svg: com.gVor,
      svgZoom: com[tagZoom],
      svgBox: com[tagZoom + 'zoomed'],
      svgZoomNode: com[tagZoom + 'zoomNode']
    }

    doZoomToTarget(outD)
  }
  this.update = update

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let defs = com.gBase.append('defs')
  let clipPath = defs.append('clipPath').attr('id', tagClipPath + mainTag)

  com.clipRec = clipPath
    .append('rect')
    .attr('x', x0)
    .attr('y', y0)
    .attr('width', w0)
    .attr('height', h0)

  if (autoClipPath) {
    com.gBckData.attr('clip-path', 'url(#' + tagClipPath + mainTag + ')')
    com.gFrntData.attr('clip-path', 'url(#' + tagClipPath + mainTag + ')')
  }

  let frnt = bckRecOpt.frontProp
  function hasFrnt (prop) {
    return hasVar(frnt) ? hasVar(frnt[prop]) : false
  }

  let bckRecData = [{ id: 'back' }]
  if (hasVar(frnt)) bckRecData.push({ id: 'frnt' })

  com.gBack
    .selectAll('rect.' + tagOuter)
    .data(bckRecData, function (d) {
      return d.id
    })
    .enter()
    .append('rect')
    .attr('class', tagOuter)
    .attr('x', x0)
    .attr('y', y0)
    .attr('width', w0)
    .attr('height', h0)
    .attr('stroke', hasFrnt('strk') ? frnt.strk : '#383B42')
    .attr('stroke-width', hasFrnt('strkW') ? frnt.strkW : '1')
    .attr('stroke-opacity', function (d, i) {
      return i === 0 ? (hasFrnt('strkWOcp') ? frnt.strkWOcp : 1) : 0
    })
    .attr('fill', function (d, i) {
      return i === 0 ? '#F2F2F2' : hasFrnt('fill') ? frnt.fill : '#383B42'
    })
    .attr('fill-opacity', function (d, i) {
      return i === 0 ? 1 : hasFrnt('fillOcp') ? frnt.fillOcp : 0.025
    })
  // .attr("transform", "translate("+(x0)+","+(y0)+")")
  // .style("pointer-events", "none")

  if (hasVar(bckRecOpt.bckPattern)) {
    bckPattern(bckRecOpt.bckPattern)
  } else if (hasVar(bckRecOpt.textureOrient) || hasVar(bckRecOpt.circType)) {
    let bckPatOpt = {
      com: com,
      gNow: com.gBack,
      gTag: gName,
      lenWH: [w0, h0],
      trans: [x0, y0],
      opac: hasVar(bckRecOpt.textureOpac) ? bckRecOpt.textureOpac : 0.06
    }

    $.each(['textureOrient', 'circType', 'size'], function (index, optType) {
      if (hasVar(bckRecOpt[optType])) bckPatOpt[optType] = bckRecOpt[optType]
    })

    bckPattern(bckPatOpt)
  }

  setupZoom()

  // com[tagScrollBar].call(com[tagZoom]).on("dblclick.zoom", null);

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  update({ isInit: true })
}

// ---------------------------------------------------------------------------------------------------
// simple example 2017_11_30
// ---------------------------------------------------------------------------------------------------
function _scrollGridExampleUse (com, svg) {
  com.gBase = svg.g.append('g')
  com.gBckData = com.gBase.append('g')
  com.gVor = com.gBase.append('g')

  let sbD = {}
  let x0 = 120
  let y0 = 120
  let w0 = 400
  let h0 = 100
  let myId = 'myScrollBox'
  let tagClipPath = 'myScrollBoxPath'

  let scrollGridOpt = {
    // unique id for a given box
    id: myId,
    // the group elements (vor in front of data)
    g: { gBckData: com.gBckData, gVor: com.gVor },
    // the id of the clip-path element corresponding to the geometry of the box
    tagClipPath: tagClipPath,
    // if to aplly automatic clip-path to the entire data-g
    autoClipPath: true,
    // dictionary which will be filled with the results
    recD: sbD,
    // list of data (can be updated later)
    recV: [],
    // dimensions of the box
    x0: x0,
    y0: y0,
    w0: w0,
    h0: h0,
    // dimentions of data elements inside the box
    recH: h0 * 0.5,
    recW: h0 * 0.5,
    // boolean to show the number of overflow data elements
    showCounts: false,
    // horizonthal/vertical geometry of the box
    isHorz: true,
    // properties of the background
    bckRecOpt: { textureOrient: '5/8', frontProp: { strkWOcp: 0.2 } },
    // options for the voronoii grid
    vorOpt: { click: onVorClick },
    // options for the zooming/scrolling
    onZoom: { during: onZoomDuring, end: onZoomDuring },
    // the global let of the queue loop
    runLoop: runLoop,
    // the global let for the locking variable
    checkFree: checkFree
  }

  com.scrollGrid = new window.ScrollGrid(scrollGridOpt)

  let recVnow = [
    { id: 'data0', data: { name: 'xxx', number: 10 } },
    { id: 'data1', data: { name: 'yyy', number: 9 } },
    { id: 'data2', data: { name: 'zzz', number: 98 } },
    { id: 'data3', data: { name: 'eee', number: 1 } },
    { id: 'data4', data: { name: 'yyy', number: 83 } },
    { id: 'data5', data: { name: 'dgd', number: 14 } },
    { id: 'data6', data: { name: '344', number: 18 } },
    { id: 'data7', data: { name: 'opi', number: 44 } }
  ]
  com.scrollGrid.update({ recV: recVnow })

  // console.log(sbD[myId]);
  let rect = com.gBckData
    .selectAll('rect.' + 'myScrollBoxRecs')
    .data(sbD[myId], function (d) {
      return d.id
    })

  rect
    .enter()
    .append('rect')
    .attr('class', 'myScrollBoxRecs')
    .attr('stroke-width', '0.5')
    .style('stroke-opacity', '0.9')
    .style('fill-opacity', 0.2)
    .style('stroke', function (d, i) {
      return d3.rgb(colsMix[i % colsMix.length]).darker(0.5)
    })
    .style('fill', function (d, i) {
      return colsMix[i % colsMix.length]
    })
    .style('opacity', 0)
    .attr('x', function (d) {
      return d.x
    })
    .attr('y', function (d) {
      return d.y
    })
    .attr('width', function (d) {
      return d.w
    })
    .attr('height', function (d) {
      return d.h
    })
    // .attr("clip-path", function(d){ return "url(#"+tagClipPath+d.scrollGridId+")"; })
    .transition('newEle')
    .duration(timeD.animArc)
    .style('opacity', 1)

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function onZoomDuring (optIn) {
    let xy = optIn.xy
    let rect = com.gBckData.selectAll('rect.' + 'myScrollBoxRecs')
    rect.attr(xy, function (d, i) {
      return d[xy]
    })
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function onVorClick (optIn) {
    let dataNow = optIn.data.data
    console.log('------------ click my name is :', dataNow.data.name)
  }
}
