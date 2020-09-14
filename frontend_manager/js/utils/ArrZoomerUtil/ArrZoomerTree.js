// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global inst_health_col */
/* global bck_pattern */
/* global vor_ploy_func */
/* global inst_health_frac */
/* global get_node_wh_by_id */
/* global get_txt_scale */
/* global unique */
/* global tau */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerTree = function(opt_in_top) {
    // console.log(opt_in_top)
    let this_top = this
    // let run_loop = opt_in_top.run_loop
    // let widget_id = opt_in_top.widget_id
    let locker = opt_in_top.locker
    // let is_south = opt_in_top.is_south
    let my_unique_id = unique()

    let ele_base = opt_in_top.ele_base

    let insts = ele_base.insts
    let zooms = ele_base.zooms
    let lock_init_key = ele_base.lock_init_keys.tree

    let avg_tag = ele_base.avg_tag
    let health_tag = ele_base.health_tag
    // let avg_tag_title = ele_base.avg_tag_title
    
    let scale_r = insts.scale_r
    let aspect_ratio = is_def(opt_in_top.aspect_ratio) ? opt_in_top.aspect_ratio : 1
    let get_prop_pos_shift = ele_base.get_prop_pos_shift
    let interpolate01 = ele_base.interpolate01
    let set_zoom_state = ele_base.set_zoom_state
    let props_s1 = ele_base.props_s1

    let show_vor_lines = false
    let has_title = is_def(opt_in_top.has_title) ? opt_in_top.has_title : true

    this_top.has_init = false

    ele_base.set_ele(this_top, 'tree')
    let get_ele = ele_base.get_ele

    // basic lenght for absolute scaling of e.g., fonts
    let len_base = 500
    let svg_dims = {
        w: len_base,
        h: len_base * aspect_ratio,
    }
    let tel_avgs = []
    $.each([ 0, 1 ], function(nState_, nState) {
        if (nState === 0) {
            tel_avgs.push({
                r: svg_dims.w / 4,
                x: svg_dims.w / 2,
                y: svg_dims.h / 2,
            })
        }
        if (nState === 1) {
            let prop_w = svg_dims.w / insts.all_props0.length
            let prop_r = Math.min(prop_w * 0.4, svg_dims.w / 15)
            let prop_y = prop_r * 1.25

            tel_avgs.push({
                r: prop_r,
                h: prop_y * 2,
            })
            $.each(insts.all_props0, function(index, porp_now) {
                tel_avgs[1][porp_now + 'x'] = prop_w * (0.5 + index)
                tel_avgs[1][porp_now + 'y'] = svg_dims.h - prop_y
            })
        }
    })

    svg_dims.w_diff = svg_dims.w * 0.05
    svg_dims.h_diff = has_title ? tel_avgs[1].h : tel_avgs[1].h * 0.8

    svg_dims.w_1 = svg_dims.w
    svg_dims.h_1 = svg_dims.h - svg_dims.h_diff

    let tree_gs = ele_base.svgs.tree
    tree_gs.g = ele_base.svgs.g_svg.append('g')
    tree_gs.g_outer = tree_gs.g.append('g')

    let unique_clip_id = 'clip' + my_unique_id
  
    tree_gs.g_outer.append('defs')
        .append('clipPath')
        .attr('id', unique_clip_id)
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', svg_dims.w)
        .attr('height', svg_dims.h)

    tree_gs.clipped_g = tree_gs.g_outer.append('g')
    tree_gs.clipped_g.attr('class', 'clipped_g')
        .attr('clip-path', 'url(#' + unique_clip_id + ')')

    tree_gs.g_base = tree_gs.clipped_g.append('g')
    tree_gs.g_s0 = tree_gs.g_base.append('g')
    tree_gs.g_s1 = tree_gs.g_base.append('g')

    // ------------------------------------------------------------------
    // scale to [ele_base.base_ele_width x (ele_base.base_ele_width * aspect_ratio) px]
    // (executed after create_more_map())
    // ------------------------------------------------------------------
    tree_gs.g_outer.attr('transform',
        'translate(0,0)scale(' + (ele_base.base_ele_width / svg_dims.w) + ')'
    )

    // ------------------------------------------------------------------
    // to avoid bugs, this is the g which should be used
    // for translations and sacling of this element
    // ------------------------------------------------------------------
    this_top.set_transform = function(trans) {
        if (is_def(trans)) {
            tree_gs.g.attr('transform', trans)
        }
        return tree_gs.g
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let com = {
    }
    let arc_func = {
    }
    let arc_prev = {
    }
    arc_prev.ang = {
    }
    arc_prev.rad = {
    }

    let zoom_target_prop = ''

    // initialize a global function (to be overriden below)
    let zoom_to_pos = function(opt_in) {
        if (!locker.is_free('in_init')) {
            setTimeout(function() {
                zoom_to_pos(opt_in)
            }, times.wait_loop)
        }
    }
    this.zoom_to_pos = zoom_to_pos

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init_data(data_in) {
        if (this_top.has_init) {
            return
        }
        this_top.has_init = true

        // ------------------------------------------------------------------
        // add one rectangle as background, and to allow click to zoom
        // ------------------------------------------------------------------
        this_top.bck_rect = tree_gs.g_s0.append('rect')
        this_top.bck_rect
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', svg_dims.w)
            .attr('height', svg_dims.h)
            .attr('stroke-width', '0')
            .attr('fill', '#F2F2F2')
            // .attr("fill", "red")
            // .style('opacity', 0.6)
            .style('stroke', '#383B42' )
            // .style("stroke",'#F2F2F2' )
            // .style("stroke",'#2196F3' )
            .style('stroke-width', 1)
            .on('click', function() {
                let scale = get_ele('main').get_scale()
                if (scale >= zooms.len['0.1'] && scale < zooms.len['1.0']) {

                    // console.log('FIXME - tree-0 - uncomment zoom_to_target_main')
                    get_ele('main').zoom_to_target_main({
                        target: zooms.target,
                        scale: zooms.len['1.2'],
                        duration_scale: 1,
                    })
                }
            })


        this_top.get_bck_rect = function() {
            return this_top.bck_rect
        }

        // the background grid
        bck_pattern({
            com: com,
            g_now: tree_gs.g_s0,
            g_tag: 'g_s0',
            len_wh: [ svg_dims.w, svg_dims.h ],
            opac: 0.05,
            texture_orient: '2/8',
        })

        tree_gs.g_s1.attr('transform',
            ('translate(' + 0.05 * svg_dims.w_1 + ',')
            + (0.2 * svg_dims.h_1 + ')scale(')
            + (0.9 + ')')
        )

        // ------------------------------------------------------------------
        // some initialization
        // ------------------------------------------------------------------
        // see: http://bl.ocks.org/mbostock/5100636
        com.arc_tween = function(transition, opt_in) {
            // if(opt_in.skip != undefined && opt_in.skip) return null;
            transition.attrTween('d', function(d, i) {
                let id = d.id
                if (is_def(opt_in.index_id)) {
                    id = opt_in.index_id ? d.id : i
                }

                if (is_def(opt_in.inc_ids)) {
                    if (opt_in.inc_ids.indexOf(id) === -1) {
                        return null
                    }
                }
                if (is_def(opt_in.exc_ids)) {
                    if (opt_in.exc_ids.indexOf(id) >= 0) {
                        return null
                    }
                }

                let tag_now = opt_in.tag_now
                let ang_str_0 = (
                    opt_in.ang_str_0
                        ? arc_func[tag_now][opt_in.ang_str_0](d)
                        : opt_in.arc_prev[tag_now].ang[id][0]
                )
                let ang_str_1 = (
                    opt_in.ang_str_1
                        ? arc_func[tag_now][opt_in.ang_str_1](d)
                        : opt_in.arc_prev[tag_now].ang[id][0]
                )
                let ang_end_0 = (
                    opt_in.ang_end_0
                        ? arc_func[tag_now][opt_in.ang_end_0](d)
                        : opt_in.arc_prev[tag_now].ang[id][1]
                )
                let ang_end_1 = (
                    opt_in.ang_end_1
                        ? arc_func[tag_now][opt_in.ang_end_1](d)
                        : opt_in.arc_prev[tag_now].ang[id][1]
                )
                let r_in_0 = (
                    opt_in.r_in_0
                        ? arc_func[tag_now][opt_in.r_in_0](d)
                        : opt_in.arc_prev[tag_now].rad[id][0]
                )
                let r_in_1 = (
                    opt_in.r_in_1
                        ? arc_func[tag_now][opt_in.r_in_1](d)
                        : opt_in.arc_prev[tag_now].rad[id][0]
                )
                let r_out_0 = (
                    opt_in.r_out_0
                        ? arc_func[tag_now][opt_in.r_out_0](d)
                        : opt_in.arc_prev[tag_now].rad[id][1]
                )
                let r_out_1 = (
                    opt_in.r_out_1
                        ? arc_func[tag_now][opt_in.r_out_1](d)
                        : opt_in.arc_prev[tag_now].rad[id][1]
                )

                let need_upd = 0
                if (Math.abs(ang_str_0 - ang_str_1) / ang_str_0 > 1e-5) {
                    need_upd++
                }
                if (Math.abs(ang_end_0 - ang_end_1) / ang_end_0 > 1e-5) {
                    need_upd++
                }
                if (Math.abs(r_in_0 - r_in_1) / r_in_0 > 1e-5) {
                    need_upd++
                }
                if (Math.abs(r_out_0 - r_out_1) / r_out_0 > 1e-5) {
                    need_upd++
                }
                if (need_upd === 0) {
                    return null
                }

                let arc = d3.arc()
                return function(t) {
                    let intrp_now = interpolate01(t)
                    d.startAngle = ang_str_0 + (ang_str_1 - ang_str_0) * intrp_now
                    d.endAngle = ang_end_0 + (ang_end_1 - ang_end_0) * intrp_now
                    d.innerRadius = r_in_0 + (r_in_1 - r_in_0) * intrp_now
                    d.outerRadius = r_out_0 + (r_out_1 - r_out_0) * intrp_now

                    opt_in.arc_prev[tag_now].ang[id][0] = d.startAngle
                    opt_in.arc_prev[tag_now].ang[id][1] = d.endAngle
                    opt_in.arc_prev[tag_now].rad[id][0] = d.innerRadius
                    opt_in.arc_prev[tag_now].rad[id][1] = d.outerRadius

                    return arc(d)
                }
            })
        }

        // state-01 initialization (needed before s01inner(), s01outer())
        com.s01 = {
        }
        com.s01.g = tree_gs.g_s0.append('g')
        com.s01.g_text = tree_gs.g_s0.append('g')

        // state-1 initialization (needed before updateLiveDataS1())
        com.s10 = {
        }
        com.s10.g = tree_gs.g_s1.append('g')

        locker.remove(lock_init_key)
        return
    }
    this.init_data = init_data

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_state_once() {
        let scale = get_ele('main').get_scale()
        if (scale < zooms.len['1.0']) {
            tel_hierarchy({
                tel_id: '',
                click_in: false,
                remove: true,
            })
        }

        if (scale <= zooms.len['0.1']) {
            let props_in = {
                tel_id: avg_tag,
                props: insts.props[''],
                props0: insts.props0[''],
                prop_titles: insts.prop_titles[''],
            }

            tel_arcs({
                data_in: [ insts.data[avg_tag] ],
                props_in: props_in,
                state: 0,
            })
            
            set_sub_prop({
                tel_id: avg_tag,
                prop_in: '',
            })
        }
        else {
            let target_index = insts.data.id_indices[zooms.target]
            let props_in = {
                tel_id: zooms.target,
                props: insts.props[zooms.target],
                props0: insts.props0[zooms.target],
                prop_titles: insts.prop_titles[''],
            }

            if (scale < zooms.len['1.0']) {
                tel_arcs({
                    data_in: [ insts.data.tel[target_index] ],
                    props_in: props_in,
                    state: 0,
                })

                set_sub_prop({
                    tel_id: zooms.target,
                    prop_in: '',
                })
            }
            else {
                tel_arcs({
                    data_in: [ insts.data.tel[target_index] ],
                    props_in: props_in,
                    state: 1,
                })
            }
        }
    }
    this.set_state_once = set_state_once

    // ------------------------------------------------------------------
    // innner arcs for the different properties
    // ------------------------------------------------------------------
    function tel_arcs(opt_in) {
        let data_in = opt_in.data_in
        let props_in = opt_in.props_in
        let state = opt_in.state
        let tel_id_in = props_in.tel_id
        let props = props_in.props
        let props0 = props_in.props0
        let prop_titles = props_in.prop_titles
        let tag_state = 'state01'

        function get_prop_index(id, porp_in) {
            return insts.props[id].indexOf(porp_in)
        }

        if (!is_def(com.s01.inner)) {
            com.s01.inner = true

            $.each(insts.all_props, function(_, porp_now) {
                $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
                    let tag_now = porp_now + n_arc_draw_now
                    let is_s0 = n_arc_draw_now === 0

                    arc_func[tag_now] = {
                    }
                    arc_func[tag_now].rad_00 = function(d) {
                        return tel_avgs[d.state].r * (is_s0 ? 0.1 : 0.1)
                    }
                    arc_func[tag_now].rad_01 = function(d) {
                        return tel_avgs[d.state].r * (is_s0 ? 0.95 : 0.99)
                    }
                    arc_func[tag_now].ang_00 = function(d) {
                        if (!is_def(d[porp_now])) {
                            return 0
                        }
                        return (
                            get_prop_index(d.id, porp_now)
                            * insts.tau_fracs[d.id] + insts.tau_space
                        )
                    }
                    arc_func[tag_now].ang_01 = function(d) {
                        if (!is_def(d[porp_now])) {
                            return 0
                        }
                        return (
                            get_prop_index(d.id, porp_now) * insts.tau_fracs[d.id]
                            + insts.tau_space
                            + (insts.tau_fracs[d.id] - insts.tau_space * 2)
                            * (is_s0 ? 1 : inst_health_frac(d[porp_now]))
                        )
                    }
                    arc_func[tag_now].ang_10 = function(d) {
                        if (!is_def(d[porp_now])) {
                            return 0
                        }
                        return 0.1
                    }
                    arc_func[tag_now].ang_11 = function(d) {
                        if (!is_def(d[porp_now])) {
                            return 0
                        }
                        return (
                            is_s0 ? tau : tau * inst_health_frac(d[porp_now])
                        )
                    }
                })
            })
        }

        // ------------------------------------------------------------------
        // innner arcs for the different properties
        // ------------------------------------------------------------------
        let pos = {
        }
        let ang_state = {
        }
        let rad_state = {
        }

        $.each(insts.all_props0, function(_, porp_now) {
            if (state === 0) {
                pos[porp_now] = {
                    x: tel_avgs[state].x,
                    y: tel_avgs[state].y,
                }
                ang_state = {
                    ang_str_1: 'ang_00',
                    ang_end_1: 'ang_01',
                }
                rad_state = {
                    r_in_1: 'rad_00',
                    r_out_1: 'rad_01',
                }
            }
            else {
                pos[porp_now] = {
                    x: tel_avgs[state][porp_now + 'x'],
                    y: tel_avgs[state][porp_now + 'y'],
                }
                ang_state = {
                    ang_str_1: 'ang_10',
                    ang_end_1: 'ang_11',
                }
                rad_state = {
                    r_in_1: 'rad_10',
                    r_out_1: 'rad_11',
                }
            }
        })

        $.each(insts.all_props, function(_, porp_now) {
            $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
                let tag_now = porp_now + n_arc_draw_now
                let is_s0 = n_arc_draw_now === 0

                if (!is_def(arc_prev[tag_now])) {
                    arc_prev[tag_now] = {
                    }
                    arc_prev[tag_now].ang = {
                    }
                    arc_prev[tag_now].rad = {
                    }
                }

                let data_now = data_in
                if (data_in.length > 0) {
                    if (!is_def(data_in[0][porp_now])) {
                        data_now = []
                    }
                }

                let path = com.s01.g
                    .selectAll('path.' + tag_now)
                    .data(data_now, function(d, i) {
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
                    .attr('class', tag_state + ' ' + tag_now)
                    // .style("opacity",  function(d) { return is_s0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is_s0)
                    .style('opacity', (is_s0 ? '0.5' : '1'))
                    .attr('transform',
                        'translate(' + pos[porp_now].x
                        + ',' + pos[porp_now].y + ')'
                    )
                    .style('stroke', function(d) {
                        return (is_s0 ? null : inst_health_col(d[porp_now]))
                    })
                    .style('fill', function(d) {
                        return inst_health_col(d[porp_now])
                    })
                    .each(function(d, i) {
                        d.state = state
                        arc_prev[tag_now].ang[i] = [
                            arc_func[tag_now].ang_00(d),
                            arc_func[tag_now].ang_00(d),
                        ]
                        arc_prev[tag_now].rad[i] = [
                            arc_func[tag_now].rad_00(d),
                            arc_func[tag_now].rad_01(d),
                        ]
                    })
                    .merge(path)
                    .each(function(d, _) {
                        d.state = state
                    })
                    .transition('update')
                    .duration(times.anim * 2)
                    .attr('transform',
                        'translate(' + pos[porp_now].x
                        + ',' + pos[porp_now].y + ')'
                    )
                    .style('stroke', function(d) {
                        return is_s0 ? null : inst_health_col(d[porp_now])
                    })
                    .style('fill', function(d) {
                        return inst_health_col(d[porp_now])
                    })
                    // .each(function (d, i) {
                    //   // console.log('MNM', i, tag_now, '!!!',arc_prev[tag_now].ang[0], '!!!', d)
                    // })
                    // .each(function (d, i) {
                    //   d.tau_frac_now = tau_frac_in
                    // })
                    .call(com.arc_tween, {
                        tag_now: tag_now,
                        arc_prev: arc_prev,
                        index_id: false,
                        ang_str_0: null,
                        ang_str_1: ang_state.ang_str_1,
                        ang_end_0: null,
                        ang_end_1: ang_state.ang_end_1,
                        r_in_0: null,
                        r_in_1: 'rad_00',
                        r_out_0: null,
                        r_out_1: 'rad_01',
                    })

                // operate on exiting elements only
                path
                    .exit()
                    .transition('out')
                    .duration(times.anim)
                    .call(com.arc_tween, {
                        tag_now: tag_now,
                        arc_prev: arc_prev,
                        index_id: false,
                        ang_str_0: null,
                        ang_str_1: 'ang_00',
                        ang_end_0: null,
                        ang_end_1: 'ang_00',
                        r_in_0: null,
                        r_in_1: 'rad_00',
                        r_out_0: null,
                        r_out_1: 'rad_01',
                    })
                    .remove()
            })
        })

        // ------------------------------------------------------------------
        // outer rings for the health_tag (equivalent of s00_D metric in s01_D)
        // ------------------------------------------------------------------
        let porp_all = health_tag

        if (!is_def(com.s01.outer)) {
            com.s01.outer = true

            $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
                let tag_now = porp_all + n_arc_draw_now
                let is_s0 = n_arc_draw_now === 0

                arc_func[tag_now] = {
                }
                arc_func[tag_now].rad_00 = function(d) {
                    return (
                        tel_avgs[d.state].r
                        * scale_r[0].health0 * (is_s0 ? 1 : 0.95)
                    )
                }
                arc_func[tag_now].rad_01 = function(d) {
                    return (
                        tel_avgs[d.state].r
                        * scale_r[0].health1 * (is_s0 ? 1 : 1.05)
                    )
                }
                arc_func[tag_now].rad_10 = function(d) {
                    return (
                        tel_avgs[d.state].r
                        * scale_r[1].health0 * (is_s0 ? 0.475 : 0.4)
                    )
                }
                arc_func[tag_now].rad_11 = function(d) {
                    return (
                        tel_avgs[d.state].r
                        * scale_r[1].health1 * (is_s0 ? 0.525 : 0.6)
                    )
                }
                arc_func[tag_now].ang_00 = function(_) {
                    return 0
                }
                arc_func[tag_now].ang_01 = function(d) {
                    return (
                        is_s0 ? tau : tau * inst_health_frac(d[health_tag])
                    )
                }
            })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
            let tag_now = porp_all + n_arc_draw_now
            let is_s0 = n_arc_draw_now === 0

            if (!is_def(arc_prev[tag_now])) {
                arc_prev[tag_now] = {
                }
                arc_prev[tag_now].ang = {
                }
                arc_prev[tag_now].rad = {
                }
            }

            let path = com.s01.g
                .selectAll('path.' + tag_now)
                .data(data_in, function(d, i) {
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
                .attr('class', tag_state + ' ' + tag_now)
                // .style("opacity",  function(d) { return is_s0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is_s0)
                .style('opacity', (is_s0 ? '0.5' : '1'))
                .attr('transform',
                    'translate(' + pos[porp_all].x + ',' + pos[porp_all].y + ')'
                )
                .style('stroke', function(d) {
                    return (is_s0 ? null : inst_health_col(d[porp_all]))
                })
                .style('fill', function(d) {
                    return inst_health_col(d[porp_all])
                })
                .each(function(d, i) {
                    d.state = state
                    arc_prev[tag_now].ang[i] = [
                        arc_func[tag_now].ang_00(d),
                        arc_func[tag_now].ang_00(d),
                    ]
                    arc_prev[tag_now].rad[i] = [
                        arc_func[tag_now].rad_00(d),
                        arc_func[tag_now].rad_01(d),
                    ]
                })
                .merge(path)
                .each(function(d) {
                    d.state = state
                })
                .transition('update')
                .duration(times.anim * 2)
                .attr('transform',
                    'translate(' + pos[porp_all].x
                    + ',' + pos[porp_all].y + ')'
                )
                .style('stroke', function(d) {
                    return (is_s0 ? null : inst_health_col(d[porp_all]))
                })
                .style('fill', function(d) {
                    return inst_health_col(d[porp_all])
                })
                .call(com.arc_tween, {
                    tag_now: tag_now,
                    arc_prev: arc_prev,
                    index_id: false,
                    ang_str_0: null,
                    ang_str_1: null,
                    ang_end_0: null,
                    ang_end_1: 'ang_01',
                    r_in_0: null,
                    r_in_1: rad_state.r_in_1,
                    r_out_0: null,
                    r_out_1: rad_state.r_out_1,
                })

            // operate on exiting elements only
            path
                .exit()
                .transition('out')
                .duration(times.anim)
                .call(com.arc_tween, {
                    tag_now: tag_now,
                    arc_prev: arc_prev,
                    index_id: false,
                    ang_str_0: null,
                    ang_str_1: 'ang_00',
                    ang_end_0: null,
                    ang_end_1: 'ang_00',
                    r_in_0: null,
                    r_in_1: 'rad_00',
                    r_out_0: null,
                    r_out_1: 'rad_01',
                })
                .remove()
        })

        // ------------------------------------------------------------------
        // invisible rectangle for selecting a property
        // ------------------------------------------------------------------
        let rect_tag = tag_state + '_rect'
        let title_tag = tag_state + '_title'
        let recs = []
        let texts = []
        let all_props_now = state ? insts.all_props0 : props0

        $.each(all_props_now, function(_, porp_now) {
            let prop_index = get_prop_index(tel_id_in, porp_now)
            let txt_r = tel_avgs[state].r * scale_r[state].health1 * 1.2
            let xy = get_prop_pos_shift('xy', txt_r, prop_index, props.length)
            let opac = state === 0 ? 0.7 : 0.9
            if (state === 1 && props.indexOf(porp_now) === -1) {
                opac *= 0.5
            }

            if (insts.all_props.indexOf(porp_now) >= 0) {
                let anch = 'end'
                if (state === 1 || Math.abs(xy[0] / tel_avgs[state].r) < 0.001) {
                    anch = 'middle'
                }
                else if (xy[0] < 0) {
                    anch = 'start'
                }

                texts.push({
                    id: title_tag + porp_now,
                    text: prop_titles[porp_now],
                    prop: porp_now,
                    h: state === 0 ? 30 : 16,
                    xy: state === 0 ? xy : [ 0, 0 ],
                    x: state === 0 ? tel_avgs[state].x - xy[0] : pos[porp_now].x,
                    y: state === 0 ? tel_avgs[state].y - xy[1] : pos[porp_now].y,
                    strk_w: state === 1 ? 0.5 : 0.2,
                    fWgt: state === 0 ? 'bold' : 'normal',
                    opac: opac,
                    anch: anch,
                })
            }

            let rec_h = tel_avgs[1].h
            let rec_w = Math.abs(
                tel_avgs[1][insts.all_props[0] + 'x']
                - tel_avgs[1][insts.all_props[1] + 'x']
            )
            let rec_x = tel_avgs[1][porp_now + 'x'] - rec_h / 2 - (rec_w - rec_h) / 2
            let rec_y = svg_dims.h - rec_h

            recs.push({
                id: rect_tag + porp_now,
                prop: porp_now,
                h: tel_avgs[1].h,
                w: rec_w,
                x: rec_x,
                y: rec_y,
            })
        })

        let ele_h = null

        let title = com.s01.g_text
            .selectAll('text.' + title_tag)
            .data(texts, function(d) {
                return d.id
            })

        title
            .enter()
            .append('text')
            // .attr("id", function(d) { return my_unique_id+d.id; })
            .text(function(d) {
                return d.text
            })
            .attr('class', tag_state + ' ' + title_tag)
            .style('opacity', '0')
            .style('fill-opacity', 0.7)
            .style('fill', '#383b42')
            // .attr("stroke-width", function(d) { return d.strk_w; })
            .style('stroke', '#383b42')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')'
            })
            .merge(title)
            .style('font-size', function(d) {
                return d.h + 'px'
            })
            .transition('update1')
            .duration(times.anim * 2)
            .style('stroke-width', function(d) {
                return d.strk_w
            })
            .style('stroke-opacity', 1)
            .style('font-weight', function(d) {
                return d.fWgt
            })
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')'
            })
            .attr('text-anchor', function(d) {
                return d.anch
            })
            .attr('dy', function(d) {
                if (!is_def(ele_h)) {
                    ele_h = get_node_wh_by_id({
                        selction: com.s01.g_text.selectAll('text.' + title_tag),
                        id: d.id,
                    }).height
                    ele_h *= get_txt_scale()
                }
                return ele_h + 'px'
            })
            .style('opacity', function(d) {
                return d.opac
            })

        title
            .exit()
            .transition('exit')
            .duration(times.anim)
            .style('opacity', '0')
            .remove()

        // ------------------------------------------------------------------
        // invisible rectangle for the selecting a property
        // ------------------------------------------------------------------
        let recs_now = (state === 1 ? recs : [])
        let rect = com.s01.g_text
            .selectAll('rect.' + rect_tag)
            .data(recs_now, function(d) {
                return d.id
            })

        rect
            .enter()
            .append('rect')
            .attr('class', rect_tag)
            .attr('opacity', 0)
            // .attr('opacity', 0.1)
            .style('stroke-width', '0')
            // .style("fill", "#383b42").style("stroke", "red").attr("opacity", 0.1).style("stroke-width", "1")
            .attr('height', function(d) {
                return d.h
            })
            .attr('width', function(d) {
                return d.w
            })
            // .attr('height', rec_h)
            // .attr('width', rec_w)
            // .attr('transform', function (d) {
            //   return 'translate(' + -rec_w * 2 + ',' + rec_y + ')'
            // })
            .merge(rect)
            .on('click', rec_click)
            .transition('enter')
            .duration(times.anim)
            .attr('transform', function(d) {
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
        function rec_click(d, _) {
            let rec_locks = [
                's10_bck_arc_change', 'data_change', 's10_click_hierarchy',
            ]
            if (!locker.are_free(rec_locks)) {
                return
            }

            let click_in = d.prop !== health_tag
            let prop_in = click_in ? d.prop : ''
            if (props.indexOf(d.prop) === -1) {
                click_in = true
                prop_in = ''
            }

            get_ele('main').zoom_to_target_main({
                target: zooms.target,
                scale: zooms.len['1.2'],
                duration_scale: 1,
            })

            props_s1({
                tel_id: zooms.target,
                click_in: click_in,
                prop_in: prop_in,
                do_func: [ 'bck_arc_click' ],
                debug: 'tel_arcs',
            })

            return
        }
    
        return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let prev_tel_hierarchy_prop = ''
    function tel_hierarchy(opt_in) {
        function may_update() {
            return locker.is_free([
                'update_tel_hierarchy_tree',
                'data_change',
                's10_bck_arc_change',
                's10_click_hierarchy',
                'update_tel_hierarchy',
                'zoom',
                'auto_zoom_target',
                'zoom_to_target_mini',
                'zoom_to_target_ches',
            ])
        }
        if (!may_update()) {
            setTimeout(function() {
                tel_hierarchy(opt_in)
            }, times.anim / 3)
            return
        }
        // if(!is_def(opt_in)) return;
        // console.log('tel_hierarchy',opt_in);

        let tag_state = 'state_10'
        let tag_nodes = tag_state + '_circ'
        let tag_text = tag_state + '_text'
        let tag_vor = tag_state + '_vor'
        let tag_links = tag_state + '_path'

        let node_r = 15
        let tree_w = svg_dims.w_1 - svg_dims.w_diff
        let tree_h = svg_dims.h_1

        function get_ele_id(d) {
            return d.data.id
        }

        let tel_id = ''
        let click_in = false
        let prop_in = ''
        let remove = false
        if (is_def(opt_in)) {
            if (is_def(opt_in.tel_id)) {
                tel_id = opt_in.tel_id
            }
            if (is_def(opt_in.click_in)) {
                click_in = opt_in.click_in
            }
            if (is_def(opt_in.remove)) {
                remove = opt_in.remove
            }
            if (is_def(opt_in.prop_in)) {
                prop_in = opt_in.prop_in
            }
        }
        else {
            // if(!is_def(opt_in) || is_update)
            prop_in = prev_tel_hierarchy_prop
            click_in = prop_in !== ''
        }

        if (zooms.target !== tel_id || !is_def(insts.data.prop_data_s1[tel_id])) {
            click_in = false
            remove = true
        }
        else if (prop_in === '') {
            click_in = false
        }

        // ------------------------------------------------------------------
        // update the title
        // ------------------------------------------------------------------
        set_sub_prop({
            tel_id: tel_id,
            prop_in: (click_in ? prop_in : ''),
        })

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (!remove && prop_in !== '') {
            if (!is_def(insts.data.prop_data_s1[tel_id][prop_in])) {
                return
            }
        }

        locker.add({
            id: 'update_tel_hierarchy_tree',
            override: true,
        })

        // ------------------------------------------------------------------
        // define the containing g with small margins on the sides
        // ------------------------------------------------------------------
        if (!is_def(com.s10.g_hierarchy)) {
            let trans_y = has_title ? -svg_dims.h_diff : -svg_dims.h_diff * 1.8
            com.s10.g_hierarchy = com.s10.g.append('g')
            com.s10.g_hierarchy.attr('transform',
                'translate(' + (svg_dims.w_diff / 2) + ',' + trans_y + ')'
            )
        }

        let has_data_base = (
            !click_in
            && !remove
            && is_def(insts.data.data_base_s1[tel_id])
        )

        // ------------------------------------------------------------------
        // the tree hierarchy
        // ------------------------------------------------------------------
        let desc = []
        let data_path = []
        let max_depth = 0
        if (click_in || has_data_base) {
            // initialize the zoom upon any change of the hirch
            this_top.zoom_to_pos({
                target: null,
                scale: zooms.len['0.0'],
                duration_scale: 1,
            })

            let data_hierarchy = (
                click_in
                    ? insts.data.prop_data_s1[tel_id][prop_in]
                    : insts.data.data_base_s1[tel_id]
            )
            let hirch = d3.hierarchy(data_hierarchy)
            let tree = d3.tree().size([ tree_h, tree_w ])
            tree(hirch)

            desc = hirch.descendants()
            data_path = desc.slice(1)

            $.each(desc, function(index, data_now) {
                max_depth = Math.max(max_depth, data_now.depth)
            })

            let data_xs = []
            $.each(desc, function(index, data_now) {
                if (max_depth === data_now.depth) {
                    data_xs.push(Number(data_now.x))
                }
            })

            let min_diff = -1
            if (data_xs.length > 1) {
                data_xs.sort(d3.ascending)

                min_diff = data_xs[1] - data_xs[0]
                $.each(data_xs, function(index, _) {
                    if (index > 0) {
                        let diff_now = data_xs[index] - data_xs[index - 1]
                        if (diff_now < min_diff) {
                            min_diff = diff_now
                        }
                    }
                })

                node_r = Math.min(min_diff / 2.3, node_r)
            }
            else {
                node_r = 5
            }

            prev_tel_hierarchy_prop = prop_in
        }
        else {
            prev_tel_hierarchy_prop = ''
        }

        function font_size(d) {
            return Math.max(10, Math.min(d.node_r * 2, 15))
        }

        // ------------------------------------------------------------------
        // circles
        // ------------------------------------------------------------------
        let circs = com.s10.g_hierarchy
            .selectAll('circle.' + tag_nodes)
            .data(desc, get_ele_id)

        circs
            .enter()
            .append('circle')
            .attr('class', tag_nodes)
            // .attr("id", function(d) { return my_unique_id+tag_nodes+d.data.id; })
            .attr('r', 0)
            .attr('transform', function(d) {
                return 'translate(' + d.y + ',' + d.x + ')'
            })
            .style('stroke', function(d) {
                return inst_health_col(d.data.val, 0.5)
            })
            .style('fill', function(d) {
                return inst_health_col(d.data.val)
            })
            .attr('opacity', 0.85)
            .attr('vector-effect', 'non-scaling-stroke')
            .attr('pointer-events', 'none')
            .style('fill-opacity', 1)
            .merge(circs)
            .each(function(d) {
                d.node_r = node_r
            })
            .transition('update')
            .duration(times.anim)
            .attr('transform', function(d) {
                return 'translate(' + d.y + ',' + d.x + ')'
            })
            .attr('r', function(d) {
                return d.node_r
            })
            .style('stroke', function(d) {
                return inst_health_col(d.data.val)
            })
            .style('fill', function(d) {
                return inst_health_col(d.data.val)
            })
            // .each(function(d,i){ console.log(i,d.data); })

        circs
            .exit()
            .transition('out')
            .duration(times.anim / 2)
            .attr('r', 0)
            .remove()

        // ------------------------------------------------------------------
        // labels
        // ------------------------------------------------------------------
        let text = com.s10.g_hierarchy
            .selectAll('text.' + tag_text)
            .data(desc, get_ele_id)

        text
            .enter()
            .append('text')
            .attr('class', tag_text)
            .text(get_text)
            .attr('transform', txt_trans)
            .style('font-size', function(d) {
                return font_size(d) + 'px'
            })
            .style('text-anchor', txt_anch)
            .style('stroke', '#383b42')
            .attr('pointer-events', 'none')
            .attr('vector-effect', 'non-scaling-stroke')
            .attr('opacity', 0)
            .merge(text)
            .style('stroke-width', click_in ? 1 : 0.2)
            .style('font-size', function(d) {
                return font_size(d) + 'px'
            })
            .transition('update')
            .duration(times.anim)
            .attr('opacity', 1)
            .attr('transform', txt_trans)
            .style('text-anchor', txt_anch)
            // .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
            .text(get_text)

        text
            .exit()
            .transition('out')
            .duration(times.anim / 2)
            .attr('opacity', 0)
            .remove()

        function txt_trans(d, _) {
            let d0 = d.node_r + Math.min(10, d.node_r)
            let d1 = get_node_wh_by_id({
                selction: com.s10.g_hierarchy.selectAll('text.' + tag_text),
                id: get_ele_id(d),
                get_id: get_ele_id,
            }).height
            d1 *= get_txt_scale()

            return ('translate(' + (d.y - d0) + ',' + (d.x + d1) + ')')
        }
        function txt_anch(_) {
            return 'end'
        }
        function get_text(d) {
            let output
            if (!d.parent) {
                output = ''
            }
            else {
                output = (d.data.id === prop_in ? '' : d.data.title)
            }
            return output
        }

        // ------------------------------------------------------------------
        // links
        // ------------------------------------------------------------------
        let path = com.s10.g_hierarchy
            .selectAll('path.' + tag_links)
            .data(data_path, get_ele_id)

        path
            .enter()
            .append('path')
            .attr('class', tag_links)
            .style('fill', 'transparent')
            .style('stroke', '#383b42')
            .style('stroke-width', '1')
            .attr('vector-effect', 'non-scaling-stroke')
            .attr('pointer-events', 'none')
            .attr('opacity', 0)
            .attr('d', link_func)
            .merge(path)
            .attr('opacity', 0.15)
            .transition('update')
            .duration(times.anim)
            .attr('d', link_func)

        path
            .exit()
            .transition('out')
            .duration(times.anim / 2)
            .attr('opacity', 0)
            .remove()

        function link_func(d) {
            return (
                ('M' + d.y + ',' + d.x + 'C')
                + ((d.y + d.parent.y) / 2 + ',' + d.x)
                + (' ' + (d.y + d.parent.y) / 2 + ',')
                + (d.parent.x + ' ' + d.parent.y + ',' + d.parent.x)
            )
        }

        // highlight on hover, using voronoi mapping
        // invert x,y in order to turn by 90deg
        let voronoi = d3.Delaunay
            .from(desc, d => d.y, d => d.x)
            // .from(desc, d => d.x, d => d.y)
            .voronoi([0, 0, tree_w, tree_h])

        let vor = com.s10.g_hierarchy
            .selectAll('path.' + tag_vor)
            .data(desc, function(d, i) {
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
            .on('mouseover', function(d) {
                focus_ele(d, true)
            })
            .on('mouseout', function(d) {
                focus_ele(d, false)
            })
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
            com.s10.g_hierarchy
                .selectAll('path.' + tag_vor)
                .style('opacity', '0.5')
                .style('stroke-width', '1.5')
                .style('stroke', '#E91E63')
        }

        // the click function
        // ------------------------------------------------------------------
        function vor_click(d) {
            set_sub_prop({
                tel_id: tel_id,
                prop_in: d.data.id,
            })

            let click_in = true
            let data_id = d.data.id
            let id_now = (is_def(d.parent) ? d.parent.data.id : data_id)

            let parent_name = insts.data.prop_parent_s1[tel_id][data_id]
            if (parent_name === data_id) {
                id_now = parent_name
            }

            if (!is_def(parent_name)) {
                parent_name = ''
                click_in = false
            }

            set_zoom_state()

            get_ele('main').bck_arc_click({
                click_in: click_in,
                prop_in: parent_name,
                only_open: true,
            })

            get_ele('main').hierarchy_style_click({
                prop_in: parent_name,
                id: id_now,
                is_open: true,
                sync_prop: data_id,
            })

            return
        }

        // ------------------------------------------------------------------
        // the highlight function
        // ------------------------------------------------------------------
        function focus_ele(data_now, is_on) {
            let id_now = data_now.data.id

            if (is_on) {
                if (!may_update()) {
                    return
                }

                com.s10.g_hierarchy
                    .selectAll('circle.' + tag_nodes)
                    .transition('highlight')
                    .duration(times.anim / 2)
                    .attr('r', function(d) {
                        return (d.data.id === id_now ? d.node_r * 1.5 : d.node_r)
                    })
                    .style('fill-opacity', function(d) {
                        return (d.data.id === id_now ? 0.6 : 1)
                    })

                com.s10.g_hierarchy
                    .selectAll('text.' + tag_text)
                    .transition('highlight')
                    .duration(times.anim / 2)
                    .style('font-size', function(d) {
                        let is_id = d.data.id === id_now
                        return (
                            (is_id ? font_size(d) * 2 : font_size(d)) + 'px'
                        )
                    })
                    .style('font-weight', function(d) {
                        return (d.data.id === id_now ? 'bold' : 'normal')
                    })
            }
            else {
                if (!may_update()) {
                    setTimeout(function() {
                        reset_r()
                    }, 20)
                    return
                }

                reset_r()
            }

            function reset_r() {
                com.s10.g_hierarchy
                    .selectAll('circle.' + tag_nodes)
                    .transition('highlight')
                    .duration(times.anim / 2)
                    .attr('r', function(d) {
                        return d.node_r
                    })
                    .style('fill-opacity', 1)

                com.s10.g_hierarchy
                    .selectAll('text.' + tag_text)
                    .transition('highlight')
                    .duration(times.anim / 2)
                    .style('font-size', function(d) {
                        return font_size(d) + 'px'
                    })
                    .style('font-weight', 'normal')
            
                return
            }
        
            return
        }

        locker.remove({
            id: 'update_tel_hierarchy_tree',
            delay: times.anim,
        })
    }
    this.tel_hierarchy = tel_hierarchy

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_sub_prop(opt_in) {
        zoom_target_prop = opt_in.prop_in
        let tel_id = opt_in.tel_id
        let prop_in = opt_in.prop_in
        let parent_name = (
            prop_in === '' ? null : insts.data.prop_parent_s1[tel_id][prop_in]
        )

        if (has_title) {
            ele_base.tel_prop_title({
                tel_id: tel_id,
                prop_in: prop_in,
                parent_name: parent_name,
                g_in: com.s01.g_text,
                g_w: svg_dims.w,
            })
        }

        rect_heighlight({
            tel_id: tel_id,
            prop_in: prop_in,
            parent_name: parent_name,
        })

        return
    }

    
    // ------------------------------------------------------------------
    // highlight rectangle for the selected property
    // ------------------------------------------------------------------
    function rect_heighlight(opt_in) {
        let tel_id = opt_in.tel_id
        let prop_in = opt_in.prop_in
        let tag_state = 'state_10'
        let parent_name = opt_in.parent_name

        if (prop_in !== '' && !is_def(parent_name)) {
            return
        }

        let rect_tag = tag_state + '_rect_select'
        let porp_now = prop_in
        if (prop_in !== '') {
            porp_now = insts.data.prop_parent_s1[tel_id][prop_in]
        }

        let porp_x = (porp_now === '' ? health_tag : porp_now) + 'x'
        let rec_h = tel_avgs[1].h
        let rec_w = rec_h * 1.5
        let rec_x = tel_avgs[1][porp_x] - rec_h / 2 - (rec_w - rec_h) / 2
        let rec_y = svg_dims.h - rec_h

        let data_in = []
        if (get_ele('main').get_scale() >= zooms.len['1.0']) {
            data_in.push({
                id: porp_x,
            })
        }
        let rect = com.s01.g
            .selectAll('rect.' + rect_tag)
            .data(data_in, function(d, i) {
                return i
            })

        rect
            .enter()
            .append('rect')
            .attr('class', rect_tag)
            .style('fill', '#383b42')
            // .style("stroke", "#383b42")
            .style('pointer-events', 'none')
            .style('stroke-width', '0')
            .attr('opacity', 0)
            .attr('height', rec_h)
            .attr('width', rec_w)
            .attr('transform',
                'translate(' + -rec_w * 2 + ',' + rec_y + ')'
            )
            .merge(rect)
            .transition('enter')
            .duration(times.anim)
            .attr('opacity', 0.05)
            .attr('transform',
                'translate(' + rec_x + ',' + rec_y + ')'
            )

        rect
            .exit()
            .transition('out')
            .duration(times.anim)
            .attr('transform',
                'translate(' + svg_dims.h + ',' + rec_y + ')'
            )
            .attr('opacity', 0)
            .remove()
    
        return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_s1(data_in) {
        let lock_keys = [
            's10_bck_arc_change', 's10_click_hierarchy', 'update_tel_hierarchy',
        ]
        if (!locker.are_free(lock_keys) || !is_def(com.s10.g_hierarchy)) {
            setTimeout(function() {
                update_s1(data_in)
            }, times.anim / 3)
            return
        }
        locker.add('update_tel_hierarchy')

        com.s10.g_hierarchy
            .selectAll('circle')
            .each(function(d) {
                if (d.data.id === health_tag) {
                    d.data.val = data_in[health_tag]
                }
                else if (is_def(data_in.data[d.data.id])) {
                    d.data.val = data_in.data[d.data.id]
                }
            })
            .transition('s1_update_data')
            .duration(times.anim)
            .style('stroke', function(d) {
                return inst_health_col(d.data.val)
            })
            .style('fill', function(d) {
                return inst_health_col(d.data.val)
            })

        locker.remove('update_tel_hierarchy')
    }
    this.update_s1 = update_s1

    function get_widget_state() {
        return {
            zoom_target_prop: zoom_target_prop,
        }
    }
    this.get_widget_state = get_widget_state

    return
}
