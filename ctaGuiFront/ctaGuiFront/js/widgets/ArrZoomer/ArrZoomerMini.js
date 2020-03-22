// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
// window.load_script({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global sock */
/* global times */
/* global is_def */
/* global dom_add */
/* global run_when_ready */
/* global cols_purples */
/* global do_zoom_to_target */
/* global inst_health_col */
/* global bck_pattern */
/* global cols_blues */
/* global tel_info */
/* global move_node_up */
/* global vor_ploy_func */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerMini = function (opt_in0) {
  let this_top = this
  let run_loop = opt_in0.run_loop
  let sgv_tag = opt_in0.sgv_tag
  let widget_id = opt_in0.widget_id
  let locker = opt_in0.locker
  let is_south = opt_in0.is_south
  let isLens = opt_in0.isLens
  let my_unique_id = unique()
  let parentUniqueId = opt_in0.my_unique_id
  
  let dblclickZoomInOut = is_def(opt_in0.dblclickZoomInOut) ? opt_in0.dblclickZoomInOut : true
  let hasTitles = is_def(opt_in0.hasTitles) ? opt_in0.hasTitles : false
  let pointerEvents = is_def(opt_in0.pointerEvents) ? opt_in0.pointerEvents : !isLens
  this_top.staticZoom = is_def(opt_in0.staticZoom) ? opt_in0.staticZoom : true

  let miniLensTag = isLens ? 'Lens' : 'Mini'
  
  let eleBase = opt_in0.eleBase
  let instruments = eleBase.instruments
  let zoomD = eleBase.zoomD
  let lock_init_key = eleBase.lock_init_keys[miniLensTag.toLowerCase()]

  let rScale = instruments.rScale

  let lenD = { 
    // w: 500, h: 500, fracCircWH: 1,
    w: 600, h: 600, fracCircWH: 0.85,
  }

  let siteScale = eleBase.siteScale

  let showVor = false
  this_top.hasInit = false

  eleBase.set_ele(this_top, miniLensTag.toLowerCase())
  let get_ele = eleBase.get_ele

  let gMiniD = eleBase.svgD[miniLensTag.toLowerCase()]
  gMiniD.g = eleBase.svgD.g_svg.append('g')
  gMiniD.gMini = gMiniD.g.append('g')
  // gMiniD.gBase = gMiniD.gMini.append('g')

  let uniqueClipId = 'clip' + my_unique_id

  gMiniD.g_outer = gMiniD.gMini.append('g')
  gMiniD.g_outer.append('defs')
    .append('clipPath')
    .attr('id', uniqueClipId)
    .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', lenD.w)
      .attr('height', lenD.h)

  gMiniD.gClipped = gMiniD.g_outer.append('g')
  gMiniD.gClipped.attr('class', 'gClipped')
    .attr('clip-path', 'url(#'+uniqueClipId+')');

  gMiniD.gBase = gMiniD.gClipped.append('g')
  gMiniD.gBack = gMiniD.gBase.append('g')

  // ------------------------------------------------------------------
  // scale to 100x100 px (executed after createChessMap())
  // ------------------------------------------------------------------
  function gTrans() {
    let scaleMini = 100 / lenD.w
    gMiniD.gMini.attr('transform', function (d) {
      return 'translate(0,0)scale(' + scaleMini + ')'
    })
    return
  }

  // ------------------------------------------------------------------
  // to avoid bugs, this is the g which should be used
  // for translations and sacling of this element
  // ------------------------------------------------------------------
  this_top.setTransform = function (trans) {
    if (is_def(trans)) gMiniD.g.attr('transform', trans)
    return gMiniD.g
  }


  let com = {}
  this_top.com = com
  let zoom_target = null
  let telData = null
  let tel_typeV = null
  let prop0 = 'health'

  let miniMapCol = {}
  miniMapCol.b = ['#64B5F6']
  miniMapCol.p = ['#9575CD']

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function createMiniMap () {

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    gMiniD.g_outer
      .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width',lenD.w)
        .attr('height',lenD.h)
        .style("fill",'transparent' )
        .style("stroke",'#F2F2F2' )
        .style("stroke-width", isLens?2:0)
        .attr("pointer-events",'none')
        .attr("opacity",1)

    gMiniD.gBack
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', lenD.w)
      .attr('height', lenD.h)
      // .attr('fill', isLens?'transparent':'#383B42')
      .attr('fill', '#383B42')
      // .attr('fill', '#F2F2F2')
      // .style('opacity', isLens?0.1:1)


    // gMiniD.gBack
    //   .append('rect')
    //   .attr('x', 0)
    //   .attr('y', 0)
    //   .attr('width', lenD.w)
    //   .attr('height', lenD.h)
    //   // .attr('fill', isLens?'transparent':'#383B42')
    //   // .attr('fill', '#383B42')
    //   .attr('fill', '#F2F2F2')
    //   .style('opacity', isLens?0.05:0)

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------    
    get_ele('main').addBackShapes(gMiniD.gBack, lenD, eleBase.tel_types)

    // the background grid
    bck_pattern({
      com: com,
      g_now: gMiniD.gBack,
      g_tag: 'gBaseMini',
      len_wh: [lenD.w, lenD.h],
      opac: 0.2,
      hex_r: 40
    })

    com.gBaseMini = {}
    com.gBaseMini.circ = gMiniD.gBase.append('g')
    com.gBaseMini.text = gMiniD.gBase.append('g')
    com.gBaseMini.rect = gMiniD.gBase.append('g')
    com.gBaseMini.vor = gMiniD.gBase.append('g')

    if(!pointerEvents) {
      com.gBaseMini.vor.style('pointer-events', 'none')
    }


    return
  }
  

  // ------------------------------------------------------------------
  //  MiniMap function
  // ------------------------------------------------------------------
  function setupZoom () {
    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomStart() {
      if (!locker.are_free([
          'zoomSyncMain', ('zoomSync'+miniLensTag), 'inZoomMain',
        ])) return
      
      locker.add({ id: ('inZoom'+miniLensTag), override: true })
      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomDuring() {
      if (!locker.are_free([
          'zoomSyncMain', ('zoomSync'+miniLensTag), 'inZoomMain',
        ])) return

      if (!this_top.staticZoom) {
        gMiniD.gBase.attr('transform', d3.event.transform)
      }
      // miniZoomViewRecOnce({ animT: 0 })

      $.each(['main', 'mini', 'lens'], function(i, d) {
        if (d == miniLensTag) return

        if (!get_ele(d)) return
        if(get_ele(d).staticZoom) return
        
        eleBase.svgD[d].gBase.attr('transform', d3.event.transform)
        // eleBase.svgD.main.gBase.attr('transform', d3.event.transform)
      })

      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomEnd() {
      if (!locker.are_free([
          'zoomSyncMain', ('zoomSync'+miniLensTag), 'inZoomMain',
        ])) return

      miniZoomViewRec({})
      // console.log('-svgZoomEnd-svgZoomEnd-', d3.event)

      $.each(['main', 'mini', 'lens'], function(i, d) {
        if (d == miniLensTag) return

        if (!get_ele(d)) return
        get_ele(d).zoomSync(d3.event.transform)
        // get_ele('main').zoomSync(d3.event.transform)
      })


      // remove the lock before possible zoomToTrgMain()
      locker.remove(('inZoom'+miniLensTag))


      if (Math.abs(this_top.getScale() - zoomD.len['0.0']) < 0.00001) {
        let trans = this_top.getTrans()
        if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
          get_ele('main').zoomToTrgMain({
            target: 'init',
            scale: zoomD.len['0.0'],
            duration_scale: 1
          })
        }
      }

      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function zoomSync(trans) {
      if (!locker.are_free([
          ('zoomSync'+miniLensTag), ('inZoom'+miniLensTag),
        ])) return

      locker.add({ id: ('zoomSync'+miniLensTag), override: true })
      function func_end() {
        locker.remove(('zoomSync'+miniLensTag))
      }

      let x = (lenD.w / 2 - trans.x) / trans.k
      let y = (lenD.h / 2 - trans.y) / trans.k
      let trans_to = [x, y]

      let duration_scale = 0
      if (!this_top.staticZoom) {
        if(!locker.are_free(['autoZoomTarget'])) {
          duration_scale = 0.5
          duration_scale = 1
        }
      }

      let data_out = {
        target_scale: trans.k,
        duration_scale: duration_scale,
        baseTime: 300,
        trans_to: trans_to,
        wh: [lenD.w, lenD.h],
        cent: null,
        // func_start: func_start,
        func_end: func_end,
        // func_during: func_during,
        svg: gMiniD.gMini,
        svgZoom: com.svgZoom,
        zoom_callable: gMiniD.gBase,
        svg_zoom_node: gMiniD.zoom_node,
        is_static: this_top.staticZoom,
      }

      do_zoom_to_target(data_out)
      
      return
    }
    this_top.zoomSync = zoomSync



    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    com.svgZoom = d3.zoom()
    com.svgZoom.scaleExtent(zoomD.scaleExtent)
    com.svgZoom.on('start', svgZoomStart)
    com.svgZoom.on('zoom', svgZoomDuring)
    com.svgZoom.on('end', svgZoomEnd)

    // function filter() {
    //   let scale = this_top.getScale()
    //   let isIn = (d3.event.wheelDelta > 0) && (scale < zoomD.len['1.3'])
    //   let isOut = (d3.event.wheelDelta < 0) && (scale > zoomD.len['0.0'])
    //   console.log(d3.event.wheelDelta, isIn, isOut)

    //   if(!(isIn || isOut)) {
    //     console.log('qqqqqqqqqq',d3.event)
    //     // d3.event.sourceEvent.stopImmediatePropagation()
    //   }

    //   return 1
    //   return isIn || isOut
    // }
    // com.svgZoom.filter(filter)

    if(pointerEvents) {
      gMiniD.gMini
        .call(com.svgZoom)
        .on('dblclick.zoom', null)
        .on('wheel', function () {
          d3.event.preventDefault()
        })
        .on("mousedown.zoom", null)
    }


    // ------------------------------------------------------------------
    // save the svg node to use for d3.zoomTransform() later
    // ------------------------------------------------------------------
    gMiniD.zoom_node = gMiniD.gMini.nodes()[0]

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    this_top.getScale = function () {
      return d3.zoomTransform(gMiniD.zoom_node).k
    }
    this_top.getTrans = function () {
      return [
        d3.zoomTransform(gMiniD.zoom_node).x,
        d3.zoomTransform(gMiniD.zoom_node).y
      ]
    }

    return
  }

 
  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function telTitles () {
    if(!hasTitles) return
    
    let dataV = telData.tel
    let g_now = com.gBaseMini.text
    let tag_now = prop0

    let fontSize0 = 12 * siteScale
    // let fontSize0 = 11 * siteScale

    let text = g_now
      .selectAll('text.' + tag_now)
      .data(dataV, function (d) {
        return d.id
      })

    text
      .enter()
      .append('text')
      .text(function (d) {
        return tel_info.get_title(d.id)
      })
      .attr('class', tag_now)
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .style('fill', '#383b42')
      .style('stroke-width', '0.3')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .style('stroke', '#383b42')
      .style('font-size', function (d) {
        return fontSize0 + 'px'
      })
      .attr('dy', function (d) {
        return fontSize0 / 3 + 'px'
      })
      .attr('transform', function (d, i) {
        return (
          'translate(' + instruments.data.xyr[d.id].x + ',' + instruments.data.xyr[d.id].y + ')'
        )
      })
      .attr('text-anchor', 'middle')
      .merge(text)
      .transition('inOut')
      .duration(times.anim_arc)
      .attr('transform', function (d, i) {
        let shiftVal = 0
        // let shiftVal = eleBase.teleR.s00[3]*2
        // if (isFocused(d, 1)) {
        //   shiftVal = instruments.data.xyr[d.id].r * (rScale[1].health1 + 0.5)
        // }
        return (
          'translate(' +
          instruments.data.xyr[d.id].x +
          ',' +
          (instruments.data.xyr[d.id].y - shiftVal) +
          ')'
        )
      })
      .style('font-size', function (d) {
        return fontSize0 + 'px'
      })
      .attr('dy', function (d) {
        return fontSize0 / 3 + 'px'
      })
      .style('opacity', 1)

    text
      .exit()
      .transition('exit')
      .duration(times.anim_arc)
      .style('opacity', 0)
      .remove()
    
    return
  }

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function updateMiniMap (opt_in) {
    let dataV = telData.tel
    let g_now = com.gBaseMini.circ
    let posTag = 'xyrPhysical'
    let tag_now = prop0

    // operate on new elements only
    let circ = g_now
      .selectAll('circle.' + tag_now)
      .data(dataV, function (d) {
        return d.id
      })

    circ
      .enter()
      .append('circle')
      .attr('class', tag_now)
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
      .duration(times.anim_arc)
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
        return inst_health_col(d[tag_now])
      })
      .style('stroke', function (d) {
        return inst_health_col(d[tag_now], 0.5)
      })
  
    return
  }
  this_top.updateMiniMap = updateMiniMap
  
  // ------------------------------------------------------------------
  //  Blue square on miniMap
  // ------------------------------------------------------------------
  function miniZoomViewRec (opt_in) {
    run_loop.push({ tag: 'miniZoomViewRec'+my_unique_id, data:opt_in })
  }
  this_top.miniZoomViewRec = miniZoomViewRec
  
  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function miniZoomViewRecOnce (opt_in) {
    if (!this_top.staticZoom) return
    if (
      !locker.are_free([
        'autoZoomTarget',
        'zoom_to_target_mini',
      ])
    ) {
      miniZoomViewRec(opt_in)
      return
    }
    
    let tag_now = 'miniZoomViewRec'
    let scale = this_top.getScale()
    let trans = this_top.getTrans()
    let data = []

    if(!is_def(opt_in)) opt_in = {}
    let animT = is_def(opt_in.animT) ? opt_in.animT : times.anim_arc
    // console.log('QQQ animT',animT,scale,Date.now())

    if (scale < (is_south ? 2 : 1.5)) {
      scale = 1
      trans = [0, 0]
    } 
    else {
      data = [{ id: 0 }]
    }

    let baseH = lenD.w

    let w =
      (1 + (is_south ? 2 * scale / zoomD.len['1.3'] : 0)) * baseH / scale
    let h =
      (1 + (is_south ? 2 * scale / zoomD.len['1.3'] : 0)) * baseH / scale
    let x = (baseH / 2 - trans[0]) / scale - w / 2
    let y = (baseH / 2 - trans[1]) / scale - h / 2

    let strkW = 1 + 0.1 * scale / (zoomD.len['1.3'] - zoomD.len['0.0'])
    let opac = 0.95 * Math.sqrt(scale / (zoomD.len['1.3'] - zoomD.len['0.0']))

    // operate on new elements only
    let rect = com.gBaseMini.rect
      .selectAll('rect.' + tag_now)
      .data(data, function (d) {
        return d.id
      })

    rect
      .enter()
      .append('rect')
      .attr('class', tag_now)
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
      .duration(animT)
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
      .duration(times.anim_arc)
      .style('opacity', '0')
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .remove()

    return
  }
  
  // ------------------------------------------------------------------
  //  Zoom to target when click on miniMap
  // ------------------------------------------------------------------
  function miniZoomClick () {
    // let tag_now = 'miniZoomClick'

    let vorFunc = d3
      .voronoi()
      .x(function (d) {
        return d.x
      })
      .y(function (d) {
        return d.y
      })
      .extent([[0, 0], [lenD.w, lenD.h]])

    com.gBaseMini.vor
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
        d.attr('d', vor_ploy_func)
      })
      .on('click', function (d) {
        telData.vorDblclick({ 
          source: 'minizoomclick', d: d, isInOut: false,
        })
        return
      })
      // .on("click", function(d) {
      //   let scaleToZoom = telData.vorDblclick({d:d, isInOut:false });
      //   this_top.zoomToTrgQuick({ target:d.data.id, scale:scaleToZoom, duration_scale:-1 });
      // })
      // .on("dblclick", function(d) {  // dousnt work well...
      //   let scaleToZoom = telData.vorDblclick({d:d, isInOut:true });
      //   this_top.zoomToTrgQuick({ target:d.data.id, scale:scaleToZoom, duration_scale:-1 });
      // })
      

      // .on('mouseover', function (d) {
      //   this_top.target = d.data.id
      // })

      .on('mouseover', instruments.data.hover)
      .on('click', instruments.data.click)
      .on('dblclick', function (d) {
        instruments.data.dblclick({ d: d, isInOut: dblclickZoomInOut })
      })
  }

  // ------------------------------------------------------------------
  //  Global function
  // ------------------------------------------------------------------
  function init_data (data_in) {
    if (this_top.hasInit) return
    this_top.hasInit = true

    telData = data_in.instrumentData
    tel_typeV = data_in.tel_typeV

    setupZoom()
    createMiniMap()
    gTrans()
    telTitles()

    // initialize the target name for hovering->zoom
    this_top.target = zoom_target
    // programatic zoom to some target and scale - only use the last of any set of ovelapping zoom requests
    // run_loop.init({
    //   tag: zoom_to_target_tag.mini+my_unique_id,
    //   func: do_zoom_to_target,
    //   n_keep: -1
    // })

    // // the actual function to be called when a zoom needs to be put in the queue
    // zoomToTrgQuick = function (opt_in) {
    //   console.log('zoomToTrgQuick',opt_in)
    //   zoom_to_target_now(opt_in, 'mini')
    // }
    // this_top.zoomToTrgQuick = zoomToTrgQuick

    // // the background grid
    // bck_pattern({
    //   com:com, g_now:gMiniD.svgChes, g_tag:"gChes", len_wh:[baseH,baseH],
    //   opac:0.1, texture_orient:"5/8", texture_size:120
    // });
    run_loop.init({
      tag: 'miniZoomViewRec'+my_unique_id,
      func: miniZoomViewRecOnce,
      n_keep: 1
    })
    miniZoomViewRec({})
    miniZoomClick()

    setStateOnce(data_in)

    locker.remove(lock_init_key)
    return
  }
  this_top.init_data = init_data
  
  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function setStateOnce (data_in) {
    updateMiniMap({
      dataV: telData.tel,
      g_now: com.gBaseMini.circ,
      posTag: miniLensTag.toLowerCase(),
    })
  }
  this_top.setStateOnce = setStateOnce

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
  

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  // initialize a couple of functions to be overriden below
  this_top.getScale = function () {
    return zoomD.len['0.0']
  }
  
  this_top.getTrans = function () {
    return [0, 0]
  }

  return
}

