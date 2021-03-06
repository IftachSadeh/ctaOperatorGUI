// ------------------------------------------------------------------
//
// ------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global cols_mix */
/* global deep_copy */
/* global PlotTimeBar */

window.PlotTimeSeries = function() {
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
        com.locker = opt_in.locker
        com.run_loop = opt_in.run_loop
        com.hasBotPlot = !opt_in.hasBotPlot
        com.updateDomainY = opt_in.updateDomainY
        com.overviewLine = opt_in.overviewLine

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

        // ------------------------------------------------------------------
        // box definition
        // ------------------------------------------------------------------
        com.outer_box = deep_copy(opt_in.box_data)
        com.boxTrans = {
            x: opt_in.box_data.x,
            y: opt_in.box_data.y,
            k: 1,
        }
        com.g_box = opt_in.g_box
        transScaleBox()
        com.innerBox = com.outer_box
        com.innerBox.x = 0
        com.innerBox.y = 0

        com.bck = {
        }
        com.bck.g = com.g_box.append('g')

        com.top = {
        }
        com.top.scale = {
        }
        com.top.axis = {
        }
        com.bot = {
        }
        com.timeBar = []

        if (!opt_in.hasBotPlot) {
            com.top.box = com.innerBox
            com.bot = null
        }
        else {
            com.top.box = {
                x: com.innerBox.x,
                y: com.innerBox.y,
                w: com.innerBox.w,
                h: com.innerBox.h * 0.6 + com.innerBox.h * 0.4 * 0.2,
            }
            com.bot.box = {
                x: com.innerBox.x,
                y: com.innerBox.y + com.innerBox.h * 0.6,
                w: com.innerBox.w,
                h: com.innerBox.h * 0.4,
            }
        }
        console.log(com.top)

        com.top.axis.transX
      = 'translate(' + com.top.box.x + ',' + (com.top.box.y + com.top.box.h) + ')'
        com.top.axis.transY
      = 'translate(' + com.top.box.x + ',' + com.top.box.y + ')'

        com.top.g = {
        }
        com.top.g.axis = com.g_box.append('g')
        com.top.g.data = com.g_box.append('g')
        com.top.g.data.attr(
            'transform',
            'translate(' + com.top.box.x + ',' + com.top.box.y + ')'
        )
        com.top.domain = null

        com.parse = {
        }
        com.parse.x = d3.timeParse('%Q')
        com.parse.y = function(d) {
            return +d
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.tag_clip_path = opt_in.tag_clip_path
        if (!is_def(com.tag_clip_path)) {
            com.tag_clip_path = {
                top: com.main_tag + 'clipPathTop',
                bot: com.main_tag + 'clipPathBot',
            }
        }
        let topBot = com.top
        topBot.defs = topBot.g.data.append('defs')
        topBot.clip_path = topBot.defs
            .append('clipPath')
            .attr('id', com.tag_clip_path.top)
        topBot.clipRec = topBot.clip_path
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', topBot.box.w)
            .attr('height', topBot.box.h)
        topBot.g.data.attr('clip-path', 'url(#' + com.tag_clip_path.top + ')')

        set_style(opt_in.style)
        initPlot(opt_in)

        if (opt_in.hasBotPlot) {
            let newTimeBar = new PlotTimeBar()
            let tagPlot = 'internalTimeBar' + opt_in.tag
            newTimeBar.init({
                tag: opt_in.tag,
                g_box: com.g_box.append('g'),
                hasBotPlot: true,
                isPartofPlot: true,
                style: {
                    hasOutline: true,
                },
                box_data: com.bot.box,
                locker: com.locker,
                lockers: [ tagPlot + 'update_data' ],
                lock_zoom: {
                    all: tagPlot + 'zoom',
                    during: tagPlot + 'zoom_during',
                    end: tagPlot + 'zoom_end',
                },
                run_loop: null,
            })
            com.timeBar.push(newTimeBar)
        }
    }
    this.init = init

    function unplugPlotTimeBar(PlotTimeBar) {
        PlotTimeBar.unplugPlotTimeSeries()
    }
    this.unplugPlotTimeBar = unplugPlotTimeBar
    function plugPlotTimeBar(PlotTimeBar) {
        com.timeBar.push(PlotTimeBar)
        PlotTimeBar.plugPlotTimeSeries(this)
    }
    this.plugPlotTimeBar = plugPlotTimeBar

    function set_style(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        com.style = {
        }

        com.style.hasOutline = is_def(opt_in.hasOutline) ? opt_in.hasOutline : false
        com.style.bckColor = is_def(opt_in.bckColor) ? opt_in.bckColor : '#F2F2F2'
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
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function initPlot(opt_in) {
        com.top.scale.x = d3.scaleTime().range([ 0, com.top.box.w ])
        com.top.scale.y = d3.scaleLinear().range([ com.top.box.h, 0 ])

        if (!opt_in.hasBotPlot) {
            com.top.axis.x = d3.axisBottom(com.top.scale.x)
            com.top.g.axis
                .append('g')
                .attr('class', 'axisX')
                .attr('transform', com.top.axis.transX)
                .call(com.top.axis.x)
        }
        com.top.axis.y = d3.axisLeft(com.top.scale.y)
        com.top.g.axis
            .append('g')
            .attr('class', 'axisY')
            .attr('transform', com.top.axis.transY)
            .call(com.top.axis.y)
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    // com.updateupdateupdate=0;
    function update(data_in) {
        let data = data_in.map(function(d) {
            return {
                id: d.x,
                x: com.parse.x(d.x),
                y: com.parse.y(d.y),
            }
        })
        data.sort(function(a, b) {
            return a.x - b.x
        })

        let dataIds = data.map(function(d) {
            return d.id
        })
        if (is_def(com.dataIds) && !com.forceUpdate) {
            if (com.dataIds.length === dataIds.length) {
                let hasNewData = false
                $.each(dataIds, function(i, id) {
                    if (com.dataIds[i] !== id) {
                        hasNewData = true
                    }
                })
                if (!hasNewData) {
                    return
                }
            }
        }
        com.data = data
        com.dataIds = dataIds

        for (var i = 0; i < com.timeBar.length; i++) {
            // probably need to modify
            com.timeBar[i].updateBottomAxisDomain(com.data)
            if (com.overviewLine) {
                com.timeBar[i].updateLine({
                    data: com.data,
                    tag: com.main_tag,
                })
            }
        }
    }
    this.update = update

    function updateAxisPlot(opt_in) {
        let data = is_def(opt_in.data) ? opt_in.data : com.data
        if (!data) {
            return
        }

        com.top.scale.x.domain(opt_in.topScaleX.domain())
        updateDomainY()

        com.top.g.axis.selectAll('.axisX').call(com.top.axis.x)
        com.top.g.axis
            .selectAll('.axisY')
            .transition('in_out')
            .duration(times.anim)
            .call(com.top.axis.y)

        updateCirc({
            data: com.data,
        })
    }
    this.updateAxisPlot = updateAxisPlot

    function updateCirc(opt_in) {
        let data = opt_in.data

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

        com.lineClass = com.main_tag + 'line'
        let line = com.top.g.data
            .selectAll('line.' + com.lineClass)
            .data(lineData, function(d) {
                return d.id
            })

        line
            .enter()
            .append('line')
            .attr('class', com.lineClass)
            .attr('stroke-opacity', 0.5)
            .attr('x1', function(d, i) {
                return com.top.scale.x(d.x1)
            })
            .attr('x2', function(d, i) {
                return com.top.scale.x(d.x2)
            })
            .attr('y1', function(d, i) {
                return com.top.scale.y(d.y1)
            })
            .attr('y2', function(d, i) {
                return com.top.scale.y(d.y2)
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
                return com.top.scale.x(d.x1)
            })
            .attr('x2', function(d, i) {
                return com.top.scale.x(d.x2)
            })
            .attr('y1', function(d, i) {
                return com.top.scale.y(d.y1)
            })
            .attr('y2', function(d, i) {
                return com.top.scale.y(d.y2)
            })

        line
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .attr('stroke-opacity', 0)
            .remove()

        $.each([ false ], function(nTopBot, isBot) {
            if (!com.hasBot && isBot) {
                return
            }
            let topBot = isBot ? com.bot : com.top
            // let pointerEvents = isBot ? 'none'   : 'auto';
            let pointerEvents = 'none'

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
            // circ
            //   .enter()
            //   .append('circle')
            //   .attr('class', com.circClass[nTopBot])
            //   .style('opacity', 0)
            //   .attr('stroke-opacity', 1)
            //   .style('fill-opacity', 0.7)
            //   .attr('vector-effect', 'non-scaling-stroke')
            //   .attr('cx', function (d) {
            //     return com.top.scale.x(d.x)
            //   })
            //   .attr('cy', function (d) {
            //     return com.top.scale.y(d.y)
            //   })
            //   .attr('r', 2)
            //   .attr('fill', cols_mix[nTopBot])
            //   // .attr("stroke-width", com.style.strokeWidth)
            //   // .attr("fill", function(d,i) { return
            //   // com.style.fill(d,d.data.n_block); }) .attr("stroke", function(d,i) {
            //   // return com.style.stroke(d,d.data.n_block); })
            //   // .attr("stroke-opacity", com.style.strokeOpacity)
            //   .attr('pointer-events', pointerEvents)
            //   // .call(com.zoom.zoom)
            //   // .on('click', com.style.click)
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
        })
    }
    function updateDomainY(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        let data = is_def(opt_in.data) ? opt_in.data : com.data
        let domain = is_def(opt_in.domain) ? opt_in.domain : com.top.scale.x.domain()

        let data_inDom = data
        data_inDom = data_inDom.filter(function(d) {
            return d.x >= domain[0] && d.x <= domain[1]
        })
        data_inDom = data_inDom.map(function(d) {
            return d.y
        })
        let y_min_max = [ d3.min(data_inDom), d3.max(data_inDom) ]
        let deltaY = com.yAxisMarginFrac * (y_min_max[1] - y_min_max[0])
        if (y_min_max[1] === y_min_max[0]) {
            if (y_min_max[0] === 0) {
                deltaY = 1
            }
            else {
                deltaY = com.yAxisMarginFrac * y_min_max[0]
            }
        }
        // y_min_max = [y_min_max[0] - deltaY, y_min_max[1] + deltaY]
        if (!com.updateDomainY) {
            y_min_max = [ 0, 100.5 ]
        }
        else {
            y_min_max = [ y_min_max[0] - deltaY, y_min_max[1] + deltaY ]
        }
        com.top.scale.y.domain(y_min_max)
        com.top.g.axis
            .selectAll('.axisY')
            .transition('in_out')
            .duration(times.anim)
            .call(com.top.axis.y)
    }

    function onScaleUpdate(opt_in) {
        com.top.scale.x.domain(opt_in.topScaleX.domain())

        if (!opt_in.hasBotPlot) {
            com.top.axis.x = d3.axisBottom(com.top.scale.x)
        }

        if (!is_def(opt_in)) {
            opt_in = {
            }
        }
        let doY = opt_in.doY
        $.each([ false, true ], function(nTopBot, isBot) {
            if (!com.hasBot && isBot) {
                return
            }
            let topBot = isBot ? com.bot : com.top

            let circ = topBot.g.data.selectAll('circle.' + com.circClass[nTopBot])
            circ.attr('cx', function(d) {
                return topBot.scale.x(d.x)
            })

            if (doY) {
                circ
                    .transition('in_out')
                    .duration(times.anim / 2)
                    .attr('cy', function(d) {
                        return topBot.scale.y(d.y)
                    })
            }
        })

        let line = com.top.g.data.selectAll('line.' + com.lineClass)
        line
            .attr('x1', function(d, i) {
                return com.top.scale.x(d.x1)
            })
            .attr('x2', function(d, i) {
                return com.top.scale.x(d.x2)
            })

        if (doY) {
            line
                .transition('in_out')
                .duration(times.anim / 2)
                .attr('y1', function(d, i) {
                    return com.top.scale.y(d.y1)
                })
                .attr('y2', function(d, i) {
                    return com.top.scale.y(d.y2)
                })
        }
        com.top.g.axis.selectAll('.axisX').call(com.top.axis.x)
    }
    this.onScaleUpdate = onScaleUpdate

    function doDomainTrans(opt_in) {
        let trans = opt_in.trans
        let selV = is_def(opt_in.sel) ? opt_in.sel : Object.keys(com.zoom.sel)
        if (selV.length === 0) {
            return
        }

        if (!is_def(trans)) {
            if (!is_def(opt_in.domain)) {
                console.error(' - must provide either trans or domain ... !!!', opt_in)
                return
            }
            // note that the order matters, ie: d3.zoomIdentity.scale(k).translate(x,
            // 0) is equivalent to d3.zoomIdentity.translate(x*k, 0).scale(k)
            let domain = opt_in.domain
            let k
        = com.top.box.w
        / (com.top.scale.x(domain[1]) - com.top.scale.x(domain[0]))
            let x = -com.top.scale.x(domain[0])
            trans = d3.zoomIdentity.scale(k).translate(x, 0)
        }

        $.each(selV, function(nSel, selName) {
            if (com.zoom.trans[selName] !== trans) {
                com.zoom.trans[selName] = trans

                if (is_def(opt_in.duration)) {
                    com.zoom.sel[selName]()
                        .transition('in_out')
                        .duration(opt_in.duration)
                        .call(com.zoom.zoom.transform, trans)
                }
                else {
                    com.zoom.sel[selName]().call(com.zoom.zoom.transform, trans)
                }
            }
        })
    }
    this.doDomainTrans = doDomainTrans
}
