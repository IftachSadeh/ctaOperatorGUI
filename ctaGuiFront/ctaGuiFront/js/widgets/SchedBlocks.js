'use strict'
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// main_script_tag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    "/js/widget_"+main_script_tag+".js"
var main_script_tag = 'SchedBlocks'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global times */
/* global is_def */
/* global BlockDisplayer */
/* global TelescopeDisplayer */
/* global PlotBrushZoom */
/* global RunLoop */
/* global Locker */
/* global deep_copy */
/* global unique */
/* global dom_add */
/* global run_when_ready */
/* global cols_purples */
/* global cols_yellows */
/* global cols_blues */
/* global disable_scroll_svg */
/* global bck_pattern */
/* global ScrollBox */
/* global EventDisplayer */
/* global cols_blocks */
/* global inst_health_col */

window.load_script({
    source: main_script_tag,
    script: '/js/utils/ScrollGrid.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/telescopes/TelescopeDisplayer.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/blocks/BlockDisplayer.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/events/EventDisplayer.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/ScrollBox.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/PlotBrushZoom.js',
})

// -------------------------------------------------------------------
//
// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 10
    let w0 = 12
    let div_key = 'main'

    opt_in.widget_func = {
        sock_func: sock_sched_blocks,
        main_func: main_sched_blocks,
    }
    opt_in.widget_div_id = opt_in.widget_id + 'widget_div'
    opt_in.ele_props = {
    }
    opt_in.ele_props[div_key] = {
        auto_pos: true,
        is_dark_ele: true,
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
function sock_sched_blocks(opt_in) {}

function main_sched_blocks(opt_in) {
    let color_theme = get_color_theme('bright_grey')
    window.colorPalette = get_color_theme('bright_grey')

    let my_unique_id = unique()
    let displayMode = 'detail'
    // let widget_type = opt_in.widget_type
    let tag_sched_blocksSvg = opt_in.base_name
    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    let shared = {
        data: {
            serverPast: undefined,
            blocks: {
            },
        },
        focus: {
            sched_blocks: undefined,
            block: undefined,
        },
    }

    let svg = {
    }
    let box = {
    }
    let svg_dims = {
    }

    let event_queue_serverPast = null
    let event_queue_serverFutur = null
    let brushZoomPast = null
    let brushZoomFutur = null
    let block_queue_serverPast = null
    let block_queue_server_futur = null
    let telescopeRunning = null

    // let this_sched_blocks = this
    let is_south = window.SITE_TYPE === 'S'

    // let sgv_tag = {};
    // $.each(widget_ele, function(index,ele_now) {
    //   sgv_tag[ele_now.id] = { id:tag_sched_blocksSvg+"_"+ele_now.id, whRatio:(ele_now.w/ele_now.h) };
    // })
    let sgv_tag = {
    }
    $.each(widget_ele, function(index, ele_now) {
        sgv_tag[ele_now.id] = {
            id: tag_sched_blocksSvg + ele_now.id,
            widget: ele_now.widget,
            whRatio: ele_now.w / ele_now.h,
        }
    })

    // delay counters
    let locker = new Locker()
    locker.add('in_init')
    console.log(' -- FIXME -- use tel_info.get_ids and tel_info.tel_id_to_types as in arr_zoomer.js .... -- see optional filter option in the python file -- self.socket_manager.InstData.get_inst_ids(inst_types=[....])')

    // function loop
    let run_loop = new RunLoop({
        tag: widget_id,
    })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
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
    let prev_sync = {
    }
    function get_sync_state(data_in) {
        if (document.hidden) {
            return
        }
        if (sock.con_stat.is_offline()) {
            return
        }

        let sess_widget_ids = data_in.sess_widget_ids
        if (sess_widget_ids.indexOf(widget_id) < 0 || widget_id === data_in.widget_id) {
            return
        }

        let type = data_in.type
        if (type === 'syncObFocus') {
            if (prev_sync[type] !== data_in.data.obs_block_id) {
                prev_sync[type] = data_in.data.obs_block_id
                svg_main.block_focus({
                    id: data_in.data.obs_block_id,
                })
            }
        }
    }
    this.get_sync_state = get_sync_state

    function sortBlocksByState(array) {
        if (!array) {
            return
        }
        let blocks = {
        }
        blocks.success = []
        blocks.fail = []
        blocks.cancel = []
        blocks.wait = []

        for (var i = 0; i < array.length; i++) {
            let b = array[i]
            if (b.exe_state.state === 'done') {
                blocks.success.push(b)
            }
            else if (b.exe_state.state === 'fail') {
                blocks.fail.push(b)
            }
            else if (b.exe_state.state === 'cancel') {
                blocks.cancel.push(b)
            }
            else if (b.exe_state.state === 'wait') {
                blocks.wait.push(b)
            }
        }
        return blocks
    }
    function get_tel_healthById(id) {
        return shared.data.server.inst_health.find(x => x.id === id).val
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
    function setCol(opt_in) {
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
    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
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
            svg.back = svg.svg.append('g')
            svg.g = svg.svg.append('g')
            svg.foreground = svg.svg.append('g')
        }
        function initBackground() {
            svg.svg
                .style('background', color_theme.medium.background)
            svg.back.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', svg_dims.w[0] * 1)
                .attr('height', svg_dims.h[0] * 0.03)
                .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
                .attr('stroke', 'none')
                .attr('rx', 0)
            svg.back.append('text')
                .text('Executed')
                .style('fill', color_theme.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '20px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (svg_dims.w[0] * 0.25) + ',' + (svg_dims.h[0] * 0.02) + ')')
            svg.back.append('text')
                .text('Running')
                .style('fill', color_theme.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '20px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (svg_dims.w[0] * 0.5) + ',' + (svg_dims.h[0] * 0.02) + ')')
            svg.back.append('text')
                .text('Waiting')
                .style('fill', color_theme.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '20px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (svg_dims.w[0] * 0.75) + ',' + (svg_dims.h[0] * 0.02) + ')')
            // svg.back.append('rect')
            //   .attr('x', 0)
            //   .attr('y', svg_dims.h[0] * 0.495)
            //   .attr('width', svg_dims.w[0] * 1)
            //   .attr('height', svg_dims.h[0] * 0.01)
            //   .attr('fill', color_theme.darker.stroke) // color_theme.dark.background)
            //   .attr('stroke', 'none')
        }
        function initForeground() {
            svg.foreground.append('rect')
                .attr('x', box.current_blocks.x + box.current_blocks.w * 0.05)
                .attr('y', box.brushFutur.y + box.brushFutur.h * 0.22)
                .attr('width', box.current_blocks.w * 0.95)
                .attr('height', box.brushFutur.h * 0.56)
                .attr('fill', color_theme.dark.stroke)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.0)
            svg.foreground.append('text')
                .attr('id', 'currentHour')
                .attr('stroke', color_theme.bright.background)
                .attr('stroke-width', 0.5)
                .attr('fill', color_theme.bright.background)
                .attr('x', box.current_blocks.x + box.current_blocks.w * 0.5)
                .attr('y', box.brushFutur.y + box.brushFutur.h * 0.7)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('font-size', '24px')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
        }
        function initBox() {
            box.event_queue_serverPast = {
                x: svg_dims.w[0] * 0.0,
                y: svg_dims.h[0] * 0.03,
                w: svg_dims.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
                h: svg_dims.h[0] * 0.12,
                marg: svg_dims.w[0] * 0.01,
            }
            box.event_queue_serverFutur = {
                x: svg_dims.w[0] * (displayMode === 'refine' ? 0.5 : 0.6),
                y: svg_dims.h[0] * 0.03,
                w: svg_dims.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
                h: svg_dims.h[0] * 0.12,
                marg: svg_dims.w[0] * 0.01,
            }
            box.brushPast = {
                x: svg_dims.w[0] * 0.0,
                y: svg_dims.h[0] * 0.14,
                w: svg_dims.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
                h: svg_dims.h[0] * 0.05,
                marg: svg_dims.w[0] * 0.01,
            }
            box.brushFutur = {
                x: svg_dims.w[0] * (displayMode === 'refine' ? 0.5 : 0.6),
                y: svg_dims.h[0] * 0.14,
                w: svg_dims.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
                h: svg_dims.h[0] * 0.05,
                marg: svg_dims.w[0] * 0.01,
            }
            box.block_queue_serverPast = {
                x: svg_dims.w[0] * 0.0,
                y: svg_dims.h[0] * 0.18,
                w: svg_dims.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
                h: svg_dims.h[0] * 0.405,
                marg: svg_dims.w[0] * 0.01,
            }
            box.block_queue_server_futur = {
                x: svg_dims.w[0] * (displayMode === 'refine' ? 0.5 : 0.6),
                y: svg_dims.h[0] * 0.18,
                w: svg_dims.w[0] * (displayMode === 'refine' ? 0.5 : 0.4),
                h: svg_dims.h[0] * 0.405,
                marg: svg_dims.w[0] * 0.01,
            }
            box.freeTels = {
                x: svg_dims.w[0] * 0.002,
                y: svg_dims.h[0] * 0.5875,
                w: svg_dims.w[0] * 0.996,
                h: svg_dims.h[0] * 0.41,
                marg: svg_dims.w[0] * 0.01,
            }
            box.current_blocks = {
                x: svg_dims.w[0] * 0.405,
                y: svg_dims.h[0] * 0.18,
                w: svg_dims.w[0] * 0.18,
                h: svg_dims.h[0] * 0.405,
                marg: svg_dims.w[0] * 0.01,
            }

            // box.execution = {
            //   x: svg_dims.w[0] * 0.65,
            //   y: svg_dims.h[0] * 0.15,
            //   w: svg_dims.w[0] * 0.35,
            //   h: svg_dims.h[0] * 0.85,
            //   marg: svg_dims.w[0] * 0.01
            // }
            // box.details = {
            //   x: svg_dims.w[0] * 0,
            //   y: svg_dims.h[0] * 0.01,
            //   w: svg_dims.w[0] * 0,
            //   h: svg_dims.h[0] * 0.05
            // }
        }
        function initDefaultStyle() {
            shared.style = {
            }
            shared.style.runRecCol = cols_blues[2]
            shared.style.blockCol = function(opt_in) {
                let endTime = is_def(opt_in.endTime)
                    ? opt_in.endTime
                    : undefined
                if (endTime < Number(shared.data.server.time_of_night.now)) {
                    return color_theme.blocks.shutdown
                }

                let state = is_def(opt_in.exe_state.state)
                    ? opt_in.exe_state.state
                    : undefined
                console.log(state)
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

        if (sock.multiple_inits({
            id: widget_id,
            data: data_in,
        })) {
            return
        }

        sock.set_icon_badge({
            n_icon: data_in.n_icon,
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
        let ce = shared.data.server.external_clock_events[0]
        for (let i = 0; i < ce.length; i++) {
            ce[i].start_time = (new Date(ce[i].start_date).getTime() - new Date(shared.data.server.time_of_night.date_start)) / 1000
            ce[i].end_time = ce[i].end_date === '' ? undefined : (new Date(ce[i].end_date).getTime() - new Date(shared.data.server.time_of_night.date_start)) / 1000
        }
        // sortBlocksByState()

        svgBrushPast.init_data()
        svgBrushFutur.init_data()
        svg_events_queue_serverPast.init_data()
        svg_events_queue_serverFutur.init_data()
        svg_blocks_queue_serverPast.init_data()
        svgRunningPhase.init_data()
        svg_blocks_queue_serverFutur.init_data()

        // svg.g.append('rect')
        //   .attr('x', 0)
        //   .attr('y', svg_dims.h[0] * 0.03)
        //   .attr('width', svg_dims.w[0] * 1)
        //   .attr('height', svg_dims.h[0] * 0.026)
        //   .attr('fill', color_theme.medium.background) // color_theme.dark.background)
        //   .attr('stroke', 'none')
        //   .attr('rx', 0)
        // svg.g.append('rect')
        //   .attr('x', 0)
        //   .attr('y', svg_dims.h[0] * 0.584)
        //   .attr('width', svg_dims.w[0] * 1)
        //   .attr('height', svg_dims.h[0] * 0.026)
        //   .attr('fill', color_theme.medium.background) // color_theme.dark.background)
        //   .attr('stroke', 'none')
        //   .attr('rx', 0)

        // svgRunningTels.init_data()

        // svgStateScheduleMatrix.init_data()
        // svgWaitScheduleMatrix.init_data()
        svgFreeTels.init_data()
        initForeground()
        // svgSuccessQueue.init_data()
        // svgFailQueue.init_data()
        // svgCancelQueue.init_data()
        update()
    // svg_main.init_data(data_in.data)
    }
    this.init_data = init_data

    function update() {
        svg_events_queue_serverPast.update_data()
        svg_events_queue_serverFutur.update_data()
        svgBrushPast.update_data()
        svgBrushFutur.update_data()
        svg_blocks_queue_serverPast.update_data()
        svg_blocks_queue_serverFutur.update_data()
        svgRunningPhase.update_data()
        svgFreeTels.update_data()

        let currentTime = {
            date: new Date(shared.data.server.time_of_night.date_now),
        }
        svg.foreground.select('text#currentHour').text(d3.timeFormat('%H:%M')(currentTime.date))
    }
    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_data(data_in) {
        shared.data.server = data_in.data

        let ce = shared.data.server.external_clock_events[0]
        for (let i = 0; i < ce.length; i++) {
            ce[i].start_time = (new Date(ce[i].start_date).getTime() - new Date(shared.data.server.time_of_night.date_start)) / 1000
            ce[i].end_time = ce[i].end_date === '' ? undefined : (new Date(ce[i].end_date).getTime() - new Date(shared.data.server.time_of_night.date_start)) / 1000
        }
        // sortBlocksByState()
        update()

    // svgRunningTels.update_data()

    // svgStateScheduleMatrix.update_data()
    // svgWaitScheduleMatrix.update_data()
    // svgFreeTels.update_data()
    // svgCancelQueue.update_data()
    // svgSuccessQueue.update_data()
    // svgFailQueue.update_data()

    // svg_main.update_data(data_in.data)
    }
    this.update_data = update_data

    let Svg_events_queue_serverPast = function() {
        let reserved = {
        }
        function init_data() {
            let adjustedBox = {
                x: box.event_queue_serverPast.x,
                y: box.event_queue_serverPast.y,
                w: box.event_queue_serverPast.w,
                h: box.event_queue_serverPast.h,
                marg: svg_dims.w[0] * 0.01,
            }

            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

            event_queue_serverPast = new EventDisplayer({
                main: {
                    tag: 'eventDisplayerPastSchedBlock',
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
                    currentTime: {
                        time: 0,
                        date: undefined,
                    },
                    startTime: {
                        time: 0,
                        date: undefined,
                    },
                    endTime: {
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
            event_queue_serverPast.init()
        }
        this.init_data = init_data

        function update_data() {
            let date = new Date(shared.data.server.time_of_night.date_now)
            let currentTime = {
                date: date,
                time: Number(shared.data.server.time_of_night.now),
            }
            let axisTop = brushZoomPast.getAxis('top').axis.scale().domain()
            let startTime = {
                date: axisTop[0].getTime(),
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[0].getTime()) / -1000,
            }
            let endTime = {
                date: axisTop[1].getTime(),
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[1].getTime()) / -1000,
            }
            event_queue_serverPast.update_data({
                time: {
                    currentTime: currentTime,
                    startTime: startTime,
                    endTime: endTime,
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
            //     currentTime: {date: new Date(shared.data.server.time_of_night.date_now), time: Number(shared.data.server.time_of_night.now)},
            //     startTime: {date: new Date(shared.data.server.time_of_night.date_start), time: Number(shared.data.server.time_of_night.start)},
            //     endTime: {date: new Date(shared.data.server.time_of_night.date_end), time: Number(shared.data.server.time_of_night.end)}
            //   }
            // })
        }
        this.update = update
    }
    let Svg_events_queue_serverFutur = function() {
        let reserved = {
        }
        function init_data() {
            let adjustedBox = {
                x: box.event_queue_serverFutur.x,
                y: box.event_queue_serverFutur.y,
                w: box.event_queue_serverFutur.w,
                h: box.event_queue_serverFutur.h,
                marg: svg_dims.w[0] * 0.01,
            }

            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

            event_queue_serverFutur = new EventDisplayer({
                main: {
                    tag: 'eventDisplayerFuturSchedBlock',
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
                        anchor: 'left',
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
                    currentTime: {
                        time: 0,
                        date: undefined,
                    },
                    startTime: {
                        time: 0,
                        date: undefined,
                    },
                    endTime: {
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
            event_queue_serverFutur.init()
        }
        this.init_data = init_data

        function update_data() {
            let date = new Date(shared.data.server.time_of_night.date_now)
            let currentTime = {
                date: date,
                time: Number(shared.data.server.time_of_night.now),
            }
            let axisTop = brushZoomFutur.getAxis('top').axis.scale().domain()
            let startTime = {
                date: axisTop[0].getTime(),
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[0].getTime()) / -1000,
            }
            let endTime = {
                date: axisTop[1].getTime(),
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[1].getTime()) / -1000,
            }

            event_queue_serverFutur.update_data({
                time: {
                    currentTime: currentTime,
                    startTime: startTime,
                    endTime: endTime,
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
            // let date = new Date(shared.data.server.time_of_night.date_now)
            // let currentTime = {date: date, time: Number(shared.data.server.time_of_night.now)}
            // let startTime = {date: new Date(shared.data.server.time_of_night.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.time_of_night.now)}
            // let endTime = {date: new Date(shared.data.server.time_of_night.date_now).setSeconds(date.getSeconds() + (3600 * 8)), time: Number(shared.data.server.time_of_night.now) + (3600 * 8)}
            // block_queue_server_futur.update_data({
            //   time: {
            //     currentTime: currentTime,
            //     startTime: startTime,
            //     endTime: endTime
            //   }
            // })
        }
        this.update = update
    }
    let SvgBrushPast = function() {
        let reserved = {
        }
        function init_data() {
            let brushBox = {
                x: box.brushPast.x,
                y: box.brushPast.y,
                w: box.brushPast.w,
                h: box.brushPast.h,
                marg: svg_dims.w[0] * 0.01,
            }

            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + brushBox.x + ',' + brushBox.y + ')')

            brushZoomPast = new PlotBrushZoom({
                main: {
                    g: svg.g.append('g').append('g'),
                    box: brushBox,
                },
                clipping: {
                    enabled: true,
                },
                axis: [
                    {
                        id: 'top',
                        enabled: true,
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: brushBox.h * 0.0,
                                w: brushBox.w,
                                h: brushBox.h * 0.2,
                                marg: 0,
                            },
                            type: 'top',
                            attr: {
                                text: {
                                    enabled: false,
                                    size: 14,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, brushBox.w ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    },
                    {
                        id: 'middle',
                        enabled: true,
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: brushBox.h * 0.8,
                                w: brushBox.w,
                                h: brushBox.h * 0.0,
                                marg: 0,
                            },
                            type: 'top',
                            attr: {
                                text: {
                                    enabled: true,
                                    size: 16,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: color_theme.dark.stroke,
                                    fill: color_theme.dark.stroke,
                                },
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, brushBox.w ],
                        brush: {
                            zoom: false,
                            brush: false,
                        },
                    },
                    {
                        id: 'bottom',
                        enabled: true,
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: brushBox.h * 0.2,
                                w: brushBox.w,
                                h: brushBox.h * 0.2,
                                marg: 0,
                            },
                            type: 'bottom',
                            attr: {
                                text: {
                                    enabled: false,
                                    size: 16,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, brushBox.w ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    },
                ],
                content: {
                    enabled: true,
                    main: {
                        g: undefined,
                        box: {
                            x: 0,
                            y: brushBox.h * 0.2,
                            w: brushBox.w,
                            h: brushBox.h * 0.6,
                            marg: 0,
                        },
                        attr: {
                            fill: color_theme.medium.background,
                        },
                    },
                },
                focus: {
                    enabled: true,
                    main: {
                        g: undefined,
                        box: {
                            x: 0,
                            y: brushBox.h * 0.2,
                            w: brushBox.w,
                            h: brushBox.h * 0.6,
                            marg: 0,
                        },
                        attr: {
                            fill: color_theme.darker.background,
                            opacity: 1,
                            stroke: color_theme.darker.background,
                        },
                    },
                },
                brush: {
                    coef: {
                        x: 0,
                        y: 0,
                    },
                    callback: () => {},
                },
                zoom: {
                    coef: {
                        kx: 1,
                        ky: 1,
                        x: 0,
                        y: 0,
                    },
                    callback: function() {
                        svg_blocks_queue_serverPast.update_data()
                        svg_events_queue_serverPast.update_data()
                    },
                },
            })
            brushZoomPast.init()
        }
        this.init_data = init_data

        function update_data() {
            let date = new Date(shared.data.server.time_of_night.date_now)
            let startTime = {
                date: new Date(shared.data.server.time_of_night.date_now).setSeconds(date.getSeconds() - (3600 * 8)),
                time: Number(shared.data.server.time_of_night.now) - (3600 * 8),
            }
            let endTime = {
                date: new Date(shared.data.server.time_of_night.date_now).setSeconds(date.getSeconds()),
                time: Number(shared.data.server.time_of_night.now),
            }

            brushZoomPast.updateAxis({
                id: 'top',
                domain: [ startTime.date, endTime.date ],
            })
            brushZoomPast.updateAxis({
                id: 'middle',
                domain: [ startTime.date, endTime.date ],
            })
            brushZoomPast.updateAxis({
                id: 'bottom',
                domain: [ startTime.date, endTime.date ],
            })
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let SvgBrushFutur = function() {
        let reserved = {
        }
        function init_data() {
            let brushBox = {
                x: box.brushFutur.x,
                y: box.brushFutur.y,
                w: box.brushFutur.w,
                h: box.brushFutur.h,
                marg: svg_dims.w[0] * 0.01,
            }

            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + brushBox.x + ',' + brushBox.y + ')')

            brushZoomFutur = new PlotBrushZoom({
                main: {
                    g: reserved.g,
                    box: brushBox,
                },
                clipping: {
                    enabled: true,
                },
                axis: [
                    {
                        id: 'top',
                        enabled: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: brushBox.h * 0.0,
                                w: brushBox.w,
                                h: brushBox.h * 0.2,
                                marg: 0,
                            },
                            type: 'top',
                            attr: {
                                text: {
                                    enabled: false,
                                    size: 14,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, brushBox.w ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    },
                    {
                        id: 'middle',
                        enabled: true,
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: brushBox.h * 0.8,
                                w: brushBox.w,
                                h: brushBox.h * 0.0,
                                marg: 0,
                            },
                            type: 'top',
                            attr: {
                                text: {
                                    enabled: true,
                                    size: 16,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: color_theme.dark.stroke,
                                    fill: color_theme.dark.stroke,
                                },
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, brushBox.w ],
                        brush: {
                            zoom: false,
                            brush: false,
                        },
                    },
                    {
                        id: 'bottom',
                        enabled: true,
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: brushBox.h * 0.2,
                                w: brushBox.w,
                                h: brushBox.h * 0.2,
                                marg: 0,
                            },
                            type: 'bottom',
                            attr: {
                                text: {
                                    enabled: false,
                                    size: 16,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: color_theme.medium.stroke,
                                    fill: color_theme.medium.stroke,
                                },
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, brushBox.w ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    },
                ],
                content: {
                    enabled: true,
                    main: {
                        g: undefined,
                        box: {
                            x: 0,
                            y: brushBox.h * 0.2,
                            w: brushBox.w,
                            h: brushBox.h * 0.6,
                            marg: 0,
                        },
                        attr: {
                            fill: color_theme.medium.background,
                        },
                    },
                },
                focus: {
                    enabled: true,
                    main: {
                        g: undefined,
                        box: {
                            x: 0,
                            y: brushBox.h * 0.2,
                            w: brushBox.w,
                            h: brushBox.h * 0.6,
                            marg: 0,
                        },
                        attr: {
                            fill: color_theme.darker.background,
                            opacity: 1,
                            stroke: color_theme.darker.stroke,
                        },
                    },
                },
                brush: {
                    coef: {
                        x: 0,
                        y: 0,
                    },
                    callback: () => {},
                },
                zoom: {
                    coef: {
                        kx: 1,
                        ky: 1,
                        x: 0,
                        y: 0,
                    },
                    callback: function() {
                        svg_blocks_queue_serverFutur.update_data()
                        svg_events_queue_serverFutur.update_data()
                    },
                },
            })
            brushZoomFutur.init()
        }
        this.init_data = init_data

        function update_data() {
            let date = new Date(shared.data.server.time_of_night.date_now)
            let startTime = {
                date: new Date(shared.data.server.time_of_night.date_now).setSeconds(date.getSeconds()),
                time: Number(shared.data.server.time_of_night.now),
            }
            let endTime = {
                date: new Date(shared.data.server.time_of_night.date_now).setSeconds(date.getSeconds() + (3600 * 8)),
                time: Number(shared.data.server.time_of_night.now) + (3600 * 8),
            }

            brushZoomFutur.updateAxis({
                id: 'top',
                domain: [ startTime.date, endTime.date ],
            })
            brushZoomFutur.updateAxis({
                id: 'middle',
                domain: [ startTime.date, endTime.date ],
            })
            brushZoomFutur.updateAxis({
                id: 'bottom',
                domain: [ startTime.date, endTime.date ],
            })
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let Svg_blocks_queue_serverPast = function() {
        let reserved = {
        }
        function init_data() {
            let adjustedBox = {
                x: box.block_queue_serverPast.x,
                y: box.block_queue_serverPast.y,
                w: box.block_queue_serverPast.w,
                h: box.block_queue_serverPast.h,
                marg: svg_dims.w[0] * 0.01,
            }

            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

            block_queue_serverPast = new BlockDisplayer({
                main: {
                    tag: 'blockQueuePastSchedBlock',
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

                displayer: 'blockTrackShrinkBib', // 'blockQueue2',
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
                        orientation: 'bottom',
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
                    currentTime: {
                        time: 0,
                        date: undefined,
                    },
                    startTime: {
                        time: 0,
                        date: undefined,
                    },
                    endTime: {
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
                    sched: {
                        click: (d) => {
                            console.log(d)
                        },
                        mouseover: (d) => {
                            console.log(d)
                        },
                        mouseout: (d) => {
                            console.log(d)
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
            block_queue_serverPast.init()
        }
        this.init_data = init_data

        function update_data() {
            let date = new Date(shared.data.server.time_of_night.date_now)
            let currentTime = {
                date: date,
                time: Number(shared.data.server.time_of_night.now),
            }
            let axisTop = brushZoomPast.getAxis('bottom').axis.scale().domain()
            let startTime = {
                date: axisTop[0].getTime(),
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[0].getTime()) / -1000,
            }
            let endTime = {
                date: axisTop[1].getTime(),
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[1].getTime()) / -1000,
            }

            block_queue_serverPast.update_data({
                time: {
                    currentTime: currentTime,
                    startTime: startTime,
                    endTime: endTime,
                },
                data: {
                    raw: {
                        blocks: shared.data.server.blocks,
                        tel_ids: shared.data.server.tel_ids,
                    },
                    modified: [],
                },
            })
        }
        this.update_data = update_data

        function update() {
            block_queue_serverPast.update({
                time: {
                    currentTime: {
                        date: new Date(shared.data.server.time_of_night.date_now),
                        time: Number(shared.data.server.time_of_night.now),
                    },
                    startTime: {
                        date: new Date(shared.data.server.time_of_night.date_start),
                        time: Number(shared.data.server.time_of_night.start),
                    },
                    endTime: {
                        date: new Date(shared.data.server.time_of_night.date_end),
                        time: Number(shared.data.server.time_of_night.end),
                    },
                },
            })
        }
        this.update = update
    }
    let Svg_blocks_queue_serverFutur = function() {
        let reserved = {
        }
        function init_data() {
            let adjustedBox = {
                x: box.block_queue_server_futur.x,
                y: box.block_queue_server_futur.y,
                w: box.block_queue_server_futur.w,
                h: box.block_queue_server_futur.h,
                marg: svg_dims.w[0] * 0.01,
            }

            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

            block_queue_server_futur = new BlockDisplayer({
                main: {
                    tag: 'blockQueueFuturSchedBlock',
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

                displayer: 'blockTrackShrinkBib', // blockTrackShrinkBib
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
                        orientation: 'bottom',
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
                                y: adjustedBox.h * 0.66875,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.33125,
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
                                y: adjustedBox.h * 0.15,
                                w: adjustedBox.w,
                                h: adjustedBox.h * 0.1525,
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
                blockTrackShrink: {
                    g: undefined,
                    sched_blocks: {
                        label: {
                            enabled: true,
                            position: 'right',
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
                    currentTime: {
                        time: 0,
                        date: undefined,
                    },
                    startTime: {
                        time: 0,
                        date: undefined,
                    },
                    endTime: {
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
                    sched: {
                        click: (d) => {
                            console.log(d)
                        },
                        mouseover: (d) => {
                            console.log(d)
                        },
                        mouseout: (d) => {
                            console.log(d)
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
            block_queue_server_futur.init()
        }
        this.init_data = init_data

        function update_data() {
            let date = new Date(shared.data.server.time_of_night.date_now)
            let currentTime = {
                date: date,
                time: Number(shared.data.server.time_of_night.now),
            }
            let axisTop = brushZoomFutur.getAxis('bottom').axis.scale().domain()
            let startTime = {
                date: axisTop[0].getTime(),
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[0].getTime()) / -1000,
            }
            let endTime = {
                date: axisTop[1].getTime(),
                time: (new Date(shared.data.server.time_of_night.date_start).getTime() - axisTop[1].getTime()) / -1000,
            }

            block_queue_server_futur.update_data({
                time: {
                    currentTime: currentTime,
                    startTime: startTime,
                    endTime: endTime,
                },
                data: {
                    raw: {
                        blocks: shared.data.server.blocks,
                        tel_ids: shared.data.server.tel_ids,
                    },
                    modified: [],
                },
            })
        }
        this.update_data = update_data

        function update() {
            let date = new Date(shared.data.server.time_of_night.date_now)
            let currentTime = {
                date: date,
                time: Number(shared.data.server.time_of_night.now),
            }
            let startTime = {
                date: new Date(shared.data.server.time_of_night.date_now).setSeconds(date.getSeconds()),
                time: Number(shared.data.server.time_of_night.now),
            }
            let endTime = {
                date: new Date(shared.data.server.time_of_night.date_now).setSeconds(date.getSeconds() + (3600 * 8)),
                time: Number(shared.data.server.time_of_night.now) + (3600 * 8),
            }
            block_queue_server_futur.update_data({
                time: {
                    currentTime: currentTime,
                    startTime: startTime,
                    endTime: endTime,
                },
            })
        }
        this.update = update
    }

    let SvgRunningPhase = function() {
        let reserved = {
        }

        function init_data() {
            reserved.gBlockBox = svg.g.append('g')
                .attr('transform', 'translate(' + box.current_blocks.x + ',' + box.current_blocks.y + ')')
            // reserved.gBlockBox.append('text')
            //   .text('Running')
            //   .style('fill', color_theme.bright.background)
            //   .style('font-weight', 'bold')
            //   .style('font-size', '20px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + (box.current_blocks.w * 0.5) + ',' + (box.current_blocks.y - (box.current_blocks.h * 0.08)) + ')')
            // reserved.gBlockBox.append('rect')
            //   .attr('x', box.current_blocks.w * 0.045)
            //   .attr('y', box.current_blocks.h * 0.05)
            //   .attr('width', box.current_blocks.w * 0.965)
            //   .attr('height', box.current_blocks.h * 0.9)
            //   .attr('fill', color_theme.medium.background)
            //   .attr('stroke', '#000000')
            //   .attr('stroke-width', 0.0)

            let header = reserved.gBlockBox.append('g')
            header.append('rect')
                .attr('x', box.current_blocks.w * 0.05)
                .attr('y', 0)
                .attr('width', box.current_blocks.w * 0.95)
                .attr('height', box.current_blocks.h * 0.05)
                .attr('fill', color_theme.dark.stroke)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.0)
            header.append('text')
                .text('Finish')
                .style('fill', color_theme.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '12px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (box.current_blocks.w * 0.2) + ',' + (box.current_blocks.h * 0.04) + ')')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            header.append('text')
                .text('Data')
                .style('fill', color_theme.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '12px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (box.current_blocks.w * 0.5) + ',' + (box.current_blocks.h * 0.04) + ')')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            header.append('text')
                .text('Config')
                .style('fill', color_theme.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '12px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (box.current_blocks.w * 0.8) + ',' + (box.current_blocks.h * 0.04) + ')')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            header.attr('transform', 'translate(' + 0 + ',' + box.current_blocks.h * 0.0 + ')')
            // update_data()
            // box.current_blocks.h = box.current_blocks.h * 0.9
        }
        this.init_data = init_data

        function update_data() {
            let b = deep_copy(box.current_blocks)
            b.y = b.h * 0.08
            b.h = b.h * 0.9

            let ratioHeight = 0.2
            let ratioWidth = 0.99
            let offset_runningBlocks = 0.035

            let ratio = 1

            let queueRun = block_queue_server_futur.get_block_rows()

            queueRun = queueRun.filter(b => b.block.exe_state.state === 'run')
            queueRun.sort(function(a, b) {
                return a.y > b.y
            })
            let totHeight = offset_runningBlocks * (queueRun.length - 1) + queueRun.length * ratioHeight

            if (totHeight > 1) {
                ratio = 1 / totHeight
                totHeight = 1
            }
            else if (totHeight < 0.25) {
                offset_runningBlocks = 0.3
            }
            else if (totHeight < 0.50) {
                offset_runningBlocks = 0.2
            }
            else if (totHeight < 0.75) {
                offset_runningBlocks = 0.1
            }

            ratioHeight = ratioHeight * ratio
            offset_runningBlocks = offset_runningBlocks * ratio

            let offsetY = (b.h * (1 - totHeight)) * 0.5

            let blockBox = {
                x: (b.w * 0.5) - (b.w * ratioWidth * 0.5) + (b.w * 0.045),
                y: b.h * offset_runningBlocks,
                w: b.w * 0.965 * ratioWidth,
                h: b.h * ratioHeight,
            }
            let headerBoxId = {
                x: blockBox.w * 0.0,
                y: blockBox.h * 0.0,
                w: blockBox.w * 1.0,
                h: blockBox.h * 1.0,
            }
            let headerBoxRunningPhase = {
                x: blockBox.w * 0.0,
                y: blockBox.h * 0.0,
                w: blockBox.w * 1.0,
                h: blockBox.h * 1.0,
            }

            let colorLock = color_theme.blocks.run.background
            let colorFree = color_theme.dark.background
            let transConfig = headerBoxRunningPhase.w * 0.7 // 0.38
            let scaleTake = queueRun.length > 6 ? 1 : 1
            let transTake = headerBoxRunningPhase.w * (0.33 / scaleTake)
            let transFinish = -headerBoxRunningPhase.w * 0 // 0.38

            function updateConfigDataFinish(g) {
                let template = [
                    [],
                    [],
                    [],
                    [],
                    [{
                        x: 0,
                        y: 0,
                        w: 0.49,
                        h: 0.49,
                    }, {
                        x: 0.5,
                        y: 0,
                        w: 0.49,
                        h: 0.49,
                    }, {
                        x: 0,
                        y: 0.5,
                        w: 0.49,
                        h: 0.49,
                    }, {
                        x: 0.5,
                        y: 0.5,
                        w: 0.49,
                        h: 0.49,
                    }],
                ]
                let categories = [ 'mount', 'mirror', 'daq', 'camera' ]
                let box = {
                    y: headerBoxRunningPhase.h * 0.05,
                    w: headerBoxRunningPhase.w * 0.33,
                    h: headerBoxRunningPhase.h * 0.9,
                }
                for (let i = 0; i < categories.length; i++) {
                    g.select('rect#' + categories[i])
                        .attr('x', headerBoxRunningPhase.x + box.w * template[categories.length][i].x)
                        .attr('y', headerBoxRunningPhase.y + box.y + box.h * template[categories.length][i].y)
                        .attr('width', box.w * template[categories.length][i].w)
                        .attr('height', box.h * template[categories.length][i].h)
                    g.select('text#' + categories[i].charAt(0).toUpperCase() + categories[i].slice(1))
                        .attr('x', headerBoxRunningPhase.x + box.w * (template[categories.length][i].x + (template[categories.length][i].w * 0.5)))
                        .attr('y', headerBoxRunningPhase.y + box.y + box.h * (template[categories.length][i].y + (template[categories.length][i].h * 0.7)))
                        .style('font-size', Math.max((box.h * template[categories.length][i].h) * 0.4, 9))
                }
            }
            function initConfigDataFinish(g) {
                let categories = [ 'mount', 'mirror', 'daq', 'camera' ]
                for (let i = 0; i < categories.length; i++) {
                    g.append('rect')
                        .attr('id', categories[i])
                        .attr('fill', colorFree)
                        .attr('fill-opacity', 0.6)
                        .attr('stroke', color_theme.darker.stroke)
                        .attr('stroke-width', 0)
                    g.append('text')
                        .attr('id', categories[i].charAt(0).toUpperCase() + categories[i].slice(1))
                        .text(categories[i].charAt(0).toUpperCase() + categories[i].charAt(1)) // categories[i].slice(1))
                        .style('font-weight', '')
                        .style('fill', color_theme.blocks.run.text)
                        .attr('text-anchor', 'middle')
                        .style('pointer-events', 'none')
                        .style('user-select', 'none')
                }
                updateConfigDataFinish(g)
            }

            function initRunPhase(g, run_phase, gt) {
                if (run_phase.length < 1) {
                    return
                }
                if (run_phase[0].includes('config')) {
                    initConfig(g, run_phase, gt)
                }
                if (run_phase[0].includes('takeData')) {
                    initTake(g, run_phase, gt)
                }
                if (run_phase[0].includes('finish')) {
                    initFinish(g, run_phase, gt)
                }
            }
            function initConfig(g, run_phase, gt) {
                g.attr('transform', 'translate(' + transConfig + ',0)')
                // gt.attr('transform', 'translate(' + transConfig + ',0)')

                g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
                for (let i = 0; i < run_phase.length; i++) {
                    if (run_phase[0].includes('mount')) {
                        g.select('#mount').attr('fill', colorFree)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('camera')) {
                        g.select('#camera').attr('fill', colorFree)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('mirror')) {
                        g.select('#mirror').attr('fill', colorFree)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('Daq')) {
                        g.select('#daq').attr('fill', colorFree)
                    } // .attr('stroke-width', 0.2)
                }
            }
            function initTake(g, run_phase, gt) {
                g.attr('transform', 'translate(' + transTake + ',0)')
                // gt.attr('transform', 'translate(' + transTake + ',0)')

                g.select('text#Mount').attr('opacity', 0)
                g.select('text#Camera').attr('opacity', 0)
                g.select('text#Mirror').attr('opacity', 0)
                g.select('text#Daq').attr('opacity', 0)

                g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
            }
            function initFinish(g, run_phase, gt) {
                g.attr('transform', 'translate(' + transFinish + ',0)')
                // gt.attr('transform', 'translate(' + transFinish + ',0)')

                g.select('text#Mount').attr('opacity', 1)
                g.select('text#Camera').attr('opacity', 1)
                g.select('text#Mirror').attr('opacity', 1)
                g.select('text#Daq').attr('opacity', 1)

                g.select('#mount').attr('fill', colorFree) // .attr('stroke-width', 2)
                g.select('#camera').attr('fill', colorFree) // .attr('stroke-width', 2)
                g.select('#daq').attr('fill', colorFree) // .attr('stroke-width', 2)
                g.select('#mirror').attr('fill', colorFree) // .attr('stroke-width', 0.2)
                for (let i = 0; i < run_phase.length; i++) {
                    if (run_phase[0].includes('mount')) {
                        g.select('#mount').attr('fill', colorLock)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('camera')) {
                        g.select('#camera').attr('fill', colorLock)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('mirror')) {
                        g.select('#mirror').attr('fill', colorLock)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('Daq')) {
                        g.select('#daq').attr('fill', colorLock)
                    } // .attr('stroke-width', 0.2)
                }
            }

            function dispatchRunPhase(g, run_phase, gt) {
                if (run_phase.length < 1) {
                    return
                }
                if (run_phase[0].includes('config')) {
                    dispatchConfig(g, run_phase, gt)
                    return 'config'
                }
                else if (run_phase[0].includes('takeData')) {
                    dispatchTake(g, run_phase, gt)
                    return 'take'
                }
                else if (run_phase[0].includes('finish')) {
                    dispatchFinish(g, run_phase, gt)
                    return 'finish'
                }
            }
            function dispatchConfig(g, run_phase, gt) {
                g.transition().duration(times.anim).attr('transform', 'translate(' + transConfig + ',0)')
                // gt.transition().duration(times.anim).attr('transform', 'translate(' + transConfig + ',0)')

                g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
                for (let i = 0; i < run_phase.length; i++) {
                    if (run_phase[0].includes('mount')) {
                        g.select('#mount').attr('fill', colorFree)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('camera')) {
                        g.select('#camera').attr('fill', colorFree)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('mirror')) {
                        g.select('#mirror').attr('fill', colorFree)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('Daq')) {
                        g.select('#daq').attr('fill', colorFree)
                    } // .attr('stroke-width', 0.2)
                }
            }
            function dispatchTake(g, run_phase, gt) {
                g.transition().duration(times.anim).attr('transform', 'translate(' + transTake + ',0), scale(' + scaleTake + ',1)')
                // gt.transition().duration(times.anim).attr('transform', 'translate(' + transTake + ',0)')

                g.select('text#Mount').attr('opacity', 0)
                g.select('text#Camera').attr('opacity', 0)
                g.select('text#Mirror').attr('opacity', 0)
                g.select('text#Daq').attr('opacity', 0)

                g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
                g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
            }
            function dispatchFinish(g, run_phase, gt) {
                g.transition().duration(times.anim).attr('transform', 'translate(' + transFinish + ',0)')
                // gt.transition().duration(times.anim).attr('transform', 'translate(' + transFinish + ',0)')

                g.select('text#Mount').attr('opacity', 1)
                g.select('text#Camera').attr('opacity', 1)
                g.select('text#Mirror').attr('opacity', 1)
                g.select('text#Daq').attr('opacity', 1)

                g.select('#mount').attr('fill', colorFree) // .attr('stroke-width', 2)
                g.select('#camera').attr('fill', colorFree) // .attr('stroke-width', 2)
                g.select('#daq').attr('fill', colorFree) // .attr('stroke-width', 2)
                g.select('#mirror').attr('fill', colorFree) // .attr('stroke-width', 0.2)
                for (let i = 0; i < run_phase.length; i++) {
                    if (run_phase[0].includes('mount')) {
                        g.select('#mount').attr('fill', colorLock)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('camera')) {
                        g.select('#camera').attr('fill', colorLock)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('mirror')) {
                        g.select('#mirror').attr('fill', colorLock)
                    } // .attr('stroke-width', 0.2)
                    if (run_phase[0].includes('Daq')) {
                        g.select('#daq').attr('fill', colorLock)
                    } // .attr('stroke-width', 0.2)
                }
            }

            let current_blocks = reserved.gBlockBox
                .selectAll('g.currentBlock')
                .data(queueRun, function(d) {
                    return d.block.obs_block_id
                })
            let enterCurrentBlocks = current_blocks
                .enter()
                .append('g')
                .attr('class', 'currentBlock')
            enterCurrentBlocks.each(function(d, i) {
                d = d.block
                let middleRect = headerBoxRunningPhase.x + (headerBoxRunningPhase.w * 0.5)
                let grunphase = d3.select(this).append('g').attr('id', 'grunphase')

                initConfigDataFinish(grunphase)

                d3.select(this).append('rect')
                    .attr('id', 'middle')
                    .attr('x', queueRun.length > 6 ? middleRect - (headerBoxRunningPhase.w * 0.8 * 0.5) : middleRect - (headerBoxRunningPhase.w * 0.33 * 0.5))
                    .attr('y', headerBoxRunningPhase.y + headerBoxRunningPhase.h * 0.05)
                    .attr('width', queueRun.length > 6 ? headerBoxRunningPhase.w * 0.55 : headerBoxRunningPhase.w * 0.32)
                    .attr('height', headerBoxRunningPhase.h * 0.9)
                    .attr('fill', color_theme.blocks.run.background)
                    .attr('fill-opacity', 0.6)
                    .attr('stroke', color_theme.dark.stroke)

                let gtext = d3.select(this).append('g').attr('id', 'text')
                initRunPhase(grunphase, d.run_phase, gtext)

                gtext.append('text')
                    .attr('id', 'name')
                    .text(function() {
                        return d.metadata.block_name
                    })
                    .attr('x', queueRun.length > 6 ? headerBoxId.w * 0.5 - 4 : headerBoxId.w * 0.5)
                    .attr('y', queueRun.length > 6 ? headerBoxId.h * 0.75 : headerBoxId.h * 0.4)
                    .attr('dy', 0)
                    .style('fill', color_theme.blocks.run.text)
                    .style('font-weight', 'bold')
                    .style('font-size', Math.max(12, Math.min(20, headerBoxId.h * 0.6)))
                    .attr('text-anchor', queueRun.length > 6 ? 'end' : 'middle')
                gtext.append('text')
                    .attr('id', 'percent')
                    .attr('x', queueRun.length > 6 ? headerBoxId.w * 0.4 + 4 : headerBoxId.w * 0.5)
                    .attr('y', queueRun.length > 6 ? headerBoxId.h * 0.65 : headerBoxId.h * 0.80)
                    .attr('dy', 0)
                    .style('fill', color_theme.blocks.run.text)
                    .style('font-weight', '')
                    .style('font-size', Math.max(12, Math.min(20, headerBoxId.h * 0.6)))
                    .attr('text-anchor', queueRun.length > 6 ? 'start' : 'middle')
            })

            let mergeCurrentBlocks = current_blocks.merge(enterCurrentBlocks)

            mergeCurrentBlocks.each(function(d, i) {
                let block = d.block
                let translate = {
                    x: blockBox.x,
                    y: b.y + offsetY + (blockBox.y + blockBox.h) * i,
                }

                let grunphase = d3.select(this).select('g#grunphase')
                updateConfigDataFinish(grunphase)
                let step = dispatchRunPhase(d3.select(this).select('#grunphase'), block.run_phase, d3.select(this).select('#text'))
                let percent = 1 - (block.time.end - shared.data.server.time_of_night.now) / (block.time.end - block.time.start)
                let middleRect = headerBoxRunningPhase.x + (headerBoxRunningPhase.w * 0.5)

                d3.select(this).select('#middle')
                    .attr('x', middleRect - (headerBoxRunningPhase.w * 0.33 * 0.5))
                    .attr('width', headerBoxRunningPhase.w * 0.33)
                    .attr('height', headerBoxRunningPhase.h * 0.9)
                    .attr('stroke-width', queueRun.length > 6 ? 6 : 6)
                    .attr('stroke-dasharray', [ 0, (1 - percent) * headerBoxRunningPhase.w * 0.33, percent * headerBoxRunningPhase.w * 0.33, headerBoxRunningPhase.w * 0.33 + headerBoxRunningPhase.h * 0.9 * 2 ])

                d3.select(this).select('#name')
                    .attr('x', headerBoxId.w * 0.5)
                    .attr('y', queueRun.length > 6 ? headerBoxId.h * 0.65 : headerBoxId.h * 0.4)
                    .style('font-size', Math.max(6, Math.min(16, headerBoxId.h * 0.5)))
                    .attr('text-anchor', queueRun.length > 6 ? 'middle' : 'middle')
                d3.select(this).select('#percent')
                    .text(function() {
                        return Math.floor(percent * 100) + '%'
                    })
                    .attr('x', queueRun.length > 6 ? (headerBoxId.w * (step === 'take' ? 0.55 : (step === 'finish' ? 0.64 : 0.45))) : headerBoxId.w * 0.5)
                    .attr('y', queueRun.length > 6 ? headerBoxId.h * 0.65 : headerBoxId.h * 0.80)
                    .style('font-size', Math.max(6, Math.min(14, headerBoxId.h * 0.5)))
                    .attr('text-anchor', queueRun.length > 6 ? 'start' : 'middle')
                    .style('opacity', queueRun.length > 6 ? 0 : 1)

                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .attr('transform', function() {
                        return 'translate(' + translate.x + ',' + translate.y + ')'
                    })

                // let lineGenerator = d3.line()
                //   .x(function (d) { return d.x })
                //   .y(function (d) { return d.y })
                //   .curve(d3.curveBasis)
                // let dataPointFuturTop = [
                //   {x: blockBox.w + blockBox.x, y: -translate.y + box.block_queue_serverPast.y + d.y + d.h * 0.5},
                //   {x: blockBox.w + (blockBox.x) * 0.5, y: -translate.y + box.block_queue_serverPast.y + d.y + d.h * 0.5 - blockBox.h * 0.5},
                //   {x: blockBox.w + (blockBox.x) * 0.5, y: blockBox.h * 0.5},
                //   {x: blockBox.w, y: blockBox.h * 0.5},
                //
                //   {x: blockBox.w * 0.5, y: blockBox.h * 0.5},
                //
                //   {x: 0, y: blockBox.h * 0.5},
                //   {x: 0 - (blockBox.x * 0.5), y: blockBox.h * 0.5},
                //   {x: 0 - (blockBox.x * 0.5), y: -translate.y + box.block_queue_serverPast.y + d.y + d.h * 0.5 - blockBox.h * 0.5},
                //   {x: -blockBox.x, y: -translate.y + box.block_queue_serverPast.y + d.y + d.h * 0.5}
                // ]
                // d3.select(this).select('path')
                //   .data([dataPointFuturTop])
                //   .transition()
                //   .duration(times.anim)
                //   .attr('d', lineGenerator)
            })
            current_blocks
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        this.update_data = update_data
    }
    let SvgFreeTels = function() {
        let reserved = {
        }

        function init_data() {
            let telsBox = deep_copy(box.freeTels)
            // telsBox.x = telsBox.w * 0.1
            // telsBox.w = telsBox.w * 0.8
            reserved.g = svg.g.append('g')
                .attr('transform', 'translate(' + box.freeTels.x + ',' + box.freeTels.y + ')')

            let xx = telsBox.w * 0.1
            let ww = telsBox.w * 0.8
            let largeBox = {
                x: xx,
                y: 0,
                w: ww * 0.1,
                h: telsBox.h,
            }
            let mediumBox = {
                x: xx + ww * 0.13,
                y: 0,
                w: ww * 0.3,
                h: telsBox.h,
            }
            let smallBox = {
                x: xx + ww * 0.46,
                y: 0,
                w: ww * 0.54,
                h: telsBox.h,
            }
            telescopeRunning = new TelescopeDisplayer({
                main: {
                    tag: 'telescopeDisplayerSchedBlock',
                    g: reserved.g,
                    scroll: {
                    },
                    box: telsBox,
                    background: {
                        fill: color_theme.medium.background,
                        stroke: color_theme.medium.stroke,
                        strokeWidth: 0.4,
                    },
                    is_south: is_south,
                    color_theme: color_theme,
                },

                displayer: 'gridBib',
                gridBib: {
                    header: {
                        text: {
                            size: 16,
                            color: color_theme.medium.background,
                        },
                        background: {
                            height: 23,
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
                                size: 2,
                                ratio: 1,
                                max: 24,
                            },
                            box: largeBox,
                        },
                        medium: {
                            g: undefined,
                            opt: {
                                telsPerRow: 5,
                                nbl: 0,
                                size: 1.3,
                                ratio: 1,
                                max: 20,
                            },
                            box: mediumBox,
                        },
                        small: {
                            g: undefined,
                            opt: {
                                telsPerRow: 10,
                                nbl: 0,
                                size: 1,
                                ratio: 1,
                                max: 18,
                            },
                            box: smallBox,
                        },
                    },
                    idle: {
                        txt_size: 18,
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
                        txt_size: 18,
                        right: {
                            enabled: true,
                        },
                        left: {
                            enabled: true,
                        },
                        background: {
                            middle: {
                                color: color_theme.blocks.run.background,
                                opacity: 0.4,
                            },
                            side: {
                                color: color_theme.blocks.run.background,
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
                    telescope: {
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
                    over: {
                        telescope: undefined,
                    },
                    focus: {
                        telescope: undefined,
                    },
                },
            })
            telescopeRunning.init()

            update_data()
        }
        this.init_data = init_data

        function update_data() {
            let tels = []
            for (let i = 0; i < shared.data.server.tel_ids.length; i++) {
                let id = shared.data.server.tel_ids[i]
                tels.push({
                    id: id,
                    health: get_tel_healthById(id),
                })
            }
            telescopeRunning.update_data({
                data: {
                    raw: {
                        telescopes: tels,
                        blocks: shared.data.server.blocks.run,
                    },
                    modified: [],
                },
            })
        }
        this.update_data = update_data
    }

    let svg_events_queue_serverPast = new Svg_events_queue_serverPast()
    let svg_events_queue_serverFutur = new Svg_events_queue_serverFutur()
    let svgBrushPast = new SvgBrushPast()
    let svgBrushFutur = new SvgBrushFutur()
    let svg_blocks_queue_serverPast = new Svg_blocks_queue_serverPast()
    let svg_blocks_queue_serverFutur = new Svg_blocks_queue_serverFutur()
    let svgRunningPhase = new SvgRunningPhase()
    let svgFreeTels = new SvgFreeTels()
    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function getFocusBlock(opt_in) {
        let focusBlock = null
        let blocks = opt_in.blocks

        if (is_def(blocks)) {
            $.each(blocks, function(index0, data_now0) {
                if (is_def(focusBlock)) {
                    return
                }
                $.each(data_now0, function(index1, data_now1) {
                    if (opt_in.focus_id === data_now1.obs_block_id) {
                        focusBlock = data_now1
                    }
                })
            })
        }

        return is_def(focusBlock) ? focusBlock : {
        }
    }
}
