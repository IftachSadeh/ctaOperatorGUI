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
var main_script_tag = 'SchedBlockController'
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
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 6
    let w0 = 12
    let div_key = 'main'

    opt_in.widget_func = {
        sock_func: sock_sched_block_controller,
        main_func: main_sched_blockController,
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
let sock_sched_block_controller = function(opt_in) {
    let widget_type = opt_in.widget_type
    // // -------------------------------------------------------------------
    // // get data from the server for a given telescope
    // // -------------------------------------------------------------------
    // this.askTelData = function(opt_in) {
    //   if(sock.con_stat.is_offline()) return;
    //   let data         = {};
    //   data.widget_id = widget_id;
    //   data.tel_id    = opt_in.tel_id;
    //   data.propId   = opt_in.propId;
    //   let emit_data = {
    //     'widget_name':widget_type, 'widget_id':widget_id,
    //     'method_name':'sched_block_controllerAskTelData',
    //     'method_arg':data
    //   };
    //   sock.socket.emit('widget', emit_data);
    //   return;
    // }

    // FUNCTION TO SEND DATA TO THE REDIS DATABASE (need eqivalent function in .py)
    this.pushNewBlockQueue = function(opt_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        let data = {
        }
        data.widget_id = opt_in.widget_id
        data.new_block_queue = opt_in.new_block_queue

        let emit_data = {
            widget_name: widget_type,
            widget_id: data.widget_id,
            method_name: 'sched_block_controller_push_queue',
            method_arg: data,
        }
        sock.socket.emit('widget', emit_data)
    }

    // EXEMPLE OF FUNCTION TO RECEIVE DATA FROM THE REDIS DATABASE
    // -------------------------------------------------------------------
    // get update for state1 data which was explicitly asked for by a given module
    // -------------------------------------------------------------------
    sock.socket.on('sched_block_controller_new_queue', function(data) {
        if (sock.con_stat.is_offline()) {
            return
        }
        console.log('sched_block_controller_new_queue received')

        $.each(sock.widget_funcs[widget_type].widgets, function(widget_id_now, module_now) {
            console.log(widget_id_now, module_now)
            if (data.metadata.sess_widget_ids.indexOf(widget_id_now) >= 0) {
                console.log(sock.widget_funcs[widget_type])
                sock.widget_funcs[widget_type].widgets[widget_id_now].scheduleSuccessfullyUpdate()
            }
        })
    })
}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go with the content of this particular widget
// -------------------------------------------------------------------
let main_sched_blockController = function(opt_in) {
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
        over: undefined,
        mode: 'inspector',
    }
    let svg = {
    }
    let box = {
    }
    let svg_dims = {
    }

    let blockQueue = null
    let event_queue_server = null
    let brushZoom = null

    // let this_sched_block_controller = this
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
                svg.svg.on('wheel', function() {
                    d3.event.preventDefault()
                })
            }
            svg.g = svg.svg.append('g')
        }
        function initBackground() {
            // svg.svg
            //   .style('background', color_theme.medium.background)
            svg.back = svg.svg.append('g')
            // svg.back.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', svg_dims.w[0] * 0.12)
            //   .attr('height', svg_dims.h[0] * 0.02)
            //   .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)
            // svg.back.append('text')
            //   .text('Menu')
            //   .style('fill', color_theme.bright.background)
            //   .style('font-weight', 'bold')
            //   .style('font-size', '8px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + (svg_dims.w[0] * 0.06) + ',' + (svg_dims.h[0] * 0.015) + ')')

            svg.back.append('rect')
                .attr('x', svg_dims.w[0] * 0.0)
                .attr('y', 0)
                .attr('width', svg_dims.w[0] * 0.66)
                .attr('height', svg_dims.h[0] * 0.02)
                .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                .attr('stroke', 'none')
                .attr('rx', 0)
            svg.back.append('text')
                .text('Scheduling & observation blocks')
                .style('fill', color_theme.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '8px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (svg_dims.w[0] * 0.33) + ',' + (svg_dims.h[0] * 0.015) + ')')

            svg.back.append('rect')
                .attr('x', svg_dims.w[0] * 0.0)
                .attr('y', svg_dims.h[0] * 0.98)
                .attr('width', svg_dims.w[0] * 0.66)
                .attr('height', svg_dims.h[0] * 0.02)
                .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                .attr('stroke', 'none')
                .attr('rx', 0)
            svg.back.append('text')
                .text('Visualization tools')
                .style('fill', color_theme.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '8px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (svg_dims.w[0] * 0.33) + ',' + (svg_dims.h[0] * 0.995) + ')')

            svg.back.append('rect')
                .attr('x', svg_dims.w[0] * 0.68)
                .attr('y', 0)
                .attr('width', svg_dims.w[0] * 0.32)
                .attr('height', svg_dims.h[0] * 0.02)
                .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                .attr('stroke', 'none')
                .attr('rx', 0)
            svg.back.append('text')
                .text('_information')
                .style('fill', color_theme.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '8px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (svg_dims.w[0] * 0.84) + ',' + (svg_dims.h[0] * 0.015) + ')')
        }
        function initBox() {
            box.block_queue_server = {
                x: svg_dims.w[0] * 0.004,
                y: svg_dims.h[0] * 0.175,
                w: svg_dims.w[0] * 0.62,
                h: svg_dims.h[0] * 0.45,
                marg: svg_dims.w[0] * 0.01,
            }
            box.event_queue_server = {
                x: svg_dims.w[0] * 0.004,
                y: svg_dims.h[0] * 0.025,
                w: svg_dims.w[0] * 0.62,
                h: svg_dims.h[0] * 0.14,
                marg: svg_dims.w[0] * 0.01,
            }
            box.brushZoom = {
                x: svg_dims.w[0] * 0.004,
                y: svg_dims.h[0] * 0.65,
                w: svg_dims.w[0] * 0.62,
                h: svg_dims.h[0] * 0.05,
                marg: svg_dims.w[0] * 0.01,
            }
            box.tools = {
                x: svg_dims.w[0] * 0.004,
                y: svg_dims.h[0] * 0.707,
                w: svg_dims.w[0] * 0.62,
                h: svg_dims.h[0] * 0.268,
                marg: svg_dims.w[0] * 0.01,
            }
            box.focusOverlay = {
                x: svg_dims.w[0] * 0.004,
                y: svg_dims.h[0] * 0.025,
                w: svg_dims.w[0] * 0.62,
                h: svg_dims.h[0] * 0.955,
                marg: svg_dims.w[0] * 0.01,
            }

            box.pushPull = {
                x: svg_dims.w[0] * 0.0,
                y: svg_dims.h[0] * 0.03,
                w: svg_dims.w[0] * 0.12,
                h: svg_dims.h[0] * 0.6,
                marg: svg_dims.w[0] * 0.01,
            }
            box.blockQueueOptimized = {
                x: svg_dims.w[0] * 0.0,
                y: svg_dims.h[0] * 0.35,
                w: svg_dims.w[0] * 0.625,
                h: svg_dims.h[0] * 0.3,
                marg: svg_dims.w[0] * 0.01,
            }
            box.blockQueueModif = {
                x: svg_dims.w[0] * 0.0,
                y: svg_dims.h[0] * 0.65,
                w: svg_dims.w[0] * 0.625,
                h: svg_dims.h[0] * 0.35,
                marg: svg_dims.w[0] * 0.01,
            }
            box.right_info = {
                x: svg_dims.w[0] * 0.68,
                y: svg_dims.h[0] * 0.025,
                w: svg_dims.w[0] * 0.315,
                h: svg_dims.h[0] * 0.97,
                marg: svg_dims.w[0] * 0.01,
            }
            // box.tab = {
            //   x: 0,
            //   y: box.rightPanel.h * 0.01,
            //   w: box.rightPanel.w,
            //   h: box.rightPanel.h * 0.05
            // }
            // box.content = {
            //   x: 0,
            //   y: box.rightPanel.h * 0.15,
            //   w: box.rightPanel.w,
            //   h: box.rightPanel.h * 0.84
            // }
        }
        function initDefaultStyle() {
            shared.style = {
            }
            shared.style.runRecCol = cols_blues[2]
            shared.style.blockCol = function(opt_in) {
                // let end_time_sec = is_def(opt_in.end_time_sec)
                //   ? opt_in.end_time_sec
                //   : undefined
                // if (end_time_sec < Number(shared.data.server.time_of_night.now)) return color_theme.blocks.shutdown
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
        initDefaultStyle()
        initBackground()
        initBox()

        shared.data.server = data_in.data
        shared.data.server.sched_blocks = create_sched_blocks(shared.data.server.blocks)
        let ce = shared.data.server.external_clock_events[0]
        for (let i = 0; i < ce.length; i++) {
            ce[i].start_time_sec = (new Date(ce[i].start_date).getTime() - new Date(shared.data.server.time_of_night.date_now)) / 1000
            ce[i].end_time_sec = ce[i].end_date === '' ? ce[i].start_time_sec + 1000 : (new Date(ce[i].end_date).getTime() - new Date(shared.data.server.time_of_night.date_now)) / 1000
        }

        svgBrush.init_data()
        svg_events_queue_server.init_data()
        // svgWarningArea.init_data({
        //   tag: 'pushPull',
        //   g: svg.g.append('g'),
        //   box: box.pushPull,
        //   attr: {
        //     text: {
        //       size: 9
        //     },
        //     icon: {
        //       size: 20
        //     }
        //   },
        //   pull: {
        //     g: undefined,
        //     box: {x: 0, y: 0, w: 0.5, h: 1},
        //     child: {}
        //   },
        //   push: {
        //     g: undefined,
        //     box: {x: 0.5, y: 0, w: 0.5, h: 1},
        //     child: {}
        //   },
        //   debug: {
        //     enabled: false
        //   }
        // })
        svgTargets.init_data()
        svgTelsConflict.init_data()
        svgRight_info.init_data()
        svg_blocks_queue_server.init_data()
        // svgBlocksQueueCopy.init_data()

        svg_events_queue_server.update_data()
        svg_blocks_queue_server.update_data()
        // svgBlocksQueueCopy.update_data()
        svgBrush.update_data()
        svgTargets.update_data()
        svgTelsConflict.update_data()

    // shared.mode = 'modifier'
    // switchMainMode()
    }
    this.init_data = init_data
    function update_dataOnce(data_in) {
        if (!locker.are_free([ 'pushNewSchedule' ])) {
            // console.log('pushing...');
            setTimeout(function() {
                update_dataOnce(data_in)
            }, 10)
            return
        }
        locker.add('update_data')
        shared.data.server = data_in.data
        shared.data.server.sched_blocks = create_sched_blocks(shared.data.server.blocks)
        let ce = shared.data.server.external_clock_events[0]
        for (let i = 0; i < ce.length; i++) {
            ce[i].start_time_sec = (new Date(ce[i].start_date).getTime() - new Date(shared.data.server.time_of_night.date_now)) / 1000
            ce[i].end_time_sec = ce[i].end_date === '' ? ce[i].start_time_sec + 1000 : (new Date(ce[i].end_date).getTime() - new Date(shared.data.server.time_of_night.date_now)) / 1000
        }

        svg_blocks_queue_server.update_data()
        svg_events_queue_server.update_data()
        svgBrush.update_data()
        svgRight_info.update()

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
        func: update_dataOnce,
        n_keep: 1,
    })

    function get_blocksData() {
        return shared.data.server.blocks
    }
    function get_sched_blocksData() {
        return shared.data.server.sched_blocks
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
            console.log(type, id)
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
                    focusCore(shared.focus.type, shared.focus.id)
                }
            }
            else {
                shared.focus = {
                    type: type,
                    id: id,
                }
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

    function send_sync_state_to_server(data_in) {
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
        if (opt_in.end_time_sec < Number(shared.data.server.time_of_night.now)) {
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

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    // let SvgBlocksQueue = function () {
    //   // -------------------------------------------------------------------
    //   //
    //   // -------------------------------------------------------------------
    //   function init_data () {
    //     let x0, y0, w0, h0, marg
    //     w0 = svg_dims.w[0] * 0.45 // 0.6
    //     h0 = svg_dims.h[0] * 0.14 // 0.18
    //     x0 = (svg_dims.w[0] * 0.02)
    //     y0 = (svg_dims.h[0] * 0.04)
    //     marg = w0 * 0.01
    //     let blockBoxData = {
    //       x: x0,
    //       y: y0,
    //       w: w0,
    //       h: h0,
    //       marg: marg
    //     }
    //     let gBlockBox = svg.g.append('g')
    //       .attr('transform', 'translate(' + x0 + ',' + y0 + ')')
    //     gBlockBox.append('text')
    //       .text('CURRENT SCHEDULE')
    //       .style('fill', color_theme.medium.text)
    //       .style('font-weight', 'bold')
    //       .style('font-size', '8px')
    //       .attr('text-anchor', 'left')
    //       .attr('transform', 'translate(-5,' + (y0 + h0 * 0.8) + ') rotate(270)')
    //     // gBlockBox.append('rect')
    //     //   .attr('x', 0)
    //     //   .attr('y', -10)
    //     //   // .attr('rx', 2)
    //     //   // .attr('ry', 2)
    //     //   .attr('width', blockBoxData.w + 0)
    //     //   .attr('height', blockBoxData.h + 12) // + 35)
    //     //   .attr('stroke', color_theme.brighter.stroke)
    //     //   .attr('stroke-width', 0.4)
    //     //   // .attr('stroke-width', 12)
    //     //   // .attr('stroke-dasharray', [blockBoxData.w + 10 + blockBoxData.h + 10 + 35 + 6, blockBoxData.w + 10 - 12, blockBoxData.h + 10 + 35 + 16])
    //     //   .style('fill', color_theme.brighter.background)
    //     blockQueue = new BlockQueue({
    //       main: {
    //         tag: 'blockQueueTopTag',
    //         g: gBlockBox,
    //         box: blockBoxData,
    //         background: {
    //           fill: color_theme.dark.background,
    //           stroke: color_theme.dark.stroke,
    //           strokeWidth: 0.1
    //         },
    //         color_theme: color_theme
    //       },
    //       axis: {
    //         enabled: true,
    //         g: undefined,
    //         box: {x: 0, y: blockBoxData.h, w: blockBoxData.w, h: 0, marg: blockBoxData.marg},
    //         axis: undefined,
    //         scale: undefined,
    //         domain: [0, 1000],
    //         range: [0, 0],
    //         showText: true,
    //         orientation: 'axisTop',
    //         attr: {
    //           text: {
    //             stroke: color_theme.medium.stroke,
    //             fill: color_theme.medium.stroke
    //           },
    //           path: {
    //             stroke: color_theme.medium.stroke,
    //             fill: color_theme.medium.stroke
    //           }
    //         }
    //       },
    //       blocks: {
    //         enabled: true,
    //         run: {
    //           enabled: true,
    //           g: undefined,
    //           box: {x: 0, y: blockBoxData.h * 0.45, w: blockBoxData.w, h: blockBoxData.h * 0.55, marg: blockBoxData.marg},
    //           events: {
    //             click: () => {},
    //             mouseover: () => {},
    //             mouseout: () => {},
    //             drag: {
    //               start: () => {},
    //               tick: () => {},
    //               end: () => {}
    //             }
    //           },
    //           background: {
    //             fill: color_theme.brighter.background,
    //             stroke: 'none',
    //             strokeWidth: 0
    //           }
    //         },
    //         cancel: {
    //           enabled: true,
    //           g: undefined,
    //           box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h * 0.3, marg: blockBoxData.marg},
    //           events: {
    //             click: () => {},
    //             mouseover: () => {},
    //             mouseout: () => {},
    //             drag: {
    //               start: () => {},
    //               tick: () => {},
    //               end: () => {}
    //             }
    //           },
    //           background: {
    //             fill: color_theme.brighter.background,
    //             stroke: color_theme.brighter.stroke,
    //             strokeWidth: 0
    //           }
    //         },
    //         modification: {
    //           enabled: false,
    //           g: undefined,
    //           box: undefined,
    //           events: {
    //             click: undefined,
    //             mouseover: undefined,
    //             mouseout: undefined,
    //             drag: {
    //               start: () => {},
    //               tick: () => {},
    //               end: () => {}
    //             }
    //           },
    //           background: {
    //             fill: undefined,
    //             stroke: undefined,
    //             strokeWidth: undefined
    //           }
    //         },
    //         colorPalette: color_theme.blocks
    //       },
    //       filters: {
    //         enabled: false,
    //         g: undefined,
    //         box: {x: 0, y: blockBoxData.h * 0.15, w: svg_dims.w[0] * 0.12, h: blockBoxData.h * 0.7, marg: 0},
    //         filters: []
    //       },
    //       timeBars: {
    //         enabled: true,
    //         g: undefined,
    //         box: {x: 0, y: 0, w: blockBoxData.w, h: blockBoxData.h, marg: blockBoxData.marg}
    //       },
    //       time: {
    //         current_time: {time: 0, date: undefined},
    //         start_time_sec: {time: 0, date: undefined},
    //         end_time_sec: {time: 0, date: undefined},
    //       },
    //       data: {
    //         raw: undefined,
    //         formated: undefined,
    //         modified: undefined
    //       },
    //       debug: {
    //         enabled: false
    //       },
    //       pattern: {},
    //       event: {
    //       },
    //       input: {
    //         focus: {sched_blocks: undefined, block: undefined},
    //         over: {sched_blocks: undefined, block: undefined},
    //         selection: []
    //       }
    //     })
    //
    //     blockQueue.init()
    //     update_data()
    //   }
    //   this.init_data = init_data
    //
    //   function update_data () {
    //     let tel_ids = []
    //     $.each(shared.data.server.inst_health, function (index, data_now) {
    //       tel_ids.push(data_now.id)
    //     })
    //     blockQueue.update_data({
    //       time: {
    //         current_time: {date: new Date(shared.data.server.time_of_night.date_now), time: Number(shared.data.server.time_of_night.now)},
    //         start_time_sec: {date: new Date(shared.data.server.time_of_night.date_start), time: Number(shared.data.server.time_of_night.start)},
    //         end_time_sec: {date: new Date(shared.data.server.time_of_night.date_end), time: Number(shared.data.server.time_of_night.end)}
    //       },
    //       data: {
    //         raw: {
    //           blocks: shared.data.server.blocks,
    //           tel_ids: tel_ids
    //         }
    //       }
    //     })
    //   }
    //   this.update_data = update_data
    // }
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
                        fill: color_theme.medium.background,
                        stroke: color_theme.medium.stroke,
                        strokeWidth: 0.4,
                    },
                    color_theme: color_theme,
                },

                displayer: 'eventTrack',
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

        function update_data() {
            let axisTop = brushZoom.get_axis().axis.scale().domain()
            let current_time = {
                date: new Date(shared.data.server.time_of_night.date_now),
                time: shared.data.server.time_of_night.now,
            }
            let start_time_sec = {
                date: axisTop[0],
                time: shared.data.server.time_of_night.start,
            }
            let end_time_sec = {
                date: axisTop[1],
                time: shared.data.server.time_of_night.end,
            }
            event_queue_server.update_data({
                time: {
                    current_time: current_time,
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
            //     current_time: {date: new Date(shared.data.server.time_of_night.date_now), time: Number(shared.data.server.time_of_night.now)},
            //     start_time_sec: {date: new Date(shared.data.server.time_of_night.date_start), time: Number(shared.data.server.time_of_night.start)},
            //     end_time_sec: {date: new Date(shared.data.server.time_of_night.date_end), time: Number(shared.data.server.time_of_night.end)}
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
            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

            blockQueue = new BlockDisplayer({
                main: {
                    tag: 'blockQueueInspectorTag',
                    g: reserved.g,
                    scroll: {
                    },
                    box: adjustedBox,
                    background: {
                        fill: color_theme.medium.background,
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
                            enabled: true,
                            position: 'right',
                            clickable: true,
                            size: (svg_dims.w[0] * 0.65 - adjustedBox.w),
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
                        enabled: true,
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
                        click: function(id) {
                            focusManager.focusOn('block', id.obs_block_id)
                        },
                        dbclick: function(d) {},
                        mouseover: focusManager.over,
                        mouseout: focusManager.out,
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
                    // if (startT < shared.data.server.time_of_night.now) return color_theme.blocks.shutdown
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
                    if (startT < shared.data.server.time_of_night.now) {
                        return 'url(#patternLock)'
                    }
                    return 'none'
                },
            })

            let axisTop = brushZoom.get_axis()
            reserved.g.append('rect')
                .attr('id', 'cloak')
                .attr('x', 0)
                .attr('y', -adjustedBox.y)
                .attr('width', 0)
                .attr('height', svg_dims.h[0])
                .attr('fill', color_theme.darker.stroke)
                .attr('stroke', 'none')
                .style('opacity', 0.2)
                .style('pointer-events', 'none')
        }
        this.init_data = init_data

        function update_data() {
            let tel_ids = []
            $.each(shared.data.server.inst_health, function(index, data_now) {
                tel_ids.push(data_now.id)
            })

            let axisTop = brushZoom.get_axis().axis.scale().domain()
            let newWidth = brushZoom.get_axis().scale(new Date(shared.data.server.time_of_night.date_now))
            if (newWidth < 0) {
                newWidth = 0
            }
            if (newWidth > box.block_queue_server.w) {
                newWidth = box.block_queue_server.w
            }
            reserved.g.select('rect#cloak').attr('width', newWidth)

            let current_time = {
                date: new Date(shared.data.server.time_of_night.date_now),
                time: shared.data.server.time_of_night.now,
            }
            let start_time_sec = {
                date: axisTop[0],
                time: shared.data.server.time_of_night.start,
            }
            let end_time_sec = {
                date: axisTop[1],
                time: shared.data.server.time_of_night.end,
            }
            console.log(get_blocksData())
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
        }
        this.update_data = update_data

        function update() {
            let current_time = {
                date: new Date(shared.data.server.time_of_night.date_now),
                time: shared.data.server.time_of_night.now,
            }
            let axisTop = brushZoom.get_axis().axis.scale().domain()
            console.log(axisTop)
            let start_time_sec = {
                date: axisTop[0],
                time: shared.data.server.time_of_night.start,
            }
            let end_time_sec = {
                date: axisTop[1],
                time: shared.data.server.time_of_night.end,
            }

            blockQueue.update({
                time: {
                    current_time: current_time,
                    start_time_sec: start_time_sec,
                    end_time_sec: end_time_sec,
                },
            })
        }
        this.update = update

        function switchMainMode() {
            if (shared.mode === 'inspector') {
                blockQueue.switchStyle()
            }
            else if (shared.mode === 'modifier') {
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
                        // if (startT < shared.data.server.time_of_night.now) return color_theme.blocks.shutdown
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
                        let startT = is_def(opt_in.time.start)
                            ? opt_in.time.start
                            : opt_in.d.time.start
                        if (startT < shared.data.server.time_of_night.now) {
                            return 'url(#patternLock)'
                        }
                        return 'none'
                    },
                })
            }
            svg_blocks_queue_server.update_data()
        }
        this.switchMainMode = switchMainMode
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
                .attr('fill', colorPalette.darker.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.4)
                .attr('stroke-dasharray', [ 0, brushBox.w, brushBox.h * 0.7, brushBox.w, brushBox.h * 0.7 ])

            brushZoom = new PlotBrushZoom()
            // {
            //     main: {
            //         g: reserved.g,
            //         box: brushBox,
            //     },
            //     clipping: {
            //         enabled: false,
            //     },
            //     axis: [
            //         {
            //             id: 'top',
            //             enabled: true,
            //             showAxis: true,
            //             main: {
            //                 g: undefined,
            //                 box: {
            //                     x: 0,
            //                     y: brushBox.h * 0.2,
            //                     w: brushBox.w,
            //                     h: brushBox.h * 0.2,
            //                     marg: 0,
            //                 },
            //                 type: 'bottom',
            //                 attr: {
            //                     text: {
            //                         enabled: false,
            //                         size: 14,
            //                         stroke: color_theme.medium.stroke,
            //                         fill: color_theme.medium.stroke,
            //                     },
            //                     path: {
            //                         enabled: false,
            //                         stroke: color_theme.medium.stroke,
            //                         fill: color_theme.medium.stroke,
            //                     },
            //                 },
            //             },
            //             axis: undefined,
            //             scale: undefined,
            //             domain: [ 0, 1000 ],
            //             range: [ 0, brushBox.w ],
            //             brush: {
            //                 zoom: true,
            //                 brush: true,
            //             },
            //         },
            //         {
            //             id: 'middle',
            //             enabled: true,
            //             showAxis: true,
            //             main: {
            //                 g: undefined,
            //                 box: {
            //                     x: 0,
            //                     y: brushBox.h * 0.95,
            //                     w: brushBox.w,
            //                     h: brushBox.h * 0.0,
            //                     marg: 0,
            //                 },
            //                 type: 'top',
            //                 attr: {
            //                     text: {
            //                         enabled: true,
            //                         size: 10,
            //                         stroke: color_theme.medium.stroke,
            //                         fill: color_theme.medium.stroke,
            //                     },
            //                     path: {
            //                         enabled: false,
            //                         stroke: color_theme.medium.background,
            //                         fill: color_theme.medium.background,
            //                     },
            //                 },
            //             },
            //             axis: undefined,
            //             scale: undefined,
            //             domain: [ 0, 1000 ],
            //             range: [ 0, brushBox.w ],
            //             brush: {
            //                 zoom: false,
            //                 brush: false,
            //             },
            //         },
            //         {
            //             id: 'bottom',
            //             enabled: true,
            //             showAxis: true,
            //             main: {
            //                 g: undefined,
            //                 box: {
            //                     x: 0,
            //                     y: brushBox.h * 0.6,
            //                     w: brushBox.w,
            //                     h: brushBox.h * 0.2,
            //                     marg: 0,
            //                 },
            //                 type: 'top',
            //                 attr: {
            //                     text: {
            //                         enabled: false,
            //                         size: 14,
            //                         stroke: color_theme.medium.stroke,
            //                         fill: color_theme.medium.stroke,
            //                     },
            //                     path: {
            //                         enabled: true,
            //                         stroke: color_theme.medium.stroke,
            //                         fill: color_theme.medium.stroke,
            //                     },
            //                 },
            //             },
            //             axis: undefined,
            //             scale: undefined,
            //             domain: [ 0, 1000 ],
            //             range: [ 0, brushBox.w ],
            //             brush: {
            //                 zoom: false,
            //                 brush: false,
            //             },
            //         },
            //     ],
            //     content: {
            //         enabled: true,
            //         main: {
            //             g: undefined,
            //             box: {
            //                 x: 0,
            //                 y: brushBox.h * 0.15,
            //                 w: brushBox.w,
            //                 h: brushBox.h * 0.65,
            //                 marg: 0,
            //             },
            //             attr: {
            //                 fill: colorPalette.medium.background,
            //             },
            //         },
            //     },
            //     focus: {
            //         enabled: true,
            //         main: {
            //             g: undefined,
            //             box: {
            //                 x: 0,
            //                 y: brushBox.h * 0.15,
            //                 w: brushBox.w,
            //                 h: brushBox.h * 0.65,
            //                 marg: 0,
            //             },
            //             attr: {
            //                 fill: colorPalette.darker.background,
            //                 opacity: 1,
            //                 stroke: colorPalette.darker.background,
            //             },
            //         },
            //     },
            //     brush: {
            //         coef: {
            //             x: 0,
            //             y: 0,
            //         },
            //         callback: () => {},
            //     },
            //     zoom: {
            //         coef: {
            //             kx: 1,
            //             ky: 1,
            //             x: 0,
            //             y: 0,
            //         },
            //         callback: function() {
            //             svg_blocks_queue_server.update_data()
            //         },
            //     },
            // }
            brushZoom.init({
                g: reserved.g,
                box: brushBox,

                domain: [ 0, 100 ],
                id: 'brush',
                location: 'bottom',
                profile: 'context',
                range: [ 0, brushBox.w ],
                type: 'time',
                brush: {
                    coef: {
                        x: 0,
                        y: 0,
                    },
                    callback: () => {},
                    enabled: true,
                },
                zoom: {
                    coef: {
                        kx: 1,
                        ky: 1,
                        x: 0,
                        y: 0,
                    },
                    callback: function() {
                        svg_blocks_queue_server.update_data()
                    },
                    enabled: true,
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
                date: new Date(shared.data.server.time_of_night.date_start),
                time: Number(shared.data.server.time_of_night.start),
            }
            let end_time_sec = {
                date: new Date(shared.data.server.time_of_night.date_end),
                time: Number(shared.data.server.time_of_night.end),
            }

            brushZoom.update_axis({
                domain: [ start_time_sec.date, end_time_sec.date ],
            })
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
            let axisTop = brushZoom.get_axis().axis.scale().domain()
            let start_time_sec = {
                date: axisTop[0],
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[0]) / -1000,
            }
            let end_time_sec = {
                date: axisTop[1],
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[1]) / -1000,
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
            //   .attr('font-size', 10)
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
                .domain([ Number(shared.data.server.time_of_night.start), Number(shared.data.server.time_of_night.end) ])
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
                    .attr('font-size', 8)
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
                    .attr('font-size', 8)
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
                    .attr('font-size', 8)
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
                    .attr('font-size', 8)
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
            // let gBlockBox = svg.g.append('g')
            //   .attr('transform', 'translate(' + reserved.box.x + ',' + reserved.box.y + ')')

            // gBlockBox.append('text')
            //   .text('MODIFICATIONS')
            //   .style('fill', color_theme.medium.text)
            //   .style('font-weight', 'bold')
            //   .style('font-size', '8px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(-5,' + (reserved.box.h * 0.5) + ') rotate(270)')

            reserved.gTargets = reserved.clipping.clipBody.append('g')
            // reserved.gTargets.append('defs').append('svg:clipPath')
            //   .attr('id', 'clip')
            //   .append('svg:rect')
            //   .attr('id', 'clip-rect')
            //   .attr('x', '0')
            //   .attr('y', '0')
            //   .attr('width', reserved.box.w)
            //   .attr('height', reserved.box.h)
            // reserved.clipBody = reserved.gTargets.append('g')
            //   .attr('clip-path', '') // 'url(#clip)')

            let range = reserved.box.h * 0.33333

            reserved.clipping.g.append('text')
                .text('L')
                .style('fill', color_theme.dark.stroke)
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (reserved.box.w + 4) + ',' + (range * 0.5 + 5) + ')')
            reserved.clipping.g.append('text')
                .text('M')
                .style('fill', color_theme.dark.stroke)
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (reserved.box.w + 4) + ',' + (range * 1.5 + 5) + ')')
            reserved.clipping.g.append('text')
                .text('S')
                .style('fill', color_theme.dark.stroke)
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (reserved.box.w + 4) + ',' + (range * 2.5 + 5) + ')')

            reserved.clipping.g.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', reserved.box.w)
                .attr('height', range)
                .attr('fill', 'none')
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.5)
            reserved.clipping.g.append('rect')
                .attr('x', 0)
                .attr('y', range * 1)
                .attr('width', reserved.box.w)
                .attr('height', range)
                .attr('fill', 'none')
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.5)
            reserved.clipping.g.append('rect')
                .attr('x', 0)
                .attr('y', range * 2)
                .attr('width', reserved.box.w)
                .attr('height', range)
                .attr('fill', 'none')
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.5)
        }
        this.init_data = init_data
        function update_data() {
            drawTelsAvailabilityCurve()
        }
        this.update_data = update_data
        function update() {}
        this.update = update

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

            let axisTop = brushZoom.get_axis().axis.scale().domain()
            let start_time_sec = {
                date: axisTop[0],
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[0]) / -1000,
            }
            let end_time_sec = {
                date: axisTop[1],
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[1]) / -1000,
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
                .on('mouseover', function(d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'small')
                })
                .on('mouseout', function(d) {
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
                .on('mouseover', function(d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'small')
                })
                .on('mouseout', function(d) {
                    mouseOut(d3.select(d3.select(this).node().parentNode), d, 'small')
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
                .on('mouseover', function(d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'medium')
                })
                .on('mouseout', function(d) {
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
                .on('mouseover', function(d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'medium')
                })
                .on('mouseout', function(d) {
                    mouseOut(d3.select(d3.select(this).node().parentNode), d, 'medium')
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
                .on('mouseover', function(d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'large')
                })
                .on('mouseout', function(d) {
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
                .on('mouseover', function(d) {
                    mouseHover(d3.select(d3.select(this).node().parentNode), d, 'large')
                })
                .on('mouseout', function(d) {
                    mouseOut(d3.select(d3.select(this).node().parentNode), d, 'large')
                })

            allg
                .exit()
                .style('opacity', 0)
                .remove()
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
            // smallTels[shared.data.server.time_of_night.start] = 0
            // mediumTels[shared.data.server.time_of_night.start] = 0
            // largeTels[shared.data.server.time_of_night.start] = 0
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
                        id: 'LMS' + timeMarker[i] + Number(shared.data.server.time_of_night.start),
                        start: Number(shared.data.server.time_of_night.start),
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
                        id: 'LMS' + timeMarker[i] + Number(shared.data.server.time_of_night.end),
                        start: timeMarker[i],
                        end: Number(shared.data.server.time_of_night.end),
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
        function init_data() {
            reserved.hasData = false
        }
        this.init_data = init_data
        function update_data() {
            reserved.hasData = true
        }
        this.update_data = update_data
        function update() {}
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
            // reserved.drag.timer.g.append('rect')
            //   .attr('class', 'timelineCursor')
            //   .attr('x', reserved.drag.position.left)
            //   .attr('y', 100) // - Number(reserved.drag.oldRect.attr('height')))
            //   .attr('width', reserved.drag.position.right - reserved.drag.position.left)
            //   .attr('height', 2)
            //   .attr('fill', color_theme.brighter.background)
            //   .attr('stroke', '#333333')
            //   .attr('fill-opacity', 0.99)

            // reserved.drag.timer.timer.g = reserved.drag.timer.g.append('g')
            //   .attr('class', 'timeline')
            //   .attr('transform', 'translate(' + (reserved.drag.position.left) + ',' + (com.blocks.run.box.y + com.blocks.run.box.h) + ')')
            if (shared.mode === 'inspector') {
                reserved.drag.timer.g.append('line')
                    .attr('id', 'leftBar')
                    .attr('x1', -4)
                    .attr('y1', 4 + 20)
                    .attr('x2', 0)
                    .attr('y2', -1 + 20)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.6)
                reserved.drag.timer.g.append('line')
                    .attr('id', 'rightBar')
                    .attr('x1', reserved.drag.position.width + 4)
                    .attr('y1', 4 + 20)
                    .attr('x2', reserved.drag.position.width)
                    .attr('y2', -1 + 20)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.6)

                reserved.drag.timer.g.append('text')
                    .attr('class', 'hourLeft')
                    .text(function() {
                        let time = new Date(shared.data.server.time_of_night.date_start)
                        time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.left))
                        return d3.timeFormat('%H:')(time)
                    })
                    .attr('x', -24)
                    .attr('y', 30) // - Number(reserved.drag.oldRect.attr('height')))
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
                    .style('font-size', '10px')
                    .attr('dy', '0px')
                reserved.drag.timer.g.append('text')
                    .attr('class', 'minuteLeft')
                    .text(function() {
                        let time = new Date(shared.data.server.time_of_night.date_start)
                        time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.left))
                        return d3.timeFormat('%M')(time)
                    })
                    .attr('x', -12)
                    .attr('y', 30) // - Number(reserved.drag.oldRect.attr('height')))
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
                    .style('font-size', '10px')
                    .attr('dy', '0px')

                reserved.drag.timer.g.append('text')
                    .attr('class', 'hourRight')
                    .text(function() {
                        let time = new Date(shared.data.server.time_of_night.date_start)
                        time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.right))
                        return d3.timeFormat('%H:')(time)
                    })
                    .attr('x', reserved.drag.position.width + 12)
                    .attr('y', 30) // - Number(reserved.drag.oldRect.attr('height')))
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
                    .style('font-size', '10px')
                    .attr('dy', '0px')
                reserved.drag.timer.g.append('text')
                    .attr('class', 'minuteRight')
                    .text(function() {
                        let time = new Date(shared.data.server.time_of_night.date_start)
                        time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.right))
                        return d3.timeFormat('%M')(time)
                    })
                    .attr('x', reserved.drag.position.width + 24)
                    .attr('y', 30) // - Number(reserved.drag.oldRect.attr('height')))
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
                    .style('font-size', '10px')
                    .attr('dy', '0px')
            }
            else {
                reserved.drag.timer.g.append('line')
                    .attr('id', 'leftBar')
                    .attr('x1', -6)
                    .attr('y1', 2)
                    .attr('x2', 0)
                    .attr('y2', 8)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 2)
                reserved.drag.timer.g.append('line')
                    .attr('id', 'rightBar')
                    .attr('x1', reserved.drag.position.width)
                    .attr('y1', 8)
                    .attr('x2', reserved.drag.position.width + 6)
                    .attr('y2', 2)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 2)
                reserved.drag.timer.g.append('text')
                    .attr('class', 'hourLeft')
                    .text(function() {
                        let time = new Date(shared.data.server.time_of_night.date_start)
                        time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.left))
                        return d3.timeFormat('%H:')(time)
                    })
                    .attr('x', -28)
                    .attr('y', 0) // - Number(reserved.drag.oldRect.attr('height')))
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
                        let time = new Date(shared.data.server.time_of_night.date_start)
                        time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.left))
                        return d3.timeFormat('%M')(time)
                    })
                    .attr('x', -12)
                    .attr('y', 0) // - Number(reserved.drag.oldRect.attr('height')))
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
                        let time = new Date(shared.data.server.time_of_night.date_start)
                        time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.right))
                        return d3.timeFormat('%H:')(time)
                    })
                    .attr('x', reserved.drag.position.width + 12)
                    .attr('y', 0) // - Number(reserved.drag.oldRect.attr('height')))
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
                        let time = new Date(shared.data.server.time_of_night.date_start)
                        time.setSeconds(time.getSeconds() + reserved.drag.timescale.invert(reserved.drag.position.right))
                        return d3.timeFormat('%M')(time)
                    })
                    .attr('x', reserved.drag.position.width + 28)
                    .attr('y', 0) // - Number(reserved.drag.oldRect.attr('height')))
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
            // reserved.drag.oldG.select('rect.back').style('fill-opacity', 1)
            // reserved.drag.oldG.select('rect.back').style('stroke-opacity', 1)
        }

        function hide_block_info(d) {
            if (!reserved.drag.g) {
                return
            }
            if (reserved.drag.locked) {
                return
            }

            reserved.drag.g.remove()
            reserved.drag = {
            }
            svgTargets.unhighlightTarget(d)
        }
        function show_block_info(d) {
            if (reserved.drag.g) {
                return
            }
            hide_block_info()
            // if (!reserved.hasData) return
            // if (reserved.drag.g) return
            svgTargets.highlightTarget(d)
            reserved.drag.box = {
                x: box.focusOverlay.x,
                y: box.focusOverlay.y,
                w: box.focusOverlay.w,
                h: box.focusOverlay.h,
                marg: svg_dims.w[0] * 0.01,
            }
            reserved.drag.g = svg.g.append('g')
                .attr('transform', 'translate(' + reserved.drag.box.x + ',' + reserved.drag.box.y + ')')
            // reserved.drag.g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', reserved.drag.box.w)
            //   .attr('height', reserved.drag.box.h)
            //   .attr('fill', 'transparent')
            //   .style('pointer-events', 'none')

            reserved.drag.timescale = d3.scaleLinear()
                .range([ 0, reserved.drag.box.w ])
                .domain([ Number(shared.data.server.time_of_night.start), Number(shared.data.server.time_of_night.end) ])
            if (!d) {
                return
            }
            reserved.drag.position = {
                width: reserved.drag.timescale(d.time.end) - reserved.drag.timescale(d.time.start),
                left: reserved.drag.timescale(d.time.start),
                right: reserved.drag.timescale(d.time.end),
            }
            createDragColumn(d)
            // createDragBlock(d)
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
            // reserved.g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', reserved.box.w)
            //   .attr('height', reserved.box.h)
            //   .attr('fill', color_theme.dark.background)
            createQuickAccess()
            initOverview()
            updateOverview()
        }
        this.init_data = init_data
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

        function update() {
            updateOverview()
        }
        this.update = update

        function createQuickAccess() {
            let box = {
                icons: {
                    x: reserved.box.w * 0.8,
                    y: 0,
                    w: reserved.box.w * 0.2,
                    h: reserved.box.h * 0.12,
                },
                mapping: {
                    x: reserved.box.w * 0.0,
                    y: 0,
                    w: reserved.box.w * 0.9,
                    h: reserved.box.h * 0.6,
                },
            }
            let display
            let gback = reserved.quickg.append('g').attr('id', 'quickAccessBack')
            let gfore = reserved.quickg.append('g').attr('id', 'quickAccessFore')

            function cleanBack() {
                gback.selectAll('*').remove()
                reserved.g.attr('opacity', 1)
            }
            function createBlockMapping() {
                let scheds = []
                let inter = get_sched_blocksData()
                for (let key in inter) {
                    inter[key].id = key
                    scheds.push(inter[key])
                }

                reserved.g.attr('opacity', 0.05)

                let height = headerSize * 2.5
                let square = parseInt(Math.sqrt(scheds.length))
                square = 11 // square + (scheds.length % square === 0 ? 0 : 1)
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
                            .on('mouseover', function(d) {
                                d3.select(this).style('cursor', 'pointer')
                                d3.select(this).attr('fill', d3.color(color.background).darker(0.9))
                            })
                            .on('mouseout', function(d) {
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
                        .on('mouseover', function(d) {
                            d3.select(this).style('cursor', 'pointer')
                            d3.select(this).attr('fill', color_theme.darker.background)
                        })
                        .on('mouseout', function(d) {
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
                        .text('T' + d.name.split('_')[1])
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
                            background: {
                                middle: {
                                    color: colorPalette.blocks.run.background,
                                    opacity: 0.4,
                                },
                                side: {
                                    color: colorPalette.blocks.run.background,
                                    opacity: 0.3,
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

        function initOverview() {
            reserved.overview = {
            }
            let allBox
            function createBlocks_information() {
                let box = allBox.blocks
                let g = reserved.g.append('g').attr('id', 'blocks_information')
                    .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
                box.y += title_size
                g.append('text')
                    .text('Execution states')
                    .attr('x', 0)
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

                box.y += headerSize
                new_d3_node(g,
                    'text',
                    {
                        'id': 'sbs',
                        'x': reserved.box.w * 0.44,
                        'y': box.y,
                        'text-anchor': 'end',
                        'fill': color_theme.dark.text,
                    },
                    {
                        'font-size': txt_size + 'px',
                        'font-weight': 'bold',
                        'pointer-events': 'none',
                    }
                ).text('?') // Object.keys(get_sched_blocksData()).length
                new_d3_node(g,
                    'text',
                    {
                        'x': reserved.box.w * 0.45,
                        'y': box.y,
                        'text-anchor': 'start',
                        'fill': color_theme.dark.text,
                    },
                    {
                        'font-size': txt_size + 'px',
                        'font-weight': '',
                        'pointer-events': 'none',
                    }
                ).text('Sbs')

                new_d3_node(g,
                    'text',
                    {
                        id: 'obs',
                        'x': reserved.box.w * 0.6,
                        'y': box.y,
                        'text-anchor': 'end',
                        'fill': color_theme.dark.text,
                    },
                    {
                        'font-size': txt_size + 'px',
                        'font-weight': 'bold',
                        'pointer-events': 'none',
                    }
                ).text('?')
                new_d3_node(g,
                    'text',
                    {
                        'x': reserved.box.w * 0.61,
                        'y': box.y,
                        'text-anchor': 'start',
                        'fill': color_theme.dark.text,
                    },
                    {
                        'font-size': txt_size + 'px',
                        'font-weight': '',
                        'pointer-events': 'none',
                    }
                ).text('Obs')

                let infoState = [
                    {
                        state: 'run',
                    },
                    {
                        state: 'done',
                    },
                    {
                        state: 'fail',
                    },
                    {
                        state: 'cancel',
                    },
                    {
                        state: 'wait',
                    },
                ]

                box.y += 4
                let rects = g
                    .selectAll('g.state')
                    .data(infoState, function(d) {
                        return d.state
                    })
                let enter = rects
                    .enter()
                    .append('g')
                    .attr('class', 'state')
                enter.each(function(d) {
                    d3.select(this).append('rect')
                        .attr('y', box.y)
                        .attr('height', txt_size * 2)
                        .attr('stroke', setCol({
                            state: d.state,
                            can_run: true,
                        }).stroke)
                        .attr('fill', setCol({
                            state: d.state,
                            can_run: true,
                        }).background)
                        .attr('stroke-width', 0.2)
                    d3.select(this).append('text')
                        .attr('y', box.y + txt_size + txt_size * 0.3)
                        .text(d.nb)
                        .style('font-weight', 'bold')
                        .attr('text-anchor', 'middle')
                        .style('font-size', txt_size + 'px')
                        .style('pointer-events', 'none')
                        .attr('fill', setCol({
                            state: d.state,
                            can_run: true,
                        }).text)
                        .attr('stroke', 'none')
                })
            }
            function createPointing_information() {
                let box = allBox.targets
                let g = reserved.g.append('g')
                    .attr('id', 'pointing_information')
                    .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
                box.y = 0
                g.append('text')
                    .text('Targets list')
                    .attr('x', box.x)
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
                box.y += 1
                g.append('rect')
                    .attr('id', 'headerStrip')
                    .attr('x', 0)
                    .attr('y', box.y)
                    .attr('width', box.w)
                    .attr('height', headerSize)
                    .attr('fill', color_theme.dark.stroke)
                let label = [
                    {
                        x: box.w * 0.01,
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        text: 'Targets',
                    },
                    {
                        x: box.w * 0.15,
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        text: 'Scheds',
                    },
                    {
                        x: box.w * 0.3,
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        text: 'Obs',
                    },
                    {
                        x: box.w * 0.45,
                        y: box.y + headerSize * 0.5 + txt_size * 0.3,
                        text: 'Running blocks',
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
                box.y += headerSize + 0
                let targ = g.append('g').attr('id', 'targets')
                    .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
                reserved.overview.scrollBox = initScrollBox('targetRessourceScroll', targ, box, {
                    enabled: false,
                })
                reserved.overview.scrollBox.reset_vertical_scroller({
                    can_scroll: true,
                    scroll_height: shared.data.server.targets.length * 40,
                })
                g.append('line')
                    .attr('x1', box.x)
                    .attr('y1', box.y + box.h)
                    .attr('x2', box.w)
                    .attr('y2', box.y + box.h)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.4)
            }
            function createTelescope_information() {
                let box = allBox.tels
                let g = reserved.g.append('g')
                    .attr('id', 'telescopes_information')
                    .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
                box.y = 0
                g.append('text')
                    .text('Telescopes list')
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

                box.y += 1
                let xx = box.w * 0.12
                let ww = box.w * 0.88
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
                let gt = g.append('g')
                    .attr('id', 'telsDisplayer')
                    .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
                reserved.telescopeRunning = new TelescopeDisplayer({
                    main: {
                        tag: 'telescopeRootTag',
                        g: gt,
                        scroll: {
                        },
                        box: box,
                        background: {
                            fill: color_theme.medium.background,
                            stroke: color_theme.medium.stroke,
                            strokeWidth: 0.0,
                        },
                        is_south: is_south,
                        color_theme: color_theme,
                    },

                    displayer: 'gridBib',
                    gridBib: {
                        header: {
                            text: {
                                size: 8,
                                color: color_theme.medium.background,
                            },
                            background: {
                                height: 10,
                                color: color_theme.dark.stroke,
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
                                    size: 1,
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
                                    telsPerRow: 7,
                                    nbl: 0,
                                    size: 1,
                                    ratio: 1,
                                },
                                box: smallBox,
                            },
                        },
                        idle: {
                            txt_size: 9,
                            enabled: true,
                            background: {
                                middle: {
                                    color: color_theme.darker.background,
                                    opacity: 1,
                                },
                                side: {
                                    color: color_theme.dark.background,
                                    opacity: 1,
                                },
                            },
                        },
                        blocks: {
                            txt_size: 9,
                            right: {
                                enabled: false,
                            },
                            left: {
                                enabled: true,
                            },
                            background: {
                                middle: {
                                    color: colorPalette.blocks.run.background,
                                    opacity: 0.4,
                                },
                                side: {
                                    color: colorPalette.blocks.run.background,
                                    opacity: 0.3,
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
                            click: (d) => {
                                focusManager.focusOn('block', d.obs_block_id)
                            },
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
                                focusManager.focusOn('telescope', d.id)
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
                        over: {
                            telescope: undefined,
                        },
                        focus: {
                            telescope: undefined,
                        },
                    },
                })
                reserved.telescopeRunning.init()
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
                    .attr('x2', reserved.box.w)
                    .attr('y2', box.y)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.2)
            }

            if (shared.mode === 'inspector') {
                allBox = {
                    blocks: {
                        x: 0,
                        y: 0,
                        w: reserved.box.w * 0.8,
                        h: reserved.box.h * 0.2,
                    },
                    targets: {
                        x: 0,
                        y: reserved.box.h * 0.125,
                        h: reserved.box.h * 0.32,
                        w: reserved.box.w,
                    },
                    tels: {
                        x: 0,
                        y: reserved.box.h * 0.52,
                        w: reserved.box.w,
                        h: reserved.box.h * 0.47,
                    },
                }
                createBlocks_information()
                createPointing_information()
                createTelescope_information()
            }
            else if (shared.mode === 'modifier') {
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
                        h: reserved.box.h * 0.32,
                        w: reserved.box.w,
                    },
                    conflicts: {
                        x: 0,
                        y: reserved.box.h * 0.52,
                        w: reserved.box.w,
                        h: reserved.box.h * 0.47,
                    },
                }
                createModifications_information()
                createConflicts_information()
            }
        }
        function updateOverview() {
            if (shared.focus) {
                return
            }
            let allBox
            function updateBlocks_information() {
                let box = allBox.blocks
                let g = reserved.g.select('#blocks_information')

                let tot = shared.data.server.blocks.done.length
          + shared.data.server.blocks.wait.length
          + shared.data.server.blocks.run.length
                let infoState = [
                    {
                        state: 'run',
                        nb: shared.data.server.blocks.run.length,
                        percent: shared.data.server.blocks.run.length / tot,
                    },
                    {
                        state: 'done',
                        nb: 0,
                        percent: 0,
                    },
                    {
                        state: 'fail',
                        nb: 0,
                        percent: 0,
                    },
                    {
                        state: 'cancel',
                        nb: 0,
                        percent: 0,
                    },
                    {
                        state: 'wait',
                        nb: shared.data.server.blocks.wait.length,
                        percent: shared.data.server.blocks.wait.length / tot,
                    },
                ]
                for (let i = 0; i < shared.data.server.blocks.done.length; i++) {
                    let b = shared.data.server.blocks.done[i]
                    if (b.exe_state.state === 'done') {
                        infoState[1].nb += 1
                    }
                    else if (b.exe_state.state === 'fail') {
                        infoState[2].nb += 1
                    }
                    else if (b.exe_state.state === 'cancel') {
                        // if (is_def(b.exe_state.can_run)) {
                        //   if (!b.exe_state.can_run) return color_theme.blocks.cancelOp
                        // }
                        infoState[3].nb += 1
                    }
                }
                infoState[1].percent = infoState[1].nb / tot
                infoState[2].percent = infoState[2].nb / tot
                infoState[3].percent = infoState[3].nb / tot

                let width = box.w * 1
                let offset = 0

                g.select('text#sbs').text(Object.keys(shared.data.server.sched_blocks).length)
                g.select('text#obs').text(tot)

                let rects = g
                    .selectAll('g.state')
                    .data(infoState, function(d) {
                        return d.state
                    })
                rects.each(function(d) {
                    if (d.percent === 0) {
                        return
                    }
                    d3.select(this).select('rect')
                        .attr('x', offset + 1)
                        .attr('width', width * d.percent - 2)
                    d3.select(this).select('text')
                        .text(d.nb)
                        .attr('x', offset + 1 + (width * d.percent - 2) * 0.5)
                    offset += width * d.percent
                })
            }
            function updatePointing_information() {
                let box = allBox.targets
                let innerg = reserved.overview.scrollBox.get('inner_g')
                let rectBox = {
                    y: 0,
                    w: box.w,
                    h: Math.max(Math.min((box.h - headerSize + 4) / shared.data.server.targets.length, 50), 30),
                }
                let height = rectBox.h * 0.9
                let schedB = get_sched_blocksData()

                let targets = innerg
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
                    g.attr('transform', 'translate(' + (0) + ',' + (rectBox.y + rectBox.h * i) + ')')
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
                            focusManager.focusOn('target', d.id)
                        })
                        .on('mouseover', function(d) {
                            d3.select(this).style('cursor', 'pointer')
                            d3.select(this).attr('fill', color_theme.darker.background)
                        })
                        .on('mouseout', function(d) {
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
                        .text('T' + d.name.split('_')[1])
                        .attr('x', height * 0.5)
                        .attr('y', height * 0.5 + txt_size * 0.3)
                        .style('font-weight', '')
                        .attr('text-anchor', 'middle')
                        .style('font-size', headerSize + 'px')
                        .attr('dy', 0)
                        .style('pointer-events', 'none')
                        .attr('fill', color_theme.dark.text)
                        .attr('stroke', 'none')
                    let nbSched = 0
                    let nbObs = 0
                    let runningObs = []
                    for (let key in schedB) {
                        for (let j = 0; j < schedB[key].targets.length; j++) {
                            if (schedB[key].targets[j].id === d.id) {
                                nbSched += 1
                                nbObs += schedB[key].blocks.length
                                for (let i = 0; i < schedB[key].blocks.length; i++) {
                                    if (schedB[key].blocks[i].exe_state.state === 'run') {
                                        runningObs.push(schedB[key].blocks[i])
                                    }
                                }
                            }
                        }
                    }

                    let txt = g.append('text')
                        .text(nbSched)
                        .attr('x', rectBox.w * 0.15)
                        .attr('y', rectBox.h * 0.5)
                        .style('font-weight', 'bold')
                        .attr('text-anchor', 'start')
                        .style('font-size', txt_size + 'px')
                        .attr('dy', 0)
                        .style('pointer-events', 'none')
                        .attr('fill', color_theme.dark.text)
                        .attr('stroke', 'none')
                    let bbox = txt.node().getBBox()
                    txt = g.append('text')
                        .text('\xa0' + 'Sbs')
                        .attr('x', bbox.x + bbox.width)
                        .attr('y', rectBox.h * 0.5)
                        .style('font-weight', '')
                        .attr('text-anchor', 'start')
                        .style('font-size', txt_size * 0.8 + 'px')
                        .attr('dy', 0)
                        .style('pointer-events', 'none')
                        .attr('fill', color_theme.dark.text)
                        .attr('stroke', 'none')
                    bbox = txt.node().getBBox()
                    txt = g.append('text')
                        .text(nbObs)
                        .attr('x', rectBox.w * 0.3)
                        .attr('y', rectBox.h * 0.5)
                        .style('font-weight', 'bold')
                        .attr('text-anchor', 'start')
                        .style('font-size', txt_size + 'px')
                        .attr('dy', 0)
                        .style('pointer-events', 'none')
                        .attr('fill', color_theme.dark.text)
                        .attr('stroke', 'none')
                    bbox = txt.node().getBBox()
                    g.append('text')
                        .text('\xa0' + 'Obs')
                        .attr('x', bbox.x + bbox.width)
                        .attr('y', rectBox.h * 0.5)
                        .style('font-weight', '')
                        .attr('text-anchor', 'start')
                        .style('font-size', txt_size * 0.8 + 'px')
                        .attr('dy', 0)
                        .style('pointer-events', 'none')
                        .attr('fill', color_theme.dark.text)
                        .attr('stroke', 'none')
                })
                let merge = enter.merge(targets)
                merge.each(function(d, i) {
                    let g = d3.select(this)
                    g.attr('transform', 'translate(' + (0) + ',' + (rectBox.y + rectBox.h * i) + ')')
                    let runningObs = []
                    for (let key in schedB) {
                        for (let j = 0; j < schedB[key].targets.length; j++) {
                            if (schedB[key].targets[j].id === d.id) {
                                for (let i = 0; i < schedB[key].blocks.length; i++) {
                                    if (schedB[key].blocks[i].exe_state.state === 'run') {
                                        runningObs.push(schedB[key].blocks[i])
                                    }
                                }
                            }
                        }
                    }

                    let current = g
                        .selectAll('g.block')
                        .data(runningObs, function(d) {
                            return d.obs_block_id
                        })
                    let enter = current
                        .enter()
                        .append('g')
                        .attr('class', 'block')
                    enter.each(function(d, i) {
                        let color = shared.style.blockCol(d)
                        let g = d3.select(this)
                        g.attr('transform', 'translate(' + (rectBox.w * 0.5 + rectBox.w * 0.09 * i) + ',' + (0) + ')')
                        g.append('rect')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('width', rectBox.w * 0.08)
                            .attr('height', rectBox.h * 0.8)
                            .attr('fill', color.background)
                            .attr('stroke', color.stroke)
                            .attr('stroke-width', 0.2)
                            .on('click', function() {
                                focusManager.focusOn('block', d.obs_block_id)
                            })
                            .on('mouseover', function(d) {
                                d3.select(this).style('cursor', 'pointer')
                            })
                            .on('mouseout', function(d) {
                                d3.select(this).style('cursor', 'default')
                            })
                        g.append('text')
                            .text(d.metadata.block_name.replace(' ', ''))
                            .style('fill', color.text)
                            .style('font-weight', '')
                            .style('font-size', txt_size * 0.8 + 'px')
                            .attr('text-anchor', 'middle')
                            .attr('transform', 'translate(' + (rectBox.w * 0.04) + ',' + (rectBox.h * 0.4 + txt_size * 0.3) + ')')
                            .style('pointer-events', 'none')
                    })
                    let merge = current.merge(enter)
                    merge.each(function(d, i) {
                        let g = d3.select(this)
                        g.attr('transform', 'translate(' + (rectBox.w * 0.45 + rectBox.w * 0.09 * i) + ',' + (0) + ')')
                    })
                    current
                        .exit()
                        .transition('in_out')
                        .duration(times.anim)
                        .style('opacity', 0)
                        .remove()
                })
                targets
                    .exit()
                    .transition('in_out')
                    .duration(times.anim)
                    .style('opacity', 0)
                    .remove()
                reserved.overview.scrollBox.update_vertical_scroller({
                    can_scroll: true,
                    scroll_height: shared.data.server.targets.length * rectBox.h,
                })
            }
            function updateTelescope_information() {
                reserved.telescopeRunning.update_data({
                    data: {
                        raw: {
                            telescopes: shared.data.server.inst_health,
                            blocks: shared.data.server.blocks.run,
                        },
                        modified: [],
                    },
                })
            }
            if (shared.mode === 'inspector') {
                allBox = {
                    blocks: {
                        x: 0,
                        y: 0,
                        w: reserved.box.w * 0.8,
                        h: reserved.box.h * 0.2,
                    },
                    targets: {
                        x: 0,
                        y: reserved.box.h * 0.125,
                        h: reserved.box.h * 0.3,
                        w: reserved.box.w,
                    },
                    tels: {
                        x: 0,
                        y: reserved.box.h * 0.52,
                        w: reserved.box.w,
                        h: reserved.box.h * 0.47,
                    },
                }
                updateBlocks_information()
                updatePointing_information()
                updateTelescope_information()
            }
        }

        function create_sched_blocks_info_panel(id) {
            let schedB = get_sched_blocksData()[id]
            let g = reserved.g.append('g')
            let innerbox = {
                x: box.right_info.w * 0.0,
                y: box.right_info.h * 0.0,
                w: box.right_info.w * 1.0,
                h: box.right_info.h * 1.0,
            }
            let allBox = {
                tree: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.0,
                    w: box.right_info.w * 1,
                    h: box.right_info.h * 0.1,
                },
                time: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.125,
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
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                schedule: {
                    editable: false,
                    box: allBox.time,
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
                    schedB: schedB,
                    time_of_night: shared.data.server.time_of_night,
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
            reserved.schedblockForm.init()
        }
        function focusOn_sched_block(bId) {
            clean()
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
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.0,
                    w: box.right_info.w * 1.0,
                    h: box.right_info.h * 0.1,
                },
                time: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.125,
                    w: box.right_info.w * 1.0,
                    h: box.right_info.h * 0.1,
                },
                target: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.25,
                    w: box.right_info.w * 1.0,
                    h: box.right_info.h * 0.3,
                },
                tels: {
                    x: box.right_info.w * 0.0,
                    y: box.right_info.h * 0.6,
                    w: box.right_info.w * 1.0,
                    h: box.right_info.h * 0.39,
                },
            }

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
                        click: focusManager.focusOn,
                        over: () => {},
                        out: () => {},
                    },
                },
                schedule: {
                    editable: false,
                    box: allBox.time,
                    events: {
                        click: undefined,
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
                telescope: {
                    editable: false,
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
                    time_of_night: shared.data.server.time_of_night,
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
            createBlocks_info_panel(bId)
        }
        this.focusOn_block = focusOn_block

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
                    x: 0,
                    y: reserved.box.h * 0.015,
                    w: reserved.box.w,
                    h: reserved.box.h * 0.1,
                },
                blocks: {
                    x: 0,
                    y: reserved.box.h * 0.125,
                    h: reserved.box.h * 0.3,
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
                    x: 0,
                    y: reserved.box.h * 0.01,
                    w: reserved.box.w * 0.8,
                    h: reserved.box.h * 0.12,
                },
                blocks: {
                    x: 0,
                    y: reserved.box.h * 0.125,
                    h: reserved.box.h * 0.845,
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
}
