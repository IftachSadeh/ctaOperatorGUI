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
var main_script_tag = 'CommentSched'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global min_max_obj */
/* global sock */
/* global times */
/* global is_def */
/* global tel_info */
/* global disable_scroll_svg */
/* global RunLoop */
/* global BlockDisplayer */
/* global BlockList */
/* global BlockFilters */
/* global BlockQueueCreator */
/* global TelsArray */
/* global EventQueue */
/* global ClockEvents */
/* global ButtonPanel */
/* global PanelManager */
/* global bck_pattern */
/* global inst_health_col */
/* global cols_purples_blues */
/* global cols_yellows */
/* global ScrollTable */
/* global cols_reds */
/* global cols_purples */
/* global cols_greens */
/* global col_prime */
/* global Locker */
/* global FormManager */
/* global dom_add */
/* global run_when_ready */
/* global ScrollBox */

// window.load_script({ source: main_script_tag, script: '/js/utils_blockQueueCreator.js' })
// window.load_script({ source: main_script_tag, script: '/js/utils_blockList.js' })
window.load_script({
    source: main_script_tag,
    script: '/js/utils/blocks/BlockFilters.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/blocks/BlockDisplayer.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/events/EventQueue.js',
})
// window.load_script({ source: main_script_tag, script: '/js/utils_TelsArray.js' })

window.load_script({
    source: main_script_tag,
    script: '/js/utils/PanelManager.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils_buttonPanel.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/events/ClockEvents.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/ScrollTable.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/FormManager.js',
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
        sock_func: sock_comment_sched,
        main_func: main_comment_sched,
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
let sock_comment_sched = function(opt_in) {
    // let widget_type   = opt_in.widget_type;
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
    //     "widget_type":widget_type, "widget_id":widget_id,
    //     "method_name":"comment_schedAskTelData",
    //     "method_arg":data
    //   };
    //   sock.socket.emit("widget", emit_data);
    //   return;
    // }
}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go with the content of this particular widget
// -------------------------------------------------------------------
let main_comment_sched = function(opt_in) {
    let color_theme = get_color_theme('bright_grey')
    // let my_unique_id = unique()
    let widget_type = opt_in.widget_type
    let tagBlockQueue = 'blockQueue'
    let tag_arr_zoomerPlotsSvg = opt_in.base_name

    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    let shared = {
        data: {
            server: undefined,
            copy: [],
            current: 0,
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

    let com = {
    }

    let filters = {
        states: [],
        errors: [],
    }
    let tokens = {
        blockState: {
        },
        blockError: {
        },
    }
    let filteredTokens = {
        blockState: {
        },
        blockError: {
        },
    }

    let block_queue_server = null
    let blockFilters = null

    let eventQueue = new EventQueue()

    // let this_comment_sched = this
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
    locker.add('in_init')

    // function loop
    let run_loop = new RunLoop({
        tag: widget_id,
    })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function add_dummy_log() {
        function shuffle(a) {
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
        ;[ a[i], a[j] ] = [ a[j], a[i] ]
            }
            return a
        }
        com.logs = []
        let categories = [
            'cat1',
            'cat2',
            'cat3',
            'cat4',
            'cat5',
            'cat6',
            'cat7',
            'cat8',
            'cat9',
        ]
        let linkto = [ 'block', 'tel', 'event' ]
        for (var i = 0; i < 100; i++) {
            shuffle(categories)
            shuffle(linkto)
            let categ = []
            let linkt = []
            for (let j = 0; j < Math.floor(Math.random() * 4) + 1; j++) {
                categ.push(categories[j])
            }
            for (let j = 0; j < Math.floor(Math.random() * 3); j++) {
                linkt.push(linkto[j])
            }
            com.logs.push({
                id: 'log_' + i + Math.floor(Math.random() * 1000),
                name: 'log_' + i + Math.floor(Math.random() * 1000),
                description:
          'description description description description description description description description description description description description',
                categories: categ,
                info: [
                    {
                        action: 'creation',
                        author: 'system',
                        date: '27/02/2019',
                    },
                    {
                        action: 'modification',
                        author: 'system',
                        date: '27/02/2019',
                    },
                    {
                        action: 'modification',
                        author: 'system',
                        date: '27/02/2019',
                    },
                    {
                        action: 'modification',
                        author: 'system',
                        date: '27/02/2019',
                    },
                ],
                linkedTo: linkt,
            })
        }
    }
    function addDumLogParser() {
        shared.data.server.logs = com.logs
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
                svg.svg.on('wheel', function() {
                    d3.event.preventDefault()
                })
            }

            com.svg_zoom_node = svg.svg.nodes()[0]
            svg.back = svg.svg.append('g')
            svg.g = svg.svg.append('g')

            let defs = svg.svg.append('defs')
            // create filter with id #drop-shadow
            // height=130% so that the shadow is not clipped
            let filter = defs
                .append('filter')
                .attr('id', 'drop-shadow')
                .attr('height', '120%')

            // SourceAlpha refers to opacity of graphic that this filter will be applied to
            // convolve that with a Gaussian with standard deviation 3 and store result
            // in blur
            filter
                .append('feGaussianBlur')
                .attr('in', 'SourceAlpha')
                .attr('stdDeviation', 2.5)
                .attr('result', 'blur')

            // translate output of Gaussian blur to the right and downwards with 2px
            // store result in offsetBlur
            filter
                .append('feOffset')
                .attr('in', 'blur')
                .attr('dx', -1)
                .attr('dy', 1)
                .attr('result', 'offsetBlur')

            // overlay original SourceGraphic over translated blurred opacity by using
            // feMerge filter. Order of specifying inputs is important!
            let feMerge = filter.append('feMerge')
            feMerge.append('feMergeNode').attr('in', 'offsetBlur')
            feMerge.append('feMergeNode').attr('in', 'SourceGraphic')
        }
        function initBackground() {
            svg.svg.style('background', '#444444') // color_theme.bright.background)

            // svg.back.append('rect')
            //   .attr('x', -svg_dims.w[0] * 0.1)
            //   .attr('y', svg_dims.h[0] * 0.005)
            //   .attr('width', svg_dims.w[0] * 0.59)
            //   .attr('height', svg_dims.h[0] * 0.475 + svg_dims.h[0] * 0.0)
            //   .attr('fill', color_theme.medium.background)
            //   .attr('stroke', '#000000')
            //   .attr('stroke-width', 0.2)
            //   .attr('rx', 0)
            // svg.back.append('text')
            //   .text('Scheduling blocks & Events')
            //   .style('fill', color_theme.medium.text)
            //   // .style('stroke', color_theme.medium.text)
            //   // .style('stroke-size', 0.1)
            //   .style('font-weight', '')
            //   .style('font-size', '10px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + ((-svg_dims.w[0] * 0.15 + svg_dims.w[0] * 0.59) * 0.5) + ',' + (svg_dims.h[0] * 0.03) + ')')
            // // svg.back.append('rect')
            // //   .attr('x', svg_dims.w[0] * 0.54 * 0.5 - svg_dims.w[0] * 0.05)
            // //   .attr('y', svg_dims.h[0] * 0.025 - svg_dims.h[0] * 0.015)
            // //   .attr('width', svg_dims.w[0] * 0.1)
            // //   .attr('height', svg_dims.h[0] * 0.03)
            // //   .attr('fill', color_theme.medium.background)
            // //   .attr('stroke', '#000000')
            // //   .attr('stroke-width', 0.6)
            // //   .attr('rx', 2)
            // svg.back.append('rect')
            //   .attr('x', -svg_dims.w[0] * 0.1)
            //   .attr('y', svg_dims.h[0] * 0.487)
            //   .attr('width', svg_dims.w[0] * 0.59)
            //   .attr('height', svg_dims.h[0] * 0.405)
            //   .attr('fill', color_theme.medium.background)
            //   .attr('stroke', '#000000')
            //   .attr('stroke-width', 0.2)
            //   .attr('rx', 0)
            // svg.back.append('text')
            //   .text('Telescopes')
            //   .style('fill', color_theme.medium.text)
            //   .style('font-weight', '')
            //   .style('font-size', '10px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + ((-svg_dims.w[0] * 0.15 + svg_dims.w[0] * 0.59) * 0.5) + ',' + (svg_dims.h[0] * 0.51) + ')')
            // // svg.back.append('rect')
            // //   .attr('x', svg_dims.w[0] * 0.54 * 0.5 - svg_dims.w[0] * 0.05)
            // //   .attr('y', svg_dims.h[0] * 0.5 - svg_dims.h[0] * 0.0125)
            // //   .attr('width', svg_dims.w[0] * 0.1)
            // //   .attr('height', svg_dims.h[0] * 0.025)
            // //   .attr('fill', color_theme.medium.background)
            // //   .attr('stroke', color_theme.medium.stroke)
            // //   .attr('stroke-width', 0.4)
            // svg.back.append('rect')
            //   .attr('x', -svg_dims.w[0] * 0.1)
            //   .attr('y', svg_dims.h[0] * 0.9)
            //   .attr('width', svg_dims.w[0] * 0.59)
            //   .attr('height', svg_dims.h[0] * 0.1)
            //   .attr('fill', color_theme.medium.background)
            //   .attr('stroke', '#000000')
            //   .attr('stroke-width', 0.2)
            //   .attr('rx', 0)
            //
            // svg.back.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.493)
            //   .attr('y', svg_dims.h[0] * 0)
            //   .attr('width', svg_dims.w[0] * 0.507)
            //   .attr('height', svg_dims.h[0] * 1)
            //   .attr('fill', color_theme.medium.background)
            //   .attr('stroke', '#000000')
            //   .attr('stroke-width', 0.2)
        }
        function initBox() {
            let marg = svg_dims.w[0] * 0.01
            box.log = {
                x: svg_dims.w[0] * 0 + marg,
                y: svg_dims.h[0] * 0.0 + marg,
                w: svg_dims.w[0] * 0.5 - 2 * marg,
                h: svg_dims.h[0] * 1 - 2 * marg,
                marg: marg,
            }
            box.logFields = {
                x: box.log.x * 0.0 + box.log.w * 0.25,
                y: box.log.y * 0.0 + box.log.h * 0.0,
                w: box.log.w * 0.75,
                h: box.log.h * 0.7,
                marg: box.log.marg,
            }
            box.logHistory = {
                x: box.log.x * 0.0 + box.log.w * 0.01,
                y: box.log.y * 0.0 + marg,
                w: box.log.w * 0.24,
                h: box.log.h * 0.89,
                marg: box.log.marg,
            }
            // box.logCategories = {
            //   x: box.log.x * 0.0 + box.log.w * 0.5,
            //   y: box.log.y * 0.0 + box.log.w * 0.1,
            //   w: box.log.w * 0.25,
            //   h: box.log.h * 0.3,
            //   marg: box.log.marg
            // }
            // box.logText = {
            //   x: box.log.x * 0.0 + box.log.w * 0.0,
            //   y: box.log.y * 0.0 + box.log.w * 0.1,
            //   w: box.log.w * 0.5,
            //   h: box.log.h * 0.9,
            //   marg: box.log.marg
            // }
            box.logAssociated_element = {
                x: box.log.w * 0.575,
                y: box.log.h * 0.7,
                w: box.log.w * 0.4,
                h: box.log.h * 0.275,
                marg: box.log.marg,
            }
            box.log_info = {
                x: box.log.w * 0.275,
                y: box.log.h * 0.7,
                w: box.log.w * 0.275,
                h: box.log.h * 0.275,
                marg: box.log.marg,
            }

            box.rightPanel = {
                x: svg_dims.w[0] * 0.5,
                y: svg_dims.h[0] * 0.0,
                w: svg_dims.w[0] * 0.5,
                h: svg_dims.h[0] * 1.0,
                marg: svg_dims.w[0] * 0.01,
            }
            box.block_queue_server = box.rightPanel
            box.block_queue_server_icon = {
                x: box.block_queue_server.w * 0.02,
                y: marg,
                w: box.block_queue_server.w * 0.05,
                h: box.block_queue_server.h * 0.05,
                marg: box.block_queue_server.marg,
            }
            box.block_queue_server_tab = {
                x: box.block_queue_server.w * 0.225,
                y: box.block_queue_server.h * 0.175,
                w: box.block_queue_server.w * 0.05,
                h: box.block_queue_server.h * 0.05,
                marg: box.block_queue_server.marg,
            }
            box.block_queue_server_title = {
                x: box.block_queue_server.w * 0.1,
                y: box.block_queue_server.h * 0.0,
                w: box.block_queue_server.w * 0.8,
                h: box.block_queue_server.h * 0.1,
                marg: box.block_queue_server.marg,
            }
            box.block_queue_server_filter = {
                x: box.block_queue_server.w * 0.15,
                y: box.block_queue_server.h * 0.1,
                w: box.block_queue_server.w * 0.8,
                h: box.block_queue_server.h * 0.4,
                marg: box.block_queue_server.marg,
            }
            box.block_queue_server_content = {
                x: box.block_queue_server.marg * 3,
                y: box.block_queue_server.h * 0.575,
                w: box.block_queue_server.w * 0.85,
                h: box.block_queue_server.h * 0.35,
                marg: box.block_queue_server.marg,
            }

            box.event_queue_server = box.rightPanel
            box.event_queue_server_icon = {
                x: box.block_queue_server.w * 0.02,
                y: box.block_queue_server.h * 0.05 + marg * 2,
                w: box.block_queue_server.w * 0.05,
                h: box.block_queue_server.h * 0.05,
                marg: box.event_queue_server.marg,
            }
            box.event_queue_serverTab = {
                x: box.event_queue_server.w * 0.225,
                y: box.event_queue_server.h * 0.175,
                w: box.event_queue_server.w * 0.05,
                h: box.event_queue_server.h * 0.05,
                marg: box.event_queue_server.marg,
            }
            box.event_queue_serverTitle = {
                x: box.event_queue_server.w * 0.0,
                y: box.event_queue_server.h * 0.0,
                w: box.event_queue_server.w * 0.8,
                h: box.event_queue_server.h * 0.1,
                marg: box.event_queue_server.marg,
            }
            box.event_queue_serverFilter = {
                x: box.event_queue_server.w * 0.05,
                y: box.event_queue_server.h * 0.1,
                w: box.event_queue_server.w * 0.71,
                h: box.event_queue_server.h * 0.4,
                marg: box.event_queue_server.marg,
            }
            box.event_queue_serverContent = {
                x: box.event_queue_server.marg * 3,
                y: box.event_queue_server.h * 0.575,
                w: box.event_queue_server.w * 0.85,
                h: box.event_queue_server.h * 0.35,
                marg: box.event_queue_server.marg,
            }

            box.tels_queue_server = box.rightPanel
            box.tels_queue_server_icon = {
                x: box.block_queue_server.w * 0.02,
                y: box.block_queue_server.h * 0.05 * 2 + marg * 3,
                w: box.block_queue_server.w * 0.05,
                h: box.block_queue_server.h * 0.05,
                marg: box.tels_queue_server.marg,
            }
            box.tels_queue_server_tab = {
                x: box.tels_queue_server.w * 0.225,
                y: box.tels_queue_server.h * 0.175,
                w: box.tels_queue_server.w * 0.05,
                h: box.tels_queue_server.h * 0.05,
                marg: box.tels_queue_server.marg,
            }
            box.tels_queue_server_title = {
                x: box.tels_queue_server.w * 0.0,
                y: box.tels_queue_server.h * 0.0,
                w: box.tels_queue_server.w * 0.8,
                h: box.tels_queue_server.h * 0.1,
                marg: box.tels_queue_server.marg,
            }
            box.tels_queue_server_filter = {
                x: box.tels_queue_server.w * 0.05,
                y: box.tels_queue_server.h * 0.1,
                w: box.tels_queue_server.w * 0.71,
                h: box.tels_queue_server.h * 0.4,
                marg: box.tels_queue_server.marg,
            }
            box.tels_queue_server_content = {
                x: box.tels_queue_server.marg * 3,
                y: box.tels_queue_server.h * 0.575,
                w: box.tels_queue_server.w * 0.85,
                h: box.tels_queue_server.h * 0.35,
                marg: box.tels_queue_server.marg,
            }

            box.daq_queue_server = box.rightPanel
            box.daq_queue_server_icon = {
                x: box.block_queue_server.w * 0.02,
                y: box.block_queue_server.h * 0.05 + marg * 2,
                w: box.block_queue_server.w * 0.05,
                h: box.block_queue_server.h * 0.05,
                marg: box.daq_queue_server.marg,
            }
            box.daq_queue_serverTab = {
                x: box.daq_queue_server.w * 0.225,
                y: box.daq_queue_server.h * 0.175,
                w: box.daq_queue_server.w * 0.05,
                h: box.daq_queue_server.h * 0.05,
                marg: box.daq_queue_server.marg,
            }
            box.daq_queue_serverTitle = {
                x: box.daq_queue_server.w * 0.0,
                y: box.daq_queue_server.h * 0.0,
                w: box.daq_queue_server.w * 0.8,
                h: box.daq_queue_server.h * 0.1,
                marg: box.daq_queue_server.marg,
            }
            box.daq_queue_serverFilter = {
                x: box.daq_queue_server.w * 0.05,
                y: box.daq_queue_server.h * 0.1,
                w: box.daq_queue_server.w * 0.71,
                h: box.daq_queue_server.h * 0.4,
                marg: box.daq_queue_server.marg,
            }
            box.daq_queue_serverContent = {
                x: box.daq_queue_server.marg * 3,
                y: box.daq_queue_server.h * 0.575,
                w: box.daq_queue_server.w * 0.85,
                h: box.daq_queue_server.h * 0.35,
                marg: box.daq_queue_server.marg,
            }

            box.telescopes = {
                x: svg_dims.w[0] * 0.5,
                y: svg_dims.h[0] * 0.56,
                w: svg_dims.w[0] * 0.48,
                h: svg_dims.h[0] * 0.5,
                marg: svg_dims.w[0] * 0.01,
            }
            box.clock = {
                x: svg_dims.w[0] * 0.002,
                y: svg_dims.h[0] * 0.92,
                w: svg_dims.w[0] * 0.485,
                h: svg_dims.h[0] * 0.05,
                marg: svg_dims.w[0] * 0.01,
            }
        }
        function initDefaultStyle() {
            shared.style = {
            }
            shared.style.runRecCol = cols_blues[2]
            shared.style.blockCol = function(opt_in) {
                let end_time_sec = is_def(opt_in.end_time_sec) ? opt_in.end_time_sec : undefined
                if (end_time_sec < Number(shared.data.server.time_of_night.now)) {
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

        com.data_in = data_in
        shared.data.server = data_in.data
        add_dummy_log()
        addDumLogParser()

        svgTextEditor.init_data(data_in.data)
        svg_blocks_queue_server.init_data(data_in.data)
        svgEvents.init_data(data_in.data)
        svgTelescopes.init_data(data_in.data)
    // svgsAQ.init_data()
    // svgBottom_info.init_data(data_in.data)
    }
    this.init_data = init_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_data(data_in) {
        com.data_in = data_in
        shared.data.server = data_in.data
        addDumLogParser()

        // clusterData(com.data_in.data)
        // filterData(com.data_in.data)

        svg_blocks_queue_server.update_data()
        svgEvents.update_data(data_in.data)
    // svgTelescopes.update_data(data_in.data)
    // svgFilterBlocks.update_data(data_in.data)
    // svgMiddle_info.update_data(data_in.data)
    // svgBottom_info.update_data(data_in.data)
    }
    this.update_data = update_data

    function clusterData(data_in) {
        tokens.blockState = {
        }
        tokens.blockError = {
        }
        for (var i = 0; i < data_in.blocks.done.length; i++) {
            if (is_def(tokens.blockState[data_in.blocks.done[i].exe_state.state])) {
                if (
                    !tokens.blockState[data_in.blocks.done[i].exe_state.state].includes(
                        data_in.blocks.done[i].obs_block_id
                    )
                ) {
                    tokens.blockState[data_in.blocks.done[i].exe_state.state].push(
                        data_in.blocks.done[i].obs_block_id
                    )
                }
            }
            else {
                tokens.blockState[data_in.blocks.done[i].exe_state.state] = [
                    data_in.blocks.done[i].obs_block_id,
                ]
            }

            if (
                data_in.blocks.done[i].exe_state.state === 'cancel'
        || data_in.blocks.done[i].exe_state.state === 'fail'
            ) {
                if (is_def(tokens.blockError[data_in.blocks.done[i].exe_state.error])) {
                    if (
                        !tokens.blockError[data_in.blocks.done[i].exe_state.error].includes(
                            data_in.blocks.done[i].obs_block_id
                        )
                    ) {
                        tokens.blockError[data_in.blocks.done[i].exe_state.error].push(
                            data_in.blocks.done[i].obs_block_id
                        )
                    }
                }
                else {
                    tokens.blockError[data_in.blocks.done[i].exe_state.error] = [
                        data_in.blocks.done[i].obs_block_id,
                    ]
                }
            }
        }
    }
    function checkWithErrorsFilters(block) {
        if (filters.errors.length === 0) {
            return true
        }
        for (let i = 0; i < filters.errors.length; i++) {
            if (filters.errors[i].id === block.error) {
                return true
            }
        }
        return false
    }
    function checkWithStatesFilters(block) {
        if (filters.states.length === 0) {
            return true
        }
        for (let i = 0; i < filters.states.length; i++) {
            if (filters.states[i].id === block.state) {
                return true
            }
        }
        return false
    }
    function filterData(data_in) {
        filteredTokens.blockState = {
        }
        filteredTokens.blockError = {
        }
        for (var i = 0; i < data_in.blocks.done.length; i++) {
            if (checkWithErrorsFilters(data_in.blocks.done[i].exe_state)) {
                if (
                    is_def(
                        filteredTokens.blockState[data_in.blocks.done[i].exe_state.state]
                    )
                ) {
                    if (
                        !filteredTokens.blockState[
                            data_in.blocks.done[i].exe_state.state
                        ].includes(data_in.blocks.done[i].obs_block_id)
                    ) {
                        filteredTokens.blockState[
                            data_in.blocks.done[i].exe_state.state
                        ].push(data_in.blocks.done[i].obs_block_id)
                    }
                }
                else {
                    filteredTokens.blockState[data_in.blocks.done[i].exe_state.state] = [
                        data_in.blocks.done[i].obs_block_id,
                    ]
                }
            }

            if (checkWithStatesFilters(data_in.blocks.done[i].exe_state)) {
                if (
                    data_in.blocks.done[i].exe_state.state === 'cancel'
          || data_in.blocks.done[i].exe_state.state === 'fail'
                ) {
                    if (
                        is_def(
                            filteredTokens.blockError[data_in.blocks.done[i].exe_state.error]
                        )
                    ) {
                        if (
                            !filteredTokens.blockError[
                                data_in.blocks.done[i].exe_state.error
                            ].includes(data_in.blocks.done[i].obs_block_id)
                        ) {
                            filteredTokens.blockError[
                                data_in.blocks.done[i].exe_state.error
                            ].push(data_in.blocks.done[i].obs_block_id)
                        }
                    }
                    else {
                        filteredTokens.blockError[data_in.blocks.done[i].exe_state.error] = [
                            data_in.blocks.done[i].obs_block_id,
                        ]
                    }
                }
            }
        }
    }
    function extractTargets() {
        let t = []
        for (let key in shared.data.server.blocks) {
            let arr = shared.data.server.blocks[key]
            for (let i = 0; i < arr.length; i++) {
                if (t.indexOf(arr[i].target_id) === -1) {
                    t.push(arr[i].target_id)
                }
            }
        }
        return t
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
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
    let SvgTextEditor = function() {
        let reserved = {
            main: {
                g: undefined,
                box: {
                },
            },
        }

        // function initinputHistory () {
        //   function initLocalHistory () {
        //     reserved.inputHistory.local.scroll.scrollBoxG = reserved.inputHistory.local.g.append('g')
        //     let historyBox = reserved.inputHistory.local.box
        //     reserved.inputHistory.local.scroll.scrollBoxG.append('rect')
        //       .attr('x', historyBox.x)
        //       .attr('y', historyBox.y)
        //       .attr('width', historyBox.w)
        //       .attr('height', historyBox.h)
        //       .attr('fill', color_theme.dark.background)
        //       .attr('stroke', color_theme.dark.stroke)
        //       .attr('stroke-width', 0.2)
        //
        //     reserved.inputHistory.local.scroll.scrollBox = new ScrollBox()
        //     reserved.inputHistory.local.scroll.scrollBox.init({
        //       tag: 'inputHistoryScrollBox',
        //       g_box: reserved.inputHistory.local.scroll.scrollBoxG,
        //       box_data: {
        //         x: historyBox.x,
        //         y: historyBox.y,
        //         w: historyBox.w,
        //         h: historyBox.h,
        //         marg: 0
        //       },
        //       use_relative_coords: true,
        //       locker: new Locker(),
        //       lockers: [widget_id + 'update_data'],
        //       lock_zoom: {
        //         all: 'ScrollBox' + 'zoom',
        //         during: 'ScrollBox' + 'zoom_during',
        //         end: 'ScrollBox' + 'zoom_end'
        //       },
        //       run_loop: new RunLoop({tag: 'inputHistoryScrollBox'}),
        //       can_scroll: true,
        //       scrollVertical: true,
        //       scroll_horizontal: false,
        //       scroll_height: 0.1 + historyBox.h,
        //       scroll_width: 0,
        //       background: 'transparent',
        //       scroll_rec_h: {h: 2},
        //       scroll_recs: {w: 2}
        //     })
        //     reserved.inputHistory.local.scroll.scrollG = reserved.inputHistory.local.scroll.scrollBox.get('inner_g')
        //   }
        //   function initGeneralHistory () {
        //     reserved.inputHistory.general.scroll.scrollBoxG = reserved.inputHistory.general.g.append('g')
        //     let historyBox = reserved.inputHistory.general.box
        //     reserved.inputHistory.general.scroll.scrollBoxG.append('rect')
        //       .attr('x', historyBox.x)
        //       .attr('y', historyBox.y)
        //       .attr('width', historyBox.w)
        //       .attr('height', historyBox.h)
        //       .attr('fill', color_theme.dark.background)
        //       .attr('stroke', color_theme.dark.stroke)
        //       .attr('stroke-width', 0.2)
        //
        //     reserved.inputHistory.general.scroll.scrollBox = new ScrollBox()
        //     reserved.inputHistory.general.scroll.scrollBox.init({
        //       tag: 'inputHistoryScrollBox',
        //       g_box: reserved.inputHistory.general.scroll.scrollBoxG,
        //       box_data: {
        //         x: historyBox.x,
        //         y: historyBox.y,
        //         w: historyBox.w,
        //         h: historyBox.h,
        //         marg: 0
        //       },
        //       use_relative_coords: true,
        //       locker: new Locker(),
        //       lockers: [widget_id + 'update_data'],
        //       lock_zoom: {
        //         all: 'ScrollBox' + 'zoom',
        //         during: 'ScrollBox' + 'zoom_during',
        //         end: 'ScrollBox' + 'zoom_end'
        //       },
        //       run_loop: new RunLoop({tag: 'inputHistoryScrollBox'}),
        //       can_scroll: true,
        //       scrollVertical: true,
        //       scroll_horizontal: false,
        //       scroll_height: 0.1 + historyBox.h,
        //       scroll_width: 0,
        //       background: 'transparent',
        //       scroll_rec_h: {h: 2},
        //       scroll_recs: {w: 2}
        //     })
        //     reserved.inputHistory.general.scroll.scrollG = reserved.inputHistory.general.scroll.scrollBox.get('inner_g')
        //   }
        //
        //   reserved.inputHistory.main.g.attr('transform', 'translate(' + reserved.inputHistory.main.box.x + ',' + reserved.inputHistory.main.box.y + ')')
        //   reserved.inputHistory.main.g.append('text')
        //     .text('Operators operations :')
        //     .attr('x', 2)
        //     .attr('y', 0 - reserved.inputHistory.main.box.h * 0.03)
        //     .style('fill', color_theme.medium.text)
        //     .style('font-weight', '')
        //     .style('font-size', '8px')
        //     .attr('text-anchor', 'start')
        //   reserved.inputHistory.main.g.append('line')
        //     .attr('x1', 2)
        //     .attr('y1', 0 - reserved.inputHistory.main.box.h * 0.02)
        //     .attr('x2', reserved.inputHistory.main.box.w * 0.9)
        //     .attr('y2', 0 - reserved.inputHistory.main.box.h * 0.02)
        //     .attr('stroke-width', 0.4)
        //     .attr('stroke', color_theme.medium.stroke)
        //
        //   reserved.inputHistory.general = {
        //     g: reserved.inputHistory.main.g.append('g'),
        //     box: {
        //       x: 0,
        //       y: reserved.inputHistory.main.box.h * 0.0,
        //       w: reserved.inputHistory.main.box.w * 1,
        //       h: reserved.inputHistory.main.box.h * 0.49
        //     },
        //     scroll: {}
        //   }
        //   reserved.inputHistory.local = {
        //     g: reserved.inputHistory.main.g.append('g'),
        //     box: {
        //       x: reserved.inputHistory.main.box.w * 0.3,
        //       y: reserved.inputHistory.main.box.h * 0.51,
        //       w: reserved.inputHistory.main.box.w * 0.7,
        //       h: reserved.inputHistory.main.box.h * 0.49
        //     },
        //     scroll: {}
        //   }
        //   initGeneralHistory()
        //   initLocalHistory()
        // }
        // function initOnlineOperator () {
        //   reserved.onlineOperator.main.g.attr('transform', 'translate(' + reserved.onlineOperator.main.box.x + ',' + reserved.onlineOperator.main.box.y + ')')
        //   reserved.onlineOperator.main.g.append('text')
        //     .text('Operators online :')
        //     .attr('x', 2)
        //     .attr('y', 0 - reserved.onlineOperator.main.box.h * 0.03)
        //     .style('fill', color_theme.medium.text)
        //     .style('font-weight', '')
        //     .style('font-size', '8px')
        //     .attr('text-anchor', 'start')
        //   reserved.onlineOperator.main.g.append('line')
        //     .attr('x1', 2)
        //     .attr('y1', 0 - reserved.onlineOperator.main.box.h * 0.02)
        //     .attr('x2', reserved.onlineOperator.main.box.w * 0.9)
        //     .attr('y2', 0 - reserved.onlineOperator.main.box.h * 0.02)
        //     .attr('stroke-width', 0.4)
        //     .attr('stroke', color_theme.medium.stroke)
        //
        //   let op = reserved.onlineOperator.main.g.selectAll('g.operators')
        //     .data([{icon: 'A', name: 'Anna'}, {icon: 'B', name: 'Bob'}, {icon: 'C', name: 'Connor'}])
        //   let opEnter = op.enter()
        //     .append('g')
        //     .attr('class', 'operators')
        //     .attr('transform', function (d, i) {
        //       let tx = reserved.onlineOperator.main.box.w * 0.1
        //       let ty = 0 + reserved.onlineOperator.main.box.w * 0.25 * (i)
        //       return 'translate(' + tx + ',' + ty + ')'
        //     })
        //   opEnter.each(function (d) {
        //     d3.select(this).append('rect')
        //       .attr('x', 0)
        //       .attr('y', 0)
        //       .attr('width', reserved.onlineOperator.main.box.w * 0.2)
        //       .attr('height', reserved.onlineOperator.main.box.w * 0.2)
        //       .attr('stroke', '#000000')
        //       .attr('stroke-width', 0.2)
        //       .attr('fill', color_theme.dark.background)
        //     d3.select(this).append('text')
        //       .text(d.icon)
        //       .attr('x', reserved.onlineOperator.main.box.w * 0.1)
        //       .attr('y', reserved.onlineOperator.main.box.w * 0.1)
        //       .attr('dy', 3)
        //       .style('fill', color_theme.medium.text)
        //       .style('font-weight', '')
        //       .style('font-size', '9px')
        //       .attr('text-anchor', 'middle')
        //     d3.select(this).append('text')
        //       .text(d.name)
        //       .attr('x', reserved.onlineOperator.main.box.w * 0.3)
        //       .attr('y', reserved.onlineOperator.main.box.w * 0.1)
        //       .attr('dy', 3)
        //       .style('fill', color_theme.medium.text)
        //       .style('font-weight', '')
        //       .style('font-size', '9px')
        //       .attr('text-anchor', 'start')
        //   })
        // }
        // function initFocusedItemHeader () {
        //   reserved.focusedItemHeader.main.g.append('text')
        //     .text('No element on focus')
        //     .style('fill', color_theme.medium.text)
        //     .style('font-weight', '')
        //     .style('font-size', '14px')
        //     .attr('text-anchor', 'middle')
        //     .attr('transform', 'translate(' +
        //       (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.5) +
        //       ',' +
        //       (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.6) + ')')
        //   reserved.focusedItemHeader.main.g.append('text')
        //     .text('X')
        //     .style('fill', color_theme.medium.text)
        //     .style('font-weight', 'bold')
        //     .style('font-size', '14px')
        //     .attr('text-anchor', 'middle')
        //     .attr('transform', 'translate(' +
        //       (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.15) +
        //       ',' +
        //       (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.9) + ')')
        //   reserved.focusedItemHeader.main.g.append('text')
        //     .text('X')
        //     .style('fill', color_theme.medium.text)
        //     .style('font-weight', 'bold')
        //     .style('font-size', '14px')
        //     .attr('text-anchor', 'middle')
        //     .attr('transform', 'translate(' +
        //       (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.85) +
        //       ',' +
        //       (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.9) + ')')
        // }
        // function initFocusedItem_info () {
        //   function initFocusPreview () {
        //     reserved.focusedItem_info.preview.g.append('rect')
        //       .attr('x', reserved.focusedItem_info.preview.box.x)
        //       .attr('y', reserved.focusedItem_info.preview.box.y + reserved.focusedItem_info.preview.box.h * 0.0)
        //       .attr('width', reserved.focusedItem_info.preview.box.h * 1)
        //       .attr('height', reserved.focusedItem_info.preview.box.h * 1)
        //       .attr('fill', color_theme.medium.background)
        //       .attr('stroke', color_theme.dark.stroke)
        //       .attr('stroke-width', 1.5)
        //     reserved.focusedItem_info.preview.g = reserved.focusedItem_info.preview.g.append('g')
        //     reserved.focusedItem_info.preview.g.append('text')
        //       .text('Preview')
        //       .style('fill', color_theme.medium.text)
        //       .style('font-weight', '')
        //       .style('font-size', '9px')
        //       .attr('text-anchor', 'middle')
        //       .attr('transform', 'translate(' +
        //         (reserved.focusedItem_info.preview.box.x + reserved.focusedItem_info.preview.box.w * 0.5) +
        //         ',' +
        //         (reserved.focusedItem_info.preview.box.y + reserved.focusedItem_info.preview.box.h * 0.25) + ')')
        //     reserved.focusedItem_info.preview.g.append('text')
        //       .text('of')
        //       .style('fill', color_theme.medium.text)
        //       .style('font-weight', '')
        //       .style('font-size', '9px')
        //       .attr('text-anchor', 'middle')
        //       .attr('transform', 'translate(' +
        //         (reserved.focusedItem_info.preview.box.x + reserved.focusedItem_info.preview.box.w * 0.5) +
        //         ',' +
        //         (reserved.focusedItem_info.preview.box.y + reserved.focusedItem_info.preview.box.h * 0.4) + ')')
        //     reserved.focusedItem_info.preview.g.append('text')
        //       .text('Block /')
        //       .style('fill', color_theme.medium.text)
        //       .style('font-weight', '')
        //       .style('font-size', '9px')
        //       .attr('text-anchor', 'middle')
        //       .attr('transform', 'translate(' +
        //         (reserved.focusedItem_info.preview.box.x + reserved.focusedItem_info.preview.box.w * 0.5) +
        //         ',' +
        //         (reserved.focusedItem_info.preview.box.y + reserved.focusedItem_info.preview.box.h * 0.55) + ')')
        //     reserved.focusedItem_info.preview.g.append('text')
        //       .text('Telescope /')
        //       .style('fill', color_theme.medium.text)
        //       .style('font-weight', '')
        //       .style('font-size', '9px')
        //       .attr('text-anchor', 'middle')
        //       .attr('transform', 'translate(' +
        //         (reserved.focusedItem_info.preview.box.x + reserved.focusedItem_info.preview.box.w * 0.5) +
        //         ',' +
        //         (reserved.focusedItem_info.preview.box.y + reserved.focusedItem_info.preview.box.h * 0.7) + ')')
        //     reserved.focusedItem_info.preview.g.append('text')
        //       .text('...')
        //       .style('fill', color_theme.medium.text)
        //       .style('font-weight', '')
        //       .style('font-size', '9px')
        //       .attr('text-anchor', 'middle')
        //       .attr('transform', 'translate(' +
        //         (reserved.focusedItem_info.preview.box.x + reserved.focusedItem_info.preview.box.w * 0.5) +
        //         ',' +
        //         (reserved.focusedItem_info.preview.box.y + reserved.focusedItem_info.preview.box.h * 0.85) + ')')
        //   }
        //   function initFocusFields () {
        //     reserved.focusedItem_info.fields.scroll.scrollBoxG = reserved.focusedItem_info.fields.g.append('g')
        //     let historyBox = reserved.focusedItem_info.fields.box
        //     reserved.focusedItem_info.fields.scroll.scrollBoxG.append('rect')
        //       .attr('x', historyBox.x)
        //       .attr('y', historyBox.y)
        //       .attr('width', historyBox.w)
        //       .attr('height', historyBox.h)
        //       .attr('fill', color_theme.dark.background)
        //       .attr('stroke', color_theme.dark.stroke)
        //       .attr('stroke-width', 0.2)
        //
        //     reserved.focusedItem_info.fields.scroll.scrollBox = new ScrollBox()
        //     reserved.focusedItem_info.fields.scroll.scrollBox.init({
        //       tag: 'inputHistoryScrollBox',
        //       g_box: reserved.focusedItem_info.fields.scroll.scrollBoxG,
        //       box_data: {
        //         x: historyBox.x,
        //         y: historyBox.y,
        //         w: historyBox.w,
        //         h: historyBox.h,
        //         marg: 0
        //       },
        //       use_relative_coords: true,
        //       locker: new Locker(),
        //       lockers: [widget_id + 'update_data'],
        //       lock_zoom: {
        //         all: 'ScrollBox' + 'zoom',
        //         during: 'ScrollBox' + 'zoom_during',
        //         end: 'ScrollBox' + 'zoom_end'
        //       },
        //       run_loop: new RunLoop({tag: 'inputHistoryScrollBox'}),
        //       can_scroll: true,
        //       scrollVertical: true,
        //       scroll_horizontal: false,
        //       scroll_height: 0.1 + historyBox.h,
        //       scroll_width: 0,
        //       background: 'transparent',
        //       scroll_rec_h: {h: 6},
        //       scroll_recs: {w: 6}
        //     })
        //     reserved.focusedItem_info.info.scroll.scrollG = reserved.focusedItem_info.fields.scroll.scrollBox.get('inner_g')
        //
        //     let dimField = {
        //       w: reserved.focusedItem_info.fields.box.w,
        //       h: reserved.focusedItem_info.fields.box.h * 0.1,
        //       margW: 0, // reserved.focusedItem_info.focusFields.box.w * 0.04,
        //       margH: 0 // reserved.focusedItem_info.focusFields.box.h * 0.04
        //     }
        //     let fields = reserved.focusedItem_info.info.g.selectAll('g.fields')
        //       .data([{name: 'A'}, {name: 'B'}, {name: 'C'}, {name: 'D'}, {name: 'E'}, {name: 'F'}, {name: 'G'}, {name: 'H'}])
        //     let fieldsEnter = fields.enter()
        //       .append('g')
        //       .attr('class', 'fields')
        //       .attr('transform', function (d, i) {
        //         let tx = reserved.focusedItem_info.info.box.x + dimField.margW * ((i % 4) + 1) + (dimField.w * (i % 4))
        //         let ty = reserved.focusedItem_info.info.box.y + dimField.margH * (parseInt(i / 4) + 1) + (dimField.h * parseInt(i / 4))
        //         return 'translate(' + tx + ',' + ty + ')'
        //       })
        //     fieldsEnter.each(function (d) {
        //       d3.select(this).append('rect')
        //         .attr('x', 0)
        //         .attr('y', 0)
        //         .attr('width', dimField.w)
        //         .attr('height', dimField.h)
        //         .attr('stroke', '#000000')
        //         .attr('stroke-width', 0.2)
        //         .attr('fill', color_theme.dark.background)
        //       // d3.select(this).append('text')
        //       //   .text(d.name)
        //       //   .attr('x', 0)
        //       //   .attr('y', 2)
        //       //   .style('fill', color_theme.medium.text)
        //       //   .style('font-weight', '')
        //       //   .style('font-size', '7px')
        //       //   .attr('text-anchor', 'middle')
        //     })
        //   }
        //   function initFocus_info () {
        //     reserved.focusedItem_info.info.scroll.scrollBoxG = reserved.focusedItem_info.info.g.append('g')
        //     reserved.focusedItem_info.info.scroll.scrollBoxG.append('rect')
        //       .attr('x', reserved.focusedItem_info.info.box.x)
        //       .attr('y', reserved.focusedItem_info.info.box.y)
        //       .attr('width', reserved.focusedItem_info.info.box.w)
        //       .attr('height', reserved.focusedItem_info.info.box.h)
        //       .attr('fill', color_theme.dark.background)
        //       .attr('stroke', color_theme.dark.stroke)
        //       .attr('stroke-width', 0.2)
        //
        //     let historyBox = reserved.focusedItem_info.info.box
        //     reserved.focusedItem_info.info.scroll.scrollBoxG.append('rect')
        //       .attr('x', historyBox.x)
        //       .attr('y', historyBox.y)
        //       .attr('width', historyBox.w)
        //       .attr('height', historyBox.h)
        //       .attr('fill', color_theme.dark.background)
        //       .attr('stroke', color_theme.dark.stroke)
        //       .attr('stroke-width', 0.2)
        //
        //     reserved.focusedItem_info.info.scroll.scrollBox = new ScrollBox()
        //     reserved.focusedItem_info.info.scroll.scrollBox.init({
        //       tag: 'inputHistoryScrollBox',
        //       g_box: reserved.focusedItem_info.info.scroll.scrollBoxG,
        //       box_data: {
        //         x: historyBox.x,
        //         y: historyBox.y,
        //         w: historyBox.w,
        //         h: historyBox.h,
        //         marg: 0
        //       },
        //       use_relative_coords: true,
        //       locker: new Locker(),
        //       lockers: [widget_id + 'update_data'],
        //       lock_zoom: {
        //         all: 'ScrollBox' + 'zoom',
        //         during: 'ScrollBox' + 'zoom_during',
        //         end: 'ScrollBox' + 'zoom_end'
        //       },
        //       run_loop: new RunLoop({tag: 'inputHistoryScrollBox'}),
        //       can_scroll: true,
        //       scrollVertical: true,
        //       scroll_horizontal: false,
        //       scroll_height: 0.1 + historyBox.h,
        //       scroll_width: 0,
        //       background: 'transparent',
        //       scroll_rec_h: {h: 6},
        //       scroll_recs: {w: 6}
        //     })
        //     reserved.focusedItem_info.info.scroll.scrollG = reserved.focusedItem_info.info.scroll.scrollBox.get('inner_g')
        //   }
        //   reserved.focusedItem_info.main.g.attr('transform', 'translate(' + reserved.focusedItem_info.main.box.x + ',' + reserved.focusedItem_info.main.box.y + ')')
        //   reserved.focusedItem_info.preview = {
        //     g: reserved.focusedItem_info.main.g.append('g'),
        //     box: {
        //       x: 0,
        //       y: 0,
        //       w: reserved.focusedItem_info.main.box.h * 0.325,
        //       h: reserved.focusedItem_info.main.box.h * 0.325
        //     }
        //   }
        //   reserved.focusedItem_info.fields = {
        //     g: reserved.focusedItem_info.main.g.append('g'),
        //     box: {
        //       x: 0,
        //       y: 0 + reserved.focusedItem_info.main.box.h * 0.35,
        //       w: reserved.focusedItem_info.main.box.h * 0.325,
        //       h: reserved.focusedItem_info.main.box.h * 0.65
        //     },
        //     scroll: {}
        //   }
        //   reserved.focusedItem_info.info = {
        //     g: reserved.focusedItem_info.main.g.append('g'),
        //     box: {
        //       x: 0 + reserved.focusedItem_info.main.box.h * 0.35,
        //       y: 0,
        //       w: reserved.focusedItem_info.main.box.w - (reserved.focusedItem_info.main.box.h * 0.35),
        //       h: reserved.focusedItem_info.main.box.h
        //     },
        //     scroll: {}
        //   }
        //   initFocusPreview()
        //   initFocusFields()
        //   initFocus_info()
        // }
        // function initTextInput () {
        //   reserved.textInput.main.g.append('rect')
        //     .attr('x', reserved.textInput.main.box.x)
        //     .attr('y', reserved.textInput.main.box.y)
        //     .attr('width', reserved.textInput.main.box.w)
        //     .attr('height', reserved.textInput.main.box.h)
        //     .attr('fill', color_theme.dark.background)
        //     .attr('stroke', color_theme.dark.stroke)
        //     .attr('stroke-width', 0.2)
        // }
        function init_assoc_ele() {
            reserved.assoc_ele.g.attr(
                'transform',
                'translate('
          + reserved.assoc_ele.box.x
          + ','
          + reserved.assoc_ele.box.y
          + ')'
            )

            reserved.assoc_ele.g
                .append('rect')
                .attr('x', reserved.assoc_ele.box.w * 0.0)
                .attr('y', reserved.assoc_ele.box.h * 0.0)
                .attr('width', reserved.assoc_ele.box.w * 1.0)
                .attr('height', reserved.assoc_ele.box.h * 1.0)
                .attr('fill', color_theme.dark.background)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0)
                .attr('opacity', 1)
                .on('mouseover', function() {
                    // d3.select(this).transition().duration(times.anim).attr('opacity', 1)
                })
                .on('mouseout', function() {
                    // d3.select(this).transition().duration(times.anim).attr('opacity', 0)
                })

            reserved.assoc_ele.g
                .append('text')
                .text('Associated elements')
                .attr('x', reserved.assoc_ele.box.w * 0.5)
                .attr('y', 10)
                .style('fill', color_theme.medium.text)
                .style('font-weight', '')
                .style('font-size', '9px')
                .attr('text-anchor', 'middle')

            reserved.assoc_ele.blocks.icon = reserved.assoc_ele.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + reserved.assoc_ele.box.w * 0.8
            + ','
            + reserved.assoc_ele.box.h * 0.2
            + ')'
                )
            reserved.assoc_ele.blocks.icon
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', reserved.assoc_ele.box.w * 0.11)
                .attr('height', reserved.assoc_ele.box.w * 0.1)
                .attr('fill', color_theme.dark.background)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.2)
                .attr('opacity', 0)
                .on('mouseover', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('opacity', 1)
                })
                .on('mouseout', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('opacity', 0)
                })
            reserved.assoc_ele.blocks.icon
                .append('svg:image')
                .attr('xlink:href', '/static/icons/blocks.svg')
                .attr('width', reserved.assoc_ele.box.w * 0.075)
                .attr('height', reserved.assoc_ele.box.w * 0.075)
                .attr('x', reserved.assoc_ele.box.w * 0.01)
                .attr('y', reserved.assoc_ele.box.h * 0.01)
                .style('pointer-events', 'none')
            // reserved.assoc_ele.blocks.icon.append('text')
            //   .text('+')
            //   .style('font-size', '11px')
            //   .attr('x', reserved.assoc_ele.box.w * 0.075)
            //   .attr('y', reserved.assoc_ele.box.h * 0.145)
            //   .style('pointer-events', 'none')
            //   .style('pointer-events', 'none')

            reserved.assoc_ele.events.icon = reserved.assoc_ele.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + reserved.assoc_ele.box.w * 0.8
            + ','
            + reserved.assoc_ele.box.h * 0.45
            + ')'
                )
            reserved.assoc_ele.events.icon
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', reserved.assoc_ele.box.w * 0.11)
                .attr('height', reserved.assoc_ele.box.w * 0.1)
                .attr('fill', color_theme.dark.background)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.2)
                .attr('opacity', 0)
                .on('mouseover', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('opacity', 1)
                })
                .on('mouseout', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('opacity', 0)
                })
            reserved.assoc_ele.events.icon
                .append('svg:image')
                .attr('xlink:href', '/static/icons/warning.svg')
                .attr('width', reserved.assoc_ele.box.w * 0.08)
                .attr('height', reserved.assoc_ele.box.w * 0.08)
                .attr('x', reserved.assoc_ele.box.w * 0.01)
                .attr('y', reserved.assoc_ele.box.h * 0.01)
                .style('pointer-events', 'none')
            // reserved.assoc_ele.events.icon.append('text')
            //   .text('+')
            //   .style('font-size', '11px')
            //   .attr('x', reserved.assoc_ele.box.w * 0.075)
            //   .attr('y', reserved.assoc_ele.box.h * 0.145)
            //   .style('pointer-events', 'none')

            reserved.assoc_ele.tels.icon = reserved.assoc_ele.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + reserved.assoc_ele.box.w * 0.8
            + ','
            + reserved.assoc_ele.box.h * 0.7
            + ')'
                )
            reserved.assoc_ele.tels.icon
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', reserved.assoc_ele.box.w * 0.11)
                .attr('height', reserved.assoc_ele.box.w * 0.1)
                .attr('fill', color_theme.dark.background)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.2)
                .attr('opacity', 0)
                .on('mouseover', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('opacity', 1)
                })
                .on('mouseout', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('opacity', 0)
                })
            reserved.assoc_ele.tels.icon
                .append('svg:image')
                .attr('xlink:href', '/static/icons/telescope.svg')
                .attr('width', reserved.assoc_ele.box.w * 0.1)
                .attr('height', reserved.assoc_ele.box.w * 0.09)
                .attr('x', reserved.assoc_ele.box.w * 0.0)
                .attr('y', reserved.assoc_ele.box.h * 0.005)
                .style('pointer-events', 'none')
            // reserved.assoc_ele.tels.icon.append('text')
            //   .text('+')
            //   .style('font-size', '11px')
            //   .attr('x', reserved.assoc_ele.box.w * 0.075)
            //   .attr('y', reserved.assoc_ele.box.h * 0.145)
            //   .style('pointer-events', 'none')
            //   .style('pointer-events', 'none')
        }

        function initLog_info() {
            reserved.log_info.g.attr(
                'transform',
                'translate('
          + reserved.log_info.box.x
          + ','
          + reserved.log_info.box.y
          + ')'
            )

            function initScrollBox() {
                reserved.log_info.scroll = {
                }
                reserved.log_info.scroll.scrollBoxG = reserved.log_info.g.append('g')
                let box = {
                    x: reserved.log_info.box.w * 0.05,
                    y: reserved.log_info.box.h * 0.12,
                    w: reserved.log_info.box.w * 0.9,
                    h: reserved.log_info.box.h * 0.88,
                }

                reserved.log_info.scroll.scrollBoxG
                    .append('rect')
                    .attr('x', box.x - 1)
                    .attr('y', box.y - 1)
                    .attr('width', box.w + 2)
                    .attr('height', box.h + 2)
                    .attr('fill', 'none')
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-dasharray', [
                        box.w + 2 + 2,
                        box.h - 2,
                        box.w + 2 + 2 + 2,
                        box.h - 2,
                    ])
                    .attr('stroke-width', 0.6)

                reserved.log_info.scroll.scrollBox = new ScrollBox()
                reserved.log_info.scroll.scrollBox.init({
                    tag: 'log_infoScrollBox',
                    g_box: reserved.log_info.scroll.scrollBoxG,
                    box_data: {
                        x: box.x,
                        y: box.y,
                        w: box.w,
                        h: box.h,
                        marg: 0,
                    },
                    use_relative_coords: true,
                    locker: new Locker(),
                    lockers: [ widget_id + 'update_data' ],
                    lock_zoom: {
                        all: 'log_infoBox' + 'zoom',
                        during: 'log_infoBox' + 'zoom_during',
                        end: 'log_infoBox' + 'zoom_end',
                    },
                    run_loop: new RunLoop({
                        tag: 'log_infoScrollBox',
                    }),
                    can_scroll: true,
                    scrollVertical: true,
                    scroll_horizontal: false,
                    scroll_height: 0,
                    scroll_width: 0,
                    background: 'transparent',
                    scroll_rec_h: {
                        h: 0,
                    },
                    scroll_recs: {
                        w: 0,
                    },
                })
                reserved.log_info.scroll.scrollG = reserved.log_info.scroll.scrollBox.get(
                    'inner_g'
                )
            }

            // reserved.log_info.g.append('rect')
            //   .attr('x', reserved.log_info.box.w * 0.0)
            //   .attr('y', reserved.log_info.box.h * 0.0)
            //   .attr('width', reserved.log_info.box.w * 1.0)
            //   .attr('height', reserved.log_info.box.h * 1.0)
            //   .attr('fill', color_theme.dark.background)
            //   .attr('stroke', color_theme.dark.stroke)
            //   .attr('stroke-width', 0)
            //   .attr('opacity', 1)
            //   .on('mouseover', function () {
            //     // d3.select(this).transition().duration(times.anim).attr('opacity', 1)
            //   })
            //   .on('mouseout', function () {
            //     // d3.select(this).transition().duration(times.anim).attr('opacity', 0)
            //   })
            reserved.log_info.g
                .append('text')
                .text('Log information')
                .attr('x', reserved.log_info.box.w * 0.5)
                .attr('y', 10)
                .style('fill', color_theme.medium.text)
                .style('font-weight', '')
                .style('font-size', '9px')
                .attr('text-anchor', 'middle')
            initScrollBox()
        }
        function updateLog_info(log) {
            function wrap(self, width) {
                let textLength = self.node().getComputedTextLength()
                let text = self.text()
                while (textLength > width && text.length > 0) {
                    text = text.slice(0, -1)
                    self.text(text)
                    textLength = self.node().getComputedTextLength()
                }
            }

            reserved.log_info.g
                .select('text')
                .text('Log information: ' + log.info.length)

            let ib = {
                x: reserved.log_info.box.w * 0.05,
                y: 0,
                w: reserved.log_info.box.w * 0.9,
                h: reserved.log_info.box.h * 0.35,
            }
            let current = reserved.log_info.scroll.scrollG
                .selectAll('g.log_info')
                .data(log.info)
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'log_info')
            enter.each(function(d, i) {
                let g = d3.select(this)
                g.attr('transform', function() {
                    let tx = 0
                    let ty = i * reserved.log_info.box.h * 0.31
                    return 'translate(' + tx + ',' + ty + ')'
                })

                g
                    .append('rect')
                    .attr('x', 1)
                    .attr('y', 1)
                    .attr('width', ib.w - 2)
                    .attr('height', reserved.log_info.box.h * 0.3 - 2)
                    .attr('fill', color_theme.medium.background)
                    .attr('stroke', color_theme.medium.stroke)
                    .attr('stroke-width', 0.4)
                g
                    .append('text')
                    .text('Action: ' + d.action)
                    .attr('x', reserved.log_info.box.w * 0.05)
                    .attr('y', ib.h * 0.25)
                    .style('fill', color_theme.medium.text)
                    .style('font-weight', '')
                    .style('font-size', '8px')
                    .attr('text-anchor', 'start')
                g
                    .append('text')
                    .text('By: ' + d.author)
                    .attr('x', reserved.log_info.box.w * 0.12)
                    .attr('y', ib.h * 0.5)
                    .style('fill', color_theme.medium.text)
                    .style('font-weight', '')
                    .style('font-size', '8px')
                    .attr('text-anchor', 'start')
                g
                    .append('text')
                    .text('On: ' + d.date)
                    .attr('x', reserved.log_info.box.w * 0.12)
                    .attr('y', ib.h * 0.75)
                    .style('fill', color_theme.medium.text)
                    .style('font-weight', '')
                    .style('font-size', '8px')
                    .attr('text-anchor', 'start')
            })

            let merge = current.merge(enter)
            merge.each(function(d, i) {
                let g = d3.select(this)
                g.attr('transform', function() {
                    let tx = 0
                    let ty = i * reserved.log_info.box.h * 0.31
                    return 'translate(' + tx + ',' + ty + ')'
                })
            })

            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()

            reserved.log_info.scroll.scrollBox.reset_vertical_scroller({
                can_scroll: true,
                scroll_height: log.info.length * reserved.log_info.box.h * 0.31,
            })
        }

        function initLogFields() {
            reserved.logFields.g.attr(
                'transform',
                'translate('
          + reserved.logFields.box.x
          + ','
          + reserved.logFields.box.y
          + ')'
            )

            function initTitle() {
                reserved.logFields.title.g = reserved.logFields.g.append('g')
                reserved.logFields.title.g.attr(
                    'transform',
                    'translate('
            + reserved.logFields.title.box.x
            + ','
            + reserved.logFields.title.box.y
            + ')'
                )

                reserved.logFields.title.g
                    .append('rect')
                    .attr('x', reserved.logFields.title.box.w * 0.025)
                    .attr('y', reserved.logFields.title.box.h * 0.25)
                    .attr('width', reserved.logFields.title.box.w * 0.95)
                    .attr('height', reserved.logFields.title.box.h * 0.8)
                    .attr('fill', color_theme.dark.background)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0)
                    .attr('opacity', 1)
                    .on('mouseover', function() {
                        // d3.select(this).transition().duration(times.anim).attr('opacity', 1)
                    })
                    .on('mouseout', function() {
                        // d3.select(this).transition().duration(times.anim).attr('opacity', 0)
                    })
                reserved.logFields.title.g
                    .append('text')
                    .text('Log ID')
                    .attr('x', reserved.logFields.title.box.w * 0.5)
                    .attr('y', reserved.logFields.title.box.h * 0.65)
                    .style('fill', color_theme.medium.text)
                    .style('font-weight', '')
                    .style('font-size', '9px')
                    .attr('text-anchor', 'middle')

                // reserved.logFields.title.g.append('rect')
                //   .attr('x', reserved.logFields.title.box.w * 0.515)
                //   .attr('y', reserved.logFields.title.box.h * 0.25)
                //   .attr('width', reserved.logFields.title.box.w * 0.47)
                //   .attr('height', reserved.logFields.title.box.h * 0.8)
                //   .attr('fill', color_theme.dark.background)
                //   .attr('stroke', color_theme.dark.stroke)
                //   .attr('stroke-width', 0)
                //   .attr('opacity', 1)
                //   .on('mouseover', function () {
                //     // d3.select(this).transition().duration(times.anim).attr('opacity', 1)
                //   })
                //   .on('mouseout', function () {
                //     // d3.select(this).transition().duration(times.anim).attr('opacity', 0)
                //   })
                // reserved.logFields.title.g.append('text')
                //   .text('Log ID')
                //   .attr('x', (reserved.logFields.title.box.w * 0.7))
                //   .attr('y', reserved.logFields.title.box.h * 0.65)
                //   .style('fill', color_theme.medium.text)
                //   .style('font-weight', '')
                //   .style('font-size', '9px')
                //   .attr('text-anchor', 'middle')
            }
            initTitle()

            function initHeader() {
                reserved.logFields.header.g = reserved.logFields.g.append('g')
                reserved.logFields.header.g.attr(
                    'transform',
                    'translate('
            + reserved.logFields.header.box.x
            + ','
            + reserved.logFields.header.box.y
            + ')'
                )

                reserved.logFields.header.g
                    .append('rect')
                    .attr('x', reserved.logFields.header.box.w * 0.1)
                    .attr('y', 10)
                    .attr('width', reserved.logFields.header.box.w * 0.8)
                    .attr('height', 15)
                    .attr('fill', color_theme.dark.background)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0)
                    .attr('opacity', 1)
                    .on('mouseover', function() {
                        // d3.select(this).transition().duration(times.anim).attr('opacity', 1)
                    })
                    .on('mouseout', function() {
                        // d3.select(this).transition().duration(times.anim).attr('opacity', 0)
                    })
                reserved.logFields.header.g
                    .append('text')
                    .attr('id', 'title')
                    .text('Title')
                    .attr('x', reserved.logFields.header.box.w * 0.15)
                    .attr('y', 20)
                    .style('fill', color_theme.medium.text)
                    .style('font-weight', '')
                    .style('font-size', '9px')
                    .attr('text-anchor', 'start')

                reserved.logFields.header.g
                    .append('rect')
                    .attr('x', reserved.logFields.header.box.w * 0.1)
                    .attr('y', 10 + 20)
                    .attr('width', reserved.logFields.header.box.w * 0.8)
                    .attr('height', 15)
                    .attr('fill', color_theme.dark.background)
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0)
                    .attr('opacity', 1)
                    .on('mouseover', function() {
                        // d3.select(this).transition().duration(times.anim).attr('opacity', 1)
                    })
                    .on('mouseout', function() {
                        // d3.select(this).transition().duration(times.anim).attr('opacity', 0)
                    })
                reserved.logFields.header.g
                    .append('text')
                    .attr('id', 'category')
                    .text('Categories')
                    .attr('x', reserved.logFields.header.box.w * 0.15)
                    .attr('y', 40)
                    .style('fill', color_theme.medium.text)
                    .style('font-weight', '')
                    .style('font-size', '9px')
                    .attr('text-anchor', 'start')
            }
            initHeader()

            function initText() {
                reserved.logFields.text.g = reserved.logFields.g.append('g')
                reserved.logFields.text.g.attr(
                    'transform',
                    'translate('
            + reserved.logFields.text.box.x
            + ','
            + reserved.logFields.text.box.y
            + ')'
                )

                let fo = reserved.logFields.text.g
                    .append('foreignObject')
                    .attr('x', reserved.logFields.text.box.w * 0.05)
                    .attr('y', 10)
                    .attr('width', reserved.logFields.text.box.w * 0.9)
                    .attr('height', reserved.logFields.text.box.h - 15)
                let root_div = fo
                    .append('xhtml:div')
                    .style('display', 'block')
                    .style('border', 'none')
                    .style('width', '100%')
                    .style('height', '100%')
                root_div
                    .append('textArea')
                    .style('width', '100%')
                    .style('height', '100%')
                    .style('font-size', '9px')
                    .style('resize', 'none')
                    .style('border-style', 'solid')
                    .style('border-width', '1px 1px 1px 1x')
                    .style('background-color', color_theme.medium.background)
                    .attr('placeholder', 'Log information')

                // reserved.logFields.text.g.append('rect')
                //   .attr('x', reserved.logFields.text.box.w * 0.05)
                //   .attr('y', 10)
                //   .attr('width', reserved.logFields.text.box.w * 0.9)
                //   .attr('height', reserved.logFields.text.box.h - 15)
                //   .attr('fill', color_theme.dark.background)
                //   .attr('stroke', color_theme.dark.stroke)
                //   .attr('stroke-width', 0)
                //   .attr('opacity', 1)
                //   .on('mouseover', function () {
                //     // d3.select(this).transition().duration(times.anim).attr('opacity', 1)
                //   })
                //   .on('mouseout', function () {
                //     // d3.select(this).transition().duration(times.anim).attr('opacity', 0)
                //   })
                // reserved.logFields.text.g.append('text')
                //   .text('_information')
                //   .attr('x', reserved.logFields.text.box.w * 0.1)
                //   .attr('y', 20)
                //   .style('fill', color_theme.medium.text)
                //   .style('font-weight', '')
                //   .style('font-size', '9px')
                //   .attr('text-anchor', 'start')
            }
            initText()
        }
        function updateLogFields(log) {
            reserved.logFields.title.g.select('text').text(log.id)
            reserved.logFields.header.g.select('#title').text(log.name)
            reserved.logFields.header.g.select('#category').text(log.categories[0])
            reserved.logFields.text.g.select('textArea').text(log.description)
        }

        function initLogHistory() {
            let filterTemplate = {
                id: 'include',
                name: 'include',
                description: 'include',
                categories: 'equal',
                info: {
                    author: 'equal',
                    date: 'equal+',
                },
                linkedTo: 'equal',
                modifications: {
                    author: 'equal',
                    date: 'equal+',
                    field: 'equal',
                },
            }
            let filters = []
            let b = reserved.logHistory.box

            reserved.logHistory.outer_box = {
                x: 0,
                y: 0,
                w: b.w,
                h: 15,
            }
            let ob = reserved.logHistory.outer_box
            reserved.logHistory.innerBoxFilter = {
                x: 2,
                y: 2,
                w: ob.w - 4,
                h: ob.h - 4,
            }
            reserved.logHistory.innerBoxLog = {
                x: 0,
                y: 2,
                w: ob.w,
                h: ob.h - 4,
            }

            let fb = {
                x: b.x,
                y: b.y,
                w: b.w,
                h: ob.h * (filters.length + 2),
            }
            let lb = {
                x: b.x,
                y: ob.h * 6,
                w: b.w,
                h: b.h - ob.h * 4,
            }

            function filterLogs() {
                function checkFilter(filt, data) {
                    let str = filt.split(':')
                    let keys = str[0].split('.')
                    let value = str[1]

                    let target = data
                    for (let i = 0; i < keys.length; i++) {
                        target = target[keys[i]]
                    }

                    if (Array.isArray(target)) {
                        if (target.indexOf(value) !== -1) {
                            return true
                        }
                    }
                    else if (target === value) {
                        return true
                    }
                    return false
                }
                let filtered = []
                for (let i = 0; i < shared.data.server.logs.length; i++) {
                    let insert = true
                    for (
                        let j = 0;
                        j < reserved.logHistory.filtering.filters.length;
                        j++
                    ) {
                        if (
                            !checkFilter(
                                reserved.logHistory.filtering.filters[j],
                                shared.data.server.logs[i]
                            )
                        ) {
                            insert = false
                        }
                    }
                    if (insert) {
                        filtered.push(shared.data.server.logs[i])
                    }
                }
                return filtered
            }
            function updateFilters() {
                let ib = reserved.logHistory.innerBoxFilter
                let current = reserved.logHistory.filtering.scroll.scrollG
                    .selectAll('g.filter')
                    .data(reserved.logHistory.filtering.filters)
                let enter = current
                    .enter()
                    .append('g')
                    .attr('class', 'filter')
                enter.each(function(d, i) {
                    let g = d3.select(this)
                    g.attr('transform', function() {
                        let tx = 0
                        let ty = i * ob.h
                        return 'translate(' + tx + ',' + ty + ')'
                    })

                    g
                        .append('rect')
                        .attr('x', function(d) {
                            return ib.x + ib.w * 0.05
                        })
                        .attr('y', function(d) {
                            return ib.y
                        })
                        .attr('width', function(d) {
                            return ib.w * 0.1
                        })
                        .attr('height', function(d) {
                            return ib.h
                        })
                        .attr('fill', function(d) {
                            return color_theme.darker.background
                        })
                        .attr('stroke', 'none')
                    let back = g
                        .append('rect')
                        .attr('width', ib.w * 0.65 + 'px')
                        .attr('height', ib.h + 'px')
                        .attr('x', ib.x + ib.w * 0.15 + 'px')
                        .attr('y', ib.y + 'px')
                        .attr('fill', 'none')
                        .attr('stroke', color_theme.dark.stroke)
                        .attr('stroke-width', 0.2)
                    let buttonDel = g
                        .append('rect')
                        .attr('x', ib.x + ib.w * 0.8)
                        .attr('y', ib.y)
                        .attr('width', ib.w * 0.1)
                        .attr('height', ib.h)
                        .attr('fill', 'transparent')
                        .attr('stroke', 'none')
                        .on('mouseover', function() {
                            buttonDel.attr('fill', color_theme.darker.background)
                        })
                        .on('mouseout', function() {
                            buttonDel.attr('fill', 'transparent')
                        })
                        .on('click', function() {
                            removeFilter(d)
                            updateFilters()
                            updateLogList()
                        })
                    g
                        .append('text')
                        .text('x')
                        .attr('x', ib.x + ib.w * 0.85)
                        .attr('y', ib.y + ib.h * 0.7)
                        .style('font-size', ib.h * 0.8 + 'px')
                        .style('font-weight', 'bold')
                        .attr('text-anchor', 'middle')
                        .style('pointer-events', 'none')
                        .style('user-select', 'none')

                    let str = d.split(':')
                    let textLeft = g
                        .append('text')
                        .append('tspan')
                        .text(str[0])
                        .attr('x', ib.x + ib.w * 0.15 + ib.w * 0.3 + 'px')
                        .attr('y', ib.y + ib.h * 0.75)
                        .style('font-size', ib.h * 0.8 + 'px')
                        .style('pointer-events', 'none')
                        .attr('text-anchor', 'end')
                        .each(function() {
                            wrap(d3.select(this), ib.w * 0.3)
                        })
                    let textMiddle = g
                        .append('text')
                        .append('tspan')
                        .text(':')
                        .attr('x', ib.x + ib.w * 0.15 + ib.w * 0.325 + 'px')
                        .attr('y', ib.y + ib.h * 0.75)
                        .style('font-size', ib.h * 0.8 + 'px')
                        .style('pointer-events', 'none')
                        .attr('text-anchor', 'middle')
                        .each(function() {
                            wrap(d3.select(this), ib.w * 0.05)
                        })
                    let textRight = g
                        .append('text')
                        .append('tspan')
                        .text(str[1])
                        .attr('x', ib.x + ib.w * 0.15 + ib.w * 0.35 + 'px')
                        .attr('y', ib.y + ib.h * 0.75)
                        .style('font-size', ib.h * 0.8 + 'px')
                        .style('pointer-events', 'none')
                        .attr('text-anchor', 'start')
                        .each(function() {
                            wrap(d3.select(this), ib.w * 0.3)
                        })

                    function wrap(self, width) {
                        let textLength = self.node().getComputedTextLength()
                        let text = self.text()
                        while (textLength > width && text.length > 0) {
                            text = text.slice(0, -1)
                            self.text(text)
                            textLength = self.node().getComputedTextLength()
                        }
                    }
                })

                let merge = current.merge(enter)
                merge.each(function(d, i) {
                    let g = d3.select(this)
                    g.attr('transform', function() {
                        let tx = 0
                        let ty = i * ob.h
                        return 'translate(' + tx + ',' + ty + ')'
                    })
                })

                current
                    .exit()
                    .transition('in_out')
                    .duration(times.anim)
                    .style('opacity', 0)
                    .remove()
            }
            function addFilter(f) {
                reserved.logHistory.filtering.filters.push(f)
            }
            function removeFilter(f) {
                reserved.logHistory.filtering.filters.splice(
                    reserved.logHistory.filtering.filters.indexOf(f),
                    1
                )
            }
            function createLogFilter() {
                function createDataList(object) {
                    let dl = []
                    function rec(object, string) {
                        for (var key in object) {
                            let cpString = string + '.' + key
                            if (
                                typeof object[key] === 'string'
                || object[key] instanceof String
                            ) {
                                dl.push({
                                    key: cpString,
                                    action: object[key],
                                })
                            }
                            else {
                                dl.push({
                                    key: cpString,
                                    action: 'none',
                                })
                                rec(object[key], cpString)
                            }
                        }
                    }
                    for (var key in object) {
                        let cpString = '' + key
                        if (
                            typeof object[key] === 'string'
              || object[key] instanceof String
                        ) {
                            dl.push({
                                key: cpString,
                                action: object[key],
                            })
                        }
                        else {
                            dl.push({
                                key: cpString,
                                action: 'none',
                            })
                            rec(object[key], cpString)
                        }
                    }
                    return dl
                }
                let ib = reserved.logHistory.innerBoxFilter
                reserved.logHistory.filtering = {
                }
                reserved.logHistory.filtering.g = reserved.logHistory.g.append('g')
                reserved.logHistory.filtering.filters = filters

                let g = reserved.logHistory.filtering.g
                g.attr('transform', function() {
                    let tx = 0
                    let ty = 0
                    return 'translate(' + tx + ',' + ty + ')'
                })
                let back = g
                    .append('rect')
                    .attr('width', ib.w * 0.95 + 'px')
                    .attr('height', ib.h + 'px')
                    .attr('x', ib.x + ib.w * 0.05 + 'px')
                    .attr('y', ib.y + 'px')
                    .attr('fill', 'none')
                    .attr('stroke', color_theme.dark.stroke)
                    .attr('stroke-width', 0.2)

                let fo = g
                    .append('foreignObject')
                    .attr('width', ib.w * 0.95 + 'px')
                    .attr('height', ib.h + 'px')
                    .attr('x', ib.x + ib.w * 0.05 + 'px')
                    .attr('y', ib.y + 'px')
                let root_div = fo
                    .append('xhtml:div')
                    .style('display', 'block')
                    .style('border', 'none')
                    .style('background-color', 'transparent')
                    .style('width', '100%')
                    .style('height', '100%')

                let dl = createDataList(filterTemplate)
                let datalist = root_div.append('datalist').attr('id', 'datalist')
                datalist
                    .selectAll('option')
                    .data(dl)
                    .enter()
                    .append('option')
                    .property('value', function(d) {
                        return d.key
                    })
                let input = root_div
                    .append('input')
                    .attr('list', 'datalist')
                    .property('value', function(d) {
                        return d
                    })
                    .attr('placeholder', 'Add filter')
                    .style('width', '100%')
                    .style('height', '100%')
                    .style('padding', '0')
                    .style('vertical-align', 'top')
                    .style('border', 'none')
                    .style('background', 'transparent')
                    .style('color', color_theme.dark.text)
                    .style('font-size', ib.h * 0.8 + 'px')
                    .style('text-align', 'left')
                    .attr('type', 'list')

                input.on('focus', function() {
                    back.attr('fill', color_theme.bright.background)
                    // .attr('stroke', 'none')
                    input.style('outline', 'none')
                })
                input.on('blur', function() {
                    back.attr('fill', 'none')
                    // .attr('stroke', color_theme.dark.stroke)
                    input.style('outline', 'none')
                })
                input.on('input', function() {
                    // let str = input.property('value').split(':')
                    // if (str.length === 1) {
                    //   textLeft.text(str[0])
                    //   textMiddle.text('')
                    // } else if (str.length === 2) {
                    //   textRight.text(str[1])
                    //   textMiddle.text(':')
                    // }
                })
                input.on('change', function() {
                    let str = input.property('value').split(':')
                    if (str.length === 1) {
                        // textLeft.text(str[0])
                        // textMiddle.text(':')
                        input.property('value', input.property('value') + ':')
                    }
                    else if (str.length === 2) {
                        // textRight.text(str[1])
                        addFilter(input.property('value'))
                        updateFilters()
                        updateLogList()
                        input.property('value', '')
                    }
                })

                let button = g
                    .append('rect')
                    .attr('x', ib.x + ib.w * 0.9)
                    .attr('y', ib.y)
                    .attr('width', ib.h)
                    .attr('height', ib.h)
                    .attr('fill', 'transparent')
                    .on('mouseover', function() {
                        button.attr('fill', color_theme.darker.background)
                    })
                    .on('mouseout', function() {
                        button.attr('fill', 'transparent')
                    })
                g
                    .append('text')
                    .text('?')
                    .attr('x', ib.x + ib.w - ib.h * 0.5)
                    .attr('y', ib.y + ib.h * 0.8)
                    .style('font-size', ib.h * 0.8 + 'px')
                    .attr('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .style('user-select', 'none')

                function initScrollBox() {
                    reserved.logHistory.filtering.scroll = {
                    }
                    reserved.logHistory.filtering.scroll.scrollBoxG = reserved.logHistory.filtering.g.append(
                        'g'
                    )
                    let historyBox = {
                        x: b.x,
                        y: ob.h * 1.2,
                        w: b.w,
                        h: ob.h * 4.5,
                    }
                    // reserved.logHistory.filtering.scroll.scrollBoxG.append('rect')
                    //   .attr('x', historyBox.x)
                    //   .attr('y', historyBox.y)
                    //   .attr('width', historyBox.w)
                    //   .attr('height', historyBox.h)
                    //   .attr('fill', 'none')
                    //   .attr('stroke', color_theme.dark.stroke)
                    //   .attr('stroke-dasharray', [historyBox.w, historyBox.h, historyBox.w, historyBox.h])
                    //   .attr('stroke-width', 0.2)

                    reserved.logHistory.filtering.scroll.scrollBox = new ScrollBox()
                    reserved.logHistory.filtering.scroll.scrollBox.init({
                        tag: 'inputHistoryFilteringScrollBox',
                        g_box: reserved.logHistory.filtering.scroll.scrollBoxG,
                        box_data: {
                            x: historyBox.x,
                            y: historyBox.y,
                            w: historyBox.w,
                            h: historyBox.h,
                            marg: 0,
                        },
                        use_relative_coords: true,
                        locker: new Locker(),
                        lockers: [ widget_id + 'update_data' ],
                        lock_zoom: {
                            all: 'ScrollFiltering_box' + 'zoom',
                            during: 'ScrollFiltering_box' + 'zoom_during',
                            end: 'ScrollFiltering_box' + 'zoom_end',
                        },
                        run_loop: new RunLoop({
                            tag: 'inputHistoryFilteringScrollBox',
                        }),
                        can_scroll: true,
                        scrollVertical: true,
                        scroll_horizontal: false,
                        scroll_height: ob.h * reserved.logHistory.filtering.filters.length,
                        scroll_width: 0,
                        background: 'transparent',
                        scroll_rec_h: {
                            h: 1,
                        },
                        scroll_recs: {
                            w: 1,
                        },
                    })
                    reserved.logHistory.filtering.scroll.scrollG = reserved.logHistory.filtering.scroll.scrollBox.get(
                        'inner_g'
                    )
                }
                initScrollBox()
                updateFilters()
            }

            function createLogList() {
                let ib = reserved.logHistory.innerBoxLog
                reserved.logHistory.list = {
                }
                function initScrollBox() {
                    reserved.logHistory.list.scroll = {
                    }
                    reserved.logHistory.list.g = reserved.logHistory.g.append('g')
                    reserved.logHistory.list.scroll.scrollBoxG = reserved.logHistory.list.g.append(
                        'g'
                    )
                    let historyBox = lb
                    // reserved.logHistory.list.scroll.scrollBoxG.append('rect')
                    //   .attr('x', historyBox.x)
                    //   .attr('y', historyBox.y)
                    //   .attr('width', historyBox.w)
                    //   .attr('height', historyBox.h)
                    //   .attr('fill', 'none')
                    //   .attr('stroke', color_theme.dark.stroke)
                    //   .attr('stroke-dasharray', [historyBox.w, historyBox.h, historyBox.w, historyBox.h])
                    //   .attr('stroke-width', 0.1)

                    reserved.logHistory.list.scroll.scrollBox = new ScrollBox()
                    reserved.logHistory.list.scroll.scrollBox.init({
                        tag: 'inputHistoryScrollBox',
                        g_box: reserved.logHistory.list.scroll.scrollBoxG,
                        box_data: {
                            x: historyBox.x,
                            y: historyBox.y,
                            w: historyBox.w,
                            h: historyBox.h,
                            marg: 0,
                        },
                        use_relative_coords: true,
                        locker: new Locker(),
                        lockers: [ widget_id + 'update_data' ],
                        lock_zoom: {
                            all: 'ScrollBox' + 'zoom',
                            during: 'ScrollBox' + 'zoom_during',
                            end: 'ScrollBox' + 'zoom_end',
                        },
                        run_loop: new RunLoop({
                            tag: 'inputHistoryScrollBox',
                        }),
                        can_scroll: true,
                        scrollVertical: true,
                        scroll_horizontal: false,
                        scroll_height: 0.1 + historyBox.h,
                        scroll_width: 0,
                        background: 'transparent',
                        scroll_rec_h: {
                            h: 2,
                        },
                        scroll_recs: {
                            w: 2,
                        },
                    })
                    reserved.logHistory.list.scroll.scrollG = reserved.logHistory.list.scroll.scrollBox.get(
                        'inner_g'
                    )
                }
                initScrollBox()
                function wrap(self, width) {
                    let textLength = self.node().getComputedTextLength()
                    let text = self.text()
                    while (textLength > width && text.length > 0) {
                        text = text.slice(0, -1)
                        self.text(text)
                        textLength = self.node().getComputedTextLength()
                    }
                }
                console.log(shared.data.server.logs[0])

                let fl = filterLogs()
                let current = reserved.logHistory.list.scroll.scrollG
                    .selectAll('g.log')
                    .data(fl, function(d) {
                        return d.id
                    })
                let enter = current
                    .enter()
                    .append('g')
                    .attr('class', 'log')
                enter.each(function(d, i) {
                    let g = d3.select(this)
                    g.attr('transform', function() {
                        let tx = 0
                        let ty = i * ob.h
                        return 'translate(' + tx + ',' + ty + ')'
                    })
                    g
                        .append('rect')
                        .attr('width', ob.w + 'px')
                        .attr('height', ob.h + 'px')
                        .attr('x', 0 + 'px')
                        .attr('y', 0 + 'px')
                        .attr(
                            'fill',
                            i % 2 === 0
                                ? color_theme.dark.background
                                : color_theme.medium.background
                        )
                        .attr('stroke', color_theme.dark.stroke)
                        .attr('stroke-width', 0.0)
                        .on('mouseover', function() {
                            d3.select(this).attr('fill', color_theme.darker.background)
                            g
                                .selectAll('tspan')
                                .style('fill', '#000000')
                                .style('font-size', '9px')
                        })
                        .on('mouseout', function() {
                            d3
                                .select(this)
                                .attr(
                                    'fill',
                                    i % 2 === 0
                                        ? color_theme.dark.background
                                        : color_theme.medium.background
                                )
                            g
                                .selectAll('tspan')
                                .style('fill', color_theme.medium.text)
                                .style('font-size', '8px')
                        })
                        .on('click', function() {
                            updateLog(d)
                        })
                    g
                        .append('text')
                        .append('tspan')
                        .text(function(d) {
                            return d.id
                        })
                        .attr('x', ib.w * 0.025)
                        .attr('y', ib.h * 0.9)
                        .style('fill', color_theme.medium.text)
                        .style('font-weight', '')
                        .style('font-size', '8px')
                        .style('pointer-events', 'none')
                        .attr('text-anchor', 'start')
                        .each(function() {
                            wrap(d3.select(this), ib.w * 0.45)
                        })
                    g
                        .append('text')
                        .append('tspan')
                        .text(function(d) {
                            return d.info[0].date
                        })
                        .attr('x', ib.w * 0.9)
                        .attr('y', ib.h * 0.9)
                        .style('fill', color_theme.medium.text)
                        .style('font-weight', '')
                        .style('font-size', '8px')
                        .style('pointer-events', 'none')
                        .attr('text-anchor', 'end')
                        .each(function() {
                            wrap(d3.select(this), ib.w * 0.45)
                        })
                })

                // let mergeCurrentTels = currentTels.merge(enterCurrentTels)
                // mergeCurrentTels.each(function (d, i) {
                //   let toff = off
                //   if (d.id.split('_')[0] === 'M') toff += 1
                //   if (d.id.split('_')[0] === 'S') toff += 2
                //
                //   d3.select(this)
                //     .attr('transform', function (d) {
                //       let tx = -(parseInt((i + toff) / telsPerRow) % 2) === 0 ?
                //         (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
                //         (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
                //       // if (toff % 2 === 1) tx += 2 * offset.x
                //       let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)
                //       return 'translate(' + tx + ',' + ty + ')'
                //     })
                //     .style('opacity', function () {
                //       if (!d.running) return 1
                //       return 0.4
                //     })
                //   d3.select(this).select('rect')
                //     .transition()
                //     .duration(times.anim)
                //     .attr('x', function (d) {
                //       return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
                //     })
                //     .attr('y', function (d) {
                //       return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
                //     })
                //     .attr('width', function (d) {
                //       return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
                //     })
                //     .attr('height', function (d) {
                //       return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
                //     })
                //     .attr('fill', function (d) {
                //       if (!d.running) return inst_health_col(d.val)
                //       return color_theme.dark.background
                //     })
                //     // .attr('fill-opacity', function (d) {
                //     //   return fill_opacity(d.val)
                //     // })
                //     .attr('stroke-width', function (d) {
                //       return strokeSize(d.val)
                //     })
                //     .attr('stroke', function (d) {
                //       // if (!d.running) return inst_health_col(d.val)
                //       return color_theme.dark.stroke
                //     })
                //     // .attr('stroke-opacity', function (d) {
                //     //   if (!d.running) return 1
                //     //   return 1
                //     // })
                //   d3.select(this).select('text')
                //     .attr('x', 0)
                //     .attr('y', offset.y * 0.2)
                //     .attr('dy', 0)
                //     .text(function (d) {
                //       return d.id // d.id.split('_')[1]
                //     })
                //     .style('fill', color_theme.blocks.run.text)
                //     .style('font-weight', 'normal')
                //     .style('font-size', function (d) {
                //       return 6.2 // - (2 * (d.val / 100))
                //     })
                //     .attr('text-anchor', 'middle')
                // })
                //
                // currentTels
                //   .exit()
                //   .transition('in_out')
                //   .duration(times.anim)
                //   .style('opacity', 0)
                //   .remove()

                reserved.logHistory.list.scroll.scrollBox.reset_vertical_scroller({
                    can_scroll: true,
                    scroll_height: fl.length * ob.h,
                })
            }
            function updateLogList() {
                function wrap(self, width) {
                    let textLength = self.node().getComputedTextLength()
                    let text = self.text()
                    while (textLength > width && text.length > 0) {
                        text = text.slice(0, -1)
                        self.text(text)
                        textLength = self.node().getComputedTextLength()
                    }
                }
                let fl = filterLogs()
                let current = reserved.logHistory.list.scroll.scrollG
                    .selectAll('g.log')
                    .data(fl, function(d) {
                        return d.id
                    })
                let enter = current
                    .enter()
                    .append('g')
                    .attr('class', 'log')
                enter.each(function(d, i) {
                    let ib = reserved.logHistory.innerBoxLog
                    let g = d3.select(this)
                    g.attr('transform', function() {
                        let tx = 0
                        let ty = i * ob.h
                        return 'translate(' + tx + ',' + ty + ')'
                    })
                    g
                        .append('rect')
                        .attr('width', ob.w + 'px')
                        .attr('height', ob.h + 'px')
                        .attr('x', 0 + 'px')
                        .attr('y', 0 + 'px')
                        .attr(
                            'fill',
                            i % 2 === 0
                                ? color_theme.dark.background
                                : color_theme.medium.background
                        )
                        .attr('stroke', color_theme.dark.stroke)
                        .attr('stroke-width', 0.0)
                        .on('mouseover', function() {
                            d3.select(this).attr('fill', color_theme.darker.background)
                            g
                                .selectAll('tspan')
                                .style('fill', '#000000')
                                .style('font-size', '9px')
                        })
                        .on('mouseout', function() {
                            d3
                                .select(this)
                                .attr(
                                    'fill',
                                    i % 2 === 0
                                        ? color_theme.dark.background
                                        : color_theme.medium.background
                                )
                            g
                                .selectAll('tspan')
                                .style('fill', color_theme.medium.text)
                                .style('font-size', '8px')
                        })
                    g
                        .append('text')
                        .append('tspan')
                        .text(function(d) {
                            return d.id
                        })
                        .attr('x', ib.w * 0.025)
                        .attr('y', ib.h * 0.9)
                        .style('fill', color_theme.medium.text)
                        .style('font-weight', '')
                        .style('font-size', '8px')
                        .style('pointer-events', 'none')
                        .attr('text-anchor', 'start')
                        .each(function() {
                            wrap(d3.select(this), ib.w * 0.45)
                        })
                    g
                        .append('text')
                        .append('tspan')
                        .text(function(d) {
                            return d.info[0].date
                        })
                        .attr('x', ib.w * 0.9)
                        .attr('y', ib.h * 0.9)
                        .style('fill', color_theme.medium.text)
                        .style('font-weight', '')
                        .style('font-size', '8px')
                        .style('pointer-events', 'none')
                        .attr('text-anchor', 'end')
                        .each(function() {
                            wrap(d3.select(this), ib.w * 0.45)
                        })
                })

                let mergeCurrentTels = current.merge(enter)
                mergeCurrentTels.each(function(d, i) {
                    let g = d3.select(this)
                    g.attr('transform', function() {
                        let tx = 0
                        let ty = i * ob.h
                        return 'translate(' + tx + ',' + ty + ')'
                    })
                    g
                        .select('rect')
                        .attr(
                            'fill',
                            i % 2 === 0
                                ? color_theme.dark.background
                                : color_theme.medium.background
                        )
                        .attr('stroke', color_theme.dark.stroke)
                        .on('mouseover', function() {
                            d3.select(this).attr('fill', color_theme.darker.background)
                            g
                                .selectAll('tspan')
                                .style('fill', '#000000')
                                .style('font-size', '9px')
                        })
                        .on('mouseout', function() {
                            d3
                                .select(this)
                                .attr(
                                    'fill',
                                    i % 2 === 0
                                        ? color_theme.dark.background
                                        : color_theme.medium.background
                                )
                            g
                                .selectAll('tspan')
                                .style('fill', color_theme.medium.text)
                                .style('font-size', '8px')
                        })
                })

                current
                    .exit()
                    .transition('in_out')
                    .duration(times.anim)
                    .style('opacity', 0)
                    .remove()

                reserved.logHistory.list.scroll.scrollBox.reset_vertical_scroller({
                    can_scroll: true,
                    scroll_height: fl.length * ob.h,
                })
            }

            reserved.logHistory.g.attr(
                'transform',
                'translate('
          + reserved.logHistory.box.x
          + ','
          + reserved.logHistory.box.y
          + ')'
            )

            createLogFilter()
            createLogList()

            // reserved.logHistory.g.append('rect')
            //   .attr('x', reserved.logHistory.box.w * 0.0)
            //   .attr('y', reserved.logHistory.box.h * 0.0)
            //   .attr('width', reserved.logHistory.box.w * 1.0)
            //   .attr('height', reserved.logHistory.box.h * 1.0)
            //   .attr('fill', color_theme.dark.background)
            //   .attr('stroke', color_theme.dark.stroke)
            //   .attr('stroke-width', 0)
            //   .attr('opacity', 1)
            //   .on('mouseover', function () {
            //     // d3.select(this).transition().duration(times.anim).attr('opacity', 1)
            //   })
            //   .on('mouseout', function () {
            //     // d3.select(this).transition().duration(times.anim).attr('opacity', 0)
            //   })
            // reserved.logHistory.g.append('text')
            //   .text('Logs List')
            //   .attr('x', (reserved.logHistory.box.w * 0.5))
            //   .attr('y', reserved.logHistory.box.h * 0.05)
            //   .style('fill', color_theme.medium.text)
            //   .style('font-weight', '')
            //   .style('font-size', '9px')
            //   .attr('text-anchor', 'middle')
        }

        function updateLog(log) {
            updateLog_info(log)
            updateLogFields(log)
        }

        function init_data(data_in) {
            reserved.main.box = {
                x: box.log.x,
                y: box.log.y,
                w: box.log.w,
                h: box.log.h,
                marg: box.log.marg,
            }
            reserved.main.g = svg.g
                .append('g')
                .attr(
                    'transform',
                    'translate(' + reserved.main.box.x + ',' + reserved.main.box.y + ')'
                )
            let lineGenerator = d3
                .line()
                .x(function(d) {
                    return d.x
                })
                .y(function(d) {
                    return d.y
                })
                .curve(d3.curveLinear)
            let depth = 3
            let dataPointFuturTop = [
                {
                    x: 0,
                    y: 0,
                },
                {
                    x: -depth,
                    y: depth,
                },
                {
                    x: -depth,
                    y: reserved.main.box.h + depth,
                },
                {
                    x: reserved.main.box.w - depth,
                    y: reserved.main.box.h + depth,
                },
                {
                    x: reserved.main.box.w + 0,
                    y: reserved.main.box.h,
                },
                {
                    x: 0,
                    y: reserved.main.box.h,
                },
                {
                    x: -depth,
                    y: reserved.main.box.h + depth,
                },
                {
                    x: 0,
                    y: reserved.main.box.h,
                },
                {
                    x: 0,
                    y: 0,
                },
            ]
            reserved.main.g
                .append('path')
                .data([ dataPointFuturTop ])
                .attr('d', lineGenerator)
                .attr('fill', color_theme.darker.background)
                .attr('stroke', color_theme.darker.stroke)
                .attr('stroke-width', 0.2)
            reserved.main.g
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', reserved.main.box.w)
                .attr('height', reserved.main.box.h)
                .attr('fill', color_theme.medium.background)
                .attr('stroke', color_theme.medium.stroke)
                .attr('stroke-width', 0.2)
            // .style('filter', 'url(#drop-shadow)')

            // let gapUp = [
            //   {x: reserved.main.box.w * 0.256, y: reserved.main.box.h * 0.00},
            //   {x: reserved.main.box.w * 0.256, y: reserved.main.box.h * 0.1},
            //   {x: reserved.main.box.w * 0.256 + depth * 1.5, y: reserved.main.box.h * 0.1},
            //   {x: reserved.main.box.w * 0.256 + depth * 1.5, y: reserved.main.box.h * 0.00}
            // ]
            // reserved.main.g.append('path')
            //   .data([gapUp])
            //   .attr('d', lineGenerator)
            //   .attr('fill', color_theme.darker.background)
            //   .attr('stroke', color_theme.darker.stroke)
            //   .attr('stroke-width', 0.2)
            // let gapUp2 = [
            //   {x: reserved.main.box.w * 0.256, y: reserved.main.box.h * 0.00},
            //   {x: reserved.main.box.w * 0.256, y: reserved.main.box.h * 0.1},
            //   {x: reserved.main.box.w * 0.256 + (depth * 0.5), y: reserved.main.box.h * 0.1},
            //   {x: reserved.main.box.w * 0.256 + (depth * 0.5), y: reserved.main.box.h * 0.00 + depth},
            //   {x: reserved.main.box.w * 0.256 + depth * 1.5, y: reserved.main.box.h * 0.00}
            // ]
            // reserved.main.g.append('path')
            //   .data([gapUp2])
            //   .attr('d', lineGenerator)
            //   .attr('fill', '#444444')
            //   .attr('stroke', '')
            //   .attr('stroke-width', 0)
            //
            // let gapBottom = [
            //   {x: reserved.main.box.w * 0.257, y: reserved.main.box.h * 1},
            //   {x: reserved.main.box.w * 0.257, y: reserved.main.box.h * 0.525},
            //   {x: reserved.main.box.w * 0.257 + depth, y: reserved.main.box.h * 0.525},
            //   {x: reserved.main.box.w * 0.257 + depth, y: reserved.main.box.h * 1}
            // ]
            // reserved.main.g.append('path')
            //   .data([gapBottom])
            //   .attr('d', lineGenerator)
            //   .attr('fill', color_theme.darker.background)
            //   .attr('stroke', color_theme.darker.stroke)
            //   .attr('stroke-width', 0.2)
            // let gapBottom2 = [
            //   {x: reserved.main.box.w * 0.257, y: reserved.main.box.h * 1},
            //   {x: reserved.main.box.w * 0.257 - depth, y: reserved.main.box.h * 1 + depth},
            //   {x: reserved.main.box.w * 0.257, y: reserved.main.box.h * 1 + depth}
            // ]
            // reserved.main.g.append('path')
            //   .data([gapBottom2])
            //   .attr('d', lineGenerator)
            //   .attr('fill', '#444444')
            //   .attr('stroke', '')
            //   .attr('stroke-width', 0)

            reserved.assoc_ele = {
                g: reserved.main.g.append('g'),
                box: box.logAssociated_element,
                blocks: {
                    icon: undefined,
                },
                events: {
                    icon: undefined,
                },
                tels: {
                    icon: undefined,
                },
            }
            reserved.log_info = {
                g: reserved.main.g.append('g'),
                box: box.log_info,
            }
            reserved.logFields = {
                g: reserved.main.g.append('g'),
                box: box.logFields,
                title: {
                    g: undefined,
                    box: {
                        x: 0,
                        y: box.logFields.h * 0.0,
                        w: box.logFields.w,
                        h: box.logFields.h * 0.08,
                    },
                },
                header: {
                    g: undefined,
                    box: {
                        x: 0,
                        y: box.logFields.h * 0.08,
                        w: box.logFields.w * 0.35,
                        h: box.logFields.h * 0.9,
                    },
                },
                text: {
                    g: undefined,
                    box: {
                        x: box.logFields.w * 0.3,
                        y: box.logFields.h * 0.08,
                        w: box.logFields.w * 0.7,
                        h: box.logFields.h * 0.9,
                    },
                },
            }
            reserved.logHistory = {
                g: reserved.main.g.append('g'),
                box: box.logHistory,
            }
            // reserved.inputHistory = {
            //   main: {
            //     g: reserved.gBlockBox.append('g'),
            //     box: {
            //       x: reserved.adjustedBox.x,
            //       y: reserved.adjustedBox.y + box.log.h * 0.06,
            //       w: box.log.w * 0.165,
            //       h: box.log.h * 0.45,
            //       marg: box.telescopes.marg
            //     }
            //   }
            // }
            // reserved.onlineOperator = {
            //   main: {
            //     g: reserved.gBlockBox.append('g'),
            //     box: {
            //       x: reserved.adjustedBox.x + box.log.w * 0.825,
            //       y: reserved.adjustedBox.y + box.log.h * 0.06,
            //       w: box.log.w * 0.165,
            //       h: box.log.h * 0.45,
            //       marg: box.telescopes.marg
            //     }
            //   }
            // }
            // reserved.focusedItemHeader = {
            //   main: {
            //     g: reserved.gBlockBox.append('g'),
            //     box: {
            //       x: reserved.adjustedBox.x + box.log.w * 0.175,
            //       y: reserved.adjustedBox.y + box.log.h * 0.0,
            //       w: box.log.w * 0.65,
            //       h: box.log.h * 0.06,
            //       marg: box.telescopes.marg * 0.5
            //     }
            //   }
            // }
            // reserved.focusedItem_info = {
            //   main: {
            //     g: reserved.gBlockBox.append('g'),
            //     box: {
            //       x: reserved.adjustedBox.x + box.log.w * 0.15,
            //       y: reserved.adjustedBox.y + box.log.h * 0.53,
            //       w: box.log.w * 0.7,
            //       h: box.log.h * 0.4,
            //       marg: box.telescopes.marg * 0.5
            //     }
            //   }
            // }
            // reserved.textInput = {
            //   main: {
            //     g: reserved.gBlockBox.append('g'),
            //     box: {
            //       x: reserved.adjustedBox.x + box.log.w * 0.175,
            //       y: reserved.adjustedBox.y + box.log.h * 0.06,
            //       w: box.log.w * 0.65,
            //       h: box.log.h * 0.45,
            //       marg: box.telescopes.marg * 0.5
            //     }
            //   }
            // }

            init_assoc_ele()
            initLogFields()
            initLogHistory()
            initLog_info()
            // initinputHistory()
            // initOnlineOperator()
            // initFocusedItemHeader()
            // initFocusedItem_info()
            // initTextInput()
        }
        this.init_data = init_data

        function update_data(data_in) {}
        this.update_data = update_data
    }
    let Svg_blocks_queue_server = function() {
        let reserved = {
            main: {
                g: undefined,
                mode: 'icon',
            },
            back: {
                g: undefined,
            },
            icon: {
                g: undefined,
            },
            title: {
                g: undefined,
            },
            filter: {
                g: undefined,
            },
            content: {
                g: undefined,
            },
        }

        function init_data() {
            reserved.main.g = svg.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.block_queue_server.x
            + ','
            + box.block_queue_server.y
            + ')'
                )

            reserved.icon.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.block_queue_server_icon.x
            + ','
            + box.block_queue_server_icon.y
            + ')'
                )
                .attr('opacity', 1)
            reserved.title.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.block_queue_server_title.x
            + ','
            + box.block_queue_server_title.y
            + ')'
                )
            reserved.filter.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.block_queue_server_filter.x
            + ','
            + box.block_queue_server_filter.y
            + ')'
                )
            reserved.content.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.block_queue_server_content.x
            + ','
            + box.block_queue_server_content.y
            + ')'
                )

            let lineGenerator = d3
                .line()
                .x(function(d) {
                    return d.x
                })
                .y(function(d) {
                    return d.y
                })
                .curve(d3.curveLinear)
            let depth = 2
            let dataPointFuturTop = [
                {
                    x: 0,
                    y: 0,
                },
                {
                    x: -depth,
                    y: depth,
                },
                {
                    x: -depth,
                    y: box.block_queue_server_icon.h + depth,
                },
                {
                    x: box.block_queue_server_icon.w - depth,
                    y: box.block_queue_server_icon.h + depth,
                },
                {
                    x: box.block_queue_server_icon.w + 0,
                    y: box.block_queue_server_icon.h,
                },
                {
                    x: 0,
                    y: box.block_queue_server_icon.h,
                },
                {
                    x: -depth,
                    y: box.block_queue_server_icon.h + depth,
                },
                {
                    x: 0,
                    y: box.block_queue_server_icon.h,
                },
                {
                    x: 0,
                    y: 0,
                },
            ]
            reserved.icon.g
                .append('path')
                .data([ dataPointFuturTop ])
                .attr('d', lineGenerator)
                .attr('fill', color_theme.darker.background)
                .attr('stroke', color_theme.darker.stroke)
                .attr('stroke-width', 0.2)
            reserved.icon.g
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.block_queue_server_icon.w)
                .attr('height', box.block_queue_server_icon.h)
                .attr('fill', color_theme.bright.background)
                .attr('stroke', color_theme.bright.stroke)
                .attr('stroke-width', 0.2)
                .on('mouseover', function() {
                    if (reserved.main.mode === 'expand') {
                        d3.select(this).attr('fill', color_theme.bright.background)
                    }
                    else {
                        d3.select(this).attr('fill', color_theme.darker.background)
                    }
                })
                .on('mouseout', function() {
                    if (reserved.main.mode === 'expand') {
                        d3.select(this).attr('fill', color_theme.darker.background)
                    }
                    else {
                        d3.select(this).attr('fill', color_theme.bright.background)
                    }
                })
                .on('click', function() {
                    let dataPointFuturTop = [
                        {
                            x: -4,
                            y: 4,
                        },
                        {
                            x: -5,
                            y: 5,
                        },
                        {
                            x: -5,
                            y: box.block_queue_server_icon.h + 5,
                        },
                        {
                            x: box.block_queue_server_icon.w - 5,
                            y: box.block_queue_server_icon.h + 5,
                        },
                        {
                            x: box.block_queue_server_icon.w - 4,
                            y: box.block_queue_server_icon.h + 4,
                        },
                        {
                            x: -4,
                            y: box.block_queue_server_icon.h + 4,
                        },
                        {
                            x: -5,
                            y: box.block_queue_server_icon.h + 5,
                        },
                        {
                            x: -4,
                            y: box.block_queue_server_icon.h + 4,
                        },
                        {
                            x: -4,
                            y: 4,
                        },
                    ]
                    reserved.icon.g
                        .select('path')
                        .data([ dataPointFuturTop ])
                        .transition()
                        .duration(times.anim)
                        .attr('d', lineGenerator)
                    reserved.icon.g
                        .select('image')
                        .transition()
                        .duration(times.anim)
                        .attr('x', box.block_queue_server_icon.w * 0.2 - 4)
                        .attr('y', box.block_queue_server_icon.h * 0.2 + 4)
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('x', -4)
                        .attr('y', 4)
                        .attr('fill', color_theme.darker.background)
                        .on('end', function() {
                            reserved.main.mode = 'expand'
                            draw_block_queue_server()
                        })
                })
            reserved.icon.g
                .append('svg:image')
                .attr('xlink:href', '/static/icons/blocks.svg')
                .attr('width', box.block_queue_server_icon.w * 0.6)
                .attr('height', box.block_queue_server_icon.h * 0.6)
                .attr('x', box.block_queue_server_icon.w * 0.2)
                .attr('y', box.block_queue_server_icon.h * 0.2)
                .style('pointer-events', 'none')
        }
        this.init_data = init_data

        function draw_block_queue_server() {
            function drawBack() {
                let lineGenerator = d3
                    .line()
                    .x(function(d) {
                        return d.x
                    })
                    .y(function(d) {
                        return d.y
                    })
                    .curve(d3.curveLinear)
                let b = {
                    x: box.block_queue_server.marg,
                    y: box.block_queue_server.marg,
                    w: box.block_queue_server.w - 2 * box.block_queue_server.marg,
                    h: box.block_queue_server.h - 2 * box.block_queue_server.marg,
                }
                let dataPointBottom = [
                    {
                        x: b.x + b.w * 0.1,
                        y: b.y,
                    },
                    {
                        x: b.x + b.w,
                        y: b.y,
                    },
                    {
                        x: b.x + b.w,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x,
                        y: b.y + b.h * 0.3,
                    },
                    {
                        x: b.x + b.w * 0.1,
                        y: b.y + b.h * 0.3,
                    },
                    {
                        x: b.x + b.w * 0.1,
                        y: b.y,
                    },
                ]
                reserved.back.g
                    .append('path')
                    .data([ dataPointBottom ])
                    .attr('d', lineGenerator)
                    .attr('fill', color_theme.medium.background)
                    .attr('stroke', color_theme.medium.stroke)
                    .attr('stroke-width', 0.2)

                let depth = 3
                let dataPointFuturTop = [
                    {
                        x: b.x + b.w * 0.1,
                        y: b.y,
                    },
                    {
                        x: b.x + b.w * 0.1 - depth,
                        y: b.y + depth,
                    },
                    {
                        x: b.x + b.w * 0.1 - depth,
                        y: b.y + b.h * 0.3,
                    },
                    {
                        x: b.x,
                        y: b.y + b.h * 0.3,
                    },
                    {
                        x: b.x - depth,
                        y: b.y + b.h * 0.3 + depth,
                    },
                    {
                        x: b.x - depth,
                        y: b.y + b.h + depth,
                    },
                    {
                        x: b.x + b.w - depth,
                        y: b.y + b.h + depth,
                    },
                    {
                        x: b.x + b.w,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x - depth,
                        y: b.y + b.h + depth,
                    },
                    {
                        x: b.x,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x,
                        y: b.y + b.h * 0.3,
                    },
                    {
                        x: b.x + b.w * 0.1,
                        y: b.y + b.h * 0.3,
                    },
                ]
                reserved.back.g
                    .append('path')
                    .data([ dataPointFuturTop ])
                    .attr('d', lineGenerator)
                    .attr('fill', color_theme.darker.background)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)
            }
            function drawTitle() {
                reserved.title.g
                    .append('svg:image')
                    .attr('xlink:href', '/static/icons/blocks.svg')
                    .attr('width', box.block_queue_server_title.h * 0.6)
                    .attr('height', box.block_queue_server_title.h * 0.6)
                    .attr(
                        'x',
                        box.block_queue_server_title.w * 0.075
              - box.block_queue_server_title.h * 0.3
                    )
                    .attr(
                        'y',
                        box.block_queue_server_title.h * 0.6
              - box.block_queue_server_title.h * 0.3
                    )
                    .style('pointer-events', 'none')
                reserved.title.g
                    .append('text')
                    .text('Scheduling blocks')
                    .attr('x', box.block_queue_server_title.w * 0.125)
                    .attr('y', box.block_queue_server_title.h * 0.7)
                    .style('fill', color_theme.medium.text)
                    .style('font-weight', '')
                    .style('font-size', '14px')
                    .attr('text-anchor', 'start')
                // .attr('transform', 'translate(' +
                //   (box.block_queue_server_title.x + box.block_queue_server_title.w * 0.5) +
                //   ',' + (box.block_queue_server_title.y + box.block_queue_server_title.h * 1.0) + ')')
            }

            reserved.back.g = reserved.main.g
                .append('g')
                .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
            reserved.title.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.block_queue_server_title.x
            + ','
            + box.block_queue_server_title.y
            + ')'
                )
            reserved.filter.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.block_queue_server_filter.x
            + ','
            + box.block_queue_server_filter.y
            + ')'
                )
            reserved.content.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.block_queue_server_content.x
            + ','
            + box.block_queue_server_content.y
            + ')'
                )

            drawBack()
            drawTitle()

            reserved.content.g
                .append('rect')
                .attr('x', 0 + 1)
                .attr('y', -16)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', color_theme.dark.background)
                .on('click', function() {
                    block_queue_server.changeDisplayer('blockQueue')
                })
            reserved.content.g
                .append('svg:image')
                .attr('xlink:href', '/static/icons/blocks-vert-hori.svg')
                .attr('width', 12)
                .attr('height', 12)
                .attr('x', 0 + 2.25)
                .attr('y', -16 + 1.5)
                .style('pointer-events', 'none')

            reserved.content.g
                .append('rect')
                .attr('x', 20 + 1)
                .attr('y', -16)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', color_theme.dark.background)
                .on('click', function() {
                    block_queue_server.changeDisplayer('blockQueue2')
                })
            reserved.content.g
                .append('svg:image')
                .attr('xlink:href', '/static/icons/blocks-diag.svg')
                .attr('width', 12)
                .attr('height', 12)
                .attr('x', 20 + 2.25)
                .attr('y', -16 + 1.5)
                .style('pointer-events', 'none')

            reserved.content.g
                .append('rect')
                .attr('x', 40 + 1)
                .attr('y', -16)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', color_theme.dark.background)
                .on('click', function() {
                    block_queue_server.changeDisplayer('blockList')
                })
            reserved.content.g
                .append('svg:image')
                .attr('xlink:href', '/static/icons/blocks-4.svg')
                .attr('width', 12)
                .attr('height', 12)
                .attr('x', 40 + 2.25)
                .attr('y', -16 + 1.5)
                .style('pointer-events', 'none')

            reserved.content.g
                .append('rect')
                .attr('x', 60 + 1)
                .attr('y', -16)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', color_theme.dark.background)
                .on('click', function() {
                    block_queue_server.changeDisplayer('blockForm')
                })
            reserved.content.g
                .append('svg:image')
                .attr('xlink:href', '/static/icons/list.svg')
                .attr('width', 12)
                .attr('height', 12)
                .attr('x', 60 + 2.25)
                .attr('y', -16 + 1.5)
                .style('pointer-events', 'none')

            let fbox = box.block_queue_server_filter
            blockFilters = new BlockFilters({
                main: {
                    tag: 'blockQueueFilterTag',
                    g: reserved.filter.g,
                    box: box.block_queue_server_filter,
                    mode: 'beginner',
                    background: {
                        fill: color_theme.dark.background,
                        stroke: color_theme.dark.stroke,
                        strokeWidth: 0.1,
                    },
                    color_theme: color_theme,
                },
                blocks: {
                    colorPalette: color_theme.blocks,
                },
                beginner: {
                    middle: {
                        g: reserved.filter.g.append('g'),
                        box: {
                            x: box.block_queue_server_filter.w * 0.33,
                            y: 0,
                            w: box.block_queue_server_filter.w * 0.33,
                            h: box.block_queue_server_filter.h,
                        },
                    },
                    states: {
                        g: reserved.filter.g.append('g'),
                        box: {
                            x: 0,
                            y: 0,
                            w: box.block_queue_server_filter.w * 0.2,
                            h: box.block_queue_server_filter.h * 0.33,
                        },
                        token: {
                            id: 'statesToken',
                            type: 'states',
                            filtering: [],
                        },
                    },
                    tels: {
                        g: reserved.filter.g.append('g'),
                        box: {
                            x: box.block_queue_server_filter.w * 0.7,
                            y: box.block_queue_server_filter.h * 0.4,
                            w: box.block_queue_server_filter.w * 0.2,
                            h: box.block_queue_server_filter.h * 0.6,
                        },
                        token: {
                            id: 'telsToken',
                            type: 'tels',
                            filtering: [],
                        },
                    },
                    targets: {
                        g: reserved.filter.g.append('g'),
                        box: {
                            x: box.block_queue_server_filter.w * 0.1,
                            y: box.block_queue_server_filter.h * 0.4,
                            w: box.block_queue_server_filter.w * 0.2,
                            h: box.block_queue_server_filter.h * 0.6,
                        },
                        target_ids: extractTargets(),
                        token: {
                            id: 'targetsToken',
                            type: 'targets',
                            filtering: [],
                        },
                    },
                    time: {
                        g: reserved.filter.g.append('g'),
                        box: {
                            x: box.block_queue_server_filter.w * 0.66,
                            y: 0,
                            w: box.block_queue_server_filter.w * 0.33,
                            h: box.block_queue_server_filter.h * 0.33,
                        },
                        token: {
                            id: 'timeToken',
                            type: 'time',
                            filtering: [],
                        },
                    },
                },
                expert: {
                    token_focus: {
                    },
                    enabled: {
                        g: reserved.filter.g.append('g'),
                        box: {
                            x: 0,
                            y: 0,
                            w: fbox.w * 1,
                            h: fbox.h * 0.15,
                        },
                        scroll: {
                            direction: 'vertical',
                        },
                    },
                    disabled: {
                        g: reserved.filter.g.append('g'),
                        box: {
                            x: 0,
                            y: 0 + fbox.h * 0.85,
                            w: fbox.w * 1,
                            h: fbox.h * 0.15,
                        },
                        scroll: {
                            direction: 'vertical',
                        },
                    },
                    content: {
                        g: reserved.filter.g.append('g'),
                        box: {
                            x: 0,
                            y: 0 + fbox.h * 0.15,
                            w: fbox.w * 1,
                            h: fbox.h * 0.7,
                        },
                        button: {
                            g: undefined,
                        },
                        panel: {
                            g: undefined,
                        },
                    },
                },
                // title: {
                //   g: reserved.filter.g.append('g'),
                //   box: {x: 0, y: 0 + fbox.h * 0.0, w: fbox.w * 0.8, h: fbox.h * 0.1}
                // },
                // result: {
                //   g: reserved.filter.g.append('g'),
                //   box: {x: 0, y: 0 + fbox.h * 0.84, w: fbox.w * 0.8, h: fbox.h * 0.16}
                // },
                filters: [],
                blockQueue: [],
            })
            blockFilters.init()

            block_queue_server = new BlockDisplayer({
                main: {
                    tag: 'blockQueueMiddleTag',
                    g: reserved.content.g,
                    scroll: {
                    },
                    box: box.block_queue_server_content,
                    background: {
                        fill: color_theme.medium.background,
                        stroke: color_theme.medium.stroke,
                        strokeWidth: 0.4,
                    },
                    color_theme: color_theme,
                },

                displayer: 'blockTrackShrinkBib',
                blockQueue: {
                    axis: {
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: box.block_queue_server_content.h,
                            w: box.block_queue_server_content.w,
                            h: 0,
                            marg: box.block_queue_server_content.marg,
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        showText: true,
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
                    blocks: {
                        enabled: true,
                        run: {
                            enabled: true,
                            g: undefined,
                            box: {
                                x: 0,
                                y: box.block_queue_server_content.h * 0.32,
                                w: box.block_queue_server_content.w,
                                h: box.block_queue_server_content.h * 0.68,
                                marg: box.block_queue_server_content.marg,
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
                                y: box.block_queue_server_content.h * 0.0,
                                w: box.block_queue_server_content.w,
                                h: box.block_queue_server_content.h * 0.3,
                                marg: box.block_queue_server_content.marg,
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
                                y: box.block_queue_server_content.h * 0.5,
                                w: box.block_queue_server_content.w,
                                h: box.block_queue_server_content.h * 0.47,
                                marg: box.block_queue_server_content.marg,
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
                            y: box.block_queue_server_content.h * 0.025,
                            w: box.block_queue_server_content.w,
                            h: box.block_queue_server_content.h * 0.975,
                            marg: box.block_queue_server_content.marg,
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
                            y: box.block_queue_server_content.h,
                            w: box.block_queue_server_content.w,
                            h: 0,
                            marg: box.block_queue_server_content.marg,
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
                        enabled: true,
                        g: undefined,
                        box: {
                            x: 0,
                            y: box.block_queue_server_content.h * 0.025,
                            w: box.block_queue_server_content.w,
                            h: box.block_queue_server_content.h * 0.975,
                            marg: box.block_queue_server_content.marg,
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
                            y: box.block_queue_server_content.h,
                            w: box.block_queue_server_content.w,
                            h: 0,
                            marg: box.block_queue_server_content.marg,
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
                            y: box.block_queue_server_content.h,
                            w: box.block_queue_server_content.w,
                            h: 0,
                            marg: box.block_queue_server_content.marg,
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
                            w: box.block_queue_server_content.w * 0.2,
                            h: box.block_queue_server_content.h,
                            marg: box.block_queue_server_content.marg,
                        },
                        order: 'n_sched',
                    },
                    forms: {
                        g: undefined,
                        box: {
                            x: box.block_queue_server_content.w * 0.22,
                            y: box.block_queue_server_content.h * 0.02,
                            w:
                box.block_queue_server_content.w * 0.78
                - box.block_queue_server_content.h * 0.02,
                            h: box.block_queue_server_content.h * 0.96,
                            marg: box.block_queue_server_content.marg,
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
                        click: d => {
                            console.log(d)
                        },
                        mouseover: d => {
                            console.log(d)
                        },
                        mouseout: d => {
                            console.log(d)
                        },
                        drag: {
                            start: () => {},
                            tick: () => {},
                            end: () => {},
                        },
                    },
                    sched: {
                        click: d => {
                            console.log(d)
                        },
                        mouseover: d => {
                            console.log(d)
                        },
                        mouseout: d => {
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
            block_queue_server.init()

            blockFilters.plugBlockQueue(block_queue_server, true)

            update_data()
        }

        function update_data() {
            if (reserved.main.mode === 'icon') {
                return
            }
            let tel_ids = []
            $.each(shared.data.server.inst_health, function(index, data_now) {
                tel_ids.push(data_now.id)
            })
            console.log(shared.data.server.time_of_night)
            let start_time_sec = {
                date: new Date(shared.data.server.time_of_night.date_start),
                time: Number(shared.data.server.time_of_night.start),
            }
            let end_time_sec = {
                date: new Date(shared.data.server.time_of_night.date_end),
                time: Number(shared.data.server.time_of_night.end),
            }
            console.log(start_time_sec)
            block_queue_server.update_data({
                time: {
                    currentTime: {
                        date: new Date(shared.data.server.time_of_night.date_now),
                        time: Number(shared.data.server.time_of_night.now),
                    },
                    start_time_sec: {
                        date: new Date(shared.data.server.time_of_night.date_start),
                        time: Number(shared.data.server.time_of_night.start),
                    },
                    end_time_sec: {
                        date: new Date(shared.data.server.time_of_night.date_end),
                        time: Number(shared.data.server.time_of_night.end),
                    },
                },
                data: {
                    raw: {
                        blocks: shared.data.server.blocks,
                        tel_ids: tel_ids,
                    },
                    modified: [],
                },
            })
            blockFilters.update_stats()
        }
        this.update_data = update_data

        function update() {
            if (reserved.main.mode === 'icon') {
                return
            }
            block_queue_server.update({
                time: {
                    currentTime: {
                        date: new Date(shared.data.server.time_of_night.date_now),
                        time: Number(shared.data.server.time_of_night.now),
                    },
                    start_time_sec: {
                        date: new Date(shared.data.server.time_of_night.date_start),
                        time: Number(shared.data.server.time_of_night.start),
                    },
                    end_time_sec: {
                        date: new Date(shared.data.server.time_of_night.date_end),
                        time: Number(shared.data.server.time_of_night.end),
                    },
                },
            })
        }
        this.update = update
    }
    let SvgEvents = function() {
        let reserved = {
            main: {
                g: undefined,
                mode: 'icon',
            },
            back: {
                g: undefined,
            },
            icon: {
                g: undefined,
            },
            title: {
                g: undefined,
            },
            filter: {
                g: undefined,
            },
            content: {
                g: undefined,
            },
        }
        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_data() {
            reserved.main.g = svg.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.event_queue_server.x
            + ','
            + box.event_queue_server.y
            + ')'
                )

            reserved.icon.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.event_queue_server_icon.x
            + ','
            + box.event_queue_server_icon.y
            + ')'
                )
                .attr('opacity', 1)
            reserved.title.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.event_queue_serverTitle.x
            + ','
            + box.event_queue_serverTitle.y
            + ')'
                )
            reserved.filter.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.event_queue_serverFilter.x
            + ','
            + box.event_queue_serverFilter.y
            + ')'
                )
            reserved.content.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.event_queue_serverContent.x
            + ','
            + box.event_queue_serverContent.y
            + ')'
                )

            let lineGenerator = d3
                .line()
                .x(function(d) {
                    return d.x
                })
                .y(function(d) {
                    return d.y
                })
                .curve(d3.curveLinear)
            let depth = 2
            let dataPointFuturTop = [
                {
                    x: 0,
                    y: 0,
                },
                {
                    x: -depth,
                    y: depth,
                },
                {
                    x: -depth,
                    y: box.event_queue_server_icon.h + depth,
                },
                {
                    x: box.event_queue_server_icon.w - depth,
                    y: box.event_queue_server_icon.h + depth,
                },
                {
                    x: box.event_queue_server_icon.w + 0,
                    y: box.event_queue_server_icon.h,
                },
                {
                    x: 0,
                    y: box.event_queue_server_icon.h,
                },
                {
                    x: -depth,
                    y: box.event_queue_server_icon.h + depth,
                },
                {
                    x: 0,
                    y: box.event_queue_server_icon.h,
                },
                {
                    x: 0,
                    y: 0,
                },
            ]
            reserved.icon.g
                .append('path')
                .data([ dataPointFuturTop ])
                .attr('d', lineGenerator)
                .attr('fill', color_theme.darker.background)
                .attr('stroke', color_theme.darker.stroke)
                .attr('stroke-width', 0.2)
            reserved.icon.g
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.event_queue_server_icon.w)
                .attr('height', box.event_queue_server_icon.h)
                .attr('fill', color_theme.bright.background)
                .attr('stroke', color_theme.bright.stroke)
                .attr('stroke-width', 0.2)
                .on('mouseover', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('fill', color_theme.dark.background)
                })
                .on('mouseout', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('fill', color_theme.bright.background)
                })
                .on('click', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('x', -5)
                        .attr('y', 5)
                    reserved.icon.g
                        .transition()
                        .duration(times.anim)
                        .attr('opacity', 0)
                        .on('end', function() {
                            reserved.main.mode = 'expand'
                            drawEvents()
                        })
                })
            reserved.icon.g
                .append('svg:image')
                .attr('xlink:href', '/static/icons/warning.svg')
                .attr('width', box.event_queue_server_icon.w * 0.6)
                .attr('height', box.event_queue_server_icon.h * 0.6)
                .attr('x', box.event_queue_server_icon.w * 0.2)
                .attr('y', box.event_queue_server_icon.h * 0.2)
                .style('pointer-events', 'none')
        }
        this.init_data = init_data

        function drawEvents() {
            function drawBack() {
                let lineGenerator = d3
                    .line()
                    .x(function(d) {
                        return d.x
                    })
                    .y(function(d) {
                        return d.y
                    })
                    .curve(d3.curveLinear)
                let b = {
                    x: box.event_queue_server.marg,
                    y: box.event_queue_server.marg,
                    w: box.event_queue_server.w - 2 * box.event_queue_server.marg,
                    h: box.event_queue_server.h - 2 * box.event_queue_server.marg,
                }
                let dataPointBottom = [
                    {
                        x: b.x,
                        y: b.y,
                    },
                    {
                        x: b.x + b.w * 0.9,
                        y: b.y,
                    },
                    {
                        x: b.x + b.w * 0.9,
                        y: b.y + b.h * 0.3,
                    },
                    {
                        x: b.x + b.w,
                        y: b.y + b.h * 0.3,
                    },
                    {
                        x: b.x + b.w,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x,
                        y: b.y,
                    },
                ]
                reserved.back.g
                    .append('path')
                    .data([ dataPointBottom ])
                    .attr('d', lineGenerator)
                    .attr('fill', color_theme.medium.background)
                    .attr('stroke', color_theme.medium.stroke)
                    .attr('stroke-width', 0.2)

                let dataPointFuturTop = [
                    {
                        x: b.x,
                        y: b.y,
                    },
                    {
                        x: b.x - 5,
                        y: b.y + 5,
                    },
                    {
                        x: b.x - 5,
                        y: b.y + b.h + 5,
                    },
                    {
                        x: b.x + b.w - 5,
                        y: b.y + b.h + 5,
                    },
                    {
                        x: b.x + b.w,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x - 5,
                        y: b.y + b.h + 5,
                    },
                    {
                        x: b.x,
                        y: b.y + b.h,
                    },
                    {
                        x: b.x,
                        y: b.y,
                    },
                ]
                reserved.back.g
                    .append('path')
                    .data([ dataPointFuturTop ])
                    .attr('d', lineGenerator)
                    .attr('fill', color_theme.darker.background)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)
            }
            function drawTitle() {
                reserved.title.g
                    .append('svg:image')
                    .attr('xlink:href', '/static/icons/warning.svg')
                    .attr('width', box.event_queue_serverTitle.h * 0.6)
                    .attr('height', box.event_queue_serverTitle.h * 0.6)
                    .attr(
                        'x',
                        box.event_queue_serverTitle.w * 0.075
              - box.event_queue_serverTitle.h * 0.3
                    )
                    .attr(
                        'y',
                        box.event_queue_serverTitle.h * 0.6
              - box.event_queue_serverTitle.h * 0.3
                    )
                    .style('pointer-events', 'none')
                reserved.title.g
                    .append('text')
                    .text('Events')
                    .attr('x', box.event_queue_serverTitle.w * 0.125)
                    .attr('y', box.event_queue_serverTitle.h * 0.7)
                    .style('fill', color_theme.medium.text)
                    .style('font-weight', '')
                    .style('font-size', '14px')
                    .attr('text-anchor', 'start')
                // .attr('transform', 'translate(' +
                //   (box.event_queue_serverTitle.x + box.event_queue_serverTitle.w * 0.5) +
                //   ',' + (box.event_queue_serverTitle.y + box.event_queue_serverTitle.h * 1.0) + ')')
            }

            reserved.back.g = reserved.main.g
                .append('g')
                .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
            reserved.title.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.event_queue_serverTitle.x
            + ','
            + box.event_queue_serverTitle.y
            + ')'
                )
            reserved.filter.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.event_queue_serverFilter.x
            + ','
            + box.event_queue_serverFilter.y
            + ')'
                )
            reserved.content.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.event_queue_serverContent.x
            + ','
            + box.event_queue_serverContent.y
            + ')'
                )

            drawBack()
            drawTitle()
            // let adjustedBox = {
            //   x: box.event_queue_server.x + box.event_queue_server.w * 0.03,
            //   y: box.event_queue_server.y + box.event_queue_server.h * 0.05,
            //   w: box.event_queue_server.w * 0.94,
            //   h: box.event_queue_server.h * 0.8,
            //   marg: svg_dims.w[0] * 0.01
            // }
            //
            // gBlockBox = svg.g.append('g')
            //   .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
            // gBlockBox.append('text')
            //   .text('Occured events')
            //   .style('fill', color_theme.medium.text)
            //   .style('font-weight', '')
            //   .style('font-size', '8px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(-5,' + (adjustedBox.h * 0.5) + ') rotate(270)')
            //
            // eventQueue.init({
            //   main: {
            //     tag: 'eventQueueDefaultTag',
            //     g: gBlockBox,
            //     box: adjustedBox,
            //     background: {
            //       fill: color_theme.dark.background,
            //       stroke: color_theme.dark.stroke,
            //       strokeWidth: 0.1
            //     },
            //     color_theme: color_theme
            //   },
            //   tag: 'eventQueueDefaultTag',
            //   g: gBlockBox,
            //   box: adjustedBox,
            //   axis: {
            //     enabled: true,
            //     group: {
            //       g: undefined,
            //       box: {x: 0, y: 0, w: adjustedBox.w, h: 0, marg: 0}
            //     },
            //     axis: undefined,
            //     scale: undefined,
            //     domain: [0, 1000],
            //     range: [0, 0],
            //     showText: true,
            //     orientation: 'axisTop'
            //   },
            //   blocks: {
            //     enabled: true,
            //     group: {
            //       g: undefined,
            //       box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
            //     },
            //     events: {
            //       click: () => {},
            //       mouseover: () => {},
            //       mouseout: () => {}
            //     }
            //   },
            //   filters: {
            //     enabled: false,
            //     group: {
            //       g: undefined,
            //       box: {x: adjustedBox.w * 1.03, y: adjustedBox.h * 0, w: adjustedBox.w * 0.22, h: adjustedBox.h * 1, marg: 0},
            //     },
            //     filters: []
            //   },
            //   timeBars: {
            //     enabled: true,
            //     group: {
            //       g: undefined,
            //       box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
            //     }
            //   },
            //   data: {
            //     currentTime: {time: 0, date: undefined},
            //     start_time_sec: {time: 0, date: undefined},
            //     end_time_sec: {time: 0, date: undefined},
            //     lastRawData: undefined,
            //     formatedData: undefined
            //   },
            //   debug: {
            //     enabled: false
            //   }
            // })
            //
            // update_data(data_in)
        }

        function update_data(data_in) {
            if (reserved.main.mode === 'icon') {
                return
            }
            eventQueue.update({
                currentTime: {
                    date: new Date(data_in.time_of_night.date_now),
                    time: Number(data_in.time_of_night.now),
                },
                start_time_sec: {
                    date: new Date(data_in.time_of_night.date_start),
                    time: Number(data_in.time_of_night.start),
                },
                end_time_sec: {
                    date: new Date(data_in.time_of_night.date_end),
                    time: Number(data_in.time_of_night.end),
                },
                data: data_in.external_events[0],
            })
        }
        this.update_data = update_data
    }
    let SvgTelescopes = function() {
        let reserved = {
            main: {
                g: undefined,
                mode: 'icon',
            },
            back: {
                g: undefined,
            },
            icon: {
                g: undefined,
            },
            title: {
                g: undefined,
            },
            filter: {
                g: undefined,
            },
            content: {
                g: undefined,
            },
        }

        function dummy() {
            reserved.plot.main.g
                .append('rect')
                .attr('x', reserved.plot.main.box.x)
                .attr('y', reserved.plot.main.box.y)
                .attr('width', reserved.plot.main.box.w)
                .attr('height', reserved.plot.main.box.h)
                .attr('fill', color_theme.darker.background)
                .attr('stroke', color_theme.darker.stroke)
                .attr('stroke-width', 0.2)
        }

        function initFilters() {
            function createSystemsHealthFilter(key, box) {
                reserved.filters.g
                    .append('text')
                    .text(key)
                    .style('fill', color_theme.medium.text)
                    .style('font-weight', '')
                    .style('font-size', '7px')
                    .attr('text-anchor', 'middle')
                    .attr(
                        'transform',
                        'translate('
              + (box.x + box.w * 0.5)
              + ','
              + (box.y + box.h - box.w * 0.6)
              + ')'
                    )
                reserved.filters.g
                    .append('rect')
                    .attr('x', box.x + box.w * 0.325)
                    .attr('y', box.y + box.h - box.w * 0.5)
                    .attr('width', box.w * 0.35)
                    .attr('height', box.w * 0.35)
                    .attr('fill', color_theme.medium.background)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)

                reserved.filters.g
                    .append('rect')
                    .attr('x', box.x + box.w * 0.35)
                    .attr('y', box.y - box.w * 0.1)
                    .attr('width', box.w * 0.3)
                    .attr('height', box.w * 0.1)
                    .attr('fill', color_theme.dark.background)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)
                reserved.filters.g
                    .append('line')
                    .attr('x1', box.x + box.w * 0.5)
                    .attr('y1', box.y)
                    .attr('x2', box.x + box.w * 0.5)
                    .attr('y2', box.y + box.h - box.w * 1.25)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)
                reserved.filters.g
                    .append('rect')
                    .attr('x', box.x + box.w * 0.35)
                    .attr('y', box.y + box.h - box.w * 1.25)
                    .attr('width', box.w * 0.3)
                    .attr('height', box.w * 0.1)
                    .attr('fill', color_theme.dark.background)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)

                let height = box.h - box.w * 1.25
                reserved.filters.g
                    .append('rect')
                    .attr('x', box.x + box.w * 0.5 + box.w * 0.1)
                    .attr('y', box.y + height - height * 0.75 - box.w * 0.125)
                    .attr('width', box.w * 0.25)
                    .attr('height', box.w * 0.25)
                    .attr('fill', color_theme.medium.background)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)
                reserved.filters.g
                    .append('rect')
                    .attr('x', box.x + box.w * 0.5 + box.w * 0.1)
                    .attr('y', box.y + height - height * 0.5 - box.w * 0.125)
                    .attr('width', box.w * 0.25)
                    .attr('height', box.w * 0.25)
                    .attr('fill', color_theme.medium.background)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)
            }
            reserved.filters = {
                g: reserved.gBlockBox.append('g'),
                box: {
                    x: box.telescopes.w * 0.4 - box.telescopes.marg * 2.5,
                    y: box.telescopes.marg * 3,
                    w: box.telescopes.w * 0.19 + box.telescopes.marg * 2,
                    h: box.telescopes.h * 0.8 - 6 * box.telescopes.marg,
                    marg: box.telescopes.marg,
                },
            }
            reserved.filters.g.attr(
                'transform',
                'translate('
          + reserved.filters.box.x
          + ','
          + reserved.filters.box.y
          + ')'
            )
            // reserved.filters.g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', reserved.filters.box.w)
            //   .attr('height', reserved.filters.box.h)
            //   .attr('fill', color_theme.darker.background)
            //   .attr('stroke', color_theme.darker.stroke)
            //   .attr('stroke-width', 0.2)

            reserved.filters.g
                .append('text')
                .text('Tels types:')
                .style('fill', color_theme.medium.text)
                .style('font-weight', '')
                .style('font-size', '8px')
                .attr('text-anchor', 'middle')
                .attr(
                    'transform',
                    'translate('
            + reserved.filters.box.w * 0.5
            + ','
            + reserved.filters.box.h * 0.06
            + ')'
                )

            reserved.filters.g
                .append('text')
                .text('LTs:')
                .style('fill', color_theme.medium.text)
            // .style('stroke', color_theme.medium.text)
            // .style('stroke-size', 0.1)
                .style('font-weight', '')
                .style('font-size', '7px')
                .attr('text-anchor', 'start')
                .attr(
                    'transform',
                    'translate('
            + reserved.filters.box.w * 0.09
            + ','
            + reserved.filters.box.h * 0.16
            + ')'
                )
            reserved.filters.g
                .append('rect')
                .attr('x', reserved.filters.box.w * (0.03 + 0.18))
                .attr('y', reserved.filters.box.h * 0.1)
                .attr('width', reserved.filters.box.h * 0.07)
                .attr('height', reserved.filters.box.h * 0.07)
                .attr('fill', color_theme.medium.background)
                .attr('stroke', color_theme.darker.stroke)
                .attr('stroke-width', 0.2)

            reserved.filters.g
                .append('text')
                .text('MTs:')
                .style('fill', color_theme.medium.text)
            // .style('stroke', color_theme.medium.text)
            // .style('stroke-size', 0.1)
                .style('font-weight', '')
                .style('font-size', '7px')
                .attr('text-anchor', 'start')
                .attr(
                    'transform',
                    'translate('
            + reserved.filters.box.w * 0.36
            + ','
            + reserved.filters.box.h * 0.16
            + ')'
                )
            reserved.filters.g
                .append('rect')
                .attr('x', reserved.filters.box.w * (0.36 + 0.15))
                .attr('y', reserved.filters.box.h * 0.1)
                .attr('width', reserved.filters.box.h * 0.07)
                .attr('height', reserved.filters.box.h * 0.07)
                .attr('fill', color_theme.medium.background)
                .attr('stroke', color_theme.darker.stroke)
                .attr('stroke-width', 0.2)

            reserved.filters.g
                .append('text')
                .text('STs:')
                .style('fill', color_theme.medium.text)
            // .style('stroke', color_theme.medium.text)
            // .style('stroke-size', 0.1)
                .style('font-weight', '')
                .style('font-size', '7px')
                .attr('text-anchor', 'start')
                .attr(
                    'transform',
                    'translate('
            + reserved.filters.box.w * 0.66
            + ','
            + reserved.filters.box.h * 0.16
            + ')'
                )
            reserved.filters.g
                .append('rect')
                .attr('x', reserved.filters.box.w * (0.66 + 0.13))
                .attr('y', reserved.filters.box.h * 0.1)
                .attr('width', reserved.filters.box.h * 0.07)
                .attr('height', reserved.filters.box.h * 0.07)
                .attr('fill', color_theme.medium.background)
                .attr('stroke', color_theme.darker.stroke)
                .attr('stroke-width', 0.2)

            reserved.filters.g
                .append('text')
                .text('Systems & health:')
                .style('fill', color_theme.medium.text)
                .style('font-weight', '')
                .style('font-size', '8px')
                .attr('text-anchor', 'middle')
                .attr(
                    'transform',
                    'translate('
            + reserved.filters.box.w * 0.5
            + ','
            + reserved.filters.box.h * 0.3
            + ')'
                )

            createSystemsHealthFilter('Cam', {
                x: 0,
                y: reserved.filters.box.h * 0.4,
                w: reserved.filters.box.w * 0.25,
                h: reserved.filters.box.h * 0.6,
            })
            createSystemsHealthFilter('Mir', {
                x: reserved.filters.box.w * 0.25,
                y: reserved.filters.box.h * 0.4,
                w: reserved.filters.box.w * 0.25,
                h: reserved.filters.box.h * 0.6,
            })
            createSystemsHealthFilter('Mou', {
                x: reserved.filters.box.w * 0.5,
                y: reserved.filters.box.h * 0.4,
                w: reserved.filters.box.w * 0.25,
                h: reserved.filters.box.h * 0.6,
            })
            createSystemsHealthFilter('Aux', {
                x: reserved.filters.box.w * 0.75,
                y: reserved.filters.box.h * 0.4,
                w: reserved.filters.box.w * 0.25,
                h: reserved.filters.box.h * 0.6,
            })
        }
        function initView() {
            function createarr_zoomer_button() {
                reserved.view.main.g
                    .append('rect')
                    .attr(
                        'x',
                        reserved.view.main.box.x + reserved.view.main.box.marg * 1.2
                    )
                    .attr('y', reserved.view.main.box.y)
                    .attr('width', 1.8 * reserved.view.main.box.marg)
                    .attr('height', 1.8 * reserved.view.main.box.marg)
                    .attr('fill', color_theme.darker.background)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)
            }
            function createList_button() {
                reserved.view.main.g
                    .append('rect')
                    .attr(
                        'x',
                        reserved.view.main.box.x + reserved.view.main.box.marg * 1.2
                    )
                    .attr(
                        'y',
                        reserved.view.main.box.y + 1.8 * reserved.view.main.box.marg
                    )
                    .attr('width', 1.8 * reserved.view.main.box.marg)
                    .attr('height', 1.8 * reserved.view.main.box.marg)
                    .attr('fill', color_theme.darker.background)
                    .attr('stroke', color_theme.darker.stroke)
                    .attr('stroke-width', 0.2)
            }
            reserved.view = {
                main: {
                    g: reserved.gBlockBox.append('g'),
                    box: {
                        x: 0,
                        y: 0,
                        w: box.telescopes.w * 0.5,
                        h: box.telescopes.h * 1,
                        marg: box.telescopes.marg,
                    },
                },
                telsList: {
                    g: reserved.gBlockBox.append('g'),
                    box: {
                        x: box.telescopes.marg * 1 + box.telescopes.w * 0.0,
                        y: box.telescopes.marg * 2 + box.telescopes.h * 0.0,
                        w: box.telescopes.w * 0.4 - box.telescopes.marg * 4,
                        h: box.telescopes.h * 0.8 - box.telescopes.marg * 4,
                        marg: box.telescopes.marg,
                    },
                    // box: {
                    //   x: box.telescopes.marg * 4,
                    //   y: box.telescopes.marg * 2,
                    //   w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
                    //   h: box.telescopes.h * 0.9 - 4 * box.telescopes.marg,
                    //   marg: box.telescopes.marg
                    // }
                },
                projection: 'arr_zoomer', // 'list'
            }

            reserved.view.main.g.attr(
                'transform',
                'translate('
          + reserved.view.main.box.x
          + ','
          + reserved.view.main.box.y
          + ')'
            )
            reserved.view.telsList.g.attr(
                'transform',
                'translate('
          + reserved.view.telsList.box.x
          + ','
          + reserved.view.telsList.box.y
          + ')'
            )

            // reserved.view.telsList.g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', reserved.view.telsList.box.w)
            //   .attr('height', reserved.view.telsList.box.h)
            //   .attr('fill', color_theme.darker.stroke)
            //   .attr('stroke', color_theme.darker.stroke)
            //   .attr('stroke-width', 0.2)

            // createarr_zoomer_button()
            // createList_button()

            // let telsArray = new TelsArray({
            //   main: {
            //     tag: 'telsArrayTag',
            //     g: reserved.view.main.g,
            //     box: {x: reserved.view.main.box.x + 3 * reserved.view.main.box.marg,
            //       y: reserved.view.main.box.y,
            //       w: reserved.view.main.box.w - 2 * reserved.view.main.box.marg,
            //       h: reserved.view.main.box.h,
            //       marg: 0},
            //     color_theme: color_theme
            //   },
            //   dataPanel: {
            //     g: undefined,
            //     box: {x: 0,
            //       y: 0,
            //       w: reserved.view.main.box.w - 2 * reserved.view.main.box.marg,
            //       h: reserved.view.main.box.h,
            //       marg: 0},
            //     zoomable: true,
            //     telsId: true,
            //     event: {
            //       click: () => {},
            //       mouseover: () => {},
            //       mouseout: () => {}
            //     }
            //   },
            //   optionsPanel: {
            //     g: undefined,
            //     box: {x: 0, y: 0, w: 100, h: 100, marg: 0}
            //   },
            //   focusOverlay: {
            //     enabled: true,
            //     g: undefined
            //   },
            //   highlightOverlay: {
            //     enabled: true,
            //     g: undefined
            //   },
            //   time: {
            //     currentTime: shared.data.server.time_of_night.now
            //   },
            //   data: {
            //     raw: {
            //       blocks: [],
            //       tel_ids: []
            //     }
            //   },
            //   debug: {
            //     enabled: false
            //   }
            // })
            // telsArray.init()
            updateTelsList()
        }
        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_data() {
            reserved.main.g = svg.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.tels_queue_server.x
            + ','
            + box.tels_queue_server.y
            + ')'
                )

            reserved.icon.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.tels_queue_server_icon.x
            + ','
            + box.tels_queue_server_icon.y
            + ')'
                )
                .attr('opacity', 1)
            reserved.title.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.tels_queue_server_title.x
            + ','
            + box.tels_queue_server_title.y
            + ')'
                )
            reserved.filter.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.tels_queue_server_filter.x
            + ','
            + box.tels_queue_server_filter.y
            + ')'
                )
            reserved.content.g = reserved.main.g
                .append('g')
                .attr(
                    'transform',
                    'translate('
            + box.tels_queue_server_content.x
            + ','
            + box.tels_queue_server_content.y
            + ')'
                )

            let lineGenerator = d3
                .line()
                .x(function(d) {
                    return d.x
                })
                .y(function(d) {
                    return d.y
                })
                .curve(d3.curveLinear)
            let depth = 2
            let dataPointFuturTop = [
                {
                    x: 0,
                    y: 0,
                },
                {
                    x: -depth,
                    y: depth,
                },
                {
                    x: -depth,
                    y: box.tels_queue_server_icon.h + depth,
                },
                {
                    x: box.tels_queue_server_icon.w - depth,
                    y: box.tels_queue_server_icon.h + depth,
                },
                {
                    x: box.tels_queue_server_icon.w + 0,
                    y: box.tels_queue_server_icon.h,
                },
                {
                    x: 0,
                    y: box.tels_queue_server_icon.h,
                },
                {
                    x: -depth,
                    y: box.tels_queue_server_icon.h + depth,
                },
                {
                    x: 0,
                    y: box.tels_queue_server_icon.h,
                },
                {
                    x: 0,
                    y: 0,
                },
            ]
            reserved.icon.g
                .append('path')
                .data([ dataPointFuturTop ])
                .attr('d', lineGenerator)
                .attr('fill', color_theme.darker.background)
                .attr('stroke', color_theme.darker.stroke)
                .attr('stroke-width', 0.2)
            reserved.icon.g
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.tels_queue_server_icon.w)
                .attr('height', box.tels_queue_server_icon.h)
                .attr('fill', color_theme.bright.background)
                .attr('stroke', color_theme.bright.stroke)
                .attr('stroke-width', 0.2)
                .on('mouseover', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('fill', color_theme.dark.background)
                })
                .on('mouseout', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('fill', color_theme.bright.background)
                })
                .on('click', function() {
                    d3
                        .select(this)
                        .transition()
                        .duration(times.anim)
                        .attr('x', -5)
                        .attr('y', 5)
                    reserved.icon.g
                        .transition()
                        .duration(times.anim)
                        .attr('opacity', 0)
                        .on('end', function() {
                            reserved.main.mode = 'expand'
                            drawTels()
                        })
                })
            reserved.icon.g
                .append('svg:image')
                .attr('xlink:href', '/static/icons/telescope.svg')
                .attr('width', box.tels_queue_server_icon.w * 0.6)
                .attr('height', box.tels_queue_server_icon.h * 0.6)
                .attr('x', box.tels_queue_server_icon.w * 0.2)
                .attr('y', box.tels_queue_server_icon.h * 0.2)
                .style('pointer-telss', 'none')
        }
        this.init_data = init_data

        function drawTels() {
            reserved.adjustedBox = {
                x: box.telescopes.marg,
                y: box.telescopes.marg,
                w: box.telescopes.w - 2 * box.telescopes.marg,
                h: box.telescopes.h - 2 * box.telescopes.marg,
                marg: box.telescopes.marg,
            }
            reserved.gBlockBox = svg.g
                .append('g')
                .attr(
                    'transform',
                    'translate(' + box.telescopes.x + ',' + box.telescopes.y + ')'
                )
            // reserved.gBlockBox.append('rect')
            //   .attr('x', reserved.adjustedBox.x)
            //   .attr('y', reserved.adjustedBox.y)
            //   .attr('width', reserved.adjustedBox.w)
            //   .attr('height', reserved.adjustedBox.h)
            //   .attr('fill', color_theme.dark.background)
            //   .attr('stroke', color_theme.dark.stroke)
            //   .attr('stroke-width', 0.2)

            reserved.plot = {
                main: {
                    g: reserved.gBlockBox.append('g'),
                    box: {
                        x: box.telescopes.w * 0.5 + box.telescopes.marg * 4,
                        y: box.telescopes.marg * 2,
                        w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
                        h: box.telescopes.h * 0.8 - 4 * box.telescopes.marg,
                        marg: box.telescopes.marg,
                    },
                },
            }

            // reserved.gBlockBox.append('text')
            //   .text('Unused Telescopes')
            //   .style('fill', color_theme.dark.text)
            //   .style('font-weight', 'normal')
            //   .style('font-size', '8px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(4,' + (reserved.view.main.box.h * 0.5) + ') rotate(270)')
            // reserved.view.main.g = reserved.gBlockBox.append('g')
            //   .attr('transform', 'translate(' + reserved.view.main.box.marg + ',0)')
            initView()
            initFilters()
            dummy()
        }

        function updateTelsList() {
            function strokeSize(val) {
                return 0.4 // (2 - (2 * (val / 100)))
            }
            function fill_opacity(val) {
                return 1 // (0.9 - (0.5 * (val / 100)))
            }

            let tels = deep_copy(shared.data.server.inst_health)
            let defaultHeightView = reserved.view.telsList.box.h
            let widthBlocks = reserved.view.telsList.box.w
            // let offsetX = (box.current_blocks.w - widthBlocks) * 0.5

            let telsPerRow = 8
            let sizeTelsRow = 0.0715
            let offsetTelsType = 0.5

            let ratio = 1

            let off = 0
            if (tels.length > 0 && tels[0].id.split('_')[0] === 'M') {
                off -= 1
            }
            if (tels.length > 0 && tels[0].id.split('_')[0] === 'S') {
                off -= 2
            }

            let telsBox = {
                x: reserved.view.telsList.box.marg,
                y: reserved.view.telsList.box.marg,
                w: widthBlocks,
                h: defaultHeightView,
            }
            let offset = {
                x: telsBox.w / telsPerRow,
                ty: ratio * offsetTelsType * sizeTelsRow * defaultHeightView,
                y: ratio * sizeTelsRow * defaultHeightView,
            }

            let currentTels = reserved.view.telsList.g
                .selectAll('g.currentTel')
                .data(tels, function(d) {
                    return d.id
                })
            let enterCurrentTels = currentTels
                .enter()
                .append('g')
                .attr('class', 'currentTel')
            enterCurrentTels.each(function(d, i) {
                let toff = off
                if (d.id.split('_')[0] === 'M') {
                    toff += 1
                }
                if (d.id.split('_')[0] === 'S') {
                    toff += 2
                }

                d3.select(this).attr('transform', function(d) {
                    let tx
            = -(parseInt((i + toff) / telsPerRow) % 2) === 0
                ? offset.x * (0.5 + (i + toff) % telsPerRow)
                : offset.x * (0.0 + telsPerRow)
                - offset.x * (0.5 + (i + toff) % telsPerRow)
                    if (toff % 2 === 1) {
                        tx += offset.x
                    }
                    let ty
            = offset.y * (0.5 + parseInt((i + toff) / telsPerRow))
            + toff * offset.ty
                    return 'translate(' + tx + ',' + ty + ')'
                })
                d3
                    .select(this)
                    .append('rect')
                    .attr('x', function(d) {
                        return -offset.x * 0.5 + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
                    })
                    .attr('y', function(d) {
                        return -offset.y * 0.5 + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
                    })
                    .attr('width', function(d) {
                        return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
                    })
                    .attr('height', function(d) {
                        return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
                    })
                    .attr('fill', function(d) {
                        return inst_health_col(d.val)
                    })
                    .attr('fill-opacity', function(d) {
                        return fill_opacity(d.val)
                    })
                    .attr('stroke-width', function(d) {
                        return strokeSize(d.val)
                    })
                    .attr('stroke', function(d) {
                        return inst_health_col(d.val)
                    })
                    .attr('stroke-opacity', function(d) {
                        return 1
                    })
                d3
                    .select(this)
                    .append('text')
                    .attr('x', 0)
                    .attr('y', offset.y * 0.2)
                    .attr('dy', 0)
                    .text(function(d) {
                        return d.id // d.id.split('_')[1]
                    })
                    .style('fill', color_theme.blocks.run.text)
                    .style('font-weight', 'normal')
                    .style('font-size', function(d) {
                        return 6.2 // - (2 * (d.val / 100))
                    })
                    .attr('text-anchor', 'middle')
            })

            let mergeCurrentTels = currentTels.merge(enterCurrentTels)
            mergeCurrentTels.each(function(d, i) {
                let toff = off
                if (d.id.split('_')[0] === 'M') {
                    toff += 1
                }
                if (d.id.split('_')[0] === 'S') {
                    toff += 2
                }

                d3
                    .select(this)
                    .attr('transform', function(d) {
                        let tx
              = -(parseInt((i + toff) / telsPerRow) % 2) === 0
                  ? offset.x * (0.5 + (i + toff) % telsPerRow)
                  : offset.x * (0.0 + telsPerRow)
                  - offset.x * (0.5 + (i + toff) % telsPerRow)
                        // if (toff % 2 === 1) tx += 2 * offset.x
                        let ty
              = offset.y * (0.5 + parseInt((i + toff) / telsPerRow))
              + toff * offset.ty
                        return 'translate(' + tx + ',' + ty + ')'
                    })
                    .style('opacity', function() {
                        if (!d.running) {
                            return 1
                        }
                        return 0.4
                    })
                d3
                    .select(this)
                    .select('rect')
                    .transition()
                    .duration(times.anim)
                    .attr('x', function(d) {
                        return -offset.x * 0.5 + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
                    })
                    .attr('y', function(d) {
                        return -offset.y * 0.5 + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
                    })
                    .attr('width', function(d) {
                        return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
                    })
                    .attr('height', function(d) {
                        return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
                    })
                    .attr('fill', function(d) {
                        if (!d.running) {
                            return inst_health_col(d.val)
                        }
                        return color_theme.dark.background
                    })
                // .attr('fill-opacity', function (d) {
                //   return fill_opacity(d.val)
                // })
                    .attr('stroke-width', function(d) {
                        return strokeSize(d.val)
                    })
                    .attr('stroke', function(d) {
                        // if (!d.running) return inst_health_col(d.val)
                        return color_theme.dark.stroke
                    })
                // .attr('stroke-opacity', function (d) {
                //   if (!d.running) return 1
                //   return 1
                // })
                d3
                    .select(this)
                    .select('text')
                    .attr('x', 0)
                    .attr('y', offset.y * 0.2)
                    .attr('dy', 0)
                    .text(function(d) {
                        return d.id // d.id.split('_')[1]
                    })
                    .style('fill', color_theme.blocks.run.text)
                    .style('font-weight', 'normal')
                    .style('font-size', function(d) {
                        return 6.2 // - (2 * (d.val / 100))
                    })
                    .attr('text-anchor', 'middle')
            })

            currentTels
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        this.updateTelsList = updateTelsList
        function update_data(data_in) {}
        this.update_data = update_data
    }
    let SvgDAQ = function() {
        function init() {}
        this.init = init
    }
    // let SvgBottom_info = function () {
    //   let gBlockBox
    //   let clockEvents
    //
    //   function init_data (data_in) {
    //     gBlockBox = svg.g.append('g')
    //
    //     clockEvents = new ClockEvents()
    //     clockEvents.init({
    //       g: gBlockBox,
    //       box: box.clock,
    //       color_theme: color_theme.medium
    //     })
    //     clockEvents.setHour(new Date(com.data_in.data.time_of_night.date_now))
    //     clockEvents.setSend_function(function (date) {
    //       block_queue_server.addExtraBar(date)
    //       eventQueue.addExtraBar(date)
    //     })
    //     clockEvents.addEvent(com.data_in.data.external_clock_events[0])
    //
    //     // let startEvent = new Date(com.data_in.data.time_of_night.now).getTime() + ((Math.random() * 3) + 2) * 60000
    //     // let endEvent = new Date(startEvent).getTime() + 10000
    //     // clockEvents.addEvent({id: 'E' + Math.floor(Math.random() * 1000000), name: 'moonrise', icon: null, start_time_sec: startEvent, end_time_sec: endEvent})
    //   }
    //   this.init_data = init_data
    //
    //   function update_data (data_in) {
    //     clockEvents.setHour(new Date(com.data_in.data.time_of_night.date_now))
    //     clockEvents.addEvent(com.data_in.data.external_clock_events[0])
    //     // let rnd = Math.random()
    //     // if (rnd < 0.8) {
    //     //   let startEvent = new Date(com.data_in.data.time_of_night.now).getTime() + ((Math.random() * 3) + 0.4) * 60000
    //     //   let endEvent = new Date(startEvent).getTime() + 10000
    //     //   clockEvents.addEvent({id: Math.floor(Math.random() * 100000), name: 'moonrise', icon: null, start_time_sec: startEvent, end_time_sec: endEvent})
    //     // }
    //   }
    //   this.update_data = update_data
    // }

    let svg_blocks_queue_server = new Svg_blocks_queue_server()
    let svgEvents = new SvgEvents()
    let svgTelescopes = new SvgTelescopes()
    let svgsAQ = new SvgDAQ()
    let svgTextEditor = new SvgTextEditor()
    // let svgTels = new SvgTels()
    // let svgFilterBlocks = new SvgFilterBlocks()
    // let svgFilterTels = new SvgFilterTels()
    // let svgMiddle_info = new SvgMiddle_info()
    // let svgBottom_info = new SvgBottom_info()
}
