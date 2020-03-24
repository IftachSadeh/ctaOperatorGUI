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
window.ArrZoomerMain = function(opt_in0) {
    let this_top = this
    let run_loop = opt_in0.run_loop
    let sgv_tag = opt_in0.sgv_tag
    let widget_id = opt_in0.widget_id
    let locker = opt_in0.locker
    let is_south = opt_in0.is_south
    let my_unique_id = unique()
    let parentUniqueId = opt_in0.my_unique_id
    let widget_type = opt_in0.widget_type

    let no_render = opt_in0.no_render
    let dblclick_zoom_in_out = is_def(opt_in0.dblclick_zoom_in_out) ? opt_in0.dblclick_zoom_in_out : true

    let ele_base = opt_in0.ele_base

    let instruments = ele_base.instruments
    let zooms = ele_base.zooms
    let lock_init_key = ele_base.lock_init_keys.main
  
    let scale_r = instruments.scale_r

    let get_prop_pos_shift = ele_base.get_prop_pos_shift
    let interpolate01 = ele_base.interpolate01
    let set_zoom_state = ele_base.set_zoom_state
    let props_s1 = ele_base.props_s1
    let set_state = ele_base.set_state
    let is_state_up = ele_base.is_state_up
    let is_state_down = ele_base.is_state_down
    let is_state_change = ele_base.is_state_change
    let sync_state_send = ele_base.sync_state_send
  
    ele_base.set_ele(this_top, 'main')
    let get_ele = ele_base.get_ele


    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    this_top.has_init = false
    // this_top.svgQuick = null

    let com = {}
    this_top.com = com
    let s10_eles = []
    let syncs = {}
    this_top.syncs = syncs
    com.vor = {}
    com.s00 = {}
    com.s01 = {}
    com.s10 = {}
    instruments.data.vor = {}

  
    let focus = {}

    let s1_lbl_xy = {}
    let arc_func = {}

    let links_2 = {}

    let arc_prev = {}
    arc_prev.ang = {}
    arc_prev.rad = {}

    let tel_rs = ele_base.tel_rs
    let site_scale = ele_base.site_scale

    let svg_dims = { 
    // w: 500, h: 500, frac_circ_wh: 1,
        w: 600, h: 600, frac_circ_wh: 0.85,
    }
    this_top.svg_dims = svg_dims
  


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let main_gs = ele_base.svgs.main
    main_gs.g = ele_base.svgs.g_svg.append('g')
    main_gs.g_outer = main_gs.g.append('g')

    let unique_clip_id = 'clip' + my_unique_id
  
    main_gs.g_outer.append('defs')
        .append('clipPath')
        .attr('id', unique_clip_id)
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', svg_dims.w)
        .attr('height', svg_dims.h)

    main_gs.clipped_g = main_gs.g_outer.append('g')
    main_gs.clipped_g.attr('class', 'clipped_g')
        .attr('clip-path', 'url(#'+unique_clip_id+')')

    // ------------------------------------------------------------------
    // initial scale to 100x100 px
    // ------------------------------------------------------------------
    main_gs.g_outer.attr('transform', function(d) {
        return 'translate(0,0)scale('+ (100 / svg_dims.w) +')'
    })

    // ------------------------------------------------------------------
    // to avoid bugs, this is the g which should be used
    // for translations and sacling of this element
    // ------------------------------------------------------------------
    this_top.set_transform = function(trans) {
        if (is_def(trans)) main_gs.g.attr('transform', trans)
        return main_gs.g
    }

    main_gs.g_base = main_gs.clipped_g.append('g')
    main_gs.g_back = main_gs.g_base.append('g')
    com.vor.g = main_gs.g_base.append('g')
    com.s00.g = main_gs.g_base.append('g')
    com.s01.g = main_gs.g_base.append('g')

    if (no_render) {
        main_gs.g
            .style('opacity', 0)
            .style('pointer-events', 'none')
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function cat_ele_pos(n_ele_now, n_elements) {
        let y_marg_top = svg_dims.h * 0.3
        let y_marg_bot = 0
        let y_marg = tel_rs.s00[2] + svg_dims.h * 0.2
        let y_tot = svg_dims.h - 2 * y_marg - y_marg_top - y_marg_bot
        let y_width = y_tot / (n_elements - 1)
        let x = (svg_dims.w * (1-svg_dims.frac_circ_wh)) / 2
        let y = y_marg_top + y_marg + y_width * n_ele_now
        let r = tel_rs.s00[3]

        return { x: x, y: y, r: r }
    }
    this_top.cat_ele_pos = cat_ele_pos


    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function add_back_shapes(g_in, len_wh, tel_data) {
        g_in
            .append('circle')
            .attr('r', (len_wh.w - len_wh.w * (1-len_wh.frac_circ_wh)) / 2.1)
            .attr('cx', (len_wh.w + len_wh.w * (1-len_wh.frac_circ_wh)) / 2)
            .attr('cy', len_wh.h / 2)
        // .attr('r', len_wh.w / 2.1)
        // .attr('cx', len_wh.w / 2)
        // .attr('cy', (len_wh.h - len_wh.h * (1-len_wh.frac_circ_wh)) / 2)
            .attr('fill', '#F2F2F2')

        let y_ele = []
        let data_cat = Object.entries(tel_data).filter(function(d) {
            return tel_info.is_categorical_id(ele_base.tel_types[d[0]])
        })
        $.each(data_cat, function(i, d) {
            let id = d[0]
            // let data_now = d[1]
            y_ele.push(this_top.cat_ele_pos(i, data_cat.length).y)
        })
        let y_min = Math.min(...y_ele) - tel_rs.s00[3]*3
        let y_max = Math.max(...y_ele) + tel_rs.s00[3]*3
        let x_shift = len_wh.w * (1-len_wh.frac_circ_wh) * 0.1

        g_in
            .append('rect')
            .attr('x', x_shift)
            .attr('y', y_min)
            .attr('width', (len_wh.w * (1-len_wh.frac_circ_wh)) - 1.5*x_shift)
            .attr('height', y_max - y_min)
            .attr('rx', len_wh.h * 0.02)
            .attr('ry', len_wh.h * 0.02)
            .attr('fill', '#F2F2F2')
        return
    }
    this_top.add_back_shapes = add_back_shapes


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init_data(data_in) {
        let arr_init = data_in.arr_init
        let sub_arr = data_in.sub_arr

        if (this_top.has_init) return
        this_top.has_init = true

        init_vor()

        // ------------------------------------------------------------------
        // add one circle as background
        // ------------------------------------------------------------------
        if (!no_render) {
            main_gs.g_outer
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', svg_dims.w)
                .attr('height', svg_dims.h)
                .style('fill', 'transparent' )
                .style('stroke', '#383B42' )
            // .style("stroke",'#F2F2F2' )
            // .style("stroke",'#2196F3' )
                .style('stroke-width', 1)
                .attr('pointer-events', 'none')
                .attr('opacity', 1)

            add_back_shapes(main_gs.g_back, svg_dims, arr_init)

            // the background grid
            bck_pattern({
                com: com,
                g_now: main_gs.g_back,
                g_tag: 'hex',
                len_wh: [ svg_dims.w, svg_dims.h ],
                opac: this_top.get_scale() < zooms.len['1.0'] ? 0.15 : 0.07,
                hex_r: 18,
            })
        }


        // ------------------------------------------------------------------
        // run all variations, just to initialize all the variables
        // (but only the last one will take affect - this will be the default value)
        // ------------------------------------------------------------------
        instruments.data.layout = 'physical' // physical layout as default
        // instruments.data.layout = "sub_arr";  // sub-array layout as default

        // this_top.set_layout_sub_arr(sub_arr)
        this_top.set_layout_physical(arr_init)


        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        set_state()

        locker.remove(lock_init_key)
        return
    }
    this_top.init_data = init_data


    // // ------------------------------------------------------------------
    // // 
    // // ------------------------------------------------------------------
    // function setup_zoom () {
    //   // initialize a global function (to be overriden below)
    //   this_top.zoom_to_target_main = function (opt_in) {
    //     if (!locker.is_free('in_init')) {
    //       setTimeout(function () {
    //         this_top.zoom_to_target_main(opt_in)
    //       }, times.wait_loop)
    //     }
    //   }

    //   // initialize a couple of functions to be overriden below
    //   this_top.get_scale = function () { return zooms.len['0.0'] }
    //   this_top.get_trans = function () { return [0, 0] }
    //   this_top.get_zoom_state = function () { return 0 }

    //   return
    // }
    // setup_zoom()


    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function init_zoom() {
        let scale_start = 0
        let zoom_sync_mini_lockers = [
            'zoom_sync_main', 'zoom_sync_mini',
            'zoom_sync_lens', 'in_zoom_mini',
        ]
    
        function svg_zoom_start() {
            if (!locker.are_free(zoom_sync_mini_lockers)) return

            scale_start = d3.event.transform.k
            locker.add({ id: 'zoom', override: true })
            locker.add({ id: 'in_zoom_main', override: true })
        }

        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        function svg_zoom_during() {
            if (!locker.are_free(zoom_sync_mini_lockers)) {
                return
            }
      
            main_gs.g_base.attr('transform', d3.event.transform)

            $.each([ 'mini', 'lens' ], function(i, d) {
                let svg_mini = get_ele(d)
                if (!svg_mini) return
                if(svg_mini.static_zoom) return
        
                ele_base.svgs[d].g_base.attr('transform', d3.event.transform)
            })

            svg_zoom_update_state()
        }

        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        function svg_zoom_end() {
            if (!locker.are_free(zoom_sync_mini_lockers)) return
      
            svg_zoom_update_state()
            set_zoom_state()

            focus.target = zooms.target
            focus.scale = d3.event.transform.k

            $.each([ 'mini', 'lens' ], function(i, d) {
                let svg_mini = get_ele(d)
                if (!svg_mini) return
                // if(svg_mini.static_zoom) return

                svg_mini.mini_zoom_view_rec()
                svg_mini.zoom_sync(d3.event.transform)
            })

            locker.remove('zoom')
            locker.remove('in_zoom_main')

            // ------------------------------------------------------------------
            // if on minimal zoom, center
            // ------------------------------------------------------------------
            if (Math.abs(d3.event.transform.k - scale_start) > 0.00001) {
                if (Math.abs(d3.event.transform.k - zooms.len['0.0']) < 0.00001) {
                    if (locker.are_free([ 'auto_zoom_target' ])) {
                        this_top.zoom_to_target_main({
                            target: 'init',
                            scale: d3.event.transform.k,
                            duration_scale: 0.5,
                        })
                    }

                    // syncroniz changes with other panels
                    sync_state_send({
                        type: 'sync_tel_focus',
                        sync_time: Date.now(),
                        zoom_state: 0,
                        target: 'init',
                    })
                }
            }

            return
        }

        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        function zoom_sync(trans) {
            locker.add({ id: 'zoom_sync_main', override: true })
            function func_end() {
                locker.remove('zoom_sync_main')
            }

            let x = (svg_dims.w / 2 - trans.x) / trans.k
            let y = (svg_dims.h / 2 - trans.y) / trans.k
            let trans_to = [ x, y ]

            let data_out = {
                target_scale: trans.k,
                duration_scale: 0,
                base_time: 300,
                trans_to: trans_to,
                wh: [ svg_dims.w, svg_dims.h ],
                cent: null,
                // func_start: func_start,
                func_end: func_end,
                // func_during: func_during,
                svg: main_gs.g_outer,
                svg_zoom: com.svg_zoom,
                zoom_callable: main_gs.g_base,
                svg_zoom_node: main_gs.zoom_node,
            }

            do_zoom_to_target(data_out)
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

        main_gs.g_outer.call(com.svg_zoom)
            .on('dblclick.zoom', null)
            .on('wheel', function() {
                d3.event.preventDefault()
            })

        // save the svg node to use for d3.zoomTransform() later
        main_gs.zoom_node = main_gs.g_outer.nodes()[0]


        // ------------------------------------------------------------------
        // programatic zoom to some target and scale - only use the
        // last of any set of ovelapping zoom requests
        // ------------------------------------------------------------------
        run_loop.init({
            tag: 'zoom_to_target_main' + my_unique_id,
            func: do_zoom_to_target,
            n_keep: -1,
        })

        // ------------------------------------------------------------------
        // the actual function to be called when a
        // zoom needs to be put in the queue
        // ------------------------------------------------------------------
        this_top.zoom_to_target_main = function(opt_in) {
            if (!locker.is_free('in_init')) {
                setTimeout(function() {
                    this_top.zoom_to_target_main(opt_in)
                }, times.wait_loop)
                return
            }
            if (!locker.are_free([ 'auto_zoom_target' ])) return
      
            let target_name = opt_in.target
            let target_scale = opt_in.scale
            let duration_scale = opt_in.duration_scale
            let end_func = opt_in.end_func

            if (target_scale < zooms.len['0.0']) target_scale = this_top.get_scale()

            let trans_to = null
            if (target_name === 'init') {
                trans_to = [ svg_dims.w / 2, svg_dims.h / 2 ]
            } 
            else if (
                target_name === '' || 
        !is_def(instruments.data.mini[target_name])) 
            {
                let scale = this_top.get_scale()
                let trans = this_top.get_trans()
                let x = (svg_dims.w / 2 - trans[0]) / scale
                let y = (svg_dims.h / 2 - trans[1]) / scale
                trans_to = [ x, y ]

                let min_diff = -1
                target_name = zooms.target
                $.each(instruments.data.xyr, function(id_now, data_now) {
                    if (data_now.isTel) {
                        let diff_now =
              Math.pow(x - data_now.x, 2) + Math.pow(y - data_now.y, 2)
                        if (diff_now < min_diff || min_diff < 0) {
                            min_diff = diff_now
                            target_name = id_now
                        }
                    }
                })
            } else {
                trans_to = [
                    instruments.data.xyr[target_name].x,
                    instruments.data.xyr[target_name].y,
                ]
            }

            let func_start = function() {
                locker.add({ id: 'auto_zoom_target', override: true })
                if (target_name !== '' && target_name !== 'init') {
                    zooms.target = target_name
                }
            }
      
            let func_during = function() {}
      
            let func_end = function() {
                locker.remove('auto_zoom_target')

                let is_done = true
                if (Math.abs(this_top.get_scale() - zooms.len['0.0']) < 0.00001) {
                    let trans = this_top.get_trans()
                    if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
                        is_done = false
                        this_top.zoom_to_target_main({
                            target: 'init',
                            scale: zooms.len['0.0'],
                            duration_scale: 1,
                        })
                    }
                }
                if (duration_scale > 0 && is_done) set_state()

                if (is_def(end_func)) end_func(opt_in)
            }

            let data_out = {
                target_scale: target_scale,
                duration_scale: duration_scale,
                base_time: 300,
                trans_to: trans_to,
                wh: [ svg_dims.w, svg_dims.h ],
                cent: null,
                func_start: func_start,
                func_end: func_end,
                func_during: func_during,
                svg: main_gs.g_outer,
                svg_zoom: com.svg_zoom,
                zoom_callable: main_gs.g_base,
                svg_zoom_node: main_gs.zoom_node,
            }

            if (duration_scale < 0) {
                data_out.duration_scale = 0
                do_zoom_to_target(data_out)
            } else {
                run_loop.push({
                    tag: 'zoom_to_target_main' + my_unique_id, 
                    data: data_out,
                })
            }
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        this_top.get_scale = function() {
            return d3.zoomTransform(main_gs.zoom_node).k
        }
        this_top.get_trans = function() {
            return [
                d3.zoomTransform(main_gs.zoom_node).x,
                d3.zoomTransform(main_gs.zoom_node).y,
            ]
        }
        this_top.get_zoom_state = function() {
            return this_top.get_scale() < zooms.len['1.0'] ? 0 : 1
        }

        return
    }
    init_zoom()

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function init_vor() {
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
        let vor_func = d3
            .voronoi()
            .x(function(d) {
                return d.x
            })
            .y(function(d) {
                return d.y
            })
            .extent([ [ 0, 0 ], [ svg_dims.w, svg_dims.h ] ])


        // ------------------------------------------------------------------
        // create voronoi cells for the dataset. 
        // see: https://bl.ocks.org/mbostock/4060366
        // ------------------------------------------------------------------
        instruments.data.hover = function(d) {
            if (zooms.target === d.data.id) return
            if (!locker.are_free([ 'zoom', 'auto_zoom_target' ])) return

            let scale = this_top.get_scale()
            if (scale >= zooms.len['1.0']) return

            zooms.target = d.data.id
            set_state()
            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        run_loop.init({
            tag: 'click_once' + my_unique_id, func: click_once, n_keep: 1,
        })

        instruments.data.click = function(opt_in) {
            if (locker.are_free([ 'zoom', 'auto_zoom_target' ])) {
                run_loop.push({
                    tag: 'click_once' + my_unique_id, data: opt_in,
                })
            }
            return
        }

        function click_once(d) {
            if (!locker.is_free('vor_zoom_click')) {
                setTimeout(function() {
                    instruments.data.click(d)
                }, times.wait_loop / 2)
                return
            }
            locker.add({ id: 'vor_zoom_click', override: true })

            let scale = this_top.get_scale()
            // console.log((scale >= zooms.len["1.0"]),(zooms.target == d.data.id))

            if (scale < zooms.len['1.0']) {
                instruments.data.dblclick({
                    d: d, is_in_out: dblclick_zoom_in_out,
                })
            } else if (scale >= zooms.len['1.0'] && zooms.target !== d.data.id) {
                instruments.data.dblclick({ d: d, is_in_out: false })
            } else {
                zooms.target = d.data.id
                set_state()
            }

            locker.remove({ id: 'vor_zoom_click', delay: times.anim_arc })

            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        run_loop.init({
            tag: 'dblclick_once' + my_unique_id,
            func: dblclick_once, n_keep: 1,
        })

        instruments.data.dblclick = function(opt_in) {
            // console.log( opt_in.source);
            if (locker.are_free([ 'zoom', 'auto_zoom_target' ])) {
                run_loop.push({
                    tag: 'dblclick_once' + my_unique_id, data: opt_in,
                })
            }
            return
        }

        function dblclick_once(opt_in) {
            if (!locker.is_free('vor_zoom_dblclick')) {
                setTimeout(function() {
                    instruments.data.dblclick(opt_in)
                }, times.wait_loop / 2)
                return
            }
            locker.add({ id: 'vor_zoom_dblclick', override: true })

            let d = opt_in.d
            let zoom_in_out = opt_in.is_in_out
            let scale = this_top.get_scale()
            let is_on_target = zooms.target === d.data.id
            // console.log('vorClick',d.data.id,(scale >= zooms.len["1.0"]),!is_on_target)

            zooms.target = d.data.id

            let scale_to_zoom = 1
            if (zoom_in_out) {
                if (scale < zooms.len['1.2']) {
                    scale_to_zoom = zooms.len['1.2'] + 0.001
                }
                else {
                    scale_to_zoom = zooms.len['0.0']
                }
            }
            else {
                if (scale < zooms.len['0.2'] * 0.999) {
                    scale_to_zoom = zooms.len['0.2']
                }
                else if (scale < zooms.len['1.0'] * 1.001) {
                    scale_to_zoom = zooms.len['1.1']
                }
                else {
                    scale_to_zoom = zooms.len['1.2']
                }
            }

            this_top.zoom_to_target_main({
                target: zooms.target,
                scale: scale_to_zoom,
                duration_scale: 1.25,
            })

            if (scale >= zooms.len['1.0'] && !is_on_target) {
                set_state()

                ask_data_s1()
                props_s1({
                    tel_Id: zooms.target, click_in: false, prop_in: '',
                })
            }

            locker.remove({
                id: 'vor_zoom_dblclick', delay: times.anim_arc,
            })
        }

        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        function setVor() {
            let tag_vor = 'vor'
            let vor_show_lines = false

            let polygons = vor_func.polygons(instruments.data.vor.data)
            let vor = com.vor.g
                .selectAll('path.' + tag_vor)
                .data(polygons, function(d) {
                    return d.data.id
                })

            vor
                .enter()
                .append('path')
                .attr('class', tag_vor)
                .style('fill', 'transparent')
                .style('opacity', '0')
                .attr('vector-effect', 'non-scaling-stroke')
                .style('stroke-width', 0)
                .style('opacity', 0)
                .style('stroke', '#383B42')
                .style('stroke-width', '1')
                .style('opacity', vor_show_lines ? 1 : 0)
                .style('stroke', '#4F94CD')
                .on('mouseover', instruments.data.hover)
                .on('click', instruments.data.click)
                .on('dblclick', function(d) {
                    instruments.data.dblclick({ 
                        d: d, is_in_out: dblclick_zoom_in_out,
                    })
                })
            // .on("mouseover", function(d) {
            //   console.log(d.data.id)
            // }) // debugging
                .merge(vor)
                .call(function(d) {
                    d.attr('d', vor_ploy_func)
                })

            vor.exit().remove()

            // ------------------------------------------------------------------
            // calculation of coordinates for labels, added next
            // ------------------------------------------------------------------
            $.each(instruments.data.vor.data, function(index_, data_now) {
                $.each(instruments.props[data_now.id], function(index, porp_now) {
                    let angle = (
                        (index + 0.5) 
            * instruments.tau_fracs[data_now.id] 
            + tau / 4
                    )
                    let label_x = data_now.r * Math.cos(angle)
                    let label_y = data_now.r * Math.sin(angle)

                    if (s1_lbl_xy[porp_now] === undefined) {
                        s1_lbl_xy[porp_now] = {}
                    }
                    s1_lbl_xy[porp_now][data_now.id] = [ label_x, label_y ]
                })
            })

            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function set_layout_physical(data_in) {
            if (is_def(data_in)) {
                set_tel_data_physical(data_in)
            }

            if (instruments.data.layout !== 'physical') return

            instruments.data.xyr = instruments.data.xyr_physical
            instruments.data.vor.data = instruments.data.vor.data_physical
            links_2.xyz = links_2.physical

            setVor()
            this_top._sub_arr_grp_circ([])

            if (locker.is_free('in_init')) {
                if (is_def(focus.target)) {
                    if (is_def(instruments.data.xyr[focus.target])) {
                        this_top.zoom_to_target_main({
                            target: focus.target,
                            scale: focus.scale,
                            duration_scale: 1,
                        })
                    }
                }
                // thisarr_zoomer.set_state();
            }

            return
        }
        this_top.set_layout_physical = set_layout_physical

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function set_tel_data_physical(data_in) {
            // console.log("dataphyzoom", data_in);
            instruments.data.xyr_physical = {}
            instruments.data.vor.data_physical = []

            // ------------------------------------------------------------------
            // get the width of the initial data (should be most inclusive)
            // ------------------------------------------------------------------
            let keys = Object.keys(data_in)
            let min_data_x = data_in[keys[0]].x
            let max_data_x = data_in[keys[0]].x
            let min_data_y = data_in[keys[0]].y
            let max_data_y = data_in[keys[0]].y

            $.each(data_in, function(id, data_now) {
                min_data_x = Math.min(min_data_x, data_now.x)
                max_data_x = Math.max(max_data_x, data_now.x)
                min_data_y = Math.min(min_data_y, data_now.y)
                max_data_y = Math.max(max_data_y, data_now.y)
            })

            let data_in_wh = [
                max_data_x - min_data_x, max_data_y - min_data_y,
            ]
            if (!is_south) {
                data_in_wh[0] *= 1.1
                data_in_wh[1] *= 1.1
            }

            // ------------------------------------------------------------------
            // 
            // ------------------------------------------------------------------
            let xy_cat = {}
            let data_cat = Object.entries(data_in).filter(function(d) {
                return tel_info.is_categorical_id(ele_base.tel_types[d[0]])
            })

            $.each(data_cat, function(i, d) {
                let id = d[0]
                // let data_now = d[1]
                xy_cat[id] = this_top.cat_ele_pos(i, data_cat.length)
            })

            $.each(data_in, function(id, data_now) {
                let x, y, r
                if(is_def(xy_cat[id])) {
                    x = xy_cat[id].x
                    y = xy_cat[id].y
                    r = xy_cat[id].r
                }
                else {
                    if (data_now.t === 'LST') r = tel_rs.s00[2]
                    else if (data_now.t === 'MST') r = tel_rs.s00[1]
                    else r = tel_rs.s00[0]

                    let shift_main_x = svg_dims.w * (1 - svg_dims.frac_circ_wh)
                    let shift_main_y = svg_dims.h * (1 - svg_dims.frac_circ_wh) / 2
                    // let shift_main_y = 0
          
                    let len_w = svg_dims.w * svg_dims.frac_circ_wh
                    let len_h = svg_dims.h * svg_dims.frac_circ_wh
                    x = shift_main_x + (1 * data_now.x * len_w
                  / (1.2 * data_in_wh[0]) + len_w / 2)
                    y = shift_main_y + (-1 * data_now.y * len_h
                  / (1.2 * data_in_wh[1]) + len_h / 2)

                }

                // translate to the center of the respective hex-cell
                // let xy = com.svgBck.trans([x,y]);  x = xy[0]; y = xy[1];
                instruments.data.xyr_physical[id] = { 
                    x: x, y: y, r: r, //isTel: true 
                }
                instruments.data.vor.data_physical.push({ 
                    id: id, x: x, y: y, r: r, 
                })
                // console.log(id, instruments.data.xyr_physical[id], ele_base.tel_types[id], tel_info.is_categorical_id(ele_base.tel_types[id]))
            })


            // ------------------------------------------------------------------
            // use delaunay links to get the closest neighbours of each data-point
            // see: http://christophermanning.org/projects/voronoi-diagram-with-force-directed-nodes-and-delaunay-links/
            // ------------------------------------------------------------------
            let vor_links = vor_func.links(
                instruments.data.vor.data_physical
            )
            let links_1 = {}
            $.each(vor_links, function(index, link_now) {
                let id_s = link_now.source.id
                let id_t = link_now.target.id

                if (!links_1[id_s]) links_1[id_s] = [ id_t ]
                else links_1[id_s].push(id_t)
        
                if (!links_1[id_t]) links_1[id_t] = [ id_s ]
                else links_1[id_t].push(id_s)
            })

            links_2.physical = deep_copy(links_1) // deep copy
            $.each(links_1, function(id_s, link_now) {
                $.each(link_now, function(index0, idT0) {
                    $.each(links_1[idT0], function(index1, idT1) {
                        if (links_2.physical[id_s].indexOf(idT1) === -1) {
                            links_2.physical[id_s].push(idT1)
                        }
                        // console.log(index1,links_2.physical[id_s],idT0,idT1)
                    })
                })
            })

            instruments.data.mini = instruments.data.xyr_physical
            instruments.data.lens = instruments.data.xyr_physical

            return
        }


        // // ------------------------------------------------------------------
        // // 
        // // ------------------------------------------------------------------
        // function set_layout_sub_arr (data_in) {
        //   if (is_def(data_in)) {
        //     set_tel_data_sub_arr(data_in)
        //   }

        //   if (instruments.data.layout !== 'sub_arr') return
      
        //   instruments.data.xyr = instruments.data.xyr_sub_arr
        //   instruments.data.vor.data = instruments.data.vor.data_sub_arr
        //   links_2.xyz = links_2.sub_arr

        //   setVor()

        //   this_top._sub_arr_grp_circ(instruments.data.xyr_sub_arr_grp)

        //   if (locker.is_free('in_init')) {
        //     if (is_def(focus.target)) {
        //       if (is_def(instruments.data.xyr[focus.target])) {
        //         // console.log('222222222222');
        //         if (Math.abs(this_top.get_scale() - zooms.len['0.0']) > 0.00001) {
        //           let trans = this_top.get_trans()
        //           if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
        //             this_top.zoom_to_target_main({
        //               target: focus.target,
        //               scale: focus.scale,
        //               duration_scale: 1
        //             })
        //           }
        //         }
        //       }
        //     }
        //   }

        //   return
        // }
        // this_top.set_layout_sub_arr = set_layout_sub_arr

        // // ------------------------------------------------------------------
        // //
        // // ------------------------------------------------------------------
        // function set_tel_data_sub_arr (data_in) {
        //   instruments.data.xyr_sub_arr = {}
        //   instruments.data.vor.data_sub_arr = []
        //   instruments.data.xyr_sub_arr_grp = []
        //   let hirchScale = 0.9
        //   let hirch = d3.hierarchy(data_in).sum(function (d) {
        //     return 1
        //   })
        //   let packNode = d3
        //     .pack()
        //     .size([svg_dims.w * hirchScale, svg_dims.h * hirchScale])
        //     .padding(10)
        //   packNode(hirch)

        //   $.each(hirch.descendants(), function (index, data_now) {
        //     let isTel = data_now.height === 0
        //     if (data_now.height < 2) {
        //       let id = data_now.data.id
        //       // if(!isTel) {
        //       //   if(id == -1) id = tel_info.no_sub_arr_name();
        //       //   else         id = tel_info.sub_arr_prefix()+id;
        //       //   console.log('-------',id);
        //       // }

        //       let x = data_now.x + svg_dims.w * (1 - hirchScale) / 2
        //       let y = data_now.y + svg_dims.h * (1 - hirchScale) / 2

        //       let eleR = data_now.r
        //       if (isTel) {
        //         if (data_now.t === 'LST') eleR = tel_rs.s00[2]
        //         else if (data_now.t === 'MST') eleR = tel_rs.s00[1]
        //         else eleR = tel_rs.s00[0]
        //       }

        //       instruments.data.xyr_sub_arr[id] = { 
        //         x: x, y: y, r: eleR, // isTel: isTel,
        //       }

        //       if (isTel) {
        //         instruments.data.vor.data_sub_arr.push({ 
        //           id: id, x: x, y: y, r: eleR,
        //         })
        //       } else {
        //         let title = is_def(data_now.data.N)
        //           ? data_now.data.N
        //           : tel_info.no_sub_arr_title()
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

        //   links_2.sub_arr = {}
        //   $.each(hirch.descendants(), function (index0, data_now0) {
        //     if (data_now0.height === 1) {
        //       $.each(data_now0.children, function (index1, data_now1) {
        //         if (data_now1.height === 0) {
        //           let all_ids = data_now0.children.map(function (d) {
        //             return d.data.id
        //           })
        //           links_2.sub_arr[data_now1.data.id] = []
        //           $.each(all_ids, function (index2, data_now2) {
        //             if (data_now2 !== data_now1.data.id) {
        //               links_2.sub_arr[data_now1.data.id].push(data_now2)
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
    com.arc_tween = function(transition, opt_in) {
    // if(opt_in.skip != undefined && opt_in.skip) return null;
        function tween_func(d) {
            if (is_def(opt_in.incIdV)) {
                if (opt_in.incIdV.indexOf(d.id) === -1) return null
            }
            if (is_def(opt_in.excIdV)) {
                if (opt_in.excIdV.indexOf(d.id) >= 0) return null
            }

            let tag_now = opt_in.tag_now
            let ang_str_0 = opt_in.ang_str_0
                ? arc_func[tag_now][opt_in.ang_str_0](d)
                : opt_in.arc_prev[tag_now].ang[d.id][0]
            let ang_str_1 = opt_in.ang_str_1
                ? arc_func[tag_now][opt_in.ang_str_1](d)
                : opt_in.arc_prev[tag_now].ang[d.id][0]
            let ang_end_0 = opt_in.ang_end_0
                ? arc_func[tag_now][opt_in.ang_end_0](d)
                : opt_in.arc_prev[tag_now].ang[d.id][1]
            let ang_end_1 = opt_in.ang_end_1
                ? arc_func[tag_now][opt_in.ang_end_1](d)
                : opt_in.arc_prev[tag_now].ang[d.id][1]
            let r_in_0 = opt_in.r_in_0
                ? arc_func[tag_now][opt_in.r_in_0](d)
                : opt_in.arc_prev[tag_now].rad[d.id][0]
            let r_in_1 = opt_in.r_in_1
                ? arc_func[tag_now][opt_in.r_in_1](d)
                : opt_in.arc_prev[tag_now].rad[d.id][0]
            let r_out_0 = opt_in.r_out_0
                ? arc_func[tag_now][opt_in.r_out_0](d)
                : opt_in.arc_prev[tag_now].rad[d.id][1]
            let r_out_1 = opt_in.r_out_1
                ? arc_func[tag_now][opt_in.r_out_1](d)
                : opt_in.arc_prev[tag_now].rad[d.id][1]
            // console.log(tag_now,[ang_str_0,ang_str_1],[ang_end_0,ang_end_1],[r_in_0,r_in_1],[r_out_0,r_out_1])

            let need_update = 0
            if (Math.abs(ang_str_0 - ang_str_1) / ang_str_0 > 1e-5) 
                need_update++
            if (Math.abs(ang_end_0 - ang_end_1) / ang_end_0 > 1e-5) 
                need_update++
            if (Math.abs(r_in_0 - r_in_1) / r_in_0 > 1e-5) 
                need_update++
            if (Math.abs(r_out_0 - r_out_1) / r_out_0 > 1e-5) 
                need_update++
      
            if (need_update === 0) 
                return null

            let arc = d3.arc()
      
            function out_func(t) {
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
            return out_func
        }
    
        transition.attrTween('d', tween_func)
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svg_zoom_update_state() {
        let scale = this_top.get_scale()
        let zoom_state = this_top.get_zoom_state()

        let change_01 = is_state_change(scale, '0.1')
        let change_10 = is_state_change(scale, '1.0')

        if (zoom_state === 0) syncs.zoom_target = ''

        if (change_01 || change_10) {
            set_state()

            // update the opacity of the background grid
            if (change_10) {
                bck_pattern({
                    com: com,
                    g_now: main_gs.g_base,
                    g_tag: 'hex',
                    len_wh: [ svg_dims.w, svg_dims.h ],
                    opac: this_top.get_scale() < zooms.len['1.0'] ? 0.15 : 0.07,
                    hex_r: 18,
                })
            }
            if (is_state_up(scale, '1.0')) ask_data_s1()

            zooms.len.prev = scale
        }
    }


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_tel_layout(opt_in) {
        if (
            !locker.are_free([
                'set_state_lock',
                'data_change',
                'zoom',
                'auto_zoom_target',
                's1_props_change',
            ])
        ) {
            setTimeout(function() {
                set_tel_layout(opt_in)
            }, times.anim_arc / 2)
            return
        }

        let id = opt_in.id
        let update_id = opt_in.update_id
        let data = opt_in.data

        // check if we are about to change the id
        let is_change = instruments.data.layout !== id

        if (is_change || is_def(data)) {
            locker.expires({
                id: 'set_state_lock', duration: times.anim_arc / 2,
            })
        }

        if (id === 'physical') {
            if (update_id) instruments.data.layout = id
            this_top.set_layout_physical(data)
        } 
        // else if (id === 'sub_arr') {
        //   if (update_id) instruments.data.layout = id
        //   this_top.set_layout_sub_arr(data)
        // } 
        else {
            console.error(' - trying to set undefined layout', id)
            return
        }

        if ((update_id && is_change) || is_def(data)) {
            set_state()

            if (this_top.get_zoom_state() === 1) {
                $.each(s10_eles, function(index, ele_now) {
                    ele_now.s10.update_pos_g(times.anim_arc)
                })
            }
        }
    }
    this_top.set_tel_layout = set_tel_layout

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function _sub_arr_grp_circ(data_in) {
        if (no_render) return

        if (!locker.is_free('in_init')) {
            setTimeout(function() {
                _sub_arr_grp_circ(data_in)
            }, times.wait_loop)
            return
        }

        let tag_now = 'sub_arr_grp'
        let font_size = 23 * site_scale

        // operate on new elements only
        let circ = com.s00.g
            .selectAll('circle.' + tag_now)
            .data(data_in, function(d) {
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
            .style('fill', function(d) {
                return '#383b42'
            })
            .style('stroke', function(d) {
                return '#383b42'
            })
            .style('fill-opacity', 0.02)
            .style('stroke-opacity', 0.3)
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')'
            })
            .merge(circ)
            .transition('in_out')
            .duration(times.anim_arc)
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')'
            })
            .attr('r', function(d) {
                return d.r
            })

        circ
            .exit()
            .transition('in_out')
            .duration(times.anim_arc)
            .attr('r', 0)
            .remove()

        let text = com.s00.g
            .selectAll('text.' + tag_now)
            .data(data_in, function(d) {
                return d.id
            })

        text
            .enter()
            .append('text')
            .text(function(d) {
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
            .attr('font-size', font_size + 'px')
        // .attr("dy", (font_size/3)+'px' )
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

        function txtTrans(d) {
            return 'translate(' + d.x + ',' + (d.y - d.r) + ')'
        }
    }
    this_top._sub_arr_grp_circ = _sub_arr_grp_circ

    // ------------------------------------------------------------------
    // add a lable with the
    // ------------------------------------------------------------------
    function s00_title(focus_0, focus_1) {
        if (no_render) return
    
        let focus_ids = [
            focus_0.map(function(d) {
                return d.id
            }),
            focus_1.map(function(d) {
                return d.id
            }),
        ]
        function is_focused(d, n_focus) {
            return focus_ids[n_focus].indexOf(d.id) >= 0
        }

        let tag_lbl = 'lbls_00_title'
        // let tag_state = 'state_00'
        // let tag_txt = tag_state + tag_lbl
        let font_size0 = 11 * site_scale

        function font_size(d) {
            if (is_focused(d, 1)) 
                return font_size0 * 0.5
            else if (is_focused(d, 0)) 
                return font_size0 * 0.6
            else 
                return font_size0 * 1.0
        }

        if (!is_def(com[tag_lbl])) {
            com[tag_lbl] = {}
            com[tag_lbl].g = main_gs.g_base.append('g')
        }

        let text = com[tag_lbl].g
            .selectAll('text.' + tag_lbl)
            .data(instruments.data.tel, function(d) {
                return d.id
            })

        text
            .enter()
            .append('text')
            .text(function(d) {
                return tel_info.get_title(d.id)
            })
            .attr('class', tag_lbl)
            .style('font-weight', 'bold')
            .style('opacity', 0)
            .style('fill', '#383b42')
            .style('stroke-width', '0.3')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .style('stroke', '#383b42')
            .style('font-size', function(d) {
                return font_size(d) + 'px'
            })
            .attr('dy', function(d) {
                return font_size(d) / 3 + 'px'
            })
            .attr('transform', function(d, i) {
                return (
                    'translate(' + instruments.data.xyr[d.id].x + ',' + instruments.data.xyr[d.id].y + ')'
                )
            })
            .attr('text-anchor', 'middle')
            .merge(text)
            .transition('in_out')
            .duration(times.anim_arc)
            .attr('transform', function(d, i) {
                let shiftVal = 0
                if (is_focused(d, 1)) {
                    shiftVal = (
                        instruments.data.xyr[d.id].r 
            * (scale_r[1].health1 + 0.5)
                    )
                }
                return (
                    'translate(' +
          instruments.data.xyr[d.id].x +
          ',' +
          (instruments.data.xyr[d.id].y - shiftVal) +
          ')'
                )
            })
            .style('font-size', function(d) {
                return font_size(d) + 'px'
            })
            .attr('dy', function(d) {
                return font_size(d) / 3 + 'px'
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
    function s01_inner(data_in, focuses) {
        if (no_render) return

        let tag_state = 'state01'

        if (!is_def(com.s01.inner)) {
            com.s01.inner = true

            // let telProps = Object.keys(instruments.props)
            $.each(instruments.all_ids, function(n_ele, key) {
                // $.each(instruments.props, function (key, telProps) {
                $.each(instruments.props[key], function(index, porp_now) {
                    // console.log('+', key, index, porp_now)
                    $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
                        // let tag_now = porp_now + n_arc_draw_now
                        let tag_now = key + porp_now + n_arc_draw_now
                        let is0 = n_arc_draw_now === 0

                        arc_func[tag_now] = {}
                        arc_func[tag_now].rad00 = function(d) {
                            return instruments.data.xyr[d.id].r * (is0 ? 0.85 : 0.81)
                        }
                        arc_func[tag_now].rad01 = function(d) {
                            return instruments.data.xyr[d.id].r * (is0 ? 0.95 : 0.99)
                        }
                        arc_func[tag_now].rad10 = function(d) {
                            return (
                                instruments.data.xyr[d.id].r * scale_r[1].inner_h0 * (is0 ? 1 : 0.97)
                            )
                        }
                        arc_func[tag_now].rad11 = function(d) {
                            return (
                                instruments.data.xyr[d.id].r * scale_r[1].inner_h1 * (is0 ? 1 : 1.03)
                            )
                        }
                        arc_func[tag_now].ang00 = function(d) {
                            return index * instruments.tau_fracs[key] + instruments.tau_space
                        }
                        arc_func[tag_now].ang01 = function(d) {
                            return (
                                index * instruments.tau_fracs[key] +
                instruments.tau_space +
                (instruments.tau_fracs[key] 
                  - instruments.tau_space * 2)
                * (is0 ? 1 : inst_health_frac(d[porp_now]))
                            )
                        }
                    })
                })
            })
        }

        // ------------------------------------------------------------------
        // innner arcs for the different properties
        // ------------------------------------------------------------------
        let focus_ids = []
        if (focuses !== undefined && focuses != null) {
            $.each(focuses, function(index, data_now) {
                focus_ids.push(data_now.id)
            })
        }
        // let tel_Id = data_in.id
        // let tel_Id = zooms.target
        // DDFF

        $.each(instruments.all_ids, function(n_ele, tel_Id) {
            $.each(instruments.props[tel_Id], function(index, porp_now) {
                $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
                    let tag_now = tel_Id + porp_now + n_arc_draw_now
                    let is0 = n_arc_draw_now === 0

                    if (!is_def(arc_prev[tag_now])) {
                        arc_prev[tag_now] = {}
                        arc_prev[tag_now].ang = {}
                        arc_prev[tag_now].rad = {}
                    }

                    let dataVnow = data_in
                    if (data_in.length > 0) {
                        if (data_in[0].id != tel_Id) {
                            dataVnow = []
                        }
                    }

                    let path = com.s01.g
                        .selectAll('path.' + tag_now)
                        .data(dataVnow, function(d, i) {
                            return d.id
                        })

                    // operate on new elements only
                    path
                        .enter()
                        .append('path')
                        .style('stroke-width', '0.05')
                        .style('pointer-events', 'none')
                        .attr('vector-effect', 'non-scaling-stroke')
                        .attr('id', function(d) {
                            return my_unique_id + d.id + tag_now
                        })
                        .attr('class', tag_state + ' ' + tag_now)
                    // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
                        .style('opacity', function(d) {
                            return is0 ? '0.5' : '1'
                        })
                        .attr('transform', function(d) {
                            return (
                                'translate(' +
                instruments.data.xyr[d.id].x +
                ',' +
                instruments.data.xyr[d.id].y +
                ')'
                            )
                        })
                        .each(function(d, i) {
                            // console.log(i,d,tag_now)
                            arc_prev[tag_now].ang[d.id] = [
                                arc_func[tag_now].ang00(d),
                                arc_func[tag_now].ang00(d),
                            ]
                            arc_prev[tag_now].rad[d.id] = [
                                arc_func[tag_now].rad00(d),
                                arc_func[tag_now].rad01(d),
                            ]
                        })
                        .merge(path)
                        .transition('in')
                        .duration(times.anim_arc) // .delay(times.anim_arc)
                        .attr('transform', function(d) {
                            return (
                                'translate(' +
                instruments.data.xyr[d.id].x +
                ',' +
                instruments.data.xyr[d.id].y +
                ')'
                            )
                        })
                        .style('stroke', function(d) {
                            return is0 ? null : inst_health_col(d[porp_now])
                        })
                        .style('fill', function(d) {
                            return inst_health_col(d[porp_now])
                        }) // return is0 ? "#383b42" : inst_health_col(d[porp_now]); })
                        .call(com.arc_tween, {
                            tag_now: tag_now,
                            arc_prev: arc_prev,
                            ang_str_0: null,
                            ang_str_1: null,
                            ang_end_0: null,
                            ang_end_1: 'ang01',
                            r_in_0: null,
                            r_in_1: null,
                            r_out_0: null,
                            r_out_1: null,
                        })
                    // ang_str_0:"ang00", ang_str_1:"ang00", ang_end_0:"ang00", ang_end_1:"ang01",
                    // r_in_0:"rad00", r_in_1:"rad00", r_out_0:"rad01", r_out_1:"rad01"
                        .transition('update')
                        .duration(times.anim_arc)
                        .call(com.arc_tween, {
                            tag_now: tag_now,
                            arc_prev: arc_prev,
                            incIdV: focus_ids,
                            ang_str_0: null,
                            ang_str_1: null,
                            ang_end_0: null,
                            ang_end_1: null,
                            r_in_0: null,
                            r_in_1: 'rad10',
                            r_out_0: null,
                            r_out_1: 'rad11',
                        })
                        .transition('update')
                        .duration(times.anim_arc)
                        .call(com.arc_tween, {
                            tag_now: tag_now,
                            arc_prev: arc_prev,
                            excIdV: focus_ids,
                            ang_str_0: null,
                            ang_str_1: null,
                            ang_end_0: null,
                            ang_end_1: null,
                            r_in_0: null,
                            r_in_1: 'rad00',
                            r_out_0: null,
                            r_out_1: 'rad01',
                        })

                    // operate on exiting elements only
                    path
                        .exit()
                        .transition('out')
                    // .each(function (d, i) {console.log('qquq', i, d); })
                        .duration(times.anim_arc)
                        .call(com.arc_tween, {
                            tag_now: tag_now,
                            arc_prev: arc_prev,
                            ang_str_0: null,
                            ang_str_1: 'ang00',
                            ang_end_0: null,
                            ang_end_1: 'ang00',
                            r_in_0: null,
                            r_in_1: 'rad00',
                            r_out_0: null,
                            r_out_1: 'rad01',
                        })
                        .remove()
                })
            })
        })

        focus_ids = null
  
        return
    }

  
    // ------------------------------------------------------------------
    // outer rings for the instruments.prop0 (equivalent of s00_D metric in s01_D)
    // ------------------------------------------------------------------
    function s01_outer(data_in, focuses) {
        if (no_render) return

        let tag_state = 'state01'
        let porp_now = instruments.prop0

        if (!is_def(com.s01.outer)) {
            com.s01.outer = true

            $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
                let tag_now = porp_now + n_arc_draw_now
                let is0 = n_arc_draw_now === 0

                arc_func[tag_now] = {}
                arc_func[tag_now].rad00 = function(d) {
                    return instruments.data.xyr[d.id].r * scale_r[0].health0 * (is0 ? 1 : 0.95)
                }
                arc_func[tag_now].rad01 = function(d) {
                    return instruments.data.xyr[d.id].r * scale_r[0].health1 * (is0 ? 1 : 1.05)
                }
                arc_func[tag_now].rad10 = function(d) {
                    return instruments.data.xyr[d.id].r * scale_r[1].health0 * (is0 ? 1 : 0.98)
                }
                arc_func[tag_now].rad11 = function(d) {
                    return instruments.data.xyr[d.id].r * scale_r[1].health1 * (is0 ? 1 : 1.02)
                }
                arc_func[tag_now].ang00 = function(d) {
                    return 0
                }
                arc_func[tag_now].ang01 = function(d) {
                    return is0 ? tau : tau * inst_health_frac(d[instruments.prop0])
                }
            })
        }

        // ------------------------------------------------------------------
        // innner arcs for the different properties
        // ------------------------------------------------------------------
        let focus_ids = []
        if (focuses !== undefined && focuses != null) {
            $.each(focuses, function(index, data_now) {
                focus_ids.push(data_now.id)
            })
        }

        $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
            let tag_now = porp_now + n_arc_draw_now
            let is0 = (n_arc_draw_now === 0)

            if (!is_def(arc_prev[tag_now])) {
                arc_prev[tag_now] = {}
                arc_prev[tag_now].ang = {}
                arc_prev[tag_now].rad = {}
            }

            let path = com.s01.g
                .selectAll('path.' + tag_now)
                .data(data_in, function(d) {
                    return d.id
                })

            // operate on new elements only
            path
                .enter()
                .append('path')
                .style('stroke-width', 0.05)
                .style('pointer-events', 'none')
                .attr('vector-effect', 'non-scaling-stroke')
                .attr('id', function(d) {
                    return my_unique_id + d.id + tag_now
                })
                .attr('class', tag_state + ' ' + tag_now)
            // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
                .style('opacity', function(d) {
                    return is0 ? '0.5' : '1'
                })
                .attr('transform', function(d) {
                    return (
                        'translate(' +
            instruments.data.xyr[d.id].x +
            ',' +
            instruments.data.xyr[d.id].y +
            ')'
                    )
                })
                .each(function(d, i) {
                    arc_prev[tag_now].ang[d.id] = [
                        arc_func[tag_now].ang00(d),
                        arc_func[tag_now].ang00(d),
                    ]
                    arc_prev[tag_now].rad[d.id] = [
                        arc_func[tag_now].rad00(d),
                        arc_func[tag_now].rad01(d),
                    ]
                })
                .merge(path)
                .transition('in')
                .duration(times.anim_arc) // .delay(times.anim_arc)
                .attr('transform', function(d) {
                    return (
                        'translate(' +
            instruments.data.xyr[d.id].x +
            ',' +
            instruments.data.xyr[d.id].y +
            ')'
                    )
                })
                .style('stroke', function(d) {
                    return is0 ? null : inst_health_col(d[porp_now])
                })
                .style('fill', function(d) {
                    return inst_health_col(d[porp_now])
                }) // return is0 ? "#383b42" : inst_health_col(d[porp_now]); })
                .call(com.arc_tween, {
                    tag_now: tag_now,
                    arc_prev: arc_prev,
                    ang_str_0: null,
                    ang_str_1: null,
                    ang_end_0: null,
                    ang_end_1: 'ang01',
                    r_in_0: null,
                    r_in_1: null,
                    r_out_0: null,
                    r_out_1: null,
                })
            // ang_str_0:"ang00", ang_str_1:"ang00", ang_end_0:"ang00", ang_end_1:"ang01",
            // r_in_0:"rad00", r_in_1:"rad00", r_out_0:"rad01", r_out_1:"rad01"
                .transition('update')
                .duration(times.anim_arc)
                .call(com.arc_tween, {
                    tag_now: tag_now,
                    arc_prev: arc_prev,
                    incIdV: focus_ids,
                    ang_str_0: null,
                    ang_str_1: null,
                    ang_end_0: null,
                    ang_end_1: null,
                    r_in_0: null,
                    r_in_1: 'rad10',
                    r_out_0: null,
                    r_out_1: 'rad11',
                })
                .transition('update')
                .duration(times.anim_arc)
                .call(com.arc_tween, {
                    tag_now: tag_now,
                    arc_prev: arc_prev,
                    excIdV: focus_ids,
                    ang_str_0: null,
                    ang_str_1: null,
                    ang_end_0: null,
                    ang_end_1: null,
                    r_in_0: null,
                    r_in_1: 'rad00',
                    r_out_0: null,
                    r_out_1: 'rad01',
                })

            // operate on exiting elements only
            path
                .exit()
                .transition('out')
                .duration(times.anim_arc)
                .call(com.arc_tween, {
                    tag_now: tag_now,
                    arc_prev: arc_prev,
                    ang_str_0: null,
                    ang_str_1: 'ang00',
                    ang_end_0: null,
                    ang_end_1: 'ang00',
                    r_in_0: null,
                    r_in_1: 'rad00',
                    r_out_0: null,
                    r_out_1: 'rad01',
                })
                .remove()
        })

        focus_ids = null
  
        return
    }

    // function hasS10main(target_id) {
    //   let hasId = false;
    //   $.each(s10_eles, function(index,ele_now) {
    //     if(ele_now.id == zooms.target) hasId = true;
    //   })
    //   return hasId;
    // }
    // this_top.hasS10main = hasS10main;

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function s10_main(data_in) {
    // console.log('s10_main',zooms.target,data_in);

        let max_ele_keep = 1
        let base_node = is_def(data_in) ? data_in.data : null

        if (base_node) {
            let tel_Id = data_in.id

            $.each(instruments.props[tel_Id], function(index, porp_now) {
                instruments.data.prop_data_s1[tel_Id] = {}
                instruments.data.prop_data_s1[tel_Id][porp_now] = null
                instruments.data.prop_parent_s1[tel_Id] = {}
                instruments.data.prop_parent_s1[tel_Id][porp_now] = ''
                instruments.data.prop_title_s1[tel_Id] = {}
                instruments.data.prop_title_s1[tel_Id][porp_now] = ''
            })

            // construct the data_base object b hand, as
            // some properties may not be included in instruments.props[tel_Id]
            instruments.data.data_base_s1[tel_Id] = {}
            instruments.data.data_base_s1[tel_Id].id = instruments.prop0
            instruments.data.data_base_s1[tel_Id].val = data_in[instruments.prop0]
            instruments.data.data_base_s1[tel_Id].children = []
            // console.log('qqqqqqqq',tel_Id,data_in.data.val,data_in.data)

            $.each(base_node, function(index_data, child_now) {
                let porp_now = child_now.id
                if (instruments.props[tel_Id].indexOf(porp_now) >= 0) {
                    // add a reference to each property
                    instruments.data.prop_data_s1[tel_Id][porp_now] = child_now
                    instruments.data.prop_parent_s1[tel_Id][porp_now] = porp_now

                    // also add a reference for each level of the hierarchy which has a sub-hierarchy of its own
                    add_children(child_now, tel_Id, porp_now)

                    // build up the baseData object
                    instruments.data.data_base_s1[tel_Id].children.push(child_now)
                }
            })
        }

        function add_children(data_now, tel_Id, porp_now) {
            if (data_now.children) {
                data_now.children.forEach(function(d, i) {
                    if (d.children) {
                        instruments.data.prop_data_s1[tel_Id][d.id] = d
                        add_children(d, tel_Id, porp_now)
                    }
                    instruments.data.prop_parent_s1[tel_Id][d.id] = porp_now
                    instruments.data.prop_title_s1[tel_Id][d.id] = d.title
                })
            }
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (!base_node) {
            $.each(s10_eles, function(index, ele_now) {
                // console.log('clean -',index,ele_now);
                let s10 = ele_now.s10

                s10.bck_arc_remove() // console.log('click_bck_arc s10 000')
            })
            return
        } 
        else {
            $.each(s10_eles, function(index, ele_now) {
                let id = ele_now.id
                let s10 = ele_now.s10

                if (id !== zooms.target) {
                    // s10.click_bck_arc(null);
                    s10.bck_arc_remove() // console.log('click_bck_arc s10 111')
                }
            })
        }

        let s10 = null
        $.each(s10_eles, function(index, ele_now) {
            if (ele_now.id === zooms.target) s10 = ele_now.s10
        })
        if (!s10) {
            // ------------------------------------------------------------------
            //
            // ------------------------------------------------------------------
            let S10 = function(tel_Id) {
                let this_S10 = this
                this_S10.tel_Id = tel_Id
                this_S10.instruments = {}
                this_S10.instruments.props = instruments.props[tel_Id]
                this_S10.tau_frac = instruments.tau_fracs[tel_Id]
                this_S10.instruments.prop_titles = instruments.prop_titles[tel_Id]

                let my_date = Date.now() 
                let g_base = null
                let g_bck_arc = null
                let g_hierarchy = null
                let g_prop_lbl = null
                let g_trans = null
                let arcs = null
                let depth_click = null
                let parents = null
                let hierarchies = null

                this_S10.data_hierarchy = {}
                $.each(this_S10.instruments.props, function(index, porp_now) {
                    this_S10.data_hierarchy[porp_now] = null
                })

                this_S10.get_date = function() {
                    return my_date
                }

                let wh = (
                    instruments.data.xyr[tel_Id].r 
          * scale_r[1].inner_h1 * 1.6
                )

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function init() {
                    if (g_base) {
                        my_date = Date.now()
                    } 
                    else {
                        g_base = main_gs.g_base.append('g')

                        update_pos_g(0)

                        g_bck_arc = g_base.append('g')
                        g_prop_lbl = g_base.append('g')
                        // g_bck_arc.append("rect").attr("width",wh).attr("height",wh).style("stroke",'#2196F3' ).style("fill",'transparent' ).style("stroke-width", 0.1).attr("pointer-events",'none').attr("opacity",0.5);

                        parents = {}
                        depth_click = {}

                        arcs = {}
                        arcs.arc = {}
                        arcs.tween = {}
                        arcs.is_open = false
                        // arcs.in_prop = ''

                        g_hierarchy = {}
                        g_trans = {}
                        hierarchies = {}
                        $.each(base_node, function(index_data, data_base) {
                            let porp_now = data_base.id

                            if (this_S10.instruments.props.indexOf(porp_now) >= 0) {
                                g_trans[porp_now] = {}
                                g_hierarchy[porp_now] = {}
                                g_hierarchy[porp_now].hirch = g_base.append('g')
                                hierarchies[porp_now] = {}
                            }
                        })

                        // // expose the objects (must come after their initialization!)
                        this_S10.g_base = g_base
                        this_S10.arcs = arcs

                        // init_bck_arc();
                        init_hierarchy()
                    }

                    // console.log('click_bck_arc init')
                    // init_bck_arc(); // called from bck_arc_click on init anyway...
                }
                this_S10.init = init

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function update_pos_g(duration) {
                    let g_base_trans = [
                        instruments.data.xyr[tel_Id].x - wh / 2,
                        instruments.data.xyr[tel_Id].y - wh / 2,
                    ]

                    g_base
                        .transition('updtPos')
                        .duration(duration)
                        .attr('transform', function(d) {
                            return 'translate(' + g_base_trans[0] + ',' + g_base_trans[1] + ')'
                        })
                }
                this_S10.update_pos_g = update_pos_g

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function cleanup() {
                    g_base.remove()

                    g_base = null
                    g_bck_arc = null
                    g_hierarchy = null
                    g_prop_lbl = null
                    g_trans = null
                    arcs = null
                    depth_click = null
                    parents = null
                    hierarchies = null
                }
                this_S10.cleanup = cleanup

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function set_prop_lbl(opt_in) {
                    if (no_render) return

                    // due to delays from locker, this function could be called after the S10 has
                    // been removed - make a safety check using g_base...
                    if (!is_def(g_base)) return

                    let base_tag = 's10_arc'
                    let tag_lbl = base_tag + '_prop_lbl'
                    let prop_in = is_def(opt_in.prop_in) ? opt_in.prop_in : ''
                    let remove = is_def(opt_in.remove) ? opt_in.remove : false

                    if (prop_in !== '') {
                        if (this_S10.instruments.props.indexOf(prop_in) < 0) {
                            if (is_def(instruments.data.prop_parent_s1[tel_Id][prop_in])) {
                                prop_in = instruments.data.prop_parent_s1[tel_Id][prop_in]
                            }
                        }
                    }

                    let text_data = []
                    if (this_top.get_zoom_state() === 1 && !remove) {
                        $.each(this_S10.instruments.props, function(index, porp_now) {
                            let state = 0
                            if (prop_in !== '') {
                                state = prop_in === porp_now ? 1 : 2
                            }

                            let txt_r = (
                                instruments.data.xyr[tel_Id].r 
                * scale_r[1].inner_h1 * 1.45
                            )
                            let xy = get_prop_pos_shift(
                                'xy',
                                txt_r,
                                index,
                                this_S10.instruments.props.length
                            )

                            text_data.push({
                                id: tag_lbl + porp_now,
                                text: this_S10.instruments.prop_titles[porp_now],
                                h: 30 / zooms.len['1.3'],
                                xy: xy,
                                x: wh / 2 - xy[0],
                                y: wh / 2 - xy[1],
                                strk_w: state === 1 ? 3 : 0,
                                opac: state === 1 ? 0.9 : state === 2 ? 0.1 : 0.7,
                                anch:
                  Math.abs(xy[0] / instruments.data.xyr[tel_Id].r) < 0.001
                      ? 'middle'
                      : xy[0] < 0 ? 'start' : 'end',
                            })
                        })
                    }

                    let ele_h = null

                    let title = g_prop_lbl
                        .selectAll('text.' + tag_lbl)
                        .data(text_data, function(d) {
                            return d.id
                        })

                    title
                        .enter()
                        .append('text')
                    // .attr("id", function(d) { return my_unique_id+d.id; })
                        .text(function(d) {
                            return d.text
                        })
                        .attr('class', base_tag + ' ' + tag_lbl) // class list for easy selection
                        .style('opacity', '0')
                        .style('fill', '#383b42')
                        .attr('stroke-width', function(d) {
                            return d.strk_w
                        })
                        .style('stroke', function(d) {
                            return '#383b42'
                        })
                        .attr('vector-effect', 'non-scaling-stroke')
                        .style('pointer-events', 'none')
                        .style('font-weight', 'normal')
                        .attr('transform', function(d) {
                            return 'translate(' + d.x + ',' + d.y + ')'
                        })
                        .merge(title)
                        .style('font-size', function(d) {
                            return d.h + 'px'
                        })
                        .transition('update1')
                        .duration(times.anim_arc)
                        .attr('stroke-width', function(d) {
                            return d.strk_w
                        })
                        .attr('transform', function(d) {
                            return 'translate(' + d.x + ',' + d.y + ')'
                        })
                        .attr('text-anchor', function(d) {
                            return d.anch
                        })
                        .attr('dy', function(d) {
                            if (!is_def(ele_h)) {
                                ele_h = get_node_height_by_id({
                                    selction: g_prop_lbl.selectAll('text.' + tag_lbl),
                                    id: d.id,
                                    txt_scale: true,
                                })
                            }
                            return ele_h + 'px'
                        })
                        .style('opacity', function(d) {
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
                function init_bck_arc() {
                    if (no_render) return

                    // due to delays from locker, this function could be called after the S10 has
                    // been removed - make a safety check using g_base...
                    if (!is_def(g_base)) return

                    // console.log('init_bck_arc')
                    let props_now = instruments.data.prop_data_s1[tel_Id]
                    $.each(props_now, function(porp_now, data_now) {
                        if (data_now) {
                            let base_tag = 's10_arc'
                            let tag_now = base_tag + porp_now
                            // let is0 = 1

                            let n_prop = this_S10.instruments.props.indexOf(porp_now)
                            if (n_prop >= 0) {
                                if (!is_def(arcs[tag_now])) {
                                    arcs[tag_now] = {}
                                    arcs[tag_now].ang = {}
                                    arcs[tag_now].rad = {}

                                    arc_func[tag_now] = {}
                                    arc_func[tag_now].radN1 = function(d) {
                                        return 0
                                    }
                                    arc_func[tag_now].rad00 = function(d) {
                                        return instruments.data.xyr[tel_Id].r * scale_r[1].inner_h1 * 0.1
                                    }
                                    arc_func[tag_now].rad01 = function(d) {
                                        return instruments.data.xyr[tel_Id].r * scale_r[1].inner_h1 * 0.8
                                    }
                                    arc_func[tag_now].rad10 = function(d) {
                                        return instruments.data.xyr[tel_Id].r * scale_r[1].inner_h1 * 0.85
                                    }
                                    arc_func[tag_now].rad11 = function(d) {
                                        return instruments.data.xyr[tel_Id].r * scale_r[1].inner_h1 * 1.35
                                    }
                                    arc_func[tag_now].ang00 = function(d) {
                                        return n_prop * this_S10.tau_frac + instruments.tau_space
                                    }
                                    arc_func[tag_now].ang01 = function(d) {
                                        return (n_prop + 1) * this_S10.tau_frac - instruments.tau_space
                                    }
                                    arc_func[tag_now].ang10 = function(d) {
                                        return 0
                                    }
                                    arc_func[tag_now].ang11 = function(d) {
                                        return tau
                                    }
                                    arc_func[tag_now].ang20 = function(d) {
                                        return n_prop * this_S10.tau_frac
                                    }
                                    arc_func[tag_now].ang21 = function(d) {
                                        return (n_prop + 1) * this_S10.tau_frac
                                    }
                                }

                                let path = g_bck_arc
                                    .selectAll('path.' + tag_now).data([
                                        {
                                            id: tag_now + '0',
                                            porp_now: porp_now,
                                            nArc: 0,
                                            is_full: false,
                                            col: '',
                                        },
                                        {
                                            id: tag_now + '1',
                                            porp_now: porp_now,
                                            nArc: 1,
                                            is_full: false,
                                            col: '',
                                        },
                                    ])

                                // operate on new elements only
                                path
                                    .enter()
                                    .append('path')
                                    .style('stroke-width', '1')
                                // .attr("id",        function(d) { return my_unique_id+d.id; })
                                    .attr('class', function(d) {
                                        return base_tag + ' ' + tag_now + ' ' + d.id
                                    })
                                    .each(function(d, i) {
                                        arcs[tag_now].ang[d.id] = [
                                            arc_func[tag_now].ang00(d),
                                            arc_func[tag_now].ang01(d),
                                        ]
                                        arcs[tag_now].rad[d.id] = [
                                            arc_func[tag_now].rad00(d),
                                            arc_func[tag_now].rad00(d),
                                        ]
                                    })
                                    .style('stroke', '#383b42')
                                    .attr('vector-effect', 'non-scaling-stroke')
                                    .attr('transform', function(d) {
                                        return 'translate(' + wh / 2 + ',' + wh / 2 + ')'
                                    })
                                    .on('click', click)
                                // .on("mouseover", mouseover)
                                    .style('fill', get_col)
                                    .style('opacity', 0)
                                    .style('fill-opacity', 0)
                                    .merge(path)
                                    .each(function(d) {
                                        d.is_full = false
                                    })
                                    .transition('in_out')
                                    .duration(times.anim_arc)
                                    .delay(times.anim_arc)
                                    .style('opacity', function(d) {
                                        return d.nArc === 0 ? 1 : 0
                                    })
                                    .style('fill', get_col)
                                    .style('fill-opacity', function(d) {
                                        return d.nArc === 0 ? 0.5 : 0
                                    })
                                    .style('stroke-opacity', function(d) {
                                        return d.nArc === 0 ? 0 : 0.3
                                    })
                                    .call(com.arc_tween, {
                                        tag_now: tag_now,
                                        arc_prev: arcs,
                                        ang_str_0: null,
                                        ang_str_1: 'ang00',
                                        ang_end_0: null,
                                        ang_end_1: 'ang01',
                                        r_in_0: null,
                                        r_in_1: 'rad00',
                                        r_out_0: null,
                                        r_out_1: 'rad01',
                                    })
                            }
                        }

                        //
                        function get_col(d) {
                            d.col =
                d.nArc === 0
                    ? inst_health_col(instruments.data.prop_data_s1[tel_Id][d.porp_now].val)
                    : '#383b42'
                            return d.col
                        }

                        //
                        function click(d) {
                            bck_arc_click({
                                click_in: is_click_in(d.porp_now),
                                prop_in: d.porp_now,
                            })
                        }
                    })

                    set_prop_lbl({ prop_in: '' })
                }
                this_S10.init_bck_arc = init_bck_arc

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                let prev_focused_prop = ''
                function is_click_in(prop_in) {
                    return prev_focused_prop !== prop_in
                }
        
                function set_prev_prop(prop_in) {
                    prev_focused_prop = prop_in
                }

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function bck_arc_remove() {
                    if (no_render) return

                    // due to delays from locker, this function could 
                    // be called after the S10 has been removed
                    // - make a safety check using g_base...
                    if (!is_def(g_base)) return

                    locker.add('s10_bck_arc_change')

                    //
                    hierarchy_style_click({ prop_in: '', id: '', is_open: false })

                    //
                    $.each(this_S10.instruments.props, function(index, porp_now) {
                        let base_tag = 's10_arc'
                        let tag_now = base_tag + porp_now
                        let path = g_bck_arc.selectAll('path.' + tag_now)

                        path
                            .transition('in_out')
                            .duration(times.anim_arc)
                            .style('opacity', 0)
                            .call(com.arc_tween, {
                                tag_now: tag_now,
                                arc_prev: arcs,
                                ang_str_0: null,
                                ang_str_1: 'ang00',
                                ang_end_0: null,
                                ang_end_1: null,
                                r_in_0: null,
                                r_in_1: 'rad00',
                                r_out_0: null,
                                r_out_1: 'rad00',
                            })
                            .remove()
                    })

                    set_prev_prop('')
                    locker.remove('s10_bck_arc_change')

                    set_prop_lbl({ prop_in: '', remove: true })

                    hierarchy_hov_title_out(null)
                }
                this_S10.bck_arc_remove = bck_arc_remove

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function bck_arc_click(opt_in) {
                    // due to delays from locker, this function could be 
                    // called after the S10 has been removed 
                    // - make a safety check using g_base...
                    if (!is_def(g_base)) return

                    let click_in = opt_in.click_in
                    let prop_in = opt_in.prop_in
                    let only_open = is_def(opt_in.only_open) ? opt_in.only_open : false
                    let can_ignore = is_def(opt_in.can_ignore) ? opt_in.can_ignore : true

                    if (this_S10.instruments.props.indexOf(prop_in) < 0 && prop_in != '') return

                    if (
                        !locker.are_free([
                            's10_bck_arc_change',
                            'data_change',
                            's10_click_hierarchy',
                        ])
                    ) {
                        if (!can_ignore) {
                            setTimeout(function() {
                                bck_arc_click(opt_in)
                            }, times.anim_arc / 3)
                        }
                        return
                    }

                    locker.add({ id: 's10_bck_arc_change', override: true })
                    function free_me(do_delay) {
                        locker.remove({
                            id: 's10_bck_arc_change',
                            delay: do_delay ? times.anim_arc * 1.5 : 0,
                            override: true,
                        })
                    }

                    set_prop_lbl({ prop_in: prop_in })

                    set_prev_prop(prop_in)

                    // ------------------------------------------------------------------
                    //
                    // ------------------------------------------------------------------
                    $.each(this_S10.instruments.props, function(index, porp_now) {
                        let base_tag = 's10_arc'
                        let tag_now = base_tag + porp_now
                        let path0 = g_bck_arc.selectAll('path.' + tag_now + '0')
                        let path1 = g_bck_arc.selectAll('path.' + tag_now + '1')

                        if (prop_in === porp_now) {
                            full_arcs(path0, path1, tag_now, click_in)
                        } else {
                            hide_arcs(path0, tag_now)
                            hide_arcs(path1, tag_now)
                        }
                    })

                    if (only_open && click_in) {
                        free_me(true)
                        return
                    }

                    if (!click_in && depth_click[prop_in] > 0) {
                        let parent_name = ''
                        $.each(hierarchies[prop_in], function(id_now, data_now) {
                            if (data_now.child_depth === depth_click[prop_in]) {
                                parent_name = data_now.parent_name
                            }
                        })

                        hierarchy_style_click({
                            prop_in: prop_in, id: parent_name, is_open: true,
                        })
            
                        props_s1({
                            tel_Id: tel_Id,
                            click_in: true,
                            prop_in: parent_name,
                            do_func: [ 'tel_hierarchy' ],
                            debug: 'bck_arc_click',
                        })

                        free_me(true)
            
                        return
                    } 
                    else {
                        // console.log('tog_hierarchy',prop_in,'--',depth_click[prop_in],click_in)

                        hierarchy_style_click({
                            prop_in: prop_in, id: prop_in, is_open: click_in,
                        })

                        props_s1({
                            tel_Id: tel_Id,
                            click_in: click_in,
                            prop_in: prop_in,
                            do_func: [ 'tel_hierarchy' ],
                            debug: 'bck_arc_click',
                        })
                    }

                    if (!click_in) {
                        init_bck_arc()
                        set_prev_prop('')
                        free_me(true)
                        return
                    }

                    //
                    if (click_in) {
                        this_top.zoom_to_target_main({
                            target: tel_Id,
                            scale: zooms.len['1.2'],
                            duration_scale: 1,
                        })
                    }

                    free_me(true)
                }
                this_S10.bck_arc_click = bck_arc_click

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function full_arcs(path0, path1, tag_now, is_open) {
                    if (no_render) return

                    path0
                        .transition('in_out')
                        .duration(times.anim_arc)
                        .style('opacity', 1)
                        .style('fill', '#383b42')
                        .style('fill-opacity', 0.06)
                    // .style("fill-opacity", 0.2)
                        .each(function(d) {
                            d.is_full = true
                        })
                        .call(com.arc_tween, {
                            tag_now: tag_now,
                            arc_prev: arcs,
                            ang_str_0: null,
                            ang_str_1: 'ang10',
                            ang_end_0: null,
                            ang_end_1: 'ang11',
                            r_in_0: null,
                            r_in_1: 'radN1',
                            r_out_0: null,
                            r_out_1: 'rad01',
                        })

                    path1
                        .transition('in_out')
                        .duration(times.anim_arc / 2)
                        .call(com.arc_tween, {
                            tag_now: tag_now,
                            arc_prev: arcs,
                            ang_str_0: null,
                            ang_str_1: null,
                            ang_end_0: null,
                            ang_end_1: null,
                            r_in_0: null,
                            r_in_1: 'rad10',
                            r_out_0: null,
                            r_out_1: 'rad11',
                        })
                        .style('fill-opacity', 0.07)
                        .style('opacity', 1)
                        .transition('in_out')
                        .duration(times.anim_arc / 2)
                        .call(com.arc_tween, {
                            tag_now: tag_now,
                            arc_prev: arcs,
                            ang_str_0: null,
                            ang_str_1: 'ang20',
                            ang_end_0: null,
                            ang_end_1: 'ang21',
                            r_in_0: null,
                            r_in_1: null,
                            r_out_0: null,
                            r_out_1: null,
                        })
                }

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function hide_arcs(path, tag_now) {
                    if (no_render) return

                    path
                        .transition('in_out')
                        .duration(times.anim_arc / 2)
                        .style('opacity', 0)
                        .call(com.arc_tween, {
                            tag_now: tag_now,
                            arc_prev: arcs,
                            ang_str_0: null,
                            ang_str_1: null,
                            ang_end_0: null,
                            ang_end_1: null,
                            r_in_0: null,
                            r_in_1: 'radN1',
                            r_out_0: null,
                            r_out_1: 'radN1',
                        })
                }

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function hierarchy_hov_title_in(dIn) {
                    if (no_render) return

                    if (
                        !locker.are_free([
                            's10_bck_arc_change',
                            'data_change',
                            's10_click_hierarchy',
                        ])
                    ) {
                        return
                    }

                    hierarchy_hov_title_out(null)

                    let r = tel_rs.s00[2] * scale_r[1].inner_h1 / 3.5
                    let dx = wh / 2
                    let dy = (
                        wh + 2 * r 
            * instruments.data.xyr[tel_Id].r 
            / tel_rs.s00[2]
                    )

                    g_base
                        .selectAll('text.' + 'hov_title')
                        .data([{ id: dIn.data.id }], function(d) {
                            return d.id
                        })
                        .enter()
                        .append('text')
                        .attr('class', 'hov_title')
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
                        .attr('transform', function(d, i) {
                            return 'translate(' + dx + ',' + dy + ')'
                        })
                        .attr('dy', function(d) {
                            let ele_h =
                -0.5 *
                get_node_height_by_id({
                    selction: g_base.selectAll('text.' + 'hov_title'),
                    id: d.id,
                })
                            return ele_h + 'px'
                        })
                        .transition('update1')
                        .duration(times.anim_arc)
                        .style('opacity', 1)
                }

                // ------------------------------------------------------------------
                // 
                // ------------------------------------------------------------------
                function hierarchy_hov_title_out(dIn) {
                    if (no_render) return

                    g_base
                        .selectAll('text.' + 'hov_title')
                        .filter(function(d) {
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
                function init_hierarchy() {
                    if (no_render) return

                    // due to delays from locker, this function could be 
                    // called after the S10 has been removed 
                    // - make a safety check using g_base...
                    if (!is_def(g_base)) return

                    $.each(base_node, function(index_data, data_base) {
                        let porp_now = data_base.id

                        let get_child = {}
                        let hierarchy_by_id = {}
                        let max_depth = 0

                        function get_all_children(d) {
                            return d['child' + String(d.child_depth)]
                        }

                        function rename_children(data_now, depth_in, parent_name) {
                            if (!is_def(depth_in)) depth_in = -1
                            if (!is_def(parent_name)) parent_name = null

                            let depth_now = depth_in
                            depth_now++
                            max_depth = Math.max(depth_now, max_depth)

                            let child_mame = 'child' + String(depth_now)

                            // access function
                            if (!is_def(get_child[child_mame])) {
                                get_child[child_mame] = function(d) {
                                    return d[child_mame]
                                }
                            }

                            // internal variables to keep track of the depth, name of the parent
                            data_now.child_depth = depth_now
                            data_now.parent_name = parent_name
                            parent_name = data_now.id

                            // modify children names and go one level deeper if needed
                            if (data_now.children) {
                                // console.log('+++++',data_now.id,child_mame,data_now);
                                if (!is_def(g_hierarchy[porp_now][data_now.id])) {
                                    // the baseline g element (parent g from the hirch, or else the first one)
                                    let parent_name_now = data_now.parent_name
                                        ? data_now.parent_name
                                        : 'hirch'

                                    // new baseline g element which may get child-g elements from the hirch
                                    let g_now = (
                                        g_hierarchy[porp_now][parent_name_now]
                                            .append('g')
                                    )
                                    g_hierarchy[porp_now][data_now.id] = g_now
                                    // the first g elelment into which all circles will be appended (so that they
                                    // are  always at the top of the g element, before any child-g elements)
                                    g_now = (
                                        g_hierarchy[porp_now][data_now.id]
                                            .append('g')
                                    )
                                    g_hierarchy[porp_now][data_now.id + 'circ'] = g_now
                                }

                                data_now[child_mame] = data_now.children
                                // data_now.children   = null;
                                data_now[child_mame].forEach(function(d) {
                                    rename_children(d, depth_now, parent_name)
                                })

                                hierarchy_by_id[data_now.id] = d3
                                    .hierarchy(data_now, get_child[child_mame])
                                    .sum(function(d) {
                                        return 1
                                    })
                                hierarchies[porp_now][data_now.id] = data_now
                                // console.log('--',data_now.id,child_mame,data_now)
                            }
                        }

                        if (this_S10.instruments.props.indexOf(porp_now) >= 0) {
                            rename_children(data_base)

                            this_S10.data_hierarchy[porp_now] = data_base
                            // console.log(data_base)

                            $.each(hierarchy_by_id, function(hierarchy_name, hierarchy_now) {
                                let pack_node = d3
                                    .pack()
                                    .size([ wh, wh ])
                                    .padding(1.5 * site_scale)
                                pack_node(hierarchy_now)
                            })

                            parents[porp_now] = {}
                            depth_click[porp_now] = 0

                            let hierarchy_all = d3.hierarchy(
                                data_base, get_all_children
                            )
                            let descend = hierarchy_all.descendants()
              
                            $.each(descend, function(index, data_now) {
                                let name_now = data_now.data.id
                                if (!is_def(parents[porp_now][name_now])) {
                                    parents[porp_now][name_now] = [ name_now ]
                                }

                                let parent_now = data_now.parent
                                while (parent_now) {
                                    parents[porp_now][name_now].push(parent_now.data.id)
                                    parent_now = parent_now.parent
                                }
                            })
                            hierarchy_all = null
                            // console.log('parents -',parents)

                            for (let depth_now = 0; depth_now < max_depth; depth_now++) {
                                $.each(hierarchy_by_id, function(hierarchy_name, hierarchy_now) {
                                    if (hierarchy_now.data.child_depth !== depth_now) return
                                    // console.log(hierarchy_name,hierarchy_now.data.child_depth,hierarchy_now)

                                    let parent_name = hierarchy_now.data.parent_name
                                    if (parent_name != null) {
                                        let parent = hierarchy_by_id[parent_name]
                                        $.each(parent.children, function(index, child_now) {
                                            // console.log('---- ',parent_name,parent_name,child_now.data.id,child_now)
                                            if (child_now.data.id === hierarchy_name) {
                                                let parentR = child_now.r / (wh / 2)
                                                let parentX = child_now.x - child_now.r
                                                let parentY = child_now.y - child_now.r

                                                // console.log('move-g in(',parent_name,'):  ',hierarchy_name)
                                                g_trans[porp_now][hierarchy_name] =
                          'translate(' +
                          parentX +
                          ',' +
                          parentY +
                          ')scale(' +
                          parentR +
                          ')'
                                                g_hierarchy[porp_now][hierarchy_name].attr(
                                                    'transform',
                                                    g_trans[porp_now][hierarchy_name]
                                                )
                                            }
                                        })
                                    }

                                    // console.log('hierarchy_name',hierarchy_name,depth_click)
                                    g_hierarchy[porp_now][hierarchy_name + 'circ']
                                        .selectAll('circle.' + hierarchy_name)
                                        .data(hierarchy_now.descendants())
                                        .enter()
                                        .append('circle')
                                        .attr('class', hierarchy_name)
                                    // .attr("id",            function(d){ return my_unique_id+hierarchy_name+"_"+d.data.id; })
                                        .style('opacity', function(d) {
                                            return hierarchy_style_opac(d, hierarchy_now, 0)
                                        })
                                        .style('stroke', function(d) {
                                            return hierarchy_style_stroke(d, hierarchy_now, 0)
                                        })
                                        .style('stroke-width', function(d) {
                                            return hierarchy_strk_w(d, hierarchy_now, 0)
                                        })
                                        .style('fill', function(d) {
                                            return hierarchy_style_fill(d, hierarchy_now, 0)
                                        })
                                        .attr('cx', function(d) {
                                            return d.x
                                        })
                                        .attr('cy', function(d) {
                                            return d.y
                                        })
                                        .attr('r', 0)
                                        .attr('vector-effect', 'non-scaling-stroke')
                                        .attr('pointer-events', function(d) {
                                            return d.data.child_depth === 1 ? 'auto' : 'none'
                                        })
                                        .on('click', click)
                                        .on('mouseover', hierarchy_hov_title_in)
                                        .on('mouseout', hierarchy_hov_title_out)
                                    // .on('mouseover', function(d){ console.log(d.data.id,d); })
                                    // .transition("in_out").duration(times.anim_arc)
                                    // .attr("r",             function(d,i){ return d.r; });

                                    function click(d) {
                                        if (
                                            !locker.are_free([
                                                's10_bck_arc_change',
                                                'data_change',
                                                's10_click_hierarchy',
                                            ])
                                        ) {
                                            return
                                        }

                                        hierarchy_style_click({
                                            prop_in: porp_now,
                                            id: d.data.id,
                                            is_open: true,
                                        })
                    
                                        props_s1({
                                            tel_Id: tel_Id,
                                            click_in: true,
                                            prop_in: d.data.id,
                                            debug: 'hirch_click',
                                        })

                                        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                                        // FIXME:
                                        // here we can set non this_S10.instruments.props names if needed.....
                                        // console.log('_setPropLblInit_hierarchy',d.data.id); set_prop_lbl({ prop_in:d.data.id });
                                        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                                    }
                                })
                            }
                        }
                    })
                }
                this_S10.init_hierarchy = init_hierarchy

                // setTimeout(function() {
                //   console.log('==========================')
                //   porp_now = "mirror"
                //   // hierarchy_name = "mirror_1_1"
                //   hierarchy_name = porp_now
                //   hierarchy_style_click({ prop_in:porp_now, id:hierarchy_name is_open:true })

                // }, 4000);

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function hierarchy_style_click(opt_in) {
                    if (no_render) return
                    if (!is_def(g_base)) return

                    if (!locker.are_free([
                        'data_change', 's10_click_hierarchy',
                    ])) {
                        setTimeout(function() {
                            hierarchy_style_click(opt_in)
                        }, times.anim_arc / 3)
                        return
                    }

                    locker.add({ id: 's10_click_hierarchy', override: true })
                    function free_me(do_delay) {
                        locker.remove({
                            id: 's10_click_hierarchy',
                            delay: do_delay ? times.anim_arc * 1.5 : 0,
                            override: true,
                        })
                    }

                    let id = opt_in.id
                    let prop_in = opt_in.prop_in
                    let is_open = opt_in.is_open
                    let sync_prop = (
                        is_def(opt_in.sync_prop) ? opt_in.sync_prop : opt_in.id
                    )
                    // console.log('clk',id,'==',prop_in,'--', hierarchies[prop_in])

                    if (this_top.get_zoom_state() === 1) {
                        let arr_zoomer_prop = is_open ? sync_prop : ''
                        sync_state_send({
                            type: 'sync_arr_zoomer_prop',
                            sync_time: Date.now(),
                            tel_Id: zooms.target,
                            propId: arr_zoomer_prop,
                        })
                    }

                    if (prop_in === '' || !is_def(prop_in)) {
                        $.each(g_hierarchy, function(porp_all_now, g_hierarchy_now) {
                            g_hierarchy_now.hirch
                                .selectAll('circle')
                                .transition('updt')
                                .duration(times.anim_arc)
                                .style('stroke', 'transparent')
                                .attr('r', 0)

                            $.each(g_hierarchy_now, function(hierarchy_name, g_now) {
                                g_now
                                    .transition('in_out')
                                    .duration(times.anim_arc)
                                    .attr('transform', 
                                        g_trans[porp_all_now][hierarchy_name])
                            })
                        })

                        free_me(true)
                        return
                    }

                    if (
                        !is_def(g_hierarchy[prop_in][id]) ||
            !is_def(hierarchies[prop_in][id])
                    ) {
                        free_me(true)
                        return
                    }

                    let depth_now = hierarchies[prop_in][id].child_depth
                    let child_depth = depth_now + 1

                    depth_click[prop_in] = depth_now

                    $.each(g_hierarchy, function(porp_all_now, g_hierarchy_now) {
                        function is_out(d) {
                            let in_parents = (
                                parents[porp_all_now][d.data.id].indexOf(id) >= 0
                            )
                            return (
                                is_open 
                && in_parents 
                && (d.data.child_depth > depth_now)
                            )
                        }

                        g_hierarchy_now.hirch
                            .selectAll('circle')
                            .transition('updt')
                            .duration(times.anim_arc)
                            .attr('r', function(d) {
                                return is_out(d) ? d.r : 0
                            })
                            .attr('pointer-events', function(d) {
                                return is_out(d) && d.data.child_depth === child_depth
                                    ? 'auto'
                                    : 'none'
                            })
                            .style('opacity', function(d) {
                                return hierarchy_style_opac(d, d, child_depth)
                            })
                            .style('stroke', function(d) {
                                return is_out(d)
                                    ? hierarchy_style_stroke(d, d, child_depth)
                                    : 'transparent'
                            })
                            .style('stroke-width', function(d) {
                                return hierarchy_strk_w(d, d, child_depth)
                            })
                            .style('fill', function(d) {
                                return hierarchy_style_fill(d, d, child_depth)
                            })
                    })

                    $.each(g_hierarchy, function(porp_all_now, g_hierarchy_now) {
                        $.each(g_hierarchy_now, function(hierarchy_name, g_now) {
                            let in_parents = (
                                parents[prop_in][id].indexOf(hierarchy_name) >= 0
                            )

                            g_now
                                .transition('in_out')
                                .duration(times.anim_arc)
                                .attr(
                                    'transform',
                                    in_parents
                                        ? 'translate(0,0)scale(1)'
                                        : g_trans[porp_all_now][hierarchy_name]
                                )
                        })
                    })

                    free_me(true)
                }
                this_top.hierarchy_style_click = hierarchy_style_click

                // ------------------------------------------------------------------
                //
                // ------------------------------------------------------------------
                function update_hierarchy(data_in) {
                    // due to delays from locker, this function could be called after the S10 has
                    // been removed - make a safety check using g_base...
                    if (!is_def(g_base)) return

                    if (
                        !locker.are_free([
                            's10_bck_arc_change',
                            's10_click_hierarchy',
                            'update_hierarchy',
                        ])
                    ) {
                        // console.log('will delay update_hierarchy',data_in);
                        setTimeout(function() {
                            update_hierarchy(data_in)
                        }, times.anim_arc / 3)
                        return
                    }
                    locker.add('update_hierarchy')

                    //
                    $.each(this_S10.instruments.props, function(index, porp_now) {
                        let base_tag = 's10_arc'
                        let tag_now = base_tag + porp_now
                        let path = g_bck_arc.selectAll('path.' + tag_now)

                        path
                            .transition('update_data')
                            .duration(times.anim_arc)
                            .each(function(d) {
                                if (d.nArc === 0) {
                                    d.col = inst_health_col(
                                        instruments.data.prop_data_s1[tel_Id][porp_now].val
                                    )
                                }
                            })
                            .style('fill', function(d) {
                                return d.is_full ? '#383b42' : d.col
                            })
                    })

                    //
                    $.each(g_hierarchy, function(porp_now, hierarchy_now) {
                        hierarchy_now.hirch
                            .selectAll('circle')
                            .each(function(d) {
                                if (is_def(data_in[d.data.id])) {
                                    // console.log('updt 111',d.data.id,d);
                                    d.data.val = data_in[d.data.id]
                                }
                            })
                            .transition('update_data')
                            .duration(times.anim_arc)
                            .style('fill', function(d) {
                                return hierarchy_style_fill(d, d, depth_click[porp_now] + 1)
                            })
                    })
                    // console.log('--------------------------------')

                    locker.remove('update_hierarchy')
                }
                this_S10.update_hierarchy = update_hierarchy

                // ------------------------------------------------------------------
                // utility functions
                // ------------------------------------------------------------------
                function hierarchy_style_fill(d, d_ref, depth) {
                    return d_ref.data.child_depth === depth && d.parent
                        ? inst_health_col(d.data.val)
                        : 'transparent'
                }
        
                function hierarchy_strk_w(d, d_ref, depth) {
                    if (!d.parent) return 0
                    else return d_ref.data.child_depth === depth ? 0 : 1
                }
        
                function hierarchy_style_stroke(d, d_ref, depth) {
                    return hierarchy_strk_w(d, d_ref, depth) < 0.0001
                        ? 'transparent'
                        : '#383b42'
                }
        
                function hierarchy_style_opac(d, d_ref, depth) {
                    return hierarchy_strk_w(d, d_ref, depth) < 0.0001 ? 0.9 : 1
                }
      
                return
            }

            s10 = new S10(zooms.target)
            s10_eles.push({ id: zooms.target, s10: s10 })
      
            ;(function() {
                if (s10_eles.length <= max_ele_keep) return

                let debug = false
                let s10_in = []
                let s10_out = []
                let s10_index_date = []

                $.each(s10_eles, function(index, ele_now) {
                    s10_index_date.push([ index, ele_now.s10.get_date() ])
                })

                s10_index_date.sort(function(a, b) {
                    return a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0
                })

                let dbg_txt = ''
                if (debug) {
                    $.each(s10_index_date, function(index, ele_now) {
                        dbg_txt += '[' + s10_eles[ele_now[0]].id + ' , '
                        dbg_txt += s10_eles[ele_now[0]].s10.get_date() + '] '
                    })
                    dbg_txt += ' ---> removing: '
                }

                $.each(s10_index_date, function(index, ele_now) {
                    if (index < max_ele_keep) s10_in.push(s10_eles[ele_now[0]])
                    else s10_out.push(s10_eles[ele_now[0]])

                    if (debug) {
                        if (index >= max_ele_keep) 
                            dbg_txt += s10_eles[ele_now[0]].id + ' '
                    }
                })
                if (debug) console.log('- Sorted:', dbg_txt)

                s10_eles = s10_in

                $.each(s10_out, function(index, ele_now) {
                    // console.log('- removing:',index,ele_now.id,ele_now.s10,ele_now.s10.g_base)
                    ele_now.s10.cleanup()
                    ele_now.s10 = null

                    if (is_def(instruments.data.prop_data_s1[ele_now.id])) {
                        delete instruments.data.prop_data_s1[ele_now.id]
                        delete instruments.data.prop_parent_s1[ele_now.id]
                        delete instruments.data.prop_title_s1[ele_now.id]
                        delete instruments.data.data_base_s1[ele_now.id]
                    }
                })

                s10_in = null
                s10_out = null
                s10_index_date = null
            })()
        }

        s10.init()
  
        return
    }
    this_top.s10_main = s10_main

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function bck_arc_click(opt_in) {
        $.each(s10_eles, function(index, ele_now) {
            if (ele_now.id === zooms.target) {
                ele_now.s10.bck_arc_click(opt_in)
            }
        })
        return
    }
    this_top.bck_arc_click = bck_arc_click

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_s1(data_in) {
        $.each(s10_eles, function(index, ele_now) {
            if (ele_now.id === data_in.id) {
                ele_now.s10.update_hierarchy(data_in.data)
            }
        })
        return
    }
    this_top.update_s1 = update_s1

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_state_once() {
    // console.log('set_state_main main',this_top.get_scale())
        let scale = this_top.get_scale()
        let zoom_state = this_top.get_zoom_state()

        if (zoom_state === 0) {
            s10_main(null)
        }

        if (scale <= zooms.len['0.1']) {
            update_map({})
            s00_title([], [])
            s01_inner([])
            s01_outer([])
        } else {
            // let zoom_targetIndex = instruments.data.id_indices[zooms.target];
            // let arr_props_target = [ instruments.data.tel[zoom_targetIndex] ];

            let arr_props_on = []
            let arr_props_off = []
            let arr_props_target = []
            $.each(instruments.data.tel, function(index, data_now) {
                if (zooms.target === data_now.id || !is_def(links_2.xyz[zooms.target])) {
                    zooms.target = data_now.id
                    arr_props_on.push(data_now)
                    arr_props_target.push(data_now)
                } else {
                    // arr_props_off.push(data_now)
                    if (links_2.xyz[zooms.target].indexOf(data_now.id) < 0) {
                        arr_props_off.push(data_now)
                    } else {
                        arr_props_on.push(data_now)
                    }
                }
            })

            update_map({
                focus_0: arr_props_on, focus_1: arr_props_target,
            })

            if (zoom_state === 0) {
                s01_inner(arr_props_target)
                s01_outer(arr_props_on)

                s00_title(arr_props_on, [])
            } 
            else {
                s00_title(arr_props_on, arr_props_target)

                s01_inner(arr_props_target, arr_props_target)
                s01_outer(arr_props_on, arr_props_target)

                // ------------------------------------------------------------------
                // syncroniz changes with other panels
                // ------------------------------------------------------------------
                sync_state_send({
                    type: 'sync_tel_focus',
                    sync_time: Date.now(),
                    zoom_state: this_top.get_zoom_state(),
                    target: zooms.target,
                })
            }

            arr_props_target = null
        }
  
        return
    }
    this_top.set_state_once = set_state_once

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function update_map(opt_in) {
        let data_in = instruments.data.tel
        let g_now = com.s00.g
        let pos_tag = 'xyr'
        let focus_0 = is_def(opt_in.focus_0) ? opt_in.focus_0 : []
        let focus_1 = is_def(opt_in.focus_1) ? opt_in.focus_1 : []
        let tag_now = instruments.prop0

        let focus_ids = [
            focus_0.map(function(d) {
                return d.id
            }),
            focus_1.map(function(d) {
                return d.id
            }),
        ]
        function is_focused(d, n_focus) {
            return focus_ids[n_focus].indexOf(d.id) >= 0
        }

        if (no_render) return

        // operate on new elements only
        let circ = g_now
            .selectAll('circle.' + tag_now)
            .data(data_in, function(d) {
                return d.id
            })

        circ
            .enter()
            .append('circle')
            .attr('class', tag_now)
            .style('opacity', '0')
            .attr('r', function(d) {
                return 0
            })
            .style('stroke-width', '0.5')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('transform', function(d) {
                return (
                    'translate(' +
          instruments.data[pos_tag][d.id].x +
          ',' +
          instruments.data[pos_tag][d.id].y +
          ')'
                )
            })
            .merge(circ)
            .transition('in_out')
            .duration(times.anim_arc)
            .attr('transform', function(d) {
                return (
                    'translate(' +
          instruments.data[pos_tag][d.id].x +
          ',' +
          instruments.data[pos_tag][d.id].y +
          ')'
                )
            })
            .style('fill', function(d) {
                return inst_health_col(d[tag_now])
            })
            .style('stroke', function(d) {
                return inst_health_col(d[tag_now], 0.5)
            })
            .style('opacity', function(d) {
                if (is_focused(d, 1)) return 0.01
                else if (is_focused(d, 0)) return 0.07
                else return 1
            })
            .attr('r', function(d) {
                let r = instruments.data[pos_tag][d.id].r * scale_r[0].health2
                if (is_focused(d, 1)) return r * 2
                else if (is_focused(d, 0)) return r * 1.1
                else return r
            })
    
        return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function ask_data_s1() {
        let zoom_state = this_top.get_zoom_state()
        if (zoom_state === 0) return

        ele_base.sock_ask_data_s1({
            zoom_state: zoom_state,
            zoom_target: zooms.target,
        })
        return
    }
    this_top.ask_data_s1 = ask_data_s1

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function get_widget_state() {
        return {
            zoom_state: this_top.get_zoom_state(),
            zoom_target: zooms.target,
        }
        return
    }
    this_top.get_widget_state = get_widget_state

    return
}
