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
window.ArrZoomerChes = function (opt_in0) {
  let this_top = this
  let run_loop = opt_in0.run_loop
  let sgv_tag = opt_in0.sgv_tag
  let widget_id = opt_in0.widget_id
  let locker = opt_in0.locker
  let is_south = opt_in0.is_south

  let eleBase = opt_in0.eleBase

  eleBase.set_ele(this_top, 'ches')


  let instruments = eleBase.instruments
  let rScale = instruments.rScale
  let lock_init_key = eleBase.lock_init_keys.ches

  let baseH = 500
  let addChesOutline = false
  let showVor = false

  let gChesD = eleBase.svgD.ches

  gChesD.g = eleBase.svgD.g_svg.append('g')
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
  this_top.setTransform = function (trans) {
    if (is_def(trans)) gChesD.gChes.attr('transform', trans)
    return gChesD.gChes
  }




  let com = {}
  com.chesXY = { x: {}, y: {} }

  let zoom_target = null
  let zoomLen = {}
  let telData = null
  let tel_typeV = null
  let prop0 = 'health'

  zoomLen['0.0'] = 1
  if (is_south) {
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

  // let zoom_to_target_tag = {
  //   ches: 'zoom_to_target_ches'
  // }


  // ------------------------------------------------------------------
  //  Chess function
  // ------------------------------------------------------------------
  function createChessMap (opt_in) {
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
    gChesD.svgChes_zoom_node = gChesD.gBaseChes.nodes()[0]
    gChesD.gChesZoomed = gChesD.svgChes.append('g')

    // add one rectangle as background, and to allow click to zoom
    // ------------------------------------------------------------------

    let gChesRec = gChesD.svgChes.append('g')

    com.gChes = {}
    com.gChes.g = gChesD.svgChes.append('g')
    com.gChes.xyr = {}

    // let nRows     = is_south ? 5 : 2;
    // let n_ele = is_south ? 99 : 19
    let n_ele_in_row = is_south ? [18, 18, 18, 18, 18] : [8, 8, 8]
    let eleR = is_south ? baseH / 16 : baseH / 6
    let eleSpace = is_south ? [3.9, 2.5] : [3.1, 1.5]
    let eleShift = is_south ? [2, 2] : [2, 3]

    let vorData = []
    let n_ele_row = 0
    $.each(tel_typeV, function (index, id_now) {
      let n_ele_now_row = n_ele_row
      let n_ele_now_col = 0

      $.each(Array(n_ele_in_row.length), function (i, d) {
        if (n_ele_now_row >= n_ele_in_row[i]) {
          n_ele_now_row -= n_ele_in_row[i]
          n_ele_now_col++
        }
      })
      n_ele_row++

      let x =
        eleR / eleShift[0] +
        eleR +
        ((is_south ? 0.3 : 0.15 * 6) + n_ele_now_row) * (eleSpace[0] * eleR)
      let y = eleR / eleShift[1] + eleR + n_ele_now_col * (eleSpace[1] * eleR)

      com.gChes.xyr[id_now] = {
        id: id_now,
        rc: [n_ele_now_row, n_ele_now_col],
        x: x,
        y: y,
        r: eleR * 1.5
      }
      vorData.push({ id: id_now, x: x, y: y })
    })

    let xyrFlat = Object.values(com.gChes.xyr)
    com.chesXY.x.min = min_max_obj({
      minMax: 'min', data: xyrFlat, func: (x => x.x - 1. * x.r)
    })
    com.chesXY.x.max = min_max_obj({
      minMax: 'max', data: xyrFlat, func: (x => x.x + 1. * x.r)
    })
    com.chesXY.y.min = min_max_obj({
      minMax: 'min', data: xyrFlat, func: (x => x.y - 1. * x.r)
    })
    com.chesXY.y.max = min_max_obj({
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
    let tag_circ = prop0
    let tagLbl = 'lbls00title'
    let tagState = 'state_00'
    // let tag_txt = tagState + tagLbl

    let fontScale = is_south ? 2.7 : 4
    let titleSize = (is_south ? 16 : 17) * fontScale

    let circStrk = 0
    let textStrk = is_south ? 0.3 : 0.8
    let fillOpac = 1

    //
    let circ = com.gChes.g
      .selectAll('circle.' + tag_circ)
      .data(dataV, function (d) {
        return d.id
      })
    circ
      .enter()
      .append('circle')
      .attr('class', tag_circ)
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
      .duration(times.anim_arc)
      // .style("fill", function(d) { return inst_health_col(d[tag_circ],0.5); } )
      .style('stroke', function (d) {
        return inst_health_col(d[tag_circ], 0.5)
      })

    circ
      .exit()
      .transition('inOut')
      .duration(times.anim_arc)
      .attr('r', 0)
      .remove()

    function txtColRC (d) {
      let index = com.gChes.xyr[d.id].rc[0] + com.gChes.xyr[d.id].rc[1]
      return index % 2 === 0
        ? d3.rgb(cols_purples[4]).brighter(0.5)
        : d3.rgb(cols_blues[3]).brighter(0.1)
      // return (index%2 == 0) ? d3.rgb(cols_yellows[1]).brighter(0.5) : d3.rgb(cols_greens[4]).brighter(0.1);
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
        return tel_info.get_title(d.id)
      })
      // .attr("id",      function(d) { return my_unique_id+d.id+tag_txt; })
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
      // .style("stroke",   function(d) { return inst_health_col(d[tag_circ]); } )
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
      .duration(times.anim_arc)
      .delay(100)
      .style('opacity', '1')

    text
      .exit()
      .transition('inOut')
      .duration(times.anim_arc)
      .style('opacity', 0)
      .remove()

    // ------------------------------------------------------------------
    // the highlight function
    // ------------------------------------------------------------------
    function focusTel (dIn, isOn) {
      locker.add('svgQuickFocusTel')

      let delay = 250
      setTimeout(function () {
        if (locker.n_active('svgQuickFocusTel') === 1) {
          _focusTel(dIn, isOn)
        }
        locker.remove('svgQuickFocusTel')
      }, delay)
    }

    function _focusTel (dIn, isOn) {
      let rScale = is_south ? 2.0 : 1.1

      let is_ele_on
      let dInId = is_def(dIn.data) ? dIn.data.id : ''
      if (isOn) {
        is_ele_on = function (d) {
          return d.id === dInId
        }
      } else {
        is_ele_on = function () {
          return false
        }
      }

      //
      let circ = com.gChes.g.selectAll('circle.' + tag_circ)
      let text = com.gChes.g.selectAll('text.' + tagLbl)

      circ.each(function (d) {
        if (is_ele_on(d)) move_node_up(this, 2)
      })
      text.each(function (d) {
        if (is_ele_on(d)) move_node_up(this, 2)
      })

      //
      circ
        .transition('update')
        .duration(times.anim_arc * (isOn ? 0.5 : 0.1))
        // .style("opacity", function(d) { return is_ele_on(d) ? 1 : (isOn?0.5:1);  })
        .style('fill-opacity', function (d) {
          return is_ele_on(d) ? 1 : 0
        })
        .attr('r', function (d) {
          return com.gChes.xyr[d.id].r * (is_ele_on(d) ? rScale : 1)
        })
        .attr('stroke-width', function (d) {
          return is_ele_on(d) ? circStrk + 1.5 : 0
        })

      //
      text
        .transition('update')
        .duration(times.anim_arc * (isOn ? 1 : 0.1))
        .style('font-size', function (d) {
          return (is_ele_on(d) ? titleSize * rScale : titleSize) + 'px'
        })
        .attr('dy', function (d) {
          return (is_ele_on(d) ? titleSize * rScale : titleSize) / 3 + 'px'
        })
        .attr('stroke-width', function (d) {
          return is_ele_on(d) ? textStrk + 0.7 : textStrk
        })
        .style('font-weight', function (d) {
          return is_ele_on(d) ? 'bold' : 'normal'
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
        d.attr('d', vor_ploy_func)
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
  function init_data (data_in) {
    if (is_def(gChesD.svgChes)) return

    telData = data_in.instrumentData
    tel_typeV = data_in.tel_typeV

    createChessMap()
    gTrans()

    // initialize the target name for hovering->zoom
    this_top.target = zoom_target
    // programatic zoom to some target and scale - only use the last of any set of ovelapping zoom requests
    // run_loop.init({
    //   tag: zoom_to_target_tag.ches,
    //   func: do_zoom_to_target,
    //   n_keep: -1
    // })

    // // the actual function to be called when a zoom needs to be put in the queue
    // zoomToTrgQuick = function (opt_in) {
    //   zoom_to_target_now(opt_in, 'ches')
    // }
    // this_top.zoomToTrgQuick = zoomToTrgQuick

    setStateOnce(data_in)

    locker.remove(lock_init_key)
    return
  }
  this.init_data = init_data
  
  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function setStateOnce (data_in) {
    updateChessMap(telData.tel, false)
    // updateChessMap(telData.tel, is_south ? 2.7 : 5, false)
  }
  this.setStateOnce = setStateOnce

  // // ------------------------------------------------------------------
  // // initialize a global function (to be overriden below)
  // // ------------------------------------------------------------------
  // let zoomToTrgQuick = function (opt_in) {
  //   if (!locker.is_free('inInit')) {
  //     setTimeout(function () {
  //       zoomToTrgQuick(opt_in)
  //     }, times.wait_loop)
  //   }
  // }
  // this_top.zoomToTrgQuick = zoomToTrgQuick
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
  // function zoom_to_target_now (opt_in, tag_now) {
  //   console.log(' X??X zoom_to_target_now')
  //   let tag_nowUp = tag_now
  //   if (tag_nowUp === 'ches') {
  //     tag_nowUp = 'Ches'
  //   }

  //   if (!locker.is_free('inInit')) {
  //     setTimeout(function () {
  //       zoom_to_target_now(opt_in, tag_now)
  //     }, times.wait_loop)
  //     return
  //   }
  //   if (!locker.are_free(['autoZoomTarget', 'zoom_to_target' + tag_nowUp])) {
  //     return
  //   }

  //   let target_name = opt_in.target
  //   let targetScale = opt_in.scale
  //   let duration_scale = opt_in.duration_scale

  //   // console.log('dddddd',telData.mini)

  //   if (targetScale < zoomLen['0.0']) targetScale = getScale()

  //   let trans_to
  //   if (target_name === '' || !is_def(telData.mini[target_name])) {
  //     let scale = getScale()
  //     let trans = getTrans()
  //     let x = (baseH / 2 - trans[0]) / scale
  //     let y = (baseH / 2 - trans[1]) / scale
  //     trans_to = [x, y]
  //   } else {
  //     trans_to = [telData.mini[target_name].x, telData.mini[target_name].y]
  //   }

  //   let func_start = function () {
  //     locker.add({ id: 'zoom_to_target' + tag_nowUp, override: true })
  //     // console.log('xxx',target_name);
  //   }
  //   let func_during = function () {}
  //   let func_end = function () {
  //     locker.remove('zoom_to_target' + tag_nowUp)
  //   }

  //   let data_out = {
  //     target_scale: targetScale,
  //     duration_scale: duration_scale,
  //     baseTime: 300,
  //     trans_to: trans_to,
  //     wh: [baseH, baseH],
  //     cent: null,
  //     func_start: func_start,
  //     func_end: func_end,
  //     func_during: func_during,
  //     svg: gChesD['svg' + tag_nowUp],
  //     svgZoom: com['svg' + tag_nowUp + 'Zoom'],
  //     zoom_callable: gChesD['g' + tag_nowUp + 'Zoomed'],
  //     svg_zoom_node: gChesD['svg' + tag_nowUp + '_zoom_node']
  //   }

  //   if (duration_scale < 0) {
  //     data_out.duration_scale = 0
  //     do_zoom_to_target(data_out)
  //   } else {
  //     run_loop.push({ tag: zoom_to_target_tag[tag_now], data: data_out })
  //   }
  // }

  return
}

