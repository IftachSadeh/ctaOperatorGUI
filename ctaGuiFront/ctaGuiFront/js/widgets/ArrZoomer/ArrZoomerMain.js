// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
/* global $ */
/* global d3 */
/* global sock */
/* global times */
/* global is_def */
/* global dom_add */
/* global run_when_ready */
/* global do_zoom_to_target */
/* global inst_health_col */
/* global bck_pattern */
/* global tel_info */
/* global vor_ploy_func */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerMain = function (opt_in0) {
  let this_top = this
  let run_loop = opt_in0.run_loop
  let sgv_tag = opt_in0.sgv_tag
  let widget_id = opt_in0.widget_id
  let locker = opt_in0.locker
  let is_south = opt_in0.is_south
  let my_unique_id = unique()
  let parentUniqueId = opt_in0.my_unique_id
  let widget_type = opt_in0.widget_type

  let noRender = opt_in0.noRender
  let dblclickZoomInOut = is_def(opt_in0.dblclickZoomInOut) ? opt_in0.dblclickZoomInOut : true

  let eleBase = opt_in0.eleBase

  let instruments = eleBase.instruments
  let zoomD = eleBase.zoomD
  let lock_init_key = eleBase.lock_init_keys.main
  
  let rScale = instruments.rScale

  let getPropPosShift = eleBase.getPropPosShift
  let interpolate01 = eleBase.interpolate01
  let setZoomState = eleBase.setZoomState
  let propsS1 = eleBase.propsS1
  let setState = eleBase.setState
  let isStateUp = eleBase.isStateUp
  let isStateDown = eleBase.isStateDown
  let isStateChange = eleBase.isStateChange
  let sync_state_send = eleBase.sync_state_send
  
  eleBase.set_ele(this_top, 'main')
  let get_ele = eleBase.get_ele


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  this_top.hasInit = false
  // this_top.svgQuick = null

  let com = {}
  this_top.com = com
  let s10V = []
  let syncD = {}
  this_top.syncD = syncD
  com.vor = {}
  com.s00 = {}
  com.s01 = {}
  com.s10 = {}
  instruments.data.vor = {}

  
  let focusD = {}

  let s1LblXY = {}
  let arcFunc = {}

  let links2V = {}

  let arc_prev = {}
  arc_prev.ang = {}
  arc_prev.rad = {}

  let teleR = eleBase.teleR
  let siteScale = eleBase.siteScale

  let lenD = { 
    // w: 500, h: 500, fracCircWH: 1,
    w: 600, h: 600, fracCircWH: 0.85,
  }
  this_top.lenD = lenD
  


  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  let gMainD = eleBase.svgD.main
  gMainD.g = eleBase.svgD.g_svg.append('g')
  gMainD.g_outer = gMainD.g.append('g')

  let uniqueClipId = 'clip' + my_unique_id
  
  gMainD.g_outer.append('defs')
    .append('clipPath')
    .attr('id', uniqueClipId)
    .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', lenD.w)
      .attr('height', lenD.h)

  gMainD.gClipped = gMainD.g_outer.append('g')
  gMainD.gClipped.attr('class', 'gClipped')
    .attr('clip-path', 'url(#'+uniqueClipId+')');

  // ------------------------------------------------------------------
  // initial scale to 100x100 px
  // ------------------------------------------------------------------
  gMainD.g_outer.attr('transform', function (d) {
    return 'translate(0,0)scale('+ (100 / lenD.w) +')'
  })

  // ------------------------------------------------------------------
  // to avoid bugs, this is the g which should be used
  // for translations and sacling of this element
  // ------------------------------------------------------------------
  this_top.setTransform = function (trans) {
    if (is_def(trans)) gMainD.g.attr('transform', trans)
    return gMainD.g
  }

  gMainD.gBase = gMainD.gClipped.append('g')
  gMainD.gBack = gMainD.gBase.append('g')
  com.vor.g = gMainD.gBase.append('g')
  com.s00.g = gMainD.gBase.append('g')
  com.s01.g = gMainD.gBase.append('g')

  if (noRender) {
    gMainD.g
      .style('opacity', 0)
      .style('pointer-events', 'none')
  }

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function cat_ele_pos(n_ele_now, n_elements) {
    let yMargTop = lenD.h * 0.3
    let yMargBot = 0
    let yMarg = teleR.s00[2] + lenD.h * 0.2
    let yTot = lenD.h - 2 * yMarg - yMargTop - yMargBot
    let yWidth = yTot / (n_elements - 1)
    let x = (lenD.w * (1-lenD.fracCircWH)) / 2
    let y = yMargTop + yMarg + yWidth * n_ele_now
    let r = teleR.s00[3]

    return { x: x, y: y, r: r, }
  }
  this_top.cat_ele_pos = cat_ele_pos

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function isCategoricalId(id) {
    let catIds = ['PROC']

    let telIndex = catIds.indexOf(eleBase.tel_types[id])
    return (telIndex !== -1)
  }

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function addBackShapes(gIn, len_wh, telData) {
    gIn
      .append('circle')
      .attr('r', (len_wh.w - len_wh.w * (1-len_wh.fracCircWH)) / 2.1)
      .attr('cx', (len_wh.w + len_wh.w * (1-len_wh.fracCircWH)) / 2)
      .attr('cy', len_wh.h / 2)
      // .attr('r', len_wh.w / 2.1)
      // .attr('cx', len_wh.w / 2)
      // .attr('cy', (len_wh.h - len_wh.h * (1-len_wh.fracCircWH)) / 2)
      .attr('fill', '#F2F2F2')

    // let tag_now = 'bckCirc'
    // let rCirc = [ len_wh.w / 12, len_wh.w / 2.1]
    // let dataV = [
    //   {cx: len_wh.w / 10, cy: len_wh.h / 10, r: rCirc[0]},
    //   {cx: len_wh.w / 2, cy: len_wh.h / 2, r: rCirc[1]},
    // ]
    // let circ = gMainD.gBack
    //   .selectAll('circle.' + tag_now)
    //   .data(dataV)

    // circ
    //   .enter()
    //   .append('circle')
    //   .attr('r', 0)
    //   .style('r', function (d) { return d.r })
    //   .style('cx', function (d) { return d.cx })
    //   .style('cy', function (d) { return d.cy })
    //   .attr('fill', '#F2F2F2')
    //   .style("stroke",'#383B42' )
    //   .style("stroke-width", 1)

    let y_ele = []
    let dataCat = Object.entries(telData).filter(function(d) {
      return isCategoricalId(d[0])
    })
    $.each(dataCat, function(i, d) {
      let id = d[0]
      // let data_now = d[1]
      y_ele.push(this_top.cat_ele_pos(i, dataCat.length).y)
    })
    let yMin = Math.min(...y_ele) - teleR.s00[3]*3
    let yMax = Math.max(...y_ele) + teleR.s00[3]*3
    let xShift = len_wh.w * (1-len_wh.fracCircWH) * 0.1

    gIn
      .append('rect')
      .attr('x', xShift)
      .attr('y', yMin)
      .attr('width', (len_wh.w * (1-len_wh.fracCircWH)) - 1.5*xShift)
      .attr('height', yMax - yMin)
      .attr("rx", len_wh.h * 0.02)
      .attr("ry", len_wh.h * 0.02)
      .attr('fill', '#F2F2F2')
    return
  }
  this_top.addBackShapes = addBackShapes


  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function init_data (data_in) {
    let arr_init = data_in.arr_init
    let subArr = data_in.subArr

    if (this_top.hasInit) return
    this_top.hasInit = true

    initVor()

    // ------------------------------------------------------------------
    // add one circle as background
    // ------------------------------------------------------------------
    if (!noRender) {
      gMainD.g_outer
        .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width',lenD.w)
          .attr('height',lenD.h)
          .style("fill",'transparent' )
          .style("stroke",'#383B42' )
          // .style("stroke",'#F2F2F2' )
          // .style("stroke",'#2196F3' )
          .style("stroke-width", 1)
          .attr("pointer-events",'none')
          .attr("opacity",1)

      addBackShapes(gMainD.gBack, lenD, arr_init)

      // the background grid
      bck_pattern({
        com: com,
        g_now: gMainD.gBack,
        g_tag: 'hex',
        len_wh: [lenD.w, lenD.h],
        opac: this_top.getScale() < zoomD.len['1.0'] ? 0.15 : 0.07,
        hex_r: 18
      })
    }


    // ------------------------------------------------------------------
    // run all variations, just to initialize all the variables
    // (but only the last one will take affect - this will be the default value)
    // ------------------------------------------------------------------
    instruments.data.layout = 'physical' // physical layout as default
    // instruments.data.layout = "subArr";  // sub-array layout as default

    // this_top.set_layoutSubArr(subArr)
    this_top.set_layoutPhysical(arr_init)


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    setState()

    locker.remove(lock_init_key)
    return
  }
  this_top.init_data = init_data


  // // ------------------------------------------------------------------
  // // 
  // // ------------------------------------------------------------------
  // function setupZoom () {
  //   // initialize a global function (to be overriden below)
  //   this_top.zoomToTrgMain = function (opt_in) {
  //     if (!locker.is_free('inInit')) {
  //       setTimeout(function () {
  //         this_top.zoomToTrgMain(opt_in)
  //       }, times.wait_loop)
  //     }
  //   }

  //   // initialize a couple of functions to be overriden below
  //   this_top.getScale = function () { return zoomD.len['0.0'] }
  //   this_top.getTrans = function () { return [0, 0] }
  //   this_top.getZoomS = function () { return 0 }

  //   return
  // }
  // setupZoom()


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function initZoom () {
    let scaleStart = 0
    let zoomSyncMiniLockers = [
      'zoomSyncMain', 'zoomSyncMini', 'zoomSyncLens', 'inZoomMini',
    ]
    
    function svgZoomStart () {
      if (!locker.are_free(zoomSyncMiniLockers)) return

      scaleStart = d3.event.transform.k
      locker.add({ id: 'zoom', override: true })
      locker.add({ id: 'inZoomMain', override: true })
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomDuring () {
      if (!locker.are_free(zoomSyncMiniLockers)) {
        return
      }
      
      gMainD.gBase.attr('transform', d3.event.transform)

      $.each(['mini', 'lens'], function(i, d) {
        let svgMini = get_ele(d)
        if (!svgMini) return
        if(svgMini.staticZoom) return
        
        eleBase.svgD[d].gBase.attr('transform', d3.event.transform)
      })

      svgZoomUpdState()
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomEnd () {
      if (!locker.are_free(zoomSyncMiniLockers)) return
      
      svgZoomUpdState()
      setZoomState()

      focusD.target = zoomD.target
      focusD.scale = d3.event.transform.k

      $.each(['mini', 'lens'], function(i, d) {
        let svgMini = get_ele(d)
        if (!svgMini) return
        // if(svgMini.staticZoom) return

        svgMini.miniZoomViewRec()
        svgMini.zoomSync(d3.event.transform)
      })

      locker.remove('zoom')
      locker.remove('inZoomMain')

      // ------------------------------------------------------------------
      // if on minimal zoom, center
      // ------------------------------------------------------------------
      if (Math.abs(d3.event.transform.k - scaleStart) > 0.00001) {
        if (Math.abs(d3.event.transform.k - zoomD.len['0.0']) < 0.00001) {
          if (locker.are_free(['autoZoomTarget'])) {
            this_top.zoomToTrgMain({
              target: 'init',
              scale: d3.event.transform.k,
              duration_scale: 0.5
            })
          }

          // syncroniz changes with other panels
          sync_state_send({
            type: 'syncTelFocus',
            syncTime: Date.now(),
            zoom_state: 0,
            target: 'init'
          })
        }
      }

      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function zoomSync(trans) {
      locker.add({ id: 'zoomSyncMain', override: true })
      function func_end() {
        locker.remove('zoomSyncMain')
      }

      let x = (lenD.w / 2 - trans.x) / trans.k
      let y = (lenD.h / 2 - trans.y) / trans.k
      let trans_to = [x, y]

      let data_out = {
        target_scale: trans.k,
        duration_scale: 0,
        baseTime: 300,
        trans_to: trans_to,
        wh: [lenD.w, lenD.h],
        cent: null,
        // func_start: func_start,
        func_end: func_end,
        // func_during: func_during,
        svg: gMainD.g_outer,
        svgZoom: com.svgZoom,
        zoom_callable: gMainD.gBase,
        svg_zoom_node: gMainD.zoom_node
      }

      do_zoom_to_target(data_out)
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

    gMainD.g_outer.call(com.svgZoom)
      .on('dblclick.zoom', null)
      .on('wheel', function () {
        d3.event.preventDefault()
      })

    // save the svg node to use for d3.zoomTransform() later
    gMainD.zoom_node = gMainD.g_outer.nodes()[0]


    // ------------------------------------------------------------------
    // programatic zoom to some target and scale - only use the
    // last of any set of ovelapping zoom requests
    // ------------------------------------------------------------------
    run_loop.init({
      tag: 'zoom_to_target_main'+my_unique_id,
      func: do_zoom_to_target,
      n_keep: -1
    })

    // ------------------------------------------------------------------
    // the actual function to be called when a
    // zoom needs to be put in the queue
    // ------------------------------------------------------------------
    this_top.zoomToTrgMain = function (opt_in) {
      if (!locker.is_free('inInit')) {
        setTimeout(function () {
          this_top.zoomToTrgMain(opt_in)
        }, times.wait_loop)
        return
      }
      if (!locker.are_free(['autoZoomTarget'])) return
      
      let target_name = opt_in.target
      let targetScale = opt_in.scale
      let duration_scale = opt_in.duration_scale
      let endFunc = opt_in.endFunc

      if (targetScale < zoomD.len['0.0']) targetScale = this_top.getScale()

      let trans_to = null
      if (target_name === 'init') {
        trans_to = [lenD.w / 2, lenD.h / 2]
      } 
      else if (
        target_name === '' || 
        !is_def(instruments.data.mini[target_name])) 
      {
        let scale = this_top.getScale()
        let trans = this_top.getTrans()
        let x = (lenD.w / 2 - trans[0]) / scale
        let y = (lenD.h / 2 - trans[1]) / scale
        trans_to = [x, y]

        let diffMin = -1
        target_name = zoomD.target
        $.each(instruments.data.xyr, function (id_now, data_now) {
          if (data_now.isTel) {
            let diffNow =
              Math.pow(x - data_now.x, 2) + Math.pow(y - data_now.y, 2)
            if (diffNow < diffMin || diffMin < 0) {
              diffMin = diffNow
              target_name = id_now
            }
          }
        })
      } else {
        trans_to = [
          instruments.data.xyr[target_name].x,
          instruments.data.xyr[target_name].y
        ]
      }

      let func_start = function () {
        locker.add({ id: 'autoZoomTarget', override: true })
        if (target_name !== '' && target_name !== 'init') {
          zoomD.target = target_name
        }
      }
      
      let func_during = function () {}
      
      let func_end = function () {
        locker.remove('autoZoomTarget')

        let isDone = true
        if (Math.abs(this_top.getScale() - zoomD.len['0.0']) < 0.00001) {
          let trans = this_top.getTrans()
          if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
            isDone = false
            this_top.zoomToTrgMain({
              target: 'init',
              scale: zoomD.len['0.0'],
              duration_scale: 1
            })
          }
        }
        if (duration_scale > 0 && isDone) setState()

        if (is_def(endFunc)) endFunc(opt_in)
      }

      let data_out = {
        target_scale: targetScale,
        duration_scale: duration_scale,
        baseTime: 300,
        trans_to: trans_to,
        wh: [lenD.w, lenD.h],
        cent: null,
        func_start: func_start,
        func_end: func_end,
        func_during: func_during,
        svg: gMainD.g_outer,
        svgZoom: com.svgZoom,
        zoom_callable: gMainD.gBase,
        svg_zoom_node: gMainD.zoom_node
      }

      if (duration_scale < 0) {
        data_out.duration_scale = 0
        do_zoom_to_target(data_out)
      } else {
        run_loop.push({ tag: 'zoom_to_target_main'+my_unique_id, data: data_out })
      }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    this_top.getScale = function () {
      return d3.zoomTransform(gMainD.zoom_node).k
    }
    this_top.getTrans = function () {
      return [
        d3.zoomTransform(gMainD.zoom_node).x,
        d3.zoomTransform(gMainD.zoom_node).y
      ]
    }
    this_top.getZoomS = function () {
      return this_top.getScale() < zoomD.len['1.0'] ? 0 : 1
    }

    return
  }
  initZoom()

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function initVor() {
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let vorFunc = d3
      .voronoi()
      .x(function (d) {
        return d.x
      })
      .y(function (d) {
        return d.y
      })
      .extent([[0, 0], [lenD.w, lenD.h]])


    // ------------------------------------------------------------------
    // create voronoi cells for the dataset. 
    // see: https://bl.ocks.org/mbostock/4060366
    // ------------------------------------------------------------------
    instruments.data.hover = function (d) {
      if (zoomD.target === d.data.id) return
      if (!locker.are_free(['zoom', 'autoZoomTarget'])) return

      let scale = this_top.getScale()
      if (scale >= zoomD.len['1.0']) return

      zoomD.target = d.data.id
      setState()
      return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    run_loop.init({
      tag: 'clickOnce'+my_unique_id, func: clickOnce, n_keep: 1,
    })

    instruments.data.click = function (opt_in) {
      if (locker.are_free(['zoom', 'autoZoomTarget'])) {
        run_loop.push({ tag: 'clickOnce'+my_unique_id, data: opt_in })
      }
      return
    }

    function clickOnce (d) {
      if (!locker.is_free('vorZoomClick')) {
        setTimeout(function () {
          instruments.data.click(d)
        }, times.wait_loop / 2)
        return
      }
      locker.add({ id: 'vorZoomClick', override: true })

      let scale = this_top.getScale()
      // console.log((scale >= zoomD.len["1.0"]),(zoomD.target == d.data.id))

      if (scale < zoomD.len['1.0']) {
        instruments.data.dblclick({ d: d, isInOut: dblclickZoomInOut })
      } else if (scale >= zoomD.len['1.0'] && zoomD.target !== d.data.id) {
        instruments.data.dblclick({ d: d, isInOut: false })
      } else {
        zoomD.target = d.data.id
        setState()
      }

      locker.remove({ id: 'vorZoomClick', delay: times.anim_arc })

      return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    run_loop.init({
      tag: 'dblclickOnce'+my_unique_id, func: dblclickOnce, n_keep: 1,
    })

    instruments.data.dblclick = function (opt_in) {
      // console.log( opt_in.source);
      if (locker.are_free(['zoom', 'autoZoomTarget'])) {
        run_loop.push({ tag: 'dblclickOnce'+my_unique_id, data: opt_in })
      }
      return
    }

    function dblclickOnce (opt_in) {
      if (!locker.is_free('vorZoomDblclick')) {
        setTimeout(function () {
          instruments.data.dblclick(opt_in)
        }, times.wait_loop / 2)
        return
      }
      locker.add({ id: 'vorZoomDblclick', override: true })

      let d = opt_in.d
      let zoomInOut = opt_in.isInOut
      let scale = this_top.getScale()
      let isOnTarget = zoomD.target === d.data.id
      // console.log('vorClick',d.data.id,(scale >= zoomD.len["1.0"]),!isOnTarget)

      zoomD.target = d.data.id

      let scaleToZoom = 1
      if (zoomInOut) {
        if (scale < zoomD.len['1.2']) scaleToZoom = zoomD.len['1.2'] + 0.001
        else scaleToZoom = zoomD.len['0.0']
      } else {
        if (scale < zoomD.len['0.2'] * 0.999) scaleToZoom = zoomD.len['0.2']
        else if (scale < zoomD.len['1.0'] * 1.001) scaleToZoom = zoomD.len['1.1']
        else scaleToZoom = zoomD.len['1.2']
      }

      this_top.zoomToTrgMain({
        target: zoomD.target,
        scale: scaleToZoom,
        duration_scale: 1.25
      })

      if (scale >= zoomD.len['1.0'] && !isOnTarget) {
        setState()

        ask_dataS1()
        propsS1({ tel_Id: zoomD.target, clickIn: false, propIn: '' })
      }

      locker.remove({ id: 'vorZoomDblclick', delay: times.anim_arc })
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function setVor () {
      let tagVor = 'vor'
      let vorShowLines = false

      let polygons = vorFunc.polygons(instruments.data.vor.data)
      let vor = com.vor.g
        .selectAll('path.' + tagVor)
        .data(polygons, function (d) {
          return d.data.id
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
        .style('stroke-width', '1')
        .style('opacity', vorShowLines ? 1 : 0)
        .style('stroke', '#4F94CD')
        .on('mouseover', instruments.data.hover)
        .on('click', instruments.data.click)
        .on('dblclick', function (d) {
          instruments.data.dblclick({ d: d, isInOut: dblclickZoomInOut })
        })
        // .on("mouseover", function(d) { console.log(d.data.id);  }) // debugging
        .merge(vor)
        .call(function (d) {
          d.attr('d', vor_ploy_func)
        })

      vor.exit().remove()

      // ------------------------------------------------------------------
      // calculation of coordinates for labels, added next
      // ------------------------------------------------------------------
      $.each(instruments.data.vor.data, function (index_, data_now) {
        $.each(instruments.props[data_now.id], function (index, porpNow) {
          let angle = (index + 0.5) * instruments.tauFracs[data_now.id] + tau / 4
          let labelX = data_now.r * Math.cos(angle)
          let labelY = data_now.r * Math.sin(angle)

          if (s1LblXY[porpNow] === undefined) {
            s1LblXY[porpNow] = {}
          }
          s1LblXY[porpNow][data_now.id] = [labelX, labelY]
        })
      })

      return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_layoutPhysical (data_in) {
      if (is_def(data_in)) {
        setTelDataPhysical(data_in)
      }

      if (instruments.data.layout !== 'physical') return

      instruments.data.xyr = instruments.data.xyrPhysical
      instruments.data.vor.data = instruments.data.vor.dataPhysical
      links2V.xyz = links2V.physical

      setVor()
      this_top._sub_arr_grp_circ([])

      if (locker.is_free('inInit')) {
        if (is_def(focusD.target)) {
          if (is_def(instruments.data.xyr[focusD.target])) {
            this_top.zoomToTrgMain({
              target: focusD.target,
              scale: focusD.scale,
              duration_scale: 1
            })
          }
        }
        // thisarr_zoomer.setState();
      }

      return
    }
    this_top.set_layoutPhysical = set_layoutPhysical

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setTelDataPhysical (data_in) {
      // console.log("dataphyzoom", data_in);
      instruments.data.xyrPhysical = {}
      instruments.data.vor.dataPhysical = []

      // ------------------------------------------------------------------
      // get the width of the initial data (should be most inclusive)
      // ------------------------------------------------------------------
      let keys = Object.keys(data_in)
      let minDataX = data_in[keys[0]].x
      let maxDataX = data_in[keys[0]].x
      let minDataY = data_in[keys[0]].y
      let maxDataY = data_in[keys[0]].y

      $.each(data_in, function (id, data_now) {
        minDataX = Math.min(minDataX, data_now.x)
        maxDataX = Math.max(maxDataX, data_now.x)
        minDataY = Math.min(minDataY, data_now.y)
        maxDataY = Math.max(maxDataY, data_now.y)
      })

      let data_inWH = [maxDataX - minDataX, maxDataY - minDataY]
      if (!is_south) {
        data_inWH[0] *= 1.1
        data_inWH[1] *= 1.1
      }

      // ------------------------------------------------------------------
      // 
      // ------------------------------------------------------------------
      let xyCat = {}
      let dataCat = Object.entries(data_in).filter(function(d) {
        return isCategoricalId(d[0])
      })

      $.each(dataCat, function(i, d) {
        let id = d[0]
        // let data_now = d[1]
        xyCat[id] = this_top.cat_ele_pos(i, dataCat.length)
      })

      $.each(data_in, function (id, data_now) {
        let x, y, r
        if(is_def(xyCat[id])) {
          x = xyCat[id].x
          y = xyCat[id].y
          r = xyCat[id].r
        }
        else {
          if (data_now.t === 'LST') r = teleR.s00[2]
          else if (data_now.t === 'MST') r = teleR.s00[1]
          else r = teleR.s00[0]

          let shiftMainX = lenD.w * (1 - lenD.fracCircWH)
          let shiftMainY = lenD.h * (1 - lenD.fracCircWH) / 2
          // let shiftMainY = 0
          
          let lenW = lenD.w * lenD.fracCircWH
          let lenH = lenD.h * lenD.fracCircWH
          x = shiftMainX + (1 * data_now.x * lenW
                  / (1.2 * data_inWH[0]) + lenW / 2)
          y = shiftMainY + (-1 * data_now.y * lenH
                  / (1.2 * data_inWH[1]) + lenH / 2)

        }

        // translate to the center of the respective hex-cell
        // let xy = com.svgBck.trans([x,y]);  x = xy[0]; y = xy[1];
        instruments.data.xyrPhysical[id] = { 
          x: x, y: y, r: r, //isTel: true 
        }
        instruments.data.vor.dataPhysical.push({ 
          id: id, x: x, y: y, r: r 
        })
        // console.log(id, instruments.data.xyrPhysical[id], eleBase.tel_types[id], isCategoricalId(id))
      })


      // ------------------------------------------------------------------
      // use delaunay links to get the closest neighbours of each data-point
      // see: http://christophermanning.org/projects/voronoi-diagram-with-force-directed-nodes-and-delaunay-links/
      // ------------------------------------------------------------------
      let linksV = {}
      $.each(vorFunc.links(instruments.data.vor.dataPhysical), function (
        index,
        linkNow
      ) {
        let idS = linkNow.source.id
        let idT = linkNow.target.id

        if (!linksV[idS]) linksV[idS] = [idT]
        else linksV[idS].push(idT)
        if (!linksV[idT]) linksV[idT] = [idS]
        else linksV[idT].push(idS)
      })

      links2V.physical = deep_copy(linksV) // deep copy
      $.each(linksV, function (idS, linkNow0) {
        $.each(linkNow0, function (index0, idT0) {
          $.each(linksV[idT0], function (index1, idT1) {
            if (links2V.physical[idS].indexOf(idT1) === -1) {
              links2V.physical[idS].push(idT1)
            }
            // console.log(index1,links2V.physical[idS],idT0,idT1)
          })
        })
      })

      instruments.data.mini = instruments.data.xyrPhysical
      instruments.data.lens = instruments.data.xyrPhysical

      return
    }


    // // ------------------------------------------------------------------
    // // 
    // // ------------------------------------------------------------------
    // function set_layoutSubArr (data_in) {
    //   if (is_def(data_in)) {
    //     setTelDataSubArr(data_in)
    //   }

    //   if (instruments.data.layout !== 'subArr') return
      
    //   instruments.data.xyr = instruments.data.xyrSubArr
    //   instruments.data.vor.data = instruments.data.vor.dataSubArr
    //   links2V.xyz = links2V.subArr

    //   setVor()

    //   this_top._sub_arr_grp_circ(instruments.data.xyr_sub_arr_grp)

    //   if (locker.is_free('inInit')) {
    //     if (is_def(focusD.target)) {
    //       if (is_def(instruments.data.xyr[focusD.target])) {
    //         // console.log('222222222222');
    //         if (Math.abs(this_top.getScale() - zoomD.len['0.0']) > 0.00001) {
    //           let trans = this_top.getTrans()
    //           if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
    //             this_top.zoomToTrgMain({
    //               target: focusD.target,
    //               scale: focusD.scale,
    //               duration_scale: 1
    //             })
    //           }
    //         }
    //       }
    //     }
    //   }

    //   return
    // }
    // this_top.set_layoutSubArr = set_layoutSubArr

    // // ------------------------------------------------------------------
    // //
    // // ------------------------------------------------------------------
    // function setTelDataSubArr (data_in) {
    //   instruments.data.xyrSubArr = {}
    //   instruments.data.vor.dataSubArr = []
    //   instruments.data.xyr_sub_arr_grp = []
    //   let hirchScale = 0.9
    //   let hirch = d3.hierarchy(data_in).sum(function (d) {
    //     return 1
    //   })
    //   let packNode = d3
    //     .pack()
    //     .size([lenD.w * hirchScale, lenD.h * hirchScale])
    //     .padding(10)
    //   packNode(hirch)

    //   $.each(hirch.descendants(), function (index, data_now) {
    //     let isTel = data_now.height === 0
    //     if (data_now.height < 2) {
    //       let id = data_now.data.id
    //       // if(!isTel) {
    //       //   if(id == -1) id = tel_info.no_subArr_name();
    //       //   else         id = tel_info.subArr_prefix()+id;
    //       //   console.log('-------',id);
    //       // }

    //       let x = data_now.x + lenD.w * (1 - hirchScale) / 2
    //       let y = data_now.y + lenD.h * (1 - hirchScale) / 2

    //       let eleR = data_now.r
    //       if (isTel) {
    //         if (data_now.t === 'LST') eleR = teleR.s00[2]
    //         else if (data_now.t === 'MST') eleR = teleR.s00[1]
    //         else eleR = teleR.s00[0]
    //       }

    //       instruments.data.xyrSubArr[id] = { 
    //         x: x, y: y, r: eleR, // isTel: isTel,
    //       }

    //       if (isTel) {
    //         instruments.data.vor.dataSubArr.push({ 
    //           id: id, x: x, y: y, r: eleR,
    //         })
    //       } else {
    //         let title = is_def(data_now.data.N)
    //           ? data_now.data.N
    //           : tel_info.no_subArr_title()
    //         instruments.data.xyr_sub_arr_grp.push({
    //           id: id,
    //           N: title,
    //           x: x,
    //           y: y,
    //           r: eleR
    //         })
    //       }
    //     } else if (data_now.height === 1) {
    //       console.log(index, data_now)
    //     }
    //   })

    //   links2V.subArr = {}
    //   $.each(hirch.descendants(), function (index0, data_now0) {
    //     if (data_now0.height === 1) {
    //       $.each(data_now0.children, function (index1, data_now1) {
    //         if (data_now1.height === 0) {
    //           let allIds = data_now0.children.map(function (d) {
    //             return d.data.id
    //           })
    //           links2V.subArr[data_now1.data.id] = []
    //           $.each(allIds, function (index2, data_now2) {
    //             if (data_now2 !== data_now1.data.id) {
    //               links2V.subArr[data_now1.data.id].push(data_now2)
    //             }
    //           })
    //         }
    //       })
    //     }
    //   })

    //   return
    // }

    return
  }

  // ------------------------------------------------------------------
  // see: http://bl.ocks.org/mbostock/5100636
  // ------------------------------------------------------------------
  com.arcTween = function (transition, opt_in) {
    // if(opt_in.skip != undefined && opt_in.skip) return null;
    transition.attrTween('d', function (d) {
      if (is_def(opt_in.incIdV)) {
        if (opt_in.incIdV.indexOf(d.id) === -1) return null
      }
      if (is_def(opt_in.excIdV)) {
        if (opt_in.excIdV.indexOf(d.id) >= 0) return null
      }

      let tag_now = opt_in.tag_now
      let ang_str_0 = opt_in.ang_str_0
        ? arcFunc[tag_now][opt_in.ang_str_0](d)
        : opt_in.arc_prev[tag_now].ang[d.id][0]
      let ang_str_1 = opt_in.ang_str_1
        ? arcFunc[tag_now][opt_in.ang_str_1](d)
        : opt_in.arc_prev[tag_now].ang[d.id][0]
      let ang_end_0 = opt_in.ang_end_0
        ? arcFunc[tag_now][opt_in.ang_end_0](d)
        : opt_in.arc_prev[tag_now].ang[d.id][1]
      let ang_end_1 = opt_in.ang_end_1
        ? arcFunc[tag_now][opt_in.ang_end_1](d)
        : opt_in.arc_prev[tag_now].ang[d.id][1]
      let r_in_0 = opt_in.r_in_0
        ? arcFunc[tag_now][opt_in.r_in_0](d)
        : opt_in.arc_prev[tag_now].rad[d.id][0]
      let r_in_1 = opt_in.r_in_1
        ? arcFunc[tag_now][opt_in.r_in_1](d)
        : opt_in.arc_prev[tag_now].rad[d.id][0]
      let r_out_0 = opt_in.r_out_0
        ? arcFunc[tag_now][opt_in.r_out_0](d)
        : opt_in.arc_prev[tag_now].rad[d.id][1]
      let r_out_1 = opt_in.r_out_1
        ? arcFunc[tag_now][opt_in.r_out_1](d)
        : opt_in.arc_prev[tag_now].rad[d.id][1]
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

        opt_in.arc_prev[tag_now].ang[d.id][0] = d.startAngle
        opt_in.arc_prev[tag_now].ang[d.id][1] = d.endAngle
        opt_in.arc_prev[tag_now].rad[d.id][0] = d.innerRadius
        opt_in.arc_prev[tag_now].rad[d.id][1] = d.outerRadius

        return arc(d)
      }
    })
  }

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function svgZoomUpdState () {
    let scale = this_top.getScale()
    let zoomS = this_top.getZoomS()

    let change01 = isStateChange(scale, '0.1')
    let change10 = isStateChange(scale, '1.0')

    if (zoomS === 0) syncD.zoom_target = ''

    if (change01 || change10) {
      setState()

      // update the opacity of the background grid
      if (change10) {
        bck_pattern({
          com: com,
          g_now: gMainD.gBase,
          g_tag: 'hex',
          len_wh: [lenD.w, lenD.h],
          opac: this_top.getScale() < zoomD.len['1.0'] ? 0.15 : 0.07,
          hex_r: 18
        })
      }
      if (isStateUp(scale, '1.0')) ask_dataS1()

      zoomD.len.prev = scale
    }
  }


  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function set_tel_layout (opt_in) {
    if (
      !locker.are_free([
        'setStateLock',
        'dataChange',
        'zoom',
        'autoZoomTarget',
        's1propsChange'
      ])
    ) {
      setTimeout(function () {
        set_tel_layout(opt_in)
      }, times.anim_arc / 2)
      return
    }

    let id = opt_in.id
    let updtId = opt_in.updtId
    let data = opt_in.data

    // check if we are about to change the id
    let isChange = instruments.data.layout !== id

    if (isChange || is_def(data)) {
      locker.expires({ id: 'setStateLock', duration: times.anim_arc / 2 })
    }

    if (id === 'physical') {
      if (updtId) instruments.data.layout = id
      this_top.set_layoutPhysical(data)
    } 
    // else if (id === 'subArr') {
    //   if (updtId) instruments.data.layout = id
    //   this_top.set_layoutSubArr(data)
    // } 
    else {
      console.error(' - trying to set undefined layout', id)
      return
    }

    if ((updtId && isChange) || is_def(data)) {
      setState()

      if (this_top.getZoomS() === 1) {
        $.each(s10V, function (index, ele_now) {
          ele_now.s10.updatePosG(times.anim_arc)
        })
      }
    }
  }
  this_top.set_tel_layout = set_tel_layout

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function _sub_arr_grp_circ (dataV) {
    if (noRender) return

    if (!locker.is_free('inInit')) {
      setTimeout(function () {
        _sub_arr_grp_circ(dataV)
      }, times.wait_loop)
      return
    }

    let tag_now = 'sub_arr_grp'
    let fontSize = 23 * siteScale

    // operate on new elements only
    let circ = com.s00.g
      .selectAll('circle.' + tag_now)
      .data(dataV, function (d) {
        return d.id
      })

    circ
      .enter()
      .append('circle')
      .attr('class', tag_now)
      .attr('r', 0)
      .style('stroke-width', 1)
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .style('fill', function (d) {
        return '#383b42'
      })
      .style('stroke', function (d) {
        return '#383b42'
      })
      .style('fill-opacity', 0.02)
      .style('stroke-opacity', 0.3)
      .attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .merge(circ)
      .transition('inOut')
      .duration(times.anim_arc)
      .attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .attr('r', function (d) {
        return d.r
      })

    circ
      .exit()
      .transition('inOut')
      .duration(times.anim_arc)
      .attr('r', 0)
      .remove()

    let text = com.s00.g
      .selectAll('text.' + tag_now)
      .data(dataV, function (d) {
        return d.id
      })

    text
      .enter()
      .append('text')
      .text(function (d) {
        return d.N
      })
      .attr('class', tag_now)
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .style('fill', '#383b42')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('transform', txtTrans)
      .style('fill-opacity', 0.4)
      .style('stroke-width', 0.7)
      .attr('text-anchor', 'middle')
      .style('stroke', '#383b42')
      .attr('font-size', fontSize + 'px')
      // .attr("dy", (fontSize/3)+'px' )
      .attr('dy', '0px')
      .merge(text)
      .transition('in')
      .duration(times.anim_arc)
      .attr('transform', txtTrans)
      .style('opacity', 1)

    text
      .exit()
      .transition('out')
      .duration(times.anim_arc)
      .style('opacity', 0)
      .remove()

    function txtTrans (d) {
      return 'translate(' + d.x + ',' + (d.y - d.r) + ')'
    }
  }
  this_top._sub_arr_grp_circ = _sub_arr_grp_circ

  // ------------------------------------------------------------------
  // add a lable with the
  // ------------------------------------------------------------------
  function s00title (focusV0, focusV1) {
    if (noRender) return
    
    let focus_idV = [
      focusV0.map(function (d) {
        return d.id
      }),
      focusV1.map(function (d) {
        return d.id
      })
    ]
    function isFocused (d, nFocus) {
      return focus_idV[nFocus].indexOf(d.id) >= 0
    }

    let tagLbl = 'lbls00title'
    // let tagState = 'state_00'
    // let tag_txt = tagState + tagLbl
    let fontSize0 = 11 * siteScale

    function fontSize (d) {
      if (isFocused(d, 1)) return fontSize0 * 0.5
      else if (isFocused(d, 0)) return fontSize0 * 0.6
      else return fontSize0 * 1.0
    }

    if (!is_def(com[tagLbl])) {
      com[tagLbl] = {}
      com[tagLbl].g = gMainD.gBase.append('g')
    }

    let text = com[tagLbl].g
      .selectAll('text.' + tagLbl)
      .data(instruments.data.tel, function (d) {
        return d.id
      })

    text
      .enter()
      .append('text')
      .text(function (d) {
        return tel_info.get_title(d.id)
      })
      .attr('class', tagLbl)
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .style('fill', '#383b42')
      .style('stroke-width', '0.3')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .style('stroke', '#383b42')
      .style('font-size', function (d) {
        return fontSize(d) + 'px'
      })
      .attr('dy', function (d) {
        return fontSize(d) / 3 + 'px'
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
        if (isFocused(d, 1)) {
          shiftVal = instruments.data.xyr[d.id].r * (rScale[1].health1 + 0.5)
        }
        return (
          'translate(' +
          instruments.data.xyr[d.id].x +
          ',' +
          (instruments.data.xyr[d.id].y - shiftVal) +
          ')'
        )
      })
      .style('font-size', function (d) {
        return fontSize(d) + 'px'
      })
      .attr('dy', function (d) {
        return fontSize(d) / 3 + 'px'
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
  // innner arcs for the different properties
  // ------------------------------------------------------------------
  function s01inner (dataV, focusV) {
    if (noRender) return

    let tagState = 'state01'

    if (!is_def(com.s01.inner)) {
      com.s01.inner = true

      // let telProps = Object.keys(instruments.props)
      $.each(instruments.allIds, function (n_ele, key) {
        // $.each(instruments.props, function (key, telProps) {
        $.each(instruments.props[key], function (index, porpNow) {
          // console.log('+', key, index, porpNow)
          $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
            // let tag_now = porpNow + nArcDrawNow
            let tag_now = key + porpNow + nArcDrawNow
            let is0 = nArcDrawNow === 0

            arcFunc[tag_now] = {}
            arcFunc[tag_now].rad00 = function (d) {
              return instruments.data.xyr[d.id].r * (is0 ? 0.85 : 0.81)
            }
            arcFunc[tag_now].rad01 = function (d) {
              return instruments.data.xyr[d.id].r * (is0 ? 0.95 : 0.99)
            }
            arcFunc[tag_now].rad10 = function (d) {
              return (
                instruments.data.xyr[d.id].r * rScale[1].innerH0 * (is0 ? 1 : 0.97)
              )
            }
            arcFunc[tag_now].rad11 = function (d) {
              return (
                instruments.data.xyr[d.id].r * rScale[1].innerH1 * (is0 ? 1 : 1.03)
              )
            }
            arcFunc[tag_now].ang00 = function (d) {
              return index * instruments.tauFracs[key] + instruments.tauSpace
            }
            arcFunc[tag_now].ang01 = function (d) {
              return (
                index * instruments.tauFracs[key] +
                instruments.tauSpace +
                (instruments.tauFracs[key] - instruments.tauSpace * 2) *
                  (is0 ? 1 : inst_health_frac(d[porpNow]))
              )
            }
          })
        })
      })
    }

    // ------------------------------------------------------------------
    // innner arcs for the different properties
    // ------------------------------------------------------------------
    let focus_idV = []
    if (focusV !== undefined && focusV != null) {
      $.each(focusV, function (index, data_now) {
        focus_idV.push(data_now.id)
      })
    }
    // let tel_Id = dataV.id
    // let tel_Id = zoomD.target
    // DDFF

    $.each(instruments.allIds, function (n_ele, tel_Id) {
      $.each(instruments.props[tel_Id], function (index, porpNow) {
        $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
          let tag_now = tel_Id + porpNow + nArcDrawNow
          let is0 = nArcDrawNow === 0

          if (!is_def(arc_prev[tag_now])) {
            arc_prev[tag_now] = {}
            arc_prev[tag_now].ang = {}
            arc_prev[tag_now].rad = {}
          }

          let dataVnow = dataV
          if (dataV.length > 0) {
            if (dataV[0].id != tel_Id) {
              dataVnow = []
            }
          }

          let path = com.s01.g
            .selectAll('path.' + tag_now)
            .data(dataVnow, function (d, i) {
              return d.id
            })

          // operate on new elements only
          path
            .enter()
            .append('path')
            .style('stroke-width', '0.05')
            .style('pointer-events', 'none')
            .attr('vector-effect', 'non-scaling-stroke')
            .attr('id', function (d) {
              return my_unique_id + d.id + tag_now
            })
            .attr('class', tagState + ' ' + tag_now)
            // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
            .style('opacity', function (d) {
              return is0 ? '0.5' : '1'
            })
            .attr('transform', function (d) {
              return (
                'translate(' +
                instruments.data.xyr[d.id].x +
                ',' +
                instruments.data.xyr[d.id].y +
                ')'
              )
            })
            .each(function (d, i) {
              // console.log(i,d,tag_now)
              arc_prev[tag_now].ang[d.id] = [
                arcFunc[tag_now].ang00(d),
                arcFunc[tag_now].ang00(d)
              ]
              arc_prev[tag_now].rad[d.id] = [
                arcFunc[tag_now].rad00(d),
                arcFunc[tag_now].rad01(d)
              ]
            })
            .merge(path)
            .transition('in')
            .duration(times.anim_arc) // .delay(times.anim_arc)
            .attr('transform', function (d) {
              return (
                'translate(' +
                instruments.data.xyr[d.id].x +
                ',' +
                instruments.data.xyr[d.id].y +
                ')'
              )
            })
            .style('stroke', function (d) {
              return is0 ? null : inst_health_col(d[porpNow])
            })
            .style('fill', function (d) {
              return inst_health_col(d[porpNow])
            }) // return is0 ? "#383b42" : inst_health_col(d[porpNow]); })
            .call(com.arcTween, {
              tag_now: tag_now,
              arc_prev: arc_prev,
              ang_str_0: null,
              ang_str_1: null,
              ang_end_0: null,
              ang_end_1: 'ang01',
              r_in_0: null,
              r_in_1: null,
              r_out_0: null,
              r_out_1: null
            })
            // ang_str_0:"ang00", ang_str_1:"ang00", ang_end_0:"ang00", ang_end_1:"ang01",
            // r_in_0:"rad00", r_in_1:"rad00", r_out_0:"rad01", r_out_1:"rad01"
            .transition('update')
            .duration(times.anim_arc)
            .call(com.arcTween, {
              tag_now: tag_now,
              arc_prev: arc_prev,
              incIdV: focus_idV,
              ang_str_0: null,
              ang_str_1: null,
              ang_end_0: null,
              ang_end_1: null,
              r_in_0: null,
              r_in_1: 'rad10',
              r_out_0: null,
              r_out_1: 'rad11'
            })
            .transition('update')
            .duration(times.anim_arc)
            .call(com.arcTween, {
              tag_now: tag_now,
              arc_prev: arc_prev,
              excIdV: focus_idV,
              ang_str_0: null,
              ang_str_1: null,
              ang_end_0: null,
              ang_end_1: null,
              r_in_0: null,
              r_in_1: 'rad00',
              r_out_0: null,
              r_out_1: 'rad01'
            })

          // operate on exiting elements only
          path
            .exit()
            .transition('out')
            // .each(function (d, i) {console.log('qquq', i, d); })
            .duration(times.anim_arc)
            .call(com.arcTween, {
              tag_now: tag_now,
              arc_prev: arc_prev,
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
    })

    focus_idV = null
  
    return
  }

  
  // ------------------------------------------------------------------
  // outer rings for the instruments.prop0 (equivalent of s00_D metric in s01_D)
  // ------------------------------------------------------------------
  function s01outer (dataV, focusV) {
    if (noRender) return

    let tagState = 'state01'
    let porpNow = instruments.prop0

    if (!is_def(com.s01.outer)) {
      com.s01.outer = true

      $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
        let tag_now = porpNow + nArcDrawNow
        let is0 = nArcDrawNow === 0

        arcFunc[tag_now] = {}
        arcFunc[tag_now].rad00 = function (d) {
          return instruments.data.xyr[d.id].r * rScale[0].health0 * (is0 ? 1 : 0.95)
        }
        arcFunc[tag_now].rad01 = function (d) {
          return instruments.data.xyr[d.id].r * rScale[0].health1 * (is0 ? 1 : 1.05)
        }
        arcFunc[tag_now].rad10 = function (d) {
          return instruments.data.xyr[d.id].r * rScale[1].health0 * (is0 ? 1 : 0.98)
        }
        arcFunc[tag_now].rad11 = function (d) {
          return instruments.data.xyr[d.id].r * rScale[1].health1 * (is0 ? 1 : 1.02)
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
    // innner arcs for the different properties
    // ------------------------------------------------------------------
    let focus_idV = []
    if (focusV !== undefined && focusV != null) {
      $.each(focusV, function (index, data_now) {
        focus_idV.push(data_now.id)
      })
    }

    $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
      let tag_now = porpNow + nArcDrawNow
      let is0 = nArcDrawNow === 0

      if (!is_def(arc_prev[tag_now])) {
        arc_prev[tag_now] = {}
        arc_prev[tag_now].ang = {}
        arc_prev[tag_now].rad = {}
      }

      let path = com.s01.g
        .selectAll('path.' + tag_now)
        .data(dataV, function (d) {
          return d.id
        })

      // operate on new elements only
      path
        .enter()
        .append('path')
        .style('stroke-width', 0.05)
        .style('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('id', function (d) {
          return my_unique_id + d.id + tag_now
        })
        .attr('class', tagState + ' ' + tag_now)
        // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
        .style('opacity', function (d) {
          return is0 ? '0.5' : '1'
        })
        .attr('transform', function (d) {
          return (
            'translate(' +
            instruments.data.xyr[d.id].x +
            ',' +
            instruments.data.xyr[d.id].y +
            ')'
          )
        })
        .each(function (d, i) {
          arc_prev[tag_now].ang[d.id] = [
            arcFunc[tag_now].ang00(d),
            arcFunc[tag_now].ang00(d)
          ]
          arc_prev[tag_now].rad[d.id] = [
            arcFunc[tag_now].rad00(d),
            arcFunc[tag_now].rad01(d)
          ]
        })
        .merge(path)
        .transition('in')
        .duration(times.anim_arc) // .delay(times.anim_arc)
        .attr('transform', function (d) {
          return (
            'translate(' +
            instruments.data.xyr[d.id].x +
            ',' +
            instruments.data.xyr[d.id].y +
            ')'
          )
        })
        .style('stroke', function (d) {
          return is0 ? null : inst_health_col(d[porpNow])
        })
        .style('fill', function (d) {
          return inst_health_col(d[porpNow])
        }) // return is0 ? "#383b42" : inst_health_col(d[porpNow]); })
        .call(com.arcTween, {
          tag_now: tag_now,
          arc_prev: arc_prev,
          ang_str_0: null,
          ang_str_1: null,
          ang_end_0: null,
          ang_end_1: 'ang01',
          r_in_0: null,
          r_in_1: null,
          r_out_0: null,
          r_out_1: null
        })
        // ang_str_0:"ang00", ang_str_1:"ang00", ang_end_0:"ang00", ang_end_1:"ang01",
        // r_in_0:"rad00", r_in_1:"rad00", r_out_0:"rad01", r_out_1:"rad01"
        .transition('update')
        .duration(times.anim_arc)
        .call(com.arcTween, {
          tag_now: tag_now,
          arc_prev: arc_prev,
          incIdV: focus_idV,
          ang_str_0: null,
          ang_str_1: null,
          ang_end_0: null,
          ang_end_1: null,
          r_in_0: null,
          r_in_1: 'rad10',
          r_out_0: null,
          r_out_1: 'rad11'
        })
        .transition('update')
        .duration(times.anim_arc)
        .call(com.arcTween, {
          tag_now: tag_now,
          arc_prev: arc_prev,
          excIdV: focus_idV,
          ang_str_0: null,
          ang_str_1: null,
          ang_end_0: null,
          ang_end_1: null,
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

    focus_idV = null
  
    return
  }

  // function hasS10main(target_id) {
  //   let hasId = false;
  //   $.each(s10V, function(index,ele_now) {
  //     if(ele_now.id == zoomD.target) hasId = true;
  //   })
  //   return hasId;
  // }
  // this_top.hasS10main = hasS10main;

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function s10main (data_in) {
    // console.log('s10main',zoomD.target,data_in);

    let max_ele_keep = 1
    let childV = is_def(data_in) ? data_in.data : null

    if (childV) {
      let tel_Id = data_in.id

      $.each(instruments.props[tel_Id], function (index, porpNow) {
        instruments.data.propDataS1[tel_Id] = {}
        instruments.data.propDataS1[tel_Id][porpNow] = null
        instruments.data.propParentS1[tel_Id] = {}
        instruments.data.propParentS1[tel_Id][porpNow] = ''
        instruments.data.propTitleS1[tel_Id] = {}
        instruments.data.propTitleS1[tel_Id][porpNow] = ''
      })

      // construct the dataBase object b hand, as
      // some properties may not be included in instruments.props[tel_Id]
      instruments.data.dataBaseS1[tel_Id] = {}
      instruments.data.dataBaseS1[tel_Id].id = instruments.prop0
      instruments.data.dataBaseS1[tel_Id].val = data_in[instruments.prop0]
      instruments.data.dataBaseS1[tel_Id].children = []
      // console.log('qqqqqqqq',tel_Id,data_in.data.val,data_in.data)

      $.each(childV, function (indexData, childNow) {
        let porpNow = childNow.id
        if (instruments.props[tel_Id].indexOf(porpNow) >= 0) {
          // add a reference to each property
          instruments.data.propDataS1[tel_Id][porpNow] = childNow
          instruments.data.propParentS1[tel_Id][porpNow] = porpNow

          // also add a reference for each level of the hierarchy which has a sub-hierarchy of its own
          addChildren(childNow, tel_Id, porpNow)

          // build up the baseData object
          instruments.data.dataBaseS1[tel_Id].children.push(childNow)
        }
      })
    }

    function addChildren (data_now, tel_Id, porpNow) {
      if (data_now.children) {
        data_now.children.forEach(function (d, i) {
          if (d.children) {
            instruments.data.propDataS1[tel_Id][d.id] = d
            addChildren(d, tel_Id, porpNow)
          }
          instruments.data.propParentS1[tel_Id][d.id] = porpNow
          instruments.data.propTitleS1[tel_Id][d.id] = d.title
        })
      }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    if (!childV) {
      $.each(s10V, function (index, ele_now) {
        // console.log('clean -',index,ele_now);
        let s10 = ele_now.s10

        s10.bckArcRemove() // console.log('clickBckArc s10 000')
      })
      return
    } else {
      $.each(s10V, function (index, ele_now) {
        let id = ele_now.id
        let s10 = ele_now.s10

        if (id !== zoomD.target) {
          // s10.clickBckArc(null);
          s10.bckArcRemove() // console.log('clickBckArc s10 111')
        }
      })
    }

    let s10 = null
    $.each(s10V, function (index, ele_now) {
      if (ele_now.id === zoomD.target) s10 = ele_now.s10
    })
    if (!s10) {
      // ------------------------------------------------------------------
      //
      // ------------------------------------------------------------------
      let S10obj = function (tel_Id) {
        let thisS10 = this
        thisS10.tel_Id = tel_Id
        thisS10.instruments = {}
        thisS10.instruments.props = instruments.props[tel_Id]
        thisS10.tauFrac = instruments.tauFracs[tel_Id]
        thisS10.instruments.propTitles = instruments.propTitles[tel_Id]

        let myDate = Date.now()
        let gBase = null
        let gBckArc = null
        let gHirch = null
        let gPropLbl = null
        let gTrans = null
        let arcs = null
        let depthClick = null
        let parentV = null
        let hirchDataV = null

        thisS10.hirchData = {}
        $.each(thisS10.instruments.props, function (index, porpNow) {
          thisS10.hirchData[porpNow] = null
        })

        thisS10.getDate = function () {
          return myDate
        }

        let wh = instruments.data.xyr[tel_Id].r * rScale[1].innerH1 * 1.6

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function init () {
          if (gBase) {
            myDate = Date.now()
          } else {
            gBase = gMainD.gBase.append('g')

            updatePosG(0)

            gBckArc = gBase.append('g')
            gPropLbl = gBase.append('g')
            // gBckArc.append("rect").attr("width",wh).attr("height",wh).style("stroke",'#2196F3' ).style("fill",'transparent' ).style("stroke-width", 0.1).attr("pointer-events",'none').attr("opacity",0.5);

            parentV = {}
            depthClick = {}

            arcs = {}
            arcs.arc = {}
            arcs.tween = {}
            arcs.isOpen = false
            arcs.inProp = ''

            gHirch = {}
            gTrans = {}
            hirchDataV = {}
            $.each(childV, function (indexData, dataBase) {
              let porpNow = dataBase.id

              if (thisS10.instruments.props.indexOf(porpNow) >= 0) {
                gTrans[porpNow] = {}
                gHirch[porpNow] = {}
                gHirch[porpNow].hirch = gBase.append('g')
                hirchDataV[porpNow] = {}
              }
            })

            // // expose the objects (must come after their initialization!)
            thisS10.gBase = gBase
            thisS10.arcs = arcs

            // initBckArc();
            initHirch()
          }

          // console.log('clickBckArc init')
          // initBckArc(); // called from bckArcClick on init anyway...
        }
        thisS10.init = init

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function updatePosG (duration) {
          let gBaseTrans = [
            instruments.data.xyr[tel_Id].x - wh / 2,
            instruments.data.xyr[tel_Id].y - wh / 2
          ]

          gBase
            .transition('updtPos')
            .duration(duration)
            .attr('transform', function (d) {
              return 'translate(' + gBaseTrans[0] + ',' + gBaseTrans[1] + ')'
            })
        }
        thisS10.updatePosG = updatePosG

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function cleanup () {
          gBase.remove()

          gBase = null
          gBckArc = null
          gHirch = null
          gPropLbl = null
          gTrans = null
          arcs = null
          depthClick = null
          parentV = null
          hirchDataV = null
        }
        thisS10.cleanup = cleanup

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function setPropLbl (opt_in) {
          if (noRender) return

          // due to delays from locker, this function could be called after the S10obj has
          // been removed - make a safety check using gBase...
          if (!is_def(gBase)) return

          let base_tag = 's10arc'
          let tagLbl = base_tag + '_propLbl'
          let propIn = is_def(opt_in.propIn) ? opt_in.propIn : ''
          let remove = is_def(opt_in.remove) ? opt_in.remove : false

          if (propIn !== '') {
            if (thisS10.instruments.props.indexOf(propIn) < 0) {
              if (is_def(instruments.data.propParentS1[tel_Id][propIn])) {
                propIn = instruments.data.propParentS1[tel_Id][propIn]
              }
            }
          }

          let textD = []
          if (this_top.getZoomS() === 1 && !remove) {
            $.each(thisS10.instruments.props, function (index, porpNow) {
              let state = 0
              if (propIn !== '') {
                state = propIn === porpNow ? 1 : 2
              }

              let txtR = instruments.data.xyr[tel_Id].r * rScale[1].innerH1 * 1.45
              let xy = getPropPosShift(
                'xy',
                txtR,
                index,
                thisS10.instruments.props.length
              )

              textD.push({
                id: tagLbl + porpNow,
                text: thisS10.instruments.propTitles[porpNow],
                h: 30 / zoomD.len['1.3'],
                xy: xy,
                x: wh / 2 - xy[0],
                y: wh / 2 - xy[1],
                strkW: state === 1 ? 3 : 0,
                opac: state === 1 ? 0.9 : state === 2 ? 0.1 : 0.7,
                anch:
                  Math.abs(xy[0] / instruments.data.xyr[tel_Id].r) < 0.001
                    ? 'middle'
                    : xy[0] < 0 ? 'start' : 'end'
              })
            })
          }

          let eleH = null

          let title = gPropLbl
            .selectAll('text.' + tagLbl)
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
            .attr('class', base_tag + ' ' + tagLbl) // class list for easy selection
            .style('opacity', '0')
            .style('fill', '#383b42')
            .attr('stroke-width', function (d) {
              return d.strkW
            })
            .style('stroke', function (d) {
              return '#383b42'
            })
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .style('font-weight', 'normal')
            .attr('transform', function (d) {
              return 'translate(' + d.x + ',' + d.y + ')'
            })
            .merge(title)
            .style('font-size', function (d) {
              return d.h + 'px'
            })
            .transition('update1')
            .duration(times.anim_arc)
            .attr('stroke-width', function (d) {
              return d.strkW
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
                  selction: gPropLbl.selectAll('text.' + tagLbl),
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
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function initBckArc () {
          if (noRender) return

          // due to delays from locker, this function could be called after the S10obj has
          // been removed - make a safety check using gBase...
          if (!is_def(gBase)) return

          // console.log('initBckArc')
          let propsNow = instruments.data.propDataS1[tel_Id]
          $.each(propsNow, function (porpNow, data_now) {
            if (data_now) {
              let base_tag = 's10arc'
              let tag_now = base_tag + porpNow
              // let is0 = 1

              let nProp = thisS10.instruments.props.indexOf(porpNow)
              if (nProp >= 0) {
                if (!is_def(arcs[tag_now])) {
                  arcs[tag_now] = {}
                  arcs[tag_now].ang = {}
                  arcs[tag_now].rad = {}

                  arcFunc[tag_now] = {}
                  arcFunc[tag_now].radN1 = function (d) {
                    return 0
                  }
                  arcFunc[tag_now].rad00 = function (d) {
                    return instruments.data.xyr[tel_Id].r * rScale[1].innerH1 * 0.1
                  }
                  arcFunc[tag_now].rad01 = function (d) {
                    return instruments.data.xyr[tel_Id].r * rScale[1].innerH1 * 0.8
                  }
                  arcFunc[tag_now].rad10 = function (d) {
                    return instruments.data.xyr[tel_Id].r * rScale[1].innerH1 * 0.85
                  }
                  arcFunc[tag_now].rad11 = function (d) {
                    return instruments.data.xyr[tel_Id].r * rScale[1].innerH1 * 1.35
                  }
                  arcFunc[tag_now].ang00 = function (d) {
                    return nProp * thisS10.tauFrac + instruments.tauSpace
                  }
                  arcFunc[tag_now].ang01 = function (d) {
                    return (nProp + 1) * thisS10.tauFrac - instruments.tauSpace
                  }
                  arcFunc[tag_now].ang10 = function (d) {
                    return 0
                  }
                  arcFunc[tag_now].ang11 = function (d) {
                    return tau
                  }
                  arcFunc[tag_now].ang20 = function (d) {
                    return nProp * thisS10.tauFrac
                  }
                  arcFunc[tag_now].ang21 = function (d) {
                    return (nProp + 1) * thisS10.tauFrac
                  }
                }

                let path = gBckArc.selectAll('path.' + tag_now).data([
                  {
                    id: tag_now + '0',
                    porpNow: porpNow,
                    nArc: 0,
                    isFull: false,
                    col: ''
                  },
                  {
                    id: tag_now + '1',
                    porpNow: porpNow,
                    nArc: 1,
                    isFull: false,
                    col: ''
                  }
                ])

                // operate on new elements only
                path
                  .enter()
                  .append('path')
                  .style('stroke-width', '1')
                  // .attr("id",        function(d) { return my_unique_id+d.id; })
                  .attr('class', function (d) {
                    return base_tag + ' ' + tag_now + ' ' + d.id
                  })
                  .each(function (d, i) {
                    arcs[tag_now].ang[d.id] = [
                      arcFunc[tag_now].ang00(d),
                      arcFunc[tag_now].ang01(d)
                    ]
                    arcs[tag_now].rad[d.id] = [
                      arcFunc[tag_now].rad00(d),
                      arcFunc[tag_now].rad00(d)
                    ]
                  })
                  .style('stroke', '#383b42')
                  .attr('vector-effect', 'non-scaling-stroke')
                  .attr('transform', function (d) {
                    return 'translate(' + wh / 2 + ',' + wh / 2 + ')'
                  })
                  .on('click', click)
                  // .on("mouseover", mouseover)
                  .style('fill', getCol)
                  .style('opacity', 0)
                  .style('fill-opacity', 0)
                  .merge(path)
                  .each(function (d) {
                    d.isFull = false
                  })
                  .transition('inOut')
                  .duration(times.anim_arc)
                  .delay(times.anim_arc)
                  .style('opacity', function (d) {
                    return d.nArc === 0 ? 1 : 0
                  })
                  .style('fill', getCol)
                  .style('fill-opacity', function (d) {
                    return d.nArc === 0 ? 0.5 : 0
                  })
                  .style('stroke-opacity', function (d) {
                    return d.nArc === 0 ? 0 : 0.3
                  })
                  .call(com.arcTween, {
                    tag_now: tag_now,
                    arc_prev: arcs,
                    ang_str_0: null,
                    ang_str_1: 'ang00',
                    ang_end_0: null,
                    ang_end_1: 'ang01',
                    r_in_0: null,
                    r_in_1: 'rad00',
                    r_out_0: null,
                    r_out_1: 'rad01'
                  })
              }
            }

            //
            function getCol (d) {
              d.col =
                d.nArc === 0
                  ? inst_health_col(instruments.data.propDataS1[tel_Id][d.porpNow].val)
                  : '#383b42'
              return d.col
            }

            //
            function click (d) {
              bckArcClick({
                clickIn: isClickIn(d.porpNow),
                propIn: d.porpNow
              })
            }
          })

          setPropLbl({ propIn: '' })
        }
        thisS10.initBckArc = initBckArc

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let prevFocusedProp = ''
        function isClickIn (propIn) {
          return prevFocusedProp !== propIn
        }
        
        function setPrevProp (propIn) {
          prevFocusedProp = propIn
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function bckArcRemove () {
          if (noRender) return

          // due to delays from locker, this function could 
          // be called after the S10obj has been removed
           // - make a safety check using gBase...
          if (!is_def(gBase)) return

          locker.add('s10bckArcChange')

          //
          hirchStyleClick({ propIn: '', id: '', isOpen: false })

          //
          $.each(thisS10.instruments.props, function (index, porpNow) {
            let base_tag = 's10arc'
            let tag_now = base_tag + porpNow
            let path = gBckArc.selectAll('path.' + tag_now)

            path
              .transition('inOut')
              .duration(times.anim_arc)
              .style('opacity', 0)
              .call(com.arcTween, {
                tag_now: tag_now,
                arc_prev: arcs,
                ang_str_0: null,
                ang_str_1: 'ang00',
                ang_end_0: null,
                ang_end_1: null,
                r_in_0: null,
                r_in_1: 'rad00',
                r_out_0: null,
                r_out_1: 'rad00'
              })
              .remove()
          })

          setPrevProp('')
          locker.remove('s10bckArcChange')

          setPropLbl({ propIn: '', remove: true })

          hirchHovTitleOut(null)
        }
        thisS10.bckArcRemove = bckArcRemove

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function bckArcClick (opt_in) {
          // due to delays from locker, this function could be 
          // called after the S10obj has been removed 
          // - make a safety check using gBase...
          if (!is_def(gBase)) return

          let clickIn = opt_in.clickIn
          let propIn = opt_in.propIn
          let onlyOpen = is_def(opt_in.onlyOpen) ? opt_in.onlyOpen : false
          let canIgnore = is_def(opt_in.canIgnore) ? opt_in.canIgnore : true

          if (thisS10.instruments.props.indexOf(propIn) < 0 && propIn != '') return

          if (
            !locker.are_free([
              's10bckArcChange',
              'dataChange',
              's10clickHirch'
            ])
          ) {
            if (!canIgnore) {
              setTimeout(function () {
                bckArcClick(opt_in)
              }, times.anim_arc / 3)
            }
            return
          }

          locker.add({ id: 's10bckArcChange', override: true })
          function freeMe (doDelay) {
            locker.remove({
              id: 's10bckArcChange',
              delay: doDelay ? times.anim_arc * 1.5 : 0,
              override: true
            })
          }

          setPropLbl({ propIn: propIn })

          setPrevProp(propIn)

          // ------------------------------------------------------------------
          //
          // ------------------------------------------------------------------
          $.each(thisS10.instruments.props, function (index, porpNow) {
            let base_tag = 's10arc'
            let tag_now = base_tag + porpNow
            let path0 = gBckArc.selectAll('path.' + tag_now + '0')
            let path1 = gBckArc.selectAll('path.' + tag_now + '1')

            if (propIn === porpNow) {
              fullArcs(path0, path1, tag_now, clickIn)
            } else {
              hideArcs(path0, tag_now)
              hideArcs(path1, tag_now)
            }
          })

          if (onlyOpen && clickIn) {
            freeMe(true)
            return
          }

          if (!clickIn && depthClick[propIn] > 0) {
            let parentName = ''
            $.each(hirchDataV[propIn], function (id_now, data_now) {
              if (data_now.childDepth === depthClick[propIn]) {
                parentName = data_now.parentName
              }
            })

            hirchStyleClick({ propIn: propIn, id: parentName, isOpen: true })
            
            propsS1({
              tel_Id: tel_Id,
              clickIn: true,
              propIn: parentName,
              doFunc: ['telHirch'],
              debug: 'bckArcClick'
            })

            freeMe(true)
            
            return
          } 
          else {
            // console.log('openCloseHirch',propIn,'--',depthClick[propIn],clickIn)

            hirchStyleClick({ propIn: propIn, id: propIn, isOpen: clickIn })

            propsS1({
              tel_Id: tel_Id,
              clickIn: clickIn,
              propIn: propIn,
              doFunc: ['telHirch'],
              debug: 'bckArcClick'
            })
          }

          if (!clickIn) {
            initBckArc()
            setPrevProp('')
            freeMe(true)
            return
          }

          //
          if (clickIn) {
            this_top.zoomToTrgMain({
              target: tel_Id,
              scale: zoomD.len['1.2'],
              duration_scale: 1
            })
          }

          freeMe(true)
        }
        thisS10.bckArcClick = bckArcClick

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function fullArcs (path0, path1, tag_now, isOpen) {
          if (noRender) return

          path0
            .transition('inOut')
            .duration(times.anim_arc)
            .style('opacity', 1)
            .style('fill', '#383b42')
            .style('fill-opacity', 0.06)
            // .style("fill-opacity", 0.2)
            .each(function (d) {
              d.isFull = true
            })
            .call(com.arcTween, {
              tag_now: tag_now,
              arc_prev: arcs,
              ang_str_0: null,
              ang_str_1: 'ang10',
              ang_end_0: null,
              ang_end_1: 'ang11',
              r_in_0: null,
              r_in_1: 'radN1',
              r_out_0: null,
              r_out_1: 'rad01'
            })

          path1
            .transition('inOut')
            .duration(times.anim_arc / 2)
            .call(com.arcTween, {
              tag_now: tag_now,
              arc_prev: arcs,
              ang_str_0: null,
              ang_str_1: null,
              ang_end_0: null,
              ang_end_1: null,
              r_in_0: null,
              r_in_1: 'rad10',
              r_out_0: null,
              r_out_1: 'rad11'
            })
            .style('fill-opacity', 0.07)
            .style('opacity', 1)
            .transition('inOut')
            .duration(times.anim_arc / 2)
            .call(com.arcTween, {
              tag_now: tag_now,
              arc_prev: arcs,
              ang_str_0: null,
              ang_str_1: 'ang20',
              ang_end_0: null,
              ang_end_1: 'ang21',
              r_in_0: null,
              r_in_1: null,
              r_out_0: null,
              r_out_1: null
            })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function hideArcs (path, tag_now) {
          if (noRender) return

          path
            .transition('inOut')
            .duration(times.anim_arc / 2)
            .style('opacity', 0)
            .call(com.arcTween, {
              tag_now: tag_now,
              arc_prev: arcs,
              ang_str_0: null,
              ang_str_1: null,
              ang_end_0: null,
              ang_end_1: null,
              r_in_0: null,
              r_in_1: 'radN1',
              r_out_0: null,
              r_out_1: 'radN1'
            })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function hirchHovTitleIn (dIn) {
          if (noRender) return

          if (
            !locker.are_free([
              's10bckArcChange',
              'dataChange',
              's10clickHirch'
            ])
          ) {
            return
          }

          hirchHovTitleOut(null)

          let r = teleR.s00[2] * rScale[1].innerH1 / 3.5
          let dx = wh / 2
          let dy = wh + 2 * r * instruments.data.xyr[tel_Id].r / teleR.s00[2]

          gBase
            .selectAll('text.' + 'hovTitle')
            .data([{ id: dIn.data.id }], function (d) {
              return d.id
            })
            .enter()
            .append('text')
            .attr('class', 'hovTitle')
            .text(dIn.data.title)
            .style('opacity', 0)
            .style('fill-opacity', 0.8)
            .style('fill', '#383b42')
            .style('stroke', d3.rgb('#383b42').brighter(0.25))
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .style('stroke-width', 2)
            .style('font-weight', 'bold')
            .attr('font-size', r + 'px')
            .attr('transform', function (d, i) {
              return 'translate(' + dx + ',' + dy + ')'
            })
            .attr('dy', function (d) {
              let eleH =
                -0.5 *
                get_node_height_by_id({
                  selction: gBase.selectAll('text.' + 'hovTitle'),
                  id: d.id
                })
              return eleH + 'px'
            })
            .transition('update1')
            .duration(times.anim_arc)
            .style('opacity', 1)
        }

        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        function hirchHovTitleOut (dIn) {
          if (noRender) return

          gBase
            .selectAll('text.' + 'hovTitle')
            .filter(function (d) {
              return is_def(dIn) ? d.id === dIn.data.id : true
            })
            .transition('update1')
            .duration(times.anim_arc)
            .style('opacity', '0')
            .remove()

          return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function initHirch () {
          if (noRender) return

          // due to delays from locker, this function could be 
          // called after the S10obj has been removed 
          // - make a safety check using gBase...
          if (!is_def(gBase)) return

          $.each(childV, function (indexData, dataBase) {
            let porpNow = dataBase.id

            let getChild = {}
            let hirchV = {}
            let max_depth = 0

            function getAllChildren (d) {
              return d['child' + String(d.childDepth)]
            }

            function renameChildren (data_now, depthIn, parentName) {
              if (!is_def(depthIn)) depthIn = -1
              if (!is_def(parentName)) parentName = null

              let depthNow = depthIn
              depthNow++
              max_depth = Math.max(depthNow, max_depth)

              let childName = 'child' + String(depthNow)

              // access function
              if (!is_def(getChild[childName])) {
                getChild[childName] = function (d) {
                  return d[childName]
                }
              }

              // internal variables to keep track of the depth, name of the parent
              data_now.childDepth = depthNow
              data_now.parentName = parentName
              parentName = data_now.id

              // modify children names and go one level deeper if needed
              if (data_now.children) {
                // console.log('+++++',data_now.id,childName,data_now);
                if (!is_def(gHirch[porpNow][data_now.id])) {
                  // the baseline g element (parent g from the hirch, or else the first one)
                  let parentNameNow = data_now.parentName
                    ? data_now.parentName
                    : 'hirch'

                  // new baseline g element which may get child-g elements from the hirch
                  let g_now
                  g_now = gHirch[porpNow][parentNameNow].append('g')
                  gHirch[porpNow][data_now.id] = g_now
                  // the first g elelment into which all circles will be appended (so that they
                  // are  always at the top of the g element, before any child-g elements)
                  g_now = gHirch[porpNow][data_now.id].append('g')
                  gHirch[porpNow][data_now.id + 'circ'] = g_now
                }

                data_now[childName] = data_now.children
                // data_now.children   = null;
                data_now[childName].forEach(function (d) {
                  renameChildren(d, depthNow, parentName)
                })

                hirchV[data_now.id] = d3
                  .hierarchy(data_now, getChild[childName])
                  .sum(function (d) {
                    return 1
                  })
                hirchDataV[porpNow][data_now.id] = data_now
                // console.log('--',data_now.id,childName,data_now)
              }
            }

            if (thisS10.instruments.props.indexOf(porpNow) >= 0) {
              renameChildren(dataBase)

              thisS10.hirchData[porpNow] = dataBase
              // console.log(dataBase)

              $.each(hirchV, function (hirchName, hirchNow) {
                let packNode = d3
                  .pack()
                  .size([wh, wh])
                  .padding(1.5 * siteScale)
                packNode(hirchNow)
              })

              parentV[porpNow] = {}
              depthClick[porpNow] = 0

              let hirchAll = d3.hierarchy(dataBase, getAllChildren)
              $.each(hirchAll.descendants(), function (index, data_now) {
                let nameNow = data_now.data.id
                if (!is_def(parentV[porpNow][nameNow])) {
                  parentV[porpNow][nameNow] = [nameNow]
                }

                let parentNow = data_now.parent
                while (parentNow) {
                  parentV[porpNow][nameNow].push(parentNow.data.id)
                  parentNow = parentNow.parent
                }
              })
              hirchAll = null
              // console.log('parentV -',parentV)

              for (let depthNow = 0; depthNow < max_depth; depthNow++) {
                $.each(hirchV, function (hirchName, hirchNow) {
                  if (hirchNow.data.childDepth !== depthNow) return
                  // console.log(hirchName,hirchNow.data.childDepth,hirchNow)

                  let parentName = hirchNow.data.parentName
                  if (parentName != null) {
                    let parent = hirchV[parentName]
                    $.each(parent.children, function (index, childNow) {
                      // console.log('---- ',parentName,parentName,childNow.data.id,childNow)
                      if (childNow.data.id === hirchName) {
                        let parentR = childNow.r / (wh / 2)
                        let parentX = childNow.x - childNow.r
                        let parentY = childNow.y - childNow.r

                        // console.log('move-g in(',parentName,'):  ',hirchName)
                        gTrans[porpNow][hirchName] =
                          'translate(' +
                          parentX +
                          ',' +
                          parentY +
                          ')scale(' +
                          parentR +
                          ')'
                        gHirch[porpNow][hirchName].attr(
                          'transform',
                          gTrans[porpNow][hirchName]
                        )
                      }
                    })
                  }

                  // console.log('hirchName',hirchName,depthClick)
                  gHirch[porpNow][hirchName + 'circ']
                    .selectAll('circle.' + hirchName)
                    .data(hirchNow.descendants())
                    .enter()
                    .append('circle')
                    .attr('class', hirchName)
                    // .attr("id",            function(d){ return my_unique_id+hirchName+"_"+d.data.id; })
                    .style('opacity', function (d) {
                      return hirchStyleOpac(d, hirchNow, 0)
                    })
                    .style('stroke', function (d) {
                      return hirchStyleStroke(d, hirchNow, 0)
                    })
                    .style('stroke-width', function (d) {
                      return hirchStrkW(d, hirchNow, 0)
                    })
                    .style('fill', function (d) {
                      return hirchStyleFill(d, hirchNow, 0)
                    })
                    .attr('cx', function (d) {
                      return d.x
                    })
                    .attr('cy', function (d) {
                      return d.y
                    })
                    .attr('r', 0)
                    .attr('vector-effect', 'non-scaling-stroke')
                    .attr('pointer-events', function (d) {
                      return d.data.childDepth === 1 ? 'auto' : 'none'
                    })
                    .on('click', click)
                    .on('mouseover', hirchHovTitleIn)
                    .on('mouseout', hirchHovTitleOut)
                  // .on('mouseover', function(d){ console.log(d.data.id,d); })
                  // .transition("inOut").duration(times.anim_arc)
                  // .attr("r",             function(d,i){ return d.r; });

                  function click (d) {
                    if (
                      !locker.are_free([
                        's10bckArcChange',
                        'dataChange',
                        's10clickHirch'
                      ])
                    ) {
                      return
                    }

                    hirchStyleClick({
                      propIn: porpNow,
                      id: d.data.id,
                      isOpen: true
                    })
                    
                    propsS1({
                      tel_Id: tel_Id,
                      clickIn: true,
                      propIn: d.data.id,
                      debug: 'hirchClick'
                    })

                    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                    // FIXME:
                    // here we can set non thisS10.instruments.props names if needed.....
                    // console.log('_setPropLblInitHirch',d.data.id); setPropLbl({ propIn:d.data.id });
                    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                  }
                })
              }
            }
          })
        }
        thisS10.initHirch = initHirch

        // setTimeout(function() {
        //   console.log('==========================')
        //   porpNow = "mirror"
        //   // hirchName = "mirror_1_1"
        //   hirchName = porpNow
        //   hirchStyleClick({ propIn:porpNow, id:hirchName isOpen:true })

        // }, 4000);

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function hirchStyleClick (opt_in) {
          if (noRender) return
          if (!is_def(gBase)) return

          if (!locker.are_free(['dataChange', 's10clickHirch'])) {
            setTimeout(function () {
              hirchStyleClick(opt_in)
            }, times.anim_arc / 3)
            return
          }

          locker.add({ id: 's10clickHirch', override: true })
          function freeMe (doDelay) {
            locker.remove({
              id: 's10clickHirch',
              delay: doDelay ? times.anim_arc * 1.5 : 0,
              override: true
            })
          }

          let id = opt_in.id
          let propIn = opt_in.propIn
          let isOpen = opt_in.isOpen
          let syncProp = is_def(opt_in.syncProp) ? opt_in.syncProp : opt_in.id
          // console.log('clk',id,'==',propIn,'--', hirchDataV[propIn])

          if (this_top.getZoomS() === 1) {
            let arr_zoomerProp = isOpen ? syncProp : ''
            sync_state_send({
              type: 'sync_arr_zoomerProp',
              syncTime: Date.now(),
              tel_Id: zoomD.target,
              propId: arr_zoomerProp
            })
          }

          if (propIn === '' || !is_def(propIn)) {
            $.each(gHirch, function (porpAllNow, gHirchNow) {
              gHirchNow.hirch
                .selectAll('circle')
                .transition('updt')
                .duration(times.anim_arc)
                .style('stroke', 'transparent')
                .attr('r', 0)

              $.each(gHirchNow, function (hirchName, g_now) {
                g_now
                  .transition('inOut')
                  .duration(times.anim_arc)
                  .attr('transform', gTrans[porpAllNow][hirchName])
              })
            })

            freeMe(true)
            return
          }

          if (
            !is_def(gHirch[propIn][id]) ||
            !is_def(hirchDataV[propIn][id])
          ) {
            freeMe(true)
            return
          }

          let depthNow = hirchDataV[propIn][id].childDepth
          let childDepth = depthNow + 1

          depthClick[propIn] = depthNow

          $.each(gHirch, function (porpAllNow, gHirchNow) {
            function isOut (d) {
              let inParentV = parentV[porpAllNow][d.data.id].indexOf(id) >= 0
              return isOpen && inParentV && d.data.childDepth > depthNow
            }

            gHirchNow.hirch
              .selectAll('circle')
              .transition('updt')
              .duration(times.anim_arc)
              .attr('r', function (d) {
                return isOut(d) ? d.r : 0
              })
              .attr('pointer-events', function (d) {
                return isOut(d) && d.data.childDepth === childDepth
                  ? 'auto'
                  : 'none'
              })
              .style('opacity', function (d) {
                return hirchStyleOpac(d, d, childDepth)
              })
              .style('stroke', function (d) {
                return isOut(d)
                  ? hirchStyleStroke(d, d, childDepth)
                  : 'transparent'
              })
              .style('stroke-width', function (d) {
                return hirchStrkW(d, d, childDepth)
              })
              .style('fill', function (d) {
                return hirchStyleFill(d, d, childDepth)
              })
          })

          $.each(gHirch, function (porpAllNow, gHirchNow) {
            $.each(gHirchNow, function (hirchName, g_now) {
              let inParentV = parentV[propIn][id].indexOf(hirchName) >= 0

              g_now
                .transition('inOut')
                .duration(times.anim_arc)
                .attr(
                  'transform',
                  inParentV
                    ? 'translate(0,0)scale(1)'
                    : gTrans[porpAllNow][hirchName]
                )
            })
          })

          freeMe(true)
        }
        this_top.hirchStyleClick = hirchStyleClick

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function updateHirch (data_in) {
          // due to delays from locker, this function could be called after the S10obj has
          // been removed - make a safety check using gBase...
          if (!is_def(gBase)) return

          if (
            !locker.are_free([
              's10bckArcChange',
              's10clickHirch',
              'updateHirch'
            ])
          ) {
            // console.log('will delay updateHirch',data_in);
            setTimeout(function () {
              updateHirch(data_in)
            }, times.anim_arc / 3)
            return
          }
          locker.add('updateHirch')

          //
          $.each(thisS10.instruments.props, function (index, porpNow) {
            let base_tag = 's10arc'
            let tag_now = base_tag + porpNow
            let path = gBckArc.selectAll('path.' + tag_now)

            path
              .transition('updtData')
              .duration(times.anim_arc)
              .each(function (d) {
                if (d.nArc === 0) {
                  d.col = inst_health_col(
                    instruments.data.propDataS1[tel_Id][porpNow].val)
                }
              })
              .style('fill', function (d) {
                return d.isFull ? '#383b42' : d.col
              })
          })

          //
          $.each(gHirch, function (porpNow, hirchNow) {
            hirchNow.hirch
              .selectAll('circle')
              .each(function (d) {
                if (is_def(data_in[d.data.id])) {
                  // console.log('updt 111',d.data.id,d);
                  d.data.val = data_in[d.data.id]
                }
              })
              .transition('updtData')
              .duration(times.anim_arc)
              .style('fill', function (d) {
                return hirchStyleFill(d, d, depthClick[porpNow] + 1)
              })
          })
          // console.log('--------------------------------')

          locker.remove('updateHirch')
        }
        thisS10.updateHirch = updateHirch

        // ------------------------------------------------------------------
        // utility functions
        // ------------------------------------------------------------------
        function hirchStyleFill (d, dRef, depth) {
          return dRef.data.childDepth === depth && d.parent
            ? inst_health_col(d.data.val)
            : 'transparent'
        }
        
        function hirchStrkW (d, dRef, depth) {
          if (!d.parent) return 0
          else return dRef.data.childDepth === depth ? 0 : 1
        }
        
        function hirchStyleStroke (d, dRef, depth) {
          return hirchStrkW(d, dRef, depth) < 0.0001
            ? 'transparent'
            : '#383b42'
        }
        
        function hirchStyleOpac (d, dRef, depth) {
          return hirchStrkW(d, dRef, depth) < 0.0001 ? 0.9 : 1
        }
      
        return
      }

      s10 = new S10obj(zoomD.target)
      s10V.push({ id: zoomD.target, s10: s10 })
      
      ;(function () {
        if (s10V.length <= max_ele_keep) return

        let debug = false
        let s10in = []
        let s10out = []
        let s10indexDate = []

        $.each(s10V, function (index, ele_now) {
          s10indexDate.push([index, ele_now.s10.getDate()])
        })

        s10indexDate.sort(function (a, b) {
          return a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0
        })

        let dbg_txt = ''
        if (debug) {
          $.each(s10indexDate, function (index, ele_now) {
            dbg_txt += '[' + s10V[ele_now[0]].id + ' , '
            dbg_txt += s10V[ele_now[0]].s10.getDate() + '] '
          })
          dbg_txt += ' ---> removing: '
        }

        $.each(s10indexDate, function (index, ele_now) {
          if (index < max_ele_keep) s10in.push(s10V[ele_now[0]])
          else s10out.push(s10V[ele_now[0]])

          if (debug) {
            if (index >= max_ele_keep) dbg_txt += s10V[ele_now[0]].id + ' '
          }
        })
        if (debug) console.log('- Sorted:', dbg_txt)

        s10V = s10in

        $.each(s10out, function (index, ele_now) {
          // console.log('- removing:',index,ele_now.id,ele_now.s10,ele_now.s10.gBase)
          ele_now.s10.cleanup()
          ele_now.s10 = null

          if (is_def(instruments.data.propDataS1[ele_now.id])) {
            delete instruments.data.propDataS1[ele_now.id]
            delete instruments.data.propParentS1[ele_now.id]
            delete instruments.data.propTitleS1[ele_now.id]
            delete instruments.data.dataBaseS1[ele_now.id]
          }
        })

        s10in = null
        s10out = null
        s10indexDate = null
      })()
    }

    s10.init()
  
    return
  }
  this_top.s10main = s10main

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function bckArcClick (opt_in) {
    $.each(s10V, function (index, ele_now) {
      if (ele_now.id === zoomD.target) {
        ele_now.s10.bckArcClick(opt_in)
      }
    })
    return
  }
  this_top.bckArcClick = bckArcClick

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function updateS1 (data_in) {
    $.each(s10V, function (index, ele_now) {
      if (ele_now.id === data_in.id) {
        ele_now.s10.updateHirch(data_in.data)
      }
    })
    return
  }
  this_top.updateS1 = updateS1

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setStateOnce () {
    // console.log('setState_main main',this_top.getScale())
    let scale = this_top.getScale()
    let zoomS = this_top.getZoomS()

    if (zoomS === 0) {
      s10main(null)
    }

    if (scale <= zoomD.len['0.1']) {
      updateMap({})
      s00title([], [])
      s01inner([])
      s01outer([])
    } else {
      // let zoom_targetIndex = instruments.data.idToIndex[zoomD.target];
      // let arrPropVtarget = [ instruments.data.tel[zoom_targetIndex] ];

      let arrPropVon = []
      let arrPropVoff = []
      let arrPropVtarget = []
      $.each(instruments.data.tel, function (index, data_now) {
        if (zoomD.target === data_now.id || !is_def(links2V.xyz[zoomD.target])) {
          zoomD.target = data_now.id
          arrPropVon.push(data_now)
          arrPropVtarget.push(data_now)
        } else {
          // arrPropVoff.push(data_now)
          if (links2V.xyz[zoomD.target].indexOf(data_now.id) < 0) {
            arrPropVoff.push(data_now)
          } else {
            arrPropVon.push(data_now)
          }
        }
      })

      updateMap({ focusV0: arrPropVon, focusV1: arrPropVtarget })

      if (zoomS === 0) {
        s01inner(arrPropVtarget)
        s01outer(arrPropVon)

        s00title(arrPropVon, [])
      } else {
        s00title(arrPropVon, arrPropVtarget)

        s01inner(arrPropVtarget, arrPropVtarget)
        s01outer(arrPropVon, arrPropVtarget)

        // ------------------------------------------------------------------
        // syncroniz changes with other panels
        // ------------------------------------------------------------------
        sync_state_send({
          type: 'syncTelFocus',
          syncTime: Date.now(),
          zoom_state: this_top.getZoomS(),
          target: zoomD.target
        })
      }

      arrPropVtarget = null
    }
  
    return
  }
  this_top.setStateOnce = setStateOnce

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function updateMap (opt_in) {
    let dataV = instruments.data.tel
    let g_now = com.s00.g
    let posTag = 'xyr'
    let focusV0 = is_def(opt_in.focusV0) ? opt_in.focusV0 : []
    let focusV1 = is_def(opt_in.focusV1) ? opt_in.focusV1 : []
    let tag_now = instruments.prop0

    let focus_idV = [
      focusV0.map(function (d) {
        return d.id
      }),
      focusV1.map(function (d) {
        return d.id
      })
    ]
    function isFocused (d, nFocus) {
      return focus_idV[nFocus].indexOf(d.id) >= 0
    }

    if (noRender) return

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
      .style('opacity', '0')
      .attr('r', function (d) {
        return 0
      })
      .style('stroke-width', '0.5')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('transform', function (d) {
        return (
          'translate(' +
          instruments.data[posTag][d.id].x +
          ',' +
          instruments.data[posTag][d.id].y +
          ')'
        )
      })
      .merge(circ)
      .transition('inOut')
      .duration(times.anim_arc)
      .attr('transform', function (d) {
        return (
          'translate(' +
          instruments.data[posTag][d.id].x +
          ',' +
          instruments.data[posTag][d.id].y +
          ')'
        )
      })
      .style('fill', function (d) {
        return inst_health_col(d[tag_now])
      })
      .style('stroke', function (d) {
        return inst_health_col(d[tag_now], 0.5)
      })
      .style('opacity', function (d) {
        if (isFocused(d, 1)) return 0.01
        else if (isFocused(d, 0)) return 0.07
        else return 1
      })
      .attr('r', function (d) {
        let r = instruments.data[posTag][d.id].r * rScale[0].health2
        if (isFocused(d, 1)) return r * 2
        else if (isFocused(d, 0)) return r * 1.1
        else return r
      })
    
    return
  }

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function ask_dataS1 () {
    let zoomS = this_top.getZoomS()
    if (zoomS === 0) return

    eleBase.sockAskDataS1({
      zoom_state: zoomS,
      zoom_target: zoomD.target
    })
    return
  }
  this_top.ask_dataS1 = ask_dataS1

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function getWidgetState () {
    return {
      zoom_state: this_top.getZoomS(),
      zoom_target: zoomD.target
    }
    return
  }
  this_top.getWidgetState = getWidgetState

  return
}
