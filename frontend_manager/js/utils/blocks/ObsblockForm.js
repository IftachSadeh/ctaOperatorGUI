/* global d3 */
/* global $ */
/* global blockStyle */
/* global load_script */
/* global colorPalette */
/* global is_def */
/* global target_icon */
/* global pointing_icon */
/* global TargetDisplayer */
/* global TelescopeDisplayer */
/* global deep_copy */

load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/blocks/common.js',
})
// load_script({ source: 'utils_scrollTable', script: '/js/blocks/utils_telescopeCommon.js' })
load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/common_d3.js',
})

window.ObsblockForm = function(opt_in) {
    let com = {
        main: {
            tag: 'blockFormTag',
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
                fill: colorPalette.brighter.background,
                stroke: colorPalette.brighter.stroke,
                strokeWidth: 0.5,
            },
        },
        tree: {
            box: {
            },
            events: {
                click: undefined,
                over: undefined,
                out: undefined,
            },
        },
        schedule: {
            box: {
            },
            events: {
                click: undefined,
                over: undefined,
                out: undefined,
            },
        },
        target: {
            box: {
            },
            events: {
                click: undefined,
                over: undefined,
                out: undefined,
            },
        },
        telescope: {
            box: {
            },
            events: {
                click: undefined,
                over: undefined,
                out: undefined,
            },
        },
        data: {
            block: undefined,
            schedB: undefined,
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
    }
    com = opt_in

    let title_size = 11
    let headerSize = 10
    let txt_size = 9

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

    function init() {
        initSchedulingObservingBlocksTree()
        initTime_information()
        initPointing_information()
        initTelescope_information()
    }
    this.init = init
    function update(data) {
        updateTime_information()
    // initSchedulingObservingBlocksTree()
    // initTime_information()
    // initPointing_information()
    // initTelescope_information()
    }
    this.update = update

    function initScrollBox(tag, g, box, background) {
        if (background.enabled) {
            g.append('rect')
                .attr('class', 'background')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.w)
                .attr('height', box.h)
                .style('fill', background.fill)
                .style('stroke', background.stroke)
                .style('stroke-width', background.strokeWidth)
        }

        let scrollBox = new ScrollBox()
        scrollBox.init({
            tag: tag,
            g_box: g,
            box_data: {
                x: 0,
                y: 0,
                w: box.w,
                h: box.h,
            },
            use_relative_coords: true,
            locker: new Locker(),
            lockers: [ tag + 'update_data' ],
            lock_zoom: {
                all: tag + 'zoom',
                during: tag + 'zoom_during',
                end: tag + 'zoom_end',
            },
            run_loop: new RunLoop({
                tag: tag,
            }),
            can_scroll: true,
            scrollVertical: true,
            scroll_horizontal: false,
            scroll_height: 0,
            scroll_width: 0,
            background: 'transparent',
            scroll_rec_h: {
                h: 4,
            },
            scroll_recs: {
                w: 4,
            },
        })
        return scrollBox
    }

    function initSchedulingObservingBlocksTree() {
        let data = com.data.block
        let schedB = com.data.schedB
        let box = com.tree.box
        let palette = blockStyle(data)

        let g = com.main.g.append('g')
            .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        com.tree.g = g
        g.append('rect')
            .attr('id', data.obs_block_id)
            .attr('x', box.h * 0.3)
            .attr('y', box.h * 0.4)
            .attr('width', box.h * 0.8)
            .attr('height', box.h * 0.6)
            .attr('fill', palette.color.background)
            .attr('stroke', palette.color.stroke)
            .attr('stroke-width', 0.2)
        g.append('text')
            .text(data.metadata.block_name)
            .style('fill', palette.color.text)
            .style('font-weight', '')
            .style('font-size', title_size + 'px')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (box.h * 0.7) + ',' + (box.h * 0.7 + title_size * 0.3) + ')')
            .style('pointer-events', 'none')
        g.append('circle')
            .attr('cx', box.h * 0.7)
            .attr('cy', box.h * 0.4)
            .attr('r', box.h * 0.2)
            .attr('fill', 'transparent')
            .attr('stroke', 'none')
            .on('click', function() {
                com.tree.events.click('block', data.obs_block_id)
            })
            .on('mouseover', function(e, d) {
                d3.select(this).style('cursor', 'pointer')
                d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
            })
            .on('mouseout', function(e, d) {
                d3.select(this).style('cursor', 'default')
                d3.select(this).attr('fill', 'transparent')
            })
        g.append('svg:image')
            .attr('xlink:href', '/static/icons/cross.svg')
            .attr('x', box.h * 0.7 - box.h * 0.13)
            .attr('y', box.h * 0.4 - box.h * 0.13)
            .attr('width', box.h * 0.26)
            .attr('height', box.h * 0.26)
            .style('opacity', 0.5)
            .style('pointer-events', 'none')

        // g.append('text')
        //   .text('sched. block:')
        //   .style('fill', color.text)
        //   .style('font-weight', '')
        //   .style('font-size', txt_size * 1.2)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.25) + ',' + (box.h * 0.25 + txt_size * 0.3) + ')')
        let dimPoly = box.h * 0.5
        let poly = [
            {
                x: dimPoly * 0.3,
                y: dimPoly * 0.0,
            },
            {
                x: dimPoly * 0.7,
                y: dimPoly * 0.0,
            },

            {
                x: dimPoly * 1,
                y: dimPoly * 0.3,
            },
            {
                x: dimPoly * 1,
                y: dimPoly * 0.7,
            },

            {
                x: dimPoly * 0.7,
                y: dimPoly * 1,
            },
            {
                x: dimPoly * 0.3,
                y: dimPoly * 1,
            },

            {
                x: dimPoly * 0.0,
                y: dimPoly * 0.7,
            },
            {
                x: dimPoly * 0.0,
                y: dimPoly * 0.3,
            },
        ]
        g.selectAll('polygon')
            .data([ poly ])
            .enter()
            .append('polygon')
            .attr('points', function(d) {
                return d.map(function(d) {
                    return [ d.x, d.y ].join(',')
                }).join(' ')
            })
            .attr('fill', colorPalette.dark.background)
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.4)
            .attr('transform', 'translate(' + (box.w * 0.5 - dimPoly * 0.5) + ',' + (box.h * 0.5 - dimPoly) + ')')
            .on('click', function() {
                com.tree.events.click('sched_block', data.sched_block_id)
            })
            .on('mouseover', function(e, d) {
                d3.select(this).style('cursor', 'pointer')
                d3.select(this).attr('fill', colorPalette.darker.background)
            })
            .on('mouseout', function(e, d) {
                d3.select(this).style('cursor', 'default')
                d3.select(this).attr('fill', colorPalette.dark.background)
            })
        g.append('text')
            .text('S' + data.metadata.n_sched)
            .style('fill', colorPalette.dark.text)
            .style('font-weight', '')
            .style('font-size', txt_size * 1.2 + 'px')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (box.w * 0.5) + ',' + (box.h * 0.5 - dimPoly * 0.5 + txt_size * 0.4) + ')')
            .style('pointer-events', 'none')

        // g.append('text')
        //   .text('obs. blocks:')
        //   .style('fill', color.text)
        //   .style('font-weight', '')
        //   .style('font-size', txt_size * 1.2)
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.25) + ',' + (box.h * 0.75 + txt_size * 0.3) + ')')
        for (let i = 0; i < schedB.blocks.length; i++) {
            let palette = blockStyle(schedB.blocks[i])
            g.append('rect')
                .attr('id', schedB.blocks[i].obs_block_id)
                .attr('x', 2 + (box.w * 0.5 - ((schedB.blocks.length + (com.schedule.editabled ? 1 : 0)) * dimPoly) * 0.5) + (dimPoly * i))
                .attr('y', box.h * 0.9 - dimPoly * 0.7)
                .attr('width', dimPoly * 0.8)
                .attr('height', dimPoly * 0.8)
                .attr('fill', palette.color.background)
                .attr('stroke', palette.color.stroke)
                .attr('stroke-width', 0.2)
                .attr('stroke-dasharray', [])
                .on('click', function() {
                    com.tree.events.click('block', schedB.blocks[i].obs_block_id)
                })
                .on('mouseover', function(e, d) {
                    d3.select(this).style('cursor', 'pointer')
                    d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
                })
                .on('mouseout', function(e, d) {
                    d3.select(this).style('cursor', 'default')
                    d3.select(this).attr('fill', palette.color.background)
                })
            g.append('text')
                .text('' + schedB.blocks[i].metadata.n_obs)
                .style('fill', palette.color.text)
                .style('font-weight', '')
                .style('font-size', txt_size + 'px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (2 + (box.w * 0.5 - ((schedB.blocks.length + (com.schedule.editabled ? 1 : 0)) * dimPoly) * 0.5) + (dimPoly * i) + (dimPoly * 0.4)) + ',' + (box.h * 0.9 - dimPoly * 0.3 + txt_size * 0.3) + ')')
                .style('pointer-events', 'none')
        }
        if (com.schedule.editabled) {
            g.append('rect')
                .attr('x', 2 + (box.w * 0.5 - ((schedB.blocks.length + (com.schedule.editabled ? 1 : 0)) * dimPoly) * 0.5) + (dimPoly * schedB.blocks.length))
                .attr('y', box.h * 0.9 - dimPoly * 0.7)
                .attr('width', dimPoly * 0.8)
                .attr('height', dimPoly * 0.8)
                .attr('fill', colorPalette.dark.background)
                .attr('stroke', colorPalette.dark.stroke)
                .attr('stroke-width', 0.2)
                .attr('stroke-dasharray', [])
                .on('click', function() {
                    com.tree.events.change(com.data.schedB)
                })
                .on('mouseover', function(e, d) {
                    d3.select(this).style('cursor', 'pointer')
                    d3.select(this).attr('fill', d3.color(colorPalette.dark.background).darker(0.9))
                })
                .on('mouseout', function(e, d) {
                    d3.select(this).style('cursor', 'default')
                    d3.select(this).attr('fill', colorPalette.dark.background)
                })
            g.append('text')
                .text('+')
                .style('fill', colorPalette.dark.text)
                .style('font-weight', 'bold')
                .style('font-size', txt_size + 'px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (2 + (box.w * 0.5 - ((schedB.blocks.length + (com.schedule.editabled ? 1 : 0)) * dimPoly) * 0.5) + (dimPoly * schedB.blocks.length) + (dimPoly * 0.4)) + ',' + (box.h * 0.9 - dimPoly * 0.3 + txt_size * 0.3) + ')')
                .style('pointer-events', 'none')
        }
    }
    function updateSchedulingObservingBlocksTree() {
        let schedB = com.data.schedB

        for (let i = 0; i < schedB.blocks.length; i++) {
            let palette = blockStyle(schedB.blocks[i])
            com.tree.g.selectAll('rect#' + schedB.blocks[i].obs_block_id)
                .attr('fill', palette.color.background)
        }
    }

    function updateTime(id, time) {
        let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
        let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
        let sec = ('0' + d3.timeFormat('%S')(time)).slice(-2)

        let g = com.main.g.select('g#' + id)

        g.select('#hour').select('input').property('value', hour)
        g.select('#minute').select('input').property('value', min)
        g.select('#second').select('input').property('value', sec)
    }
    function changeBlockTime(type, hour, min, sec) {
        let start_time_sec = new Date(com.data.time_of_night.date_start)
        let end_time_sec = new Date(com.data.time_of_night.date_end)
        switch (type) {
        case 'start_time_sec':
            if (Number(hour) >= 0 && Number(hour) <= end_time_sec.getHours()) {
                end_time_sec.setHours(Number(hour))
                end_time_sec.setMinutes(Number(min))
                end_time_sec.setSeconds(Number(sec))
            }
            else {
                end_time_sec = new Date(com.data.time_of_night.date_start)
                end_time_sec.setHours(Number(hour))
                end_time_sec.setMinutes(Number(min))
                end_time_sec.setSeconds(Number(sec))
            }
            com.data.block.time.start = (end_time_sec - start_time_sec) / 1000
            com.data.block.time.end = com.data.block.time.start + com.data.block.time.duration
            break
        case 'duration':
            com.data.block.time.duration = Number(hour) * 3600 + Number(min) * 60 + Number(sec)
            com.data.block.time.end = com.data.block.time.start + com.data.block.time.duration
            break
        case 'end_time_sec':
            if (Number(hour) >= 0 && Number(hour) <= end_time_sec.getHours()) {
                end_time_sec.setHours(Number(hour))
                end_time_sec.setMinutes(Number(min))
                end_time_sec.setSeconds(Number(sec))
            }
            else {
                end_time_sec = new Date(com.data.time_of_night.date_start)
                end_time_sec.setHours(Number(hour))
                end_time_sec.setMinutes(Number(min))
                end_time_sec.setSeconds(Number(sec))
            }
            com.data.block.time.end = (end_time_sec - start_time_sec) / 1000
            com.data.block.time.duration = com.data.block.time.end - com.data.block.time.start
            break
        default:
            return
        }

        start_time_sec = new Date(com.data.time_of_night.date_start)
        start_time_sec.setSeconds(start_time_sec.getSeconds() + com.data.block.time.start)
        end_time_sec = new Date(com.data.time_of_night.date_start)
        end_time_sec.setSeconds(end_time_sec.getSeconds() + com.data.block.time.start + com.data.block.time.duration)
        let duration = new Date(end_time_sec)
        duration.setHours(duration.getHours() - start_time_sec.getHours())
        duration.setMinutes(duration.getMinutes() - start_time_sec.getMinutes())
        duration.setSeconds(duration.getSeconds() - start_time_sec.getSeconds())
        updateTime('start_time_sec', start_time_sec)
        updateTime('duration', duration)
        updateTime('end_time_sec', end_time_sec)

        com.schedule.events.click()
        com.events.conflict(com.data.block)
        com.events.modification(com.data.block, false, (type === 'start_time_sec' ? 'start_time_sec' : 'duration'))
    }
    function changeState(newState) {
        com.schedule.events.change(com.data.block, newState)
        com.events.modification(com.data.block, false, 'state')
        updateSchedulingObservingBlocksTree()
    }
    function initTime_information() {
        let data = com.data.block
        let box = com.schedule.box

        let g = com.main.g.append('g')
            .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        com.schedule.g = g
        // g.append('text')
        //   .text('Schedule')
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-size', title_size + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (0) + ',' + (0) + ')')
        // g.append('line')
        //   .attr('x1', 0)
        //   .attr('y1', 2)
        //   .attr('x2', box.w)
        //   .attr('y2', 2)
        //   .attr('stroke', colorPalette.dark.stroke)
        //   .attr('stroke-width', 0.2)

        // g.append('rect')
        //   .attr('id', 'headerStrip')
        //   .attr('x', 0)
        //   .attr('y', 3)
        //   .attr('width', box.w)
        //   .attr('height', headerSize)
        //   .attr('fill', colorPalette.dark.stroke)
        let label = [
            {
                x: box.w * 0.0,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.2,
                text: 'State',
                anchor: 'middle',
            },
            {
                x: box.w * 0.2,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.266,
                text: 'Start',
                anchor: 'middle',
            },
            {
                x: box.w * 0.466,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.266,
                text: 'End',
                anchor: 'middle',
            },
            {
                x: box.w * 0.732,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.266,
                text: 'Duration',
                anchor: 'middle',
            },
            // {x: box.w * 0.69, y: 3 + headerSize * 0.5 + txt_size * 0.3, w: box.w * 0.31, text: 'Target & pointing', anchor: 'middle'}
        ]
        for (let i = 0; i < label.length; i++) {
            let off = label[i].anchor === 'middle' ? label[i].w * 0.5 : (label[i].anchor === 'end' ? label[i].w * 0.5 : 0)
            g.append('text')
                .text(label[i].text)
                .style('fill', colorPalette.medium.stroke)
                .style('font-weight', 'bold')
                .style('font-size', headerSize + 'px')
                .attr('text-anchor', label[i].anchor)
                .attr('transform', 'translate(' + (label[i].x + off) + ',' + (label[i].y) + ')')
            // g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', label[i].w)
            //   .attr('height', box.h - headerSize - 4)
            //   .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.darker.background)
            //   .attr('stroke', '#000000')
            //   .attr('stroke-width', 0.05)
            //   .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
        }

        function drawTime(id, x, w, y, time) {
            function createInput(type, g, innerbox) {
                stock[type + 'minus_button'] = new button_d3()
                stock[type + 'minus_button'].init({
                    main: {
                        id: type + 'minus_button',
                        g: g,
                        box: {
                            x: innerbox.x - 3,
                            y: innerbox.y + 18,
                            width: 9,
                            height: 9,
                        },
                        background: {
                            common: {
                                style: {
                                    fill: colorPalette.medium.background,
                                    stroke: colorPalette.medium.stroke,
                                    'stroke-width': 0.1,
                                },
                                attr: {
                                    rx: 2,
                                },
                            },
                            hovered: {
                                style: {
                                    fill: colorPalette.darkest.background,
                                    stroke: colorPalette.darkest.stroke,
                                    'stroke-width': 0.1,
                                },
                                attr: {
                                },
                            },
                        },
                    },
                    foreground: {
                        type: 'text',
                        value: '-',
                        common: {
                            style: {
                                font: 'bold',
                                'font-size': '9px',
                                fill: colorPalette.medium.text,
                                anchor: 'middle',
                                'pointer-events': 'none',
                                'user-select': 'none',
                            },
                            attr: {
                                x: innerbox.x - 3 + 3,
                                y: innerbox.y + 18 + 7,
                            },
                        },
                        hovered: {
                            style: {
                                font: 'bold',
                                'font-size': '14px',
                                fill: colorPalette.medium.text,
                                anchor: 'start',
                                'pointer-events': 'none',
                                'user-select': 'none',
                            },
                            attr: {
                            },
                        },
                    },
                    events: {
                        click: (d) => {
                            let oldValue = parseInt(stock[type].property('value'))
                            let new_val = oldValue
                            if (oldValue > stock[type + 'Opts'].min) {
                                new_val = oldValue - 1
                            }
                            else {
                                new_val = stock[type + 'Opts'].max
                            }
                            stock[type].property('value', ('0' + new_val).slice(-2))
                            changeBlockTime(id, stock.hour.property('value'), stock.minute.property('value'), stock.second.property('value'))
                        },
                    },
                })

                stock[type + 'plus_button'] = new button_d3()
                stock[type + 'plus_button'].init({
                    main: {
                        id: type + 'plus_button',
                        g: g,
                        box: {
                            x: innerbox.x + 6,
                            y: innerbox.y + 18,
                            width: 9,
                            height: 9,
                        },
                        background: {
                            common: {
                                style: {
                                    fill: colorPalette.medium.background,
                                    stroke: colorPalette.medium.stroke,
                                    'stroke-width': 0.1,
                                },
                                attr: {
                                    rx: 2,
                                },
                            },
                            hovered: {
                                style: {
                                    fill: colorPalette.darkest.background,
                                    stroke: colorPalette.darkest.stroke,
                                    'stroke-width': 0.1,
                                },
                                attr: {
                                },
                            },
                        },
                    },
                    foreground: {
                        type: 'text',
                        value: '+',
                        common: {
                            style: {
                                font: 'bold',
                                'font-size': '9px',
                                fill: colorPalette.medium.text,
                                anchor: 'middle',
                                'pointer-events': 'none',
                                'user-select': 'none',
                            },
                            attr: {
                                x: innerbox.x + 6 + 2,
                                y: innerbox.y + 18 + 7,
                            },
                        },
                        hovered: {
                            style: {
                                font: 'bold',
                                'font-size': '14px',
                                fill: colorPalette.medium.text,
                                anchor: 'start',
                                'pointer-events': 'none',
                                'user-select': 'none',
                            },
                            attr: {
                            },
                        },
                    },
                    events: {
                        click: (d) => {
                            let oldValue = parseInt(stock[type].property('value'))
                            let new_val = oldValue
                            if (oldValue < stock[type + 'Opts'].max) {
                                new_val = oldValue + 1
                            }
                            else {
                                new_val = stock[type + 'Opts'].min
                            }
                            stock[type].property('value', ('0' + new_val).slice(-2))
                            changeBlockTime(id, stock.hour.property('value'), stock.minute.property('value'), stock.second.property('value'))
                        },
                    },
                })
            }

            let stock = {
            }
            let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
            let hbox = {
                x: x - 6,
                y: y + (com.schedule.editabled ? 0 : headerSize * 0.35),
                w: 14,
                h: headerSize * 2,
            }

            let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
            let mbox = {
                x: x + 16,
                y: y + (com.schedule.editabled ? 0 : headerSize * 0.35),
                w: 14,
                h: headerSize * 2,
            }
            let sec = ('0' + d3.timeFormat('%S')(time)).slice(-2)
            let sbox = {
                x: x + 38,
                y: y + (com.schedule.editabled ? 0 : headerSize * 0.35),
                w: 14,
                h: headerSize * 2,
            }

            let ig = g.append('g').attr('id', id)
                .attr('transform', 'translate(' + ((w - (14 * 3)) * 0.33) + ',0)')

            stock.hourOpts = {
                disabled: !com.schedule.editabled,
                value: hour,
                min: 0,
                max: 23,
                step: 1,
            }
            stock.hour = input_date_d3(ig,
                hbox,
                'hour',
                stock.hourOpts,
                {
                    change: (d) => {
                        changeBlockTime(id, d, stock.minute.property('value'), stock.second.property('value'))
                    },
                    enter: (d) => {
                        stock.minute.node().focus()
                    },
                })
            createInput('hour', ig, hbox)
            ig.append('text')
                .text(':')
                .style('fill', colorPalette.dark.stroke)
                .style('font-size', headerSize + 'px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5 + 2) + ',' + (y + headerSize * 1.1 + (com.schedule.editabled ? 0 : headerSize * 0.35)) + ')')

            stock.minuteOpts = {
                disabled: !com.schedule.editabled,
                value: min,
                min: 0,
                max: 60,
                step: 1,
            }
            stock.minute = input_date_d3(ig,
                mbox,
                'minute',
                stock.minuteOpts,
                {
                    change: (d) => {
                        changeBlockTime(id, stock.hour.property('value'), d, stock.second.property('value'))
                    },
                    enter: (d) => {
                        stock.second.node().focus()
                    },
                })
            createInput('minute', ig, mbox)
            ig.append('text')
                .text(':')
                .style('fill', colorPalette.dark.stroke)
                .style('font-size', headerSize + 'px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (mbox.x + mbox.w + 0.5 + 2) + ',' + (y + headerSize * 1.1 + (com.schedule.editabled ? 0 : headerSize * 0.35)) + ')')

            stock.secondOpts = {
                disabled: !com.schedule.editabled,
                value: sec,
                min: 0,
                max: 60,
                step: 1,
            }
            stock.second = input_date_d3(ig,
                sbox,
                'second',
                stock.secondOpts,
                {
                    change: (d) => {
                        changeBlockTime(id, stock.hour.property('value'), stock.minute.property('value'), d)
                    },
                    enter: (d) => {
                        stock.second.node().blur()
                    },
                })
            createInput('second', ig, sbox)
        }

        let start_time_sec = new Date(com.data.time_of_night.date_start)
        start_time_sec.setSeconds(start_time_sec.getSeconds() + data.time.start)
        let end_time_sec = new Date(com.data.time_of_night.date_start)
        end_time_sec.setSeconds(end_time_sec.getSeconds() + data.time.start + data.time.duration)
        let duration = new Date(end_time_sec)
        duration.setHours(duration.getHours() - start_time_sec.getHours())
        duration.setMinutes(duration.getMinutes() - start_time_sec.getMinutes())
        duration.setSeconds(duration.getSeconds() - start_time_sec.getSeconds())

        let options = []
        if (data.exe_state.state === 'wait') {
            options = [ 'cancel', 'wait' ]
        }
        if (data.exe_state.state === 'cancel') {
            options = [ 'cancel', 'wait' ]
        }
        if (data.exe_state.state === 'run') {
            options = [ 'run', 'cancel' ]
        }

        // dropDown_div(g,
        //   sbox,
        //   'state',
        //   {disabled: !com.schedule.editabled, value: data.exe_state.state, options: options},
        //   {change: (d) => { changeState(d) }, enter: (d) => { changeState(d) }})
        let gdropstate = g.append('g').attr('transform', 'translate(' + label[0].x + ',' + (3 + headerSize) + ')')
        let dropState = new dropdown_d3()
        dropState.init({
            main: {
                id: 'dropState',
                g: gdropstate,
                dim: {
                    w: label[0].w,
                    h: box.h - headerSize - 4,
                },
                background: {
                    common: {
                        style: {
                            fill: colorPalette.medium.background,
                            stroke: colorPalette.medium.stroke,
                            'stroke-width': 0.2,
                        },
                        attr: {
                        },
                    },
                    hovered: {
                        style: {
                            fill: colorPalette.darkest.background,
                            stroke: colorPalette.darkest.stroke,
                            'stroke-width': 0.2,
                        },
                        attr: {
                        },
                    },
                },
                text: {
                    common: {
                        style: {
                            font: 'bold',
                            'font-size': '14px',
                            fill: colorPalette.medium.text,
                            anchor: 'start',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                        },
                    },
                    hovered: {
                        style: {
                            font: 'bold',
                            'font-size': '14px',
                            fill: colorPalette.medium.text,
                            anchor: 'start',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                        },
                    },
                },
            },
            options: {
                value: data.exe_state.state,
                blocked: false,
                keepDropOpen: false,
                list: options,
                dim: {
                    w: label[0].w,
                    h: title_size * 1.5,
                },
                nb: 1,
                background: {
                    common: {
                        style: {
                            fill: colorPalette.medium.background,
                            stroke: colorPalette.medium.stroke,
                            'stroke-width': 0.2,
                        },
                        attr: {
                        },
                    },
                    hovered: {
                        style: {
                            fill: colorPalette.darkest.background,
                            stroke: colorPalette.darkest.stroke,
                            'stroke-width': 0.2,
                        },
                        attr: {
                        },
                    },
                },
                text: {
                    common: {
                        style: {
                            font: 'bold',
                            'font-size': '12px',
                            fill: colorPalette.medium.text,
                            anchor: 'start',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                        },
                    },
                    hovered: {
                        style: {
                            font: 'bold',
                            'font-size': '12px',
                            fill: colorPalette.medium.text,
                            anchor: 'start',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                        },
                    },
                },
            },
            events: {
                change: (d) => {
                    changeState(d)
                },
            },
        })

        drawTime('start_time_sec', label[1].x + txt_size * 0.5, label[1].w, 2 + headerSize * 1.5, start_time_sec)
        drawTime('end_time_sec', label[2].x + txt_size * 0.5, label[2].w, 2 + headerSize * 1.5, end_time_sec)
        drawTime('duration', label[3].x + txt_size * 0.5, label[3].w, 2 + headerSize * 1.5, duration)

    // let tbox = {
    //   x: label[4].x,
    //   y: 3 + headerSize * 1.5,
    //   w: label[4].w * 0.5,
    //   h: headerSize * 2
    // }
    // dropDown_div(g,
    //   tbox,
    //   'target',
    //   {disabled: !com.schedule.editabled, value: data.pointing_name.split('/')[0], options: ['target_1', 'target_2', 'target_3', 'target_4', 'target_5', 'target_6', 'target_7']},
    //   {change: (d) => { changeTarget(d) }, enter: (d) => { changeTarget(d) }})
    // let pbox = {
    //   x: label[4].x + label[4].w * 0.5,
    //   y: 3 + headerSize * 1.5,
    //   w: label[4].w * 0.5,
    //   h: headerSize * 2
    // }
    // dropDown_div(g,
    //   pbox,
    //   'pointing',
    //   {disabled: !com.schedule.editabled, value: data.pointing_name.split('/')[1], options: ['p_0', 'p_1', 'p_2', 'p_3', 'p_4', 'p_5', 'p_6', 'p_7']},
    //   {change: (d) => { changePointing(d) }, enter: (d) => { changePointing(d) }})
    }
    function updateTime_information() {
        let start_time_sec = new Date(com.data.time_of_night.date_start)
        start_time_sec.setSeconds(start_time_sec.getSeconds() + com.data.block.time.start)
        let end_time_sec = new Date(com.data.time_of_night.date_start)
        end_time_sec.setSeconds(end_time_sec.getSeconds() + com.data.block.time.start + com.data.block.time.duration)
        let duration = new Date(end_time_sec)
        duration.setHours(duration.getHours() - start_time_sec.getHours())
        duration.setMinutes(duration.getMinutes() - start_time_sec.getMinutes())
        duration.setSeconds(duration.getSeconds() - start_time_sec.getSeconds())
        updateTime('start_time_sec', start_time_sec)
        updateTime('duration', duration)
        updateTime('end_time_sec', end_time_sec)
    }

    function addNewTarget(target_name) {
        for (let i = 0; i < com.data.target.length; i++) {
            if (com.data.target[i].name === target_name) {
                com.data.block.targets.push(com.data.target[i])
                updatePointing_information()
                // addNewPointing(com.data.target[i])
            }
        }
    }
    function addNewPointing(type) {
        let box = {
            x: com.target.box.x + com.target.box.w * 0.2,
            y: com.target.box.y + com.target.box.h * 0.1,
            w: com.target.box.w * 0.8,
            h: com.target.box.h * 0.9,
        }
        let line = 20
        if (type === 'coordinates') {
            let target
            let pointing
            let g = com.main.g.append('g')
                .attr('id', 'pointing')
                .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
            g.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.w)
                .attr('height', box.h)
                .attr('fill', colorPalette.medium.background)
                .attr('stroke', colorPalette.medium.stroke)
                .attr('stroke-width', 0.1)

            {
                g.append('text')
                    .text('Targets')
                    .style('fill', colorPalette.dark.stroke)
                    .style('font-weight', 'bold')
                    .style('font-size', 10 + 'px')
                    .attr('text-anchor', 'middle')
                    .attr('transform', 'translate(' + (box.w * 0.2) + ',' + 13 + ')')
                let tevents = {
                    click: function() {},
                    over: function() {},
                    out: function() {},
                }
                let sizeNewPointing = line * 0.8
                let addPointingg = g.append('g').attr('transform', 'translate(' + (box.w * 0.15) + ',' + (box.h * 0.2) + ')')
                let dropState = new dropdown_d3()
                dropState.init({
                    main: {
                        id: 'dropState',
                        g: addPointingg,
                        dim: {
                            w: sizeNewPointing * 2,
                            h: sizeNewPointing * 1.3,
                        },
                        background: {
                            common: {
                                style: {
                                    fill: colorPalette.medium.background,
                                    stroke: colorPalette.medium.stroke,
                                    'stroke-width': 0.2,
                                },
                                attr: {
                                },
                            },
                            hovered: {
                                style: {
                                    fill: colorPalette.darkest.background,
                                    stroke: colorPalette.darkest.stroke,
                                    'stroke-width': 0.2,
                                },
                                attr: {
                                },
                            },
                        },
                        text: {
                            common: {
                                style: {
                                    font: 'bold',
                                    'font-size': '14px',
                                    fill: colorPalette.medium.text,
                                    anchor: 'start',
                                    'pointer-events': 'none',
                                    'user-select': 'none',
                                },
                                attr: {
                                },
                            },
                            hovered: {
                                style: {
                                    font: 'bold',
                                    'font-size': '14px',
                                    fill: colorPalette.medium.text,
                                    anchor: 'start',
                                    'pointer-events': 'none',
                                    'user-select': 'none',
                                },
                                attr: {
                                },
                            },
                        },
                    },
                    options: {
                        value: '',
                        blocked: true,
                        keepDropOpen: false,
                        list: com.data.target.map(x => x.name),
                        dim: {
                            w: sizeNewPointing * 2.2,
                            h: sizeNewPointing * 1,
                        },
                        nb: 3,
                        background: {
                            common: {
                                style: {
                                    fill: colorPalette.medium.background,
                                    stroke: colorPalette.medium.stroke,
                                    'stroke-width': 0.2,
                                },
                                attr: {
                                },
                            },
                            hovered: {
                                style: {
                                    fill: colorPalette.darkest.background,
                                    stroke: colorPalette.darkest.stroke,
                                    'stroke-width': 0.2,
                                },
                                attr: {
                                },
                            },
                        },
                        text: {
                            common: {
                                style: {
                                    font: 'bold',
                                    'font-size': '10px',
                                    fill: colorPalette.medium.text,
                                    anchor: 'start',
                                    'pointer-events': 'none',
                                    'user-select': 'none',
                                },
                                attr: {
                                },
                            },
                            hovered: {
                                style: {
                                    font: 'bold',
                                    'font-size': '12px',
                                    fill: colorPalette.medium.text,
                                    anchor: 'start',
                                    'pointer-events': 'none',
                                    'user-select': 'none',
                                },
                                attr: {
                                },
                            },
                        },
                    },
                    events: {
                        change: (d) => {
                            let chooseTarget = g.select('g#chooseTarget')
                            chooseTarget.selectAll('*').remove()
                            for (let i = 0; i < com.data.target.length; i++) {
                                if (com.data.target[i].name === d) {
                                    target = com.data.target[i]
                                    target_icon(chooseTarget, {
                                        w: sizeNewPointing * 1.2,
                                        h: sizeNewPointing * 1.2,
                                    }, get_target_name(target), tevents, colorPalette)
                                    return
                                }
                            }
                            target = undefined
                        },
                    },
                })

                let ticon = target_icon(addPointingg.append('g'), {
                    w: sizeNewPointing,
                    h: sizeNewPointing,
                }, '+', tevents, colorPalette)
                ticon.style('pointer-events', 'none')
                    .attr('transform', 'translate(' + (sizeNewPointing * 0.3) + ',' + (sizeNewPointing * 0.15) + ')')
                // dropDown_div(addPointingg,
                //   {x: -2, y: -6, w: sizeNewPointing * 2, h: sizeNewPointing * 1.3},
                //   'trg',
                //   {disabled: !com.schedule.editabled, value: '', options: com.data.target.map(x => x.name), 'font-size': '0px'},
                //   {change: (d) => {
                //     let chooseTarget = g.select('g#chooseTarget')
                //     chooseTarget.selectAll('*').remove()
                //     for (let i = 0; i < com.data.target.length; i++) {
                //       if (com.data.target[i].name === d) {
                //         target = com.data.target[i]
                //         target_icon(chooseTarget, {w: sizeNewPointing * 1.2, h: sizeNewPointing * 1.2}, target.name.split('_')[1], tevents, colorPalette)
                //         return
                //       }
                //     }
                //     target = undefined
                //   },
                //   enter: (d) => {
                //   }})
                g.append('g').attr('id', 'chooseTarget').attr('transform', 'translate(' + (box.w * 0.16) + ',' + (box.h * 0.5) + ')')

                g.append('text')
                    .text('Coordinates')
                    .style('fill', colorPalette.dark.stroke)
                    .style('font-weight', 'bold')
                    .style('font-size', 10 + 'px')
                    .attr('text-anchor', 'middle')
                    .attr('transform', 'translate(' + (box.w * 0.6) + ',' + 13 + ')')
                g.append('rect')
                    .attr('x', -box.w * 0.2)
                    .attr('y', 0)
                    .attr('width', box.w * 0.55)
                    .attr('height', 18)
                    .attr('fill', colorPalette.bright.background)
                    .attr('stroke', colorPalette.bright.stroke)
                    .attr('stroke-width', 0.2)
                    .attr('transform', 'translate(' + (box.w * 0.6) + ',' + (box.h * 0.2) + ')')
                g.append('rect')
                    .attr('x', -box.w * 0.2)
                    .attr('y', 0)
                    .attr('width', box.w * 0.55)
                    .attr('height', 18)
                    .attr('fill', colorPalette.bright.background)
                    .attr('stroke', colorPalette.bright.stroke)
                    .attr('stroke-width', 0.2)
                    .attr('transform', 'translate(' + (box.w * 0.6) + ',' + (box.h * 0.4) + ')')

                g.append('rect')
                    .attr('x', -20)
                    .attr('y', -10)
                    .attr('width', 40)
                    .attr('height', 13)
                    .attr('fill', colorPalette.dark.background)
                    .attr('stroke', colorPalette.dark.stroke)
                    .attr('stroke-width', 0.4)
                    .attr('transform', 'translate(' + (box.w * 0.7) + ',' + (box.h * 0.95) + ')')
                    .on('click', function() {
                        g.remove()
                    })
                    .on('mouseover', function(e, d) {
                        d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
                    })
                    .on('mouseout', function(e, d) {
                        d3.select(this).attr('fill', colorPalette.darker.background)
                    })
                g.append('text')
                    .text('Cancel')
                    .style('fill', colorPalette.dark.stroke)
                    .style('font-weight', 'bold')
                    .style('font-size', 10 + 'px')
                    .attr('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .attr('transform', 'translate(' + (box.w * 0.7) + ',' + (box.h * 0.95) + ')')

                g.append('rect')
                    .attr('x', -20)
                    .attr('y', -10)
                    .attr('width', 40)
                    .attr('height', 13)
                    .attr('fill', colorPalette.dark.background)
                    .attr('stroke', colorPalette.dark.stroke)
                    .attr('stroke-width', 0.4)
                    .attr('transform', 'translate(' + (box.w * 0.9) + ',' + (box.h * 0.95) + ')')
                    .on('click', function() {
                        if (!target) {
                            target = com.data.block.targets[0]
                        }
                        pointing = {
                            id: com.data.block.sched_block_id + '_' + com.data.block.obs_block_id,
                        }
                        pointing.name = target.name + '/p_' + com.data.block.metadata.n_obs + '-' + com.data.block.pointings.length
                        pointing.pos = [ target.pos[0], target.pos[1] ]
                        pointing.tel_ids = []
                        pointing.tels_info = {
                            large: 0,
                            medium: 0,
                            small: 0,
                        }
                        com.data.block.pointings.push(pointing)

                        let insertTarget = true
                        for (let i = 0; i < com.data.block.targets.length; i++) {
                            if (com.data.block.targets[i].id === target.id) {
                                insertTarget = false
                            }
                        }
                        if (insertTarget) {
                            com.data.block.targets.push(target)
                        }

                        updatePointing_information()
                        reassignTelescope(com.data.block)
                        updateTelescope_information()
                        com.events.modification(com.data.block, false, 'pointings')
                        g.remove()
                    })
                    .on('mouseover', function(e, d) {
                        d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
                    })
                    .on('mouseout', function(e, d) {
                        d3.select(this).attr('fill', colorPalette.darker.background)
                    })
                g.append('text')
                    .text('Ok')
                    .style('fill', colorPalette.dark.stroke)
                    .style('font-weight', 'bold')
                    .style('font-size', 10 + 'px')
                    .attr('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .attr('transform', 'translate(' + (box.w * 0.9) + ',' + (box.h * 0.95) + ')')
            }
        }
    }
    function initPointing_information() {
        let box = com.target.box
        let data = com.data.block

        com.target.g = com.main.g.append('g')
            .attr('id', 'pointing')
            .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        let g = com.target.g

        com.main.g.select('g#pointing').selectAll().remove()

        // g.append('text')
        //   .text('Targets & pointings')
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-size', title_size + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
        // g.append('line')
        //   .attr('x1', 0)
        //   .attr('y1', 2)
        //   .attr('x2', box.w * 1.0)
        //   .attr('y2', 2)
        //   .attr('stroke', colorPalette.dark.stroke)
        //   .attr('stroke-width', 0.2)

        g.append('rect')
            .attr('id', 'headerStrip')
            .attr('x', 0)
            .attr('y', 3)
            .attr('width', box.w * 1)
            .attr('height', headerSize)
            .attr('fill', colorPalette.dark.stroke)
        let label = [
            // {x: 0, y: 3 + headerSize * 0.5 + txt_size * 0.3, w: box.w * 1, text: 'Targets & pointings mapping', anchor: 'middle'}
            {
                x: 0,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.10,
                text: 'Tgts',
                anchor: 'middle',
            },
            {
                x: box.w * 0.10,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.10,
                text: 'Ptgs',
                anchor: 'middle',
            },
            {
                x: box.w * 0.2,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.8,
                text: 'Mapping',
                anchor: 'middle',
            },
        ]
        for (let i = 0; i < label.length; i++) {
            let off = label[i].anchor === 'middle' ? label[i].w * 0.5 : (label[i].anchor === 'end' ? label[i].w * 0.5 : 0)
            g.append('text')
                .text(label[i].text)
                .style('fill', colorPalette.medium.background)
                .style('font-weight', 'bold')
                .style('font-size', txt_size + 'px')
                .attr('text-anchor', label[i].anchor)
                .attr('transform', 'translate(' + (label[i].x + off) + ',' + (label[i].y) + ')')
        }

        let line = 20

        let tbox = {
            x: label[0].x,
            y: 3 + headerSize + (com.target.editable ? (headerSize * 2) : 0),
            w: label[0].w,
            h: com.target.editable ? (box.h - headerSize * 3) : (box.h - headerSize * 1),
        }
        let blocktg = g.append('g').attr('transform', 'translate(' + tbox.x + ',' + tbox.y + ')')
        let scrollBoxt = initScrollBox(com.main.tag + 'targetListScroll', blocktg, tbox, {
            enabled: false,
        })
        let innertg = scrollBoxt.get('inner_g')
        com.target.target = {
            scroll: scrollBoxt,
            box: tbox,
        }
        // let target_point = []
        // for (let i = 0; i < data.pointings.length; i++) {
        //   let tar = target_point.find(t => t.name === data.pointings[i].name.split('/')[0])
        //   if (tar) {
        //     if (!(data.obs_block_id in tar.pointings)) tar.pointings[data.obs_block_id] = []
        //     tar.pointings[data.obs_block_id].push(data.pointings[i])
        //   } else {
        //     tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
        //     tar.pointings = {}
        //     tar.pointings[data.obs_block_id] = [data.pointings[i]]
        //     target_point.push(tar)
        //   }
        // }
        // let squareTemplate = {
        //   '1': [{x: 0.5, y: 0.5}],
        //   '2': [{x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}],
        //   '3': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.7}],
        //   '4': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
        //   '5': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.5}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
        //   '6': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.3}, {x: 0.5, y: 0.7}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
        //   '7': [],
        //   '8': [],
        //   '9': []
        // }

        function targetCore(targets, g, offset) {
            let space = ((tbox.h * 1) - (targets.length * line)) / (targets.length)
            let current = g
                .selectAll('g.target')
                .data(targets, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'target')
            enter.each(function(d, i) {
                let g = d3.select(this)
                let tevents = {
                    click: function() {
                        com.target.events.click('target', d.id)
                    },
                    over: function() {},
                    out: function() {},
                }
                target_icon(g, {
                    w: line * 1.1,
                    h: line * 1.1,
                }, 'T' + get_target_short(d), tevents, colorPalette)
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                let offX = (label[0].x + label[0].w * 0.5 - line * 0.5)
                let offY = (space * 0.5 + (space + line) * i)
                if (line * targets.length > tbox.h) {
                    offY = line * i
                }
                g.attr('transform', 'translate(' + offX + ',' + offY + ')')
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        targetCore(data.targets, innertg, 0)
        scrollBoxt.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: line * data.targets.length,
        })

        let pbox = {
            x: label[1].x,
            y: 3 + headerSize + (com.target.editable ? (headerSize * 2) : 0),
            w: label[1].w,
            h: com.target.editable ? (box.h - headerSize * 3) : (box.h - headerSize * 1),
        }
        let blockpg = g.append('g').attr('transform', 'translate(' + pbox.x + ',' + pbox.y + ')')
        let scrollBoxp = initScrollBox(com.main.tag + 'pointingListScroll', blockpg, pbox, {
            enabled: false,
        })
        let innerpg = scrollBoxp.get('inner_g')
        com.target.pointing = {
            scroll: scrollBoxp,
            box: pbox,
        }
        // let target_point = []
        // for (let i = 0; i < data.pointings.length; i++) {
        //   let tar = target_point.find(t => t.name === data.pointings[i].name.split('/')[0])
        //   if (tar) {
        //     if (!(data.obs_block_id in tar.pointings)) tar.pointings[data.obs_block_id] = []
        //     tar.pointings[data.obs_block_id].push(data.pointings[i])
        //   } else {
        //     tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
        //     tar.pointings = {}
        //     tar.pointings[data.obs_block_id] = [data.pointings[i]]
        //     target_point.push(tar)
        //   }
        // }
        // let squareTemplate = {
        //   '1': [{x: 0.5, y: 0.5}],
        //   '2': [{x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}],
        //   '3': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.7}],
        //   '4': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
        //   '5': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.5}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
        //   '6': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.3}, {x: 0.5, y: 0.7}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
        //   '7': [],
        //   '8': [],
        //   '9': []
        // }

        function pointingCore(pointings, g, offset) {
            let space = ((tbox.h * 1) - (pointings.length * line)) / (pointings.length)
            let current = g
                .selectAll('g.target')
                .data(pointings, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'target')
            enter.each(function(d, i) {
                let g = d3.select(this)
                let pevents = {
                    click: function() {},
                    over: function() {},
                    out: function() {},
                }
                pointing_icon(g, {
                    w: box.w * 0.07,
                    h: line,
                }, 'P' + get_pointing_value(d), pevents, colorPalette)
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                let offX = (label[0].x + label[0].w * 0.5 - line * 0.5)
                let offY = (space * 0.5 + (space + line) * i)
                if (line * pointings.length > pbox.h) {
                    offY = line * i
                }
                g.attr('transform', 'translate(' + offX + ',' + offY + ')')
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        pointingCore(data.pointings, innerpg, 0)
        scrollBoxp.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: line * data.pointings.length,
        })

        // function pointingCore (trg, pointings, pg, x, y, w, h) {
        //   if (com.target.editable) {
        //     pointings.push({id: 'newPointing'})
        //   }
        //   pg.attr('transform', 'translate(' + x + ',' + y + ')')
        //   pg.append('rect')
        //     .attr('x', 4)
        //     .attr('y', 4)
        //     .attr('width', w - 8)
        //     .attr('height', h - 8)
        //     .attr('fill', colorPalette.darker.background)
        //     .attr('stroke', colorPalette.darker.stroke)
        //     .attr('stroke-width', 0.2)
        //   let psize = {
        //     w: Math.min(w / 3, 25),
        //     h: Math.min(h / 3, 20)
        //   }
        //   let current = pg
        //     .selectAll('g.pointing')
        //     .data(pointings, function (d) {
        //       return d.id
        //     })
        //   let enter = current
        //     .enter()
        //     .append('g')
        //     .attr('class', 'pointing')
        //   enter.each(function (d, i) {
        //     let g = d3.select(this)
        //     if (i === (pointings.length - 1) && com.target.editable) {
        //       let pevents = {
        //         click: function () { addNewPointing(trg) },
        //         over: function () {},
        //         out: function () {}
        //       }
        //       pointing_icon(g, {w: psize.w * 0.66, h: psize.h * 0.66}, '+', pevents, colorPalette)
        //     } else {
        //       let pevents = {
        //         click: function () {},
        //         over: function () {},
        //         out: function () {}
        //       }
        //       pointing_icon(g, {w: psize.w, h: psize.h}, '' + d.name.split('/')[1].split('_')[1].split('-')[1], pevents, colorPalette)
        //     }
        //   })
        //   let merge = current.merge(enter)
        //   merge.each(function (d, i) {
        //     let g = d3.select(this)
        //     if (i === (pointings.length - 1) && com.target.editable) {
        //       let index = pointings.length
        //       let pos = squareTemplate[index][i]
        //       g.attr('transform', 'translate(' + ((pos.x * w) - (psize.w * 0.66 * 0.5)) + ',' + ((pos.y * h) - (psize.h * 0.66 * 0.5)) + ')')
        //     } else {
        //       let index = pointings.length
        //       let pos = squareTemplate[index][i]
        //       g.attr('transform', 'translate(' + ((pos.x * w) - (psize.w * 0.5)) + ',' + ((pos.y * h) - (psize.h * 0.5)) + ')')
        //     }
        //   })
        //   current
        //     .exit()
        //     .transition('in_out')
        //     .duration(times.anim)
        //     .style('opacity', 0)
        //     .remove()
        // }
        // addPointingg.append('rect')
        //   .attr('x', (label[0].w * 0.5) + sizeNewPointing * 0.5 + 4)
        //   .attr('y', 4)
        //   .attr('width', label[1].w - 8)
        //   .attr('height', sizeNewPointing - 8)
        //   .attr('fill', colorPalette.darker.background)
        //   .attr('stroke', colorPalette.darker.stroke)
        //   .attr('stroke-width', 0.2)
        // let target_point = []
        // for (let i = 0; i < data.pointings.length; i++) {
        //   let tar = target_point.find(t => t.name === data.pointings[i].name.split('/')[0])
        //   if (tar) {
        //     tar.pointings.push(data.pointings[i])
        //   } else {
        //     tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
        //     tar.pointings = [data.pointings[i]]
        //     target_point.push(tar)
        //   }
        // }
        //
        // let tbox = {x: 0, y: 3 + headerSize, w: box.w * 0.54, h: box.h - headerSize}
        // let blockg = g.append('g').attr('transform', 'translate(' + tbox.x + ',' + tbox.y + ')')
        // let scrollBox = initScrollBox('targetListScroll', blockg, tbox, {enabled: false})
        // let innerg = scrollBox.get('inner_g')
        //
        // let line = box.h * 0.15
        // let marg = line * 0.2
        // let interOffset = 0
        // let scroll_height = headerSize * 0.2
        // function pointingCore (pointings, g, offset) {
        //   let current = g
        //     .selectAll('g.pointing')
        //     .data(pointings, function (d) {
        //       return d.id
        //     })
        //   let enter = current
        //     .enter()
        //     .append('g')
        //     .attr('class', 'pointing')
        //   enter.each(function (d, i) {
        //     let g = d3.select(this)
        //     g.append('rect')
        //       .attr('x', -line * 0.58)
        //       .attr('y', -marg * 0.5)
        //       .attr('width', box.w * 0.535)
        //       .attr('height', line + marg) // Math.min(box.h, (line + 2) * schedB.blocks.length))
        //       .attr('fill', 'none') // i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
        //       .attr('stroke', '#000000')
        //       .attr('stroke-width', 0.05)
        //       // .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
        //     g.attr('transform', 'translate(' + (line * 0.35) + ',' + (offset + (marg + line) * i) + ')')
        //     let pevents = {
        //       click: function () { com.target.events.click('target', d.target_id) }
        //     }
        //     pointing_icon(g, {w: line, h: line}, 'P' + d.name.split('/')[1].split('-')[1], pevents, colorPalette)
        //     g.append('text')
        //       .text(d.pos[0])
        //       .style('fill', colorPalette.dark.stroke)
        //       .style('font-weight', '')
        //       .style('font-size', headerSize + 'px')
        //       .attr('text-anchor', 'start')
        //       .attr('transform', 'translate(' + (line * 2) + ',' + (line * 0.2 + headerSize * 0.5) + ')')
        //     g.append('text')
        //       .text(d.pos[1])
        //       .style('fill', colorPalette.dark.stroke)
        //       .style('font-weight', '')
        //       .style('font-size', headerSize + 'px')
        //       .attr('text-anchor', 'start')
        //       .attr('transform', 'translate(' + (line * 2) + ',' + (line * 0.2 + headerSize * 1.4) + ')')
        //   })
        //   let merge = current.merge(enter)
        //   merge.each(function (d, i) {
        //     let g = d3.select(this)
        //     g.attr('transform', 'translate(' + (line * 0.35) + ',' + (offset + (marg + line) * i) + ')')
        //     interOffset += marg + line
        //     scroll_height += marg + line
        //   })
        //   current
        //     .exit()
        //     .transition('in_out')
        //     .duration(times.anim)
        //     .style('opacity', 0)
        //     .remove()
        //   // offsetY += line * 1
        // }
        // function targetCore (targets, g, offset) {
        //   let current = g
        //     .selectAll('g.target')
        //     .data(targets, function (d) {
        //       return d.id
        //     })
        //   let enter = current
        //     .enter()
        //     .append('g')
        //     .attr('class', 'target')
        //   enter.each(function (d, i) {
        //     let g = d3.select(this)
        //     g.attr('transform', 'translate(' + (label[0].x + line * 0.25) + ',' + (offset + interOffset + (marg + line) * i) + ')')
        //     let tevents = {
        //       click: function () { com.target.events.click('target', d.id) }
        //     }
        //     target_icon(g, {w: line * 1.1, h: line * 1.1}, 'T' + d.name.split('_')[1], tevents, colorPalette)
        //
        //     g.append('text')
        //       .text(d.pos[0])
        //       .style('fill', colorPalette.dark.stroke)
        //       .style('font-weight', '')
        //       .style('font-size', headerSize + 'px')
        //       .attr('text-anchor', 'start')
        //       .attr('transform', 'translate(' + (label[0].w) + ',' + (line * 0.2 + headerSize * 0.5) + ')')
        //     g.append('text')
        //       .text(d.pos[1])
        //       .style('fill', colorPalette.dark.stroke)
        //       .style('font-weight', '')
        //       .style('font-size', headerSize + 'px')
        //       .attr('text-anchor', 'start')
        //       .attr('transform', 'translate(' + (label[0].w) + ',' + (line * 0.2 + headerSize * 1.4) + ')')
        //   })
        //   let merge = current.merge(enter)
        //   merge.each(function (d, i) {
        //     let g = d3.select(this)
        //     g.attr('transform', 'translate(' + (0 + line * 0.25) + ',' + (offset + interOffset + (marg + line + 4) * i) + ')')
        //     scroll_height += marg + line + 4
        //     // innerOffset += line
        //     pointingCore(d.pointings, g, line * 1.1 + marg)
        //   })
        //   current
        //     .exit()
        //     .transition('in_out')
        //     .duration(times.anim)
        //     .style('opacity', 0)
        //     .remove()
        // }
        // targetCore(target_point, innerg, headerSize * 0.5)
        // g.append('line')
        //   .attr('x1', tbox.x)
        //   .attr('y1', tbox.y + tbox.h)
        //   .attr('x2', tbox.x + tbox.w)
        //   .attr('y2', tbox.y + tbox.h)
        //   .attr('stroke', colorPalette.dark.stroke)
        //   .attr('stroke-width', 0.4)
        //   .style('opacity', scroll_height > tbox.h ? 1 : 0)
        // scrollBox.reset_vertical_scroller({can_scroll: true, scroll_height: scroll_height})
        // let height = box.w * 0.09
        // for (let i = 0; i < data.pointings.length; i++) {
        //   let pg = g.append('g').attr('transform', 'translate(' + (box.w * 0.48) + ',' + (box.h * 0.5) + ')')
        //   let pevents = {
        //     click: function () { com.target.events.click('target', data.target_id) }
        //   }
        //   pointing_icon(pg, {w: height, h: height}, 'P' + data.pointing_name.split('/')[1].split('_')[1], pevents, colorPalette)
        //   g.append('text')
        //     .text(data.pointing_pos[0])
        //     .style('fill', colorPalette.dark.stroke)
        //     .style('font-weight', '')
        //     .style('font-size', headerSize + 'px')
        //     .attr('text-anchor', 'start')
        //     .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.55 + headerSize * 0.5) + ')')
        //   g.append('text')
        //     .text(data.pointing_pos[1])
        //     .style('fill', colorPalette.dark.stroke)
        //     .style('font-weight', '')
        //     .style('font-size', headerSize + 'px')
        //     .attr('text-anchor', 'start')
        //     .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.55 + headerSize * 2) + ')')
        // }
        // let tg = g.append('g').attr('transform', 'translate(' + (box.w * 0.48) + ',' + (box.h * 0.15) + ')')
        // let tevents = {
        //   click: function () { com.target.events.click('target', data.target_id) }
        // }
        // target_icon(tg, {w: height, h: height}, 'T' + data.pointing_name.split('/')[0].split('_')[1], tevents, colorPalette)
        // g.append('text')
        //   .text(target.pos[0])
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', headerSize + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.175 + headerSize * 0.5) + ')')
        // g.append('text')
        //   .text(target.pos[1])
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', headerSize + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.175 + headerSize * 2) + ')')

        let gt = g.append('g')
            .attr('id', 'targetDisplayer')
            .attr('transform', 'translate(' + label[2].x + ',' + (label[2].y + 3) + ')')
        com.targetBlock = new TargetDisplayer({
            main: {
                tag: 'targetRootTag',
                g: gt,
                scroll: {
                },
                box: {
                    x: 0,
                    y: 0,
                    w: label[2].w,
                    h: box.h * 0.9,
                    marg: 0,
                },
                background: {
                    fill: colorPalette.brighter.background,
                    stroke: colorPalette.brighter.stroke,
                    strokeWidth: 0.5,
                },
            },

            displayer: 'defaultBib',
            defaultBib: {
                quickmap: {
                    enabled: false,
                    target: {
                        events: {
                            click: () => {},
                            over: () => {},
                            out: () => {},
                        },
                    },
                    pointing: {
                        events: {
                            click: () => {},
                            over: () => {},
                            out: () => {},
                        },
                    },
                },
                skymap: {
                    enabled: true,
                    g: undefined,
                    box: {
                        x: 0,
                        y: 0,
                        w: label[2].w,
                        h: box.h * 0.9,
                        marg: 0,
                    },
                    mainTarget: undefined,
                },
                legend: {
                    enabled: false,
                },
            },
            linkMap: {
                map: {
                    enabled: true,
                    g: undefined,
                    box: {
                        x: 0,
                        y: 0,
                        w: box.w,
                        h: box.h * 0.9,
                        marg: 0,
                    },
                },
            },

            filters: {
                targetFilters: [],
                filtering: [],
            },
            data: {
                raw: {
                    targets: [],
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
                    target: undefined,
                },
                focus: {
                    target: undefined,
                },
            },
        })
        com.targetBlock.init()
        com.targetBlock.update_data({
            data: {
                raw: {
                    targets: com.data.block.targets,
                    pointings: com.data.block.pointings,
                },
                modified: [],
            },
        })
        if (com.target.editable) {
            let sizeNewPointing = line * 0.8
            let gdropPointing = g.append('g').attr('transform', 'translate(' + (label[0].x) + ',' + (tbox.y - headerSize * 2) + ')')
            let dropPointing = new dropdown_d3()
            dropPointing.init({
                main: {
                    id: 'dropPointing',
                    g: gdropPointing,
                    dim: {
                        w: label[0].w + label[1].w,
                        h: sizeNewPointing * 1.3,
                    },
                    background: {
                        common: {
                            style: {
                                fill: colorPalette.medium.background,
                                stroke: colorPalette.medium.stroke,
                                'stroke-width': 0.2,
                            },
                            attr: {
                            },
                        },
                        hovered: {
                            style: {
                                fill: colorPalette.darkest.background,
                                stroke: colorPalette.darkest.stroke,
                                'stroke-width': 0.2,
                            },
                            attr: {
                            },
                        },
                    },
                    text: {
                        common: {
                            style: {
                                font: 'bold',
                                'font-size': '0px',
                                fill: colorPalette.medium.text,
                                anchor: 'start',
                                'pointer-events': 'none',
                                'user-select': 'none',
                            },
                            attr: {
                            },
                        },
                        hovered: {
                            style: {
                            },
                            attr: {
                            },
                        },
                    },
                },
                options: {
                    value: '',
                    blocked: true,
                    keepDropOpen: false,
                    list: [ 'coordinates', 'divergentes' ],
                    dim: {
                        w: (label[0].w + label[1].w) * 1.2,
                        h: title_size * 1.5,
                    },
                    nb: 2,
                    background: {
                        common: {
                            style: {
                                fill: colorPalette.medium.background,
                                stroke: colorPalette.medium.stroke,
                                'stroke-width': 0.2,
                            },
                            attr: {
                            },
                        },
                        hovered: {
                            style: {
                                fill: colorPalette.darkest.background,
                                stroke: colorPalette.darkest.stroke,
                                'stroke-width': 0.2,
                            },
                            attr: {
                            },
                        },
                    },
                    text: {
                        common: {
                            style: {
                                font: 'bold',
                                'font-size': '12px',
                                fill: colorPalette.medium.text,
                                anchor: 'start',
                                'pointer-events': 'none',
                                'user-select': 'none',
                            },
                            attr: {
                            },
                        },
                        hovered: {
                            style: {
                            },
                            attr: {
                            },
                        },
                    },
                },
                events: {
                    change: (d) => {
                        addNewPointing(d)
                    },
                },
            })

            // let sizeNewPointing = line * 0.8
            // let selector = dropDown_div(addPointingg,
            //   {x: -(label[1].x - sizeNewPointing), y: -8, w: label[0].w + label[1].w, h: sizeNewPointing * 1.3},
            //   'trg',
            //   {disabled: !com.schedule.editabled, value: '', options: ['coordinates', 'divergentes'], 'font-size': '0px'},
            //   {change: (d) => { addNewPointing(d) }, enter: (d) => { addNewPointing(d) }})

            let picon = pointing_icon(gdropPointing.append('g'), {
                w: sizeNewPointing * 1,
                h: sizeNewPointing * 0.8,
            }, '+', {
            }, colorPalette)
            picon.style('pointer-events', 'none')
                .attr('transform', 'translate(' + ((label[0].w + label[1].w - sizeNewPointing) * 0.3) + ',' + (sizeNewPointing * 0.25) + ')')
        }
    }
    function updatePointing_information() {
        let box = com.target.box
        let data = com.data.block

        let g = com.target.g

        let label = [
            // {x: 0, y: 3 + headerSize * 0.5 + txt_size * 0.3, w: box.w * 1, text: 'Targets & pointings mapping', anchor: 'middle'}
            {
                x: 0,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.10,
                text: 'Tgts',
                anchor: 'middle',
            },
            {
                x: box.w * 0.10,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.10,
                text: 'Ptgs',
                anchor: 'middle',
            },
            {
                x: box.w * 0.2,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.8,
                text: 'Mapping',
                anchor: 'middle',
            },
        ]

        let line = 20

        let tbox = com.target.target.box
        let innertg = com.target.target.scroll.get('inner_g')

        function targetCore(targets, g, offset) {
            let space = ((tbox.h * 1) - (targets.length * line)) / (targets.length)
            let current = g
                .selectAll('g.target')
                .data(targets, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'target')
            enter.each(function(d, i) {
                let g = d3.select(this)
                let tevents = {
                    click: function() {
                        com.target.events.click('target', d.id)
                    },
                    over: function() {},
                    out: function() {},
                }
                target_icon(g, {
                    w: line * 1.1,
                    h: line * 1.1,
                }, 'T' + get_target_short(d), tevents, colorPalette)
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                let offX = (label[0].x + label[0].w * 0.5 - line * 0.5)
                let offY = (space * 0.5 + (space + line) * i)
                if (line * targets.length > tbox.h) {
                    offY = line * i
                }
                g.attr('transform', 'translate(' + offX + ',' + offY + ')')
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        targetCore(data.targets, innertg, 0)
        com.target.target.scroll.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: line * data.targets.length,
        })

        let pbox = com.target.pointing.box
        let innerpg = com.target.pointing.scroll.get('inner_g')

        function pointingCore(pointings, g, offset) {
            let space = ((tbox.h * 1) - (pointings.length * line)) / (pointings.length)
            let current = g
                .selectAll('g.target')
                .data(pointings, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'target')
            enter.each(function(d, i) {
                let g = d3.select(this)
                let pevents = {
                    click: function() {},
                    over: function() {},
                    out: function() {},
                }
                pointing_icon(g, {
                    w: box.w * 0.07,
                    h: line,
                }, 'P' + get_pointing_value(d), pevents, colorPalette)
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                let offX = (label[0].x + label[0].w * 0.5 - line * 0.5)
                let offY = (space * 0.5 + (space + line) * i)
                if (line * pointings.length > pbox.h) {
                    offY = line * i
                }
                g.attr('transform', 'translate(' + offX + ',' + offY + ')')
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        pointingCore(data.pointings, innerpg, 0)
        com.target.pointing.scroll.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: line * data.pointings.length,
        })

        com.targetBlock.update_data({
            data: {
                raw: {
                    targets: com.data.block.targets,
                    pointings: com.data.block.pointings,
                },
                modified: [],
            },
        })
    }


    function switchTel(elem, tel) {
        let allTel = com.events.allTel()
        let trueBlockReference = []
        let trueBlock = []
        allTel.allTels = allTel.allTels.filter(function(d) {
            return com.data.block.tel_ids.indexOf(d.id) === -1
        })
        for (let i = 0; i < allTel.blocks.length; i++) {
            if (allTel.blocks[i].obs_block_id !== com.data.block.obs_block_id) {
                trueBlockReference.push(allTel.blocks[i])
                trueBlock.push(deep_copy(allTel.blocks[i]))
            }
        }

        let box = {
            x: com.telescope.box.x,
            y: com.telescope.box.y - com.telescope.box.h * 0.08,
            w: com.telescope.box.w,
            h: com.telescope.box.h,
        }
        let g = com.main.g.append('g')
            .attr('id', 'pointing')
            .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', box.w)
            .attr('height', box.h)
            .attr('fill', colorPalette.dark.background)
            .attr('stroke', colorPalette.medium.stroke)
            .attr('stroke-width', 0.4)
            .attr('rx', 2)

        let ibox = {
            x: 4,
            y: 4,
            w: box.w * 0.8,
            h: box.h - 16,
        }
        let largeBox = {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
        }
        let mediumBox = {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
        }
        let smallBox = {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
        }

        function duplicateTels() {
            for (let i = 0; i < trueBlock.length; i++) {
                let b1 = trueBlock[i]
                let newBlock = {
                    metadata: {
                        n_obs: '',
                        n_sched: '',
                        block_name: '+',
                    },
                    obs_block_id: '+',
                    name: '+',
                    tel_ids: [],
                }
                for (let z = b1.tel_ids.length - 1; z >= 0; z--) {
                    let dupli = false
                    for (let j = i + 1; j < trueBlock.length; j++) {
                        let b2Index = trueBlock[j].tel_ids.indexOf(b1.tel_ids[z])
                        if (b2Index !== -1) {
                            dupli = true
                            trueBlock[j].tel_ids.splice(b2Index, 1)
                        }
                    }
                    if (dupli) {
                        newBlock.tel_ids.push(b1.tel_ids.splice(z, 1)[0])
                    }
                }
                if (newBlock.tel_ids.length > 0) {
                    trueBlock.push(newBlock)
                }
            }
        }

        if (tel.id.includes('L')) {
            largeBox = {
                x: ibox.w * 0.35,
                y: 0,
                w: ibox.w * 0.16,
                h: ibox.h * 0.9,
            }
            allTel.allTels = allTel.allTels.filter(d => d.id.includes('L'))
            trueBlock.map(function(d) {
                d.tel_ids = d.tel_ids.filter(dd => dd.includes('L'))
            })
            duplicateTels()
            trueBlock = trueBlock.filter(d => d.tel_ids.length > 0)
        }
        else if (tel.id.includes('M')) {
            mediumBox = {
                x: ibox.w * 0.2,
                y: 0,
                w: ibox.w * 0.5,
                h: ibox.h * 0.9,
            }
            allTel.allTels = allTel.allTels.filter(d => d.id.includes('M'))
            trueBlock.map(function(d) {
                d.tel_ids = d.tel_ids.filter(dd => dd.includes('M'))
            })
            duplicateTels()
            trueBlock = trueBlock.filter(d => d.tel_ids.length > 0)
        }
        else if (tel.id.includes('S')) {
            smallBox = {
                x: ibox.w * 0.08,
                y: 0,
                w: ibox.w * 0.7,
                h: ibox.h * 0.9,
            }
            allTel.allTels = allTel.allTels.filter(d => d.id.includes('S'))
            trueBlock.map(function(d) {
                d.tel_ids = d.tel_ids.filter(dd => dd.includes('S'))
            })
            duplicateTels()
            trueBlock = trueBlock.filter(d => d.tel_ids.length > 0)
        }

        let choosenTel
        let gt = g.append('g')
            .attr('id', 'telsDisplayer')
            .attr('transform', 'translate(' + ibox.x + ',' + ibox.y + ')')
        com.telescopeSwitch = new TelescopeDisplayer({
            main: {
                tag: 'telescopeRootTag',
                g: gt,
                scroll: {
                },
                box: ibox,
                background: {
                    fill: 'none',
                    stroke: colorPalette.medium.stroke,
                    strokeWidth: 0,
                },
                is_south: true,
                colorPalette: colorPalette,
            },

            displayer: 'gridBib',
            gridBib: {
                header: {
                    top: false,
                    text: {
                        size: 0,
                        color: colorPalette.medium.background,
                    },
                    background: {
                        height: 0,
                        color: colorPalette.dark.stroke,
                    },
                },
                telescope: {
                    enabled: true,
                    centering: true,
                    large: {
                        g: undefined,
                        opt: {
                            telsPerRow: 1,
                            nbl: 0,
                            size: 2,
                            ratio: 1,
                        },
                        box: largeBox,
                    },
                    medium: {
                        g: undefined,
                        opt: {
                            telsPerRow: 4,
                            nbl: 0,
                            size: 1,
                            ratio: 1,
                        },
                        box: mediumBox,
                    },
                    small: {
                        g: undefined,
                        opt: {
                            telsPerRow: 12,
                            nbl: 0,
                            size: 0.5,
                            ratio: 1,
                        },
                        box: smallBox,
                    },
                },
                idle: {
                    txt_size: 10,
                    enabled: true,
                    background: {
                        enabled: false,
                        middle: {
                            color: colorPalette.dark.background,
                            opacity: 0,
                        },
                        side: {
                            color: colorPalette.dark.background,
                            opacity: 0,
                        },
                    },
                },
                blocks: {
                    txt_size: 8,
                    right: {
                        enabled: false,
                    },
                    left: {
                        enabled: true,
                    },
                    background: {
                        middle: {
                            color: colorPalette.darkest.background,
                            opacity: 0.0,
                        },
                        side: {
                            color: colorPalette.darker.background,
                            opacity: 0,
                        },
                    },
                },
            },

            filters: {
                telescopeFilters: [],
                filtering: [],
            },
            data: {
                raw: {
                    telescopes: [],
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
            events: {
                block: {
                    click: (d) => {},
                    mouseover: (d) => {},
                    mouseout: (d) => {},
                    drag: {
                        start: () => {},
                        tick: () => {},
                        end: () => {},
                    },
                },
                telescope: {
                    click: (d) => {
                        if (choosenTel && d.id === choosenTel.id) {
                            g.select('circle#choosenTelCircle')
                                .attr('fill', colorPalette.dark.background)
                                .attr('stroke-dasharray', [ 2, 2 ])
                            g.select('text#choosenTelName')
                                .text('Click')
                            choosenTel = undefined
                        }
                        else {
                            choosenTel = d
                            g.select('circle#choosenTelCircle')
                                .attr('stroke-dasharray', [])
                                .attr('fill', inst_health_col(choosenTel.val))
                            g.select('text#choosenTelName')
                                .text(get_tel_number(choosenTel))
                        }
                    },
                    mouseover: (d) => {},
                    mouseout: (d) => {},
                    drag: {
                        start: () => {},
                        tick: () => {},
                        end: () => {},
                    },
                },
            },
        })
        com.telescopeSwitch.init()
        com.telescopeSwitch.update_data({
            data: {
                raw: {
                    telescopes: allTel.allTels,
                    blocks: trueBlock,
                },
                modified: [],
            },
        })

        g.append('g').attr('id', 'chooseTarget').attr('transform', 'translate(' + (4) + ',' + (box.h * 0.5) + ')')

        // g.append('text')
        //   .text('Exchange')
        //   .attr('x', box.w * 0.8)
        //   .attr('y', box.h * 0.35)
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-size', 10 + 'px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        g.append('circle')
            .attr('id', 'choosenTelCircle')
            .attr('cx', box.w * 0.7)
            .attr('cy', box.h * 0.4)
            .attr('r', box.h * 0.075)
            .attr('fill', colorPalette.dark.background)
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.4)
            .attr('stroke-dasharray', [ 2, 2 ])
        g.append('text')
            .attr('id', 'choosenTelName')
            .text('Click')
            .attr('x', box.w * 0.7)
            .attr('y', box.h * 0.4 + txt_size * 0.33)
            .style('fill', colorPalette.dark.stroke)
            .style('font-weight', 'bold')
            .style('font-size', 9 + 'px')
            .attr('text-anchor', 'middle')
            .style('pointer-events', 'none')
        g.append('circle')
            .attr('cx', box.w * 0.9)
            .attr('cy', box.h * 0.4)
            .attr('r', box.h * 0.075)
            .attr('fill', inst_health_col(tel.health))
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.4)
        g.append('text')
            .text(get_tel_number(tel))
            .attr('x', box.w * 0.9)
            .attr('y', box.h * 0.4 + txt_size * 0.33)
            .style('fill', colorPalette.dark.stroke)
            .style('font-weight', 'bold')
            .style('font-size', 10 + 'px')
            .attr('text-anchor', 'middle')
            .style('pointer-events', 'none')

        g.append('rect')
            .attr('x', -16)
            .attr('y', -10)
            .attr('width', 32)
            .attr('height', 13)
            .attr('fill', colorPalette.dark.background)
            .attr('stroke', colorPalette.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.36) + ')')
            .on('click', function() {
                if (!choosenTel) {
                    return
                }
                for (let i = 0; i < trueBlockReference.length; i++) {
                    if (trueBlockReference[i].tel_ids.indexOf(choosenTel.id) !== -1) {
                        removeTelescopeFromBlock(trueBlockReference[i], choosenTel)
                    }
                }
                removeTelescopeFromBlock(com.data.block, tel)
                addTelescopeToBlock(com.data.block, choosenTel, elem)
                g.remove()
                update_input()
                // reassignTelescope()
                updateTelescope_information()
            })
            .on('mouseover', function(e, d) {
                d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
            })
            .on('mouseout', function(e, d) {
                d3.select(this).attr('fill', colorPalette.dark.background)
            })
            .attr('rx', 4)
        g.append('svg:image')
            .attr('xlink:href', '/static/icons/arrow-right.svg')
            .attr('width', 50)
            .attr('height', 13)
            .attr('x', -25)
            .attr('y', -10)
            .style('opacity', 0.5)
            .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.36) + ')')
            .style('pointer-events', 'none')
        // g.append('text')
        //   .text('Exchange')
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-size', 10 + 'px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.25) + ')')

        g.append('rect')
            .attr('x', -16)
            .attr('y', -10)
            .attr('width', 32)
            .attr('height', 13)
            .attr('fill', colorPalette.dark.background)
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.0)
            .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.5) + ')')
            .on('click', function() {
                if (!choosenTel) {
                    return
                }
                for (let i = 0; i < trueBlockReference.length; i++) {
                    if (trueBlockReference[i].tel_ids.indexOf(choosenTel.id) !== -1) {
                        let p = getTelescopePointing(trueBlockReference[i], choosenTel)
                        removeTelescopeFromBlock(trueBlockReference[i], choosenTel)
                        addTelescopeToBlock(trueBlockReference[i], tel, p)
                    }
                }
                removeTelescopeFromBlock(com.data.block, tel)
                addTelescopeToBlock(com.data.block, choosenTel, elem)
                g.remove()
                update_input()
                // reassignTelescope()
                updateTelescope_information()
                com.events.modification(com.data.block, false, 'switchTelescope')
            })
            .on('mouseover', function(e, d) {
                d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
            })
            .on('mouseout', function(e, d) {
                d3.select(this).attr('fill', colorPalette.dark.background)
            })
            .attr('rx', 4)
        g.append('svg:image')
            .attr('xlink:href', '/static/icons/arrow-left.svg')
            .attr('width', 50)
            .attr('height', 13)
            .attr('x', -25)
            .attr('y', -10)
            .style('opacity', 0.5)
            .attr('transform', 'translate(' + (box.w * 0.78) + ',' + (box.h * 0.5) + ')')
            .style('pointer-events', 'none')
        g.append('svg:image')
            .attr('xlink:href', '/static/icons/arrow-right.svg')
            .attr('width', 50)
            .attr('height', 13)
            .attr('x', -25)
            .attr('y', -10)
            .style('opacity', 0.5)
            .attr('transform', 'translate(' + (box.w * 0.82) + ',' + (box.h * 0.5) + ')')
            .style('pointer-events', 'none')

        g.append('rect')
            .attr('x', -20)
            .attr('y', -10)
            .attr('width', 40)
            .attr('height', 13)
            .attr('fill', colorPalette.darker.background)
            .attr('stroke', colorPalette.darker.stroke)
            .attr('stroke-width', 0.4)
            .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.95) + ')')
            .on('click', function() {
                g.remove()
            })
            .on('mouseover', function(e, d) {
                d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
            })
            .on('mouseout', function(e, d) {
                d3.select(this).attr('fill', colorPalette.darker.background)
            })
        g.append('text')
            .text('Cancel')
            .style('fill', colorPalette.dark.stroke)
            .style('font-weight', 'bold')
            .style('font-size', 10 + 'px')
            .attr('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.95) + ')')
    }

    function openOtherBlocks() {
        let box = {
            x: com.telescope.box.x,
            y: com.telescope.box.y + 30,
            w: com.telescope.box.w,
            h: com.telescope.box.h - 20 - 40,
        }
        com.telescope.g
            .transition()
            .duration(800)
            .attr('transform', 'translate(' + (box.x) + ',' + (com.target.box.y + 4) + ')')

        let resources = com.events.allTel()
        let allTel = resources.allTels
        let blocks = resources.blocks.filter(d => d.obs_block_id !== com.data.block.obs_block_id)
        com.otherBlocks = blocks
        let innerOtherBlock = {
        }
        let otherg = com.main.g.append('g').attr('id', 'otherg')
            .attr('transform', 'translate(' + box.x + ',' + (box.y + box.h) + ')')
        otherg.transition()
            .delay(200)
            .duration(600)
            .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
        let scroll = initScrollBox(com.main.tag + 'focusedConflictListScroll', otherg, box, {
            enabled: false,
        }, true)
        function initTelescope_information(block, box) {
            innerOtherBlock[block.obs_block_id] = {
            }
            let g = scroll.get('inner_g').append('g')
                .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
            // g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', box.w)
            //   .attr('height', box.h)
            //   .attr('fill', colorPalette.dark.background)
            //   .attr('stroke', colorPalette.dark.stroke)
            //   .attr('stroke-width', 0.2)

            innerOtherBlock[block.obs_block_id].g = g
            box.y = 0
            box.x = 20
            g.append('text')
                .text(block.metadata.block_name)
                .attr('x', box.x)
                .attr('y', box.y + txt_size * 1.5)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'end')
                .style('font-size', txt_size + 'px')
                .style('pointer-events', 'none')
                .attr('fill', colorPalette.dark.text)
                .attr('stroke', 'none')
            box.x = 25
            box.w -= 25
            box.y = 4
            let largeBox = {
                x: 0,
                y: 0,
                w: box.w * 0.16,
                h: box.h,
            }
            let mediumBox = {
                x: box.w * 0.16,
                y: 0,
                w: box.w * 0.27,
                h: box.h,
            }
            let smallBox = {
                x: box.w * 0.46,
                y: 0,
                w: box.w * 0.54,
                h: box.h,
            }
            box.h -= title_size * 2
            let gt = g.append('g')
                .attr('id', 'telsDisplayer')
                .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
            innerOtherBlock[block.obs_block_id].displayer = new TelescopeDisplayer({
                main: {
                    tag: 'telescopeRootTag' + block.obs_block_id,
                    g: gt,
                    scroll: {
                    },
                    box: box,
                    background: {
                        fill: colorPalette.medium.background,
                        stroke: colorPalette.medium.stroke,
                        strokeWidth: 0.1,
                    },
                    is_south: true,
                    colorPalette: colorPalette,
                },

                displayer: 'gridBib',
                gridBib: {
                    header: {
                        top: true,
                        text: {
                            size: 0, //headerSize,
                            color: colorPalette.medium.background,
                        },
                        background: {
                            height: 0, //headerSize + 2,
                            color: colorPalette.dark.stroke,
                        },
                    },
                    telescope: {
                        enabled: true,
                        centering: true,
                        large: {
                            g: undefined,
                            opt: {
                                telsPerRow: 3,
                                nbl: 0,
                                size: 2,
                                ratio: 1,
                            },
                            box: largeBox,
                        },
                        medium: {
                            g: undefined,
                            opt: {
                                telsPerRow: 10,
                                nbl: 0,
                                size: 1,
                                ratio: 1,
                            },
                            box: mediumBox,
                        },
                        small: {
                            g: undefined,
                            opt: {
                                telsPerRow: 18,
                                nbl: 0,
                                size: 0.5,
                                ratio: 1,
                            },
                            box: smallBox,
                        },
                    },
                    idle: {
                        txt_size: 0,
                        enabled: true,
                        background: {
                            middle: {
                                color: colorPalette.darker.background,
                                opacity: 1,
                            },
                            side: {
                                color: colorPalette.darker.background,
                                opacity: 1,
                            },
                        },
                    },
                    blocks: {
                        txt_size: 10,
                        right: {
                            enabled: false,
                        },
                        left: {
                            enabled: true,
                        },
                        background: {
                            middle: {
                                color: colorPalette.darkest.background,
                                opacity: 0.3,
                            },
                            side: {
                                color: colorPalette.darker.background,
                                opacity: 1,
                            },
                        },
                    },
                },

                filters: {
                    telescopeFilters: [],
                    filtering: [],
                },
                data: {
                    raw: {
                        telescopes: [],
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
                events: {
                    block: {
                        click: (d) => {}, // com.telescope.events.click('block', d.obs_block_id) },
                        mouseover: (d) => {},
                        mouseout: (d) => {},
                        drag: {
                            start: () => {},
                            tick: () => {},
                            end: () => {},
                        },
                    },
                    telescope: {
                        click: (d) => {},
                        mouseover: (d) => {},
                        mouseout: (d) => {},
                        drag: {
                            start: () => {},
                            tick: () => {},
                            end: () => {},
                        },
                    },
                    other: {
                        delTel: (d) => {}, // removeTel(d) },
                        switchTel: (elem, t) => {}, // switchTel(elem, t) }
                    },
                },
                interaction: {
                    delete: {
                        enabled: false,
                        event: () => {},
                    },
                    drag: {
                        enabled: false,
                        event: () => {},
                    },
                    switch: {
                        enabled: false,
                        event: () => {},
                    },
                },
            })
            innerOtherBlock[block.obs_block_id].displayer.init()

            function changeOtherTelescopeNumber(type, d) {
                let data = block.telescopes[type]
                function errorInTelescopeNumber() {

                }
                function decreaseMinimumTelsNumber() {
                    data.min = Number(d)
                    if (com.data.block.telescopes[type].ids.length < com.data.block.telescopes[type].min) {
                        for (let i = data.min; (i < data.ids.length && (com.data.block.telescopes[type].ids.length < com.data.block.telescopes[type].min)); i++) {
                            let t = data.ids[0]
                            forceExtractTelsFromBlock(blocks, t)
                            addTelescopeToBlock(com.data.block, {
                                id: t,
                            })
                        }
                    }
                }
                function increaseMinimumTelsNumber() {
                    data.min = Number(d)
                    if (data.min < data.ids.length) {
                        return
                    }
                    else {
                        let diff = d - data.ids.length
                        let allTelCopy = allTel.filter(function(d) {
                            return (type === 'large' ? d.id.includes('L') : (type === 'medium' ? d.id.includes('M') : d.id.includes('S')))
                        })
                        let idle = allTelCopy.filter(function(d) {
                            for (let i = 0; i < blocks.length; i++) {
                                if (blocks[i].telescopes[type].ids.indexOf(d.id) !== -1) {
                                    return false
                                }
                            }
                            return true
                        })
                        for (let i = 0; (i < diff && i < idle.length); i++) {
                            addTelescopeToBlock(block, idle[i])
                        }
                        for (let i = data.ids.length; i < data.min; i++) {
                            let t = extractRandomTelsFromBlock(blocks, type)
                            if (t === undefined) {
                                break
                            }
                            addTelescopeToBlock(block, {
                                id: t,
                            })
                        }
                    }
                }
                if (data.min < d) {
                    increaseMinimumTelsNumber()
                }
                if (data.min > d) {
                    decreaseMinimumTelsNumber()
                }

                if (data.ids.length < data.min) {
                    errorInTelescopeNumber()
                }

                for (let i = 0; i < blocks.length; i++) {
                    innerOtherBlock[blocks[i].obs_block_id].updateOtherInput()
                    innerOtherBlock[blocks[i].obs_block_id].updateOtherTelescope_information()
                }
                updateTotals()
                // svgTelsConflict.drawTelsAvailabilityCurve()
                update_input()
                updateTelescope_information()
                com.events.conflict(block)
            }
            innerOtherBlock[block.obs_block_id].updateOtherInput = function() {
                innerOtherBlock[block.obs_block_id].tels.large.property('value', function() {
                    return block.telescopes.large.min
                })
                innerOtherBlock[block.obs_block_id].tels.medium.property('value', function() {
                    return block.telescopes.medium.min
                })
                innerOtherBlock[block.obs_block_id].tels.small.property('value', function() {
                    return block.telescopes.small.min
                })
            }
            innerOtherBlock[block.obs_block_id].updateOtherTelescope_information = function() {
                let tels = []
                for (let i = 0; i < block.telescopes.large.ids.length; i++) {
                    tels.push({
                        id: block.telescopes.large.ids[i],
                        health: allTel.find(x => x.id === block.telescopes.large.ids[i]).val,
                    })
                }
                for (let i = 0; i < block.telescopes.medium.ids.length; i++) {
                    tels.push({
                        id: block.telescopes.medium.ids[i],
                        health: allTel.find(x => x.id === block.telescopes.medium.ids[i]).val,
                    })
                }
                for (let i = 0; i < block.telescopes.small.ids.length; i++) {
                    tels.push({
                        id: block.telescopes.small.ids[i],
                        health: allTel.find(x => x.id === block.telescopes.small.ids[i]).val,
                    })
                }
                innerOtherBlock[block.obs_block_id].displayer.update_data({
                    data: {
                        raw: {
                            telescopes: tels,
                            blocks: block,
                        },
                        modified: [],
                    },
                })
            }

            innerOtherBlock[block.obs_block_id].tels = {
            }
            innerOtherBlock[block.obs_block_id].tels.large = inputNumber(g,
                {
                    x: box.x + 2,
                    y: (box.y + box.h + 1),
                    w: 40,
                    h: 15,
                },
                'large',
                {
                    disabled: false,
                    value: block.telescopes.large.min,
                    min: 0,
                    max: block.telescopes.large.max,
                    step: 1,
                },
                {
                    change: (d) => {
                        changeOtherTelescopeNumber('large', d)
                    },
                    enter: (d) => {
                        changeOtherTelescopeNumber('large', d)
                    },
                })
            innerOtherBlock[block.obs_block_id].tels.medium = inputNumber(g,
                {
                    x: box.x + (0 + mediumBox.x + mediumBox.w * 0.5 - 20),
                    y: (box.y + box.h + 1),
                    w: 40,
                    h: 15,
                },
                'small',
                {
                    disabled: false,
                    value: block.telescopes.medium.min,
                    min: 0,
                    max: block.telescopes.medium.max,
                    step: 1,
                },
                {
                    change: (d) => {
                        changeOtherTelescopeNumber('medium', d)
                    },
                    enter: (d) => {
                        changeOtherTelescopeNumber('medium', d)
                    },
                })
            innerOtherBlock[block.obs_block_id].tels.small = inputNumber(g,
                {
                    x: box.x + (smallBox.x + smallBox.w * 0.5 - 25),
                    y: (box.y + box.h + 1),
                    w: 40,
                    h: 15,
                },
                'small',
                {
                    disabled: false,
                    value: block.telescopes.small.min,
                    min: 0,
                    max: block.telescopes.small.max,
                    step: 1,
                },
                {
                    change: (d) => {
                        changeOtherTelescopeNumber('small', d)
                    },
                    enter: (d) => {
                        changeOtherTelescopeNumber('small', d)
                    },
                })
            innerOtherBlock[block.obs_block_id].updateOtherTelescope_information()
        }
        let sizeRow = box.h / 2.1
        for (let i = 0; i < blocks.length; i++) {
            let ibox = {
                x: 0,
                y: sizeRow * i,
                w: box.w,
                h: sizeRow,
            }
            initTelescope_information(blocks[i], ibox)
        }
        scroll.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: sizeRow * blocks.length,
        })

        otherg.append('line')
            .attr('x1', 0)
            .attr('y1', box.h)
            .attr('x2', box.w)
            .attr('y2', box.h)
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.4)
        otherg.append('rect')
            .attr('id', 'isbalanced')
            .attr('x', 0)
            .attr('y', box.h)
            .attr('width', box.w)
            .attr('height', 40)
            .attr('fill', function() {
                return '#FFCCBC'
            })
        otherg.append('text')
            .text('Totals:')
            .attr('x', box.w * 0.1)
            .attr('y', box.h + 20)
            .style('font-weight', 'bold')
            .attr('text-anchor', 'end')
            .style('font-size', headerSize + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')
        otherg.append('text')
            .attr('id', 'totalLarge')
            .attr('x', box.w * 0.15)
            .attr('y', box.h + 20)
            .style('font-weight', 'bold')
            .attr('text-anchor', 'end')
            .style('font-size', title_size + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')
        otherg.append('text')
            .attr('id', 'totalMedium')
            .attr('x', box.w * 0.36)
            .attr('y', box.h + 20)
            .style('font-weight', 'bold')
            .attr('text-anchor', 'end')
            .style('font-size', title_size + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')
        otherg.append('text')
            .attr('id', 'totalSmall')
            .attr('x', box.w * 0.75)
            .attr('y', box.h + 20)
            .style('font-weight', 'bold')
            .attr('text-anchor', 'end')
            .style('font-size', title_size + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')

        otherg.append('rect')
            .attr('id', 'validateConflict')
            .attr('x', box.w - 24)
            .attr('y', box.h + 10)
            .attr('width', 20)
            .attr('height', 20)
            .attr('fill', colorPalette.darker.background)
            .attr('stroke', colorPalette.darker.stroke)
            .attr('stroke-width', 0.1)
            .style('opacity', 0)
            .on('click', function() {
                closeOtherBlocks()
                com.events.conflict(com.data.block)
            })
            .on('mouseover', function() {
                d3.select(this).attr('fill', colorPalette.darkest.background)
            })
            .on('mouseout', function(e, d) {
                d3.select(this).attr('fill', colorPalette.darker.background)
            })
        otherg.append('image')
            .attr('id', 'checkedConflict')
            .attr('xlink:href', '/static/icons/checked.svg')
            .attr('x', box.w - 20)
            .attr('y', box.h + 14)
            .attr('width', 12)
            .attr('height', 12)
            .style('opacity', 0)
            .style('pointer-events', 'none')
        updateTotals()
    }
    function updateTotals() {
        let otherg = com.main.g.select('g#otherg')
        if (!com.otherBlocks) {
            return
        }
        let l = com.data.block.telescopes.large.min + com.otherBlocks.reduce((accumulator, currentValue) => accumulator + Number(currentValue.telescopes.large.min), 0)
        let m = com.data.block.telescopes.medium.min + com.otherBlocks.reduce((accumulator, currentValue) => accumulator + Number(currentValue.telescopes.medium.min), 0)
        let s = com.data.block.telescopes.small.min + com.otherBlocks.reduce((accumulator, currentValue) => accumulator + Number(currentValue.telescopes.small.min), 0)
        otherg.select('text#totalLarge')
            .text(l)
        otherg.select('text#totalMedium')
            .text(m)
        otherg.select('text#totalSmall')
            .text(s)
        otherg.select('rect#isbalanced')
            .attr('fill', function() {
                if (l > 4 || m > 25 || s > 70) {
                    return '#FFCCBC'
                }
                return '#C8E6C9'
            })

        otherg.select('rect#validateConflict')
            .style('opacity', function() {
                if (l > 4 || m > 25 || s > 70) {
                    return 0
                }
                return 0.8
            })
        otherg.select('image#checkedConflict')
            .style('opacity', function() {
                if (l > 4 || m > 25 || s > 70) {
                    return 0
                }
                return 0.8
            })
    }
    function closeOtherBlocks() {
    // com.events.focus()
        com.otherBlocks = []
        com.telescope.g
            .transition()
            .duration(800)
            .attr('transform', 'translate(' + (com.telescope.box.x) + ',' + (com.telescope.box.y) + ')')
        com.main.g.select('g#otherg').remove()
    }

    function changeTelescopeNumber(type, d) {
        let data = com.data.block.telescopes[type]
        function errorTelescopeNumber() {
            com.main.g.select('rect#openOtherBox')
                .attr('enabled', true)
        }
        function correctTelescopeNumber() {
            com.main.g.select('rect#openOtherBox')
                .attr('enabled', false)
        }
        function decreaseMinimumTelsNumber() {
            data.min = Number(d)
            // let diff = data.ids.length - d
            // for (let i = 0; i < diff; i++) {
            //   removeTelescope({id: data.ids[0]})
            // }
        }
        function increaseMinimumTelsNumber() {
            data.min = Number(d)
            if (data.min < data.ids.length) {
                return
            }
            else {
                let diff = d - data.ids.length
                let allTel = com.events.allTel()
                allTel.allTels = allTel.allTels.filter(function(d) {
                    return (type === 'large' ? d.id.includes('L') : (type === 'medium' ? d.id.includes('M') : d.id.includes('S')))
                })
                let idle = allTel.allTels.filter(function(d) {
                    for (let i = 0; i < allTel.blocks.length; i++) {
                        if (allTel.blocks[i].telescopes[type].ids.indexOf(d.id) !== -1) {
                            return false
                        }
                    }
                    return true
                })
                for (let i = 0; (i < diff && i < idle.length); i++) {
                    addTelescope(idle[i])
                }
                for (let i = data.ids.length; i < data.min; i++) {
                    let t = extractRandomTelsFromBlock(allTel.blocks.filter(d => d.obs_block_id !== com.data.block.obs_block_id), type)
                    if (t === undefined) {
                        break
                    }
                    addTelescopeToBlock(com.data.block, {
                        id: t,
                    })
                }
            }
        }
        if (data.min < d) {
            increaseMinimumTelsNumber()
        }
        if (data.min > d) {
            decreaseMinimumTelsNumber()
        }

        if (data.ids.length < data.min) {
            errorTelescopeNumber()
        }
        else {
            correctTelescopeNumber()
        }

        update_input()
        updateTotals()
        updateTelescope_information()
        com.events.conflict(com.data.block)
        com.events.modification(com.data.block, false, 'telescopes' + type)
    // reassignTelescope()
    }
    function addTelescope(t, elem) {
        addTelescopeToBlock(com.data.block, t, elem)
    }
    function removeTel(t) {
        removeTelescope(t)
        update_input()
        updateTelescope_information()
    // reassignTelescope()
    }
    function removeTelescope(t) {
        removeTelescopeFromBlock(com.data.block, {
            id: t.id,
        })
    }
    function update_input() {
        com.main.g.select('text#largeTelNumber')
            .text(com.data.block.telescopes.large.ids.length)
        com.main.g.select('text#mediumTelNumber')
            .text(com.data.block.telescopes.medium.ids.length)
        com.main.g.select('text#smallTelNumber')
            .text(com.data.block.telescopes.small.ids.length)
        com.telescope.tels.large.property('value', function() {
            return com.data.block.telescopes.large.min
        })
        com.telescope.tels.medium.property('value', function() {
            return com.data.block.telescopes.medium.min
        })
        com.telescope.tels.small.property('value', function() {
            return com.data.block.telescopes.small.min
        })
    }
    function initTelescope_information() {
        let box = {
            x: com.telescope.box.x,
            y: com.telescope.box.y,
            w: com.telescope.box.w,
            h: com.telescope.box.h,
        }
        let g = com.main.g.append('g')
            .attr('id', 'telescopeGroup')
            .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        com.telescope.g = g
        box.y = 0
        // g.append('text')
        //   .text('Telescopes')
        //   .attr('x', box.w * 0.01)
        //   .attr('y', box.y + box.h)
        //   .style('font-weight', 'bold')
        //   .attr('text-anchor', 'start')
        //   .style('font-size', title_size + 'px')
        //   .style('pointer-events', 'none')
        //   .attr('fill', colorPalette.dark.text)
        //   .attr('stroke', 'none')
        box.y -= 2 + title_size
        g.append('line')
            .attr('x1', 0)
            .attr('y1', box.y + box.h)
            .attr('x2', box.w)
            .attr('y2', box.y + box.h)
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.2)

        box.y -= 1
        // g.append('rect')
        //   .attr('id', 'headerStrip')
        //   .attr('x', 0)
        //   .attr('y', box.y)
        //   .attr('width', box.w)
        //   .attr('height', headerSize)
        //   .attr('fill', colorPalette.dark.stroke)
        // let label = [
        //   {x: box.w * 0.5, y: box.y + headerSize * 0.5 + txt_size * 0.3, text: 'Minimal < Current < Maximal', anchor: 'middle'}
        // ]
        // for (let i = 0; i < label.length; i++) {
        //   g.append('text')
        //     .text(label[i].text)
        //     .style('fill', colorPalette.medium.background)
        //     .style('font-weight', 'bold')
        //     .style('font-size', txt_size + 'px')
        //     .attr('text-anchor', label[i].anchor)
        //     .attr('transform', 'translate(' + (label[i].x) + ',' + (label[i].y) + ')')
        // }

        // box.y += 21
        // box.h -= 21
        let xx = box.w * 0.11
        let ww = box.w * 0.86
        box.h -= title_size * 1.5
        let largeBox = {
            x: xx,
            y: 0,
            w: ww * 0.1,
            h: box.h,
        }
        let mediumBox = {
            x: xx + ww * 0.13,
            y: 0,
            w: ww * 0.3,
            h: box.h,
        }
        let smallBox = {
            x: xx + ww * 0.46,
            y: 0,
            w: ww * 0.54,
            h: box.h,
        }

        // let tels = {
        //   large: [],
        //   medium: [],
        //   small: []
        // }
        // for (let i = 0; i < data.tel_ids.length; i++) {
        //   let id = data.tel_ids[i]
        //   if (id[0] === 'S') {
        //     tels.small.push(getTelescopeById(id))
        //   } else if (id[0] === 'M') {
        //     tels.medium.push(getTelescopeById(id))
        //   } else if (id[0] === 'L') {
        //     tels.large.push(getTelescopeById(id))
        //   }
        // }

        let gt = g.append('g')
            .attr('id', 'telsDisplayer')
            .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
        com.telescopeRunningBlock = new TelescopeDisplayer({
            main: {
                tag: com.main.tag + 'telescopeRootTag',
                g: gt,
                scroll: {
                },
                box: box,
                background: {
                    fill: colorPalette.medium.background,
                    stroke: colorPalette.medium.stroke,
                    strokeWidth: 0,
                },
                is_south: true,
                colorPalette: colorPalette,
            },

            displayer: 'gridBib',
            gridBib: {
                header: {
                    top: true,
                    text: {
                        size: headerSize,
                        color: colorPalette.medium.background,
                    },
                    background: {
                        height: headerSize + 2,
                        color: colorPalette.dark.stroke,
                    },
                },
                telescope: {
                    enabled: true,
                    centering: true,
                    large: {
                        g: undefined,
                        opt: {
                            telsPerRow: 1,
                            nbl: 0,
                            size: 2,
                            ratio: 1,
                        },
                        box: largeBox,
                    },
                    medium: {
                        g: undefined,
                        opt: {
                            telsPerRow: 4,
                            nbl: 0,
                            size: 1,
                            ratio: 1,
                        },
                        box: mediumBox,
                    },
                    small: {
                        g: undefined,
                        opt: {
                            telsPerRow: 8,
                            nbl: 0,
                            size: 0.5,
                            ratio: 1,
                        },
                        box: smallBox,
                    },
                },
                idle: {
                    txt_size: 0,
                    enabled: true,
                    background: {
                        middle: {
                            color: colorPalette.darker.background,
                            opacity: 1,
                        },
                        side: {
                            color: colorPalette.dark.background,
                            opacity: 1,
                        },
                    },
                },
                blocks: {
                    txt_size: 10,
                    right: {
                        enabled: false,
                    },
                    left: {
                        enabled: true,
                        template: 'pointing',
                    },
                    background: {
                        middle: {
                            color: colorPalette.darkest.background,
                            opacity: 0.3,
                        },
                        side: {
                            color: colorPalette.darker.background,
                            opacity: 1,
                        },
                    },
                },
            },

            filters: {
                telescopeFilters: [],
                filtering: [],
            },
            data: {
                raw: {
                    telescopes: [],
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
            events: {
                block: {
                    click: undefined,
                    mouseover: undefined,
                    mouseout: undefined,
                    drag: {
                        start: () => {},
                        tick: () => {},
                        end: () => {},
                    },
                },
                telescope: {
                    click: (d) => {
                        com.telescope.events.click('telescope', d.id)
                    },
                    mouseover: (d) => {},
                    mouseout: (d) => {},
                    drag: {
                        start: () => {},
                        tick: () => {},
                        end: () => {},
                    },
                },
                other: {
                    delTel: (d) => {
                        removeTel(d); com.events.modification(com.data.block, false, 'deleteTelescope')
                    },
                    switchTel: (elem, t) => {
                        switchTel(elem, t)
                    },
                },
            },
            interaction: {
                delete: {
                    enabled: com.schedule.editabled,
                    event: () => {},
                },
                drag: {
                    enabled: com.schedule.editabled,
                    event: () => {},
                },
                switch: {
                    enabled: com.schedule.editabled,
                    event: () => {},
                },
            },
        })
        com.telescopeRunningBlock.init()

        g.append('text')
            .attr('id', 'largeTelNumber')
            .text(com.data.block.telescopes.large.ids.length)
            .attr('x', largeBox.x + largeBox.w * 0.5)
            .attr('y', box.y + box.h + 1 + headerSize)
            .style('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .style('font-size', title_size + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')
        g.append('text')
            .attr('id', 'mediumTelNumber')
            .text(com.data.block.telescopes.medium.ids.length)
            .attr('x', mediumBox.x + mediumBox.w * 0.5)
            .attr('y', box.y + box.h + 1 + headerSize)
            .style('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .style('font-size', title_size + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')
        g.append('text')
            .attr('id', 'smallTelNumber')
            .text(com.data.block.telescopes.small.ids.length)
            .attr('x', smallBox.x + smallBox.w * 0.5)
            .attr('y', box.y + box.h + 1 + headerSize)
            .style('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .style('font-size', title_size + 'px')
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')

        function createInput(tel_type, g, innerbox) {
            com.telescope.tels[tel_type + 'Opts'] = {
                disabled: !com.schedule.editabled,
                value: com.data.block.telescopes[tel_type].min,
                min: 0,
                max: com.data.block.telescopes[tel_type].max,
                step: 1,
            }
            com.telescope.tels[tel_type] = input_number_d3(g,
                {
                    x: (innerbox.x + innerbox.w * 0.5 - 6),
                    y: (box.y + box.h + headerSize * 2),
                    w: 12,
                    h: 15,
                },
                tel_type,
                com.telescope.tels[tel_type + 'Opts'],
                {
                    change: (d) => {
                        changeTelescopeNumber(tel_type, d)
                    },
                    enter: (d) => {
                        changeTelescopeNumber(tel_type, d)
                    },
                })

            com.telescope.tels[tel_type + 'minus_button'] = new button_d3()
            com.telescope.tels[tel_type + 'minus_button'].init({
                main: {
                    id: tel_type + 'minus_button',
                    g: g,
                    box: {
                        x: (innerbox.x + innerbox.w * 0.5 - 23),
                        y: (box.y + box.h + headerSize * 2),
                        width: 15,
                        height: 15,
                    },
                    background: {
                        common: {
                            style: {
                                fill: colorPalette.medium.background,
                                stroke: colorPalette.medium.stroke,
                                'stroke-width': 0.1,
                            },
                            attr: {
                                rx: 2,
                            },
                        },
                        hovered: {
                            style: {
                                fill: colorPalette.darkest.background,
                                stroke: colorPalette.darkest.stroke,
                                'stroke-width': 0.1,
                            },
                            attr: {
                            },
                        },
                    },
                },
                foreground: {
                    type: 'text',
                    value: '-',
                    common: {
                        style: {
                            font: 'bold',
                            'font-size': '18px',
                            fill: colorPalette.medium.text,
                            anchor: 'middle',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                            x: (innerbox.x + innerbox.w * 0.5 - 28) + 10,
                            y: (box.y + box.h + headerSize * 2) + 12.5,
                        },
                    },
                    hovered: {
                        style: {
                            font: 'bold',
                            'font-size': '14px',
                            fill: colorPalette.medium.text,
                            anchor: 'start',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                        },
                    },
                },
                events: {
                    click: (d) => {
                        let oldValue = parseInt(com.telescope.tels[tel_type].property('value'))
                        let new_val = oldValue
                        if (oldValue > com.telescope.tels[tel_type + 'Opts'].min) {
                            new_val = oldValue - 1
                        }
                        com.telescope.tels[tel_type].property('value', ('' + new_val).slice(-2))
                        changeTelescopeNumber(tel_type, com.telescope.tels[tel_type].property('value'))
                    },
                },
            })

            com.telescope.tels[tel_type + 'plus_button'] = new button_d3()
            com.telescope.tels[tel_type + 'plus_button'].init({
                main: {
                    id: tel_type + 'plus_button',
                    g: g,
                    box: {
                        x: (innerbox.x + innerbox.w * 0.5 + 8),
                        y: (box.y + box.h + headerSize * 2),
                        width: 15,
                        height: 15,
                    },
                    background: {
                        common: {
                            style: {
                                fill: colorPalette.medium.background,
                                stroke: colorPalette.medium.stroke,
                                'stroke-width': 0.1,
                            },
                            attr: {
                                rx: 2,
                            },
                        },
                        hovered: {
                            style: {
                                fill: colorPalette.darkest.background,
                                stroke: colorPalette.darkest.stroke,
                                'stroke-width': 0.1,
                            },
                            attr: {
                            },
                        },
                    },
                },
                foreground: {
                    type: 'text',
                    value: '+',
                    common: {
                        style: {
                            font: 'bold',
                            'font-size': '14px',
                            fill: colorPalette.medium.text,
                            anchor: 'middle',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                            x: (innerbox.x + innerbox.w * 0.5 + 8) + 4,
                            y: (box.y + box.h + headerSize * 2) + 12.5,
                        },
                    },
                    hovered: {
                        style: {
                            font: 'bold',
                            'font-size': '14px',
                            fill: colorPalette.medium.text,
                            anchor: 'start',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                        },
                    },
                },
                events: {
                    click: (d) => {
                        let oldValue = parseInt(com.telescope.tels[tel_type].property('value'))
                        let new_val = oldValue
                        if (oldValue < com.telescope.tels[tel_type + 'Opts'].max) {
                            new_val = oldValue + 1
                        }
                        com.telescope.tels[tel_type].property('value', ('' + new_val).slice(-2))
                        changeTelescopeNumber(tel_type, com.telescope.tels[tel_type].property('value'))
                    },
                },
            })
        }
        if (com.schedule.editabled) {
            com.telescope.tels = {
            }

            createInput('large', g, largeBox)
            createInput('medium', g, mediumBox)
            createInput('small', g, smallBox)

            let layoutBox = {
                x: box.w - 17,
                y: box.y + box.h * 1,
                w: 17,
                h: 17,
            }
            g.append('rect')
                .attr('x', layoutBox.x)
                .attr('y', layoutBox.y)
                .attr('width', layoutBox.w)
                .attr('height', layoutBox.h)
                .attr('fill', 'transparent')
                .attr('stroke', colorPalette.darker.stroke)
                .attr('stroke-width', 0.2)
                .on('click', function() {
                    reassignTelescope(com.data.block)
                    updateTelescope_information()
                    com.events.modification(com.data.block, false, 'changeTelescopes_layout')
                })
                .on('mouseover', function(e, d) {
                    d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
                })
                .on('mouseout', function(e, d) {
                    d3.select(this).attr('fill', 'transparent')
                })
            g.append('svg:image')
                .attr('xlink:href', '/static/icons/arrows-mix.svg')
                .attr('x', layoutBox.x + layoutBox.w * 0.15)
                .attr('y', layoutBox.y + layoutBox.h * 0.15)
                .attr('width', layoutBox.w * 0.7)
                .attr('height', layoutBox.h * 0.7)
                .style('opacity', 0.5)
                .style('pointer-events', 'none')
            let otherBox = {
                x: box.w - 17,
                y: box.y + box.h * 1 + 20,
                w: 17,
                h: 17,
            }
            g.append('rect')
                .attr('id', 'openOtherBox')
                .attr('x', otherBox.x)
                .attr('y', otherBox.y)
                .attr('width', otherBox.w)
                .attr('height', otherBox.h)
                .attr('fill', 'transparent')
                .attr('stroke', colorPalette.darker.stroke)
                .attr('stroke-width', 0.2)
                .attr('enabled', 'false')
                .attr('clicked', 'false')
                .on('click', function() {
                    if (d3.select(this).attr('clicked') === 'false') {
                        d3.select(this).attr('clicked', 'true')
                        openOtherBlocks()
                    }
                    else if (d3.select(this).attr('clicked') === 'true') {
                        d3.select(this).attr('clicked', 'false')
                        closeOtherBlocks()
                    }
                })
                .on('mouseover', function(e, d) {
                    // if (d3.select(this).attr('enabled') === 'true')
                    d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
                })
                .on('mouseout', function(e, d) {
                    // if (d3.select(this).attr('enabled') === 'true')
                    d3.select(this).attr('fill', 'transparent')
                })
            g.append('svg:image')
                .attr('xlink:href', '/static/icons/menu.svg')
                .attr('x', otherBox.x + otherBox.w * 0.15)
                .attr('y', otherBox.y + otherBox.h * 0.15)
                .attr('width', otherBox.w * 0.7)
                .attr('height', otherBox.h * 0.7)
                .style('opacity', 0.5)
                .style('pointer-events', 'none')
        }

        updateTelescope_information()
    }
    function updateTelescope_information() {
        let tels = []
        for (let i = 0; i < com.data.block.telescopes.large.ids.length; i++) {
            tels.push({
                id: com.data.block.telescopes.large.ids[i],
                health: com.data.tels.find(x => x.id === com.data.block.telescopes.large.ids[i]).val,
            })
        }
        for (let i = 0; i < com.data.block.telescopes.medium.ids.length; i++) {
            tels.push({
                id: com.data.block.telescopes.medium.ids[i],
                health: com.data.tels.find(x => x.id === com.data.block.telescopes.medium.ids[i]).val,
            })
        }
        for (let i = 0; i < com.data.block.telescopes.small.ids.length; i++) {
            tels.push({
                id: com.data.block.telescopes.small.ids[i],
                health: com.data.tels.find(x => x.id === com.data.block.telescopes.small.ids[i]).val,
            })
        }
        com.telescopeRunningBlock.update_data({
            data: {
                raw: {
                    telescopes: tels,
                    blocks: com.data.block.pointings,
                },
                modified: [],
            },
        })
    }
}
