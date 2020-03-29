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
    let mainTag = opt_in.id
    let recs = opt_in.recs
    let x0 = opt_in.x0
    let y0 = opt_in.y0
    let w0 = opt_in.w0
    let h0 = opt_in.h0
    let m0 = opt_in.m0
    let run_loop = opt_in.run_loop
    // let focus0 = opt_in.focus0
    // let recOrder = opt_in.recOrder
    let isHorz = opt_in.isHorz
    // let tagVecDataIn = opt_in.tagVecDataIn
    let locker = opt_in.locker
    // let gIn = opt_in.g
    let xy = isHorz ? 'x' : 'y'
    let wh0 = isHorz ? w0 : h0

    let isInvOrder = is_def(opt_in.isInvOrder) ? opt_in.isInvOrder : false
    let showCounts = is_def(opt_in.showCounts) ? opt_in.showCounts : true
    let tagClipPath = is_def(opt_in.tagClipPath)
        ? opt_in.tagClipPath
        : mainTag + 'clipPath'
    let autoClipPath = is_def(opt_in.autoClipPath) ? opt_in.autoClipPath : true

    let bckRecOpt = opt_in.bckRecOpt
    if (!is_def(bckRecOpt)) {
        bckRecOpt = {
            texture_orient: '5/8',
            frontProp: {
                strkWOcp: 0.2,
            },
        }
    }

    let onZoom = is_def(opt_in.onZoom) ? opt_in.onZoom : {
    }
    // if(!is_def(onZoom.start))  onZoom.start  = function(){};
    // if(!is_def(onZoom.during)) onZoom.during = function(){};
    // if(!is_def(onZoom.end))    onZoom.end    = function(){};

    com.g_base = opt_in.g_box
    com.gBack = is_def(opt_in.gBack) ? opt_in.gBack : com.g_base.append('g')
    com.gBckData = is_def(opt_in.gBckData) ? opt_in.gBckData : com.g_base.append('g')
    com.gVor = is_def(opt_in.gVor) ? opt_in.gVor : com.g_base.append('g')
    com.gFrntData = is_def(opt_in.gFrntData)
        ? opt_in.gFrntData
        : com.g_base.append('g')

    let recV = is_def(opt_in.recV) ? opt_in.recV : []
    let vorOpt = is_def(opt_in.vorOpt) ? opt_in.vorOpt : {
    }
    // let invertZoom = is_def(opt_in.invertZoom) ? opt_in.invertZoom : !isHorz

    let nRows = is_def(opt_in.nRows) ? opt_in.nRows : 1
    let rec_w = is_def(opt_in.rec_w) ? opt_in.rec_w : 45
    let rec_h = is_def(opt_in.rec_h) ? opt_in.rec_h : rec_w
    let rec_m = is_def(opt_in.rec_m) ? opt_in.rec_m : Math.min(rec_w, rec_h) * 0.2
    let rec_e = is_def(opt_in.rec_e) ? opt_in.rec_e : rec_m * 3
    let rec_wH = isHorz ? rec_w : rec_h

    let scroll_rec = is_def(opt_in.scroll_rec) ? opt_in.scroll_rec : {
    }
    if (!is_def(scroll_rec.w)) {
        scroll_rec.w = (isHorz ? h0 : w0) * 0.125
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
            all: mainTag + 'zoom',
            during: mainTag + 'zoomsuring',
            end: mainTag + 'zoomEnd',
        }
    }

    let lockerV = {
    }
    lockerV.lockerV = is_def(opt_in.lockerV) ? opt_in.lockerV : []
    lockerV.zoomsuring = lockerV.lockerV.slice().concat([ lockerZoom.during ])
    lockerV.zoomEnd = lockerV.lockerV.slice().concat([ lockerZoom.end ])

    let vor_show_lines = is_def(vorOpt.vor_show_lines) ? vorOpt.vor_show_lines : false
    let vorMouseover = is_def(vorOpt.mouseover) ? vorOpt.mouseover : null
    let vorMouseout = is_def(vorOpt.mouseout) ? vorOpt.mouseout : null
    let vor_dblclick = is_def(vorOpt.dblclick) ? vorOpt.dblclick : null
    let vorClick = is_def(vorOpt.click) ? vorOpt.click : null
    let vorCall = is_def(vorOpt.call) ? vorOpt.call : null

    let gName = mainTag + 'g'
    let tag_outer = mainTag + 'outer'
    // let tag_inner = mainTag + 'inner'
    let tag_zoom = mainTag + 'zoom'
    let tagDrag = mainTag + 'drag'
    let tag_vor = mainTag + 'vor'
    let tagScrollBar = mainTag + 'scrollBar'
    let tag_txtOut = mainTag + 'recCounters'

    let isInDrag = false
    let isInScrollDrag = false
    // let isInZoom = false
    let inUserZoom = false
    let hasBotTop = false
    let scrollBarRec = null

    let zooms = {
        xy0: isHorz ? x0 + rec_e : y0 + rec_e,
        xy1: isHorz ? x0 + w0 - rec_e - rec_w : y0 + h0 - rec_e - rec_h,
        // delta:    (isHorz ? 1 : -1) * rec_wH * 0.15,
        duration: 0,
        pause: 10,
        extent: [ 1, 1e20, 1e4 ],
        drag: {
            xy: isHorz ? x0 : y0,
            frac: 0,
        },
    }

    let recIn = {
    }
    recIn.idV = {
    }
    recIn.xyFrac = 0
    recIn.isLastIn = false

    recs[mainTag] = []

    // adjust for a possible top/left margin for a title
    if (is_def(m0)) {
        if (isHorz) {
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
        return com.gBckData
    }
    this.getFrontDataG = function() {
        return com.gFrntData
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
            scroll_rec_marg = [ isHorz ? 0 : scroll_rec.w, isHorz ? scroll_rec.w : 0 ]
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

        let vor_data = recs[mainTag]

        let vor = com.gVor
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
            com.gVor.selectAll('path.' + tag_vor).call(vorCall)
        }
        else if (hasBotTop) {
            com.gVor.selectAll('path.' + tag_vor).call(com[tagDrag])
        }
    }

    function xyFracZoom(xyFracIn) {
        let trans = 0
        let recLen = recs[mainTag].length

        recIn.xyFrac = 0

        if (recLen < 2) {
            return trans
        }

        let xy_min_max
      = rec_wH + recs[mainTag][recLen - 1][xy] - recs[mainTag][0][xy] + 2 * rec_e
        let fracScale = xy_min_max - wh0

        if (recs[mainTag][0][xy] < zooms.xy0) {
            recIn.xyFrac = (zooms.xy0 - recs[mainTag][0][xy]) / fracScale
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
        let xy_min = (isHorz ? x0 : y0) - rec_wH / 2
        let xy_max = (isHorz ? x0 + w0 : y0 + h0) - rec_wH / 2
        let xyEdgeX = isHorz
            ? [ x0, x0 + w0 ]
            : [ x0 + w0 - scroll_rec.w / 2, x0 + w0 - scroll_rec.w / 2 ]
        let xyEdgeY = isHorz
            ? [ y0 + h0 - scroll_rec.w / 2, y0 + h0 - scroll_rec.w / 2 ]
            : [ y0, y0 + h0 ]
        // let focusEdge = isHorz ? x0 : y0;

        recIn.idV = {
        }
        recIn.xyFrac = 0
        recIn.isLastIn = false
        let recLen = recs[mainTag].length

        if (recLen > 0) {
            xyFracZoom()

            let nRecOut = [ 0, 0 ]
            $.each(recs[mainTag], function(index, data_now) {
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

            if (showCounts) {
                let textDataOut = []
                $.each(nRecOut, function(index, nRecOutNow) {
                    if (nRecOutNow > 0) {
                        let rNow = scroll_rec.font_size * (nRecOutNow < 100 ? 1.2 : 1.5)
                        textDataOut.push({
                            id: mainTag + 'nRecOut' + index,
                            txt: '' + nRecOutNow,
                            x: xyEdgeX[index],
                            y: xyEdgeY[index],
                            r: rNow,
                        })
                    }
                })

                let circOut = com.gVor
                    .selectAll('circle.' + tag_txtOut)
                    .data(textDataOut, function(d) {
                        return d.id
                    })

                let textOut = com.gVor
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
            if (is_def(onZoom.start)) {
                onZoom.start({
                    id: mainTag,
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
                    let wdXY = Math.abs(wdX) > Math.abs(wdY) ? -1 * wdX : wdY //* (isHorz?1:-1);

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
            if (Math.abs(trans) < wh0 * 1e-10) {
                return
            }

            if (is_def(trans)) {
                let recLastI = recs[mainTag].length - 1

                if (recs[mainTag][0][xy] + trans > zooms.xy0) {
                    if (recs[mainTag][0][xy] < zooms.xy0) {
                        trans = zooms.xy0 - recs[mainTag][0][xy]
                    }
                    else {
                        trans = null
                    }
                }
                else if (recs[mainTag][recLastI][xy] + trans < zooms.xy1) {
                    if (recs[mainTag][recLastI][xy] > zooms.xy1) {
                        trans = zooms.xy1 - recs[mainTag][recLastI][xy]
                    }
                    else {
                        trans = null
                    }
                }
            }

            if (is_def(trans)) {
                delay = zooms.pause

                $.each(recs[mainTag], function(index, data_now) {
                    data_now[xy] += trans
                })

                if (is_def(onZoom.during)) {
                    onZoom.during({
                        id: mainTag,
                        type: 'during',
                        xy: xy,
                        wh: rec_wH,
                        duration: 0,
                    })
                }
                // else {
                //   let totTrans = recs[mainTag][0][xy] - recs[mainTag][0].xy0;

                //   com.gBckData.attr("transform", function(d,i) {
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
                let recLastI = recs[mainTag].length - 1

                let trans = null
                if (recLastI > 0) {
                    if (recs[mainTag][0][xy] > zooms.xy0) {
                        trans = zooms.xy0 - recs[mainTag][0][xy]
                    }
                    if (recs[mainTag][recLastI][xy] < zooms.xy1) {
                        trans = zooms.xy1 - recs[mainTag][recLastI][xy]
                    }
                }
                if (is_def(trans)) {
                    $.each(recs[mainTag], function(index, data_now) {
                        data_now[xy] += trans
                    })

                    hasUpdCount = true
                    updateCounts()
                    zoom_scrollbarUpdate()
                }

                if (is_def(onZoom.end)) {
                    onZoom.end({
                        id: mainTag,
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
                    svg: com.gVor,
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
                if (isHorz && coords[1] > y0 + h0 - scroll_rec.w) {
                    isInScrollDrag = true
                }
                if (!isHorz && coords[0] > x0 + w0 - scroll_rec.w) {
                    isInScrollDrag = true
                }
            }

            if (isInScrollDrag) {
                if (isHorz) {
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
                if (isHorz) {
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
                let trans = isHorz ? -d3.event.dx : d3.event.dy
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
        com[tag_zoom + 'zoom_node'] = com.gVor.nodes()[0]
        com[tag_zoom + 'zoomed'] = com.gVor.append('g')

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
            com.gVor.call(com[tag_zoom]).on('dblclick.zoom', null)
        }
        else {
            com.gVor.on('.zoom', null)
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
        if (!locker.is_free(mainTag + 'zoom_scrollbarInit')) {
            return
        }

        locker.add({
            id: mainTag + 'zoom_scrollbarInit',
            override: true,
        })
        scrollBarRec = null

        // ------------------------------------------------------------------
        let nDone = 0
        let dataBck = hasBotTop ? [{
            id: 'zoom_scrollbar_bck',
            x: wh0,
        }] : []
        let recBck = com.gVor
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
            .attr('x', isHorz ? x0 : x0 + w0)
            .attr('y', isHorz ? y0 + h0 : y0)
            .attr('width', isHorz ? w0 : 0)
            .attr('height', isHorz ? 0 : h0)
            .on('click', function(d) {
                recBckClickOnce({
                    coords: d3.mouse(this),
                })
            })
            .call(com[tagDrag])
            .style('opacity', 1)
            .transition('in_out')
            .duration(times.anim)
            .attr('x', isHorz ? x0 : x0 + w0 - scroll_rec.w)
            .attr('y', isHorz ? y0 + h0 - scroll_rec.w : y0)
            .attr('width', isHorz ? w0 : scroll_rec.w)
            .attr('height', isHorz ? scroll_rec.w : h0)
            .on('end', function(d) {
                nDone += 1
            })

        recBck
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .attr('x', isHorz ? x0 : x0 + w0)
            .attr('y', isHorz ? y0 + h0 : y0)
            .attr('width', isHorz ? w0 : 0)
            .attr('height', isHorz ? 0 : h0)
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

                    scrollBarRec = com.gVor.selectAll('rect.' + tagScrollBar + 'scroll')
                    locker.remove({
                        id: mainTag + 'zoom_scrollbarInit',
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
                id: mainTag + 'zoom_scrollbarInit',
            })
        }
    }

    // ------------------------------------------------------------------
    function set_recScroll() {
        let marg = scroll_rec.w * scroll_rec.marg / 2
        let recLen = recs[mainTag].length
        let xy_min_max = wh0
        if (recLen > 0) {
            if (is_def(recs[mainTag][recLen - 1])) {
                xy_min_max
          = rec_wH
          + recs[mainTag][recLen - 1][xy]
          - recs[mainTag][0][xy]
          + 2 * rec_e
            }
        }
        scroll_rec.h = wh0 * (wh0 / xy_min_max)

        let dataScroll = hasBotTop ? [{
            id: 'zoom_scrollbarScroll',
        }] : []
        let recScroll = com.gVor
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
            .attr('x', isHorz ? x0 + marg : x0 + w0)
            .attr('y', isHorz ? y0 + h0 : y0 + marg)
            .attr('width', isHorz ? scroll_rec.h - marg * 2 : 0)
            .attr('height', isHorz ? 0 : scroll_rec.h - marg * 2)
            .attr('transform', zoom_scrollbarTrans)
            .merge(recScroll)
            .transition('in_out')
            .duration(times.anim)
            .attr('transform', zoom_scrollbarTrans)
            .attr('x', isHorz ? x0 + marg : x0 + w0 - scroll_rec.w + marg)
            .attr('y', isHorz ? y0 + h0 - scroll_rec.w + marg : y0 + marg)
            .attr('width', isHorz ? scroll_rec.h - marg * 2 : scroll_rec.w - marg * 2)
            .attr('height', isHorz ? scroll_rec.w - marg * 2 : scroll_rec.h - marg * 2)

        if (isHorz) {
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
    // let pos = recIn.xyFrac * wh0 - scroll_rec.h * 0.5;
    // pos = Math.max(0, Math.min(wh0- scroll_rec.h, pos));
    // // console.log('pos',recIn.xyFrac,pos);

        let pos = recIn.xyFrac * (wh0 - scroll_rec.h)
        if (isHorz) {
            return 'translate(' + pos + ',0)'
        }
        else {
            return 'translate(0,' + pos + ')'
        }
    }

    // ------------------------------------------------------------------
    run_loop.init({
        tag: mainTag + 'recBckClick',
        func: recBckClickOnce,
        n_keep: 1,
    })

    function recBckClick(data_in) {
        run_loop.push({
            tag: mainTag + 'recBckClick',
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

        // zooms.drag.frac = isHorz ? (data_in.coords[0] - zooms.xy0)/w0 : (data_in.coords[1] - zooms.xy0)/h0;
        zooms.drag.frac = isHorz
            ? (data_in.coords[0] - x0) / w0
            : (data_in.coords[1] - y0) / h0
        zooms.drag.frac = Math.min(1, Math.max(0, zooms.drag.frac))

        let trans = xyFracZoom(zooms.drag.frac)

        $.each(recs[mainTag], function(index, data_now) {
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
            svg: com.gVor,
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
        return recV
    }
    this.getRecV = getRecV

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update(opt_in) {
    // let recVin = is_def(opt_in.recV) ? opt_in.recV : recV;
        let recVin = recV
        if (is_def(opt_in.recV)) {
            recVin = opt_in.recV
            recV = recVin
        }
        // opt_in.recV = recVin;

        // reverse changes the order in-place, so first make a new copy with slice()
        if (isInvOrder) {
            recVin = recVin.slice().reverse()
        }

        let nRecIn = recVin.length
        let nRows0 = Math.min(nRows, nRecIn)
        let recVinLen = nRows0 <= 1 ? nRecIn : Math.ceil(nRecIn / nRows0 - 0.0001)
        let allRecLen = recVinLen * (rec_wH + rec_m) - rec_m
        hasBotTop = isHorz ? allRecLen > w0 : allRecLen > h0

        let xCent = x0
        let yCent = y0
        if (isHorz) {
            let h1 = hasBotTop ? h0 - scroll_rec.w : h0
            xCent += rec_e
            yCent += (h1 - (rec_h + (nRows0 - 1) * (rec_h + rec_m))) / 2
        }
        else {
            let w1 = hasBotTop ? w0 - scroll_rec.w : w0
            xCent += (w1 - (rec_w + (nRows0 - 1) * (rec_w + rec_m))) / 2
            yCent += rec_e
        }

        if (!hasBotTop) {
            if (isHorz) {
                xCent += (w0 - (allRecLen + 2 * rec_e)) / 2
            }
            else {
                yCent += (h0 - (allRecLen + 2 * rec_e)) / 2
            }
        }

        let xStep = rec_w + rec_m
        let yStep = rec_h + rec_m

        let index_shift = 0
        if (isInvOrder && nRecIn > nRows) {
            index_shift = (nRows0 - nRecIn % nRows0) % nRows0
        }
        // let index_shift = (isInvOrder && nRecIn > nRows) ? ((nRows0 - nRecIn % nRows0) % nRows0) : 0;

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        recs[mainTag] = []
        $.each(recVin, function(index, recNow) {
            let indexNow0 = index + index_shift
            let nRowNow0 = indexNow0 % nRows0
            let nColNow0 = Math.floor((indexNow0 - nRowNow0) / nRows0 + 0.00001)

            let nColNow = isHorz ? nColNow0 : nRowNow0
            let nRowNow = isHorz ? nRowNow0 : nColNow0

            let xNow = nColNow * xStep
            let yNow = nRowNow * yStep

            let data_now = {
            }
            data_now.scrollGridId = mainTag
            data_now.x = xCent + xNow
            data_now.y = yCent + yNow
            data_now.w = rec_w
            data_now.h = rec_h
            data_now.id = recNow.id
            data_now.data = recNow

            recs[mainTag].push(data_now)
        })

        // ------------------------------------------------------------------
        // correct for current zoom scrolling - match the position of the first rec in view
        // ------------------------------------------------------------------
        if (hasBotTop) {
            let trans = null
            let recLastI = recs[mainTag].length - 1

            $.each(recs[mainTag], function(index, recNow) {
                // get first element which was already in view
                if (!is_def(trans)) {
                    if (is_def(recIn.idV[recNow.id])) {
                        trans = recIn.idV[recNow.id] - recNow[xy]
                    }
                }
                // if inverted order, get the last element which was originally in view
                if (isInvOrder || recIn.isLastIn) {
                    if (is_def(recIn.idV[recNow.id])) {
                        trans = recIn.idV[recNow.id] - recNow[xy]
                    }
                }
            })

            if (recs[mainTag][0][xy] + trans > zooms.xy0) {
                if (recs[mainTag][0][xy] < zooms.xy0) {
                    trans = zooms.xy0 - recs[mainTag][0][xy]
                }
                else {
                    trans = null
                }
            }
            else if (recs[mainTag][recLastI][xy] + trans < zooms.xy1) {
                if (recs[mainTag][recLastI][xy] > zooms.xy1) {
                    trans = zooms.xy1 - recs[mainTag][recLastI][xy]
                }
                else {
                    trans = null
                }
            }

            if (is_def(trans)) {
                $.each(recs[mainTag], function(index, data_now) {
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
        //     min_max:'min', data:recs[mainTag], func: xy
        //   });
        //   let xy_max = min_max_obj({
        //     min_max:'max', data:recs[mainTag],
        //     func: isHorz ? function(d,i) { return d.x+d.w; } : function(d,i) { return d.y+d.h; }
        //   });
        //   outFrac = (xy_max - xy_min) / ( isHorz?w0:h0 );
        // }
        // zooms.delta = (isHorz ? 1 : -1) * rec_wH * 0.1 * outFrac;

        // ------------------------------------------------------------------
        // activate/disable the zoom behaviour after updating hasBotTop
        // ------------------------------------------------------------------
        setZoomStatus()

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function onZoomEnd() {
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
            func_end: onZoomEnd,
            svg: com.gVor,
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
    let clipPath = defs.append('clipPath').attr('id', tagClipPath + mainTag)

    com.clipRec = clipPath
        .append('rect')
        .attr('x', x0)
        .attr('y', y0)
        .attr('width', w0)
        .attr('height', h0)

    if (autoClipPath) {
        com.gBckData.attr('clip-path', 'url(#' + tagClipPath + mainTag + ')')
        com.gFrntData.attr('clip-path', 'url(#' + tagClipPath + mainTag + ')')
    }

    let frnt = bckRecOpt.frontProp
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

    com.gBack
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
            return i === 0 ? (hasFrnt('strkWOcp') ? frnt.strkWOcp : 1) : 0
        })
        .attr('fill', function(d, i) {
            return i === 0 ? '#F2F2F2' : hasFrnt('fill') ? frnt.fill : '#383B42'
        })
        .attr('fill-opacity', function(d, i) {
            return i === 0 ? 1 : hasFrnt('fillOcp') ? frnt.fillOcp : 0.025
        })
    // .attr("transform", "translate("+(x0)+","+(y0)+")")
    // .style("pointer-events", "none")

    if (is_def(bckRecOpt.bck_pattern)) {
        bck_pattern(bckRecOpt.bck_pattern)
    }
    else if (is_def(bckRecOpt.texture_orient) || is_def(bckRecOpt.circ_type)) {
        let bckPatOpt = {
            com: com,
            g_now: com.gBack,
            g_tag: gName,
            len_wh: [ w0, h0 ],
            trans: [ x0, y0 ],
            opac: is_def(bckRecOpt.textureOpac) ? bckRecOpt.textureOpac : 0.06,
        }

        $.each([ 'texture_orient', 'circ_type', 'size' ], function(index, optType) {
            if (is_def(bckRecOpt[optType])) {
                bckPatOpt[optType] = bckRecOpt[optType]
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
//   com.gBckData = com.g_base.append('g')
//   com.gVor = com.g_base.append('g')

//   let sbD = {}
//   let x0 = 120
//   let y0 = 120
//   let w0 = 400
//   let h0 = 100
//   let myId = 'myScrollBox'
//   let tagClipPath = 'myScrollBoxPath'

//   let scrollGridOpt = {
//     // unique id for a given box
//     id: myId,
//     // the group elements (vor in front of data)
//     g: { gBckData: com.gBckData, gVor: com.gVor },
//     // the id of the clip-path element corresponding to the geometry of the box
//     tagClipPath: tagClipPath,
//     // if to aplly automatic clip-path to the entire data-g
//     autoClipPath: true,
//     // dictionary which will be filled with the results
//     recs: sbD,
//     // list of data (can be updated later)
//     recV: [],
//     // dimensions of the box
//     x0: x0,
//     y0: y0,
//     w0: w0,
//     h0: h0,
//     // dimentions of data elements inside the box
//     rec_h: h0 * 0.5,
//     rec_w: h0 * 0.5,
//     // boolean to show the number of overflow data elements
//     showCounts: false,
//     // horizonthal/vertical geometry of the box
//     isHorz: true,
//     // properties of the background
//     bckRecOpt: { texture_orient: '5/8', frontProp: { strkWOcp: 0.2 } },
//     // options for the voronoii grid
//     vorOpt: { click: onVorClick },
//     // options for the zooming/scrolling
//     onZoom: { during: onZoomDuring, end: onZoomDuring },
//     // the global let of the queue loop
//     run_loop: run_loop,
//     // the global let for the locking variable
//     locker: locker
//   }

//   com.scrollGrid = new window.ScrollGrid(scrollGridOpt)

//   let recVnow = [
//     { id: 'data0', data: { name: 'xxx', number: 10 } },
//     { id: 'data1', data: { name: 'yyy', number: 9 } },
//     { id: 'data2', data: { name: 'zzz', number: 98 } },
//     { id: 'data3', data: { name: 'eee', number: 1 } },
//     { id: 'data4', data: { name: 'yyy', number: 83 } },
//     { id: 'data5', data: { name: 'dgd', number: 14 } },
//     { id: 'data6', data: { name: '344', number: 18 } },
//     { id: 'data7', data: { name: 'opi', number: 44 } }
//   ]
//   com.scrollGrid.update({ recV: recVnow })

//   // console.log(sbD[myId]);
//   let rect = com.gBckData
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
//     // .attr("clip-path", function(d){ return "url(#"+tagClipPath+d.scrollGridId+")"; })
//     .transition('new_ele')
//     .duration(times.anim)
//     .style('opacity', 1)

//   // ------------------------------------------------------------------
//   //
//   // ------------------------------------------------------------------
//   function onZoomDuring (opt_in) {
//     let xy = opt_in.xy
//     let rect = com.gBckData.selectAll('rect.' + 'myScrollBoxRecs')
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
