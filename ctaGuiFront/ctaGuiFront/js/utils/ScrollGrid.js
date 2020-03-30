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
    let rec_wH = is_horz ? rec_w : rec_h

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

    let lockerZoom = opt_in.lockerZoom
    if (!is_def(lockerZoom)) {
        lockerZoom = {
            all: main_tag + 'zoom',
            during: main_tag + 'zoomsuring',
            end: main_tag + 'zoomEnd',
        }
    }

    let lockerV = {
    }
    lockerV.lockerV = (
        is_def(opt_in.lockerV) ? opt_in.lockerV : []
    )
    lockerV.zoomsuring = lockerV.lockerV.slice().concat([ lockerZoom.during ])
    lockerV.zoomEnd = lockerV.lockerV.slice().concat([ lockerZoom.end ])

    let vor_show_lines = (
        is_def(vor_opt.vor_show_lines) ? vor_opt.vor_show_lines : false
    )
    let vorMouseover = (
        is_def(vor_opt.mouseover) ? vor_opt.mouseover : null
    )
    let vorMouseout = (
        is_def(vor_opt.mouseout) ? vor_opt.mouseout : null
    )
    let vor_dblclick = (
        is_def(vor_opt.dblclick) ? vor_opt.dblclick : null
    )
    let vorClick = (
        is_def(vor_opt.click) ? vor_opt.click : null
    )
    let vorCall = (
        is_def(vor_opt.call) ? vor_opt.call : null
    )

    let gName = main_tag + 'g'
    let tag_outer = main_tag + 'outer'
    // let tag_inner = main_tag + 'inner'
    let tag_zoom = main_tag + 'zoom'
    let tagDrag = main_tag + 'drag'
    let tag_vor = main_tag + 'vor'
    let tagScrollBar = main_tag + 'scrollBar'
    let tag_txtOut = main_tag + 'recCounters'

    let isInDrag = false
    let isInScrollDrag = false
    // let isInZoom = false
    let inUserZoom = false
    let hasBotTop = false
    let scrollBarRec = null

    let zooms = {
        xy0: is_horz ? x0 + rec_e : y0 + rec_e,
        xy1: is_horz ? x0 + w0 - rec_e - rec_w : y0 + h0 - rec_e - rec_h,
        // delta:    (is_horz ? 1 : -1) * rec_wH * 0.15,
        duration: 0,
        pause: 10,
        extent: [ 1, 1e20, 1e4 ],
        drag: {
            xy: is_horz ? x0 : y0,
            frac: 0,
        },
    }

    let recIn = {
    }
    recIn.idV = {
    }
    recIn.xyFrac = 0
    recIn.isLastIn = false

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
    this.getBackDataG = function() {
        return com.g_bck_data
    }
    this.getFrontDataG = function() {
        return com.g_frnt_data
    }

    // now add the vor tessalation
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setVor() {
        let scroll_rec_marg
        if (!hasBotTop) {
            scroll_rec_marg = [ 0, 0 ]
        }
        else {
            scroll_rec_marg = [ is_horz ? 0 : scroll_rec.w, is_horz ? scroll_rec.w : 0 ]
        }

        let extent = [
            [ x0, y0 ],
            [ x0 + w0 - scroll_rec_marg[0], y0 + h0 - scroll_rec_marg[1] ],
        ]

        let vor_func = d3
            .voronoi()
            .x(function(d) {
                return d.x + d.w / 2
            })
            .y(function(d) {
                return d.y + d.h / 2
            })
            .extent(extent)

        let vor_data = recs[main_tag]

        let vor = com.g_vor
            .selectAll('path.' + tag_vor)
            .data(vor_func.polygons(vor_data), function(d) {
                if (d) {
                    return d.data.id
                }
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
            .style('stroke-width', '.5')
            .style('opacity', vor_show_lines ? 1 : 0)
            .style('stroke', '#4F94CD')
            .on('mouseover', vorMouseover)
            .on('mouseout', vorMouseout)
            .on('dblclick', vor_dblclick)
            .on('click', vorClick)
        // .style("pointer-events", "none")
        // .call(com[tagDrag])
        // .on("mouseover", function(d) { console.log(d.data.id);  }) // debugging
            .merge(vor)
        // .transition("clipPath").duration(1000)
            .call(function(d) {
                d.attr('d', vor_ploy_func)
            })

        vor.exit().remove()

        if (vorCall) {
            com.g_vor.selectAll('path.' + tag_vor).call(vorCall)
        }
        else if (hasBotTop) {
            com.g_vor.selectAll('path.' + tag_vor).call(com[tagDrag])
        }
    }

    function xyFracZoom(xyFracIn) {
        let trans = 0
        let recLen = recs[main_tag].length

        recIn.xyFrac = 0

        if (recLen < 2) {
            return trans
        }

        let xy_min_max = (
            rec_wH + recs[main_tag][recLen - 1][xy]
            - recs[main_tag][0][xy] + 2 * rec_e
        )
        let fracScale = xy_min_max - wh_0

        if (recs[main_tag][0][xy] < zooms.xy0) {
            recIn.xyFrac = (zooms.xy0 - recs[main_tag][0][xy]) / fracScale
            recIn.xyFrac = Math.min(1, Math.max(0, recIn.xyFrac))
        }

        if (is_def(xyFracIn)) {
            let fracDif = Math.min(
                1,
                Math.max(0.0001, Math.abs(xyFracIn - recIn.xyFrac))
            )
            trans = (xyFracIn > recIn.xyFrac ? 1 : -1) * fracDif * fracScale
        }

        return trans
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function updateCounts() {
        let xy_min = (is_horz ? x0 : y0) - rec_wH / 2
        let xy_max = (is_horz ? x0 + w0 : y0 + h0) - rec_wH / 2
        let xyEdgeX = is_horz
            ? [ x0, x0 + w0 ]
            : [ x0 + w0 - scroll_rec.w / 2, x0 + w0 - scroll_rec.w / 2 ]
        let xyEdgeY = is_horz
            ? [ y0 + h0 - scroll_rec.w / 2, y0 + h0 - scroll_rec.w / 2 ]
            : [ y0, y0 + h0 ]
        // let focusEdge = is_horz ? x0 : y0;

        recIn.idV = {
        }
        recIn.xyFrac = 0
        recIn.isLastIn = false
        let recLen = recs[main_tag].length

        if (recLen > 0) {
            xyFracZoom()

            let nRecOut = [ 0, 0 ]
            $.each(recs[main_tag], function(index, data_now) {
                if (data_now[xy] < xy_min) {
                    nRecOut[0] += 1
                }
                else if (data_now[xy] > xy_max) {
                    nRecOut[1] += 1
                }
                else {
                    recIn.idV[data_now.id] = data_now[xy]
                    if (index === recLen - 1) {
                        recIn.isLastIn = true
                    }
                }
            })

            if (show_counts) {
                let textDataOut = []
                $.each(nRecOut, function(index, nRecOutNow) {
                    if (nRecOutNow > 0) {
                        let rNow = scroll_rec.font_size * (nRecOutNow < 100 ? 1.2 : 1.5)
                        textDataOut.push({
                            id: main_tag + 'nRecOut' + index,
                            txt: '' + nRecOutNow,
                            x: xyEdgeX[index],
                            y: xyEdgeY[index],
                            r: rNow,
                        })
                    }
                })

                let circOut = com.g_vor
                    .selectAll('circle.' + tag_txtOut)
                    .data(textDataOut, function(d) {
                        return d.id
                    })

                let textOut = com.g_vor
                    .selectAll('text.' + tag_txtOut)
                    .data(textDataOut, function(d) {
                        return d.id
                    })

                circOut
                    .enter()
                    .append('circle')
                    .attr('class', tag_txtOut)
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
                    .merge(circOut)
                    .transition('in_out')
                    .duration(times.anim_txt)
                    .attr('r', function(d) {
                        return d.r
                    })
                    .style('opacity', 0.7)

                circOut
                    .exit()
                    .transition('in_out')
                    .delay(times.anim_txt)
                    .duration(times.anim_txt)
                    .attr('r', 0)
                    .style('opacity', 0)
                    .remove()

                textOut
                    .enter()
                    .append('text')
                    .attr('class', tag_txtOut)
                    .style('font-weight', 'bold')
                    .style('opacity', 0)
                    .style('fill-opacity', 0.9)
                    .attr('fill', '#F2F2F2')
                    .attr('vector-effect', 'non-scaling-stroke')
                    .style('pointer-events', 'none')
                    .attr('transform', function(d, i) {
                        return 'translate(' + d.x + ',' + d.y + ')'
                    })
                    .attr('text-anchor', 'middle')
                    .merge(textOut)
                // .text(function (d) { return d.txt; })
                    .style('font-size', function(d) {
                        return scroll_rec.font_size + 'px'
                    })
                    .attr('dy', function(d) {
                        return scroll_rec.font_size / 3 + 'px'
                    })
                    .transition('in_out')
                    .duration(times.anim_txt)
                    .attr('transform', function(d, i) {
                        return 'translate(' + d.x + ',' + d.y + ')'
                    })
                    .tween('text', function(d) {
                        return tweenText(d3.select(this), +d.txt)
                    })
                    .style('opacity', 1)

                textOut
                    .exit()
                    .transition('in_out')
                    .duration(times.anim_txt)
                    .tween('text', function(d) {
                        return tweenText(d3.select(this), 0)
                    })
                    .style('opacity', 0)
                    .remove()
            }
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let formatInt = d3.format('d')
    function tweenText(this_ele, new_val) {
        let prevText = this_ele.text()
        let interpolate = d3.interpolate(prevText, new_val)
        return function(t) {
            this_ele.text(formatInt(interpolate(t)))
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    com.totTrans = 0
    function setupZoom() {
        com.zoom_start = function() {
            if (!hasBotTop) {
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
        com.zoomsuring = function() {
            if (!hasBotTop) {
                return
            }
            // if(!is_def(d3.event.sourceEvent)) return;
            // isInZoom = true
            inUserZoom = is_def(d3.event.sourceEvent)

            if (locker.are_free(lockerV.zoomsuring)) {
                locker.add({
                    id: lockerZoom.all,
                    override: true,
                })
                locker.add({
                    id: lockerZoom.during,
                    override: true,
                })

                let trans = null
                delay = 0
                if (inUserZoom) {
                    let wdX = d3.event.sourceEvent.deltaX
                    let wdY = d3.event.sourceEvent.deltaY
                    let wdXY = Math.abs(wdX) > Math.abs(wdY) ? -1 * wdX : wdY //* (is_horz?1:-1);

                    // trans = is_def(wdXY) ? (((wdXY > 0)?1:-1) * zooms.delta) : 0;
                    trans = is_def(wdXY) ? -1 * wdXY : 0
                }

                com.doTrans(trans)

                locker.remove({
                    id: lockerZoom.during,
                    delay: delay,
                })
            }

            // console.log(d3.zoomTransform(com[tag_zoom+"zoom_node"]).k);
        }

        com.doTrans = function(trans) {
            if (Math.abs(trans) < wh_0 * 1e-10) {
                return
            }

            if (is_def(trans)) {
                let recLastI = recs[main_tag].length - 1

                if (recs[main_tag][0][xy] + trans > zooms.xy0) {
                    if (recs[main_tag][0][xy] < zooms.xy0) {
                        trans = zooms.xy0 - recs[main_tag][0][xy]
                    }
                    else {
                        trans = null
                    }
                }
                else if (recs[main_tag][recLastI][xy] + trans < zooms.xy1) {
                    if (recs[main_tag][recLastI][xy] > zooms.xy1) {
                        trans = zooms.xy1 - recs[main_tag][recLastI][xy]
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
                        wh: rec_wH,
                        duration: 0,
                    })
                }
                // else {
                //   let totTrans = recs[main_tag][0][xy] - recs[main_tag][0].xy0;

                //   com.g_bck_data.attr("transform", function(d,i) {
                //     return "translate(0,"+totTrans+")";
                //   })

                //   com.clipRec.attr("transform", function(d,i) {
                //     return "translate(0,"+(-1*totTrans)+")";
                //   })
                // }

                updateCounts()
                zoom_scrollbarUpdate()
            }
        }

        com.zoomEnd = function() {
            if (!hasBotTop) {
                return
            }

            let hasUpdCount = false
            if (locker.are_free(lockerV.zoomEnd)) {
                locker.add({
                    id: lockerZoom.end,
                    override: true,
                })

                // let delta    = zooms.delta;
                let recLastI = recs[main_tag].length - 1

                let trans = null
                if (recLastI > 0) {
                    if (recs[main_tag][0][xy] > zooms.xy0) {
                        trans = zooms.xy0 - recs[main_tag][0][xy]
                    }
                    if (recs[main_tag][recLastI][xy] < zooms.xy1) {
                        trans = zooms.xy1 - recs[main_tag][recLastI][xy]
                    }
                }
                if (is_def(trans)) {
                    $.each(recs[main_tag], function(index, data_now) {
                        data_now[xy] += trans
                    })

                    hasUpdCount = true
                    updateCounts()
                    zoom_scrollbarUpdate()
                }

                if (is_def(on_zoom.end)) {
                    on_zoom.end({
                        id: main_tag,
                        type: 'end',
                        xy: xy,
                        wh: rec_wH,
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
                            id: lockerZoom.end,
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

                setVor()

                return
            }

            if (!hasUpdCount) {
                updateCounts()
                zoom_scrollbarUpdate()
            }

            if (!isInDrag) {
                locker.remove({
                    id: lockerZoom.all,
                    override: true,
                    delay: zooms.duration,
                })
            }
            // isInZoom = false
            inUserZoom = false

            zooms.duration = 0
        }

        com.dragStart = function(coords) {
            locker.add({
                id: lockerZoom.all,
                override: true,
            })

            // if has a scrill bar and the mouse is over it (otherwise it will interfere with click)
            isInScrollDrag = false
            if (hasBotTop) {
                if (is_horz && coords[1] > y0 + h0 - scroll_rec.w) {
                    isInScrollDrag = true
                }
                if (!is_horz && coords[0] > x0 + w0 - scroll_rec.w) {
                    isInScrollDrag = true
                }
            }

            if (isInScrollDrag) {
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

        com.dragDuring = function(coordsIn) {
            isInDrag = true

            if (isInScrollDrag) {
                let coords = [ coordsIn[0], coordsIn[1] ]
                if (is_horz) {
                    coords[0] -= zooms.drag.xy
                }
                else {
                    coords[1] -= zooms.drag.xy
                }

                recBckClickOnce({
                    coords: coords,
                    duration: 0,
                })
            }
            else {
                let trans = is_horz ? -d3.event.dx : d3.event.dy
                com.doTrans(trans)
            }
        }

        com.dragEnd = function() {
            locker.remove({
                id: lockerZoom.all,
                override: true,
            })

            if (!isInScrollDrag) {
                com.zoomEnd()
            }

            isInDrag = false
            isInScrollDrag = false
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom] = d3.zoom().scaleExtent([ zooms.extent['0'], zooms.extent['1'] ])
        com[tag_zoom]
            .on('start', com.zoom_start)
            .on('zoom', com.zoomsuring)
            .on('end', com.zoomEnd)

        // needed for auotomatic zoom
        com[tag_zoom + 'zoom_node'] = com.g_vor.nodes()[0]
        com[tag_zoom + 'zoomed'] = com.g_vor.append('g')

        com[tagDrag] = d3.drag()
        com[tagDrag]
            .on('start', function(d) {
                com.dragStart(d3.mouse(this))
            })
            .on('drag', function(d) {
                com.dragDuring(d3.mouse(this))
            })
            .on('end', function(d) {
                com.dragEnd()
            })

        setZoomStatus()
    }

    // ------------------------------------------------------------------
    // activate/disable the zoom behaviour
    // ------------------------------------------------------------------
    function setZoomStatus() {
        if (hasBotTop) {
            com.g_vor.call(com[tag_zoom]).on('dblclick.zoom', null)
        }
        else {
            com.g_vor.on('.zoom', null)
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function zoom_scrollbarUpdate() {
        if (!is_def(scrollBarRec)) {
            return
        }

        // instant transition in case of dragging
        if (isInDrag || inUserZoom) {
            scrollBarRec.attr('transform', zoom_scrollbarTrans)
        }
        else {
            scrollBarRec
                .transition('move')
                .duration(times.anim)
                .attr('transform', zoom_scrollbarTrans)
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function zoom_scrollbarInit() {
        if (!locker.is_free(main_tag + 'zoom_scrollbarInit')) {
            return
        }

        locker.add({
            id: main_tag + 'zoom_scrollbarInit',
            override: true,
        })
        scrollBarRec = null

        // ------------------------------------------------------------------
        let nDone = 0
        let dataBck = hasBotTop ? [{
            id: 'zoom_scrollbar_bck',
            x: wh_0,
        }] : []
        let recBck = com.g_vor
            .selectAll('rect.' + tagScrollBar + 'bck')
            .data(dataBck, function(d) {
                return d.id
            })

        recBck
            .enter()
            .append('rect')
            .attr('class', tagScrollBar + 'bck')
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
            .on('click', function(d) {
                recBckClickOnce({
                    coords: d3.mouse(this),
                })
            })
            .call(com[tagDrag])
            .style('opacity', 1)
            .transition('in_out')
            .duration(times.anim)
            .attr('x', is_horz ? x0 : x0 + w0 - scroll_rec.w)
            .attr('y', is_horz ? y0 + h0 - scroll_rec.w : y0)
            .attr('width', is_horz ? w0 : scroll_rec.w)
            .attr('height', is_horz ? scroll_rec.w : h0)
            .on('end', function(d) {
                nDone += 1
            })

        recBck
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .attr('x', is_horz ? x0 : x0 + w0)
            .attr('y', is_horz ? y0 + h0 : y0)
            .attr('width', is_horz ? w0 : 0)
            .attr('height', is_horz ? 0 : h0)
            .remove()
            .on('end', function(d) {
                nDone += 1
            })

        // ------------------------------------------------------------------
        set_recScroll()

        // ------------------------------------------------------------------
        let n_tries = 0
        let max_tries = 500
        function scrollBarRecSet() {
            setTimeout(function() {
                // console.log('ndone',nDone);

                if (nDone < 1 && n_tries < max_tries) {
                    scrollBarRecSet()
                }
                else {
                    if (n_tries >= max_tries) {
                        console.error('cant seem to init zoom_scrollbar ...')
                    }

                    scrollBarRec = com.g_vor.selectAll('rect.' + tagScrollBar + 'scroll')
                    locker.remove({
                        id: main_tag + 'zoom_scrollbarInit',
                    })
                }
                n_tries += 1
            }, times.anim / 5)
        }

        if (hasBotTop) {
            scrollBarRecSet()
        }
        else {
            locker.remove({
                id: main_tag + 'zoom_scrollbarInit',
            })
        }
    }

    // ------------------------------------------------------------------
    function set_recScroll() {
        let marg = scroll_rec.w * scroll_rec.marg / 2
        let recLen = recs[main_tag].length
        let xy_min_max = wh_0
        if (recLen > 0) {
            if (is_def(recs[main_tag][recLen - 1])) {
                xy_min_max
          = rec_wH
          + recs[main_tag][recLen - 1][xy]
          - recs[main_tag][0][xy]
          + 2 * rec_e
            }
        }
        scroll_rec.h = wh_0 * (wh_0 / xy_min_max)

        let dataScroll = hasBotTop ? [{
            id: 'zoom_scrollbarScroll',
        }] : []
        let recScroll = com.g_vor
            .selectAll('rect.' + tagScrollBar + 'scroll')
            .data(dataScroll, function(d) {
                return d.id
            })

        recScroll
            .enter()
            .append('rect')
            .attr('class', tagScrollBar + 'scroll')
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
            .attr('transform', zoom_scrollbarTrans)
            .merge(recScroll)
            .transition('in_out')
            .duration(times.anim)
            .attr('transform', zoom_scrollbarTrans)
            .attr('x', is_horz ? x0 + marg : x0 + w0 - scroll_rec.w + marg)
            .attr('y', is_horz ? y0 + h0 - scroll_rec.w + marg : y0 + marg)
            .attr('width', is_horz ? scroll_rec.h - marg * 2 : scroll_rec.w - marg * 2)
            .attr('height', is_horz ? scroll_rec.w - marg * 2 : scroll_rec.h - marg * 2)

        if (is_horz) {
            recScroll
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
            recScroll
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
        zooms.drag.frac = recIn.xyFrac
    }

    // ------------------------------------------------------------------
    function zoom_scrollbarTrans() {
    // let pos = recIn.xyFrac * wh_0 - scroll_rec.h * 0.5;
    // pos = Math.max(0, Math.min(wh_0- scroll_rec.h, pos));
    // // console.log('pos',recIn.xyFrac,pos);

        let pos = recIn.xyFrac * (wh_0 - scroll_rec.h)
        if (is_horz) {
            return 'translate(' + pos + ',0)'
        }
        else {
            return 'translate(0,' + pos + ')'
        }
    }

    // ------------------------------------------------------------------
    run_loop.init({
        tag: main_tag + 'recBckClick',
        func: recBckClickOnce,
        n_keep: 1,
    })

    function recBckClick(data_in) {
        run_loop.push({
            tag: main_tag + 'recBckClick',
            data: data_in,
        })
    }

    function recBckClickOnce(data_in) {
        if (!locker.are_free(lockerV.zoomsuring)) {
            setTimeout(function() {
                recBckClick(data_in)
            }, times.anim / 2)
            return
        }

        if (!is_def(data_in)) {
            return
        }
        if (!is_def(data_in.coords)) {
            return
        }

        // zooms.drag.frac = is_horz ? (data_in.coords[0] - zooms.xy0)/w0 : (data_in.coords[1] - zooms.xy0)/h0;
        zooms.drag.frac = is_horz
            ? (data_in.coords[0] - x0) / w0
            : (data_in.coords[1] - y0) / h0
        zooms.drag.frac = Math.min(1, Math.max(0, zooms.drag.frac))

        let trans = xyFracZoom(zooms.drag.frac)

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
    // access function for getRecV
    // ------------------------------------------------------------------
    function getRecV() {
        return rec_data
    }
    this.getRecV = getRecV

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
        let rec_data_in_len = n_rows_0 <= 1 ? n_rec_in : Math.ceil(n_rec_in / n_rows_0 - 0.0001)
        let allRecLen = rec_data_in_len * (rec_wH + rec_m) - rec_m
        hasBotTop = is_horz ? allRecLen > w0 : allRecLen > h0

        let xCent = x0
        let yCent = y0
        if (is_horz) {
            let h1 = hasBotTop ? h0 - scroll_rec.w : h0
            xCent += rec_e
            yCent += (h1 - (rec_h + (n_rows_0 - 1) * (rec_h + rec_m))) / 2
        }
        else {
            let w1 = hasBotTop ? w0 - scroll_rec.w : w0
            xCent += (w1 - (rec_w + (n_rows_0 - 1) * (rec_w + rec_m))) / 2
            yCent += rec_e
        }

        if (!hasBotTop) {
            if (is_horz) {
                xCent += (w0 - (allRecLen + 2 * rec_e)) / 2
            }
            else {
                yCent += (h0 - (allRecLen + 2 * rec_e)) / 2
            }
        }

        let xStep = rec_w + rec_m
        let yStep = rec_h + rec_m

        let index_shift = 0
        if (is_inv_order && n_rec_in > n_rows) {
            index_shift = (n_rows_0 - n_rec_in % n_rows_0) % n_rows_0
        }
        // let index_shift = (is_inv_order && n_rec_in > n_rows) ? ((n_rows_0 - n_rec_in % n_rows_0) % n_rows_0) : 0;

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        recs[main_tag] = []
        $.each(rec_data_in, function(index, recNow) {
            let index_now_0 = index + index_shift
            let n_row_now_0 = index_now_0 % n_rows_0
            let n_col_now_0 = Math.floor((index_now_0 - n_row_now_0) / n_rows_0 + 0.00001)

            let n_col_now = is_horz ? n_col_now_0 : n_row_now_0
            let n_row_now = is_horz ? n_row_now_0 : n_col_now_0

            let xNow = n_col_now * xStep
            let yNow = n_row_now * yStep

            let data_now = {
            }
            data_now.scrollGridId = main_tag
            data_now.x = xCent + xNow
            data_now.y = yCent + yNow
            data_now.w = rec_w
            data_now.h = rec_h
            data_now.id = recNow.id
            data_now.data = recNow

            recs[main_tag].push(data_now)
        })

        // ------------------------------------------------------------------
        // correct for current zoom scrolling - match the position of the first rec in view
        // ------------------------------------------------------------------
        if (hasBotTop) {
            let trans = null
            let recLastI = recs[main_tag].length - 1

            $.each(recs[main_tag], function(index, recNow) {
                // get first element which was already in view
                if (!is_def(trans)) {
                    if (is_def(recIn.idV[recNow.id])) {
                        trans = recIn.idV[recNow.id] - recNow[xy]
                    }
                }
                // if inverted order, get the last element which was originally in view
                if (is_inv_order || recIn.isLastIn) {
                    if (is_def(recIn.idV[recNow.id])) {
                        trans = recIn.idV[recNow.id] - recNow[xy]
                    }
                }
            })

            if (recs[main_tag][0][xy] + trans > zooms.xy0) {
                if (recs[main_tag][0][xy] < zooms.xy0) {
                    trans = zooms.xy0 - recs[main_tag][0][xy]
                }
                else {
                    trans = null
                }
            }
            else if (recs[main_tag][recLastI][xy] + trans < zooms.xy1) {
                if (recs[main_tag][recLastI][xy] > zooms.xy1) {
                    trans = zooms.xy1 - recs[main_tag][recLastI][xy]
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
        // if(hasBotTop) {
        //   let xy_min = min_max_obj({
        //     min_max:'min', data:recs[main_tag], func: xy
        //   });
        //   let xy_max = min_max_obj({
        //     min_max:'max', data:recs[main_tag],
        //     func: is_horz ? function(d,i) { return d.x+d.w; } : function(d,i) { return d.y+d.h; }
        //   });
        //   outFrac = (xy_max - xy_min) / ( is_horz?w0:h0 );
        // }
        // zooms.delta = (is_horz ? 1 : -1) * rec_wH * 0.1 * outFrac;

        // ------------------------------------------------------------------
        // activate/disable the zoom behaviour after updating hasBotTop
        // ------------------------------------------------------------------
        setZoomStatus()

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function on_zoom_end() {
            setVor()
            updateCounts()
            // // zoom_scrollbar();

            if (
                (hasBotTop && !is_def(scrollBarRec))
        || (!hasBotTop && is_def(scrollBarRec))
            ) {
                zoom_scrollbarInit()
            }

            if (hasBotTop) {
                set_recScroll()
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
    let clipPath = defs.append('clipPath').attr('id', tag_clip_path + main_tag)
    // console.log('tag_clip_path + main_tag',tag_clip_path + main_tag)

    com.clipRec = clipPath
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
    function hasFrnt(prop) {
        return is_def(frnt) ? is_def(frnt[prop]) : false
    }

    let bckRecData = [{
        id: 'back',
    }]
    if (is_def(frnt)) {
        bckRecData.push({
            id: 'frnt',
        })
    }

    com.g_bck
        .selectAll('rect.' + tag_outer)
        .data(bckRecData, function(d) {
            return d.id
        })
        .enter()
        .append('rect')
        .attr('class', tag_outer)
        .attr('x', x0)
        .attr('y', y0)
        .attr('width', w0)
        .attr('height', h0)
        .attr('stroke', hasFrnt('strk') ? frnt.strk : '#383B42')
        .attr('stroke-width', hasFrnt('strkW') ? frnt.strkW : '1')
        .attr('stroke-opacity', function(d, i) {
            return i === 0 ? (hasFrnt('strk_opac') ? frnt.strk_opac : 1) : 0
        })
        .attr('fill', function(d, i) {
            return i === 0 ? '#F2F2F2' : hasFrnt('fill') ? frnt.fill : '#383B42'
        })
        .attr('fill-opacity', function(d, i) {
            return i === 0 ? 1 : hasFrnt('fillOcp') ? frnt.fillOcp : 0.025
        })
    // .attr("transform", "translate("+(x0)+","+(y0)+")")
    // .style("pointer-events", "none")

    if (is_def(bck_rec_opt.bck_pattern)) {
        bck_pattern(bck_rec_opt.bck_pattern)
    }
    else if (is_def(bck_rec_opt.texture_orient) || is_def(bck_rec_opt.circ_type)) {
        let bckPatOpt = {
            com: com,
            g_now: com.g_bck,
            g_tag: gName,
            len_wh: [ w0, h0 ],
            trans: [ x0, y0 ],
            opac: is_def(bck_rec_opt.textureOpac) ? bck_rec_opt.textureOpac : 0.06,
        }

        $.each([ 'texture_orient', 'circ_type', 'size' ], function(index, optType) {
            if (is_def(bck_rec_opt[optType])) {
                bckPatOpt[optType] = bck_rec_opt[optType]
            }
        })

        bck_pattern(bckPatOpt)
    }

    setupZoom()

    // com[tagScrollBar].call(com[tag_zoom]).on("dblclick.zoom", null);

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
//     // .attr("clip-path", function(d){ return "url(#"+tag_clip_path+d.scrollGridId+")"; })
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
