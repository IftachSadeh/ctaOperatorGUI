/* global d3 */
/* global blockStyle */
/* global load_script */
/* global colorPalette */
/* global is_def */
/* global times */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */

load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/blocks/common.js',
})

window.TargetForm = function(opt_in) {
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
        createTitle()
        createAssociatedBlocks()
        createPointing_information()
    }
    this.init = init

    function update() {
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

    function createTitle() {
        let tar = com.data.target
        let box = com.tree.box
        let g = com.main.g.append('g')
            .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        com.tree.g = g
        let height = box.h * 0.7

        g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', height)
            .attr('height', height)
            .attr('fill', colorPalette.dark.background)
            .attr('stroke', colorPalette.medium.stroke)
            .attr('stroke-width', 0.6)
        // .style('boxShadow', '10px 20px 30px black')
            .attr('rx', height)
            .on('click', function() {
                com.tree.events.click('target', tar.id)
            })
            .on('mouseover', function(d) {
                d3.select(this).style('cursor', 'pointer')
                d3.select(this).attr('fill', colorPalette.darker.background)
            })
            .on('mouseout', function(d) {
                d3.select(this).style('cursor', 'default')
                d3.select(this).attr('fill', colorPalette.dark.background)
            })
        g.append('svg:image')
            .attr('xlink:href', '/static/icons/round-target.svg')
            .attr('width', height * 1)
            .attr('height', height * 1)
            .attr('x', height * 0.0)
            .attr('y', height * 0.5 - height * 0.5)
            .style('opacity', 0.5)
            .style('pointer-events', 'none')
        g.append('text')
            .text('T' + get_target_short(tar))
            .attr('x', height * 0.5)
            .attr('y', height * 0.5 + txt_size * 0.3)
            .style('font-weight', '')
            .attr('text-anchor', 'middle')
            .style('font-size', headerSize + 'px')
            .attr('dy', 0)
            .style('pointer-events', 'none')
            .attr('fill', colorPalette.dark.text)
            .attr('stroke', 'none')
        g.append('svg:image')
            .attr('xlink:href', '/static/icons/cross.svg')
            .attr('x', height * 0.7)
            .attr('y', 0)
            .attr('width', 15)
            .attr('height', 15)
            .style('opacity', 0.5)
            .style('pointer-events', 'none')
    }
    function createAssociatedBlocks() {
        let scheds = com.data.schedB
        let box = com.ressource.box
        let g = com.main.g.append('g')
            .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        com.ressource.g = g

        g.append('text')
            .text('Associated ressources:')
            .style('fill', colorPalette.dark.stroke)
            .style('font-weight', 'bold')
            .style('font-size', title_size + 'px')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
        g.append('line')
            .attr('x1', box.w * 0.0)
            .attr('y1', 2)
            .attr('x2', box.w * 1.0)
            .attr('y2', 2)
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.2)

        // g.append('rect')
        //   .attr('id', 'headerStrip')
        //   .attr('x', 0)
        //   .attr('y', 3)
        //   .attr('width', box.w)
        //   .attr('height', headerSize)
        //   .attr('fill', colorPalette.dark.stroke)
        let label = [
            {
                x: box.w * 0.01,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.119,
                text: 'Sched',
                anchor: 'start',
            },
            {
                x: box.w * 0.12,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.88,
                text: 'Obs',
                anchor: 'start',
            },
        ]
        // for (let i = 0; i < label.length; i++) {
        //   g.append('text')
        //     .text(label[i].text)
        //     .style('fill', colorPalette.medium.background)
        //     .style('font-weight', 'bold')
        //     .style('font-size', txt_size + 'px')
        //     .attr('text-anchor', label[i].anchor)
        //     .attr('transform', 'translate(' + (label[i].x) + ',' + (label[i].y) + ')')
        //   // g.append('rect')
        //   //   .attr('x', 0)
        //   //   .attr('y', 0)
        //   //   .attr('width', label[i].w)
        //   //   .attr('height', box.h)
        //   //   .attr('stroke', '#000000')
        //   //   .attr('stroke-width', 0.05)
        //   //   .attr('fill', i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
        //   //   .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
        // }

        let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + (3 + 0) + ')')
        com.ressource.scrollBox = initScrollBox(com.main.tag + 'targetRessourceScroll', blockg, box, {
            enabled: false,
        })
        let innerg = com.ressource.scrollBox.get('inner_g')

        let squareTemplate = {
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
        let line = 80
        let dimPoly = 25
        function pointingCore(pointings, pg, x, y, w, h) {
            pg.attr('transform', 'translate(' + x + ',' + y + ')')
            pg.append('rect')
                .attr('x', 4)
                .attr('y', 4)
                .attr('width', w - 8)
                .attr('height', h - 8)
                .attr('rx', 4)
                .attr('fill', colorPalette.darker.background)
                .attr('stroke', colorPalette.darker.stroke)
                .attr('stroke-width', 0.2)
            let psize = {
                w: Math.min(w / 3, 25),
                h: Math.min(h / 3, 20),
            }
            let current = pg
                .selectAll('g.pointing')
                .data(pointings, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'pointing')
            enter.each(function(d, i) {
                let g = d3.select(this)
                let pevents = {
                    click: function() {},
                    over: function() {},
                    out: function() {},
                }
                pointing_icon(g, {
                    w: psize.w,
                    h: psize.h,
                }, 'P' + get_pointing_value(d), pevents, colorPalette)
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                let pos = squareTemplate[pointings.length][i]
                g.attr('transform', 'translate(' + ((pos.x * w) - (psize.w * 0.5)) + ',' + ((pos.y * h) - (psize.h * 0.5)) + ')')
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
            // offsetY += line * 1
        }
        function blockCore(blocks, g, offset) {
            let blockSize = {
                w: Math.min((label[1].w * 0.98) / blocks.length, 40),
                h: 20,
            }
            let spaceBlock = ((label[1].w * 0.98) - (blocks.length * blockSize.w)) / (blocks.length)

            g.attr('transform', 'translate(' + label[1].x + ',' + 0 + ')')
            let current = g
                .selectAll('g.block')
                .data(blocks, function(d) {
                    return d.obs_block_id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'block')
            enter.each(function(d, i) {
                let g = d3.select(this)
                let palette = blockStyle(d)
                g.append('rect')
                    .attr('x', blockSize.h * 0.5)
                    .attr('y', (line - blockSize.h) * 0.5)
                    .attr('width', blockSize.h)
                    .attr('height', blockSize.h)
                    .attr('fill', palette.color.background)
                    .attr('stroke', palette.color.stroke)
                    .attr('stroke-width', 0.1)
                    .on('click', function() {
                        com.ressource.events.click('block', d.obs_block_id)
                    })
                    .on('mouseover', function(d) {
                        d3.select(this).style('cursor', 'pointer')
                        d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
                    })
                    .on('mouseout', function(d) {
                        d3.select(this).style('cursor', 'default')
                        d3.select(this).attr('fill', palette.color.background)
                    })
                g.append('text')
                    .text(d.metadata.n_obs)
                    .style('fill', '#000000')
                    .style('font-weight', 'bold')
                    .style('font-size', headerSize + 'px')
                    .attr('text-anchor', 'middle')
                    .attr('transform', 'translate(' + (blockSize.h) + ',' + (line * 0.5 + txt_size * 0.3) + ')')
                    .style('pointer-events', 'none')
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                g.attr('transform', 'translate(' + (spaceBlock * 0.5 + (spaceBlock + blockSize.w) * i) + ',' + (offset) + ')')
                // pointingCore(d.pointings, g.append('g').attr('id', 'pointings' + d.obs_block_id), -spaceBlock * 0.5, blockSize.h * 0.75, spaceBlock + blockSize.w, line - blockSize.h * 1.25)
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
            // offsetY += line * 1
        }
        function schedCore(scheds, g, offset) {
            let innerOffset = 0
            let current = g
                .selectAll('g.sched')
                .data(scheds, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'sched')
            enter.each(function(d, i) {
                let g = d3.select(this)
                // g.append('rect')
                //   .attr('x', 0)
                //   .attr('y', 0)
                //   .attr('width', box.w)
                //   .attr('height', line)
                //   .attr('fill', '#666666')
                //   .attr('stroke', '#000000')
                //   .attr('stroke-width', 0.05)
                //   .attr('fill-opacity', i % 2 === 0 ? 0.05 : 0.1)
                //   .attr('rx', 4)
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
                    .attr('stroke-width', 0.8)
                    .on('click', function() {
                        com.ressource.events.click('sched_block', d.id)
                    })
                    .on('mouseover', function(d) {
                        d3.select(this).style('cursor', 'pointer')
                        d3.select(this).attr('fill', colorPalette.darker.background)
                    })
                    .on('mouseout', function(d) {
                        d3.select(this).style('cursor', 'default')
                        d3.select(this).attr('fill', colorPalette.dark.background)
                    })
                    .attr('transform', 'translate(' + ((label[0].w - dimPoly) * 0.5) + ',' + ((line - dimPoly) * 0.5) + ')')
                g.append('text')
                    .text('S' + d.blocks[0].metadata.n_sched)
                    .style('fill', colorPalette.dark.text)
                    .style('font-weight', 'bold')
                    .style('font-size', title_size + 'px')
                    .attr('text-anchor', 'middle')
                    .attr('transform', 'translate(' + (label[0].w * 0.5) + ',' + (line * 0.5 + txt_size * 0.3) + ')')
                    .style('pointer-events', 'none')
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                g.attr('transform', 'translate(' + 0 + ',' + (offset + innerOffset + line * i) + ')')
                // innerOffset += line
                blockCore(d.blocks, g.append('g'), 0)
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        schedCore(scheds, innerg, 4)
        com.ressource.scrollBox.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: 2 + scheds.length * line,
        })
        blockg.append('line')
            .attr('x1', box.x)
            .attr('y1', box.h)
            .attr('x2', box.w)
            .attr('y2', box.h)
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.2)
    }
    function createPointing_information() {
        let target = com.data.target
        let box = com.target.box
        let g = com.main.g.append('g')
            .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        com.target.g = g

        // g.append('rect')
        //   .attr('id', 'headerStrip')
        //   .attr('x', 0)
        //   .attr('y', 3)
        //   .attr('width', box.w)
        //   .attr('height', headerSize)
        //   .attr('fill', colorPalette.dark.stroke)
        let label = [
            {
                x: box.w * 0.01,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.33,
                text: 'Target',
                anchor: 'start',
            },
            {
                x: box.w * 0.33,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.33,
                text: 'Pointing',
                anchor: 'start',
            },
            {
                x: box.w * 0.66,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.34,
                text: 'offset',
                anchor: 'start',
            },
        ]
        // for (let i = 0; i < label.length; i++) {
        //   g.append('text')
        //     .text(label[i].text)
        //     .style('fill', colorPalette.medium.background)
        //     .style('font-weight', 'bold')
        //     .style('font-size', txt_size + 'px')
        //     .attr('text-anchor', label[i].anchor)
        //     .attr('transform', 'translate(' + (label[i].x) + ',' + (label[i].y) + ')')
        //   g.append('rect')
        //     .attr('x', 0)
        //     .attr('y', 0)
        //     .attr('width', label[i].w)
        //     .attr('height', box.w * 0.19 - headerSize - 4)
        //     .attr('stroke', '#000000')
        //     .attr('stroke-width', 0.05)
        //     .attr('fill', i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
        //     .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
        // }

        // g.append('text')
        //   .text(target.name)
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-style', '')
        //   .style('font-size', headerSize + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.01) + ',' + (box.w * 0.075) + ')')
        // g.append('text')
        //   .text(target.pos[0])
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txt_size + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.01) + ',' + ((box.w * 0.075) + txt_size * 1.6) + ')')
        // g.append('text')
        //   .text(target.pos[1])
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txt_size + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.01) + ',' + ((box.w * 0.075) + txt_size * 3.2) + ')')
        //
        // g.append('text')
        //   .attr('id', 'pointing_name')
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-style', '')
        //   .style('font-size', headerSize + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.33) + ',' + (box.w * 0.075) + ')')
        // g.append('text')
        //   .attr('id', 'pointing_posX')
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txt_size + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.33) + ',' + ((box.w * 0.075) + txt_size * 1.6) + ')')
        // g.append('text')
        //   .attr('id', 'pointing_posY')
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txt_size + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.33) + ',' + ((box.w * 0.075) + txt_size * 3.2) + ')')

        // g.append('text')
        //   .attr('id', 'offsetX')
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txt_size + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.66) + ',' + ((box.w * 0.075) + txt_size * 1.6) + ')')
        // g.append('text')
        //   .attr('id', 'offsetY')
        //   .style('fill', colorPalette.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txt_size + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (box.w * 0.66) + ',' + ((box.w * 0.075) + txt_size * 3.2) + ')')

        // g.append('rect')
        //   .attr('id', 'headerStrip')
        //   .attr('x', 0)
        //   .attr('y', headerSize * 6)
        //   .attr('width', box.w * 0.14)
        //   .attr('height', headerSize)
        //   .attr('fill', colorPalette.dark.stroke)
        // g.append('text')
        //   .text('Link list')
        //   .style('fill', colorPalette.medium.background)
        //   .style('font-weight', 'bold')
        //   .style('font-size', txt_size + 'px')
        //   .attr('text-anchor', 'middle')
        //   .attr('transform', 'translate(' + (box.w * 0.14 * 0.5) + ',' + (headerSize * 6.5 + txt_size * 0.33) + ')')

        let tbox = {
            x: 0,
            y: headerSize * 6 + headerSize,
            w: box.w * 0.14,
            h: box.h - headerSize * 7.5,
        }
        let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + tbox.y + ')')
        let scrollBox = initScrollBox(com.main.tag + 'targetListScroll', blockg, tbox, {
            enabled: false,
        })
        let innerg = scrollBox.get('inner_g')

        let allPoint = []
        let line = 20
        let marg = line * 0.2
        let interOffset = 0
        let scroll_height = headerSize * 0.2
        function pointingCore(blocks, pg, offset) {
            let pointings = []
            let linkbetween = {
            }
            for (let i = 0; i < blocks.length; i++) {
                for (let j = 0; j < blocks[i].pointings.length; j++) {
                    if (blocks[i].pointings[j].name.includes(target.name)) {
                        pointings.push(blocks[i].pointings[j])
                        linkbetween[blocks[i].pointings[j].name] = blocks[i].obs_block_id
                    }
                }
            }
            allPoint = allPoint.concat(pointings)

            let current = pg
                .selectAll('g.pointing')
                .data(pointings, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'pointing')
            enter.each(function(d, i) {
                let g = d3.select(this)
                let pevents = {
                    click: function() {
                        com.target.events.click('block', linkbetween[d.name])
                    },
                    over: function() {
                        com.target.g.select('text#pointing_name').text(d.name)
                        com.target.g.select('text#pointing_posX').text(d.pos[0])
                        com.target.g.select('text#pointing_posY').text(d.pos[1])

                        com.target.g.select('text#offsetX').text(d.pos[0] - target.pos[0])
                        com.target.g.select('text#offsetY').text(d.pos[1] - target.pos[1])
                    },
                    out: function() {},
                }
                pointing_icon(g, {
                    w: line * 1.4,
                    h: line * 0.9,
                }, get_pointing_short(d) + 'P' + get_pointing_value(d), pevents, colorPalette)
                scroll_height += (marg + line * 0.9)
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                g.attr('transform', 'translate(' + (line * 0.4) + ',' + (offset + (marg + line * 0.9) * i) + ')')
                interOffset += marg + line * 0.9
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
            // offsetY += line * 1
        }
        function schedBCore(schedB, g, offset) {
            let current = g
                .selectAll('g.target')
                .data(schedB, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'target')
            enter.each(function(d, i) {
                let g = d3.select(this)
                let dimPoly = line * 1.2
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
                    .attr('stroke-width', 0.8)
                    .on('click', function() {
                        com.ressource.events.click('sched_block', d.id)
                    })
                    .on('mouseover', function(d) {
                        d3.select(this).style('cursor', 'pointer')
                        d3.select(this).attr('fill', colorPalette.darker.background)
                    })
                    .on('mouseout', function(d) {
                        d3.select(this).style('cursor', 'default')
                        d3.select(this).attr('fill', colorPalette.dark.background)
                    })
                scroll_height += marg + line + 4
                g.append('text')
                    .text('S' + d.blocks[0].metadata.n_sched)
                    .style('fill', colorPalette.dark.text)
                    .style('font-weight', 'bold')
                    .style('font-size', title_size + 'px')
                    .attr('text-anchor', 'middle')
                    .attr('transform', 'translate(' + (dimPoly * 0.5) + ',' + (dimPoly * 0.5 + txt_size * 0.3) + ')')
                    .style('pointer-events', 'none')
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                g.attr('transform', 'translate(' + (label[0].x + line * 0.0) + ',' + (offset + interOffset + (marg + line + 4) * i) + ')')
                // innerOffset += line
                pointingCore(d.blocks, g, line * 1.1 + marg * 1.2)
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        // schedBCore(com.data.schedB, innerg, headerSize * 0.2)

        g.append('line')
            .attr('x1', 0)
            .attr('y1', box.h - headerSize * 0.5)
            .attr('x2', box.w * 0.14)
            .attr('y2', box.h - headerSize * 0.5)
            .attr('stroke', colorPalette.dark.stroke)
            .attr('stroke-width', 0.2)
            .style('opacity', scroll_height > tbox.h ? 1 : 0)
        scrollBox.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: scroll_height,
        })

        let gt = g.append('g')
            .attr('id', 'telsDisplayer')
            .attr('transform', 'translate(' + (box.w * 0.15) + ',' + (headerSize * 6) + ')')
        com.targetBlock = new TargetDisplayer({
            main: {
                tag: 'targetRootTag',
                g: gt,
                scroll: {
                },
                box: {
                    x: 0,
                    y: 0,
                    w: box.w * 0.7,
                    h: box.h - headerSize * 6.5,
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
                        w: box.w * 0.7,
                        h: box.h - headerSize * 6.5,
                        marg: 0,
                    },
                    mainTarget: undefined,
                },
                legend: {
                    enabled: false,
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
                    targets: [ target ],
                    pointings: allPoint,
                },
                modified: [],
            },
        })
    }
}
