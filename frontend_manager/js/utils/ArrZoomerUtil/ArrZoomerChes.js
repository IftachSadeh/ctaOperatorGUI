// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global tel_info */
/* global inst_health_col */
/* global TEL_STATES */
/* global get_tel_state */
/* global vor_ploy_func */
/* global min_max_obj */


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

    // let get_ele = ele_base.get_ele
    let zooms = ele_base.zooms

    let lock_init_key = ele_base.lock_init_keys.ches

    // basic lenght for absolute scaling of e.g., fonts
    let base_w = 100
    let add_ches_outline = false
    let show_vor_lines = false

    let n_cols = opt_in_top.n_cols
    let aspect_ratio = opt_in_top.aspect_ratio
    let font_rect_scale = opt_in_top.font_rect_scale

    if (!is_def(n_cols)) {
        n_cols = is_south ? 18 : 8
    }
    if (!is_def(aspect_ratio)) {
        aspect_ratio = is_south ? 0.25 : 0.2
    }
    if (!is_def(font_rect_scale)) {
        font_rect_scale = is_south ? 0.7 : 0.6
    }

    let svg_dims = {
        w: base_w,
        h: base_w * aspect_ratio,
    }

    let ches_gs = ele_base.svgs.ches

    ches_gs.g = ele_base.svgs.g_svg.append('g')
    ches_gs.ches_g = ches_gs.g.append('g')
    ches_gs.ches_g_base = ches_gs.ches_g.append('g')

    // ------------------------------------------------------------------
    // scale to [ele_base.base_ele_width x (ele_base.base_ele_width*aspect_ratio) px ]
    // (executed after create_ches_map())
    // ------------------------------------------------------------------
    function g_trans() {
        let scale_more = ele_base.base_ele_width / base_w
        ches_gs.ches_g_base.attr('transform',
            'translate(0,0)scale(' + scale_more + ')'
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

    let health_tag = ele_base.health_tag
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

        let n_eles = tel_id_types.length
        let n_rows = Math.ceil(n_eles / n_cols)
        let cell_w = svg_dims.w / n_cols
        let cell_h = svg_dims.h / n_rows
        let cell_r = Math.min(cell_w, cell_h)

        com.ches_g.vor_data = []

        let n_tel = 0
        for (let n_row = 0; n_row < n_rows; ++n_row) {
            for (let n_col = 0; n_col < n_cols; ++n_col) {
                let id_now = tel_id_types[n_tel]
                if (!is_def(id_now)) {
                    break
                }
                n_tel++

                let rect_x = cell_w * n_col
                let rect_y = cell_h * n_row
                let text_x = rect_x + 0.5 * cell_w
                let text_y = rect_y + 0.5 * cell_h


                com.ches_g.xyr[id_now] = {
                    id: id_now,
                    rc: [ n_row, n_col ],
                    text_x: text_x,
                    text_y: text_y,
                    text_r: cell_r,
                    rect_x: rect_x,
                    rect_y: rect_y,
                    rect_w: cell_w,
                    rect_h: cell_h,
                }
                com.ches_g.vor_data.push({
                    id: id_now,
                    x: text_x,
                    y: text_y,
                })
            }
        }

        g_ches_rec
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', svg_dims.w)
            .attr('height', svg_dims.h)
            .attr('stroke-width', '0')
            .attr('fill', '#383b42')
            // .attr('fill', '#d698bc')// .attr("fill", "#F2F2F2")

        if (add_ches_outline) {
            g_ches_rec
                .selectAll('rect')
                .attr('stroke', '#F2F2F2')
                .attr('stroke-width', 1)
                .style('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
        }

        return
    }
  
  
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_chess_map(data_in, shift_y) {
        let tag_prop = health_tag
        // let tag_circ = health_tag + '_circ'
        let tag_rect = health_tag + '_rect'
        let tag_lbl = 'lbl_00_title'
        let tag_state = 'state_00'
        // let tag_txt = tag_state + tag_lbl

        let text_strk = is_south ? 0.3 : 0.8
        // let circ_strk = 0
        // let fill_opac = 1

        // colour functions
        function rect_col_rc(d) {
            let index = (
                com.ches_g.xyr[d.id].rc[0]
                + com.ches_g.xyr[d.id].rc[1]
            )
            return (
                index % 2 === 0
                    ? d3.rgb('#383b42').darker(0.3)
                    : d3.rgb('#383b42').brighter(0.3)
            )
        }
        function text_col_state(d) {
            if (get_tel_state(d[tag_prop]) == TEL_STATES.NOMINAL) {
                return '#F2F2F2'
            }
            else if (get_tel_state(d[tag_prop]) == TEL_STATES.WARNING) {
                return d3.rgb('#383b42').darker(1)
            }
            else {
                return '#F2F2F2'
            }
        }
        // function txt_col_rc(d) {
        //     let index = (
        //         com.ches_g.xyr[d.id].rc[0]
        //         + com.ches_g.xyr[d.id].rc[1]
        //     )
        //     return (
        //         index % 2 === 0
        //             ? d3.rgb(cols_purples[4]).brighter(0.5)
        //             : d3.rgb(cols_blues[3]).brighter(0.1)
        //     )
        // }
        // function txt_col_rcb(d) {
        //     return d3.rgb(txt_col_rc(d)).brighter(0.2)
        // }

        //
        // let circ = com.ches_g.g
        //     .selectAll('circle.' + tag_circ)
        //     .data(data_in, function(d) {
        //         return d.id
        //     })
    
        // circ
        //     .enter()
        //     .append('circle')
        //     .attr('class', tag_circ)
        //     .attr('stroke-width', circ_strk)
        //     .style('stroke-opacity', 1)
        //     .attr('vector-effect', 'non-scaling-stroke')
        //     .style('pointer-events', 'none')
        //     .attr('transform', function(d) {
        //         return (
        //             ('translate(' + com.ches_g.xyr[d.id].text_x + ',')
        //             + (com.ches_g.xyr[d.id].text_y + ')')
        //         )
        //     })
        //     .style('fill-opacity', fill_opac)
        //     .attr('r', function(d) {
        //         return com.ches_g.xyr[d.id].text_r
        //     })
        //     .style('opacity', 1)
        //     .style('fill', '#383b42')
        //     .merge(circ)
        //     .transition('in_out')
        //     .duration(times.anim)
        //     .style('stroke', function(d) {
        //         return inst_health_col(d[tag_prop], 0.5)
        //     })

        // circ
        //     .exit()
        //     .transition('in_out')
        //     .duration(times.anim)
        //     .attr('r', 0)
        //     .remove()

        //
        let rect = com.ches_g.g
            .selectAll('rect.' + tag_rect)
            .data(data_in, function(d) {
                return d.id
            })
        
        rect
            .enter()
            .append('rect')
            .attr('class', tag_rect)
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', function(d) {
                return com.ches_g.xyr[d.id].rect_w
            })
            .attr('height', function(d) {
                return com.ches_g.xyr[d.id].rect_h
            })
            .attr('transform', function(d) {
                return (
                    ('translate(' + com.ches_g.xyr[d.id].rect_x + ',')
                    + (com.ches_g.xyr[d.id].rect_y + ')')
                )
            })
            .style('pointer-events', 'none')
            .attr('stroke-width', 0)
            .style('fill', rect_col_rc)
            .style('opacity', 1)
            .merge(rect)
            .transition('in_out')
            .duration(times.anim)
            .style('fill', function(d) {
                if (get_tel_state(d[tag_prop]) != TEL_STATES.NOMINAL) {
                    return inst_health_col(d[tag_prop], 0.5)
                }
                else {
                    return rect_col_rc(d)
                }
            })

        rect
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .attr('r', 0)
            .remove()

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
            .attr('class', tag_state + ' ' + tag_lbl)
            .style('font-weight', 'normal')
            .attr('stroke-width', text_strk)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            // first set to ['1px'], then scale to [(font_scale * 1)+'px']
            .style('font-size', '1px')
            .style('font-size', function(d) {

                let ele_wh = get_node_wh_by_id({
                    selction: com.ches_g.g.selectAll('text.' + tag_lbl),
                    id: d.id,
                })
                let font_scale_w = com.ches_g.xyr[d.id].rect_w / ele_wh.width
                let font_scale_h = com.ches_g.xyr[d.id].rect_h / ele_wh.height
                let font_scale = font_rect_scale * Math.min(font_scale_w)

                d.font_scale = font_scale
                
                return font_scale + 'px'
            })
            .attr('dy', function(d) {
                return (d.font_scale / 3) + 'px'
            })
            .attr('text-anchor', 'middle')
            .attr('transform', function(d) {
                return (
                    ('translate(' + com.ches_g.xyr[d.id].text_x + ',')
                    + (com.ches_g.xyr[d.id].text_y + ')')
                )
            })
            .style('opacity', '1')
            .merge(text)
            .transition('in_out')
            .duration(times.anim)
            .style('stroke', text_col_state)
            .style('fill', text_col_state)

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
            // let scale_r = is_south ? 2.0 : 1.1

            let is_ele_on
            let data_in_id = (is_def(data_in) ? data_in.id : '')
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

            // //
            // let circ = com.ches_g.g.selectAll('circle.' + tag_circ)
            
            // circ.each(function(d) {
            //     if (is_ele_on(d)) {
            //         move_node_up(this, 2)
            //     }
            // })

            // //
            // circ
            //     .transition('update')
            //     .duration(times.anim * (is_on ? 0.5 : 0.1))
            //     // .style("opacity", function(d) { return is_ele_on(d) ? 1 : (is_on?0.5:1);  })
            //     .style('fill-opacity', function(d) {
            //         return is_ele_on(d) ? 1 : 0
            //     })
            //     .attr('r', function(d) {
            //         return com.ches_g.xyr[d.id].text_r * (is_ele_on(d) ? scale_r : 1)
            //     })
            //     .attr('stroke-width', function(d) {
            //         return is_ele_on(d) ? circ_strk + 1.5 : 0
            //     })

            //
            let text = com.ches_g.g.selectAll('text.' + tag_lbl)
            // text.each(function(d) {
            //     if (is_ele_on(d)) {
            //         move_node_up(this, 2)
            //     }
            // })

            text
                .transition('update')
                .duration(0)
                // .duration(times.anim * 0.1)
                // // .duration(times.anim * (is_on ? 1 : 0.1))
                // .style('font-size', function(d) {
                //     return (
                //         (is_ele_on(d) ? title_size * scale_r : title_size) + 'px'
                //     )
                // })
                // .attr('dy', function(d) {
                //     return (
                //         (is_ele_on(d) ? title_size * scale_r : title_size) / 3 + 'px'
                //     )
                // })
                // .attr('stroke-width', function(d) {
                //     return (
                //         is_ele_on(d) ? text_strk + 0.7 : text_strk
                //     )
                // })
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

        // vor cels for selection
        let voronoi = d3.Delaunay
            .from(com.ches_g.vor_data, d => d.x, d => d.y)
            .voronoi([ 0, 0, svg_dims.w, svg_dims.h ])

        let tag_vor = 'vor'
        let vor = com.ches_g.g
            .selectAll('path.' + tag_vor)
            .data(com.ches_g.vor_data, function(d, i) {
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
            // // .on('mouseover', (d, i) => console.log(i,d))
            .on('click', function(e, d) {
                tel_data.vor_dblclick({
                    source: 'com.ches_g.g',
                    d: d,
                    is_in_out: false,
                    scale_to_zoom: zooms.len['1.2'],
                })
            })
            .on('mouseover', function(e, d) {
                focus_tel(d, true)
            })
            .on('mouseout', function(e, d) {
                focus_tel(d, false)
            })
            .merge(vor)
            .attr('d', (d, i) => voronoi.renderCell(i))

        vor.exit()
            .transition('out')
            .duration(1)
            .attr('opacity', 0)
            .remove()

        if (show_vor_lines) {
            com.ches_g.g
                .selectAll('path.' + tag_vor)
                .style('opacity', '0.5')
                .style('stroke-width', '2.5')
                .style('stroke', '#E91E63')
        }

        return
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

