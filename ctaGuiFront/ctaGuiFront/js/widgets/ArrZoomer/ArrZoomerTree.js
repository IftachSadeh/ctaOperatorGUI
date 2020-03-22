// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
/* global $ */
/* global d3 */
/* global sock */
/* global times */
/* global is_def */
/* global inst_health_col */
/* global bck_pattern */
/* global tel_info */
/* global vor_ploy_func */


// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerTree = function (opt_in0) {
  let this_top = this
  let run_loop = opt_in0.run_loop
  let sgv_tag = opt_in0.sgv_tag
  let widget_id = opt_in0.widget_id
  let locker = opt_in0.locker
  let is_south = opt_in0.is_south
  let my_unique_id = unique()
  let parentUniqueId = opt_in0.my_unique_id

  let eleBase = opt_in0.eleBase

  let instruments = eleBase.instruments
  let zoomD = eleBase.zoomD
  let lock_init_key = eleBase.lock_init_keys.tree

  let rScale = instruments.rScale
  let aspectRatio = is_def(opt_in0.aspectRatio) ? opt_in0.aspectRatio : 1
  let getPropPosShift = eleBase.getPropPosShift
  let interpolate01 = eleBase.interpolate01
  let setZoomState = eleBase.setZoomState
  let propsS1 = eleBase.propsS1

  this_top.hasInit = false

  eleBase.set_ele(this_top, 'tree')
  let get_ele = eleBase.get_ele

  let lenBase = 500
  let lenD = {
    w: [lenBase], h: [lenBase * aspectRatio],
  }
  let avgTelD = []
  $.each([0, 1], function (nState_, nState) {
    if (nState === 0) {
      avgTelD.push({ 
        r: lenD.w[0] / 4, x: lenD.w[0] / 2, y: lenD.h[0] / 2,
      })
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


  // let svg = {}
  let gTreeD = eleBase.svgD.tree
  gTreeD.g = eleBase.svgD.g_svg.append('g')
  gTreeD.g_outer = gTreeD.g.append('g')


  let uniqueClipId = 'clip' + my_unique_id
  
  gTreeD.g_outer.append('defs')
    .append('clipPath')
    .attr('id', uniqueClipId)
    .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', lenD.w[0])
      .attr('height', lenD.h[0])

  gTreeD.gClipped = gTreeD.g_outer.append('g')
  gTreeD.gClipped.attr('class', 'gClipped')
    .attr('clip-path', 'url(#'+uniqueClipId+')');

  gTreeD.gBase = gTreeD.gClipped.append('g')
  gTreeD.gS0 = gTreeD.gBase.append('g')
  gTreeD.gS1 = gTreeD.gBase.append('g')

  // ------------------------------------------------------------------
  // scale to 100x100 px
  // ------------------------------------------------------------------
  gTreeD.g_outer.attr('transform', function (d) {
    return 'translate(0,0)scale('+ (100 / lenD.w[0]) +')'
  })

  // ------------------------------------------------------------------
  // to avoid bugs, this is the g which should be used
  // for translations and sacling of this element
  // ------------------------------------------------------------------
  this_top.setTransform = function (trans) {
    if (is_def(trans)) gTreeD.g.attr('transform', trans)
    return gTreeD.g
  }

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let com = {}
  let arcFunc = {}
  let arc_prev = {}
  arc_prev.ang = {}
  arc_prev.rad = {}

  let zoom_targetProp = ''

  // initialize a global function (to be overriden below)
  let zoomToPos = function (opt_in) {
    if (!locker.is_free('inInit')) {
      setTimeout(function () {
        zoomToPos(opt_in)
      }, times.wait_loop)
    }
  }
  this.zoomToPos = zoomToPos

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function init_data (data_in) {
    if(this_top.hasInit) return
    this_top.hasInit = true


    // ------------------------------------------------------------------
    // add one rectangle as background, and to allow click to zoom
    // ------------------------------------------------------------------
    gTreeD.gS0
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
        let scale = get_ele('main').getScale()
        if (scale >= zoomD.len['0.1'] && scale < zoomD.len['1.0']) {

          // console.log('FIXME - tree-0 - uncomment zoomToTrgMain')
          get_ele('main').zoomToTrgMain({
            target: zoomD.target,
            scale: zoomD.len['1.2'],
            duration_scale: 1
          })
        }
      })

    // the background grid
    bck_pattern({
      com: com,
      g_now: gTreeD.gS0,
      g_tag: 'gS0',
      len_wh: [lenD.w[0], lenD.h[0]],
      opac: 0.05,
      texture_orient: '2/8'
    })

    let s1Trans =
      'translate(' +
      0.05 * lenD.w[1] +
      ',' +
      0.2 * lenD.h[1] +
      ')scale(' +
      0.9 +
      ')'
    gTreeD.gS1.attr('transform', s1Trans)

    // ------------------------------------------------------------------
    // some initialization
    // ------------------------------------------------------------------
    // see: http://bl.ocks.org/mbostock/5100636
    com.arcTween = function (transition, opt_in) {
      // if(opt_in.skip != undefined && opt_in.skip) return null;
      transition.attrTween('d', function (d, i) {
        let id = d.id
        if (is_def(opt_in.index_id)) id = opt_in.index_id ? d.id : i

        if (is_def(opt_in.incIdV)) {
          if (opt_in.incIdV.indexOf(id) === -1) return null
        }
        if (is_def(opt_in.excIdV)) {
          if (opt_in.excIdV.indexOf(id) >= 0) return null
        }

        let tag_now = opt_in.tag_now
        let ang_str_0 = opt_in.ang_str_0
          ? arcFunc[tag_now][opt_in.ang_str_0](d)
          : opt_in.arc_prev[tag_now].ang[id][0]
        let ang_str_1 = opt_in.ang_str_1
          ? arcFunc[tag_now][opt_in.ang_str_1](d)
          : opt_in.arc_prev[tag_now].ang[id][0]
        let ang_end_0 = opt_in.ang_end_0
          ? arcFunc[tag_now][opt_in.ang_end_0](d)
          : opt_in.arc_prev[tag_now].ang[id][1]
        let ang_end_1 = opt_in.ang_end_1
          ? arcFunc[tag_now][opt_in.ang_end_1](d)
          : opt_in.arc_prev[tag_now].ang[id][1]
        let r_in_0 = opt_in.r_in_0
          ? arcFunc[tag_now][opt_in.r_in_0](d)
          : opt_in.arc_prev[tag_now].rad[id][0]
        let r_in_1 = opt_in.r_in_1
          ? arcFunc[tag_now][opt_in.r_in_1](d)
          : opt_in.arc_prev[tag_now].rad[id][0]
        let r_out_0 = opt_in.r_out_0
          ? arcFunc[tag_now][opt_in.r_out_0](d)
          : opt_in.arc_prev[tag_now].rad[id][1]
        let r_out_1 = opt_in.r_out_1
          ? arcFunc[tag_now][opt_in.r_out_1](d)
          : opt_in.arc_prev[tag_now].rad[id][1]
        // console.log(tag_now,[ang_str_0,ang_str_1],[ang_end_0,ang_end_1],[r_in_0,r_in_1],[r_out_0,r_out_1])

        let needUpd = 0
        if (Math.abs(ang_str_0 - ang_str_1) / ang_str_0 > 1e-5) needUpd++
        if (Math.abs(ang_end_0 - ang_end_1) / ang_end_0 > 1e-5) needUpd++
        if (Math.abs(r_in_0 - r_in_1) / r_in_0 > 1e-5) needUpd++
        if (Math.abs(r_out_0 - r_out_1) / r_out_0 > 1e-5) needUpd++
        if (needUpd === 0) return null

        let arc = d3.arc()
        return function (t) {
          let intrNow = interpolate01(t)
          d.startAngle = ang_str_0 + (ang_str_1 - ang_str_0) * intrNow
          d.endAngle = ang_end_0 + (ang_end_1 - ang_end_0) * intrNow
          d.innerRadius = r_in_0 + (r_in_1 - r_in_0) * intrNow
          d.outerRadius = r_out_0 + (r_out_1 - r_out_0) * intrNow

          opt_in.arc_prev[tag_now].ang[id][0] = d.startAngle
          opt_in.arc_prev[tag_now].ang[id][1] = d.endAngle
          opt_in.arc_prev[tag_now].rad[id][0] = d.innerRadius
          opt_in.arc_prev[tag_now].rad[id][1] = d.outerRadius

          return arc(d)
        }
      })
    }

    // state-01 initialization (needed before s01inner(), s01outer())
    com.s01 = {}
    com.s01.g = gTreeD.gS0.append('g')
    com.s01.gText = gTreeD.gS0.append('g')

    // state-1 initialization (needed before updateLiveDataS1())
    com.s10 = {}
    com.s10.g = gTreeD.gS1.append('g')

    locker.remove(lock_init_key)
    return
  }
  this.init_data = init_data

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setStateOnce () {
    // console.log('setStateTree ----',getScale(),opt_in)
    let scale = get_ele('main').getScale()

    if (scale < zoomD.len['1.0']) {
      telHirch({ tel_Id: '', clickIn: false, remove: true })
    }

    if (scale <= zoomD.len['0.1']) {
      let propsIn = {
        tel_Id: 'avg',
        propD: instruments.props[''],
        propDv: instruments.props0[''],
        propTtlD: instruments.propTitles['']
      }

      telArcs([instruments.data.avg], propsIn, 0)
      setSubProp({ tel_Id: 'avg', propIn: '' })
    } else {
      let targetIndex = instruments.data.idToIndex[zoomD.target]
      let propsIn = {
        tel_Id: zoomD.target,
        propD: instruments.props[zoomD.target],
        propDv: instruments.props0[zoomD.target],
        propTtlD: instruments.propTitles['']
      }

      if (scale < zoomD.len['1.0']) {
        telArcs([instruments.data.tel[targetIndex]], propsIn, 0)
        setSubProp({ tel_Id: zoomD.target, propIn: '' })
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
    let tel_id_in = propsIn.tel_Id
    let propDin = propsIn.propD
    let propDinV = propsIn.propDv
    let propTtlIn = propsIn.propTtlD

    function getPropIndex (id, porpIn) {
      return instruments.props[id].indexOf(porpIn)
    }

    if (!is_def(com.s01.inner)) {
      com.s01.inner = true

      $.each(instruments.allProps, function (_, porpNow) {
        $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
          let tag_now = porpNow + nArcDrawNow
          let is0 = nArcDrawNow === 0
          // console.log('--0--',tag_now)

          arcFunc[tag_now] = {}
          arcFunc[tag_now].rad00 = function (d) {
            return avgTelD[d.state].r * (is0 ? 0.1 : 0.1)
          }
          arcFunc[tag_now].rad01 = function (d) {
            return avgTelD[d.state].r * (is0 ? 0.95 : 0.99)
          }
          arcFunc[tag_now].ang00 = function (d) {
            if (d[porpNow] === undefined) return 0
            return getPropIndex(d.id, porpNow) * instruments.tauFracs[d.id] + instruments.tauSpace
          }
          arcFunc[tag_now].ang01 = function (d) {
            if (d[porpNow] === undefined) return 0
            return (
              getPropIndex(d.id, porpNow) * instruments.tauFracs[d.id] +
              instruments.tauSpace +
              (instruments.tauFracs[d.id] - instruments.tauSpace * 2) *
                (is0 ? 1 : inst_health_frac(d[porpNow]))
            )
          }
          arcFunc[tag_now].ang10 = function (d) {
            if (d[porpNow] === undefined) return 0
            return 0.1
          }
          arcFunc[tag_now].ang11 = function (d) {
            if (d[porpNow] === undefined) return 0
            return is0 ? tau : tau * inst_health_frac(d[porpNow])
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
        angState = { ang_str_1: 'ang00', ang_end_1: 'ang01' }
        radState = { r_in_1: 'rad00', r_out_1: 'rad01' }
      } else {
        pos[porpNow] = {
          x: avgTelD[state][porpNow + 'x'],
          y: avgTelD[state][porpNow + 'y']
        }
        angState = { ang_str_1: 'ang10', ang_end_1: 'ang11' }
        radState = { r_in_1: 'rad10', r_out_1: 'rad11' }
      }
    })

    $.each(instruments.allProps, function (_, porpNow) {
      $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
        let tag_now = porpNow + nArcDrawNow

        let is0 = nArcDrawNow === 0

        if (!is_def(arc_prev[tag_now])) {
          arc_prev[tag_now] = {}
          arc_prev[tag_now].ang = {}
          arc_prev[tag_now].rad = {}
        }

        let dataVnow = dataV
        if (dataV.length > 0) {
          if (dataV[0][porpNow] === undefined) {
            dataVnow = []
          }
        }

        let path = com.s01.g
          .selectAll('path.' + tag_now)
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
          // .attr("id",        function(d) { return my_unique_id+d.id+tag_now; })
          .attr('class', tagState + ' ' + tag_now)
          // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
          .style('opacity', function (d) {
            return is0 ? '0.5' : '1'
          })
          .attr('transform', function (d) {
            return 'translate(' + pos[porpNow].x + ',' + pos[porpNow].y + ')'
          })
          .style('stroke', function (d) {
            return is0 ? null : inst_health_col(d[porpNow])
          })
          .style('fill', function (d) {
            return inst_health_col(d[porpNow])
          })
          .each(function (d, i) {
            d.state = state
            arc_prev[tag_now].ang[i] = [
              arcFunc[tag_now].ang00(d),
              arcFunc[tag_now].ang00(d)
            ]
            arc_prev[tag_now].rad[i] = [
              arcFunc[tag_now].rad00(d),
              arcFunc[tag_now].rad01(d)
            ]
          })
          .merge(path)
          .each(function (d, i) {
            d.state = state
          })
          .transition('update')
          .duration(times.anim_arc * 2)
          .attr('transform', function (d, i) {
            return 'translate(' + pos[porpNow].x + ',' + pos[porpNow].y + ')'
          })
          .style('stroke', function (d) {
            return is0 ? null : inst_health_col(d[porpNow])
          })
          .style('fill', function (d) {
            return inst_health_col(d[porpNow])
          })
          // .each(function (d, i) {
          //   // console.log('MNM', i, tag_now, '!!!',arc_prev[tag_now].ang[0], '!!!', d)
          // })
          // .each(function (d, i) {
          //   d.tauFracNow = tauFracIn
          // })
          .call(com.arcTween, {
            tag_now: tag_now,
            arc_prev: arc_prev,
            index_id: false,
            ang_str_0: null,
            ang_str_1: angState.ang_str_1,
            ang_end_0: null,
            ang_end_1: angState.ang_end_1,
            r_in_0: null,
            r_in_1: 'rad00',
            r_out_0: null,
            r_out_1: 'rad01'
          })

        // operate on exiting elements only
        path
          .exit()
          .transition('out')
          .duration(times.anim_arc)
          .call(com.arcTween, {
            tag_now: tag_now,
            arc_prev: arc_prev,
            index_id: false,
            ang_str_0: null,
            ang_str_1: 'ang00',
            ang_end_0: null,
            ang_end_1: 'ang00',
            r_in_0: null,
            r_in_1: 'rad00',
            r_out_0: null,
            r_out_1: 'rad01'
          })
          .remove()
      })
    })

    // ------------------------------------------------------------------
    // outer rings for the instruments.prop0 (equivalent of s00_D metric in s01_D)
    // ------------------------------------------------------------------
    let porpAll = instruments.prop0

    if (!is_def(com.s01.outer)) {
      com.s01.outer = true

      $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
        let tag_now = porpAll + nArcDrawNow
        let is0 = nArcDrawNow === 0

        arcFunc[tag_now] = {}
        arcFunc[tag_now].rad00 = function (d) {
          return avgTelD[d.state].r * rScale[0].health0 * (is0 ? 1 : 0.95)
        }
        arcFunc[tag_now].rad01 = function (d) {
          return avgTelD[d.state].r * rScale[0].health1 * (is0 ? 1 : 1.05)
        }
        arcFunc[tag_now].rad10 = function (d) {
          return avgTelD[d.state].r * rScale[1].health0 * (is0 ? 0.475 : 0.4)
        }
        arcFunc[tag_now].rad11 = function (d) {
          return avgTelD[d.state].r * rScale[1].health1 * (is0 ? 0.525 : 0.6)
        }
        arcFunc[tag_now].ang00 = function (d) {
          return 0
        }
        arcFunc[tag_now].ang01 = function (d) {
          return is0 ? tau : tau * inst_health_frac(d[instruments.prop0])
        }
      })
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
      let tag_now = porpAll + nArcDrawNow
      let is0 = nArcDrawNow === 0

      if (!is_def(arc_prev[tag_now])) {
        arc_prev[tag_now] = {}
        arc_prev[tag_now].ang = {}
        arc_prev[tag_now].rad = {}
      }

      let path = com.s01.g
        .selectAll('path.' + tag_now)
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
        // .attr("id",        function(d) { return my_unique_id+d.id+tag_now; })
        .attr('class', tagState + ' ' + tag_now)
        // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
        .style('opacity', function (d) {
          return is0 ? '0.5' : '1'
        })
        .attr('transform', function (d) {
          return 'translate(' + pos[porpAll].x + ',' + pos[porpAll].y + ')'
        })
        .style('stroke', function (d) {
          return is0 ? null : inst_health_col(d[porpAll])
        })
        .style('fill', function (d) {
          return inst_health_col(d[porpAll])
        })
        .each(function (d, i) {
          d.state = state
          arc_prev[tag_now].ang[i] = [
            arcFunc[tag_now].ang00(d),
            arcFunc[tag_now].ang00(d)
          ]
          arc_prev[tag_now].rad[i] = [
            arcFunc[tag_now].rad00(d),
            arcFunc[tag_now].rad01(d)
          ]
        })
        .merge(path)
        .each(function (d, i) {
          d.state = state
        })
        .transition('update')
        .duration(times.anim_arc * 2) // .delay(times.anim_arc)
        .attr('transform', function (d) {
          return 'translate(' + pos[porpAll].x + ',' + pos[porpAll].y + ')'
        })
        .style('stroke', function (d) {
          return is0 ? null : inst_health_col(d[porpAll])
        })
        .style('fill', function (d) {
          return inst_health_col(d[porpAll])
        })
        .call(com.arcTween, {
          tag_now: tag_now,
          arc_prev: arc_prev,
          index_id: false,
          ang_str_0: null,
          ang_str_1: null,
          ang_end_0: null,
          ang_end_1: 'ang01',
          r_in_0: null,
          r_in_1: radState.r_in_1,
          r_out_0: null,
          r_out_1: radState.r_out_1
        })

      // operate on exiting elements only
      path
        .exit()
        .transition('out')
        .duration(times.anim_arc)
        .call(com.arcTween, {
          tag_now: tag_now,
          arc_prev: arc_prev,
          index_id: false,
          ang_str_0: null,
          ang_str_1: 'ang00',
          ang_end_0: null,
          ang_end_1: 'ang00',
          r_in_0: null,
          r_in_1: 'rad00',
          r_out_0: null,
          r_out_1: 'rad01'
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
      let propIndex = getPropIndex(tel_id_in, porpNow)
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
      // .attr("id", function(d) { return my_unique_id+d.id; })
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
      .duration(times.anim_arc * 2)
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
        if (!is_def(eleH)) {
          eleH = get_node_height_by_id({
            selction: com.s01.gText.selectAll('text.' + tagTitle),
            id: d.id,
            txt_scale: true
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
      .duration(times.anim_arc)
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
      .duration(times.anim_arc)
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
        !locker.are_free(['s10bckArcChange', 'dataChange', 's10clickHirch'])
      ) {
        return
      }

      let clickIn = d.prop !== instruments.prop0
      let propIn = clickIn ? d.prop : ''
      if (propDin.indexOf(d.prop) === -1) {
        clickIn = true
        propIn = ''
      }

      // propsS1({ tel_Id:zoomD.target, clickIn:clickIn, propIn:propIn, debug:"telArcs" }); // before 29/9

      // console.log('FIXME - tree-1 - uncomment zoomToTrgMain')
      get_ele('main').zoomToTrgMain({
        target: zoomD.target,
        scale: zoomD.len['1.2'],
        duration_scale: 1
      })

      propsS1({
        tel_Id: zoomD.target,
        clickIn: clickIn,
        propIn: propIn,
        doFunc: ['bckArcClick'],
        debug: 'telArcs'
      })

      // // initialize the zoom
      // this_top.zoomToPos({ target:null, scale:1, duration_scale:1 });
    }
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  let prevTelHirchProp = ''
  function telHirch (opt_in) {
    function mayUpdate () {
      return locker.is_free([
        'updateTelHirchTree',
        'dataChange',
        's10bckArcChange',
        's10clickHirch',
        'updateTelHirch',
        'zoom',
        'autoZoomTarget',
        'zoom_to_target_mini',
        'zoom_to_target_ches'
      ])
    }
    if (!mayUpdate()) {
      setTimeout(function () {
        telHirch(opt_in)
      }, times.anim_arc / 3)
      return
    }
    // if(!is_def(opt_in)) return;
    // console.log('telHirch',opt_in);

    let tagState = 'state10'
    let tagNodes = tagState + 'circ'
    let tagText = tagState + '_text'
    let tagVor = tagState + '_vor'
    let tagLinks = tagState + '_path'

    let nodeR = 15
    let diffW = lenD.w[1] * 0.1
    let treeW = lenD.w[1] - diffW
    let treeH = lenD.h[1]

    function get_ele_id (d) {
      return d.data.id
    }

    let tel_Id = ''
    let clickIn = false
    let propIn = ''
    let remove = false
    if (is_def(opt_in)) {
      if (is_def(opt_in.tel_Id)) tel_Id = opt_in.tel_Id
      if (is_def(opt_in.clickIn)) clickIn = opt_in.clickIn
      if (is_def(opt_in.remove)) remove = opt_in.remove
      if (is_def(opt_in.propIn)) propIn = opt_in.propIn
    } else {
      // if(!is_def(opt_in) || is_update)
      propIn = prevTelHirchProp
      clickIn = propIn !== ''
    }

    if (zoomD.target !== tel_Id || !is_def(instruments.data.propDataS1[tel_Id])) {
      clickIn = false
      remove = true
    } else if (propIn === '') {
      clickIn = false
    }

    // ------------------------------------------------------------------
    // update the title
    // ------------------------------------------------------------------
    setSubProp({ tel_Id: tel_Id, propIn: clickIn ? propIn : '' })

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    if (!remove && propIn !== '') {
      if (!is_def(instruments.data.propDataS1[tel_Id][propIn])) {
        return
      }
    }

    locker.add({ id: 'updateTelHirchTree', override: true })

    // ------------------------------------------------------------------
    // define the containing g with small margins on the sides
    // ------------------------------------------------------------------
    if (!is_def(com.s10.gHirch)) {
      com.s10.gHirch = com.s10.g.append('g')
      com.s10.gHirch.attr('transform', function (d) {
        return 'translate(' + diffW / 2 + ',' + 0 + ')'
      })
      // com.s10.gHirch.append("rect").style('opacity',0.3).style("fill",'transparent').attr("height", treeH).attr("width", treeW).style("stroke","red")
    }

    let hasDataBase = (
      !clickIn && 
      !remove && 
      is_def(instruments.data.dataBaseS1[tel_Id])
    )

    // ------------------------------------------------------------------
    // the tree hierarchy
    // ------------------------------------------------------------------
    let desc = []
    let dataPath = []
    let max_depth = 0
    if (clickIn || hasDataBase) {
      // initialize the zoom upon any change of the hirch
      this_top.zoomToPos({
        target: null,
        scale: zoomD.len['0.0'],
        duration_scale: 1
      })

      let dataHirch = clickIn
        ? instruments.data.propDataS1[tel_Id][propIn]
        : instruments.data.dataBaseS1[tel_Id]
      let hirch = d3.hierarchy(dataHirch)

      // if(!clickIn) console.log('----===--',instruments.data.dataBaseS1[tel_Id])
      // console.log('--==--',tel_Id,propIn,is_def(instruments.data.propDataS1[tel_Id][propIn]),clickIn,dataHirch)

      let tree = d3.tree().size([treeH, treeW])
      tree(hirch)

      desc = hirch.descendants()
      dataPath = desc.slice(1)

      $.each(desc, function (index, data_now) {
        max_depth = Math.max(max_depth, data_now.depth)
      })

      let xV = []
      $.each(desc, function (index, data_now) {
        if (max_depth === data_now.depth) {
          xV.push(Number(data_now.x))
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
      .data(desc, get_ele_id) // d.data.id

    circs
      .enter()
      .append('circle')
      .attr('class', tagNodes)
      // .attr("id", function(d) { return my_unique_id+tagNodes+d.data.id; })
      .attr('r', 0)
      .attr('transform', function (d) {
        return 'translate(' + d.y + ',' + d.x + ')'
      })
      .style('stroke', function (d) {
        return inst_health_col(d.data.val, 0.5)
      })
      .style('fill', function (d) {
        return inst_health_col(d.data.val)
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
      .duration(times.anim_arc)
      .attr('transform', function (d) {
        return 'translate(' + d.y + ',' + d.x + ')'
      })
      .attr('r', function (d) {
        return d.nodeR
      })
      .style('stroke', function (d) {
        return inst_health_col(d.data.val)
      })
      .style('fill', function (d) {
        return inst_health_col(d.data.val)
      })
    // .each(function(d,i){ console.log(i,d.data); })

    circs
      .exit()
      .transition('out')
      .duration(times.anim_arc / 2)
      .attr('r', 0)
      .remove()

    // ------------------------------------------------------------------
    // labels
    // ------------------------------------------------------------------
    let text = com.s10.gHirch
      .selectAll('text.' + tagText)
      .data(desc, get_ele_id)

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
      .duration(times.anim_arc)
      .attr('opacity', 1)
      .attr('transform', txtTrans)
      .style('text-anchor', txtAnch)
      // .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(getTxt)

    text
      .exit()
      .transition('out')
      .duration(times.anim_arc / 2)
      .attr('opacity', 0)
      .remove()

    function txtTrans (d, i) {
      let d0 = d.nodeR + Math.min(10, d.nodeR)
      let d1 = get_node_height_by_id({
        selction: com.s10.gHirch.selectAll('text.' + tagText),
        id: get_ele_id(d),
        get_id: get_ele_id,
        txt_scale: true
      })

      return 'translate(' + (d.y - d0) + ',' + (d.x + d1) + ')'
    }
    function txtAnch (d) {
      return 'end'
      // if     (!d.parent)           return "start";
      // else if(max_depth == d.depth) return "end";
      // else                         return "middle";
    }
    function getTxt (d) {
      return !d.parent || d.data.id === propIn ? '' : d.data.title
    }

    // ------------------------------------------------------------------
    // links
    // ------------------------------------------------------------------
    let path = com.s10.gHirch
      .selectAll('path.' + tagLinks)
      .data(dataPath, get_ele_id)

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
      .duration(times.anim_arc)
      .attr('d', linkFunc)

    path
      .exit()
      .transition('out')
      .duration(times.anim_arc / 2)
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
        focus_ele(d, true)
      })
      .on('mouseout', function (d) {
        focus_ele(d, false)
      })
      .on('click', vorClick)
      .merge(vor)
      .call(function (d) {
        d.attr('d', vor_ploy_func)
      })

    vor
      .exit()
      .transition('out')
      .duration(times.anim_arc / 2)
      .attr('opacity', 0)
      .remove()

    // the click function
    // ------------------------------------------------------------------
    function vorClick (d) {
      setSubProp({ tel_Id: tel_Id, propIn: d.data.data.id })

      let clickIn = true
      let dId = d.data.data.id
      let id_now = is_def(d.data.parent) ? d.data.parent.data.id : dId

      let parentName = instruments.data.propParentS1[tel_Id][dId]
      if (parentName === dId) {
        id_now = parentName
      }

      // console.log('===',[parentName,dId,propIn,id_now],clickIn);
      if (!is_def(parentName)) {
        parentName = ''
        clickIn = false
      }
      // console.log('---',[parentName,dId,propIn,id_now],clickIn); console.log('-------------------------------------');

      setZoomState()

      get_ele('main').bckArcClick({
        clickIn: clickIn,
        propIn: parentName,
        onlyOpen: true
      })

      get_ele('main').hirchStyleClick({
        propIn: parentName,
        id: id_now,
        isOpen: true,
        syncProp: dId
      })
    }

    // the highlight function
    // ------------------------------------------------------------------
    function focus_ele (dIn, isOn) {
      let dInId = dIn.data.data.id

      if (isOn) {
        if (!mayUpdate()) return

        com.s10.gHirch
          .selectAll('circle.' + tagNodes)
          .transition('highlight')
          .duration(times.anim_arc / 2)
          .attr('r', function (d) {
            return d.data.id === dInId ? d.nodeR * 1.5 : d.nodeR
          })
          .style('fill-opacity', function (d) {
            return d.data.id === dInId ? 0.6 : 1
          })

        com.s10.gHirch
          .selectAll('text.' + tagText)
          .transition('highlight')
          .duration(times.anim_arc / 2)
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
            reset_r()
          }, 20)
          return
        }

        reset_r()
      }

      function reset_r () {
        com.s10.gHirch
          .selectAll('circle.' + tagNodes)
          .transition('highlight')
          .duration(times.anim_arc / 2)
          .attr('r', function (d) {
            return d.nodeR
          })
          .style('fill-opacity', 1)

        com.s10.gHirch
          .selectAll('text.' + tagText)
          .transition('highlight')
          .duration(times.anim_arc / 2)
          .style('font-size', function (d) {
            return fontSize(d) + 'px'
          })
          .style('font-weight', 'normal')
      }
    }

    locker.remove({ id: 'updateTelHirchTree', delay: times.anim_arc })
  }
  this.telHirch = telHirch

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setSubProp (opt_in) {
    // console.log('setSubProp',opt_in)
    zoom_targetProp = opt_in.propIn
    let tel_Id = opt_in.tel_Id
    let propIn = opt_in.propIn
    let parentName = (
      propIn === '' ? null : instruments.data.propParentS1[tel_Id][propIn]
    )

    telPropTitle({ tel_Id: tel_Id, propIn: propIn, parentName: parentName })
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function telPropTitle (opt_in) {
    let tel_Id = opt_in.tel_Id
    let propIn = opt_in.propIn
    let parentName = opt_in.parentName

    if (propIn !== '' && !is_def(parentName)) return
    // console.log('telPropTitle',opt_in)

    // ------------------------------------------------------------------
    // title on top
    // ------------------------------------------------------------------
    let tagState = 'state10'
    let tag_now = tagState + '_title'

    let title_data = []
    title_data.push({
      id: tag_now + 'tel_Id',
      text: tel_Id === 'avg' ? 'Array' : tel_info.get_title(tel_Id),
      x: 20,
      y: avgTelD[1].h / 2,
      h: 30,
      strkW: 1
    })

    if (is_def(parentName)) {
      title_data.push({
        id: tag_now + parentName,
        text: instruments.propTitles[tel_Id][parentName],
        x: 10,
        y: avgTelD[1].h / 2,
        h: 30,
        strkW: 1
      })

      if (propIn !== parentName) {
        title_data.push({
          id: tag_now + propIn,
          text: instruments.data.propTitleS1[tel_Id][propIn],
          x: 10,
          y: avgTelD[1].h / 2,
          h: 25,
          strkW: 0
        })
      }
    }

    let title = com.s01.gText
      .selectAll('text.' + tag_now)
      .data(title_data, function (d, i) {
        return i
      })

    let eleWH = [[], null]
    $.each(title_data, function (i, d) {
      eleWH[0].push(null)
    })

    function textPos (d, i, isX) {
      if (isX) {
        let x = d.x
        $.each(title_data, function (index0, data_now0) {
          if (index0 < i) {
            if (!is_def(eleWH[0][index0]) || eleWH[0][index0] === 0) {
              eleWH[0][index0] = get_node_width_by_id({
                selction: com.s01.gText.selectAll('text.' + tag_now),
                id: data_now0.id
              })
            }
            x += data_now0.x + eleWH[0][index0]
          }
        })
        return x
      } else {
        if (!is_def(eleWH[1]) || eleWH[1] === 0) {
          eleWH[1] = get_node_height_by_id({
            selction: com.s01.gText.selectAll('text.' + tag_now),
            id: title_data[0].id,
            txt_scale: true
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
      .attr('class', tagState + ' ' + tag_now) // class list for easy selection
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
      .duration(times.anim_arc) // .delay(times.anim_arc/2)
      .attr('transform', function (d, i) {
        d.pos = [textPos(d, i, true), textPos(d, i, false)]
        return 'translate(' + d.pos[0] + ',' + d.pos[1] + ')'
      })
      .style('opacity', 1)

    title
      .exit()
      .transition('inOut')
      .duration(times.anim_arc)
      .attr('transform', function (d, i) {
        return 'translate(' + d.pos[0] * 2 + ',' + d.pos[1] + ')'
      })
      .style('opacity', 0)
      .remove()

    // ------------------------------------------------------------------
    // highlight rectangle for the selected property
    // ------------------------------------------------------------------
    let tagRect = tagState + '_rectSelect'

    // let propsNow = getTelProps(Object.keys(instruments.data.propParentS1[tel_Id]), tel_Id)

    let porpNow = propIn
    if (propIn !== '') {
      porpNow = instruments.data.propParentS1[tel_Id][propIn]
    }
    // let porpNow =
    //   propD.indexOf(propIn) >= 0 || propIn === ''
    //     ? propIn
    //     : instruments.data.propParentS1[tel_Id][propIn]
    // console.log('llllll', [propIn, porpNow], instruments.data.propParentS1[tel_Id])

    // let porpX   = ((porpNow == "" || !clickIn) ? instruments.prop0: porpNow) + "x";
    let porpX = (porpNow === '' ? instruments.prop0 : porpNow) + 'x'
    let recH = avgTelD[1].h
    let recW = recH * 1.5
    let recX = avgTelD[1][porpX] - recH / 2 - (recW - recH) / 2
    let recY = lenD.h[0] - recH

    let dataV = get_ele('main').getScale() >= zoomD.len['1.0'] ? [{ id: porpX }] : []
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
      .duration(times.anim_arc)
      .attr('opacity', 0.05)
      .attr('transform', function (d) {
        return 'translate(' + recX + ',' + recY + ')'
      })

    rect
      .exit()
      .transition('out')
      .duration(times.anim_arc)
      .attr('transform', function (d) {
        return 'translate(' + lenD.h[0] + ',' + recY + ')'
      })
      .attr('opacity', 0)
      .remove()
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function updateS1 (data_in) {
    if (
      !locker.are_free([
        's10bckArcChange',
        's10clickHirch',
        'updateTelHirch'
      ]) ||
      !is_def(com.s10.gHirch)
    ) {
      // console.log('will delay updateS1',data_in);
      setTimeout(function () {
        updateS1(data_in)
      }, times.anim_arc / 3)
      return
    }
    locker.add('updateTelHirch')

    com.s10.gHirch
      .selectAll('circle')
      .each(function (d) {
        if (d.data.id === instruments.prop0) {
          // console.log('updt',d.data.id,d.data.val,is_def(data_in[instruments.prop0]));
          d.data.val = data_in[instruments.prop0]
        } else if (is_def(data_in.data[d.data.id])) {
          // console.log('updt',d.data.id,data_in.data[d.data.id]);
          d.data.val = data_in.data[d.data.id]
        }
      })
      .transition('s1_updtData')
      .duration(times.anim_arc)
      .style('stroke', function (d) {
        return inst_health_col(d.data.val)
      })
      .style('fill', function (d) {
        return inst_health_col(d.data.val)
      })

    locker.remove('updateTelHirch')
  }
  this.updateS1 = updateS1

  function getWidgetState () {
    return {
      zoom_targetProp: zoom_targetProp
    }
  }
  this.getWidgetState = getWidgetState

  return
}
