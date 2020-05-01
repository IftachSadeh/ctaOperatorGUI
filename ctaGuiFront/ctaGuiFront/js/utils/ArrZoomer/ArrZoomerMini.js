// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
// window.load_script({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global do_zoom_to_target */
/* global inst_health_col */
/* global bck_pattern */
/* global tel_info */
/* global vor_ploy_func */
/* global unique */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerMini = function(opt_in0) {
    let this_top = this
    let run_loop = opt_in0.run_loop
    // let widget_id = opt_in0.widget_id
    let locker = opt_in0.locker
    let is_south = opt_in0.is_south
    let isLens = opt_in0.isLens
    let my_unique_id = unique()
  
    let dblclick_zoom_in_out = (
        is_def(opt_in0.dblclick_zoom_in_out) ? opt_in0.dblclick_zoom_in_out : true
    )
    let has_titles = (
        is_def(opt_in0.has_titles) ? opt_in0.has_titles : false
    )
    let pointerEvents = (
        is_def(opt_in0.pointerEvents) ? opt_in0.pointerEvents : !isLens
    )
    this_top.static_zoom = (
        is_def(opt_in0.static_zoom) ? opt_in0.static_zoom : true
    )

    let mini_lens_tag = isLens ? 'Lens' : 'Mini'
  
    let ele_base = opt_in0.ele_base
    let insts = ele_base.insts
    let zooms = ele_base.zooms
    let lock_init_key = ele_base.lock_init_keys[mini_lens_tag.toLowerCase()]

    let has_site_svg = ele_base.has_site_svg
    // let site_bck_svg = ele_base.site_bck_svg
    let hex_r = is_def(opt_in0.hex_r) ? opt_in0.hex_r : 40

    let scale_r = insts.scale_r

    let svg_dims = {
        // w: 500, h: 500, frac_circ_wh: 1,
        w: 600,
        h: 600,
        frac_circ_wh: 0.85,
    }

    let site_scale = ele_base.site_scale

    // let show_vor = false
    this_top.has_init = false

    ele_base.set_ele(this_top, mini_lens_tag.toLowerCase())
    let get_ele = ele_base.get_ele

    let mini_gs = ele_base.svgs[mini_lens_tag.toLowerCase()]
    mini_gs.g = ele_base.svgs.g_svg.append('g')
    mini_gs.g_mini = mini_gs.g.append('g')
    // mini_gs.g_base = mini_gs.g_mini.append('g')

    let unique_clip_id = 'clip' + my_unique_id

    mini_gs.g_outer = mini_gs.g_mini.append('g')
    mini_gs.g_outer.append('defs')
        .append('clipPath')
        .attr('id', unique_clip_id)
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', svg_dims.w)
        .attr('height', svg_dims.h)

    mini_gs.clipped_g = mini_gs.g_outer.append('g')
    mini_gs.clipped_g.attr('class', 'clipped_g')
        .attr('clip-path', 'url(#' + unique_clip_id + ')')

    mini_gs.g_base = mini_gs.clipped_g.append('g')
    mini_gs.g_back = mini_gs.g_base.append('g')

    // ------------------------------------------------------------------
    // scale to 100x100 px (executed after createChessMap())
    // ------------------------------------------------------------------
    function g_trans() {
        let scale_mini = 100 / svg_dims.w
        mini_gs.g_mini.attr('transform',
            'translate(0,0)scale(' + scale_mini + ')'
        )
        return
    }

    // ------------------------------------------------------------------
    // to avoid bugs, this is the g which should be used
    // for translations and sacling of this element
    // ------------------------------------------------------------------
    this_top.set_transform = function(trans) {
        if (is_def(trans)) {
            mini_gs.g.attr('transform', trans)
        }
        return mini_gs.g
    }


    let com = {
    }
    this_top.com = com
    let zoom_target = null
    let tel_data = null
    // let tel_id_types = null
    let health_tag = ele_base.health_tag

    let miniMapCol = {
    }
    miniMapCol.b = [ '#64B5F6' ]
    miniMapCol.p = [ '#9575CD' ]

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function createMiniMap() {

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
        mini_gs.g_outer
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', svg_dims.w)
            .attr('height', svg_dims.h)
            .style('fill', 'transparent' )
            .style('stroke', '#F2F2F2' )
            .style('stroke-width', isLens ? 2 : 0)
            .attr('pointer-events', 'none')
            .attr('opacity', 1)

        mini_gs.g_back
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', svg_dims.w)
            .attr('height', svg_dims.h)
        // .attr('fill', isLens?'transparent':'#383B42')
            .attr('fill', '#383B42')
        // .attr('fill', '#F2F2F2')
        // .style('opacity', isLens?0.1:1)


        // mini_gs.g_back
        //   .append('rect')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('width', svg_dims.w)
        //   .attr('height', svg_dims.h)
        //   // .attr('fill', isLens?'transparent':'#383B42')
        //   // .attr('fill', '#383B42')
        //   .attr('fill', '#F2F2F2')
        //   .style('opacity', isLens?0.05:0)

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        get_ele('main').add_back_shapes(mini_gs, svg_dims, ele_base.tel_types)

        if (!has_site_svg) {
            bck_pattern({
                com: com,
                // g_now: main_gs.g_back,
                g_now: mini_gs['clipped_bck_circ_g'],
                g_tag: 'hex_circ',
                len_wh: [ svg_dims.w, svg_dims.h ],
                opac: 0.2,
                hex_r: hex_r,
            })
        }

        // the background grid
        bck_pattern({
            com: com,
            // g_now: mini_gs.g_back,
            g_now: mini_gs['clipped_bck_rec_g'],
            g_tag: 'hex_rec',
            len_wh: [ svg_dims.w, svg_dims.h ],
            opac: 0.2,
            hex_r: hex_r,
        })

        com.g_base_mini = {
        }
        com.g_base_mini.circ = mini_gs.g_base.append('g')
        com.g_base_mini.text = mini_gs.g_base.append('g')
        com.g_base_mini.rect = mini_gs.g_base.append('g')
        com.g_base_mini.vor = mini_gs.g_base.append('g')

        if (!pointerEvents) {
            com.g_base_mini.vor.style('pointer-events', 'none')
        }


        return
    }
  

    // ------------------------------------------------------------------
    //  MiniMap function
    // ------------------------------------------------------------------
    function setupZoom() {
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
        function svg_zoom_start() {
            if (!locker.are_free([
                'zoom_sync_main', ('zoom_sync' + mini_lens_tag), 'in_zoom_main',
            ])) {
                return
            }
      
            locker.add({
                id: ('inZoom' + mini_lens_tag),
                override: true,
            })
            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function svg_zoom_during() {
            if (!locker.are_free([
                'zoom_sync_main', ('zoom_sync' + mini_lens_tag), 'in_zoom_main',
            ])) {
                return
            }

            if (!this_top.static_zoom) {
                mini_gs.g_base.attr('transform', d3.event.transform)
            }
            // mini_zoom_view_recOnce({ animT: 0 })

            $.each([ 'main', 'mini', 'lens' ], function(i, d) {
                if (d == mini_lens_tag) {
                    return
                }

                if (!get_ele(d)) {
                    return
                }
                if (get_ele(d).static_zoom) {
                    return
                }
        
                ele_base.svgs[d].g_base.attr('transform', d3.event.transform)
                // ele_base.svgs.main.g_base.attr('transform', d3.event.transform)
            })

            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function svg_zoom_end() {
            if (!locker.are_free([
                'zoom_sync_main', ('zoom_sync' + mini_lens_tag), 'in_zoom_main',
            ])) {
                return
            }

            mini_zoom_view_rec({
            })
            // console.log('-svg_zoom_end-svg_zoom_end-', d3.event)

            $.each([ 'main', 'mini', 'lens' ], function(i, d) {
                if (d == mini_lens_tag) {
                    return
                }

                if (!get_ele(d)) {
                    return
                }
                get_ele(d).zoom_sync(d3.event.transform)
                // get_ele('main').zoom_sync(d3.event.transform)
            })


            // remove the lock before possible zoom_to_target_main()
            locker.remove(('inZoom' + mini_lens_tag))


            if (Math.abs(this_top.get_scale() - zooms.len['0.0']) < 0.00001) {
                let trans = this_top.get_trans()
                if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
                    get_ele('main').zoom_to_target_main({
                        target: 'init',
                        scale: zooms.len['0.0'],
                        duration_scale: 1,
                    })
                }
            }

            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function zoom_sync(trans) {
            if (!locker.are_free([
                ('zoom_sync' + mini_lens_tag), ('inZoom' + mini_lens_tag),
            ])) {
                return
            }

            locker.add({
                id: ('zoom_sync' + mini_lens_tag),
                override: true,
            })
            function func_end() {
                locker.remove(('zoom_sync' + mini_lens_tag))
            }

            let x = (svg_dims.w / 2 - trans.x) / trans.k
            let y = (svg_dims.h / 2 - trans.y) / trans.k
            let trans_to = [ x, y ]

            let duration_scale = 0
            if (!this_top.static_zoom) {
                if (!locker.are_free([ 'auto_zoom_target' ])) {
                    duration_scale = 0.5
                    duration_scale = 1
                }
            }

            let data_out = {
                target_scale: trans.k,
                duration_scale: duration_scale,
                base_time: 300,
                trans_to: trans_to,
                wh: [ svg_dims.w, svg_dims.h ],
                cent: null,
                // func_start: func_start,
                func_end: func_end,
                // func_during: func_during,
                svg: mini_gs.g_mini,
                svg_zoom: com.svg_zoom,
                zoom_callable: mini_gs.g_base,
                svg_zoom_node: mini_gs.zoom_node,
                is_static: this_top.static_zoom,
            }

            do_zoom_to_target(data_out)
      
            return
        }
        this_top.zoom_sync = zoom_sync


        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.svg_zoom = d3.zoom()
        com.svg_zoom.scaleExtent(zooms.scale_extent)
        com.svg_zoom.on('start', svg_zoom_start)
        com.svg_zoom.on('zoom', svg_zoom_during)
        com.svg_zoom.on('end', svg_zoom_end)

        // function filter() {
        //   let scale = this_top.get_scale()
        //   let isIn = (d3.event.wheelDelta > 0) && (scale < zooms.len['1.3'])
        //   let is_out = (d3.event.wheelDelta < 0) && (scale > zooms.len['0.0'])
        //   console.log(d3.event.wheelDelta, isIn, is_out)

        //   if(!(isIn || is_out)) {
        //     console.log('qqqqqqqqqq',d3.event)
        //     // d3.event.sourceEvent.stopImmediatePropagation()
        //   }

        //   return 1
        //   return isIn || is_out
        // }
        // com.svg_zoom.filter(filter)

        if (pointerEvents) {
            mini_gs.g_mini
                .call(com.svg_zoom)
                .on('dblclick.zoom', null)
                .on('wheel', function() {
                    d3.event.preventDefault()
                })
                .on('mousedown.zoom', null)
        }


        // ------------------------------------------------------------------
        // save the svg node to use for d3.zoomTransform() later
        // ------------------------------------------------------------------
        mini_gs.zoom_node = mini_gs.g_mini.nodes()[0]

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        this_top.get_scale = function() {
            return d3.zoomTransform(mini_gs.zoom_node).k
        }
        this_top.get_trans = function() {
            return [
                d3.zoomTransform(mini_gs.zoom_node).x,
                d3.zoomTransform(mini_gs.zoom_node).y,
            ]
        }

        return
    }

 
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function telTitles() {
        if (!has_titles) {
            return
        }
    
        let data_now = tel_data.tel
        let g_now = com.g_base_mini.text
        let tag_now = health_tag

        let font_size0 = 12 * site_scale
        // let font_size0 = 11 * site_scale

        let text = g_now
            .selectAll('text.' + tag_now)
            .data(data_now, function(d) {
                return d.id
            })

        text
            .enter()
            .append('text')
            .text(function(d) {
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
            .style('font-size', font_size0 + 'px')
            .attr('dy', font_size0 / 3 + 'px')
            .attr('transform', function(d) {
                return (
                    'translate(' + insts.data.xyr[d.id].x
                    + ',' + insts.data.xyr[d.id].y + ')'
                )
            })
            .attr('text-anchor', 'middle')
            .merge(text)
            .transition('in_out')
            .duration(times.anim)
            .attr('transform', function(d) {
                let shiftVal = 0
                return (
                    ('translate(' + insts.data.xyr[d.id].x)
                    + (',' + (insts.data.xyr[d.id].y - shiftVal) + ')')
                )
            })
            .style('font-size', font_size0 + 'px')
            .attr('dy', font_size0 / 3 + 'px')
            .style('opacity', 1)

        text
            .exit()
            .transition('exit')
            .duration(times.anim)
            .style('opacity', 0)
            .remove()
    
        return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function updateMiniMap() {
        let data_now = tel_data.tel
        let g_now = com.g_base_mini.circ
        let pos_tag = 'xyr_physical'
        let tag_now = health_tag

        // operate on new elements only
        let circ = g_now
            .selectAll('circle.' + tag_now)
            .data(data_now, function(d) {
                return d.id
            })

        circ
            .enter()
            .append('circle')
            .attr('class', tag_now)
            .style('opacity', '1')
            .attr('r', function(d) {
                return tel_data[pos_tag][d.id].r * scale_r[0].health2
            })
            .style('stroke-width', '0.5')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('transform', function(d) {
                return (
                    'translate('
          + tel_data[pos_tag][d.id].x
          + ','
          + tel_data[pos_tag][d.id].y
          + ')'
                )
            })
            .merge(circ)
            .transition('in_out')
            .duration(times.anim)
            .attr('transform', function(d) {
                return (
                    'translate('
          + tel_data[pos_tag][d.id].x
          + ','
          + tel_data[pos_tag][d.id].y
          + ')'
                )
            })
            .style('fill', function(d) {
                return inst_health_col(d[tag_now])
            })
            .style('stroke', function(d) {
                return inst_health_col(d[tag_now], 0.5)
            })
  
        return
    }
    this_top.updateMiniMap = updateMiniMap
  
    // ------------------------------------------------------------------
    //  Blue square on miniMap
    // ------------------------------------------------------------------
    function mini_zoom_view_rec(opt_in) {
        run_loop.push({
            tag: 'mini_zoom_view_rec' + my_unique_id,
            data: opt_in,
        })
    }
    this_top.mini_zoom_view_rec = mini_zoom_view_rec
  
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function mini_zoom_view_recOnce(opt_in) {
        if (!this_top.static_zoom) {
            return
        }
        if (
            !locker.are_free([
                'auto_zoom_target',
                'zoom_to_target_mini',
            ])
        ) {
            mini_zoom_view_rec(opt_in)
            return
        }
    
        let tag_now = 'mini_zoom_view_rec'
        let scale = this_top.get_scale()
        let trans = this_top.get_trans()
        let data = []

        if (!is_def(opt_in)) {
            opt_in = {
            }
        }
        let animT = is_def(opt_in.animT) ? opt_in.animT : times.anim
        // console.log('QQQ animT',animT,scale,Date.now())

        if (scale < (is_south ? 2 : 1.5)) {
            scale = 1
            trans = [ 0, 0 ]
        }
        else {
            data = [{
                id: 0,
            }]
        }

        let base_h = svg_dims.w

        let w
      = (1 + (is_south ? 2 * scale / zooms.len['1.3'] : 0)) * base_h / scale
        let h
      = (1 + (is_south ? 2 * scale / zooms.len['1.3'] : 0)) * base_h / scale
        let x = (base_h / 2 - trans[0]) / scale - w / 2
        let y = (base_h / 2 - trans[1]) / scale - h / 2

        let strkW = 1 + 0.1 * scale / (zooms.len['1.3'] - zooms.len['0.0'])
        let opac = 0.95 * Math.sqrt(scale / (zooms.len['1.3'] - zooms.len['0.0']))

        // operate on new elements only
        let rect = com.g_base_mini.rect
            .selectAll('rect.' + tag_now)
            .data(data, function(d) {
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
            .transition('in_out')
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
            .duration(times.anim)
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
    function miniZoomClick() {
    // let tag_now = 'miniZoomClick'

        let vor_func = d3
            .voronoi()
            .x(function(d) {
                return d.x
            })
            .y(function(d) {
                return d.y
            })
            .extent([ [ 0, 0 ], [ svg_dims.w, svg_dims.h ] ])

        com.g_base_mini.vor
            .selectAll('path')
            .data(vor_func.polygons(tel_data.vor.data))
            .enter()
            .append('path')
            .style('fill', 'transparent')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('stroke-width', 0)
            .style('opacity', 0)
            .style('stroke', '#383B42')
        // .style("opacity", "0.25").style("stroke-width", "0.75").style("stroke", "#E91E63")//.style("stroke", "white")
            .call(function(d) {
                d.attr('d', vor_ploy_func)
            })
            .on('click', function(d) {
                tel_data.vor_dblclick({
                    source: 'minizoomclick',
                    d: d,
                    is_in_out: false,
                })
                return
            })
        // .on("click", function(d) {
        //   let scale_to_zoom = tel_data.vor_dblclick({d:d, is_in_out:false });
        //   this_top.zoomToTrgQuick({ target:d.data.id, scale:scale_to_zoom, duration_scale:-1 });
        // })
        // .on("dblclick", function(d) {  // dousnt work well...
        //   let scale_to_zoom = tel_data.vor_dblclick({d:d, is_in_out:true });
        //   this_top.zoomToTrgQuick({ target:d.data.id, scale:scale_to_zoom, duration_scale:-1 });
        // })
      

        // .on('mouseover', function (d) {
        //   this_top.target = d.data.id
        // })

            .on('mouseover', insts.data.hover)
            .on('click', insts.data.click)
            .on('dblclick', function(d) {
                insts.data.dblclick({
                    d: d,
                    is_in_out: dblclick_zoom_in_out,
                })
            })
    }

    // ------------------------------------------------------------------
    //  Global function
    // ------------------------------------------------------------------
    function init_data(data_in) {
        if (this_top.has_init) {
            return
        }
        this_top.has_init = true

        tel_data = data_in.instrument_data
        // tel_id_types = data_in.tel_id_types

        setupZoom()
        createMiniMap()
        g_trans()
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

        run_loop.init({
            tag: 'mini_zoom_view_rec' + my_unique_id,
            func: mini_zoom_view_recOnce,
            n_keep: 1,
        })
        mini_zoom_view_rec({
        })
        miniZoomClick()

        set_state_once(data_in)

        locker.remove(lock_init_key)
        return
    }
    this_top.init_data = init_data
  
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_state_once(data_in) {
        updateMiniMap ()
    // updateMiniMap ({
    //   dataV: tel_data.tel,
    //   g_now: com.g_base_mini.circ,
    //   pos_tag: mini_lens_tag.toLowerCase(),
    // })
    }
    this_top.set_state_once = set_state_once

    // // ------------------------------------------------------------------
    // // initialize a global function (to be overriden below)
    // // ------------------------------------------------------------------
    // let zoomToTrgQuick = function (opt_in) {
    //   if (!locker.is_free('in_init')) {
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
    this_top.get_scale = function() {
        return zooms.len['0.0']
    }
  
    this_top.get_trans = function() {
        return [ 0, 0 ]
    }

    return
}

