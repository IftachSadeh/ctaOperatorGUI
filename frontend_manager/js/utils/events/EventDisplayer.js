/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global get_color_theme */
/* global deep_copy */
/* global min_max_obj */
/* global load_script */
/* global cols_blues */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */

load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/ScrollBox.js',
})

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.EventDisplayer = function(opt_in) {
    let color_theme = get_color_theme('bright_grey')
    let com = {
        main: {
            tag: 'eventQueueRootTag',
            g: undefined,
            scroll: {
            },
            box: {
                x: 0,
                y: 0,
                w: 1000,
                h: 300,
                marg: 0,
            },
            background: {
                fill: color_theme.brighter.background,
                stroke: color_theme.brighter.stroke,
                strokeWidth: 0.5,
            },
        },

        displayer: 'eventTrack',
        eventTrack: {
            g: undefined,
            axis: {
                enabled: true,
                g: undefined,
                box: {
                    x: 0,
                    y: 300,
                    w: 1000,
                    h: 0,
                    marg: 0,
                },
                axis: undefined,
                scale: undefined,
                domain: [ 0, 1000 ],
                range: [ 0, 0 ],
                showText: true,
                orientation: 'axisTop',
                attr: {
                    text: {
                        stroke: color_theme.medium.stroke,
                        fill: color_theme.medium.background,
                    },
                    path: {
                        stroke: color_theme.medium.stroke,
                        fill: color_theme.medium.background,
                    },
                },
            },
            timeBars: {
                enabled: true,
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 1000,
                    h: 300,
                    marg: 0,
                },
            },
        },

        filters: {
            eventFilters: [],
            filtering: [],
        },
        time: {
            currentTime: {
                date: new Date(),
                time: 0,
            },
            start_time_sec: {
                date: new Date(),
                time: 0,
            },
            end_time_sec: {
                date: new Date(),
                time: 1000,
            },
        },
        data: {
            raw: {
                events: [],
            },
            filtered: {
            },
        },
        debug: {
            enabled: false,
        },
        pattern: {
            select: {
            },
        },
        input: {
            over: {
                event: undefined,
            },
            focus: {
                event: undefined,
            },
        },
    }
    com = opt_in
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

    function setDefaultStyle() {
        if (com.style) {
            return
        }
        com.style = {
        }
        com.style.runRecCol = cols_blues[2]
        com.style.eventCol = function(opt_in) {
            return com.main.color_theme.dark
        }
        com.style.eventOpac = function(opt_in) {
            return 0.5
        }

        com.pattern.select = {
        }
        com.pattern.select.defs = com.main.g.append('defs')
        // com.pattern.select.patternHover = com.pattern.select.defs.append('pattern')
        //   .attr('id', 'patternHover')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('width', 5)
        //   .attr('height', 5)
        //   .attr('fill', '#ffffff')
        //   .attr('patternUnits', 'userSpaceOnUse')
        // com.pattern.select.patternHover.append('line')
        //   .attr('x1', 0)
        //   .attr('y1', 0)
        //   .attr('x2', 5)
        //   .attr('y2', 5)
        //   .attr('stroke', '#000000')
        //   .attr('stroke-width', 0.8)
        //   .attr('stroke-opacity', 0.4)
        // com.pattern.select.patternHover.append('line')
        //   .attr('x1', 5)
        //   .attr('y1', 0)
        //   .attr('x2', 0)
        //   .attr('y2', 5)
        //   .attr('stroke', '#000000')
        //   .attr('stroke-width', 0.8)
        //   .attr('stroke-opacity', 0.4)

        com.pattern.select.patternSelect = com.pattern.select.defs.append('pattern')
            .attr('id', 'patternSelect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 3)
            .attr('height', 3)
            .attr('fill', '#ffffff')
            .attr('patternUnits', 'userSpaceOnUse')
        com.pattern.select.patternSelect.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 3)
            .attr('y2', 3)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.4)
            .attr('stroke-opacity', 0.6)
        com.pattern.select.patternSelect.append('line')
            .attr('x1', 3)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 3)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.4)
            .attr('stroke-opacity', 0.6)
    }

    function timeIntersect(time1, time2) {
        if (time1.start <= time2.start && time1.end >= time2.end) {
            return true
        }
        if (time1.end >= time2.start && time1.end <= time2.end) {
            return true
        }
        if (time1.start >= time2.start && time1.end <= time2.end) {
            return true
        }
        if (time1.start <= time2.end && time1.end >= time2.end) {
            return true
        }
        return false
    }

    let EventTrackBib = function() {
        function init() {
            com.eventTrack.g = com.main.g.append('g')
            initAxis()
            initTimeBars()
        }
        this.init = init
        function initAxis() {
            com.eventTrack.axis.scale = d3.scaleTime()
                .range(com.eventTrack.axis.range)
                .domain(com.eventTrack.axis.domain)
            com.eventTrack.axis.main = com.eventTrack.axis.orientation === 'top&bottom' ? d3.axisBottom(com.eventTrack.axis.scale) : d3.axisTop(com.eventTrack.axis.scale)

            com.eventTrack.axis.main.tickFormat(d3.timeFormat('%H:%M'))

            if (!com.eventTrack.axis.enabled) {
                return
            }
            com.eventTrack.axis.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.eventTrack.axis.box.x + ',' + com.eventTrack.axis.box.y + ')')
            if (com.eventTrack.axis.show) {
                com.eventTrack.axis.g
                    .attr('class', 'axis')
                    .call(com.eventTrack.axis.main)
                com.eventTrack.axis.g.style('opacity', 1)
            }
        }
        function initTimeBars() {
            if (!com.eventTrack.timeBars.enabled) {
                return
            }
            com.eventTrack.timeBars.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.eventTrack.timeBars.box.x + ',' + com.eventTrack.timeBars.box.y + ')')
            com.eventTrack.timeBars.g
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .style('opacity', 1)
        }

        function setDefaultStyleForEvents(events) {
            for (let index in events) {
                let b = events[index]
                let bDisplay = {
                }

                let cols = com.style.eventCol({
                    d: b,
                })

                bDisplay.stroke = cols.stroke
                bDisplay.strokeWidth = 0.2
                bDisplay.fill = cols.background
                bDisplay.fill_opacity = com.style.eventOpac({
                    d: b,
                })
                bDisplay.strokeOpacity = com.style.eventOpac({
                    d: b,
                })
                bDisplay.strokeDasharray = []
                bDisplay.opacity = b.filtered === true ? 0.05 : 1

                bDisplay.text = cols.text
                bDisplay.patternFill = ''
                bDisplay.patternOpacity = 0
                // if (b.obs_block_id === com.input.focus.event) {
                //   if (com.input.over.event !== undefined && com.input.over.event !== com.input.focus.event) bDisplay.strokeDasharray = [8, 4]
                //   bDisplay.strokeWidth = 6
                //   bDisplay.strokeOpacity = 1
                // }
                // if (b.obs_block_id === com.input.over.event) {
                //   bDisplay.strokeWidth = 6
                //   bDisplay.strokeOpacity = 1
                //   bDisplay.strokeDasharray = []
                // }

                b.display = bDisplay
            }
            return events
        }

        function update() {
            if (com.eventTrack.axis.enabled) {
                updateAxis()
            }
            if (com.eventTrack.timeBars.enabled) {
                setTimeRect()
            }

            updateEvents()
        }
        this.update = update
        function updateAxis() {
            com.eventTrack.axis.domain = [ com.time.start_time_sec.date, com.time.end_time_sec.date ]
            com.eventTrack.axis.range = [ 0, com.eventTrack.axis.box.w ]
            com.eventTrack.axis.scale
                .domain(com.eventTrack.axis.domain)
                .range(com.eventTrack.axis.range)
            // .nice()

            if (!com.eventTrack.axis.enabled) {
                return
            }
            let minTxtSize = com.eventTrack.axis.attr.text.size ? com.eventTrack.axis.attr.text.size : com.main.box.w * 0.04
            // console.log(com.eventTrack.axis.domain, com.eventTrack.axis.range);
            com.eventTrack.axis.main.scale(com.eventTrack.axis.scale)
            com.eventTrack.axis.main.ticks(5)
            com.eventTrack.axis.main.tickSize(4)
            if (com.eventTrack.axis.show) {
                com.eventTrack.axis.g.call(com.eventTrack.axis.main)
                com.eventTrack.axis.g.select('path').attr('stroke-width', 0.5).attr('stroke', com.eventTrack.axis.attr.path.stroke)
                com.eventTrack.axis.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 0.5).attr('stroke', com.eventTrack.axis.attr.path.stroke)
                com.eventTrack.axis.g.selectAll('g.tick').selectAll('text')
                    .attr('stroke', com.eventTrack.axis.attr.text.stroke)
                    .attr('stroke-width', 0.2)
                    .attr('fill', com.eventTrack.axis.attr.text.fill)
                    .style('font-size', minTxtSize + 'px')
            }
        }
        function computeTrack(events) {
            let track = []
            for (let i = 0; i < events.length; i++) {
                let start
                let end
                start = events[i].start_time_sec
                if (events[i].end_time_sec) {
                    end = events[i].end_time_sec
                }
                else {
                    end = start
                }
                let insert = false
                for (let j = 0; j < track.length; j++) {
                    let intersect = false
                    for (let z = 0; z < track[j].length; z++) {
                        if (timeIntersect(track[j][z], {
                            start: start,
                            end: end,
                        })) {
                            intersect = true
                        } // { // && track[j].type === events[i].name) {
                        // track[j].start = track[j].start < start ? track[j].start : start
                        // track[j].end = track[j].end > end ? track[j].end : end
                        // events[i].track = j
                        // events[i].start = track[j].start
                        // events[i].end = track[j].end
                        // track[j] = {time: end, type: events[i].name}
                        //  }
                    }
                    if (!intersect) {
                        track[j].push(events[i])
                        events[i].start = start
                        events[i].end = end
                        events[i].track = j
                        insert = true
                        break
                    }
                }
                // if (!insert) {
                //   for (let j = 0; j < track.length; j++) {
                //     if (track[j].end + 3600 < start) {
                //       events[i].track = j
                //       events[i].start = start
                //       events[i].end = end
                //       track[j] = {start: start, end: end, type: events[i].name}
                //       insert = true
                //       break
                //     }
                //   }
                // }
                if (!insert) {
                    track.push([ events[i] ])
                    events[i].start = start
                    events[i].end = end
                    events[i].track = track.length - 1
                }
            }
            return track
        }
        function updateEvents() {
            let allEvents = [].concat(com.data.filtered.events_ponctual).concat(com.data.filtered.events_scheduled)
            let tracks = computeTrack(allEvents)

            // let nLine = tracks.length
            // let height = nLine >= 6 ? (com.main.box.h / nLine) : (com.main.box.h / 6)
            // let offsetY = nLine >= 6 ? 0 : (com.main.box.h - ((com.main.box.h / 6) * nLine)) / (nLine - 1)

            // let currentTrack = com.main.scroll.scrollG
            //   .selectAll('g.track')
            //   .data(tracks, function (d, i) {
            //     return i
            //   })
            // let enterTrack = currentTrack
            //   .enter()
            //   .append('g')
            //   .attr('class', 'track')
            //   .attr('transform', function (d, i) {
            //     let translate = {
            //       y: (offsetY + height) * i,
            //       x: 0
            //     }
            //     return 'translate(' + translate.x + ',' + translate.y + ')'
            //   })
            // enterTrack.each(function (d, i) {
            //   // d3.select(this).append('line')
            //   //   .attr('class', 'background')
            //   //   .attr('x1', 0)
            //   //   .attr('y1', 0)
            //   //   .attr('x2', com.main.box.w)
            //   //   .attr('y2', 0)
            //   //   .attr('fill', 'transparent')
            //   //   .attr('fill-opacity', 1)
            //   //   .attr('stroke', color_theme.dark.stroke)
            //   //   .attr('stroke-width', 0.2)
            //   //   .attr('stroke-dasharray', [2, 2])
            // })
            // enterTrack.merge(currentTrack)
            //   .transition()
            //   .duration(times.anim)
            //   .ease(d3.easeLinear)
            //   .attr('transform', function (d, i) {
            //     let translate = {
            //       y: (offsetY + height) * i,
            //       x: 0
            //     }
            //     return 'translate(' + translate.x + ',' + translate.y + ')'
            //   })
            // currentTrack.exit()
            //   .transition('in_out').duration(times.anim)
            //   .attr('width', 0)
            //   .style('opacity', 0)
            //   .remove()
            set_event_icon(allEvents, tracks)
        }
        function set_event_icon(events, tracks) {
            events = setDefaultStyleForEvents(events)

            // let sizeTarget = 20
            // let node = []
            // for (let i = 0; i < events.length; i++) {
            //   node.push({id: events[i].id, data: events[i], x: com.linkMap.map.box.w * 0.5, y: com.linkMap.map.box.h * 0.5})
            // }
            //
            // let simulation = d3.forceSimulation()
            //   .force('link', d3.forceLink().id(function (d) { return d.id }))
            //   .force('collide', d3.forceCollide(sizeTarget).iterations(32))
            //   .force('charge', d3.forceManyBody().strength(function (d) {
            //     return -500
            //   }))
            //   .force('y', d3.forceY())
            //   .force('x', d3.forceX())
            //   // .alphaDecay(0.0005)
            //   .velocityDecay(0.6)
            //   // .alpha(0.1).restart()
            // simulation.nodes(node)
            // // simulation.force('link').links(data.links).distance(function (d) {
            // //   return 4
            // // })
            // // var node = com.linkMap.map.g.append('g')
            // //   .attr('class', 'nodes')
            // //   .selectAll('g')
            // //   .data(data.nodes)
            // //   .enter().append('g')
            // //   .attr('id', function (d) { return d.id })
            // //   .each(function (d) {
            // //     let g = d3.select(this)
            // //     if (d.type === 'target') target_icon(g, {w: sizeTarget, h: sizeTarget}, d.data.name.split('_')[1], {}, colorPalette)
            // //     else if (d.type === 'pointing') pointing_icon(g, {w: sizePointing, h: sizePointing * 0.8}, d.data.name.split('-')[1], {}, colorPalette)
            // //   })
            // //   .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
            //
            // let simulationDurationInMs = 1000
            // let start_time_sec = Date.now()
            // let end_time_sec = start_time_sec + simulationDurationInMs
            // simulation.on('tick', function () {
            //   if (Date.now() > end_time_sec) {
            //     simulation.stop()
            //     return
            //   }
            //
            //   d.x = Math.max(sizeTarget, Math.min(com.linkMap.map.box.w - sizeTarget, d.x)) - sizeTarget / 2
            //   d.y = Math.max(sizeTarget, Math.min(com.linkMap.map.box.h - sizeTarget, d.y)) - sizeTarget / 2
            //   // .attr('cx', function (d) {
            //   //   d.x = Math.max(10, Math.min(com.linkMap.map.box.w - 10, d.x))
            //   //   return d.x
            //   // })
            //   // .attr('cy', function (d) {
            //   //   d.y = Math.max(10, Math.min(com.linkMap.map.box.h - 10, d.y))
            //   //   return d.y
            //   // })
            // })

            let nLine = tracks.length
            let height = nLine >= 2 ? ((com.main.box.h) / nLine) : ((com.main.box.h) / 2)
            let offsetY = nLine >= 2 ? 0 : ((com.main.box.h) - (((com.main.box.h) / 2) * nLine)) / (nLine - 1)

            let timescale = d3.scaleLinear()
                .range(com.eventTrack.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])

            let rect = com.main.scroll.scrollG
                .selectAll('g.' + com.main.tag + 'events')
                .data(events, function(d) {
                    return d.id
                })

            rect.each(function(d, i) {
                let box = {
                    x: timescale(d.start),
                    y: (offsetY + height) * d.track,
                    w: timescale(d.end) - timescale(d.start),
                    h: height,
                }
                d3.select(this)
                // .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
                    .attr('opacity', d => d.display.opacity)
                d3.select(this).select('rect.back')
                    .attr('x', box.x)
                    .attr('y', box.y)
                    .attr('width', box.h)
                    .attr('height', box.h * 1)
                    .style('fill', colorPalette.medium.background)
                    .style('stroke', colorPalette.medium.stroke)
                    .attr('stroke-width', 0.4)
                    .style('stroke-opacity', 1)
                    .style('fill-opacity', 1) // d.display.fill_opacity)
                d3.select(this).select('path.anchor')
                    .attr('d', function() {
                        let lineGenerator = d3.line()
                            .x(function(d) {
                                return d.x
                            })
                            .y(function(d) {
                                return d.y
                            })
                            .curve(d3.curveLinear)
                        return lineGenerator([
                            {
                                x: box.x,
                                y: box.y,
                            },
                            {
                                x: box.x,
                                y: box.y + box.h,
                            },
                            {
                                x: box.x,
                                y: box.y + box.h * 0.5,
                            },
                            {
                                x: box.x + timescale(d.end) - timescale(d.start),
                                y: box.y + box.h * 0.5,
                            },
                            {
                                x: box.x + timescale(d.end) - timescale(d.start),
                                y: box.y + box.h * 0.3,
                            },
                            {
                                x: box.x + timescale(d.end) - timescale(d.start),
                                y: box.y + box.h * 0.7,
                            },
                        ])
                    })
                // .attr('x', box.x)
                // .attr('y', box.y + box.h * 0.45)
                // .attr('width', function () {
                //   let w = timescale(d.end) - timescale(d.start)
                //   if (w === 0) {
                //     d3.select(this).attr('rx', 10)
                //     return 10
                //   }
                //   return w
                // })
                // .attr('height', box.h * 0.1)
                    .style('fill', 'none')
                    .style('fill-opacity', d.display.fill_opacity)
                    .attr('stroke-width', 4)
                    .style('stroke-opacity', d.display.strokeOpacity)
                    .style('stroke-dasharray', d.display.strokeDasharray)
                d3.select(this).select('rect.pattern')
                    .attr('x', timescale(d.start))
                    .attr('y', box.y)
                    .attr('width', timescale(d.end) - timescale(d.start))
                    .attr('height', box.h)
                    .style('fill', d.display.patternFill)
                    .style('fill-opacity', d.display.patternOpacity)
                d3.select(this).select('#icon')
                    .attr('width', box.h * 0.8)
                    .attr('height', box.h * 0.6)
                    .attr('x', box.x + box.h * 0.1)
                    .attr('y', box.y + box.h * 0.1)
                // d3.select(this).select('text')
                //   .transition('in_out')
                //   .duration(times.anim)
                //   .ease(d3.easeLinear)
                //   .text(d.name)
                //   .style('font-size', (box.h * 0.5) + 'px')
                //   .attr('dy', 1)
                //   .attr('x', timescale(d.startT) + (timescale(d.endT) - timescale(d.startT)) * 0.5)
                //   .attr('y', (box.h * 0.5))
                //   .style('opacity', d.display.fill_opacity)
                //   .style('stroke-opacity', d.display.fill_opacity)
                //   .style('fill-opacity', d.display.fill_opacity)
            })
        }

        function get_eventsRows() {
            let timescale = d3.scaleLinear()
                .range(com.eventTrack.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])
            let scheds = groupEventsBySchedule(com.data.filtered)
            let nLine = scheds.length
            let height = com.main.box.h / nLine

            let ret = []
            for (let i = 0; i < scheds.length; i++) {
                for (let j = 0; j < scheds[i].events.length; j++) {
                    let translate = {
                        y: height * i,
                        x: 0,
                    }
                    ret.push({
                        y: translate.y,
                        x: timescale(scheds[i].events[j].start_time_sec),
                        h: height,
                        w: timescale(scheds[i].events[j].end_time_sec) - timescale(scheds[i].events[j].start_time_sec),
                        event: scheds[i].events[j],
                    })
                }
            }
            return ret
        }
        this.get_eventsRows = get_eventsRows

        // function addExtraBar (date) {
        //   let data = []
        //   if (date === null) {
        //     let rectNow = com.main.g
        //       .selectAll('rect.' + com.main.tag + 'extra')
        //       .data(data)
        //     rectNow.exit().remove()
        //   } else {
        //     data = [date]
        //     let rectNow = com.main.g
        //       .selectAll('rect.' + com.main.tag + 'extra')
        //       .data(data)
        //       .attr('transform', 'translate(' + com.eventTrack.axis.box.x + ',' + 0 + ')')
        //
        //     rectNow
        //       .enter()
        //       .append('rect')
        //       .attr('class', com.main.tag + 'extra')
        //       .style('opacity', 1)
        //       .attr('x', function (d, i) {
        //         if (d > com.eventTrack.axis.scale.domain()[1]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[1])
        //         else if (d < com.eventTrack.axis.scale.domain()[0]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[0])
        //         return com.eventTrack.axis.scale(d)
        //       })
        //       .attr('y', function (d, i) {
        //         return com.main.box.y - 1 * com.main.box.marg
        //       })
        //       .attr('width', 0)
        //       .attr('height', function (d, i) {
        //         return com.main.box.h + 1 * com.main.box.marg
        //       })
        //       .attr('stroke', d3.rgb(com.style.runRecCol).darker(1.0))
        //       .attr('fill', cols_yellows[0])
        //       .attr('fill-opacity', 0.3)
        //       .style('stroke-opacity', 0.15)
        //       .attr('stroke-width', 3)
        //       .style('pointer-events', 'none')
        //       .attr('vector-effect', 'non-scaling-stroke')
        //       .merge(rectNow)
        //       .transition('in_out')
        //       .duration(50)
        //       .attr('x', function (d, i) {
        //         if (d > com.eventTrack.axis.scale.domain()[1]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[1])
        //         else if (d < com.eventTrack.axis.scale.domain()[0]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[0])
        //         return com.eventTrack.axis.scale(d)
        //       })
        //       // .attr("y", function(d,i) { return d.y; })
        //       .attr('width', function (d, i) {
        //         return com.main.box.marg
        //       })
        //   }
        // }
        function setTimeRect() {
            let rectNowData = []

            rectNowData = [
                {
                    id: com.main.tag + 'now',
                    x: com.eventTrack.axis.scale(com.time.currentTime.date),
                    y: com.eventTrack.timeBars.box.y,
                    w: com.eventTrack.timeBars.box.marg,
                    h: com.eventTrack.timeBars.box.h + com.eventTrack.timeBars.box.marg * 2,
                },
            ]
            // console.log('timeFrac',timeFrac,rectNowData);
            // console.log('rectNowData',(com.eventRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

            // ------------------------------------------------------------------
            //
            // ------------------------------------------------------------------
            let rectNow = com.eventTrack.timeBars.g
                .selectAll('rect.' + com.main.tag + 'now')
                .data(rectNowData, function(d) {
                    return d.id
                })

            rectNow
                .enter()
                .append('rect')
                .attr('class', com.main.tag + 'now')
                .style('opacity', 1)
                .attr('x', function(d, i) {
                    return d.x
                })
                .attr('y', function(d, i) {
                    return d.y - 1 * com.main.box.marg
                })
                .attr('width', 0)
                .attr('height', function(d, i) {
                    return d.h
                })
                .attr('fill', com.style.runRecCol)
                .attr('fill-opacity', 0.3)
                .style('stroke-opacity', 0.15)
                .attr('stroke-width', 3)
                .style('pointer-events', 'none')
                .attr('vector-effect', 'non-scaling-stroke')
                .merge(rectNow)
                .transition('in_out')
                .duration(times.anim)
                .attr('x', function(d, i) {
                    return d.x
                })
            // .attr("y", function(d,i) { return d.y; })
                .attr('width', function(d, i) {
                    return d.w
                })
            // .attr("height", function(d,i) { return d.h; })

            // rectNow.exit()
            //   .transition("in_out").duration(times.anim/2)
            //   .attr("width", 0)
            //   .style("opacity", 0)
            //   .remove()
        }

        function remove() {
            com.eventTrack.g.remove()
            com.main.g.selectAll('g.allScheds').remove()
            if (com.eventTrack.axis.enabled) {
                com.eventTrack.axis.g.remove()
            }
            if (com.eventTrack.timeBars.enabled) {
                com.eventTrack.timeBars.g.remove()
            }
        }
        this.remove = remove
    }
    let eventTrackBib = new EventTrackBib()
    let EventQueueBib = function() {
        function init() {
            com.eventTrack.g = com.main.g.append('g')
            initAxis()
            initTimeBars()
        }
        this.init = init
        function initAxis() {
            com.eventTrack.axis.scale = d3.scaleTime()
                .range(com.eventTrack.axis.range)
                .domain(com.eventTrack.axis.domain)
            com.eventTrack.axis.main = com.eventTrack.axis.orientation === 'top&bottom' ? d3.axisBottom(com.eventTrack.axis.scale) : d3.axisTop(com.eventTrack.axis.scale)

            com.eventTrack.axis.main.tickFormat(d3.timeFormat('%H:%M'))

            if (!com.eventTrack.axis.enabled) {
                return
            }
            com.eventTrack.axis.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.eventTrack.axis.box.x + ',' + com.eventTrack.axis.box.y + ')')
            if (com.eventTrack.axis.show) {
                com.eventTrack.axis.g
                    .attr('class', 'axis')
                    .call(com.eventTrack.axis.main)
                com.eventTrack.axis.g.style('opacity', 1)
            }
        }
        function initTimeBars() {
            if (!com.eventTrack.timeBars.enabled) {
                return
            }
            com.eventTrack.timeBars.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.eventTrack.timeBars.box.x + ',' + com.eventTrack.timeBars.box.y + ')')
            com.eventTrack.timeBars.g
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .style('opacity', 1)
        }

        function setDefaultStyleForEvents(events) {
            for (let index in events) {
                let b = events[index]
                let bDisplay = {
                }

                let cols = com.style.eventCol({
                    d: b,
                })

                bDisplay.stroke = cols.stroke
                bDisplay.strokeWidth = 0.2
                bDisplay.fill = cols.background
                bDisplay.fill_opacity = com.style.eventOpac({
                    d: b,
                })
                bDisplay.strokeOpacity = com.style.eventOpac({
                    d: b,
                })
                bDisplay.strokeDasharray = []
                bDisplay.opacity = b.filtered === true ? 0.05 : 1

                bDisplay.text = cols.text
                bDisplay.patternFill = ''
                bDisplay.patternOpacity = 0
                // if (b.obs_block_id === com.input.focus.event) {
                //   if (com.input.over.event !== undefined && com.input.over.event !== com.input.focus.event) bDisplay.strokeDasharray = [8, 4]
                //   bDisplay.strokeWidth = 6
                //   bDisplay.strokeOpacity = 1
                // }
                // if (b.obs_block_id === com.input.over.event) {
                //   bDisplay.strokeWidth = 6
                //   bDisplay.strokeOpacity = 1
                //   bDisplay.strokeDasharray = []
                // }

                b.display = bDisplay
            }
            return events
        }

        function update() {
            if (com.eventTrack.axis.enabled) {
                updateAxis()
            }
            if (com.eventTrack.timeBars.enabled) {
                setTimeRect()
            }

            updateEvents()
        }
        this.update = update
        function updateAxis() {
            com.eventTrack.axis.domain = [ com.time.start_time_sec.date, com.time.end_time_sec.date ]
            com.eventTrack.axis.range = [ 0, com.eventTrack.axis.box.w ]
            com.eventTrack.axis.scale
                .domain(com.eventTrack.axis.domain)
                .range(com.eventTrack.axis.range)
            // .nice()

            if (!com.eventTrack.axis.enabled) {
                return
            }
            let minTxtSize = com.eventTrack.axis.attr.text.size ? com.eventTrack.axis.attr.text.size : com.main.box.w * 0.04
            // console.log(com.eventTrack.axis.domain, com.eventTrack.axis.range);
            com.eventTrack.axis.main.scale(com.eventTrack.axis.scale)
            com.eventTrack.axis.main.ticks(5)
            com.eventTrack.axis.main.tickSize(4)
            if (com.eventTrack.axis.show) {
                com.eventTrack.axis.g.call(com.eventTrack.axis.main)
                com.eventTrack.axis.g.select('path').attr('stroke-width', 0.5).attr('stroke', com.eventTrack.axis.attr.path.stroke)
                com.eventTrack.axis.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 0.5).attr('stroke', com.eventTrack.axis.attr.path.stroke)
                com.eventTrack.axis.g.selectAll('g.tick').selectAll('text')
                    .attr('stroke', com.eventTrack.axis.attr.text.stroke)
                    .attr('stroke-width', 0.2)
                    .attr('fill', com.eventTrack.axis.attr.text.fill)
                    .style('font-size', minTxtSize + 'px')
            }
        }
        function computeTrack(events) {
            let track = []
            for (let i = 0; i < events.length; i++) {
                let start
                let end
                start = events[i].start_time_sec
                if (events[i].end_time_sec) {
                    end = events[i].end_time_sec
                }
                else {
                    end = start
                }

                let insert = false
                for (let j = 0; j < track.length; j++) {
                    let intersect = false
                    for (let z = 0; z < track[j].length; z++) {
                        if (timeIntersect(track[j][z], {
                            start: start,
                            end: end,
                        })) {
                            intersect = true
                        } // { // && track[j].type === events[i].name) {
                        // track[j].start = track[j].start < start ? track[j].start : start
                        // track[j].end = track[j].end > end ? track[j].end : end
                        // events[i].track = j
                        // events[i].start = track[j].start
                        // events[i].end = track[j].end
                        // track[j] = {time: end, type: events[i].name}
                        //  }
                    }
                    if (!intersect) {
                        track[j].push(events[i])
                        events[i].start = start
                        events[i].end = end
                        events[i].track = j
                        insert = true
                        break
                    }
                }
                // if (!insert) {
                //   for (let j = 0; j < track.length; j++) {
                //     if (track[j].end + 3600 < start) {
                //       events[i].track = j
                //       events[i].start = start
                //       events[i].end = end
                //       track[j] = {start: start, end: end, type: events[i].name}
                //       insert = true
                //       break
                //     }
                //   }
                // }
                if (!insert) {
                    track.push([ events[i] ])
                    events[i].start = start
                    events[i].end = end
                    events[i].track = track.length - 1
                }
            }
            return track
        }
        function updateEvents() {
            let allEvents = [].concat(com.data.filtered.events_ponctual).concat(com.data.filtered.events_scheduled)
            let tracks = computeTrack(allEvents)

            // let nLine = tracks.length
            // let height = nLine >= 6 ? (com.main.box.h / nLine) : (com.main.box.h / 6)
            // let offsetY = nLine >= 6 ? 0 : (com.main.box.h - ((com.main.box.h / 6) * nLine)) / (nLine - 1)

            // let currentTrack = com.main.scroll.scrollG
            //   .selectAll('g.track')
            //   .data(tracks, function (d, i) {
            //     return i
            //   })
            // let enterTrack = currentTrack
            //   .enter()
            //   .append('g')
            //   .attr('class', 'track')
            //   .attr('transform', function (d, i) {
            //     let translate = {
            //       y: (offsetY + height) * i,
            //       x: 0
            //     }
            //     return 'translate(' + translate.x + ',' + translate.y + ')'
            //   })
            // enterTrack.each(function (d, i) {
            //   // d3.select(this).append('line')
            //   //   .attr('class', 'background')
            //   //   .attr('x1', 0)
            //   //   .attr('y1', 0)
            //   //   .attr('x2', com.main.box.w)
            //   //   .attr('y2', 0)
            //   //   .attr('fill', 'transparent')
            //   //   .attr('fill-opacity', 1)
            //   //   .attr('stroke', color_theme.dark.stroke)
            //   //   .attr('stroke-width', 0.2)
            //   //   .attr('stroke-dasharray', [2, 2])
            // })
            // enterTrack.merge(currentTrack)
            //   .transition()
            //   .duration(times.anim)
            //   .ease(d3.easeLinear)
            //   .attr('transform', function (d, i) {
            //     let translate = {
            //       y: (offsetY + height) * i,
            //       x: 0
            //     }
            //     return 'translate(' + translate.x + ',' + translate.y + ')'
            //   })
            // currentTrack.exit()
            //   .transition('in_out').duration(times.anim)
            //   .attr('width', 0)
            //   .style('opacity', 0)
            //   .remove()
            set_event_icon(allEvents, tracks)
        }
        function set_event_icon(events, tracks) {
            events = setDefaultStyleForEvents(events)

            // let sizeTarget = 20
            // let node = []
            // for (let i = 0; i < events.length; i++) {
            //   node.push({id: events[i].id, data: events[i], x: com.linkMap.map.box.w * 0.5, y: com.linkMap.map.box.h * 0.5})
            // }
            //
            // let simulation = d3.forceSimulation()
            //   .force('link', d3.forceLink().id(function (d) { return d.id }))
            //   .force('collide', d3.forceCollide(sizeTarget).iterations(32))
            //   .force('charge', d3.forceManyBody().strength(function (d) {
            //     return -500
            //   }))
            //   .force('y', d3.forceY())
            //   .force('x', d3.forceX())
            //   // .alphaDecay(0.0005)
            //   .velocityDecay(0.6)
            //   // .alpha(0.1).restart()
            // simulation.nodes(node)
            // // simulation.force('link').links(data.links).distance(function (d) {
            // //   return 4
            // // })
            // // var node = com.linkMap.map.g.append('g')
            // //   .attr('class', 'nodes')
            // //   .selectAll('g')
            // //   .data(data.nodes)
            // //   .enter().append('g')
            // //   .attr('id', function (d) { return d.id })
            // //   .each(function (d) {
            // //     let g = d3.select(this)
            // //     if (d.type === 'target') target_icon(g, {w: sizeTarget, h: sizeTarget}, d.data.name.split('_')[1], {}, colorPalette)
            // //     else if (d.type === 'pointing') pointing_icon(g, {w: sizePointing, h: sizePointing * 0.8}, d.data.name.split('-')[1], {}, colorPalette)
            // //   })
            // //   .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
            //
            // let simulationDurationInMs = 1000
            // let start_time_sec = Date.now()
            // let end_time_sec = start_time_sec + simulationDurationInMs
            // simulation.on('tick', function () {
            //   if (Date.now() > end_time_sec) {
            //     simulation.stop()
            //     return
            //   }
            //
            //   d.x = Math.max(sizeTarget, Math.min(com.linkMap.map.box.w - sizeTarget, d.x)) - sizeTarget / 2
            //   d.y = Math.max(sizeTarget, Math.min(com.linkMap.map.box.h - sizeTarget, d.y)) - sizeTarget / 2
            //   // .attr('cx', function (d) {
            //   //   d.x = Math.max(10, Math.min(com.linkMap.map.box.w - 10, d.x))
            //   //   return d.x
            //   // })
            //   // .attr('cy', function (d) {
            //   //   d.y = Math.max(10, Math.min(com.linkMap.map.box.h - 10, d.y))
            //   //   return d.y
            //   // })
            // })

            let nLine = tracks.length
            let height = nLine >= 2 ? ((com.main.box.h * 0.33) / nLine) : ((com.main.box.h * 0.33) / 2)
            // let offsetY = 0 // nLine >= 2 ? 0 : ((com.main.box.h * 0.33) - (((com.main.box.h * 0.33) / 2) * nLine)) / (nLine - 1)

            let timescale = d3.scaleLinear()
                .range(com.eventTrack.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])

            let rect = com.main.scroll.scrollG
                .selectAll('g.' + com.main.tag + 'events')
                .data(events, function(d) {
                    return d.id
                })
            let index_shift = -1
            rect.each(function(d, i) {
                let opac = 0
                if (com.eventQueue.details.range === 'in') {
                    if (d.start > com.time.start_time_sec.time && d.end < com.time.end_time_sec.time) {
                        opac = 1
                        index_shift += 1
                    }
                }
                else if (timeIntersect(d, {
                    start: com.time.start_time_sec.time,
                    end: com.time.end_time_sec.time,
                })) {
                    opac = 1
                    index_shift += 1
                }
                let box = {
                    x: com.eventQueue.details.anchor === 'right' ? (com.main.box.w - (2 + 56 * (index_shift + 1))) : 2 + 56 * index_shift,
                    y: 2,
                    w: 50,
                    h: com.main.box.h * 0.5,
                }
                d3.select(this)
                // .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
                    .attr('opacity', d => d.display.opacity)
                d3.select(this).select('rect.anchor')
                    .attr('x', timescale(d.start))
                    .attr('y', com.main.box.h - (height * (d.track + 1)))
                    .attr('width', function() {
                        let w = timescale(d.end) - timescale(d.start)
                        if (w === 0) {
                            d3.select(this).attr('rx', 10)
                            return 10
                        }
                        return w
                    })
                    .attr('height', height)
                    .style('fill-opacity', d.display.fill_opacity)
                    .attr('stroke-width', 0.4)
                    .style('stroke-opacity', 1)

                    .attr('stroke-width', 0.2)
                d3.select(this).select('rect.back')
                    .attr('opacity', opac)
                    .attr('x', box.x)
                    .attr('y', box.y)
                    .attr('width', box.w) // timescale(d.endT) - timescale(d.startT))
                    .attr('height', box.h)
                // .style('fill', d.display.fill)
                    .style('fill-opacity', d.display.fill_opacity)
                    .attr('stroke-width', d.display.strokeWidth)
                    .style('stroke-opacity', d.display.strokeOpacity)
                    .style('stroke-dasharray', d.display.strokeDasharray)
                // d3.select(this).select('rect.pattern')
                //   .attr('x', timescale(d.start))
                //   .attr('y', box.y)
                //   .attr('width', timescale(d.end) - timescale(d.start))
                //   .attr('height', box.h)
                //   .style('fill', d.display.patternFill)
                //   .style('fill-opacity', d.display.patternOpacity)
                d3.select(this).select('#icon')
                    .attr('opacity', opac)
                    .attr('x', box.x + box.w * 0.25)
                    .attr('y', box.y)
                    .attr('width', box.w * 0.5) // timescale(d.endT) - timescale(d.startT))
                    .attr('height', box.h * 0.5)
                // d3.select(this).select('text')
                //   .transition('in_out')
                //   .duration(times.anim)
                //   .ease(d3.easeLinear)
                //   .text(d.name)
                //   .style('font-size', (box.h * 0.5) + 'px')
                //   .attr('dy', 1)
                //   .attr('x', timescale(d.startT) + (timescale(d.endT) - timescale(d.startT)) * 0.5)
                //   .attr('y', (box.h * 0.5))
                //   .style('opacity', d.display.fill_opacity)
                //   .style('stroke-opacity', d.display.fill_opacity)
                //   .style('fill-opacity', d.display.fill_opacity)
            })
        }

        function get_eventsRows() {
            let timescale = d3.scaleLinear()
                .range(com.eventTrack.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])
            let scheds = groupEventsBySchedule(com.data.filtered)
            let nLine = scheds.length
            let height = com.main.box.h / nLine

            let ret = []
            for (let i = 0; i < scheds.length; i++) {
                for (let j = 0; j < scheds[i].events.length; j++) {
                    let translate = {
                        y: height * i,
                        x: 0,
                    }
                    ret.push({
                        y: translate.y,
                        x: timescale(scheds[i].events[j].start_time_sec),
                        h: height,
                        w: timescale(scheds[i].events[j].end_time_sec) - timescale(scheds[i].events[j].start_time_sec),
                        event: scheds[i].events[j],
                    })
                }
            }
            return ret
        }
        this.get_eventsRows = get_eventsRows

        // function addExtraBar (date) {
        //   let data = []
        //   if (date === null) {
        //     let rectNow = com.main.g
        //       .selectAll('rect.' + com.main.tag + 'extra')
        //       .data(data)
        //     rectNow.exit().remove()
        //   } else {
        //     data = [date]
        //     let rectNow = com.main.g
        //       .selectAll('rect.' + com.main.tag + 'extra')
        //       .data(data)
        //       .attr('transform', 'translate(' + com.eventTrack.axis.box.x + ',' + 0 + ')')
        //
        //     rectNow
        //       .enter()
        //       .append('rect')
        //       .attr('class', com.main.tag + 'extra')
        //       .style('opacity', 1)
        //       .attr('x', function (d, i) {
        //         if (d > com.eventTrack.axis.scale.domain()[1]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[1])
        //         else if (d < com.eventTrack.axis.scale.domain()[0]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[0])
        //         return com.eventTrack.axis.scale(d)
        //       })
        //       .attr('y', function (d, i) {
        //         return com.main.box.y - 1 * com.main.box.marg
        //       })
        //       .attr('width', 0)
        //       .attr('height', function (d, i) {
        //         return com.main.box.h + 1 * com.main.box.marg
        //       })
        //       .attr('stroke', d3.rgb(com.style.runRecCol).darker(1.0))
        //       .attr('fill', cols_yellows[0])
        //       .attr('fill-opacity', 0.3)
        //       .style('stroke-opacity', 0.15)
        //       .attr('stroke-width', 3)
        //       .style('pointer-events', 'none')
        //       .attr('vector-effect', 'non-scaling-stroke')
        //       .merge(rectNow)
        //       .transition('in_out')
        //       .duration(50)
        //       .attr('x', function (d, i) {
        //         if (d > com.eventTrack.axis.scale.domain()[1]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[1])
        //         else if (d < com.eventTrack.axis.scale.domain()[0]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[0])
        //         return com.eventTrack.axis.scale(d)
        //       })
        //       // .attr("y", function(d,i) { return d.y; })
        //       .attr('width', function (d, i) {
        //         return com.main.box.marg
        //       })
        //   }
        // }
        function setTimeRect() {
            let rectNowData = []

            rectNowData = [
                {
                    id: com.main.tag + 'now',
                    x: com.eventTrack.axis.scale(com.time.currentTime.date),
                    y: com.eventTrack.timeBars.box.y,
                    w: com.eventTrack.timeBars.box.marg,
                    h: com.eventTrack.timeBars.box.h + com.eventTrack.timeBars.box.marg * 2,
                },
            ]
            // console.log('timeFrac',timeFrac,rectNowData);
            // console.log('rectNowData',(com.eventRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

            // ------------------------------------------------------------------
            //
            // ------------------------------------------------------------------
            let rectNow = com.eventTrack.timeBars.g
                .selectAll('rect.' + com.main.tag + 'now')
                .data(rectNowData, function(d) {
                    return d.id
                })

            rectNow
                .enter()
                .append('rect')
                .attr('class', com.main.tag + 'now')
                .style('opacity', 1)
                .attr('x', function(d, i) {
                    return d.x
                })
                .attr('y', function(d, i) {
                    return d.y - 1 * com.main.box.marg
                })
                .attr('width', 0)
                .attr('height', function(d, i) {
                    return d.h
                })
                .attr('fill', com.style.runRecCol)
                .attr('fill-opacity', 0.3)
                .style('stroke-opacity', 0.15)
                .attr('stroke-width', 3)
                .style('pointer-events', 'none')
                .attr('vector-effect', 'non-scaling-stroke')
                .merge(rectNow)
                .transition('in_out')
                .duration(times.anim)
                .attr('x', function(d, i) {
                    return d.x
                })
            // .attr("y", function(d,i) { return d.y; })
                .attr('width', function(d, i) {
                    return d.w
                })
            // .attr("height", function(d,i) { return d.h; })

            // rectNow.exit()
            //   .transition("in_out").duration(times.anim/2)
            //   .attr("width", 0)
            //   .style("opacity", 0)
            //   .remove()
        }

        function remove() {
            com.eventTrack.g.remove()
            com.main.g.selectAll('g.allScheds').remove()
            if (com.eventTrack.axis.enabled) {
                com.eventTrack.axis.g.remove()
            }
            if (com.eventTrack.timeBars.enabled) {
                com.eventTrack.timeBars.g.remove()
            }
        }
        this.remove = remove
    }
    let eventQueueBib = new EventQueueBib()

    function init() {
        setDefaultStyle()
        initScrollBox()
        // this.initBackground()

        if (com.displayer === 'eventQueue') {
            eventQueueBib.init()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.init()
        }
    }
    this.init = init
    function initScrollBox() {
        com.main.scroll.scrollBoxG = com.main.g.append('g')
        com.main.scroll.scrollBoxG.append('rect')
            .attr('class', 'background')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', com.main.box.w)
            .attr('height', com.main.box.h)
            .style('fill', com.main.background.fill)
            .style('stroke', com.main.background.stroke)
            .style('stroke-width', com.main.background.strokeWidth)
        com.main.scroll.scrollBoxG.append('rect')
            .attr('id', 'serifleft')
            .attr('x', -6)
            .attr('y', 0)
            .attr('width', 5)
            .attr('height', com.main.box.h)
            .style('fill', 'none')
            .style('stroke', com.main.background.stroke)
            .style('stroke-width', 1)
            .attr('stroke-dasharray', [ 5 + com.main.box.h + 5, com.main.box.h ])
        com.main.scroll.scrollBoxG.append('rect')
            .attr('id', 'serifright')
            .attr('x', com.main.box.w + 1)
            .attr('y', 0)
            .attr('width', 5)
            .attr('height', com.main.box.h)
            .style('fill', 'none')
            .style('stroke', com.main.background.stroke)
            .style('stroke-width', 1)
            .attr('stroke-dasharray', [ 5, com.main.box.h, 5 + com.main.box.h ])

        let ntag = com.main.tag + 'Scroll'
        com.main.scroll.scrollBox = new ScrollBox()
        com.main.scroll.scrollBox.init({
            main: {
                tag: 'urgent_supervision_scrollbox',
                g: com.main.scroll.scrollBoxG,
                box: {
                    x: 0,
                    y: 0,
                    w: com.main.box.w,
                    h: com.main.box.h,
                },
            },
        })
        // com.main.scroll.scrollBox.init({
        //     tag: ntag,
        //     g_box: com.main.scroll.scrollBoxG,
        //     box_data: {
        //         x: 0,
        //         y: 0,
        //         w: com.main.box.w,
        //         h: com.main.box.h,
        //     },
        //     use_relative_coords: true,
        //     locker: new Locker(),
        //     lockers: [ 'eventDisplayerScroll' + 'update_data' ],
        //     lock_zoom: {
        //         all: 'eventDisplayerScroll' + 'zoom',
        //         during: 'eventDisplayerScroll' + 'zoom_during',
        //         end: 'eventDisplayerScroll' + 'zoom_end',
        //     },
        //     run_loop: new RunLoop({
        //         tag: 'eventDisplayerScroll',
        //     }),
        //     can_scroll: true,
        //     scrollVertical: false,
        //     scroll_horizontal: true,
        //     scroll_height: 0,
        //     scroll_width: 0,
        //     background: 'transparent',
        //     scroll_rec_h: {
        //         h: 2,
        //     },
        //     scroll_recs: {
        //         w: 2,
        //     },
        // })
        com.main.scroll.scrollG = com.main.scroll.scrollBox.get_content()
    }
    function initBackground() {
        com.main.g.append('rect')
            .attr('class', 'background')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', com.main.box.w)
            .attr('height', com.main.box.h)
            .style('fill', com.main.background.fill)
            .style('stroke', com.main.background.stroke)
            .style('stroke-width', com.main.background.strokeWidth)
    }
    this.initBackground = initBackground

    function filterData(opt_in) {
        function checkFilter(d, f) {
            let op = f.operation
            let co = f.contains
            let filters = f.filters

            if (co === 'all') {
                for (let i = 0; i < filters.length; i++) {
                    let target = d
                    for (let j = 0; j < filters[i].keys.length; j++) {
                        target = target[filters[i].keys[j]]
                    }
                    if (Array.isArray(target)) {
                        if (target.indexOf(filters[i].value) === -1) {
                            if (op === 'exclude') {
                                return false
                            }
                            if (op === 'include') {
                                return true
                            }
                        }
                    }
                    else if (target !== filters[i].value) {
                        if (op === 'exclude') {
                            return false
                        }
                        if (op === 'include') {
                            return true
                        }
                    }
                }
                if (op === 'exclude') {
                    return true
                }
                if (op === 'include') {
                    return false
                }
            }
            else if (co === 'one') {
                for (let i = 0; i < filters.length; i++) {
                    let target = d
                    for (let j = 0; j < filters[i].keys.length; j++) {
                        target = target[filters[i].keys[j]]
                    }
                    if (Array.isArray(target)) {
                        if (target.indexOf(filters[i].value) !== -1) {
                            if (op === 'exclude') {
                                return true
                            }
                            if (op === 'include') {
                                return false
                            }
                        }
                    }
                    else if (target === filters[i].value) {
                        if (op === 'exclude') {
                            return true
                        }
                        if (op === 'include') {
                            return false
                        }
                    }
                }
                if (op === 'exclude') {
                    return false
                }
                if (op === 'include') {
                    return true
                }
            }
            return false
        }

        let filters = opt_in.filters ? opt_in.filters : com.filters.filtering

        let filtered = {
            done: [],
            run: [],
            cancel: [],
            wait: [],
            fail: [],
        }
        let stats = {
            tot: 0,
            filtered: 0,
        }
        stats.tot = com.data.raw.events.done.length + com.data.raw.events.wait.length + com.data.raw.events.run.length
        // separate event according to states
        for (var z = 0; z < com.data.raw.events.done.length; z++) {
            let data_now = com.data.raw.events.done[z]
            data_now.filtered = false
            if (filters.length === 0) {
                if (data_now.exe_state.state === 'done') {
                    filtered.done.push(data_now)
                }
                if (data_now.exe_state.state === 'fail') {
                    filtered.fail.push(data_now)
                }
                if (data_now.exe_state.state === 'cancel') {
                    filtered.cancel.push(data_now)
                }
            }
            else {
                for (var i = 0; i < filters.length; i++) {
                    let filterNow = filters[i]
                    let allPropChecked = true
                    if (!checkFilter(data_now, filterNow)) {
                        allPropChecked = false
                    }
                    if (allPropChecked) {
                        data_now.filtered = true
                    }
                }
                if (data_now.exe_state.state === 'done') {
                    filtered.done.push(data_now)
                }
                if (data_now.exe_state.state === 'fail') {
                    filtered.fail.push(data_now)
                }
                if (data_now.exe_state.state === 'cancel') {
                    filtered.cancel.push(data_now)
                }
            }
            if (data_now.filtered) {
                stats.filtered += 1
            }
        }

        filtered.wait = com.data.raw.events.wait.map(function(data_now) {
            data_now.filtered = false
            if (filters.length === 0) {
                return data_now
            }
            for (var i = 0; i < filters.length; i++) {
                let filterNow = filters[i]
                let allPropChecked = true
                if (!checkFilter(data_now, filterNow)) {
                    allPropChecked = false
                }
                if (allPropChecked) {
                    data_now.filtered = true
                }
            }
            if (data_now.filtered) {
                stats.filtered += 1
            }
            return data_now
        })
        filtered.run = com.data.raw.events.run.map(function(data_now) {
            data_now.filtered = false
            if (filters.length === 0) {
                return data_now
            }
            for (var i = 0; i < filters.length; i++) {
                let filterNow = filters[i]
                let allPropChecked = true
                if (!checkFilter(data_now, filterNow)) {
                    allPropChecked = false
                }
                if (allPropChecked) {
                    data_now.filtered = true
                }
            }
            if (data_now.filtered) {
                stats.filtered += 1
            }
            return data_now
        })
        return {
            data: filtered,
            stats: stats,
        }
    }
    this.filterData = filterData
    function createEventsGroup() {
        let allEvents = [].concat(com.data.filtered.events_ponctual)
            .concat(com.data.filtered.events_scheduled)

        let rect = com.main.scroll.scrollG
            .selectAll('g.' + com.main.tag + 'events')
            .data(allEvents, function(d) {
                return d.id
            })
        let rectEnter = rect
            .enter()
            .append('g')
            .attr('class', com.main.tag + 'events')
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
        rectEnter.each(function(d, i) {
            let parent = d3.select(this)
            d3.select(this).append('path')
                .attr('class', 'anchor')
                .style('pointer-events', 'none')
                .attr('vector-effect', 'non-scaling-stroke')
                .attr('stroke', com.main.color_theme.dark.stroke)
                .style('fill', cols_mix[i])
            d3.select(this).append('rect')
                .attr('class', 'back')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 0)
                .attr('height', 0)
                .attr('stroke', com.main.color_theme.dark.stroke)
                .style('fill', cols_mix[i])
                .style('fill-opacity', 1)
                .attr('stroke-width', 0)
                .style('stroke-opacity', 0)
                .style('stroke-dasharray', [])
                .attr('vector-effect', 'non-scaling-stroke')
                .on('click', function(event, d) {
                    let node = d3.select(this)
                    node.attr('clicked', 1)

                    setTimeout(function() {
                        if (node.attr('clicked') === '2') {
                            return
                        }
                        if (event.ctrlKey) {
                            // com.input.selection.push(that)
                        }
                        else {
                            // com.input.selection = [that]
                        }
                        com.events.event.click(d)
                    }, 250)
                })
                .on('dblclick', function(e, d) {
                    let node = d3.select(this)
                    node.attr('clicked', 2)
                })
                .on('mouseover', function(e, d) {
                    d3.select(this).style('cursor', 'pointer')
                    com.events.event.mouseover(d)
                })
                .on('mouseout', function(e, d) {
                    d3.select(this).style('cursor', 'default')
                    com.events.event.mouseout(d)
                })
                .call(d3.drag()
                    .on('start', function(e, d) {
                        com.interaction = {
                        }
                        com.interaction.oldG = parent
                        com.events.event.drag.start(d)
                    })
                    .on('drag', function(e, d) {
                        com.events.event.drag.tick(d)
                    })
                    .on('end', function(e, d) {
                        com.events.event.drag.end(d)
                    }))
            d3.select(this).append('rect')
                .attr('class', 'pattern')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 0)
                .attr('height', 0)
                .attr('stroke', 'none')
                .style('fill', 'none')
                .style('fill-opacity', 1)
                .style('stroke-opacity', 0)
                .style('pointer-events', 'none')
                .attr('vector-effect', 'non-scaling-stroke')
            // d3.select(this).append('text')
            //   .attr('class', 'name')
            //   .text(d.name)
            //   .style('font-weight', 'normal')
            //   .style('opacity', 0)
            //   .style('fill', '#000000')
            //   .style('stroke-width', 0.3)
            //   .style('stroke-opacity', 1)
            //   .attr('vector-effect', 'non-scaling-stroke')
            //   .style('pointer-events', 'none')
            //   .style('stroke', '#000000')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('text-anchor', 'middle')
            d3.select(this).append('svg:image')
                .attr('id', 'icon')
                .attr('xlink:href', '/static/' + d.icon)
                .attr('width', 0)
                .attr('height', 0)
                .attr('x', 0)
                .attr('y', 0)
                .style('pointer-events', 'none')
        })
        rect = rectEnter.merge(rect)
    }
    function update_data(data_in) {
        com.main.g.select('text.name')
            .transition()
            .duration(400)
            .style('opacity', 0)
        com.time.currentTime = data_in.time.currentTime
        com.time.start_time_sec = data_in.time.start_time_sec
        com.time.end_time_sec = data_in.time.end_time_sec
        com.data.raw = data_in.data.raw
        com.data.modified = data_in.data.modified
        // com.filters.filtering = updateFiltering()
        // com.data.filtered = filterData({}).data
        com.data.filtered = com.data.raw
        createEventsGroup()

        if (com.displayer === 'eventQueue') {
            eventQueueBib.update()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.update()
        }
    }
    this.update_data = update_data
    function update() {
        com.filters.filtering = updateFiltering()
        com.data.filtered = filterData({
        }).data
        createEventsGroup()
        if (com.displayer === 'eventQueue') {
            eventQueueBib.update()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.update()
        }
    }
    this.update = update

    function changeDisplayer(newDisplayer) {
        if (com.displayer === newDisplayer) {
            return
        }

        if (com.displayer === 'eventQueue') {
            eventQueueBib.remove()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.remove()
        }

        com.displayer = newDisplayer
        if (com.displayer === 'eventQueue') {
            eventQueueBib.init()
            eventQueueBib.update()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.init()
            eventTrackBib.update()
        }
    }
    this.changeDisplayer = changeDisplayer

    function get_eventsRows() {
        if (com.displayer === 'eventQueue') {
            eventQueueBib.get_eventsRows()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.get_eventsRows()
        }
    }
    this.get_eventsRows = get_eventsRows

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    // function eventsMouseOver (data) {
    //   let totEvents = com.eventQueue.events.run.g.selectAll('g.' + com.main.tag + 'events')
    //   if (com.eventQueue.events.cancel.g) totEvents.merge(com.eventQueue.events.cancel.g.selectAll('g.' + com.main.tag + 'events'))
    //
    //   totEvents.each(function (d) {
    //     if (d.data.metadata.n_sched === data.data.metadata.n_sched && d.data.metadata.n_obs !== data.data.metadata.n_obs) {
    //       d3.select(this).select('rect.back').attr('stroke-width', 6)
    //         .style('stroke-opacity', 1)
    //         .attr('stroke-dasharray', [4, 2])
    //     }
    //   })
    // }
    // function eventsMouseOut (data) {
    //   let totEvents = com.eventQueue.events.run.g.selectAll('g.' + com.main.tag + 'events')
    //   if (com.eventQueue.events.cancel.g) totEvents.merge(com.eventQueue.events.cancel.g.selectAll('g.' + com.main.tag + 'events'))
    //
    //   totEvents.each(function (d) {
    //     if (d.data.metadata.n_sched === data.data.metadata.n_sched && d.data.metadata.n_obs !== data.data.metadata.n_obs) {
    //       d3.select(this).select('rect.back').attr('stroke-width', 1)
    //         .style('stroke-opacity', 0.4)
    //         .attr('stroke-dasharray', [])
    //     }
    //   })
    // }

    function overEvent(id) {
        com.input.over.event = id
        if (com.displayer === 'eventQueue') {
            eventQueueBib.update()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.update()
        }
    }
    this.overEvent = overEvent
    function outEvent(id) {
        com.input.over.event = undefined
        if (com.displayer === 'eventQueue') {
            eventQueueBib.update()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.update()
        }
    }
    this.outEvent = outEvent

    function focusOnEvent(id) {
        com.input.focus.event = id
        if (com.displayer === 'eventQueue') {
            eventQueueBib.update()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.update()
        }
    }
    this.focusOnEvent = focusOnEvent
    function unfocusOnEvent(id) {
        com.input.focus.event = undefined
        if (com.displayer === 'eventQueue') {
            eventQueueBib.update()
        }
        else if (com.displayer === 'eventTrack') {
            eventTrackBib.update()
        }
    }
    this.unfocusOnEvent = unfocusOnEvent

    function updateFiltering() {
        let allFilters = []
        for (let i = com.filters.eventFilters.length - 1; i > -1; i--) {
            let filters = com.filters.eventFilters[i].getFilters()
            allFilters = allFilters.concat(filters)
        }
        return allFilters
    }
    function plugEventFilters(eventFilters, propagate) {
        com.filters.eventFilters.push(eventFilters)
        if (propagate) {
            eventFilters.plugEventQueue(this, !propagate)
        }
    }
    this.plugEventFilters = plugEventFilters
    function unplugEventFilters(eventFilters, propagate) {
        for (let i = com.filters.eventFilters.length - 1; i > -1; i--) {
            if (com.filters.eventFilters[i] === eventFilters) {
                com.filters.eventFilters[i].remove()
            }
        }
        if (propagate) {
            eventFilters.unplugEventQueue(this, !propagate)
        }
    }
    this.unplugEventFilters = unplugEventFilters
}
