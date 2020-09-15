/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global bck_pattern */
/* global vor_ploy_func */
/* global do_zoom_to_target */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ScrollGrid = function(opt_in) {
    let com = {
    }
    let main_tag = opt_in.id
    let recs = opt_in.recs
    let x0 = opt_in.x0
    let y0 = opt_in.y0
    let w0 = opt_in.w0
    let h0 = opt_in.h0
    let m0 = opt_in.m0
    let run_loop = opt_in.run_loop
    let is_horz = opt_in.is_horz
    let locker = opt_in.locker
    let xy = is_horz ? 'x' : 'y'
    let wh_0 = is_horz ? w0 : h0

    let is_inv_order = (
        is_def(opt_in.is_inv_order) ? opt_in.is_inv_order : false
    )
    let show_counts = (
        is_def(opt_in.show_counts) ? opt_in.show_counts : true
    )
    let tag_clip_path = (
        is_def(opt_in.tag_clip_path)
            ? opt_in.tag_clip_path
            : main_tag + 'clipPath'
    )
    let auto_clip_path = (
        is_def(opt_in.auto_clip_path) ? opt_in.auto_clip_path : true
    )

    let bck_rec_opt = opt_in.bck_rec_opt
    if (!is_def(bck_rec_opt)) {
        bck_rec_opt = {
            texture_orient: '5/8',
            front_prop: {
                strk_opac: 0.2,
            },
        }
    }

    let on_zoom = is_def(opt_in.on_zoom) ? opt_in.on_zoom : {
    }

    com.g_base = opt_in.g_box
    com.g_bck = (
        is_def(opt_in.g_bck) ? opt_in.g_bck : com.g_base.append('g')
    )
    com.g_bck_data = (
        is_def(opt_in.g_bck_data) ? opt_in.g_bck_data : com.g_base.append('g')
    )
    com.g_vor = (
        is_def(opt_in.g_vor) ? opt_in.g_vor : com.g_base.append('g')
    )
    com.g_frnt_data = (
        is_def(opt_in.g_frnt_data) ? opt_in.g_frnt_data : com.g_base.append('g')
    )

    let rec_data = (
        is_def(opt_in.rec_data) ? opt_in.rec_data : []
    )
    let vor_opt = (
        is_def(opt_in.vor_opt)
            ? opt_in.vor_opt
            : {
            }
    )
    // let invertZoom = is_def(opt_in.invertZoom) ? opt_in.invertZoom : !is_horz

    let n_rows = (
        is_def(opt_in.n_rows) ? opt_in.n_rows : 1
    )
    let rec_w = (
        is_def(opt_in.rec_w) ? opt_in.rec_w : 45
    )
    let rec_h = (
        is_def(opt_in.rec_h) ? opt_in.rec_h : rec_w
    )
    let rec_m = (
        is_def(opt_in.rec_m) ? opt_in.rec_m : Math.min(rec_w, rec_h) * 0.2
    )
    let rec_e = (
        is_def(opt_in.rec_e) ? opt_in.rec_e : rec_m * 3
    )
    let rec_wh = is_horz ? rec_w : rec_h

    let scroll_rec = is_def(opt_in.scroll_rec) ? opt_in.scroll_rec : {
    }
    if (!is_def(scroll_rec.w)) {
        scroll_rec.w = (is_horz ? h0 : w0) * 0.125
    }
    if (!is_def(scroll_rec.h)) {
        scroll_rec.h = 0
    }
    if (!is_def(scroll_rec.marg)) {
        scroll_rec.marg = 0.6
    }
    if (!is_def(scroll_rec.font_size)) {
        scroll_rec.font_size = scroll_rec.w
    }

    let lock_zoom = opt_in.lock_zoom
    if (!is_def(lock_zoom)) {
        lock_zoom = {
            all: main_tag + 'zoom',
            during: main_tag + 'zoom_during',
            end: main_tag + 'zoom_end',
        }
    }

    let lockers = {
    }
    lockers.lockers = (
        is_def(opt_in.lockers) ? opt_in.lockers : []
    )
    lockers.zoom_during = lockers.lockers.slice().concat([ lock_zoom.during ])
    lockers.zoom_end = lockers.lockers.slice().concat([ lock_zoom.end ])

    let show_vor_lines = (
        is_def(vor_opt.show_vor_lines) ? vor_opt.show_vor_lines : false
    )
    let vor_mouseover = (
        is_def(vor_opt.mouseover) ? vor_opt.mouseover : null
    )
    let vor_mouseout = (
        is_def(vor_opt.mouseout) ? vor_opt.mouseout : null
    )
    let vor_dblclick = (
        is_def(vor_opt.dblclick) ? vor_opt.dblclick : null
    )
    let vor_click = (
        is_def(vor_opt.click) ? vor_opt.click : null
    )
    let vor_call = (
        is_def(vor_opt.call) ? vor_opt.call : null
    )

    let g_name = main_tag + 'g'
    let tag_outer = main_tag + 'outer'
    // let tag_inner = main_tag + 'inner'
    let tag_zoom = main_tag + 'zoom'
    let tag_drag = main_tag + 'drag'
    let tag_vor = main_tag + 'vor'
    let tag_scroll_bar = main_tag + 'scrollBar'
    let tag_txt_out = main_tag + 'recCounters'

    let is_in_drag = false
    let is_in_scroll_drag = false
    let in_user_zoom = false
    let has_bot_top = false
    let scroll_bar_rec = null

    let zooms = {
        xy_0: is_horz ? x0 + rec_e : y0 + rec_e,
        xy_1: is_horz ? x0 + w0 - rec_e - rec_w : y0 + h0 - rec_e - rec_h,
        duration: 0,
        pause: 10,
        extent: [ 1, 1e20, 1e4 ],
        drag: {
            xy: is_horz ? x0 : y0,
            frac: 0,
        },
    }

    let rec_in = {
    }
    rec_in.ids = {
    }
    rec_in.xy_frac = 0
    rec_in.is_last_in = false

    recs[main_tag] = []

    // adjust for a possible top/left margin for a title
    if (is_def(m0)) {
        if (is_horz) {
            h0 -= m0
            y0 += m0
        }
        else {
            w0 -= m0
            x0 += m0
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    this.set = function(type, data) {
        com[type] = data
    }
    // this.set = function(opt_in) {
    //   if     (is_def(opt_in.data)) com[opt_in.tag] = opt_in.data;
    //   else if(is_def(opt_in.def))  com[opt_in.tag] = opt_in.def;
    //   else                        com[opt_in.tag] = null;
    // };
    this.get = function(type) {
        return com[type]
    }
    this.get_bck_data_g = function() {
        return com.g_bck_data
    }
    this.get_front_data_g = function() {
        return com.g_frnt_data
    }

    // now add the vor tessalation
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_vor() {
        let scroll_rec_marg
        if (!has_bot_top) {
            scroll_rec_marg = [ 0, 0 ]
        }
        else {
            scroll_rec_marg = [
                is_horz ? 0 : scroll_rec.w,
                is_horz ? scroll_rec.w : 0,
            ]
        }

        let vor_data = recs[main_tag]

        let voronoi = d3.Delaunay
            .from(vor_data, d => d.x + d.w / 2, d => d.y + d.h / 2)
            .voronoi([ x0, y0, x0 + w0 - scroll_rec_marg[0], y0 + h0 - scroll_rec_marg[1] ])

        let tag_vor = 'vor'
        let vor = com.g_vor
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
            .on('mouseover', vor_mouseover)
            .on('mouseout', vor_mouseout)
            .on('dblclick', vor_dblclick)
            .on('click', vor_click)
            .merge(vor)
            .attr('d', (d, i) => voronoi.renderCell(i))

        vor
            .exit()
            .transition('out')
            .duration(1)
            .attr('opacity', 0)
            .remove()

        if (show_vor_lines) {
            com.g_vor
                .selectAll('path.' + tag_vor)
                .style('opacity', '0.5')
                .style('stroke-width', '2.5')
                .style('stroke', '#E91E63')
        }


        if (vor_call) {
            com.g_vor.selectAll('path.' + tag_vor).call(vor_call)
        }
        else if (has_bot_top) {
            com.g_vor.selectAll('path.' + tag_vor).call(com[tag_drag])
        }

        return
    }

    function xy_frac_zoom(xy_frac_in) {
        let trans = 0
        let rec_len = recs[main_tag].length

        rec_in.xy_frac = 0

        if (rec_len < 2) {
            return trans
        }

        let xy_min_max = (
            rec_wh + recs[main_tag][rec_len - 1][xy]
            - recs[main_tag][0][xy] + 2 * rec_e
        )
        let frac_scale = xy_min_max - wh_0

        if (recs[main_tag][0][xy] < zooms.xy_0) {
            rec_in.xy_frac = (zooms.xy_0 - recs[main_tag][0][xy]) / frac_scale
            rec_in.xy_frac = Math.min(1, Math.max(0, rec_in.xy_frac))
        }

        if (is_def(xy_frac_in)) {
            let fracDif = Math.min(
                1,
                Math.max(0.0001, Math.abs(xy_frac_in - rec_in.xy_frac))
            )
            trans = (xy_frac_in > rec_in.xy_frac ? 1 : -1) * fracDif * frac_scale
        }

        return trans
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_counts() {
        let xy_min = (is_horz ? x0 : y0) - rec_wh / 2
        let xy_max = (is_horz ? x0 + w0 : y0 + h0) - rec_wh / 2
        let xy_edge_x = is_horz
            ? [ x0, x0 + w0 ]
            : [ x0 + w0 - scroll_rec.w / 2, x0 + w0 - scroll_rec.w / 2 ]
        let xy_edge_y = is_horz
            ? [ y0 + h0 - scroll_rec.w / 2, y0 + h0 - scroll_rec.w / 2 ]
            : [ y0, y0 + h0 ]
        // let focusEdge = is_horz ? x0 : y0;

        rec_in.ids = {
        }
        rec_in.xy_frac = 0
        rec_in.is_last_in = false
        let rec_len = recs[main_tag].length

        if (rec_len > 0) {
            xy_frac_zoom()

            let n_rec_out = [ 0, 0 ]
            $.each(recs[main_tag], function(index, data_now) {
                if (data_now[xy] < xy_min) {
                    n_rec_out[0] += 1
                }
                else if (data_now[xy] > xy_max) {
                    n_rec_out[1] += 1
                }
                else {
                    rec_in.ids[data_now.id] = data_now[xy]
                    if (index === rec_len - 1) {
                        rec_in.is_last_in = true
                    }
                }
            })

            if (show_counts) {
                let text_data_out = []
                $.each(n_rec_out, function(index, n_rec_out_now) {
                    if (n_rec_out_now > 0) {
                        let r_now = (
                            scroll_rec.font_size * (n_rec_out_now < 100 ? 1.2 : 1.5)
                        )
                        text_data_out.push({
                            id: main_tag + 'n_rec_out' + index,
                            txt: '' + n_rec_out_now,
                            x: xy_edge_x[index],
                            y: xy_edge_y[index],
                            r: r_now,
                        })
                    }
                })

                let circ_out = com.g_vor
                    .selectAll('circle.' + tag_txt_out)
                    .data(text_data_out, function(d) {
                        return d.id
                    })

                let text_out = com.g_vor
                    .selectAll('text.' + tag_txt_out)
                    .data(text_data_out, function(d) {
                        return d.id
                    })

                circ_out
                    .enter()
                    .append('circle')
                    .attr('class', tag_txt_out)
                    .style('opacity', 0)
                    .attr('cx', function(d) {
                        return d.x
                    })
                    .attr('cy', function(d) {
                        return d.y
                    })
                    .attr('r', 0)
                    .style('stroke-width', 0)
                    .attr('vector-effect', 'non-scaling-stroke')
                    .style('pointer-events', 'none')
                    .attr('fill', '#383b42')
                    .merge(circ_out)
                    .transition('in_out')
                    .duration(times.anim_txt)
                    .attr('r', function(d) {
                        return d.r
                    })
                    .style('opacity', 0.7)

                circ_out
                    .exit()
                    .transition('in_out')
                    .delay(times.anim_txt)
                    .duration(times.anim_txt)
                    .attr('r', 0)
                    .style('opacity', 0)
                    .remove()

                text_out
                    .enter()
                    .append('text')
                    .attr('class', tag_txt_out)
                    .style('font-weight', 'bold')
                    .style('opacity', 0)
                    .style('fill-opacity', 0.9)
                    .attr('fill', '#F2F2F2')
                    .attr('vector-effect', 'non-scaling-stroke')
                    .style('pointer-events', 'none')
                    .attr('transform', function(d) {
                        return 'translate(' + d.x + ',' + d.y + ')'
                    })
                    .attr('text-anchor', 'middle')
                    .merge(text_out)
                    // .text(function (d) { return d.txt; })
                    .style('font-size', scroll_rec.font_size + 'px')
                    .attr('dy', scroll_rec.font_size / 3 + 'px')
                    .transition('in_out')
                    .duration(times.anim_txt)
                    .attr('transform', function(d) {
                        return 'translate(' + d.x + ',' + d.y + ')'
                    })
                    .tween('text', function(d) {
                        return tween_text(d3.select(this), +d.txt)
                    })
                    .style('opacity', 1)

                text_out
                    .exit()
                    .transition('in_out')
                    .duration(times.anim_txt)
                    .tween('text', function(_) {
                        return tween_text(d3.select(this), 0)
                    })
                    .style('opacity', 0)
                    .remove()
            }
        }

        return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let format_int = d3.format('d')
    function tween_text(this_ele, new_val) {
        let prev_text = this_ele.text()
        let interpolate = d3.interpolate(prev_text, new_val)
        return function(t) {
            this_ele.text(format_int(interpolate(t)))
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    com.tot_trans = 0
    function setup_zoom() {
        com.zoom_start = function(e) {
            if (!has_bot_top) {
                return
            }
            if (is_def(on_zoom.start)) {
                on_zoom.start({
                    id: main_tag,
                    type: 'start',
                    duration: 0,
                })
            }
        }

        let delay = 0
        com.zoom_during = function(e) {
            if (!has_bot_top) {
                return
            }
            // if(!is_def(e.sourceEvent)) return;
            // isInZoom = true
            in_user_zoom = is_def(e.sourceEvent)

            if (locker.are_free(lockers.zoom_during)) {
                locker.add({
                    id: lock_zoom.all,
                    override: true,
                })
                locker.add({
                    id: lock_zoom.during,
                    override: true,
                })

                let trans = null
                delay = 0
                if (in_user_zoom) {
                    let wd_x = e.sourceEvent.deltaX
                    let wd_y = e.sourceEvent.deltaY
                    let wd_xy = Math.abs(wd_x) > Math.abs(wd_y) ? -1 * wd_x : wd_y

                    trans = is_def(wd_xy) ? -1 * wd_xy : 0
                }

                com.do_trans(trans)

                locker.remove({
                    id: lock_zoom.during,
                    delay: delay,
                })
            }

            // console.log(d3.zoomTransform(com[tag_zoom+"zoom_node"]).k);
            return
        }

        com.do_trans = function(trans) {
            if (Math.abs(trans) < wh_0 * 1e-10) {
                return
            }

            if (is_def(trans)) {
                let rec_last_i = recs[main_tag].length - 1

                if (recs[main_tag][0][xy] + trans > zooms.xy_0) {
                    if (recs[main_tag][0][xy] < zooms.xy_0) {
                        trans = zooms.xy_0 - recs[main_tag][0][xy]
                    }
                    else {
                        trans = null
                    }
                }
                else if (recs[main_tag][rec_last_i][xy] + trans < zooms.xy_1) {
                    if (recs[main_tag][rec_last_i][xy] > zooms.xy_1) {
                        trans = zooms.xy_1 - recs[main_tag][rec_last_i][xy]
                    }
                    else {
                        trans = null
                    }
                }
            }

            if (is_def(trans)) {
                delay = zooms.pause

                $.each(recs[main_tag], function(index, data_now) {
                    data_now[xy] += trans
                })

                if (is_def(on_zoom.during)) {
                    on_zoom.during({
                        id: main_tag,
                        type: 'during',
                        xy: xy,
                        wh: rec_wh,
                        duration: 0,
                    })
                }
                // else {
                //   let tot_trans = recs[main_tag][0][xy] - recs[main_tag][0].xy_0;

                //   com.g_bck_data.attr("transform", function(d,i) {
                //     return "translate(0,"+tot_trans+")";
                //   })

                //   com.clip_rec.attr("transform", function(d,i) {
                //     return "translate(0,"+(-1*tot_trans)+")";
                //   })
                // }

                update_counts()
                zoom_scrollbar_update()
            }

            return
        }

        com.zoom_end = function(e) {
            if (!has_bot_top) {
                return
            }

            let has_upd_count = false
            if (locker.are_free(lockers.zoom_end)) {
                locker.add({
                    id: lock_zoom.end,
                    override: true,
                })

                // let delta    = zooms.delta;
                let rec_last_i = recs[main_tag].length - 1

                let trans = null
                if (rec_last_i > 0) {
                    if (recs[main_tag][0][xy] > zooms.xy_0) {
                        trans = zooms.xy_0 - recs[main_tag][0][xy]
                    }
                    if (recs[main_tag][rec_last_i][xy] < zooms.xy_1) {
                        trans = zooms.xy_1 - recs[main_tag][rec_last_i][xy]
                    }
                }
                if (is_def(trans)) {
                    $.each(recs[main_tag], function(index, data_now) {
                        data_now[xy] += trans
                    })

                    has_upd_count = true
                    update_counts()
                    zoom_scrollbar_update()
                }

                if (is_def(on_zoom.end)) {
                    on_zoom.end({
                        id: main_tag,
                        type: 'end',
                        xy: xy,
                        wh: rec_wh,
                        duration: zooms.duration,
                    })
                }

                // reset the zoom to allow infinity scrolling
                let data_out = {
                    target_scale: zooms.extent[2],
                    duration_scale: 0,
                    base_time: 0,
                    trans_to: [ 0, 0 ],
                    wh: [ w0, h0 ],
                    cent: null,
                    func_end: function() {
                        locker.remove({
                            id: lock_zoom.end,
                            override: true,
                            delay: zooms.duration,
                        })
                    },
                    svg: com.g_vor,
                    svg_zoom: com[tag_zoom],
                    zoom_callable: com[tag_zoom + 'zoomed'],
                    svg_zoom_node: com[tag_zoom + 'zoom_node'],
                }

                do_zoom_to_target(data_out)

                set_vor()

                return
            }

            if (!has_upd_count) {
                update_counts()
                zoom_scrollbar_update()
            }

            if (!is_in_drag) {
                locker.remove({
                    id: lock_zoom.all,
                    override: true,
                    delay: zooms.duration,
                })
            }
            // isInZoom = false
            in_user_zoom = false

            zooms.duration = 0
        
            return
        }

        com.drag_start = function(e, coords) {
            locker.add({
                id: lock_zoom.all,
                override: true,
            })

            // if has a scrill bar and the mouse is over it (otherwise it will interfere with click)
            is_in_scroll_drag = false
            if (has_bot_top) {
                if (is_horz && coords[1] > y0 + h0 - scroll_rec.w) {
                    is_in_scroll_drag = true
                }
                if (!is_horz && coords[0] > x0 + w0 - scroll_rec.w) {
                    is_in_scroll_drag = true
                }
            }

            if (is_in_scroll_drag) {
                if (is_horz) {
                    zooms.drag.xy = coords[0] - (x0 + zooms.drag.frac * w0)
                }
                else {
                    zooms.drag.xy = coords[1] - (y0 + zooms.drag.frac * h0)
                }
            }
            else {
                com.zoom_start()
            }
        }

        com.drag_during = function(e, coords_in) {
            is_in_drag = true

            if (is_in_scroll_drag) {
                let coords = [ coords_in[0], coords_in[1] ]
                if (is_horz) {
                    coords[0] -= zooms.drag.xy
                }
                else {
                    coords[1] -= zooms.drag.xy
                }

                rec_bck_click_once({
                    coords: coords,
                    duration: 0,
                })
            }
            else {
                let trans = is_horz ? -e.dx : e.dy
                com.do_trans(trans)
            }
        }

        com.drag_end = function(e) {
            locker.remove({
                id: lock_zoom.all,
                override: true,
            })

            if (!is_in_scroll_drag) {
                com.zoom_end()
            }

            is_in_drag = false
            is_in_scroll_drag = false
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom] = d3.zoom().scaleExtent([ zooms.extent['0'], zooms.extent['1'] ])
        com[tag_zoom]
            .on('start', com.zoom_start)
            .on('zoom', com.zoom_during)
            .on('end', com.zoom_end)

        // needed for auotomatic zoom
        com[tag_zoom + 'zoom_node'] = com.g_vor.nodes()[0]
        com[tag_zoom + 'zoomed'] = com.g_vor.append('g')

        com[tag_drag] = d3.drag()
        com[tag_drag]
            .on('start', function(e) {
                com.drag_start(e, d3.pointer(e))
            })
            .on('drag', function(e) {
                com.drag_during(e, d3.pointer(e))
            })
            .on('end', function(e) {
                com.drag_end(e)
            })

        set_zoom_status()
    }

    // ------------------------------------------------------------------
    // activate/disable the zoom behaviour
    // ------------------------------------------------------------------
    function set_zoom_status() {
        if (has_bot_top) {
            com.g_vor.call(com[tag_zoom]).on('dblclick.zoom', null)
        }
        else {
            com.g_vor.on('.zoom', null)
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function zoom_scrollbar_update() {
        if (!is_def(scroll_bar_rec)) {
            return
        }

        // instant transition in case of dragging
        if (is_in_drag || in_user_zoom) {
            scroll_bar_rec.attr('transform', zoom_scrollbar_trans)
        }
        else {
            scroll_bar_rec
                .transition('move')
                .duration(times.anim)
                .attr('transform', zoom_scrollbar_trans)
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function zoom_scrollbar_init() {
        if (!locker.is_free(main_tag + 'zoom_scrollbar_init')) {
            return
        }

        locker.add({
            id: main_tag + 'zoom_scrollbar_init',
            override: true,
        })
        scroll_bar_rec = null

        // ------------------------------------------------------------------
        let n_done = 0
        let data_bck = has_bot_top ? [{
            id: 'zoom_scrollbar_bck',
            x: wh_0,
        }] : []
        let rec_bck = com.g_vor
            .selectAll('rect.' + tag_scroll_bar + 'bck')
            .data(data_bck, function(d) {
                return d.id
            })

        rec_bck
            .enter()
            .append('rect')
            .attr('class', tag_scroll_bar + 'bck')
            .attr('stroke', '#383B42')
            .attr('stroke-width', '0.5')
            .style('stroke-opacity', '0.5')
            .style('fill', '#383B42')
            .style('fill-opacity', '0.05')
            // .style("pointer-events", "none")
            .attr('x', is_horz ? x0 : x0 + w0)
            .attr('y', is_horz ? y0 + h0 : y0)
            .attr('width', is_horz ? w0 : 0)
            .attr('height', is_horz ? 0 : h0)
            .on('click', function(e) {
                rec_bck_click_once({
                    coords: d3.pointer(e),
                })
            })
            .call(com[tag_drag])
            .style('opacity', 1)
            .transition('in_out')
            .duration(times.anim)
            .attr('x', is_horz ? x0 : x0 + w0 - scroll_rec.w)
            .attr('y', is_horz ? y0 + h0 - scroll_rec.w : y0)
            .attr('width', is_horz ? w0 : scroll_rec.w)
            .attr('height', is_horz ? scroll_rec.w : h0)
            .on('end', function(_) {
                n_done += 1
            })

        rec_bck
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .attr('x', is_horz ? x0 : x0 + w0)
            .attr('y', is_horz ? y0 + h0 : y0)
            .attr('width', is_horz ? w0 : 0)
            .attr('height', is_horz ? 0 : h0)
            .remove()
            .on('end', function(_) {
                n_done += 1
            })

        // ------------------------------------------------------------------
        set_rec_scroll()

        // ------------------------------------------------------------------
        let n_tries = 0
        let max_tries = 500
        function scroll_bar_rec_set() {
            setTimeout(function() {
                // console.log('ndone',n_done);

                if (n_done < 1 && n_tries < max_tries) {
                    scroll_bar_rec_set()
                }
                else {
                    if (n_tries >= max_tries) {
                        console.error('cant seem to init zoom_scrollbar ...')
                    }

                    scroll_bar_rec = com.g_vor.selectAll(
                        'rect.' + tag_scroll_bar + 'scroll'
                    )
                    locker.remove({
                        id: main_tag + 'zoom_scrollbar_init',
                    })
                }
                n_tries += 1
            }, times.anim / 5)
        }

        if (has_bot_top) {
            scroll_bar_rec_set()
        }
        else {
            locker.remove({
                id: main_tag + 'zoom_scrollbar_init',
            })
        }
    }

    // ------------------------------------------------------------------
    function set_rec_scroll() {
        let marg = scroll_rec.w * scroll_rec.marg / 2
        let rec_len = recs[main_tag].length
        let xy_min_max = wh_0
        if (rec_len > 0) {
            if (is_def(recs[main_tag][rec_len - 1])) {
                xy_min_max = (
                    rec_wh
                    + recs[main_tag][rec_len - 1][xy]
                    - recs[main_tag][0][xy]
                    + 2 * rec_e
                )
            }
        }
        scroll_rec.h = wh_0 * (wh_0 / xy_min_max)

        let data_scroll = has_bot_top ? [{
            id: 'zoom_scrollbar_scroll',
        }] : []
        let rec_scroll = com.g_vor
            .selectAll('rect.' + tag_scroll_bar + 'scroll')
            .data(data_scroll, function(d) {
                return d.id
            })

        rec_scroll
            .enter()
            .append('rect')
            .attr('class', tag_scroll_bar + 'scroll')
            .attr('stroke', '#383B42')
            .attr('stroke-width', '1')
            .style('stroke-opacity', '0.5')
            .style('fill', '#383B42')
            .style('fill-opacity', '0.9')
            .style('pointer-events', 'none')
            .attr('x', is_horz ? x0 + marg : x0 + w0)
            .attr('y', is_horz ? y0 + h0 : y0 + marg)
            .attr('width', is_horz ? scroll_rec.h - marg * 2 : 0)
            .attr('height', is_horz ? 0 : scroll_rec.h - marg * 2)
            .attr('transform', zoom_scrollbar_trans)
            .merge(rec_scroll)
            .transition('in_out')
            .duration(times.anim)
            .attr('transform', zoom_scrollbar_trans)
            .attr('x', is_horz ? x0 + marg : x0 + w0 - scroll_rec.w + marg)
            .attr('y', is_horz ? y0 + h0 - scroll_rec.w + marg : y0 + marg)
            .attr('width', is_horz ? scroll_rec.h - marg * 2 : scroll_rec.w - marg * 2)
            .attr('height', is_horz ? scroll_rec.w - marg * 2 : scroll_rec.h - marg * 2)

        if (is_horz) {
            rec_scroll
                .exit()
            // .transition("in_out").duration(times.anim/4)
            // .attr("transform", "translate(0,0)")
            // .attr("width", (w0 - marg*2))
            // .style("opacity","0.05")
                .transition('in_out')
                .duration(times.anim * 3 / 4)
                .attr('x', x0 + marg)
                .attr('y', y0 + h0)
                .attr('height', 0)
                .remove()
        }
        else {
            rec_scroll
                .exit()
            // .transition("in_out").duration(times.anim/4)
            // .attr("transform", "translate(0,0)")
            // .attr("height", (h0 - marg*2))
            // .style("opacity","0.05")
                .transition('in_out')
                .duration(times.anim * 3 / 4)
                .attr('x', x0 + w0)
                .attr('y', y0 + marg)
                .attr('width', 0)
                .remove()
        }

        // update the variable used for initil drag events
        zooms.drag.frac = rec_in.xy_frac
    }

    // ------------------------------------------------------------------
    function zoom_scrollbar_trans() {
    // let pos = rec_in.xy_frac * wh_0 - scroll_rec.h * 0.5;
    // pos = Math.max(0, Math.min(wh_0- scroll_rec.h, pos));
    // // console.log('pos',rec_in.xy_frac,pos);

        let pos = rec_in.xy_frac * (wh_0 - scroll_rec.h)
        if (is_horz) {
            return 'translate(' + pos + ',0)'
        }
        else {
            return 'translate(0,' + pos + ')'
        }
    }

    // ------------------------------------------------------------------
    run_loop.init({
        tag: main_tag + 'rec_bck_click',
        func: rec_bck_click_once,
        n_keep: 1,
    })

    function rec_bck_click(data_in) {
        run_loop.push({
            tag: main_tag + 'rec_bck_click',
            data: data_in,
        })
    }

    function rec_bck_click_once(data_in) {
        if (!locker.are_free(lockers.zoom_during)) {
            setTimeout(function() {
                rec_bck_click(data_in)
            }, times.anim / 2)
            return
        }

        if (!is_def(data_in)) {
            return
        }
        if (!is_def(data_in.coords)) {
            return
        }

        // zooms.drag.frac = is_horz ? (data_in.coords[0] - zooms.xy_0)/w0 : (data_in.coords[1] - zooms.xy_0)/h0;
        zooms.drag.frac = (
            is_horz
                ? (data_in.coords[0] - x0) / w0
                : (data_in.coords[1] - y0) / h0
        )
        zooms.drag.frac = Math.min(1, Math.max(0, zooms.drag.frac))

        let trans = xy_frac_zoom(zooms.drag.frac)

        $.each(recs[main_tag], function(index, data_now) {
            data_now[xy] -= trans
        })

        let duration = is_def(data_in.duration) ? data_in.duration : times.anim

        let data_out = {
            target_scale: zooms.extent[2],
            duration_scale: 0,
            base_time: 0,
            trans_to: [ 0, 0 ],
            wh: [ w0, h0 ],
            cent: null,
            func_start: function() {
                zooms.duration = duration
            },
            svg: com.g_vor,
            svg_zoom: com[tag_zoom],
            zoom_callable: com[tag_zoom + 'zoomed'],
            svg_zoom_node: com[tag_zoom + 'zoom_node'],
        }

        do_zoom_to_target(data_out)
    }

    // ------------------------------------------------------------------
    // access function for get_rec_data
    // ------------------------------------------------------------------
    function get_rec_data() {
        return rec_data
    }
    this.get_rec_data = get_rec_data

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update(opt_in) {
        // let rec_data_in = is_def(opt_in.rec_data) ? opt_in.rec_data : rec_data;
        let rec_data_in = rec_data
        if (is_def(opt_in.rec_data)) {
            rec_data_in = opt_in.rec_data
            rec_data = rec_data_in
        }
        // opt_in.rec_data = rec_data_in;

        // reverse changes the order in-place, so first make a new copy with slice()
        if (is_inv_order) {
            rec_data_in = rec_data_in.slice().reverse()
        }

        let n_rec_in = rec_data_in.length
        let n_rows_0 = Math.min(n_rows, n_rec_in)
        let rec_data_in_len = (
            n_rows_0 <= 1 ? n_rec_in : Math.ceil(n_rec_in / n_rows_0 - 0.0001)
        )
        let all_rec_len = rec_data_in_len * (rec_wh + rec_m) - rec_m
        has_bot_top = is_horz ? all_rec_len > w0 : all_rec_len > h0

        let x_cent = x0
        let y_cent = y0
        if (is_horz) {
            let h1 = has_bot_top ? h0 - scroll_rec.w : h0
            x_cent += rec_e
            y_cent += (h1 - (rec_h + (n_rows_0 - 1) * (rec_h + rec_m))) / 2
        }
        else {
            let w1 = has_bot_top ? w0 - scroll_rec.w : w0
            x_cent += (w1 - (rec_w + (n_rows_0 - 1) * (rec_w + rec_m))) / 2
            y_cent += rec_e
        }

        if (!has_bot_top) {
            if (is_horz) {
                x_cent += (w0 - (all_rec_len + 2 * rec_e)) / 2
            }
            else {
                y_cent += (h0 - (all_rec_len + 2 * rec_e)) / 2
            }
        }

        let x_step = rec_w + rec_m
        let y_step = rec_h + rec_m

        let index_shift = 0
        if (is_inv_order && n_rec_in > n_rows) {
            index_shift = (n_rows_0 - n_rec_in % n_rows_0) % n_rows_0
        }
        // let index_shift = (is_inv_order && n_rec_in > n_rows) ? ((n_rows_0 - n_rec_in % n_rows_0) % n_rows_0) : 0;

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        recs[main_tag] = []
        $.each(rec_data_in, function(index, rec_now) {
            let index_now_0 = index + index_shift
            let n_row_now_0 = index_now_0 % n_rows_0
            let n_col_now_0 = Math.floor((index_now_0 - n_row_now_0) / n_rows_0 + 0.00001)

            let n_col_now = is_horz ? n_col_now_0 : n_row_now_0
            let n_row_now = is_horz ? n_row_now_0 : n_col_now_0

            let x_now = n_col_now * x_step
            let y_now = n_row_now * y_step

            let data_now = {
            }
            data_now.scroll_grid_id = main_tag
            data_now.x = x_cent + x_now
            data_now.y = y_cent + y_now
            data_now.w = rec_w
            data_now.h = rec_h
            data_now.id = rec_now.id
            data_now.data = rec_now

            recs[main_tag].push(data_now)
        })

        // ------------------------------------------------------------------
        // correct for current zoom scrolling - match the position of the first rec in view
        // ------------------------------------------------------------------
        if (has_bot_top) {
            let trans = null
            let rec_last_i = recs[main_tag].length - 1

            $.each(recs[main_tag], function(index, rec_now) {
                // get first element which was already in view
                if (!is_def(trans)) {
                    if (is_def(rec_in.ids[rec_now.id])) {
                        trans = rec_in.ids[rec_now.id] - rec_now[xy]
                    }
                }
                // if inverted order, get the last element which was originally in view
                if (is_inv_order || rec_in.is_last_in) {
                    if (is_def(rec_in.ids[rec_now.id])) {
                        trans = rec_in.ids[rec_now.id] - rec_now[xy]
                    }
                }
            })

            if (recs[main_tag][0][xy] + trans > zooms.xy_0) {
                if (recs[main_tag][0][xy] < zooms.xy_0) {
                    trans = zooms.xy_0 - recs[main_tag][0][xy]
                }
                else {
                    trans = null
                }
            }
            else if (recs[main_tag][rec_last_i][xy] + trans < zooms.xy_1) {
                if (recs[main_tag][rec_last_i][xy] > zooms.xy_1) {
                    trans = zooms.xy_1 - recs[main_tag][rec_last_i][xy]
                }
                else {
                    trans = null
                }
            }

            if (is_def(trans)) {
                $.each(recs[main_tag], function(index, data_now) {
                    data_now[xy] += trans
                })
            }
        }

        // // ------------------------------------------------------------------
        // // adjust the transition length for scrolling
        // // ------------------------------------------------------------------
        // let outFrac = 0;
        // if(has_bot_top) {
        //   let xy_min = min_max_obj({
        //     min_max:'min', data:recs[main_tag], func: xy
        //   });
        //   let xy_max = min_max_obj({
        //     min_max:'max', data:recs[main_tag],
        //     func: is_horz ? function(d,i) { return d.x+d.w; } : function(d,i) { return d.y+d.h; }
        //   });
        //   outFrac = (xy_max - xy_min) / ( is_horz?w0:h0 );
        // }
        // zooms.delta = (is_horz ? 1 : -1) * rec_wh * 0.1 * outFrac;

        // ------------------------------------------------------------------
        // activate/disable the zoom behaviour after updating has_bot_top
        // ------------------------------------------------------------------
        set_zoom_status()

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function on_zoom_end() {
            set_vor()
            update_counts()
            // // zoom_scrollbar();

            if (
                (has_bot_top && !is_def(scroll_bar_rec))
                || (!has_bot_top && is_def(scroll_bar_rec))
            ) {
                zoom_scrollbar_init()
            }

            if (has_bot_top) {
                set_rec_scroll()
            }
        }

        let data_out = {
            target_scale: zooms.extent[2],
            duration_scale: 0,
            base_time: 0,
            trans_to: [ 0, 0 ],
            wh: [ w0, h0 ],
            cent: null,
            func_end: on_zoom_end,
            svg: com.g_vor,
            svg_zoom: com[tag_zoom],
            zoom_callable: com[tag_zoom + 'zoomed'],
            svg_zoom_node: com[tag_zoom + 'zoom_node'],
        }

        do_zoom_to_target(data_out)
    }
    this.update = update

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let defs = com.g_base.append('defs')
    let clip_path = defs.append('clipPath').attr('id', tag_clip_path + main_tag)
    // console.log('tag_clip_path + main_tag',tag_clip_path + main_tag)

    com.clip_rec = clip_path
        .append('rect')
        .attr('x', x0)
        .attr('y', y0)
        .attr('width', w0)
        .attr('height', h0)

    if (auto_clip_path) {
        com.g_bck_data.attr('clip-path', 'url(#' + tag_clip_path + main_tag + ')')
        com.g_frnt_data.attr('clip-path', 'url(#' + tag_clip_path + main_tag + ')')
    }

    let frnt = bck_rec_opt.front_prop
    function has_frnt(prop) {
        return is_def(frnt) ? is_def(frnt[prop]) : false
    }

    let bck_rec_data = [{
        id: 'back',
    }]
    if (is_def(frnt)) {
        bck_rec_data.push({
            id: 'frnt',
        })
    }

    com.g_bck
        .selectAll('rect.' + tag_outer)
        .data(bck_rec_data, function(d) {
            return d.id
        })
        .enter()
        .append('rect')
        .attr('class', tag_outer)
        .attr('x', x0)
        .attr('y', y0)
        .attr('width', w0)
        .attr('height', h0)
        .attr('stroke', has_frnt('strk') ? frnt.strk : '#383B42')
        .attr('stroke-width', has_frnt('strkW') ? frnt.strkW : '1')
        .attr('stroke-opacity', function(d, i) {
            let opac = 0
            if (i === 0) {
                if (has_frnt('strk_opac')) {
                    opac = frnt.strk_opac
                }
                else {
                    opac = 1
                }
            }
            return opac
        })
        .attr('fill', function(d, i) {
            let fill = '#383B42'
            if (i === 0) {
                fill = '#F2F2F2'
            }
            else if (has_frnt('fill')) {
                fill = frnt.fill
            }
            return fill
        })
        .attr('fill-opacity', function(d, i) {
            let opac = 0.025
            if (i === 0) {
                opac = 1
            }
            else if (has_frnt('fill_ocp')) {
                opac = frnt.fill_ocp
            }
            return opac
        })
        // .attr("transform", "translate("+(x0)+","+(y0)+")")
        // .style("pointer-events", "none")

    if (is_def(bck_rec_opt.bck_pattern)) {
        bck_pattern(bck_rec_opt.bck_pattern)
    }
    else if (is_def(bck_rec_opt.texture_orient) || is_def(bck_rec_opt.circ_type)) {
        let bck_pat_opt = {
            com: com,
            g_now: com.g_bck,
            g_tag: g_name,
            len_wh: [ w0, h0 ],
            trans: [ x0, y0 ],
            opac: is_def(bck_rec_opt.textureOpac) ? bck_rec_opt.textureOpac : 0.06,
        }

        $.each([ 'texture_orient', 'circ_type', 'size' ], function(index, opt_type) {
            if (is_def(bck_rec_opt[opt_type])) {
                bck_pat_opt[opt_type] = bck_rec_opt[opt_type]
            }
        })

        bck_pattern(bck_pat_opt)
    }

    setup_zoom()

    // com[tag_scroll_bar].call(com[tag_zoom]).on("dblclick.zoom", null);

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    update({
        isInit: true,
    })
}

// // ------------------------------------------------------------------
// // simple example 2017_11_30
// // ------------------------------------------------------------------
// function scrollGridExampleUse (com, svg) {
//   com.g_base = svg.g.append('g')
//   com.g_bck_data = com.g_base.append('g')
//   com.g_vor = com.g_base.append('g')

//   let sbD = {}
//   let x0 = 120
//   let y0 = 120
//   let w0 = 400
//   let h0 = 100
//   let myId = 'myScrollBox'
//   let tag_clip_path = 'myScrollBoxPath'

//   let scrollGridOpt = {
//     // unique id for a given box
//     id: myId,
//     // the group elements (vor in front of data)
//     g: { g_bck_data: com.g_bck_data, g_vor: com.g_vor },
//     // the id of the clip-path element corresponding to the geometry of the box
//     tag_clip_path: tag_clip_path,
//     // if to aplly automatic clip-path to the entire data-g
//     auto_clip_path: true,
//     // dictionary which will be filled with the results
//     recs: sbD,
//     // list of data (can be updated later)
//     rec_data: [],
//     // dimensions of the box
//     x0: x0,
//     y0: y0,
//     w0: w0,
//     h0: h0,
//     // dimentions of data elements inside the box
//     rec_h: h0 * 0.5,
//     rec_w: h0 * 0.5,
//     // boolean to show the number of overflow data elements
//     show_counts: false,
//     // horizonthal/vertical geometry of the box
//     is_horz: true,
//     // properties of the background
//     bck_rec_opt: { texture_orient: '5/8', front_prop: { strk_opac: 0.2 } },
//     // options for the voronoii grid
//     vor_opt: { click: onVorClick },
//     // options for the zooming/scrolling
//     on_zoom: { during: on_zoom_during, end: on_zoom_during },
//     // the global let of the queue loop
//     run_loop: run_loop,
//     // the global let for the locking variable
//     locker: locker
//   }

//   com.scrollGrid = new window.ScrollGrid(scrollGridOpt)

//   let rec_data_now = [
//     { id: 'data0', data: { name: 'xxx', number: 10 } },
//     { id: 'data1', data: { name: 'yyy', number: 9 } },
//     { id: 'data2', data: { name: 'zzz', number: 98 } },
//     { id: 'data3', data: { name: 'eee', number: 1 } },
//     { id: 'data4', data: { name: 'yyy', number: 83 } },
//     { id: 'data5', data: { name: 'dgd', number: 14 } },
//     { id: 'data6', data: { name: '344', number: 18 } },
//     { id: 'data7', data: { name: 'opi', number: 44 } }
//   ]
//   com.scrollGrid.update({ rec_data: rec_data_now })

//   // console.log(sbD[myId]);
//   let rect = com.g_bck_data
//     .selectAll('rect.' + 'myScrollBoxRecs')
//     .data(sbD[myId], function (d) {
//       return d.id
//     })

//   rect
//     .enter()
//     .append('rect')
//     .attr('class', 'myScrollBoxRecs')
//     .attr('stroke-width', '0.5')
//     .style('stroke-opacity', '0.9')
//     .style('fill-opacity', 0.2)
//     .style('stroke', function (d, i) {
//       return d3.rgb(cols_mix[i % cols_mix.length]).darker(0.5)
//     })
//     .style('fill', function (d, i) {
//       return cols_mix[i % cols_mix.length]
//     })
//     .style('opacity', 0)
//     .attr('x', function (d) {
//       return d.x
//     })
//     .attr('y', function (d) {
//       return d.y
//     })
//     .attr('width', function (d) {
//       return d.w
//     })
//     .attr('height', function (d) {
//       return d.h
//     })
//     // .attr("clip-path", function(d){ return "url(#"+tag_clip_path+d.scroll_grid_id+")"; })
//     .transition('new_ele')
//     .duration(times.anim)
//     .style('opacity', 1)

//   // ------------------------------------------------------------------
//   //
//   // ------------------------------------------------------------------
//   function on_zoom_during (opt_in) {
//     let xy = opt_in.xy
//     let rect = com.g_bck_data.selectAll('rect.' + 'myScrollBoxRecs')
//     rect.attr(xy, function (d, i) {
//       return d[xy]
//     })
//   }

//   // ------------------------------------------------------------------
//   //
//   // ------------------------------------------------------------------
//   function onVorClick (opt_in) {
//     let data_now = opt_in.data.data
//     console.log('------------ click my name is :', data_now.data.name)
//   }
// }
