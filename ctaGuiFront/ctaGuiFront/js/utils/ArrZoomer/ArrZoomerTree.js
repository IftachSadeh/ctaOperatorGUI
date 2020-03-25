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
window.ArrZoomerTree = function(opt_in0) {
    let this_top = this
    let run_loop = opt_in0.run_loop
    let sgv_tag = opt_in0.sgv_tag
    let widget_id = opt_in0.widget_id
    let locker = opt_in0.locker
    let is_south = opt_in0.is_south
    let my_unique_id = unique()
    let parentUniqueId = opt_in0.my_unique_id

    let ele_base = opt_in0.ele_base

    let instruments = ele_base.instruments
    let zooms = ele_base.zooms
    let lock_init_key = ele_base.lock_init_keys.tree

    let scale_r = instruments.scale_r
    let aspect_ratio = is_def(opt_in0.aspect_ratio) ? opt_in0.aspect_ratio : 1
    let get_prop_pos_shift = ele_base.get_prop_pos_shift
    let interpolate01 = ele_base.interpolate01
    let set_zoom_state = ele_base.set_zoom_state
    let props_s1 = ele_base.props_s1

    this_top.has_init = false

    ele_base.set_ele(this_top, 'tree')
    let get_ele = ele_base.get_ele

    let lenBase = 500
    let svg_dims = {
        w: [ lenBase ],
        h: [ lenBase * aspect_ratio ],
    }
    let avgTelD = []
    $.each([ 0, 1 ], function(nState_, nState) {
        if (nState === 0) {
            avgTelD.push({
                r: svg_dims.w[0] / 4,
                x: svg_dims.w[0] / 2,
                y: svg_dims.h[0] / 2,
            })
        }
        if (nState === 1) {
            let propW = svg_dims.w[0] / instruments.all_props0.length
            let propR = Math.min(propW * 0.4, svg_dims.w[0] / 15)
            let propY = propR * 1.25

            avgTelD.push({
                r: propR,
                h: propY * 2,
            })
            $.each(instruments.all_props0, function(index, porp_now) {
                avgTelD[1][porp_now + 'x'] = propW * (0.5 + index)
                avgTelD[1][porp_now + 'y'] = svg_dims.h[0] - propY
            })
        }
    })
    // console.log('avgTelD',avgTelD)

    svg_dims.w[1] = svg_dims.w[0] // - avgTelD[1].h;
    svg_dims.h[1] = svg_dims.h[0] - avgTelD[1].h * 2


    // let svg = {}
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
        .attr('width', svg_dims.w[0])
        .attr('height', svg_dims.h[0])

    tree_gs.clipped_g = tree_gs.g_outer.append('g')
    tree_gs.clipped_g.attr('class', 'clipped_g')
        .attr('clip-path', 'url(#' + unique_clip_id + ')')

    tree_gs.g_base = tree_gs.clipped_g.append('g')
    tree_gs.gS0 = tree_gs.g_base.append('g')
    tree_gs.gS1 = tree_gs.g_base.append('g')

    // ------------------------------------------------------------------
    // scale to 100x100 px
    // ------------------------------------------------------------------
    tree_gs.g_outer.attr('transform', function(d) {
        return 'translate(0,0)scale(' + (100 / svg_dims.w[0]) + ')'
    })

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
    let zoomToPos = function(opt_in) {
        if (!locker.is_free('in_init')) {
            setTimeout(function() {
                zoomToPos(opt_in)
            }, times.wait_loop)
        }
    }
    this.zoomToPos = zoomToPos

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
        tree_gs.gS0
        // .append('g')
        // .selectAll('rect')
        // .data([0])
        // .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', svg_dims.w[0])
            .attr('height', svg_dims.h[0])
            .attr('stroke-width', '0')
            .attr('fill', '#F2F2F2')
        // .attr("fill", "red")
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

        // the background grid
        bck_pattern({
            com: com,
            g_now: tree_gs.gS0,
            g_tag: 'gS0',
            len_wh: [ svg_dims.w[0], svg_dims.h[0] ],
            opac: 0.05,
            texture_orient: '2/8',
        })

        let s1Trans =
      'translate(' +
      0.05 * svg_dims.w[1] +
      ',' +
      0.2 * svg_dims.h[1] +
      ')scale(' +
      0.9 +
      ')'
        tree_gs.gS1.attr('transform', s1Trans)

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

                if (is_def(opt_in.incIdV)) {
                    if (opt_in.incIdV.indexOf(id) === -1) {
                        return null
                    }
                }
                if (is_def(opt_in.excIdV)) {
                    if (opt_in.excIdV.indexOf(id) >= 0) {
                        return null
                    }
                }

                let tag_now = opt_in.tag_now
                let ang_str_0 = opt_in.ang_str_0
                    ? arc_func[tag_now][opt_in.ang_str_0](d)
                    : opt_in.arc_prev[tag_now].ang[id][0]
                let ang_str_1 = opt_in.ang_str_1
                    ? arc_func[tag_now][opt_in.ang_str_1](d)
                    : opt_in.arc_prev[tag_now].ang[id][0]
                let ang_end_0 = opt_in.ang_end_0
                    ? arc_func[tag_now][opt_in.ang_end_0](d)
                    : opt_in.arc_prev[tag_now].ang[id][1]
                let ang_end_1 = opt_in.ang_end_1
                    ? arc_func[tag_now][opt_in.ang_end_1](d)
                    : opt_in.arc_prev[tag_now].ang[id][1]
                let r_in_0 = opt_in.r_in_0
                    ? arc_func[tag_now][opt_in.r_in_0](d)
                    : opt_in.arc_prev[tag_now].rad[id][0]
                let r_in_1 = opt_in.r_in_1
                    ? arc_func[tag_now][opt_in.r_in_1](d)
                    : opt_in.arc_prev[tag_now].rad[id][0]
                let r_out_0 = opt_in.r_out_0
                    ? arc_func[tag_now][opt_in.r_out_0](d)
                    : opt_in.arc_prev[tag_now].rad[id][1]
                let r_out_1 = opt_in.r_out_1
                    ? arc_func[tag_now][opt_in.r_out_1](d)
                    : opt_in.arc_prev[tag_now].rad[id][1]
                // console.log(tag_now,[ang_str_0,ang_str_1],[ang_end_0,ang_end_1],[r_in_0,r_in_1],[r_out_0,r_out_1])

                let needUpd = 0
                if (Math.abs(ang_str_0 - ang_str_1) / ang_str_0 > 1e-5) {
                    needUpd++
                }
                if (Math.abs(ang_end_0 - ang_end_1) / ang_end_0 > 1e-5) {
                    needUpd++
                }
                if (Math.abs(r_in_0 - r_in_1) / r_in_0 > 1e-5) {
                    needUpd++
                }
                if (Math.abs(r_out_0 - r_out_1) / r_out_0 > 1e-5) {
                    needUpd++
                }
                if (needUpd === 0) {
                    return null
                }

                let arc = d3.arc()
                return function(t) {
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
        com.s01 = {
        }
        com.s01.g = tree_gs.gS0.append('g')
        com.s01.gText = tree_gs.gS0.append('g')

        // state-1 initialization (needed before updateLiveDataS1())
        com.s10 = {
        }
        com.s10.g = tree_gs.gS1.append('g')

        locker.remove(lock_init_key)
        return
    }
    this.init_data = init_data

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_state_once() {
    // console.log('set_stateTree ----',get_scale(),opt_in)
        let scale = get_ele('main').get_scale()

        if (scale < zooms.len['1.0']) {
            tel_hierarchy({
                tel_Id: '',
                click_in: false,
                remove: true,
            })
        }

        if (scale <= zooms.len['0.1']) {
            let props_in = {
                tel_Id: 'avg',
                propD: instruments.props[''],
                propDv: instruments.props0[''],
                propTtlD: instruments.prop_titles[''],
            }

            telArcs([ instruments.data.avg ], props_in, 0)
            setSubProp({
                tel_Id: 'avg',
                prop_in: '',
            })
        }
        else {
            let targetIndex = instruments.data.id_indices[zooms.target]
            let props_in = {
                tel_Id: zooms.target,
                propD: instruments.props[zooms.target],
                propDv: instruments.props0[zooms.target],
                propTtlD: instruments.prop_titles[''],
            }

            if (scale < zooms.len['1.0']) {
                telArcs([ instruments.data.tel[targetIndex] ], props_in, 0)
                setSubProp({
                    tel_Id: zooms.target,
                    prop_in: '',
                })
            }
            else {
                telArcs([ instruments.data.tel[targetIndex] ], props_in, 1)
            }
        }
    }
    this.set_state_once = set_state_once

    // ------------------------------------------------------------------
    // innner arcs for the different properties
    // ------------------------------------------------------------------
    function telArcs(data_in, props_in, state) {
        let tag_state = 'state01'
        let tel_id_in = props_in.tel_Id
        let propDin = props_in.propD
        let propDinV = props_in.propDv
        let propTtlIn = props_in.propTtlD

        function getPropIndex(id, porpIn) {
            return instruments.props[id].indexOf(porpIn)
        }

        if (!is_def(com.s01.inner)) {
            com.s01.inner = true

            $.each(instruments.all_props, function(_, porp_now) {
                $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
                    let tag_now = porp_now + n_arc_draw_now
                    let is0 = n_arc_draw_now === 0
                    // console.log('--0--',tag_now)

                    arc_func[tag_now] = {
                    }
                    arc_func[tag_now].rad00 = function(d) {
                        return avgTelD[d.state].r * (is0 ? 0.1 : 0.1)
                    }
                    arc_func[tag_now].rad01 = function(d) {
                        return avgTelD[d.state].r * (is0 ? 0.95 : 0.99)
                    }
                    arc_func[tag_now].ang00 = function(d) {
                        if (d[porp_now] === undefined) {
                            return 0
                        }
                        return getPropIndex(d.id, porp_now) * instruments.tau_fracs[d.id] + instruments.tau_space
                    }
                    arc_func[tag_now].ang01 = function(d) {
                        if (d[porp_now] === undefined) {
                            return 0
                        }
                        return (
                            getPropIndex(d.id, porp_now) * instruments.tau_fracs[d.id] +
              instruments.tau_space +
              (instruments.tau_fracs[d.id] - instruments.tau_space * 2) *
                (is0 ? 1 : inst_health_frac(d[porp_now]))
                        )
                    }
                    arc_func[tag_now].ang10 = function(d) {
                        if (d[porp_now] === undefined) {
                            return 0
                        }
                        return 0.1
                    }
                    arc_func[tag_now].ang11 = function(d) {
                        if (d[porp_now] === undefined) {
                            return 0
                        }
                        return is0 ? tau : tau * inst_health_frac(d[porp_now])
                    }
                })
            })
        }

        // ------------------------------------------------------------------
        // innner arcs for the different properties
        // ------------------------------------------------------------------
        let pos = {
        }
        let angState = {
        }
        let radState = {
        }

        $.each(instruments.all_props0, function(_, porp_now) {
            if (state === 0) {
                pos[porp_now] = {
                    x: avgTelD[state].x,
                    y: avgTelD[state].y,
                }
                angState = {
                    ang_str_1: 'ang00',
                    ang_end_1: 'ang01',
                }
                radState = {
                    r_in_1: 'rad00',
                    r_out_1: 'rad01',
                }
            }
            else {
                pos[porp_now] = {
                    x: avgTelD[state][porp_now + 'x'],
                    y: avgTelD[state][porp_now + 'y'],
                }
                angState = {
                    ang_str_1: 'ang10',
                    ang_end_1: 'ang11',
                }
                radState = {
                    r_in_1: 'rad10',
                    r_out_1: 'rad11',
                }
            }
        })

        $.each(instruments.all_props, function(_, porp_now) {
            $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
                let tag_now = porp_now + n_arc_draw_now

                let is0 = n_arc_draw_now === 0

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
                    if (data_in[0][porp_now] === undefined) {
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
                // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
                    .style('opacity', function(d) {
                        return is0 ? '0.5' : '1'
                    })
                    .attr('transform', function(d) {
                        return 'translate(' + pos[porp_now].x + ',' + pos[porp_now].y + ')'
                    })
                    .style('stroke', function(d) {
                        return is0 ? null : inst_health_col(d[porp_now])
                    })
                    .style('fill', function(d) {
                        return inst_health_col(d[porp_now])
                    })
                    .each(function(d, i) {
                        d.state = state
                        arc_prev[tag_now].ang[i] = [
                            arc_func[tag_now].ang00(d),
                            arc_func[tag_now].ang00(d),
                        ]
                        arc_prev[tag_now].rad[i] = [
                            arc_func[tag_now].rad00(d),
                            arc_func[tag_now].rad01(d),
                        ]
                    })
                    .merge(path)
                    .each(function(d, i) {
                        d.state = state
                    })
                    .transition('update')
                    .duration(times.anim_arc * 2)
                    .attr('transform', function(d, i) {
                        return 'translate(' + pos[porp_now].x + ',' + pos[porp_now].y + ')'
                    })
                    .style('stroke', function(d) {
                        return is0 ? null : inst_health_col(d[porp_now])
                    })
                    .style('fill', function(d) {
                        return inst_health_col(d[porp_now])
                    })
                // .each(function (d, i) {
                //   // console.log('MNM', i, tag_now, '!!!',arc_prev[tag_now].ang[0], '!!!', d)
                // })
                // .each(function (d, i) {
                //   d.tau_frac_now = tau_fracIn
                // })
                    .call(com.arc_tween, {
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
                        index_id: false,
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

        // ------------------------------------------------------------------
        // outer rings for the instruments.prop0 (equivalent of s00_D metric in s01_D)
        // ------------------------------------------------------------------
        let porp_all = instruments.prop0

        if (!is_def(com.s01.outer)) {
            com.s01.outer = true

            $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
                let tag_now = porp_all + n_arc_draw_now
                let is0 = n_arc_draw_now === 0

                arc_func[tag_now] = {
                }
                arc_func[tag_now].rad00 = function(d) {
                    return avgTelD[d.state].r * scale_r[0].health0 * (is0 ? 1 : 0.95)
                }
                arc_func[tag_now].rad01 = function(d) {
                    return avgTelD[d.state].r * scale_r[0].health1 * (is0 ? 1 : 1.05)
                }
                arc_func[tag_now].rad10 = function(d) {
                    return avgTelD[d.state].r * scale_r[1].health0 * (is0 ? 0.475 : 0.4)
                }
                arc_func[tag_now].rad11 = function(d) {
                    return avgTelD[d.state].r * scale_r[1].health1 * (is0 ? 0.525 : 0.6)
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
        //
        // ------------------------------------------------------------------
        $.each([ 0, 1 ], function(n_arc_draw_now, n_arc_draw_now_) {
            let tag_now = porp_all + n_arc_draw_now
            let is0 = n_arc_draw_now === 0

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
            // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
                .style('opacity', function(d) {
                    return is0 ? '0.5' : '1'
                })
                .attr('transform', function(d) {
                    return 'translate(' + pos[porp_all].x + ',' + pos[porp_all].y + ')'
                })
                .style('stroke', function(d) {
                    return is0 ? null : inst_health_col(d[porp_all])
                })
                .style('fill', function(d) {
                    return inst_health_col(d[porp_all])
                })
                .each(function(d, i) {
                    d.state = state
                    arc_prev[tag_now].ang[i] = [
                        arc_func[tag_now].ang00(d),
                        arc_func[tag_now].ang00(d),
                    ]
                    arc_prev[tag_now].rad[i] = [
                        arc_func[tag_now].rad00(d),
                        arc_func[tag_now].rad01(d),
                    ]
                })
                .merge(path)
                .each(function(d, i) {
                    d.state = state
                })
                .transition('update')
                .duration(times.anim_arc * 2) // .delay(times.anim_arc)
                .attr('transform', function(d) {
                    return 'translate(' + pos[porp_all].x + ',' + pos[porp_all].y + ')'
                })
                .style('stroke', function(d) {
                    return is0 ? null : inst_health_col(d[porp_all])
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
                    ang_end_1: 'ang01',
                    r_in_0: null,
                    r_in_1: radState.r_in_1,
                    r_out_0: null,
                    r_out_1: radState.r_out_1,
                })

            // operate on exiting elements only
            path
                .exit()
                .transition('out')
                .duration(times.anim_arc)
                .call(com.arc_tween, {
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
                    r_out_1: 'rad01',
                })
                .remove()
        })

        // ------------------------------------------------------------------
        // invisible rectangle for selecting a property
        // ------------------------------------------------------------------
        let tagTitle = tag_state + '_title'
        let tagRect = tag_state + 'rect'

        let textD = []
        let recD = []

        let all_props_now = state ? instruments.all_props0 : propDinV

        $.each(all_props_now, function(_, porp_now) {
            let prop_index = getPropIndex(tel_id_in, porp_now)
            let txtR = avgTelD[state].r * scale_r[state].health1 * 1.2
            let xy = get_prop_pos_shift('xy', txtR, prop_index, propDin.length)
            let opac = state === 0 ? 0.7 : 0.9
            if (state === 1 && propDin.indexOf(porp_now) === -1) {
                opac *= 0.5
            }

            if (instruments.all_props.indexOf(porp_now) >= 0) {
                textD.push({
                    id: tagTitle + porp_now,
                    text: propTtlIn[porp_now],
                    prop: porp_now,
                    h: state === 0 ? 30 : 16,
                    xy: state === 0 ? xy : [ 0, 0 ],
                    x: state === 0 ? avgTelD[state].x - xy[0] : pos[porp_now].x,
                    y: state === 0 ? avgTelD[state].y - xy[1] : pos[porp_now].y,
                    strkW: state === 1 ? 0.5 : 0.2,
                    fWgt: state === 0 ? 'bold' : 'normal',
                    opac: opac,
                    anch:
            state === 1 || Math.abs(xy[0] / avgTelD[state].r) < 0.001
                ? 'middle'
                : xy[0] < 0 ? 'start' : 'end',
                })
            }

            let recH = avgTelD[1].h
            let recW = Math.abs(
                avgTelD[1][instruments.all_props[0] + 'x'] -
        avgTelD[1][instruments.all_props[1] + 'x']
            )
            let recX = avgTelD[1][porp_now + 'x'] - recH / 2 - (recW - recH) / 2
            let recY = svg_dims.h[0] - recH

            recD.push({
                id: tagRect + porp_now,
                prop: porp_now,
                h: avgTelD[1].h,
                w: recW,
                x: recX,
                y: recY,
            })
        })

        let eleH = null

        let title = com.s01.gText
            .selectAll('text.' + tagTitle)
            .data(textD, function(d) {
                return d.id
            })

        title
            .enter()
            .append('text')
        // .attr("id", function(d) { return my_unique_id+d.id; })
            .text(function(d) {
                return d.text
            })
            .attr('class', tag_state + ' ' + tagTitle) // class list for easy selection
            .style('opacity', '0')
            .style('fill-opacity', 0.7)
            .style('fill', '#383b42')
        // .attr("stroke-width", function(d) { return d.strkW; })
            .style('stroke', function(d) {
                return '#383b42'
            })
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
            .duration(times.anim_arc * 2)
            .style('stroke-width', function(d) {
                return d.strkW
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
                if (!is_def(eleH)) {
                    eleH = get_node_height_by_id({
                        selction: com.s01.gText.selectAll('text.' + tagTitle),
                        id: d.id,
                        txt_scale: true,
                    })
                }
                return eleH + 'px'
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

        // ------------------------------------------------------------------
        // invisible rectangle for the selecting a property
        // ------------------------------------------------------------------
        let recDnow = state === 1 ? recD : []
        let rect = com.s01.gText
            .selectAll('rect.' + tagRect)
            .data(recDnow, function(d) {
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
            .attr('height', function(d) {
                return d.h
            })
            .attr('width', function(d) {
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
        function recClick(d, i) {
            if (
                !locker.are_free([ 's10_bck_arc_change', 'data_change', 's10_click_hierarchy' ])
            ) {
                return
            }

            let click_in = d.prop !== instruments.prop0
            let prop_in = click_in ? d.prop : ''
            if (propDin.indexOf(d.prop) === -1) {
                click_in = true
                prop_in = ''
            }

            // props_s1({ tel_Id:zooms.target, click_in:click_in, prop_in:prop_in, debug:"telArcs" }); // before 29/9

            // console.log('FIXME - tree-1 - uncomment zoom_to_target_main')
            get_ele('main').zoom_to_target_main({
                target: zooms.target,
                scale: zooms.len['1.2'],
                duration_scale: 1,
            })

            props_s1({
                tel_Id: zooms.target,
                click_in: click_in,
                prop_in: prop_in,
                do_func: [ 'bck_arc_click' ],
                debug: 'telArcs',
            })

            // // initialize the zoom
            // this_top.zoomToPos({ target:null, scale:1, duration_scale:1 });
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let prev_tel_hierarchy_prop = ''
    function tel_hierarchy(opt_in) {
        function mayUpdate() {
            return locker.is_free([
                'update_tel_hierarchyTree',
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
        if (!mayUpdate()) {
            setTimeout(function() {
                tel_hierarchy(opt_in)
            }, times.anim_arc / 3)
            return
        }
        // if(!is_def(opt_in)) return;
        // console.log('tel_hierarchy',opt_in);

        let tag_state = 'state10'
        let tagNodes = tag_state + 'circ'
        let tagText = tag_state + '_text'
        let tag_vor = tag_state + '_vor'
        let tagLinks = tag_state + '_path'

        let nodeR = 15
        let diffW = svg_dims.w[1] * 0.1
        let treeW = svg_dims.w[1] - diffW
        let treeH = svg_dims.h[1]

        function get_ele_id(d) {
            return d.data.id
        }

        let tel_Id = ''
        let click_in = false
        let prop_in = ''
        let remove = false
        if (is_def(opt_in)) {
            if (is_def(opt_in.tel_Id)) {
                tel_Id = opt_in.tel_Id
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

        if (zooms.target !== tel_Id || !is_def(instruments.data.prop_data_s1[tel_Id])) {
            click_in = false
            remove = true
        }
        else if (prop_in === '') {
            click_in = false
        }

        // ------------------------------------------------------------------
        // update the title
        // ------------------------------------------------------------------
        setSubProp({
            tel_Id: tel_Id,
            prop_in: click_in ? prop_in : '',
        })

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (!remove && prop_in !== '') {
            if (!is_def(instruments.data.prop_data_s1[tel_Id][prop_in])) {
                return
            }
        }

        locker.add({
            id: 'update_tel_hierarchyTree',
            override: true,
        })

        // ------------------------------------------------------------------
        // define the containing g with small margins on the sides
        // ------------------------------------------------------------------
        if (!is_def(com.s10.g_hierarchy)) {
            com.s10.g_hierarchy = com.s10.g.append('g')
            com.s10.g_hierarchy.attr('transform', function(d) {
                return 'translate(' + diffW / 2 + ',' + 0 + ')'
            })
            // com.s10.g_hierarchy.append("rect").style('opacity',0.3).style("fill",'transparent').attr("height", treeH).attr("width", treeW).style("stroke","red")
        }

        let hasDataBase = (
            !click_in &&
      !remove &&
      is_def(instruments.data.data_base_s1[tel_Id])
        )

        // ------------------------------------------------------------------
        // the tree hierarchy
        // ------------------------------------------------------------------
        let desc = []
        let dataPath = []
        let max_depth = 0
        if (click_in || hasDataBase) {
            // initialize the zoom upon any change of the hirch
            this_top.zoomToPos({
                target: null,
                scale: zooms.len['0.0'],
                duration_scale: 1,
            })

            let data_hierarchy = click_in
                ? instruments.data.prop_data_s1[tel_Id][prop_in]
                : instruments.data.data_base_s1[tel_Id]
            let hirch = d3.hierarchy(data_hierarchy)

            // if(!click_in) console.log('----===--',instruments.data.data_base_s1[tel_Id])
            // console.log('--==--',tel_Id,prop_in,is_def(instruments.data.prop_data_s1[tel_Id][prop_in]),click_in,data_hierarchy)

            let tree = d3.tree().size([ treeH, treeW ])
            tree(hirch)

            desc = hirch.descendants()
            dataPath = desc.slice(1)

            $.each(desc, function(index, data_now) {
                max_depth = Math.max(max_depth, data_now.depth)
            })

            let xV = []
            $.each(desc, function(index, data_now) {
                if (max_depth === data_now.depth) {
                    xV.push(Number(data_now.x))
                }
            })

            let min_diff = -1
            if (xV.length > 1) {
                xV.sort(d3.ascending)

                min_diff = xV[1] - xV[0]
                $.each(xV, function(index, xNow) {
                    if (index > 0) {
                        let diff_now = xV[index] - xV[index - 1]
                        if (diff_now < min_diff) {
                            min_diff = diff_now
                        }
                    }
                })

                nodeR = Math.min(min_diff / 2.3, nodeR)
            }
            else {
                nodeR = 5
            }
            // console.log('---',xV,min_diff,nodeR)

            prev_tel_hierarchy_prop = prop_in
        }
        else {
            prev_tel_hierarchy_prop = ''
        }

        function font_size(d) {
            return Math.max(10, Math.min(d.nodeR * 2, 15))
        }

        // ------------------------------------------------------------------
        // circles
        // ------------------------------------------------------------------
        let circs = com.s10.g_hierarchy
            .selectAll('circle.' + tagNodes)
            .data(desc, get_ele_id) // d.data.id

        circs
            .enter()
            .append('circle')
            .attr('class', tagNodes)
        // .attr("id", function(d) { return my_unique_id+tagNodes+d.data.id; })
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
                d.nodeR = nodeR
            })
            .transition('update')
            .duration(times.anim_arc)
            .attr('transform', function(d) {
                return 'translate(' + d.y + ',' + d.x + ')'
            })
            .attr('r', function(d) {
                return d.nodeR
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
            .duration(times.anim_arc / 2)
            .attr('r', 0)
            .remove()

        // ------------------------------------------------------------------
        // labels
        // ------------------------------------------------------------------
        let text = com.s10.g_hierarchy
            .selectAll('text.' + tagText)
            .data(desc, get_ele_id)

        text
            .enter()
            .append('text')
            .attr('class', tagText)
            .text(getTxt)
            .attr('transform', txtTrans)
            .style('font-size', function(d) {
                return font_size(d) + 'px'
            })
            .style('text-anchor', txtAnch)
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

        function txtTrans(d, i) {
            let d0 = d.nodeR + Math.min(10, d.nodeR)
            let d1 = get_node_height_by_id({
                selction: com.s10.g_hierarchy.selectAll('text.' + tagText),
                id: get_ele_id(d),
                get_id: get_ele_id,
                txt_scale: true,
            })

            return 'translate(' + (d.y - d0) + ',' + (d.x + d1) + ')'
        }
        function txtAnch(d) {
            return 'end'
            // if     (!d.parent)           return "start";
            // else if(max_depth == d.depth) return "end";
            // else                         return "middle";
        }
        function getTxt(d) {
            return !d.parent || d.data.id === prop_in ? '' : d.data.title
        }

        // ------------------------------------------------------------------
        // links
        // ------------------------------------------------------------------
        let path = com.s10.g_hierarchy
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

        function linkFunc(d) {
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
        let vor_func = d3
            .voronoi()
            .x(function(d) {
                return d.y
            })
            .y(function(d) {
                return d.x
            })
            .extent([ [ 0, 0 ], [ treeW, treeH ] ])

        let vor = com.s10.g_hierarchy
            .selectAll('path.' + tag_vor)
            .data(vor_func.polygons(desc))

        vor
            .enter()
            .append('path')
            .attr('class', tag_vor)
            .style('fill', 'transparent')
            .style('opacity', '0')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('stroke-width', 0)
            .style('opacity', 0)
        // .style("stroke-width", "1").style("opacity", "1")
            .style('stroke', '#383B42')
            .on('mouseover', function(d) {
                focus_ele(d, true)
            })
            .on('mouseout', function(d) {
                focus_ele(d, false)
            })
            .on('click', vorClick)
            .merge(vor)
            .call(function(d) {
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
        function vorClick(d) {
            setSubProp({
                tel_Id: tel_Id,
                prop_in: d.data.data.id,
            })

            let click_in = true
            let dId = d.data.data.id
            let id_now = is_def(d.data.parent) ? d.data.parent.data.id : dId

            let parent_name = instruments.data.prop_parent_s1[tel_Id][dId]
            if (parent_name === dId) {
                id_now = parent_name
            }

            // console.log('===',[parent_name,dId,prop_in,id_now],click_in);
            if (!is_def(parent_name)) {
                parent_name = ''
                click_in = false
            }
            // console.log('---',[parent_name,dId,prop_in,id_now],click_in); console.log('-------------------------------------');

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
                sync_prop: dId,
            })
        }

        // the highlight function
        // ------------------------------------------------------------------
        function focus_ele(dIn, is_on) {
            let dInId = dIn.data.data.id

            if (is_on) {
                if (!mayUpdate()) {
                    return
                }

                com.s10.g_hierarchy
                    .selectAll('circle.' + tagNodes)
                    .transition('highlight')
                    .duration(times.anim_arc / 2)
                    .attr('r', function(d) {
                        return d.data.id === dInId ? d.nodeR * 1.5 : d.nodeR
                    })
                    .style('fill-opacity', function(d) {
                        return d.data.id === dInId ? 0.6 : 1
                    })

                com.s10.g_hierarchy
                    .selectAll('text.' + tagText)
                    .transition('highlight')
                    .duration(times.anim_arc / 2)
                    .style('font-size', function(d) {
                        return (
                            (d.data.id === dInId ? font_size(d) * 2 : font_size(d)) + 'px'
                        )
                    })
                    .style('font-weight', function(d) {
                        return d.data.id === dInId ? 'bold' : 'normal'
                    })
            }
            else {
                if (!mayUpdate()) {
                    setTimeout(function() {
                        reset_r()
                    }, 20)
                    return
                }

                reset_r()
            }

            function reset_r() {
                com.s10.g_hierarchy
                    .selectAll('circle.' + tagNodes)
                    .transition('highlight')
                    .duration(times.anim_arc / 2)
                    .attr('r', function(d) {
                        return d.nodeR
                    })
                    .style('fill-opacity', 1)

                com.s10.g_hierarchy
                    .selectAll('text.' + tagText)
                    .transition('highlight')
                    .duration(times.anim_arc / 2)
                    .style('font-size', function(d) {
                        return font_size(d) + 'px'
                    })
                    .style('font-weight', 'normal')
            }
        }

        locker.remove({
            id: 'update_tel_hierarchyTree',
            delay: times.anim_arc,
        })
    }
    this.tel_hierarchy = tel_hierarchy

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setSubProp(opt_in) {
    // console.log('setSubProp',opt_in)
        zoom_target_prop = opt_in.prop_in
        let tel_Id = opt_in.tel_Id
        let prop_in = opt_in.prop_in
        let parent_name = (
            prop_in === '' ? null : instruments.data.prop_parent_s1[tel_Id][prop_in]
        )

        telPropTitle({
            tel_Id: tel_Id,
            prop_in: prop_in,
            parent_name: parent_name,
        })
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function telPropTitle(opt_in) {
        let tel_Id = opt_in.tel_Id
        let prop_in = opt_in.prop_in
        let parent_name = opt_in.parent_name

        if (prop_in !== '' && !is_def(parent_name)) {
            return
        }
        // console.log('telPropTitle',opt_in)

        // ------------------------------------------------------------------
        // title on top
        // ------------------------------------------------------------------
        let tag_state = 'state10'
        let tag_now = tag_state + '_title'

        let title_data = []
        title_data.push({
            id: tag_now + 'tel_Id',
            text: tel_Id === 'avg' ? 'Array' : tel_info.get_title(tel_Id),
            x: 20,
            y: avgTelD[1].h / 2,
            h: 30,
            strkW: 1,
        })

        if (is_def(parent_name)) {
            title_data.push({
                id: tag_now + parent_name,
                text: instruments.prop_titles[tel_Id][parent_name],
                x: 10,
                y: avgTelD[1].h / 2,
                h: 30,
                strkW: 1,
            })

            if (prop_in !== parent_name) {
                title_data.push({
                    id: tag_now + prop_in,
                    text: instruments.data.prop_title_s1[tel_Id][prop_in],
                    x: 10,
                    y: avgTelD[1].h / 2,
                    h: 25,
                    strkW: 0,
                })
            }
        }

        let title = com.s01.gText
            .selectAll('text.' + tag_now)
            .data(title_data, function(d, i) {
                return i
            })

        let eleWH = [ [], null ]
        $.each(title_data, function(i, d) {
            eleWH[0].push(null)
        })

        function textPos(d, i, isX) {
            if (isX) {
                let x = d.x
                $.each(title_data, function(index0, data_now0) {
                    if (index0 < i) {
                        if (!is_def(eleWH[0][index0]) || eleWH[0][index0] === 0) {
                            eleWH[0][index0] = get_node_width_by_id({
                                selction: com.s01.gText.selectAll('text.' + tag_now),
                                id: data_now0.id,
                            })
                        }
                        x += data_now0.x + eleWH[0][index0]
                    }
                })
                return x
            }
            else {
                if (!is_def(eleWH[1]) || eleWH[1] === 0) {
                    eleWH[1] = get_node_height_by_id({
                        selction: com.s01.gText.selectAll('text.' + tag_now),
                        id: title_data[0].id,
                        txt_scale: true,
                    })
                }
                return d.y + eleWH[1]
            }
        }

        title
            .enter()
            .append('text')
            .text(function(d) {
                return d.text
            })
            .attr('class', tag_state + ' ' + tag_now) // class list for easy selection
            .style('font-weight', function(d, i) {
                return i === 0 ? 'bold' : 'normal'
            })
            .style('opacity', 0)
            .style('fill', '#383b42')
            .style('stroke-width', function(d) {
                return d.strkW
            })
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .style('stroke', function(d) {
                return '#383b42'
            })
            .attr('font-size', function(d) {
                return d.h + 'px'
            })
            .attr('transform', function(d, i) {
                d.pos = [ svg_dims.w[0] * 1.1, textPos(d, i, false) ]
                return 'translate(' + d.pos[0] + ',' + d.pos[1] + ')'
            })
            .merge(title)
            .text(function(d) {
                return d.text
            })
            .transition('update1')
            .duration(times.anim_arc) // .delay(times.anim_arc/2)
            .attr('transform', function(d, i) {
                d.pos = [ textPos(d, i, true), textPos(d, i, false) ]
                return 'translate(' + d.pos[0] + ',' + d.pos[1] + ')'
            })
            .style('opacity', 1)

        title
            .exit()
            .transition('in_out')
            .duration(times.anim_arc)
            .attr('transform', function(d, i) {
                return 'translate(' + d.pos[0] * 2 + ',' + d.pos[1] + ')'
            })
            .style('opacity', 0)
            .remove()

        // ------------------------------------------------------------------
        // highlight rectangle for the selected property
        // ------------------------------------------------------------------
        let tagRect = tag_state + '_rectSelect'

        // let props_now = get_tel_props(Object.keys(instruments.data.prop_parent_s1[tel_Id]), tel_Id)

        let porp_now = prop_in
        if (prop_in !== '') {
            porp_now = instruments.data.prop_parent_s1[tel_Id][prop_in]
        }
        // let porp_now =
        //   propD.indexOf(prop_in) >= 0 || prop_in === ''
        //     ? prop_in
        //     : instruments.data.prop_parent_s1[tel_Id][prop_in]
        // console.log('llllll', [prop_in, porp_now], instruments.data.prop_parent_s1[tel_Id])

        // let porpX   = ((porp_now == "" || !click_in) ? instruments.prop0: porp_now) + "x";
        let porpX = (porp_now === '' ? instruments.prop0 : porp_now) + 'x'
        let recH = avgTelD[1].h
        let recW = recH * 1.5
        let recX = avgTelD[1][porpX] - recH / 2 - (recW - recH) / 2
        let recY = svg_dims.h[0] - recH

        let data_in = get_ele('main').get_scale() >= zooms.len['1.0'] ? [{
            id: porpX,
        }] : []
        let rect = com.s01.g
            .selectAll('rect.' + tagRect)
            .data(data_in, function(d, i) {
                return i
            })
        // let rect = com.s01.g.selectAll("rect."+tagRect).data( (click_in || hasDataBase) ? [{id:0}] : [] )

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
            .attr('transform', function(d) {
                return 'translate(' + -recW * 2 + ',' + recY + ')'
            })
            .merge(rect)
            .transition('enter')
            .duration(times.anim_arc)
            .attr('opacity', 0.05)
            .attr('transform', function(d) {
                return 'translate(' + recX + ',' + recY + ')'
            })

        rect
            .exit()
            .transition('out')
            .duration(times.anim_arc)
            .attr('transform', function(d) {
                return 'translate(' + svg_dims.h[0] + ',' + recY + ')'
            })
            .attr('opacity', 0)
            .remove()
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_s1(data_in) {
        if (
            !locker.are_free([
                's10_bck_arc_change',
                's10_click_hierarchy',
                'update_tel_hierarchy',
            ]) ||
      !is_def(com.s10.g_hierarchy)
        ) {
            // console.log('will delay update_s1',data_in);
            setTimeout(function() {
                update_s1(data_in)
            }, times.anim_arc / 3)
            return
        }
        locker.add('update_tel_hierarchy')

        com.s10.g_hierarchy
            .selectAll('circle')
            .each(function(d) {
                if (d.data.id === instruments.prop0) {
                    // console.log('updt',d.data.id,d.data.val,is_def(data_in[instruments.prop0]));
                    d.data.val = data_in[instruments.prop0]
                }
                else if (is_def(data_in.data[d.data.id])) {
                    // console.log('updt',d.data.id,data_in.data[d.data.id]);
                    d.data.val = data_in.data[d.data.id]
                }
            })
            .transition('s1_update_data')
            .duration(times.anim_arc)
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
