// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global inst_health_col */
/* global tel_info */
/* global vor_ploy_func */
/* global cols_blues */
/* global cols_purples */
/* global min_max_obj */
/* global move_node_up */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerChes = function(opt_in_top) {
    let this_top = this
    let locker = opt_in_top.locker
    let is_south = opt_in_top.is_south
    // let run_loop = opt_in_top.run_loop
    // let widget_id = opt_in_top.widget_id
    // let my_unique_id = unique()

    let ele_base = opt_in_top.ele_base

    ele_base.set_ele(this_top, 'ches')

    let lock_init_key = ele_base.lock_init_keys.ches

    let base_h = 500
    let add_ches_outline = false
    let show_vor = false

    let ches_gs = ele_base.svgs.ches

    ches_gs.g = ele_base.svgs.g_svg.append('g')
    ches_gs.ches_g = ches_gs.g.append('g')
    ches_gs.ches_g_base = ches_gs.ches_g.append('g')

    // ------------------------------------------------------------------
    // scale to 100x100 px (executed after create_ches_map())
    // ------------------------------------------------------------------
    function g_trans() {
        let trans_ches = [ -1 * com.ches_xy.x.min, -1 * com.ches_xy.y.min ]
        ches_gs.g_outer.attr('transform',
            'translate(' + trans_ches[0] + ', ' + trans_ches[1] + ')'
        )
    
        let scaleChes = 100 / (com.ches_xy.x.max - com.ches_xy.x.min)
        ches_gs.ches_g_base.attr('transform',
            'scale(' + scaleChes + ')'
        )

        return
    }

    // ------------------------------------------------------------------
    // to avoid bugs, this is the g which should be used
    // for translations and sacling of this element
    // ------------------------------------------------------------------
    this_top.set_transform = function(trans) {
        if (is_def(trans)) {
            ches_gs.ches_g.attr('transform', trans)
        }
        return ches_gs.ches_g
    }


    let com = {
    }
    com.ches_xy = {
        x: {
        },
        y: {
        },
    }

    let prop0 = 'health'
    let tel_data = null
    let tel_id_types = null

    // ------------------------------------------------------------------
    //  Chess function
    // ------------------------------------------------------------------
    function create_ches_map(opt_in) {
        ches_gs.g_outer = ches_gs.ches_g_base.append('g')

        // ------------------------------------------------------------------
        // add one rectangle as background
        // ------------------------------------------------------------------
        let g_ches_rec = ches_gs.g_outer.append('g')

        com.ches_g = {
        }
        com.ches_g.g = ches_gs.g_outer.append('g')
        com.ches_g.xyr = {
        }

        let n_ele_in_row = (
            is_south ? [ 18, 18, 18, 18, 18 ] : [ 8, 8, 8 ]
        )
        let ele_r = (
            is_south ? base_h / 16 : base_h / 6
        )
        let ele_space = (
            is_south ? [ 3.9, 2.5 ] : [ 3.1, 1.5 ]
        )
        let ele_shift = (
            is_south ? [ 2, 2 ] : [ 2, 3 ]
        )

        let vor_data = []
        let n_ele_row = 0
        $.each(tel_id_types, function(index, id_now) {
            let n_ele_now_row = n_ele_row
            let n_ele_now_col = 0

            $.each(Array(n_ele_in_row.length), function(i, _) {
                if (n_ele_now_row >= n_ele_in_row[i]) {
                    n_ele_now_row -= n_ele_in_row[i]
                    n_ele_now_col++
                }
            })
            n_ele_row++

            let x = (
                ele_r / ele_shift[0]
                + ele_r
                + ((is_south ? 0.3 : 0.15 * 6) + n_ele_now_row)
                * (ele_space[0] * ele_r)
            )
            let y = (
                ele_r / ele_shift[1]
                + ele_r
                + n_ele_now_col * (ele_space[1] * ele_r)
            )

            com.ches_g.xyr[id_now] = {
                id: id_now,
                rc: [ n_ele_now_row, n_ele_now_col ],
                x: x,
                y: y,
                r: ele_r * 1.5,
            }
            vor_data.push({
                id: id_now,
                x: x,
                y: y,
            })
        })

        let xyr_flat = Object.values(com.ches_g.xyr)
        com.ches_xy.x.min = min_max_obj({
            min_max: 'min',
            data: xyr_flat,
            func: (x => x.x - 1. * x.r),
        })
        com.ches_xy.x.max = min_max_obj({
            min_max: 'max',
            data: xyr_flat,
            func: (x => x.x + 1. * x.r),
        })
        com.ches_xy.y.min = min_max_obj({
            min_max: 'min',
            data: xyr_flat,
            func: (x => x.y - 1. * x.r),
        })
        com.ches_xy.y.max = min_max_obj({
            min_max: 'max',
            data: xyr_flat,
            func: (x => x.y + 1. * x.r),
        })

        g_ches_rec
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', (com.ches_xy.x.max - com.ches_xy.x.min))
            .attr('height', (com.ches_xy.y.max - com.ches_xy.y.min))
            .attr('stroke-width', '0')
            .attr('transform',
                'translate(' + com.ches_xy.x.min + ', ' + com.ches_xy.y.min + ')'
            )
            .attr('fill', '#383b42')
            // .attr("fill", "#d698bc")// .attr("fill", "#F2F2F2")

        if (add_ches_outline) {
            g_ches_rec
                .selectAll('rect')
                .attr('stroke', '#F2F2F2')
                .attr('stroke-width', 1)
                .style('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
        }

        let vor_func = d3
            .voronoi()
            .x(function(d) {
                return d.x
            })
            .y(function(d) {
                return d.y
            })
            .extent([
                [ com.ches_xy.x.min, com.ches_xy.y.min ],
                [ com.ches_xy.x.max, com.ches_xy.y.max ],
            ])

        com.ches_g.vor = vor_func.polygons(vor_data)

        return
    }
  
  
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_chess_map(data_in, shift_y) {
        let tag_circ = prop0
        let tag_lbl = 'lbl_00_title'
        let tag_state = 'state_00'
        // let tag_txt = tag_state + tag_lbl

        let font_scale = is_south ? 2.7 : 4
        let title_size = (is_south ? 16 : 17) * font_scale

        let circ_strk = 0
        let text_strk = is_south ? 0.3 : 0.8
        let fill_opac = 1

        //
        let circ = com.ches_g.g
            .selectAll('circle.' + tag_circ)
            .data(data_in, function(d) {
                return d.id
            })
    
        circ
            .enter()
            .append('circle')
            .attr('class', tag_circ)
            .attr('stroke-width', circ_strk)
            .style('stroke-opacity', 1)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('transform', function(d) {
                return (
                    ('translate(' + com.ches_g.xyr[d.id].x + ',')
                    + (com.ches_g.xyr[d.id].y + ')')
                )
            })
            .style('fill-opacity', fill_opac)
            .attr('r', function(d) {
                return com.ches_g.xyr[d.id].r
            })
            .style('opacity', 1)
            .style('fill', '#383b42')
            .merge(circ)
            .transition('in_out')
            .duration(times.anim)
            // .style("fill", function(d) { return inst_health_col(d[tag_circ],0.5); } )
            .style('stroke', function(d) {
                return inst_health_col(d[tag_circ], 0.5)
            })

        circ
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .attr('r', 0)
            .remove()

        function txt_col_rc(d) {
            let index = (
                com.ches_g.xyr[d.id].rc[0]
                + com.ches_g.xyr[d.id].rc[1]
            )
            return (
                index % 2 === 0
                    ? d3.rgb(cols_purples[4]).brighter(0.5)
                    : d3.rgb(cols_blues[3]).brighter(0.1)
            )
        }
        function txt_col_rcb(d) {
            return d3.rgb(txt_col_rc(d)).brighter(0.2)
        }

        // attach new data (select by id, and so will override
        // existing data if has the same id)
        let text = com.ches_g.g.selectAll('text.' + tag_lbl)
            .data(data_in, function(d) {
                return d.id
            })

        // operate on new elements only
        text
            .enter()
            .append('text')
            .text(function(d) {
                return tel_info.get_title(d.id)
            })
            // .attr("id",      function(d) { return my_unique_id+d.id+tag_txt; })
            .attr('class', tag_state + ' ' + tag_lbl)
            .style('font-weight', 'normal')
            .attr('stroke-width', text_strk)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .each(function(d) {
                d.font_scale = String(font_scale)
                d.shift_y = shift_y
            })
            // .style("stroke",    function(d) { return "#F2F2F2";  return "#383b42"; })
            // .style("stroke",   function(d) { return inst_health_col(d[tag_circ]); } )
            .style('stroke', txt_col_rcb)
            .style('fill', txt_col_rc)
            .style('font-size', title_size + 'px')
            .attr('transform', function(d) {
                return (
                    ('translate(' + com.ches_g.xyr[d.id].x + ',')
                    + (com.ches_g.xyr[d.id].y + ')')
                )
            })
            .attr('dy', title_size / 3 + 'px')
            .attr('text-anchor', 'middle')
            .style('font-size', title_size + 'px')
            .transition('in_out')
            .duration(times.anim)
            .delay(100)
            .style('opacity', '1')

        text
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', 0)
            .remove()

        // ------------------------------------------------------------------
        // the highlight function
        // ------------------------------------------------------------------
        let focus_tel_once = function(data_in, is_on) {
            let scale_r = is_south ? 2.0 : 1.1

            let is_ele_on
            let data_in_id = (is_def(data_in.data) ? data_in.data.id : '')
            if (is_on) {
                is_ele_on = function(d) {
                    return d.id === data_in_id
                }
            }
            else {
                is_ele_on = function() {
                    return false
                }
            }

            //
            let circ = com.ches_g.g.selectAll('circle.' + tag_circ)
            let text = com.ches_g.g.selectAll('text.' + tag_lbl)

            circ.each(function(d) {
                if (is_ele_on(d)) {
                    move_node_up(this, 2)
                }
            })
            text.each(function(d) {
                if (is_ele_on(d)) {
                    move_node_up(this, 2)
                }
            })

            //
            circ
                .transition('update')
                .duration(times.anim * (is_on ? 0.5 : 0.1))
                // .style("opacity", function(d) { return is_ele_on(d) ? 1 : (is_on?0.5:1);  })
                .style('fill-opacity', function(d) {
                    return is_ele_on(d) ? 1 : 0
                })
                .attr('r', function(d) {
                    return com.ches_g.xyr[d.id].r * (is_ele_on(d) ? scale_r : 1)
                })
                .attr('stroke-width', function(d) {
                    return is_ele_on(d) ? circ_strk + 1.5 : 0
                })

            //
            text
                .transition('update')
                .duration(times.anim * (is_on ? 1 : 0.1))
                .style('font-size', function(d) {
                    return (
                        (is_ele_on(d) ? title_size * scale_r : title_size) + 'px'
                    )
                })
                .attr('dy', function(d) {
                    return (
                        (is_ele_on(d) ? title_size * scale_r : title_size) / 3 + 'px'
                    )
                })
                .attr('stroke-width', function(d) {
                    return (
                        is_ele_on(d) ? text_strk + 0.7 : text_strk
                    )
                })
                .style('font-weight', function(d) {
                    return (
                        is_ele_on(d) ? 'bold' : 'normal'
                    )
                })
        }

        function focus_tel(data_in, is_on) {
            locker.add('svg_quick_focus_tel')

            let delay = 250
            setTimeout(function() {
                if (locker.n_active('svg_quick_focus_tel') === 1) {
                    focus_tel_once(data_in, is_on)
                }
                locker.remove('svg_quick_focus_tel')
            }, delay)

            return
        }


        // ------------------------------------------------------------------
        // vor cels for selection
        // ------------------------------------------------------------------
        com.ches_g.g
            .selectAll('path')
            .data(com.ches_g.vor)
            .enter()
            .append('path')
            .style('fill', 'transparent')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('opacity', '0')
            .style('stroke-width', 0)
            .style('stroke', '#383B42')
            // .style("opacity", "0.25").style("stroke-width", "0.75").style("stroke", "#E91E63")//.style("stroke", "white")
            .call(function(d) {
                d.attr('d', vor_ploy_func)
            })
            .on('click', function(d) {
                tel_data.vor_dblclick({
                    source: 'com.ches_g.g',
                    d: d,
                    is_in_out: false,
                })
            })
            // .on("dblclick",  function(d) { tel_data.vor_dblclick({ d:d, is_in_out:true }); }) // dousnt work well...
            .on('mouseover', function(d) {
                focus_tel(d, true)
            })
            .on('mouseout', function(d) {
                focus_tel(d, false)
            })

        if (show_vor) {
            com.ches_g.g
                .selectAll('path')
                .style('opacity', '0.5')
                .style('stroke-width', '1.5')
                .style('stroke', '#E91E63')
        }
    }

    // ------------------------------------------------------------------
    //  Global function
    // ------------------------------------------------------------------
    function init_data(data_in) {
        if (is_def(ches_gs.g_outer)) {
            return
        }

        tel_data = data_in.instrument_data
        tel_id_types = data_in.tel_id_types

        create_ches_map()
        g_trans()

        set_state_once()

        locker.remove(lock_init_key)
        return
    }
    this.init_data = init_data
  
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_state_once() {
        update_chess_map(tel_data.tel, false)
    }
    this.set_state_once = set_state_once

    return
}

