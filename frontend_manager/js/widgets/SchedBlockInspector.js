'use strict'
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// stric mode for the following script or function (must reservede at the very begining!)
// see: http://www.w3schools.reserved/js/js_strict.asp
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// main_script_tag used locally (will be overriden by other scripts...)
// must be reservedpatible with the name of this js file, according to:
//    '/js/widget_'+main_script_tag+'.js'
var main_script_tag = 'SchedBlockInspector'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global is_def */
/* global disable_scroll_svg */
/* global TelescopeDisplayer */
/* global RunLoop */
/* global get_tel_state */
/* global BlockDisplayer */
/* global ObsblockForm */
/* global TargetForm */
/* global SchedblockForm */
/* global TelescopeForm */
/* global PlotBrushZoom */
/* global ScrollBox */
/* global inst_health_col */
/* global new_d3_node */
/* global get_color_theme */
/* global cols_blues */
/* global Locker */
/* global dom_add */
/* global run_when_ready */
/* global times */
/* global deep_copy */

window.load_script({
    source: main_script_tag,
    script: '/js/utils/telescopes/TelescopeDisplayer.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/telescopes/TelescopeForm.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/targets/TargetDisplayer.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/targets/common.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/blocks/BlockDisplayer.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/blocks/ObsblockForm.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/blocks/SchedblockForm.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/targets/TargetForm.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/events/EventDisplayer.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/PlotBrushZoom.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/ScrollBox.js',
})

// -------------------------------------------------------------------
//
// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 9
    let w0 = 12
    let div_key = 'main'

    opt_in.widget_func = {
        sock_func: sock_sched_block_inspector,
        main_func: main_sched_blocksInspector,
    }
    opt_in.widget_div_id = opt_in.widget_id + 'widget_div'
    opt_in.ele_props = {
    }
    opt_in.ele_props[div_key] = {
        auto_pos: true,
        is_dark_ele: false,
        gs_id: opt_in.widget_div_id + div_key,
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        content: '<div id=\'' + opt_in.base_name + div_key + '\'></div>',
    }

    sock.add_to_table(opt_in)
}

// -------------------------------------------------------------------
// additional socket events for this particular widget type
// -------------------------------------------------------------------
let sock_sched_block_inspector = function(opt_in) {}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go with the content of this particular widget
// -------------------------------------------------------------------
let main_sched_blocksInspector = function(opt_in) {
    // let my_unique_id = unique()
    let color_theme = get_color_theme('bright_grey')
    window.colorPalette = get_color_theme('bright_grey')
    let is_south = window.SITE_TYPE === 'S'

    let widget_type = opt_in.widget_type
    let tag_arr_zoomerPlotsSvg = opt_in.base_name

    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    let shared = {
        data: {
            server: undefined,
            copy: undefined,
            // current: 0
        },
        focus: undefined, // {type: block, id: idBlock}
        history: {
            list: [],
            index: -1,
        },
        over: undefined,
        mode: 'modifier',
    }
    let svg = {
    }
    let box = {
    }
    let svg_dims = {
    }

    let blockQueueOverlay = null
    let blockQueue = null
    let event_queue_server = null
    let brushZoom = null

    // let this_sched_block_inspector = this
    // let is_south = window.SITE_TYPE === 'S'

    let sgv_tag = {
    }
    $.each(widget_ele, function(index, ele_now) {
        sgv_tag[ele_now.id] = {
            id: tag_arr_zoomerPlotsSvg + ele_now.id,
            widget: ele_now.widget,
            whRatio: ele_now.w / ele_now.h,
        }
    })

    // delay counters
    let locker = new Locker()
    // locker.add('in_init')
    let run_loop = new RunLoop({
        tag: widget_id,
    })

    let update_data_evt = function(data_in) {
        if (data_in.metadata.widget_id !== widget_id) {
            return
        }
        update_data(data_in)
    }
    sock.socket.add_listener({
        name: 'update_data',
        func: update_data_evt,
        is_singleton: false,
    })


    let push_new_sched_evt = function(opt_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        let emit_data = {
            widget_name: widget_type,
            widget_id: widget_id,
            method_name: 'client_sched_update',
            method_args: {
                new_schedule: opt_in.new_schedule,
            },
        }
        sock.socket.emit({
            name: 'widget',
            data: emit_data,
        })
    }

    let new_queue_evt = function(data_in) {
        if (data_in.metadata.widget_id !== widget_id) {
            return
        }
        scheduleSuccessfullyUpdate()
    }
    sock.socket.add_listener({
        name: 'server_sched_update',
        func: new_queue_evt,
        is_singleton: false,
    })

    function setStandbyMode() {
        let modificationOverlay = svg.svg.append('g')
        let sizepat = 5
        let pattern = {
        }
        pattern.select = {
        }
        pattern.select.defs = modificationOverlay.append('defs')
        pattern.select.patternLock = pattern.select.defs.append('pattern')
            .attr('id', 'bar')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', sizepat)
            .attr('height', sizepat)
            .attr('fill', '#000000')
            .attr('patternUnits', 'userSpaceOnUse')
        pattern.select.patternLock.append('rect')
            .attr('x', sizepat * 0.05)
            .attr('y', sizepat * 0.05)
            .attr('width', sizepat * 0.9)
            .attr('height', sizepat * 0.9)
            .attr('fill', colorPalette.darker.background)
            .attr('stroke', colorPalette.medium.background)
            .attr('stroke-width', sizepat * 0.1)
        // pattern.select.patternLock.append('line')
        //   .attr('x1', sizepat)
        //   .attr('y1', 0)
        //   .attr('x2', 0)
        //   .attr('y2', sizepat)
        //   .attr('stroke', '#000000')
        //   .attr('stroke-width', 1)
        let modificationOverlayRect = modificationOverlay.append('g')
        modificationOverlayRect.append('rect')
            .attr('id', 'blockQueue')
            .attr('x', box.topBox.w * 0.445)
            .attr('y', box.topBox.h * 0.0)
            .attr('width', box.topBox.w * 0.555)
            .attr('height', box.topBox.h * 1) // - 2 * box.topBox.h * 0.02)
            .attr('fill', 'url(#bar)')
            .style('opacity', 1)
        // .on('click', function () {
        //   shared.mode = 'modifier'
        //   svg_blocks_queue_server.update_data()
        //   modificationOverlayRect.select('rect#blockQueue')
        //     .transition()
        //     .duration(400)
        //     .style('opacity', 0)
        //     .on('end', function () {
        //       modificationOverlayRect.remove()
        //       // pattern.select.patternLock.selectAll('rect')
        //       //   .transition()
        //       //   .duration(400)
        //       //   .attr('x', sizepat * 0.5)
        //       //   .attr('y', sizepat * 0.5)
        //       //   .attr('width', sizepat * 0.0)
        //       //   .attr('height', sizepat * 0.0)
        //     })
        //
        //   svgTargets.update_data()
        //   svgTelsConflict.update_data()
        //   modificationOverlayRect.select('rect#targets')
        //     .transition()
        //     .duration(400)
        //     .style('opacity', 0)
        // })
        // .style('pointer-events', 'none')

        // modificationOverlayRect.append('rect')
        //   .attr('id', 'targets')
        //   .attr('x', box.topBox.w * 0.34)
        //   .attr('y', box.topBox.h * 0.68)
        //   .attr('width', box.topBox.w * 0.66)
        //   .attr('height', box.topBox.h * 0.3) // - 2 * box.topBox.h * 0.02)
        //   .attr('fill', 'url(#bar)')
        //   .style('opacity', 0.9)
        //   .on('click', function () {
        //     pattern.select.patternLock.selectAll('rect')
        //       .transition()
        //       .duration(400)
        //       .attr('stroke-width', 0)
        //       .attr('x', sizepat * 0.5)
        //       .attr('y', sizepat * 0.5)
        //       .attr('width', sizepat * 0.0)
        //       .attr('height', sizepat * 0.0)
        //       .on('end', function () {
        //         shared.mode = 'modifier'
        //         svg_blocks_queue_server.update_data()
        //         svgTargets.update_data()
        //         svgTelsConflict.update_data()
        //
        //         // pattern.select.patternLock.selectAll('rect')
        //         //   .transition()
        //         //   .duration(400)
        //         //   .attr('x', sizepat * 0.5)
        //         //   .attr('y', sizepat * 0.5)
        //         //   .attr('width', sizepat * 0.0)
        //         //   .attr('height', sizepat * 0.0)
        //       })
        //   })
        // .style('pointer-events', 'none')

        // modificationOverlayRect.append('rect')
        //   .attr('id', 'menu')
        //   .attr('x', box.topBox.w * 0.005)
        //   .attr('y', box.topBox.h * 0.02)
        //   .attr('width', box.topBox.w * 0.315)
        //   .attr('height', box.topBox.h * 0.1)
        //   .attr('fill', 'url(#bar)')
        //   .style('opacity', 1)
        //   .on('click', function () {
        //     pattern.select.patternLock.selectAll('rect')
        //       .transition()
        //       .duration(400)
        //       .attr('stroke-width', 0)
        //       .attr('x', sizepat * 0.5)
        //       .attr('y', sizepat * 0.5)
        //       .attr('width', sizepat * 0.0)
        //       .attr('height', sizepat * 0.0)
        //       .on('end', function () {
        //         shared.mode = 'modifier'
        //         svg_blocks_queue_server.update_data()
        //         svgTargets.update_data()
        //         svgTelsConflict.update_data()
        //
        //         // pattern.select.patternLock.selectAll('rect')
        //         //   .transition()
        //         //   .duration(400)
        //         //   .attr('x', sizepat * 0.5)
        //         //   .attr('y', sizepat * 0.5)
        //         //   .attr('width', sizepat * 0.0)
        //         //   .attr('height', sizepat * 0.0)
        //       })
        //   })
        //   // .style('pointer-events', 'none')

        modificationOverlayRect.append('rect')
            .attr('id', 'modifications')
            .attr('x', box.topBox.w * 0.0)
            .attr('y', box.topBox.h * 0.14)
            .attr('width', box.topBox.w * 0.435)
            .attr('height', box.topBox.h * 0.86)
            .attr('fill', 'url(#bar)')
            .style('opacity', 1)
        // .on('click', function () {
        //   pattern.select.patternLock.selectAll('rect')
        //     .transition()
        //     .duration(400)
        //     .attr('stroke-width', 0)
        //     .attr('x', sizepat * 0.5)
        //     .attr('y', sizepat * 0.5)
        //     .attr('width', sizepat * 0.0)
        //     .attr('height', sizepat * 0.0)
        //     .on('end', function () {
        //       shared.mode = 'modifier'
        //       svg_blocks_queue_server.update_data()
        //       svgTargets.update_data()
        //       svgTelsConflict.update_data()
        //
        //       // pattern.select.patternLock.selectAll('rect')
        //       //   .transition()
        //       //   .duration(400)
        //       //   .attr('x', sizepat * 0.5)
        //       //   .attr('y', sizepat * 0.5)
        //       //   .attr('width', sizepat * 0.0)
        //       //   .attr('height', sizepat * 0.0)
        //     })
        // })
        // .style('pointer-events', 'none')

        modificationOverlayRect.append('rect')
            .attr('id', 'conflicts')
            .attr('x', box.topBox.w * 0.12)
            .attr('y', box.topBox.h * 0.0)
            .attr('width', box.topBox.w * 0.315)
            .attr('height', box.topBox.h * 0.14)
            .attr('fill', 'url(#bar)')
            .style('opacity', 1)

        modificationOverlayRect.append('rect')
            .attr('id', 'optimizer')
            .attr('x', box.botBox.w * 0.0)
            .attr('y', box.topBox.h * 0.98)
            .attr('width', box.botBox.w * 1)
            .attr('height', box.botBox.h * 1.06)
            .attr('fill', 'url(#bar)')
            .style('opacity', 1)
        //   .on('click', function () {
        //     pattern.select.patternLock.selectAll('rect')
        //       .transition()
        //       .duration(400)
        //       .attr('stroke-width', 0)
        //       .attr('x', sizepat * 0.5)
        //       .attr('y', sizepat * 0.5)
        //       .attr('width', sizepat * 0.0)
        //       .attr('height', sizepat * 0.0)
        //       .on('end', function () {
        //         shared.mode = 'modifier'
        //         svg_blocks_queue_server.update_data()
        //         svgTargets.update_data()
        //         svgTelsConflict.update_data()
        //
        //         // pattern.select.patternLock.selectAll('rect')
        //         //   .transition()
        //         //   .duration(400)
        //         //   .attr('x', sizepat * 0.5)
        //         //   .attr('y', sizepat * 0.5)
        //         //   .attr('width', sizepat * 0.0)
        //         //   .attr('height', sizepat * 0.0)
        //       })
        //   })
        //   // .style('pointer-events', 'none')

        modificationOverlayRect.append('rect')
            .attr('x', box.topBox.w * 0.02 + box.topBox.w * 0.025 - 24)
            .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 - 24)
            .attr('width', 48)
            .attr('height', 48)
            .attr('fill', color_theme.bright.background)
            .attr('stroke', color_theme.bright.stroke)
            .attr('stroke-width', 0.1)
            .attr('rx', 48)
            .on('click', function() {
                shared.mode = 'modifier'
                modificationOverlayRect.select('image').remove()
                svg_blocks_queue_server.update_data()
                modificationOverlayRect.remove()
                // modificationOverlayRect.select('rect#blockQueue')
                //   .transition()
                //   .duration(0)
                //   .style('opacity', 0)
                //   .on('end', function () {
                //     modificationOverlayRect.remove()
                //     // pattern.select.patternLock.selectAll('rect')
                //     //   .transition()
                //     //   .duration(400)
                //     //   .attr('x', sizepat * 0.5)
                //     //   .attr('y', sizepat * 0.5)
                //     //   .attr('width', sizepat * 0.0)
                //     //   .attr('height', sizepat * 0.0)
                //   })

                svg.back.append('text')
                    .text('Local copy:')
                    .attr('stroke', color_theme.bright.background)
                    .attr('stroke-width', 0.5)
                    .attr('fill', color_theme.bright.background)
                    .attr('x', box.topBox.w * 0.01 + box.topBox.w * 0.03)
                    .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.03)
                    .style('font-weight', '')
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('user-select', 'none')
                svg.back.append('text')
                    .attr('id', 'currentHour')
                    .attr('stroke', color_theme.bright.background)
                    .attr('stroke-width', 0.5)
                    .attr('fill', color_theme.bright.background)
                    .attr('x', box.topBox.w * 0.01 + box.topBox.w * 0.03)
                    .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.08)
                    .style('font-weight', 'bold')
                    .attr('text-anchor', 'middle')
                    .style('font-size', '24px')
                    .style('pointer-events', 'none')
                    .style('user-select', 'none')
                let current_time = {
                    date: new Date(shared.data.server.time_information.time_now_sec),
                }
                svg.back.select('text#currentHour').text(d3.timeFormat('%H:%M')(current_time.date))

                // svg.back.append('rect')
                //   .attr('id', 'pushon_server')
                //   .attr('x', box.topBox.w * 0.01 + box.topBox.w * 0.25 - 24)
                //   .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 - 24)
                //   .attr('width', 48)
                //   .attr('height', 48)
                //   .attr('fill', color_theme.bright.background)
                //   .attr('stroke', color_theme.bright.stroke)
                //   .attr('stroke-width', 0.1)
                //   .attr('rx', 48)
                //   .on('click', function () {
                //     pushNewSchedule()
                //   })
                //   .on('mouseover', function (d) {
                //     d3.select(this).attr('fill', color_theme.darkest.background)
                //   })
                //   .on('mouseout', function (d) {
                //     d3.select(this).attr('fill', color_theme.bright.background)
                //   })
                // svg.back.append('image')
                //   .attr('xlink:href', '/static/icons/server-from-client.svg')
                //   .attr('x', box.topBox.w * 0.15 + box.topBox.w * 0.025 - 18)
                //   .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 - 15)
                //   .attr('width', 30)
                //   .attr('height', 30)
                //   .style('opacity', 0.8)
                //   .style('pointer-events', 'none')

                svg.back.append('rect')
                    .attr('x', box.topBox.w * 0.01 + box.topBox.w * 0.09 - 11)
                    .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 - 11)
                    .attr('width', 22)
                    .attr('height', 22)
                    .attr('fill', color_theme.bright.background)
                    .attr('stroke', color_theme.bright.stroke)
                    .attr('stroke-width', 0.1)
                    .attr('rx', 48)
                    .on('click', function() {

                    })
                    .on('mouseover', function(e, d) {
                        d3.select(this).attr('fill', color_theme.darkest.background)
                    })
                    .on('mouseout', function(e, d) {
                        d3.select(this).attr('fill', color_theme.bright.background)
                    })
                svg.back.append('image')
                    .attr('xlink:href', '/static/icons/circular-rotating-arrow.svg')
                    .attr('x', box.topBox.w * 0.09 + box.topBox.w * 0.01 - 10)
                    .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 - 9)
                    .attr('width', 18)
                    .attr('height', 18)
                    .style('opacity', 0.8)
                    .style('pointer-events', 'none')

                // svg.back.append('rect')
                //   .attr('x', box.topBox.w * 0.02 + box.topBox.w * 0.25 - 40)
                //   .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 - 12.5)
                //   .attr('width', 10)
                //   .attr('height', 10)
                //   .attr('fill', '#43A047')
                //   .attr('stroke', color_theme.bright.stroke)
                //   .attr('stroke-width', 0.1)
                // svg.back.append('text')
                //   .text('Modifications:')
                //   .attr('stroke', color_theme.bright.background)
                //   .attr('stroke-width', 0.5)
                //   .attr('fill', color_theme.bright.background)
                //   .attr('x', box.topBox.w * 0.02 + box.topBox.w * 0.25 - 42)
                //   .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 - 5)
                //   .style('font-weight', '')
                //   .attr('text-anchor', 'end')
                //   .style('font-size', '9px')
                //   .style('pointer-events', 'none')
                //   .style('user-select', 'none')

                // svg.back.append('rect')
                //   .attr('id', 'conflictlighton')
                //   .attr('x', box.topBox.w * 0.02 + box.topBox.w * 0.25 - 40)
                //   .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 + 5)
                //   .attr('width', 10)
                //   .attr('height', 10)
                //   .attr('fill', '#43A047')
                //   .attr('stroke', color_theme.bright.stroke)
                //   .attr('stroke-width', 0.1)
                // svg.back.append('text')
                //   .text('Conflicts:')
                //   .attr('stroke', color_theme.bright.background)
                //   .attr('stroke-width', 0.5)
                //   .attr('fill', color_theme.bright.background)
                //   .attr('x', box.topBox.w * 0.02 + box.topBox.w * 0.25 - 42)
                //   .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 + 12.5)
                //   .style('font-weight', '')
                //   .attr('text-anchor', 'end')
                //   .style('font-size', '9px')
                //   .style('pointer-events', 'none')
                //   .style('user-select', 'none')

                svgTargets.update_data()
                svgTelsConflict.update()
                modificationOverlayRect.select('rect#targets')
                    .transition()
                    .duration(400)
                    .style('opacity', 0)

                let poly = [
                    // {x: -2 + box.brushZoom.x, y: 8 + box.block_queue_server.y + box.block_queue_server.h + box.brushZoom.h * 0.3},
                    {
                        x: -1.5 + box.brushZoom.x,
                        y: 1.2 + box.block_queue_server.y + box.block_queue_server.h,
                    },
                    {
                        x: -2 + box.brushZoom.x - (box.topBox.w * 0.03 * 0.85),
                        y: 1.2 + box.block_queue_server.y + box.block_queue_server.h,
                    },

                    {
                        x: -2 + box.brushZoom.x - (box.topBox.w * 0.03),
                        y: 1.2 + box.block_queue_server.y + box.block_queue_server.h + (10 + box.brushZoom.h) * 0.3,
                    },
                    {
                        x: -2 + box.brushZoom.x - (box.topBox.w * 0.03),
                        y: 1.2 + box.block_queue_server.y + box.block_queue_server.h + (10 + box.brushZoom.h) * 0.7,
                    },

                    {
                        x: -2 + box.brushZoom.x - (box.topBox.w * 0.03 * 0.85),
                        y: 1.2 + box.block_queue_server.y + box.block_queue_server.h + (10 + box.brushZoom.h),
                    },
                    {
                        x: -1.5 + box.brushZoom.x,
                        y: 1.2 + box.block_queue_server.y + box.block_queue_server.h + (10 + box.brushZoom.h),
                    },
                    // {x: -2 + box.brushZoom.x, y: 8 + box.block_queue_server.y + box.block_queue_server.h + box.brushZoom.h * 0.7}
                ]
                svg.g.append('polygon')
                    .attr('fill', color_theme.dark.background)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.2)
                    .attr('points', function() {
                        return poly.map(function(d) {
                            return [ d.x, d.y ].join(',')
                        }).join(' ')
                    })
                    .on('click', function() {
                        createDummyBlock()
                    })
                    .on('mouseover', function() {
                        d3.select(this).attr('fill', colorPalette.darker.background)
                        // com.events.sched.mouseover('sched_block', d.id)
                    })
                    .on('mouseout', function() {
                        d3.select(this).attr('fill', color_theme.dark.background)
                        // com.events.sched.mouseout('sched_block', d.id)
                    })
                svg.g.append('text')
                    .text('+')
                    .style('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 1)
                    .style('fill', color_theme.dark.background)
                    .attr('x', box.brushZoom.x - (box.topBox.w * 0.03 * 0.5))
                    .attr('y', 12 + box.block_queue_server.y + box.block_queue_server.h + box.brushZoom.h * 0.8)
                    .style('font-weight', 'bold')
                    .attr('text-anchor', 'middle')
                    .style('font-size', '26px')
                    .style('pointer-events', 'none')
                    .style('user-select', 'none')
                svg.g.append('image')
                    .attr('xlink:href', '/static/icons/up-triangle.svg')
                    .attr('x', box.brushZoom.x - (box.topBox.w * 0.03 * 0.5) - 4)
                    .attr('y', box.block_queue_server.y + box.block_queue_server.h + box.brushZoom.h * 0.1)
                    .attr('width', 8)
                    .attr('height', 8)
                    .style('opacity', 0.8)
                    .style('pointer-events', 'none')
            })
            .on('mouseover', function(e, d) {
                pattern.select.patternLock.select('rect')
                    .style('opacity', 0.8)
                    .attr('fill', d3.color(colorPalette.darker.background).darker(0.1))
                d3.select(this).attr('fill', color_theme.darkest.background)
            })
            .on('mouseout', function(e, d) {
                pattern.select.patternLock.select('rect')
                    .style('opacity', 1)
                    .attr('fill', colorPalette.darker.background)
                d3.select(this).attr('fill', color_theme.bright.background)
            })
        modificationOverlayRect.append('image')
            .attr('xlink:href', '/static/icons/server-to-client.svg')
            .attr('x', box.topBox.w * 0.02 + box.topBox.w * 0.025 - 15)
            .attr('y', box.topBox.h * 0.02 + box.topBox.h * 0.05 - 15)
            .attr('width', 30)
            .attr('height', 30)
            .style('opacity', 0.8)
            .style('pointer-events', 'none')

    // svg.svg.append('rect')
    //   .attr('x', box.topBox.w * 0.0)
    //   .attr('y', box.topBox.h * 0.02)
    //   .attr('width', box.topBox.w * 0.25)
    //   .attr('height', box.topBox.h * 0.25)
    //   .attr('stroke', colorPalette.darker.stroke)
    //   .attr('stroke-width', 0.4)
    //   .attr('fill', colorPalette.darker.background)
    //   .style('opacity', 1)
    }

    function init_data(data_in) {
        function initSvg() {
            svg_dims.w = {
            }
            svg_dims.h = {
            }
            svg_dims.w[0] = 1000
            svg_dims.h[0] = svg_dims.w[0] / sgv_tag.main.whRatio

            svg.svg = d3
                .select(svg_div)
                .append('svg')
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .attr('viewBox', '0 0 ' + svg_dims.w[0] + ' ' + svg_dims.h[0])
                .style('position', 'relative')
                .style('width', '100%')
                .style('height', '100%')
                .style('top', '0px')
                .style('left', '0px')
                .on('dblclick.zoom', null)

            if (disable_scroll_svg) {
                svg.svg.on('wheel', function(event) {
                    event.preventDefault()
                })
            }
            svg.g = svg.svg.append('g')
        }
        function initBackground() {
            function initTopBackground() {
                svg.back = svg.svg.append('g')

                svg.back.append('rect')
                    .attr('x', box.topBox.w * 0.45)
                    .attr('y', 0)
                    .attr('width', box.topBox.w * 0.55)
                    .attr('height', box.topBox.h * 0.02)
                    .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                svg.back.append('text')
                    .text('Scheduling & observation blocks')
                    .style('fill', color_theme.bright.background)
                    .style('font-weight', 'bold')
                    .style('font-size', '8px')
                    .attr('text-anchor', 'middle')
                    .attr('transform', 'translate(' + (box.topBox.w * 0.67) + ',' + (box.topBox.h * 0.015) + ')')

                svg.back.append('rect')
                    .attr('x', box.topBox.w * 0.0)
                    .attr('y', box.topBox.h * 0.98)
                    .attr('width', box.topBox.w * 1.0)
                    .attr('height', box.topBox.h * 0.02)
                    .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                svg.back.append('text')
                    .text('Visualization tools')
                    .style('fill', color_theme.bright.background)
                    .style('font-weight', 'bold')
                    .style('font-size', '8px')
                    .attr('text-anchor', 'middle')
                    .attr('transform', 'translate(' + (box.topBox.w * 0.67) + ',' + (box.topBox.h * 0.995) + ')')

                svg.back.append('rect')
                    .attr('x', box.topBox.w * 0.0)
                    .attr('y', 0)
                    .attr('width', box.topBox.w * 0.12)
                    .attr('height', box.topBox.h * 0.14)
                    .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)

                svg.back.append('rect')
                    .attr('x', box.topBox.w * 0.0)
                    .attr('y', 0)
                    .attr('width', box.topBox.w * 0.01)
                    .attr('height', box.topBox.h * 1)
                    .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                // svg.back.append('text')
                //   .text('_information')
                //   .style('fill', color_theme.bright.background)
                //   .style('font-weight', 'bold')
                //   .style('font-size', '8px')
                //   .attr('text-anchor', 'middle')
                //   .attr('transform', 'translate(' + (box.topBox.w * 0.16) + ',' + (box.topBox.h * 0.015) + ')')
            }
            function initBotBackground() {
                svg.back.append('rect')
                    .attr('x', box.botBox.w * 0.0)
                    .attr('y', box.botBox.y)
                    .attr('width', box.botBox.w * 0.12)
                    .attr('height', box.botBox.h * 0.14)
                    .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)

                svg.back.append('rect')
                    .attr('x', box.botBox.w * 0.0)
                    .attr('y', box.botBox.y)
                    .attr('width', box.botBox.w * 0.01)
                    .attr('height', box.botBox.h * 1)
                    .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                // svg.back.append('rect')
                //   .attr('x', box.botBox.w * 0.0)
                //   .attr('y', box.botBox.y + box.botBox.h * 0.96)
                //   .attr('width', box.botBox.w * 1)
                //   .attr('height', box.botBox.h * 0.04)
                //   .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                //   .attr('stroke', 'none')
                //   .attr('rx', 0)

                svg.back.append('rect')
                    .attr('id', 'pushon_server')
                    .attr('x', box.botBox.w * 0.01 + box.botBox.w * 0.28 - 24)
                    .attr('y', box.botBox.y + box.botBox.h * 0.02 + box.botBox.h * 0.05 - 16)
                    .attr('width', 36)
                    .attr('height', 36)
                    .attr('fill', 'gold')
                    .style('opacity', 0.6)
                    .attr('stroke', color_theme.bright.stroke)
                    .attr('stroke-width', 1)
                    .attr('rx', 48)
                    // .on('click', function() {
                    //     pushNewSchedule()
                    // })
                    // .on('mouseover', function(d) {
                    //     d3.select(this).attr('fill', color_theme.darkest.background)
                    // })
                    // .on('mouseout', function(d) {
                    //     d3.select(this).attr('fill', 'gold')
                    // })
                svg.back.append('image')
                    .attr('xlink:href', '/static/icons/server-from-client.svg')
                    .attr('x', box.botBox.w * 0.018 + box.botBox.w * 0.28 - 24)
                    .attr('y', box.botBox.y + box.botBox.h * 0.04 + box.botBox.h * 0.05 - 15)
                    .attr('width', 22)
                    .attr('height', 22)
                    .style('opacity', 0.8)
                    .style('pointer-events', 'none')

                svg.back.append('rect')
                    .attr('id', '')
                    .attr('x', box.botBox.w * 0.01 + box.botBox.w * 0.03 - 24)
                    .attr('y', box.botBox.y + box.botBox.h * 0.02 + box.botBox.h * 0.05 - 16)
                    .attr('width', 30)
                    .attr('height', 30)
                    .attr('fill', color_theme.bright.background)
                    .attr('stroke', color_theme.bright.stroke)
                    .attr('stroke-width', 0.1)
                    .attr('rx', 48)
                    .on('click', function() {
                        // callOptimizer()
                        svgSummaryMetrics.update_dataBQ()
                    })
                    .on('mouseover', function(e, d) {
                        d3.select(this).attr('fill', color_theme.darkest.background)
                    })
                    .on('mouseout', function(e, d) {
                        d3.select(this).attr('fill', color_theme.bright.background)
                    })
                svg.back.append('image')
                    .attr('xlink:href', '/static/icons/conversion-settings.svg')
                    .attr('x', box.botBox.w * 0.017 + box.botBox.w * 0.03 - 24)
                    .attr('y', box.botBox.y + box.botBox.h * 0.04 + box.botBox.h * 0.05 - 15)
                    .attr('width', 16)
                    .attr('height', 16)
                    .style('opacity', 0.8)
                    .style('pointer-events', 'none')

                svg.back.append('text')
                    .text('10 Results')
                    .attr('x', box.botBox.w * 0.05 + box.botBox.w * 0.03 - 24)
                    .attr('y', box.botBox.y + box.botBox.h * 0.08 + box.botBox.h * 0.05 - 16)
                    .style('fill', color_theme.bright.background)
                    .style('font-weight', 'bold')
                    .style('font-size', '11px')
                    .attr('text-anchor', 'start')
            }

            initTopBackground()
            initBotBackground()
        }
        function initBox() {
            box.topBox = {
                x: svg_dims.w[0] * 0,
                y: svg_dims.h[0] * 0,
                w: svg_dims.w[0] * 1,
                h: svg_dims.h[0] * 0.65,
                marg: svg_dims.w[0] * 0.01,
            }
            box.block_queue_server = {
                x: box.topBox.w * 0.48, //0.374,
                y: box.topBox.h * 0.155,
                w: box.topBox.w * 0.5, // 59
                h: box.topBox.h * 0.47,
                marg: box.topBox.w * 0.01,
            }
            box.event_queue_server = {
                x: box.topBox.w * 0.48, //0.374,
                y: box.topBox.h * 0.03,
                w: box.topBox.w * 0.5, // 59
                h: box.topBox.h * 0.112,
                marg: svg_dims.w[0] * 0.01,
            }
            box.brushZoom = {
                x: box.topBox.w * 0.48, //0.374,
                y: box.topBox.h * 0.655,
                w: box.topBox.w * 0.5, // 59
                h: box.topBox.h * 0.05,
                marg: svg_dims.w[0] * 0.01,
            }
            box.tools = {
                x: box.topBox.w * 0.48, //0.374,
                y: box.topBox.h * 0.75,
                w: box.topBox.w * 0.5, // 59
                h: box.topBox.h * 0.225,
                marg: svg_dims.w[0] * 0.01,
            }
            box.focusOverlay = {
                x: box.topBox.w * 0.48, //0.374,
                y: box.topBox.h * 0.025,
                w: box.topBox.w * 0.5, // 59
                h: box.topBox.h * 0.955,
                marg: svg_dims.w[0] * 0.01,
            }
            box.right_info = {
                x: box.topBox.w * 0.02, // svg_dims.w[0] * 0.68,
                y: box.topBox.h * 0.01,
                w: box.topBox.w * 0.41, // 0.315,
                h: box.topBox.h * 0.95,
                marg: svg_dims.w[0] * 0.01,
            }

            box.botBox = {
                x: svg_dims.w[0] * 0,
                y: svg_dims.h[0] * 0.65,
                w: svg_dims.w[0] * 1,
                h: svg_dims.h[0] * 0.35,
                marg: svg_dims.w[0] * 0.01,
            }
            box.summaryMetrics = {
                x: box.botBox.w * 0.02,
                y: box.botBox.y + box.botBox.h * 0.02,
                w: box.botBox.w * 0.96,
                h: box.botBox.h * 0.96,
                marg: box.botBox.w * 0.01,
            }
        }
        function initDefaultStyle() {
            shared.style = {
            }
            shared.style.runRecCol = cols_blues[2]
            shared.style.blockCol = function(opt_in) {
                // let end_time_sec = is_def(opt_in.end_time_sec)
                //   ? opt_in.end_time_sec
                //   : undefined
                // if (end_time_sec < Number(shared.data.server.time_information.time_now_sec)) return color_theme.blocks.shutdown
                let state = is_def(opt_in.exe_state.state)
                    ? opt_in.exe_state.state
                    : undefined
                let can_run = is_def(opt_in.exe_state.can_run)
                    ? opt_in.exe_state.can_run
                    : undefined
                if (state === 'wait') {
                    return color_theme.blocks.wait
                }
                else if (state === 'done') {
                    return color_theme.blocks.done
                }
                else if (state === 'fail') {
                    return color_theme.blocks.fail
                }
                else if (state === 'run') {
                    return color_theme.blocks.run
                }
                else if (state === 'cancel') {
                    if (is_def(can_run)) {
                        if (!can_run) {
                            return color_theme.blocks.cancelOp
                        }
                    }
                    return color_theme.blocks.cancelSys
                }
                else {
                    return color_theme.blocks.shutdown
                }
            }
        }

        let mult_inits = sock.multiple_inits({
            id: widget_id,
            data: data_in,
        })
        if (mult_inits) {
            return
        }

        sock.set_icon_badge({
            data: data_in,
            icon_divs: icon_divs,
        })

        let svg_div_id = sgv_tag.main.id + 'svg'
        let svg_div = sgv_tag.main.widget.get_ele(svg_div_id)
        if (!is_def(svg_div)) {
            let parent = sgv_tag.main.widget.get_ele(sgv_tag.main.id)
            let svg_div = document.createElement('div')
            svg_div.id = svg_div_id

            dom_add(parent, svg_div)

            run_when_ready({
                pass: function() {
                    return is_def(sgv_tag.main.widget.get_ele(svg_div_id))
                },
                execute: function() {
                    init_data(data_in)
                },
            })
            return
        }
        sock.emit_mouse_move({
            eleIn: svg_div,
            data: {
                widget_id: widget_id,
            },
        })

        initSvg()
        initBox()
        initDefaultStyle()
        initBackground()

        shared.data.server = data_in.data
        shared.data.server.sched_blocks = create_sched_blocks(shared.data.server.blocks)
        let ce = shared.data.server.external_clock_events[0]
        for (let i = 0; i < ce.length; i++) {
            ce[i].start_time_sec = (new Date(ce[i].start_date).getTime() - new Date(shared.data.server.time_information.night_start_sec))
            ce[i].end_time_sec = ce[i].end_date === '' ? undefined : (new Date(ce[i].end_date).getTime() - new Date(shared.data.server.time_information.night_start_sec))
        }
        let cp = deep_copy(shared.data.server.blocks)
        shared.data.copy = {
            blocks: cp,
            sched_blocks: create_sched_blocks(cp),
            conflicts: [],
            modifications: [],
        }

        svgBrush.init_data()
        svg_events_queue_server.init_data()
        svgTargets.init_data()
        svgTelsConflict.init_data()
        svg_blocks_queue_server.init_data()
        svgFocusOverlay.init_data()
        svgRight_info.init_data()

        svgBrush.update_data()
        svg_blocks_queue_server.update_data()
        svgTargets.update_data()
        svgTelsConflict.update_data()

        svgSummaryMetrics.init_data()

        shared.mode = 'standby'
        setStandbyMode()
    }
    this.init_data = init_data
    function update_data_once(data_in) {
        if (shared.mode === 'standby') {
            return
        }
        if (!locker.are_free([ 'pushNewSchedule' ])) {
            setTimeout(function() {
                update_data_once(data_in)
            }, times.wait_loop)
            return
        }

        locker.add('update_data')

        shared.data.server = data_in.data
        shared.data.server.sched_blocks = create_sched_blocks(shared.data.server.blocks)
        let ce = shared.data.server.external_clock_events[0]
        for (let i = 0; i < ce.length; i++) {
            ce[i].start_time_sec = (new Date(ce[i].start_date).getTime() - new Date(shared.data.server.time_information.night_start_sec))
            ce[i].end_time_sec = ce[i].end_date === '' ? undefined : (new Date(ce[i].end_date).getTime() - new Date(shared.data.server.time_information.night_start_sec))
        }
        updateRuntoDoneBlocks()

        svg_blocks_queue_server.update_data()
        svg_events_queue_server.update_data()
        svgBrush.update_data()
        svgRight_info.update()

        let current_time = {
            date: new Date(shared.data.server.time_information.time_now_sec),
        }
        svg.back.select('text#currentHour').text(d3.timeFormat('%H:%M')(current_time.date))

        locker.remove('update_data')
    }
    function update_data(data_in) {
        run_loop.push({
            tag: 'update_data',
            data: data_in,
        })
    }
    this.update_data = update_data
    run_loop.init({
        tag: 'update_data',
        func: update_data_once,
        n_keep: 1,
    })

    function update_pushon_server(enabled) {
        if (!enabled) {
            svg.back.select('rect#conflictlighton')
                .attr('fill', colorPalette.blocks.fail.background)
            svg.back.select('rect#pushon_server')
                .attr('fill', color_theme.darkest.stroke)
                .style('opacity', 1)
                .on('click', () => {})
                .on('mouseover', () => {})
                .on('mouseout', () => {})
        }
        else {
            svg.back.select('rect#conflictlighton')
                .attr('fill', '#43A047')
            svg.back.select('rect#pushon_server')
                .attr('fill', 'gold')
                .style('opacity', 0.6)
                .on('click', function() {
                    pushNewSchedule()
                })
                .on('mouseover', function(e, d) {
                    d3.select(this).style('cursor', 'pointer')
                    d3.select(this).attr('fill', d3.color('gold').darker())
                })
                .on('mouseout', function(e, d) {
                    d3.select(this).style('cursor', 'default')
                    d3.select(this).attr('fill', 'gold')
                })
        }
    }
    function updateRuntoDoneBlocks() {
        let change = false
        for (let i = shared.data.copy.blocks['run'].length - 1; i >= 0; i--) {
            let d = getBlockById(shared.data.server.blocks, shared.data.copy.blocks['run'][i].obs_block_id)
            if (d.key === 'done') {
                shared.data.copy.blocks['run'].splice(i, 1)
                shared.data.copy.blocks['done'].push(d.data)
                change = true
            }
        }
        for (let i = shared.data.copy.blocks['wait'].length - 1; i >= 0; i--) {
            let d = getBlockById(shared.data.server.blocks, shared.data.copy.blocks['wait'][i].obs_block_id)
            if (d.key === 'run') {
                shared.data.copy.blocks['wait'].splice(i, 1)
                shared.data.copy.blocks['run'].push(d.data)
                change = true
            }
            else if (d.key === 'done') {
                shared.data.copy.blocks['wait'].splice(i, 1)
                shared.data.copy.blocks['done'].push(d.data)
                // let ex = shared.data.copy.blocks['wait'].splice(i, 1)[0]
                // ex.exe_state = d.data.exe_state
                // shared.data.copy.blocks['done'].push(ex)
                change = true
            }
        }
        if (change) {
            createModificationsList()
        }
    }
    function get_blocksData(from) {
        if (from === 'server') {
            return shared.data.server.blocks
        }
        else if (from === 'copy') {
            return shared.data.copy.blocks
        }
        return shared.data.copy.blocks
    }
    function get_sched_blocksData() {
        if (shared.mode === 'inspector') {
            return shared.data.server.sched_blocks
        }
        if (shared.mode === 'modifier') {
            return shared.data.copy.sched_blocks
        }
    }
    let focusManager = new function() {
        function unfocusCore(type, id) {
            function sched_block() {
                svgRight_info.clean()
                // svg_information.unfocus_sched_blocks()
                // svg_sched_blocks_icons.unfocusOn_sched_blocks()
                //
                // blockQueue.unfocusOn_sched_blocks()
                // blockQueueModif.unfocusOn_sched_blocks()
                // blockQueueOptimized.unfocusOn_sched_blocks()
                // shared.focus.sched_blocks = undefined
            }
            function block() {
                svgRight_info.clean()
                svgFocusOverlay.unfocusOn_block(id)
                // if (!shared.focus.block) return
                // svg_information.unfocusBlock()
                // svg_information.focusOn_sched_blocks(shared.focus.sched_blocks)
                // blockQueue.unfocusOn_block(shared.focus.block)
                // blockQueueModif.unfocusOn_block(shared.focus.block)
                // blockQueueOptimized.unfocusOn_block(shared.focus.block)
                // let dataB = getBlockById(shared.focus.block)
                // dataB = dataB.optimized.data ? dataB.optimized.data : dataB.insert.data
                // svgFocusOverlay.unfocusOn_block({data: dataB})
                // shared.focus.block = undefined
            }
            function target() {
                svgRight_info.clean()
            }
            function telescope() {
                svgRight_info.clean()
            }
            if (type === 'sched_block') {
                sched_block()
            }
            if (type === 'block') {
                block()
            }
            if (type === 'target') {
                target()
            }
            if (type === 'telescope') {
                telescope()
            }
        }
        function focusCore(type, id) {
            function sched_block() {
                // svg_information.unfocus_sched_blocks()
                // svg_sched_blocks_icons.unfocusOn_sched_blocks()
                //
                // blockQueue.unfocusOn_sched_blocks()
                // blockQueueModif.unfocusOn_sched_blocks()
                // blockQueueOptimized.unfocusOn_sched_blocks()
                // shared.focus.sched_blocks = undefined
                svgRight_info.focusOn_sched_block(id)
            }
            function block() {
                svgRight_info.focusOn_block(id)
                // if (shared.over && shared.over.type === type && shared.over.id === id) return
                svgFocusOverlay.focusOn_block(id)
                // console.log(shared.focus.block, block);
                // if (shared.focus.block !== undefined) {
                //   if (shared.focus.block === block.obs_block_id) {
                //     mainUnfocusOn_block()
                //     return
                //   }
                //   mainUnfocusOn_block()
                // }
                // mainUnfocusOn_sched_blocks()
                // main_focusOn_sched_blocks(block.sched_block_id)
                // shared.focus.block = block.obs_block_id
                // // svg_sched_blocks_icons.focusOn_sched_blocks(block)
                // svg_information.focusOn_block(block.obs_block_id)
                // blockQueue.focusOn_block(block.obs_block_id)
                // blockQueueModif.focusOn_block(block.obs_block_id)
                // blockQueueOptimized.focusOn_block(block.obs_block_id)
                // svgFocusOverlay.focusOn_block({data: block})
            }
            function target() {
                svgRight_info.focusOnTarget(id)
            }
            function telescope() {
                svgRight_info.focusOnTelescope(id)
            }

            if (type === 'sched_block') {
                sched_block()
            }
            if (type === 'block') {
                block()
            }
            if (type === 'target') {
                target()
            }
            if (type === 'telescope') {
                telescope()
            }
        }

        function outCore(type, id) {
            function sched_block() {
                // svgRight_info.clean()
            }
            function block() {
                svgFocusOverlay.outBlock(id)
            }
            function target() {
                // svgRight_info.clean()
            }
            function telescope() {
                // svgRight_info.clean()
            }
            if (type === 'sched_block') {
                sched_block()
            }
            if (type === 'block') {
                block()
            }
            if (type === 'target') {
                target()
            }
            if (type === 'telescope') {
                telescope()
            }
        }
        function overCore(type, id) {
            function sched_block() {
                // svgRight_info.focusOn_sched_block(id)
            }
            function block() {
                svgFocusOverlay.overBlock(shared.over.id)
            }
            function target() {
                // svgRight_info.focusOnTarget(id)
            }
            function telescope() {
                // svgRight_info.focusOnTelescope(id)
            }

            if (type === 'sched_block') {
                sched_block()
            }
            if (type === 'block') {
                block()
            }
            if (type === 'target') {
                target()
            }
            if (type === 'telescope') {
                telescope()
            }
        }

        function unfocus() {
            let type = shared.focus.type
            let id = shared.focus.id
            shared.focus = undefined
            unfocusCore(type, id)
        }
        this.unfocus = unfocus
        function focusOn(type, id) {
            if (shared.focus) {
                if (shared.focus.type === type && shared.focus.id === id) {
                    unfocus()
                }
                else {
                    unfocus()
                    shared.focus = {
                        type: type,
                        id: id,
                    }
                    // if (shared.history.index === -1 || shared.history.list[shared.history.index].id !== id) {
                    //   shared.history.list.push({type: type, id: id})
                    //   shared.history.index = shared.history.list.length - 1
                    // }
                    // if (shared.history.index === shared.history.list.length - 1) {
                    //   shared.history.list.push({type: type, id: id})
                    //   shared.history.index = shared.history.list.length - 1
                    // } else {
                    //   shared.history.list.splice(shared.history.index, shared.history.list.length, {type: type, id: id})
                    //   shared.history.index = shared.history.list.length - 1
                    // }
                    focusCore(shared.focus.type, shared.focus.id)
                }
            }
            else {
                shared.focus = {
                    type: type,
                    id: id,
                }
                // if (shared.history.index === -1 || shared.history.list[shared.history.index].id !== id) {
                //   shared.history.list.push({type: type, id: id})
                //   shared.history.index = shared.history.list.length - 1
                // }
                // if (shared.history.index === shared.history.list.length - 1) {
                //   shared.history.list.push({type: type, id: id})
                //   shared.history.index = shared.history.list.length - 1
                // } else {
                //   shared.history.list.splice(shared.history.index, shared.history.list.length, {type: type, id: id})
                //   shared.history.index = shared.history.list.length - 1
                // }
                focusCore(shared.focus.type, shared.focus.id)
            }
        }
        this.focusOn = focusOn

        function over(type, id) {
            if (shared.focus) {
                if (shared.over) {
                    if (shared.over.type !== type && shared.over.id !== id) {
                        shared.over = {
                            type: type,
                            id: id,
                        }
                        overCore(type, id)
                    }
                }
                else {
                    shared.over = {
                        type: type,
                        id: id,
                    }
                    if (shared.focus.type === type && shared.focus.id === id) {
                        return
                    }
                    overCore(type, id)
                }
            }
            else {
                shared.over = {
                    type: type,
                    id: id,
                }
                overCore(type, id)
            }
        }
        this.over = over
        function out(type, id) {
            if (shared.focus) {
                if (shared.focus.type === shared.over.type && shared.focus.id === shared.over.id) {
                    shared.over = undefined
                    return
                }
            }
            // let type = shared.over.type
            // let id = shared.over.id
            shared.over = undefined
            outCore(type, id)
        }
        this.out = out
    }()
    function navigateHistory(mode) {
        if (mode === 'backward') {
            shared.history.index -= 1
            if (shared.history.index === -1) {
                shared.data.copy.blocks = deep_copy(get_blocksData('server'))
            }
            else {
                shared.data.copy.blocks = deep_copy(shared.history.list[shared.history.index].data)
            }
        }
        else if (mode === 'forward') {
            shared.history.index += 1
            shared.data.copy.blocks = deep_copy(shared.history.list[shared.history.index].data)
        }
        updateRuntoDoneBlocks()
        createModificationsList()
        svg_blocks_queue_server.update_data()
        svgTelsConflict.update()
        svgRight_info.updateOverview()
    // console.log(shared.data.copy.blocks);
    // console.log(get_blocksData('server'))
    }

    function scheduleSuccessfullyUpdate() {
        svg.g.selectAll('g.pushingNewSchedule')
            .append('text')
            .text('... Success')
            .style('fill', color_theme.darker.text)
            .style('font-weight', 'bold')
            .style('font-size', '30px')
            .attr('text-anchor', 'middle')
            .attr('x', svg_dims.w[0] * 0.7)
            .attr('y', svg_dims.h[0] * 0.6)
        svg.g.selectAll('g.pushingNewSchedule')
            .transition()
            .delay(1000)
            .duration(400)
            .style('opacity', 0)
            .on('end', function() {
                svg.g.selectAll('g.pushingNewSchedule').remove()
                locker.remove('pushNewSchedule')
            })
    }
    this.scheduleSuccessfullyUpdate = scheduleSuccessfullyUpdate
    function sync_state_send(data_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        sock.sock_sync_state_send({
            widget_id: widget_id,
            type: data_in.type,
            data: data_in,
        })
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setCol(opt_in) {
        if (opt_in.end_time_sec < Number(shared.data.server.time_information.time_now_sec)) {
            return color_theme.blocks.shutdown
        }
        let state = is_def(opt_in.state)
            ? opt_in.state
            : opt_in.exe_state.state
        let can_run = is_def(opt_in.can_run)
            ? opt_in.can_run
            : opt_in.exe_state.can_run

        if (state === 'wait') {
            return color_theme.blocks.wait
        }
        else if (state === 'done') {
            return color_theme.blocks.done
        }
        else if (state === 'fail') {
            return color_theme.blocks.fail
        }
        else if (state === 'run') {
            return color_theme.blocks.run
        }
        else if (state === 'cancel') {
            if (is_def(can_run)) {
                if (!can_run) {
                    return color_theme.blocks.cancelOp
                }
            }
            return color_theme.blocks.cancelSys
        }
        else {
            return color_theme.blocks.shutdown
        }
    }
    function clean_blocks() {
        let clean_schedule = []
        for (let key in shared.data.copy.blocks) {
            let group = shared.data.copy.blocks[key]
            for (let i = 0; i < group.length; i++) {
                let clean_block = deep_copy(group[i])
                delete clean_block.display
                delete clean_block.filtered
                delete clean_block.nLine
                delete clean_block.runphase
                delete clean_block.target
                clean_schedule.push(clean_block)
            }
        }
        return clean_schedule
    }
    function pushNewSchedule() {
        locker.add('pushNewSchedule')
        let pushingG = svg.g.append('g')
            .attr('class', 'pushingNewSchedule')
        pushingG.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', svg_dims.w[0])
            .attr('height', svg_dims.h[0])
            .attr('fill', color_theme.darker.background)
            .style('opacity', 0)
            .transition()
            .duration(400)
            .style('opacity', 0.8)
            .on('end', function() {
                let cleanQueue = clean_blocks()
                push_new_sched_evt({
                    new_schedule: cleanQueue,
                })

                function loop(circle) {
                    circle
                        .attr('stroke-dashoffset', (2 * Math.PI * 25) * 0.35)
                        .transition()
                        .duration(1000)
                        .ease(d3.easeCubic)
                        .attr('stroke-dashoffset', -(2 * Math.PI * 25) * 0.65)
                        .on('end', function() {
                            loop(innerCircle)
                        })
                }
                pushingG.append('circle')
                    .attr('cx', svg_dims.w[0] * 0.5)
                    .attr('cy', svg_dims.h[0] * 0.33)
                    .attr('r', 25)
                    .attr('fill', 'transparent')
                    .attr('stroke', color_theme.medium.background)
                    .attr('stroke-width', 10)
                let innerCircle = pushingG.append('circle')
                    .attr('cx', svg_dims.w[0] * 0.5)
                    .attr('cy', svg_dims.h[0] * 0.33)
                    .attr('r', 25)
                    .attr('fill', 'transparent')
                    .attr('stroke', color_theme.medium.stroke)
                    .attr('stroke-width', 10)
                    .attr('stroke-dasharray', [ (2 * Math.PI * 25) * 0.2, (2 * Math.PI * 25) * 0.8 ])
                    .attr('stroke-dashoffset', (2 * Math.PI * 25) * 0.35)
                loop(innerCircle)

                pushingG.append('text')
                    .text('Overriding schedule ...')
                    .style('fill', color_theme.darker.text)
                    .style('font-weight', 'bold')
                    .style('font-size', '30px')
                    .attr('text-anchor', 'middle')
                    .attr('x', svg_dims.w[0] * 0.3)
                    .attr('y', svg_dims.h[0] * 0.6)
            })
    }
    this.pushNewSchedule = pushNewSchedule

    function switchMainMode() {
        svgBrush.translateTo(box.brushZoom.x, box.brushZoom.y + 24)
        svg.g.append('rect')
            .attr('id', 'createNewSched_button')
            .attr('x', box.brushZoom.x)
            .attr('y', box.brushZoom.y + svg_dims.h[0] * 0.015)
            .attr('width', box.brushZoom.w)
            .attr('height', 21)
            .attr('fill', color_theme.brighter.background)
            .attr('stroke', color_theme.brighter.stroke)
            .attr('stroke-width', 0.2)
            .attr('rx', 2)
            .on('click', function() {
                createDummyBlock()
            })
    }
    function pullData() {
        let ori = {
            blocks: deep_copy(shared.data.server).blocks,
        }
        for (var key in ori.blocks) {
            for (var i = 0; i < ori.blocks[key].length; i++) {
                ori.blocks[key][i].modifications = {
                    created: false,
                    modified: false,
                    userModifications: {
                    },
                    optimizerModifications: {
                    },
                }
            }
        }
        let opti = deep_copy(ori)
        let modi = deep_copy(ori)

        if (shared.data.copy.length === 0) {
            shared.data.current = 0
            shared.data.copy.push({
                original: ori,
                modified: modi,
                creation: {
                    blocks: {
                        done: [],
                        run: [],
                        wait: [],
                    },
                },
                optimized: opti,
            })
        }
        else {
            shared.data.copy[shared.data.current].original = ori
            shared.data.copy[shared.data.current].modified = modi
            shared.data.copy[shared.data.current].creation = {
                blocks: {
                    done: [],
                    run: [],
                    wait: [],
                },
            }
            shared.data.copy[shared.data.current].optimized = opti
        }

        updateAllBlocksQueue()
        svgTargets.update_data()
        svgTelsConflict.update_data()
        svgFocusOverlay.update_data()
    }
    function create_sched_blocks(blocks) {
        let temp = {
        }
        function core(blocks) {
            for (let i = 0; i < blocks.length; i++) {
                let b = blocks[i]
                if (!temp[b.sched_block_id]) {
                    temp[b.sched_block_id] = {
                        exe_state: {
                            state: b.exe_state.state,
                            can_run: true,
                        },
                        targets: b.targets,
                        blocks: [ b ],
                    }
                }
                else {
                    let sb = temp[b.sched_block_id]
                    sb.blocks.push(b)
                    if (b.exe_state.state === 'run' || sb.exe_state.state === 'run') {
                        sb.exe_state.state = 'run'
                    }
                    else if (b.exe_state.state === 'wait' && sb.exe_state.state === 'done') {
                        sb.exe_state.state = 'run'
                    }
                    else if (b.exe_state.state === 'done' && sb.exe_state.state === 'wait') {
                        sb.exe_state.state = 'run'
                    }
                }
            }
        }
        if (Array.isArray(blocks)) {
            core(blocks)
        }
        else {
            for (let key in blocks) {
                core(blocks[key])
            }
        }
        return temp
    }
    function optimizer() {
        shared.data.copy[shared.data.current].optimized = deep_copy(shared.data.copy[shared.data.current].modified)

        function is_same_time(s1, e1, s2, e2) {
            if (s1 > s2 && s1 < e2) {
                return true
            }
            if (e1 > s2 && e1 < e2) {
                return true
            }
            if (s1 < s2 && e1 > e2) {
                return true
            }
            return false
        }
        function shareSameTels(b1, b2) {
            let remTels1 = []
            let remTels2 = []
            for (let i = b1.tel_ids.length - 1; i > -1; i--) {
                for (let j = b2.tel_ids.length - 1; j > -1; j--) {
                    if (b1.tel_ids[i] === b2.tel_ids[j]) {
                        if (Math.random() > 0.5) {
                            remTels1.push(b1.tel_ids.splice(i, 1)[0])
                        }
                        else {
                            remTels2.push(b2.tel_ids.splice(j, 1)[0])
                        }
                        break
                    }
                }
            }
            if (remTels1.length > 0) {
                b1.modifications.optimizerModifications.telescopes = []
                b1.modifications.optimizerModifications.telescopes.push({
                    old: remTels1,
                    new: [],
                })
                b1.modifications.modified = true
            }
            if (remTels2.length > 0) {
                b2.modifications.optimizerModifications.telescopes = []
                b2.modifications.optimizerModifications.telescopes.push({
                    old: remTels2,
                    new: [],
                })
                b2.modifications.modified = true
            }
        }
        for (let i = shared.data.copy[shared.data.current].optimized.blocks.wait.length - 1; i > -1; i--) {
            let tb = shared.data.copy[shared.data.current].optimized.blocks.wait[i]
            for (let j = 0; j < shared.data.copy[shared.data.current].optimized.blocks.run.length; j++) {
                let mb = shared.data.copy[shared.data.current].optimized.blocks.run[j]
                if (is_same_time(mb.start_time_sec, mb.end_time_sec, tb.start_time_sec, tb.end_time_sec)) {
                    shareSameTels(mb, tb)
                }
            }
            for (let j = 0; j < shared.data.copy[shared.data.current].optimized.blocks.wait.length; j++) {
                let mb = shared.data.copy[shared.data.current].optimized.blocks.wait[j]
                if (is_same_time(mb.start_time_sec, mb.end_time_sec, tb.start_time_sec, tb.end_time_sec)) {
                    shareSameTels(mb, tb)
                }
            }
        }
        svgBlocksQueueOptimized.update_data()
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
                schedName: key,
                scheduleId: res[key][0].sched_block_id,
                blocks: res[key],
            })
        })
        return ret
    }
    function get_targetById(id) {
        for (let i = 0; i < shared.data.server.targets.length; i++) {
            if (shared.data.server.targets[i].id === id) {
                return shared.data.server.targets[i]
            }
        }
    }
    function getTelescopeById(id) {
        for (let i = 0; i < shared.data.server.inst_health.length; i++) {
            if (shared.data.server.inst_health[i].id === id) {
                return shared.data.server.inst_health[i]
            }
        }
    }
    function getBlockById(blockList, blockId) {
        let block = {
            data: undefined,
            key: undefined,
            index: undefined,
        }
        for (let key in blockList) {
            let group = blockList[key]
            for (let i = 0; i < group.length; i++) {
                if (group[i].obs_block_id === blockId) {
                    block = {
                        data: group[i],
                        key: key,
                        index: i,
                    }
                    return block
                }
            }
        }
        // for (let key in shared.data.copy[shared.data.current].original.blocks) {
        //   let group = shared.data.copy[shared.data.current].original.blocks[key]
        //   for (let i = 0; i < group.length; i++) {
        //     if (group[i].obs_block_id === blockId) {
        //       block.original = {data: group[i], key: key, index: i}
        //     }
        //   }
        // }
        // for (let key in shared.data.copy[shared.data.current].modified.blocks) {
        //   let group = shared.data.copy[shared.data.current].modified.blocks[key]
        //   for (let i = 0; i < group.length; i++) {
        //     if (group[i].obs_block_id === blockId) {
        //       block.modified = {data: group[i], key: key, index: i}
        //     }
        //   }
        // }
        // for (let key in shared.data.copy[shared.data.current].optimized.blocks) {
        //   let group = shared.data.copy[shared.data.current].optimized.blocks[key]
        //   for (let i = 0; i < group.length; i++) {
        //     if (group[i].obs_block_id === blockId) {
        //       block.optimized = {data: group[i], key: key, index: i}
        //     }
        //   }
        // }
        // for (let key in shared.data.copy[shared.data.current].creation.blocks) {
        //   let group = shared.data.copy[shared.data.current].creation.blocks[key]
        //   for (let i = 0; i < group.length; i++) {
        //     if (group[i].obs_block_id === blockId) {
        //       block.insert = {data: group[i], key: key, index: i}
        //     }
        //   }
        // }
        return block
    }
    function overrideProperties(from, to) {
        for (let key in from) {
            to[key] = from[key]
        }
    }

    function createModificationsList() {
        shared.data.copy.modifications = []
        for (let key in shared.data.copy.blocks) {
            for (let i = 0; i < shared.data.copy.blocks[key].length; i++) {
                let block = shared.data.copy.blocks[key][i]
                let sched = shared.data.copy.modifications.filter(d => d.id === block.sched_block_id)
                let old = getBlockById(get_blocksData('server'), block.obs_block_id).data
                let diff = checkBlocksDifference(old, block)

                if (sched.length === 0) {
                    if (diff.length !== 0) {
                        shared.data.copy.modifications.push({
                            id: block.sched_block_id,
                            name: block.metadata.n_sched,
                            blocks: [ block ],
                        })
                    }
                }
                else {
                    let b = sched[0].blocks.filter(d => d.obs_block_id === block.obs_block_id)
                    if (b.length === 0) {
                        if (diff.length !== 0) {
                            sched[0].blocks.push(block)
                        }
                    }
                    else {
                        if (diff.length !== 0) {
                            b = block
                        }
                        else {
                            sched[0].blocks.splice(sched[0].blocks.indexOf(b), 1)
                            if (sched[0].blocks.length === 0) {
                                shared.data.copy.modifications.splice(shared.data.copy.modifications.indexOf(sched[0]), 1)
                            }
                        }
                    }
                }
            }
        }
    }
    function checkBlocksDifference(reference, changed) {
        let diff = []
        function diffTime() {
            if (reference === undefined) {
                diff.push({
                    type: 'time',
                    start: {
                        old: undefined,
                        new: changed.time.start,
                    },
                    duration: {
                        old: undefined,
                        new: changed.time.duration,
                    },
                    end: {
                        old: undefined,
                        new: changed.time.end,
                    },
                })
                return
            }
            if (reference.time.start !== changed.time.start || reference.time.duration !== changed.time.duration) {
                diff.push({
                    type: 'time',
                    start: {
                        old: reference.time.start,
                        new: changed.time.start,
                    },
                    duration: {
                        old: reference.time.duration,
                        new: changed.time.duration,
                    },
                    end: {
                        old: reference.time.end,
                        new: changed.time.end,
                    },
                })
            }
        }
        function diffState() {
            if (reference === undefined) {
                diff.push({
                    type: 'state',
                    old: undefined,
                    new: changed.exe_state.state,
                })
                return
            }
            if (reference.exe_state.state !== changed.exe_state.state) {
                diff.push({
                    type: 'state',
                    old: reference.exe_state.state,
                    new: changed.exe_state.state,
                })
            }
        }
        function diffPointing() {
        }
        function diffTel() {
            if (reference === undefined) {
                diff.push({
                    type: 'telescope',
                    small: {
                        diff: changed.telescopes.small.ids.length,
                        new: changed.telescopes.small.ids,
                        rem: [],
                    },
                    medium: {
                        diff: changed.telescopes.medium.ids.length,
                        new: changed.telescopes.medium.ids,
                        rem: [],
                    },
                    large: {
                        diff: changed.telescopes.large.ids.length,
                        new: changed.telescopes.large.ids,
                        rem: [],
                    },
                })
                return
            }

            let l = changed.telescopes.large.ids.length - reference.telescopes.large.ids.length
            let nl = changed.telescopes.large.ids.filter(d => reference.telescopes.large.ids.indexOf(d) === -1)
            let rl = reference.telescopes.large.ids.filter(d => changed.telescopes.large.ids.indexOf(d) === -1)

            let m = changed.telescopes.medium.ids.length - reference.telescopes.medium.ids.length
            let nm = changed.telescopes.medium.ids.filter(d => reference.telescopes.medium.ids.indexOf(d) === -1)
            let rm = reference.telescopes.medium.ids.filter(d => changed.telescopes.medium.ids.indexOf(d) === -1)

            let s = changed.telescopes.small.ids.length - reference.telescopes.small.ids.length
            let ns = changed.telescopes.small.ids.filter(d => reference.telescopes.small.ids.indexOf(d) === -1)
            let rs = reference.telescopes.small.ids.filter(d => changed.telescopes.small.ids.indexOf(d) === -1)

            if ((nl.length > 0 || rl.length > 0) || (nm.length > 0 || rm.length > 0) || (ns.length > 0 || rs.length > 0)) {
                diff.push({
                    type: 'telescope',
                    small: {
                        diff: s,
                        new: ns,
                        rem: rs,
                    },
                    medium: {
                        diff: m,
                        new: nm,
                        rem: rm,
                    },
                    large: {
                        diff: l,
                        new: nl,
                        rem: rl,
                    },
                })
            }
        }
        diffState()
        diffTime()
        diffPointing()
        diffTel()
        return diff
    }
    let globalcounth = 0
    function changeBlockProperties(block, nohistory, type) {
        createModificationsList()
        if (!nohistory) {
            shared.history.list.splice(shared.history.index + 1, shared.history.list.length)
            let last = shared.history.list[shared.history.index]
            if (shared.history.index >= 0 && last.id === block.obs_block_id && last.type === type) {
                shared.history.list[shared.history.index] = {
                    data: deep_copy(get_blocksData('copy')),
                    count: globalcounth,
                    id: block.obs_block_id,
                    type: type,
                }
            }
            else {
                shared.history.list.push({
                    data: deep_copy(get_blocksData('copy')),
                    count: globalcounth,
                    id: block.obs_block_id,
                    type: type,
                })
                shared.history.index = shared.history.list.length - 1
                globalcounth++
            }
        }
        svgRight_info.updateOverview()
    }

    function createSchedName(blocks) {
        let max = 0
        for (let key in blocks) {
            for (let i = 0; i < blocks[key].length; i++) {
                if (blocks[key][i].metadata.n_sched > max) {
                    max = blocks[key][i].metadata.n_sched
                }
            }
        }
        return max + 1
    }
    function createDummyBlock() {
    // let newBlock = deep_copy(blockTemplate)
        let newBlock = shared.data.copy.blocks.wait.length > 0 ? deep_copy(shared.data.copy.blocks.wait[0]) : deep_copy(blockTemplate)

        let n_sched = createSchedName(shared.data.copy.blocks)
        let n_obs = 0

        newBlock.sched_block_id = 'schBlock_' + (Math.floor(Math.random() * 300000))
          + '_' + (Math.floor(Math.random() * 9))
          + '_' + (Math.floor(Math.random() * 9))
          + '_' + (Math.floor(Math.random() * 9))
        newBlock.obs_block_id = newBlock.sched_block_id + '_' + n_obs
        newBlock.timestamp = new Date().getTime()
        newBlock.run_phase = []
        console.log(shared.data.copy)
        newBlock.time = {
            start: shared.data.server.time_information.time_now_sec,
            duration: 2000,
            end: shared.data.server.time_information.time_now_sec + 2000,
        }
        newBlock.metadata = {
            block_name: n_sched + ' (' + n_obs + ')',
            n_obs: n_obs,
            n_sched: n_sched,
        }
        newBlock.exe_state = {
            state: 'wait',
            can_run: true,
        }
        newBlock.created = true

        if (shared.data.copy.blocks.wait.length <= 0) {
            newBlock.targets = shared.data.copy.blocks['wait'][0].targets
            newBlock.pointings = shared.data.copy.blocks['wait'][0].pointings
            newBlock.telescopes = {
                large: {
                    min: 0,
                    max: 4,
                    ids: [],
                },
                medium: {
                    min: 0,
                    max: 25,
                    ids: [],
                },
                small: {
                    min: 0,
                    max: 70,
                    ids: [],
                },
            }
        }

        shared.data.copy.blocks.wait.push(newBlock)
        shared.data.copy.sched_blocks = create_sched_blocks(shared.data.copy.blocks)

        focusManager.focusOn('sched_block', newBlock.sched_block_id)
    // console.log(get_sched_blocksData()['newBlockSbID'])
    }
    function createNewBlockIn_schedule(schedB) {
    // let newBlock = deep_copy(blockTemplate)
        let newBlock = deep_copy(schedB.blocks[0])

        let n_obs = schedB.blocks.length
        newBlock.obs_block_id = newBlock.sched_block_id + '_' + n_obs
        newBlock.timestamp = new Date().getTime()
        newBlock.run_phase = []
        newBlock.time = {
            start: schedB.blocks[schedB.blocks.length - 1].time.end + 5,
            duration: schedB.blocks[schedB.blocks.length - 1].time.duration,
            end: schedB.blocks[schedB.blocks.length - 1].time.end + 5 + schedB.blocks[0].time.duration,
        }
        newBlock.metadata = {
            block_name: newBlock.metadata.n_sched + ' (' + n_obs + ')',
            n_obs: n_obs,
            n_sched: newBlock.metadata.n_sched,
        }
        newBlock.exe_state = {
            state: 'wait',
            can_run: true,
        }
        newBlock.created = true

        shared.data.copy.blocks.wait.push(newBlock)
        shared.data.copy.sched_blocks = create_sched_blocks(shared.data.copy.blocks)

        focusManager.focusOn('block', newBlock.obs_block_id)

        changeBlockProperties(newBlock, false, 'newblock')
        updateView()
    }
    function updateBlockState(block, newState) {
        if (block.exe_state.state === newState) {
            return
        }
        let totBlock = get_blocksData()
        if (block.exe_state.state === 'wait') {
            for (let i = 0; i < totBlock.wait.length; i++) {
                if (totBlock.wait[i].obs_block_id === block.obs_block_id) {
                    let block = totBlock.wait.splice(i, 1)[0]
                    block.exe_state.state = newState
                    if (block.exe_state.state === 'run') {
                        totBlock.run.push(block)
                    }
                    else if (block.exe_state.state === 'cancel') {
                        totBlock.done.push(block)
                    }
                }
            }
        }
        else if (block.exe_state.state === 'run') {
            for (let i = 0; i < totBlock.run.length; i++) {
                if (totBlock.run[i].obs_block_id === block.obs_block_id) {
                    let block = totBlock.run.splice(i, 1)[0]
                    block.exe_state.state = newState
                    if (block.exe_state.state === 'cancel') {
                        totBlock.done.push(block)
                    }
                }
            }
        }
        else if (block.exe_state.state === 'cancel') {
            for (let i = 0; i < totBlock.done.length; i++) {
                if (totBlock.done[i].obs_block_id === block.obs_block_id) {
                    let block = totBlock.done.splice(i, 1)[0]
                    block.exe_state.state = newState
                    if (block.exe_state.state === 'run') {
                        totBlock.run.push(block)
                    }
                    else if (block.exe_state.state === 'wait') {
                        totBlock.wait.push(block)
                    }
                }
            }
        }
        updateView()
    }
    function updateView() {
        svg_blocks_queue_server.update_data()
        svgTelsConflict.update()
    }

    let Svg_events_queue_server = function() {
        let reserved = {
        }
        function init_data() {
            let adjustedBox = {
                x: box.event_queue_server.x,
                y: box.event_queue_server.y,
                w: box.event_queue_server.w,
                h: box.event_queue_server.h,
                marg: svg_dims.w[0] * 0.01,
            }

            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

            event_queue_server = new EventDisplayer({
                main: {
                    tag: 'eventDisplayerMiddleTag',
                    g: reserved.g,
                    scroll: {
                    },
                    box: adjustedBox,
                    background: {
                        fill: 'none',
                        stroke: color_theme.medium.stroke,
                        strokeWidth: 0,
                    },
                    color_theme: color_theme,
                },

                displayer: 'eventTrack',
                eventQueue: {
                    g: undefined,
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: 0,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        show: false,
                        orientation: 'top',
                        attr: {
                            text: {
                                size: 14,
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                        },
                    },
                    details: {
                        range: 'in',
                        anchor: 'right',
                    },
                },
                eventTrack: {
                    g: undefined,
                    sched_blocks: {
                        label: {
                            enabled: true,
                            position: 'left',
                        },
                    },
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: 0,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        show: false,
                        orientation: 'top',
                        attr: {
                            text: {
                                size: 14,
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                        },
                    },
                    timeBars: {
                        enabled: false,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h * 0.025,
                            w: adjustedBox.w,
                            h: adjustedBox.h * 0.975,
                            marg: adjustedBox.marg,
                        },
                    },
                },

                filters: {
                    eventFilters: [],
                    filtering: [],
                },
                time: {
                    current_time: {
                        time: 0,
                        date: undefined,
                    },
                    start_time_sec: {
                        time: 0,
                        date: undefined,
                    },
                    end_time_sec: {
                        time: 0,
                        date: undefined,
                    },
                },
                data: {
                    raw: undefined,
                    formated: undefined,
                    modified: undefined,
                },
                debug: {
                    enabled: false,
                },
                pattern: {
                },
                events: {
                    event: {
                        click: (d) => {
                            console.log(d)
                        },
                        mouseover: (d) => {
                            console.log(d)
                        },
                        mouseout: (d) => {
                            console.log(d)
                        },
                        drag: {
                            start: () => {},
                            tick: () => {},
                            end: () => {},
                        },
                    },
                },
                input: {
                    focus: {
                        sched_blocks: undefined,
                        block: undefined,
                    },
                    over: {
                        sched_blocks: undefined,
                        block: undefined,
                    },
                    selection: [],
                },
            })
            event_queue_server.init()
        }
        this.init_data = init_data

        function blurry() {
            reserved.g.style('opacity', 0.1)
        }
        this.blurry = blurry
        function focus() {
            reserved.g.style('opacity', 1)
        }
        this.focus = focus

        function update_data() {
            let axisTop = brushZoom.get_domain().focus
            let start_time_sec = {
                date: axisTop[0],
                time: (new Date(shared.data.server.time_information.night_start_sec).getTime() - axisTop[0]) / -1000,
            }
            let end_time_sec = {
                date: axisTop[1],
                time: (new Date(shared.data.server.time_information.night_start_sec).getTime() - axisTop[1]) / -1000,
            }
            event_queue_server.update_data({
                time: {
                    current_time: {
                        date: new Date(shared.data.server.time_information.time_now_sec),
                        time: Number(shared.data.server.time_information.time_now_sec),
                    },
                    start_time_sec: start_time_sec,
                    end_time_sec: end_time_sec,
                },
                data: {
                    raw: {
                        events_ponctual: shared.data.server.external_events[0],
                        events_scheduled: shared.data.server.external_clock_events[0],
                    },
                    modified: [],
                },
            })
        }
        this.update_data = update_data

        function update() {
            // block_queue_serverPast.update({
            //   time: {
            //     current_time: {date: new Date(shared.data.server.time_information.time_now_sec), time: Number(shared.data.server.time_information.time_now_sec)},
            //     start_time_sec: {date: new Date(shared.data.server.time_information.night_start_sec), time: Number(shared.data.server.time_information.night_start_sec)},
            //     end_time_sec: {date: new Date(shared.data.server.time_information.night_end_sec), time: Number(shared.data.server.time_information.night_end_sec)}
            //   }
            // })
        }
        this.update = update
    }
    let Svg_blocks_queue_server = function() {
        let reserved = {
        }
        function init_data() {
            let adjustedBox = {
                x: box.block_queue_server.x,
                y: box.block_queue_server.y,
                w: box.block_queue_server.w,
                h: box.block_queue_server.h,
                marg: svg_dims.w[0] * 0.01,
            }
            let overlay = svg.g.append('g')
                .attr('transform', 'translate(' + (adjustedBox.x) + ',' + adjustedBox.y + ')')
                .style('opacity', 0.3)
                .style('pointer-events', 'auto')
            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
                .style('opacity', 1)
                .style('pointer-events', 'auto')

            blockQueueOverlay = new BlockDisplayer({
                main: {
                    tag: 'blockQueueOverlayControllerTag',
                    g: overlay,
                    scroll: {
                    },
                    box: adjustedBox,
                    background: {
                        fill: 'none',
                        stroke: color_theme.medium.stroke,
                        strokeWidth: 0.4,
                    },
                    color_theme: color_theme,
                },

                displayer: 'blockQueue2', // 'blockQueue2',
                blockQueue: {
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
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
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
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
                                y: adjustedBox.h * 0.6,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.6,
                                marg: adjustedBox.marg,
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
                                y: adjustedBox.h * 0.0,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.33,
                                marg: adjustedBox.marg,
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
                                y: adjustedBox.h * 0.5,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.47,
                                marg: adjustedBox.marg,
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
                        colorPalette: color_theme.blocks,
                    },
                    timeBars: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h * 0.025,
                            w: adjustedBox.w,
                            h: adjustedBox.h * 0.975,
                            marg: adjustedBox.marg,
                        },
                    },
                },
                blockQueue2: {
                    g: undefined,
                    sched_blocks: {
                        label: {
                            enabled: false,
                            position: 'left',
                            clickable: true,
                            size: (svg_dims.w[0] * 0.65 - adjustedBox.w),
                        },
                        layout: undefined,
                    },
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        showAxis: false,
                        orientation: 'axisTop',
                        attr: {
                            text: {
                                size: 10,
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                        },
                    },
                    timeBars: {
                        enabled: false,
                        g: undefined,
                        box: {
                            x: 0,
                            y: -adjustedBox.h,
                            w: adjustedBox.w,
                            h: adjustedBox.h * 4,
                            marg: adjustedBox.marg,
                        },
                    },
                },

                filters: {
                    blockFilters: [],
                    filtering: [],
                },
                time: {
                    current_time: {
                        time: 0,
                        date: undefined,
                    },
                    start_time_sec: {
                        time: 0,
                        date: undefined,
                    },
                    end_time_sec: {
                        time: 0,
                        date: undefined,
                    },
                },
                data: {
                    raw: undefined,
                    formated: undefined,
                    modified: undefined,
                },
                debug: {
                    enabled: false,
                },
                pattern: {
                },
                events: {
                },
                input: {
                    focus: {
                        sched_blocks: [],
                        blocks: [],
                    },
                    over: {
                        sched_blocks: [],
                        blocks: [],
                    },
                    selection: [],
                },
            })
            blockQueueOverlay.init()

            blockQueue = new BlockDisplayer({
                main: {
                    tag: 'blockQueueControllerTag',
                    g: reserved.g,
                    scroll: {
                    },
                    box: adjustedBox,
                    background: {
                        fill: 'none',
                        stroke: color_theme.medium.stroke,
                        strokeWidth: 0.0,
                    },
                    color_theme: color_theme,
                },

                displayer: 'blockQueue2', // 'blockQueue2',
                blockQueue: {
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
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
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
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
                                y: adjustedBox.h * 0.6,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.6,
                                marg: adjustedBox.marg,
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
                                y: adjustedBox.h * 0.0,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.33,
                                marg: adjustedBox.marg,
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
                                y: adjustedBox.h * 0.5,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.47,
                                marg: adjustedBox.marg,
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
                        colorPalette: color_theme.blocks,
                    },
                    timeBars: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h * 0.025,
                            w: adjustedBox.w,
                            h: adjustedBox.h * 0.975,
                            marg: adjustedBox.marg,
                        },
                    },
                },
                blockQueue2: {
                    g: undefined,
                    sched_blocks: {
                        label: {
                            enabled: true,
                            position: 'left',
                            clickable: true,
                            size: (svg_dims.w[0] * 0.53 - adjustedBox.w),
                        },
                    },
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        showAxis: true,
                        orientation: 'axisTop',
                        attr: {
                            text: {
                                size: 10,
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                        },
                    },
                    timeBars: {
                        enabled: false,
                        g: undefined,
                        box: {
                            x: 0,
                            y: -adjustedBox.y,
                            w: adjustedBox.w,
                            h: box.topBox.h + box.event_queue_server.h,
                            marg: adjustedBox.marg,
                        },
                    },
                },
                blockTrackShrink: {
                    g: undefined,
                    sched_blocks: {
                        label: {
                            enabled: true,
                            position: 'left',
                        },
                    },
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        showText: true,
                        orientation: 'bottom',
                        attr: {
                            text: {
                                size: 14,
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                        },
                    },
                    timeBars: {
                        enabled: false,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h * 0.025,
                            w: adjustedBox.w,
                            h: adjustedBox.h * 0.975,
                            marg: adjustedBox.marg,
                        },
                    },
                },
                blockList: {

                },
                blockForm: {
                    mosaic: {
                        box: {
                            x: 0,
                            y: 0,
                            w: adjustedBox.w * 0.2,
                            h: adjustedBox.h,
                            marg: adjustedBox.marg,
                        },
                        order: 'n_sched',
                    },
                    forms: {
                        g: undefined,
                        box: {
                            x: adjustedBox.w * 0.22,
                            y: adjustedBox.h * 0.02,
                            w: adjustedBox.w * 0.78 - adjustedBox.h * 0.02,
                            h: adjustedBox.h * 0.96,
                            marg: adjustedBox.marg,
                        },
                        display: 'list',
                        scroll: {
                        },
                    },
                },

                filters: {
                    blockFilters: [],
                    filtering: [],
                },
                time: {
                    current_time: {
                        time: 0,
                        date: undefined,
                    },
                    start_time_sec: {
                        time: 0,
                        date: undefined,
                    },
                    end_time_sec: {
                        time: 0,
                        date: undefined,
                    },
                },
                data: {
                    raw: undefined,
                    formated: undefined,
                    modified: undefined,
                },
                debug: {
                    enabled: false,
                },
                pattern: {
                },
                events: {
                    block: {
                        click: d => focusManager.focusOn('block', d.obs_block_id),
                        dbclick: function(d) {
                            // d.exe_state.state = 'cancel'
                            // changeBlockProperties(d, false, 'state')
                        },
                        mouseover: focusManager.over,
                        mouseout: focusManager.out,
                        drag: {
                            start: svgFocusOverlay.dragStart,
                            tick: svgFocusOverlay.dragTick,
                            end: function(e, d) {
                                let res = svgFocusOverlay.dragEnd(e, d)
                                if (res) {
                                    changeBlockProperties(d, false, 'start_time_sec')
                                }
                            },
                        },
                    },
                    sched: {
                        click: focusManager.focusOn,
                        mouseover: focusManager.over,
                        mouseout: focusManager.out,
                    },
                },
                input: {
                    focus: {
                        sched_blocks: [],
                        blocks: [],
                    },
                    over: {
                        sched_blocks: [],
                        blocks: [],
                    },
                    selection: [],
                },
            })
            blockQueue.init()
            blockQueue.switchStyle({
                runRecCol: color_theme.blocks.shutdown,
                blockCol: function(opt_in) {
                    let state = is_def(opt_in.state)
                        ? opt_in.state
                        : opt_in.d.exe_state.state
                    let can_run = is_def(opt_in.can_run)
                        ? opt_in.can_run
                        : opt_in.d.exe_state.can_run
                    let modified = opt_in.d.modifications ? opt_in.d.modifications.userModifications.length > 0 : false

                    if (state === 'wait') {
                        if (modified) {
                            return color_theme.blocks.wait
                        }
                        return color_theme.blocks.wait
                    }
                    else if (state === 'done') {
                        return color_theme.blocks.done
                    }
                    else if (state === 'fail') {
                        return color_theme.blocks.fail
                    }
                    else if (state === 'run') {
                        return color_theme.blocks.run
                    }
                    else if (state === 'cancel') {
                        if (is_def(can_run)) {
                            if (!can_run) {
                                return color_theme.blocks.cancelOp
                            }
                        }
                        return color_theme.blocks.cancelSys
                    }
                    else {
                        return color_theme.blocks.shutdown
                    }
                    // let startT = is_def(opt_in.start_time_sec)
                    //   ? opt_in.start_time_sec
                    //   : opt_in.d.start_time_sec
                    // if (startT < shared.data.server.time_information.time_now_sec) return color_theme.blocks.shutdown
                    // let state = is_def(opt_in.state)
                    //   ? opt_in.state
                    //   : opt_in.d.exe_state.state
                    // let can_run = is_def(opt_in.can_run)
                    //   ? opt_in.can_run
                    //   : opt_in.d.exe_state.can_run
                    // let modified = opt_in.d.modifications ? opt_in.d.modifications.userModifications.length > 0 : false
                    //
                    // if (state === 'wait') {
                    //   if (modified) return color_theme.blocks.wait
                    //   return color_theme.blocks.wait
                    // } else if (state === 'cancel') {
                    //   if (is_def(can_run)) {
                    //     if (!can_run) return color_theme.blocks.cancelOp
                    //   }
                    //   return color_theme.blocks.cancelSys
                    // } else return color_theme.blocks.shutdown
                },
                blockOpac: function(opt_in) {
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
                },
                blockPattern: function(opt_in) {
                    let startT = is_def(opt_in.start_time_sec)
                        ? opt_in.start_time_sec
                        : opt_in.d.start_time_sec
                    if (startT < shared.data.server.time_information.time_now_sec) {
                        return 'url(#patternLock)'
                    }
                    return 'none'
                },
            })

            reserved.g.append('rect')
                .attr('id', 'cloak')
                .attr('x', 0)
                .attr('y', -adjustedBox.y)
                .attr('width', 0)
                .attr('height', box.topBox.h)
                .attr('fill', color_theme.darker.stroke)
                .attr('stroke', 'none')
                .style('opacity', 0.2)
                .style('pointer-events', 'none')
        }
        this.init_data = init_data

        function blurry() {
            reserved.g.style('opacity', 0.1)
        }
        this.blurry = blurry
        function focus() {
            reserved.g.style('opacity', 1)
        }
        this.focus = focus

        function update_data() {
            let tel_ids = []
            $.each(shared.data.server.inst_health, function(index, data_now) {
                tel_ids.push(data_now.id)
            })

            let axisTop = brushZoom.get_domain().focus
            let newWidth = brushZoom.get_axis().scale(new Date(shared.data.server.time_information.time_now_sec))
            if (newWidth < 0) {
                newWidth = 0
            }
            if (newWidth > box.block_queue_server.w) {
                newWidth = box.block_queue_server.w
            }
            reserved.g.select('rect#cloak').attr('width', newWidth)

            let current_time = {
                date: new Date(shared.data.server.time_information.time_now_sec),
                time: shared.data.server.time_information.time_now_sec,
            }
            let start_time_sec = {
                date: new Date(shared.data.server.time_information.night_start_sec),
                time: Number(axisTop[0]),
            }
            let end_time_sec = {
                date: new Date(shared.data.server.time_information.night_end_sec),
                time: Number(axisTop[1]),
            }
            blockQueue.update_data({
                time: {
                    current_time: current_time,
                    start_time_sec: start_time_sec,
                    end_time_sec: end_time_sec,
                },
                data: {
                    raw: {
                        blocks: get_blocksData(),
                        tel_ids: tel_ids,
                    },
                    modified: [],
                },
            })
            blockQueueOverlay.set_line_layout(blockQueue.get_line_layout())
            blockQueueOverlay.update_data({
                time: {
                    current_time: current_time,
                    start_time_sec: start_time_sec,
                    end_time_sec: end_time_sec,
                },
                data: {
                    raw: {
                        blocks: get_blocksData('server'),
                        tel_ids: tel_ids,
                    },
                    modified: [],
                },
            })
        }
        this.update_data = update_data

        function update() {
            let axisTop = brushZoom.get_domain().focus
            let current_time = {
                date: new Date(shared.data.server.time_information.time_now_sec),
                time: shared.data.server.time_information.time_now_sec,
            }
            let start_time_sec = {
                date: axisTop[0],
                time: shared.data.server.time_information.night_start_sec,
            }
            let end_time_sec = {
                date: axisTop[1],
                time: shared.data.server.time_information.night_end_sec,
            }

            blockQueueOverlay.update({
                time: {
                    current_time: current_time,
                    start_time_sec: start_time_sec,
                    end_time_sec: end_time_sec,
                },
            })
            blockQueue.update({
                time: {
                    current_time: current_time,
                    start_time_sec: start_time_sec,
                    end_time_sec: end_time_sec,
                },
            })
        }
        this.update = update
    }
    let SvgBrush = function() {
        let reserved = {
        }
        function init_data() {
            let brushBox = {
                x: box.brushZoom.x,
                y: box.brushZoom.y,
                w: box.brushZoom.w,
                h: box.brushZoom.h,
                marg: svg_dims.w[0] * 0.01,
            }
            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + brushBox.x + ',' + brushBox.y + ')')
            reserved.g.append('rect')
                .attr('x', 0)
                .attr('y', -brushBox.h * 0.6)
                .attr('width', brushBox.w)
                .attr('height', brushBox.h * 0.7)
                .attr('fill', colorPalette.darkest.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0) // 1.6)
                .attr('stroke-dasharray', [ 0, brushBox.w, brushBox.h * 0.7, brushBox.w, brushBox.h * 0.7 ])

            brushZoom = new PlotBrushZoom()
            brushZoom.init({
                main: {
                    g: reserved.g,
                    box: brushBox,
                    id: 'brush',
                    drawing: 'time',
                    profile: 'context',
                    location: 'bottom',
                },
                interaction: {
                    wheel: {
                        default: {
                            type: 'zoom',
                            end: () => {
                                svg_blocks_queue_server.update_data()
                                svg_events_queue_server.update_data()
                                svgTargets.update_data()
                                svgTelsConflict.update()
                                svgFocusOverlay.update()
                            },
                        },
                        shiftKey: {
                            type: 'scroll',
                            end: () => {
                            },
                        },
                    },
                    drag: {
                        default: {
                            type: 'drag_trans',
                            start: () => {
                            },
                            drag: () => {
                                svg_blocks_queue_server.update_data()
                                svg_events_queue_server.update_data()
                                svgTargets.update_data()
                                svgTelsConflict.update()
                                svgFocusOverlay.update()
                            },
                            end: () => {
                            },
                        },
                    },
                },
            })
        }
        this.init_data = init_data

        function blurry() {
            reserved.g.style('opacity', 0.1)
        }
        this.blurry = blurry
        function focus() {
            reserved.g.style('opacity', 1)
        }
        this.focus = focus

        function translateTo(x, y) {
            reserved.g.attr('transform', 'translate(' + x + ',' + y + ')')
        }
        this.translateTo = translateTo

        function update_data() {
            let start_time_sec = {
                date: shared.data.server.time_information.night_start_sec,
                time: shared.data.server.time_information.night_start_sec,
            }
            let end_time_sec = {
                date: shared.data.server.time_information.night_end_sec,
                time: shared.data.server.time_information.night_end_sec,
            }

            brushZoom.update_domain([ start_time_sec.date, end_time_sec.date ])
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let SvgTargets = function() {
        let reserved = {
        }
        reserved.drag = {
        }
        function init_clipping() {
            let gBlockBox = svg.g.append('g')
                .attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
            reserved.g = gBlockBox
            // gBlockBox.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', reserved.box.w)
            //   .attr('height', reserved.box.h)
            //   .attr('fill', 'none')
            //   .attr('stroke', '#444444')
            //   .attr('stroke-width', 0.2)
            //   .attr('stroke-dasharray', [0, reserved.box.w, reserved.box.h, reserved.box.w, reserved.box.h])
            // gBlockBox.append('text')
            //   .text('MODIFICATIONS')
            //   .style('fill', color_theme.medium.text)
            //   .style('font-weight', 'bold')
            //   .style('font-size', '8px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(-5,' + (reserved.box.h * 0.5) + ') rotate(270)')
            reserved.clipping = {
            }
            reserved.clipping.g = gBlockBox.append('g')
            reserved.clipping.g.append('defs').append('svg:clipPath')
                .attr('id', 'clipTarget')
                .append('svg:rect')
                .attr('id', 'clip-rect')
                .attr('x', '0')
                .attr('y', '0')
                .attr('width', reserved.box.w)
                .attr('height', reserved.box.h)
            reserved.clipping.clipBody = reserved.clipping.g.append('g')
                .attr('clip-path', 'url(#clipTarget)')
        }
        function init_data() {
            reserved.box = {
                x: box.tools.x,
                y: box.tools.y + box.tools.h * 0.0,
                w: box.tools.w,
                h: box.tools.h * 0.5,
                marg: svg_dims.w[0] * 0.01,
            }
            init_clipping()
        }
        this.init_data = init_data
        function update_data() {
            drawTargets()
        }
        this.update_data = update_data
        function update() {}
        this.update = update

        function blurry() {
            reserved.g.style('opacity', 0.1)
        }
        this.blurry = blurry
        function focus() {
            reserved.g.style('opacity', 1)
        }
        this.focus = focus

        function drawTargets() {
            let axisTop = brushZoom.get_domain().focus
            let start_time_sec = {
                date: axisTop[0],
                time: (new Date(shared.data.server.time_information.night_start_sec).getTime() - axisTop[0]) / -1000,
            }
            let end_time_sec = {
                date: axisTop[1],
                time: (new Date(shared.data.server.time_information.night_start_sec).getTime() - axisTop[1]) / -1000,
            }
            let scaleX = d3.scaleLinear()
                .range([ 0, reserved.box.w ])
                .domain([ start_time_sec.time, end_time_sec.time ])
            let scaleY = d3.scaleLinear()
                .range([ reserved.box.h, reserved.box.h * 0.2 ])
                .domain([ 0, 1 ])
            let lineGenerator = d3.line()
                .x(function(d) {
                    return d.x
                })
                .y(function(d) {
                    return d.y
                })
                .curve(d3.curveNatural)

            let allg = reserved.clipping.clipBody.selectAll('g.target')
                .data(shared.data.server.targets, function(d) {
                    return d.id
                })
            let gEnter = allg.enter()
                .append('g')
                .attr('class', 'target')
            gEnter.each(function(d) {
                let ig = d3.select(this)
                    .style('opacity', function(d) {
                        return 0.4
                    })
                ig.append('path')
                    .attr('d', function() {
                        let targetPoints = [
                            {
                                x: scaleX(d.observability.minimal),
                                y: scaleY(0),
                            },
                            {
                                x: scaleX(d.observability.optimal),
                                y: scaleY(1),
                            },
                            {
                                x: scaleX(d.observability.maximal),
                                y: scaleY(0),
                            },
                        ]
                        return lineGenerator(targetPoints)
                    })
                    .attr('fill', function(d) {
                        // if (block.target_id === d.id) return color_theme.dark.background
                        return 'none'
                    })
                    .attr('stroke', function(d) {
                        // if (block.target_id === d.id) return color_theme.dark.stroke
                        return color_theme.dark.stroke
                    })
                    .attr('stroke-width', function(d) {
                        // if (block.target_id === d.id) return 0.2
                        return 0.4
                    })
                    .attr('stroke-opacity', function(d) {
                        // if (block.target_id === d.id) return 1
                        return 0.4
                    })
                    .attr('fill-opacity', 0.15)
                    .attr('stroke-dasharray', function(d) {
                        // if (block.target_id === d.id) return []
                        return [ 4, 6 ]
                    })
                let tig = ig.append('g')
                    .attr('id', 'target_icon')
                    .attr('transform', 'translate(' + (scaleX((d.observability.minimal + d.observability.maximal) * 0.5) - 10) + ',' + (reserved.box.h - 20) + ')')
                target_icon(tig, {
                    w: 15,
                    h: 15,
                }, get_target_short(d), {
                    click: function() {
                        focusManager.focusOn('target', d.id)
                    },
                    over: function() {
                        ig.style('opacity', 1)
                    },
                    out: function() {
                        ig.style('opacity', 0.4)
                    },
                }, colorPalette)
            })
            // gEnter.append('text')
            //   .text(function (d) {
            //     return d.id
            //   })
            //   .attr('x', function (d) {
            //     let xx = scaleX(d.observability.minimal) + 10
            //     return xx
            //     // return (xx < 0) ? 10 : xx
            //   })
            //   .attr('y', reserved.box.h - 3)
            //   .attr('text-anchor', 'start')
            //   .style('font-size', 10)
            //   .attr('dy', 0)
            //   .style('pointer-events', 'none')
            //   .style('fill', function (d) {
            //     // if (block.target_id === d.id) return color_theme.dark.stroke
            //     return color_theme.dark.stroke
            //   })
            //   .style('fill-opacity', function (d) {
            //     // if (block.target_id === d.id) return 1
            //     return 0.6
            //   })
            let gMerge = allg.merge(gEnter)
            gMerge.each(function(d) {
                let ig = d3.select(this)
                ig.select('path').attr('d', function(d) {
                    let targetPoints = [
                        {
                            x: scaleX(d.observability.minimal),
                            y: scaleY(0),
                        },
                        {
                            x: scaleX(d.observability.optimal),
                            y: scaleY(1),
                        },
                        {
                            x: scaleX(d.observability.maximal),
                            y: scaleY(0),
                        },
                    ]
                    return lineGenerator(targetPoints)
                })
                ig.select('g#target_icon')
                    .attr('transform', 'translate(' + (scaleX((d.observability.minimal + d.observability.maximal) * 0.5) - 10) + ',' + (reserved.box.h - 14) + ')')
            })
        }
        function showPercentTarget(block) {
            reserved.clipping.clipBody.select('text.percentStart').remove()
            reserved.clipping.clipBody.select('text.percentEnd').remove()

            if (!block.target_id) {
                return
            }
            let target = reserved.clipping.clipBody.selectAll('g.target')
                .filter(function(d) {
                    return (block.target_id === d.id)
                }).select('path')._groups[0][0]
            let scaleX = d3.scaleLinear()
                .range([ 0, reserved.box.w ])
                .domain([ Number(shared.data.server.time_information.night_start_sec), Number(shared.data.server.time_information.night_end_sec) ])
            function dichotomiePath(targetedX, start, end, path, precision, step, maxStack) {
                if (step > maxStack) {
                    return {
                        x: -1,
                        y: -1,
                    }
                }
                let middle = (end + start) * 0.5
                let point = path.getPointAtLength(middle)
                if (Math.abs(point.x - targetedX) < precision) {
                    return point
                }
                if (point.x > targetedX) {
                    return dichotomiePath(targetedX, start, middle, path, precision, step + 1, maxStack)
                }
                if (point.x < targetedX) {
                    return dichotomiePath(targetedX, middle, end, path, precision, step + 1, maxStack)
                }
            }
            let scaleY = d3.scaleLinear()
                .range([ reserved.box.h, reserved.box.h * 0.2 ])
                .domain([ 0, 1 ])
            let projBlockStart = {
                x: scaleX(block.time.start),
                y: -1,
            }

            if (projBlockStart.x < target.getPointAtLength(0).x || projBlockStart.x > target.getPointAtLength(target.getTotalLength()).x) {
                projBlockStart.y = scaleY(0)
                reserved.clipping.clipBody.append('text')
                    .attr('class', 'percentStart')
                    .text(function(d) {
                        return '0.00%'
                    })
                    .attr('x', projBlockStart.x - 5)
                    .attr('y', projBlockStart.y - 5)
                    .attr('text-anchor', 'end')
                    .style('font-size', 8)
                    .attr('dy', 0)
                    .style('font-weight', 'bold')
                    .style('pointer-events', 'none')
                    .style('fill', color_theme.dark.stroke)
                    .style('fill-opacity', 1)
            }
            else {
                projBlockStart = dichotomiePath(projBlockStart.x, 0, target.getTotalLength(), target, 0.1, 0, 30)
                reserved.clipping.clipBody.append('text')
                    .attr('class', 'percentStart')
                    .text(function(d) {
                        return (scaleY.invert(projBlockStart.y) * 100).toFixed(2) + '%'
                    })
                    .attr('x', projBlockStart.x - 5)
                    .attr('y', projBlockStart.y - 5)
                    .attr('text-anchor', 'end')
                    .style('font-size', 8)
                    .attr('dy', 0)
                    .style('font-weight', 'bold')
                    .style('pointer-events', 'none')
                    .style('fill', color_theme.dark.stroke)
                    .style('fill-opacity', 1)
            }

            let projBlockEnd = {
                x: scaleX(block.time.end),
                y: -1,
            }
            if (projBlockEnd.x < target.getPointAtLength(0).x || projBlockEnd.x > target.getPointAtLength(target.getTotalLength()).x) {
                projBlockEnd.y = scaleY(0)
                reserved.clipping.clipBody.append('text')
                    .attr('class', 'percentEnd')
                    .text(function(d) {
                        return '0.00%'
                    })
                    .attr('x', projBlockEnd.x + 5)
                    .attr('y', projBlockEnd.y - 5)
                    .attr('text-anchor', 'start')
                    .style('font-size', 8)
                    .attr('dy', 0)
                    .style('font-weight', 'bold')
                    .style('pointer-events', 'none')
                    .style('fill', color_theme.dark.stroke)
                    .style('fill-opacity', 1)
            }
            else {
                projBlockEnd = dichotomiePath(projBlockEnd.x, 0, target.getTotalLength(), target, 0.1, 0, 30)
                reserved.clipping.clipBody.append('text')
                    .attr('class', 'percentEnd')
                    .text(function(d) {
                        return (scaleY.invert(projBlockEnd.y) * 100).toFixed(2) + '%'
                    })
                    .attr('x', projBlockEnd.x + 5)
                    .attr('y', projBlockEnd.y - 5)
                    .attr('text-anchor', 'start')
                    .style('font-size', 8)
                    .attr('dy', 0)
                    .style('font-weight', 'bold')
                    .style('pointer-events', 'none')
                    .style('fill', color_theme.dark.stroke)
                    .style('fill-opacity', 1)
            }
        }
        this.showPercentTarget = showPercentTarget
        function highlightTarget(block) {
            if (!block) {
                return
            }
            let tarG = reserved.clipping.clipBody.selectAll('g.target')
                .filter(function(d) {
                    for (let i = 0; i < block.targets.length; i++) {
                        if (block.targets[i].id === d.id) {
                            return true
                        }
                    }
                    return false
                })
            tarG.style('opacity', function(d) {
                return 1
            })
            tarG.select('path')
                .attr('fill', color_theme.dark.background)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.8)
                .attr('stroke-opacity', 1)
                .attr('stroke-dasharray', [])
            showPercentTarget(block)
        }
        this.highlightTarget = highlightTarget
        function unhighlightTarget(block) {
            if (!block) {
                return
            }
            reserved.clipping.clipBody.selectAll('text.percentStart').remove()
            reserved.clipping.clipBody.selectAll('text.percentEnd').remove()
            let tarG = reserved.clipping.clipBody.selectAll('g.target')
                .filter(function(d) {
                    for (let i = 0; i < block.targets.length; i++) {
                        if (block.targets[i].id === d.id) {
                            return true
                        }
                    }
                    return false
                })
            tarG.style('opacity', 0.4)
            tarG.select('path')
                .attr('fill', 'none')
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.4)
                .attr('stroke-opacity', 0.4)
                .attr('fill-opacity', 0.15)
                .attr('stroke-dasharray', [ 4, 6 ])
            // tarG.select('text')
            //   .style('fill', color_theme.dark.stroke)
            //   .style('fill-opacity', 0.3)
        }
        this.unhighlightTarget = unhighlightTarget
    }

    let SvgTelsConflict = function() {
        let reserved = {
        }
        reserved.drag = {
        }
        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_clipping() {
            reserved.clipping = {
            }
            reserved.clipping.g = svg.g.append('g')
                .attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
            reserved.clipping.g.append('defs').append('svg:clipPath')
                .attr('id', 'clip')
                .append('svg:rect')
                .attr('id', 'clip-rect')
                .attr('x', '0')
                .attr('y', '0')
                .attr('width', reserved.box.w)
                .attr('height', reserved.box.h)
            reserved.clipping.clipBody = reserved.clipping.g.append('g')
                .attr('clip-path', 'url(#clip)')
        }
        function init_data() {
            reserved.box = {
                x: box.tools.x,
                y: box.tools.y + box.tools.h * 0.5,
                w: box.tools.w,
                h: box.tools.h * 0.5,
                marg: svg_dims.w[0] * 0.01,
            }
            init_clipping()
            // gBlockBox.append('text')
            //   .text('MODIFICATIONS')
            //   .style('fill', color_theme.medium.text)
            //   .style('font-weight', 'bold')
            //   .style('font-size', '8px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(-5,' + (reserved.box.h * 0.5) + ') rotate(270)')

            reserved.gTargets = reserved.clipping.clipBody.append('g')

            let range = reserved.box.h * 0.33333

            reserved.clipping.g.append('text')
                .text('L')
                .style('fill', color_theme.dark.stroke)
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (-10) + ',' + (range * 0.5 + 5) + ')')
            reserved.clipping.g.append('text')
                .text('M')
                .style('fill', color_theme.dark.stroke)
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (-10) + ',' + (range * 1.5 + 5) + ')')
            reserved.clipping.g.append('text')
                .text('S')
                .style('fill', color_theme.dark.stroke)
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (-10) + ',' + (range * 2.5 + 5) + ')')

            reserved.gTargets.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', reserved.box.w)
                .attr('height', range)
                .attr('fill', color_theme.dark.background)
                .attr('fill-opacity', 0.55)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.5)
            reserved.gTargets.append('rect')
                .attr('x', 0)
                .attr('y', range * 1)
                .attr('width', reserved.box.w)
                .attr('height', range)
                .attr('fill', color_theme.medium.background)
                .attr('fill-opacity', 0.55)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.5)
            reserved.gTargets.append('rect')
                .attr('x', 0)
                .attr('y', range * 2)
                .attr('width', reserved.box.w)
                .attr('height', range)
                .attr('fill', color_theme.dark.background)
                .attr('fill-opacity', 0.55)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.5)
        }
        this.init_data = init_data
        function update_data() {
            // drawTelsAvailabilityCurve()
        }
        this.update_data = update_data
        function update() {
            drawTelsAvailabilityCurve()
            // linkConflicts()
        }
        this.update = update

        function blurry() {
            reserved.g.style('opacity', 0.1)
        }
        this.blurry = blurry
        function focus() {
            reserved.g.style('opacity', 1)
        }
        this.focus = focus

        function drawTelsAvailabilityCurve(block) {
            function mouseHover(g, d, type) {
                // let nb = {x: Number(g.select('rect#' + type + 'min').attr('x')),
                //   y: Number(g.select('rect#' + type + 'min').attr('y')),
                //   w: Number(g.select('rect#' + type + 'min').attr('width')),
                //   h: Number(g.select('rect#' + type + 'min').attr('height'))
                // }
                let color = d3.color(g.select('rect#' + type + 'min').attr('fill')).darker(1).darker(1)
                g.select('rect#' + type + 'min')
                    .attr('fill', color)
                // .attr('x', nb.x + 2)
                // .attr('y', nb.y + 2)
                // .attr('width', nb.w - 4)
                // .attr('height', nb.h - 4)
                // .attr('stroke', '#000000')
                // .attr('stroke-width', 4)

                let coloru = d3.color(g.select('rect#' + type + 'used').attr('fill')).darker(1).darker(1)
                g.select('rect#' + type + 'used')
                    .attr('fill', coloru)

                let dim = {
                    w: 30,
                    h: 30,
                    marg: 1,
                }
                let middleoffset = scaleX(d.end) + scaleX(d.start)
                let finaloffset = ((middleoffset - ((dim.w + dim.marg) * d.blocks.length) + dim.marg) * 0.5)
                if (finaloffset < 0) {
                    finaloffset = 10
                }
                if ((finaloffset + ((dim.w + dim.marg) * d.blocks.length) - dim.marg) > reserved.box.w) {
                    finaloffset = -10 + reserved.box.w - (((dim.w + dim.marg) * d.blocks.length) - dim.marg)
                }
                let inngerg = reserved.clipping.g.append('g')
                    .attr('id', 'innerg' + d.id)
                    .attr('transform', 'translate(' + finaloffset + ',0)')
                for (let i = 0; i < d.blocks.length; i++) {
                    let b = getBlockById(get_blocksData(), d.blocks[i]).data
                    let bcolor = blockStyle(b)
                    let txt_size = 8
                    inngerg.append('rect')
                        .attr('x', i * (dim.w + dim.marg))
                        .attr('y', -dim.h)
                        .attr('width', dim.w)
                        .attr('height', dim.h)
                        .attr('fill', bcolor.color.background)
                        .attr('stroke', bcolor.color.stroke)
                        .attr('stroke-width', 0.2)
                    inngerg.append('text')
                        .text(function() {
                            return b.metadata.block_name
                        })
                        .attr('x', i * (dim.w + dim.marg) + dim.w * 0.5)
                        .attr('y', -dim.h + txt_size * 1.2) // - Number(reserved.drag.oldRect.attr('height')))
                        .style('font-weight', '')
                        .style('fill', '#000000')
                        .style('stroke-width', 0.3)
                        .attr('vector-effect', 'non-scaling-stroke')
                        .style('pointer-events', 'none')
                        .style('stroke', 'none')
                        .attr('text-anchor', 'middle')
                        .style('font-size', txt_size + 'px')
                    inngerg.append('text')
                        .text(function() {
                            return b.telescopes[type].ids.length + '/' + b.telescopes[type].min
                        })
                        .attr('x', i * (dim.w + dim.marg) + dim.w * 0.5)
                        .attr('y', -dim.h + txt_size * 2.8) // - Number(reserved.drag.oldRect.attr('height')))
                        .style('font-weight', '')
                        .style('fill', '#000000')
                        .style('stroke-width', 0.3)
                        .attr('vector-effect', 'non-scaling-stroke')
                        .style('pointer-events', 'none')
                        .style('stroke', 'none')
                        .attr('text-anchor', 'middle')
                        .style('font-size', txt_size + 'px')
                    // inngerg.append('text')
                    //   .text(function () {
                    //     return b.telescopes.medium.ids.length + '/' + b.telescopes.medium.min
                    //   })
                    //   .attr('x', i * (dim.w + dim.marg) + dim.w * 0.5)
                    //   .attr('y', -dim.h + txt_size * 3.6) // - Number(reserved.drag.oldRect.attr('height')))
                    //   .style('font-weight', '')
                    //   .style('fill', '#000000')
                    //   .style('stroke-width', 0.3)
                    //   .attr('vector-effect', 'non-scaling-stroke')
                    //   .style('pointer-events', 'none')
                    //   .style('stroke', 'none')
                    //   .attr('text-anchor', 'middle')
                    //   .style('font-size', txt_size + 'px')
                    // inngerg.append('text')
                    //   .text(function () {
                    //     return b.telescopes.small.ids.length + '/' + b.telescopes.small.min
                    //   })
                    //   .attr('x', i * (dim.w + dim.marg) + dim.w * 0.5)
                    //   .attr('y', -dim.h + txt_size * 4.8) // - Number(reserved.drag.oldRect.attr('height')))
                    //   .style('font-weight', '')
                    //   .style('fill', '#000000')
                    //   .style('stroke-width', 0.3)
                    //   .attr('vector-effect', 'non-scaling-stroke')
                    //   .style('pointer-events', 'none')
                    //   .style('stroke', 'none')
                    //   .attr('text-anchor', 'middle')
                    //   .style('font-size', txt_size + 'px')
                }
            }
            function mouseOut(g, d, type) {
                let color = d3.color(g.select('rect#' + type + 'min').attr('fill')).brighter(1).brighter(1)
                g.select('rect#' + type + 'min')
                    .attr('fill', color)
                let coloru = d3.color(g.select('rect#' + type + 'used').attr('fill')).brighter(1).brighter(1)
                g.select('rect#' + type + 'used')
                    .attr('fill', coloru)
                reserved.clipping.g.select('g#innerg' + d.id).remove()
            }

            let curve = computeTelsCurve(block)
            conflictSquare = []

            let axisTop = brushZoom.get_domain().focus
            let start_time_sec = {
                date: axisTop[0],
                time: axisTop[0],
            }
            let end_time_sec = {
                date: axisTop[1],
                time: axisTop[1],
            }
            let scaleX = d3.scaleLinear()
                .range([ 0, reserved.box.w ])
                .domain([ start_time_sec.time, end_time_sec.time ])
            let range = reserved.box.h * 0.33333
            let scaleYSmall = d3.scaleLinear()
                .range([ 0, range ])
                .domain([ 0, 70 ])
            let scaleYMedium = d3.scaleLinear()
                .range([ 0, range ])
                .domain([ 0, 25 ])
            let scaleYLarge = d3.scaleLinear()
                .range([ 0, range ])
                .domain([ 0, 4 ])
            let allg = reserved.gTargets.selectAll('g.telsCurve')
                .data(curve, function(d, i) {
                    return d.id
                })
            let gEnter = allg.enter()
                .append('g')
                .attr('id', d => d.id)
                .attr('class', 'telsCurve')
            // gEnter.append('rect').attr('class', 'hover')

            // gEnter.append('rect').attr('id', 'hoversmall')
            gEnter.append('rect').attr('id', 'smallused')
            gEnter.append('rect').attr('id', 'smallmin')

            // gEnter.append('rect').attr('id', 'hovermedium')
            gEnter.append('rect').attr('id', 'mediumused')
            gEnter.append('rect').attr('id', 'mediummin')

            // gEnter.append('rect').attr('id', 'hoverlarge')
            gEnter.append('rect').attr('id', 'largeused')
            gEnter.append('rect').attr('id', 'largemin')

            let gMerge = allg.merge(gEnter)

            // gMerge.select('rect#hoversmall')
            //   .attr('x', function (d) { return scaleX(d.start) })
            //   .attr('y', range * 2)
            //   .attr('fill', colorPalette.darker.stroke)
            //   .style('opacity', 0)
            //   .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
            //   .attr('height', range)
            //   .on('mouseover', function (d) {
            //     mouseHover(d3.select(this), d, 'small')
            //   })
            //   .on('mouseout', function (d) {
            //     mouseOut(d3.select(this), d, 'small')
            //   })
            gMerge.select('rect#smallused')
                .attr('x', function(d) {
                    return scaleX(d.start)
                })
                .attr('y', function(d) {
                    let height = Math.abs(scaleYSmall(d.smallTels.used))
                    if (d.smallTels.used >= scaleYSmall.domain()[1]) {
                        height = range
                    }
                    if (d.smallTels.used <= scaleYSmall.domain()[0]) {
                        height = 0
                    }
                    return range * 3 - height
                })
                .attr('width', function(d) {
                    return scaleX(d.end) - scaleX(d.start)
                })
                .attr('fill', function(d, i) {
                    return '#43A047'
                })
                .attr('height', function(d) {
                    let height = Math.abs(scaleYSmall(d.smallTels.used))
                    if (d.smallTels.used >= scaleYSmall.domain()[1]) {
                        height = range
                    }
                    if (d.smallTels.used <= scaleYSmall.domain()[0]) {
                        height = 0
                    }
                    return height
                })
                .attr('stroke', function(d) {
                    return color_theme.dark.stroke
                })
                .attr('stroke-width', function(d) {
                    return 0
                })
                .attr('stroke-opacity', function(d) {
                    return 1
                })
                .attr('fill-opacity', 0.6)
                .on('mouseover', function(e, d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'small')
                })
                .on('mouseout', function(e, d) {
                    mouseOut(d3.select(d3.select(this).node().parentNode), d, 'small')
                })
            gMerge.select('rect#smallmin')
                .attr('x', function(d) {
                    return scaleX(d.start)
                })
                .attr('y', function(d) {
                    let height = Math.abs(scaleYSmall(d.smallTels.min))
                    if (d.smallTels.min >= scaleYSmall.domain()[1]) {
                        height = range
                    }
                    if (d.smallTels.min <= scaleYSmall.domain()[0]) {
                        height = 0
                    }
                    return range * 3 - height
                })
                .attr('width', function(d) {
                    return scaleX(d.end) - scaleX(d.start)
                })
                .attr('fill', function(d, i) {
                    if (d.smallTels.min > scaleYSmall.domain()[1] || d.smallTels.used < d.smallTels.min) {
                        return '#FF5722'
                    }
                    return '#444444'
                })
                .attr('height', function(d) {
                    let height = Math.abs(scaleYSmall(d.smallTels.min))
                    if (d.smallTels.min >= scaleYSmall.domain()[1]) {
                        height = range
                    }
                    if (d.smallTels.min <= scaleYSmall.domain()[0]) {
                        height = 0
                    }
                    return height
                })
                .attr('stroke', function(d) {
                    return color_theme.dark.stroke
                })
                .attr('stroke-width', function(d) {
                    return 0
                })
                .attr('stroke-opacity', function(d) {
                    return 1
                })
                .attr('fill-opacity', 0.6)
                .on('mouseover', function(e, d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'small')
                })
                .on('mouseout', function(e, d) {
                    mouseOut(d3.select(d3.select(this).node().parentNode), d, 'small')
                })
                .each(function(d) {
                    if (d.smallTels.min < scaleYSmall.domain()[0] || d.smallTels.used > d.smallTels.min) {
                        conflictSquare.push({
                            d3: d3.select(this),
                            d: d,
                        })
                    }
                })

            // gMerge.select('rect#hovermedium')
            //   .attr('x', function (d) { return scaleX(d.start) })
            //   .attr('y', range)
            //   .attr('fill', colorPalette.darker.stroke)
            //   .style('opacity', 0)
            //   .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
            //   .attr('height', range)
            //   .on('mouseover', function (d) {
            //     mouseHover(d3.select(d3.select(this).node().parentNode), d, 'medium')
            //   })
            //   .on('mouseout', function (d) {
            //     mouseOut(d3.select(d3.select(this).node().parentNode), d, 'medium')
            //   })
            gMerge.select('rect#mediumused')
                .attr('x', function(d) {
                    return scaleX(d.start)
                })
                .attr('y', function(d) {
                    let height = Math.abs(scaleYMedium(d.mediumTels.used))
                    if (d.mediumTels.used >= scaleYMedium.domain()[1]) {
                        height = range
                    }
                    if (d.mediumTels.used <= scaleYMedium.domain()[0]) {
                        height = 0
                    }
                    return range * 2 - height
                })
                .attr('fill', function(d, i) {
                    return '#43A047'
                })
                .attr('width', function(d) {
                    return scaleX(d.end) - scaleX(d.start)
                })
                .attr('height', function(d) {
                    let height = Math.abs(scaleYMedium(d.mediumTels.used))
                    if (d.mediumTels.used >= scaleYMedium.domain()[1]) {
                        height = range
                    }
                    if (d.mediumTels.used <= scaleYMedium.domain()[0]) {
                        height = 0
                    }
                    return height
                })
                .attr('stroke', function(d) {
                    return color_theme.dark.stroke
                })
                .attr('stroke-width', function(d) {
                    return 0
                })
                .attr('stroke-opacity', function(d) {
                    return 1
                })
                .attr('fill-opacity', 0.6)
                .on('mouseover', function(e, d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'medium')
                })
                .on('mouseout', function(e, d) {
                    mouseOut(d3.select(d3.select(this).node().parentNode), d, 'medium')
                })
            gMerge.select('rect#mediummin')
                .attr('x', function(d) {
                    return scaleX(d.start)
                })
                .attr('y', function(d) {
                    let height = Math.abs(scaleYMedium(d.mediumTels.min))
                    if (d.mediumTels.min >= scaleYMedium.domain()[1]) {
                        height = range
                    }
                    if (d.mediumTels.min <= scaleYMedium.domain()[0]) {
                        height = 0
                    }
                    return range * 2 - height
                })
                .attr('fill', function(d, i) {
                    if (d.mediumTels.min > scaleYMedium.domain()[1] || d.mediumTels.used < d.mediumTels.min) {
                        return '#FF5722'
                    }
                    return '#444444'
                })
                .attr('width', function(d) {
                    return scaleX(d.end) - scaleX(d.start)
                })
                .attr('height', function(d) {
                    let height = Math.abs(scaleYMedium(d.mediumTels.min))
                    if (d.mediumTels.min >= scaleYMedium.domain()[1]) {
                        height = range
                    }
                    if (d.mediumTels.min <= scaleYMedium.domain()[0]) {
                        height = 0
                    }
                    return height
                })
                .attr('stroke', function(d) {
                    return color_theme.dark.stroke
                })
                .attr('stroke-width', function(d) {
                    return 0
                })
                .attr('stroke-opacity', function(d) {
                    return 1
                })
                .attr('fill-opacity', 0.6)
                .on('mouseover', function(e, d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'medium')
                })
                .on('mouseout', function(e, d) {
                    mouseOut(d3.select(d3.select(this).node().parentNode), d, 'medium')
                })
                .each(function(d) {
                    if (d.mediumTels.min < scaleYMedium.domain()[0] || d.mediumTels.used > d.mediumTels.min) {
                        conflictSquare.push({
                            d3: d3.select(this),
                            d: d,
                        })
                    }
                })

            // gMerge.select('rect#hoverlarge')
            //   .attr('x', function (d) { return scaleX(d.start) })
            //   .attr('y', 0)
            //   .attr('fill', colorPalette.darker.stroke)
            //   .style('opacity', 0)
            //   .attr('width', function (d) { return scaleX(d.end) - scaleX(d.start) })
            //   .attr('height', range)
            //   .on('mouseover', function (d) {
            //     mouseHover(d3.select(d3.select(this).node().parentNode), d, 'large')
            //   })
            //   .on('mouseout', function (d) {
            //     mouseOut(d3.select(d3.select(this).node().parentNode), d, 'large')
            //   })
            gMerge.select('rect#largeused')
                .attr('x', function(d) {
                    return scaleX(d.start)
                })
                .attr('y', function(d) {
                    let height = Math.abs(scaleYLarge(d.largeTels.used))
                    if (d.largeTels.used >= scaleYLarge.domain()[1]) {
                        height = range
                    }
                    if (d.largeTels.used <= scaleYLarge.domain()[0]) {
                        height = 0
                    }
                    return range - height
                })
                .attr('fill', function(d, i) {
                    return '#43A047'
                })
                .attr('width', function(d) {
                    return scaleX(d.end) - scaleX(d.start)
                })
                .attr('height', function(d) {
                    let height = Math.abs(scaleYLarge(d.largeTels.used))
                    if (d.largeTels.used >= scaleYLarge.domain()[1]) {
                        height = range
                    }
                    if (d.largeTels.used <= scaleYLarge.domain()[0]) {
                        height = 0
                    }
                    return height
                })
                .attr('stroke', function(d) {
                    return color_theme.dark.stroke
                })
                .attr('stroke-width', function(d) {
                    return 0
                })
                .attr('stroke-opacity', function(d) {
                    return 1
                })
                .attr('fill-opacity', 0.6)
                .on('mouseover', function(e, d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'large')
                })
                .on('mouseout', function(e, d) {
                    mouseOut(d3.select(d3.select(this).node().parentNode), d, 'large')
                })
            gMerge.select('rect#largemin')
                .attr('x', function(d) {
                    return scaleX(d.start)
                })
                .attr('y', function(d) {
                    let height = Math.abs(scaleYLarge(d.largeTels.min))
                    if (d.largeTels.min >= scaleYLarge.domain()[1]) {
                        height = range
                    }
                    if (d.largeTels.min <= scaleYLarge.domain()[0]) {
                        height = 0
                    }
                    return range - height
                })
                .attr('fill', function(d, i) {
                    if (d.largeTels.min > scaleYLarge.domain()[1] || d.largeTels.used < d.largeTels.min) {
                        return '#FF5722'
                    }
                    return '#444444'
                })
                .attr('width', function(d) {
                    return scaleX(d.end) - scaleX(d.start)
                })
                .attr('height', function(d) {
                    let height = Math.abs(scaleYLarge(d.largeTels.min))
                    if (d.largeTels.min >= scaleYLarge.domain()[1]) {
                        height = range
                    }
                    if (d.largeTels.min <= scaleYLarge.domain()[0]) {
                        height = 0
                    }
                    return height
                })
                .attr('stroke', function(d) {
                    return color_theme.dark.stroke
                })
                .attr('stroke-width', function(d) {
                    return 0
                })
                .attr('stroke-opacity', function(d) {
                    return 1
                })
                .attr('fill-opacity', 0.6)
                .on('mouseover', function(e, d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'large')
                })
                .on('mouseout', function(e, d) {
                    mouseOut(d3.select(d3.select(this).node().parentNode), d, 'large')
                })
                .each(function(d) {
                    if (d.largeTels.min < scaleYLarge.domain()[0] || d.largeTels.used > d.largeTels.min) {
                        conflictSquare.push({
                            d3: d3.select(this),
                            d: d,
                        })
                    }
                })

            allg
                .exit()
                .style('opacity', 0)
                .remove()

            listAllConflicts(curve)
        }
        this.drawTelsAvailabilityCurve = drawTelsAvailabilityCurve
        function computeTelsCurve(block) {
            function core(b) {
                if (!largeTels[b.time.start]) {
                    largeTels[b.time.start] = {
                        min: 0,
                        used: 0,
                    }
                }// 4
                if (!mediumTels[b.time.start]) {
                    mediumTels[b.time.start] = {
                        min: 0,
                        used: 0,
                    }
                }// 24
                if (!smallTels[b.time.start]) {
                    smallTels[b.time.start] = {
                        min: 0,
                        used: 0,
                    }
                }// 70
                if (!largeTels[b.time.end]) {
                    largeTels[b.time.end] = {
                        min: 0,
                        used: 0,
                    }
                }// 4
                if (!mediumTels[b.time.end]) {
                    mediumTels[b.time.end] = {
                        min: 0,
                        used: 0,
                    }
                }// 24
                if (!smallTels[b.time.end]) {
                    smallTels[b.time.end] = {
                        min: 0,
                        used: 0,
                    }
                }// 70

                smallTels[b.time.start].min += b.telescopes.small.min
                smallTels[b.time.end].min -= b.telescopes.small.min
                smallTels[b.time.start].used += b.telescopes.small.ids.length // min
                smallTels[b.time.end].used -= b.telescopes.small.ids.length // min

                mediumTels[b.time.start].min += b.telescopes.medium.min
                mediumTels[b.time.end].min -= b.telescopes.medium.min
                mediumTels[b.time.start].used += b.telescopes.medium.ids.length // min
                mediumTels[b.time.end].used -= b.telescopes.medium.ids.length // min

                largeTels[b.time.start].min += b.telescopes.large.min
                largeTels[b.time.end].min -= b.telescopes.large.min
                largeTels[b.time.start].used += b.telescopes.large.ids.length // min
                largeTels[b.time.end].used -= b.telescopes.large.ids.length // min


                if (!bIds[b.time.start]) {
                    bIds[b.time.start] = {
                        type: 'add',
                        ids: [],
                    }
                }
                if (!bIds[b.time.end]) {
                    bIds[b.time.end] = {
                        type: 'rem',
                        ids: [],
                    }
                }
                bIds[b.time.start].ids.push(b.obs_block_id)
                bIds[b.time.end].ids.push(b.obs_block_id)
            }
            let largeTels = {
            }
            let mediumTels = {
            }
            let smallTels = {
            }
            let bIds = {
            }
            // smallTels[shared.data.server.time_information.night_start_sec] = 0
            // mediumTels[shared.data.server.time_information.night_start_sec] = 0
            // largeTels[shared.data.server.time_information.night_start_sec] = 0
            let focusBlockList = get_blocksData()
            for (let key in focusBlockList) {
                for (let i = 0; i < focusBlockList[key].length; i++) {
                    let b = focusBlockList[key][i]
                    if (b.exe_state.state === 'cancel') {
                        continue
                    }
                    if (block && b.obs_block_id === block.obs_block_id) {
                        continue
                    }

                    core(b)
                }
            }
            if (block) {
                core(block)
            }

            let timeMarker = []
            for (var key in smallTels) {
                timeMarker.push(Number(key))
            }
            timeMarker.sort((a, b) => a - b)

            let telsFree = []
            let currentBlockIds = []
            for (let i = -1; i < timeMarker.length; i++) {
                if (i === -1) {
                    telsFree.push({
                        id: 'LMS' + timeMarker[i] + Number(shared.data.server.time_information.night_start_sec),
                        start: Number(shared.data.server.time_information.night_start_sec),
                        end: timeMarker[i + 1],
                        smallTels: {
                            min: 0,
                            used: 0,
                        },
                        mediumTels: {
                            min: 0,
                            used: 0,
                        },
                        largeTels: {
                            min: 0,
                            used: 0,
                        },
                        blocks: [],
                    })
                }
                else if (i === timeMarker.length - 1) {
                    telsFree.push({
                        id: 'LMS' + timeMarker[i] + Number(shared.data.server.time_information.night_end_sec),
                        start: timeMarker[i],
                        end: Number(shared.data.server.time_information.night_end_sec),
                        smallTels: {
                            min: 0,
                            used: 0,
                        },
                        mediumTels: {
                            min: 0,
                            used: 0,
                        },
                        largeTels: {
                            min: 0,
                            used: 0,
                        },
                        blocks: [],
                    })
                }
                else {
                    if (bIds[timeMarker[i]].type === 'rem') {
                        currentBlockIds = currentBlockIds.filter(d => bIds[timeMarker[i]].ids.indexOf(d) < 0)
                    }
                    else {
                        currentBlockIds = currentBlockIds.concat(bIds[timeMarker[i]].ids.filter(d => currentBlockIds.indexOf(d) < 0))
                    }
                    let s = {
                        min: telsFree[i].smallTels.min + smallTels[timeMarker[i]].min,
                        used: telsFree[i].smallTels.used + smallTels[timeMarker[i]].used,
                    }
                    let m = {
                        min: telsFree[i].mediumTels.min + mediumTels[timeMarker[i]].min,
                        used: telsFree[i].mediumTels.used + mediumTels[timeMarker[i]].used,
                    }
                    let l = {
                        min: telsFree[i].largeTels.min + largeTels[timeMarker[i]].min,
                        used: telsFree[i].largeTels.used + largeTels[timeMarker[i]].used,
                    }
                    telsFree.push({
                        id: 'LMS' + timeMarker[i] + timeMarker[i + 1],
                        start: timeMarker[i],
                        end: timeMarker[i + 1],
                        smallTels: s,
                        mediumTels: m,
                        largeTels: l,
                        blocks: deep_copy(currentBlockIds),
                    })
                }
            }
            return telsFree
        }
    }
    let SvgFocusOverlay = function() {
        let reserved = {
        }
        reserved.drag = {
        }
        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_clipping() {
            reserved.clipping = {
            }
            reserved.drag.box = {
                x: box.focusOverlay.x,
                y: box.focusOverlay.y,
                w: box.focusOverlay.w,
                h: box.focusOverlay.h,
                marg: svg_dims.w[0] * 0.01,
            }
            reserved.clipping.g = svg.g.append('g')
                .attr('transform', 'translate(' + reserved.drag.box.x + ',' + reserved.drag.box.y + ')')
            reserved.clipping.g.append('defs').append('svg:clipPath')
                .attr('id', 'clipOverlay')
                .append('svg:rect')
                .attr('id', 'clip-rect')
                .attr('x', '0')
                .attr('y', '-4')
                .attr('width', reserved.drag.box.w)
                .attr('height', reserved.drag.box.h + 4)
            reserved.clipping.clipBody = reserved.clipping.g.append('g')
                .attr('clip-path', 'url(#clipOverlay)')
            reserved.main = {
                g: reserved.clipping.clipBody.append('g'),
            }
        }
        function init_data() {
            reserved.hasData = false
            init_clipping()
        }
        this.init_data = init_data

        function blurry() {
            reserved.main.g.style('opacity', 0.2)
        }
        this.blurry = blurry
        function focus() {
            reserved.main.g.style('opacity', 1)
        }
        this.focus = focus

        function update_data() {
            reserved.hasData = true
        }
        this.update_data = update_data
        function update() {
            if (!shared.focus || shared.focus.type !== 'block') {
                return
            }
            let axisTop = brushZoom.get_domain().focus
            let start_time_sec = {
                date: new Date(shared.data.server.time_information.night_start_sec),
                time: Number(axisTop[0]),
            }
            let end_time_sec = {
                date: new Date(shared.data.server.time_information.night_end_sec),
                time: Number(axisTop[1]),
            }
            reserved.drag.timescale = d3.scaleLinear()
                .range([ 0, reserved.drag.box.w ])
                .domain([ start_time_sec.time, end_time_sec.time ])
            let d = getBlockById(get_blocksData(), shared.focus.id).data
            reserved.drag.position = {
                width: reserved.drag.timescale(d.time.end) - reserved.drag.timescale(d.time.start),
                left: reserved.drag.timescale(d.time.start),
                right: reserved.drag.timescale(d.time.end),
            }
            updateDragColumn()
            updateDragTimer()
        }
        this.update = update

        function createDragColumn(d) {
            reserved.drag.column = {
            }
            reserved.drag.column.g = reserved.drag.g.append('g')
            reserved.drag.column.g.append('rect')
                .attr('class', 'area')
                .attr('x', reserved.drag.position.left)
            // .attr('y', function () { return d.y + reserved.drag.box.h * 0.19 }) // - Number(reserved.drag.oldRect.attr('height')))
                .attr('width', reserved.drag.position.right - reserved.drag.position.left)
            // .attr('height', function () { return d.h })
                .attr('fill', '#ffffff')
                .attr('stroke', 'none')
                .attr('fill-opacity', 0.2)
                .style('pointer-events', 'none')
                .attr('y', 0)
                .attr('height', reserved.drag.box.h)
            reserved.drag.column.g.append('line')
                .attr('class', 'left')
                .attr('x1', reserved.drag.position.left)
            // .attr('y1', function () { return d.y + reserved.drag.box.h * 0.19 })
                .attr('x2', reserved.drag.position.left)
            // .attr('y2', function () { return d.y + reserved.drag.box.h * 0.19 + d.h })
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.2)
                .transition()
                .duration(150)
                .attr('y1', 0)
                .attr('y2', reserved.drag.box.h)
            // .attr('stroke-dasharray', [reserved.drag.box.h * 0.02, reserved.drag.box.h * 0.02])
            reserved.drag.column.g.append('line')
                .attr('class', 'right')
                .attr('x1', reserved.drag.position.right)
            // .attr('y1', function () { return d.y + reserved.drag.box.h * 0.19 })
                .attr('x2', reserved.drag.position.right)
            // .attr('y2', function () { return d.y + reserved.drag.box.h * 0.19 + d.h })
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.2)
                .transition()
                .duration(150)
                .attr('y1', 0)
                .attr('y2', reserved.drag.box.h)
            // .attr('stroke-dasharray', [reserved.drag.box.h * 0.02, reserved.drag.box.h * 0.02])
            reserved.drag.column.g.append('rect')
                .attr('class', 'top')
                .attr('x', reserved.drag.position.left - 4)
                .attr('y', -3) // - Number(reserved.drag.oldRect.attr('height')))
                .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
                .attr('height', 3)
                .attr('fill', color_theme.darker.stroke)
                .attr('stroke', color_theme.darker.stroke)
                .attr('opacity', 0)
                .transition()
                .duration(50)
                .delay(0)
                .attr('opacity', 1)
            reserved.drag.column.g.append('rect')
                .attr('class', 'bottom')
                .attr('x', reserved.drag.position.left - 4)
                .attr('y', reserved.drag.box.h - 2) // - Number(reserved.drag.oldRect.attr('height')))
                .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
                .attr('height', 3)
                .attr('fill', color_theme.darker.stroke)
                .attr('stroke', color_theme.darker.stroke)
                .attr('opacity', 0)
                .transition()
                .duration(50)
                .delay(0)
                .attr('opacity', 1)
        }
        function createDragTimer(d) {
            reserved.drag.timer = {
            }
            reserved.drag.timer.g = reserved.drag.g.append('g')
                .attr('transform', 'translate(' + reserved.drag.position.left + ',' + (reserved.drag.box.h * 0.66) + ')')
            reserved.drag.timer.g.append('line')
                .attr('id', 'leftBar')
                .attr('x1', -6)
                .attr('y1', 26)
                .attr('x2', 0)
                .attr('y2', 21)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 1)
            reserved.drag.timer.g.append('circle')
                .attr('id', 'leftCircle')
                .attr('cx', 0)
                .attr('cy', 21)
                .attr('r', 2)
                .attr('fill', color_theme.dark.stroke)

            reserved.drag.timer.g.append('line')
                .attr('id', 'rightBar')
                .attr('x1', reserved.drag.position.width)
                .attr('y1', 21)
                .attr('x2', reserved.drag.position.width + 6)
                .attr('y2', 26)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 1)
            reserved.drag.timer.g.append('circle')
                .attr('id', 'rightCircle')
                .attr('cx', reserved.drag.position.width)
                .attr('cy', 21)
                .attr('r', 2)
                .attr('fill', color_theme.dark.stroke)

            reserved.drag.timer.g.append('text')
                .attr('class', 'hourLeft')
                .text(function() {
                    let time = new Date(shared.data.server.time_information.night_start_sec)
                    time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.left))
                    return d3.timeFormat('%H:')(time)
                })
                .attr('x', -34)
                .attr('y', 32) // - Number(reserved.drag.oldRect.attr('height')))
                .style('font-weight', 'bold')
                .style('opacity', 1)
                .style('fill-opacity', 0.7)
                .style('fill', '#000000')
                .style('stroke-width', 0.3)
                .style('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .style('stroke', 'none')
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .attr('dy', '0px')
            reserved.drag.timer.g.append('text')
                .attr('class', 'minuteLeft')
                .text(function() {
                    let time = new Date(shared.data.server.time_information.night_start_sec)
                    time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.left))
                    return d3.timeFormat('%M')(time)
                })
                .attr('x', -18)
                .attr('y', 32) // - Number(reserved.drag.oldRect.attr('height')))
                .style('font-weight', 'bold')
                .style('opacity', 1)
                .style('fill-opacity', 0.7)
                .style('fill', '#000000')
                .style('stroke-width', 0.3)
                .style('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .style('stroke', 'none')
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .attr('dy', '0px')

            reserved.drag.timer.g.append('text')
                .attr('class', 'hourRight')
                .text(function() {
                    let time = new Date(shared.data.server.time_information.night_start_sec)
                    time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.right))
                    return d3.timeFormat('%H:')(time)
                })
                .attr('x', reserved.drag.position.width + 18)
                .attr('y', 32) // - Number(reserved.drag.oldRect.attr('height')))
                .style('font-weight', 'bold')
                .style('opacity', 1)
                .style('fill-opacity', 0.7)
                .style('fill', '#000000')
                .style('stroke-width', 0.3)
                .style('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .style('stroke', 'none')
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .attr('dy', '0px')
            reserved.drag.timer.g.append('text')
                .attr('class', 'minuteRight')
                .text(function() {
                    let time = new Date(shared.data.server.time_information.night_start_sec)
                    time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.right))
                    return d3.timeFormat('%M')(time)
                })
                .attr('x', reserved.drag.position.width + 34)
                .attr('y', 32) // - Number(reserved.drag.oldRect.attr('height')))
                .style('font-weight', 'bold')
                .style('opacity', 1)
                .style('fill-opacity', 0.7)
                .style('fill', '#000000')
                .style('stroke-width', 0.3)
                .style('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .style('stroke', 'none')
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .attr('dy', '0px')
        }

        function updateDragColumn(d) {
            reserved.drag.column.g.select('rect.area')
                .attr('x', reserved.drag.position.left)
                .attr('width', reserved.drag.position.right - reserved.drag.position.left)
            reserved.drag.column.g.select('line.left')
                .attr('x1', reserved.drag.position.left)
                .attr('x2', reserved.drag.position.left)
            reserved.drag.column.g.select('line.right')
                .attr('x1', reserved.drag.position.right)
                .attr('x2', reserved.drag.position.right)
            reserved.drag.column.g.select('rect.top')
                .attr('x', reserved.drag.position.left - 4)
                .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
            reserved.drag.column.g.select('rect.bottom')
                .attr('x', reserved.drag.position.left - 4)
                .attr('width', reserved.drag.position.right - reserved.drag.position.left + 8)
        }
        function updateDragTimer(d) {
            reserved.drag.timer.g.attr('transform', 'translate(' + reserved.drag.position.left + ',' + (reserved.drag.box.h * 0.66) + ')')

            reserved.drag.timer.g.select('line#rightBar')
                .attr('x1', reserved.drag.position.width)
                .attr('x2', reserved.drag.position.width + 6)

            reserved.drag.timer.g.select('text.hourRight')
                .attr('x', reserved.drag.position.width + 18)
            reserved.drag.timer.g.select('text.minuteRight')
                .attr('x', reserved.drag.position.width + 34)
        }

        function hide_block_info(d) {
            // console.log('hide_block_info');
            if (!d) {
                return
            }
            if (reserved.drag.locked) {
                return
            }
            // console.log('show_block_infoPass');

            if (reserved.drag.g) {
                reserved.drag.g.remove()
            }
            if (reserved.drag) {
                reserved.drag = {
                }
            }
            svgTargets.unhighlightTarget(d)
        }
        function show_block_info(d) {
            // console.log('show_block_info');
            if (!d) {
                return
            }
            // hide_block_info()
            if (reserved.drag.g) {
                return
            }
            // console.log('show_block_infoPass');
            // if (!reserved.hasData) return
            // if (reserved.drag.g) return
            svgTargets.highlightTarget(d)

            reserved.drag.g = reserved.main.g.append('g')
            reserved.drag.box = {
                x: box.focusOverlay.x,
                y: box.focusOverlay.y,
                w: box.focusOverlay.w,
                h: box.focusOverlay.h,
                marg: svg_dims.w[0] * 0.01,
            }
            let axisTop = brushZoom.get_domain().focus
            let start_time_sec = {
                date: new Date(shared.data.server.time_information.night_start_sec),
                time: Number(axisTop[0]),
            }
            let end_time_sec = {
                date: new Date(shared.data.server.time_information.night_end_sec),
                time: Number(axisTop[1]),
            }
            reserved.drag.timescale = d3.scaleLinear()
                .range([ 0, reserved.drag.box.w ])
                .domain([ start_time_sec.time, end_time_sec.time ])
            reserved.drag.position = {
                width: reserved.drag.timescale(d.time.end) - reserved.drag.timescale(d.time.start),
                left: reserved.drag.timescale(d.time.start),
                right: reserved.drag.timescale(d.time.end),
            }
            createDragColumn(d)
            createDragTimer(d)
        }

        function focusOn_block(id) {
            let d = getBlockById(get_blocksData(), id).data
            show_block_info(d)
        }
        this.focusOn_block = focusOn_block
        function unfocusOn_block(id) {
            let d = getBlockById(get_blocksData(), id).data
            hide_block_info(d)
        }
        this.unfocusOn_block = unfocusOn_block
        function overBlock(id) {
            if (shared.focus) {
                unfocusOn_block(shared.focus.id)
            }
            let d = getBlockById(get_blocksData(), id).data
            show_block_info(d)
        }
        this.overBlock = overBlock
        function outBlock(id) {
            let d = getBlockById(get_blocksData(), id).data
            hide_block_info(d)
            if (shared.focus) {
                focusOn_block(shared.focus.id)
            }
        }
        this.outBlock = outBlock

        function canDrag(d) {
            if (d.created) {
                return true
            }
            if (d.exe_state.state === 'wait' || d.exe_state.state === 'cancel') {
                return true
            }
            return false
        }


        function dragStart(e, d) {
            console.log(e, d)
            if (!canDrag(d)) {
                return
            }

            if (!reserved.drag) {
                focusManager.focusOn('block', d.obs_block_id)
            }

            reserved.drag.mousecursor = d3.pointer(e)
            // reserved.drag.mousecursor = d3.mouse(reserved.drag.g._groups[0][0])

            reserved.drag.offset = reserved.drag.mousecursor[0] - reserved.drag.position.left

            reserved.drag.mode = {
            }
            reserved.drag.mode.current = 'general'
            reserved.drag.mode.previous = 'general'
            reserved.drag.atLeastOneTick = false
            reserved.drag.locked = true

        }
        this.dragStart = dragStart


        function dragTick(e, d) {
            if (!canDrag(d)) {
                return
            }
            if (d.exe_state.state === 'run') {
                return
            }

            reserved.drag.atLeastOneTick = true

            if (e.dx < 0
              && Math.floor(reserved.drag.timescale
                  .invert(reserved.drag.position.left + e.dx))
              < Number(shared.data.server.time_information.time_now_sec)) {
                return
            }
            reserved.drag.position.left += e.dx

            if (reserved.drag.position.left < 0) {
                reserved.drag.position.left = 0
            }
            if (reserved.drag.position.left + reserved.drag.position.width
              > reserved.drag.box.w) {
                reserved.drag.position.left
                  = reserved.drag.box.w - reserved.drag.position.width
            }

            reserved.drag.position.right = reserved.drag.position.left + reserved.drag.position.width

            reserved.drag.g.select('line.left')
                .attr('x1', reserved.drag.position.left)
                .attr('x2', reserved.drag.position.left)
            reserved.drag.g.select('line.right')
                .attr('x1', reserved.drag.position.right)
                .attr('x2', reserved.drag.position.right)
            // reserved.drag.g.select('g rect.modified')
            //   .attr('x', reserved.drag.position.left)
            reserved.drag.g.select('g text.modified')
                .attr('x', reserved.drag.position.left + reserved.drag.position.width * 0.5)
            reserved.drag.g.select('rect.area')
                .attr('x', reserved.drag.position.left)
            reserved.drag.g.select('rect.top')
                .attr('x', reserved.drag.position.left - 4)
            reserved.drag.g.select('rect.bottom')
                .attr('x', reserved.drag.position.left - 4)

            // reserved.drag.g.select('rect.timelineCursor')
            //   .attr('x', reserved.drag.position.left)
            reserved.drag.timer.g.attr('transform', function() {
                let t = reserved.drag.timer.g.attr('transform')
                t = t.split(',')
                t[0] = Number(t[0].split('(')[1])
                t[1] = Number(t[1].split(')')[0])
                return 'translate(' + Number(reserved.drag.g.select('line.left').attr('x1')) + ',' + t[1] + ')'
            })
            reserved.drag.timer.g.select('text.hourLeft').text(function() {
                let time = new Date(shared.data.server.time_information.night_start_sec)
                time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.left))
                return d3.timeFormat('%H:')(time)
            })
            reserved.drag.timer.g.select('text.minuteLeft').text(function() {
                let time = new Date(shared.data.server.time_information.night_start_sec)
                time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.left))
                return d3.timeFormat('%M')(time)
            })
            reserved.drag.timer.g.select('text.hourRight').text(function() {
                let time = new Date(shared.data.server.time_information.night_start_sec)
                time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.right))
                return d3.timeFormat('%H:')(time)
            })
            reserved.drag.timer.g.select('text.minuteRight').text(function() {
                let time = new Date(shared.data.server.time_information.night_start_sec)
                time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.right))
                return d3.timeFormat('%M')(time)
            })

            svgTargets.showPercentTarget({
                data: {
                    target_id: d.target_id,
                    start_time_sec: reserved.drag.timescale.invert(reserved.drag.position.left),
                    end_time_sec: reserved.drag.timescale.invert(reserved.drag.position.right),
                },
            })
            svgTelsConflict.drawTelsAvailabilityCurve(d)

            d.time.start = Math.floor(reserved.drag.timescale.invert(reserved.drag.position.left))
            d.time.end = d.time.start + d.time.duration

            if (!shared.focus || shared.focus.id !== d.obs_block_id) {
                focusManager.focusOn('block', d.obs_block_id)
            }
            svgRight_info.updateBlock()
            svg_blocks_queue_server.update()
        }
        this.dragTick = dragTick


        function dragEnd(e, d) {
            reserved.drag.locked = false
            if (!reserved.drag.atLeastOneTick) {
                return
            }
            balanceBlocks(d)
            svgTelsConflict.drawTelsAvailabilityCurve(d)
            // listAllConflicts()
            // linkConflicts()
            changeBlockProperties(d, false, 'start_time_sec')
            // if (!reserved.drag.atLeastOneTick) return
            // console.log('dragEnd')
            // d3.event.sourceEvent.stopPropagation()
            // if (d.end_time_sec < Number(shared.data.server.time_information.time_now_sec)) return
            //
            // let newBlock = deep_copy(d)
            // if (reserved.drag.finalTime) {
            //   let t = (reserved.drag.finalTime.getTime() - (new Date(shared.data.server.time_information.night_start_sec)).getTime())
            //   reserved.drag.position.left = reserved.drag.timescale(t)
            // }
            // let newStart = Math.floor(reserved.drag.timescale.invert(reserved.drag.position.left))
            // let modif = [{prop: 'start_time_sec', old: newBlock.data.start_time_sec, new: newStart}]
            //
            // // if (reserved.drag.mode.current === 'cancel') {
            // //   modif.push({prop: 'state', old: d.exe_state.state, new: 'cancel'})
            // // }
            //
            // // blockQueue.saveModificationAndUpdateBlock(newBlock, modif)
            // // if (isGeneratingTelsConflict(newBlock)) {
            // //   com.data.modified.conflict.push(newBlock)
            // // } else {
            // //   com.data.modified.integrated.push(newBlock)
            // // }
            // if (reserved.drag.mode.previous === 'precision') {
            //   reserved.drag.timer.g.attr('transform', 'translate(' + reserved.drag.timescale(newStart) + ',' + (reserved.drag.box.h * 0.49) + ')')
            //   reserved.drag.timer.g.select('text.hour')
            //     .transition()
            //     .duration(600)
            //     .text(function () {
            //       return d3.timeFormat('%H:')(reserved.drag.finalTime)
            //     })
            //     .attr('x', 15)
            //     .attr('y', 9)
            //     .style('font-weight', 'normal')
            //   reserved.drag.timer.g.select('text.minute')
            //     .transition()
            //     .duration(600)
            //     .text(function () {
            //       return d3.timeFormat('%M')(reserved.drag.finalTime)
            //     })
            //     .attr('x', 27)
            //     .attr('y', 9)
            //     .style('font-weight', 'normal').style('font-size', '10px')
            //   reserved.drag.timer.g.select('text.second')
            //     .transition()
            //     .duration(600)
            //     .style('font-size', '0px')
            //     .style('opacity', 0)
            //     .remove()
            //   reserved.drag.timer.g.select('rect.timelineOpacity')
            //     .transition()
            //     .duration(600)
            //     .attr('x', 0)
            //     .attr('width', 40)
            //     .attr('height', 10)
            //     .attr('fill-opacity', 0.9)
            //   reserved.drag.timer.g.select('g.hourMin')
            //     .attr('opacity', 1)
            //     .transition()
            //     .duration(600)
            //     .attr('opacity', 0)
            //     .on('end', function () {
            //       reserved.drag.timer.g.select('g.hourMin').remove()
            //     })
            //   delete reserved.drag.finalTime
            // }
            //
            // return {id: d.obs_block_id, modif: modif}

            // reserved.drag.oldG.select('rect.back')
            //   .style('fill-opacity', 0.1)
            //   .style('stroke-opacity', 0.1)
            //   .style('pointer-events', 'none')
            // reserved.drag.oldG.remove()
        }
        this.dragEnd = dragEnd
    }

    function balanceBlocks(block) {
        return
        let idle
        function checkAndReplace(block1, block2, type) {
            let inter = block1.telescopes[type].ids.filter(value => block2.telescopes[type].ids.includes(value))
            for (let i = 0; i < inter.length; i++) {
                removeTelescopeFromBlock(block1, {
                    id: inter[i],
                })
                if (idle[type].length > 0) {
                    addTelescopeToBlock(block1, idle[type].splice(0, 1)[0])
                }
            }
        }

        if (block.telescopes.large.ids.length < block.telescopes.large.min
      && block.telescopes.medium.ids.length < block.telescopes.medium.min
      && block.telescopes.small.ids.length < block.telescopes.small.min) {
            return
        } // continue

        let cblocks = get_blocksByTime(get_blocksData(), block.time.start, block.time.end)
        idle = {
            large: shared.data.server.inst_health.filter(d => d.id.includes('L')).filter(function(d) {
                for (let i = 0; i < cblocks.length; i++) {
                    if (cblocks[i].telescopes.large.ids.indexOf(d.id) !== -1) {
                        return false
                    }
                }
                return true
            }),
            medium: shared.data.server.inst_health.filter(d => d.id.includes('M')).filter(function(d) {
                for (let i = 0; i < cblocks.length; i++) {
                    if (cblocks[i].telescopes.medium.ids.indexOf(d.id) !== -1) {
                        return false
                    }
                }
                return true
            }),
            small: shared.data.server.inst_health.filter(d => d.id.includes('S')).filter(function(d) {
                for (let i = 0; i < cblocks.length; i++) {
                    if (cblocks[i].telescopes.small.ids.indexOf(d.id) !== -1) {
                        return false
                    }
                }
                return true
            }),
        }
        let fcblocks = cblocks.filter(d => d.obs_block_id !== block.obs_block_id)

        for (let j = 0; j < fcblocks.length; j++) {
            checkAndReplace(block, fcblocks[j], 'large')
            checkAndReplace(block, fcblocks[j], 'medium')
            checkAndReplace(block, fcblocks[j], 'small')
        }
        balanceTelescopesBetween_blocks(block, fcblocks)

    // if (block.telescopes.large.ids.length < block.telescopes.large.min) svgRight_info.addConflict(cblocks)
    // else if (block.telescopes.medium.ids.length < block.telescopes.medium.min) svgRight_info.addConflict(cblocks)
    // else if (block.telescopes.small.ids.length < block.telescopes.small.min) svgRight_info.addConflict(cblocks)
    // }
    }

    let conflictFocused = {
        d: undefined,
        d3: undefined,
    }
    let conflictSquare = []
    let conflict_button = []
    function linkConflicts() {
        let azerty = []
        for (let j = conflict_button.length - 1; j >= 0; j--) {
            let linked = []
            for (let i = conflictSquare.length - 1; i >= 0; i--) {
                let intersect = conflict_button[j].d.blocks.filter(value => conflictSquare[i].d.blocks.includes(value.obs_block_id))
                if (intersect.length === conflictSquare[i].d.blocks.length) {
                    linked.push(conflictSquare[i])
                    azerty.push(conflictSquare[i])
                }
            }
            for (let i = 0; i < linked.length; i++) {
                linked[i].d3
                    .on('click', function() {
                        svgRight_info.focusOnConflict(conflict_button[j])
                    })
                    .on('mouseover', function(e, d) {
                        for (let j = 0; j < linked.length; j++) {
                            let nb = {
                                x: Number(linked[j].d3.attr('x')),
                                y: Number(linked[j].d3.attr('y')),
                                w: Number(linked[j].d3.attr('width')),
                                h: Number(linked[j].d3.attr('height')),
                            }
                            linked[j].d3.attr('stroke', '#000000')
                                .attr('stroke-width', 4)
                                .attr('x', nb.x + 2)
                                .attr('y', nb.y + 2)
                                .attr('width', nb.w - 4)
                                .attr('height', nb.h - 4)
                        }
                        d3.select(this).style('cursor', 'pointer')
                        if (conflict_button[j].d3) {
                            conflict_button[j].d3.select('rect').attr('fill', colorPalette.darkest.background)
                        }
                        blockQueue.highlightBlocks(conflict_button[j].d.blocks)
                    })
                    .on('mouseout', function(e, d) {
                        for (let j = 0; j < linked.length; j++) {
                            let nb = {
                                x: Number(linked[j].d3.attr('x')),
                                y: Number(linked[j].d3.attr('y')),
                                w: Number(linked[j].d3.attr('width')),
                                h: Number(linked[j].d3.attr('height')),
                            }
                            linked[j].d3.attr('stroke', '#000000')
                                .attr('stroke-width', 0)
                                .attr('x', nb.x - 2)
                                .attr('y', nb.y - 2)
                                .attr('width', nb.w + 4)
                                .attr('height', nb.h + 4)
                        }
                        d3.select(this).style('cursor', 'default')
                        if (conflict_button[j].d3) {
                            conflict_button[j].d3.select('rect').attr('fill', colorPalette.darker.background)
                        }
                        blockQueue.highlightBlocks([])
                    })
            }
            if (conflict_button[j].d3) {
                conflict_button[j].d3
                    .on('mouseover', function(e, d) {
                        d3.select(this)
                            .style('cursor', 'pointer')
                            .select('rect').attr('fill', colorPalette.darkest.background)
                        blockQueue.highlightBlocks(conflict_button[j].d.blocks)
                        for (let j = linked.length - 1; j >= 0; j--) {
                            linked[j].d3.attr('fill', d3.color('#000000'))
                        }
                    })
                    .on('mouseout', function(e, d) {
                        d3.select(this).style('cursor', 'default')
                        if (conflictFocused.d === conflict_button[j].d) {
                            return
                        }
                        blockQueue.highlightBlocks([])
                        d3.select(this).select('rect').attr('fill', colorPalette.darker.background)
                        for (let j = linked.length - 1; j >= 0; j--) {
                            linked[j].d3.attr('fill', '#FF5722')
                        }
                    })
            }
        }
    }
    function listAllConflicts(data) {
        let conflicts = []
        let all_obs_blocks = []
        conflict_button = []
        //
        for (let key in get_blocksData()) {
            all_obs_blocks = all_obs_blocks.concat(get_blocksData()[key])
        }
        let errors = all_obs_blocks.filter(d =>
            (d.telescopes.small.ids.length < d.telescopes.small.min || d.telescopes.small.ids.length > d.telescopes.small.max)
            || (d.telescopes.medium.ids.length < d.telescopes.medium.min || d.telescopes.medium.ids.length > d.telescopes.medium.max)
            || (d.telescopes.large.ids.length < d.telescopes.large.min || d.telescopes.large.ids.length > d.telescopes.large.max)
        )
        // function checkDuplicata (idg) {
        //   let ids = idg.split('|')
        //   for (let i = 0; i < conflicts.length; i++) {
        //     let cids = conflicts[i].id.split('|')
        //     let count = 0
        //     cids.map(function (d) {
        //       if (ids.indexOf(d) !== -1) count += 1
        //     })
        //     if (count === ids.length && count === cids.length) return true
        //   }
        //   return false
        // }
        // let blocks = clusterBlocksByTime(all_obs_blocks)

        let filtered = data.filter(d =>
            (d.smallTels.min > 70 || d.smallTels.used < d.smallTels.min)
            || (d.mediumTels.min > 25 || d.mediumTels.used < d.mediumTels.min)
            || (d.largeTels.min > 4 || d.largeTels.used < d.largeTels.min))
        // for (let j = 0; j < filtered.length; j++) {
        //   for (let z = j + 1; z < filtered.length; z++) {
        //     let intersect = filtered[j].blocks.filter(value => filtered[z].blocks.includes(value))
        //     if (intersect.length === filtered[j].blocks.length) {
        //       filtered[j].blocks = filtered[z].blocks
        //       filtered.splice(z, 1)
        //       z--
        //       break
        //     } else if (intersect.length === filtered[z].blocks.length) {
        //       filtered.splice(z, 1)
        //       z--
        //       break
        //     }
        //   }
        // }
        for (let j = 0; j < filtered.length; j++) {
            let group = filtered[j]
            // let s = 0
            // let m = 0
            // let l = 0
            // let idg = ''
            // group.map(function (d) { idg += '|' + d.obs_block_id; l += d.telescopes.large.min; m += d.telescopes.medium.min; s += d.telescopes.small.min })
            // idg = idg.slice(1)
            // if (!checkDuplicata(idg)) {
            let blocks = group.blocks.map(d => all_obs_blocks.filter(ab => ab.obs_block_id === d)[0])
            conflicts.push({
                id: group.id,
                blocks: blocks,
                small: 70 - group.smallTels.min,
                medium: 25 - group.mediumTels.min,
                large: 4 - group.largeTels.min,
            })
            conflict_button.push({
                d: {
                    id: group.id,
                    blocks: blocks,
                    small: 70 - group.smallTels.min,
                    medium: 25 - group.mediumTels.min,
                    large: 4 - group.largeTels.min,
                },
                d3: undefined,
            })
            // }
        }
        shared.data.copy.conflicts = conflicts
        svgRight_info.updateOverview()
        linkConflicts()

        update_pushon_server(!(errors.length > 0 || filtered.length > 0))
    }

    let SvgRight_info = function() {
        let template = {
            tag: 'right_info',
            g: undefined,
            box: {
                x: 1,
                y: 1,
                w: 1,
                h: 1,
            },
            debug: {
                enabled: false,
            },
        }
        let reserved = template

        let title_size = 11
        let headerSize = 10
        let txt_size = 9

        function init_data(data_in) {
            reserved.box = deep_copy(box.right_info)
            reserved.g = svg.g.append('g').attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
            reserved.quickg = svg.g.append('g').attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
            reserved.historyg = svg.g.append('g').attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')
            // reserved.g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', reserved.box.w)
            //   .attr('height', reserved.box.h)
            //   .attr('fill', color_theme.dark.background)
            createHistoryArrow()
            createQuickAccess()
            initOverview()
            updateOverview()
        }
        this.init_data = init_data
        // function initScrollBox(tag, g, box, background, isVertical) {
        //     if (background.enabled) {
        //         g.append('rect')
        //             .attr('class', 'background')
        //             .attr('x', 0)
        //             .attr('y', 0)
        //             .attr('width', box.w)
        //             .attr('height', box.h)
        //             .style('fill', background.fill)
        //             .style('stroke', background.stroke)
        //             .style('stroke-width', background.strokeWidth)
        //     }
        //
        //     let scrollBox = new ScrollBox()
        //     scrollBox.init({
        //         tag: tag,
        //         g_box: g,
        //         box_data: {
        //             x: 0,
        //             y: 0,
        //             w: box.w,
        //             h: box.h,
        //         },
        //         use_relative_coords: true,
        //         locker: new Locker(),
        //         lockers: [ tag + 'update_data' ],
        //         lock_zoom: {
        //             all: tag + 'zoom',
        //             during: tag + 'zoom_during',
        //             end: tag + 'zoom_end',
        //         },
        //         run_loop: new RunLoop({
        //             tag: tag,
        //         }),
        //         can_scroll: true,
        //         scrollVertical: isVertical,
        //         scroll_horizontal: !isVertical,
        //         scroll_height: 0,
        //         scroll_width: 0,
        //         background: 'transparent',
        //         scroll_rec_h: {
        //             h: 4,
        //         },
        //         scroll_recs: {
        //             w: 4,
        //         },
        //     })
        //     return scrollBox
        // }

        function update() {
            updateOverview()
        }
        this.update = update

        function createHistoryArrow() {
            let box = {
                x: reserved.box.w * 0.525,
                y: reserved.box.h * 0.02,
                w: reserved.box.w * 0.2,
                h: reserved.box.h * 0.03,
            }
            reserved.historyg.append('svg:image')
                .attr('xlink:href', '/static/icons/arrow-left.svg')
                .attr('x', box.x - box.w * 0.5)
                .attr('y', box.y)
                .attr('width', box.w * 0.5)
                .attr('height', box.h)
                .style('opacity', 0.5)
            // .style('pointer-events', 'none')
                .on('click', function() {
                    if (shared.history.index === -1) {
                        return
                    }
                    navigateHistory('backward')
                })
                .on('mouseover', function(e, d) {
                    d3.select(this).style('cursor', 'pointer')
                    d3.select(this).style('opacity', 1)
                })
                .on('mouseout', function(e, d) {
                    d3.select(this).style('cursor', 'default')
                    d3.select(this).style('opacity', 0.5)
                })
            reserved.historyg.append('svg:image')
                .attr('xlink:href', '/static/icons/arrow-right.svg')
                .attr('x', box.x)
                .attr('y', box.y)
                .attr('width', box.w * 0.5)
                .attr('height', box.h)
                .style('opacity', 0.5)
            // .style('pointer-events', 'none')
                .on('click', function() {
                    if (shared.history.index === shared.history.list.length - 1) {
                        return
                    }
                    navigateHistory('forward')
                })
                .on('mouseover', function(e, d) {
                    d3.select(this).style('cursor', 'pointer')
                    d3.select(this).style('opacity', 1)
                })
                .on('mouseout', function(e, d) {
                    d3.select(this).style('cursor', 'default')
                    d3.select(this).style('opacity', 0.5)
                })
        }

        function createQuickAccess() {
            let box = {
                icons: {
                    x: reserved.box.w * 0.17,
                    y: -3,
                    w: reserved.box.w * 0.2,
                    h: reserved.box.h * 0.145,
                },
                mapping: {
                    x: reserved.box.w * 0.0,
                    y: reserved.box.h * 0.16,
                    w: reserved.box.w * 1,
                    h: reserved.box.h * 1,
                },
            }
            let display
            let gback = reserved.quickg.append('g').attr('id', 'quickAccessBack')
            let gfore = reserved.quickg.append('g').attr('id', 'quickAccessFore')

            function cleanBack() {
                gback.selectAll('*').remove()
                reserved.g.attr('opacity', 1)
                reserved.historyg.attr('opacity', 1)
            }
            function createBlockMapping() {
                reserved.g.attr('opacity', 0.05)
                reserved.historyg.attr('opacity', 0)

                let scheds = []
                let inter = get_sched_blocksData()
                for (let key in inter) {
                    inter[key].id = key
                    scheds.push(inter[key])
                }

                let height = headerSize * 2.5
                let square = parseInt(Math.sqrt(scheds.length))
                square = 15 // square + (scheds.length % square === 0 ? 0 : 1)
                let marg = 0
                let origin = {
                    x: box.mapping.x + box.mapping.w,
                    y: box.mapping.y,
                }

                function blockCore(blocks, g, offset, index) {
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
                        let color = shared.style.blockCol(d)
                        g.append('rect')
                            .attr('x', 0)
                            .attr('y', height * 0.1)
                            .attr('width', height * 0.95)
                            .attr('height', height * 0.8)
                            .attr('fill', color.background)
                            .attr('stroke', color.stroke)
                            .attr('stroke-width', 0.1)
                            .on('click', function() {
                                cleanBack()
                                display = undefined
                                focusManager.focusOn('block', d.obs_block_id)
                            })
                            .on('mouseover', function(e, d) {
                                d3.select(this).style('cursor', 'pointer')
                                d3.select(this).attr('fill', d3.color(color.background).darker(0.9))
                            })
                            .on('mouseout', function(e, d) {
                                d3.select(this).style('cursor', 'default')
                                d3.select(this).attr('fill', color.background)
                            })
                        g.append('text')
                            .text(d.metadata.n_obs)
                            .style('fill', '#000000')
                            .style('font-weight', 'bold')
                            .style('font-size', headerSize + 'px')
                            .attr('text-anchor', 'middle')
                            .attr('transform', 'translate(' + (height * 0.5) + ',' + (height * 0.5 + txt_size * 0.3) + ')')
                            .style('pointer-events', 'none')
                    })
                    let merge = current.merge(enter)
                    merge.each(function(d, i) {
                        let g = d3.select(this)
                        let overflow = (index % square) + blocks.length > square ? square - ((index % square) + blocks.length) : 0
                        g.attr('transform', 'translate(' + (height * (i + overflow)) + ',' + (offset) + ')')
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
                        let dimPoly = height * 0.9
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
                            .attr('fill', color_theme.dark.background)
                            .attr('stroke', color_theme.dark.stroke)
                            .attr('stroke-width', 0.6)
                            .on('click', function() {
                                cleanBack()
                                display = undefined
                                focusManager.focusOn('sched_block', d.id)
                            })
                            .on('mouseover', function() {
                                gback.select('g#blocks').remove()
                                let gb = g.append('g').attr('id', 'blocks')
                                // let overflow = (i % square) + d.blocks.length > square ? square - ((i % square) + d.blocks.length) : 0
                                // gb.append('rect')
                                //   .attr('x', overflow * height)
                                //   .attr('y', height * 0.75)
                                //   .attr('width', d.blocks.length * height)
                                //   .attr('height', height * 1.25)
                                blockCore(d.blocks, gb, height, i)
                                d3.select(this).style('cursor', 'pointer')
                                d3.select(this).attr('fill', color_theme.darker.background)
                            })
                            .on('mouseout', function() {
                                // g.select('g#blocks').remove()
                                d3.select(this).style('cursor', 'default')
                                d3.select(this).attr('fill', color_theme.dark.background)
                            })
                        g.append('text')
                            .text('S' + d.blocks[0].metadata.n_sched)
                            .style('fill', color_theme.dark.text)
                            .style('font-weight', 'bold')
                            .style('font-size', title_size + 'px')
                            .attr('text-anchor', 'middle')
                            .attr('transform', 'translate(' + (dimPoly * 0.5) + ',' + (dimPoly * 0.5 + txt_size * 0.33) + ')')
                            .style('pointer-events', 'none')
                    })
                    let merge = current.merge(enter)
                    merge.each(function(d, i) {
                        let g = d3.select(this)
                        let line = parseInt(i / square) * 2
                        let column = square - (i % square)
                        g.attr('transform', 'translate(' + (origin.x - ((height + marg) * column) + (marg * 0.5)) + ',' + (offset + origin.y + (marg * 1) + ((height + marg) * line)) + ')')
                        // innerOffset += line
                        // blockCore(d.blocks, g, 0)
                    })
                    current
                        .exit()
                        .transition('in_out')
                        .duration(times.anim)
                        .style('opacity', 0)
                        .remove()
                }
                schedCore(scheds, gback, txt_size)
            }
            function create_targetsMapping() {
                reserved.g.attr('opacity', 0.05)
                reserved.historyg.attr('opacity', 0)

                let height = headerSize * 3
                let square = parseInt(Math.sqrt(shared.data.server.targets.length))
                square = 8 // square + (shared.data.server.targets.length % square === 0 ? 0 : 1)
                let marg = txt_size
                let origin = {
                    x: box.mapping.x + box.mapping.w,
                    y: box.mapping.y,
                }

                let targets = gback
                    .selectAll('g.target')
                    .data(shared.data.server.targets, function(d) {
                        return d.id
                    })
                let enter = targets
                    .enter()
                    .append('g')
                    .attr('class', 'target')
                enter.each(function(d, i) {
                    let g = d3.select(this)
                    g.attr('opacity', 0).transition().delay(0).duration(200).attr('opacity', 1)
                    g.append('rect')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', height)
                        .attr('height', height)
                        .attr('fill', color_theme.dark.background)
                        .attr('stroke', color_theme.medium.stroke)
                        .attr('stroke-width', 0.6)
                    // .style('boxShadow', '10px 20px 30px black')
                        .attr('rx', height)
                        .on('click', function() {
                            cleanBack()
                            display = undefined
                            focusManager.focusOn('target', d.id)
                        })
                        .on('mouseover', function(e, d) {
                            d3.select(this).style('cursor', 'pointer')
                            d3.select(this).attr('fill', color_theme.darker.background)
                        })
                        .on('mouseout', function(e, d) {
                            d3.select(this).style('cursor', 'default')
                            d3.select(this).attr('fill', color_theme.dark.background)
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
                        .text('T' + get_target_short(d))
                        .attr('x', height * 0.5)
                        .attr('y', height * 0.5 + txt_size * 0.3)
                        .style('font-weight', '')
                        .attr('text-anchor', 'middle')
                        .style('font-size', headerSize + 'px')
                        .attr('dy', 0)
                        .style('pointer-events', 'none')
                        .attr('fill', color_theme.dark.text)
                        .attr('stroke', 'none')
                })
                let merge = enter.merge(targets)
                merge.each(function(d, i) {
                    let g = d3.select(this)
                    let line = parseInt(i / square)
                    let column = square - (i % square)
                    g.attr('transform', 'translate(' + (origin.x - ((height + marg * 0.5) * column) + (marg * 0)) + ',' + (origin.y + (marg * 1) + ((height + marg * 0.5) * line)) + ')')
                })
                targets
                    .exit()
                    .transition('in_out')
                    .duration(times.anim)
                    .style('opacity', 0)
                    .remove()
            }
            function createTelescopesMapping() {
                reserved.g.attr('opacity', 0.1)
                reserved.historyg.attr('opacity', 0)

                let xx = box.mapping.w * 0.05
                let ww = box.mapping.w * 0.95
                let largeBox = {
                    x: xx,
                    y: 0,
                    w: ww * 0.1,
                    h: box.mapping.h,
                }
                let mediumBox = {
                    x: xx + ww * 0.13,
                    y: 0,
                    w: ww * 0.3,
                    h: box.mapping.h,
                }
                let smallBox = {
                    x: xx + ww * 0.45,
                    y: 0,
                    w: ww * 0.54,
                    h: box.mapping.h,
                }
                let gt = gback.append('g')
                    .attr('id', 'telsMapping')
                    .attr('transform', 'translate(' + box.mapping.x + ',' + box.mapping.y + ')')
                let telescopeRunning = new TelescopeDisplayer({
                    main: {
                        tag: 'telescopeMapping',
                        g: gt,
                        scroll: {
                        },
                        box: box.mapping,
                        background: {
                            fill: 'none',
                            stroke: '#000000',
                            strokeWidth: 0,
                        },
                        is_south: is_south,
                        color_theme: color_theme,
                    },

                    displayer: 'gridBib',
                    gridBib: {
                        header: {
                            text: {
                                size: 9,
                                color: color_theme.medium.background,
                            },
                            background: {
                                height: 10,
                                color: color_theme.dark.stroke,
                            },
                        },
                        telescope: {
                            enabled: true,
                            centering: false,
                            large: {
                                g: undefined,
                                opt: {
                                    telsPerRow: 1,
                                    nbl: 0,
                                    size: 1.4,
                                    ratio: 1,
                                },
                                box: largeBox,
                            },
                            medium: {
                                g: undefined,
                                opt: {
                                    telsPerRow: 3,
                                    nbl: 0,
                                    size: 0.9,
                                    ratio: 1,
                                },
                                box: mediumBox,
                            },
                            small: {
                                g: undefined,
                                opt: {
                                    telsPerRow: 6,
                                    nbl: 0,
                                    size: 0.84,
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
                                    color: 'none',
                                    opacity: 0,
                                },
                                side: {
                                    color: 'none',
                                    opacity: 0,
                                },
                            },
                        },
                        blocks: {
                            txt_size: 0,
                            right: {
                                enabled: false,
                            },
                            left: {
                                enabled: false,
                            },
                        },
                    },

                    filters: {
                        telescopeFilters: [],
                        filtering: [],
                    },
                    data: {
                        raw: {
                            telescopes: shared.data.server.inst_health,
                            blocks: [], // shared.data.server.blocks.run
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
                                cleanBack(); display = undefined; focusManager.focusOn('telescope', d.id)
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
                    input: {
                        over: {
                            telescope: undefined,
                        },
                        focus: {
                            telescope: undefined,
                        },
                    },
                })
                telescopeRunning.init()
                telescopeRunning.update_data({
                    data: {
                        raw: {
                            telescopes: shared.data.server.inst_health,
                            blocks: [], // shared.data.server.blocks.run
                        },
                        modified: [],
                    },
                })
            }

            new_d3_node(gfore,
                'rect',
                {
                    'x': box.icons.x + box.icons.w * 0.6,
                    'y': box.icons.y + box.icons.h * 0.025,
                    'width': box.icons.w * 0.3,
                    height: box.icons.h * 0.3,
                    fill: color_theme.dark.background,
                    stroke: color_theme.dark.stroke,
                    'stroke-width': 0.2,
                    'rx': 2,
                }
            ).on('click', function() {
                if (display) {
                    cleanBack()
                    if (display === 'blocks') {
                        display = undefined
                        return
                    }
                }
                display = 'blocks'
                createBlockMapping()
            }).on('mouseover', function() {
                d3.select(this).attr('fill', color_theme.darker.background)
            }).on('mouseout', function() {
                d3.select(this).attr('fill', color_theme.dark.background)
            })
            new_d3_node(gfore,
                'svg:image',
                {
                    'x': box.icons.x + box.icons.w * 0.65,
                    'y': box.icons.y + box.icons.h * 0.075,
                    'width': box.icons.w * 0.2,
                    height: box.icons.h * 0.2,
                    'xlink:href': '/static/icons/blocks.svg',
                },
                {
                    'pointer-events': 'none',
                    opacity: 0.6,
                }
            )

            new_d3_node(gfore,
                'rect',
                {
                    'x': box.icons.x + box.icons.w * 0.6,
                    'y': box.icons.y + box.icons.h * 0.35,
                    'width': box.icons.w * 0.3,
                    height: box.icons.h * 0.3,
                    fill: color_theme.dark.background,
                    stroke: color_theme.dark.stroke,
                    'stroke-width': 0.2,
                    'rx': 2,
                }
            ).on('click', function() {
                if (display) {
                    cleanBack()
                    if (display === 'targets') {
                        display = undefined
                        return
                    }
                }
                display = 'targets'
                create_targetsMapping()
            }).on('mouseover', function() {
                d3.select(this).attr('fill', color_theme.darker.background)
            }).on('mouseout', function() {
                d3.select(this).attr('fill', color_theme.dark.background)
            })
            new_d3_node(gfore,
                'svg:image',
                {
                    'x': box.icons.x + box.icons.w * 0.65,
                    'y': box.icons.y + box.icons.h * 0.4,
                    'width': box.icons.w * 0.2,
                    height: box.icons.h * 0.2,
                    'xlink:href': '/static/icons/target.svg',
                },
                {
                    'pointer-events': 'none',
                    opacity: 0.6,
                }
            )

            new_d3_node(gfore,
                'rect',
                {
                    'x': box.icons.x + box.icons.w * 0.6,
                    'y': box.icons.y + box.icons.h * 0.675,
                    'width': box.icons.w * 0.3,
                    height: box.icons.h * 0.3,
                    fill: color_theme.dark.background,
                    stroke: color_theme.dark.stroke,
                    'stroke-width': 0.2,
                    'rx': 2,
                }
            ).on('click', function() {
                if (display) {
                    cleanBack()
                    if (display === 'telescopes') {
                        display = undefined
                        return
                    }
                }
                display = 'telescopes'
                createTelescopesMapping()
            }).on('mouseover', function() {
                d3.select(this).attr('fill', color_theme.darker.background)
            }).on('mouseout', function() {
                d3.select(this).attr('fill', color_theme.dark.background)
            })
            new_d3_node(gfore,
                'svg:image',
                {
                    'x': box.icons.x + box.icons.w * 0.65,
                    'y': box.icons.y + box.icons.h * 0.725,
                    'width': box.icons.w * 0.2,
                    height: box.icons.h * 0.2,
                    'xlink:href': '/static/icons/telescope.svg',
                },
                {
                    'pointer-events': 'none',
                    opacity: 0.6,
                }
            )
        }

        let allBox

        function initOverview() {
            reserved.overview = {
                modifications: {
                },
                conflicts: {
                },
            }
            allBox = {
                blocks: {
                    x: 0,
                    y: reserved.box.h * 0.2,
                    w: reserved.box.w * 0.8,
                    h: reserved.box.h * 0.2,
                },
                modifications: {
                    x: 0,
                    y: reserved.box.h * 0.18,
                    h: reserved.box.h * 0.62,
                    w: reserved.box.w,
                },
                conflicts: {
                    x: reserved.box.w * 0.8,
                    y: reserved.box.h * 0.85,
                    w: reserved.box.w * 0.2,
                    h: reserved.box.h * 0.15,
                },
                summaryMetrics: {
                    x: reserved.box.w * 0.0,
                    y: reserved.box.h * 0.85,
                    w: reserved.box.w * 0.8,
                    h: reserved.box.h * 0.15,
                },
            }
            function createModifications_information() {
                let box = allBox.modifications
                let g = reserved.g.append('g')
                    .attr('id', 'modifications_information')
                    .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
                box.y = 0
                g.append('text')
                    .text('Modifications')
                    .attr('x', box.w * 0.01)
                    .attr('y', box.y)
                    .style('font-weight', 'bold')
                    .attr('text-anchor', 'start')
                    .style('font-size', title_size + 'px')
                    .style('pointer-events', 'none')
                    .attr('fill', color_theme.dark.text)
                    .attr('stroke', 'none')
                box.y += 2
                g.append('line')
                    .attr('x1', 0)
                    .attr('y1', box.y)
                    .attr('x2', reserved.box.w)
                    .attr('y2', box.y)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.2)
                g.append('rect')
                    .attr('id', 'headerStrip')
                    .attr('x', 0)
                    .attr('y', box.y)
                    .attr('width', box.w)
                    .attr('height', headerSize)
                    .attr('fill', color_theme.dark.stroke)
                let label = [
                    {
                        x: box.w * 0.0,
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        w: box.w * 0.13,
                        text: 'Scheds',
                    },
                    {
                        x: box.w * 0.13,
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        w: box.w * 0.13,
                        text: 'Blocks',
                    },
                    {
                        x: box.w * (0.26 + 0.185 * 0),
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        w: box.w * 0.185,
                        text: 'State',
                    },
                    {
                        x: box.w * (0.26 + 0.185 * 1),
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        w: box.w * 0.185,
                        text: 'Scheduled',
                    },
                    {
                        x: box.w * (0.26 + 0.185 * 2),
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        w: box.w * 0.185,
                        text: 'Pointing',
                    },
                    {
                        x: box.w * (0.26 + 0.185 * 3),
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        w: box.w * 0.185,
                        text: 'Telescope',
                    },
                ]
                for (let i = 0; i < label.length; i++) {
                    g.append('text')
                        .text(label[i].text)
                        .style('fill', color_theme.medium.background)
                        .style('font-weight', 'bold')
                        .style('font-size', txt_size + 'px')
                        .attr('text-anchor', 'start')
                        .attr('transform', 'translate(' + (label[i].x) + ',' + (label[i].y) + ')')
                }

                box.y += 10
                box.h -= 16
                let scrollg = g.append('g')
                    .attr('id', 'modifications_information')
                    .attr('transform', 'translate(' + 0 + ',' + box.y + ')')
                reserved.overview.modifications.scrollBox = new ScrollBox()
                reserved.overview.modifications.scrollBox.init({
                    main: {
                        tag: 'modificationsListScroll',
                        g: scrollg,
                        box: box,
                    },
                })
                g.append('line')
                    .attr('x1', 0)
                    .attr('y1', box.y + box.h - 2)
                    .attr('x2', reserved.box.w)
                    .attr('y2', box.y + box.h - 2)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.4)
            }
            function createConflicts_information() {
                let box = allBox.conflicts
                let g = reserved.g.append('g')
                    .attr('id', 'conflicts_information')
                    .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
                box.y = 0
                g.append('text')
                    .text('Conflicts')
                    .attr('x', box.w * 0.01)
                    .attr('y', box.y)
                    .style('font-weight', 'bold')
                    .attr('text-anchor', 'start')
                    .style('font-size', title_size + 'px')
                    .style('pointer-events', 'none')
                    .attr('fill', color_theme.dark.text)
                    .attr('stroke', 'none')
                box.y += 2
                g.append('line')
                    .attr('x1', 0)
                    .attr('y1', box.y)
                    .attr('x2', box.w)
                    .attr('y2', box.y)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.2)
                let line = 38
                let marg = 4
                g.append('rect')
                    .attr('x', marg)
                    .attr('y', marg)
                    .attr('width', line)
                    .attr('height', line)
                    .attr('open', false)
                    .attr('fill', colorPalette.dark.background)
                    .attr('stroke', colorPalette.dark.stroke)
                    .attr('stroke-width', 0.1)
                    .style('opacity', 0.2)
                g.append('text')
                    .text('Obs')
                    .attr('x', marg + line * 0.5)
                    .attr('y', marg + line * 0.3 + title_size * 0.33)
                    .style('font-weight', '')
                    .attr('text-anchor', 'middle')
                    .style('font-size', title_size + 'px')
                    .style('pointer-events', 'none')
                    .attr('fill', colorPalette.dark.text)
                    .attr('stroke', 'none')
                    .style('opacity', 0.2)
                g.append('text')
                    .text('L M S')
                    .attr('x', marg + line * 0.5)
                    .attr('y', marg + line * 0.66 + title_size * 0.33)
                    .style('font-weight', '')
                    .attr('text-anchor', 'middle')
                    .style('font-size', headerSize + 'px')
                    .style('pointer-events', 'none')
                    .attr('fill', colorPalette.dark.text)
                    .attr('stroke', 'none')
                    .style('opacity', 0.2)

                reserved.overview.conflicts.scrollBox = new ScrollBox()
                reserved.overview.conflicts.scrollBox.init({
                    main: {
                        tag: 'conflictListScroll',
                        g: g,
                        box: box,
                    },
                })
            }
            function createSummaryMetrics() {
                let adjustedBox = allBox.summaryMetrics
                let g = reserved.g.append('g')
                    .attr('id', 'summaryMetrics')
                    .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
                g.append('text')
                    .text('Projected')
                    .attr('x', (adjustedBox.w * 0.23))
                    .attr('y', adjustedBox.h * 0.15)
                    .style('fill', '#000000')
                    .style('font-weight', '')
                    .style('font-size', 11 + 'px')
                    .style('font-weight', 'bold')
                    .attr('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                g.append('text')
                    .text('Processed')
                    .attr('x', (adjustedBox.w * 0.23))
                    .attr('y', adjustedBox.h * 0.99)
                    .style('fill', '#000000')
                    .style('font-weight', '')
                    .style('font-size', 11 + 'px')
                    .style('font-weight', 'bold')
                    .attr('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                g.append('rect')
                    .attr('x', adjustedBox.w * 0.03)
                    .attr('y', adjustedBox.h * 0.2)
                    .attr('width', adjustedBox.w * 0.4)
                    .attr('height', 20)
                    .attr('fill', colorPalette.darker.background)
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 0.4)
                g.append('rect')
                    .attr('x', adjustedBox.w * 0.03)
                    .attr('y', adjustedBox.h * 0.55)
                    .attr('width', adjustedBox.w * 0.4)
                    .attr('height', 20)
                    .attr('fill', colorPalette.darker.background)
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 0.4)
                let tg = g.append('g')
                    .attr('transform', 'translate(' + (adjustedBox.w * 0.36) + ',' + (adjustedBox.h * 0.0) + ')')
                for (let i = 0; i < 6; i++) {
                    target_icon(tg.append('g').attr('transform', 'translate(' + (adjustedBox.w * 0.12 + (parseInt(i / 3)) * adjustedBox.w * 0.16) + ',' + (adjustedBox.h * 0.05 + adjustedBox.h * 0.3 * (i % 3)) + ')'),
                        {
                            w: 24,
                            h: 24,
                        }, 'T' + i, {
                            click: function() {},
                            over: function() {},
                            out: function() {},
                        }, colorPalette)
                    tg.append('text')
                        .text(Math.floor(100 - (Math.random() * 20), 2) + '%')
                        .attr('x', (adjustedBox.w * 0.16 + (parseInt(i / 3)) * adjustedBox.w * 0.16) + 13)
                        .attr('y', (adjustedBox.h * 0.05 + adjustedBox.h * 0.3 * (i % 3)) + 16)
                        .style('fill', '#000000')
                        .style('font-weight', '')
                        .style('font-size', 11 + 'px')
                        .attr('text-anchor', 'start')
                        .style('pointer-events', 'none')
                }
            }

            createModifications_information()
            createConflicts_information()
            createSummaryMetrics()
        }

        function openOtherBlocks(conflict) {
            allBox = {
                blocks: {
                    x: 0,
                    y: 0,
                    w: reserved.box.w * 0.8,
                    h: reserved.box.h * 0.2,
                },
                modifications: {
                    x: 0,
                    y: reserved.box.h * 0.125,
                    h: reserved.box.h * 0.42,
                    w: reserved.box.w,
                },
                conflicts: {
                    x: 0,
                    y: reserved.box.h * 0.62,
                    w: reserved.box.w,
                    h: reserved.box.h * 0.37,
                },
            }
            reserved.g.select('g#conflicts_information').select('g#otherg').remove()
            // svg_events_queue_server.blurry()
            // svg_blocks_queue_server.blurry()
            // svgBrush.blurry()
            // svgTargets.blurry()
            // svgTelsConflict.blurry()
            // svgFocusOverlay.blurry()

            let allTel = shared.data.server.inst_health
            let innerOtherBlock = {
            }
            let box = {
                x: 0,
                y: -6,
                w: allBox.conflicts.w,
                h: allBox.modifications.h * 1.4 + 70,
            }
            let otherg = reserved.g.select('g#conflicts_information').append('g').attr('id', 'otherg')
                .attr('transform', 'translate(' + 0 + ',' + (-allBox.modifications.h * 1.75) + ')')
            otherg.append('rect')
                .attr('id', 'background')
                .attr('x', box.x)
                .attr('y', box.y)
                .attr('width', box.w)
                .attr('height', box.h)
                .attr('fill', colorPalette.bright.background)
            let scroll = new ScrollBox()
            scroll.init({
                main: {
                    tag: 'focusedConflictListScroll',
                    g: otherg,
                    box: box,
                },
            })
            function initTelescope_information(block, box) {
                innerOtherBlock[block.obs_block_id] = {
                }
                let g = scroll.get_content().append('g')
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
                box.x = 45
                g.append('text')
                    .text(block.metadata.block_name)
                    .attr('x', box.x)
                    .attr('y', box.y + title_size * 1.5)
                    .style('font-weight', 'bold')
                    .attr('text-anchor', 'end')
                    .style('font-size', title_size + 'px')
                    .style('pointer-events', 'none')
                    .attr('fill', colorPalette.dark.text)
                    .attr('stroke', 'none')
                box.x = 50
                box.w -= 60
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
                    w: box.w * 0.35,
                    h: box.h,
                }
                let smallBox = {
                    x: box.w * 0.51,
                    y: 0,
                    w: box.w * 0.49,
                    h: box.h,
                }
                box.h -= title_size * 2
                let gt = g.append('g')
                    .attr('id', 'telsDisplayer')
                    .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
                console.log(('BOX', box))
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
                        for (let i = data.min; i < data.ids.length; i++) {
                            let t = data.ids[0]
                            forceExtractTelsFromBlock([ block ], t)
                            // addTelescopeToBlock(com.data.block, {id: t})
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
                                for (let i = 0; i < conflict.blocks.length; i++) {
                                    if (conflict.blocks[i].telescopes[type].ids.indexOf(d.id) !== -1) {
                                        return false
                                    }
                                }
                                return true
                            })
                            for (let i = 0; (i < diff && i < idle.length); i++) {
                                addTelescopeToBlock(block, idle[i])
                            }
                            for (let i = data.ids.length; i < data.min; i++) {
                                let t = extractRandomTelsFromBlock(conflict.blocks.filter(d => d.obs_block_id !== block.obs_block_id), type)
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

                    for (let i = 0; i < conflict.blocks.length; i++) {
                        innerOtherBlock[conflict.blocks[i].obs_block_id].updateOtherInput()
                        innerOtherBlock[conflict.blocks[i].obs_block_id].updateOtherTelescope_information()
                    }
                    updateTotals()
                    svgTelsConflict.drawTelsAvailabilityCurve()
                    // linkConflicts()
                    // update_input()
                    // updateTelescope_information()
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
                        x: box.x + (5 + mediumBox.x + mediumBox.w * 0.5 - 20),
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
            let sizeRow = (allBox.modifications.h * 1.5) / 6
            for (let i = 0; i < conflict.blocks.length; i++) {
                let ibox = {
                    x: 0,
                    y: sizeRow * i + (conflict.blocks.length < 6 ? (sizeRow * (5.5 - conflict.blocks.length)) : 0),
                    w: allBox.conflicts.w * 1,
                    h: sizeRow,
                }
                initTelescope_information(conflict.blocks[i], ibox)
            }
            scroll.updated_content()

            otherg.append('line')
                .attr('x1', 0)
                .attr('y1', allBox.modifications.h * 1.4)
                .attr('x2', box.w)
                .attr('y2', allBox.modifications.h * 1.4)
                .attr('stroke', colorPalette.dark.stroke)
                .attr('stroke-width', 0.4)
            otherg.append('rect')
                .attr('id', 'isbalanced')
                .attr('x', 0)
                .attr('y', allBox.modifications.h * 1.4)
                .attr('width', box.w)
                .attr('height', allBox.modifications.h * 0.2)
                .attr('fill', function() {
                    return '#FFCCBC'
                })
            otherg.append('text')
                .text('Totals:')
                .attr('x', box.w * 0.12)
                .attr('y', allBox.modifications.h * 1.5)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'end')
                .style('font-size', title_size + 'px')
                .style('pointer-events', 'none')
                .attr('fill', colorPalette.dark.text)
                .attr('stroke', 'none')
            otherg.append('text')
                .attr('id', 'totalLarge')
                .text(conflict.blocks.reduce((accumulator, currentValue) => accumulator + currentValue.telescopes.large.min, 0))
                .attr('x', box.w * 0.23)
                .attr('y', allBox.modifications.h * 1.5)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'end')
                .style('font-size', title_size + 'px')
                .style('pointer-events', 'none')
                .attr('fill', colorPalette.dark.text)
                .attr('stroke', 'none')
            otherg.append('text')
                .attr('id', 'totalMedium')
                .text(conflict.blocks.reduce((accumulator, currentValue) => accumulator + currentValue.telescopes.medium.min, 0))
                .attr('x', box.w * 0.45)
                .attr('y', allBox.modifications.h * 1.5)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'end')
                .style('font-size', title_size + 'px')
                .style('pointer-events', 'none')
                .attr('fill', colorPalette.dark.text)
                .attr('stroke', 'none')
            otherg.append('text')
                .attr('id', 'totalSmall')
                .text(conflict.blocks.reduce((accumulator, currentValue) => accumulator + currentValue.telescopes.small.min, 0))
                .attr('x', box.w * 0.78)
                .attr('y', allBox.modifications.h * 1.5)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'end')
                .style('font-size', title_size + 'px')
                .style('pointer-events', 'none')
                .attr('fill', colorPalette.dark.text)
                .attr('stroke', 'none')

            otherg.append('text')
                .text('/4')
                .attr('x', box.w * 0.27)
                .attr('y', allBox.modifications.h * 1.54)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'end')
                .style('font-size', title_size + 'px')
                .style('pointer-events', 'none')
                .attr('fill', colorPalette.dark.text)
                .attr('stroke', 'none')
            otherg.append('text')
                .text('/25')
                .attr('x', box.w * 0.5)
                .attr('y', allBox.modifications.h * 1.54)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'end')
                .style('font-size', title_size + 'px')
                .style('pointer-events', 'none')
                .attr('fill', colorPalette.dark.text)
                .attr('stroke', 'none')
            otherg.append('text')
                .text('/70')
                .attr('x', box.w * 0.84)
                .attr('y', allBox.modifications.h * 1.54)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'end')
                .style('font-size', title_size + 'px')
                .style('pointer-events', 'none')
                .attr('fill', colorPalette.dark.text)
                .attr('stroke', 'none')

            otherg.append('rect')
                .attr('id', 'validateConflict')
                .attr('x', box.w - 24)
                .attr('y', allBox.modifications.h * 1.4 + (allBox.modifications.h * 0.2 - 20) * 0.5)
                .attr('width', 20)
                .attr('height', 20)
                .attr('fill', colorPalette.darker.background)
                .attr('stroke', colorPalette.darker.stroke)
                .attr('stroke-width', 0.1)
                .style('opacity', 0)
                .on('click', function() {
                    for (let i = 0; i < conflict.blocks.length; i++) {
                        reassignTelescope(conflict.blocks[i])
                    }
                    blockQueue.highlightBlocks([])
                    closeOtherBlocks()
                    svgTelsConflict.drawTelsAvailabilityCurve()
                    // listAllConflicts()
                    linkConflicts()
                })
                .on('mouseover', function() {
                    d3.select(this).attr('fill', colorPalette.darkest.background)
                })
                .on('mouseout', function(d) {
                    d3.select(this).attr('fill', colorPalette.darker.background)
                })
            otherg.append('image')
                .attr('id', 'checkedConflict')
                .attr('xlink:href', '/static/icons/checked.svg')
                .attr('x', box.w - 20)
                .attr('y', allBox.modifications.h * 1.4 + (allBox.modifications.h * 0.2 - 20) * 0.5 + 4)
                .attr('width', 12)
                .attr('height', 12)
                .style('opacity', 0)
                .style('pointer-events', 'none')
            function updateTotals() {
                let l = conflict.blocks.reduce((accumulator, currentValue) => accumulator + Number(currentValue.telescopes.large.min), 0)
                let m = conflict.blocks.reduce((accumulator, currentValue) => accumulator + Number(currentValue.telescopes.medium.min), 0)
                let s = conflict.blocks.reduce((accumulator, currentValue) => accumulator + Number(currentValue.telescopes.small.min), 0)
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
            updateTotals()
        }
        function closeOtherBlocks() {
            reserved.g.select('g#conflicts_information').select('g#otherg').remove()
            svgTelsConflict.drawTelsAvailabilityCurve()
        }
        function focusOnConflict(d) {
            if (shared.focus) {
                focusManager.focusOn(shared.focus.type, shared.focus.id)
            }
            if (!conflictFocused.d) {
                conflictFocused = d
                openOtherBlocks(d.d)
            }
            else if (conflictFocused.d.id === d.d.id) {
                conflictFocused = {
                    d: undefined,
                    d3: undefined,
                }
                closeOtherBlocks(d)
            }
            else {
                conflictFocused = d
                closeOtherBlocks(d)
                openOtherBlocks(d.d)
            }
        }
        this.focusOnConflict = focusOnConflict
        function updateOverview() {
            if (shared.focus) {
                return
            }
            function updateModifications_information() {
                if (!shared.data.copy) {
                    return
                }
                let box = allBox.modifications
                let innerg = reserved.overview.modifications.scrollBox.get_content()
                let line = 25
                let marg = 2
                let labels = [
                    {
                        x: box.w * 0.0,
                        w: box.w * 0.13,
                    },
                    {
                        x: box.w * 0.13,
                        w: box.w * 0.13,
                    },
                    {
                        x: box.w * (0.26 + 0.185 * 0),
                        w: box.w * 0.185,
                    },
                    {
                        x: box.w * (0.26 + 0.185 * 1),
                        w: box.w * 0.185,
                    },
                    {
                        x: box.w * (0.26 + 0.185 * 2),
                        w: box.w * 0.185,
                    },
                    {
                        x: box.w * (0.26 + 0.185 * 3),
                        w: box.w * 0.185,
                    },
                ]

                let popupOffset = 0

                let sched_index = 0
                let block_index = 0
                let prop_index = 0

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
                        g.append('path')
                            .attr('id', 'backpath')
                            .attr('fill', 'none')
                            .attr('stroke', colorPalette.darker.background)
                            .attr('stroke-width', 2)
                        g.append('g').attr('id', 'blocks')
                        let header = g.append('g').attr('id', 'header')

                        let dimPoly = line
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
                        header.selectAll('polygon')
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
                                focusManager.focusOn('sched_block', d.id)
                            })
                            .on('mouseover', function(e, d) {
                                d3.select(this).style('cursor', 'pointer')
                                d3.select(this).attr('fill', colorPalette.darker.background)
                            })
                            .on('mouseout', function(e, d) {
                                d3.select(this).style('cursor', 'default')
                                d3.select(this).attr('fill', colorPalette.dark.background)
                            })
                            .attr('transform', 'translate(' + ((labels[0].w - dimPoly) * 0.5) + ',' + ((line - dimPoly) * 0.5) + ')')
                        header.append('text')
                            .text('S' + d.blocks[0].metadata.n_sched)
                            .style('fill', colorPalette.dark.text)
                            .style('font-weight', 'bold')
                            .style('font-size', title_size + 'px')
                            .attr('text-anchor', 'middle')
                            .attr('transform', 'translate(' + (labels[0].w * 0.5) + ',' + (line * 0.5 + txt_size * 0.3) + ')')
                            .style('pointer-events', 'none')
                    })
                    let merge = current.merge(enter)
                    merge.each(function(d, i) {
                        let g = d3.select(this)
                        g.attr('transform', 'translate(' + -5 + ',' + (sched_index * (line + marg) + offset) + ')')

                        let points = [{
                            x: labels[0].w * 0.5,
                            y: labels[0].w * 0.5,
                        }]
                        for (let j = 0; j < d.blocks.length; j++) {
                            points.push({
                                x: labels[0].w * 0.5,
                                y: (line + marg) * ((j + 1) + 0.5),
                            })
                            points.push({
                                x: line * 2,
                                y: (line + marg) * ((j + 1) + 0.5),
                            })
                            points.push({
                                x: labels[0].w * 0.5,
                                y: (line + marg) * ((j + 1) + 0.5),
                            })
                        }
                        let lineGenerator = d3.line()
                            .x(function(d) {
                                return d.x
                            })
                            .y(function(d) {
                                return d.y
                            })
                            .curve(d3.curveLinear)
                        g.select('path#backpath')
                            .attr('d', lineGenerator(points))
                        // innerOffset += line
                        block_index = 1
                        blockCore(d.blocks, g.select('g#header'), 0)
                        sched_index += block_index
                        // index += 1
                    })
                    current
                        .exit()
                        .transition('in_out')
                        .duration(times.anim)
                        .style('opacity', 0)
                        .remove()
                }
                function blockCore(blocks, maing, offset) {
                    let current = maing
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
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('width', line)
                            .attr('height', line)
                            .attr('fill', function() {
                                return palette.color.background
                            })
                            .attr('stroke', palette.color.stroke)
                            .attr('stroke-width', 0.1)
                            .on('click', function() {})
                            .on('mouseover', function(e, d) {
                                d3.select(this).style('cursor', 'pointer')
                                d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
                            })
                            .on('mouseout', function(e, d) {
                                d3.select(this).style('cursor', 'default')
                                d3.select(this).attr('fill', palette.color.background)
                            })
                        g.append('text')
                            .text(d.metadata.n_obs)
                            .style('fill', '#000000')
                            .style('font-weight', 'bold')
                            .style('font-size', headerSize + 'px')
                            .attr('text-anchor', 'middle')
                            .attr('transform', 'translate(' + (line * 0.5) + ',' + (line * 0.5 + txt_size * 0.3) + ')')
                            .style('pointer-events', 'none')
                        g.append('rect')
                            .attr('width', 12)
                            .attr('height', 12)
                            .attr('x', -line * 0.7)
                            .attr('y', line * 0.4)
                            .attr('fill', function() {
                                return 'transparent'
                            })
                            .on('click', function() {})
                            .on('mouseover', function(e, d) {
                                d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
                            })
                            .on('mouseout', function(e, d) {
                                d3.select(this).attr('fill', 'transparent')
                            })
                    })
                    let merge = current.merge(enter)
                    merge.each(function(d, i) {
                        let g = d3.select(this)
                        g.attr('transform', 'translate(' + (labels[1].x) + ',' + (offset + (line + marg) * block_index) + ')')
                        let old = getBlockById(get_blocksData('server'), d.obs_block_id).data
                        let diff = checkBlocksDifference(old, d)
                        prop_index = 0
                        // g.selectAll('g#props').remove()
                        propCore(diff, g, 0)
                        block_index += 1
                    })
                    current
                        .exit()
                        .transition('in_out')
                        .duration(times.anim)
                        .style('opacity', 0)
                        .remove()
                }
                function propCore(props, g, offset) {
                    function drawDiffTime(g, d) {
                        let localoffset = (line + marg) * (prop_index + block_index + sched_index)
                        function drawHoverClock() {
                            let timeSOld = new Date(shared.data.server.time_information.night_start_sec)
                            timeSOld.setSeconds(timeSOld.getSeconds() + d.start.old)
                            let timeSNew = new Date(shared.data.server.time_information.night_start_sec)
                            timeSNew.setSeconds(timeSNew.getSeconds() + d.start.new)

                            let g = reserved.g.select('g#modifications_information')
                            let clockg = g.append('g')
                                .attr('id', 'clockhover')
                                .style('pointer-events', 'none')
                                .attr('transform', function() {
                                    let tx = 0
                                    let ty = localoffset + popupOffset
                                    return 'translate(' + tx + ',' + ty + ')'
                                })
                            clockg.append('rect')
                                .attr('x', labels[3].x - 38)
                                .attr('y', line * 0.5)
                                .attr('width', 40)
                                .attr('height', line)
                                .attr('fill', colorPalette.dark.background)
                                .attr('stroke', colorPalette.dark.stroke)
                                .attr('stroke-width', 0.2)
                                .attr('rx', 2)

                            clockg.append('image')
                                .attr('xlink:href', '/static/icons/arrow-curve-rtl.svg')
                                .attr('x', 0)
                                .attr('y', 0)
                                .attr('width', line * 1)
                                .attr('height', line * 1)
                                .style('opacity', 0.8)
                                .style('pointer-events', 'none')
                                .attr('transform', 'translate(' + (labels[3].x - 38) + ',' + (line * 1.4) + '), rotate(-90) scale(0.75,0.65)')
                            clockg.append('text')
                                .text(d3.timeFormat('%H:%M')(timeSOld))
                                .style('fill', '#000000')
                                .style('font-weight', '')
                                .style('font-size', headerSize + 'px')
                                .attr('text-anchor', 'middle')
                                .attr('transform', 'translate(' + (labels[3].x - 12) + ',' + (line * 0.83 + txt_size * 0.3) + ')')
                                .style('pointer-events', 'none')
                            clockg.append('text')
                                .text(d3.timeFormat('%H:%M')(timeSNew))
                                .style('fill', '#000000')
                                .style('font-weight', '')
                                .style('font-size', headerSize + 'px')
                                .attr('text-anchor', 'middle')
                                .attr('transform', 'translate(' + (labels[3].x - 12) + ',' + (line * 1.3 + txt_size * 0.3) + ')')
                                .style('pointer-events', 'none')
                        }
                        function drawHoverSandclock() {
                            let timeSOld = new Date()
                            timeSOld.setHours(d.duration.old / 3600)
                            timeSOld.setMinutes((d.duration.old % 3600) / 60)
                            // timeSOld.setHours(d.duration.old % 3600)
                            let timeSNew = new Date()
                            timeSNew.setHours(d.duration.new / 3600)
                            timeSNew.setMinutes((d.duration.new % 3600) / 60)

                            let g = reserved.g.select('g#modifications_information')
                            let clockg = g.append('g')
                                .attr('id', 'sandclockhover')
                                .style('pointer-events', 'none')
                                .attr('transform', function() {
                                    let tx = 0
                                    let ty = localoffset + popupOffset
                                    return 'translate(' + tx + ',' + ty + ')'
                                })
                            clockg.append('rect')
                                .attr('x', labels[3].x + labels[3].w - 12)
                                .attr('y', line * 0.5)
                                .attr('width', 40)
                                .attr('height', line)
                                .attr('fill', colorPalette.dark.background)
                                .attr('stroke', colorPalette.dark.stroke)
                                .attr('stroke-width', 0.2)
                                .attr('rx', 2)
                            clockg.append('image')
                                .attr('xlink:href', '/static/icons/arrow-curve-rtl.svg')
                                .attr('x', 0)
                                .attr('y', 0)
                                .attr('width', line * 1)
                                .attr('height', line * 1)
                                .style('opacity', 0.8)
                                .style('pointer-events', 'none')
                                .attr('transform', 'translate(' + (labels[3].x + labels[3].w + 30) + ',' + (line * 1.4) + '), rotate(-90) scale(0.75,-0.65)')
                            clockg.append('text')
                                .text(d3.timeFormat('%H:%M')(timeSOld))
                                .style('fill', '#000000')
                                .style('font-weight', '')
                                .style('font-size', headerSize + 'px')
                                .attr('text-anchor', 'middle')
                                .attr('transform', 'translate(' + (labels[3].x + labels[3].w + 3) + ',' + (line * 0.83 + txt_size * 0.3) + ')')
                                .style('pointer-events', 'none')
                            clockg.append('text')
                                .text(d3.timeFormat('%H:%M')(timeSNew))
                                .style('fill', '#000000')
                                .style('font-weight', '')
                                .style('font-size', headerSize + 'px')
                                .attr('text-anchor', 'middle')
                                .attr('transform', 'translate(' + (labels[3].x + labels[3].w + 3) + ',' + (line * 1.3 + txt_size * 0.3) + ')')
                                .style('pointer-events', 'none')
                        }
                        let offset = labels[3].x - labels[1].x - labels[1].w

                        if (d.start.new !== d.start.old) {
                            if (!g.select('rect#timeStart').empty()) {
                                g.select('image#timeStartIncDec')
                                    .attr('xlink:href', '/static/icons/arrow-' + (d.start.new > d.start.old ? 'right' : 'left') + '.svg')
                            }
                            else {
                                g.append('rect')
                                    .attr('id', 'timeStart')
                                    .attr('x', offset + labels[3].w * 0.15)
                                    .attr('y', line * 0.0)
                                    .attr('width', line * 0.66)
                                    .attr('height', line)
                                    .attr('fill', 'transparent')
                                    .attr('rx', 0)
                                    .on('mouseover', function() {
                                        d3.select(this).attr('fill', colorPalette.darkest.background)
                                        drawHoverClock()
                                    })
                                    .on('mouseout', function() {
                                        d3.select(this).attr('fill', 'transparent')
                                        reserved.g.selectAll('g#clockhover').remove()
                                    })
                                g.append('image')
                                    .attr('id', 'timeStartIncDec')
                                    .attr('xlink:href', '/static/icons/arrow-' + (d.start.new > d.start.old ? 'right' : 'left') + '.svg')
                                    .attr('x', offset + line * 0.33) //  + (d.start.new > d.start.old ? 4 : -4))
                                    .attr('y', line * 0.0)
                                    .attr('width', line * 0.66)
                                    .attr('height', line * 0.33)
                                    .style('opacity', 0.8)
                                    .style('pointer-events', 'none')
                                g.append('image')
                                    .attr('xlink:href', '/static/icons/clock.svg')
                                    .attr('x', offset + labels[3].w * 0.15)
                                    .attr('y', line * 0.33)
                                    .attr('width', line * 0.66)
                                    .attr('height', line * 0.66)
                                    .style('opacity', 0.8)
                                    .style('pointer-events', 'none')
                            }
                        }
                        if (d.duration.new !== d.duration.old) {
                            if (!g.select('rect#timesuration').empty()) {
                                g.select('text#timesurationIncDec')
                                    .text(d.duration.new > d.duration.old ? '+' : '-')
                            }
                            else {
                                g.append('rect')
                                    .attr('id', 'timesuration')
                                    .attr('x', offset + labels[3].w * 0.85 - line * 0.66)
                                    .attr('y', line * 0.0)
                                    .attr('width', line * 0.66)
                                    .attr('height', line)
                                    .attr('fill', 'transparent')
                                    .attr('rx', 4)
                                    .on('mouseover', function() {
                                        d3.select(this).attr('fill', colorPalette.darkest.background)
                                        drawHoverSandclock()
                                    })
                                    .on('mouseout', function() {
                                        d3.select(this).attr('fill', 'transparent')
                                        reserved.g.selectAll('g#sandclockhover').remove()
                                    })
                                g.append('text')
                                    .attr('id', 'timesurationIncDec')
                                    .text(d.duration.new > d.duration.old ? '+' : '-')
                                    .style('fill', '#000000')
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (offset + labels[3].w * 0.85 - line * 0.33) + ',' + (txt_size * 0.8) + ')')
                                    .style('pointer-events', 'none')
                                g.append('image')
                                    .attr('xlink:href', '/static/icons/sandclock.svg')
                                    .attr('x', offset + labels[3].w * 0.85 - line * 0.66)
                                    .attr('y', line * 0.33)
                                    .attr('width', line * 0.66)
                                    .attr('height', line * 0.66)
                                    .style('opacity', 0.8)
                                    .style('pointer-events', 'none')
                            }
                        }
                    }
                    function drawDiffState(g, d) {
                        let offset = labels[2].x - labels[1].x - labels[1].w

                        if (!g.select('text').empty()) {
                            if (d.old) {
                                g.select('rect')
                                    .attr('fill', colorPalette.blocks[d.old === 'cancel' ? 'cancelOp' : d.old].background)
                                    .attr('stroke', colorPalette.blocks[d.old === 'cancel' ? 'cancelOp' : d.old].stroke)
                            }
                            g.select('text').text(d.old ? d.old.substring(0, 4) : 'New')
                            return
                        }
                        g.append('image')
                            .attr('xlink:href', '/static/icons/arrow-left.svg')
                            .attr('x', -line * 0.4)
                            .attr('y', line * 0.6)
                            .attr('width', line * 0.7)
                            .attr('height', line * 0.7)
                            .style('opacity', 0.8)
                            .style('pointer-events', 'none')
                            .attr('transform', 'translate(0, ' + 0 + ') scale(1,0.5)')
                        if (d.old) {
                            g.append('rect')
                                .attr('x', offset + labels[2].w * 0.3 - line * 0.16)
                                .attr('y', line * 0.275)
                                .attr('width', line * 0.45)
                                .attr('height', line * 0.45)
                                .attr('fill', colorPalette.blocks[d.old === 'cancel' ? 'cancelOp' : d.old].background)
                                .attr('stroke', colorPalette.blocks[d.old === 'cancel' ? 'cancelOp' : d.old].stroke)
                                .attr('stroke-width', 0.2)
                        }
                        g.append('text')
                            .text(d.old ? d.old.substring(0, 4) : 'New')
                            .style('fill', '#000000')
                            .style('font-weight', d.old ? '' : 'bold')
                            .style('font-size', headerSize + 'px')
                            .attr('text-anchor', 'start')
                            .attr('transform', 'translate(' + (offset + labels[2].w * 0.3 + (d.old ? line * 0.43 : 0)) + ',' + (line * 0.5 + txt_size * 0.35) + ')')
                            .style('pointer-events', 'none')
                    }
                    function drawDiffTels(g, d) {
                        let localoffset = (line + marg) * (prop_index + block_index + sched_index)
                        let marg1 = 6
                        let marg2 = 2
                        function drawHoverLarge() {
                            if (d.large.new.length === 0 && d.large.rem.length === 0) {
                                return
                            }
                            let marg = 2 * marg1 + ((d.large.new.length > 0 && d.large.rem.length > 0) ? marg1 * 2 : 0)
                            let newH = (title_size + marg2) * (parseInt(d.large.new.length / 2) + (d.large.new.length % 2 !== 0 ? 1 : 0))
                            let remH = (title_size + marg2) * (parseInt(d.large.rem.length / 2) + (d.large.rem.length % 2 !== 0 ? 1 : 0))

                            let g = reserved.g.select('g#modifications_information')
                            let largeg = g.append('g')
                                .attr('id', 'largehover')
                                .style('pointer-events', 'none')
                                .attr('transform', function() {
                                    let tx = 0
                                    let ty = localoffset + popupOffset
                                    return 'translate(' + tx + ',' + ty + ')'
                                })
                            largeg.append('rect')
                                .attr('x', labels[5].x - 55)
                                .attr('y', line * 0.5)
                                .attr('width', 54)
                                .attr('height', function() {
                                    return newH + marg * 0.5 - 1
                                })
                                .attr('fill', colorPalette.darker.background)
                                .attr('stroke-width', 0)
                            largeg.append('rect')
                                .attr('x', labels[5].x - 55)
                                .attr('y', line * 0.5 + marg * 0.5 + newH + 2)
                                .attr('width', 54)
                                .attr('height', function() {
                                    return remH + marg * 0.5 - 1
                                })
                                .attr('fill', colorPalette.darker.background)
                                .attr('stroke-width', 0)
                            largeg.append('rect')
                                .attr('x', labels[5].x - 55)
                                .attr('y', line * 0.5)
                                .attr('width', 54)
                                .attr('height', function() {
                                    return marg + newH + remH
                                })
                                .attr('fill', function() {
                                    if (d.large.new.length === 0) {
                                        return colorPalette.darker.background
                                    }
                                    else if (d.large.rem.length === 0) {
                                        return colorPalette.darker.background
                                    }
                                    else {
                                        return 'none'
                                    }
                                })
                                .attr('stroke', colorPalette.medium.stroke)
                                .attr('stroke-dasharray', function() {
                                    if (d.large.new.length === 0) {
                                        return [ 54 + newH + marg + remH + 20, 14, 20 + remH + marg + newH ]
                                    }
                                    else if (d.large.rem.length === 0) {
                                        return [ 20, 14, 20 + newH + marg + remH + 54 + remH + marg + newH ]
                                    }
                                    else {
                                        return [ 20, 14, 20 + newH, marg, remH + 20, 14, 20 + remH, marg, newH ]
                                    }
                                })
                                .attr('stroke-width', 1)
                            // .attr('rx', 2)
                            if (d.large.new.length > 0) {
                                largeg.append('text')
                                    .text('+')
                                    .attr('x', labels[5].x - 28)
                                    .attr('y', line * 0.5 + title_size * 0.33)
                                    .style('fill', '#000000')
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .style('pointer-events', 'none')
                            }
                            if (d.large.rem.length > 0) {
                                largeg.append('text')
                                    .text('-')
                                    .attr('x', labels[5].x - 28)
                                    .attr('y', marg + newH + remH + line * 0.5 + title_size * 0.33)
                                    .style('fill', '#000000')
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .style('pointer-events', 'none')
                            }

                            for (let i = 0; i < d.large.new.length; i++) {
                                largeg.append('text')
                                    .text(d.large.new[i])
                                    .attr('x', labels[5].x - 55)
                                    .attr('y', line * 0.5)
                                    .style('fill', '#000000')
                                    .style('font-weight', '')
                                    .style('font-size', headerSize + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (15 + 22 * (i % 2)) + ',' + ((marg1 + title_size) + (title_size + marg2) * parseInt(i / 2)) + ')')
                                    .style('pointer-events', 'none')
                            }
                            let midOffset = d.large.new.length > 0 ? (marg1 * 2 + (title_size + marg2) * Math.ceil(d.large.new.length / 2)) : 0
                            for (let i = 0; i < d.large.rem.length; i++) {
                                largeg.append('text')
                                    .text(d.large.rem[i])
                                    .attr('x', labels[5].x - 55)
                                    .attr('y', line * 0.5)
                                    .style('fill', '#000000')
                                    .style('font-weight', '')
                                    .style('font-size', headerSize + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (15 + 22 * (i % 2)) + ',' + (midOffset + (marg1 + title_size) + (title_size + marg2) * parseInt(i / 2)) + ')')
                                    .style('pointer-events', 'none')
                            }
                        }
                        function drawHoverMedium() {
                            if (d.medium.new.length === 0 && d.medium.rem.length === 0) {
                                return
                            }
                            let marg = 2 * marg1 + ((d.medium.new.length > 0 && d.medium.rem.length > 0) ? (marg1 * 2) : 0)
                            let newH = (headerSize + marg2) * (parseInt(d.medium.new.length / 2) + (d.medium.new.length % 2 !== 0 ? 1 : 0))
                            let remH = (headerSize + marg2) * (parseInt(d.medium.rem.length / 2) + (d.medium.rem.length % 2 !== 0 ? 1 : 0))

                            let g = reserved.g.select('g#modifications_information')
                            let mediumg = g.append('g')
                                .attr('id', 'mediumhover')
                                .style('pointer-events', 'none')
                                .attr('transform', function() {
                                    let tx = 0
                                    let ty = localoffset + popupOffset
                                    return 'translate(' + tx + ',' + ty + ')'
                                })

                            mediumg.append('rect')
                                .attr('x', labels[5].x - 55)
                                .attr('y', line * 0.5)
                                .attr('width', 74)
                                .attr('height', function() {
                                    return newH + marg * 0.5 - 1
                                })
                                .attr('fill', colorPalette.darker.background)
                                .attr('stroke-width', 0)
                            mediumg.append('rect')
                                .attr('x', labels[5].x - 55)
                                .attr('y', line * 0.5 + marg * 0.5 + newH + 2)
                                .attr('width', 74)
                                .attr('height', function() {
                                    return remH + marg * 0.5 - 1
                                })
                                .attr('fill', colorPalette.darker.background)
                                .attr('stroke-width', 0)
                            mediumg.append('rect')
                                .attr('x', labels[5].x - 55)
                                .attr('y', line * 0.5)
                                .attr('width', 74)
                                .attr('height', function() {
                                    return marg + newH + remH
                                })
                                .attr('fill', function() {
                                    if (d.medium.new.length === 0) {
                                        return colorPalette.darker.background
                                    }
                                    else if (d.medium.rem.length === 0) {
                                        return colorPalette.darker.background
                                    }
                                    else {
                                        return 'none'
                                    }
                                })
                                .attr('stroke', colorPalette.medium.stroke)
                                .attr('stroke-dasharray', function() {
                                    if (d.medium.new.length === 0) {
                                        return [ 74 + newH + marg + remH + 30, 14, 30 + remH + marg + newH ]
                                    }
                                    else if (d.medium.rem.length === 0) {
                                        return [ 30, 14, 30 + newH + marg + remH + 74 + remH + marg + newH ]
                                    }
                                    else {
                                        return [ 30, 14, 30 + newH, marg, remH + 30, 14, 30 + remH, marg, newH ]
                                    }
                                })
                                .attr('stroke-width', 1)
                            if (d.medium.new.length > 0) {
                                mediumg.append('text')
                                    .text('+')
                                    .attr('x', labels[5].x - 18)
                                    .attr('y', line * 0.5 + title_size * 0.33)
                                    .style('fill', '#000000')
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .style('pointer-events', 'none')
                            }
                            if (d.medium.rem.length > 0) {
                                mediumg.append('text')
                                    .text('-')
                                    .attr('x', labels[5].x - 18)
                                    .attr('y', marg + newH + remH + line * 0.5 + title_size * 0.33)
                                    .style('fill', '#000000')
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .style('pointer-events', 'none')
                            }

                            for (let i = 0; i < d.medium.new.length; i++) {
                                mediumg.append('text')
                                    .text(d.medium.new[i])
                                    .attr('x', labels[5].x - 55)
                                    .attr('y', line * 0.5)
                                    .style('fill', '#000000')
                                    .style('font-weight', '')
                                    .style('font-size', headerSize + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (18 + 38 * (i % 2)) + ',' + ((marg1 + headerSize) + (headerSize + marg2) * parseInt(i / 2)) + ')')
                                    .style('pointer-events', 'none')
                            }
                            let midOffset = d.medium.new.length > 0 ? (marg1 * 2 + (headerSize + marg2) * Math.ceil(d.medium.new.length / 2)) : 0
                            for (let i = 0; i < d.medium.rem.length; i++) {
                                mediumg.append('text')
                                    .text(d.medium.rem[i])
                                    .attr('x', labels[5].x - 55)
                                    .attr('y', line * 0.5)
                                    .style('fill', '#000000')
                                    .style('font-weight', '')
                                    .style('font-size', headerSize + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (18 + 38 * (i % 2)) + ',' + (midOffset + (marg1 + headerSize) + (headerSize + marg2) * parseInt(i / 2)) + ')')
                                    .style('pointer-events', 'none')
                            }
                        }
                        function drawHoverSmall() {
                            if (d.small.new.length === 0 && d.small.rem.length === 0) {
                                return
                            }
                            let marg = 2 * marg1 + ((d.small.new.length > 0 && d.small.rem.length > 0) ? marg1 * 2 : 0)
                            let newH = (txt_size + marg2) * (parseInt(d.small.new.length / 3) + (d.small.new.length % 3 !== 0 ? 1 : 0))
                            let remH = (txt_size + marg2) * (parseInt(d.small.rem.length / 3) + (d.small.rem.length % 3 !== 0 ? 1 : 0))

                            let g = reserved.g.select('g#modifications_information')
                            let smallg = g.append('g')
                                .attr('id', 'smallhover')
                                .style('pointer-events', 'none')
                                .attr('transform', function() {
                                    let tx = 0
                                    let ty = localoffset + popupOffset
                                    return 'translate(' + tx + ',' + ty + ')'
                                })
                            smallg.append('rect')
                                .attr('x', labels[5].x - 55)
                                .attr('y', line * 0.5)
                                .attr('width', 94)
                                .attr('height', function() {
                                    return newH + marg * 0.5 - 1
                                })
                                .attr('fill', colorPalette.darker.background)
                                .attr('stroke-width', 0)
                            smallg.append('rect')
                                .attr('x', labels[5].x - 55)
                                .attr('y', line * 0.5 + marg * 0.5 + newH + 2)
                                .attr('width', 94)
                                .attr('height', function() {
                                    return remH + marg * 0.5 - 1
                                })
                                .attr('fill', colorPalette.darker.background)
                                .attr('stroke-width', 0)
                            smallg.append('rect')
                                .attr('x', labels[5].x - 55)
                                .attr('y', line * 0.5)
                                .attr('width', 94)
                                .attr('height', function() {
                                    return marg + newH + remH
                                })
                                .attr('fill', function() {
                                    if (d.small.new.length === 0) {
                                        return colorPalette.darker.background
                                    }
                                    else if (d.small.rem.length === 0) {
                                        return colorPalette.darker.background
                                    }
                                    else {
                                        return 'none'
                                    }
                                })
                                .attr('stroke', colorPalette.medium.stroke)
                                .attr('stroke-dasharray', function() {
                                    if (d.small.new.length === 0) {
                                        return [ 94 + newH + marg + remH + 40, 14, 40 + remH + marg + newH ]
                                    }
                                    else if (d.small.rem.length === 0) {
                                        return [ 40, 14, 40 + newH + marg + remH + 94 + remH + marg + newH ]
                                    }
                                    else {
                                        return [ 40, 14, 40 + newH, marg, remH + 40, 14, 40 + remH, marg, newH ]
                                    }
                                })
                                .attr('stroke-width', 1)
                            if (d.small.new.length > 0) {
                                smallg.append('text')
                                    .text('+')
                                    .attr('x', labels[5].x - 8)
                                    .attr('y', line * 0.5 + title_size * 0.33)
                                    .style('fill', '#000000')
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .style('pointer-events', 'none')
                            }
                            if (d.small.rem.length > 0) {
                                smallg.append('text')
                                    .text('-')
                                    .attr('x', labels[5].x - 8)
                                    .attr('y', marg + newH + remH + line * 0.5 + title_size * 0.33)
                                    .style('fill', '#000000')
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .style('pointer-events', 'none')
                            }

                            for (let i = 0; i < d.small.new.length; i++) {
                                smallg.append('text')
                                    .text(d.small.new[i])
                                    .attr('x', labels[5].x - 55)
                                    .attr('y', line * 0.5)
                                    .style('fill', '#000000')
                                    .style('font-weight', '')
                                    .style('font-size', txt_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (18 + 28 * (i % 3)) + ',' + ((marg1 + txt_size) + (txt_size + marg2) * parseInt(i / 3)) + ')')
                                    .style('pointer-events', 'none')
                            }
                            let midOffset = d.small.new.length > 0 ? (marg1 * 2 + (txt_size + marg2) * Math.ceil(d.small.new.length / 3)) : 0
                            for (let i = 0; i < d.small.rem.length; i++) {
                                smallg.append('text')
                                    .text(d.small.rem[i])
                                    .attr('x', labels[5].x - 55)
                                    .attr('y', line * 0.5)
                                    .style('fill', '#000000')
                                    .style('font-weight', '')
                                    .style('font-size', txt_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (18 + 28 * (i % 3)) + ',' + (midOffset + (marg1 + txt_size) + (txt_size + marg2) * parseInt(i / 3)) + ')')
                                    .style('pointer-events', 'none')
                            }
                        }

                        let offset = labels[5].x - labels[1].x - labels[1].w

                        if (d.large.new.length !== 0 || d.large.rem.length !== 0) {
                            if (!g.select('g#circleLarge').empty()) {
                                g.select('g#circleLarge').select('text')
                                    .text(Math.abs(d.large.diff))
                            }
                            else {
                                let glarge = g.append('g')
                                    .attr('id', 'circleLarge')
                                    .attr('transform', 'translate(' + (offset + labels[5].w * 0.2) + ',' + (line * 0.5) + ')')
                                glarge.append('circle')
                                    .attr('cx', 0)
                                    .attr('cy', 0)
                                    .attr('r', labels[5].w * 0.2)
                                    .attr('fill', colorPalette.dark.background)
                                    .attr('stroke', '#000000')
                                    .attr('stroke-width', 0.2)
                                    .on('mouseover', function() {
                                        d3.select(this).attr('fill', colorPalette.darkest.background)
                                        drawHoverLarge()
                                    })
                                    .on('mouseout', function() {
                                        d3.select(this).attr('fill', colorPalette.dark.background)
                                        reserved.g.selectAll('g#largehover').remove()
                                    })
                                g.append('text')
                                    .text(Math.abs(d.large.diff))
                                    .style('fill', d.large.diff < 0 ? 'red' : (d.large.diff > 0 ? 'green' : '#000000'))
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (offset + labels[5].w * 0.2) + ',' + (line * 0.5 + title_size * 0.3) + ')')
                                    .style('pointer-events', 'none')
                            }
                        }
                        if (d.medium.new.length !== 0 || d.medium.rem.length !== 0) {
                            if (!g.select('g#circleMedium').empty()) {
                                g.select('g#circleMedium').select('text')
                                    .text(Math.abs(d.medium.diff))
                            }
                            else {
                                let gmedium = g.append('g')
                                    .attr('id', 'circleMedium')
                                    .attr('transform', 'translate(' + (offset + labels[5].w * 0.56) + ',' + (line * 0.5) + ')')
                                gmedium.append('circle')
                                    .attr('cx', 0)
                                    .attr('cy', 0)
                                    .attr('r', labels[5].w * 0.16)
                                    .attr('fill', colorPalette.dark.background)
                                    .attr('stroke', '#000000')
                                    .attr('stroke-width', 0.2)
                                    .on('mouseover', function() {
                                        d3.select(this).attr('fill', colorPalette.darkest.background)
                                        drawHoverMedium()
                                    })
                                    .on('mouseout', function() {
                                        d3.select(this).attr('fill', colorPalette.dark.background)
                                        reserved.g.selectAll('g#mediumhover').remove()
                                    })
                                g.append('text')
                                    .text(Math.abs(d.medium.diff))
                                    .style('fill', d.medium.diff < 0 ? 'red' : (d.medium.diff > 0 ? 'green' : '#000000'))
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (offset + labels[5].w * 0.56) + ',' + (line * 0.5 + title_size * 0.3) + ')')
                                    .style('pointer-events', 'none')
                            }
                        }
                        if (d.small.new.length !== 0 || d.small.rem.length !== 0) {
                            if (!g.select('g#circleSmall').empty()) {
                                g.select('g#circleSmall').select('text')
                                    .text(Math.abs(d.small.diff))
                            }
                            else {
                                let gsmall = g.append('g')
                                    .attr('id', 'circleSmall')
                                    .attr('transform', 'translate(' + (offset + labels[5].w * 0.86) + ',' + (line * 0.5) + ')')
                                gsmall.append('circle')
                                    .attr('cx', 0)
                                    .attr('cy', 0)
                                    .attr('r', labels[5].w * 0.14)
                                    .attr('fill', colorPalette.dark.background)
                                    .attr('stroke', '#000000')
                                    .attr('stroke-width', 0.2)
                                    .on('mouseover', function() {
                                        d3.select(this).attr('fill', colorPalette.darkest.background)
                                        drawHoverSmall()
                                    })
                                    .on('mouseout', function() {
                                        d3.select(this).attr('fill', colorPalette.dark.background)
                                        reserved.g.selectAll('g#smallhover').remove()
                                    })
                                g.append('text')
                                    .text(Math.abs(d.small.diff))
                                    .style('fill', d.small.diff < 0 ? 'red' : (d.small.diff > 0 ? 'green' : '#000000'))
                                    .style('font-weight', 'bold')
                                    .style('font-size', title_size + 'px')
                                    .attr('text-anchor', 'middle')
                                    .attr('transform', 'translate(' + (offset + labels[5].w * 0.86) + ',' + (line * 0.5 + title_size * 0.3) + ')')
                                    .style('pointer-events', 'none')
                            }
                        }
                    }
                    let current = g
                        .selectAll('g.prop')
                        .data(props, function(d, i) {
                            return i
                        })
                    let enter = current
                        .enter()
                        .append('g')
                        .attr('class', 'prop')
                    enter.each(function(d, i) {
                        let g = d3.select(this)
                        if (d.type === 'time') {
                            drawDiffTime(g, d)
                        }
                        else if (d.type === 'state') {
                            drawDiffState(g, d)
                        }
                        else if (d.type === 'telescope') {
                            drawDiffTels(g, d)
                        }
                    })
                    let merge = current.merge(enter)
                    merge.each(function(d, i) {
                        let g = d3.select(this)
                        g.attr('transform', 'translate(' + (labels[1].x) + ',' + (offset + (line + marg) * prop_index) + ')')
                        if (d.type === 'time') {
                            drawDiffTime(g, d)
                        }
                        else if (d.type === 'state') {
                            drawDiffState(g, d)
                        }
                        else if (d.type === 'telescope') {
                            drawDiffTels(g, d)
                        }
                        // prop_index += 1
                    })
                    current
                        .exit()
                        .transition('in_out')
                        .duration(times.anim)
                        .style('opacity', 0)
                        .remove()
                }
                schedCore(shared.data.copy.modifications, innerg, marg)

                // reserved.overview.modifications.scrollBox.move_vertical_scroller_to(0.5)
                reserved.overview.modifications.scrollBox.updated_content()
                // let scrollProp = reserved.overview.modifications.scrollBox.get_scroll_prop('vertical')
                popupOffset = 0
            }
            function updateConflicts_information() {
                conflict_button = []
                // let tbox = {x: label[0].x, y: 3 + headerSize + (com.target.editable ? (headerSize * 2) : 0), w: label[0].w, h: com.target.editable ? (box.h - headerSize * 3) : (box.h - headerSize * 1)}
                // let blocktg = g.append('g').attr('transform', 'translate(' + tbox.x + ',' + tbox.y + ')')
                let line = 38
                let marg = 4
                let innerg = reserved.overview.conflicts.scrollBox.get_content()
                innerg.selectAll('*').remove()
                let current = innerg
                    .selectAll('g.conflict')
                    .data(shared.data.copy.conflicts, function(d, i) {
                        return d.id
                    })
                let enter = current
                    .enter()
                    .append('g')
                    .attr('class', 'conflict')
                enter.each(function(d, i) {
                    let g = d3.select(this)
                    g.append('rect')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', line)
                        .attr('height', line)
                        .attr('open', false)
                        .attr('fill', colorPalette.dark.background)
                        .attr('stroke', colorPalette.dark.stroke)
                        .attr('stroke-width', 0.1)
                        .on('click', function() {
                            focusOnConflict({
                                d3: d3.select(this),
                                d: d,
                            })
                        })
                    g.append('text')
                        .text(d.blocks.length + ' obs')
                        .attr('x', line * 0.5)
                        .attr('y', line * 0.2 + title_size * 0.33)
                        .style('font-weight', '')
                        .attr('text-anchor', 'middle')
                        .style('font-size', title_size + 'px')
                        .style('pointer-events', 'none')
                        .attr('fill', colorPalette.dark.text)
                        .attr('stroke', 'none')
                    g.append('text')
                        .text(d.large + '-' + d.medium + '-' + d.small)
                        .attr('x', line * 0.5)
                        .attr('y', line * 0.55 + txt_size * 0.33)
                        .style('font-weight', '')
                        .attr('text-anchor', 'middle')
                        .style('font-size', txt_size + 'px')
                        .style('pointer-events', 'none')
                        .attr('fill', colorPalette.dark.text)
                        .attr('stroke', 'none')
                    g.append('text')
                        .text('L - M - S')
                        .attr('x', line * 0.5)
                        .attr('y', line * 0.8 + title_size * 0.33)
                        .style('font-weight', '')
                        .attr('text-anchor', 'middle')
                        .style('font-size', txt_size + 'px')
                        .style('pointer-events', 'none')
                        .attr('fill', colorPalette.dark.text)
                        .attr('stroke', 'none')

                    let offX = marg * 1 + (line + marg) * i
                    let offY = marg * 1
                    g.attr('transform', 'translate(' + offX + ',' + offY + ')')
                    conflict_button.push({
                        d3: g,
                        d: d,
                    })
                })
                // let merge = current.merge(enter)
                // merge.each(function (d, i) {
                //   let g = d3.select(this)
                //   let offX = marg * 1 + (line + marg) * i
                //   let offY = marg * 1
                //   g.attr('transform', 'translate(' + offX + ',' + offY + ')')
                //   conflict_button.push({d3: g, d: d})
                // })
                // current
                //   .exit()
                //   .each(d => console.log(d.id))
                //   .transition('in_out')
                //   .duration(times.anim)
                //   .style('opacity', 0)
                //   .remove()
                reserved.overview.conflicts.scrollBox.updated_content()
            }

            updateModifications_information()
            updateConflicts_information()
        }
        this.updateOverview = updateOverview

        function create_sched_blocks_info_panel(id) {
            let schedB = get_sched_blocksData()[id]
            let g = reserved.g.append('g')
            let innerbox = {
                x: box.right_info.w * 0.0,
                y: box.right_info.h * 0.02,
                w: box.right_info.w * 1.0,
                h: box.right_info.h * 1.0,
            }
            let allBox = {
                tree: {
                    x: box.right_info.w * 0.45,
                    y: box.right_info.h * 0.02,
                    w: box.right_info.w * 0.65,
                    h: box.right_info.h * 0.1,
                },
                time: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.17,
                    w: box.right_info.w * 1.0,
                    h: box.right_info.h * 0.25,
                },
                target: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.41,
                    w: box.right_info.w * 1.0,
                    h: box.right_info.h * 0.59,
                },
            }
            reserved.schedblockForm = new SchedblockForm({
                main: {
                    tag: 'schedblockFormTag',
                    g: g,
                    scroll: {
                    },
                    box: innerbox,
                    background: {
                        fill: color_theme.brighter.background,
                        stroke: color_theme.brighter.stroke,
                        strokeWidth: 0.5,
                    },
                },
                tree: {
                    box: allBox.tree,
                    events: {
                        change: createNewBlockIn_schedule,
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                schedule: {
                    editabled: true,
                    box: allBox.time,
                    events: {
                        change: updateBlockState,
                        click: updateView,
                        over: undefined,
                        out: undefined,
                    },
                },
                target: {
                    box: allBox.target,
                    events: {
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                data: {
                    schedB: schedB,
                    time_of_night: shared.data.server.time_information,
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
                events: {
                    blurry: function() {
                        svg_events_queue_server.blurry()
                        svg_blocks_queue_server.blurry()
                        svgBrush.blurry()
                        svgTargets.blurry()
                        svgTelsConflict.blurry()
                        svgFocusOverlay.blurry()
                    },
                    focus: function() {
                        svg_events_queue_server.focus()
                        svg_blocks_queue_server.focus()
                        svgBrush.focus()
                        svgTargets.focus()
                        svgTelsConflict.focus()
                        svgFocusOverlay.focus()
                    },
                    conflict: function(d) {
                        balanceBlocks(d)
                        svgTelsConflict.drawTelsAvailabilityCurve(d)
                        // listAllConflicts()
                        // linkConflicts()
                    },
                    modification: changeBlockProperties,
                },
            })
            reserved.schedblockForm.init()
        }
        function focusOn_sched_block(bId) {
            clean()
            conflictFocused = {
                d: undefined,
                d3: undefined,
            }
            create_sched_blocks_info_panel(bId)
        }
        this.focusOn_sched_block = focusOn_sched_block

        function createBlocks_info_panel(idBlock) {
            let data = getBlockById(get_blocksData(), idBlock).data
            let schedB = get_sched_blocksData()[data.sched_block_id]
            let g = reserved.g.append('g')
            let innerbox = {
                x: box.right_info.w * 0.0,
                y: box.right_info.h * 0.0,
                w: box.right_info.w * 1.0,
                h: box.right_info.h * 1.0,
            }
            let allBox = {
                tree: {
                    x: box.right_info.w * 0.45,
                    y: box.right_info.h * 0.02,
                    w: box.right_info.w * 0.65,
                    h: box.right_info.h * 0.1,
                },
                time: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.15,
                    w: box.right_info.w * 1.0,
                    h: box.right_info.h * 0.1,
                },
                target: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.26,
                    w: box.right_info.w * 0.8,
                    h: box.right_info.h * 0.28,
                },
                tels: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.6,
                    w: box.right_info.w * 1.0,
                    h: box.right_info.h * 0.39,
                },
            }

            reserved.obsblockForm = new ObsblockForm({
                main: {
                    tag: 'blockFormTag',
                    g: g,
                    scroll: {
                    },
                    box: innerbox,
                    background: {
                        fill: color_theme.brighter.background,
                        stroke: color_theme.brighter.stroke,
                        strokeWidth: 0.5,
                    },
                },
                tree: {
                    box: allBox.tree,
                    events: {
                        change: createNewBlockIn_schedule,
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                schedule: {
                    editable: true,
                    box: allBox.time,
                    events: {
                        change: updateBlockState,
                        click: updateView,
                        over: undefined,
                        out: undefined,
                    },
                },
                target: {
                    editable: true,
                    box: allBox.target,
                    events: {
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                telescope: {
                    box: allBox.tels,
                    events: {
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                data: {
                    block: data,
                    schedB: schedB,
                    time_of_night: shared.data.server.time_information,
                    target: shared.data.server.targets,
                    tels: shared.data.server.inst_health,
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
                events: {
                    allTel: function() {
                        return {
                            allTels: shared.data.server.inst_health,
                            blocks: get_blocksByTime(get_blocksData(), data.time.start, data.time.end),
                        }
                    },
                    blurry: function() {
                        svg_events_queue_server.blurry()
                        svg_blocks_queue_server.blurry()
                        svgBrush.blurry()
                        svgTargets.blurry()
                        svgTelsConflict.blurry()
                        svgFocusOverlay.blurry()
                    },
                    focus: function() {
                        svg_events_queue_server.focus()
                        svg_blocks_queue_server.focus()
                        svgBrush.focus()
                        svgTargets.focus()
                        svgTelsConflict.focus()
                        svgFocusOverlay.focus()
                    },
                    conflict: function(d) {
                        balanceBlocks(d)
                        svgTelsConflict.drawTelsAvailabilityCurve(d)
                        // listAllConflicts()
                        // linkConflicts()
                    },
                    modification: changeBlockProperties,
                },
            })
            reserved.obsblockForm.init()
            // reserved.telescopeRunningBlock.update_data({
            //   data: {
            //     raw: {
            //       telescopes: [].concat(tels.small).concat(tels.medium).concat(tels.large),
            //       blocks: []// shared.data.server.blocks.run
            //     },
            //     modified: []
            //   }
            // })
        }
        function focusOn_block(bId) {
            clean()
            conflictFocused = {
                d: undefined,
                d3: undefined,
            }
            createBlocks_info_panel(bId)
        }
        this.focusOn_block = focusOn_block
        function updateBlock(bId) {
            if (!bId) {
                if (shared.focus && shared.focus.type === 'block') {
                    bId = shared.focus.id
                }
                else {
                    return
                }
            }
            let data = getBlockById(get_blocksData(), bId).data
            let schedB = get_sched_blocksData()[data.sched_block_id]
            reserved.obsblockForm.update({
                block: data,
                schedB: schedB,
            })
        }
        this.updateBlock = updateBlock

        function create_target_info_panel(id) {
            let tar = get_targetById(id)
            let inter = create_sched_blocks(shared.data.server.blocks)
            let scheds = []
            for (let key in inter) {
                for (let j = 0; j < inter[key].targets.length; j++) {
                    if (inter[key].targets[j].id !== tar.id) {
                        continue
                    }
                    inter[key].id = key
                    scheds.push(inter[key])
                }
            }
            let innerbox = {
                x: box.right_info.w * 0.0,
                y: box.right_info.h * 0.0,
                w: box.right_info.w * 1.0,
                h: box.right_info.h * 1.0,
            }
            let allBox = {
                title: {
                    x: reserved.box.w * 0.45,
                    y: reserved.box.h * 0.04,
                    w: reserved.box.w * 0.55,
                    h: reserved.box.h * 0.12,
                },
                blocks: {
                    x: 0,
                    y: reserved.box.h * 0.18,
                    h: reserved.box.h * 0.38,
                    w: reserved.box.w,
                },
                target: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.45,
                    w: box.right_info.w * 1.0,
                    h: box.right_info.h * 0.55,
                },
            }

            let g = reserved.g.append('g')
            reserved.targetForm = new TargetForm({
                main: {
                    tag: 'targetFormTag',
                    g: g,
                    scroll: {
                    },
                    box: innerbox,
                    background: {
                        fill: color_theme.brighter.background,
                        stroke: color_theme.brighter.stroke,
                        strokeWidth: 0.5,
                    },
                },
                tree: {
                    box: allBox.title,
                    events: {
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                ressource: {
                    box: allBox.blocks,
                    events: {
                        click: focusManager.focusOn,
                        over: undefined,
                        out: undefined,
                    },
                },
                target: {
                    box: allBox.target,
                    events: {
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                data: {
                    schedB: scheds,
                    target: tar,
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
            reserved.targetForm.init()
        }
        function focusOnTarget(id) {
            clean()
            conflictFocused = {
                d: undefined,
                d3: undefined,
            }
            create_target_info_panel(id)
        }
        this.focusOnTarget = focusOnTarget

        function createTelescope_info_panel(tel_id) {
            let tel = getTelescopeById(tel_id)
            let innerbox = {
                x: box.right_info.w * 0.0,
                y: box.right_info.h * 0.0,
                w: box.right_info.w * 1.0,
                h: box.right_info.h * 1.0,
            }
            let allBox = {
                title: {
                    x: reserved.box.w * 0.45,
                    y: reserved.box.h * 0.04,
                    w: reserved.box.w * 0.55,
                    h: reserved.box.h * 0.12,
                },
                blocks: {
                    x: 0,
                    y: reserved.box.h * 0.17,
                    h: reserved.box.h * 0.83,
                    w: reserved.box.w,
                },
            }
            let g = reserved.g.append('g')

            let blocks = []
            let copyBlock = get_blocksData()
            for (let key in copyBlock) {
                blocks = blocks.concat(copyBlock[key])
            }
            blocks = blocks.filter(b => b.tel_ids.includes(tel.id))
            let scheds = create_sched_blocks(blocks)

            reserved.telescopeForm = new TelescopeForm({
                main: {
                    tag: 'telescopeFormTag',
                    g: g,
                    scroll: {
                    },
                    box: innerbox,
                    background: {
                        fill: color_theme.brighter.background,
                        stroke: color_theme.brighter.stroke,
                        strokeWidth: 0.5,
                    },
                },
                tree: {
                    box: allBox.title,
                    events: {
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                ressource: {
                    box: allBox.blocks,
                    events: {
                        click: focusManager.focusOn,
                        over: undefined,
                        out: undefined,
                    },
                },
                data: {
                    schedB: scheds,
                    telescope: tel,
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
            reserved.telescopeForm.init()
        }
        function focusOnTelescope(tel_id) {
            clean()
            conflictFocused = {
                d: undefined,
                d3: undefined,
            }
            createTelescope_info_panel(tel_id)
        }
        this.focusOnTelescope = focusOnTelescope

        function clean() {
            reserved.g.selectAll('*').remove()
            if (shared.focus === undefined) {
                initOverview()
                updateOverview()
            }
        }
        this.clean = clean
    }

    let svg_events_queue_server = new Svg_events_queue_server()
    let svg_blocks_queue_server = new Svg_blocks_queue_server()
    let svgBrush = new SvgBrush()
    let svgTargets = new SvgTargets()
    let svgTelsConflict = new SvgTelsConflict()
    let svgFocusOverlay = new SvgFocusOverlay()
    let svgRight_info = new SvgRight_info()

    let SvgSummaryMetrics = function() {
        let reserved = {
        }
        let blockQueue

        function init_dataBQ() {
            let adjustedBox = {
                x: box.summaryMetrics.w * 0.48,
                y: box.summaryMetrics.h * 0.02,
                w: box.summaryMetrics.w * 0.52,
                h: box.summaryMetrics.h * 0.9,
                marg: svg_dims.w[0] * 0.01,
            }

            blockQueue = new BlockDisplayer({
                main: {
                    tag: 'blockQueueMiddleTag',
                    g: reserved.g.append('g').attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')'),
                    scroll: {
                    },
                    box: adjustedBox,
                    background: {
                        fill: 'none',
                        stroke: color_theme.medium.stroke,
                        strokeWidth: 0.0,
                    },
                    color_theme: color_theme,
                },

                displayer: 'blockQueue2', // 'blockQueue2',
                blockQueue: {
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
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
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
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
                                y: adjustedBox.h * 0.6,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.6,
                                marg: adjustedBox.marg,
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
                                y: adjustedBox.h * 0.0,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.33,
                                marg: adjustedBox.marg,
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
                                y: adjustedBox.h * 0.5,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.47,
                                marg: adjustedBox.marg,
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
                        colorPalette: color_theme.blocks,
                    },
                    timeBars: {
                        enabled: false,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h * 0.025,
                            w: adjustedBox.w,
                            h: adjustedBox.h * 0.975,
                            marg: adjustedBox.marg,
                        },
                    },
                },
                blockQueue2: {
                    g: undefined,
                    sched_blocks: {
                        label: {
                            enabled: true,
                            position: 'left',
                            clickable: true,
                            size: 30,
                        },
                    },
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        showAxis: true,
                        orientation: 'axisTop',
                        attr: {
                            text: {
                                size: 10,
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                        },
                    },
                    timeBars: {
                        enabled: false,
                        g: undefined,
                        box: {
                            x: 0,
                            y: -adjustedBox.y,
                            w: adjustedBox.w,
                            h: box.topBox.h + box.event_queue_server.h,
                            marg: adjustedBox.marg,
                        },
                    },
                },
                blockTrackShrink: {
                    g: undefined,
                    sched_blocks: {
                        label: {
                            enabled: true,
                            position: 'left',
                        },
                    },
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h,
                            w: adjustedBox.w,
                            h: 0,
                            marg: adjustedBox.marg,
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        showText: true,
                        orientation: 'bottom',
                        attr: {
                            text: {
                                size: 14,
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                            path: {
                                stroke: color_theme.medium.stroke,
                                fill: color_theme.medium.stroke,
                            },
                        },
                    },
                    timeBars: {
                        enabled: false,
                        g: undefined,
                        box: {
                            x: 0,
                            y: adjustedBox.h * 0.025,
                            w: adjustedBox.w,
                            h: adjustedBox.h * 0.975,
                            marg: adjustedBox.marg,
                        },
                    },
                },
                blockList: {

                },
                blockForm: {
                    mosaic: {
                        box: {
                            x: 0,
                            y: 0,
                            w: adjustedBox.w * 0.2,
                            h: adjustedBox.h,
                            marg: adjustedBox.marg,
                        },
                        order: 'n_sched',
                    },
                    forms: {
                        g: undefined,
                        box: {
                            x: adjustedBox.w * 0.22,
                            y: adjustedBox.h * 0.02,
                            w: adjustedBox.w * 0.78 - adjustedBox.h * 0.02,
                            h: adjustedBox.h * 0.96,
                            marg: adjustedBox.marg,
                        },
                        display: 'list',
                        scroll: {
                        },
                    },
                },

                filters: {
                    blockFilters: [],
                    filtering: [],
                },
                time: {
                    current_time: {
                        time: 0,
                        date: undefined,
                    },
                    start_time_sec: {
                        time: 0,
                        date: undefined,
                    },
                    end_time_sec: {
                        time: 0,
                        date: undefined,
                    },
                },
                data: {
                    raw: undefined,
                    formated: undefined,
                    modified: undefined,
                },
                debug: {
                    enabled: false,
                },
                pattern: {
                },
                events: {
                    block: {
                        click: d => focusManager.focusOn('block', d.obs_block_id),
                        dbclick: function(d) {
                            // d.exe_state.state = 'cancel'
                            // changeBlockProperties(d, false, 'state')
                        },
                        mouseover: focusManager.over,
                        mouseout: focusManager.out,
                        drag: {
                            start: svgFocusOverlay.dragStart,
                            tick: svgFocusOverlay.dragTick,
                            end: function(e, d) {
                                let res = svgFocusOverlay.dragEnd(e, d)
                                if (res) {
                                    changeBlockProperties(d, false, 'start_time_sec')
                                }
                            },
                        },
                    },
                    sched: {
                        click: focusManager.focusOn,
                        mouseover: focusManager.over,
                        mouseout: focusManager.out,
                    },
                },
                input: {
                    focus: {
                        sched_blocks: [],
                        blocks: [],
                    },
                    over: {
                        sched_blocks: [],
                        blocks: [],
                    },
                    selection: [],
                },
            })
            blockQueue.init()
            blockQueue.switchStyle({
                runRecCol: color_theme.blocks.shutdown,
                blockCol: function(opt_in) {
                    let state = is_def(opt_in.state)
                        ? opt_in.state
                        : opt_in.d.exe_state.state
                    let can_run = is_def(opt_in.can_run)
                        ? opt_in.can_run
                        : opt_in.d.exe_state.can_run
                    let modified = opt_in.d.modifications ? opt_in.d.modifications.userModifications.length > 0 : false

                    if (state === 'wait') {
                        if (modified) {
                            return color_theme.blocks.wait
                        }
                        return color_theme.blocks.wait
                    }
                    else if (state === 'done') {
                        return color_theme.blocks.done
                    }
                    else if (state === 'fail') {
                        return color_theme.blocks.fail
                    }
                    else if (state === 'run') {
                        return color_theme.blocks.run
                    }
                    else if (state === 'cancel') {
                        if (is_def(can_run)) {
                            if (!can_run) {
                                return color_theme.blocks.cancelOp
                            }
                        }
                        return color_theme.blocks.cancelSys
                    }
                    else {
                        return color_theme.blocks.shutdown
                    }
                    // let startT = is_def(opt_in.start_time_sec)
                    //   ? opt_in.start_time_sec
                    //   : opt_in.d.start_time_sec
                    // if (startT < shared.data.server.time_information.time_now_sec) return color_theme.blocks.shutdown
                    // let state = is_def(opt_in.state)
                    //   ? opt_in.state
                    //   : opt_in.d.exe_state.state
                    // let can_run = is_def(opt_in.can_run)
                    //   ? opt_in.can_run
                    //   : opt_in.d.exe_state.can_run
                    // let modified = opt_in.d.modifications ? opt_in.d.modifications.userModifications.length > 0 : false
                    //
                    // if (state === 'wait') {
                    //   if (modified) return color_theme.blocks.wait
                    //   return color_theme.blocks.wait
                    // } else if (state === 'cancel') {
                    //   if (is_def(can_run)) {
                    //     if (!can_run) return color_theme.blocks.cancelOp
                    //   }
                    //   return color_theme.blocks.cancelSys
                    // } else return color_theme.blocks.shutdown
                },
                blockOpac: function(opt_in) {
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
                },
                blockPattern: function(opt_in) {
                    let startT = is_def(opt_in.start_time_sec)
                        ? opt_in.start_time_sec
                        : opt_in.d.start_time_sec
                    if (startT < shared.data.server.time_information.time_now_sec) {
                        return 'url(#patternLock)'
                    }
                    return 'none'
                },
            })
        }
        function update_dataBQ() {
            let tel_ids = []
            $.each(shared.data.server.inst_health, function(index, data_now) {
                tel_ids.push(data_now.id)
            })

            let axisTop = brushZoom.get_domain().focus
            let newWidth = brushZoom.get_axis().scale(new Date(shared.data.server.time_information.time_now_sec))
            if (newWidth < 0) {
                newWidth = 0
            }
            if (newWidth > box.block_queue_server.w) {
                newWidth = box.block_queue_server.w
            }
            reserved.g.select('rect#cloak').attr('width', newWidth)

            let start_time_sec = {
                date: axisTop[0],
                time: (new Date(shared.data.server.time_information.night_start_sec).getTime() - axisTop[0]) / -1000,
            }
            let end_time_sec = {
                date: axisTop[1],
                time: (new Date(shared.data.server.time_information.night_start_sec).getTime() - axisTop[1]) / -1000,
            }

            blockQueue.update_data({
                time: {
                    current_time: {
                        date: new Date(shared.data.server.time_information.time_now_sec),
                        time: Number(shared.data.server.time_information.time_now_sec),
                    },
                    start_time_sec: start_time_sec,
                    end_time_sec: end_time_sec,
                },
                data: {
                    raw: {
                        blocks: get_blocksData(),
                        tel_ids: tel_ids,
                    },
                    modified: [],
                },
            })
        }
        this.update_dataBQ = update_dataBQ

        function init_data() {
            let adjustedBox = {
                x: box.summaryMetrics.x,
                y: box.summaryMetrics.y,
                w: box.summaryMetrics.w,
                h: box.summaryMetrics.h,
                marg: box.summaryMetrics * 0.01,
            }

            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
            // reserved.g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', adjustedBox.w)
            //   .attr('height', adjustedBox.h)
            //   .attr('fill', '#dddddd')

            init_dataBQ()
            update_dataBQ()

            // reserved.g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', -6)
            //   .attr('width', adjustedBox.w * 0.125)
            //   .attr('height', adjustedBox.h)
            //   .attr('fill', colorPalette.darkest.background)
            //   .attr('stroke-width', 0)
            reserved.g.append('text')
                .text('Projected')
                .attr('x', (adjustedBox.w * 0.185))
                .attr('y', adjustedBox.h * 0.15)
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', 11 + 'px')
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('pointer-events', 'none')
            reserved.g.append('text')
                .text('Processed')
                .attr('x', (adjustedBox.w * 0.185))
                .attr('y', adjustedBox.h * 0.35)
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', 11 + 'px')
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('pointer-events', 'none')
            reserved.g.append('rect')
                .attr('x', adjustedBox.w * 0.13)
                .attr('y', adjustedBox.h * 0.18)
                .attr('width', adjustedBox.w * 0.115)
                .attr('height', 10)
                .attr('fill', colorPalette.darker.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.4)
            reserved.g.append('rect')
                .attr('x', adjustedBox.w * 0.13)
                .attr('y', adjustedBox.h * 0.26)
                .attr('width', adjustedBox.w * 0.115)
                .attr('height', 10)
                .attr('fill', colorPalette.darker.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.4)

            reserved.g.append('svg:image')
                .attr('xlink:href', '/static/icons/arrow-right.svg')
                .attr('x', adjustedBox.w * 0.26)
                .attr('y', adjustedBox.h * 0.22)
                .attr('width', 25)
                .attr('height', 15)
            // .style('opacity', 0.5)

            reserved.g.append('text')
                .text('Projected')
                .attr('x', (adjustedBox.w * 0.356))
                .attr('y', adjustedBox.h * 0.15)
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', 11 + 'px')
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('pointer-events', 'none')
            reserved.g.append('text')
                .text('Processed')
                .attr('x', (adjustedBox.w * 0.356))
                .attr('y', adjustedBox.h * 0.35)
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', 11 + 'px')
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('pointer-events', 'none')
            reserved.g.append('rect')
                .attr('x', adjustedBox.w * 0.3)
                .attr('y', adjustedBox.h * 0.18)
                .attr('width', adjustedBox.w * 0.115)
                .attr('height', 10)
                .attr('fill', colorPalette.darker.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.4)
            reserved.g.append('rect')
                .attr('x', adjustedBox.w * 0.3)
                .attr('y', adjustedBox.h * 0.26)
                .attr('width', adjustedBox.w * 0.115)
                .attr('height', 10)
                .attr('fill', colorPalette.darker.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.4)

            for (let i = 0; i < 10; i++) {
                reserved.g.append('rect')
                    .attr('x', -10)
                    .attr('y', adjustedBox.h * 0.12 + (adjustedBox.h * 0.86 / 10) * i)
                    .attr('width', adjustedBox.w * 0.115)
                    .attr('height', adjustedBox.h * 0.85 / 10)
                    .attr('fill', (i === 3) ? colorPalette.darkest.background : (i % 2) ? colorPalette.darker.background : colorPalette.dark.background)
                    .attr('stroke', '#000000')
                    .attr('stroke-width', (i === 3) ? 1 : 0)
                reserved.g.append('text')
                    .text('Schedule-' + i + '\t \t\t(' + (106 - (i * 2)) + '%)')
                    .attr('x', 0)
                    .attr('y', adjustedBox.h * 0.12 + (adjustedBox.h * 0.86 / 10) * (i + 0.75))
                    .style('fill', '#000000')
                    .style('font-weight', '')
                    .style('font-size', 11 + 'px')
                    .attr('text-anchor', 'start')
                    .style('pointer-events', 'none')
            }

            let tg = reserved.g.append('g')
                .attr('transform', 'translate(' + 0 + ',' + (adjustedBox.h * 0.1) + ')')
            tg.append('text')
                .text('Old')
                .attr('x', (adjustedBox.w * 0.16))
                .attr('y', adjustedBox.h * 0.45)
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', 11 + 'px')
                .style('font-weight', 'bold')
                .attr('text-anchor', 'start')
                .style('pointer-events', 'none')
            tg.append('text')
                .text('New')
                .attr('x', (adjustedBox.w * 0.21))
                .attr('y', adjustedBox.h * 0.45)
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', 11 + 'px')
                .style('font-weight', 'bold')
                .attr('text-anchor', 'start')
                .style('pointer-events', 'none')
            tg.append('text')
                .text('Old')
                .attr('x', (adjustedBox.w * 0.32))
                .attr('y', adjustedBox.h * 0.45)
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', 11 + 'px')
                .style('font-weight', 'bold')
                .attr('text-anchor', 'start')
                .style('pointer-events', 'none')
            tg.append('text')
                .text('New')
                .attr('x', (adjustedBox.w * 0.37))
                .attr('y', adjustedBox.h * 0.45)
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', 11 + 'px')
                .style('font-weight', 'bold')
                .attr('text-anchor', 'start')
                .style('pointer-events', 'none')
            for (let i = 0; i < 6; i++) {
                target_icon(tg.append('g').attr('transform', 'translate(' + (adjustedBox.w * 0.12 + (parseInt(i / 3)) * adjustedBox.w * 0.16) + ',' + (adjustedBox.h * 0.5 + adjustedBox.h * 0.12 * (i % 3)) + ')'),
                    {
                        w: 24,
                        h: 24,
                    }, 'T' + i, {
                        click: function() {},
                        over: function() {},
                        out: function() {},
                    }, colorPalette)
                tg.append('text')
                    .text(Math.floor(100 - (Math.random() * 20), 2) + '%')
                    .attr('x', (adjustedBox.w * 0.16 + (parseInt(i / 3)) * adjustedBox.w * 0.16))
                    .attr('y', (adjustedBox.h * 0.5 + adjustedBox.h * 0.12 * (i % 3)) + 16)
                    .style('fill', '#000000')
                    .style('font-weight', '')
                    .style('font-size', 11 + 'px')
                    .attr('text-anchor', 'start')
                    .style('pointer-events', 'none')
                tg.append('svg:image')
                    .attr('xlink:href', '/static/icons/arrow-right.svg')
                    .attr('x', (adjustedBox.w * 0.185 + (parseInt(i / 3)) * adjustedBox.w * 0.16))
                    .attr('y', (adjustedBox.h * 0.5 + adjustedBox.h * 0.12 * (i % 3)) + 6)
                    .attr('width', 20)
                    .attr('height', 10)
                tg.append('text')
                    .text(Math.floor(100 - (Math.random() * 20), 2) + '%')
                    .attr('x', (adjustedBox.w * 0.21 + (parseInt(i / 3)) * adjustedBox.w * 0.16))
                    .attr('y', (adjustedBox.h * 0.5 + adjustedBox.h * 0.12 * (i % 3)) + 16)
                    .style('fill', '#000000')
                    .style('font-weight', '')
                    .style('font-size', 11 + 'px')
                    .attr('text-anchor', 'start')
                    .style('pointer-events', 'none')
            }
        }
        this.init_data = init_data

        function expand() {
        }
        this.expand = expand
        function shrink() {
        }
        this.shrink = shrink

        function update_data() {

        }
        this.update_data = update_data

        function update() {
        }
        this.update = update
    }

    let svgSummaryMetrics = new SvgSummaryMetrics()
}
