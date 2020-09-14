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
/* global BlockForm */

load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/ScrollBox.js',
})

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.BlockDisplayer = function(opt_in) {
    let color_theme = get_color_theme('bright_grey')
    let com = {
        main: {
            tag: 'blockQueueRootTag',
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

        displayer: 'blockQueue',
        blockQueue: {
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
            blocks: {
                enabled: true,
                run: {
                    enabled: true,
                    g: undefined,
                    box: {
                        x: 0,
                        y: 300 * 0.66,
                        w: 1000,
                        h: 300 * 0.34,
                        marg: 0,
                    },
                    events: {
                        click: () => {},
                        mouseover: () => {},
                        mouseout: () => {},
                        drag: {
                            start: () => {},
                            tick: () => {},
                            end: () => {},
                        },
                    },
                    background: {
                        fill: color_theme.brighter.background,
                        stroke: 'none',
                        strokeWidth: 0,
                    },
                },
                cancel: {
                    enabled: true,
                    g: undefined,
                    box: {
                        x: 0,
                        y: 0,
                        w: 1000,
                        h: 300 * 0.2,
                        marg: 0,
                    },
                    events: {
                        click: () => {},
                        mouseover: () => {},
                        mouseout: () => {},
                        drag: {
                            start: () => {},
                            tick: () => {},
                            end: () => {},
                        },
                    },
                    background: {
                        fill: color_theme.brighter.background,
                        stroke: color_theme.brighter.stroke,
                        strokeWidth: 0,
                    },
                },
                modification: {
                    enabled: true,
                    g: undefined,
                    box: {
                        x: 0,
                        y: 300 * 0.24,
                        w: 1000,
                        h: 300 * 0.36,
                        marg: 0,
                    },
                    events: {
                        click: () => {},
                        mouseover: () => {},
                        mouseout: () => {},
                        drag: {
                            start: () => {},
                            tick: () => {},
                            end: () => {},
                        },
                    },
                    background: {
                        fill: color_theme.brighter.background,
                        stroke: 'none',
                        strokeWidth: 0,
                    },
                },
                colorPalette: color_theme.blocks,
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
        blockQueue2: {
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
        blockTrackShrink: {
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
        blockList: {
            g: undefined,
        },
        blockForm: {
            mosaic: {
                box: {
                },
            },
            forms: {
                box: {
                },
                display: 'focus',
            },
        },

        filters: {
            blockFilters: [],
            filtering: [],
        },
        time: {
            current_time: {
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
                blocks: [],
                tel_ids: [],
            },
            filtered: {
            },
            modified: [],
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
                sched_blocks: [],
                block: [],
            },
            focus: {
                sched_blocks: [],
                block: [],
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
        com.style = {
        }
        com.style.runRecCol = cols_blues[2]
        com.style.blockCol = function(opt_in) {
            let state = is_def(opt_in.state)
                ? opt_in.state
                : opt_in.d.exe_state.state
            let can_run = is_def(opt_in.can_run)
                ? opt_in.can_run
                : opt_in.d.exe_state.can_run
            let modified = opt_in.d.modifications ? opt_in.d.modifications.userModifications.length > 0 : false

            if (state === 'wait') {
                if (modified) {
                    return com.blockQueue.blocks.colorPalette.wait
                }
                return com.blockQueue.blocks.colorPalette.wait
            }
            else if (state === 'done') {
                return com.blockQueue.blocks.colorPalette.done
            }
            else if (state === 'fail') {
                return com.blockQueue.blocks.colorPalette.fail
            }
            else if (state === 'run') {
                return com.blockQueue.blocks.colorPalette.run
            }
            else if (state === 'cancel') {
                if (is_def(can_run)) {
                    if (!can_run) {
                        return com.blockQueue.blocks.colorPalette.cancelOp
                    }
                }
                return com.blockQueue.blocks.colorPalette.cancelSys
            }
            else {
                return com.blockQueue.blocks.colorPalette.shutdown
            }
        }
        com.style.blockOpac = function(opt_in) {
            let state = is_def(opt_in.state)
                ? opt_in.state
                : opt_in.d.exe_state.state
            let can_run = is_def(opt_in.can_run)
                ? opt_in.can_run
                : opt_in.d.exe_state.can_run
            let modified = opt_in.d.modifications ? opt_in.d.modifications.userModifications.length > 0 : false

            if (state === 'wait') {
                if (modified) {
                    return 0.2
                }
                return 1
            }
            else if (state === 'run') {
                return 1
            }
            else if (state === 'cancel') {
                if (is_def(can_run)) {
                    if (!can_run) {
                        return 1
                    }
                }
                return 1
            }
            else {
                return 1
            }
        }
        com.style.blockPattern = function(opt_in) {
            return 'none'
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
        com.pattern.select.patternLock = com.pattern.select.defs.append('pattern')
            .attr('id', 'patternLock')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 2)
            .attr('height', 2)
            .attr('fill', '#ffffff')
            .attr('patternUnits', 'userSpaceOnUse')
        com.pattern.select.patternLock.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 2)
            .attr('y2', 2)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.5)
            .attr('stroke-opacity', 0.6)
        com.pattern.select.patternLock.append('line')
            .attr('x1', 2)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 2)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.5)
            .attr('stroke-opacity', 0.6)

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
    function switchStyle(style) {
        if (!style) {
            setDefaultStyle()
            return
        }
        com.style = style

    // com.pattern.select = {}
    // com.pattern.select.defs = com.main.g.append('defs')
    //
    // com.pattern.select.patternSelect = com.pattern.select.defs.append('pattern')
    //   .attr('id', 'patternSelect')
    //   .attr('x', 0)
    //   .attr('y', 0)
    //   .attr('width', 3)
    //   .attr('height', 3)
    //   .attr('fill', '#ffffff')
    //   .attr('patternUnits', 'userSpaceOnUse')
    // com.pattern.select.patternSelect.append('line')
    //   .attr('x1', 0)
    //   .attr('y1', 0)
    //   .attr('x2', 3)
    //   .attr('y2', 3)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 0.4)
    //   .attr('stroke-opacity', 0.6)
    // com.pattern.select.patternSelect.append('line')
    //   .attr('x1', 3)
    //   .attr('y1', 0)
    //   .attr('x2', 0)
    //   .attr('y2', 3)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 0.4)
    //   .attr('stroke-opacity', 0.6)
    }
    this.switchStyle = switchStyle

    let BlockQueueBib = function() {
        function init() {
            initAxis()
            initBlocks()
            initTimeBars()
        }
        this.init = init
        function initAxis() {
            com.blockQueue.axis.scale = d3.scaleTime()
                .range(com.blockQueue.axis.range)
                .domain(com.blockQueue.axis.domain)
            com.blockQueue.axis.main = d3.axisBottom(com.blockQueue.axis.scale)
                .tickFormat(d3.timeFormat('%H:%M'))

            if (!com.blockQueue.axis.enabled) {
                return
            }
            com.blockQueue.axis.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.blockQueue.axis.box.x + ',' + com.blockQueue.axis.box.y + ')')
            com.blockQueue.axis.g
                .attr('class', 'axis')
                .call(com.blockQueue.axis.main)

            com.blockQueue.axis.g.style('opacity', 1)
        }
        function initBlocks() {
            if (!com.blockQueue.blocks.enabled) {
                return
            }

            com.blockQueue.blocks.clipping = {
            }
            com.blockQueue.blocks.clipping.g = com.main.g.append('g')
            com.blockQueue.blocks.clipping.g.append('defs').append('svg:clipPath')
                .attr('id', 'clip')
                .append('svg:rect')
                .attr('id', 'clip-rect')
                .attr('x', '0')
                .attr('y', '0')
                .attr('width', com.main.box.w)
                .attr('height', com.main.box.h)
            com.blockQueue.blocks.clipping.clipBody = com.blockQueue.blocks.clipping.g.append('g')
                .attr('clip-path', 'url(#clip)')
            if (com.blockQueue.blocks.run.enabled) {
                com.blockQueue.blocks.run.g = com.blockQueue.blocks.clipping.clipBody.append('g')
                com.blockQueue.blocks.run.g.attr('transform', 'translate(' + com.blockQueue.blocks.run.box.x + ',' + com.blockQueue.blocks.run.box.y + ')')
                    .style('opacity', 0)
                    .transition()
                    .duration(1000)
                    .delay(1000)
                    .style('opacity', 1)
            }
            if (com.blockQueue.blocks.cancel.enabled) {
                com.blockQueue.blocks.cancel.g = com.blockQueue.blocks.clipping.clipBody.append('g')
                com.blockQueue.blocks.cancel.g.attr('transform', 'translate(' + com.blockQueue.blocks.cancel.box.x + ',' + com.blockQueue.blocks.cancel.box.y + ')')
                    .style('opacity', 0)
                    .transition()
                    .duration(1000)
                    .delay(1000)
                    .style('opacity', 1)
            }
            if (com.blockQueue.blocks.modification.enabled) {
                com.blockQueue.blocks.modification.g = com.blockQueue.blocks.clipping.clipBody.append('g')
                com.blockQueue.blocks.modification.g.attr('transform', 'translate(' + com.blockQueue.blocks.modification.box.x + ',' + com.blockQueue.blocks.modification.box.y + ')')
                    .style('opacity', 0)
                    .transition()
                    .duration(1000)
                    .delay(1000)
                    .style('opacity', 1)
            }
        }
        function initTimeBars() {
            if (!com.blockQueue.timeBars.enabled) {
                return
            }
            com.blockQueue.timeBars.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.blockQueue.timeBars.box.x + ',' + com.blockQueue.timeBars.box.y + ')')
            com.blockQueue.timeBars.g
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .style('opacity', 1)
        }

        function get_block_rows() {
            if (com.blockQueue.blocks.run.enabled) {
                let dataBottom = []
                    .concat(com.data.filtered.done)
                    .concat(com.data.filtered.fail)
                    .concat(com.data.filtered.run)
                    .concat(com.data.filtered.wait)
                let bottomRow = calcBlockRow({
                    type_now: 'bottom',
                    start: com.time.start_time_sec.time,
                    end: com.time.end_time_sec.time,
                    data: dataBottom,
                    box: {
                        x: 0,
                        y: 0,
                        w: com.blockQueue.blocks.run.box.w,
                        h: com.blockQueue.blocks.run.box.h,
                        marg: com.blockQueue.blocks.run.box.marg,
                    },
                    yScale: true,
                })
                bottomRow = adjustBlockRow(bottomRow, {
                    x: 0,
                    y: 0,
                    w: com.blockQueue.blocks.run.box.w,
                    h: com.blockQueue.blocks.run.box.h,
                    marg: com.blockQueue.blocks.run.box.marg,
                }, 'toTop')
                bottomRow = setDefaultStyleForBlocks(bottomRow)
                return bottomRow
            }
        }
        this.get_block_rows = get_block_rows

        function adjustBlockRow(blocks, box, direction) {
            $.each(blocks, function(index0, data_now0) {
                data_now0.x = data_now0.display.x
                data_now0.y = data_now0.display.y
                data_now0.w = data_now0.display.w
                data_now0.h = data_now0.display.h
            })
            // ------------------------------------------------------------------
            //
            // ------------------------------------------------------------------
            let wMin = min_max_obj({
                min_max: 'min',
                data: blocks,
                func: 'w',
            })
            let hMin = min_max_obj({
                min_max: 'min',
                data: blocks,
                func: 'h',
            })
            if (!is_def(hMin) || !is_def(wMin)) {
                return []
            }

            let margX = wMin * 0.2
            let margY = blocks.length === 1 ? 0 : Math.min(hMin * 0.5, box.h * 0.05)
            $.each(blocks, function(index0, data_now0) {
                data_now0.x += margX / 2
                data_now0.w -= margX
                data_now0.h -= margY / 2

                // precaution against negative width values
                data_now0.w = Math.max(data_now0.w, box.marg / 10)
                data_now0.h = Math.max(data_now0.h, box.marg)
            })
            // ------------------------------------------------------------------
            let sortedIds = []
            $.each(blocks, function(index0, data_now0) {
                if (sortedIds.indexOf(data_now0.id) >= 0) {
                    return
                }
                sortedIds.push(data_now0.id)

                let x0 = data_now0.x
                let y0 = data_now0.y
                let w0 = data_now0.w
                let h0 = data_now0.h
                // let o0 = data_now0.o

                let telV = [].concat(data_now0.tel_ids)
                let min_max = {
                    min_x: x0,
                    min_y: y0,
                    maxX: x0 + w0,
                    maxY: y0 + h0,
                }

                let ovelaps = [{
                    index: index0,
                    data: data_now0,
                }]

                for (let n_tries = 0; n_tries < 1; n_tries++) {
                    let nOver = ovelaps.length

                    $.each(blocks, function(index1, data_now1) {
                        if (sortedIds.indexOf(data_now1.id) >= 0) {
                            return
                        }
                        if (
                            ovelaps
                                .map(function(d) {
                                    return d.id
                                })
                                .indexOf(data_now1.id) >= 0
                        ) {
                            return
                        }

                        let x1 = data_now1.x
                        let y1 = data_now1.y
                        let w1 = data_now1.w
                        let h1 = data_now1.h
                        let o01 = Math.max(data_now0.o, data_now1.o)

                        let hasOverlap
                              = x1 < min_max.maxX - o01
                              && x1 + w1 > min_max.min_x + o01
                              && y1 < min_max.maxY
                              && y1 + h1 > min_max.min_y
                        // if(x1 > min_max.maxX-o1 && x1 < min_max.maxX) console.log([index0,data_now0.data.metadata.block_name],[index1,data_now1.data.metadata.block_name]);

                        // XXXXXXXXXXXXXXXXXX
                        // let hasOverlap = (
                        //   (x1 < min_max.maxX+margX/2) && (x1+w1 > min_max.min_x) &&
                        //   (y1 < min_max.maxY)         && (y1+h1 > min_max.min_y)
                        // );
                        // XXXXXXXXXXXXXXXXXX

                        if (hasOverlap) {
                            let intersect = telV.filter(n => data_now1.tel_ids.includes(n))
                            if (intersect.length === 0) {
                                sortedIds.push(data_now1.id)
                            }
                            telV = telV.concat(data_now1.tel_ids)

                            min_max = {
                                min_x: Math.min(min_max.min_x, x1),
                                min_y: Math.min(min_max.min_y, y1),
                                maxX: Math.max(min_max.maxX, x1 + w1),
                                maxY: Math.max(min_max.maxY, y1 + h1),
                            }

                            ovelaps.push({
                                index: index1,
                                data: data_now1,
                            })
                        }
                    })
                    // console.log('xxxxxxxxxxxxxxx',n_tries,ovelaps,ovelaps.map(function(d){return d.data.data.metadata.block_name;}));
                    if (nOver === ovelaps.length) {
                        break
                    }
                }

                if (ovelaps.length > 1) {
                    let origIndices = ovelaps.map(function(d) {
                        return d.index
                    })

                    ovelaps.sort(function(a, b) {
                        let diffTime = a.data.data.time.start - b.data.data.time.start
                        let diffTel = b.data.data.tel_ids.length - a.data.data.tel_ids.length
                        return diffTel !== 0 ? diffTel : diffTime
                    })

                    // if(type_now=='run') console.log('will sort',ovelaps.map(function(d){return d.data.data.metadata.block_name;}));
                    $.each(ovelaps, function(index1, data_now1) {
                        // if(type_now=='run') console.log('-=-=-',index1,origIndices[index1], data_now1.index);
                        let origIndex = origIndices[index1]
                        // if(canSort) blocks[origIndex] = data_now1.data;
                        blocks[origIndex] = data_now1.data
                    })
                }
            })

            $.each(blocks, function(index0, data_now0) {
                let x0 = data_now0.x
                let y0 = data_now0.y
                let w0 = data_now0.w
                let h0 = data_now0.h

                // let telV = [].concat(data_now0.data.tel_ids)

                let isSkip = false
                $.each(blocks, function(index1, data_now1) {
                    if (index0 >= index1 || isSkip) {
                        return
                    }

                    let x1 = data_now1.x
                    let y1 = data_now1.y
                    let w1 = data_now1.w
                    let h1 = data_now1.h

                    // XXXXXXXXXXXXXXXXXX
                    // let hasOverlap = ((x1 < x0+w0+margX/2) && (x1+w1 > x0) && (y1 < y0+h0) && (y1+h1 > y0));
                    // XXXXXXXXXXXXXXXXXX
                    let hasOverlap = x1 < x0 + w0 && x1 + w1 > x0 && y1 < y0 + h0 && y1 + h1 > y0
                    if (hasOverlap) {
                        data_now1.y = y0 + h0 + margY / 2
                        // data_now1.y += h0 + margY/2;
                    }
                    // if(hasOverlap) console.log([index0,data_now0.data.metadata.block_name],[index1,data_now1.data.metadata.block_name],(h0 + margY/2));
                })
            })
            if (direction === 'toTop') {
                $.each(blocks, function(index0, data_now0) {
                    data_now0.y = (2 * box.y + box.h) - data_now0.y - data_now0.h
                })
            }

            $.each(blocks, function(index0, data_now0) {
                data_now0.display.x = data_now0.x
                data_now0.display.y = data_now0.y
                data_now0.display.w = data_now0.w
                data_now0.display.h = data_now0.h
            })
            return blocks
        }
        function calcBlockRow(opt_in) {
            let data_in = opt_in.data
            let box = opt_in.box
            let xScale = box.w / (opt_in.end - opt_in.start)
            let yScale = box.h / (com.data.raw.tel_ids.length + 2)

            let n_blocksType = {
            }
            // console.log(data_in);
            // compute width/height/x/y of blocks, only y need to be modified (so far)

            $.each(data_in, function(index, data_now) {
                let id = data_now.obs_block_id
                let state = data_now.exe_state.state
                let n_tels = data_now.tel_ids.length
                let start = (data_now.time.start - opt_in.start) * xScale
                let end = (data_now.time.end_time_sec - opt_in.start) * xScale
                let overlap = (data_now.time.end_time_sec - data_now.time.start) * xScale * 0.2 // allow small overlap in x between blocks
                let x0 = box.x + start
                let w0 = end - start
                let h0 = opt_in.yScale ? (n_tels * yScale) : (box.h * 0.3)
                let y0 = box.y

                if (!is_def(n_blocksType[state])) {
                    n_blocksType[state] = 0
                }
                else {
                    n_blocksType[state] += 1
                }

                data_now.display = {
                    id: id,
                    x: x0,
                    y: y0,
                    w: w0,
                    h: h0,
                    newH: h0,
                    o: overlap,
                    n_block: n_blocksType[state],
                }
            })

            // let groups = groupByTime(blocks)
            // $.each(groups, function (index, group) {
            //   let tot = 0
            //   $.each(group, function (index, data_now) {
            //     tot += data_now.h
            //   })
            //   if (isGeneratingTelsConflict(group)) {
            //     let coef = (box.h * 1) / tot
            //     let x = group[0].x
            //     let x2 = x + group[0].w
            //     $.each(group, function (index, data_now) {
            //       data_now.newH = ((data_now.h * coef) < data_now.newH ? (data_now.h * coef) : data_now.newH)
            //       if (data_now.x < x) x = data_now.x
            //       if (data_now.x + data_now.w > x2) x2 = data_now.x + data_now.w
            //     })
            //     com.background.child.runOverflow.back.append('rect')
            //       .attr('class', 'conflictRect')
            //       .attr('x', x)
            //       .attr('y', com.blockQueue.blocks.run.box.y - com.blockQueue.blocks.run.box.h * 0.25 - com.blockQueue.blocks.run.box.marg)
            //       .attr('width', x2 - x)
            //       .attr('height', com.blockQueue.blocks.run.box.h * 0.12)
            //       .attr('fill', com.background.child.runOverflow.fill)
            //       .attr('fill-opacity', com.background.child.runOverflow.fill_opacity)
            //   } else if (tot > box.h) {
            //     let coef = box.h / tot
            //     $.each(group, function (index, data_now) {
            //       data_now.newH = ((data_now.h * coef) > data_now.newH ? (data_now.h * coef) : data_now.newH)
            //     })
            //   }
            // })
            // $.each(groups, function (index, group) {
            //   $.each(group, function (index, data_now) {
            //     data_now.h = data_now.newH ? data_now.newH : data_now.h
            //   })
            // })
            return data_in
        }
        function setDefaultStyleForBlocks(blocks) {
            let timescale = d3.scaleLinear()
                .range(com.blockQueue.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])
            for (let index in blocks) {
                let b = blocks[index]
                let bDisplay = b.display

                let cols = com.style.blockCol({
                    d: b,
                })

                bDisplay.w = timescale(b.time.end_time_sec) - timescale(b.time.start)
                bDisplay.stroke = cols.stroke
                bDisplay.strokeWidth = 0.5
                bDisplay.fill = cols.background
                bDisplay.fill_opacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeOpacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeDasharray = []
                bDisplay.opacity = b.filtered === true ? 0.05 : 1

                bDisplay.text = cols.text
                bDisplay.patternFill = ''
                bDisplay.patternOpacity = 0
                if (b.sched_block_id === com.input.focus.sched_blocks) {
                    if (!(com.input.over.sched_blocks !== undefined && com.input.over.sched_blocks !== com.input.focus.sched_blocks)) { // b.stroke = color_theme.blocks.critical.background
                        // b.patternFill = 'url(#patternHover)'
                        bDisplay.patternFill = 'url(#patternSelect)'
                        bDisplay.patternOpacity = 1
                    }
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                }
                if (b.sched_block_id === com.input.over.sched_blocks) {
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                    bDisplay.patternFill = 'url(#patternSelect)'
                    bDisplay.patternOpacity = 1
                }
                if (b.obs_block_id === com.input.focus.block) {
                    if (com.input.over.block !== undefined && com.input.over.block !== com.input.focus.block) {
                        bDisplay.strokeDasharray = [ 8, 4 ]
                    }
                    bDisplay.strokeWidth = 6
                    bDisplay.strokeOpacity = 1
                }
                if (b.obs_block_id === com.input.over.block) {
                    bDisplay.strokeWidth = 6
                    bDisplay.strokeOpacity = 1
                    bDisplay.strokeDasharray = []
                }
            }
            return blocks
        }
        // function groupByTime (blocks) {
        //   let groups = []
        //   for (var i = 0; i < blocks.length; i++) {
        //     let newGroup = [blocks[i]]
        //     for (var j = 0; j < blocks.length; j++) {
        //       if (i !== j && is_same_time_begin_after(blocks[i].x, blocks[i].x + blocks[i].w, blocks[j].x, blocks[j].x + blocks[j].w)) newGroup.push(blocks[j])
        //     }
        //     groups.push(newGroup)
        //   }
        //   return groups
        // }
        //
        // function is_same_time_begin_after (s1, e1, s2, e2) {
        //   if (s1 > s2 && s1 < e2) return true
        //   return false
        // }
        //
        // function isGeneratingTelsConflict (group) {
        //   function useSameTels (tel1, tel2) {
        //     for (var i = 0; i < tel1.length; i++) {
        //       for (var j = 0; j < tel2.length; j++) {
        //         if (tel1[i] === tel2[j]) {
        //           return true
        //         }
        //       }
        //     }
        //     return false
        //   }
        //   for (let i = 0; i < length; i++) {
        //     for (let j = 0; j < length; j++) {
        //       if (i !== j && useSameTels(group[i].data.tel_ids, group[j].data.tel_ids)) {
        //         return true
        //       }
        //     }
        //   }
        //   return false
        // }

        function update() {
            if (com.blockQueue.axis.enabled) {
                updateAxis()
            }
            if (com.blockQueue.blocks.enabled) {
                updateBlocks()
            }
            if (com.blockQueue.timeBars.enabled) {
                setTimeRect()
            }
        }
        this.update = update
        function updateAxis() {
            com.blockQueue.axis.domain = [ com.time.start_time_sec.date, com.time.end_time_sec.date ]
            com.blockQueue.axis.range = [ 0, com.blockQueue.axis.box.w ]

            com.blockQueue.axis.scale
                .domain(com.blockQueue.axis.domain)
                .range(com.blockQueue.axis.range)

            if (!com.blockQueue.axis.enabled) {
                return
            }
            let minTxtSize = com.main.box.w * 0.02
            // console.log(com.blockQueue.axis.domain, com.blockQueue.axis.range);
            com.blockQueue.axis.main.scale(com.blockQueue.axis.scale)
            com.blockQueue.axis.main.tickSize(4)
            com.blockQueue.axis.g.call(com.blockQueue.axis.main)
            com.blockQueue.axis.g.select('path').attr('stroke-width', 1.5).attr('stroke', com.blockQueue.axis.attr.path.stroke)
            com.blockQueue.axis.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 1.5).attr('stroke', com.blockQueue.axis.attr.path.stroke)
            com.blockQueue.axis.g.selectAll('g.tick').selectAll('text')
                .attr('stroke', com.blockQueue.axis.attr.text.stroke)
                .attr('stroke-width', 0.5)
                .attr('fill', com.blockQueue.axis.attr.text.fill)
                .style('font-size', minTxtSize + 'px')
        }
        function updateBlocks() {
            if (com.data.filtered === undefined) {
                return
            }

            if (com.blockQueue.blocks.run.enabled) {
                let dataBottom = []
                    .concat(com.data.filtered.done)
                    .concat(com.data.filtered.fail)
                    .concat(com.data.filtered.run)
                    .concat(com.data.filtered.wait)
                let bottomRow = calcBlockRow({
                    type_now: 'bottom',
                    start: com.time.start_time_sec.time,
                    end: com.time.end_time_sec.time,
                    data: dataBottom,
                    box: {
                        x: 0,
                        y: 0,
                        w: com.blockQueue.blocks.run.box.w,
                        h: com.blockQueue.blocks.run.box.h,
                        marg: com.blockQueue.blocks.run.box.marg,
                    },
                    yScale: true,
                })
                bottomRow = adjustBlockRow(bottomRow, {
                    x: 0,
                    y: 0,
                    w: com.blockQueue.blocks.run.box.w,
                    h: com.blockQueue.blocks.run.box.h,
                    marg: com.blockQueue.blocks.run.box.marg,
                }, 'toTop')
                bottomRow = setDefaultStyleForBlocks(bottomRow)
                setBlockRect(bottomRow, com.blockQueue.blocks.run)
            }
            if (com.blockQueue.blocks.cancel.enabled) {
                let dataTop = []
                    .concat(com.data.filtered.cancel)
                let topRow = calcBlockRow({
                    type_now: 'top',
                    start: com.time.start_time_sec.time,
                    end: com.time.end_time_sec.time,
                    data: dataTop,
                    box: {
                        x: 0,
                        y: 0,
                        w: com.blockQueue.blocks.cancel.box.w,
                        h: com.blockQueue.blocks.cancel.box.h,
                        marg: com.blockQueue.blocks.cancel.box.marg,
                    },
                    yScale: false,
                })
                topRow = adjustBlockRow(topRow, {
                    x: 0,
                    y: 0,
                    w: com.blockQueue.blocks.cancel.box.w,
                    h: com.blockQueue.blocks.cancel.box.h,
                    marg: com.blockQueue.blocks.cancel.box.marg,
                }, 'toTop')
                topRow = setDefaultStyleForBlocks(topRow)
                setBlockRect(topRow, com.blockQueue.blocks.cancel)
            }
            if (com.blockQueue.blocks.modification.enabled && com.data.modified.length > 0) {
                let middleRow = calcBlockRow({
                    type_now: 'top',
                    start: com.time.start_time_sec.time,
                    end: com.time.end_time_sec.time,
                    data: com.data.modified,
                    box: {
                        x: 0,
                        y: 0,
                        w: com.blockQueue.blocks.run.box.w,
                        h: com.blockQueue.blocks.run.box.h,
                        marg: com.blockQueue.blocks.run.box.marg,
                    },
                    yScale: true,
                })
                middleRow = adjustBlockRow(middleRow, {
                    x: 0,
                    y: 0,
                    w: com.blockQueue.blocks.modification.box.w,
                    h: com.blockQueue.blocks.modification.box.h,
                    marg: com.blockQueue.blocks.modification.box.marg,
                }, 'toBottom')
                middleRow = setDefaultStyleForBlocks(middleRow)
                setBlockRect(middleRow, com.blockQueue.blocks.modification)
            }
        }
        function setBlockRect(data, group) {
            let box = group.box
            // let g = group.g

            let minTxtSize = 6
            let timescale = d3.scaleLinear()
                .range(com.blockQueue.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])

            let rect = com.main.scroll.scrollG
                .selectAll('g.' + com.main.tag + 'blocks')
                .data(data, function(d) {
                    return d.obs_block_id
                })
            rect.transition()
                .duration(times.anim)
                .ease(d3.easeLinear)
                .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
                .attr('opacity', d => d.display.opacity)
            rect.each(function(d, i) {
                d3.select(this).attr('opacity', d.display.opacity)
                d3.select(this).select('rect.back')
                    .transition('in_out')
                    .duration(times.anim)
                    .ease(d3.easeLinear)
                    .attr('stroke', d.display.stroke)
                    .style('fill', d.display.fill)
                    .style('fill-opacity', d.display.fill_opacity)
                    .attr('x', timescale(d.time.start))
                    .attr('y', d.display.y - 2)
                    .attr('width', timescale(d.time.end) - timescale(d.time.start))
                    .attr('height', d.display.h)
                    .attr('stroke-width', d.display.strokeWidth)
                    .style('stroke-opacity', d.display.strokeOpacity)
                    .style('stroke-dasharray', d.display.strokeDasharray)
                d3.select(this).select('rect.pattern')
                    .transition('in_out')
                    .duration(times.anim)
                    .attr('x', timescale(d.time.start))
                    .attr('y', d.display.y - 2)
                    .attr('width', timescale(d.time.end) - timescale(d.time.start))
                    .attr('height', d.display.h)
                    .style('fill', d.display.patternFill)
                    .style('fill-opacity', d.display.patternOpacity)
                d3.select(this).select('text')
                    .transition('in_out')
                    .duration(times.anim)
                    .text(d.metadata.block_name)
                    .style('font-size', function(d) {
                        d.display.size = minTxtSize
                        if (!is_def(d.display.size)) {
                            console.error('_blockQueue_ERROR:', com.main.tag, minTxtSize, d.display.w, d.display.h)
                        } // should not happen....
                        if (!is_def(d.display.size)) {
                            d.display.size = 0
                        }
                        return d.display.size + 'px'
                    })
                    .attr('dy', d.display.size / 3 + 'px')
                    .style('opacity', d.display.fill_opacity)
                    .style('stroke-opacity', d.display.fill_opacity)
                    .style('fill-opacity', d.display.fill_opacity)
                    .attr('x', timescale(d.time.start + d.time.duration * 0.5))
                    .attr('y', d.display.y + d.display.h / 2)
            })
        }

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
        //       .attr('transform', 'translate(' + com.blockQueue.axis.box.x + ',' + 0 + ')')
        //
        //     rectNow
        //       .enter()
        //       .append('rect')
        //       .attr('class', com.main.tag + 'extra')
        //       .style('opacity', 1)
        //       .attr('x', function (d, i) {
        //         if (d > com.blockQueue.axis.scale.domain()[1]) return com.blockQueue.axis.scale(com.blockQueue.axis.scale.domain()[1])
        //         else if (d < com.blockQueue.axis.scale.domain()[0]) return com.blockQueue.axis.scale(com.blockQueue.axis.scale.domain()[0])
        //         return com.blockQueue.axis.scale(d)
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
        //         if (d > com.blockQueue.axis.scale.domain()[1]) return com.blockQueue.axis.scale(com.blockQueue.axis.scale.domain()[1])
        //         else if (d < com.blockQueue.axis.scale.domain()[0]) return com.blockQueue.axis.scale(com.blockQueue.axis.scale.domain()[0])
        //         return com.blockQueue.axis.scale(d)
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
                    x: com.blockQueue.axis.scale(com.time.current_time.date),
                    y: com.blockQueue.timeBars.box.y,
                    w: com.blockQueue.timeBars.box.marg,
                    h: com.blockQueue.timeBars.box.h + com.blockQueue.timeBars.box.marg * 2,
                },
            ]
            // console.log('timeFrac',timeFrac,rectNowData);
            // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

            // ------------------------------------------------------------------
            //
            // ------------------------------------------------------------------
            let rectNow = com.blockQueue.timeBars.g
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
            if (com.blockQueue.axis.enabled) {
                com.blockQueue.axis.g.remove()
            }
            if (com.blockQueue.blocks.enabled) {
                com.blockQueue.blocks.clipping.g.remove()
            }
            if (com.blockQueue.timeBars.enabled) {
                com.blockQueue.timeBars.g.remove()
            }
        }
        this.remove = remove
    }
    let block_queue_bib = new BlockQueueBib()
    let BlockListBib = function() {
        function init() {
            com.blockList.g = com.main.g.append('g')
            com.main.scroll.scrollBoxG.select('rect.background')
                .style('fill', 'transparent')
                .style('stroke', 'transparent')
        }
        this.init = init

        function setDefaultStyleForBlocks(blocks) {
            for (let index in blocks) {
                let b = blocks[index]
                let bDisplay = {
                }

                let cols = com.style.blockCol({
                    d: b,
                })

                bDisplay.stroke = cols.stroke
                bDisplay.strokeWidth = 0.5
                bDisplay.fill = cols.background
                bDisplay.fill_opacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeOpacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeDasharray = []
                bDisplay.opacity = b.filtered === true ? 0.05 : 1

                bDisplay.text = cols.text
                bDisplay.patternFill = ''
                bDisplay.patternOpacity = 0
                if (b.sched_block_id === com.input.focus.sched_blocks) {
                    if (!(com.input.over.sched_blocks !== undefined && com.input.over.sched_blocks !== com.input.focus.sched_blocks)) { // b.stroke = color_theme.blocks.critical.background
                        // b.patternFill = 'url(#patternHover)'
                        bDisplay.patternFill = 'url(#patternSelect)'
                        bDisplay.patternOpacity = 1
                    }
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                }
                if (b.sched_block_id === com.input.over.sched_blocks) {
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                    bDisplay.patternFill = 'url(#patternSelect)'
                    bDisplay.patternOpacity = 1
                }
                if (b.obs_block_id === com.input.focus.block) {
                    if (com.input.over.block !== undefined && com.input.over.block !== com.input.focus.block) {
                        bDisplay.strokeDasharray = [ 8, 4 ]
                    }
                    bDisplay.strokeWidth = 6
                    bDisplay.strokeOpacity = 1
                }
                if (b.obs_block_id === com.input.over.block) {
                    bDisplay.strokeWidth = 6
                    bDisplay.strokeOpacity = 1
                    bDisplay.strokeDasharray = []
                }

                b.display = bDisplay
            }
            return blocks
        }
        function groupBlocksBySchedule(blocks) {
            let res = {
            }
            for (var key in blocks) {
                for (var i = 0; i < blocks[key].length; i++) {
                    let ns = blocks[key][i].metadata.n_sched
                    if (ns in res) {
                        res[ns].push(blocks[key][i])
                    }
                    else {
                        res[ns] = [ blocks[key][i] ]
                    }
                }
            }
            let ret = []
            Object.keys(res).map(function(key, index) {
                ret.push({
                    name: key,
                    id: res[key][0].sched_block_id,
                    blocks: res[key],
                })
            })
            return ret
        }

        function update() {
            let scheds = groupBlocksBySchedule(com.data.filtered)
            let nLine = parseInt(scheds.length / 8) + (scheds.length % 8 === 0 ? 0 : 1)
            let width = com.main.box.w / 8
            let height = com.main.box.h / nLine

            updateSchedulingBlocks(scheds)
            for (let i = 0; i < scheds.length; i++) {
                let offsetX = (parseInt(i / 8) + (scheds.length % 8 === 0 ? 0 : 1)) === nLine
                offsetX = offsetX * (com.main.box.w - ((scheds.length % 8) * width)) * 0.5
                let box = {
                    x: offsetX + width * (i % 8),
                    y: (height * parseInt(i / 8)) + height * 0.2,
                    w: width,
                    h: height * 0.75,
                }
                scheds[i].blocks = setDefaultStyleForBlocks(scheds[i].blocks)
                setBlockRect(scheds[i].blocks, box)
            }
        }
        this.update = update
        function updateSchedulingBlocks(scheds) {
            let nLine = parseInt(scheds.length / 8) + (scheds.length % 8 === 0 ? 0 : 1)
            let width = com.main.box.w / 8
            let height = com.main.box.h / nLine

            let allScheds = com.blockList.g
                .selectAll('g.allScheds')
                .data(scheds, function(d) {
                    return d.id
                })
            let enterAllScheds = allScheds
                .enter()
                .append('g')
                .attr('class', 'allScheds')
                .attr('transform', function(d, i) {
                    let offsetX = (parseInt(i / 8) + (scheds.length % 8 === 0 ? 0 : 1)) === nLine
                    offsetX = offsetX * (com.main.box.w - ((scheds.length % 8) * width)) * 0.5
                    let translate = {
                        y: height * parseInt(i / 8),
                        x: offsetX + width * (i % 8),
                    }
                    return 'translate(' + translate.x + ',' + translate.y + ')'
                })
            enterAllScheds.each(function(d, i) {
                d3.select(this).append('rect')
                    .attr('class', 'background')
                    .attr('x', 0 + width * 0.02)
                    .attr('y', 0)
                    .attr('width', width * 0.96)
                    .attr('height', height * 0.96)
                    .attr('fill', 'transparent')
                    .attr('fill-opacity', 1)
                    .attr('stroke', color_theme.medium.stroke)
                    .attr('stroke-width', 0.5)
                    .attr('stroke-dasharray', [])
                    .style('pointer-events', 'none')
                d3.select(this).append('rect')
                    .attr('class', 'titleBackground')
                    .attr('x', 0 + width * 0.02)
                    .attr('y', 0)
                    .attr('width', width * 0.96)
                    .attr('height', height * 0.18)
                    .attr('fill', color_theme.darker.background)
                    .attr('fill-opacity', 0.5)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.5)
                    .attr('stroke-dasharray', [])
                    .on('click', function(e, d) {
                        com.events.sched.click(d)
                    })
                    .on('mouseover', function(e, d) {
                        com.events.sched.mouseover(d)
                    })
                    .on('mouseout', function(e, d) {
                        com.events.sched.mouseout(d)
                    })
                d3.select(this).append('text')
                    .attr('class', 'schedId')
                    .text(d.name)
                    .attr('x', width * 0.5)
                    .attr('y', height * 0.15)
                    .style('font-weight', 'normal')
                    .attr('text-anchor', 'middle')
                    .style('font-size', (12) + 'px')
                    .attr('dy', 0)
                    .style('pointer-events', 'none')
                    .attr('fill', color_theme.darker.text)
                    .attr('stroke', 'none')
            })
            enterAllScheds.merge(allScheds)
                .transition()
                .duration(times.anim)
                .attr('transform', function(d, i) {
                    let offsetX = (parseInt(i / 8) + (scheds.length % 8 === 0 ? 0 : 1)) === nLine
                    offsetX = offsetX * (com.main.box.w - ((scheds.length % 8) * width)) * 0.5
                    let translate = {
                        y: height * parseInt(i / 8),
                        x: offsetX + width * (i % 8),
                    }
                    return 'translate(' + translate.x + ',' + translate.y + ')'
                })
        }
        function setBlockRect(blocks, box) {
            let blocksTemplate = {
                '1': [{
                    x: 0.5,
                    y: 0.5,
                }],
                '2': [{
                    x: 0.3,
                    y: 0.5,
                }, {
                    x: 0.7,
                    y: 0.5,
                }],
                '3': [{
                    x: 0.3,
                    y: 0.3,
                }, {
                    x: 0.7,
                    y: 0.3,
                }, {
                    x: 0.5,
                    y: 0.7,
                }],
                '4': [{
                    x: 0.3,
                    y: 0.3,
                }, {
                    x: 0.7,
                    y: 0.3,
                }, {
                    x: 0.3,
                    y: 0.7,
                }, {
                    x: 0.7,
                    y: 0.7,
                }],
                '5': [{
                    x: 0.3,
                    y: 0.16,
                }, {
                    x: 0.7,
                    y: 0.16,
                }, {
                    x: 0.5,
                    y: 0.5,
                }, {
                    x: 0.3,
                    y: 0.84,
                }, {
                    x: 0.7,
                    y: 0.84,
                }],
                '6': [],
                '7': [],
                '8': [],
                '9': [],
            }
            let dim = Math.min(box.w, box.h) * 0.28
            let minTxtSize = dim * 0.7

            let rect = com.main.scroll.scrollG
                .selectAll('g.' + com.main.tag + 'blocks')
                .data(blocks, function(d) {
                    return d.obs_block_id
                })

            rect.each(function(d, i) {
                d3.select(this)
                    .transition('in_out')
                    .duration(times.anim)
                    .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
                    .attr('opacity', d.display.opacity)
                d3.select(this).select('rect.back')
                    .transition('in_out')
                    .duration(times.anim)
                // .attr('stroke', d.display.stroke)
                // .style('fill', d.display.fill)
                // .style('fill-opacity', 1)
                    .attr('x', box.w * blocksTemplate['' + blocks.length][i].x - (dim * 0.5))
                    .attr('y', box.h * blocksTemplate['' + blocks.length][i].y - (dim * 0.5))
                    .attr('width', dim)
                    .attr('height', dim)
                // .attr('stroke-width', 0.2)
                // .style('stroke-opacity', 1)
                // .style('stroke-dasharray', [])
                // d3.select(this).select('rect.pattern')
                //   .transition('in_out')
                //   .duration(times.anim)
                //   .attr('x', timescale(d.time.start))
                //   .attr('y', d.display.y - 2)
                //   .attr('width', timescale(d.time.end_time_sec) - timescale(d.time.start))
                //   .attr('height', d.display.h)
                //   .style('fill', d.display.patternFill)
                //   .style('fill-opacity', d.display.patternOpacity)
                d3.select(this).select('text')
                    .transition('in_out')
                    .duration(times.anim)
                    .text(d.metadata.n_obs)
                    .style('font-size', minTxtSize + 'px')
                // .attr('dy', d.display.size / 3 + 'px')
                // .style('opacity', d.display.fill_opacity)
                // .style('stroke-opacity', d.display.fill_opacity)
                // .style('fill-opacity', d.display.fill_opacity)
                    .attr('dy', minTxtSize * 0.25)
                    .attr('x', box.w * blocksTemplate['' + blocks.length][i].x)
                    .attr('y', box.h * blocksTemplate['' + blocks.length][i].y)
            })
        }

        function remove() {
            com.main.scroll.scrollBoxG.select('rect.background')
                .style('stroke', com.main.background.stroke)
                .style('fill', com.main.background.fill)
            com.blockList.g.remove()
        }
        this.remove = remove
    }
    let blockListBib = new BlockListBib()
    let BlockFormBib = function() {
        function initScrollBox() {
            com.blockForm.forms.scroll.scrollBoxG = com.blockForm.forms.g.append('g')
            com.blockForm.forms.scroll.scrollBoxG.append('rect')
                .attr('class', 'background')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', com.blockForm.forms.box.w)
                .attr('height', com.blockForm.forms.box.h)
                .style('fill', color_theme.dark.background)
                .style('stroke', com.main.background.stroke)
                .style('stroke-width', com.main.background.strokeWidth)

            com.blockForm.forms.scroll.scrollBox = new ScrollBox()
            com.blockForm.forms.scroll.scrollBox.init({
                tag: 'blockDisplayerFormScroll',
                g_box: com.blockForm.forms.scroll.scrollBoxG,
                box_data: {
                    x: 0,
                    y: 0,
                    w: com.blockForm.forms.box.w,
                    h: com.blockForm.forms.box.h,
                    marg: 0,
                },
                use_relative_coords: true,
                locker: new Locker(),
                lockers: [ 'blockDisplayerFormScroll' + 'update_data' ],
                lock_zoom: {
                    all: 'ScrollBox' + 'zoom',
                    during: 'ScrollBox' + 'zoom_during',
                    end: 'ScrollBox' + 'zoom_end',
                },
                run_loop: new RunLoop({
                    tag: 'inputHistoryScrollBox',
                }),
                can_scroll: true,
                scrollVertical: false,
                scroll_horizontal: true,
                scroll_height: 0,
                scroll_width: com.blockForm.forms.box.w + 0.01,
                background: 'transparent',
                scroll_rec_h: {
                    h: 4,
                },
                scroll_recs: {
                    w: 2,
                },
            })
            com.blockForm.forms.scroll.scrollG = com.blockForm.forms.scroll.scrollBox.get('inner_g')
        }
        function init() {
            com.blockForm.forms.g = com.main.g.append('g')
                .attr('class', 'formsList')
                .attr('transform', 'translate(' + com.blockForm.forms.box.x + ',' + com.blockForm.forms.box.y + ')')
            if (com.blockForm.forms.display === 'list') {
                initScrollBox()
            }
            com.main.scroll.scrollBoxG.select('rect.background')
                .style('fill', 'transparent')
                .style('stroke', 'transparent')
            let blocks = []
            if (com.blockForm.mosaic.order === 'n_sched') {
                let inter = groupBlocksBySchedule(com.data.filtered)
                for (let i = 0; i < inter.length; i++) {
                    blocks = blocks.concat(inter[i].blocks)
                }
            }
            else {
                for (var key in com.data.filtered) {
                    blocks = blocks.concat(com.data.filtered[key])
                }
            }
            set_blocksForm(blocks)
        }
        this.init = init

        function setDefaultStyleForBlocks(blocks) {
            for (let index in blocks) {
                let b = blocks[index]
                let bDisplay = {
                }

                let cols = com.style.blockCol({
                    d: b,
                })

                bDisplay.stroke = cols.stroke
                bDisplay.strokeWidth = 0.5
                bDisplay.fill = cols.background
                bDisplay.fill_opacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeOpacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeDasharray = []
                bDisplay.opacity = b.filtered === true ? 0.05 : 1

                bDisplay.text = cols.text
                bDisplay.patternFill = ''
                bDisplay.patternOpacity = 0
                if (b.sched_block_id === com.input.focus.sched_blocks) {
                    if (!(com.input.over.sched_blocks !== undefined && com.input.over.sched_blocks !== com.input.focus.sched_blocks)) { // b.stroke = color_theme.blocks.critical.background
                        // b.patternFill = 'url(#patternHover)'
                        bDisplay.patternFill = 'url(#patternSelect)'
                        bDisplay.patternOpacity = 1
                    }
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                }
                if (b.sched_block_id === com.input.over.sched_blocks) {
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                    bDisplay.patternFill = 'url(#patternSelect)'
                    bDisplay.patternOpacity = 1
                }
                if (b.obs_block_id === com.input.focus.block) {
                    if (com.input.over.block !== undefined && com.input.over.block !== com.input.focus.block) {
                        bDisplay.strokeDasharray = [ 8, 4 ]
                    }
                    bDisplay.strokeWidth = 6
                    bDisplay.strokeOpacity = 1
                }
                if (b.obs_block_id === com.input.over.block) {
                    bDisplay.strokeWidth = 6
                    bDisplay.strokeOpacity = 1
                    bDisplay.strokeDasharray = []
                }

                b.display = bDisplay
            }
            return blocks
        }
        function groupBlocksBySchedule(blocks) {
            let res = {
            }
            for (var key in blocks) {
                for (var i = 0; i < blocks[key].length; i++) {
                    let ns = blocks[key][i].metadata.n_sched
                    if (ns in res) {
                        res[ns].push(blocks[key][i])
                    }
                    else {
                        res[ns] = [ blocks[key][i] ]
                    }
                }
            }
            let ret = []
            Object.keys(res).map(function(key, index) {
                ret.push({
                    name: key,
                    id: res[key][0].sched_block_id,
                    blocks: res[key],
                })
            })
            return ret
        }

        function update() {
            let blocks = []
            if (com.blockForm.mosaic.order === 'n_sched') {
                let inter = groupBlocksBySchedule(com.data.filtered)
                for (let i = 0; i < inter.length; i++) {
                    blocks = blocks.concat(inter[i].blocks)
                }
            }
            else {
                for (var key in com.data.filtered) {
                    blocks = blocks.concat(com.data.filtered[key])
                }
            }
            let mobox = deep_copy(com.blockForm.mosaic.box)
            mobox.y = mobox.y + mobox.h * 0.15
            mobox.h = mobox.h * 0.85
            blocks = setDefaultStyleForBlocks(blocks)
            setBlockRect(blocks, mobox)
        }
        this.update = update

        function set_blocksForm(blocks) {
            for (var i = 0; i < blocks.length; i++) {
                let bform = new BlockForm({
                    main: {
                        tag: 'blockFormTag' + blocks[i].obs_block_id,
                        g: com.blockForm.forms.scroll.scrollG.append('g'),
                        scroll: {
                        },
                        box: {
                            x: 200 * i,
                            y: 0,
                            w: 190,
                            h: com.blockForm.forms.box.h * 1.0,
                            marg: 0,
                        },
                        background: {
                            fill: color_theme.brighter.background,
                            stroke: color_theme.brighter.stroke,
                            strokeWidth: 0.5,
                        },
                    },
                    data: {
                        block: blocks[i],
                    },
                    debug: {
                        enabled: false,
                    },
                    input: {
                        over: {
                            sched_blocks: undefined,
                            block: undefined,
                        },
                        focus: {
                            sched_blocks: undefined,
                            block: undefined,
                        },
                    },
                })
                bform.update()
            }
            com.blockForm.forms.scroll.scrollBox.reset_horizontal_scroller({
                can_scroll: true,
                scroll_width: 200 * blocks.length,
            })
        }

        function setBlockRect(blocks, box) {
            let cube = Math.sqrt((box.w * box.h) / blocks.length)
            let column = parseInt(box.w / cube)
            let dim = {
                w: box.w / column,
                h: box.h / (parseInt(blocks.length / column) + 1),
            }
            let minTxtSize = dim.h * 0.7

            let rect = com.main.scroll.scrollG
                .selectAll('g.' + com.main.tag + 'blocks')
                .data(blocks, function(d) {
                    return d.obs_block_id
                })

            rect.each(function(d, i) {
                d3.select(this)
                    .transition('in_out')
                    .duration(times.anim)
                    .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
                    .attr('opacity', d => d.display.opacity)
                d3.select(this).select('rect.back')
                    .on('click', function() {
                        let t = (1.0 / parseFloat(blocks.length - 1)) * parseFloat(i)
                        com.blockForm.forms.scroll.scrollBox.move_horizontal_scroller_to(t)
                    })
                    .transition('in_out')
                    .duration(times.anim)
                // .attr('stroke', d.display.stroke)
                // .style('fill', d.display.fill)
                // .style('fill-opacity', 1)
                    .attr('x', dim.w * (i % column) + (dim.w * 0.05))
                    .attr('y', dim.h * parseInt(i / column) + (dim.h * 0.05))
                    .attr('width', dim.w * 0.9)
                    .attr('height', dim.h * 0.9)
                // .attr('stroke-width', 0.2)
                // .style('stroke-opacity', 1)
                // .style('stroke-dasharray', [])
                // d3.select(this).select('rect.pattern')
                //   .transition('in_out')
                //   .duration(times.anim)
                //   .attr('x', timescale(d.time.start))
                //   .attr('y', d.display.y - 2)
                //   .attr('width', timescale(d.time.end_time_sec) - timescale(d.time.start))
                //   .attr('height', d.display.h)
                //   .style('fill', d.display.patternFill)
                //   .style('fill-opacity', d.display.patternOpacity)
                d3.select(this).select('text')
                    .transition('in_out')
                    .duration(times.anim)
                    .text(d.metadata.n_obs)
                    .style('font-size', minTxtSize + 'px')
                // .attr('dy', d.display.size / 3 + 'px')
                // .style('opacity', d.display.fill_opacity)
                // .style('stroke-opacity', d.display.fill_opacity)
                // .style('fill-opacity', d.display.fill_opacity)
                    .attr('dy', minTxtSize * 0.33)
                    .attr('x', dim.w * (i % column) + dim.w * 0.5)
                    .attr('y', dim.h * parseInt(i / column) + dim.h * 0.5)
            })
        }

        function remove() {
            com.blockForm.forms.g.remove()
            com.main.scroll.scrollBoxG.select('rect.background')
                .style('fill', com.main.background.fill)
                .style('stroke', com.main.background.stroke)
        }
        this.remove = remove
    }
    let blockFormBib = new BlockFormBib()
    let BlockQueue2Bib = function() {
        function init() {
            com.blockQueue2.g = com.main.g.append('g')
            initAxis()
            initTimeBars()
        }
        this.init = init
        function initAxis() {
            com.blockQueue2.axis.scale = d3.scaleTime()
                .range(com.blockQueue2.axis.range)
                .domain(com.blockQueue2.axis.domain)
            com.blockQueue2.axis.main = d3.axisBottom(com.blockQueue2.axis.scale)
                .tickFormat(d3.timeFormat('%H:%M'))

            if (!com.blockQueue2.axis.enabled) {
                return
            }
            com.blockQueue2.axis.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.blockQueue2.axis.box.x + ',' + com.blockQueue2.axis.box.y + ')')
            if (!com.blockQueue2.axis.showAxis) {
                return
            }
            com.blockQueue2.axis.g
                .attr('class', 'axis')
                .call(com.blockQueue2.axis.main)
            com.blockQueue2.axis.g.style('opacity', 1)
        }
        function initTimeBars() {
            if (!com.blockQueue2.timeBars.enabled) {
                return
            }
            com.blockQueue2.timeBars.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.blockQueue2.timeBars.box.x + ',' + com.blockQueue2.timeBars.box.y + ')')
            com.blockQueue2.timeBars.g
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .style('opacity', 1)
        }

        function groupBlocksBySchedule(blocks) {
            let res = {
            }
            for (var key in blocks) {
                for (var i = 0; i < blocks[key].length; i++) {
                    let ns = blocks[key][i].metadata.n_sched
                    if (ns in res) {
                        res[ns].push(blocks[key][i])
                    }
                    else {
                        res[ns] = [ blocks[key][i] ]
                    }
                }
            }
            let ret = []
            Object.keys(res).map(function(key, index) {
                ret.push({
                    name: key,
                    id: res[key][0].sched_block_id,
                    blocks: res[key],
                })
            })
            return ret
        }
        function setDefaultStyleForBlocks(blocks) {
            for (let index in blocks) {
                let b = blocks[index]
                let bDisplay = {
                }

                let cols = com.style.blockCol({
                    d: b,
                })

                bDisplay.stroke = cols.stroke
                bDisplay.strokeWidth = 0.5
                bDisplay.fill = cols.background
                bDisplay.fill_opacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeOpacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeDasharray = []
                bDisplay.opacity = b.filtered === true ? 0.05 : 1

                bDisplay.text = cols.text
                bDisplay.patternFill = com.style.blockPattern({
                    d: b,
                })
                bDisplay.patternOpacity = 1
                if (com.input.focus.sched_blocks.indexOf(b.sched_block_id) !== -1) {
                    if (!(com.input.over.sched_blocks !== undefined && com.input.over.sched_blocks !== com.input.focus.sched_blocks)) { // b.stroke = color_theme.blocks.critical.background
                        // b.patternFill = 'url(#patternHover)'
                        bDisplay.patternFill = 'url(#patternSelect)'
                        bDisplay.patternOpacity = 1
                    }
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                }
                if (com.input.over.sched_blocks.indexOf(b.sched_block_id) !== -1) {
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                    bDisplay.patternFill = 'url(#patternSelect)'
                    bDisplay.patternOpacity = 1
                }
                if (com.input.focus.blocks.indexOf(b.obs_block_id) !== -1) {
                    if (com.input.over.block !== undefined && com.input.over.block !== com.input.focus.block) {
                        bDisplay.strokeDasharray = [ 8, 4 ]
                    }
                    bDisplay.strokeWidth = 4
                    bDisplay.strokeOpacity = 1
                }
                if (com.input.over.blocks.indexOf(b.obs_block_id) !== -1) {
                    bDisplay.strokeWidth = 4
                    bDisplay.strokeOpacity = 1
                    bDisplay.strokeDasharray = []
                }

                b.display = bDisplay
            }
            return blocks
        }

        function blockOverlap(b, bs) {
            let ov = bs.filter(function(bb) {
                return blocksIntersect(b, bb)
            })
            if (ov.length === 0) {
                b.nLine = 1
                return 1
            }
            ov = ov.map(function(bb) {
                return blockOverlap(bb, ov.filter(d => d.obs_block_id !== bb.obs_block_id))
            })
            let index = 1 + ov.reduce(function(a, b) {
                return Math.max(a, b)
            })
            b.nLine = index
            return index
        }
        function lineCount(scheds) {
            let tot = 0
            scheds.forEach(function(sc) {
                let size = sc.blocks.map(function(b) {
                    return blockOverlap(b, sc.blocks.filter(d => d.obs_block_id !== b.obs_block_id))
                })
                let res = size.reduce(function(a, b) {
                    return Math.max(a, b)
                })
                tot += res
                sc.nLine = res
            })
            return tot
        }
        function get_line_layout() {
            let scheds = groupBlocksBySchedule(com.data.filtered)
            lineCount(scheds)
            scheds.forEach(d => (d.blocks = d.blocks.map(function(dd) {
                return {
                    obs_block_id: dd.obs_block_id,
                    nLine: dd.nLine,
                }
            })))
            return scheds
        }
        this.get_line_layout = get_line_layout
        function set_line_layout(layout) {
            com.blockQueue2.sched_blocks.layout = layout
        }
        this.set_line_layout = set_line_layout

        function update() {
            if (com.blockQueue2.axis.enabled) {
                updateAxis()
            }
            if (com.blockQueue2.timeBars.enabled) {
                setTimeRect()
            }

            updateSchedulingBlocks()
            setTimeRect()
        }
        this.update = update
        function updateAxis() {
            com.blockQueue2.axis.domain = [ com.time.start_time_sec.date, com.time.end_time_sec.date ]
            com.blockQueue2.axis.range = [ 0, com.blockQueue2.axis.box.w ]

            com.blockQueue2.axis.scale
                .domain(com.blockQueue2.axis.domain)
                .range(com.blockQueue2.axis.range)

            if (!com.blockQueue2.axis.enabled) {
                return
            }
            let minTxtSize = com.blockQueue2.axis.attr.text.size ? com.blockQueue2.axis.attr.text.size : com.main.box.w * 0.04
            // console.log(com.blockQueue2.axis.domain, com.blockQueue2.axis.range);
            com.blockQueue2.axis.main.scale(com.blockQueue2.axis.scale)
            if (!com.blockQueue2.axis.showAxis) {
                return
            }
            com.blockQueue2.axis.main.ticks(5)
            com.blockQueue2.axis.main.tickSize(4)
            com.blockQueue2.axis.g.call(com.blockQueue2.axis.main)
            com.blockQueue2.axis.g.select('path').attr('stroke-width', 1.5).attr('stroke', com.blockQueue2.axis.attr.path.stroke)
            com.blockQueue2.axis.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 1.5).attr('stroke', com.blockQueue2.axis.attr.path.stroke)
            com.blockQueue2.axis.g.selectAll('g.tick').selectAll('text')
                .attr('stroke', com.blockQueue2.axis.attr.text.stroke)
                .attr('stroke-width', 0.3)
                .attr('fill', com.blockQueue2.axis.attr.text.fill)
                .style('font-size', minTxtSize + 'px')
        }
        function updateSchedulingBlocks() {
            let scheds = groupBlocksBySchedule(com.data.filtered)
            let nLine = 0
            if (com.blockQueue2.sched_blocks.layout) {
                com.blockQueue2.sched_blocks.layout.forEach(function(layout) {
                    let sched = scheds.filter(d => d.id === layout.id)[0]
                    nLine += layout.nLine
                    if (!sched) {
                        return
                    }
                    sched.nLine = layout.nLine
                    sched.blocks.forEach(function(dd) {
                        dd.nLine = layout.blocks.filter(ddd => dd.obs_block_id === ddd.obs_block_id)[0].nLine
                    })
                })
            }
            else {
                nLine = lineCount(scheds)
            }

            let height = com.main.box.h / nLine

            let mainOffset = 0
            let allScheds = com.main.g
                .selectAll('g.allScheds')
                .data(scheds, function(d) {
                    return d.id
                })
            let enterAllScheds = allScheds
                .enter()
                .append('g')
                .attr('class', 'allScheds')
                .attr('transform', function(d, i) {
                    let translate = {
                        y: height * mainOffset,
                        x: 0,
                    }
                    mainOffset += d.nLine
                    return 'translate(' + translate.x + ',' + translate.y + ')'
                })
            let min_x = com.blockQueue2.sched_blocks.label.position === 'left' ? -2 : com.main.box.w + 2
            let maxWidth = 0
            enterAllScheds.each(function(d, i) {
                d3.select(this).append('line')
                    .attr('class', 'background')
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('x2', com.main.box.w)
                    .attr('y2', 0)
                    .attr('fill', 'transparent')
                    .attr('fill-opacity', 1)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.1)
                    .attr('stroke-dasharray', [ 2, 1 ])
                if (com.blockQueue2.sched_blocks.label.enabled) {
                    if (com.blockQueue2.sched_blocks.label.clickable) {
                        d3.select(this).append('polygon')
                            .attr('fill', color_theme.dark.background)
                            .attr('stroke', color_theme.dark.stroke)
                            .attr('stroke-width', 0.2)
                            .on('click', function() {
                                com.events.sched.click('sched_block', d.id)
                            })
                            .on('mouseover', function() {
                                d3.select(this).attr('fill', com.main.color_theme.darker.background)
                                com.events.sched.mouseover('sched_block', d.id)
                            })
                            .on('mouseout', function() {
                                d3.select(this).attr('fill', color_theme.dark.background)
                                com.events.sched.mouseout('sched_block', d.id)
                            })
                    }
                    d3.select(this).append('text')
                        .attr('class', 'schedId')
                        .text('S' + d.name)
                        .attr('x', com.blockQueue2.sched_blocks.label.position === 'left' ? -2 : com.main.box.w + 2)
                        .attr('y', height * 0.75)
                        .style('font-weight', 'normal')
                        .attr('text-anchor', com.blockQueue2.sched_blocks.label.position === 'left' ? 'end' : 'start')
                        .style('font-size', (12) + 'px')
                        .style('pointer-events', 'none')
                        .attr('fill', color_theme.darker.text)
                        .attr('stroke', 'none')
                }
            })

            mainOffset = 0
            enterAllScheds.merge(allScheds)
                .transition()
                .duration(times.anim)
                .each(function(d, i) {
                    let translate = {
                        y: height * mainOffset,
                        x: 0,
                    }
                    d3.select(this).attr('transform', 'translate(' + translate.x + ',' + translate.y + ')')
                    d.blocks = setDefaultStyleForBlocks(d.blocks)
                    setBlockRect(d.blocks, {
                        x: 0,
                        y: (height * mainOffset),
                        w: com.main.box.w,
                        h: height,
                    })

                    let ww = com.blockQueue2.sched_blocks.label.size ? com.blockQueue2.sched_blocks.label.size : maxWidth
                    ww = com.blockQueue2.sched_blocks.label.position === 'left' ? -ww : ww
                    let poly = [
                        {
                            x: min_x,
                            y: 1,
                        },
                        {
                            x: min_x + ww * 0.85,
                            y: 1,
                        },

                        {
                            x: min_x + ww,
                            y: (height * d.nLine) * 0.3,
                        },
                        {
                            x: min_x + ww,
                            y: (height * d.nLine) * 0.7,
                        },

                        {
                            x: min_x + ww * 0.85,
                            y: (height * d.nLine) - 1,
                        },
                        {
                            x: min_x,
                            y: (height * d.nLine) - 1,
                        },
                    ]
                    d3.select(this).select('polygon')
                        .attr('points', function() {
                            return poly.map(function(d) {
                                return [ d.x, d.y ].join(',')
                            }).join(' ')
                        })
                    d3.select(this).select('text.schedId')
                        .attr('y', (height * d.nLine) * 0.5 + (16 * 0.25))
                        .style('font-size', (16) + 'px')
                    mainOffset += d.nLine
                })
            allScheds.exit().remove()
        }
        function setBlockRect(blocks, box) {
            let timescale = d3.scaleLinear()
                .range(com.blockQueue2.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])

            let rect = com.main.scroll.scrollG
                .selectAll('g.' + com.main.tag + 'blocks')
                .data(blocks, function(d) {
                    return d.obs_block_id
                })
            rect.each(function(d, i) {
                d3.select(this)
                    .transition('in_out')
                    .duration(0)
                    .attr('transform', 'translate(' + box.x + ',' + (box.y + ((d.nLine - 1) * box.h)) + ')')
                    .attr('opacity', d => d.display.opacity)
                d3.select(this).select('rect.back')
                    .transition('in_out')
                    .duration(0)
                    .ease(d3.easeLinear)
                    .attr('x', timescale(d.time.start))
                    .attr('y', 0)
                    .attr('width', (timescale(d.time.end) - timescale(d.time.start)) - d.display.strokeWidth * 0.5)
                    .attr('height', box.h - d.display.strokeWidth * 0.5)
                    .style('fill', d.display.fill)
                    .style('fill-opacity', d.display.fill_opacity)
                    .attr('stroke-width', d.display.strokeWidth)
                    .style('stroke-opacity', d.display.strokeOpacity)
                    .style('stroke-dasharray', d.display.strokeDasharray)
                d3.select(this).select('rect.pattern')
                    .transition('in_out')
                    .duration(0)
                    .attr('x', timescale(d.time.start))
                    .attr('y', 0)
                    .attr('width', (timescale(d.time.end) - timescale(d.time.start)) - d.display.strokeWidth * 0.5)
                    .attr('height', box.h - d.display.strokeWidth * 0.5)
                    .style('fill', d.display.patternFill)
                    .style('fill-opacity', d.display.patternOpacity)
                d3.select(this).select('text')
                    .transition('in_out')
                    .duration(0)
                    .text(d.metadata.n_obs)
                    .style('font-size', (box.h * 0.5) + 'px')
                    .attr('dy', 1)
                    .attr('x', timescale(d.time.start) + (timescale(d.time.end) - timescale(d.time.start)) * 0.5)
                    .attr('y', (box.h * 0.5))
                    .style('opacity', d.display.fill_opacity)
                    .style('stroke-opacity', d.display.fill_opacity)
                    .style('fill-opacity', d.display.fill_opacity)
            })
        }

        function highlightBlocks(blocks) {
            com.input.over.blocks = blocks.map(d => d.obs_block_id)
            updateSchedulingBlocks()
        }
        this.highlightBlocks = highlightBlocks
        function get_block_rows() {
            let timescale = d3.scaleLinear()
                .range(com.blockQueue2.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])
            let scheds = groupBlocksBySchedule(com.data.filtered)
            let nLine = scheds.length
            let height = com.main.box.h / nLine

            let ret = []
            for (let i = 0; i < scheds.length; i++) {
                for (let j = 0; j < scheds[i].blocks.length; j++) {
                    let translate = {
                        y: height * i,
                        x: 0,
                    }
                    ret.push({
                        y: translate.y,
                        x: timescale(scheds[i].blocks[j].time.start),
                        h: height,
                        w: timescale(scheds[i].blocks[j].time.end) - timescale(scheds[i].blocks[j].time.start),
                        block: scheds[i].blocks[j],
                    })
                }
            }
            return ret
        }
        this.get_block_rows = get_block_rows

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
        //       .attr('transform', 'translate(' + com.blockQueue2.axis.box.x + ',' + 0 + ')')
        //
        //     rectNow
        //       .enter()
        //       .append('rect')
        //       .attr('class', com.main.tag + 'extra')
        //       .style('opacity', 1)
        //       .attr('x', function (d, i) {
        //         if (d > com.blockQueue2.axis.scale.domain()[1]) return com.blockQueue2.axis.scale(com.blockQueue2.axis.scale.domain()[1])
        //         else if (d < com.blockQueue2.axis.scale.domain()[0]) return com.blockQueue2.axis.scale(com.blockQueue2.axis.scale.domain()[0])
        //         return com.blockQueue2.axis.scale(d)
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
        //         if (d > com.blockQueue2.axis.scale.domain()[1]) return com.blockQueue2.axis.scale(com.blockQueue2.axis.scale.domain()[1])
        //         else if (d < com.blockQueue2.axis.scale.domain()[0]) return com.blockQueue2.axis.scale(com.blockQueue2.axis.scale.domain()[0])
        //         return com.blockQueue2.axis.scale(d)
        //       })
        //       // .attr("y", function(d,i) { return d.y; })
        //       .attr('width', function (d, i) {
        //         return com.main.box.marg
        //       })
        //   }
        // }
        function setTimeRect() {
            if (!com.blockQueue2.timeBars.enabled) {
                return
            }
            let rectNowData = []

            rectNowData = [
                {
                    id: com.main.tag + 'now',
                    x: com.blockQueue2.axis.scale(com.time.current_time.date),
                    y: com.blockQueue2.timeBars.box.y,
                    w: com.blockQueue2.timeBars.box.marg * 0.25,
                    h: com.blockQueue2.timeBars.box.h + com.blockQueue2.timeBars.box.marg * 2,
                },
            ]
            // console.log('timeFrac',timeFrac,rectNowData);
            // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

            // ------------------------------------------------------------------
            //
            // ------------------------------------------------------------------
            let rectNow = com.blockQueue2.timeBars.g
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
            // .transition('in_out')
            // .duration(times.anim)
                .attr('x', function(d, i) {
                    if (d.x < 0) {
                        return 0
                    }
                    if (d.x > com.blockQueue2.axis.box.w) {
                        return com.blockQueue2.axis.box.w
                    }
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
            com.blockQueue2.g.remove()
            com.main.g.selectAll('g.allScheds').remove()
            if (com.blockQueue2.axis.enabled) {
                com.blockQueue2.axis.g.remove()
            }
            if (com.blockQueue2.timeBars.enabled) {
                com.blockQueue2.timeBars.g.remove()
            }
        }
        this.remove = remove
    }
    let blockQueue2Bib = new BlockQueue2Bib()
    let BlockTrackShrinkBib = function() {
        function init() {
            com.blockTrackShrink.g = com.main.g.append('g')
            initAxis()
            initTimeBars()
        }
        this.init = init
        function initAxis() {
            com.blockTrackShrink.axis.scale = d3.scaleTime()
                .range(com.blockTrackShrink.axis.range)
                .domain(com.blockTrackShrink.axis.domain)
            com.blockTrackShrink.axis.main = com.blockTrackShrink.axis.orientation === 'bottom' ? d3.axisBottom(com.blockTrackShrink.axis.scale) : d3.axisTop(com.blockTrackShrink.axis.scale)

            com.blockTrackShrink.axis.main.tickFormat(d3.timeFormat('%H:%M'))

            if (!com.blockTrackShrink.axis.enabled) {
                return
            }
            com.blockTrackShrink.axis.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.blockTrackShrink.axis.box.x + ',' + com.blockTrackShrink.axis.box.y + ')')
            com.blockTrackShrink.axis.g
                .attr('class', 'axis')
                .call(com.blockTrackShrink.axis.main)

            com.blockTrackShrink.axis.g.style('opacity', 1)
        }
        function initTimeBars() {
            if (!com.blockTrackShrink.timeBars.enabled) {
                return
            }
            com.blockTrackShrink.timeBars.g = com.main.g.append('g')
                .attr('transform', 'translate(' + com.blockTrackShrink.timeBars.box.x + ',' + com.blockTrackShrink.timeBars.box.y + ')')
            com.blockTrackShrink.timeBars.g
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .style('opacity', 1)
        }

        function groupBlocksBySchedule(blocks) {
            let res = {
            }
            for (var key in blocks) {
                for (var i = 0; i < blocks[key].length; i++) {
                    let ns = blocks[key][i].metadata.n_sched
                    if (ns in res) {
                        res[ns].push(blocks[key][i])
                    }
                    else {
                        res[ns] = [ blocks[key][i] ]
                    }
                }
            }
            let ret = []
            Object.keys(res).map(function(key, index) {
                ret.push({
                    name: key,
                    id: res[key][0].sched_block_id,
                    blocks: res[key],
                })
            })
            return ret
        }
        function setDefaultStyleForBlocks(blocks) {
            for (let index in blocks) {
                let b = blocks[index]
                let bDisplay = {
                }

                let cols = com.style.blockCol({
                    d: b,
                })

                bDisplay.stroke = cols.stroke
                bDisplay.strokeWidth = 0.5
                bDisplay.fill = cols.background
                bDisplay.fill_opacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeOpacity = com.style.blockOpac({
                    d: b,
                })
                bDisplay.strokeDasharray = []
                bDisplay.opacity = b.filtered === true ? 0.05 : 1

                bDisplay.text = cols.text
                bDisplay.patternFill = ''
                bDisplay.patternOpacity = 0
                if (b.sched_block_id === com.input.focus.sched_blocks) {
                    if (!(com.input.over.sched_blocks !== undefined && com.input.over.sched_blocks !== com.input.focus.sched_blocks)) { // b.stroke = color_theme.blocks.critical.background
                        // b.patternFill = 'url(#patternHover)'
                        bDisplay.patternFill = 'url(#patternSelect)'
                        bDisplay.patternOpacity = 1
                    }
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                }
                if (b.sched_block_id === com.input.over.sched_blocks) {
                    bDisplay.strokeWidth = 1
                    bDisplay.strokeOpacity = 1
                    // b.strokeDasharray = [2, 2]
                    bDisplay.patternFill = 'url(#patternSelect)'
                    bDisplay.patternOpacity = 1
                }
                if (b.obs_block_id === com.input.focus.block) {
                    if (com.input.over.block !== undefined && com.input.over.block !== com.input.focus.block) {
                        bDisplay.strokeDasharray = [ 8, 4 ]
                    }
                    bDisplay.strokeWidth = 6
                    bDisplay.strokeOpacity = 1
                }
                if (b.obs_block_id === com.input.over.block) {
                    bDisplay.strokeWidth = 6
                    bDisplay.strokeOpacity = 1
                    bDisplay.strokeDasharray = []
                }

                b.display = bDisplay
            }
            return blocks
        }

        function update() {
            updateAxis()
            if (com.blockTrackShrink.timeBars.enabled) {
                setTimeRect()
            }

            updateSchedulingBlocks()
        }
        this.update = update
        function updateAxis() {
            com.blockTrackShrink.axis.domain = [ com.time.start_time_sec.date, com.time.end_time_sec.date ]
            com.blockTrackShrink.axis.range = [ 0, com.blockTrackShrink.axis.box.w ]

            com.blockTrackShrink.axis.scale
                .domain(com.blockTrackShrink.axis.domain)
                .range(com.blockTrackShrink.axis.range)
            // .nice()

            if (!com.blockTrackShrink.axis.enabled) {
                return
            }
            let minTxtSize = com.blockTrackShrink.axis.attr.text.size ? com.blockTrackShrink.axis.attr.text.size : com.main.box.w * 0.04
            // console.log(com.blockTrackShrink.axis.domain, com.blockTrackShrink.axis.range);
            com.blockTrackShrink.axis.main.scale(com.blockTrackShrink.axis.scale)
            com.blockTrackShrink.axis.main.ticks(5)
            com.blockTrackShrink.axis.main.tickSize(4)

            com.blockTrackShrink.axis.g.select('path').attr('stroke-width', 0.5).attr('stroke', com.blockTrackShrink.axis.attr.path.stroke)
            com.blockTrackShrink.axis.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 0.5).attr('stroke', com.blockTrackShrink.axis.attr.path.stroke)
            com.blockTrackShrink.axis.g.selectAll('g.tick').selectAll('text')
                .attr('stroke', com.blockTrackShrink.axis.attr.text.stroke)
                .attr('stroke-width', 0.2)
                .attr('fill', com.blockTrackShrink.axis.attr.text.fill)
                .style('font-size', minTxtSize + 'px')
        }
        function computeTrack(scheds) {
            let track = []
            for (let i = 0; i < scheds.length; i++) {
                let startT
                let endT
                for (let j = 0; j < scheds[i].blocks.length; j++) {
                    if (startT === undefined || scheds[i].blocks[j].time.start < startT) {
                        startT = scheds[i].blocks[j].time.start
                    }
                    if (endT === undefined || scheds[i].blocks[j].time.end > endT) {
                        endT = scheds[i].blocks[j].time.end
                    }
                }
                let insert = false
                for (let j = 0; j < track.length; j++) {
                    if (track[j] + 3600 < startT) {
                        scheds[i].track = j
                        scheds[i].startT = startT
                        scheds[i].endT = endT
                        track[j] = endT
                        insert = true
                        break
                    }
                }
                if (!insert) {
                    track.push(endT)
                    scheds[i].startT = startT
                    scheds[i].endT = endT
                    scheds[i].track = track.length - 1
                }
            }

            return track
        }
        function updateSchedulingBlocks() {
            let timescale = d3.scaleLinear()
                .range(com.blockTrackShrink.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])

            let scheds = groupBlocksBySchedule(com.data.filtered)
            let tracks = computeTrack(scheds)

            let nLine = tracks.length
            let height = nLine >= 13 ? (com.main.box.h / nLine) : (com.main.box.h / 13)
            let offsetY = nLine >= 13 ? 0 : (com.main.box.h - ((com.main.box.h / 13) * nLine)) / (nLine - 1)

            let currentTrack = com.main.scroll.scrollG
                .selectAll('g.track')
                .data(tracks, function(d, i) {
                    return i
                })
            let enterTrack = currentTrack
                .enter()
                .append('g')
                .attr('class', 'track')
                .attr('transform', function(d, i) {
                    let translate = {
                        y: height + (offsetY + height) * i,
                        x: 0,
                    }
                    return 'translate(' + translate.x + ',' + translate.y + ')'
                })
            enterTrack.each(function(d, i) {
                d3.select(this).append('line')
                    .attr('class', 'background')
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('x2', com.main.box.w)
                    .attr('y2', 0)
                    .attr('fill', 'transparent')
                    .attr('stroke-opacity', 1)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.2)
                    .attr('stroke-dasharray', [ 2, 2 ])
            })
            enterTrack.merge(currentTrack)
                .transition()
                .duration(times.anim)
                .ease(d3.easeLinear)
                .attr('transform', function(d, i) {
                    let translate = {
                        y: height + (offsetY + height) * i,
                        x: 0,
                    }
                    return 'translate(' + translate.x + ',' + translate.y + ')'
                })

            let allScheds = com.main.scroll.scrollG
                .selectAll('g.allScheds')
                .data(scheds, function(d) {
                    return d.id
                })
            let enterAllScheds = allScheds
                .enter()
                .append('g')
                .attr('class', 'allScheds')
                .attr('transform', function(d, i) {
                    let translate = {
                        y: (offsetY + height) * d.track,
                        x: 0,
                    }
                    return 'translate(' + translate.x + ',' + translate.y + ')'
                })
            enterAllScheds.each(function(d, i) {
                if (com.blockTrackShrink.sched_blocks.label.enabled) {
                    // d3.select(this).append('line')
                    //   .attr('id', 'aesthetic')
                    //   .attr('x1', timescale(d.startT))
                    //   .attr('y1', height * 0.45)
                    //   .attr('x2', timescale(d.endT))
                    //   .attr('y2', height * 0.45)
                    //   .attr('fill', 'transparent')
                    //   .attr('fill-opacity', 1)
                    //   .attr('stroke', color_theme.dark.stroke)
                    //   .attr('stroke-width', height * 0.05)
                    //   .attr('stroke-dasharray', [])
                    d3.select(this).append('text')
                        .attr('id', 'schedId')
                        .text('S' + d.name)
                        .attr('x', function() {
                            if (com.blockTrackShrink.sched_blocks.label.position === 'left') {
                                return (timescale(d.startT)) - 5
                            }
                            else if (com.blockTrackShrink.sched_blocks.label.position === 'right') {
                                return (timescale(d.endT)) + 5
                            }
                            // if (d.startT < com.time.start_time_sec.time) {
                            //   if (d.endT > com.time.end_time_sec.time) return (timescale(com.time.start_time_sec.time)) + 5
                            //   else return (timescale(d.endT)) + 5
                            // } else if (d.endT > com.time.end_time_sec.time) {
                            //   if (d.startT < com.time.start_time_sec.time) return (timescale(com.time.start_time_sec.time)) + 5
                            //   else return (timescale(d.startT)) - 5
                            // }
                            // return (timescale(d.startT)) - 5
                        })
                        .attr('y', height * 0.75)
                        .style('font-weight', 'bold')
                        .attr('text-anchor', function() {
                            if (d.startT < com.time.start_time_sec.time) {
                                return 'start'
                            }
                            else if (d.endT > com.time.end_time_sec.time) {
                                return 'end'
                            }
                            return 'end'
                        })
                        .style('font-size', Math.max(6, Math.min(18, height * 0.5)) + 'px')
                        .style('pointer-events', 'none')
                        .attr('fill', '#000000')
                        .attr('stroke', 'none')
                }
            })
            enterAllScheds.merge(allScheds)
                .each(function(d, i) {
                    d.blocks = setDefaultStyleForBlocks(d.blocks)
                    setBlockRect(d.blocks, {
                        x: 0,
                        y: (offsetY + height) * d.track,
                        w: com.main.box.w,
                        h: height * 1.0,
                    })

                    d3.select(this).select('line#aesthetic')
                        .transition()
                        .duration(times.anim)
                        .ease(d3.easeLinear)
                        .attr('x1', timescale(d.startT))
                        .attr('y1', height * 0.45)
                        .attr('x2', timescale(d.endT))
                        .attr('y2', height * 0.45)
                    d3.select(this).select('text#schedId')
                        .transition()
                        .duration(times.anim)
                        .ease(d3.easeLinear)
                        .style('font-size', Math.max(6, Math.min(18, height * 0.5)) + 'px')
                        .attr('x', function() {
                            if (com.blockTrackShrink.sched_blocks.label.position === 'left') {
                                return (timescale(d.startT)) - 5
                            }
                            else if (com.blockTrackShrink.sched_blocks.label.position === 'right') {
                                return (timescale(d.endT)) + 5
                            }
                            // if (d.startT < com.time.start_time_sec.time) {
                            //   if (d.endT > com.time.end_time_sec.time) return (timescale(com.time.start_time_sec.time)) + 5
                            //   else return (timescale(d.endT)) + 5
                            // } else if (d.endT > com.time.end_time_sec.time) {
                            //   if (d.startT < com.time.start_time_sec.time) return (timescale(com.time.start_time_sec.time)) + 5
                            //   else return (timescale(d.startT)) - 5
                            // }
                            // return (timescale(d.startT)) - 5
                        })
                        .attr('text-anchor', function() {
                            if (com.blockTrackShrink.sched_blocks.label.position === 'left') {
                                return 'end'
                            }
                            else if (com.blockTrackShrink.sched_blocks.label.position === 'right') {
                                return 'start'
                            }
                            // if (d.startT < com.time.start_time_sec.time) {
                            //   return 'start'
                            // } else if (d.endT > com.time.end_time_sec.time) {
                            //   return 'end'
                            // }
                            return 'end'
                        })
                    // .attr('opacity', ((d.startT > com.time.end_time_sec.time) || (d.endT < com.time.start_time_sec.time)) ? 0 : 1)
                    d3.select(this)
                        .transition()
                        .duration(times.anim)
                        .ease(d3.easeLinear)
                        .attr('transform', function(d, i) {
                            let translate = {
                                y: (offsetY + height) * d.track,
                                x: 0,
                            }
                            return 'translate(' + translate.x + ',' + translate.y + ')'
                        })
                })
        }
        function setBlockRect(blocks, box) {
            let timescale = d3.scaleLinear()
                .range(com.blockTrackShrink.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])

            let rect = com.main.scroll.scrollG
                .selectAll('g.' + com.main.tag + 'blocks')
                .data(blocks, function(d) {
                    return d.obs_block_id
                })

            rect.each(function(d, i) {
                d3.select(this)
                    .transition('in_out')
                    .duration(times.anim)
                    .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
                    .attr('opacity', d => d.display.opacity)
                d3.select(this).select('rect.back')
                    .transition('in_out')
                    .duration(times.anim)
                    .ease(d3.easeLinear)
                    .attr('x', timescale(d.time.start))
                    .attr('y', 0)
                    .attr('width', timescale(d.time.end) - timescale(d.time.start))
                    .attr('height', box.h)
                    .style('fill', d.display.fill)
                    .style('fill-opacity', d.display.fill_opacity)
                    .attr('stroke-width', d.display.strokeWidth)
                    .style('stroke-opacity', d.display.strokeOpacity)
                    .style('stroke-dasharray', d.display.strokeDasharray)
                d3.select(this).select('rect.pattern')
                    .transition('in_out')
                    .duration(times.anim)
                    .attr('x', timescale(d.time.start))
                    .attr('y', 0)
                    .attr('width', timescale(d.time.end) - timescale(d.time.start))
                    .attr('height', box.h)
                    .style('fill', d.display.patternFill)
                    .style('fill-opacity', d.display.patternOpacity)
                d3.select(this).select('text')
                    .transition('in_out')
                    .duration(times.anim)
                    .ease(d3.easeLinear)
                    .text(d.metadata.n_obs)
                    .style('font-size', (box.h * 0.5) + 'px')
                    .attr('dy', 1)
                    .attr('x', timescale(d.time.start) + (timescale(d.time.end) - timescale(d.time.start)) * 0.5)
                    .attr('y', (box.h * 0.5))
                    .style('opacity', d.display.fill_opacity)
                    .style('stroke-opacity', d.display.fill_opacity)
                    .style('fill-opacity', d.display.fill_opacity)
            })
        }

        function highlightBlocks(blocks) {
            com.input.over.block = blocks[0]
            updateSchedulingBlocks()
        }
        this.highlightBlocks = highlightBlocks
        function get_block_rows() {
            let timescale = d3.scaleLinear()
                .range(com.blockTrackShrink.axis.range)
                .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])
            let scheds = groupBlocksBySchedule(com.data.filtered)
            let nLine = scheds.length
            let height = com.main.box.h / nLine

            let ret = []
            for (let i = 0; i < scheds.length; i++) {
                for (let j = 0; j < scheds[i].blocks.length; j++) {
                    let translate = {
                        y: height * i,
                        x: 0,
                    }
                    ret.push({
                        y: translate.y,
                        x: timescale(scheds[i].blocks[j].time.start),
                        h: height,
                        w: timescale(scheds[i].blocks[j].time.end_time_sec) - timescale(scheds[i].blocks[j].time.start),
                        block: scheds[i].blocks[j],
                    })
                }
            }
            return ret
        }
        this.get_block_rows = get_block_rows

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
        //       .attr('transform', 'translate(' + com.blockTrackShrink.axis.box.x + ',' + 0 + ')')
        //
        //     rectNow
        //       .enter()
        //       .append('rect')
        //       .attr('class', com.main.tag + 'extra')
        //       .style('opacity', 1)
        //       .attr('x', function (d, i) {
        //         if (d > com.blockTrackShrink.axis.scale.domain()[1]) return com.blockTrackShrink.axis.scale(com.blockTrackShrink.axis.scale.domain()[1])
        //         else if (d < com.blockTrackShrink.axis.scale.domain()[0]) return com.blockTrackShrink.axis.scale(com.blockTrackShrink.axis.scale.domain()[0])
        //         return com.blockTrackShrink.axis.scale(d)
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
        //         if (d > com.blockTrackShrink.axis.scale.domain()[1]) return com.blockTrackShrink.axis.scale(com.blockTrackShrink.axis.scale.domain()[1])
        //         else if (d < com.blockTrackShrink.axis.scale.domain()[0]) return com.blockTrackShrink.axis.scale(com.blockTrackShrink.axis.scale.domain()[0])
        //         return com.blockTrackShrink.axis.scale(d)
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
                    x: com.blockTrackShrink.axis.scale(com.time.current_time.date),
                    y: com.blockTrackShrink.timeBars.box.y,
                    w: com.blockTrackShrink.timeBars.box.marg,
                    h: com.blockTrackShrink.timeBars.box.h + com.blockTrackShrink.timeBars.box.marg * 2,
                },
            ]
            // console.log('timeFrac',timeFrac,rectNowData);
            // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

            // ------------------------------------------------------------------
            //
            // ------------------------------------------------------------------
            let rectNow = com.blockTrackShrink.timeBars.g
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
            com.blockTrackShrink.g.remove()
            com.main.g.selectAll('g.allScheds').remove()
            if (com.blockTrackShrink.axis.enabled) {
                com.blockTrackShrink.axis.g.remove()
            }
            if (com.blockTrackShrink.timeBars.enabled) {
                com.blockTrackShrink.timeBars.g.remove()
            }
        }
        this.remove = remove
    }
    let blockTrackShrinkBib = new BlockTrackShrinkBib()

    function init() {
        setDefaultStyle()
        initScrollBox()
        // this.initBackground()

        if (com.displayer === 'blockQueue') {
            block_queue_bib.init()
        }
        else if (com.displayer === 'blockList') {
            block_queue_bib.init()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.init()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.init()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.init()
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
            tag: ntag,
            g_box: com.main.scroll.scrollBoxG,
            box_data: {
                x: 0,
                y: 0,
                w: com.main.box.w,
                h: com.main.box.h,
            },
            use_relative_coords: true,
            locker: new Locker(),
            lockers: [ 'blockDisplayerScroll' + 'update_data' ],
            lock_zoom: {
                all: 'blockDisplayerScroll' + 'zoom',
                during: 'blockDisplayerScroll' + 'zoom_during',
                end: 'blockDisplayerScroll' + 'zoom_end',
            },
            run_loop: new RunLoop({
                tag: 'blockDisplayerScroll',
            }),
            can_scroll: true,
            scrollVertical: false,
            scroll_horizontal: true,
            scroll_height: 0,
            scroll_width: 0,
            background: 'transparent',
            scroll_rec_h: {
                h: 2,
            },
            scroll_recs: {
                w: 2,
            },
        })
        com.main.scroll.scrollG = com.main.scroll.scrollBox.get('inner_g')
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
        stats.tot = com.data.raw.blocks.done.length + com.data.raw.blocks.wait.length + com.data.raw.blocks.run.length
        // separate block according to states
        for (var z = 0; z < com.data.raw.blocks.done.length; z++) {
            let data_now = com.data.raw.blocks.done[z]
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

        filtered.wait = com.data.raw.blocks.wait.map(function(data_now) {
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
        filtered.run = com.data.raw.blocks.run.map(function(data_now) {
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

    // function clickcancel () {
    //   var dispatcher = d3.dispatch('click', 'dblclick');
    //   function cc (selection) {
    //     var down
    //     var tolerance = 5
    //     var last
    //     var wait = null
    //     var args
    //     function dist (a, b) {
    //       return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2))
    //     }
    //     selection.on('mousedown', function () {
    //       console.log('mousedown');
    //       down = d3.mouse(document.body)
    //       last = +new Date()
    //       args = arguments
    //     })
    //     selection.on('mouseup', function () {
    //       console.log('mouseup');
    //       if (dist(down, d3.mouse(document.body)) > tolerance) {
    //         return
    //       } else {
    //         if (wait) {
    //           window.clearTimeout(wait)
    //           wait = null
    //           dispatcher.apply('dblclick', this, args)
    //         } else {
    //           wait = window.setTimeout((function () {
    //             return function () {
    //               dispatcher.apply('click', this, args)
    //               wait = null
    //             }
    //           })(), 300)
    //         }
    //       }
    //     })
    //   }
    //   var d3rebind = function (target, source) {
    //     var i = 1
    //     var n = arguments.length
    //     var method
    //     while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method])
    //     return target
    //   }
    //
    //   // Method is assumed to be a standard D3 getter-setter:
    //   // If passed with no arguments, gets the value.
    //   // If passed with arguments, sets the value and returns the target.
    //   function d3_rebind (target, source, method) {
    //     return function () {
    //       var value = method.apply(source, arguments)
    //       return value === source ? target : value
    //     }
    //   }
    //   return d3rebind(cc, dispatcher, 'on')
    // }
    // .call(cc)
    // var cc = clickcancel()
    // cc.on('click', function (d, index) {
    //   console.log('click')
    // })
    // cc.on('dblclick', function (d, index) {
    //   console.log('dbclick')
    // })

    function createBlocksGroup() {
        let all_obs_blocks = [].concat(com.data.filtered.done)
            .concat(com.data.filtered.run)
            .concat(com.data.filtered.cancel)
            .concat(com.data.filtered.wait)
            .concat(com.data.filtered.fail)

        let rect = com.main.scroll.scrollG
            .selectAll('g.' + com.main.tag + 'blocks')
            .data(all_obs_blocks, function(d) {
                return d.obs_block_id
            })
        let rectEnter = rect
            .enter()
            .append('g')
            .attr('class', com.main.tag + 'blocks')
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
        rectEnter.each(function(d, i) {
            let parent = d3.select(this)
            let timeout
            d3.select(this).append('rect')
                .attr('class', 'back')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 0)
                .attr('height', 0)
                .attr('stroke', '#000000')
                .style('fill', '#000000')
                .style('fill-opacity', 0)
                .attr('stroke-width', 0)
                .style('stroke-opacity', 0)
                .style('stroke-dasharray', [])
                .attr('vector-effect', 'non-scaling-stroke')
                .on('click', function(e, d) {
                    clearTimeout(timeout)
                    timeout = setTimeout(function() {
                        com.events.block.click(d)
                    }, 200)
                    // let node = d3.select(this)
                    // node.attr('clicked', 1)
                    //
                    // setTimeout(function () {
                    //   if (node.attr('clicked') === '2') return
                    //   if (e.ctrlKey) {
                    //     // com.input.selection.push(that)
                    //   } else {
                    //     // com.input.selection = [that]
                    //   }
                    //   com.events.block.click('block', d.obs_block_id)
                    // }, 250)
                })
                .on('dblclick', function(e, d) {
                    clearTimeout(timeout)
                    console.log('dbclick')
                    com.events.block.dbclick(d)
                    // let node = d3.select(this)
                    // node.attr('clicked', 2)
                })
                .on('mouseover', function(e, d) {
                    d3.select(this).style('cursor', 'pointer')
                    com.events.block.mouseover('block', d.obs_block_id)
                })
                .on('mouseout', function(e, d) {
                    d3.select(this).style('cursor', 'default')
                    com.events.block.mouseout('block', d.obs_block_id)
                })
                .call(d3.drag()
                    .on('start', function(e, d) {
                        com.interaction = {
                        }
                        com.interaction.oldG = parent
                        if (com.events.block.drag) {
                            com.events.block.drag.start(e, d)
                        }
                    })
                    .on('drag', function(e, d) {
                        if (com.events.block.drag) {
                            com.events.block.drag.tick(e, d)
                        }
                    })
                    .on('end', function(e, d) {
                        if (com.events.block.drag) {
                            com.events.block.drag.end(e, d)
                        }
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
            d3.select(this).append('text')
                .attr('class', 'name')
                .text(d.metadata.block_name)
                .style('font-weight', 'normal')
                .style('opacity', 0)
                .style('fill', '#000000')
                .style('stroke-width', 0.3)
                .style('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .style('stroke', '#000000')
                .attr('x', 0)
                .attr('y', 0)
                .attr('text-anchor', 'middle')
        })
        rect.exit().remove()
    }
    function update_data(data_in) {
        com.main.g.select('text.name')
            .transition()
            .duration(400)
            .style('opacity', 0)
        com.time.current_time = data_in.time.current_time
        com.time.start_time_sec = data_in.time.start_time_sec
        com.time.end_time_sec = data_in.time.end_time_sec
        com.data.raw = data_in.data.raw
        com.data.modified = data_in.data.modified
        com.filters.filtering = updateFiltering()
        com.data.filtered = filterData({
        }).data
        createBlocksGroup()

        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.update_data = update_data
    function update() {
        com.filters.filtering = updateFiltering()
        com.data.filtered = filterData({
        }).data
        createBlocksGroup()
        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.update = update

    function get_line_layout() {
        if (com.displayer === 'blockQueue') {
        }
        else if (com.displayer === 'blockList') {
        }
        else if (com.displayer === 'blockForm') {
        }
        else if (com.displayer === 'blockQueue2') {
            return blockQueue2Bib.get_line_layout()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
        }
    }
    this.get_line_layout = get_line_layout
    function set_line_layout(layout) {
        if (com.displayer === 'blockQueue') {
        }
        else if (com.displayer === 'blockList') {
        }
        else if (com.displayer === 'blockForm') {
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.set_line_layout(layout)
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
        }
    }
    this.set_line_layout = set_line_layout


    function changeDisplayer(newDisplayer) {
        if (com.displayer === newDisplayer) {
            return
        }

        if (com.displayer === 'blockQueue') {
            block_queue_bib.remove()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.remove()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.remove()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.remove()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.remove()
        }

        com.displayer = newDisplayer
        if (com.displayer === 'blockQueue') {
            block_queue_bib.init()
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.init()
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.init()
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.init()
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.init()
            blockTrackShrinkBib.update()
        }
    }
    this.changeDisplayer = changeDisplayer

    function get_block_rows() {
        if (com.displayer === 'blockQueue') {
            return block_queue_bib.get_block_rows()
        }
        else if (com.displayer === 'blockQueue2') {
            return blockQueue2Bib.get_block_rows()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            return blockTrackShrinkBib.get_block_rows()
        }
        else {
            return undefined
        }
    }
    this.get_block_rows = get_block_rows

    function highlightBlocks(blocks) {
        if (com.displayer === 'blockQueue') {
            block_queue_bib.highlightBlocks(blocks)
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.highlightBlocks(blocks)
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.highlightBlocks(blocks)
        }
    }
    this.highlightBlocks = highlightBlocks

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    // function blocksMouseOver (data) {
    //   let totBlocks = com.blockQueue.blocks.run.g.selectAll('g.' + com.main.tag + 'blocks')
    //   if (com.blockQueue.blocks.cancel.g) totBlocks.merge(com.blockQueue.blocks.cancel.g.selectAll('g.' + com.main.tag + 'blocks'))
    //
    //   totBlocks.each(function (d) {
    //     if (d.data.metadata.n_sched === data.data.metadata.n_sched && d.data.metadata.n_obs !== data.data.metadata.n_obs) {
    //       d3.select(this).select('rect.back').attr('stroke-width', 6)
    //         .style('stroke-opacity', 1)
    //         .attr('stroke-dasharray', [4, 2])
    //     }
    //   })
    // }
    // function blocksMouseOut (data) {
    //   let totBlocks = com.blockQueue.blocks.run.g.selectAll('g.' + com.main.tag + 'blocks')
    //   if (com.blockQueue.blocks.cancel.g) totBlocks.merge(com.blockQueue.blocks.cancel.g.selectAll('g.' + com.main.tag + 'blocks'))
    //
    //   totBlocks.each(function (d) {
    //     if (d.data.metadata.n_sched === data.data.metadata.n_sched && d.data.metadata.n_obs !== data.data.metadata.n_obs) {
    //       d3.select(this).select('rect.back').attr('stroke-width', 1)
    //         .style('stroke-opacity', 0.4)
    //         .attr('stroke-dasharray', [])
    //     }
    //   })
    // }

    function over_sched_blocks(id) {
        com.input.over.sched_blocks = id
        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.over_sched_blocks = over_sched_blocks
    function out_sched_blocks(id) {
        com.input.over.sched_blocks = undefined
        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.out_sched_blocks = out_sched_blocks
    function overBlock(id) {
        com.input.over.block = id
        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.overBlock = overBlock
    function outBlock(id) {
        com.input.over.block = undefined
        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.outBlock = outBlock

    function focusOn_sched_blocks(id) {
        com.input.focus.sched_blocks = id
        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.focusOn_sched_blocks = focusOn_sched_blocks
    function unfocusOn_sched_blocks(id) {
        com.input.focus.sched_blocks = undefined
        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.unfocusOn_sched_blocks = unfocusOn_sched_blocks
    function focusOn_block(id) {
        com.input.focus.block = id
        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.focusOn_block = focusOn_block
    function unfocusOn_block(id) {
        com.input.focus.block = undefined
        if (com.displayer === 'blockQueue') {
            block_queue_bib.update()
        }
        else if (com.displayer === 'blockList') {
            blockListBib.update()
        }
        else if (com.displayer === 'blockForm') {
            blockFormBib.update()
        }
        else if (com.displayer === 'blockQueue2') {
            blockQueue2Bib.update()
        }
        else if (com.displayer === 'blockTrackShrinkBib') {
            blockTrackShrinkBib.update()
        }
    }
    this.unfocusOn_block = unfocusOn_block

    function updateFiltering() {
        let allFilters = []
        for (let i = com.filters.blockFilters.length - 1; i > -1; i--) {
            let filters = com.filters.blockFilters[i].getFilters()
            allFilters = allFilters.concat(filters)
        }
        return allFilters
    }
    function plugBlockFilters(blockFilters, propagate) {
        com.filters.blockFilters.push(blockFilters)
        if (propagate) {
            blockFilters.plugBlockQueue(this, !propagate)
        }
    }
    this.plugBlockFilters = plugBlockFilters
    function unplugBlockFilters(blockFilters, propagate) {
        for (let i = com.filters.blockFilters.length - 1; i > -1; i--) {
            if (com.filters.blockFilters[i] === blockFilters) {
                com.filters.blockFilters[i].remove()
            }
        }
        if (propagate) {
            blockFilters.unplugBlockQueue(this, !propagate)
        }
    }
    this.unplugBlockFilters = unplugBlockFilters
}
