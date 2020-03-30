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
        com.tagScrollBox = com.main_tag + 'scrollBox'

        com.tag_clip_path = opt_in.tag_clip_path
        if (!is_def(com.tag_clip_path)) {
            com.tag_clip_path = {
                inner: com.main_tag + 'clipPathInner',
                outer: com.main_tag + 'clipPathOuter',
            }
        }

        // ------------------------------------------------------------------
        // box definition
        // ------------------------------------------------------------------
        let g_box = opt_in.g_box
        com.outerBox = deep_copy(opt_in.boxData)

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.outerG = g_box.append('g')
        com.scrollBoxG = com.outerG.append('g')

        com.scrollBox = new ScrollBox()
        com.scrollBox.init({
            tag: com.tagScrollBox,
            g_box: com.scrollBoxG,
            boxData: com.outerBox,
            useRelativeCoords: opt_in.useRelativeCoords,
            title: opt_in.title,
            locker: opt_in.locker,
            lockers: opt_in.lockers,
            lock_zoom: opt_in.lock_zoom,
            run_loop: opt_in.run_loop,
            sameInnerBoxMarg: false,
            background: opt_in.background,
            // canScroll: opt_in.canScroll,
            // scrollHeight: com.outerBox.h*2,
            // scrollHeight: opt_in.scrollHeight,
            // scroll_rec: {w:200},
        })

        com.innerG = com.scrollBox.get('innerG')
        com.innerBox = com.scrollBox.get('innerBox')

        com.tag_clip_path = com.scrollBox.get('tag_clip_path').outer

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        setStyle(opt_in.style)
    }
    this.init = init

    // ------------------------------------------------------------------
    // styling
    // ------------------------------------------------------------------
    function setStyle(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        com.style = {
        }
    }
    this.setStyle = setStyle

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function updateTable(opt_in) {
        if (is_def(opt_in.table)) {
            com.table = opt_in.table
        }

        let totTableH = com.table.rowsIn.map(x => x.h).reduce((a, b) => a + b)
        totTableH = totTableH * com.table.rowH // +com.table.y

        let hasScroll = totTableH > com.innerBox.h + 0.01

        com.scrollBox.resetScroller({
            canScroll: hasScroll,
            scrollHeight: totTableH,
        })

        let tot_table_w = com.table.rowW
        if (hasScroll) {
            tot_table_w -= com.scrollBox.get('scroll_rec').w
        }

        com.table.rowsOut = []
        $.each(com.table.rowsIn, function(n_row_now, rowNow) {
            // let rowId = com.table.id + n_row_now
            let rowH = rowNow.h * com.table.rowH

            let sumW = rowNow.colsIn.map(x => x.w).reduce((a, b) => a + b)
            $.each(rowNow.colsIn, function(i, d) {
                rowNow.colsIn[i].w /= sumW
            })

            let row = {
                nRow: n_row_now,
                cols: [],
                w: tot_table_w,
                h: rowH,
            }

            $.each(rowNow.colsIn, function(n_col_now, colNow) {
                row.cols.push({
                    id: colNow.id,
                    nCol: n_col_now,
                    w: row.w * colNow.w,
                    h: rowH,
                })
            })

            com.table.rowsOut.push(row)
        })

        let rowY = com.table.y
        com.table.recs = []
        com.table.rec_data = []
        $.each(com.table.rowsOut, function(n_row_now, rowNow) {
            let colX = com.table.x
            com.table.recs.push([])

            $.each(rowNow.cols, function(n_col_now, colNow) {
                // console.log(com.table.rowsIn[n_row_now].colsIn[n_col_now]);
                let recNow = {
                    id: colNow.id,
                    data: com.table.rowsIn[n_row_now].colsIn[n_col_now],
                    nRow: n_row_now,
                    nCol: n_col_now,
                    y: rowY,
                    x: colX,
                    w: colNow.w,
                    h: colNow.h,
                    marg: com.table.marg,
                }

                com.table.recs[n_row_now].push(recNow)
                com.table.rec_data.push(recNow)

                colX += colNow.w
            })
            rowY += rowNow.h
        })

        let debugRect = true
        if (debugRect) {
            let rect = com.innerG
                .selectAll('rect.' + 'tagScroller')
                .data(com.table.rec_data, function(d) {
                    return d.id
                })

            rect
                .enter()
                .append('rect')
                .attr('class', 'tagScroller')
                .attr('x', function(d, i) {
                    return d.x
                })
                .attr('y', function(d, i) {
                    return d.y
                })
                .attr('width', function(d, i) {
                    return d.w
                })
                .attr('height', function(d, i) {
                    return d.h
                })
                .attr('opacity', 0)
                .merge(rect)
                .transition('in_out')
                .duration(times.anim)
                .attr('opacity', 1)
                .attr('x', function(d, i) {
                    return d.x
                })
                .attr('y', function(d, i) {
                    return d.y
                })
                .attr('width', function(d, i) {
                    return d.w
                })
                .attr('height', function(d, i) {
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
    }
    this.updateTable = updateTable
}
