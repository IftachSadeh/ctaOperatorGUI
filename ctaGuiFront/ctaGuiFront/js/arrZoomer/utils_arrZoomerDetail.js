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
window.ArrZoomerDetail = function (optIn0) {
  let thisTop = this
  let runLoop = optIn0.runLoop
  let sgvTag = optIn0.sgvTag
  let widgetId = optIn0.widgetId
  let locker = optIn0.locker
  let isSouth = optIn0.isSouth
  let myUniqueId = unique()
  let parentUniqueId = optIn0.myUniqueId

  let svgBase = optIn0.svgBase
  svgBase.elements.detail = thisTop

  let instruments = svgBase.instruments
  let zoomD = svgBase.zoomD

  let rScale = instruments.rScale
  let aspectRatio = optIn0.aspectRatio
  let getPropPosShift = svgBase.getPropPosShift
  let interpolate01 = svgBase.interpolate01
  let setZoomState = svgBase.setZoomState
  let propsS1 = svgBase.propsS1

  thisTop.hasInit = false

  function getSvgMain() {
    return svgBase.elements.main
  }

  let lenD = {}
  lenD.w = {}
  lenD.h = {}

  lenD.w[0] = 500
  lenD.h[0] = lenD.w[0] * aspectRatio

  // let svg = {}
  let gDetailD = svgBase.svgD.detail
  gDetailD.g = svgBase.svgD.gSvg.append('g')
  gDetailD.gOuter = gDetailD.g.append('g')


  let uniqueClipId = 'clip' + myUniqueId
  
  gDetailD.gOuter.append('defs')
    .append('clipPath')
    .attr('id', uniqueClipId)
    .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width',lenD.w[0])
      .attr('height',lenD.h[0])

  gDetailD.gClipped = gDetailD.gOuter.append('g')
  gDetailD.gClipped.attr('class', 'gClipped')
    .attr('clip-path', 'url(#'+uniqueClipId+')');

  gDetailD.gBase = gDetailD.gClipped.append('g')
  gDetailD.gS0 = gDetailD.gBase.append('g')
  gDetailD.gS1 = gDetailD.gBase.append('g')

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
  thisTop.setTransform = function (trans) {
    if (hasVar(trans)) gDetailD.g.attr('transform', trans)
    return gDetailD.g
  }

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
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
      let propW = lenD.w[0] / instruments.allProps0.length
      let propR = Math.min(propW * 0.4, lenD.w[0] / 15)
      let propY = propR * 1.25

      avgTelD.push({ r: propR, h: propY * 2 })
      $.each(instruments.allProps0, function (index, porpNow) {
        avgTelD[1][porpNow + 'x'] = propW * (0.5 + index)
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
    if(thisTop.hasInit) return
    thisTop.hasInit = true


    // ------------------------------------------------------------------
    // add one rectangle as background, and to allow click to zoom
    // ------------------------------------------------------------------
    gDetailD.gS0
      // .append('g')
      // .selectAll('rect')
      // .data([0])
      // .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', lenD.w[0])
      .attr('height', lenD.h[0])
      .attr('stroke-width', '0')
      .attr('fill', '#F2F2F2') 
      // .attr("fill", "red")
      .style("stroke",'#383B42' )
      // .style("stroke",'#F2F2F2' )
      // .style("stroke",'#2196F3' )
      .style("stroke-width", 1)
      .on('click', function () {
        let scale = getSvgMain().getScale()
        if (scale >= zoomD.len['0.1'] && scale < zoomD.len['1.0']) {

          // console.log('FIXME - detail-0 - uncomment zoomToTrgMain')
          getSvgMain().zoomToTrgMain({
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
    let scale = getSvgMain().getScale()

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
        avgTelD[1][instruments.allProps[0] + 'x'] - 
        avgTelD[1][instruments.allProps[1] + 'x']
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
      getSvgMain().zoomToTrgMain({
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
      // thisTop.zoomToPos({ target:null, scale:1, durFact:1 });
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

    let hasDataBase = (
      !clickIn && 
      !remove && 
      hasVar(instruments.data.dataBaseS1[telId])
    )

    // ------------------------------------------------------------------
    // the tree hierarchy
    // ------------------------------------------------------------------
    let desc = []
    let dataPath = []
    let maxDepth = 0
    if (clickIn || hasDataBase) {
      // initialize the zoom upon any change of the hirch
      thisTop.zoomToPos({
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

      getSvgMain().bckArcClick({
        clickIn: clickIn,
        propIn: parentName,
        onlyOpen: true
      })

      getSvgMain().hirchStyleClick({
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
    let parentName = (
      propIn === '' ? null : instruments.data.propParentS1[telId][propIn]
    )

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

    let dataV = getSvgMain().getScale() >= zoomD.len['1.0'] ? [{ id: porpX }] : []
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