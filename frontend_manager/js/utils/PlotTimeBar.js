// ------------------------------------------------------------------
//
// ------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global cols_mix */
/* global deep_copy */

window.PlotTimeBar = function() {
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

    function initAxis(opt_in) {
        if (!is_def(opt_in.showTopAxis)) {
            opt_in.showTopAxis = true
        }
        if (!is_def(opt_in.showBottomAxis)) {
            opt_in.showTopAxis = true
        }
        if (!is_def(opt_in.topAxisOrientation)) {
            opt_in.topAxisOrientation = 'top'
        }
        if (!is_def(opt_in.bottomAxisOrientation)) {
            opt_in.bottomAxisOrientation = 'bottom'
        }

        com.top = {
        }
        com.top.axis = {
        }
        com.top.scale = {
        }
        com.top.g = {
        }
        com.top.g.axis = com.g_box.append('g')

        com.bot = {
        }
        com.bot.axis = {
        }
        com.bot.scale = {
        }
        com.bot.g = {
        }
        com.bot.g.axis = com.g_box.append('g')

        com.top.box = {
            x: com.innerBox.x,
            y: 0.2 * com.innerBox.h,
            w: com.innerBox.w,
            h: com.innerBox.h * 0.1,
            margWidth: com.innerBox.margWidth,
            margHeight: com.innerBox.margHeight,
        }

        com.bot.box = {
            x: com.top.box.x,
            y: com.innerBox.h * 0.8,
            w: com.top.box.w,
            h: com.innerBox.h * 0.6,
            margWidth: com.innerBox.margWidth,
            margHeight: com.innerBox.margHeight,
        }

        com.top.axis.transX
      = 'translate(' + com.top.box.x + ',' + com.top.box.y + ')'
        com.bot.axis.transX
      = 'translate(' + com.bot.box.x + ',' + com.bot.box.y + ')'

        com.top.scale.x = d3.scaleTime().range([ 0, com.top.box.w ])
        com.top.scale.y = d3.scaleLinear().range([ com.bot.box.h, 0 ])

        com.bot.scale.x = d3.scaleTime().range([ 0, com.bot.box.w ])

        com.bot.scale.y = d3.scaleLinear().range([ 0, com.bot.box.h ])
        com.bot.scale.y.domain([ 105, 0 ])

        com.top.axis.x = d3.axisTop(com.top.scale.x)
        if (opt_in.topAxisOrientation === 'bottom') {
            com.top.axis.x = d3.axisBottom(com.top.scale.x)
        }
        com.bot.axis.x = d3.axisBottom(com.bot.scale.x)
        // com.bot.axis.y = d3.axisLeft(com.top.scale.y)
        if (opt_in.showTopAxis) {
            com.top.g.axis
                .append('g')
                .attr('class', 'axisX')
                .attr('transform', com.top.axis.transX)
                .call(com.top.axis.x)
        }
        if (opt_in.showBottomAxis) {
            com.bot.g.axis
                .append('g')
                .attr('class', 'axisX')
                .attr('transform', com.bot.axis.transX)
                .call(com.bot.axis.x)
        }
    // com.top.g.axis
    //   .append('g')
    //   .attr('class', 'axisY')
    //   .attr('transform', com.top.axis.transX)
    //   .call(com.bot.axis.y)
    }
    function initMiddle(opt_in) {
        com.parse = {
        }
        com.parse.x = d3.timeParse('%Q')
        com.parse.y = function(d) {
            return +d
        }

        com.middle = {
        }
        com.middle.range = com.bot.scale.x.range()
        com.middle.box = {
            x: com.bot.box.x,
            y: com.top.box.y,
            w: com.bot.box.w,
            h: com.innerBox.h * 0.6,
        }

        com.top.g.data = com.g_box.append('g')
        com.bot.g.data = com.g_box.append('g')
        com.bot.g.brush = com.bot.g.data.append('g')

        // comment data 1
        // com.top.g.data.attr(
        //   'transform',
        //   'translate(' + com.top.box.x + ',' + com.top.box.y + ')'
        // )

        com.bot.g.data.attr(
            'transform',
            'translate(' + com.middle.box.x + ',' + com.middle.box.y + ')'
        )

        com.top.domain = null

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.tag_clip_path = opt_in.tag_clip_path

        // comment data 2
        if (!is_def(com.tag_clip_path)) {
            com.tag_clip_path = {
                top: com.main_tag + 'clipPathTop',
                bot: com.main_tag + 'clipPathBot',
            }
        }

        let topBot = com.bot

        topBot.defs = topBot.g.data.append('defs')
        topBot.clip_path = topBot.defs
            .append('clipPath')
            .attr('id', com.tag_clip_path.top)

        console.log(topBot.box)
        topBot.clipRec = topBot.clip_path
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', com.middle.box.w)
            .attr('height', com.middle.box.h)
        topBot.g.data.attr('clip-path', 'url(#' + com.tag_clip_path.top + ')')
    }
    function init(opt_in) {
        if (is_def(com.main_tag)) {
            console.error('trying to init more than once ...', opt_in)
            return
        }

        com.main_tag = opt_in.tag
        com.locker = opt_in.locker
        com.run_loop = opt_in.run_loop

        let lock_zoom = opt_in.lock_zoom
        if (!is_def(lock_zoom)) {
            lock_zoom = {
                all: com.main_tag + 'zoom',
                during: com.main_tag + 'zoom_during',
                end: com.main_tag + 'zoom_end',
            }
        }
        com.lock_zoom = lock_zoom

        let lockers = {
        }
        lockers.lockers = is_def(opt_in.lockers) ? opt_in.lockers : []
        lockers.zoom_during = lockers.lockers.slice().concat([ lock_zoom.during ])
        lockers.zoom_end = lockers.lockers.slice().concat([ lock_zoom.end ])
        com.lockers = lockers

        com.yAxisMarginFrac = is_def(opt_in.yAxisMarginFrac)
            ? opt_in.yAxisMarginFrac
            : 0.5

        com.forceUpdate = is_def(opt_in.forceUpdate) ? opt_in.forceUpdate : false

        set_style(opt_in.style)
        com.plotTimeSeries = []
        com.g_box = opt_in.g_box
        com.outer_box = deep_copy(opt_in.box_data)
        com.outer_box.x = 0
        com.outer_box.y = 0
        com.innerBox = {
            x: com.outer_box.x,
            y: com.outer_box.y,
            w: com.outer_box.w,
            h: com.outer_box.h,
            margWidth: com.outer_box.margWidth,
            margHeight: com.outer_box.margHeight,
        }
        com.boxTrans = {
            x: opt_in.box_data.x,
            y: opt_in.box_data.y,
            k: 1,
        }
        transScaleBox()

        // ------------------------------------------------------------------
        // box definition
        // ------------------------------------------------------------------

        com.hasBot = true
        initAxis(opt_in)
        initMiddle(opt_in)

        setupZoomBrush()
    }
    this.init = init

    function plugPlotTimeSeries(plotTimeSeries) {
        com.plotTimeSeries.push(plotTimeSeries)
    }
    this.plugPlotTimeSeries = plugPlotTimeSeries
    function unplugPlotTimeSeries() {}
    this.unplugPlotTimeSeries = unplugPlotTimeSeries
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

        com.style.hasOutline = is_def(opt_in.hasOutline) ? opt_in.hasOutline : false
    }
    this.set_style = set_style
    function transScaleBox(opt_in) {
        let duration = 0
        if (is_def(opt_in)) {
            if (is_def(opt_in.x)) {
                duration = times.anim
                com.boxTrans.x = opt_in.x
            }
            if (is_def(opt_in.y)) {
                duration = times.anim
                com.boxTrans.y = opt_in.y
            }
            if (is_def(opt_in.k)) {
                duration = times.anim
                com.boxTrans.k = opt_in.k
            }
            if (is_def(opt_in.duration)) {
                duration = opt_in.duration
            }
        }

        let trans
      = 'translate('
      + com.boxTrans.x
      + ','
      + com.boxTrans.y
      + ')scale('
      + com.boxTrans.k
      + ')'

        if (duration > 0) {
            com.g_box
                .transition('moveBox')
                .duration(duration)
                .attr('transform', trans)
        }
        else {
            com.g_box.attr('transform', trans)
        }
    }
    this.transScaleBox = transScaleBox

    // function updateTopAxis (data_in) {
    //   com.top.g.axis
    //     .selectAll('.axisX')
    //     .transition('in_out')
    //     .duration(times.anim)
    //     .call(com.top.axis.x)
    // }
    function updateTopAxis(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }
        com.top.g.axis.selectAll('.axisX').call(com.top.axis.x)
        opt_in.topScaleX = com.top.scale.x

        for (var i = 0; i < com.plotTimeSeries.length; i++) {
            com.plotTimeSeries[i].updateAxisPlot(opt_in)
        }
    }
    function updateBottomAxis(data_in) {
        com.bot.g.axis
            .selectAll('.axisX')
            .transition('in_out')
            .duration(times.anim)
            .call(com.bot.axis.x)
    }
    function updateBrushPosition() {
        com.bot.g.brush
            .transition('in_out')
            .duration(times.anim)
            .call(com.bot.brush.move, com.middle.range)
    }
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    // com.updateupdateupdate=0;
    function updateLine(data_in) {
        updateCirc(data_in)
        updateBrushPosition()
    }
    this.updateLine = updateLine

    function updateBottomAxisDomain(data) {
    // Update Bottom Axis according to Data
        com.bot.scale.x.domain(
            d3.extent(data, function(d) {
                return d.x
            })
        )
        updateBottomAxis()
        if (com.top.domain) {
            let thisDom = com.bot.scale.x.domain()
            let prevDom = [ com.top.domain[0], com.top.domain[1] ]
            let thisDelta = thisDom[1] - thisDom[0]
            let prevDelta = prevDom[1] - prevDom[0]

            prevDom[0] = Math.max(prevDom[0], thisDom[0])
            prevDom[1] = prevDom[0] + prevDelta
            prevDom[1] = Math.min(prevDom[1], thisDom[1])
            prevDom = [ com.parse.x(prevDom[0]), com.parse.x(prevDom[1]) ]

            com.middle.range = [
                com.top.box.w * (prevDom[0] - thisDom[0]) / thisDelta,
                com.top.box.w * (prevDom[1] - thisDom[0]) / thisDelta,
            ]
            com.top.domain = prevDom
            com.top.scale.x.domain(prevDom)
        }
        else {
            com.middle.range = com.bot.scale.x.range()
            com.top.scale.x.domain(com.bot.scale.x.domain())
        }
        updateTopAxis()
    }
    this.updateBottomAxisDomain = updateBottomAxisDomain

    function updateCirc(data_in) {
        let data = data_in.data
        let tag = data_in.tag

        let lineData = []
        $.each(data, function(i, d) {
            if (i === data.length - 1) {
                return
            }

            let d0 = data[i]
            let d1 = data[i + 1]
            lineData.push({
                id: d0.id + d1.id,
                x1: d0.x,
                y1: d0.y,
                x2: d1.x,
                y2: d1.y,
            })
        })

        com.lineClass = tag + 'line'
        let line = com.bot.g.data
            .selectAll('line.' + com.lineClass)
            .data(lineData, function(d) {
                return d.id
            })
        line
            .enter()
            .append('line')
            .attr('class', com.lineClass)
            .attr('stroke-opacity', 0)
            .attr('x1', function(d, i) {
                return com.bot.scale.x(d.x1)
            })
            .attr('x2', function(d, i) {
                return com.bot.scale.x(d.x2)
            })
            .attr('y1', function(d, i) {
                return com.bot.scale.y(d.y1)
            })
            .attr('y2', function(d, i) {
                return com.bot.scale.y(d.y2)
            })
            .style('stroke-width', 1)
            .style('pointer-events', 'none')
            .style('vector-effect', 'non-scaling-stroke')
        // .style("stroke-dasharray",  "5,1")
            .attr('stroke', '#000099')
            .merge(line)
            .transition('in_out')
            .duration(times.anim)
            .attr('stroke-opacity', 0.5)
            .attr('x1', function(d, i) {
                return com.bot.scale.x(d.x1)
            })
            .attr('x2', function(d, i) {
                return com.bot.scale.x(d.x2)
            })
            .attr('y1', function(d, i) {
                return com.bot.scale.y(d.y1)
            })
            .attr('y2', function(d, i) {
                return com.bot.scale.y(d.y2)
            })

        line
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .attr('stroke-opacity', 0)
            .remove()

        let nTopBot = 1
        if (!is_def(com.circClass)) {
            com.circClass = {
            }
        }
        com.circClass[nTopBot] = com.main_tag + 'circ' + nTopBot

    // let circ = topBot.g.data
    //   .selectAll('circle.' + com.circClass[nTopBot])
    //   .data(data, function (d) {
    //     return d.id
    //   })
    //
    // circ
    //   .enter()
    //   .append('circle')
    //   .attr('class', com.circClass[nTopBot])
    //   .style('opacity', 0)
    //   .attr('stroke-opacity', 1)
    //   .style('fill-opacity', 0.7)
    //   .attr('vector-effect', 'non-scaling-stroke')
    //   .attr('cx', function (d) {
    //     return topBot.scale.x(d.x)
    //   })
    //   .attr('cy', function (d) {
    //     return topBot.scale.y(d.y)
    //   })
    //   .attr('r', 2)
    //   .attr('fill', cols_mix[nTopBot])
    //   .attr('pointer-events', pointerEvents)
    //   .merge(circ)
    //   .transition('in_out')
    //   .duration(times.anim)
    //   .style('opacity', 1)
    //   .attr('cx', function (d) {
    //     return topBot.scale.x(d.x)
    //   })
    //   .attr('cy', function (d) {
    //     return topBot.scale.y(d.y)
    //   })
    //
    // circ
    //   .exit()
    //   .transition('in_out')
    //   .duration(times.anim)
    //   .style('opacity', 0)
    //   .remove()
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setupZoomBrush() {
        let locker = com.locker
        let lockers = com.lockers
        let lock_zoom = com.lock_zoom

        function init_zoomBrush() {
            com.zoom = {
            }
            com.zoom.sel = {
            }
            com.zoom.trans = {
            }

            com.zoom.zoom = d3
                .zoom()
                .scaleExtent([ 1, Infinity ])
                .translateExtent([ [ 0, 0 ], [ com.top.box.w, com.top.box.h ] ])
                .extent([ [ 0, 0 ], [ com.top.box.w, com.top.box.h ] ])

            com.zoom.zoom
                .on('start', function(e, d) {
                    com.zoom_start(e, this)
                })
                .on('zoom', function(e, d) {
                    com.zoom_during(e, this)
                })
                .on('end', function(e, d) {
                    com.zoom_end(e, this)
                })

            com.g_box.on('wheel', function(event) {
                event.preventDefault()
            })

            com.bot.brush = d3
                .brushX()
                .extent([ [ 0, 0 ], [ com.bot.box.w, com.bot.box.h ] ])

            com.bot.brush
                .on('start', com.brushStart)
                .on('brush', com.brushDuring)
                .on('end', com.brushEnd)

            com.brushClass = com.main_tag + 'brush'
            com.bot.g.brush
                .attr('class', com.brushClass)
                .call(com.bot.brush)
                .call(com.zoom.zoom)

            com.zoom.sel[com.brushClass] = function() {
                return com.bot.g.brush
            }
        }

        com.zoom_start = function(e, ele) {
            com.isInZoom = true
        }
        com.zoom_during = function(e, ele) {
            if (e.sourceEvent && e.sourceEvent.type === 'brush') {
                return
            } // ignore zoom-by-brush

            com.in_user_zoom = is_def(e.sourceEvent)

            if (locker.are_free(lockers.zoom_during)) {
                locker.add({
                    id: lock_zoom.all,
                    override: true,
                })
                locker.add({
                    id: lock_zoom.during,
                    override: true,
                })

                // Update top Axis
                let trans = e.transform
                com.top.domain = trans.rescaleX(com.bot.scale.x).domain()
                com.top.scale.x.domain(com.top.domain)
                updateTopAxis()

                // Update Grey Brush Position and Size
                com.bot.g.brush.call(
                    com.bot.brush.move,
                    com.top.scale.x.range().map(trans.invertX, trans)
                )

                locker.remove({
                    id: lock_zoom.during,
                })
            }
        }
        com.zoom_end = function(e, ele) {
            if (e.sourceEvent && e.sourceEvent.type === 'brush') {
                return
            } // ignore zoom-by-brush

            // let trans = e.transform
            // let srcClass = d3.select(ele).attr('class')
            //
            // com.zoom.trans[srcClass] = trans

            // check if we are zoomed out (full range shown)
            if (com.top.domain) {
                let is_same0 = com.top.domain[0] - com.bot.scale.x.domain()[0] <= 0
                let is_same1 = com.top.domain[1] - com.bot.scale.x.domain()[1] >= 0
                if (is_same0 && is_same1) {
                    com.top.domain = null
                }
            }
            updateTopAxis()
            com.isInZoom = false
            locker.remove({
                id: lock_zoom.all,
                override: true,
                delay: times.anim,
            })

            // let sel = Object.keys(com.zoom.sel).filter(function (d) {
            //   return com.zoom.trans[d] !== trans
            // })

            // doDomainTrans({ trans: trans, sel: sel })
        }

        com.brushStart = function(e) {
            com.isInBrush = true
        }
        com.brushDuring = function(e) {
            if (e.sourceEvent && e.sourceEvent.type === 'zoom') {
                return
            } // ignore brush-by-zoom
            // console.log('brushDuring');

            if (locker.are_free(lockers.zoom_during)) {
                locker.add({
                    id: lock_zoom.all,
                    override: true,
                })
                locker.add({
                    id: lock_zoom.during,
                    override: true,
                })

                if (e.sourceEvent) {
                    let s = e.selection || com.bot.scale.x.range()

                    // Update Top Axis
                    com.top.scale.x.domain(s.map(com.bot.scale.x.invert, com.bot.scale.x))
                    com.top.domain = com.top.scale.x.domain()
                    updateTopAxis()

                    // Keep Track of brush position to prevent jump when zoom
                    let k = com.top.box.w / (s[1] - s[0])
                    let x = -s[0]
                    let t = d3.zoomIdentity.scale(k).translate(x, 0)
                    $.each(com.zoom.sel, function(selName, selFunc) {
                        selFunc().call(com.zoom.zoom.transform, t)
                    })
                }

                locker.remove({
                    id: lock_zoom.during,
                })
            }
        }
        com.brushEnd = function(e) {
            if (e.sourceEvent && e.sourceEvent.type === 'zoom') {
                return
            } // ignore brush-by-zoom

            // check if we are zoomed out (full range shown)
            if (com.top.domain) {
                let is_same0 = com.top.domain[0] - com.bot.scale.x.domain()[0] <= 0
                let is_same1 = com.top.domain[1] - com.bot.scale.x.domain()[1] >= 0
                if (is_same0 && is_same1) {
                    com.top.domain = null
                }
            }
            updateTopAxis()

            com.isInBrush = false
            locker.remove({
                id: lock_zoom.all,
                override: true,
                delay: times.anim,
            })
        }

        init_zoomBrush()
    }
    // function doDomainTrans (opt_in) {
    //   for (var i = 0; i < com.plotTimeSeries.length; i++) {
    //     com.plotTimeSeries[i].doDomainTrans(opt_in)
    //   }
    // }
}
