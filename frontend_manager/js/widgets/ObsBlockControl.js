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
var main_script_tag = 'ObsBlockControl'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global tau */
/* global sock */
/* global times */
/* global is_def */
/* global tel_info */
/* global RunLoop */
/* global Locker */
/* global cols_yellows */
/* global cols_purples */
/* global dom_add */
/* global run_when_ready */
/* global BlockQueueOld */
/* global disable_scroll_svg */
/* global bck_pattern */
/* global deep_copy */
/* global ScrollBox */
/* global ScrollTable */
/* global FormManager */
/* global TEL_STATES */
/* global get_tel_state */
/* global inst_health_col */
/* global tel_state_color */
/* global inst_health_frac */
/* global ScrollGrid */
/* global cols_blocks */
/* global TEL_STATES */

window.load_script({
    source: main_script_tag,
    script: '/js/utils/ScrollBox.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/ScrollGrid.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/BlockQueueOld.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/ScrollTable.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/FormManager.js',
})

// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 12
    let w0 = 12
    let div_key = 'main'

    opt_in.widget_func = {
        sock_func: sock_obs_block_control,
        main_func: main_obs_block_control,
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
let sock_obs_block_control = function(opt_in) {}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go with the content of this particular widget
// -------------------------------------------------------------------
let main_obs_block_control = function(opt_in) {
    // let my_unique_id = unique()
    let widget_type = opt_in.widget_type
    let tag_arr_zoomerPlotsSvg = opt_in.base_name
    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    // let this_obs_block_control = this
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


    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init_data(data_in) {
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

        svg_main.init_data(data_in.data)
    }
    this.init_data = init_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_data(data_in) {
        svg_main.update_data(data_in.data)
    }
    this.update_data = update_data

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
    //
    // -------------------------------------------------------------------
    let prev_sync = {
    }
    function update_sync_state(data_in) {
        if (document.hidden) {
            return
        }
        if (sock.con_stat.is_offline()) {
            return
        }

        let sess_widget_ids = data_in.metadata.sess_widget_ids
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
    this.update_sync_state = update_sync_state

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let SvgMain = function() {
        let com = {
        }
        let svg = {
        }
        // let thisMain = this

        com.focus = {
        }

        let svg_dims = {
        }
        svg_dims.w = {
        }
        svg_dims.h = {
        }
        svg_dims.w[0] = 1000
        svg_dims.h[0] = svg_dims.w[0] / sgv_tag.main.whRatio

        let tagObsBlkCnt = widget_type
        let tagBlockQueueOld = tagObsBlkCnt + 'blockQueueOld'
        let tagBlockTitle = tagObsBlkCnt + 'blockTitle'
        let tagTelScroll = tagObsBlkCnt + 'telScroll'
        let tagObScroll = tagObsBlkCnt + 'obScroll'
        let tagTtelSummary = tagObsBlkCnt + 'telSummary'
        let tagScroller = tagObsBlkCnt + 'scrollBox'
        let tagScrollTable = tagObsBlkCnt + 'scrollTable'
        let tagFormManager = tagObsBlkCnt + 'formManager'

        let blockQueueOld = new BlockQueueOld()
        let telScroll = new TelScroll()
        let obScroll = new _obScroll()
        let telSummary = new TelSummary()
        let scrollBox = new ScrollBox()
        let scrollTable = new ScrollTable()
        let formManager = new FormManager()
        let utils = new obs_block_control_utils()

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_data(data_in) {
            // -------------------------------------------------------------------
            // create the main svg element
            // -------------------------------------------------------------------
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

            svg.svg = d3
                .select(svg_div)
                .style('background', '#383B42')
                .append('svg')
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .attr('viewBox', '0 0 ' + svg_dims.w[0] + ' ' + svg_dims.h[0])
                .style('position', 'relative')
                .style('width', '100%')
                .style('height', '100%')
                .style('top', '0px')
                .style('left', '0px')
            // .attr("viewBox", "0 0 "+svg_dims.w[0]+" "+svg_dims.h[0] * whRatio)
            // .classed("svgInGridStack_inner", true)
                .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
            // .call(com.svg_zoom)
                .on('dblclick.zoom', null)

            if (disable_scroll_svg) {
                svg.svg.on('wheel', function() {
                    d3.event.preventDefault()
                })
            }

            com.svg_zoom_node = svg.svg.nodes()[0]

            svg.g = svg.svg.append('g')

            // add one rect as background
            // -------------------------------------------------------------------
            svg.g
                .append('g')
                .selectAll('rect')
                .data([ 0 ])
                .enter()
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', svg_dims.w[0])
                .attr('height', svg_dims.h[0])
                .attr('fill', '#F2F2F2')

            com.get_scaleWH = function() {
                return {
                    w: svg_dims.w[0] / +svg.svg.node().getBoundingClientRect().width,
                    h: svg_dims.h[0] / +svg.svg.node().getBoundingClientRect().height,
                }
            }

            // the background grid
            bck_pattern({
                com: com,
                g_now: svg.g,
                g_tag: 'hex',
                len_wh: [ svg_dims.w[0], svg_dims.h[0] ],
                opac: 0.1,
                hex_r: 15,
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let x0, y0, w0, h0, marg
            let gBlockTitle = svg.g.append('g')

            w0 = svg_dims.w[0] * 0.95
            h0 = svg_dims.w[0] * 0.025
            x0 = (svg_dims.w[0] - w0) / 2
            y0 = x0
            marg = w0 * 0.01

            let blockTitleData = {
                id: tagBlockTitle,
                g: gBlockTitle,
                size: h0 * 0.8,
                x: x0,
                y: y0,
                w: w0,
                h: h0,
                marg: marg,
            }
            com.blockTitleData = blockTitleData

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let gBlockBox = svg.g.append('g')

            w0 = blockTitleData.w * 0.6
            h0 = blockTitleData.h * 4.5
            x0 = blockTitleData.x + (1 - w0 / blockTitleData.w) * blockTitleData.w
            y0 = blockTitleData.y + blockTitleData.h + blockTitleData.marg
            marg = blockTitleData.marg

            let blockBoxData = {
                x: x0,
                y: y0,
                w: w0,
                h: h0,
                marg: marg,
            }

            blockQueueOld.init({
                tag: tagBlockQueueOld,
                g_box: gBlockBox,
                doPhase: false,
                doText: true,
                style: {
                    recCol: function(opt_in) {
                        if (opt_in.d.id === blockQueueOld.get('focus_id')) {
                            return cols_purples[1]
                        }
                        else {
                            return cols_yellows[2]
                        }
                    },
                    recFillOpac: function(d, state) {
                        if (d.id === blockQueueOld.get('focus_id')) {
                            return 0.5
                        }
                        else if (state === 'run') {
                            return 0.3
                        }
                        else {
                            return 0.1
                        }
                    },
                    textOpac: function(d) {
                        return d.id === blockQueueOld.get('focus_id') ? 1 : 0
                    },
                },
                futureCanceled: {
                    hide: false,
                    shift_y: false,
                },
                click: function(d) {
                    block_focus({
                        id: d.id,
                    })
                },
                box_data: blockBoxData,
                locker: locker,
                lockers: [ tagObsBlkCnt + 'update_data' ],
                lock_zoom: {
                    all: tagBlockQueueOld + 'zoom',
                    during: tagBlockQueueOld + 'zoom_during',
                    end: tagBlockQueueOld + 'zoom_end',
                },
                run_loop: run_loop,
            })

            let blockQueueOldBox = blockQueueOld.get('outer_box')

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let gObBox = svg.g.append('g')

            w0 = (1 - w0 / blockTitleData.w) * blockTitleData.w - blockTitleData.marg // w0/=3
            h0 = blockQueueOldBox.h
            x0 = blockTitleData.x
            y0 = blockQueueOldBox.y
            marg = blockQueueOldBox.marg

            let obScrolBoxData = {
                x: x0,
                y: y0,
                w: w0,
                h: h0,
                marg: marg,
            }

            obScroll.init({
                tag: tagObScroll,
                g_box: gObBox,
                box_data: obScrolBoxData,
                show_counts: true,
                vor_click: function(d) {
                    block_focus({
                        id: d.id,
                    })
                },
                lockers: [ tagObsBlkCnt + 'update_data' ],
                utils: utils,
                run_loop: run_loop,
                locker: locker,
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let gTelBox = svg.g.append('g')

            h0 = blockQueueOldBox.h * 1.25
            w0 = blockTitleData.w - h0 // w0/=3
            x0 = blockTitleData.x
            y0 = blockQueueOldBox.y + blockQueueOldBox.h + 2 * blockQueueOldBox.marg
            marg = blockQueueOldBox.marg

            let telScrolBoxData = {
                x: x0,
                y: y0,
                w: w0,
                h: h0,
                marg: marg,
            }

            telScroll.init({
                tag: tagTelScroll,
                g_box: gTelBox,
                box_data: telScrolBoxData,
                vor_click: function(d) {
                    send_sync_state_to_server({
                        type: 'sync_tel_focus',
                        sync_time: Date.now(),
                        zoom_state: 1,
                        target: d.id,
                    })
                },
                lockers: [ tagObsBlkCnt + 'update_data' ],
                utils: utils,
                run_loop: run_loop,
                locker: locker,
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let gTelSummary = svg.g.append('g')

            h0 = telScrolBoxData.h
            w0 = telScrolBoxData.h - telScrolBoxData.marg
            x0 = telScrolBoxData.x + telScrolBoxData.w + telScrolBoxData.marg
            y0 = telScrolBoxData.y
            marg = telScrolBoxData.marg

            // w0   = telScrolBoxData.w * 0.26;
            // h0   = w0;
            // x0   = telScrolBoxData.w - w0;
            // y0   = telScrolBoxData.y + telScrolBoxData.h + 2 * telScrolBoxData.marg;
            // marg = telScrolBoxData.marg;

            let telSummaryData = {
                x: x0,
                y: y0,
                w: w0,
                h: h0,
                marg: marg,
            }

            telSummary.init({
                tag: tagTtelSummary,
                g_box: gTelSummary,
                utils: utils,
                box_data: telSummaryData,
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let try0 = true
            let scrollTableData
            if (try0) {
                let gScrollTable = svg.g.append('g')

                h0 = telScrolBoxData.h * 2.5
                w0 = blockTitleData.w
                x0 = blockTitleData.x
                y0 = telScrolBoxData.y + telScrolBoxData.h + telScrolBoxData.marg * 3
                marg = telScrolBoxData.marg

                scrollTableData = {
                    x: x0,
                    y: y0,
                    w: w0,
                    h: h0,
                    marg: marg,
                }

                scrollTable.init({
                    tag: tagScrollTable,
                    g_box: gScrollTable,
                    can_scroll: true,
                    use_relative_coords: true,
                    title: {
                        text: 'title...',
                    },
                    box_data: scrollTableData,
                    locker: locker,
                    lockers: [ tagObsBlkCnt + 'update_data' ],
                    lock_zoom: {
                        all: tagBlockQueueOld + 'zoom',
                        during: tagBlockQueueOld + 'zoom_during',
                        end: tagBlockQueueOld + 'zoom_end',
                    },
                    run_loop: run_loop,
                })

                let innerBox = scrollTable.get('innerBox')

                let table = {
                    id: 'xxx',
                    x: innerBox.marg,
                    y: innerBox.marg,
                    marg: innerBox.marg,
                    rowW: innerBox.w,
                    rowH: innerBox.h / 4,
                    rowsIn: [],
                }

                // table.rowsIn.push({ h: 9, cols_in: [{id: '01', w: 0.3}], marg: innerBox.marg })
                table.rowsIn.push({
                    h: 2,
                    cols_in: [
                        {
                            id: '00',
                            w: 0.6,
                            title: 'qwe',
                        },
                        {
                            id: '01',
                            w: 0.3,
                            title: 'qw',
                        },
                    ],
                    marg: innerBox.marg,
                })
                table.rowsIn.push({
                    h: 2,
                    cols_in: [
                        {
                            id: '10',
                            w: 0.5,
                            title: 'qw',
                        },
                        {
                            id: '11',
                            w: 0.5,
                            title: 'qw',
                        },
                    ],
                    marg: innerBox.marg,
                })
                scrollTable.update_table({
                    table: table,
                })

                let inner_g = scrollTable.get('inner_g')
                let tagForms = 'tagForeignObject'

                formManager.init({
                    tag: tagFormManager,
                })

                // table.rec_data = [table.rec_data[0]]
                // let fornObj = inner_g.selectAll("div."+tagForms).data(table.rec_data, function(d) { return d.id; })
                $.each(table.rec_data, function(i, d) {
                    formManager.addForm({
                        id: d.id,
                        data: d,
                        selection: inner_g,
                        formSubFunc: function(opt_in) {
                            console.log('formSubFunc:', opt_in)
                        },
                        tagForm: tagForms,
                        disabled: 0,
                        get_scaleWH: com.get_scaleWH,
                    })
                })
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let try1 = false
            let scrlDataG
            if (try1) {
                // -------------------------------------------------------------------
                //
                // -------------------------------------------------------------------
                let gScrollBox = svg.g.append('g')

                h0 = scrollTableData.h * 0.6
                w0 = blockTitleData.w
                x0 = blockTitleData.x
                y0 = scrollTableData.y + scrollTableData.h + scrollTableData.marg * 3
                marg = scrollTableData.marg

                // w0   = telScrolBoxData.w * 0.26;
                // h0   = w0;
                // x0   = telScrolBoxData.w - w0;
                // y0   = telScrolBoxData.y + telScrolBoxData.h + 2 * telScrolBoxData.marg;
                // marg = telScrolBoxData.marg;

                let scrollBoxData = {
                    x: x0,
                    y: y0,
                    w: w0,
                    h: h0,
                    marg: marg,
                }

                scrollBox.init({
                    tag: tagScroller,
                    g_box: gScrollBox,
                    // style: {
                    //   recCol: function(opt_in) {
                    //     if(opt_in.d.id == blockQueueOld.get('focus_id')) return cols_purples[1];
                    //     else                                        return cols_yellows[2];
                    //   },
                    //   recFillOpac: function(d,state) {
                    //     if(d.id == blockQueueOld.get('focus_id')) return 0.5;
                    //     else if(state == 'run')               return 0.3;
                    //     else                                  return 0.1;
                    //   },
                    //   textOpac: function(d) {
                    //     return (d.id == blockQueueOld.get('focus_id')) ? 1 : 0;
                    //   }
                    // },
                    // futureCanceled: { hide:false, shift_y:false },
                    // click: function(d){ block_focus({ id:d.id }); },
                    can_scroll: true,
                    scroll_height: scrollBoxData.h * 2,
                    use_relative_coords: true,
                    // title: { h:scrollBoxData.h*0.2, text:"asldklksdj" },
                    box_data: scrollBoxData,
                    locker: locker,
                    lockers: [ tagObsBlkCnt + 'update_data' ],
                    lock_zoom: {
                        all: tagBlockQueueOld + 'zoom',
                        during: tagBlockQueueOld + 'zoom_during',
                        end: tagBlockQueueOld + 'zoom_end',
                    },
                    run_loop: run_loop,
                })

                // setTimeout(function() { console.log('xxxxxxxxxxx'); scrollBox.reset_scroller({can_scroll:false}); }, 3000);

                // setTimeout(function() { console.log('xxxxxxxxxxx'); scrollBox.reset_scroller({can_scroll:true, scroll_height: scrollBoxData.h*5}); }, 6000);
                // setTimeout(function() { console.log('xxxxxxxxxxx'); scrollBox.reset_scroller({can_scroll:true, scroll_height: scrollBoxData.h*5/2}); }, 9000);

                // setTimeout(function() { console.log('xxxxxxxxxxx'); let title = scrollBox.get('titleData'); title.text = "77777777"; scrollBox.set({tag:'titleData', data:title}); scrollBox.setTitle(); }, 2000);

                // let scrlBox   = scrollBox.get('innerBox');
                scrlDataG = scrollBox.get('inner_g')

                let dd = [
                    {
                        id: 0,
                        x: 0,
                        y: 0,
                        w: 30,
                        h: 30,
                    },
                    {
                        id: 0,
                        x: 210,
                        y: 110,
                        w: 30,
                        h: 30,
                    },
                    {
                        id: 0,
                        x: 230,
                        y: 160,
                        w: 30,
                        h: 30,
                    },
                    {
                        id: 0,
                        x: 230,
                        y: 460,
                        w: 30,
                        h: 30,
                    },
                ]

                scrlDataG
                    .selectAll('rect.' + tagScroller + 'tagScroller')
                    .data(dd, function(d) {
                        return d.id
                    })
                    .enter()
                    .append('rect')
                    .attr('class', tagScroller + 'tagScroller')
                // .attr("x", function(d,i) { return scrlBox.marg + d.x; })
                // .attr("y", function(d,i) { return scrlBox.marg + d.y; })
                    .attr('x', function(d, i) {
                        return d.x
                    })
                    .attr('y', function(d, i) {
                        return d.y
                    })
                    .attr('width', function(d, i) {
                        return d.w
                    })
                    .attr('height', function(d, i) {
                        return d.h
                    })
                    .attr('stroke', '#383B42')
                    .attr('stroke-width', '1')
                    .attr('stroke-opacity', 0.2)
                    .attr('fill', 'red')
                    .attr('fill-opacity', 1)
                    .style('pointer-events', 'none')
            }

            // -------------------------------------------------------------------
            // time series plot
            // -------------------------------------------------------------------
            let try2 = false
            if (try2) {
                let g = scrlDataG
                let n = 40
                let random = d3.randomNormal(0, 0.2)
                let data = d3.range(n).map(random)
                // let margin = { top: 20, right: 20, bottom: 20, left: 40 }
                let width = w0
                let height = h0

                let x = d3
                    .scaleLinear()
                    .domain([ 1, n - 2 ])
                    .range([ 0, width ])
                let y = d3
                    .scaleLinear()
                    .domain([ -1, 1 ])
                    .range([ height, 0 ])
                let line = d3
                    .line()
                    .curve(d3.curveBasis)
                    .x(function(d, i) {
                        return x(i)
                    })
                    .y(function(d, i) {
                        return y(d)
                    })
                g
                    .append('defs')
                    .append('clipPath')
                    .attr('id', 'clip')
                    .append('rect')
                    .attr('width', width)
                    .attr('height', height)
                g
                    .append('g')
                    .attr('class', 'axis axis--x')
                    .attr('transform', 'translate(0,' + y(0) + ')')
                    .call(d3.axisBottom(x))
                g
                    .append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))

                let tick = function() {
                    // Push a new data point onto the back.
                    data.push(random())
                    // Redraw the line.
                    d3
                        .select(this)
                        .attr('d', line)
                        .attr('transform', null)
                    // Slide it to the left.
                    d3
                        .active(this)
                        .attr('transform', 'translate(' + x(0) + ',0)')
                        .transition()
                        .delay(3000)
                        .on('start', tick)
                    // Pop the old data point off the front.
                    data.shift()
                }

                g
                    .append('g')
                    .attr('clip-path', 'url(#clip)')
                    .append('path')
                    .datum(data)
                    .style('fill', 'transparent')
                    .style('stroke', 'red')
                    .attr('class', 'line')
                    .transition()
                    .duration(200)
                    .ease(d3.easeLinear)
                    .on('start', tick)
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let try3 = false
            if (try3) {
                let schema = {
                    fields: [
                        {
                            name: 'firstName',
                            type: 'text',
                            display: 'First Name',
                        },
                        {
                            name: 'lastName',
                            type: 'text',
                            display: 'Last Name',
                        },
                        {
                            name: 'country',
                            type: 'dropdown',
                            display: 'Country',
                            values: [ 'lebanon', 'france', 'usa' ],
                        },
                    ],
                }

                let ff = scrollTable
                    .get('inner_g')
                    .append('foreignObject')
                    .attr('x', telScrolBoxData.x + telScrolBoxData.w / 3)
                    .attr('y', telScrolBoxData.x)
                    .attr('width', telScrolBoxData.w / 2)
                    .attr('height', telScrolBoxData.h * 2)
                    .append('xhtml:body')

                let form = ff.append('form')

                form
                    .selectAll('p')
                    .data(schema.fields)
                    .enter()
                    .append('p')
                    .each(function(d) {
                        let self = d3.select(this)
                        self
                            .append('label')
                            .text(d.display)
                            .style('width', '100px')
                            .style('display', 'inline-block')

                        if (d.type === 'text') {
                            self.append('input').attr({
                                type: function(d) {
                                    return d.type
                                },
                                name: function(d) {
                                    return d.name
                                },
                            })
                        }

                        if (d.type === 'dropdown') {
                            self
                                .append('select')
                                .attr('name', 'country')
                                .selectAll('option')
                                .data(d.values)
                                .enter()
                                .append('option')
                                .text(function(d) {
                                    return d
                                })
                        }
                    })

                form
                    .append('button')
                    .attr('type', 'submit')
                    .text('Save')

                ff
                    .append('g')
                    .selectAll('rect')
                    .data([ 0 ])
                    .enter()
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', 100)
                    .attr('height', 100)
                    .attr('fill', 'red')
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            update_data_once(data_in)

            // -------------------------------------------------------------------
            // for debugging
            // -------------------------------------------------------------------
            let inDebug = true
            if (inDebug) {
                let blockV = data_in.blocks.done
                if (blockV.length === 0) {
                    blockV = data_in.blocks.run
                }
                if (blockV.length === 0) {
                    blockV = data_in.blocks.wait
                }
                if (blockV.length > 0) {
                    let obs_block_id = blockV[0].obs_block_id
                    com.focus = utils.getFocusBlock({
                        blocks: data_in.blocks,
                        focus_id: obs_block_id,
                    })
                    block_focus({
                        id: com.focus.obs_block_id,
                    })
                }
            }
            // -------------------------------------------------------------------

            run_when_ready({
                pass: function() {
                    return locker.is_free(tagObsBlkCnt + 'update_data')
                },
                execute: function() {
                    locker.remove('in_init')
                },
            })
        }
        this.init_data = init_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        run_loop.init({
            tag: 'update_data',
            func: update_data_once,
            n_keep: 1,
        })

        function update_data(data_in) {
            if (!locker.is_free('in_init')) {
                setTimeout(function() {
                    update_data(data_in)
                }, 10)
                return
            }

            run_loop.push({
                tag: 'update_data',
                data: data_in,
            })
        }

        function update_data_once(data_in) {
            // return;
            if (
                !locker.are_free([
                    tagObsBlkCnt + 'update_data',
                    tagTelScroll + 'zoom',
                    tagBlockQueueOld + 'zoom',
                ])
            ) {
                // console.log('will delay updateRecData',locker.get_actives([tagObsBlkCnt+"update_data_once", tagTelScroll+"_zoom", tagBlockQueueOld+"_zoom"]));
                setTimeout(function() {
                    update_data(data_in)
                }, 10)
                return
            }
            locker.add(tagObsBlkCnt + 'update_data')
            // locker.add({ id:tagObsBlkCnt+"update_data_once", override:true });

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            com.blocks = data_in.blocks
            com.time_of_night = data_in.time_of_night

            let tel_ids = []
            let inst_health = {
            }
            $.each(data_in.inst_health, function(index, data_now) {
                tel_ids.push(data_now.id)
                inst_health[data_now.id] = +data_now.val
            })

            // -------------------------------------------------------------------
            // check if the focued ob is still valid and reset/update accordingly
            // -------------------------------------------------------------------
            if (is_def(com.focus.obs_block_id)) {
                com.focus = utils.getFocusBlock({
                    blocks: com.blocks,
                    focus_id: com.focus.obs_block_id,
                })
            }

            //
            // -------------------------------------------------------------------
            let blocks = {
            }
            if (is_def(com.focus.type) && is_def(com.focus.sb)) {
                blocks[com.focus.type] = com.focus.sb.obV
            }
            blockQueueOld.update(blocks)
            blockQueueOld.set({
                tag: 'tel_ids',
                data: tel_ids,
            })
            blockQueueOld.set({
                tag: 'time',
                data: com.time_of_night,
            })
            blockQueueOld.setTimeRect()

            //
            // -------------------------------------------------------------------
            telScroll.set({
                tag: 'tel_ids',
                data: tel_ids,
            })
            telScroll.set({
                tag: 'inst_health',
                data: inst_health,
            })
            telScroll.update()

            telSummary.set({
                tag: 'inst_health',
                data: inst_health,
            })
            telSummary.update()

            locker.remove({
                id: tagObsBlkCnt + 'update_data',
            })
            // locker.remove({ id:tagObsBlkCnt+"update_data_once", override:true });

            block_focus({
                id: com.focus.obs_block_id,
            })
        }
        this.update_data = update_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        run_loop.init({
            tag: 'block_focus',
            func: block_focus_once,
            n_keep: 1,
        })

        function block_focus(data_in) {
            run_loop.push({
                tag: 'block_focus',
                data: data_in,
            })
        }
        this.block_focus = block_focus

        function block_focus_once(opt_in) {
            if (
                !locker.are_free([
                    tagObsBlkCnt + 'update_data',
                    tagTelScroll + 'zoom',
                    tagBlockQueueOld + 'zoom',
                ])
            ) {
                // console.log('will delay _block_focus_');
                setTimeout(function() {
                    block_focus(opt_in)
                }, 10)
                return
            }
            locker.add(tagObsBlkCnt + 'update_data')
            // console.log(' will run _block_focus_...',opt_in);

            let obs_block_id = is_def(opt_in.id) ? opt_in.id : ''
            com.focus = utils.getFocusBlock({
                blocks: com.blocks,
                focus_id: obs_block_id,
            })

            setBlockTitle()

            // -------------------------------------------------------------------
            if (blockQueueOld.get('focus_id') !== com.focus.obs_block_id) {
                if (is_def(com.focus.type) && is_def(com.focus.sb)) {
                    let blocks = {
                    }
                    blocks[com.focus.type] = com.focus.sb.obV
                    blockQueueOld.update(blocks)
                }
                blockQueueOld.set({
                    tag: 'focus_id',
                    data: com.focus.obs_block_id,
                })
                blockQueueOld.setBlockRect()
            }

            // -------------------------------------------------------------------
            if (obScroll.get('sched_block_id') !== com.focus.sb.sched_block_id) {
                obScroll.set({
                    tag: 'sched_block_id',
                    data: com.focus.sb.sched_block_id,
                })
                obScroll.set({
                    tag: 'obV',
                    data: com.focus.sb.obV,
                    def: [],
                })
                obScroll.update()
            }

            // -------------------------------------------------------------------
            if (telScroll.get('obs_block_id') !== com.focus.obs_block_id) {
                telScroll.set({
                    tag: 'obs_block_id',
                    data: com.focus.obs_block_id,
                })
                telScroll.set({
                    tag: 'obTelIds',
                    data: com.focus.ob.tel_ids,
                    def: [],
                })
                telScroll.update()
            }

            // -------------------------------------------------------------------
            if (telSummary.get('obs_block_id') !== com.focus.obs_block_id) {
                telSummary.set({
                    tag: 'obs_block_id',
                    data: com.focus.obs_block_id,
                })
                telSummary.set({
                    tag: 'tel_ids',
                    data: com.focus.ob.tel_ids,
                    def: [],
                })
                telSummary.update()
            }

            send_sync_state_to_server({
                type: 'syncObFocus',
                sync_time: Date.now(),
                obs_block_id: com.focus.obs_block_id,
            })

            locker.remove({
                id: tagObsBlkCnt + 'update_data',
            })
        }
        // -------------------------------------------------------------------

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function setBlockTitle() {
            let focus_id = com.focus.obs_block_id
            let focusBlock = com.focus.ob
            let data = com.blockTitleData

            let block_name = is_def(focusBlock.metadata)
                ? focusBlock.metadata.block_name
                : null
            let titleText = is_def(block_name)
                ? block_name + ' ... ' + focus_id + ' ... '
                : ''

            if (titleText !== '') {
                let format_int = d3.format('d')
                titleText += (
                    ' [ '
                      + format_int(focusBlock.start_time_sec)
                      + ' -- '
                      + format_int(focusBlock.end_time_sec)
                      + ' ]'
                )
            }

            let text = data.g
                .selectAll('text.' + tagBlockTitle)
                .data([ data ], function(d) {
                    return d.id
                })

            text
                .enter()
                .append('text')
                .attr('class', tagBlockTitle)
                .style('font-weight', 'normal')
                .style('opacity', 0)
                .style('stroke-width', 0)
                .style('fill', '#383b42')
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .attr('text-anchor', 'left')
                .style('font-weight', 'bold')
                .attr('x', function(d) {
                    return d.x + d.marg
                })
                .attr('y', function(d) {
                    return d.y + d.h / 2
                })
                .style('font-size', function(d) {
                    return d.size + 'px'
                })
                .attr('dy', function(d) {
                    return d.size / 3 + 'px'
                })
                .merge(text)
                .transition('in_out')
                .duration(times.anim_txt)
                .text(function(d) {
                    return titleText
                })
                .style('opacity', 1)

            text
                .exit()
                .transition('in_out')
                .duration(times.anim_txt)
                .style('opacity', 0)
                .remove()

            // let blockTitleData = {
            //   id: tagBlockTitle,
            //   x: x0, y: y0, w: w0, h: h0, marg: marg
            // };
        }
    }

    let svg_main = new SvgMain()
}
// -------------------------------------------------------------------
// -------------------------------------------------------------------

// -------------------------------------------------------------------
// telSummary
// -------------------------------------------------------------------
let TelSummary = function() {
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
    this.get = function(type, data) {
        return com[type]
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init(opt_in) {
        if (is_def(com.main_tag)) {
            console.error('trying to init more than once ...', opt_in)
            return
        }

        com.main_tag = opt_in.tag
        com.obs_block_id = ''
        com.tel_ids = []

        // -------------------------------------------------------------------
        // box definition
        // -------------------------------------------------------------------
        com.box = deep_copy(opt_in.box_data)
        com.box.r = Math.min(com.box.w, com.box.h) / 2

        com.g_box = opt_in.g_box.append('g')
        com.g_box.attr(
            'transform',
            'translate('
        + (com.box.x + com.box.w / 2)
        + ','
        + (com.box.y + com.box.h / 2)
        + ')'
        )

        com.style = {
        }
        com.style.outerCircR = com.box.r * 0.8
        com.style.outerArcWidth = com.box.r * (1 - com.style.outerCircR / com.box.r)
        com.style.innerArcR = [
            com.box.r * 0.05,
            com.style.outerCircR - com.style.outerArcWidth * 1.2,
            com.style.outerCircR - com.style.outerArcWidth,
        ]
        com.style.tau_frac = tau / 3
        com.style.tau_space = tau / 50

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let outer_g = com.g_box.append('g')
        let showOuterRec = false

        if (showOuterRec) {
            outer_g
                .selectAll('rect')
                .data([ 0 ])
                .enter()
                .append('rect')
                .attr('x', -com.box.w / 2)
                .attr('y', -com.box.h / 2)
                .attr('width', com.box.w)
                .attr('height', com.box.h)
                .attr('fill-opacity', 0)
                .attr('stroke', '#383b42')
        }

        outer_g
            .selectAll('circle')
            .data([ 0 ])
            .enter()
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', com.box.r)
            .attr('fill', '#F2F2F2')
        // .attr("fill", "#383b42")
            .attr('fill-opacity', 0.7)
    // .attr("stroke",'#383b42')
    }
    this.init = init

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update() {
        let tagArcs = com.main_tag + 'arcs'
        let tag_txt = com.main_tag + 'arcTxt'

        let n_blockTels = com.tel_ids.length
        let hasTels = n_blockTels > 0

        let avgState = 0
        let telStates = {
        }
        let telStateFracs = {
        }
        $.each(TEL_STATES, function(key, val) {
            telStates[val] = 0
            telStateFracs[val] = 0
        })

        $.each(com.tel_ids, function(index, tel_id) {
            avgState += com.inst_health[tel_id]

            let state = get_tel_state(com.inst_health[tel_id])
            telStates[state] += 1
        })
        if (hasTels) {
            avgState /= n_blockTels
            $.each(TEL_STATES, function(key, val) {
                telStateFracs[val] = telStates[val] / n_blockTels
            })
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let arcData = [
            {
                id: tagArcs + 'outer' + '0',
                col: health_col(hasTels, avgState),
                strokeWidth: 0,
                fill_opacity: stateOpac(hasTels, false),
                innerRadius: com.style.outerCircR - com.style.outerArcWidth / 4,
                outerRadius: com.style.outerCircR + com.style.outerArcWidth / 4,
                endAngle: 0,
                startAngle: 0,
                endAngleFinal: tau,
            },
            {
                id: tagArcs + 'outer' + '1',
                col: health_col(hasTels, avgState),
                strokeWidth: 0,
                fill_opacity: stateOpac(hasTels, true),
                innerRadius: com.style.outerCircR - com.style.outerArcWidth / 2,
                outerRadius: com.style.outerCircR + com.style.outerArcWidth / 2,
                endAngle: 0,
                startAngle: 0,
                endAngleFinal: tau * health_frac(hasTels, avgState),
            },
            {
                id: tagArcs + 'nominal' + '0',
                col: stateCol(hasTels, TEL_STATES.NOMINAL),
                strokeWidth: 0,
                fill_opacity: stateOpac(hasTels, false),
                innerRadius: com.style.innerArcR[0],
                outerRadius: com.style.innerArcR[1],
                endAngle: innerArcAngles({
                    index: 0,
                    isEnd: false,
                    isBack: true,
                }),
                startAngle: innerArcAngles({
                    index: 0,
                    isEnd: false,
                    isBack: true,
                }),
                endAngleFinal: innerArcAngles({
                    index: 0,
                    isEnd: hasTels,
                    isBack: true,
                }),
            },
            {
                id: tagArcs + 'nominal' + '1',
                col: stateCol(hasTels, TEL_STATES.NOMINAL),
                strokeWidth: 0,
                fill_opacity: stateOpac(hasTels, true),
                innerRadius: com.style.innerArcR[0],
                outerRadius: com.style.innerArcR[2],
                endAngle: innerArcAngles({
                    index: 0,
                    isEnd: false,
                    isBack: false,
                }),
                startAngle: innerArcAngles({
                    index: 0,
                    isEnd: false,
                    isBack: false,
                }),
                endAngleFinal: innerArcAngles({
                    index: 0,
                    isEnd: hasTels,
                    isBack: false,
                    val: telStateFracs[TEL_STATES.NOMINAL],
                }),
            },
            {
                id: tagArcs + 'warning' + '0',
                col: stateCol(hasTels, TEL_STATES.WARNING),
                strokeWidth: 0,
                fill_opacity: stateOpac(hasTels, false),
                innerRadius: com.style.innerArcR[0],
                outerRadius: com.style.innerArcR[1],
                endAngle: innerArcAngles({
                    index: 1,
                    isEnd: false,
                    isBack: true,
                }),
                startAngle: innerArcAngles({
                    index: 1,
                    isEnd: false,
                    isBack: true,
                }),
                endAngleFinal: innerArcAngles({
                    index: 1,
                    isEnd: hasTels,
                    isBack: true,
                }),
            },
            {
                id: tagArcs + 'warning' + '1',
                col: stateCol(hasTels, TEL_STATES.WARNING),
                strokeWidth: 0,
                fill_opacity: stateOpac(hasTels, true),
                innerRadius: com.style.innerArcR[0],
                outerRadius: com.style.innerArcR[2],
                endAngle: innerArcAngles({
                    index: 1,
                    isEnd: false,
                    isBack: false,
                }),
                startAngle: innerArcAngles({
                    index: 1,
                    isEnd: false,
                    isBack: false,
                }),
                endAngleFinal: innerArcAngles({
                    index: 1,
                    isEnd: hasTels,
                    isBack: false,
                    val: telStateFracs[TEL_STATES.WARNING],
                }),
            },
            {
                id: tagArcs + 'error' + '0',
                col: stateCol(hasTels, TEL_STATES.ERROR),
                strokeWidth: 0,
                fill_opacity: stateOpac(hasTels, false),
                innerRadius: com.style.innerArcR[0],
                outerRadius: com.style.innerArcR[1],
                endAngle: innerArcAngles({
                    index: 2,
                    isEnd: false,
                    isBack: true,
                }),
                startAngle: innerArcAngles({
                    index: 2,
                    isEnd: false,
                    isBack: true,
                }),
                endAngleFinal: innerArcAngles({
                    index: 2,
                    isEnd: hasTels,
                    isBack: true,
                }),
            },
            {
                id: tagArcs + 'error' + '1',
                col: stateCol(hasTels, TEL_STATES.ERROR),
                strokeWidth: 0,
                fill_opacity: stateOpac(hasTels, true),
                innerRadius: com.style.innerArcR[0],
                outerRadius: com.style.innerArcR[2],
                endAngle: innerArcAngles({
                    index: 2,
                    isEnd: false,
                    isBack: false,
                }),
                startAngle: innerArcAngles({
                    index: 2,
                    isEnd: false,
                    isBack: false,
                }),
                endAngleFinal: innerArcAngles({
                    index: 2,
                    isEnd: hasTels,
                    isBack: false,
                    val: telStateFracs[TEL_STATES.ERROR],
                }),
            },
        ]

        if (is_def(com.arcData)) {
            $.each(com.arcData, function(index, data_now) {
                arcData[index].endAngle = data_now.endAngleFinal
            })
        }
        com.arcData = arcData

        let arcs = com.g_box.selectAll('path.' + tagArcs).data(arcData, function(d) {
            return d.id
        })

        arcs
            .enter()
            .append('path')
            .attr('class', tagArcs)
            .style('stroke-opacity', 0.5)
            .attr('fill-opacity', function(d) {
                return d.fill_opacity
            })
            .attr('stroke-width', function(d) {
                return d.strokeWidth
            })
            .attr('fill', function(d, i) {
                return d.col
            })
            .attr('stroke', function(d, i) {
                return d3.rgb(d.col).darker(1.0)
            })
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('d', function(d) {
                return d3.arc()(d)
            })
            .merge(arcs)
            .transition('in_out')
            .duration(times.anim)
            .attr('fill-opacity', function(d) {
                return d.fill_opacity
            })
            .attr('fill', function(d, i) {
                return d.col
            })
            .attr('stroke', function(d, i) {
                return d3.rgb(d.col).darker(1.0)
            })
            .attrTween('d', arc_tween())

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        if (!is_def(com.textData)) {
            let textR = com.style.innerArcR[1] / 1.8
            let textSize = com.style.innerArcR[1] / 2.5
            com.textData = [
                {
                    id: tag_txt + 'nominal',
                    textTag: TEL_STATES.NOMINAL,
                    xy: get_prop_pos_shift({
                        xy: 'xy',
                        r: textR,
                        index: 0,
                    }),
                    size: textSize,
                },
                {
                    id: tag_txt + 'warning',
                    textTag: TEL_STATES.WARNING,
                    xy: get_prop_pos_shift({
                        xy: 'xy',
                        r: textR,
                        index: 1,
                    }),
                    size: textSize,
                },
                {
                    id: tag_txt + 'error',
                    textTag: TEL_STATES.ERROR,
                    xy: get_prop_pos_shift({
                        xy: 'xy',
                        r: textR,
                        index: 2,
                    }),
                    size: textSize,
                },
            ]
        }
        let textData = hasTels ? com.textData : []

        let text = com.g_box.selectAll('text.' + tag_txt).data(textData, function(d) {
            return d.id
        })
        text
            .enter()
            .append('text')
            .attr('class', tag_txt)
            .style('font-weight', 'normal')
            .style('opacity', 0)
            .style('stroke-width', 0)
            .style('fill', '#383b42')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .attr('x', function(d) {
                return d.xy[0]
            })
            .attr('y', function(d) {
                return d.xy[1]
            })
            .attr('dy', function(d) {
                return d.size / 3 + 'px'
            })
            .merge(text)
            .style('font-size', function(d) {
                return d.size + 'px'
            })
            .transition('in_out')
            .duration(times.anim_txt)
            .style('opacity', 1)
        // .tween("text", function(d) {
        //   let this_top       = d3.select(this);
        //   let prevText    = this_top.text();
        //   let interpolate = d3.interpolate(prevText, 0);
        //   return function(t) { this_top.text(formatPercent(interpolate(t))); };
        // })
            .tween('text', function(d) {
                return tweenText(d3.select(this), +telStates[d.textTag])
            })

        text
            .exit()
            .transition('in_out')
            .duration(times.anim_txt)
            .tween('text', function(d) {
                return tweenText(d3.select(this), 0)
            })
            .style('opacity', 0)
            .remove()
    }
    this.update = update

    // -------------------------------------------------------------------
    // helper functions
    // -------------------------------------------------------------------
    function arc_tween() {
        return function(d) {
            let interpolate = d3.interpolate(d.endAngle, d.endAngleFinal)
            return function(t) {
                d.endAngle = interpolate(t)
                return d3.arc()(d)
            }
        }
    }

    let format_int = d3.format('d')
    function tweenText(thisIn, new_val) {
        let prevText = thisIn.text()
        let interpolate = d3.interpolate(prevText, new_val)
        return function(t) {
            thisIn.text(format_int(interpolate(t)))
        }
    }

    function innerArcAngles(opt_in) {
        let angle = opt_in.index * com.style.tau_frac + com.style.tau_space
        if (opt_in.isEnd) {
            return (
                angle
        + (com.style.tau_frac - com.style.tau_space * 2)
          * (opt_in.isBack ? 1 : opt_in.val)
            )
        }
        else {
            return angle
        }
    }

    function get_prop_pos_shift(opt_in) {
        let angle = (opt_in.index + 0.5) * com.style.tau_frac + tau / 4
        let label_x = -1 * opt_in.r * Math.cos(angle)
        let label_y = -1 * opt_in.r * Math.sin(angle)

        if (opt_in.xy === 'x') {
            return label_x
        }
        if (opt_in.xy === 'y') {
            return label_y
        }
        else if (opt_in.xy === 'xy') {
            return [ label_x, label_y ]
        }
        else {
            return null
        }
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function health_col(hasTels, val) {
        if (hasTels) {
            return inst_health_col(val)
        }
        else {
            return '#383b42'
        }
    }

    function stateCol(hasTels, state) {
        if (hasTels) {
            return tel_state_color[state][0]
        }
        else {
            return '#383b42'
        }
    }

    function stateOpac(hasTels, isFront) {
        if (hasTels) {
            return isFront ? 0.7 : 0.3
        }
        else {
            return 0.05
        }
    }

    function health_frac(hasTels, val) {
        if (hasTels) {
            return inst_health_frac(val)
        }
        else {
            return 0
        }
    }
}

// -------------------------------------------------------------------
// telScroll
// -------------------------------------------------------------------
let TelScroll = function() {
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

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init(opt_in) {
        if (is_def(com.main_tag)) {
            console.error('trying to init more than once ...', opt_in)
            return
        }

        // -------------------------------------------------------------------
        // box definition
        // -------------------------------------------------------------------
        com.main_tag = opt_in.tag
        let box_data = opt_in.box_data
        let g_box = opt_in.g_box
        com.obs_block_id = ''
        com.obTelIds = []
        com.tel_ids = []
        com.inst_health = {
        }
        com.recs = {
        }
        com.recs.g_base = g_box.append('g')

        com.scrollGrid = new ScrollGrid({
            id: com.main_tag,
            x0: box_data.x,
            y0: box_data.y,
            w0: box_data.w,
            h0: box_data.h, 
            rec_h: box_data.h * 0.3,
            rec_w: box_data.h * 0.3,
            show_counts: false,
            is_horz: true,
            n_rows: 2,
            recs: com.recs,
            rec_data: [],
            g_box: com.recs.g_base,
            bck_rec_opt: {
                texture_orient: '5/8',
                front_prop: {
                    strk_opac: 0.2,
                },
            },
            vor_opt: {
                click: opt_in.vor_click,
            },
            lockers: opt_in.lockers,
            on_zoom: {
                start: on_zoom_start,
                during: on_zoom_during,
                end: on_zoom_during,
            },
            run_loop: opt_in.run_loop,
            locker: opt_in.locker,
        })

        com.recs.dataG = com.scrollGrid.get_bck_data_g()
    }
    this.init = init

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update() {
        let tag_circ = com.main_tag + 'circ'
        let tag_txt = com.main_tag + 'circTxt'

        let blockTelIds = com.obTelIds.slice(0, com.obTelIds.length)

        blockTelIds.sort(function(a, b) {
            return com.tel_ids.indexOf(a) - com.tel_ids.indexOf(b)
        })

        let rec_data = blockTelIds.map(function(d) {
            return {
                id: d,
            }
        })

        com.scrollGrid.update({
            rec_data: rec_data,
        })

        let dataRec = com.recs[com.main_tag]

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let circ = com.recs.dataG
            .selectAll('circle.' + tag_circ)
            .data(dataRec, function(d) {
                return d.id
            })

        circ
            .enter()
            .append('circle')
            .attr('class', function(d) {
                return tag_circ
            })
            .attr('stroke-width', 0.5)
            .style('stroke-opacity', 0.7)
            .style('fill-opacity', 0.7)
            .style('opacity', 1)
            .attr('cx', function(d) {
                return d.x + d.w / 2
            })
            .attr('cy', function(d) {
                return d.y + d.h / 2
            })
            .attr('r', 0)
            .style('fill', function(d) {
                return inst_health_col(com.inst_health[d.data.id])
            })
            .attr('stroke', function(d, i) {
                return d3.rgb(inst_health_col(com.inst_health[d.data.id])).darker(1.0)
            })
            .attr('vector-effect', 'non-scaling-stroke')
            .merge(circ)
            .transition('in_out')
            .duration(times.anim)
        // .style("opacity", 1)
            .style('fill', function(d) {
                return inst_health_col(com.inst_health[d.data.id])
            })
            .attr('stroke', function(d, i) {
                return d3.rgb(inst_health_col(com.inst_health[d.data.id])).darker(1.0)
            })
            .attr('r', function(d) {
                return d.w / 2
            })
            .attr('cx', function(d) {
                return d.x + d.w / 2
            })
            .attr('cy', function(d) {
                return d.y + d.h / 2
            })

        circ
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .attr('r', function(d) {
                return d.w
            })
            .style('opacity', 0)
            .remove()

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        let text = com.recs.dataG
            .selectAll('text.' + tag_txt)
            .data(dataRec, function(d) {
                return d.id
            })

        text
            .enter()
            .append('text')
            .attr('class', tag_txt)
            .text(function(d, i) {
                return tel_info.get_title(d.data.id)
            })
            .style('font-weight', 'normal')
            .style('opacity', 0)
            .style('fill-opacity', 1)
            .style('fill', '#383b42')
            .style('stroke', '#8B919F')
            .style('stroke-width', 0.3)
            .style('stroke-opacity', 1)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('x', function(d) {
                return d.x + d.w / 2
            })
            .attr('y', function(d) {
                return d.y + d.h / 2
            })
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .merge(text)
            .style('font-size', function(d) {
                d.size = d.w / 3
                return d.size + 'px'
            })
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', 1)
            .attr('x', function(d) {
                return d.x + d.w / 2
            })
            .attr('y', function(d) {
                return d.y + d.h / 2
            })
            .attr('dy', function(d) {
                return d.size / 3 + 'px'
            })

        text
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', 0)
            .remove()
    }
    this.update = update

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let zoom_targets = {
    }
    function on_zoom_start(opt_in) {
        let tag_circ = com.main_tag + 'circ'
        let tag_txt = com.main_tag + 'circTxt'

        zoom_targets.circ = com.recs.dataG.selectAll('circle.' + tag_circ)
        zoom_targets.text = com.recs.dataG.selectAll('text.' + tag_txt)
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function on_zoom_during(opt_in) {
        let xy = opt_in.xy
        let delta = opt_in.wh / 2
        let duration = opt_in.duration

        if (duration <= 0) {
            zoom_targets.circ.attr('c' + xy, function(d, i) {
                return d[xy] + delta
            })
            zoom_targets.text.attr(xy, function(d, i) {
                return d[xy] + delta
            })
        }
        else {
            zoom_targets.circ
                .transition('move')
                .duration(duration)
                .attr('c' + xy, function(d, i) {
                    return d[xy] + delta
                })
            zoom_targets.text
                .transition('move')
                .duration(duration)
                .attr(xy, function(d, i) {
                    return d[xy] + delta
                })
        }
    }
}

// -------------------------------------------------------------------
// obScroll
// -------------------------------------------------------------------
let _obScroll = function() {
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
    this.get = function(type, data) {
        return com[type]
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init(opt_in) {
        if (is_def(com.main_tag)) {
            console.error('trying to init more than once ...', opt_in)
            return
        }

        // -------------------------------------------------------------------
        // box definition
        // -------------------------------------------------------------------
        com.main_tag = opt_in.tag
        let box_data = opt_in.box_data
        let g_box = opt_in.g_box
        com.sched_block_id = ''
        com.obV = []
        com.recs = {
        }
        com.recs.g_base = g_box.append('g')

        com.scrollGrid = new ScrollGrid({
            id: com.main_tag,
            x0: box_data.x,
            y0: box_data.y,
            w0: box_data.w,
            h0: box_data.h,
            rec_h: box_data.h * 0.5,
            rec_w: box_data.h * 0.5,
            show_counts: opt_in.show_counts,
            is_horz: true,
            n_rows: 1,
            recs: com.recs,
            rec_data: [],
            g_box: com.recs.g_base,
            bck_rec_opt: {
                opac: 0.06,
                circ_type: 'lighter',
                size: 10,
                front_prop: {
                    strk_opac: 0.2,
                },
            },
            // bck_rec_opt: { texture_orient: "2/8",  front_prop: { strk_opac: 0.2 } },
            vor_opt: {
                click: opt_in.vor_click,
            },
            lockers: opt_in.lockers,
            on_zoom: {
                start: on_zoom_start,
                during: on_zoom_during,
                end: on_zoom_during,
            },
            run_loop: opt_in.run_loop,
            locker: opt_in.locker,
        })

        com.recs.dataG = com.scrollGrid.get_bck_data_g()

        set_style(opt_in.style)
    }
    this.init = init

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update() {
        let tagRec = com.main_tag + 'rec'
        let tag_txt = com.main_tag + 'circTxt'

        let rec_data = com.obV.map(function(d) {
            return {
                id: d.obs_block_id,
                data: d,
            }
        })

        rec_data.sort(function(a, b) {
            return a.data.metadata.n_obs - b.data.metadata.n_obs
        })

        com.scrollGrid.update({
            rec_data: rec_data,
        })

        let dataRec = com.recs[com.main_tag]

        let rect = com.recs.dataG
            .selectAll('rect.' + tagRec)
            .data(dataRec, function(d) {
                return d.id
            })

        rect
            .enter()
            .append('rect')
            .attr('class', tagRec)
            .attr('stroke', function(d, i) {
                return d3.rgb(com.style.recCol(d, i)).darker(1.0)
            }) // "#383B42"
            .attr('stroke-width', 0.5)
            .style('stroke-opacity', 0.7)
            .style('fill-opacity', 0)
            .style('opacity', 0)
            .attr('x', function(d) {
                return d.x
            })
            .attr('y', function(d) {
                return d.y
            })
            .attr('width', function(d) {
                return d.w
            })
            .attr('height', function(d) {
                return d.h
            })
            .style('fill', com.style.recCol)
            .attr('vector-effect', 'non-scaling-stroke')
            .merge(rect)
            .transition('in_out')
            .duration(times.anim)
            .attr('x', function(d) {
                return d.x
            })
            .attr('y', function(d) {
                return d.y
            })
            .attr('width', function(d) {
                return d.w
            })
            .attr('height', function(d) {
                return d.h
            })
            .style('opacity', 1)
            .style('fill', com.style.recCol)
            .style('fill-opacity', 0.3)

        rect
            .exit()
            .transition('in_out')
            .duration(times.anim / 2)
            .style('opacity', 0)
            .remove()

        let textIn = com.recs.dataG
            .selectAll('text.' + tag_txt)
            .data(dataRec, function(d) {
                return d.id
            })

        textIn
            .enter()
            .append('text')
            .attr('class', tag_txt)
            .text(function(d) {
                return d.data.data.metadata.block_name
            })
            .style('font-weight', 'normal')
            .style('opacity', 0)
            .style('fill-opacity', 0.7)
            .style('fill', '#383b42')
            .style('stroke-width', 0.3)
            .style('stroke-opacity', 1)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .style('stroke', function(d) {
                return '#383b42'
            })
            .attr('x', function(d, i) {
                return d.x + d.w / 2
            })
            .attr('y', function(d, i) {
                return d.y + d.h / 2
            })
            .attr('text-anchor', 'middle')
            .merge(textIn)
            .each(function(d, i) {
                d.size = d.w / 4
            })
            .style('font-size', function(d) {
                return d.size + 'px'
            })
            .attr('dy', function(d) {
                return d.size / 3 + 'px'
            })
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', 1)
            .attr('x', function(d) {
                return d.x + d.w / 2
            })
            .attr('y', function(d) {
                return d.y + d.h / 2
            })

        textIn
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', 0)
            .remove()
    }
    this.update = update

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let zoom_targets = {
    }
    function on_zoom_start(opt_in) {
        let tagRec = com.main_tag + 'rec'
        let tag_txt = com.main_tag + 'circTxt'

        zoom_targets.rect = com.recs.dataG.selectAll('rect.' + tagRec)
        zoom_targets.text = com.recs.dataG.selectAll('text.' + tag_txt)
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function on_zoom_during(opt_in) {
        let xy = opt_in.xy
        let delta = opt_in.wh / 2
        let duration = opt_in.duration

        if (duration <= 0) {
            zoom_targets.rect.attr(xy, function(d, i) {
                return d[xy]
            })
            zoom_targets.text.attr(xy, function(d, i) {
                return d[xy] + delta
            })
        }
        else {
            zoom_targets.rect
                .transition('move')
                .duration(duration)
                .attr(xy, function(d, i) {
                    return d[xy]
                })
            zoom_targets.text
                .transition('move')
                .duration(duration)
                .attr(xy, function(d, i) {
                    return d[xy] + delta
                })
        }
    }

    // -------------------------------------------------------------------
    // styling
    // -------------------------------------------------------------------
    function set_style(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        com.style = {
        }

        com.style.recCol = opt_in.recCol
        if (!is_def(com.style.recCol)) {
            com.style.recCol = function(d, i) {
                return cols_blocks[d.data.data.metadata.n_obs % cols_blocks.length]
            }
        }
    }
}

// -------------------------------------------------------------------
//
// -------------------------------------------------------------------
let obs_block_control_utils = function() {
    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function getFocusBlock(opt_in) {
        let blocks = opt_in.blocks
        let focusBlock = {
            obs_block_id: null,
            type: null,
            index: null,
            ob: {
            },
            sb: {
                sched_block_id: null,
                obV: [],
            },
        }

        // get the block with the requested id
        if (is_def(blocks)) {
            $.each(blocks, function(type_now, data_now0) {
                if (is_def(focusBlock.type)) {
                    return
                }
                $.each(data_now0, function(index1, data_now1) {
                    if (opt_in.focus_id === data_now1.obs_block_id) {
                        focusBlock.sb.sched_block_id = data_now1.sched_block_id
                        focusBlock.obs_block_id = data_now1.obs_block_id
                        focusBlock.type = type_now
                        focusBlock.index = index1
                        focusBlock.ob = data_now1
                    }
                })
            })
        }

        // get all blocks which belong to the same sb as the requested block
        if (is_def(focusBlock.sb.sched_block_id)) {
            $.each(blocks, function(type_now, data_now0) {
                $.each(data_now0, function(index1, data_now1) {
                    if (focusBlock.sb.sched_block_id === data_now1.sched_block_id) {
                        focusBlock.sb.obV.push(data_now1)
                    }
                })
            })
        }

        // return is_def(focusBlock.block) ? focusBlock.block : {};
        return focusBlock
    }
    this.getFocusBlock = getFocusBlock
}
