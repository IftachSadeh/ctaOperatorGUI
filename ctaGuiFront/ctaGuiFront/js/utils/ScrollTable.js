/* global $ */
/* global times */
/* global is_def */
/* global deep_copy */
/* global ScrollBox */
/* global cols_blues */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/ScrollBox.js',
})

window.ScrollTable = function() {
    let com = {
    }

    this.set = function(opt_in) {
        if (is_def(opt_in.data)) {
            com[opt_in.tag] = opt_in.data
        }
        else if (is_def(opt_in.def)) {
            com[opt_in.tag] = opt_in.def
        }
        else {
            com[opt_in.tag] = null
        }
    }
    this.get = function(type) {
        return com[type]
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init(opt_in) {
        if (is_def(com.main_tag)) {
            console.error('trying to init more than once ...', opt_in)
            return
        }

        com.main_tag = opt_in.tag
        com.tag_scroll_box = com.main_tag + 'scroll_box'

        com.tag_clip_path = opt_in.tag_clip_path
        if (!is_def(com.tag_clip_path)) {
            com.tag_clip_path = {
                inner: com.main_tag + 'clip_path_inner',
                outer: com.main_tag + 'clip_path_outer',
            }
        }

        // ------------------------------------------------------------------
        // box definition
        // ------------------------------------------------------------------
        let g_box = opt_in.g_box
        com.outer_box = deep_copy(opt_in.box_data)

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.outer_g = g_box.append('g')
        com.scroll_box_g = com.outer_g.append('g')

        com.scroll_box = new ScrollBox()
        com.scroll_box.init({
            tag: com.tag_scroll_box,
            g_box: com.scroll_box_g,
            box_data: com.outer_box,
            use_relative_coords: opt_in.use_relative_coords,
            title: opt_in.title,
            locker: opt_in.locker,
            lockers: opt_in.lockers,
            lock_zoom: opt_in.lock_zoom,
            run_loop: opt_in.run_loop,
            same_inner_box_marg: false,
            background: opt_in.background,
            // can_scroll: opt_in.can_scroll,
            // scroll_height: com.outer_box.h*2,
            // scroll_height: opt_in.scroll_height,
            // scroll_rec: {w:200},
        })

        com.inner_g = com.scroll_box.get('inner_g')
        com.inner_box = com.scroll_box.get('inner_box')

        com.tag_clip_path = com.scroll_box.get('tag_clip_path').outer

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        set_style(opt_in.style)

        return
    }
    this.init = init

    // ------------------------------------------------------------------
    // styling
    // ------------------------------------------------------------------
    function set_style(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        com.style = {
        }
    }
    this.set_style = set_style

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_table(opt_in) {
        if (is_def(opt_in.table)) {
            com.table = opt_in.table
        }

        let tot_table_h = com.table.rows_in.map(x => x.h).reduce((a, b) => a + b)
        tot_table_h = tot_table_h * com.table.row_h // +com.table.y

        let has_scroll = tot_table_h > com.inner_box.h + 0.01

        com.scroll_box.reset_scroller({
            can_scroll: has_scroll,
            scroll_height: tot_table_h,
        })

        let tot_table_w = com.table.rowW
        if (has_scroll) {
            tot_table_w -= com.scroll_box.get('scroll_rec').w
        }

        com.table.rows_out = []
        $.each(com.table.rows_in, function(n_row_now, row_now) {
            // let rowId = com.table.id + n_row_now
            let row_h = row_now.h * com.table.row_h

            let sum_w = row_now.cols_in.map(x => x.w).reduce((a, b) => a + b)
            $.each(row_now.cols_in, function(i, _) {
                row_now.cols_in[i].w /= sum_w
            })

            let row = {
                n_row: n_row_now,
                cols: [],
                w: tot_table_w,
                h: row_h,
            }

            $.each(row_now.cols_in, function(n_col_now, col_now) {
                row.cols.push({
                    id: col_now.id,
                    n_col: n_col_now,
                    w: row.w * col_now.w,
                    h: row_h,
                })
            })

            com.table.rows_out.push(row)
        })

        let row_y = com.table.y
        com.table.recs = []
        com.table.rec_data = []
        $.each(com.table.rows_out, function(n_row_now, row_now) {
            let col_x = com.table.x
            com.table.recs.push([])

            $.each(row_now.cols, function(n_col_now, col_now) {
                // console.log(com.table.rows_in[n_row_now].cols_in[n_col_now]);
                let rec_now = {
                    id: col_now.id,
                    data: com.table.rows_in[n_row_now].cols_in[n_col_now],
                    n_row: n_row_now,
                    n_col: n_col_now,
                    y: row_y,
                    x: col_x,
                    w: col_now.w,
                    h: col_now.h,
                    marg: com.table.marg,
                }

                com.table.recs[n_row_now].push(rec_now)
                com.table.rec_data.push(rec_now)

                col_x += col_now.w
            })
            row_y += row_now.h
        })

        let debug_rect = true
        if (debug_rect) {
            let rect = com.inner_g
                .selectAll('rect.' + 'tag_scroller')
                .data(com.table.rec_data, function(d) {
                    return d.id
                })

            rect
                .enter()
                .append('rect')
                .attr('class', 'tag_scroller')
                .attr('x', function(d) {
                    return d.x
                })
                .attr('y', function(d) {
                    return d.y
                })
                .attr('width', function(d) {
                    return d.w
                })
                .attr('height', function(d) {
                    return d.h
                })
                .attr('opacity', 0)
                .merge(rect)
                .transition('in_out')
                .duration(times.anim)
                .attr('opacity', 1)
                .attr('x', function(d) {
                    return d.x
                })
                .attr('y', function(d) {
                    return d.y
                })
                .attr('width', function(d) {
                    return d.w
                })
                .attr('height', function(d) {
                    return d.h
                })
                .attr('stroke', '#383B42')
                .attr('stroke-width', '1')
                .attr('stroke-opacity', 0.2)
                .attr('fill', cols_blues[0])
                .attr('fill-opacity', 0)
                .style('pointer-events', 'none')

            rect
                .exit()
                .transition('in_out')
                .duration(times.anim_txt)
                .style('opacity', 0)
                .remove()
        }
    
        return
    }
    this.update_table = update_table

    return
}
