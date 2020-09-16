'use strict'
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// main_script_tag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    "/js/widget_"+main_script_tag+".js"
var main_script_tag = 'PanelSync'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global times */
/* global is_def */
/* global move_node_up */
/* global RunLoop */
/* global Locker */
/* global icon_badge */
/* global unique */
/* global dom_add */
/* global run_when_ready */
/* global vor_ploy_func */
/* global disable_scroll_svg */
/* global bck_pattern */
/* global ScrollGrid */

window.load_script({
    source: main_script_tag,
    script: '/js/utils/ScrollGrid.js',
})

// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 9
    let w0 = 12
    let div_key = 'main'

    opt_in.widget_func = {
        sock_func: sock_panel_sync,
        main_func: main_panel_sync,
    }
    opt_in.widget_div_id = opt_in.widget_id + 'widget_div'
    opt_in.ele_props = {
    }
    opt_in.ele_props[div_key] = {
        auto_pos: true,
        is_dark_ele: true,
        gs_id: opt_in.widget_div_id + div_key,
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        content: '<div id=\'' + opt_in.base_name + div_key + '\'></div>',
    }

    sock.add_to_table(opt_in)
}

// -------------------------------------------------------------------
// additional socket events for this particular widget type
// -------------------------------------------------------------------
let sock_panel_sync = function(opt_in) {
    let widget_type = opt_in.widget_type

    // -------------------------------------------------------------------
    // ask for update for state1 data for a given module
    // -------------------------------------------------------------------
    this.ask_data = function(opt_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        let emit_data = {
            widget_type: widget_type,
            widget_id: opt_in.widget_id,
            method_name: 'ask_data',
        }
        sock.socket.emit({
            name: 'widget',
            data: emit_data,
        })
    }

    // -------------------------------------------------------------------
    // ask for update for state1 data for a given module
    // -------------------------------------------------------------------
    this.groups_to_server = function(opt_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        let data = {
        }
        data.widget_id = opt_in.widget_id
        data.data = opt_in.data

        let emit_data = {
            widget_type: widget_type,
            widget_id: data.widget_id,
            method_name: 'set_client_sync_groups',
            method_args: data,
        }
        sock.socket.emit({
            name: 'widget',
            data: emit_data,
        })
    }
}

let main_panel_sync = function(opt_in) {
    // let my_unique_id = unique()
    let widget_type = opt_in.widget_type
    let tag_panel_sync_svg = opt_in.base_name
    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele

    // let this_panel_sync = this
    let is_south = window.SITE_TYPE === 'S'

    let sgv_tag = {
    }
    $.each(widget_ele, function(index, ele_now) {
        sgv_tag[ele_now.id] = {
            id: tag_panel_sync_svg + ele_now.id,
            widget: ele_now.widget,
            whRatio: ele_now.w / ele_now.h,
        }
    })

    // delay counters
    let locker = new Locker()
    locker.add('in_init')

    // function loop
    let run_loop = new RunLoop({
        tag: widget_id,
    })

    let update_data_evt = function(data_in) {
        if (data_in.metadata.widget_id !== widget_id) {
            return
        }
        update_data(data_in)
    }
    sock.socket.add_listener({
        name: 'update_data',
        func: update_data_evt,
        is_singleton: false,
    })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init_data(data_in) {
        let mult_inits = sock.multiple_inits({
            id: widget_id,
            data: data_in,
        })
        if (mult_inits) {
            return
        }

        sock.set_icon_badge({
            data: data_in,
            icon_divs: null,
        })
    
        svg_main.init_data(data_in.data)

        svg_main.set_allow_sync_state(data_in.data)
    }
    this.init_data = init_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_data(data_in) {
        svg_main.update_data(data_in.data)
    }
    this.update_data = update_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let SvgMain = function() {
        let this_top = this
        
        let com = {
        }
        let recs = {
        }
        let svg = {
        }
        let grps = {
        }

        let scale_r = {
        }
        scale_r[0] = {
        }
        scale_r[1] = {
        }

        scale_r[0].health_0 = 1.1
        scale_r[0].health_1 = 1.2
        scale_r[0].health_2 = 1.35
        scale_r[0].line_0 = 1.2
        scale_r[0].line_1 = 1.8
        scale_r[0].percent = 0.6
        scale_r[0].label = 1.95
        scale_r[0].title = 2.05

        scale_r[1].health_0 = 1.5
        scale_r[1].health_1 = 1.65
        scale_r[1].inner_h_0 = 1.25
        scale_r[1].inner_h_1 = 1.3

        this_top.scale_r = scale_r

        // sync_group_id_prefix, icon_prefix come from the server as part of init_data
        this_top.sync_group_id_prefix = ''
        this_top.sync_group_title_prefix = ''
        this_top.icon_prefix = ''

        this_top.empty_icn_tag = 'empty_icn'

        function get_grp_id(index_0, index_1) {
            let grp_id = this_top.sync_group_id_prefix + index_0
            if (is_def(index_1)) {
                grp_id += '_' + index_1
            }
            return grp_id
        }
        
        function get_icn_id(index_0, index_1, index_2) {
            let icn_id = this_top.icon_prefix + index_0
            if (is_def(index_1)) {
                icn_id += '_' + index_1
            }
            if (is_def(index_2)) {
                icn_id += '_' + index_2
            }
            return icn_id
        }


        function get_grp_title(n_grp) {
            return this_top.sync_group_title_prefix + n_grp
        }
        // let arc_prev = {}
        // arc_prev.ang = {}
        // arc_prev.rad = {}

        let site_scale = is_south ? 4 / 9 : 1

        let svg_dims = {
        }
        svg_dims.w = {
        }
        svg_dims.h = {
        }

        svg_dims.w[0] = 1000
        svg_dims.h[0] = svg_dims.w[0] / sgv_tag.main.whRatio

        svg_dims.r = {
        }
        svg_dims.r.s00 = [ 12, 13, 14 ]
        if (is_south) {
            svg_dims.r.s00 = [ 12 * site_scale, 13 * site_scale, 14 * site_scale ]
        }

        let zoom_len = {
        }
        zoom_len['0'] = 1
        zoom_len['1'] = 5

        // flag to add a new-group toggle box
        let can_tog_empty = true
        // let allowPermEmptyGrp = !false;

        // delay after a dragging event
        let delay_after_drag = 500
        // sllow this time to use the new empty group before a dataupdate removes it
        let delay_after_add_empty = 5000

        // some initializations
        com.add_empty_grp = false

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let tag_main = widget_type
        let tag_icon = tag_main + 'icons'
        let tag_circ = tag_main + 'tel_circ'
        let tag_ttl = tag_main + 'tel_title'
        let tag_vor = tag_main + 'tel_vor'
        let tag_grid_rec = tag_main + 'col_left'
        let tag_left_in = tag_main + 'data_in'
        let tag_empty = tag_main + 'empty'
        let tag_clip_path = tag_main + 'tag_clip_path'

        let wh = [ svg_dims.w[0], svg_dims.h[0] ]
        let side_col_w = wh[0] * 0.2
        let wh_pack = [ wh[0] - side_col_w, wh[1] ]
        let shift_main_g = [ side_col_w, 0 ]
        // let n_empty_icon = -1
        let n_empty_icon = null
        // n_empty_icon = 999 // set high for debugging...

        function groups_to_server() {
            let data = {
                id: 'all_groups',
                children: [],
            }

            update_empty_grp()

            $.each(grps.data.children, function(n_child_0, child_now_0) {
                if (is_empty_group(child_now_0.id)) {
                    return
                }
                let children_now = []
                $.each(child_now_0.children, function(n_child_1, child_now_1) {
                    children_now.push([])
                    $.each(child_now_1.children, function(n_child_2, child_now_2) {
                        if (child_now_2.n_icon >= 0) {
                            children_now[n_child_1].push([
                                child_now_2.trg_widg_id, child_now_2.id,
                            ])
                        }
                        // console.log('XXX 0 -',[n_child_0, n_child_1, n_child_2], child_now_2.trg_widg_id, child_now_2.id, )
                    })
                })

                data.children.push({
                    id: child_now_0.id,
                    title: child_now_0.title,
                    children: children_now,
                })
            })

            sock.widget_funcs[widget_type].sock_func.groups_to_server({
                widget_id: widget_id,
                data: data,
            })

            return
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_data(data_in) {
            grps.data = data_in.groups
            this_top.sync_group_id_prefix = data_in.sync_group_id_prefix
            this_top.sync_group_title_prefix = data_in.sync_group_title_prefix
            this_top.icon_prefix = data_in.icon_prefix

            if (is_def(svg.svg)) {
                return
            }

            // -------------------------------------------------------------------
            // create the main svg element
            // -------------------------------------------------------------------
            let svg_div_id = sgv_tag.main.id + 'svg'
            let svg_div = sgv_tag.main.widget.get_ele(svg_div_id)

            if (!is_def(svg_div)) {
                let parent = sgv_tag.main.widget.get_ele(sgv_tag.main.id)
                let svg_div = document.createElement('div')
                svg_div.id = svg_div_id

                dom_add(parent, svg_div)

                run_when_ready({
                    pass: function() {
                        return is_def(sgv_tag.main.widget.get_ele(svg_div_id))
                    },
                    execute: function() {
                        init_data(data_in)
                    },
                })

                return
            }
            sock.emit_mouse_move({
                eleIn: svg_div,
                data: {
                    widget_id: widget_id,
                },
            })

            svg.svg = d3
                .select(svg_div)
                // .classed("svgInGridStack_outer", true)
                .style('background', '#383B42')
                .append('svg')
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .attr('viewBox', '0 0 ' + svg_dims.w[0] + ' ' + svg_dims.h[0])
                .style('position', 'relative')
                .style('width', '100%')
                .style('height', '100%')
                .style('top', '0px')
                .style('left', '0px')
                .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
                // .call(com.svg_zoom)
                // .on("dblclick.zoom", null)

            if (disable_scroll_svg) {
                svg.svg.on('wheel', function(event) {
                    event.preventDefault()
                })
            }

            svg.g = svg.svg.append('g')
            svg.overlay = svg.svg.append('g')

            // add one circle as background
            // -------------------------------------------------------------------
            svg.g
                .append('g')
                .selectAll('rect')
                .data([ 0 ])
                .enter()
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', svg_dims.w[0])
                .attr('height', svg_dims.h[0])
                .attr('fill', '#F2F2F2')

            // the background grid
            bck_pattern({
                com: com,
                g_now: svg.g,
                g_tag: 'hex',
                len_wh: [ svg_dims.w[0], svg_dims.h[0] ],
                opac: 0.1,
                hex_r: 15,
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            svg.rec_g = svg.g.append('g')
            recs.g_base = svg.rec_g.append('g')
            recs.data_g = svg.rec_g.append('g')

            svg.main_g = svg.g.append('g')

            com.vor = {
            }
            com.vor.g = svg.main_g.append('g')

            com.empty = {
            }
            com.empty.g = svg.main_g.append('g')

            com.icons = {
            }
            com.icons.g = svg.main_g.append('g')

            com.highlight = {
            }
            com.highlight.g = svg.main_g.append('g')

            svg.main_g.attr(
                'transform',
                'translate(' + shift_main_g[0] + ',' + shift_main_g[1] + ')'
            )

            // // for debugging
            // svg.main_g.append("g").selectAll("rect").data([0])
            //   .enter()
            //   .append("rect")
            //     .attr("x", 0).attr("y", 0)
            //     .attr("width", wh_pack[0])
            //     .attr("height", wh_pack[1])
            //     .attr("fill", "transparent")
            //     .style("stroke", cols_purples[4] )
            //     .style("pointer-events", "none")

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            function do_drag_main_start(d_in, this_ele) {
                move_node_up(this_ele, 2)

                com.icons.g.selectAll('g.' + tag_icon).style('pointer-events', 'none')

                com.icons.g
                    .selectAll('circle.' + tag_circ)
                    .style('pointer-events', 'none')

                grps.hov_id_icon = d_in.data.id
                grps.hov_id_grp_start = d_in.parent.data.id
            }

            com.drag_main_start = function(event, d_in, this_ele) {
                locker.add({
                    id: tag_main + 'in_drag',
                    override: true,
                })

                do_drag_main_start(d_in, this_ele)
            }

            com.drag_main_during = function(event, d_in, this_ele) {
                d3.select(this_ele).attr('transform', function(d) {
                    d.x = event.x
                    d.y = event.y
                    return 'translate(' + d.x + ',' + d.y + ')'
                })
            }

            function do_drag_main_end(d_in, _) {
                com.icons.g
                    .selectAll('g.' + tag_icon)
                    .style('pointer-events', icon_pnt_evt)

                com.icons.g
                    .selectAll('circle.' + tag_circ)
                    .style('pointer-events', 'auto')

                update_groups()
                rm_duplicates()
                groups_to_server()

                grps.hov_id_grp_start = null
            }

            com.drag_main_end = function(event, d_in, this_ele) {
                do_drag_main_end(d_in, this_ele)

                locker.remove({
                    id: tag_main + 'in_drag',
                    override: true,
                    delay: delay_after_drag,
                })
            }

            com.drag_main = d3
                .drag()
                .on('start', function(e, d) {
                    com.drag_main_start(e, d, this)
                })
                .on('drag', function(e, d) {
                    com.drag_main_during(e, d, this)
                })
                .on('end', function(e, d) {
                    com.drag_main_end(e, d, this)
                })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let icon_side = null
            let icon_side_sel = null
            com.drag_side_start = function(event, d_in) {
                locker.add({
                    id: tag_main + 'in_drag',
                    override: true,
                })

                let id_side = side_col_click(d_in)
                let icons = com.hirch_desc.filter(function(d) {
                    return d.data.id === id_side
                })

                icon_side = icons.length === 0 ? null : icons[0]
                icon_side_sel = (
                    icons.length === 0
                        ? null
                        : svg.main_g.select('#' + id_side)
                )

                if (is_def(icon_side_sel)) {
                    move_node_up(icon_side_sel.node(), 2)

                    icon_side_sel
                        .transition('in_out')
                        .duration(times.anim / 5)
                        .attr('transform', function(d) {
                            d.x = event.x - shift_main_g[0]
                            d.y = event.y - shift_main_g[1]
                            return 'translate(' + d.x + ',' + d.y + ')'
                        })
                }

                if (is_def(icon_side)) {
                    do_drag_main_start(icon_side, this)
                }

                return
            }

            com.drag_side_during = function(event, d_in) {
                if (!is_def(icon_side)) {
                    return
                }

                icon_side_sel.attr('transform', function(d) {
                    d.x = event.x - shift_main_g[0]
                    d.y = event.y - shift_main_g[1]
                    return 'translate(' + d.x + ',' + d.y + ')'
                })
             
                return
            }

            com.drag_side_end = function(event, d_in) {
                do_drag_main_end(icon_side, this)

                icon_side = null
                icon_side_sel = null

                locker.remove({
                    id: tag_main + 'in_drag',
                    override: true,
                    delay: delay_after_drag,
                })
            
                return
            }

            com.drag_side = d3
                .drag()
                .on('start', com.drag_side_start)
                .on('drag', com.drag_side_during)
                .on('end', com.drag_side_end)

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let marg = wh[1] * 0.025
            let w0 = side_col_w - marg * 2
            let h0 = wh[1] - marg * 2
            let x0 = marg
            let y0 = marg

            if (can_tog_empty) {
                h0 -= w0 + marg
                init_new_grp_side_tog({
                    g_trans_x: x0 - shift_main_g[0],
                    g_trans_y: y0 + h0 + marg,
                    rec_w: w0,
                })
            }

            recs.rec_opt = {
                id: tag_grid_rec,
                tag_clip_path: tag_clip_path,
                recs: recs,
                rec_data: [],
                g_box: recs.g_base,
                x0: x0,
                y0: y0,
                w0: w0,
                h0: h0,
                rec_h: w0 * 0.5,
                rec_w: w0 * 0.5,
                show_counts: false,
                is_horz: false,
                bck_rec_opt: {
                    texture_orient: '5/8',
                    front_prop: {
                        strk_opac: 0.2,
                    },
                },
                // vor_opt: { mouseover: side_col_hov, call: com.drag_side },
                vor_opt: {
                    mouseover: side_col_hov,
                    call: com.drag_side,
                },
                on_zoom: {
                    during: upd_side_col_on_zoom,
                    end: upd_side_col_on_zoom,
                },
                run_loop: run_loop,
                locker: locker,
                lockers: [ tag_main + 'update_data', tag_main + 'in_drag' ],
                lock_zoom: {
                    all: tag_grid_rec + 'zoom',
                    during: tag_grid_rec + 'zoom_during',
                    end: tag_grid_rec + 'zoom_end',
                },
            }

            com.scroll_grid = new ScrollGrid(recs.rec_opt)

            recs.data_g = com.scroll_grid.get_bck_data_g()
            recs.data_g.attr('clip-path', (
                'url(#' + tag_clip_path + tag_grid_rec + ')'
            ))

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            run_loop.push({
                tag: 'update_data',
                data: data_in.groups,
            })

            run_when_ready({
                pass: function() {
                    return locker.are_free(com.locker_updates)
                },
                execute: function() {
                    locker.remove('in_init')
                },
            })
        }
        this.init_data = init_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_allow_sync_state(data_in) {
            let isAcive = data_in.allow_panel_sync

            let tag_rec = 'overlay_rec'
            let rect = svg.overlay.selectAll('rect.' + tag_rec).data([ 0 ])

            rect
                .enter()
                .append('rect')
                .attr('class', tag_rec)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', svg_dims.w[0])
                .attr('height', svg_dims.h[0])
                .attr('fill', '#F2F2F2')
                // .attr("stroke-width", 0)
                .merge(rect)
                .attr('opacity', isAcive ? 0 : 0.7)
                .attr('pointer-events', isAcive ? 'none' : 'auto')

            // the background grid
            bck_pattern({
                com: com,
                g_now: svg.overlay,
                g_tag: tag_rec,
                len_wh: [ svg_dims.w[0], svg_dims.h[0] ],
                opac: isAcive ? 0 : 0.2,
                circ_type: 'lighter',
            })
        }
        this.set_allow_sync_state = set_allow_sync_state

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function ask_data() {
            sock.widget_funcs[widget_type].sock_func.ask_data({
                widget_id: widget_id,
            })
        }
        this.ask_data = ask_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        com.locker_updates = [
            tag_main + 'data_change',
            tag_main + 'update_data',
            tag_main + 'update_groups',
            tag_main + 'added_empty_grp',
            tag_grid_rec + 'zoom',
        ]
        // -------------------------------------------------------------------
        run_loop.init({
            tag: 'update_data',
            func: update_data_once,
            n_keep: 1,
        })

        function update_data(data_in) {
            if (!locker.is_free('in_init')) {
                setTimeout(function() {
                    update_data(data_in)
                }, times.wait_loop)
                return
            }

            run_loop.push({
                tag: 'update_data',
                data: data_in,
            })
        }
        this.update_data = update_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function update_data_once(data_in) {
            if (!locker.is_free(tag_main + 'in_drag')) {
                return
            }

            if (!locker.are_free(com.locker_updates)) {
                // console.log('will delay _update_data_',locker.get_actives(com.locker_updates));
                setTimeout(function() {
                    update_data(data_in)
                }, times.anim / 2)
                return
            }

            locker.add(tag_main + 'update_data')
            locker.expires({
                id: tag_main + 'data_change',
                duration: delay_after_drag,
            })
            locker.expires({
                id: tag_main + 'click_empty_grp',
                duration: delay_after_drag,
            })

            // -------------------------------------------------------------------
            // use the original data for existing elements
            // -------------------------------------------------------------------
            let origs = {
            }
            $.each(grps.data.children, function(n_child_0, child_now_0) {
                $.each(child_now_0.children, function(n_child_1, child_now_1) {
                    $.each(child_now_1.children, function(n_child_2, child_now_2) {
                        if (child_now_2.n_icon !== n_empty_icon) {
                            origs[child_now_2.id] = child_now_2
                        }
                        // console.log('XXX 1 -',[n_child_0, n_child_1, n_child_2], child_now_2.trg_widg_id, child_now_2.id, )
                    })
                })
            })

            $.each(data_in.children, function(n_child_0, child_now_0) {
                $.each(child_now_0.children, function(n_child_1, child_now_1) {
                    $.each(child_now_1.children, function(n_child_2, child_now_2) {
                        if (is_def(origs[child_now_2.id])) {
                            data_in.children[n_child_0].children[n_child_1]
                                .children[n_child_2] = origs[child_now_2.id]
                        }
                        // console.log('XXX 2 -',[n_child_0, n_child_1, n_child_2], child_now_2.trg_widg_id, child_now_2.id, )
                    })
                })
            })

            // // preserve the original empty group, if it remains empty
            // // -------------------------------------------------------------------
            // update_empty_grp();

            // $.each(grps.data.children, function(n_child_0,child_now_0) {
            //   if(is_empty_group(child_now_0)) {
            //     let empty_grp_id = child_now_0.id;
            //     let allGrpIds  = data_in.children.map(function(d){ return d.id; });
            //     if(allGrpIds.indexOf(empty_grp_id) < 0) {
            //       data_in.children.push(child_now_0);
            //     }
            //   }
            // })

            // reference the new data in the local obj
            grps.data = data_in

            locker.remove({
                id: tag_main + 'update_data',
                delay: times.anim * 2,
            })

            // finally update, using the new data
            update_groups()
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_new_grp_side_tog(opt_in) {
            let g_trans_x = opt_in.g_trans_x
            let g_trans_y = opt_in.g_trans_y
            let rec_w = opt_in.rec_w

            com.empty.g.attr('transform', (
                'translate(' + g_trans_x + ',' + g_trans_y + ')'
            ))

            let data_empties = {
                id: 'empty_group',
                children: [
                    {
                        id: 'empty_group_0',
                        title: 'Add/remove',
                        children: [
                            {
                                id: 'empty_group_00',
                            },
                            {
                                id: 'empty_group_01',
                            },
                            {
                                id: 'empty_group_02',
                            },
                        ],
                    },
                ],
            }

            let hirch = d3.hierarchy(data_empties).sum(function(_) {
                return 1
            })
            let pack_node = d3
                .pack()
                .size([ rec_w, rec_w ])
                .padding(5)
            pack_node(hirch)

            let hirch_desc = hirch.descendants()

            let circ = com.empty.g
                .selectAll('circle.' + tag_empty)
                .data(hirch_desc, function(d) {
                    return d.data.id
                }) // console.log('xxx',d.data.id);

            circ
                .enter()
                .append('circle')
                // .attr("id", function(d,i) { return my_unique_id+tag_circ+"_"+d.data.id; })
                .attr('class', tag_empty)
                .attr('cx', function(d) {
                    return d.x
                })
                .attr('cy', function(d) {
                    return d.y
                })
                .style('opacity', 0)
                .attr('r', function(d) {
                    return d.r
                })
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .attr('stroke-width', function(d) {
                    d.data.strk_w = d.depth === 2 ? 2.0 : 0.5
                    return d.data.strk_w
                })
                .style('stroke', function(d) {
                    return hirch_style_stroke(d)
                })
                .style('fill', function(d) {
                    return hirch_style_fill(d)
                })
                .style('stroke-opacity', function(d) {
                    return hirch_opac_strk(d)
                })
                .style('fill-opacity', function(d) {
                    return hirch_opac_fill(d)
                })
                .merge(circ)
                .transition('out')
                .duration(times.anim)
                .style('opacity', 1)
                .attr('cx', function(d) {
                    return d.x
                })
                .attr('cy', function(d) {
                    return d.y
                })
                .attr('r', function(d) {
                    return d.r
                })

            circ
                .exit()
                .transition('out')
                .duration(times.anim / 2)
                .style('opacity', 0)
                .attr('stroke-width', 0)
                .style('fill-opacity', 0)
                .remove()

            set_ttl(hirch_desc)

            com.empty.g
                .selectAll('rect')
                .data([ 0 ])
                .enter()
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', rec_w)
                .attr('height', rec_w)
                .attr('stroke-width', 0)
                .attr('fill', 'transparent')
                .on('mouseover', function(_) {
                    // just in case...
                    grps.hov_id_grp_now = null
                    return
                })
                .on('click', function(_) {
                    if (
                        !locker.are_free([
                            tag_main + 'click_empty_grp',
                            tag_main + 'in_drag',
                            tag_main + 'set_all',
                            tag_main + 'update_data',
                            tag_main + 'update_groups',
                        ])
                    ) {
                        return
                    }

                    locker.add({
                        id: tag_main + 'click_empty_grp',
                        override: true,
                    })
                    locker.add({
                        id: tag_main + 'added_empty_grp',
                        override: true,
                    })

                    // if(allowPermEmptyGrp) com.add_empty_grp = !com.add_empty_grp;

                    update_empty_grp()

                    if (com.empty_grp_index >= 0) {
                        update_groups()
                    }
                    else {
                        side_col_click()
                    }

                    locker.remove({
                        id: tag_main + 'click_empty_grp',
                        override: true,
                        delay: times.anim * 2,
                    })
                    locker.remove({
                        id: tag_main + 'added_empty_grp',
                        override: true,
                        delay: delay_after_add_empty,
                    })
                })
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_hierarchy() {
            // console.log(grps.data);
            // let tag_circ = "tel_circ";

            com.hirch = d3.hierarchy(grps.data).sum(function(_) {
                return 1
            })
            let pack_node = d3
                .pack()
                .size(wh_pack)
                .padding(15)
            pack_node(com.hirch)

            com.hirch_desc = com.hirch.descendants()

            grps.hov_id_grp_0 = null

            let circ = com.icons.g
                .selectAll('circle.' + tag_circ)
                .data(com.hirch_desc, function(d) {
                    return d.data.id
                }) // console.log('xxx',d.data.id);

            circ
                .enter()
                .append('circle')
                // .attr("id", function(d,i) { return my_unique_id+tag_circ+"_"+d.data.id; })
                .attr('class', tag_circ)
                .attr('cx', function(d) {
                    return d.x
                })
                .attr('cy', function(d) {
                    return d.y
                })
                .style('opacity', 0)
                .attr('r', function(d) {
                    return d.r
                })
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .attr('stroke-width', function(d) {
                    d.data.strk_w = d.depth === 2 ? 2.0 : 0.5
                    return d.data.strk_w
                })
                .style('stroke', function(d) {
                    return hirch_style_stroke(d)
                })
                .style('fill', function(d) {
                    return hirch_style_fill(d)
                })
                .style('stroke-opacity', function(d) {
                    return hirch_opac_strk(d)
                })
                .style('fill-opacity', function(d) {
                    return hirch_opac_fill(d)
                })
                .merge(circ)
                .each(function(d) {
                    if (d.depth === 2) {
                        if (!is_def(grps.hov_id_grp_0)) {
                            grps.hov_id_grp_0 = d.data.id
                        }
                    }
                })
                .transition('out')
                .duration(times.anim)
                .style('opacity', 1)
                // .style("opacity", function(d){
                //     // if(d.depth == 1 && d.data.is_empty) return 0.2;
                //     if(d.depth == 2 && d.parent.data.is_empty) return 0.2;
                //   return 1;
                // })
                .attr('cx', function(d) {
                    return d.x
                })
                .attr('cy', function(d) {
                    return d.y
                })
                .attr('r', function(d) {
                    return d.r
                })

            circ
                .exit()
                .transition('out')
                .duration(times.anim / 2)
                .style('opacity', 0)
                .attr('stroke-width', 0)
                .style('fill-opacity', 0)
                .remove()
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_icons() {
            let need_updt = false
            let scl_r = 1
            let data = com.hirch_desc.filter(function(d) {
                return d.depth === 3
            })
            let icn = com.icons.g.selectAll('g.' + tag_icon).data(data, function(d) {
                return d.data.id
            })

            icn
                .enter()
                .append('g')
                .attr('class', tag_icon)
                .attr('id', function(d) {
                    return d.data.id
                })
                .each(function(d) {
                    // console.log('-------',d.data);
                    let icon_svg = icon_badge.get(d.data.n_icon)
                    let badge = icon_badge.add({
                        parent_svg: d3.select(this),
                        icon_file: icon_svg[0],
                        text: {
                            pos: 'top_right',
                            txt: icon_svg[1],
                        },
                        rad: d.r * scl_r,
                        delay: 0,
                        pulse_hov_in: true,
                        trans_back: false,
                    })
                    d.data.badge = badge.g
                    d.data.set_r = badge.set_r

                    if (is_def(d.data.init)) {
                        d.x = d.data.init.x
                        d.y = d.data.init.y
                        d.r = d.data.init.r
                    }
                })
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')'
                })
                .call(com.drag_main)
                .merge(icn)
                .style('pointer-events', icon_pnt_evt)
                // .each(function(d,i) { if(d.data.n_icon>=0)console.log(d.data.id,d) })
                .each(function(d) {
                    if (is_def(d.data.set_r)) {
                        d.data.set_r(d.r * scl_r)
                    }
                    else {
                        // can happen after a disconnect, that we loose the original element
                        // then, just remove it (no time for transitions!!!), and ask for an update
                        need_updt = true
                        console.log('000 - no d.data.set_r -', d.data.id)
                        com.icons.g.select('#' + d.data.id).remove()
                    }
                })
                .transition('in_out')
                .duration(times.anim)
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')'
                })

            icn
                .exit()
                .transition('in_out')
                .duration(times.anim / 4)
                .style('opacity', 0)
                .remove()

            if (need_updt) {
                ask_data()
            }
        }
        function icon_pnt_evt(d) {
            return d.data.n_icon === n_empty_icon ? 'none' : 'auto'
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function side_col_hov(_) {
            // just in case...
            grps.hov_id_grp_now = null
            return
        }

        function side_col_click(d_in) {
            let id_now = unique()
            if (is_def(d_in)) {
                let n_icon = d_in.data.data.n_icon
                let trg_widg_id = d_in.data.data.trg_widg_id

                let init_xyr = {
                }
                let scale_r = 1.2
                init_xyr.r = d_in.w / 2
                
                init_xyr.x = (
                    (d_in.x + d_in.w / 2)
                    - (shift_main_g[0] - (scale_r - 1) * init_xyr.r / 2)
                )
                init_xyr.y = (
                    (d_in.y + d_in.h / 2)
                    - (shift_main_g[1] - (scale_r - 1) * init_xyr.r / 2)
                )
                init_xyr.r *= scale_r

                let data_add = {
                    id: id_now,
                    trg_widg_id: trg_widg_id,
                    title: '',
                    n_icon: n_icon,
                    init: init_xyr,
                }

                update_empty_grp()

                if (com.empty_grp_index >= 0) {
                    grps.data.children[com.empty_grp_index]
                        .children[0].children = [ data_add ]
                }
                else {
                    let n_grp = -1
                    let grp_ids = grps.data.children.map(function(d) {
                        return d.id
                    })
                    $.each(grps.data.children, function(n_child_0, child_now_0) {
                        if (grp_ids.indexOf(get_grp_id(n_child_0)) < 0 && n_grp < 0) {
                            n_grp = n_child_0
                        }
                    })
                    if (n_grp < 0) {
                        n_grp = grps.data.children.length
                    }

                    let new_grp = {
                        id: get_grp_id(n_grp),
                        title: get_grp_title(n_grp),
                        children: [
                            {
                                id: get_grp_id(n_grp, 0),
                                children: [ data_add ],
                            },
                            {
                                id: get_grp_id(n_grp, 1),
                                children: [
                                    {
                                        id: get_icn_id(n_grp, id_now, 1),
                                        trg_widg_id: '',
                                        n_icon: n_empty_icon,
                                    },
                                ],
                            },
                            {
                                id: get_grp_id(n_grp, 2),
                                children: [
                                    {
                                        id: get_icn_id(n_grp, id_now, 2),
                                        trg_widg_id: '',
                                        n_icon: n_empty_icon,
                                    },
                                ],
                            },
                        ],
                    }
                    grps.data.children.push(new_grp)
                }
            }

            // if(!allowPermEmptyGrp) com.add_empty_grp  = !is_def(d_in);
            grps.hov_id_grp_start = null
            com.add_empty_grp = !is_def(d_in)

            update_groups()

            // if(!allowPermEmptyGrp) com.add_empty_grp  = false;
            com.add_empty_grp = false

            return id_now
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_side_col() {
            let data = grps.data.all_sync_widgets

            let icons_orig = is_def(recs[tag_left_in]) ? recs[tag_left_in] : []
            let icons_new = []
            let trg_widg_ids = []
            $.each(icons_orig, function(index_0, ele_0) {
                let id_now = ele_0.data.id
                let trg_widg_id = ele_0.data.trg_widg_id

                $.each(data, function(index_1, ele_1) {
                    if (id_now === ele_1.id && trg_widg_ids.indexOf(trg_widg_id) < 0) {
                        icons_new.push(ele_0)

                        trg_widg_ids.push(trg_widg_id)
                    }
                })
            })

            $.each(data, function(index_0, ele_0) {
                if (ele_0.n_icon !== n_empty_icon) {
                    let id_now = ele_0.id
                    let trg_widg_id = ele_0.trg_widg_id
                    let ele_index = -1

                    $.each(icons_orig, function(index_1, ele_1) {
                        if (ele_1.id === id_now) {
                            ele_index = index_1
                        }
                    })

                    if (ele_index < 0 && trg_widg_ids.indexOf(trg_widg_id) < 0) {
                        // console.log(ele_0.trg_widg_id);
                        icons_new.push({
                            id: id_now,
                            data: {
                                id: id_now,
                                trg_widg_id: trg_widg_id,
                                n_icon: ele_0.n_icon,
                            },
                        })

                        trg_widg_ids.push(trg_widg_id)
                    }
                }
            })

            recs[tag_left_in] = icons_new
            icons_orig = null
            icons_new = null
            trg_widg_ids = null

            upd_side_col()
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function upd_side_col() {
            let rec_data = recs[tag_left_in]
            if (!is_def(rec_data)) {
                rec_data = []
            }

            com.scroll_grid.update({
                rec_data: rec_data,
            })

            let need_updt = false
            let scl_r = 1
            let data_now = recs[tag_grid_rec]
            let icn = recs.data_g
                .selectAll('g.a' + tag_icon)
                .data(data_now, function(d) {
                    return d.data.id
                })

            icn
                .enter()
                .append('g')
                .attr('class', 'a' + tag_icon)
                .attr('id', function(d) {
                    return d.data.id
                })
                .each(function(d) {
                    let icon_svg = icon_badge.get(d.data.data.n_icon)
                    let badge = icon_badge.add({
                        parent_svg: d3.select(this),
                        icon_file: icon_svg[0],
                        text: {
                            pos: 'top_right',
                            txt: icon_svg[1],
                        },
                        rad: d.w / 2 * scl_r,
                        delay: 300,
                        pulse_hov_in: true,
                        trans_back: true,
                    })
                    d.data.data.badge = badge.g
                    d.data.data.set_r = badge.set_r
                    // console.log(d.data.id,d.x)
                })
                .attr('transform', function(d) {
                    return 'translate(' + (d.x + d.w / 2) + ',' + (d.y + d.h / 2) + ')'
                })
                .call(com.drag_side)
                .merge(icn)
                .style('pointer-events', icon_pnt_evt)
                // .each(function(d,i) { if(d.data.n_icon>=0)console.log(d.data.id,d) })
                .each(function(d) {
                    if (is_def(d.data.data.set_r)) {
                        d.data.data.set_r(d.w / 2 * scl_r)
                    }
                    else {
                        // can happen after a disconnect, that we loose the original element
                        // then, just remove it (no time for transitions!!!), and ask for an update
                        need_updt = true
                        console.log('111 - no d.data.data.set_r -', d.data.id)
                        recs.data_g.select('#' + d.data.id).remove()
                    }
                })
                .transition('in_out')
                .duration(times.anim)
                .attr('transform', function(d) {
                    return 'translate(' + (d.x + d.w / 2) + ',' + (d.y + d.h / 2) + ')'
                })
                .style('opacity', 1)

            icn
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .attr('opacity', 0)
                .remove()

            if (need_updt) {
                ask_data()
            }
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function upd_side_col_on_zoom(opt_in) {
            let icn = recs.data_g.selectAll('g.a' + tag_icon)
            let duration = opt_in.duration
            let trans = function(d) {
                return 'translate(' + (d.x + d.w / 2) + ',' + (d.y + d.h / 2) + ')'
            }

            if (duration <= 0) {
                icn.attr('transform', trans)
            }
            else {
                icn
                    .transition('move')
                    .duration(duration)
                    .attr('transform', trans)
            }
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_ttl(data_in) {
            let titles = [ 'Both', 'Sends', 'Gets' ]

            let data, g_now
            if (is_def(data_in)) {
                g_now = com.empty.g
                data = data_in.filter(function(d) {
                    if (d.depth === 0 || d.depth === 3) {
                        return false
                    }
                    return true
                })
            }
            else {
                update_empty_grp()

                g_now = com.icons.g
                data = com.hirch_desc.filter(function(d) {
                    // console.log(d.data.title,is_empty_group(d));
                    if (d.depth === 0 || d.depth === 3) {
                        return false
                    }
                    else if (d.depth === 2 && !is_empty_group(d)) {
                        return false
                    }
                    else {
                        return true
                    }
                })
            }

            function font_size(d) {
                d.size = d.depth === 1 ? d.r / 4.5 : d.r / 1.7
                if (is_def(data_in) && d.depth === 1) {
                    d.size *= 1.5
                }
                return d.size + 'px'
            }

            let txt = g_now.selectAll('text.' + tag_ttl).data(data, function(d) {
                return d.data.id
            })

            txt
                .enter()
                .append('text')
                .attr('class', tag_ttl)
                .text('')
                .style('fill-opacity', 0)
                .style('stroke-opacity', 0)
                .style('text-anchor', 'middle')
                .style('font-weight', function(d) {
                    return d.depth === 1 ? 'bold' : 'normal'
                })
                .style('stroke-width', is_def(data_in) ? 0.3 : 1)
                .style('stroke', function(d) {
                    if (is_def(data_in)) {
                        return d.depth === 1
                            ? '#383B42'
                            : d3.rgb(hirch_style_stroke(d)).darker(5)
                    }
                    else {
                        return d.depth === 1
                            ? '#383B42'
                            : d3.rgb(hirch_style_stroke(d)).darker(1)
                    }
                })
                .style('fill', hirch_style_stroke)
                .style('pointer-events', 'none')
                .style('vector-effect', 'non-scaling-stroke')
                .style('font-size', font_size)
                .attr('dy', function(d) {
                    return d.size / 3 + 'px'
                })
                .attr('transform', function(d) {
                    if (d.depth === 1) {
                        return 'translate(' + d.x + ',' + (d.y - d.r) + ')'
                    }
                    else {
                        return 'translate(' + d.x + ',' + d.y + ')'
                    }
                })
                .merge(txt)
                .transition('in_out')
                .duration(times.anim)
                .delay(times.anim / 2)
                .attr('transform', function(d) {
                    if (d.depth === 1) {
                        return 'translate(' + d.x + ',' + (d.y - d.r) + ')'
                    }
                    else {
                        return 'translate(' + d.x + ',' + d.y + ')'
                    }
                })
                .style('font-size', font_size)
                .attr('dy', function(d) {
                    let dyScale
                    if (!is_def(data_in) && d.depth === 1) {
                        dyScale = grps.data.children.length === 1 ? 2 : 1
                    }
                    else if (d.depth === 1) {
                        dyScale = 1.5
                    }
                    else {
                        dyScale = 1
                    }
                    return dyScale * d.size / 3 + 'px'
                })
                .text(function(d) {
                    if (d.depth === 1) {
                        return is_def(d.data.title) ? d.data.title : d.data.id
                    }
                    else {
                        return titles[get_index_in_parent(d)]
                    }
                })
                .style('fill-opacity', function(d) {
                    if (is_def(data_in)) {
                        return 0.7
                    }
                    else {
                        return d.depth === 1 ? 0.4 : 0.7
                    }
                })
                .style('stroke-opacity', 0.9)

            txt
                .exit()
                .transition('in_out')
                .duration(times.anim / 2)
                .style('fill-opacity', 0)
                .style('stroke-opacity', 0)
                .remove()
        }

        function set_vor() {
            let show_vor_lines = false

            let vor_data = com.hirch_desc.filter(function(d) {
                return d.depth === 2
            })

            let voronoi = d3.Delaunay
                .from(vor_data, d => d.x, d => d.y)
                .voronoi([ 0, 0, svg_dims.w[0], svg_dims.h[0] ])

            let vor = com.vor.g
                .selectAll('path.' + tag_vor)
                .data(vor_data, function(d, i) {
                    return d.id
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
                .style('stroke-width', '0')
                .style('stroke', '#4F94CD')
                // .on('mouseover', (d, i) => console.log(i,d))
                .on('mouseover', function(e, d) {
                    if (is_def(d)) {
                        highlight({
                            id: d.data.id,
                            data: [{
                                x: d.x,
                                y: d.y,
                                r: d.r,
                            }],
                            type: {
                                name: 'pulse',
                                duration: 1500,
                                col: hirch_style_stroke(d),
                            },
                        })

                        grps.hov_id_grp_now = d.data.id
                    }
                })
                .on('mouseout', function(e, d) {
                    grps.hov_id_grp_now = null

                    highlight({
                        id: d.data.id,
                        data: [],
                        type: {
                            name: 'pulse',
                            duration: 1500,
                            col: hirch_style_stroke(d),
                        },
                    })
                })
                .merge(vor)
                .attr('d', (d, i) => voronoi.renderCell(i))

            vor
                .exit()
                .transition('out')
                .duration(1)
                .attr('opacity', 0)
                .remove()

            if (show_vor_lines) {
                com.vor.g
                    .selectAll('path.' + tag_vor)
                    .style('opacity', '0.5')
                    .style('stroke-width', '2.5')
                    .style('stroke', '#E91E63')
            }

            return
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function update_groups() {
            let lock_tags = [ tag_main + 'update_data', tag_main + 'update_groups' ]
            if (!locker.are_free(lock_tags)) {
                setTimeout(function() {
                    update_groups()
                }, times.anim / 2)
                return
            }
            locker.add({
                id: tag_main + 'update_groups',
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let data_trans = null
            let rm_ind = null
            if (is_def(grps.hov_id_grp_start)) {
                $.each(grps.data.children, function(n_child_0, child_now_0) {
                    $.each(child_now_0.children, function(n_child_1, child_now_1) {
                        if (child_now_1.id === grps.hov_id_grp_start) {
                            $.each(child_now_1.children, function(
                                n_child_2, child_now_2
                            ) {
                                if (child_now_2.id === grps.hov_id_icon) {
                                    data_trans = child_now_2
                                    rm_ind = [ n_child_0, n_child_1, n_child_2 ]
                                }
                            })
                        }
                    })
                })
            }

            if (is_def(data_trans)) {
                if (is_def(grps.hov_id_grp_now)) {
                    $.each(grps.data.children, function(n_child_0, child_now_0) {
                        $.each(child_now_0.children, function(n_child_1, child_now_1) {
                            if (child_now_1.id === grps.hov_id_grp_now) {
                                child_now_1.children.push(data_trans)
                            }
                        })
                    })
                }

                grps.data.children[rm_ind[0]]
                    .children[rm_ind[1]].children.splice(rm_ind[2], 1)

                // // add an empty icon_badge if needed
                // if(grps.data.children[ rm_ind[0] ].children[ rm_ind[1] ].children.length == 0) {
                //   grps.data.children[ rm_ind[0] ].children[ rm_ind[1] ].children
                //     .push({ id:"icn_empty_"+unique(), trg_widg_id:"", title:"", n_icon:n_empty_icon });
                // }
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            set_empty_icons()

            // -------------------------------------------------------------------
            // update the com.empty_grp_index
            // -------------------------------------------------------------------
            update_empty_grp()

            // add an empy group if needed
            // -------------------------------------------------------------------
            if (com.add_empty_grp && com.empty_grp_index < 0) {
                // find the minimal available index for the new empty group
                // -------------------------------------------------------------------
                let n_grp = -1
                let grp_ids = grps.data.children.map(function(d) {
                    return d.id
                })
                $.each(grps.data.children, function(n_child_0, child_now_0) {
                    if (grp_ids.indexOf(get_grp_id(n_child_0)) < 0 && n_grp < 0) {
                        n_grp = n_child_0
                    }
                })
                if (n_grp < 0) {
                    n_grp = grps.data.children.length
                }

                // -------------------------------------------------------------------
                // group names must be unique and of the pattern "grp_0", with sub
                // groups ["grp_0_0","grp_0_1","grp_0_2"], as defined exactly by the server
                // -------------------------------------------------------------------
                let id_now = unique()
                let new_grp = {
                    id: get_grp_id(n_grp),
                    title: get_grp_title(n_grp),
                    children: [
                        {
                            id: get_grp_id(n_grp, 0),
                            children: [
                                {
                                    id: get_icn_id(n_grp, id_now, 0),
                                    trg_widg_id: '',
                                    n_icon: n_empty_icon,
                                },
                            ],
                        },
                        {
                            id: get_grp_id(n_grp, 1),
                            children: [
                                {
                                    id: get_icn_id(n_grp, id_now, 1),
                                    trg_widg_id: '',
                                    n_icon: n_empty_icon,
                                },
                            ],
                        },
                        {
                            id: get_grp_id(n_grp, 2),
                            children: [
                                {
                                    id: get_icn_id(n_grp, id_now, 2),
                                    trg_widg_id: '',
                                    n_icon: n_empty_icon,
                                },
                            ],
                        },
                    ],
                }
                grps.data.children.push(new_grp)
            }

            // remove the empty group if needed
            // -------------------------------------------------------------------
            if (!com.add_empty_grp && com.empty_grp_index >= 0) {
                grps.data.children.splice(com.empty_grp_index, 1)
            }

            // -------------------------------------------------------------------
            // order groups by name
            // -------------------------------------------------------------------
            if (locker.is_free(tag_main + 'in_drag')) {
                grps.data.children = grps.data.children.sort(function(x, y) {
                    let id_x = parseInt(x.id.replace(this_top.sync_group_id_prefix, ''))
                    let id_y = parseInt(y.id.replace(this_top.sync_group_id_prefix, ''))

                    return id_x - id_y
                })
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            highlight({
                id: 'all',
                data: [],
                type: {
                    name: 'pulse',
                    duration: 100,
                    col: '#383B42',
                },
            })

            set_all()

            init_side_col()

            locker.remove({
                id: tag_main + 'update_groups',
            })
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function update_empty_grp() {
            com.empty_grp_index = -1
            com.empty_grp_id = unique()

            // let nEmptyGrps = 0
            $.each(grps.data.children, function(n_child_0, child_now_0) {
                let n_empties = 0
                $.each(child_now_0.children, function(n_child_1, child_now_1) {
                    if (child_now_1.children.length === 1) {
                        if (child_now_1.children[0].n_icon === n_empty_icon) {
                            n_empties++
                        }
                    }
                })
                if (n_empties === 3) {
                    // nEmptyGrps++
                    com.empty_grp_index = n_child_0
                    com.empty_grp_id = child_now_0.id
                }
            })

            // console.log('===',nEmptyGrps,com.empty_grp_index,com.empty_grp_id);
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function is_empty_group(d_in) {
            let is_empty = false
            let d_now = d_in
            while (is_def(d_now)) {
                if (is_def(d_now.id)) {
                    if (com.empty_grp_id === d_now.id) {
                        is_empty = true
                    }
                }
                else if (is_def(d_now.data)) {
                    if (is_def(d_now.data.id)) {
                        if (com.empty_grp_id === d_now.data.id) {
                            is_empty = true
                        }
                    }
                }

                d_now = d_now.parent
            }
            return is_empty
        }

        // -------------------------------------------------------------------
        // remove duplicates within a given group, by trg_widg_id
        // -------------------------------------------------------------------
        function rm_duplicates() {
            let has_removed = false
            $.each(grps.data.children, function(n_child_0, child_now_0) {
                let ids = {
                }
                let has_duplicates = false
                $.each(child_now_0.children, function(n_child_1, child_now_1) {
                    $.each(child_now_1.children, function(n_child_2, child_now_2) {
                        let id_now = child_now_2.trg_widg_id

                        // do not register the first occurence, just initialize the vector
                        if (!is_def(ids[id_now])) {
                            ids[id_now] = []
                        }
                        else {
                            ids[id_now].push([ n_child_1, n_child_2 ])
                            has_removed = true
                            has_duplicates = true
                        }
                    })
                })

                if (has_duplicates) {
                    $.each(child_now_0.children, function(n_child_1, child_now_1) {
                        let children_now = []
                        $.each(child_now_1.children, function(n_child_2, child_now_2) {
                            let id_now = child_now_2.trg_widg_id

                            let will_remove = false
                            $.each(ids[id_now], function(index, obj_now) {
                                if (
                                    obj_now[0] === n_child_1
                                    && obj_now[1] === n_child_2
                                ) {
                                    will_remove = true
                                }
                            })
                            if (!will_remove) {
                                children_now.push(child_now_2)
                            }
                        })
                        grps.data.children[n_child_0]
                            .children[n_child_1].children = children_now
                    })
                }
            })

            if (has_removed) {
                update_groups()
            }

            set_empty_icons()
        }

        // -------------------------------------------------------------------
        // need to add a fake (empty) g for empty groups, in order to make sure the
        // highlight function works ok, and to prevent change od size of group on 1->0 elements
        // -------------------------------------------------------------------
        function set_empty_icons() {
            $.each(grps.data.children, function(n_child_0, child_now_0) {
                $.each(child_now_0.children, function(n_child_1, child_now_1) {
                    if (child_now_1.children.length === 0) {
                        child_now_1.children.push({
                            id: this_top.empty_icn_tag + unique(),
                            trg_widg_id: '',
                            title: '',
                            n_icon: n_empty_icon,
                        })
                    }
                })
            })

            let rm_ind = 1
            while (is_def(rm_ind)) {
                rm_ind = null
                $.each(grps.data.children, function(n_child_0, child_now_0) {
                    $.each(child_now_0.children, function(n_child_1, child_now_1) {
                        $.each(child_now_1.children, function(n_child_2, child_now_2) {
                            if (
                                child_now_2.n_icon === n_empty_icon
                                && child_now_1.children.length > 1
                            ) {
                                rm_ind = [ n_child_0, n_child_1, n_child_2 ]
                            }
                        })
                    })
                })

                if (is_def(rm_ind)) {
                    grps.data.children[rm_ind[0]]
                        .children[rm_ind[1]].children.splice(rm_ind[2], 1)
                }
            }
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_all() {
            locker.add({
                id: tag_main + 'set_all',
            })

            set_hierarchy()
            set_icons()
            set_ttl()
            set_vor()

            locker.remove({
                id: tag_main + 'set_all',
                delay: times.anim * 2,
            })
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function highlight(opt_in) {
            if (locker.is_free(tag_main + 'in_drag')) {
                return
            }

            let id = opt_in.id
            let data = opt_in.data
            let duration = opt_in.type.duration //* ((data.length > 0)?1:0);
            let col = opt_in.type.col

            let r_range = [ 1, 1 ]
            let opac = [ 0, 0.2 ]
            let strk_w = [ 0, 0.175 ]

            // let circ = com.icons.g.selectAll("circle."+tag_circ).filter(function(d) { return (d.data.id == id); });
            //   //.data(com.hirch_desc, function(d) { return d.data.id; }) //console.log('xxx',d.data.id);
            // circ
            //   .transition("in_out").duration(duration/4)
            //   // .style("opacity",        opac[1])
            //   .attr("r",             function(d,i){ return d.r * r_range[1]; })
            //   .attr("stroke-width",  function(d,i){ return d.data.strk_w * 8; })
            //   .style("stroke-opacity", function(d) { return hirch_opac_strk(d) / 3; } )
            //   .transition("in_out").duration(duration*3/4)
            //   // // .style("opacity",        opac[0])
            //   .attr("r",             function(d,i){ return d.r * r_range[0]; })
            //   .attr("stroke-width",  function(d,i){ return d.data.strk_w; })
            //   .style("stroke-opacity", function(d) { return hirch_opac_strk(d); } )
            // return

            let circ = com.highlight.g
                .selectAll('circle.' + id)
                .data(data, function(d, i) {
                    return is_def(d.id) ? d.id : i
                })

            circ
                .enter()
                .append('circle')
                .attr('class', id + ' ' + 'all')
                .attr('cx', function(d) {
                    return d.x
                })
                .attr('cy', function(d) {
                    return d.y
                })
                .attr('r', function(d) {
                    return d.r
                })
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .style('stroke', col)
                .style('fill', 'transparent')
                .style('opacity', opac[0])
                .attr('stroke-width', function(d) {
                    return d.r * strk_w[0]
                })
                .merge(circ)
                .transition('in_out')
                .duration(duration / 4)
                .style('opacity', opac[1])
                .attr('r', function(d) {
                    return d.r * r_range[1]
                })
                .attr('stroke-width', function(d) {
                    return d.r * strk_w[1]
                })
                .transition('in_out')
                .duration(duration * 3 / 4)
                .style('opacity', opac[0])
                .attr('r', function(d) {
                    return d.r * r_range[0]
                })
                .attr('stroke-width', function(d) {
                    return d.r * strk_w[0]
                })
                .transition('in_out')
                .duration(1)
                .remove()

            circ
                .exit()
                .transition('in_out')
                .duration(duration / 2)
                .style('opacity', 0)
                .remove()
        }

        function hirch_style_stroke(d) {
            if (d.depth === 2) {
                let index = get_index_in_parent(d)
                // if(index == 0) return d3.rgb(cols_blues[3]).darker(0.5);
                // if(index == 1) return d3.rgb(cols_yellows[6]).brighter(0.1);
                // if(index == 2) return d3.rgb(cols_reds[4]).brighter(0.95);

                // if(index == 0) return d3.rgb('#01579B').brighter(0.0005);
                // if(index == 1) return d3.rgb('#00B0FF').brighter(0.0005);
                // if(index == 2) return d3.rgb('#536DFE').brighter(0.0005);

                if (index === 0) {
                    return d3.rgb('#00B0FF').darker(0.5)
                }
                if (index === 1) {
                    return d3.rgb('#8BC34A').darker(0.5)
                }
                if (index === 2) {
                    return d3.rgb('#CD96CD').brighter(0.0095)
                }

                // if(index == 0) return d3.rgb('#009688').brighter(0.5);
                // if(index == 1) return d3.rgb('#FF9800').brighter(0.5);
                // if(index == 2) return d3.rgb('#F06292').brighter(0.0095);
            }
            return '#383B42'
            // return d3.rgb(hirch_style_fill(d)).darker(1);
        }
        function hirch_style_fill(_) {
            // if(d.depth == 2) {
            //   let index = get_index_in_parent(d);
            //   if(index == 0) return cols_greens[0];
            //   if(index == 1) return cols_yellows[0];
            //   if(index == 2) return cols_reds[0];
            // }
            return '#383B42'
            // return d.children ? "#383B42" : tel_data.idToCol[d.data.id];
        }
        function hirch_opac_fill(d, _) {
            if (d.depth === 0) {
                return 0
            }
            else if (d.depth === 1) {
                return 0.015
            }
            else if (d.depth === 2) {
                return 0.02
            }
            else if (d.depth === 3) {
                return 0
            }
            // console.log(d)
            // if     (!d.parent)  return 0.02;
            // else if(d.children) return 0.03;
            // else                return 0;
        }
        function hirch_opac_strk(d, _) {
            if (d.depth === 0) {
                return 0
            }
            else if (d.depth === 1) {
                return 0.5
            }
            else if (d.depth === 2) {
                return 0.9
            }
            else if (d.depth === 3) {
                return 0
            }
            // if     (!d.parent)  return 1;
            // else if(d.children) return 0.5;
            // else                return 0;
        }
        function get_index_in_parent(d) {
            let index = -1
            $.each(d.parent.children, function(n_child, child_now) {
                if (child_now.data.id === d.data.id) {
                    index = n_child
                }
            })
            return index
        }
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_sync_state(data_in) {
    // console.log(' - main_panel_sync - update_sync_state ',data_in);
    }
    this.update_sync_state = update_sync_state

    let svg_main = new SvgMain()
}
