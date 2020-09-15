/* global d3 */
/* global inst_health_col */
/* global get_tel_state */
/* global load_script */
/* global colorPalette */
/* global is_def */
/* global times */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */
/* global blockStyle */

load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/blocks/common.js',
})

window.TelescopeForm = function(opt_in) {
    let com = {
        main: {
            tag: 'telescopeFormTag',
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
    }
    this.init = init

    function update() {
    // initSchedulingObservingBlocksTree()
    // initTime_information()
    // initPointing_information()
    // initTelescope_information()
    }
    this.update = update

    function createTitle() {
        function drawHealthBar() {
            let health = [
                {
                    min: 0,
                    max: 30,
                    color: inst_health_col(15),
                },
                {
                    min: 30,
                    max: 55,
                    color: inst_health_col(40),
                },
                {
                    min: 55,
                    max: 100,
                    color: inst_health_col(80),
                },
            ]
            let ba = {
                x: box.w * 0.25,
                w: box.w * 0.3,
            }
            for (let i = 0; i < health.length; i++) {
                g.append('rect')
                    .attr('x', ba.x + (ba.w / 100) * health[i].min)
                    .attr('y', box.h * 0.3)
                    .attr('width', (ba.w / 100) * (health[i].max - health[i].min))
                    .attr('height', box.h * 0.1)
                    .attr('fill', health[i].color)
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 0.1)
            }
            g.append('rect')
                .attr('x', ba.x + (ba.w / 100) * tel.val)
                .attr('y', box.h * 0.3)
                .attr('width', 2)
                .attr('height', box.h * 0.15)
                .attr('fill', '#000000')
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.1)
        }
        let tel = com.data.telescope
        let box = com.tree.box
        let g = com.main.g.append('g')
            .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
        com.tree.g = g

        let color = inst_health_col(tel.val)
        let telState = get_tel_state(tel.val)
        g.append('circle')
            .attr('cx', box.w * 0.1)
            .attr('cy', box.h * 0.35)
            .attr('r', box.h * 0.3)
            .attr('fill', color)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.2)
            .on('click', function() {
                com.tree.events.click('telescope', com.data.telescope.id)
            })
            .on('mouseover', function(d) {
                d3.select(this).style('cursor', 'pointer')
                d3.select(this).attr('fill', d3.color(color).darker(0.9))
            })
            .on('mouseout', function(d) {
                d3.select(this).style('cursor', 'default')
                d3.select(this).attr('fill', color)
            })
        g.append('text')
            .text(tel.id)
            .style('fill', color.text)
            .style('font-weight', 'bold')
            .style('font-size', headerSize + 'px')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (box.w * 0.1) + ',' + (box.h * 0.35 + txt_size * 0.3) + ')')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        g.append('svg:image')
            .attr('xlink:href', '/static/icons/cross.svg')
            .attr('x', box.h * 0.45)
            .attr('y', 0)
            .attr('width', 15)
            .attr('height', 15)
            .style('opacity', 0.5)
            .style('pointer-events', 'none')
        // g.append('circle')
        //   .attr('cx', box.w * 0.38)
        //   .attr('cy', box.h * 0.5)
        //   .attr('r', box.h * 0.35)
        //   .attr('fill', colorPalette.medium.background)
        //   .attr('stroke', '#000000')
        //   .attr('stroke-width', 0.2)
        // g.append('text')
        //   .text((tel.id[0] === 'S' ? 'Small' : tel.id[0] === 'M' ? 'Medium' : 'Large') + ' telescope number: ' + tel.id.substring(2))
        //   .style('fill', color.text)
        //   .style('font-weight', '')
        //   .style('font-size', txt_size + 'px')
        //   .attr('text-anchor', 'start')
        //   .attr('transform', 'translate(' + (innerbox.w * 0.225) + ',' + (innerbox.w * 0.1 - txt_size * 0.2) + ')')
        g.append('text')
            .text('Health indicator:')
            .style('fill', color.text)
            .style('font-weight', '')
            .style('font-size', headerSize + 'px')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (box.w * 0.4) + ',' + (box.h * 0.2 + txt_size * 0.2) + ')')
        drawHealthBar()
        g.append('text')
            .text(tel.val + '%: ' + (telState === 0 ? 'Error' : telState === 1 ? 'Warning' : 'Good'))
            .style('fill', color.text)
            .style('font-weight', 'bold')
            .style('font-size', title_size + 'px')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(' + (box.w * 0.4) + ',' + (box.h * 0.6 + txt_size * 0.2) + ')')
    }
    // function createAssociatedBlocks () {
    //   let box = com.ressource.box
    //   let g = com.main.g.append('g')
    //     .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    //   com.ressource.g = g
    //
    //   g.append('text')
    //     .text('Associated ressources:')
    //     .style('fill', colorPalette.dark.stroke)
    //     .style('font-weight', 'bold')
    //     .style('font-size', title_size + 'px')
    //     .attr('text-anchor', 'start')
    //     .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    //   g.append('line')
    //     .attr('x1', box.w * 0.0)
    //     .attr('y1', 2)
    //     .attr('x2', box.w * 1.0)
    //     .attr('y2', 2)
    //     .attr('stroke', colorPalette.dark.stroke)
    //     .attr('stroke-width', 0.2)
    //
    //   g.append('rect')
    //     .attr('id', 'headerStrip')
    //     .attr('x', 0)
    //     .attr('y', 3)
    //     .attr('width', box.w)
    //     .attr('height', headerSize)
    //     .attr('fill', colorPalette.dark.stroke)
    //   let label = [
    //     {x: box.w * 0.0, y: 3 + headerSize * 0.5 + txt_size * 0.3, w: box.w * 0.15, text: 'Targets', anchor: 'middle'},
    //     {x: box.w * 0.15, y: 3 + headerSize * 0.5 + txt_size * 0.3, w: box.w * 0.7, text: 'Obs', anchor: 'middle'},
    //     {x: box.w * 0.85, y: 3 + headerSize * 0.5 + txt_size * 0.3, w: box.w * 0.15, text: 'Sched', anchor: 'middle'}
    //   ]
    //   for (let i = 0; i < label.length; i++) {
    //     let off = label[i].anchor === 'middle' ? label[i].w * 0.5 : (label[i].anchor === 'end' ? label[i].w * 0.5 : 0)
    //     g.append('text')
    //       .text(label[i].text)
    //       .style('fill', colorPalette.medium.background)
    //       .style('font-weight', 'bold')
    //       .style('font-size', txt_size + 'px')
    //       .attr('text-anchor', label[i].anchor)
    //       .attr('transform', 'translate(' + (label[i].x + off) + ',' + (label[i].y) + ')')
    //     g.append('rect')
    //       .attr('x', 0)
    //       .attr('y', 0)
    //       .attr('width', label[i].w)
    //       .attr('height', box.h)
    //       .attr('fill', i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
    //       .attr('stroke', '#000000')
    //       .attr('stroke-width', 0.05)
    //       .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    //   }
    //
    //   let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + (headerSize * 1.5) + ')')
    //   let sbox = {
    //     x: 0,
    //     y: 0,
    //     w: box.w,
    //     h: box.h - (headerSize * 1.5)
    //   }
    //   com.ressource.scrollBox = initScrollBox('targetRessourceScroll', blockg, sbox, {enabled: false})
    //   let innerg = com.ressource.scrollBox.get('inner_g')
    //
    //   let scheds = []
    //   for (let key in com.data.schedB) {
    //     scheds.push(com.data.schedB[key])
    //   }
    //
    //   function blockCore (blocks, g, offset) {
    //     let line = 30
    //     let current = g
    //       .selectAll('g.block')
    //       .data(blocks, function (d) {
    //         return d.obs_block_id
    //       })
    //     let enter = current
    //       .enter()
    //       .append('g')
    //       .attr('class', 'block')
    //     enter.each(function (d, i) {
    //       let g = d3.select(this)
    //       let palette = blockStyle(d)
    //       g.append('rect')
    //         .attr('x', 0)
    //         .attr('y', 0)
    //         .attr('width', line * 0.95)
    //         .attr('height', line * 0.95)
    //         .attr('fill', palette.color.background)
    //         .attr('stroke', palette.color.stroke)
    //         .attr('stroke-width', 0.1)
    //         .on('click', function () {
    //           com.ressource.events.click('block', d.obs_block_id)
    //         })
    //         .on('mouseover', function (d) {
    //           d3.select(this).style('cursor', 'pointer')
    //           d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
    //         })
    //         .on('mouseout', function (d) {
    //           d3.select(this).style('cursor', 'default')
    //           d3.select(this).attr('fill', palette.color.background)
    //         })
    //       g.append('text')
    //         .text(d.metadata.n_obs)
    //         .style('fill', '#000000')
    //         .style('font-weight', 'bold')
    //         .style('font-size', headerSize + 'px')
    //         .attr('text-anchor', 'middle')
    //         .attr('transform', 'translate(' + (line * 0.5) + ',' + (line * 0.5 + txt_size * 0.3) + ')')
    //         .style('pointer-events', 'none')
    //     })
    //     let merge = current.merge(enter)
    //     merge.each(function (d, i) {
    //       let g = d3.select(this)
    //       g.attr('transform', 'translate(' + (label[1].x + label[1].w * 0.5 - blocks.length * line * 0.95 * 0.5 + line * i) + ',' + (offset) + ')')
    //     })
    //     current
    //       .exit()
    //       .transition('in_out')
    //       .duration(times.anim)
    //       .style('opacity', 0)
    //       .remove()
    //     // offsetY += line * 1
    //   }
    //   function schedCore (scheds, g, offset) {
    //     let line = 30
    //     let dimPoly = line * 0.95
    //     let centering = 10 // (sbox.h - (line * scheds.length)) / (scheds.length + 1)
    //     let current = g
    //       .selectAll('g.sched')
    //       .data(scheds, function (d) {
    //         return d.id
    //       })
    //     let enter = current
    //       .enter()
    //       .append('g')
    //       .attr('class', 'sched')
    //     enter.each(function (d, i) {
    //       let g = d3.select(this)
    //       let poly = [
    //         {x: dimPoly * 0.3, y: dimPoly * 0.0},
    //         {x: dimPoly * 0.7, y: dimPoly * 0.0},
    //
    //         {x: dimPoly * 1, y: dimPoly * 0.3},
    //         {x: dimPoly * 1, y: dimPoly * 0.7},
    //
    //         {x: dimPoly * 0.7, y: dimPoly * 1},
    //         {x: dimPoly * 0.3, y: dimPoly * 1},
    //
    //         {x: dimPoly * 0.0, y: dimPoly * 0.7},
    //         {x: dimPoly * 0.0, y: dimPoly * 0.3}
    //       ]
    //       g.selectAll('polygon')
    //         .data([poly])
    //         .enter()
    //         .append('polygon')
    //         .attr('points', function (d) {
    //           return d.map(function (d) {
    //             return [d.x, d.y].join(',')
    //           }).join(' ')
    //         })
    //         .attr('fill', colorPalette.dark.background)
    //         .attr('stroke', colorPalette.dark.stroke)
    //         .attr('stroke-width', 0.8)
    //         .on('click', function () {
    //           com.ressource.events.click('sched_block', d.id)
    //         })
    //         .on('mouseover', function (d) {
    //           d3.select(this).style('cursor', 'pointer')
    //           d3.select(this).attr('fill', colorPalette.darker.background)
    //         })
    //         .on('mouseout', function (d) {
    //           d3.select(this).style('cursor', 'default')
    //           d3.select(this).attr('fill', colorPalette.dark.background)
    //         })
    //       g.append('text')
    //         .text('S' + d.blocks[0].metadata.n_sched)
    //         .style('fill', colorPalette.dark.text)
    //         .style('font-weight', 'bold')
    //         .style('font-size', title_size + 'px')
    //         .attr('text-anchor', 'middle')
    //         .attr('transform', 'translate(' + (dimPoly * 0.5) + ',' + (dimPoly * 0.5 + txt_size * 0.3) + ')')
    //         .style('pointer-events', 'none')
    //     })
    //     let merge = current.merge(enter)
    //     merge.each(function (d, i) {
    //       let g = d3.select(this)
    //       g.attr('transform', 'translate(' + (label[2].x + label[2].w * 0.5 - dimPoly * 0.5) + ',' + (offset + centering + (line + centering) * i) + ')')
    //       blockCore(d.blocks, innerg.append('g'), (offset + centering * 1 + (line + centering) * i))
    //     })
    //     current
    //       .exit()
    //       .transition('in_out')
    //       .duration(times.anim)
    //       .style('opacity', 0)
    //       .remove()
    //   }
    //   schedCore(scheds, innerg, 0)
    //
    //   // let inter = {}
    //   // for (let key in scheds) {
    //   //   if (!inter[scheds[key].target.id]) inter[scheds[key].target.id] = {target: scheds[key].target, scheds: []}
    //   //   scheds[key].id = key
    //   //   inter[scheds[key].target.id].scheds.push(scheds[key])
    //   // }
    //   // let targs = []
    //   // for (let key in inter) {
    //   //   targs.push(inter[key])
    //   // }
    //   //
    //   // let line = title_size * 3
    //   // let offsetY = title_size * 1.5
    //   // function blockCore (blocks, g, offset) {
    //   //   let current = g
    //   //     .selectAll('g.block')
    //   //     .data(blocks, function (d) {
    //   //       return d.obs_block_id
    //   //     })
    //   //   let enter = current
    //   //     .enter()
    //   //     .append('g')
    //   //     .attr('class', 'block')
    //   //   enter.each(function (d, i) {
    //   //     let g = d3.select(this)
    //   //     let palette = blockStyle(d)
    //   //     g.append('rect')
    //   //       .attr('x', 0)
    //   //       .attr('y', 0)
    //   //       .attr('width', line * 0.95)
    //   //       .attr('height', line * 0.95)
    //   //       .attr('fill', palette.color.background)
    //   //       .attr('stroke', palette.color.stroke)
    //   //       .attr('stroke-width', 0.1)
    //   //       .on('click', function () {
    //   //         com.ressource.events.click('block', d.obs_block_id)
    //   //       })
    //   //       .on('mouseover', function (d) {
    //   //         d3.select(this).style('cursor', 'pointer')
    //   //         d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
    //   //       })
    //   //       .on('mouseout', function (d) {
    //   //         d3.select(this).style('cursor', 'default')
    //   //         d3.select(this).attr('fill', palette.color.background)
    //   //       })
    //   //     g.append('text')
    //   //       .text(d.metadata.n_obs)
    //   //       .style('fill', '#000000')
    //   //       .style('font-weight', 'bold')
    //   //       .style('font-size', headerSize + 'px')
    //   //       .attr('text-anchor', 'middle')
    //   //       .attr('transform', 'translate(' + (line * 0.5) + ',' + (line * 0.5 + txt_size * 0.3) + ')')
    //   //       .style('pointer-events', 'none')
    //   //   })
    //   //   let merge = current.merge(enter)
    //   //   merge.each(function (d, i) {
    //   //     let g = d3.select(this)
    //   //     g.attr('transform', 'translate(' + (2 + line * (i + 1)) + ',' + (offset) + ')')
    //   //   })
    //   //   current
    //   //     .exit()
    //   //     .transition('in_out')
    //   //     .duration(times.anim)
    //   //     .style('opacity', 0)
    //   //     .remove()
    //   //   // offsetY += line * 1
    //   // }
    //   //
    //   // let current = innerg
    //   //   .selectAll('g.targ')
    //   //   .data(targs, function (d) {
    //   //     return d.target.id
    //   //   })
    //   // let enter = current
    //   //   .enter()
    //   //   .append('g')
    //   //   .attr('class', 'targ')
    //   // enter.each(function (d, i) {
    //   //   let g = d3.select(this)
    //   //
    //   //   g.append('rect')
    //   //     .attr('x', 0)
    //   //     .attr('y', 0)
    //   //     .attr('width', line)
    //   //     .attr('height', line)
    //   //     .attr('fill', colorPalette.dark.background)
    //   //     .attr('stroke', colorPalette.medium.stroke)
    //   //     .attr('stroke-width', 0.6)
    //   //     // .style('boxShadow', '10px 20px 30px black')
    //   //     .attr('rx', line)
    //   //     .on('click', function () {
    //   //       com.ressource.events.click('target', d.target.id)
    //   //     })
    //   //     .on('mouseover', function (d) {
    //   //       d3.select(this).style('cursor', 'pointer')
    //   //       d3.select(this).attr('fill', colorPalette.darker.background)
    //   //     })
    //   //     .on('mouseout', function (d) {
    //   //       d3.select(this).style('cursor', 'default')
    //   //       d3.select(this).attr('fill', colorPalette.dark.background)
    //   //     })
    //   //   g.append('svg:image')
    //   //     .attr('xlink:href', '/static/icons/round-target.svg')
    //   //     .attr('width', line * 1)
    //   //     .attr('height', line * 1)
    //   //     .attr('x', line * 0.0)
    //   //     .attr('y', line * 0.5 - line * 0.5)
    //   //     .style('opacity', 0.5)
    //   //     .style('pointer-events', 'none')
    //   //   g.append('text')
    //   //     .text('T' + d.target.name.split('_')[1])
    //   //     .attr('x', line * 0.5)
    //   //     .attr('y', line * 0.5 + txt_size * 0.3)
    //   //     .style('font-weight', '')
    //   //     .attr('text-anchor', 'middle')
    //   //     .style('font-size', headerSize + 'px')
    //   //     .attr('dy', 0)
    //   //     .style('pointer-events', 'none')
    //   //     .attr('fill', colorPalette.dark.text)
    //   //     .attr('stroke', 'none')
    //   // })
    //   // let merge = current.merge(enter)
    //   // merge.each(function (d, i) {
    //   //   let g = d3.select(this)
    //   //   g.attr('transform', 'translate(' + 0 + ',' + (offsetY) + ')')
    //   //   schedCore(d.scheds, g, 0)
    //   //   offsetY += line * 0.33
    //   // })
    //   // current
    //   //   .exit()
    //   //   .transition('in_out')
    //   //   .duration(times.anim)
    //   //   .style('opacity', 0)
    //   //   .remove()
    //   //
    //   // com.ressource.scrollBox.reset_vertical_scroller({can_scroll: true, scroll_height: line * inter.length})
    //   // blockg.append('line')
    //   //   .attr('x1', box.x)
    //   //   .attr('y1', box.h)
    //   //   .attr('x2', box.w)
    //   //   .attr('y2', box.h)
    //   //   .attr('stroke', colorPalette.dark.stroke)
    //   //   .attr('stroke-width', 0.4)
    // }
    function createAssociatedBlocks() {
        let scheds = []
        for (let key in com.data.schedB) {
            com.data.schedB[key].id = key
            scheds.push(com.data.schedB[key])
        }
        let targs = []
        for (let i = 0; i < scheds.length; i++) {
            for (let j = 0; j < scheds[i].targets.length; j++) {
                let already = false
                for (var z = 0; z < targs.length; z++) {
                    if (targs[z].id === scheds[i].targets[j].id) {
                        already = true
                        break
                    }
                }
                if (!already) {
                    targs.push(scheds[i].targets[j])
                }
            }
        }

        let box = com.ressource.box
        let line = 20
        let tbox = {
            x: 0,
            y: headerSize + 6 + line * 1.25,
            w: box.w,
            h: box.h - headerSize - 6 - line * 1.25,
        }
        let spaceTarget = ((tbox.h) - (targs.length * line)) / (targs.length)
        let spaceBlock = ((box.w * 0.85) - (scheds.length * line * 1.25)) / (scheds.length)
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

        g.append('rect')
            .attr('id', 'headerStrip')
            .attr('x', 0)
            .attr('y', 3)
            .attr('width', tbox.w)
            .attr('height', headerSize)
            .attr('fill', colorPalette.dark.stroke)
        let label = [
            {
                x: box.w * 0.0,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.15,
                text: 'Target',
                anchor: 'middle',
            },
            {
                x: box.w * 0.15,
                y: 3 + headerSize * 0.5 + txt_size * 0.3,
                w: box.w * 0.85,
                text: 'Scheduling & observing blocks',
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
            // g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', label[i].w)
            //   .attr('height', tbox.h + line)
            //   .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.darker.background)
            //   .attr('stroke', '#000000')
            //   .attr('stroke-width', 0.05)
            //   .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
        }

        let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + tbox.y + ')')
        let scrollBox = new ScrollBox()
        scrollBox.init({
            main: {
                tag: 'targetListScroll',
                g: blockg,
                box: tbox,
            },
        })
        let innerg = scrollBox.get_content()

        let pntsPos = {
        }
        function targetCore(targets, g, offset) {
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
                        com.ressource.events.click('target', d.id)
                    },
                    over: function() {

                    },
                    out: function() {},
                }
                target_icon(g, {
                    w: line * 1.4,
                    h: line * 1.4,
                }, 'T' + d.name.split('_')[1], tevents, colorPalette)
                // scroll_height += marg + line + 4
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                let offX = (label[0].x + label[0].w * 0.5 - line * 1.4 * 0.5)
                g.attr('transform', 'translate(' + offX + ',' + (spaceTarget * 0.5 + (spaceTarget + line) * i) + ')')
                pntsPos[d.id] = (spaceTarget + line) * i
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        targetCore(targs, innerg, 0)

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
        function blockCore(blocks, pg, target) {
            let w = Math.min(60, spaceBlock + line * 1.25)
            let h = Math.min(60, spaceTarget + line)
            pg.attr('transform', 'translate(' + (-spaceBlock * 0.5) + ',' + (line * 1.25 + pntsPos[target.id] + ((spaceTarget + line - h) * 0.5)) + ')')
            pg.append('rect')
                .attr('x', 1)
                .attr('y', 1)
                .attr('width', w - 2)
                .attr('height', h - 2)
                .attr('fill', colorPalette.darker.background)
                .attr('stroke', colorPalette.dark.stroke)
                .attr('stroke-width', 0.0)
            let psize = {
                w: Math.min((w - 10) / 3, 18),
                h: Math.min((h - 15) / 3, 16),
            }
            let current = pg
                .selectAll('g.pointing')
                .data(blocks, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'pointing')
            enter.each(function(d, i) {
                let g = d3.select(this)
                let palette = blockStyle(d)
                g.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', psize.w)
                    .attr('height', psize.h)
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
                    .attr('transform', 'translate(' + (psize.w * 0.5) + ',' + (psize.h * 0.5 + txt_size * 0.3) + ')')
                    .style('pointer-events', 'none')
            })
            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                let pos = squareTemplate[blocks.length][i]
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
        function schedCore(scheds, g, offset) {
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
                let dimPoly = line * 1.25
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
                        console.log(com.ressource.events.click, d)
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
                g.attr('transform', 'translate(' + (box.w * 0.15 + spaceBlock * 0.5 + (spaceBlock + line * 1.25) * i) + ',' + (offset) + ')')
                for (let i = 0; i < d.blocks[0].targets.length; i++) {
                    blockCore(d.blocks, g.append('g').attr('id', 'blocks' + d.id + d.blocks[0].targets[i].id), d.blocks[0].targets[i])
                }
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
            // offsetY += line * 1
        }
        schedCore(scheds, g, headerSize + 5)

    // return
    //
    // let target_point = []
    // for (let j = 0; j < schedB.blocks.length; j++) {
    //   let data = schedB.blocks[j]
    //   for (let i = 0; i < data.pointings.length; i++) {
    //     let tar = target_point.find(t => t.name === data.pointings[i].name.split('/')[0])
    //     if (tar) {
    //       if (!(data.obs_block_id in tar.pointings)) tar.pointings[data.obs_block_id] = []
    //       tar.pointings[data.obs_block_id].push(data.pointings[i])
    //     } else {
    //       tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
    //       // allTar.push(tar)
    //       tar.pointings = {}
    //       tar.pointings[data.obs_block_id] = [data.pointings[i]]
    //       target_point.push(tar)
    //     }
    //     // allPoint.push(data.pointings[i])
    //   }
    // }
    //
    // let marg = line * 0.2
    // let interOffset = 0
    // let scroll_height = 0
    //
    // function pointingCore (pointings, pg, x, y, w, h) {
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
    //     let pevents = {
    //       click: function () {},
    //       over: function () {},
    //       out: function () {}
    //     }
    //     pointing_icon(g, {w: psize.w, h: psize.h}, '' + d.name.split('/')[1].split('_')[1], pevents, colorPalette)
    //     scroll_height += (marg + line * 0.9)
    //     // g.append('rect')
    //     //   .attr('x', 0)
    //     //   .attr('y', 0)
    //     //   .attr('width', w)
    //     //   .attr('height', h)
    //     //   .attr('fill', '#888888')
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     let pos = squareTemplate[pointings.length][i]
    //     g.attr('transform', 'translate(' + ((pos.x * w) - (psize.w * 0.5)) + ',' + ((pos.y * h) - (psize.h * 0.5)) + ')')
    //     interOffset += marg + line * 0.9
    //   })
    //   current
    //     .exit()
    //     .transition('in_out')
    //     .duration(times.anim)
    //     .style('opacity', 0)
    //     .remove()
    //   // offsetY += line * 1
    // }
    }
}
